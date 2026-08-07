"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import Logo from "../UI/Logo";
import UserGuideModal from "../UI/UserGuideModal";
import SettingsDrawer from "../UI/SettingsDrawer";

interface HeaderProps {
  onOpenSettings?: () => void;
  showSettingsBtn?: boolean;
}

export default function Header({ onOpenSettings }: HeaderProps = {}) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ username: string; avatar: string } | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [internalSettingsOpen, setInternalSettingsOpen] = useState(false);

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

  const handleSettingsClick = () => {
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      setInternalSettingsOpen(true);
    }
  };

  useEffect(() => {
    const handleOpen = () => setGuideOpen(true);
    window.addEventListener("open-user-guide", handleOpen);
    return () => window.removeEventListener("open-user-guide", handleOpen);
  }, []);

  return (
    <header className="sticky top-0 z-50 py-3 px-4 sm:px-6 border-b border-[#c8993c]/20 bg-[#faf6ee]/90 dark:bg-[#0f1a14]/90 backdrop-blur-md transition-colors w-full shadow-sm">
      <UserGuideModal isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
      <SettingsDrawer isOpen={internalSettingsOpen} onClose={() => setInternalSettingsOpen(false)} />

      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-2 select-none group">
          <Logo variant="horizontal" size="sm" className="group-hover:scale-105 transition-transform" />
        </Link>

        {/* Right: Desktop & Mobile Header Actions */}
        <div className="flex items-center gap-2">
          {/* User Guide Button */}
          <button
            onClick={() => setGuideOpen(true)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-extrabold text-[#c8993c] dark:text-[#e8c96a] bg-white/70 dark:bg-zinc-900/70 border border-[#c8993c]/30 hover:bg-[#c8993c]/15 transition-all flex items-center gap-1 shadow-xs"
            title="How to Use Tilawah"
          >
            <span>📖</span>
            <span className="hidden sm:inline uppercase tracking-wider text-[11px]">Guide</span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              href="/learn"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
                pathname.startsWith("/learn")
                  ? "bg-[#1e5e4a] text-white shadow-xs"
                  : "text-[#6b7280] dark:text-zinc-400 hover:text-[#1e5e4a] dark:hover:text-emerald-light hover:bg-[#faf6ee] dark:hover:bg-zinc-900"
              }`}
            >
              Learn
            </Link>
            <Link
              href="/recite"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
                pathname.startsWith("/recite")
                  ? "bg-[#1e5e4a] text-white shadow-xs"
                  : "text-[#6b7280] dark:text-zinc-400 hover:text-[#1e5e4a] dark:hover:text-emerald-light hover:bg-[#faf6ee] dark:hover:bg-zinc-900"
              }`}
            >
              Recite
            </Link>
            <Link
              href="/progress"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
                pathname.startsWith("/progress")
                  ? "bg-[#1e5e4a] text-white shadow-xs"
                  : "text-[#6b7280] dark:text-zinc-400 hover:text-[#1e5e4a] dark:hover:text-emerald-light hover:bg-[#faf6ee] dark:hover:bg-zinc-900"
              }`}
            >
              My Progress
            </Link>
          </nav>

          {/* User Avatar */}
          {user ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#c8993c]/30 bg-white/70 dark:bg-zinc-900/70">
              <span className="text-base">{user.avatar || "👤"}</span>
              <span className="text-xs font-bold text-[#1a1208] dark:text-zinc-200 hidden sm:inline">{user.username}</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full border border-[#c8993c]/30 flex items-center justify-center text-xs text-zinc-400 bg-white/70 dark:bg-zinc-900/70">
              👤
            </div>
          )}

          {/* Settings Button - Always Visible */}
          <button
            onClick={handleSettingsClick}
            className="p-1.5 rounded-full border border-[#c8993c]/30 hover:border-[#c8993c] bg-white/70 dark:bg-zinc-900/70 text-sm flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-xs"
            title="Settings & Theme"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Account Registration Prompt Overlay */}
      {showPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="card max-w-sm w-full bg-[#faf6ee] dark:bg-zinc-900 p-6 text-center flex flex-col items-center gap-4 border-2 border-[#c8993c]/30 shadow-2xl animate-slide-up rounded-2xl">
            <div className="text-4xl">🌟</div>
            <h3 className="text-xl font-bold text-[#1e5e4a] dark:text-emerald-light font-amiri text-center">
              Save your progress?
            </h3>
            <p className="text-xs text-[#6b7280] dark:text-zinc-400 leading-relaxed text-center">
              Create a free local account so you never lose your learning streak and recitation logs.
            </p>
            <input
              type="text"
              placeholder="Enter your name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full h-11 px-4 border border-[#c8993c]/30 rounded-xl text-sm font-medium focus:outline-none focus:border-[#1e5e4a] dark:bg-zinc-800 dark:text-zinc-100 text-center"
            />
            <div className="flex flex-col gap-2 w-full mt-1">
              <button
                onClick={handleRegister}
                className="w-full h-12 bg-[#1e5e4a] hover:bg-[#154335] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md"
              >
                Create Account
              </button>
              <button
                onClick={handleSkip}
                className="w-full text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-600 transition-colors py-2 text-center"
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
