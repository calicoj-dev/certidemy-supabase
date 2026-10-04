/**
 * modal-drift.mjs -- does a translated sentence state a REQUIREMENT where the English only hedged?
 *
 * Ruled PROMPT-117 s4. This is a REPORT, not a gate: PROMPT-111 s0 rules out new gates for wording
 * nuances, and the fix belongs in the translator's prompt. It exists because nothing else looks at this
 * -- `checkPins` reads a fixed glossary list and `gateModalFidelity` runs on the English only -- and
 * because the first measurement was wrong in a way only its members showed.
 *
 * ============ THE UNIT IS A SENTENCE, AND ONLY WHERE THE TWO ALIGN ============
 *
 * The first pass tested whole FIELDS and reported 20. A 60-word stem ending "how should this be judged?"
 * counts as hedged, and then any unrelated `deve` elsewhere in the translated stem matched. So:
 *
 *   - one sentence at a time, and only when the two texts split into the SAME number of sentences.
 *     An unalignable pair is COULD-NOT-ANSWER, reported separately, never counted clean.
 *   - A QUESTION IS NOT A MODAL CLAIM. "Como deve ser julgado?" is how Portuguese asks "how should this
 *     be judged?"; it imposes nothing. Interrogatives are excluded, which is what took the 9 stem
 *     findings to 0 and left the 11 real ones (ruled: the stem pattern is fine).
 *   - An English sentence carrying BOTH a hedge and a requirement is UNDECIDABLE here and is excluded.
 *     `has to be` belongs in that list and was missing: "a reviewer objects that consequence has to be
 *     monetised" is correctly `debe` in Spanish, and counting it was my error, not the translator's.
 *
 * ============ A QUOTATION IS NOT EXEMPT ============
 *
 * Inside a quotation the modal of the QUOTED STANDARD is kept -- which means a quoted `should` must stay
 * a hedge. Rendering 27002 5.9's "should be classified" as "debe clasificarse" inside quotation marks is
 * the worst form of this defect, not an excused one, so quoted spans are measured like any other.
 */

/** English hedges: the item claims nothing mandatory. */
const HEDGE = /\b(should|may|can|could|ought to)\b/i;
/** English requirement forms. A sentence with one of these AND a hedge is undecidable. */
const HARD_EN = /\b(shall|must|is required to|are required to|requires?|required|has to|have to|had to)\b/i;
/** target-language requirement forms. */
const HARD = {
  "es-419": /(\bdebe\b|\bdeben\b|\bdebera\b|\bdeberá\b|\bdeberan\b|\bdeberán\b|\btiene que\b|\btienen que\b|es obligatorio|est(a|á) obligad|\bha de\b|\bhan de\b)/i,
  "pt-BR": /(\bdeve\b|\bdevem\b|\bdevera\b|\bdeverá\b|\bdeverao\b|\bdeverão\b|\btem de\b|\bt(e|ê)m de\b|\btem que\b|(e|é) obrigat)/i,
};
/** target-language hedges. Their presence means the sentence did carry the hedge across. */
const HEDGED_TR = {
  "es-419": /(deber(i|í)a|deber(i|í)an|convendr(i|í)a|se recomienda|recomiend|\bpuede\b|\bpueden\b|podr(i|í)a|podr(i|í)an|\bcabe\b)/i,
  "pt-BR": /(conv(e|é)m|deveria|deveriam|recomenda-se|recomend|\bpode\b|\bpodem\b|poderia|poderiam)/i,
};

export const LANGS = Object.keys(HARD);

/** split on sentence enders. Kept deliberately blunt: the alignment check is what guards it. */
export function sentences(t) {
  return String(t || "").split(/(?<=[.;:!?])\s+/).map((x) => x.trim()).filter(Boolean);
}

/** a question asks; it does not impose. */
export function isQuestion(s) {
  return /\?\s*$/.test(String(s || "").trim());
}

/**
 * One field pair. Returns { findings, examined, undecidable, aligned }.
 * `aligned: false` means the sentence counts differed -- COULD NOT ANSWER, not clean.
 */
export function driftInField(enText, trText, lang, label = "") {
  const out = { findings: [], examined: 0, undecidable: 0, questions: 0, aligned: true };
  if (!HARD[lang]) throw new Error("modal-drift: no rules for language " + lang);
  const a = sentences(enText), b = sentences(trText);
  if (!a.length || !b.length) { out.aligned = false; return out; }
  if (a.length !== b.length) { out.aligned = false; return out; }
  for (let i = 0; i < a.length; i++) {
    if (!HEDGE.test(a[i])) continue;
    if (HARD_EN.test(a[i])) { out.undecidable++; continue; }
    if (isQuestion(a[i]) || isQuestion(b[i])) { out.questions++; continue; }
    out.examined++;
    if (HARD[lang].test(b[i]) && !HEDGED_TR[lang].test(b[i])) {
      out.findings.push({ field: label, lang, en: a[i], tr: b[i] });
    }
  }
  return out;
}

/**
 * A whole item pair: stem, explanation and each option by position.
 * `en` / `tr` are { question_text, explanation, options:[{id,text}] }.
 */
export function driftInItem(en, tr, lang) {
  const fields = [["stem", en.question_text, tr.question_text],
    ["explanation", en.explanation, tr.explanation],
    ...((en.options || []).map((o, i) => ["option " + (o.id || String.fromCharCode(97 + i)),
      o.text, ((tr.options || [])[i] || {}).text]))];
  const acc = { findings: [], examined: 0, undecidable: 0, questions: 0, unaligned: [] };
  for (const [label, a, b] of fields) {
    if (!a || !b) { acc.unaligned.push(label); continue; }
    const r = driftInField(a, b, lang, label);
    if (!r.aligned) { acc.unaligned.push(label); continue; }
    acc.findings.push(...r.findings);
    acc.examined += r.examined; acc.undecidable += r.undecidable; acc.questions += r.questions;
  }
  return acc;
}

