#!/usr/bin/env node
/**
 * rebalance-inserted-key-order.mjs -- apply balanced key order to the grounded rows already in the bank.
 *
 * `--apply` writes. DRY BY DEFAULT, printing the before/after distribution. Unknown flags exit 2.
 *
 * Ruled PROMPT-95 s1d, CONDITIONAL on s1a confirming none has been served. That condition is not taken on
 * trust: this script re-runs the serving audit itself and refuses if it does not pass.
 *
 * ============ WHY THIS IS SAFE TO DO IN PLACE ============
 *
 *   the rows are `status = pending_review`   no form selects them (generate-mock-exam:280)
 *   the rows are `pool = secure`             the practice grader refuses them outright (submit-quiz-answer:100)
 *   grading compares id SETS                 score-mock-exam:129, submit-quiz-answer:106
 *   nothing has recorded an answer to them   asserted here against exam_session_items
 *
 * The last is the one that matters and it is MEASURED, not reasoned: if any candidate had ever been served
 * one of these ids, reordering it would change what their recorded answer means. A row with an answer on
 * record is REFUSED individually rather than aborting the batch, so one served row cannot block the other 48.
 *
 * ============ AND THE EXPLANATION GATE RUNS FIRST ============
 *
 * s1b's order: an explanation naming an option by letter must be fixed BEFORE the order moves, or the
 * rewrite has to be done against a letter that has already changed. The gate is re-run here and a row that
 * still names an option is refused.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, getAllIn, REST_URL } from "./_pg.mjs";
import { balanceKeyOrder, balancedKeyOrderControls } from "./lib/balanced-key-order.mjs";
import { explanationOptionRef } from "./lib/explanation-option-ref.mjs";

let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply (dry by default; `--dry` is not a flag here).");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const idOf = (t) => createHash("sha256").update(String(t || "").replace(/\s+/g, " ").trim())
  .digest("hex").slice(0, 8);

/* ---- the permutation's own controls, before anything is read ---- */
{
  const c = balancedKeyOrderControls();
  const bad = c.filter((x) => !x.pass);
  console.log("BALANCED-ORDER CONTROLS  " + (c.length - bad.length) + " of " + c.length + " pass");
  for (const x of bad) console.log("  FAIL " + x.what + "   " + x.detail);
  if (bad.length) { console.error("\nNOTHING WRITTEN: the permutation is broken."); process.exit(2); }
}
/* ---- the s1a precondition, RE-RUN rather than assumed ---- */
{
  let out = "";
  try {
    out = execFileSync(process.execPath, [join(HERE, "audit-question-serving-paths.mjs")],
      { encoding: "utf8" });
  } catch (e) {
    console.error("NOTHING WRITTEN: the serving audit could not run -- " + (e && e.message));
    console.error("A step that could not start is not a step that passed.");
    process.exit(2);
  }
  const ok = /CANNOT reach a candidate/.test(out);
  console.log("SERVING AUDIT             " + (ok ? "pass -- no pending_review row can reach a candidate"
    : "FAIL"));
  if (!ok) {
    console.error("\nNOTHING WRITTEN: s1d is conditional on s1a, and s1a does not pass.");
    process.exit(2);
  }
}
console.log("");

const KEY = requireKey(HERE);
const ig = await getAll(KEY, "item_grounding?select=question_id&order=question_id");
const rows = await getAllIn(KEY, "quiz_questions",
  "id,question_text,options,correct_answer,explanation,task_id,status,pool,retired_at", "id",
  ig.map((g) => g.question_id), "&order=id");
const tasks = await getAll(KEY, "tasks?select=id,code&order=code");
const taskCode = new Map(tasks.map((t) => [t.id, t.code]));

/* ---- HAS ANY OF THESE EVER BEEN SERVED? Measured against the session record. ---- */
const servedIds = new Set();
{
  const ids = rows.map((r) => r.id);
  const si = await getAllIn(KEY, "exam_session_items", "question_id", "question_id", ids, "&order=question_id");
  for (const r of si) servedIds.add(r.question_id);
}
console.log("POPULATION");
console.log("  grounded rows in the bank        " + rows.length);
console.log("  of those, ever served to anyone  " + servedIds.size +
  (servedIds.size ? "   <- REFUSED individually; reordering would change what a recorded answer means"
    : "   (exam_session_items holds none of them)"));

const beforeTally = {};
for (const r of rows) {
  const ca = Array.isArray(r.correct_answer) ? r.correct_answer[0] : r.correct_answer;
  const i = (r.options || []).findIndex((o) => String(o.id) === String(ca));
  if (i >= 0) beforeTally[String.fromCharCode(97 + i)] = (beforeTally[String.fromCharCode(97 + i)] || 0) + 1;
}
const show = (t, n) => ["a", "b", "c", "d"].map((L) => L.toUpperCase() + ":" + (t[L] || 0) +
  " (" + (n ? Math.round(((t[L] || 0) / n) * 100) : 0) + "%)").join("  ");
