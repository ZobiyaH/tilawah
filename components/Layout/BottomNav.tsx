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

  const navItems = [
    { href: "/", label: "Home", icon: "🏠", isActive: pathname === "/" },
    { href: "/learn", label: "Learn", icon: "📚", isActive: pathname.startsWith("/learn") },
    { href: "/recite", label: "Recite", icon: "🎙", isActive: pathname.startsWith("/recite") },
    { href: "/progress", label: "Progress", icon: "📊", isActive: pathname.startsWith("/progress") },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[64px] bg-[#faf6ee]/95 dark:bg-[#0f1a14]/95 backdrop-blur-md border-t border-[#c8993c]/25 flex justify-around items-center z-50 md:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-col items-center gap-0.5 justify-center w-full h-full text-center transition-all select-none ${
            item.isActive
              ? "text-[#1e5e4a] dark:text-[#3ca383] font-extrabold scale-105"
              : "text-[#6b7280] dark:text-zinc-500 hover:text-[#1e5e4a] dark:hover:text-emerald-light"
          }`}
        >
          <span className="text-[18px] leading-none">{item.icon}</span>
          <span className="text-[10px] uppercase tracking-wider font-extrabold">{item.label}</span>
          {item.isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#1e5e4a] dark:bg-[#3ca383] -mt-0.5" />
          )}
        </Link>
      ))}
    </nav>
  );
}
