/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { useRecitationStore } from "../store/recitationStore";

interface WindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

// Global state trackers across re-renders
let globalStream: MediaStream | null = null;
let globalRecorder: MediaRecorder | null = null;
let globalUseWhisper = true;
let isRecognitionRunning = false;

export function getRecognitionRunning() {
  return isRecognitionRunning;
}

export function setRecognitionRunning(val: boolean) {
  isRecognitionRunning = val;
}

export function pauseASRForAudio(durationMs?: number) {
  useRecitationStore.getState().setAudioPlaying(true);
  if (durationMs && durationMs > 0) {
    setTimeout(() => {
      useRecitationStore.getState().setAudioPlaying(false);
    }, durationMs + 300);
  }
}

export function resumeASRFromAudio() {
  useRecitationStore.getState().setAudioPlaying(false);
}

export function useContinuousASR(isListening: boolean) {
  const processSpeech = useRecitationStore((state) => state.processSpeech);
  const setLiveTranscript = useRecitationStore((state) => state.setLiveTranscript);
  const addFeedback = useRecitationStore((state) => state.addFeedback);

  const [browserSupport, setBrowserSupport] = useState<boolean>(true);
  const [useWhisper, setUseWhisper] = useState<boolean>(true);

  const activeRef = useRef<boolean>(isListening);
  const recognitionRef = useRef<any>(null);
  const processSpeechRef = useRef(processSpeech);
  const setLiveTranscriptRef = useRef(setLiveTranscript);
  const addFeedbackRef = useRef(addFeedback);

  useEffect(() => {
    activeRef.current = isListening;
    processSpeechRef.current = processSpeech;
    setLiveTranscriptRef.current = setLiveTranscript;
    addFeedbackRef.current = addFeedback;
  });

  useEffect(() => {
    let localStream: MediaStream | null = null;
    let localRecorder: MediaRecorder | null = null;
    let checkInterval: ReturnType<typeof setInterval> | null = null;
    let audioContext: AudioContext | null = null;
    let vadAnalyser: AnalyserNode | null = null;
    let vadDataArray: Uint8Array | null = null;

    // FIX 1: Exact Silence Detection Timings with High Sensitivity
    const SILENCE_THRESHOLD = 0.0025; // Highly responsive RMS energy threshold
    const END_OF_SPEECH_MS = 2200; // Natural pause completion - user finished utterance
    const MAX_UTTERANCE_MS = 14000; // Safety cap for complete multi-verse utterances

    let silenceStartTime: number | null = null;
    let utteranceStartTime: number = Date.now();
    let speechDetectedInUtterance = false;
    let chunks: Blob[] = [];
    let isProcessingUtterance = false;

    async function startContinuousASR() {
      if (!activeRef.current) return;

      // 1. Primary: Groq Whisper Engine with RMS-based Voice Activity Detection
      if (globalUseWhisper) {
        try {
          console.log("[ContinuousASR] Initializing High-Precision Continuous Stream...");
          localStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: false,
              autoGainControl: true,
              channelCount: 1,
              sampleRate: 16000,
            },
          });
          globalStream = localStream;

          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioContext = new AudioContextClass();
          if (audioContext.state === "suspended") {
            await audioContext.resume();
          }

          vadAnalyser = audioContext.createAnalyser();
          vadAnalyser.fftSize = 256;
          vadDataArray = new Uint8Array(vadAnalyser.frequencyBinCount);

          const source = audioContext.createMediaStreamSource(localStream);
          const gainNode = audioContext.createGain();
          gainNode.gain.setValueAtTime(4.0, audioContext.currentTime); // 4x gain for reliable Arabic voice pickup
          source.connect(gainNode);
          gainNode.connect(vadAnalyser);

          let mimeType = "audio/webm;codecs=opus";
          if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "audio/webm";
          if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "";

          const recorder = new MediaRecorder(localStream, mimeType ? { mimeType } : {});
          localRecorder = recorder;
          globalRecorder = recorder;
          setRecognitionRunning(true);

          chunks = [];
          utteranceStartTime = Date.now();
          silenceStartTime = null;
          speechDetectedInUtterance = false;
          isProcessingUtterance = false;

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              chunks.push(e.data);
            }
          };

          const finishUtteranceAndSend = async () => {
            if (isProcessingUtterance || chunks.length === 0 || !activeRef.current) return;
            isProcessingUtterance = true;

            const audioBlob = new Blob(chunks, { type: mimeType || "audio/webm" });
            chunks = [];
            utteranceStartTime = Date.now();
            silenceStartTime = null;
            const hadSpeech = speechDetectedInUtterance;
            speechDetectedInUtterance = false;

            // If utterance was totally silent or tiny, skip without advancing
            if (!hadSpeech || audioBlob.size < 600) {
              console.log("[ContinuousASR] Skipping silent background buffer:", audioBlob.size, "bytes");
              isProcessingUtterance = false;
              return;
            }

            const isPlaying = useRecitationStore.getState().isAudioPlaying;
            if (!isPlaying && activeRef.current) {
              try {
                console.log("[ContinuousASR] Transmitting complete utterance to Groq:", audioBlob.size, "bytes");
                const currentWordIndex = useRecitationStore.getState().wordIndex;
                const wordsList = useRecitationStore.getState().allWords;
                
                // Use FULL Ayah text as Whisper prompt for highest accuracy
                const promptText = wordsList[currentWordIndex]?.ayahData.words.join(" ") || wordsList[currentWordIndex]?.ayahData.arabic || "بسم الله الرحمن الرحيم";

                const formData = new FormData();
                formData.append("audio", audioBlob);
                formData.append("prompt", promptText);

                const res = await fetch("/api/transcribe", {
                  method: "POST",
                  body: formData,
                });

                if (res.ok && activeRef.current && !useRecitationStore.getState().isAudioPlaying) {
                  const data = await res.json();
                  console.log("[ContinuousASR] Groq response:", data);

                  // FIX 3: Background noise / no speech handler
                  if (data.decision === "no_speech" || !data.transcript || !data.success) {
                    console.log("[ContinuousASR] No speech detected or background noise — holding position");
                    setLiveTranscriptRef.current("… (Listening...)");
                  } else {
                    const transcriptText = data.transcript.trim();
                    const hasArabic = /[\u0600-\u06FF]/.test(transcriptText);
                    if (hasArabic) {
                      setLiveTranscriptRef.current(transcriptText);
                      const words = transcriptText.split(/\s+/).filter(Boolean);
                      processSpeechRef.current(words);
                    }
                  }
                }
              } catch (err) {
                console.warn("[ContinuousASR] Whisper request failed; fallback to web speech:", err);
                setUseWhisper(false);
                globalUseWhisper = false;
              }
            }
            isProcessingUtterance = false;
          };

          recorder.start(100);

          // Real-time RMS-based Voice Activity Detection loop (Runs every 60ms)
          checkInterval = setInterval(() => {
            if (!activeRef.current || !vadAnalyser || !vadDataArray || !localRecorder) return;

            vadAnalyser.getByteTimeDomainData(vadDataArray as unknown as Uint8Array<ArrayBuffer>);
            let sum = 0;
            for (let i = 0; i < vadDataArray.length; i++) {
              const val = (vadDataArray[i] - 128) / 128;
              sum += val * val;
            }
            const rms = Math.sqrt(sum / vadDataArray.length);

            const elapsed = Date.now() - utteranceStartTime;

            if (rms < SILENCE_THRESHOLD) {
              if (speechDetectedInUtterance) {
                silenceStartTime = silenceStartTime || Date.now();
                const silenceDuration = Date.now() - silenceStartTime;

                // Stop & process ONLY after END_OF_SPEECH_MS of true silence following speech
                if (silenceDuration >= END_OF_SPEECH_MS || elapsed >= MAX_UTTERANCE_MS) {
                  finishUtteranceAndSend();
                }
                // (Natural pauses < END_OF_SPEECH_MS are preserved seamlessly)
              } else {
                // Background silence before user starts speaking: clear small buffers
                if (elapsed > 4000) {
                  chunks = [];
                  utteranceStartTime = Date.now();
                }
              }
            } else {
              // Voice energy detected!
              speechDetectedInUtterance = true;
              silenceStartTime = null; // Reset silence tracker during natural speech
            }
          }, 60);

        } catch (err) {
          console.warn("[ContinuousASR] Failed to initialize MediaRecorder; fallback to Web Speech:", err);
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
              } catch {}
            }, 300);
          }
        };

        rec.onend = () => {
          setRecognitionRunning(false);
          onASRRestart();
        };

        rec.onerror = (e: any) => {
          if (e.error !== "no-speech") {
            console.warn("Continuous Web Speech error:", e.error);
          }
        };

        try {
          rec.start();
          setRecognitionRunning(true);
          recognitionRef.current = rec;
        } catch (e) {
          console.warn("Could not start Web Speech Recognition:", e);
        }
      }
    }

    if (isListening) {
      startContinuousASR();
    } else {
      setRecognitionRunning(false);
      if (checkInterval) clearInterval(checkInterval);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
    }

    return () => {
      setRecognitionRunning(false);
      if (checkInterval) clearInterval(checkInterval);
      if (localStream) (localStream as MediaStream).getTracks().forEach((t) => t.stop());
      if (globalStream) {
        globalStream.getTracks().forEach((t) => t.stop());
        globalStream = null;
      }
      if (localRecorder && (localRecorder as MediaRecorder).state === "recording") {
        try { (localRecorder as MediaRecorder).stop(); } catch {}
      }
      if (globalRecorder && globalRecorder.state === "recording") {
        try { globalRecorder.stop(); } catch {}
        globalRecorder = null;
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, [isListening, useWhisper]);

  return { useWhisper, setUseWhisper, browserSupport };
}
