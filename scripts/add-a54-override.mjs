#!/usr/bin/env node
/**
 * add-a54-override.mjs -- add A.5.4 to the 42001 annex override file, from the PDF's coordinates.
 *
 * WRITES one gitignored file. `--apply`; dry by default. Unknown flags exit 2.
 *
 * Ruled PROMPT-98 s3. A.5.4 was the one Table A.1 row the `-layout` de-columner could not recover: its title
 * wrapped mid-word with NO hyphen, so the statement was spliced into the middle of "in|dividuals" and the title
 * came out EMPTY. The 37 rows already in this file were cut from `pdftotext -layout` lines; this one needed
 * character coordinates, which `scripts/decolumn-a54.py` takes from pypdfium2.
 *
 * ============ THE TWO CONTROLS SAY DIFFERENT THINGS, AND ONLY ONE CAN BE AN EQUALITY ============
 *
 * The ruling asks for the letter multiset AND the word-token multiset to match the held text. Measured:
 *
 *     LETTER multiset   EQUAL        nothing invented, nothing lost -- the de-columning only reordered
 *     WORD   multiset   DIFFERS      dividuals 1->0, inthe 1->0, individuals 3->4, the 2->3
 *
 * **The word multiset cannot match, and a repair where it did would have changed nothing.** The held text's
 * WORDS are the defect: `inthe` is the splice point and `dividuals` is the orphaned tail. So the word control
 * is stated as what it can actually assert -- the difference is EXACTLY the declared repair, every differing
 * token accounted for, and no token appears or disappears that the repair does not name.
 *
 * That is the stronger form anyway: a multiset equality would pass on two rows swapping values, and this
 * enumerates.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply (dry by default).");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

const DEC = join(ROOT, "A54-DECOLUMNED.json");
if (!existsSync(DEC)) {
  console.error("REFUSING: A54-DECOLUMNED.json is absent. Run:");
  console.error("  python scripts/decolumn-a54.py");
  process.exit(2);
}
const d = JSON.parse(readFileSync(DEC, "utf8"));
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const held = lib.passages.find((p) => p.source_id === "ISO/IEC 42001" && p.clause === "A.5.4");
if (!held) { console.error("REFUSING: the library holds no A.5.4."); process.exit(2); }

const letters = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "").split("").sort().join("");
const words = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ")
  .split(/\s+/).filter(Boolean);
const bag = (a) => { const m = new Map(); for (const x of a) m.set(x, (m.get(x) || 0) + 1); return m; };

const heldAll = (held.title || "") + " " + held.text;
const newAll = d.title + " " + d.text;

/* ---- CONTROL 1: letters conserved, both directions ---- */
const letterOk = letters(heldAll) === letters(newAll);

/* ---- CONTROL 2: the word difference is EXACTLY the declared repair ---- */
const DECLARED_REPAIR = {
  removed: { inthe: 1, dividuals: 1 },      /* the splice point and the orphaned tail */
  added: { individuals: 1, the: 1 },        /* the rejoined word, and the `The` freed from `inthe` */
};
const ha = bag(words(heldAll)), na = bag(words(newAll));
const diff = [];
for (const k of new Set([...ha.keys(), ...na.keys()])) {
  const delta = (na.get(k) || 0) - (ha.get(k) || 0);
  if (delta !== 0) diff.push({ token: k, held: ha.get(k) || 0, now: na.get(k) || 0, delta });
}
const unexplained = diff.filter((x) => {
  if (x.delta < 0) return DECLARED_REPAIR.removed[x.token] !== -x.delta;
  return DECLARED_REPAIR.added[x.token] !== x.delta;
});

/* ---- CONTROL 3: the statement carries the modal and the title does not ---- */
const MODAL = /\b(shall|should|may|can|must)\b/i;
const modalOk = MODAL.test(d.text) && !MODAL.test(d.title);
/* ---- CONTROL 4: neither field ends mid-word, and no fragment survives ---- */
const fragOk = !/\b(in|individu)$/.test(d.title.trim()) && !/\b(dividuals|als)\b/.test(newAll);

