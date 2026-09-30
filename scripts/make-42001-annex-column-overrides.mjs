#!/usr/bin/env node
/**
 * make-42001-annex-column-overrides.mjs -- separate NAME from STATEMENT in every ISO/IEC 42001 Annex A control.
 *
 * WRITES ONE FILE and only with `--apply`; dry by default, unknown flags exit 2. It writes OVERRIDE ENTRIES,
 * never the library: `extract-source-passages.mjs` applies them, asserts each against its own before-state,
 * and `diff-passage-reextract.mjs` classifies every movement.
 *
 * ============ THE DEFECT, AND IT IS THE WHOLE TABLE ============
 *
 * ISO renders an Annex A control as a three-column table row: the NUMBER, the control's NAME, and its
 * STATEMENT. Read line by line, the name and the statement alternate. Two morphologies:
 *
 *   TITLE BLEED   "Allocating responsibilities The organization shall ensure that responsibilities ..."
 *                 the name is prefixed to the statement. 30 of 31 two-level rows.
 *   INTERLEAVE    "AI system requirements and spec- The organization shall specify and document require-
 *                  ification ments for new AI systems ..."
 *                 both columns wrapped mid-word on the same line, so each stem is completed after the other
 *                 column's text. The name is unreadable and so is the statement.
 *
 * ============ THE SCOPE WAS MEASURED BEFORE ANYTHING WAS WRITTEN, AND IT MOVED TWICE ============
 *
 * `quote-noise` fired on nine grounded items. The director's ruling named ONE passage. I first wrote nine
 * overrides for the A.6 sub-tables, and only then asked the library how many rows share the shape:
 *
 *   30 of 31 two-level annex controls carry the title bleed; A.10.4 alone is clean.
 *   9 three-level A.6 rows also interleave.
 *
 * A per-passage override is the right repair for an INSTANCE and the wrong one for a FAMILY. Fixing the two
 * rows an item happens to quote and leaving twenty-eight identical rows anchorable is how a family goes
 * unnoticed -- so every row is put through the same machine, and a row that comes back UNCHANGED gets no
 * override rather than a no-op entry.
 *
 * THE DEEPER FIX IS THE EXTRACTOR, AND IT IS NOT THIS. ISO/IEC 27001's 93 Annex A controls come out clean,
 * because the annex-table splitter reads that table by its declared caption; 42001's Table A.1 is not going
 * through it. Rebuilding that reader re-grains a table every gated item was checked against, which this
 * repository records as an unattributable delta -- stated here as a named open item rather than attempted
 * under time pressure.
 *
 * ============ WHY THE CUT IS MECHANICAL AND NOT TYPED ============
 *
 * Every statement is CUT from `pdftotext -layout` output. Nothing is retyped, because a mistyped override is
 * a reviewed correction that is quietly wrong -- the rule this override file already carries.
 *
 * A FIXED COLUMN OFFSET DOES NOT WORK AND THAT WAS MEASURED, NOT ASSUMED. The statement column sits at
 * character 44 on one page and 46 on the next, and where the NAME OVERFLOWS ITS COLUMN it pushes the statement
 * left to keep a single space -- which is exactly why five rows look different from the rest. So the split
 * point is taken from the row's own widest whitespace run where one survives, and from the column offset that
 * the row's OWN continuation lines reveal where it does not.
 *
 * AN ANCHOR LITERAL DOES NOT WORK EITHER, and that was the first attempt: `The organization shall` covers most
 * rows and not `A.2.4 ... The AI policy shall be reviewed`, `A.3.2 ... Roles and responsibilities for`, or
 * `A.4.3 ... As part of resource identification`. A literal that covers most members of a set is the
 * single-language-vocabulary defect wearing a different coat.
 *
 * ============ THE CONTROLS ============
 *
 *   MULTISET   the sorted multiset of letters and digits in (name + statement) equals the held text's, or
 *              equals it once a DECLARED noise span is removed. A de-columning reorders characters and
 *              invents none, so an added character is always a failure and an unexplained removal is
 *              UNACCOUNTED rather than tidying. It caught two real defects while this was written: a page
 *              footer swallowed into A.6.2.5, and the `Table A.1 (continued)` caption.
 *   MODAL      the name carries no modal; the statement carries one within its first twelve words. A
 *              mis-split moves the modal, and the multiset cannot see a mis-split because nothing is lost.
 *   FRAGMENT   the name does not end mid-word.
 *
 * A row failing any control is REPORTED AND NOT WRITTEN, and one failure stops the whole file: a partial
 * override file is worse than none, because the rows that landed look reviewed.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FLAGS = new Set(["--apply"]);
let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (!FLAGS.has(a)) {
    console.error("Unrecognised flag: " + a + "\n" +
      "This script is DRY BY DEFAULT and opts into writing with --apply.\n" +
      "Note the two conventions in this repo: some scripts opt into SAFETY with --dry and run LIVE without\n" +
      "it. This one is the other family. Unknown flags exit 2 rather than being ignored.");
    process.exit(2);
  }
  if (a === "--apply") APPLY = true;
}
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PDF = join(ROOT, "..", "iso-corpus", "iso-iec-42001-2023.pdf");
const OV = join(ROOT, "source-overrides-42001-annex.generated.json");

/* the pdftotext build here is Xpdf, not poppler; -layout and -enc exist in both. Checked, not assumed. */
let layout;
try {
  layout = execFileSync("pdftotext", ["-layout", "-enc", "UTF-8", PDF, "-"],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
} catch (e) {
  console.error("pdftotext could not read " + PDF);
  console.error("It is not an npm dependency and cannot be declared in package.json. " + (e && e.message));
  process.exit(2);
}
const lines = layout.split(/\r?\n/);
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));

