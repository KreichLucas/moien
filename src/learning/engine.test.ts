import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Exercise, Lesson } from '../types/content';
import { buildSession, insertMicroReview, pickExerciseForItem } from './engine';
import { ItemRegistry } from './itemExtraction';
import { recordAttempt } from './srs';
import { AttemptResult, ItemMasteryState } from './types';

const NOW = '2026-02-01T10:00:00.000Z';

function mc(id: string): Exercise {
  return { type: 'multipleChoice', id, promptLang: 'lu', prompt: id, options: ['a', 'b'], correctIndex: 0 };
}
function translate(id: string): Exercise {
  return { type: 'translate', id, promptLang: 'lu', prompt: id, acceptedAnswers: ['x'] };
}
function fillBlank(id: string): Exercise {
  return { type: 'fillBlank', id, promptLang: 'lu', sentence: `${id} ___`, translation: '', options: ['x'], correctAnswer: 'x' };
}

/** A lesson with N new-content exercises, each its own distinct item. */
function makeLesson(n: number): { lesson: Lesson; registry: ItemRegistry; exerciseIndex: Record<string, Exercise> } {
  const exercises: Exercise[] = Array.from({ length: n }, (_, i) => mc(`new-e${i}`));
  const lesson: Lesson = { id: 'lesson-under-test', title: 'T', exercises };
  const registry: ItemRegistry = { items: {}, exerciseToItemIds: {} };
  const exerciseIndex: Record<string, Exercise> = {};
  exercises.forEach((ex, i) => {
    const itemId = `word:new${i}`;
    registry.items[itemId] = { id: itemId, kind: 'word', displayLu: ex.id, displayPt: '', sourceExerciseIds: [ex.id], firstSeenUnitId: 'u1' };
    registry.exerciseToItemIds[ex.id] = [itemId];
    exerciseIndex[ex.id] = ex;
  });
  return { lesson, registry, exerciseIndex };
}

function dueState(itemId: string, domainLevel: ItemMasteryState['domainLevel'], daysOverdue: number, lastSeenDaysAgo = daysOverdue): ItemMasteryState {
  const nowMs = new Date(NOW).getTime();
  const nextReviewAt = new Date(nowMs - daysOverdue * 86_400_000).toISOString();
  const lastSeenAt = new Date(nowMs - lastSeenDaysAgo * 86_400_000).toISOString();
  return {
    itemId,
    domainLevel,
    consecutiveCorrect: 0,
    easeFactor: 1.0,
    timesShown: 3,
    timesCorrect: 2,
    timesWrong: 1,
    lastSeenAt,
    nextReviewAt,
    history: [],
  };
}

describe('buildSession — backlog-aware new/review ratio', () => {
  it('fills the whole session with new content when nothing is due', () => {
    const { lesson, registry, exerciseIndex } = makeLesson(8);
    const session = buildSession({ lesson, exerciseIndex, registry, masteryMap: {}, recentAttempts: [], now: NOW });
    assert.equal(session.length, 8);
    assert.ok(session.every((c) => !c.isReview));
  });

  it('reserves at least MIN_NEW_COUNT slots for new content even with a huge backlog', () => {
    const { lesson, registry, exerciseIndex } = makeLesson(8);
    const reviewRegistry: ItemRegistry = { ...registry, items: { ...registry.items }, exerciseToItemIds: { ...registry.exerciseToItemIds } };
    const masteryMap: Record<string, ItemMasteryState> = {};
    for (let i = 0; i < 50; i++) {
      const itemId = `word:due${i}`;
      const exId = `due-e${i}`;
      reviewRegistry.items[itemId] = { id: itemId, kind: 'word', displayLu: exId, displayPt: '', sourceExerciseIds: [exId], firstSeenUnitId: 'u1' };
      reviewRegistry.exerciseToItemIds[exId] = [itemId];
      exerciseIndex[exId] = translate(exId);
      masteryMap[itemId] = dueState(itemId, 2, 5);
    }
    const session = buildSession({ lesson, exerciseIndex, registry: reviewRegistry, masteryMap, recentAttempts: [], now: NOW });
    const newCount = session.filter((c) => !c.isReview).length;
    assert.ok(newCount >= 2, `expected at least 2 new cards, got ${newCount}`);
    assert.equal(session.length, lesson.exercises.length, 'session length should match the authored lesson length');
  });

  it('never lets the review count exceed how many items are actually due', () => {
    const { lesson, registry, exerciseIndex } = makeLesson(8);
    const itemId = 'word:onlyone';
    const exId = 'only-e1';
    registry.items[itemId] = { id: itemId, kind: 'word', displayLu: exId, displayPt: '', sourceExerciseIds: [exId], firstSeenUnitId: 'u1' };
    registry.exerciseToItemIds[exId] = [itemId];
    exerciseIndex[exId] = translate(exId);
    const masteryMap = { [itemId]: dueState(itemId, 3, 2) };
    const session = buildSession({ lesson, exerciseIndex, registry, masteryMap, recentAttempts: [], now: NOW });
    const reviewCount = session.filter((c) => c.isReview).length;
    assert.equal(reviewCount, 1);
  });
});

