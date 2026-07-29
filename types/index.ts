export interface TajweedAnnotation {
  rule: 'ghunna' | 'madd' | 'qalqala' | 'idgham' | 'ikhfa' | 'iqlab' | 'izhar';
  description: string;
}

export interface Ayah {
  surahId: number;
  ayahNumber: number;
  arabic: string;
  words: string[];
  transliteration: string;
  translation: string;
  tajweedMap?: {
    [wordIndex: number]: TajweedAnnotation[];
  };
}

export interface WordToken {
  arabic: string;
  clean: string;
  ayahN: number;
  globalIdx: number;
  wordIdxInAyah: number;
  ayahIndex: number;
  ayahData: Ayah;
}

export interface FeedbackItem {
  id: string;
  type: 'correct' | 'error' | 'tajweed' | 'hint';
  title: string;
  message: string;
  timestamp: number;
}

export interface SessionResult {
  id: string;
  surahId: string;
  surahName: string;
  timestamp: number;
  accuracy: number;
  tajweed: number;
  fluency: number;
  overall: number;
  correctWords: number;
  totalWords: number;
}

export interface TajweedRule {
  rule: string;
  tip: string;
}

export interface SurahMetadata {
  id: string;
  number: number;
  name: string;
  englishName: string;
  totalAyat: number;
  isImplemented: boolean;
}
