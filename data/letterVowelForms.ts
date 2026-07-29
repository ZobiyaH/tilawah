export interface VowelExample {
  display: string;
  sound: string;
  example: {
    word: string;
    meaning: string;
    surah: number;
    ayah: number;
    wordPosition: number; // 1-indexed word position within the ayah for getWordAudioURL()
  };
}

export interface LetterVowelFormGroup {
  withFatha: VowelExample;
  withKasra: VowelExample;
  withDamma: VowelExample;
  withSukoon: VowelExample;
  withShadda: VowelExample;
  withMaddAlif: VowelExample;
}

export const LETTER_VOWEL_FORMS: Record<string, LetterVowelFormGroup> = {
  'ا': {
    withFatha: { display: 'أَ', sound: 'a', example: { word: 'أَمَرَ', meaning: 'He commanded', surah: 96, ayah: 9, wordPosition: 2 } },
    withKasra: { display: 'إِ', sound: 'i', example: { word: 'إِذَا', meaning: 'When', surah: 110, ayah: 1, wordPosition: 2 } },
    withDamma: { display: 'أُ', sound: 'u', example: { word: 'أُنْزِلَ', meaning: 'Was revealed', surah: 97, ayah: 1, wordPosition: 3 } },
    withSukoon: { display: 'أْ', sound: 'a (glottal stop)', example: { word: 'يَأْكُلُ', meaning: 'He eats', surah: 105, ayah: 5, wordPosition: 2 } },
    withShadda: { display: 'أَّ', sound: 'a-a (doubled stop)', example: { word: 'تَأَخَّرَ', meaning: 'He delayed', surah: 48, ayah: 2, wordPosition: 5 } },
    withMaddAlif: { display: 'آ', sound: 'aa (long a)', example: { word: 'آَمَنَ', meaning: 'He believed', surah: 2, ayah: 260, wordPosition: 14 } },
  },
  'ب': {
    withFatha: { display: 'بَ', sound: 'ba', example: { word: 'بَلَدِ', meaning: 'City', surah: 95, ayah: 3, wordPosition: 2 } },
    withKasra: { display: 'بِ', sound: 'bi', example: { word: 'بِسْمِ', meaning: 'In the name of', surah: 1, ayah: 1, wordPosition: 1 } },
    withDamma: { display: 'بُ', sound: 'bu', example: { word: 'بُيُوتَ', meaning: 'Houses', surah: 2, ayah: 189, wordPosition: 23 } },
    withSukoon: { display: 'بْ', sound: 'b (stopped)', example: { word: 'أَصْحَابُ', meaning: 'Companions', surah: 105, ayah: 1, wordPosition: 3 } },
    withShadda: { display: 'بَّ', sound: 'bba (doubled)', example: { word: 'رَبَّنَا', meaning: 'Our Lord', surah: 2, ayah: 127, wordPosition: 10 } },
    withMaddAlif: { display: 'بَا', sound: 'baa (long)', example: { word: 'بَابٌ', meaning: 'Gate', surah: 2, ayah: 58, wordPosition: 11 } },
  },
  'ت': {
    withFatha: { display: 'تَ', sound: 'ta', example: { word: 'تَبَّتْ', meaning: 'Ruined were', surah: 111, ayah: 1, wordPosition: 1 } },
    withKasra: { display: 'تِ', sound: 'ti', example: { word: 'تِلْكَ', meaning: 'Those', surah: 2, ayah: 253, wordPosition: 1 } },
    withDamma: { display: 'تُ', sound: 'tu', example: { word: 'تُرَابٍ', meaning: 'Dust', surah: 18, ayah: 37, wordPosition: 11 } },
    withSukoon: { display: 'تْ', sound: 't (stopped)', example: { word: 'فَتْحٌ', meaning: 'Victory', surah: 110, ayah: 1, wordPosition: 3 } },
    withShadda: { display: 'تَّ', sound: 'tta (doubled)', example: { word: 'تَتَّقُونَ', meaning: 'You guard against evil', surah: 2, ayah: 21, wordPosition: 11 } },
    withMaddAlif: { display: 'تَا', sound: 'taa (long)', example: { word: 'تَابَ', meaning: 'He repented', surah: 2, ayah: 37, wordPosition: 7 } },
  },
  'ث': {
    withFatha: { display: 'ثَ', sound: 'tha', example: { word: 'ثَمَنًا', meaning: 'Price', surah: 2, ayah: 41, wordPosition: 12 } },
    withKasra: { display: 'ثِ', sound: 'thi', example: { word: 'ثِيَابَكَ', meaning: 'Your garments', surah: 74, ayah: 4, wordPosition: 1 } },
    withDamma: { display: 'ثُ', sound: 'thu', example: { word: 'ثُلُثَا', meaning: 'Two-thirds', surah: 73, ayah: 20, wordPosition: 12 } },
    withSukoon: { display: 'ثْ', sound: 'th (stopped)', example: { word: 'مِثْقَالَ', meaning: 'Weight of', surah: 99, ayah: 7, wordPosition: 3 } },
    withShadda: { display: 'ثَّ', sound: 'ttha (doubled)', example: { word: 'ثُمَّ', meaning: 'Then', surah: 102, ayah: 3, wordPosition: 1 } },
    withMaddAlif: { display: 'ثَا', sound: 'thaa (long)', example: { word: 'ثَالِثُ', meaning: 'Third', surah: 18, ayah: 22, wordPosition: 8 } },
  },
  'ج': {
    withFatha: { display: 'جَ', sound: 'ja', example: { word: 'جَعَلَ', meaning: 'He made', surah: 105, ayah: 2, wordPosition: 3 } },
    withKasra: { display: 'جِ', sound: 'ji', example: { word: 'جِبَالُ', meaning: 'Mountains', surah: 78, ayah: 20, wordPosition: 2 } },
    withDamma: { display: 'جُ', sound: 'ju', example: { word: 'جُنُودُ', meaning: 'Hosts/Forces', surah: 85, ayah: 17, wordPosition: 3 } },
    withSukoon: { display: 'جْ', sound: 'j (stopped)', example: { word: 'فَجْرِ', meaning: 'Dawn', surah: 97, ayah: 5, wordPosition: 4 } },
    withShadda: { display: 'جَّ', sound: 'jja (doubled)', example: { word: 'حَجَّ', meaning: 'He performed pilgrimage', surah: 2, ayah: 158, wordPosition: 19 } },
    withMaddAlif: { display: 'جَا', sound: 'jaa (long)', example: { word: 'جَاءَ', meaning: 'Came', surah: 110, ayah: 1, wordPosition: 1 } },
  },
  'ح': {
    withFatha: { display: 'حَ', sound: 'ha', example: { word: 'حَسَدَ', meaning: 'He envied', surah: 113, ayah: 5, wordPosition: 4 } },
    withKasra: { display: 'حِ', sound: 'hi', example: { word: 'حِجَارَةٍ', meaning: 'Stones', surah: 105, ayah: 4, wordPosition: 3 } },
    withDamma: { display: 'حُ', sound: 'hu', example: { word: 'حُبًّا', meaning: 'Love', surah: 89, ayah: 20, wordPosition: 2 } },
    withSukoon: { display: 'حْ', sound: 'h (stopped)', example: { word: 'الْحَمْدُ', meaning: 'All praise', surah: 1, ayah: 2, wordPosition: 1 } },
    withShadda: { display: 'حَّ', sound: 'hha (doubled)', example: { word: 'الرَّحْمَنِ', meaning: 'The Most Merciful', surah: 1, ayah: 1, wordPosition: 3 } },
    withMaddAlif: { display: 'حَا', sound: 'haa (long)', example: { word: 'حَافِظِينَ', meaning: 'Guardians', surah: 15, ayah: 9, wordPosition: 6 } },
  },
  'خ': {
    withFatha: { display: 'خَ', sound: 'kha', example: { word: 'خَلَقَ', meaning: 'He created', surah: 96, ayah: 1, wordPosition: 2 } },
    withKasra: { display: 'خِ', sound: 'khi', example: { word: 'خِفْتُمْ', meaning: 'You feared', surah: 2, ayah: 239, wordPosition: 3 } },
    withDamma: { display: 'خُ', sound: 'khu', example: { word: 'خُسْرٍ', meaning: 'Loss', surah: 103, ayah: 2, wordPosition: 3 } },
    withSukoon: { display: 'خْ', sound: 'kh (stopped)', example: { word: 'يَخْرُجُ', meaning: 'It emerges', surah: 86, ayah: 6, wordPosition: 1 } },
    withShadda: { display: 'خَّ', sound: 'kkha (doubled)', example: { word: 'سَخَّرَ', meaning: 'He subjected', surah: 13, ayah: 2, wordPosition: 15 } },
    withMaddAlif: { display: 'خَا', sound: 'khaa (long)', example: { word: 'خَالِقُ', meaning: 'Creator of', surah: 6, ayah: 102, wordPosition: 8 } },
  },
  'د': {
    withFatha: { display: 'دَ', sound: 'da', example: { word: 'دَخَلُوا', meaning: 'They entered', surah: 110, ayah: 2, wordPosition: 3 } },
    withKasra: { display: 'دِ', sound: 'di', example: { word: 'دِينِ', meaning: 'Religion', surah: 110, ayah: 2, wordPosition: 4 } },
    withDamma: { display: 'دُ', sound: 'du', example: { word: 'دُعَاءً', meaning: 'Call/Prayer', surah: 2, ayah: 171, wordPosition: 17 } },
    withSukoon: { display: 'دْ', sound: 'd (stopped)', example: { word: 'قَدْ', meaning: 'Indeed', surah: 91, ayah: 9, wordPosition: 1 } },
    withShadda: { display: 'دَّ', sound: 'dda (doubled)', example: { word: 'شَدِيدُ', meaning: 'Severe', surah: 2, ayah: 165, wordPosition: 26 } },
    withMaddAlif: { display: 'دَا', sound: 'daa (long)', example: { word: 'دَائِبَيْنِ', meaning: 'Both constant', surah: 14, ayah: 33, wordPosition: 5 } },
  },
  'ذ': {
    withFatha: { display: 'ذَ', sound: 'dha', example: { word: 'ذَهَبَ', meaning: 'He went away', surah: 2, ayah: 17, wordPosition: 9 } },
    withKasra: { display: 'ذِ', sound: 'dhi', example: { word: 'ذِكْرُ', meaning: 'Remembrance', surah: 21, ayah: 2, wordPosition: 3 } },
    withDamma: { display: 'ذُ', sound: 'dhu', example: { word: 'ذُو', meaning: 'Owner of', surah: 85, ayah: 15, wordPosition: 1 } },
    withSukoon: { display: 'ذْ', sound: 'dh (stopped)', example: { word: 'يَذْهَبَ', meaning: 'He takes away', surah: 2, ayah: 20, wordPosition: 16 } },
    withShadda: { display: 'ذَّ', sound: 'ddha (doubled)', example: { word: 'كَذَّبَ', meaning: 'He denied', surah: 92, ayah: 16, wordPosition: 1 } },
    withMaddAlif: { display: 'ذَا', sound: 'dhaa (long)', example: { word: 'هَذَا', meaning: 'This', surah: 95, ayah: 3, wordPosition: 1 } },
  },
  'ر': {
    withFatha: { display: 'رَ', sound: 'ra', example: { word: 'رَبِّ', meaning: 'Lord of', surah: 1, ayah: 2, wordPosition: 3 } },
    withKasra: { display: 'رِ', sound: 'ri', example: { word: 'رِجَالٌ', meaning: 'Men', surah: 24, ayah: 37, wordPosition: 1 } },
    withDamma: { display: 'رُ', sound: 'ru', example: { word: 'رُسُلُنَا', meaning: 'Our messengers', surah: 5, ayah: 32, wordPosition: 19 } },
    withSukoon: { display: 'رْ', sound: 'r (stopped)', example: { word: 'اِقْرَأْ', meaning: 'Read', surah: 96, ayah: 1, wordPosition: 1 } },
    withShadda: { display: 'رَّ', sound: 'rra (doubled)', example: { word: 'الرَّحِيمِ', meaning: 'Especially Merciful', surah: 1, ayah: 1, wordPosition: 4 } },
    withMaddAlif: { display: 'رَا', sound: 'raa (long)', example: { word: 'صِرَاطَ', meaning: 'Path of', surah: 1, ayah: 7, wordPosition: 1 } },
  },
  'ز': {
    withFatha: { display: 'زَ', sound: 'za', example: { word: 'زَلْزَلَتِهَا', meaning: 'Its earthquake', surah: 99, ayah: 1, wordPosition: 3 } },
    withKasra: { display: 'زِ', sound: 'zi', example: { word: 'زِينَةُ', meaning: 'Adornment', surah: 18, ayah: 46, wordPosition: 3 } },
    withDamma: { display: 'زُ', sound: 'zu', example: { word: 'زُيِّنَ', meaning: 'Was made fair-seeming', surah: 2, ayah: 212, wordPosition: 1 } },
    withSukoon: { display: 'زْ', sound: 'z (stopped)', example: { word: 'رِزْقًا', meaning: 'Provision', surah: 2, ayah: 22, wordPosition: 19 } },
    withShadda: { display: 'زَّ', sound: 'zza (doubled)', example: { word: 'عَزَّ', meaning: 'He prevailed/Mighty', surah: 2, ayah: 209, wordPosition: 11 } },
    withMaddAlif: { display: 'زَا', sound: 'zaa (long)', example: { word: 'مِيزَانُ', meaning: 'Balance', surah: 55, ayah: 7, wordPosition: 5 } },
  },
  'س': {
    withFatha: { display: 'سَ', sound: 'sa', example: { word: 'سَجَى', meaning: 'It becomes still', surah: 93, ayah: 2, wordPosition: 2 } },
    withKasra: { display: 'سِ', sound: 'si', example: { word: 'سِجِّيلٍ', meaning: 'Baked clay', surah: 105, ayah: 4, wordPosition: 4 } },
    withDamma: { display: 'سُ', sound: 'su', example: { word: 'سُبْحَانَ', meaning: 'Glory be to', surah: 17, ayah: 1, wordPosition: 1 } },
    withSukoon: { display: 'سْ', sound: 's (stopped)', example: { word: 'بِسْمِ', meaning: 'In the name of', surah: 1, ayah: 1, wordPosition: 1 } },
    withShadda: { display: 'سَّ', sound: 'ssa (doubled)', example: { word: 'الظَّنَّ', meaning: 'The assumption', surah: 49, ayah: 12, wordPosition: 4 } }, // using generalized shadda
    withMaddAlif: { display: 'سَا', sound: 'saa (long)', example: { word: 'سَاعَةً', meaning: 'An hour', surah: 10, ayah: 45, wordPosition: 8 } },
  },
  'ش': {
    withFatha: { display: 'شَ', sound: 'sha', example: { word: 'شَرِّ', meaning: 'Evil of', surah: 113, ayah: 2, wordPosition: 2 } },
    withKasra: { display: 'شِ', sound: 'shi', example: { word: 'شِتَاءِ', meaning: 'Winter', surah: 106, ayah: 2, wordPosition: 3 } },
    withDamma: { display: 'شُ', sound: 'shu', example: { word: 'شُهَدَاءَ', meaning: 'Witnesses', surah: 2, ayah: 23, wordPosition: 10 } },
    withSukoon: { display: 'شْ', sound: 'sh (stopped)', example: { word: 'مَشْهَدِ', meaning: 'Meeting place', surah: 19, ayah: 37, wordPosition: 10 } },
    withShadda: { display: 'شَّ', sound: 'ssha (doubled)', example: { word: 'بَشَّرَ', meaning: 'He gave glad tidings', surah: 3, ayah: 39, wordPosition: 10 } },
    withMaddAlif: { display: 'شَا', sound: 'shaa (long)', example: { word: 'شَاءَ', meaning: 'He willed', surah: 76, ayah: 30, wordPosition: 3 } },
  },
  'ص': {
    withFatha: { display: 'صَ', sound: 'sa (heavy)', example: { word: 'صَدَقَ', meaning: 'He spoke truth', surah: 3, ayah: 95, wordPosition: 2 } },
    withKasra: { display: 'صِ', sound: 'si (heavy)', example: { word: 'صِرَاطَ', meaning: 'Path of', surah: 1, ayah: 7, wordPosition: 1 } },
    withDamma: { display: 'صُ', sound: 'su (heavy)', example: { word: 'صُدُورِ', meaning: 'Breasts', surah: 114, ayah: 5, wordPosition: 3 } },
    withSukoon: { display: 'صْ', sound: 's (heavy stopped)', example: { word: 'أَصْحَابُ', meaning: 'Companions', surah: 105, ayah: 1, wordPosition: 3 } },
    withShadda: { display: 'صَّ', sound: 'ssad (doubled)', example: { word: 'فَصَّلَ', meaning: 'He explained in detail', surah: 6, ayah: 119, wordPosition: 6 } },
    withMaddAlif: { display: 'صَا', sound: 'saa (heavy long)', example: { word: 'صَابِرِينَ', meaning: 'Patient ones', surah: 2, ayah: 153, wordPosition: 12 } },
  },
  'ض': {
    withFatha: { display: 'ضَ', sound: 'da (heavy)', example: { word: 'ضَرَبَ', meaning: 'He set forth', surah: 14, ayah: 24, wordPosition: 3 } },
    withKasra: { display: 'ضِ', sound: 'di (heavy)', example: { word: 'ضِعْفَيْنِ', meaning: 'Double', surah: 7, ayah: 38, wordPosition: 22 } },
    withDamma: { display: 'ضُ', sound: 'du (heavy)', example: { word: 'ضُرِبَتْ', meaning: 'Was struck/pitched', surah: 2, ayah: 61, wordPosition: 36 } },
    withSukoon: { display: 'ضْ', sound: 'd (heavy stopped)', example: { word: 'مَغْضُوبِ', meaning: 'Earned anger', surah: 1, ayah: 7, wordPosition: 4 } },
    withShadda: { display: 'ضَّ', sound: 'ddad (doubled)', example: { word: 'عَضَّ', meaning: 'He bit', surah: 25, ayah: 27, wordPosition: 3 } },
    withMaddAlif: { display: 'ضَا', sound: 'daa (heavy long)', example: { word: 'الضَّالِّينَ', meaning: 'Those astray', surah: 1, ayah: 7, wordPosition: 9 } },
  },
  'ط': {
    withFatha: { display: 'طَ', sound: 'ta (heavy)', example: { word: 'طَبَقًا', meaning: 'Stage/State', surah: 84, ayah: 19, wordPosition: 2 } },
    withKasra: { display: 'طِ', sound: 'ti (heavy)', example: { word: 'طِينٍ', meaning: 'Clay', surah: 105, ayah: 4, wordPosition: 5 } },
    withDamma: { display: 'طُ', sound: 'tu (heavy)', example: { word: 'طُوًى', meaning: 'Tuwa (valley)', surah: 20, ayah: 12, wordPosition: 10 } },
    withSukoon: { display: 'طْ', sound: 't (heavy stopped)', example: { word: 'مَطْلَعِ', meaning: 'Rise of', surah: 97, ayah: 5, wordPosition: 2 } },
    withShadda: { display: 'طَّ', sound: 'tta (heavy doubled)', example: { word: 'بَطَشَ', meaning: 'He seized', surah: 85, ayah: 12, wordPosition: 4 } },
    withMaddAlif: { display: 'طَا', sound: 'taa (heavy long)', example: { word: 'طَائِرُكُمْ', meaning: 'Your omen', surah: 27, ayah: 47, wordPosition: 4 } },
  },
  'ظ': {
    withFatha: { display: 'ظَ', sound: 'dha (heavy)', example: { word: 'ظَهَرَ', meaning: 'Appeared', surah: 30, ayah: 41, wordPosition: 1 } },
    withKasra: { display: 'ظِ', sound: 'dhi (heavy)', example: { word: 'ظِلٍّ', meaning: 'Shadow', surah: 77, ayah: 30, wordPosition: 3 } },
    withDamma: { display: 'ظُ', sound: 'dhu (heavy)', example: { word: 'ظُلْمٌ', meaning: 'Injustice/Wrong', surah: 2, ayah: 254, wordPosition: 15 } },
    withSukoon: { display: 'ظْ', sound: 'dh (heavy stopped)', example: { word: 'يُظْهِرَهُ', meaning: 'He makes it prevail', surah: 9, ayah: 33, wordPosition: 11 } },
    withShadda: { display: 'ظَّ', sound: 'ddha (heavy doubled)', example: { word: 'عَظَّمَ', meaning: 'He honored', surah: 22, ayah: 30, wordPosition: 4 } },
    withMaddAlif: { display: 'ظَا', sound: 'dhaa (heavy long)', example: { word: 'مَوْعِظَةٌ', meaning: 'Instruction/Admonition', surah: 2, ayah: 275, wordPosition: 25 } },
  },
  'ع': {
    withFatha: { display: 'عَ', sound: 'ayn', example: { word: 'عَلِمَ', meaning: 'He knew', surah: 96, ayah: 5, wordPosition: 3 } },
    withKasra: { display: 'عِ', sound: 'i (throat)', example: { word: 'عِلْمٍ', meaning: 'Knowledge', surah: 6, ayah: 119, wordPosition: 20 } },
    withDamma: { display: 'عُ', sound: 'u (throat)', example: { word: 'عُنُقِكَ', meaning: 'Your neck', surah: 17, ayah: 29, wordPosition: 4 } },
    withSukoon: { display: 'عْ', sound: 'ayn (stopped)', example: { word: 'نَعْبُدُ', meaning: 'We worship', surah: 1, ayah: 5, wordPosition: 2 } },
    withShadda: { display: 'عَّ', sound: 'a-ayn (doubled)', example: { word: 'دَعَّ', meaning: 'He repulsed', surah: 107, ayah: 2, wordPosition: 2 } },
    withMaddAlif: { display: 'عَا', sound: 'aa (throat long)', example: { word: 'الْعَالَمِينَ', meaning: 'The Worlds', surah: 1, ayah: 2, wordPosition: 4 } },
  },
  'غ': {
    withFatha: { display: 'غَ', sound: 'gha', example: { word: 'غَيْرِ', meaning: 'Not/Other than', surah: 1, ayah: 7, wordPosition: 3 } },
    withKasra: { display: 'غِ', sound: 'ghi', example: { word: 'غِلٍّ', meaning: 'Rancor/Resentment', surah: 7, ayah: 43, wordPosition: 6 } },
    withDamma: { display: 'غُ', sound: 'ghu', example: { word: 'غُرَابًا', meaning: 'A crow', surah: 5, ayah: 31, wordPosition: 3 } },
    withSukoon: { display: 'غْ', sound: 'gh (stopped)', example: { word: 'الْمَغْضُوبِ', meaning: 'Earned anger', surah: 1, ayah: 7, wordPosition: 4 } },
    withShadda: { display: 'غَّ', sound: 'ggha (doubled)', example: { word: 'بَلَّغَ', meaning: 'He conveyed', surah: 5, ayah: 67, wordPosition: 11 } },
    withMaddAlif: { display: 'غَا', sound: 'ghaa (long)', example: { word: 'غَائِبِينَ', meaning: 'Absent ones', surah: 7, ayah: 7, wordPosition: 6 } },
  },
  'ف': {
    withFatha: { display: 'فَ', sound: 'fa', example: { word: 'فَتَحْنَا', meaning: 'We opened', surah: 48, ayah: 1, wordPosition: 3 } },
    withKasra: { display: 'فِ', sound: 'fi', example: { word: 'فِي', meaning: 'In/Within', surah: 114, ayah: 5, wordPosition: 2 } },
    withDamma: { display: 'فُ', sound: 'fu', example: { word: 'فُومِهَا', meaning: 'Its garlic', surah: 2, ayah: 61, wordPosition: 22 } },
    withSukoon: { display: 'فْ', sound: 'f (stopped)', example: { word: 'أَفْوَاجًا', meaning: 'Crowds/Multitudes', surah: 110, ayah: 2, wordPosition: 5 } },
    withShadda: { display: 'فَّ', sound: 'ffa (doubled)', example: { word: 'خَفَّفَ', meaning: 'He lightened', surah: 8, ayah: 66, wordPosition: 2 } },
    withMaddAlif: { display: 'فَا', sound: 'faa (long)', example: { word: 'فَاكِهَةٌ', meaning: 'Fruit', surah: 36, ayah: 57, wordPosition: 1 } },
  },
  'ق': {
    withFatha: { display: 'قَ', sound: 'qa', example: { word: 'قَالَ', meaning: 'He said', surah: 2, ayah: 30, wordPosition: 2 } },
    withKasra: { display: 'قِ', sound: 'qi', example: { word: 'قِيلَ', meaning: 'Was said', surah: 2, ayah: 11, wordPosition: 2 } },
    withDamma: { display: 'قُ', sound: 'qu', example: { word: 'قُلْ', meaning: 'Say', surah: 112, ayah: 1, wordPosition: 1 } },
    withSukoon: { display: 'قْ', sound: 'q (stopped)', example: { word: 'تَقْوِيمٍ', meaning: 'Stature/Mold', surah: 95, ayah: 4, wordPosition: 6 } },
    withShadda: { display: 'قَّ', sound: 'qqa (doubled)', example: { word: 'حَقَّ', meaning: 'Became true', surah: 36, ayah: 7, wordPosition: 2 } },
    withMaddAlif: { display: 'قَا', sound: 'qaa (long)', example: { word: 'الْقَارِعَةُ', meaning: 'The striking calamity', surah: 101, ayah: 1, wordPosition: 1 } },
  },
  'ك': {
    withFatha: { display: 'كَ', sound: 'ka', example: { word: 'كَتَبَ', meaning: 'He prescribed', surah: 6, ayah: 12, wordPosition: 13 } },
    withKasra: { display: 'كِ', sound: 'ki', example: { word: 'كِتَابٌ', meaning: 'Book', surah: 2, ayah: 2, wordPosition: 2 } },
    withDamma: { display: 'كُ', sound: 'ku', example: { word: 'كُتِبَ', meaning: 'Was prescribed', surah: 2, ayah: 183, wordPosition: 1 } },
    withSukoon: { display: 'كْ', sound: 'k (stopped)', example: { word: 'يَكْتُبُونَ', meaning: 'They write', surah: 2, ayah: 79, wordPosition: 13 } },
    withShadda: { display: 'كَّ', sound: 'kka (doubled)', example: { word: 'فَكَّرَ', meaning: 'He thought', surah: 74, ayah: 18, wordPosition: 2 } },
    withMaddAlif: { display: 'كَا', sound: 'kaa (long)', example: { word: 'كَانَ', meaning: 'He was', surah: 2, ayah: 34, wordPosition: 11 } },
  },
  'ل': {
    withFatha: { display: 'لَ', sound: 'la', example: { word: 'لَهَبٍ', meaning: 'Flame', surah: 111, ayah: 1, wordPosition: 4 } },
    withKasra: { display: 'لِ', sound: 'li', example: { word: 'لِلنَّاسِ', meaning: 'For the people', surah: 2, ayah: 187, wordPosition: 36 } },
    withDamma: { display: 'لُ', sound: 'lu', example: { word: 'لُؤْلُؤٌ', meaning: 'Pearls', surah: 55, ayah: 22, wordPosition: 3 } },
    withSukoon: { display: 'لْ', sound: 'l (stopped)', example: { word: 'الْحَمْدُ', meaning: 'All praise', surah: 1, ayah: 2, wordPosition: 1 } },
    withShadda: { display: 'لَّ', sound: 'lla (doubled)', example: { word: 'اللَّهِ', meaning: 'Of Allah', surah: 1, ayah: 1, wordPosition: 2 } },
    withMaddAlif: { display: 'لَا', sound: 'laa (long)', example: { word: 'وَلَا', meaning: 'And not', surah: 1, ayah: 7, wordPosition: 8 } },
  },
  'م': {
    withFatha: { display: 'مَ', sound: 'ma', example: { word: 'مَعَ', meaning: 'With', surah: 94, ayah: 5, wordPosition: 2 } },
    withKasra: { display: 'مِ', sound: 'mi', example: { word: 'مِنْ', meaning: 'From', surah: 114, ayah: 4, wordPosition: 1 } },
    withDamma: { display: 'مُ', sound: 'mu', example: { word: 'مُسْتَقِيمٍ', meaning: 'Straight', surah: 36, ayah: 4, wordPosition: 4 } },
    withSukoon: { display: 'مْ', sound: 'm (stopped)', example: { word: 'عَلَيْهِمْ', meaning: 'Upon them', surah: 1, ayah: 7, wordPosition: 2 } },
    withShadda: { display: 'مَّ', sound: 'mma (doubled)', example: { word: 'عَمَّ', meaning: 'About what', surah: 78, ayah: 1, wordPosition: 1 } },
    withMaddAlif: { display: 'مَا', sound: 'maa (long)', example: { word: 'مَالِكِ', meaning: 'Owner/Master', surah: 1, ayah: 4, wordPosition: 1 } },
  },
  'ن': {
    withFatha: { display: 'نَ', sound: 'na', example: { word: 'نَصْرُ', meaning: 'Victory/Help', surah: 110, ayah: 1, wordPosition: 2 } },
    withKasra: { display: 'نِ', sound: 'ni', example: { word: 'نِعْمَةَ', meaning: 'Favor/Blessing', surah: 2, ayah: 211, wordPosition: 20 } },
    withDamma: { display: 'نُ', sound: 'nu', example: { word: 'نُورِهِ', meaning: 'His light', surah: 9, ayah: 32, wordPosition: 11 } },
    withSukoon: { display: 'نْ', sound: 'n (stopped)', example: { word: 'أَنْعَمْتَ', meaning: 'You favored', surah: 1, ayah: 7, wordPosition: 5 } },
    withShadda: { display: 'نَّ', sound: 'nna (doubled)', example: { word: 'إِنَّ', meaning: 'Indeed', surah: 108, ayah: 3, wordPosition: 1 } },
    withMaddAlif: { display: 'نَا', sound: 'naa (long)', example: { word: 'نَارًا', meaning: 'A fire', surah: 111, ayah: 3, wordPosition: 3 } },
  },
  'ه': {
    withFatha: { display: 'هَ', sound: 'ha', example: { word: 'هَدَى', meaning: 'He guided', surah: 6, ayah: 84, wordPosition: 9 } },
    withKasra: { display: 'هِ', sound: 'hi', example: { word: 'بِهِ', meaning: 'With it/him', surah: 2, ayah: 26, wordPosition: 20 } },
    withDamma: { display: 'هُ', sound: 'hu', example: { word: 'هُوَ', meaning: 'He', surah: 112, ayah: 1, wordPosition: 2 } },
    withSukoon: { display: 'هْ', sound: 'h (stopped)', example: { word: 'عَهْدِ', meaning: 'Treaty/Covenant', surah: 9, ayah: 4, wordPosition: 15 } },
    withShadda: { display: 'هَّ', sound: 'hha (doubled)', example: { word: 'طَهَّرَكَ', meaning: 'He purified you', surah: 3, ayah: 42, wordPosition: 13 } },
    withMaddAlif: { display: 'هَا', sound: 'haa (long)', example: { word: 'أَنْهَارُ', meaning: 'Rivers', surah: 2, ayah: 25, wordPosition: 18 } },
  },
  'و': {
    withFatha: { display: 'وَ', sound: 'wa', example: { word: 'وَقَبَ', meaning: 'It spreads', surah: 113, ayah: 3, wordPosition: 4 } },
    withKasra: { display: 'وِ', sound: 'wi', example: { word: 'وِقَاءً', meaning: 'Shield/Defense', surah: 3, ayah: 120, wordPosition: 10 } }, // generalized representative word
    withDamma: { display: 'وُ', sound: 'wu', example: { word: 'وُجُوهٌ', meaning: 'Faces', surah: 88, ayah: 2, wordPosition: 1 } },
    withSukoon: { display: 'وْ', sound: 'w (stopped)', example: { word: 'يَوْمِ', meaning: 'Day of', surah: 1, ayah: 4, wordPosition: 2 } },
    withShadda: { display: 'وَّ', sound: 'wwa (doubled)', example: { word: 'قَوَّامِينَ', meaning: 'Maintainers', surah: 4, ayah: 135, wordPosition: 4 } },
    withMaddAlif: { display: 'وَا', sound: 'waa (long)', example: { word: 'وَاحِدٌ', meaning: 'One', surah: 2, ayah: 163, wordPosition: 3 } },
  },
  'ي': {
    withFatha: { display: 'يَ', sound: 'ya', example: { word: 'يَدَا', meaning: 'Both hands', surah: 111, ayah: 1, wordPosition: 2 } },
    withKasra: { display: 'يِ', sound: 'yi', example: { word: 'يُحْيِيكُمْ', meaning: 'He gives you life', surah: 2, ayah: 28, wordPosition: 12 } },
    withDamma: { display: 'يُ', sound: 'yu', example: { word: 'يُولَدْ', meaning: 'He was born', surah: 112, ayah: 3, wordPosition: 3 } },
    withSukoon: { display: 'يْ', sound: 'y (stopped)', example: { word: 'عَلَيْهِمْ', meaning: 'Upon them', surah: 1, ayah: 7, wordPosition: 2 } },
    withShadda: { display: 'يَّ', sound: 'yya (doubled)', example: { word: 'إِيَّاكُ', meaning: 'You alone', surah: 1, ayah: 5, wordPosition: 1 } },
    withMaddAlif: { display: 'يَا', sound: 'yaa (long)', example: { word: 'يَا', meaning: 'O (calling)', surah: 2, ayah: 21, wordPosition: 1 } },
  },
};
