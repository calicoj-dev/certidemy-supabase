// _shared/analyzer/concepts.ts
//
// Stage 5: match a source document against the blueprint's concepts, and derive
// the coverage number from the result.
//
// ==================== WHY THIS IS LEXICAL, NOT EMBEDDINGS ====================
//
// The pipeline spec calls for embeddings here, and it will get them. This is a
// deliberate first implementation, for three reasons:
//
//   1. It is DETERMINISTIC. The calibration corpus can assert an exact coverage
//      number per fixture. An embedding matcher cannot be asserted that way
//      until it has a baseline to be compared against -- and this is that
//      baseline.
//   2. It costs nothing and needs no vendor call, so it runs in the harness in
//      milliseconds and in CI without a key.
//   3. It establishes the SHAPE -- bands, coverage formula, the ambiguous band
//      that requires human review. Swapping the matcher later changes how a
//      band is assigned and nothing else.
//
// The seam: `matchConcepts` takes a ConceptMatcher. LexicalMatcher is one
// implementation. An embedding matcher is another, and the coverage formula,
// the bands and the findings are unchanged by the swap.
//
// ========================= WHAT COVERAGE MEANS HERE =========================
//
// Domain-weighted, exactly mirroring how the blueprint weights the exam:
//
//     coverage = SUM over domains ( weight_pct * matched_fraction_of_domain )
//
// A concept is credited only at `strong` or `probable`. `ambiguous` is reported
// and flagged for review but NOT counted -- crediting an uncertain match would
// inflate a competitor's coverage, which is the direction of error that makes a
// sales tool worthless. Under-crediting is visible and arguable; over-crediting
// is invisible and wrong.

import type {
  Blueprint,
  BlueprintConcept,
  ConfidenceBand,
  Finding,
  Lang,
} from "./types.ts";

/** Words too common to discriminate. Per language, kept deliberately small. */
const STOP: Record<string, Set<string>> = {
  en: new Set(["the", "and", "of", "for", "to", "in", "a", "an", "with", "on", "by", "as", "is"]),
  "es-419": new Set(["el", "la", "los", "las", "de", "del", "y", "en", "con", "para", "un", "una"]),
  "pt-BR": new Set(["o", "a", "os", "as", "de", "do", "da", "e", "em", "com", "para", "um", "uma"]),
};

function tokenize(s: string, lang: Lang): string[] {
  const stop = STOP[lang] ?? STOP.en;
  return s
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 2 && !stop.has(t));
}

/** Cheap suffix folding so "commitments" matches "commitment". */
function stem(t: string): string {
  return t.replace(/(ings|ing|ies|es|s)$/u, "");
}

export interface ConceptMatch {
  concept: BlueprintConcept;
  band: ConfidenceBand;
  confidence: number;
  evidence: string | null;
  evidenceIndex: number | null;
}

export interface ConceptMatcher {
  readonly name: string;
  /**
   * Can this matcher measure a source in `sourceLang` against a blueprint whose
   * concept names are in `blueprintLang`?
   *
   * The lexical matcher cannot cross languages: `concepts` has no lang column
   * and no i18n table, so concept names exist only in English. Running it on a
   * Spanish syllabus produced 8.9% against a hand score of 35% -- a number made
   * almost entirely of language, not curriculum.
   *
   * A matcher that cannot measure must say so, and the engine must suppress.
   * A wrong number is worse than a refused one.
   */
  supports(sourceLang: Lang, blueprintLang: Lang): boolean;
  match(text: string, concepts: BlueprintConcept[], lang: Lang): ConceptMatch[];
}

const EXCERPT_MAX = 300;

function excerpt(text: string, index: number, len: number): string {
  const pad = Math.max(0, Math.floor((EXCERPT_MAX - len) / 2));
  let start = Math.max(0, index - pad);
  let end = Math.min(text.length, index + len + pad);
  while (start > 0 && /\S/.test(text[start - 1])) start--;
  while (end < text.length && /\S/.test(text[end])) end++;
  let out = text.slice(start, end).replace(/\s+/g, " ").trim();
  if (out.length > EXCERPT_MAX) out = out.slice(0, EXCERPT_MAX - 1).trimEnd();
  return out;
}

/**
 * Bands, and what each one asserts:
 *
 *   strong    the concept's full name appears as a phrase. Near-certain.
 *   probable  the concept's INFORMATIVE tokens all appear within one window.
 *             Word order or a connecting word differs; the idea is present.
 *   ambiguous informative tokens present but scattered across the document.
 *             Needs a human. Expected to be a MINORITY.
 *   absent    a distinguishing token is missing.
 *
 * ==================== WHY TOKENS ARE WEIGHTED BY RARITY ====================
 *
 * The first implementation counted a plain fraction of tokens present, and the
 * ambiguous band ate the corpus: 50-68% of all concepts, on every document.
 *
 * The cause is that concept names share vocabulary. `sprint`, `scrum`,
 * `product`, `team`, `goal` appear across dozens of names, and in any Scrum
 * syllabus those words are everywhere. So "Sprint Goal commitment" scored 2 of 3
 * on `sprint` + `goal` while `commitment` -- the only token that distinguishes
 * it from a dozen sibling concepts -- was absent.
 *
 * It was measuring "does this document use Scrum words", not "does it teach
 * this concept".
 *
 * The fix is inverse document frequency over the CONCEPT VOCABULARY ITSELF: a
 * token in many concept names carries almost no information, a token in one
 * carries nearly all of it. A concept is credited only when the tokens that
 * distinguish it are present, so missing `commitment` now yields `absent`
 * rather than a shrug.
 */
