/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { useRecitationStore } from "../store/recitationStore";
import { getSupportedMimeType } from "./recorder";

interface WindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

// Global state trackers across re-renders
let globalStream: MediaStream | null = null;
let globalRecorder: MediaRecorder | null = null;
let isRecognitionRunning = false;
let pauseTimeout: NodeJS.Timeout | null = null;

export function getRecognitionRunning() {
  return isRecognitionRunning;
}

export function setRecognitionRunning(val: boolean) {
  isRecognitionRunning = val;
}

export function pauseASRForAudio(durationMs?: number) {
  if (pauseTimeout) {
    clearTimeout(pauseTimeout);
    pauseTimeout = null;
  }
  useRecitationStore.getState().setAudioPlaying(true);
  if (durationMs && durationMs > 0) {
    pauseTimeout = setTimeout(() => {
      useRecitationStore.getState().setAudioPlaying(false);
    }, durationMs + 400);
  }
}

export function resumeASRFromAudio() {
  if (pauseTimeout) {
    clearTimeout(pauseTimeout);
    pauseTimeout = null;
  }
  useRecitationStore.getState().setAudioPlaying(false);
}

export function useContinuousASR(isListening: boolean) {
  const processSpeech = useRecitationStore((state) => state.processSpeech);
  const setLiveTranscript = useRecitationStore((state) => state.setLiveTranscript);

  const [browserSupport, setBrowserSupport] = useState<boolean>(true);

  const activeRef = useRef<boolean>(isListening);
  const recognitionRef = useRef<any>(null);
  const processSpeechRef = useRef(processSpeech);
  const setLiveTranscriptRef = useRef(setLiveTranscript);

  useEffect(() => {
    activeRef.current = isListening;
    processSpeechRef.current = processSpeech;
    setLiveTranscriptRef.current = setLiveTranscript;
  });

  useEffect(() => {
    let localStream: MediaStream | null = null;
    let localRecorder: MediaRecorder | null = null;
    let checkInterval: ReturnType<typeof setInterval> | null = null;
    let audioContext: AudioContext | null = null;
    let vadAnalyser: AnalyserNode | null = null;
    let vadDataArray: Uint8Array | null = null;

    const isMobile = typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const SILENCE_THRESHOLD = isMobile ? 0.0016 : 0.0020;
    const END_OF_SPEECH_MS = 250;
    const MAX_CHUNK_MS = 4000;

    let silenceStartTime: number | null = null;
    let utteranceStartTime: number = Date.now();
    let speechDetectedInUtterance = false;
    let currentChunks: Blob[] = [];
    let isProcessingUtterance = false;
    let mimeType = "audio/webm;codecs=opus";

    // 1. Web Speech live interim text display (DISPLAY ONLY - does not advance pointer blindly)
    const win = typeof window !== "undefined" ? (window as WindowWithSpeech) : null;
    const SpeechRecognitionClass = win?.SpeechRecognition || win?.webkitSpeechRecognition;

    const startWebSpeechLive = () => {
      if (!SpeechRecognitionClass || !activeRef.current) return;

      try {
        const rec = new SpeechRecognitionClass();
        rec.lang = "ar-SA";
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 3;

        rec.onresult = (event: any) => {
          if (useRecitationStore.getState().isAudioPlaying || !activeRef.current) return;

          let interim = "";
          let latestFinal = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const resultList = event.results[i];
            const text = resultList[0]?.transcript?.trim();
            if (resultList.isFinal) {
              if (text) latestFinal = text;
            } else {
              if (text) interim = text;
            }
          }

          const display = latestFinal || interim;
          if (display && display.trim().length > 0) {
            setLiveTranscriptRef.current(display);
          }
        };

        rec.onend = () => {
          if (activeRef.current && isRecognitionRunning) {
            setTimeout(() => {
              if (activeRef.current && isRecognitionRunning && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch {}
              }
            }, 250);
          }
        };

        rec.onerror = (e: any) => {
          if (e.error !== "no-speech" && e.error !== "aborted") {
            console.warn("[ContinuousASR] Web Speech info:", e.error);
          }
        };

        rec.start();
        recognitionRef.current = rec;
      } catch (e) {
        console.warn("[ContinuousASR] Web Speech not initialized:", e);
      }
    };

    // 2. High-Accuracy Whisper ASR Engine
    async function startContinuousASR() {
      if (!activeRef.current) return;
      setRecognitionRunning(true);

      startWebSpeechLive();

      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: false,
            autoGainControl: true,
            channelCount: 1,
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
        gainNode.gain.setValueAtTime(isMobile ? 3.5 : 2.0, audioContext.currentTime);
        source.connect(gainNode);
        gainNode.connect(vadAnalyser);

        mimeType = getSupportedMimeType();

        const startNewRecorderCycle = () => {
          if (!localStream || !activeRef.current) return null;

          currentChunks = [];
          utteranceStartTime = Date.now();
          silenceStartTime = null;
          speechDetectedInUtterance = false;

          const rec = new MediaRecorder(localStream, mimeType ? { mimeType } : {});
          rec.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              currentChunks.push(e.data);
            }
          };
          rec.start();
          localRecorder = rec;
          globalRecorder = rec;
          return rec;
        };

        startNewRecorderCycle();

        const finishUtteranceAndSend = async () => {
          if (isProcessingUtterance || !localRecorder || !activeRef.current) return;
          isProcessingUtterance = true;

          const hadSpeech = speechDetectedInUtterance;
          const recorderToStop = localRecorder;

          const finalizeBlobPromise = new Promise<Blob | null>((resolve) => {
            recorderToStop.onstop = () => {
              if (currentChunks.length > 0) {
                const completeBlob = new Blob(currentChunks, { type: mimeType || "audio/webm" });
                resolve(completeBlob);
              } else {
                resolve(null);
              }
            };
            try {
              if (recorderToStop.state === "recording") {
                recorderToStop.stop();
              } else {
                resolve(null);
              }
            } catch {
              resolve(null);
            }
          });

          startNewRecorderCycle();

          const audioBlob = await finalizeBlobPromise;

          if (!hadSpeech || !audioBlob || audioBlob.size < 1200) {
            isProcessingUtterance = false;
            return;
          }

          const isPlaying = useRecitationStore.getState().isAudioPlaying;
          if (!isPlaying && activeRef.current) {
            try {
              const currentWordIndex = useRecitationStore.getState().wordIndex;
              const wordsList = useRecitationStore.getState().allWords;

              const promptText =
                wordsList[currentWordIndex]?.ayahData?.words?.join(" ") ||
                wordsList[currentWordIndex]?.ayahData?.arabic ||
                "بسم الله الرحمن الرحيم";

              const formData = new FormData();
              formData.append("audio", audioBlob);
              formData.append("prompt", promptText);

              const res = await fetch("/api/transcribe", {
                method: "POST",
                body: formData,
              });

              if (res.ok && activeRef.current && !useRecitationStore.getState().isAudioPlaying) {
                const data = await res.json();
                if (data.success && data.transcript) {
                  const transcriptText = data.transcript.trim();
                  console.log("[ContinuousASR] Verified Groq transcript:", transcriptText);
                  
                  // Update LiveTranscript view
                  setLiveTranscriptRef.current(transcriptText);

                  // Process and strictly advance words sequentially
                  processSpeechRef.current([transcriptText]);
                }
              }
            } catch (err) {
              console.warn("[ContinuousASR] Transcribe request failed:", err);
            }
          }
          isProcessingUtterance = false;
        };

        // Real-time voice energy loop (Runs every 50ms)
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

              if (silenceDuration >= END_OF_SPEECH_MS || elapsed >= MAX_CHUNK_MS) {
                finishUtteranceAndSend();
              }
            } else {
              if (elapsed > 4000 && !isProcessingUtterance) {
                startNewRecorderCycle();
              }
            }
          } else {
            speechDetectedInUtterance = true;
            silenceStartTime = null;
          }
        }, 50);
      } catch (err) {
        console.warn("[ContinuousASR] Audio init warning:", err);
        setBrowserSupport(true);
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
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close().catch(() => {});
      }
    };
  }, [isListening]);

  return {
    isListening,
    browserSupport,
  };
}
