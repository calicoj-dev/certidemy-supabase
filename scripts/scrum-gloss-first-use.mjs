#!/usr/bin/env node
/**
 * scrum-gloss-first-use.mjs -- where each glossable Scrum term FIRST appears in each lesson sequence,
 * so the official rendering can be added in parentheses at that one place.
 *
 * READ-ONLY. No --apply, no writes to any table. Unknown flags exit 2.
 *
 * ============ WHY FIRST USE AND NOT EVERY USE ============
 *
 * The ruling is that the English term is the house convention and stays. A gloss is a courtesy to a
 * reader meeting the term for the first time: `Sprint Goal (Objetivo del Sprint)`. Repeating it is
 * noise, and rewriting every occurrence is the bulk pass that was refused.
 *
 * So the output is ONE lesson per (certification, language, term) -- the earliest in the lesson
 * sequence that contains it -- and the count of later lessons that also carry it, stated so the size
 * of what is NOT being changed is visible.
 *
 * ============ FIRST BY SEQUENCE, NOT BY id OR created_at ============
 *
 * A learner meets the terms in lesson order. Slugs here are `NN-NN-title`, so the sequence is the
 * numeric prefix; a lesson whose slug does not carry one is reported rather than sorted arbitrarily,
 * because guessing its position would put a gloss somewhere a reader may already have passed.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". This script is READ-ONLY and takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const GLOSSARY = JSON.parse(readFileSync(join(HERE, "lib", "translation-glossary.json"), "utf8"));
const AG = (GLOSSARY.families.scrum_2020 || {}).allowed_glosses;
if (!AG || !Array.isArray(AG.terms) || !AG.terms.length) {
  console.error("scrum_2020 declares no allowed_glosses -- nothing to enumerate.");
  console.error("This script reads the glossary rather than carrying its own list.");
  process.exit(2);
}
const SCOPE = GLOSSARY.families.scrum_2020.scope;

const B = "\\w\\-áéíóúâêôãõçüñ";
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const termRe = (s) => new RegExp("(?<![" + B + "])" + esc(s) + "(?![" + B + "])", "gi");
/* a term already glossed HERE is not a place to add a gloss */
const glossedRe = (en, official) => new RegExp(
  esc(en) + "\\s*\\(\\s*" + esc(official) + "\\s*\\)", "i");

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&order=code");
const want = new Set(certs.filter((c) => SCOPE.includes(c.code)).map((c) => c.id));
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
/* A lesson carries `module_id`, not `certification_id` -- the certification is one join away, through
 * `modules`. Asked for the column that does not exist first, and PostgREST said so by name. */
const mods = await getAll(KEY, "modules?select=id,certification_id&order=id");
const certOfModule = new Map(mods.map((m) => [m.id, m.certification_id]));
const lessons = (await getAll(KEY,
  "lessons?select=id,module_id,slug,title,language,content_md&order=id"))
  .map((l) => ({ ...l, certification_id: certOfModule.get(l.module_id) }))
  .filter((l) => want.has(l.certification_id));

/* ============ THE SEQUENCE IS NOT ALWAYS AT THE START OF THE SLUG ============
 *
 * The first version anchored `^(\d+)-(\d+)`. SM-AI-II prefixes its slugs with the certification code
 * -- `sm-ai-ii-04-07-put-it-back-where-it-comes-from` -- so ALL 44 of its lessons per language were
 * excluded, and the report printed *never appears* for every one of its eight term/language rows.
 *
 * That is "not in my population" rendered as "the term does not occur", which is the third-state
 * defect this repository records over and over, committed here in a report written minutes after
 * describing it. The term does occur; the instrument could not see the lesson.
 *
 * The first `NN-NN` ANYWHERE in the slug is the sequence: it matches `01-02-...` and
 * `sm-ai-ii-04-07-...` alike, because the code prefix carries no digits. */
const seq = (slug) => {
  const m = /(\d+)-(\d+)/.exec(String(slug || ""));
  return m ? Number(m[1]) * 1000 + Number(m[2]) : null;
};
const noSeq = lessons.filter((l) => seq(l.slug) === null);
/* A certification/language with NO sequenced lesson cannot be measured at all, and that is a third
 * state rather than an absence of the term. Reported under its own name below. */
