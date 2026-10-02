#!/usr/bin/env node
/**
 * check-licensed-text.mjs -- no tracked file reproduces a held library passage.
 *
 * READ-ONLY. No network, no writes. Unknown flags exit 2.
 *
 * ============ WHY A NAME PATTERN WAS NEVER GOING TO BE ENOUGH ============
 *
 * Ruled PROMPT-101 r3, after the same escape twice in two rounds:
 *
 *   A54-DECOLUMNED.json   the coordinate de-columner's output -- A.5.4's title and statement verbatim
 *   AIMSF-PILOT-READ.md   every item's anchor TITLE, plus A.9.3's sentence and a stored key_support
 *
 * Both were committed, then noticed, then untracked, then a `.gitignore` line was added. **A .gitignore matches
 * NAMES and the rule is about CONTENT**, so every new document that quotes the library escapes until somebody
 * reads the diff. Two for two is not bad luck; it is the mechanism working as designed.
 *
 * So this asks the question the rule actually states: does this tracked file contain text from a held passage?
 *
 * ============ TWELVE WORDS, AND WHY A RUN RATHER THAN A SCORE ============
 *
 * A run of 12+ consecutive words shared with a passage. Not a ratio and not a coverage score: the leak scanner
 * already measures reproduction in CONTENT, where the question is how much of a standard a lesson carries. Here
 * the question is binary -- is licensed text in git -- and a single long run answers it.
 *
 * Twelve is the ruled figure and it sits above this repository's own measured collision floor: the corpus-wide
 * distribution shows nine contiguous words occurring from technical English written about the same subject,
 * with nothing bunched above it. A clause number, a control title of a few words, or a sentence of our own
 * prose about a clause stays under.
 *
 * ============ THE ALREADY-TRACKED FILES ARE A BASELINE, NOT AN EXEMPTION ============
 *
 * Under the 1d history ruling the repo is private, history stays, and the rule applies from now on. So the
 * R2-R5 artifacts and the override files are DEBT: the baseline may shrink and must never grow, exactly as the
 * web i18n baseline does. An entry that stops matching is reported as cleared.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let VERBOSE = false, JSON_OUT = null;
for (const a of process.argv.slice(2)) {
  let m;
  if (a === "--verbose") { VERBOSE = true; continue; }
  if ((m = /^--json=(.+)$/.exec(a))) { JSON_OUT = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". READ-ONLY. Known: --verbose, --json=<file>.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const RUN = 12;

/* ---- the library ---- */
const LIB = join(ROOT, "SOURCE-PASSAGES.json");
if (!existsSync(LIB)) {
  console.error("COULD NOT RUN: SOURCE-PASSAGES.json is absent, so nothing could be compared.");
  console.error("That is not a pass.");
  process.exit(2);
}
const lib = JSON.parse(readFileSync(LIB, "utf8"));
const words = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);

/* every RUN-gram of every passage, mapped to the passage that carries it */
const grams = new Map();
let passageCount = 0, gramCount = 0;
for (const p of lib.passages) {
  const w = words((p.title || "") + " " + (p.text || ""));
  if (w.length < RUN) continue;
  passageCount++;
  for (let i = 0; i + RUN <= w.length; i++) {
    const g = w.slice(i, i + RUN).join(" ");
    if (!grams.has(g)) { grams.set(g, p.source_id + " " + p.clause); gramCount++; }
  }
}
if (!gramCount) {
  console.error("COULD NOT RUN: the library yielded no " + RUN + "-grams. Nothing was examined.");
  process.exit(2);
}

function scan(text) {
  const w = words(text);
  const hits = [];
  for (let i = 0; i + RUN <= w.length; i++) {
    const g = w.slice(i, i + RUN).join(" ");
    const where = grams.get(g);
    if (where) hits.push({ gram: g, passage: where });
  }
  return hits;
}

/* ============ CONTROLS, BEFORE ANY VERDICT ============
 *
 * POSITIVE controls are the two real escapes, read from the commits BEFORE they were untracked -- so the
 * control cannot be satisfied by a file that no longer exists, and it keeps working after the files are gone.
 * This repository records a control that depended on a defect staying in production; reading from history is
 * how that is avoided.
 */