export class LexicalMatcher implements ConceptMatcher {
  readonly name = "lexical-v2-idf";

  /** Window for `probable`. Roughly a long sentence plus its neighbour. */
  static readonly WINDOW = 240;

  /** Share of a concept's information content that must be present. */
  static readonly PRESENCE_FLOOR = 0.85;

  supports(sourceLang: Lang, blueprintLang: Lang): boolean {
    return sourceLang === blueprintLang;
  }

  match(text: string, concepts: BlueprintConcept[], lang: Lang): ConceptMatch[] {
    const lower = text.toLowerCase();

    // Token positions in the document.
    const docTokens = new Map<string, number[]>();
    {
      const re = /[\p{L}\p{N}]+/gu;
      let m: RegExpExecArray | null;
      while ((m = re.exec(lower)) !== null) {
        const s = stem(m[0]);
        const arr = docTokens.get(s) ?? [];
        arr.push(m.index);
        docTokens.set(s, arr);
      }
    }

    // Inverse document frequency across concept names.
    const conceptTokens = concepts.map((c) => [...new Set(tokenize(c.name, lang).map(stem))]);
    const df = new Map<string, number>();
    for (const toks of conceptTokens) {
      for (const t of toks) df.set(t, (df.get(t) ?? 0) + 1);
    }
    const N = Math.max(1, concepts.length);
    const idf = (t: string) => Math.log(N / (df.get(t) ?? 1)) + 1;

    const RANK: Record<string, number> = { strong: 3, probable: 2, ambiguous: 1, absent: 0 };

    return concepts.map((concept, ci) => {
      // Try the analytic name AND every authored surface form, keep the best.
      //
      // The name is a JTA artifact -- "Scrum Master serves the Product Owner" --
      // while a syllabus prints "Responsibilities of the Scrum Master with the
      // Product Owner". Matching only the name measured OUR vocabulary rather
      // than THEIR curriculum: worth about 28 points of the TUV SUD gap.
      const surfaces = [concept.name, ...(concept.matchTerms ?? [])];
      let best: ConceptMatch | null = null;
      for (const surface of surfaces) {
        const c = this.#matchOne(concept, surface, ci, text, lower, docTokens, idf, conceptTokens, lang);
        if (best === null || RANK[c.band] > RANK[best.band]) best = c;
        if (best.band === "strong") break;
      }
      return best as ConceptMatch;
    });
  }

  #matchOne(
    concept: BlueprintConcept,
    surface: string,
    ci: number,
    text: string,
    lower: string,
    docTokens: Map<string, number[]>,
    idf: (t: string) => number,
    conceptTokens: string[][],
    lang: Lang,
  ): ConceptMatch {
      const phrase = surface.toLowerCase();

      const idx = lower.indexOf(phrase);
      if (idx !== -1) {
        return {
          concept,
          band: "strong" as ConfidenceBand,
          confidence: 1,
          evidence: excerpt(text, idx, phrase.length),
          evidenceIndex: idx,
        };
      }

      // Tokens of THIS surface form. conceptTokens[ci] is reused only when the
      // surface IS the name, so IDF stays keyed to the concept vocabulary
      // rather than to arbitrary authored terms.
      const toks =
        surface === concept.name
          ? conceptTokens[ci]
          : [...new Set(tokenize(surface, lang).map(stem))];
      if (toks.length === 0) {
        return { concept, band: "absent", confidence: 0, evidence: null, evidenceIndex: null };
      }

      const totalWeight = toks.reduce((s, t) => s + idf(t), 0);
      const positions = toks.map((t) => docTokens.get(t) ?? []);
      const presentWeight = toks.reduce(
        (s, t, i) => s + (positions[i].length > 0 ? idf(t) : 0),
        0,
      );
      const ratio = totalWeight === 0 ? 0 : presentWeight / totalWeight;

      if (ratio < LexicalMatcher.PRESENCE_FLOOR) {
        // A distinguishing token is missing. The document may use the shared
        // vocabulary heavily, but it is not evidence of THIS concept.
        return { concept, band: "absent", confidence: ratio, evidence: null, evidenceIndex: null };
      }

      const anchors = positions.find((p) => p.length > 0) ?? [];
      for (const a of anchors) {
        const inWindow = positions.every(
          (p, i) =>
            positions[i].length === 0 ||
            p.some((q) => Math.abs(q - a) <= LexicalMatcher.WINDOW),
        );
        if (inWindow) {
          return {
            concept,
            band: "probable",
            confidence: 0.6 + 0.35 * ratio,
            evidence: excerpt(text, a, phrase.length),
            evidenceIndex: a,
          };
        }
      }

      const first = positions.flat().sort((x, y) => x - y)[0] ?? null;
      return {
        concept,
        band: "ambiguous",
        confidence: 0.5 * ratio,
        evidence: first === null ? null : excerpt(text, first, 20),
        evidenceIndex: first,
      };
  }
}

