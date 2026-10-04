#!/usr/bin/env node
/**
 * READ-ONLY. Does a held passage's text run on into the NEXT clause?
 *
 * Found PROMPT-115 s2: ISO/IEC 27000 3.77 (`vulnerability`, a 15-word definition) is 282 words,
 * because it swallowed "4 Information security management systems 4.1 General Organizations of all
 * types and sizes: ...". An R2 item then cited 3.77 for a sentence about information as an asset --
 * the sentence really is in 3.77's passage, and it does not belong to it.
 *
 * THE DETECTOR IS A HEADING INSIDE THE BODY, not a word count. A definition may legitimately carry
 * long notes, so length alone flags 27002 3.1 (a real term list) as loudly as a real run-on. What
 * cannot be legitimate is the text of a LATER top-level clause appearing inside an earlier passage.
 *
 * It reports, it does not fix: the library is generated, so a fix belongs in the extractor or in a
 * recorded repair. No --apply exists.
 */
import { readFileSync } from "node:fs";
import { runOnIn, runOnControls } from "./lib/passage-runon.mjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let ONLY_SRC = null;
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--source=(.+)$/);
  if (m) { ONLY_SRC = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --source=<id>. READ-ONLY."); process.exit(2);
}
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));

const ctl = runOnControls();
console.log("run-on controls: " + ctl.examined + " case(s), " +
  (ctl.fails.length ? ctl.fails.length + " FAIL" : "all pass"));
for (const f of ctl.fails) console.log("  FAIL " + f);
if (ctl.fails.length) process.exit(2);

const hits = [];
for (const p of lib.passages) {
  if (ONLY_SRC && p.source_id !== ONLY_SRC) continue;
  const r = runOnIn(p);
  if (r) hits.push({ p, r });
}
console.log("");
console.log("PASSAGE RUN-ON   " + lib.passages.length + " passage(s) examined" +
  (ONLY_SRC ? " (source " + ONLY_SRC + ")" : "") + "   " + hits.length + " flagged");
const bySrc = {};
for (const h of hits) {
  const k = h.p.source_id + " " + h.p.edition;
  (bySrc[k] = bySrc[k] || []).push(h);
}
for (const k of Object.keys(bySrc).sort()) {
  console.log("");
  console.log("  " + k + "   " + bySrc[k].length + " passage(s)");
  for (const h of bySrc[k].slice(0, 12)) {
    const words = String(h.p.text || "").split(/\s+/).length;
    console.log("    " + String(h.p.clause).padEnd(12) + String(words).padStart(5) + "w   runs on at char " +
      String(h.r.at).padStart(5) + "  -> " + JSON.stringify(h.r.matched));
  }
  if (bySrc[k].length > 12) console.log("    ... and " + (bySrc[k].length - 12) + " more");
}
console.log("");
console.log("A FLAG IS NOT A VERDICT: a passage may quote a heading legitimately. Each one needs a read");
console.log("against the PDF before the extractor is changed.");
