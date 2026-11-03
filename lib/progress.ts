import { supabase } from "@/lib/supabase/supabaseClient";

// ==========================================
// TYPES
// ==========================================

export type LearningTrack =
  | "letters"
  | "harakat"
  | "joining"
  | "tajweed"
  | "surahs";

export interface LearningProgressRecord {
  user_id: string;
  track: LearningTrack;
  lesson_id: string;
  completed: boolean;
  attempts: number;
  best_score: number | null;
  last_practiced: string;
}

export interface UserStreak {
  streak: number;
  lastPracticedDate: string;
}

export interface LastPosition {
  track: string;
  lessonId: string;
  wordIndex: number;
  timestamp: number;
}

// ==========================================
// LOCAL STORAGE KEYS
// ==========================================

const STORAGE_KEY = "tilawa_learning_progress";
const STREAK_KEY = "tilawa_streak";
const LAST_POSITION_KEY = "tilawa_last_position";

// ==========================================
// GET LOCAL LEARNING PROGRESS
// ==========================================

export function getLearningProgress(): LearningProgressRecord[] {
  if (typeof window === "undefined") return [];

  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("[Progress] Failed to parse local progress:", error);
    return [];
  }
}

// ==========================================
// SAVE LOCAL PROGRESS
// ==========================================

function saveLocalProgress(progress: LearningProgressRecord[]): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

// ==========================================
// MERGE LOCAL AND CLOUD PROGRESS
// ==========================================

function mergeProgress(
  cloudProgress: LearningProgressRecord[],
  localProgress: LearningProgressRecord[],
): LearningProgressRecord[] {
  const merged = new Map<string, LearningProgressRecord>();

  cloudProgress.forEach((record) => {
    const key = `${record.track}:${record.lesson_id}`;
    merged.set(key, { ...record });
  });

  localProgress.forEach((local) => {
    const key = `${local.track}:${local.lesson_id}`;
    const cloud = merged.get(key);

    if (!cloud) {
      merged.set(key, { ...local });
      return;
    }

    const localTime = new Date(local.last_practiced).getTime() || 0;
    const cloudTime = new Date(cloud.last_practiced).getTime() || 0;

    const localIsNewer = localTime > cloudTime;

    merged.set(key, {
      ...cloud,

      completed: cloud.completed || local.completed,

      attempts: Math.max(cloud.attempts || 0, local.attempts || 0),

      best_score:
        cloud.best_score == null
          ? local.best_score
          : local.best_score == null
            ? cloud.best_score
            : Math.max(cloud.best_score, local.best_score),

      last_practiced: localIsNewer
        ? local.last_practiced
        : cloud.last_practiced,
    });
  });

  return Array.from(merged.values());
}

// ==========================================
// SYNC LOCAL PROGRESS TO SUPABASE
// ==========================================

export async function syncProgressToSupabase(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("[Supabase] Auth Error:", authError);
      return;
    }

    if (!user) return;

    const progress = getLearningProgress();

    if (progress.length === 0) return;

    const records = progress.map((p) => ({
      user_id: user.id,
      track: p.track,
      lesson_id: p.lesson_id,
      completed: p.completed,
      attempts: p.attempts,
      best_score: p.best_score,
      last_practiced: p.last_practiced,
    }));

    const { error } = await supabase.from("learning_progress").upsert(records, {
      onConflict: "user_id,track,lesson_id",
    });

    if (error) {
      console.error("[Supabase] Progress Sync Error:", error);
    } else {
      console.log("[Supabase] Progress synced successfully.");
    }
  } catch (error) {
    console.error("[Supabase] Unexpected Sync Error:", error);
  }
}

// ==========================================
// PULL PROGRESS FROM SUPABASE
// ==========================================

export async function pullProgressFromSupabase(): Promise<
  LearningProgressRecord[]
> {
  if (typeof window === "undefined") return [];

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return getLearningProgress();
    }

    const { data, error } = await supabase
      .from("learning_progress")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("[Supabase] Progress Pull Error:", error);
      return getLearningProgress();
    }

    const cloudProgress: LearningProgressRecord[] = (data || []).map(
      (record) => ({
        ...record,
        user_id: user.id,
      }),
    );

    const localProgress = getLearningProgress();

    const merged = mergeProgress(cloudProgress, localProgress);

    saveLocalProgress(merged);

    // Upload local-only and merged records.
    await syncProgressToSupabase();

    console.log("[Supabase] Progress restored:", merged);

    return merged;
  } catch (error) {
    console.error("[Supabase] Unexpected Pull Error:", error);
    return getLearningProgress();
  }
}

// ==========================================
// SAVE LEARNING PROGRESS
// ==========================================

