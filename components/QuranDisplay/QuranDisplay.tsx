"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRecitationStore } from "../../lib/store/recitationStore";
import AyahLine from "./AyahLine";
import { getSurahData } from "../../lib/quran/quranData";
import { speakArabicWord } from "../../lib/speech/tts";

export default function QuranDisplay() {
  const currentSurahId = useRecitationStore((state) => state.currentSurahId);
  const wordIndex = useRecitationStore((state) => state.wordIndex);
  const allWords = useRecitationStore((state) => state.allWords);
  const mode = useRecitationStore((state) => state.mode);
  const practiceWords = useRecitationStore((state) => state.practiceWords);

  const showTransliteration = useRecitationStore((state) => state.showTransliteration);
  const showTranslation = useRecitationStore((state) => state.showTranslation);
  const showTajweedColors = useRecitationStore((state) => state.showTajweedColors);

  const fontScale = useRecitationStore((state) => state.fontScale);

  const containerRef = useRef<HTMLDivElement>(null);

  const surahData = getSurahData(currentSurahId);

  // Auto-scroll logic: keep the active word centered in the panel
  useEffect(() => {
    const activeEl = document.getElementById(`w-${wordIndex}`);
    if (activeEl && containerRef.current) {
      activeEl.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [wordIndex]);

  if (!surahData) {
    return (
      <div className="flex items-center justify-center p-12 text-zinc-400">
        No Surah Loaded. Select a Surah from the dashboard.
      </div>
    );
  }

  const showReview = wordIndex >= allWords.length && allWords.length > 0;

  if (showReview) {
    const skippedWords = allWords.filter((w) => practiceWords.includes(w.globalIdx));
    const groupedByAyah: Record<number, typeof skippedWords> = {};
    skippedWords.forEach((word) => {
      if (!groupedByAyah[word.ayahN]) {
        groupedByAyah[word.ayahN] = [];
      }
      groupedByAyah[word.ayahN].push(word);
    });

    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.35 }}
        className="card mushaf-paper-texture mushaf-shadow relative overflow-hidden flex flex-col h-[520px] border-[3px] border-double border-gold/60 p-1 rounded-2xl"
      >
        <div className="absolute top-1.5 right-1.5 w-6 h-6 pointer-events-none opacity-40 border-t-2 border-r-2 border-gold/80 rounded-tr" />
        <div className="absolute top-1.5 left-1.5 w-6 h-6 pointer-events-none opacity-40 border-t-2 border-l-2 border-gold/80 rounded-tl" />
        <div className="absolute bottom-1.5 right-1.5 w-6 h-6 pointer-events-none opacity-40 border-b-2 border-r-2 border-gold/80 rounded-br" />
        <div className="absolute bottom-1.5 left-1.5 w-6 h-6 pointer-events-none opacity-40 border-b-2 border-l-2 border-gold/80 rounded-bl" />
        <div className="bg-gradient-to-r from-emerald to-emerald-light px-5 py-3 border-b border-gold/20 flex justify-between items-center shadow-sm">
          <h2 className="font-amiri text-[17px] text-white tracking-wider">
            🎉 Recitation Completed - {surahData.name}
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6" style={{ direction: "ltr" }}>
          {skippedWords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-5xl mb-4">🏆</span>
              <h3 className="font-bold text-lg text-emerald dark:text-emerald-light uppercase tracking-wider">
                Perfect Recitation!
              </h3>
              <p className="text-xs text-zinc-500 max-w-xs mt-2 leading-relaxed">
                Splendid work! You completed this surah without skipping any words for practice.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-sm text-gold-light uppercase tracking-wider">
                📝 Words to Practice ({skippedWords.length})
              </h3>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Click on any word to hear its correct pronunciation so you can practice:
              </p>
              {Object.entries(groupedByAyah).map(([ayahNum, words]) => (
                <div key={ayahNum} className="border border-gold/15 bg-white/20 dark:bg-zinc-800/40 rounded-xl p-4 flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-gold uppercase tracking-widest">
                    Ayah {ayahNum}
                  </span>
                  <div className="flex flex-wrap gap-2.5" style={{ direction: "rtl" }}>
                    {words.map((w) => (
                      <button
                        key={w.globalIdx}
                        onClick={() => {
                          speakArabicWord(w.arabic, w);
                        }}
                        className="px-3.5 py-1.5 border border-gold/20 hover:border-gold bg-parchment dark:bg-zinc-800 hover:bg-gold-pale/35 text-ink rounded-lg font-amiri-quran text-[17px] transition-all shadow-sm flex items-center gap-2 animate-[slide-up_0.2s_ease-out]"
                      >
                        {w.arabic}
                        <span className="text-xs opacity-50">🔊</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/30 dark:bg-zinc-900/50 p-5 border-t border-gold/10 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => useRecitationStore.getState().resetSession()}
            className="flex-1 py-3 bg-emerald hover:bg-emerald-light text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md shadow-emerald/20 text-center"
          >
            🔄 Recite Again
          </button>
          <a
            href="/"
            className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 font-bold text-xs tracking-wider uppercase rounded-xl transition-all text-center"
          >
            Dashboard
          </a>
        </div>
      </motion.div>
    );
  }

  // Hardcopy mode blocks visual text by applying a blur overlay
  const isHardcopy = mode === "hardcopy";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="card mushaf-paper-texture mushaf-shadow relative overflow-hidden flex flex-col h-[520px] border-[3px] border-double border-gold/60 p-1 rounded-2xl"
    >
      <div className="absolute top-1.5 right-1.5 w-6 h-6 pointer-events-none opacity-40 border-t-2 border-r-2 border-gold/80 rounded-tr" />
      <div className="absolute top-1.5 left-1.5 w-6 h-6 pointer-events-none opacity-40 border-t-2 border-l-2 border-gold/80 rounded-tl" />
      <div className="absolute bottom-1.5 right-1.5 w-6 h-6 pointer-events-none opacity-40 border-b-2 border-r-2 border-gold/80 rounded-br" />
      <div className="absolute bottom-1.5 left-1.5 w-6 h-6 pointer-events-none opacity-40 border-b-2 border-l-2 border-gold/80 rounded-bl" />
      
      {/* Header Info */}
      <div className="bg-gradient-to-r from-emerald to-emerald-light px-5 py-3 border-b border-gold/20 flex justify-between items-center shadow-sm">
        <h2 className="font-amiri text-[17px] text-white tracking-wider">
          📖 {surahData.name}
        </h2>
        <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">
          {isHardcopy ? "BLUR ACTIVE (HARDCOPY)" : `${surahData.ayat.length} AYAT`}
        </span>
      </div>

      {/* Main Quran display scroll area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-4 flex flex-col"
        style={{ 
          fontSize: `${fontScale}px`,
          filter: isHardcopy ? "blur(7px)" : "none",
          pointerEvents: isHardcopy ? "none" : "auto",
          transition: "filter 0.3s ease"
        }}
      >
        {/* Beautiful Bismillah Header Banner for starting of Surah/Ayah page */}
        {currentSurahId !== "9" && (
          <div className="text-center py-3 my-2 text-2xl md:text-3xl font-amiri-quran text-gold select-none border-b border-gold/15 bg-gold-pale/10 rounded-xl">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
        )}

        {surahData.ayat.map((ayah, idx) => (
          <AyahLine
            key={idx}
            ayah={ayah}
            ayahIndex={idx}
            wordIndex={wordIndex}
            allWords={allWords}
            showTransliteration={showTransliteration}
            showTranslation={showTranslation}
            showTajweed={showTajweedColors}
            onWordClick={(globalIdx) => {
              useRecitationStore.setState({ wordIndex: globalIdx });
              const clickedWord = allWords[globalIdx];
              if (clickedWord) {
                speakArabicWord(clickedWord.arabic, clickedWord);
              }
            }}
            onAyahClick={(ayahN, surahId) => {
              const dummyToken = {
                ayahN,
                wordIdxInAyah: 1,
                ayahData: { surahId }
              };
              speakArabicWord(`آية ${ayahN}`, dummyToken, true);
            }}
          />
        ))}
      </div>

      {/* Mode blur lock warning */}
      {isHardcopy && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/10 backdrop-blur-sm text-center px-8 pointer-events-none">
          <span className="text-3xl mb-2">📖</span>
          <h4 className="font-bold text-sm uppercase text-yellow-800 dark:text-gold-light tracking-widest">
            Hardcopy Mode Enabled
          </h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-sm mt-1 leading-relaxed">
            Read from your physical Quran copy. The app is actively listening and tracking your metrics in the background.
          </p>
        </div>
      )}

    </motion.div>
  );
}
