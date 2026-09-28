#!/usr/bin/env node
/**
 * correct-ocr-sources.mjs -- the declared OCR corrections for the two scanned standards.
 *
 * DRY BY DEFAULT. `--apply` writes. Unknown flags exit 2.
 *
 *   --apply            write the `-corrected.txt` files
 *   --file=<name>      restrict to one source (substring of the basename)
 *   --show=<n>         how many remaining hits to list per rule (default 12)
 *
 * ============ WHY THIS EXISTS AT ALL ============
 *
 * `-corrected.txt` already exists for both documents and NOBODY CAN SAY HOW IT WAS MADE. There was no
 * script, so the corrections are unreproducible and uncountable, and they turned out to cover the
 * retyped contents list and not the body: 34 and 47 replacements happened, and the bodies still carry
 * 266 and 205 standalone `Al`.
 *
 * That is not cosmetic. Every gate that anchors an item quotes the source VERBATIM. Our items say
 * `AI`; a passage saying `Al` does not contain that string, so `gateVerbatim` refuses a correct anchor
 * and the refusal names the ITEM -- an OCR artifact arriving as a content defect, on the two documents
 * whose whole subject is AI.
 *
 * ============ EVERY RULE IS DECLARED BY NAME AND COUNTED PER FILE ============
 *
 * A correction pass whose substitutions nobody counted is the same object as a gate nobody has
 * watched fire. Each rule below states what it replaces, why the OCR produces it, and its count is
 * printed per file. A rule that fires ZERO times is printed too -- a silent rule is one nobody can
 * tell from a rule that is not running.
 *
 * ============ AND IT REGENERATES FROM `-tesseract.txt`, WHICH RESTORES THE DOT LEADERS ============
 *
 * The existing `-corrected.txt` carries a HAND-RETYPED contents list with the dot leaders removed.
 * `isContentsLine` keys on `\.{4,}\s*\d+\s*$`, so a typed entry with no leaders is indistinguishable
 * from a real body heading -- which is how ISO 38507's clauses 3.1, 3.2 and 4.1 would have resolved to
 * their contents entry and taken the next contents line as their body. A junk passage at a real
 * address is worse than a missing one, because the coverage report then says the address is held.
 *
 * Regenerating from `-tesseract.txt` puts the original leaders back and the decoy defence works again.
 * The hand-retyped file is preserved beside it rather than overwritten, because somebody did that work
 * and it is the only readable transcription of a garbled page.
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync, readdirSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

let APPLY = false, ONLY = null, SHOW = 12;
for (const a of process.argv.slice(2)) {
  let m;
  if (a === "--apply") { APPLY = true; continue; }
  if ((m = /^--file=(.+)$/.exec(a))) { ONLY = m[1]; continue; }
  if ((m = /^--show=(\d+)$/.exec(a))) { SHOW = Number(m[1]); continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply, --file=, --show=");
  console.error("DRY BY DEFAULT; --apply writes. NOTE: some scripts here take --dry and are LIVE");
  console.error("without it. This is not one.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DIR = join(ROOT, "sources", "incoming", "ocr");
if (!existsSync(DIR)) {
  console.error("not found: " + DIR);
  console.error("The OCR text lives outside git (licensed). Nothing to correct.");
  process.exit(2);
}

/* ============ THE RULES ============
 *
 * `find` is built from a STRING and a flag set rather than typed as a literal, so no backslash in
 * this file crosses a shell on its way anywhere. Each rule's `why` is the OCR failure it repairs. */
const RULES = [
  {
    id: "Al-to-AI",
    why: "Tesseract reads the capital I in `AI` as a lowercase l. Bounded so `Also`, `Although` and " +
      "`Alvarez` are untouched -- AND so that a HYPHENATED COMPOUND is corrected while an Arabic " +
      "surname is not. `Al-related`, `Al-based`, `Al-capable`, `Al-specific` are all genuine AI " +
      "tokens and all 13 hyphenated occurrences in these two documents are of that shape, measured " +
      "rather than assumed. `Al-Khwarizmi` is not, and the discriminator is the case of the letter " +
      "after the hyphen: a compound modifier continues in lower case, a surname in upper. The first " +
      "version excluded only letters and digits, so it rewrote the surname -- caught by its control.",
    /* The LEFT hyphen is allowed and the RIGHT one is conditional, and both halves were measured.
     * `non-Al software solutions` is a genuine AI token and excluding a preceding hyphen missed it --
     * the one occurrence that made this file count 251 where a plain word-boundary count said 252. On
     * the right, `-[A-Z]` is excluded because that is the surname shape. */
    find: () => new RegExp("(?<![A-Za-z0-9])Al(?![A-Za-z0-9]|-[A-Z])", "g"),
    to: "AI",
  },
  {
    id: "AIl-to-AI",
    why: "The same failure twice in one token: `AIl` and `All` where the standard means `AI`. Only " +
      "the `AIl` spelling is corrected -- `All` is a real English word and is left alone.",
    find: () => new RegExp("(?<![A-Za-z0-9])AIl(?![A-Za-z0-9])", "g"),
    to: "AI",
  },
  {
    id: "smart-quote-to-ascii-apostrophe",
    why: "A right single quotation mark where the scan shows an apostrophe. Anchors are compared " +
      "verbatim, and our items are written with the ASCII form, so the two never match.",
    find: () => new RegExp(String.fromCharCode(0x2019), "g"),
    to: "'",
  },
  {
    id: "ISO-IEC-spacing",
    why: "The OCR inserts a space into `ISO/IEC` as `ISO/ IEC`, which breaks every source-name test " +
      "and every citation lookup that spells the standard out.",
    find: () => new RegExp("ISO/\\s+IEC", "g"),
    to: "ISO/IEC",
  },
];

