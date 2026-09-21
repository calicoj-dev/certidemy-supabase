#!/usr/bin/env node
/**
 * gen-misattribution-read.mjs - emit the top cross-family misattribution
 * candidates for a human read, with BOTH sides in the file.
 *
 * READ-ONLY. Fixes nothing.
 *
 * ============ WHY CROSS-FAMILY ONLY ============
 *
 * ISO/IEC 42001, 27001, 27000 and 27002 share clause text BY DESIGN -- the
 * harmonised structure is the whole point of them. "The passage sits more
 * contiguously in the other one" therefore fires constantly between siblings
 * and means very little. Thirty-seven of the eighty flagged pairs are that.
 *
 * A citation of 19011 whose passage is verbatim in 27000, or of 42001 whose
 * passage is verbatim in 27005, is a different animal: those documents share no
 * harmonised text, so the overlap has to come from somewhere.
 *
 * ============ BOTH SIDES IN THE FILE ============
 *
 * A review that shows only the attributed sentence cannot be done -- the
 * reviewer would have to go and find the other standard. So each row carries
 * the attributed text AND the surrounding text from the actual source, and the
 * file says which is which.
 *
 * NOTHING HERE IS A VERDICT. The instrument sees reproduced expression, and a
 * sentence can be a fair paraphrase of the cited clause AND share wording with
 * a different standard that says something similar. That judgement is the read.
 */
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, pdftotextAvailable, verifyCorpus } from "./lib/citation-index.mjs";

for (const a of process.argv.slice(2)) {
  if (a.startsWith("--")) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
}
if (!pdftotextAvailable()) { console.error("pdftotext is not on PATH."); process.exit(2); }
const bad = verifyCorpus();
if (bad.length) { console.error("CORPUS CONTROL FAILED:\n  " + bad.join("\n  ")); process.exit(1); }

const NL = String.fromCharCode(10);
function pdfText(p) {
  const o = join(mkdtempSync(join(tmpdir(), "mr-")), "t.txt");
  execFileSync("pdftotext", ["-layout", p, o]);
  return readFileSync(o, "utf8").split("\r").join("");
}
const RAW = new Map();
for (const [k, p] of Object.entries(PDFS)) RAW.set(k, pdfText(p));

const norm = (s) => String(s || "").toLowerCase()
  .replace(/[‘’]/g, "'").replace(/[–—]/g, "-").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();

/** The passage in the actual source, with context either side of the match. */
function sourceContext(key, hit) {
  const raw = RAW.get(key);
  const flatWords = norm(raw).split(" ");
  const hitWords = hit.split(" ");
  /* Find the match in normalised space, then map back by walking the raw text
   * for the first hit word and confirming the run. Cheap and good enough for a
   * reading aid; the authoritative match is the n-gram score already recorded. */
  const target = hitWords.slice(0, Math.min(5, hitWords.length)).join(" ");
  let bestAt = -1;
  for (let i = 0; i + 5 <= flatWords.length; i++) {
    if (flatWords.slice(i, i + 5).join(" ") === target) { bestAt = i; break; }
  }
  if (bestAt < 0) return null;
  return flatWords.slice(Math.max(0, bestAt - 18), bestAt + hitWords.length + 22).join(" ");
}

const HELD = {
  "42001": "42001:2023", "27001": "27001:2022", "19011": "19011:2026",
  "22989": "22989:2022", "27000": "27000:2018", "27002": "27002:2022",
  "27004": "27004:2016", "27005": "27005:2022",
};
const HARM = new Set(["42001:2023", "27001:2022", "27000:2018", "27002:2022", "27001:2022/Amd1"]);

const HERE = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(HERE, "..", "CITATION-CORRESPONDENCE.json"), "utf8"));
const mis = data.findings.filter((f) => f.verdict === "MISATTRIBUTED");
const cross = mis.filter((f) => !(HARM.has(HELD[f.standard]) && HARM.has(f.best_source)));

/* Dedupe: the same sentence quoted in two places is one thing to read. */
const seen = new Set();
const top = [];
for (const f of cross.sort((a, b) => b.best_run - a.best_run)) {
  const k = f.standard + "|" + norm(f.claim).slice(0, 80);
  if (seen.has(k)) continue;
  seen.add(k);
  top.push(f);
  if (top.length >= 10) break;
}

const rows = top.map((f, i) => ({
  rank: i + 1,
  run_words_in_actual_source: f.best_run,
  where: { corpus: f.corpus, certification: f.cert, ref: f.ref },
  cited: { standard: "ISO " + f.standard, address: f.address || null, verb: f.verb,
    contiguous_words_found_there: f.run },
  attributed_text: f.claim,
  actual_source: f.best_source,
  actual_source_says: sourceContext(f.best_source, f.hit) || "(context not recoverable; the match is the n-gram score)",
  matched_span: f.hit,
  your_verdict: "", your_note: "",
}));

writeFileSync(join(HERE, "..", "MISATTRIBUTION-READ.json"), JSON.stringify({
  what: "Top 10 cross-family misattribution candidates, by how verbatim the passage is in a standard OTHER than the one cited.",
  measured: "2026-09-21",
  population: { all_misattributed: mis.length, harmonised_siblings_excluded: mis.length - cross.length, cross_family: cross.length },
  why_cross_family_only: "42001, 27001, 27000 and 27002 share clause text by design, so a sibling overlap means very little. These pairs share no harmonised text.",
  not_a_verdict: "The instrument sees reproduced EXPRESSION. A sentence can be a fair paraphrase of the cited clause and still share wording with another standard that says something similar. Fixed nothing.",
  rows,
}, null, 2), "utf8");

console.log("");
console.log("  all misattributed " + mis.length + "   harmonised siblings " + (mis.length - cross.length)
  + "   cross-family " + cross.length + "   emitted " + rows.length);
for (const r of rows) {
  console.log("");
  console.log("  " + String(r.rank).padStart(2) + ". " + String(r.run_words_in_actual_source).padStart(2) + "w   "
    + r.where.corpus + " " + r.where.certification + "   cited " + r.cited.standard
    + (r.cited.address ? " clause " + r.cited.address : "") + "  ->  actual " + r.actual_source);
  console.log("      " + r.attributed_text.slice(0, 150));
}
console.log("");
console.log("wrote MISATTRIBUTION-READ.json");
