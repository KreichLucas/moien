import { CEFRLevel, CEFR_LEVELS, Unit } from '../types/content';

export const LEVEL_LABELS: Record<CEFRLevel, string> = {
  A1: 'A1 · Iniciante',
  A2: 'A2 · Básico',
  B1: 'B1 · Intermediário',
  B2: 'B2 · Intermediário superior',
  C1: 'C1 · Avançado',
  C2: 'C2 · Proficiente',
};

export interface LevelProgress {
  level: CEFRLevel;
  completed: number;
  total: number;
  isMaxLevel: boolean;
}

export function getLevelProgress(units: Unit[], completedLessonIds: string[]): LevelProgress {
  for (const level of CEFR_LEVELS) {
    const lessons = units.filter((u) => u.level === level).flatMap((u) => u.lessons);
    const completed = lessons.filter((l) => completedLessonIds.includes(l.id)).length;
    if (completed < lessons.length) {
      return { level, completed, total: lessons.length, isMaxLevel: false };
    }
  }
  const lastLevel = CEFR_LEVELS[CEFR_LEVELS.length - 1];
  const lastLessons = units.filter((u) => u.level === lastLevel).flatMap((u) => u.lessons);
  return { level: lastLevel, completed: lastLessons.length, total: lastLessons.length, isMaxLevel: true };
}
