// scripts/pdf-to-text.mjs
//
// One-time conversion of calibration fixtures from PDF to text.
//
//   npm i pdf-parse            (v2.x -- the API changed, see below)
//   node scripts/pdf-to-text.mjs
//   node scripts/pdf-to-text.mjs --force        # re-convert existing .txt
//
// WHY A SEPARATE STEP RATHER THAN PARSING IN THE HARNESS
//
//   1. The engine never sees the PDF. Hashing PDF bytes would hash something
//      the analysis does not read; hashing the extracted text records exactly
//      what was analysed, which is what source_content_hash is for.
//   2. Extraction is slow and non-deterministic across library versions.
//      Freezing it into a .txt means a calibration regression is attributable
//      to the ENGINE, not to a silent pdf-parse upgrade.
//   3. The harness stays dependency-free.
//
// pdf-parse v2 is a class, not a function -- `require('pdf-parse')(buf)` is the
// v1 API and does not exist any more. It also appends "-- N of M --" page
// markers to the text, which must be stripped or they inflate word counts and
// can create phantom matches.

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, "..", "..", "fixtures", "calibration");
const force = process.argv.includes("--force");

if (!existsSync(FIXTURES)) {
  console.error(`fixtures directory not found: ${FIXTURES}`);
  process.exit(1);
}

/** pdf-parse v2 page markers. Never part of the source document. */
const PAGE_MARKER = /^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/gm;

const pdfs = readdirSync(FIXTURES).filter((f) => f.toLowerCase().endsWith(".pdf"));
if (pdfs.length === 0) {
  console.log("no PDFs found -- nothing to convert");
  process.exit(0);
}

let converted = 0;
let skipped = 0;

for (const file of pdfs) {
  const out = join(FIXTURES, basename(file, ".pdf") + ".txt");

  if (existsSync(out) && !force) {
    console.log(`skip     ${file}  (.txt exists; --force to redo)`);
    skipped++;
    continue;
  }

  let parser;
  try {
    parser = new PDFParse({ data: new Uint8Array(readFileSync(join(FIXTURES, file))) });
    const res = await parser.getText();

    const text = (res.text ?? "").replace(PAGE_MARKER, "").replace(/\n{3,}/g, "\n\n").trim();

    if (text.length === 0) {
      // A scanned PDF with no text layer. Converting it to an empty .txt would
      // present as a legitimately thin document to the density guard, which is
      // a false finding about the source rather than about our extraction.
      console.log(`FAILED   ${file}  -- no text layer (scanned image? needs OCR)`);
      continue;
    }

    writeFileSync(out, text, "utf8");
    const hash = createHash("sha256").update(text, "utf8").digest("hex");
    const words = text.split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
    console.log(
      `wrote    ${basename(out).padEnd(56)} ${String(res.total ?? "?").padStart(3)}pp ` +
        `${String(words).padStart(6)}w  sha256 ${hash.slice(0, 16)}`,
    );
    converted++;
  } catch (err) {
    console.log(`FAILED   ${file}  -- ${(err && err.message) || err}`);
  } finally {
    if (parser) await parser.destroy().catch(() => {});
  }
}

console.log(`\nconverted ${converted}, skipped ${skipped}, of ${pdfs.length} PDFs`);
console.log("Note: .txt fixtures are gitignored along with the PDFs. Do not commit them.");
