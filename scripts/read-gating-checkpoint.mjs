#!/usr/bin/env node
/**
 * read-gating-checkpoint.mjs -- what a run has decided and spent SO FAR.
 *
 * READ-ONLY, no flags but the file. The point of a checkpoint that carries spend is that the ceiling can be
 * watched DURING a run rather than discovered at the end of it, and that needs something to read it with.
 *
 *   node scripts/read-gating-checkpoint.mjs AIMSF-ROLLOUT-B2.partial.jsonl
 *
 * A truncated last line is the normal shape of a kill, so it is COUNTED AND NAMED rather than silently
 * dropped: a reader that discards it would report one fewer item than was gated and nothing would say so.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
if (args.length !== 1 || args[0].startsWith("--")) {
  console.error("usage: node scripts/read-gating-checkpoint.mjs <file.partial.jsonl>");
  process.exit(2);
}
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = existsSync(args[0]) ? args[0] : join(ROOT, args[0]);
if (!existsSync(p)) { console.error("no such checkpoint: " + args[0]); process.exit(2); }

const PRICE = { input: 15.0, output: 75.0 };
const usd = (r) => (r.input / 1e6) * PRICE.input + (r.output / 1e6) * PRICE.output;
const recs = [];
let truncated = 0;
for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
  if (!line.trim()) continue;
  try { recs.push(JSON.parse(line)); } catch { truncated++; }
}
const total = { calls: 0, input: 0, output: 0 };
const byRole = {}, byVerdict = {}, byTask = new Map();
for (const r of recs) {
  const d = r.spend_delta || {};
  total.calls += d.calls || 0; total.input += d.input || 0; total.output += d.output || 0;
  for (const [role, x] of Object.entries(d.by_role || {})) {
    const a = byRole[role] || (byRole[role] = { calls: 0, input: 0, output: 0 });
    a.calls += x.calls; a.input += x.input; a.output += x.output;
  }
  byVerdict[r.verdict || "(none)"] = (byVerdict[r.verdict || "(none)"] || 0) + 1;
  const t = byTask.get(r.task_code) || { n: 0, surv: 0 };
  t.n++; if (r.verdict === "survivor") t.surv++;
  byTask.set(r.task_code, t);
}
console.log(p.split(/[\\/]/).pop());
console.log("  items gated so far      " + recs.length +
  (truncated ? "   (+" + truncated + " truncated line(s) -- those items will be gated again on resume)" : ""));
console.log("  spend so far            " + total.calls + " call(s), " + total.input + " in / " +
  total.output + " out, $" + usd(total).toFixed(2));
console.log("  per item                $" + (recs.length ? (usd(total) / recs.length).toFixed(3) : "n/a"));
console.log("");
console.log("  verdicts");
for (const [v, n] of Object.entries(byVerdict).sort((a, b) => b[1] - a[1])) {
  console.log("    " + String(n).padStart(4) + "  " + v);
}
console.log("");
console.log("  by role");
for (const [role, r] of Object.entries(byRole).sort((a, b) => usd(b[1]) - usd(a[1]))) {
  console.log("    " + role.padEnd(15) + String(r.calls).padStart(4) + " call(s)  $" + usd(r).toFixed(2));
}
console.log("");
console.log("  by task");
const codes = [...byTask.keys()].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
console.log("    " + codes.map((c) => c + " " + byTask.get(c).surv + "/" + byTask.get(c).n).join("   "));
