"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRecitationStore } from "../../../lib/store/recitationStore";
import { getSurahData } from "../../../lib/quran/quranData";
import { motion, AnimatePresence } from "framer-motion";
import { speakArabicWord } from "../../../lib/speech/tts";
import { stripDiacritics } from "../../../lib/arabic/normalize";
import { preloadAudio, getWordAudio } from "../../../lib/audio/qariCDN";
import { trackEvent } from "../../../lib/analytics/ga";

import Header from "../../../components/Layout/Header";
import SettingsDrawer from "../../../components/UI/SettingsDrawer";
import QuranDisplay from "../../../components/QuranDisplay/QuranDisplay";
import WaveformBar from "../../../components/Listening/WaveformBar";
import LiveTranscript from "../../../components/Listening/LiveTranscript";
import ContinuousListener from "../../../components/Listening/ContinuousListener";
import CorrectionOverlay from "../../../components/Correction/CorrectionOverlay";
import ScoreRing from "../../../components/UI/ScoreRing";
import { useToast } from "../../../components/UI/Toast";
import BottomNav from "../../../components/Layout/BottomNav";
import MicCheckModal from "../../../components/Listening/MicCheckModal";

// Word-by-word phonetic guide dictionary for short Surahs
const PHONETIC_DICT: Record<string, string> = {
  // Al-Fatiha
  "بسم": "bis-mi",
  "الله": "Al-lah",
  "الرحمن": "ar-Rah-man",
  "الرحيم": "ar-Ra-heem",
  "الحمد": "al-Ham-du",
  "لله": "lil-lah",
  "رب": "Rab-bi",
  "العالمين": "al-'Aa-la-meen",
  "مالك": "Maa-li-ki",
  "يوم": "Yaw-mi",
  "الدين": "ad-Deen",
  "اياك": "Iy-yaa-ka",
  "نعبد": "na'-bu-du",
  "واياك": "wa-Iy-yaa-ka",
  "نستعين": "nas-ta-'een",
  "اهدنا": "Ih-di-naa",
  "الصراط": "as-Si-raat",
  "المستقيم": "al-Mus-ta-qeem",
  "صراط": "si-raat",
  "الذين": "al-la-thee-na",
  "انعمت": "an-'am-ta",
  "عليهم": "a-lay-him",
  "غير": "ghay-ri",
  "المغضوب": "al-Magh-doo-bi",
  "ولا": "wa-laa",
  "الضالين": "ad-Daal-leen",
  
  // Al-Falaq
  "قل": "Qul",
  "اعوذ": "a-'oo-thu",
  "برب": "bi-Rab-bi",
  "الفلق": "al-Fa-laq",
  "من": "min",
  "شر": "shar-ri",
  "ما": "maa",
  "خلق": "kha-laq",
  "ومن": "wa-min",
  "غاسق": "ghaa-si-qin",
  "اذا": "i-thaa",
  "وقب": "wa-qab",
  "النفاثات": "an-Naf-faa-thaa-ti",
  "في": "fee",
  "العقد": "al-'u-qad",
  "حاسد": "haa-si-din",
  "حسد": "ha-sad",

  // An-Nas
  "الناس": "an-Naas",
  "ملك": "Ma-li-ki",
  "اله": "I-laa-hi",
  "الوسواس": "al-Was-waa-si",
  "الخناس": "al-Khan-naas",
  "الذي": "al-la-thee",
  "يوسوس": "yu-was-wi-su",
  "صدور": "su-doo-ri",
  "الجنة": "al-Jin-na-ti"
};

