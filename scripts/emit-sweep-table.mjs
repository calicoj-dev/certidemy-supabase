/**
 * emit-sweep-table.mjs -- render the per certification x pool x language table
 * from ITEM-QUALITY-SWEEP.json and splice it into ITEM-QUALITY-SWEEP.md.
 *
 * READ-ONLY apart from that one fenced block. It exists because the table was
 * hand-transcribed once and came out wrong -- a dropped SPO-AI-I row and two
 * corrupted columns. A figure that is typed rather than emitted is a figure
 * nobody can reproduce, and this repository has paid for that more than once.
 *
 * The splice is asserted afterwards: the emitted text must appear verbatim in
 * the file, or the script exits non-zero rather than leaving a half-written
 * report. Unknown flags exit 2.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a) + " -- this script takes none");
  process.exitCode = 2; process.exit();
}

const d = JSON.parse(readFileSync(join(ROOT, "ITEM-QUALITY-SWEEP.json"), "utf8"));
const p = (v, w) => String(v).padStart(w);
const lines = ["cert      pool      lang      rows  flag  K-int cue/sec cue/pra   G3  G4   G7   pin  acc  unal"];
let R = 0, F = 0, K = 0;
for (const b of d.buckets) {
  const c = b.checks, g = (k) => c[k] || 0;
  const ki = g("key-integrity/secure") + g("key-integrity/practice");
  lines.push(b.certification.padEnd(10) + String(b.pool).padEnd(10) + b.language.padEnd(9)
    + p(b.rows, 5) + p(b.rows_flagged, 6) + p(ki, 7) + p(g("cue-introduced/secure"), 8)
    + p(g("cue-introduced/practice"), 8) + p(g("G3-modal"), 5) + p(g("G4-term"), 4)
    + p(g("G7-pin"), 5) + p(g("pin-other"), 5) + p(g("accent"), 5) + p(b.unalignable, 6));
  R += b.rows; F += b.rows_flagged; K += ki;
}
lines.push("".padEnd(29) + p(R, 5) + p(F, 6) + p(K, 7) +
  "   <- totals: rows, rows flagged, key-integrity failures");
const table = lines.join("\n");

/* Sanity before writing: the table must cover every translated row the sweep
   swept. A table that silently omits a bucket is the transcription defect with
   a script in front of it. */
if (R !== d.corpus.translated_rows) {
  console.error("REFUSING TO SPLICE: table covers " + R + " rows, the sweep swept " +
    d.corpus.translated_rows + ".");
  process.exitCode = 2; process.exit();
}

const mdPath = join(ROOT, "ITEM-QUALITY-SWEEP.md");
let md = readFileSync(mdPath, "utf8");
const FENCE = "```";
const start = md.indexOf(FENCE + "\ncert      pool");
if (start < 0) { console.error("anchor not found in ITEM-QUALITY-SWEEP.md"); process.exitCode = 2; process.exit(); }
const end = md.indexOf(FENCE, start + 4);
if (end < 0) { console.error("closing fence not found"); process.exitCode = 2; process.exit(); }
md = md.slice(0, start) + FENCE + "\n" + table + "\n" + md.slice(end);
writeFileSync(mdPath, md, "utf8");

const back = readFileSync(mdPath, "utf8");
if (!back.includes(table)) {
  console.error("SPLICE FAILED: the emitted table is not in the file verbatim.");
  process.exitCode = 2; process.exit();
}
console.log("spliced " + d.buckets.length + " buckets, " + R + " rows, " + K + " key-integrity failures");
console.log("verified verbatim in ITEM-QUALITY-SWEEP.md");
