/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { useRecitationStore } from "../store/recitationStore";
import { getSupportedMimeType, userAudioVault } from "./recorder";

interface WindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

// Global state trackers across re-renders
let globalStream: MediaStream | null = null;
let globalRecorder: MediaRecorder | null = null;
let globalAudioContext: AudioContext | null = null;
let globalVadAnalyser: AnalyserNode | null = null;
let isRecognitionRunning = false;
let pauseTimeout: NodeJS.Timeout | null = null;

export function getRecognitionRunning() {
  return isRecognitionRunning;
}

export function setRecognitionRunning(val: boolean) {
  isRecognitionRunning = val;
}

export function getGlobalStream(): MediaStream | null {
  return globalStream;
}

export function getGlobalAnalyser(): AnalyserNode | null {
  return globalVadAnalyser;
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

// Global user gesture unlock for Mobile AudioContext
if (typeof window !== "undefined") {
  const unlockMobileAudio = () => {
    if (globalAudioContext && globalAudioContext.state === "suspended") {
      globalAudioContext.resume().catch(() => {});
    }
  };
  window.addEventListener("touchstart", unlockMobileAudio, { passive: true });
  window.addEventListener("touchend", unlockMobileAudio, { passive: true });
  window.addEventListener("click", unlockMobileAudio, { passive: true });
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

    // Detect if we're on a mobile device
    const isMobile =
      typeof navigator !== "undefined" &&
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

    // Higher threshold on mobile to avoid ambient mic noise keeping chunks open forever.
    // Desktop can use a tighter threshold since mic quality is better.
    const SILENCE_THRESHOLD = isMobile ? 0.015 : 0.005;
    const END_OF_SPEECH_MS = isMobile ? 400 : 250;
    // Hard cap: flush chunk even if speech is still detected (prevents indefinitely open
    // chunks on mobile where RMS never truly dips below threshold).
    const MAX_CHUNK_MS = isMobile ? 3500 : 4000;
    // Hard absolute cap regardless of speech — forces a flush so mobile never hangs
    const HARD_CAP_MS = isMobile ? 6000 : 8000;

    let silenceStartTime: number | null = null;
    let utteranceStartTime: number = Date.now();
    let speechDetectedInUtterance = false;
    let currentChunks: Blob[] = [];
    let isProcessingUtterance = false;
    let mimeType = "audio/webm;codecs=opus";

    // Ref to the wordIndex at the time of the last confirmed advance.
    // Used to prevent double-advancing on the same index from stale interim events.
    let lastAdvancedWordIndex = -1;

    // 1. Web Speech live interim text display (Instant visual display + fast verification on desktop)
    const win = typeof window !== "undefined" ? (window as WindowWithSpeech) : null;
    const SpeechRecognitionClass = win?.SpeechRecognition || win?.webkitSpeechRecognition;

    // Show a listening indicator immediately so Mobile never shows a blank transcript
    if (!SpeechRecognitionClass) {
      setLiveTranscriptRef.current("🎙️ Listening…");
    }

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
          const finalAlternatives: string[] = [];

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const resultList = event.results[i];
            const text = resultList[0]?.transcript?.trim();
            if (resultList.isFinal) {
              // Collect all alternatives only from FINAL results
              for (let a = 0; a < resultList.length; a++) {
                const altText = resultList[a]?.transcript?.trim();
                if (altText && !finalAlternatives.includes(altText)) {
                  finalAlternatives.push(altText);
                }
              }
              if (text) latestFinal = text;
            } else {
              // Interim: update display only, do NOT advance word index
              if (text) interim = text;
            }
          }

          // Always update the live transcript for visual feedback
          const display = latestFinal || interim;
          if (display && display.trim().length > 0) {
            setLiveTranscriptRef.current(display);
          }

          // Only call processSpeech on FINAL results to prevent cascade false-positive
          // advances caused by repeated interim emissions of the same partial transcript.
          if (latestFinal && finalAlternatives.length > 0) {
            const currentIdx = useRecitationStore.getState().wordIndex;
            // Guard: skip if we already advanced past this index in this utterance
            if (currentIdx > lastAdvancedWordIndex) {
              lastAdvancedWordIndex = currentIdx;
              processSpeechRef.current(finalAlternatives);
            }
          }
        };

        rec.onend = () => {
          // Reset the per-utterance anchor when Web Speech session ends
          lastAdvancedWordIndex = -1;
          if (activeRef.current && isRecognitionRunning) {
            setTimeout(() => {
              if (activeRef.current && isRecognitionRunning && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch {}
              }
            }, 200);
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

    // 2. High-Speed Whisper ASR Engine (Works seamlessly on Mobile & Desktop)
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
        globalAudioContext = audioContext;
        if (audioContext.state === "suspended") {
          await audioContext.resume().catch(() => {});
        }

        vadAnalyser = audioContext.createAnalyser();
        vadAnalyser.fftSize = 256;
        globalVadAnalyser = vadAnalyser;
        vadDataArray = new Uint8Array(vadAnalyser.frequencyBinCount);

        const source = audioContext.createMediaStreamSource(localStream);
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(3.0, audioContext.currentTime);
        source.connect(gainNode);
        gainNode.connect(vadAnalyser);

        mimeType = getSupportedMimeType();

        const startNewRecorderCycle = () => {
          if (!localStream || !activeRef.current) return null;

          currentChunks = [];
          utteranceStartTime = Date.now();
          silenceStartTime = null;
          speechDetectedInUtterance = false;

          let rec: MediaRecorder;
          try {
            rec = new MediaRecorder(localStream, mimeType ? { mimeType } : {});
          } catch {
            rec = new MediaRecorder(localStream);
          }

          rec.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              currentChunks.push(e.data);
            }
          };
          try {
            rec.start();
          } catch (e) {
            console.warn("[ContinuousASR] Recorder start error:", e);
          }
          localRecorder = rec;
          globalRecorder = rec;
          return rec;
        };

        startNewRecorderCycle();

        const finishUtteranceAndSend = async () => {
          if (isProcessingUtterance || !localRecorder || !activeRef.current) return;
          isProcessingUtterance = true;

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

          // Always transmit if audio blob has sound content (>= 1000 bytes)
          if (!audioBlob || audioBlob.size < 1000) {
            isProcessingUtterance = false;
            // Reset listening indicator on mobile after a skipped (silent) chunk
            if (!SpeechRecognitionClass) {
              setLiveTranscriptRef.current("🎙️ Listening…");
            }
            return;
          }

          // Show a processing indicator on mobile so the user knows their speech was captured
          if (!SpeechRecognitionClass) {
            setLiveTranscriptRef.current("⏳ Verifying…");
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
                  
                  // Save user's voice for this word / phrase in vault
                  userAudioVault.saveRecording(`word_${currentWordIndex}`, audioBlob, transcriptText);
                  userAudioVault.saveRecording("last_user_voice", audioBlob, transcriptText);

                  // Update LiveTranscript display (Crucial for Mobile where Web Speech is absent)
                  setLiveTranscriptRef.current(transcriptText);

                  // Whisper path: also use the high-confidence Groq transcript to advance words.
                  // On mobile this is the PRIMARY path since Web Speech API is unreliable.
                  processSpeechRef.current([transcriptText]);
                } else if (!data.success) {
                  // Restore "Listening" indicator on mobile so the screen is never blank after a failed chunk
                  if (!SpeechRecognitionClass) {
                    setLiveTranscriptRef.current("🎙️ Listening…");
                  }
                }
              }
            } catch (err) {
              console.warn("[ContinuousASR] Transcribe request failed:", err);
            }
          }
          isProcessingUtterance = false;
        };

        // Real-time voice energy loop (Runs every 40ms)
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

          // Hard absolute cap — flush no matter what to prevent mobile hang
          if (elapsed >= HARD_CAP_MS) {
            finishUtteranceAndSend();
            return;
          }

          if (rms < SILENCE_THRESHOLD) {
            if (speechDetectedInUtterance) {
              silenceStartTime = silenceStartTime || Date.now();
              const silenceDuration = Date.now() - silenceStartTime;

              if (silenceDuration >= END_OF_SPEECH_MS || elapsed >= MAX_CHUNK_MS) {
                finishUtteranceAndSend();
              }
            } else {
              // No speech detected yet: flush after MAX_CHUNK_MS to keep cycle moving
              if (elapsed >= MAX_CHUNK_MS) {
                finishUtteranceAndSend();
              }
            }
          } else {
            // RMS is above threshold → active speech
            speechDetectedInUtterance = true;
            silenceStartTime = null;
            // On mobile, also flush at MAX_CHUNK_MS even during continuous speech,
            // so long utterances are broken into processable segments
            if (isMobile && elapsed >= MAX_CHUNK_MS) {
              finishUtteranceAndSend();
            }
          }
        }, 40);
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
      globalAudioContext = null;
      globalVadAnalyser = null;
    };
  }, [isListening]);

  return {
    isListening,
    browserSupport,
  };
}
