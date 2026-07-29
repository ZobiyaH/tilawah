/**
 * Removes tashkeel (harakat) diacritics but keeps base Arabic letters.
 */
export function stripDiacritics(str: string): string {
  if (!str) return "";
  return str
    .replace(/[\u064B-\u065F\u0610-\u061A\u06D6-\u06ED\u0670\u06E5\u06E6]/g, "") // strip standard and Uthmani diacritics/stops/small letters
    .replace(/\u0640/g, "") // strip tatweel
    .replace(/[\u0671]/g, "ا") // normalize wasla to standard alef (so leading letters aren't lost)
    .trim();
}

/**
 * Normalizes Arabic letters (e.g., matching different forms of Hamza, Alef, Teh Marbuta, etc.)
 * and strips diacritics for clean comparison.
 */
export function normalizeArabic(str: string): string {
  if (!str) return "";
  return str
    .replace(/\u0670/g, "ا") // Map Uthmani Dagger Alif to standard Alef so مَٰلِكِ normalizes to مالك
    .replace(/[\u064B-\u065F\u0610-\u061A\u06D6-\u06ED\u06E5\u06E6]/g, "") // strip standard and Uthmani diacritics/stops
    .replace(/\u0640/g, "") // strip tatweel
    .replace(/[أإآٱ\u0671]/g, "ا") // normalize all Alef variants (including wasla)
    .replace(/ة/g, "ه") // normalize Teh Marbuta
    .replace(/ى/g, "ي") // normalize Alef Maksura
    .replace(/ؤ/g, "و") // normalize Waw with Hamza
    .replace(/ئ/g, "ي") // normalize Ya with Hamza
    .trim();
}

/**
 * Converts a regular number into Arabic numeral digits.
 */
export function toArabicNum(n: number | string): string {
  const map = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n)
    .split("")
    .map((d) => map[parseInt(d, 10)] || d)
    .join("");
}
