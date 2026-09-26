/**
 * retire-tier-a.mjs -- retire the five Tier A items whose key is wrong against
 * their own source.
 *
 * WRITES. `--apply`; DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ THE UNIT IS THE GROUP, NOT THE ROW ============
 *
 * The declared ids are the es-419 rows, because those are the rows that were
 * PRESENTED to candidates. `correct_answer` is a MACHINE field and does not drift
 * between siblings -- asserted here per group before anything is written -- so a
 * wrong key is wrong in all three languages. Retiring only the Spanish row would
 * leave the English and Portuguese siblings serving the same wrong key, which is
 * the worse outcome: the defect stays live on the larger pool.
 *
 * ============ SECURE ONLY. THE PRACTICE POOL IS NOT TOUCHED ============
 *
 * Every write is filtered `pool=eq.secure`, and a post-condition asserts the
 * practice count is unchanged. The director's instruction was explicit and the
 * assertion is what makes it checkable rather than intended.
 *
 * ============ REVERSIBLE, AND THE REVERSAL IS PRINTED ============
 *
 * `retired_at` is a soft delete. The exact undo statement is printed on success,
 * because a reversible action whose reversal nobody wrote down is not reversible
 * at 2am.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { TIER_A, resolvePrefixes } from "./lib/tiered-item-findings.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (!KNOWN.has(a)) {
    console.error("unknown flag " + JSON.stringify(a));
    console.error("This script is DRY BY DEFAULT and takes --apply to write.");
    console.error("There is no --dry: passing one would be an unrecognised flag, and a flag");
    console.error("someone believed in that silently did nothing is how a script runs live.");
    process.exitCode = 2; process.exit();
  }
}
const APPLY = process.argv.includes("--apply");
const REASON = "Tier A: the key is wrong against the item's own source. Director's read of the "
  + "342 exposed items, 2026-09-26. Retired from the secure pool pending a rewrite; "
  + "candidates who saw it are credited. See ITEM-REVIEW-QUEUE.md and TIER-A-OUTCOMES.json.";

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

async function patch(path, body) {
  const r = await fetch(REST_URL + "/" + path, {
    method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(r.status + " " + r.statusText + " on " + path + "\n" + (await r.text()));
  return r.json();
}

/* ---- validate BEFORE writing, so ABORT means nothing was written ---- */
const liveSecure = await getAll(KEY,
  "quiz_questions?select=id,question_group_id,certification_id,language,pool,task_id,correct_answer,retired_at&status=eq.approved&retired_at=is.null&pool=eq.secure&order=id");
const tierA = resolvePrefixes(TIER_A, liveSecure);
const groups = [...new Set(tierA.map((t) => t.row.question_group_id))];

const problems = [];
if (groups.length !== TIER_A.length) problems.push("expected " + TIER_A.length + " groups, got " + groups.length);
for (const g of groups) {
  if (!g) { problems.push("a Tier A row has no question_group_id"); continue; }
  const sibs = liveSecure.filter((r) => r.question_group_id === g);
  const keys = new Set(sibs.map((r) => JSON.stringify(r.correct_answer)));
  if (keys.size !== 1) problems.push(g + ": key differs across siblings (" + [...keys].join(" vs ") + ")");
}
const target = liveSecure.filter((r) => groups.includes(r.question_group_id));
if (!target.length) problems.push("no live secure rows matched the five groups");

/* Counts captured BEFORE, so the post-conditions are a comparison and not a
 * literal. A literal count fails closed against a correct database. */
const beforeSecure = liveSecure.length;
const beforePractice = (await getAll(KEY,
  "quiz_questions?select=id&status=eq.approved&retired_at=is.null&pool=eq.practice&order=id")).length;

console.log(APPLY ? "APPLY -- writing" : "DRY RUN -- nothing will be written");
console.log("  Tier A items declared     " + TIER_A.length);
console.log("  question groups           " + groups.length);
console.log("  live SECURE rows to retire " + target.length);
console.log("  live secure total (before) " + beforeSecure);
console.log("  live practice total        " + beforePractice + "   (must not change)");
console.log("");
for (const t of tierA) {
  const sibs = target.filter((r) => r.question_group_id === t.row.question_group_id);
  console.log("  #" + String(t.n).padEnd(5) + t.cert.padEnd(9) + t.id + "  group " +
    t.row.question_group_id.slice(0, 8) + "  " + sibs.length + " row(s): " +
    sibs.map((s) => s.language).sort().join(", "));
  console.log("        " + t.why);
}
if (problems.length) {
  console.error("");
  console.error("ABORT -- nothing written:");
  for (const p of problems) console.error("  " + p);
  process.exitCode = 2; process.exit();
}
if (!APPLY) {
  console.log("");
  console.log("  dry run clean. Re-run with --apply to retire these " + target.length + " rows.");
  process.exitCode = 0; process.exit();
}

/* ---- write ---- */
const now = new Date().toISOString();
const written = [];
for (const g of groups) {
  const back = await patch("quiz_questions?question_group_id=eq." + g + "&pool=eq.secure&retired_at=is.null",
    { retired_at: now, retire_reason: REASON });
  written.push(...back.map((r) => ({ id: r.id, language: r.language, group: g })));
}

/* ---- post-conditions, BOTH directions ---- */
const afterSecure = await getAll(KEY,
  "quiz_questions?select=id,question_group_id,language&status=eq.approved&retired_at=is.null&pool=eq.secure&order=id");
const afterPractice = await getAll(KEY,
  "quiz_questions?select=id&status=eq.approved&retired_at=is.null&pool=eq.practice&order=id");
const stillLive = afterSecure.filter((r) => groups.includes(r.question_group_id));

const post = [];
post.push(["every targeted row is retired", stillLive.length === 0,
  stillLive.length + " of the five groups' secure rows are still live"]);
post.push(["the secure pool shrank by exactly the target", afterSecure.length === beforeSecure - target.length,
  "secure went " + beforeSecure + " -> " + afterSecure.length + ", expected -" + target.length]);
post.push(["nothing else in the secure pool moved",
  afterSecure.length + target.length === beforeSecure,
  "an unrelated secure row changed state"]);
post.push(["THE PRACTICE POOL IS UNTOUCHED", afterPractice.length === beforePractice,
  "practice went " + beforePractice + " -> " + afterPractice.length]);
post.push(["the write returned the rows it claimed", written.length === target.length,
  "PATCH returned " + written.length + " rows, expected " + target.length]);

console.log("");
let bad = 0;
for (const [name, ok, msg] of post) {
  console.log("  " + (ok ? "PASS  " : "FAIL  ") + name + (ok ? "" : "   -- " + msg));
  if (!ok) bad++;
}

writeFileSync(join(ROOT, "TIER-A-RETIRED.json"), JSON.stringify({
  retired_at: now, reason: REASON, groups, rows: written,
  secure_before: beforeSecure, secure_after: afterSecure.length,
  practice_before: beforePractice, practice_after: afterPractice.length,
}, null, 2) + "\n", "utf8");

console.log("");
console.log("  retired " + written.length + " secure row(s) across " + groups.length + " group(s)");
console.log("  wrote TIER-A-RETIRED.json");
console.log("");
console.log("  TO REVERSE, one statement:");
console.log("      update public.quiz_questions set retired_at = null, retire_reason = null");
console.log("       where question_group_id in (" + groups.map((g) => "'" + g + "'").join(", ") + ")");
console.log("         and pool = 'secure' and retired_at = '" + now + "';");
process.exitCode = bad ? 1 : 0;
