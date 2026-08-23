/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Layout/Header";
import BottomNav from "@/components/Layout/BottomNav";
import SettingsDrawer from "@/components/UI/SettingsDrawer";
import MakhrajDiagram, { MakhrajPoint } from "@/components/Learning/MakhrajDiagram";
import { QariAudioManager } from "@/lib/qariAudio";
import { saveLearningProgress, getLearningProgress } from "@/lib/progress";
import { arabicSimilarity } from "@/lib/arabic/similarity";
import { stripDiacritics } from "@/lib/arabic/normalize";
import { transcribeAudio } from "@/lib/speech/transcribe";
import { trackEvent } from "@/lib/analytics/ga";

interface QuranExample {
  word: string;
  highlighted: string; // word where target letter is gold highlighted
  transliteration: string;
  meaning: string;
}

interface LetterLesson {
  char: string;
  name: string;
  arName: string;
  forms: { isolated: string; initial: string; medial: string; final: string };
  makhraj: MakhrajPoint;
  examples: QuranExample[];
  expectedTranscripts: string[];
}

const LETTER_LESSONS: LetterLesson[] = [
  {
    char: "ا",
    name: "Alif",
    arName: "أَلِف",
    forms: { isolated: "ا", initial: "ا", medial: "ـا", final: "ـا" },
    makhraj: "jawf",
    expectedTranscripts: ["الف", "ألف", "ا", "أ"],
    examples: [
      { word: "الْحَمْدُ", highlighted: "الْحَمْدُ", transliteration: "Al-Hamd", meaning: "The Praise" },
      { word: "أَنْعَمْتَ", highlighted: "أَنْعَمْتَ", transliteration: "An'amta", meaning: "You Bestowed Favor" },
      { word: "اهْدِنَا", highlighted: "اهْدِنَا", transliteration: "Ihdina", meaning: "Guide Us" },
    ],
  },
  {
    char: "ب",
    name: "Ba",
    arName: "بَاء",
    forms: { isolated: "ب", initial: "بـ", medial: "ـبـ", final: "ـب" },
    makhraj: "lips",
    expectedTranscripts: ["باء", "با", "ب"],
    examples: [
      { word: "بِسْمِ", highlighted: "بِسْمِ", transliteration: "Bismi", meaning: "In the name of" },
      { word: "رَبِّ", highlighted: "رَبِّ", transliteration: "Rabbi", meaning: "Lord" },
      { word: "نَعْبُدُ", highlighted: "نَعْبُدُ", transliteration: "Na'budu", meaning: "We worship" },
    ],
  },
  {
    char: "ت",
    name: "Ta",
    arName: "تَاء",
    forms: { isolated: "ت", initial: "تـ", medial: "ـتـ", final: "ـت" },
    makhraj: "lisan_tip",
    expectedTranscripts: ["تاء", "تا", "ت"],
    examples: [
      { word: "أَنْعَمْتَ", highlighted: "أَنْعَمْتَ", transliteration: "An'amta", meaning: "You Bestowed Favor" },
      { word: "نَسْتَعِينُ", highlighted: "نَسْتَعِينُ", transliteration: "Nasta'een", meaning: "We seek help" },
      { word: "الصِّرَاطَ", highlighted: "الصِّرَاطَ", transliteration: "As-Siraat", meaning: "The Path" },
    ],
  },
  {
    char: "ث",
    name: "Tha",
    arName: "ثَاء",
    forms: { isolated: "ث", initial: "ثـ", medial: "ـثـ", final: "ـث" },
    makhraj: "lisan_tip",
    expectedTranscripts: ["ثاء", "ثا", "ث"],
    examples: [
      { word: "ثَبَّتَ", highlighted: "ثَبَّتَ", transliteration: "Thabbata", meaning: "He established" },
      { word: "كَثِيرٌ", highlighted: "كَثِيرٌ", transliteration: "Katheerun", meaning: "Abundant" },
      { word: "حَدِيثُ", highlighted: "حَدِيثُ", transliteration: "Hadeethu", meaning: "Narration" },
    ],
  },
  {
    char: "ج",
    name: "Jeem",
    arName: "جِيم",
    forms: { isolated: "ج", initial: "جـ", medial: "ـجـ", final: "ـج" },
    makhraj: "lisan_mid",
    expectedTranscripts: ["جيم", "جي", "ج"],
    examples: [
      { word: "جَعَلَ", highlighted: "جَعَلَ", transliteration: "Ja'ala", meaning: "He made" },
      { word: "مَسْجِدِ", highlighted: "مَسْجِدِ", transliteration: "Masjidi", meaning: "Mosque" },
      { word: "حَاجٌّ", highlighted: "حَاجٌّ", transliteration: "Haajjun", meaning: "Pilgrim" },
    ],
  },
  {
    char: "ح",
    name: "Haa",
    arName: "حَاء",
    forms: { isolated: "ح", initial: "حـ", medial: "ـحـ", final: "ـح" },
    makhraj: "halq_mid",
    expectedTranscripts: ["حاء", "حا", "ح"],
    examples: [
      { word: "الْحَمْدُ", highlighted: "الْحَمْدُ", transliteration: "Al-Hamd", meaning: "The Praise" },
      { word: "الرَّحْمَٰنِ", highlighted: "الرَّحْمَٰنِ", transliteration: "Ar-Rahmaan", meaning: "The Beneficent" },
      { word: "الرَّحِيمِ", highlighted: "الرَّحِيمِ", transliteration: "Ar-Raheem", meaning: "The Merciful" },
    ],
  },
  {
    char: "خ",
    name: "Khaa",
    arName: "خَاء",
    forms: { isolated: "خ", initial: "خـ", medial: "ـخـ", final: "ـخ" },
    makhraj: "halq_top",
    expectedTranscripts: ["خاء", "خا", "خ"],
    examples: [
      { word: "خَلَقَ", highlighted: "خَلَقَ", transliteration: "Khalaqa", meaning: "He created" },
      { word: "خَالِدِينَ", highlighted: "خَالِدِينَ", transliteration: "Khaalideena", meaning: "Abiding eternally" },
      { word: "يَخْرُجُ", highlighted: "يَخْرُجُ", transliteration: "Yakhruju", meaning: "It emerges" },
    ],
  },
  {
    char: "د",
    name: "Daal",
    arName: "دَال",
    forms: { isolated: "د", initial: "د", medial: "ـد", final: "ـد" },
    makhraj: "lisan_tip",
    expectedTranscripts: ["دال", "دا", "د"],
    examples: [
      { word: "الْحَمْدُ", highlighted: "الْحَمْدُ", transliteration: "Al-Hamd", meaning: "The Praise" },
      { word: "نَعْبُدُ", highlighted: "نَعْبُدُ", transliteration: "Na'budu", meaning: "We worship" },
      { word: "اهْدِنَا", highlighted: "اهْدِنَا", transliteration: "Ihdina", meaning: "Guide Us" },
    ],
  },
  {
    char: "ذ",
    name: "Thaal",
    arName: "ذَال",
    forms: { isolated: "ذ", initial: "ذ", medial: "ـذ", final: "ـذ" },
    makhraj: "lisan_tip",
    expectedTranscripts: ["ذال", "ذا", "ذ"],
    examples: [
      { word: "الَّذِينَ", highlighted: "الَّذِينَ", transliteration: "Al-Ladhina", meaning: "Those who" },
      { word: "ذِكْرُ", highlighted: "ذِكْرُ", transliteration: "Dhikru", meaning: "Remembrance" },
      { word: "أُذُنٌ", highlighted: "أُذُنٌ", transliteration: "Udhunun", meaning: "Ear" },
    ],
  },
  {
    char: "ر",
    name: "Raa",
    arName: "رَاء",
    forms: { isolated: "ر", initial: "ر", medial: "ـر", final: "ـر" },
    makhraj: "lisan_tip",
    expectedTranscripts: ["راء", "را", "ر"],
    examples: [
      { word: "رَبِّ", highlighted: "رَبِّ", transliteration: "Rabbi", meaning: "Lord" },
      { word: "الرَّحْمَٰنِ", highlighted: "الرَّحْمَٰنِ", transliteration: "Ar-Rahmaan", meaning: "The Beneficent" },
      { word: "الرَّحِيمِ", highlighted: "الرَّحِيمِ", transliteration: "Ar-Raheem", meaning: "The Merciful" },
    ],
  },
  {
    char: "ز",
    name: "Zay",
    arName: "زَاي",
    forms: { isolated: "ز", initial: "ز", medial: "ـز", final: "ـز" },
    makhraj: "lisan_tip",
    expectedTranscripts: ["زاي", "زا", "ز"],
    examples: [
      { word: "زَلْزَلَةَ", highlighted: "زَلْزَلَةَ", transliteration: "Zalzalata", meaning: "Earthquake" },
      { word: "تَنْزِيلٌ", highlighted: "تَنْزِيلٌ", transliteration: "Tanzeelun", meaning: "Revelation" },
      { word: "رِزْقٌ", highlighted: "رِزْقٌ", transliteration: "Rizqun", meaning: "Provision" },
    ],
  },
  {
    char: "س",
    name: "Seen",
    arName: "سِين",
    forms: { isolated: "س", initial: "سـ", medial: "ـسـ", final: "ـس" },
    makhraj: "lisan_tip",
    expectedTranscripts: ["سين", "سي", "س"],
    examples: [
      { word: "نَسْتَعِينُ", highlighted: "نَسْتَعِينُ", transliteration: "Nasta'een", meaning: "We seek help" },
      { word: "بِسْمِ", highlighted: "بِسْمِ", transliteration: "Bismi", meaning: "In the name of" },
      { word: "الْمُسْتَقِيمَ", highlighted: "الْمُسْتَقِيمَ", transliteration: "Al-Mustaqeem", meaning: "The Straight" },
    ],
  },
  {
    char: "ش",
    name: "Sheen",
    arName: "شِين",
    forms: { isolated: "ش", initial: "شـ", medial: "ـشـ", final: "ـش" },
    makhraj: "lisan_mid",
    expectedTranscripts: ["شين", "شي", "ش"],
    examples: [
      { word: "شَاءَ", highlighted: "شَاءَ", transliteration: "Shaa'a", meaning: "He willed" },
      { word: "يَشْرَبُ", highlighted: "يَشْرَبُ", transliteration: "Yashrabu", meaning: "He drinks" },
      { word: "عَرْشٌ", highlighted: "عَرْشٌ", transliteration: "'Arshun", meaning: "Throne" },
    ],
  },
  {
    char: "ص",
    name: "Saad",
    arName: "صَاد",
    forms: { isolated: "ص", initial: "صـ", medial: "ـصـ", final: "ـص" },
    makhraj: "lisan_tip",
    expectedTranscripts: ["صاد", "صا", "ص"],
    examples: [
      { word: "الصِّرَاطَ", highlighted: "الصِّرَاطَ", transliteration: "As-Siraat", meaning: "The Path" },
      { word: "صِرَاطَ", highlighted: "صِرَاطَ", transliteration: "Siraata", meaning: "Path of" },
      { word: "أَصْحَابُ", highlighted: "أَصْحَابُ", transliteration: "Ashaabu", meaning: "Companions" },
    ],
  },
  {
    char: "ض",
    name: "Daad",
    arName: "ضَاد",
    forms: { isolated: "ض", initial: "ضـ", medial: "ـضـ", final: "ـض" },
    makhraj: "lisan_side",
    expectedTranscripts: ["ضاد", "ضا", "ض"],
    examples: [
      { word: "الضَّالِّينَ", highlighted: "الضَّالِّينَ", transliteration: "Ad-Daalleen", meaning: "Those astray" },
      { word: "مَغْضُوبِ", highlighted: "مَغْضُوبِ", transliteration: "Maghdoobi", meaning: "Earned anger" },
      { word: "فَضْلٌ", highlighted: "فَضْلٌ", transliteration: "Fadlun", meaning: "Grace/Bounty" },
    ],
  },
  {
    char: "ط",
    name: "Taa",
    arName: "طَاء",
    forms: { isolated: "ط", initial: "طـ", medial: "ـطـ", final: "ـط" },
    makhraj: "lisan_tip",
    expectedTranscripts: ["طاء", "طا", "ط"],
    examples: [
      { word: "الصِّرَاطَ", highlighted: "الصِّرَاطَ", transliteration: "As-Siraat", meaning: "The Path" },
      { word: "صِرَاطَ", highlighted: "صِرَاطَ", transliteration: "Siraata", meaning: "Path of" },
      { word: "طَيِّبٌ", highlighted: "طَيِّبٌ", transliteration: "Tayyibun", meaning: "Good/Pure" },
    ],
  },
  {
    char: "ظ",
    name: "Thaa",
    arName: "ظَاء",
    forms: { isolated: "ظ", initial: "ظـ", medial: "ـظـ", final: "ـظ" },
    makhraj: "lisan_tip",
    expectedTranscripts: ["ظاء", "ظا", "ظ"],
    examples: [
      { word: "ظَلَمَ", highlighted: "ظَلَمَ", transliteration: "Zalama", meaning: "He wronged" },
      { word: "عَظِيمٌ", highlighted: "عَظِيمٌ", transliteration: "'Azeemun", meaning: "Great/Grand" },
      { word: "حَفِظَ", highlighted: "حَفِظَ", transliteration: "Hafiza", meaning: "He guarded" },
    ],
  },
  {
    char: "ع",
    name: "Ayn",
    arName: "عَيْن",
    forms: { isolated: "ع", initial: "عـ", medial: "ـعـ", final: "ـع" },
    makhraj: "halq_mid",
    expectedTranscripts: ["عين", "عي", "ع"],
    examples: [
      { word: "الْعَالَمِينَ", highlighted: "الْعَالَمِينَ", transliteration: "Al-'Aalameen", meaning: "The Worlds" },
      { word: "نَعْبُدُ", highlighted: "نَعْبُدُ", transliteration: "Na'budu", meaning: "We worship" },
      { word: "أَنْعَمْتَ", highlighted: "أَنْعَمْتَ", transliteration: "An'amta", meaning: "You Bestowed Favor" },
    ],
  },
  {
    char: "غ",
    name: "Ghayn",
    arName: "غَيْن",
    forms: { isolated: "غ", initial: "غـ", medial: "ـغـ", final: "ـغ" },
    makhraj: "halq_top",
    expectedTranscripts: ["غين", "غي", "غ"],
    examples: [
      { word: "غَيْرِ", highlighted: "غَيْرِ", transliteration: "Ghayri", meaning: "Not/Other than" },
      { word: "الْمَغْضُوبِ", highlighted: "الْمَغْضُوبِ", transliteration: "Al-Maghdoobi", meaning: "Earned anger" },
      { word: "غَفُورٌ", highlighted: "غَفُورٌ", transliteration: "Ghafoorun", meaning: "Oft-forgiving" },
    ],
  },
  {
    char: "ف",
    name: "Faa",
    arName: "فَاء",
    forms: { isolated: "ف", initial: "فـ", medial: "ـفـ", final: "ـف" },
    makhraj: "lips",
    expectedTranscripts: ["فاء", "فا", "ف"],
    examples: [
      { word: "فِي", highlighted: "فِي", transliteration: "Fee", meaning: "In/Within" },
      { word: "أَفْوَاهِ", highlighted: "أَفْوَاهِ", transliteration: "Afwaahi", meaning: "Mouths" },
      { word: "يَعْرِفُ", highlighted: "يَعْرِفُ", transliteration: "Ya'rifu", meaning: "He recognizes" },
    ],
  },
  {
    char: "ق",
    name: "Qaf",
    arName: "قَاف",
    forms: { isolated: "ق", initial: "قـ", medial: "ـقـ", final: "ـق" },
    makhraj: "lisan_back",
    expectedTranscripts: ["قاف", "قا", "ق"],
    examples: [
      { word: "الْمُسْتَقِيمَ", highlighted: "الْمُسْتَقِيمَ", transliteration: "Al-Mustaqeem", meaning: "The Straight" },
      { word: "قَوْلُ", highlighted: "قَوْلُ", transliteration: "Qawlu", meaning: "Word/Statement" },
      { word: "خَلَقَ", highlighted: "خَلَقَ", transliteration: "Khalaqa", meaning: "He created" },
    ],
  },
  {
    char: "ك",
    name: "Kaf",
    arName: "كَاف",
    forms: { isolated: "ك", initial: "كـ", medial: "ـكـ", final: "ـك" },
    makhraj: "lisan_back",
    expectedTranscripts: ["كاف", "كا", "ك"],
    examples: [
      { word: "مَالِكِ", highlighted: "مَالِكِ", transliteration: "Maaliki", meaning: "Owner/Master" },
      { word: "إِيَّاكُ", highlighted: "إِيَّاكُ", transliteration: "Iyyaaka", meaning: "You Alone" },
      { word: "كُفُوًا", highlighted: "كُفُوًا", transliteration: "Kufuwan", meaning: "Equal" },
    ],
  },
  {
    char: "ل",
    name: "Laam",
    arName: "لَام",
    forms: { isolated: "ل", initial: "لـ", medial: "ـلـ", final: "ـل" },
    makhraj: "lisan_tip",
    expectedTranscripts: ["لام", "لا", "ل"],
    examples: [
      { word: "اللَّهِ", highlighted: "اللَّهِ", transliteration: "Lillahi", meaning: "For Allah" },
      { word: "الْعَالَمِينَ", highlighted: "الْعَالَمِينَ", transliteration: "Al-'Aalameen", meaning: "The Worlds" },
      { word: "الضَّالِّينَ", highlighted: "الضَّالِّينَ", transliteration: "Ad-Daalleen", meaning: "Those astray" },
    ],
  },
  {
    char: "م",
    name: "Meem",
    arName: "مِيم",
    forms: { isolated: "م", initial: "مـ", medial: "ـمـ", final: "ـم" },
    makhraj: "lips",
    expectedTranscripts: ["ميم", "مي", "م"],
    examples: [
      { word: "بِسْمِ", highlighted: "بِسْمِ", transliteration: "Bismi", meaning: "In the name of" },
      { word: "الْحَمْدُ", highlighted: "الْحَمْدُ", transliteration: "Al-Hamd", meaning: "The Praise" },
      { word: "الْمُسْتَقِيمَ", highlighted: "الْمُسْتَقِيمَ", transliteration: "Al-Mustaqeem", meaning: "The Straight" },
    ],
  },
  {
    char: "ن",
    name: "Noon",
    arName: "نُون",
    forms: { isolated: "ن", initial: "نـ", medial: "ـنـ", final: "ـن" },
    makhraj: "lisan_tip",
    expectedTranscripts: ["نون", "نو", "ن"],
    examples: [
      { word: "الرَّحْمَٰنِ", highlighted: "الرَّحْمَٰنِ", transliteration: "Ar-Rahmaan", meaning: "The Beneficent" },
      { word: "نَسْتَعِينُ", highlighted: "نَسْتَعِينُ", transliteration: "Nasta'een", meaning: "We seek help" },
      { word: "أَنْعَمْتَ", highlighted: "أَنْعَمْتَ", transliteration: "An'amta", meaning: "You Bestowed Favor" },
    ],
  },
  {
    char: "ه",
    name: "Haa",
    arName: "هَاء",
    forms: { isolated: "ه", initial: "هـ", medial: "ـهـ", final: "ـه" },
    makhraj: "halq_deep",
    expectedTranscripts: ["هاء", "ها", "ه"],
    examples: [
      { word: "عَلَيْهِمْ", highlighted: "عَلَيْهِمْ", transliteration: "Alayhim", meaning: "Upon them" },
      { word: "اهْدِنَا", highlighted: "اهْدِنَا", transliteration: "Ihdina", meaning: "Guide Us" },
      { word: "لَّهُ", highlighted: "لَّهُ", transliteration: "Lahoo", meaning: "For Him" },
    ],
  },
  {
    char: "و",
    name: "Waw",
    arName: "وَاو",
    forms: { isolated: "و", initial: "و", medial: "ـو", final: "ـو" },
    makhraj: "lips",
    expectedTranscripts: ["واو", "وا", "و"],
    examples: [
      { word: "يَوْمِ", highlighted: "يَوْمِ", transliteration: "Yawm", meaning: "Day" },
      { word: "وَلَا", highlighted: "وَلَا", transliteration: "Wa-Laa", meaning: "And not" },
      { word: "يُولَدْ", highlighted: "يُولَدْ", transliteration: "Yoolad", meaning: "Born" },
    ],
  },
  {
    char: "ي",
    name: "Yaa",
    arName: "يَاء",
    forms: { isolated: "ي", initial: "يـ", medial: "ـيـ", final: "ـي" },
    makhraj: "lisan_mid",
    expectedTranscripts: ["ياء", "يا", "ي"],
    examples: [
      { word: "إِيَّاكُ", highlighted: "إِيَّاكُ", transliteration: "Iyyaaka", meaning: "You Alone" },
      { word: "الرَّحِيمِ", highlighted: "الرَّحِيمِ", transliteration: "Ar-Raheem", meaning: "The Merciful" },
      { word: "نَسْتَعِينُ", highlighted: "نَسْتَعِينُ", transliteration: "Nasta'een", meaning: "We seek help" },
    ],
  },
];

