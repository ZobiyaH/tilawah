/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";

interface MicCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MicCheckModal({ isOpen, onClose }: MicCheckModalProps) {
  const [status, setStatus] = useState<"testing" | "ready" | "failed">("testing");
  const [rmsLevel, setRmsLevel] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let localStream: MediaStream | null = null;
    let localCtx: AudioContext | null = null;

    async function startTest() {
      try {
        setStatus("testing");
        setTimeLeft(5);
        setRmsLevel(0);

        // Get microphone stream with boosted constraints
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: false,
            autoGainControl: true,
          }
        });
        streamRef.current = localStream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        localCtx = new AudioContextClass();
        if (localCtx.state === "suspended") {
          await localCtx.resume();
        }
        audioContextRef.current = localCtx;

        const analyserNode = localCtx.createAnalyser();
        analyserNode.fftSize = 256;
        analyserRef.current = analyserNode;

        const source = localCtx.createMediaStreamSource(localStream);
        
        // 5x Gain boost for visual level meter responsiveness
        const gainNode = localCtx.createGain();
        gainNode.gain.setValueAtTime(5.0, localCtx.currentTime);
        source.connect(gainNode);
        gainNode.connect(analyserNode);

        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        let detectedSpeech = false;

        // Poll RMS level every 50ms for smooth 20fps level bar updates
        intervalRef.current = setInterval(() => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteTimeDomainData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const val = (dataArray[i] - 128) / 128;
            sum += val * val;
          }
          const rms = Math.sqrt(sum / dataArray.length);
          setRmsLevel(rms);

          // Mark ready if speech volume is detected (rms > 0.003 with gain boost)
          if (rms > 0.003 && !detectedSpeech) {
            detectedSpeech = true;
            setStatus("ready");
          }
        }, 50);

      } catch (err) {
        console.warn("Failed to capture mic in test modal:", err);
        setStatus("failed");
      }
    }

    startTest();

    // 5-second countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus((current) => {
            if (current === "testing") {
              return "failed";
            }
            return current;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timer) clearInterval(timer);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (localCtx && localCtx.state !== "closed") {
        localCtx.close();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden flex items-center justify-center" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />

      {/* Modal Card */}
      <div className="bg-[#faf6ee] dark:bg-zinc-900 border-2 border-[#c8993c]/40 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl relative z-10 text-center select-none animate-[slide-up_0.3s_ease-out]">
        <h3 className="font-amiri text-2xl font-bold text-[#1e5e4a] dark:text-emerald-light mb-2">
          🎙 اختبار الميكروفون · Mic Check
        </h3>
        
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 mb-6">
          Say <span className="font-amiri text-lg text-[#c8993c] font-bold">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span> (&quot;Bismillah ir-Rahman ir-Rahim&quot;) to test your microphone
        </p>

        {/* Visual Level Meter (Progress bar based on real-time RMS) */}
        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-6 rounded-full overflow-hidden mb-6 relative border border-[#c8993c]/20 shadow-inner">
          <div 
            className="h-full bg-[#1e5e4a] transition-all duration-75"
            style={{ width: `${Math.min(100, Math.max(0, rmsLevel * 1200))}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-widest text-zinc-700 dark:text-zinc-200 font-bold drop-shadow-sm">
            Mic Input Level
          </span>
        </div>

        {status === "testing" && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl animate-pulse">⏳</span>
            <p className="text-xs font-semibold text-zinc-500">
              Speak into your mic... ({timeLeft}s remaining)
            </p>
          </div>
        )}

        {status === "ready" && (
          <div className="flex flex-col items-center gap-3">
            <span className="text-3xl text-[#1e5e4a]">✓</span>
            <p className="text-sm font-bold text-[#1e5e4a]">
              Mic ready! Voice volume detected successfully.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-8 py-3 bg-[#1e5e4a] hover:bg-[#154335] text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md shadow-[#1e5e4a]/20 active:scale-95"
            >
              Start Reading
            </button>
          </div>
        )}

        {status === "failed" && (
          <div className="text-left bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-xl p-5 mb-6">
            <strong className="block text-xs uppercase tracking-wider text-red-700 dark:text-red-400 mb-2 text-center font-bold">
              ⚠️ Warning: Low / No Voice Signal Detected
            </strong>
            <ul className="list-disc pl-4 text-xs text-zinc-600 dark:text-zinc-300 space-y-1.5 leading-relaxed font-semibold">
              <li>Ensure browser mic permissions are allowed (click lock 🔒 icon in URL bar).</li>
              <li>Speak clearly and louder into your microphone.</li>
              <li>You can still proceed by clicking <strong>Start Reading</strong> below.</li>
            </ul>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full py-3 bg-[#1e5e4a] text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md active:scale-95 text-center"
            >
              Start Reading Anyway →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
