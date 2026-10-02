#!/usr/bin/env node
/* Merge R7 and its two top-ups into one artifact for the director's report. Spend is SUMMED, not
 * taken from one run, and the item count is asserted against the inputs. `--apply` writes. */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const IN = ["AIMSF-R7.json", "AIMSF-R7-TOPUP.json", "AIMSF-R7-TOPUP2.json"];
const OUT = "AIMSF-R7-ALL.json";
let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply (dry by default)."); process.exit(2);
}
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const parts = IN.map((f) => ({ f, j: JSON.parse(readFileSync(join(ROOT, f), "utf8")) }));
const items = parts.flatMap((p) => p.j.items || []);
const expected = parts.reduce((s, p) => s + (p.j.items || []).length, 0);
if (items.length !== expected) { console.error("REFUSING: item count " + items.length + " != " + expected); process.exit(2); }
const usd = parts.reduce((s, p) => s + Number(p.j.spend?.usd || 0), 0);
const out = { ...parts[0].j, items, generated: items.length,
  spend: { ...(parts[0].j.spend || {}), usd: Number(usd.toFixed(4)), merged_from: IN },
  emitted_by: "merge-r7-artifacts.mjs (PROMPT-103)" };
const surv = items.filter((r) => r.verdict === "survivor").length;
console.log("merged " + parts.map((p) => p.f + " (" + (p.j.items || []).length + ")").join(" + "));
console.log("  items " + items.length + "   survivors " + surv + "   spend $" + usd.toFixed(4));
if (!APPLY) { console.log("DRY RUN. Re-run with --apply."); process.exitCode = 0; }
else {
  writeFileSync(join(ROOT, OUT), JSON.stringify(out, null, 1), "utf8");
  const back = JSON.parse(readFileSync(join(ROOT, OUT), "utf8"));
  console.log("wrote " + OUT + "   read back " + back.items.length + " item(s), " +
    back.items.filter((r) => r.verdict === "survivor").length + " survivor(s)");
  if (back.items.length !== items.length) { console.error("READ-BACK FAILED"); process.exitCode = 2; }
}
