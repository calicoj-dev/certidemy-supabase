#!/usr/bin/env node
/**
 * gen-concept-repair-queue.mjs - the concept descriptions that reproduce ISO
 * wording, WITH THE TEXT IN THE FILE.
 *
 * READ-ONLY. Writes CONCEPT-REPAIR-QUEUE.json and nothing else. No model calls,
 * no database writes. Unknown flags exit 2.
 *
 * ============ WHY A QUEUE AND NOT A REWRITE ============
 *
 * This is the shape the lesson pass used: gen-bilingual-queue emits the rows a
 * human has to read, the human works the file, and apply-queue-edits applies
 * LITERAL old/new anchors with strict checks. Wording is a human judgement and
 * handing a settled one back to a model can only introduce variance.
 *
 * gen-bilingual-queue's own first version is the warning carried forward: it
 * emitted rows whose counts were exactly right and whose CONTENT WAS ABSENT,
 * because a truncation guard fired on every body. A queue without the text is
 * not a queue. Concept descriptions run 30-100 words, so nothing here is
 * truncated and the assertion below proves it row by row.
 *
 * ============ WHY REWRITING IS THE ONLY REPAIR AVAILABLE HERE ============
 *
 * IP-POSITION section 6 was amended 2026-09-17: a marked, attributed
 * blockquote is acceptable output. THAT EXEMPTION CANNOT REACH A CONCEPT.
 * It is a markdown mechanism -- the leak scanner detects it by lines beginning
 * `>` -- and `concepts.description` is a plain text column served as a bare
 * string by `mcp.concept`. There is nowhere to put the attribution and no
 * parser that would honour it.
 *
 * So for these 90 the repair is what the original 271 lesson repairs were:
 * say it in Certidemy's own words. Measured, not assumed: the queue records
 * each row's longest matching run and the matched text, so a reviewer can see
 * exactly which span is the standard's.
 *
 * ============ WHY THIS BLOCKS TRANSLATION ============
 *
 * The leak index is built from the ENGLISH editions. IP-POSITION section 5
 * records that a Spanish rendering of ISO's English scores zero against any
 * index that could be bought, because our translator's wording will not match
 * AENOR's. So translating an unrepaired description does not carry the defect
 * forward -- IT MAKES TWO COPIES THAT NOTHING CAN EVER FIND AGAIN. That is not
 * rework deferred, it is detectability lost permanently, and it is the whole
 * reason repair is sequenced first.
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { grams, longestRun, all, THRESHOLD } from "./scan-concept-iso.mjs";

const KNOWN = new Set(["--out", "--cert"]);
let OUT = null, ONLY_CERT = null;
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === "--out") OUT = process.argv[++i];
  else if (a === "--cert") ONLY_CERT = process.argv[++i];
  else {
    console.error("unknown flag: " + a);
    console.error("READ-ONLY. Flags: --out <file>, --cert <CODE>. No --apply: this writes a");
    console.error("queue for a human, and apply-queue-edits is what writes to the database.");
    process.exit(2);
  }
}
const HERE = dirname(fileURLToPath(import.meta.url));
OUT = OUT || join(HERE, "..", "CONCEPT-REPAIR-QUEUE.json");

/* The index and the measure come from scan-concept-iso, which has already run
 * its own positive control by the time this import resolves: a verbatim ISO
 * sentence must score at or above the threshold or it exits non-zero. */
if (!grams || grams.size < 5000) {
  console.error("the shared ISO index did not load");
  process.exit(2);
}

const certs = Object.fromEntries((await all("certifications?select=id,code")).map((c) => [c.id, c.code]));
const rows = await all("concepts?select=id,slug,name,description,certification_id");
if (!rows.length) { console.error("read 0 concepts"); process.exit(2); }

const over = [];
for (const r of rows) {
  const cert = certs[r.certification_id] ?? "?";
  if (ONLY_CERT && cert !== ONLY_CERT) continue;
  const desc = r.description ?? "";
  const { best, bestText } = longestRun(desc);
  if (best < THRESHOLD) continue;
  over.push({
    cert, concept_id: r.id, slug: r.slug, name: r.name,
    run_words: best,
    matched_iso_span: bestText,
    description_now: desc,          // THE FULL TEXT. Never a placeholder.
    description_new: "",            // the reviewer writes this
    verdict: "",                    // "repaired" | "keep" | "quote-is-necessary"
    note: "",
  });
}

/* CONTROL 1. The scan measured 90 over threshold platform-wide. An empty queue
 * here means the filter or the import is broken, not that the corpus is clean. */
if (!ONLY_CERT && over.length === 0) {
  console.error("0 rows over threshold, but scan-concept-iso reports 90. The filter is broken.");
  process.exit(2);
}
/* CONTROL 2. THE TEXT MUST ACTUALLY BE IN THE FILE. This is the exact defect
 * gen-bilingual-queue shipped first time round. Assert per row rather than
 * trusting that no truncation exists. */
const empty = over.filter((r) => !r.description_now || r.description_now.length < 20);
if (empty.length) {
  console.error(empty.length + " row(s) carry no usable description text -- a queue without");
  console.error("the text is not a queue. " + empty.slice(0, 3).map((r) => r.slug).join(", "));
  process.exit(2);
}
/* CONTROL 3. The matched span must actually occur in the description, modulo
 * normalisation. If it does not, the reviewer is being shown a span from
 * somewhere else. */
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const bogus = over.filter((r) => !norm(r.description_now).includes(r.matched_iso_span));
if (bogus.length) {
  console.error(bogus.length + " row(s) report a matched span that is not in the description");
  process.exit(2);
}

const byCert = over.reduce((m, r) => { (m[r.cert] ||= []).push(r); return m; }, {});
writeFileSync(OUT, JSON.stringify({
  generated: "run date not embedded -- see git",
  threshold_words: THRESHOLD,
  index_grams: grams.size,
  total_rows: over.length,
  how_to_work_this_file: [
    "For each row: read description_now and matched_iso_span.",
    "matched_iso_span is the longest run this description shares with a held ISO edition, normalised to lowercase words.",
    "Write description_new in Certidemy's own words, preserving the DEFINITION and dropping the standard's phrasing.",
    "Set verdict to 'repaired', or 'keep' if the run is coincidental (common technical phrasing, not the standard's expression).",
    "An attributed blockquote is NOT available here: description is a plain text column served as a bare string.",
    "Leave description_new empty for any row you set to 'keep'.",
  ],
  rows: over,
}, null, 2), "utf8");

console.log("");
console.log("  threshold " + THRESHOLD + "w | index " + grams.size + " grams");
console.log("  " + over.length + " description(s) over threshold, all with full text in the file");
for (const [c, rs] of Object.entries(byCert).sort()) {
  const runs = rs.map((r) => r.run_words).sort((a, b) => b - a);
  console.log("    " + c.padEnd(10) + String(rs.length).padStart(4) + " row(s), longest run " + runs[0] + "w, median " + runs[Math.floor(runs.length / 2)] + "w");
}
console.log("");
console.log("  written to " + OUT);
console.log("  Work the file, then apply with a literal old/new pass -- nothing here writes.");
