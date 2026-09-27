/**
 * check-library-completeness.mjs -- does the library hold everything the standard declares?
 *
 * READ-ONLY, no network, no credential. Unknown flags exit 2.
 *
 * ============ THE POPULATION COMES FROM THE DOCUMENT, NEVER FROM THE EXTRACTION ============
 *
 * The extractor already reports two kinds of gap and BOTH are derived from what it found:
 *
 *   ANNEX CONTROL COVERAGE  compares against a count typed in by hand
 *   HOLES IN A SEQUENCE     looks BETWEEN numbers it holds
 *
 * Neither can see a missing LAST child. ISO/IEC 42001's A.4.6 (Human resources) and A.9.4
 * (Intended use of the AI system) are real controls, one of them cited by a pilot survivor,
 * and they were absent from the library while every report said the annex was complete --
 * because A.4.5 and A.9.3 were the last ids held, so there was no hole to sit in.
 *
 * A COUNT DERIVED FROM WHAT YOU FOUND CANNOT TELL YOU WHAT YOU MISSED. This asks the document
 * for its own list instead:
 *
 *   the TABLE OF CONTENTS       dot-leader lines, the document's declaration of its clauses
 *   TABLE A.1's control rows    the annex's own enumeration of its controls
 *   the clause-3 definitions    ISO renders each as a number followed by a lowercase term
 *
 * Cross-references in prose ("see 5.2") are NOT evidence of existence and are not counted: an
 * id has to appear as a heading, a contents entry or a table row.
 *
 * ============ AND EVERY SOURCE'S PARSE CARRIES A POSITIVE CONTROL ============
 *
 * A declared set that comes back empty or short would report the library complete, which is
 * the failure this script exists to remove. Each source names ids its declaration MUST
 * contain; if the parse cannot find them, that source is reported UNVERIFIABLE and the run
 * exits non-zero rather than printing a clean comparison.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS } from "./lib/citation-index.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY, no flags");
  process.exitCode = 2; process.exit();
}

const ZW = new RegExp("[" +
  [0x200b, 0x200c, 0x200d, 0xfeff].map((c) => String.fromCharCode(c)).join("") + "]", "g");

/* Each source: the PDF, and ids its declaration must contain or the parse is broken. */
const SOURCES = [
  { id: "ISO/IEC 42001", edition: "2023", path: PDFS["42001:2023"],
    control: ["4.3", "9.3.2", "A.2.2", "A.4.6", "A.9.4"] },
  { id: "ISO/IEC 27001", edition: "2022", path: PDFS["27001:2022"],
    control: ["4.3", "9.2.2", "A.5.1", "A.8.34"] },
  { id: "ISO/IEC 27002", edition: "2022", path: PDFS["27002:2022"],
    control: ["5.1", "8.34"] },
  { id: "ISO 19011", edition: "2026", path: PDFS["19011:2026"],
    control: ["5.1", "6.7"] },

  /* ============ THE NEW SOURCES, AND THEY DO NOT ALL DECLARE THEMSELVES ============
   *
   * `declare: "contents"` is the mechanism every entry above uses: the document's own dot-leader
   * contents list. The two BS adoptions have one, so they are checked exactly the same way.
   *
   * THE OTHER THREE HAVE NO CONTENTS LIST THIS CAN READ, and that is reported as ITS OWN STATE
   * rather than folded either way. Deriving their population from what the extractor found would
   * be circular -- a count derived from the extraction cannot see what the extraction missed, which
   * is the whole reason this file exists -- and calling them UNVERIFIABLE would read as a parse
   * defect when the document simply has no list. NO DECLARATION is the honest third answer.
   *
   * The AI Act is the exception among them: it numbers everything, and its own last article, last
   * annex and last recital are readable FROM THE DOCUMENT. So its population is declared as a
   * CONTIGUOUS RANGE and checked as one. */
  { id: "ISO/IEC 42006", edition: "2025", path: PDFS["42006:2025"], declare: "contents",
    control: ["5.1", "7.1.2", "9.1.3"] },
  { id: "ISO/IEC 17021-1", edition: "2015", path: PDFS["17021-1:2015"], declare: "contents",
    control: ["4.1", "5.2", "9.1", "10.2"] },
  { id: "EU AI Act", edition: "2024/1689", path: PDFS["euact:2024/1689"], declare: "euact",
    control: ["Art. 1", "Art. 113", "Annex III", "Recital 180"] },
  { id: "NIST AI RMF", edition: "1.0", path: PDFS["nist-ai-rmf:1.0"], declare: "none",
    why: "The framework prints no contents list with page references that this can parse. Its Core is a TABLE of functions and categories; a population read off the extraction would be a count of what was found." },
  { id: "EBM Guide", edition: "2024", path: PDFS["ebm:2024"], declare: "none",
    why: "No numbering of any kind: the ids are the guide's own headings. There is nothing to compare a held set against, and the extractor says so in its own output." },
  { id: "ITIL 4 Foundation", edition: "2019", path: PDFS["itil4:2019"], declare: "none",
    why: "Its contents list carries page numbers in a column rather than dot leaders, so this parser cannot read it. A declared population is possible here and has not been built." },
];

