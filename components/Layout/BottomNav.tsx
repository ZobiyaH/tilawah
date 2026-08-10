"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface BottomNavProps {
  onOpenSettings?: () => void;
}

export default function BottomNav(props: BottomNavProps = {}) {
  const pathname = usePathname();

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (props.onOpenSettings) {
      props.onOpenSettings();
    } else {
      window.dispatchEvent(new CustomEvent("open-settings-drawer"));
    }
  };

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
      <button
        onClick={handleSettingsClick}
        className="flex flex-col items-center gap-0.5 justify-center w-full h-full text-center transition-all select-none text-[#6b7280] dark:text-zinc-500 hover:text-[#1e5e4a] dark:hover:text-emerald-light cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
        <span className="text-[10px] uppercase tracking-wider font-extrabold">Settings</span>
      </button>
    </nav>
  );
}
