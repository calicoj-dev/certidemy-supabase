/**
 * annotate-aie-i-attempt.mjs -- record what we now know about attempt 09bf8b45.
 * It changes NOTHING about the result.
 *
 * WRITES. `--apply`; DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ JUAN'S DECISION, 2026-09-26 ============
 *
 * The candidate retook AIE-I the same day, scored 100 and holds AIE-I-UW8V-ZRUY.
 * So: NO score change, NO pass-flag change, NO voucher change. The record should
 * simply say what we now know.
 *
 * This script therefore writes exactly two things:
 *   1. one key MERGED into exam_attempts.integrity_flags
 *   2. one admin_actions row, actor = the platform_admin
 *
 * and asserts afterwards that score_pct, passed, correct_answers, total_questions
 * and the voucher are byte-identical to what they were. An annotation that moved a
 * score would be the opposite of the decision.
 *
 * ============ TRIGGERS: CHECKED BEFORE WRITING, NOT AFTER ============
 *
 * Read out of pg_trigger before this script existed:
 *
 *   exam_attempts user triggers                              0
 *   internal triggers                                       16, all RI_ConstraintTrigger%
 *   internal triggers NOT RI constraint triggers          none
 *   RI triggers constrained on integrity_flags            none
 *   rules on exam_attempts                                none
 *
 * The count is backed by a POSITIVE CONTROL on the same query: credentials shows 4
 * user triggers, lessons 3, quiz_questions 3. So zero is a fact about the table and
 * not about the query. Nothing recalculates, re-issues or notifies on this update,
 * and no FK is constrained on the column being written.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (!KNOWN.has(a)) {
    console.error("unknown flag " + JSON.stringify(a) + " -- DRY BY DEFAULT; --apply writes.");
    process.exitCode = 2; process.exit();
  }
}
const APPLY = process.argv.includes("--apply");

const ATTEMPT = "09bf8b45-d4cb-4156-8bc1-bd636db4cee9";
/* The only platform_admin, author of 91 of the 93 existing admin_actions rows.
 * Looked up, not placeholdered. */
const ACTOR = "9bec43f7-89b1-4195-bffc-0cecf4238dae";

const ANNOTATION = {
  item: "6c0b1bce",
  tier: "A",
  finding: "key wrong against source; item retired 2026-09-26",
  outcome_under_credit_all: "pass 20/25",
  decision: "no change - candidate retook same day and holds AIE-I-UW8V-ZRUY",
  decided_by: "Juan",
};

/* ============ jsonb DOES NOT PRESERVE KEY ORDER ============
 *
 * The first run of this script reported FAIL on "it matches what was sent byte for
 * byte" while the write was perfectly correct. Postgres `jsonb` normalises object
 * keys -- it sorts them by length then bytes -- so `outcome_under_credit_all` came
 * back last rather than fourth, and a `JSON.stringify` comparison of the two objects
 * differed on ORDER with identical CONTENT. Postgres's own `=` on the two values
 * returns true, checked directly.
 *
 * So the assertion was the defect, not the data, and it is fixed rather than
 * loosened: compare key by key. A guard that cries wolf gets ignored next time, and
 * "byte for byte" is simply the wrong claim to make about a jsonb column. */
function sameJson(x, y) {
  if (x === y) return true;
  if (typeof x !== typeof y || x === null || y === null) return false;
  if (Array.isArray(x) !== Array.isArray(y)) return false;
  if (typeof x !== "object") return false;
  if (Array.isArray(x)) {
    return x.length === y.length && x.every((v, i) => sameJson(v, y[i]));
  }
  const kx = Object.keys(x).sort(), ky = Object.keys(y).sort();
  if (kx.length !== ky.length || kx.some((k, i) => k !== ky[i])) return false;
  return kx.every((k) => sameJson(x[k], y[k]));
}

