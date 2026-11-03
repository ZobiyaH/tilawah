"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { subscribeEmail } from "@/lib/email/subscribe";
import { useAuth } from "@/components/providers/AuthSyncProvider";

interface EmailCaptureEventDetail {
  moment: "MomentA" | "MomentB" | "MomentC";
  surahName?: string;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.06 13.22l7.98 6.19C12.73 13.72 17.88 9.5 24 9.5Z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.73 6C44.45 37.93 46.98 31.85 46.98 24.55Z"
      />
      <path
        fill="#FBBC05"
        d="M10.99 28.59A14.4 14.4 0 0 1 10.22 24c0-1.59.27-3.12.76-4.59L3 13.22A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l8.43-6.19Z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.92-5.8l-7.73-6c-2.15 1.45-4.9 2.3-8.19 2.3-6.12 0-11.27-4.22-12.96-9.91L3.06 34.78C6.51 42.62 14.62 48 24 48Z"
      />
    </svg>
  );
}

export default function EmailCaptureModal() {
  const { user: authUser, signInWithGoogle } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [moment, setMoment] = useState<"MomentA" | "MomentB" | "MomentC">(
    "MomentA",
  );
  const [surahName, setSurahName] = useState("Al-Fatiha");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [hasUsername, setHasUsername] = useState(false);
  const [success, setSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // If a user is already authenticated, use their account details.
  useEffect(() => {
    if (!authUser) return;

    const name =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email?.split("@")[0] ||
      "Tilawah Student";

    setUsername(name);
    setHasUsername(true);
    setEmail(authUser.email || "");
  }, [authUser]);

  useEffect(() => {
    const handleTrigger = (event: Event) => {
      const captured =
        localStorage.getItem("tilawah_email_captured") === "true";

      if (captured) return;

      const dismissed =
        sessionStorage.getItem("email_popup_dismissed") === "true";

      if (dismissed) return;

      const detail = (event as CustomEvent<EmailCaptureEventDetail>).detail;

      if (!detail) return;

      setMoment(detail.moment);

      if (detail.surahName) {
        setSurahName(detail.surahName);
      }

      setSuccess(false);

      if (authUser?.email) {
        setEmail(authUser.email);
      } else {
        setEmail("");
      }

      const savedUser = localStorage.getItem("tilawa_user");

      if (authUser) {
        const name =
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split("@")[0] ||
          "Tilawah Student";

        setUsername(name);
        setHasUsername(true);
      } else if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);

          if (parsed.username) {
            setUsername(parsed.username);
            setHasUsername(true);
          } else {
            setHasUsername(false);
          }
        } catch {
          setHasUsername(false);
        }
      } else {
        setHasUsername(false);
      }

      setIsOpen(true);
    };

    window.addEventListener("open-email-capture", handleTrigger);

    return () => {
      window.removeEventListener("open-email-capture", handleTrigger);
    };
  }, [authUser]);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error("[Google Sign In] Failed:", error);
      alert("Unable to sign in with Google. Please try again.");
      setGoogleLoading(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem("email_popup_dismissed", "true");

    window.dispatchEvent(new CustomEvent("email-popup-dismissed-event"));

    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    let nameToSave = username.trim() || "Tilawah Student";

    const savedUser = localStorage.getItem("tilawa_user");

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);

        if (parsed.username) {
          nameToSave = parsed.username;
        }
      } catch {
        // Ignore invalid saved profile.
      }
    } else if (authUser) {
      nameToSave =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split("@")[0] ||
        nameToSave;
    }

    const cleanEmail = email.trim();

    // This submits the newsletter/email capture form.
    const result = await subscribeEmail(
      cleanEmail,
      `popup_${moment}`,
      nameToSave,
    );

    if (!result.success) {
      alert(result.message);
      return;
    }

    localStorage.setItem("tilawah_email_captured", "true");
    localStorage.setItem("tilawah_user_email", cleanEmail);

    const existingUser = localStorage.getItem("tilawa_user");

    if (existingUser) {
      try {
        const parsed = JSON.parse(existingUser);

        parsed.email = cleanEmail;
        parsed.username = nameToSave;

        localStorage.setItem("tilawa_user", JSON.stringify(parsed));
      } catch {
        localStorage.setItem(
          "tilawa_user",
          JSON.stringify({
            username: nameToSave,
            email: cleanEmail,
            avatar: "🌙",
          }),
        );
      }
    } else {
      localStorage.setItem(
        "tilawa_user",
        JSON.stringify({
          username: nameToSave,
          email: cleanEmail,
          avatar: "🌙",
        }),
      );
    }

    window.dispatchEvent(new CustomEvent("tilawa-user-updated"));

    setSuccess(true);

    setTimeout(() => {
      setIsOpen(false);
    }, 1500);
  };

  if (!isOpen) return null;

  const getPromptText = () => {
    switch (moment) {
      case "MomentA":
        return {
          title: "Great work!",
          desc: hasUsername
            ? "Save your progress so you never lose it."
            : "Create your profile to save your progress report.",
          submitLabel: "Save progress",
          skipLabel: "Continue without saving",
          subtext:
            "We will email you your progress report and notify you when new lessons launch.",
        };

      case "MomentB":
        return {
          title: "Welcome back!",
          desc: "Save your progress across devices so you can learn on any phone or computer.",
          submitLabel: "Save progress",
          skipLabel: "Continue as guest",
          subtext:
            "Your email will sync your Arabic alphabet and Surah learnings.",
        };

      case "MomentC":
        return {
          title: `You completed ${surahName}!`,
          subTitleText: "MashaAllah",
          desc: "Get your completion certificate sent to your email:",
          submitLabel: "Get Certificate",
          skipLabel: "Skip",
          subtext:
            "A beautiful PDF certificate will be generated and sent instantly.",
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
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 220,
        }}
        className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 border-t sm:border border-[#c8993c]/30 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto flex flex-col z-10 max-h-[85vh] sm:max-h-[90vh] h-auto"
      >
        {/* Mobile swipe indicator */}
        <div
          className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto my-3 sm:hidden"
          onClick={handleDismiss}
        />

        {/* Close button */}
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
              <div className="w-12 h-12 flex items-center justify-center text-[#c8993c]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-10 h-10"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
                  />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-emerald dark:text-emerald-light">
                Saved Successfully!
              </h3>

              <p className="text-xs text-zinc-500">
                Your email has been saved.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="w-full flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1 items-center">
                <h3 className="text-lg sm:text-xl font-black text-[#1e5e4a] dark:text-emerald-light font-amiri leading-normal">
                  {textInfo.title}
                </h3>

                {moment === "MomentC" && (
                  <span className="text-sm font-bold text-[#c8993c]">
                    {textInfo.subTitleText}
                  </span>
                )}

                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-bold leading-relaxed max-w-sm mt-1">
                  {textInfo.desc}
                </p>
              </div>

              <div className="flex flex-col gap-2.5 w-full">
                {/* Google authentication */}
                {!authUser && (
                  <>
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading}
                      className="w-full h-11 flex items-center justify-center gap-3 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all disabled:opacity-50"
                    >
                      <GoogleIcon />
                      {googleLoading ? "Connecting..." : "Continue with Google"}
                    </button>
                    <p className="mt-0 mb-3 text-center text-xs text-red-500">
                      Google sign-in is currently available to invited testers
                      as we prepare this feature for public launch. Meanwhile
                      you can login by manually entering your details.
                    </p>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-zinc-300 dark:bg-zinc-700" />
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">
                        Or continue with email
                      </span>
                      <div className="flex-1 h-px bg-zinc-300 dark:bg-zinc-700" />
                    </div>
                  </>
                )}

                {!hasUsername && (
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-11 px-4 border border-[#c8993c]/30 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1e5e4a] dark:bg-zinc-800 dark:text-zinc-100 text-center mb-1"
                  />
                )}

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