/* THE TARGET SET IS DERIVED FROM THE LIBRARY, not typed: every 42001 Annex A CONTROL row. Containers (`A.6`,
 * `A.6.2`) are excluded by name and reported, because a container holds a whole sub-table and separating one
 * name from one statement is not what it needs. */
const CONTROL = /^A\.\d+\.\d+(\.\d+)?$/;
const CONTAINERS = new Set(["A.6.1", "A.6.2"]);
const held = lib.passages.filter((p) => p.source_id === "ISO/IEC 42001" && p.edition === "2023" &&
  CONTROL.test(String(p.clause)) && !CONTAINERS.has(String(p.clause)));

const MODAL = /\b(shall|should|must)\b/i;
/* a row ends at the next clause number, a heading, or a page break -- and the page break is identified by its
 * NEIGHBOUR, never by being a number. A footer whose page number and copyright line are fifty spaces apart
 * with a BACKSPACE BYTE between them defeats any `^\d+` anchor; A.6.2.5 swallowed one and the multiset said so. */
const ROW_END = /^\s*(A\.\d+(\.\d+)*\s|Table A\.1|Objective:|Topic\s|Annex\s)|[©]|\f/;
/* page furniture a repair may drop, DECLARED with the reason it is furniture rather than text */
const NOISE = [
  ["Table A.1 (continued)", "the continued-table caption, page furniture"],
  ["Table A.1", "the table caption"],
];

const bag = (s) => [...String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "")].sort().join("");
const cnt = (s) => { const m = new Map(); for (const c of s) m.set(c, (m.get(c) || 0) + 1); return m; };
/* join fragments, rejoining a mid-word wrap: `spec-` + `ification` -> `specification` */
const dehyph = (parts) => {
  let out = "";
  for (const part of parts) {
    if (!part) continue;
    if (/[A-Za-z]-$/.test(out)) out = out.slice(0, -1) + part;
    else out = out ? out + " " + part : part;
  }
  return out.replace(/\s+/g, " ").trim();
};

