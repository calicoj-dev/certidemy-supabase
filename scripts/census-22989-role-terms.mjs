#!/usr/bin/env node
/**
 * census-22989-role-terms.mjs -- how does our translated corpus already render ISO/IEC 22989's role names?
 *
 * READ-ONLY. Unknown flags exit 2.
 *
 * Ruled PROMPT-94 s3: add the 22989 role terms to the glossary "with the forms our corpus already uses". So
 * the forms are MEASURED, not chosen. Inventing a rendering would install a term the corpus does not use and
 * then fail every existing row against it -- a guard that fires on the house convention, which this
 * repository records firing on 653 of 1,730 concept names.
 *
 * ============ AND THERE IS A COLLISION TO SETTLE FIRST ============
 *
 * The glossary already has an `eu_ai_act` family scoped to AIMS-F, AIMS-IA, AIGRM-I, AIHR-I and AIE-I, whose
 * `provider` entry is es `proveedor` / pt `prestador` with pt `fornecedor` FORBIDDEN. 22989 also has a
 * provider role. If our corpus renders 22989's provider differently, two families scoped to the same
 * certification would give opposite verdicts on one word -- the "one certification asserts what another
 * denies" defect, inside a single lint.
 *
 * So this prints what each candidate form's count actually is, per language, and flags any term where the
 * corpus disagrees with an existing glossary entry. The decision is then made once, in the open.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { requireKey, getAll } from "./_pg.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KEY = requireKey(HERE);

/* the six role FAMILIES 22989 clause 5.19 defines, plus the two sub-roles 1.2's KSAs name */
const ROLES = [
  { key: "ai_provider", en: "AI provider",
    es: ["proveedor de IA", "suministrador de IA"], pt: ["prestador de IA", "fornecedor de IA", "provedor de IA"] },
  { key: "ai_producer", en: "AI producer",
    es: ["productor de IA"], pt: ["produtor de IA"] },
  { key: "ai_customer", en: "AI customer",
    es: ["cliente de IA"], pt: ["cliente de IA"] },
  { key: "ai_partner", en: "AI partner",
    es: ["socio de IA", "asociado de IA"], pt: ["parceiro de IA"] },
  { key: "ai_subject", en: "AI subject",
    es: ["sujeto de IA"], pt: ["sujeito de IA"] },
  { key: "relevant_authority", en: "relevant authority",
    es: ["autoridad competente", "autoridad pertinente", "autoridad relevante"],
    pt: ["autoridade competente", "autoridade pertinente", "autoridade relevante"] },
  { key: "ai_user", en: "AI user",
    es: ["usuario de IA"], pt: ["usuario de IA", "utilizador de IA"] },
  { key: "ai_developer", en: "AI developer",
    es: ["desarrollador de IA"], pt: ["desenvolvedor de IA"] },
];

/* ---- the corpus: translated item text and concept text for the AI certifications ---- */
const certCodes = ["AIMS-F", "AIMS-IA", "AIGRM-I", "AIHR-I", "AIE-I", "AISM-I"];
const certs = (await getAll(KEY, "certifications?select=id,code&order=code"))
  .filter((c) => certCodes.includes(c.code));
const certIds = new Set(certs.map((c) => c.id));

const haystack = { "es-419": [], "pt-BR": [] };
for (const c of certs) {
  for (const lang of ["es-419", "pt-BR"]) {
    const qs = await getAll(KEY, "quiz_questions?select=question_text,options,explanation" +
      "&certification_id=eq." + c.id + "&language=eq." + lang + "&retired_at=is.null&order=id");
    for (const q of qs) {
      haystack[lang].push(String(q.question_text || ""));
      haystack[lang].push(String(q.explanation || ""));
      for (const o of (Array.isArray(q.options) ? q.options : [])) haystack[lang].push(String(o.text || ""));
    }
  }
}
/* concepts too: the role vocabulary is as likely to sit there as in an item */
const ct = await getAll(KEY, "concept_translations?select=language,name,description&order=id");
for (const r of ct) {
  if (haystack[r.language]) { haystack[r.language].push(String(r.name || "")); haystack[r.language].push(String(r.description || "")); }
}
const blob = { "es-419": haystack["es-419"].join("\n").toLowerCase(),
  "pt-BR": haystack["pt-BR"].join("\n").toLowerCase() };
