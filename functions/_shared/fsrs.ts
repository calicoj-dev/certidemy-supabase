// FSRS-5 spaced repetition algorithm — pure functions, no I/O.
//
// References:
//   - https://github.com/open-spaced-repetition/fsrs4anki/wiki
//   - https://github.com/open-spaced-repetition/ts-fsrs
//
// Card semantics:
//   - stability  S : days for retrievability to fall to ~90%
//   - difficulty D : 1..10, how hard the card is for THIS user
//   - retrievability R(t,S) : probability of recall after t days
//
// Each review takes (card, rating, now) → new card with new due date.

import type { Rating, FsrsStateName } from './types.ts';

export interface FsrsCard {
  state: FsrsStateName;
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  last_review: Date | null;
}

export interface FsrsParams {
  w: number[];                // 19 algorithm weights (FSRS-5)
  request_retention: number;  // target retention probability (default 0.9)
  maximum_interval: number;   // hard cap on interval in days
}

// Default weights from the FSRS-5 optimizer's "average user" prior.
// Override per-user once you have enough review history to fine-tune.
export const DEFAULT_FSRS_PARAMS: FsrsParams = {
  w: [
    0.40255, 1.18385, 3.173, 15.69105,
    7.1949, 0.5345, 1.4604, 0.0046,
    1.54575, 0.1192, 1.01925, 1.9395,
    0.11, 0.29605, 2.2698,
    0.2315, 2.9898, 0.51655, 0.6621,
  ],
  request_retention: 0.9,
  maximum_interval: 36500,
};

const DECAY = -0.5;
const FACTOR = 19 / 81; // = 0.9^(1/DECAY) - 1

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

function retrievability(elapsed_days: number, stability: number): number {
  return Math.pow(1 + FACTOR * elapsed_days / Math.max(stability, 0.001), DECAY);
}

function nextIntervalDays(stability: number, params: FsrsParams): number {
  const interval = (stability / FACTOR) * (Math.pow(params.request_retention, 1 / DECAY) - 1);
  return clamp(Math.round(interval), 1, params.maximum_interval);
}

function initDifficulty(rating: Rating, w: number[]): number {
  return clamp(w[4] - Math.exp(w[5] * (rating - 1)) + 1, 1, 10);
}

function initStability(rating: Rating, w: number[]): number {
  return Math.max(0.1, w[rating - 1]);
}

function nextDifficulty(d: number, rating: Rating, w: number[]): number {
  const delta = -w[6] * (rating - 3);
  const dPrime = d + delta * (10 - d) / 9;
  // Mean reversion toward the difficulty of an Easy-rated new card —
  // prevents D from drifting to extremes over many reviews.
  const dEasyInit = initDifficulty(4, w);
  return clamp(w[7] * dEasyInit + (1 - w[7]) * dPrime, 1, 10);
}

function stabilityAfterSuccess(d: number, s: number, r: number, rating: Rating, w: number[]): number {
  const hardPenalty = rating === 2 ? w[15] : 1;
  const easyBonus = rating === 4 ? w[16] : 1;
  const sInc = Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) * (Math.exp((1 - r) * w[10]) - 1);
  return s * (1 + sInc * hardPenalty * easyBonus);
}

function stabilityAfterLapse(d: number, s: number, r: number, w: number[]): number {
  return w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp((1 - r) * w[14]);
}

/**
 * Apply a review to a card and return the updated state.
 *   - card    : current card (use a `new`-state default for first review)
 *   - rating  : 1 Again, 2 Hard, 3 Good, 4 Easy
 *   - now     : timestamp of the review
 */
export function review(
  card: FsrsCard,
  rating: Rating,
  now: Date,
  params: FsrsParams = DEFAULT_FSRS_PARAMS,
): FsrsCard {
  const w = params.w;
  const last = card.last_review ?? now;
  const elapsed_days = Math.max(0, (now.getTime() - last.getTime()) / 86_400_000);

  let new_state: FsrsStateName;
  let new_difficulty: number;
  let new_stability: number;
  let lapses = card.lapses;
  let scheduled_days: number;

  if (card.state === 'new') {
    new_difficulty = initDifficulty(rating, w);
    new_stability = initStability(rating, w);
    if (rating <= 2) {
      new_state = 'learning';
      scheduled_days = 0; // re-show in minutes, not days
    } else {
      new_state = 'review';
      scheduled_days = nextIntervalDays(new_stability, params);
    }
  } else {
    const r = retrievability(elapsed_days, card.stability);
    new_difficulty = nextDifficulty(card.difficulty, rating, w);

    if (rating === 1) {
      // Lapse: drop into relearning with a short interval.
      new_stability = stabilityAfterLapse(card.difficulty, card.stability, r, w);
      new_state = 'relearning';
      lapses += 1;
      scheduled_days = 0;
    } else {
      new_stability = stabilityAfterSuccess(card.difficulty, card.stability, r, rating, w);
      new_state = 'review';
      scheduled_days = nextIntervalDays(new_stability, params);
    }
  }

  const due = new Date(now);
  if (scheduled_days === 0) {
    due.setMinutes(due.getMinutes() + 10); // short relearning step
  } else {
    due.setDate(due.getDate() + scheduled_days);
  }

  return {
    state: new_state,
    due,
    stability: new_stability,
    difficulty: new_difficulty,
    elapsed_days,
    scheduled_days,
    reps: card.reps + 1,
    lapses,
    last_review: now,
  };
}

/**
 * Derive an FSRS rating from a graded quiz answer.
 *   - Wrong            → Again (1)
 *   - Right & fast     → Easy  (4)
 *   - Right & normal   → Good  (3)
 *   - Right & slow     → Hard  (2)
 * App can also expose a "rate your confidence" UI and skip this heuristic.
 */
export function ratingFromOutcome(
  is_correct: boolean,
  time_taken_seconds: number,
  expected_seconds = 30,
): Rating {
  if (!is_correct) return 1;
  const ratio = time_taken_seconds / Math.max(1, expected_seconds);
  if (ratio < 0.5) return 4;
  if (ratio < 1.5) return 3;
  return 2;
}

export function defaultNewCard(now: Date = new Date()): FsrsCard {
  return {
    state: 'new',
    due: now,
    stability: 0,
    difficulty: 5,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    last_review: null,
  };
}