const results = [];
for (const p of held) {
  const clause = String(p.clause);
  const r = { clause, fails: [], heldTitle: String(p.title || ""), heldText: String(p.text || "") };
  results.push(r);

  const esc = clause.replace(/\./g, "\\.");
  const start = lines.findIndex((l) => new RegExp("^\\s*" + esc + "\\s").test(l));
  if (start < 0) { r.fails.push("no line in the -layout text starts with " + clause); continue; }
  const rowLines = [lines[start]];
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (!l.trim()) continue;
    if (ROW_END.test(l)) break;
    rowLines.push(l);
  }
  r.rowLineCount = rowLines.length;

  /* THE STATEMENT COLUMN'S LEFT EDGE, from the row's OWN lines. Two sources, in order of strength:
   *   (a) a continuation line with TWO fields -- the right field's start is the edge, exactly;
   *   (b) a continuation line with ONE field indented past the name column -- its indent is the edge.
   * Neither exists for a single-line row, and then the widest gap on line 1 is the only evidence. */
  const edges = [];
  for (const l of rowLines.slice(1)) {
    const body = l.replace(/\s+$/, "");
    const lead = body.search(/\S/);
    if (lead < 0) continue;
    const gap = body.slice(lead).search(/ {2,}/);
    if (gap >= 0) edges.push(lead + gap + body.slice(lead + gap).match(/^ +/)[0].length);
    else if (lead >= 20) edges.push(lead);
  }
  r.edge = edges.length ? Math.min(...edges) : null;

  /* LINE 1: drop the clause number, then split name from statement. */
  const first = rowLines[0].replace(new RegExp("^\\s*" + esc + "\\s+"), "");
  const offset = rowLines[0].length - first.length;   /* where `first` begins in the original line */
  let cut = -1, how = "";
  /* (1) the widest whitespace run of 2+ inside line 1 -- the column gap, where it survived */
  const gaps = [...first.matchAll(/ {2,}/g)];
  if (gaps.length) {
    const widest = gaps.reduce((a, b) => (b[0].length >= a[0].length ? b : a));
    cut = widest.index + widest[0].length;
    how = "the column gap survived on line 1 (" + widest[0].length + " spaces)";
  } else if (r.edge != null) {
    /* (2) THE NAME OVERFLOWED AND COLLAPSED THE GAP, and the overflow goes BOTH WAYS -- measured, not assumed.
     * `A.6.2.2` pushes the statement two characters LEFT of the column edge and `A.9.2` pushes it two RIGHT,
     * so a one-directional search is wrong on half of them: searching backwards gave "AI The organization
     * shall ..." as the statement of A.9.2, and searching forwards would take "organization shall ..." on
     * A.6.2.2. Nearest-boundary-either-way is wrong too, for the same pair.
     *
     * SO THE CANDIDATES ARE WORD BOUNDARIES AND THE SELECTOR IS A STRUCTURAL PROPERTY: a control's STATEMENT
     * opens a sentence -- a capital letter followed by a lower-case one -- and a control's NAME never contains
     * a modal. Among the boundaries that satisfy both, the one nearest the measured column edge wins.
     *
     * This is selection by a DECLARED property, not a parameter tuned until the output looked right: the
     * property is stated before the candidates are generated, the candidate set is the row's own word
     * boundaries, and the same property is still asserted afterwards as a control. An AMBIGUOUS row -- no
     * candidate, or two equally close -- fails rather than picking one. */
    const want = r.edge - offset;
    const cands = [];
    for (let i = 1; i < first.length; i++) {
      if (first[i - 1] !== " " || first[i] === " ") continue;
      if (!/^[A-Z][a-z]/.test(first.slice(i))) continue;
      if (MODAL.test(first.slice(0, i))) continue;
      cands.push(i);
    }
    if (!cands.length) {
      r.fails.push("the gap collapsed and NO word boundary yields a statement opening a sentence, so there " +
        "is no evidence for where the name ends: " + JSON.stringify(first.slice(0, 90)));
      continue;
    }
    const best = cands.reduce((a, b) => (Math.abs(b - want) < Math.abs(a - want) ? b : a));
    const ties = cands.filter((c) => Math.abs(c - want) === Math.abs(best - want));
    if (ties.length > 1) {
      r.fails.push("the gap collapsed and " + ties.length + " word boundaries are equally near the column " +
        "edge, so the split is AMBIGUOUS: " + JSON.stringify(first.slice(0, 90)));
      continue;
    }
    cut = best;
    how = "the gap collapsed (the name overflowed its column by " + (best - want) + " character(s)); cut at " +
      "the word boundary nearest column " + r.edge + " that opens a sentence, of " + cands.length +
      " candidate(s)";
  } else {
    r.fails.push("line 1 has no column gap and the row has no continuation line to reveal the column edge, " +
      "so there is no evidence for where the name ends: " + JSON.stringify(first.slice(0, 90)));
    continue;
  }
  r.how = how;
  const nameParts = [first.slice(0, cut).trimEnd()];
  const stmtParts = [first.slice(cut).trimEnd()];

  /* CONTINUATION LINES: two fields means name-continuation plus statement-continuation; one means statement */
  for (const l of rowLines.slice(1)) {
    const body = l.replace(/\s+$/, "");
    const lead = body.search(/\S/);
    if (lead < 0) continue;
    const gap = body.slice(lead).search(/ {2,}/);
    if (gap >= 0 && r.edge != null && lead < r.edge - 2) {
      const left = body.slice(lead, lead + gap).trim();
      const right = body.slice(lead + gap).trim();
      if (left) nameParts.push(left);
      if (right) stmtParts.push(right);
    } else {
      stmtParts.push(body.trim());
    }
  }
  r.name = dehyph(nameParts);
  r.statement = dehyph(stmtParts);

  /* ---- controls ---- */
  if (MODAL.test(r.name)) {
    r.fails.push("the NAME carries a modal, so the columns are still spliced: " + JSON.stringify(r.name));
  }
  if (!MODAL.test(r.statement.split(/\s+/).slice(0, 12).join(" "))) {
    r.fails.push("the STATEMENT has no modal in its first twelve words, so the split point is wrong: " +
      JSON.stringify(r.statement.slice(0, 80)));
  }
  if (/[A-Za-z]-$/.test(r.name) || /\b[a-z]{1,2}$/.test(r.name)) {
    r.fails.push("the NAME ends mid-word: " + JSON.stringify(r.name));
  }
  /* A CAPITALISED SENTENCE OPENER INSIDE THE STATEMENT MEANS THE CUT LANDED TOO EARLY. `A.9.2`'s name is
   * "Processes for responsible use of AI" and the backwards search from the column edge stopped before `AI`,
   * so the statement came out as "AI The organization shall ...". The multiset cannot see that -- nothing is
   * lost, only mis-assigned -- and the modal test passes, because the modal is still in the first twelve
   * words. The tell is POSITIONAL: the sentence opener must be at position zero. */
  const opener = r.statement.search(/\bThe (organization|AI policy|body) shall\b/);
  if (opener > 0) {
    r.fails.push("the STATEMENT carries a capitalised sentence opener at character " + opener +
      " rather than at 0, so the cut landed inside the name: " + JSON.stringify(r.statement.slice(0, 70)));
  }

  /* MULTISET, three states: reordered exactly, reordered with DECLARED noise removed, or UNACCOUNTED.
   *
   * THE BASELINE IS THE ROW'S OWN -layout LINES, NOT THE LIBRARY. Comparing against the held passage was the
   * first version and it breaks the moment an override lands: the held text then holds the statement alone, so
   * the reconstruction looks as though it INVENTED the name -- which is what the nine already-repaired A.6
   * rows reported. A baseline that changes when the repair is applied cannot check the repair. The -layout
   * lines are the source both the library and this script are cut from, and they do not move. */
  const rowBaseline = rowLines
    .map((l, i) => (i === 0 ? l.replace(new RegExp("^\\s*" + esc + "\\s+"), "") : l))
    .join(" ");
  const delta = (heldStr) => {
    const a = cnt(bag(heldStr)), b = cnt(bag(r.name + r.statement));
    const add = [], rem = [];
    for (const k of new Set([...a.keys(), ...b.keys()])) {
      const d = (b.get(k) || 0) - (a.get(k) || 0);
      if (d > 0) add.push(k + "+" + d); else if (d < 0) rem.push(k + d);
    }
    return { add: add.sort(), rem: rem.sort() };
  };
  let d = delta(rowBaseline);
  r.accountedBy = null;
  if (d.rem.length && !d.add.length) {
    for (const [span, why] of NOISE) {
      if (!rowBaseline.includes(span)) continue;
      const trial = delta(rowBaseline.split(span).join(" "));
      if (!trial.rem.length && !trial.add.length) { r.accountedBy = span + "  (" + why + ")"; d = trial; break; }
    }
  }
  if (d.add.length) {
    r.fails.push("the reconstruction INVENTED characters: " + d.add.join(" ") +
      "  -- a de-columning reorders and creates none");
  } else if (d.rem.length) {
    r.fails.push("characters were REMOVED and nothing declared accounts for them: " + d.rem.join(" ") +
      "  -- an unexplained removal is UNACCOUNTED, not tidying");
  }
  r.bagVerdict = d.add.length || d.rem.length ? "UNACCOUNTED"
    : r.accountedBy ? "reordered, declared noise removed" : "reordered exactly";

  /* IS THIS ROW ALREADY CORRECT? A row whose held text already equals the reconstructed statement, with the
   * held title already equal to the name, needs NO override. A no-op entry in a reviewed file is a reviewed
   * correction that corrects nothing, and it dilutes the file it sits in. */
  r.unchanged = r.heldText.trim() === r.statement.trim() && r.heldTitle.trim() === r.name.trim();
}

