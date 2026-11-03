/**
 * Phonetic English transliteration for Quranic Arabic words.
 * Used for mouth shape guides, pronunciation tooltips, and speech hints.
 */

const LETTER_MAP: Record<string, string> = {
  // Hamza & Alif variants
  "ء": "'",
  "آ": "aa",
  "أ": "a",
  "ؤ": "u",
  "إ": "i",
  "ئ": "i",
  "ا": "a",
  "\u0671": "a", // Alef Wasla
  "\u0670": "aa", // Dagger Alif

  // Consonants
  "ب": "b",
  "ت": "t",
  "ث": "th",
  "ج": "j",
  "ح": "h",
  "خ": "kh",
  "د": "d",
  "ذ": "dh",
  "ر": "r",
  "ز": "z",
  "س": "s",
  "ش": "sh",
  "ص": "s",
  "ض": "d",
  "ط": "t",
  "ظ": "z",
  "ع": "'a",
  "غ": "gh",
  "ف": "f",
  "ق": "q",
  "ك": "k",
  "ل": "l",
  "م": "m",
  "ن": "n",
  "ه": "h",
  "ة": "h",
  "و": "w",
  "ى": "a",
  "ي": "y",
};

/**
 * Common high-frequency Quran words with verified beautiful phonetic English
 */
const COMMON_WORD_PHONETICS: Record<string, string> = {
  "من": "min",
  "مِنْ": "min",
  "مِن": "min",
  "مِّن": "min",
  "مِّنَ": "minal",
  "عن": "‘an",
  "عَنْ": "‘an",
  "في": "fee",
  "فِي": "fee",
  "ما": "maa",
  "مَا": "maa",
  "لم": "lam",
  "لَمْ": "lam",
  "ولم": "wa-lam",
  "وَلَمْ": "wa-lam",
  "يكن": "yakun",
  "يَكُنِ": "yakuni",
  "الذين": "alladheena",
  "الَّذِينَ": "al-ladheena",
  "كفروا": "kafaroo",
  "كَفَرُوا": "kafaroo",
  "اهل": "ahli",
  "أَهْلِ": "ahli",
  "الكتاب": "al-kitaab",
  "الْكِتَابِ": "al-kitaabi",
  "والمشركين": "wal-mushrikeen",
  "وَالْمُشْرِكِينَ": "wal-mushrikeena",
  "منفكين": "munfakkeen",
  "مُنفَكِّينَ": "munfakkeena",
  "مُنْفَكِّينَ": "munfakkeena",
  "حتى": "hattaa",
  "حَتَّىٰ": "hattaa",
  "تاتيهم": "ta'teeyahum",
  "تَأْتِيَهُمُ": "ta'tiyahumu",
  "البينة": "al-bayyinah",
  "الْبَيِّنَةُ": "al-bayyinah",
  "رسول": "rasool",
  "رَسُولٌ": "rasoolun",
  "الله": "Allah",
  "اللَّهِ": "Allahi",
  "يتلو": "yatroo",
  "يَتْلُو": "yatlū",
  "صحفا": "suhufan",
  "صُحُفًا": "suhufan",
  "مطهرة": "mutahharah",
  "مُّطَهَّرَةً": "mutahharah",
  "فيها": "feehaa",
  "فِيهَا": "feehaa",
  "كتب": "kutubun",
  "كُتُبٌ": "kutubun",
  "قيمة": "qayyimah",
  "قَيِّمَةٌ": "qayyimah",
  "البرية": "al-bariyyah",
  "الْبَرِيَّةِ": "al-bariyyah",
  "خير": "khayru",
  "خَيْرُ": "khayru",
  "شر": "sharru",
  "شَرُّ": "sharru",
  "اولئك": "ulaa'ika",
  "أُولَٰئِكَ": "ulaa'ika",
  "هم": "hum",
  "هُمْ": "hum",
  "جزاؤهم": "jazaa'uhum",
  "جَزَاؤُهُمْ": "jazaa'uhum",
  "عند": "'inda",
  "عِندَ": "'inda",
  "ربهم": "rabbihim",
  "رَبِّهِمْ": "rabbihim",
  "جنات": "jannaatu",
  "جَنَّاتُ": "jannaatu",
  "عدن": "'adnin",
  "عَدْنٍ": "'adnin",
  "تجري": "tajree",
  "تَجْرِي": "tajree",
  "تحتها": "tahtihaa",
  "تَحْتِهَا": "tahtihaa",
  "الانهار": "al-anhaar",
  "الْأَنْهَارُ": "al-anhaaru",
  "خالدين": "khaalideena",
  "خَالِدِينَ": "khaalideena",
  "ابدا": "abadaa",
  "أَبَدًا": "abadaa",
  "رضي": "radiya",
  "رَّضِيَ": "radiya",
  "عنهم": "'anhum",
  "عَنْهُمْ": "'anhum",
  "ورضوا": "wa radoo",
  "وَرَضُوا": "wa radoo",
  "عنه": "'anhu",
  "عَنْهُ": "'anhu",
  "ذلك": "dhaalika",
  "ذَٰلِكَ": "dhaalika",
  "لمن": "liman",
  "لِمَنْ": "liman",
  "خشي": "khashiya",
  "خَشِيَ": "khashiya",
  "ربه": "rabbah",
  "رَبَّهُ": "rabbah",
};

/**
 * Convert any Arabic word into an intuitive English phonetic guide
 */
export function transliterateArabicWord(word: string): string {
  if (!word) return "";

  // 1. Check exact dictionary
  if (COMMON_WORD_PHONETICS[word]) {
    return COMMON_WORD_PHONETICS[word];
  }

  // 2. Check diacritic-free dictionary
  const rawLetters = word.replace(/[\u064B-\u065F\u0670\u06D6-\u06DC]/g, "").trim();
  if (COMMON_WORD_PHONETICS[rawLetters]) {
    return COMMON_WORD_PHONETICS[rawLetters];
  }

  // 3. Algorithmic fallback
  let res = "";
  const chars = Array.from(word);

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const next = chars[i + 1] || "";

    // Harakat
    if (c === "\u064E") {
      // Fatha
      res += next === "ا" || next === "ى" ? "" : "a";
    } else if (c === "\u0650") {
      // Kasra
      res += next === "ي" ? "" : "i";
    } else if (c === "\u064F") {
      // Damma
      res += next === "و" ? "" : "u";
    } else if (c === "\u0652") {
      // Sukoon (silent)
    } else if (c === "\u0651") {
      // Shaddah (double preceding consonant)
      const prev = res.slice(-1);
      if (prev && /[a-z]/i.test(prev)) {
        res += prev;
      }
    } else if (c === "\u064B") {
      // Tanwin Fath
      res += "an";
    } else if (c === "\u064D") {
      // Tanwin Kasr
      res += "in";
    } else if (c === "\u064C") {
      // Tanwin Damm
      res += "un";
    } else if (LETTER_MAP[c] !== undefined) {
      res += LETTER_MAP[c];
    }
  }

  const clean = res
    .replace(/aa+/g, "aa")
    .replace(/ee+/g, "ee")
    .replace(/oo+/g, "oo")
    .replace(/^al-?/, "al-")
    .trim();

  return clean || rawLetters;
}

