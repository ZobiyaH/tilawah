"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Layout/Header";
import BottomNav from "@/components/Layout/BottomNav";
import { QariAudioManager } from "@/lib/qariAudio";
import { saveLearningProgress, getLearningProgress } from "@/lib/progress";

interface QuizQuestion {
  audioWord: string;
  options: string[];
  answerIdx: number;
  explainText: string;
}

interface LetterExample {
  char: string;
  word: string;
  displayWord: string;
  meaning: string;
  englishSound: string;
}

interface HarakatLesson {
  id: string;
  name: string;
  mark: string;
  description: string;
  exampleLetter: string;
  exampleExplain: string;
  exampleWord: string;
  exampleWordMeaning: string;
  letters: LetterExample[];
  words: { arabic: string; transliteration: string; meaning: string }[];
  quizQuestions: QuizQuestion[];
}

const HARAKAT_LESSONS: HarakatLesson[] = [
  {
    id: "harakat_0",
    name: "Fatha",
    mark: "◌َ",
    description: "This tiny mark above a letter is called a Fatha. It makes a short 'a' sound - like the 'a' in 'apple'.",
    exampleLetter: "بَ",
    exampleExplain: "Ba + Fatha = Ba",
    exampleWord: "بَلْ",
    exampleWordMeaning: "Nay / But",
    letters: [
      { char: "بَ", word: "بَلْ", displayWord: "بَ in بَلْ", meaning: "Nay / But", englishSound: "Ba" },
      { char: "تَ", word: "تَرَى", displayWord: "تَ in تَرَى", meaning: "You see", englishSound: "Ta" },
      { char: "سَ", word: "سَبِيلٍ", displayWord: "سَ in سَبِيلٍ", meaning: "Way / Path", englishSound: "Sa" },
      { char: "كَ", word: "كَثِيرٌ", displayWord: "كَ in كَثِيرٌ", meaning: "Abundant", englishSound: "Ka" },
      { char: "مَ", word: "مَعَ", displayWord: "مَ in مَعَ", meaning: "With", englishSound: "Ma" }
    ],
    words: [
      { arabic: "خَلَقَ", transliteration: "Khalaqa", meaning: "He created" },
      { arabic: "جَعَلَ", transliteration: "Ja'ala", meaning: "He made" },
      { arabic: "حَسَدَ", transliteration: "Hasada", meaning: "He envied" }
    ],
    quizQuestions: [
      { audioWord: "خَلَقَ", options: ["◌َ", "◌ِ", "◌ُ"], answerIdx: 0, explainText: "Fatha (◌َ)" },
      { audioWord: "جَعَلَ", options: ["◌َ", "◌ِ", "◌ُ"], answerIdx: 0, explainText: "Fatha (◌َ)" },
      { audioWord: "حَسَدَ", options: ["◌َ", "◌ِ", "◌ُ"], answerIdx: 0, explainText: "Fatha (◌َ)" }
    ]
  },
  {
    id: "harakat_1",
    name: "Kasra",
    mark: "◌ِ",
    description: "This tiny mark below a letter is called a Kasra. It makes a short 'i' sound - like the 'i' in 'pin'.",
    exampleLetter: "بِ",
    exampleExplain: "Ba + Kasra = Bi",
    exampleWord: "بِسْمِ",
    exampleWordMeaning: "In name of",
    letters: [
      { char: "بِ", word: "بِسْمِ", displayWord: "بِ in بِسْمِ", meaning: "In name of", englishSound: "Bi" },
      { char: "مِ", word: "مِنْ", displayWord: "مِ in مِنْ", meaning: "From", englishSound: "Mi" },
      { char: "هِ", word: "إِلَٰهِ", displayWord: "هِ in إِلَٰهِ", meaning: "Deity / God", englishSound: "Hi" },
      { char: "فِ", word: "فِي", displayWord: "فِ in فِي", meaning: "In", englishSound: "Fi" },
      { char: "حِ", word: "الرَّحِيمِ", displayWord: "حِ in الرَّحِيمِ", meaning: "Merciful", englishSound: "Hi" }
    ],
    words: [
      { arabic: "بِسْمِ", transliteration: "Bismi", meaning: "In the name of" },
      { arabic: "بِهِ", transliteration: "Bihee", meaning: "With it" },
      { arabic: "فِيهِ", transliteration: "Feehi", meaning: "In it" }
    ],
    quizQuestions: [
      { audioWord: "بِسْمِ", options: ["◌َ", "◌ِ", "◌ُ"], answerIdx: 1, explainText: "Kasra (◌ِ)" },
      { audioWord: "بِهِ", options: ["◌َ", "◌ِ", "◌ُ"], answerIdx: 1, explainText: "Kasra (◌ِ)" },
      { audioWord: "فِيهِ", options: ["◌َ", "◌ِ", "◌ُ"], answerIdx: 1, explainText: "Kasra (◌ِ)" }
    ]
  },
  {
    id: "harakat_2",
    name: "Damma",
    mark: "◌ُ",
    description: "This tiny loop placed above a letter is called a Damma. It makes a short 'u' sound - like the 'u' in 'put'.",
    exampleLetter: "هُ",
    exampleExplain: "Ha + Damma = Hu",
    exampleWord: "هُوَ",
    exampleWordMeaning: "He",
    letters: [
      { char: "هُ", word: "هُوَ", displayWord: "هُ in هُوَ", meaning: "He", englishSound: "Hu" },
      { char: "قُ", word: "قُلْ", displayWord: "قُ in قُلْ", meaning: "Say", englishSound: "Qu" },
      { char: "يُ", word: "يُولَدْ", displayWord: "يُ in يُولَدْ", meaning: "Begotten", englishSound: "Yu" },
      { char: "عُ", word: "أَعُوذُ", displayWord: "عُ in أَعُوذُ", meaning: "I seek refuge", englishSound: "‘U" },
      { char: "سُ", word: "يُوَسْوِسُ", displayWord: "سُ in يُوَسْوِسُ", meaning: "He whispers", englishSound: "Su" }
    ],
    words: [
      { arabic: "نَعْبُدُ", transliteration: "Na'budu", meaning: "We worship" },
      { arabic: "قُلْ", transliteration: "Qul", meaning: "Say" },
      { arabic: "هُوَ", transliteration: "Huwa", meaning: "He" }
    ],
    quizQuestions: [
      { audioWord: "نَعْبُدُ", options: ["◌َ", "◌ِ", "◌ُ"], answerIdx: 2, explainText: "Damma (◌ُ)" },
      { audioWord: "قُلْ", options: ["◌َ", "◌ِ", "◌ُ"], answerIdx: 2, explainText: "Damma (◌ُ)" },
      { audioWord: "هُوَ", options: ["◌َ", "◌ِ", "◌ُ"], answerIdx: 2, explainText: "Damma (◌ُ)" }
    ]
  },
  {
    id: "harakat_3",
    name: "Sukoon",
    mark: "◌ْ",
    description: "This small circle above a letter is called a Sukoon. It indicates silence - the vowel stops completely.",
    exampleLetter: "مْ",
    exampleExplain: "Meem + Sukoon = M (stops)",
    exampleWord: "لَمْ",
    exampleWordMeaning: "Did not",
    letters: [
      { char: "مْ", word: "لَمْ", displayWord: "مْ in لَمْ", meaning: "Did not", englishSound: "m" },
      { char: "دْ", word: "يَلِدْ", displayWord: "دْ in يَلِدْ", meaning: "He begets", englishSound: "d" },
      { char: "نْ", word: "أَنْعَمْتَ", displayWord: "نْ in أَنْعَمْتَ", meaning: "Bestowed favor", englishSound: "n" },
      { char: "لْ", word: "الْحَمْدُ", displayWord: "لْ in الْحَمْدُ", meaning: "All praise", englishSound: "l" },
      { char: "قْ", word: "الْفَلَقِ", displayWord: "قْ in الْفَلَقِ", meaning: "Daybreak", englishSound: "q" }
    ],
    words: [
      { arabic: "الْحَمْدُ", transliteration: "Al-Hamd", meaning: "The Praise" },
      { arabic: "أَنْعَمْتَ", transliteration: "An'amta", meaning: "You Bestowed Favor" },
      { arabic: "يَلِدْ", transliteration: "Yalid", meaning: "He begets" }
    ],
    quizQuestions: [
      { audioWord: "لَمْ", options: ["◌ْ", "◌ّ", "◌ً"], answerIdx: 0, explainText: "Sukoon (◌ْ)" },
      { audioWord: "يَلِدْ", options: ["◌ْ", "◌ّ", "◌ً"], answerIdx: 0, explainText: "Sukoon (◌ْ)" },
      { audioWord: "الْحَمْدُ", options: ["◌ْ", "◌ّ", "◌ً"], answerIdx: 0, explainText: "Sukoon (◌ْ)" }
    ]
  },
  {
    id: "harakat_4",
    name: "Shadda",
    mark: "◌ّ",
    description: "This mark above a letter is called a Shadda. It means the letter is doubled, spoken with a tiny hold and emphasis.",
    exampleLetter: "بّ",
    exampleExplain: "Ba + Shadda = Bb (doubled)",
    exampleWord: "رَبِّ",
    exampleWordMeaning: "Lord",
    letters: [
      { char: "بّ", word: "رَبِّ", displayWord: "بّ in رَبِّ", meaning: "Lord", englishSound: "bb" },
      { char: "رّ", word: "شَرِّ", displayWord: "رّ in شَرِّ", meaning: "Evil of", englishSound: "rr" },
      { char: "نّ", word: "النَّاسِ", displayWord: "نّ in النَّاسِ", meaning: "Mankind", englishSound: "nn" },
      { char: "مّ", word: "ثُمَّ", displayWord: "مّ in ثُمَّ", meaning: "Then", englishSound: "mm" },
      { char: "لّ", word: "الضَّالِّينَ", displayWord: "لّ in الضَّالِّينَ", meaning: "Those astray", englishSound: "ll" }
    ],
    words: [
      { arabic: "رَبِّ", transliteration: "Rabbi", meaning: "Lord" },
      { arabic: "الرَّحِيمِ", transliteration: "Ar-Raheem", meaning: "The Merciful" },
      { arabic: "ثُمَّ", transliteration: "Thumma", meaning: "Then" }
    ],
    quizQuestions: [
      { audioWord: "رَبِّ", options: ["◌ْ", "◌ّ", "◌ُ"], answerIdx: 1, explainText: "Shadda (◌ّ)" },
      { audioWord: "الرَّحِيمِ", options: ["◌ْ", "◌ّ", "◌ِ"], answerIdx: 1, explainText: "Shadda (◌ّ)" },
      { audioWord: "ثُمَّ", options: ["◌ْ", "◌ّ", "◌َ"], answerIdx: 1, explainText: "Shadda (◌ّ)" }
    ]
  },
  {
    id: "harakat_5",
    name: "Tanwin Fath",
    mark: "◌ً",
    description: "Two Fathas together are called Tanwin Fath. It creates an 'an' sound at the end of the word.",
    exampleLetter: "وً",
    exampleExplain: "Waw + Tanwin Fath = Wan",
    exampleWord: "كُفُوًا",
    exampleWordMeaning: "Equal",
    letters: [
      { char: "وً", word: "كُفُوًا", displayWord: "وً in كُفُوًا", meaning: "Equal", englishSound: "wan" },
      { char: "جً", word: "أَفْوَاجًا", displayWord: "جً in أَفْوَاجًا", meaning: "In crowds", englishSound: "jan" },
      { char: "رً", word: "شَكُورًا", displayWord: "رً in شَكُورًا", meaning: "Grateful", englishSound: "ran" },
      { char: "وً", word: "كُفُوًا", displayWord: "وً in كُفُوًا", meaning: "Equal", englishSound: "wan" },
      { char: "جً", word: "أَفْوَاجًا", displayWord: "جً in أَفْوَاجًا", meaning: "In crowds", englishSound: "jan" }
    ],
    words: [
      { arabic: "كُفُوًا", transliteration: "Kufuwan", meaning: "Equal" },
      { arabic: "أَفْوَاجًا", transliteration: "Afwaajan", meaning: "In crowds" },
      { arabic: "شَكُورًا", transliteration: "Shakooran", meaning: "Grateful" }
    ],
    quizQuestions: [
      { audioWord: "كُفُوًا", options: ["◌ً", "◌ٍ", "◌ٌ"], answerIdx: 0, explainText: "Tanwin Fath (◌ً)" },
      { audioWord: "أَفْوَاجًا", options: ["◌ً", "◌ٍ", "◌ٌ"], answerIdx: 0, explainText: "Tanwin Fath (◌ً)" },
      { audioWord: "شَكُورًا", options: ["◌ً", "◌ٍ", "◌ٌ"], answerIdx: 0, explainText: "Tanwin Fath (◌ً)" }
    ]
  },
  {
    id: "harakat_6",
    name: "Tanwin Kasr",
    mark: "◌ٍ",
    description: "Two Kasras below are called Tanwin Kasr. It creates an 'in' sound at the end of the word.",
    exampleLetter: "قٍ",
    exampleExplain: "Qaaf + Tanwin Kasr = Qin",
    exampleWord: "غَاسِقٍ",
    exampleWordMeaning: "Darkness",
    letters: [
      { char: "قٍ", word: "غَاسِقٍ", displayWord: "قٍ in غَاسِقٍ", meaning: "Darkness", englishSound: "qin" },
      { char: "دٍ", word: "حَاسِدٍ", displayWord: "دٍ in حَاسِدٍ", meaning: "Envier", englishSound: "din" },
      { char: "قٍ", word: "غَاسِقٍ", displayWord: "قٍ in غَاسِقٍ", meaning: "Darkness", englishSound: "qin" },
      { char: "دٍ", word: "حَاسِدٍ", displayWord: "دٍ in حَاسِدٍ", meaning: "Envier", englishSound: "din" },
      { char: "قٍ", word: "غَاسِقٍ", displayWord: "قٍ in غَاسِقٍ", meaning: "Darkness", englishSound: "qin" }
    ],
    words: [
      { arabic: "غَاسِقٍ", transliteration: "Ghaasiqin", meaning: "Darkness" },
      { arabic: "حَاسِدٍ", transliteration: "Haasidin", meaning: "Envier" },
      { arabic: "غَاسِقٍ", transliteration: "Ghaasiqin", meaning: "Darkness" }
    ],
    quizQuestions: [
      { audioWord: "غَاسِقٍ", options: ["◌ً", "◌ٍ", "◌ٌ"], answerIdx: 1, explainText: "Tanwin Kasr (◌ٍ)" },
      { audioWord: "حَاسِدٍ", options: ["◌ً", "◌ٍ", "◌ٌ"], answerIdx: 1, explainText: "Tanwin Kasr (◌ٍ)" },
      { audioWord: "غَاسِقٍ", options: ["◌ً", "◌ٍ", "◌ٌ"], answerIdx: 1, explainText: "Tanwin Kasr (◌ٍ)" }
    ]
  },
  {
    id: "harakat_7",
    name: "Tanwin Damm",
    mark: "◌ٌ",
    description: "Two Dammas are called Tanwin Damm. It creates an 'un' sound at the end of the word.",
    exampleLetter: "دٌ",
    exampleExplain: "Dal + Tanwin Damm = Dun",
    exampleWord: "أَحَدٌ",
    exampleWordMeaning: "One",
    letters: [
      { char: "دٌ", word: "أَحَدٌ", displayWord: "دٌ in أَحَدٌ", meaning: "One", englishSound: "dun" },
      { char: "رٌ", word: "كثير", displayWord: "رٌ in كَثِيرٌ", meaning: "Abundant", englishSound: "run" },
      { char: "دٌ", word: "أَحَدٌ", displayWord: "دٌ in أَحَدٌ", meaning: "One", englishSound: "dun" },
      { char: "رٌ", word: "كثير", displayWord: "رٌ in كَثِيرٌ", meaning: "Abundant", englishSound: "run" },
      { char: "دٌ", word: "أَحَدٌ", displayWord: "دٌ in أَحَدٌ", meaning: "One", englishSound: "dun" }
    ],
    words: [
      { arabic: "أَحَدٌ", transliteration: "Ahadun", meaning: "One" },
      { arabic: "كثير", transliteration: "Katheerun", meaning: "Abundant" },
      { arabic: "أَحَدٌ", transliteration: "Ahadun", meaning: "One" }
    ],
    quizQuestions: [
      { audioWord: "أَحَدٌ", options: ["◌ً", "◌ٍ", "◌ٌ"], answerIdx: 2, explainText: "Tanwin Damm (◌ٌ)" },
      { audioWord: "كثير", options: ["◌ً", "◌ٍ", "◌ٌ"], answerIdx: 2, explainText: "Tanwin Damm (◌ٌ)" },
      { audioWord: "أَحَدٌ", options: ["◌ً", "◌ٍ", "◌ٌ"], answerIdx: 2, explainText: "Tanwin Damm (◌ٌ)" }
    ]
  },
  {
    id: "harakat_8",
    name: "Madd Alif",
    mark: "◌َا",
    description: "An Alif following a Fatha is called Madd Alif. It stretches the short 'a' into a long 'aa' sound.",
    exampleLetter: "جَا",
    exampleExplain: "Jeem + Madd Alif = Jaa",
    exampleWord: "جَاءَ",
    exampleWordMeaning: "He came",
    letters: [
      { char: "لَّا", word: "الضَّالِّينَ", displayWord: "لَّا in الضَّالِّينَ", meaning: "Those astray", englishSound: "laa" },
      { char: "شَا", word: "شَاءَ", displayWord: "شَا in شَاءَ", meaning: "He willed", englishSound: "shaa" },
      { char: "جَا", word: "جَاءَ", displayWord: "جَا in جَاءَ", meaning: "He came", englishSound: "jaa" },
      { char: "شَا", word: "شَاءَ", displayWord: "شَا in شَاءَ", meaning: "He willed", englishSound: "shaa" },
      { char: "جَا", word: "جَاءَ", displayWord: "جَا in جَاءَ", meaning: "He came", englishSound: "jaa" }
    ],
    words: [
      { arabic: "الضَّالِّينَ", transliteration: "Ad-Daalleen", meaning: "Those astray" },
      { arabic: "شَاءَ", transliteration: "Shaa'a", meaning: "He willed" },
      { arabic: "جَاءَ", transliteration: "Jaa'a", meaning: "He came" }
    ],
    quizQuestions: [
      { audioWord: "الضَّالِّينَ", options: ["◌َ", "◌َا", "◌ّ"], answerIdx: 1, explainText: "Madd Alif (◌َا)" },
      { audioWord: "شَاءَ", options: ["◌َ", "◌َا", "◌ُ"], answerIdx: 1, explainText: "Madd Alif (◌َا)" },
      { audioWord: "جَاءَ", options: ["◌َ", "◌َا", "◌ِ"], answerIdx: 1, explainText: "Madd Alif (◌َا)" }
    ]
  },
  {
    id: "harakat_9",
    name: "Combined Reading",
    mark: "◌َ ◌ِ ◌ُ ◌ْ",
    description: "Read combined words using every vowel mark together dynamically.",
    exampleLetter: "الْحَمْدُ",
    exampleExplain: "Al-Hamd (Combined)",
    exampleWord: "الْحَمْدُ",
    exampleWordMeaning: "All praise",
    letters: [
      { char: "لَ", word: "لَمْ", displayWord: "لَ in لَمْ", meaning: "Did not", englishSound: "La" },
      { char: "بِ", word: "رَبِّ", displayWord: "بِ in رَبِّ", meaning: "Lord", englishSound: "Bi" },
      { char: "حَ", word: "أَحَدٌ", displayWord: "حَ in أَحَدٌ", meaning: "One", englishSound: "Ha" },
      { char: "دُ", word: "الْحَمْدُ", displayWord: "دُ in الْحَمْدُ", meaning: "All praise", englishSound: "Du" },
      { char: "شَ", word: "شَرِّ", displayWord: "شَ in شَرِّ", meaning: "Evil of", englishSound: "Sha" }
    ],
    words: [
      { arabic: "الْحَمْدُ", transliteration: "Al-Hamd", meaning: "The Praise" },
      { arabic: "رَبِّ", transliteration: "Rabbi", meaning: "Lord" },
      { arabic: "أَحَدٌ", transliteration: "Ahadun", meaning: "One" }
    ],
    quizQuestions: [
      { audioWord: "الْحَمْدُ", options: ["Fatha", "Kasra", "Sukoon"], answerIdx: 2, explainText: "Sukoon (◌ْ)" },
      { audioWord: "رَبِّ", options: ["Fatha", "Shadda", "Kasra"], answerIdx: 1, explainText: "Shadda (◌ّ)" },
      { audioWord: "أَحَدٌ", options: ["Damma", "Tanwin", "Kasra"], answerIdx: 1, explainText: "Tanwin (◌ٌ)" }
    ]
  }
];

