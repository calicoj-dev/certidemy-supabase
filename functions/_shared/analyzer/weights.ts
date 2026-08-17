// _shared/analyzer/weights.ts
//
// When a source publishes percentages, diff them against the blueprint.
// Near-free and high-signal: this is where TUV SUD allocating 1 percent to the
// Scrum Master role against our D5 at 22.5 percent lands.
//
// TWO SEPARATE JOBS, KEPT SEPARATE ON PURPOSE
//
//   1. EXTRACTION  - find "<label> ... <n>%" pairs in the text. Mechanical.
//   2. ALIGNMENT   - decide which of their labels corresponds to which of our
//                    domains. NOT mechanical.
//
// Alignment is really a semantic matching problem and belongs to the concept
// stage. Until that exists, this module aligns on normalized token overlap and
// REFUSES to guess below a threshold. An unaligned source topic is reported as
// a reverse_gap candidate rather than silently dropped or forced onto the
// nearest domain -- a wrong alignment produces a divergence number that looks
// authoritative and is fiction.

import type { Blueprint, Finding } from "./types.ts";

export interface SourceWeight {
  label: string;
  pct: number;
  /** Character offset of the match, for evidence. */
  index: number;
}

/**
 * Words carrying no discriminating power when matching a source topic label
 * against a domain title. Kept small and per-language; an aggressive stoplist
 * makes unrelated labels look similar.
 */
const STOP = new Set([
  "the", "and", "of", "for", "to", "in", "a", "an", "with",
  "scrum", "agile", // present in nearly every label in this domain
  "de", "del", "la", "el", "los", "las", "y", "con", "para", "en",
  "do", "da", "dos", "das", "e", "com", "para", "em", "o", "os", "as",
]);

function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((t) => t.length > 2 && !STOP.has(t)),
  );
}

function overlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let hits = 0;
  for (const t of a) if (b.has(t)) hits++;
  // Asymmetric on purpose: a short source label fully contained in a longer
  // domain title is a strong match, and Jaccard would punish it for brevity.
  return hits / Math.min(a.size, b.size);
}

const ALIGNMENT_FLOOR = 0.5;

/**
 * Extract "<label> ... <n>%" pairs.
 *
 * Handles the two shapes seen in the calibration corpus:
 *   "2. Scrum Master role - 27.5%"   (BCS EXIN, label before)
 *   "SCRUM FUNDAMENTALS   18"        (TUV, tabular; needs the % variant)
 *
 * Deliberately conservative: a percentage with no plausible label within
 * ~80 characters is ignored rather than attached to whatever preceded it.
 */
export function extractWeights(text: string): SourceWeight[] {
  const out: SourceWeight[] = [];
  const re = /([^\n]{3,80}?)[\s.:\-]*(\d{1,3}(?:[.,]\d{1,2})?)\s*%/gu;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    const rawLabel = m[1].replace(/^[\s\d.)\-]+/, "").trim();
    const pct = parseFloat(m[2].replace(",", "."));
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) continue;
    if (tokens(rawLabel).size === 0) continue;
    out.push({ label: rawLabel, pct, index: m.index });
  }

  // Same label appearing twice (a contents page plus the body) is one weight.
  const seen = new Map<string, SourceWeight>();
  for (const w of out) {
    const key = w.label.toLowerCase();
    if (!seen.has(key)) seen.set(key, w);
  }
  return [...seen.values()];
}

export interface WeightOutput {
  findings: Finding[];
  /** Sums to roughly 100 when the source publishes a complete distribution. */
  sourceTotalPct: number;
  aligned: number;
  unaligned: number;
}

