import { applyAttempt, ApplyAttemptInput } from './mastery';
import { ItemMasteryState } from './types';

/** Base review interval (days) indexed by domainLevel 0-6, before the ease-factor multiplier. */
const BASE_INTERVAL_DAYS = [0, 1, 2, 4, 8, 16, 32];

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

/**
 * Runs a single attempt through the mastery transition (mastery.ts) and
 * then schedules the item's next review based on the resulting level and
 * ease factor. This is the only place `nextReviewAt` gets computed.
 */
export function recordAttempt(input: ApplyAttemptInput): ItemMasteryState {
  const next = applyAttempt(input);
  const intervalDays = Math.round(BASE_INTERVAL_DAYS[next.domainLevel] * next.easeFactor);
  const nextReviewAt = next.domainLevel === 0 ? null : addDays(input.now, intervalDays);
  return { ...next, nextReviewAt };
}

export function isDue(state: ItemMasteryState, now: string): boolean {
  return state.nextReviewAt !== null && state.nextReviewAt <= now;
}

export function dueItems(masteryMap: Record<string, ItemMasteryState>, now: string): ItemMasteryState[] {
  return Object.values(masteryMap).filter((state) => isDue(state, now));
}

/** Days since an item was last seen — used to split due items into "recent" vs "old" review buckets. */
export function daysSince(iso: string, now: string): number {
  const ms = new Date(now).getTime() - new Date(iso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
