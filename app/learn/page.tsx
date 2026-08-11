"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Layout/Header";
import BottomNav from "@/components/Layout/BottomNav";
import { EmailCapture } from "@/components/email/EmailCapture";
import { getLearningProgress, LearningProgressRecord, checkNextDayReturn } from "@/lib/progress";

export default function LearnPage() {
  const [progress, setProgress] = useState<LearningProgressRecord[]>([]);
  const [surahCount, setSurahCount] = useState(0);
  const [knowsBasics, setKnowsBasics] = useState(false);

  useEffect(() => {
    setProgress(getLearningProgress());

    if (typeof window !== "undefined") {
      const storedBasics = localStorage.getItem("tilawa_knows_basics");
      if (storedBasics === "true") {
        setKnowsBasics(true);
      }

      const savedSessions = localStorage.getItem("tilawa_sessions");
      if (savedSessions) {
        try {
          const parsed = JSON.parse(savedSessions);
          const uniqueSurahs = new Set(
            parsed.map((s: { surahId: string }) => s.surahId)
          );
          setSurahCount(uniqueSurahs.size);
        } catch {
          // ignore
        }
      }

      // Check next-day return Moment B
      if (checkNextDayReturn()) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("open-email-capture", { detail: { moment: "MomentB" } }));
        }, 1500);
      }
    }
  }, []);

  // Completion metrics
  const lettersCompleted = progress.filter((p) => p.track === "letters" && p.completed).length;
  const harakatCompleted = progress.filter((p) => p.track === "harakat" && p.completed).length;
  const joiningCompleted = progress.filter((p) => p.track === "joining" && p.completed).length;
  const rulesCompleted = progress.filter((p) => p.track === "tajweed" && p.completed).length;

  const stage1Done = lettersCompleted === 28;
  const stage2Done = harakatCompleted === 10;
  const stage3Done = joiningCompleted === 8;
  const stage4Done = rulesCompleted === 12;
  const stage5Done = surahCount > 0;

  // Active stage determination
  let activeStage = 1;
  if (!stage1Done) activeStage = 1;
  else if (!stage2Done) activeStage = 2;
  else if (!stage3Done) activeStage = 3;
  else if (!stage4Done) activeStage = 4;
  else activeStage = 5;

  // Dynamic learning summary
  const getWeeklySummary = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recent = progress.filter(
      (p) => p.completed && p.last_practiced && new Date(p.last_practiced) >= oneWeekAgo
    );
    const letters = recent.filter((p) => p.track === "letters").length;
    const rules = recent.filter((p) => p.track === "tajweed").length;
    const harakat = recent.filter((p) => p.track === "harakat").length;
    const joining = recent.filter((p) => p.track === "joining").length;

    const parts = [];
    if (letters > 0) parts.push(`${letters} new letter${letters > 1 ? "s" : ""}`);
    if (harakat > 0) parts.push(`${harakat} vowel mark${harakat > 1 ? "s" : ""}`);
    if (joining > 0) parts.push(`${joining} joining lesson${joining > 1 ? "s" : ""}`);
    if (rules > 0) parts.push(`${rules} Tajweed rule${rules > 1 ? "s" : ""}`);

    if (parts.length === 0) {
      return knowsBasics
        ? "All roadmap stages are unlocked for you. Select any stage below to start learning."
        : "Start with Stage 1 below to master the Arabic alphabet with authentic Qari audio.";
    }

    let progressText = "";
    if (activeStage === 1) {
      const pct = Math.round((lettersCompleted / 28) * 100);
      progressText = ` · You are ${pct}% through Stage 1`;
    }

    return `Recent progress: ${parts.join(" · ")}${progressText}. Keep practicing!`;
  };

  const STAGES = [
    {
      id: 1,
      badge: "أ",
      title: "Stage 1 - The Alphabet",
      subtitle: "Arabic Alphabet",
      desc: "Learn the 28 letters, their sounds, and isolated & joined written forms.",
      progressText: `${lettersCompleted} of 28 letters learned`,
      url: "/learn/arabic-letters",
      isCompleted: stage1Done,
      isActive: activeStage === 1,
      isLocked: false
    },
    {
      id: 2,
      badge: "بَ",
      title: "Stage 2 - Vowel Marks",
      subtitle: "Harakat & Short Vowels",
      desc: "Master Fatha, Kasra, Damma, and silent Sukoon marks with sound.",
      progressText: (knowsBasics || stage1Done)
        ? `${harakatCompleted} of 10 vowels learned`
        : "Locked - Complete Stage 1",
      url: "/learn/harakat",
      isCompleted: stage2Done,
      isActive: activeStage === 2,
      isLocked: knowsBasics ? false : !stage1Done
    },
    {
      id: 3,
      badge: "ـبـ",
      title: "Stage 3 - Joining Letters",
      subtitle: "Connecting Forms",
      desc: "Connect letters together step-by-step to form Quranic words visually.",
      progressText: (knowsBasics || stage2Done)
        ? `${joiningCompleted} of 8 joining lessons completed`
        : "Locked - Complete Stage 2",
      url: "/learn/joining",
      isCompleted: stage3Done,
      isActive: activeStage === 3,
      isLocked: knowsBasics ? false : !stage2Done
    },
    {
      id: 4,
      badge: "تجويد",
      title: "Stage 4 - Tajweed Rules",
      subtitle: "Essential Rules",
      desc: "Master stretching (Madd), nasal humming (Ghunna), and Qalqala.",
      progressText: (knowsBasics || stage3Done)
        ? `${rulesCompleted} of 12 rules learned`
        : "Locked - Complete Stage 3",
      url: "/learn/tajweed",
      isCompleted: stage4Done,
      isActive: activeStage === 4,
      isLocked: knowsBasics ? false : !stage3Done
    },
    {
      id: 5,
      badge: "كَلِمَة",
      title: "Stage 5 - Essential Words",
      subtitle: "50 Most Common Words",
      desc: "Learn and practice the 50 most common words and phrases in the Quran with real Qari audio.",
      progressText: (knowsBasics || stage4Done)
        ? "Practice anytime"
        : "Locked - Complete Stage 4",
      url: "/learn/common-words",
      isCompleted: false,
      isActive: activeStage === 5,
      isLocked: knowsBasics ? false : !stage4Done
    },
    {
      id: 6,
      badge: "الفاتحة",
      title: "Stage 6 - Recite Surahs",
      subtitle: "Surah Practice",
      desc: "Apply rules to short Surahs, starting with Surah Al-Fatiha.",
      progressText: (knowsBasics || stage4Done)
        ? `${surahCount} of 10 Surahs completed`
        : "Locked - Complete Stage 4",
      url: "/learn/short-surahs",
      isCompleted: stage5Done,
      isActive: activeStage === 5,
      isLocked: knowsBasics ? false : !stage4Done
    }
  ];

  return (
    <div className="min-h-screen flex flex-col pb-28 md:pb-16 relative bg-[#faf6ee] dark:bg-zinc-950 text-[#1a1208] dark:text-zinc-100 transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 flex flex-col gap-10 relative z-10">
        
        {/* Hub Header */}
        <div className="text-center flex flex-col items-center gap-3 max-w-2xl mx-auto">
          <Link
            href="/"
            className="text-[#6b7280] hover:text-[#1e5e4a] text-xs font-bold uppercase tracking-wider bg-white px-3.5 py-1.5 rounded-lg border border-zinc-200 shadow-2xs transition-colors self-center mb-1"
          >
            Back to Main Page
          </Link>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1208] tracking-tight font-amiri">
            Your Learning Journey
          </h2>
          <p className="text-sm text-[#6b7280] font-bold uppercase tracking-wider">
            {knowsBasics
              ? "All 5 stages unlocked for your practice"
              : "Master Tajweed step-by-step from alphabet to full Surahs"}
          </p>
        </div>

        {/* Dynamic Learning Mode Summary */}
        <div className="card border-l-4 border-l-[#c8993c] bg-white p-5 shadow-sm text-sm font-medium text-[#1a1208]/80 leading-relaxed max-w-3xl mx-auto w-full rounded-2xl">
          <div className="flex items-center justify-between gap-4 mb-1">
            <strong className="text-[11px] text-[#c8993c] uppercase tracking-widest font-bold">
              Learning Status
            </strong>
            <span className="text-xs font-bold text-[#1e5e4a] bg-[#1e5e4a]/10 px-2.5 py-0.5 rounded-full">
              {knowsBasics ? "All Stages Unlocked" : "Sequential Progression"}
            </span>
          </div>
          <p className="text-sm text-[#6b7280] font-medium">{getWeeklySummary()}</p>
        </div>

        {/* 5-Stage Grid Layout - Full Width Visibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mt-4">
          {STAGES.map((stage) => {
            const isSelectable = !stage.isLocked;

            return (
              <React.Fragment key={stage.id}>
                <div
                  className={`card p-5 bg-white border rounded-2xl flex flex-col items-center md:items-stretch justify-between text-center md:text-left h-full gap-4 transition-all duration-200 overflow-hidden ${
                    stage.isActive
                      ? "border-[#c8993c] shadow-lg ring-2 ring-[#c8993c]/20"
                      : stage.isCompleted
                      ? "border-[#1e5e4a]/40 bg-white"
                      : stage.isLocked
                      ? "border-zinc-200 opacity-60 bg-zinc-50/50 dark:bg-zinc-900/50 dark:border-zinc-800"
                      : "border-zinc-200 hover:border-[#c8993c]/50 hover:shadow-md"
                  }`}
                >
                  {/* Top Section */}
                  <div className="flex flex-col items-center md:items-stretch gap-3 w-full">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-2 min-h-[44px]">
                      <span className="w-9 h-9 rounded-full bg-[#1e5e4a] text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                        {stage.isCompleted ? "✓" : stage.id}
                      </span>
                      <div className="h-10 flex items-center justify-end font-amiri text-2xl md:text-3xl font-bold text-[#c8993c]">
                        {stage.badge}
                      </div>
                    </div>

                    <div className="text-center md:text-left">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">
                        Stage {stage.id}
                      </span>
                      <h3 className="text-base font-bold text-[#1a1208] leading-snug mt-0.5 text-center md:text-left">
                        {stage.subtitle}
                      </h3>
                    </div>

                    <p className="text-xs text-[#6b7280] leading-relaxed text-center md:text-left">
                      {stage.desc}
                    </p>
                  </div>

                  {/* Bottom Section - Start Here Button strictly inside Card */}
                  <div className="flex flex-col items-center md:items-stretch gap-3 pt-3 border-t border-zinc-100 mt-auto w-full text-center md:text-left">
                    <span className="text-[11px] font-bold text-[#1e5e4a] text-center md:text-left">
                      {stage.progressText}
                    </span>

                    {isSelectable ? (
                      <Link
                        href={stage.url}
                        className={`h-11 w-full flex items-center justify-center font-bold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-2xs ${
                          stage.isActive
                            ? "bg-[#c8993c] text-white hover:bg-gold-light border border-[#c8993c]"
                            : "bg-[#1e5e4a] text-white hover:bg-[#154536] border border-[#1e5e4a]"
                        }`}
                      >
                        {stage.isActive ? "Start Here" : `Start Stage ${stage.id}`}
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="h-11 w-full flex items-center justify-center font-bold text-[11px] uppercase tracking-wider rounded-xl bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200"
                      >
                        Locked
                      </button>
                    )}
                  </div>
                </div>

                {stage.id === 2 && (
                  <div className="card p-5 bg-white border border-[#c8993c]/20 rounded-2xl flex flex-col justify-center text-center h-full gap-4 transition-all duration-200">
                    <EmailCapture
                      variant="inline"
                      source="learn_inline"
                      heading="Save your progress"
                      subheading="Receive reports & new lessons."
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

      </main>

      <BottomNav />
    </div>
  );
}
