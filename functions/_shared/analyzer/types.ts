// _shared/analyzer/types.ts
//
// Types for the curriculum coverage analyzer engine.
//
// NOTHING IN THIS FOLDER MAY IMPORT Deno.*, fetch, or a Supabase client.
// These modules take data and return data. That is what makes the engine
// testable in milliseconds against local fixtures instead of via a deploy.

export const ENGINE_VERSION = "0.1.0";

export type Lang = "en" | "es-419" | "pt-BR";

// ---------------------------------------------------------------- blueprint

/**
 * What the engine is allowed to see about a certification.
 *
 * THE FIREWALL LIVES IN THE IMPLEMENTATION OF THIS INTERFACE, not here.
 * A reader may expose domains, tasks, concepts, task_concepts and lessons.
 * It may never expose quiz_questions. The engine cannot reach the item bank
 * because the shape it is handed has no room for it.
 *
 * `concepts` is OPTIONAL on purpose. Most external schemes will not have a
 * concept layer, and the engine must degrade to task-statement matching
 * rather than fail. Build the fallback from the first commit, not later.
 */
export interface Blueprint {
  referenceKind: "certidemy_certification" | "external_scheme";
  referenceId: string | null;
  lang: Lang;
  code: string;
  title: string;
  domains: BlueprintDomain[];
  tasks: BlueprintTask[];
  concepts?: BlueprintConcept[];
}

export interface BlueprintDomain {
  id: string;
  code: string;
  title: string;
  weightPct: number;
}

export interface BlueprintTask {
  id: string;
  domainId: string;
  code: string;
  statement: string;
  bloomLevel: string;
  isExamScope: boolean;
}

export interface BlueprintConcept {
  id: string;
  slug: string;
  /** The analytic JTA artifact. Stays analytic; not what a syllabus prints. */
  name: string;
  /**
   * Surface forms a real document would print. Optional and additive: the
   * matcher tries the name plus every term and takes the best band, so coverage
   * improves monotonically as terms are authored and nothing regresses when a
   * concept has none.
   */
  matchTerms?: string[];
  taskIds: string[];
  /** false when every task reaching this concept is scope_tag = extended. */
  inCoreScope?: boolean;
}

// ------------------------------------------------------------- drift rules

export type RuleClass = "superseded" | "non_canonical";
export type MatchMode = "phrase" | "regex";
export type Severity = "high" | "medium" | "low";

export interface DriftRule {
  id: string;
  ruleClass: RuleClass;
  lang: Lang;
  legacyTerm: string;
  currentTerm: string | null;
  matchMode: MatchMode;
  /** Stored in POSTGRES regex flavour. Translate before use. See regex.ts. */
  pattern: string | null;
  severity: Severity;
  authoritySourceId: string;
  authorityCitationId: string;
  rationale: string | null;
}

// ---------------------------------------------------------------- ingestion

export interface NormalizedSource {
  text: string;
  wordCount: number;
  charCount: number;
  /** Characters removed or folded during normalization, for diagnostics. */
  transforms: string[];
}

// -------------------------------------------------------------------- gates

export type SuppressionReason =
  | "density"
  | "framework_mismatch"
  /** The matcher cannot measure this source-language / blueprint-language pair. */
  | "language_unsupported";

export type FrameworkId =
  | "scrum_guide_2020"
  | "scrum_guide_2017"
  | "sbok"
  | "hybrid"
  | "other"
  | "undetermined";

export interface FrameworkDetection {
  detected: FrameworkId;
  /** 0..1. Low confidence on a thin document is expected, not an error. */
  confidence: number;
  scores: Record<string, number>;
  evidence: string[];
}

export interface RunGates {
  densityOk: boolean;
  densityThresholdWords: number;
  wordCount: number;
  frameworkExpected: FrameworkId | null;
  frameworkDetected: FrameworkId;
  frameworkConfidence: number;
  frameworkMatch: boolean | null;
  coverageSuppressed: boolean;
  suppressionReason: SuppressionReason | null;
}

// ----------------------------------------------------------------- findings

export type FindingType =
  | "concept_match"
  | "drift"
  | "weight_divergence"
  | "reverse_gap"
  | "structural_note";

export type ConfidenceBand = "strong" | "probable" | "ambiguous" | "absent";
export type Visibility = "internal" | "partner" | "both";

export interface Finding {
  findingType: FindingType;
  conceptId?: string | null;
  taskId?: string | null;
  domainId?: string | null;
  driftRuleId?: string | null;
  label?: string | null;
  confidence?: number | null;
  confidenceBand?: ConfidenceBand | null;
  evidenceExcerpt?: string | null;
  evidenceLocator?: string | null;
  sourceWeightPct?: number | null;
  blueprintWeightPct?: number | null;
  severity?: Severity | null;
  visibility: Visibility;
  requiresHumanReview: boolean;
  /**
   * Engine-only. Not a column. Explains why the finding was shaped this way
   * so a reviewer does not have to re-derive it.
   */
  note?: string;
}

// ------------------------------------------------------------------ results

export interface AnalysisResult {
  engineVersion: string;
  gates: RunGates;
  coveragePct: number | null;
  cleanPass: boolean;
  findings: Finding[];
  driftRulesetSize: number;
}
