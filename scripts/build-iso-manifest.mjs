#!/usr/bin/env node
/**
 * build-iso-manifest.mjs - write iso-corpus-manifest.json from the PDFs in
 * ../iso-corpus, recording what the leak index contains WITHOUT recording any
 * of its content.
 *
 * WRITES ONE FILE. `--apply`; dry by default. Unknown flags exit 2.
 *
 * ============ WHY A MANIFEST AND NOT THE PDFS ============
 *
 * Every one of these is licensed per seat and says "copying and networking
 * prohibited" on its own pages. `iso-corpus/` is gitignored for that reason,
 * and the only PDF this repository tracks is reference/scrum-guide-2020.pdf,
 * which is CC BY-SA 4.0.
 *
 * That leaves a gap the manifest exists to close: a leak verdict is only
 * meaningful if you can say what it was measured against, and the thing it was
 * measured against cannot be committed. So the manifest commits the
 * DESCRIPTION -- standard number, title, edition, date, SHA-256, page count --
 * which is reproducible, auditable, and reproduces nothing.
 *
 * Bibliographic metadata is read FROM THE TITLE PAGE, never from the filename.
 * A filename is a claim someone typed; the title page is the document saying
 * what it is. `iso42001.pdf` carried no edition and no date at all.
 *
 * ============ INDEXED IS A FIELD, NOT AN ASSUMPTION ============
 *
 * `indexed: false` carries a REASON and the scanners must honour it.
 * iso-iec-42006-PREVIEW-ONLY.pdf is cover, scope and contents only -- and it is
 * additionally a SINGAPORE STANDARD adoption (SS ISO/IEC 42006:2025, IDT)
 * rather than the ISO document. Either fact alone disqualifies it. A preview
 * indexed by accident would make 42006 look covered while holding none of its
 * requirements, which is the silent-success shape this repository is about.
 *
 * ============ THE SHA IS THE PER-SOURCE POSITIVE CONTROL ============
 *
 * scan-iso-leaks carries three hand-typed canary sentences, justified as short
 * test fixtures. Adding six more would mean committing six more verbatim
 * excerpts of licensed text, which is the thing the gitignore exists to
 * prevent. So the control for every source is its SHA-256 against this
 * manifest plus a gram-count floor: a missing, truncated or swapped PDF fails
 * before any verdict is produced, and no content is reproduced to achieve it.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdtempSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--apply", "--dir", "--out"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ".");
    console.error("This is the --apply family: dry by default. Known: --apply, --dir, --out.");
    process.exit(2);
  }
}
const argOf = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const APPLY = process.argv.includes("--apply");

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = argOf("dir", join(HERE, "..", "..", "iso-corpus"));
const OUT = argOf("out", join(HERE, "..", "iso-corpus-manifest.json"));

if (!existsSync(DIR)) { console.error("corpus directory not found: " + DIR); process.exit(2); }

/* Bibliographic facts read from each title page, transcribed here so the
 * parse is reviewable rather than a regex nobody can check. `indexed: false`
 * always carries a `why`. */
const FACTS = {
  "iso-19011-2026.pdf": {
    standard: "ISO 19011:2026", title: "Guidelines for auditing management systems",
    edition: "Fourth edition", date: "2026-05", key: "19011:2026", indexed: true,
  },
  "iso-iec-22989-2022.pdf": {
    standard: "ISO/IEC 22989:2022",
    title: "Information technology - Artificial intelligence - Artificial intelligence concepts and terminology",
    edition: "First edition", date: "2022-07", key: "22989:2022", indexed: true,
    note: "Title page bears a single-user licence naming a third party, not this seat.",
  },
  "iso-iec-27000-2018.pdf": {
    standard: "ISO/IEC 27000:2018",
    title: "Information technology - Security techniques - Information security management systems - Overview and vocabulary",
    edition: "Fifth edition", date: "2018-02", key: "27000:2018", indexed: true,
    note: "The undated normative reference from ISO/IEC 27001:2022 clause 2.",
  },
  "iso-iec-27001-2022.pdf": {
    standard: "ISO/IEC 27001:2022",
    title: "Information security, cybersecurity and privacy protection - Information security management systems - Requirements",
    edition: "Third edition", date: "2022-10", key: "27001:2022", indexed: true,
  },
  "iso-iec-27001-2022-amd1-2024.pdf": {
    standard: "ISO/IEC 27001:2022/Amd 1:2024",
    title: "Information security management systems - Requirements - AMENDMENT 1: Climate action changes",
    edition: "Amendment 1 to the third edition", date: "2024-02", key: "27001:2022/Amd1", indexed: true,
  },
  "iso-iec-27002-2022.pdf": {
    standard: "ISO/IEC 27002:2022",
    title: "Information security, cybersecurity and privacy protection - Information security controls",
    edition: "Third edition", date: "2022-02", key: "27002:2022", indexed: true,
  },
  "iso-iec-27004-2016.pdf": {
    standard: "ISO/IEC 27004:2016",
    title: "Information technology - Security techniques - Information security management - Monitoring, measurement, analysis and evaluation",
    edition: "Second edition", date: "2016-12-15", key: "27004:2016", indexed: true,
    note: "Title page bears a university library watermark, not a single-seat purchase.",
  },
  "iso-iec-27005-2022.pdf": {
    standard: "ISO/IEC 27005:2022",
    title: "Information security, cybersecurity and privacy protection - Guidance on managing information security risks",
    edition: "Fourth edition", date: "2022-10", key: "27005:2022", indexed: true,
  },
  "iso-iec-42001-2023.pdf": {
    standard: "ISO/IEC 42001:2023",
    title: "Information technology - Artificial intelligence - Management system",
    edition: "First edition", date: "2023-12", key: "42001:2023", indexed: true,
  },
  "iso-iec-42006-PREVIEW-ONLY.pdf": {
    standard: "SS ISO/IEC 42006:2025 (Singapore Standard, identical adoption)",
    title: "Information technology - Artificial intelligence - Requirements for bodies providing audit and certification of artificial intelligence management systems",
    edition: "Preview extract", date: "2025", key: "42006:2025-PREVIEW", indexed: false,
    why: "PREVIEW ONLY: cover, scope and contents, not the requirements. It is also a Singapore Standard adoption rather than the ISO document. Indexing it would make 42006 read as covered while holding none of its text.",
  },
};

