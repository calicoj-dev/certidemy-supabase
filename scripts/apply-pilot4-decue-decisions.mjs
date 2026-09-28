#!/usr/bin/env node
/**
 * apply-pilot4-decue-decisions.mjs -- land the director's final KEEP-6 decision on pilot 4's de-cue.
 *
 * WRITES THE ARTIFACT. `--apply`; DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ WHERE THE PILOT-4 ITEMS LIVE: THE ARTIFACT, AND NOWHERE ELSE ============
 *
 * The ruling says to apply this "wherever the pilot-4 items live (the artifact, and any pending_review
 * rows)". Measured rather than assumed, twice:
 *
 *   PILOT-DRAFT-INSERTED.json   32 rows, `pilot` field reads 2 (x5) and 3 (x27). No pilot 4.
 *   the database               0 rows match a pilot-4 stem
 *
 * So there are no rows to read back, and that is the report rather than a silent omission. `--apply`
 * here rewrites the JSON artifact only.
 *
 * ============ THE DECISION IS SIX, AND TWO OF THEM ARE HUMAN OVERRIDES ============
 *
 * The code rules returned KEEP 4. The director kept two more by hand, and those are recorded IN THE
 * ARTIFACT as overrides with their reason -- not by loosening check 5, which he explicitly declined:
 *
 *   3.4   "DEFER review ... UNTIL the next audit"  ->  "review ... AT THE NEXT scheduled audit"
 *   3.6   "parties WITHOUT authorization"          ->  "parties the system HAS NOT authorized"
 *
 * Both preserve the restriction in words no list carries. Extending the list until they pass would be
 * fitting the rule to the expected count; a named human override does not touch the rule at all, and
 * the next run of the checks will still flag these two, correctly, for a human.
 *
 * ============ WHY THE CLANG-TRIGGERED KEEPS STAND ============
 *
 * Ruling A removes clang from the de-cue TRIGGER set because it fires on 43 percent of the bank. Three
 * of the six keeps were clang-triggered. They stand because they are FINISHED rewrites: each cleared
 * its cue, added none, passed the limiter check or an override, and passed the blind solver. Rule A
 * governs which rewrites are ATTEMPTED in future, not which completed ones are discarded.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (!KNOWN.has(a)) {
    console.error("unknown flag " + JSON.stringify(a) + ". Known: --apply");
    console.error("DRY BY DEFAULT; --apply writes the artifact. There is no --dry.");
    process.exitCode = 2; process.exit();
  }
}
const APPLY = process.argv.includes("--apply");

/* The final decision, task by task. `nth` disambiguates the tasks with two items (5.1, 5.2, 4.1, 4.3).
 * KEEP means the de-cued distractors stand; REVERT means the pre-de-cue distractors are restored. */
const DECISION = [
  ["2.2", 1, "KEEP", "rule", "clang cleared, no new cue, limiters intact"],
  ["2.7", 1, "KEEP", "rule", "clang cleared; `until` -> `before` is an equivalent limiter"],
  ["3.4", 1, "KEEP", "HUMAN OVERRIDE", "check 5 flags `until` dropped; `at the next scheduled internal audit` preserves the deferral. Director's call, 2026-09-28"],
  ["3.6", 1, "KEEP", "HUMAN OVERRIDE", "check 5 flags `without` dropped; `the system has not authorized` preserves the negation. Director's call, 2026-09-28"],
  ["4.6", 1, "KEEP", "rule", "clang cleared, no new cue, limiters intact"],
  ["5.2", 1, "KEEP", "rule", "key-length cleared, no new cue, limiters intact"],
];
const KEEP_KEYS = new Set(DECISION.map(([t, n]) => t + "#" + n));

const ART = "PILOT-GROUNDED-AIMSF-4.json";
const REVIEW = "PILOT-4-DECUE-REVIEW.json";
const art = JSON.parse(readFileSync(join(ROOT, ART), "utf8"));
const review = JSON.parse(readFileSync(join(ROOT, REVIEW), "utf8"));

/* Pair each review row with its artifact item by task, in order -- consuming one per review row
 * whatever its outcome, which is the desync that cost a KEEP in the re-gate's first run. */
const seen = new Map();
const artByTask = new Map();
for (const r of art.items) {
  if (r.verdict !== "survivor" || !r.de_cue || r.de_cue.state !== "applied") continue;
  if (!artByTask.has(r.task_code)) artByTask.set(r.task_code, []);
  artByTask.get(r.task_code).push(r);
}

const problems = [];
const plan = [];
for (const row of review.items) {
  const n = (seen.get(row.task) || 0) + 1;
  seen.set(row.task, n);
  const item = (artByTask.get(row.task) || [])[n - 1];
  if (!item) { problems.push(row.task + "#" + n + ": no artifact item paired"); continue; }
  const key = row.task + "#" + n;
  const dec = DECISION.find(([t, k]) => t + "#" + k === key);

  if (row.state !== "applied") {
    plan.push({ key, item, action: "ALREADY REVERTED", basis: "the re-de-cue run reverted it", reason: row.reason || "" });
    continue;
  }
  if (dec) {
    plan.push({ key, item, action: "KEEP", basis: dec[3], reason: dec[4], newD: row.newD });
  } else {
    if (!Array.isArray(row.origD) || !row.origD.length) {
      problems.push(key + ": REVERT requested but the artifact records no pre-de-cue distractors");
      continue;
    }
    plan.push({ key, item, action: "REVERT", basis: "not in the final keep list", reason: "", origD: row.origD });
  }
}

