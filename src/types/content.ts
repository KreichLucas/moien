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

/**
 * The official 10-stage level structure: each CEFR band (A1/A2/B1/B2) split
 * into Iniciante/Intermediário/Avançado stages, except B2 which — matching
 * how far real content actually goes today — only has an Iniciante stage
 * defined. Order here IS the course progression order everywhere it's
 * consumed (journey view, "next level" logic, review-lesson lookback).
 */
export const CEFR_LEVELS = [
  'A1-INICIANTE',
  'A1-INTERMEDIARIO',
  'A1-AVANCADO',
  'A2-INICIANTE',
  'A2-INTERMEDIARIO',
  'A2-AVANCADO',
  'B1-INICIANTE',
  'B1-INTERMEDIARIO',
  'B1-AVANCADO',
  'B2-INICIANTE',
] as const;
export type CEFRLevel = (typeof CEFR_LEVELS)[number];

export interface Unit {
  id: string;
  title: string;
  description: string;
  level: CEFRLevel;
  lessons: Lesson[];
  /**
   * When 'objective', the home trail renders this unit as a single tappable
   * icon (instead of one node per lesson) that opens ObjectiveScreen, where
   * each of the unit's lessons is shown as a "barra" the learner completes
   * in order. Absent for every unit that keeps the original trail-of-nodes
   * behavior (all non-A1 units, and any A1 unit not yet migrated).
   */
  kind?: 'objective';
  /** Emoji shown on the trail icon for an 'objective' unit. */
  icon?: string;
}