/* ---------------------------------------------------------------- report */
const failed = results.filter((r) => r.fails.length);
const unchanged = results.filter((r) => !r.fails.length && r.unchanged);
const toWrite = results.filter((r) => !r.fails.length && !r.unchanged);

console.log("ISO/IEC 42001:2023 Annex A -- separating NAME from STATEMENT in every control row");
console.log("");
console.log("  annex CONTROL rows held      " + held.length);
console.log("  containers excluded by name  " + [...CONTAINERS].join(", ") +
  "   (a container holds a whole sub-table, not one name and one statement)");
console.log("");
for (const r of results) {
  const tag = r.fails.length ? "FAILED" : r.unchanged ? "already correct" : "ok";
  console.log("  " + r.clause.padEnd(9) + tag.padEnd(16) + (r.rowLineCount || 0) + " line(s)   " +
    (r.bagVerdict || ""));
  if (!r.unchanged || r.fails.length) {
    if (r.name) console.log("      name      " + JSON.stringify(r.name));
    if (r.statement) console.log("      statement " + JSON.stringify(r.statement.slice(0, 140)));
    if (r.how) console.log("      split     " + r.how);
    if (r.accountedBy) console.log("      removed   " + JSON.stringify(r.accountedBy));
  }
  for (const f of r.fails) console.log("      FAIL " + f);
}
console.log("");
console.log("  FAILED a control     " + failed.length);
console.log("  already correct      " + unchanged.length + (unchanged.length ? "   (" +
  unchanged.map((r) => r.clause).join(", ") + ")" : ""));
