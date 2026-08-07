"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Layout/Header";
import BottomNav from "@/components/Layout/BottomNav";
import { QariAudioManager } from "@/lib/qariAudio";
import { saveLearningProgress, getLearningProgress } from "@/lib/progress";

interface JoiningStep {
  text: string;
  visual: string; // e.g. "ب", "ب + س", "ب + س + م", "بِسْمِ"
  audioWord: string; // sound to play for this step
}

interface JoiningLesson {
  id: string;
  name: string;
  description: string;
  steps: JoiningStep[];
}

const JOINING_LESSONS: JoiningLesson[] = [
  {
    id: "joining_0",
    name: "Why letters join",
    description: "Arabic is always written in cursive script. Most letters connect to the letters next to them, changing their shapes slightly depending on their position.",
    steps: [
      { text: "We start with individual letters:", visual: "ب  س  م", audioWord: "ب" },
      { text: "When we write them together, they connect:", visual: "ب + س + م", audioWord: "بسم" },
      { text: "And they form a single cursive word:", visual: "بِسْمِ", audioWord: "بسم" }
    ]
  },
  {
    id: "joining_1",
    name: "Letters that always join",
    description: "Most Arabic letters connect from both sides. We call these connectors. Let's see how Ba and Seen connect.",
    steps: [
      { text: "Here is Ba and Seen separately:", visual: "ب  س", audioWord: "ب" },
      { text: "They stretch their arms to join:", visual: "بـ + ـس", audioWord: "بسم" },
      { text: "They merge smoothly:", visual: "بَسْ", audioWord: "بسم" }
    ]
  },
  {
    id: "joining_2",
    name: "Letters that never join",
    description: "Six letters never connect to the letter after them: ا د ذ ر ز و. We call them non-connectors. They leave a tiny space after them.",
    steps: [
      { text: "Let's write Dal and Waw:", visual: "د  و", audioWord: "د" },
      { text: "Waw cannot connect to the left, so they stay separated:", visual: "دَ + وَ", audioWord: "دون" },
      { text: "They stand side by side without touching:", visual: "دُونِ", audioWord: "دون" }
    ]
  },
  {
    id: "joining_3",
    name: "Reading your first 2-letter word",
    description: "Let's read a simple two-letter word: Qad (ق + د).",
    steps: [
      { text: "First letter is Qaf:", visual: "قَ", audioWord: "ق" },
      { text: "Second letter is Dal:", visual: "دْ", audioWord: "د" },
      { text: "Join them together to say 'Qad':", visual: "قَدْ", audioWord: "قد" }
    ]
  },
  {
    id: "joining_4",
    name: "Reading your first 3-letter word",
    description: "Let's connect three letters: Hamd (ح + م + د).",
    steps: [
      { text: "Start with Haa and Meem:", visual: "حَ + مْ", audioWord: "الحمد" },
      { text: "Add the Dal at the end:", visual: "حَمْ + دُ", audioWord: "الحمد" },
      { text: "Connect all three to form 'Hamd':", visual: "حَمْدُ", audioWord: "الحمد" }
    ]
  },
  {
    id: "joining_5",
    name: "Reading simple Quranic words",
    description: "Let's read the word 'Rabb' (ر + ب).",
    steps: [
      { text: "First letter Raa is a non-connector:", visual: "رَ", audioWord: "ر" },
      { text: "Second letter Ba has a doubled mark:", visual: "بِّ", audioWord: "ب" },
      { text: "Write them side by side to form 'Rabb':", visual: "رَبِّ", audioWord: "رب" }
    ]
  },
  {
    id: "joining_6",
    name: "Reading with spaces and punctuation",
    description: "Quranic verses are made of words separated by spaces. Let's read 'Bismi Allah' (بِسْمِ اللَّهِ).",
    steps: [
      { text: "First word:", visual: "بِسْمِ", audioWord: "بسم" },
      { text: "Second word:", visual: "اللَّهِ", audioWord: "الله" },
      { text: "Put them together with a space:", visual: "بِسْمِ اللَّهِ", audioWord: "الله" }
    ]
  },
  {
    id: "joining_7",
    name: "Practice: read 10 Quranic words",
    description: "Let's practice connecting and reading 3 common Quranic words.",
    steps: [
      { text: "Word 1: Ahad", visual: "أَحَدٌ", audioWord: "احد" },
      { text: "Word 2: Khalaq", visual: "خَلَقَ", audioWord: "خلق" },
      { text: "Word 3: Rabbi", visual: "رَبِّ", audioWord: "رب" }
    ]
  }
];

