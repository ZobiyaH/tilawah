import { normalizeArabic } from "./normalize";

let row1 = new Int32Array(128);
let row2 = new Int32Array(128);

/**
 * Fast Levenshtein edit distance between two Arabic strings.
 * Uses reused 1D typed arrays for zero GC allocation overhead.
 */
export function arabicLevenshtein(a: string, b: string): number {
  const na = normalizeArabic(a);
  const nb = normalizeArabic(b);
  if (na === nb) return 0;
  if (!na) return nb.length;
  if (!nb) return na.length;

  const m = na.length;
  const n = nb.length;

  if (n + 1 > row1.length) {
    row1 = new Int32Array(n + 64);
    row2 = new Int32Array(n + 64);
  }

  for (let j = 0; j <= n; j++) {
    row1[j] = j;
  }

  for (let i = 0; i < m; i++) {
    row2[0] = i + 1;
    const charA = na.charCodeAt(i);
    for (let j = 0; j < n; j++) {
      const cost = charA === nb.charCodeAt(j) ? 0 : 1;
      row2[j + 1] = Math.min(
        row2[j] + 1,
        row1[j + 1] + 1,
        row1[j] + cost
      );
    }
    for (let j = 0; j <= n; j++) {
      row1[j] = row2[j];
    }
  }

  return row1[n];
}