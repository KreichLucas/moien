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
