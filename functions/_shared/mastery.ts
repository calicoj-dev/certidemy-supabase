// Knowledge tracing.
//
// We use an EWMA-style mastery update with two adjustments:
//   - Time decay toward an uninformed prior (0.5). If a learner hasn't seen
//     a concept in weeks, our certainty about their mastery should fade.
//   - Difficulty-weighted learning rate. Getting a hard question right is
//     more informative than getting an easy one right.
//
// We aggregate per-concept mastery into a single readiness score that maps
// to a predicted pass probability via a sigmoid centered on the cert's
// passing threshold.

const PRIOR = 0.5;
const DECAY_PER_DAY = 0.01; // ~1% drift per day toward the prior
const BASE_ALPHA = 0.25;

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

export interface MasteryUpdateInput {
  old_mastery: number | null;
  old_attempts: number;
  old_correct: number;
  is_correct: boolean;
  question_difficulty: number; // 1..5
  days_since_last_seen: number;
  weight: number;              // 0..1 — share of this Q allocated to this concept
}

export interface MasteryUpdateResult {
  mastery: number;
  attempts: number;
  correct: number;
}

export function updateMastery(input: MasteryUpdateInput): MasteryUpdateResult {
  const prior = input.old_mastery ?? PRIOR;
  const decay = Math.exp(-DECAY_PER_DAY * Math.max(0, input.days_since_last_seen));
  const decayed = PRIOR + (prior - PRIOR) * decay;

  // Harder Qs move mastery more aggressively in either direction.
  const difficulty_boost = 0.5 + 0.5 * (input.question_difficulty / 5);
  const alpha = clamp(BASE_ALPHA * difficulty_boost * input.weight, 0, 1);
  const outcome = input.is_correct ? 1 : 0;

  return {
    mastery: clamp(decayed * (1 - alpha) + outcome * alpha, 0, 1),
    attempts: input.old_attempts + 1,
    correct: input.old_correct + (input.is_correct ? 1 : 0),
  };
}

/**
 * Aggregate per-concept mastery into a single exam-readiness number,
 * weighted by how many times we've actually tested each concept (we
 * trust mastery scores more when they're backed by more attempts).
 */
export function passReadiness(
  masteries: Array<{ mastery_score: number; attempts: number }>,
  passing_threshold = 0.7,
): { readiness: number; predicted_pass_pct: number; confidence: number } {
  if (masteries.length === 0) {
    return { readiness: 0, predicted_pass_pct: 0, confidence: 0 };
  }
  let weighted_sum = 0;
  let total_weight = 0;
  let total_attempts = 0;
  for (const m of masteries) {
    const w = Math.sqrt(Math.max(1, m.attempts));
    weighted_sum += m.mastery_score * w;
    total_weight += w;
    total_attempts += m.attempts;
  }
  const readiness = weighted_sum / total_weight;
  // Sigmoid centered at threshold. k controls how sharp the cutoff is.
  const k = 10;
  const predicted_pass_pct = 1 / (1 + Math.exp(-k * (readiness - passing_threshold)));
  // Need ~100 attempts before we're "confident" in the estimate.
  const confidence = Math.min(1, total_attempts / 100);
  return { readiness, predicted_pass_pct, confidence };
}

/**
 * Identify the N weakest concepts (lowest mastery, with at least min_attempts
 * data points). Used to drive practice question generation and study plan focus.
 */
export function weakestConcepts<T extends { mastery_score: number; attempts: number }>(
  masteries: T[],
  n: number,
  min_attempts = 0,
): T[] {
  return masteries
    .filter(m => m.attempts >= min_attempts)
    .sort((a, b) => a.mastery_score - b.mastery_score)
    .slice(0, n);
}
