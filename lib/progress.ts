export interface LearningProgressRecord {
  user_id: string;
  track: "letters" | "harakat" | "joining" | "tajweed" | "surahs";
  lesson_id: string;
  completed: boolean;
  attempts: number;
  best_score: number;
  last_practiced: string;
}

export interface UserStreak {
  streak: number;
  lastPracticedDate: string; // YYYY-MM-DD
}

const STORAGE_KEY = "tilawa_learning_progress";
const STREAK_KEY = "tilawa_streak";

export function getLearningProgress(): LearningProgressRecord[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export function saveLearningProgress(record: {
  track: "letters" | "harakat" | "joining" | "tajweed" | "surahs";
  lesson_id: string;
  completed: boolean;
  score?: number;
}): void {
  if (typeof window === "undefined") return;
  const progressList = getLearningProgress();
  const index = progressList.findIndex(
    (p) => p.track === record.track && p.lesson_id === record.lesson_id
  );

  const now = new Date().toISOString();
  const currentRecord = index >= 0 ? progressList[index] : null;

  const score = record.score !== undefined ? record.score : (record.completed ? 100 : 0);
  const attempts = currentRecord ? currentRecord.attempts + 1 : 1;
  const bestScore = currentRecord ? Math.max(currentRecord.best_score, score) : score;

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

  localStorage.setItem(STORAGE_KEY, JSON.stringify(progressList));
  updateStreak();

  // Moment A: Trigger email capture popup if newly completed a lesson
  if (record.completed && !wasAlreadyCompleted) {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("open-email-capture", { detail: { moment: "MomentA" } }));
    }, 1000);
  }
}

export function getStreak(): number {
  if (typeof window === "undefined") return 0;
  const saved = localStorage.getItem(STREAK_KEY);
  if (!saved) return 0;
  try {
    const data: UserStreak = JSON.parse(saved);
    const today = getTodayString();
    const lastDate = data.lastPracticedDate;

    if (today === lastDate) {
      return data.streak;
    }

    const diffDays = getDaysDiff(lastDate, today);
    if (diffDays <= 1) {
      return data.streak;
    } else {
      // Streak expired
      return 0;
    }
  } catch {
    return 0;
  }
}

function updateStreak(): void {
  if (typeof window === "undefined") return;
  const today = getTodayString();
  const saved = localStorage.getItem(STREAK_KEY);

  let currentStreak = 0;
  let lastDate = "";

  if (saved) {
    try {
      const data: UserStreak = JSON.parse(saved);
      currentStreak = data.streak;
      lastDate = data.lastPracticedDate;
    } catch {}
  }

  if (lastDate === today) {
    return;
  }

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

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

export function checkNextDayReturn(): boolean {
  if (typeof window === "undefined") return false;
  const today = getTodayString();
  const lastVisit = localStorage.getItem("tilawah_last_visit_date");
  if (!lastVisit) {
    localStorage.setItem("tilawah_last_visit_date", today);
    return false;
  }
  if (lastVisit < today) {
    localStorage.setItem("tilawah_last_visit_date", today);
    return true;
  }
  return false;
}

function getDaysDiff(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
