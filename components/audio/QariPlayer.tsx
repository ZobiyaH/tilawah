"use client";

import { handleAudioStart, handleAudioEnd } from "@/lib/speech/audioRegistry";
import { pauseASRForAudio } from "@/lib/speech/useContinuousASR";
import { getAyahAudioURL, getWordAudioURL, LETTER_AUDIO_MAP } from "@/lib/audio/islamicNetworkCDN";
import { LETTER_VOWEL_FORMS } from "@/data/letterVowelForms";

let activeAudio: HTMLAudioElement | null = null;
let currentPlayingUrl: string | null = null;
const listeners = new Set<(state: { url: string | null; isPlaying: boolean }) => void>();

export const QariPlayer = {
  // Play any direct URL
  async play(url: string, durationEstimate = 2000): Promise<void> {
    if (typeof window === "undefined") return;
    this.stop();

    return new Promise((resolve, reject) => {
      try {
        console.log("QariPlayer playing URL:", url);
        const audio = new Audio(url);
        activeAudio = audio;
        currentPlayingUrl = url;
        this.notifyListeners();

        audio.onplay = () => {
          handleAudioStart();
          const dur = audio.duration && !isNaN(audio.duration) && audio.duration > 0
            ? audio.duration * 1000
            : durationEstimate;
          pauseASRForAudio(dur);
        };

        audio.onended = () => {
          handleAudioEnd();
          this.cleanup();
          resolve();
        };

        audio.onerror = (err) => {
          console.error("QariPlayer loading error:", err);
          handleAudioEnd();
          this.cleanup();
          reject(err);
        };

        audio.play().catch((err) => {
          console.error("QariPlayer play error:", err);
          handleAudioEnd();
          this.cleanup();
          reject(err);
        });
      } catch (err) {
        handleAudioEnd();
        this.cleanup();
        reject(err);
      }
    });
  },

  // Play a specific letter by fetching Uthmani word example audio
  async playLetter(letter: string): Promise<void> {
    const mapEntry = LETTER_AUDIO_MAP[letter];
    if (!mapEntry) {
      console.warn(`No LETTER_AUDIO_MAP entry for letter: ${letter}`);
      return;
    }
    const { surah, ayah, word } = mapEntry.exampleAyah;
    const url = getWordAudioURL(surah, ayah, word);
    await this.play(url, 1500);
  },

  // Play a voweled letter form using its example word
  async playVowelForm(letter: string, formKey: 'withFatha' | 'withKasra' | 'withDamma' | 'withSukoon' | 'withShadda' | 'withMaddAlif'): Promise<void> {
    const form = LETTER_VOWEL_FORMS[letter]?.[formKey];
    if (!form) {
      console.warn(`No LETTER_VOWEL_FORMS entry for: ${letter} -> ${formKey}`);
      return;
    }
    const { surah, ayah, wordPosition } = form.example;
    const url = getWordAudioURL(surah, ayah, wordPosition);
    await this.play(url, 1500);
  },

  // Play a word using getWordAudioURL
  async playWord(surah: number, ayah: number, wordPosition: number): Promise<void> {
    const url = getWordAudioURL(surah, ayah, wordPosition);
    await this.play(url, 1500);
  },

  // Play an ayah using getAyahAudioURL
  async playAyah(surah: number, ayah: number, reciterId = "ar.alafasy"): Promise<void> {
    const url = getAyahAudioURL(surah, ayah, reciterId);
    await this.play(url, 5000);
  },

  // Stop current audio
  stop(): void {
    if (activeAudio) {
      try {
        activeAudio.pause();
      } catch (e) {
        console.warn("Error pausing active audio:", e);
      }
    }
    this.cleanup();
  },

  cleanup(): void {
    activeAudio = null;
    currentPlayingUrl = null;
    this.notifyListeners();
    handleAudioEnd();
  },

  // Subscribe to playback status updates (for reactive UI buttons)
  subscribe(listener: (state: { url: string | null; isPlaying: boolean }) => void): () => void {
    listeners.add(listener);
    // Initial call
    listener({ url: currentPlayingUrl, isPlaying: !!currentPlayingUrl });
    return () => {
      listeners.delete(listener);
    };
  },

  notifyListeners(): void {
    const state = { url: currentPlayingUrl, isPlaying: !!currentPlayingUrl };
    listeners.forEach((listener) => listener(state));
  },

  // Helper to check if a specific URL is currently playing
  isPlayingUrl(url: string): boolean {
    return currentPlayingUrl === url;
  }
};
