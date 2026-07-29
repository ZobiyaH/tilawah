// Global ayah numbers - each surah starts at this number
export const SURAH_STARTS: Record<number, number> = {
  1: 1,     // Al-Fatiha
  2: 8,     // Al-Baqarah
  3: 294,
  4: 494,
  5: 670,
  6: 790,
  7: 955,
  8: 1164,
  9: 1235,
  10: 1365,
  17: 2035, // Al-Isra
  18: 2135, // Al-Kahf
  36: 3706, // Ya-Sin
  47: 4545, // Muhammad
  55: 4905, // Ar-Rahman
  67: 5245, // Al-Mulk
  96: 6106, // Al-Alaq
  112: 6222,
  113: 6227,
  114: 6232,
};

export const RECITERS = {
  alafasy: {
    id: 'ar.alafasy',
    name: 'Mishary Al-Afasy',
    quality: 128,
  },
  husary: {
    id: 'ar.husary',
    name: 'Mahmoud Khalil Al-Husary',
    quality: 128,
  },
  abdulbasit: {
    id: 'ar.abdulbasitmurattal',
    name: 'Abdul Basit (Murattal)',
    quality: 128,
  },
  minshawi: {
    id: 'ar.minshawi',
    name: 'Mohamed Siddiq Al-Minshawi',
    quality: 128,
  },
};

// Get audio URL for a specific ayah
export function getAyahAudioURL(
  surahNumber: number,
  ayahNumber: number,
  reciterId: string = 'ar.alafasy'
): string {
  const surahStart = SURAH_STARTS[surahNumber];
  if (!surahStart) {
    console.warn(`Surah ${surahNumber} not in map`);
    return '';
  }
  const globalNumber = surahStart + ayahNumber - 1;
  return `https://cdn.islamic.network/quran/audio/128/${reciterId}/${globalNumber}.mp3`;
}

// For word-level audio - use audio.qurancdn.com
export function getWordAudioURL(
  surahNumber: number,
  ayahNumber: number, 
  wordPosition: number
): string {
  const s = String(surahNumber).padStart(3, '0');
  const a = String(ayahNumber).padStart(3, '0');
  const w = String(wordPosition).padStart(3, '0');
  return `https://audio.qurancdn.com/wbw/${s}_${a}_${w}.mp3`;
}

