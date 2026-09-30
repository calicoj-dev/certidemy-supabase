#!/usr/bin/env node
/**
 * apply-97-accept-verdicts.mjs -- record the director's 46 `accept` verdicts on the rows they belong to.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 * ============ WHY THIS IS A SEPARATE STEP FROM THE INSERT ============
 *
 * A verdict needs a `question_id`, and the insert is what creates it. Writing the verdict inside the insert
 * would also mean the generator recording a human judgement, and the generator is the one caller in this
 * repository that must never do that: `check-hash-writers` exists because a script that both authors and
 * clears is the defect in its purest form.
 *
 * ============ IT DEPENDS ON MIGRATION 385 AND SAYS SO INSTEAD OF FAILING OBSCURELY ============
 *
 * 379's verdict vocabulary is `read | tier_a | tier_b | tier_c`. `accept` is not in it, so every write here is
 * refused by a CHECK until 385 has run. The first row is attempted alone and a check violation stops the run
 * with the remedy named -- so the failure says *apply migration 385* rather than *23514*.
 *
 * VALIDATE BEFORE WRITING, so an abort means nothing landed: every id is resolved to exactly one bank row and
 * every row is confirmed to have an `item_grounding` row BEFORE the first PATCH.
 *
 * ============ THE DATE IS THE RULING'S, NOT THE SCRIPT'S ============
 *
 * `reviewed_at` records when the director read the items, which is when he ruled -- not when this script
 * happened to run. A timestamp taken from the clock would make a re-run of the recorder look like a second
 * read.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { itemIdOfStem } from "./lib/item-id.mjs";

const RULED_ON = "2026-09-30T00:00:00Z";     /* PROMPT-97 addendum */
const REVIEWER = "director";

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
const qs = await getAll(KEY,
  "quiz_questions?select=id,question_text,task_id,status&certification_id=eq." + cert.id +
  "&language=eq.en&retired_at=is.null&order=id");
const tasks = await getAll(KEY, "tasks?select=id,code&order=code");
const codeOf = new Map(tasks.map((t) => [t.id, t.code]));
const ig = new Set((await getAll(KEY, "item_grounding?select=question_id&order=question_id"))
  .map((g) => g.question_id));

/* ---- resolve, and refuse on ANY ambiguity before writing ---- */
const byStem = new Map();
for (const q of qs) {
  const id = itemIdOfStem(q.question_text);
  if (!byStem.has(id)) byStem.set(id, []);
  byStem.get(id).push(q);
}
const plan = [], fails = [];
for (const a of V.accept) {
  const hits = byStem.get(a.id) || [];
  if (hits.length !== 1) {
    fails.push(a.id + " (task " + a.task + "): resolves to " + hits.length + " bank row(s)" +
      (hits.length ? " -- a duplicate stem, which a verdict cannot be attached to unambiguously" : " -- not inserted"));
    continue;
  }
  const q = hits[0];
  if (!ig.has(q.id)) { fails.push(a.id + ": the row has no item_grounding row to carry a verdict"); continue; }
  if (codeOf.get(q.task_id) !== a.task) {
    fails.push(a.id + ": the ruling says task " + a.task + ", the row is task " + codeOf.get(q.task_id));
    continue;
  }
  plan.push({ id8: a.id, question_id: q.id, task: a.task, clause: a.clause, run: a.run });
}
console.log("ACCEPT VERDICTS TO RECORD");
console.log("  in the ruling      " + V.accept.length);
console.log("  resolved cleanly   " + plan.length);
console.log("  unresolved         " + fails.length);
for (const f of fails) console.log("    " + f);
if (fails.length) {
  console.error("");
  console.error("REFUSING: every accepted item must resolve to exactly one grounded bank row. Nothing written.");
  process.exit(2);
}
if (!APPLY) {
  console.log("");
  console.log("DRY RUN. Nothing written. Re-run with --apply.");
  console.log("Requires migration 385 (the vocabulary has no `accept` until it runs).");
  process.exit(0);
}

/* ---- the first row alone, so a missing migration costs one refused request and not 46 ---- */
const body = (note) => JSON.stringify({ review_verdict: "accept", reviewed_by: REVIEWER,
  reviewed_at: RULED_ON, review_note: note });
const note = "PROMPT-97 addendum s2: read with R4/R5 and accepted for insert.";
let done = 0;
{
  const p = plan[0];
  const r = await fetch(REST_URL + "/item_grounding?question_id=eq." + p.question_id,
    { method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: body(note) });
  const t = await r.text();
  if (!r.ok) {
    console.error("THE FIRST WRITE WAS REFUSED, so the other " + (plan.length - 1) + " were not attempted.");
    console.error("  HTTP " + r.status + "  " + t.slice(0, 300));
    if (/violates check constraint|23514/.test(t)) {
      console.error("");
      console.error("THIS IS THE VOCABULARY, NOT THE DATA: `accept` is not in 379's verdict CHECK.");
      console.error("Apply migrations/385_item_review_verdict_accept_reject.sql in the SQL editor, then re-run.");
    }
    process.exit(2);
  }
  done++;
}
for (const p of plan.slice(1)) {
  const r = await fetch(REST_URL + "/item_grounding?question_id=eq." + p.question_id,
    { method: "PATCH", headers: H, body: body(note) });
  if (!r.ok) { console.error("  FAILED " + p.id8 + "  HTTP " + r.status + "  " + (await r.text()).slice(0, 160)); continue; }
  done++;
}

/* ---- POST-CONDITIONS, BOTH DIRECTIONS ---- */
const after = await getAll(KEY, "item_grounding?select=question_id,review_verdict,reviewed_by,reviewed_at&order=question_id");
const want = new Set(plan.map((p) => p.question_id));
const got = after.filter((g) => want.has(g.question_id) && g.review_verdict === "accept");
const wrongReviewer = got.filter((g) => g.reviewed_by !== REVIEWER);
/* THE NEGATIVE HALF: nothing OUTSIDE the plan may have become `accept`. A positive-only check passes on an
 * update that also touched a neighbour, which is the failure a filtered PATCH makes easy. */
const strays = after.filter((g) => g.review_verdict === "accept" && !want.has(g.question_id));
console.log("");
console.log("  wrote           " + done + " of " + plan.length);
console.log("  read back       " + got.length + " carrying accept");
console.log("  wrong reviewer  " + wrongReviewer.length);
console.log("  STRAY accepts   " + strays.length + "   (rows outside the ruling that now read accept)");
if (got.length !== plan.length || strays.length || wrongReviewer.length) {
  console.error("POST-CONDITION FAILED.");
  process.exitCode = 2;
} else {
  const still = after.filter((g) => g.review_verdict === "read").length;
  console.log("  the 34 earlier `read` verdicts are untouched: " + still + " still read");
  console.log("RECORDED. A verdict is not a gate -- every one of these rows is still pending_review.");
}
