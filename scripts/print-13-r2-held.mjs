#!/usr/bin/env node
/**
 * print-13-r2-held.mjs -- the task 1.3 R2 items NOT inserted, in full, for the director's read.
 *
 * READ-ONLY, no flags, no writes, no model calls. Ruled PROMPT-87 s3 / PROMPT-90 s3.
 *
 * THREE items, and the third is not one the ruling expected to hold back:
 *
 *   #2  A.6.2.2  options-probe flag (shared-phrase)  AND fails quote-noise
 *   #3  A.6.2.5  options-probe flag (grammar)        AND fails quote-noise
 *   #4  B.6.2.1  ruled for insertion, and REFUSED ON RE-GATE by the blind solver
 *
 * #4 is the one to look at hardest. It survived generation and was refused when the same gates ran again,
 * because the solver named a second defensible option the second time. Same item, same passages, two
 * solver runs, two verdicts -- so "the rows inserted are the rows measured" holds for the code gates and
 * does NOT hold for the solver.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gateQuoteNoise } from "./lib/quote-noise.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const art = JSON.parse(readFileSync(join(ROOT, "PILOT-AIMSF-TASK-1-3-R2.json"), "utf8"));
const itemId = (it) => createHash("sha256")
  .update(String((it && it.question_text) || "").replace(/\s+/g, " ").trim()).digest("hex").slice(0, 8);

const HELD = {
  "A.6.2.2": "options-probe flag (shared-phrase), and fails quote-noise",
  "A.6.2.5": "options-probe flag (grammar), and fails quote-noise",
  "B.6.2.1": "RULED FOR INSERTION, then refused on re-gate by the blind solver",
};
const rows = art.items.filter((r) => r.verdict === "survivor" && HELD[r.item.key_support_clause]);

const md = [];
const p = (s = "") => md.push(s);
p("# AIMS-F task 1.3 -- the three R2 items not inserted");
p("");
p("**Read-only.** Nothing here is written to the bank.");
p("");
p("`B.6.2.1` is the one to read hardest: it was ruled for insertion, survived generation, and was refused");
p("when the same gates ran again because the blind solver named a second defensible option the second");
p("time. Same item, same passages, two runs, two verdicts. \"The rows inserted are the rows measured\"");
p("holds for the code gates and does not hold for the solver.");
p("");
for (const r of rows) {
  const it = r.item;
  const qn = gateQuoteNoise(it);
  p("---");
  p("");
  p("## `" + itemId(it) + "`   anchor `" + it.key_support_clause + "`");
  p("");
  p("**Why held:** " + HELD[it.key_support_clause]);
  p("");
  p("**key_support**");
  p("");
  p("> " + String(it.key_support || "").replace(/\s+/g, " "));
  p("");
  p("**Q** " + String(it.question_text).replace(/\s+/g, " "));
  p("");
  for (const [i, o] of (it.options || []).entries()) {
    p("- " + (o.is_correct ? "**" : "") + String.fromCharCode(65 + i) + ") " +
      String(o.text || "").replace(/\s+/g, " ") + (o.is_correct ? "  ← key**" : ""));
  }
  p("");
  p("**distractor support**");
  p("");
  for (const d of (it.distractor_support || [])) {
    p("- `" + (d.clause || "?") + "` — " + String(d.support || "").replace(/\s+/g, " "));
    p("  - *why wrong:* " + String(d.why_wrong || "").replace(/\s+/g, " "));
  }
  p("");
  p("**explanation:** " + String(it.explanation || "").replace(/\s+/g, " "));
  p("");
  p("**quote-noise:** " + (qn.pass === false ? "**FAILS** — " + qn.reason : "passes"));
  p("");
  p("**options-only probe:** " + ((r.options_probe || {}).state || "?") + " — " +
    String((r.options_probe || {}).reason || "").replace(/\s+/g, " "));
  p("");
  p("**solver (generation run):** " + ((r.solver || {}).state || "?") + " — " +
    String((r.solver || {}).reason || "").replace(/\s+/g, " "));
  p("");
}
writeFileSync(join(ROOT, "TASK-13-R2-HELD.md"), md.join("\n") + "\n", "utf8");
console.log("held items: " + rows.length);
for (const r of rows) {
  console.log("  " + itemId(r.item) + "  " + r.item.key_support_clause.padEnd(9) +
    ((r.options_probe || {}).state || "?").padEnd(7) +
    "quote-noise=" + gateQuoteNoise(r.item).pass);
}
console.log("wrote TASK-13-R2-HELD.md");
