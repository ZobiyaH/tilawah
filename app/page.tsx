"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Layout/Header";
import BottomNav from "@/components/Layout/BottomNav";

export default function LandingPage() {
  const router = useRouter();
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

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
      <section className="relative overflow-hidden pt-6 pb-12 md:pt-8 md:pb-16 px-6 text-center flex flex-col items-center justify-center bg-gradient-to-b from-[#faf6ee] via-white to-[#faf6ee]">
        {/* Soft Background Glow Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#1e5e4a]/10 via-[#c8993c]/15 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#c8993c_1px,transparent_0)] [background-size:20px_20px]"></div>

        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6 relative z-10">

          {/* Badge Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#c8993c]/30 shadow-sm text-xs font-bold text-[#1e5e4a] tracking-normal">
            <span className="w-2 h-2 rounded-full bg-[#c8993c] animate-ping"></span>
            ✨ Verified Real-Time Quran Recitation Assistant
          </div>

          {/* Centered Wide Bismillah Banner */}
          <div className="w-full max-w-2xl mx-auto py-4 px-8 rounded-3xl bg-white/80 border border-[#c8993c]/30 shadow-md backdrop-blur-xl flex items-center justify-center group hover:border-[#c8993c]/50 transition-all">
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
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-2xl mt-1 select-none">
            {/* Option 1: I know no Arabic */}
            <button
              type="button"
              onClick={handleStartBeginner}
              className="btn-primary h-14 flex items-center justify-center font-extrabold px-6 text-sm shadow-lg shadow-[#1e5e4a]/20 transition-all cursor-pointer rounded-2xl bg-[#1e5e4a] hover:bg-[#164738] text-white border border-[#1e5e4a] hover:-translate-y-0.5 active:scale-[0.98]"
            >
              I know no Arabic
            </button>
            
            {/* Option 2: I know the basics */}
            <Link
              href="/learn"
              onClick={handleStartBasics}
              className="btn-secondary h-14 flex items-center justify-center font-extrabold px-6 text-sm transition-all rounded-2xl border-2 border-[#c8993c] text-[#c8993c] bg-white hover:bg-[#faf6ee] hover:-translate-y-0.5 shadow-sm active:scale-[0.98]"
            >
              I know the basics
            </Link>

            {/* Option 3: Directly recite */}
            <Link
              href="/recite"
              className="h-14 flex items-center justify-center font-extrabold px-6 text-sm transition-all rounded-2xl bg-[#c8993c] text-white hover:bg-[#b08432] border border-[#c8993c] shadow-lg shadow-[#c8993c]/20 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Direct Recitation
            </Link>
          </div>

          {/* Waveform Animation */}
          <div className="flex flex-col items-center gap-2.5 mt-2 select-none">
            <div className="flex items-center justify-center gap-[5px] h-[44px] bg-white/80 px-6 py-2 rounded-full border border-[#c8993c]/20 shadow-sm backdrop-blur-md">
              <div className="w-[4px] rounded-[4px] bg-[#c8993c] h-[14px] animate-pulse"></div>
              <div className="w-[4px] rounded-[4px] bg-[#c8993c] h-[28px] animate-pulse"></div>
              <div className="w-[4px] rounded-[4px] bg-[#1e5e4a] h-[40px] animate-pulse"></div>
              <div className="w-[4px] rounded-[4px] bg-[#c8993c] h-[32px] animate-pulse"></div>
              <div className="w-[4px] rounded-[4px] bg-[#1e5e4a] h-[20px] animate-pulse"></div>
              <div className="w-[4px] rounded-[4px] bg-[#c8993c] h-[36px] animate-pulse"></div>
              <div className="w-[4px] rounded-[4px] bg-[#1e5e4a] h-[24px] animate-pulse"></div>
              <div className="w-[4px] rounded-[4px] bg-[#c8993c] h-[16px] animate-pulse"></div>
              <div className="w-[4px] rounded-[4px] bg-[#c8993c] h-[30px] animate-pulse"></div>
            </div>
            <span className="text-[11px] uppercase tracking-widest text-zinc-500 font-black">
              Listening to your recitation…
            </span>
          </div>

          {/* Trust Text */}
          <div className="flex flex-col items-center gap-3 mt-1">
            <span className="text-xs text-[#6b7280] font-extrabold uppercase tracking-widest bg-white/60 px-4 py-1.5 rounded-full border border-zinc-200">
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

      {/* 2. THE CHALLENGE SECTION */}
      <section className="py-24 px-6 bg-gradient-to-b from-white to-[#faf6ee] border-y border-[#c8993c]/15 relative">
        <div className="max-w-5xl mx-auto flex flex-col gap-14 relative z-10">
          
          <div className="text-center flex flex-col items-center gap-3">
            <img src="/logo.png" alt="Tilawah Logo" className="w-16 h-16 object-contain mb-2 drop-shadow-md" />
            <span className="text-[#c8993c] text-xs font-black uppercase tracking-widest bg-[#faf6ee] px-4 py-1.5 rounded-full border border-[#c8993c]/30 shadow-sm">
              The Challenge
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-[#1a1208] font-amiri leading-tight">
              Learning Tajweed on your own is difficult.
            </h2>
            <div className="w-24 h-1.5 bg-[#c8993c]/40 rounded-full mt-1"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-8 flex flex-col items-center justify-center text-center gap-5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-[#c8993c]/15 rounded-3xl shadow-sm hover:shadow-xl hover:border-[#1e5e4a]/30 transition-all group hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-[#1e5e4a]/10 text-[#1e5e4a] flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform shadow-inner">
                01
              </div>
              <h3 className="font-amiri text-2xl font-bold text-[#1a1208] dark:text-zinc-100 group-hover:text-[#1e5e4a] text-center transition-colors">Guidance isn&apos;t always nearby</h3>
              <p className="text-sm text-[#6b7280] dark:text-zinc-400 font-medium leading-relaxed text-center">
                Finding a qualified local teacher can be challenging, especially one with a flexible schedule.
              </p>
            </div>
            
            <div className="card p-8 flex flex-col items-center justify-center text-center gap-5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-[#c8993c]/15 rounded-3xl shadow-sm hover:shadow-xl hover:border-[#c8993c]/40 transition-all group hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-[#c8993c]/10 text-[#c8993c] flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform shadow-inner">
                02
              </div>
              <h3 className="font-amiri text-2xl font-bold text-[#1a1208] dark:text-zinc-100 group-hover:text-[#c8993c] text-center transition-colors">Hard to self-correct</h3>
              <p className="text-sm text-[#6b7280] dark:text-zinc-400 font-medium leading-relaxed text-center">
                It is difficult to hear your own pronunciation errors while trying to focus on rules.
              </p>
            </div>

            <div className="card p-8 flex flex-col items-center justify-center text-center gap-5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-[#c8993c]/15 rounded-3xl shadow-sm hover:shadow-xl hover:border-zinc-300 transition-all group hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform shadow-inner">
                03
              </div>
              <h3 className="font-amiri text-2xl font-bold text-[#1a1208] dark:text-zinc-100 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 text-center transition-colors">Rules feel overwhelming</h3>
              <p className="text-sm text-[#6b7280] dark:text-zinc-400 font-medium leading-relaxed text-center">
                Explanations of Merging (Idgham) or Hiding (Ikhfa) are hard to apply without audio feedback.
              </p>
            </div>
          </div>

          <div className="text-center font-amiri text-2xl md:text-3xl font-black text-[#1e5e4a] border-t border-[#c8993c]/15 pt-8 leading-normal">
            Tilawah bridges this gap - <span className="text-[#c8993c]">acting as your digital assistant</span>.
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="py-24 px-6 bg-[#164738] text-white relative overflow-hidden shadow-2xl">
        <div className="max-w-5xl mx-auto flex flex-col gap-14 relative z-10">
          <div className="text-center flex flex-col items-center gap-3">
            <span className="text-[#c8993c] text-xs font-black uppercase tracking-widest bg-white/10 px-4 py-1.5 rounded-full border border-white/10 shadow-sm">
              Simple Method
            </span>
            <h2 className="text-3xl md:text-5xl font-black font-amiri tracking-wide text-white">
              How it works
            </h2>
            <div className="w-24 h-1.5 bg-[#c8993c] rounded-full mt-1"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center gap-5 p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 hover:border-[#c8993c] transition-all group hover:-translate-y-1 shadow-lg">
              <div className="w-16 h-16 rounded-2xl bg-[#c8993c]/20 text-[#e8c96a] border border-[#c8993c]/40 flex items-center justify-center font-black text-2xl group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="text-2xl font-black font-amiri text-white">Listen</h3>
              <p className="text-sm text-zinc-200 font-medium leading-relaxed max-w-xs">
                Hear the correct word by word pronunciation in Sheikh Al-Husary&apos;s clear reciting voice.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center gap-5 p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 hover:border-[#c8993c] transition-all group hover:-translate-y-1 shadow-lg">
              <div className="w-16 h-16 rounded-2xl bg-[#c8993c]/20 text-[#e8c96a] border border-[#c8993c]/40 flex items-center justify-center font-black text-2xl group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="text-2xl font-black font-amiri text-white">Recite</h3>
              <p className="text-sm text-zinc-200 font-medium leading-relaxed max-w-xs">
                Grant mic permission and read aloud. Our system listens to your pronunciation in real time.
              </p>
            </div>

            <div className="flex flex-col items-center text-center gap-5 p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 hover:border-[#c8993c] transition-all group hover:-translate-y-1 shadow-lg">
              <div className="w-16 h-16 rounded-2xl bg-[#c8993c]/20 text-[#e8c96a] border border-[#c8993c]/40 flex items-center justify-center font-black text-2xl group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="text-2xl font-black font-amiri text-white">Improve</h3>
              <p className="text-sm text-zinc-200 font-medium leading-relaxed max-w-xs">
                Instantly see highlights (green: correct, red: error) and practice wrong words until you get them right.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section className="py-24 px-6 bg-[#faf6ee]">
        <div className="max-w-5xl mx-auto flex flex-col gap-14">
          <div className="text-center flex flex-col items-center gap-3">
            <span className="text-[#c8993c] text-xs font-black uppercase tracking-widest bg-white px-4 py-1.5 rounded-full border border-[#c8993c]/20 shadow-sm">
              Key Capabilities
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-[#1a1208] font-amiri">
              Designed for Quran Learners
            </h2>
            <div className="w-24 h-1.5 bg-[#c8993c]/40 rounded-full mt-1"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card p-8 flex gap-5 hover:border-[#c8993c] hover:-translate-y-1 transition-all border border-[#c8993c]/15 rounded-3xl bg-white shadow-sm group">
              <div className="w-14 h-14 rounded-2xl bg-[#1e5e4a]/10 flex items-center justify-center font-bold text-[#1e5e4a] text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                🎙️
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-amiri text-xl font-bold text-[#1e5e4a]">Interactive Recitation Checker</h3>
                <p className="text-sm text-[#6b7280] font-medium leading-relaxed">
                  Real time speech alignment checks your pronunciation word by word against Uthmani scripture.
                </p>
              </div>
            </div>

            <div className="card p-8 flex gap-5 hover:border-[#c8993c] hover:-translate-y-1 transition-all border border-[#c8993c]/15 rounded-3xl bg-white shadow-sm group">
              <div className="w-14 h-14 rounded-2xl bg-[#c8993c]/10 flex items-center justify-center font-bold text-[#c8993c] text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                🔊
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-amiri text-xl font-bold text-[#1e5e4a]">Verified Qari Recitations</h3>
                <p className="text-sm text-[#6b7280] font-medium leading-relaxed">
                  Listen to correct phonetic examples narrated by verified human voices.
                </p>
              </div>
            </div>

            <div className="card p-8 flex gap-5 hover:border-[#c8993c] hover:-translate-y-1 transition-all border border-[#c8993c]/15 rounded-3xl bg-white shadow-sm group">
              <div className="w-14 h-14 rounded-2xl bg-[#1e5e4a]/10 flex items-center justify-center font-bold text-[#1e5e4a] text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                📖
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-amiri text-xl font-bold text-[#1e5e4a]">Authentic Uthmani Text</h3>
                <p className="text-sm text-[#6b7280] font-medium leading-relaxed">
                  Practice with the standard Uthmani script used in printed Quran Masahif globally.
                </p>
              </div>
            </div>

            <div className="card p-8 flex gap-5 hover:border-[#c8993c] hover:-translate-y-1 transition-all border border-[#c8993c]/15 rounded-3xl bg-white shadow-sm group">
              <div className="w-14 h-14 rounded-2xl bg-[#c8993c]/10 flex items-center justify-center font-bold text-[#c8993c] text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                💎
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-amiri text-xl font-bold text-[#1e5e4a]">100% Free Core</h3>
                <p className="text-sm text-[#6b7280] font-medium leading-relaxed">
                  The primary learning tools, levels, tracks, and pronunciation checker will always stay free.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. LEARNING TRACKS SECTION */}
      <section className="py-24 px-6 bg-white border-y border-[#c8993c]/15">
        <div className="max-w-5xl mx-auto flex flex-col gap-14">
          <div className="text-center flex flex-col items-center gap-3">
            <span className="text-[#c8993c] text-xs font-black uppercase tracking-widest bg-[#faf6ee] px-4 py-1.5 rounded-full border border-[#c8993c]/20 shadow-sm">
              Paths
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-[#1a1208] font-amiri">
              Start from <em className="text-[#1e5e4a] not-italic">wherever you are</em>
            </h2>
            <div className="w-24 h-1.5 bg-[#c8993c]/40 rounded-full mt-1"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Link href="/learn/arabic-letters" className="card relative border-t-4 border-[#1e5e4a] p-8 flex flex-col gap-4 hover:-translate-y-1.5 transition-all text-left bg-[#faf6ee]/50 rounded-3xl shadow-sm hover:shadow-xl border border-zinc-200">
              <span className="font-amiri text-4xl text-[#1e5e4a] block font-black">أ</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#1e5e4a] bg-[#1e5e4a]/10 px-3 py-1 rounded-full w-max">
                28 Lessons
              </span>
              <h3 className="font-amiri font-bold text-lg text-[#1a1208]">Arabic Alphabet</h3>
              <p className="text-xs text-[#6b7280] font-medium leading-normal">
                Learn every letter, its 4 written forms, and its correct pronunciation.
              </p>
            </Link>

            <Link href="/learn/harakat" className="card relative border-t-4 border-[#c8993c] p-8 flex flex-col gap-4 hover:-translate-y-1.5 transition-all text-left bg-[#faf6ee]/50 rounded-3xl shadow-sm hover:shadow-xl border border-zinc-200">
              <span className="font-amiri text-4xl text-[#c8993c] block font-black">بَ بِ بُ</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#c8993c] bg-[#c8993c]/10 px-3 py-1 rounded-full w-max">
                10 Lessons
              </span>
              <h3 className="font-amiri font-bold text-lg text-[#1a1208]">Vowel Marks</h3>
              <p className="text-xs text-[#6b7280] font-medium leading-normal">
                Understand fatha, kasra, damma, sukoon, and vowel merges.
              </p>
            </Link>

            <Link href="/learn/tajweed" className="card relative border-t-4 border-sky-500 p-8 flex flex-col gap-4 hover:-translate-y-1.5 transition-all text-left bg-[#faf6ee]/50 rounded-3xl shadow-sm hover:shadow-xl border border-zinc-200">
              <span className="font-amiri text-4xl text-sky-500 block font-black">تجويد</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 bg-sky-500/10 px-3 py-1 rounded-full w-max">
                12 Lessons
              </span>
              <h3 className="font-amiri font-bold text-lg text-[#1a1208]">Tajweed Rules</h3>
              <p className="text-xs text-[#6b7280] font-medium leading-normal">
                Master Ghunna, Madd, Qalqala, and merged throat letters.
              </p>
            </Link>

            <Link href="/learn/short-surahs" className="card relative border-t-4 border-[#8b1a1a] p-8 flex flex-col gap-4 hover:-translate-y-1.5 transition-all text-left bg-[#faf6ee]/50 rounded-3xl shadow-sm hover:shadow-xl border border-zinc-200">
              <span className="font-amiri text-4xl text-[#8b1a1a] block font-black">الفاتحة</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#8b1a1a] bg-[#8b1a1a]/10 px-3 py-1 rounded-full w-max">
                10 Surahs
              </span>
              <h3 className="font-amiri font-bold text-lg text-[#1a1208]">Surah Practice</h3>
              <p className="text-xs text-[#6b7280] font-medium leading-normal">
                Recite Al-Fatiha, Al-Falaq, and An-Nas with live correction.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-xl mx-auto flex flex-col gap-8">
          <div className="text-center flex flex-col gap-2">
            <span className="text-[#c8993c] text-xs font-bold uppercase tracking-widest">Questions</span>
            <h2 className="text-2xl font-extrabold text-[#1a1208] text-center font-amiri">
              Common questions
            </h2>
          </div>
          
          <div className="flex flex-col gap-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={idx} className="card p-5 bg-white border border-zinc-100 rounded-2xl transition-all">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex justify-between items-center text-left focus:outline-none"
                  >
                    <span className="font-bold text-[#1a1208] text-base">{faq.q}</span>
                    <span className="text-[#c8993c] font-bold text-xl">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <p className="mt-3 text-sm text-[#6b7280] leading-relaxed border-t border-[#c8993c]/10 pt-3">
                      {faq.a}
                    </p>
                  )}
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

          <div className="flex flex-col sm:flex-row gap-3.5 w-full justify-center max-w-2xl mt-4 select-none">
            <button
              onClick={handleStartBeginner}
              className="h-14 px-6 bg-white text-[#1e5e4a] font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-zinc-100 transition-all flex items-center justify-center shadow-md"
            >
              Start Alphabet
            </button>
            <button
              onClick={handleStartBasics}
              className="h-14 px-6 border border-[#c8993c] text-[#e8c96a] font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-white/10 transition-all flex items-center justify-center"
            >
              Explore Roadmap
            </button>
            <Link
              href="/recite"
              className="h-14 px-6 bg-[#c8993c] text-white font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-gold-light transition-all flex items-center justify-center shadow-md"
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