function fromCommit(ref, path) {
  try { return execFileSync("git", ["show", ref + ":" + path], { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28 }); }
  catch { return null; }
}
{
  const fails = [];
  const POS = [
    { ref: "bf8646d", path: "A54-DECOLUMNED.json", why: "A.5.4's title and statement, verbatim" },
    { ref: "ca889de", path: "AIMSF-PILOT-READ.md", why: "anchor titles plus A.9.3 and a stored key_support" },
  ];
  let posRun = 0;
  for (const c of POS) {
    const src = fromCommit(c.ref, c.path);
    if (src === null) { fails.push("POSITIVE CONTROL UNREADABLE: " + c.ref + ":" + c.path); continue; }
    posRun++;
    const hits = scan(src);
    if (!hits.length) fails.push("POSITIVE CONTROL MISSED: " + c.path + " (" + c.why + ") -- found no run");
  }
  if (!posRun) {
    console.error("COULD NOT RUN: neither positive control could be read from history, so the detector is");
    console.error("UNVALIDATED. A broken detector reports clean, which is why this is not a pass.");
    process.exit(2);
  }
  /* NEGATIVE control: clause NUMBERS and our own prose about them, quoting nothing. Built here rather than
   * pointed at a real file, so it cannot start failing when that file is edited. */
  const neg = "This migration asserts that clause 6.1.2 and clause A.5.4 both exist in the held edition, and " +
    "that Annex B.6.1.2 is guidance rather than a requirement. It names the addresses and states the " +
    "obligation in our own words, which is what the reproduction policy asks for, so nothing here is a " +
    "quotation of any standard at all and this sentence is deliberately long enough to exceed the run floor.";
  const negHits = scan(neg);
  if (negHits.length) {
    fails.push("NEGATIVE CONTROL FIRED: prose naming clause numbers matched " +
      JSON.stringify(negHits[0].gram.slice(0, 60)));
  }
  if (fails.length) {
    for (const f of fails) console.error("  CONTROL FAIL  " + f);
    console.error("REFUSING to print a verdict: a detector whose controls fail reports whatever it matched.");
    process.exit(2);
  }
  console.log("controls: " + posRun + " positive (from history) + 1 negative, all pass");
}

/* ---- the population: tracked files, plus what a commit would add ---- */
let files = [];
try {
  const sh = (args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" })
    .split("\n").map((s) => s.trim()).filter(Boolean);
  const SKIP = /\.(png|jpe?g|gif|pdf|woff2?|ttf|ico|zip)$/i;
  const tracked = sh(["ls-files"]).filter((f) => !SKIP.test(f));
  const untracked = sh(["ls-files", "--others", "--exclude-standard"]).filter((f) => !SKIP.test(f));
  files = [...new Set([...tracked, ...untracked])];
} catch (e) {
  console.error("could not list files: " + String(e).slice(0, 90));
  console.error("Nothing was examined, which is not a pass.");
  process.exit(2);
}

/* SOURCE-PASSAGES.json is the library itself and is gitignored; if it ever appears, that is the finding, not
 * an exemption. Nothing else is skipped by name. */
const BASE_PATH = join(ROOT, "scripts/licensed-text-baseline.json");
let baseline = [];
if (existsSync(BASE_PATH)) {
  baseline = (JSON.parse(readFileSync(BASE_PATH, "utf8")).known || []).filter((b) => b && b.file);
}
const baselined = new Set(baseline.map((b) => b.file));
const usedBase = new Set();

const findings = [], debt = [];
let examined = 0;
for (const rel of files) {
  let src;
  try { src = readFileSync(join(ROOT, rel), "utf8"); } catch { continue; }
  examined++;
  const hits = scan(src);
  if (!hits.length) continue;
  const rec = { file: rel, runs: hits.length, sample: hits[0].gram.slice(0, 80), passage: hits[0].passage };
  if (baselined.has(rel)) { usedBase.add(rel); debt.push(rec); continue; }
  findings.push(rec);
}
const cleared = baseline.filter((b) => !usedBase.has(b.file));

console.log("");
console.log("LICENSED TEXT IN TRACKED SOURCE");
console.log("");
console.log("  library            " + passageCount + " passage(s), " + gramCount.toLocaleString() +
  " distinct " + RUN + "-gram(s)");
console.log("  files examined     " + examined);
console.log("  KNOWN DEBT         " + debt.length + " file(s) in the baseline" +
  (cleared.length ? ",  " + cleared.length + " CLEARED since it was recorded" : ""));
for (const d of (VERBOSE ? debt : debt.slice(0, 12))) {
  console.log("      " + String(d.runs).padStart(5) + " run(s)  " + d.file + "   e.g. " + d.passage);
}
if (!VERBOSE && debt.length > 12) console.log("      ... and " + (debt.length - 12) + " more (--verbose)");
for (const c of cleared) console.log("      CLEARED: " + c.file + " -- prune it from the baseline");
console.log("  NEW FINDINGS       " + findings.length);
for (const f of findings) {
  console.log("      " + String(f.runs).padStart(5) + " run(s)  " + f.file);
  console.log("              " + f.passage + "   " + JSON.stringify(f.sample));
}
if (JSON_OUT) {
  writeFileSync(join(ROOT, JSON_OUT),
    JSON.stringify({ run: RUN, examined, findings, debt, cleared }, null, 1) + "\n", "utf8");
  console.log("  wrote " + JSON_OUT);
}
console.log("");
console.log("WHAT THIS CANNOT DO: it compares against the HELD library. A standard we do not hold is invisible");
console.log("to it, and a paraphrase is invisible by design -- the question is whether licensed TEXT is in git,");
console.log("not whether a sentence is about a standard.");
if (findings.length) {
  console.error("");
  console.error("FAILING: " + findings.length + " tracked file(s) reproduce a held passage and are not in the");
  console.error("baseline. Gitignore the file and `git rm --cached` it, or remove the quotation.");
  process.exitCode = 1;
}
