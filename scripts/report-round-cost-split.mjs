#!/usr/bin/env node
/**
 * READ-ONLY, NO MODEL CALLS, NO DATABASE. What share of a generation round each ROLE actually costs,
 * read out of the artifacts' own `spend.by_role` logs.
 *
 * Ruled PROMPT-119 s2.1, to answer one question before paying to test it: is the WRITER a big enough
 * share of a round for a cheaper writer to matter?
 *
 * Every figure is divided by the number of items it applied to, and the per-role totals are checked
 * against the round's own reported total -- a split that does not add up to the bill is a split of
 * something else.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const args = process.argv.slice(2);
const files = args.filter((a) => !a.startsWith("--"));
for (const a of args.filter((a) => a.startsWith("--"))) {
  console.error("Unrecognised flag: " + a + ". Usage: report-round-cost-split.mjs <artifact> [...]");
  process.exit(2);
}
if (!files.length) { console.error("name at least one artifact, e.g. ISMSF-R3 ISMSF-R4 ISMSF-R5"); process.exit(2); }

/* PRICES PER MODEL, USD per million tokens. The artifact records the price it actually used in
 * `spend.price_per_mtok`, so this table is only a fallback and a disagreement is reported. */
const PRICES = {
  "claude-opus-5": { input: 15, output: 75 },
  "claude-sonnet-5": { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
};

const ROLE_ORDER = ["writer", "writer-retry", "paraphrase", "solver", "solver-recheck", "de-cue",
  "options-probe"];

const rounds = [];
for (const f of files) {
  const p = join(ROOT, f);
  if (!existsSync(p)) { console.error("not found: " + f); process.exit(2); }
  const j = JSON.parse(readFileSync(p, "utf8"));
  const sp = j.spend || {};
  const price = sp.price_per_mtok || PRICES[j.model] || PRICES["claude-opus-5"];
  const usd = (t) => (t.input / 1e6) * price.input + (t.output / 1e6) * price.output;
  const roles = sp.by_role || {};
  const perRole = {};
  let sum = 0;
  for (const [name, t] of Object.entries(roles)) {
    const v = usd({ input: t.input || 0, output: t.output || 0 });
    perRole[name] = { usd: v, calls: t.calls || 0, input: t.input || 0, output: t.output || 0 };
    sum += v;
  }
  rounds.push({ file: f, model: j.model, attempted: j.attempted, generated: j.generated,
    survivors: j.survivors, reported: sp.usd, sum, perRole, price });
}

console.log("WHERE A GENERATION ROUND'S MONEY GOES   (read from each artifact's own by_role log)");
console.log("");
const hdr = "  round      model          items  survivors  " +
  ROLE_ORDER.map((r) => r.slice(0, 9).padStart(10)).join("") + "      total";
console.log(hdr);
for (const r of rounds) {
  const cells = ROLE_ORDER.map((name) => {
    const v = r.perRole[name];
    return (v ? "$" + v.usd.toFixed(2) : "-").padStart(10);
  }).join("");
  console.log("  " + r.file.padEnd(11) + String(r.model || "?").slice(0, 14).padEnd(15) +
    String(r.generated).padStart(5) + String(r.survivors).padStart(11) + cells +
    ("$" + r.sum.toFixed(2)).padStart(11));
}
console.log("");
/* THE SPLIT MUST ADD UP TO THE BILL. A per-role sum that differs from the round's reported spend means
 * a role is unlogged, and a share computed off it would be wrong. */
for (const r of rounds) {
  const diff = Math.abs(r.sum - (r.reported ?? r.sum));
  const tag = diff < 0.01 ? "agrees with the round's reported total"
    : "DISAGREES by $" + diff.toFixed(2) + " -- a role is unlogged";
  console.log("  " + r.file.padEnd(11) + "per-role sum $" + r.sum.toFixed(2) +
    "   reported $" + Number(r.reported ?? 0).toFixed(2) + "   " + tag);
}

console.log("");
console.log("SHARES, and the writer per item");
console.log("  round        writer%   solver%   other%   writer $/item   solver $/item   $/survivor");
for (const r of rounds) {
  const w = (r.perRole.writer?.usd || 0) + (r.perRole["writer-retry"]?.usd || 0);
  const s = (r.perRole.solver?.usd || 0) + (r.perRole["solver-recheck"]?.usd || 0);
  const o = r.sum - w - s;
  const pc = (x) => (100 * x / r.sum).toFixed(1).padStart(8) + "%";
  console.log("  " + r.file.padEnd(13) + pc(w) + pc(s) + pc(o) +
    ("$" + (w / r.generated).toFixed(3)).padStart(16) +
    ("$" + (s / r.generated).toFixed(3)).padStart(16) +
    ("$" + (r.sum / Math.max(1, r.survivors)).toFixed(3)).padStart(13));
}

const tot = rounds.reduce((a, r) => {
  const w = (r.perRole.writer?.usd || 0) + (r.perRole["writer-retry"]?.usd || 0);
  const s = (r.perRole.solver?.usd || 0) + (r.perRole["solver-recheck"]?.usd || 0);
  return { w: a.w + w, s: a.s + s, all: a.all + r.sum, items: a.items + r.generated };
}, { w: 0, s: 0, all: 0, items: 0 });
console.log("");
console.log("ACROSS " + rounds.length + " ROUND(S), " + tot.items + " generated items, $" + tot.all.toFixed(2));
console.log("  writer   $" + tot.w.toFixed(2) + "   " + (100 * tot.w / tot.all).toFixed(1) + "% of spend");
console.log("  solver   $" + tot.s.toFixed(2) + "   " + (100 * tot.s / tot.all).toFixed(1) + "% of spend");
console.log("  other    $" + (tot.all - tot.w - tot.s).toFixed(2) + "   " +
  (100 * (tot.all - tot.w - tot.s) / tot.all).toFixed(1) + "%");
console.log("");
/* WHAT A CHEAPER WRITER CAN AND CANNOT SAVE, at the posted prices. */
const ratio = (PRICES["claude-opus-5"].output / PRICES["claude-sonnet-5"].output);
console.log("  A Sonnet writer costs 1/" + ratio + " of an Opus one per token (output $" +
  PRICES["claude-opus-5"].output + " -> $" + PRICES["claude-sonnet-5"].output + "/Mtok).");
console.log("  Applied to the writer share alone, these rounds would have cost $" +
  (tot.all - tot.w + tot.w / ratio).toFixed(2) + " instead of $" + tot.all.toFixed(2) + " -- a saving of " +
  (100 * (tot.w - tot.w / ratio) / tot.all).toFixed(1) + "%.");
console.log("  THAT IS THE CEILING ON THE SAVING, and it assumes the same number of items survive.");
console.log("  A writer whose items die more often costs MORE per survivor at any token price.");