export function saveLearningProgress(record: {
  track: LearningTrack;
  lesson_id: string;
  completed: boolean;
  score?: number;
}): void {
  if (typeof window === "undefined") return;

  const progressList = getLearningProgress();

  const index = progressList.findIndex(
    (p) => p.track === record.track && p.lesson_id === record.lesson_id,
  );

  const now = new Date().toISOString();

  const currentRecord = index >= 0 ? progressList[index] : null;

  const score =
    record.score !== undefined ? record.score : record.completed ? 100 : 0;

  const attempts = currentRecord ? currentRecord.attempts + 1 : 1;

  const bestScore = currentRecord
    ? Math.max(currentRecord.best_score ?? 0, score)
    : score;

  const wasAlreadyCompleted = currentRecord ? currentRecord.completed : false;

  const updatedRecord: LearningProgressRecord = {
    user_id: "local_user",
    track: record.track,
    lesson_id: record.lesson_id,
    completed: record.completed || wasAlreadyCompleted,
    attempts,
    best_score: bestScore,
    last_practiced: now,
  };

  if (index >= 0) {
    progressList[index] = updatedRecord;
  } else {
    progressList.push(updatedRecord);
  }

  saveLocalProgress(progressList);

  // Update the daily streak locally.
  updateStreak();

  // IMPORTANT: Sync the updated streak to Supabase.
  // This runs after updateStreak() has saved the new value.
  void syncStreakToSupabase();

  // Save the last recitation position.
  saveLastPosition(record.track, record.lesson_id);

  // Synchronize lesson progress with Supabase.
  void syncProgressToSupabase();

  // Moment A: Email capture after first lesson completion.
  if (record.completed && !wasAlreadyCompleted) {
    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("open-email-capture", {
          detail: { moment: "MomentA" },
        }),
      );
    }, 1000);
  }
}

// ==========================================
// SAVE LAST RECITATION POSITION
// ==========================================

async function syncPositionToSupabase(position: LastPosition): Promise<void> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return;

    const { error } = await supabase.from("user_positions").upsert(
      {
        user_id: user.id,
        track: position.track,
        lesson_id: position.lessonId,
        word_index: position.wordIndex,
        updated_at: new Date(position.timestamp).toISOString(),
      },
      {
        onConflict: "user_id",
      },
    );

    if (error) {
      console.error("[Supabase] Position Sync Error:", error);
    }
  } catch (error) {
    console.error("[Supabase] Unexpected Position Error:", error);
  }
}

export function saveLastPosition(
  track: string,
  lessonId: string,
  wordIndex: number = 0,
): void {
  if (typeof window === "undefined") return;

  const position: LastPosition = {
    track,
    lessonId,
    wordIndex,
    timestamp: Date.now(),
  };

  localStorage.setItem(LAST_POSITION_KEY, JSON.stringify(position));

  void syncPositionToSupabase(position);
}

// ==========================================
// GET LOCAL LAST POSITION
// ==========================================

export function getLastPosition(): LastPosition | null {
  if (typeof window === "undefined") return null;

  const saved = localStorage.getItem(LAST_POSITION_KEY);

  if (!saved) return null;

  try {
    return JSON.parse(saved) as LastPosition;
  } catch {
    return null;
  }
}

// ==========================================
// PULL LAST POSITION FROM SUPABASE
// ==========================================

export async function pullLastPositionFromSupabase(): Promise<LastPosition | null> {
  if (typeof window === "undefined") return null;

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return getLastPosition();
    }

    const { data, error } = await supabase
      .from("user_positions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[Supabase] Position Pull Error:", error);
      return getLastPosition();
    }

    const localPosition = getLastPosition();

    if (!data) return localPosition;

    const cloudPosition: LastPosition = {
      track: data.track,
      lessonId: data.lesson_id,
      wordIndex: data.word_index,
      timestamp: new Date(data.updated_at).getTime(),
    };

    if (localPosition && localPosition.timestamp > cloudPosition.timestamp) {
      // Local position is newer. Upload it.
      await syncPositionToSupabase(localPosition);
      return localPosition;
    }

    localStorage.setItem(LAST_POSITION_KEY, JSON.stringify(cloudPosition));

    return cloudPosition;
  } catch (error) {
    console.error("[Supabase] Unexpected Position Pull Error:", error);

    return getLastPosition();
  }
}

// ==========================================
// GET STORED STREAK RECORD
// ==========================================

