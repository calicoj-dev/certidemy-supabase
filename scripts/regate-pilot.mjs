/**
 * regate-pilot.mjs -- run the CURRENT code gates over a pilot artifact and report which verdicts
 * move. No regeneration, no model call, no write.
 *
 * READ-ONLY. Unknown flags exit 2.
 *
 * ============ WHY THIS EXISTS AS ITS OWN SCRIPT ============
 *
 * `gen-grounded-items.mjs --from=` re-gates too, but it also re-runs the blind solver and the
 * options probe -- eighty model calls to answer a question that is entirely about code. Worse, the
 * solver is a sample: it accepted an item on one run and rejected it on the next, so a re-run
 * would mix a real gate change with sampling noise and the delta would be unattributable.
 *
 * This changes ONE THING. The items are byte-for-byte the artifact's, the solver verdict is
 * carried across untouched, and every difference is a code gate.
 *
 * ============ AND IT REPORTS MOVEMENT IN BOTH DIRECTIONS ============
 *
 * A gate change that only loosens is a gate we have stopped hearing from. So the report names
 * items that START passing AND items that STOP -- the second is the half nobody asks for, and it
 * is the half that catches a fix from going too far.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { runCodeGates, groundedGateControls } from "./lib/grounded-gates.mjs";
import { cueConfigFor } from "../functions/_shared/item-rules/item-cue-guard.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let IN = "PILOT-GROUNDED-AIMSF-2.json", CERT = "AIMS-F", OUT = null;
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--in=(.+)$/.exec(a))) { IN = m[1]; continue; }
  if ((m = /^--cert=(.+)$/.exec(a))) { CERT = m[1]; continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY; flags are --in=, --cert=, --out=");
  process.exitCode = 2; process.exit();
}

{
  const c = groundedGateControls();
  if (c.fails.length) {
    console.error("REFUSING TO RUN -- the gates' own controls fail:");
    for (const f of c.fails) console.error("  " + f);
    process.exitCode = 2; process.exit();
  }
  console.log("gate controls: " + c.examined + " cases, all pass");
}

const art = JSON.parse(readFileSync(join(ROOT, IN), "utf8"));
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const annexGaps = lib.annex_gaps || [];
const sequenceGaps = lib.sequence_gaps || [];
let declaredGaps = [];
try {
  const compl = JSON.parse(readFileSync(join(ROOT, "LIBRARY-COMPLETENESS.json"), "utf8"));
  declaredGaps = (compl.sources || []).map((s) => ({ holes: s.missing || [] }));
} catch {
  console.log("  LIBRARY-COMPLETENESS.json absent: a real-but-unheld clause will be refused as absent");
}
const passagesByKey = new Map(lib.passages
  .filter((p) => p.source_id === art.standard && p.edition === art.edition)
  .map((p) => [p.clause, p]));

/* The leak index, for the reproduction gate. Without it that gate reports UNASSERTED and no item
 * can be cleared -- which would make every verdict move for the wrong reason. */
const leakMod = await import("./lib/leak-score.mjs");
let leakSources = null;
try { leakSources = leakMod.buildSources(); } catch (e) {
  console.error("REFUSING TO RUN: the leak index could not be built -- " + String(e.message).slice(0, 140));
  console.error("Every item would be UNASSERTED on reproduction and the comparison would be noise.");
  process.exitCode = 3; process.exit();
}
console.log("  leak index: " + leakSources.size + " documents");

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq." + CERT);
const cid = certs[0].id;
const allTasks = await getAll(KEY, "tasks?select=id,certification_id,code&order=code");
const tasks = allTasks.filter((t) => t.certification_id === cid);
const taskIdOfCode = new Map(tasks.map((t) => [t.code, t.id]));
const certRow = await getAll(KEY, "certifications?select=id,exam_blueprint&code=eq." + CERT);
const cueCfg = cueConfigFor(certRow[0].exam_blueprint);

const tsRows = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id");
const pById = new Map((await getAll(KEY, "source_passages?select=id,clause&order=id")).map((r) => [r.id, r.clause]));
const mapByTask = new Map();
for (const r of tsRows) {
  if (!mapByTask.has(r.task_id)) mapByTask.set(r.task_id, { primary: [], supporting: [] });
  const c = pById.get(r.passage_id);
  if (c) mapByTask.get(r.task_id)[r.role].push(c);
}
const primaryOf = (code) => (mapByTask.get(taskIdOfCode.get(code)) || {}).primary || [];
const supportingOf = (code) => (mapByTask.get(taskIdOfCode.get(code)) || {}).supporting || [];

