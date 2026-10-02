#!/usr/bin/env node
/**
 * PROMPT-102 s1: record the director's 35 pilot verdicts on item_grounding.
 * WRITES. `--apply`; dry by default. `--phase=accepts|reject|conditional`. Unknown flags exit 2.
 * Ids are question_id UUID PREFIXES, not stem hashes -- the pilot doc uses `q.id.slice(0,8)`.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { gateItemOf, id8, storedItemControls } from "./lib/stored-item.mjs";
import { runCodeGates } from "./lib/grounded-gates.mjs";

const RULED_ON = "2026-10-02T00:00:00Z";
const REVIEWER = "director";
const NOTE = "ruled_in: PROMPT-102 s1 -- read item by item against the PDF.";

let APPLY = false, PHASE = null;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  const m = a.match(/^--phase=(accepts|reject|conditional)$/);
  if (m) { PHASE = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply, --phase=accepts|reject|conditional.");
  process.exit(2);
}
if (!PHASE) { console.error("--phase is required: accepts | reject | conditional"); process.exit(2); }

const ACCEPT = ("017478b5 9cbef19e 7256f658 4acadf6b ce86479f 3359b050 4467ac24 e641c343 d124df3c 1f2f7dc7 " +
  "3ca45f4c 1ea0ea64 ab040514 4024c897 d48a4f53 594c7d73 82edb6a3 9bd5796f 333a50d8 8cf14ae1 a287616d " +
  "169fb07b ef2a9c5d 99524730 4b317d6c 17f802fb fd65b423 f93d06cc 07561e42 8d1e4481 d16bcf46 602cab35").split(/\s+/);
const COND = ["9ecce8e5", "4c69db20"];
const REJECT = ["cdde7e6b"];

const KEY = requireKey(dirname(fileURLToPath(import.meta.url)));
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

const ctl = storedItemControls();
if (ctl.fails.length) { console.error("ADAPTER CONTROLS FAILED: " + ctl.fails.join("; ")); process.exit(2); }

const cert = (await getAll(KEY, "certifications?select=id&code=eq.AIMS-F"))[0];
const qs = await getAll(KEY, "quiz_questions?select=id,question_text,options,correct_answer,status," +
  "is_exam_scope,visibility,pool,task_id&certification_id=eq." + cert.id +
  "&language=eq.en&retired_at=is.null&order=id");
const before = await getAll(KEY, "item_grounding?select=question_id,review_verdict,reviewed_by&order=question_id");
const igIds = new Set(before.map((g) => g.question_id));
const vOf = new Map(before.map((g) => [g.question_id, g.review_verdict]));

/* VALIDATE BEFORE WRITING: every id resolves to exactly one grounded row, or nothing happens. */
const resolve = (list) => {
  const out = [], bad = [];
  for (const p of list) {
    const hits = qs.filter((q) => q.id.startsWith(p));
    if (hits.length !== 1) { bad.push(p + " -> " + hits.length + " rows"); continue; }
    if (!igIds.has(hits[0].id)) { bad.push(p + " -> no item_grounding row"); continue; }
    out.push({ p, q: hits[0] });
  }
  return { out, bad };
};

const targets = PHASE === "accepts" ? ACCEPT : PHASE === "reject" ? REJECT : COND;
const { out: plan, bad } = resolve(targets);
console.log("PHASE " + PHASE + ": " + targets.length + " ruled, " + plan.length + " resolved, " + bad.length + " unresolved");
for (const b of bad) console.log("   " + b);
if (bad.length) { console.error("REFUSING: unresolved ids. Nothing written."); process.exit(2); }

/* The conditional phase RE-GATES here: accept is recorded only if the gates are clean NOW.
 * A verdict recorded on the strength of a gate run in another process is a verdict on a memory. */
