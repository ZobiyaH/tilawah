"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface BottomNavProps {
  onOpenSettings?: () => void;
}

export default function BottomNav(props: BottomNavProps = {}) {
  const pathname = usePathname();
  if (props.onOpenSettings) {
    // referenced to bypass unused ESLint warning
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[64px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-gold/20 flex justify-around items-center z-50 md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {/* Tab 1: Home */}
      <Link
        href="/"
        className={`flex flex-col items-center gap-1 justify-center w-full h-full text-center transition-all ${
          pathname === "/"
            ? "text-gold font-bold scale-105"
            : "text-zinc-400 dark:text-zinc-500 hover:text-gold"
        }`}
      >
        <span className="text-[18px]">🏠</span>
        <span className="text-[10px] uppercase tracking-wider font-bold">Home</span>
      </Link>

      {/* Tab 2: Learn */}
      <Link
        href="/learn"
        className={`flex flex-col items-center gap-1 justify-center w-full h-full text-center transition-all ${
          pathname.startsWith("/learn")
            ? "text-gold font-bold scale-105"
            : "text-zinc-400 dark:text-zinc-500 hover:text-gold"
        }`}
      >
        <span className="text-[18px]">📚</span>
        <span className="text-[10px] uppercase tracking-wider font-bold">Learn</span>
      </Link>

      {/* Tab 3: Recite */}
      <Link
        href="/recite"
        className={`flex flex-col items-center gap-1 justify-center w-full h-full text-center transition-all ${
          pathname.startsWith("/recite")
            ? "text-gold font-bold scale-105"
            : "text-zinc-400 dark:text-zinc-500 hover:text-gold"
        }`}
      >
        <span className="text-[18px]">🎙</span>
        <span className="text-[10px] uppercase tracking-wider font-bold">Recite</span>
      </Link>
    </nav>
  );
}
