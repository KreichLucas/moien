import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { hasExerciseVariety } from '../learning/itemExtraction';
import { ITEM_REGISTRY } from '../learning/registry';
import { recordAttempt } from '../learning/srs';
import { AttemptResult } from '../learning/types';
import {
  PendingLessonState,
  ProgressState,
  RECENT_ATTEMPTS_CAP,
  clearProgress,
  initialProgressState,
  loadProgress,
  saveProgress,
} from './progressStorage';

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

type Action =
  | { type: 'HYDRATE'; state: ProgressState }
  | { type: 'RECORD_LESSON_RESULT'; lessonId: string; xpEarned: number; wasPerfect: boolean; attempts: AttemptResult[] }
  | { type: 'RECORD_PRACTICE_ATTEMPTS'; attempts: AttemptResult[] }
  | { type: 'MARK_PENDING_REVIEW'; attempts: AttemptResult[] }
  | { type: 'SET_PENDING_LESSON'; pendingLesson: PendingLessonState | null }
  | { type: 'RESET' };

function applyAttemptsToMastery(
  itemMastery: ProgressState['itemMastery'],
  attempts: AttemptResult[],
  now: string
): ProgressState['itemMastery'] {
  let result = itemMastery;
  attempts.forEach((attempt) => {
    const updated = recordAttempt({
      state: result[attempt.itemId],
      itemId: attempt.itemId,
      correct: attempt.correct,
      errorType: attempt.errorType,
      exerciseId: attempt.exerciseId,
      exerciseType: attempt.exerciseType,
      now,
      hasExerciseVariety: hasExerciseVariety(ITEM_REGISTRY, attempt.itemId),
    });
    result = { ...result, [attempt.itemId]: updated };
  });
  return result;
}

/**
 * A wrong attempt adds its item; a correct attempt removes it — applied in
 * the order the attempts actually happened, so a word missed then later
 * fixed within the SAME batch nets out to "not pending" correctly. This is
 * the explicit, SRS-schedule-independent signal Praticar shows: isDue
 * (srs.ts) exists to pace FUTURE reinforcement of things already known and
 * can leave a fresh mistake invisible for a day or more (or forever for a
 * level-0 item, since nextReviewAt stays null there) — a real regression
 * the user hit ("errei no final da lição e não foi pra Praticar").
 */
function applyAttemptsToPendingReview(pendingReviewItemIds: string[], attempts: AttemptResult[]): string[] {
  let result = pendingReviewItemIds;
  attempts.forEach((attempt) => {
    const has = result.includes(attempt.itemId);
    if (attempt.correct) {
      if (has) result = result.filter((id) => id !== attempt.itemId);
    } else if (!has) {
      result = [...result, attempt.itemId];
    }
  });
  return result;
}