export function compareWeights(
  text: string,
  blueprint: Blueprint,
  extracted?: SourceWeight[],
): WeightOutput {
  const weights = extracted ?? extractWeights(text);
  const findings: Finding[] = [];

  // A SOURCE THAT PUBLISHES NO WEIGHTS IS NOT A SOURCE THAT DIVERGES ON EVERY
  // DOMAIN.
  //
  // Emitting a "not weighted" divergence per domain here would make a perfectly
  // current syllabus that simply does not publish percentages fail its clean
  // pass on five high-severity findings. Most course pages do not publish
  // weights. One structural note, and nothing else.
  if (weights.length === 0) {
    findings.push({
      findingType: "structural_note",
      label: "Source publishes no topic weighting",
      severity: "low",
      visibility: "both",
      requiresHumanReview: false,
      note:
        "No percentage allocations were found, so no weight comparison is " +
        "possible. This is the normal state for a course page and is not a " +
        "finding against the source.",
    });
    return { findings, sourceTotalPct: 0, aligned: 0, unaligned: 0 };
  }

  const domainTokens = blueprint.domains.map((d) => ({
    domain: d,
    toks: tokens(d.title),
  }));

  const usedDomains = new Set<string>();
  let aligned = 0;
  let unaligned = 0;

  for (const w of weights) {
    const wt = tokens(w.label);
    let best: { id: string; code: string; title: string; weightPct: number } | null = null;
    let bestScore = 0;

    for (const { domain, toks } of domainTokens) {
      const score = overlap(wt, toks);
      if (score > bestScore) {
        bestScore = score;
        best = domain;
      }
    }

    if (!best || bestScore < ALIGNMENT_FLOOR) {
      unaligned++;
      findings.push({
        findingType: "reverse_gap",
        label: `${w.label} (${w.pct}% of their course)`,
        sourceWeightPct: w.pct,
        evidenceLocator: `char ${w.index}`,
        severity: "low",
        visibility: "both",
        requiresHumanReview: true,
        note:
          `Weighted topic with no confident match to a blueprint domain ` +
          `(best overlap ${bestScore.toFixed(2)}, floor ${ALIGNMENT_FLOOR}). ` +
          `Reported as a reverse-gap candidate rather than forced onto the ` +
          `nearest domain, because a wrong alignment produces a divergence ` +
          `number that looks authoritative and is fiction.`,
      });
      continue;
    }

    aligned++;
    usedDomains.add(best.id);
    const divergence = w.pct - best.weightPct;
    const magnitude = Math.abs(divergence);

    findings.push({
      findingType: "weight_divergence",
      domainId: best.id,
      label: `${w.label} -> ${best.code} ${best.title}`,
      sourceWeightPct: w.pct,
      blueprintWeightPct: best.weightPct,
      evidenceLocator: `char ${w.index}`,
      confidence: bestScore,
      severity: magnitude >= 15 ? "high" : magnitude >= 7 ? "medium" : "low",
      visibility: "both",
      // Alignment was inferred, not declared. Anything below a strong overlap
      // is worth a human glance before it reaches a prospect.
      requiresHumanReview: bestScore < 0.75,
      note:
        `Source allocates ${w.pct}%, blueprint allocates ${best.weightPct}% ` +
        `(divergence ${divergence > 0 ? "+" : ""}${divergence.toFixed(1)}).`,
    });
  }

  // Domains the source never weighted at all.
  for (const d of blueprint.domains) {
    if (usedDomains.has(d.id)) continue;
    findings.push({
      findingType: "weight_divergence",
      domainId: d.id,
      label: `${d.code} ${d.title} -- not weighted by the source`,
      sourceWeightPct: 0,
      blueprintWeightPct: d.weightPct,
      severity: d.weightPct >= 20 ? "high" : d.weightPct >= 10 ? "medium" : "low",
      visibility: "both",
      requiresHumanReview: false,
      note:
        `No weighted topic in the source aligned to this domain. Absence of a ` +
        `published weight is not proof the topic is untaught -- it is proof it ` +
        `is unweighted.`,
    });
  }

  const sourceTotalPct = weights.reduce((s, w) => s + w.pct, 0);
  return { findings, sourceTotalPct, aligned, unaligned };
}
