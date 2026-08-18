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
 * Extract a published weighting distribution.
 *
 * ================= WHY THIS IS FUSSY ABOUT WHAT IT ACCEPTS =================
 *
 * The first version grabbed up to 80 characters before any "N%" anywhere in the
 * document. Against a 78-page manual that produced "reverse gaps" like:
 *
 *   "n with an assistant and a driver when the technology cannot prevent
 *    human errors (100% of their course)"
 *   "grooming should never consume more than (10% of their course)"
 *
 * Neither is a course topic. The first is a sliced-up sentence about
 * automation; the second is a rule about refinement time-boxing. Both were then
 * shown to the reader under "Beyond our scope - their differentiation", which
 * is the section whose whole job is to be generous and credible.
 *
 * A mangled fragment of a partner's own prose destroys trust faster than a
 * wrong number does. So the rule is now: a weight must LOOK LIKE A TABLE ROW,
 * not merely sit near a percent sign.
 *
 * Four requirements, all cheap:
 *   1. The label starts at a line boundary or a list marker. A weighting table
 *      is a list; a sentence is not.
 *   2. The label is short (<= 60 chars) and few words (<= 8). Topic labels are
 *      terse; prose is not.
 *   3. The label does not read as a sentence fragment - no leading lowercase
 *      verb-ish word, no trailing conjunction, no sentence punctuation inside.
 *   4. The extracted set must plausibly BE a distribution: at least three
 *      entries summing to somewhere near 100. One stray percentage in an essay
 *      is not a weighting scheme.
 *
 * When requirement 4 fails, NOTHING is returned. Half a distribution is worse
 * than none: it invites a comparison against a denominator that does not exist.
 */

/** Words that mark prose rather than a topic label. */
const PROSE_MARKERS =
  /\b(should|must|never|always|cannot|can|will|would|may|if|when|because|than|that|which|these|those|about|more|less|up to|at least)\b/i;

/**
 * A weighting row: optional numbering, a short label, a percentage, end of line.
 *
 * Trailing dot leaders and a doubled percent sign are both real -- BCS EXIN's
 * contents page extracts as "... 32.5%% .........." -- so both are tolerated.
 * Group 1 is the numbering (for depth), group 2 the label, group 3 the value.
 */
const ROW =
  /^[\s\-*\u2022]*(\d+(?:\.\d+)*)?[.)]?\s*(.{3,60}?)[\s.:\-\u2013\u2014|]*\(?(\d{1,3}(?:[.,]\d{1,2})?)\s*%+\)?[\s.]*$/;

/**
 * A column header proving the document DOES publish weights, even when the rows
 * cannot be read.
 *
 * TUV SUD's table puts each number on its own line with no percent sign -- the
 * sign is in the header -- so the rows are unreadable without column geometry.
 * Saying "publishes no topic weighting" about that document would be FALSE, and
 * a confident false statement is worse than the garbage it replaced.
 */
const WEIGHT_HEADER = /%\s*of\s*(all|course|total|topic)/i;

export function hasUnparsedWeightTable(text: string): boolean {
  return WEIGHT_HEADER.test(text);
}

function looksLikeLabel(raw: string): boolean {
  const label = raw.trim();
  if (label.length < 3 || label.length > 60) return false;

  const words = label.split(/\s+/);
  if (words.length > 8) return false;

  // Sentence punctuation inside a label means it is prose.
  if (/[.;!?]/.test(label.slice(0, -1))) return false;

  if (PROSE_MARKERS.test(label)) return false;

  // A label carries at least one substantive word.
  if (tokens(label).size === 0) return false;

  // Fragments sliced mid-word: a one or two letter opener with no capital.
  if (/^[a-z]{1,2}\s/.test(label)) return false;

  return true;
}

/** At least this many entries before a set counts as a distribution. */
const MIN_ENTRIES = 3;

/** How far the total may sit from 100 and still be a distribution. */
const SUM_TOLERANCE = 20;

