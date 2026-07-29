import { Ayah } from "../../types";
import quranJson from "../../data/quran-uthmani.json";
import { ALL_SURAHS } from "./surahs";

export { ALL_SURAHS };

export interface SurahData {
  name: string;
  ayat: Ayah[];
}

export const getSurahData = (surahId: string): SurahData | undefined => {
  const data = (quranJson as unknown as Record<string, SurahData>)[surahId];
  return data;
};
