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
import { readdirSync, existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS } from "./lib/citation-index.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const INCOMING = join(ROOT, "sources", "incoming");
const KNOWN = new Set(["--verbose"]);
for (const a of process.argv.slice(2)) {
  if (!KNOWN.has(a)) { console.error("unknown flag " + JSON.stringify(a)); process.exitCode = 2; process.exit(); }
}
const VERBOSE = process.argv.includes("--verbose");

/* ============ THE LICENCE OF EVERY SOURCE (ruled PROMPT-144 s1) ============
 *
 * One entry per (source, edition), READ OFF EACH DOCUMENT'S OWN TEXT and not from memory. The
 * `located` field says WHERE the statement is, so the next reader can check it without being told
 * what it says -- a licence line in an ISO document is still that document's text.
 *
 * NOT ALL OF THESE ARE WHAT YOU WOULD GUESS, which is why they were read:
 *
 *   - the EBM Guide carries CC BY-SA 4.0 like the Scrum Guide, but on PAGE 1 rather than the back
 *     matter, and it was checked rather than inherited from Scrum;
 *   - the NIST AI RMF states only that it is available free of charge. A NIST publication is a US
 *     government work, but THIS DOCUMENT DOES NOT SAY SO, so it is recorded `unstated` rather than
 *     classified from outside knowledge;
 *   - the EU AI Act PDF carries NO licence or reuse statement on any of its 144 pages. The Official
 *     Journal's reuse terms live on EUR-Lex, not in the file, so it too is `unstated`.
 *
 * `unstated` means "this document does not say", never "there is no licence".
 *
 * check-licensed-text STAYS STRICT FOR EVERY SOURCE regardless of this field (ruled PROMPT-144 s1):
 * over-strict is safe, and nothing here loosens it. The field exists so the obligations can be
 * designed, not so a check can be skipped.
 */
const LICENCES = {
  "ISO/IEC 42001|2023": { licence: "all-rights-reserved", located: "page 2" },
  "ISO/IEC 27001|2022": { licence: "all-rights-reserved", located: "page 2" },
  "ISO/IEC 27001|2022/Amd1:2024": { licence: "all-rights-reserved", located: "page 2" },
  "ISO/IEC 27002|2022": { licence: "all-rights-reserved", located: "page 2" },
  "ISO/IEC 27000|2018": { licence: "all-rights-reserved", located: "page 2" },
  "ISO/IEC 22989|2022": { licence: "all-rights-reserved", located: "page 2" },
  "ISO 19011|2026": { licence: "all-rights-reserved", located: "page 2" },
  "ISO/IEC 42006|2025": { licence: "all-rights-reserved", located: "page 4 (BSI adoption front matter)" },
  "ISO/IEC 17021-1|2015": { licence: "all-rights-reserved", located: "page 5 (BSI adoption front matter)" },
  "ITIL 4 Foundation|2019": { licence: "all-rights-reserved", located: "page 3" },
  "Scrum Guide|2020": { licence: "CC BY-SA 4.0",
    located: "page 2 and page 14, both naming Creative Commons Attribution Share-Alike 4.0 with the creativecommons.org URL" },
  "EBM Guide|2024": { licence: "CC BY-SA 4.0",
    located: "page 1, naming Creative Commons Attribution Share-Alike 4.0 with the creativecommons.org URL" },
  "EU AI Act|2024/1689": { licence: "unstated",
    located: "no licence or reuse statement on any of the 144 pages; the Official Journal's reuse terms are on EUR-Lex, not in this file" },
  "NIST AI RMF|1.0": { licence: "unstated",
    located: "page 2 states only that the publication is available free of charge; no copyright or public-domain statement appears" },
};
/* A SOURCE WITH NO LICENCE ENTRY IS AN ERROR, NOT AN UNKNOWN. A new source added without reading its
 * licence would otherwise be recorded as though its licence had been checked and found absent. */
function licenceOf(id, edition) {
  const e = LICENCES[id + "|" + edition];
  if (!e) {
    throw new Error("extract-source-passages: no licence recorded for " + id + " " + edition +
      ". Read the document's own licence statement and add it to LICENCES (ruled PROMPT-144 s1). " +
      "An unrecorded licence must not default to `unstated`: that would claim the document was read.");
  }
  return { licence: e.licence, licence_located: e.located };
}

const SOURCES = [
  { id: "ISO/IEC 42001", edition: "2023", path: PDFS["42001:2023"], kind: "iso" },
  /* 27001 RUNS BOTH MODES, and an attempt to make it layout-only is recorded here so nobody repeats it.
   * The annex table is only readable in `-layout`, so restricting the source to that mode looked like the
   * fix for the six misattached controls -- and the extractor's own citation self-check REFUSED THE WRITE:
   * clauses 4.3, 5.2, 6.1.3, 7.1, 7.4, 9.2.2, 10.1 and 10.2 come from PLAIN mode and vanished. Eight
   * main-body clauses, several cited by the live bank, traded for six annex controls.
   *
   * The real culprit was never the mode: it was `byClause` preferring the LONGEST text, where a
   * misattached row is longer than a correct one. `fromAnnexTable` fixes that at the merge and both modes
   * stay. */
  { id: "ISO/IEC 27001", edition: "2022", path: PDFS["27001:2022"], kind: "iso",
    annexTableAuthoritative: true },
  { id: "ISO/IEC 27001", edition: "2022/Amd1:2024", path: PDFS["27001:2022/Amd1"], kind: "amendment" },
  { id: "ISO/IEC 27002", edition: "2022", path: PDFS["27002:2022"], kind: "iso" },
  { id: "ISO 19011", edition: "2026", path: PDFS["19011:2026"], kind: "iso" },
  { id: "Scrum Guide", edition: "2020", path: join(ROOT, "reference", "scrum-guide-2020.pdf"), kind: "scrum" },

  /* ============ THE SOURCES THE BANK CITED AND WE DID NOT HOLD ============
   *
   * Editions PINNED, as with the Scrum Guide, and for the same reason: a library the generator
   * quotes from must not offer a choice of edition.
   *
   *   42006:2025 only    the 2024 DIS draft is superseded and is not loaded
   *   17021-1:2015       17021-3 is a different part (QMS auditor competence) and is not cited
   *
   * Neither of those two files is in sources/incoming/, so nothing had to be excluded -- worth
   * saying plainly rather than claiming a filter did work it never did. */
  { id: "EU AI Act", edition: "2024/1689", kind: "euact", mode: "plain",
    path: join(INCOMING, "OJ_L_202401689_EN_TXT.pdf") },
  { id: "NIST AI RMF", edition: "1.0", kind: "nist", mode: "plain",
    path: join(INCOMING, "NIST.AI.100-1.pdf") },
  { id: "EBM Guide", edition: "2024", kind: "ebm", mode: "plain",
    path: join(INCOMING, "Evidence Based Management Guide 2024.pdf") },
  /* `stripPageNumbers` for ITIL, which prints a bare page number against every page break and no
   * running header. Off for the four ISO documents the pilot used: it would change their character
   * counts for no benefit they need, and a library that moves under a finished measurement makes
   * the measurement unattributable. */
  { id: "ITIL 4 Foundation", edition: "2019", kind: "itil", mode: "layout", licensed: true,
    stripPageNumbers: true,
    path: join(INCOMING, "(ITIL) Axelos - ITIL Foundation 4 edition-Axelos (2019)[1].pdf") },
  /* `paragraphGrain` on these two only. Both number their PARAGRAPHS and are cited that way, and
   * both are new here -- nothing has been generated or gated against them, so re-graining costs no
   * comparison. It is deliberately OFF for the four ISO documents the pilot used. */
  { id: "ISO/IEC 42006", edition: "2025", kind: "iso", bsAdoption: true, licensed: true,
    paragraphGrain: true,
    path: join(INCOMING, "1010556932-BS-ISO-IEC-42006-2025-Information-Technology-Artificial-Intelligence.pdf") },
  { id: "ISO/IEC 17021-1", edition: "2015", kind: "iso", bsAdoption: true, licensed: true,
    paragraphGrain: true,
    path: join(INCOMING, "BSI-EN-ISO-IEC-17021-1-2015.pdf") },

  /* ============ THE TWO VOCABULARY STANDARDS, ADDED 2026-09-28 ============
   *
   * Both were already in `iso-corpus-manifest.json` and already in the LEAK index -- what they were
   * not in is the LIBRARY, so nothing could anchor to them. That is the distinction the manifest's own
   * comment draws: the leak index hashes every indexed source, and the library is what a gate can point
   * an item at.
   *
   * WHY THEY MATTER MORE THAN THEIR SIZE SUGGESTS. ISO/IEC 27001 clause 3 defines NOTHING -- it
   * delegates its whole vocabulary to 27000 -- and ISO/IEC 42001 clause 3 delegates to 22989 before
   * adding its own. So every ISMS defined term and every AI defined term has, until now, been
   * unanchorable: an item testing what `information asset` or `AI system` means had no passage to rest
   * on, and CLAUDE.md records a `security-control` gloss that scored 0 against an indexed document for
   * exactly this reason.
   *
   * THE EDITION IS RECORDED AND IT IS NOT THE LATEST. ISO/IEC 27000:2026 exists and we do not hold it,
   * so 2018 is the working basis. Recording the edition internally is what makes the upgrade a reload
   * and a diff rather than a hunt -- and the learner never sees either, because `gateNo27000` refuses
   * the number in any served field.
   *
   * 22989 carries no such restriction: it is named in AIMS-F content already.
   */
  { id: "ISO/IEC 27000", edition: "2018", kind: "iso", licensed: true,
    learnerFacing: false,
    note: "VOCABULARY ONLY, AND NEVER NAMED TO A LEARNER. 27001 cl.3 delegates its whole vocabulary " +
      "here. Anchorable internally for ISMS-F and ISMS-IA vocabulary tasks; clause 4 at awareness " +
      "level. The 2026 edition exists and is not held, so this is the working basis.",
    path: PDFS["27000:2018"] },
  { id: "ISO/IEC 22989", edition: "2022", kind: "iso", licensed: true,
    note: "AI vocabulary. 42001 cl.3 delegates to it before adding its own terms. Anchorable for the " +
      "AIMS-F vocabulary tasks.",
    path: PDFS["22989:2022"] },
];

/* ============ PARALLEL TEXT: THE SAME PASSAGE, ANOTHER LANGUAGE ============
 *
 * NOT separate sources. Each of these is the official translation of a source above, keyed to the
 * SAME passage id, so a Spanish or Portuguese item naming an AI Act concept can be checked against
 * the official term -- `responsable del despliegue` for "deployer" -- rather than against a
 * translation somebody made up.
 *
 * AND THE EU SPANISH IS SPAIN SPANISH. Our Spanish is es-419. This is a REFERENCE for it, never a
 * mandate: the house glossary still decides. Recorded here because a parallel corpus that looks
 * authoritative is exactly the thing a later reader would treat as one.
 */