export default function RecitationPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const surahId = (params?.surahId as string) || "1";
  const surahData = getSurahData(surahId);

  const loadSurah = useRecitationStore((state) => state.loadSurah);
  const resetSession = useRecitationStore((state) => state.resetSession);
  const saveSessionScore = useRecitationStore((state) => state.saveSessionScore);
  
  const correctCount = useRecitationStore((state) => state.correctCount);
  const errorCount = useRecitationStore((state) => state.errorCount);
  const feedbackList = useRecitationStore((state) => state.feedbackList);
  const practiceWords = useRecitationStore((state) => state.practiceWords);

  const isListening = useRecitationStore((state) => state.isListening);
  const setListening = useRecitationStore((state) => state.setListening);
  const recitationState = useRecitationStore((state) => state.recitationState);
  const wordIndex = useRecitationStore((state) => state.wordIndex);
  const allWords = useRecitationStore((state) => state.allWords);
  const liveTranscript = useRecitationStore((state) => state.liveTranscript);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [micCheckOpen, setMicCheckOpen] = useState(true);
  const [statsOpen, setStatsOpen] = useState(false);
  const [playingWord, setPlayingWord] = useState(false);
  const [showSilenceWarning, setShowSilenceWarning] = useState(false);
  const lastActivityRef = React.useRef(Date.now());
  const quranDisplayRef = React.useRef<HTMLDivElement>(null);

  // Reset silence timer whenever wordIndex or liveTranscript changes
  useEffect(() => {
    lastActivityRef.current = Date.now();
    setShowSilenceWarning(false);
  }, [wordIndex, liveTranscript]);

  // Check for 4 seconds of silence while isListening is active
  useEffect(() => {
    if (!isListening) {
      setShowSilenceWarning(false);
      return;
    }
    lastActivityRef.current = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= 4000) {
        setShowSilenceWarning(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isListening]);

  // Automatically switch/scroll to the Ayah text screen when user begins reciting
  useEffect(() => {
    if (isListening && quranDisplayRef.current) {
      quranDisplayRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isListening]);

  useEffect(() => {
    if (surahData) {
      loadSurah(surahId, surahData.name, surahData.ayat);
      trackEvent("recitation_start", "engagement", `surah_${surahId}`);
    } else {
      router.push("/");
    }
  }, [surahId, surahData, loadSurah, router]);

  // Preload first 3 words silently on page load/allWords load
  useEffect(() => {
    if (allWords && allWords.length > 0) {
      allWords.slice(0, 3).forEach((w) => {
        const url = getWordAudio(w.ayahData.surahId, w.ayahN, w.wordIdxInAyah + 1);
        preloadAudio(url);
      });
    }
  }, [allWords]);

  // Preload next word silently in background when wordIndex changes
  useEffect(() => {
    const nextWord = allWords[wordIndex + 1];
    if (nextWord) {
      const url = getWordAudio(nextWord.ayahData.surahId, nextWord.ayahN, nextWord.wordIdxInAyah + 1);
      preloadAudio(url);
    }
  }, [wordIndex, allWords]);

  if (!surahData) {
    return null;
  }

  // Calculate live score percentage
  const totalChecked = correctCount + errorCount;
  const liveAccuracy = totalChecked > 0 ? Math.round((correctCount / totalChecked) * 100) : null;

  const currentWordToken = allWords[wordIndex];
  const cleanWord = currentWordToken ? stripDiacritics(currentWordToken.arabic) : "";
  const phoneticGuide = currentWordToken ? (PHONETIC_DICT[cleanWord] || cleanWord) : "";

  const handleSave = async () => {
    trackEvent("surah_complete", "engagement", `surah_${surahId}`);
    await saveSessionScore();
    
    // Register local completed counter for progress popups
    if (typeof window !== "undefined") {
      const currentCompleted = Number(localStorage.getItem("tilawa_completed_count") || "0");
      localStorage.setItem("tilawa_completed_count", String(currentCompleted + 1));

      const emailCaptured = localStorage.getItem("tilawah_email_captured") === "true";
      const dismissed = sessionStorage.getItem("email_popup_dismissed") === "true";

      if (!emailCaptured && !dismissed) {
        window.dispatchEvent(
          new CustomEvent("open-email-capture", { 
            detail: { moment: "MomentC", surahName: surahData.name.split("-")[0] } 
          })
        );
        const handleCloseEvent = () => {
          router.push("/");
          window.removeEventListener("tilawa-user-updated", handleCloseEvent);
          window.removeEventListener("email-popup-dismissed-event", handleCloseEvent);
        };
        window.addEventListener("tilawa-user-updated", handleCloseEvent);
        window.addEventListener("email-popup-dismissed-event", handleCloseEvent);
      } else {
        showToast("💾 Recitation Score Synced Successfully!");
        router.push("/");
      }
    }
  };

  const playCurrentWordAudio = async () => {
    if (currentWordToken && !playingWord) {
      setPlayingWord(true);
      await speakArabicWord(currentWordToken.arabic, currentWordToken, false);
      setPlayingWord(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen flex flex-col pb-32 relative bg-[#faf6ee] text-[#1a1208] transition-colors duration-200"
    >
      <Header />
      
      {/* Listening loop */}
      <ContinuousListener micCheckOpen={micCheckOpen} />

      {/* Settings Panel Drawer */}
      <SettingsDrawer isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Correction Drawer popup */}
      <CorrectionOverlay />

      {/* Mic Check Modal */}
      <MicCheckModal isOpen={micCheckOpen} onClose={() => setMicCheckOpen(false)} />

      {/* Continuous Speech Listener Hook */}
      <ContinuousListener micCheckOpen={micCheckOpen} />

      {/* Recitation Main UI */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* LEFT COLUMN: Practice word and Quran Display (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Status Bar */}
          {currentWordToken && (
            <div className="bg-white/80 border border-[#c8993c]/15 px-4 py-2.5 rounded-xl text-xs font-bold text-[#6b7280] tracking-wide shadow-sm flex items-center justify-between select-none">
              <span>
                Now reciting: <strong className="text-[#1e5e4a]">{surahData.name.split("-")[0]}</strong>
              </span>
              <div className="flex gap-2">
                <span>Ayah {currentWordToken.ayahN} of {surahData.ayat.length}</span>
                <span>•</span>
                <span>Word {currentWordToken.wordIdxInAyah + 1} of {currentWordToken.ayahData.words.length}</span>
              </div>
            </div>
          )}

          {/* Focal Active Word Container (min-height 40% on mobile) */}
          {currentWordToken ? (
            <div className="card border-2 border-[#c8993c]/30 shadow-[0_4px_16px_rgba(200,153,60,0.1)] rounded-2xl flex flex-col justify-center items-center py-10 min-h-[40vh] bg-white relative overflow-hidden">
              <span className="text-[10px] text-[#6b7280] font-extrabold uppercase tracking-widest absolute top-4">
                Say this word
              </span>
              
              {/* Gold outline glow wrapper */}
              <div className="font-amiri text-5xl md:text-6xl text-[#1e5e4a] bg-[#fdf8f0] border border-[#c8993c]/30 shadow-[0_0_24px_rgba(200,153,60,0.2)] rounded-2xl px-10 py-5 leading-normal text-center select-all my-4 transition-all duration-300">
                {currentWordToken.arabic}
              </div>

              {/* Transliteration / Phonetics Guide */}
              <span className="text-lg font-bold text-[#1a1208] italic tracking-wide mt-2">
                {phoneticGuide}
              </span>

              {/* Hear it first Qari playback */}
              <button
                onClick={playCurrentWordAudio}
                className="mt-6 px-5 py-2.5 rounded-xl border border-[#c8993c] bg-[#faf6ee] hover:bg-gold-pale/30 text-[#c8993c] font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-sm"
              >
                <span>🔊</span> {playingWord ? "Listening..." : "Hear it first"}
              </button>
            </div>
          ) : (
            <div className="card shadow-sm rounded-2xl flex flex-col justify-center items-center py-10 min-h-[300px] bg-white">
              <span className="text-4xl mb-4">🎉</span>
              <h3 className="font-bold text-lg text-[#1e5e4a]">Session Finished!</h3>
              <p className="text-xs text-[#6b7280] mt-2">Save your recitation logs below.</p>
            </div>
          )}

          {/* Full Ayah List Display */}
          <div ref={quranDisplayRef} className="flex flex-col gap-3 scroll-mt-20">
            <span className="text-[10px] font-extrabold text-[#6b7280] uppercase tracking-widest select-none flex items-center justify-between">
              <span>Full Verse Context</span>
              <span className="text-[9px] text-[#1e5e4a] font-bold bg-[#faf6ee] px-2.5 py-0.5 rounded-full border border-[#c8993c]/20">
                📖 Active Reading Screen
              </span>
            </span>
            <QuranDisplay />
          </div>

          <WaveformBar />
          <LiveTranscript />
        </div>

        {/* RIGHT COLUMN: Performance and Logs Sidebar (4 cols - hidden on mobile) */}
        <div className="hidden lg:flex lg:col-span-4 flex-col gap-6">
          {/* Performance summary */}
          <div className="card p-6 flex flex-col gap-4">
            <h3 className="text-[#6b7280] font-extrabold uppercase text-[10px] tracking-wider">
              Session Progress
            </h3>
            <ScoreRing score={liveAccuracy} />

            <div className="grid grid-cols-3 gap-2 text-center border-t border-[#c8993c]/10 pt-4 mt-2">
              <div>
                <span className="text-[#6b7280] font-bold uppercase block text-[10px]">Correct</span>
                <span className="text-lg font-bold text-[#1e5e4a]">{correctCount}</span>
              </div>
              <div>
                <span className="text-[#6b7280] font-bold uppercase block text-[10px]">Errors</span>
                <span className="text-lg font-bold text-[#8b1a1a]">{errorCount}</span>
              </div>
              <div>
                <span className="text-[#6b7280] font-bold uppercase block text-[10px]">Practice</span>
                <span className="text-lg font-bold text-amber-600">{practiceWords.length}</span>
              </div>
            </div>
          </div>

          {/* Feedback Timeline Logs */}
          <div className="card p-6 flex flex-col h-[280px]">
            <h3 className="text-[#6b7280] font-extrabold uppercase text-[10px] tracking-wider mb-4">
              Recitation Timeline
            </h3>
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1.5 scrollbar-thin scrollbar-thumb-gold">
              {feedbackList.map((item) => {
                const isCorrect = item.type === "correct";
                const isError = item.type === "error";
                const isTajweed = item.type === "tajweed";

                return (
                  <div
                    key={item.id}
                    className="p-3 border rounded-xl flex flex-col gap-1 transition-all bg-white/40 text-left border-l-4"
                    style={{
                      borderLeftColor: isCorrect ? "#1e5e4a" : isError ? "#8b1a1a" : isTajweed ? "#1a3a5c" : "#c8993c",
                      direction: "ltr"
                    }}
                  >
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-500">
                      {item.title}
                    </span>
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-normal mt-0.5">
                      {item.message}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={resetSession}
              className="btn-secondary w-full text-center"
            >
              🔄 Restart Session
            </button>
            <button
              onClick={handleSave}
              className="btn-primary w-full text-center"
            >
              💾 Save Recitation
            </button>
          </div>
        </div>

      </main>

      {/* Floating ASR Microphone Button (Positioned above mobile BottomNav) */}
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 md:bottom-8 select-none flex flex-col items-center gap-2">
        {isListening && showSilenceWarning && (
          <div className="bg-[#faf6ee] dark:bg-zinc-900 border border-[#c8993c]/35 text-[#1e5e4a] dark:text-emerald-light text-[10px] font-extrabold px-3 py-1 rounded-xl shadow-lg whitespace-nowrap text-center animate-pulse">
            Mic not detecting? Toggle off and on to reset! 🎙️
          </div>
        )}
        <button
          onClick={() => setListening(!isListening)}
          className={`w-[72px] h-[72px] md:w-[80px] md:h-[80px] rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            !isListening
              ? "bg-[#6b7280] shadow-[0_4px_12px_rgba(107,114,128,0.3)]"
              : recitationState === "error" || recitationState === "correction"
              ? "bg-[#8b1a1a] shadow-[0_0_15px_rgba(139,26,26,0.5)] animate-pulse"
              : recitationState === "listening" || recitationState === "retry"
              ? "bg-[#1e5e4a] shadow-[0_0_15px_rgba(30,94,74,0.5)]"
              : "bg-[#c8993c] animate-pulse"
          }`}
        >
          <span className="text-2xl md:text-3xl">{isListening ? "🎙️" : "🔇"}</span>
        </button>
      </div>

      {/* Stats Trigger overlay button on mobile view */}
      <div className="fixed bottom-20 right-6 z-40 lg:hidden select-none">
        <button
          onClick={() => setStatsOpen(true)}
          className="w-12 h-12 bg-white dark:bg-zinc-800 border border-[#c8993c]/30 rounded-full flex items-center justify-center shadow-lg text-lg hover:scale-105 active:scale-95"
        >
          📊
        </button>
      </div>

      {/* Dynamic Mobile Stats Drawer Overlay */}
      <AnimatePresence>
        {statsOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-end justify-center lg:hidden">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-full bg-white dark:bg-zinc-950 rounded-t-3xl max-h-[85vh] overflow-y-auto px-6 py-8 flex flex-col gap-6 border-t border-gold/30 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-[#1e5e4a] dark:text-emerald-400">Session Stats</h3>
                <button
                  onClick={() => setStatsOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#faf6ee] dark:bg-zinc-800 border border-gold/15 flex items-center justify-center font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Progress summary */}
              <div className="flex flex-col items-center gap-4">
                <ScoreRing score={liveAccuracy} />

                <div className="grid grid-cols-3 gap-6 text-center w-full max-w-xs border-t border-[#c8993c]/10 pt-4 mt-2">
                  <div>
                    <span className="text-[#6b7280] dark:text-zinc-500 font-bold uppercase block text-[10px]">Correct</span>
                    <span className="text-base font-bold text-[#1e5e4a] dark:text-emerald-400">{correctCount}</span>
                  </div>
                  <div>
                    <span className="text-[#6b7280] dark:text-zinc-500 font-bold uppercase block text-[10px]">Errors</span>
                    <span className="text-base font-bold text-[#8b1a1a] dark:text-red-400">{errorCount}</span>
                  </div>
                  <div>
                    <span className="text-[#6b7280] dark:text-zinc-500 font-bold uppercase block text-[10px]">Practice</span>
                    <span className="text-base font-bold text-amber-600">{practiceWords.length}</span>
                  </div>
                </div>
              </div>

              {/* Mobile Logs */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">Recitation Logs</h4>
                <div className="max-h-[180px] overflow-y-auto flex flex-col gap-2.5">
                  {feedbackList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-xl flex flex-col gap-1 bg-white/40 text-left border-l-4"
                      style={{
                        borderLeftColor: item.type === "correct" ? "#1e5e4a" : item.type === "error" ? "#8b1a1a" : "#c8993c",
                        direction: "ltr"
                      }}
                    >
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-500">
                        {item.title}
                      </span>
                      <p className="text-xs font-semibold text-zinc-700 mt-0.5">
                        {item.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Actions controls */}
              <div className="flex flex-col gap-3 mt-2">
                <button
                  onClick={() => { resetSession(); setStatsOpen(false); }}
                  className="btn-secondary w-full"
                >
                  🔄 Restart Session
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary w-full"
                >
                  💾 Save Recitation
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav />
    </motion.div>
  );
}
