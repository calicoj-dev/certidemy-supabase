#!/usr/bin/env node
/**
 * check-anchor-verbatim.mjs -- every stored anchor on every grounded item is still verbatim in its passage.
 *
 * READ-ONLY. No writes, no network, no credential, no model calls. Unknown flags exit 2.
 *
 * Written PROMPT-95 follow-up 2, after `requote-noisy-anchors.mjs` re-cut twelve spans across three artifacts.
 * `quote-noise` going from 9 fires to 0 says the spans are CLEAN. It says nothing about whether they are still
 * QUOTATIONS -- and a re-cut that drifted by one character would leave an anchor that quotes nothing, which is
 * the one failure mode a re-quoting script can introduce.
 *
 * THIS IS THE SAME PROPERTY `gateVerbatim` ASSERTS, AND IT CALLS THAT FUNCTION RATHER THAN RE-IMPLEMENTING IT.
 * A second hand-written copy of one idea diverges, and the divergence would surface as an anchor rejected for
 * an arithmetic difference rather than for an edit -- the rule this repository already records for
 * `translation_hash`. So the gate is imported; what is new here is the POPULATION it is run over.
 *
 * AND A ZERO FROM THIS SCRIPT IS ONLY WORTH SOMETHING IF IT COULD HAVE BEEN NON-ZERO. The gate's own control
 * set proves it fires; this script additionally asserts, on a synthetic item built from a real passage, that a
 * one-word edit to an anchor IS caught. A pass with no such proof is the structural zero this whole follow-up
 * exists to have found once.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gateVerbatim } from "./lib/grounded-gates.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". This script is READ-ONLY and takes none.");
  process.exit(2);
}
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));

/* `gateVerbatim` takes a map keyed the way the generator keys it: by clause, for the run's own source. AIMS-F
 * is grounded in ISO/IEC 42001; any other source has to be named, because a clause address is not a key. */
const SOURCE = "ISO/IEC 42001";
const passagesByKey = new Map();
for (const p of lib.passages) {
  if (p.source_id !== SOURCE) continue;
  passagesByKey.set(String(p.clause), p);
}

const FILES = ["AIMSF-ROLLOUT-B1.json", "AIMSF-ROLLOUT-B2.json", "AIMSF-R2-PROBE.json",
  "AIMSF-R2-REST.json", "AIMSF-R3-PROBE.json", "AIMSF-R3-REST.json"];

/* ---- the control, first, because a clean sweep afterwards means nothing without it ---- */
{
  const p = passagesByKey.get("A.10.2");
  if (!p) {
    console.error("CANNOT RUN: the library does not hold " + SOURCE + " A.10.2, which the control is built on.");
    process.exit(2);
  }
  const clean = { key_support_clause: "A.10.2", key_support: String(p.text).slice(0, 90), distractor_support: [] };
  const edited = { ...clean, key_support: String(p.text).slice(0, 90).replace(/\bshall\b/, "should") };
  const a = gateVerbatim(clean, passagesByKey), b = gateVerbatim(edited, passagesByKey);
  if (a.pass !== true || b.pass !== false) {
    console.error("THE CONTROL FAILED, so no verdict below would mean anything:");
    console.error("  a verbatim anchor passes: " + a.pass + " (expected true)");
    console.error("  a one-word edit is caught: " + (b.pass === false) + " (expected true)");
    process.exit(2);
  }
  console.log("CONTROL  a verbatim anchor of A.10.2 passes; the same anchor with `shall` changed to `should`");
  console.log("         is caught. The gate can fire, so a zero below is earned rather than structural.");
  console.log("");
}

let examined = 0, items = 0, bad = 0, unheld = 0;
const fails = [];
for (const f of FILES) {
  const p = join(ROOT, f);
  if (!existsSync(p)) continue;
  for (const r of JSON.parse(readFileSync(p, "utf8")).items || []) {
    if (r.verdict !== "survivor") continue;
    items++;
    const v = gateVerbatim(r.item, passagesByKey);
    /* THREE STATES. An anchor whose clause the library does not hold cannot be checked, and folding that into
     * either a pass or a failure is the collapse this repository records five times over. */
    if (v.pass === null) { unheld++; continue; }
    examined += v.examined || 0;
    if (v.pass) continue;
    bad++;
    fails.push({ file: f, id: String(r.item_id || "").slice(0, 8), task: r.task_code, reason: v.reason });
  }
}

console.log("ANCHOR VERBATIM over every grounded survivor");
console.log("  items                 " + items);
console.log("  anchors examined      " + examined);
console.log("  COULD NOT BE CHECKED  " + unheld + "   (the library holds no passage at the cited clause)");
console.log("  FAILING               " + bad);
console.log("");
for (const x of fails) {
  console.log("  " + x.id + "  task " + String(x.task).padEnd(5) + x.file);
  console.log("      " + x.reason);
}
if (!fails.length) console.log("  none. Every stored anchor is still a contiguous substring of its own passage.");
if (bad) process.exitCode = 1;
