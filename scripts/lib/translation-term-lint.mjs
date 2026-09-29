/**
 * translation-term-lint.mjs -- the house glossary as a pure function, so the runner and the
 * pipeline gate share one implementation.
 *
 * ============ WHY THIS IS A LIB AND NOT THE RUNNER ============
 *
 * `lint-translation-terms.mjs` reads the whole corpus, writes two files and exits. Importing
 * `lintRow` from it -- which is what the first wiring of the pipeline gate did -- would run all of
 * that as a side effect of a single row check: 18,453 rows read and TRANSLATION-LINT.md overwritten
 * every time one item is retranslated. A gate must be cheap and must write nothing.
 *
 * The glossary is DATA (`translation-glossary.json`) and this is the only code that reads it, so the
 * lint, the gate and the bulk pass cannot drift apart.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const GLOSSARY = JSON.parse(readFileSync(join(HERE, "translation-glossary.json"), "utf8"));
const LANG_KEY = { "es-419": "es", "pt-BR": "pt" };

/* A term is matched on a WORD BOUNDARY that is not a hyphen, so `AIMS-F` does not match `AIMS` and
 * `risco elevado` matches as a phrase. Accents are preserved: the corpus is accent-sensitive and a
 * search that strips them would match the wrong word. Built as a RegExp from the glossary string
 * rather than typed, so no escape crosses a shell. */
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const termRe = (s, caseSensitive = false) =>
  new RegExp("(?<![\\w\\-áéíóúâêôãõçüñ])" + esc(s) + "(?![\\w\\-áéíóúâêôãõçüñ])",
    caseSensitive ? "g" : "gi");

/* ============ A MIS-CASING IS MATCHED CASE-SENSITIVELY, AND THE CONTROL CAUGHT THIS ============
 *
 * Most forbidden variants are DIFFERENT WORDS -- `fornecedor` against `prestador` -- where
 * case-insensitive matching is what you want. `SGia` is not a different word: it is the correct term in
 * the wrong case, so a case-insensitive match fires on the CORRECT `SGIA` and reports every clean row
 * as a defect. The synthetic control `El examen AIMS-F cubre el SGIA.` failed on exactly that, which is
 * the control doing its whole job before the corpus was ever read.
 *
 * Derived rather than declared: a variant that differs from the house form only by case is matched
 * case-sensitively. Nothing in the glossary has to remember to say so, which is the point -- a flag
 * somebody has to set is a flag somebody will forget. */
const isMiscasing = (variant, house) =>
  Boolean(house) && variant.toLowerCase() === String(house).toLowerCase() && variant !== house;

/* Does this row, or its English sibling, name the Regulation? The markers are declared in the glossary
 * rather than typed here, so one list serves the lint, the gate and the bulk pass. The English sibling
 * counts because a translated row may name the Act only in the source it was translated from. */
/* ============ A MARKER IS BOUNDED ON BOTH SIDES, AND THE FIRST VERSION WAS NOT ============
 *
 * The first version anchored only the LEFT: `(?<![\w])AI Act`. So the marker `AI Act` matched inside
 * **"documented AI activities"** -- `AI act` + `ivities` -- and gated an ISO/IEC 42001 internal-auditor row
 * that mentions the Regulation nowhere. Measured on that row: the English sibling contains no `EU AI Act`,
 * no `Regulation (EU)`, no `2024/1689`.
 *
 * The consequence was the worst available one, because the row's `fornecedor` IS the ordinary commercial
 * sense -- *um fornecedor terceiro identificado pelo nome* -- so a bulk substitution scoped by this gate
 * would have rewritten a correct vendor noun into the Regulation's role term. The scope rule exists to
 * prevent exactly that and a missing boundary inverted it.
 *
 * Same family as the `\b` defects this repository already records, with the direction reversed: those were
 * boundaries that could never match, this is a boundary that was never asked for. `termRe` above has had
 * both sides since it was written; this helper was written later and only copied half of it. */
const REG_MARKERS = ((GLOSSARY.families.eu_ai_act || {}).regulation_scope || {}).markers || [];
const markerRe = (mk) => new RegExp(
  "(?<![\\w\\-áéíóúâêôãõçüñ])" + esc(mk) + "(?![\\w\\-áéíóúâêôãõçüñ])", "i");
