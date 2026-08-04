/* eslint-disable @typescript-eslint/no-explicit-any */
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

  if (globalUseWhisper) {
    if (globalRecorder && globalRecorder.state === "recording") {
      try {
        globalRecorder.pause();
        setRecognitionRunning(false);
        console.log(`ASR MediaRecorder paused for audio playback of ${finalDuration}ms`);
      } catch (e) {
        console.warn("Failed to pause MediaRecorder in pauseASRForAudio:", e);
      }
    }
    setTimeout(() => {
      if (globalIsListening && globalRecorder && globalRecorder.state === "paused") {
        try {
          globalRecorder.resume();
          setRecognitionRunning(true);
          console.log("ASR MediaRecorder resumed after audio playback and echo settling");
        } catch (e) {
          console.warn("Failed to resume MediaRecorder in pauseASRForAudio:", e);
        }
      }
    }, finalDuration + 600);
  } else {
    // Native SpeechRecognition pause routine
    if (globalRecognition && getRecognitionRunning()) {
      try {
        globalRecognition.stop();
        setRecognitionRunning(false);
        console.log(`ASR native engine stopped for audio playback of ${finalDuration}ms`);
      } catch (e) {
        console.warn("Failed to stop native SpeechRecognition in pauseASRForAudio:", e);
      }
    }
    setTimeout(() => {
      if (globalIsListening && globalRecognition && !getRecognitionRunning()) {
        try {
          globalRecognition.start();
          setRecognitionRunning(true);
          console.log("ASR native engine restarted after audio playback and echo settling");
        } catch (e) {
          console.warn("Failed to restart native SpeechRecognition in pauseASRForAudio:", e);
        }
      }
    }, finalDuration + 600);
  }
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

          let chunks: Blob[] = [];

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              chunks.push(e.data);
            }
          };

          recorder.onstop = async () => {
            const audioBlob = new Blob(chunks, { type: "audio/webm" });
            chunks = [];

            const playing = useRecitationStore.getState().isAudioPlaying;
            if (audioBlob.size > 0 && activeRef.current && !playing && globalUseWhisper) {
              try {
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
                    setLiveTranscriptRef.current(transcriptText);
                    const words = transcriptText.split(/\s+/).filter(Boolean);
                    processSpeechRef.current(words);
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
