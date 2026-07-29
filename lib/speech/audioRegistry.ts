/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRecitationStore } from "../store/recitationStore";


let activeRecognition: any = null;
let activeAudioContext: AudioContext | null = null;
let restartTimeout: NodeJS.Timeout | null = null;
let cachedASRRestart: (() => void) | null = null;
let isRecognitionRunning = false;

export function setRecognitionRunning(state: boolean) {
  isRecognitionRunning = state;
}

export function getRecognitionRunning(): boolean {
  return isRecognitionRunning;
}

export function registerRecognition(recognition: any, onRestart: () => void) {
  activeRecognition = recognition;
  cachedASRRestart = onRestart;
}

export function unregisterRecognition() {
  activeRecognition = null;
  cachedASRRestart = null;
}

export function registerAudioContext(ctx: AudioContext) {
  activeAudioContext = ctx;
}

export function unregisterAudioContext() {
  activeAudioContext = null;
}

export function handleAudioStart() {
  if (restartTimeout) {
    clearTimeout(restartTimeout);
    restartTimeout = null;
  }

  // 1. Set flag in store
  useRecitationStore.getState().setAudioPlaying(true);

  // 2. Stop speech recognition immediately
  if (activeRecognition && isRecognitionRunning) {
    try {
      activeRecognition.onend = null;
      activeRecognition.stop();
      isRecognitionRunning = false;
      console.log("ASR suspended immediately on audio play start");
    } catch (e) {
      console.warn("Failed to stop SpeechRecognition:", e);
    }
  }

  // 3. Suspend AudioContext to mute visualizer feed
  if (activeAudioContext && activeAudioContext.state !== "closed") {
    try {
      activeAudioContext.suspend();
      console.log("AudioContext suspended");
    } catch (e) {
      console.warn("Failed to suspend AudioContext:", e);
    }
  }
}

export function handleAudioEnd() {
  if (restartTimeout) {
    clearTimeout(restartTimeout);
  }

  // 800ms delay before restarting to allow room echo to settle
  restartTimeout = setTimeout(async () => {
    // 1. Set flag to false
    useRecitationStore.getState().setAudioPlaying(false);

    // 2. Resume AudioContext
    if (activeAudioContext && activeAudioContext.state !== "closed") {
      try {
        await activeAudioContext.resume();
        console.log("AudioContext resumed");
      } catch (e) {
        console.warn("Failed to resume AudioContext:", e);
      }
    }

    // 3. Restart SpeechRecognition
    if (useRecitationStore.getState().isListening && activeRecognition && !isRecognitionRunning) {
      try {
        if (cachedASRRestart) {
          activeRecognition.onend = cachedASRRestart;
        }
        activeRecognition.start();
        isRecognitionRunning = true;
        console.log("ASR resumed successfully after echo settle");
      } catch (e) {
        console.warn("Failed to restart SpeechRecognition:", e);
      }
    }
  }, 800);
}