/* Fixtures, because the repair for a false alarm needs to be shown to work. */
{
  const bad = [];
  if (!sameJson({ a: 1, b: 2 }, { b: 2, a: 1 })) bad.push("key order was treated as a difference");
  if (sameJson({ a: 1 }, { a: 2 })) bad.push("a differing value was treated as equal");
  if (sameJson({ a: 1 }, { a: 1, b: 2 })) bad.push("an extra key was treated as equal");
  if (!sameJson([1, { z: 3 }], [1, { z: 3 }])) bad.push("nested arrays compared unequal");
  if (sameJson([1, 2], [2, 1])) bad.push("array ORDER was ignored, and array order is significant");
  if (bad.length) {
    console.error("sameJson fixtures failed -- refusing to assert anything:");
    for (const b of bad) console.error("  " + b);
    process.exitCode = 2; process.exit();
  }
}

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

const rows = await getAll(KEY,
  "exam_attempts?select=id,user_id,certification_id,score_pct,passed,total_questions,correct_answers,voucher_id,submitted_at,integrity_flags&id=eq." + ATTEMPT);
const problems = [];
if (rows.length !== 1) problems.push("expected 1 attempt, got " + rows.length);
const a = rows[0];

/* The values that MUST NOT move. Captured before, compared after -- not literals. */
const frozen = a ? {
  score_pct: a.score_pct, passed: a.passed, total_questions: a.total_questions,
  correct_answers: a.correct_answers, voucher_id: a.voucher_id, submitted_at: a.submitted_at,
} : null;

const existing = (a && a.integrity_flags) || {};
if (existing.post_administration_review) {
  problems.push("integrity_flags already carries post_administration_review -- refusing to overwrite it");
}
/* MERGE, never replace: whatever else integrity_flags holds is evidence about the
 * sitting and this annotation is not entitled to drop it. */
const merged = { ...existing, post_administration_review: ANNOTATION };

const actorRows = await getAll(KEY, "profiles?select=id,platform_role&id=eq." + ACTOR);
if (actorRows.length !== 1) problems.push("actor profile " + ACTOR + " not found");
else if (String(actorRows[0].platform_role) !== "platform_admin") {
  problems.push("actor is " + actorRows[0].platform_role + ", not platform_admin");
}

const already = await getAll(KEY,
  "admin_actions?select=id,action&target_id=eq." + ATTEMPT + "&action=eq.exam_attempt.post_administration_review");
if (already.length) problems.push("an admin_actions row for this review already exists (" + already.length + ")");

console.log(APPLY ? "APPLY -- annotating only" : "DRY RUN -- nothing will be written");
console.log("  attempt            " + ATTEMPT);
if (a) {
  console.log("  score / passed     " + a.score_pct + "% / " + a.passed + "   (MUST NOT CHANGE)");
  console.log("  correct / total    " + a.correct_answers + " / " + a.total_questions + "   (MUST NOT CHANGE)");
  console.log("  voucher            " + a.voucher_id + "   (MUST NOT CHANGE)");
  console.log("  integrity_flags    " + JSON.stringify(existing));
}
console.log("  actor              " + ACTOR + " (platform_admin)");
console.log("");
console.log("  to be merged into integrity_flags:");
console.log("    " + JSON.stringify(ANNOTATION, null, 2).split("\n").join("\n    "));

if (problems.length) {
  console.error("");
  console.error("ABORT -- nothing written:");
  for (const p of problems) console.error("  " + p);
  process.exitCode = 2; process.exit();
}
if (!APPLY) {
  console.log("");
  console.log("  dry run clean. --apply writes one jsonb key and one admin_actions row.");
  process.exitCode = 0; process.exit();
}

/* ---- write: the jsonb key, then the audit row ---- */
const patch = await fetch(REST_URL + "/exam_attempts?id=eq." + ATTEMPT, {
  method: "PATCH", headers: { ...H, Prefer: "return=representation" },
  body: JSON.stringify({ integrity_flags: merged }),
});
if (!patch.ok) { console.error(patch.status + " " + patch.statusText + "\n" + (await patch.text())); process.exitCode = 1; process.exit(); }

