import React from "react";
import Link from "next/link";
import Logo from "../UI/Logo";

export default function Footer() {
  return (
    <footer className="bg-[#101714] text-zinc-400 border-t border-white/5 py-12 px-6 w-full select-none mt-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col gap-4">
          <Logo variant="horizontal" size="sm" className="opacity-95" />
          <p className="text-xs text-zinc-500 leading-relaxed">
            Recite the Quran correctly.<br />
            Perfect your pronunciation with Qari audio.<br />
            Always authentic, always free.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-white text-xs font-bold uppercase tracking-widest">Navigation</span>
          <div className="flex flex-col gap-1.5 text-sm font-semibold">
            <Link href="/learn" className="hover:text-[#c8993c] transition-colors">Learning Roadmap</Link>
            <Link href="/learn/arabic-letters" className="hover:text-[#c8993c] transition-colors">Arabic Alphabet</Link>
            <Link href="/learn/tajweed" className="hover:text-[#c8993c] transition-colors">Tajweed Rules</Link>
            <Link href="/recite" className="hover:text-[#c8993c] transition-colors">Recitation Checker</Link>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-white text-xs font-bold uppercase tracking-widest">Authentic Source</span>
          <p className="text-xs text-zinc-500 leading-relaxed mt-1">
            Uthmani script verified.<br />
            Sheikh Al-Husary audio examples.<br />
            No logins or paywalls required.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto border-t border-white/5 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-[11px] text-zinc-500 gap-4">
        <span>© 2026 Tilawah. All rights reserved.</span>
        <div className="flex gap-4">
          <Link href="/learn" className="hover:underline">Start Learning</Link>
          <Link href="/recite" className="hover:underline">Recite Now</Link>
        </div>
      </div>
    </footer>
  );
}
