#!/usr/bin/env node
/**
 * READ-ONLY, NO MODEL CALLS. Project what a generation round will cost, PER TASK.
 *
 * Ruled PROMPT-117 s6: project from R3's per-task token use, not R2's. R2's cost per item was $0.256
 * and R3's was $0.526 -- the same generator, the same model, twice the price -- because THE SOLVER
 * PROMPT CARRIES THE WHOLE TASK MAP. A task with 15 effective primaries sends roughly twice the
 * passage text per call that one with 6 does, and the solver runs twice per survivor. A projection that
 * multiplies a flat per-item figure by a count cannot see that, which is how R3 was projected at $14
 * and spent $29.45.
 *
 * ============ THE MODEL ============
 *
 *   solver input per call  =  FIXED_IN + (the task's mapped passage text) / CHARS_PER_TOKEN
 *   solver calls per item  =  measured in R3
 *   every other role       =  flat per item, measured in R3
 *
 * ============ AND IT IS CALIBRATED AGAINST A RUN THAT HAPPENED ============
 *
 * `--calibrate=<artifact>` re-projects the round that artifact records and prints the projection beside
 * the actual spend. A projection that cannot reproduce a measured run is not a projection, and this is
 * the only way to see that before trusting it on a new task set.
 *
 *   --cert=<CODE>           required
 *   --tasks=a:n,b:n         the round being projected
 *   --calibrate=<artifact>  check the model against a finished round instead
 *   --no-probe              the options probe is withdrawn (PROMPT-117 s2); default for a projection
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { buildGateContext } from "./lib/gate-context.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let CERT = null, TASKS = null, CALIBRATE = null, WITH_PROBE = false;
for (const a of process.argv.slice(2)) {
  let m = a.match(/^--cert=(.+)$/); if (m) { CERT = m[1]; continue; }
  m = a.match(/^--tasks=(.+)$/); if (m) { TASKS = m[1]; continue; }
  m = a.match(/^--calibrate=(.+)$/); if (m) { CALIBRATE = m[1]; continue; }
  if (a === "--with-probe") { WITH_PROBE = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --cert=, --tasks=, --calibrate=, --with-probe.");
  process.exit(2);
}
if (!CERT) { console.error("--cert=<CODE> is required."); process.exit(2); }
if (!TASKS && !CALIBRATE) { console.error("one of --tasks= or --calibrate= is required."); process.exit(2); }

const PRICE = { input: 15, output: 75 };   /* USD per Mtok, claude-opus-5 */
const usdOf = (inTok, outTok) => (inTok / 1e6) * PRICE.input + (outTok / 1e6) * PRICE.output;

/* ---------------------------------------------------------------- measured on R3 */
/* 7 tasks, 56 generated, 49 survivors, $29.4477 over 202 calls. Every figure below is R3's, divided by
 * the number of items it applied to -- never a guess and never carried over from R2. */
const R3 = {
  generated: 56, survivors: 49, tasks: 7,
  /* per GENERATED item */
  writer_in_per_item: 75409 / 56, writer_out_per_item: 124037 / 56,
  paraphrase_calls_per_item: 16 / 56, paraphrase_in_per_call: 139419 / 16, paraphrase_out_per_call: 18416 / 16,
  decue_calls_per_item: 11 / 56, decue_in_per_call: 13819 / 11, decue_out_per_call: 12667 / 11,
  probe_calls_per_item: 57 / 56, probe_in_per_call: 36583 / 57, probe_out_per_call: 17393 / 57,
  /* the solver, which is the part that scales with the task */
  solver_calls_per_item: 102 / 56, solver_out_per_call: 22414 / 102,
  recheck_calls_per_item: 8 / 56, recheck_in_per_call: 51000 / 8, recheck_out_per_call: 1332 / 8,
  solver_in_total: 665658, solver_calls: 102,
};
const CHARS_PER_TOKEN = 4;   /* English prose; the calibration run is what tests it */

const KEY = requireKey(HERE);
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }
const ctx = await buildGateContext(KEY, CERT);
const tasks = await getAll(KEY, "tasks?select=id,code&certification_id=eq." + cert.id + "&order=code");

/* the passage text the solver is handed for a task: its primaries plus its supporting passages */
function passageChars(code) {
  const tid = ctx.taskIdOfCode.get(code);
  const map = ctx.mapByTask.get(tid) || { primary: [], supporting: [] };
  let chars = 0, n = 0;
  const seen = new Set();
  for (const k of [...map.primary, ...map.supporting]) {
    const sig = k.source_id + "|" + k.edition + "|" + k.clause;
    if (seen.has(sig)) continue; seen.add(sig);
    const p = ctx.index.get(k.source_id, k.edition, String(k.clause));
    if (!p) continue;
    chars += String(p.text || "").length + String(p.title || "").length;
    n++;
  }
  return { chars, passages: n };
}

/* ---- the fixed part of a solver prompt, derived from R3 rather than assumed ----
 * R3's mean solver input per call is known; the mean task passage size is measurable. The difference is
 * the system prompt plus the item, which does not vary with the task. */
const r3Tasks = ["2.1", "2.7", "3.1", "3.8", "4.6", "4.7", "5.7"];
const r3Chars = r3Tasks.map((c) => passageChars(c).chars);
const r3MeanChars = r3Chars.reduce((a, b) => a + b, 0) / r3Chars.length;
const r3MeanSolverIn = R3.solver_in_total / R3.solver_calls;
const FIXED_IN = Math.max(0, Math.round(r3MeanSolverIn - r3MeanChars / CHARS_PER_TOKEN));
console.log("CALIBRATION FROM R3");
console.log("  mean solver input per call    " + Math.round(r3MeanSolverIn) + " tokens");
console.log("  mean task passage text        " + Math.round(r3MeanChars) + " chars = " +
  Math.round(r3MeanChars / CHARS_PER_TOKEN) + " tokens");
