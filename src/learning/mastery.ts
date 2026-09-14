import { AttemptRecord, DomainLevel, ErrorType, ItemMasteryState } from './types';

const MAX_LEVEL: DomainLevel = 6;
const MIN_LEVEL: DomainLevel = 0;
const HISTORY_CAP = 5;

/** Consecutive correct answers needed to advance FROM each level. Level 6 never advances further. */
const PROMOTION_STREAK: Record<DomainLevel, number> = {
  0: 1,
  1: 2,
  2: 2,
  3: 2,
  4: 3,
  5: 3,
  6: Infinity,
};

/**
 * Levels whose promotion, for items with only one authored exercise, must
 * be earned across at least two distinct calendar days rather than in a
 * single sitting — otherwise "mastery" would just be rote recall of one
 * question answered three times in a row.
 */
const CROSS_DAY_REQUIRED_FROM: DomainLevel[] = [4, 5];

function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function initialState(itemId: string): ItemMasteryState {
  return {
    itemId,
    domainLevel: 0,
    consecutiveCorrect: 0,
    easeFactor: 1.0,
    timesShown: 0,
    timesCorrect: 0,
    timesWrong: 0,
    lastSeenAt: '',
    nextReviewAt: null,
    history: [],
  };
}

export interface ApplyAttemptInput {
  state: ItemMasteryState | undefined;
  itemId: string;
  correct: boolean;
  errorType?: ErrorType;
  exerciseId: string;
  exerciseType: AttemptRecord['exerciseType'];
  now: string; // ISO datetime
  /** False when the item has only one exercise in the whole course that can test it. */
  hasExerciseVariety: boolean;
}

/**
 * Pure domain-level transition (the 0-6 mastery scale) plus ease-factor
 * bookkeeping for a single attempt. Does NOT touch `nextReviewAt` — that's
 * srs.ts's job, layered on top of this.
 */
export function applyAttempt(input: ApplyAttemptInput): ItemMasteryState {
  const prev = input.state ?? initialState(input.itemId);
  const level = prev.domainLevel;
  const today = dateOnly(input.now);
  const errorType: ErrorType = input.correct ? 'other' : input.errorType ?? 'other';

  let newLevel: DomainLevel = level;
  let newConsecutive = prev.consecutiveCorrect;
  let streakStartedOn = prev.streakStartedOn;

  if (input.correct) {
    newConsecutive = prev.consecutiveCorrect + 1;
    streakStartedOn = prev.consecutiveCorrect === 0 ? today : streakStartedOn ?? today;

    const needed = PROMOTION_STREAK[level];
    if (level < MAX_LEVEL && newConsecutive >= needed) {
      const needsCrossDay = !input.hasExerciseVariety && CROSS_DAY_REQUIRED_FROM.includes(level);
      const spansMultipleDays = streakStartedOn !== today;
      if (!needsCrossDay || spansMultipleDays) {
        newLevel = (level + 1) as DomainLevel;
        newConsecutive = 0;
        streakStartedOn = undefined;
      }
      // Numeric streak met but not yet across a day boundary for a singleton
      // item: stay at the current level, keep accumulating consecutiveCorrect.
    }
  } else {
    newConsecutive = 0;
    streakStartedOn = undefined;
    if (errorType === 'other') {
      newLevel = Math.max(MIN_LEVEL, level - 1) as DomainLevel;
    }
    // close-miss / wrong-article: level unchanged, only the streak resets.
  }

  let easeFactor = prev.easeFactor;
  if (input.correct) easeFactor = clamp(easeFactor + 0.05, 0.7, 1.3);
  else if (errorType === 'close-miss' || errorType === 'wrong-article') easeFactor = clamp(easeFactor - 0.1, 0.7, 1.3);
  else easeFactor = clamp(easeFactor - 0.2, 0.7, 1.3);

  const record: AttemptRecord = {
    correct: input.correct,
    errorType: input.correct ? undefined : errorType,
    exerciseId: input.exerciseId,
    exerciseType: input.exerciseType,
    at: input.now,
  };

  return {
    itemId: input.itemId,
    domainLevel: newLevel,
    consecutiveCorrect: newConsecutive,
    streakStartedOn,
    easeFactor,
    timesShown: prev.timesShown + 1,
    timesCorrect: prev.timesCorrect + (input.correct ? 1 : 0),
    timesWrong: prev.timesWrong + (input.correct ? 0 : 1),
    lastSeenAt: input.now,
    nextReviewAt: prev.nextReviewAt,
    lastErrorType: input.correct ? prev.lastErrorType : errorType,
    history: [record, ...prev.history].slice(0, HISTORY_CAP),
  };
}
