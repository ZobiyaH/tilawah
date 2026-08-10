"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; avatar: string } | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userStreak, setUserStreak] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const [internalSettingsOpen, setInternalSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
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

          {/* User Avatar - Clickable (Redirects to Progress page if profile exists, otherwise opens setup) */}
          <button
            onClick={() => {
              if (user) {
                router.push("/progress");
              } else {
                setShowPrompt(true);
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-[#c8993c]/50 hover:border-[#c8993c] bg-white/90 dark:bg-zinc-900/90 text-[#1a1208] dark:text-zinc-200 transition-all cursor-pointer select-none active:scale-95 shadow-xs hover:shadow-md"
            title={user ? "View My Progress" : "Setup Profile"}
          >
            {user ? (
              <div className="flex items-center gap-1.5">
                <span className="text-sm select-none">⭐</span>
                <span className="text-xs font-black uppercase tracking-wider">
                  {user.username}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
                <span className="text-sm select-none">👤</span>
                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">
                  Guest
                </span>
              </div>
            )}
          </button>

          {/* Settings Button - Always Visible (Hidden on Home Page on Mobile) */}
          <button
            onClick={handleSettingsClick}
            className={`p-2 rounded-full border border-[#c8993c]/30 hover:border-[#c8993c] bg-white/70 dark:bg-zinc-900/70 items-center justify-center cursor-pointer transition-all active:scale-95 shadow-xs text-[#1e5e4a] dark:text-emerald-light ${
              pathname === "/" ? "hidden md:flex" : "flex"
            }`}
            title="Settings & Theme"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4.5 h-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Account Registration / User Profile Overlay Modal rendered via Portal */}
      {mounted && showPrompt && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="relative card w-full sm:max-w-md bg-[#faf6ee] dark:bg-zinc-900 border-t sm:border-2 border-[#c8993c]/30 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-y-auto flex flex-col p-6 text-center items-center gap-4 animate-[slide-up_0.35s_ease-out] max-h-[85vh] sm:max-h-[90vh] h-auto">
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
        </div>,
        document.body
      )}
    </header>
  );
}