/* Every keep in the ruling must be found, or the decision has been applied to the wrong items. */
for (const k of KEEP_KEYS) {
  if (!plan.some((p) => p.key === k && p.action === "KEEP")) problems.push("keep " + k + " was not matched to an item");
}
const keeps = plan.filter((p) => p.action === "KEEP");
if (keeps.length !== 6) problems.push("expected 6 keeps, planned " + keeps.length);

/* Stage the reverts and assert the key cannot move. */
for (const p of plan) {
  if (p.action !== "REVERT") continue;
  const opts = p.item.item.options || [];
  const ki = opts.findIndex((o) => o && o.is_correct);
  if (ki < 0) { problems.push(p.key + ": no key on the artifact item"); continue; }
  const slots = opts.map((_, i) => i).filter((i) => i !== ki);
  if (slots.length !== p.origD.length) {
    problems.push(p.key + ": " + p.origD.length + " original distractor(s) for " + slots.length + " slots");
    continue;
  }
  p.next = opts.map((o) => ({ ...o }));
  slots.forEach((slot, j) => { p.next[slot] = { ...p.next[slot], text: p.origD[j] }; });
  if (p.next[ki].text !== opts[ki].text) problems.push(p.key + ": the key text changed");
  if (p.next.findIndex((o) => o.is_correct) !== ki) problems.push(p.key + ": the key moved");
  if (p.next.map((o) => o.id).join(",") !== opts.map((o) => o.id).join(",")) {
    problems.push(p.key + ": option ids or order changed");
  }
}

const byAction = plan.reduce((m, p) => { m[p.action] = (m[p.action] || 0) + 1; return m; }, {});
console.log(APPLY ? "APPLY -- rewriting " + ART : "DRY RUN -- nothing will be written");
console.log("  review rows          " + review.items.length);
for (const [k, v] of Object.entries(byAction)) console.log("  " + k.padEnd(20) + v);
console.log("");
for (const p of plan) {
  console.log("  " + p.key.padEnd(8) + p.action.padEnd(18) + (p.basis || "") + (p.reason ? " -- " + p.reason : ""));
}
console.log("");
console.log("  DATABASE: pilot 4 was never inserted -- PILOT-DRAFT-INSERTED.json holds pilots 2 and 3");
console.log("  only, and 0 rows match a pilot-4 stem. Nothing to read back.");

if (problems.length) {
  console.error("");
  console.error("ABORT -- nothing written:");
  for (const x of problems) console.error("  " + x);
  process.exitCode = 2; process.exit();
}
if (!APPLY) {
  console.log("");
  console.log("  dry run clean: 6 keeps, " + (byAction.REVERT || 0) + " reverts, no key moved.");
  process.exitCode = 0; process.exit();
}

/* ---- write the artifact ---- */
for (const p of plan) {
  const d = p.item.de_cue || (p.item.de_cue = {});
  d.final_decision = p.action;
  d.final_basis = p.basis;
  d.final_reason = p.reason;
  d.final_ruled = "2026-09-28, PROMPT-85 addendum section B";
  if (p.action === "REVERT" && p.next) {
    d.reverted_from = (p.item.item.options || []).map((o) => o.text);
    p.item.item.options = p.next;
    d.state = "reverted";
  }
}
art.de_cue_final = {
  ruled: "2026-09-28, PROMPT-85 addendum section B",
  keep: DECISION.map(([t, n, , basis]) => t + "#" + n + (basis === "HUMAN OVERRIDE" ? " (override)" : "")),
  kept: keeps.length,
  reverted: byAction.REVERT || 0,
  already_reverted: byAction["ALREADY REVERTED"] || 0,
  database_rows_affected: 0,
  note: "Pilot 4 was never inserted. The clang-triggered keeps stand as finished rewrites; ruling A " +
    "removes clang from the de-cue TRIGGER for future runs and keeps it in check 3 as a delta.",
};
writeFileSync(join(ROOT, ART), JSON.stringify(art, null, 1) + "\n", "utf8");

/* Read the artifact back and assert what landed. */
const back = JSON.parse(readFileSync(join(ROOT, ART), "utf8"));
const post = [];
const backByTask = new Map();
for (const r of back.items) {
  if (r.verdict !== "survivor" || !r.de_cue) continue;
  if (!backByTask.has(r.task_code)) backByTask.set(r.task_code, []);
  backByTask.get(r.task_code).push(r);
}
let keptBack = 0, revertedBack = 0;
for (const p of plan) {
  const [task, nth] = p.key.split("#");
  const got = (backByTask.get(task) || [])[Number(nth) - 1];
  if (!got) { post.push(p.key + ": not found on read-back"); continue; }
  if (got.de_cue.final_decision !== p.action) post.push(p.key + ": decision did not land");
  if (p.action === "KEEP") keptBack++;
  if (p.action === "REVERT") {
    revertedBack++;
    const ki = got.item.options.findIndex((o) => o && o.is_correct);
    const dist = got.item.options.filter((_, i) => i !== ki).map((o) => o.text);
    if (JSON.stringify(dist) !== JSON.stringify(p.origD)) post.push(p.key + ": distractors did not revert");
  }
}
if (post.length) {
  console.error("");
  console.error("WROTE, BUT THE READ-BACK DISAGREES:");
  for (const x of post) console.error("  " + x);
  process.exitCode = 2; process.exit();
}
console.log("");
console.log("  read back: " + keptBack + " kept, " + revertedBack + " reverted, every decision recorded,");
console.log("  no key moved, no option reordered.");
