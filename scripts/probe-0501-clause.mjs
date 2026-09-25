/**
 * probe-0501-clause.mjs -- which Annex B clause of ISO/IEC 42001:2023 carries
 * each reproduced passage? A draft that names the wrong clause replaces a
 * reproduction with a misattribution.
 *
 * READ-ONLY, offline. Unknown flags exit 2.
 */
import { execFileSync } from "node:child_process";
import { PDFS } from "./lib/citation-index.mjs";

for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY, takes none");
  process.exitCode = 2; process.exit();
}

const raw = execFileSync("pdftotext", ["-q", "-enc", "UTF-8", PDFS["42001:2023"], "-"],
  { encoding: "utf8", maxBuffer: 268435456 });
const n = raw.toLowerCase().replace(/\s+/g, " ");
if (!n.includes("ai management system")) { console.error("CONTROL FAILED"); process.exitCode = 2; process.exit(); }

/** The nearest preceding `B.x.y.z <title>` heading before an offset. */
function precedingHeading(at) {
  const re = /\bb\.(\d+(?:\.\d+)*)\s+([a-z][a-z ,\-/()]{4,70})/g;
  let best = null, m;
  while ((m = re.exec(n)) !== null) {
    if (m.index > at) break;
    best = { num: "B." + m[1], title: m[2].trim(), at: m.index };
  }
  return best;
}
/** Same, for a main-body or annex-A clause number. */
function precedingAny(at) {
  const re = /\b(a\.\d+(?:\.\d+)*|\d+\.\d+(?:\.\d+)*)\s+([a-z][a-z ,\-/()]{4,70})/g;
  let best = null, m;
  while ((m = re.exec(n)) !== null) {
    if (m.index > at) break;
    best = { num: m[1].toUpperCase(), title: m[2].trim(), at: m.index };
  }
  return best;
}

const SPANS = [
  ["span 1, the 12-word run", "the organization should consider the performance of non-ai systems or processes"],
  ["span 2, the 9-word run", "used for purposes other than those"],
];
for (const [label, needle] of SPANS) {
  const at = n.indexOf(needle);
  console.log("=== " + label);
  if (at < 0) { console.log("    NOT FOUND -- cannot attribute"); continue; }
  const b = precedingHeading(at), a = precedingAny(at);
  console.log("    offset            " + at);
  console.log("    nearest B heading " + (b ? b.num + "  " + b.title + "   (" + (at - b.at) + " chars before)" : "none"));
  console.log("    nearest any       " + (a ? a.num + "  " + a.title + "   (" + (at - a.at) + " chars before)" : "none"));
  console.log("    source sentence:");
  const s = n.slice(at - 120, at + 220);
  console.log("        ..." + s + "...");
  console.log("");
}
