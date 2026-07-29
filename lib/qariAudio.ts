/* eslint-disable @typescript-eslint/no-explicit-any */
import { pauseASRForAudio } from "./speech/useContinuousASR";
import { handleAudioStart, handleAudioEnd } from "./speech/audioRegistry";
import quranJson from "../data/quran-uthmani.json";
import { stripDiacritics } from "./arabic/normalize";
import { getAyahAudioURL, getWordAudioURL } from "./audio/islamicNetworkCDN";

const LETTER_MAP: Record<string, string> = {
  "ا": "1_alif.mp3", "أ": "1_alif.mp3", "إ": "1_alif.mp3", "آ": "1_alif.mp3",
  "ب": "2_baa.mp3", "ت": "3_taa.mp3", "ث": "4_thaa.mp3", "ج": "5_jeem.mp3",
  "ح": "6_haa.mp3", "خ": "7_khaa.mp3", "د": "8_daal.mp3", "ذ": "9_zaal.mp3", "ر": "10_raa.mp3",
  "ز": "11_zaa.mp3", "س": "12_seen.mp3", "ش": "13_sheen.mp3", "ص": "14_saad.mp3", "ض": "15_daad.mp3",
  "ط": "16_taah.mp3", "ظ": "17_zhaa.mp3", "ع": "18_ain.mp3", "غ": "19_ghain.mp3", "ف": "20_faa.mp3",
  "ق": "21_qaaf.mp3", "ك": "22_kaaf.mp3", "ل": "23_laam.mp3", "م": "24_meem.mp3", "ن": "25_noon.mp3",
  "ه": "26_haah.mp3", "ة": "26_haah.mp3", "و": "27_waw.mp3", "ي": "30_yaa.mp3", "ى": "30_yaa.mp3"
};

