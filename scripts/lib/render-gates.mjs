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
 *
 * ============ IT IS CONFOUNDED IN THE FRONTMATTER BLOCK ============
 *
 * Measured 2026-09-25 over the whole translated corpus: G1 fired on 10 rows, all
 * in BLOCK 0, and reading the members split them two ways.
 *
 *   4 rows (2 lessons x 2 languages)  REAL -- the translated `concept_slugs`
 *                                     list is short by one entry
 *   6 rows (3 lessons x 2 languages)  FALSE -- a multi-line YAML `preview:`
 *                                     value wraps differently between languages,
 *                                     and a wrapped line beginning with `-` is
 *                                     counted as a list marker
 *
 * YAML WRAPPING IS NOT MARKDOWN STRUCTURE. A `preview` that breaks across four
 * lines in English and three in Spanish is the same value, and a bullet-looking
 * continuation line inside it is not a bullet. So a G1 hit in block 0 is a
 * CANDIDATE and has to be read; only outside block 0 is it structural.
 *
 * Not narrowed to skip block 0, deliberately: the 4 real rows are in there, and
 * a real metadata divergence a partner can see is worth six candidates that need
 * reading. Stated instead, because a count nobody has read is the defect this
 * repository records most often.
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
/* THE TWO SIDES MUST RECOGNISE THE SAME CLASS OF OBLIGATION, and the first
 * version did not. `es obligatorio` was deontic in Spanish while `is mandatory`
 * was not deontic in English, so a faithful rendering of
 *
 *   "Continuous learning is mandatory for systems within an AIMS scope"
 *
 * as "El aprendizaje continuo es obligatorio ..." fired G3 against text that is
 * already serving and is correct. One property, two implementations, and the
 * disagreement is the finding -- CLAUDE.md records three of four such
 * disagreements as gaps in the guard rather than defects in the content, and
 * this is a fourth. The ADJECTIVAL obligation forms are listed on both sides,
 * and a fixture asserts the pairing rather than trusting the eye. */
/* AND `\b` IS ASCII-ONLY, WHICH MADE ONE ALTERNATIVE DEAD CODE.
 *
 * JavaScript's `\b` is defined against [A-Za-z0-9_]. An accented letter is not a
 * word character, so in `/\b(deve|<e-acute> obrigatorio)\b/` the second
 * alternative can NEVER match after a space -- there is no word boundary between
 * two non-word characters. Measured:
 *
 *     /\b(deve|<e-acute> obrigatorio)\b/.test("x <e-acute> obrigatorio y")  ->  false
 *     ... .test("x<e-acute> obrigatorio y")                                 ->  true
 *
 * So G3 could never have caught an inserted `<e-acute> obrigatorio` in
 * Portuguese, and the Spanish sibling worked only because `es obligatorio`
 * begins with an ASCII letter. The same guard, two languages, opposite
 * behaviour -- and the disagreement is what surfaced it.
 *
 * EDGE() is Unicode-aware and is used wherever a pattern can begin or end with a
 * non-ASCII letter. Boundaries here are explicit lookarounds, never `\b`. */
const L = "\p{L}\p{N}_";
const EDGE = (alts) => new RegExp("(?<![" + L + "])(?:" + alts + ")(?![" + L + "])", "iu");

const DEONTIC_EN = EDGE("shall|must|should|is to be|are to be|is required|are required" +
  "|has to|have to|is mandatory|are mandatory|is obligatory|are obligatory" +
  "|is compulsory|are compulsory");
