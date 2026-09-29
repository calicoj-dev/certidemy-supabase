#!/usr/bin/env node
/**
 * show-pilot-1-3-r2.mjs -- print the task 1.3 REGENERATED survivors in full for the director's read, and name the
 * one thing the run's own summary cannot see.
 *
 * READ-ONLY, no flags, no writes, no model calls.
 *
 * ============ ALL FOUR SURVIVORS ANCHOR IN ONE CLAUSE, AND NOTHING FLAGGED IT ============
 *
 * The generator's ANCHOR CLUSTERS check is scoped to "same clause, DIFFERENT tasks -- these cross-cue on
 * one form", so four items of ONE task resting on ONE clause is invisible to it by construction. That is
 * the shape worth reporting: a form carrying four items written from the same sentence teaches a candidate
 * the sentence, and a candidate who does not know it loses four marks to one gap.
 *
 * It is a consequence of the map, not of the writer. Task 1.3 has 6 primary rows of which TWO are
 * containers, so the anchorable primary set is four, and only one of those four carries the life-cycle
 * substance the task examines -- which is why the writer went to it every time.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const F = join(ROOT, "PILOT-AIMSF-TASK-1-3-R2.json");
if (!existsSync(F)) { console.error("missing " + F); process.exit(2); }
const art = JSON.parse(readFileSync(F, "utf8"));
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));

const items = art.items || [];
const survivors = items.filter((it) => it.verdict === "survivor");
console.log("attempted " + art.attempted + "   generated " + art.generated +
  "   survivors (artifact) " + art.survivors + "   survivors (recomputed) " + survivors.length);

/* the monoculture, measured */
const byClause = {};
for (const it of survivors) {
  const c = it.grounding_family || (it.item || {}).key_support_clause || "?";
  byClause[c] = (byClause[c] || 0) + 1;
}
console.log("\nsurvivor anchors by clause:");
for (const [c, n] of Object.entries(byClause).sort((a, b) => b[1] - a[1])) {
  console.log("  " + String(n).padStart(2) + "  " + c + (n > 1 ? "   <- several items on ONE clause" : ""));
}
const worst = Object.entries(byClause).sort((a, b) => b[1] - a[1])[0];
if (worst && worst[1] > 1) {
  console.log("\nThe generator's ANCHOR CLUSTERS check is scoped to the same clause across DIFFERENT tasks,");
  console.log("so " + worst[1] + " items of ONE task on ONE clause is invisible to it. Reported here instead.");
  const p = lib.passages.find((x) => x.clause === worst[0] && /42001/.test(x.source_id));
  if (p) {
    console.log("\n" + worst[0] + "  [" + p.normative + "]  " + (p.title || ""));
    console.log("  " + String(p.text).replace(/\s+/g, " ").slice(0, 400));
  }
}

const show = (it, n) => {
  console.log("\n================================================================ survivor " + n);
  console.log("anchor      : " + ((it.item || {}).key_support_clause || it.grounding_family));
  console.log("key_support : " + String((it.item || {}).key_support || "").replace(/\s+/g, " "));
  console.log("");
  console.log("STEM: " + String((it.item || {}).question_text || "").replace(/\s+/g, " "));
  const opts = (it.item || {}).options || [];
  for (const [i, o] of opts.entries()) {
    const mark = o.is_correct ? " *KEY* " : "       ";
    console.log(mark + String.fromCharCode(65 + i) + ") " + String(o.text || "").replace(/\s+/g, " "));
  }
  if ((it.item || {}).distractor_support) {
    console.log("\ndistractor support:");
    const ds = it.item.distractor_support;
    if (Array.isArray(ds)) for (const [i, d] of ds.entries()) {
      console.log("  " + (i + 1) + ") " + String(typeof d === "string" ? d : JSON.stringify(d))
        .replace(/\s+/g, " ").slice(0, 260));
    } else console.log("  " + JSON.stringify(ds).slice(0, 400));
  }
  console.log("\nexplanation: " + String((it.item || {}).explanation || "").replace(/\s+/g, " "));
  if (it.solver) {
    console.log("\nsolver: " + it.solver.state +
      (it.solver.reason ? " -- " + String(it.solver.reason).replace(/\s+/g, " ").slice(0, 200) : ""));
  }
  const flags = (it.options_probe && it.options_probe.state === "flag") ? [it.options_probe.reason || it.options_probe.cue] : [];
  if (flags.length) {
    console.log("FLAGGED (never rejected): " +
      flags.map((f) => typeof f === "string" ? f : JSON.stringify(f)).join(" | ").slice(0, 300));
  }
};
survivors.forEach((it, i) => show(it, i + 1));

/* and the rejections, because the director should see what the gates refused, not only what passed */
const rejected = items.filter((it) => it.verdict !== "survivor");
console.log("\n\n================================================================");
console.log("REJECTED: " + rejected.length + "   (shown so the refusals can be checked too -- an");
console.log("over-refusing gate produces findings that look like rigour and nobody investigates them)");
for (const it of rejected) {
  const failed = (it.gates || []).filter((g) => g.pass === false);
  console.log("\n  anchor " + ((it.item || {}).key_support_clause || it.grounding_family));
  console.log("  STEM: " + String((it.item || {}).question_text || "").replace(/s+/g, " ").slice(0, 200));
  for (const g of failed) {
    console.log("  GATE " + g.id + ": " + String(g.reason).replace(/\s+/g, " ").slice(0, 240));
  }
  if (it.solver && it.solver.state === "rejected") {
    console.log("  SOLVER: " + String(it.solver.reason || "").replace(/\s+/g, " ").slice(0, 240));
  }
}