function reducer(state: ProgressState, action: Action): ProgressState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...initialProgressState, ...action.state };
    case 'RESET':
      return initialProgressState;
    case 'RECORD_LESSON_RESULT': {
      const now = new Date().toISOString();
      const today = todayISODate();
      let streak = state.streak;
      if (!state.lastActiveDate) {
        streak = 1;
      } else {
        const diff = daysBetween(state.lastActiveDate, today);
        if (diff === 0) streak = state.streak || 1;
        else if (diff === 1) streak = state.streak + 1;
        else streak = 1;
      }
      const completedLessonIds = state.completedLessonIds.includes(action.lessonId)
        ? state.completedLessonIds
        : [...state.completedLessonIds, action.lessonId];
      const activeDates = state.activeDates.includes(today)
        ? state.activeDates
        : [...state.activeDates, today];
      const perfectLessonIds =
        action.wasPerfect && !state.perfectLessonIds.includes(action.lessonId)
          ? [...state.perfectLessonIds, action.lessonId]
          : state.perfectLessonIds;

      const itemMastery = applyAttemptsToMastery(state.itemMastery, action.attempts, now);
      const pendingReviewItemIds = applyAttemptsToPendingReview(state.pendingReviewItemIds, action.attempts);
      // Most-recent-first: the session's attempts happened in order, so the last one goes to index 0.
      const recentAttempts = [...[...action.attempts].reverse(), ...state.recentAttempts].slice(0, RECENT_ATTEMPTS_CAP);

      return {
        ...state,
        xp: state.xp + action.xpEarned,
        streak,
        maxStreak: Math.max(state.maxStreak, streak),
        lastActiveDate: today,
        completedLessonIds,
        activeDates,
        perfectLessonIds,
        itemMastery,
        recentAttempts,
        pendingReviewItemIds,
        // The lesson just finished for real — any paused/resumable snapshot is stale now.
        pendingLesson: null,
      };
    }
    case 'RECORD_PRACTICE_ATTEMPTS': {
      // Diamond-recovery practice (and, in future, any other ad-hoc practice
      // outside a full lesson) updates mastery/SRS exactly like a real
      // attempt — that's what makes an item "reviewed" and lets it drop out
      // of the due queue — but deliberately does NOT touch xp/streak/
      // completedLessonIds/pendingLesson: it isn't completing a lesson, and
      // granting XP for it would let a player farm XP by losing diamonds on
      // purpose.
      const now = new Date().toISOString();
      const itemMastery = applyAttemptsToMastery(state.itemMastery, action.attempts, now);
      const pendingReviewItemIds = applyAttemptsToPendingReview(state.pendingReviewItemIds, action.attempts);
      const recentAttempts = [...[...action.attempts].reverse(), ...state.recentAttempts].slice(0, RECENT_ATTEMPTS_CAP);
      return { ...state, itemMastery, recentAttempts, pendingReviewItemIds };
    }
    case 'MARK_PENDING_REVIEW':
      // Fired live, per-answer, from LessonScreen — independent of mastery/
      // xp/streak, which stay batched until the lesson actually completes
      // (see completeLesson). This is what makes a mistake show up in
      // Praticar even if the lesson is later paused for diamonds or
      // abandoned outright without ever finishing: otherwise those misses
      // would only reach pendingReviewItemIds via RECORD_LESSON_RESULT,
      // which never fires for a lesson that's never completed. Idempotent
      // with the batch update in RECORD_LESSON_RESULT/RECORD_PRACTICE_
      // ATTEMPTS — replaying the same already-applied attempts again nets
      // out to the same result, so no double-counting risk.
      return { ...state, pendingReviewItemIds: applyAttemptsToPendingReview(state.pendingReviewItemIds, action.attempts) };
    case 'SET_PENDING_LESSON':
      return { ...state, pendingLesson: action.pendingLesson };
    default:
      return state;
  }
}

interface ProgressContextValue {
  progress: ProgressState;
  completeLesson: (lessonId: string, xpEarned: number, wasPerfect: boolean, attempts: AttemptResult[]) => void;
  recordPracticeAttempts: (attempts: AttemptResult[]) => void;
  markPendingReview: (attempts: AttemptResult[]) => void;
  savePendingLesson: (pendingLesson: PendingLessonState) => void;
  clearPendingLesson: () => void;
  resetProgress: () => void;
  isLoaded: boolean;
}

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, dispatch] = useReducer(reducer, initialProgressState);
  const [isLoaded, setIsLoaded] = React.useState(false);

  useEffect(() => {
    loadProgress().then((state) => {
      dispatch({ type: 'HYDRATE', state });
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded) saveProgress(progress);
  }, [progress, isLoaded]);

  const completeLesson = (lessonId: string, xpEarned: number, wasPerfect: boolean, attempts: AttemptResult[]) => {
    dispatch({ type: 'RECORD_LESSON_RESULT', lessonId, xpEarned, wasPerfect, attempts });
  };

  const recordPracticeAttempts = (attempts: AttemptResult[]) => {
    dispatch({ type: 'RECORD_PRACTICE_ATTEMPTS', attempts });
  };

  const markPendingReview = (attempts: AttemptResult[]) => {
    dispatch({ type: 'MARK_PENDING_REVIEW', attempts });
  };

  const savePendingLesson = (pendingLesson: PendingLessonState) => {
    dispatch({ type: 'SET_PENDING_LESSON', pendingLesson });
  };

  const clearPendingLesson = () => {
    dispatch({ type: 'SET_PENDING_LESSON', pendingLesson: null });
  };

  const resetProgress = () => {
    dispatch({ type: 'RESET' });
    clearProgress();
  };

  return (
    <ProgressContext.Provider
      value={{
        progress,
        completeLesson,
        recordPracticeAttempts,
        markPendingReview,
        savePendingLesson,
        clearPendingLesson,
        resetProgress,
        isLoaded,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress deve ser usado dentro de ProgressProvider');
  return ctx;
}
