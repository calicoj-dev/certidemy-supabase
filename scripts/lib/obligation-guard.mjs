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
/* ============ `` IS ASCII-ONLY, AND FIVE PATTERNS COULD NOT FIRE ==========
 *
 * JavaScript defines `` over [A-Za-z0-9_]. An accented letter is NOT a word
 * character to it, so a boundary between `a` and a space is no boundary at all
 * and `/deber[aa]n?/` never matched `debera` with the accent -- the ISO
 * rendering of `shall`, and the form real Spanish actually writes.
 *
 * Found 2026-09-17 when the guard refused two correct AIMS-IA translations as
 * dropped obligations. The refusal was the lucky half. The silent half is that
 * an INSERTED obligation and an INFLATED modal both score zero on a form the
 * guard cannot see, and `noModalInflation` is built on exactly these lists --
 * so every should-became-must sweep run before this date undercounted.
 *
 * Exactly five patterns were affected, and the rule is mechanical: only a match
 * that BEGINS or ENDS on an accented character is invisible. An accent in the
 * middle is fine, which is why `obligacion`, `podria` and `convem` all worked
 * and hid the family.
 *
 *     es strong   debera            ISO's `shall`
 *     pt strong   devera            same
 *     pt strong   deverao           not even in the character class -- separate gap
 *     pt strong   e necessario      leading vowel
 *     pt weak     e recomendavel    leading vowel
 *
 * So no pattern here is written with `` any more. `w()` builds the boundary
 * from an explicit Latin range, and `checkFaithful` asserts the accented forms
 * are seen -- the control that would have caught this on the day it was written.
 */
const LETTER = "0-9A-Za-z_À-ɏ";
const w = (src) => new RegExp("(?<![" + LETTER + "])(?:" + src + ")(?![" + LETTER + "])", "gi");

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
    strong: [w("shall"), w("must"), w("is required to"), w("are required to"),
             w("requires?"), w("required"), w("requirements?"), w("has to"), w("have to"),
             w("obligation"), w("mandator(y|ily)")],
    /* `could` was missing while `can` and `might` were both here -- the same
     * arbitrary gap as `requirement` on the strong list above, found the same
     * way. Two AIMS-IA module 5 recasts wrote "could weaken the conclusions"
     * and "could arise" for ISO's `can`, and the guard read a dropped modal. */
    weak:   [w("may"), w("can"), w("could"), w("should"), w("might"), w("optional(ly)?"),
             w("recommend(s|ed)?")],
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
    strong: [w("deberán?"), w("deberan?"), w("deben"), w("debe"), w("exigen?"),
             w("requieren?"), w("requisitos?"), w("requerimientos?"),
             w("tiene que"), w("tienen que"),
             /* IMPERSONAL NECESSITY ONLY -- "es necesario", never bare
              * "necesarios".
              *
              * The first version matched the bare adjective and immediately
              * produced two false refusals: "Cuando sean necesarios controles
              * diferentes" is DESCRIPTIVE -- where different controls are
              * necessary -- and its English counterpart `necessary` is not on
              * the English list either. Same word, two verdicts, which is the
              * cross-language disagreement that has now surfaced three times in
              * this file.
              *
              * THE RULE: a bare adjective is not a modal. "es necesario hacer X"
              * imposes; "los controles necesarios" describes. Match the
              * construction, not the word. */
             w("(es|sea|era|fuera|ser[áa]) necesario"), w("necesario que"),
             w("hace falta"),
             w("obligaci[óo]n"), w("obligatori[oa]s?"), w("exigencia"),
             /* THIRD FORM OF THE SAME RULE. The file already says every verb on a
              * strong list needs its NOUN beside it. These two instances add the
              * PARTICIPLE and the SUBJUNCTIVE: `exigen` was here and `exigido`
              * was not, so "provided, not required" -> "fornecidos, nao exigidos"
              * scored strong 0 and a faithful translation was refused. */
             w("exigid[oa]s?"), w("requerid[oa]s?")],
    /* `conviene` BELONGS HERE and was only in the inflation check's own list.
     * Two vocabularies for one idea is how they drift: the fixer was told to
     * render `should` as `conviene`, did so correctly, and the profile then
     * scored weak 0 because THIS list had never heard of it -- so the
     * weak-loss rule refused a faithful translation. Fourth gap of this family
     * today, and the first caused by having two lists rather than one. */
    weak:   [w("puede[n]?"), w("pueda[n]?"), w("podr[íi]an?"), w("deber[íi]an?"),
             w("conviene"), w("convendr[íi]a"), w("es recomendable"),
             w("opcional(es)?"), w("recomien[dz]a[n]?"), w("se recomienda")],
  },
  "pt-BR": {
    /* Same nominalisation rule as es-419 above: `requisito(s)` beside `requer`.
     * `deverao` was missing outright -- the class held only [aa], so the plural
     * future of the single most common Portuguese obligation was unmatched
     * whether or not the boundary worked. */
    strong: [w("dever[áa]"), w("dever[ãa]o"), w("devem"), w("deve"), w("exigem?"),
             w("requer(em)?"), w("requisitos?"),
             w("tem que"), w("t[êe]m que"),
             /* Same impersonal necessity as es-419 above, and the same
              * narrowing: the construction, never the bare adjective. */
             w("[ée] necess[áa]rio"), w("seja necess[áa]rio"), w("necess[áa]rio que"),
             w("obrigat[óo]ri[oa]s?"), w("obriga[çc][ãa]o"), w("exig[êe]ncia"),
             w("exigid[oa]s?"), w("requerid[oa]s?")],
    /* Same as es-419: the ABNT rendering of `should` lives HERE, not only in
     * the inflation check. */
    weak:   [w("pode[m]?"), w("possa[m]?"), w("poderiam?"), w("deveriam?"),
             w("conv[ée]m"), w("[ée] recomend[áa]vel"),
             w("opcional(is|es)?"), w("recomenda[m]?"), w("recomenda-se")],
  },
};