const PARALLEL = [
  { of: "EU AI Act", edition: "2024/1689", language: "es", kind: "euact", mode: "plain",
    path: join(INCOMING, "OJ_L_202401689_ES_TXT.pdf") },
  { of: "EU AI Act", edition: "2024/1689", language: "pt", kind: "euact", mode: "plain",
    path: join(INCOMING, "OJ_L_202401689_PT_TXT.pdf") },
  { of: "EBM Guide", edition: "2024", language: "es", kind: "ebm", mode: "plain",
    path: join(INCOMING, "2024-EBM-Guide-Spanish-European.pdf") },
  { of: "EBM Guide", edition: "2024", language: "pt", kind: "ebm", mode: "plain",
    path: join(INCOMING, "2024-EBM-Guide-Portuguese-Brazillian_0.pdf") },
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
function splitAnnexTable(lines, from, rightColumnAlways = false) {
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
    /* THE COLUMN BOUNDARY IS A RUN OF SPACES, AND IT IS ONLY VISIBLE BEFORE COLLAPSING.
     * In `-layout` a control row renders as
     *
     *     "A.4.6    Human resources                    As part of resource identification,"
     *
     * so the title and the statement are separated by a wide gap, not by the word "Control".
     * Split the LEAD on that gap first, while it still exists: collapsing whitespace destroys
     * the only signal the layout gives. */
    const leadRaw = String(m.lead || "");
    const gap = /^(.{2,70}?)\s{3,}(\S.*)$/.exec(leadRaw);
    const leadTitle = gap ? gap[1].trim() : null;
    const leadRest = gap ? gap[2] : leadRaw;

    const body = stopAt([leadRest, ...lines.slice(m.line + 1, end)].map((s) => s.trim()).filter(Boolean)
      .filter((s) => !isFurnitureLine(s)).join(" ")
      .replace(/(\w)-\s+(\w)/g, "$1$2")     /* de-hyphenate a wrapped word */
      .replace(/\s{2,}/g, " ").trim());

    /* "Control" is the column header where the layout puts one on its own, so it separates
     * the title from the statement -- BUT ONLY WHERE IT ACTUALLY SEPARATES SOMETHING.
     *
     * A SEPARATOR THAT LEAVES NOTHING AFTER IT IS NOT A SEPARATOR. ISO/IEC 42001's A.4.6 and
     * A.9.4 -- both real controls, one of them cited by a pilot survivor -- were DROPPED
     * because `indexOf` found "Control" at character 515 of a 522-character body. That
     * occurrence is the next row's header bleeding in; splitting there left an empty string,
     * which then failed the substance floor and the control vanished silently. Two controls
     * lost to a first-match assumption, and the coverage report could not see it because the
     * declared population was inferred from the extraction.
     *
     * So each occurrence is tried in order and the first one that leaves a substantive
     * remainder wins; if none does, there is no header here and the whole body is the
     * statement. */
    let title = leadTitle || "";
    let text = body;
    for (let at = body.indexOf("Control"); at >= 0; at = body.indexOf("Control", at + 1)) {
      const after = body.slice(at + "Control".length).trim();
      if (after.length < 30) continue;           /* not a separator: nothing follows it */
      title = (title || body.slice(0, at).trim());
      text = after;
      break;
    }
    title = String(title || "").trim();
    text = String(text || "").trim();
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

    /* ============ THE STATEMENT CELL CAN BE EMPTY ON THE TITLE'S LINE ============
     *
     * NINE ISO/IEC 27001 ROWS WERE LOST THIS WAY, eight Annex A controls and clause 9.2.1 --
     * A.5.15, A.7.11, A.8.1, A.8.5, A.8.9, A.8.11, A.8.15, A.8.32. In `-layout` the table's two
     * columns interleave, and for these rows the number and title sit in the left column with only
     * the word `Control` beside them:
     *
     *     "        8.11 Data masking             Control"
     *     "        8.12 Data leakage prevention  Data masking shall be used in accordance with..."
     *
     * A.8.11's STATEMENT is on the NEXT row's line, in the right column, because the cell's text
     * begins after its header. So the body between this marker and the next contains nothing but
     * the header, the substance floor rejected it, and the control vanished.
     *
     * THE RECOVERY READS THE RIGHT COLUMN. Statement cells are delimited by `Control` headers, not
     * by row numbers: everything after THIS row's header and before the NEXT one is this control's
     * statement, once each line's left-column `N.N Title` prefix is removed.
     *
     * IT RUNS ONLY WHERE THE PRIMARY PATH FOUND NOTHING, so it can add a control and can never
     * change one that already extracted. That is the whole reason it is a fallback rather than a
     * rewrite of the splitter: 119 held controls stay byte-identical. */
    /* A BODY THAT IS ONLY A TITLE AND THE COLUMN HEADER IS AN EMPTY STATEMENT CELL.
     *
     * A.8.9 renders as `8.9  Configuration management Control` -- ONE space between the title and the
     * header, where the column-gap test needs three. So the title was never split off, `text` came out
     * as "Configuration management Control", 32 characters, and the fallback below never ran because 32
     * is over its threshold. The substance floor then rejected it as the 3-word fragment it is and the
     * control was reported NOT HELD, which is the right call on that text and the wrong outcome.
     *
     * Where the body ENDS in the bare column header, the header is the separator whatever precedes it:
     * the title comes off and the statement is empty, which is the state the fallback exists for. */
    const endsInHeader = /^(.*?)\s*\bControl\s*$/.exec(text);
    if (endsInHeader && endsInHeader[1].trim().length <= 70) {
      if (!title) title = endsInHeader[1].trim();
      text = "";
    }

    /* ============ THE STATEMENT IS ALWAYS THE RIGHT COLUMN AFTER THIS ROW'S OWN HEADER ============
     *
     * `leadRest` -- the text after the wide gap on the row's OWN line -- is not this row's statement. In
     * the interleaved layout it is the PREVIOUS row's statement continuing, because a cell's text begins
     * after its header and the next row's number shares that line:
     *
     *     "8.11 Data masking             Control"
     *     "8.12 Data leakage prevention  Data masking shall be used in accordance with..."
     *
     * Taking `leadRest` gave A.8.12 the data-masking requirement -- A.8.11's control, under A.8.12's
     * number. The all-93 witness against ISO/IEC 27002 found six of these: A.5.13, A.5.16, A.7.9, A.7.12,
     * A.8.12 and A.8.22, four of them borrowing BACKWARD from the previous control.
     *
     * So the right-column read is no longer a fallback for an empty cell -- it is the primary path for
     * every annex row, and `leadRest` is used only when the right-column read finds nothing. That
     * inverts which one is the exception, which is the point: the special case was the correct one.
     */
    /* ============ BOTH READINGS ARE PRODUCED; 27002 CHOOSES BETWEEN THEM ============
     *
     * 27001's Annex A has two row layouts and no blanket rule fits either one -- making the right-column
     * read primary shifted 79 of 93 controls by a row, and leaving it as an empty-cell fallback leaves
     * six carrying a neighbour's statement. So the splitter stops choosing: it emits the same-line
     * reading as `text` and the right-column reading as `textAlt`, and the selection happens later,
     * where ISO/IEC 27002 is available to say which one is this control's own.
     *
     * BOTH CANDIDATES ARE 27001 PDF TEXT. 27002 never contributes a word to the library; it only picks
     * which of two readings of the SAME page belongs to the number. That distinction is the reason this
     * is sound rather than a cross-contamination.
     */
    let textAlt = "";
    if (true) {
      const startAt = m.line;
      /* ============ THE STATEMENT BEGINS AFTER THIS ROW'S OWN HEADER ============
       *
       * In `-layout` the header sits on the title's line, so the first standalone `Control` after the
       * marker belongs to the NEXT row. In PLAIN mode it is on its own line directly under the title, so
       * the first one is THIS row's -- and stopping at it recovered nothing, which is why A.5.15 stayed
       * missing: its layout line carries a running header before the number (`... / ISO/IEC 27001:2022
       * 5.15 Access control`) so no marker is found there at all, leaving plain mode as the only route.
       *
       * So: if this row's own line already carries the header, collect from the next line; otherwise the
       * first standalone header is this row's own and collection starts after it. Either way the stop is
       * the NEXT header. */
      let ownHeaderAt = /\bControl\b/.test(lines[startAt]) ? startAt : -1;
      if (ownHeaderAt < 0) {
        for (let i = startAt + 1; i < Math.min(lines.length, startAt + 6); i++) {
          if (/^\s*Control\s*$/.test(lines[i])) { ownHeaderAt = i; break; }
          if (/^\s*(?:A\.)?\d+\.\d+\s/.test(lines[i])) break;   /* the next row came first: no own header */
        }
      }
      const from2 = (ownHeaderAt >= 0 ? ownHeaderAt : startAt) + 1;
      let stop = lines.length;
      for (let i = from2; i < lines.length; i++) {
        if (/^\s*Control\s*$/.test(lines[i])) { stop = i; break; }
        if (/^Annex\s+[B-Z]\b/i.test(lines[i].trim()) || /^Bibliography$/i.test(lines[i].trim())) { stop = i; break; }
      }
      const startAtEff = from2 - 1;
      void startAtEff;
      const right = [];
      for (let i = from2; i < stop; i++) {
        let ln = lines[i];
        if (!ln.trim() || isFurnitureLine(ln.trim())) continue;
        /* Strip a left-column entry: a number and title followed by the column gap. What remains is
         * the right column. A line with no such prefix is right-column text already. */
        const lc = /^\s*(?:A\.)?\d+\.\d+\s+\S.*?\s{2,}(\S.*)$/.exec(ln);
        if (lc) { right.push(lc[1]); continue; }
        if (/^\s*(?:A\.)?\d+\.\d+\s+\S[^\s]*(\s\S+){0,8}\s*$/.test(ln)) continue;  /* left column only */
        right.push(ln.trim());
      }
      const recovered = right.join(" ").replace(/(\w)-\s+(\w)/g, "$1$2").replace(/\s{2,}/g, " ").trim();
      /* A NAMED CLAUSE CAN BE TRACED. Set DEBUG_CLAUSE=A.8.12 to see what this row's split actually did
       * -- added because three rounds of reasoning about this block were wrong and one print settled it. */
      if (process.env.DEBUG_CLAUSE === m.clause) {
        console.error("[" + m.clause + "] leadRaw=" + JSON.stringify(String(leadRaw).slice(0, 80)));
        console.error("[" + m.clause + "] leadTitle=" + JSON.stringify(leadTitle) +
          " title=" + JSON.stringify(title) + " textBefore=" + JSON.stringify(String(text).slice(0, 80)));
        console.error("[" + m.clause + "] line=" + m.line + " ownHeaderAt=" + ownHeaderAt +
          " from2=" + from2 + " stop=" + stop + " rightLines=" + right.length);
        console.error("[" + m.clause + "] recovered(" + recovered.length + ")=" +
          JSON.stringify(recovered.slice(0, 100)));
      }
      textAlt = recovered;                      /* the candidate, kept whether or not it is used below */
      if (text.length < 20 && recovered.length >= 20) {
        text = recovered;                       /* an empty statement cell: the right column is the only reading */
        /* The title is the row's own left-column text, never the statement's opening. Where the gap test
         * could not split it -- two spaces instead of three -- `leadRaw` is the title plus the previous
         * row's statement, so the title is taken up to the first sentence boundary or the header. */
        if (!title) {
          const t = leadTitle || String(leadRaw).split(/\s{2,}|\bControl\b/)[0];
          title = String(t || "").trim();
        }
      }
    }

    /* `fromAnnexTable` is how the merge knows this reading came from the two-column splitter rather than
     * from the heading pass. Without it the merge falls back to length, which prefers a misattached row. */
    if (text.length >= 20) out.push({ clause: m.clause, title, text, textAlt, fromAnnexTable: true });
  });
  return out;
}

/* A CLAUSE WHOSE WHOLE TEXT IS ON THE HEADING LINE WAS DROPPED AS EMPTY.
 *
 * ISO/IEC 27001 renders short clauses as one line:
 *
 *     "7.1\tResources The organization shall determine and provide the resources needed..."
 *
 * The body used to start at the NEXT line, which is the next heading, so the body came back
 * empty and `continue` discarded the clause. Clauses 7.1, 7.4 and 10.1 -- Resources,
 * Communication, Continual improvement, all cited by the live bank -- were absent from the
 * library for that reason, and nothing reported it: the sequence check looks BETWEEN held ids
 * and 7.1 is a first child, 10.1 a last one.
 *
 * So the heading line's remainder joins the body WHEN IT CARRIES A SENTENCE. The discriminator
 * is a modal verb or a full stop: a clause TITLE is a name and has neither, while
 * "Resources The organization shall determine..." has both. Using a length threshold instead
 * would be the size-test error this file has already paid for twice.
 */
const REMAINDER_CARRIES_TEXT = (s) =>
  /\b(?:shall|should|may|can|must)\b/i.test(String(s)) || /\.\s/.test(String(s));

/* ============ THE DOCUMENT'S OWN CONTENTS LIST IS THE TITLE, AND THAT RETIRES A GUESS ============
 *
 * `ISO_HEADING` caps the heading remainder at 90 characters, to stop a decimal in running prose
 * being read as a clause number. That cap decided two things it was never meant to decide, and
 * ISO/IEC 42006 shows both in adjacent lines -- the whole clause is on the heading line here:
 *
 *     7.4 Personnel records The requirements of ISO/IEC 17021-1:2015, 7.4 apply.      74 chars
 *     7.5 Outsourcing Outsourcing in accordance with ... not permitted ...           150 chars
 *
 * 7.4 came in UNDER the cap, so the whole line became its TITLE and its own statement was never
 * stored as text -- the passage then took the NEXT clause's line as its body, which is a junk
 * passage occupying a real address, the shape this repository records as worse than a missing one.
 * 7.5 came in OVER the cap, so it was not a heading at all in this mode.
 *
 * A heuristic for where a title ends and a sentence begins would be a guess. THE DOCUMENT ALREADY
 * DECLARES ITS TITLES, in the contents list this extractor otherwise only skips:
 *
 *     7.4 Personnel records.........................................................8
 *
 * So a line whose leading number is followed by that number's DECLARED title is a heading, at any
 * length, and everything after the declared title is text BY CONSTRUCTION rather than by a modal
 * test. Same principle as the declared population in the completeness check: ask the document. */
const contentsTitles = (lines) => {
  const out = new Map();
  /* TWO CONTENTS FORMS, AND THE SECOND IS WHY THE TOP-LEVEL CLAUSES HAD NO DECLARED TITLE. A
   * BS contents list in plain mode puts a top-level number on a line of its OWN and the title with
   * its dot leaders on the next non-blank line, while a subclause keeps both on one line:
   *
   *     1                                  <- the number, alone
   *                                        <- a blank
   *     Scope...........................9  <- the title
   *     5.1 Legal and contractual matters................10   <- one line, the subclause form
   *
   * Reading only the one-line form gave 5.1 a declared title and clause 5 none, which is the
   * shape that leaves a document half-covered while every count looks reasonable. */
  const pendingNumber = new Map();
  {
    let held = null;
    for (let i = 0; i < lines.length; i++) {
      const t = String(lines[i]).trim();
      if (!t) continue;
      const bare = /^([A-Z]?\.?\d+(?:\.\d+){0,3})$/.exec(t);
      if (bare) { held = bare[1]; continue; }
      if (held && isContentsLine(t)) pendingNumber.set(i, held);
      held = null;
    }
  }
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (!isContentsLine(ln)) continue;
    /* THE GAP IS `\s+`, NOT `\s{1,6}`, BECAUSE `-layout` RENDERS THE CONTENTS AS COLUMNS. The
     * narrow form harvested 50 titles from 42006 and ZERO from 17021-1, and the difference was not
     * the document: both modes run for a BS adoption, and in `-layout` the number and the title are
     * separated by a column's worth of spaces. The dot leaders are what identify this line -- the
     * width of the gap carries no information. */
    /* ============ A CONTENTS LINE CAN CARRY MANY ENTRIES, AND THE ANCHOR HID THAT ============
     *
     * The one-entry form was anchored to END OF LINE -- `(title)\.{4,}\s*\d+\s*$` -- which is right when
     * each entry is its own line and catastrophic when they are not. In PLAIN mode ISO/IEC 27001 renders
     * its whole contents block as ONE line, so the lazy title had to stretch to the LAST page number on
     * it: clause 9.2.1's declared title came out as
     *
     *     "General......... 8 9.2.2 Internal audit programme......... 9 9.3 Management review... "
     *
     * which of course never matched the body line, so the declared-title rule could not fire and 9.2.1 --
     * whose whole text sits on its heading line, over the 90-character cap -- was dropped by both paths.
     * The rule was never disabled for 27001; its INPUT was garbage.
     *
     * So every `number title.....page` triple on the line is read, not just the one at its end. */
    const entries = [];
    const ENTRY = /([A-Z]?\.?\d+(?:\.\d+){0,3})[\s\t]+(.+?)\s*\.{4,}\s*(\d+)/g;
    for (const e of String(ln).matchAll(ENTRY)) entries.push([e[1], e[2]]);
    if (!entries.length && pendingNumber.has(i)) {
      const t = /^\s*(.+?)\s*\.{4,}\s*\d+\s*$/.exec(ln);
      if (t) entries.push([pendingNumber.get(i), t[1]]);
    }
    for (const [num, rawTitle] of entries) {
      /* A title cannot contain dot leaders or a page number; where a greedy read picked some up, the
       * title ends at the first run of dots. */
      const title = String(rawTitle).split(/\.{4,}/)[0].trim();
      /* FIRST DECLARATION WINS. A contents list is printed once; a later dotted line carrying the
       * same number is a second contents block (42006 prints one per part) and agreeing copies are
       * harmless, but a disagreeing one must not silently replace the first. */
      const key = num.replace(/^\./, "");
      if (title && title.length >= 3 && !out.has(key)) out.set(key, title);
    }
  }
  return out;
};

