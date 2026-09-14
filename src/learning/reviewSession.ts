import { Lesson } from '../types/content';
import { pickExerciseForItem } from './engine';
import { ItemRegistry } from './itemExtraction';
import { dueItems } from './srs';
import { ItemMasteryState } from './types';

export const DYNAMIC_REVIEW_LESSON_ID = 'review-due-dynamic';
const MAX_DYNAMIC_REVIEW_EXERCISES = 12;

// The dynamic review session isn't part of the static units.ts path, so it
// can't be looked up by findLessonById. It's built once when the learner
// taps "Praticar agora" and stashed here for LessonScreen to pick up by its
// fixed synthetic id, same-tab-navigation only (no need to persist it).
let cachedReviewLesson: Lesson | null = null;

export function setCachedReviewLesson(lesson: Lesson): void {
  cachedReviewLesson = lesson;
}

export function getCachedReviewLesson(): Lesson | null {
  return cachedReviewLesson;
}

/**
 * Builds a one-off "Revisão" lesson out of whatever the learner currently
 * has due for spaced review, most-overdue first. Used by the Revisão screen
 * (evolved PracticeScreen) instead of replaying a fixed lesson verbatim.
 */
export function buildDueReviewLesson(
  masteryMap: Record<string, ItemMasteryState>,
  registry: ItemRegistry,
  exerciseIndex: Record<string, import('../types/content').Exercise>,
  now: string
): Lesson | null {
  const due = dueItems(masteryMap, now).sort((a, b) => (a.nextReviewAt ?? '').localeCompare(b.nextReviewAt ?? ''));
  const picked = due.slice(0, MAX_DYNAMIC_REVIEW_EXERCISES);
  const exercises = picked
    .map((state) => pickExerciseForItem(state.itemId, state.domainLevel, registry, exerciseIndex))
    .filter((ex): ex is NonNullable<typeof ex> => !!ex);
  if (exercises.length === 0) return null;
  return { id: DYNAMIC_REVIEW_LESSON_ID, title: 'Revisão', exercises };
}
