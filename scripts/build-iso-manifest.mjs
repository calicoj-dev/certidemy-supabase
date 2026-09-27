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
    why: "PREVIEW ONLY: cover, scope and contents, not the requirements. It is also a Singapore Standard adoption rather than the ISO document. Indexing it would make 42006 read as covered while holding none of its text. SUPERSEDED as a coverage gap 2026-09-26: the full BS ISO/IEC 42006:2025 is now held and indexed. This extract stays excluded -- two editions of one standard in the index would attribute a run to whichever matched first.",
  },

  /* ============ THE SOURCES JUAN SUPPLIED, IN THE SAME MANIFEST ============
   *
   * They live in a DIFFERENT directory and are otherwise identical in kind: licensed or public
   * text we index, whose bytes must be pinned. A second manifest would be a second copy of one
   * fact, and the first thing a second copy does is disagree with the first.
   *
   * Bibliographic facts transcribed from each title page, like every entry above.
   *
   * THE TWO BS ADOPTIONS ARE THE UK IMPLEMENTATIONS and the editions are pinned to exactly what
   * the director named: 42006:2025 (not the DIS draft, which is superseded) and 17021-1:2015 (not
   * part 3, which nothing cites). */
  "OJ_L_202401689_EN_TXT.pdf": {
    dir: "incoming",
    standard: "Regulation (EU) 2024/1689",
    title: "Laying down harmonised rules on artificial intelligence (Artificial Intelligence Act)",
    edition: "OJ L series, 2024/1689", date: "2024-07-12", key: "euact:2024/1689", indexed: true,
    note: "Public law. Kept under the same file convention as the licensed sources so one loader reads all of them.",
  },
  "NIST.AI.100-1.pdf": {
    dir: "incoming",
    standard: "NIST AI 100-1",
    title: "Artificial Intelligence Risk Management Framework (AI RMF 1.0)",
    edition: "1.0", date: "2023-01", key: "nist-ai-rmf:1.0", indexed: true,
    note: "Public, free of charge. VOLUNTARY guidance: the extractor caps its passages at 'should' so no item can assert a requirement on its authority.",
  },
  "Evidence Based Management Guide 2024.pdf": {
    dir: "incoming",
    standard: "Evidence-Based Management Guide",
    title: "Improving Value Delivery under Conditions of Uncertainty",
    edition: "May 2024", date: "2024-05", key: "ebm:2024", indexed: true,
    note: "Scrum.org, Attribution Share-Alike licence. Informative throughout; it defines no requirement.",
  },
  "(ITIL) Axelos - ITIL Foundation 4 edition-Axelos (2019)[1].pdf": {
    dir: "incoming",
    standard: "ITIL Foundation: ITIL 4 Edition",
    title: "ITIL Foundation, ITIL 4 Edition",
    edition: "ITIL 4 Edition", date: "2019", key: "itil4:2019", indexed: true,
    note: "AXELOS Limited 2019, licensed. Prints a bare page number against every page break and no running header, which is why the extractor identifies its page numbers by the form feed beside them.",
  },
  "1010556932-BS-ISO-IEC-42006-2025-Information-Technology-Artificial-Intelligence.pdf": {
    dir: "incoming",
    standard: "BS ISO/IEC 42006:2025",
    title: "Information technology - Artificial intelligence - Requirements for bodies providing audit and certification of artificial intelligence management systems",
    edition: "UK implementation of ISO/IEC 42006:2025", date: "2025", key: "42006:2025", indexed: true,
    note: "The full requirements document, superseding the preview extract above as a coverage gap. BSI national foreword and cover are furniture and are stripped; the extractor asserts the body begins at ISO clause 1.",
  },
  "BSI-EN-ISO-IEC-17021-1-2015.pdf": {
    dir: "incoming",
    standard: "BS EN ISO/IEC 17021-1:2015",
    title: "Conformity assessment - Requirements for bodies providing audit and certification of management systems - Part 1: Requirements",
    edition: "UK implementation of EN ISO/IEC 17021-1:2015", date: "2015", key: "17021-1:2015", indexed: true,
    note: "Part 1 only. Part 3 is a different part and nothing cites it. Title page bears a third-party reseller watermark, recorded here for the same reason the watermarks above are.",
  },

  /* ============ THREE SUPPLIED 2026-09-26 AND NONE OF THEM LOADABLE ============
   *
   * They are in the manifest because the both-directions check demands it -- a PDF on disk with no
   * facts would be silently skipped, and this file refuses to build rather than describe a
   * directory it cannot account for. They are `indexed: false` for two different reasons, and the
   * second one is not the reason anybody expected.
   *
   * TWO ARE SCANS. Measured before anything else was attempted, which is the order the director
   * asked for: 23894 is 34 pages carrying 34 JPEG images and 38507 is 36 pages with ZERO embedded
   * fonts. `pdftotext` returns nothing from either. Not OCR'd -- an OCR of a licensed standard
   * would put a TRANSCRIPTION of the text in a library the gates quote from as the standard, and a
   * verbatim gate cannot tell a transcription error from a model's invention.
   *
   * THE THIRD IS NOT A SCAN AND IS WORSE. `ISO-42005.pdf` is `ISO/IEC FDIS 42005` -- a Final DRAFT,
   * with "Voting terminates on 2025-04-16" on its cover -- supplied as a PARTIAL iTeh Standards
   * preview that stops inside clause 5.7. Three standing rulings already cover it:
   *
   *   a DRAFT      the 42006 DIS was refused for being superseded. An FDIS is the same class, and
   *                the published ISO/IEC 42005:2025 exists.
   *   a PREVIEW    the 42006 preview extract is excluded because indexing it would make the
   *                standard read as covered while holding almost none of its text. 12 pages.
   *   CORRUPTED    the reseller watermark is interleaved INTO the body, mid-word:
   *                  "5.1.3 External factors in(clhudet:tps://standards.iteh.ai)"
   *                That is the licence-watermark defect this repository already records against
   *                27001's headings, except it lands inside sentences rather than beside them -- so
   *                a verbatim anchor drawn from here could be unmatchable, or match the wrong
   *                words, for a reason nobody reading the item would see.
   *
   * Reported for the director rather than decided: 42005 is cited by 3 live AIGRM-I items and is
   * worth buying. The PUBLISHED edition would be indexed the day it arrives. */
  "Iso-iec-23894-2023.pdf": {
    dir: "incoming", standard: "ISO/IEC 23894:2023",
    title: "Information technology - Artificial intelligence - Guidance on risk management",
    edition: "First edition", date: "2023-02", key: "23894:2023-SCAN", indexed: false,
    why: "NO TEXT LAYER: 34 pages, 34 JPEG images, pdftotext returns zero words. A scan. NOT OCR'd -- an OCR is a transcription, and a verbatim gate cannot tell a transcription error from an invention. Cited by 7 live AIGRM-I items; a text edition is worth buying.",
  },
  "ISO-38507-2022.pdf": {
    dir: "incoming", standard: "ISO/IEC 38507:2022",
    title: "Information technology - Governance of IT - Governance implications of the use of artificial intelligence by organizations",
    edition: "First edition", date: "2022-04", key: "38507:2022-SCAN", indexed: false,
    why: "NO TEXT LAYER: 36 pages, zero embedded fonts, pdftotext returns zero words. A scan, and a second one nobody expected. Not OCR'd, same reason as 23894. Cited by 7 live AIGRM-I items.",
  },
  "ISO-42005.pdf": {
    dir: "incoming", standard: "ISO/IEC FDIS 42005 (FINAL DRAFT, partial preview)",
    title: "Information technology - Artificial intelligence - AI system impact assessment",
    edition: "FDIS draft, voting terminated 2025-04-16", date: "2025", key: "42005:2025-FDIS-PREVIEW",
    indexed: false,
    why: "THREE REASONS, ANY ONE SUFFICIENT: it is a DRAFT (the 42006 DIS was refused as superseded and the published 42005:2025 exists); it is a PARTIAL preview of 12 pages stopping inside clause 5.7 (the same exclusion as the 42006 preview extract); and the iTeh reseller watermark is spliced INTO the body text mid-word, so a verbatim anchor from it could be unmatchable or wrong. Cited by 3 live AIGRM-I items. The PUBLISHED edition would be indexed on arrival.",
  },

  /* ============ PARALLEL TEXT: IN THE MANIFEST, OUT OF THE LEAK INDEX ============
   *
   * These are the official ES and PT editions of two sources above. They are in the manifest
   * because their bytes must be pinned like anything else we read, and `indexed: false` because
   * THE LEAK INDEX IS ENGLISH-ONLY BY CONSTRUCTION and making it multilingual is a
   * re-calibration, not a corpus addition: this repository records that widening an index changes
   * its error modes, and the same widening would put every Spanish and Portuguese lesson body in
   * scope of a gate that has never scored one. That is a measured decision with its own before and
   * after, and it is named as an open gap rather than taken here. */
  "OJ_L_202401689_ES_TXT.pdf": {
    dir: "incoming", standard: "Regulation (EU) 2024/1689 (ES)",
    title: "Artificial Intelligence Act, Spanish edition", edition: "OJ L series", date: "2024-07-12",
    key: "euact:2024/1689:es", indexed: false,
    why: "Parallel text, not a source. Aligned to the English passage ids for terminology. SPAIN Spanish: a reference for es-419, never a mandate.",
  },
  "OJ_L_202401689_PT_TXT.pdf": {
    dir: "incoming", standard: "Regulation (EU) 2024/1689 (PT)",
    title: "Artificial Intelligence Act, Portuguese edition", edition: "OJ L series", date: "2024-07-12",
    key: "euact:2024/1689:pt", indexed: false,
    why: "Parallel text, not a source. Aligned to the English passage ids for terminology.",
  },
  "2024-EBM-Guide-Spanish-European.pdf": {
    dir: "incoming", standard: "Evidence-Based Management Guide (ES)",
    title: "EBM Guide, European Spanish edition", edition: "2024", date: "2024",
    key: "ebm:2024:es", indexed: false,
    why: "Parallel text. NOT ALIGNED: the guide has no numbering, so its ids are English headings and the translated heading count disagrees. Reported unaligned rather than matched by position.",
  },
  "2024-EBM-Guide-Portuguese-Brazillian_0.pdf": {
    dir: "incoming", standard: "Evidence-Based Management Guide (PT-BR)",
    title: "EBM Guide, Brazilian Portuguese edition", edition: "2024", date: "2024",
    key: "ebm:2024:pt", indexed: false,
    why: "Parallel text. NOT ALIGNED, same reason as the Spanish edition.",
  },
};

