"use client";

import React, { useEffect } from "react";
import { useRecitationStore } from "../../lib/store/recitationStore";
import { useContinuousASR } from "../../lib/speech/useContinuousASR";

export default function ContinuousListener({ micCheckOpen = false }: { micCheckOpen?: boolean }) {
  const storeListening = useRecitationStore((state) => state.isListening);
  const setListening = useRecitationStore((state) => state.setListening);

  // Suspend actual listening loop while the Mic Check modal is active
  const isListening = micCheckOpen ? false : storeListening;

  // Bind the always-on speech recognition loop hook
  const { browserSupport } = useContinuousASR(isListening);

  useEffect(() => {
    // Auto-request microphone permission on mount to open listening continuously
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({
        audio: true
      })
        .then(() => {
          setListening(true);
        })
        .catch((err) => {
          console.warn("Microphone permission denied by user:", err);
        });
    }
  }, [setListening]);

  if (!browserSupport) {
    return (
      <div className="p-3 bg-red-100 dark:bg-red-950/20 border-l-4 border-red-500 rounded text-red-700 dark:text-red-300 text-[11px] leading-relaxed">
        <strong>⚠️ Audio Recording Not Supported</strong>
        <p className="mt-1">
          Your browser does not support continuous audio recording features. Please ensure your microphone is enabled or try a modern browser.
        </p>
      </div>
    );
  }

  return null;
}
