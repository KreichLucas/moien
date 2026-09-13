export type Language = 'pt' | 'lu';

export interface MultipleChoiceExercise {
  type: 'multipleChoice';
  id: string;
  promptLang: Language;
  prompt: string;
  options: string[];
  correctIndex: number;
  hint?: string;
}

export interface TranslateExercise {
  type: 'translate';
  id: string;
  promptLang: Language;
  prompt: string;
  acceptedAnswers: string[];
  hint?: string;
  /** Per-word gloss overrides, for when a word's usual meaning doesn't fit this sentence's context */
  wordGlosses?: Record<string, string>;
}

export interface MatchExercise {
  type: 'match';
  id: string;
  pairs: { pt: string; lu: string; hint?: string }[];
}

export interface FillBlankExercise {
  type: 'fillBlank';
  id: string;
  promptLang: Language;
  /** Sentence with a single blank marked as '___' */
  sentence: string;
  translation: string;
  options: string[];
  correctAnswer: string;
  hint?: string;
}

export type Exercise = MultipleChoiceExercise | TranslateExercise | MatchExercise | FillBlankExercise;

export interface Lesson {
  id: string;
  title: string;
  exercises: Exercise[];
}

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CEFRLevel = (typeof CEFR_LEVELS)[number];

export interface Unit {
  id: string;
  title: string;
  description: string;
  level: CEFRLevel;
  lessons: Lesson[];
}
