"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { SurahMetadata } from "../../types";

interface NewSurahModalProps {
  surah: SurahMetadata | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function NewSurahModal({
  surah,
  isOpen,
  onClose,
}: NewSurahModalProps) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !surah) return null;

  const handleStartReciting = () => {
    onClose();
    router.push(`/recite/${surah.id}`);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-[#1a1208]/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-[#faf6ee] rounded-3xl border-2 border-[#c8993c]/50 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Top Banner */}
            <div className="bg-gradient-to-r from-[#174e3d] via-[#1e5e4a] to-[#256c56] text-white px-6 py-6 text-center relative border-b border-[#c8993c]/30">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center justify-center transition-colors border border-white/20"
                aria-label="Close"
              >
                ✕
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c8993c]/20 border border-[#e8c96a]/40 text-[#e8c96a] text-xs font-black uppercase tracking-wider mb-3">
                <span className="w-2 h-2 rounded-full bg-[#e8c96a] animate-ping inline-block"></span>
                <span>✨ New Surah Available</span>
              </div>

              <h2 className="text-3xl font-amiri font-bold text-[#faf6ee] leading-tight">
                {surah.name}
              </h2>
              <p className="text-sm font-semibold tracking-wider text-[#e8c96a] uppercase mt-1">
                Surah {surah.englishName}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-4 text-center">
              <div className="bg-white/80 dark:bg-zinc-800/20 p-4 rounded-2xl border border-[#c8993c]/20 shadow-sm flex items-center justify-around">
                <div>
                  <span className="text-xs text-zinc-500 font-bold block uppercase tracking-wider">Surah No.</span>
                  <span className="text-xl font-black text-[#1e5e4a]">{surah.number}</span>
                </div>
                <div className="w-px h-8 bg-[#c8993c]/30"></div>
                <div>
                  <span className="text-xs text-zinc-500 font-bold block uppercase tracking-wider">Total Ayat</span>
                  <span className="text-xl font-black text-[#1e5e4a]">{surah.totalAyat}</span>
                </div>
                <div className="w-px h-8 bg-[#c8993c]/30"></div>
                <div>
                  <span className="text-xs text-zinc-500 font-bold block uppercase tracking-wider">Tajweed Check</span>
                  <span className="text-xl font-black text-emerald-600">Active</span>
                </div>
              </div>

              <p className="text-sm text-zinc-700 leading-relaxed font-medium">
                {surah.englishName} is now ready for practice with real-time speech verification, Qari recitation, and automatic Tajweed guidance.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 mt-2">
                <button
                  onClick={handleStartReciting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#1e5e4a] to-[#256c56] hover:from-[#174e3d] hover:to-[#1e5e4a] text-white font-black text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-[#c8993c]/40"
                >
                  <span>Start Reciting Now</span>
                  <span>➔</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-2xl text-zinc-500 hover:text-zinc-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

