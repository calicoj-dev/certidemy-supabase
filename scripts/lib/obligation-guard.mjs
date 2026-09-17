/**
 * obligation-guard.mjs - does a paraphrase still say what the clause required?
 *
 * ============ THE DEFECT THIS EXISTS FOR ============
 *
 * Repairing an ISO leak means replacing quoted clause text with our own words.
 * The leak check scores the replacement against the standards and a good
 * paraphrase scores ZERO -- which is exactly what a paraphrase that has dropped
 * the obligation also scores.
 *
 * Caught on the first passage ever drafted. Clause 10.1 says the organization
 * SHALL CONTINUALLY IMPROVE the suitability, adequacy and effectiveness of the
 * ISMS. The first draft read "Clause 10.1 puts the ISMS itself under review on
 * three counts" -- fluent, accurate about the three counts, scoring 0 on the
 * leak index, and QUIETLY WEAKER. Under review is not improve.
 *
 * A candidate taught from that sentence learns that clause 10.1 asks them to
 * look, when it requires them to act. That is a worse defect than the quotation
 * it replaced: the quotation was at least true.
 *
 * ============ IT IS THE SAME LADDER AS THE TRANSLATION DEFECTS ============
 *
 * CLAUDE.md records three rungs the guards cannot see -- wrong language, wrong
 * object, INSERTED OBLIGATION -- and the third is this one running the other
 * way: two translations independently added "periodicamente" to a paragraph
 * whose English states no interval.
 *
 * So this checks BOTH DIRECTIONS. A repair may not drop an obligation the source
 * carried, and may not add one the source did not. The second half is not
 * theoretical: writing "must" into a paraphrase of a clause that says "may" is
 * the easiest possible mistake when the author is trying to sound normative.
 *
 * ============ WHAT IT CANNOT DO ============
 *
 * It counts MODAL STRENGTH, not meaning. "shall determine whether X is relevant"
 * and "shall determine whether Y is relevant" are identical to this function.
 * It cannot see a paraphrase that keeps the obligation and changes its object,
 * which is rung two of the ladder and still needs a human with the standard
 * open. It is a floor, not a review.
 */

/* STRONG = the clause imposes a requirement. WEAK = it permits or advises.
 * Ordered longest-first within each language so "deberá" is not counted as
 * "debe" plus a suffix; matching is on word boundaries anyway, but the order
 * documents the intent. */
const MODALS = {
  en: {
    /* `requirement(s)` was MISSING here, and the gap was found the way gaps in
     * this family always are -- by disagreement, not by review. The SAME repair,
     * in three languages, scored strong 1->1 in Spanish (`exigencia`) and
     * Portuguese (`exigencia`) and strong 1->0 in English, on the phrase "added
     * a requirement to decide". One meaning, three verdicts: that is a
     * vocabulary bug, not a content defect.
     *
     * The omission was arbitrary rather than deliberate -- `obligation` was
     * already on this list, and `requirement` is the same nominalisation of a
     * modal that BOTH translated lists already carried. Adding it closes an
     * asymmetry; it does not loosen the guard, and the controls below still
     * refuse the softening that prompted this file. */
    strong: [/\bshall\b/gi, /\bmust\b/gi, /\bis required to\b/gi, /\bare required to\b/gi,
             /\brequires?\b/gi, /\brequired\b/gi, /\brequirements?\b/gi, /\bhas to\b/gi, /\bhave to\b/gi,
             /\bobligation\b/gi, /\bmandator(y|ily)\b/gi],
    weak:   [/\bmay\b/gi, /\bcan\b/gi, /\bshould\b/gi, /\bmight\b/gi, /\boptional(ly)?\b/gi,
             /\brecommend(s|ed)?\b/gi],
  },
  "es-419": {
    strong: [/\bdeber[áa]n?\b/gi, /\bdeben\b/gi, /\bdebe\b/gi, /\bexigen?\b/gi,
             /\brequieren?\b/gi, /\btiene que\b/gi, /\btienen que\b/gi,
             /\bobligaci[óo]n\b/gi, /\bobligatori[oa]s?\b/gi, /\bexigencia\b/gi],
    weak:   [/\bpuede[n]?\b/gi, /\bpodr[íi]an?\b/gi, /\bdeber[íi]an?\b/gi,
             /\bopcional(es)?\b/gi, /\brecomien[dz]a[n]?\b/gi],
  },
  "pt-BR": {
    strong: [/\bdever[áa]o?\b/gi, /\bdevem\b/gi, /\bdeve\b/gi, /\bexigem?\b/gi,
             /\brequer(em)?\b/gi, /\btem que\b/gi, /\bt[êe]m que\b/gi,
             /\bobrigat[óo]ri[oa]s?\b/gi, /\bobriga[çc][ãa]o\b/gi, /\bexig[êe]ncia\b/gi],
    weak:   [/\bpode[m]?\b/gi, /\bpoderiam?\b/gi, /\bdeveriam?\b/gi,
             /\bopcional(is|es)?\b/gi, /\brecomenda[m]?\b/gi],
  },
};