/* The AI Act's population, read OFF THE DOCUMENT rather than typed from knowledge: its last
 * article heading is 113, its last annex XIII, and its last numbered paragraph before Article 1 is
 * recital 180. Every integer in between must be held -- a contiguity check catches a hole, and the
 * three endpoints are what catch a missing tail. */
function declaredEuAct(text) {
  const out = new Set();
  const lines = String(text).replace(ZW, "").split(/\r?\n/);
  let maxArt = 0, maxRec = 0;
  const annexes = new Set();
  let seenArticle1 = false;
  for (const ln of lines) {
    const a = /^\s*Article\s+(\d{1,3})\b/.exec(ln);
    if (a) { seenArticle1 = true; maxArt = Math.max(maxArt, Number(a[1])); }
    const x = /^\s*ANNEX\s+([IVXL]+)\b/.exec(ln);
    if (x) annexes.add(x[1]);
    if (!seenArticle1) {
      const r = /^\s*\((\d{1,3})\)\s+\S/.exec(ln);
      if (r) maxRec = Math.max(maxRec, Number(r[1]));
    }
  }
  for (let i = 1; i <= maxArt; i++) out.add("Art. " + i);
  for (let i = 1; i <= maxRec; i++) out.add("Recital " + i);
  for (const a of annexes) out.add("Annex " + a);
  return out;
}

const isContentsLine = (ln) => /\.{4,}\s*\d+\s*$/.test(ln);

/** Ids the document itself declares. */
function declaredIn(text) {
  const lines = String(text).replace(ZW, "").split(/\r?\n/);
  const ids = new Set();
  const add = (raw) => {
    const id = String(raw).replace(/^\./, "").replace(/^([A-Z])(\d)/, "$1.$2");
    if (/^[A-Z]?\.?\d/.test(id)) ids.add(id);
  };

  /* (1) THE TABLE OF CONTENTS. A dot-leader line is the document listing its own structure.
   * CLAUDE.md warns the contents is a decoy when you want a clause's TEXT; for asking WHAT
   * EXISTS it is the most authoritative thing in the file. */
  for (const ln of lines) {
    if (!isContentsLine(ln)) continue;
    const m = /^\s*((?:Annex\s+)?[A-Z]?\.?\d+(?:\.\d+){0,3})\s/.exec(ln.trim());
    if (m) add(m[1]);
    const ann = /^\s*Annex\s+([A-Z])\b/.exec(ln.trim());
    if (ann) ids.add(ann[1]);
  }

  /* (2) TABLE A.1's OWN ROWS, WHERE TABLE A.1 IS A CONTROL TABLE.
   *
   * THE CAPTION DECIDES, and leaving it out produced a 94-id false alarm on the first run.
   * ISO/IEC 27002's Annex A is an ATTRIBUTE MATRIX whose rows carry the numbers 5.1 to 8.34 --
   * references to its own main-body clauses, which the library holds. Read as control ids they
   * became "A.5.1 ... A.8.34 missing", 94 controls that do not exist in that document.
   *
   * The extractor already gates on this caption for the same reason. Asking what the document
   * says the table IS beats any test of the table's shape -- flattened to text, a control table
   * and an attribute matrix look alike. */
  const capAt = lines.findIndex((ln) => {
    const m = /^\s*Table A\.1\s*[—–-]\s*(.+)$/.exec(ln);
    return !!m && !isContentsLine(ln) && /\bcontrols\s*$/i.test(m[1].trim());
  });
  if (capAt >= 0) {
    for (let i = capAt; i < lines.length; i++) {
      const ln = lines[i].trim();
      if (/^Annex\s+[B-Z]\b/i.test(ln) && !isContentsLine(ln)) break;
      if (/^Bibliography$/i.test(ln)) break;
      const m = /^(A\.)?(\d+\.\d+)(?:\s|$)/.exec(ln);
      if (m) ids.add("A." + m[2]);
    }
  }

  /* (3) THE CLAUSE-3 DEFINITIONS. ISO renders each as its number followed by the term in
   * LOWERCASE -- "3.24 AI system impact assessment" -- which distinguishes a definition
   * heading from a prose cross-reference. */
  for (const ln of lines) {
    const t = ln.trim();
    const m = /^(3\.\d+)\s+([a-z][a-z-]*)/.exec(t);
    if (m) ids.add(m[1]);
    /* 42001 capitalises some defined terms that open with an initialism. */
    const m2 = /^(3\.\d+)\s+(AI|ICT|IT)\b/.exec(t);
    if (m2) ids.add(m2[1]);
  }
  return ids;
}

