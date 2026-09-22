#!/usr/bin/env node
/**
 * diagnose-run-splitting.mjs - does one interpolated word defeat the gate?
 *
 * READ-ONLY. No flags. Writes nothing, fixes nothing.
 *
 * ============ THE HYPOTHESIS UNDER TEST ============
 *
 * `confidentiality` reads "information is not made available to unauthorized
 * individuals, entities or processes". ISO/IEC 27000 -- INDEXED -- defines it
 * as "property that information is not made available or disclosed to
 * unauthorized individuals, entities, or processes".
 *
 * The gate reported nothing. `availability`, the same shape from the same
 * source family, fired at 0.818.
 *
 * The proposed mechanism: coverage is computed from the LONGEST SINGLE RUN, so
 * the interpolated "or disclosed" splits one near-total reproduction into two
 * shorter runs and neither clears the 0.60 floor on its own.
 *
 * IF IT HOLDS, the gate is defeated by a single inserted word, and every
 * near-verbatim-with-one-edit reproduction in the corpus is invisible at any
 * threshold -- which is a coverage gap of the same class as the monolingual
 * one, in the scoring rather than in the index.
 *
 * ============ WHAT WOULD FALSIFY IT ============
 *
 * If confidentiality's matched words are sparse rather than two long runs --
 * if the tokens matching 27000 are scattered commonplaces like "information
 * is" and "to unauthorized" -- then the description is NOT a near-verbatim
 * reproduction, summing would be measuring noise, and the right answer is that
 * the gate is correct and the reading of the row was wrong.
 *
 * So this prints EVERY run, not a verdict: the enumeration is the artifact.
 */
import { readFileSync, existsSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, pdftotextAvailable, expectedWords } from "./lib/citation-index.mjs";

for (const a of process.argv.slice(2)) {
  if (a.startsWith("--")) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
}

const SEED = 4, MIN_RUN = 4, MIN_COV = 0.60;
const HERE = dirname(fileURLToPath(import.meta.url));

if (!pdftotextAvailable()) { console.error("pdftotext not on PATH"); process.exit(2); }
const norm = (s) => String(s || "").toLowerCase()
  .replace(/[‘’]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
const W = (s) => norm(s).split(" ").filter(Boolean);

const perSource = new Map();
for (const [key, p] of Object.entries(PDFS)) {
  if (!existsSync(p)) { console.error("MISSING " + key); process.exit(2); }
  const o = join(mkdtempSync(join(tmpdir(), "iso-")), "t.txt");
  execFileSync("pdftotext", ["-layout", p, o]);
  const w = W(readFileSync(o, "utf8"));
  if (w.length !== expectedWords(key)) { console.error(key + " word-count mismatch"); process.exit(1); }
  const set = new Set();
  for (let i = 0; i + SEED <= w.length; i++) set.add(w.slice(i, i + SEED).join(" "));
  perSource.set(key, set);
}

/** EVERY run against one source, not just the longest. */
function runs(text, set) {
  const w = W(text);
  const out = [];
  for (let i = 0; i + SEED <= w.length; i++) {
    if (!set.has(w.slice(i, i + SEED).join(" "))) continue;
    let n = SEED;
    while (i + n + 1 <= w.length && set.has(w.slice(i + n + 1 - SEED, i + n + 1).join(" "))) n++;
    out.push({ start: i, len: n, text: w.slice(i, i + n).join(" ") });
    i += n - 1;
  }
  return out;
}

/* THE UNION, NOT THE SUM. Adding run lengths double-counts any overlap and
 * can exceed the description length, which would be a coverage above 1.0 --
 * the manufactured-adjacency defect in a new place. Count DISTINCT matched
 * word positions. */
function coverages(text, set) {
  const w = W(text);
  const rs = runs(text, set);
  const hit = new Set();
  for (const r of rs) for (let k = r.start; k < r.start + r.len; k++) hit.add(k);
  const longest = rs.reduce((m, r) => Math.max(m, r.len), 0);
  return {
    words: w.length, runs: rs,
    maxRun: longest,
    maxCov: w.length ? longest / w.length : 0,
    unionWords: hit.size,
    unionCov: w.length ? hit.size / w.length : 0,
  };
}

const CASES = [
  ["confidentiality", "information is not made available to unauthorized individuals, entities or processes"],
  ["integrity", "information is accurate and complete and has not been altered without authorization"],
  /* CONTROLS. availability is a known fire -- it must still fire, or the
   * diagnostic is measuring something other than the gate. nonconformity is a
   * known non-fire and must stay one under BOTH measures, or summing has
   * simply lowered the bar for everything. */
  ["availability  [known FIRE, control]", "information is accessible and usable on demand by an authorized entity"],
  ["nonconformity [known non-fire, control]", "a failure to meet a requirement"],
];

console.log("");
console.log("RUN-SPLITTING DIAGNOSTIC   seed " + SEED + ", floor run>=" + MIN_RUN + " cov>=" + MIN_COV.toFixed(2));
console.log("Coverage is currently LONGEST RUN / words. The union measure counts every");
console.log("distinct matched word position instead.");

for (const [label, text] of CASES) {
  console.log("");
  console.log("=".repeat(78));
  console.log(label);
  console.log("  \"" + text + "\"");
  let best = null;
  for (const [key, set] of perSource) {
    const c = coverages(text, set);
    if (!c.runs.length) continue;
    if (!best || c.unionCov > best.c.unionCov) best = { key, c };
  }
  if (!best) { console.log("  no run of " + SEED + "+ words against any indexed source"); continue; }
  const { key, c } = best;
  console.log("  best source: " + key + "   (" + c.words + " words in the description)");
  console.log("  runs:");
  for (const r of c.runs.sort((a, b) => b.len - a.len)) {
    console.log("    " + String(r.len).padStart(3) + "w  at " + String(r.start).padStart(2) + "   \"" + r.text + "\"");
  }
  const firesNow = c.maxRun >= MIN_RUN && c.maxCov >= MIN_COV;
  const firesUnion = c.maxRun >= MIN_RUN && c.unionCov >= MIN_COV;
  console.log("  LONGEST RUN   " + c.maxRun + "w / " + c.words + "  = " + c.maxCov.toFixed(3) +
              "   -> " + (firesNow ? "FIRES" : "silent") + "   (this is the gate today)");
  console.log("  UNION         " + c.unionWords + "w / " + c.words + "  = " + c.unionCov.toFixed(3) +
              "   -> " + (firesUnion ? "FIRES" : "silent"));
  if (firesUnion && !firesNow) console.log("  ** HYPOTHESIS HOLDS FOR THIS ROW: silent today, fires on the union measure. **");
  if (!firesUnion && !firesNow) console.log("  hypothesis does NOT hold here: silent under both measures.");
  if (firesNow) console.log("  (fires under both -- control behaving as expected)");
}

console.log("");
console.log("=".repeat(78));
console.log("LIMIT: the union measure counts matched positions, so a description made of");
console.log("commonplaces can score high without reproducing anything. Whether union is the");
console.log("right instrument is a judgement about the RUNS PRINTED ABOVE, not about the");
console.log("number -- read them before changing the gate.");
