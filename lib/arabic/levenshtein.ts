import { normalizeArabic } from "./normalize";

/**
 * Calculates the Levenshtein edit distance between two normalized Arabic strings.
 */
export function arabicLevenshtein(a: string, b: string): number {
  const na = normalizeArabic(a);
  const nb = normalizeArabic(b);
  const m = na.length;
  const n = nb.length;
  
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (na[i - 1] === nb[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}
