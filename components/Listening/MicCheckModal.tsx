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
  const [timeLeft, setTimeLeft] = useState(3);
  
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
        setTimeLeft(3);
        setRmsLevel(0);

        // Get microphone stream with optimized constraints
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: true
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
        source.connect(analyserNode);

        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        let maxDetectedRms = 0;

        // Poll RMS level every 100ms
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

          if (rms > maxDetectedRms) {
            maxDetectedRms = rms;
          }

          if (rms > 0.01) {
            setStatus("ready");
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
        }, 100);

      } catch (err) {
        console.warn("Failed to capture mic in test modal:", err);
        setStatus("failed");
      }
    }

    startTest();

    // 3-second timeout count down
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus((current) => {
            if (current === "testing") {
              if (intervalRef.current) clearInterval(intervalRef.current);
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
      <div className="bg-parchment dark:bg-zinc-900 border-2 border-gold/40 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl relative z-10 text-center select-none animate-[slide-up_0.3s_ease-out]">
        <h3 className="font-amiri text-2xl font-bold text-emerald dark:text-emerald-light mb-2">
          🎙 اختبار الميكروفون · Mic Check
        </h3>
        
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 mb-6">
          Say <span className="font-amiri text-lg text-gold font-bold">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span> (&quot;Bismillah ir-Rahman ir-Rahim&quot;) to test your microphone
        </p>

        {/* Visual Level Meter (Progress bar based on real-time RMS) */}
        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-6 rounded-full overflow-hidden mb-6 relative">
          <div 
            className="h-full bg-emerald transition-all duration-75"
            style={{ width: `${Math.min(100, rmsLevel * 300)}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-widest text-zinc-600 dark:text-zinc-300 font-bold">
            Mic Input Level
          </span>
        </div>

        {status === "testing" && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl animate-pulse">⏳</span>
            <p className="text-xs font-semibold text-zinc-400">
              Listening... ({timeLeft}s remaining)
            </p>
          </div>
        )}

        {status === "ready" && (
          <div className="flex flex-col items-center gap-3">
            <span className="text-3xl text-emerald">✓</span>
            <p className="text-sm font-bold text-emerald">
              Mic ready! Correct volume level detected.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-8 py-3 bg-emerald hover:bg-emerald-light text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md shadow-emerald/20"
            >
              Start Reading
            </button>
          </div>
        )}

        {status === "failed" && (
          <div className="text-left bg-ruby-pale/50 dark:bg-ruby-pale/5 border border-ruby/20 rounded-xl p-5 mb-6">
            <strong className="block text-xs uppercase tracking-wider text-ruby mb-2 text-center font-bold">
              ⚠️ Warning: No Voice Detected
            </strong>
            <ul className="list-disc pl-4 text-xs text-zinc-600 dark:text-zinc-300 space-y-1.5 leading-relaxed font-semibold">
              <li>Check your browser has permission to access your microphone.</li>
              <li>Move closer to your microphone and try speaking louder.</li>
              <li>Try adjusting the <strong>Mic Sensitivity</strong> slider in Settings.</li>
            </ul>
            
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => {
                  setStatus("testing");
                  setTimeLeft(3);
                }}
                className="flex-1 py-3 border border-gold/30 hover:bg-gold-pale/30 rounded-xl text-xs font-bold text-yellow-800 dark:text-gold-light uppercase transition-all"
              >
                🔄 Retry Test
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-emerald hover:bg-emerald-light rounded-xl text-xs font-bold text-white uppercase transition-all"
              >
                Skip Check
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
