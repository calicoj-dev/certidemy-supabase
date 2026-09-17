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
 *
 * AND A NOUN CAN MASK A LOST MODAL. The weak-loss rule only fires when the
 * STRONG count is also zero, so a repair that drops `should` while the sentence
 * still contains `requirements` reads as weak 1 -> 0, strong 1 -> 1, and
 * passes. That happened on AIMS-F 04-05: "but SHOULD be aware of unique
 * requirements" became "while staying alert to requirements unique", turning
 * ISO's advice into a description of what happens, and nothing refused it.
 *
 * It is a consequence of adding nominalisations to the strong lists -- a noun
 * that is not the modal holds the strong count up while the modal leaves. The
 * rule was NOT tightened to `a.weak === 0` alone, because a genuine
 * weak-to-strong repair (`can be needed` -> `may be needed` alongside a `shall`)
 * would then be refused for no reason. What closes it is reading the profile
 * when weak drops at all, which is why the per-span profile is printed on every
 * line the generators emit rather than only on refusals.
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
    /* `requisito(s)` and `requerimiento(s)` WERE MISSING, and their absence is
     * the SECOND instance of one mistake: a modal list that carries a verb and
     * not its nominalisation. English was missing `requirement` while carrying
     * `obligation`, found this morning when three languages disagreed about one
     * repair. Spanish was missing `requisito` while carrying `exigencia`, found
     * this afternoon when a faithful translation -- "anadio el requisito de
     * decidir" -- was refused as a dropped obligation.
     *
     * THE RULE THE TWO INSTANCES TEACH: every verb on a strong list needs its
     * noun beside it, because a paraphrase or a translation moves freely
     * between the two and the guard cannot see that they are the same duty. */
    strong: [/\bdeber[áa]n?\b/gi, /\bdeben\b/gi, /\bdebe\b/gi, /\bexigen?\b/gi,
             /\brequieren?\b/gi, /\brequisitos?\b/gi, /\brequerimientos?\b/gi,
             /\btiene que\b/gi, /\btienen que\b/gi,
             /* IMPERSONAL NECESSITY. Spanish states a duty with "es necesario"
              * where English uses "has to be done" -- no modal verb, same
              * force. Found the same way as the nominalisations: a faithful
              * translation refused as a dropped obligation. */
             /\bnecesari[oa]s?\b/gi, /\bhace falta\b/gi, /\bprecisa[n]? de\b/gi,
             /\bobligaci[óo]n\b/gi, /\bobligatori[oa]s?\b/gi, /\bexigencia\b/gi],
    weak:   [/\bpuede[n]?\b/gi, /\bpodr[íi]an?\b/gi, /\bdeber[íi]an?\b/gi,
             /\bopcional(es)?\b/gi, /\brecomien[dz]a[n]?\b/gi],
  },
  "pt-BR": {
    /* Same nominalisation rule as es-419 above: `requisito(s)` beside `requer`. */
    strong: [/\bdever[áa]o?\b/gi, /\bdevem\b/gi, /\bdeve\b/gi, /\bexigem?\b/gi,
             /\brequer(em)?\b/gi, /\brequisitos?\b/gi,
             /\btem que\b/gi, /\bt[êe]m que\b/gi,
             /* Same impersonal necessity as es-419 above. */
             /\bnecess[áa]ri[oa]s?\b/gi, /\bpreciso\b/gi,
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
 * ACROSS LANGUAGES. `preservesObligation` scores BOTH sides with ONE language's
 * vocabulary, which is correct for a same-language repair and WRONG for a
 * translation: English "requires" matches nothing in the Spanish list, so the
 * source scores strong 0, the Spanish "debe" scores strong 1, and the guard
 * reports an INSERTED obligation on a faithful translation.
 *
 * That is exactly what it did on the first three re-translations attempted --
 * two false refusals out of three. The guard was being asked a question it was
 * not built for.
 *
 * Here each side is scored with ITS OWN vocabulary, and the comparison is
 * between the two strengths. The failure modes are the same two and they still
 * matter more here than anywhere else: a translation that drops `shall` states
 * a requirement as description, and one that adds it invents a duty -- and
 * CLAUDE.md records the inserted-obligation defect happening twice
 * independently, in both translations of the same paragraph.
 */
/* ============ THE TWO DIRECTIONS ARE NOT EQUALLY CHECKABLE ACROSS LANGUAGES ==
 *
 * Measured over 90 Spanish re-translations:
 *
 *   1 -> 0  DROPPED. English states a duty, the target has no obligation word
 *           anywhere. Real, checkable, and refused.
 *
 *   0 -> 1  INSERTED. English shows strong 0 and the target shows strong 1 --
 *           but ENGLISH ENCODES OBLIGATION IN SYNTAX WHERE SPANISH AND
 *           PORTUGUESE ENCODE IT LEXICALLY. "what not to do" is "lo que no se
 *           debe hacer"; "what to monitor and measure" is "que debe ser objeto
 *           de seguimiento". A faithful translation of an English infinitive
 *           acquires a modal, and no word list can tell that from a translator
 *           inventing a duty.
 *
 * So this returns `ok` with an `inserted` flag rather than refusing. THAT IS
 * NOT THE CHECK BEING WEAKENED TO LET WORK THROUGH: the inserted-obligation
 * defect is real -- CLAUDE.md records two translations independently adding
 * `periodicamente` to a paragraph whose English states no interval -- and it is
 * precisely the rung the guards were never able to see. Flagging it routes it
 * to the human read, which is where it was always going to be caught.
 *
 * `preservesObligation` (same language, both directions) still REFUSES on 0->1,
 * because a paraphrase has no syntactic excuse.
 */
export function preservesObligationAcross(source, sourceLang, target, targetLang) {
  const b = modalProfile(source, sourceLang);
  const a = modalProfile(target, targetLang);
  if (b.strong > 0 && a.strong === 0) {
    return { ok: false, inserted: false, before: b, after: a,
      reason: "the English imposes a requirement and the translation does not" };
  }
  if (b.weak > 0 && a.weak === 0 && a.strong === 0) {
    return { ok: false, inserted: false, before: b, after: a,
      reason: "the English permits something and the translation says nothing about it" };
  }
  if (b.strong === 0 && a.strong > 0) {
    return { ok: true, inserted: true, before: b, after: a,
      reason: "the translation carries an obligation the English states without a modal -- " +
              "usually idiomatic, occasionally an inserted duty; READ THIS ONE" };
  }
  return { ok: true, inserted: false, before: b, after: a, reason: "obligation force carried across" };
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
  // CROSS-LANGUAGE. These are the two false refusals that prompted
  // preservesObligationAcross, plus the two real failures it must still catch.
  const across = [
    ["Clause 10.1 requires the ISMS to be improved.", "en",
     "La clausula 10.1 exige mejorar el SGSI.", "es-419", true],
    ["Responsibilities are allocated between the organization and its suppliers.", "en",
     "Las responsabilidades se asignan entre la organizacion y sus proveedores.", "es-419", true],
    ["The organization shall consider the results.", "en",
     "La organizacion considera los resultados.", "es-419", false],
    // 0 -> 1 across languages is now a FLAG, not a refusal: see
    // preservesObligationAcross. `ok` is true and `inserted` is set.
    ["The organization may consider the results.", "en",
     "La organizacion debe considerar los resultados.", "es-419", true],
    // THE NOMINALISATIONS, one per language. Each of these was a real refusal
    // of a faithful translation before the word was added to its list.
    ["it added a requirement to decide whether climate change is relevant", "en",
     "anadio el requisito de decidir si el cambio climatico es relevante", "es-419", true],
    ["it added a requirement to decide whether climate change is relevant", "en",
     "acrescentou o requisito de decidir se a mudanca climatica e relevante", "pt-BR", true],
    // And the softening they must not be confused with.
    ["it added a requirement to decide whether climate change is relevant", "en",
     "anadio una nota sobre el cambio climatico", "es-419", false],
    // THE IMPERSONAL NECESSITY CONSTRUCTIONS, one per language. Each was a real
    // refusal of a faithful translation before the phrase joined the list.
    ["Then work out whether something has to be done about what caused it", "en",
     "Luego determinar si es necesario hacer algo con respecto a lo que la causo", "es-419", true],
    ["Then work out whether something has to be done about what caused it", "en",
     "Depois determinar se e necessario fazer algo a respeito do que a causou", "pt-BR", true],
  ];
  const bad = [];
  for (const [b, a, lang, want] of cases) {
    const got = preservesObligation(b, a, lang).ok;
    if (got !== want) bad.push(`${lang}: ${JSON.stringify(a.slice(0, 50))} -> got ok=${got}, want ${want}`);
  }
  for (const [src, sl, tgt, tl, want] of across) {
    const got = preservesObligationAcross(src, sl, tgt, tl).ok;
    if (got !== want) bad.push(`across ${tl}: ${JSON.stringify(tgt.slice(0, 44))} -> got ok=${got}, want ${want}`);
  }
  /* AND THE FLAG ITSELF, not just the verdict: a 0 -> 1 that came back ok but
   * UNFLAGGED would be indistinguishable from a clean pass, and the whole point
   * of downgrading that direction is that it still reaches the human read. */
  {
    const f = preservesObligationAcross(
      "Awareness programmes consist entirely of what not to do.", "en",
      "Los programas consisten enteramente en lo que no se debe hacer.", "es-419");
    if (!f.ok || !f.inserted) bad.push("0->1 across languages should be ok with inserted=true");
  }
  return bad;
}
