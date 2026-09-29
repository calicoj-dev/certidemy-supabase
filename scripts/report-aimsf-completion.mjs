#!/usr/bin/env node
/**
 * report-aimsf-completion.mjs -- every AIMS-F task, its floor, and its secure counts broken out.
 *
 * READ-ONLY. Unknown flags exit 2. Ruled PROMPT-94 s5.
 *
 * ============ THE THREE COUNTS ARE THREE DIFFERENT CLAIMS ============
 *
 *   KEPT       authored items the survivor audit ruled keep, counted ONLY up to the anchor cap of 2 per
 *              (source, clause). An over-cap kept item is real and is not available to this floor, so
 *              counting it would overstate coverage.
 *   INSERTED   grounded items already in the bank as pending_review -- written, gated, inserted, read back.
 *   AWAITING   grounded survivors in an artifact and NOT in the bank: batch 2, R2, R3. These are a claim
 *              about what the director could approve, never about what the bank holds.
 *
 * Folding AWAITING into INSERTED would report a finished certification that does not exist. Folding it out
 * entirely would hide the work. So it is its own column and the final line is explicit about which side of
 * approval each number sits on.
 *
 * ============ THE FLOOR IS DERIVED, NOT TYPED ============
 *
 * min(8, 2 x effective primaries), from TASK-FLOORS-AIMSF.json's rule. A task with three effective primaries
 * caps at six items under the cap of 2, which is the PROMPT-94 s4 ruling.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, getAllIn } from "./_pg.mjs";
import { CAP } from "./lib/anchor-cap.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const FLOORS = JSON.parse(readFileSync(join(ROOT, "TASK-FLOORS-AIMSF.json"), "utf8"));
const DEFAULT_FLOOR = FLOORS.default_floor;
const idOf = (t) => createHash("sha256").update(String(t || "").replace(/\s+/g, " ").trim())
  .digest("hex").slice(0, 8);

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F");
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code,statement&order=code"))
  .filter((t) => t.certification_id === certs[0].id);
/* The passage and task_sources reads went with the recomputation: this report no longer derives
 * effective primaries, so two real queries per run were left doing nothing. */

/* ============ kept / inserted / floor COME FROM rollout-shortfall, NOT FROM HERE ============
 *
 * My first version recomputed them and disagreed with it: 0 over-cap kept items against the shortfall's
 * per-task figures, and 1.2 at 1 against its keptUsable of 1 from a keep of 2. Two implementations of one
 * tally, and the new one was wrong. This report owns exactly one column -- AWAITING -- and reads the rest. */
const SF = JSON.parse(readFileSync(join(ROOT, "AIMSF-ROLLOUT-SHORTFALL.json"), "utf8"));
const sfOf = new Map(SF.per_task.map((r) => [r.code, r]));
/* ASSERTED, not trusted: a stale artifact would be summarised as fact. */
{
  const missing = tasks.filter((t) => !sfOf.has(t.code)).map((t) => t.code);
  if (missing.length) {
    console.error("ABORT: AIMSF-ROLLOUT-SHORTFALL.json has no row for " + missing.join(", ") +
      ". Re-run scripts/rollout-shortfall.mjs first.");
    process.exit(2);
  }
  const bad = SF.per_task.filter((r) => r.have !== r.keptUsable + r.inserted);
  if (bad.length) {
    console.error("ABORT: the shortfall's own arithmetic does not reconcile on " +
      bad.map((r) => r.code).join(", ") + " (have != keptUsable + inserted).");
    process.exit(2);
  }
}

/* ---- INSERTED ids, needed only to tell an inserted survivor from a waiting one ---- */
const ig = await getAll(KEY, "item_grounding?select=question_id&order=question_id");
const gq = await getAllIn(KEY, "quiz_questions", "id,question_text", "id",
  ig.map((g) => g.question_id), "&order=id");

/* ---- AWAITING: grounded survivors in artifacts and NOT in the bank ---- */
const WAITING = [["batch 2", "AIMSF-ROLLOUT-B2.json"], ["R2", "AIMSF-R2-PROBE.json"], ["R2", "AIMSF-R2-REST.json"],
  ["R3", "AIMSF-R3-PROBE.json"], ["R3", "AIMSF-R3-REST.json"]];
/* match by STEM HASH, because an artifact carries no question_id: the same stem inserted is the same item */
const insertedStems = new Set(gq.map((q) => idOf(q.question_text)));
const awaiting = new Map();      /* code -> { "batch 2": n, R2: n, R3: n } */
const missingArtifacts = [];
for (const [label, f] of WAITING) {
  const p = join(ROOT, f);
  if (!existsSync(p)) { missingArtifacts.push(f); continue; }
  for (const r of JSON.parse(readFileSync(p, "utf8")).items || []) {
    if (r.verdict !== "survivor") continue;
    const id = r.item_id || idOf(r.item.question_text);
    /* ALREADY INSERTED IS NOT AWAITING. Batch 1's survivors were inserted this session, so counting every
     * artifact survivor as waiting would double-count them against the bank. */
    if (insertedStems.has(id)) continue;
    const code = r.task_code;
    if (!awaiting.has(code)) awaiting.set(code, {});
    const a = awaiting.get(code);
    a[label] = (a[label] || 0) + 1;
  }
}

