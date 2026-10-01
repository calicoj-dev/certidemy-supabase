#!/usr/bin/env node
/**
 * set-exam-scope-r4r5.mjs -- is_exam_scope = true on the 46 R4/R5 rows.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 * Ruled PROMPT-98 s2: *"set it to true now, to match the 114 already in. `pending_review` already keeps them
 * out of every form, so exam scope only says which pool they're meant for, and it should be consistent now
 * rather than fixed at approval."*
 *
 * I had left it false, which was the defensible default and the wrong consistency: the 114 rows inserted before
 * these carry true, so the bank held two answers to one question about one pool.
 *
 * ============ THE SET IS THE RULING'S, RESOLVED, NOT "EVERY ROW WITH false" ============
 *
 * Writing to every grounded row whose flag is false would be a different change: it would catch anything that
 * ends up false for a reason nobody has looked at. The 46 are resolved from `AIMSF-97-VERDICTS.json`, the same
 * artifact the verdicts were written from, so this write covers exactly the set the director accepted.
 *
 * The post-condition then asserts the BROADER property he asked for -- zero grounded AIMS-F rows with
 * `is_exam_scope = false` -- which is the check that would catch a row the narrow set missed.
 *
 * ============ EVERY COLUMN A DEFAULT COULD DECIDE IS NAMED ON THE WRITE ============
 *
 * Standing rule. `quiz_questions` defaults are `status='approved'`, `visibility='secure'`,
 * `is_exam_scope=true` -- and a PATCH that named only `is_exam_scope` would leave status and visibility to
 * whatever is there, which is correct today and is not something to rely on. All three are written explicitly
 * and read back, so the row cannot be left in a state nobody chose.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { itemIdOfStem } from "./lib/item-id.mjs";

let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply (dry by default).");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

const V = JSON.parse(readFileSync(join(ROOT, "AIMSF-97-VERDICTS.json"), "utf8"));
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F"))[0];
const qs = await getAll(KEY, "quiz_questions?select=id,question_text,task_id,status,visibility," +
  "is_exam_scope,pool&certification_id=eq." + cert.id + "&language=eq.en&retired_at=is.null&order=id");
const ig = new Set((await getAll(KEY, "item_grounding?select=question_id&order=question_id"))
  .map((g) => g.question_id));
const byStem = new Map();
for (const q of qs) {
  const id = itemIdOfStem(q.question_text);
  if (!byStem.has(id)) byStem.set(id, []);
  byStem.get(id).push(q);
}

const plan = [], fails = [];
for (const a of V.accept) {
  const hits = byStem.get(a.id) || [];
  if (hits.length !== 1) { fails.push(a.id + ": " + hits.length + " bank row(s)"); continue; }
  const q = hits[0];
  if (!ig.has(q.id)) { fails.push(a.id + ": no item_grounding row"); continue; }
  plan.push({ id8: a.id, q });
}
console.log("is_exam_scope = true ON THE 46 R4/R5 ROWS");
console.log("");
console.log("  in the ruling      " + V.accept.length);
console.log("  resolved           " + plan.length);
console.log("  unresolved         " + fails.length);
for (const f of fails) console.log("    " + f);
if (fails.length) { console.error("REFUSING: nothing written."); process.exit(2); }
const already = plan.filter((p) => p.q.is_exam_scope === true).length;
console.log("  already true       " + already);
console.log("  to change          " + (plan.length - already));
/* the states these rows are in BEFORE the write, so the report says what was named rather than what was assumed */
const before = {};
for (const p of plan) {
  const k = p.q.status + " / " + p.q.visibility + " / " + p.q.pool + " / scope=" + p.q.is_exam_scope;
  before[k] = (before[k] || 0) + 1;
}
console.log("  current state      " + JSON.stringify(before));
if (!APPLY) {
  console.log("");
  console.log("DRY RUN. Nothing written. Re-run with --apply.");
  process.exit(0);
}

let wrote = 0;
for (const p of plan) {
  /* status, visibility and is_exam_scope ALL named, per the standing rule. `pending_review` is re-asserted
   * rather than left alone: this write must not be the thing that promotes a row. */
  const r = await fetch(REST_URL + "/quiz_questions?id=eq." + p.q.id, {
    method: "PATCH", headers: H,
    body: JSON.stringify({ status: "pending_review", visibility: "secure", is_exam_scope: true }),
  });
  if (!r.ok) { console.error("  FAILED " + p.id8 + " HTTP " + r.status + " " + (await r.text()).slice(0, 120)); continue; }
  wrote++;
}

/* ---- READ BACK, all 46, every named column ---- */
const after = await getAll(KEY, "quiz_questions?select=id,status,visibility,is_exam_scope,pool" +
  "&certification_id=eq." + cert.id + "&language=eq.en&retired_at=is.null&order=id");
const aBy = new Map(after.map((q) => [q.id, q]));
const bad = [];
for (const p of plan) {
  const q = aBy.get(p.q.id);
  if (!q) { bad.push(p.id8 + ": gone"); continue; }
  if (q.is_exam_scope !== true) bad.push(p.id8 + ": is_exam_scope=" + q.is_exam_scope);
  if (q.status !== "pending_review") bad.push(p.id8 + ": status=" + q.status);
  if (q.visibility !== "secure") bad.push(p.id8 + ": visibility=" + q.visibility);
  if (q.pool !== "secure") bad.push(p.id8 + ": pool=" + q.pool);
}
/* ---- THE BROADER PROPERTY HE ASKED FOR: zero grounded rows left false ---- */
const stillFalse = after.filter((q) => ig.has(q.id) && q.is_exam_scope === false);
console.log("");
console.log("  wrote              " + wrote + " of " + plan.length);
console.log("  read back clean    " + (plan.length - bad.length) + " of " + plan.length);
for (const b of bad) console.log("    " + b);
console.log("  grounded AIMS-F rows with is_exam_scope = false:  " + stillFalse.length + "   (must be 0)");
for (const q of stillFalse.slice(0, 10)) console.log("    " + q.id.slice(0, 8));
/* AND THE NEGATIVE HALF: nothing outside the 46 changed status or visibility. A PATCH that named three
 * columns on 46 ids could have touched a 47th only through a bad filter, and a positive-only check passes. */
const planIds = new Set(plan.map((p) => p.q.id));
let strays = 0;
for (const q of qs) {
  if (planIds.has(q.id)) continue;
  const now = aBy.get(q.id);
  if (!now) continue;
  if (now.status !== q.status || now.visibility !== q.visibility || now.is_exam_scope !== q.is_exam_scope) {
    console.error("  STRAY: " + q.id.slice(0, 8) + " changed outside the plan");
    strays++;
  }
}
console.log("  strays             " + strays + "   (rows outside the 46 whose named columns moved)");
if (bad.length || stillFalse.length || strays || wrote !== plan.length) process.exitCode = 2;
