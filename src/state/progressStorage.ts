import AsyncStorage from '@react-native-async-storage/async-storage';
import { AttemptResult, ItemMasteryState } from '../learning/types';
import { SessionCard } from '../learning/engine';

/** How many recent attempts to keep, purely to feed the engine's accuracy-based interleave ratio. */
export const RECENT_ATTEMPTS_CAP = 50;

/**
 * A lesson interrupted by running out of diamonds (or just backgrounded
 * mid-session) — enough to resume the exact same queue position, life
 * count, and mistake tally later, whether that's seconds or days later.
 * Cleared once the lesson actually finishes (see completeLesson).
 */
export interface PendingLessonState {
  lessonId: string;
  queue: SessionCard[];
  currentIndex: number;
  mistakes: number;
  lives: number;
  /** Deduped, first-missed-first, item ids missed so far in this attempt — feeds diamond recovery. */
  missedItemIds: string[];
  /** Real (non-micro-review) attempts recorded so far, merged in when the lesson eventually completes. */
  attempts: AttemptResult[];
}

export interface ProgressState {
  xp: number;
  streak: number;
  maxStreak: number;
  lastActiveDate: string | null;
  completedLessonIds: string[];
  activeDates: string[];
  perfectLessonIds: string[];
  /** Per-item spaced-repetition/mastery state, keyed by LearningItem id. */
  itemMastery: Record<string, ItemMasteryState>;
  /** Most-recent-first, capped to RECENT_ATTEMPTS_CAP. */
  recentAttempts: AttemptResult[];
  /** Set while a lesson is paused out of diamonds (or just backgrounded); null otherwise. */
  pendingLesson: PendingLessonState | null;
  /**
   * Every item currently missed and not yet reviewed correctly — independent
   * of the spaced-repetition schedule (isDue/nextReviewAt), which exists to
   * pace FUTURE reinforcement of things already known and can leave a
   * fresh mistake invisible in Praticar for a day or more, or forever for a
   * level-0 item. Added to on any wrong attempt, removed on any correct one
   * (wherever that correct answer happens — a normal lesson, Praticar, or
   * diamond recovery), so this only shrinks through real review.
   */
  pendingReviewItemIds: string[];
}

export const initialProgressState: ProgressState = {
  xp: 0,
  streak: 0,
  maxStreak: 0,
  lastActiveDate: null,
  completedLessonIds: [],
  activeDates: [],
  perfectLessonIds: [],
  itemMastery: {},
  recentAttempts: [],
  pendingLesson: null,
  pendingReviewItemIds: [],
};

const STORAGE_KEY = 'moien:progress';

export async function loadProgress(): Promise<ProgressState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return initialProgressState;
  try {
    return { ...initialProgressState, ...JSON.parse(raw) };
  } catch {
    return initialProgressState;
  }
}

export async function saveProgress(state: ProgressState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clearProgress(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