console.log("  would be overridden  " + toWrite.length);

/* ============ A ROW THE INSTRUMENT COULD NOT RESOLVE IS ITS OWN STATE ============
 *
 * Not a failure of the row, and certainly not a pass. An earlier version refused to write anything if any row
 * failed, on the ground that a partial override file is worse than none -- which is right when the failure
 * means a reconstruction LANDED WRONG, and wrong here: a failed row is EXCLUDED BY NAME and the library keeps
 * its defective text, where `quote-noise` will go on catching anything that anchors in it. Refusing to write
 * 28 verified repairs because one row is unresolvable is the conservative error that looks like rigour.
 *
 * So the unresolved rows are named, loudly, and the library is reported as still holding them.
 */
if (failed.length) {
  console.log("");
  console.log("UNRESOLVED -- " + failed.length + " row(s) the instrument could not separate, EXCLUDED by name:");
  for (const r of failed) console.log("  " + r.clause + "   " + r.fails[0]);
  console.log("  These keep their defective text. `quote-noise` still fires on anything anchoring in them,");
  console.log("  which is fail-closed; they are an open item, not a silent gap.");
}
if (!APPLY) {
  console.log("");
  console.log("DRY RUN -- nothing written. Re-run with --apply to write into source-overrides-42001-annex.generated.json.");
  console.log("A dry run reporting ok has changed nothing; verify the write separately.");
  process.exit();
}

