import React from "react";

export type MakhrajPoint =
  | "jawf"          // Oral cavity
  | "halq_deep"      // Deep throat (ء, هـ)
  | "halq_mid"       // Mid throat (ع, ح)
  | "halq_top"       // Upper throat (غ, خ)
  | "lisan_back"     // Back tongue (ق, ك)
  | "lisan_mid"      // Mid tongue (ج, ش, ي)
  | "lisan_side"     // Side tongue (ض)
  | "lisan_tip"      // Tongue tip (ل, ن, ر, ط, د, ت, ص, ز, س, ظ, ذ, ث)
  | "lips"           // Lips (ف, و, ب, م)
  | "nasal"          // Nasal cavity (Ghunna)
  | "none";

interface MakhrajDiagramProps {
  activePoint: MakhrajPoint;
  className?: string;
}

export default function MakhrajDiagram({ activePoint, className = "" }: MakhrajDiagramProps) {
  const isSelected = (point: MakhrajPoint) => activePoint === point;

  return (
    <div className={`relative flex flex-col items-center justify-center p-4 bg-parchment/60 dark:bg-zinc-900/60 rounded-2xl border border-gold/15 shadow-inner ${className}`}>
      <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-4">
        Makhraj Diagram · مخارج الحروف
      </span>

      <svg
        viewBox="0 0 220 220"
        className="w-full max-w-[200px] h-auto text-zinc-400 dark:text-zinc-600 transition-colors"
      >
        <defs>
          <radialGradient id="highlightGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Base Skull Outline (grey/thin) */}
        <path
          d="M 20,40 C 20,20 180,20 180,60 C 180,85 160,95 160,110 C 160,120 170,125 170,135 C 170,150 150,170 140,200"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="opacity-25"
        />

        {/* 2. Nasal Cavity (Khayshoom) */}
        <path
          d="M 90,60 C 110,60 140,55 155,75 C 145,85 130,85 110,80 Z"
          fill={isSelected("nasal") ? "url(#highlightGlow)" : "none"}
          stroke={isSelected("nasal") ? "#10b981" : "currentColor"}
          strokeWidth={isSelected("nasal") ? "3" : "1.5"}
          className={`transition-all duration-300 ${isSelected("nasal") ? "animate-pulse" : "opacity-40"}`}
        />
        {isSelected("nasal") && (
          <text x="110" y="50" className="text-[9px] fill-emerald font-bold font-lato" textAnchor="middle">
            Nasal cavity (Khayshoom)
          </text>
        )}

        {/* 3. Oral Cavity / Empty Space (Al-Jawf) */}
        <path
          d="M 60,110 C 70,90 120,90 140,110 C 120,130 90,130 60,110 Z"
          fill={isSelected("jawf") ? "url(#highlightGlow)" : "none"}
          stroke={isSelected("jawf") ? "#10b981" : "currentColor"}
          strokeWidth={isSelected("jawf") ? "3" : "1.5"}
          className={`transition-all duration-300 ${isSelected("jawf") ? "animate-pulse" : "opacity-40"}`}
        />
        {isSelected("jawf") && (
          <text x="100" y="85" className="text-[9px] fill-emerald font-bold font-lato" textAnchor="middle">
            Empty Space (Jawf)
          </text>
        )}

        {/* 4. Tongue Profile (Al-Lisan) */}
        <path
          d="M 70,140 Q 95,120 125,125 T 140,140 Q 110,150 70,140 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="opacity-40"
        />

        {/* Highlight back of tongue (qaf, kaf) */}
        <circle
          cx="90"
          cy="130"
          r="9"
          fill={isSelected("lisan_back") ? "#10b981" : "none"}
          stroke={isSelected("lisan_back") ? "#d97706" : "none"}
          strokeWidth="2"
          className={isSelected("lisan_back") ? "animate-bounce" : ""}
        />

        {/* Highlight middle of tongue (jeem, sheen, ya) */}
        <circle
          cx="110"
          cy="126"
          r="9"
          fill={isSelected("lisan_mid") ? "#10b981" : "none"}
          stroke={isSelected("lisan_mid") ? "#d97706" : "none"}
          strokeWidth="2"
          className={isSelected("lisan_mid") ? "animate-bounce" : ""}
        />

        {/* Highlight side of tongue (daad) */}
        <ellipse
          cx="105"
          cy="138"
          rx="12"
          ry="6"
          fill={isSelected("lisan_side") ? "#10b981" : "none"}
          stroke={isSelected("lisan_side") ? "#d97706" : "none"}
          strokeWidth="2"
          className={isSelected("lisan_side") ? "animate-pulse" : ""}
        />

        {/* Highlight tongue tip (seen, saad, etc) */}
        <circle
          cx="136"
          cy="134"
          r="9"
          fill={isSelected("lisan_tip") ? "#10b981" : "none"}
          stroke={isSelected("lisan_tip") ? "#d97706" : "none"}
          strokeWidth="2"
          className={isSelected("lisan_tip") ? "animate-bounce" : ""}
        />

        {/* 5. Throat Section (Al-Halq) */}
        <path
          d="M 65,150 Q 60,195 55,210"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          className="opacity-30"
        />
        <path
          d="M 90,152 Q 85,195 80,210"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          className="opacity-30"
        />

        {/* Throat - Top (ghayn, khaa) */}
        <circle
          cx="75"
          cy="160"
          r="8"
          fill={isSelected("halq_top") ? "#10b981" : "none"}
          stroke={isSelected("halq_top") ? "#d97706" : "none"}
          strokeWidth="2"
          className={isSelected("halq_top") ? "animate-pulse" : ""}
        />

        {/* Throat - Mid (ayn, haa) */}
        <circle
          cx="72"
          cy="180"
          r="8"
          fill={isSelected("halq_mid") ? "#10b981" : "none"}
          stroke={isSelected("halq_mid") ? "#d97706" : "none"}
          strokeWidth="2"
          className={isSelected("halq_mid") ? "animate-pulse" : ""}
        />

        {/* Throat - Deep (hamzah, haa) */}
        <circle
          cx="68"
          cy="200"
          r="8"
          fill={isSelected("halq_deep") ? "#10b981" : "none"}
          stroke={isSelected("halq_deep") ? "#d97706" : "none"}
          strokeWidth="2"
          className={isSelected("halq_deep") ? "animate-pulse" : ""}
        />

        {/* 6. Lips (Ash-Shafatain) */}
        {/* Upper Lip */}
        <path
          d="M 152,118 Q 162,118 158,128"
          fill="none"
          stroke={isSelected("lips") ? "#10b981" : "currentColor"}
          strokeWidth={isSelected("lips") ? "4" : "2"}
          className={isSelected("lips") ? "animate-pulse" : "opacity-60"}
        />
        {/* Lower Lip */}
        <path
          d="M 152,142 Q 162,142 155,133"
          fill="none"
          stroke={isSelected("lips") ? "#10b981" : "currentColor"}
          strokeWidth={isSelected("lips") ? "4" : "2"}
          className={isSelected("lips") ? "animate-pulse" : "opacity-60"}
        />
      </svg>

      <div className="mt-4 text-center">
        <span className="text-[10px] font-bold text-emerald dark:text-emerald-light bg-emerald-pale/25 px-3 py-1 rounded-full uppercase tracking-wider">
          {activePoint === "halq_deep" && "Deep Throat · أدنى الحلق"}
          {activePoint === "halq_mid" && "Middle Throat · وسط الحلق"}
          {activePoint === "halq_top" && "Upper Throat · أدنى الحلق"}
          {activePoint === "lisan_back" && "Back of Tongue · أقصى اللسان"}
          {activePoint === "lisan_mid" && "Middle of Tongue · وسط اللسان"}
          {activePoint === "lisan_side" && "Side of Tongue · حافة اللسان"}
          {activePoint === "lisan_tip" && "Tip of Tongue · طرف اللسان"}
          {activePoint === "lips" && "Lips · الشفتان"}
          {activePoint === "jawf" && "Empty Space · الجوف"}
          {activePoint === "nasal" && "Nasal Cavity · الخيشوم"}
          {activePoint === "none" && "Hover to highlight point"}
        </span>
      </div>
    </div>
  );
}