function cut(lines, marks) {
  const lastOf = new Map();
  for (const m of marks) lastOf.set(m.clause, m);
  const ordered = [...lastOf.values()].sort((a, b) => a.line - b.line);
  const out = [];
  for (let i = 0; i < ordered.length; i++) {
    const h = ordered[i];
    const end = i + 1 < ordered.length ? ordered[i + 1].line : lines.length;
    const after = lines.slice(h.line + 1, end).join("\n").replace(/[ \t]+\n/g, "\n").trim();
    /* `restIsText` is set only where the DOCUMENT's contents list said the title ends, so the
     * remainder is text by construction and the modal test has nothing left to decide. */
    const sameLine = (h.restIsText || REMAINDER_CARRIES_TEXT(h.rest)) ? String(h.rest).trim() : "";
    const body = [sameLine, after].filter(Boolean).join("\n").trim();
    if (!body) continue;
    out.push({ clause: h.clause, title: h.title, text: body, titleDeclared: !!h.restIsText });
  }
  return out;
}

/* ============ A NUMBERED PARAGRAPH IS A CITABLE ADDRESS, AND SEQUENCE IS THE GUARD ============
 *
 * ISO/IEC 17021-1 numbers its PARAGRAPHS -- 4.2.1, 4.2.2, 4.2.3 -- and that is how the standard is
 * cited. Measured: 264 numbered paragraph starts, of which only 96 became rows, because 147 of the
 * misses carry a statement longer than `ISO_HEADING`'s 90-character cap. Their text is not lost --
 * it sits inside the parent clause's row -- but an item citing 4.2.2 has no row to anchor in.
 *
 * THE CAP CANNOT SIMPLY BE RAISED, because it is what stops a decimal in running prose being read
 * as a clause number. The guard that replaces it is the document's own SEQUENCE: a paragraph is
 * accepted only if it is the first child of its parent or follows the sibling before it. Prose
 * mentioning "9.4.2" in passing does not continue a sequence. Same mechanism as the recital and
 * article guards in `splitEuAct`, which is the house form for this.
 *
 * IT IS SCOPED PER SOURCE, DELIBERATELY. Turning it on for ISO/IEC 42001 would re-grain the
 * document every pilot item was generated and gated against, and this repository records that
 * re-gating old items against a changed library produces an unattributable delta. The two BS
 * adoptions are new, nothing has been generated from them, and they are the two that need it. */
