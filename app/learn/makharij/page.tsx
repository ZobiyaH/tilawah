"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Header from "@/components/Layout/Header";
import BottomNav from "@/components/Layout/BottomNav";
import SettingsDrawer from "@/components/UI/SettingsDrawer";
import MakhrajDiagram, { MakhrajZone } from "@/components/UI/MakhrajDiagram";

type MakhrajPoint = "jawf" | "halq_deep" | "halq_mid" | "halq_top" | "lisan_back" | "lisan_mid" | "lisan_side" | "lisan_tip" | "lips" | "nasal";

interface MakhrajDetail {
  id: MakhrajPoint;
  zone: MakhrajZone;
  title: string;
  arabicTitle: string;
  explanation: string;
  letters: string[];
}

const MAKHARIJ_DATA: MakhrajDetail[] = [
  {
    id: "jawf",
    zone: "empty_space",
    title: "Al-Jawf (Oral Cavity)",
    arabicTitle: "الجوف",
    explanation: "The empty space inside the mouth and throat. It is the source of the three prolongation (Madd) letters when they are silent (sakin) and preceded by their matching vowel.",
    letters: ["ا (alef)", "و (waw sakin)", "ي (ya sakin)"],
  },
  {
    id: "halq_deep",
    zone: "deep_throat",
    title: "Al-Halq: Deep Throat",
    arabicTitle: "أقصى الحلق",
    explanation: "The deepest part of the throat, closest to the vocal cords. Pronounced with a light, clear sound.",
    letters: ["ء (Hamzah)", "هـ (Ha)"],
  },
  {
    id: "halq_mid",
    zone: "mid_throat",
    title: "Al-Halq: Mid Throat",
    arabicTitle: "وسط الحلق",
    explanation: "The middle part of the throat, around the epiglottis. Requires a gentle constriction of the throat.",
    letters: ["ع (Ayn)", "ح (Haa)"],
  },
  {
    id: "halq_top",
    zone: "upper_throat",
    title: "Al-Halq: Upper Throat",
    arabicTitle: "أدنى الحلق",
    explanation: "The top part of the throat, closest to the mouth. Pronounced with a scraping sound.",
    letters: ["غ (Ghayn)", "خ (Khaa)"],
  },
  {
    id: "lisan_back",
    zone: "back_tongue",
    title: "Al-Lisan: Back of Tongue",
    arabicTitle: "أقصى اللسان",
    explanation: "The back of the tongue pressing against the soft palate (Qaf) or slightly forward against the hard palate (Kaf).",
    letters: ["ق (Qaf)", "ك (Kaf)"],
  },
  {
    id: "lisan_mid",
    zone: "mid_tongue",
    title: "Al-Lisan: Middle of Tongue",
    arabicTitle: "وسط اللسان",
    explanation: "The middle of the tongue pressing against the roof of the mouth.",
    letters: ["ج (Jeem)", "ش (Sheen)", "ي (Ya)"],
  },
  {
    id: "lisan_side",
    zone: "side_tongue",
    title: "Al-Lisan: Side of Tongue",
    arabicTitle: "حافة اللسان",
    explanation: "The left or right side of the tongue touching the upper molars. Pronounced heavily.",
    letters: ["ض (Daad)"],
  },
  {
    id: "lisan_tip",
    zone: "tongue_tip_teeth_base",
    title: "Al-Lisan: Tip of Tongue",
    arabicTitle: "طرف اللسان",
    explanation: "The tip of the tongue touching the palate, upper teeth, or the edges of the front teeth. This is the largest category.",
    letters: ["ل", "ن", "ر", "ط", "د", "ت", "ص", "ز", "س", "ظ", "ذ", "ث"],
  },
  {
    id: "lips",
    zone: "lips_closed",
    title: "Ash-Shafatain (Lips)",
    arabicTitle: "الشفتان",
    explanation: "Formed by closing, wetting, or placing the upper front teeth on the lower lip.",
    letters: ["ف (Fa)", "و (Waw)", "Baa (ب)", "م (Meem)"],
  },
  {
    id: "nasal",
    zone: "nasal_cavity",
    title: "Al-Khayshoom (Nasal Cavity)",
    arabicTitle: "الخيشوم",
    explanation: "The nasal passage. This is the source of the Ghunna (nasal sound) when pronouncing a doubled Noon or Meem, or during Tajweed rules like Ikhfa and Idgham.",
    letters: ["نّ (Noon Sakin/Tanwin)", "مّ (Meem Sakin)"],
  },
];

