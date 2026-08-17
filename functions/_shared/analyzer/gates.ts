// _shared/analyzer/gates.ts
//
// The two gates that run BEFORE any scoring, and the rule that decides which
// suppression reason is recorded when both fire at once.
//
// Density: under ~200 words of extracted content, suppress the coverage score
// entirely and report only positive identifications. A one-page bullet list is
// not evidence of a thin course -- it is evidence of a one-page bullet list.
//
// Framework: on mismatch, suppress coverage math and emit a structural
// comparison instead. SBOK has phases, core and non-core roles, and lists
// "Scrum Team" as a peer role. That is a different object model, not a coverage
// gap, and scoring it produces a number that means nothing.

import type {
  FrameworkDetection,
  FrameworkId,
  RunGates,
  SuppressionReason,
} from "./types.ts";

export const DEFAULT_DENSITY_THRESHOLD_WORDS = 200;

// --------------------------------------------------------------- signals
//
// Each signal is a phrase whose presence is evidence for a framework, with a
// weight. Weights are deliberately coarse: this is a classifier that must be
// explainable to a partner, not a fitted model. Every score can be traced to
// the exact strings that produced it.

interface Signal {
  probe: RegExp;
  weight: number;
  label: string;
}

const SIGNALS: Record<Exclude<FrameworkId, "hybrid" | "other" | "undetermined">, Signal[]> = {
  // Terms that exist ONLY in the 2020 edition.
  scrum_guide_2020: [
    { probe: /\bProduct Goal\b/i, weight: 3, label: "Product Goal" },
    { probe: /\bself-managing\b/i, weight: 3, label: "self-managing" },
    { probe: /\baccountabilit(y|ies)\b/i, weight: 2, label: "accountabilities" },
    { probe: /\bcommitments?\b/i, weight: 1, label: "commitments" },
    { probe: /\btrue leaders?\b/i, weight: 3, label: "true leaders" },
    { probe: /\bDevelopers\b/, weight: 2, label: "Developers" },
    { probe: /\btimeboxe?d?\b/i, weight: 1, label: "timebox (unhyphenated)" },
  ],

  // Terms that exist ONLY in the 2017 edition (or earlier).
  scrum_guide_2017: [
    { probe: /\bDevelopment Team\b/i, weight: 3, label: "Development Team" },
    { probe: /\bself-organi[sz]ing\b/i, weight: 3, label: "self-organizing" },
    { probe: /\bservant[- ]?leader\b/i, weight: 2, label: "servant-leader" },
    { probe: /\bpotentially releasable\b/i, weight: 3, label: "potentially releasable" },
    { probe: /\btime-box/i, weight: 1, label: "time-box (hyphenated)" },
    { probe: /\bSprint Planning meeting\b/i, weight: 1, label: "Sprint Planning meeting" },
  ],

  // SCRUMstudy SBOK. A DIFFERENT OBJECT MODEL, not a stale Scrum Guide.
  sbok: [
    { probe: /\bScrum Phases?\b/i, weight: 4, label: "Scrum Phases" },
    { probe: /\bNon[- ]?core Roles?\b/i, weight: 4, label: "Non-core Roles" },
    { probe: /\bCore Roles?\b/i, weight: 3, label: "Core Roles" },
    { probe: /\bScrum Aspects?\b/i, weight: 3, label: "Scrum Aspects" },
    { probe: /\bScrum Processes\b/i, weight: 3, label: "Scrum Processes" },
    { probe: /\bReview and Retrospect\b/i, weight: 4, label: "Review and Retrospect" },
    { probe: /\bPlan and Estimate\b/i, weight: 3, label: "Plan and Estimate" },
    { probe: /\bSBOK\b/i, weight: 5, label: "SBOK" },
  ],
};

