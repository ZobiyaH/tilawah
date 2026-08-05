/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useRecitationStore } from "../store/recitationStore";
import { registerRecognition, unregisterRecognition, getRecognitionRunning, setRecognitionRunning } from "./audioRegistry";

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type WindowWithSpeech = typeof window & {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
};

// Keep global variables to allow pausing recorder/ASR during audio playbacks from anywhere
let globalRecorder: MediaRecorder | null = null;
let globalRecognition: any = null;
let globalIsListening = false;
let globalUseWhisper = true; // Auto-fallback toggler on connection failures

export function pauseASRForAudio(durationMs: number) {
  const finalDuration = !isNaN(durationMs) && durationMs > 0 ? durationMs : 2500;

  useRecitationStore.getState().setAudioPlaying(true);
  setRecognitionRunning(false);
  console.log(`ASR suspended for audio playback of ${finalDuration}ms`);

  setTimeout(() => {
    useRecitationStore.getState().setAudioPlaying(false);
    setRecognitionRunning(true);
    console.log("ASR resumed after audio playback and echo settling");
  }, finalDuration + 600);
}

/**
 * Custom hook managing STT. Attempts Whisper backend and falls back to Web Speech on refusal.
 */
export function useContinuousASR(isListening: boolean) {
  const [browserSupport, setBrowserSupport] = useState(true);
  const [useWhisper, setUseWhisper] = useState(globalUseWhisper);

  const processSpeech = useRecitationStore((state) => state.processSpeech);
  const setLiveTranscript = useRecitationStore((state) => state.setLiveTranscript);

  const activeRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const processSpeechRef = useRef(processSpeech);
  const setLiveTranscriptRef = useRef(setLiveTranscript);

  // Sync refs so callbacks stay up to date without triggering useEffect re-runs
  useEffect(() => {
    processSpeechRef.current = processSpeech;
    setLiveTranscriptRef.current = setLiveTranscript;
  }, [processSpeech, setLiveTranscript]);

  // Perform an immediate health check on mount to detect if the Whisper server is offline.
  // This shifts to native ASR fallback instantly without waiting for a 2.5s chunk failure.
  useEffect(() => {
    async function checkBackend() {
      try {
        const res = await fetch("/api/transcribe");
        const data = await res.json().catch(() => null);
        if (res.status === 503 || (data && data.fallback)) {
          setUseWhisper(false);
          globalUseWhisper = false;
        }
      } catch {
        setUseWhisper(false);
        globalUseWhisper = false;
      }
    }
    if (globalUseWhisper) {
      checkBackend();
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    activeRef.current = isListening;
    globalIsListening = isListening;

    if (!isListening) {
      if (globalRecorder) {
        try {
          if (globalRecorder.state !== "inactive") {
            globalRecorder.stop();
          }
        } catch {}
        globalRecorder = null;
      }
      if (recognitionRef.current) {
        unregisterRecognition();
        recognitionRef.current.onend = null;
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
      globalRecognition = null;
      setRecognitionRunning(false);
      return;
    }

    let localRecorder: MediaRecorder | null = null;
    let localStream: MediaStream | null = null;
    let sliceInterval: NodeJS.Timeout | null = null;

    async function startASR() {
      // 1. Whisper Backend Mode
      if (useWhisper) {
        if (!window.MediaRecorder) {
          console.warn("MediaRecorder unsupported; falling back to browser Web Speech API");
          setUseWhisper(false);
          globalUseWhisper = false;
          return;
        }

        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            audio: true
          });

          if (!activeRef.current) {
            localStream.getTracks().forEach((track) => track.stop());
            return;
          }

          const recorder = new MediaRecorder(localStream, { mimeType: "audio/webm" });
          localRecorder = recorder;
          globalRecorder = recorder;
          setRecognitionRunning(true);

          // VAD: Track peak RMS during the recording window by polling every 100ms
          // This correctly detects speech that happened anywhere in the 2.5s window
          let vadAnalyser: AnalyserNode | null = null;
          let vadDataArray: Uint8Array<ArrayBuffer> | null = null;
          let vadPeakRMS = 0;
          let vadPollInterval: ReturnType<typeof setInterval> | null = null;
          try {
            const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
            const vadCtx = new AudioCtxClass();
            vadAnalyser = vadCtx.createAnalyser();
            vadAnalyser.fftSize = 256;
            vadDataArray = new Uint8Array(vadAnalyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
            const vadSource = vadCtx.createMediaStreamSource(localStream);
            
            // Add a 3x gain boost to VAD analyzer so quiet voices are reliably detected
            const gainNode = vadCtx.createGain();
            gainNode.gain.setValueAtTime(3.0, vadCtx.currentTime);
            vadSource.connect(gainNode);
            gainNode.connect(vadAnalyser);

            if (vadCtx.state === "suspended") {
              await vadCtx.resume();
            }
            // Poll RMS every 100ms, track the peak across the full recording window
            vadPollInterval = setInterval(() => {
              if (!vadAnalyser || !vadDataArray) return;
              vadAnalyser.getByteTimeDomainData(vadDataArray);
              let sum = 0;
              for (let i = 0; i < vadDataArray.length; i++) {
                const val = (vadDataArray[i] - 128) / 128;
                sum += val * val;
              }
              const rms = Math.sqrt(sum / vadDataArray.length);
              if (rms > vadPeakRMS) vadPeakRMS = rms;
            }, 100);
          } catch (e) {
            console.warn("VAD analyser init failed:", e);
          }

          let chunks: Blob[] = [];

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              chunks.push(e.data);
            }
          };

          recorder.onstop = async () => {
            // Stop polling and snapshot the peak RMS for this window
            if (vadPollInterval) { clearInterval(vadPollInterval); vadPollInterval = null; }
            const peakRMS = vadPeakRMS;
            vadPeakRMS = 0; // reset for next window

            const audioBlob = new Blob(chunks, { type: "audio/webm" });
            chunks = [];

            // VAD: skip if no speech was detected during the entire recording window
            // Threshold set to 0.003 (with 3x gain boost) to catch quiet mic signals
            const VAD_THRESHOLD = 0.003;
            if (peakRMS < VAD_THRESHOLD) {
              console.log("VAD: skipping silent chunk (peak RMS:", peakRMS.toFixed(4), ")");
              if (activeRef.current && localRecorder && localRecorder.state === "inactive" && globalUseWhisper) {
                // Restart VAD polling for the next window
                vadPollInterval = vadAnalyser ? setInterval(() => {
                  if (!vadAnalyser || !vadDataArray) return;
                  vadAnalyser.getByteTimeDomainData(vadDataArray as Uint8Array<ArrayBuffer>);
                  let sum = 0;
                  for (let i = 0; i < (vadDataArray as Uint8Array<ArrayBuffer>).length; i++) {
                    const val = ((vadDataArray as Uint8Array<ArrayBuffer>)[i] - 128) / 128;
                    sum += val * val;
                  }
                  const rms = Math.sqrt(sum / (vadDataArray as Uint8Array<ArrayBuffer>).length);
                  if (rms > vadPeakRMS) vadPeakRMS = rms;
                }, 100) : null;
                try { localRecorder.start(); } catch {}
              }
              return;
            }

            const playing = useRecitationStore.getState().isAudioPlaying;
            if (audioBlob.size >= 3000 && activeRef.current && !playing && globalUseWhisper) {
              try {
                console.log("[ContinuousASR] Sending chunk size:", audioBlob.size, "bytes to Groq");
                const currentWordIndex = useRecitationStore.getState().wordIndex;
                const wordsList = useRecitationStore.getState().allWords;
                const promptText = wordsList[currentWordIndex]?.ayahData.arabic || "";

                const formData = new FormData();
                formData.append("audio", audioBlob);
                formData.append("prompt", promptText || "تلاوة القرآن الكريم");

                const res = await fetch("/api/transcribe", {
                  method: "POST",
                  body: formData,
                });

                if (!res.ok) {
                  throw new Error(`Whisper backend proxy responded with status ${res.status}`);
                }

                if (activeRef.current && !useRecitationStore.getState().isAudioPlaying) {
                  const data = await res.json();
                  if (data.fallback) {
                    throw new Error("Whisper backend reported offline fallback status");
                  }
                  if (data.transcript) {
                    const transcriptText = data.transcript.trim();
                    const hasArabic = /[\u0600-\u06FF]/.test(transcriptText);
                    console.log("[ContinuousASR] Groq returned:", transcriptText, "| Has Arabic:", hasArabic);
                    if (hasArabic) {
                      setLiveTranscriptRef.current(transcriptText);
                      const words = transcriptText.split(/\s+/).filter(Boolean);
                      processSpeechRef.current(words);
                    }
                  }
                }
              } catch (err) {
                console.warn("FastAPI Whisper server offline. Gracefully falling back to browser Web Speech API:", err);
                setUseWhisper(false);
                globalUseWhisper = false;
              }
            }

            // Restart chunk recording
            if (activeRef.current && localRecorder && localRecorder.state === "inactive" && globalUseWhisper) {
              try {
                localRecorder.start();
              } catch {}
            }
          };

          recorder.start();

          sliceInterval = setInterval(() => {
            if (activeRef.current && recorder.state === "recording") {
              recorder.stop();
            }
          }, 2500);

        } catch (err) {
          console.warn("Failed to start MediaRecorder; falling back to Web Speech:", err);
          setUseWhisper(false);
          globalUseWhisper = false;
        }
      }
      // 2. Browser Web Speech fallback mode
      else {
        const win = window as WindowWithSpeech;
        const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

        if (!SpeechRecognition) {
          setBrowserSupport(false);
          return;
        }

        const rec = new SpeechRecognition();
        rec.lang = "ar-SA";
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 5;

        rec.onresult = (event: any) => {
          if (useRecitationStore.getState().isAudioPlaying) return;

          let interim = "";
          let finalAlternatives: string[] = [];

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const resultList = event.results[i];
            if (resultList.isFinal) {
              const alts: string[] = [];
              for (let k = 0; k < Math.min(resultList.length, 5); k++) {
                alts.push(resultList[k].transcript.trim());
              }
              finalAlternatives = alts;
            } else {
              interim = resultList[0].transcript;
            }
          }

          const display = finalAlternatives[0] || interim;
          if (display) {
            setLiveTranscriptRef.current(display);
          }

          if (finalAlternatives.length > 0) {
            processSpeechRef.current(finalAlternatives);
          }
        };

        const onASRRestart = () => {
          if (useRecitationStore.getState().isListening && recognitionRef.current && !globalUseWhisper) {
            setTimeout(() => {
              try {
                if (useRecitationStore.getState().isListening && !getRecognitionRunning() && !globalUseWhisper && recognitionRef.current) {
                  recognitionRef.current.start();
                  setRecognitionRunning(true);
                }
              } catch (err) {
                console.warn("Web Speech restart failed, scheduling retry:", err);
                onASRRestart();
              }
            }, 200);
          }
        };

        rec.onstart = () => {
          setRecognitionRunning(true);
        };

        rec.onerror = (e: any) => {
          console.warn("SpeechRecognition error occurred:", e.error);
        };

        rec.onend = () => {
          setRecognitionRunning(false);
          onASRRestart();
        };

        registerRecognition(rec, onASRRestart);
        recognitionRef.current = rec;
        globalRecognition = rec;

        try {
          rec.start();
          setRecognitionRunning(true);
        } catch (err) {
          console.error("Failed to start native Web Speech:", err);
        }
      }
    }

    startASR();

    return () => {
      activeRef.current = false;
      globalIsListening = false;
      globalRecorder = null;
      globalRecognition = null;
      setRecognitionRunning(false);

      if (sliceInterval) {
        clearInterval(sliceInterval);
      }
      if (localRecorder && localRecorder.state !== "inactive") {
        try {
          localRecorder.stop();
        } catch {}
      }
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (recognitionRef.current) {
        unregisterRecognition();
        recognitionRef.current.onend = null;
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, [isListening, useWhisper]);

  return { browserSupport };
}
