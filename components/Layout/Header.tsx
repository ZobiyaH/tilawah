"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import Logo from "../UI/Logo";
import UserGuideModal from "../UI/UserGuideModal";

interface HeaderProps {
  onOpenSettings?: () => void;
  showSettingsBtn?: boolean;
}

export default function Header({ onOpenSettings, showSettingsBtn = false }: HeaderProps = {}) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ username: string; avatar: string } | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("tilawa_user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          // ignore
        }
      } else {
        // Check if completed 5 lessons
        const count = Number(localStorage.getItem("tilawa_completed_count") || "0");
        const prompted = localStorage.getItem("tilawa_prompted_account");
        if (count >= 5 && !prompted) {
          setShowPrompt(true);
        }
      }
    }
  }, [pathname]);

  const handleRegister = () => {
    if (!nameInput.trim()) return;
    const newUser = { username: nameInput.trim(), avatar: "⭐" };
    if (typeof window !== "undefined") {
      localStorage.setItem("tilawa_user", JSON.stringify(newUser));
      localStorage.setItem("tilawa_prompted_account", "done");
    }
    setUser(newUser);
    setShowPrompt(false);
  };

  const handleSkip = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tilawa_prompted_account", "done");
    }
    setShowPrompt(false);
  };

  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setGuideOpen(true);
    window.addEventListener("open-user-guide", handleOpen);
    return () => window.removeEventListener("open-user-guide", handleOpen);
  }, []);

  return (
    <header className="sticky top-0 z-50 py-4 px-6 border-b border-[#c8993c]/20 bg-white/90 backdrop-blur-md transition-all w-full shadow-sm">
      <UserGuideModal isOpen={guideOpen} onClose={() => setGuideOpen(false)} />

      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-3 select-none group">
          <Logo variant="horizontal" size="sm" className="group-hover:scale-105 transition-transform" />
        </Link>

        {/* Right: Desktop Navigation */}
        <nav className="flex items-center gap-2">
          <button
            onClick={() => setGuideOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-extrabold text-[#c8993c] bg-[#faf6ee] border border-[#c8993c]/30 hover:bg-[#c8993c]/15 transition-all flex items-center gap-1.5 shadow-sm"
            title="How to Use Tilawah"
          >
            <span className="hidden sm:inline uppercase tracking-wider">User Guide</span>
          </button>

          <Link
            href="/learn"
            className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
              pathname.startsWith("/learn")
                ? "bg-[#1e5e4a] text-white shadow-sm"
                : "text-[#6b7280] hover:text-[#1e5e4a] hover:bg-[#faf6ee]"
            }`}
          >
            Learn
          </Link>
          <Link
            href="/recite"
            className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
              pathname.startsWith("/recite")
                ? "bg-[#1e5e4a] text-white shadow-sm"
                : "text-[#6b7280] hover:text-[#1e5e4a] hover:bg-[#faf6ee]"
            }`}
          >
            Recite
          </Link>
          <Link
            href="/progress"
            className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
              pathname.startsWith("/progress")
                ? "bg-[#1e5e4a] text-white shadow-sm"
                : "text-[#6b7280] hover:text-[#1e5e4a] hover:bg-[#faf6ee]"
            }`}
          >
            My Progress
          </Link>

          {/* User Avatar if logged in */}
          {user ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold-pale/20">
              <span className="text-lg">{user.avatar || "👤"}</span>
              <span className="text-xs font-bold text-ink hidden sm:inline">{user.username}</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-sm text-zinc-400 bg-zinc-50">
              👤
            </div>
          )}

          {/* Settings Button if passed */}
          {showSettingsBtn && onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-full border border-gold/30 hover:border-gold hover:bg-gold-pale/20 transition-all text-sm flex items-center justify-center cursor-pointer"
              title="Settings"
            >
              ⚙️
            </button>
          )}
        </nav>
      </div>

      {/* Optional Account Registration prompt overlay */}
      {showPrompt && (
        <div className="fixed inset-0 bg-[#1a1208]/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-6">
          <div className="card max-w-sm w-full bg-white p-8 text-center flex flex-col gap-5 border border-[#c8993c]/30 shadow-2xl animate-slide-up">
            <div className="text-4xl">🌟</div>
            <h3 className="text-xl font-bold text-[#1e5e4a] font-amiri">
              Save your progress?
            </h3>
            <p className="text-sm text-[#6b7280] leading-relaxed">
              Create a free local account so you never lose your learning streak and recitation logs.
            </p>
            <input
              type="text"
              placeholder="Enter your name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full h-11 px-4 border border-[#c8993c]/30 rounded-xl text-sm font-medium focus:outline-none focus:border-[#1e5e4a]"
            />
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={handleRegister}
                className="btn-primary w-full h-[52px] text-sm font-bold flex items-center justify-center"
              >
                Create Account
              </button>
              <button
                onClick={handleSkip}
                className="w-full text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-600 transition-colors py-2"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
