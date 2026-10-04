#!/usr/bin/env node
/**
 * Truncate a NAMED passage at the point it runs on into a later clause. WRITES with `--apply`;
 * dry by default. Unknown flags exit 2.
 *
 * Ruled PROMPT-115 s2. `SOURCE-PASSAGES.json` is GENERATED, so a repair here is a patch over a
 * generator defect and must be recorded or it vanishes at the next extraction. Every repair is
 * written to `PASSAGE-REPAIRS.json` with the clause, the cut point and the reason, so a re-extraction
 * can be checked against the list and the extractor fixed properly.
 *
 * NAMED, NOT SWEEPING. `check-passage-runon.mjs` flags 49 passages and most are legitimate
 * cross-references to an annex. Only a clause this script is told to repair is touched.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runOnIn } from "./lib/passage-runon.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let APPLY = false, SRC = null, ED = null, CLAUSE = null, WHY = null;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  let m = a.match(/^--source=(.+)$/); if (m) { SRC = m[1]; continue; }
  m = a.match(/^--edition=(.+)$/); if (m) { ED = m[1]; continue; }
  m = a.match(/^--clause=(.+)$/); if (m) { CLAUSE = m[1]; continue; }
  m = a.match(/^--why=(.+)$/); if (m) { WHY = m[1]; continue; }
  console.error("Unrecognised flag: " + a +
    ". Known: --source=, --edition=, --clause=, --why=, --apply (dry by default).");
  process.exit(2);
}
if (!SRC || !ED || !CLAUSE || !WHY) {
  console.error("--source, --edition, --clause and --why are all required.");
  process.exit(2);
}

const libPath = join(ROOT, "SOURCE-PASSAGES.json");
const lib = JSON.parse(readFileSync(libPath, "utf8"));
const idx = lib.passages.findIndex((p) => p.source_id === SRC && String(p.edition) === ED &&
  String(p.clause) === CLAUSE);
if (idx < 0) { console.error("no held passage " + SRC + " " + ED + " " + CLAUSE); process.exit(2); }
const p = lib.passages[idx];
const r = runOnIn(p);
if (!r) {
  console.error("that passage shows no run-on. Refusing: a truncation with nothing to cut at would");
  console.error("remove real text. Re-run check-passage-runon.mjs to see what is flagged.");
  process.exit(2);
}
const before = String(p.text || "");
const cut = before.slice(0, r.at).replace(/\s+$/, "");
const removed = before.slice(r.at);
console.log("REPAIR RUN-ON   " + SRC + " " + ED + " clause " + CLAUSE + (APPLY ? "   --apply" : "   dry run"));
console.log("  detected: " + r.kind + " at char " + r.at + " -> " + JSON.stringify(r.matched));
console.log("  words " + before.split(/\s+/).length + " -> " + cut.split(/\s+/).length +
  "   (removing " + removed.split(/\s+/).length + ")");
console.log("");
console.log("  KEEPING : " + cut.replace(/\s+/g, " "));
console.log("");
console.log("  REMOVING: " + removed.replace(/\s+/g, " ").slice(0, 200) + (removed.length > 200 ? " ..." : ""));
if (!cut.trim()) { console.error("\nREFUSING: the cut would leave the passage empty."); process.exit(2); }
if (!APPLY) { console.log("\nDRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

lib.passages[idx] = { ...p, text: cut, repaired: "PROMPT-115 s2" };
writeFileSync(libPath, JSON.stringify(lib, null, 1) + "\n");

const recPath = join(ROOT, "PASSAGE-REPAIRS.json");
const rec = existsSync(recPath) ? JSON.parse(readFileSync(recPath, "utf8"))
  : { _what: "Repairs applied over the GENERATED library. Re-extraction loses them: check this list " +
      "after every extraction and fix the extractor rather than re-patching.", repairs: [] };
rec.repairs.push({ source_id: SRC, edition: ED, clause: CLAUSE, ruled_in: "PROMPT-115 s2",
  cut_at_char: r.at, detected: r.matched, words_before: before.split(/\s+/).length,
  words_after: cut.split(/\s+/).length, why: WHY, at: new Date().toISOString() });
writeFileSync(recPath, JSON.stringify(rec, null, 2) + "\n");

/* read back from disk, so the claim is about the file and not about this process's memory */
const after = JSON.parse(readFileSync(libPath, "utf8")).passages
  .find((x) => x.source_id === SRC && String(x.edition) === ED && String(x.clause) === CLAUSE);
console.log("");
console.log("  read back: " + String(after.text).split(/\s+/).length + " words, run-on now " +
  (runOnIn(after) ? "STILL DETECTED" : "clear"));
console.log("  recorded in PASSAGE-REPAIRS.json (" + rec.repairs.length + " repair(s))");
if (runOnIn(after)) process.exitCode = 2;
