#!/usr/bin/env node
/**
 * find-ocr-missing-page.mjs -- name the page ISO 38507's scan is missing.
 *
 * READ-ONLY. No `--apply`, no database, no network. Unknown flags exit 2.
 *
 * ============ THE PAGE NUMBER IS IDENTIFIED BY ITS FOOTER, NOT BY BEING A NUMBER ============
 *
 * This repository already records that stripping bare numeric lines on sight eats the contents
 * numbering. ISO prints a running footer -- `© ISO/IEC 2022 - All rights reserved  <n>` on one side
 * and `<n>  © ISO/IEC 2022 - All rights reserved` on the other -- so the page number is identified by
 * the text beside it, and the sequence of those numbers is what a missing page interrupts.
 *
 * ============ AND A GAP IN THE FOOTERS IS NOT YET A MISSING PAGE ============
 *
 * Three things produce a number the footer sequence does not carry, and only one is a missing page:
 *
 *   the OCR failed to read a footer that IS there  -> the page's BODY text is present
 *   a page legitimately carries no footer          -> front matter, part titles
 *   the page was never scanned                     -> the body is missing too
 *
 * So a candidate gap is confirmed against the CONTENTS: if the contents list places a clause on that
 * page and the body carries no heading for it, the page is absent. Reporting a footer gap alone would
 * send Juan to re-scan a page that is already there, which is exactly what this is supposed to avoid.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". This script is READ-ONLY and takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DIR = join(ROOT, "sources", "incoming", "ocr");
if (!existsSync(DIR)) { console.error("not found: " + DIR); process.exit(2); }

const files = readdirSync(DIR).filter((f) => /-tesseract\.txt$/i.test(f));
if (!files.length) { console.error("no -tesseract.txt in " + DIR); process.exit(2); }

/* Both footer orientations, and the number is captured from whichever side it sits on. Built from
 * strings so no escape in this file crosses a shell. */
/* ============ THE ROMAN FRONT MATTER IS OCR'd AS ARABIC, AND IT FAKED 92 GAPS ============
 *
 * ISO numbers its front matter in lower-case roman, and tesseract reads those as digits:
 *
 *     11 (c) ISO/IEC 2023 - All rights reserved        <- page ii
 *     (c) ISO/IEC 2023 - All rights reserved 111       <- page iii
 *     Vv (c) ...                                       <- page v
 *
 * Taken as arabic, `111` made ISO/IEC 23894's page range run to 111 and produced NINETY-TWO gaps in a
 * document with 19 readable footers. Every one was an artefact of my own extractor, and the report
 * would have asked for 92 pages to be re-scanned.
 *
 * The discriminator is DOCUMENT ORDER, not the shape of the number. Arabic page 1 begins the body, so
 * a footer number appearing BEFORE the first `1` is front matter whatever it looks like, and the body
 * sequence is the monotonically non-decreasing run that starts there. A number that jumps backwards or
 * leaps is a misread, not a page, and is reported as skipped rather than silently kept. */
const RIGHTS = "All rights reserved";
const footerNumbers = (text) => {
  const raw = [];
  for (const line of String(text).split(/\r?\n/)) {
    const t = line.trim();
    if (!t.includes(RIGHTS)) continue;
    const left = /^(\d{1,3})\b/.exec(t);
    const right = /\b(\d{1,3})$/.exec(t);
    if (left) raw.push(Number(left[1]));
    else if (right) raw.push(Number(right[1]));
  }
  /* drop everything before the first arabic 1, then keep the non-decreasing run */
  const start = raw.indexOf(1);
  const frontMatter = start < 0 ? raw.slice() : raw.slice(0, start);
  const body = [];
  const skipped = [];
  if (start >= 0) {
    let last = 0;
    for (const n of raw.slice(start)) {
      if (n >= last && n - last <= 12) { body.push(n); last = n; }
      else skipped.push(n);
    }
  }
  return { body, frontMatter, skipped };
};

