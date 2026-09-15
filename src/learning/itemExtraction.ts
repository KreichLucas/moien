import { Exercise, Unit } from '../types/content';
import { isSingleLuWord, normalizeWord, stripLeadingArticle } from '../content/wordNormalization';
import { LearningItem } from './types';

export interface ItemRegistry {
  /** itemId -> LearningItem */
  items: Record<string, LearningItem>;
  /** "exerciseId" (or "exerciseId#pairIndex" for match pairs) -> itemId[] tested there. */
  exerciseToItemIds: Record<string, string[]>;
}

function wordItemId(luText: string): string {
  return `word:${normalizeWord(stripLeadingArticle(luText))}`;
}

function phraseItemId(ref: string): string {
  return `phrase:${ref}`;
}

interface RawOccurrence {
  itemId: string;
  kind: 'word' | 'phrase';
  displayLu: string;
  displayPt: string;
  ref: string; // exerciseId or "exerciseId#pairIndex"
  unitId: string;
}

/** The Luxembourgish text an exercise is actually testing, plus its best-known PT meaning. */
function luContentOf(exercise: Exercise): { lu: string; pt: string } | null {
  switch (exercise.type) {
    case 'multipleChoice':
      return exercise.promptLang === 'lu'
        ? { lu: exercise.prompt, pt: exercise.options[exercise.correctIndex] }
        : { lu: exercise.options[exercise.correctIndex], pt: exercise.prompt };
    case 'translate':
      return exercise.promptLang === 'lu'
        ? { lu: exercise.prompt, pt: exercise.acceptedAnswers[0] }
        : { lu: exercise.acceptedAnswers[0], pt: exercise.prompt };
    case 'fillBlank':
      return { lu: exercise.correctAnswer, pt: exercise.translation };
    case 'orderWords':
      return { lu: exercise.correctOrder.join(' '), pt: exercise.translation };
    case 'match':
      return null; // handled per-pair by the caller
  }
}

function occurrencesFor(exercise: Exercise, unitId: string): RawOccurrence[] {
  if (exercise.type === 'match') {
    return exercise.pairs.map((pair, index) => {
      const ref = `${exercise.id}#${index}`;
      const itemId = pair.itemId ?? (isSingleLuWord(pair.lu) ? wordItemId(pair.lu) : phraseItemId(ref));
      const kind: 'word' | 'phrase' = itemId.startsWith('word:') ? 'word' : 'phrase';
      return { itemId, kind, displayLu: stripLeadingArticle(pair.lu), displayPt: pair.pt, ref, unitId };
    });
  }

  const content = luContentOf(exercise);
  if (!content) return [];
  const override = exercise.itemIds?.[0];
  const itemId = override ?? (isSingleLuWord(content.lu) ? wordItemId(content.lu) : phraseItemId(exercise.id));
  const kind: 'word' | 'phrase' = itemId.startsWith('word:') ? 'word' : 'phrase';
  return [{ itemId, kind, displayLu: stripLeadingArticle(content.lu), displayPt: content.pt, ref: exercise.id, unitId }];
}

/**
 * Mechanically derives a stable LearningItem per distinct word (and a
 * one-off item per non-single-word exercise/pair) across the whole course,
 * with zero changes required to units.ts. Words that recur across many
 * exercises accumulate all of those exercise refs in sourceExerciseIds, so
 * the engine can later pick among several exercise "shapes" for the same
 * item when choosing how much help to offer.
 */
export function buildItemRegistry(units: Unit[]): ItemRegistry {
  const items: Record<string, LearningItem> = {};
  const exerciseToItemIds: Record<string, string[]> = {};

  units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.exercises.forEach((exercise) => {
        occurrencesFor(exercise, unit.id).forEach((occ) => {
          const existing = items[occ.itemId];
          if (existing) {
            if (!existing.sourceExerciseIds.includes(occ.ref)) existing.sourceExerciseIds.push(occ.ref);
          } else {
            items[occ.itemId] = {
              id: occ.itemId,
              kind: occ.kind,
              displayLu: occ.displayLu,
              displayPt: occ.displayPt,
              sourceExerciseIds: [occ.ref],
              firstSeenUnitId: occ.unitId,
            };
          }
          exerciseToItemIds[occ.ref] = [...(exerciseToItemIds[occ.ref] ?? []), occ.itemId];
        });
      });
    });
  });

  return { items, exerciseToItemIds };
}

export function hasExerciseVariety(registry: ItemRegistry, itemId: string): boolean {
  return (registry.items[itemId]?.sourceExerciseIds.length ?? 0) > 1;
}

/**
 * True only if this item still resolves to real content in the CURRENT
 * registry. Content gets renamed/restructured over time (e.g. an exercise
 * id gets reused for different content, or a phrase item's source exercise
 * is removed), and a learner's persisted itemMastery can end up with
 * "orphaned" entries pointing at ids that no longer mean anything. Every
 * place that treats an item as "due for review" must filter through this
 * first — an orphaned due item still counts toward isDue's true/false, but
 * silently fails to produce an exercise, which previously shrank
 * buildSession's review slot allocation without backfilling it with new
 * content, cutting a lesson far shorter than its authored length.
 */
export function isResolvableItem(itemId: string, registry: ItemRegistry): boolean {
  return !!registry.items[itemId];
}

/** Which learning item(s) a given exercise tests — one per match pair, else at most one. */
export function itemIdsForExercise(exercise: Exercise, registry: ItemRegistry): string[] {
  if (exercise.type === 'match') {
    return exercise.pairs.flatMap((_, i) => registry.exerciseToItemIds[`${exercise.id}#${i}`] ?? []);
  }
  return registry.exerciseToItemIds[exercise.id] ?? [];
}
