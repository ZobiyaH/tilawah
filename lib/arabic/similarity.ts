import { normalizeArabic } from "./normalize";
import { arabicLevenshtein } from "./levenshtein";
import { detectTajweedIssue } from "./tajweed";

// Phonetic transliteration dictionary for short Surahs to support English speech recognition transcripts
const PHONETIC_DICT: Record<string, string[]> = {
  // Al-Fatiha
  "بسم": ["bismi", "bism", "besm", "bismillah"],
  "الله": ["allah", "llah", "allahu", "allahi", "lillah", "lillahi"],
  "الرحمن": ["rahman", "arrahman", "alrahman", "rehman", "arrehman"],
  "الرحيم": ["rahim", "arrahim", "alrahim", "raheem", "arraheem"],
  "الحمد": ["hamd", "alhamd", "elhamd", "alhamdu"],
  "لله": ["lillah", "lillahi", "allah", "allahi"],
  "رب": ["rabb", "rab", "rabbi", "rabbal", "rabba"],
  "العالمين": ["alameen", "alalamin", "al-alamin", "alamein", "alamin"],
  "مالك": ["malik", "maliki", "maalik", "maaliki", "malki"],
  "ملك": ["malik", "maliki", "maalik", "maaliki"],
  "يوم": ["yawm", "yawmi", "yom", "yomi", "yawmid"],
  "الدين": ["deen", "addeen", "aldeen", "ad-deen"],
  "اياك": ["iyyak", "iyyaka", "eyak", "eyaka", "iyaka"],
  "نعبد": ["nabud", "nabudu", "naabudu", "nabudo"],
  "واياك": ["waiyyak", "waiyyaka", "wa-iyyaka", "weyak"],
  "نستعين": ["nastaeen", "nasta'een", "nasta'in", "nastain", "nasteen"],
  "اهدنا": ["ihdina", "ehdina", "ahdina", "ihdena"],
  "الصراط": "as-siraat siraat sirat assirat assiraat".split(" "),
  "المستقيم": "al-mustaqeem mustaqeem mustaqim almustaqim".split(" "),
  "صراط": "siraat sirat serat".split(" "),
  "الذين": "allatheena allazina allatheen allazeena".split(" "),
  "انعمت": "an'amta anamta an'amte anamte".split(" "),
  "عليهم": "alayhim alaihim aleyhim alayhum".split(" "),
  "غير": "ghayr ghayri ghaire ghair".split(" "),
  "المغضوب": "al-maghdoob maghdoob almaghdoobi maghdoobi".split(" "),
  "ولا": "wala walaa wa-laa".split(" "),
  "الضالين": "ad-daalleen dalleen daalleen addaalleen addaleen".split(" "),
  // Short Surahs & common words
  "قل": ["qul", "qool", "kul"],
  "هو": ["huwa", "hoo", "howa"],
  "احد": ["ahad", "ahadun", "ehad"],
  "الصمد": ["as-samad", "assamad", "samad"],
  "لم": ["lam", "lem"],
  "يلد": ["yalid", "yeled"],
  "ولم": ["walam", "wa-lam"],
  "يولد": ["yoolad", "yulad"],
  "يكن": ["yakun", "yekun"],
  "له": ["lahu", "lahoo"],
  "كفوا": ["kufuwan", "kufwan"],
  "اعوذ": ["a'oodhu", "a'udhu", "aouthu", "aoodhu"],
  "برب": ["birabbi", "bi-rabbi", "birab"],
  "الفلق": ["al-falaq", "alfalaq", "falaq"],
  "من": ["min", "men"],
  "شر": ["sharri", "sharr", "shar"],
  "ما": ["maa", "ma"],
  "خلق": ["khalaq", "khalaqa"],
  "ومن": ["wamin", "wa-min"],
  "غاسق": ["ghaasiq", "ghasiq"],
  "اذا": ["idha", "itha", "eza"],
  "وقب": ["waqab", "waqaba"],
  "النفاثات": ["an-naffaathaat", "naffathat"],
  "في": ["fee", "fi"],
  "العقد": ["al-uqad", "uqad"],
  "حاسد": ["haasid", "hasid"],
  "حسد": ["hasad", "hasada"],
  "الناس": ["an-naas", "al-naas", "naas", "annas"],
  "ملك الناس": ["malikin-naas", "malik annas"],
  "اله": ["ilaah", "ilah", "ilaahi"],
  "الوسواس": ["al-waswaas", "waswas", "alwaswas"],
  "الخناس": ["al-khannaas", "khannas", "alkhannas"],
  "الذي": ["alladhee", "allathee", "allazi"],
  "يوسوس": ["yuwaswisu", "yuwaswis"],
  "صدور": ["sudoor", "sudur"],
  "الجنة": ["al-jinnah", "jinnati", "aljinnah"]
};