export default function LetterLessonPage() {
  const params = useParams();
  const router = useRouter();

  const letterId = Number(params?.letterId);
  const lesson = LETTER_LESSONS[letterId];

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [asrResult, setAsrResult] = useState<"none" | "success" | "retry">("none");
  const [spokenWord, setSpokenWord] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const recorderRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const audioAvailable = true;

  useEffect(() => {
    if (!lesson) {
      router.push("/learn/arabic-letters");
      return;
    }

    // Track lesson start event
    trackEvent("lesson_start", "learning", `letter_${letterId}`);

    // Load progress
    const prog = getLearningProgress();
    const completed = prog.some(
      (p) => p.track === "letters" && p.lesson_id === `letter_${letterId}` && p.completed
    );
    setIsCompleted(completed);
  }, [letterId, lesson, router]);

  if (!lesson) return null;

  const playLetter = async () => {
    setIsPlaying(true);
    try {
      const audioMgr = QariAudioManager.getInstance();
      await audioMgr.playLetter(lesson.char);
    } catch (err) {
      console.warn("Letter Qari audio is missing:", err);
    } finally {
      setIsPlaying(false);
    }
  };

  const playExampleWord = async (word: string) => {
    try {
      const audioMgr = QariAudioManager.getInstance();
      // Using Surah 1 (Al-Fatiha) as standard mock surah ID for word pronunciations
      await audioMgr.playWord(word, 1);
    } catch (err) {
      console.warn("Word Qari audio is missing:", err);
    }
  };

  const checkPronunciation = (spoken: string): boolean => {
    setSpokenWord(spoken);
    const cleanSpoken = stripDiacritics(spoken.trim());
    
    let isMatch = false;
    // 1. Direct match with expectedTranscripts
    if (lesson.expectedTranscripts.some((t) => {
      const cleanT = stripDiacritics(t);
      return cleanSpoken === cleanT || cleanSpoken.includes(cleanT) || cleanT.includes(cleanSpoken);
    })) {
      isMatch = true;
    } 
    // 2. Transliteration name match (e.g., Alif, Baa, Taa)
    else if (lesson.name && cleanSpoken.toLowerCase().includes(lesson.name.toLowerCase())) {
      isMatch = true;
    }
    // 3. Char match or similarity match
    else if (cleanSpoken.includes(lesson.char) || arabicSimilarity(cleanSpoken, lesson.char) >= 0.45) {
      isMatch = true;
    }

    if (isMatch) {
      setAsrResult("success");
      setIsCompleted(true);
      trackEvent("lesson_complete", "learning", `letter_${letterId}`);
      saveLearningProgress({
        track: "letters",
        lesson_id: `letter_${letterId}`,
        completed: true,
        score: 100,
      });
      return true;
    } else {
      setAsrResult("retry");
      return false;
    }
  };

  const stopRecordingAndProcess = async () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsRecording(false);

    try {
      if (recorderRef.current && recorderRef.current.isRecording()) {
        setSpokenWord("Processing...");
        const audioBlob = await recorderRef.current.stop();
        const result = await transcribeAudio(audioBlob, 'letter');

        if (!result.success || !result.transcript) {
          setAsrResult("retry");
          if (result.error === "NO_AUDIO_DETECTED") {
            setSpokenWord("We couldn't hear anything. Speak louder and try again.");
          } else {
            setSpokenWord("Could not hear you clearly. Please try again.");
          }
          return;
        }

        checkPronunciation(result.transcript);
      }
    } catch (err) {
      console.error("Recording stop/transcription failed:", err);
      setAsrResult("retry");
      setSpokenWord("Could not hear you. Please try again.");
    }
  };

  const handleMicTap = async () => {
    if (isRecording) {
      stopRecordingAndProcess();
    } else {
      try {
        if (!recorderRef.current) {
          const { AudioRecorder } = await import("@/lib/speech/recorder");
          recorderRef.current = new AudioRecorder();
        }
        await recorderRef.current.start();
        setIsRecording(true);
        setAsrResult("none");
        setSpokenWord("Listening...");

        // Try Web Speech API for instant real-time detection
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SR) {
          try {
            const recognition = new SR();
            recognition.lang = 'ar-SA';
            recognition.continuous = true;
            recognition.interimResults = true;
            recognitionRef.current = recognition;

            recognition.onresult = (event: any) => {
              for (let i = event.resultIndex; i < event.results.length; i++) {
                const text = event.results[i][0].transcript.trim();
                if (text) {
                  setSpokenWord(text);
                  const matched = checkPronunciation(text);
                  if (matched) {
                    try { recognition.stop(); } catch {}
                    if (recorderRef.current && recorderRef.current.isRecording()) {
                      recorderRef.current.stop().catch(() => {});
                    }
                    setIsRecording(false);
                    return;
                  }
                }
              }
            };

            recognition.onerror = () => {};
            recognition.start();
          } catch (e) {
            console.warn("Web Speech API init failed:", e);
          }
        }

        // Auto-process after 3.5s if not matched instantly
        setTimeout(() => {
          if (recorderRef.current && recorderRef.current.isRecording()) {
            stopRecordingAndProcess();
          }
        }, 3500);

      } catch (err: any) {
        console.error("Microphone start failed:", err);
        setAsrResult("retry");
        setSpokenWord(err.message || "Microphone access denied.");
      }
    }
  };

  const nextId = letterId + 1;
  const hasNext = nextId < LETTER_LESSONS.length;

  return (
    <div className="min-h-screen flex flex-col pb-28 md:pb-16 relative bg-[#faf6ee] dark:bg-zinc-950 text-[#1a1208] dark:text-zinc-100 transition-colors duration-200">
      <Header showSettingsBtn onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsDrawer isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 mt-6 flex flex-col gap-6 relative z-10">
        
        {/* Navigation back */}
        <section className="flex justify-between items-center text-center">
          <Link href="/learn/arabic-letters" className="text-gold font-bold text-xs uppercase tracking-wider hover:text-gold-light">
            ← Back to Alphabet Index
          </Link>
          <div className="flex gap-2">
            {isCompleted && (
              <span className="px-3 py-1 bg-emerald-pale border border-emerald/30 text-emerald font-bold text-[9px] uppercase tracking-wider rounded-full">
                ✓ Lesson Completed
              </span>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          
          {/* LEFT COLUMN: Large Letter Card and Repeating (7 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Main Letter Display Card */}
            <div className="card mushaf-paper-texture border-[3px] border-double border-gold/60 p-6 md:p-8 flex flex-col items-center justify-center text-center gap-6 relative min-h-[340px]">
              <span className="absolute top-4 left-4 text-[10px] font-bold text-zinc-400 font-lato">
                LESSON {letterId + 1} OF 28
              </span>

              {/* Big letter */}
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl bg-[#faf6ee] dark:bg-zinc-900 border border-gold/15 flex items-center justify-center shadow-inner mt-4">
                <span className="font-amiri-quran text-[90px] md:text-[110px] text-ink dark:text-zinc-100 leading-none mt-2 select-none text-center">
                  {lesson.char}
                </span>
              </div>

              <div className="text-center w-full">
                <h3 className="font-amiri text-2xl md:text-3xl font-bold text-emerald dark:text-emerald-light text-center">
                  {lesson.name} · <span className="text-gold font-normal">{lesson.arName}</span>
                </h3>
              </div>

              {/* Letters Forms side by side */}
              <div className="border-t border-b border-gold/15 py-4 w-full grid grid-cols-4 text-center mt-1">
                <div className="text-center">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block mb-1 text-center">Isolated</span>
                  <span className="font-amiri text-2xl text-ink dark:text-zinc-100 font-bold text-center block">{lesson.forms.isolated}</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block mb-1 text-center">Initial</span>
                  <span className="font-amiri text-2xl text-ink dark:text-zinc-100 font-bold text-center block">{lesson.forms.initial}</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block mb-1 text-center">Medial</span>
                  <span className="font-amiri text-2xl text-ink dark:text-zinc-100 font-bold text-center block">{lesson.forms.medial}</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block mb-1 text-center">Final</span>
                  <span className="font-amiri text-2xl text-ink dark:text-zinc-100 font-bold text-center block">{lesson.forms.final}</span>
                </div>
              </div>

              {/* Top Recitation Mic Checker (Easy Mobile Access) */}
              <div className="flex flex-col items-center justify-center gap-3 w-full bg-white/80 dark:bg-zinc-900/80 border border-gold/25 p-4 rounded-2xl shadow-xs text-center mt-2">
                <div className="flex items-center gap-3 justify-center flex-wrap">
                  {/* Qari Audio Listen button */}
                  {audioAvailable ? (
                    <button
                      onClick={playLetter}
                      disabled={isPlaying}
                      className="px-4 py-2.5 bg-gold hover:bg-gold-light text-white font-bold text-xs tracking-wider rounded-xl uppercase transition-all shadow-sm flex items-center justify-center gap-1.5 text-center cursor-pointer"
                    >
                      <span>🔊</span>
                      <span>{isPlaying ? "Playing..." : "Listen"}</span>
                    </button>
                  ) : (
                    <span className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 rounded-xl uppercase select-none text-center">
                      🔊 Audio coming soon
                    </span>
                  )}

                  {/* Recitation Mic Checker Button */}
                  <button
                    onClick={handleMicTap}
                    className={`px-4 py-2.5 rounded-xl font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 text-center transition-all shadow-md active:scale-95 cursor-pointer ${
                      isRecording
                        ? "bg-ruby text-white animate-pulse shadow-ruby/20"
                        : asrResult === "success"
                        ? "bg-emerald text-white shadow-emerald/20"
                        : "bg-emerald hover:bg-emerald-light text-white shadow-emerald/20"
                    }`}
                  >
                    <span>{isRecording ? "🎙️" : "🎤"}</span>
                    <span>{isRecording ? "Listening..." : "Check Recitation"}</span>
                  </button>
                </div>

                {/* Real-Time Pronunciation Feedback Result */}
                <AnimatePresence mode="wait">
                  {isRecording && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-zinc-600 dark:text-zinc-300 font-bold animate-pulse tracking-wide text-center"
                    >
                      🎙️ Speak letter &ldquo;{lesson.char}&rdquo; ({lesson.name}) now...
                    </motion.span>
                  )}

                  {spokenWord === "Processing..." && (
                    <span className="text-xs text-zinc-500 font-semibold animate-pulse text-center">
                      Analyzing audio...
                    </span>
                  )}

                  {asrResult === "success" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-emerald-pale/60 dark:bg-emerald-950/40 border border-emerald/30 px-3.5 py-1.5 rounded-xl text-center flex items-center justify-center gap-1"
                    >
                      <span className="text-emerald dark:text-emerald-light font-extrabold text-xs text-center">✓ Correct</span>
                    </motion.div>
                  )}

                  {asrResult === "retry" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-ruby-pale/60 dark:bg-ruby-pale/30 border border-ruby/30 px-3.5 py-1.5 rounded-xl text-center flex items-center justify-center gap-1"
                    >
                      <span className="text-ruby dark:text-red-400 font-extrabold text-xs text-center">Let&apos;s try that again</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* Quranic Words Examples Section */}
            <div className="card p-6 border-gold/30 bg-white/70 dark:bg-zinc-900/30 flex flex-col gap-4 items-center text-center">
              <h4 className="font-bold text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-center block mb-1">
                Quranic Words Examples · أمثلة من القرآن الكريم
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                {lesson.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-gold/15 bg-[#faf6ee]/60 dark:bg-zinc-800/40 rounded-2xl flex flex-col items-center justify-between text-center min-h-[140px]"
                  >
                    <div className="flex flex-col items-center text-center">
                      <span className="font-amiri-quran text-2xl text-ink dark:text-zinc-100 font-bold leading-relaxed text-center">
                        {ex.word}
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold tracking-wider italic mt-2 text-center">
                        {ex.transliteration}
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 text-center">
                        {ex.meaning}
                      </span>
                    </div>

                    <button
                      onClick={() => playExampleWord(ex.word)}
                      className="mt-3 text-[10px] font-bold text-gold hover:text-gold-light uppercase tracking-wider flex items-center justify-center gap-1.5 text-center"
                    >
                      Listen 🔊
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Makhraj Point Profile and Micro Recitation (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Makhraj organ diagram */}
            <MakhrajDiagram activePoint={lesson.makhraj} className="w-full" />

            {/* Repeat Section Card */}
            <div className="card p-6 border-gold/30 bg-white/70 dark:bg-zinc-900/30 flex flex-col gap-5 text-center items-center justify-center">
              <div className="text-center">
                <h4 className="font-bold text-[10px] text-gold uppercase tracking-[2px] block mb-1 text-center">
                  Repeat After Me · تدريب النطق
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed text-center">
                  Listen to the pronunciation above, then click the mic button to practice speaking the letter.
                </p>
              </div>

              {/* Mic action buttons */}
              <button
                onClick={handleMicTap}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                  isRecording
                    ? "bg-ruby text-white animate-pulse shadow-ruby/20 scale-105"
                    : "bg-emerald hover:bg-emerald-light text-white shadow-emerald/20 hover:scale-102"
                }`}
              >
                {isRecording ? (
                  <span className="text-xl">🎙️</span>
                ) : (
                  <span className="text-xl">🎤</span>
                )}
              </button>

              {/* ASR Feedback Display */}
              <AnimatePresence mode="wait">
                {isRecording && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-zinc-500 font-bold animate-pulse tracking-wide text-center"
                  >
                    Listening... Speak now
                  </motion.span>
                )}

                {asrResult === "success" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-pale/35 border border-emerald/20 px-4 py-2 rounded-xl text-center flex flex-col items-center justify-center gap-0.5"
                  >
                    <span className="text-emerald dark:text-emerald-light font-bold text-xs text-center">✓ Correct</span>
                    <span className="text-[9px] text-zinc-500 dark:text-zinc-400 leading-none text-center">Press Next to proceed.</span>
                  </motion.div>
                )}

                {asrResult === "retry" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-ruby-pale/35 border border-ruby/20 px-4 py-2 rounded-xl text-center flex flex-col items-center justify-center gap-0.5"
                  >
                    <span className="text-ruby dark:text-red-400 font-bold text-xs text-center">Let&apos;s try that again</span>
                    <span className="text-[9px] text-zinc-500 dark:text-zinc-400 leading-none text-center">Listen to Qari above and repeat.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Next/Back Navigation Buttons */}
              <div className="flex gap-2 w-full mt-2 border-t border-gold/15 pt-4">
                {hasNext && (
                  <button
                    onClick={() => router.push(`/learn/arabic-letters/${nextId}`)}
                    className="flex-1 py-3 bg-emerald hover:bg-emerald-light text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md shadow-emerald/10 text-center"
                  >
                    Next Letter →
                  </button>
                )}
              </div>

            </div>

          </div>
        </section>

      </main>

      <BottomNav onOpenSettings={() => setSettingsOpen(true)} />
    </div>
  );
}
