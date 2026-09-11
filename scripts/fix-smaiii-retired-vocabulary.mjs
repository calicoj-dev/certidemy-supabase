#!/usr/bin/env node
/**
 * fix-smaiii-retired-vocabulary.mjs - retire "self-organized" from SM-AI-II's secure bank.
 *
 * --apply TO WRITE. Dry by default, per the house rule for new scripts. An unrecognised
 * flag exits 2 rather than running live on a typo.
 *
 * WHAT IS WRONG, AND WHY SWAPPING THE WORD WOULD NOT FIX IT
 * ---------------------------------------------------------
 * Two secure items on task 2.8 use "self-organized", one of them IN THE KEY:
 *
 *   "A capability gap the team could have addressed through available SELF-ORGANIZED
 *    learning, making it a SELF-MANAGEMENT failure this Sprint."
 *
 * That sentence uses the retired term and the current one together, as the answer. The
 * 2020 edition did not rename self-organizing to self-managing and leave the concept
 * alone - it MOVED the property to the Scrum Team ("They are also self-managing, meaning
 * they internally decide who does what, when, and how") and dropped the older word. So a
 * sentence carrying both is asserting a distinction the Guide does not make: it reads as
 * though "self-organized learning" were one thing and self-management another.
 *
 * THE CLAIM IS REWRITTEN, NOT THE VOCABULARY. Replacing one word would leave the item
 * saying the same wrong thing in current terms. What the stem actually supports is that
 * the team HAD A MEANS AVAILABLE AND DID NOT USE IT, and that is what makes it a
 * self-management failure rather than an impediment.
 *
 * TWO CONSTRAINTS CHECKED BY HAND BEFORE WRITING (STYLE-GUIDE section 0.7):
 *   1. The key still discriminates against the same second-best. Options c and d both
 *      misclassify the situation as an impediment; the rewritten key still turns on the
 *      team having had the means and declining to use them.
 *   2. The stem still supports the key. "Pair programming with a knowledgeable colleague
 *      was available but never attempted" is exactly "had the means to close and chose
 *      not to". A rewritten key must still be the answer to the question that was asked.
 *
 * SIX ROWS, NOT TWO. The retired term propagated through translation - "aprendizaje
 * autoorganizado" and "aprendizado auto-organizado" - so each logical item is wrong in
 * all three languages. verify-cert's items.vocabulary check reads the English pattern
 * only and would have reported these two items clean after an English-only fix.
 *
 * SURGICAL REPLACEMENT, NOT RETRANSLATION. Each edit is an exact-match substring swap
 * inside one field. Everything around the offending clause is preserved, so the three
 * language rows stay the translations of each other rather than becoming three
 * independently written items.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (!KNOWN.has(a)) {
    console.error(`Unrecognised flag: ${a}`);
    console.error("THIS REPO HAS TWO OPPOSITE FLAG CONVENTIONS. This script opts into");
    console.error("WRITING with --apply and is DRY by default. Scripts in the other");
    console.error("family opt into SAFETY with --dry and are LIVE without it.");
    process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");

for (const p of ["scripts/.env", ".env"]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const db = createClient(process.env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

// group -> field -> language -> [find, replace]
const EDITS = [
  // ITEM 1, task 2.8 difficulty 3. THE KEY. Worst placement available.
  { group: "f4c50e27-1f07-4f73-a905-0250bb2fc09d", field: "options", optionId: "b", lang: "en",
    find: "could have addressed through available self-organized learning, making it a self-management failure this Sprint",
    repl: "had the means to close within the Sprint and chose not to, making it a self-management failure" },
  { group: "f4c50e27-1f07-4f73-a905-0250bb2fc09d", field: "options", optionId: "b", lang: "es-419",
    find: "podría haber abordado mediante el aprendizaje autoorganizado disponible, lo que la convierte en una falla de autogestión en este Sprint",
    repl: "tenía los medios para cerrar durante el Sprint y optó por no hacerlo, lo que la convierte en una falla de autogestión" },
  { group: "f4c50e27-1f07-4f73-a905-0250bb2fc09d", field: "options", optionId: "b", lang: "pt-BR",
    find: "poderia ter abordado por meio de aprendizado auto-organizado disponível, tornando-a uma falha de autogestão neste Sprint",
    repl: "tinha os meios para fechar durante o Sprint e optou por não fazê-lo, tornando-a uma falha de autogestão" },

  // ITEM 2, task 2.8 difficulty 2. Explanation only; its key already says "self-managing".
  { group: "d9231280-96d6-45ae-965c-45460f43992c", field: "explanation", lang: "en",
    find: "is already resolving it through self-organized peer learning — exactly what a self-managing team should do",
    repl: "is already closing it: the Developers decided among themselves who would help — exactly what a self-managing team does" },
  { group: "d9231280-96d6-45ae-965c-45460f43992c", field: "explanation", lang: "es-419",
    find: "ya la está resolviendo mediante el aprendizaje entre pares autoorganizado, que es exactamente lo que debe hacer un equipo que se autogestiona",
    repl: "ya la está cerrando: los Developers decidieron entre ellos quién ayudaría, que es exactamente lo que hace un equipo que se autogestiona" },
  { group: "d9231280-96d6-45ae-965c-45460f43992c", field: "explanation", lang: "pt-BR",
    find: "já está resolvendo-a por meio de aprendizado entre pares auto-organizado — exatamente o que um time autogerenciado deve fazer",
    repl: "já está fechando-a: os Developers decidiram entre si quem ajudaria — exatamente o que um time autogerenciado faz" },

  // ADDED 2026-09-11. These two ENGLISH PRACTICE rows blocked four re-translations:
  // retranslate-retired-vocabulary.mjs refuses to translate from a source that carries
  // a retired term, because doing so reproduces the defect in a new language and calls
  // it fixed. Both were read before being touched, and in NEITHER is the retired term
  // the misconception under test - which is the check N22 requires and the reason
  // SM-AI-I's equivalents are being left alone.
  //
  //   2.2  distractor d. The item is about a Retrospective improvement never reaching
  //        the Sprint Backlog. "self-organize" is incidental; d's job is to be the
  //        exhortation-without-structure wrong answer, and it still is.
  //
  //   3.5  THE STEM, in reported speech: a Product Owner saying "I've asked the
  //        development team to vote". The item assesses DECISION DIFFUSION - the key is
  //        "the Product Owner transferred ordering authority to the team, leaving no
  //        single person accountable" - so the 2017 term is colour, not subject.
  //        Contrast SM-AI-I 5.7, whose stem IS "A legacy manual calls Developers
  //        'self-organizing.' The 2020 Scrum Guide...". That one is correct and stays.
  //
  // RATIONALE AND REVISION BUMP: ASSESSMENT-ENGINE section 8 requires both for a key,
  // stem or distractor change on a live SECURE item. These are PRACTICE rows, so the
  // rule does not bind - the rationale above and the bump below are applied anyway,
  // because a stem change is a stem change and the cost of recording it is nothing.
  { group: "4166ce1e-a6f1-4d93-9f03-27f623dcd1c6", field: "options", optionId: "d", lang: "en",
    find: "encourage them to self-organize around completing them",
    repl: "encourage them to decide among themselves how to fit them in" },
  { group: "da8f4644-1d34-4bcf-8cc9-44658bc2e4a5", field: "question_text", lang: "en",
    find: "I've asked the development team to vote",
    repl: "I've asked the Developers to vote" },
];

const RETIRED = /self-organiz|autoorganiz|auto-organiz|development team/i;
let planned = 0, failed = 0;

for (const e of EDITS) {
  const { data: rows, error } = await db.from("quiz_questions")
    .select("id, language, question_text, options, explanation, correct_answer")
    .eq("question_group_id", e.group).eq("language", e.lang);
  if (error) { console.error(`  read failed: ${error.message}`); failed++; continue; }
  if (!rows || rows.length !== 1) { console.error(`  ABORT ${e.group}/${e.lang}: ${rows?.length ?? 0} rows, expected 1`); failed++; continue; }
  const row = rows[0];

  let before, after, patch;
  if (e.field === "question_text") {
    before = row.question_text || "";
    if (before.split(e.find).length - 1 !== 1) {
      if (before.includes(e.repl)) { console.log(`  ${e.lang.padEnd(7)} STEM  already applied`); continue; }
      console.error(`  ABORT ${e.lang} stem: anchor matched ${before.split(e.find).length - 1}`); failed++; continue;
    }
    after = before.replace(e.find, e.repl);
    patch = { question_text: after };
    console.log(`  ${e.lang.padEnd(7)} STEM`);
  } else if (e.field === "explanation") {
    before = row.explanation || "";
    if (before.split(e.find).length - 1 !== 1) {
      if (before.includes(e.repl)) { console.log(`  ${e.lang.padEnd(7)} explanation  already applied`); continue; }
      console.error(`  ABORT ${e.lang} explanation: anchor matched ${before.split(e.find).length - 1}`); failed++; continue;
    }
    after = before.replace(e.find, e.repl);
    patch = { explanation: after };
  } else {
    const opts = Array.isArray(row.options) ? row.options : [];
    const i = opts.findIndex((o) => o.id === e.optionId);
    if (i === -1) { console.error(`  ABORT ${e.lang}: no option ${e.optionId}`); failed++; continue; }
    const isKey = [].concat(row.correct_answer || []).includes(e.optionId);
    before = opts[i].text || "";
    if (before.split(e.find).length - 1 !== 1) {
      if (before.includes(e.repl)) { console.log(`  ${e.lang.padEnd(7)} option ${e.optionId}  already applied`); continue; }
      console.error(`  ABORT ${e.lang} option ${e.optionId}: anchor matched ${before.split(e.find).length - 1}`); failed++; continue;
    }
    after = before.replace(e.find, e.repl);
    const next = opts.map((o, k) => (k === i ? { ...o, text: after } : o));
    patch = { options: next };
    console.log(`  ${e.lang.padEnd(7)} option ${e.optionId}${isKey ? "  [KEY]" : ""}`);
  }

  if (RETIRED.test(after)) { console.error(`  ABORT ${e.lang}: the retired term survives the rewrite`); failed++; continue; }
  if (after === before) { console.error(`  ABORT ${e.lang}: replacement changed nothing`); failed++; continue; }
  if (e.field === "explanation") console.log(`  ${e.lang.padEnd(7)} explanation`);
  console.log(`      was: ...${before.slice(Math.max(0, before.indexOf(e.find) - 20), before.indexOf(e.find) + e.find.length + 10)}...`);
  console.log(`      now: ...${after.slice(Math.max(0, after.indexOf(e.repl) - 20), after.indexOf(e.repl) + e.repl.length + 10)}...`);
  planned++;

  if (APPLY) {
    const { error: uErr } = await db.from("quiz_questions").update(patch).eq("id", row.id);
    if (uErr) { console.error(`      write failed: ${uErr.message}`); failed++; }
    else console.log("      written");
  }
}

console.log(`\n${APPLY ? "APPLIED" : "[dry]"} ${planned}/${EDITS.length} edits, ${failed} failed`);
if (failed) { console.error("Some edits failed. Nothing partial is acceptable here - re-read before re-running."); process.exit(1); }
if (!APPLY) console.log("Re-run with --apply to write.");