export default function MakharijPage() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<MakhrajPoint>("jawf");

  const currentDetail = MAKHARIJ_DATA.find((m) => m.id === selectedPoint) || MAKHARIJ_DATA[0];

  return (
    <div className="min-h-screen flex flex-col pb-36 md:pb-16 relative bg-[#faf6ee] dark:bg-zinc-950 text-[#1a1208] dark:text-zinc-100 transition-colors duration-200">
      <Header />
      <SettingsDrawer isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 mt-6 flex flex-col gap-6 relative z-10">
        
        {/* Navigation & Title */}
        <section className="flex flex-col gap-2">
          <Link href="/learn" className="text-[#c8993c] font-bold text-xs uppercase tracking-wider hover:underline w-max">
            Back to Learning Tracks
          </Link>
          <div className="flex justify-between items-center mt-2">
            <h2 className="font-amiri text-2xl font-bold text-[#1e5e4a]">
              Makharij Visualizer · مخارج الحروف
            </h2>
            <span className="px-3 py-1 rounded-full border border-[#c8993c]/30 bg-[#fdf8f0] text-[#c8993c] text-[9px] font-bold uppercase tracking-wider font-lato">
              10 Points
            </span>
          </div>
        </section>

        {/* Layout: Sidebar and Diagram */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left/Diagram Column (4 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <MakhrajDiagram zone={currentDetail.zone} description={currentDetail.explanation} className="w-full" />
            <p className="text-[10px] text-zinc-500 text-center leading-relaxed font-semibold italic">
              Tap any articulation point in the menu to view its anatomical tongue position diagram.
            </p>
          </div>

          {/* Right/Menu Column (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Buttons list */}
            <div className="flex flex-wrap gap-2.5">
              {MAKHARIJ_DATA.map((item) => {
                const active = item.id === selectedPoint;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedPoint(item.id)}
                    className={`px-4 py-2 border rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all duration-200 ${
                      active
                        ? "bg-emerald text-white border-emerald shadow-md shadow-emerald/10"
                        : "border-gold/20 hover:border-gold/60 bg-white/50 dark:bg-zinc-800/10 text-zinc-600 dark:text-zinc-300"
                    }`}
                  >
                    {item.title.split(":")[1] || item.title.split("(")[0]}
                  </button>
                );
              })}
            </div>

            {/* Point Detail Card */}
            <motion.div
              key={selectedPoint}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="card p-6 border-gold/30 bg-white/80 dark:bg-zinc-900/30 flex flex-col gap-4"
            >
              <div>
                <h3 className="font-amiri text-2xl font-bold text-ink">
                  {currentDetail.title} · <span className="text-gold font-normal">{currentDetail.arabicTitle}</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-wider font-bold">
                  Articulation Point Definition
                </p>
              </div>

              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {currentDetail.explanation}
              </p>

              <div className="border-t border-gold/15 pt-4">
                <h4 className="font-bold text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-3">
                  Associated Letters · حروف المخرج
                </h4>
                <div className="flex flex-wrap gap-3">
                  {currentDetail.letters.map((letter, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2 border border-gold/15 bg-parchment dark:bg-zinc-800 rounded-xl text-ink font-amiri text-lg font-bold shadow-sm"
                    >
                      {letter}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

          </div>
        </section>

      </main>

      <BottomNav onOpenSettings={() => setSettingsOpen(true)} />
    </div>
  );
}
