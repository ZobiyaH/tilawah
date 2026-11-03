"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/supabaseClient";

import {
  pullProgressFromSupabase,
  pullLastPositionFromSupabase,
  pullStreakFromSupabase,
} from "@/lib/progress";

// ==========================================
// AUTH CONTEXT TYPE
// ==========================================

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==========================================
// AUTH SYNC PROVIDER
// ==========================================

export function AuthSyncProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const lastSyncedUser = useRef<string | null>(null);

  // ==========================================
  // SYNC USER DATA
  // ==========================================

  async function syncUserData(userId: string) {
    if (lastSyncedUser.current === userId) return;

    lastSyncedUser.current = userId;

    try {
      console.log("[Global Sync] Starting sync for:", userId);

      // 1. Download cloud progress and merge with local progress.
      // This function also uploads the merged progress.
      await pullProgressFromSupabase();

      // 2. Restore the last recitation position.
      await pullLastPositionFromSupabase();

      // 3. Restore the user's daily streak.
      await pullStreakFromSupabase();

      console.log("[Global Sync] All user data synchronized.");
    } catch (error) {
      lastSyncedUser.current = null;

      console.error("[Global Sync] Failed:", error);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // AUTH STATE LISTENER
  // ==========================================

  useEffect(() => {
    let mounted = true;
    let syncTimer: ReturnType<typeof setTimeout> | undefined;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      const currentUser = session?.user ?? null;

      setUser(currentUser);

      if (currentUser) {
        setLoading(true);

        // Run Supabase queries after the auth callback finishes.
        if (syncTimer) {
          clearTimeout(syncTimer);
        }

        syncTimer = setTimeout(() => {
          if (mounted) {
            void syncUserData(currentUser.id);
          }
        }, 0);
      } else {
        lastSyncedUser.current = null;
        setLoading(false);
      }
    });

    return () => {
      mounted = false;

      if (syncTimer) {
        clearTimeout(syncTimer);
      }

      subscription.unsubscribe();
    };
  }, []);

  // ==========================================
  // GOOGLE SIGN IN
  // ==========================================

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      throw error;
    }
  }

  // ==========================================
  // SIGN OUT
  // ==========================================

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }

  // ==========================================
  // PROVIDER
  // ==========================================

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ==========================================
// USE AUTH HOOK
// ==========================================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthSyncProvider");
  }

  return context;
}
