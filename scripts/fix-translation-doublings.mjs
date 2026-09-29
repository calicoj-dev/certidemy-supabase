#!/usr/bin/env node
/**
 * fix-translation-doublings.mjs -- remove the genuine duplicated words from four translated fields.
 *
 * `--apply` to write, DRY BY DEFAULT, unknown flags exit 2.
 *
 * Ruled PROMPT-89 s3. These are TRANSLATION duplications, not extraction noise: the library is not their
 * source and no re-extraction would touch them.
 *
 * ============ WHICH FOUR, AND WHY NOT THE OTHER SIX ============
 *
 *   FIX    AISM-I   72082029  pt-BR  option[2]    "pratica pratica repetida"
 *   FIX    SD-AI-I  89a7d2ef  pt-BR  explanation  "um padrao padrao do desenvolvimento"
 *   FIX    SM-AI-II 417f066d  pt-BR  explanation  "o padrao padrao"
 *   FIX    SM-AI-II 2aa4ad77  es-419 explanation  "pregunta pregunta"   (secure: internal, not served)
 *
 *   LEAVE  "La muestra muestra que"        noun then verb -- correct Spanish
 *   LEAVE  "e nao nao conformidades"       "and not nonconformities" -- correct Portuguese
 *   LEAVE  "cada una una no conformidad"   "each one, one nonconformity" -- correct Spanish
 *
 * THE RULING SAID THREE `padrao padrao` ROWS AND I FIND TWO. Reported rather than reconciled by guessing:
 * the sweep's own enumeration is in SERVED-NOISE-SWEEP.json and lists two, plus the `pratica` row, which
 * may be the third the ruling had in mind. Four rows are fixed either way and the count is stated.
 *
 * ============ THE EDIT IS THE NARROWEST POSSIBLE ============
 *
 * One doubled pair becomes one word. Asserted per row BEFORE the write: the matched pair occurs exactly
 * once, and the new text is shorter by exactly one word plus one space. A translated field is reviewed
 * text, and every regenerated word is an unreviewed word -- so nothing here regenerates anything.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";

let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply (dry by default; `--dry` is not a flag here).");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

/* the doubled WORD per row, not the pair: the pair is derived, so a typo cannot silently widen the edit */
const TARGETS = [
  { cert: "AISM-I", prefix: "72082029", lang: "pt-BR", field: "option[2]", word: "prática" },
  { cert: "SD-AI-I", prefix: "89a7d2ef", lang: "pt-BR", field: "explanation", word: "padrão" },
  { cert: "SM-AI-II", prefix: "417f066d", lang: "pt-BR", field: "explanation", word: "padrão" },
  /* ============ 2aa4ad77 IS NOT A DUPLICATION AND IS NOT FIXED ============
   *
   * The ruling listed "pregunta pregunta" with the genuine ones. Read in full it is NOUN then VERB:
   *
   *   "...pero la pregunta pregunta que es lo mas problematico..."   the question ASKS what is most...
   *
   * -- the same homograph pattern as "la muestra muestra que", which the same ruling correctly says to
   * leave alone. Removing a word would produce "la pregunta que es", which has no verb: the edit would
   * BREAK a correct sentence. Left out and reported. */
];

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&order=code");
const idOfCert = new Map(certs.map((c) => [c.code, c.id]));

const plan = [];
for (const t of TARGETS) {
  const rows = await getAll(KEY, "quiz_questions?select=id,language,question_group_id,question_text," +
    "options,explanation,pool,status,visibility,is_exam_scope,retired_at&certification_id=eq." +
    idOfCert.get(t.cert) + "&language=eq." + t.lang + "&order=id");
  const row = rows.find((r) => String(r.id).startsWith(t.prefix));
  if (!row) { console.error("ABORT: " + t.cert + " " + t.prefix + " (" + t.lang + ") not found"); process.exit(2); }
  const before = t.field === "explanation" ? row.explanation
    : ((row.options || [])[Number(/\[(\d+)\]/.exec(t.field)[1])] || {}).text;
  const pair = t.word + " " + t.word;
  const n = String(before).split(pair).length - 1;
  if (n !== 1) {
    console.error("ABORT: " + t.prefix + " " + t.field + " contains the pair " + JSON.stringify(pair) +
      " " + n + " time(s); expected exactly 1. A wider edit is not what was ruled.");
    process.exit(2);
  }
  const after = String(before).replace(pair, t.word);
  if (after.length !== String(before).length - (t.word.length + 1)) {
    console.error("ABORT: " + t.prefix + " the edit changed the length by an unexpected amount.");
    process.exit(2);
  }
  plan.push({ ...t, row, before, after, pair });
}