export function detectFramework(text: string): FrameworkDetection {
  const scores: Record<string, number> = {};
  const evidence: string[] = [];

  for (const [framework, signals] of Object.entries(SIGNALS)) {
    let score = 0;
    for (const sig of signals) {
      if (sig.probe.test(text)) {
        score += sig.weight;
        evidence.push(`${framework}: ${sig.label}`);
      }
    }
    scores[framework] = score;
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topName, topScore] = ranked[0];
  const secondScore = ranked[1]?.[1] ?? 0;
  const total = ranked.reduce((sum, [, s]) => sum + s, 0);

  if (total === 0) {
    return { detected: "undetermined", confidence: 0, scores, evidence };
  }

  // SBOK is a separate object model, so it wins outright whenever its own
  // structural markers are present -- an SBOK course also says "Scrum Master"
  // and "Sprint", which would otherwise dilute it into a hybrid.
  if (scores.sbok >= 6) {
    return {
      detected: "sbok",
      confidence: Math.min(1, scores.sbok / 12),
      scores,
      evidence,
    };
  }

  // A document carrying strong signals from BOTH Scrum Guide editions is a
  // hybrid: partially updated material. This is a real and common state, and
  // calling it "2017" would understate how much of it is current.
  const g20 = scores.scrum_guide_2020;
  const g17 = scores.scrum_guide_2017;
  if (g20 >= 3 && g17 >= 3) {
    return {
      detected: "hybrid",
      confidence: Math.min(1, (g20 + g17) / 16),
      scores,
      evidence,
    };
  }

  const margin = total > 0 ? (topScore - secondScore) / total : 0;
  return {
    detected: topName as FrameworkId,
    confidence: Math.max(0, Math.min(1, margin)),
    scores,
    evidence,
  };
}

export interface GateInput {
  wordCount: number;
  text: string;
  /** What the reference blueprint is built on. Null skips the framework gate. */
  frameworkExpected: FrameworkId | null;
  densityThresholdWords?: number;
}

/**
 * SUPPRESSION PRECEDENCE.
 *
 * Both gates can fail on the same document -- the SCRUMstudy syllabus is ~60
 * words AND a framework mismatch. The schema stores one reason, so precedence
 * matters, and no information is lost either way because density_ok and
 * framework_match are their own columns.
 *
 * Framework mismatch wins WHEN IT IS CONFIDENT, because "this is a different
 * framework" tells a reader far more than "this document is short". But on a
 * thin document, framework detection is itself unreliable -- so a low-confidence
 * detection on a sub-threshold document reports density instead, rather than
 * asserting a classification the evidence does not support.
 */
const FRAMEWORK_CONFIDENCE_FLOOR = 0.4;

export function evaluateGates(input: GateInput): RunGates {
  const threshold = input.densityThresholdWords ?? DEFAULT_DENSITY_THRESHOLD_WORDS;
  const densityOk = input.wordCount >= threshold;

  const detection = detectFramework(input.text);

  let frameworkMatch: boolean | null = null;
  if (input.frameworkExpected !== null) {
    if (detection.detected === "undetermined") {
      frameworkMatch = null;
    } else if (detection.detected === input.frameworkExpected) {
      frameworkMatch = true;
    } else if (
      // A hybrid built on the expected edition is drift, not a mismatch. It is
      // exactly what the drift rules exist to describe, and suppressing its
      // coverage would throw away the most useful analysis available.
      detection.detected === "hybrid" &&
      (input.frameworkExpected === "scrum_guide_2020" ||
        input.frameworkExpected === "scrum_guide_2017")
    ) {
      frameworkMatch = true;
    } else if (
      // Same family, older edition. Also drift, not a different object model.
      detection.detected === "scrum_guide_2017" &&
      input.frameworkExpected === "scrum_guide_2020"
    ) {
      frameworkMatch = true;
    } else {
      frameworkMatch = false;
    }
  }

  const frameworkFailed =
    frameworkMatch === false && detection.confidence >= FRAMEWORK_CONFIDENCE_FLOOR;

  let suppressionReason: SuppressionReason | null = null;
  if (frameworkFailed) {
    suppressionReason = "framework_mismatch";
  } else if (!densityOk) {
    suppressionReason = "density";
  } else if (frameworkMatch === false) {
    // Mismatch detected but not confidently, on a document dense enough to
    // judge. Still a suppression -- an unreliable classification is not a
    // licence to score.
    suppressionReason = "framework_mismatch";
  }

  return {
    densityOk,
    densityThresholdWords: threshold,
    wordCount: input.wordCount,
    frameworkExpected: input.frameworkExpected,
    frameworkDetected: detection.detected,
    frameworkConfidence: detection.confidence,
    frameworkMatch,
    coverageSuppressed: suppressionReason !== null,
    suppressionReason,
  };
}
