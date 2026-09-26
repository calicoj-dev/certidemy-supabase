/**
 * extract-source-passages.mjs -- split the held sources at clause level into
 * SOURCE-PASSAGES.json, the library the grounded generator points at.
 *
 * READ-ONLY on the database; writes only the JSON. Unknown flags exit 2.
 *
 * ============ WHY A JSON FIRST AND THE TABLE SECOND ============
 *
 * Migrations here are editor-first: the table does not exist until Juan runs the SQL.
 * Extracting to a file decouples that, so the assertion in section 1, the mapping in
 * section 2, the gates in section 3 and the pilot in section 4 can all be built and
 * measured now. The loader then inserts THIS FILE, so the table and the pilot can
 * never disagree about what a passage says.
 *
 * ============ EDITIONS ARE PINNED, AND ONE IS DELIBERATELY ABSENT ============
 *
 * The 2020 Scrum Guide is loaded. **The 2017 Guide is not**, and not because we lack
 * it: a library the generator quotes from must not contain the edition whose wording
 * we are trying to stop it reproducing. Superseded wording is handled by a refusal
 * list, never by making the old text available.
 *
 * ============ THE EXTRACTION MODE IS MEASURED PER DOCUMENT ============
 *
 * `pdftotext -layout` and plain `pdftotext` each fail on a DIFFERENT document here,
 * and I got this wrong twice before measuring it:
 *
 *   -layout   ISO/IEC 27001:2022 renders its licence watermark as an interleaved left
 *             column, pushing every heading past column 120. It extracted ZERO.
 *   plain     ISO/IEC 42001:2023 loses the 9.3.2 heading.
 *
 * So both modes are run on every source and the one that yields more passages wins,
 * with the winner REPORTED. Choosing per document by hand would have been a guess
 * that looked like knowledge; this is a measurement that names itself.
 *
 * ============ AND THE TABLE-OF-CONTENTS DECOY ============
 *
 * Three instruments in this repository have hit it on the first attempt. The rules
 * that survived: reject a dot-leader line, and take the LAST occurrence of a heading
 * so a contents entry can never win.
 */
import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS } from "./lib/citation-index.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KNOWN = new Set(["--verbose"]);
for (const a of process.argv.slice(2)) {
  if (!KNOWN.has(a)) { console.error("unknown flag " + JSON.stringify(a)); process.exitCode = 2; process.exit(); }
}
const VERBOSE = process.argv.includes("--verbose");

const SOURCES = [
  { id: "ISO/IEC 42001", edition: "2023", path: PDFS["42001:2023"], kind: "iso" },
  { id: "ISO/IEC 27001", edition: "2022", path: PDFS["27001:2022"], kind: "iso" },
  { id: "ISO/IEC 27001", edition: "2022/Amd1:2024", path: PDFS["27001:2022/Amd1"], kind: "amendment" },
  { id: "ISO/IEC 27002", edition: "2022", path: PDFS["27002:2022"], kind: "iso" },
  { id: "ISO 19011", edition: "2026", path: PDFS["19011:2026"], kind: "iso" },
  { id: "Scrum Guide", edition: "2020", path: join(ROOT, "reference", "scrum-guide-2020.pdf"), kind: "scrum" },
];

const pdfText = (p, layout) => execFileSync("pdftotext",
  ["-q", "-enc", "UTF-8", ...(layout ? ["-layout"] : []), p, "-"],
  { encoding: "utf8", maxBuffer: 268435456 });

/* CONTROL BYTES, BUILT FROM CODES RATHER THAN TYPED. I typed them into a character
 * class here and the file immediately became a BINARY -- the same defect invariant 10
 * exists to catch, committed in the act of writing the stripper for it. */
const CONTROL_BYTES = (() => {
  const cs = [];
  for (let c = 0; c <= 0x1f; c++) if (c !== 9 && c !== 10 && c !== 13) cs.push(c);
  cs.push(0x7f, 0xfeff, 0x200b, 0x200c, 0x200d);
  /* The class is assembled from RUNTIME characters, not from source escapes. Writing
   * the escapes into the literal is what produced a broken "\u" a moment ago; control
   * characters have no special meaning inside a character class, so this is safe. */
  return new RegExp("[" + cs.map((c) => String.fromCharCode(c)).join("") + "]", "g");
})();
/* Furniture, tested a LINE at a time. `stripFurniture` works on a whole passage and is
 * the right tool there; the annex-table splitter joins individual lines into a control
 * statement and has to drop the page break's lines BEFORE joining, or the licence
 * watermark lands in the middle of the sentence the verbatim gate will later be asked
 * to match. Same rule, different grain. */
const isFurnitureLine = (ln) =>
  /^SNV \/ licensed to/i.test(ln) || /^Licensed to /i.test(ln) ||
  /^ISO Store Order:/i.test(ln) || /^Single user licence only/i.test(ln) ||
  /^©\s*ISO/i.test(ln) || /^ICS\s/.test(ln) ||
  /^\d{0,4}\s*ISO(?:\/IEC)?\s*\d{4,5}(?::\d{4})?\s*\([A-Za-z]{1,3}\)$/i.test(ln) ||
  /^Table A\.1\b/.test(ln) || /^\d{1,3}$/.test(ln);