console.log("rows to fix: " + plan.length + "   (ruled 4; pregunta pregunta is noun+verb and is NOT fixed)");
console.log("");
for (const p2 of plan) {
  console.log("  " + p2.cert.padEnd(9) + p2.prefix + "  " + p2.lang.padEnd(7) + p2.field.padEnd(12) +
    "pool=" + p2.row.pool + "  status=" + p2.row.status);
  console.log("      BEFORE ..." + p2.before.slice(Math.max(0, p2.before.indexOf(p2.pair) - 46),
    p2.before.indexOf(p2.pair) + 54).replace(/\s+/g, " ") + "...");
  console.log("      AFTER  ..." + p2.after.slice(Math.max(0, p2.after.indexOf(p2.word) - 46),
    p2.after.indexOf(p2.word) + 46).replace(/\s+/g, " ") + "...");
}

if (!APPLY) {
  console.log("\nDRY RUN -- nothing written. Re-run with --apply.");
} else {
  for (const p2 of plan) {
    const body = {};
    if (p2.field === "explanation") body.explanation = p2.after;
    else {
      const i = Number(/\[(\d+)\]/.exec(p2.field)[1]);
      const opts = JSON.parse(JSON.stringify(p2.row.options));
      opts[i].text = p2.after;
      body.options = opts;
    }
    /* every write names the three columns the standing rule requires, unchanged, so a default cannot
     * decide one of them behind this edit */
    body.status = p2.row.status;
    body.visibility = p2.row.visibility;
    body.is_exam_scope = p2.row.is_exam_scope;
    const res = await fetch(REST_URL + "/quiz_questions?id=eq." + p2.row.id, {
      method: "PATCH",
      headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json",
        Prefer: "return=representation" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("patch failed on " + p2.prefix + ": " + res.status + " " + (await res.text()));
    const got = await res.json();
    if (got.length !== 1) throw new Error("patch touched " + got.length + " rows on " + p2.prefix);
  }
  console.log("\npatched " + plan.length + " row(s)");

  /* ---- read back, each beside its ENGLISH SIBLING ---- */
  let fails = 0;
  const ok = (what, cond, detail) => {
    console.log((cond ? "  ok   " : "  FAIL ") + what + (detail && !cond ? "   " + detail : ""));
    if (!cond) fails++;
  };
  console.log("\nread-back:");
  const report = [];
  for (const p2 of plan) {
    const rows = await getAll(KEY, "quiz_questions?select=id,language,question_group_id,question_text," +
      "options,explanation,pool,status,visibility,is_exam_scope&certification_id=eq." +
      idOfCert.get(p2.cert) + "&order=id");
    const live = rows.find((r) => r.id === p2.row.id);
    const now = p2.field === "explanation" ? live.explanation
      : ((live.options || [])[Number(/\[(\d+)\]/.exec(p2.field)[1])] || {}).text;
    ok(p2.prefix + " " + p2.field + " no longer carries " + JSON.stringify(p2.pair),
      !String(now).includes(p2.pair));
    ok(p2.prefix + " reads exactly as planned", String(now) === p2.after);
    ok(p2.prefix + " status/visibility/is_exam_scope unchanged",
      live.status === p2.row.status && live.visibility === p2.row.visibility &&
      live.is_exam_scope === p2.row.is_exam_scope);
    /* the sibling: same group, English */
    const sib = rows.find((r) => r.question_group_id && r.question_group_id === p2.row.question_group_id &&
      r.language === "en");
    ok(p2.prefix + " has an English sibling to read beside", Boolean(sib));
    const sibText = sib ? (p2.field === "explanation" ? sib.explanation
      : ((sib.options || [])[Number(/\[(\d+)\]/.exec(p2.field)[1])] || {}).text) : null;
    console.log("      " + p2.lang + ": " + String(now).replace(/\s+/g, " ").slice(0, 150));
    console.log("      en   : " + String(sibText || "(no sibling)").replace(/\s+/g, " ").slice(0, 150));
    report.push({ cert: p2.cert, id: p2.prefix, lang: p2.lang, field: p2.field, word: p2.word,
      after: now, english_sibling: sibText });
  }
  writeFileSync(join(ROOT, "TRANSLATION-DOUBLINGS-FIXED.json"), JSON.stringify({
    ruled: "PROMPT-89 s3", fixed: report,
    left_alone: ["La muestra muestra que -- noun then verb",
      "e nao nao conformidades -- 'and not nonconformities'",
      "cada una una no conformidad -- 'each one, one nonconformity'"],
  }, null, 1) + String.fromCharCode(10), "utf8");
  console.log("\nwrote TRANSLATION-DOUBLINGS-FIXED.json");
  if (fails) { console.error("\n" + fails + " read-back assertion(s) FAILED"); process.exitCode = 1; }
}
