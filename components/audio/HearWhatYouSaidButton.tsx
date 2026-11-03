"use client";

import React, { useEffect, useState } from "react";
import { userAudioVault } from "../../lib/speech/recorder";

interface HearWhatYouSaidButtonProps {
  recordingKey?: string;
  label?: string;
  variant?: "pill" | "bar" | "compact";
  showTranscript?: boolean;
  className?: string;
}

export default function HearWhatYouSaidButton({
  recordingKey = "last_user_voice",
  label = "Hear what you said",
  variant = "pill",
  showTranscript = false,
  className = "",
}: HearWhatYouSaidButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [transcript, setTranscript] = useState<string | undefined>(undefined);

  useEffect(() => {
    const updateState = () => {
      setIsPlaying(userAudioVault.isPlaying());
      const rec = userAudioVault.getRecording(recordingKey) || userAudioVault.getLatestRecording();
      setHasAudio(Boolean(rec && rec.url));
      setTranscript(rec?.transcript);
    };

    updateState();
    const unsubscribe = userAudioVault.subscribe(updateState);
    return () => unsubscribe();
  }, [recordingKey]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPlaying) {
      userAudioVault.stop();
      setIsPlaying(false);
    } else {
      try {
        await userAudioVault.playRecording(recordingKey);
      } catch (err) {
        console.warn("Failed to play user recording:", err);
      }
    }
  };

  // Soundwave animated bars for playing state
  const SoundwaveIcon = () => (
    <span className="flex items-center gap-0.5 h-3.5 px-0.5">
      <span className="w-1 bg-current rounded-full animate-bounce h-3" style={{ animationDelay: "0ms" }}></span>
      <span className="w-1 bg-current rounded-full animate-bounce h-4" style={{ animationDelay: "150ms" }}></span>
      <span className="w-1 bg-current rounded-full animate-bounce h-2" style={{ animationDelay: "300ms" }}></span>
      <span className="w-1 bg-current rounded-full animate-bounce h-3.5" style={{ animationDelay: "75ms" }}></span>
    </span>
  );

  if (variant === "bar") {
    return (
      <div
        className={`w-full flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:px-4 sm:py-2.5 rounded-2xl border transition-all duration-200 ${
          isPlaying
            ? "bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-700 shadow-md ring-2 ring-sky-300/30"
            : hasAudio
            ? "bg-white/80 dark:bg-zinc-900/40 border-sky-600/25 hover:border-sky-500/50 shadow-2xs"
            : "bg-zinc-50/60 dark:bg-zinc-900/20 border-zinc-200/50 dark:border-zinc-800 opacity-60"
        } ${className}`}
      >
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isPlaying
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300"
            }`}
          >
            {isPlaying ? <SoundwaveIcon /> : <span className="text-sm">🎧</span>}
          </div>
          <div className="text-left flex flex-col min-w-0">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200 truncate">
              {isPlaying ? "Playing Your Recording" : label}
            </span>
            {showTranscript && transcript && (
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-xs font-amiri font-bold">
                &ldquo;{transcript}&rdquo;
              </span>
            )}
            {!hasAudio && (
              <span className="text-[10px] text-zinc-400 italic">
                Recite first to hear your audio playback
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={!hasAudio}
          className={`w-full sm:w-auto px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm ${
            isPlaying
              ? "bg-sky-600 hover:bg-sky-700 text-white"
              : hasAudio
              ? "bg-sky-600/10 hover:bg-sky-600 hover:text-white text-sky-800 dark:text-sky-300 border border-sky-600/30"
              : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed border border-transparent"
          }`}
        >
          {isPlaying ? (
            <>
              <span>⏹</span>
              <span>Stop</span>
            </>
          ) : (
            <>
              <span>▶</span>
              <span>Listen</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // "pill" variant (default for recitation bar and cards)
  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={!hasAudio}
      className={`group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-black text-[11px] tracking-wider uppercase select-none transition-all duration-200 active:scale-95 shadow-2xs ${
        isPlaying
          ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md ring-2 ring-sky-400/40"
          : hasAudio
          ? "bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 border border-sky-600/30 text-sky-800 dark:text-sky-300 hover:shadow-xs"
          : "bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-zinc-400 opacity-60 cursor-not-allowed"
      } ${className}`}
      title={hasAudio ? "Listen to your recorded pronunciation" : "Recite to record voice"}
    >
      <span className="shrink-0">
        {isPlaying ? <SoundwaveIcon /> : <span className="text-xs">🎧</span>}
      </span>
      <span className="truncate">
        {isPlaying ? "Playing Voice..." : label}
      </span>
    </button>
  );
}

