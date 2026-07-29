/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Layout/Header";
import BottomNav from "@/components/Layout/BottomNav";
import QuranDisplay from "@/components/QuranDisplay/QuranDisplay";
import WaveformBar from "@/components/Listening/WaveformBar";
import LiveTranscript from "@/components/Listening/LiveTranscript";
import ContinuousListener from "@/components/Listening/ContinuousListener";
import CorrectionOverlay from "@/components/Correction/CorrectionOverlay";
import MicCheckModal from "@/components/Listening/MicCheckModal";
import { useRecitationStore } from "@/lib/store/recitationStore";
import { getSurahData } from "@/lib/quran/quranData";
import { QariAudioManager } from "@/lib/qariAudio";
import { saveLearningProgress } from "@/lib/progress";
import { arabicSimilarity } from "@/lib/arabic/similarity";
import { normalizeArabic } from "@/lib/arabic/normalize";

const SHORT_SURAHS = [
  { id: "1", name: "Al-Fatiha", arName: "الفاتحة", totalAyat: 7, isAvailable: true },
  { id: "112", name: "Al-Ikhlas", arName: "الإخلاص", totalAyat: 4, isAvailable: true },
  { id: "113", name: "Al-Falaq", arName: "الفلق", totalAyat: 5, isAvailable: true },
  { id: "114", name: "An-Nas", arName: "الناس", totalAyat: 6, isAvailable: true },
  { id: "103", name: "Al-Asr", arName: "العصر", totalAyat: 3, isAvailable: false },
  { id: "108", name: "Al-Kawthar", arName: "الكوثر", totalAyat: 3, isAvailable: false },
  { id: "111", name: "Al-Masad", arName: "المسد", totalAyat: 5, isAvailable: false },
  { id: "105", name: "Al-Fil", arName: "الفيل", totalAyat: 5, isAvailable: false },
  { id: "106", name: "Quraish", arName: "قريش", totalAyat: 4, isAvailable: false },
  { id: "107", name: "Al-Maun", arName: "الماعون", totalAyat: 7, isAvailable: false }
];