/** A dot-leader line is a contents entry, never a body heading. */
const isContentsLine = (ln) => /\.{4,}\s*\d+\s*$/.test(ln) || /\s\.\s?\.\s?\./.test(ln);

/**
 * PAGE FURNITURE IS NOT PART OF A CLAUSE, and it lands inside one every time a clause
 * spans a page break. Measured: 42001 B.6.2.6 came out carrying
 * "© ISO/IEC 2023 - All rights reserved 33 ISO/IEC 42001:2023(E)" in the middle of its
 * guidance. The verbatim gate would happily accept a "sentence" containing that, so an
 * item could anchor on a copyright line and pass. Stripped from every passage, not
 * just from the definitions pass where it was noticed first.
 *
 * The licence watermark carries the licensee's name and order number, so removing it is
 * also the right thing for an internal table nobody should be able to read that out of.
 */
function stripFurniture(text) {
  return String(text)
    .replace(/\f/g, " ")
    .replace(/Licensed to [^\n]*?(?:prohibited\.|\n)/gi, " ")
    .replace(/ISO Store Order:[^\n]*/gi, " ")
    .replace(/Single user licence only[^\n]*/gi, " ")
    .replace(/SNV \/ licensed to[^\n]*/gi, " ")
    .replace(/©\s*ISO(?:\/IEC)?\s*\d{4}\s*[–—-]?\s*All rights reserved/gi, " ")
    /* The running header is `ISO/IEC 42001:2023(E)`, often with the page number in
     * front of it. The language suffix is a SINGLE LETTER -- `(E)`, `(F)` -- and my
     * first pattern looked for `(en)`, so every page break left
     * "33 ISO/IEC 42001:2023(E)" sitting inside a clause. */
    .replace(/\d{0,4}\s*ISO(?:\/IEC)?(?:\/TS)?\s*\d{4,5}(?::\d{4})?(?:\/Amd\.?\s*\d+:\d{4})?\s*\([A-Za-z]{1,3}\)/gi, " ")
    .replace(/ICS\s+[\d.;\s]+/g, " ")
    .replace(/Price based on \d+ page[s]?/gi, " ")
    /* CONTROL BYTES COME OUT OF THE PDF ITSELF -- a literal backspace appeared between
     * a page number and a running header in 42001. Invariant 10 guards our SOURCE, not
     * ISO's; this keeps them out of a library the generator quotes from, where a byte
     * nobody can see would make a verbatim anchor unmatchable for no visible reason. */
    .replace(CONTROL_BYTES, " ")
    .replace(/[ \t]{2,}/g, " ");
}

/* The title may be LOWERCASE: ISO 19011 clause 3 is a terms list whose headings read
 * "3.1 audit". Requiring a capital cost every definition in that document. The line
 * must still be nothing but the heading, which is what keeps a decimal in prose out. */
/* ANY ANNEX LETTER, not just A and B. ISO/IEC 42001 has Annexes A to D and its Annex D
 * headings read "D.1 General" -- which this pattern could not match, so the library held
 * nothing from it and the pilot's gate reported clause D.2 as absent from a standard that
 * contains it. The letter set was written from the annexes the first document happened to
 * have, which is reasoning from a sample of one. */
const ISO_HEADING = /^\s{0,8}([A-Z]?\.?\d+(?:\.\d+){0,3})\s{1,6}([A-Za-z][^\n]{2,90})$/;

/* A HEADING WHOSE BODY IS ON THE SAME LINE IS STILL A HEADING. ISO/IEC 27001 renders
 * clause 10.2 as one 138-character line -- the title, then the clause's first sentence
 * -- and the length cap above (there to keep a decimal in prose out) refused it. The
 * TAB is what the cap was standing in for: these documents separate the number from the
 * title with a tab, and running prose does not start a line with "10.2" and a tab. So
 * this form accepts any length and takes the first 90 characters as the title. */
const ISO_HEADING_TABBED = /^ {0,8}([A-Z]?\.?\d+(?:\.\d+){0,3})\t\s*([A-Za-z].{2,})$/;

/* ============ THE ANNEX IS A TABLE, NOT A SEQUENCE OF HEADINGS ============
 *
 * ISO/IEC 27001's Table A.1 puts the control identifier alone on its own line, the
 * title wrapped and hyphenated across two more, the word "Control" as a column header,
 * and the control statement after that:
 *
 *     5.2
 *     Information security roles and   Control
 *     responsibilities
 *     Information security roles and responsibilities shall be defined and
 *     allocated according to the organization needs.
 *
 * No heading pattern can match that, which is why the main-body splitter extracted
 * zero annex controls while reporting nothing wrong. Cut by the identifier markers --
 * the same "use the document's own sequential numbering" move the definitions needed.
 */
