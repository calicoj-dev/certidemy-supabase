#!/usr/bin/env node
/**
 * reject-f92232b5.mjs -- finish what PROMPT-98 s1b ordered for the cross-standard collision row.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 * ============ WHY THE STATUS WRITE WAS MISSED, WHICH IS THE PART WORTH KEEPING ============
 *
 * PROMPT-98 s1b said: *"reject ... and f92232b5 ... Set f92232b5's question row to `status = rejected` as well,
 * named and read back."* The verdict landed on `item_grounding`. The status never moved, so the row has read
 * `pending_review / reject` ever since -- two records of one decision, disagreeing.
 *
 * `backfill-review-verdicts.mjs` writes the four REVIEW COLUMNS and nothing else. Every id it handles is a
 * verdict, so its shape is one PATCH to one table, and the single instruction in that ruling that concerned a
 * DIFFERENT TABLE had nowhere to go. I did not notice, and neither did anything else:
 *
 * **ITS POST-CONDITIONS ASSERTED WHAT THE SCRIPT WROTE, NOT WHAT THE RULING ASKED FOR.** They checked that
 * every planned verdict landed, that the reviewer and date were right, that every note named its prompt, and
 * that no row outside the plan moved. All passed. All of them were derived from the script's own plan -- so a
 * post-condition cannot see an instruction the script never implemented. It can only confirm the plan was
 * executed, which is a different claim from the ruling being carried out.
 *
 * That is the general shape and it is new here: this repository's rules are mostly about assertions being wrong.
 * This one is about an assertion being CORRECT and COMPLETE over the wrong population -- the plan rather than
 * the ruling.
 *
 * ============ AND is_exam_scope GOES FALSE IN THE SAME WRITE ============
 *
 * Ruled PROMPT-101. `set-exam-scope-all-grounded` reported it as state rather than clearing it, because that
 * ruling excluded rejected rows from the write. It is cleared here, with the status, because they are one
 * decision: a rejected row is not meant for a form.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";

let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply (dry by default).");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const PREFIX = "f92232b5";

const cert = (await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F"))[0];
const qs = await getAll(KEY, "quiz_questions?select=id,task_id,status,visibility,pool,is_exam_scope," +
  "question_text&certification_id=eq." + cert.id + "&language=eq.en&order=id");
const hits = qs.filter((q) => q.id.startsWith(PREFIX));
if (hits.length !== 1) {
  console.error("REFUSING: " + PREFIX + " resolves to " + hits.length + " row(s). A status write on an");
  console.error("ambiguous id is the one mistake there is no recovering from here.");
  process.exit(2);
}
const q = hits[0];
const ig = (await getAll(KEY, "item_grounding?select=question_id,review_verdict,review_note" +
  "&question_id=eq." + q.id))[0];

console.log("FINISH THE REJECTION OF " + PREFIX);
console.log("");
console.log("  row              " + q.id);
console.log("  status           " + q.status + "   -> rejected");
console.log("  visibility       " + q.visibility + "   (unchanged, named on the write)");
console.log("  pool             " + q.pool + "   (unchanged)");
console.log("  is_exam_scope    " + q.is_exam_scope + "   -> false");
console.log("  review_verdict   " + (ig && ig.review_verdict) + "   (already recorded, unchanged)");
console.log("  review_note      " + JSON.stringify(String((ig && ig.review_note) || "").slice(0, 110)));

/* ASSERTED BEFORE WRITING: the verdict must already say reject, or this script is promoting a decision nobody
 * recorded. The status follows the verdict; it does not lead it. */
if (!ig || ig.review_verdict !== "reject") {
  console.error("");
  console.error("REFUSING: the row's review_verdict is " + JSON.stringify(ig && ig.review_verdict) +
    ", not 'reject'. A status of rejected with no reject verdict would be a decision with no record.");
  process.exit(2);
}
if (q.status === "rejected" && q.is_exam_scope === false) {
  console.log("");
  console.log("Already rejected and out of exam scope. Nothing to do.");
  process.exit(0);
}
if (!APPLY) {
  console.log("");
  console.log("DRY RUN. Nothing written. Re-run with --apply.");
  process.exit(0);
}

const r = await fetch(REST_URL + "/quiz_questions?id=eq." + q.id, {
  method: "PATCH", headers: H,
  /* status, visibility and is_exam_scope ALL named, per the standing rule. `pool` is named too: this row sits
   * in the secure pool and a rejection does not move it between pools. */
  body: JSON.stringify({ status: "rejected", visibility: q.visibility, pool: q.pool, is_exam_scope: false }),
});
if (!r.ok) {
  console.error("FAILED: HTTP " + r.status + "  " + (await r.text()).slice(0, 200));
  process.exit(2);
}

/* ---- READ BACK ---- */
const after = (await getAll(KEY, "quiz_questions?select=id,status,visibility,pool,is_exam_scope" +
  "&id=eq." + q.id))[0];
const bad = [];
if (!after) bad.push("the row is gone");
else {
  if (after.status !== "rejected") bad.push("status is " + after.status);
  if (after.is_exam_scope !== false) bad.push("is_exam_scope is " + after.is_exam_scope);
  if (after.visibility !== q.visibility) bad.push("visibility moved to " + after.visibility);
  if (after.pool !== q.pool) bad.push("pool moved to " + after.pool);
}
/* AND THE NEGATIVE HALF: the verdict must be untouched, and no other row's status may have moved. */
const igAfter = (await getAll(KEY, "item_grounding?select=question_id,review_verdict&question_id=eq." + q.id))[0];
if (!igAfter || igAfter.review_verdict !== "reject") bad.push("the review verdict changed");
const allAfter = await getAll(KEY, "quiz_questions?select=id,status&certification_id=eq." + cert.id +
  "&language=eq.en&order=id");
const beforeStatus = new Map(qs.map((x) => [x.id, x.status]));
let strays = 0;
for (const x of allAfter) {
  if (x.id === q.id) continue;
  if (beforeStatus.get(x.id) !== x.status) { console.error("  STRAY: " + x.id.slice(0, 8) + " status moved"); strays++; }
}
console.log("");
console.log("  read back: status=" + (after && after.status) + "  visibility=" + (after && after.visibility) +
  "  pool=" + (after && after.pool) + "  is_exam_scope=" + (after && after.is_exam_scope));
console.log("  verdict still `reject`: " + (igAfter && igAfter.review_verdict === "reject"));
console.log("  strays: " + strays);
for (const b of bad) console.error("  POST-CONDITION: " + b);
/* the property the earlier ruling wanted and could not have: a rejected row is out of exam scope */
const rejectedInScope = allAfter.length ? (await getAll(KEY,
  "quiz_questions?select=id,status,is_exam_scope&certification_id=eq." + cert.id +
  "&language=eq.en&status=eq.rejected&is_exam_scope=is.true&order=id")) : [];
console.log("  rejected AIMS-F rows still in exam scope: " + rejectedInScope.length + "   (must be 0)");
if (bad.length || strays || rejectedInScope.length) process.exitCode = 2;
