import { Unit } from '../types/content';
import { isDue } from './srs';
import { ItemMasteryState } from './types';

export interface CourseMetrics {
  /** Share of all lessons in the course completed. */
  courseCompletionPct: number;
  /** Share of encountered vocabulary at domainLevel >= 4 ("uso com ajuda" or higher). */
  vocabularyMasteryPct: number;
  /** Share of mastered items (domainLevel >= 4) that are NOT currently due for review — i.e. not silently decaying. */
  retentionHealthPct: number;
}

const MASTERED_THRESHOLD = 4;

export function computeCourseMetrics(
  units: Unit[],
  completedLessonIds: string[],
  masteryMap: Record<string, ItemMasteryState>,
  now: string
): CourseMetrics {
  const totalLessons = units.flatMap((u) => u.lessons).length;
  const courseCompletionPct = totalLessons === 0 ? 0 : Math.round((completedLessonIds.length / totalLessons) * 100);

  const encountered = Object.values(masteryMap);
  const vocabularyMasteryPct =
    encountered.length === 0
      ? 0
      : Math.round((encountered.filter((s) => s.domainLevel >= MASTERED_THRESHOLD).length / encountered.length) * 100);

  const mastered = encountered.filter((s) => s.domainLevel >= MASTERED_THRESHOLD);
  const retentionHealthPct =
    mastered.length === 0 ? 100 : Math.round((mastered.filter((s) => !isDue(s, now)).length / mastered.length) * 100);

  return { courseCompletionPct, vocabularyMasteryPct, retentionHealthPct };
}
