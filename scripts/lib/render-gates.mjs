/**
 * render-gates.mjs -- G1 to G7, the seven gaps a human read found in a batch
 * that had passed every gate we owned.
 *
 * Each gate names the rendering it was seen on. Each has a fixture built from
 * that rendering, and a paired negative. A gate that does not fire on its own
 * example is not a gate -- that is this repository's oldest rule about checks,
 * and these are written to satisfy it before they are trusted on anything else.
 *
 * ALL SEVEN ARE MECHANICAL. The defect they cannot reach is the meaning
 * inversion in 05-02 q2 -- "the own-work rule is the canonical way of failing
 * that and is sound practice" -- which is grammatical, well structured, uses no
 * banned term, and says the opposite of the lesson. That one is why the read
 * exists, and no gate here claims to cover it.
 */

/* ------------------------------------------------------------------ G1 */

/**
 * G1. STRUCTURE, LINE FOR LINE.
 *
 * Seen on: 02-06 b9 es dropped the closing `::`, which would have left a
 * concept block unclosed; 03-03 b13 pt ADDED a leading `> `, which renders our
 * own prose as a quotation of the standard.
 *
 * The existing structure check counts blocks across a whole body. This counts
 * MARKER LINES inside one block, which is where a replacement can break framing
 * without changing any block count at all.
 */