/** the one place the rule is stated for the writer, so the brief and the measure cannot disagree. */
export const MODAL_BRIEF =
  "- modal-force: carry the English modal across at its OWN strength, never stronger.\n" +
  "    shall / must / is required to  ->  pt-BR 'deve', es-419 'debe'\n" +
  "    should / ought to             ->  pt-BR 'convem que', 'recomenda-se' or 'deveria';\n" +
  "                                      es-419 'se recomienda', 'conviene que' or 'deberia'\n" +
  "    may / can / could             ->  pt-BR 'pode', es-419 'puede'\n" +
  "  INSIDE A QUOTATION the modal of the quoted standard is KEPT, so a quoted 'should' stays a\n" +
  "  recommendation -- rendering it as 'deve'/'debe' misquotes the standard.\n" +
  "  A QUESTION is not a modal claim: 'how should this be judged?' -> 'como deve ser julgado?' is right.";

export function modalDriftControls() {
  const out = [];
  const ok = (what, cond, detail) => out.push({ what, pass: !!cond, detail: cond ? null : detail });
  const one = (en, tr, lang) => driftInField(en, tr, lang, "t");

  /* ---- the defect this exists for ---- */
  ok("pt-BR: should -> deve is a finding",
    one("The decision itself should be written down.",
      "A propria decisao deve ser registrada por escrito.", "pt-BR").findings.length === 1);
  ok("es-419: should -> debe is a finding",
    one("The store should carry a classification.",
      "El almacen debe llevar una clasificacion.", "es-419").findings.length === 1);
  ok("pt-BR: ought to -> devem is a finding",
    one("Role assignments ought to be checked.",
      "As atribuicoes de papeis devem ser verificadas.", "pt-BR").findings.length === 1);

  /* ---- and the shapes that must NOT be findings ---- */
  ok("pt-BR: should -> convem que is clean",
    one("The decision itself should be written down.",
      "Convem que a propria decisao seja registrada.", "pt-BR").findings.length === 0);
  ok("es-419: should -> deberia is clean",
    one("The store should carry a classification.",
      "El almacen deberia llevar una clasificacion.", "es-419").findings.length === 0);
  ok("a QUESTION with deve is clean (the ruled stem pattern)",
    one("How should this report be judged?", "Como esse relatorio deve ser julgado?", "pt-BR")
      .findings.length === 0);
  ok("...and the question is counted as a question, not as examined",
    one("How should this report be judged?", "Como esse relatorio deve ser julgado?", "pt-BR")
      .questions === 1);
  ok("shall -> deve is clean (a requirement stays a requirement)",
    one("The organization shall determine the scope.",
      "A organizacao deve determinar o escopo.", "pt-BR").findings.length === 0);
  ok("`has to be` with a hedge is UNDECIDABLE, not a finding",
    one("A reviewer objects that consequence has to be monetised before any level can be set.",
      "Un revisor objeta que la consecuencia debe monetizarse antes de fijar cualquier nivel.", "es-419")
      .undecidable === 1);
  ok("...and that sentence yields no finding",
    one("A reviewer objects that consequence has to be monetised before any level can be set.",
      "Un revisor objeta que la consecuencia debe monetizarse antes de fijar cualquier nivel.", "es-419")
      .findings.length === 0);

  /* ---- a quoted hedge is NOT exempt ---- */
  ok("a quoted should rendered as debe IS a finding",
    one('Clause 5.9 advises that "Each asset should be classified in accordance with the classification".',
      'La clausula 5.9 aconseja que "Cada activo debe clasificarse de acuerdo con la clasificacion".',
      "es-419").findings.length === 1);

  /* ---- alignment ---- */
  ok("a pair with different sentence counts is UNALIGNED, not clean",
    one("It should be done. And recorded.", "Deve ser feito e registrado.", "pt-BR").aligned === false);
  ok("an unaligned pair reports no findings either (it answered nothing)",
    one("It should be done. And recorded.", "Deve ser feito e registrado.", "pt-BR").findings.length === 0);

  /* ---- the whole-item path ---- */
  {
    const en = { question_text: "How should this be judged?", explanation: "Clause 5.9 advises review.",
      options: [{ id: "a", text: "The log should be kept." }, { id: "b", text: "Nothing applies." }] };
    const tr = { question_text: "Como deve ser julgado?", explanation: "A clausula 5.9 aconselha revisao.",
      options: [{ id: "a", text: "O registro deve ser mantido." }, { id: "b", text: "Nada se aplica." }] };
    const r = driftInItem(en, tr, "pt-BR");
    ok("driftInItem finds the option and not the question", r.findings.length === 1 &&
      r.findings[0].field === "option a", JSON.stringify(r.findings.map((x) => x.field)));
  }

  /* ---- an unknown language is an error, never a silent pass ---- */
  {
    let threw = false;
    try { driftInField("x should y", "z", "fr-FR", "t"); } catch { threw = true; }
    ok("an unknown language THROWS rather than reporting clean", threw);
  }

  const fails = out.filter((x) => !x.pass);
  return { examined: out.length, cases: out, fails: fails.map((x) => x.what + (x.detail ? ": " + x.detail : "")) };
}
