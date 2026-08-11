"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "../UI/Logo";
import { subscribeEmail } from "@/lib/email/subscribe";

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

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes("@")) return;

    let nameToSave = "Tilawah Student";
    const savedUser = localStorage.getItem("tilawa_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.username) nameToSave = parsed.username;
      } catch {
        // ignore
      }
    }

    const result = await subscribeEmail(emailInput.trim(), "footer", nameToSave);
    if (!result.success) {
      alert(result.message);
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("tilawah_email_captured", "true");
      localStorage.setItem("tilawah_user_email", emailInput.trim());

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
          <div className="text-xs text-zinc-500 mt-2">
            <span>Contact: </span>
            <a href="mailto:tilawah.site@gmail.com" className="hover:text-[#c8993c] transition-colors font-semibold">
              tilawah.site@gmail.com
            </a>
          </div>
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
                className="h-10 px-3 bg-[#c8993c] text-white text-[11px] font-black uppercase tracking-wider rounded-lg hover:bg-gold-light transition-all cursor-pointer"
              >
                Save
              </button>
            </form>
          )}

          <p className="text-[10px] text-zinc-500 leading-normal max-w-xs mt-1">
            Uthmani script verified. Sheikh Al-Husary audio examples.
          </p>

          <div className="flex gap-4 mt-3 text-zinc-500">
            <a href="https://www.instagram.com/tilawah.site/?hl=en" target="_blank" rel="noopener noreferrer" className="hover:text-[#c8993c] transition-colors" title="Instagram">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051c-.058 1.28-.072 1.688-.072 4.949s.014 3.67.072 4.951c.2 4.359 2.617 6.78 6.979 6.98 1.281.058 1.689.072 4.948.072 3.261 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.951 0-3.26-.014-3.668-.073-4.949C23.73 2.678 21.32.272 16.96.072 15.681.014 15.272 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
              </svg>
            </a>
            <a href="https://www.linkedin.com/company/tilawah/" target="_blank" rel="noopener noreferrer" className="hover:text-[#c8993c] transition-colors" title="LinkedIn">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
          </div>
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