export function extractWeights(text: string): SourceWeight[] {
  const rows: Array<SourceWeight & { depth: number }> = [];
  let offset = 0;

  for (const line of text.split("\n")) {
    const m = ROW.exec(line);
    if (m && m[2] && m[3]) {
      const pct = parseFloat(m[3].replace(",", "."));
      if (Number.isFinite(pct) && pct > 0 && pct <= 100 && looksLikeLabel(m[2])) {
        // "2." is depth 1, "2.3" depth 2. Unnumbered rows are depth 0.
        const depth = m[1] ? m[1].split(".").filter(Boolean).length : 0;
        rows.push({ label: m[2].trim(), pct, index: offset, depth });
      }
    }
    offset += line.length + 1;
  }

  // A label repeated (contents page plus body) is one weight.
  const seen = new Map<string, SourceWeight & { depth: number }>();
  for (const w of rows) {
    const key = w.label.toLowerCase();
    if (!seen.has(key)) seen.set(key, w);
  }
  const unique = [...seen.values()];
  if (unique.length === 0) return [];

  // ============== PICK ONE LEVEL OF THE HIERARCHY ==============
  //
  // A syllabus usually publishes topics AND sub-topics, each summing to 100.
  // Taking both doubles the total and double-counts every topic. BCS EXIN is
  // exactly this: five topics summing to 100, plus fourteen sub-topics also
  // summing to 100. The first version of this check saw ~200 and concluded the
  // document had no distribution at all.
  //
  // So try each depth shallowest-first and take the first that plausibly sums
  // to 100. That is the level the source considers its top-level allocation.
  const depths = [...new Set(unique.map((w) => w.depth))].sort((a, b) => a - b);

  for (const d of depths) {
    const level = unique.filter((w) => w.depth === d);
    if (level.length < MIN_ENTRIES) continue;
    const sum = level.reduce((n, w) => n + w.pct, 0);
    if (Math.abs(sum - 100) <= SUM_TOLERANCE) {
      return level.map(({ label, pct, index }) => ({ label, pct, index }));
    }
  }

  // No level looked like a distribution. Half of one is worse than none: it
  // invites comparison against a denominator that does not exist.
  return [];
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
    const unreadable = hasUnparsedWeightTable(text);
    findings.push({
      findingType: "structural_note",
      label: unreadable
        ? "Source publishes a weighting table that could not be read"
        : "Source publishes no topic weighting",
      // A structural note describes the DOCUMENT rather than quoting it, so it
      // has no excerpt. The locator records what was looked for, which keeps
      // migration 219's external-evidence CHECK satisfied honestly rather than
      // by exempting a whole finding type from it.
      evidenceLocator: unreadable
        ? "a percentage column header was found, but no readable rows; the values are likely in table columns rather than inline"
        : "scanned for percentage allocations; none found",
      severity: "low",
      visibility: "both",
      requiresHumanReview: false,
      note: unreadable
        ? "The source DOES publish weights; this extractor could not parse them. " +
          "Not a finding against the source -- a limitation on our side."
        : "No percentage allocations were found, so no weight comparison is " +
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
  //
  // EVIDENCE FOR AN ABSENCE, same rule as an absent concept match. Migration
  // 219's analysis_findings_external_needs_evidence CHECK requires an excerpt
  // or a locator on anything partner-visible, and a domain nobody weighted has
  // nothing to quote. Naming the weights that WERE found makes the absence
  // checkable rather than merely asserted: a reader can see what the source
  // published and confirm this domain is not among it.
  const foundLabels = weights.map((w) => w.label);
  const surveyed =
    foundLabels.length === 0
      ? "no weighted topics found in source"
      : `no weighted topic matched; source weights ${foundLabels.length} topic(s): ` +
        foundLabels.slice(0, 6).join("; ");
  const absenceLocator =
    surveyed.length <= 240 ? surveyed : `${surveyed.slice(0, 237).trimEnd()}...`;

  for (const d of blueprint.domains) {
    if (usedDomains.has(d.id)) continue;
    findings.push({
      findingType: "weight_divergence",
      domainId: d.id,
      label: `${d.code} ${d.title} -- not weighted by the source`,
      sourceWeightPct: 0,
      blueprintWeightPct: d.weightPct,
      evidenceLocator: absenceLocator,
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
