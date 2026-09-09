import { create } from "zustand";
import { Ayah, WordToken, FeedbackItem, SessionResult } from "../../types";
import { checkWord, normalizeArabic } from "../arabic/similarity";
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

      // 1. Retry mode
      if (recitationState === "retry") {
        let matched = false;
        const allSpokenWords: string[] = [];
        for (const alt of spokenAlternatives) {
          const words = alt.trim().split(/\s+/).filter(Boolean);
          allSpokenWords.push(...words);
        }

        if (allSpokenWords.length > 0) {
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

      // 2. Normal listening flow - Snappy Sequential Verification
      if (recitationState === "listening" || recitationState === "error") {
        interface MatchResult {
          status: "correct" | "tajweed" | "error";
          similarity: number;
          expectedWordIndex: number;
          spokenWordText: string;
        }

        let bestAltWordsMatched = 0;
        let bestMatchResults: MatchResult[] = [];

        for (let a = 0; a < spokenAlternatives.length; a++) {
          const spokenText = spokenAlternatives[a];
          let spokenWords = spokenText.trim().split(/\s+/).filter(Boolean);
          if (spokenWords.length === 0) continue;

          // Strip opening Bismillah/Ta'awwudh if user recited it before an ayah that doesn't start with it
          if (allWords[wordIndex] && spokenWords.length > 1) {
            const firstWordNorm = normalizeArabic(allWords[wordIndex].arabic);
            if (firstWordNorm !== "بسم" && firstWordNorm !== "اعوذ") {
              const startIdx = spokenWords.findIndex(
                (sw) => checkWord(sw, allWords[wordIndex].arabic, recitationLevel, confidentReciterMode).status !== "error"
              );
              if (startIdx > 0) {
                spokenWords = spokenWords.slice(startIdx);
              }
            }
          }

          let tempExpectedIdx = wordIndex;
          let s = 0;
          let matchedCount = 0;
          const tempResults: MatchResult[] = [];

          // Find start anchor: check first 3 spoken words against current word
          let foundAnchor = false;
          for (let i = 0; i < Math.min(spokenWords.length, 3); i++) {
            const check = checkWord(spokenWords[i], allWords[tempExpectedIdx].arabic, recitationLevel, confidentReciterMode);
            if (check.status === "correct" || check.status === "tajweed") {
              s = i;
              foundAnchor = true;
              break;
            }
            if (i + 1 < spokenWords.length) {
              const combined = spokenWords[i] + spokenWords[i + 1];
              const combCheck = checkWord(combined, allWords[tempExpectedIdx].arabic, recitationLevel, confidentReciterMode);
              if (combCheck.status === "correct" || combCheck.status === "tajweed") {
                s = i;
                foundAnchor = true;
                break;
              }
            }
          }

          if (!foundAnchor) {
            // Check if full spoken transcript as a single combined string matches current word
            const fullSpoken = spokenWords.join("");
            const fullCheck = checkWord(fullSpoken, allWords[tempExpectedIdx].arabic, recitationLevel, confidentReciterMode);
            if (fullCheck.status === "correct" || fullCheck.status === "tajweed") {
              matchedCount = 1;
              tempResults.push({
                status: fullCheck.status,
                similarity: fullCheck.similarity,
                expectedWordIndex: tempExpectedIdx,
                spokenWordText: fullSpoken,
              });
              bestAltWordsMatched = 1;
              bestMatchResults = tempResults;
              break;
            }
            continue;
          }

          // Advance through expected words
          while (s < spokenWords.length && tempExpectedIdx < allWords.length) {
            const sWord = spokenWords[s];
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
              s++;
              continue;
            }

            // Check if 2 spoken words combine to match current word (e.g., 'ال' + 'حمد')
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
                s += 2;
                continue;
              }
            }

            // Check if next spoken word matches (handles particle or hesitation)
            if (s + 1 < spokenWords.length) {
              const nextSWord = spokenWords[s + 1];
              const nextSCheck = checkWord(nextSWord, expected.arabic, recitationLevel, confidentReciterMode);
              if (nextSCheck.status === "correct" || nextSCheck.status === "tajweed") {
                matchedCount++;
                tempResults.push({
                  status: nextSCheck.status,
                  similarity: nextSCheck.similarity,
                  expectedWordIndex: tempExpectedIdx,
                  spokenWordText: nextSWord,
                });
                tempExpectedIdx++;
                s += 2;
                continue;
              }
            }

            break;
          }

          if (matchedCount > bestAltWordsMatched) {
            bestAltWordsMatched = matchedCount;
            bestMatchResults = tempResults;
          }
        }

        if (bestAltWordsMatched > 0) {
          let correctIncrement = 0;
          let wordIdxIncrement = 0;
          let tajweedIncrement = 0;

          for (const res of bestMatchResults) {
            if (res.status === "correct" || res.status === "tajweed") {
              const expected = allWords[res.expectedWordIndex];
              correctIncrement++;
              wordIdxIncrement++;
              if (res.status === "tajweed") {
                tajweedIncrement++;
                const annotation = expected.ayahData.tajweedMap?.[expected.wordIdxInAyah]?.[0];
                get().addFeedback(
                  "tajweed",
                  `📐 Tajweed: ${annotation?.rule || "Tajweed Rule"}`,
                  `${annotation?.description || "Notice articulation rule."} (Word: ${expected.arabic})`
                );
              } else {
                get().addFeedback("correct", "✓ Correct", `"${expected.arabic}"`);
              }
            } else {
              break;
            }
          }

          if (wordIdxIncrement > 0) {
            set((state) => ({
              correctCount: state.correctCount + correctIncrement,
              wordIndex: state.wordIndex + wordIdxIncrement,
              tajweedHits: state.tajweedHits + tajweedIncrement,
              recitationState: "listening",
            }));
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
      if (allWords && allWords.length > 0) {
        allWords.slice(0, 3).forEach((w) => {
          const url = getWordAudio(w.ayahData.surahId, w.ayahN, w.wordIdxInAyah + 1);
          preloadAudio(url);
        });
      }
    },
  };
});
