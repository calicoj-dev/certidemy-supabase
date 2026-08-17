// _shared/analyzer/engine.ts
//
// Orchestrates the pipeline and returns data. No I/O, no DB, no network.
//
// Pipeline order, and what is built:
//   1. ingest        caller's job -- text arrives already fetched
//   2. normalize     BUILT
//   3. density       BUILT
//   4. framework     BUILT
//   5. segment       NOT BUILT (needs the source's own about/marketing copy)
//   6. concept match NOT BUILT (needs embeddings)
//   7. drift         BUILT
//   8. weights       BUILT
//   9. reverse gap   PARTIAL (weight-derived only; full version needs 6)
//
// COVERAGE IS NULL UNTIL STAGE 6 EXISTS. It is not estimated from drift counts
// or weight alignment. A coverage number that is not derived from concept
// matching would be a guess wearing a percentage sign, and the whole schema is
// built to make unfounded numbers unstorable.

import type {
  AnalysisResult,
  Blueprint,
  DriftRule,
  Finding,
  FrameworkId,
  Lang,
  RunGates,
} from "./types.ts";
import { ENGINE_VERSION } from "./types.ts";
import { normalize } from "./normalize.ts";
import { evaluateGates } from "./gates.ts";
import { detectDrift } from "./drift.ts";
import { compareWeights } from "./weights.ts";

export interface AnalyzeInput {
  rawText: string;
  sourceLang: Lang;
  blueprint: Blueprint;
  rules: DriftRule[];
  frameworkExpected?: FrameworkId | null;
  /** Rule languages to apply. See DriftInput.ruleLangs for the default. */
  ruleLangs?: Lang[];
  densityThresholdWords?: number;
}

export interface AnalyzeOutput extends AnalysisResult {
  normalized: { wordCount: number; charCount: number; transforms: string[] };
  rejectedRules: Array<{ ruleId: string; legacyTerm: string; reason: string }>;
}

export function analyze(input: AnalyzeInput): AnalyzeOutput {
  const src = normalize(input.rawText);

  const gates: RunGates = evaluateGates({
    wordCount: src.wordCount,
    text: src.text,
    frameworkExpected: input.frameworkExpected ?? null,
    densityThresholdWords: input.densityThresholdWords,
  });

  const findings: Finding[] = [];

  // Drift ALWAYS runs, including on a suppressed document.
  //
  // Suppression withholds the coverage SCORE, not the positive identifications.
  // A 60-word SBOK syllabus still gets its terminology findings reported -- what
  // it does not get is a percentage implying we measured its curriculum.
  const drift = detectDrift({
    text: src.text,
    lang: input.sourceLang,
    rules: input.rules,
    ruleLangs: input.ruleLangs,
  });
  findings.push(...drift.findings);

  // Weights run unless the framework is a different object model. Diffing SBOK
  // phase percentages against Scrum domain weights compares two things that do
  // not correspond, and the output would look like analysis.
  const structuralMismatch = gates.suppressionReason === "framework_mismatch";
  if (!structuralMismatch) {
    const weights = compareWeights(src.text, input.blueprint);
    findings.push(...weights.findings);
  } else {
    findings.push({
      findingType: "structural_note",
      label: `Structural comparison: source follows ${gates.frameworkDetected}`,
      severity: "high",
      visibility: "both",
      requiresHumanReview: true,
      note:
        `Coverage math and weight comparison are suppressed. The source uses a ` +
        `different object model, so a coverage percentage would not mean what a ` +
        `reader would take it to mean. Positive identifications are still reported.`,
    });
  }

  if (!gates.densityOk) {
    findings.push({
      findingType: "structural_note",
      label: `Thin source: ${src.wordCount} words below the ${gates.densityThresholdWords}-word floor`,
      severity: "medium",
      visibility: "both",
      requiresHumanReview: false,
      note:
        `Coverage is suppressed. A short document is evidence of a short ` +
        `document, not of a thin course -- the curriculum may simply not be ` +
        `published at this URL.`,
    });
  }

  // A rule that failed to load is a HOLE IN THE ANALYSIS, and silence about it
  // would make an incomplete report look complete.
  for (const r of drift.rejected) {
    findings.push({
      findingType: "structural_note",
      driftRuleId: r.ruleId,
      label: `Drift rule not loaded: ${r.legacyTerm}`,
      severity: "high",
      visibility: "internal",
      requiresHumanReview: true,
      note: `${r.reason}. This document was NOT checked against that rule.`,
    });
  }

  // CLEAN PASS. Required, and it must be reachable -- a detector that always
  // finds a problem is a detector nobody trusts.
  //
  // Definition: no drift findings, no high-severity divergence, both gates
  // passed, AND AT LEAST ONE RULE ACTUALLY RAN. Reverse gaps do NOT break a
  // clean pass: teaching more than we assess is a difference, not a defect.
  //
  // THE RULESET-SIZE CONDITION IS NOT DEFENSIVE PADDING.
  //
  // "No findings" and "no rules" are indistinguishable in the output and
  // opposite in meaning. On the AulaUtil fixture the engine applied zero rules
  // -- the document was es-419, every rule was en -- and reported drift=0 with
  // cleanPass=true on a competitor syllabus containing four legacy terms.
  //
  // An unchecked document must never be able to present as a clean one.
  const hasDrift = findings.some((f) => f.findingType === "drift");
  const hasHighDivergence = findings.some(
    (f) => f.findingType === "weight_divergence" && f.severity === "high",
  );

  if (drift.rulesetSize === 0) {
    findings.push({
      findingType: "structural_note",
      label: `No drift rules applied for language ${input.sourceLang}`,
      severity: "high",
      visibility: "internal",
      requiresHumanReview: true,
      note:
        `Zero rules matched languages [${drift.appliedLangs.join(", ")}]. This ` +
        `document was NOT checked for terminology drift. Absence of findings ` +
        `here means absence of checking, not absence of drift.`,
    });
  }

  const cleanPass =
    drift.rulesetSize > 0 &&
    !hasDrift &&
    !hasHighDivergence &&
    gates.densityOk &&
    gates.frameworkMatch !== false;

  return {
    engineVersion: ENGINE_VERSION,
    gates,
    coveragePct: null, // stage 6 not built -- see header
    cleanPass,
    findings,
    driftRulesetSize: drift.rulesetSize,
    normalized: {
      wordCount: src.wordCount,
      charCount: src.charCount,
      transforms: src.transforms,
    },
    rejectedRules: drift.rejected,
  };
}
