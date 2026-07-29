# Tilawa (تلاوة) — Quran Recitation Checker

Tilawa is a production-ready Next.js 14 Web Application that helps users learn and practice Quranic recitation with continuous, zero-interaction microphone tracking and real-time word boundary alignment.

## Key Features

1. **Continuous Speech Recognition**: Binds to the browser's Web Speech API (`SpeechRecognition` in `ar-SA` Arabic locale) with up to 5 alternative matching hypotheses to guarantee high-fidelity speech tracking.
2. **Deterministic Similarity Engine**: Employs normalized Arabic string distance algorithms (custom Levenshtein edits) to match spoken phonemes.
   - `Similarity >= 80%` marks the word as correct (green highlights).
   - `80% > Similarity >= 55%` detects potential Tajweed mistakes (yellow guidelines).
   - `Similarity < 55%` flags mistakes (red wavy highlight, play oscillator chime, slow-rate TTS guidance).
3. **Automatic Correction Loop**: In Guided Mode, errors trigger an oscillator audio chime and play standard Hafs Arabic TTS. A modal popup lock holds the user's pointer on the word until corrected (up to 3 automatic retries).
4. **Three Recitation Modes**:
   - **Guided Mode**: Active word tracking, automatic corrections, and overlays.
   - **Free Practice**: Highlight mistakes visually without locking or pausing.
   - **Hardcopy Mode**: Visual text is blurred so the user can read from a physical Quran copy while the system scores them in the background.
5. **Detailed Analytics**: Built-in interactive Recharts graphs tracking accuracy history and sub-metric distributions (Accuracy, Tajweed, Fluency).

## Project Structure

```
tilawa/
├── app/
│   ├── layout.tsx               # Root layout, Amiri Quran font, RTL body setup
│   ├── page.tsx                 # Selector dashboard home
│   ├── recite/[surahId]/
│   │   └── page.tsx             # Main interactive recitation layout
│   ├── progress/
│   │   └── page.tsx             # Performance tracking dashboard (Recharts)
│   └── api/
│       └── session/
│           └── route.ts         # Receives and stores session metrics
├── components/
│   ├── QuranDisplay/            # QuranDisplay, WordToken, AyahLine, TajweedLayer
│   ├── Listening/               # ContinuousListener, WaveformBar, LiveTranscript
│   ├── Correction/              # CorrectionCard, PronunciationPlayer, CorrectionOverlay
│   ├── UI/                      # ScoreRing, TajweedBadge, Toast, SettingsDrawer
│   └── Layout/                  # Header, ModeBar
├── data/
│   └── quran-uthmani.json       # Full tanzil Uthmani database for 8 implemented surahs
├── lib/
│   ├── arabic/                  # normalize, levenshtein, similarity, tajweed
│   ├── speech/                  # tts, useAudioStream, useContinuousASR
│   └── store/                   # Zustand recitation state store
└── types/
    └── index.ts                 # Type definitions
```

## Setup and Running

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. **Production Build**:
   ```bash
   npm run build
   ```
