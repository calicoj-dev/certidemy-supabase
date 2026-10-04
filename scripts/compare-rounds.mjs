#!/usr/bin/env node
/**
 * READ-ONLY, NO MODEL CALLS, NO DATABASE. Put generation rounds side by side on the figures the writer
 * decision turns on. Every number is derived from the artifacts; none is retyped.
 *
 * Ruled PROMPT-119 s2.4. The decision rule is: if the cheaper writer's SURVIVAL is within ~10 points of
 * Opus's and the director's reject rate does not rise, the writer stays on the cheaper model.
 *
 * ============ SURVIVAL HAS TWO DENOMINATORS AND THEY ARE DIFFERENT QUESTIONS ============
 *
 * `survivors / generated` asks how good the items that ARRIVED were.
 * `survivors / attempted` asks what the round actually delivered against what was asked.
 *
 * A writer that returns nothing for half its batches scores well on the first and badly on the second,
 * so both are printed. Reporting only the first would hide a delivery failure behind a quality number.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const files = process.argv.slice(2).filter((a) => !a.startsWith("--"));
for (const a of process.argv.slice(2).filter((a) => a.startsWith("--"))) {
  console.error("Unrecognised flag: " + a + ". Usage: compare-rounds.mjs <artifact> [...]");
  process.exit(2);
}
if (files.length < 2) { console.error("name at least two artifacts"); process.exit(2); }

const PRICES = {
  "claude-opus-5": { input: 15, output: 75 },
  "claude-sonnet-5": { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
};
const WRITER_ROLES = new Set(["writer", "writer-retry", "paraphrase", "de-cue"]);

const rounds = files.map((f) => {
  const p = join(ROOT, f);
  if (!existsSync(p)) { console.error("not found: " + f); process.exit(2); }
  const j = JSON.parse(readFileSync(p, "utf8"));
  const sp = j.spend || {};
  const wm = sp.writer_model || j.model;
  const sm = sp.solver_model || j.model;
  let writerUsd = 0, solverUsd = 0, total = 0;
  for (const [role, t] of Object.entries(sp.by_role || {})) {
    const model = t.model || (WRITER_ROLES.has(role) ? wm : sm);
    const pr = PRICES[model] || PRICES["claude-opus-5"];
    const v = ((t.input || 0) / 1e6) * pr.input + ((t.output || 0) / 1e6) * pr.output;
    total += v;
    if (WRITER_ROLES.has(role)) writerUsd += v; else solverUsd += v;
  }
  /* gate failures, counted from the reject_counts the artifact recorded. A `code UNASSERTED:` entry is
   * an ADVISORY on an item rejected for something else, so it is reported apart and never summed in. */
  const gates = {}, solverRej = {}, writerFail = {}, unasserted = {};
  for (const [k, n] of Object.entries(j.reject_counts || {})) {
    if (/^code UNASSERTED: /.test(k)) unasserted[k.replace("code UNASSERTED: ", "")] = n;
    else if (/^code: /.test(k)) gates[k.replace("code: ", "")] = n;
    else if (/^solver: /.test(k)) solverRej[k.replace("solver: ", "")] = n;
    else if (/^writer /.test(k)) writerFail[k.slice(0, 44)] = n;
  }
  const items = j.items || [];
  const splits = items.filter((x) => x.solver && x.solver.state === "split").length;
  const solved = items.filter((x) => x.solver && x.solver.state).length;
  return { file: f, writerModel: wm, solverModel: sm, attempted: j.attempted, generated: j.generated,
    survivors: j.survivors, usd: total, writerUsd, solverUsd, gates, solverRej, writerFail, unasserted,
    splits, solved, retries: j.writer_retries ?? null, recovered: j.writer_retry_items_saved ?? null };
});

const pad = (x, n) => String(x).padStart(n);
console.log("ROUNDS SIDE BY SIDE   (every figure derived from the artifact)");
console.log("");
console.log("  round     writer         attempted  generated  survivors   surv/gen  surv/attempt");
for (const r of rounds) {
  console.log("  " + r.file.padEnd(10) + String(r.writerModel).replace("claude-", "").padEnd(15) +
    pad(r.attempted, 9) + pad(r.generated, 11) + pad(r.survivors, 11) +
    pad((100 * r.survivors / Math.max(1, r.generated)).toFixed(0) + "%", 11) +
    pad((100 * r.survivors / Math.max(1, r.attempted)).toFixed(0) + "%", 14));
}
console.log("");
console.log("  round       total   writer$  solver$   $/survivor   writer $/generated");
for (const r of rounds) {
  console.log("  " + r.file.padEnd(10) + pad("$" + r.usd.toFixed(2), 9) + pad("$" + r.writerUsd.toFixed(2), 10) +
    pad("$" + r.solverUsd.toFixed(2), 9) +
    pad("$" + (r.usd / Math.max(1, r.survivors)).toFixed(3), 13) +
    pad("$" + (r.writerUsd / Math.max(1, r.generated)).toFixed(3), 21));
}
console.log("");
console.log("  round     writer batches retried   items recovered   solver splits / solved");
for (const r of rounds) {
  console.log("  " + r.file.padEnd(10) + pad(r.retries ?? "-", 17) + pad(r.recovered ?? "-", 18) +
    pad(r.splits + " / " + r.solved, 24));
}

/* gate failures per 100 GENERATED items, so rounds of different sizes compare */
const allGates = [...new Set(rounds.flatMap((r) => Object.keys(r.gates)))].sort();
console.log("");
console.log("CODE-GATE REJECTIONS per 100 generated items");
console.log("  gate                     " + rounds.map((r) => r.file.padStart(10)).join(""));
for (const g of allGates) {
  const cells = rounds.map((r) => {
    const n = r.gates[g] || 0;
    return (n ? (100 * n / Math.max(1, r.generated)).toFixed(1) : "-").padStart(10);
  }).join("");
  console.log("  " + g.padEnd(25) + cells);
}
console.log("  " + "(solver rejections)".padEnd(25) +
  rounds.map((r) => {
    const n = Object.values(r.solverRej).reduce((a, b) => a + b, 0);
    return (n ? (100 * n / Math.max(1, r.generated)).toFixed(1) : "-").padStart(10);
  }).join(""));

const anyUn = rounds.some((r) => Object.keys(r.unasserted).length);
if (anyUn) {
  console.log("");
  console.log("  UNASSERTED advisories (not rejections, reported apart):");
  for (const r of rounds) {
    const e = Object.entries(r.unasserted);
    if (e.length) console.log("    " + r.file + "  " + e.map(([k, n]) => k + " x" + n).join(", "));
  }
}

const anyWf = rounds.some((r) => Object.keys(r.writerFail).length);
if (anyWf) {
  console.log("");
  console.log("  WRITER BATCH FAILURES -- items that never reached a gate:");
  for (const r of rounds) {
    const e = Object.entries(r.writerFail);
    if (!e.length) continue;
    const lost = r.attempted - r.generated;
    console.log("    " + r.file + "  " + lost + " of " + r.attempted + " items lost (" +
      (100 * lost / r.attempted).toFixed(0) + "%)");
    for (const [k, n] of e) console.log("      x" + n + "  " + k);
  }
}