console.log("CORPUS READ");
for (const lang of ["es-419", "pt-BR"]) {
  console.log("  " + lang + "   " + haystack[lang].length + " text field(s), " +
    blob[lang].length.toLocaleString() + " characters");
}
/* THE HAYSTACK MUST BE ABLE TO MATCH SOMETHING, or every zero below is a fact about the read. A positive
 * control: the word "inteligencia" must appear in both languages, or nothing was loaded. */
for (const lang of ["es-419", "pt-BR"]) {
  const ok = blob[lang].includes("intelig");
  console.log("  positive control (" + lang + "): the stem 'intelig' is present -- " + (ok ? "yes" : "NO"));
  if (!ok) { console.error("ABORT: the corpus read produced nothing matchable; every count below would be a lie."); process.exit(2); }
}
console.log("");

/* strip accents so a count is about the WORD, not about whether a row spelled it with one */
const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const foldBlob = { "es-419": fold(blob["es-419"]), "pt-BR": fold(blob["pt-BR"]) };
const countOf = (lang, form) => {
  const f = fold(form.toLowerCase());
  let n = 0, i = 0;
  for (;;) { const j = foldBlob[lang].indexOf(f, i); if (j < 0) break; n++; i = j + f.length; }
  return n;
};

console.log("CANDIDATE FORMS, counted in the corpus (accent-folded, so the count is about the word)");
console.log("");
const chosen = [];
for (const r of ROLES) {
  console.log("  " + r.en);
  const pick = {};
  for (const lang of [["es", "es-419"], ["pt", "pt-BR"]]) {
    const [short, full] = lang;
    const scored = (r[short] || []).map((f) => ({ f, n: countOf(full, f) })).sort((a, b) => b.n - a.n);
    for (const s of scored) console.log("    " + full + "  " + String(s.n).padStart(4) + "  " + s.f);
    /* THE CORPUS CHOOSES. Where every candidate is 0 the term is UNATTESTED and gets no entry -- an
     * invented rendering would install a rule the corpus has never followed. */
    pick[short] = scored[0] && scored[0].n > 0 ? scored[0] : null;
    if (!pick[short]) console.log("    " + full + "     -- UNATTESTED: no candidate appears. No entry written.");
  }
  chosen.push({ ...r, pick });
  console.log("");
}

/* ---- the collision with the existing eu_ai_act family ---- */
const g = JSON.parse(readFileSync(join(ROOT, "scripts/lib/translation-glossary.json"), "utf8"));
const eu = g.families.eu_ai_act;
console.log("COLLISION CHECK against the existing eu_ai_act family");
console.log("  its scope: " + JSON.stringify(eu.scope));
for (const t of eu.terms || []) {
  const mine = chosen.find((r) => r.en.toLowerCase().includes(String(t.en).toLowerCase()) ||
    String(t.en).toLowerCase().includes(r.en.replace(/^AI /, "").toLowerCase()));
  if (!mine) continue;
  const clash = [];
  for (const short of ["es", "pt"]) {
    if (!mine.pick[short]) continue;
    const ours = fold(mine.pick[short].f);
    const theirs = fold(String(t[short] || "").toLowerCase());
    if (theirs && !ours.includes(theirs)) clash.push(short + ": glossary says '" + t[short] +
      "', the corpus uses '" + mine.pick[short].f + "' (" + mine.pick[short].n + " occurrence(s))");
    for (const fb of (t.forbidden || {})[short] || []) {
      if (ours.includes(fold(String(fb).toLowerCase()))) {
        clash.push(short + ": the corpus form '" + mine.pick[short].f + "' contains '" + fb +
          "', which eu_ai_act FORBIDS");
      }
    }
  }
  console.log("  `" + t.key + "` vs " + mine.en + "   " + (clash.length ? "CLASH" : "consistent"));
  for (const c of clash) console.log("      " + c);
}
console.log("");
console.log("A term whose corpus form contradicts an existing family is NOT written silently. Two families");
console.log("scoped to one certification giving opposite verdicts on one word is the same defect as two");
console.log("certifications asserting opposite things about a standard -- it just fits inside one lint.");