/* ============ OVERLAPPING PATTERNS WERE DOUBLE-COUNTING ============
 *
 * `are required to` and `required` both match the same four words, so "are
 * required to be used" scored strong 2 for ONE obligation. Recasting it as "has
 * to be used" -- one obligation, one match -- printed 2 -> 1 and read as a
 * dropped `shall`.
 *
 * It never changed a VERDICT, because every rule here turns on reaching zero.
 * It changed what the printed numbers MEAN, and those numbers are read: a real
 * dropped `shall` in AIMS-IA 04-08 was caught on 2026-09-17 by noticing 3 -> 2
 * in this very column. An instrument used for that has to be trustworthy at
 * values above zero too.
 *
 * So matches are merged by POSITION and counted once per span of text. Two
 * patterns covering the same words are one modal; two separate modals remain
 * two. */
const countAll = (text, patterns) => {
  const t = String(text);
  const spans = [];
  for (const re of patterns) {
    re.lastIndex = 0;
    for (const m of t.matchAll(re)) spans.push([m.index, m.index + m[0].length]);
  }
  spans.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let n = 0, end = -1;
  for (const [s0, e0] of spans) {
    if (s0 >= end) { n++; end = e0; }          // disjoint: a new modal
    else if (e0 > end) end = e0;               // overlapping: same modal, extend
  }
  return n;
};

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

