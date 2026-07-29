"use client";

import React from "react";
import { useRecitationStore } from "../../lib/store/recitationStore";
import clsx from "clsx";

export default function ModeBar() {
  const mode = useRecitationStore((state) => state.mode);
  const setMode = useRecitationStore((state) => state.setMode);

  return (
    <div className="flex flex-col gap-3">
      {/* Mode Tabs */}
      <div className="flex bg-parchment-dark dark:bg-zinc-800/40 p-1.5 rounded-xl border border-gold/20 select-none">
        <button
          type="button"
          onClick={() => setMode("guided")}
          className={clsx(
            "flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all outline-none",
            mode === "guided"
              ? "bg-emerald text-white shadow-sm"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          )}
        >
          Guided Mode
        </button>
        <button
          type="button"
          onClick={() => setMode("free")}
          className={clsx(
            "flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all outline-none",
            mode === "free"
              ? "bg-emerald text-white shadow-sm"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          )}
        >
          Free Practice
        </button>
        <button
          type="button"
          onClick={() => setMode("hardcopy")}
          className={clsx(
            "flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all outline-none",
            mode === "hardcopy"
              ? "bg-emerald text-white shadow-sm"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          )}
        >
          Hardcopy Mode
        </button>
      </div>

      {/* Description Info Banner */}
      <div className="bg-gold-pale/50 dark:bg-zinc-800/20 border border-gold/25 rounded-xl p-4 text-xs leading-relaxed transition-colors">
        {mode === "guided" && (
          <p>
            <strong>ℹ️ Guided Mode:</strong> The app tracks your recitation word-by-word. Pronunciation mistakes trigger instant pauses, text corrections, and spoken audio guides.
          </p>
        )}
        {mode === "free" && (
          <p>
            <strong>🕊 Free Practice Mode:</strong> Read freely at your own speed. Speech mistakes are highlighted on-screen, but you will not be locked or interrupted.
          </p>
        )}
        {mode === "hardcopy" && (
          <p>
            <strong>📖 Hardcopy Mode:</strong> Read directly from your physical paper Quran. The app hides text display and listens in the background to log accuracy metrics.
          </p>
        )}
      </div>
    </div>
  );
}
