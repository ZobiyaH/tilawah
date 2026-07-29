"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAudioStream } from "../../lib/speech/useAudioStream";
import { useRecitationStore } from "../../lib/store/recitationStore";
import clsx from "clsx";

export default function WaveformBar() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isListening = useRecitationStore((state) => state.isListening);
  const isAudioPlaying = useRecitationStore((state) => state.isAudioPlaying);
  const { analyser } = useAudioStream(isListening);
  const [levelBars, setLevelBars] = useState(0);

  useEffect(() => {
    // Resizing canvas to fit offset dimensions
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.offsetWidth;
        canvasRef.current.height = canvasRef.current.offsetHeight;
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!analyser) {
      setLevelBars(0);
      return;
    }

    let animFrame: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    analyser.fftSize = 256; // lightweight frequency resolution to minimize drawing overhead
    const bufferLength = analyser.frequencyBinCount; // 128 points
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrame = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      // Clears canvas with alpha transparency to leave trailing waves
      ctx.fillStyle = "rgba(26, 18, 8, 0.25)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const sliceWidth = canvas.width / bufferLength;
      const playing = useRecitationStore.getState().isAudioPlaying;

      // 1. Draw outer glow line (semi-transparent wider stroke)
      ctx.lineWidth = 5.0;
      ctx.strokeStyle = "rgba(232, 201, 106, 0.25)";
      ctx.beginPath();
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        // Draw silent baseline (128) if audio is playing to show visual mute state
        const val = playing ? 128 : dataArray[i];
        const v = val / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // 2. Draw sharp foreground inner wave line
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = "#c8993c"; // Gold wave line
      ctx.beginPath();
      x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const val = playing ? 128 : dataArray[i];
        const v = val / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();

    // Poll RMS level every 100ms for the signal bars
    const interval = setInterval(() => {
      if (useRecitationStore.getState().isAudioPlaying) {
        setLevelBars(0);
        return;
      }
      analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const val = (dataArray[i] - 128) / 128;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      // Map RMS 0.0 - 0.3 to 0 - 5 bars
      const bars = Math.min(5, Math.round((rms / 0.3) * 5));
      setLevelBars(bars);
    }, 100);

    return () => {
      cancelAnimationFrame(animFrame);
      clearInterval(interval);
    };
  }, [analyser]);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-[72px] bg-[#1a1208] rounded-xl overflow-hidden shadow-inner border border-gold/15 select-none animate-[slide-up_0.3s_ease-out]">
        <canvas ref={canvasRef} className="w-full h-full block" />
        
        {/* Waiting for Mic label */}
        <span
          className={clsx(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] tracking-[4px] font-bold text-white/30 uppercase pointer-events-none transition-opacity duration-300",
            (isListening || isAudioPlaying) && "opacity-0"
          )}
        >
          Waiting for Mic
        </span>

        {/* Playing Audio (Visualizer suspended/muted) label */}
        <span
          className={clsx(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] tracking-[3px] font-bold uppercase pointer-events-none transition-all duration-300 text-gold-light animate-pulse",
            isAudioPlaying ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}
        >
          🔊 Listen carefully...
        </span>

        {/* Active ASR Your Turn label */}
        <span
          className={clsx(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] tracking-[3px] font-bold uppercase pointer-events-none transition-all duration-300 text-emerald-light",
            (isListening && !isAudioPlaying) ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}
        >
          🎙 Your turn...
        </span>
      </div>

      {/* Real-time mic signal level bars */}
      {isListening && !isAudioPlaying && (
        <div className="flex items-center gap-1.5 justify-center py-1 bg-parchment-dark/30 rounded-lg border border-gold/5 max-w-sm mx-auto w-full">
          <span className="text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold mr-1">
            Voice Level:
          </span>
          <div className="flex items-end gap-0.5 h-6">
            {[1, 2, 3, 4, 5].map((i) => {
              let activeColor = "bg-zinc-200 dark:bg-zinc-800";
              if (i <= levelBars) {
                if (levelBars <= 2) activeColor = "bg-red-500/70";
                else if (levelBars === 3) activeColor = "bg-amber-500/80";
                else activeColor = "bg-emerald";
              }
              return (
                <div 
                  key={i} 
                  className={clsx("w-1 rounded transition-all duration-100", activeColor)}
                  style={{ height: `${i * 3 + 4}px` }}
                />
              );
            })}
          </div>
          <span className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 ml-2">
            {levelBars === 0 && "Silent"}
            {levelBars > 0 && levelBars <= 2 && "Too Quiet (Boost Sensitivity)"}
            {levelBars === 3 && "Good"}
            {levelBars >= 4 && "Excellent"}
          </span>
        </div>
      )}
    </div>
  );
}