const STATIC_WORDS_MAP: Record<string, { surah: number; ayah: number; idx: number }> = {
  "خلق": { "surah": 67, "ayah": 3, "idx": 2 },
  "جعل": { "surah": 33, "ayah": 4, "idx": 2 },
  "ظلم": { "surah": 27, "ayah": 11, "idx": 3 },
  "ذهب": { "surah": 11, "ayah": 74, "idx": 2 },
  "قتل": { "surah": 5, "ayah": 32, "idx": 10 },
  "بسم": { "surah": 1, "ayah": 1, "idx": 1 },
  "الله": { "surah": 1, "ayah": 1, "idx": 2 },
  "به": { "surah": 13, "ayah": 31, "idx": 5 },
  "شرك": { "surah": 34, "ayah": 22, "idx": 21 },
  "لي": { "surah": 38, "ayah": 69, "idx": 3 },
  "فيه": { "surah": 9, "ayah": 108, "idx": 3 },
  "نعبد": { "surah": 1, "ayah": 5, "idx": 2 },
  "يولد": { "surah": 112, "ayah": 3, "idx": 4 },
  "كفوا": { "surah": 112, "ayah": 4, "idx": 4 },
  "قل": { "surah": 112, "ayah": 1, "idx": 1 },
  "الحمد": { "surah": 1, "ayah": 2, "idx": 1 },
  "انعمت": { "surah": 1, "ayah": 7, "idx": 3 },
  "يلد": { "surah": 112, "ayah": 3, "idx": 2 },
  "لم": { "surah": 112, "ayah": 3, "idx": 1 },
  "ولم": { "surah": 112, "ayah": 3, "idx": 3 },
  "رب": { "surah": 1, "ayah": 2, "idx": 3 },
  "الرحمن": { "surah": 1, "ayah": 3, "idx": 1 },
  "الرحيم": { "surah": 1, "ayah": 3, "idx": 2 },
  "الضالين": { "surah": 26, "ayah": 20, "idx": 6 },
  "احد": { "surah": 90, "ayah": 7, "idx": 5 },
  "كثير": { "surah": 42, "ayah": 30, "idx": 10 },
  "رزق": { "surah": 51, "ayah": 57, "idx": 5 },
  "شاء": { "surah": 18, "ayah": 29, "idx": 6 },
  "سواء": { "surah": 3, "ayah": 113, "idx": 2 },
  "جاء": { "surah": 28, "ayah": 84, "idx": 2 },
  "جاءت": { "surah": 80, "ayah": 33, "idx": 1 },
  "نستعين": { "surah": 1, "ayah": 5, "idx": 4 },
  "الصراط": { "surah": 23, "ayah": 74, "idx": 7 },
  "حديث": { "surah": 79, "ayah": 15, "idx": 3 },
  "مسجد": { "surah": 7, "ayah": 31, "idx": 7 },
  "حاج": { "surah": 2, "ayah": 258, "idx": 5 },
  "خالدين": { "surah": 25, "ayah": 76, "idx": 1 },
  "يخرج": { "surah": 7, "ayah": 58, "idx": 3 },
  "اهدنا": { "surah": 1, "ayah": 6, "idx": 1 },
  "الذين": { "surah": 5, "ayah": 57, "idx": 2 },
  "ذكر": { "surah": 39, "ayah": 45, "idx": 2 },
  "اذن": { "surah": 20, "ayah": 109, "idx": 7 },
  "زلزلة": { "surah": 22, "ayah": 1, "idx": 6 },
  "تنزيل": { "surah": 40, "ayah": 2, "idx": 1 },
  "سبيل": { "surah": 4, "ayah": 74, "idx": 3 },
  "عرش": { "surah": 69, "ayah": 17, "idx": 5 },
  "شريك": { "surah": 6, "ayah": 163, "idx": 2 },
  "صراط": { "surah": 37, "ayah": 23, "idx": 6 },
  "بصير": { "surah": 31, "ayah": 28, "idx": 11 },
  "صدرك": { "surah": 94, "ayah": 1, "idx": 4 },
  "فصل": { "surah": 108, "ayah": 2, "idx": 1 },
  "صدق": { "surah": 3, "ayah": 95, "idx": 2 },
  "عذاب": { "surah": 5, "ayah": 36, "idx": 23 },
  "مع": { "surah": 9, "ayah": 86, "idx": 8 },
  "غير": { "surah": 39, "ayah": 28, "idx": 3 },
  "افواجا": { "surah": 78, "ayah": 18, "idx": 6 },
  "فتح": { "surah": 2, "ayah": 76, "idx": 15 },
  "يومئذ": { "surah": 102, "ayah": 8, "idx": 3 },
  "يكن": { "surah": 98, "ayah": 1, "idx": 2 },
  "مالك": { "surah": 1, "ayah": 4, "idx": 1 },
  "الم": { "surah": 77, "ayah": 20, "idx": 1 },
  "عليهم": { "surah": 9, "ayah": 118, "idx": 8 },
  "ترى": { "surah": 39, "ayah": 60, "idx": 3 },
  "شكورا": { "surah": 76, "ayah": 9, "idx": 8 },
  "يثبت": { "surah": 14, "ayah": 27, "idx": 1 },
  "اولئك": { "surah": 2, "ayah": 5, "idx": 1 },
  "مغضوب": { "surah": 1, "ayah": 7, "idx": 5 },
  "المغضوب": { "surah": 1, "ayah": 7, "idx": 5 },
  "غاسق": { "surah": 113, "ayah": 3, "idx": 3 },
  "حاسد": { "surah": 113, "ayah": 5, "idx": 3 },
  "عم": { "surah": 78, "ayah": 1, "idx": 1 },
  "ان": { "surah": 110, "ayah": 3, "idx": 1 },
  "ثم": { "surah": 102, "ayah": 3, "idx": 1 },
  "من": { "surah": 113, "ayah": 2, "idx": 1 },
  "شر": { "surah": 113, "ayah": 2, "idx": 2 },
  "بعد": { "surah": 2, "ayah": 213, "idx": 1 },
  "يقول": { "surah": 2, "ayah": 8, "idx": 2 },
  "مال": { "surah": 111, "ayah": 2, "idx": 2 },
  "دون": { "surah": 2, "ayah": 23, "idx": 1 },
  "انفسهم": { "surah": 2, "ayah": 9, "idx": 1 },
  "سميع": { "surah": 2, "ayah": 127, "idx": 1 },
  "حكيم": { "surah": 2, "ayah": 129, "idx": 1 },
  "هو": { "surah": 112, "ayah": 1, "idx": 2 },
  "قد": { "surah": 23, "ayah": 1, "idx": 1 },
  "يتساءلون": { "surah": 78, "ayah": 1, "idx": 2 },
  "العالمين": { "surah": 1, "ayah": 2, "idx": 4 },
  "حسد": { "surah": 113, "ayah": 5, "idx": 5 },
  "وقب": { "surah": 113, "ayah": 3, "idx": 5 },
  "في": { "surah": 113, "ayah": 4, "idx": 4 },
  "اعوذ": { "surah": 113, "ayah": 1, "idx": 2 },
  "يوسوس": { "surah": 114, "ayah": 5, "idx": 2 },
  "كتب": { "surah": 2, "ayah": 183, "idx": 5 }
};

export class QariAudioManager {
  private static instance: QariAudioManager;
  private currentAudio: HTMLAudioElement | null = null;

  private constructor() {}

  public static getInstance(): QariAudioManager {
    if (!QariAudioManager.instance) {
      QariAudioManager.instance = new QariAudioManager();
    }
    return QariAudioManager.instance;
  }

