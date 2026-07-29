"use client";

import React from "react";
import { useRecitationStore } from "../../lib/store/recitationStore";

export default function LiveTranscript() {
  const liveTranscript = useRecitationStore((state) => state.liveTranscript);
  const isListening = useRecitationStore((state) => state.isListening);

  return (
    <div className="relative bg-parchment-dark dark:bg-zinc-800/40 border border-gold/15 rounded-lg p-3 min-h-[64px] font-amiri text-lg text-right text-ink dark:text-foreground mt-4 leading-relaxed transition-colors">
      <span className="absolute -top-[9px] right-3 bg-parchment dark:bg-zinc-900 px-1.5 text-[9px] tracking-widest text-gold font-lato uppercase font-bold select-none transition-colors">
        {isListening ? "🎙 Reciting" : "🎙 Stopped"}
      </span>
      <div className="pt-1.5 italic text-zinc-600 dark:text-zinc-300">
        {liveTranscript}
      </div>
    </div>
  );
}
