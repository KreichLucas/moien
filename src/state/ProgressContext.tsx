import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { ProgressState, initialProgressState, loadProgress, saveProgress } from './progressStorage';

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

type Action =
  | { type: 'HYDRATE'; state: ProgressState }
  | { type: 'COMPLETE_LESSON'; lessonId: string; xpEarned: number };

function reducer(state: ProgressState, action: Action): ProgressState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;
    case 'COMPLETE_LESSON': {
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
      return {
        ...state,
        xp: state.xp + action.xpEarned,
        streak,
        lastActiveDate: today,
        completedLessonIds,
        activeDates,
      };
    }
    default:
      return state;
  }
}

interface ProgressContextValue {
  progress: ProgressState;
  completeLesson: (lessonId: string, xpEarned: number) => void;
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

  const completeLesson = (lessonId: string, xpEarned: number) => {
    dispatch({ type: 'COMPLETE_LESSON', lessonId, xpEarned });
  };

  return (
    <ProgressContext.Provider value={{ progress, completeLesson, isLoaded }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress deve ser usado dentro de ProgressProvider');
  return ctx;
}