const markers = (t) => {
  const lines = t.split("\n");
  return {
    directive: lines.filter((l) => /^\s*::/.test(l)).length,
    fence: lines.filter((l) => /^\s*```/.test(l)).length,
    quote: lines.filter((l) => /^\s*>/.test(l)).length,
    list: lines.filter((l) => /^\s*(?:[-*+]|\d+[.)])\s/.test(l)).length,
  };
};
export function g1Structure(en, tr) {
  const e = markers(en), t = markers(tr), out = [];
  for (const k of ["directive", "fence", "quote", "list"]) {
    if (e[k] !== t[k]) out.push({ gate: "G1", detail: k + " lines en=" + e[k] + " tr=" + t[k] });
  }
  return out;
}

/* ------------------------------------------------------------------ G2 */

/**
 * G2. CARRIED ENGLISH IN A DIRECTIVE ATTRIBUTE.
 *
 * Seen on: 03-02 b2 es and 03-04 b2 es, both of which left
 * `title="Criteria first, then control"` untranslated. A directive attribute is
 * rendered to the learner and is invisible to every prose check, because no
 * prose check looks inside `::concept title="..."`.
 */
const titlesOf = (t) => [...t.matchAll(/^\s*::[a-z-]+[^\n]*?title="([^"]*)"/gim)].map((m) => m[1]);
export function g2CarriedTitle(en, tr) {
  const e = titlesOf(en), t = titlesOf(tr), out = [];
  for (let i = 0; i < Math.min(e.length, t.length); i++) {
    if (e[i].trim() && e[i].trim() === t[i].trim()) {
      out.push({ gate: "G2", detail: 'title="' + t[i].slice(0, 50) + '" is the English, untranslated' });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ G3 */

/**
 * G3. MODAL INSERTED WHERE THE ENGLISH HAS NONE.
 *
 * Seen on: 01-03 b21 q4 option c pt, "devem ser retomadas", where the English
 * option carries no modal at all. Check A looks for should->obligation, which
 * is one direction only: it cannot see an obligation arriving out of nowhere.
 * In a multiple-choice OPTION that is worse than a register slip, because a
 * modal makes one option read as the rule.
 */
const DEONTIC_EN = /\b(shall|must|should|is to be|are to be|is required|are required|has to|have to)\b/i;
const DEONTIC_TR = {
  "es-419": /\b(debe|deben|deberá|deberán|debería|deberían|tiene que|tienen que|es obligatorio)\b/i,
  "pt-BR": /\b(deve|devem|deverá|deverão|deveria|deveriam|tem que|têm que|é obrigatório|convém que)\b/i,
};
export function g3ModalInserted(en, tr, lang) {
  if (DEONTIC_EN.test(en)) return [];
  if (!DEONTIC_TR[lang].test(tr)) return [];
  const m = tr.match(DEONTIC_TR[lang]);
  return [{ gate: "G3", detail: "modal `" + m[0] + "` with none in the aligned English" }];
}

/* ------------------------------------------------------------------ G4 */

/**
 * G4. DEFINED TERMS IN BOTH DIRECTIONS, AND THE IDIOM.
 *
 * Seen on: 05-02 q4 es and pt rendered `scope` as extension; 03-04 b11 rendered
 * `to the extent necessary` as an extension rather than as the idiom; 02-06 pt
 * rendered `retained` as `mantidas`, which is maintained.
 *
 * AND OUR OWN PIN CAUSED ONE OF THESE. Check B taught "extent != scope" without
 * the idiom, and the model read the ban as an instruction to write `extension`
 * everywhere `extent` appeared -- including inside "to the extent necessary",
 * where Spanish and Portuguese both want "en la medida" / "na medida". A pin is
 * a prompt and prompts are imitated: the same finding as the ASCII register
 * note, in a different costume.
 */
export const G4_TERMS = [
  { name: "scope", en: /\bscope\b/i,
    ok: { "es-419": /\balcance/i, "pt-BR": /\bescopo/i },
    wrong: { "es-419": /\bextensi[oó]n/i, "pt-BR": /\bextens[aã]o/i },
    why: "scope is alcance / escopo; extension is the OTHER term" },
  { name: "extent (noun)", en: /\bextent\b/i, notEn: /\bto the extent\b/i,
    ok: { "es-419": /\bextensi[oó]n|\bgrado|\bmedida/i, "pt-BR": /\bextens[aã]o|\bgrau|\bmedida/i },
    wrong: { "es-419": /\balcance\b/i, "pt-BR": /\bescopo\b/i },
    why: "extent is not scope" },
  { name: "to the extent (idiom)", en: /\bto the extent\b/i,
    ok: { "es-419": /\ben la medida/i, "pt-BR": /\bna medida/i },
    wrong: { "es-419": /\bextensi[oó]n/i, "pt-BR": /\bextens[aã]o/i },
    why: "an idiom, not the noun: en la medida / na medida" },
  { name: "retained", en: /\bretain(ed|s)?\b/i,
    ok: { "es-419": /\b(conserva|reten)/i, "pt-BR": /\b(retid|reter|retenç|conserva)/i },
    wrong: { "es-419": /\bmanten/i, "pt-BR": /\bmantid|\bmanter/i },
    why: "retained is not maintained" },
  { name: "maintained", en: /\bmaintain(ed|s)?\b/i,
    ok: { "es-419": /\bmanten/i, "pt-BR": /\bmant/i },
    wrong: { "es-419": /\b(conserva|reten)/i, "pt-BR": /\b(retid|retenç)/i },
    why: "maintained is not retained" },
];
export function g4Terms(en, tr, lang) {
  const out = [];
  for (const t of G4_TERMS) {
    if (!t.en.test(en)) continue;
    if (t.notEn && t.notEn.test(en)) continue;
    if (t.ok[lang].test(tr)) continue;
    if (!t.wrong[lang].test(tr)) continue;
    out.push({ gate: "G4", detail: t.name + ": " + t.why });
  }
  return out;
}

/* ------------------------------------------------------------------ G5 */

/**
 * G5. THE CLAUSE WORD FOLLOWS THE LESSON.
 *
 * Seen on: 01-03 es put `cláusula 8` and `apartado 8.2` in one paragraph;
 * 02-06 pt wrote `Seção` in a lesson whose other blocks say `cláusula`.
 *
 * D stays report-only corpus-wide -- the ruling holds. But a REPLACEMENT is not
 * a corpus: it has to match the untouched blocks around it, or one paragraph
 * disagrees with the next in the same body.
 */
const CLAUSE_WORDS = {
  "es-419": [["apartado", /\bapartados?\b/gi], ["cláusula", /\bcl[aá]usulas?\b/gi], ["capítulo", /\bcap[ií]tulos?\b/gi]],
  "pt-BR": [["Seção", /\bse[cç][aã]o|\bse[cç][oõ]es\b/gi], ["cláusula", /\bcl[aá]usulas?\b/gi]],
};
/** The form the rest of the body uses, or null when there is no convention to
 *  follow.
 *
 *  A FLOOR, BECAUSE ONE OCCURRENCE IS NOT A CONVENTION. The first version took
 *  the winner at any count and declared `capitulo` the house word of 01-03 es
 *  on the strength of a single occurrence, against a single `clausula` -- then
 *  flagged the replacement twice for disagreeing with it. That is a guard
 *  inventing a rule out of noise and then enforcing it.
 *
 *  Three, and the winner must also lead the runner-up, or the lesson has no
 *  house word and G5 abstains. Abstaining is a RESULT here, not a pass. */
export const CLAUSE_WORD_FLOOR = 3;
export function lessonClauseWord(body, lang) {
  const counts = CLAUSE_WORDS[lang]
    .map(([name, re]) => [name, (body.match(re) || []).length])
    .sort((a, b) => b[1] - a[1]);
  const [name, n] = counts[0];
  const runnerUp = counts[1] ? counts[1][1] : 0;
  if (n < CLAUSE_WORD_FLOOR || n === runnerUp) return null;
  return name;
}
export function g5ClauseWord(tr, lang, houseWord) {
  if (!houseWord) return [];
  const out = [];
  for (const [name, re] of CLAUSE_WORDS[lang]) {
    if (name === houseWord) continue;
    const n = (tr.match(re) || []).length;
    if (n) out.push({ gate: "G5", detail: "uses `" + name + "` x" + n + "; this lesson uses `" + houseWord + "`" });
  }
  return out;
}

/* ------------------------------------------------------------------ G6 */

/**
 * G6. NO NEW ACRONYMS.
 *
 * Seen on: `SGia`, `SGIA` and `SGAI` -- three spellings of one invented
 * acronym, in a single batch, for a term the corpus renders as the English
 * `AIMS` (118 rows against 0). An invented acronym is unsearchable, teaches a
 * word the exam does not use, and reads as authoritative.
 */
export function g6NewAcronym(en, tr, existingTranslation) {
  const acro = (s) => new Set((s.match(/\b[\p{Lu}][\p{L}]{2,}\b/gu) || [])
    .filter((w) => (w.match(/\p{Lu}/gu) || []).length >= 2));
  const inEn = acro(en), inOld = acro(existingTranslation || "");
  const out = [];
  for (const w of acro(tr)) {
    if (inEn.has(w) || inOld.has(w)) continue;
    out.push({ gate: "G6", detail: "new acronym `" + w + "`, in neither the English nor the existing translation" });
  }
  return out;
}

/* ------------------------------------------------------------------ G7 */

/**
 * G7. PINNED TERMS.
 *
 * Seeded from this batch: 05-02 b16 pt wrote `padrão` for standard (which is
 * "pattern"); b28 wrote `supervisión` for a surveillance audit; 01-03 b21 pt
 * wrote `desvio` for drift and `fases` for stage.
 */
export const G7_PINS = [
  { en: /\bstandard\b/i, name: "standard",
    ok: { "es-419": /\bnorma/i, "pt-BR": /\bnorma/i },
    wrong: { "es-419": /\best[aá]ndar/i, "pt-BR": /\bpadr[aã]o/i } },
  { en: /\bsurveillance\b/i, name: "surveillance",
    ok: { "es-419": /\bvigilancia/i, "pt-BR": /\bvigil[aâ]ncia/i },
    wrong: { "es-419": /\bsupervisi[oó]n/i, "pt-BR": /\bsupervis[aã]o/i } },
  { en: /\bdrift\b/i, name: "drift",
    ok: { "es-419": /\bderiva/i, "pt-BR": /\bderiva/i },
    wrong: { "es-419": /\bdesv[ií]o/i, "pt-BR": /\bdesvio/i } },
  { en: /\bstages?\b/i, name: "stage",
    ok: { "es-419": /\betapas?/i, "pt-BR": /\betapas?/i },
    wrong: { "es-419": /\bfases?/i, "pt-BR": /\bfases?/i } },
  { en: /\bawareness\b/i, name: "awareness",
    ok: { "es-419": /\bconciencia/i, "pt-BR": /\bconscientiza[cç][aã]o/i },
    wrong: { "es-419": /\bconocimiento|\bsensibilizaci[oó]n/i, "pt-BR": /\bconhecimento|\bsensibiliza[cç][aã]o/i } },
];
export function g7Pins(en, tr, lang) {
  const out = [];
  for (const p of G7_PINS) {
    if (!p.en.test(en)) continue;
    if (p.ok[lang].test(tr)) continue;
    if (!p.wrong[lang].test(tr)) continue;
    out.push({ gate: "G7", detail: p.name + ": expected " + (lang === "es-419" ? p.ok["es-419"] : p.ok["pt-BR"]).source });
  }
  return out;
}

/* ------------------------------------------------------------- run them */

export function runRenderGates(en, tr, lang, opts = {}) {
  return [
    ...g1Structure(en, tr),
    ...g2CarriedTitle(en, tr),
    ...g3ModalInserted(en, tr, lang),
    ...g4Terms(en, tr, lang),
    ...g5ClauseWord(tr, lang, opts.houseClauseWord),
    ...g6NewAcronym(en, tr, opts.existingTranslation),
    ...g7Pins(en, tr, lang),
  ];
}

/* ---------------------------------------------------------- the controls */

/**
 * Every fixture is drawn from a rendering the read actually rejected, with its
 * correction as the paired negative. A gate that does not fire on its own
 * example is not a gate.
 */
export function renderGateControls() {
  const wrong = [];
  const fire = (got, want, name) => {
    if ((got.length > 0) !== want) wrong.push(name + (want ? " did not fire" : " false-fired"));
  };

  fire(g1Structure("::concept title=\"x\"\nBody text here.\n::", "::concept title=\"y\"\nTexto aqui."),
       true, "G1 02-06 dropped closing ::");
  fire(g1Structure("::concept title=\"x\"\nBody text here.\n::", "::concept title=\"y\"\nTexto aqui.\n::"),
       false, "G1 closing :: present");
  fire(g1Structure("Plain paragraph of our own prose.", "> Paragrafo traduzido."),
       true, "G1 03-03 added a blockquote marker");
  fire(g1Structure("Plain paragraph of our own prose.", "Paragrafo traduzido."),
       false, "G1 no marker added");

  fire(g2CarriedTitle('::concept title="Criteria first, then control"\nBody.',
                      '::concept title="Criteria first, then control"\nCuerpo.'),
       true, "G2 03-04 untranslated title");
  fire(g2CarriedTitle('::concept title="Criteria first, then control"\nBody.',
                      '::concept title="Primero los criterios, luego el control"\nCuerpo.'),
       false, "G2 title translated");

  fire(g3ModalInserted("Sessions are resumed after the incident is closed.",
                       "As sessoes devem ser retomadas apos o encerramento.", "pt-BR"),
       true, "G3 01-03 q4c inserted modal");
  fire(g3ModalInserted("Sessions are resumed after the incident is closed.",
                       "As sessoes sao retomadas apos o encerramento.", "pt-BR"),
       false, "G3 no modal inserted");
  fire(g3ModalInserted("Records shall be retained.", "Os registros devem ser retidos.", "pt-BR"),
       false, "G3 modal present in the English too");

  fire(g4Terms("The audit scope covers three sites.", "La extension de la auditoria cubre tres sitios.", "es-419"),
       true, "G4 05-02 q4 scope->extension");
  fire(g4Terms("The audit scope covers three sites.", "El alcance de la auditoria cubre tres sitios.", "es-419"),
       false, "G4 scope->alcance");
  fire(g4Terms("available to the extent necessary for confidence",
               "disponible en la extension necesaria para tener confianza", "es-419"),
       true, "G4 03-04 b11 idiom as a noun");
  fire(g4Terms("available to the extent necessary for confidence",
               "disponible en la medida necesaria para tener confianza", "es-419"),
       false, "G4 idiom rendered as an idiom");
  fire(g4Terms("documented information is retained", "as informacoes documentadas sao mantidas", "pt-BR"),
       true, "G4 02-06 retained->mantidas");
  fire(g4Terms("documented information is retained", "as informacoes documentadas sao retidas", "pt-BR"),
       false, "G4 retained->retidas");

  fire(g5ClauseWord("La clausula 8 y el apartado 8.2 lo exigen.", "es-419", "cláusula"),
       true, "G5 01-03 two clause words in one paragraph");
  fire(g5ClauseWord("La clausula 8 y la clausula 8.2 lo exigen.", "es-419", "cláusula"),
       false, "G5 one clause word, the lesson's");
  fire(g5ClauseWord("A Secao 8.4 acrescenta a metade operacional.", "pt-BR", "cláusula"),
       true, "G5 02-06 Secao in a clausula lesson");

  fire(g6NewAcronym("The AIMS covers three systems.", "El SGIA cubre tres sistemas.", "El AIMS existente."),
       true, "G6 invented SGIA");
  fire(g6NewAcronym("The AIMS covers three systems.", "El AIMS cubre tres sistemas.", "El AIMS existente."),
       false, "G6 acronym carried from the English");

  fire(g7Pins("The standard requires it.", "O padrao exige isso.", "pt-BR"),
       true, "G7 05-02 b16 standard->padrao");
  fire(g7Pins("The standard requires it.", "A norma exige isso.", "pt-BR"),
       false, "G7 standard->norma");
  fire(g7Pins("a surveillance audit", "una auditoria de supervision", "es-419"),
       true, "G7 surveillance->supervision");
  fire(g7Pins("model drift over three stages", "desvio do modelo em tres fases", "pt-BR"),
       true, "G7 01-03 drift->desvio and stage->fases");
  fire(g7Pins("model drift over three stages", "deriva do modelo em tres etapas", "pt-BR"),
       false, "G7 drift and stage pinned correctly");

  return wrong;
}
