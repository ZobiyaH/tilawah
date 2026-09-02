"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRecitationStore } from "../../../lib/store/recitationStore";
import { getSurahData, ALL_SURAHS } from "../../../lib/quran/quranData";
import { motion, AnimatePresence } from "framer-motion";
import { preloadAudio, getWordAudio } from "../../../lib/audio/qariCDN";
import { QariAudioManager } from "../../../lib/qariAudio";
import { trackEvent } from "../../../lib/analytics/ga";
import { checkWord } from "../../../lib/arabic/similarity";
import { transcribeAudio } from "../../../lib/speech/transcribe";
import { AudioRecorder } from "../../../lib/speech/recorder";
import { useContinuousASR } from "../../../lib/speech/useContinuousASR";

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
  const surahMeta = ALL_SURAHS.find((s) => s.id === surahId);

  const loadSurah = useRecitationStore((state) => state.loadSurah);
  const resetSession = useRecitationStore((state) => state.resetSession);
  const saveSessionScore = useRecitationStore((state) => state.saveSessionScore);

  const correctCount = useRecitationStore((state) => state.correctCount);
  const errorCount = useRecitationStore((state) => state.errorCount);
  const feedbackList = useRecitationStore((state) => state.feedbackList);
  const practiceWords = useRecitationStore((state) => state.practiceWords);

  const isListening = useRecitationStore((state) => state.isListening);
  const setListening = useRecitationStore((state) => state.setListening);
  const wordIndex = useRecitationStore((state) => state.wordIndex);
  const allWords = useRecitationStore((state) => state.allWords);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [micCheckOpen, setMicCheckOpen] = useState(true);
  const [statsOpen, setStatsOpen] = useState(false);
  const [recitationMode, setRecitationMode] = useState<"continuous" | "verse">("continuous");

  // Local verse recording & verification states
  const [recordingState, setRecordingState] = useState<"idle" | "listening" | "processing" | "summary">("idle");
  const [alignedResults, setAlignedResults] = useState<{ word: string; status: "correct" | "tajweed" | "error"; similarity: number; wordIdxInAyah: number }[]>([]);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const [showMuteToast, setShowMuteToast] = useState(false);

  const recitationLevel = useRecitationStore((state) => state.recitationLevel);
  const confidentReciterMode = useRecitationStore((state) => state.confidentReciterMode);
  const setLiveTranscript = useRecitationStore((state) => state.setLiveTranscript);

  // Hook for Continuous Live ASR mode
  useContinuousASR(recitationMode === "continuous" && isListening);

  const currentWordToken = allWords[wordIndex];

  // Advance to next verse (for Verse-by-Verse mode)
  const advanceAyah = () => {
    if (!currentWordToken) return;
    const nextIdx = allWords.findIndex((w) => w.ayahN === currentWordToken.ayahN + 1);
    if (nextIdx !== -1) {
      useRecitationStore.setState({ wordIndex: nextIdx });
    } else {
      useRecitationStore.setState({ wordIndex: allWords.length });
    }
    setRecordingState("idle");
    setAlignedResults([]);
  };

  // Verse-by-verse recording start with FIX 1 exact RMS silence detection
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
      setRecordingState("listening");

      const SILENCE_THRESHOLD = 0.008;
      const END_OF_SPEECH_MS = 2500;
      let silenceStartTime: number | null = null;
      let speechDetected = false;

      const interval = setInterval(async () => {
        if (!recorderRef.current || !recorderRef.current.isRecording()) {
          clearInterval(interval);
          return;
        }

        const rms = await recorderRef.current.getRMSLevel();
        if (rms < SILENCE_THRESHOLD) {
          if (speechDetected) {
            silenceStartTime = silenceStartTime || Date.now();
            const silenceDuration = Date.now() - silenceStartTime;
            if (silenceDuration >= END_OF_SPEECH_MS) {
              clearInterval(interval);
              stopRecordingAndProcess();
            }
          }
        } else {
          speechDetected = true;
          silenceStartTime = null; // reset during active words/natural pauses
        }
      }, 60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start microphone.";
      showToast(msg);
    }
  };

  // Verse-by-verse recording stop and analyze with strict FIX 2 & FIX 3 enforcement
  const stopRecordingAndProcess = async () => {
    if (!recorderRef.current || !recorderRef.current.isRecording()) return;
    setRecordingState("processing");

    try {
      const audioBlob = await recorderRef.current.stop();
      if (!currentWordToken) return;
      
      // Full expected Ayah text as Whisper prompt
      const promptText = currentWordToken.ayahData.words.join(" ") || currentWordToken.ayahData.arabic;

      const result = await transcribeAudio(audioBlob, "ayah", promptText);
      
      // FIX 2 & FIX 3: Silence or noise handling — NEVER advance
      if (!result.success || !result.transcript || result.transcript.trim().length === 0) {
        setRecordingState("idle");
        showToast("⚠️ We couldn't hear you clearly. Check your mic and recite again.");
        return;
      }

      const spokenTranscript = result.transcript.trim();
      setLiveTranscript(spokenTranscript);

      const spokenWords = spokenTranscript.split(/\s+/).filter(Boolean);
      const expectedWords = currentWordToken.ayahData.words;

      // Strict sequential alignment: map each expected word to the corresponding spoken word or nearby window
      const aligned = expectedWords.map((expectedWord, idx) => {
        let bestMatch: { similarity: number; status: "correct" | "tajweed" | "error" } = { similarity: 0, status: "error" };
        
        // Check exact corresponding spoken position and immediate adjacent tokens (±1)
        const candidateIndices = [idx, idx - 1, idx + 1].filter(
          (i) => i >= 0 && i < spokenWords.length
        );

        for (const cIdx of candidateIndices) {
          const spokenWord = spokenWords[cIdx];
          const check = checkWord(spokenWord, expectedWord, recitationLevel, confidentReciterMode);
          if (check.similarity > bestMatch.similarity) {
            bestMatch = check;
          }
        }
        
        return {
          word: expectedWord,
          status: bestMatch.status,
          similarity: bestMatch.similarity,
          wordIdxInAyah: idx,
        };
      });

      setAlignedResults(aligned);
      setRecordingState("summary");

      const correctWords = aligned.filter((w) => w.status === "correct" || w.status === "tajweed").length;
      const errorWords = aligned.length - correctWords;

      // FIX 4: Only record scores on genuine real attempts
      useRecitationStore.setState((state) => ({
        correctCount: state.correctCount + correctWords,
        errorCount: state.errorCount + errorWords,
      }));
    } catch {
      setRecordingState("idle");
      showToast("Verification failed. Please try again.");
    }
  };

  // Handle Main Mic Button Toggle
  const handleMicToggle = () => {
    if (recitationMode === "continuous") {
      setListening(!isListening);
    } else {
      if (recordingState === "listening") {
        stopRecordingAndProcess();
      } else if (recordingState === "idle") {
        startRecording();
      }
    }
  };

  const playQariWord = (wordIdx: number) => {
    if (!currentWordToken) return;
    const url = getWordAudio(currentWordToken.ayahData.surahId, currentWordToken.ayahN, wordIdx + 1);
    const audio = new Audio(url);
    audio.play().catch(() => {});
  };

  // Preload Surah Data
  useEffect(() => {
    if (surahData) {
      loadSurah(surahId, surahData.name, surahData.ayat);
      trackEvent("recitation_start", "engagement", `surah_${surahId}`);
    } else {
      router.push("/recite");
    }
  }, [surahId, surahData, loadSurah, router]);

  // Preload audio files silently
  useEffect(() => {
    if (allWords && allWords.length > 0) {
      allWords.slice(0, 4).forEach((w) => {
        const url = getWordAudio(w.ayahData.surahId, w.ayahN, w.wordIdxInAyah + 1);
        preloadAudio(url);
      });
    }
  }, [allWords]);

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

  // Calculate Accuracy
  const totalChecked = correctCount + errorCount;
  const liveAccuracy = totalChecked > 0 ? Math.round((correctCount / totalChecked) * 100) : null;

  const handleSave = async () => {
    trackEvent("surah_complete", "engagement", `surah_${surahId}`);
    await saveSessionScore();

    if (typeof window !== "undefined") {
      const currentCompleted = Number(localStorage.getItem("tilawa_completed_count") || "0");
      localStorage.setItem("tilawa_completed_count", String(currentCompleted + 1));

      const emailCaptured = localStorage.getItem("tilawah_email_captured") === "true";
      const dismissed = sessionStorage.getItem("email_popup_dismissed") === "true";

      if (!emailCaptured && !dismissed) {
        window.dispatchEvent(
          new CustomEvent("open-email-capture", {
            detail: { moment: "MomentC", surahName: surahData.name.split("-")[0] },
          })
        );
        const handleCloseEvent = () => {
          router.push("/recite");
          window.removeEventListener("tilawa-user-updated", handleCloseEvent);
          window.removeEventListener("email-popup-dismissed-event", handleCloseEvent);
        };
        window.addEventListener("tilawa-user-updated", handleCloseEvent);
        window.addEventListener("email-popup-dismissed-event", handleCloseEvent);
      } else {
        showToast("💾 Recitation Score Synced Successfully!");
        router.push("/recite");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen flex flex-col pb-36 relative bg-[#faf6ee] text-[#1a1208] transition-colors duration-200"
    >
      <Header />

      {/* Settings Panel Drawer */}
      <SettingsDrawer isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Correction Overlay popup */}
      <CorrectionOverlay />

      {/* Mic Check Modal - Automatically activates listening upon start */}
      <MicCheckModal
        isOpen={micCheckOpen}
        onClose={() => {
          setMicCheckOpen(false);
          setListening(true);
        }}
      />

      {/* Recitation Main UI */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 mt-4 sm:mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* LEFT COLUMN: Quran Mushaf Reading View & Active Verification (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6">
          
          {/* Top Bar: Surah Info + Mode Switcher */}
          <div className="bg-white/90 border border-[#c8993c]/20 px-4 py-3 rounded-2xl text-xs font-bold text-[#6b7280] shadow-xs flex flex-wrap items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-[#1e5e4a]">{surahData.name}</span>
              {surahMeta?.englishName && (
                <span className="text-[10px] text-zinc-400">({surahMeta.englishName})</span>
              )}
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1 bg-[#faf6ee] p-1 rounded-xl border border-gold/20">
              <button
                onClick={() => {
                  setRecitationMode("continuous");
                  setRecordingState("idle");
                }}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  recitationMode === "continuous"
                    ? "bg-[#1e5e4a] text-white shadow-xs"
                    : "text-zinc-600 hover:text-ink"
                }`}
              >
                🔴 Live Flow
              </button>
              <button
                onClick={() => {
                  setRecitationMode("verse");
                  setListening(false);
                }}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  recitationMode === "verse"
                    ? "bg-[#1e5e4a] text-white shadow-xs"
                    : "text-zinc-600 hover:text-ink"
                }`}
              >
                📖 Verse Check
              </button>
            </div>
          </div>

          {/* Verse-by-Verse Breakdown Card (Shown when in 'verse' mode) */}
          {recitationMode === "verse" && currentWordToken && (
            <div className="card border-2 border-[#c8993c]/30 shadow-md rounded-2xl flex flex-col justify-center items-center py-6 px-6 bg-white relative overflow-hidden animate-[slide-down_0.2s_ease-out]">
              <span className="text-[10px] text-[#6b7280] font-extrabold uppercase tracking-widest absolute top-3">
                {recordingState === "summary" ? "Ayah Verification Breakdown" : `Active Verse — Ayah ${currentWordToken.ayahN}`}
              </span>

              {recordingState === "summary" ? (
                <div className="flex flex-col items-center gap-4 my-4 w-full">
                  <div className="flex flex-wrap gap-x-3 gap-y-4 justify-center items-center select-text max-w-xl text-center" style={{ direction: "rtl" }}>
                    {alignedResults.map((w, idx) => {
                      const isCorrect = w.status === "correct";
                      const isTajweed = w.status === "tajweed";
                      const isError = w.status === "error";

                      return (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <span
                            className={`font-amiri text-3xl md:text-4xl leading-relaxed px-2 py-1 rounded-lg transition-all ${
                              isCorrect ? "text-[#1e5e4a] bg-emerald-pale/50 font-bold border border-emerald/20" : ""
                            } ${
                              isTajweed ? "text-amber-800 bg-amber-50 font-bold border border-amber-300" : ""
                            } ${
                              isError ? "text-[#8b1a1a] bg-red-50 font-bold border border-red-200" : ""
                            }`}
                          >
                            {w.word}
                          </span>
                          {isError && (
                            <button
                              onClick={() => playQariWord(w.wordIdxInAyah)}
                              className="text-[10px] text-[#c8993c] hover:text-gold font-bold px-2 py-0.5 rounded border border-[#c8993c]/30 bg-[#faf6ee] active:scale-95 transition-all flex items-center gap-1"
                              title="Listen to correct Qari voice"
                            >
                              🔊 Listen
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => {
                        setRecordingState("idle");
                        setAlignedResults([]);
                      }}
                      className="px-4 py-2 rounded-xl border border-[#c8993c] bg-[#faf6ee] text-[#c8993c] font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-xs"
                    >
                      🔄 Retry Verse
                    </button>
                    <button
                      onClick={advanceAyah}
                      className="px-5 py-2 rounded-xl bg-[#1e5e4a] text-white font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-md shadow-emerald/10"
                    >
                      Next Verse ➡️
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center my-4 text-center">
                  <div className="font-amiri text-3xl md:text-4xl text-[#1e5e4a] leading-loose max-w-xl" style={{ direction: "rtl" }}>
                    {currentWordToken.ayahData.words.join(" ")}
                  </div>
                  <span className="text-xs text-[#6b7280] font-semibold mt-2">
                    {recordingState === "idle" && "Tap the microphone below, recite the verse, then tap stop."}
                    {recordingState === "listening" && "🎙️ Voice active... reciting verse now."}
                    {recordingState === "processing" && "Analyzing recitation accuracy..."}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Full Quran Mushaf Reading Panel */}
          <div className="flex flex-col gap-2">
            <QuranDisplay />
          </div>

          <WaveformBar />
          <LiveTranscript />
        </div>

        {/* RIGHT COLUMN: Performance and Session Stats (4 cols - Desktop) */}
        <div className="hidden lg:flex lg:col-span-4 flex-col gap-6">
          {/* Performance Summary Ring */}
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

          {/* Timeline Feedbacks */}
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
                      direction: "ltr",
                    }}
                  >
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-500">
                      {item.title}
                    </span>
                    <p className="text-xs font-semibold text-zinc-700 leading-normal mt-0.5">
                      {item.message}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button onClick={resetSession} className="btn-secondary w-full text-center">
              🔄 Restart Session
            </button>
            <button onClick={handleSave} className="btn-primary w-full text-center">
              💾 Save Recitation
            </button>
          </div>
        </div>
      </main>

      {/* Floating Center Mic Button */}
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 md:bottom-8 select-none flex flex-col items-center gap-2">
        {showMuteToast && (
          <div className="bg-[#faf6ee] border border-[#c8993c]/35 text-[#8b1a1a] text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg transition-all animate-bounce">
            🔇 Audio paused while listening
          </div>
        )}

        <button
          onClick={handleMicToggle}
          disabled={recordingState === "processing"}
          className={`w-[70px] h-[70px] md:w-[76px] md:h-[76px] rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            recitationMode === "continuous"
              ? isListening
                ? "bg-[#8b1a1a] shadow-[0_0_20px_rgba(139,26,26,0.6)] animate-pulse"
                : "bg-[#1e5e4a] shadow-[0_4px_16px_rgba(30,94,74,0.35)]"
              : recordingState === "listening"
              ? "bg-[#8b1a1a] shadow-[0_0_20px_rgba(139,26,26,0.6)] animate-pulse"
              : recordingState === "processing"
              ? "bg-[#c8993c] cursor-wait"
              : "bg-[#1e5e4a] shadow-[0_4px_16px_rgba(30,94,74,0.35)]"
          }`}
          aria-label="Toggle Recitation Microphone"
        >
          {recitationMode === "continuous" ? (
            isListening ? (
              <div className="w-5 h-5 bg-white rounded-md" />
            ) : (
              <span className="text-2xl md:text-3xl">🎙️</span>
            )
          ) : recordingState === "listening" ? (
            <div className="w-5 h-5 bg-white rounded-md" />
          ) : recordingState === "processing" ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : recordingState === "summary" ? (
            <span className="text-2xl">✓</span>
          ) : (
            <span className="text-2xl md:text-3xl">🎙️</span>
          )}
        </button>

        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 bg-white/80 px-2.5 py-0.5 rounded-full shadow-xs border border-gold/15">
          {recitationMode === "continuous"
            ? isListening
              ? "Listening live... tap to pause"
              : "Tap to recite live"
            : recordingState === "listening"
            ? "Recording verse... tap to finish"
            : recordingState === "processing"
            ? "Verifying..."
            : recordingState === "summary"
            ? "Verse Checked"
            : "Tap to record verse"}
        </span>
      </div>

      {/* Mobile Stats Floating Trigger */}
      <div className="fixed bottom-20 right-4 z-40 lg:hidden select-none">
        <button
          onClick={() => setStatsOpen(true)}
          className="w-12 h-12 bg-white border border-[#c8993c]/40 rounded-full flex items-center justify-center shadow-lg text-lg hover:scale-105 active:scale-95"
          aria-label="Open Session Stats"
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
              className="w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto px-6 py-8 flex flex-col gap-6 border-t border-gold/30 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-[#1e5e4a]">Session Stats</h3>
                <button
                  onClick={() => setStatsOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#faf6ee] border border-gold/15 flex items-center justify-center font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Progress Summary */}
              <div className="flex flex-col items-center gap-4">
                <ScoreRing score={liveAccuracy} />

                <div className="grid grid-cols-3 gap-6 text-center w-full max-w-xs border-t border-[#c8993c]/10 pt-4 mt-2">
                  <div>
                    <span className="text-[#6b7280] font-bold uppercase block text-[10px]">Correct</span>
                    <span className="text-base font-bold text-[#1e5e4a]">{correctCount}</span>
                  </div>
                  <div>
                    <span className="text-[#6b7280] font-bold uppercase block text-[10px]">Errors</span>
                    <span className="text-base font-bold text-[#8b1a1a]">{errorCount}</span>
                  </div>
                  <div>
                    <span className="text-[#6b7280] font-bold uppercase block text-[10px]">Practice</span>
                    <span className="text-base font-bold text-amber-600">{practiceWords.length}</span>
                  </div>
                </div>
              </div>

              {/* Timeline Logs */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">Recitation Logs</h4>
                <div className="max-h-[180px] overflow-y-auto flex flex-col gap-2.5">
                  {feedbackList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-xl flex flex-col gap-1 bg-white/40 text-left border-l-4"
                      style={{
                        borderLeftColor: item.type === "correct" ? "#1e5e4a" : item.type === "error" ? "#8b1a1a" : "#c8993c",
                        direction: "ltr",
                      }}
                    >
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-500">
                        {item.title}
                      </span>
                      <p className="text-xs font-semibold text-zinc-700 mt-0.5">{item.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Actions Controls */}
              <div className="flex flex-col gap-3 mt-2">
                <button
                  onClick={() => {
                    resetSession();
                    setStatsOpen(false);
                  }}
                  className="btn-secondary w-full"
                >
                  🔄 Restart Session
                </button>
                <button onClick={handleSave} className="btn-primary w-full">
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