for (const f of files) {
  const text = readFileSync(join(DIR, f), "utf8");
  const fn = footerNumbers(text);
  const seen = [...new Set(fn.body)].sort((a, b) => a - b);
  console.log("=== " + basename(f));
  console.log("  front-matter footers skipped (roman read as arabic): " +
    (fn.frontMatter.length ? fn.frontMatter.join(", ") : "none"));
  if (fn.skipped.length) {
    console.log("  footer numbers REJECTED as misreads, not treated as pages: " + fn.skipped.join(", "));
  }
  if (!seen.length) {
    console.log("  NO FOOTER PAGE NUMBERS FOUND -- this instrument cannot answer for this file.");
    console.log("  That is a fact about the footer pattern, not evidence that no page is missing.");
    continue;
  }
  const lo = seen[0], hi = seen[seen.length - 1];
  const missing = [];
  for (let i = lo; i <= hi; i++) if (!seen.includes(i)) missing.push(i);
  console.log("  arabic footer pages found: " + seen.length + "   range " + lo + " to " + hi);
  console.log("  gaps in the footer sequence: " + (missing.length ? missing.join(", ") : "none"));

  if (!missing.length) {
    console.log("  Nothing to confirm. If a page is missing it carries no footer this pattern sees,");
    console.log("  and this instrument reports that rather than claiming the scan is complete.");
    continue;
  }

  /* ---- confirm each gap against the contents list ---- */
  const lines = String(text).split(/\r?\n/);
  /* ============ THE CONTENTS COMES FROM THE TRANSCRIPTION, AND THAT IS LEGITIMATE HERE ============
   *
   * The tesseract contents block is unparseable -- `3 Terms ANA AeFIMTLIONIS ....`, titles mangled,
   * leaders half em-dash mojibake, page numbers reading `AY`. That is why somebody retyped it.
   *
   * `OCR-SOURCES-BLOCKED.md` rules that the typed list must NOT become the declared POPULATION,
   * because checking an extraction against a transcription of the same OCR is circular. This is a
   * different question. "Is this PAGE in the scan" is a question about the DOCUMENT, and the
   * transcription is evidence about the document rather than about the extraction -- so it is the
   * right source here and the wrong one there. Stated because the two uses look identical. */
  const handFile = join(DIR, f.replace(/-tesseract\.txt$/i, "-corrected-hand-retyped.txt"));
  const contents = [];
  if (existsSync(handFile)) {
    for (const line of readFileSync(handFile, "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Z]?\.?\d+(?:\.\d+){0,3})\s+(\S.*?)\s+(\d{1,3})\s*$/.exec(line);
      if (m) contents.push({ clause: m[1], title: m[2].trim(), page: Number(m[3]) });
    }
    console.log("  contents read from the hand transcription " + basename(handFile));
  } else {
    console.log("  NO hand transcription beside this file, so no contents to confirm against.");
  }
  console.log("  contents entries parsed: " + contents.length +
    (contents.length ? "" : "   <- NONE, so a gap cannot be confirmed either way"));

  for (const pg of missing) {
    const onPage = contents.filter((c) => c.page === pg);
    if (!onPage.length) {
      console.log("    page " + pg + ": the contents places no clause here -- UNCONFIRMED, and a");
      console.log("      footer gap alone is not a missing page. Do not re-scan on this evidence.");
      continue;
    }
    /* is any of those clauses present as a heading in the body? */
    const bodyHas = onPage.filter((c) => lines.some((l) => {
      const t = l.trim();
      return t.startsWith(c.clause + " ") && !/\.{4,}/.test(t) &&
        t.toLowerCase().includes(c.title.toLowerCase().slice(0, 14));
    }));
    if (bodyHas.length === onPage.length) {
      console.log("    page " + pg + ": every clause the contents places here IS in the body (" +
        onPage.map((c) => c.clause).join(", ") + ") -- the FOOTER failed to read, the page is present.");
    } else {
      const absent = onPage.filter((c) => !bodyHas.includes(c));
      console.log("    page " + pg + ": **MISSING FROM THE SCAN**");
      console.log("      the contents places " + onPage.length + " clause(s) here and " +
        absent.length + " have no heading in the body:");
      for (const c of absent) console.log("        " + c.clause + "  " + c.title);
    }
  }
  console.log("");
}
console.log("Nothing was changed. A page named MISSING needs re-scanning or photographing; a page");
console.log("reported UNCONFIRMED does not, and the difference is the point of confirming against");
console.log("the contents rather than reporting the footer gap on its own.");
