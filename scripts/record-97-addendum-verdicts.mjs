#!/usr/bin/env node
/**
 * record-97-addendum-verdicts.mjs -- write the director's PROMPT-97-addendum verdicts into the record.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 * ============ THE VERDICTS HAVE TWO HOMES AND THAT IS NOT A CHOICE ============
 *
 * The ruling says *"record these in item_reviews"*. There is no `item_reviews` table -- migration 379 put the
 * read on `item_grounding`, having argued the case -- and, more decisively:
 *
 *   `item_grounding.question_id` REFERENCES `quiz_questions`. A rejected artifact item was never inserted,
 *   so there is no row to key a verdict to. **Ten of the eleven non-accepted verdicts cannot be database
 *   rows at all.**
 *
 * So:
 *
 *   accept (46)   ->  item_grounding.review_verdict on the row, AFTER the insert creates it
 *   reject (10)   ->  AIMSF-DIRECTOR-REJECTIONS.json, which exists for exactly this: a rejection is the one
 *                     disposition no artifact can derive
 *   reserve (1)   ->  AIMSF-ARTIFACT-DISPOSITIONS.json, verdict `accept` with the director's note, because
 *                     the item is GOOD and is held. A reject would say it is wrong, and it is not.
 *
 * ============ AND A RESERVE MUST NOT OCCUPY CAP SPACE ============
 *
 * The ruling: *"the insert must skip it while the cap is full."* A reserve counted in the awaiting layer would
 * fill A.10.3 for task 3.4 and refuse `6d6098c6`, which the director ACCEPTED. Recording it as a reserve
 * disposition takes it out of the awaiting count while keeping it findable -- it is queued for when space
 * appears, not withdrawn.
 *
 * ============ THIS SCRIPT DOES NOT TOUCH THE DATABASE ============
 *
 * Both files are repository artifacts. The 46 `accept` verdicts are written by the insert path, because a
 * verdict needs the `question_id` the insert creates, and writing it before would mean writing it against
 * nothing. `--apply` here writes the two JSON files and nothing else.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("Unrecognised flag: " + a + ".");
  console.error("  --apply    write. Dry by default (this directory has two opposite flag conventions).");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const RESOLVED = join(ROOT, "AIMSF-97-VERDICTS.json");

/* THE RESOLVED SET IS THE INPUT, and it is produced by `resolve-r4-r5-verdicts.mjs`, which asserts every id
 * against the artifacts: one survivor per id, in the run and task the director named, and the accepted
 * complement matching his stated counts. This script refuses to run without it rather than re-deriving the
 * set -- two derivations of one ruling is how the record and the insert come to disagree. */
let V;
try { V = JSON.parse(readFileSync(RESOLVED, "utf8")); }
catch (e) {
  console.error("REFUSING: " + RESOLVED + " is absent or unreadable (" + e.message + ").");
  console.error("Run: node scripts/resolve-r4-r5-verdicts.mjs --emit=AIMSF-97-VERDICTS.json");
  process.exit(2);
}
if (!V.reject || !V.accept || !V.reserve) { console.error("REFUSING: the resolved set is malformed."); process.exit(2); }

/* ---- the rejections file ---- */
const RP = join(ROOT, "AIMSF-DIRECTOR-REJECTIONS.json");
const rej = JSON.parse(readFileSync(RP, "utf8"));
const already = new Set((rej.rejections || []).map((r) => String(r.id)));
const toAdd = V.reject.filter((r) => !already.has(r.id));
/* APPENDED, NEVER REWRITTEN. The three PROMPT-95/96 rejections stay exactly as they are: a standing list that
 * a later run rewrites is a list that can lose an entry. */
for (const r of toAdd) {
  rej.rejections.push({ id: r.id, task: r.task, ruled: "PROMPT-97 addendum s2", why: r.why });
}
/* the file is read by the cap census too, now, and saying so is the difference between a file someone
 * maintains and a file someone edits */
const wantReadBy = "scripts/lib/item-disposition.mjs -- so a rejected item does not occupy a task's anchor cap";
if (!(rej.read_by || []).includes(wantReadBy)) (rej.read_by = rej.read_by || []).push(wantReadBy);

