import { Exercise, Lesson } from '../types/content';
import { ItemRegistry, itemIdsForExercise } from './itemExtraction';
import { daysSince, isDue } from './srs';
import { AttemptResult, ItemMasteryState } from './types';

export interface SessionCard {
  exercise: Exercise;
  /** True when this card was pulled in for spaced review rather than the lesson's own new content. */
  isReview: boolean;
  /**
   * True for cards inserted by insertMicroReview. The screen layer must
   * exclude these from the attempts it persists at lesson end — a correct
   * answer here is real practice but must not count toward raising the
   * item's domain level past its pre-session value (see the plan's
   * pushback #3: instant same-session re-tests measure working memory,
   * not learning).
   */
  isMicroReview?: boolean;
}

export interface BuildSessionInput {
  lesson: Lesson;
  exerciseIndex: Record<string, Exercise>;
  registry: ItemRegistry;
  masteryMap: Record<string, ItemMasteryState>;
  /** Most-recent-first, already capped by the caller (see progressStorage). */
  recentAttempts: AttemptResult[];
  now: string; // ISO datetime
}

const MIN_NEW_COUNT = 2;
const RECENT_WINDOW_DAYS = 14;
const ACCURACY_WINDOW = 20;

/** How much "help" each exercise type offers, lowest = most scaffolded. */
const TIER_BY_TYPE: Record<Exercise['type'], number> = {
  match: 1,
  multipleChoice: 1,
  fillBlank: 2,
  orderWords: 3,
  translate: 4,
};

