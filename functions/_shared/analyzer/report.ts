// _shared/analyzer/report.ts
//
// THE DELIVERABLE. Turns an analysis into a readiness report and build plan.
//
// ===================== WHAT THIS IS AND IS NOT =====================
//
// It is NOT a coverage score. A single percentage answers "how much of us do
// they cover", which is not a question a training provider has.
//
// It answers: **what must they add to teach a course that prepares candidates
// for our exam.** Every gap is a work item with lesson references, because the
// commercial frame is "you are N pieces of work away from delivering this", and
// the material to close each gap is exactly what a partner agreement licenses.
//
// ===================== WHY THE DENOMINATOR IS EVERYTHING =====================
//
// "You are 19% ready" reads as an insult and invites an argument about the
// number. The same measurement stated as
//
//   "Our scheme assesses 107 concepts across 53 tasks. Your syllabus addresses
//    20 of them. Here are the other 87 and the lessons that teach each one."
//
// reads as a plan, and it is more honest, because it NAMES the denominator
// rather than hiding it inside a percentage.
//
// A low readiness figure against a rigorous scheme is CORRECT INFORMATION, not
// a number to be tuned until it flatters anyone. There is deliberately no
// filtering of "concepts a syllabus would not list" -- those concepts are on
// the exam, so a candidate who has not met them is less prepared, and deciding
// on a partner's behalf which of our concepts are worth teaching is an
// authority that belongs to them.
//
// ===================== EXTENDED SCOPE IS THE PITCH =====================
//
// Concepts reachable only from extended (AI) tasks are reported SEPARATELY and
// never folded into the shortfall. No course in the base discipline teaches
// them, so listing them among a partner's failings would be both unfair and
// backwards. They are the reason to partner, not evidence against the partner.

import type {
  AnalysisResult,
  Blueprint,
  BlueprintLesson,
  ConfidenceBand,
  Finding,
} from "./types.ts";

export type TaskStatus = "addressed" | "partial" | "absent";

export interface ConceptLine {
  conceptId: string;
  name: string;
  band: ConfidenceBand;
  addressed: boolean;
  evidence: string | null;
  /** Where to learn it. Empty is itself a finding -- see the note below. */
  lessons: Array<{ slug: string; title: string }>;
}

export interface TaskLine {
  taskId: string;
  code: string;
  statement: string;
  domainCode: string;
  bloomLevel: string;
  isExamScope: boolean;
  scopeIsExtended: boolean;
  status: TaskStatus;
  conceptsTotal: number;
  conceptsAddressed: number;
  concepts: ConceptLine[];
}

export interface DomainLine {
  code: string;
  title: string;
  weightPct: number;
  tasksTotal: number;
  tasksAddressed: number;
  conceptsTotal: number;
  conceptsAddressed: number;
}

export interface ReadinessReport {
  certificationCode: string;
  certificationTitle: string;
  engineVersion: string;
  measurable: boolean;
  notMeasurableReason: string | null;

  summary: {
    conceptsTotal: number;
    conceptsAddressed: number;
    conceptsToAdd: number;
    extendedConcepts: number;
    tasksTotal: number;
    tasksAddressed: number;
    tasksPartial: number;
    tasksAbsent: number;
    /** Domain-weighted share of tasks fully or partly addressed. */
    readinessPct: number;
  };

  domains: DomainLine[];
  tasks: TaskLine[];

  /** What they teach that we do not assess. Their differentiation, not an error. */
  beyondScope: Array<{ label: string; sourceWeightPct: number | null }>;

  /** Terminology and structural findings, carried through verbatim. */
  integrity: Finding[];
}

const ADDRESSED: ConfidenceBand[] = ["strong", "probable"];