export interface ConceptOutput {
  findings: Finding[];
  coveragePct: number;
  matcherName: string;
  counts: Record<ConfidenceBand, number>;
  /** Per-domain matched fraction, for the report. */
  byDomain: Array<{ domainId: string; code: string; weightPct: number; matchedPct: number }>;
}

const CREDITED: ConfidenceBand[] = ["strong", "probable"];

export function matchConcepts(
  text: string,
  blueprint: Blueprint,
  matcher: ConceptMatcher = new LexicalMatcher(),
): ConceptOutput {
  const concepts = blueprint.concepts ?? [];
  const counts: Record<ConfidenceBand, number> = {
    strong: 0,
    probable: 0,
    ambiguous: 0,
    absent: 0,
  };

  if (concepts.length === 0) {
    // No concept layer. The engine must degrade rather than fail -- most
    // external schemes will not have one -- but it must NOT report a coverage
    // number derived from nothing.
    return {
      findings: [
        {
          findingType: "structural_note",
          label: "Blueprint has no concept layer; coverage cannot be computed",
          severity: "high",
          visibility: "internal",
          requiresHumanReview: true,
          note:
            "Concept matching is the only stage that produces coverage. Without " +
            "a concept layer the fallback is task-statement matching, which is " +
            "coarser and is not implemented yet.",
        },
      ],
      coveragePct: 0,
      matcherName: matcher.name,
      counts,
      byDomain: [],
    };
  }

  const matches = matcher.match(text, concepts, blueprint.lang);
  const findings: Finding[] = [];

  // task -> domain, so a concept can be attributed to the domains that reach it
  const taskDomain = new Map(blueprint.tasks.map((t) => [t.id, t.domainId]));

  const domainTotals = new Map<string, { total: number; matched: number }>();
  for (const d of blueprint.domains) domainTotals.set(d.id, { total: 0, matched: 0 });

  for (const m of matches) {
    counts[m.band]++;
    const credited = CREDITED.includes(m.band);

    // A concept reachable from several domains counts in each. That mirrors the
    // task_concepts reuse the blueprint already declares -- it is not double
    // counting, because each domain's fraction is computed over its own
    // reachable set.
    const domains = new Set<string>();
    for (const taskId of m.concept.taskIds) {
      const d = taskDomain.get(taskId);
      if (d) domains.add(d);
    }
    for (const d of domains) {
      const agg = domainTotals.get(d);
      if (!agg) continue;
      agg.total++;
      if (credited) agg.matched++;
    }

    if (m.band === "absent") {
      findings.push({
        findingType: "concept_match",
        conceptId: m.concept.id,
        label: m.concept.name,
        confidence: m.confidence,
        confidenceBand: "absent",
        severity: "medium",
        visibility: "both",
        requiresHumanReview: false,
        note: "Not identified in the source. This is a coverage gap.",
      });
      continue;
    }

    findings.push({
      findingType: "concept_match",
      conceptId: m.concept.id,
      label: m.concept.name,
      confidence: m.confidence,
      confidenceBand: m.band,
      evidenceExcerpt: m.evidence,
      evidenceLocator: m.evidenceIndex === null ? null : `char ${m.evidenceIndex}`,
      severity: "low",
      visibility: "both",
      // The ambiguous band exists because it needs a person. The CHECK in
      // migration 219 enforces this on write; setting it here means the
      // engine and the database agree rather than the database catching us.
      requiresHumanReview: m.band === "ambiguous",
      note:
        m.band === "ambiguous"
          ? "Tokens present but scattered. Could be the concept or coincidence of " +
            "common vocabulary. NOT credited toward coverage: over-crediting a " +
            "competitor is the direction of error that makes the tool worthless."
          : undefined,
    });
  }

  const byDomain = blueprint.domains.map((d) => {
    const agg = domainTotals.get(d.id) ?? { total: 0, matched: 0 };
    return {
      domainId: d.id,
      code: d.code,
      weightPct: d.weightPct,
      matchedPct: agg.total === 0 ? 0 : (agg.matched / agg.total) * 100,
    };
  });

  const coveragePct = byDomain.reduce((sum, d) => sum + (d.weightPct * d.matchedPct) / 100, 0);

  return {
    findings,
    coveragePct: Math.round(coveragePct * 10) / 10,
    matcherName: matcher.name,
    counts,
    byDomain,
  };
}