const ins = await fetch(REST_URL + "/admin_actions", {
  method: "POST", headers: { ...H, Prefer: "return=representation" },
  body: JSON.stringify([{
    actor_user_id: ACTOR,
    action: "exam_attempt.post_administration_review",
    target_type: "exam_attempt",
    target_id: ATTEMPT,
    reason: "Tier A item 6c0b1bce had a key wrong against its own source and was retired "
      + "2026-09-26. Under credit-all this attempt reaches 20/25 = 80% and would pass. "
      + "DECIDED BY JUAN: no change to the score, the pass flag or the voucher, because the "
      + "candidate retook the same day, scored 100% and holds AIE-I-UW8V-ZRUY. The record is "
      + "annotated so it says what we now know.",
    metadata: {
      item: "6c0b1bce", tier: "A",
      score_as_administered: "19/25", score_under_credit_all: "20/25",
      credential_already_held: "AIE-I-UW8V-ZRUY",
      retake_attempt: "cb7ca922-e5ee-4f20-9716-75ddf4e8e55c",
      voucher: "20b405ac-1d25-46ab-94bc-a2aa307822e1",
      voucher_unchanged: true,
      evidence: ["TIER-A-OUTCOMES.json", "REMEDY-AIE-I-2026-08-26.md", "TIER-A-RETIRED.json"],
    },
  }]),
});
if (!ins.ok) { console.error("admin_actions insert failed: " + ins.status + "\n" + (await ins.text())); process.exitCode = 1; process.exit(); }
const insBack = await ins.json();

/* ---- post-conditions, and the important ones are the NEGATIVES ---- */
const back = await getAll(KEY,
  "exam_attempts?select=id,score_pct,passed,total_questions,correct_answers,voucher_id,submitted_at,integrity_flags&id=eq." + ATTEMPT);
const b = back[0];
const post = [];
post.push(["the annotation is present", !!(b.integrity_flags && b.integrity_flags.post_administration_review), "absent"]);
/* KEY BY KEY, not byte for byte: jsonb normalises key order -- see sameJson. */
post.push(["it matches what was sent, key by key",
  sameJson(b.integrity_flags.post_administration_review, ANNOTATION), "differs in content"]);
post.push(["nothing else in integrity_flags was dropped",
  Object.keys(existing).every((k) => sameJson(b.integrity_flags[k], existing[k])),
  "a pre-existing key changed or vanished"]);
for (const k of Object.keys(frozen)) {
  post.push(["SCORE RECORD UNCHANGED: " + k, JSON.stringify(b[k]) === JSON.stringify(frozen[k]),
    k + " moved from " + JSON.stringify(frozen[k]) + " to " + JSON.stringify(b[k])]);
}
const vb = await getAll(KEY, "vouchers?select=id,status,attempts_allowed,attempts_used&id=eq." + a.voucher_id);
post.push(["THE VOUCHER IS UNTOUCHED", vb.length === 1 && vb[0].attempts_used === 2 && vb[0].status === "redeemed",
  "voucher now " + JSON.stringify(vb[0])]);
const cred = await getAll(KEY, "credentials?select=credential_code,status&exam_attempt_id=eq." + ATTEMPT);
post.push(["still no credential on this attempt", cred.length === 0, "a credential appeared"]);
post.push(["exactly one audit row", insBack.length === 1, "inserted " + insBack.length]);

console.log("");
let bad = 0;
for (const [name, ok, msg] of post) {
  console.log("  " + (ok ? "PASS  " : "FAIL  ") + name + (ok ? "" : "   -- " + msg));
  if (!ok) bad++;
}
writeFileSync(join(ROOT, "AIE-I-ANNOTATION.json"), JSON.stringify({
  attempt: ATTEMPT, actor: ACTOR, annotation: ANNOTATION,
  admin_action_id: insBack[0] && insBack[0].id, frozen,
}, null, 2) + "\n", "utf8");
console.log("");
console.log("  wrote AIE-I-ANNOTATION.json");
process.exitCode = bad ? 1 : 0;
