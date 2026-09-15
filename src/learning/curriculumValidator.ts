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

/**
 * Consecutive prior exposures a standalone WORD needs before it can appear
 * at this tier. Only ever applied to single-word content, which is only
 * ever taught (multipleChoice/match/translate-lu) or produced
 * (translate-pt->lu) — select/construct exercises are always phrases.
 */
const REQUIRED_EXPOSURES: Record<ExerciseTier, number> = {
  teach: 0,
  select: 1,
  construct: 2,
  produce: 2,
};

/**
 * How many times the EXACT SAME phrase must already have appeared — at any
 * tier — before it may be asked at this tier. Deliberately much looser than
 * word-readiness: once every word in a phrase is individually ready (see
 * WORD_READINESS), the phrase's own first appearance can be its teach,
 * select, OR construct exercise (that IS the "combine known words" step,
 * per the user's own worked example — "como" and "vai" go straight from
 * individual practice into "Como ___?" with no separate reveal step). Only
 * produce — translating/typing the whole phrase completely unaided — needs
 * the phrase itself to have already come up before, at an easier tier.
 */
const PHRASE_REQUIRED_EXPOSURES: Record<ExerciseTier, number> = {
  teach: 0,
  select: 0,
  construct: 0,
  produce: 1,
};

/**
 * Exposures a word needs, from its OWN standalone teaching, before it may
 * appear inside ANY multi-word phrase — even that phrase's first (teach-
 * tier) introduction. This is the rule the user spelled out explicitly:
 * "antes de pedir para o aluno montar ou traduzir uma frase, ele precisa
 * ter aprendido as palavras que formam essa frase" — recognizing a whole
 * phrase's translation is not the same as knowing its parts, so a phrase's
 * component words must each have been taught (1) and practiced (2) in
 * isolation before the phrase combining them may be shown at all.
 */
const WORD_READINESS = 2;

export interface CurriculumViolation {
  exerciseId: string;
  word: string;
  tier: ExerciseTier;
  requiredExposures: number;
  actualExposures: number;
}

function tokensOf(text: string): string[] {
  return text
    .split(/\s+/)
    .map((t) => normalizeWord(t))
    .filter((t) => t.length > 0);
}