const files = readdirSync(DIR).filter((f) => /-tesseract\.txt$/i.test(f))
  .filter((f) => !ONLY || f.toLowerCase().includes(ONLY.toLowerCase()));
if (!files.length) {
  console.error("no `-tesseract.txt` file matched" + (ONLY ? " --file=" + ONLY : "") + " in " + DIR);
  process.exit(2);
}

/* ============ A POSITIVE CONTROL, BEFORE ANY FILE IS READ ============
 *
 * A correction script that silently matches nothing reports a clean pass. Each rule is run against a
 * string that MUST change and a string that must NOT, and the run stops if either is wrong. */
{
  const cases = [
    ["Al-to-AI", "the use of Al brings risk", "the use of AI brings risk"],
    ["Al-to-AI", "Although Al-Khwarizmi wrote", "Although Al-Khwarizmi wrote"],
    ["Al-to-AI", "the Al-related risks", "the AI-related risks"],
    ["Al-to-AI", "an Al-based system", "an AI-based system"],
    ["Al-to-AI", "Also consider Alvarez", "Also consider Alvarez"],
    ["Al-to-AI", "non-Al software solutions", "non-AI software solutions"],
    ["AIl-to-AI", "any AIl system", "any AI system"],
    ["AIl-to-AI", "All systems are affected", "All systems are affected"],
    ["smart-quote-to-ascii-apostrophe", "the organization" + String.fromCharCode(0x2019) + "s board",
      "the organization's board"],
    ["ISO-IEC-spacing", "see ISO/ IEC 38507", "see ISO/IEC 38507"],
    ["ISO-IEC-spacing", "see ISO/IEC 38507", "see ISO/IEC 38507"],
  ];
  const fails = [];
  for (const [id, input, expect] of cases) {
    const r = RULES.find((x) => x.id === id);
    if (!r) { fails.push("no rule " + id); continue; }
    const got = String(input).replace(r.find(), r.to);
    if (got !== expect) fails.push(id + ": " + JSON.stringify(input) + " -> " + JSON.stringify(got) +
      ", expected " + JSON.stringify(expect));
  }
  console.log("rule controls: " + cases.length + " case(s), " + fails.length + " fail");
  if (fails.length) { fails.forEach((f) => console.error("   " + f)); process.exit(3); }
}

/* the SAME predicate the rule uses, so "remaining" means "the rule did not fire here" rather than
 * "a different pattern also matches" -- two tests would disagree and the disagreement would read as
 * a miss. */
const STANDALONE_AL = () => RULES.find((r) => r.id === "Al-to-AI").find();
let anyRemaining = 0;
console.log("");
for (const f of files) {
  const src = join(DIR, f);
  const out = join(DIR, f.replace(/-tesseract\.txt$/i, "-corrected.txt"));
  const before = readFileSync(src, "utf8");
  let text = before;
  const counts = [];
  for (const r of RULES) {
    const n = (text.match(r.find()) || []).length;
    text = text.replace(r.find(), r.to);
    counts.push([r.id, n]);
  }
  const remaining = [...text.matchAll(STANDALONE_AL())];
  anyRemaining += remaining.length;

  console.log("=== " + basename(f));
  console.log("  standalone `Al` before " + (before.match(STANDALONE_AL()) || []).length +
    "   after " + remaining.length);
  for (const [id, n] of counts) {
    console.log("    " + id.padEnd(34) + String(n).padStart(5) +
      (n === 0 ? "   (no occurrence -- printed so a dead rule is visible)" : ""));
  }
  if (remaining.length) {
    console.log("  REMAINING standalone `Al`, first " + Math.min(SHOW, remaining.length) +
      " with context -- each is either a real word this rule must not touch, or a miss:");
    for (const m of remaining.slice(0, SHOW)) {
      console.log("      ..." + text.slice(Math.max(0, m.index - 34), m.index + 24)
        .replace(/\s+/g, " ") + "...");
    }
  }
  /* the hand-retyped transcription is preserved, not overwritten */
  if (APPLY) {
    if (existsSync(out) && !existsSync(out.replace(/\.txt$/, "-hand-retyped.txt"))) {
      copyFileSync(out, out.replace(/\.txt$/, "-hand-retyped.txt"));
      console.log("  preserved the previous hand-retyped file as " +
        basename(out.replace(/\.txt$/, "-hand-retyped.txt")));
    }
    writeFileSync(out, text, "utf8");
    /* read back: the file on disk must be what was intended, and the count must hold */
    const back = readFileSync(out, "utf8");
    const left = (back.match(STANDALONE_AL()) || []).length;
    if (back !== text) { console.error("  READ-BACK MISMATCH on " + basename(out)); process.exit(4); }
    console.log("  wrote " + basename(out) + "   standalone `Al` on disk: " + left);
  }
  console.log("");
}

if (!APPLY) {
  console.log("DRY RUN. Nothing written. Re-run with --apply.");
} else {
  console.log("Applied. " + anyRemaining + " standalone `Al` remain across all files -- listed above.");
  console.log("");
  console.log("NOT DONE BY THIS SCRIPT, and both are needed before these two can be indexed:");
  console.log("  - the front-matter boundary for textPath sources (contents decoy)");
  console.log("  - provenance='ocr', tables not anchorable, and 38507's missing page");
  console.log("They load as NO DECLARED POPULATION: a scanned document has no machine-readable");
  console.log("contents list, and deriving one from a transcription would check the extraction");
  console.log("against the transcription rather than against the standard.");
}
