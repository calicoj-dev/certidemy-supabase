#!/usr/bin/env node
/* Read-only. Runs EVERY control suite under scripts/lib that takes no required argument.
 * It covered three of thirty-six and was named as though it covered the lot; a runner that
 * omits suites silently is the coverage gap the method rules are about. */
import { groundedGateControls } from "./lib/grounded-gates.mjs";
import { storedItemControls } from "./lib/stored-item.mjs";
import { quoteNoiseControls } from "./lib/quote-noise.mjs";
import { passageKeyControls } from "./lib/passage-key.mjs";
import { passageIndexControls } from "./lib/passage-index.mjs";
import { anchorAssignmentControls } from "./lib/anchor-assignment.mjs";
import { anchorCapControls } from "./lib/anchor-cap.mjs";
import { effectivePrimaryControls } from "./lib/effective-primary.mjs";
import { modalDriftControls } from "./lib/modal-drift.mjs";
import { balancedKeyOrderControls } from "./lib/balanced-key-order.mjs";
import { blindSolverControls } from "./lib/blind-solver.mjs";
import { checkpointControls } from "./lib/checkpoint-fields.mjs";
import { clauseNumberRecallControls } from "./lib/clause-number-recall.mjs";
import { deCueCheckControls } from "./lib/de-cue-checks.mjs";
import { declaredEditControls } from "./lib/declared-english-edits.mjs";
import { definitionBoundaryControls } from "./lib/definition-boundary.mjs";
import { expectedHashControls } from "./lib/expected-review-hashes.mjs";
import { explanationOptionRefControls } from "./lib/explanation-option-ref.mjs";
import { heavyReaderLockControls } from "./lib/heavy-reader-lock.mjs";
import { itemDispositionControls } from "./lib/item-disposition.mjs";
import { itemIdControls } from "./lib/item-id.mjs";
import { jsSourceControls } from "./lib/js-source.mjs";
import { quotationModeControls } from "./lib/leak-score.mjs";
import { optionsProbeControls } from "./lib/options-probe.mjs";
import { runOnControls } from "./lib/passage-runon.mjs";
import { refusalControls } from "./lib/refusal-pattern.mjs";
import { renderGateControls } from "./lib/render-gates.mjs";
import { shapeCueControls } from "./lib/shape-cues.mjs";
import { supersededControls } from "./lib/superseded-wording.mjs";
import { taskFloorControls } from "./lib/task-floors.mjs";
import { translateItemControls } from "./lib/translate-item.mjs";
import { controls as translationCheckControls } from "./lib/translation-checks.mjs";
import { translationLintControls } from "./lib/translation-term-lint.mjs";
import { populationControls } from "./lib/verify-cert-population.mjs";
import { clauseAddressControls } from "./lib/clause-address.mjs";

/* Suites needing an argument cannot run here. NAMED, not omitted. */
const NEEDS_ARGUMENT = [
  ["aimsf-task-sources-map  mapControls(passages)", "needs the passage library; run by verify-cert"],
  ["reporter-gate-parity    reporterGateParityControls(runCodeGates, src)", "needs the gate runner and the reporter source; run by gen-grounded-items"],
];

const SUITES = [
  ["grounded-gates", groundedGateControls], ["stored-item", storedItemControls],
  ["quote-noise", quoteNoiseControls], ["passage-key", passageKeyControls],
  ["passage-index", passageIndexControls], ["anchor-assignment", anchorAssignmentControls],
  ["anchor-cap", anchorCapControls], ["effective-primary", effectivePrimaryControls],
  ["modal-drift", modalDriftControls], ["balanced-key-order", balancedKeyOrderControls],
  ["blind-solver", blindSolverControls], ["checkpoint-fields", checkpointControls],
  ["clause-number-recall", clauseNumberRecallControls], ["de-cue-checks", deCueCheckControls],
  ["declared-edits", declaredEditControls], ["definition-boundary", definitionBoundaryControls],
  ["expected-hashes", expectedHashControls], ["explanation-option-ref", explanationOptionRefControls],
  ["heavy-reader-lock", heavyReaderLockControls], ["item-disposition", itemDispositionControls],
  ["item-id", itemIdControls], ["js-source", jsSourceControls],
  ["quotation-mode", quotationModeControls], ["options-probe", optionsProbeControls],
  ["passage-runon", runOnControls], ["refusal-pattern", refusalControls],
  ["render-gates", renderGateControls], ["shape-cues", shapeCueControls],
  ["superseded-wording", supersededControls], ["task-floors", taskFloorControls],
  ["translate-item", translateItemControls], ["translation-checks", translationCheckControls],
  ["translation-term-lint", translationLintControls], ["verify-cert-population", populationControls],
  ["clause-address", clauseAddressControls],
];

/* FOUR CONTRACTS, and reading only one reported fifteen suites as "examined 0". Three carry a
 * denominator; the fourth returns only failure NAMES, so its empty result is a pass that cannot
 * say over how many cases. That is reported as unmeasured coverage, not as green. A shape this
 * cannot read at all is UNREADABLE, never zero. */