console.log("  key position BEFORE              " + show(beforeTally, rows.length));
console.log("");

/* ---- plan, per task, in a deterministic row order ---- */
const byTask = new Map();
for (const r of rows.slice().sort((a, b) => String(a.id).localeCompare(String(b.id)))) {
  const code = taskCode.get(r.task_id) || "?";
  if (!byTask.has(code)) byTask.set(code, []);
  byTask.get(code).push(r);
}
const plan = [];
let refused = 0;
for (const [code, list] of [...byTask.entries()].sort()) {
  let seq = 0;
  for (const r of list) {
    const id = idOf(r.question_text);
    if (servedIds.has(r.id)) {
      console.log("  REFUSED " + id + " (" + code + "): it has been served, so its order is frozen");
      refused++; continue;
    }
    const v = explanationOptionRef({ explanation: r.explanation });
    if (!v.pass) {
      console.log("  REFUSED " + id + " (" + code + "): its explanation still names an option -- " +
        v.hits.map((h) => h.rule).join(", ") + ". Fix s1b first.");
      refused++; continue;
    }
    /* the row's options carry {id, text}; balanceKeyOrder wants is_correct, so it is derived from
     * correct_answer -- the live schema's own key, never a position. */
    const ca = Array.isArray(r.correct_answer) ? r.correct_answer[0] : r.correct_answer;
    const opts = (r.options || []).map((o) => ({ text: o.text, is_correct: String(o.id) === String(ca) }));
    if (!opts.some((o) => o.is_correct)) {
      console.log("  REFUSED " + id + " (" + code + "): correct_answer resolves to no option");
      refused++; continue;
    }
    const b = balanceKeyOrder({ question_text: r.question_text, options: opts }, seq++, id, code);
    plan.push({ row: r, id, code, balanced: b });
  }
}
const afterTally = {};
for (const p of plan) afterTally[p.balanced.keyId] = (afterTally[p.balanced.keyId] || 0) + 1;
console.log("");
console.log("PLAN");
console.log("  rows to rebalance                " + plan.length + (refused ? "   (" + refused + " refused)" : ""));
console.log("  key position AFTER               " + show(afterTally, plan.length));
console.log("  chance for a 4-option item       25%");
console.log("");
if (!APPLY) {
  console.log("DRY RUN -- nothing written. Re-run with --apply.");
  process.exit(0);
}

let patched = 0, bad = 0;
for (const p of plan) {
  const body = {
    options: p.balanced.item.options.map((o) => ({ id: o.id, text: o.text })),
    correct_answer: [p.balanced.keyId],
  };
  const res = await fetch(REST_URL + "/quiz_questions?id=eq." + p.row.id, {
    method: "PATCH",
    headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json",
      Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("patch failed on " + p.id + ": " + res.status + " " + (await res.text()));
  const got = await res.json();
  if (got.length !== 1) throw new Error("patch touched " + got.length + " row(s) on " + p.id);
  const back = got[0];
  /* ---- READ BACK AND ASSERT, per row: the same texts, the key on the same text, the stem untouched ---- */
  const beforeTexts = (p.row.options || []).map((o) => String(o.text)).sort();
  const afterTexts = (back.options || []).map((o) => String(o.text)).sort();
  const caBack = Array.isArray(back.correct_answer) ? back.correct_answer[0] : back.correct_answer;
  const keyBack = (back.options || []).find((o) => String(o.id) === String(caBack));
  const problems = [];
  if (JSON.stringify(beforeTexts) !== JSON.stringify(afterTexts)) problems.push("the option texts changed");
  if (!keyBack) problems.push("correct_answer resolves to no option");
  else if (String(keyBack.text) !== p.balanced.keyText) problems.push("correct_answer points at different text");
  if (back.question_text !== p.row.question_text) problems.push("the stem changed");
  if (back.explanation !== p.row.explanation) problems.push("the explanation changed");
  const ids = (back.options || []).map((o) => o.id).join("");
  if (ids !== "abcd".slice(0, (back.options || []).length)) problems.push("ids are not a..d in display order: " + ids);
  if (problems.length) { console.error("  POST-CONDITION FAIL " + p.id + ": " + problems.join("; ")); bad++; }
  patched++;
}
console.log("patched " + patched + ", post-condition failures " + bad);
if (bad) process.exitCode = 1;

/* the live distribution, read back independently of this script's own plan */
const after = await getAllIn(KEY, "quiz_questions", "id,options,correct_answer", "id",
  rows.map((r) => r.id), "&order=id");
const liveTally = {};
for (const r of after) {
  const ca = Array.isArray(r.correct_answer) ? r.correct_answer[0] : r.correct_answer;
  const i = (r.options || []).findIndex((o) => String(o.id) === String(ca));
  if (i >= 0) liveTally[String.fromCharCode(97 + i)] = (liveTally[String.fromCharCode(97 + i)] || 0) + 1;
}
console.log("key position READ BACK            " + show(liveTally, after.length));
