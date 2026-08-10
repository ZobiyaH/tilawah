"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "../UI/Logo";

export default function Footer() {
  const [emailCaptured, setEmailCaptured] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");

  const loadStatus = () => {
    if (typeof window !== "undefined") {
      const captured = localStorage.getItem("tilawah_email_captured") === "true";
      const savedEmail = localStorage.getItem("tilawah_user_email") || "";
      setEmailCaptured(captured);
      setUserEmail(savedEmail);
    }
  };

  useEffect(() => {
    loadStatus();
    window.addEventListener("tilawa-user-updated", loadStatus);
    return () => {
      window.removeEventListener("tilawa-user-updated", loadStatus);
    };
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes("@")) return;

    if (typeof window !== "undefined") {
      localStorage.setItem("tilawah_email_captured", "true");
      localStorage.setItem("tilawah_user_email", emailInput.trim());

      const savedUser = localStorage.getItem("tilawa_user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          parsed.email = emailInput.trim();
          localStorage.setItem("tilawa_user", JSON.stringify(parsed));
        } catch {
          // ignore
        }
      }

      window.dispatchEvent(new CustomEvent("tilawa-user-updated"));
    }
  };

  return (
    <footer className="bg-[#101714] text-zinc-400 border-t border-white/5 pt-12 pb-28 md:pb-12 px-6 w-full select-none mt-auto">
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

        <div className="flex flex-col gap-3">
          <span className="text-white text-xs font-bold uppercase tracking-widest">Save your learnings</span>
          
          {emailCaptured ? (
            <p className="text-xs text-emerald-light font-bold">
              ✓ Saved under: <span className="underline decoration-wavy">{userEmail}</span>
            </p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2 max-w-xs mt-1">
              <input
                type="email"
                required
                placeholder="Enter email to save progress"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="flex-grow h-10 px-3 border border-white/10 rounded-lg text-xs bg-white/5 text-zinc-300 font-semibold focus:outline-none focus:border-gold focus:bg-white/10"
              />
              <button
                type="submit"
                className="h-10 px-3 bg-[#c8993c] text-white text-[11px] font-black uppercase tracking-wider rounded-lg hover:bg-gold-light transition-all"
              >
                Save
              </button>
            </form>
          )}

          <p className="text-[10px] text-zinc-500 leading-normal max-w-xs mt-1">
            Uthmani script verified. Sheikh Al-Husary audio examples.
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