/* ---- the reserve ---- */
const DP = join(ROOT, "AIMSF-ARTIFACT-DISPOSITIONS.json");
const disp = JSON.parse(readFileSync(DP, "utf8"));
disp.reserved = disp.reserved || [];
const haveRes = new Set(disp.reserved.map((r) => String(r.id)));
const resAdd = V.reserve.filter((r) => !haveRes.has(r.id));
for (const r of resAdd) {
  disp.reserved.push({
    id: r.id, task: r.task, clause: r.clause, run: r.run,
    verdict: "accept",
    note: r.why,
    full_reason: r.full || r.why,
    ruled: "PROMPT-97 addendum s2",
    why_not_rejected: "The item is good. A reject would record it as wrong; it is surplus while its clause " +
      "is at the cap, which is a fact about the clause and not about the item.",
    why_not_awaiting: "A reserve that counted in the awaiting layer would fill its clause and refuse an item " +
      "the director accepted on the same clause. It is queued for when space appears.",
  });
}

const summary = [
  "PROMPT-97 ADDENDUM VERDICTS",
  "",
  "  accept   " + V.accept.length + "   written by the INSERT path, which creates the question_id a verdict needs",
  "  reject   " + V.reject.length + "   -> AIMSF-DIRECTOR-REJECTIONS.json  (" + toAdd.length + " new, " +
    (V.reject.length - toAdd.length) + " already listed)",
  "  reserve  " + V.reserve.length + "   -> AIMSF-ARTIFACT-DISPOSITIONS.json as verdict=accept, note=" +
    JSON.stringify(V.reserve[0] && V.reserve[0].why) + "  (" + resAdd.length + " new)",
  "",
];
for (const s of summary) console.log(s);
for (const r of toAdd) console.log("  reject  " + r.id + "  task " + r.task + "  " + r.why.slice(0, 92));
for (const r of resAdd) console.log("  reserve " + r.id + "  task " + r.task + "  clause " + r.clause);
console.log("");

if (!APPLY) {
  console.log("DRY RUN. Nothing written. Re-run with --apply.");
  process.exit(0);
}
writeFileSync(RP, JSON.stringify(rej, null, 1) + "\n", "utf8");
writeFileSync(DP, JSON.stringify(disp, null, 2) + "\n", "utf8");

/* ---- POST-CONDITIONS, BOTH DIRECTIONS: what must be there, and what must NOT have moved ---- */
const back = JSON.parse(readFileSync(RP, "utf8"));
const backIds = new Set(back.rejections.map((r) => String(r.id)));
const missing = V.reject.filter((r) => !backIds.has(r.id));
if (missing.length) {
  console.error("POST-CONDITION FAILED: " + missing.map((r) => r.id).join(", ") + " did not land");
  process.exitCode = 2;
}
/* the three earlier rejections must survive: a standing list that loses an entry is worse than no list */
for (const id of ["c590b702", "43882b06", "3a3d26fa"]) {
  if (!backIds.has(id)) {
    console.error("POST-CONDITION FAILED: the pre-existing rejection " + id + " is GONE");
    process.exitCode = 2;
  }
}
/* and nothing accepted may appear in the rejection list */
for (const a of V.accept) {
  if (backIds.has(String(a.id).slice(0, 8))) {
    console.error("POST-CONDITION FAILED: accepted item " + a.id + " is in the rejection list");
    process.exitCode = 2;
  }
}
const backD = JSON.parse(readFileSync(DP, "utf8"));
if ((backD.reserved || []).length !== V.reserve.length) {
  console.error("POST-CONDITION FAILED: reserved is " + (backD.reserved || []).length + ", expected " +
    V.reserve.length);
  process.exitCode = 2;
}
if (!(backD.withdrawn || []).length) {
  console.error("POST-CONDITION FAILED: the withdrawn block is gone");
  process.exitCode = 2;
}
if (!process.exitCode) {
  console.log("WROTE both files. Rejections now " + back.rejections.length + ", reserved " +
    (backD.reserved || []).length + ", withdrawn " + (backD.withdrawn || []).length + ".");
  console.log("The 46 accept verdicts are the INSERT path's to write.");
}
