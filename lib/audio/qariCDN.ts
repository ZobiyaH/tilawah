import { getWordAudioURL } from './islamicNetworkCDN';

export function getWordAudio(surah: number, ayah: number, word: number): string {
  return getWordAudioURL(surah, ayah, word);
}

// Preload audio silently in background
export function preloadAudio(url: string): void {
  if (typeof window === "undefined" || !url) return;
  const audio = new Audio();
  audio.preload = 'auto';
  audio.src = url;
  // Just creating it starts the download
  // We do not play it yet
}
