"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRecitationStore } from "../../../lib/store/recitationStore";
import { getSurahData } from "../../../lib/quran/quranData";
import { motion, AnimatePresence } from "framer-motion";
import { preloadAudio, getWordAudio } from "../../../lib/audio/qariCDN";
import { QariAudioManager } from "../../../lib/qariAudio";
import { trackEvent } from "../../../lib/analytics/ga";
import { checkWord } from "../../../lib/arabic/similarity";
import { transcribeAudio } from "../../../lib/speech/transcribe";
import { AudioRecorder } from "../../../lib/speech/recorder";

import Header from "../../../components/Layout/Header";
import SettingsDrawer from "../../../components/UI/SettingsDrawer";
import QuranDisplay from "../../../components/QuranDisplay/QuranDisplay";
import WaveformBar from "../../../components/Listening/WaveformBar";
import LiveTranscript from "../../../components/Listening/LiveTranscript";
import CorrectionOverlay from "../../../components/Correction/CorrectionOverlay";
import ScoreRing from "../../../components/UI/ScoreRing";
import { useToast } from "../../../components/UI/Toast";
import BottomNav from "../../../components/Layout/BottomNav";
import MicCheckModal from "../../../components/Listening/MicCheckModal";



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
  const wordIndex = useRecitationStore((state) => state.wordIndex);
  const allWords = useRecitationStore((state) => state.allWords);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [micCheckOpen, setMicCheckOpen] = useState(true);
  const [statsOpen, setStatsOpen] = useState(false);
  const quranDisplayRef = React.useRef<HTMLDivElement>(null);

  // Local recording & verification states
  const [recordingState, setRecordingState] = useState<'idle' | 'listening' | 'processing' | 'summary'>('idle');
  const [alignedResults, setAlignedResults] = useState<{ word: string; status: 'correct' | 'tajweed' | 'error'; similarity: number; wordIdxInAyah: number }[]>([]);
  const recorderRef = React.useRef<AudioRecorder | null>(null);
  const [showMuteToast, setShowMuteToast] = useState(false);

  const recitationLevel = useRecitationStore((state) => state.recitationLevel);
  const confidentReciterMode = useRecitationStore((state) => state.confidentReciterMode);
  const setLiveTranscript = useRecitationStore((state) => state.setLiveTranscript);

  const advanceAyah = () => {
    if (!currentWordToken) return;
    const nextIdx = allWords.findIndex(w => w.ayahN === currentWordToken.ayahN + 1);
    if (nextIdx !== -1) {
      useRecitationStore.setState({ wordIndex: nextIdx });
    } else {
      useRecitationStore.setState({ wordIndex: allWords.length });
    }
    setRecordingState('idle');
    setAlignedResults([]);
  };

  const startRecording = async () => {
    try {
      if (!recorderRef.current) {
        recorderRef.current = new AudioRecorder();
      }
      
      const audioMgr = QariAudioManager.getInstance();
      audioMgr.stop();
      
      setShowMuteToast(true);
      setTimeout(() => setShowMuteToast(false), 2500);

      await recorderRef.current.start();
      setRecordingState('listening');
      
      let silenceMs = 0;
      const interval = setInterval(async () => {
        if (!recorderRef.current || !recorderRef.current.isRecording()) {
          clearInterval(interval);
          return;
        }
        
        const volume = await recorderRef.current.getRMSLevel();
        if (volume < 0.02) {
          silenceMs += 100;
        } else {
          silenceMs = 0;
        }
        
        if (silenceMs >= 3000) {
          clearInterval(interval);
          stopRecordingAndProcess();
        }
      }, 100);
      
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start microphone.";
      showToast(msg);
    }
  };

  const stopRecordingAndProcess = async () => {
    if (!recorderRef.current || !recorderRef.current.isRecording()) return;
    setRecordingState('processing');
    
    try {
      const audioBlob = await recorderRef.current.stop();
      if (!currentWordToken) return;
      const promptText = currentWordToken.ayahData.words.join(" ");
      
      const result = await transcribeAudio(audioBlob, 'ayah', promptText);
      if (!result.success || !result.transcript) {
        setRecordingState('summary');
        setAlignedResults(currentWordToken.ayahData.words.map((w, idx) => ({
          word: w,
          status: 'error',
          similarity: 0,
          wordIdxInAyah: idx
        })));
        return;
      }
      
      const spokenTranscript = result.transcript.trim();
      setLiveTranscript(spokenTranscript);
      
      const spokenWords = spokenTranscript.split(/\s+/).filter(Boolean);
      const expectedWords = currentWordToken.ayahData.words;
      
      const aligned = expectedWords.map((expectedWord, idx) => {
        let bestMatch: { similarity: number; status: 'correct' | 'tajweed' | 'error' } = { similarity: 0, status: 'error' };
        for (const spokenWord of spokenWords) {
          const check = checkWord(spokenWord, expectedWord, recitationLevel, confidentReciterMode);
          if (check.similarity > bestMatch.similarity) {
            bestMatch = check;
          }
        }
        return {
          word: expectedWord,
          status: bestMatch.status,
          similarity: bestMatch.similarity,
          wordIdxInAyah: idx
        };
      });
      
      setAlignedResults(aligned);
      setRecordingState('summary');
      
      const correctWords = aligned.filter(w => w.status === 'correct' || w.status === 'tajweed').length;
      const errorWords = aligned.length - correctWords;
      
      useRecitationStore.setState(state => ({
        correctCount: state.correctCount + correctWords,
        errorCount: state.errorCount + errorWords,
      }));
      
    } catch {
      setRecordingState('idle');
      showToast("Verification failed. Please try again.");
    }
  };

  const toggleLocalRecording = () => {
    if (recordingState === 'listening') {
      stopRecordingAndProcess();
    } else if (recordingState === 'idle') {
      startRecording();
    }
  };

  const playQariWord = (wordIdx: number) => {
    if (!currentWordToken) return;
    const url = getWordAudio(currentWordToken.ayahData.surahId, currentWordToken.ayahN, wordIdx + 1);
    const audio = new Audio(url);
    audio.play().catch(() => {});
  };



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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen flex flex-col pb-32 relative bg-[#faf6ee] text-[#1a1208] transition-colors duration-200"
    >
      <Header />
      
      {/* Settings Panel Drawer */}
      <SettingsDrawer isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Correction Drawer popup */}
      <CorrectionOverlay />

      {/* Mic Check Modal */}
      <MicCheckModal isOpen={micCheckOpen} onClose={() => setMicCheckOpen(false)} />

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
            recordingState === 'summary' ? (
              <div className="card border-2 border-[#c8993c]/30 shadow-[0_4px_16px_rgba(200,153,60,0.1)] rounded-2xl flex flex-col justify-center items-center py-10 min-h-[40vh] bg-white relative overflow-hidden px-8">
                <span className="text-[10px] text-[#6b7280] font-extrabold uppercase tracking-widest absolute top-4">
                  Ayah Recitation Summary
                </span>
                
                <div className="flex flex-wrap gap-x-2 gap-y-4 justify-center items-center my-6 select-text max-w-xl text-center">
                  {alignedResults.map((w, idx) => {
                    const isCorrect = w.status === 'correct';
                    const isTajweed = w.status === 'tajweed';
                    const isError = w.status === 'error';
                    
                    return (
                      <div key={idx} className="flex flex-col items-center gap-1.5">
                        <span
                          className={`font-amiri text-4xl md:text-5xl leading-none px-1.5 py-1 rounded transition-colors duration-200 ${
                            isCorrect ? "text-[#1e5e4a] bg-emerald-pale/40 font-bold" : ""
                          } ${
                            isTajweed ? "text-amber-700 bg-amber-50 font-bold" : ""
                          } ${
                            isError ? "text-[#8b1a1a] bg-red-50" : ""
                          }`}
                        >
                          {w.word}
                        </span>
                        {isError && (
                          <button
                            onClick={() => playQariWord(w.wordIdxInAyah)}
                            className="text-[10px] text-[#c8993c] hover:text-gold font-bold px-1.5 py-0.5 rounded border border-[#c8993c]/30 bg-[#faf6ee] active:scale-95 transition-all flex items-center gap-0.5"
                            title="Listen to correct pronunciation"
                          >
                            🔊 Listen
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Navigation/Retry options */}
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => {
                      setRecordingState('idle');
                      setAlignedResults([]);
                    }}
                    className="px-5 py-2.5 rounded-xl border border-[#c8993c] bg-[#faf6ee] hover:bg-gold-pale/30 text-[#c8993c] font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                  >
                    🔄 Retry Ayah
                  </button>
                  <button
                    onClick={advanceAyah}
                    className="px-5 py-2.5 rounded-xl bg-[#1e5e4a] text-white font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald/10"
                  >
                    Next Ayah ➡️
                  </button>
                </div>
              </div>
            ) : (
              <div className="card border-2 border-[#c8993c]/30 shadow-[0_4px_16px_rgba(200,153,60,0.1)] rounded-2xl flex flex-col justify-center items-center py-10 min-h-[40vh] bg-white relative overflow-hidden px-8">
                <span className="text-[10px] text-[#6b7280] font-extrabold uppercase tracking-widest absolute top-4">
                  {recordingState === 'listening' ? "Reciting Active Verse" : "Active Verse"}
                </span>
                
                <div className="font-amiri text-4xl md:text-5xl text-[#1e5e4a] leading-relaxed text-center my-6 max-w-xl">
                  {currentWordToken ? currentWordToken.ayahData.words.join(" ") : ""}
                </div>

                {recordingState === 'idle' && (
                  <span className="text-xs text-[#6b7280] font-semibold mt-2">
                    Press the mic button below and read the entire verse.
                  </span>
                )}

                {recordingState === 'listening' && (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-[#8b1a1a] font-bold animate-pulse">
                      🎙️ Voice active... speak now
                    </span>
                    {/* Local waveform indicator visual cue */}
                    <div className="flex gap-1 mt-2 justify-center items-center h-4">
                      {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                        <div
                          key={i}
                          className="w-1 bg-[#8b1a1a] rounded animate-pulse"
                          style={{
                            height: `${h * 4}px`,
                            animationDelay: `${i * 0.1}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {recordingState === 'processing' && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-amber-600 font-bold">
                      Analyzing recitation alignment...
                    </span>
                  </div>
                )}
              </div>
            )
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
        {showMuteToast && (
          <div className="bg-[#faf6ee] border border-[#c8993c]/35 text-[#8b1a1a] text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg transition-all animate-bounce">
            🔇 Audio paused while listening
          </div>
        )}
        <button
          onClick={toggleLocalRecording}
          disabled={recordingState === 'processing'}
          className={`w-[72px] h-[72px] md:w-[80px] md:h-[80px] rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            recordingState === 'idle'
              ? "bg-[#1e5e4a] shadow-[0_4px_12px_rgba(30,94,74,0.3)]"
              : recordingState === 'listening'
              ? "bg-[#8b1a1a] shadow-[0_0_15px_rgba(139,26,26,0.5)] active:scale-95 animate-pulse"
              : recordingState === 'processing'
              ? "bg-[#c8993c] cursor-wait"
              : "bg-zinc-400"
          }`}
        >
          {recordingState === 'idle' && (
            <span className="text-2xl md:text-3xl">🎙️</span>
          )}
          {recordingState === 'listening' && (
            <div className="w-5 h-5 bg-white rounded-full" />
          )}
          {recordingState === 'processing' && (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {recordingState === 'summary' && (
            <span className="text-2xl md:text-3xl">✓</span>
          )}
        </button>
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 text-center">
          {recordingState === 'idle' && "Tap to speak"}
          {recordingState === 'listening' && "Listening... tap to stop"}
          {recordingState === 'processing' && "Checking..."}
          {recordingState === 'summary' && "Done"}
        </span>
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
