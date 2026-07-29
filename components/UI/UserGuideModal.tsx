import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserGuideModal({ isOpen, onClose }: UserGuideModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const instructions = [
    {
      action: "🔊 Tap any Arabic Word/Letter",
      detail: "Click directly on the Arabic text on the screen to hear the Qari pronounce the correct sound first. Always listen first before you try!"
    },
    {
      action: "🎙️ Turn on the Microphone",
      detail: "Tap the microphone icon at the bottom of the screen to start reciting. Make sure to allow microphone permission when prompted."
    },
    {
      action: "🟢 Recite and Verify",
      detail: "Read the active gold word. If you pronounce it correctly, it turns green and moves forward automatically."
    },
    {
      action: "🔄 Listen & Self-Correct",
      detail: "If you make a mistake, the word turns red and the Qari immediately recites it. Simply repeat it correctly to auto-advance!"
    }
  ];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-[#1a1208]/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg bg-[#faf6ee] rounded-3xl border-2 border-[#c8993c]/40 shadow-2xl flex flex-col max-h-[82vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center bg-[#1e5e4a] text-white px-6 py-4 border-b border-[#c8993c]/35">
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <h2 className="text-lg font-black font-amiri leading-none text-white">How to Practice</h2>
                  <p className="text-[10px] text-[#e8c96a] font-extrabold uppercase tracking-wider mt-1">Hear first · Then try</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center justify-center transition-colors border border-white/20"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {instructions.map((inst, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-[#c8993c]/15 flex flex-col gap-1.5 hover:border-[#1e5e4a]/30 transition-all text-left shadow-sm"
                >
                  <h3 className="font-amiri font-black text-sm text-[#1e5e4a]">{inst.action}</h3>
                  <p className="text-[11px] text-[#6b7280] font-bold leading-relaxed">
                    {inst.detail}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer CTA */}
            <div className="p-5 bg-white border-t border-[#c8993c]/15 flex justify-end">
              <button
                onClick={onClose}
                className="btn-primary w-full h-11 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center rounded-xl shadow-md bg-[#1e5e4a] hover:bg-[#164738] text-white border border-[#1e5e4a]"
              >
                Start Practice
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