const countAll = (text, patterns) =>
  patterns.reduce((n, re) => n + ((String(text).match(re) || []).length), 0);

/** Strong and weak modal counts for one string. */
export function modalProfile(text, lang) {
  const m = MODALS[lang];
  if (!m) throw new Error("obligation-guard: no modal vocabulary for " + lang);
  return { strong: countAll(text, m.strong), weak: countAll(text, m.weak) };
}

/**
 * Does `after` carry the same obligation force as `before`?
 *
 * Returns { ok, reason, before, after }. `ok === false` is a refusal, not a
 * warning: a repair that changes what a clause requires must not land on the
 * strength of a leak score that says nothing about it.
 */
export function preservesObligation(before, after, lang) {
  const b = modalProfile(before, lang);
  const a = modalProfile(after, lang);

  if (b.strong > 0 && a.strong === 0) {
    return { ok: false, before: b, after: a,
      reason: "the source imposes a requirement and the replacement does not -- " +
              "a paraphrase that drops `shall` scores zero on the leak index and is worse than the quotation" };
  }
  if (b.strong === 0 && a.strong > 0) {
    return { ok: false, before: b, after: a,
      reason: "the replacement imposes a requirement the source does not -- " +
              "this is the inserted-obligation defect CLAUDE.md records against the translations" };
  }
  /* A source that only permits must not be rewritten into one that only
   * permits MORE weakly or not at all -- losing "may" turns an option into
   * silence, which reads as a prohibition to a candidate. */
  if (b.weak > 0 && a.weak === 0 && a.strong === 0) {
    return { ok: false, before: b, after: a,
      reason: "the source permits something and the replacement says nothing about it" };
  }
  return { ok: true, before: b, after: a, reason: "obligation force preserved" };
}

/**
 * POSITIVE CONTROL. A guard that cannot fire is indistinguishable from one that
 * fired and found nothing, and this one guards a rule whose violations score
 * zero on every other check in the pipeline.
 *
 * The first case is the REAL defect, verbatim from the first drafted repair.
 */
export function checkFaithful() {
  const cases = [
    // the real one, caught by hand before this file existed
    ["The organization shall continually improve the suitability of the ISMS.",
     "Clause 10.1 puts the ISMS itself under review on three counts.", "en", false],
    // the accepted repair for the same passage
    ["The organization shall continually improve the suitability of the ISMS.",
     "Clause 10.1 requires the ISMS itself to be improved on three counts.", "en", true],
    // the other direction
    ["The organization may consider external providers.",
     "The organization must consider external providers.", "en", false],
    // Spanish: debe -> exige is a preserved requirement
    ["La organizacion debe mejorar continuamente el SGSI.",
     "La clausula 10.1 exige mejorar el propio SGSI.", "es-419", true],
    // Spanish: debe -> nothing
    ["La organizacion debe mejorar continuamente el SGSI.",
     "La clausula 10.1 trata de la mejora del SGSI.", "es-419", false],
    // Portuguese: deve -> exige preserved
    ["A organizacao deve melhorar continuamente o SGSI.",
     "A clausula 10.1 exige melhorar o proprio SGSI.", "pt-BR", true],
    // Portuguese: deve -> deveria is a softening into advice
    ["A organizacao deve melhorar continuamente o SGSI.",
     "A organizacao deveria melhorar o SGSI.", "pt-BR", false],
    // THE NOMINALISATION. `shall determine` -> `a requirement to decide` keeps
    // the force. This case is why `requirement` is on the strong list.
    ["it added that the organization shall determine whether climate change is a relevant issue",
     "it added a requirement to decide whether climate change is relevant", "en", true],
    // AND THE SOFTENING IT MUST NOT BE CONFUSED WITH: same clause, same shape,
    // obligation gone. If widening the vocabulary ever breaks this case, the
    // widening was a loosening.
    ["it added that the organization shall determine whether climate change is a relevant issue",
     "it added a note about climate change being worth considering", "en", false],
  ];
  const bad = [];
  for (const [b, a, lang, want] of cases) {
    const got = preservesObligation(b, a, lang).ok;
    if (got !== want) bad.push(`${lang}: ${JSON.stringify(a.slice(0, 50))} -> got ok=${got}, want ${want}`);
  }
  return bad;
}