export interface CheckResult {
  status: 'correct' | 'tajweed' | 'error';
  similarity: number;
  tajweedIssue?: { rule: string; tip: string } | null;
}

/**
 * Calculates a strict similarity score between 0.0 and 1.0 for two Arabic words.
 * Performs normalization before computing exact Levenshtein distance.
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

  // Prefix handling: only if stripped word matches reference closely
  if (ns.length === nr.length + 1 && (ns.startsWith("و") || ns.startsWith("ف") || ns.startsWith("ب") || ns.startsWith("ل") || ns.startsWith("ك"))) {
    const strippedPrefix = ns.slice(1);
    if (strippedPrefix === nr || strippedPrefix.replace(/ا/g, "") === nr.replace(/ا/g, "")) {
      return 0.90;
    }
  }

  const maxLen = Math.max(ns.length, nr.length);
  if (maxLen === 0) return 1.0;

  const dist = arabicLevenshtein(ns, nr);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Align and compare spoken word alternatives against expected Quran word.
 * Requires high phonetic accuracy (0.75+ for intermediate, 0.65+ for beginner).
 */
export function checkWord(
  spokenAlternatives: string | string[],
  expectedWord: string,
  recitationLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
  confidentReciterMode: boolean = false
): CheckResult {
  const alternatives = Array.isArray(spokenAlternatives) ? spokenAlternatives : [spokenAlternatives];
  
  let correctThreshold = 0.75;
  let tajweedThreshold = 0.55;

  if (recitationLevel === 'beginner' || confidentReciterMode) {
    correctThreshold = 0.65;
    tajweedThreshold = 0.45;
  } else if (recitationLevel === 'advanced') {
    correctThreshold = 0.85;
    tajweedThreshold = 0.70;
  }

  let bestResult: CheckResult = { status: 'error', similarity: 0, tajweedIssue: null };
  const cleanExpected = normalizeArabic(expectedWord);
  const phoneticTargets = PHONETIC_DICT[cleanExpected] || [];

  for (const alt of alternatives) {
    let similarity = arabicSimilarity(alt, expectedWord);
    let status: 'correct' | 'tajweed' | 'error' = 'error';
    let tajweedIssue = null;
    
    // Check if the ASR output is Latin/English text representing a transliteration
    if (/[a-zA-Z]/.test(alt)) {
      const cleanSpoken = alt.toLowerCase().replace(/[^a-z]/g, "");
      for (const target of phoneticTargets) {
        const cleanTarget = target.toLowerCase().replace(/[^a-z]/g, "");
        if (cleanSpoken === cleanTarget) {
          similarity = 1.0;
          break;
        } else if (cleanSpoken.length >= 3 && cleanTarget.length >= 3 && (cleanSpoken.startsWith(cleanTarget) || cleanTarget.startsWith(cleanSpoken))) {
          similarity = 0.85;
          break;
        }
      }
    }
    
    if (similarity >= correctThreshold) {
      status = 'correct';
    } else if (similarity >= tajweedThreshold) {
      tajweedIssue = detectTajweedIssue(alt, expectedWord);
      status = 'tajweed';
    }
    
    if (similarity > bestResult.similarity) {
      bestResult = { status, similarity, tajweedIssue };
    }
  }
  
  return bestResult;
}
