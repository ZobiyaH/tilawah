"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Layout/Header";
import BottomNav from "@/components/Layout/BottomNav";
import { getLearningProgress, LearningProgressRecord } from "@/lib/progress";

const TAJWEED_RULES = [
  { id: "tajweed_0", name: "What is Tajweed?", engName: "Beautifying your recitation", arabic: "أحكام التجويد", count: "Rule 1" },
  { id: "tajweed_1", name: "Madd", engName: "When to stretch a sound", arabic: "مَدّ", count: "Rule 2" },
  { id: "tajweed_2", name: "Ghunna", engName: "The nasal hum sound", arabic: "غُنَّة", count: "Rule 3" },
  { id: "tajweed_3", name: "Shaddah", engName: "The doubled letter", arabic: "شَدَّة", count: "Rule 4" },
  { id: "tajweed_4", name: "Qalqala", engName: "The echo bounce consonants", arabic: "قَلْقَلَة", count: "Rule 5" },
  { id: "tajweed_5", name: "Noon Sakin", engName: "The silent N rules", arabic: "نُون سَاكِنَة", count: "Rule 6" },
  { id: "tajweed_6", name: "Idgham", engName: "Merging two meeting letters", arabic: "إِدْغَام", count: "Rule 7" },
  { id: "tajweed_7", name: "Ikhfa", engName: "The soft hidden nasal sound", arabic: "إِخْفَاء", count: "Rule 8" },
  { id: "tajweed_8", name: "Iqlab", engName: "The conversion to Meem", arabic: "إِقْلَاب", count: "Rule 9" },
  { id: "tajweed_9", name: "Izhar", engName: "Clear Noon pronunciation", arabic: "إِظْهَار", count: "Rule 10" },
  { id: "tajweed_10", name: "Lam in Allah", engName: "Heavy and light L sound", arabic: "لام لفظ الجلالة", count: "Rule 11" },
  { id: "tajweed_11", name: "Putting it all together", engName: "Recite Al-Fatiha with rules", arabic: "ترتيل القرآن", count: "Rule 12" }
];

export default function TajweedRulesPage() {
  const [progress, setProgress] = useState<LearningProgressRecord[]>([]);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);

  useEffect(() => {
    const prog = getLearningProgress().filter((p) => p.track === "tajweed");
    setProgress(prog);

    let activeIdx = 0;
    for (let i = 0; i < 12; i++) {
      const lessonId = `tajweed_${i}`;
      const completed = prog.some((p) => p.lesson_id === lessonId && p.completed);
      if (!completed) {
        activeIdx = i;
        break;
      }
      if (i === 11) {
        activeIdx = 12; // All completed
      }
    }
    setActiveLessonIdx(activeIdx);
  }, []);

  return (
    <div className="min-h-screen flex flex-col pb-24 relative bg-[#faf6ee] text-[#1a1208] transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 flex flex-col gap-6 relative z-10">
        
        {/* Navigation & Header */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[#6b7280] hover:text-[#1e5e4a] text-xs font-bold uppercase tracking-wider bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-2xs">
              Main Page
            </Link>
            <Link href="/learn" className="text-[#c8993c] hover:text-gold-light text-xs font-bold uppercase tracking-wider bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-2xs">
              Learning Roadmap
            </Link>
          </div>
          <div className="flex justify-between items-center mt-1">
            <h2 className="font-amiri text-2xl font-bold text-[#1e5e4a]">
              Stage 4 - Tajweed Basics
            </h2>
            <span className="px-3 py-1 rounded-full border border-[#c8993c]/30 bg-[#fdf8f0] text-[#c8993c] text-[10px] font-bold uppercase tracking-wider">
              12 Lessons
            </span>
          </div>
        </section>

        {/* Rules Grid list */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TAJWEED_RULES.map((rule, idx) => {
            const isCompleted = progress.some((p) => p.lesson_id === rule.id && p.completed);
            const isActive = idx === activeLessonIdx;
            const isLocked = idx > activeLessonIdx;

            const cardClasses = `card relative flex flex-col justify-between p-5 border rounded-xl min-h-[150px] transition-all select-none ${
              isCompleted
                ? "border-emerald/30 bg-emerald-pale/10 hover:border-emerald/60 cursor-pointer"
                : isActive
                ? "border-[#c8993c] bg-white shadow-md ring-2 ring-[#c8993c]/25 cursor-pointer"
                : "border-zinc-200 bg-zinc-100 opacity-40 pointer-events-none"
            }`;

            const content = (
              <div className={cardClasses}>
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-bold text-[#c8993c] uppercase tracking-wider leading-none">
                    {rule.count}
                  </span>
                  {isCompleted && (
                    <span className="text-emerald font-bold text-xs">✓ Done</span>
                  )}
                </div>

                <div className="mt-3">
                  <h3 className="text-[#1a1208] text-base font-bold leading-tight">
                    {rule.name}
                  </h3>
                  <p className="text-[11px] text-[#6b7280] leading-snug mt-1 font-semibold">
                    {rule.engName}
                  </p>
                </div>

                <div className="flex justify-between items-center border-t border-zinc-100 pt-3 mt-3">
                  <span className="font-amiri text-lg font-bold text-[#1e5e4a] leading-none">
                    {rule.arabic}
                  </span>
                  {isActive && (
                    <span className="py-1 px-2 bg-[#1e5e4a] text-white text-[9px] font-bold uppercase tracking-wider rounded-lg shadow-2xs">
                      Start Here
                    </span>
                  )}
                </div>
              </div>
            );

            if (isLocked) {
              return <div key={rule.id}>{content}</div>;
            }

            return (
              <Link href={`/learn/tajweed/${idx}`} key={rule.id} className="block">
                {content}
              </Link>
            );
          })}
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