const regulationMarked = (whole, en) => {
  const hay = String(whole || "") + " " +
    (en ? [en.question_text, ...(Array.isArray(en.options) ? en.options.map((o) => (o && o.text) || "") : []),
      en.explanation].join(" ") : "");
  return REG_MARKERS.some((mk) => markerRe(mk).test(hay));
};

/** Every (family, term) pair that applies to a certification, for one language key. */
function applicable(code) {
  const out = [];
  for (const [fname, fam] of Object.entries(GLOSSARY.families)) {
    const scope = fam.scope;
    if (scope !== "*" && !(Array.isArray(scope) && scope.includes(code))) continue;
    for (const t of fam.terms || []) out.push({ family: fname, ...t });
  }
  return out;
}

const fieldsOf = (r) => {
  const out = [["question_text", String(r.question_text || "")]];
  for (const o of Array.isArray(r.options) ? r.options : []) {
    out.push(["option:" + (o && o.id), String((o && o.text) || "")]);
  }
  out.push(["explanation", String(r.explanation || "")]);
  return out.filter(([, v]) => v.trim());
};

/**
 * Lint one row. `en` may be null, in which case the relative modal rule abstains.
 * Returns { forbidden[], mixed[], untranslated[], unchecked[] }.
 */
export function lintRow(row, code, en) {
  const lk = LANG_KEY[row.language];
  const res = { forbidden: [], mixed: [], untranslated: [], unchecked: [] };
  if (!lk) return res;
  const fields = fieldsOf(row);
  const whole = fields.map(([, v]) => v).join("\n");

  for (const t of applicable(code)) {
    /* ============ OVERLAPPING VARIANTS ARE COUNTED ONCE, LONGEST FIRST ============
     *
     * `AI Act` and `EU AI Act` are both forbidden variants of the same term, and every occurrence of
     * the second CONTAINS the first. Counting each variant independently reported both: 188 `AI Act`
     * and 164 `EU AI Act` against 188 distinct occurrences, so **164 were counted twice** and only 24
     * standalone `AI Act` exist.
     *
     * Found by `pin-glossary-autofix`'s census gate, which substitutes longest-first and therefore
     * consumes each occurrence once: it reported 485 where the lint said 649, and the difference was
     * exactly 164. A number nobody could reconcile is the point of making the two agree before a bulk
     * write -- the disagreement WAS the finding, and the writer was the correct half.
     *
     * Longest variant first, and each matched span is masked so a shorter variant cannot claim it. */
    const forb = ((t.forbidden && t.forbidden[lk]) || []).slice().sort((a, b) => b.length - a.length);
    const claimed = new Map();   /* field -> array of [start, end) already counted for THIS term */
    for (const bad of forb) {
      const cs = isMiscasing(bad, t[lk]);
      for (const [field, text] of fields) {
        if (!claimed.has(field)) claimed.set(field, []);
        const taken = claimed.get(field);
        const hits = [...text.matchAll(termRe(bad, cs))]
          .filter((h) => !taken.some(([s, e]) => h.index < e && h.index + h[0].length > s));
        hits.forEach((h) => taken.push([h.index, h.index + h[0].length]));
        if (hits.length) {
          /* ============ THE CLASS FOLLOWS THE DECLARED SEVERITY ============
           *
           * Being on a forbidden list and being a GATE FAILURE are two different facts, and the first
           * version collapsed them: `alto risco` and `padrão` are declared `flag` -- ordinary
           * Portuguese that reads correctly -- and were reported as FORBIDDEN, which is the class the
           * pipeline gate blocks on. That would have refused new rows over a house preference and
           * over a word that legitimately means `pattern`.
           *
           * A forbidden-list hit whose term is `flag` is reported as a flag, with its variant, so
           * nothing is hidden and nothing is blocked that should not be. */
          const rec = { family: t.family, key: t.key, field, variant: bad, n: hits.length,
            severity: t.severity, expected: t[lk] || null,
            autofix: (t.autofix && t.autofix[lk]) === true };
          /* ============ A REGULATION TERM IS A FAILURE ONLY IN A ROW ABOUT THE REGULATION ============
           *
           * 42001 and 22989 carry their own role vocabulary, and a 42001 role question is not wrong for
           * using it. Gating the EU AI Act's terms across the catalogue would refuse correct work on the
           * two certifications whose subject is a different standard -- the scope error this repository
           * paid for when a Scrum word list refused two ISO/IEC 42001 items.
           *
           * So a `regulation_scoped` term downgrades to a flag unless the row, or its English sibling,
           * names the Regulation. And `not_gated_in` removes it entirely for a certification where the
           * house form cannot be asserted at all -- `provedor` in AIMS-F and AIMS-IA, where the ABNT
           * edition may use it for the 22989 role and we do not hold that edition. */
          const notGated = Array.isArray(t.not_gated_in) && t.not_gated_in.includes(code);
          const aboutReg = t.regulation_scoped ? regulationMarked(whole, en) : true;
          if (notGated) {
            res.mixed.push({ ...rec, severity: "flag",
              note: "not gated in " + code + ": the house form cannot be asserted there yet" });
          } else if (t.severity === "failure" && aboutReg) {
            res.forbidden.push(rec);
          } else if (t.severity === "failure") {
            res.mixed.push({ ...rec, severity: "flag",
              note: "a Regulation term in a row that is not about the Regulation -- flag, not a failure" });
          } else {
            res.mixed.push({ ...rec, note: "on the forbidden list, but declared severity `flag`" });
          }
        }
      }
    }
    /* ============ UNTRANSLATED, AND THE TERM MAY OPT OUT ============
     *
     * `untranslated_check: false` exists because the English word is sometimes the ITEM'S SUBJECT.
     * `as declaracoes 'should' da ISO 19011 ... mais fracas do que 'shall'` is an item about the two
     * modals: the English words must stay, and translating them would destroy the question. Left on,
     * this rule reported 156 such rows as defects -- the same shape as a refusal detector firing on
     * `as an AI` in an AI catalogue, where the phrase is the curriculum. */
    if (t.untranslated_check !== false && t.en && t[lk] &&
        t.en.toLowerCase() !== String(t[lk]).toLowerCase()) {
      const already = ((t.forbidden && t.forbidden[lk]) || []).some((b) => b.toLowerCase() === t.en.toLowerCase());
      if (!already) {
        for (const [field, text] of fields) {
          if (termRe(t.en).test(text)) {
            res.untranslated.push({ family: t.family, key: t.key, field, english: t.en, expected: t[lk] });
          }
        }
      }
    }
    /* MIXED: two or more declared variants of one term in the same row. */
    const variants = (t.variants && t.variants[lk]) || null;
    if (variants) {
      const seen = variants.filter((v) => termRe(v).test(whole));
      if (seen.length > 1) {
        res.mixed.push({ family: t.family, key: t.key, variants: seen, house: t[lk] || null });
      }
    }
  }

  /* THE RELATIVE MODAL RULE. pt-BR only, ISO certifications only, and it needs the English. */
  const isoPt = lk === "pt" && (GLOSSARY.families.iso_vocabulary_pt.scope || []).includes(code);
  if (isoPt) {
    const hasDeveria = /(?<![\w])deveria(m)?(?![\w])/i.test(whole);
    if (hasDeveria) {
      if (!en) {
        res.unchecked.push({ family: "iso_vocabulary_pt", key: "should",
          why: "row carries `deveria` and has no English sibling, so the rule cannot run" });
      } else {
        const enWhole = fieldsOf(en).map(([, v]) => v).join("\n");
        if (/(?<![\w])should(?![\w])/i.test(enWhole)) {
          res.mixed.push({ family: "iso_vocabulary_pt", key: "should",
            variants: ["deveria"], house: "convém que",
            note: "the English sentence carries `should`; ABNT renders it `convém que`" });
        }
      }
    }
  }

  /* ============ DOUBLED WORD, A FLAG AND NEVER A FAILURE ============
   *
   * Ruled PROMPT-89 s3, after three genuine duplications were found in the served bank:
   * "pratica pratica repetida" and two "padrao padrao". They are translation artifacts -- in one case
   * English "standard ... pattern" rendered both words as `padrao`.
   *
   * A FLAG, because legitimate homographs are common and five turned up in one sweep: "la muestra
   * muestra que" (the sample shows), "e nao nao conformidades" (and NOT nonconformities), "cada una una
   * no conformidad" (each one, one nonconformity), "la pregunta pregunta que" (the question asks). The
   * last was listed as a defect in the ruling itself until it was read in full, which is the argument
   * against ever making this a failure.
   *
   * UNICODE BOUNDARIES, not `\b`. `\b` is ASCII-only, so "excluidos dos" with an accented i reads as a
   * doubled `dos`: the accent is a non-word character and the first word's tail becomes a word. Eight of
   * fourteen served hits were that defect. In a lint about Spanish and Portuguese, an ASCII word
   * boundary is not a word boundary. */
  for (const [field, value] of fields) {
    const re = /(?<![\p{L}\p{M}])(\p{L}{3,})\s+\1(?![\p{L}\p{M}])/giu;
    for (let m = re.exec(String(value || "")); m; m = re.exec(String(value || ""))) {
      res.mixed.push({ family: "text_quality", key: "doubled-word", severity: "flag",
        field, variants: [m[0]], house: m[1],
        note: "the same word twice. A FLAG: legitimate homograph pairs exist -- 'la muestra muestra " +
          "que', 'e nao nao conformidades', 'la pregunta pregunta que' -- so a human decides." });
      if (re.lastIndex <= m.index) break;   /* a zero-width advance would loop forever */
    }
  }
  return res;
}

