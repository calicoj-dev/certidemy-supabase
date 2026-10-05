#!/usr/bin/env node
/**
 * set-exam-scope-all-grounded.mjs -- is_exam_scope = true on every grounded AIMS-F row except rejected ones.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 * Ruled PROMPT-100 s1c: *"The ruling's intent was 'all grounded AIMS-F rows consistent', and the 46 were the
 * ones I knew about. Exclude any row whose status is `rejected`."*
 *
 * ============ WHY THIS REPLACES THE 46-ROW SCRIPT RATHER THAN RUNNING BESIDE IT ============
 *
 * `set-exam-scope-r4r5.mjs` wrote the set the previous ruling NAMED, and its post-condition -- zero grounded
 * rows left false -- then failed at 32, because the 2026-09-27 insert was a set nobody was counting. That was
 * the instruction and the assertion disagreeing, and the instruction governed.
 *
 * The population is now the PROPERTY rather than a list: every grounded row, minus the exclusion. A list would
 * go stale the next time a batch lands; a property cannot.
 *
 * ============ REJECTED ROWS ARE EXCLUDED, AND THAT IS NOT TIDINESS ============
 *
 * `f92232b5` is `reject`-verdicted and will be retired or rewritten. Putting it in exam scope would say it is
 * meant for a form, which is the opposite of what the verdict says -- and `is_exam_scope` is the one column
 * here that states intent rather than state.
 *
 * The exclusion is on `quiz_questions.status = 'rejected'` AND on `item_grounding.review_verdict = 'reject'`,
 * unioned, because those are two different records of the same decision and either alone can be the one that
 * was written.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";

/* --cert was added in PROMPT-131: an ISMS-IA insert that omitted the generator's --exam-scope left 42
 * accepted rows at false, and record-grounded-verdicts' accept post-condition is what caught it. The
 * population stays a PROPERTY, now per certification. Default unchanged, so no caller moves. */
let APPLY = false, CERT = null;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  const m = /^--cert=(.+)$/.exec(a);
  if (m) { CERT = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --cert=<CODE> (default AIMS-F), --apply (dry by default).");
  process.exit(2);
}

