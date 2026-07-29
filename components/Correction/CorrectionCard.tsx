"use client";

import React, { useState } from "react";
import { useRecitationStore } from "../../lib/store/recitationStore";
import { speakArabicWord } from "../../lib/speech/tts";

export default function CorrectionCard() {
  const wrongWord = useRecitationStore((state) => state.wrongWord);
  const correctWord = useRecitationStore((state) => state.correctWord);
  const tajweedTipText = useRecitationStore((state) => state.tajweedTipText);
  const allWords = useRecitationStore((state) => state.allWords);
  const wordIndex = useRecitationStore((state) => state.wordIndex);
  
  const retryCount = useRecitationStore((state) => state.retryCount);
  const startRetryMode = useRecitationStore((state) => state.startRetryMode);
  const retryOnceMore = useRecitationStore((state) => state.retryOnceMore);
  const markForPracticeAndSkip = useRecitationStore((state) => state.markForPracticeAndSkip);

  const [playingWord, setPlayingWord] = useState(false);
  const [playingAyah, setPlayingAyah] = useState(false);

  // Find the full ayah text context for the "Hear full ayah" player
  const currentWordToken = allWords[wordIndex];
  const fullAyahText = currentWordToken ? currentWordToken.ayahData.arabic : "";

  const handlePlayWord = async () => {
    setPlayingWord(true);
    await speakArabicWord(correctWord, currentWordToken, false);
    setPlayingWord(false);
  };

  const handlePlayAyah = async () => {
    setPlayingAyah(true);
    await speakArabicWord(fullAyahText, currentWordToken, true);
    setPlayingAyah(false);
  };

  if (retryCount === 3) {
    return (
      <div className="text-center relative select-none">
        <div className="text-3xl mb-2">💡</div>
        
        <h3 className="text-[10px] uppercase tracking-[3px] text-amber-600 font-bold mb-4">
          Practice recommendation
        </h3>

        <div className="flex flex-col items-center gap-1 my-5">
          <div className="font-amiri-quran text-[48px] text-emerald dark:text-emerald-light bg-emerald-pale/60 border border-emerald/20 shadow-[0_0_20px_rgba(45,122,98,0.25)] rounded-xl px-6 py-2 leading-normal">
            {correctWord}
          </div>
          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 mt-3 max-w-xs leading-relaxed">
            No worries, keep going - you can practice this word later.
          </p>
        </div>

        <div className="flex flex-col gap-[10px] mt-6 w-full">
          <button
            type="button"
            onClick={retryOnceMore}
            className="w-full h-[52px] inline-flex items-center justify-center gap-2 bg-emerald hover:bg-emerald-light text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md shadow-emerald/20 hover:scale-[1.01]"
          >
            <span>🎙</span> Try once more
          </button>
          <button
            type="button"
            onClick={markForPracticeAndSkip}
            className="w-full h-[52px] inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md shadow-amber-600/20 hover:scale-[1.01]"
          >
            <span>⏭</span> Mark for later &amp; skip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center relative select-none">
      <div className="text-3xl mb-2">⚠️</div>
      
      <h3 className="text-[10px] uppercase tracking-[3px] text-ruby dark:text-red-400 font-bold mb-4">
        Oops - let&apos;s fix this
      </h3>

      {/* Difference alignment display */}
      <div className="flex flex-col items-center gap-2 my-5">
        <div className="font-amiri-quran text-3xl line-through text-ruby bg-ruby-pale/80 dark:bg-ruby-pale/10 border border-ruby/20 rounded-lg px-5 py-1 leading-normal">
          {wrongWord}
        </div>
        <div className="text-xl text-gold font-bold">↓</div>
        <div className="font-amiri-quran text-[48px] text-emerald dark:text-emerald-light bg-emerald-pale/60 dark:bg-emerald-pale/10 border border-emerald/20 shadow-[0_0_20px_rgba(45,122,98,0.25)] rounded-xl px-6 py-2 leading-normal">
          {correctWord}
        </div>
      </div>

      {/* Why Explanation Guide with left mint accent and border */}
      <div className="bg-emerald-pale/30 dark:bg-emerald/10 border-l-4 border-emerald rounded-xl p-4 text-left mb-5">
        <strong className="block text-[10px] tracking-wider uppercase text-emerald dark:text-emerald-light mb-1 font-bold">
          📖 Pronunciation / Tajweed Guide
        </strong>
        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 leading-relaxed">
          {tajweedTipText}
        </p>
      </div>

      {/* Action buttons (Unified 52px stack, spaced 10px apart) */}
      <div className="flex flex-col gap-[10px] mt-4 w-full">
        <button
          type="button"
          disabled={playingWord}
          onClick={handlePlayWord}
          className="w-full h-[52px] inline-flex items-center justify-center gap-2 bg-gold-pale hover:bg-gold-light/40 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-gold rounded-xl text-xs font-bold text-yellow-800 dark:text-gold-light transition-all shadow-sm disabled:opacity-50"
        >
          <span>🔊</span> {playingWord ? "Playing..." : "Hear correct word"}
        </button>
        
        <button
          type="button"
          disabled={playingAyah}
          onClick={handlePlayAyah}
          className="w-full h-[52px] inline-flex items-center justify-center gap-2 bg-emerald-pale hover:bg-emerald-light/20 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-emerald rounded-xl text-xs font-bold text-emerald dark:text-emerald-light transition-all shadow-sm disabled:opacity-50"
        >
          <span>📖</span> {playingAyah ? "Playing..." : "Hear full ayah"}
        </button>

        <button
          type="button"
          onClick={startRetryMode}
          className="w-full h-[52px] inline-flex items-center justify-center gap-2 bg-emerald hover:bg-emerald-light text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md shadow-emerald/20 hover:scale-[1.01]"
        >
          <span>🎙</span> I&apos;m ready - let me try again
        </button>
        
        <button
          type="button"
          onClick={markForPracticeAndSkip}
          className="w-full h-[52px] inline-flex items-center justify-center gap-2 bg-transparent hover:bg-parchment-dark/50 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold text-[10px] tracking-widest uppercase rounded-xl transition-all border border-zinc-300 dark:border-zinc-700"
        >
          <span>⏭</span> Skip for now (mark for practice)
        </button>
      </div>
    </div>
  );
}