  /**
   * Check if audio file exists dynamically via a fast HEAD query
   */
  public async checkAudioExists(audioPath: string): Promise<boolean> {
    if (typeof window === "undefined") return false;
    try {
      const response = await fetch(audioPath, { method: "HEAD" });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Play a specific audio file by path/URL
   */
  public async play(audioPath: string): Promise<void> {
    if (typeof window === "undefined") return;
    this.stop();

    return new Promise((resolve, reject) => {
      try {
        const audio = new Audio(audioPath);
        this.currentAudio = audio;

        audio.onplay = () => {
          handleAudioStart();
          const duration = audio.duration && !isNaN(audio.duration) && audio.duration > 0
            ? audio.duration * 1000
            : 2500;
          this.pauseMicDuringPlayback(duration);
        };

        audio.onended = () => {
          handleAudioEnd();
          this.currentAudio = null;
          resolve();
        };

        audio.onerror = (err) => {
          handleAudioEnd();
          this.currentAudio = null;
          reject(err);
        };

        audio.play().catch((err) => {
          handleAudioEnd();
          this.currentAudio = null;
          reject(err);
        });
      } catch (err) {
        handleAudioEnd();
        this.currentAudio = null;
        reject(err);
      }
    });
  }

  /**
   * Stop current playback
   */
  public stop(): void {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
      } catch {}
      this.currentAudio = null;
      handleAudioEnd();
    }
  }

  /**
   * Play an individual letter pronunciation from verified online Qaida repository
   */
  public async playLetter(letter: string): Promise<void> {
    const cleanLetter = stripDiacritics(letter).trim();
    const slug = LETTER_MAP[cleanLetter] || LETTER_MAP[letter];
    if (!slug) {
      throw new Error(`No audio mapping for letter: ${letter}`);
    }
    const audioPath = `https://raw.githubusercontent.com/adnan/Arabic-Alphabet/master/sounds/${slug}`;
    await this.play(audioPath);
  }

  /**
   * Play a single word audio. Searches Uthmani Quran json to get Qari verse coordinates
   */
  public async playWord(word: string, surahId: number): Promise<void> {
    const cleanTarget = stripDiacritics(word).trim();
    if (!cleanTarget) return;

    // Check if it's a single letter input
    if (cleanTarget.length === 1 && LETTER_MAP[cleanTarget]) {
      return this.playLetter(cleanTarget);
    }

    let coords: { surah: number; ayah: number; idx: number } | null = null;

    // Check static words map first for absolute correct coordinates
    if (STATIC_WORDS_MAP[cleanTarget]) {
      coords = STATIC_WORDS_MAP[cleanTarget];
    }

    // First search in current surah for efficiency
    if (!coords) {
    const surahStr = String(surahId);
    const surahData = (quranJson as any)[surahStr];
    if (surahData && surahData.ayat) {
      for (const ayah of surahData.ayat) {
        const foundIdx = ayah.words.findIndex((w: string) => stripDiacritics(w).trim() === cleanTarget);
        if (foundIdx >= 0) {
          coords = { surah: surahId, ayah: ayah.ayahNumber, idx: foundIdx + 1 };
          break;
        }
      }
    }
    }

    // If not found in current surah, search full Quran
    if (!coords) {
      for (const currentId in quranJson) {
        const s = (quranJson as any)[currentId];
        if (!s || !s.ayat) continue;
        for (const ayah of s.ayat) {
          const foundIdx = ayah.words.findIndex((w: string) => stripDiacritics(w).trim() === cleanTarget);
          if (foundIdx >= 0) {
            coords = { surah: Number(currentId), ayah: ayah.ayahNumber, idx: foundIdx + 1 };
            break;
          }
        }
        if (coords) break;
      }
    }

    // Fallback: search Quran.com via backend route
    if (!coords) {
      try {
        const res = await fetch(`/api/quran/word?text=${encodeURIComponent(cleanTarget)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.audioUrl) {
            await this.play(data.audioUrl);
            return;
          }
        }
      } catch (err) {
        console.warn("Real-time backend word search fallback failed:", err);
      }
    }

    if (!coords) {
      throw new Error(`Word not found in Quran database or online: ${word}`);
    }

    const audioPath = getWordAudioURL(coords.surah, coords.ayah, coords.idx);
    await this.play(audioPath);
  }

  /**
   * Play a full ayah audio from EveryAyah CDN
   */
  public async playAyah(surahId: number, ayahNumber: number): Promise<void> {
    const audioPath = getAyahAudioURL(surahId, ayahNumber, "ar.alafasy");
    await this.play(audioPath);
  }

  /**
   * Pause mic recording temporarily to prevent audio feedback loop
   */
  private pauseMicDuringPlayback(durationMs: number): void {
    pauseASRForAudio(durationMs);
  }
}
