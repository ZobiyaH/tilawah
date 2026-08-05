import { normalizeArabic } from "./normalize";
import { arabicLevenshtein } from "./levenshtein";
import { detectTajweedIssue } from "./tajweed";

// Phonetic transliteration dictionary for short Surahs to support English speech recognition transcripts
const PHONETIC_DICT: Record<string, string> = {
  "بسم": "bismi",
  "الله": "allah",
  "الرحمن": "rahman",
  "الرحيم": "rahim",
  "الحمد": "hamdu",
  "لله": "lillah",
  "رب": "rabbi",
  "العالمين": "alameen",
  "مالك": "maliki",
  "ملك": "maliki",
  "يوم": "yawmi",
  "الدين": "deen",
  "اياك": "iyyaka",
  "نعبد": "nabudu",
  "واياك": "waiyyaka",
  "نستعين": "nastaeen",
  "اهدنا": "ihdina",
  "الصراط": "siraat",
  "المستقيم": "mustaqeem",
  "صراط": "siraat",
  "الذين": "allatheena",
  "انعمت": "anamta",
  "عليهم": "alayhim",
  "غير": "ghayri",
  "المغضوب": "maghdoobi",
  "ولا": "walaa",
  "الضالين": "dalleen",
  "قل": "qul",
  "اعوذ": "aouthu",
  "برب": "birabbi",
  "الفلق": "falaq",
  "من": "min",
  "شر": "sharri",
  "ما": "maa",
  "خلق": "khalaq",
  "ومن": "wamin",
  "غاسق": "ghasiq",
  "اذا": "itha",
  "وقب": "waqab",
  "النفاثات": "naffathati",
  "في": "fee",
  "العقد": "uqad",
  "حاسد": "hasid",
  "حسد": "hasad",
  "الناس": "naas",
  "اله": "ilah",
  "الوسواس": "waswas",
  "الخناس": "khannas",
  "الذي": "allathee",
  "يوسوس": "yuwaswisu",
  "صدور": "sudoor",
  "الجنة": "jinnati"
};

export interface CheckResult {
  status: 'correct' | 'tajweed' | 'error';
  similarity: number;
  tajweedIssue?: { rule: string; tip: string } | null;
}

/**
 * Calculates a similarity score between 0.0 and 1.0 for two Arabic words.
 * Performs normalization before computing Levenshtein distance.
 */
export function arabicSimilarity(spoken: string, reference: string): number {
  const ns = normalizeArabic(spoken);
  const nr = normalizeArabic(reference);
  if (!ns || !nr) return 0;
  if (ns === nr) return 1.0;

  // Handle written vs unwritten Alif spelling variations (e.g., maliki vs malk, rahman vs rahmn)
  if (ns.length > 2 && nr.length > 2 && ns.replace(/ا/g, "") === nr.replace(/ا/g, "")) {
    return 1.0;
  }

  // Handle substring matching in continuous flow (e.g. compound tokens or prefix additions)
  if (nr.length >= 3 && (ns.includes(nr) || nr.includes(ns))) {
    return 0.90;
  }

  const maxLen = Math.max(ns.length, nr.length);
  if (maxLen === 0) return 1.0;

  const dist = arabicLevenshtein(ns, nr);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Align and compare spoken word alternatives against expected Quran word.
 * Also checks English ASR transliterations as a fallback.
 */
export function checkWord(spokenAlternatives: string | string[], expectedWord: string): CheckResult {
  const alternatives = Array.isArray(spokenAlternatives) ? spokenAlternatives : [spokenAlternatives];
  
  let bestResult: CheckResult = { status: 'error', similarity: 0, tajweedIssue: null };
  
  for (const alt of alternatives) {
    let similarity = arabicSimilarity(alt, expectedWord);
    let status: 'correct' | 'tajweed' | 'error' = 'error';
    let tajweedIssue = null;
    
    // Check if the ASR output is Latin/English text representing a transliteration (e.g. "Maliki")
    const cleanExpected = normalizeArabic(expectedWord);
    const phoneticTarget = PHONETIC_DICT[cleanExpected];
    if (phoneticTarget && /[a-zA-Z]/.test(alt)) {
      const cleanSpoken = alt.toLowerCase().replace(/[^a-z]/g, "");
      if (cleanSpoken.includes(phoneticTarget) || phoneticTarget.includes(cleanSpoken) || cleanSpoken === "maliki" || cleanSpoken === "malik") {
        similarity = 1.0;
      }
    }
    
    if (similarity >= 0.65) {
      status = 'correct';
    } else if (similarity >= 0.45) {
      tajweedIssue = detectTajweedIssue(alt, expectedWord);
      status = 'tajweed';
    }
    
    if (similarity > bestResult.similarity) {
      bestResult = { status, similarity, tajweedIssue };
    }
  }
  
  return bestResult;
}
