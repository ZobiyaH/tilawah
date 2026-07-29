/* eslint-disable @typescript-eslint/no-explicit-any */
import { handleAudioStart, handleAudioEnd } from "./audioRegistry";
import { pauseASRForAudio } from "./useContinuousASR";

let audioUnlocked = false;
export function unlockAudio() {
  if (audioUnlocked || typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    ctx.resume().then(() => { audioUnlocked = true; });
    // Play a silent buffer to unlock HTMLAudioElement too
    const silent = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = silent;
    source.connect(ctx.destination);
    source.start();
    console.log("Audio contexts and HTMLAudio elements unlocked on user gesture");
  } catch (e) {
    console.warn("Audio Context unlock failed:", e);
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', unlockAudio, { once: true });
  document.addEventListener('touchstart', unlockAudio, { once: true });
}

export function speakArabicLocal(text: string, rate = 0.6): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '⚠️ TILAWAH: speechSynthesis called - replace with real Qari audio. File:',
      new Error().stack
    );
  }
  if (typeof window !== 'undefined' && localStorage.getItem('tilawah_use_computer_voice') !== 'true') {
    console.log("QariPlayer real voice only mode: Suppressed browser speech synthesis for:", text);
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      reject('no speechSynthesis'); return;
    }

    window.speechSynthesis.cancel();

    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'ar-SA';
      utter.rate = rate;
      utter.pitch = 1.0;
      utter.volume = 1.0;

      // Priority order: ar-SA → ar-EG → ar-XA → any ar → fallback
      const voice =
        voices.find(v => v.lang === 'ar-SA') ||
        voices.find(v => v.lang === 'ar-EG') ||
        voices.find(v => v.lang.startsWith('ar')) ||
        null;

      if (voice) utter.voice = voice;

      utter.onend = () => {
        handleAudioEnd();
        resolve();
      };
      utter.onerror = (e) => {
        handleAudioEnd();
        reject(e);
      };

      handleAudioStart();
      window.speechSynthesis.speak(utter);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      trySpeak();
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', trySpeak, { once: true });
      setTimeout(trySpeak, 1000);
    }
  });
}

export function speakArabic(text: string, rate = 0.6): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '⚠️ TILAWAH: speechSynthesis called - replace with real Qari audio. File:',
      new Error().stack
    );
  }
  if (typeof window !== 'undefined' && localStorage.getItem('tilawah_use_computer_voice') !== 'true') {
    console.log("QariPlayer real voice only mode: Suppressed TTS fallback for:", text);
    return Promise.resolve();
  }

  return playTTSFallback(text).catch((err) => {
    console.warn("Google TTS API fallback failed, using local browser voice:", err);
    return speakArabicLocal(text, rate);
  });
}

async function playQariAudio(audioEl: HTMLAudioElement) {
  try {
    audioEl.currentTime = 0;
    audioEl.volume = 1.0;
    await audioEl.play();
  } catch (err) {
    console.warn('Qari audio blocked, using TTS fallback', err);
    const wordText = audioEl.getAttribute('data-arabic') || '';
    if (wordText) {
      const durationMs = Math.max(1500, wordText.length * 150);
      pauseASRForAudio(durationMs);
      await speakArabic(wordText, 0.6);
    }
  }
}

/**
 * Speaks an Arabic word or full verse using authentic Qari recitations (Sheikh Al-Husary),
 * falling back to local TTS/SpeechSynthesis if CDNs fail.
 */
export function speakArabicWord(
  text: string,
  wordToken?: { ayahN: number; wordIdxInAyah: number; ayahData: { surahId: number } },
  isFullAyah = false
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    if (wordToken) {
      try {
        const pad3 = (num: number) => String(num).padStart(3, "0");
        let cdnUrl = "";

        if (isFullAyah) {
          cdnUrl = `https://everyayah.com/data/Husary_128kbps/${pad3(wordToken.ayahData.surahId)}${pad3(wordToken.ayahN)}.mp3`;
        } else {
          cdnUrl = `https://audio.qurancdn.com/wbw/${pad3(wordToken.ayahData.surahId)}_${pad3(wordToken.ayahN)}_${pad3(wordToken.wordIdxInAyah + 1)}.mp3`;
        }

        const audio = new Audio(cdnUrl);
        audio.setAttribute("data-arabic", text);
        
        audio.onplay = () => {
          handleAudioStart();
          const dur = audio.duration && !isNaN(audio.duration) && audio.duration > 0
            ? audio.duration * 1000
            : Math.max(2500, text.length * 180);
          pauseASRForAudio(dur);
        };

        audio.onended = () => {
          handleAudioEnd();
          resolve();
        };

        audio.onerror = async (err) => {
          console.warn("Qari CDN play failed, falling back to TTS proxy:", err);
          handleAudioEnd();
          await playTTSFallback(text);
          resolve();
        };

        playQariAudio(audio).then(() => resolve()).catch(() => resolve());
        return;
      } catch (e) {
        console.warn("Qari CDN instantiation failed:", e);
      }
    }

    playTTSFallback(text).then(() => resolve());
  });
}

async function playTTSFallback(text: string): Promise<void> {
  if (typeof window === "undefined") return;
  
  // CRITICAL: DO NOT strip diacritics, so that Google Translate speaks the exact Fatha/Kasra/Damma vowel!
  const targetText = text.trim();
  
  return new Promise((resolve, reject) => {
    try {
      const proxyUrl = `/api/tts?text=${encodeURIComponent(targetText)}`;
      const audio = new Audio(proxyUrl);
      audio.setAttribute("data-arabic", targetText);
      
      audio.onplay = () => {
        handleAudioStart();
        const dur = audio.duration && !isNaN(audio.duration) && audio.duration > 0
          ? audio.duration * 1000
          : Math.max(2000, targetText.length * 150);
        pauseASRForAudio(dur);
      };

      audio.onended = () => {
        handleAudioEnd();
        resolve();
      };

      audio.onerror = async (err) => {
        handleAudioEnd();
        reject(err);
      };

      audio.play().then(() => {
        // Play started
      }).catch((err) => {
        handleAudioEnd();
        reject(err);
      });
    } catch (e) {
      handleAudioEnd();
      reject(e);
    }
  });
}

/**
 * Plays a clean synthesizer alert chime using Web Audio API oscillators.
 */
export function playCorrectionChime(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    // Play a soft double-harmonic note
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 note
    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (err) {
    console.warn("Could not play correction oscillator chime:", err);
  }
}

/**
 * Plays a soft high-pitched success chime using Web Audio API oscillators.
 */
export function playSuccessChime(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    // Short high-pitched double-beep or clean ping sound
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (err) {
    console.warn("Could not play success oscillator chime:", err);
  }
}
