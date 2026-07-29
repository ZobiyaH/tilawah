"use client";

import React from "react";
import { Ayah, WordToken as WordTokenType } from "../../types";
import WordToken from "./WordToken";
import { toArabicNum } from "../../lib/arabic/normalize";

interface AyahLineProps {
  ayah: Ayah;
  ayahIndex: number;
  wordIndex: number;
  allWords: WordTokenType[];
  showTransliteration: boolean;
  showTranslation: boolean;
  showTajweed: boolean;
  onWordClick: (globalIdx: number) => void;
  onAyahClick: (ayahN: number, surahId: number) => void;
}

export default function AyahLine({
  ayah,
  ayahIndex,
  wordIndex,
  allWords,
  showTransliteration,
  showTranslation,
  showTajweed,
  onWordClick,
  onAyahClick,
}: AyahLineProps) {
  // Filter words that belong to this specific ayah
  const ayahWords = allWords.filter((w) => w.ayahIndex === ayahIndex);

  return (
    <div className="border-b border-gold/10 py-6 flex flex-col gap-3 transition-all duration-200">
      
      {/* Arabic text with glyph row (RTL) */}
      <div 
        className="w-full flex flex-wrap items-center justify-start gap-y-2 text-right"
        style={{ direction: "rtl" }}
      >
        {ayahWords.map((word) => {
          const isCurrent = word.globalIdx === wordIndex;
          const isCorrect = word.globalIdx < wordIndex; // Words before active index are considered correct (unless skipped)
          const isSkipped = false; // Add skipped check if needed (e.g. tracking index gaps)
          const isError = false; // We can set error highlight on specific conditions if needed

          // Read correct states from state manager dynamically if needed
          return (
            <WordToken
              key={word.globalIdx}
              word={word}
              isCurrent={isCurrent}
              isCorrect={isCorrect}
              isError={isError}
              isSkipped={isSkipped}
              showTajweed={showTajweed}
              onClick={() => onWordClick(word.globalIdx)}
            />
          );
        })}

        {/* Ayah End circle Glyph */}
        <span 
          onClick={() => {
            if (ayahWords.length > 0) {
              onAyahClick(ayahWords[0].ayahN, ayahWords[0].ayahData.surahId);
            }
          }}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-gold text-gold font-bold text-xs mx-3 bg-gold-pale/30 select-none shadow-sm font-lato cursor-pointer hover:bg-gold hover:text-white transition-all duration-200"
        >
          {toArabicNum(ayah.ayahNumber)}
        </span>
      </div>

      {/* Translations (LTR / English) */}
      {(showTransliteration || showTranslation) && (
        <div className="flex flex-col gap-2 pl-2 text-left" style={{ direction: "ltr" }}>
          {showTransliteration && (
            <div 
              className="italic tracking-wider"
              style={{
                fontFamily: "var(--font-lato), sans-serif",
                fontSize: "15px",
                color: "#5a6e5a",
                lineHeight: "1.4"
              }}
            >
              {ayah.transliteration}
            </div>
          )}
          {showTranslation && (
            <div 
              className="leading-relaxed"
              style={{
                fontSize: "14px",
                color: "#6b5c3e",
                fontWeight: 300,
                maxWidth: "80%",
                lineHeight: "1.5"
              }}
            >
              {ayah.translation}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
