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
    /* FORBIDDEN */
    for (const bad of (t.forbidden && t.forbidden[lk]) || []) {
      const cs = isMiscasing(bad, t[lk]);
      for (const [field, text] of fields) {
        const hits = [...text.matchAll(termRe(bad, cs))];
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
          if (t.severity === "failure") res.forbidden.push(rec);
          else res.mixed.push({ ...rec, note: "on the forbidden list, but declared severity `flag`" });
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
  return res;
}

/* ---------------------------------------------------------------- controls */
export function translationLintControls() {
  const fails = [];
  const row = (language, stem, opts = [], expl = "") =>
    ({ language, question_text: stem, options: opts.map((t, i) => ({ id: "abcd"[i], text: t })), explanation: expl });

  const a = lintRow(row("pt-BR", "O fornecedor deve registrar o sistema."), "AIGRM-I", null);
  if (!a.forbidden.some((f) => f.variant === "fornecedor")) fails.push("forbidden pt `fornecedor` did not fire on AIGRM-I");

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
  const k2 = lintRow(row("pt-BR", "O fornecedor deve registrar."), "AIGRM-I", null);
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

  return { examined: 15, fails };
}


export const GLOSSARY_VERSION = GLOSSARY.version;