function pdfText(p, args = []) {
  const o = join(mkdtempSync(join(tmpdir(), "iso-")), "t.txt");
  execFileSync("pdftotext", [...args, "-layout", p, o]);
  return readFileSync(o, "utf8");
}

/* ============ TWO DIRECTORIES, ONE MANIFEST, AND THE ASSERTION STILL RUNS BOTH WAYS ============
 *
 * The licensed ISO corpus lives outside the repository; the sources Juan supplied live in
 * `sources/incoming`. Each FACTS entry names its directory, so the both-directions check below is
 * per directory: a PDF in `incoming` with no facts is as much a defect as one in the ISO corpus,
 * and the check that catches it is the same check. A second builder for the second directory would
 * have been the obvious move and it is how the two would drift. */
const DIRS = {
  corpus: DIR,
  incoming: join(HERE, "..", "sources", "incoming"),
};
for (const [name, d] of Object.entries(DIRS)) {
  if (!existsSync(d)) { console.error("directory not found (" + name + "): " + d); process.exit(2); }
}
const dirOf = (f) => DIRS[FACTS[f] && FACTS[f].dir === "incoming" ? "incoming" : "corpus"];

const files = [];
for (const [name, d] of Object.entries(DIRS)) {
  for (const f of readdirSync(d).filter((x) => x.toLowerCase().endsWith(".pdf"))) {
    const want = FACTS[f] ? (FACTS[f].dir === "incoming" ? "incoming" : "corpus") : name;
    /* A file found in a directory its facts do not name is a MOVED source, which must fail rather
     * than be hashed from wherever it turned up. */
    if (FACTS[f] && want !== name) {
      console.error("");
      console.error(f + " is in " + name + " but its manifest facts say " + want + ".");
      console.error("Refusing: a manifest that does not say where a source is cannot be checked.");
      process.exit(1);
    }
    files.push(f);
  }
}
files.sort();

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
  const p = join(dirOf(f), f);
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
  what: "The sources the leak scanners index. Most are licensed per seat and gitignored; this manifest is the committed, auditable record of what they are.",
  corpus_dirs: ["../iso-corpus (gitignored)", "sources/incoming (gitignored)"],
  built: new Date().toISOString().slice(0, 10),
  counts: { files: entries.length, indexed: indexed.length, excluded: excluded.length },
  open_coverage_gaps: [
    /* THE 42006 GAP IS CLOSED AND THE LINE IS REWRITTEN RATHER THAN MARKED. This list is read as a
     * statement about the present -- it is what tells someone whether a standard is worth buying --
     * so a closed gap left in it argues against buying something already owned. That exact defect
     * is recorded in CLAUDE.md against this very file. */
    "MONOLINGUAL, AND NARROWER THAN IT WAS: every INDEXED entry is an English edition, so a Spanish or Portuguese rendering of a defined term still scores 0. The official ES and PT editions of the AI Act are now HELD (as parallel text, indexed: false) so the gap is closeable for that source by a measured re-calibration; it is not closed, because widening this index changes its error modes and would put every translated lesson body in scope of a gate that has never scored one.",
    "EDITION VARIANCE: near-wording from a different edition of an indexed standard is out of reach of any n-gram threshold. For a DEFINED TERM the anti-gloss rule is the defence, not this index. The 42006 preview extract is deliberately still excluded now the full BS adoption is indexed -- two editions of one standard would attribute a run to whichever matched first.",
    "THE CITATION INDEX IS STILL THREE STANDARDS. Six sources were added to the LEAK index and CITATION_SOURCES is unchanged, deliberately: widening it would make addresses that verify-cert flags today resolve, on every certification, which is a content decision rather than a corpus one.",
    "EU AI ACT ANNEX POINTS, NAMED NOT COUNTED: 13 English annex points have no Spanish row and 2 have no Portuguese row (Annex X 3-4, Annex XII 1-2 and their letters in ES; Annex XI 1(d) and Annex XII 1(f) in PT). Article structure is identical in all three languages.",
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
