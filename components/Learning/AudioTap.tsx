"use client";

import React, { useState } from "react";
import { QariAudioManager } from "@/lib/qariAudio";
import { speakArabic } from "@/lib/speech/tts";

interface AudioTapProps {
  arabic?: string;
  audioPath?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function AudioTap({ arabic, audioPath, children, size = "md" }: AudioTapProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioMgr = QariAudioManager.getInstance();

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      audioMgr.stop();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    try {
      if (audioPath) {
        await audioMgr.play(audioPath);
      } else if (arabic) {
        await speakArabic(arabic);
      }
    } catch (err) {
      console.warn("AudioTap failed to play online path, trying TTS fallback:", audioPath, err);
      if (arabic) {
        try {
          await speakArabic(arabic);
        } catch (ttsErr) {
          console.warn("AudioTap TTS fallback failed:", ttsErr);
        }
      }
    } finally {
      setIsPlaying(false);
    }
  };

  const iconSizeClass = size === "sm" ? "text-xs" : size === "lg" ? "text-xl" : "text-sm";

  return (
    <span
      onClick={handlePlay}
      className="inline-flex items-center gap-1.5 cursor-pointer hover:text-[#c8993c] active:scale-95 transition-all select-none group"
      title={arabic ? `Click to hear: ${arabic}` : "Click to hear audio"}
    >
      <span>{children}</span>
      <span
        className={`inline-block text-[#c8993c] transition-transform duration-200 group-hover:scale-110 ${iconSizeClass} ${
          isPlaying ? "animate-bounce" : ""
        }`}
      >
        {isPlaying ? "🔊" : "🔈"}
      </span>
    </span>
  );
}
