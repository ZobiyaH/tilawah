export interface Example {
  arabic: string;
  audioPath: string;
  transliteration: string;
  translation: string;
}

export interface AudioFiles {
  instruction: string;
  examples: Example[];
}

export interface CompletionCriteria {
  audioPlayed: boolean;
  attemptsMade: number;
  quizPassed: boolean;
  minAccuracy: number;
}

export interface Lesson {
  id: string;
  stage: number;
  subJourney: string;
  title: string;
  type: string;
  estimatedMinutes: number;
  prerequisite: string[];
  audioFiles: AudioFiles;
  completionCriteria: CompletionCriteria;
}
