"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ALL_SURAHS } from "../../lib/quran/surahs";
import { SessionResult, SurahMetadata } from "../../types";
import Header from "../../components/Layout/Header";
import { motion } from "framer-motion";
import SettingsDrawer from "../../components/UI/SettingsDrawer";
import BottomNav from "../../components/Layout/BottomNav";

import { checkNextDayReturn } from "../../lib/progress";

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasSessions, setHasSessions] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [notifiedSurahs, setNotifiedSurahs] = useState<Record<string, boolean>>({});
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({
    avgAccuracy: 0,
    avgTajweed: 0,
    avgFluency: 0,
    totalAyatRecited: 0,
  });

  // Calculate average stats from saved sessions and initialize votes/notifications
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tilawa_sessions");
      if (saved) {
        try {
          const sessions: SessionResult[] = JSON.parse(saved);
          if (sessions.length > 0) {
            setHasSessions(true);
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

      // Load notification state
      const savedNotifications = localStorage.getItem("tilawah_notified_surahs");
      if (savedNotifications) {
        try {
          setNotifiedSurahs(JSON.parse(savedNotifications));
        } catch {
          // Ignore
        }
      }

      // Load votes state
      const savedVotes = localStorage.getItem("tilawah_surah_votes");
      const defaultVotes: Record<string, number> = {
        "2": 142, // Al-Baqarah
        "18": 98,  // Al-Kahf
        "12": 76,  // Yusuf
        "19": 64,  // Maryam
        "56": 53,  // Al-Waqi'ah
      };
      if (savedVotes) {
        try {
          const parsedVotes = JSON.parse(savedVotes);
          setVotes({ ...defaultVotes, ...parsedVotes });
        } catch {
          setVotes(defaultVotes);
        }
      } else {
        localStorage.setItem("tilawah_surah_votes", JSON.stringify(defaultVotes));
        setVotes(defaultVotes);
      }

      // Check next-day return Moment B
      if (checkNextDayReturn()) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("open-email-capture", { detail: { moment: "MomentB" } }));
        }, 1500);
      }
    }
  }, []);

  const handleNotifyMe = (surahId: string) => {
    const newNotifications = { ...notifiedSurahs, [surahId]: true };
    setNotifiedSurahs(newNotifications);
    localStorage.setItem("tilawah_notified_surahs", JSON.stringify(newNotifications));

    const newVotes = { ...votes, [surahId]: (votes[surahId] || 0) + 1 };
    setVotes(newVotes);
    localStorage.setItem("tilawah_surah_votes", JSON.stringify(newVotes));
  };

  const filteredSurahs = ALL_SURAHS.filter(
    (s) =>
      s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.includes(searchQuery)
  );

  const availableNow = filteredSurahs.filter(s => s.isImplemented);
  const comingThisMonth = filteredSurahs.filter(s => !s.isImplemented && s.number >= 2 && s.number <= 15);
  const roadmap = filteredSurahs.filter(s => !s.isImplemented && (s.number < 2 || s.number > 15));

  const topRequested = ALL_SURAHS
    .filter(s => !s.isImplemented)
    .map(s => ({
      ...s,
      voteCount: votes[s.id] || (s.id === "2" ? 142 : s.id === "18" ? 98 : s.id === "12" ? 76 : s.id === "19" ? 64 : s.id === "56" ? 53 : 0)
    }))
    .sort((a, b) => b.voteCount - a.voteCount)
    .slice(0, 5);

  const toArabicNum = (num: number) => {
    const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    return String(num)
      .split("")
      .map((d) => arabicDigits[Number(d)] || d)
      .join("");
  };

  const renderSurahCard = (surah: SurahMetadata) => {
    const arabicNum = toArabicNum(surah.number);
    const hasNotified = notifiedSurahs[surah.id];

    return (
      <div
        className={`card p-5 relative overflow-hidden transition-all flex flex-col justify-between min-h-[145px] border ${
          surah.isImplemented
            ? "border-gold/30 hover:border-gold/80 hover:shadow-lg cursor-pointer bg-white/60 dark:bg-zinc-800/10 hover:-translate-y-0.5"
            : "bg-zinc-100/50 dark:bg-zinc-800/10 border-zinc-200 dark:border-zinc-800"
        }`}
      >
        <span className="absolute top-3 right-3 text-2xl font-bold opacity-30 text-gold font-amiri select-none">
          {arabicNum}
        </span>

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
          {surah.isImplemented ? (
            <>
              <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border bg-emerald-pale/50 border-emerald/30 text-emerald dark:text-emerald-light">
                Ready
              </span>
              <span className="text-[10px] font-bold text-gold hover:text-gold-light">
                Recite
              </span>
            </>
          ) : (
            <>
              {hasNotified ? (
                <span className="text-[9px] font-bold text-emerald flex items-center gap-1">
                  ✓ Notified
                </span>
              ) : (
                <button
                  onClick={() => handleNotifyMe(surah.id)}
                  className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-gold/10 text-gold hover:bg-gold hover:text-white transition-all cursor-pointer"
                >
                  Notify me
                </button>
              )}
              <span className="text-[8px] text-zinc-400 font-bold">
                Coming Soon
              </span>
            </>
          )}
        </div>
      </div>
    );
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
      <SettingsDrawer isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 mt-8 flex flex-col gap-8 relative z-10">
        
        {/* Progress Stats Section */}
        {hasSessions ? (
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
        ) : (
          <section className="card p-8 text-center bg-gradient-to-br from-white to-[#faf6ee]/60 border border-[#c8993c]/20 rounded-3xl shadow-xs flex flex-col items-center justify-center gap-4 py-10">
            <span className="text-3xl">🎯</span>
            <h3 className="font-bold text-[#1a1208] text-base">Complete your first recitation to see your stats here</h3>
            <p className="text-xs text-zinc-500 max-w-sm">
              Your progress analytics, pronunciation accuracy, fluency, and words practiced will update automatically.
            </p>
            <button
              onClick={() => {
                document.getElementById("surah-list-heading")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-6 py-2.5 bg-[#1e5e4a] hover:bg-emerald text-white rounded-xl text-xs font-bold tracking-wider transition-all shadow-md shadow-emerald/10 uppercase cursor-pointer"
            >
              Start Reciting →
            </button>
          </section>
        )}

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
            placeholder="Type surah name (e.g. Al-Fatiha, Ya-Sin)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-4 rounded-xl border border-gold/30 bg-white/70 dark:bg-zinc-800/20 text-ink outline-none focus:border-gold transition-colors text-sm shadow-sm"
          />
        </section>

        {/* Surah Selection Lists */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3" id="surah-list-heading">
            <h2 className="font-amiri text-2xl font-bold text-emerald dark:text-emerald-light uppercase" style={{ letterSpacing: "1px" }}>
              Surah List · فهرس السور
            </h2>
            {/* Progress indicator */}
            <div className="flex items-center gap-3 bg-[#faf6ee] border border-gold/20 px-4 py-1.5 rounded-full text-[11px] font-bold text-zinc-700">
              <span className="flex h-2 w-2 rounded-full bg-emerald"></span>
              <span>7 of 114 Surahs available — we&apos;re adding more every week</span>
            </div>
          </div>

          {/* Section 1: Available Now */}
          {availableNow.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-emerald/80 border-b border-emerald/10 pb-1">
                Available Now
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {availableNow.map((surah) => (
                  <Link href={`/recite/${surah.id}`} key={surah.id}>
                    {renderSurahCard(surah)}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Coming This Month */}
          {comingThisMonth.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-gold/80 border-b border-gold/10 pb-1">
                Coming This Month
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {comingThisMonth.map((surah) => (
                  <div key={surah.id}>
                    {renderSurahCard(surah)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Full Quran Roadmap */}
          {roadmap.length > 0 && (
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setShowRoadmap(!showRoadmap)}
                className="w-full flex items-center justify-between py-3 px-5 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-all cursor-pointer"
              >
                <span>Full Quran Roadmap ({roadmap.length} Surahs)</span>
                <span>{showRoadmap ? "Collapse" : "Show all 114 surahs"}</span>
              </button>

              {showRoadmap && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-[slide-down_0.25s_ease-out]">
                  {roadmap.map((surah) => (
                    <div key={surah.id}>
                      {renderSurahCard(surah)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Voting Community Signal */}
        <section className="bg-white border border-[#c8993c]/15 p-6 rounded-3xl shadow-xs flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-sm text-[#1a1208]">🗳️ Which surah should we add next?</h3>
            <p className="text-[11px] text-zinc-500">Vote by clicking &quot;Notify me&quot; on any coming soon surah above!</p>
          </div>
          <div className="flex flex-col gap-2">
            {topRequested.map((s, idx) => (
              <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-zinc-100 last:border-0 text-xs font-medium">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400 font-bold w-4">#{idx + 1}</span>
                  <span className="text-[#1a1208]">{s.englishName} <span className="font-amiri font-bold text-zinc-500 ml-1">({s.name})</span></span>
                </div>
                <span className="bg-[#c8993c]/10 text-[#c8993c] px-3 py-1 rounded-full font-bold text-[10px]">
                  {s.voteCount} Votes
                </span>
              </div>
            ))}
          </div>
        </section>

      </main>
      <BottomNav />
    </motion.div>
  );
}
