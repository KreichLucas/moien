import { Exercise } from '../types/content';

export type ItemKind = 'word' | 'phrase';

/**
 * A stable, auto-derived unit of vocabulary or phrasing the learner can gain
 * mastery over. Words are keyed by their normalized bare form ("word:papp");
 * phrases are keyed by their source exercise, since full sentences rarely
 * repeat verbatim across the course ("phrase:u1-l2-e3").
 */
export interface LearningItem {
  id: string;
  kind: ItemKind;
  displayLu: string;
  displayPt: string;
  /** Every exercise (or match pair, encoded as "exerciseId#pairIndex") that can test this item. */
  sourceExerciseIds: string[];
  firstSeenUnitId: string;
}

/**
 * `wrong-article` and `close-miss` are only ever produced for free-typed
 * translate answers (the only exercise type with a string to diff against).
 * Every other exercise type reports `other` on a miss.
 */
export type ErrorType = 'wrong-article' | 'close-miss' | 'other';

/** A single bounded history entry kept inside an item's mastery state. */
export interface AttemptRecord {
  correct: boolean;
  errorType?: ErrorType;
  exerciseId: string;
  exerciseType: Exercise['type'];
  at: string; // ISO date
}

export type DomainLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ItemMasteryState {
  itemId: string;
  domainLevel: DomainLevel;
  consecutiveCorrect: number;
  /**
   * ISO date (day only) of the first correct answer in the current
   * consecutiveCorrect streak. Items with only one authored exercise need
   * their promotion streak to span at least two distinct calendar days
   * (see mastery.ts) so a single question answered thrice in one sitting
   * doesn't count as real mastery.
   */
  streakStartedOn?: string;
  /** SRS interval multiplier, 0.7-1.3, starts at 1.0. */
  easeFactor: number;
  timesShown: number;
  timesCorrect: number;
  timesWrong: number;
  lastSeenAt: string; // ISO date
  /** null only before the item's first attempt (domainLevel 0, never scheduled). */
  nextReviewAt: string | null;
  lastErrorType?: ErrorType;
  /** Bounded to the 5 most recent attempts, newest first. */
  history: AttemptRecord[];
}

/** What an exercise component reports back per learning item it tested. */
export interface AttemptResult {
  itemId: string;
  correct: boolean;
  errorType?: ErrorType;
  exerciseId: string;
  exerciseType: Exercise['type'];
}

/**
 * The new onComplete payload for every exercise component, replacing the
 * old `hadMistake: boolean`. multipleChoice/translate/fillBlank/orderWords
 * report exactly one AttemptResult; match reports one per pair.
 */
export interface ExerciseOutcome {
  itemResults: AttemptResult[];
}
