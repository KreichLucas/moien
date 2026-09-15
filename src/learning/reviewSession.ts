import { Exercise, Lesson } from '../types/content';
import { pickExerciseForItem } from './engine';
import { ItemRegistry, isResolvableItem } from './itemExtraction';
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
  // Drop orphaned entries (itemId no longer resolves to any current
  // exercise, e.g. after a content rewrite) before capping — otherwise
  // stale due items can crowd out real ones within the 12-exercise cap.
  const due = dueItems(masteryMap, now)
    .filter((s) => isResolvableItem(s.itemId, registry))
    .sort((a, b) => (a.nextReviewAt ?? '').localeCompare(b.nextReviewAt ?? ''));
  const picked = due.slice(0, MAX_DYNAMIC_REVIEW_EXERCISES);
  const exercises = picked
    .map((state) => pickExerciseForItem(state.itemId, state.domainLevel, registry, exerciseIndex))
    .filter((ex): ex is NonNullable<typeof ex> => !!ex);
  if (exercises.length === 0) return null;
  return { id: DYNAMIC_REVIEW_LESSON_ID, title: 'Revisão', exercises };
}

/**
 * Picks the next exercise for diamond-recovery practice: cycles through the
 * items actually missed in the paused lesson (not the global SRS due queue
 * — a just-missed level-0 item usually isn't "due" yet, see srs.ts, so due
 * items could be empty or unrelated to what the learner just got wrong).
 * Reuses pickExerciseForItem so the exercise shown still gets easier/harder
 * with the item's real domain level, exactly like every other review path.
 */
export function pickNextRecoveryExercise(
  missedItemIds: string[],
  cursor: number,
  registry: ItemRegistry,
  exerciseIndex: Record<string, Exercise>,
  masteryMap: Record<string, ItemMasteryState>
): { exercise: Exercise; itemId: string } | null {
  if (missedItemIds.length === 0) return null;
  for (let i = 0; i < missedItemIds.length; i++) {
    const itemId = missedItemIds[(cursor + i) % missedItemIds.length];
    const domainLevel = masteryMap[itemId]?.domainLevel ?? 0;
    const exercise = pickExerciseForItem(itemId, domainLevel, registry, exerciseIndex);
    if (exercise) return { exercise, itemId };
  }
  return null;
}
