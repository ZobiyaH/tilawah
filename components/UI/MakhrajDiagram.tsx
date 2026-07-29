import React from "react";

export type MakhrajZone =
  | "deep_throat"      // ء, هـ
  | "mid_throat"       // ع, ح
  | "upper_throat"     // غ, خ
  | "back_tongue"      // ق, ك
  | "mid_tongue"       // ج, ش, ي
  | "side_tongue"      // ض
  | "tongue_edge"      // ل
  | "tongue_tip_gums"  // ن, ر
  | "tongue_tip_teeth_base" // ط, د, ت
  | "tongue_tip_teeth_edge" // ظ, ذ, ث
  | "tongue_tip_lower_incisors" // ص, ز, س
  | "lip_lower_teeth"  // ف
  | "lips_closed"      // ب, م
  | "lips_rounded"     // و
  | "nasal_cavity"     // Ghunna
  | "empty_space";     // Jawf Madd

interface MakhrajDiagramProps {
  zone: MakhrajZone;
  letter?: string;
  letterName?: string;
  description?: string;
  className?: string;
}

export default function MakhrajDiagram({
  zone,
  letter = "",
  letterName = "",
  description = "",
  className = "",
}: MakhrajDiagramProps) {
  
  // Highlight coordinates and labels based on zone
  const getZoneConfig = () => {
    switch (zone) {
      case "deep_throat":
        return {
          targetPt: { x: 50, y: 155 },
          label: "Deep Throat (Bottom of Vocal Cords)",
          highlightColor: "#e11d48",
          activePath: "throat_deep",
        };
      case "mid_throat":
        return {
          targetPt: { x: 55, y: 135 },
          label: "Middle Throat (Epiglottis Area)",
          highlightColor: "#e11d48",
          activePath: "throat_mid",
        };
      case "upper_throat":
        return {
          targetPt: { x: 65, y: 115 },
          label: "Upper Throat (Top near Uvula)",
          highlightColor: "#e11d48",
          activePath: "throat_upper",
        };
      case "back_tongue":
        return {
          targetPt: { x: 95, y: 105 },
          label: "Back of Tongue & Soft Palate",
          highlightColor: "#c8993c",
          activePath: "tongue_back",
        };
      case "mid_tongue":
        return {
          targetPt: { x: 125, y: 90 },
          label: "Middle of Tongue & Hard Palate",
          highlightColor: "#c8993c",
          activePath: "tongue_mid",
        };
      case "side_tongue":
        return {
          targetPt: { x: 115, y: 98 },
          label: "Side Edge of Tongue & Upper Molars",
          highlightColor: "#c8993c",
          activePath: "tongue_side",
        };
      case "tongue_edge":
        return {
          targetPt: { x: 140, y: 82 },
          label: "Front Edge of Tongue & Front Palate",
          highlightColor: "#c8993c",
          activePath: "tongue_edge",
        };
      case "tongue_tip_gums":
        return {
          targetPt: { x: 155, y: 78 },
          label: "Tip of Tongue & Upper Gums",
          highlightColor: "#1e5e4a",
          activePath: "tongue_gums",
        };
      case "tongue_tip_teeth_base":
        return {
          targetPt: { x: 165, y: 76 },
          label: "Tip of Tongue & Roots of Upper Teeth",
          highlightColor: "#1e5e4a",
          activePath: "tongue_teeth_base",
        };
      case "tongue_tip_teeth_edge":
        return {
          targetPt: { x: 175, y: 74 },
          label: "Tip of Tongue & Edge of Upper Teeth",
          highlightColor: "#1e5e4a",
          activePath: "tongue_teeth_edge",
        };
      case "tongue_tip_lower_incisors":
        return {
          targetPt: { x: 168, y: 95 },
          label: "Tip of Tongue behind Lower Incisors",
          highlightColor: "#1e5e4a",
          activePath: "tongue_lower_incisors",
        };
      case "lip_lower_teeth":
        return {
          targetPt: { x: 180, y: 85 },
          label: "Inside Lower Lip & Edge of Upper Teeth",
          highlightColor: "#0284c7",
          activePath: "lip_lower",
        };
      case "lips_closed":
        return {
          targetPt: { x: 188, y: 82 },
          label: "Both Lips Pressed Together",
          highlightColor: "#0284c7",
          activePath: "lips_both",
        };
      case "lips_rounded":
        return {
          targetPt: { x: 190, y: 80 },
          label: "Both Lips Circle & Rounded",
          highlightColor: "#0284c7",
          activePath: "lips_round",
        };
      case "nasal_cavity":
        return {
          targetPt: { x: 120, y: 40 },
          label: "Nasal Cavity (Khayshoom / Ghunna)",
          highlightColor: "#9333ea",
          activePath: "nasal",
        };
      default: // empty_space / Jawf
        return {
          targetPt: { x: 100, y: 70 },
          label: "Empty Space of Mouth & Throat (Jawf)",
          highlightColor: "#c8993c",
          activePath: "jawf",
        };
    }
  };

  const config = getZoneConfig();

  return (
    <div className={`flex flex-col items-center gap-3 p-4 bg-[#fdf8f0] border border-[#c8993c]/25 rounded-2xl shadow-sm ${className}`}>
      
      {/* Header Info */}
      <div className="flex items-center justify-between w-full border-b border-[#c8993c]/15 pb-2.5">
        <div className="flex items-center gap-2">
          {letter && (
            <span className="font-amiri text-3xl font-bold text-[#1e5e4a] bg-white px-3 py-1 rounded-xl border border-[#c8993c]/30 shadow-2xs">
              {letter}
            </span>
          )}
          <div className="flex flex-col">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#c8993c]">
              Makhraj (Articulation Point)
            </span>
            <span className="text-sm font-bold text-[#1a1208]">
              {letterName ? `Letter: ${letterName}` : config.label}
            </span>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          Anatomical Visual
        </span>
      </div>

      {/* SVG Mouth & Vocal Tract Diagram */}
      <div className="relative w-full max-w-[340px] aspect-[4/3] bg-white rounded-xl border border-zinc-200 shadow-inner overflow-hidden flex items-center justify-center p-2">
        <svg
          viewBox="0 0 220 180"
          className="w-full h-full select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={config.highlightColor} stopOpacity="0.8" />
              <stop offset="100%" stopColor={config.highlightColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Head Outline */}
          <path
            d="M 30,170 C 10,140 10,60 40,30 C 70,10 140,10 180,30 C 200,45 210,65 210,90 C 210,120 190,140 180,170 Z"
            fill="#faf6ee"
            stroke="#e4e4e7"
            strokeWidth="2"
          />

          {/* Nasal Cavity (Khayshoom) */}
          <path
            d="M 100,50 Q 130,25 160,50 Q 140,60 100,50 Z"
            fill={config.activePath === "nasal" ? "#f3e8ff" : "#f4f4f5"}
            stroke={config.activePath === "nasal" ? "#9333ea" : "#d4d4d8"}
            strokeWidth={config.activePath === "nasal" ? "3" : "1.5"}
          />

          {/* Hard & Soft Palate (Roof of Mouth) */}
          <path
            d="M 70,110 Q 95,75 140,70 Q 165,70 175,75"
            fill="none"
            stroke="#a1a1aa"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Uvula */}
          <path
            d="M 70,110 Q 67,118 72,122"
            fill="none"
            stroke="#a1a1aa"
            strokeWidth="3"
          />

          {/* Upper Teeth & Gums */}
          <path d="M 165,72 L 172,78 L 175,84" fill="none" stroke="#71717a" strokeWidth="4" strokeLinecap="round" />

          {/* Lower Teeth */}
          <path d="M 168,96 L 172,90" fill="none" stroke="#71717a" strokeWidth="3.5" strokeLinecap="round" />

          {/* Throat Wall (Halq) */}
          <path
            d="M 40,165 Q 48,140 55,125 Q 65,115 70,110"
            fill="none"
            stroke={zone.includes("throat") ? "#e11d48" : "#a1a1aa"}
            strokeWidth={zone.includes("throat") ? "4" : "2.5"}
          />

          {/* Vocal Cords at Deep Throat */}
          <line
            x1="45"
            y1="155"
            x2="55"
            y2="155"
            stroke={zone === "deep_throat" ? "#e11d48" : "#71717a"}
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Dynamic Tongue Curve based on active zone */}
          <path
            d={
              config.activePath === "tongue_back"
                ? "M 55,145 Q 75,130 95,95 Q 120,110 160,98 Q 168,96 165,105 Q 110,135 55,145 Z"
                : config.activePath === "tongue_mid"
                ? "M 55,145 Q 75,130 120,78 Q 140,95 160,98 Q 168,96 165,105 Q 110,135 55,145 Z"
                : config.activePath.includes("tongue_gums") || config.activePath.includes("tongue_teeth")
                ? "M 55,145 Q 75,130 110,105 Q 140,82 173,74 Q 175,80 165,105 Q 110,135 55,145 Z"
                : "M 55,145 Q 75,130 110,105 Q 140,100 165,97 Q 168,102 160,110 Q 110,135 55,145 Z"
            }
            fill={zone.includes("tongue") ? "#fde8e8" : "#f4f4f5"}
            stroke={zone.includes("tongue") ? config.highlightColor : "#71717a"}
            strokeWidth="2.5"
          />

          {/* Upper & Lower Lips */}
          {/* Upper Lip */}
          <path d="M 175,70 Q 185,72 188,78" fill="none" stroke="#71717a" strokeWidth="4" strokeLinecap="round" />
          {/* Lower Lip */}
          <path d="M 168,105 Q 182,100 188,88" fill="none" stroke="#71717a" strokeWidth="4" strokeLinecap="round" />

          {/* Target Highlight Pulsing Circle */}
          <circle
            cx={config.targetPt.x}
            cy={config.targetPt.y}
            r="16"
            fill="url(#glowGrad)"
            className="animate-pulse"
          />
          <circle
            cx={config.targetPt.x}
            cy={config.targetPt.y}
            r="6"
            fill={config.highlightColor}
            stroke="#ffffff"
            strokeWidth="2"
          />
        </svg>

        {/* Floating Contact Point Badge */}
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-zinc-200 shadow-2xs text-[10px] font-bold text-[#1e5e4a]">
          📍 {config.label}
        </div>
      </div>

      {/* Description Text */}
      <p className="text-xs text-[#6b7280] font-semibold text-center leading-relaxed max-w-sm px-2">
        {description || `Produce this sound from the ${config.label.toLowerCase()}. Listen to the Qari recitation above to match your voice exact.`}
      </p>
    </div>
  );
}