export default function ShortSurahsPage() {
  const [micCheckOpen, setMicCheckOpen] = useState(false);
  const [selectedSurahIdx, setSelectedSurahIdx] = useState(0); 
  const [activePhase, setActivePhase] = useState<1 | 2 | 3 | 4>(1);

  // Surah Data
  const surahMeta = SHORT_SURAHS[selectedSurahIdx];
  const surahData = getSurahData(surahMeta.id);

  // Recitation Store bindings
  const loadSurah = useRecitationStore((state) => state.loadSurah);
  const resetSession = useRecitationStore((state) => state.resetSession);
  const wordIndex = useRecitationStore((state) => state.wordIndex);
  const allWords = useRecitationStore((state) => state.allWords);
  const correctCount = useRecitationStore((state) => state.correctCount);
  const errorCount = useRecitationStore((state) => state.errorCount);

  // Audio / ASR states
  const [playingAyahIdx, setPlayingAyahIdx] = useState<number | null>(null);
  const [activeWordIdx, setActiveWordIdx] = useState(0);
  const [activeAyahIdx, setActiveAyahIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [asrResult, setAsrResult] = useState<"none" | "success" | "retry">("none");
  const [spokenText, setSpokenText] = useState("");
  const [isPlayingFull, setIsPlayingFull] = useState(false);

  // Flat array of all words for Phase 2
  const flatWords = surahData
    ? surahData.ayat.flatMap((a) => a.words.map((w) => ({ word: w, surahId: a.surahId, ayahNumber: a.ayahNumber })))
    : [];

  useEffect(() => {
    setPlayingAyahIdx(null);
    setActiveWordIdx(0);
    setActiveAyahIdx(0);
    setAsrResult("none");
    setSpokenText("");
    setIsPlayingFull(false);
    QariAudioManager.getInstance().stop();

    if (activePhase === 4 && surahData) {
      loadSurah(surahMeta.id, surahData.name, surahData.ayat);
      setMicCheckOpen(true);
    } else {
      resetSession();
    }
  }, [selectedSurahIdx, activePhase, surahMeta.id, surahData, loadSurah, resetSession]);

  // --- Phase 1: Play Full Surah sequentially ---
  const playFullSurah = async () => {
    if (!surahData) return;
    if (isPlayingFull) {
      QariAudioManager.getInstance().stop();
      setIsPlayingFull(false);
      setPlayingAyahIdx(null);
      return;
    }

    setIsPlayingFull(true);
    const audioMgr = QariAudioManager.getInstance();
    try {
      for (let i = 0; i < surahData.ayat.length; i++) {
        if (!isPlayingFull) break;
        setPlayingAyahIdx(i);
        await audioMgr.playAyah(Number(surahMeta.id), surahData.ayat[i].ayahNumber);
      }
    } catch {
      console.warn("Quran recitation files are missing");
    } finally {
      setPlayingAyahIdx(null);
      setIsPlayingFull(false);
    }
  };

  const playSingleAyah = async (idx: number) => {
    if (!surahData) return;
    setPlayingAyahIdx(idx);
    try {
      const audioMgr = QariAudioManager.getInstance();
      await audioMgr.playAyah(Number(surahMeta.id), surahData.ayat[idx].ayahNumber);
    } catch {
      console.warn("Qari audio error");
    } finally {
      setPlayingAyahIdx(null);
    }
  };

  // --- Phase 2: Word By Word ---
  const playWordAudio = async (wordText: string) => {
    try {
      const audioMgr = QariAudioManager.getInstance();
      await audioMgr.playWord(wordText, 1);
    } catch {
      console.warn("Word audio error");
    }
  };

  const startWordASR = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = "ar-SA";
    rec.interimResults = false;

    rec.onstart = () => {
      setIsRecording(true);
      setAsrResult("none");
      setSpokenText("");
    };

    rec.onresult = (event: any) => {
      const result = event.results[0][0].transcript.trim();
      setSpokenText(result);

      const targetWord = flatWords[activeWordIdx]?.word || "";
      const similarity = arabicSimilarity(normalizeArabic(result), normalizeArabic(targetWord));

      if (similarity >= 0.58 || normalizeArabic(result).includes(normalizeArabic(targetWord))) {
        setAsrResult("success");
        setTimeout(() => {
          if (activeWordIdx < flatWords.length - 1) {
            setActiveWordIdx(activeWordIdx + 1);
            setAsrResult("none");
            setSpokenText("");
          } else {
            alert("MashaAllah! You completed all words. Proceed to Phase 3!");
          }
        }, 1500);
      } else {
        setAsrResult("retry");
        playWordAudio(targetWord);
      }
    };

    rec.onend = () => setIsRecording(false);
    rec.start();
  };

  // --- Phase 3: Ayah By Ayah ---
  const startAyahASR = () => {
    if (!surahData || typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = "ar-SA";
    rec.interimResults = false;

    rec.onstart = () => {
      setIsRecording(true);
      setAsrResult("none");
      setSpokenText("");
    };

    rec.onresult = (event: any) => {
      const result = event.results[0][0].transcript.trim();
      setSpokenText(result);

      const currentAyah = surahData.ayat[activeAyahIdx];
      const targetAyahText = currentAyah.words.join(" ");
      const similarity = arabicSimilarity(normalizeArabic(result), normalizeArabic(targetAyahText));

      if (similarity >= 0.55 || normalizeArabic(result).includes(normalizeArabic(currentAyah.words[0]))) {
        setAsrResult("success");
        setTimeout(() => {
          if (activeAyahIdx < surahData.ayat.length - 1) {
            setActiveAyahIdx(activeAyahIdx + 1);
            setAsrResult("none");
            setSpokenText("");
          } else {
            alert("MashaAllah! You completed all Ayahs. Move to Phase 4 for full recitation.");
          }
        }, 1500);
      } else {
        setAsrResult("retry");
      }
    };

    rec.onend = () => setIsRecording(false);
    rec.start();
  };

  // --- Phase 4 Finish ---
  const handleRecitationComplete = () => {
    saveLearningProgress({
      track: "surahs",
      lesson_id: `surah_${selectedSurahIdx}`,
      completed: true,
      score: 100,
    });
    alert("Congratulations! Surah recitation logged successfully!");
    resetSession();
    setActivePhase(1);
  };

  const isRecitationDone = activePhase === 4 && allWords.length > 0 && wordIndex >= allWords.length;

  return (
    <div className="min-h-screen flex flex-col pb-24 relative bg-[#faf6ee] text-[#1a1208] transition-colors duration-200">
      <Header />

      {activePhase === 4 && <ContinuousListener micCheckOpen={micCheckOpen} />}
      {activePhase === 4 && <CorrectionOverlay />}
      <MicCheckModal isOpen={micCheckOpen} onClose={() => setMicCheckOpen(false)} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 flex flex-col gap-6 relative z-10">
        
        {/* Header Block with Surah Selector */}
        <section className="flex flex-col gap-4 select-none">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[#6b7280] hover:text-[#1e5e4a] text-xs font-bold uppercase tracking-wider bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-2xs">
              Main Page
            </Link>
            <Link href="/learn" className="text-[#c8993c] hover:text-gold-light text-xs font-bold uppercase tracking-wider bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-2xs">
              Learning Roadmap
            </Link>
          </div>
          <div className="flex flex-col gap-3 mt-1">
            <h2 className="font-amiri text-2xl font-bold text-[#1e5e4a]">
              Stage 5 - Recite Surahs
            </h2>
            
            {/* Surah dropdown selector */}
            <div className="flex flex-wrap gap-2">
              {SHORT_SURAHS.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSurahIdx(idx)}
                  className={`px-3 py-1.5 border rounded-xl font-bold text-[10px] uppercase tracking-wider transition-colors ${
                    idx === selectedSurahIdx
                      ? "bg-[#c8993c] text-white border-[#c8993c] shadow-sm"
                      : "border-gold/20 hover:border-gold/60 bg-white/50 text-[#6b7280]"
                  }`}
                >
                  {s.name} {s.isAvailable ? "✨" : "🔒"}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Dynamic Coming Soon Guard */}
        {!surahData ? (
          <div className="card p-12 border border-[#c8993c]/15 bg-white text-center flex flex-col items-center gap-4 my-8 rounded-2xl shadow-sm">
            <span className="text-5xl">🔒</span>
            <h3 className="text-xl font-extrabold text-[#1a1208]">Surah Coming Soon</h3>
            <p className="text-sm text-[#6b7280] max-w-md leading-relaxed">
              We are currently preparing the interactive word highlights and voice corrections for Surah {surahMeta.name}. 
              Please practice Al-Fatiha, Al-Falaq, or An-Nas which are active.
            </p>
          </div>
        ) : (
          <>
            {/* 4 Phases Selector Tabs */}
            <div className="grid grid-cols-4 gap-1.5 border-b border-zinc-100 pb-3 text-center text-xs font-bold select-none">
              {[
                { num: 1, label: "Listen", icon: "🎧" },
                { num: 2, label: "Word-by-Word", icon: "✍️" },
                { num: 3, label: "Ayah-by-Ayah", icon: "📖" },
                { num: 4, label: "Full Recitation", icon: "🎙️" }
              ].map((phase) => {
                const active = activePhase === phase.num;
                return (
                  <button
                    key={phase.num}
                    onClick={() => setActivePhase(phase.num as any)}
                    className={`py-3 rounded-xl transition-all flex flex-col items-center gap-1 border ${
                      active
                        ? "bg-[#1e5e4a] border-[#1e5e4a] text-white shadow"
                        : "bg-white border-zinc-200 text-[#1e5e4a] hover:bg-gold-pale/15"
                    }`}
                  >
                    <span className="text-lg">{phase.icon}</span>
                    <span className="text-[10px] tracking-wider uppercase font-extrabold">{phase.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Phase Content panels */}
            <section className="flex-1 w-full">
              {activePhase === 1 && (
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-100 shadow-sm">
                    <span className="text-xs font-bold text-[#6b7280]">
                      Phase 1: Listen to Sheikh Al-Husary
                    </span>
                    <button
                      onClick={playFullSurah}
                      className="px-4 h-10 rounded-lg bg-[#c8993c] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-gold-light transition-all"
                    >
                      <span>{isPlayingFull ? "⏹️ Stop" : "▶️ Listen Completely"}</span>
                    </button>
                  </div>

                  <div className="card bg-white p-6 border border-zinc-100 shadow-sm rounded-2xl flex flex-col gap-5">
                    {surahData.ayat.map((a, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl transition-all flex justify-between items-center ${
                          playingAyahIdx === idx ? "bg-gold-pale/20 border border-[#c8993c]/30" : "hover:bg-zinc-50"
                        }`}
                      >
                        <span className="font-amiri text-2xl text-[#1a1208] leading-relaxed">
                          {a.words.join(" ")}
                        </span>
                        <button
                          onClick={() => playSingleAyah(idx)}
                          className="h-8 w-8 rounded-full border border-zinc-200 flex items-center justify-center text-xs hover:bg-zinc-50"
                        >
                          🔊
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activePhase === 2 && (
                <div className="flex flex-col gap-6 items-center text-center">
                  <span className="text-xs font-bold text-[#6b7280]">
                    Phase 2: Practice Word-by-Word ({activeWordIdx + 1} / {flatWords.length})
                  </span>

                  <div className="card bg-white p-10 border border-zinc-100 shadow-sm rounded-2xl w-full max-w-md flex flex-col items-center gap-6">
                    <span className="font-amiri text-5xl text-[#1e5e4a] select-none">
                      {flatWords[activeWordIdx]?.word}
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => playWordAudio(flatWords[activeWordIdx]?.word)}
                        className="h-10 px-4 rounded-lg bg-[#faf6ee] text-[#c8993c] border border-[#c8993c] font-bold text-xs uppercase tracking-wider"
                      >
                        🔊 Hear Word
                      </button>
                      
                      <button
                        onClick={startWordASR}
                        disabled={isRecording}
                        className={`h-10 px-4 rounded-lg text-white font-bold text-xs uppercase tracking-wider ${
                          isRecording ? "bg-red-600 animate-pulse" : "bg-[#1e5e4a]"
                        }`}
                      >
                        🎙️ Speak Word
                      </button>
                    </div>

                    {asrResult === "success" && (
                      <span className="text-emerald font-bold text-sm">✓ Perfect!</span>
                    )}
                    {asrResult === "retry" && (
                      <span className="text-ruby font-bold text-sm">❌ Try Again</span>
                    )}
                    {spokenText && (
                      <span className="text-xs text-[#6b7280] font-semibold mt-1">
                        You said: &quot;{spokenText}&quot;
                      </span>
                    )}
                  </div>
                </div>
              )}

              {activePhase === 3 && (
                <div className="flex flex-col gap-6 items-center text-center">
                  <span className="text-xs font-bold text-[#6b7280]">
                    Phase 3: Recite Ayah-by-Ayah ({activeAyahIdx + 1} / {surahData.ayat.length})
                  </span>

                  <div className="card bg-white p-10 border border-zinc-100 shadow-sm rounded-2xl w-full max-w-xl flex flex-col items-center gap-6">
                    <span className="font-amiri text-3xl text-[#1e5e4a] leading-relaxed">
                      {surahData.ayat[activeAyahIdx]?.words.join(" ")}
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => playSingleAyah(activeAyahIdx)}
                        className="h-10 px-4 rounded-lg bg-[#faf6ee] text-[#c8993c] border border-[#c8993c] font-bold text-xs uppercase tracking-wider"
                      >
                        🔊 Listen Ayah
                      </button>
                      
                      <button
                        onClick={startAyahASR}
                        disabled={isRecording}
                        className={`h-10 px-4 rounded-lg text-white font-bold text-xs uppercase tracking-wider ${
                          isRecording ? "bg-red-600 animate-pulse" : "bg-[#1e5e4a]"
                        }`}
                      >
                        🎙️ Repeat Ayah
                      </button>
                    </div>

                    {asrResult === "success" && (
                      <span className="text-emerald font-bold text-sm">✓ Correct!</span>
                    )}
                    {asrResult === "retry" && (
                      <span className="text-ruby font-bold text-xs">❌ Try Again</span>
                    )}
                  </div>
                </div>
              )}

              {activePhase === 4 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Mushaf Page */}
                  <div className="lg:col-span-8 flex flex-col gap-4">
                    <QuranDisplay />
                    <WaveformBar />
                    <LiveTranscript />
                  </div>

                  {/* Recitation Sidebar */}
                  <div className="lg:col-span-4 card p-6 border-gold/30 bg-white text-center flex flex-col items-center gap-5 rounded-2xl shadow-sm">
                    <span className="text-[9px] text-[#c8993c] font-bold uppercase tracking-[2px] block mb-1">
                      Recitation Monitor
                    </span>
                    
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        Words: {wordIndex} / {allWords.length} Checked
                      </p>
                      <p className="text-emerald font-bold text-xs">
                        Correct Words: {correctCount}
                      </p>
                      <p className="text-ruby font-bold text-xs">
                        Errors: {errorCount}
                      </p>
                    </div>

                    {isRecitationDone ? (
                      <div className="w-full flex flex-col gap-3">
                        <button
                          onClick={handleRecitationComplete}
                          className="w-full py-3 bg-emerald hover:bg-emerald-light text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md shadow-emerald/10"
                        >
                          Complete &amp; Log Progress
                        </button>

                        {/* Interactive Share Card / Certificate */}
                        <div className="p-5 border-2 border-double border-[#c8993c] bg-[#fdf8f0] rounded-xl flex flex-col items-center text-center gap-3 w-full animate-bounce">
                          <span className="font-amiri text-2xl text-[#1e5e4a] leading-none mb-1">مَاشَاءَ اللَّه</span>
                          <h4 className="text-[10px] font-extrabold text-[#1a1208] uppercase tracking-wider">Recitation Complete!</h4>
                          <p className="text-[10px] text-[#6b7280] leading-relaxed">
                            You successfully recited Surah {surahMeta.name} on Tilawah!
                          </p>
                          <div className="px-3 py-1 bg-emerald/10 text-emerald rounded text-[10px] font-bold">
                            Accuracy: {Math.round((correctCount / (allWords.length || 1)) * 100)}%
                          </div>
                          
                          <button
                            onClick={() => {
                              const msg = `I just completed reciting Surah ${surahMeta.name} with ${Math.round((correctCount / (allWords.length || 1)) * 100)}% accuracy on Tilawah! 📖✨`;
                              navigator.clipboard.writeText(msg);
                              alert("Recitation card text copied to clipboard! Share it with your friends.");
                            }}
                            className="mt-1 w-full py-2 bg-[#c8993c] hover:bg-gold-light text-white text-[10px] font-bold uppercase rounded transition-all"
                          >
                            Share Recitation Card 🔗
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="px-4 py-2 border border-zinc-200 bg-zinc-100 text-[10px] font-bold tracking-wider text-zinc-400 rounded-xl uppercase animate-pulse select-none">
                        🎙️ Speak to Recite Surah
                      </span>
                    )}

                  </div>

                </div>
              )}
            </section>
          </>
        )}

      </main>

      <BottomNav />
    </div>
  );
}