/* ============ INFLATION IS ITS OWN DEFECT AND NEEDS ITS OWN CHECK ============
 *
 * `preservesObligationAcross` catches a DROPPED obligation. This catches the
 * opposite: English says SHOULD and the translation says MUST.
 *
 * It is deliberately NOT folded into the other function, and `should` is
 * deliberately NOT made a same-strength match for `debe`. Those would both blur
 * the two directions together, and they are different defects with different
 * causes -- one loses a requirement, the other invents one.
 *
 * ============ WHY THE DISTINCTION FROM THE IDIOMATIC CASE IS CLEAN ==========
 *
 * The 0 -> 1 direction was downgraded to a flag because English encodes
 * obligation in syntax: "what not to do" is "lo que no se debe hacer", and a
 * faithful translation of an English infinitive acquires a modal. That case has
 * NO MODAL AT ALL in the English -- strong 0 and weak 0.
 *
 * Inflation is different and unambiguous: the English states a WEAK modal
 * explicitly. `should` is not an infinitive that Spanish must render with a
 * modal; it is a word with a Spanish counterpart, and choosing `debe` over
 * `deberia` changes what the clause requires.
 *
 * ============ AND IT IS SUBSTANTIVE ON THESE CERTIFICATIONS ============
 *
 * AIMS-F teaches the shall/should distinction outright -- lesson 02-06's
 * Spanish says "lo importante es que se trata de un deberá". Explaining the
 * difference in English and collapsing it in translation is precisely what an
 * ISO shop reads for a living.
 *
 * ABNT renders `should` as "convém que"; Spanish practice uses "debería" or
 * "conviene". Measured across this corpus before the check was written:
 * `conviene` 0 occurrences, `convém` 0, and Portuguese `deveria` once against
 * `deve`/`devem` 31 times.
 */
/* DERIVED, NOT DUPLICATED. This was a second hand-written vocabulary and it
 * immediately diverged from MODALS[lang].weak -- `convem` was in one and not
 * the other, so the fixer produced the correct ABNT rendering and the profile
 * scored it as no modal at all. One list. */
const weakFormsOf = (lang) => MODALS[lang]?.weak ?? [];

/**
 * Did a WEAK English modal become a STRONG one in translation?
 *
 * { ok, reason, english, target } -- ok === false is a refusal.
 */