const caseList = (xs) => ({ n: xs.length,
  fails: xs.filter((x) => x && x.pass === false)
    .map((x) => String(x.what || x.name || x.label || x.why || JSON.stringify(x).slice(0, 80))) });

function normalise(c) {
  if (Array.isArray(c)) {
    if (c.length && typeof c[0] === "object" && c[0] !== null && "pass" in c[0]) return caseList(c);
    return { n: null, fails: c.map(String) };          /* failure names only, no denominator */
  }
  if (!c || typeof c !== "object") return null;
  if (typeof c.examined === "number") return { n: c.examined, fails: (c.fails || []).map(String) };
  if (Array.isArray(c.cases)) return caseList(c.cases);
  return null;
}

/* POSITIVE CONTROL. A runner reporting "all pass" over thirty-four suites is worth nothing unless
 * something proves it can still say FAIL. One synthetic suite per contract, each deliberately
 * broken, run first and asserted. They are NOT counted in the totals below. */
async function selfControl() {
  const planted = [
    ["{examined,fails}", () => ({ examined: 3, fails: ["planted"] })],
    ["{cases,allPass}", () => ({ cases: [{ pass: true }, { pass: false, what: "planted" }] })],
    ["array of cases", () => [{ pass: false, what: "planted" }]],
    ["failure names", () => ["planted"]],
    ["async", () => Promise.resolve(["planted"])],
  ];
  const missed = [];
  /* awaited exactly as the loop does: the async arm failed when this called normalise directly */
  for (const [name, fn] of planted) {
    const c = normalise(await fn());
    if (!c) { missed.push(name + ": the runner could not read it"); continue; }
    if (c.fails.length !== 1) missed.push(name + ": a planted failure was not reported");
  }
  /* and the other direction -- a clean suite must not be reported as failing */
  const clean = normalise(await Promise.resolve({ examined: 2, fails: [] }));
  if (!clean || clean.fails.length) missed.push("a clean suite was reported as failing");
  if (normalise(42) !== null) missed.push("an unreadable shape was not refused");
  return missed;
}

let bad = 0, vacuous = 0, broke = 0, unreadable = 0, unmeasured = 0, examined = 0, ran = 0;
const selfMissed = await selfControl();
console.log("POSITIVE CONTROL -- 5 planted failures, one per contract, plus 2 negative arms: " +
  (selfMissed.length ? selfMissed.length + " MISSED" : "all 7 detected"));
for (const m of selfMissed) console.log("    MISSED " + m);
console.log("");
console.log("CONTROL SUITES -- " + SUITES.length + " runnable, " + NEEDS_ARGUMENT.length + " need an argument");
console.log("");
for (const [label, fn] of SUITES) {
  let raw;
  /* awaited: expectedHashControls is async, and reading its Promise reported it as unreadable */
  try { raw = await fn({ quiet: true }); } catch (e) {
    console.log("  " + label.padEnd(24) + "  COULD NOT RUN: " + String(e.message).slice(0, 70));
    broke++; continue;
  }
  const c = normalise(raw);
  if (!c) {
    console.log("  " + label.padEnd(24) + "  UNREADABLE RESULT -- keys: " +
      (raw && typeof raw === "object" ? Object.keys(raw).join(",") : typeof raw));
    unreadable++; continue;
  }
  ran++;
  if (c.n === null) {
    unmeasured++;
    console.log("  " + label.padEnd(24) + "    ?" + " case(s)   " +
      (c.fails.length ? c.fails.length + " FAIL" : "no failures, DENOMINATOR UNMEASURED"));
  } else {
    examined += c.n;
    /* A suite examining nothing is VACUOUS, not green. */
    const verdict = c.fails.length ? c.fails.length + " FAIL" : c.n ? "all pass" : "VACUOUS -- examined 0";
    console.log("  " + label.padEnd(24) + String(c.n).padStart(5) + " case(s)   " + verdict);
    if (!c.n && !c.fails.length) vacuous++;
  }
  for (const f of c.fails) { console.log("      FAIL " + f); bad++; }
}
console.log("");
for (const [label, why] of NEEDS_ARGUMENT) console.log("  NOT COVERED HERE  " + label + "  -- " + why);
console.log("");
console.log("  " + ran + " suite(s) read, " + examined + " case(s) examined, " + bad + " failure(s), " +
  vacuous + " vacuous, " + unreadable + " unreadable, " + broke + " could not run");
console.log("  " + unmeasured + " suite(s) report only failure NAMES: green, over a denominator they " +
  "do not state.");
if (bad || vacuous || broke || unreadable || selfMissed.length) {
  console.log("  A vacuous, unreadable or unrunnable suite is not a pass, and neither is a runner " +
    "that cannot detect its own planted failures. Exit 2.");
}
process.exitCode = (bad || vacuous || broke || unreadable || selfMissed.length) ? 2 : 0;
