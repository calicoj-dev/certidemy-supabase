// _shared/analyzer/drift.ts
//
// Rule-based terminology drift detection. Deterministic, near-free, and the
// highest-signal stage in every calibration document tested -- including, on its
// first real run, our own item bank.
//
// THE CONTRASTIVE PROBLEM, AND WHY IT IS SOLVED HERE AND NOT LATER
//
// A document TEACHING terminology drift and a document SUFFERING from it look
// identical to a substring match. This is not hypothetical: the first nineteen
// hits the ruleset produced were SM-AI-I items, and all nineteen were correct.
// Items like "A colleague claims the 2020 Scrum Guide dropped servant leadership
// entirely -- what is the correct response?" are BETTER than a document that
// simply avoids the word, and flagging them as drift is worse than useless.
//
// So a match near a contrastive marker is not reported as drift. It is reported
// as a structural note requiring human review, with the surrounding text
// attached, and it never reaches a partner surface.

import type { DriftRule, Finding, Lang } from "./types.ts";
import { compileRules, type CompileReport } from "./regex.ts";

/**
 * Markers that indicate a legacy term is being NAMED rather than USED.
 *
 * Per language, because the documents are per language. These are deliberately
 * about edition/change language rather than general hedging -- "previously"
 * near "Development Team" is contrastive; "however" is not.
 */
const CONTRASTIVE_MARKERS: Record<Lang, RegExp[]> = {
  en: [
    /\b20(17|20) Scrum Guide\b/i,
    /\bno longer\b/i,
    /\bformerly\b/i,
    /\bpreviously\b/i,
    /\bused to be\b/i,
    /\brenamed\b/i,
    /\breplaced (by|with)\b/i,
    /\binstead of\b/i,
    /\bnow (called|known as|termed)\b/i,
    /\blegacy (term|terminology|material)/i,
    /\bdeprecated\b/i,
    /\bolder (edition|version)\b/i,
    /\bthe term\b/i,
    /\bdropped\b/i,
    /\bchanged (to|from)\b/i,
  ],
  "es-419": [
    /\bGu[i\u00ED]a (de )?Scrum 20(17|20)\b/i,
    /\bya no\b/i,
    /\banteriormente\b/i,
    /\bantes se (llamaba|denominaba)\b/i,
    /\brenombrad[oa]\b/i,
    /\breemplazad[oa] por\b/i,
    /\ben lugar de\b/i,
    /\bahora se (llama|denomina)\b/i,
    /\bterminolog[i\u00ED]a (heredada|antigua)\b/i,
    /\bobsolet[oa]\b/i,
    /\bel t[e\u00E9]rmino\b/i,
    // NOT \b at the end: JS word boundaries are ASCII-only, so \b after an
    // accented vowel never matches. Explicit lookahead instead.
    /\belimin[o\u00F3](?![a-z\u00E0-\u00FF])/i,
  ],
  "pt-BR": [
    /\b(Guia do Scrum|Scrum Guide) 20(17|20)\b/i,
    /\bn[a\u00E3]o (mais|[e\u00E9] mais)\b/i,
    /\banteriormente\b/i,
    /\bera chamado\b/i,
    /\brenomead[oa]\b/i,
    /\bsubstitu[i\u00ED]d[oa] por\b/i,
    /\bem vez de\b/i,
    /\bagora (se chama|[e\u00E9] chamado)\b/i,
    /\bterminologia (legada|antiga)\b/i,
    /\bobsolet[oa]\b/i,
    /\bo termo\b/i,
  ],
};

/**
 * How far either side of a match to look for a contrastive marker.
 *
 * 220 characters is roughly a long sentence plus its neighbour. Wider starts
 * absolving genuine drift that happens to sit near an unrelated mention of the
 * 2020 Guide; narrower misses the common construction where the correction
 * lands in the following sentence.
 */
const CONTEXT_WINDOW = 220;

/** Evidence excerpts are capped to match the 300-char CHECK on the column. */
const EXCERPT_MAX = 300;

function excerptAround(text: string, index: number, matchLen: number): string {
  const pad = Math.max(0, Math.floor((EXCERPT_MAX - matchLen) / 2));
  let start = Math.max(0, index - pad);
  let end = Math.min(text.length, index + matchLen + pad);

  // Prefer word boundaries so the excerpt does not begin mid-word.
  while (start > 0 && /\S/.test(text[start - 1])) start--;
  while (end < text.length && /\S/.test(text[end])) end++;

  let out = text.slice(start, end).replace(/\s+/g, " ").trim();
  if (out.length > EXCERPT_MAX) out = out.slice(0, EXCERPT_MAX - 1).trimEnd();
  return out;
}