/* ---------------------------------------------------------------- the library */
if (!existsSync(join(ROOT, "SOURCE-PASSAGES.json"))) {
  console.error("SOURCE-PASSAGES.json is absent -- run extract-source-passages.mjs first.");
  console.error("Nothing was examined, which is not a pass.");
  process.exitCode = 2; process.exit();
}
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));

console.log("LIBRARY COMPLETENESS, against each standard's own declaration");
console.log("");

const report = [];
let unverifiable = 0, missingTotal = 0;
for (const s of SOURCES) {
  const held = new Set(lib.passages
    .filter((p) => p.source_id === s.id && p.edition === s.edition)
    .map((p) => p.clause));

  /* Both extraction modes contribute to the DECLARATION too: the contents renders differently
   * under -layout, and the table rows are only fully visible in one of them. Declaring from
   * one mode would be the same sample-of-one error the extractor already paid for. */
  /* NO DECLARATION IS A RESULT. Reported with the held count and the reason, never as complete and
   * never as a parse failure -- the document has no list, which is a fact about the document. */
  if (s.declare === "none") {
    console.log("  " + (s.id + " " + s.edition).padEnd(30) + "held " + String(held.size).padStart(4) +
      "   NO DECLARED POPULATION");
    console.log("    " + s.why);
    report.push({ source_id: s.id, edition: s.edition, state: "NO DECLARED POPULATION",
      held: held.size, why: s.why });
    continue;
  }

  const declared = new Set();
  for (const layout of [true, false]) {
    let text = "";
    try {
      text = execFileSync("pdftotext",
        ["-q", "-enc", "UTF-8", ...(layout ? ["-layout"] : []), s.path, "-"],
        { encoding: "utf8", maxBuffer: 268435456 });
    } catch { continue; }
    for (const id of (s.declare === "euact" ? declaredEuAct(text) : declaredIn(text))) declared.add(id);
  }

  const ctlMissing = s.control.filter((c) => !declared.has(c));
  if (!declared.size || ctlMissing.length) {
    unverifiable++;
    console.log("  " + (s.id + " " + s.edition).padEnd(30) + "UNVERIFIABLE");
    console.log("    the declaration parse found " + declared.size + " id(s) and could not find " +
      ctlMissing.join(", ") + " -- so its silence about anything else is worthless");
    report.push({ source_id: s.id, edition: s.edition, state: "UNVERIFIABLE",
      declared: declared.size, control_not_found: ctlMissing });
    continue;
  }

  /* A CONTAINER IS NOT MISSING. The library splits clause 8 into 8.1 to 8.4 on purpose, and
   * the contents declares both. An id with held children is held. */
  /* THE CHILD SEPARATOR IS PART OF THE ID SCHEME, AND IT IS NOT ALWAYS A DOT. An ISO subclause is
   * `8.1` under `8`; an AI Act paragraph is `Art. 5(1)` under `Art. 5`; an annex point is
   * `Annex III 1(a)` under `Annex III`. Testing only for a dot reported 88 of the Regulation's 113
   * articles MISSING while every one of them is held at paragraph grain -- a coverage alarm on a
   * complete document, which is the kind that gets a real gap dismissed next to it. */
  const isContainer = (id) =>
    [...held].some((h) => h.startsWith(id + ".") || h.startsWith(id + "(") || h.startsWith(id + " "));
  const missing = [...declared]
    .filter((id) => !held.has(id))
    .filter((id) => !isContainer(id))
    .filter((id) => /\d/.test(id))        /* a bare annex letter is structure, not a passage */
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  missingTotal += missing.length;
  console.log("  " + (s.id + " " + s.edition).padEnd(30) +
    "declared " + String(declared.size).padStart(4) + "   held " + String(held.size).padStart(4) +
    "   MISSING " + missing.length);
  if (missing.length) console.log("    " + missing.join(" "));
  report.push({ source_id: s.id, edition: s.edition, state: missing.length ? "PARTIAL" : "COMPLETE",
    declared: declared.size, held: held.size, missing });
}

console.log("");
console.log("  sources UNVERIFIABLE      " + unverifiable + "   (a parse that cannot find its own control proves nothing)");
console.log("  ids declared and not held " + missingTotal);
console.log("");
console.log("  A CONTAINER IS NOT MISSING: an id whose subclauses are held is held. A bare annex");
console.log("  letter is structure, not a passage. Cross-references in prose are not counted as a");
console.log("  declaration -- an id has to appear as a contents entry, a table row or a heading.");

writeFileSync(join(ROOT, "LIBRARY-COMPLETENESS.json"),
  JSON.stringify({ measured_against: "the standards' own contents, Table A.1 rows and clause-3 headings",
    sources: report }, null, 1) + "\n", "utf8");
console.log("");
console.log("wrote LIBRARY-COMPLETENESS.json");
if (unverifiable) process.exitCode = 2;
