#!/usr/bin/env node
/**
 * check-cert-hardcoding.mjs -- no `--cert` script may DEFAULT a certification code or a standard id.
 *
 * READ-ONLY. Ruled PROMPT-135 s3, after the fifth and sixth instances in a row:
 *
 *   the cutover keep list            AIMSF-SURVIVORS.json, hard-coded
 *   the rollback file                AIMSF-CUTOVER-RETIRED.json as a DEFAULT -- it offered to
 *                                    un-retire AIMS-F after the ISMS-IA cutover
 *   set-exam-scope-all-grounded      code=eq.AIMS-F in the population query
 *   thin-map-proposals               code=eq.AIMS-F, AIMS-F-only rules
 *   the IA tier rule                 ISO/IEC 27001 as THE requirements standard
 *   item-disposition / cap census    ^(AIMSF|PILOT) artifacts, cert === "AIMS-F" gates, and
 *                                    standard = "ISO/IEC 42001" as a parameter DEFAULT
 *
 * WHAT COUNTS AS A FINDING, and the distinction is the whole value of this check:
 *
 *   DEFAULT   a literal reached when the caller said nothing: `let CERT = "AIMS-F"`,
 *             `standard = "ISO/IEC 42001"`, `cert === "AIMS-F"` gating behaviour, a filename
 *             built from a literal slug. THIS IS THE BUG.
 *   FIXTURE   a literal inside a control, a controls block or a test table. Correct and expected.
 *   COMMENT   a literal in a comment or a message string. Harmless.
 *
 * A check that reported all three the same would print forty lines nobody reads, which is how the
 * first five survived.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let VERBOSE = false, PLANT = false;
for (const a of process.argv.slice(2)) {
  if (a === "--verbose") { VERBOSE = true; continue; }
  /* --self-test proves the check can still say FAIL: it plants a default in memory and asserts the
   * classifier catches it. A green sweep over 200 files is worth nothing without this. */
  if (a === "--self-test") { PLANT = true; continue; }
  if (a === "--write-baseline") continue;   /* read below via process.argv */
  console.error("unrecognised flag: " + a + ". Known: --verbose, --self-test. READ-ONLY.");
  process.exit(2);
}

