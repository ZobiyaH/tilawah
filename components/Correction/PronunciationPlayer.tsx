"use client";

import React, { useState } from "react";
import { speakArabicWord } from "../../lib/speech/tts";

interface PronunciationPlayerProps {
  correctWord: string;
  fullAyahText: string;
  wordToken?: { ayahN: number; wordIdxInAyah: number; ayahData: { surahId: number } };
}

export default function PronunciationPlayer({ 
  correctWord, 
  fullAyahText, 
  wordToken 
}: PronunciationPlayerProps) {
  const [playingWord, setPlayingWord] = useState(false);
  const [playingAyah, setPlayingAyah] = useState(false);

  const handlePlayWord = async () => {
    setPlayingWord(true);
    await speakArabicWord(correctWord, wordToken, false);
    setPlayingWord(false);
  };

  const handlePlayAyah = async () => {
    setPlayingAyah(true);
    await speakArabicWord(fullAyahText, wordToken, true);
    setPlayingAyah(false);
  };

  return (
    <div className="flex flex-col gap-2 w-full mt-4">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={playingWord}
          onClick={handlePlayWord}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gold-pale hover:bg-gold-light/40 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-gold rounded-xl text-xs font-bold text-yellow-800 dark:text-gold-light transition-all shadow-sm disabled:opacity-50"
        >
          🔊 {playingWord ? "Playing..." : "Hear correct word"}
        </button>
        <button
          type="button"
          disabled={playingAyah}
          onClick={handlePlayAyah}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-pale hover:bg-emerald-light/20 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-emerald rounded-xl text-xs font-bold text-emerald dark:text-emerald-light transition-all shadow-sm disabled:opacity-50"
        >
          🔊 {playingAyah ? "Playing..." : "Hear full ayah"}
        </button>
      </div>
    </div>
  );
}
