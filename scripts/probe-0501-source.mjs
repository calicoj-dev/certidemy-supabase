/**
 * probe-0501-source.mjs -- what does ISO/IEC 42001:2023 actually say where
 * `05-01-aims-monitoring-and-measurement` reproduces it?
 *
 * READ-ONLY, offline. Unknown flags exit 2. A draft written against a memory of
 * the clause is a draft that reproduces it again.
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

/* Positive control first: an absence below means something only if the document
 * is readable and is the one we think it is. */
if (!n.includes("ai management system")) {
  console.error("CONTROL FAILED: 42001 extraction does not contain `ai management system`.");
  process.exitCode = 2; process.exit();
}
console.log("42001:2023 readable, " + n.length + " chars, control phrase found");
console.log("");

const PROBES = [
  "the performance of non-ai systems or processes",
  "performance of non-ai systems",
  "non-ai systems or processes",
  "used for purposes other than those",
  "purposes other than those they were designed for",
  "whether those uses are appropriate",
  "should be considered",
];
for (const p of PROBES) {
  const i = n.indexOf(p);
  console.log((i >= 0 ? "FOUND  " : "-      ") + JSON.stringify(p));
  if (i >= 0) console.log("        ..." + n.slice(Math.max(0, i - 260), i + 260) + "...");
  console.log("");
}
