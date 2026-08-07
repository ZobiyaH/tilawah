/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../components/Layout/Header";
import BottomNav from "../../components/Layout/BottomNav";
import { SessionResult } from "../../types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { useToast } from "../../components/UI/Toast";
import { getLearningProgress, getStreak } from "../../lib/progress";

export default function ProgressPage() {
  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [learnProgress, setLearnProgress] = useState<any[]>([]);
  const [surahCount, setSurahCount] = useState(0);
  const { showToast } = useToast();

  const [username, setUsername] = useState("Tilawah Student");
  const [avatar, setAvatar] = useState("🌙");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setStreak(getStreak());
      setLearnProgress(getLearningProgress());
      
      const savedUser = localStorage.getItem("tilawa_user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed.username) setUsername(parsed.username);
          if (parsed.avatar) setAvatar(parsed.avatar);
        } catch {
          // ignore
        }
      }

      const saved = localStorage.getItem("tilawa_sessions");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSessions(parsed);
          const uniqueSurahs = new Set(parsed.map((s: any) => s.surahId));
          setSurahCount(uniqueSurahs.size);
        } catch (e) {
          console.warn("Failed to parse sessions on progress mount:", e);
        }
      }
      const handleUserUpdate = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail) {
          if (detail.username) setUsername(detail.username);
          if (detail.avatar) setAvatar(detail.avatar);
        }
      };

      window.addEventListener("tilawa-user-updated", handleUserUpdate);
      return () => {
        window.removeEventListener("tilawa-user-updated", handleUserUpdate);
      };
    }
  }, []);

  const handleClear = () => {
    if (confirm("Are you sure you want to clear your entire recitation history?")) {
      localStorage.removeItem("tilawa_sessions");
      setSessions([]);
      showToast("🗑 Recitation History Cleared!");
    }
  };

  // Prepare chart data format
  const chartData = sessions.map((s, idx) => ({
    name: `Session ${idx + 1}`,
    Date: new Date(s.timestamp).toLocaleDateString([], { month: "short", day: "numeric" }),
    Accuracy: s.accuracy,
    Tajweed: s.tajweed,
    Fluency: s.fluency,
    Overall: s.overall,
  }));

  // Aggregated Stats
  const totalSessions = sessions.length;
  const highestScore = totalSessions > 0 ? Math.max(...sessions.map((s) => s.overall)) : 0;
  const averageAccuracy = totalSessions > 0 ? Math.round(sessions.reduce((acc, s) => acc + s.accuracy, 0) / totalSessions) : 0;

  // Learning Progress Metrics
  const lettersCompleted = learnProgress.filter((p) => p.track === "letters" && p.completed).length;
  const harakatCompleted = learnProgress.filter((p) => p.track === "harakat" && p.completed).length;
  const joiningCompleted = learnProgress.filter((p) => p.track === "joining" && p.completed).length;
  const rulesCompleted = learnProgress.filter((p) => p.track === "tajweed" && p.completed).length;



  return (
    <div className="min-h-screen flex flex-col pb-28 md:pb-16 relative bg-[#faf6ee] dark:bg-zinc-950 text-[#1a1208] dark:text-zinc-100 transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 mt-8 flex flex-col gap-6 relative z-10">
        
        {/* User Profile Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-r from-emerald-950 via-emerald-900 to-zinc-950 p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Decorative glowing circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none"></div>

          <div className="flex gap-4 items-center relative z-10">
            {/* Avatar Circle with Gold border */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-gold bg-emerald-pale/20 flex items-center justify-center text-3xl md:text-4xl shadow-lg relative">
              {avatar}
              <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald border border-gold rounded-full flex items-center justify-center text-[10px]">
                ✓
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase tracking-widest text-gold font-bold">
                Student Profile
              </span>
              <h3 className="font-amiri text-2xl md:text-3xl font-extrabold text-[#e8d5a3] tracking-tight leading-tight">
                {username}
              </h3>
              <span className="text-[10px] text-zinc-300 font-semibold italic max-w-md mt-0.5 leading-normal">
                &quot;The best of you are those who learn the Qur&apos;an and teach it.&quot; · خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
              </span>
            </div>
          </div>

          {/* Stats Badge Column */}
          <div className="flex gap-4 relative z-10 w-full md:w-auto justify-between md:justify-end border-t border-white/10 pt-4 md:border-none md:pt-0">
            <div className="flex flex-col items-start md:items-end">
              <span className="text-[8px] uppercase tracking-widest text-zinc-400 font-bold">
                Honorary Rank
              </span>
              <span className="text-sm font-bold text-gold font-lato mt-0.5">
                {totalSessions > 15 ? "Qari' (Reciter) 🌟" : totalSessions > 5 ? "Muta'allim (Learner) 📚" : "Mubtadi' (Beginner) 🌱"}
              </span>
            </div>
            <div className="w-[1px] h-8 bg-white/15 hidden md:block"></div>
            <div className="flex flex-col items-start md:items-end">
              <span className="text-[8px] uppercase tracking-widest text-zinc-400 font-bold">
                Daily Streak
              </span>
              <span className="text-sm font-bold text-emerald-light mt-0.5 flex items-center gap-1">
                {streak > 0 ? `${streak} Day${streak !== 1 ? "s" : ""} 🔥` : "0 Days ❄️"}
              </span>
            </div>
          </div>
        </section>

        {/* Dashboard Actions */}
        <section className="flex justify-between items-center mt-2">
          <div>
            <h3 className="font-amiri text-lg font-bold text-emerald dark:text-emerald-light">
              📊 Analytics Dashboard · لوحة المتابعة
            </h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-semibold">
              Review pronunciation history, accuracy curves, and tajweed rule alerts.
            </p>
          </div>
          {totalSessions > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 border border-ruby/30 hover:bg-ruby-pale text-ruby font-bold text-[9px] tracking-wider rounded-xl uppercase transition-colors"
            >
              Clear Logs
            </button>
          )}
        </section>

        {/* 2. LEARNING ROADMAP PROGRESS SECTION */}
        <section className="flex flex-col gap-4 mt-2">
          <h3 className="font-amiri text-lg font-bold text-emerald dark:text-emerald-light">
            📖 Curriculum Stage Progress - تقدم المنهج الدراسي
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Stage 1 Card */}
            <div className="card p-5 bg-white/60 dark:bg-zinc-800/10 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest text-[#1e5e4a] font-black">Stage 1</span>
                <span className="text-xs font-bold text-zinc-500">{lettersCompleted}/28</span>
              </div>
              <h4 className="font-bold text-sm text-[#1a1208]">The Alphabet</h4>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#1e5e4a] h-full transition-all duration-500" 
                  style={{ width: `${(lettersCompleted / 28) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Stage 2 Card */}
            <div className="card p-5 bg-white/60 dark:bg-zinc-800/10 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest text-[#1e5e4a] font-black">Stage 2</span>
                <span className="text-xs font-bold text-zinc-500">{harakatCompleted}/10</span>
              </div>
              <h4 className="font-bold text-sm text-[#1a1208]">Vowel Marks</h4>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#1e5e4a] h-full transition-all duration-500" 
                  style={{ width: `${(harakatCompleted / 10) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Stage 3 Card */}
            <div className="card p-5 bg-white/60 dark:bg-zinc-800/10 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest text-[#1e5e4a] font-black">Stage 3</span>
                <span className="text-xs font-bold text-zinc-500">{joiningCompleted}/8</span>
              </div>
              <h4 className="font-bold text-sm text-[#1a1208]">Joining Letters</h4>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#1e5e4a] h-full transition-all duration-500" 
                  style={{ width: `${(joiningCompleted / 8) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Stage 4 Card */}
            <div className="card p-5 bg-white/60 dark:bg-zinc-800/10 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest text-[#1e5e4a] font-black">Stage 4</span>
                <span className="text-xs font-bold text-zinc-500">{rulesCompleted}/12</span>
              </div>
              <h4 className="font-bold text-sm text-[#1a1208]">Tajweed Rules</h4>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#1e5e4a] h-full transition-all duration-500" 
                  style={{ width: `${(rulesCompleted / 12) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Stage 5 Card */}
            <div className="card p-5 bg-white/60 dark:bg-zinc-800/10 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest text-[#1e5e4a] font-black">Stage 5</span>
                <span className="text-xs font-bold text-zinc-500">{surahCount}/10</span>
              </div>
              <h4 className="font-bold text-sm text-[#1a1208]">Recite Surahs</h4>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#1e5e4a] h-full transition-all duration-500" 
                  style={{ width: `${Math.min((surahCount / 10) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. RECITATION ANALYTICS DASHBOARD */}
        {totalSessions === 0 ? (
          <div className="card p-12 text-center text-zinc-400 flex flex-col items-center justify-center gap-4 bg-white/60 dark:bg-zinc-800/10">
            <span className="text-5xl">📊</span>
            <div>
              <h4 className="font-bold text-sm text-ink mb-1">No Surah Recitation Sessions Logged Yet</h4>
              <p className="text-xs max-w-md mx-auto leading-relaxed">
                Recite any surah range and save your score at the end of the session to display learning performance curves here.
              </p>
            </div>
            <Link
              href="/recite"
              className="px-5 py-2.5 bg-emerald text-white text-xs font-bold tracking-wider rounded-xl hover:bg-emerald-light uppercase transition-all shadow-md shadow-emerald/10"
            >
              Start Reciting
            </Link>
          </div>
        ) : (
          <>
            {/* Aggregate Stats Cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-5 bg-white/60 dark:bg-zinc-800/10 text-center">
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-1">
                  Completed Recitations
                </span>
                <span className="text-3xl font-bold text-emerald dark:text-emerald-light">
                  {totalSessions}
                </span>
              </div>
              <div className="card p-5 bg-white/60 dark:bg-zinc-800/10 text-center">
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-1">
                  All-Time High Score
                </span>
                <span className="text-3xl font-bold text-gold">
                  {highestScore}%
                </span>
              </div>
              <div className="card p-5 bg-white/60 dark:bg-zinc-800/10 text-center">
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-1">
                  Average Accuracy Rate
                </span>
                <span className="text-3xl font-bold text-emerald dark:text-emerald-light">
                  {averageAccuracy}%
                </span>
              </div>
            </section>

            {/* Performance curves charts */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Overall Score Trend Curve */}
              <div className="card p-5 bg-white/60 dark:bg-zinc-800/10 flex flex-col gap-4">
                <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
                  Overall Score Trends
                </h3>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#c8993c" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#c8993c" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" fontSize={9} stroke="#888" />
                      <YAxis domain={[0, 100]} fontSize={9} stroke="#888" />
                      <Tooltip contentStyle={{ background: "#faf6ee", border: "1px solid #c8993c", borderRadius: "8px", fontSize: "11px", color: "#1a1208" }} />
                      <Area type="monotone" dataKey="Overall" stroke="#c8993c" strokeWidth={2} fillOpacity={1} fill="url(#colorOverall)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sub-Metrics Breakdown Bar Chart */}
              <div className="card p-5 bg-white/60 dark:bg-zinc-800/10 flex flex-col gap-4">
                <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
                  Session Metrics Breakdown
                </h3>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" fontSize={9} stroke="#888" />
                      <YAxis domain={[0, 100]} fontSize={9} stroke="#888" />
                      <Tooltip contentStyle={{ background: "#faf6ee", border: "1px solid #c8993c", borderRadius: "8px", fontSize: "11px", color: "#1a1208" }} />
                      <Legend fontSize={9} verticalAlign="top" height={36} />
                      <Bar dataKey="Accuracy" fill="#1e5e4a" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Tajweed" fill="#c8993c" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Fluency" fill="#1a3a5c" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </section>

            {/* Historical Session Data Table */}
            <section className="card overflow-hidden">
              <div className="bg-parchment-dark dark:bg-zinc-800/40 px-5 py-4 border-b border-gold/20 flex justify-between items-center">
                <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
                  Recitation Session Logs
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-parchment-dark/50 dark:bg-zinc-800/20 text-[10px] uppercase text-zinc-400 tracking-wider font-bold border-b border-gold/10">
                      <th className="py-3 px-5">Surah</th>
                      <th className="py-3 px-5">Date</th>
                      <th className="py-3 px-5 text-center">Accuracy</th>
                      <th className="py-3 px-5 text-center">Tajweed</th>
                      <th className="py-3 px-5 text-center">Fluency</th>
                      <th className="py-3 px-5 text-center">Overall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id} className="border-b border-gold/5 hover:bg-gold-pale/15 transition-colors">
                        <td className="py-3.5 px-5 font-amiri font-bold text-sm text-emerald dark:text-emerald-light">
                          {s.surahName}
                        </td>
                        <td className="py-3.5 px-5 font-medium text-zinc-500">
                          {new Date(s.timestamp).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-3.5 px-5 text-center font-bold text-ink">{s.accuracy}%</td>
                        <td className="py-3.5 px-5 text-center font-bold text-ink">{s.tajweed}%</td>
                        <td className="py-3.5 px-5 text-center font-bold text-ink">{s.fluency}%</td>
                        <td className="py-3.5 px-5 text-center font-bold text-gold">{s.overall}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

      </main>

      <BottomNav />
    </div>
  );
}
