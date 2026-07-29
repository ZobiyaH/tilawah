import { TajweedRule } from "../../types";

export const TAJWEED_TIPS: Record<string, TajweedRule> = {
  "ال": {
    rule: "Lam Shamsiyyah",
    tip: "The Lam in 'Al-' is silent before sun letters (ش,س,ن,ر,ت,ث,د,ذ,ز,ظ,ض,ل,ص). Merge it into the next letter."
  },
  "نّ": {
    rule: "Ghunna (Shaddah on Noon)",
    tip: "Pronounce with a nasal sound from the nose for 2 counts (2 harakat)."
  },
  "مّ": {
    rule: "Ghunna (Shaddah on Meem)",
    tip: "A nasal humming sound for 2 counts through the nose."
  },
  "ن": {
    rule: "Noon Sakin Rules",
    tip: "Check for Idgham, Ikhfa, Iqlab, or Izhar depending on the next letter."
  },
  "ا": {
    rule: "Madd Tabii",
    tip: "Natural elongation - stretch the vowel for 2 counts (alef after fatha)."
  },
  "و": {
    rule: "Madd (Waw)",
    tip: "Elongate the Waw vowel for 2 counts naturally."
  },
  "ي": {
    rule: "Madd (Ya)",
    tip: "Elongate the Ya vowel for 2 counts naturally."
  },
  "ق": {
    rule: "Qalqala",
    tip: "The letter Qaf (ق) when sukoon - apply a slight echoing bounce."
  },
  "ط": {
    rule: "Qalqala",
    tip: "Ṭa with sukoon requires qalqala - a slight echo or bounce sound."
  },
  "ب": {
    rule: "Qalqala",
    tip: "Ba with sukoon requires qalqala."
  },
  "ج": {
    rule: "Qalqala",
    tip: "Jeem with sukoon requires qalqala."
  },
  "د": {
    rule: "Qalqala",
    tip: "Dal with sukoon requires qalqala."
  },
  "ر": {
    rule: "Letter Ra",
    tip: "Ra should be heavy (Tafkheem) with fatha/damma, and light (Tarqeeq) with kasra."
  }
};

export function detectTajweedIssue(spokenWord: string, referenceWord: string): TajweedRule | null {
  const cleanRef = referenceWord.replace(/[\u064B-\u065F]/g, "");
  if (!cleanRef) return null;

  // Lam Shamsiyyah only applies if the word starts with Al-
  if (cleanRef.startsWith("ال")) {
    return TAJWEED_TIPS["ال"];
  }

  const firstLetter = cleanRef[0];
  if (TAJWEED_TIPS[firstLetter]) {
    return TAJWEED_TIPS[firstLetter];
  }

  // Also check for specific rules triggered by substrings, excluding "ال"
  for (const [key, val] of Object.entries(TAJWEED_TIPS)) {
    if (key === "ال") continue;
    if (referenceWord.includes(key)) {
      return val;
    }
  }

  return null;
}