describe('buildSession — variety-aware exercise picking', () => {
  it('pickExerciseForItem prefers a translate exercise (highest tier) for a well-mastered item', () => {
    const registry: ItemRegistry = {
      items: { 'word:x': { id: 'word:x', kind: 'word', displayLu: 'x', displayPt: '', sourceExerciseIds: ['mc1', 'fb1', 'tr1'], firstSeenUnitId: 'u1' } },
      exerciseToItemIds: {},
    };
    const exerciseIndex = { mc1: mc('mc1'), fb1: fillBlank('fb1'), tr1: translate('tr1') };
    const picked = pickExerciseForItem('word:x', 6, registry, exerciseIndex);
    assert.equal(picked?.type, 'translate');
  });

  it('pickExerciseForItem prefers a recognition exercise (multipleChoice/match) for a brand-new item', () => {
    const registry: ItemRegistry = {
      items: { 'word:x': { id: 'word:x', kind: 'word', displayLu: 'x', displayPt: '', sourceExerciseIds: ['mc1', 'fb1', 'tr1'], firstSeenUnitId: 'u1' } },
      exerciseToItemIds: {},
    };
    const exerciseIndex = { mc1: mc('mc1'), fb1: fillBlank('fb1'), tr1: translate('tr1') };
    const picked = pickExerciseForItem('word:x', 0, registry, exerciseIndex);
    assert.equal(picked?.type, 'multipleChoice');
  });

  it('reuses the only available exercise when an item has no variety', () => {
    const registry: ItemRegistry = {
      items: { 'word:x': { id: 'word:x', kind: 'word', displayLu: 'x', displayPt: '', sourceExerciseIds: ['mc1'], firstSeenUnitId: 'u1' } },
      exerciseToItemIds: {},
    };
    const exerciseIndex = { mc1: mc('mc1') };
    const picked = pickExerciseForItem('word:x', 6, registry, exerciseIndex);
    assert.equal(picked?.id, 'mc1');
  });
});

describe('buildSession — no two consecutive cards share an item', () => {
  it('spreads out review picks when possible', () => {
    const { lesson, registry, exerciseIndex } = makeLesson(4);
    const masteryMap: Record<string, ItemMasteryState> = {};
    for (let i = 0; i < 4; i++) {
      const itemId = `word:rev${i}`;
      const exId = `rev-e${i}`;
      registry.items[itemId] = { id: itemId, kind: 'word', displayLu: exId, displayPt: '', sourceExerciseIds: [exId], firstSeenUnitId: 'u1' };
      registry.exerciseToItemIds[exId] = [itemId];
      exerciseIndex[exId] = translate(exId);
      masteryMap[itemId] = dueState(itemId, 2, 3);
    }
    const session = buildSession({ lesson, exerciseIndex, registry, masteryMap, recentAttempts: [], now: NOW });
    for (let i = 1; i < session.length; i++) {
      const prevId = registry.exerciseToItemIds[session[i - 1].exercise.id]?.[0];
      const curId = registry.exerciseToItemIds[session[i].exercise.id]?.[0];
      assert.notEqual(prevId, curId, `consecutive cards ${i - 1} and ${i} both test ${curId}`);
    }
  });
});

describe('insertMicroReview', () => {
  it('inserts a card marked isMicroReview a couple of positions ahead, not immediately next', () => {
    const { exerciseIndex } = makeLesson(1);
    const registry: ItemRegistry = {
      items: { 'word:x': { id: 'word:x', kind: 'word', displayLu: 'x', displayPt: '', sourceExerciseIds: ['x1'], firstSeenUnitId: 'u1' } },
      exerciseToItemIds: { x1: ['word:x'] },
    };
    exerciseIndex['x1'] = mc('x1');
    const queue = [
      { exercise: mc('a'), isReview: false },
      { exercise: mc('b'), isReview: false },
      { exercise: mc('c'), isReview: false },
    ];
    const result = insertMicroReview(queue, 0, 'word:x', 2, registry, exerciseIndex);
    assert.equal(result.length, 4);
    const insertedIndex = result.findIndex((c) => c.isMicroReview);
    assert.ok(insertedIndex > 1, 'should not be immediately next to the current card');
  });

  it('returns the queue unchanged if the item has no known exercise', () => {
    const registry: ItemRegistry = { items: {}, exerciseToItemIds: {} };
    const queue = [{ exercise: mc('a'), isReview: false }];
    const result = insertMicroReview(queue, 0, 'word:unknown', 0, registry, {});
    assert.equal(result.length, 1);
  });
});

