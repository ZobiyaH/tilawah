"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRecitationStore } from "../../lib/store/recitationStore";
import CorrectionCard from "./CorrectionCard";

export default function CorrectionOverlay() {
  const correctionOverlayOpen = useRecitationStore((state) => state.correctionOverlayOpen);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    if (correctionOverlayOpen) {
      setMinimized(false);
    }
  }, [correctionOverlayOpen]);

  useEffect(() => {
    if (minimized && correctionOverlayOpen) {
      const timer = setTimeout(() => {
        setMinimized(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [minimized, correctionOverlayOpen]);

  return (
    <AnimatePresence>
      {correctionOverlayOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: minimized ? "90%" : "0%" }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="fixed bottom-0 left-0 right-0 h-[60vh] bg-white dark:bg-zinc-950 border-t border-gold/30 rounded-t-[24px] shadow-[0_-8px_30px_rgba(0,0,0,0.15)] z-[999] flex flex-col overflow-hidden"
        >
          {/* Drag / Swipe down handle to toggle minimize */}
          <div
            onClick={() => setMinimized(!minimized)}
            className="w-full h-8 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            <div className="w-16 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full"></div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1 select-none">
              {minimized ? "Tap to show details ▲" : "Tap or Swipe down to hide ▼"}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-24">
            <div className="max-w-lg mx-auto w-full">
              <CorrectionCard />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
