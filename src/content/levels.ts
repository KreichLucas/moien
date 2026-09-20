import { CEFRLevel, CEFR_LEVELS, Unit } from '../types/content';

export const LEVEL_LABELS: Record<CEFRLevel, string> = {
  'A1-INICIANTE': 'A1 · Iniciante',
  'A1-INTERMEDIARIO': 'A1 · Intermediário',
  'A1-AVANCADO': 'A1 · Avançado',
  'A2-INICIANTE': 'A2 · Iniciante',
  'A2-INTERMEDIARIO': 'A2 · Intermediário',
  'A2-AVANCADO': 'A2 · Avançado',
  'B1-INICIANTE': 'B1 · Iniciante',
  'B1-INTERMEDIARIO': 'B1 · Intermediário',
  'B1-AVANCADO': 'B1 · Avançado',
  'B2-INICIANTE': 'B2 · Iniciante',
};

export interface LevelProgress {
  level: CEFRLevel;
  completed: number;
  total: number;
  isMaxLevel: boolean;
}

/** "A1-INICIANTE" -> ["A1", "Iniciante"] — the CEFR group code and the stage name, split from the single LEVEL_LABELS string so callers don't repeat the same split(' · ') everywhere. */
export function splitLevelLabel(level: CEFRLevel): [string, string] {
  const [code, stage] = LEVEL_LABELS[level].split(' · ');
  return [code, stage];
}

/** The next level in course order after `level`, or null when `level` is already the last one (CEFR_LEVELS' final entry). */
export function nextLevel(level: CEFRLevel): CEFRLevel | null {
  const i = CEFR_LEVELS.indexOf(level);
  return i >= 0 && i < CEFR_LEVELS.length - 1 ? CEFR_LEVELS[i + 1] : null;
}

export function getLevelProgress(units: Unit[], completedLessonIds: string[]): LevelProgress {
  for (const level of CEFR_LEVELS) {
    const lessons = units.filter((u) => u.level === level).flatMap((u) => u.lessons);
    const completed = lessons.filter((l) => completedLessonIds.includes(l.id)).length;
    // A level with no lessons authored yet is "not reached" rather than
    // "instantly complete" — without this, finishing the one populated
    // level used to make getLevelProgress skip straight through every
    // empty level after it and report the very last one as maxed out.
    // That was already a latent bug with 4 levels; expanding to 10 (most
    // of which have no content yet) would have made it constantly visible.
    if (lessons.length === 0 || completed < lessons.length) {
      return { level, completed, total: lessons.length, isMaxLevel: false };
    }
  }
  const lastLevel = CEFR_LEVELS[CEFR_LEVELS.length - 1];
  const lastLessons = units.filter((u) => u.level === lastLevel).flatMap((u) => u.lessons);
  return { level: lastLevel, completed: lastLessons.length, total: lastLessons.length, isMaxLevel: true };
}