const unmeasurable = new Set();
for (const code of SCOPE) {
  const c = certs.find((x) => x.code === code);
  if (!c) continue;
  for (const lang of ["es-419", "pt-BR"]) {
    const n = lessons.filter((l) => l.certification_id === c.id && l.language === lang &&
      seq(l.slug) !== null).length;
    if (!n) unmeasurable.add(code + " " + lang);
  }
}

const rows = [];
for (const t of AG.terms) {
  for (const [lk, lang] of [["es", "es-419"], ["pt", "pt-BR"]]) {
    const official = t[lk];
    if (!official) continue;                 /* the official edition keeps the English: nothing to gloss */
    const mine = lessons.filter((l) => l.language === lang && seq(l.slug) !== null)
      .sort((a, b) => seq(a.slug) - seq(b.slug) || String(a.slug).localeCompare(b.slug));
    for (const code of SCOPE) {
      const cid = certs.find((c) => c.code === code);
      if (!cid) continue;
      const inCert = mine.filter((l) => l.certification_id === cid.id);
      const hits = inCert.filter((l) => termRe(t.en).test(String(l.content_md || "")));
      if (unmeasurable.has(code + " " + lang)) {
        rows.push({ cert: code, lang, en: t.en, official, first: null, later: 0, unmeasured: true });
        continue;
      }
      if (!hits.length) { rows.push({ cert: code, lang, en: t.en, official, first: null, later: 0 }); continue; }
      const already = hits.filter((l) => glossedRe(t.en, official).test(String(l.content_md || "")));
      rows.push({
        cert: code, lang, en: t.en, official,
        first: hits[0], later: hits.length - 1,
        occurrencesInFirst: (String(hits[0].content_md || "").match(termRe(t.en)) || []).length,
        alreadyGlossed: already.length,
      });
    }
  }
}

const md = [];
const p = (s = "") => md.push(s);
p("# Where to add each Scrum gloss, once");
p("");
p("**The English term is the house convention and stays.** This is the list of places where the");
p("official rendering may be added in parentheses on FIRST USE, one lesson per certification and");
p("language. Nothing here has been changed -- `scrum-gloss-first-use.mjs` is read-only.");
p("");
p("Generated from `scrum_2020.allowed_glosses` in the glossary, so the term list has one home and");
p("this document cannot drift from it.");
p("");
p("| certification | language | term | gloss | first lesson | later lessons also using it |");
p("|---|---|---|---|---|---|");
for (const r of rows.sort((a, b) => a.en.localeCompare(b.en) || a.lang.localeCompare(b.lang) ||
  a.cert.localeCompare(b.cert))) {
  p("| " + r.cert + " | " + r.lang + " | `" + r.en + "` | `" + r.official + "` | " +
    (r.first ? "`" + r.first.slug + "`" + (r.alreadyGlossed ? " **already glossed**" : "")
      : r.unmeasured ? "*NOT MEASURED -- no sequenced lesson*" : "*never appears*") +
    " | " + (r.first ? r.later : "-") + " |");
}
p("");
const missing = rows.filter((r) => !r.first).length;
p("**" + (rows.length - missing) + " place(s) to add a gloss**, across " +
  new Set(rows.filter((r) => r.first).map((r) => r.cert + r.lang)).size +
  " certification/language pairs. " + missing + " row(s) are a term that never appears in that");
p("certification's lessons at all.");
p("");
p("The `later lessons` column is the size of what is deliberately NOT being changed: a gloss is a");
p("courtesy on first meeting, and repeating it in every lesson is the bulk rewrite the ruling refused.");
if (noSeq.length) {
  p("");
  p("**" + noSeq.length + " lesson(s) carry no `NN-NN` sequence prefix and were EXCLUDED**, rather than");
  p("sorted into an arbitrary position -- putting a gloss at a guessed place could put it after a reader");
  p("has already met the term:");
  p("");
  for (const l of noSeq.slice(0, 12)) p("- `" + l.slug + "` (" + codeOf.get(l.certification_id) + " " + l.language + ")");
}
writeFileSync(join(ROOT, "SCRUM-GLOSS-FIRST-USE.md"), md.join("\n") + "\n", "utf8");
console.log("rows " + rows.length + "   with a first lesson " + (rows.length - missing) +
  "   lessons without a sequence prefix " + noSeq.length);
console.log("wrote SCRUM-GLOSS-FIRST-USE.md");
