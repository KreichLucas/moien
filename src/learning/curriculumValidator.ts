import { normalizeWord } from '../content/wordNormalization';
import { Exercise, Unit } from '../types/content';

/**
 * How much a given exercise format demands from the learner. `teach`
 * exercises are always safe to introduce brand-new content with, because
 * the correct answer is visible (in the options, or revealed on check) —
 * the exercise itself is what teaches the word. Everything past `teach`
 * assumes the learner already has some prior exposure to draw on.
 */
export type ExerciseTier = 'teach' | 'select' | 'construct' | 'produce';

/** Consecutive prior exposures a word/phrase needs before it can appear at this tier. */
const REQUIRED_EXPOSURES: Record<ExerciseTier, number> = {
  teach: 0,
  select: 1,
  construct: 2,
  produce: 2,
};

/**
 * True grammatical/function words a beginner is assumed to recognize from
 * day one (pronouns, core copula, basic prepositions, question words,
 * conjunctions, determiners) — NOT the same list as content/glossary.ts's
 * LU_FUNCTION_WORDS, which exists for a different purpose (never showing
 * "no translation" on the tap-a-word hint) and deliberately includes real
 * content words like "gutt"/"schaffen" that this validator must NOT wave
 * through unvetted.
 */
const GRAMMAR_WORDS = new Set([
  'ech', 'du', 'hien', 'hatt', 'mir', 'dir', 'si',
  'sinn', 'bass', 'ass', 'sidd',
  'net',
  'de', 'den', 'd', 'en', 'eng', 'dat', 'dëst', 'deen',
  'an', 'am', 'op', 'mat', 'fir', 'vun', 'zu', 'aus',
  'wéi', 'wat', 'wou', 'wann',
  'a', 'mee', 'well',
  'all', 'esou', 'keen', 'et',
]);

export interface CurriculumViolation {
  exerciseId: string;
  word: string;
  tier: ExerciseTier;
  requiredExposures: number;
  actualExposures: number;
}

function tokenize(text: string): string[] {
  return text
    .split(/\s+/)
    .map((t) => normalizeWord(t))
    .filter((t) => t.length > 0 && !GRAMMAR_WORDS.has(t));
}

/** The Luxembourgish text an exercise centers on, and whether it's a multi-word phrase. */
function luContentOf(exercise: Exercise): { text: string; isPhrase: boolean } | null {
  switch (exercise.type) {
    case 'multipleChoice': {
      const text = exercise.promptLang === 'lu' ? exercise.prompt : exercise.options[exercise.correctIndex];
      return { text, isPhrase: text.trim().includes(' ') };
    }
    case 'translate': {
      const text = exercise.promptLang === 'lu' ? exercise.prompt : exercise.acceptedAnswers[0];
      return { text, isPhrase: text.trim().includes(' ') };
    }
    case 'fillBlank': {
      const text = exercise.sentence.replace('___', exercise.correctAnswer);
      return { text, isPhrase: true };
    }
    case 'orderWords':
      return { text: exercise.correctOrder.join(' '), isPhrase: true };
    case 'match':
      return null; // handled per-pair by the caller
  }
}

export function tierOf(exercise: Exercise): ExerciseTier {
  switch (exercise.type) {
    case 'multipleChoice':
    case 'match':
      return 'teach';
    case 'fillBlank':
      return 'select';
    case 'orderWords':
      return 'construct';
    case 'translate': {
      const content = luContentOf(exercise)!;
      if (content.isPhrase) return 'produce'; // whole-sentence translation, either direction, is the hardest form
      return exercise.promptLang === 'lu' ? 'teach' : 'produce';
    }
  }
}

interface Occurrence {
  exerciseId: string;
  tier: ExerciseTier;
  words: string[];
}

function occurrencesFor(exercise: Exercise): Occurrence[] {
  if (exercise.type === 'match') {
    return exercise.pairs.map((pair) => ({
      exerciseId: exercise.id,
      tier: 'teach' as const,
      words: tokenize(pair.lu),
    }));
  }
  const content = luContentOf(exercise);
  if (!content) return [];
  return [{ exerciseId: exercise.id, tier: tierOf(exercise), words: tokenize(content.text) }];
}

/**
 * Walks every unit's lessons and exercises in their authored order, tracking
 * cumulative exposure per normalized Luxembourgish word, and flags any
 * exercise that demands more exposure than a word has actually earned so
 * far. Pass units in the order a learner will actually encounter them
 * (e.g. `units.filter(u => u.level === 'A1')` in units.ts's own order).
 */
export function validateProgression(units: Unit[]): CurriculumViolation[] {
  const exposureCount: Record<string, number> = {};
  const violations: CurriculumViolation[] = [];

  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.exercises.forEach((exercise) => {
        occurrencesFor(exercise).forEach((occ) => {
          const required = REQUIRED_EXPOSURES[occ.tier];
          occ.words.forEach((word) => {
            const actual = exposureCount[word] ?? 0;
            if (actual < required) {
              violations.push({ exerciseId: occ.exerciseId, word, tier: occ.tier, requiredExposures: required, actualExposures: actual });
            }
          });
        });
        // Exposure is credited after the exercise, regardless of tier — by the
        // time the learner has seen (and been corrected on) any exercise, the
        // word/phrase's content is available to them for what comes next.
        occurrencesFor(exercise).forEach((occ) => {
          occ.words.forEach((word) => {
            exposureCount[word] = (exposureCount[word] ?? 0) + 1;
          });
        });
      });
    });
  });

  return violations;
}
