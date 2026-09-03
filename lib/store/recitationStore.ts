import { create } from "zustand";
import { Ayah, WordToken, FeedbackItem, SessionResult } from "../../types";
import { checkWord } from "../arabic/similarity";
import { stripDiacritics } from "../arabic/normalize";
import { speakArabicWord, playCorrectionChime, playSuccessChime } from "../speech/tts";
import { preloadAudio, getWordAudio } from "../audio/qariCDN";

interface RecitationState {
  currentSurahId: string;
  surahName: string;
  mode: "guided" | "free" | "hardcopy";
  wordIndex: number;
  allWords: WordToken[];
  isListening: boolean;
  correctCount: number;
  errorCount: number;
  tajweedHits: number;
  sessionStart: number | null;
  liveTranscript: string;
  feedbackList: FeedbackItem[];
  
  // Correction State
  correctionOverlayOpen: boolean;
  wrongWord: string;
  correctWord: string;
  tajweedTipText: string;
  retryCount: number;
  recitationState: "listening" | "error" | "correction" | "retry" | "success";
  practiceWords: number[];
  successFeedback: string;
  isAudioPlaying: boolean;

  // View Settings
  fontScale: number;
  showTransliteration: boolean;
  showTranslation: boolean;
  showTajweedColors: boolean;
  micGain: number;
  recitationLevel: "beginner" | "intermediate" | "advanced";
  confidentReciterMode: boolean;

  // Actions
  loadSurah: (surahId: string, surahName: string, ayat: Ayah[]) => void;
  setAudioPlaying: (playing: boolean) => void;
  setMode: (mode: "guided" | "free" | "hardcopy") => void;
  setListening: (listening: boolean) => void;
  setLiveTranscript: (text: string) => void;
  processSpeech: (spokenAlternatives: string[]) => void;
  skipWord: () => void;
  dismissCorrection: () => void;
  startRetryMode: () => void;
  retryOnceMore: () => void;
  markForPracticeAndSkip: () => void;
  addFeedback: (type: FeedbackItem["type"], title: string, message: string) => void;
  saveSessionScore: () => Promise<void>;
  setFontScale: (scale: number) => void;
  setMicGain: (gain: number) => void;
  setRecitationLevel: (level: "beginner" | "intermediate" | "advanced") => void;
  setConfidentReciterMode: (mode: boolean) => void;
  toggleTransliteration: () => void;
  toggleTranslation: () => void;
  toggleTajweedColors: () => void;
  resetSession: () => void;
}

