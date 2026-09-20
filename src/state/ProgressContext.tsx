import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { hasExerciseVariety } from '../learning/itemExtraction';
import { ITEM_REGISTRY } from '../learning/registry';
import { recordAttempt } from '../learning/srs';
import { AttemptResult } from '../learning/types';
import { useAuth } from './AuthContext';
import {
  MAX_DIAMONDS,
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
  | { type: 'SPEND_DIAMOND' }
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

/**
 * Diamonds are a single account-wide resource now (see MAX_DIAMONDS):
 * spent one at a time from any lesson mistake, but only ever restored in
 * bulk once the whole pendingReviewItemIds backlog is cleared — not per
 * correct answer. `diamondRecoveryCleared` is the running count of items
 * resolved since diamonds last dropped below MAX, purely to give Prática a
 * stable "X de Y concluídos" fraction (Y = cleared + still-outstanding)
 * that grows correctly even if a fresh mistake elsewhere adds to the
 * backlog mid-recovery, instead of a fixed snapshot total.
 */
function applyDiamondRecovery(
  diamonds: number,
  diamondRecoveryCleared: number,
  previousPending: string[],
  nextPending: string[]
): { diamonds: number; diamondRecoveryCleared: number } {
  if (diamonds >= MAX_DIAMONDS) return { diamonds, diamondRecoveryCleared: 0 };
  const resolvedCount = previousPending.filter((id) => !nextPending.includes(id)).length;
  if (nextPending.length === 0) return { diamonds: MAX_DIAMONDS, diamondRecoveryCleared: 0 };
  return { diamonds, diamondRecoveryCleared: diamondRecoveryCleared + resolvedCount };
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
      const { diamonds, diamondRecoveryCleared } = applyDiamondRecovery(
        state.diamonds,
        state.diamondRecoveryCleared,
        state.pendingReviewItemIds,
        pendingReviewItemIds
      );
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
        diamonds,
        diamondRecoveryCleared,
        // The lesson just finished for real — any paused/resumable snapshot is stale now.
        pendingLesson: null,
      };
    }
    case 'RECORD_PRACTICE_ATTEMPTS': {
      // Prática (and diamond-recovery, which now IS just Prática entered
      // from an out-of-diamonds lesson) updates mastery/SRS exactly like a
      // real attempt — that's what makes an item "reviewed" and lets it
      // drop out of the due queue — but deliberately does NOT touch
      // xp/streak/completedLessonIds/pendingLesson: it isn't completing a
      // lesson, and granting XP for it would let a player farm XP by
      // losing diamonds on purpose.
      const now = new Date().toISOString();
      const itemMastery = applyAttemptsToMastery(state.itemMastery, action.attempts, now);
      const pendingReviewItemIds = applyAttemptsToPendingReview(state.pendingReviewItemIds, action.attempts);
      const { diamonds, diamondRecoveryCleared } = applyDiamondRecovery(
        state.diamonds,
        state.diamondRecoveryCleared,
        state.pendingReviewItemIds,
        pendingReviewItemIds
      );
      const recentAttempts = [...[...action.attempts].reverse(), ...state.recentAttempts].slice(0, RECENT_ATTEMPTS_CAP);
      return { ...state, itemMastery, recentAttempts, pendingReviewItemIds, diamonds, diamondRecoveryCleared };
    }
    case 'MARK_PENDING_REVIEW': {
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
      const pendingReviewItemIds = applyAttemptsToPendingReview(state.pendingReviewItemIds, action.attempts);
      const { diamonds, diamondRecoveryCleared } = applyDiamondRecovery(
        state.diamonds,
        state.diamondRecoveryCleared,
        state.pendingReviewItemIds,
        pendingReviewItemIds
      );
      return { ...state, pendingReviewItemIds, diamonds, diamondRecoveryCleared };
    }
    case 'SET_PENDING_LESSON':
      return { ...state, pendingLesson: action.pendingLesson };
    case 'SPEND_DIAMOND':
      return { ...state, diamonds: Math.max(0, state.diamonds - 1) };
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
  spendDiamond: () => void;
  resetProgress: () => void;
  isLoaded: boolean;
}

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [progress, dispatch] = useReducer(reducer, initialProgressState);
  const [isLoaded, setIsLoaded] = React.useState(false);

  useEffect(() => {
    // Limpa o estado em memória antes de carregar o próximo usuário, para
    // não vazar progresso de uma conta pra outra ao trocar de usuário sem
    // recarregar a página (comum na versão web).
    dispatch({ type: 'RESET' });
    setIsLoaded(false);
    if (!uid) return;
    loadProgress(uid).then((state) => {
      dispatch({ type: 'HYDRATE', state });
      setIsLoaded(true);
    });
  }, [uid]);

  useEffect(() => {
    if (isLoaded && uid) saveProgress(uid, progress);
  }, [progress, isLoaded, uid]);

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

  const spendDiamond = () => {
    dispatch({ type: 'SPEND_DIAMOND' });
  };

  const resetProgress = () => {
    dispatch({ type: 'RESET' });
    if (uid) clearProgress(uid);
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
        spendDiamond,
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