const liveRows = await getAll(KEY,
  "quiz_questions?select=id,task_id,question_text&certification_id=eq." + cid +
  "&language=eq.en&retired_at=is.null&order=id");
const liveByTask = new Map();
for (const r of liveRows) {
  if (!liveByTask.has(r.task_id)) liveByTask.set(r.task_id, []);
  liveByTask.get(r.task_id).push({ id: String(r.id).slice(0, 8), stem: r.question_text || "" });
}

/* ---------------------------------------------------------------- re-gate */
const moved = [];
const out = [];
for (const r of art.items || []) {
  const code = runCodeGates(r.item, {
    passagesByKey, annexGaps, sequenceGaps: [...sequenceGaps, ...declaredGaps], cert: CERT,
    liveStemsForTask: liveByTask.get(taskIdOfCode.get(r.task_code)) || [], cueCfg,
    primaryClauses: primaryOf(r.task_code), supportingClauses: supportingOf(r.task_code),
    sources: leakSources, leak: leakMod,
  });
  /* The solver's verdict is CARRIED, not re-asked: it is a sample, and re-rolling it would mix
   * sampling noise into a comparison that is entirely about code. */
  const solverWasOk = !r.solver || r.solver.state === "accepted";
  const nowVerdict = !code.passed ? "rejected by code"
    : (r.solver && r.solver.state === "rejected") ? "rejected by solver"
    : (r.solver && r.solver.state === "could-not-run") ? "solver could not run"
    : "survivor";
  const was = r.verdict;
  const rec = {
    task_code: r.task_code, clause: r.item.key_support_clause,
    was, now: nowVerdict,
    was_failed: r.failed || [], now_failed: code.failed,
    now_unasserted: code.unasserted,
    notes: code.gates.flatMap((g) => g.notes || []),
    reason: code.failed.length ? code.gates.filter((g) => g.pass === false)
      .map((g) => g.id + ": " + g.reason).join("; ")
      : (r.solver && r.solver.state === "rejected") ? "solver (carried): " + r.solver.reason : null,
  };
  out.push(rec);
  if (was !== nowVerdict) moved.push(rec);
}

/* ---------------------------------------------------------------- report */
const wasSurv = (art.items || []).filter((r) => r.verdict === "survivor").length;
const nowSurv = out.filter((r) => r.now === "survivor").length;
console.log("");
console.log("RE-GATE  " + IN + "  --  code gates only, solver verdict carried");
console.log("  items                " + out.length);
console.log("  survivors BEFORE     " + wasSurv);
console.log("  survivors AFTER      " + nowSurv + "   (" + (nowSurv - wasSurv >= 0 ? "+" : "") + (nowSurv - wasSurv) + ")");
console.log("");

const nowPassing = moved.filter((r) => r.now === "survivor");
const nowFailing = moved.filter((r) => r.was === "survivor");
console.log("  NOW PASSING  " + nowPassing.length);
for (const r of nowPassing) {
  console.log("    " + r.task_code.padEnd(5) + "[" + String(r.clause).padEnd(8) + "]  was refused for: " +
    (r.was_failed.join(", ") || "(solver)"));
}
console.log("");
console.log("  NOW FAILING that previously survived  " + nowFailing.length +
  "   (a fix that only loosens is a gate we have stopped hearing from)");
for (const r of nowFailing) {
  console.log("    " + r.task_code.padEnd(5) + "[" + String(r.clause).padEnd(8) + "]  " + r.now_failed.join(", "));
}
console.log("");
console.log("  STILL REFUSED  " + out.filter((r) => r.now === "rejected by code").length);
for (const r of out.filter((r) => r.now === "rejected by code")) {
  console.log("    " + r.task_code.padEnd(5) + "[" + String(r.clause).padEnd(8) + "]  " + r.now_failed.join(", "));
  console.log("        " + String(r.reason).slice(0, 150));
}

const flagged = out.filter((r) => (r.notes || []).length);
console.log("");
console.log("  FLAGGED BUT NOT REFUSED  " + flagged.length + "   (the negation rule, now a flag by ruling)");
for (const r of flagged) console.log("    " + r.task_code + "  " + r.notes.join("; ").slice(0, 120));

OUT = OUT || IN.replace(/\.json$/, "-REGATED.json");
writeFileSync(join(ROOT, OUT), JSON.stringify({
  source_artifact: IN, method: "current code gates over the stored items; solver verdict carried",
  survivors_before: wasSurv, survivors_after: nowSurv,
  now_passing: nowPassing.length, now_failing: nowFailing.length,
  items: out,
}, null, 1) + "\n", "utf8");
console.log("");
console.log("wrote " + OUT);
