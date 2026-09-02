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

    // Silence detection & utterance timings
    const SILENCE_THRESHOLD = 0.0025; // Highly responsive RMS energy threshold
    const END_OF_SPEECH_MS = 2000; // Natural pause completion - user finished utterance
    const MAX_UTTERANCE_MS = 14000; // Safety cap for complete multi-verse utterances

    let silenceStartTime: number | null = null;
    let utteranceStartTime: number = Date.now();
    let speechDetectedInUtterance = false;
    let currentChunks: Blob[] = [];
    let isProcessingUtterance = false;
    let mimeType = "audio/webm;codecs=opus";

    // 1. Dual Real-time Web Speech Recognition Stream (for instantaneous visual live feedback & rapid matching)
    const win = typeof window !== "undefined" ? (window as WindowWithSpeech) : null;
    const SpeechRecognitionClass = win?.SpeechRecognition || win?.webkitSpeechRecognition;

    const startWebSpeechLive = () => {
      if (!SpeechRecognitionClass || !activeRef.current) return;

      try {
        const rec = new SpeechRecognitionClass();
        rec.lang = "ar-SA";
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 5;

        rec.onresult = (event: any) => {
          if (useRecitationStore.getState().isAudioPlaying || !activeRef.current) return;

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
              interim = resultList[0]?.transcript || "";
            }
          }

          const display = finalAlternatives[0] || interim;
          if (display && display.trim().length > 0) {
            setLiveTranscriptRef.current(display);
          }

          // If final alternative detected, pass to processSpeech
          if (finalAlternatives.length > 0) {
            processSpeechRef.current(finalAlternatives);
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
            console.warn("[ContinuousASR] Web Speech error:", e.error);
          }
        };

        rec.start();
        recognitionRef.current = rec;
      } catch (e) {
        console.warn("[ContinuousASR] Web Speech not active in background:", e);
      }
    };

    // 2. High-Accuracy Whisper Utterance Processor with proper MediaRecorder container cycling
    async function startContinuousASR() {
      if (!activeRef.current) return;
      setRecognitionRunning(true);

      // Start live web speech for 0ms visual display
      startWebSpeechLive();

      try {
        console.log("[ContinuousASR] Initializing Audio Stream & MediaRecorder...");
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

        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "audio/webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "";

        // Function to create a fresh MediaRecorder instance for each utterance cycle
        // Ensuring EVERY audio chunk collection has complete WebM EBML headers
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
          rec.start(100);
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

          // Stop active recorder to finalize and gather complete container Blob
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

          // Immediately start next recorder cycle so no speech is missed
          startNewRecorderCycle();

          const audioBlob = await finalizeBlobPromise;

          // If utterance was totally silent or tiny, skip without advancing
          if (!hadSpeech || !audioBlob || audioBlob.size < 800) {
            isProcessingUtterance = false;
            return;
          }

          const isPlaying = useRecitationStore.getState().isAudioPlaying;
          if (!isPlaying && activeRef.current) {
            try {
              console.log("[ContinuousASR] Transmitting complete container utterance to Groq:", audioBlob.size, "bytes");
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

                if (data.decision === "no_speech" || !data.transcript || !data.success) {
                  console.log("[ContinuousASR] No speech detected or background noise — holding position");
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
              console.warn("[ContinuousASR] Whisper request failed:", err);
            }
          }
          isProcessingUtterance = false;
        };

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
            } else {
              // Background silence before user starts speaking: cycle small buffers after 5s
              if (elapsed > 5000 && !isProcessingUtterance) {
                startNewRecorderCycle();
              }
            }
          } else {
            // Voice energy detected!
            speechDetectedInUtterance = true;
            silenceStartTime = null; // Reset silence tracker during natural speech
          }
        }, 60);

      } catch (err) {
        console.warn("[ContinuousASR] Failed to initialize MediaRecorder; Web Speech is running:", err);
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
    useWhisper,
    setUseWhisper,
  };
}
