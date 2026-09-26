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
];

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
  const declared = new Set();
  for (const layout of [true, false]) {
    let text = "";
    try {
      text = execFileSync("pdftotext",
        ["-q", "-enc", "UTF-8", ...(layout ? ["-layout"] : []), s.path, "-"],
        { encoding: "utf8", maxBuffer: 268435456 });
    } catch { continue; }
    for (const id of declaredIn(text)) declared.add(id);
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
  const isContainer = (id) => [...held].some((h) => h.startsWith(id + "."));
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