describe('edge cases from user journeys', () => {
  it('a user who gets everything right accumulates only forward-scheduled reviews, no due backlog', () => {
    let state: ItemMasteryState | undefined;
    let now = NOW;
    for (let i = 0; i < 5; i++) {
      state = recordAttempt({ state, itemId: 'word:x', correct: true, exerciseId: 'e', exerciseType: 'translate', now, hasExerciseVariety: true });
      now = new Date(new Date(now).getTime() + 86_400_000).toISOString();
    }
    assert.ok(state!.domainLevel >= 3);
    assert.equal(state!.nextReviewAt !== null && state!.nextReviewAt > now, true, 'should be scheduled in the future, not overdue');
  });

  it('a user who gets almost everything wrong stays pinned near level 0 with no scheduled review (always re-taught immediately)', () => {
    let state: ItemMasteryState | undefined;
    let now = NOW;
    for (let i = 0; i < 5; i++) {
      state = recordAttempt({ state, itemId: 'word:x', correct: i === 2, exerciseId: 'e', exerciseType: 'translate', now, hasExerciseVariety: true });
      now = new Date(new Date(now).getTime() + 86_400_000).toISOString();
    }
    assert.ok(state!.domainLevel <= 1);
  });

  it('a user who abandons a unit for many days sees it as due, not lost', () => {
    const state = dueState('word:x', 3, 40);
    assert.equal(state.nextReviewAt! < NOW, true);
  });

  it('a returning user (weeks later) gets old-review items included in the session', () => {
    const { lesson, registry, exerciseIndex } = makeLesson(6);
    const itemId = 'word:old';
    const exId = 'old-e1';
    registry.items[itemId] = { id: itemId, kind: 'word', displayLu: exId, displayPt: '', sourceExerciseIds: [exId], firstSeenUnitId: 'u1' };
    registry.exerciseToItemIds[exId] = [itemId];
    exerciseIndex[exId] = translate(exId);
    const masteryMap = { [itemId]: dueState(itemId, 4, 30, 30) }; // last seen 30 days ago, well past the 14-day "recent" window
    const session = buildSession({ lesson, exerciseIndex, registry, masteryMap, recentAttempts: [], now: NOW });
    assert.ok(session.some((c) => c.isReview), 'the long-overdue item should be pulled into the session');
  });

  it('a user with split mastery (some words mastered, some struggling) keeps both trackable independently', () => {
    let strong: ItemMasteryState | undefined;
    let weak: ItemMasteryState | undefined;
    let now = NOW;
    for (let i = 0; i < 8; i++) {
      strong = recordAttempt({ state: strong, itemId: 'word:strong', correct: true, exerciseId: 'e', exerciseType: 'translate', now, hasExerciseVariety: true });
      weak = recordAttempt({ state: weak, itemId: 'word:weak', correct: false, errorType: 'other', exerciseId: 'e', exerciseType: 'translate', now, hasExerciseVariety: true });
      now = new Date(new Date(now).getTime() + 86_400_000).toISOString();
    }
    assert.ok(strong!.domainLevel > weak!.domainLevel);
  });
});

describe('recentAttempts accuracy shifts the interleave ratio', () => {
  function withAccuracy(correctFraction: number): AttemptResult[] {
    return Array.from({ length: 20 }, (_, i) => ({
      itemId: `word:a${i}`,
      correct: i < correctFraction * 20,
      exerciseId: `e${i}`,
      exerciseType: 'translate' as const,
    }));
  }

  it('does not crash and still respects MIN_NEW_COUNT for very low or very high recent accuracy', () => {
    const { lesson, registry, exerciseIndex } = makeLesson(8);
    const masteryMap: Record<string, ItemMasteryState> = {};
    for (let i = 0; i < 10; i++) {
      const itemId = `word:d${i}`;
      const exId = `d-e${i}`;
      registry.items[itemId] = { id: itemId, kind: 'word', displayLu: exId, displayPt: '', sourceExerciseIds: [exId], firstSeenUnitId: 'u1' };
      registry.exerciseToItemIds[exId] = [itemId];
      exerciseIndex[exId] = translate(exId);
      masteryMap[itemId] = dueState(itemId, 2, i % 2 === 0 ? 3 : 20);
    }
    for (const acc of [0.1, 0.95]) {
      const session = buildSession({ lesson, exerciseIndex, registry, masteryMap, recentAttempts: withAccuracy(acc), now: NOW });
      assert.ok(session.filter((c) => !c.isReview).length >= 2);
      assert.equal(session.length, 8);
    }
  });
});