if (PHASE === "conditional") {
  const { buildGateContext } = await import("./lib/gate-context.mjs");
  const ctx = await buildGateContext(KEY, "AIMS-F");
  const dirty = [];
  for (const p of plan) {
    const row = ctx.rows.find((r) => r.id === p.q.id);
    const r = ctx.gateRow(row);
    console.log("  " + p.p + "  passed=" + r.passed +
      (r.failed.length ? "  FAILED[" + r.failed.join(",") + "]" : "") +
      (r.unasserted.length ? "  UNASSERTED[" + r.unasserted.join(",") + "]" : ""));
    if (!r.passed) dirty.push(p.p + " [" + r.failed.join(",") + "]");
  }
  if (dirty.length) {
    console.error("REFUSING: the ruling says accept only if the gates are clean. Still failing: " + dirty.join("; "));
    process.exit(2);
  }
}

const bodyFor = (verdict) => JSON.stringify({
  review_verdict: verdict, reviewed_by: REVIEWER, reviewed_at: RULED_ON, review_note: NOTE,
});

if (!APPLY) {
  console.log("");
  for (const p of plan) console.log("  " + p.p + "  verdict now=" + (vOf.get(p.q.id) ?? "none") +
    "  status=" + p.q.status + "  is_exam_scope=" + p.q.is_exam_scope);
  console.log("");
  console.log("DRY RUN. Nothing written. Re-run with --apply.");
  process.exitCode = 0;
} else {
  const verdict = PHASE === "reject" ? "reject" : "accept";
  let done = 0;
  for (const p of plan) {
    const r = await fetch(REST_URL + "/item_grounding?question_id=eq." + p.q.id,
      { method: "PATCH", headers: H, body: bodyFor(verdict) });
    if (!r.ok) { console.error("  FAILED " + p.p + "  HTTP " + r.status + "  " + (await r.text()).slice(0, 200)); continue; }
    done++;
  }
  /* The reject also moves the ROW, and status/visibility/is_exam_scope are named on the write. */
  if (PHASE === "reject") {
    for (const p of plan) {
      const r = await fetch(REST_URL + "/quiz_questions?id=eq." + p.q.id, {
        method: "PATCH", headers: H,
        body: JSON.stringify({ status: "rejected", visibility: p.q.visibility, is_exam_scope: false }),
      });
      if (!r.ok) console.error("  ROW PATCH FAILED " + p.p + "  HTTP " + r.status + "  " + (await r.text()).slice(0, 200));
    }
  }

  /* POST-CONDITIONS, BOTH DIRECTIONS, as a BEFORE/AFTER comparison rather than a literal count. */
  const after = await getAll(KEY, "item_grounding?select=question_id,review_verdict,reviewed_by,reviewed_at&order=question_id");
  const want = new Set(plan.map((p) => p.q.id));
  const got = after.filter((g) => want.has(g.question_id) && g.review_verdict === verdict &&
    g.reviewed_by === REVIEWER && String(g.reviewed_at).startsWith("2026-10-02"));
  const moved = after.filter((g) => !want.has(g.question_id) && (vOf.get(g.question_id) ?? null) !== g.review_verdict);
  console.log("");
  console.log("  wrote           " + done + " of " + plan.length);
  console.log("  read back       " + got.length + " carrying " + verdict + " by " + REVIEWER + " on the ruling date");
  console.log("  rows MOVED outside the plan (must be 0): " + moved.length);
  for (const g of moved.slice(0, 5)) console.log("     " + String(g.question_id).slice(0, 8));
  if (PHASE === "reject") {
    const rows = await getAll(KEY, "quiz_questions?select=id,status,visibility,is_exam_scope&id=in.(" +
      plan.map((p) => p.q.id).join(",") + ")&order=id");
    for (const r of rows) console.log("  ROW READ BACK  " + r.id.slice(0, 8) + "  status=" + r.status +
      "  visibility=" + r.visibility + "  is_exam_scope=" + r.is_exam_scope);
    const wrong = rows.filter((r) => r.status !== "rejected" || r.is_exam_scope !== false);
    if (wrong.length) { console.error("POST-CONDITION FAILED: a rejected row is still in scope."); process.exitCode = 2; }
  }
  if (got.length !== plan.length || moved.length) { console.error("POST-CONDITION FAILED."); process.exitCode = 2; }
  else console.log("RECORDED. A verdict is not a gate -- accepted rows are still pending_review.");
}
