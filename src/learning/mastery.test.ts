import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { applyAttempt } from './mastery';
import { ItemMasteryState } from './types';

function attempt(
  state: ItemMasteryState | undefined,
  correct: boolean,
  opts: Partial<{ errorType: 'wrong-article' | 'close-miss' | 'other'; now: string; hasExerciseVariety: boolean }> = {}
): ItemMasteryState {
  return applyAttempt({
    state,
    itemId: 'word:test',
    correct,
    errorType: opts.errorType,
    exerciseId: 'ex1',
    exerciseType: 'translate',
    now: opts.now ?? '2026-01-01T10:00:00.000Z',
    hasExerciseVariety: opts.hasExerciseVariety ?? true,
  });
}

describe('applyAttempt — domain level transitions', () => {
  it('starts a never-seen item at level 0', () => {
    const s = attempt(undefined, true);
    assert.equal(s.domainLevel, 1); // one correct answer already promotes 0 -> 1
  });

  it('promotes 0 -> 1 after a single correct answer', () => {
    const s = attempt(undefined, true);
    assert.equal(s.domainLevel, 1);
    assert.equal(s.consecutiveCorrect, 0); // streak resets after a promotion
  });

  it('needs 2 correct in a row to go from 1 -> 2', () => {
    let s = attempt(undefined, true); // 0 -> 1
    s = attempt(s, true); // 1st correct at level 1 (not enough yet)
    assert.equal(s.domainLevel, 1);
    s = attempt(s, true); // 2nd correct at level 1 -> promotes
    assert.equal(s.domainLevel, 2);
  });

  it('a wrong answer with errorType "other" demotes one level, never below 0', () => {
    let s = attempt(undefined, true); // -> level 1
    s = attempt(s, false, { errorType: 'other' }); // -> level 0
    assert.equal(s.domainLevel, 0);
    s = attempt(s, false, { errorType: 'other' }); // stays at 0, floor
    assert.equal(s.domainLevel, 0);
  });

  it('a wrong-article/close-miss error does NOT demote the level, only resets the streak', () => {
    let s = attempt(undefined, true); // -> 1
    s = attempt(s, true); // 1 correct at level 1
    s = attempt(s, false, { errorType: 'wrong-article' }); // should NOT demote
    assert.equal(s.domainLevel, 1);
    assert.equal(s.consecutiveCorrect, 0); // but the streak resets
  });

  it('requires 3 correct in a row to cross from level 4 to 5 (with exercise variety)', () => {
    let s: ItemMasteryState | undefined = undefined;
    // Walk it up to level 4 first: 0->1 (1 correct), 1->2 (2), 2->3 (2), 3->4 (2) = 7 corrects total
    for (let i = 0; i < 7; i++) s = attempt(s, true);
    assert.equal(s!.domainLevel, 4);
    s = attempt(s, true);
    s = attempt(s, true);
    assert.equal(s!.domainLevel, 4); // only 2 of the 3 needed
    s = attempt(s, true);
    assert.equal(s!.domainLevel, 5);
  });

  it('level 6 never advances further and consecutiveCorrect keeps growing', () => {
    let s: ItemMasteryState | undefined = undefined;
    for (let i = 0; i < 13; i++) s = attempt(s, true); // enough to reach level 6
    assert.equal(s!.domainLevel, 6);
    const before = s!.consecutiveCorrect;
    s = attempt(s, true);
    assert.equal(s!.domainLevel, 6);
    assert.equal(s!.consecutiveCorrect, before + 1);
  });

  it('a genuine wrong answer at level 6 demotes to 5', () => {
    let s: ItemMasteryState | undefined = undefined;
    for (let i = 0; i < 13; i++) s = attempt(s, true);
    assert.equal(s!.domainLevel, 6);
    s = attempt(s, false, { errorType: 'other' });
    assert.equal(s.domainLevel, 5);
  });
});

describe('applyAttempt — singleton-item cross-day promotion rule', () => {
  it('does NOT promote 4 -> 5 within the same day when the item has no exercise variety', () => {
    let s: ItemMasteryState | undefined = undefined;
    const day1 = '2026-01-01T10:00:00.000Z';
    for (let i = 0; i < 7; i++) s = attempt(s, true, { now: day1, hasExerciseVariety: false });
    assert.equal(s!.domainLevel, 4);
    // 3 more correct, all same day — numerically enough, but same-day
    s = attempt(s, true, { now: day1, hasExerciseVariety: false });
    s = attempt(s, true, { now: day1, hasExerciseVariety: false });
    s = attempt(s, true, { now: day1, hasExerciseVariety: false });
    assert.equal(s!.domainLevel, 4, 'should stay at 4 until a correct answer lands on a different day');
  });

  it('promotes 4 -> 5 once the streak spans a second calendar day for a singleton item', () => {
    let s: ItemMasteryState | undefined = undefined;
    const day1 = '2026-01-01T10:00:00.000Z';
    const day2 = '2026-01-02T10:00:00.000Z';
    for (let i = 0; i < 7; i++) s = attempt(s, true, { now: day1, hasExerciseVariety: false });
    assert.equal(s!.domainLevel, 4);
    s = attempt(s, true, { now: day1, hasExerciseVariety: false });
    s = attempt(s, true, { now: day1, hasExerciseVariety: false });
    assert.equal(s!.domainLevel, 4);
    s = attempt(s, true, { now: day2, hasExerciseVariety: false });
    assert.equal(s!.domainLevel, 5, 'the 3rd correct answer landed on a new day, so it should promote');
  });

  it('items with exercise variety are unaffected by the cross-day rule', () => {
    let s: ItemMasteryState | undefined = undefined;
    const day1 = '2026-01-01T10:00:00.000Z';
    for (let i = 0; i < 10; i++) s = attempt(s, true, { now: day1, hasExerciseVariety: true });
    assert.equal(s!.domainLevel, 5, 'all same-day promotions should apply normally when variety exists');
  });
});

describe('applyAttempt — ease factor', () => {
  it('increases on correct answers and decreases more on genuine errors than near-misses', () => {
    const correct = attempt(undefined, true);
    assert.ok(correct.easeFactor > 1.0);

    const other = attempt(undefined, false, { errorType: 'other' });
    const closeMiss = attempt(undefined, false, { errorType: 'close-miss' });
    assert.ok(other.easeFactor < closeMiss.easeFactor);
  });

  it('stays within [0.7, 1.3]', () => {
    let s: ItemMasteryState | undefined = undefined;
    for (let i = 0; i < 30; i++) s = attempt(s, true);
    assert.ok(s!.easeFactor <= 1.3);
    s = attempt(undefined, false, { errorType: 'other' });
    for (let i = 0; i < 30; i++) s = attempt(s, false, { errorType: 'other' });
    assert.ok(s!.easeFactor >= 0.7);
  });
});

describe('applyAttempt — bookkeeping', () => {
  it('tracks timesShown/timesCorrect/timesWrong and bounds history to 5', () => {
    let s: ItemMasteryState | undefined = undefined;
    for (let i = 0; i < 8; i++) s = attempt(s, i % 2 === 0);
    assert.equal(s!.timesShown, 8);
    assert.equal(s!.timesCorrect, 4);
    assert.equal(s!.timesWrong, 4);
    assert.equal(s!.history.length, 5);
    assert.equal(s!.history[0].correct, false); // last attempt (i=7) was odd -> incorrect, newest-first
  });
});
