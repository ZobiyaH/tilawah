"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Layout/Header";
import BottomNav from "@/components/Layout/BottomNav";
import SettingsDrawer from "@/components/UI/SettingsDrawer";
import { getLearningProgress, LearningProgressRecord } from "@/lib/progress";

const LETTERS = [
  { char: "ا", name: "Alif", arName: "أَلِف" },
  { char: "ب", name: "Ba", arName: "بَاء" },
  { char: "ت", name: "Ta", arName: "تَاء" },
  { char: "ث", name: "Tha", arName: "ثَاء" },
  { char: "ج", name: "Jeem", arName: "جِيم" },
  { char: "ح", name: "Haa", arName: "حَاء" },
  { char: "خ", name: "Khaa", arName: "خَاء" },
  { char: "د", name: "Daal", arName: "دَال" },
  { char: "ذ", name: "Thaal", arName: "ذَال" },
  { char: "ر", name: "Raa", arName: "رَاء" },
  { char: "ز", name: "Zay", arName: "زَاي" },
  { char: "س", name: "Seen", arName: "سِين" },
  { char: "ش", name: "Sheen", arName: "شِين" },
  { char: "ص", name: "Saad", arName: "صَاد" },
  { char: "ض", name: "Daad", arName: "ضَاد" },
  { char: "ط", name: "Taa", arName: "طَاء" },
  { char: "ظ", name: "Thaa", arName: "ظَاء" },
  { char: "ع", name: "Ayn", arName: "عَيْن" },
  { char: "غ", name: "Ghayn", arName: "غَيْن" },
  { char: "ف", name: "Faa", arName: "فَاء" },
  { char: "ق", name: "Qaf", arName: "قَاف" },
  { char: "ك", name: "Kaf", arName: "كَاف" },
  { char: "ل", name: "Laam", arName: "لَام" },
  { char: "م", name: "Meem", arName: "مِيم" },
  { char: "ن", name: "Noon", arName: "نُون" },
  { char: "ه", name: "Haa", arName: "هَاء" },
  { char: "و", name: "Waw", arName: "وَاو" },
  { char: "ي", name: "Yaa", arName: "يَاء" },
];

export default function ArabicLettersPage() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [progress, setProgress] = useState<LearningProgressRecord[]>([]);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);

  useEffect(() => {
    const prog = getLearningProgress().filter((p) => p.track === "letters");
    setProgress(prog);

    // Find the first incomplete letter index
    let activeIdx = 0;
    for (let i = 0; i < 28; i++) {
      const lessonId = `letter_${i}`;
      const completed = prog.some((p) => p.lesson_id === lessonId && p.completed);
      if (!completed) {
        activeIdx = i;
        break;
      }
      // If we made it to the end and all are completed
      if (i === 27) {
        activeIdx = 28; // All completed
      }
    }
    setActiveLessonIdx(activeIdx);
  }, []);

  return (
    <div className="min-h-screen flex flex-col pb-36 md:pb-16 relative bg-[#faf6ee] dark:bg-zinc-950 text-[#1a1208] dark:text-zinc-100 transition-colors duration-200">
      <Header />
      <SettingsDrawer isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 mt-6 flex flex-col gap-6 relative z-10">
        
        {/* Navigation back */}
        <section className="flex flex-col gap-3 items-center text-center">
          <div className="flex items-center justify-center gap-3">
            <Link href="/" className="text-[#6b7280] hover:text-[#1e5e4a] text-xs font-bold uppercase tracking-wider bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-2xs">
              Main Page
            </Link>
            <Link href="/learn" className="text-[#c8993c] hover:text-gold-light text-xs font-bold uppercase tracking-wider bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-2xs">
              Learning Roadmap
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center mt-2 gap-2 text-center w-full">
            <h2 className="font-amiri text-2xl font-bold text-emerald dark:text-emerald-light text-center w-full">
              Arabic Alphabet · الحروف الهجائية
            </h2>
            <span className="px-3 py-1 rounded-full border border-gold/30 bg-gold-pale/30 text-yellow-800 dark:text-gold-light text-[9px] font-bold uppercase tracking-wider font-lato text-center">
              28 Lessons
            </span>
          </div>
        </section>

        {/* Letters Grid */}
        <section className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4">
          {LETTERS.map((letter, idx) => {
            const lessonId = `letter_${idx}`;
            const isCompleted = progress.some((p) => p.lesson_id === lessonId && p.completed);
            const isActive = idx === activeLessonIdx;
            const isLocked = idx > activeLessonIdx;

            const cardClasses = `card relative flex flex-col items-center justify-between p-4 border rounded-xl min-h-[140px] transition-all select-none ${
              isCompleted
                ? "border-emerald/30 bg-emerald-pale/10 dark:bg-emerald-pale/5 hover:border-emerald/60 cursor-pointer"
                : isActive
                ? "border-[#c8993c] bg-white dark:bg-zinc-900 shadow-md ring-2 ring-[#c8993c]/30 cursor-pointer"
                : "border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/10 opacity-40 pointer-events-none"
            }`;

            const content = (
              <div className={cardClasses}>
                <div className="w-full flex justify-between items-center">
                  <span className="text-[9px] font-bold text-zinc-400 font-lato">
                    {idx + 1}
                  </span>
                  {isCompleted && (
                    <span className="text-xs text-gold font-bold">
                      ✓
                    </span>
                  )}
                </div>

                <span className="font-amiri-quran text-4xl text-ink leading-none my-1">
                  {letter.char}
                </span>

                <div className="text-center w-full">
                  <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider block">
                    {letter.name}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-amiri block">
                    {letter.arName}
                  </span>
                </div>

                {isActive && (
                  <div className="w-full mt-2 py-1 px-2 bg-[#1e5e4a] text-white text-[9px] font-bold uppercase tracking-wider text-center rounded-lg shadow-2xs">
                    Start Here
                  </div>
                )}
              </div>
            );

            return isLocked ? (
              <div key={idx}>{content}</div>
            ) : (
              <Link href={`/learn/arabic-letters/${idx}`} key={idx} className="block">
                {content}
              </Link>
            );
          })}
        </section>

      </main>

      <BottomNav onOpenSettings={() => setSettingsOpen(true)} />
    </div>
  );
}
