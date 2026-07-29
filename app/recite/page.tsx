"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ALL_SURAHS } from "../../lib/quran/surahs";
import { SessionResult } from "../../types";
import Header from "../../components/Layout/Header";
import { motion } from "framer-motion";
import SettingsDrawer from "../../components/UI/SettingsDrawer";
import BottomNav from "../../components/Layout/BottomNav";

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stats, setStats] = useState({
    avgAccuracy: 0,
    avgTajweed: 0,
    avgFluency: 0,
    totalAyatRecited: 0,
  });

  // Calculate average stats from saved sessions
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tilawa_sessions");
      if (saved) {
        try {
          const sessions: SessionResult[] = JSON.parse(saved);
          if (sessions.length > 0) {
            const sumAcc = sessions.reduce((acc, s) => acc + s.accuracy, 0);
            const sumTaj = sessions.reduce((acc, s) => acc + s.tajweed, 0);
            const sumFlu = sessions.reduce((acc, s) => acc + s.fluency, 0);
            const sumWords = sessions.reduce((acc, s) => acc + s.totalWords, 0);

            setStats({
              avgAccuracy: Math.round(sumAcc / sessions.length),
              avgTajweed: Math.round(sumTaj / sessions.length),
              avgFluency: Math.round(sumFlu / sessions.length),
              totalAyatRecited: sumWords,
            });
          }
        } catch (e) {
          console.warn("Failed to parse sessions stats:", e);
        }
      }
    }
  }, []);

  const filteredSurahs = ALL_SURAHS.filter(
    (s) =>
      s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.includes(searchQuery)
  );

  const toArabicNum = (num: number) => {
    const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    return String(num)
      .split("")
      .map((d) => arabicDigits[Number(d)] || d)
      .join("");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen flex flex-col pb-16 relative"
    >
      <Header showSettingsBtn onOpenSettings={() => setSettingsOpen(true)} />

      {/* Settings Panel Drawer */}
      <SettingsDrawer isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 mt-8 flex flex-col gap-8 relative z-10">
        
        {/* Progress Stats Summary Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-5 text-center bg-white/60 dark:bg-zinc-800/10">
            <span className="text-zinc-400 font-bold uppercase block mb-1" style={{ fontSize: "10px", letterSpacing: "3px" }}>
              Avg Accuracy
            </span>
            <span className="text-3xl font-bold text-emerald dark:text-emerald-light">
              {stats.avgAccuracy}%
            </span>
          </div>

          <div className="card p-5 text-center bg-white/60 dark:bg-zinc-800/10">
            <span className="text-zinc-400 font-bold uppercase block mb-1" style={{ fontSize: "10px", letterSpacing: "3px" }}>
              Tajweed Quality
            </span>
            <span className="text-3xl font-bold text-emerald dark:text-emerald-light">
              {stats.avgTajweed}%
            </span>
          </div>

          <div className="card p-5 text-center bg-white/60 dark:bg-zinc-800/10">
            <span className="text-zinc-400 font-bold uppercase block mb-1" style={{ fontSize: "10px", letterSpacing: "3px" }}>
              Recitation Fluency
            </span>
            <span className="text-3xl font-bold text-emerald dark:text-emerald-light">
              {stats.avgFluency}%
            </span>
          </div>

          <div className="card p-5 text-center bg-white/60 dark:bg-zinc-800/10">
            <span className="text-zinc-400 font-bold uppercase block mb-1" style={{ fontSize: "10px", letterSpacing: "3px" }}>
              Words Checked
            </span>
            <span className="text-3xl font-bold text-gold">
              {stats.totalAyatRecited}
            </span>
          </div>
        </section>

        {/* View Progress History Banner */}
        <section className="flex justify-between items-center bg-emerald-pale/25 border border-emerald/20 p-5 rounded-2xl shadow-sm">
          <div>
            <h3 className="font-bold text-sm text-emerald dark:text-emerald-light">
              📊 Performance Tracker &amp; Session History
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Visualize your learning curve, tajweed errors, and accuracy metrics over time.
            </p>
          </div>
          <Link
            href="/progress"
            className="px-5 py-2.5 bg-emerald text-white rounded-xl text-xs font-bold tracking-wider hover:bg-emerald-light transition-all shadow-md shadow-emerald/10 uppercase"
          >
            Open Analytics
          </Link>
        </section>

        {/* Search bar */}
        <section className="flex flex-col gap-2">
          <label className="text-zinc-400 font-bold uppercase" style={{ fontSize: "10px", letterSpacing: "3px" }}>
            Search Surah Range
          </label>
          <input
            type="text"
            placeholder="Type surah name (e.g. Al-Fatiha, يس)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-4 rounded-xl border border-gold/30 bg-white/70 dark:bg-zinc-800/20 text-ink outline-none focus:border-gold transition-colors text-sm shadow-sm"
          />
        </section>

        {/* Grid Selector (2 cols mobile, 3 cols desktop) */}
        <section className="flex flex-col gap-4">
          <h2 className="font-amiri text-lg font-bold text-emerald dark:text-emerald-light uppercase" style={{ letterSpacing: "1px" }}>
            Surah List · فهرس السور
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredSurahs.map((surah) => {
              const label = surah.isImplemented ? "Ready" : "Coming Soon";
              const arabicNum = toArabicNum(surah.number);

              const cardContent = (
                <div
                  className={`card p-5 relative overflow-hidden transition-all flex flex-col justify-between min-h-[145px] border ${
                    surah.isImplemented
                      ? "border-gold/30 hover:border-gold/80 hover:shadow-lg cursor-pointer bg-white/60 dark:bg-zinc-800/10 hover:-translate-y-0.5"
                      : "opacity-45 bg-zinc-100 dark:bg-zinc-800/20 border-zinc-200 dark:border-zinc-800 select-none"
                  }`}
                >
                  {/* Surah number in Arabic numeral badge */}
                  <span className="absolute top-3 right-3 text-2xl font-bold opacity-30 text-gold font-amiri select-none">
                    {arabicNum}
                  </span>

                  {/* Crescent moon SVG icon */}
                  <div className="absolute bottom-3 right-3 opacity-25">
                    <svg className="w-5 h-5 text-gold" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3a9 9 0 1 0 9 9 9.93 9.93 0 0 0-.18-1.78 7 7 0 0 1-7.04-7.04A9.78 9.78 0 0 0 12 3z"/>
                    </svg>
                  </div>

                  <div>
                    <h3 className="font-amiri text-lg font-bold text-ink">
                      {surah.name}
                    </h3>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold block mt-0.5 uppercase tracking-wider">
                      {surah.englishName}
                    </p>
                    <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-2 font-bold">
                      {surah.totalAyat} Verses
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4 z-10">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${
                        surah.isImplemented
                          ? "bg-emerald-pale/50 border-emerald/30 text-emerald dark:text-emerald-light"
                          : "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 text-zinc-400"
                      }`}
                    >
                      {label}
                    </span>

                    {surah.isImplemented && (
                      <span className="text-[10px] font-bold text-gold hover:text-gold-light">
                        Recite
                      </span>
                    )}
                  </div>
                </div>
              );

              return surah.isImplemented ? (
                <Link href={`/recite/${surah.id}`} key={surah.id}>
                  {cardContent}
                </Link>
              ) : (
                <div key={surah.id}>
                  {cardContent}
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* Mobile bottom nav bar */}
      <BottomNav onOpenSettings={() => setSettingsOpen(true)} />
    </motion.div>
  );
}