console.log("A.5.4 OVERRIDE, from character coordinates");
console.log("");
console.log("  page " + d.page_index + "   column split x=" + d.column_split_x +
  "   corridor " + d.corridor_width_pt + "pt   " + d.row_lines + " line(s)");
console.log("");
console.log("  HELD title  " + JSON.stringify(held.title));
console.log("  HELD text   " + JSON.stringify(String(held.text).slice(0, 120)) + "...");
console.log("");
console.log("  NEW  title  " + JSON.stringify(d.title));
console.log("  NEW  text   " + JSON.stringify(d.text));
console.log("");
console.log("  CONTROL letters conserved          " + (letterOk ? "pass" : "FAIL"));
console.log("  CONTROL word diff = the repair      " + (unexplained.length === 0 ? "pass" : "FAIL"));
for (const x of diff) {
  console.log("      " + x.token.padEnd(14) + "held " + x.held + " -> now " + x.now +
    (unexplained.includes(x) ? "   <- NOT DECLARED" : ""));
}
console.log("  CONTROL modal in statement only    " + (modalOk ? "pass" : "FAIL"));
console.log("  CONTROL no surviving fragment      " + (fragOk ? "pass" : "FAIL"));

if (!letterOk || unexplained.length || !modalOk || !fragOk) {
  console.error("");
  console.error("REFUSING: a control failed. Nothing written -- a partial override file is worse than none,");
  console.error("because the rows that landed look reviewed.");
  process.exit(2);
}

const OV = join(ROOT, "source-overrides-42001-annex.generated.json");
const ov = JSON.parse(readFileSync(OV, "utf8"));
if (ov.overrides.some((e) => e.clause === "A.5.4")) {
  console.log("");
  console.log("A.5.4 is already in the override file. Nothing to do.");
  process.exit(0);
}
const entry = {
  clause: "A.5.4",
  title: d.title,
  kind: "de-columned from CHARACTER COORDINATES (pypdfium2), not from pdftotext -layout",
  how: "Table A.1's Topic column wrapped mid-word with NO hyphen, so the -layout reader spliced the Control " +
    "statement into the middle of \"in|dividuals\" and left the title empty. Characters were grouped into " +
    "lines by y centre and into columns at the widest corridor no character crosses (x=" + d.column_split_x +
    ", " + d.corridor_width_pt + "pt wide). The hyphenless wrap was rejoined on the DOCUMENT's own evidence: " +
    "individuals occurs 53 times across the 62 pages while dividuals, individu and als occur once each, in " +
    "this cell.",
  statement: d.text,
  defect: "title empty; statement carried the title's fragments and the splice token `inthe`",
  replaces_starts_with: String(held.text).slice(0, 60),
};
if (!APPLY) {
  console.log("");
  console.log("DRY RUN. Nothing written. Re-run with --apply.");
  process.exit(0);
}
ov.overrides.push(entry);
ov.overrides.sort((a, b) => String(a.clause).localeCompare(String(b.clause), "en", { numeric: true }));
writeFileSync(OV, JSON.stringify(ov, null, 1) + "\n", "utf8");
const back = JSON.parse(readFileSync(OV, "utf8"));
const got = back.overrides.find((e) => e.clause === "A.5.4");
if (!got || got.statement !== d.text || got.title !== d.title) {
  console.error("POST-CONDITION FAILED: A.5.4 did not land as written.");
  process.exitCode = 2;
} else {
  console.log("");
  console.log("WROTE A.5.4 into source-overrides-42001-annex.generated.json   (" + back.overrides.length +
    " override(s) now, was " + (back.overrides.length - 1) + ")");
  console.log("The file stays gitignored: it holds licensed clause text.");
}
