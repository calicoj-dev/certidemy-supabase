#!/usr/bin/env node
/**
 * make-42001-definition-overrides.mjs -- build source-overrides-42001.json for the two boundary defects
 * PROMPT-93 s3 rules on: 42001 clause 3.16 and clause 3.26.
 *
 * `--apply` writes the file. DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ THE TEXT IS COPIED BY CODE, NEVER TYPED ============
 *
 * Both statements are licensed ISO text. Typing them risks the transport defects this repository has paid for
 * four times -- a mangled accent, a collapsed backslash, a truncated paste -- and a mistyped override is a
 * reviewed correction that is quietly wrong. So each statement is CUT from what the extractor already holds,
 * at a boundary this script computes and prints for review.
 *
 * ============ THE TWO DEFECTS ARE NOT THE SAME SHAPE ============
 *
 *   3.26  A SUFFIX defect. The definition and both notes are correct, then the text runs straight into
 *         "4 Context of the organization" and carries the whole of clause 4.1. The fix is a CUT: everything
 *         before that heading is reviewed text already.
 *
 *   3.16  WORSE, AND WORSE THAN THE RULING PREDICTED. Its text contains NONE of its own definition -- it
 *         begins at "3.17 corrective action" and is entirely 3.17 and 3.18. The definition survives only in
 *         the passage's TITLE, which the extractor read from the document's own heading. So the statement is
 *         reconstructed from the title, and that is stated in the file rather than presented as a cut.
 *
 * A cut cannot invent text. A reconstruction from a title can only be as good as the title, so the file
 * records which of the two each override is.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply. DRY by default; `--dry` is not a flag here.");
  process.exit(2);
}
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SP = join(ROOT, "SOURCE-PASSAGES.json");
if (!existsSync(SP)) { console.error("SOURCE-PASSAGES.json is absent."); process.exit(2); }
const all = (JSON.parse(readFileSync(SP, "utf8")).passages || []);
const get = (clause) => all.find((p) => p.source_id === "ISO/IEC 42001" && String(p.clause) === clause);
const words = (t) => String(t || "").trim().split(/\s+/).filter(Boolean).length;

const overrides = [];
let fails = 0;

/* ---- 3.26: a SUFFIX cut at the next clause's own heading ---- */
{
  const p = get("3.26");
  if (!p) { console.error("3.26 is not held"); fails++; }
  else {
    const text = String(p.text);
    /* the boundary is the DOCUMENT's own heading for clause 4, taken from the library rather than typed */
    const c4 = get("4.1");
    const head = c4 && c4.title ? "4 Context of the organization 4.1 " + String(c4.title).split(/\s+/).slice(0, 3).join(" ")
      : "4 Context of the organization";
    let at = text.indexOf(head);
    if (at < 0) at = text.indexOf("4 Context of the organization");
    if (at < 0) {
      console.error("3.26: the clause-4 heading is no longer inside it -- re-review before overriding");
      fails++;
    } else {
      const statement = text.slice(0, at).trim();
      console.log("=== 42001 3.26  statement of applicability   SUFFIX CUT");
      console.log("  before   " + words(text) + "w");
      console.log("  after    " + words(statement) + "w");
      console.log("  cut at   " + JSON.stringify(text.slice(at, at + 60)));
      console.log("  kept ends: ..." + JSON.stringify(statement.slice(-90)));
      /* both notes must survive the cut, or the cut is in the wrong place */
      const ok = /Note 1 to entry/.test(statement) && /Note 2 to entry/.test(statement) &&
        /^statement of applicability/i.test(statement);
      console.log("  keeps the definition and BOTH notes: " + (ok ? "yes" : "NO"));
      if (!ok) { console.error("  ABORT: the cut lost text it should have kept"); fails++; }
      else {
        overrides.push({
          clause: "3.26",
          title: "statement of applicability",
          kind: "suffix cut",
          how: "Everything before clause 4's own heading. The definition and both notes were already correct; " +
            "the defect is purely that the entry did not stop. Cut by code from the extracted text, so no " +
            "licensed wording was retyped.",
          statement,
          defect: "ran out of clause 3 altogether: the text carried " + (words(text) - words(statement)) +
            " further words, beginning at the clause 4 heading and continuing through the whole of 4.1.",
          replaces_starts_with: text.slice(0, 70),
        });
      }
    }
  }
}

