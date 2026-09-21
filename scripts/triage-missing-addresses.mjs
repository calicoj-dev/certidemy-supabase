#!/usr/bin/env node
/**
 * triage-missing-addresses.mjs - split the ADDRESS NOT FOUND findings into
 * real defects, unverifiable claims, and extractor artifacts, BEFORE anyone
 * reads them as a defect list.
 *
 * READ-ONLY. Counts first, instances second. Fixes nothing.
 *
 * ============ WHY THIS COMES BEFORE THE READING ============
 *
 * The parser behind this number was wrong twice today before any content was:
 * it read the table of contents instead of the body, and then a shell heredoc
 * collapsed its escapes. Correcting it moved the count from 147 to 179, which
 * is the wrong direction to move without an explanation -- the old one was
 * accepting a contents entry as proof that a clause existed.
 *
 * So the count is not reported as a defect list until it is split by a SECOND,
 * INDEPENDENT method. The first method asks "is there a heading line for this
 * address". The second asks "does this address token occur in the document at
 * all". They disagree exactly where the first one is wrong.
 *
 *   a) INDEXED standard, token occurs NOWHERE      -> a real defect
 *   b) UNINDEXED standard                          -> unverifiable, not a defect
 *   c) token DOES occur, no heading line           -> extractor artifact, or an
 *                                                     address that is a
 *                                                     sub-item rather than a
 *                                                     clause of its own
 *
 * Bucket (c) is expected to be large and that is not a failure of the content.
 * ISO numbers sub-items as "9.2.2 b)", and a citation of "clause 9.2.2 b)"
 * names something real that is not a heading.
 */
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, pdftotextAvailable, expectedWords, verifyCorpus } from "./lib/citation-index.mjs";

for (const a of process.argv.slice(2)) {
  if (a.startsWith("--")) { console.error("Unrecognised flag: " + a + ". READ-ONLY, no flags."); process.exit(2); }
}
if (!pdftotextAvailable()) { console.error("pdftotext is not on PATH."); process.exit(2); }
const bad = verifyCorpus();
if (bad.length) { console.error("CORPUS CONTROL FAILED:\n  " + bad.join("\n  ")); process.exit(1); }

const NL = String.fromCharCode(10);
const norm = (s) => String(s || "").toLowerCase()
  .replace(/[‘’]/g, "'").replace(/[–—]/g, "-").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
function pdfText(p) {
  const o = join(mkdtempSync(join(tmpdir(), "tr-")), "t.txt");
  execFileSync("pdftotext", ["-layout", p, o]);
  return readFileSync(o, "utf8").split("\r").join("");
}
const RAW = new Map();
for (const [key, p] of Object.entries(PDFS)) {
  const t = pdfText(p);
  if (norm(t).split(" ").filter(Boolean).length !== expectedWords(key)) {
    console.error(key + " extraction disagrees with the manifest. Refusing."); process.exit(1);
  }
  RAW.set(key, t);
}

const HELD = {
  "42001": "42001:2023", "27001": "27001:2022", "19011": "19011:2026",
  "22989": "22989:2022", "27000": "27000:2018", "27002": "27002:2022",
  "27004": "27004:2016", "27005": "27005:2022",
};

/** Is there a body HEADING line for this address? The first method. */
function hasHeading(key, addr) {
  const lines = RAW.get(key).split(NL);
  /* Same rule as clauseText: a heading may have no space after its number,
   * because ISO/IEC 27001:2022 extracts as "4.1Understanding". */
  for (const line of lines) {
    const t = line.trim();
    if (!t.startsWith(addr)) continue;
    const c = t[addr.length];
    if (c === undefined) continue;
    if ((c >= "0" && c <= "9") || c === ".") continue;
    if (!(c === " " || (c >= "A" && c <= "Z"))) continue;
    if (t.includes("....")) continue;
    return true;
  }
  return false;
}

/** Does the address token occur ANYWHERE? The second, independent method. */
function tokenOccurs(key, addr) {
  const raw = RAW.get(key);
  const isNumish = (c) => (c >= "0" && c <= "9") || c === ".";
  let from = 0;
  for (;;) {
    const i = raw.indexOf(addr, from);
    if (i < 0) return false;
    const before = i > 0 ? raw[i - 1] : " ";
    const after = i + addr.length < raw.length ? raw[i + addr.length] : " ";
    /* A whole token: not part of a longer number like 9.2.22 */
    if (!isNumish(before) && !isNumish(after)) return true;
    from = i + 1;
  }
}

const HERE = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(HERE, "..", "CITATION-CORRESPONDENCE.json"), "utf8"));
const missing = data.findings.filter((f) => f.verdict === "ADDRESS NOT FOUND");

const A = [], B = [], C = [];
for (const f of missing) {
  const key = HELD[f.standard];
  if (!key) { B.push(f); continue; }
  if (tokenOccurs(key, f.address)) { C.push({ ...f, key }); continue; }
  A.push({ ...f, key });
}

console.log("");
console.log("TRIAGE OF " + missing.length + " ADDRESS NOT FOUND FINDINGS");
console.log("  a) INDEXED standard, address token occurs NOWHERE   " + String(A.length).padStart(4) + "   real defects");
console.log("  b) UNINDEXED standard                               " + String(B.length).padStart(4) + "   unverifiable, not defects");
console.log("  c) token occurs but no heading line                 " + String(C.length).padStart(4) + "   extractor artifact or sub-item");
console.log("");
console.log("  (b) IS ZERO BY CONSTRUCTION AND THAT IS WORTH SAYING: a citation of an");
console.log("  unindexed standard never reaches the address test -- checkCitation returns");
console.log("  UNVERIFIABLE first. Those 54 are counted in their own bucket in the");
console.log("  correspondence report, not hidden inside this one.");

const byStdA = {};
for (const f of A) (byStdA["ISO " + f.standard] ||= new Set()).add(f.address);
console.log("");
console.log("BUCKET (a) BY STANDARD AND ADDRESS");
for (const [k, v] of Object.entries(byStdA).sort()) console.log("  " + k + "   " + [...v].sort().join(", "));

const byStdC = {};
for (const f of C) (byStdC["ISO " + f.standard] ||= new Set()).add(f.address);
console.log("");
console.log("BUCKET (c) BY STANDARD AND ADDRESS");
for (const [k, v] of Object.entries(byStdC).sort()) console.log("  " + k + "   " + [...v].sort().slice(0, 24).join(", "));

writeFileSync(join(HERE, "..", "MISSING-ADDRESS-TRIAGE.json"), JSON.stringify({
  measured: "2026-09-21", total: missing.length,
  buckets: { a_real: A.length, b_unverifiable: B.length, c_artifact_or_subitem: C.length },
  a: A.map((f) => ({ corpus: f.corpus, cert: f.cert, ref: f.ref, standard: f.standard, address: f.address, claim: f.claim })),
  c_addresses: Object.fromEntries(Object.entries(byStdC).map(([k, v]) => [k, [...v].sort()])),
}, null, 2), "utf8");
console.log("");
console.log("wrote MISSING-ADDRESS-TRIAGE.json");