function isContrastive(text: string, index: number, matchLen: number, lang: Lang): string | null {
  const start = Math.max(0, index - CONTEXT_WINDOW);
  const end = Math.min(text.length, index + matchLen + CONTEXT_WINDOW);
  const window = text.slice(start, end);

  for (const marker of CONTRASTIVE_MARKERS[lang] ?? CONTRASTIVE_MARKERS.en) {
    const m = window.match(marker);
    if (m) return m[0];
  }
  return null;
}

export interface DriftInput {
  text: string;
  /** Primary document language. Selects the contrastive marker set. */
  lang: Lang;
  rules: DriftRule[];
  /**
   * Which rule languages to apply. Defaults to the document language PLUS
   * English for non-English documents.
   *
   * WHY THE DEFAULT IS NOT SIMPLY [lang]
   *
   * The official translated Scrum Guides keep roles, artifacts and events in
   * English inside otherwise translated prose -- TERMINOLOGY-POLICY rule 4. So
   * a Spanish syllabus says "Development Team", "Daily Sprint" and "Sprint
   * Planning Meeting" as literal English strings, and filtering the ruleset to
   * es-419 only means checking a competitor document against ZERO rules and
   * then reporting it as clean.
   *
   * That is exactly what happened on the AulaUtil fixture: drift=0,
   * cleanPass=true, on a document containing four separate legacy terms.
   *
   * A false clean pass is worse than a false positive. A false positive gets
   * argued about; a false clean pass gets believed.
   *
   * Pass this explicitly for a source family whose translations DO localise
   * their terminology -- ISO standards, for instance, translate their control
   * names, so applying the English ruleset to a Spanish ISO syllabus would be
   * wrong.
   */
  ruleLangs?: Lang[];
}

export interface DriftOutput {
  findings: Finding[];
  /** Rules that failed to load. Surfaced, never swallowed. */
  rejected: CompileReport["rejected"];
  rulesetSize: number;
  /** Which rule languages were actually applied, for the run record. */
  appliedLangs: Lang[];
}

function defaultRuleLangs(lang: Lang): Lang[] {
  return lang === "en" ? ["en"] : [lang, "en"];
}

export function detectDrift(input: DriftInput): DriftOutput {
  const langs = input.ruleLangs ?? defaultRuleLangs(input.lang);
  const applicable = input.rules.filter((r) => langs.includes(r.lang));
  const { compiled, rejected } = compileRules(
    applicable.map((r) => ({
      id: r.id,
      legacyTerm: r.legacyTerm,
      matchMode: r.matchMode,
      pattern: r.pattern,
    })),
  );

  const byId = new Map(applicable.map((r) => [r.id, r]));
  const findings: Finding[] = [];

  for (const matcher of compiled) {
    const rule = byId.get(matcher.ruleId);
    if (!rule) continue;

    const hits = matcher.test(input.text);
    if (hits.length === 0) continue;

    // One finding per rule, not per occurrence. Twelve mentions of
    // "Development Team" in one syllabus is ONE terminology problem, and
    // emitting twelve rows would make a single defect look like twelve.
    const first = hits[0];
    const contrastive = isContrastive(input.text, first.index, first.match.length, input.lang);
    const excerpt = excerptAround(input.text, first.index, first.match.length);

    if (contrastive) {
      findings.push({
        findingType: "structural_note",
        driftRuleId: rule.id,
        label: `Legacy term "${rule.legacyTerm}" appears in a contrastive context`,
        evidenceExcerpt: excerpt,
        evidenceLocator: `char ${first.index}`,
        severity: "low",
        visibility: "internal",
        requiresHumanReview: true,
        note:
          `Matched near "${contrastive}", which suggests the term is being named ` +
          `rather than used. This is what correct teaching material looks like. ` +
          `${hits.length} occurrence(s) total. Confirm before treating as drift.`,
      });
      continue;
    }

    findings.push({
      findingType: "drift",
      driftRuleId: rule.id,
      label: rule.currentTerm
        ? `${rule.legacyTerm} -> ${rule.currentTerm}`
        : `${rule.legacyTerm} (not a term in any registered edition)`,
      evidenceExcerpt: excerpt,
      evidenceLocator: `char ${first.index}`,
      severity: rule.severity,
      // Drift findings are the ones a partner most needs to see, and they
      // always carry an excerpt from the partner's own document, so they
      // satisfy the external-evidence CHECK by construction.
      visibility: "both",
      requiresHumanReview: false,
      note: `${hits.length} occurrence(s). ${rule.rationale ?? ""}`.trim(),
    });
  }

  // Deterministic ordering: severity, then term. The same document must produce
  // the same report twice, or the calibration set cannot detect a regression.
  const rank: Record<string, number> = { high: 0, medium: 1, low: 2 };
  findings.sort((a, b) => {
    const s = (rank[a.severity ?? "low"] ?? 3) - (rank[b.severity ?? "low"] ?? 3);
    if (s !== 0) return s;
    return (a.label ?? "").localeCompare(b.label ?? "");
  });

  return { findings, rejected, rulesetSize: compiled.length, appliedLangs: langs };
}