/* ---- 3.16: the definition survives only in the TITLE ---- */
{
  const p = get("3.16");
  if (!p) { console.error("3.16 is not held"); fails++; }
  else {
    const text = String(p.text);
    const title = String(p.title || "").trim();
    console.log("");
    console.log("=== 42001 3.16  nonconformity   RECONSTRUCTED FROM THE TITLE");
    console.log("  before   " + words(text) + "w, beginning: " + JSON.stringify(text.slice(0, 60)));
    console.log("  title    " + JSON.stringify(title));
    /* the text must contain NONE of the definition, or this is a cut and not a reconstruction */
    const startsAtSuccessor = /^3\.17\s/.test(text);
    console.log("  its text begins at its SUCCESSOR (3.17): " + (startsAtSuccessor ? "yes" : "no"));
    const titleLooksRight = /^nonconformity\s+non-fulfilment of a requirement/i.test(title);
    console.log("  the title carries the definition: " + (titleLooksRight ? "yes" : "NO"));
    if (!startsAtSuccessor) {
      console.error("  ABORT: the text no longer begins at 3.17, so the recorded defect has changed. Re-review.");
      fails++;
    } else if (!titleLooksRight) {
      console.error("  ABORT: the title is not the definition, so there is nothing to reconstruct from.");
      fails++;
    } else {
      console.log("  after    " + words(title) + "w  " + JSON.stringify(title));
      overrides.push({
        clause: "3.16",
        title: "nonconformity",
        kind: "reconstructed from the passage title",
        how: "THE TEXT CONTAINED NONE OF ITS OWN DEFINITION -- it began at '3.17 corrective action' and was " +
          "entirely 3.17 and 3.18. The definition survived only in the passage TITLE, which the extractor " +
          "read from the document's own heading, so the statement is that title. This is weaker evidence " +
          "than a cut and is recorded as such: a cut cannot invent text, a reconstruction is only as good " +
          "as the title it came from. Verify against the PDF before this anchors any exam item.",
        statement: title,
        defect: "the entry's own definition was absent and its text was its two successors, 3.17 corrective " +
          "action and 3.18 audit, in full including 3.18's three notes.",
        replaces_starts_with: text.slice(0, 70),
      });
    }
  }
}

console.log("");
console.log(overrides.length + " override(s) prepared, " + fails + " abort condition(s)");
if (fails) { console.error("\nNOTHING WRITTEN. Validate before writing."); process.exit(1); }
const spec = {
  source_id: "ISO/IEC 42001",
  edition: "2023",
  ruled: "2026-09-29, PROMPT-93 s3: any clause-3 definition passage over 60 words gets its boundary checked " +
    "before it is promoted or anchored. 3.16 and 3.26 are fixed; the other 39 are reported only.",
  why_this_file_exists: "Both entries failed to stop. 3.26 carried the whole of clause 4.1 after its own " +
    "notes; 3.16 carried 3.17 and 3.18 INSTEAD OF its own definition. Neither is a choice between two " +
    "readings, so no shape rule separates them -- the entry simply ran on. Generated by " +
    "scripts/make-42001-definition-overrides.mjs, which CUTS from the extracted text rather than retyping " +
    "licensed wording.",
  rules: [
    "Every statement here was produced by code from what the extractor already held. Nothing was retyped, " +
      "because a mistyped override is a reviewed correction that is quietly wrong.",
    "`kind` records the EVIDENCE: a suffix cut cannot invent text; a reconstruction from a title is only as " +
      "good as the title. The two are not equally strong and the file says which is which.",
    "An override whose `replaces_starts_with` no longer matches what the extractor produces is STALE and " +
      "fails the build, the same reason a migration asserts a before-state rather than a literal.",
    "This file is COMMITTED, matching source-overrides-27001.json, which is tracked. It holds licensed " +
      "definition text as reviewed material about a standard; it is internal and never served. Checked " +
      "against git rather than assumed -- the convention is what the repository does, not what seems safer.",
  ],
  overrides,
};
if (!APPLY) {
  console.log("\nDRY RUN -- nothing written. Re-run with --apply to write source-overrides-42001.json.");
  process.exit(0);
}
writeFileSync(join(ROOT, "source-overrides-42001.json"), JSON.stringify(spec, null, 2) + "\n", "utf8");
console.log("\nwrote source-overrides-42001.json");
console.log("Re-extract to apply it:  node --dns-result-order=ipv4first scripts/extract-source-passages.mjs");
