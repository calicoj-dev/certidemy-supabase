#!/usr/bin/env node
/**
 * fix-letter-refs.mjs -- rewrite a live English explanation that names an option BY LETTER so it names
 * the option's CONTENT. WRITES with `--apply`; dry by default. Unknown flags exit 2.
 *
 * ============ WHY A LETTER REFERENCE IS A DEFECT AND NOT A STYLE ============
 *
 * `options_fixed_order` is FALSE on every row in this bank, so the delivery layer may reorder the
 * options. A letter then names a DIFFERENT option than the one the explanation is diagnosing.
 * `shuffleOptions` remaps letters at insert, which keeps them correct for the stored order and does
 * nothing about the next reshuffle.
 *
 * It has happened twice: once from my own PROMPT-118 rewrite, and once from the writer on three R7
 * items. The translation lint catches it on the siblings and withholds the item, which is what makes
 * it visible -- nothing checks the ENGLISH explanation at generation.
 *
 * ============ DECLARED, RE-GATED, AND A SURVIVING LETTER IS A REFUSAL ============
 *
 * The replacement text is declared per row in a spec file with the exact `from`. After substitution the
 * item is RE-GATED against the live library, and a row whose explanation still matches /option [a-h]/
 * is refused -- the one thing this script must not do is report success over a letter it left behind.
 *
 *   --cert=<CODE>     required
 *   --spec=<file>     required: [{ row, from, to, why }]
 *   --apply           write
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { buildGateContext } from "./lib/gate-context.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let CERT = null, SPEC = null, APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  let m = a.match(/^--cert=(.+)$/); if (m) { CERT = m[1]; continue; }
  m = a.match(/^--spec=(.+)$/); if (m) { SPEC = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --cert=, --spec=, --apply (dry by default).");
  process.exit(2);
}
if (!CERT || !SPEC) { console.error("--cert= and --spec= are both required."); process.exit(2); }
const LETTER = /\boption\s+[a-h]\b/i;

const spec = JSON.parse(readFileSync(join(ROOT, SPEC), "utf8"));
const edits = spec.edits || spec;
const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }
const ctx = await buildGateContext(KEY, CERT);
const SEL = "id,question_text,options,correct_answer,explanation,task_id,language,status,pool," +
  "visibility,is_exam_scope,question_group_id,item_origin,retired_at";
const rows = await getAll(KEY, "quiz_questions?select=" + SEL + "&certification_id=eq." + cert.id +
  "&language=eq.en&retired_at=is.null&order=id");

console.log("FIX LETTER REFS   " + CERT + (APPLY ? "   --apply" : "   dry run (default)") +
  "   " + edits.length + " declared edit(s)");
const plan = [], refused = [];
for (const e of edits) {
  const r = rows.find((x) => x.id === e.row || x.id.startsWith(e.row));
  if (!r) { refused.push({ row: e.row, why: "no live English row" }); continue; }
  if (!String(r.explanation).includes(e.from)) {
    refused.push({ row: e.row, why: "`from` is not in the present explanation" });
    console.log("  " + e.row + "  REFUSED: from does not match");
    console.log("      present: ..." + String(r.explanation).slice(-170));
    continue;
  }
  const next = String(r.explanation).split(e.from).join(e.to);
  if (LETTER.test(next)) {
    refused.push({ row: e.row, why: "a letter reference SURVIVES the replacement: " +
      (LETTER.exec(next) || [])[0] });
    continue;
  }
  /* re-gate with the new explanation, against the library as it is now */
  let v;
  try { v = ctx.gateRow({ ...r, explanation: next }); }
  catch (err) { refused.push({ row: e.row, why: "could not gate: " + err.message.slice(0, 70) }); continue; }
  if (!v.passed) {
    refused.push({ row: e.row, why: "the rewritten item FAILS [" + v.failed.join(",") + "]" });
    continue;
  }
  plan.push({ r, next, e, gates: v });
  console.log("");
  console.log("  " + r.id.slice(0, 8) + "   gates pass after the rewrite");
  console.log("      was: ..." + String(r.explanation).slice(-190));
  console.log("      now: ..." + next.slice(-190));
}
console.log("");
console.log("  to rewrite " + plan.length + "   refused " + refused.length);
for (const x of refused) console.log("      " + x.row + "  " + x.why);
if (refused.length) {
  console.error("");
  console.error("REFUSING THE WHOLE BATCH: a declared edit did not apply cleanly.");
  process.exit(1);
}
if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

const written = [];
for (const p of plan) {
  const res = await fetch(REST_URL + "/quiz_questions?id=eq." + p.r.id, { method: "PATCH",
    headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify({ explanation: p.next }) });
  const text = await res.text();
  if (!res.ok) { console.error("  PATCH failed " + p.r.id.slice(0, 8) + ": " + res.status + " " + text.slice(0, 160)); continue; }
  written.push({ p, back: JSON.parse(text)[0] });
}
console.log("  patched " + written.length + " of " + plan.length);

/* ---------------------------------------------------- POST-CONDITIONS */
console.log("");
console.log("POST-CONDITIONS");
let bad = 0;
for (const { p, back } of written) {
  if (back.explanation !== p.next) { console.log("      explanation not as written on " + p.r.id.slice(0, 8)); bad++; }
  if (LETTER.test(back.explanation)) { console.log("      A LETTER REFERENCE SURVIVES on " + p.r.id.slice(0, 8)); bad++; }
  for (const col of ["status", "pool", "visibility", "is_exam_scope", "question_group_id", "item_origin",
    "question_text", "task_id"]) {
    if (JSON.stringify(back[col]) !== JSON.stringify(p.r[col])) {
      console.log("      " + col + " MOVED on " + p.r.id.slice(0, 8)); bad++;
    }
  }
  if (JSON.stringify(back.options) !== JSON.stringify(p.r.options)) { console.log("      options MOVED on " + p.r.id.slice(0, 8)); bad++; }
  if (JSON.stringify(back.correct_answer) !== JSON.stringify(p.r.correct_answer)) { console.log("      key MOVED on " + p.r.id.slice(0, 8)); bad++; }
}
console.log("  " + (bad ? bad + " VIOLATION(S)" : "all " + written.length + " rows: explanation changed, " +
  "no letter left, every other named column unchanged"));
console.log("");
console.log("  THE SIBLINGS ARE NOW STALE. Re-translate these items so the es-419 and pt-BR explanations");
console.log("  match the corrected English, then re-run the lint.");
if (bad) process.exitCode = 2;