console.log("  fixed part (system + item)    " + FIXED_IN + " tokens");
console.log("  per-task passage text, R3:    " + r3Tasks.map((c, i) => c + "=" + r3Chars[i]).join("  "));

function projectTask(code, n) {
  const { chars, passages } = passageChars(code);
  const solverIn = FIXED_IN + chars / CHARS_PER_TOKEN;
  const solverCalls = n * R3.solver_calls_per_item;
  let inTok = n * R3.writer_in_per_item, outTok = n * R3.writer_out_per_item;
  inTok += solverCalls * solverIn; outTok += solverCalls * R3.solver_out_per_call;
  inTok += n * R3.paraphrase_calls_per_item * R3.paraphrase_in_per_call;
  outTok += n * R3.paraphrase_calls_per_item * R3.paraphrase_out_per_call;
  inTok += n * R3.decue_calls_per_item * R3.decue_in_per_call;
  outTok += n * R3.decue_calls_per_item * R3.decue_out_per_call;
  inTok += n * R3.recheck_calls_per_item * R3.recheck_in_per_call;
  outTok += n * R3.recheck_calls_per_item * R3.recheck_out_per_call;
  if (WITH_PROBE) {
    inTok += n * R3.probe_calls_per_item * R3.probe_in_per_call;
    outTok += n * R3.probe_calls_per_item * R3.probe_out_per_call;
  }
  return { code, n, passages, chars, solverIn: Math.round(solverIn), usd: usdOf(inTok, outTok) };
}

if (CALIBRATE) {
  const art = JSON.parse(readFileSync(join(ROOT, CALIBRATE), "utf8"));
  const gen = (art.items || []).reduce((m, it) => m.set(it.task_code, (m.get(it.task_code) || 0) + 1), new Map());
  console.log("");
  console.log("CALIBRATION AGAINST " + CALIBRATE + "   (the probe is included only if --with-probe)");
  let total = 0;
  for (const [code, n] of [...gen].sort()) {
    const p = projectTask(code, n);
    total += p.usd;
    console.log("  " + code.padEnd(6) + String(n).padStart(3) + " item(s)  " + String(p.passages).padStart(3) +
      " passage(s)  " + String(p.chars).padStart(6) + " chars  solver-in " + String(p.solverIn).padStart(6) +
      "  $" + p.usd.toFixed(2));
  }
  const actual = art.spend ? art.spend.usd : null;
  console.log("  PROJECTED $" + total.toFixed(2) + "   ACTUAL $" + (actual ?? "?") +
    (actual ? "   error " + (100 * (total - actual) / actual).toFixed(1) + "%" : ""));
  console.log("  A projection that cannot reproduce a measured run is not a projection.");
  process.exit(0);
}

/* ---------------------------------------------------------------- the projection */
const want = TASKS.split(",").map((s) => s.trim()).filter(Boolean).map((s) => {
  const m = s.match(/^(.+?):([0-9]+)$/);
  if (!m) { console.error("--tasks wants code:count, e.g. 3.11:14. Got " + JSON.stringify(s)); process.exit(2); }
  return { code: m[1], n: Number(m[2]) };
});
const known = new Set(tasks.map((t) => t.code));
for (const w of want) if (!known.has(w.code)) { console.error("no task " + w.code + " on " + CERT); process.exit(2); }

console.log("");
console.log("PROJECTION   " + CERT + "   " + want.length + " task(s), " +
  want.reduce((n, w) => n + w.n, 0) + " item(s) attempted" + (WITH_PROBE ? "" : "   probe withdrawn"));
console.log("  task    items  passages   chars  solver-in      $");
let total = 0;
const rows = [];
for (const w of want) {
  const p = projectTask(w.code, w.n);
  total += p.usd; rows.push(p);
  console.log("  " + p.code.padEnd(7) + String(p.n).padStart(5) + String(p.passages).padStart(10) +
    String(p.chars).padStart(8) + String(p.solverIn).padStart(11) + "   $" + p.usd.toFixed(2));
}
const survivalR3 = R3.survivors / R3.generated;
console.log("");
console.log("  PROJECTED TOTAL              $" + total.toFixed(2));
console.log("  per attempted item           $" + (total / want.reduce((n, w) => n + w.n, 0)).toFixed(3));
console.log("  at R3's survival (" + Math.round(100 * survivalR3) + "%)      " +
  Math.round(want.reduce((n, w) => n + w.n, 0) * survivalR3) + " survivor(s), $" +
  (total / (want.reduce((n, w) => n + w.n, 0) * survivalR3)).toFixed(3) + " per survivor");
const dearest = [...rows].sort((a, b) => b.usd / b.n - a.usd / a.n)[0];
const cheapest = [...rows].sort((a, b) => a.usd / a.n - b.usd / b.n)[0];
console.log("  dearest per item             " + dearest.code + " $" + (dearest.usd / dearest.n).toFixed(3) +
  " (" + dearest.passages + " passages)");
console.log("  cheapest per item            " + cheapest.code + " $" + (cheapest.usd / cheapest.n).toFixed(3) +
  " (" + cheapest.passages + " passages)");
