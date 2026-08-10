"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface EmailCaptureEventDetail {
  moment: "MomentA" | "MomentB" | "MomentC";
  surahName?: string;
}

export default function EmailCaptureModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [moment, setMoment] = useState<"MomentA" | "MomentB" | "MomentC">("MomentA");
  const [surahName, setSurahName] = useState("Al-Fatiha");
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleTrigger = (e: Event) => {
      // Check if email already captured
      const captured = localStorage.getItem("tilawah_email_captured") === "true";
      if (captured) return;

      // Check if popup dismissed in current session
      const dismissed = sessionStorage.getItem("email_popup_dismissed") === "true";
      if (dismissed) return;

      const detail = (e as CustomEvent<EmailCaptureEventDetail>).detail;
      if (detail) {
        setMoment(detail.moment);
        if (detail.surahName) {
          setSurahName(detail.surahName);
        }
        setSuccess(false);
        setEmail("");
        setIsOpen(true);
      }
    };

    window.addEventListener("open-email-capture", handleTrigger);
    return () => {
      window.removeEventListener("open-email-capture", handleTrigger);
    };
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("email_popup_dismissed", "true");
    window.dispatchEvent(new CustomEvent("email-popup-dismissed-event"));
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;

    // Save to localStorage
    localStorage.setItem("tilawah_email_captured", "true");
    localStorage.setItem("tilawah_user_email", email.trim());

    // Update tilawa_user if it exists
    const savedUser = localStorage.getItem("tilawa_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        parsed.email = email.trim();
        localStorage.setItem("tilawa_user", JSON.stringify(parsed));
      } catch {
        // ignore
      }
    } else {
      localStorage.setItem(
        "tilawa_user",
        JSON.stringify({ username: "Tilawah Student", email: email.trim(), avatar: "🌙" })
      );
    }

    // Trigger update event
    window.dispatchEvent(new CustomEvent("tilawa-user-updated"));

    setSuccess(true);
    setTimeout(() => {
      setIsOpen(false);
    }, 1500);
  };

  if (!isOpen) return null;

  // Render titles and descriptions based on Moment
  const getPromptText = () => {
    switch (moment) {
      case "MomentA":
        return {
          title: "Great work! 🌟",
          desc: "Save your progress so you never lose it.",
          submitLabel: "Save progress",
          skipLabel: "Continue without saving",
          subtext: "We will email you your progress report and notify you when new lessons launch."
        };
      case "MomentB":
        return {
          title: "Welcome back! 🌙",
          desc: "Save your progress across devices so you can learn on any phone or computer.",
          submitLabel: "Save progress",
          skipLabel: "Continue as guest",
          subtext: "Your email will sync your Arabic alphabet & Surah learnings."
        };
      case "MomentC":
        return {
          title: `You completed ${surahName}!`,
          subTitleText: "MashaAllah 🌟",
          desc: "Get your completion certificate sent to your email:",
          submitLabel: "Get Certificate",
          skipLabel: "Skip",
          subtext: "A beautiful PDF certificate will be generated and sent instantly."
        };
    }
  };

  const textInfo = getPromptText();

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs select-none">
      {/* Click outside to dismiss */}
      <div className="absolute inset-0" onClick={handleDismiss} />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 border-t sm:border border-[#c8993c]/30 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 h-[42vh] sm:h-auto min-h-[300px] sm:min-h-0"
      >
        {/* Swipe indicator handle on mobile */}
        <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto my-3 sm:hidden" onClick={handleDismiss} />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors z-20 cursor-pointer"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="px-6 pb-6 pt-2 sm:pt-6 flex flex-col justify-between flex-grow text-center items-center gap-4">
          {success ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6 animate-pulse">
              <span className="text-4xl">🎉</span>
              <h3 className="text-xl font-bold text-emerald dark:text-emerald-light">Saved Successfully!</h3>
              <p className="text-xs text-zinc-500">Your progress is synchronized.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1 items-center">
                <h3 className="text-lg sm:text-xl font-black text-[#1e5e4a] dark:text-emerald-light font-amiri leading-normal">
                  {textInfo.title}
                </h3>
                {moment === "MomentC" && (
                  <span className="text-sm font-bold text-[#c8993c]">{textInfo.subTitleText}</span>
                )}
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-bold leading-relaxed max-w-sm mt-1">
                  {textInfo.desc}
                </p>
              </div>

              <div className="flex flex-col gap-2.5 w-full">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-4 border border-[#c8993c]/30 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1e5e4a] dark:bg-zinc-800 dark:text-zinc-100 text-center"
                />

                <div className="flex flex-col gap-2 w-full">
                  <button
                    type="submit"
                    className="w-full h-11 bg-[#1e5e4a] hover:bg-[#154335] text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    {textInfo.submitLabel}
                  </button>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="w-full text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors py-2 cursor-pointer"
                  >
                    {textInfo.skipLabel}
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal max-w-xs mx-auto border-t border-zinc-100 dark:border-zinc-800/60 pt-3 mt-1">
                {textInfo.subtext}
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