if (!CERT) {
  /* NO CERTIFICATION DEFAULT (PROMPT-135 s3). This defaulted to a literal, so a caller that
   * forgot --cert operated on a different certification and said nothing. */
  console.error("--cert=<CODE> is required. set-exam-scope-all-grounded.mjs used to default to a single\n" +
    "certification, which is how the rollback command came to offer AIMS-F after an ISMS-IA cutover.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
const qs = await getAll(KEY, "quiz_questions?select=id,status,visibility,pool,is_exam_scope,created_at" +
  "&certification_id=eq." + cert.id + "&language=eq.en&retired_at=is.null&order=created_at");
const ig = new Map((await getAll(KEY,
  "item_grounding?select=question_id,review_verdict&order=question_id")).map((g) => [g.question_id, g]));

const grounded = qs.filter((q) => ig.has(q.id));
const rejected = grounded.filter((q) =>
  q.status === "rejected" || (ig.get(q.id) || {}).review_verdict === "reject");
const rejectedIds = new Set(rejected.map((q) => q.id));
const inScope = grounded.filter((q) => !rejectedIds.has(q.id));
const toChange = inScope.filter((q) => q.is_exam_scope !== true);

console.log("is_exam_scope = true ON EVERY GROUNDED " + CERT + " ROW EXCEPT REJECTED");
console.log("");
console.log("  grounded rows          " + grounded.length);
console.log("  excluded as rejected   " + rejected.length +
  (rejected.length ? "   " + rejected.map((q) => q.id.slice(0, 8) + " (" + q.status + "/" +
    (ig.get(q.id) || {}).review_verdict + ")").join(", ") : ""));
console.log("  in scope               " + inScope.length);
console.log("  already true           " + (inScope.length - toChange.length));
console.log("  to change              " + toChange.length);
{
  const by = {};
  for (const q of toChange) {
    const k = String(q.created_at).slice(0, 10) + " / " + q.status + " / " + q.visibility + " / " + q.pool;
    by[k] = (by[k] || 0) + 1;
  }
  for (const [k, n] of Object.entries(by)) console.log("      " + String(n).padStart(4) + "  " + k);
}
if (!APPLY) {
  console.log("");
  console.log("DRY RUN. Nothing written. Re-run with --apply.");
  process.exit(0);
}

const changedIdsForCheck = new Set(toChange.map((q) => q.id));
const before = new Map(qs.map((q) => [q.id, { s: q.status, v: q.visibility, e: q.is_exam_scope }]));
let wrote = 0;
for (const q of toChange) {
  /* status, visibility and is_exam_scope ALL named, per the standing rule. status is re-asserted at its
   * CURRENT value rather than hard-coded: these rows are pending_review today, and a literal would silently
   * promote or demote a row whose status someone had deliberately moved. */
  const r = await fetch(REST_URL + "/quiz_questions?id=eq." + q.id, {
    method: "PATCH", headers: H,
    body: JSON.stringify({ status: q.status, visibility: q.visibility, is_exam_scope: true }),
  });
  if (!r.ok) { console.error("  FAILED " + q.id.slice(0, 8) + " HTTP " + r.status + " " + (await r.text()).slice(0, 120)); continue; }
  wrote++;
}

/* ---- READ BACK, and assert the property the ruling asked for ---- */
const after = await getAll(KEY, "quiz_questions?select=id,status,visibility,pool,is_exam_scope" +
  "&certification_id=eq." + cert.id + "&language=eq.en&retired_at=is.null&order=id");
const aBy = new Map(after.map((q) => [q.id, q]));
const bad = [];
for (const q of toChange) {
  const now = aBy.get(q.id);
  if (!now) { bad.push(q.id.slice(0, 8) + ": gone"); continue; }
  if (now.is_exam_scope !== true) bad.push(q.id.slice(0, 8) + ": is_exam_scope=" + now.is_exam_scope);
  if (now.status !== q.status) bad.push(q.id.slice(0, 8) + ": status moved to " + now.status);
  if (now.visibility !== q.visibility) bad.push(q.id.slice(0, 8) + ": visibility moved to " + now.visibility);
}
const stillFalse = after.filter((q) => ig.has(q.id) && !rejectedIds.has(q.id) && q.is_exam_scope === false);
/* ============ THE NEGATIVE HALF, AND THE LABEL HAS TO SAY WHO DID IT ============
 *
 * A rejected row must not be swept in BY THIS RUN. My first version reported any rejected row in exam scope as
 * "wrongly set true", and it fired on `f92232b5` -- which this run never touched: it was set true in the
 * previous round, BEFORE it was rejected. The assertion was right that the state is wrong and wrong about the
 * cause, which is the accusation-shaped error this repository keeps paying for.
 *
 * Two separate facts, two separate lines: what this run DID, and what the state IS.
 */
const rejectedSetByThisRun = rejected.filter((q) => changedIdsForCheck.has(q.id));
const rejectedAlreadyTrue = after.filter((q) =>
  rejectedIds.has(q.id) && q.is_exam_scope === true && !changedIdsForCheck.has(q.id));
let strays = 0;
const changedIds = changedIdsForCheck;
for (const q of after) {
  if (changedIds.has(q.id)) continue;
  const b = before.get(q.id);
  if (!b) continue;
  if (b.s !== q.status || b.v !== q.visibility || b.e !== q.is_exam_scope) {
    console.error("  STRAY: " + q.id.slice(0, 8) + " changed outside the plan");
    strays++;
  }
}
console.log("");
console.log("  wrote                                   " + wrote + " of " + toChange.length);
console.log("  read back clean                         " + (toChange.length - bad.length) + " of " + toChange.length);
for (const b of bad) console.log("      " + b);
console.log("  grounded, not rejected, still FALSE     " + stillFalse.length + "   (must be 0)");
for (const q of stillFalse.slice(0, 10)) console.log("      " + q.id.slice(0, 8));
console.log("  rejected rows set true BY THIS RUN      " + rejectedSetByThisRun.length + "   (must be 0)");
console.log("  rejected rows ALREADY in exam scope     " + rejectedAlreadyTrue.length +
  "   (state, not this run: set before the reject verdict)");
for (const q of rejectedAlreadyTrue) console.log("      " + q.id.slice(0, 8) + "  needs a ruling: clear it, or retire the row");
console.log("  strays outside the plan                 " + strays + "   (must be 0)");
if (bad.length || stillFalse.length || rejectedSetByThisRun.length || strays || wrote !== toChange.length) {
  process.exitCode = 2;
}
