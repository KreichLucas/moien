import { CEFRLevel, CEFR_LEVELS, Exercise, Lesson, Unit } from '../types/content';

const REVIEW_EXERCISE_COUNT = 8;

function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function reviewLessonId(level: CEFRLevel): string {
  return `review-${level}`;
}

function buildReviewLesson(units: Unit[], level: CEFRLevel): Lesson | null {
  const levelIndex = CEFR_LEVELS.indexOf(level);
  if (levelIndex <= 0) return null;
  const previousLevels = CEFR_LEVELS.slice(0, levelIndex);
  const pool: Exercise[] = units
    .filter((u) => previousLevels.includes(u.level))
    .flatMap((u) => u.lessons)
    .flatMap((l) => l.exercises);
  if (pool.length === 0) return null;
  const picked = seededShuffle(pool, reviewLessonId(level)).slice(0, Math.min(REVIEW_EXERCISE_COUNT, pool.length));
  return {
    id: reviewLessonId(level),
    title: 'Revisão',
    exercises: picked,
  };
}

export interface PathUnit extends Unit {
  isReview?: boolean;
}

/**
 * Builds the full learning path, inserting a short review lesson (pulling
 * exercises from previous levels) right before the first unit of every new
 * level, so learners keep practicing older vocabulary as they advance.
 */
export function buildPathUnits(units: Unit[]): PathUnit[] {
  const levelsPresent = CEFR_LEVELS.filter((lvl) => units.some((u) => u.level === lvl));
  const result: PathUnit[] = [];

  levelsPresent.forEach((level) => {
    const reviewLesson = buildReviewLesson(units, level);
    if (reviewLesson) {
      result.push({
        id: `review-unit-${level}`,
        title: 'Revisão',
        description: `Relembrando o que você já aprendeu antes do nível ${level}`,
        level,
        lessons: [reviewLesson],
        isReview: true,
      });
    }
    units.filter((u) => u.level === level).forEach((u) => result.push(u));
  });

  return result;
}

export function getPathLessons(units: Unit[]): Lesson[] {
  return buildPathUnits(units).flatMap((u) => u.lessons);
}

export function findLessonById(units: Unit[], lessonId: string): Lesson | undefined {
  return getPathLessons(units).find((l) => l.id === lessonId);
}
