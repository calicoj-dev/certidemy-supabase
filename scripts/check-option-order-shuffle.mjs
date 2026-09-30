#!/usr/bin/env node
/**
 * check-option-order-shuffle.mjs -- the s1e test: a shuffled attempt grades identically.
 *
 * READ-ONLY, no network, no credential. Unknown flags exit 2.
 *
 * Ruled PROMPT-95 s1e: "Write the change and a test showing that a shuffled attempt grades identically."
 *
 * ============ THE TEST USES REAL ITEMS, NOT A FIXTURE ============
 *
 * The module's own controls run on a synthetic four-option item, which is right for the permutation's
 * properties. This runs the same claim over EVERY grounded item in the artifacts -- real option counts, real
 * ids, real keys -- because the claim being made is about this bank, and a fixture cannot be short an option
 * or carry a duplicate id the way a real row can.
 *
 * For each item, for each of several session ids, it:
 *   1. renders the options through orderOptionsForAttempt;
 *   2. finds the option whose TEXT is the key, as a candidate reading the screen would;
 *   3. grades that pick with the SAME predicate the two live graders use -- id-set equality;
 *   4. asserts the grade is correct, and that a wrong pick still grades wrong.
 *
 * If step 4 held while the order never moved, the test would be vacuous -- so the number of items whose
 * order actually changed is asserted too, and reported.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { orderOptionsForAttempt, optionOrderControls }
  from "../functions/_shared/item-rules/option-order.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

console.log("THE MODULE'S OWN CONTROLS");
const ctl = optionOrderControls();
const bad = ctl.filter((c) => !c.pass);
for (const c of bad) console.log("  FAIL " + c.what + "   " + c.detail);
console.log("  " + (ctl.length - bad.length) + " of " + ctl.length + " pass");
if (bad.length) { console.error("\nNo further test run: the permutation is broken."); process.exit(1); }
console.log("");

/* the grading predicate, in the shape both live graders use */
const gradesCorrect = (correctIds, givenIds) => {
  const c = new Set(correctIds), g = new Set(givenIds);
  return c.size === g.size && [...c].every((x) => g.has(x));
};

const FILES = ["AIMSF-ROLLOUT-B1.json", "AIMSF-B1-REVISED.json", "AIMSF-ROLLOUT-B2.json",
  "AIMSF-R2-PROBE.json", "AIMSF-R2-REST.json", "AIMSF-R3-PROBE.json", "AIMSF-R3-REST.json"];
const items = [];
for (const f of FILES) {
  const p = join(ROOT, f);
  if (!existsSync(p)) continue;
  for (const r of JSON.parse(readFileSync(p, "utf8")).items || []) {
    if (r.verdict !== "survivor") continue;
    /* the artifact carries {text, is_correct}; the BANK carries {id, text} + correct_answer. Build the bank
     * shape, because that is what the delivery path actually reorders. */
    const opts = (r.item.options || []).map((o, i) => ({ id: String.fromCharCode(97 + i), text: o.text }));
    const keyIdx = typeof r.item.correct_index === "number"
      ? r.item.correct_index : (r.item.options || []).findIndex((o) => o.is_correct);
    if (keyIdx < 0 || !opts.length) continue;
    items.push({ qid: r.item_id || String(items.length), task: r.task_code,
      options: opts, correct: [opts[keyIdx].id], keyText: String(opts[keyIdx].text) });
  }
}
const SESSIONS = ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333", "44444444-4444-4444-8444-444444444444",
  "55555555-5555-4555-8555-555555555555"];

let attempts = 0, correctGraded = 0, wrongGraded = 0, moved = 0, sameOnResume = 0, pairBroken = 0;
const posTally = {};
for (const it of items) {
  for (const s of SESSIONS) {
    attempts++;
    const shown = orderOptionsForAttempt(it.options, [s, it.qid]);
    /* the candidate picks by TEXT -- what is on the screen */
    const picked = shown.find((o) => o.text === it.keyText);
    if (picked && gradesCorrect(it.correct, [picked.id])) correctGraded++;
    /* a wrong pick must still be wrong */
    const wrong = shown.find((o) => o.id !== it.correct[0]);
    if (wrong && !gradesCorrect(it.correct, [wrong.id])) wrongGraded++;
    /* did the order actually move */
    if (shown.map((o) => o.id).join("") !== it.options.map((o) => o.id).join("")) moved++;
    /* RESUME: the same seed a second time must render the same order */
    const again = orderOptionsForAttempt(it.options, [s, it.qid]);
    if (again.map((o) => o.id).join("") === shown.map((o) => o.id).join("")) sameOnResume++;
    /* every id keeps its own text */
    for (const o of shown) {
      if (it.options.find((x) => x.id === o.id).text !== o.text) pairBroken++;
    }
    /* where the key ends up, across the whole run */
    const at = shown.findIndex((o) => o.id === it.correct[0]);
    posTally[at] = (posTally[at] || 0) + 1;
  }
}

const ok = (what, cond, detail) => {
  console.log((cond ? "  ok   " : "  FAIL ") + what + (cond ? "" : "   " + detail));
  return cond;
};
console.log("OVER EVERY GROUNDED SURVIVOR: " + items.length + " item(s) x " + SESSIONS.length +
  " session(s) = " + attempts + " attempt(s)");
let fails = 0;
if (!ok("every shuffled attempt grades the key CORRECT", correctGraded === attempts,
  correctGraded + " of " + attempts)) fails++;
if (!ok("every wrong pick still grades WRONG", wrongGraded === attempts,
  wrongGraded + " of " + attempts)) fails++;
if (!ok("the same (session, question) renders the same order -- a resume does not move the options",
  sameOnResume === attempts, sameOnResume + " of " + attempts)) fails++;
if (!ok("every option id kept its own text", pairBroken === 0, pairBroken + " pairing(s) broken")) fails++;
/* THE TEST MUST NOT BE VACUOUS: if the order never moved, "grades identically" is trivially true. */
if (!ok("the order actually MOVED in most attempts (or this test proves nothing)",
  moved > attempts * 0.6, "moved in only " + moved + " of " + attempts)) fails++;
console.log("");
console.log("  the order moved in " + moved + " of " + attempts + " attempt(s) (" +
  Math.round((moved / attempts) * 100) + "%)");
const n = Object.values(posTally).reduce((a, b) => a + b, 0);
console.log("  where the KEY ended up, across every attempt:  " +
  [0, 1, 2, 3].map((p) => String.fromCharCode(65 + p) + ":" +
    Math.round(((posTally[p] || 0) / n) * 100) + "%").join("  "));
console.log("");
if (fails) { console.log(fails + " assertion(s) FAILED"); process.exitCode = 1; }
else {
  console.log("A SHUFFLED ATTEMPT GRADES IDENTICALLY. Asserted against the same id-set predicate that");
  console.log("score-mock-exam:129 and submit-quiz-answer:106 use, over every real grounded item.");
  console.log("");
  console.log("NOT DEPLOYED. The diff is for the director to read; Juan deploys it.");
}