const DEONTIC_TR = {
  "es-419": EDGE("debe|deben|deberá|deberán|debería|deberían"
    + "|tiene que|tienen que|es obligatorio|es obligatoria"),
  "pt-BR": EDGE("deve|devem|deverá|deverão|deveria|deveriam"
    + "|tem que|têm que|é obrigatório|é obrigatória|convém que"),
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

/* ============ THE HOUSE WORD DEPENDS ON THE LEVEL, IN SPANISH ============
 *
 * The Spanish national convention is `capitulo` for a whole-number clause and
 * `apartado` for a dotted subclause. One house word per lesson would apply a
 * whole-number form to "8.1", which is wrong, and would call a lesson
 * inconsistent for doing the right thing.
 *
 * MEASURED over the eight lessons in this batch, and it splits cleanly in
 * Spanish and NOT AT ALL in Portuguese:
 *
 *   isms-ia-04-02 es   whole capitulo=8      dotted apartado=35     <- textbook
 *   03-01 es           whole capitulo=2      dotted apartado=12
 *   03-03 es           whole capitulo=9      dotted apartado=10
 *   isms-ia-04-02 pt   whole secao=8         dotted secao=34        <- no split
 *   03-03 pt           whole secao=9         dotted secao=13
 *
 * So the key is (language, level), and Portuguese simply resolves to the same
 * word at both. Counting the two levels together is what made `03-04 es` look
 * like a capitulo lesson: its dotted references really are capitulo 17 to
 * apartado 9, which is a genuine internal inconsistency rather than a level
 * effect, and it only becomes visible once the levels are separated.
 */
const REF = /\b(apartados?|cl[aá]usulas?|cap[ií]tulos?|se[cç][aã]o|se[cç][oõ]es)\s+(\d+(?:\.\d+)*)/gi;
/** Normalise a matched clause word to its canonical form. Plural stripping by
 *  suffix turned `secoes` into `sec`, which split the count of the very word it
 *  was meant to canonicalise -- so the mapping is explicit, not derived. */
function canonWord(raw) {
  const w = raw.toLowerCase();
  if (/^apartado/.test(w)) return "apartado";
  if (/^cl[aá]usula/.test(w)) return "cláusula";
  if (/^cap[ií]tulo/.test(w)) return "capítulo";
  if (/^se[cç]/.test(w)) return "Seção";
  return w;
}
export const refLevel = (num) => (num.includes(".") ? "dotted" : "whole");

/** Counts per (level, word) for a body, in DISTINCT REFERENCES.
 *
 *  THE UNIT IS THE REFERENCE, NOT THE OCCURRENCE, and counting occurrences got
 *  this wrong in a way that would have written the wrong word. `03-04` es reads
 *
 *      capitulo 8.1   17 occurrences   ->  ONE distinct reference
 *      apartado 6.1, 6.3, 9.1, 10.2     ->  FOUR distinct references
 *
 *  so by occurrence `capitulo` wins 17 to 9 and by reference `apartado` wins
 *  4 to 1. The second is the convention; the first is one repeated phrase --
 *  8.1 is the lesson's subject, named in nearly every paragraph -- outvoting
 *  every other reference in the body.
 *
 *  Same family as every other denominator error here: the number was real and
 *  measured the wrong population. */
export function clauseWordCounts(body) {
  const seen = { whole: {}, dotted: {} };
  for (const m of body.matchAll(REF)) {
    const lvl = refLevel(m[2]);
    const w = canonWord(m[1]);
    /* The bare number, so `8.1]{glossary=...}` and `8.1` are one reference. */
    const num = m[2].replace(/[^\d.]+$/, "");
    (seen[lvl][w] = seen[lvl][w] || new Set()).add(num);
  }
  const out = { whole: {}, dotted: {} };
  for (const lvl of ["whole", "dotted"]) {
    for (const [w, set] of Object.entries(seen[lvl])) out[lvl][w] = set.size;
  }
  return out;
}
/** The house word for one LEVEL, or null when there is no convention to follow.
 *
 *  A FLOOR, BECAUSE ONE OCCURRENCE IS NOT A CONVENTION. The first version took
 *  the winner at any count and declared `capitulo` the house form of 01-03 es
 *  on a single occurrence against a single `clausula` -- then flagged the
 *  replacement twice for disagreeing with it. That is a guard inventing a rule
 *  out of noise and enforcing it.
 *
 *  Three, and a clear lead, PER LEVEL. Abstaining is a result. */
export const CLAUSE_WORD_FLOOR = 3;
/** The house clause word for one level, or null when the evidence is too thin.
 *
 *  TWO WAYS TO HOLD, and the second is the floor being LOWERED on purpose:
 *
 *    (a) at least CLAUSE_WORD_FLOOR distinct references, with a clear lead;
 *    (b) at least 2 distinct references and ZERO for every other form.
 *
 *  The floor exists to stop noise outvoting noise. It should not overrule a
 *  lesson that has never once used another word. `isms-ia-04-02` reads
 *  `capitulo` twice at whole level and nothing else, ever -- unanimous, and the
 *  three-reference floor was calling that no evidence. Unanimous-but-thin is a
 *  state the floor alone cannot distinguish from silence, so it is named. */
const UNANIMOUS_MIN = 2;
export function lessonClauseWord(body, lang, level) {
  const counts = clauseWordCounts(body)[level] || {};
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return null;
  const [name, n] = ranked[0];
  const runnerUp = ranked[1] ? ranked[1][1] : 0;
  if (runnerUp === 0 && n >= UNANIMOUS_MIN) return name;
  if (n < CLAUSE_WORD_FLOOR || n === runnerUp) return null;
  return name;
}

/**
 * G5, PER LEVEL. Each clause reference in the replacement is checked against the
 * house word for ITS OWN level, so a dotted `8.1` is judged against the lesson's
 * dotted convention and a whole `8` against its whole one.
 *
 * KNOWN GAP, NOT CLOSED: AN UNNUMBERED REFERENCE IS INVISIBLE HERE.
 *
 * `REF` requires a number, so "the same clause, items e) to g)" and "the clause
 * also says how" carry no digits and are never examined. They still HAVE a
 * level -- an unnumbered reference takes the level of whatever it points to, so
 * "the same clause" after a 5.2 is a DOTTED reference and must follow the dotted
 * convention -- and nothing here can resolve that pointer.
 *
 * It matters: three of the strings in batch 1 carry one, and each had to be
 * decided by a human reading what the sentence pointed at. Stated rather than
 * left as silence, because a gate that examines 2 of 3 references in a paragraph
 * and reports clean is claiming more than it checked.
 */
export function g5ClauseWord(tr, lang, house) {
  if (!house) return [];
  const out = [];
  for (const m of tr.matchAll(REF)) {
    const lvl = refLevel(m[2]);
    const want = house[lvl];
    if (!want) continue;
    const got = canonWord(m[1]);
    if (got === want) continue;
    out.push({ gate: "G5", detail: got + " " + m[2] + " is a " + lvl +
      " reference; this lesson uses `" + want + "` for those" });
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
  /* THE ADJECTIVAL OBLIGATION, BOTH SIDES. Verbatim from 01-03 q1 option c,
   * which was already serving and which G3 wrongly flagged. */
  fire(g3ModalInserted("Continuous learning is mandatory for systems within an AIMS scope",
                       "El aprendizaje continuo es obligatorio para los sistemas dentro del alcance de un SGIA",
                       "es-419"),
       false, "G3 `is mandatory` is deontic in English too");
  fire(g3ModalInserted("Continuous learning happens for systems within an AIMS scope",
                       "El aprendizaje continuo es obligatorio para los sistemas dentro del alcance de un SGIA",
                       "es-419"),
       true, "G3 adjectival obligation inserted where the English has none");
  /* SYMMETRY, asserted rather than eyeballed: every adjectival obligation the
   * translated side recognises has an English counterpart that is recognised.
   * The pairing is what broke; a list can drift on one side silently. */
  /* THE ACCENTED FORMS ARE BUILT FROM ESCAPES, NEVER TYPED. The first version of
   * this fixture typed `e`-acute directly and FAILED -- the literal reached the
   * file NFD-decomposed (U+0065 U+0301) while the regex above holds it composed
   * (U+00E9), so two strings that render identically did not match. That is this
   * repository's transport rule arriving through a text editor rather than
   * through a shell, and it is why the fixture exists at all. */
  for (const [lang, pair] of [["es-419", ["es obligatorio", "is mandatory"]],
                              ["pt-BR", ["é obrigatório", "is mandatory"]]]) {
    const [tw, ew] = pair;
    if (!DEONTIC_TR[lang].test("x " + tw + " y")) wrong.push("G3 symmetry: " + lang + " does not know `" + tw + "`");
    if (!DEONTIC_EN.test("x " + ew + " y")) wrong.push("G3 symmetry: English does not know `" + ew + "`");
  }

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

  /* G5 is now per LEVEL. A dotted reference is judged against the dotted
   * convention, which is what makes `capitulo 8` beside `apartado 8.1` correct
   * rather than inconsistent -- the Spanish national convention, confirmed by
   * measurement on isms-ia-04-02 es (whole capitulo=8, dotted apartado=35). */
  const UNE = { whole: "capítulo", dotted: "apartado" };
  fire(g5ClauseWord("El capitulo 8 y el apartado 8.1 lo exigen.", "es-419", UNE),
       false, "G5 UNE: capitulo for whole, apartado for dotted");
  fire(g5ClauseWord("El apartado 8 lo exige.", "es-419", UNE),
       true, "G5 apartado used for a WHOLE-number reference");
  fire(g5ClauseWord("El capitulo 8.1 lo exige.", "es-419", UNE),
       true, "G5 capitulo used for a DOTTED reference");
  fire(g5ClauseWord("La clausula 8.4 lo exige.", "es-419", UNE),
       true, "G5 02-06 clausula where the lesson uses apartado");
  fire(g5ClauseWord("A clausula 8.4 acrescenta a metade operacional.", "pt-BR",
                    { whole: "Seção", dotted: "Seção" }),
       true, "G5 02-06 pt clausula in a Secao lesson");
  fire(g5ClauseWord("A Secao 8.4 acrescenta a metade operacional.", "pt-BR",
                    { whole: "Seção", dotted: "Seção" }),
       false, "G5 pt Secao at both levels");
  fire(g5ClauseWord("La clausula 8 lo exige.", "es-419", { whole: null, dotted: "apartado" }),
       false, "G5 abstains at a level with no convention");

  /* THE UNANIMITY ESCAPE, both directions. Two distinct references and nothing
   * else ever is a convention; two against one is noise. Built as bodies so the
   * counting unit -- the distinct reference -- is exercised too, not just the
   * threshold. */
  {
    const unanimous = "Vease el capitulo 5. Y tambien el capitulo 9 para el resto.";
    const contested = "Vease el capitulo 5. Y el capitulo 9. Pero la clausula 7 dice otra cosa.";
    const repeated = "El capitulo 5 manda. El capitulo 5 otra vez. El capitulo 5 de nuevo.";
    if (lessonClauseWord(unanimous, "es-419", "whole") !== "capítulo") {
      wrong.push("G5 unanimity: 2 distinct refs and zero others should hold");
    }
    if (lessonClauseWord(contested, "es-419", "whole") !== null) {
      wrong.push("G5 unanimity: 2 against 1 should abstain, not hold");
    }
    /* And the unit stays the DISTINCT REFERENCE: one reference named three
     * times is still one, so it must not clear the floor of three. */
    if (lessonClauseWord(repeated, "es-419", "whole") !== null) {
      wrong.push("G5 unit: one reference repeated three times must not clear the floor");
    }
  }

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
