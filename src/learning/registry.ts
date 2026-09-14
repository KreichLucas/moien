import { units } from '../content/units';
import { Exercise } from '../types/content';
import { buildItemRegistry } from './itemExtraction';

/** Precomputed once at module load, same pattern as content/glossary.ts. */
export const ITEM_REGISTRY = buildItemRegistry(units);

export const EXERCISE_INDEX: Record<string, Exercise> = (() => {
  const index: Record<string, Exercise> = {};
  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.exercises.forEach((exercise) => {
        index[exercise.id] = exercise;
      });
    });
  });
  return index;
})();