export default function JoiningPage() {
  const router = useRouter();
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<boolean[]>(new Array(JOINING_LESSONS.length).fill(false));

  const lesson = JOINING_LESSONS[activeLessonIdx];
  const step = lesson.steps[currentStep];

  useEffect(() => {
    // Load progress
    const prog = getLearningProgress();
    const loadedCompletions = JOINING_LESSONS.map((l) =>
      prog.some((p) => p.track === "joining" && p.lesson_id === l.id && p.completed)
    );
    setCompletedQuizzes(loadedCompletions);
  }, [activeLessonIdx]);

  const setCompletedQuizzes = (completions: boolean[]) => {
    setCompletedLessons(completions);
  };

  const playStepAudio = async () => {
    try {
      const audioMgr = QariAudioManager.getInstance();
      await audioMgr.playWord(step.audioWord, 1);
    } catch {
      try {
        const audioMgr = QariAudioManager.getInstance();
        const baseChar = step.audioWord.replace(/[ًٌٍَُِّْٰ]/g, "").trim() || step.audioWord.charAt(0);
        await audioMgr.playLetter(baseChar);
      } catch (err) {
        console.warn("Step Qari audio error:", err);
      }
    }
  };

  const handleNextStep = () => {
    if (currentStep < lesson.steps.length - 1) {
      const nextStepIdx = currentStep + 1;
      setCurrentStep(nextStepIdx);
      // Auto play sound on transition
      setTimeout(() => {
        const audioMgr = QariAudioManager.getInstance();
        audioMgr.playWord(lesson.steps[nextStepIdx].audioWord, 1).catch(() => {});
      }, 100);
    } else {
      // Completed the lesson steps
      const updated = [...completedLessons];
      updated[activeLessonIdx] = true;
      setCompletedLessons(updated);

      saveLearningProgress({
        track: "joining",
        lesson_id: lesson.id,
        completed: true,
        score: 100
      });
    }
  };

  const handleNextLesson = () => {
    if (activeLessonIdx < JOINING_LESSONS.length - 1) {
      setActiveLessonIdx(activeLessonIdx + 1);
      setCurrentStep(0);
    } else {
      router.push("/learn/tajweed");
    }
  };

  const handlePrevLesson = () => {
    if (activeLessonIdx > 0) {
      setActiveLessonIdx(activeLessonIdx - 1);
      setCurrentStep(0);
    }
  };

  const isLessonCompleted = completedLessons[activeLessonIdx];

  return (
    <div className="min-h-screen flex flex-col pb-36 md:pb-16 relative bg-[#faf6ee] dark:bg-zinc-950 text-[#1a1208] dark:text-zinc-100 transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8 flex flex-col gap-6 relative z-10">
        
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
          <span className="text-xs font-bold text-[#6b7280]">Lesson {activeLessonIdx + 1} of 8</span>
        </section>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden select-none">
          <div
            className="h-full bg-[#c8993c] transition-all duration-300"
            style={{ width: `${((activeLessonIdx + 1) / 8) * 100}%` }}
          ></div>
        </div>

        {/* JOINING CONTENT CARD */}
        <div className="card bg-white p-8 border border-[#c8993c]/15 shadow-sm rounded-2xl flex flex-col gap-8">
          
          <div className="flex flex-col gap-2 text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
              Stage 3 - Lesson {activeLessonIdx + 1}
            </span>
            <h2 className="text-2xl font-bold text-[#1e5e4a] font-amiri">
              {lesson.name}
            </h2>
            <p className="text-sm text-[#6b7280] leading-relaxed max-w-md mx-auto mt-1">
              {lesson.description}
            </p>
          </div>

          {/* Animated Connecting block */}
          <div className="flex flex-col items-center gap-6 py-8 bg-[#fdf8f0] border border-[#c8993c]/20 rounded-2xl shadow-inner relative overflow-hidden">
            <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-extrabold absolute top-3">
              Step {currentStep + 1} of {lesson.steps.length}
            </span>
            
            {/* Smooth joining animation container */}
            <div className="font-amiri text-5xl md:text-6xl text-[#1a1208] transition-all duration-500 scale-105 select-all leading-normal">
              {step.visual}
            </div>

            <p className="text-sm font-semibold text-[#6b7280] text-center max-w-sm px-4">
              {step.text || "Listen to this joined pronunciation:"}
            </p>

            <button
              onClick={playStepAudio}
              className="h-[52px] w-48 rounded-xl border border-[#c8993c] bg-white text-[#c8993c] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gold-pale/15 transition-all shadow-sm"
            >
              <span>🔊</span> Hear step pronunciation
            </button>
          </div>

          {/* Action step guide button */}
          <div className="flex flex-col items-center gap-3">
            {!isLessonCompleted ? (
              <button
                onClick={handleNextStep}
                className="w-full h-[52px] btn-primary flex items-center justify-center font-bold text-sm"
              >
                {currentStep === lesson.steps.length - 1 ? "Complete Lesson ✓" : "Next Step"}
              </button>
            ) : (
              <div className="p-4 bg-emerald-pale/60 border border-emerald/20 rounded-xl text-emerald font-bold text-sm w-full text-center">
                <span>✓ Lesson connection checked successfully!</span>
              </div>
            )}
          </div>

        </div>

        {/* BOTTOM BUTTONS */}
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
            disabled={!isLessonCompleted}
            className={`btn-primary h-[52px] min-w-[140px] flex items-center justify-center font-bold ${
              !isLessonCompleted ? "opacity-50 cursor-not-allowed bg-zinc-400 border-zinc-400 text-zinc-300" : ""
            }`}
          >
            {activeLessonIdx === 7 ? "Finish Stage 3" : "Next Lesson"}
          </button>
        </div>

      </main>

      {/* Stage 3 complete celebration */}
      {activeLessonIdx === 7 && isLessonCompleted && (
        <div className="fixed inset-0 bg-[#1a1208]/90 z-[9999] flex flex-col items-center justify-center text-center p-6 select-none animate-[fade-in_0.35s_ease-out]">
          <span className="font-amiri-quran text-7xl text-[#e8c96a] tracking-wider mb-2 leading-normal">
            مَاشَاءَ اللَّه
          </span>
          <h2 className="text-4xl font-extrabold text-[#faf6ee] font-amiri mt-4">
            MashaAllah!
          </h2>
          <p className="text-base text-zinc-300 max-w-md leading-relaxed mt-4">
            You have successfully mastered Stage 3 letter connection. You are now ready to learn the fundamentals of Tajweed.
          </p>
          <Link
            href="/learn/tajweed"
            className="btn-primary h-[52px] min-w-[240px] flex items-center justify-center font-bold text-base bg-[#c8993c] border-[#c8993c] text-white hover:bg-gold-light mt-8"
            style={{ backgroundColor: "#c8993c", borderColor: "#c8993c" }}
          >
            Continue to Stage 4
          </Link>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
