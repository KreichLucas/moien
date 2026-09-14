import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { daysSince, dueItems, isDue, recordAttempt } from './srs';
import { ItemMasteryState } from './types';

const NOW = '2026-01-10T10:00:00.000Z';

function makeAttempt(correct: boolean, now = NOW, state?: ItemMasteryState) {
  return recordAttempt({
    state,
    itemId: 'word:test',
    correct,
    exerciseId: 'ex1',
    exerciseType: 'translate',
    now,
    hasExerciseVariety: true,
  });
}

describe('recordAttempt — scheduling', () => {
  it('schedules no review (null) for a brand-new item that was just answered wrong', () => {
    const s = makeAttempt(false);
    assert.equal(s.domainLevel, 0);
    assert.equal(s.nextReviewAt, null);
  });

  it('schedules a future review once an item leaves level 0', () => {
    const s = makeAttempt(true);
    assert.equal(s.domainLevel, 1);
    assert.ok(s.nextReviewAt !== null);
    assert.ok(s.nextReviewAt! > NOW);
  });

  it('longer mastery levels get longer intervals', () => {
    let s = makeAttempt(true); // -> level 1
    const level1Interval = new Date(s.nextReviewAt!).getTime() - new Date(NOW).getTime();

    // push to a higher level using distinct days so promotions land cleanly
    let day = new Date(NOW);
    for (let i = 0; i < 6; i++) {
      day = new Date(day.getTime() + 24 * 60 * 60 * 1000);
      s = makeAttempt(true, day.toISOString(), s);
    }
    assert.ok(s.domainLevel > 1);
    const laterInterval = new Date(s.nextReviewAt!).getTime() - new Date(s.lastSeenAt).getTime();
    assert.ok(laterInterval > level1Interval, 'higher mastery should schedule further out');
  });
});

describe('isDue / dueItems', () => {
  it('an item is due once nextReviewAt has passed', () => {
    const s = makeAttempt(true);
    assert.equal(isDue(s, s.nextReviewAt!), true);
    assert.equal(isDue(s, NOW), false); // right after being answered, not due yet (interval > 0)
  });

  it('an item with nextReviewAt of null (level 0) is never due', () => {
    const s = makeAttempt(false);
    assert.equal(isDue(s, '2099-01-01T00:00:00.000Z'), false);
  });

  it('dueItems filters a mastery map down to only the overdue ones', () => {
    const fresh = makeAttempt(true, NOW); // just answered, next review is ~1 day out
    const old = makeAttempt(true, '2020-01-01T00:00:00.000Z'); // due long ago
    const map = { fresh: fresh, old: old };
    // A few hours after NOW: too soon for `fresh` to be due, but `old` has been due for years.
    const due = dueItems(map, '2026-01-10T14:00:00.000Z');
    assert.equal(due.length, 1);
    assert.equal(due[0].itemId, 'word:test');
    assert.equal(due[0].lastSeenAt, old.lastSeenAt);
  });
});

describe('daysSince', () => {
  it('computes whole days between two ISO dates', () => {
    assert.equal(daysSince('2026-01-01T00:00:00.000Z', '2026-01-05T00:00:00.000Z'), 4);
    assert.equal(daysSince('2026-01-05T00:00:00.000Z', '2026-01-05T00:00:00.000Z'), 0);
  });
});
