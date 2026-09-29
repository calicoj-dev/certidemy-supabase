#!/usr/bin/env node
/**
 * check-a62-extraction.mjs -- extraction quality of the seven clauses just promoted to primary.
 *
 * READ-ONLY, no flags, no writes, no model calls.
 *
 * WHY NOW. These clauses were SUPPORTING until today, so their text only ever fed explanations and
 * distractors. They are now anchorable, which means a key's `key_support` can be copied verbatim out of
 * them -- and a verbatim gate compares character for character, so extraction noise stops being cosmetic
 * and becomes the text of an examination item.
 *
 * The regenerated run surfaced it by accident: a distractor quoted A.6.2.3 as
 *
 *   "The organization shall document the AI system design and and development development based on
 *    organizational objectives, docu- mented requirements and specification criteria."
 *
 * -- duplicated words and a hyphenation break, straight from the PDF's two-column layout.
 *
 * Reported, not repaired: re-extracting a source is a re-calibration, and this repository already records
 * that widening or re-cutting an index changes error rates everywhere and must be measured, not slipped
 * in beside something else.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const PROMOTED = ["A.6.2.2", "A.6.2.3", "A.6.2.4", "A.6.2.5", "A.6.2.6", "A.6.2.7", "A.6.2.8"];
/* the wider set an item on 1.3 could now anchor in or quote */
const ALSO = ["A.6.1.2", "A.6.1.3", "B.6.1.1", "B.6.2.1", "C.3.6", "8.1"];

/* Each detector names a SHAPE the extractor produces, not a spelling. A word list would miss the next
 * duplicated pair; these are structural. */
const DETECTORS = [
  ["duplicated adjacent word", /\b(\w{3,})\s+\1\b/i],
  ["hyphenation break mid-word", /\w-\s+\w/],
  ["title bleeding into the text", /^[A-Z][^.]{0,60}?\s+The organization shall/],
  ["double space inside a sentence", /\w {2,}\w/],
  ["a lone letter between words", /\s[b-hj-z]\s/i],
];

const rows = [];
for (const c of [...PROMOTED, ...ALSO]) {
  const p = lib.passages.find((x) => /42001/.test(x.source_id) && x.clause === c);
  if (!p) { rows.push({ clause: c, absent: true, hits: [] }); continue; }
  const text = String(p.text || "");
  const hits = [];
  for (const [name, re] of DETECTORS) {
    const m = re.exec(text);
    if (m) hits.push({ name, at: m.index, sample: text.slice(Math.max(0, m.index - 30), m.index + 60).replace(/\s+/g, " ") });
  }
  rows.push({ clause: c, promoted: PROMOTED.includes(c), words: text.trim().split(/\s+/).filter(Boolean).length,
    hits, text });
}

const md = [];
const p = (s = "") => md.push(s);
p("# Extraction quality of the clauses task 1.3 can now anchor in");
p("");
p("**Report only.** These seven were SUPPORTING until 2026-09-29, so their text only fed explanations and");
p("distractors. They are now anchorable: a key's `key_support` is copied verbatim out of them and the");
p("verbatim gate compares character for character, so extraction noise becomes the text of an item.");
p("");
p("Detectors name a SHAPE the extractor produces, never a spelling -- a word list would miss the next");
p("duplicated pair.");
p("");
p("| clause | promoted today | words | findings |");
p("|---|---|---|---|");
for (const r of rows) {
  p("| `" + r.clause + "` | " + (r.promoted ? "yes" : "-") + " | " + (r.words ?? "-") + " | " +
    (r.absent ? "**absent from the library**" : (r.hits.length ? r.hits.map((h) => h.name).join("; ") : "clean")) + " |");
}
p("");
const dirty = rows.filter((r) => r.hits.length);
p("**" + dirty.length + " of " + rows.length + " carry at least one finding.**");
p("");
for (const r of dirty) {
  p("### `" + r.clause + "`" + (r.promoted ? "   (promoted today)" : ""));
  p("");
  for (const h of r.hits) p("- **" + h.name + "** -- ..." + h.sample + "...");
  p("");
  p("Full text as held:");
  p("");
  p("> " + String(r.text).replace(/\s+/g, " "));
  p("");
}
p("## What this does and does not mean");
p("");
p("A key quoting mangled text would still PASS the verbatim gate, because the gate asks whether the quote");
p("matches the passage -- and it does. It would fail nothing and read wrong to a candidate. That is the");
p("dangerous direction: the gate cannot see it.");
p("");
p("Not repaired here. Re-extracting a source is a re-calibration, and this repository records that");
p("changing an index moves error rates everywhere and must be measured rather than slipped in beside");
p("another change.");
p("");
writeFileSync(join(ROOT, "A62-EXTRACTION-QUALITY.md"), md.join("\n") + "\n", "utf8");
writeFileSync(join(ROOT, "A62-EXTRACTION-QUALITY.json"), JSON.stringify({
  detectors: DETECTORS.map(([n]) => n),
  rows: rows.map((r) => ({ clause: r.clause, promoted: r.promoted, words: r.words,
    findings: r.hits.map((h) => h.name), samples: r.hits.map((h) => h.sample) })),
}, null, 1) + String.fromCharCode(10), "utf8");
for (const r of rows) {
  console.log("  " + r.clause.padEnd(9) + (r.promoted ? "promoted " : "         ") +
    String(r.words ?? "-").padStart(4) + "w  " + (r.hits.length ? r.hits.map((h) => h.name).join("; ") : "clean"));
}
console.log("\n" + dirty.length + " of " + rows.length + " carry a finding. Reported, not repaired.");
console.log("wrote A62-EXTRACTION-QUALITY.md and .json");
