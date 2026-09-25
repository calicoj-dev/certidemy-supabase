/**
 * translation-checks.mjs -- checks A to D, declared once.
 *
 * Every one of these exists because a HUMAN found the defect in a passage the
 * mechanical checks had passed. Roughly two in five random passages carried
 * one, which is the reason no stratum can be cleared by sampling until these
 * run. Each check below names the passage that bought it.
 *
 * ONE IMPLEMENTATION. The accent classes were reimplemented badly the moment
 * they lived in only one script, so these live here and every caller imports.
 *
 * ============ ALIGNED BY SENTENCE, NOT BY BODY ============
 *
 * The existing modal check compares COUNTS across a whole body, which is why it
 * is a ranking and not a finding: a `should` in paragraph 2 and a `deve` in
 * paragraph 9 need not be the same sentence. A and B align first and only then
 * compare, which is what turns a ranking into a defect.
 */

/* ---------------------------------------------------------------- sentences */

/** Sentences, with markdown emphasis kept -- the bold marks sit INSIDE the
 *  defined terms we are checking and removing them would hide a crossing. */
export function sentences(md) {
  const out = [];
  for (const block of md.split(/\n\s*\n/)) {
    const t = block.trim();
    if (!t || /^```/.test(t) || /^::/.test(t)) continue;
    const body = t.replace(/^\s*>\s?/gm, "").replace(/^#{1,6}\s+/gm, "");
    for (const s of body.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑÂÊÔÃÕÇ¿¡"*])/)) {
      const c = s.trim();
      if (c.length >= 25) out.push(c);
    }
  }
  return out;
}

/** Align English sentences to translated ones by ORDER WITHIN A BLOCK-EQUAL
 *  body. Where the counts differ the alignment is refused for that body: a
 *  wrong pairing produces a confident wrong finding, which is worse than none.
 *  Returns null rather than guessing. */
export function alignSentences(en, tr) {
  const e = sentences(en), t = sentences(tr);
  if (!e.length || e.length !== t.length) return null;
  return e.map((s, i) => [s, t[i]]);
}

/* ============ BLOCKS, BECAUSE SENTENCE COUNTS LEGITIMATELY DIFFER =========
 *
 * Requiring equal sentence counts refused A and B on 300 of 917 rows -- a third
 * of the corpus unmeasured on the two checks that found the worst defects.
 * Translation splits and merges sentences; that is normal and is not a defect,
 * so an aligner that demands equality is measuring its own strictness.
 *
 * A BLOCK is small enough. Within one paragraph, a `should` in the English and
 * a `debe` in the translation are the same statement in every case that
 * matters, and the pairing needs no sentence correspondence at all.
 *
 * Rows whose BLOCK counts differ are the structure finding, which is a much
 * smaller set -- and those are refused, as they should be.
 */
export function blocksOf(md) {
  return md.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean)
    /* A ``` fence is code and has no prose to compare. A `::` DIRECTIVE is not:
     * `::concept title="..."` wraps teaching prose and `::checkpoint` wraps
     * question and explanation strings, and both carry the modals and defined
     * terms these checks exist for. Dropping the whole block refused A and B on
     * twelve of thirteen blocks in the batch-1 emit -- the filter refusing, not
     * the text. Only the directive HEADER line is removed. */
    .filter((t) => !/^```/.test(t))
    .map((t) => t.replace(/^::[^\n]*\n?/, "").replace(/^\s*>\s?/gm, "").replace(/^#{1,6}\s+/gm, ""))
    .filter((t) => t.trim().length > 0);
}

/** Paired blocks, or null when the two bodies are not the same shape. */
export function alignBlocks(en, tr) {
  const e = blocksOf(en), t = blocksOf(tr);
  if (!e.length || e.length !== t.length) return null;
  return e.map((b, i) => [b, t[i]]);
}

/** Sentence pairs where possible, block pairs otherwise. The unit is reported
 *  so a finding can say how tightly it was located. */
export function alignForComparison(en, tr) {
  const s = alignSentences(en, tr);
  if (s) return { unit: "sentence", pairs: s };
  const b = alignBlocks(en, tr);
  if (b) return { unit: "block", pairs: b };
  return null;
}

/* ---------------------------------------------------------------- A. modal */

/* Obligation forms. `exige` is here because #21 and #20 both used it to render
 * `should` and `asks` -- it is a stronger verb than either. */
/* BOUNDARIES ARE UNICODE-AWARE, BECAUSE `\b` IS NOT.
 *
 * JavaScript's `\b` is defined against [A-Za-z0-9_], so an accented letter is
 * not a word character and there is no boundary between a space and an accent.
 * `/\b(deve|<e-acute> obrigatorio)\b/` could never match its second alternative
 * in real prose, and `/(...|debera)\b/` with an accented final `a` could never
 * match its first.
 *
 * FOUR FORMS IN THIS FILE WERE DEAD: `debera`, `deverá`, `<e-acute> obrigatorio`
 * and `<e-acute> recomendavel` -- and `debera`/`deverá` are the FUTURE-form
 * obligations that ISO Spanish and Portuguese reach for most. Check A ran over
 * 917 rows unable to see any of them, and reported passes the whole time.
 *
 * Found by an audit written after the same defect surfaced in G3, where it was
 * visible only because the Spanish sibling worked: `es obligatorio` begins with
 * an ASCII letter and `<e-acute> obrigatorio` does not.
 *
 * Accented characters are written as escapes so no transport can renormalise
 * them -- a composed and a decomposed accent render identically and do not
 * match. */
const LW = "\p{L}\p{N}_";
const EDGE = (alts) => new RegExp("(?<![" + LW + "])(?:" + alts + ")(?![" + LW + "])", "iu");

/* Obligation forms. `exige` is here because #21 and #20 both used it to render
 * `should` and `asks` -- it is a stronger verb than either. */
const OBLIGATION = {
  "es-419": EDGE("debe|deben|deber\u00e1|deber\u00e1n|exige|exigen|es obligatorio|ha de|han de"),
  "pt-BR": EDGE("deve|devem|dever\u00e1|dever\u00e3o|exige|exigem|\u00e9 obrigat\u00f3rio"),
};
const WEAK = {
  "es-419": EDGE("deber\u00eda|deber\u00edan|convendr\u00eda|se recomienda|es recomendable|puede|pueden"),
  "pt-BR": EDGE("deveria|deveriam|conv\u00e9m que|recomenda-se|\u00e9 recomend\u00e1vel|pode|podem"),
};

/**
 * A. SENTENCE-LEVEL MODAL ALIGNMENT.
 *
 * Bought by #7 `04-06-use-and-third-party-controls` es -- "those limits SHOULD
 * be communicated" rendered "esos límites DEBEN comunicarse" -- and by #20
 * `aims-ia-03-04`, where 19011's "should be recorded" became "debe quedar
 * registrada" and "asks" became "exige".
 *
 * `guidance` decides severity, not detection. In a guidance standard a
 * recommendation rendered as an obligation is a defect; in our own prose it is
 * reported and not failed, because we are free to be firmer than ISO about our
 * own advice.
 */
export function checkModalSentences(en, tr, lang, { guidance = false } = {}) {
  const a = alignForComparison(en, tr);
  if (!a) return { unalignable: true, flags: [] };
  const { unit, pairs } = a;
  const flags = [];
  for (const [e, t] of pairs) {
    if (!/\bshould\b/i.test(e)) continue;
    if (/\b(shall|must|is required to|are required to)\b/i.test(e)) continue;
    if (WEAK[lang].test(t)) continue;
    if (!OBLIGATION[lang].test(t)) continue;
    flags.push({
      check: "modal-sentence",
      severity: guidance ? "defect" : "report",
      unit,
      detail: "should -> obligation (" + unit + "): " + t.slice(0, 80),
    });
  }
  return { unalignable: false, flags };
}

/* ------------------------------------------------------------- B. defined */

/**
 * B. DEFINED-TERM COLLAPSE.
 *
 * Declared, small, and grown only when a reading finds a new one -- the same
 * discipline as the accent classes, for the same reason.
 *
 *   #6  `03-04` es: "must be AVAILABLE to the extent NECESSARY" became
 *       "debe CONSERVARSE en la medida en que genere confianza". Available
 *       became retained, and necessary was dropped.
 *   #21 `aims-ia-02-01` es: "EXTENT of an audit programme" became "ALCANCE",
 *       which is SCOPE -- so the explanation then lists scope among the factors
 *       that determine scope.
 *   #38 `isms-ia-04-09` es: "effectiveness" became "efectividad". ISO's Spanish
 *       is "eficacia".
 */
export const DEFINED_TERMS = [
  { en: /\bavailable\b/i, name: "available",
    ok: { "es-419": /\bdisponible/i, "pt-BR": /\bdisponív/i },
    wrong: { "es-419": /\b(conserva|conservar|conservarse|retien|retener|manten)/i,
             "pt-BR": /\b(retid|retenç|conserva|mantid)/i },
    why: "available is a duty to furnish on request; retained is a duty to keep" },
  { en: /\bretained\b|\bretain\b/i, name: "retained",
    ok: { "es-419": /\b(conserva|reten)/i, "pt-BR": /\b(retid|conserva|mantid)/i },
    wrong: { "es-419": /\bdisponible/i, "pt-BR": /\bdisponív/i },
    why: "the same crossing in the other direction" },
  { en: /\bextent\b/i, name: "extent",
    ok: { "es-419": /\b(extensión|extension|medida|grado)/i, "pt-BR": /\b(extensão|extensao|medida|grau)/i },
    wrong: { "es-419": /\balcance\b/i, "pt-BR": /\bescopo\b/i },
    why: "extent rendered with the SCOPE term collapses two defined audit terms" },
  { en: /\beffectiveness\b/i, name: "effectiveness",
    ok: { "es-419": /\beficacia/i, "pt-BR": /\beficácia|\beficacia/i },
    wrong: { "es-419": /\befectividad/i, "pt-BR": /\befetividade/i },
    why: "ISO's Spanish and Portuguese for effectiveness is eficacia / eficácia" },
];

export function checkDefinedTerms(en, tr, lang) {
  const a = alignForComparison(en, tr);
  if (!a) return { unalignable: true, flags: [] };
  const { unit, pairs } = a;
  const flags = [];
  for (const [e, t] of pairs) {
    for (const term of DEFINED_TERMS) {
      if (!term.en.test(e)) continue;
      if (term.ok[lang].test(t)) continue;
      if (!term.wrong[lang].test(t)) continue;
      flags.push({ check: "defined-term", severity: "defect", unit,
        detail: term.name + " (" + unit + "): " + term.why + " -- " + t.slice(0, 70) });
    }
  }
  return { unalignable: false, flags };
}

/* ------------------------------------------------------------- C. register */

/* Second-person singular forms that only occur in the TU register. `usted`
 * takes third-person verb forms, so these are decisive without any English.
 * Bought by #37 `isms-ia-03-09` es: "tu registro, puedes, concluiste" beside
 * neighbouring lessons that use usted throughout. */
const TU_FORMS = /\b(puedes|tienes|debes|haces|quieres|sabes|eres|estás|tu registro|tus |contigo|concluiste|hiciste|verificaste|encontraste|revisaste|tomaste)\b/i;
const USTED_FORMS = /\b(puede usted|usted |su registro|sus registros|haga|verifique|revise|considere|observe|tome nota)\b/i;

/** Which register a body is written in, or null if it declares neither. */
export function registerOf(tr) {
  const tu = (tr.match(new RegExp(TU_FORMS, "gi")) || []).length;
  const usted = (tr.match(new RegExp(USTED_FORMS, "gi")) || []).length;
  if (!tu && !usted) return null;
  return tu > usted ? "tu" : "usted";
}

/**
 * C. REGISTER, RELATIVE TO THE CERTIFICATION.
 *
 * The first version flagged every `tu` form and fired on 203 of 917 rows. Read,
 * the members were ordinary teaching prose -- "No necesitas memorizar", and a
 * lesson TITLE reading "Las Palabras que Debes Dominar". **`tu` is the house
 * register for most of the catalogue**, and a guard that fires on the normal
 * case is deleted by the first person it inconveniences.
 *
 * Measured per certification, es-419 rows carrying tu forms:
 *
 *     AIE-I 88%   AIHR-I 61%   SM-AI-II 48%   SPO-AI-I 45%   AISM-I 41%
 *     SD-AI-I 41% SM-AI-I 29%  AIGRM-I 22%  |  ISMS-IA 16%  ISMS-F 12%
 *                                              AIMS-IA 5%   AIMS-F 3%
 *
 * The split is by AUDIENCE: the ISO certifications address the reader as
 * `usted`, the practitioner certifications as `tu`. Both are deliberate.
 *
 * So the finding is a row that disagrees with ITS OWN certification --
 * #37 `isms-ia-03-09` using `tu` inside an usted certification, which is 6 of
 * ISMS-IA's 38 Spanish rows. The dominant register is passed in, derived from
 * the population, never assumed.
 */
export function checkRegister(tr, lang, certRegister) {
  if (lang !== "es-419" || !certRegister) return { flags: [] };
  const mine = registerOf(tr);
  if (!mine || mine === certRegister) return { flags: [] };
  const tu = (tr.match(new RegExp(TU_FORMS, "gi")) || []).length;
  const usted = (tr.match(new RegExp(USTED_FORMS, "gi")) || []).length;
  return { flags: [{ check: "register", severity: "defect",
    detail: "reads as " + mine + " (" + tu + " tu / " + usted + " usted) in a " +
            certRegister + " certification" }] };
}

/* ------------------------------------------------------------- D. clause */

/**
 * D. CLAUSE-REFERENCE VOCABULARY. The house rules already exist:
 * es sub-clauses are `apartado`, pt sections are a flat `Seção`.
 * The sample carried "la cláusula 6.7", "la cláusula 5.1", "el capítulo 8.1"
 * in es and "satisfazem a cláusula" in pt.
 */
export function checkClauseVocab(tr, lang) {
  const flags = [];
  const add = (d) => flags.push({ check: "clause-vocab", severity: "report", detail: d });
  if (lang === "es-419") {
    for (const m of tr.matchAll(/\b(cláusula|clausula)\s+\d+(\.\d+)*/gi)) add("es uses `apartado`: " + m[0]);
    for (const m of tr.matchAll(/\b(capítulo|capitulo)\s+\d+(\.\d+)*/gi)) add("es uses `apartado`: " + m[0]);
  } else {
    for (const m of tr.matchAll(/\b(cláusula|clausula)\s*\d*(\.\d+)*/gi)) add("pt uses a flat `Seção`: " + m[0]);
  }
  return { flags };
}

/* ---------------------------------------------------------------- controls */

/**
 * Fixtures drawn from the passages a human read. Each MUST fire, and each
 * paired negative MUST NOT. A check tuned until it is quiet is a check that has
 * been deleted without anybody saying so.
 */
export function controls() {
  const wrong = [];
  const fire = (got, want, name) => { if (!!got !== want) wrong.push(name + (want ? " did not fire" : " false-fired")); };

  const enA = "The organization shall determine what is needed. Those limits should be communicated to every supplier.";
  const trA = "La organización debe determinar lo que se necesita. Esos límites deben comunicarse a cada proveedor.";
  const trAok = "La organización debe determinar lo que se necesita. Esos límites deberían comunicarse a cada proveedor.";
  fire(checkModalSentences(enA, trA, "es-419", { guidance: true }).flags.length, true, "A #7 should->deben");
  fire(checkModalSentences(enA, trAok, "es-419", { guidance: true }).flags.length, false, "A #7 corrected");

  const enB = "Documented information must be available to the extent necessary for confidence.";
  const trB = "La informacion documentada debe conservarse en la medida en que genere confianza.";
  const trBok = "La informacion documentada debe estar disponible en la medida necesaria para generar confianza.";
  fire(checkDefinedTerms(enB, trB, "es-419").flags.length, true, "B #6 available->conservarse");
  fire(checkDefinedTerms(enB, trBok, "es-419").flags.length, false, "B #6 corrected");

  const enB2 = "Several factors determine the extent of an audit programme across the year.";
  const trB2 = "Varios factores determinan el alcance de un programa de auditoria durante el ano.";
  const trB2ok = "Varios factores determinan la extension de un programa de auditoria durante el ano.";
  fire(checkDefinedTerms(enB2, trB2, "es-419").flags.length, true, "B #21 extent->alcance");
  fire(checkDefinedTerms(enB2, trB2ok, "es-419").flags.length, false, "B #21 corrected");

  const enB3 = "The audit evaluates the effectiveness of the management system over the period.";
  const trB3 = "La auditoria evalua la efectividad del sistema de gestion durante el periodo.";
  const trB3ok = "La auditoria evalua la eficacia del sistema de gestion durante el periodo.";
  fire(checkDefinedTerms(enB3, trB3, "es-419").flags.length, true, "B #38 effectiveness->efectividad");
  fire(checkDefinedTerms(enB3, trB3ok, "es-419").flags.length, false, "B #38 corrected");

  /* C is relative to the certification, so both directions and both contexts. */
  fire(checkRegister("Revisa tu registro y decide si puedes concluir.", "es-419", "usted").flags.length,
       true, "C #37 tu inside an usted certification");
  fire(checkRegister("Revisa tu registro y decide si puedes concluir.", "es-419", "tu").flags.length,
       false, "C tu inside a tu certification is the house style");
  fire(checkRegister("Revise su registro y decida si puede concluir usted.", "es-419", "tu").flags.length,
       true, "C usted inside a tu certification");
  fire(checkRegister("El sistema de gestion define los controles aplicables.", "es-419", "usted").flags.length,
       false, "C prose declaring neither register");

  fire(checkClauseVocab("Esto satisface la clausula 6.7 del documento.", "es-419").flags.length, true, "D es clausula");
  fire(checkClauseVocab("Esto satisface el apartado 6.7 del documento.", "es-419").flags.length, false, "D es apartado");
  fire(checkClauseVocab("Os registros satisfazem a clausula aplicavel.", "pt-BR").flags.length, true, "D pt clausula");
  fire(checkClauseVocab("Os registros satisfazem a Secao aplicavel.", "pt-BR").flags.length, false, "D pt secao");

  /* Alignment refuses rather than guesses. */
  const bad = alignSentences("One sentence here that is long enough to count.",
    "Una frase aqui que es suficientemente larga. Y otra frase adicional completamente.");
  fire(bad === null, true, "alignment refuses unequal sentence counts");

  return wrong;
}
