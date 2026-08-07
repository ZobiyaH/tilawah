import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ink: "var(--ink)",
        parchment: "var(--parchment)",
        "parchment-dark": "var(--parchment-dark)",
        gold: "var(--gold)",
        "gold-light": "var(--gold-light)",
        "gold-pale": "var(--gold-pale)",
        emerald: "var(--emerald)",
        "emerald-light": "var(--emerald-light)",
        "emerald-pale": "var(--emerald-pale)",
        ruby: "var(--ruby)",
        "ruby-pale": "var(--ruby-pale)",
        sky: "var(--sky)",
        "sky-pale": "var(--sky-pale)",
        borderCustom: "var(--border)",
      },
      fontFamily: {
        amiri: ["Amiri", "serif"],
        "amiri-quran": ["var(--font-amiri-quran)", "Amiri Quran", "Amiri", "serif"],
        lato: ["Lato", "sans-serif"],
      },
      backgroundImage: {
        "geometric-pattern": "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23c8993c' stroke-opacity='0.06' stroke-width='0.5'%3E%3Cpolygon points='30,2 55,17 55,43 30,58 5,43 5,17'/%3E%3Cpolygon points='30,10 49,21 49,39 30,50 11,39 11,21'/%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        "pulse-word": "pulse-word 1.2s ease-in-out infinite",
        "shake-word": "shake-word 0.4s ease",
        "glow-green": "glow-green 1s ease infinite alternate",
        "mic-pulse": "mic-pulse 1.5s ease-in-out infinite",
      },
      keyframes: {
        "pulse-word": {
          "0%, 100%": { boxShadow: "0 0 0 2px var(--gold-light)" },
          "50%": { boxShadow: "0 0 0 4px var(--gold), 0 0 12px rgba(200,153,60,0.4)" },
        },
        "shake-word": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        "glow-green": {
          "from": { textShadow: "0 0 0 transparent" },
          "to": { textShadow: "0 0 16px rgba(30,94,74,0.5)" },
        },
        "mic-pulse": {
          "0%, 100%": { boxShadow: "0 6px 24px rgba(139,26,26,0.4), 0 0 0 0 rgba(139,26,26,0.3)" },
          "50%": { boxShadow: "0 6px 24px rgba(139,26,26,0.6), 0 0 0 18px rgba(139,26,26,0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