function pdfText(p, args = []) {
  const o = join(mkdtempSync(join(tmpdir(), "iso-")), "t.txt");
  execFileSync("pdftotext", [...args, "-layout", p, o]);
  return readFileSync(o, "utf8");
}

const files = readdirSync(DIR).filter((f) => f.toLowerCase().endsWith(".pdf")).sort();

/* BOTH DIRECTIONS. A file on disk with no FACTS entry would be silently
 * skipped; a FACTS entry with no file would silently claim coverage. */
const unknown = files.filter((f) => !FACTS[f]);
const absent = Object.keys(FACTS).filter((f) => !files.includes(f));
if (unknown.length || absent.length) {
  console.error("");
  if (unknown.length) console.error("PDF(s) on disk with no manifest facts: " + unknown.join(", "));
  if (absent.length) console.error("Manifest facts with no PDF on disk: " + absent.join(", "));
  console.error("Refusing: a manifest that does not describe the directory is worse than none.");
  process.exit(1);
}

const entries = [];
for (const f of files) {
  const p = join(DIR, f);
  const buf = readFileSync(p);
  const sha = createHash("sha256").update(buf).digest("hex");
  const full = pdfText(p);
  /* pdftotext separates pages with a form feed. Counting them is a page count
   * without a second binary; pdfinfo is not on PATH here. */
  const pages = (full.match(/\f/g) || []).length;
  const words = full.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean).length;
  entries.push({ file: f, ...FACTS[f], sha256: sha, bytes: buf.length, pages, extracted_words: words });
  console.log("  " + (FACTS[f].indexed ? "INDEX " : "EXCL  ") + f.padEnd(34) +
    String(pages).padStart(4) + "p " + String(words).padStart(7) + "w  " + sha.slice(0, 16));
}

const indexed = entries.filter((e) => e.indexed);
const excluded = entries.filter((e) => !e.indexed);

/* ============ THE FLOOR IS PER PAGE, NOT PER DOCUMENT ============
 *
 * An indexed entry that extracted almost nothing is a broken source wearing a
 * manifest row: it widens no index while appearing to.
 *
 * THE FIRST VERSION OF THIS GUARD USED A FLAT 1000-WORD FLOOR AND FIRED ON A
 * HEALTHY FILE. ISO/IEC 27001:2022/Amd 1:2024 is SIX PAGES and 903 words,
 * because an amendment is short -- there was nothing wrong with the extraction
 * and the guard was asserting a document size nobody had agreed to. A flat
 * floor encodes an assumption about length into a check about extraction.
 *
 * Words per page separates the two: a broken extraction collapses toward zero
 * whatever the page count, and a legitimately short document does not. Measured
 * across all ten files the ratio runs 150 to 370, so 50 is a floor with real
 * headroom rather than one tuned to scrape past today's numbers.
 */
const MIN_WORDS_PER_PAGE = 50;
const thin = indexed.filter((e) => !e.pages || e.extracted_words / e.pages < MIN_WORDS_PER_PAGE);
if (thin.length) {
  console.error("");
  for (const e of thin) {
    console.error("  THIN  " + e.file + "  " + e.extracted_words + "w over " + e.pages +
      "p = " + (e.pages ? (e.extracted_words / e.pages).toFixed(0) : "0") + " w/page, floor " + MIN_WORDS_PER_PAGE);
  }
  console.error("Refusing: an empty index matches nothing and marks everything clean.");
  process.exit(1);
}

const manifest = {
  what: "The ISO corpus the leak scanners index. The PDFs are licensed per seat and gitignored; this manifest is the committed, auditable record of what they are.",
  corpus_dir: "../iso-corpus (gitignored)",
  built: new Date().toISOString().slice(0, 10),
  counts: { files: entries.length, indexed: indexed.length, excluded: excluded.length },
  open_coverage_gaps: [
    "MONOLINGUAL: every entry is an English edition, so a Spanish or Portuguese rendering of a defined term scores 0 and always has. 3,460 translated concept rows and every translated lesson body sit outside any leak instrument.",
    "ISO/IEC 42006: held as a preview extract only, and as a Singapore Standard adoption. Not indexed and must not be reported as covered.",
    "EDITION VARIANCE: near-wording from a different edition of an indexed standard is out of reach of any n-gram threshold. For a DEFINED TERM the anti-gloss rule is the defence, not this index.",
  ],
  entries,
};

console.log("");
console.log("  " + indexed.length + " indexed, " + excluded.length + " excluded");
for (const e of excluded) console.log("  EXCLUDED  " + e.standard + "  --  " + e.why);

if (!APPLY) {
  console.log("");
  console.log("Dry run. Nothing written. Re-run with --apply.");
} else {
  writeFileSync(OUT, JSON.stringify(manifest, null, 2), "utf8");
  console.log("");
  console.log("wrote " + OUT);
}
