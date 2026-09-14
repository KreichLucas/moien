export type Language = 'pt' | 'lu';

export interface MultipleChoiceExercise {
  type: 'multipleChoice';
  id: string;
  promptLang: Language;
  prompt: string;
  options: string[];
  correctIndex: number;
  hint?: string;
  wordGlosses?: Record<string, string>;
  /** Manual override for the learning item(s) this exercise tests. Auto-derived when absent. */
  itemIds?: string[];
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
  /** Manual override for the learning item(s) this exercise tests. Auto-derived when absent. */
  itemIds?: string[];
}

export interface MatchExercise {
  type: 'match';
  id: string;
  pairs: { pt: string; lu: string; hint?: string; itemId?: string }[];
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
  wordGlosses?: Record<string, string>;
  /** Manual override for the learning item(s) this exercise tests. Auto-derived when absent. */
  itemIds?: string[];
}

export interface OrderWordsExercise {
  type: 'orderWords';
  id: string;
  translation: string;
  /** Word chips as shown to the learner (shuffled at render time, not here). */
  words: string[];
  correctOrder: string[];
  hint?: string;
  /** Manual override for the learning item(s) this exercise tests. Auto-derived when absent. */
  itemIds?: string[];
}

export type Exercise =
  | MultipleChoiceExercise
  | TranslateExercise
  | MatchExercise
  | FillBlankExercise
  | OrderWordsExercise;

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