/* ---------------------------------------------------------------- controls */
export function translationLintControls() {
  const fails = [];
  const row = (language, stem, opts = [], expl = "") =>
    ({ language, question_text: stem, options: opts.map((t, i) => ({ id: "abcd"[i], text: t })), explanation: expl });

  /* ============ THE REGULATION SCOPE, BOTH DIRECTIONS ============
   *
   * A Regulation role term is a FAILURE in a row about the Regulation and a FLAG elsewhere. The first two
   * controls here previously asserted the unconditional failure and correctly broke when the scope rule
   * landed -- kept as the paired cases rather than rewritten into one, because the whole ruling is the
   * difference between them. */
  const a = lintRow(row("pt-BR", "Sob o Regulamento da IA da UE, o fornecedor deve registrar o sistema."),
    "AIGRM-I", null);
  if (!a.forbidden.some((f) => f.variant === "fornecedor")) {
    fails.push("forbidden pt `fornecedor` did not fire in a row that names the Regulation");
  }
  const aOut = lintRow(row("pt-BR", "O fornecedor de dados entrega o conjunto de treinamento."), "AIGRM-I", null);
  if (aOut.forbidden.length) {
    fails.push("`fornecedor` was a FAILURE in a row that is not about the Regulation -- it must be a flag");
  }
  if (!aOut.mixed.some((f) => f.variant === "fornecedor")) {
    fails.push("`fornecedor` outside the Regulation was not reported at all");
  }
  /* The English sibling counts: a translated row may name the Act only in what it was translated from. */
  const aEn = lintRow(row("pt-BR", "O fornecedor deve registrar o sistema."), "AIGRM-I",
    row("en", "Under the EU AI Act, the provider must register the system."));
  if (!aEn.forbidden.some((f) => f.variant === "fornecedor")) {
    fails.push("the English sibling naming the Act did not make it a failure");
  }
  /* AN OVERLAPPING VARIANT IS COUNTED ONCE. `EU AI Act` contains `AI Act`; both are forbidden
   * variants of one term, and counting each independently double-counted 164 occurrences. */
  const ov = lintRow(row("pt-BR", "O EU AI Act e depois o AI Act sozinho."), "AIGRM-I", null);
  const ovN = ov.forbidden.filter((f) => f.key === "act-name").reduce((n, f) => n + f.n, 0);
  if (ovN !== 2) {
    fails.push("overlapping variants counted " + ovN + " where 2 distinct occurrences exist");
  }
  if (!ov.forbidden.some((f) => f.variant === "EU AI Act")) {
    fails.push("the LONGER variant lost to the shorter one -- longest must be claimed first");
  }
  /* ============ A CONCEPT IS A VALID SUBJECT, AND THE SHAPE HAS TO BE LINTABLE ============
   *
   * `gen-concept-translations` now gates on this the way `retranslate-item-rewrite` does, and a
   * concept has a NAME and a DESCRIPTION rather than a stem and options. It is passed as
   * question_text = name, options = [], explanation = description. These cases assert that shape is
   * read -- a lint that silently examined nothing here would report clean on every concept forever,
   * which is how this generator came to emit `provedor` with no check at all.
   *
   * The live instance is the third: `minimal-risk` pt-BR carried both `implantadores` and `provedor`,
   * and only the first is a FAILURE. That is why wiring the gate catches one of the three rows the
   * director corrected by hand and not all three -- recorded rather than papered over. */
  const conceptRow = (desc, name) => ({ language: "pt-BR", question_text: name || "conceito",
    options: [], explanation: desc });
  const cA = lintRow(conceptRow("O dever alcança provedores e implantadores de todo sistema de IA " +
    "sob o Artigo 4."), "AIGRM-I", null);
  if (!cA.forbidden.some((f) => f.variant === "implantadores")) {
    fails.push("a CONCEPT-shaped row was not linted: implantadores did not fire in the description");
  }
  const cB = lintRow(conceptRow("Recaem sobre o prestador do modelo que o coloca no mercado."),
    "AIGRM-I", null);
  if (cB.forbidden.length) fails.push("the corrected concept text was refused: " +
    cB.forbidden.map((f) => f.variant).join(", "));
  const cC = lintRow(conceptRow("Recai sobre o provedor do sistema gerador."), "AIGRM-I", null);
  if (cC.forbidden.length) {
    fails.push("`provedor` was a FAILURE -- it is declared `flag`, and raising it is a ruling");
  }
  if (!cC.mixed.some((f) => f.variant === "provedor")) {
    fails.push("`provedor` in a concept description was not reported at all");
  }
  /* A MARKER MUST NOT MATCH INSIDE A LONGER WORD. The live instance: `AI Act` matched
   * "documented AI activities" and gated a 42001 row that names the Regulation nowhere. */
  const aSub = lintRow(row("pt-BR", "O fornecedor terceiro entregou abaixo do esperado."), "AIMS-IA",
    row("en", "The system sits within the Division's documented AI activities."));
  if (aSub.forbidden.length) {
    fails.push("a marker matched inside a longer word (AI activities) and gated a non-Regulation row");
  }
  /* `provedor` is NOT GATED in AIMS-F or AIMS-IA, and is a flag elsewhere. */
  const pv = lintRow(row("pt-BR", "Sob o Regulamento da IA da UE, o provedor registra o sistema."), "AIMS-IA", null);
  if (pv.forbidden.length) fails.push("`provedor` was gated in AIMS-IA, where the ABNT term is unknown");
  const pv2 = lintRow(row("pt-BR", "Sob o Regulamento da IA da UE, o provedor registra o sistema."), "AIGRM-I", null);
  if (!pv2.mixed.some((f) => f.variant === "provedor")) fails.push("`provedor` was not reported on AIGRM-I");

  /* ============ iso_22989_roles, BOTH DIRECTIONS ============
   *
   * Added PROMPT-94 s3 and it fired on ZERO live rows. Zero is a clean result only once a wrong form is
   * shown to be caught: the family is read (the lint walks every family), and being read is not being
   * able to fire. */
  const r1 = lintRow(row("es-419", "El productor de IA disena el sistema."), "AIMS-F",
    row("en", "The AI producer designs the system."));
  if (r1.forbidden.length || r1.mixed.some((f) => f.family === "iso_22989_roles")) {
    fails.push("the corpus's own form `productor de IA` was reported: " +
      JSON.stringify([...r1.forbidden, ...r1.mixed].slice(0, 2)));
  }
  /* the wrong form: Spanish rendering the producer role as a manufacturer */
  const r2 = lintRow(row("es-419", "El fabricante de IA disena el sistema."), "AIMS-F",
    row("en", "The AI producer designs the system."));
  const r2hit = [...r2.forbidden, ...r2.mixed, ...(r2.untranslated || [])]
    .some((f) => f.family === "iso_22989_roles" && f.key === "ai_producer");
  if (!r2hit) {
    fails.push("iso_22989_roles CANNOT FIRE: an es row rendering `AI producer` as `fabricante de IA` was " +
      "not reported at all, so the family's zero live findings mean nothing");
  }
  /* a `flag` term must never be raised to a failure -- raising a severity is a ruling */
  const r3 = lintRow(row("pt-BR", "O objeto de IA nao consente."), "AIMS-F",
    row("en", "The AI subject does not consent."));
  if (r3.forbidden.some((f) => f.family === "iso_22989_roles")) {
    fails.push("`ai_subject` is declared `flag` and fired as a FAILURE");
  }

  /* SCOPE: the same word in a Scrum certification is not examined at all. */
  const b = lintRow(row("pt-BR", "O fornecedor entrega o incremento."), "SM-AI-I", null);
  if (b.forbidden.length) fails.push("forbidden pt `fornecedor` fired outside its scope (SM-AI-I)");

  /* AIMS-F is a certification CODE, not the acronym. */
  const c = lintRow(row("es-419", "El examen AIMS-F cubre el SGIA."), "AIMS-F", null);
  if (c.forbidden.length) fails.push("`AIMS-F` was read as the bare acronym");
  const d = lintRow(row("es-419", "El SGSIA de la empresa."), "AIMS-F", null);
  if (!d.forbidden.some((f) => f.variant === "SGSIA")) fails.push("SGSIA did not fire");
  /* A MIS-CASING fires only in the wrong case. Both directions, because case-insensitive matching
   * here reports every correct row as a defect. */
  const d2 = lintRow(row("es-419", "El SGia de la empresa."), "AIMS-F", null);
  if (!d2.forbidden.some((f) => f.variant === "SGia")) fails.push("the mis-cased SGia did not fire");

  /* MIXED: two clause words in one pt ISO row. */
  const e = lintRow(row("pt-BR", "A seção 9.2 e a cláusula 6.1 exigem."), "ISMS-IA", null);
  if (!e.mixed.some((x) => x.key === "clause-word")) fails.push("mixed clause words did not fire");
  const f = lintRow(row("pt-BR", "A seção 9.2 e a subseção 9.2.2."), "ISMS-IA", null);
  if (!f.mixed.some((x) => x.key === "clause-word")) fails.push("seção + subseção should still report as mixed");

  /* THE RELATIVE MODAL RULE, both directions and the abstention. */
  const g = lintRow(row("pt-BR", "A organização deveria considerar."), "ISMS-IA",
    row("en", "The organization should consider."));
  if (!g.mixed.some((x) => x.key === "should")) fails.push("`deveria` against an English `should` did not fire");
  const h = lintRow(row("pt-BR", "A organização deveria considerar."), "ISMS-IA",
    row("en", "The organization shall consider."));
  if (h.mixed.some((x) => x.key === "should")) fails.push("`deveria` fired where the English has no `should`");
  const i = lintRow(row("pt-BR", "A organização deveria considerar."), "ISMS-IA", null);
  if (!i.unchecked.length) fails.push("no English sibling must report UNCHECKED, not a pass");

  /* THE SEVERITY SPLIT. A forbidden-list hit on a `flag` term must NOT land in the class the gate
   * blocks on -- this is the fix for reporting `alto risco` and `padrão` as gate failures. */
  const k1 = lintRow(row("pt-BR", "Um sistema de alto risco exige supervisão."), "AIGRM-I", null);
  if (k1.forbidden.length) fails.push("`alto risco` (severity flag) landed in FORBIDDEN, which the gate blocks");
  if (!k1.mixed.some((x) => x.variant === "alto risco")) fails.push("`alto risco` was not reported at all");
  const k2 = lintRow(row("pt-BR", "Sob o Regulamento da IA da UE, o fornecedor deve registrar."), "AIGRM-I", null);
  if (!k2.forbidden.some((x) => x.variant === "fornecedor")) fails.push("a `failure` term stopped landing in FORBIDDEN");

  /* THE METALINGUISTIC OPT-OUT. An item ABOUT the two modals must not be reported for carrying them. */
  const k3 = lintRow(row("pt-BR",
    "As declarações 'should' da ISO 19011 são mais fracas do que 'shall'."), "ISMS-IA", null);
  if (k3.untranslated.length) {
    fails.push("the English modals fired as untranslated in an item whose subject IS the modals");
  }

  /* A clean row must stay quiet. */
  const j = lintRow(row("pt-BR", "O prestador deve manter a norma e a acreditação."), "AIMS-IA", null);
  if (j.forbidden.length) fails.push("a clean pt row fired: " + JSON.stringify(j.forbidden));

  return { examined: 27, fails };
}


export const GLOSSARY_VERSION = GLOSSARY.version;