function splitAnnexTable(lines, from) {
  const marks = [];
  for (let i = from; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (/^Annex\s+[B-Z]\b/i.test(ln) || /^Bibliography$/i.test(ln)) break;
    /* THE IDENTIFIER IS NOT ALWAYS ALONE ON ITS LINE. Requiring that it be cost seven
     * controls: ISO/IEC 27001 renders A.5.10 as
     *     "5.10 Acceptable use of information Control and other associated assets"
     * with the identifier, the wrapped title and the column header on one line. So the
     * trailing text is captured and prepended to the body rather than discarded. */
    const m = /^(?:A\.)?(\d+\.\d+)(?:\s+(\S.*))?$/.exec(ln);
    if (m) marks.push({ clause: "A." + m[1], line: i, lead: m[2] || "", loose: !!m[2] });
  }

  /* A LOOSE MARKER MUST BE IN SEQUENCE, OR IT IS A SENTENCE THAT HAPPENS TO START WITH
   * A NUMBER. Accepting any "5.10 Something" line recovered seven controls and LOST
   * two others -- A.7.9 and A.8.9 -- because a wrapped line inside an earlier control's
   * statement began with a number and cut that statement in half. The document numbers
   * its controls in order, so a marker that goes backwards is not a marker. The strict
   * form (identifier alone on the line) is unambiguous and is always accepted; only the
   * loose form has to earn it. This is the same defence the definitions pass needed:
   * cut by the document's own sequential numbering, not by a shape. */
  const seq = (c) => { const [a, b] = c.slice(2).split("."); return [Number(a), Number(b)]; };
  const kept = [];
  let last = [0, 0];
  for (const mk of marks) {
    const [g, n] = seq(mk.clause);
    const forward = g > last[0] || (g === last[0] && n > last[1]);
    if (mk.loose && !forward) continue;
    if (!forward) continue;
    kept.push(mk); last = [g, n];
  }
  marks.length = 0; marks.push(...kept);
  const out = [];
  marks.forEach((m, k) => {
    const end = k + 1 < marks.length ? marks[k + 1].line : lines.length;
    /* THE LAST CONTROL HAS NO NEXT MARKER, so it runs to the end of the document unless
     * something stops it. The loop above breaks on a line starting "Annex B", and in
     * plain extraction ISO/IEC 42001 puts A.10.4's text and the whole of Annex B's
     * introduction ON ONE LINE -- so the line-level break never fired and A.10.4 came out
     * carrying 1,400 characters of Annex B, including B.1, B.2 and a copyright notice.
     * An item anchoring a key in that passage would be quoting guidance from a different
     * annex and the verbatim gate would pass it. The joined text is cut at the marker
     * wherever it appears, not only at the start of a line. */
    const stopAt = (s) => {
      const m2 = /\bAnnex\s+[B-Z]\s*\((?:normative|informative)\)|\bBibliography\b/.exec(s);
      return m2 ? s.slice(0, m2.index) : s;
    };
    const body = stopAt([m.lead, ...lines.slice(m.line + 1, end)].map((s) => s.trim()).filter(Boolean)
      .filter((s) => !isFurnitureLine(s)).join(" ")
      .replace(/(\w)-\s+(\w)/g, "$1$2")     /* de-hyphenate a wrapped word */
      .replace(/\s{2,}/g, " ").trim());
    /* "Control" is the column header, so it separates the title from the statement. */
    const at = body.indexOf("Control");
    let title = (at > 0 ? body.slice(0, at) : body).trim();
    let text = (at >= 0 ? body.slice(at + "Control".length) : body).trim();
    /* THE TITLE CAN WRAP ACROSS THE COLUMN HEADER, so its tail lands at the front of the
     * control statement: A.5.1 came out titled "Policies for information secu" with text
     * beginning "rity Information security policy shall...". De-hyphenation could not
     * reach it because the hyphen and its continuation are not adjacent in reading
     * order. Where the title ends mid-word and the text opens with a lowercase
     * fragment, the fragment belongs to the title. */
    const wrap = /^([a-z]+)\s+(?=[A-Z])/.exec(text);
    if (wrap && /-$/.test(title)) {
      title = title.replace(/-$/, "") + wrap[1];
      text = text.slice(wrap[0].length).trim();
    }
    /* A title is a name. Capping it means a passage whose split went wrong shows up as an
     * odd title rather than as 1,400 characters of another annex in the title column. */
    title = title.replace(/[\s,;:-]+$/, "").slice(0, 90);
    if (text.length >= 20) out.push({ clause: m.clause, title, text });
  });
  return out;
}

function cut(lines, marks) {
  const lastOf = new Map();
  for (const m of marks) lastOf.set(m.clause, m);
  const ordered = [...lastOf.values()].sort((a, b) => a.line - b.line);
  const out = [];
  for (let i = 0; i < ordered.length; i++) {
    const h = ordered[i];
    const end = i + 1 < ordered.length ? ordered[i + 1].line : lines.length;
    const body = lines.slice(h.line + 1, end).join("\n").replace(/[ \t]+\n/g, "\n").trim();
    if (!body) continue;
    out.push({ clause: h.clause, title: h.title, text: body });
  }
  return out;
}