const PARAGRAPH_START = /^\s{0,3}(\d+(?:\.\d+){1,4})[ \t]+([A-Z(].*)$/;

function paragraphMarks(lines, declared, headings) {
  const taken = new Set(headings.map((h) => h.clause));
  const cands = [];
  lines.forEach((ln, i) => {
    if (isContentsLine(ln)) return;
    const m = PARAGRAPH_START.exec(ln);
    if (!m) return;
    /* A paragraph must carry a statement, not a title: a short remainder with no terminal
     * punctuation is a heading and `splitIso`'s own scan already owns that case. */
    if (m[2].trim().length < 40) return;
    cands.push({ clause: m[1], rest: m[2], line: i, cand: true });
  });

  /* ============ THE SEQUENCE IS WALKED IN DOCUMENT ORDER, HEADINGS INCLUDED ============
   *
   * A paragraph cannot be required to be the FIRST child of its parent, because its earlier
   * siblings are often ordinary headings that this pass skips: ISO/IEC 17021-1 clause 10.2 has
   * 10.2.1 to 10.2.3 as short titled headings and 10.2.4 with its whole statement on the heading
   * line, so 10.2.4 was refused for being fourth and was the one id the completeness check
   * reported missing.
   *
   * SEEDING THE GUARD WITH EACH PARENT'S HIGHEST TAKEN CHILD WAS THE WRONG FIX AND COST TEN ROWS:
   * where a heading exists at 9.6.5.3, a legitimate paragraph 9.6.5.1 then looks out of sequence.
   * The order matters, so the two streams are MERGED BY LINE and the counter advances as the
   * document does. */
  const stream = [...headings.map((h) => ({ clause: h.clause, line: h.line })), ...cands]
    .sort((a, b) => a.line - b.line || (a.cand ? 1 : -1));
  const last = new Map();
  const out = [];
  for (const c of stream) {
    const dot = c.clause.lastIndexOf(".");
    if (dot < 0) continue;
    const parent = c.clause.slice(0, dot);
    const n = Number(c.clause.slice(dot + 1));
    if (!Number.isFinite(n)) continue;
    const prev = last.get(parent);
    const inSequence = prev === undefined ? n === 1 : n === prev + 1;
    if (!inSequence) continue;
    last.set(parent, n);
    if (!c.cand || taken.has(c.clause)) continue;
    /* THE PARAGRAPH HAS NO TITLE OF ITS OWN. Its parent clause's declared title is the honest
     * label -- it is what the paragraph is under -- and the task map matches on titles, so an
     * empty one would make these rows unmatchable by the signal that matches best.
     *
     * AND THE NEAREST ANCESTOR HEADING IS THE FALLBACK, because the contents list only declares
     * about three levels. ISO/IEC 17021-1's "Stage 1" is a FOUR-level heading (9.3.1.2) that the
     * contents does not carry, so a paragraph under it got an empty title -- and since the
     * container row itself is no longer emitted, the title "Stage 1" disappeared from the library
     * entirely. A title lookup for it then resolved to nothing, which is how the task map's
     * resolve-by-title ruling surfaced a defect my own paragraph-grain change had introduced.
     *
     * The heading pass already found those titles; they are handed in as `headings`, so the
     * nearest ancestor with a title is used when the immediate parent has none. Nearest rather
     * than any, so a paragraph is labelled by the heading it actually sits under. */
    const ancestorTitle = () => {
      let best = null;
      for (const h of headings) {
        if (!h.title || !c.clause.startsWith(h.clause + ".")) continue;
        if (!best || h.clause.length > best.clause.length) best = h;
      }
      return best ? best.title : "";
    };
    out.push({
      clause: c.clause,
      title: declared.get(parent) || ancestorTitle(),
      rest: c.rest,
      restIsText: true,
      line: c.line,
    });
  }
  return out;
}

function splitIso(text, declaredSeed, opts) {
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
  /* ============ A FOURTH DECOY: THE CONTENTS ENTRY THAT CARRIES THE MARKER ============
   *
   * The test above allows anything AFTER the normative marker, and ISO/IEC 22989's contents entry is
   * `Annex A (informative) Mapping of the AI system life cycle with the OECD's...` -- which matches. In
   * `-layout` its dot leaders wrap onto the next line, so `isContentsLine` cannot see them either, and
   * the real heading at 94 percent of the document is a BARE `Annex A` with `(informative)` on the
   * following line. So the only line carrying the marker was the contents entry, the boundary landed at
   * 7 percent, and 114 MAIN-BODY clauses came out annex-prefixed: `A.1 Scope`, `A.3.1`. 103 of them
   * duplicated a correct plain id from the other extraction mode, which is a junk passage at a real
   * address -- the worst of the three states, because coverage then reports the address as held.
   *
   * STRICT FIRST, LOOSE ONLY IF NOTHING IS STRICT. A line whose remainder is EMPTY or EXACTLY the
   * marker is unambiguously a heading; a contents entry always carries its title. Where a document has
   * any strict heading for a letter, the loose ones for that letter are decoys and are ignored. Where it
   * has none -- a document that puts the annex title on the heading line -- the loose form is still
   * accepted, so no document that worked before changes.
   */
  const annexMatch = (ln) => {
    if (isContentsLine(ln)) return null;
    const m = /^\s*Annex\s+([A-Z])\b(.*)$/.exec(ln);
    if (!m) return null;
    const rest = m[2].trim();
    if (rest === "") return { letter: m[1], strict: true };
    if (/^\((?:normative|informative)\)$/i.test(rest)) return { letter: m[1], strict: true };
    if (/^\((?:normative|informative)\)/i.test(rest)) return { letter: m[1], strict: false };
    return null;
  };
  const strictLetters = new Set();
  for (const ln of lines) {
    const a = annexMatch(ln);
    if (a && a.strict) strictLetters.add(a.letter);
  }
  const annexLetterAt = (ln) => {
    const a = annexMatch(ln);
    if (!a) return null;
    if (!a.strict && strictLetters.has(a.letter)) return null;   /* a decoy for a letter we can see properly */
    return a.letter;
  };
  /* THE PREFIX IS THE ANNEX YOU ARE IN, NOT "A". The first version prefixed every bare
   * address after Annex A with "A." unless it already began with A. or B. -- so ISO/IEC
   * 42001's Annex C and Annex D, which are real annexes with real content, would have come
   * out as A.C.1 and A.D.2 or been swallowed entirely. The pilot found it the expensive
   * way: an item cited Annex D clause D.2, the library did not hold it, and the gate
   * reported the address as absent from a standard that contains it. Annex D exists --
   * "Use of the AI management system across domains or sectors" -- and the item may have
   * been right. Tracking the current annex letter while scanning is the general fix. */
  /* ============ AND THE LETTER ONLY EVER GOES FORWARD ============
   *
   * The strict-first rule above cost 100 ISO/IEC 27002 passages on its first run: that document prints
   * a bare `Annex A` as a RUNNING PAGE HEADER, which is strict by shape, and it recurs after Annex B
   * has begun. So the letter flipped back to A midway through Annex B, 100 `B.*` ids disappeared and 95
   * `A.*` passages silently acquired Annex B's text -- a regression the delta caught and a read of the
   * removed ids named.
   *
   * A document's annexes run A, B, C in order and never revisit. A heading for a letter at or before
   * the current one is a page header or a cross-reference, whatever its shape. Same defence as the
   * clause-marker sequence check, one level up. */
  const annexOf = new Array(lines.length).fill(null);
  {
    let cur = null;
    for (let i = 0; i < lines.length; i++) {
      const L = annexLetterAt(lines[i]);
      if (L && (cur === null || L > cur)) cur = L;
      annexOf[i] = cur;
    }
  }
  const annexAt = annexOf.findIndex((x) => x !== null);

  /* A BS ADOPTION'S CONTENTS LIST IS IN THE PART THAT GETS STRIPPED. The national furniture sits
   * ahead of ISO clause 1 and so does the contents, so the caller harvests the titles from the
   * discarded head and seeds them here -- otherwise the one source that needed the declared title
   * most would be the one source that never had one. */
  const declared = contentsTitles(lines);
  if (declaredSeed) for (const [k, v] of declaredSeed) if (!declared.has(k)) declared.set(k, v);
  const marks = [];
  lines.forEach((ln, i) => {
    if (isContentsLine(ln)) return;
    /* THE DECLARED FORM IS TRIED FIRST AND HAS NO LENGTH CAP. It cannot fire on running prose,
     * because prose does not open a line with a clause number followed by that clause's own
     * declared title. Where it fires, the title and the text boundary are the document's. */
    let declHit = null;
    const lead = /^\s{0,8}([A-Z]?\.?\d+(?:\.\d+){0,3})[\s\t]+(.*)$/.exec(ln);
    if (lead) {
      const t = declared.get(lead[1].replace(/^\./, ""));
      if (t && lead[2].toLowerCase().startsWith(t.toLowerCase())) {
        declHit = { num: lead[1], title: t, rest: lead[2].slice(t.length) };
      }
    }
    const m = declHit
      ? [ln, declHit.num, declHit.title]
      : (ISO_HEADING.exec(ln) || ISO_HEADING_TABBED.exec(ln));
    /* DEBUG_HEADING=<clause> traces why one clause is or is not recognised as a heading. Added because
     * the declared-title rule is enabled for every source and 9.2.1 still missed, so the question was
     * which of the three tests rejected the line rather than whether the rule was on. */
    if (process.env.DEBUG_HEADING && ln.includes(process.env.DEBUG_HEADING)) {
      console.error("[heading] line=" + (i + 1) + " indent=" + (ln.length - ln.trimStart().length) +
        " contentsLine=" + isContentsLine(ln));
      console.error("[heading]   lead=" + (lead ? JSON.stringify(lead[1]) : "no") +
        " declaredTitle=" + JSON.stringify(lead ? declared.get(lead[1].replace(/^\./, "")) : null) +
        " declHit=" + (declHit ? JSON.stringify(declHit.title) : "no"));
      console.error("[heading]   ISO_HEADING=" + (ISO_HEADING.exec(ln) ? "match" : "no") +
        " TABBED=" + (ISO_HEADING_TABBED.exec(ln) ? "match" : "no") +
        " -> " + (m ? "HEADING " + m[1] : "REJECTED"));
    }
    if (!m) return;
    let num = m[1].replace(/^\./, "").replace(/^([A-Z])(\d)/, "$1.$2");
    /* NO ISO CLAUSE NUMBER HAS A ZERO COMPONENT, and a table of decimals does. ISO/IEC 42006's
     * Annex B tabulates audit-time adjustment factors -- "1.0 to 2.0", "0.5 to 1.0" -- and inside
     * an annex those became clause B.1.0 and B.0.5, one of them ten characters long. The loader's
     * 20-character CHECK refused the batch, which is the validate-before-writing rule doing its
     * job; this stops the row existing at all. Clause numbers run 4.1, 9.3.2, A.8.34: a component
     * of exactly "0", or one with a leading zero, is a number from the page and not an address.
     *
     * A LEADING ZERO COMPONENT IS THE EXCEPTION AND IT IS REAL: ISO numbers an INTRODUCTION 0.1,
     * 0.2, 0.3, and ISO/IEC 27002 has seven of them. The first version of this rule rejected the
     * whole component set and took all seven with it -- a correct clause deleted to remove a table
     * cell. So only a zero component AFTER the first is a page number, which still rejects B.1.0
     * and B.0.5 while keeping 0.1 to 0.7.
     *
     * AND IT IS TESTED AFTER THE ANNEX PREFIX, not before. Tested before, clause `0.1` passes --
     * its only later component is "1" -- and is then prefixed to `B.0.1`, so seven copies of
     * 27002's introduction survived inside Annex B while the rule that should have caught them had
     * already run. The id the library stores is the id the rule has to judge. */
    /* A bare numeric address inside an annex belongs to that annex. An address that already
     * carries its own letter (B.6.2.6, D.2) is left exactly as the document wrote it. */
    if (annexOf[i] && /^\d/.test(num)) num = annexOf[i] + "." + num;
    {
      const parts = num.split(".");
      const bad = parts.slice(1).some((c) => /^\d/.test(c) && (c === "0" || /^0\d/.test(c)));
      if (bad) return;
    }
    marks.push({
      clause: num,
      title: m[2].trim().slice(0, 90),
      rest: declHit ? declHit.rest : m[2],
      restIsText: !!declHit && declHit.rest.trim().length > 0,
      line: i,
    });
  });
  if (opts && opts.paragraphGrain) {
    /* The heading marks with their LINES, because the paragraph guard walks both streams in
     * document order. A Set of ids was enough for de-duplication and not for sequencing. */
    for (const pm of paragraphMarks(lines, declared, marks.slice())) marks.push(pm);
  }

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
  const table = splitAnnexTable(lines, tableAt, opts && opts.annexTableAuthoritative === true);
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
  if (process.env.DEBUG_CLAUSE) {
    const c = process.env.DEBUG_CLAUSE;
    const t = table.find((x) => x.clause === c);
    const b = body.find((x) => x.clause === c);
    console.error("[union " + c + "] table=" + (t ? JSON.stringify(String(t.text).slice(0, 60)) : "ABSENT") +
      " substantive=" + (t ? isSubstantive(t.text) : "-") + " inFromTable=" + fromTable.has(c));
    console.error("[union " + c + "] headingPass=" + (b ? JSON.stringify(String(b.text).slice(0, 60)) : "ABSENT"));
  }
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
    /* THE TERM MAY BEGIN WITH AN INITIALISM. The lookahead was `(?=[a-z])`, on the ground
     * that ISO writes defined terms in lower case -- and ISO/IEC 42001's 3.24 is
     * "AI system impact assessment", so the marker was rejected and the definition the live
     * bank cites was absent from the library. The lowercase requirement is still what keeps a
     * cross-reference out (a "3.28]" inside a [SOURCE: ...] bracket is not followed by a
     * letter at all), so it is widened rather than dropped: lower case, or a short
     * ALL-CAPS run followed by a space, which is what an initialism looks like. */
    const re = new RegExp("(^|[^(\\d.])" + top + "\\." + k + "\\s+(?=[a-z]|[A-Z]{2,4}\\s)", "g");
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

function splitIsoWithTerms(text, declaredSeed, opts) {
  const headings = splitIso(text, declaredSeed, opts);
  const defs = splitDefinitions(text, headings);
  const have = new Set(headings.map((h) => h.clause));
  return [...headings, ...defs.filter((d) => !have.has(d.clause))];
}

/* ============================================================================
 * THE SOURCES JUAN SUPPLIED, IN THE SAME EXTRACTOR
 * ============================================================================
 *
 * One extractor, one completeness check -- his instruction, and the right one: a second pipeline
 * would be a second implementation of clause splitting, and the two would diverge exactly where
 * it matters (which text a gate checks a quotation against).
 *
 * Each of these is a different document GENRE, not a different pipeline. A Regulation numbers
 * articles and paragraphs; a framework names functions and categories; a BS adoption wraps an ISO
 * standard in national furniture. The splitters differ; everything downstream does not.
 */

/**
 * EU AI Act, Regulation (EU) 2024/1689, from the Official Journal.
 *
 * THREE GRAINS, because the citations in our bank use three:
 *   Art. 50(2)        an article's numbered paragraph -- the obligation grain
 *   Annex III 4(a)    an annex point, to its letter
 *   Recital 27        classed informative, ALWAYS: a recital explains, it never requires
 *
 * Plain `pdftotext` is the mode: it puts "Article 50 <title>" on one line and each numbered
 * paragraph on its own, which is exactly the paragraph grain. `-layout` splits the heading from
 * its title and wraps paragraphs, so it would need reassembling to get back to the same thing.
 */
/* ============ THE SAME SPLITTER IN THREE LANGUAGES, WITHOUT TYPING AN ACCENT ============
 *
 * The Spanish edition heads its articles `Articulo` WITH AN ACUTE ACCENT on the i, and the
 * Portuguese `Artigo`. Typing either into this file would violate the ASCII-only rule that protects
 * every transport here, and building them from `String.fromCharCode` would put two spellings in the
 * source for one concept. `Art` followed by non-space is all three, and the number after it is what
 * makes the line an article heading rather than the word "Artificial".
 *
 * These are the ONLY language-dependent tokens in the EU splitter: recitals are `(N)`, paragraphs
 * are `N.` or `(N)`, annex points are `N.` and `(a)`, and annex numbers are Roman in all three. That
 * is why one splitter can carry three languages -- and it is why an alignment assertion is worth
 * something: the structure is supposed to be identical, so a difference is a finding. */
const EU_ARTICLE = /^\s*Art\S{0,10}\s+(\d{1,3})\s*(.*)$/;
/* PORTUGUESE WRITES THE ARTICLE NUMBER AS AN ORDINAL -- "Artigo 1.o Objeto" -- so a pattern
 * requiring whitespace after the digit found no Article 1, and with no article boundary the whole
 * document was treated as front matter: EVERY Portuguese article came back absent while 300 rows
 * aligned happily, because recitals and annex points are numbered the same in all three languages.
 * A partial success is what made it look like a translation-coverage fact rather than my regex. */
const EU_ARTICLE_1 = /^\s*Art\S{0,10}\s+1(?![0-9])/;
const EU_ANNEX = /^\s*(?:ANNEX|ANEXO)\s+([IVXL]+)\b(.*)$/;

function splitEuAct(text) {
  const lines = String(text).replace(CONTROL_BYTES, "").split(/\r?\n/);
  const out = [];

  /* Where the articles begin. Everything before it that looks like "(N)" is a RECITAL; the same
   * shape after it is a cross-reference or a lettered point, so the boundary is what makes the
   * recital pass safe. */
  const firstArticle = lines.findIndex((l) => EU_ARTICLE_1.test(l));
  const bodyStart = firstArticle < 0 ? lines.length : firstArticle;

  /* ---- recitals ---- */
  {
    const marks = [];
    for (let i = 0; i < bodyStart; i++) {
      const m = /^\s*\((\d{1,3})\)\s+(\S.*)$/.exec(lines[i]);
      if (!m) continue;
      const n = Number(m[1]);
      /* Sequential only: the recitals run 1..180 in order, so a number that goes backwards is a
       * citation inside a recital rather than the start of one. */
      if (marks.length && n !== marks[marks.length - 1].n + 1) continue;
      if (!marks.length && n !== 1) continue;
      marks.push({ n, line: i, lead: m[2] });
    }
    marks.forEach((mk, k) => {
      const end = k + 1 < marks.length ? marks[k + 1].line : bodyStart;
      const body = [mk.lead, ...lines.slice(mk.line + 1, end)].map((s) => s.trim())
        .filter(Boolean).join(" ").replace(/\s{2,}/g, " ").trim();
      if (body.length >= 40) {
        out.push({ clause: "Recital " + mk.n, title: null, text: body, forceNormative: "informative" });
      }
    });
  }

  /* ---- articles, at paragraph grain ---- */
  const artMarks = [];
  for (let i = bodyStart; i < lines.length; i++) {
    if (EU_ANNEX.test(lines[i])) break;
    const m = EU_ARTICLE.exec(lines[i]);
    if (!m) continue;
    /* PARAGRAPH 1 CAN SIT ON THE HEADING LINE, and where it does the whole article was arriving as
     * a TITLE. One article per edition does this -- EN Article 64 (AI Office) and PT Artigo 98 --
     * so it is rare enough to have looked like a translation difference and common enough to cost
     * two of the four structural differences reported. The split point is " 1. ", paragraph one:
     * an article title can carry a number ("Regulation (EU) No 167/2013") and does not carry that. */
    /* AN ARTICLE HEADING IS SEQUENTIAL; A CROSS-REFERENCE IS NOT. "Article 18 of Regulation (EU)
     * 2019/1020 shall apply mutatis mutandis" sits inside Article 97's text and was read as a
     * heading, producing a second `Art. 18` row whose text was the NEXT heading it swallowed --
     * junk at a real address, and it is the row a lookup for Art. 18 could have returned.
     *
     * It was found by the alignment check: neither translation produced that row, which read as a
     * translation gap and was an English defect. Same guard as the recitals directly above. */
    const nextNum = Number(m[1]);
    if (artMarks.length ? nextNum !== Number(artMarks[artMarks.length - 1].num) + 1 : nextNum !== 1) continue;
    const rest = (m[2] || "").trim();
    const at = rest.search(/\s1\.\s/);
    artMarks.push({
      num: m[1],
      title: at > 0 ? rest.slice(0, at).trim() : rest,
      inline: at > 0 ? rest.slice(at + 1).trim() : "",
      line: i,
    });
  }
  artMarks.forEach((am, k) => {
    const end = k + 1 < artMarks.length ? artMarks[k + 1].line
      : lines.findIndex((l, i) => i > am.line && EU_ANNEX.test(l));
    const stop = end < 0 ? lines.length : end;
    /* ONE LINE CAN CARRY SEVERAL PARAGRAPHS, so the segment is expanded before it is scanned. The
     * paragraph loop works a line at a time, and this edition puts "1. ... 2. ..." on a single
     * line wherever the typesetting ran them together -- which is why Article 64 reported one
     * paragraph against the translations' two even after the heading-line fix.
     *
     * Splitting on every " N. " OVER-SPLITS on purpose: "Regulation (EU) No 182/2011. 2. Caso"
     * is indistinguishable from a paragraph start by any local test. The SEQUENCE GUARD downstream
     * is what makes that safe -- a fragment whose number does not advance is folded back into the
     * paragraph above it, which is exactly where it came from. */
    const expand = (ln) => String(ln).split(/(?=\s\d{1,2}\.\s)/g).map((x) => x.trim());
    const seg = [am.inline, ...lines.slice(am.line + 1, stop)]
      .flatMap(expand).filter((x) => x !== "");

    /* Numbered paragraphs. An unnumbered line continues the paragraph above it -- Article 50(4)
     * has a second unnumbered paragraph, and attaching it to 50(4) is what the citation means. */
    /* TWO PARAGRAPH NUMBERINGS, AND THE DEFINITIONS ARTICLE USES THE SECOND ONE.
     *
     * Most articles number paragraphs "1." on their own line. ARTICLE 3 -- Definitions, the most
     * cited article in the Regulation -- numbers its 68 definitions "(1)", "(2)" in parentheses,
     * so a matcher for the first form collapsed every definition into a single `Art. 3` row and
     * `Art. 3(1)` did not exist. That is the id our bank uses for the definition of an AI system.
     *
     * The parenthesised form is accepted with a SEQUENCE GUARD: it counts only when it advances
     * from the previous one, so "(58) Directive (EU) 2020/1828" inside a paragraph is a citation
     * rather than the start of paragraph 58. A lettered "(a)" cannot match either pattern. */
    const paras = [];
    let cur = null, lastNum = 0;
    for (const raw of seg) {
      const ln = raw.trim();
      if (!ln) continue;
      const dotted = /^(\d{1,2})\.\s+(\S.*)$/.exec(ln);
      const paren = /^\((\d{1,3})\)\s+(\S.*)$/.exec(ln);
      /* A THIRD FORM, AND IT IS THE DEFINITIONS ARTICLE IN SPANISH AND PORTUGUESE. English writes
       * "(1)" and the Spanish edition writes "1)" -- same article, same 68 definitions, one bracket
       * apart -- so Art. 3 came back with 68 paragraphs in English and ZERO in Spanish. It is
       * covered by the same sequence guard as the other two, which is what keeps a "1)" inside a
       * lettered list from starting a paragraph. */
      const trailing = /^(\d{1,3})\)\s+(\S.*)$/.exec(ln);
      const m = dotted || paren || trailing;
      if (m && Number(m[1]) === lastNum + 1) {
        lastNum = Number(m[1]);
        cur = { p: m[1], parts: [m[2]] };
        paras.push(cur);
        continue;
      }
      if (cur) cur.parts.push(ln);
      else { cur = { p: null, parts: [ln] }; paras.push(cur); }
    }
    for (const pa of paras) {
      const body = pa.parts.join(" ").replace(/\s{2,}/g, " ").trim();
      if (body.length < 40) continue;
      out.push({
        clause: pa.p ? "Art. " + am.num + "(" + pa.p + ")" : "Art. " + am.num,
        title: am.title || null, text: body,
      });
    }
    /* The article's own title is worth a row when it has no numbered paragraphs at all. */
    if (!paras.length && am.title) {
      out.push({ clause: "Art. " + am.num, title: am.title, text: am.title });
    }
  });

  /* ---- annexes, at point grain ---- */
  const annexMarks = [];
  lines.forEach((l, i) => {
    const m = EU_ANNEX.exec(l);
    if (m) annexMarks.push({ roman: m[1], title: (m[2] || "").trim(), line: i });
  });
  annexMarks.forEach((an, k) => {
    const end = k + 1 < annexMarks.length ? annexMarks[k + 1].line : lines.length;
    let point = null, letter = null, buf = [];
    const flush = () => {
      const body = buf.join(" ").replace(/\s{2,}/g, " ").trim();
      if (body.length >= 40) {
        const id = "Annex " + an.roman + (point ? " " + point : "") + (letter ? "(" + letter + ")" : "");
        out.push({ clause: id, title: an.title || null, text: body });
      }
      buf = [];
    };
    for (let i = an.line + 1; i < end; i++) {
      const ln = (lines[i] || "").trim();
      if (!ln) continue;
      if (/^\d{1,3}\/\d{1,3}$/.test(ln)) continue;          /* page furniture: "82/144" */
      const pm = /^(\d{1,2})\.\s*(.*)$/.exec(ln);
      /* `(a)` in English, `a)` in Spanish and Portuguese -- the same one-bracket difference as the
       * definitions numbering, and it cost 81 of the 83 unaligned annex points. Both accepted. */
      const lm = /^\(?([a-z])\)\s*(.*)$/.exec(ln);
      if (pm) { flush(); point = pm[1]; letter = null; buf = pm[2] ? [pm[2]] : []; continue; }
      if (lm) { flush(); letter = lm[1]; buf = lm[2] ? [lm[2]] : []; continue; }
      buf.push(ln);
    }
    flush();
  });
  return out;
}

/**
 * NIST AI RMF 1.0. The Core's functions and categories, plus the numbered sections of Parts 1
 * and 2.
 *
 * VOLUNTARY GUIDANCE, SO NEVER `shall`. The framework says "should" and describes; it imposes
 * nothing. An item that reads a NIST category as a requirement is making a claim no document
 * supports, and the modal gate is what has to refuse it -- so the ceiling is enforced here, at
 * extraction, rather than left to whatever modal a sentence happens to contain.
 */
function splitNist(text) {
  const lines = String(text).replace(CONTROL_BYTES, "").split(/\r?\n/);
  const marks = [];
  lines.forEach((l, i) => {
    const t = l.trim();
    const core = /^(GOVERN|MAP|MEASURE|MANAGE)\s+(\d+(?:\.\d+)?)\s*:\s*(.*)$/.exec(t);
    if (core) { marks.push({ clause: core[1] + " " + core[2], title: core[3].trim(), line: i }); return; }
    const sec = /^(\d+(?:\.\d+){0,2})\s+([A-Z][^\n]{3,90})$/.exec(t);
    if (sec && !isContentsLine(t)) marks.push({ clause: sec[1], title: sec[2].trim(), line: i });
  });
  const lastOf = new Map();
  for (const m of marks) lastOf.set(m.clause, m);
  const ordered = [...lastOf.values()].sort((a, b) => a.line - b.line);
  const out = [];
  ordered.forEach((h, i) => {
    const end = i + 1 < ordered.length ? ordered[i + 1].line : lines.length;
    const body = lines.slice(h.line + 1, end).map((s) => s.trim()).filter(Boolean)
      .join(" ").replace(/\s{2,}/g, " ").trim();
    const text2 = (h.title ? h.title + " " : "") + body;
    if (text2.trim().length >= 40) {
      /* `forceNormative` caps it: voluntary guidance is never a requirement. */
      out.push({ clause: h.clause, title: h.title, text: text2.trim(), capNormative: "should" });
    }
  });
  return out;
}

/**
 * EBM Guide. Sections and the Key Value Area names.
 *
 * INFORMATIVE THROUGHOUT, and it carries no numbering of its own, so the ids are its own
 * headings. THAT MAKES ITS DECLARED POPULATION WEAKER THAN EVERY OTHER SOURCE HERE and the report
 * says so rather than implying a clause list exists.
 */
function splitEbm(text) {
  const lines = String(text).replace(CONTROL_BYTES, "").split(/\r?\n/);
  const KVA = ["Unrealized Value", "Current Value", "Ability to Innovate", "Time-to-Market"];
  const marks = [];
  lines.forEach((l, i) => {
    const t = l.trim();
    if (!t || t.length > 70) return;
    if (isContentsLine(t)) return;
    /* A heading here is a short line that is title case and ends without a full stop. The KVA
     * names are declared by name so they cannot be missed by a shape test. */
    const isKva = KVA.some((k) => t === k || t === k + ":");
    const looksHeading = /^[A-Z][A-Za-z0-9 ()\/&'-]{3,68}$/.test(t) && !/[.;:]$/.test(t);
    if (isKva || looksHeading) marks.push({ clause: t.replace(/:$/, ""), title: t.replace(/:$/, ""), line: i });
  });
  const lastOf = new Map();
  for (const m of marks) lastOf.set(m.clause, m);
  const ordered = [...lastOf.values()].sort((a, b) => a.line - b.line);
  const out = [];
  ordered.forEach((h, i) => {
    const end = i + 1 < ordered.length ? ordered[i + 1].line : lines.length;
    const body = lines.slice(h.line + 1, end).map((s) => s.trim()).filter(Boolean)
      .join(" ").replace(/\s{2,}/g, " ").trim();
    if (body.length >= 60) out.push({ clause: h.clause, title: h.title, text: body, forceNormative: "informative" });
  });
  return out;
}

/**
 * A BS or BS EN adoption of an ISO standard: the same text behind national furniture.
 *
 * THE NATIONAL FOREWORD AND COVER PAGES ARE FURNITURE, and the director's instruction is to strip
 * them and ASSERT the body starts at ISO clause 1. That assertion is the point: a foreword left in
 * place would put BSI's own sentences into a library the gates quote from as if they were the
 * standard's.
 */
/* ============ THE RUNNING HEADER IS FURNITURE AND IT SITS MID-SENTENCE ============
 *
 * `stripFurniture` catches the ISO form `ISO/IEC 42001:2023(E)`, and a BS adoption prints its own
 * on every page, in two shapes neither of which that pattern matches -- the first has no language
 * suffix at all and the second carries a part number the pattern's `\d{4,5}` cannot hold:
 *
 *     8 BS ISO/IEC 42006:2025
 *     9 BS EN ISO/IEC 17021-1:2015 ISO/IEC 17021-1:2015(E)
 *
 * They were landing INSIDE clauses -- 30 passages in 42006 and 42 in 17021-1 -- because the page
 * break falls mid-sentence and `stripFurniture` turns the form feed into a space. Removing them at
 * WHOLE-LINE grain, before anything joins lines, is what lets the sentence close up cleanly; doing
 * it on the joined passage leaves the page number behind in the middle of a requirement.
 *
 * THE PAGE NUMBER IS IDENTIFIED BY ITS NEIGHBOUR, NOT BY BEING A NUMBER. A line holding only a
 * digit or a roman numeral is a clause number in a contents list and a page number next to a page
 * header; stripping bare numbers on sight would have eaten the contents numbering this extractor
 * now depends on. Adjacency is the evidence. */
const BS_RUNNING_HEADER = new RegExp(
  "^BS(?:\\s+EN)?\\s+ISO(?:/IEC)?\\s*\\d{4,5}(?:-\\d+)?(?::\\d{4})?" +
  "(?:\\s+ISO(?:/IEC)?\\s*\\d{4,5}(?:-\\d+)?(?::\\d{4})?\\s*\\([A-Za-z]{1,3}\\))?$", "i");
const ISO_RUNNING_HEADER = new RegExp(
  "^ISO(?:/IEC)?\\s*\\d{4,5}(?:-\\d+)?(?::\\d{4})?\\s*\\([A-Za-z]{1,3}\\)$", "i");
const PAGE_NUMBER_ONLY = /^(?:\d{1,4}|[ivxlcdm]{1,7})$/i;

/* A FORM FEED IS THE PAGE BOUNDARY, AND THAT IS WHAT MAKES A BARE NUMBER A PAGE NUMBER. ITIL 4
 * prints no running header -- just the page number, alone on a line, against the page break -- so
 * the header-adjacency rule above has nothing to anchor on and six passages opened with a page
 * number where their first sentence should be. The form feed is the anchor instead. It is the same
 * argument: the evidence is the NEIGHBOUR, never the fact that the line holds only digits. */
const FORM_FEED = String.fromCharCode(12);

function stripRunningHeaders(lines) {
  const drop = new Set();
  const norm = (s) => String(s).replace(CONTROL_BYTES, "").replace(/\f/g, "").trim();
  const nextNonBlank = (from, step) => {
    for (let j = from; j >= 0 && j < lines.length; j += step) {
      if (norm(lines[j])) return j;
    }
    return -1;
  };
  for (let i = 0; i < lines.length; i++) {
    const t = norm(lines[i]);
    if (!t || (!BS_RUNNING_HEADER.test(t) && !ISO_RUNNING_HEADER.test(t))) continue;
    drop.add(i);
    /* Walk outward past blanks in both directions for the page number that belongs to this
     * header. Both directions, because the number sits before the form feed on one page and the
     * ISO sub-header follows it on the next. */
    for (const step of [-1, 1]) {
      for (let j = i + step; j >= 0 && j < lines.length; j += step) {
        const u = norm(lines[j]);
        if (!u) continue;
        if (PAGE_NUMBER_ONLY.test(u) && !drop.has(j)) drop.add(j);
        break;
      }
    }
  }
  /* Second pass: a numeric-only line whose nearest non-blank neighbour on either side begins at a
   * page break. Run after the header pass so a number already claimed by a header is not counted
   * twice, and never on a line some other rule kept. */
  for (let i = 0; i < lines.length; i++) {
    if (drop.has(i)) continue;
    if (!PAGE_NUMBER_ONLY.test(norm(lines[i]))) continue;
    const before = nextNonBlank(i - 1, -1), after = nextNonBlank(i + 1, 1);
    const atBreak = (j) => j >= 0 && String(lines[j]).indexOf(FORM_FEED) === 0;
    if (atBreak(after) || atBreak(before) || String(lines[i]).indexOf(FORM_FEED) === 0) drop.add(i);
  }
  return { kept: lines.filter((_, i) => !drop.has(i)), dropped: drop.size };
}

function splitIsoBs(text) {
  const lines = String(text).replace(CONTROL_BYTES, "").split(/\r?\n/);
  /* The LAST "1 Scope" that is a heading, because the contents lists it first. */
  let scopeAt = -1;
  lines.forEach((l, i) => { if (/^\s*1\s+Scope\s*$/.test(l) && !isContentsLine(l)) scopeAt = i; });
  if (scopeAt < 0) return { error: "no ISO clause 1 Scope heading -- the national furniture cannot be stripped safely" };
  const body = stripRunningHeaders(lines.slice(scopeAt));
  /* THE HEAD IS DISCARDED AS FURNITURE AND ITS CONTENTS LIST IS NOT. The titles are returned so
   * the caller can seed them; the BSI foreword itself never reaches the library. */
  return {
    lines: body.kept.join("\n"),
    scopeAt,
    headers: body.dropped,
    declared: contentsTitles(lines.slice(0, scopeAt)),
  };
}

/** ITIL 4 Foundation: numbered sections. `-layout` keeps each heading on its own line. */
function splitItil(text) {
  const lines = String(text).replace(CONTROL_BYTES, "").split(/\r?\n/);
  const marks = [];
  lines.forEach((l, i) => {
    const t = l.trim();
    const m = /^(\d+(?:\.\d+){0,3})\s+([A-Z][^\n]{3,90})$/.exec(t);
    if (m && !isContentsLine(t)) marks.push({ clause: m[1], title: m[2].trim(), line: i });
  });
  const lastOf = new Map();
  for (const m of marks) lastOf.set(m.clause, m);
  const ordered = [...lastOf.values()].sort((a, b) => a.line - b.line);
  const out = [];
  ordered.forEach((h, i) => {
    const end = i + 1 < ordered.length ? ordered[i + 1].line : lines.length;
    const body = lines.slice(h.line + 1, end).map((s) => s.trim()).filter(Boolean)
      .join(" ").replace(/\s{2,}/g, " ").trim();
    if (body.length >= 60) out.push({ clause: h.clause, title: h.title, text: body });
  });
  return out;
}

const split = (kind, text, declaredSeed, opts) => kind === "scrum" ? splitScrum(text)
  : kind === "amendment" ? splitAmendment(text)
  : kind === "euact" ? splitEuAct(text)
  : kind === "nist" ? splitNist(text)
  : kind === "ebm" ? splitEbm(text)
  : kind === "itil" ? splitItil(text)
  : splitIsoWithTerms(text, declaredSeed, opts);

/** shall / should / can / informative, from the passage's own strongest modal. */
/**
 * A DEFINITION IMPOSES NOTHING, WHATEVER ITS NOTES CONTAIN.
 *
 * `normativeOf` reads the strongest modal in a passage's own text, which is right for a
 * requirement clause and wrong for a terms-and-definitions entry: ISO/IEC 42001's clause 3.2
 * carries "can" in a NOTE and was classed `can`, so the modal gate treated it as licensing a
 * permission. It licenses nothing -- a definition says what a word means.
 *
 * The pilot refused a correct item on that basis (task 2.1), which is the right direction for
 * the wrong reason, and the director ruled the class: terms-and-definitions entries are
 * `informative` in every source. This is DECLARED by where the passage sits, never inferred
 * from its words -- exactly the distinction that makes the rest of the modal gate work.
 */
const isDefinitionClause = (kind, clause) => {
  const c = String(clause);
  /* ISO puts its definitions in clause 3.x. */
  if (kind !== "scrum" && kind !== "euact" && /^3(\.\d+)+$/.test(c)) return true;
  /* AND THE REGULATION PUTS ITS 68 DEFINITIONS IN ARTICLE 3. The director's ruling is about
   * definitions, not about a numbering convention: Art. 3(1) defines "AI system" and contains the
   * word "may" -- which classed it `can`, so it read as licensing a permission. A definition
   * licenses nothing whatever document it sits in. */
  if (kind === "euact" && /^Art\. 3\(\d+\)$/.test(c)) return true;
  return false;
};

/** The classes, strongest first. A cap lowers a class and can never raise one. */
const CLASS_ORDER = ["shall", "should", "can", "informative"];
function capClass(cls, cap) {
  if (!cap) return cls;
  const i = CLASS_ORDER.indexOf(cls), j = CLASS_ORDER.indexOf(cap);
  if (i < 0 || j < 0) return cls;
  return i < j ? cap : cls;     /* strongest allowed is the cap */
}

function normativeOf(text, opts = {}) {
  if (opts.definition) return "informative";
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
  /* A SOURCE MAY DECLARE ITS MODE, and the new documents do. Running both and taking the union is
   * right for an ISO PDF, where neither mode is reliably better. It is wrong for the Official
   * Journal: plain mode puts a whole numbered paragraph on one line, which IS the citation grain,
   * while -layout wraps it -- so unioning would mix two grains of the same article and the longer
   * of two differently-split texts would win arbitrarily. Where the grain depends on the mode, the
   * mode is part of the source's definition rather than a measurement. */
  const modes = s.mode === "plain" ? [false] : s.mode === "layout" ? [true] : [true, false];
  for (const layout of modes) {
    let text;
    let declaredSeed = null;
    try { text = pdfText(s.path, layout); } catch { continue; }

    /* A BS or BS EN adoption: strip the national furniture and ASSERT the body starts at ISO
     * clause 1. Failing loudly here is the point -- a foreword left in would put BSI's own
     * sentences into a library the gates quote from as the standard's. */
    if (s.bsAdoption) {
      const stripped = splitIsoBs(text);
      if (stripped.error) {
        problems.push(s.id + " " + s.edition + ": " + stripped.error);
        continue;
      }
      text = stripped.lines;
      declaredSeed = stripped.declared;
      /* PER MODE, NOT ONCE. Recording only the first mode's strip is what hid `decl0`: the figure
       * shown came from `-layout` while `plain` was the mode that produced every passage, so a
       * harvest that worked in one mode and not the other looked like a harvest that never worked. */
      modesUsed.push("bs-strip" + (layout ? "-layout" : "-plain") + "@" + stripped.scopeAt
        + "+hdr" + stripped.headers + "+decl" + stripped.declared.size);
    }

    if (s.stripPageNumbers) {
      const cleaned = stripRunningHeaders(text.split(/\r?\n/));
      text = cleaned.kept.join("\n");
      modesUsed.push("pagenum" + (layout ? "-layout" : "-plain") + ":-" + cleaned.dropped);
    }

    const got = split(s.kind, text, declaredSeed,
      { paragraphGrain: !!s.paragraphGrain, annexTableAuthoritative: !!s.annexTableAuthoritative });
    if (got.length) modesUsed.push((layout ? "-layout" : "plain") + ":" + got.length);
    for (const p of got) {
      /* THE TEXT AND THE TITLE ARE WON SEPARATELY. The longer text is the more complete
       * extraction, but `-layout` is the mode that can see a table's column boundary, so it
       * is often the only mode with a title while `plain` has the fuller statement. Keeping
       * whole records meant the recovered A.4.6 and A.9.4 arrived titleless -- and the task
       * mapping's strongest signal is the clause TITLE, so a titleless passage can never be
       * matched by the thing that matches best. */
      const prev = byClause.get(p.clause);
      if (!prev) { byClause.set(p.clause, p); continue; }
      /* ============ THE ANNEX TABLE OUTRANKS LENGTH, AND THIS WAS THE OVERWRITER ============
       *
       * `the longest text wins` is right for two renderings of the same prose and WRONG for a
       * two-column table, because a MISATTACHED row is longer than a correct one: it is the row's own
       * title plus a neighbour's statement. So the heading pass -- which, in this file's own words,
       * "matches whatever line happens to look like a heading" -- beat the table splitter on exactly
       * the six controls the 27002 witness flagged.
       *
       * That is why three separate fixes to the annex splitter each measured 0 passages changed: the
       * splitter was producing the correct statement, winning its own table-first union, and then losing
       * here on length. The table is the only thing that can read a table; for an address it produced,
       * it wins whatever the other pass found. */
      /* AND IT IS DECLARED PER SOURCE, because 42001 refused it. With the precedence applied to every
       * source, 42001's A.2.2 and A.2.4 stopped matching their expected content and the extractor's own
       * citation self-check refused the write -- its annex is not the interleaved two-column layout that
       * makes the table splitter the better reader. Whether 42001's annex has the same latent defect is
       * the subject of the Annex A/B witness, not something to assume from 27001's page design. */
      const tableWins = s.annexTableAuthoritative === true;
      const win = tableWins && prev.fromAnnexTable && !p.fromAnnexTable ? prev
        : tableWins && p.fromAnnexTable && !prev.fromAnnexTable ? p
        : p.text.length > prev.text.length ? p : prev;
      const other = win === p ? prev : p;
      if (!String(win.title || "").trim() && String(other.title || "").trim()) {
        win.title = other.title;
      }
      /* A DECLARED TITLE BEATS A LONGER ONE. The longest TEXT is the more complete extraction and
       * that rule stands, but a title is not a quantity: one mode can glue the clause's first
       * sentence onto the title while the other stops where the contents list says it stops. */
      if (other.titleDeclared && !win.titleDeclared) {
        win.title = other.title;
        win.titleDeclared = true;
      }
      byClause.set(p.clause, win);
    }
  }
  const best = { got: [...byClause.values()], modes: modesUsed.join(" + ") };
  if (!best.got.length) { problems.push(s.id + " " + s.edition + ": extracted ZERO passages in BOTH modes"); continue; }
  for (const p of best.got) {
    passages.push({
      source_id: s.id, edition: s.edition, clause: p.clause, title: p.title,
      text: stripFurniture(p.text).replace(/\s+/g, " ").trim(),
      /* The alternate reading of the same page, carried so the 27002 witness can choose after extraction.
       * Deleted again once the choice is made, so it never reaches the library. */
      textAlt: p.textAlt ? stripFurniture(p.textAlt).replace(/\s+/g, " ").trim() : undefined,
      /* THREE WAYS A PASSAGE'S CLASS IS DECIDED, and only the first reads the words:
       *
       *   normativeOf         the sentence's own strongest modal -- the ISO default
       *   forceNormative      DECLARED by the splitter and not negotiable. A recital explains and
       *                       never requires; the EBM Guide is informative throughout.
       *   capNormative        a CEILING. NIST is voluntary guidance, so a sentence containing
       *                       "shall" -- quoting someone else, or describing an obligation that
       *                       lives elsewhere -- must not make a NIST category a requirement.
       *
       * The cap is the one that matters for the gates: without it an item could assert a
       * requirement on the authority of a framework that imposes none, which is the invented
       * requirement this whole path exists to refuse. */
      normative: p.forceNormative ? p.forceNormative
        : capClass(normativeOf(p.text, { definition: isDefinitionClause(s.kind, p.clause) }), p.capNormative),
      extracted_from: s.path.split(/[\\/]/).pop(),
      chars: p.text.length,
    });
  }
  perSource.push({ id: s.id, edition: s.edition, passages: best.got.length,
    chars: best.got.reduce((a, b) => a + b.text.length, 0), mode: best.modes,
    ...licenceOf(s.id, s.edition) });
}

/* ============ PARALLEL TEXT, KEYED TO THE ENGLISH PASSAGE ID ============
 *
 * NOT a source. Each of these is the official translation of a source above, and its job is
 * TERMINOLOGY -- what the Regulation itself calls a deployer in Spanish -- so it has to sit at the
 * same address as the English or it cannot be looked up by the thing that needs it.
 *
 * TWO ALIGNMENT MECHANISMS, AND ONLY ONE OF THEM IS SOUND. The EU AI Act numbers its articles,
 * paragraphs and annex points identically in every language, so its rows align BY ID and a
 * difference is a real finding. The EBM Guide has no numbering at all -- its ids are its own English
 * headings -- so a translated heading can only be matched BY POSITION, which is an assumption about
 * the document rather than a fact about the text. It is therefore attempted only when the heading
 * COUNT matches, and reported as `by-order` rather than presented as equivalent to an id match.
 *
 * A row that cannot be aligned is reported UNALIGNED and written nowhere. This is the third state:
 * "no translation held" and "a translation we could not place" are different facts, and silently
 * dropping the second would make the coverage figure a claim about my aligner. */
const parallel = [];
const parallelReport = [];
const alignDiffs = [];
for (const q of PARALLEL) {
  const en = passages.filter((p) => p.source_id === q.of && p.edition === q.edition);
  if (!existsSync(q.path)) {
    parallelReport.push({ of: q.of, language: q.language, state: "FILE ABSENT", rows: 0 });
    continue;
  }
  let got = [];
  try {
    const raw = pdfText(q.path, q.mode === "layout");
    got = split(q.kind, raw, null, {});
  } catch (e) {
    parallelReport.push({ of: q.of, language: q.language, state: "could-not-extract: " + e.message, rows: 0 });
    continue;
  }
  const enById = new Map(en.map((p) => [p.clause, p]));
  let byId = 0, byOrder = 0, unaligned = 0;
  if (q.kind === "euact") {
    for (const p of got) {
      const hit = enById.get(p.clause);
      const body = String(p.text).replace(/\s+/g, " ").trim();
      if (!hit || body.length < 20) { unaligned++; continue; }
      byId++;
      parallel.push({
        source_id: q.of, edition: q.edition, language: q.language,
        clause: p.clause, text: body, aligned_by: "id",
        extracted_from: q.path.split(/[\\/]/).pop(),
      });
    }
  } else if (got.length === en.length) {
    /* Position alignment, and only because the counts agree. The English order is the order the
     * splitter emitted, which is document order in both editions. */
    for (let i = 0; i < got.length; i++) {
      const body = String(got[i].text).replace(/\s+/g, " ").trim();
      if (body.length < 20) { unaligned++; continue; }
      byOrder++;
      parallel.push({
        source_id: q.of, edition: q.edition, language: q.language,
        clause: en[i].clause, text: body, aligned_by: "order",
        extracted_from: q.path.split(/[\\/]/).pop(),
      });
    }
  } else {
    unaligned = got.length;
  }
  parallelReport.push({
    of: q.of, language: q.language,
    state: byId ? "aligned by id" : byOrder ? "aligned by ORDER (heading counts agree)"
      : "UNALIGNED -- " + got.length + " translated units against " + en.length + " English",
    rows: byId + byOrder, unaligned, extracted: got.length, english: en.length,
  });

  /* THE STRUCTURAL ASSERTION THE DIRECTOR ASKED FOR: every article number present in one language
   * must be present in the others, and an article whose PARAGRAPH COUNT differs is reported by
   * name. A translation that splits an article differently is either a extraction defect or a
   * genuine difference in the Official Journal, and both need a human to look. */
  if (q.kind === "euact") {
    const arts = (rows) => {
      const m = new Map();
      for (const r of rows) {
        const a = /^Art\. (\d{1,3})(?:\((\d{1,3})\))?$/.exec(r.clause);
        if (!a) continue;
        if (!m.has(a[1])) m.set(a[1], 0);
        if (a[2]) m.set(a[1], m.get(a[1]) + 1);
      }
      return m;
    };
    const A = arts(en), B = arts(got.map((p) => ({ clause: p.clause })));
    for (const [num, n] of A) {
      if (!B.has(num)) { alignDiffs.push({ language: q.language, article: num, issue: "ABSENT in translation" }); continue; }
      if (B.get(num) !== n) {
        alignDiffs.push({ language: q.language, article: num, issue: "paragraph count " + n + " EN vs " + B.get(num) });
      }
    }
    for (const num of B.keys()) {
      if (!A.has(num)) alignDiffs.push({ language: q.language, article: num, issue: "present in translation, ABSENT in English" });
    }
  }
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

  /* ============ THE NEW SOURCES, ONE CONTROL PER GRAIN THAT HAS A CITATION ============
   * Each is an id our bank actually cites, so a silent regression in any splitter stops the run
   * rather than producing a library that is quietly missing the grain people ask for. */
  ["EU AI Act", "2024/1689", "Art. 50(2)", /synthetic (?:audio|content)|machine-readable/i],
  ["EU AI Act", "2024/1689", "Art. 3(1)", /machine-based system/i],
  ["EU AI Act", "2024/1689", "Art. 3(4)", /deployer/i],
  ["EU AI Act", "2024/1689", "Annex III 4(a)", /recruitment|selection/i],
  ["EU AI Act", "2024/1689", "Recital 27", /risk-based approach/i],
  ["NIST AI RMF", "1.0", "GOVERN 1", /polic|process|procedure/i],
  ["NIST AI RMF", "1.0", "MAP 2", /categoriz|context|classif/i],
  /* THE 2024 EBM GUIDE DOES NOT USE ITS KEY VALUE AREA NAMES AS HEADINGS, so there is no
   * "Unrealized Value" id to control on. My first control named one and failed -- the CONTROL was
   * wrong about the document, not the extraction. What this guide heads is its section titles and
   * its individual MEASURE names, and both are controlled here instead. The four KVA names are
   * still reported as a named gap by the completeness check rather than silently absent. */
  ["EBM Guide", "2024", "EBM Uses Key Value Areas to Examine Improvement Opportunities", /key value area/i],
  ["EBM Guide", "2024", "Revenue per Employee", /revenue|employee/i],
  /* 7.2 is a CONTAINER in 42006 -- 7.2.1, 7.2.2.1 and 7.2.2.2 carry the text. Controlling on a
   * container asked the splitter for a row it is right not to produce. */
  ["ISO/IEC 42006", "2025", "7.1.2", /competence|technical/i],
  ["ISO/IEC 42006", "2025", "7.2.2.2", /auditor/i],
  /* 5.2 IS NOW A CONTAINER, AND THIS CONTROL CAUGHT THE MOMENT IT BECAME ONE -- it failed the
   * first run after `paragraphGrain` went on, which is a control working rather than a defect.
   * Re-pointing it at a paragraph would be editing the expectation until it agrees with the code,
   * so the paragraph it moved to is asserted HERE and the container state is asserted in
   * CONTAINER_CONTROLS below. Two assertions, because "5.2 is absent" and "5.2 is a clause with
   * children" are different facts and only the second one is true. */
  ["ISO/IEC 17021-1", "2015", "5.2.1", /undertaken impartially/i],
  ["ISO/IEC 17021-1", "2015", "5.2.3", /identify, analyse/i],
  ["ITIL 4 Foundation", "2019", "1.1", /service management|value/i],

  /* Recovered by the completeness check, which measures against the standard's own
   * declaration instead of against what the extractor found. Each of these was absent while
   * every coverage report said the document was complete. */
  ["ISO/IEC 42001", "2023", "3.24", /impact assessment/i],
  ["ISO/IEC 42001", "2023", "A.4.6", /human resources|competence/i],
  ["ISO/IEC 42001", "2023", "A.9.4", /intended use/i],
  ["ISO/IEC 27001", "2022", "7.1", /resources/i],
  ["ISO/IEC 27001", "2022", "7.4", /communication/i],
  ["ISO/IEC 27001", "2022", "10.1", /continual improvement/i],
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
/* ============ A CONTAINER CONTROL, BECAUSE ABSENT AND HAS-CHILDREN ARE DIFFERENT FACTS ============
 *
 * `paragraphGrain` turned ISO/IEC 17021-1 clause 5.2 from a row into a container, and the positive
 * control on it failed. The cheap response is to re-point the control at a paragraph and move on --
 * and that is how a control dies, because the next time 5.2 genuinely disappears nothing will say
 * so. These assert the container state itself: the clause has NO row of its own AND its children
 * are held. Both halves, so a document that lost clause 5.2 entirely fails here. */
const CONTAINER_CONTROLS = [
  ["ISO/IEC 17021-1", "2015", "5.2", 3],
  ["ISO 19011", "2026", "5.4", 2],
];
const ctnFail = [];
for (const [id, ed, clause, minKids] of CONTAINER_CONTROLS) {
  const mine = passages.filter((p) => p.source_id === id && p.edition === ed);
  const self = mine.some((p) => p.clause === clause);
  const kids = mine.filter((p) => p.clause.startsWith(clause + ".")).length;
  if (self) ctnFail.push(id + " " + ed + " " + clause + ": expected a CONTAINER, got a row of its own");
  else if (kids < minKids) {
    ctnFail.push(id + " " + ed + " " + clause + ": container with " + kids +
      " children held, expected at least " + minKids + " -- the clause may have been LOST, not nested");
  }
}

console.log("POSITIVE CONTROLS  " + (ctlFail.length ? "FAILED" : "all " + CONTROLS.length + " pass"));
for (const c of ctlFail) console.log("    " + c);
console.log("CONTAINER CONTROLS  " + (ctnFail.length ? "FAILED" : "all " + CONTAINER_CONTROLS.length + " pass"));
for (const c of ctnFail) console.log("    " + c);
for (const c of ctnFail) ctlFail.push(c);

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
    /* A HOLE WHOSE CHILDREN ARE ALL HELD IS A CONTAINER, NOT A MISS, and folding the two together
     * is the one-error-string-for-two-causes shape aimed at a coverage report. ISO 19011 clause 5.4
     * has no statement of its own -- 5.4.1 and 5.4.2 carry the text -- so no row is produced for it
     * and nothing is missing. Reported separately because only one of the two is work. */
    const held = new Set(passages
      .filter((p) => p.source_id === s.id && p.edition === s.edition).map((p) => p.clause));
    const hasChild = (c) => [...held].some((h) => h.startsWith(c + "."));
    const holes = [], containers = [];
    for (let i = ns[0]; i < ns[ns.length - 1]; i++) {
      if (set.has(i)) continue;
      const c = g + "." + i;
      (hasChild(c) ? containers : holes).push(c);
    }
    if (holes.length || containers.length) {
      seqGaps.push({ source_id: s.id, edition: s.edition, group: g, holes, containers });
    }
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
const seqMissed = seqGaps.filter((g) => g.holes.length);
const seqContainers = seqGaps.reduce((a, g) => a + g.containers.length, 0);
console.log("HOLES IN A NUMBERED SEQUENCE  " + seqMissed.reduce((a, g) => a + g.holes.length, 0) +
  "   (the document numbers consecutively, so these are MISSED, not absent)");
for (const g of seqMissed) {
  console.log("  " + (g.source_id + " " + g.edition).padEnd(30) + g.holes.join(" "));
}
if (!seqMissed.length) console.log("  none");
console.log("CONTAINERS, no statement of their own, every child held  " + seqContainers +
  "   (not work -- listed so the number above is not read as covering them)");
for (const g of seqGaps.filter((x) => x.containers.length)) {
  console.log("  " + (g.source_id + " " + g.edition).padEnd(30) + g.containers.join(" "));
}

console.log("");
console.log("PARALLEL TEXT  " + parallel.length + " rows at an English passage id");
for (const r of parallelReport) {
  console.log("  " + (r.of + " " + r.language).padEnd(28) + String(r.rows).padStart(4) +
    " rows   " + r.state + (r.unaligned ? "   unaligned " + r.unaligned : ""));
}
console.log("  ARTICLE STRUCTURE, EN against each translation  " +
  (alignDiffs.length ? alignDiffs.length + " difference(s)" : "identical"));
for (const d of alignDiffs.slice(0, 25)) {
  console.log("    " + d.language + "  Art. " + d.article + "  " + d.issue);
}
if (alignDiffs.length > 25) console.log("    ... and " + (alignDiffs.length - 25) + " more (in the JSON)");
console.log("  The Spanish edition is SPAIN Spanish. It is a REFERENCE for es-419, never a mandate;");
console.log("  the house glossary decides. Recorded here because a partner-facing term picked off");
console.log("  an EU translation would otherwise arrive with the Regulation's authority.");

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
/* ============ 27002's PER-CONTROL ATTRIBUTE TABLE IS FURNITURE, AND 27002 SAYS SO ITSELF ============
 *
 * Found 2026-09-28 while reading the candidates offered for ISMS-F task 4.8. **93 of 114 ISO/IEC 27002
 * passages began with the control's attribute table**, and the table extracts as column-interleaved
 * nonsense because it is a table:
 *
 *   Control type Information Cybersecurity Operational Security domains #Preventive security properties
 *   concepts capabilities #Governance_and_ #Confidentiality #Identify #Supplier_relation- Ecosystem
 *   #Protec- #Integrity ships_security tion #Availability Control Processes and procedures should be...
 *
 * The control's actual statement starts about forty tokens in. Three consequences, and the third is the one
 * that made this worth stopping for: the text is wrong at the head; an anchor quoted from it would be
 * hashtag soup; and **the judge sees 700 characters of which the first 250 are noise**, on the two
 * certifications about to be run.
 *
 * This is the interleaved-column defect already recorded against 27002's ANNEX A matrix, arriving in the
 * MAIN BODY through a different door -- and the fix is the same move that fixed the annex: ask what the
 * document says the thing IS. **ISO/IEC 27002 clause 4.3 "Control layout" declares it**:
 *
 *   "-- Control title ... -- Attribute table: A table shows the value(s) of each attribute ...
 *    -- Control: What the control is; -- Purpose: Why ...; -- Guidance: How ...; -- Other information ..."
 *
 * So the cut is a LOOKUP against the document's own declaration, not a test of the table's shape.
 *
 * TWO THINGS THE FIRST DRAFT GOT WRONG AND THE CONTROLS CATCH:
 *   - `Control type` is the attribute table's own first cell, so cutting at the first `Control` cuts
 *     nothing. Each occurrence is tried in order and the first leaving a SUBSTANTIVE remainder wins --
 *     the same rule that recovered A.4.6, where the separator sat at character 515 of 522.
 *   - clause 4.3 itself contains every one of those labels, as the declaration. Only passages in the
 *     control clauses 5 to 8 are touched, and 4.3 must come through unchanged.
 *
 * The attributes are DISCARDED rather than parsed into a field. They are recoverable only by reading the
 * PDF's columns, and a hand-parsed version of interleaved text would be a second copy that is wrong. */
{
  const before = passages.filter((p) => p.source_id === "ISO/IEC 27002").length;
  let cut = 0, noSep = 0;
  const substantive = (s) => String(s || "").trim().length >= 40 && /[a-z]{3}/.test(String(s || ""));
  const cutTable = (text) => {
    const s = String(text || "");
    /* every `Control` that is not the table cell `Control type`, earliest first */
    const re = /(?:^|\s)Control\s+(?!type\b)/g;
    let m;
    while ((m = re.exec(s))) {
      const rest = s.slice(m.index + m[0].length);
      if (substantive(rest)) return rest.trim();
    }
    return null;
  };
  for (const p of passages) {
    if (p.source_id !== "ISO/IEC 27002") continue;
    if (!/^[5-8]\./.test(String(p.clause))) continue;     /* control clauses only; 4.3 is the declaration */
    if (!/^Control type/.test(String(p.text || ""))) continue;
    const r = cutTable(p.text);
    if (r) { p.text = r; p.chars = r.length; cut++; } else noSep++;
  }
  /* ============ AND THE GATE FOUND AN OVER-RUN IT WAS NOT LOOKING FOR ============
   *
   * The hashtag control above refused the first write naming ONE clause: 5.31. The cut had worked; what
   * survived was a SECOND control's attribute table, because **5.31's passage runs past "Other information
   * No other information." into "5.32 Intellectual property rights Control type ..."** -- its end boundary
   * is wrong, 5.32's heading having not been recognised as one. 5.32 is held separately at 3,646 characters,
   * so this is an over-run and not a missing control, and the 93 are all present.
   *
   * Worth recording that SIZE could not have found it: 33 control passages exceed 4,000 characters and
   * almost all are legitimately long -- 8.8 is 10,557. The hashtag test names exactly one. A test for the
   * PROPERTY found what a test for the symptom would have buried in 33 false positives.
   *
   * The truncation asks the document again: cut at the earliest point where a LATER held control's own
   * declared heading -- its number followed by its title -- appears inside this passage. Those titles come
   * from the document's contents list, so nothing here is a guess about where a control ends. */
  let truncated = 0;
  const ctlList = passages.filter((p) => p.source_id === "ISO/IEC 27002" && /^[5-8]\./.test(String(p.clause)));
  const order = new Map(ctlList.map((p, i) => [p.clause, i]));
  for (const p of ctlList) {
    const mine = order.get(p.clause);
    let at = -1;
    for (const q of ctlList) {
      if (order.get(q.clause) <= mine || !q.title) continue;
      const needle = q.clause + " " + q.title;
      const k = String(p.text).indexOf(needle);
      if (k > 200 && (at < 0 || k < at)) at = k;
    }
    if (at > 0) {
      p.text = String(p.text).slice(0, at).trim();
      p.chars = p.text.length;
      truncated++;
    }
  }
  /* BOTH DIRECTIONS, on the live rows rather than on a fixture, because the population is the check. */
  const fails = [];
  const decl = passages.find((p) => p.source_id === "ISO/IEC 27002" && p.clause === "4.3");
  if (!decl || !/Attribute table/.test(String(decl.text || ""))) {
    fails.push("clause 4.3 Control layout is missing or no longer declares the attribute table -- the cut " +
      "rests on that declaration and must not run without it");
  }
  if (!decl || !/^The layout for each control/.test(String(decl.text || "").trim())) {
    fails.push("clause 4.3 was itself cut -- the declaration must come through untouched");
  }
  const still = passages.filter((p) => p.source_id === "ISO/IEC 27002" && /#Preventive|#Detective|#Corrective/
    .test(String(p.text || ""))).map((p) => p.clause);
  const stillCtl = still.filter((c) => /^[5-8]\./.test(c));
  if (stillCtl.length) fails.push("attribute hashtags survive in control clauses: " + stillCtl.join(", "));
  if (cut < 80) fails.push("only " + cut + " control(s) had a table cut; 27002 has 93 controls");
  const empty = passages.filter((p) => p.source_id === "ISO/IEC 27002" && /^[5-8]\./.test(String(p.clause)) &&
    !substantive(p.text)).map((p) => p.clause);
  if (empty.length) fails.push("control(s) left without a substantive statement: " + empty.join(", "));
  console.log("");
  console.log("ISO/IEC 27002 ATTRIBUTE TABLE, cut per clause 4.3's own declaration");
  console.log("  passages " + before + "   tables cut " + cut + "   no separator found " + noSep +
    "   over-runs truncated at the next control's declared heading " + truncated);
  if (fails.length) {
    console.error("  CONTROLS FAILED -- nothing written:");
    fails.forEach((f) => console.error("    " + f));
    process.exitCode = 3; process.exit();
  }
  console.log("  controls: 5 case(s), 0 fail");
}

/* ============ 27002 CHOOSES BETWEEN TWO READINGS OF THE SAME 27001 PAGE ============
 *
 * Ruled 2026-09-28, after three attempts to pick the right reading by shape all failed: one blanket rule
 * left six controls carrying a neighbour's statement, the opposite blanket rule shifted 79 of 93 by a row,
 * and restricting the mode cost eight main-body clauses. 27001's Annex A simply has two row layouts.
 *
 * So the extractor stops guessing. Each row carries BOTH readings -- same-line (`text`) and
 * right-column-after-its-own-header (`textAlt`) -- and the choice is made here, per row, by the only
 * instrument that can tell them apart: does ISO/IEC 27002's clause of the SAME number match this reading
 * better than either neighbour's does?
 *
 * 27002 CONTRIBUTES NO TEXT. Both candidates are 27001's own page; the witness only says which of the two
 * belongs to the number. `textAlt` is deleted afterwards so nothing downstream can mistake a candidate
 * for a passage.
 */
const witness27002 = (() => {
  const p2 = new Map(passages.filter((p) => p.source_id === "ISO/IEC 27002" && p.edition === "2022")
    .map((p) => [String(p.clause), p]));
  const nrm = (s) => String(s || "").toLowerCase().replace(/\bshall\b/g, "should")
    .replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  const runOf = (stmt, other) => {
    if (!other || !stmt) return 0;
    const a = nrm(stmt).split(" "), b = nrm(other).split(" ");
    const grams = new Set();
    for (let i = 0; i < b.length; i++) grams.add(b.slice(i, i + 4).join(" "));
    let best = 0;
    for (let i = 0; i < a.length; i++) {
      if (!grams.has(a.slice(i, i + 4).join(" "))) continue;
      let n = 4;
      while (i + n < a.length && grams.has(a.slice(i + n - 3, i + n + 1).join(" "))) n++;
      if (n > best) best = n;
    }
    return best;
  };
  const shift = (c, d) => {
    const [g, n] = c.slice(2).split(".").map(Number);
    return n + d >= 1 ? "A." + g + "." + (n + d) : null;
  };
  /* Score one candidate: its own run, and the best run any neighbour achieves against it. */
  const score = (clause, stmt) => {
    const own = runOf(stmt, (p2.get(clause.slice(2)) || {}).text);
    const nb = [shift(clause, 1), shift(clause, -1)].filter(Boolean)
      .map((c) => ({ c, r: runOf(stmt, (p2.get(c.slice(2)) || {}).text) }));
    const worst = nb.reduce((m, x) => (x.r > m.r ? x : m), { c: null, r: 0 });
    return { own, nbRun: worst.r, nbClause: worst.c, clean: own >= 6 && own >= worst.r };
  };
  return { score, has: (clause) => p2.has(clause.slice(2)) };
})();

const chosenRoute = new Map();
for (const p of passages) {
  if (p.source_id !== "ISO/IEC 27001" || p.edition !== "2022") continue;
  if (!/^A\.\d+\.\d+$/.test(String(p.clause))) { delete p.textAlt; continue; }
  const alt = p.textAlt;
  if (!alt || alt === p.text) { chosenRoute.set(p.clause, "same-line (no alternate)"); delete p.textAlt; continue; }
  const a = witness27002.score(p.clause, p.text);
  const b = witness27002.score(p.clause, alt);
  /* ============ THE DISCRIMINATOR IS THE NEIGHBOUR RUN, NOT THE OWN RUN ============
   *
   * My first rule was "prefer the clean candidate, then the higher own run", and it REGRESSED A.7.8 --
   * a control that was already correct at "Equipment shall be sited securely and protected." It chose a
   * candidate that had swallowed A.7.9 and A.7.10, because a bled reading still CONTAINS the row's own
   * sentence: its own run stays high while the contamination pushes the neighbour run up too.
   *
   * Worse, the gate could not catch it, because the gate scores the same way the chooser did -- one
   * instrument judging its own choice. Contamination is what distinguishes the two candidates, so the
   * rule is the LOWEST neighbour run, with the higher own run only as a tie-break. A correct statement
   * matches its own 27002 clause and barely matches its neighbours; that asymmetry is the signal. */
  let take = "same-line";
  if (b.nbRun < a.nbRun) take = "right-column";
  else if (b.nbRun === a.nbRun && b.own > a.own) take = "right-column";
  if (take === "right-column") {
    p.text = alt;
    p.chars = alt.length;
  }
  chosenRoute.set(p.clause, take + "  own " + (take === "right-column" ? b.own : a.own) +
    " vs neighbour " + (take === "right-column" ? b.nbRun : a.nbRun));
  delete p.textAlt;
}
/* A CANDIDATE IS NOT A PASSAGE. `textAlt` existed only so 27002 could choose between two readings, and it
 * leaked into 31 ISO/IEC 42001 rows on the first run because the delete ran only inside the 27001 branch.
 * Stripped from every passage here, so nothing downstream can read a candidate as library text. */
for (const p of passages) delete p.textAlt;
{
  const byRoute = [...chosenRoute.values()].reduce((m, v) => {
    const k = v.split(" ")[0]; m[k] = (m[k] || 0) + 1; return m;
  }, {});
  console.log("");
  console.log("27002 CHOSE BETWEEN TWO 27001 READINGS, per Annex A row");
  for (const [k, v] of Object.entries(byRoute)) console.log("  " + k.padEnd(16) + v);
}

/* ============ THE REVIEWED OVERRIDE, APPLIED BEFORE THE GATE SO THE GATE CHECKS IT ============
 *
 * Two rows resist every shape rule because NEITHER candidate reading is correct: a one-sentence statement
 * cell means the same-line reading carries the next control's statement too. `source-overrides-27001.json`
 * holds those two, copied from the PDF with their page numbers.
 *
 * IT IS APPLIED BEFORE THE WITNESS, NOT AFTER. An override the gate does not check is a second copy of a
 * fact with nothing watching it -- and the whole reason this gate exists is that a misattached statement
 * looks exactly like a correct one. It also asserts its own before-state: an override whose clause has
 * stopped being produced, or whose recorded defect no longer matches what the extractor emits, FAILS the
 * build rather than silently overwriting something it was not reviewed against.
 */
{
  /* EVERY override file, derived from the directory rather than named here. A second hardcoded path is how
   * two lists of one idea diverge; this way adding a source is adding a file. */
  const ovFiles = readdirSync(ROOT).filter((f) => /^source-overrides-.+\.json$/.test(f)).sort();
  console.log("");
  console.log("REVIEWED OVERRIDE FILES  " + ovFiles.length +
    (ovFiles.length ? ": " + ovFiles.join(", ") : " -- none found"));
  for (const ovFile of ovFiles) {
    const OV = join(ROOT, ovFile);
    const spec = JSON.parse(readFileSync(OV, "utf8"));
    const stale = [], applied = [];
    for (const o of spec.overrides || []) {
      const p = passages.find((x) => x.source_id === spec.source_id && x.edition === spec.edition &&
        String(x.clause) === o.clause);
      if (!p) { stale.push(o.clause + ": the extractor no longer produces this clause"); continue; }
      const cur = String(p.text || "");
      if (o.replaces_starts_with && !cur.startsWith(o.replaces_starts_with)) {
        stale.push(o.clause + ": the extracted text no longer starts with the reviewed defect -- re-review " +
          "before overriding. got: " + JSON.stringify(cur.slice(0, 70)));
        continue;
      }
      p.text = o.statement;
      p.chars = o.statement.length;
      if (o.title) p.title = o.title;
      /* THE PROVENANCE NAMES THE SOURCE IT CAME FROM, DERIVED, NOT TYPED. This read `"27001 PDF page"` as a
       * literal while the loop had already been generalised to every `source-overrides-*.json` file -- so
       * every ISO/IEC 42001 override recorded its provenance as 27001. A provenance line that names the wrong
       * document is worse than none: it is the one field a reader consults to go back and check. And `page`
       * is absent on overrides produced by a cut rather than from a page, so it is reported as its own state
       * rather than printed as `undefined`. */
      p.provenance = "reviewed override, " + spec.source_id + ":" + spec.edition +
        (o.page ? " PDF page " + o.page : " (" + (o.kind || "cut from the extracted text") + ", no page cited)");
      applied.push(o.clause);
    }
    console.log("  " + ovFile + "  applied " + applied.length +
      (applied.length ? " (" + applied.join(", ") + ")" : "") + "   stale " + stale.length);
    for (const st of stale) console.log("    STALE " + st);
    if (stale.length) {
      console.error("");
      console.error("REFUSING TO WRITE: an override no longer matches what the extractor produces.");
      console.error("A reviewed correction applied to text nobody reviewed is worse than no override.");
      process.exitCode = 3; process.exit();
    }
  }
}

/* ============ THE 27002 TWO-DIRECTION WITNESS, AS A GATE ON THE WRITE ============
 *
 * Ruled 2026-09-28: extraction FAILS if any ISO/IEC 27001 Annex A control matches a NEIGHBOUR better
 * than itself. That makes the six-control repair self-verifying and guards against the regression I
 * caused while attempting it -- a blanket right-column rule shifted 79 of 93 controls by one row, and
 * only an independent witness catches that. A count of extracted controls cannot: 93 stayed 93.
 *
 * THE WITNESS OWES NOTHING TO THIS EXTRACTOR'S 27001 READING. ISO/IEC 27002 states each control at the
 * same number in the guidance voice, so 27001's "Logs ... shall be produced" is 27002's "... should be
 * produced". Both neighbours are compared, because off-by-one has two directions and four of the six
 * live failures borrow BACKWARD -- a check that looks one way is half a check.
 */
{
  const p1 = new Map(passages.filter((p) => p.source_id === "ISO/IEC 27001" && p.edition === "2022")
    .map((p) => [String(p.clause), p]));
  const p2 = new Map(passages.filter((p) => p.source_id === "ISO/IEC 27002" && p.edition === "2022")
    .map((p) => [String(p.clause), p]));
  const nrm = (s) => String(s || "").toLowerCase().replace(/\bshall\b/g, "should")
    .replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  const runOf = (stmt, other) => {
    if (!other) return 0;
    const a = nrm(stmt).split(" "), b = nrm(other).split(" ");
    const grams = new Set();
    for (let i = 0; i < b.length; i++) grams.add(b.slice(i, i + 4).join(" "));
    let best = 0;
    for (let i = 0; i < a.length; i++) {
      if (!grams.has(a.slice(i, i + 4).join(" "))) continue;
      let n = 4;
      while (i + n < a.length && grams.has(a.slice(i + n - 3, i + n + 1).join(" "))) n++;
      if (n > best) best = n;
    }
    return best;
  };
  const shift = (c, d) => {
    const [g, n] = c.slice(2).split(".").map(Number);
    return n + d >= 1 ? "A." + g + "." + (n + d) : null;
  };
  const bad = [];
  let checked = 0, unwitnessed = 0;
  for (const [clause, p] of p1) {
    if (!/^A\.\d+\.\d+$/.test(clause)) continue;
    const own = p2.get(clause.slice(2));
    if (!own) { unwitnessed++; continue; }
    checked++;
    const ro = runOf(p.text, own.text);
    const nb = [shift(clause, 1), shift(clause, -1)]
      .map((c) => (c ? { c, r: runOf(p.text, (p2.get(c.slice(2)) || {}).text) } : null)).filter(Boolean);
    const worst = nb.reduce((m, x) => (x.r > m.r ? x : m), { c: null, r: 0 });
    if (worst.r >= 6 && worst.r > ro) {
      bad.push(clause + ": own " + ro + " words against " + worst.r + " for " + worst.c);
    }
  }
  console.log("");
  console.log("27002 WITNESS over ISO/IEC 27001 Annex A");
  console.log("  controls checked      " + checked + "   (no 27002 clause at that number: " + unwitnessed + ")");
  console.log("  matching a NEIGHBOUR better than themselves  " + bad.length);
  for (const b of bad) console.log("    " + b);
  if (bad.length) {
    console.error("");
    console.error("REFUSING TO WRITE: " + bad.length + " ISO/IEC 27001 Annex A control(s) carry a");
    console.error("neighbour's statement. A statement under the wrong control number resolves, passes every");
    console.error("gate, and hands an item the wrong requirement -- worse than a missing control.");
    console.error("Repair the extraction, or run with ALLOW_MISATTACHED_27001=1 to write anyway and say so.");
    if (process.env.ALLOW_MISATTACHED_27001 !== "1") { process.exitCode = 3; process.exit(); }
    console.error("ALLOW_MISATTACHED_27001=1 -- writing a library with " + bad.length + " known misattached controls.");
  }
}

/* ============ THE FILE READ AFTERWARDS MUST BE THE FILE THIS RUN WROTE ============
 *
 * Ruled 2026-09-28. Three fixes in a row measured "0 passages changed", and a stale or cached artifact
 * produces exactly that reading -- so the run now proves its own output's identity rather than leaving
 * the next reader to assume it. Path, mtime and sha256, before and after.
 *
 * It was NOT the cause here (the cause was the byClause length rule), and that is why this stays: the
 * hypothesis was cheap to test and expensive to leave open, and the next "0 changed" should not cost
 * another three rounds to rule out. */
const OUT_PATH = join(ROOT, "SOURCE-PASSAGES.json");
const sha = (p) => {
  try { return createHash("sha256").update(readFileSync(p)).digest("hex").slice(0, 16); }
  catch { return "(absent)"; }
};
const mtimeOf = (p) => {
  try { return statSync(p).mtime.toISOString(); } catch { return "(absent)"; }
};
const beforeSha = sha(OUT_PATH), beforeMtime = mtimeOf(OUT_PATH);

writeFileSync(OUT_PATH,
  JSON.stringify({
    sources: perSource, annex_gaps: annexGaps, sequence_gaps: seqGaps,
    parallel_report: parallelReport, parallel_align_diffs: alignDiffs,
    passages, parallel,
  }, null, 1) + "\n", "utf8");

const afterSha = sha(OUT_PATH), afterMtime = mtimeOf(OUT_PATH);
console.log("");
console.log("ARTIFACT IDENTITY");
console.log("  path    " + OUT_PATH);
console.log("  before  sha256 " + beforeSha + "   mtime " + beforeMtime);
console.log("  after   sha256 " + afterSha + "   mtime " + afterMtime);
if (beforeSha === afterSha) {
  console.log("  UNCHANGED BYTES -- this run produced a byte-identical artifact. If you expected a change,");
  console.log("  the change is not happening, and it is not a stale read.");
} else {
  console.log("  bytes changed, and the reader after this run sees THIS sha256");
}
console.log("wrote SOURCE-PASSAGES.json");
if (VERBOSE) {
  for (const s of perSource) {
    console.log("");
    console.log("=== " + s.id + " " + s.edition + "  (" + s.mode + ")");
    console.log(passages.filter((p) => p.source_id === s.id && p.edition === s.edition)
      .map((p) => p.clause).join(", "));
  }
}
