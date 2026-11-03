"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import Logo from "../UI/Logo";
import UserGuideModal from "../UI/UserGuideModal";
import SettingsDrawer from "../UI/SettingsDrawer";
import { getStreak, getLearningProgress } from "@/lib/progress";
import { subscribeEmail } from "@/lib/email/subscribe";
import { useAuth } from "@/components/providers/AuthSyncProvider";

interface HeaderProps {
  onOpenSettings?: () => void;
  showSettingsBtn?: boolean;
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

export default function Header({ onOpenSettings }: HeaderProps = {}) {
  const pathname = usePathname();
  const router = useRouter();

  const { user: authUser, signInWithGoogle, signOut } = useAuth();

  const [user, setUser] = useState<{
    username: string;
    avatar: string;
    email?: string;
  } | null>(null);

  const [showPrompt, setShowPrompt] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userStreak, setUserStreak] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const [internalSettingsOpen, setInternalSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Load the existing local profile and progress.
  useEffect(() => {
    setMounted(true);

    if (typeof window === "undefined") return;

    if (!authUser) {
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
          // Ignore invalid saved profile data.
        }
      }

      const capturedEmail = localStorage.getItem("tilawah_user_email") || "";

      if (capturedEmail) {
        setUserEmail(capturedEmail);
        setEmailInput(capturedEmail);
      }
    }

    setUserStreak(getStreak());
    setCompletedCount(
      getLearningProgress().filter((progress) => progress.completed).length,
    );
  }, [pathname, showPrompt, authUser]);

  // Use the authenticated Supabase user when Google sign-in succeeds.
  useEffect(() => {
    if (!authUser) return;

    const googleUser = {
      username:
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split("@")[0] ||
        "Tilawah Student",
      email: authUser.email || "",
      avatar: "🌙",
    };

    setUser(googleUser);
    setUserEmail(googleUser.email);
    setNameInput(googleUser.username);
    setEmailInput(googleUser.email);

    // Keep the existing header display compatible with the local profile.
    localStorage.setItem("tilawa_user", JSON.stringify(googleUser));
    localStorage.setItem("tilawah_user_email", googleUser.email);

    window.dispatchEvent(
      new CustomEvent("tilawa-user-updated", { detail: googleUser }),
    );
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

  const handleRegister = async () => {
    const hasName = !!nameInput.trim();
    const hasEmail = !!emailInput.trim();

    if (!hasName || !hasEmail) {
      alert("Please enter both your name and email address.");
      return;
    }

    if (!emailInput.trim().includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    const cleanEmail = emailInput.trim();
    const cleanName = nameInput.trim();

    const result = await subscribeEmail(cleanEmail, "navbar_popup", cleanName);

    if (!result.success) {
      alert(result.message);
      return;
    }

    const newUser = {
      username: cleanName,
      avatar: "⭐",
      email: cleanEmail,
    };

    localStorage.setItem("tilawa_user", JSON.stringify(newUser));
    localStorage.setItem("tilawa_prompted_account", "done");
    localStorage.setItem("tilawah_email_captured", "true");
    localStorage.setItem("tilawah_user_email", cleanEmail);

    window.dispatchEvent(
      new CustomEvent("tilawa-user-updated", { detail: newUser }),
    );

    setUser(newUser);
    setUserEmail(cleanEmail);
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

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setUserEmail("");
      setShowPrompt(false);
      localStorage.removeItem("tilawa_user");
      localStorage.removeItem("tilawah_user_email");
    } catch (error) {
      console.error("[Sign Out] Failed:", error);
      alert("Unable to sign out. Please try again.");
    }
  };

  useEffect(() => {
    const handleOpen = () => setGuideOpen(true);
    const handleOpenSettings = () => setInternalSettingsOpen(true);

    window.addEventListener("open-user-guide", handleOpen);
    window.addEventListener("open-settings-drawer", handleOpenSettings);

    return () => {
      window.removeEventListener("open-user-guide", handleOpen);
      window.removeEventListener("open-settings-drawer", handleOpenSettings);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 py-1.5 px-4 sm:px-6 border-b border-[#c8993c]/20 bg-[#faf6ee]/90 dark:bg-[#0f1a14]/90 backdrop-blur-md transition-colors w-full shadow-sm">
      <UserGuideModal isOpen={guideOpen} onClose={() => setGuideOpen(false)} />

      <SettingsDrawer
        isOpen={internalSettingsOpen}
        onClose={() => setInternalSettingsOpen(false)}
      />

      <div className="max-w-6xl mx-auto flex justify-between items-center gap-2 sm:gap-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 sm:gap-2 select-none group flex-shrink-0 min-w-0"
        >
          <Logo
            variant="horizontal"
            size="sm"
            className="group-hover:scale-105 transition-transform"
          />
        </Link>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={() =>
              window.dispatchEvent(new CustomEvent("open-install-prompt"))
            }
            className="px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-extrabold text-white bg-[#1e5e4a] hover:bg-[#164738] border border-[#1e5e4a] transition-all flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 flex-shrink-0"
            title="Install Tilawah App"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-4 h-4 text-emerald-200"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.5V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            <span className="hidden sm:inline uppercase tracking-wider text-[11px]">
              Install App
            </span>
            <span className="sm:hidden uppercase tracking-wider text-[10px]">
              App
            </span>
          </button>

          <button
            onClick={() => setGuideOpen(true)}
            className="px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-extrabold text-[#c8993c] dark:text-[#e8c96a] bg-white/70 dark:bg-zinc-900/70 border border-[#c8993c]/30 hover:bg-[#c8993c]/15 transition-all flex items-center gap-1 shadow-xs flex-shrink-0"
            title="How to Use Tilawah"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
              />
            </svg>
            <span className="hidden sm:inline uppercase tracking-wider text-[11px]">
              Guide
            </span>
          </button>

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

          <button
            onClick={() => {
              if (authUser || user) {
                router.push("/progress");
              } else {
                setShowPrompt(true);
              }
            }}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl border-2 border-[#c8993c]/50 hover:border-[#c8993c] bg-white/90 dark:bg-zinc-900/90 text-[#1a1208] dark:text-zinc-200 transition-all cursor-pointer select-none active:scale-95 shadow-xs hover:shadow-md max-w-[105px] sm:max-w-none flex-shrink-0"
            title={authUser || user ? "View My Progress" : "Setup Profile"}
          >
            {authUser || user ? (
              <div className="flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 text-gold drop-shadow-sm"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs font-black uppercase tracking-wider text-[#1e5e4a] dark:text-[#e8c96a] truncate max-w-[55px] sm:max-w-none">
                  {
                    (
                      authUser?.user_metadata?.full_name ||
                      authUser?.user_metadata?.name ||
                      user?.username ||
                      "Student"
                    ).split(" ")[0]
                  }
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  className="w-4 h-4 stroke-zinc-500 dark:stroke-zinc-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline text-zinc-500 dark:text-zinc-400">
                  Guest
                </span>
              </div>
            )}
          </button>

          <button
            onClick={handleSettingsClick}
            className="flex p-2 rounded-full border border-[#c8993c]/30 hover:border-[#c8993c] bg-white/70 dark:bg-zinc-900/70 items-center justify-center cursor-pointer transition-all active:scale-95 shadow-xs text-[#1e5e4a] dark:text-emerald-light"
            title="Settings & Theme"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="#1e5e4a"
              className="w-5 h-5 dark:stroke-[#e8c96a]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
          </button>
        </div>
      </div>

      {mounted &&
        showPrompt &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="relative card w-full sm:max-w-md bg-[#faf6ee] dark:bg-zinc-900 border-t sm:border-2 border-[#c8993c]/30 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-y-auto flex flex-col p-6 text-center items-center gap-4 animate-[slide-up_0.35s_ease-out] max-h-[85vh] sm:max-h-[90vh] h-auto">
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors z-20 cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>

              <div className="w-12 h-12 flex items-center justify-center text-gold drop-shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-10 h-10"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-[#1e5e4a] dark:text-emerald-light font-amiri text-center leading-normal">
                {authUser
                  ? "Your Account"
                  : userEmail
                    ? "Your Profile"
                    : "Save your progress?"}
              </h3>

              {authUser ? (
                <div className="w-full flex flex-col gap-3">
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    Signed in as <strong>{authUser.email}</strong>
                  </p>
                  <p className="text-xs text-zinc-500">
                    Your progress can now be associated with your Supabase
                    account.
                  </p>
                  <button
                    onClick={() => {
                      setShowPrompt(false);
                      router.push("/progress");
                    }}
                    className="w-full h-11 bg-[#1e5e4a] hover:bg-[#154335] text-white text-[11px] font-black uppercase tracking-wider rounded-xl"
                  >
                    View My Progress
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full h-10 border border-red-300 text-red-600 dark:text-red-400 rounded-xl text-[11px] font-bold uppercase"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-full flex flex-col gap-0">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading}
                      className="w-full h-11 flex items-center justify-center gap-3 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all disabled:opacity-50"
                    >
                      <GoogleIcon />
                      {googleLoading ? "Connecting..." : "Continue with Google"}
                    </button>
                    <p className="mt-0 mb-3 text-center text-xs text-red-700 ">
                      Google sign-in is currently available to invited testers
                      as we prepare this feature for public launch. Meanwhile you can login by manually entering your details.
                    </p>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-zinc-300 dark:bg-zinc-700" />
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">
                        Or use email
                      </span>
                      <div className="flex-1 h-px bg-zinc-300 dark:bg-zinc-700" />
                    </div>
                  </div>

                  <div className="flex flex-col gap- w-full">
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

                  <div className="grid grid-cols-2 gap-4 w-full bg-white/40 dark:bg-zinc-800/30 p-3 rounded-xl border border-[#c8993c]/10 text-center select-none">
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] uppercase font-bold text-zinc-400">
                        Daily Streak
                      </span>
                      <span className="text-sm font-black text-emerald dark:text-emerald-light mt-0.5 flex items-center gap-1">
                        {userStreak} Days
                        <span className="text-orange-500">🔥</span>
                      </span>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-[9px] uppercase font-bold text-zinc-400">
                        Lessons Completed
                      </span>
                      <span className="text-sm font-black text-gold mt-0.5 flex items-center gap-1">
                        {completedCount}
                        <span>📖</span>
                      </span>
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
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