export function noModalInflation(english, target, targetLang) {
  const e = modalProfile(english, "en");
  const t = modalProfile(target, targetLang);
  // Only fires when the English SAYS should/may/can and says no shall/must.
  if (e.weak === 0 || e.strong > 0) return { ok: true, english: e, target: t, reason: "no weak-only English modal" };
  if (t.strong === 0) return { ok: true, english: e, target: t, reason: "target is not strong" };
  const softInTarget = weakFormsOf(targetLang)
    .reduce((n, re) => n + ((String(target).match(re) || []).length), 0);
  if (softInTarget > 0) {
    return { ok: true, english: e, target: t,
      reason: "target carries a weak form alongside; the strong one is elsewhere in the sentence" };
  }
  return { ok: false, english: e, target: t,
    reason: "the English says should/may and the translation states a requirement -- " +
            "use deberia / conviene (es) or convem que / deveria (pt), not debe / deve" };
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

  /* INFLATION. The four cases that matter, and the two it must NOT fire on. */
  const inflation = [
    // REAL: English should -> target must.
    ["The organization should consider the results.",
     "La organizacion debe considerar los resultados.", "es-419", false],
    ["The organization should consider the results.",
     "A organizacao deve considerar os resultados.", "pt-BR", false],
    // CORRECT renderings of the same English.
    ["The organization should consider the results.",
     "La organizacion deberia considerar los resultados.", "es-419", true],
    ["The organization should consider the results.",
     "Convem que a organizacao considere os resultados.", "pt-BR", true],
    // MUST NOT FIRE: English carries a shall, so a strong target is right even
    // though a `may` sits beside it.
    ["The organization shall consider the results and may document them.",
     "La organizacion debe considerar los resultados y puede documentarlos.", "es-419", true],
    // MUST NOT FIRE: no English modal at all -- the idiomatic case.
    ["Awareness programmes consist entirely of what not to do.",
     "Los programas consisten enteramente en lo que no se debe hacer.", "es-419", true],
    // MUST NOT FIRE: `necesarios` as a BARE ADJECTIVE is descriptive, and its
    // English counterpart `necessary` is not on the English list either. This
    // case produced two false refusals before the Spanish pattern was narrowed
    // to the impersonal construction.
    ["Where different or additional controls are necessary, the organization can design them itself.",
     "Cuando sean necesarios controles diferentes o adicionales, la organizacion puede disenarlos ella misma.", "es-419", true],
    ["Where different or additional controls are necessary, the organization can design them itself.",
     "Quando forem necessarios controles diferentes ou adicionais, a organizacao pode projeta-los ela mesma.", "pt-BR", true],
  ];
  for (const [en, tgt, lang, want] of inflation) {
    const got = noModalInflation(en, tgt, lang).ok;
    if (got !== want) bad.push(`inflation ${lang}: ${JSON.stringify(tgt.slice(0, 46))} -> got ok=${got}, want ${want}`);
  }

  /* ============ THE ACCENTED FORMS, WHICH NOTHING ABOVE EXERCISES ==========
   *
   * EVERY case above is written in unaccented Spanish and Portuguese -- `debe`,
   * `deberia`, `Convem`, `necessarios`. That is house style for this repo and it
   * is why an accent bug in the vocabulary was structurally unreachable: the
   * controls could not have caught it, because they never wrote an accent.
   *
   * So these assert the vocabulary DIRECTLY, in the orthography the translations
   * actually use, and each one names the modal it is about. `debera` with the
   * accent is ISO's rendering of `shall` and scored zero for as long as this
   * file has existed. */
  const seen = [
    ["es-419", "La organización deberá considerar el propósito previsto.", "strong", "debera"],
    ["es-419", "Las organizaciones deberán determinar sus roles.", "strong", "deberan"],
    ["pt-BR",  "A organização deverá considerar a finalidade pretendida.", "strong", "devera"],
    ["pt-BR",  "As organizações deverão determinar seus papéis.", "strong", "deverao"],
    ["pt-BR",  "É necessário que a direção analise criticamente.", "strong", "e necessario"],
    ["pt-BR",  "É recomendável que a direção analise criticamente.", "weak", "e recomendavel"],
    ["es-419", "La organización podría documentarlos.", "weak", "podria"],
    ["pt-BR",  "Convém que a organização considere os resultados.", "weak", "convem"],
    ["es-419", "Esto crea una obligación para la organización.", "strong", "obligacion"],
    /* The participle and the subjunctive, both found 2026-09-17 in AIMS-IA
     * module 4 translations that the guard refused as faithful. */
    ["es-419", "Son proporcionados, no exigidos.", "strong", "exigidos"],
    ["pt-BR",  "São fornecidos, não exigidos.", "strong", "exigidos"],
    ["es-419", "de forma que puedan producir resultados consistentes.", "weak", "puedan"],
    ["en", "The controls are required to be used.", "strong", "are required to (counted once, not twice)"],
    ["en", "Obstacles that could weaken the conclusions.", "weak", "could"],
    ["pt-BR",  "de forma que possam produzir resultados consistentes.", "weak", "possam"],
  ];
  for (const [lang, text, side, label] of seen) {
    if (modalProfile(text, lang)[side] < 1) {
      bad.push(`vocabulary ${lang}: "${label}" is invisible to the ${side} list`);
    }
  }
  /* OVERLAP MERGING, both directions. One obligation spelled by two patterns is
   * ONE; two genuinely separate obligations are still TWO. Without the second
   * case the merge could silently collapse a real pair. */
  if (modalProfile("The controls are required to be used.", "en").strong !== 1) {
    bad.push('overlap: "are required to" + "required" is counted more than once');
  }
  if (modalProfile("It shall be monitored and corrective action shall be considered.", "en").strong !== 2) {
    bad.push("overlap: two separate `shall`s are not counted as two");
  }
  /* And the negative half: an accented word that is NOT a modal must stay
   * unseen, or the boundary was widened into a substring match. */
  for (const [lang, text] of [["es-419", "Los deberes del auditor están descritos."],
                              ["pt-BR",  "Os deveres do auditor estão descritos."]]) {
    if (modalProfile(text, lang).strong > 0) {
      bad.push(`vocabulary ${lang}: "deberes/deveres" is being counted as a modal`);
    }
  }
  return bad;
}