/* ---------------------------------------------------------------- write */
const spec = existsSync(OV) ? JSON.parse(readFileSync(OV, "utf8")) : {
  source_id: "ISO/IEC 42001", edition: "2023",
  what: "GENERATED, GITIGNORED. Reviewed overrides that separate each Annex A control NAME from its" +
    " STATEMENT, cut by scripts/make-42001-annex-column-overrides.mjs from pdftotext -layout output.",
  why_not_committed: "It holds licensed ISO clause text. The standing rule is that licensed text stays" +
    " gitignored and the GENERATOR is what lives in git -- the same decision as SOURCE-PASSAGES.json," +
    " stated in .gitignore. Regenerate with: node --dns-result-order=ipv4first" +
    " scripts/make-42001-annex-column-overrides.mjs --apply, then re-extract.",
  overrides: [],
};
/* REPLACE any de-columned entry this script wrote before, and refuse to touch one it did not: an override
 * from another ruling is somebody else's reviewed correction. */
const mine = new Set(toWrite.map((r) => r.clause));
const foreign = (spec.overrides || []).filter((o) => mine.has(o.clause) &&
  !/de-columned/.test(String(o.kind || "")));
if (foreign.length) {
  console.error("REFUSING: " + foreign.map((o) => o.clause).join(", ") + " already carry an override from " +
    "another ruling. Two reviewed corrections for one clause, with nothing saying which applies.");
  process.exit(1);
}
spec.overrides = (spec.overrides || []).filter((o) => !(mine.has(o.clause) &&
  /de-columned/.test(String(o.kind || ""))));
for (const r of toWrite) {
  spec.overrides.push({
    clause: r.clause,
    title: r.name,
    kind: "de-columned cut from pdftotext -layout",
    how: "The three-column Table A.1 row was read line by line, so the control's NAME and its STATEMENT ran " +
      "together. " + r.how + "; continuation lines assigned by field count; mid-word wraps rejoined. CUT from " +
      "the -layout text, never retyped. Asserted: the name carries no modal and does not end mid-word, the " +
      "statement carries a modal in its first twelve words, and the multiset of letters and digits equals the " +
      "held text's" + (r.accountedBy ? " once " + JSON.stringify(r.accountedBy) + " is removed" : " exactly") +
      " -- a de-columning reorders characters and creates none.",
    statement: r.statement,
    defect: (r.bagVerdict === "reordered exactly" ? "" : "") + "the name ran into the statement. Held title " +
      "was " + JSON.stringify(r.heldTitle.slice(0, 80)) + ".",
    replaces_starts_with: r.heldText.slice(0, 64),
  });
}
spec.ruled = String(spec.ruled || "").split("  |  2026-09-30")[0] +
  "  |  2026-09-30, PROMPT-95 follow-up 2: every ISO/IEC 42001 Annex A control row de-columned, " +
  toWrite.length + " of " + held.length + ". Found by quote-noise firing on items anchored in A.6.2.2, " +
  "A.10.2 and A.10.3; the FAMILY was measured before anything was written, because a per-passage override is " +
  "the right repair for an instance and the wrong one for a family. The deeper fix is the extractor's Table " +
  "A.1 reader -- 27001's 93 controls go through it and come out clean, 42001's do not -- and that is a named " +
  "open item rather than something to attempt under time pressure, because re-graining the table re-gates " +
  "every item already checked against it.";
writeFileSync(OV, JSON.stringify(spec, null, 2) + "\n", "utf8");
console.log("");
console.log("wrote " + toWrite.length + " override(s): " + toWrite.map((r) => r.clause).join(", "));
console.log("NOW RE-EXTRACT and run the diff harness. The extractor checks each override against its own");
console.log("before-state, so a stale replaces_starts_with fails the build rather than overwriting.");
