#!/usr/bin/env node
/**
 * PROMPT-102 s2 acceptance test: the re-key is a NO-OP over the existing corpus.
 * READ-ONLY. `--cert <CODE> --out <file>` emits one verdict per bank row; `--compare a b` diffs two runs.
 * Run it at HEAD and in the working tree, then compare: one thing changed, so every difference is the re-key.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let CERT = "AIMS-F", OUT = null, CMP = null;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--cert") { CERT = argv[++i]; continue; }
  if (argv[i] === "--out") { OUT = argv[++i]; continue; }
  if (argv[i] === "--compare") { CMP = [argv[++i], argv[++i]]; continue; }
  console.error("Unrecognised flag: " + argv[i] + ". Known: --cert <CODE> --out <file> | --compare <a> <b>.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));

if (CMP) {
  const [a, b] = CMP.map((f) => JSON.parse(readFileSync(f, "utf8")));
  const ids = [...new Set([...Object.keys(a.rows), ...Object.keys(b.rows)])].sort();
  const same = [], moved = [], onlyA = [], onlyB = [];
  for (const id of ids) {
    const x = a.rows[id], y = b.rows[id];
    if (!x) { onlyB.push(id); continue; }
    if (!y) { onlyA.push(id); continue; }
    /* UNASSERTED before = UNASSERTED after counts as IDENTICAL -- the director's ruling for
     * anchor-assignment on pre-PROMPT-96 rows. So compare passed + the FAILED set, and the
     * unasserted SET too, but a gate unasserted in both is not a movement. */
    const f1 = (x.failed || []).slice().sort().join(","), f2 = (y.failed || []).slice().sort().join(",");
    const u1 = (x.unasserted || []).slice().sort().join(","), u2 = (y.unasserted || []).slice().sort().join(",");
    if (x.passed === y.passed && f1 === f2 && u1 === u2) same.push(id);
    else moved.push({ id, before: { passed: x.passed, failed: f1, unasserted: u1 },
      after: { passed: y.passed, failed: f2, unasserted: u2 } });
  }
  console.log("IDENTICAL-VERDICT PROOF");
  console.log("  before            " + Object.keys(a.rows).length + " row(s)   (" + a.label + ")");
  console.log("  after             " + Object.keys(b.rows).length + " row(s)   (" + b.label + ")");
  console.log("  IDENTICAL         " + same.length);
  console.log("  MOVED             " + moved.length);
  console.log("  only in before    " + onlyA.length + (onlyA.length ? "  " + onlyA.join(",") : ""));
  console.log("  only in after     " + onlyB.length + (onlyB.length ? "  " + onlyB.join(",") : ""));
  for (const m of moved) {
    console.log("    " + m.id);
    console.log("      before passed=" + m.before.passed + " failed[" + m.before.failed + "] unasserted[" + m.before.unasserted + "]");
    console.log("      after  passed=" + m.after.passed + " failed[" + m.after.failed + "] unasserted[" + m.after.unasserted + "]");
  }
  /* A PROOF OVER NOTHING IS NOT A PROOF. */
  if (!same.length && !moved.length) { console.error("VACUOUS: no rows compared."); process.exit(2); }
  if (onlyA.length || onlyB.length) { console.error("REFUSING: the two runs cover different row sets."); process.exit(2); }
  console.log(moved.length ? "\nNOT A NO-OP: " + moved.length + " row(s) moved. Each must be explained."
    : "\nNO-OP CONFIRMED over " + same.length + " row(s).");
  process.exitCode = moved.length ? 1 : 0;
} else {
  if (!OUT) { console.error("--out <file> is required (or --compare a b)."); process.exit(2); }
  const { requireKey } = await import("./_pg.mjs");
  const { buildGateContext } = await import("./lib/gate-context.mjs");
  const { id8 } = await import("./lib/stored-item.mjs");
  const KEY = requireKey(HERE);
  const ctx = await buildGateContext(KEY, CERT);
  const grounded = ctx.rows.filter((r) => ctx.grounding.has(r.id));
  if (!grounded.length) { console.error("EXTRACTION EMPTY: no grounded rows. Not a pass."); process.exit(2); }
  const rows = {};
  let threw = 0;
  for (const r of grounded) {
    try {
      const v = ctx.gateRow(r);
      rows[id8(r)] = { passed: v.passed, failed: v.failed, unasserted: v.unasserted };
    } catch (e) { threw++; rows[id8(r)] = { passed: null, failed: ["THREW"], unasserted: [], error: String(e.message).slice(0, 160) }; }
  }
  const label = process.env.PROOF_LABEL || "unlabelled";
  writeFileSync(OUT, JSON.stringify({ label, cert: CERT, standard: ctx.standard, edition: ctx.edition,
    count: grounded.length, threw, rows }, null, 1), "utf8");
  console.log("wrote " + OUT + "   " + grounded.length + " row(s), " + threw + " threw   [" + label + "]");
  const pass = Object.values(rows).filter((x) => x.passed === true).length;
  console.log("  passed " + pass + " / " + grounded.length);
}
