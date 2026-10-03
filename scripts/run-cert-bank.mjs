#!/usr/bin/env node
/**
 * run-cert-bank.mjs -- run ONE pipeline stage for ONE certification. Dry by default.
 *
 * A WRAPPER, NOT A STAGE. It adds no logic: every stage is an existing script, spawned with its own
 * flags, and its exit code is this script's exit code. Nothing certification-specific is hard-coded --
 * the cert code is passed through, and a stage that has no generic script says so rather than
 * pretending AIMS-F's one is general.
 *
 * `docs/CERT-PIPELINE.md` is the order and the gates. This file is how you run them.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const METRICS = join(ROOT, "PIPELINE-METRICS.json");

let CERT = null, STAGE = null, APPLY = false, LIST = false, NOTE = null, SENTBACK = null;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--apply") { APPLY = true; continue; }
  if (a === "--list") { LIST = true; continue; }
  let m = a.match(/^--cert(?:=(.+))?$/);
  if (m) { CERT = m[1] || argv[++i]; continue; }
  m = a.match(/^--stage(?:=(.+))?$/);
  if (m) { STAGE = Number(m[1] || argv[++i]); continue; }
  m = a.match(/^--note=(.+)$/);
  if (m) { NOTE = m[1]; continue; }
  m = a.match(/^--sent-back=(.+)$/);
  if (m) { SENTBACK = Number(m[1]); continue; }
  console.error("Unrecognised flag: " + a);
  console.error("  --cert <CODE> --stage <n>   the stage to run (1-8). Dry by default.");
  console.error("  --apply                     pass --apply through to the stage script.");
  console.error("  --list                      print the stages and exit.");
  console.error("  --sent-back=<n> --note=<t>  record the director's send-back count for this stage.");
  process.exit(2);
}

/* ============ THE STAGES. `script` is spawned; `writes` is what it may change. ============ */
const STAGES = {
  1: { name: "library completeness", writes: "nothing",
       script: "check-library-completeness.mjs", args: () => [] },
  2: { name: "task map and floors", writes: "nothing",
       script: "check-task-map.mjs", args: (c) => ["--cert", c] },
  3: { name: "generation rounds", writes: "drafts",
       script: "gen-grounded-items.mjs", args: (c) => ["--cert", c] },
  4: { name: "the director's read", writes: "verdicts only",
       script: "emit-pilot-report.mjs", args: (c) => ["--cert", c] },
  5: { name: "translation", writes: "pending_review siblings",
       script: "translate-grounded-items.mjs", args: (c) => ["--cert", c] },
  6: { name: "approval", writes: "status=approved, item_origin=grounded",
       script: "approve-grounded-items.mjs", args: (c) => ["--cert", c] },
  7: { name: "cutover", writes: "retired_at on not-kept items",
       script: "cutover-aimsf.mjs", args: (c) => ["--cert=" + c] },
  8: { name: "verify-cert", writes: "nothing",
       script: "verify-cert.mjs", args: (c) => ["--cert", c] },
};

if (LIST) {
  console.log("PIPELINE STAGES (docs/CERT-PIPELINE.md)");
  for (const [n, s] of Object.entries(STAGES)) {
    const present = existsSync(join(HERE, s.script));
    console.log("  " + n + "  " + s.name.padEnd(24) + s.script.padEnd(34) +
      "writes: " + s.writes + (present ? "" : "   [SCRIPT MISSING]"));
  }
  process.exit(0);
}
if (!CERT || !Number.isFinite(STAGE)) {
  console.error("--cert <CODE> and --stage <n> are both required. --list shows the stages.");
  process.exit(2);
}
const stage = STAGES[STAGE];
if (!stage) { console.error("No stage " + STAGE + ". Stages are 1-8; --list shows them."); process.exit(2); }
const scriptPath = join(HERE, stage.script);
if (!existsSync(scriptPath)) {
  console.error("Stage " + STAGE + " (" + stage.name + ") maps to " + stage.script + ", which does not exist.");
  console.error("Named rather than silently skipped: a stage with no script is not a stage that passed.");
  process.exit(2);
}

/* record the send-back count without running anything -- it is the director's number, not a measurement */
if (SENTBACK !== null) {
  const doc = existsSync(METRICS) ? JSON.parse(readFileSync(METRICS, "utf8")) : { _what: "cost, session time and director send-backs per pipeline stage. Ruled PROMPT-109 s7.", runs: [] };
  doc.runs.push({ cert: CERT, stage: STAGE, stage_name: stage.name, sent_back: SENTBACK,
    note: NOTE || null, recorded_at: new Date().toISOString() });
  writeFileSync(METRICS, JSON.stringify(doc, null, 2) + "\n");
  console.log("recorded: " + CERT + " stage " + STAGE + " sent_back=" + SENTBACK);
  process.exit(0);
}

const args = [...stage.args(CERT), ...(APPLY ? ["--apply"] : [])];
console.log("STAGE " + STAGE + "  " + stage.name + "   cert " + CERT +
  (APPLY ? "   --apply" : "   dry (default)"));
console.log("  " + stage.script + " " + args.join(" "));
console.log("  writes: " + (APPLY ? stage.writes : "nothing (dry)"));
console.log("");

const started = Date.now();
const r = spawnSync(process.execPath, ["--dns-result-order=ipv4first", scriptPath, ...args],
  { stdio: "inherit", cwd: ROOT });
const seconds = Math.round((Date.now() - started) / 1000);

console.log("");
console.log("STAGE " + STAGE + " exit " + (r.status === null ? "signal " + r.signal : r.status) +
  "   " + seconds + "s");

/* session time per stage, appended. Cost is recorded by the stage scripts that spend money. */
{
  const doc = existsSync(METRICS) ? JSON.parse(readFileSync(METRICS, "utf8")) : { _what: "cost, session time and director send-backs per pipeline stage. Ruled PROMPT-109 s7.", runs: [] };
  doc.runs.push({ cert: CERT, stage: STAGE, stage_name: stage.name, applied: APPLY,
    exit: r.status, seconds, note: NOTE || null, recorded_at: new Date().toISOString() });
  writeFileSync(METRICS, JSON.stringify(doc, null, 2) + "\n");
}
process.exitCode = r.status === 0 ? 0 : (r.status ?? 2);