export const useRecitationStore = create<RecitationState>((set, get) => {
  return {
    currentSurahId: "",
    surahName: "",
    mode: "guided",
    wordIndex: 0,
    allWords: [],
    isListening: false,
    correctCount: 0,
    errorCount: 0,
    tajweedHits: 0,
    sessionStart: null,
    liveTranscript: "…",
    feedbackList: [],
    
    correctionOverlayOpen: false,
    wrongWord: "",
    correctWord: "",
    tajweedTipText: "",
    retryCount: 0,
    recitationState: "listening",
    practiceWords: [],
    successFeedback: "",
    isAudioPlaying: false,

    fontScale: 32,
    showTransliteration: true,
    showTranslation: true,
    showTajweedColors: true,
    micGain: typeof window !== 'undefined' ? parseFloat(localStorage.getItem('tilawa_mic_gain') || '2.5') : 2.5,
    recitationLevel: typeof window !== 'undefined' ? (localStorage.getItem('tilawa_recitation_level') as "beginner" | "intermediate" | "advanced" || 'intermediate') : 'intermediate',
    confidentReciterMode: typeof window !== 'undefined' ? localStorage.getItem('tilawa_confident_reciter') === 'true' : false,

    loadSurah: (surahId, surahName, ayat) => {
      const allWords: WordToken[] = [];
      let globalIdx = 0;

      ayat.forEach((ayah, ayahIndex) => {
        ayah.words.forEach((wordText, wordIdxInAyah) => {
          allWords.push({
            arabic: wordText,
            clean: stripDiacritics(wordText),
            ayahN: ayah.ayahNumber,
            globalIdx,
            wordIdxInAyah,
            ayahIndex,
            ayahData: ayah,
          });
          globalIdx++;
        });
      });

      set({
        currentSurahId: surahId,
        surahName,
        wordIndex: 0,
        allWords,
        correctCount: 0,
        errorCount: 0,
        tajweedHits: 0,
        sessionStart: Date.now(),
        feedbackList: [
          {
            id: Math.random().toString(),
            type: "hint",
            title: "🌟 Ready",
            message: `Loaded ${surahName}. Grant mic permission and begin reciting.`,
            timestamp: Date.now(),
          },
        ],
        correctionOverlayOpen: false,
      });
    },

    setMode: (mode) => {
      set({ mode });
      get().addFeedback("hint", "⚙️ Mode Changed", `Switched to ${mode} mode.`);
    },

    setListening: (listening) => {
      set({ isListening: listening });
      if (listening) {
        set({ sessionStart: get().sessionStart || Date.now() });
        get().addFeedback("hint", "🎙 Microphone Active", "Listening continuously. Start reciting.");
      } else {
        get().addFeedback("hint", "🎙 Microphone Inactive", "Mic paused.");
      }
    },

    setLiveTranscript: (text) => {
      set({ liveTranscript: text });
    },

    processSpeech: (spokenAlternatives) => {
      const { allWords, wordIndex, recitationState, correctWord, retryCount, isAudioPlaying, recitationLevel, confidentReciterMode } = get();
      if (wordIndex >= allWords.length) return;
      if (isAudioPlaying) return;

      // 1. If in retry mode (user is repeating the specific correctWord)
      if (recitationState === "retry") {
        let matched = false;
        const allSpokenWords: string[] = [];
        for (const alt of spokenAlternatives) {
          const words = alt.trim().split(/\s+/).filter(Boolean);
          allSpokenWords.push(...words);
        }

        if (allSpokenWords.length > 0) {
          // Score all alternatives and pick the best match
          const scores = allSpokenWords.map((s) => {
            const check = checkWord(s, correctWord, recitationLevel, confidentReciterMode);
            return {
              text: s,
              similarity: check.similarity,
              status: check.status,
            };
          });
          const best = scores.reduce((a, b) => (a.similarity > b.similarity ? a : b));
          if (best.status === "correct" || best.status === "tajweed") {
            matched = true;
          }
        }

        if (matched) {
          playSuccessChime();
          set({
            recitationState: "success",
            successFeedback: "✓ Well done! Moving on..."
          });
          get().addFeedback(
            "correct",
            "✓ Correction Accepted",
            `Pronounced "${correctWord}" correctly. Resuming recitation.`
          );
          setTimeout(() => {
            set((state) => ({
              correctCount: state.correctCount + 1,
              wordIndex: state.wordIndex + 1,
              recitationState: "listening",
              successFeedback: "",
              retryCount: 0
            }));
          }, 1500);
          return;
        }

        const nextRetry = retryCount + 1;
        if (nextRetry < 3) {
          set({ recitationState: "error", retryCount: nextRetry });
          get().addFeedback(
            "error",
            `❌ Attempt ${nextRetry} of 3 Failed`,
            `Expected: "${correctWord}". Retrying.`
          );
          speakArabicWord(correctWord, allWords[wordIndex]);
          playCorrectionChime();
          setTimeout(() => {
            if (get().recitationState === "error") {
              set({ recitationState: "retry" });
            }
          }, 600);
        } else {
          set({
            recitationState: "error",
            retryCount: 3,
            correctionOverlayOpen: true
          });
          get().addFeedback(
            "hint",
            "⚠️ Retries Exhausted",
            `Failed to pronounce "${correctWord}" 3 times. Offering review options.`
          );
          playCorrectionChime();
        }
        return;
      }

      // 2. Normal listening flow
      if (recitationState === "listening" || recitationState === "error") {
        interface MatchResult {
          status: "correct" | "tajweed" | "error";
          similarity: number;
          expectedWordIndex: number;
          spokenWordText: string;
        }

        let bestExpectedStart = wordIndex;
        let bestAltWordsMatched = 0;
        let bestMatchResults: MatchResult[] = [];

        // Check starting from up to 3 words prior to allow continuous fluid recitations
        const minStart = Math.max(0, wordIndex - 2);
        for (let expectedStart = minStart; expectedStart <= wordIndex; expectedStart++) {
          for (let a = 0; a < spokenAlternatives.length; a++) {
            const spokenText = spokenAlternatives[a];
            const spokenWords = spokenText.trim().split(/\s+/).filter(Boolean);
            
            let tempExpectedIdx = expectedStart;
            let matchedCount = 0;
            const tempResults: MatchResult[] = [];

            // Find starting spoken word index that matches expectedStart
            let startSpokenIdx = 0;
            for (let i = 0; i < Math.min(spokenWords.length, 4); i++) {
              const check = checkWord(spokenWords[i], allWords[expectedStart].arabic, recitationLevel, confidentReciterMode);
              if (check.status === "correct" || check.status === "tajweed") {
                startSpokenIdx = i;
                break;
              }
            }

            for (let s = startSpokenIdx; s < spokenWords.length; s++) {
              const sWord = spokenWords[s];
              if (tempExpectedIdx >= allWords.length) break;
              const expected = allWords[tempExpectedIdx];
              const check = checkWord(sWord, expected.arabic, recitationLevel, confidentReciterMode);
              
              if (check.status === "correct" || check.status === "tajweed") {
                matchedCount++;
                tempResults.push({
                  status: check.status,
                  similarity: check.similarity,
                  expectedWordIndex: tempExpectedIdx,
                  spokenWordText: sWord,
                });
                tempExpectedIdx++;
              } else {
                // Try checking if sWord matches tempExpectedIdx + 1 (user skipped a particle or slight ASR gap)
                if (tempExpectedIdx + 1 < allWords.length) {
                  const nextExpected = allWords[tempExpectedIdx + 1];
                  const nextCheck = checkWord(sWord, nextExpected.arabic, recitationLevel, confidentReciterMode);
                  if (nextCheck.status === "correct" || nextCheck.status === "tajweed") {
                    matchedCount++;
                    tempResults.push({
                      status: nextCheck.status,
                      similarity: nextCheck.similarity,
                      expectedWordIndex: tempExpectedIdx + 1,
                      spokenWordText: sWord,
                    });
                    tempExpectedIdx += 2;
                    continue;
                  }
                }

                // Or check if sWord + sNext combined matches expected.arabic (ASR split 1 Arabic word into 2 tokens)
                if (s + 1 < spokenWords.length) {
                  const combined = sWord + spokenWords[s + 1];
                  const combCheck = checkWord(combined, expected.arabic, recitationLevel, confidentReciterMode);
                  if (combCheck.status === "correct" || combCheck.status === "tajweed") {
                    matchedCount++;
                    tempResults.push({
                      status: combCheck.status,
                      similarity: combCheck.similarity,
                      expectedWordIndex: tempExpectedIdx,
                      spokenWordText: combined,
                    });
                    tempExpectedIdx++;
                    s++; // skip next spoken word
                    continue;
                  }
                }

                tempResults.push({
                  status: "error",
                  similarity: check.similarity,
                  expectedWordIndex: tempExpectedIdx,
                  spokenWordText: sWord,
                });
                if (matchedCount === 0) {
                  break;
                }
              }
            }

            if (matchedCount > bestAltWordsMatched || (matchedCount === bestAltWordsMatched && expectedStart > bestExpectedStart)) {
              bestAltWordsMatched = matchedCount;
              bestExpectedStart = expectedStart;
              bestMatchResults = tempResults;
            }
          }
        }

        // Apply matches ONLY if genuine correct words were detected
        if (bestAltWordsMatched > 0) {
          let correctIncrement = 0;
          let errorDecrement = 0;
          let wordIdxIncrement = 0;
          let tajweedIncrement = 0;

          for (const res of bestMatchResults) {
            if (res.status === "correct" || res.status === "tajweed") {
              const expected = allWords[res.expectedWordIndex];
              correctIncrement++;
              wordIdxIncrement++;
              if (res.expectedWordIndex < wordIndex) {
                errorDecrement++;
              }
              if (res.status === "tajweed") {
                tajweedIncrement++;
                const annotation = expected.ayahData.tajweedMap?.[expected.wordIdxInAyah]?.[0];
                get().addFeedback(
                  "tajweed",
                  `📐 Tajweed: ${annotation?.rule || "Rule Alert"}`,
                  `${annotation?.description || "Check pronounciation rule."} (Word: ${expected.arabic})`
                );
              } else {
                get().addFeedback("correct", "✓ Correct", `"${expected.arabic}" - well done!`);
              }
            } else {
              break;
            }
          }

          if (wordIdxIncrement > 0) {
            set((state) => ({
              correctCount: state.correctCount + correctIncrement,
              errorCount: Math.max(0, state.errorCount - errorDecrement),
              wordIndex: Math.max(state.wordIndex, bestExpectedStart + wordIdxIncrement),
              tajweedHits: state.tajweedHits + tajweedIncrement,
              recitationState: "listening",
            }));
          }
        } else {
          // No match detected — mistake made by user
          const expected = allWords[wordIndex];
          const spokenErrWord = spokenAlternatives[0]?.split(/\s+/)[0] || "(unclear)";
          
          if (spokenErrWord && spokenErrWord !== "(unclear)" && expected) {
            set((state) => ({
              recitationState: "error",
              wrongWord: spokenErrWord,
              correctWord: expected.arabic,
              errorCount: state.errorCount + 1,
              retryCount: 0,
            }));
            
            get().addFeedback(
              "error",
              `❌ Mismatch - Ayah ${expected.ayahN}`,
              `Spoken: "${spokenErrWord}" → Expected: "${expected.arabic}"`
            );

            // Play authentic Qari voice pronunciation instantly
            speakArabicWord(expected.arabic, expected);
          }
        }
      }
    },

    skipWord: () => {
      const { allWords, wordIndex, practiceWords } = get();
      if (wordIndex >= allWords.length) return;
      get().addFeedback("hint", "⏭ Word Skipped", `Skipped word "${allWords[wordIndex].arabic}".`);
      const newPractice = [...practiceWords];
      if (!newPractice.includes(wordIndex)) newPractice.push(wordIndex);
      set((state) => ({
        practiceWords: newPractice,
        wordIndex: state.wordIndex + 1,
        correctionOverlayOpen: false,
        recitationState: "listening",
        retryCount: 0,
      }));
    },

    dismissCorrection: () => {
      set({ correctionOverlayOpen: false, recitationState: "listening", retryCount: 0 });
    },

    startRetryMode: () => {
      const { allWords, wordIndex } = get();
      const current = allWords[wordIndex];
      set({
        correctionOverlayOpen: false,
        recitationState: "retry",
        correctWord: current ? current.arabic : "",
        retryCount: 0,
      });
      get().addFeedback("hint", "🔄 Repeating Current Word", "Recite the target word clearly into your mic.");
    },

    retryOnceMore: () => {
      set((state) => ({
        correctionOverlayOpen: false,
        recitationState: "retry",
        retryCount: state.retryCount,
      }));
    },

    markForPracticeAndSkip: () => {
      get().skipWord();
    },

    addFeedback: (type, title, message) => {
      set((state) => {
        const item: FeedbackItem = {
          id: Math.random().toString(),
          type,
          title,
          message,
          timestamp: Date.now(),
        };
        const nextList = [item, ...state.feedbackList];
        return {
          feedbackList: nextList.slice(0, 50),
        };
      });
    },

    saveSessionScore: async () => {
      const { currentSurahId, surahName, correctCount, errorCount, tajweedHits, allWords } = get();
      const totalChecked = correctCount + errorCount;
      const accuracy = totalChecked > 0 ? Math.round((correctCount / totalChecked) * 100) : 100;
      const tajweedScore = Math.max(0, 100 - tajweedHits * 5);
      const fluency = Math.min(100, Math.max(50, 100 - errorCount * 4));
      const overall = Math.round(accuracy * 0.5 + tajweedScore * 0.3 + fluency * 0.2);

      const result: SessionResult = {
        id: Math.random().toString(),
        surahId: currentSurahId,
        surahName: surahName || `Surah ${currentSurahId}`,
        timestamp: Date.now(),
        accuracy,
        tajweed: tajweedScore,
        fluency,
        overall,
        correctWords: correctCount,
        totalWords: allWords.length,
      };

      if (typeof window !== "undefined") {
        const existing = localStorage.getItem("tilawa_sessions");
        const list: SessionResult[] = existing ? JSON.parse(existing) : [];
        list.push(result);
        localStorage.setItem("tilawa_sessions", JSON.stringify(list));
      }
    },

    setFontScale: (scale) => set({ fontScale: scale }),
    setMicGain: (gain) => {
      set({ micGain: gain });
      if (typeof window !== 'undefined') localStorage.setItem('tilawa_mic_gain', String(gain));
    },
    setRecitationLevel: (level) => {
      set({ recitationLevel: level });
      if (typeof window !== 'undefined') localStorage.setItem('tilawa_recitation_level', level);
    },
    setConfidentReciterMode: (mode) => {
      set({ confidentReciterMode: mode });
      if (typeof window !== 'undefined') localStorage.setItem('tilawa_confident_reciter', String(mode));
    },
    toggleTransliteration: () => set((state) => ({ showTransliteration: !state.showTransliteration })),
    toggleTranslation: () => set((state) => ({ showTranslation: !state.showTranslation })),
    toggleTajweedColors: () => set((state) => ({ showTajweedColors: !state.showTajweedColors })),
    setAudioPlaying: (playing) => set({ isAudioPlaying: playing }),

    resetSession: () => {
      const { surahName, allWords } = get();
      set({
        wordIndex: 0,
        correctCount: 0,
        errorCount: 0,
        tajweedHits: 0,
        sessionStart: Date.now(),
        recitationState: "listening",
        correctionOverlayOpen: false,
        practiceWords: [],
        feedbackList: [
          {
            id: Math.random().toString(),
            type: "hint",
            title: "🔄 Reset",
            message: `Session restarted for ${surahName || "Surah"}. Begin from Ayah 1.`,
            timestamp: Date.now(),
          },
        ],
      });
      // Preload first words on reset
      if (allWords && allWords.length > 0) {
        allWords.slice(0, 3).forEach((w) => {
          const url = getWordAudio(w.ayahData.surahId, w.ayahN, w.wordIdxInAyah + 1);
          preloadAudio(url);
        });
      }
    },
  };
});
