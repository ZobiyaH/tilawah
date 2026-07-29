"use client";

import React from "react";
import { useRecitationStore } from "../../lib/store/recitationStore";
import { useTheme } from "next-themes";

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const fontScale = useRecitationStore((state) => state.fontScale);
  const setFontScale = useRecitationStore((state) => state.setFontScale);

  const showTransliteration = useRecitationStore((state) => state.showTransliteration);
  const toggleTransliteration = useRecitationStore((state) => state.toggleTransliteration);

  const showTranslation = useRecitationStore((state) => state.showTranslation);
  const toggleTranslation = useRecitationStore((state) => state.toggleTranslation);

  const showTajweedColors = useRecitationStore((state) => state.showTajweedColors);
  const toggleTajweedColors = useRecitationStore((state) => state.toggleTajweedColors);

  const { theme, setTheme } = useTheme();

  const micGain = useRecitationStore((state) => state.micGain);
  const setMicGain = useRecitationStore((state) => state.setMicGain);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-parchment dark:bg-zinc-900 border-l border-gold/30 text-ink shadow-2xl flex flex-col h-full transform transition-all duration-300">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-gold/20 flex justify-between items-center bg-parchment-dark dark:bg-zinc-800/40">
            <h3 className="font-amiri text-lg font-bold text-emerald dark:text-emerald-light">
              ⚙️ الإعدادات · Configurations
            </h3>
            <button 
              type="button" 
              onClick={onClose}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-500 outline-none"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
            
            {/* Font Scale Slider */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] tracking-wider uppercase font-bold text-zinc-400 dark:text-zinc-500">
                Quran Font Scale ({fontScale}px)
              </label>
              <input
                type="range"
                min="26"
                max="56"
                value={fontScale}
                onChange={(e) => setFontScale(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-parchment-dark dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-gold outline-none"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-semibold mt-1">
                <span>Small (26px)</span>
                <span>Large (56px)</span>
              </div>
            </div>
            
            {/* Mic Sensitivity Slider */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] tracking-wider uppercase font-bold text-zinc-400 dark:text-zinc-500">
                Mic Sensitivity ({micGain.toFixed(1)}x)
              </label>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.5"
                value={micGain}
                onChange={(e) => setMicGain(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-parchment-dark dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-gold outline-none"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-semibold mt-1">
                <span>Normal (1.0x)</span>
                <span>Maximum (5.0x)</span>
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="flex flex-col gap-4">
              
              {/* Transliteration */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-gold/10 bg-white/50 dark:bg-zinc-800/20">
                <div>
                  <span className="text-sm font-bold block">Transliteration</span>
                  <span className="text-[10px] text-zinc-400">Read Arabic words in Latin characters</span>
                </div>
                <input
                  type="checkbox"
                  checked={showTransliteration}
                  onChange={toggleTransliteration}
                  className="w-9 h-5 rounded-full bg-parchment-dark dark:bg-zinc-800 checked:bg-gold appearance-none relative cursor-pointer outline-none transition-colors before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition-transform"
                />
              </div>

              {/* Translation */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-gold/10 bg-white/50 dark:bg-zinc-800/20">
                <div>
                  <span className="text-sm font-bold block">Translation</span>
                  <span className="text-[10px] text-zinc-400">English Saheeh International translation</span>
                </div>
                <input
                  type="checkbox"
                  checked={showTranslation}
                  onChange={toggleTranslation}
                  className="w-9 h-5 rounded-full bg-parchment-dark dark:bg-zinc-800 checked:bg-gold appearance-none relative cursor-pointer outline-none transition-colors before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition-transform"
                />
              </div>

              {/* Tajweed Underlining */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-gold/10 bg-white/50 dark:bg-zinc-800/20">
                <div>
                  <span className="text-sm font-bold block">Tajweed Coloring</span>
                  <span className="text-[10px] text-zinc-400">Color-coded underlining guides for beginners</span>
                </div>
                <input
                  type="checkbox"
                  checked={showTajweedColors}
                  onChange={toggleTajweedColors}
                  className="w-9 h-5 rounded-full bg-parchment-dark dark:bg-zinc-800 checked:bg-gold appearance-none relative cursor-pointer outline-none transition-colors before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition-transform"
                />
              </div>

              {/* Dark Mode */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-gold/10 bg-white/50 dark:bg-zinc-800/20">
                <div>
                  <span className="text-sm font-bold block">Dark Mode</span>
                  <span className="text-[10px] text-zinc-400">Toggle light / dark aesthetics</span>
                </div>
                <input
                  type="checkbox"
                  checked={theme === "dark"}
                  onChange={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="w-9 h-5 rounded-full bg-parchment-dark dark:bg-zinc-800 checked:bg-gold appearance-none relative cursor-pointer outline-none transition-colors before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition-transform"
                />
              </div>

            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gold/20 text-center bg-parchment-dark dark:bg-zinc-800/40">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              Tilawa Recitation Checker v1.0
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
