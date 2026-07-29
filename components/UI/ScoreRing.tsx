import React from "react";

interface ScoreRingProps {
  score: number | null;
}

export default function ScoreRing({ score }: ScoreRingProps) {
  const circumference = 245;
  const percentage = score !== null ? Math.min(100, Math.max(0, score)) : 0;
  const offset = circumference - (circumference * percentage) / 100;

  const scoreVal = score !== null ? score : 0;
  let strokeColor = "#8b1a1a"; // ruby default
  if (scoreVal > 80) {
    strokeColor = "#c8993c"; // gold
  } else if (scoreVal >= 50) {
    strokeColor = "#1e5e4a"; // emerald
  }

  return (
    <div className="flex justify-center mb-4">
      <div className="relative w-[90px] h-[90px]">
        <svg className="-rotate-90 w-[90px] h-[90px]" width="90" height="90" viewBox="0 0 90 90">
          <circle
            className="fill-none stroke-parchment-dark dark:stroke-zinc-800 stroke-[6px]"
            cx="45"
            cy="45"
            r="39"
          />
          <circle
            className="fill-none stroke-[6px]"
            style={{
              stroke: strokeColor,
              transition: "stroke-dashoffset 0.7s ease-out, stroke 0.5s ease"
            }}
            cx="45"
            cy="45"
            r="39"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center font-bold text-2xl text-emerald dark:text-emerald-light leading-none">
          <span>{score !== null ? `${score}%` : "-"}</span>
          <small className="text-[10px] text-gold dark:text-gold-light mt-1 tracking-wider uppercase font-semibold">
            SCORE
          </small>
        </div>
      </div>
    </div>
  );
}
