/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Layout/Header";
import BottomNav from "@/components/Layout/BottomNav";
import { QariPlayer } from "@/components/audio/QariPlayer";
import { normalizeArabic } from "@/lib/arabic/normalize";
import { arabicSimilarity } from "@/lib/arabic/similarity";
import { transcribeAudio } from "@/lib/speech/transcribe";
import { preloadAudio, getWordAudio } from "@/lib/audio/qariCDN";

interface CommonWord {
  id: number;
  word: string;
  meaning: string;
  count: number;
  pronunciation: string;
  notes: string;
  breakdown: string[];
  example: {
    surah: number;
    ayah: number;
    wordPosition: number;
    verseText: string;
    highlightWord: string;
  };
}

const COMMON_WORDS: CommonWord[] = [
  // GROUP 1: The Most Essential
  {
    id: 1,
    word: "اللَّه",
    meaning: "Allah (The One God)",
    count: 2699,
    pronunciation: "al-LAH",
    notes: "The Lam (ل) is heavy when preceded by Fatha or Damma. It becomes light after Kasra.",
    breakdown: ["ا (alif)", "ل (lam)", "لَّ (lam heavy)", "ه (ha)"],
    example: { surah: 1, ayah: 1, wordPosition: 2, verseText: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ", highlightWord: "اللَّهِ" }
  },
  {
    id: 2,
    word: "رَبّ",
    meaning: "Rabb (Lord)",
    count: 975,
    pronunciation: "RAB-b",
    notes: "Shadda on Ba - pronounce it doubled and hold slightly.",
    breakdown: ["ر (ra)", "بّ (ba doubled)"],
    example: { surah: 1, ayah: 2, wordPosition: 3, verseText: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", highlightWord: "رَبِّ" }
  },
  {
    id: 3,
    word: "رَحْمَن",
    meaning: "Rahman (Most Merciful)",
    count: 57,
    pronunciation: "rah-MAAN",
    notes: "Hold and stretch the long 'AA' sound on the Mim.",
    breakdown: ["ر (ra)", "ح (ha)", "م (meem)", "ن (noon)"],
    example: { surah: 1, ayah: 1, wordPosition: 3, verseText: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ", highlightWord: "الرَّحْمَنِ" }
  },
  {
    id: 4,
    word: "رَحِيم",
    meaning: "Raheem (Especially Merciful)",
    count: 115,
    pronunciation: "ra-HEEM",
    notes: "Stretch the 'EE' sound for 2 counts due to Madd on Ya.",
    breakdown: ["ر (ra)", "ح (ha)", "ي (ya)", "م (meem)"],
    example: { surah: 1, ayah: 1, wordPosition: 4, verseText: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ", highlightWord: "الرَّحِيمِ" }
  },
  {
    id: 5,
    word: "الْحَمْد",
    meaning: "Alhamd (All praise)",
    count: 43,
    pronunciation: "al-HAM-d",
    notes: "Lam Qamariyyah - pronounce the L clearly without sliding.",
    breakdown: ["ا (alif)", "ل (lam)", "ح (ha)", "م (meem)", "د (dal)"],
    example: { surah: 1, ayah: 2, wordPosition: 1, verseText: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", highlightWord: "الْحَمْدُ" }
  },
  {
    id: 6,
    word: "إِيَّاك",
    meaning: "Iyyaka (You alone)",
    count: 2,
    pronunciation: "iy-YA-ka",
    notes: "Shadda on Ya - double the sound and stretch.",
    breakdown: ["إ (alif)", "يَّ (ya doubled)", "ا (alif)", "ك (kaf)"],
    example: { surah: 1, ayah: 5, wordPosition: 1, verseText: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", highlightWord: "إِيَّاكَ" }
  },
  {
    id: 7,
    word: "صِرَاط",
    meaning: "Sirat (Path/Way)",
    count: 45,
    pronunciation: "si-RAAT",
    notes: "Heavy Sad - produce deep resonance from back of mouth.",
    breakdown: ["ص (sad heavy)", "ر (ra)", "ا (alif)", "ط (ta heavy)"],
    example: { surah: 1, ayah: 6, wordPosition: 2, verseText: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", highlightWord: "الصِّرَاطَ" }
  },
  {
    id: 8,
    word: "الَّذِين",
    meaning: "Alladhina (Those who)",
    count: 1463,
    pronunciation: "al-la-DHEE-na",
    notes: "Pronounce the soft Th (ذ) with tongue edge on teeth.",
    breakdown: ["ا (alif)", "ل (lam)", "ذ (dhal)", "ي (ya)", "ن (noon)"],
    example: { surah: 1, ayah: 7, wordPosition: 1, verseText: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ", highlightWord: "الَّذِينَ" }
  },
  {
    id: 9,
    word: "مِن",
    meaning: "Min (From/Of)",
    count: 3226,
    pronunciation: "min",
    notes: "Apply Noon Sakin rules depending on the following word's letter.",
    breakdown: ["م (meem)", "ن (noon)"],
    example: { surah: 114, ayah: 4, wordPosition: 1, verseText: "مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ", highlightWord: "مِنْ" }
  },
  {
    id: 10,
    word: "فِي",
    meaning: "Fi (In/At)",
    count: 1700,
    pronunciation: "fee",
    notes: "Long vowel on Ya - stretch the EE sound.",
    breakdown: ["ف (fa)", "ي (ya long)"],
    example: { surah: 114, ayah: 5, wordPosition: 2, verseText: "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ", highlightWord: "فِي" }
  },

  // GROUP 2: Essential Phrases
  {
    id: 11,
    word: "بِسْمِ اللَّهِ",
    meaning: "Bismillah (In the name of Allah)",
    count: 150,
    pronunciation: "bis-mil-LAH",
    notes: "Note that the Lam in Allah is light here because it follows a Kasra.",
    breakdown: ["بِ (bi)", "سْ (s)", "مِ (mi)", "ل (l)", "لَّ (l)", "ه (hi)"],
    example: { surah: 1, ayah: 1, wordPosition: 1, verseText: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ", highlightWord: "بِسْمِ اللَّهِ" }
  },
  {
    id: 12,
    word: "الْحَمْدُ لِلَّهِ",
    meaning: "Alhamdulillah (Praise be to Allah)",
    count: 38,
    pronunciation: "al-ham-du-lil-LAH",
    notes: "A phrase of gratitude expressing thanks to the Creator.",
    breakdown: ["الْحَمْدُ (praise)", "لِلَّهِ (to Allah)"],
    example: { surah: 1, ayah: 2, wordPosition: 1, verseText: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", highlightWord: "الْحَمْدُ لِلَّهِ" }
  },
  {
    id: 13,
    word: "سُبْحَانَ اللَّهِ",
    meaning: "SubhanAllah (Glory be to Allah)",
    count: 12,
    pronunciation: "sub-ha-nal-LAH",
    notes: "Declares Allah's absolute perfection above all shortcomings.",
    breakdown: ["سُبْحَانَ (Glory)", "اللَّهِ (of Allah)"],
    example: { surah: 17, ayah: 43, wordPosition: 1, verseText: "سُبْحَانَهُ وَتَعَالَىٰ عَمَّا يَقُولُونَ", highlightWord: "سُبْحَانَهُ" }
  },
  {
    id: 14,
    word: "إِنَّ اللَّهَ",
    meaning: "Inna Allah (Indeed Allah)",
    count: 180,
    pronunciation: "in-nal-LA-ha",
    notes: "Ghunna on the Noon in 'Inna' (nasal hum held for 2 counts).",
    breakdown: ["إِنَّ (Indeed)", "اللَّهَ (Allah)"],
    example: { surah: 2, ayah: 20, wordPosition: 20, verseText: "إِنَّ اللَّهَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ", highlightWord: "إِنَّ اللَّهَ" }
  },
  {
    id: 15,
    word: "وَاللَّهُ",
    meaning: "Wallahu (And Allah)",
    count: 240,
    pronunciation: "wal-LA-hu",
    notes: "The Lam is heavy here because it follows a Fatha on the Waw.",
    breakdown: ["وَ (And)", "اللَّهُ (Allah)"],
    example: { surah: 2, ayah: 19, wordPosition: 23, verseText: "وَاللَّهُ مُحِيطٌ بِالْكَافِرِينَ", highlightWord: "وَاللَّهُ" }
  },
  {
    id: 16,
    word: "رَبِّ الْعَالَمِينَ",
    meaning: "Rabbil Alameen (Lord of the worlds)",
    count: 42,
    pronunciation: "rab-bil-aa-la-MEEN",
    notes: "Connect the Ba directly to the Lam of Al-Alameen.",
    breakdown: ["رَبِّ (Lord of)", "الْعَالَمِينَ (the worlds)"],
    example: { surah: 1, ayah: 2, wordPosition: 3, verseText: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", highlightWord: "رَبِّ الْعَالَمِينَ" }
  },
  {
    id: 17,
    word: "إِنَّا لِلَّهِ",
    meaning: "Inna lillahi (Indeed we belong to Allah)",
    count: 1,
    pronunciation: "in-na-lil-LAH",
    notes: "Hum on the double Noon, stretch the Alif, and connect to light Lam.",
    breakdown: ["إِنَّا (Indeed we)", "لِلَّهِ (for Allah)"],
    example: { surah: 2, ayah: 156, wordPosition: 9, verseText: "قَالُوا إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ", highlightWord: "إِنَّا لِلَّهِ" }
  },
  {
    id: 18,
    word: "لَا إِلَهَ إِلَّا اللَّهُ",
    meaning: "La ilaha illallah (There is no god but Allah)",
    count: 3,
    pronunciation: "la-i-la-ha-il-lal-LAH",
    notes: "The foundational statement of monotheism (Tawhid).",
    breakdown: ["لَا (No)", "إِلَهَ (deity)", "إِلَّا (except)", "اللَّهُ (Allah)"],
    example: { surah: 47, ayah: 19, wordPosition: 5, verseText: "فَاعْلَمْ أَنَّهُ لَا إِلَٰهَ إِلَّا اللَّهُ", highlightWord: "لَا إِلَٰهَ إِلَّا اللَّهُ" }
  },
  {
    id: 19,
    word: "مَاشَاءَ اللَّهُ",
    meaning: "MashaAllah (What Allah has willed)",
    count: 1,
    pronunciation: "ma-sha-al-LAH",
    notes: "Stretch the 'SHA' sound for 4 counts due to wave Madd on Shaa.",
    breakdown: ["مَا (What)", "شَاءَ (willed)", "اللَّهُ (Allah)"],
    example: { surah: 18, ayah: 39, wordPosition: 14, verseText: "وَلَوْلَا إِذْ دَخَلْتَ جَنَّتَكَ قُلْتَ مَا شَاءَ اللَّهُ", highlightWord: "مَا شَاءَ اللَّهُ" }
  },
  {
    id: 20,
    word: "إِن شَاءَ اللَّهُ",
    meaning: "InshaAllah (If Allah wills)",
    count: 6,
    pronunciation: "in-sha-al-LAH",
    notes: "Ikhfa on Nun: hide the Nun sound into a nasal hum before Shaa.",
    breakdown: ["إِنْ (If)", "شَاءَ (wills)", "اللَّهُ (Allah)"],
    example: { surah: 18, ayah: 69, wordPosition: 3, verseText: "قَالَ سَتَجِدُنِي إِنْ شَاءَ اللَّهُ صَابِرًا", highlightWord: "إِنْ شَاءَ اللَّهُ" }
  }
];

export default function CommonWordsPage() {
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState(0);
  const [activePlayUrl, setActivePlayUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [asrResult, setAsrResult] = useState<"none" | "success" | "retry">("none");
  const [spokenText, setSpokenText] = useState("");

  useEffect(() => {
    return QariPlayer.subscribe((state) => {
      setActivePlayUrl(state.url);
    });
  }, []);

  // Preload first 3 words silently on page load
  useEffect(() => {
    [0, 1, 2].forEach(index => {
      const w = COMMON_WORDS[index];
      if (w) {
        const url = getWordAudio(w.example.surah, w.example.ayah, w.example.wordPosition);
        preloadAudio(url);
      }
    });
  }, []);

  // Preload next word silently in background when active index changes
  useEffect(() => {
    const nextWord = COMMON_WORDS[activeIdx + 1];
    if (nextWord) {
      const url = getWordAudio(nextWord.example.surah, nextWord.example.ayah, nextWord.example.wordPosition);
      preloadAudio(url);
    }
  }, [activeIdx]);

  const currentWord = COMMON_WORDS[activeIdx];

  const playWordAudio = async () => {
    await QariPlayer.playWord(
      currentWord.example.surah,
      currentWord.example.ayah,
      currentWord.example.wordPosition
    );
  };

  const playFullAyah = async () => {
    await QariPlayer.playAyah(currentWord.example.surah, currentWord.example.ayah);
  };

  const playLetterBreakdownAudio = async (char: string) => {
    const clean = char.replace(/\(.*?\)/, "").trim();
    await QariPlayer.playLetter(clean);
  };

  const recorderRef = useRef<any>(null);

  const checkPronunciation = (spoken: string) => {
    setSpokenText(spoken);
    const cleanSpoken = spoken.trim();
    
    let isMatch = false;
    const cleanTarget = normalizeArabic(currentWord.word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?؟]/g, "").trim());
    const cleanAlt = normalizeArabic(cleanSpoken.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?؟]/g, "").trim());

    if (cleanAlt === cleanTarget || cleanAlt.includes(cleanTarget) || cleanTarget.includes(cleanAlt)) {
      isMatch = true;
    } else {
      const score = arabicSimilarity(cleanAlt, cleanTarget);
      if (score >= 0.4) {
        isMatch = true;
      }
    }

    if (isMatch) {
      setAsrResult("success");
    } else {
      setAsrResult("retry");
      playWordAudio();
    }
  };

  const handleMicTap = async () => {
    if (isRecording) {
      setIsRecording(false);
      setSpokenText("Processing...");
      setAsrResult("none");
      
      try {
        if (recorderRef.current) {
          const audioBlob = await recorderRef.current.stop();
          const result = await transcribeAudio(audioBlob);
          
          if (!result.success || !result.transcript) {
            setAsrResult("retry");
            setSpokenText("Could not hear you. Try again.");
            return;
          }
          
          checkPronunciation(result.transcript);
        }
      } catch (err) {
        console.error("Recording stop/transcription failed:", err);
        setAsrResult("retry");
        setSpokenText("Something went wrong. Try again.");
      }
    } else {
      try {
        if (!recorderRef.current) {
          const { AudioRecorder } = await import("@/lib/speech/recorder");
          recorderRef.current = new AudioRecorder();
        }
        await recorderRef.current.start();
        setIsRecording(true);
        setAsrResult("none");
        setSpokenText("");

        setTimeout(() => {
          if (recorderRef.current && recorderRef.current.isRecording()) {
            handleMicTap();
          }
        }, 8000);
      } catch (err: any) {
        console.error("Microphone start failed:", err);
        setAsrResult("retry");
        setSpokenText(err.message || "Microphone access denied.");
      }
    }
  };

  const startSpeechRecording = () => {
    handleMicTap();
  };

  return (
    <div className="min-h-screen flex flex-col pb-24 relative bg-[#faf6ee] text-[#1a1208] transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-6 relative z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold select-none">
          <Link href="/learn" className="hover:underline">Learn</Link>
          <span>&rarr;</span>
          <span className="text-[#1e5e4a] font-bold">Common Words ({activeIdx + 1} of {COMMON_WORDS.length})</span>
        </div>

        {/* Word Card */}
        <div className="card bg-white p-7 border border-[#c8993c]/15 shadow-sm rounded-[20px] flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-4 text-left">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[3px] text-[#1e5e4a]">
                Common Quranic Words · {activeIdx + 1} of {COMMON_WORDS.length}
              </span>
              <h2 className="text-3xl font-black font-amiri text-[#1a1208] mt-1">
                {currentWord.word}
              </h2>
            </div>
            <span className="px-3 py-1 bg-gold-pale/30 border border-[#c8993c]/20 rounded-full text-[9px] font-bold uppercase tracking-wider text-yellow-800 font-lato">
              Appears {currentWord.count.toLocaleString()} times
            </span>
          </div>

          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <span className="font-amiri text-6xl text-[#1e5e4a] leading-relaxed drop-shadow-xs select-none">
              {currentWord.word}
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-zinc-700">
                <span className="font-bold text-[#1e5e4a]">Meaning:</span> {currentWord.meaning}
              </span>
              <span className="text-xs font-semibold text-zinc-400">
                Pronunciation: <span className="italic text-[#1a3a5c]">{currentWord.pronunciation}</span>
              </span>
            </div>

            <button
              onClick={playWordAudio}
              className={`w-full max-w-xs h-12 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all active:scale-98 shadow-sm ${
                activePlayUrl
                  ? "bg-[#1e5e4a] text-white border-[#1e5e4a] cursor-not-allowed"
                  : "bg-[#1e5e4a] text-white border-[#1e5e4a] hover:bg-[#164738]"
              }`}
              disabled={!!activePlayUrl}
            >
              <span>🔊</span>
              <span>{activePlayUrl ? "Playing..." : "Hear this word"}</span>
            </button>
          </div>

          {/* Letter Breakdown */}
          <div className="border-t border-zinc-100 pt-5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 text-left mb-3">
              Letter-by-Letter Breakdown
            </h4>
            <div className="flex flex-wrap gap-3">
              {currentWord.breakdown.map((b, idx) => (
                <button
                  key={idx}
                  onClick={() => playLetterBreakdownAudio(b)}
                  className="px-3.5 py-2 bg-[#faf6ee] hover:bg-gold-pale/35 border border-[#c8993c]/20 rounded-xl text-xs font-bold text-yellow-800 flex items-center gap-1.5 transition-all shadow-3xs"
                >
                  <span>🔊</span>
                  <span>{b}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tajweed Note */}
          <div className="border-t border-zinc-100 pt-5 text-left bg-gradient-to-tr from-[#1e5e4a]/2 to-transparent p-4 rounded-2xl border border-[#1e5e4a]/10">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#1e5e4a] mb-1">
              💡 Tajweed & Pronunciation Note
            </h4>
            <p className="text-xs font-semibold text-zinc-600 leading-relaxed">
              {currentWord.notes}
            </p>
          </div>

          {/* Find it in the Quran */}
          <div className="border-t border-zinc-100 pt-5 text-left">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3">
              Find it in the Quran
            </h4>
            <div className="p-4 bg-[#fdf8f0] border border-[#c8993c]/15 rounded-2xl flex flex-col gap-3">
              <div className="flex justify-between items-center text-[10px] font-bold text-[#c8993c] uppercase tracking-wider">
                <span>Surah {currentWord.example.surah}, Ayah {currentWord.example.ayah}</span>
              </div>
              <div className="leading-loose text-right font-amiri text-2xl text-[#1a1208]" dir="rtl">
                {currentWord.example.verseText.split(" ").map((w, idx) => {
                  const isMatch = w.includes(currentWord.example.highlightWord);
                  return (
                    <span key={idx} className={isMatch ? "text-[#c8993c] font-black underline decoration-wavy" : ""}>
                      {w}{" "}
                    </span>
                  );
                })}
              </div>
              <button
                onClick={playFullAyah}
                className="self-end h-9 px-4 rounded-lg bg-white border border-[#c8993c]/30 text-[10px] font-bold uppercase tracking-wider text-yellow-800 hover:bg-[#faf6ee] flex items-center gap-1.5 shadow-3xs"
              >
                <span>🔊</span> Hear Full Ayah
              </button>
            </div>
          </div>

          {/* Your Turn (ASR) */}
          <div className="border-t border-zinc-100 pt-5 bg-gradient-to-tr from-[#1e5e4a]/5 to-[#c8993c]/5 p-6 border border-dashed border-[#c8993c]/30 rounded-2xl flex flex-col items-center gap-4 text-center">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1e5e4a]">Your Turn</span>
              <p className="text-xs font-bold text-zinc-500 mt-1">
                Say this word into the microphone:
              </p>
            </div>

            <span className="font-amiri text-4xl text-[#1e5e4a] leading-relaxed select-none">
              {currentWord.word}
            </span>

            <button
              onClick={startSpeechRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-md transition-all active:scale-95 ${
                isRecording
                  ? "bg-[#8b1a1a] shadow-[0_6px_24px_rgba(139,26,26,0.3)] animate-pulse"
                  : asrResult === "success"
                  ? "bg-[#1e5e4a] shadow-[0_6px_24px_rgba(30,94,74,0.3)]"
                  : "bg-[#1e5e4a] hover:bg-[#164738]"
              }`}
            >
              <span className="text-2xl">🎙️</span>
            </button>
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
              {isRecording ? "Listening... Speak now" : "Tap and speak"}
            </span>

            {spokenText && (
              <p className="text-xs text-[#6b7280] font-semibold mt-1">
                You said: &quot;{spokenText}&quot;
              </p>
            )}

            {asrResult === "success" && (
              <div className="p-3 bg-emerald-pale/60 border border-emerald/20 rounded-xl text-emerald font-bold text-xs flex items-center gap-1.5 animate-bounce">
                <span>✓ Perfect! Excellent pronunciation.</span>
              </div>
            )}

            {asrResult === "retry" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[#8b1a1a] font-bold text-xs max-w-xs leading-normal">
                <span>Try again &mdash; listen to the Qari and match the sounds.</span>
              </div>
            )}
          </div>
        </div>

        {/* Previous / Next Word Navigation */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => {
              if (activeIdx > 0) {
                setActiveIdx(activeIdx - 1);
                setAsrResult("none");
                setSpokenText("");
              }
            }}
            disabled={activeIdx === 0}
            className="btn-secondary h-[52px] min-w-[140px] flex items-center justify-center font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous Word
          </button>

          <button
            onClick={() => {
              if (activeIdx < COMMON_WORDS.length - 1) {
                setActiveIdx(activeIdx + 1);
                setAsrResult("none");
                setSpokenText("");
              } else {
                router.push("/learn");
              }
            }}
            className="btn-primary h-[52px] min-w-[140px] flex items-center justify-center font-bold bg-[#c8993c] border-[#c8993c] text-white hover:bg-gold-light"
            style={{ backgroundColor: "#c8993c", borderColor: "#c8993c" }}
          >
            {activeIdx < COMMON_WORDS.length - 1 ? "Next Word" : "Back to Roadmap"}
          </button>
        </div>

      </main>

      <BottomNav />
    </div>
  );
}
