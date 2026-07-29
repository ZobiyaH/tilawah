/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Layout/Header";
import BottomNav from "@/components/Layout/BottomNav";
import { QariAudioManager } from "@/lib/qariAudio";

import { saveLearningProgress, getLearningProgress } from "@/lib/progress";
import { arabicSimilarity } from "@/lib/arabic/similarity";
import { normalizeArabic } from "@/lib/arabic/normalize";

interface QuranExample {
  word: string;
  transliteration: string;
  meaning: string;
}

interface TajweedLesson {
  id: string;
  name: string;
  tagline: string;
  explanation: string;
  letters: string[];
  clipA_text: string; // for TTS (flat reading)
  clipB_word: string; // for Qari (tajweed reading)
  examples: QuranExample[];
  quizAyah: string;
  quizWords: string[]; // options
  quizCorrectWord: string;
  expectedRecitation: string;
  phoneticGuide: string;
}

const TAJWEED_LESSONS: TajweedLesson[] = [
  {
    id: "tajweed_0",
    name: "What is Tajweed?",
    tagline: "Beautifying your Quran recitation",
    explanation: "Tajweed is the set of rules governing how the Quran should be recited. It gives every letter its rights and correct pronunciation.",
    letters: ["All letters"],
    clipA_text: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ", // flat
    clipB_word: "بِسْمِ", // correct Qari Al-Fatiha word
    examples: [
      { word: "بِسْمِ", transliteration: "Bismi", meaning: "In the name of" },
      { word: "اللَّهِ", transliteration: "Allahi", meaning: "Allah" }
    ],
    quizAyah: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
    quizWords: ["بِسْمِ", "اللَّهِ", "الرَّحْمَنِ"],
    quizCorrectWord: "اللَّهِ",
    expectedRecitation: "بسم الله",
    phoneticGuide: "Say: Bismillaah"
  },
  {
    id: "tajweed_1",
    name: "Madd",
    tagline: "When to stretch a sound (2, 4, 5, or 6 counts)",
    explanation: "Madd (مَدّ) means prolonging the sound of a Madd letter (Alif ا, Waw و, Yaa ي) when preceded by a matching vowel. The duration is measured in counts (Harakas), ranging from 2 counts up to 6 counts when marked with the Quranic Madd symbol (◌ٓ).",
    letters: ["Alif (ا)", "Waw (و)", "Yaa (ي)", "Madd Mark (◌ٓ)"],
    clipA_text: "جَا",
    clipB_word: "جَاءَ",
    examples: [
      { word: "الضَّالِّينَ", transliteration: "Ad-Daalleen (6 counts)", meaning: "Those astray" },
      { word: "شَاءَ", transliteration: "Shaa'a (4-5 counts)", meaning: "He willed" },
      { word: "جَاءَ", transliteration: "Jaa'a (4-5 counts)", meaning: "He came" }
    ],
    quizAyah: "فَإِذَا جَاءَتِ الصَّاخَّةُ",
    quizWords: ["فَإِذَا", "جَاءَتِ", "الصَّاخَّةُ"],
    quizCorrectWord: "جَاءَتِ",
    expectedRecitation: "جاء",
    phoneticGuide: "Say: Jaa'a (stretch the 'aa' sound for 4-5 counts)"
  },
  {
    id: "tajweed_2",
    name: "Ghunna",
    tagline: "The nasal hum",
    explanation: "Ghunna is a humming sound produced through the nose. It is held for 2 counts on doubled Noon (نّ) or Meem (مّ).",
    letters: ["Noon (نّ)", "Meem (مّ)"],
    clipA_text: "عَمَ",
    clipB_word: "الرَّحْمَٰنِ",
    examples: [
      { word: "عَمَّ", transliteration: "Amma", meaning: "About what" },
      { word: "إِنَّ", transliteration: "Inna", meaning: "Indeed" },
      { word: "ثُمَّ", transliteration: "Thumma", meaning: "Then" }
    ],
    quizAyah: "عَمَّ يَتَسَاءَلُونَ",
    quizWords: ["عَمَّ", "يَتَسَاءَلُونَ"],
    quizCorrectWord: "عَمَّ",
    expectedRecitation: "عم",
    phoneticGuide: "Say: 'Amma (hum through your nose on M)"
  },
  {
    id: "tajweed_3",
    name: "Shaddah",
    tagline: "The doubled letter",
    explanation: "Shaddah means pronouncing a letter twice. You hold the first silent letter briefly, then say the second with a vowel.",
    letters: ["Doubled letter (◌ّ)"],
    clipA_text: "رَبِ",
    clipB_word: "رَبِّ",
    examples: [
      { word: "رَبِّ", transliteration: "Rabbi", meaning: "Lord" },
      { word: "يُثَبِّتُ", transliteration: "Yuthabbitu", meaning: "He makes firm" },
      { word: "الرَّحِيمِ", transliteration: "Ar-Raheem", meaning: "The Merciful" }
    ],
    quizAyah: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    quizWords: ["الْحَمْدُ", "لِلَّهِ", "رَبِّ"],
    quizCorrectWord: "رَبِّ",
    expectedRecitation: "رب",
    phoneticGuide: "Say: Rabbi (pause on B, then say i)"
  },
  {
    id: "tajweed_4",
    name: "Qalqala",
    tagline: "The echo bounce",
    explanation: "When any of these 5 letters (ق ط ب ج د) stop, they are pronounced with a light bouncing echo sound.",
    letters: ["Qaf (ق)", "Taa (ط)", "Baa (ب)", "Jeem (ج)", "Dal (د)"],
    clipA_text: "قَد",
    clipB_word: "قَدْ",
    examples: [
      { word: "قَدْ", transliteration: "Qad", meaning: "Indeed" },
      { word: "يَلِدْ", transliteration: "Yalid", meaning: "He begets" },
      { word: "يُولَدْ", transliteration: "Yoolad", meaning: "Born" }
    ],
    quizAyah: "لَمْ يَلِدْ وَلَمْ يُولَدْ",
    quizWords: ["لَمْ", "يَلِدْ", "وَلَمْ"],
    quizCorrectWord: "يَلِدْ",
    expectedRecitation: "يلد",
    phoneticGuide: "Say: Yalid (bounce the D at the end)"
  },
  {
    id: "tajweed_5",
    name: "Noon Sakin",
    tagline: "The silent N",
    explanation: "When a Noon Sakin (نْ) or Tanwin meets other letters, the N sound is merged, hidden, switched, or read clearly.",
    letters: ["Noon Sakin (نْ)", "Tanwin (◌ً ◌ٍ ◌ٌ)"],
    clipA_text: "مِنْ بَعْدِ",
    clipB_word: "أَنْعَمْتَ",
    examples: [
      { word: "أَنْعَمْتَ", transliteration: "An'amta", meaning: "You favored" },
      { word: "مِنْ شَرِّ", transliteration: "Min sharri", meaning: "From the evil" },
      { word: "مِنْ بَعْدِ", transliteration: "Mim-ba'di", meaning: "From after" }
    ],
    quizAyah: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ",
    quizWords: ["الَّذِينَ", "أَنْعَمْتَ", "عَلَيْهِمْ"],
    quizCorrectWord: "أَنْعَمْتَ",
    expectedRecitation: "انعمت",
    phoneticGuide: "Say: An'amta (Noon is silent/clear here)"
  },
  {
    id: "tajweed_6",
    name: "Idgham",
    tagline: "Merging two sounds",
    explanation: "When Noon Sakin meets (ي ن م و ل ر), the Noon merges into the next letter, often with a nasal hum (Ghunna).",
    letters: ["Ya (ي)", "Noon (ن)", "Meem (م)", "Waw (و)", "Laam (ل)", "Raa (ر)"],
    clipA_text: "مَنْ يَقُولُ",
    clipB_word: "مَنْ يَقُولُ",
    examples: [
      { word: "مَنْ يَقُولُ", transliteration: "May-yaqoolu", meaning: "Who says" },
      { word: "مِنْ مَالٍ", transliteration: "Mim-maalin", meaning: "From wealth" },
      { word: "يَكُنْ لَهُ", transliteration: "Yakulla-hu", meaning: "Be for him" }
    ],
    quizAyah: "وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",
    quizWords: ["وَلَمْ", "يَكُنْ لَهُ", "كُفُوًا"],
    quizCorrectWord: "يَكُنْ لَهُ",
    expectedRecitation: "يكن له",
    phoneticGuide: "Say: Yakul-lahu (merge N directly into L)"
  },
  {
    id: "tajweed_7",
    name: "Ikhfa",
    tagline: "The hidden sound",
    explanation: "When Noon Sakin meets 15 specific letters, the N sound is hidden in the nose, making a soft nasal sound.",
    letters: ["15 letters"],
    clipA_text: "مِنْ شَرِّ",
    clipB_word: "مِنْ شَرِّ",
    examples: [
      { word: "مِنْ شَرِّ", transliteration: "Min-sharri", meaning: "From evil of" },
      { word: "مِنْ دُونِ", transliteration: "Min-dooni", meaning: "From besides" },
      { word: "أَنْفُسِهِمْ", transliteration: "Anfusihim", meaning: "Themselves" }
    ],
    quizAyah: "مِنْ شَرِّ مَا خَلَقَ",
    quizWords: ["مِنْ شَرِّ", "مَا", "خَلَقَ"],
    quizCorrectWord: "مِنْ شَرِّ",
    expectedRecitation: "من شر",
    phoneticGuide: "Say: Min-sharri (hide the N in your nose)"
  },
  {
    id: "tajweed_8",
    name: "Iqlab",
    tagline: "The switch to Meem",
    explanation: "If a Noon Sakin or Tanwin is followed by 'ب', the N sound switches completely into a light 'Meem' sound.",
    letters: ["Ba (ب)"],
    clipA_text: "مِنْ بَعْدِ",
    clipB_word: "مِنْ بَعْدِ",
    examples: [
      { word: "مِنْ بَعْدِ", transliteration: "Mim-ba'di", meaning: "From after" },
      { word: "سَمِيعٌ بَصِيرٌ", transliteration: "Samee'um baseer", meaning: "All-hearing All-seeing" }
    ],
    quizAyah: "مِنْ بَعْدِ مَا جَاءَتْهُمُ",
    quizWords: ["مِنْ بَعْدِ", "مَا", "جَاءَتْهُمُ"],
    quizCorrectWord: "مِنْ بَعْدِ",
    expectedRecitation: "من بعد",
    phoneticGuide: "Say: Mim-ba'di (switch N to M sound)"
  },
  {
    id: "tajweed_9",
    name: "Izhar",
    tagline: "Saying it clearly",
    explanation: "If Noon Sakin is followed by any throat letter, the Noon is pronounced clearly without merging or nasalization.",
    letters: ["ء هـ ع ح غ خ"],
    clipA_text: "أَنْعَمْتَ",
    clipB_word: "أَنْعَمْتَ",
    examples: [
      { word: "أَنْعَمْتَ", transliteration: "An'amta", meaning: "You favored" },
      { word: "مِنْ حَكِيمٍ", transliteration: "Min hakeemin", meaning: "From Wise" }
    ],
    quizAyah: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ",
    quizWords: ["الَّذِينَ", "أَنْعَمْتَ", "عَلَيْهِمْ"],
    quizCorrectWord: "أَنْعَمْتَ",
    expectedRecitation: "انعمت",
    phoneticGuide: "Say: An'amta (pronounce N clearly)"
  },
  {
    id: "tajweed_10",
    name: "Lam in Allah",
    tagline: "Heavy and light L",
    explanation: "The 'L' sound in the word Allah is heavy (thick) if preceded by Fatha/Damma, and light if preceded by Kasra.",
    letters: ["Laam in Allah"],
    clipA_text: "بِسْمِ اللَّهِ",
    clipB_word: "اللَّهِ",
    examples: [
      { word: "بِسْمِ اللَّهِ", transliteration: "Bismillah (light L)", meaning: "In name of Allah" },
      { word: "هُوَ اللَّهُ", transliteration: "Huwallah (heavy L)", meaning: "He is Allah" }
    ],
    quizAyah: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
    quizWords: ["بِسْمِ اللَّهِ", "الرَّحْمَنِ", "الرَّحِيمِ"],
    quizCorrectWord: "بِسْمِ اللَّهِ",
    expectedRecitation: "بسم الله",
    phoneticGuide: "Say: Bismillaah (make L sound light/thin)"
  },
  {
    id: "tajweed_11",
    name: "Putting it all together",
    tagline: "Recite Al-Fatiha with Tajweed",
    explanation: "Apply everything you have learned to recite the opening verses of Al-Fatiha correctly.",
    letters: ["All rules"],
    clipA_text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    clipB_word: "الْحَمْدُ",
    examples: [
      { word: "الْحَمْدُ", transliteration: "Al-Hamd", meaning: "The Praise" },
      { word: "رَبِّ", transliteration: "Rabbi", meaning: "Lord" }
    ],
    quizAyah: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    quizWords: ["الْحَمْدُ", "لِلَّهِ", "رَبِّ"],
    quizCorrectWord: "رَبِّ",
    expectedRecitation: "الحمد لله رب العالمين",
    phoneticGuide: "Say the full verse with proper Tajweed"
  }
];