const CERT_CODE = /\b(AIMS-F|AIMS-IA|ISMS-F|ISMS-IA|AIMSF|ISMSF|AIMSIA|ISMSIA)\b/;
const STANDARD = /ISO\/IEC\s*(27001|42001|27002|27000)\b/;
/* a DEFAULT is an assignment or comparison that decides behaviour with no caller input */
const DEFAULT_SHAPES = [
  /\b(let|const|var)\s+\w*CERT\w*\s*=\s*["'][^"']+["']/i,
  /\bcert\w*\s*=\s*["'](AIMS|ISMS)[^"']*["']/i,
  /\b(standard|edition)\s*=\s*["']ISO\/IEC[^"']*["']/i,
  /\bcert\w*\s*===\s*["'](AIMS|ISMS)[^"']*["']/i,
  /code=eq\.(AIMS|ISMS)[A-Z-]*/,
  /\^\(?(AIMSF|ISMSF|AIMSIA|ISMSIA)/,
  /["'](AIMSF|ISMSF|AIMSIA|ISMSIA)-[A-Z-]*\.json["']/,
];

const files = readdirSync(join(ROOT, "scripts")).filter((f) => f.endsWith(".mjs"))
  .map((f) => join("scripts", f))
  .concat(readdirSync(join(ROOT, "scripts", "lib")).filter((f) => f.endsWith(".mjs"))
    .map((f) => join("scripts", "lib", f)));

const rows = [];
let scanned = 0, certScripts = 0;
for (const rel of files) {
  let src;
  try { src = readFileSync(join(ROOT, rel), "utf8"); } catch { continue; }
  scanned++;
  /* ONLY SCRIPTS THAT TAKE --cert. A script written for one certification and honest about it is not
   * this defect; the defect is a script that PROMISES to take any certification and does not. */
  const takesCert = /--cert/.test(src);
  const isLib = rel.includes("lib" + (process.platform === "win32" ? "\\" : "/"));
  if (!takesCert && !isLib) continue;
  if (takesCert) certScripts++;
  const lines = src.split(/\r?\n/);
  /* a controls region: from a controls function to the end of the file, plus any explicit block */
  let inControls = false;
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    if (/export function \w*[Cc]ontrols|function \w*[Cc]ontrols\s*\(|---- controls/.test(L)) inControls = true;
    const trimmed = L.trim();
    const isComment = /^(\/\/|\/\*|\*)/.test(trimmed);
    if (!CERT_CODE.test(L) && !STANDARD.test(L)) continue;
    const isDefault = DEFAULT_SHAPES.some((re) => re.test(L));
    const kind = isComment ? "COMMENT" : inControls ? "FIXTURE" : isDefault ? "DEFAULT" : "MENTION";
    rows.push({ rel, line: i + 1, kind, text: trimmed.slice(0, 104) });
  }
}

if (PLANT) {
  const planted = 'let CERT = "AIMS-F";';
  const caught = DEFAULT_SHAPES.some((re) => re.test(planted));
  const plantedStd = '  standard = "ISO/IEC 42001", edition = "2023" }) {';
  const caught2 = DEFAULT_SHAPES.some((re) => re.test(plantedStd));
  console.log("SELF-TEST  planted `" + planted + "` -> " + (caught ? "CAUGHT" : "MISSED"));
  console.log("SELF-TEST  planted `" + plantedStd.trim() + "` -> " + (caught2 ? "CAUGHT" : "MISSED"));
  if (!caught || !caught2) { console.error("the classifier cannot see its own defect"); process.exit(2); }
}

const defaults = rows.filter((r) => r.kind === "DEFAULT");
/* ============ A BASELINE, BECAUSE THE RULING FIXED ONE PATH AND LISTED THE REST ============
 *
 * PROMPT-135 s3 fixed every default on AIMS-IA's path (stages 3 to 9) and left the others listed.
 * So this cannot demand zero: it demands NO NEW ONE, the same discipline as the licensed-text
 * baseline -- may shrink, must never grow. The baseline keys on file:line's CONTENT, not its line
 * number, so moving a line does not read as a new finding.
 */
const BASELINE_FILE = join(ROOT, "cert-hardcoding-baseline.json");
let baseline = { entries: [] };
try { baseline = JSON.parse(readFileSync(BASELINE_FILE, "utf8")); } catch { /* first run */ }
const sig = (r) => r.rel.replace(/\\/g, "/") + " :: " + r.text;
const known = new Set((baseline.entries || []).map((e) => e.sig || e));
const fresh = defaults.filter((r) => !known.has(sig(r)));
const goneCount = [...known].filter((k) => !defaults.some((r) => sig(r) === k)).length;
console.log("");
console.log("CERTIFICATION HARD-CODING SWEEP   READ-ONLY");
console.log("  .mjs files read                 " + scanned);
console.log("  that take --cert                " + certScripts + "  (plus every scripts/lib module)");
console.log("  lines naming a cert or standard " + rows.length);
console.log("    DEFAULT  (a bug)              " + defaults.length);
console.log("    FIXTURE  (a control)          " + rows.filter((r) => r.kind === "FIXTURE").length);
console.log("    COMMENT                       " + rows.filter((r) => r.kind === "COMMENT").length);
console.log("    MENTION  (in a message/query) " + rows.filter((r) => r.kind === "MENTION").length);
console.log("");
if (defaults.length) {
  console.log("  DEFAULTS -- each one decides behaviour with no caller input:");
  for (const r of defaults) console.log("    " + (r.rel + ":" + r.line).padEnd(48) + r.text);
}
if (VERBOSE) {
  for (const k of ["MENTION", "FIXTURE", "COMMENT"]) {
    console.log("");
    console.log("  " + k + ":");
    for (const r of rows.filter((x) => x.kind === k)) {
      console.log("    " + (r.rel + ":" + r.line).padEnd(48) + r.text);
    }
  }
}
console.log("");
console.log("  KNOWN DEBT (baselined, off AIMS-IA's path) " + (defaults.length - fresh.length));
console.log("  NEW DEFAULTS                               " + fresh.length + "   (must be 0)");
console.log("  baselined entries now absent (shrank)      " + goneCount);
for (const r of fresh) console.log("      NEW  " + r.rel + ":" + r.line + "   " + r.text);
if (process.argv.includes("--write-baseline")) {
  writeFileSync(BASELINE_FILE, JSON.stringify({
    _what: "Certification/standard DEFAULTS known at PROMPT-135 s3. Every one on AIMS-IA's path " +
      "(stages 3 to 9) was FIXED; these are the rest, left listed by the ruling. May shrink, must " +
      "NEVER grow -- a new entry is a new --cert script with a certification baked in.",
    baselined: "2026-10-05, PROMPT-135 s3",
    count: defaults.length,
    entries: defaults.map((r) => ({ sig: sig(r), file: r.rel.replace(/\\/g, "/"), text: r.text })),
  }, null, 1) + "\n");
  console.log("  wrote cert-hardcoding-baseline.json with " + defaults.length + " entry(ies)");
}
console.log("");
console.log(fresh.length
  ? fresh.length + " NEW DEFAULT(S) -- a --cert script must refuse what it does not know, never fall back."
  : "NO NEW DEFAULT. " + (defaults.length - fresh.length) + " baselined, AIMS-IA's path clean.");
if (fresh.length) process.exitCode = 1;
