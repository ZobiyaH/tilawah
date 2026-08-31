"use client";
// Force Vercel build reload to load env variables

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Layout/Header";
import BottomNav from "@/components/Layout/BottomNav";
import { EmailCapture } from "@/components/email/EmailCapture";
import { getWordAudio } from "@/lib/audio/qariCDN";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingPage() {
  const router = useRouter();
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [demoTapped, setDemoTapped] = useState(false);

  const toggleFaq = (idx: number) => {
    setOpenFaqIdx(openFaqIdx === idx ? null : idx);
  };

  const handleStartBeginner = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tilawa_knows_basics", "false");
    }
    router.push("/learn/arabic-letters");
  };

  const handleStartBasics = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tilawa_knows_basics", "true");
    }
  };

  const handleConfirmBeginner = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tilawa_first_visit", "done");
      localStorage.setItem("tilawa_knows_basics", "false");
    }
    router.push("/learn/arabic-letters/0");
  };

  const FAQS = [
    {
      q: "Does it work on mobile?",
      a: "Yes. Tilawah is designed to work seamlessly on both mobile and desktop browsers. It works on any modern smartphone browser without needing installation."
    },
    {
      q: "Is the Quran text authentic?",
      a: "Yes. We use the verified Tanzil Uthmani script - the standard printed script used in printed Masahif globally."
    },
    {
      q: "Is the audio from a real Qari?",
      a: "Yes. All pronunciation audio is from verified Qaris (Sheikh Al-Husary) - authentic human recitations."
    },
    {
      q: "Can complete beginners use this?",
      a: "Absolute beginners start from the very first letter of the Arabic alphabet with no prior knowledge required."
    }
  ];

  return (
    <div className="min-h-screen pb-28 md:pb-16 bg-[#faf6ee] dark:bg-zinc-950 text-[#1a1208] dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      <Header />
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-3 pb-12 md:pt-4 md:pb-16 px-6 text-center flex flex-col items-center justify-center bg-gradient-to-b from-[#faf6ee] via-white to-[#faf6ee]">
        {/* Custom CSS animations for drifting light and bokeh particles */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes float-slow {
            0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); opacity: 0.15; }
            50% { transform: translateY(-30px) scale(1.15) rotate(180deg); opacity: 0.35; }
          }
          @keyframes float-medium {
            0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); opacity: 0.2; }
            50% { transform: translateY(-45px) scale(0.9) rotate(-180deg); opacity: 0.4; }
          }
          @keyframes pulse-gentle {
            0%, 100% { transform: scale(1); opacity: 0.04; }
            50% { transform: scale(1.08); opacity: 0.12; }
          }
          @keyframes wave-bounce-1 {
            0%, 100% { transform: scaleY(0.35); }
            50% { transform: scaleY(1.1); }
          }
          @keyframes wave-bounce-2 {
            0%, 100% { transform: scaleY(0.2); }
            50% { transform: scaleY(1.3); }
          }
          @keyframes wave-bounce-3 {
            0%, 100% { transform: scaleY(0.5); }
            50% { transform: scaleY(0.85); }
          }
          .animate-float-slow { animation: float-slow 16s ease-in-out infinite; }
          .animate-float-medium { animation: float-medium 10s ease-in-out infinite; }
          .animate-pulse-gentle { animation: pulse-gentle 8s ease-in-out infinite; }
          .animate-wave-a { animation: wave-bounce-1 1.2s ease-in-out infinite; transform-origin: center; }
          .animate-wave-b { animation: wave-bounce-2 0.8s ease-in-out infinite 0.15s; transform-origin: center; }
          .animate-wave-c { animation: wave-bounce-3 1.4s ease-in-out infinite 0.3s; transform-origin: center; }
          .animate-wave-d { animation: wave-bounce-1 1.0s ease-in-out infinite 0.45s; transform-origin: center; }
          .animate-wave-e { animation: wave-bounce-2 1.6s ease-in-out infinite 0.2s; transform-origin: center; }
          .animate-wave-f { animation: wave-bounce-3 1.1s ease-in-out infinite 0.1s; transform-origin: center; }
          .animate-wave-g { animation: wave-bounce-1 1.3s ease-in-out infinite 0.25s; transform-origin: center; }
          .animate-wave-h { animation: wave-bounce-2 0.9s ease-in-out infinite 0.35s; transform-origin: center; }
          .animate-wave-i { animation: wave-bounce-3 1.5s ease-in-out infinite 0.05s; transform-origin: center; }
        `}} />

        {/* Soft Background Glow Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-[#1e5e4a]/8 via-[#c8993c]/12 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-gentle"></div>
        <div className="absolute inset-0 opacity-[0.18] pointer-events-none bg-[url('/images/quran_bg.png')] bg-center bg-cover bg-no-repeat"></div>

        {/* Silhouette of Elegant Arch vector at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-28 opacity-10 pointer-events-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1440 320%22><path fill=%22%23c8993c%22 fill-opacity=%221%22 d=%22M0,192L48,197.3C96,203,192,213,288,208C384,203,480,181,576,181.3C672,181,768,203,864,197.3C960,192,1056,160,1152,144C1248,128,1344,128,1392,128L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z%22></path></svg>')] bg-cover bg-bottom"></div>

        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6 relative z-10">

          {/* Badge Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#c8993c]/30 shadow-sm text-xs font-bold text-[#1e5e4a] tracking-normal">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gold animate-pulse">
              <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.552l.38 1.33a1.875 1.875 0 0 0 1.29 1.29l1.33.38a.75.75 0 0 1 0 1.456l-1.33.38a1.875 1.875 0 0 0-1.29 1.29l-.38 1.33a.75.75 0 0 1-1.456 0l-.38-1.33a1.875 1.875 0 0 0-1.29-1.29l-1.33-.38a.75.75 0 0 1 0-1.456l1.33-.38a1.875 1.875 0 0 0 1.29-1.29l.38-1.33A.75.75 0 0 1 18 1.5ZM4.5 16.5a.75.75 0 0 1 .728.552l.38 1.33a1.875 1.875 0 0 0 1.29 1.29l1.33.38a.75.75 0 0 1 0 1.456l-1.33.38a1.875 1.875 0 0 0-1.29 1.29l-.38 1.33a.75.75 0 0 1-1.456 0l-.38-1.33a1.875 1.875 0 0 0-1.29-1.29l-1.33-.38a.75.75 0 0 1 0-1.456l1.33-.38a1.875 1.875 0 0 0 1.29-1.29l.38-1.33A.75.75 0 0 1 4.5 16.5Z" clipRule="evenodd" />
            </svg>
            Verified Real-Time Quran Recitation Assistant
          </div>

          {/* Centered Wide Bismillah Banner */}
          <div className="w-full max-w-2xl mx-auto py-2.5 px-6 rounded-3xl bg-white/80 border border-[#c8993c]/30 shadow-md backdrop-blur-xl flex items-center justify-center group hover:border-[#c8993c]/50 transition-all">
            <span className="font-amiri text-2xl md:text-4xl text-[#c8993c] select-none leading-relaxed text-center block w-full drop-shadow-sm group-hover:scale-105 transition-transform">
              بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
            </span>
          </div>

          {/* Hero Headers */}
          <div className="flex flex-col gap-3 max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-black text-[#1a1208] leading-[1.15] font-amiri">
              Recite the Quran correctly.<br />
              <span className="text-[#1e5e4a] inline-block border-b-4 border-[#c8993c]/40 pb-1">
                From your very first letter.
              </span>
            </h1>
            <p className="text-sm md:text-base text-[#6b7280] font-semibold leading-relaxed max-w-xl mx-auto mt-0.5">
              Tilawah listens as you recite, catches every mistake instantly,
              and plays the correct pronunciation from a verified Qari -
              so you always hear it right.
            </p>
          </div>

          {/* Action CTAs: Three Pathways */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2.5 w-full max-w-sm sm:max-w-none mt-1 select-none justify-center">
            {/* Row 1: Side by side */}
            <div className="flex flex-row gap-2.5 w-full sm:w-auto justify-center">
              <button
                type="button"
                onClick={handleStartBeginner}
                className="h-14 w-1/2 sm:w-44 flex items-center justify-center font-black px-3 text-sm sm:text-base shadow-lg shadow-[#1e5e4a]/20 transition-all cursor-pointer rounded-2xl bg-[#1e5e4a] hover:bg-[#164738] text-white border border-[#1e5e4a] hover:-translate-y-0.5 active:scale-[0.98]"
              >
                I know no Arabic
              </button>
              <Link
                href="/learn"
                onClick={handleStartBasics}
                className="h-14 w-1/2 sm:w-44 flex items-center justify-center font-black px-3 text-sm sm:text-base transition-all rounded-2xl border-2 border-[#c8993c] text-[#c8993c] bg-white hover:bg-[#faf6ee] hover:-translate-y-0.5 shadow-sm active:scale-[0.98]"
              >
                I know the basics
              </Link>
            </div>

            {/* Row 2: Full width on mobile, standard w-44 on desktop */}
            <Link
              href="/recite"
              className="h-14 w-full sm:w-44 flex items-center justify-center font-black px-4 text-base transition-all rounded-2xl bg-[#c8993c] text-white hover:bg-[#b08432] border border-[#c8993c] shadow-lg shadow-[#c8993c]/20 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Direct Recitation
            </Link>
          </div>

          {/* Waveform Animation */}
          <div className="flex flex-col items-center gap-2.5 mt-2 select-none">
            <div className="flex items-center justify-center gap-[5px] h-[44px] bg-white/80 px-6 py-2 rounded-full border border-[#c8993c]/20 shadow-sm backdrop-blur-md">
              <div className="w-[4px] rounded-[4px] bg-[#c8993c] h-[14px] animate-wave-a"></div>
              <div className="w-[4px] rounded-[4px] bg-[#1e5e4a] h-[28px] animate-wave-b"></div>
              <div className="w-[4px] rounded-[4px] bg-[#c8993c] h-[40px] animate-wave-c"></div>
              <div className="w-[4px] rounded-[4px] bg-[#1e5e4a] h-[32px] animate-wave-d"></div>
              <div className="w-[4px] rounded-[4px] bg-[#c8993c] h-[20px] animate-wave-e"></div>
              <div className="w-[4px] rounded-[4px] bg-[#1e5e4a] h-[36px] animate-wave-f"></div>
              <div className="w-[4px] rounded-[4px] bg-[#c8993c] h-[24px] animate-wave-g"></div>
              <div className="w-[4px] rounded-[4px] bg-[#1e5e4a] h-[16px] animate-wave-h"></div>
              <div className="w-[4px] rounded-[4px] bg-[#c8993c] h-[30px] animate-wave-i"></div>
            </div>
            <span className="text-[11px] uppercase tracking-widest text-zinc-500 font-black">
              Listening to your recitation…
            </span>
          </div>

          {/* Trust Text */}
          <div className="flex flex-col items-center gap-3 mt-1">
            <span className="text-[10px] text-[#6b7280] font-black uppercase tracking-widest bg-white/60 px-4 py-1.5 rounded-full border border-zinc-200">
              No signup required · Works on any browser · 100% free
            </span>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-user-guide"))}
              className="text-xs font-bold text-[#1e5e4a] hover:text-[#c8993c] underline transition-colors flex items-center gap-1.5 tracking-normal"
            >
              View Step-by-Step Practice Guide
            </button>
          </div>
        </div>
      </section>

      {/* TRY IT RIGHT NOW MINI-DEMO SECTION */}
      <section className="py-12 md:py-16 px-6 bg-[#faf6ee] dark:bg-zinc-950 border-b border-[#c8993c]/15 relative overflow-hidden">
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04] bg-[url('/images/islamic_bg_pattern.jpg')] bg-center bg-repeat pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#c8993c12_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto flex flex-col gap-7 items-center relative z-10">
          <div className="text-center flex flex-col items-center gap-2.5">
            <span className="text-[#1e5e4a] text-[11px] font-black uppercase tracking-[2.5px] bg-[#1e5e4a]/10 dark:bg-emerald/20 px-4 py-1.5 rounded-full border border-[#1e5e4a]/20 shadow-xs">
              Interactive Preview
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-[#1a1208] dark:text-zinc-100 font-amiri text-center">
              Try It Right Now
            </h2>
            <p className="text-xs md:text-sm text-[#6b7280] dark:text-zinc-400 font-medium max-w-md text-center">
              Tap the highlighted word to hear authentic Qari pronunciation and see real-time feedback.
            </p>
          </div>

          {/* Interactive Card with Enhanced Islamic Aesthetic */}
          <div className="w-full max-w-2xl p-7 md:p-9 border border-[#c8993c]/35 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-3xl shadow-[0_16px_36px_rgba(200,153,60,0.08)] flex flex-col items-center justify-center gap-5 transition-all duration-300 relative overflow-hidden group hover:border-[#c8993c]/60">
            <div className="absolute top-3 left-3 text-[#c8993c]/30 text-xs select-none">✦</div>
            <div className="absolute top-3 right-3 text-[#c8993c]/30 text-xs select-none">✦</div>
            <div className="absolute bottom-3 left-3 text-[#c8993c]/30 text-xs select-none">✦</div>
            <div className="absolute bottom-3 right-3 text-[#c8993c]/30 text-xs select-none">✦</div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-700">
                Surah Al-Fatiha · Ayah 1
              </span>
            </div>

            {/* Verse Display with Large Arabic Typography */}
            <div className="flex flex-row-reverse flex-wrap gap-x-5 gap-y-3 justify-center items-center font-amiri text-4xl sm:text-5xl md:text-6xl leading-[2.2] md:leading-[2.4] text-right my-1 relative z-10 select-none">
              <span className="text-zinc-400 dark:text-zinc-600 transition-colors">بِسْمِ</span>
              <span className="text-zinc-400 dark:text-zinc-600 transition-colors">اللَّهِ</span>
              
              {/* Tappable Word with Clear Visual Affordance */}
              <button
                type="button"
                onClick={() => {
                  setDemoTapped(true);
                  const audio = new Audio(getWordAudio(1, 1, 3));
                  audio.play().catch(() => {});
                  setTimeout(() => setDemoTapped(false), 1400);
                }}
                className={`relative px-4 sm:px-5 py-1 rounded-2xl border-2 font-bold transition-all duration-300 transform active:scale-95 cursor-pointer z-10 ${
                  demoTapped
                    ? "text-[#1e5e4a] dark:text-emerald-300 border-[#1e5e4a] bg-emerald-pale/60 dark:bg-emerald-950/60 shadow-lg shadow-emerald-500/20 scale-105"
                    : "text-[#c8993c] border-[#c8993c]/50 bg-[#faf6ee]/90 dark:bg-zinc-800 hover:bg-[#faf6ee] hover:border-[#c8993c] hover:scale-[1.03] shadow-sm"
                }`}
                title="Click to hear word pronunciation"
              >
                الرَّحْمَنِ
                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#c8993c]"></span>
                </span>
              </button>

              <span className="text-zinc-400 dark:text-zinc-600 transition-colors">الرَّحِيمِ</span>
            </div>

            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-semibold relative z-10 pt-1">
              <span className="text-[#c8993c]">🔊</span>
              <span>Tap the gold word <strong className="text-[#c8993c]">&quot;الرَّحْمَنِ&quot;</strong> to play audio recitation</span>
            </div>
          </div>

          {/* Decorative Divider */}
          <div className="w-full relative flex py-1 items-center max-w-xs mx-auto">
            <div className="flex-grow border-t border-[#c8993c]/25"></div>
            <span className="flex-shrink mx-3 text-[#c8993c]/60 text-xs font-semibold select-none">✦ ✵ ✦</span>
            <div className="flex-grow border-t border-[#c8993c]/25"></div>
          </div>
        </div>
      </section>

      {/* 2. LEARNING TRACKS / PATHS SECTION */}
      <section className="py-20 md:py-24 px-6 bg-gradient-to-b from-white via-[#faf6ee]/50 to-white dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 border-b border-[#c8993c]/15">
        <div className="max-w-5xl mx-auto flex flex-col gap-12 md:gap-14">
          <div className="text-center flex flex-col items-center gap-3">
            <span className="text-[#c8993c] text-[10px] font-black uppercase tracking-[2px] bg-white dark:bg-zinc-800 px-4 py-1.5 rounded-full border border-[#c8993c]/20 shadow-xs">
              Learning Paths
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-[#1a1208] dark:text-zinc-100 font-amiri mt-1">
              Start from <em className="text-[#1e5e4a] dark:text-emerald-400 not-italic">wherever you are</em>
            </h2>
            <div className="w-16 h-1 bg-[#c8993c]/40 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Link href="/learn/arabic-letters" className="card relative border-t-4 border-[#1e5e4a] p-8 flex flex-col items-center sm:items-start gap-4 hover:-translate-y-1.5 transition-all duration-300 text-center sm:text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm hover:shadow-xl group">
              <span className="font-amiri text-4xl text-[#1e5e4a] dark:text-emerald-400 block font-black text-center sm:text-left group-hover:scale-110 transition-transform">أ</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#1e5e4a] dark:text-emerald-300 bg-[#1e5e4a]/10 dark:bg-emerald-950/50 px-3 py-1 rounded-full w-max text-center">
                28 Lessons
              </span>
              <h3 className="font-amiri font-bold text-lg text-[#1a1208] dark:text-zinc-100">Arabic Alphabet</h3>
              <p className="text-xs text-[#6b7280] dark:text-zinc-400 font-medium leading-normal">
                Learn every letter, its 4 written forms, and its correct pronunciation.
              </p>
            </Link>

            <Link href="/learn/harakat" className="card relative border-t-4 border-[#c8993c] p-8 flex flex-col items-center sm:items-start gap-4 hover:-translate-y-1.5 transition-all duration-300 text-center sm:text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm hover:shadow-xl group">
              <span className="font-amiri text-4xl text-[#c8993c] block font-black text-center sm:text-left group-hover:scale-110 transition-transform">بَ بِ بُ</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#c8993c] bg-[#c8993c]/10 dark:bg-amber-950/50 px-3 py-1 rounded-full w-max text-center">
                10 Lessons
              </span>
              <h3 className="font-amiri font-bold text-lg text-[#1a1208] dark:text-zinc-100">Vowel Marks</h3>
              <p className="text-xs text-[#6b7280] dark:text-zinc-400 font-medium leading-normal">
                Understand fatha, kasra, damma, sukoon, and vowel merges.
              </p>
            </Link>

            <Link href="/learn/tajweed" className="card relative border-t-4 border-sky-500 p-8 flex flex-col items-center sm:items-start gap-4 hover:-translate-y-1.5 transition-all duration-300 text-center sm:text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm hover:shadow-xl group">
              <span className="font-amiri text-4xl text-sky-500 block font-black text-center sm:text-left group-hover:scale-110 transition-transform">تجويد</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-300 bg-sky-500/10 dark:bg-sky-950/50 px-3 py-1 rounded-full w-max text-center">
                12 Lessons
              </span>
              <h3 className="font-amiri font-bold text-lg text-[#1a1208] dark:text-zinc-100">Tajweed Rules</h3>
              <p className="text-xs text-[#6b7280] dark:text-zinc-400 font-medium leading-normal">
                Master Ghunna, Madd, Qalqala, and merged throat letters.
              </p>
            </Link>

            <Link href="/learn/short-surahs" className="card relative border-t-4 border-[#8b1a1a] p-8 flex flex-col items-center sm:items-start gap-4 hover:-translate-y-1.5 transition-all duration-300 text-center sm:text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm hover:shadow-xl group">
              <span className="font-amiri text-4xl text-[#8b1a1a] dark:text-rose-400 block font-black text-center sm:text-left group-hover:scale-110 transition-transform">الفاتحة</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#8b1a1a] dark:text-rose-300 bg-[#8b1a1a]/10 dark:bg-rose-950/50 px-3 py-1 rounded-full w-max text-center">
                10 Surahs
              </span>
              <h3 className="font-amiri font-bold text-lg text-[#1a1208] dark:text-zinc-100">Surah Practice</h3>
              <p className="text-xs text-[#6b7280] dark:text-zinc-400 font-medium leading-normal">
                Recite Al-Fatiha, Al-Falaq, and An-Nas with live correction.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THE CHALLENGE SECTION */}
      <section className="py-20 md:py-28 px-6 bg-gradient-to-b from-[#faf6ee] via-white to-[#faf6ee] border-b border-[#c8993c]/15 relative">
        <div className="absolute inset-0 bg-[radial-gradient(#c8993c10_1.5px,transparent_1.5px)] [background-size:20px_20px] pointer-events-none" />
        <div className="max-w-5xl mx-auto flex flex-col gap-12 md:gap-16 relative z-10">
          
          <div className="text-center flex flex-col items-center gap-3">
            <span className="text-[#c8993c] text-[10px] font-black uppercase tracking-[2px] bg-[#c8993c]/10 px-4.5 py-1.5 rounded-full border border-[#c8993c]/20 shadow-xs">
              The Challenge
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-[#1a1208] font-amiri leading-tight mt-2 max-w-2xl">
              Learning Tajweed on your own is difficult.
            </h2>
            <div className="w-16 h-1 bg-[#c8993c]/40 rounded-full mt-2"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-8 flex flex-col items-center text-center gap-6 bg-white/90 border border-[#c8993c]/15 rounded-3xl shadow-sm hover:shadow-xl hover:border-[#1e5e4a]/40 hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-[#1e5e4a]/10 text-[#1e5e4a] flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                01
              </div>
              <h3 className="font-amiri text-2xl font-bold text-[#1a1208] group-hover:text-[#1e5e4a] transition-colors">Guidance isn&apos;t always nearby</h3>
              <p className="text-xs md:text-sm text-[#6b7280] font-medium leading-relaxed">
                Finding a qualified local teacher can be challenging, especially one with a flexible schedule.
              </p>
            </div>
            
            <div className="card p-8 flex flex-col items-center text-center gap-6 bg-white/90 border border-[#c8993c]/15 rounded-3xl shadow-sm hover:shadow-xl hover:border-[#c8993c]/50 hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-[#c8993c]/10 text-[#c8993c] flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                02
              </div>
              <h3 className="font-amiri text-2xl font-bold text-[#1a1208] group-hover:text-[#c8993c] transition-colors">Hard to self-correct</h3>
              <p className="text-xs md:text-sm text-[#6b7280] font-medium leading-relaxed">
                It is difficult to hear your own pronunciation errors while trying to focus on rules.
              </p>
            </div>

            <div className="card p-8 flex flex-col items-center text-center gap-6 bg-white/90 border border-[#c8993c]/15 rounded-3xl shadow-sm hover:shadow-xl hover:border-zinc-300 hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                03
              </div>
              <h3 className="font-amiri text-2xl font-bold text-[#1a1208] group-hover:text-zinc-800 transition-colors">Rules feel overwhelming</h3>
              <p className="text-xs md:text-sm text-[#6b7280] font-medium leading-relaxed">
                Explanations of Merging (Idgham) or Hiding (Ikhfa) are hard to apply without audio feedback.
              </p>
            </div>
          </div>

          <div className="text-center font-amiri text-2xl md:text-3xl font-black text-[#1e5e4a] border-t border-[#c8993c]/15 pt-8 leading-normal">
            Tilawah bridges this gap - <span className="text-[#c8993c]">acting as your digital assistant</span>.
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 px-6 bg-[#164738] text-white relative overflow-hidden shadow-2xl">
        <div className="max-w-5xl mx-auto flex flex-col gap-12 md:gap-16 relative z-10">
          <div className="text-center flex flex-col items-center gap-3">
            <span className="text-[#c8993c] text-[10px] font-black uppercase tracking-[2px] bg-white/10 px-4.5 py-1.5 rounded-full border border-white/10 shadow-xs">
              Simple Method
            </span>
            <h2 className="text-3xl md:text-5xl font-black font-amiri tracking-wide text-white mt-2">
              How it works
            </h2>
            <div className="w-16 h-1 bg-[#c8993c] rounded-full mt-2"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center gap-6 p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-[#c8993c] transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-[#c8993c]/20 text-[#e8c96a] border border-[#c8993c]/40 flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="text-2xl font-black font-amiri text-white">Listen</h3>
              <p className="text-xs md:text-sm text-zinc-200 font-medium leading-relaxed max-w-xs">
                Hear the correct word by word pronunciation in Sheikh Al-Husary&apos;s clear reciting voice.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center gap-6 p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-[#c8993c] transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-[#c8993c]/20 text-[#e8c96a] border border-[#c8993c]/40 flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="text-2xl font-black font-amiri text-white">Recite</h3>
              <p className="text-xs md:text-sm text-zinc-200 font-medium leading-relaxed max-w-xs">
                Grant mic permission and read aloud. Our system listens to your pronunciation in real time.
              </p>
            </div>

            <div className="flex flex-col items-center text-center gap-6 p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-[#c8993c] transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-[#c8993c]/20 text-[#e8c96a] border border-[#c8993c]/40 flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="text-2xl font-black font-amiri text-white">Improve</h3>
              <p className="text-xs md:text-sm text-zinc-200 font-medium leading-relaxed max-w-xs">
                Instantly see highlights (green: correct, amber: close, red: retry) and practice until you get them right.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section className="py-20 md:py-28 px-6 bg-gradient-to-br from-[#faf6ee] via-white to-[#faf6ee]/70">
        <div className="max-w-5xl mx-auto flex flex-col gap-12 md:gap-16">
          <div className="text-center flex flex-col items-center gap-3">
            <span className="text-[#c8993c] text-[10px] font-black uppercase tracking-[2px] bg-white px-4 py-1.5 rounded-full border border-[#c8993c]/20 shadow-xs">
              Key Capabilities
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-[#1a1208] font-amiri mt-2">
              Designed for Quran Learners
            </h2>
            <div className="w-16 h-1 bg-[#c8993c]/40 rounded-full mt-2"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card p-8 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 hover:border-[#c8993c]/60 hover:-translate-y-1 transition-all duration-300 border border-[#c8993c]/15 rounded-3xl bg-white shadow-sm group">
              <div className="w-12 h-12 rounded-xl bg-[#1e5e4a]/10 flex items-center justify-center text-[#1e5e4a] flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                </svg>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-amiri text-xl font-bold text-[#1e5e4a]">Interactive Recitation Checker</h3>
                <p className="text-xs md:text-sm text-[#6b7280] font-medium leading-relaxed">
                  Real time speech alignment checks your pronunciation word by word against Uthmani scripture.
                </p>
              </div>
            </div>

            <div className="card p-8 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 hover:border-[#c8993c]/60 hover:-translate-y-1 transition-all duration-300 border border-[#c8993c]/15 rounded-3xl bg-white shadow-sm group">
              <div className="w-12 h-12 rounded-xl bg-[#c8993c]/10 flex items-center justify-center text-[#c8993c] flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v6.75c0 .621.504 1.125 1.125 1.125H6.75a9.06 9.06 0 0 1 1.501.124l4.93 1.11a.75.75 0 0 0 .919-.733V4.628a.75.75 0 0 0-.919-.733l-4.93 1.11A9.06 9.06 0 0 1 6.75 7.5Z" />
                </svg>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-amiri text-xl font-bold text-[#1e5e4a]">Verified Qari Recitations</h3>
                <p className="text-xs md:text-sm text-[#6b7280] font-medium leading-relaxed">
                  Listen to correct phonetic examples narrated by verified human voices.
                </p>
              </div>
            </div>

            <div className="card p-8 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 hover:border-[#c8993c]/60 hover:-translate-y-1 transition-all duration-300 border border-[#c8993c]/15 rounded-3xl bg-white shadow-sm group">
              <div className="w-12 h-12 rounded-xl bg-[#1e5e4a]/10 flex items-center justify-center text-[#1e5e4a] flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-amiri text-xl font-bold text-[#1e5e4a]">Authentic Uthmani Text</h3>
                <p className="text-xs md:text-sm text-[#6b7280] font-medium leading-relaxed">
                  Practice with the standard Uthmani script used in printed Quran Masahif globally.
                </p>
              </div>
            </div>

            <div className="card p-8 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 hover:border-[#c8993c]/60 hover:-translate-y-1 transition-all duration-300 border border-[#c8993c]/15 rounded-3xl bg-white shadow-sm group">
              <div className="w-12 h-12 rounded-xl bg-[#c8993c]/10 flex items-center justify-center text-[#c8993c] flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                </svg>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-amiri text-xl font-bold text-[#1e5e4a]">100% Free Core</h3>
                <p className="text-xs md:text-sm text-[#6b7280] font-medium leading-relaxed">
                  The primary learning tools, levels, tracks, and pronunciation checker will always stay free.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Email Capture Banner */}
      <section className="py-16 px-6 bg-[#faf6ee] border-y border-[#c8993c]/15 relative">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,#c8993c04_25%,transparent_25%,transparent_75%,#c8993c04_75%,#c8993c04),linear-gradient(45deg,#c8993c04_25%,transparent_25%,transparent_75%,#c8993c04_75%,#c8993c04)] bg-[size:40px_40px] bg-[position:0_0,20px_20px] pointer-events-none" />
        <div className="max-w-xl mx-auto text-center relative z-10">
          <EmailCapture
            variant="banner"
            source="homepage_banner"
            heading="Stay Updated on Tilawah"
            subheading="Join our newsletter to receive progress reports, new features, and updates."
          />
        </div>
      </section>

      

      {/* 6. FAQ ACCORDION */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-[#faf6ee]/50 border-b border-[#c8993c]/15 relative">
        <div className="max-w-xl mx-auto flex flex-col gap-8">
          <div className="text-center flex flex-col gap-2">
            <span className="text-[#c8993c] text-xs font-bold uppercase tracking-widest bg-white border border-[#c8993c]/20 px-3 py-1 rounded-full w-max mx-auto shadow-2xs">Questions</span>
            <h2 className="text-3xl font-extrabold text-[#1a1208] text-center font-amiri">
              Common Questions
            </h2>
          </div>
          
          <div className="flex flex-col gap-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={idx} className="card p-5 bg-white border border-zinc-100 rounded-2xl transition-all">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex justify-between items-center text-left focus:outline-none py-3.5 min-h-[44px] cursor-pointer"
                  >
                    <span className="font-bold text-[#1a1208] text-base">{faq.q}</span>
                    <span className="text-[#c8993c] font-bold text-xl ml-4">{isOpen ? "−" : "+"}</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="mt-3 text-sm text-[#6b7280] leading-relaxed border-t border-[#c8993c]/10 pt-3 select-text">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. FINAL INTEGRATED SECTION */}
      <section className="py-24 px-6 bg-[#1e5e4a] text-white text-center relative overflow-hidden shadow-inner border-t border-[#c8993c]/30">
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold font-amiri text-[#faf6ee]">
            Choose your learning path.
          </h2>
          <p className="text-sm md:text-base text-zinc-200 max-w-lg leading-relaxed">
            Whether starting from the alphabet or reciting full Surahs with Tajweed, Tilawah guides you every step of the way.
          </p>

          <div className="flex flex-col sm:flex-row gap-3.5 w-full justify-center items-center max-w-2xl mt-4 select-none px-4">
            <button
              onClick={handleStartBeginner}
              className="h-14 w-full sm:w-48 max-w-xs bg-white text-[#1e5e4a] font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-zinc-100 transition-all flex items-center justify-center shadow-md cursor-pointer"
            >
              Start Alphabet
            </button>
            <button
              onClick={handleStartBasics}
              className="h-14 w-full sm:w-48 max-w-xs border border-[#c8993c] text-[#e8c96a] font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer"
            >
              Explore Roadmap
            </button>
            <Link
              href="/recite"
              className="h-14 w-full sm:w-48 max-w-xs bg-[#c8993c] text-white font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-gold-light transition-all flex items-center justify-center shadow-md cursor-pointer"
            >
              Direct Recite
            </Link>
          </div>
        </div>
      </section>

      {/* Welcome Onboarding Overlay Modal */}
      {showWelcome && (
        <div className="fixed inset-0 bg-[#1a1208]/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-6 select-none">
          <div className="card max-w-md w-full bg-white dark:bg-zinc-950 p-8 text-center flex flex-col gap-5 border border-[#c8993c]/30 shadow-2xl rounded-2xl animate-[slide-up_0.35s_ease-out]">
            <div className="w-16 h-16 rounded-full bg-[#1e5e4a]/10 text-[#1e5e4a] font-bold text-2xl flex items-center justify-center mx-auto">
              أ
            </div>
            <h3 className="text-xl font-bold text-[#1e5e4a] dark:text-emerald-light font-amiri">
              Welcome to Tilawah!
            </h3>
            <p className="text-sm text-[#6b7280] leading-relaxed">
              We will guide you step-by-step from the very first Arabic letter. Each lesson takes just 5 minutes and lets you practice at your own pace.
            </p>
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={handleConfirmBeginner}
                className="btn-primary w-full h-[52px] text-sm font-bold flex items-center justify-center rounded-xl"
              >
                Let&apos;s begin
              </button>
              <button
                onClick={() => setShowWelcome(false)}
                className="w-full text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-600 transition-colors py-2"
              >
                Go back
              </button>
              <button
                onClick={() => router.push('/learn')}
                className="w-full text-xs font-bold uppercase tracking-wider text-[#c8993c] hover:text-[#e8c96a] transition-colors py-1"
              >
                Go to Journey Page
              </button>
            </div>
          </div>
        </div>
      )}



      <BottomNav />
    </div>
  );
}