export const LETTER_AUDIO_MAP: Record<string, {
  letterName: string,
  soundGuide: string,
  phonetic: string,
  // Use first word of a Quranic ayah that starts with this letter:
  exampleAyah: { surah: number, ayah: number, word: number }
}> = {
  'ا': {
    letterName: 'أَلِف',
    soundGuide: 'Like "a" in arm - open throat sound',
    phonetic: 'alif',
    exampleAyah: { surah: 1, ayah: 2, word: 1 } // الحمد
  },
  'ب': {
    letterName: 'بَاء',
    soundGuide: 'Like "b" in book - lips together',
    phonetic: 'ba',
    exampleAyah: { surah: 1, ayah: 1, word: 1 } // بسم
  },
  'ت': {
    letterName: 'تَاء',
    soundGuide: 'Like "t" in top - tongue on upper teeth',
    phonetic: 'ta',
    exampleAyah: { surah: 111, ayah: 1, word: 1 } // تبت
  },
  'ث': {
    letterName: 'ثَاء',
    soundGuide: 'Like "th" in think - tongue between teeth',
    phonetic: 'tha',
    exampleAyah: { surah: 102, ayah: 8, word: 1 } // ثم
  },
  'ج': {
    letterName: 'جِيم',
    soundGuide: 'Like "j" in jam - back of tongue on palate',
    phonetic: 'jeem',
    exampleAyah: { surah: 110, ayah: 1, word: 2 } // جاء
  },
  'ح': {
    letterName: 'حَاء',
    soundGuide: 'Breathy H from deep in throat - not like English H',
    phonetic: 'ha',
    exampleAyah: { surah: 113, ayah: 5, word: 3 } // حاسد
  },
  'خ': {
    letterName: 'خَاء',
    soundGuide: 'Like "ch" in Scottish loch - raspy throat sound',
    phonetic: 'kha',
    exampleAyah: { surah: 2, ayah: 7, word: 1 } // ختم
  },
  'د': {
    letterName: 'دَال',
    soundGuide: 'Like "d" in door - tongue on upper teeth',
    phonetic: 'dal',
    exampleAyah: { surah: 109, ayah: 6, word: 2 } // دينكم
  },
  'ذ': {
    letterName: 'ذَال',
    soundGuide: 'Like "th" in this - voiced, tongue between teeth',
    phonetic: 'dhal',
    exampleAyah: { surah: 2, ayah: 2, word: 1 } // ذلك
  },
  'ر': {
    letterName: 'رَاء',
    soundGuide: 'Rolled R - tip of tongue vibrates on upper palate',
    phonetic: 'ra',
    exampleAyah: { surah: 1, ayah: 2, word: 3 } // رب
  },
  'ز': {
    letterName: 'زَاي',
    soundGuide: 'Like "z" in zoo - buzzing sound',
    phonetic: 'zay',
    exampleAyah: { surah: 99, ayah: 1, word: 2 } // زلزلت
  },
  'س': {
    letterName: 'سِين',
    soundGuide: 'Like "s" in sun - clear hissing sound',
    phonetic: 'seen',
    exampleAyah: { surah: 102, ayah: 3, word: 2 } // سوف
  },
  'ش': {
    letterName: 'شِين',
    soundGuide: 'Like "sh" in ship - tongue near palate',
    phonetic: 'sheen',
    exampleAyah: { surah: 113, ayah: 2, word: 2 } // شر
  },
  'ص': {
    letterName: 'صَاد',
    soundGuide: 'Heavy S - like "s" but tongue pressed down, deep sound',
    phonetic: 'sad',
    exampleAyah: { surah: 1, ayah: 7, word: 1 } // صراط
  },
  'ض': {
    letterName: 'ضَاد',
    soundGuide: 'Unique Arabic sound - heavy D, sides of tongue on molars',
    phonetic: 'dad',
    exampleAyah: { surah: 1, ayah: 7, word: 9 } // الضالين
  },
  'ط': {
    letterName: 'طَاء',
    soundGuide: 'Heavy T - tongue pressed down, deeper than regular T',
    phonetic: 'ta heavy',
    exampleAyah: { surah: 2, ayah: 15, word: 6 } // طغيانهم
  },
  'ظ': {
    letterName: 'ظَاء',
    soundGuide: 'Heavy Th - like "th" in this but heavy and deep',
    phonetic: 'dha',
    exampleAyah: { surah: 2, ayah: 17, word: 15 } // ظلمات
  },
  'ع': {
    letterName: 'عَين',
    soundGuide: 'Deep throat squeeze - unique Arabic sound, no English equivalent',
    phonetic: 'ayn',
    exampleAyah: { surah: 1, ayah: 7, word: 4 } // عليهم
  },
  'غ': {
    letterName: 'غَين',
    soundGuide: 'Like French R - gargling at back of throat',
    phonetic: 'ghayn',
    exampleAyah: { surah: 1, ayah: 7, word: 5 } // غير
  },
  'ف': {
    letterName: 'فَاء',
    soundGuide: 'Like "f" in far - upper teeth on lower lip',
    phonetic: 'fa',
    exampleAyah: { surah: 114, ayah: 5, word: 3 } // في
  },
  'ق': {
    letterName: 'قَاف',
    soundGuide: 'Deep K - back of tongue on very back of palate',
    phonetic: 'qaf',
    exampleAyah: { surah: 112, ayah: 1, word: 1 } // قل
  },
  'ك': {
    letterName: 'كَاف',
    soundGuide: 'Like "k" in king - back of tongue on palate',
    phonetic: 'kaf',
    exampleAyah: { surah: 102, ayah: 3, word: 1 } // كلا
  },
  'ل': {
    letterName: 'لَام',
    soundGuide: 'Like "l" in light - tip of tongue on upper palate',
    phonetic: 'lam',
    exampleAyah: { surah: 1, ayah: 2, word: 2 } // لله
  },
  'م': {
    letterName: 'مِيم',
    soundGuide: 'Like "m" in moon - lips closed, voice through nose',
    phonetic: 'meem',
    exampleAyah: { surah: 1, ayah: 4, word: 1 } // مالك
  },
  'ن': {
    letterName: 'نُون',
    soundGuide: 'Like "n" in noon - tip of tongue on upper palate',
    phonetic: 'noon',
    exampleAyah: { surah: 1, ayah: 5, word: 4 } // نستعين
  },
  'ه': {
    letterName: 'هَاء',
    soundGuide: 'Soft H - gentle breath from throat, like "h" in hello',
    phonetic: 'ha soft',
    exampleAyah: { surah: 112, ayah: 1, word: 2 } // هو
  },
  'و': {
    letterName: 'وَاو',
    soundGuide: 'Like "w" in water - rounded lips',
    phonetic: 'waw',
    exampleAyah: { surah: 1, ayah: 5, word: 3 } // وإياك
  },
  'ي': {
    letterName: 'يَاء',
    soundGuide: 'Like "y" in yes - tongue near palate',
    phonetic: 'ya',
    exampleAyah: { surah: 1, ayah: 4, word: 2 } // يوم
  },
};