function targetTier(domainLevel: number): number {
  if (domainLevel <= 1) return 1;
  if (domainLevel <= 3) return 2;
  if (domainLevel === 4) return 3;
  return 4;
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function sortBy<T>(arr: T[], key: (item: T) => string): T[] {
  return [...arr].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
}

function sortByNumberDesc<T>(arr: T[], key: (item: T) => number): T[] {
  return [...arr].sort((a, b) => key(b) - key(a));
}

/**
 * Among every exercise known to test `itemId`, picks the one closest to the
 * item's target difficulty tier for its current domain level — the
 * mechanism that realizes "less help as mastery rises" using only exercise
 * variety the content already has. Avoids repeating `avoidExerciseId` when
 * an equally-good alternative exists; reuses it otherwise (a known content
 * gap for items with only one authored exercise, not hidden).
 */
export function pickExerciseForItem(
  itemId: string,
  domainLevel: number,
  registry: ItemRegistry,
  exerciseIndex: Record<string, Exercise>,
  avoidExerciseId?: string
): Exercise | null {
  const item = registry.items[itemId];
  if (!item) return null;
  const candidateIds = dedupe(item.sourceExerciseIds.map((ref) => ref.split('#')[0]));
  const candidates = candidateIds.map((id) => exerciseIndex[id]).filter((ex): ex is Exercise => !!ex);
  if (candidates.length === 0) return null;

  const target = targetTier(domainLevel);
  const scored = candidates
    .map((ex) => ({ ex, score: Math.abs(TIER_BY_TYPE[ex.type] - target), avoided: ex.id === avoidExerciseId }))
    .sort((a, b) => a.score - b.score);

  const bestScore = scored[0].score;
  const nonAvoidedBest = scored.find((c) => c.score === bestScore && !c.avoided);
  return (nonAvoidedBest ?? scored[0]).ex;
}

function recentAccuracy(recentAttempts: AttemptResult[]): number {
  const window = recentAttempts.slice(0, ACCURACY_WINDOW);
  if (window.length === 0) return 0.75; // neutral prior before any history exists
  return window.filter((a) => a.correct).length / window.length;
}

/** No two consecutive cards test the same item, where a swap can resolve it. */
function spreadOutRepeats(cards: SessionCard[], registry: ItemRegistry): SessionCard[] {
  const result = [...cards];
  for (let i = 1; i < result.length; i++) {
    const prevIds = itemIdsForExercise(result[i - 1].exercise, registry);
    const curIds = itemIdsForExercise(result[i].exercise, registry);
    const conflicts = curIds.some((id) => prevIds.includes(id));
    if (!conflicts) continue;
    const swapIndex = result.findIndex((c, j) => {
      if (j <= i) return false;
      const ids = itemIdsForExercise(c.exercise, registry);
      return !ids.some((id) => prevIds.includes(id));
    });
    if (swapIndex !== -1) {
      [result[i], result[swapIndex]] = [result[swapIndex], result[i]];
    }
  }
  return result;
}

export function buildSession(input: BuildSessionInput): SessionCard[] {
  const { lesson, exerciseIndex, registry, masteryMap, recentAttempts, now } = input;
  const N = lesson.exercises.length;
  if (N === 0) return [];

  const due = Object.values(masteryMap).filter((s) => isDue(s, now));
  const reviewCount = Math.min(Math.max(0, N - MIN_NEW_COUNT), due.length);
  const newCount = N - reviewCount;

  const accuracy = recentAccuracy(recentAttempts);
  let recentShare = 0.6;
  if (accuracy > 0.9) recentShare -= 0.1;
  if (accuracy < 0.6) recentShare += 0.15;
  recentShare = Math.min(1, Math.max(0, recentShare));

  const recentDue = due.filter((s) => daysSince(s.lastSeenAt, now) <= RECENT_WINDOW_DAYS);
  const oldDue = due.filter((s) => daysSince(s.lastSeenAt, now) > RECENT_WINDOW_DAYS);

  const recentReviewCount = Math.min(recentDue.length, Math.round(reviewCount * recentShare));
  const oldReviewCount = Math.min(oldDue.length, reviewCount - recentReviewCount);

  const pickedRecent = sortBy(recentDue, (s) => s.nextReviewAt ?? '').slice(0, recentReviewCount);
  const pickedOld = sortByNumberDesc(oldDue, (s) => daysSince(s.nextReviewAt ?? s.lastSeenAt, now)).slice(0, oldReviewCount);

  const reviewPicked = [...pickedRecent, ...pickedOld];
  const shortfall = reviewCount - reviewPicked.length;
  if (shortfall > 0) {
    const already = new Set(reviewPicked.map((s) => s.itemId));
    reviewPicked.push(...due.filter((s) => !already.has(s.itemId)).slice(0, shortfall));
  }

  // The pool of "new" items is left unsliced here — a lesson can easily test
  // more distinct items than it has exercises (a single match exercise alone
  // tests 4), so capping the pool to newCount before walking exercises would
  // truncate by item count instead of card count and orphan later exercises
  // whose items didn't make an arbitrary cut. The loop below caps by CARD
  // count instead, which is what newCount actually means.
  const lessonItemIds = lesson.exercises.flatMap((ex) => itemIdsForExercise(ex, registry));
  const uncoveredIds = dedupe(lessonItemIds.filter((id) => !masteryMap[id]));
  const newPoolIds = uncoveredIds.length > 0 ? uncoveredIds : dedupe(lessonItemIds);
  const newPoolSet = new Set(newPoolIds);

  // Walk the lesson's own authored order rather than picking one exercise per
  // item: a lesson may deliberately test the same item more than once (e.g. a
  // multipleChoice teach exercise followed later by a match reinforcement)
  // to build the exposure count a later select/construct/produce exercise
  // requires (see curriculumValidator.ts). Deduping down to one exercise per
  // item would silently drop that reinforcement and break the authored
  // pedagogical sequence.
  const newCards: SessionCard[] = [];
  for (const ex of lesson.exercises) {
    if (newCards.length >= newCount) break;
    const ids = itemIdsForExercise(ex, registry);
    if (ids.some((id) => newPoolSet.has(id))) {
      newCards.push({ exercise: ex, isReview: false });
    }
  }

  const reviewCards: SessionCard[] = reviewPicked
    .map((s) => pickExerciseForItem(s.itemId, s.domainLevel, registry, exerciseIndex))
    .filter((ex): ex is Exercise => !!ex)
    .map((ex) => ({ exercise: ex, isReview: true }));

  return spreadOutRepeats([...newCards, ...reviewCards], registry).slice(0, N);
}

/**
 * Session-local reinforcement: called by the screen layer when an item has
 * been missed twice in the current session. Splices one more exercise for
 * that item a couple of cards ahead (not immediately next — an instant
 * re-test measures working memory, not learning), at one tier easier than
 * its current domain level to rebuild confidence before re-testing.
 * A correct answer here must NOT be treated as raising domainLevel past its
 * pre-session value by the caller — see the plan's pushback #3.
 */
export function insertMicroReview(
  queue: SessionCard[],
  currentIndex: number,
  itemId: string,
  domainLevel: number,
  registry: ItemRegistry,
  exerciseIndex: Record<string, Exercise>
): SessionCard[] {
  const easierTier = Math.max(0, domainLevel - 1);
  const exercise = pickExerciseForItem(itemId, easierTier, registry, exerciseIndex);
  if (!exercise) return queue;
  const insertAt = Math.min(queue.length, currentIndex + 1 + 2);
  const next = [...queue];
  next.splice(insertAt, 0, { exercise, isReview: true, isMicroReview: true });
  return next;
}