function splitIso(text) {
  /* ZERO-WIDTH SPACES SIT BETWEEN THE NUMBER AND THE TITLE, and they are why the first
   * four versions of this extractor under-covered every ISO document. ISO/IEC 27001
   * renders its headings as
   *
   *     "4.3\t<U+200B>Determining the scope of the information security management system"
   *
   * so a pattern expecting a letter after the whitespace matched nothing, and clause
   * 4.3 -- cited 73 times by the live bank -- was absent from the library while a
   * sibling-based heuristic confidently called it an INVENTED ADDRESS. The furniture
   * stripper already removes these characters, but it ran AFTER the split. Removing
   * them first is the fix; running a cleaner after the thing that needs cleaning is
   * the bug. */
  const clean = String(text).replace(CONTROL_BYTES, "");
  const lines = clean.split(/\r?\n/);

  /* THE ANNEX SHARES THE MAIN BODY'S NUMBER SPACE. ISO/IEC 27001 numbers its Annex A
   * controls `5.35`, not `A.5.35`, so a main-body clause 5.2 and control A.5.2 are the
   * same string -- and `lastOf` would hand the annex the main body's address. This
   * repository already recorded that exact defect: a request for main-body 5.2
   * returning Annex A control A.5.2. Everything after the annex heading is prefixed. */
  /* THE ANNEX HEADING HAS THREE DECOYS, NOT ONE. CLAUDE.md records the contents entry;
   * measuring found two more. In ISO/IEC 42001 the string "Annex A" opens a SENTENCE at
   * 17 percent -- "Annex A with additional controls established by the organization" --
   * which is neither a contents line nor a heading, and taking it as the boundary moved
   * clause 9.3.2 into the annex and renamed it A.9.3.2. So the test is the HEADING FORM
   * (nothing after "Annex A" but an optional normative marker) and the LAST such line,
   * because the document refers forward to its own annex before reaching it. */
  const annexLetterAt = (ln) => {
    if (isContentsLine(ln)) return null;
    const m = /^\s*Annex\s+([A-Z])\b(.*)$/.exec(ln);
    if (!m) return null;
    const rest = m[2].trim();
    return (rest === "" || /^\((?:normative|informative)\)/i.test(rest)) ? m[1] : null;
  };
  /* THE PREFIX IS THE ANNEX YOU ARE IN, NOT "A". The first version prefixed every bare
   * address after Annex A with "A." unless it already began with A. or B. -- so ISO/IEC
   * 42001's Annex C and Annex D, which are real annexes with real content, would have come
   * out as A.C.1 and A.D.2 or been swallowed entirely. The pilot found it the expensive
   * way: an item cited Annex D clause D.2, the library did not hold it, and the gate
   * reported the address as absent from a standard that contains it. Annex D exists --
   * "Use of the AI management system across domains or sectors" -- and the item may have
   * been right. Tracking the current annex letter while scanning is the general fix. */
  const annexOf = new Array(lines.length).fill(null);
  {
    let cur = null;
    for (let i = 0; i < lines.length; i++) {
      const L = annexLetterAt(lines[i]);
      if (L) cur = L;
      annexOf[i] = cur;
    }
  }
  const annexAt = annexOf.findIndex((x) => x !== null);

  const marks = [];
  lines.forEach((ln, i) => {
    if (isContentsLine(ln)) return;
    const m = ISO_HEADING.exec(ln) || ISO_HEADING_TABBED.exec(ln);
    if (!m) return;
    let num = m[1].replace(/^\./, "").replace(/^([A-Z])(\d)/, "$1.$2");
    /* A bare numeric address inside an annex belongs to that annex. An address that already
     * carries its own letter (B.6.2.6, D.2) is left exactly as the document wrote it. */
    if (annexOf[i] && /^\d/.test(num)) num = annexOf[i] + "." + num;
    marks.push({ clause: num, title: m[2].trim().slice(0, 90), line: i });
  });
  const body = cut(lines, marks);

  /* The annex table, where there is one. Its identifiers are already A-prefixed, and a
   * table control WINS over anything the heading pass thought it found at the same
   * address -- the heading pass cannot see this table at all, so a collision here means
   * it matched a line of table prose. */
  /* THE CAPTION SAYS WHETHER THE TABLE IS A CONTROL TABLE, AND IT HAS TO BE ASKED.
   * Run on ISO/IEC 27002's Annex A -- "Matrix of controls and attribute values", a
   * multi-column attribute grid -- this splitter produced 35 passages of interleaved
   * column fragments and hashtag attributes, one of them 1,400 characters of
   * "#Preventive #Confidentiality #Governance". They looked like passages, carried a
   * clause number, and would have been offered to the generator as the text of a
   * control. The caption distinguishes the four tables cleanly:
   *
   *   27001  "Information security controls"          a control table
   *   42001  "Control objectives and controls"        a control table
   *   27002  "Matrix of controls and attribute values"  NOT
   *   19011  "Auditing methods"                        NOT
   *
   * so the gate is that the caption ENDS in "controls". A shape test would have let
   * the matrix through; this asks the document what the table is. */
  const tableAt = lines.findIndex((ln) => {
    const m = /^\s*Table A\.1\s*[—–-]\s*(.+)$/.exec(ln);
    return !!m && !isContentsLine(ln) && /\bcontrols\s*$/i.test(m[1].trim());
  });
  if (tableAt < 0) return body;
  const table = splitAnnexTable(lines, tableAt);
  if (!table.length) return body;

  /* WHERE A CONTROL TABLE EXISTS, THE TABLE SPLITTER IS THE ONLY AUTHORITY ON CONTROL
   * ADDRESSES IN IT. The heading pass cannot read a table -- it matches whatever line
   * happens to look like a heading -- and merging the two by "keep what the table did
   * not produce" let its artifacts through: five ISO/IEC 27001 controls came out with
   * the word "Control" as their entire text, the table's own column header, and they
   * counted toward coverage. A junk passage that occupies a real address is worse than
   * a missing one, because the coverage report says the address is held and the gate
   * would offer a column header to the generator as the text of a control.
   *
   * Group-level headings (A.5, and 42001's "A.2 Policies related to AI" with its
   * objective) are kept from the heading pass: they are prose above the table, which is
   * exactly what the heading pass is for. */
  /* Union, table first, WITH A SUBSTANCE FLOOR ON EVERY CONTROL ADDRESS. Making the
   * table the sole authority removed the junk and took nine real controls with it --
   * the table splitter cannot follow a row split across a page break, and for those the
   * heading pass is the only thing that got the text. So both contribute, and the floor
   * is what keeps a column header from occupying an address: a control statement is a
   * sentence, and "Control" is not one. The floor is stated in words rather than tuned
   * to a corpus -- at least eight words and 40 characters -- and anything it rejects is
   * reported as NOT HELD, never silently kept at partial length.
   *
   * AND THE FIRST FLOOR WAS A SIZE TEST, WHICH HID A REAL CONTROL. "At least eight
   * words and 40 characters" rejected A.7.8 -- "Equipment shall be sited securely and
   * protected." -- which is the whole control, seven words long. A size threshold
   * chosen to exclude noise excluded the shortest genuine member, and this repository
   * has paid for that shape before with a four-character floor that hid the most common
   * missing accent in Portuguese. So the test names the thing it is excluding: the
   * table's COLUMN HEADERS. Anything else is a passage, however short. */
  const isSubstantive = (t) => {
    const s = String(t).trim();
    if (s.length < 30) return false;
    /* What remains once the header words are removed has to be the control. */
    return s.replace(/\b(?:Control|Topic|Attribute values?|Purpose|Guidance)\b/gi, "")
      .replace(/[\s#|]+/g, " ").trim().length >= 25;
  };
  const fromTable = new Map(table.filter((t) => isSubstantive(t.text)).map((t) => [t.clause, t]));
  const kept = body.filter((b) => {
    if (!/^A\.\d+\.\d+/.test(b.clause)) return true;        /* prose and group headings */
    if (fromTable.has(b.clause)) return false;              /* the table read it better */
    return isSubstantive(b.text);
  });
  return [...kept, ...fromTable.values()];
}

const SCRUM_SECTIONS = [
  "Purpose of the Scrum Guide", "Scrum Definition", "Scrum Theory", "Transparency",
  "Inspection", "Adaptation", "Scrum Values", "Scrum Team", "Developers",
  "Product Owner", "Scrum Master", "Scrum Events", "The Sprint", "Sprint Planning",
  "Daily Scrum", "Sprint Review", "Sprint Retrospective", "Scrum Artifacts",
  "Product Backlog", "Commitment: Product Goal", "Sprint Backlog",
  "Commitment: Sprint Goal", "Increment", "Commitment: Definition of Done",
  "End Note", "Acknowledgements",
];
function splitScrum(text) {
  const lines = text.split(/\r?\n/);
  const marks = [];
  lines.forEach((ln, i) => {
    const hit = SCRUM_SECTIONS.find((s) => ln.trim() === s);
    if (hit) marks.push({ clause: hit, title: hit, line: i });
  });
  return cut(lines, marks);
}

/**
 * An AMENDMENT is a handful of edits, not a document with a clause tree. Amd 1:2024
 * is about 6,000 characters and carries essentially no headings, so splitting it
 * yields nothing and "extracted zero" would be the wrong verdict. It is kept as ONE
 * passage under the clause id `AMD1`, with the front matter and the French
 * translation trimmed -- the whole normative content fits in a single anchor.
 */
function splitAmendment(text) {
  /* ONE PASSAGE WAS THE WRONG ANSWER, and its 141 characters were the title page.
   * Amd 1:2024 amends TWO subclauses and each is its own anchor, which matters because
   * a Tier A finding turns on exactly what 4.1 says:
   *
   *   4.1  "The organization shall determine whether climate change is a relevant
   *         issue."                                 <- a shall, and NO documentation duty
   *   4.2  "NOTE 2 Relevant interested parties can have requirements related to
   *         climate change."                        <- a note, and a `can`
   *
   * An item claiming Amd 1 requires DOCUMENTING climate relevance now has nothing to
   * anchor to, which is the whole point of the library. */
  /* CUT BY MARKER POSITION, not by a lookahead. The first attempt ended each block at
   * `©` or `ICS`, and `stripFurniture` had already removed both -- so 4.1 ran to the
   * end of the document and swallowed 4.2, leaving one passage where there are two. A
   * boundary that depends on text another pass deletes is not a boundary. */
  const flat = stripFurniture(text).replace(/\s+/g, " ");
  const marks = [];
  const re = /(?:^|\s)(\d+\.\d+)\s+(Add the following)/g;
  let m;
  while ((m = re.exec(flat)) !== null) {
    marks.push({ clause: m[1], start: m.index + m[0].indexOf(m[1]) });
  }
  const out = [];
  for (let i = 0; i < marks.length; i++) {
    const s = marks[i].start;
    const e = i + 1 < marks.length ? marks[i + 1].start : flat.length;
    const body = flat.slice(s, e).replace(/\s+/g, " ").trim()
      .replace(new RegExp("^" + marks[i].clause.replace(".", "\\.") + "\\s+"), "");
    if (body.length < 20) continue;
    out.push({ clause: marks[i].clause, title: "Amendment 1: change to " + marks[i].clause, text: body });
  }
  return out;
}

/**
 * A TERMS SECTION IS NOT A SET OF HEADINGS, and ISO 19011:2026 is the document that
 * proves it. Its definitions extract as ONE line each:
 *
 *   "3.3 joint audit audit (3.1) carried out at a single auditee (3.14) by two or..."
 *
 * number, term and definition with no boundary between them. `splitIso` requires the
 * line to END after the title, so clause 3.1 -- the definition of `audit`, which the
 * auditor certifications cite constantly -- was extracted by nothing.
 *
 * This pass is deliberately NARROW. It only accepts a number whose first component is
 * the document's OWN terms clause, found from the clause heading titled "Terms and
 * definitions". Without that anchor the pattern would match any prose line beginning
 * with a decimal, which is the unanchored-address defect this repository records.
 */
function splitDefinitions(text, headings) {
  const terms = headings.find((h) => /terms and definitions/i.test(h.title));
  if (!terms) return [];
  const top = terms.clause.split(".")[0];

  /* WORK ON THE COLLAPSED STREAM, NOT ON LINES. ISO 19011:2026 extracts with whole
   * PAGES collapsed onto single lines, and 3.1 and 3.2 appear on no line of their own
   * at all -- a line-based pass found 3.3 and 3.11 and silently skipped the rest. The
   * definitions are there; the line structure is not.
   *
   * Definitions are NUMBERED SEQUENTIALLY, so the document's own numbering is the
   * boundary: walk k = 1, 2, 3 ... and cut each marker to the next. A cross-reference
   * like "(3.1)" is excluded by refusing a marker preceded by an opening parenthesis,
   * which is how this standard writes every internal reference. */
  const flat = text.replace(/\f/g, " ")
    /* page furniture repeats on every page and would land inside a definition */
    .replace(/©\s*ISO\s*\d{4}\s*[–-]\s*All rights reserved/gi, " ")
    .replace(/ISO\s*19011:\d{4}(?:[-\d]*)?(?:\(en\))?/gi, " ")
    .replace(/\s+/g, " ");

  const markers = [];
  for (let k = 1; k <= 200; k++) {
    const re = new RegExp("(^|[^(\\d.])" + top + "\\." + k + "\\s+(?=[a-z])", "g");
    let m, at = -1;
    while ((m = re.exec(flat)) !== null) {
      const start = m.index + m[1].length;
      /* take the FIRST occurrence that follows the previous marker, so the sequence
       * advances monotonically and a later cross-reference cannot pull it backwards */
      if (!markers.length || start > markers[markers.length - 1].start) { at = start; break; }
    }
    if (at < 0) {
      /* two consecutive misses ends the list; one miss may be a numbering gap */
      if (markers.length && k > markers[markers.length - 1].k + 1) break;
      continue;
    }
    markers.push({ k, start: at, clause: top + "." + k });
  }
  const out = [];
  for (let i = 0; i < markers.length; i++) {
    const s = markers[i].start;
    const e = i + 1 < markers.length ? markers[i + 1].start : Math.min(flat.length, s + 2000);
    const body = flat.slice(s, e).trim();
    if (body.length < 20) continue;
    /* strip the leading clause number so the passage text is the definition */
    const withoutNum = body.replace(new RegExp("^" + markers[i].clause.replace(".", "\\.") + "\\s+"), "");
    out.push({
      clause: markers[i].clause,
      title: withoutNum.split(/\s+/).slice(0, 4).join(" "),
      text: withoutNum,
    });
  }
  return out;
}

function splitIsoWithTerms(text) {
  const headings = splitIso(text);
  const defs = splitDefinitions(text, headings);
  const have = new Set(headings.map((h) => h.clause));
  return [...headings, ...defs.filter((d) => !have.has(d.clause))];
}

const split = (kind, text) => kind === "scrum" ? splitScrum(text)
  : kind === "amendment" ? splitAmendment(text) : splitIsoWithTerms(text);

/** shall / should / can / informative, from the passage's own strongest modal. */
function normativeOf(text) {
  const t = " " + text.toLowerCase() + " ";
  if (/\bshall\b/.test(t)) return "shall";
  if (/\bshould\b/.test(t)) return "should";
  if (/\b(can|may)\b/.test(t)) return "can";
  return "informative";
}

const passages = [];
const perSource = [];
const problems = [];
for (const s of SOURCES) {
  if (!existsSync(s.path)) { problems.push(s.id + " " + s.edition + ": file absent"); continue; }
  /* BOTH MODES ARE UNIONED, NOT COMPARED.
   *
   * Choosing the mode that yields MORE passages was my second wrong answer here: ISO
   * 19011 gives 88 headings under -layout and its clause-3 DEFINITIONS only under
   * plain, so "more passages" picked the mode that was missing clause 3.1 -- the
   * definition of `audit`, which the auditor certifications cite constantly.
   *
   * The objective was never passage count, it is COVERAGE. So both modes run, the
   * results are unioned by clause, and where a clause appears in both the LONGER text
   * wins -- a truncated extraction of a clause is worse than a full one, and length is
   * the only signal available without re-reading the PDF. */
  const byClause = new Map();
  const modesUsed = [];
  for (const layout of [true, false]) {
    let text;
    try { text = pdfText(s.path, layout); } catch { continue; }
    const got = split(s.kind, text);
    if (got.length) modesUsed.push((layout ? "-layout" : "plain") + ":" + got.length);
    for (const p of got) {
      const prev = byClause.get(p.clause);
      if (!prev || p.text.length > prev.text.length) byClause.set(p.clause, p);
    }
  }
  const best = { got: [...byClause.values()], modes: modesUsed.join(" + ") };
  if (!best.got.length) { problems.push(s.id + " " + s.edition + ": extracted ZERO passages in BOTH modes"); continue; }
  for (const p of best.got) {
    passages.push({
      source_id: s.id, edition: s.edition, clause: p.clause, title: p.title,
      text: stripFurniture(p.text).replace(/\s+/g, " ").trim(),
      normative: normativeOf(p.text),
      extracted_from: s.path.split(/[\\/]/).pop(),
      chars: p.text.length,
    });
  }
  perSource.push({ id: s.id, edition: s.edition, passages: best.got.length,
    chars: best.got.reduce((a, b) => a + b.text.length, 0), mode: best.modes });
}

/* POSITIVE CONTROLS. An extractor returning nothing for something known to be present
 * is a failure, not an empty document -- this repository has a vacuous pass on exactly
 * that shape. Each control names a clause whose existence is certain. */
const CONTROLS = [
  ["ISO/IEC 42001", "2023", "9.3.2", /management review|input/i],
  ["ISO/IEC 42001", "2023", "B.6.2.6", /monitor/i],
  ["ISO/IEC 27001", "2022", "9.2.2", /audit programme|internal audit/i],
  ["ISO/IEC 27001", "2022/Amd1:2024", "4.1", /shall determine whether climate change/i],
  ["ISO/IEC 27001", "2022/Amd1:2024", "4.2", /interested parties can have requirements/i],
  ["ISO 19011", "2026", "3.1", /audit/i],
  ["Scrum Guide", "2020", "Sprint Retrospective", /improve/i],
  ["Scrum Guide", "2020", "Commitment: Definition of Done", /definition of done|quality/i],

  /* THE ANNEX SPLIT, ASSERTED IN BOTH DIRECTIONS. ISO/IEC 27001 numbers its Annex A
   * controls in the main body's number space, so "5.2" names two different
   * requirements. A one-sided control passes on an extractor that has collapsed them.
   *   main body 5.2  is the information security POLICY clause
   *   A.5.2          is the control on roles and responsibilities
   * If the annex boundary moves, exactly one of these two fails, which is what makes
   * the pair worth more than either half. */
  ["ISO/IEC 27001", "2022", "5.2", /policy/i],
  ["ISO/IEC 27001", "2022", "A.5.2", /roles and responsibilities/i],
  ["ISO/IEC 27001", "2022", "A.5.35", /independent review/i],

  /* The clauses the live bank cites most and that four versions of this extractor
   * could not see, because the heading carries a zero-width space. 4.3 is cited 73
   * times; a sibling heuristic called it an invented address. */
  ["ISO/IEC 27001", "2022", "4.3", /scope/i],
  ["ISO/IEC 27001", "2022", "6.1.3", /risk treatment/i],
  ["ISO/IEC 27001", "2022", "10.2", /nonconformity/i],
  ["ISO/IEC 42001", "2023", "8.2", /risk assessment/i],
  ["ISO/IEC 42001", "2023", "9.2.2", /internal audit/i],

  /* ISO/IEC 42001's Annex A is also a control table, and its identifiers already carry
   * the A. prefix, so the same splitter reaches it. These assert the controls the live
   * bank leans on hardest survived the change of authority above -- and A.2.4 carries
   * the "reviewed at planned intervals" wording a Tier A finding turned on. */
  ["ISO/IEC 42001", "2023", "A.2.2", /shall document a policy/i],
  ["ISO/IEC 42001", "2023", "A.2.4", /reviewed at planned intervals/i],
  ["ISO/IEC 42001", "2023", "A.3.2", /roles and responsibilities/i],
];
const ctlFail = [];
for (const [sid, ed, clause, re] of CONTROLS) {
  const p = passages.find((x) => x.source_id === sid && x.edition === ed && x.clause === clause);
  if (!p) { ctlFail.push(sid + " " + ed + " " + clause + ": NOT EXTRACTED"); continue; }
  if (!re.test(p.text + " " + p.title)) ctlFail.push(sid + " " + clause + ": extracted but does not match " + re.source);
}

console.log("SOURCE PASSAGE EXTRACTION -- mode chosen per document by measurement");
for (const s of perSource) {
  console.log("  " + (s.id + " " + s.edition).padEnd(32) + String(s.passages).padStart(5) +
    " passages  " + String(s.chars).padStart(8) + " chars   " + s.mode);
}
console.log("  " + "TOTAL".padEnd(32) + String(passages.length).padStart(5) + " passages");
console.log("");
console.log("POSITIVE CONTROLS  " + (ctlFail.length ? "FAILED" : "all " + CONTROLS.length + " pass"));
for (const c of ctlFail) console.log("    " + c);

/* ============ COVERAGE IS DECLARED, SO A PARTIAL CANNOT READ AS COMPLETE ============
 *
 * The annex control tables have a KNOWN population -- ISO/IEC 27001:2022 has 93
 * controls in four groups, counted from the standard itself. Without that declaration
 * the report says "81 controls" and nothing says 81 is short. The names of the missing
 * ones are what matters, not the number: a gate must refuse to anchor a key in a
 * control we do not hold, and it can only do that if it knows which those are.
 *
 * THE MISSING ONES ARE NOT FILLED FROM ISO/IEC 27002. That document carries a clause
 * of the same number for every control, and it is a DIFFERENT DOCUMENT with a
 * different modal -- 27002 states guidance with "should" where 27001's Annex A states
 * a control with "shall". Substituting one for the other would put a "should" sentence
 * behind an item claiming a requirement, which is the exact defect the modal-fidelity
 * gate exists to catch, introduced by the library instead of by the model.
 */
/* ============ A HOLE IN A NUMBERED SEQUENCE IS A NAMED GAP, NOT AN ABSENCE ============
 *
 * ISO clause 3 numbers its definitions consecutively, so a missing 3.24 between a held 3.23
 * and a held 3.25 is a defect in this extractor and nothing in the output said so. The
 * pilot's gate refused an item for citing a clause we simply had not extracted, and reported
 * it in the same breath as an address the standard does not contain -- two causes, one
 * message, which is the shape this repository keeps paying for.
 *
 * The sequence is the document's own, so this needs no declared population: if x.1 and x.n
 * are held, every number between them should be.
 */
const seqGaps = [];
for (const s of perSource) {
  const mine = passages.filter((p) => p.source_id === s.id && p.edition === s.edition);
  const groups = new Map();
  for (const p of mine) {
    const m = /^([A-Z]?\.?\d+)\.(\d+)$/.exec(p.clause);
    if (!m) continue;
    const g = m[1];
    if (!groups.has(g)) groups.set(g, new Set());
    groups.get(g).add(Number(m[2]));
  }
  for (const [g, set] of groups) {
    const ns = [...set].sort((a, b) => a - b);
    if (ns.length < 3) continue;   /* two points cannot show a hole */
    const holes = [];
    for (let i = ns[0]; i < ns[ns.length - 1]; i++) if (!set.has(i)) holes.push(g + "." + i);
    if (holes.length) seqGaps.push({ source_id: s.id, edition: s.edition, group: g, holes });
  }
}

const ANNEX_POPULATION = [
  { id: "ISO/IEC 27001", edition: "2022", groups: { 5: 37, 6: 8, 7: 14, 8: 34 } },
];
const annexGaps = [];
console.log("");
console.log("ANNEX CONTROL COVERAGE, against the standard's own population");
for (const a of ANNEX_POPULATION) {
  const have = new Set(passages
    .filter((p) => p.source_id === a.id && p.edition === a.edition && /^A\.\d+\.\d+$/.test(p.clause))
    .map((p) => p.clause.slice(2)));
  const missing = [];
  let expected = 0;
  for (const g of Object.keys(a.groups)) {
    expected += a.groups[g];
    for (let i = 1; i <= a.groups[g]; i++) if (!have.has(g + "." + i)) missing.push("A." + g + "." + i);
  }
  const state = missing.length === 0 ? "COMPLETE" : "PARTIAL";
  console.log("  " + (a.id + " " + a.edition).padEnd(30) + have.size + " of " + expected + "  " + state);
  if (missing.length) {
    console.log("    NOT HELD: " + missing.join(" "));
    console.log("    An item citing one of these has no passage to anchor in. The gate must");
    console.log("    refuse it by name rather than resolve it to ISO/IEC 27002's clause of the");
    console.log("    same number, which is guidance and says 'should'.");
    annexGaps.push({ source_id: a.id, edition: a.edition, held: have.size, expected, missing });
  }
}
console.log("");
console.log("HOLES IN A NUMBERED SEQUENCE  " + seqGaps.reduce((a, g) => a + g.holes.length, 0) +
  "   (the document numbers consecutively, so these are MISSED, not absent)");
for (const g of seqGaps) {
  console.log("  " + (g.source_id + " " + g.edition).padEnd(30) + g.holes.join(" "));
}
if (!seqGaps.length) console.log("  none");

console.log("");
console.log("normative: " + ["shall", "should", "can", "informative"]
  .map((n) => n + "=" + passages.filter((p) => p.normative === n).length).join("  "));

if (problems.length || ctlFail.length) {
  console.error("");
  console.error("REFUSING TO WRITE:");
  for (const p of [...problems, ...ctlFail]) console.error("  " + p);
  process.exitCode = 2; process.exit();
}

/* `annex_gaps` travels WITH the passages, because the gate that refuses an unanchorable
 * citation needs the list and must not re-derive it: a second copy of this fact would
 * go stale the first time the extractor improves. */
writeFileSync(join(ROOT, "SOURCE-PASSAGES.json"),
  JSON.stringify({ sources: perSource, annex_gaps: annexGaps, sequence_gaps: seqGaps, passages }, null, 1) + "\n", "utf8");
console.log("");
console.log("wrote SOURCE-PASSAGES.json");
if (VERBOSE) {
  for (const s of perSource) {
    console.log("");
    console.log("=== " + s.id + " " + s.edition + "  (" + s.mode + ")");
    console.log(passages.filter((p) => p.source_id === s.id && p.edition === s.edition)
      .map((p) => p.clause).join(", "));
  }
}