export default function TajweedLessonPage() {
  const params = useParams();
  const router = useRouter();

  const ruleId = Number(params?.ruleId);
  const lesson = TAJWEED_LESSONS[ruleId];

  const [activeStep, setActiveStep] = useState(1);
  const [isPlayingB, setIsPlayingB] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Quiz & ASR states
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [quizSuccess, setQuizSuccess] = useState(false);
  const [asrSuccess, setAsrSuccess] = useState(false);
  const [spokenPhrase, setSpokenPhrase] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!lesson) {
      router.push("/learn");
      return;
    }
    const prog = getLearningProgress();
    const completed = prog.some((p) => p.track === "tajweed" && p.lesson_id === lesson.id && p.completed);
    setIsCompleted(completed);
  }, [ruleId, lesson, router]);

  if (!lesson) return null;

  const playChime = () => {
    if (typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };



  const playClipB = async () => {
    setIsPlayingB(true);
    try {
      const audioMgr = QariAudioManager.getInstance();
      await audioMgr.playWord(lesson.clipB_word, 1);
    } catch {
      console.warn("Qari clip B error");
    } finally {
      setIsPlayingB(false);
    }
  };

  const playExampleAudio = async (word: string) => {
    try {
      const audioMgr = QariAudioManager.getInstance();
      await audioMgr.playWord(word, 1);
    } catch {}
  };

  const handleSpotWord = (word: string) => {
    setSelectedWord(word);
    if (word === lesson.quizCorrectWord) {
      setQuizSuccess(true);
      playChime();
    } else {
      setQuizSuccess(false);
    }
  };

  const startRecitationPractice = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser Speech Recognition not supported.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "ar-SA";
    rec.interimResults = false;

    rec.onstart = () => {
      setIsRecording(true);
      setSpokenPhrase("");
    };

    rec.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript.trim();
      setSpokenPhrase(resultText);

      const normalizedResult = normalizeArabic(resultText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?؟]/g, ""));
      const normalizedExpect = normalizeArabic(lesson.expectedRecitation);

      const score = arabicSimilarity(normalizedResult, normalizedExpect);
      if (score >= 0.58 || normalizedResult.includes(normalizedExpect)) {
        setAsrSuccess(true);
        setIsCompleted(true);
        playChime();
        saveLearningProgress({
          track: "tajweed",
          lesson_id: lesson.id,
          completed: true,
          score: 100
        });
      } else {
        setAsrSuccess(false);
        playClipB(); // auto replay correct Qari sound on fail
      }
    };

    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    rec.start();
  };

  const nextId = ruleId + 1;
  const hasNext = nextId < TAJWEED_LESSONS.length;

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
            <Link href="/learn/tajweed" className="text-[#1e5e4a] hover:underline text-xs font-bold uppercase tracking-wider bg-[#faf6ee] px-3 py-1.5 rounded-lg border border-[#1e5e4a]/20">
              All Rules
            </Link>
          </div>
          <span className="text-xs font-bold text-[#6b7280]">Lesson {ruleId + 1} of 12</span>
        </section>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden select-none">
          <div
            className="h-full bg-[#c8993c] transition-all duration-300"
            style={{ width: `${((ruleId + 1) / 12) * 100}%` }}
          ></div>
        </div>

        {/* Lesson Card */}
        <div className="card bg-white p-8 border border-[#c8993c]/15 shadow-sm rounded-2xl flex flex-col gap-6">
          
          <div className="text-center flex flex-col gap-1.5 select-none">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
              Stage 4 - Lesson {ruleId + 1}
            </span>
            <h2 className="text-2xl font-bold text-[#1e5e4a] font-amiri leading-none">
              {lesson.name}
            </h2>
            <p className="text-xs font-bold text-[#c8993c] uppercase tracking-widest">
              {lesson.tagline}
            </p>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-5 gap-1 border-b border-zinc-100 pb-3 text-center text-xs font-bold select-none">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setActiveStep(s)}
                className={`py-2 rounded-lg transition-all ${
                  activeStep === s
                    ? "bg-[#1e5e4a] text-white"
                    : "bg-[#faf6ee] text-[#1e5e4a] hover:bg-gold-pale/25"
                }`}
              >
                Step {s}
              </button>
            ))}
          </div>

          {/* Step Contents */}
          {activeStep === 1 && (
            <div className="flex flex-col gap-4 text-center py-2 select-none">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                Step 1 - Listen to Qari Recitation
              </span>
              <p className="text-sm font-semibold text-[#6b7280]">
                Listen to Sheikh Al-Husary recite this example with proper Tajweed:
              </p>
              
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-[#c8993c]/30 bg-[#fdf8f0] gap-3 mt-2 shadow-xs">
                <span className="font-amiri text-4xl font-bold text-[#1e5e4a]">
                  {lesson.clipB_word}
                </span>
                <button
                  onClick={playClipB}
                  className={`h-12 px-6 rounded-xl border border-[#c8993c] bg-white text-[#c8993c] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xs hover:bg-[#c8993c] hover:text-white transition-all ${
                    isPlayingB ? "animate-pulse ring-2 ring-[#c8993c]/40" : ""
                  }`}
                >
                  <span>🔊</span> {isPlayingB ? "Playing..." : "Hear Qari Recitation"}
                </button>
              </div>

              <p className="text-xs text-zinc-400 font-bold italic mt-1">
                Listen carefully to the timing, clarity, and pronunciation of the rule.
              </p>
            </div>
          )}

          {activeStep === 2 && (
            <div className="flex flex-col gap-4 text-center py-4 select-none">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                Step 2 - Simple Explanation
              </span>
              <p className="text-base font-extrabold text-[#1a1208] leading-relaxed max-w-md mx-auto">
                {lesson.explanation}
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                {lesson.letters.map((letStr, i) => (
                  <span key={i} className="px-3 py-1.5 bg-[#fdf8f0] border border-[#c8993c]/35 rounded-lg text-xs font-bold text-[#c8993c]">
                    {letStr}
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="flex flex-col gap-4 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                Step 3 - Hear it in the Quran
              </span>
              <p className="text-xs font-bold text-zinc-400">
                Listen to how the rule is applied in these verses:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                {lesson.examples.map((ex, i) => (
                  <div key={i} className="p-4 rounded-xl border border-[#c8993c]/15 bg-white flex flex-col items-center gap-1.5 shadow-sm">
                    <span className="font-amiri text-2xl text-[#1e5e4a]">{ex.word}</span>
                    <span className="text-xs font-bold text-[#1a1208]">{ex.transliteration}</span>
                    <span className="text-[10px] text-[#6b7280] font-semibold italic">{ex.meaning}</span>
                    <button
                      onClick={() => playExampleAudio(ex.word)}
                      className="mt-2 h-9 px-3 rounded-lg border border-[#c8993c]/30 text-[10px] font-extrabold uppercase tracking-wider text-[#c8993c] bg-white flex items-center justify-center gap-1 hover:bg-[#fdf8f0]/50"
                    >
                      <span>🔊</span> Hear word
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div className="flex flex-col gap-4 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                Step 4 - Spot It
              </span>
              <p className="text-sm font-semibold text-[#6b7280]">
                Which of these words uses this rule?
              </p>
              <div className="font-amiri text-3xl text-zinc-700 leading-normal border border-zinc-100 p-4 rounded-2xl bg-[#faf6ee]/20 select-all my-2">
                {lesson.quizAyah}
              </div>

              <div className="flex flex-col gap-2 w-full max-w-xs mx-auto mt-2">
                {lesson.quizWords.map((word, i) => (
                  <button
                    key={i}
                    onClick={() => handleSpotWord(word)}
                    className={`h-[52px] rounded-xl border font-bold text-sm flex items-center justify-center transition-all ${
                      selectedWord === word
                        ? word === lesson.quizCorrectWord
                          ? "bg-[#1e5e4a] border-[#1e5e4a] text-white"
                          : "bg-[#8b1a1a] border-[#8b1a1a] text-white"
                        : "bg-white border-zinc-200 hover:border-[#c8993c]/35"
                    }`}
                  >
                    {word}
                  </button>
                ))}
              </div>

              {selectedWord && quizSuccess && (
                <div className="p-3 bg-emerald-pale/60 border border-emerald/20 rounded-xl text-emerald font-bold text-sm tracking-wide flex items-center justify-center gap-2 animate-bounce">
                  <span>That&apos;s right! Spot on. ✓</span>
                </div>
              )}
            </div>
          )}

          {activeStep === 5 && (
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                Step 5 - Say It
              </span>
              <p className="text-xs font-bold text-zinc-400">
                Your turn - recite this phrase:
              </p>

              <div className="font-amiri text-4xl text-[#1e5e4a] select-none my-2">
                {lesson.expectedRecitation}
              </div>
              <span className="text-sm font-semibold text-[#6b7280]">
                {lesson.phoneticGuide}
              </span>

              <button
                onClick={startRecitationPractice}
                disabled={isRecording}
                className={`w-[72px] h-[72px] rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 ${
                  isRecording
                    ? "bg-[#8b1a1a] shadow-[0_0_12px_rgba(139,26,26,0.4)] animate-pulse"
                    : asrSuccess
                    ? "bg-[#1e5e4a] shadow-[0_0_12px_rgba(30,94,74,0.4)]"
                    : "bg-[#1e5e4a] hover:bg-emerald-light"
                }`}
              >
                <span className="text-2xl">{isRecording ? "🎙️" : "🎤"}</span>
              </button>

              {isRecording && (
                <span className="text-xs font-extrabold text-[#8b1a1a] uppercase tracking-wider animate-pulse">
                  Listening... Speak now
                </span>
              )}

              {asrSuccess && (
                <div className="p-3 bg-emerald-pale/60 border border-emerald/20 rounded-xl text-emerald font-bold text-sm tracking-wide flex items-center gap-2 animate-bounce">
                  <span>Correct Tajweed pronunciation! ✓</span>
                </div>
              )}

              {spokenPhrase && (
                <span className="text-xs text-[#6b7280] font-semibold">
                  You said: &quot;{spokenPhrase}&quot;
                </span>
              )}
            </div>
          )}

        </div>

        {/* BOTTOM NAVIGATION BUTTONS */}
        <div className="flex justify-between items-center mt-4">
          <Link
            href="/learn"
            className="btn-secondary h-[52px] min-w-[140px] flex items-center justify-center font-bold"
          >
            Roadmap
          </Link>

          {hasNext ? (
            <Link
              href={`/learn/tajweed/${nextId}`}
              onClick={(e) => {
                if (!isCompleted && !asrSuccess) {
                  e.preventDefault();
                  alert("Please attempt Step 5 speaking practice successfully before proceeding.");
                }
              }}
              className={`btn-primary h-[52px] min-w-[140px] flex items-center justify-center font-bold transition-all ${
                !isCompleted && !asrSuccess
                  ? "opacity-50 cursor-not-allowed bg-zinc-400 border-zinc-400 text-zinc-300"
                  : ""
              }`}
            >
              Next rule
            </Link>
          ) : (
            <Link
              href="/learn/short-surahs"
              className="btn-primary h-[52px] min-w-[200px] flex items-center justify-center font-bold bg-[#c8993c] border-[#c8993c]"
              style={{ backgroundColor: "#c8993c", borderColor: "#c8993c" }}
            >
              Continue to Stage 5
            </Link>
          )}
        </div>

      </main>

      {/* Stage 4 complete celebration */}
      {ruleId === 11 && isCompleted && (
        <div className="fixed inset-0 bg-[#1a1208]/90 z-[9999] flex flex-col items-center justify-center text-center p-6 select-none animate-[fade-in_0.35s_ease-out]">
          <span className="font-amiri-quran text-7xl text-[#e8c96a] tracking-wider mb-2 leading-normal">
            مَاشَاءَ اللَّه
          </span>
          <h2 className="text-4xl font-extrabold text-[#faf6ee] font-amiri mt-4">
            MashaAllah!
          </h2>
          <p className="text-base text-zinc-300 max-w-md leading-relaxed mt-4">
            You have successfully mastered the fundamentals of Tajweed. You are now ready to recite complete Surahs with guidance.
          </p>
          <Link
            href="/learn/short-surahs"
            className="btn-primary h-[52px] min-w-[240px] flex items-center justify-center font-bold text-base bg-[#c8993c] border-[#c8993c] text-white hover:bg-gold-light mt-8"
            style={{ backgroundColor: "#c8993c", borderColor: "#c8993c" }}
          >
            Continue to Stage 5
          </Link>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