export function buildReadinessReport(
  analysis: AnalysisResult,
  blueprint: Blueprint,
): ReadinessReport {
  const concepts = blueprint.concepts ?? [];
  const lessons = blueprint.lessons ?? [];

  const lessonsByConcept = new Map<string, BlueprintLesson[]>();
  for (const l of lessons) {
    for (const cid of l.conceptIds) {
      const arr = lessonsByConcept.get(cid) ?? [];
      arr.push(l);
      lessonsByConcept.set(cid, arr);
    }
  }

  // Concept match findings, keyed for lookup. Absent when coverage was
  // suppressed -- in which case the report says so rather than reporting a
  // shortfall it never measured.
  const matchByConcept = new Map<string, { band: ConfidenceBand; evidence: string | null }>();
  for (const f of analysis.findings) {
    if (f.findingType !== "concept_match" || !f.conceptId) continue;
    matchByConcept.set(f.conceptId, {
      band: (f.confidenceBand ?? "absent") as ConfidenceBand,
      evidence: f.evidenceExcerpt ?? null,
    });
  }

  const measurable = !analysis.gates.coverageSuppressed;
  const conceptById = new Map(concepts.map((c) => [c.id, c]));
  const domainByTask = new Map(blueprint.tasks.map((t) => [t.id, t.domainId]));
  const domainById = new Map(blueprint.domains.map((d) => [d.id, d]));

  // concept -> tasks, inverted from task -> concepts
  const conceptsByTask = new Map<string, string[]>();
  for (const c of concepts) {
    for (const tid of c.taskIds) {
      const arr = conceptsByTask.get(tid) ?? [];
      arr.push(c.id);
      conceptsByTask.set(tid, arr);
    }
  }

  const tasks: TaskLine[] = blueprint.tasks.map((t) => {
    const cids = conceptsByTask.get(t.id) ?? [];
    const lines: ConceptLine[] = cids.map((cid) => {
      const c = conceptById.get(cid);
      const m = matchByConcept.get(cid);
      const band = (m?.band ?? "absent") as ConfidenceBand;
      return {
        conceptId: cid,
        name: c?.name ?? cid,
        band,
        addressed: measurable && ADDRESSED.includes(band),
        evidence: m?.evidence ?? null,
        lessons: (lessonsByConcept.get(cid) ?? []).map((l) => ({ slug: l.slug, title: l.title })),
      };
    });

    const addressed = lines.filter((l) => l.addressed).length;
    const status: TaskStatus =
      lines.length === 0 ? "absent" : addressed === lines.length ? "addressed" : addressed > 0 ? "partial" : "absent";

    const dId = domainByTask.get(t.id);
    return {
      taskId: t.id,
      code: t.code,
      statement: t.statement,
      domainCode: dId ? (domainById.get(dId)?.code ?? "?") : "?",
      bloomLevel: t.bloomLevel,
      isExamScope: t.isExamScope,
      // A task is extended when every concept beneath it is out of core scope.
      scopeIsExtended:
        cids.length > 0 && cids.every((cid) => conceptById.get(cid)?.inCoreScope === false),
      status,
      conceptsTotal: lines.length,
      conceptsAddressed: addressed,
      concepts: lines,
    };
  });

  const domains: DomainLine[] = blueprint.domains.map((d) => {
    const dt = tasks.filter((t) => t.domainCode === d.code);
    return {
      code: d.code,
      title: d.title,
      weightPct: d.weightPct,
      tasksTotal: dt.length,
      tasksAddressed: dt.filter((t) => t.status !== "absent").length,
      conceptsTotal: dt.reduce((s, t) => s + t.conceptsTotal, 0),
      conceptsAddressed: dt.reduce((s, t) => s + t.conceptsAddressed, 0),
    };
  });

  // Readiness is DOMAIN-WEIGHTED, mirroring how the blueprint weights the exam.
  // A domain carrying 25% of the exam contributes 25% of readiness, so a course
  // strong in a light domain does not look better prepared than it is.
  const readinessPct =
    domains.reduce(
      (sum, d) => sum + (d.tasksTotal === 0 ? 0 : (d.weightPct * d.tasksAddressed) / d.tasksTotal),
      0,
    ) || 0;

  const addressedConcepts = new Set<string>();
  for (const t of tasks) for (const c of t.concepts) if (c.addressed) addressedConcepts.add(c.conceptId);

  const extended = concepts.filter((c) => c.inCoreScope === false).length;

  const beyondScope = analysis.findings
    .filter((f) => f.findingType === "reverse_gap")
    .map((f) => ({ label: f.label ?? "", sourceWeightPct: f.sourceWeightPct ?? null }));

  const integrity = analysis.findings.filter(
    (f) => f.findingType === "drift" || f.findingType === "structural_note",
  );

  return {
    certificationCode: blueprint.code,
    certificationTitle: blueprint.title,
    engineVersion: analysis.engineVersion,
    measurable,
    notMeasurableReason: measurable ? null : (analysis.gates.suppressionReason ?? "unknown"),
    summary: {
      conceptsTotal: concepts.length,
      conceptsAddressed: addressedConcepts.size,
      conceptsToAdd: concepts.length - addressedConcepts.size,
      extendedConcepts: extended,
      tasksTotal: tasks.length,
      tasksAddressed: tasks.filter((t) => t.status === "addressed").length,
      tasksPartial: tasks.filter((t) => t.status === "partial").length,
      tasksAbsent: tasks.filter((t) => t.status === "absent").length,
      readinessPct: Math.round(readinessPct * 10) / 10,
    },
    domains,
    tasks,
    beyondScope,
    integrity,
  };
}

/**
 * The build plan: only what is missing, ordered by the weight of the domain it
 * sits in, so the heaviest exam territory is closed first.
 *
 * A gap with NO lessons is flagged rather than dropped. It means a concept the
 * exam assesses that our own curriculum does not teach -- a finding about US,
 * surfaced here because this is the report that would otherwise promise a
 * partner material that does not exist.
 */
export interface BuildPlanItem {
  taskCode: string;
  taskStatement: string;
  domainCode: string;
  domainWeightPct: number;
  isExtended: boolean;
  missingConcepts: Array<{
    name: string;
    lessons: Array<{ slug: string; title: string }>;
    noMaterial: boolean;
  }>;
}

export function buildPlan(report: ReadinessReport): BuildPlanItem[] {
  const weight = new Map(report.domains.map((d) => [d.code, d.weightPct]));

  return report.tasks
    .filter((t) => t.status !== "addressed")
    .map((t) => ({
      taskCode: t.code,
      taskStatement: t.statement,
      domainCode: t.domainCode,
      domainWeightPct: weight.get(t.domainCode) ?? 0,
      isExtended: t.scopeIsExtended,
      missingConcepts: t.concepts
        .filter((c) => !c.addressed)
        .map((c) => ({ name: c.name, lessons: c.lessons, noMaterial: c.lessons.length === 0 })),
    }))
    .filter((i) => i.missingConcepts.length > 0)
    .sort(
      (a, b) =>
        b.domainWeightPct - a.domainWeightPct ||
        b.missingConcepts.length - a.missingConcepts.length ||
        a.taskCode.localeCompare(b.taskCode),
    );
}
