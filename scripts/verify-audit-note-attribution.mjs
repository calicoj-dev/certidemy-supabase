/**
 * verify-audit-note-attribution.mjs -- does ISO 19011:2026 clause 3.1 carry the
 * note that `isms-ia-01-01-audit-parties` credits to it?
 *
 * READ-ONLY, offline, no credential. Unknown flags exit 2.
 *
 * ============ THE CLAIM UNDER TEST ============
 *
 * The live English of `isms-ia-01-01-audit-parties` reads:
 *
 *   "ISO 19011:2026 clause 3.1 defines audit, and a note there allows an
 *    internal audit to be run in-house or handed to an outside party engaged to
 *    carry it out."
 *
 * `apply-audit-sentence-rewrite.mjs` declared that same sentence with
 * "ISO/IEC 27000:2018" in place of "ISO 19011:2026 clause 3.1", on the stated
 * ground that 19011 "contains neither half of it". That script's `to` is absent
 * from the live English, so the attribution half never landed.
 *
 * ============ A NEGATIVE CLAIM CARRIES A POSITIVE CONTROL ============
 *
 * "19011 does not say this" can only be verified by FAILING to find it, and
 * failing to find things is exactly what a broken search does. So each negative
 * is paired with a phrase from the SAME document that MUST be found. If a
 * control fails, the absence result is DISCARDED rather than reported.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { PDFS } from "./lib/citation-index.mjs";

for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY, takes none");
  process.exitCode = 2; process.exit();
}

function text(p) {
  if (!existsSync(p)) return null;
  try { return execFileSync("pdftotext", ["-q", "-enc", "UTF-8", p, "-"], { encoding: "utf8", maxBuffer: 1 << 28 }); }
  catch { return null; }
}
const norm = (s) => String(s || "").toLowerCase().replace(/[‐-―]/g, "-").replace(/\s+/g, " ");

const docs = {};
for (const k of ["19011:2026", "27000:2018", "42001:2023", "27001:2022"]) {
  const t = text(PDFS[k]);
  docs[k] = t === null ? null : norm(t);
}

/* Positive controls: a phrase that MUST be in each document. Without these, an
 * absence is a fact about pdftotext. */
/* Each phrase is verified CONTIGUOUS in the extraction. The first draft used
 * "artificial intelligence management system" for 42001 and the control FAILED --
 * correctly, and not because the PDF is unreadable: the title reads "artificial
 * intelligence — management system" with an em dash, which `norm` maps to a
 * hyphen, so the phrase does not occur. A control phrase is itself a claim about
 * the document and has to be checked like one. */
const CONTROLS = {
  "19011:2026": "auditing management systems",
  "27000:2018": "information security management systems",
  "42001:2023": "ai management system",
  "27001:2022": "information security management systems",
};
const dead = [];
for (const [k, needle] of Object.entries(CONTROLS)) {
  if (docs[k] === null) { dead.push(k + ": PDF unreadable"); continue; }
  if (!docs[k].includes(norm(needle))) dead.push(k + ": control phrase not found");
}
if (dead.length) {
  console.error("CONTROLS FAILED -- no absence reported, because a search that cannot find");
  console.error("what IS there says nothing about what is not:");
  for (const d of dead) console.error("  " + d);
  process.exitCode = 2; process.exit();
}

/* The probes. Each is a fragment of the contested note. */
const PROBES = [
  ["the full reproduced sentence",
   "an internal audit is conducted by the organization itself or by an external party on its behalf"],
  ["the distinctive tail", "or by an external party on its behalf"],
  ["the distinctive head", "conducted by the organization itself"],
  ["the phrase our lesson uses", "engaged to carry it out"],
];

console.log("WHO CARRIES THE AUDIT NOTE?  read-only, offline");
console.log("  positive control found in all " + Object.keys(CONTROLS).length + " documents");
console.log("");
const W = 34;
console.log("  " + "probe".padEnd(W) + Object.keys(docs).map((k) => k.padEnd(14)).join(""));
for (const [label, needle] of PROBES) {
  const row = Object.keys(docs).map((k) => (docs[k].includes(norm(needle)) ? "FOUND" : "-").padEnd(14));
  console.log("  " + label.padEnd(W) + row.join(""));
}

/* Does 19011 define `audit` at clause 3.1 at all? That is the half of the live
 * sentence that may well be right, and conflating the two would be the compound
 * -claim defect: one measured half making an assumed half read as measured. */
console.log("");
const d19011 = docs["19011:2026"];
const at31 = d19011.indexOf("3.1 audit");
console.log("  19011:2026 contains \"3.1 audit\": " + (at31 >= 0 ? "YES at offset " + at31 : "NO"));
if (at31 >= 0) {
  console.log("  the 320 characters following it:");
  console.log("      " + d19011.slice(at31, at31 + 320).replace(/\s+/g, " "));
}
const at27 = docs["27000:2018"].indexOf("audit systematic");
console.log("");
console.log("  27000:2018 \"audit systematic...\" at: " + (at27 >= 0 ? at27 : "not found"));
if (at27 >= 0) console.log("      " + docs["27000:2018"].slice(at27, at27 + 420).replace(/\s+/g, " "));