function getStoredStreak(): UserStreak | null {
  if (typeof window === "undefined") return null;

  const saved = localStorage.getItem(STREAK_KEY);

  if (!saved) return null;

  try {
    const data = JSON.parse(saved) as UserStreak;

    if (
      typeof data.streak !== "number" ||
      typeof data.lastPracticedDate !== "string"
    ) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

// ==========================================
// GET STREAK
// ==========================================

export function getStreak(): number {
  const data = getStoredStreak();

  if (!data) return 0;

  const today = getTodayString();
  const lastDate = data.lastPracticedDate;

  if (!lastDate || lastDate > today) return 0;

  if (today === lastDate) {
    return data.streak;
  }

  const diffDays = getDaysDiff(lastDate, today);

  if (diffDays <= 1) {
    return data.streak;
  }

  // Streak expired.
  return 0;
}

// ==========================================
// SYNC STREAK TO SUPABASE
// ==========================================

export async function syncStreakToSupabase(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("[Supabase] Streak Auth Error:", authError);
      return;
    }

    if (!user) return;

    const streakRecord = getStoredStreak();

    if (!streakRecord) return;

    const { error } = await supabase.from("user_streaks").upsert(
      {
        user_id: user.id,
        streak: streakRecord.streak,
        last_practiced_date: streakRecord.lastPracticedDate || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    );

    if (error) {
      console.error("[Supabase] Streak Sync Error:", error);
    } else {
      console.log("[Supabase] Streak synced successfully.");
    }
  } catch (error) {
    console.error("[Supabase] Unexpected Streak Sync Error:", error);
  }
}

// ==========================================
// PULL STREAK FROM SUPABASE
// ==========================================

export async function pullStreakFromSupabase(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return;

    const { data, error } = await supabase
      .from("user_streaks")
      .select("streak, last_practiced_date")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[Supabase] Streak Pull Error:", error);
      return;
    }

    const localStreak = getStoredStreak();

    // No cloud record: upload the local streak if one exists.
    if (!data) {
      if (localStreak) {
        await syncStreakToSupabase();
      }
      return;
    }

    const cloudStreak: UserStreak = {
      streak: data.streak,
      lastPracticedDate: data.last_practiced_date ?? "",
    };

    // No local record: restore the cloud record.
    if (!localStreak) {
      localStorage.setItem(STREAK_KEY, JSON.stringify(cloudStreak));

      console.log("[Supabase] Streak restored:", cloudStreak);
      return;
    }

    const localDate = localStreak.lastPracticedDate;
    const cloudDate = cloudStreak.lastPracticedDate;

    // Prefer the record with the more recent practice date.
    const cloudIsNewer = cloudDate > localDate;

    // On the same date, preserve the higher streak.
    const sameDateCloudIsBetter =
      cloudDate === localDate && cloudStreak.streak > localStreak.streak;

    if (cloudIsNewer || sameDateCloudIsBetter) {
      localStorage.setItem(STREAK_KEY, JSON.stringify(cloudStreak));

      console.log("[Supabase] Cloud streak restored:", cloudStreak);
    } else {
      // Local record is newer or better: upload it.
      await syncStreakToSupabase();
    }
  } catch (error) {
    console.error("[Supabase] Unexpected Streak Pull Error:", error);
  }
}

// ==========================================
// UPDATE STREAK LOCALLY
// ==========================================

function updateStreak(): void {
  if (typeof window === "undefined") return;

  const today = getTodayString();
  const saved = getStoredStreak();

  let currentStreak = 0;
  let lastDate = "";

  if (saved) {
    currentStreak = saved.streak;
    lastDate = saved.lastPracticedDate;
  }

  // Already practiced today.
  if (lastDate === today) return;

  const diffDays = lastDate ? getDaysDiff(lastDate, today) : 999;

  if (diffDays === 1) {
    currentStreak += 1;
  } else {
    currentStreak = 1;
  }

  const updated: UserStreak = {
    streak: currentStreak,
    lastPracticedDate: today,
  };

  localStorage.setItem(STREAK_KEY, JSON.stringify(updated));
}

// ==========================================
// DATE HELPERS
// ==========================================

function getTodayString(): string {
  const d = new Date();

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${date}`;
}

function getDaysDiff(date1: string, date2: string): number {
  const d1 = new Date(`${date1}T00:00:00`);
  const d2 = new Date(`${date2}T00:00:00`);

  const diffTime = Math.abs(d2.getTime() - d1.getTime());

  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

// ==========================================
// CHECK NEXT-DAY RETURN
// ==========================================

export function checkNextDayReturn(): boolean {
  if (typeof window === "undefined") return false;

  const today = getTodayString();

  const lastVisit = localStorage.getItem("tilawa_last_visit_date");

  if (!lastVisit) {
    localStorage.setItem("tilawa_last_visit_date", today);

    return false;
  }

  if (lastVisit < today) {
    localStorage.setItem("tilawa_last_visit_date", today);

    return true;
  }

  return false;
}