const rows = tasks.map((t) => {
  const code = t.code;
  const sf = sfOf.get(code);
  const a = awaiting.get(code) || {};
  const wait = (a["batch 2"] || 0) + (a.R2 || 0) + (a.R3 || 0);
  return { code, floor: sf.floor, eff: sf.effective, kept: sf.keptUsable, ins: sf.inserted, wait,
    b2: a["batch 2"] || 0, r2: a.R2 || 0, r3: a.R3 || 0, over: sf.keptOverCap,
    now: sf.have, after: sf.have + wait };
}).sort((x, y) => String(x.code).localeCompare(String(y.code), undefined, { numeric: true }));

const md = ["# AIMS-F completion: every task, its floor, and where its secure items are", "",
  "**Read-only. Nothing here is inserted.** Ruled PROMPT-94 s5.", "",
  "The floor is `min(" + DEFAULT_FLOOR + ", " + CAP + " x effective primaries)` -- derived, not typed, so a",
  "task that gains a primary returns to " + DEFAULT_FLOOR + " with no edit. The rule is in",
  "TASK-FLOORS-AIMSF.json.", "",
  "**The three counts are three different claims.** `kept` is authored items the survivor audit ruled keep,",
  "counted only up to the cap of " + CAP + " per (source, clause). `inserted` is grounded items in the bank as",
  "`pending_review`. `awaiting` is grounded survivors sitting in an artifact and NOT in the bank -- a claim",
  "about what you could approve, never about what the bank holds. Folding the third into the second would",
  "report a finished certification that does not exist.", ""];
if (missingArtifacts.length) {
  md.push("**Artifacts not found, so their items are counted nowhere:** " + missingArtifacts.join(", "));
  md.push("");
}
md.push("| task | floor | eff | kept | inserted | **now** | b2 | R2 | R3 | **after approval** | at floor? |");
md.push("|---|---|---|---|---|---|---|---|---|---|---|");
for (const r of rows) {
  const at = r.after >= r.floor ? (r.now >= r.floor ? "**already**" : "**yes, on approval**") :
    "no, short " + (r.floor - r.after);
  md.push("| " + r.code + " | " + r.floor + " | " + r.eff + " | " + r.kept + " | " + r.ins + " | **" +
    r.now + "** | " + (r.b2 || "") + " | " + (r.r2 || "") + " | " + (r.r3 || "") + " | **" + r.after +
    "** | " + at + " |");
}
const already = rows.filter((r) => r.now >= r.floor);
const onApproval = rows.filter((r) => r.now < r.floor && r.after >= r.floor);
const short = rows.filter((r) => r.after < r.floor);
md.push("");
md.push("## The line you asked for");
md.push("");
md.push("**At their floor once you approve what is waiting: " + (already.length + onApproval.length) +
  " of " + rows.length + " tasks.**");
md.push("");
md.push("- **already at floor, no approval needed (" + already.length + ")**: " +
  (already.map((r) => r.code).join(", ") || "none"));
md.push("- **reach it on approval (" + onApproval.length + ")**: " +
  (onApproval.map((r) => r.code + " (" + r.now + " -> " + r.after + " against " + r.floor + ")").join(", ") || "none"));
md.push("- **still short after approval (" + short.length + ")**: " +
  (short.map((r) => r.code + " (" + r.after + " of " + r.floor + ", short " + (r.floor - r.after) + ")").join(", ") || "none"));
md.push("");
const overTotal = rows.reduce((s, r) => s + r.over, 0);
md.push("**" + overTotal + " kept item(s) are over the anchor cap** and are excluded from `kept` above. They");
md.push("are real, reviewed items; they are simply not available to a floor that counts " + CAP + " per");
md.push("(source, clause). They were reported and not dropped, per PROMPT-87.");
writeFileSync(join(ROOT, "AIMSF-COMPLETION.md"), md.join("\n") + "\n", "utf8");

console.log("AIMS-F COMPLETION");
console.log("  tasks                         " + rows.length);
console.log("  already at floor              " + already.length);
console.log("  reach it on approval          " + onApproval.length +
  (onApproval.length ? "   " + onApproval.map((r) => r.code).join(" ") : ""));
console.log("  STILL SHORT after approval    " + short.length +
  (short.length ? "   " + short.map((r) => r.code + "(" + r.after + "/" + r.floor + ")").join(" ") : ""));
console.log("  kept but over the cap         " + overTotal);
if (missingArtifacts.length) console.log("  artifacts NOT FOUND           " + missingArtifacts.join(", "));
console.log("wrote AIMSF-COMPLETION.md");
