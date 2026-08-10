"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import Logo from "../UI/Logo";
import UserGuideModal from "../UI/UserGuideModal";
import SettingsDrawer from "../UI/SettingsDrawer";
import { getStreak, getLearningProgress } from "@/lib/progress";

interface HeaderProps {
  onOpenSettings?: () => void;
  showSettingsBtn?: boolean;
}

export default function Header({ onOpenSettings }: HeaderProps = {}) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ username: string; avatar: string } | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userStreak, setUserStreak] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const [internalSettingsOpen, setInternalSettingsOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("tilawa_user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          if (parsed.username) setNameInput(parsed.username);
          if (parsed.email) {
            setUserEmail(parsed.email);
            setEmailInput(parsed.email);
          }
        } catch {
          // ignore
        }
      }

      // Check captured email from localStorage
      const capturedEmail = localStorage.getItem("tilawah_user_email") || "";
      if (capturedEmail) {
        setUserEmail(capturedEmail);
        setEmailInput(capturedEmail);
      }

      setUserStreak(getStreak());
      setCompletedCount(getLearningProgress().filter(p => p.completed).length);
    }
  }, [pathname, showPrompt]);

  const handleRegister = () => {
    if (!nameInput.trim()) return;
    const cleanEmail = emailInput.trim();
    const newUser = { 
      username: nameInput.trim(), 
      avatar: "⭐",
      email: cleanEmail || undefined
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("tilawa_user", JSON.stringify(newUser));
      localStorage.setItem("tilawa_prompted_account", "done");
      
      if (cleanEmail && cleanEmail.includes("@")) {
        localStorage.setItem("tilawah_email_captured", "true");
        localStorage.setItem("tilawah_user_email", cleanEmail);
      }
      
      window.dispatchEvent(new CustomEvent("tilawa-user-updated", { detail: newUser }));
    }
    
    setUser(newUser);
    if (cleanEmail && cleanEmail.includes("@")) {
      setUserEmail(cleanEmail);
    }
    setShowPrompt(false);
  };

  const handleSkip = () => {
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

          {/* User Avatar - Clickable to register/edit profile */}
          <button
            onClick={() => {
              if (user) {
                setNameInput(user.username);
              }
              setShowPrompt(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#c8993c]/30 bg-white/70 dark:bg-zinc-900/70 hover:border-[#c8993c] transition-all cursor-pointer select-none active:scale-95"
            title="My Profile"
          >
            <span className="text-base">{user ? (user.avatar || "👤") : "👤"}</span>
            {user && (
              <span className="text-xs font-bold text-[#1a1208] dark:text-zinc-200 hidden sm:inline">
                {user.username}
              </span>
            )}
          </button>

          {/* Settings Button - Always Visible (Hidden on Home Page on Mobile) */}
          <button
            onClick={handleSettingsClick}
            className={`p-1.5 rounded-full border border-[#c8993c]/30 hover:border-[#c8993c] bg-white/70 dark:bg-zinc-900/70 text-sm items-center justify-center cursor-pointer transition-all active:scale-95 shadow-xs ${
              pathname === "/" ? "hidden md:flex" : "flex"
            }`}
            title="Settings & Theme"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Account Registration / User Profile Overlay Modal */}
      {showPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="relative card w-full sm:max-w-md bg-[#faf6ee] dark:bg-zinc-900 border-t sm:border-2 border-[#c8993c]/30 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-y-auto flex flex-col p-6 text-center items-center gap-4 animate-slide-up max-h-[85vh] sm:max-h-[90vh] h-auto">
            {/* Close Cross Button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors z-20 cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>

            <div className="text-4xl">⭐</div>
            <h3 className="text-xl font-bold text-[#1e5e4a] dark:text-emerald-light font-amiri text-center leading-normal">
              {userEmail ? "Your Profile" : "Save your progress?"}
            </h3>

            <div className="flex flex-col gap-2 w-full">
              <input
                type="text"
                placeholder="Enter your name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full h-11 px-4 border border-[#c8993c]/30 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1e5e4a] dark:bg-zinc-800 dark:text-zinc-100 text-center"
              />

              <input
                type="email"
                placeholder="Enter your email address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full h-11 px-4 border border-[#c8993c]/30 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1e5e4a] dark:bg-zinc-800 dark:text-zinc-100 text-center"
              />
            </div>

            {/* Profile Stats display */}
            <div className="grid grid-cols-2 gap-4 w-full bg-white/40 dark:bg-zinc-800/30 p-3 rounded-xl border border-[#c8993c]/10 text-center select-none">
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase font-bold text-zinc-400">Daily Streak</span>
                <span className="text-sm font-black text-emerald dark:text-emerald-light mt-0.5">{userStreak} Days 🔥</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase font-bold text-zinc-400">Lessons Completed</span>
                <span className="text-sm font-black text-gold mt-0.5">{completedCount} 📖</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full mt-1">
              <button
                onClick={handleRegister}
                className="w-full h-11 bg-[#1e5e4a] hover:bg-[#154335] text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
              >
                Save Profile
              </button>
              <button
                onClick={handleSkip}
                className="w-full text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors py-2 text-center cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