/** Stable identity for a multi-word phrase, independent of which exercise says it. */
function phraseKey(text: string): string {
  return tokensOf(text).join(' ');
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

interface Check {
  kind: 'word' | 'phrase';
  key: string;
  threshold: number;
  tier: ExerciseTier;
}

interface ExerciseAnalysis {
  exerciseId: string;
  requires: Check[];
  credits: Check[];
}

/**
 * A word only earns an independent identity — and only then becomes
 * something later phrases must wait for — if the curriculum ever teaches it
 * on its own (a single-word multipleChoice/translate, or a single-word
 * match pair). A fixed idiom like "Bis Bald" or "Wann ech gelift" whose
 * pieces are never taught standalone stays a memorized chunk, exactly like
 * "Moien" or "Äddi" — recomposing its own two words is not asking the
 * learner to generalize grammar they were never given. But the moment a
 * word (e.g. "gutt") gets its own dedicated teach exercise anywhere in the
 * course, every phrase containing it — anywhere, past or future — must
 * wait for that word's own readiness first. No hardcoded grammar-word
 * exemption list is needed: whether a word is "just glue" or "real content"
 * falls out of whether the curriculum ever bothers to teach it alone.
 */
function collectTrackedWords(units: Unit[]): Set<string> {
  const tracked = new Set<string>();
  units.forEach((unit) =>
    unit.lessons.forEach((lesson) =>
      lesson.exercises.forEach((exercise) => {
        if (exercise.type === 'match') {
          exercise.pairs.forEach((pair) => {
            if (!pair.lu.trim().includes(' ')) tracked.add(normalizeWord(pair.lu));
          });
          return;
        }
        if (exercise.type === 'multipleChoice' || exercise.type === 'translate') {
          const content = luContentOf(exercise);
          if (content && !content.isPhrase) tracked.add(normalizeWord(content.text));
        }
      })
    )
  );
  return tracked;
}

function wordReadinessChecks(text: string, trackedWords: Set<string>, tier: ExerciseTier): Check[] {
  return tokensOf(text)
    .filter((w) => trackedWords.has(w))
    .map((key) => ({ kind: 'word' as const, key, threshold: WORD_READINESS, tier }));
}

function wordCredits(text: string, tier: ExerciseTier): Check[] {
  return tokensOf(text).map((key) => ({ kind: 'word' as const, key, threshold: 0, tier }));
}

function analyzeExercise(exercise: Exercise, trackedWords: Set<string>): ExerciseAnalysis[] {
  if (exercise.type === 'match') {
    return exercise.pairs.map((pair, i) => {
      const isPhrase = pair.lu.trim().includes(' ');
      if (!isPhrase) {
        const key = normalizeWord(pair.lu);
        return {
          exerciseId: `${exercise.id}#${i}`,
          requires: [],
          credits: [{ kind: 'word' as const, key, threshold: 0, tier: 'teach' as const }],
        };
      }
      const key = phraseKey(pair.lu);
      return {
        exerciseId: `${exercise.id}#${i}`,
        requires: wordReadinessChecks(pair.lu, trackedWords, 'teach'),
        credits: [{ kind: 'phrase' as const, key, threshold: 0, tier: 'teach' as const }, ...wordCredits(pair.lu, 'teach')],
      };
    });
  }

  const tier = tierOf(exercise);

  if (exercise.type === 'fillBlank') {
    const fullText = exercise.sentence.replace('___', exercise.correctAnswer);
    const key = phraseKey(fullText);
    return [
      {
        exerciseId: exercise.id,
        requires: [
          ...wordReadinessChecks(fullText, trackedWords, tier),
          { kind: 'phrase', key, threshold: PHRASE_REQUIRED_EXPOSURES[tier], tier },
        ],
        credits: [{ kind: 'phrase', key, threshold: 0, tier }, ...wordCredits(fullText, tier)],
      },
    ];
  }

  if (exercise.type === 'orderWords') {
    const fullText = exercise.correctOrder.join(' ');
    const key = phraseKey(fullText);
    return [
      {
        exerciseId: exercise.id,
        requires: [
          ...wordReadinessChecks(fullText, trackedWords, tier),
          { kind: 'phrase', key, threshold: PHRASE_REQUIRED_EXPOSURES[tier], tier },
        ],
        credits: [{ kind: 'phrase', key, threshold: 0, tier }, ...wordCredits(fullText, tier)],
      },
    ];
  }

  // multipleChoice, and translate (both teach- and produce-tier)
  const content = luContentOf(exercise);
  if (!content) return [];

  if (!content.isPhrase) {
    const key = normalizeWord(content.text);
    return [
      {
        exerciseId: exercise.id,
        requires: [{ kind: 'word', key, threshold: REQUIRED_EXPOSURES[tier], tier }],
        credits: [{ kind: 'word', key, threshold: 0, tier }],
      },
    ];
  }

  const key = phraseKey(content.text);
  return [
    {
      exerciseId: exercise.id,
      requires: [
        ...wordReadinessChecks(content.text, trackedWords, tier),
        { kind: 'phrase', key, threshold: PHRASE_REQUIRED_EXPOSURES[tier], tier },
      ],
      credits: [{ kind: 'phrase', key, threshold: 0, tier }, ...wordCredits(content.text, tier)],
    },
  ];
}

/**
 * Walks every unit's lessons and exercises in their authored order, tracking
 * cumulative exposure per word and, separately, per whole phrase, and flags
 * any exercise that demands more exposure than its subject has actually
 * earned so far — including a phrase's own component words not having been
 * individually taught yet, not just the phrase itself appearing "too soon."
 * Pass units in the order a learner will actually encounter them (e.g.
 * `units.filter(u => u.level === 'A1')` in units.ts's own order).
 */
export function validateProgression(units: Unit[]): CurriculumViolation[] {
  const trackedWords = collectTrackedWords(units);
  const wordExposure: Record<string, number> = {};
  const phraseExposure: Record<string, number> = {};
  const violations: CurriculumViolation[] = [];

  const mapFor = (kind: Check['kind']) => (kind === 'word' ? wordExposure : phraseExposure);

  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.exercises.forEach((exercise) => {
        analyzeExercise(exercise, trackedWords).forEach(({ exerciseId, requires, credits }) => {
          requires.forEach(({ kind, key, threshold, tier }) => {
            const actual = mapFor(kind)[key] ?? 0;
            if (actual < threshold) {
              violations.push({ exerciseId, word: key, tier, requiredExposures: threshold, actualExposures: actual });
            }
          });
          // Credited after checking, regardless of tier — by the time the
          // learner has seen (and been corrected on) any exercise, its
          // content is available to them for what comes next.
          credits.forEach(({ kind, key }) => {
            const map = mapFor(kind);
            map[key] = (map[key] ?? 0) + 1;
          });
        });
      });
    });
  });

  return violations;
}
