"use client";

import React from "react";
import { WordToken as WordTokenType } from "../../types";
import { useRecitationStore } from "../../lib/store/recitationStore";
import TajweedLayer from "./TajweedLayer";

interface WordTokenProps {
  word: WordTokenType;
  isCurrent?: boolean;
  isCorrect?: boolean;
  isError?: boolean;
  isSkipped?: boolean;
  showTajweed: boolean;
  onClick?: () => void;
}

// Pronunciation mapping for Al-Fatiha & Al-Ikhlas words as mouth shape guides
const MOUTH_SHAPE_HINTS: Record<string, string> = {
  // Al-Fatiha
  "بِسْمِ": "Say: bis-MI",
  "اللَّهِ": "Say: lillaa-HI",
  "الرَّحْمَٰنِ": "Say: ar-rah-MAAN",
  "الرَّحِيمِ": "Say: ar-ra-HEEM",
  "الْحَمْدُ": "Say: al-HAM-du",
  "لِلَّهِ": "Say: lillaa-HI",
  "رَبِّ": "Say: rab-BI",
  "الْعَالَمِينَ": "Say: al-aa-la-MEEN",
  "مَالِكِ": "Say: MAA-li-ki",
  "يَوْمِ": "Say: yaw-mid",
  "الدِّينِ": "Say: ad-DEEN",
  "إِيَّاكُ": "Say: iy-YAA-ka",
  "نَعْبُدُ": "Say: na'-BU-du",
  "وَإِيَّاكُ": "Say: wa-iy-YAA-ka",
  "نَسْتَعِينُ": "Say: nas-ta-EEN",
  "اهْدِنَا": "Say: ih-di-NAA",
  "الصِّرَاطَ": "Say: aṣ-ṣi-RAAT",
  "الْمُسْتَقِيمَ": "Say: al-mus-ta-QEEM",
  "صِرَاطَ": "Say: ṣi-RAA-ṭa",
  "الَّذِينَ": "Say: al-la-DHEE-na",
  "أَنْعَمْتَ": "Say: an-'AM-ta",
  "عَلَيْهِمْ": "Say: a-LAY-him",
  "غَيْرِ": "Say: GHAY-ri",
  "الْمَغْضُوبِ": "Say: al-magh-DOOB",
  "وَلَا": "Say: wa-LAA",
  "الضَّالِّينَ": "Say: aḍ-DAA-lleen",
  // Al-Ikhlas
  "قُلْ": "Say: QUL",
  "هُوَ": "Say: HU-wa",
  "أَحَدٌ": "Say: a-HAD",
  "الصَّمَدُ": "Say: aṣ-ṢA-mad",
  "لَمْ": "Say: LAM",
  "يَلِدْ": "Say: ya-LID",
  "وَلَمْ": "Say: wa-LAM",
  "يُولَدْ": "Say: YOO-lad",
  "يَكُن": "Say: ya-KUN",
  "لَّهُ": "Say: la-HOO",
  "كُفُوًا": "Say: ku-fu-WAN",
};

export default function WordToken({
  word,
  showTajweed,
  onClick,
}: WordTokenProps) {
  const wordIndex = useRecitationStore((state) => state.wordIndex);
  const recitationState = useRecitationStore((state) => state.recitationState);
  const retryCount = useRecitationStore((state) => state.retryCount);
  const practiceWords = useRecitationStore((state) => state.practiceWords);
  const successFeedback = useRecitationStore((state) => state.successFeedback);

  const isCurrent = word.globalIdx === wordIndex;
  const isCorrect = word.globalIdx < wordIndex && !practiceWords.includes(word.globalIdx);
  const isSkipped = practiceWords.includes(word.globalIdx);

  const cleanWord = word.clean;
  const hintText = MOUTH_SHAPE_HINTS[word.arabic] || `Say: ${cleanWord}`;

  const wordIndexInAyah = word.wordIdxInAyah;
  const wordAnnotations = word.ayahData.tajweedMap?.[wordIndexInAyah];

  let wordClass = "font-amiri-quran text-3xl md:text-4xl select-none cursor-pointer leading-[2.8] transition-all duration-200";
  let tooltipText = hintText;
  let tooltipClass = "absolute bottom-full right-0 mb-3 px-3 py-1 text-white text-xs font-black tracking-wide rounded-xl shadow-xl whitespace-nowrap z-50 select-none animate-bounce border border-white/20";

  if (isCurrent) {
    if (recitationState === "retry") {
      wordClass += " word-retry scale-105";
      tooltipText = `Say again ↑ (Attempt ${retryCount + 1} of 3)`;
      tooltipClass += " bg-amber-600";
    } else if (recitationState === "success") {
      wordClass += " word-success scale-105";
      tooltipText = successFeedback || "✓ Well done!";
      tooltipClass += " bg-[#1e5e4a]";
    } else if (recitationState === "error" || recitationState === "correction") {
      wordClass += " word-error scale-105 animate-shake";
      tooltipClass += " bg-[#8b1a1a]";
    } else {
      wordClass += " word-current scale-105";
      tooltipClass += " bg-[#1e5e4a]";
    }
  } else if (isCorrect) {
    wordClass += " word-correct";
  } else if (isSkipped) {
    wordClass += " word-skipped";
  } else {
    wordClass += " word-idle";
  }

  return (
    <span className="relative inline-block mx-1 my-1 group">
      {/* Beginner Tooltip Mouth shape hint */}
      {isCurrent && (
        <span className={tooltipClass}>
          {tooltipText}
        </span>
      )}

      {/* Tajweed Underline Layer */}
      <TajweedLayer annotations={wordAnnotations} showTajweed={showTajweed}>
        <span
          id={`w-${word.globalIdx}`}
          onClick={onClick}
          className={wordClass}
        >
          {word.arabic}
        </span>
      </TajweedLayer>

      {/* Practice dot below word if marked */}
      {isSkipped && (
        <span className="word-needs-practice-dot" />
      )}
    </span>
  );
}