export default function HarakatPage() {
  const router = useRouter();
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Quiz states
  const [quizQuestionIdx, setQuizQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<"none" | "correct" | "wrong">("none");
  const [completedQuizzes, setCompletedQuizzes] = useState<boolean[]>(new Array(HARAKAT_LESSONS.length).fill(false));

  const lesson = HARAKAT_LESSONS[activeLessonIdx];
  const activeQuestion = lesson.quizQuestions[quizQuestionIdx];

  useEffect(() => {
    // Load progress
    const prog = getLearningProgress();
    const loadedCompletions = HARAKAT_LESSONS.map((l) =>
      prog.some((p) => p.track === "harakat" && p.lesson_id === l.id && p.completed)
    );
    setCompletedQuizzes(loadedCompletions);
  }, []);

  const playVowelSound = async () => {
    setIsPlaying(true);
    try {
      const audioMgr = QariAudioManager.getInstance();
      await audioMgr.playWord(lesson.exampleWord, 1);
    } catch {
      try {
        const audioMgr = QariAudioManager.getInstance();
        const baseChar = lesson.exampleLetter.replace(/[ًٌٍَُِّْٰ]/g, "").trim() || lesson.exampleLetter.charAt(0);
        await audioMgr.playLetter(baseChar);
      } catch (err) {
        console.warn("Vowel example Qari audio error:", err);
      }
    } finally {
      setIsPlaying(false);
    }
  };

  const playQuizWord = async () => {
    try {
      const audioMgr = QariAudioManager.getInstance();
      await audioMgr.playWord(activeQuestion.audioWord, 1);
    } catch {
      console.warn("Quiz word Qari audio error");
    }
  };

  const handleOptionTap = (optIdx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(optIdx);

    if (optIdx === activeQuestion.answerIdx) {
      setQuizResult("correct");
      
      // If final question of current quiz
      if (quizQuestionIdx === 2) {
        const updated = [...completedQuizzes];
        updated[activeLessonIdx] = true;
        setCompletedQuizzes(updated);

        saveLearningProgress({
          track: "harakat",
          lesson_id: lesson.id,
          completed: true,
          score: 100
        });
      }
    } else {
      setQuizResult("wrong");
      // Auto replay on failure
      playQuizWord();
    }
  };

  const handleNextQuizQuestion = () => {
    setSelectedOption(null);
    setQuizResult("none");
    if (quizQuestionIdx < 2) {
      setQuizQuestionIdx(quizQuestionIdx + 1);
    }
  };

  const handleNextLesson = () => {
    if (activeLessonIdx < HARAKAT_LESSONS.length - 1) {
      setActiveLessonIdx(activeLessonIdx + 1);
      setQuizQuestionIdx(0);
      setSelectedOption(null);
      setQuizResult("none");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      // Completed all 10 lessons
      router.push("/learn/joining");
    }
  };

  const handlePrevLesson = () => {
    if (activeLessonIdx > 0) {
      setActiveLessonIdx(activeLessonIdx - 1);
      setQuizQuestionIdx(0);
      setSelectedOption(null);
      setQuizResult("none");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const isQuizCompleted = completedQuizzes[activeLessonIdx];

  return (
    <div className="min-h-screen flex flex-col pb-24 relative bg-[#faf6ee] text-[#1a1208] transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 flex flex-col gap-6 relative z-10">
        
        {/* Navigation back */}
        <section className="flex flex-wrap items-center justify-between gap-3 select-none border-b border-zinc-200/60 pb-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[#6b7280] hover:text-[#1e5e4a] text-xs font-bold uppercase tracking-wider bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-2xs">
              Main Page
            </Link>
            <Link href="/learn" className="text-[#c8993c] hover:text-gold-light text-xs font-bold uppercase tracking-wider bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-2xs">
              Roadmap
            </Link>
          </div>
          <span className="text-xs font-bold text-[#6b7280]">Lesson {activeLessonIdx + 1} of 10</span>
        </section>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden select-none">
          <div
            className="h-full bg-[#c8993c] transition-all duration-300"
            style={{ width: `${((activeLessonIdx + 1) / 10) * 100}%` }}
          ></div>
        </div>

        {/* VOWEL LESSON DISPLAY CARD */}
        <div className="card bg-white p-8 border border-[#c8993c]/15 shadow-sm rounded-2xl flex flex-col gap-8">
          
          {/* Section A - WHAT IS THIS MARK? */}
          <div className="flex flex-col items-center gap-3 text-center pb-6 border-b border-zinc-100">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
              Section A - What is this mark?
            </span>
            <div className="text-7xl font-amiri text-[#c8993c] my-2 select-none">
              {lesson.mark}
            </div>
            <p className="text-sm font-semibold text-[#6b7280] leading-relaxed max-w-md mx-auto">
              {lesson.description}
            </p>
          </div>

          {/* Section B - HEAR IT */}
          <div className="flex flex-col items-center gap-3 text-center pb-6 border-b border-zinc-100 bg-[#faf6ee]/20 p-6 rounded-2xl border border-zinc-100/50 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
              Section B - Hear it
            </span>
            <span className="text-xs font-bold text-zinc-400">Listen to how it sounds:</span>
            <div className="font-amiri text-7xl text-[#1e5e4a] select-none my-2 drop-shadow-sm">
              {lesson.exampleLetter}
            </div>
            <div className="flex flex-col items-center gap-1 mb-2">
              <span className="text-xl font-bold text-[#c8993c]">{lesson.exampleExplain}</span>
              <span className="text-sm font-semibold text-[#6b7280]">
                as heard in <strong className="font-amiri text-[#1e5e4a] text-lg">{lesson.exampleWord}</strong> ({lesson.exampleWordMeaning})
              </span>
            </div>
            <button
              onClick={playVowelSound}
              disabled={isPlaying}
              className="h-[52px] w-48 rounded-xl border border-[#c8993c] bg-[#faf6ee] text-[#c8993c] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gold-pale/25 hover:shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span>🔊</span> {isPlaying ? "Playing..." : "Hear this sound"}
            </button>
          </div>

          {/* Section C - SEE IT ON DIFFERENT LETTERS */}
          <div className="flex flex-col gap-3 pb-6 border-b border-zinc-100">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#1e5e4a] text-center">
              Section C - See it on different letters
            </span>
            <p className="text-xs text-zinc-400 text-center font-bold">
              Tap any to hear the Qari pronounce it in a word:
            </p>
            <div className="grid grid-cols-5 gap-3 text-center mt-2 select-none">
              {lesson.letters.map((item, i) => (
                <button
                  key={i}
                  onClick={() => QariAudioManager.getInstance().playWord(item.word, 1)}
                  className="p-5 bg-[#faf6ee]/50 hover:bg-[#c8993c]/10 active:scale-95 hover:border-[#c8993c]/35 hover:shadow-md transition-all rounded-2xl border border-zinc-200 flex flex-col items-center justify-center gap-2 cursor-pointer group"
                >
                  <span className="font-amiri text-5xl font-extrabold text-[#1a1208] group-hover:text-[#1e5e4a] transition-colors">{item.char}</span>
                  <div className="flex flex-col items-center text-center gap-1 mt-1">
                    <span className="text-base text-[#c8993c] font-black tracking-wide uppercase">{item.englishSound}</span>
                    <span className="text-[10px] text-[#1e5e4a] font-bold tracking-tight">{item.displayWord}</span>
                    <span className="text-[9px] text-[#6b7280] font-extrabold italic">{item.meaning}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section D - HEAR IT IN WORDS */}
          <div className="flex flex-col gap-3 pb-6 border-b border-zinc-100">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#1e5e4a] text-center">
              Section D - Hear it in words
            </span>
            <p className="text-xs text-zinc-400 text-center font-bold">
              Listen to Quranic words using this vowel:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2 select-none">
              {lesson.words.map((w, i) => (
                <div key={i} className="p-5 rounded-2xl border border-[#c8993c]/20 bg-white hover:border-[#c8993c]/40 hover:shadow-md transition-all flex flex-col items-center gap-2 shadow-xs">
                  <span className="font-amiri text-4xl font-bold text-[#1e5e4a]">{w.arabic}</span>
                  <span className="text-xs font-bold text-[#1a1208]">{w.transliteration}</span>
                  <span className="text-[10px] text-[#6b7280] font-bold italic bg-zinc-50 px-2 py-0.5 rounded border border-zinc-100">{w.meaning}</span>
                  <button
                    onClick={() => QariAudioManager.getInstance().playWord(w.arabic, 1)}
                    className="mt-1 h-9 px-4 rounded-xl border border-[#c8993c] bg-white text-[#c8993c] hover:bg-[#c8993c] hover:text-white hover:shadow-xs active:scale-95 transition-all text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>🔊</span> Hear word
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section E - MINI QUIZ */}
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#1e5e4a]">
              Section E - Mini Quiz
            </span>
            
            {!isQuizCompleted ? (
              <div className="w-full flex flex-col items-center gap-4">
                <span className="text-xs font-bold text-[#6b7280]">
                  Question {quizQuestionIdx + 1} of 3 - which sound do you hear?
                </span>
                
                <button
                  onClick={playQuizWord}
                  className="h-12 px-6 rounded-xl border border-[#c8993c] bg-[#faf6ee] text-[#c8993c] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gold-pale/20 transition-all my-2"
                >
                  <span>🔊</span> Play Sound
                </button>

                <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                  {activeQuestion.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleOptionTap(i)}
                      className={`h-[52px] rounded-xl border font-bold text-sm flex items-center justify-center transition-all ${
                        selectedOption === i
                          ? i === activeQuestion.answerIdx
                            ? "bg-[#1e5e4a] border-[#1e5e4a] text-white"
                            : "bg-[#8b1a1a] border-[#8b1a1a] text-white"
                          : "bg-white border-zinc-200 hover:border-[#c8993c]/35 text-[#1a1208]"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {quizResult === "correct" && (
                  <div className="p-3 bg-emerald-pale/60 border border-emerald/20 rounded-xl text-emerald font-bold text-sm tracking-wide flex items-center gap-2 animate-bounce">
                    <span>That&apos;s right! ✓</span>
                    {quizQuestionIdx < 2 ? (
                      <button
                        onClick={handleNextQuizQuestion}
                        className="ml-4 px-3 py-1 bg-[#1e5e4a] text-white rounded text-[11px] font-bold uppercase tracking-wider"
                      >
                        Next Q
                      </button>
                    ) : (
                      <span className="text-xs">Quiz Completed!</span>
                    )}
                  </div>
                )}

                {quizResult === "wrong" && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[#8b1a1a] font-bold text-xs max-w-xs leading-normal">
                    <span>Not quite - that was a {activeQuestion.explainText}. Let&apos;s hear it again.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-emerald-pale/60 border border-emerald/20 rounded-xl text-emerald font-bold text-sm flex flex-col items-center gap-2">
                <span>✓ Quiz Completed successfully!</span>
                <span className="text-xs font-semibold text-zinc-500">You have completed all requirements for this lesson.</span>
              </div>
            )}
          </div>

        </div>

        {/* BOTTOM NAVIGATION BUTTONS */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={handlePrevLesson}
            disabled={activeLessonIdx === 0}
            className="btn-secondary h-[52px] min-w-[140px] flex items-center justify-center font-bold disabled:opacity-50"
          >
            Previous
          </button>

          <button
            onClick={handleNextLesson}
            className="btn-primary h-[52px] min-w-[140px] flex items-center justify-center font-bold"
          >
            {activeLessonIdx === 9 ? "Finish Stage 2" : "Next Vowel"}
          </button>
        </div>

      </main>

      {/* Stage 2 complete celebration */}
      {activeLessonIdx === 9 && isQuizCompleted && (
        <div className="fixed inset-0 bg-[#1a1208]/90 z-[9999] flex flex-col items-center justify-center text-center p-6 select-none animate-[fade-in_0.35s_ease-out]">
          <span className="font-amiri-quran text-7xl text-[#e8c96a] tracking-wider mb-2 leading-normal">
            مَاشَاءَ اللَّه
          </span>
          <h2 className="text-4xl font-extrabold text-[#faf6ee] font-amiri mt-4">
            MashaAllah!
          </h2>
          <p className="text-base text-zinc-300 max-w-md leading-relaxed mt-4">
            You have successfully mastered Stage 2 vowel marks. You are now ready to connect letters into words.
          </p>
          <Link
            href="/learn/joining"
            className="btn-primary h-[52px] min-w-[240px] flex items-center justify-center font-bold text-base bg-[#c8993c] border-[#c8993c] text-white hover:bg-gold-light mt-8"
            style={{ backgroundColor: "#c8993c", borderColor: "#c8993c" }}
          >
            Continue to Stage 3
          </Link>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
