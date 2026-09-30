#!/usr/bin/env node
/**
 * census-hyphen-interleave.mjs -- which held passages are COLUMN-INTERLEAVED, by name.
 *
 * READ-ONLY. No writes, no network, no credential. Unknown flags exit 2.
 *
 * Ruled PROMPT-95 follow-up 2. `quote-noise` fired on nine grounded items and I reported two of them as
 * faithful quotes of a LIBRARY defect WITHOUT READING EITHER PASSAGE; one of the two was no such thing. So
 * before a single override is written, the question is asked of the WHOLE LIBRARY rather than of the two rows
 * a gate happened to surface: IS A.6.2.2 AN INSTANCE OR A MEMBER OF A FAMILY?
 *
 * A per-passage override is the right repair for an instance and the WRONG repair for a family -- a family
 * needs the extractor fixed, and writing sixty reviewed overrides is how a family goes unnoticed.
 *
 * ============ WHAT THE DEFECT IS ============
 *
 * ISO renders an Annex A control as a TWO-COLUMN TABLE ROW: the control's NAME on the left, its STATEMENT on
 * the right. Read line by line, the two columns alternate, so one row comes out as
 *
 *   "AI system requirements and spec- The organization shall specify and document require- ification ments
 *    for new AI systems or material enhancements to existing systems."
 *
 * -- left line 1, right line 1, left line 2, right line 2. Both columns wrapped mid-word at the same place,
 * so each stem is completed several words after the other column's text.
 *
 * ============ THE DETECTOR IS STRUCTURAL, AND MY FIRST TWO WERE NOT ============
 *
 * The signature is that THE TITLE CARRIES A REQUIREMENT SENTENCE. A control's name is a noun phrase: it has
 * no modal and no full stop. That property is already declared in CLAUDE.md, where the heading-line fix uses
 * it to decide whether a heading remainder is a title or a body. When the columns interleave, the right
 * column's `The organization shall ...` lands inside the title, and a name cannot contain that.
 *
 * TWO EARLIER DISCRIMINATORS WERE WRONG, BOTH IN THE FLATTERING DIRECTION, AND BOTH FOUND BY READING MEMBERS:
 *
 *   1. "an interleaved row carries TWO hyphen-wrap breaks, because both columns wrap." A.6.2.2 -- the row this
 *      was built for -- carries ONE, so the signature reported the founding case as a plain wrap.
 *   2. "the joined form is not a word this corpus uses." `requireification` IS a token of this corpus: the
 *      CONTAINER passage A.6.2 holds the identical interleave with the hyphen fully consumed, and A.8.2 does
 *      the same for A.8's `necesmation`. I had guarded against a row vouching for ITSELF and not against
 *      ANOTHER COPY OF THE SAME DEFECT vouching for it. The inventory was contaminated by what it was built
 *      to detect, and its own positive control is what said so.
 *
 * That second failure also proves the wrap-break test UNDER-REPORTS: the interleave has a second morphology
 * with no hyphen left at all (`requireification`, `specThe`), invisible to any hyphen rule. Both are reported.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". This script is READ-ONLY and takes none.");
  process.exit(2);
}
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));

/* A MODAL SENTENCE INSIDE A TITLE. The subject is required as well as the modal: "shall" alone would match a
 * legitimate title that happens to name a requirement, and the defect is specifically the other column's
 * SENTENCE arriving. Three languages are not needed -- the library is English-only. */
const TITLE_SENTENCE = /\b(the organization|the body|an organization|it)\s+(shall|should|must)\b/i;
/* AND THE SECOND MORPHOLOGY: THE NAME PREFIXED TO THE STATEMENT, WITH NOTHING IN THE TITLE.
 *
 * The census first carried only the title test, and its own derived control is what exposed the gap: of the
 * repaired rows, only nine put the other column's sentence INTO the title. The other twenty-eight ran the name
 * into the TEXT and left the title clean or empty, so a title-only detector could not have found any of them
 * -- it would have reported the family as nine when it is thirty-seven.
 *
 * TWO GRAMMAR-SHAPED VERSIONS OF THIS TEST FAILED FIRST, AND READING THE MEMBERS IS WHAT SAID SO. The second
 * was "a capitalised word some way into the text with a modal shortly after and none before" -- a positional
 * property, which is the form this repository's rules ask for, and it fired on 282 passages of which 182 were
 * the EU AI Act saying things like *"This Regulation should be applied in accordance with the values of the
 * Union"*. `Regulation` is a PROPER NOUN, and no test of capitalisation can tell one from a sentence opener.
 * A guard firing on 282 rows of ordinary prose is a design error, not a backlog.
 *
 * SO THE TEST IS ABOUT THE PASSAGE'S OWN TITLE, WHICH IS SPECIFIC TO THIS DEFECT AND NEEDS NO GRAMMAR. Three
 * named morphologies, each returning WHICH one fired, because they want different repairs:
 *
 *   title-repeated    the text begins with the passage's own title, then continues. `A.10.2` holds
 *                     "Allocating responsibilities The organization shall ensure ...".
 *   title-completed   the title was cut mid-phrase and the text opens with its tail, then repeats the whole
 *                     name. 27001's `A.5.2` holds title "Information security roles and" against text
 *                     "responsibilities Information security roles and responsibilities shall be defined".
 *   column-header     the text opens with the table's own column header, DECLARED by name. 42001's Annex B
 *                     guidance rows open "Control The organization should ...".
 *
 * None of the three can fire on prose, because none of them is about what the sentence looks like. */
const MODAL_W = /\b(shall|should|must)\b/i;
/* table column headers, declared with the table they come from */
const COL_HEADERS = [["Control Topic", "Table A.1 / Annex B"], ["Topic Control", "Table A.1"],
  ["Control", "Table A.1 and the Annex B guidance rows"], ["Topic", "Table A.1"]];
const squash = (s) => String(s || "").replace(/\s+/g, " ").trim();
function textBleeds(text, title) {
  const t = squash(text), ti = squash(title);
  if (ti.length >= 8 && t.length > ti.length + 4 && t.startsWith(ti)) return "title-repeated";
  /* the title was cut mid-phrase: its tail opens the text, and the completed name then occurs again */
  if (ti.length >= 8) {
    const firstTok = t.split(" ")[0];
    if (firstTok && firstTok.length >= 3) {
      const completed = ti + (/[A-Za-z]$/.test(ti) ? " " : "") + firstTok;
      if (t.slice(firstTok.length).includes(completed)) return "title-completed";
    }
  }
  for (const [h] of COL_HEADERS) {
    if (!t.startsWith(h + " ")) continue;
    /* a header prefix only counts when a requirement sentence follows it -- otherwise `Control` could be the
     * first word of a real sentence */
    if (MODAL_W.test(t.slice(h.length, h.length + 120))) return "column-header";
  }
  return null;
}
/* the hyphen-wrap break, a POSITIONAL property: no correct English puts whitespace after a mid-word hyphen */
const WRAP = /([A-Za-z]{2,})-\s+([A-Za-z]{2,})/g;
/* the no-hyphen morphology: a lower-case letter immediately followed by a capital, mid-token. `specThe`. */
const GLUED = /\b[a-z]{3,}[A-Z][a-z]{2,}\b/g;
/* ...minus the forms ISO writes that way on purpose */
const GLUED_OK = /^(e?Government|iPhone|eCommerce|eLearning|mySQL)$/;

const rows = [];
for (const p of lib.passages) {
  const title = String(p.title || ""), text = String(p.text || "");
  const titleSentence = TITLE_SENTENCE.test(title);
  const textBleed = textBleeds(text, title);
  WRAP.lastIndex = 0;
  const wraps = [...text.matchAll(WRAP), ...title.matchAll(WRAP)].map((m) => m[1] + "- " + m[2]);
  GLUED.lastIndex = 0;
  const glued = [...(text + " " + title).matchAll(GLUED)].map((m) => m[0]).filter((g) => !GLUED_OK.test(g));
  if (!titleSentence && !textBleed && !wraps.length && !glued.length) continue;
  rows.push({
    key: p.source_id + " " + p.edition + " " + p.clause,
    source: p.source_id, clause: String(p.clause),
    titleSentence, textBleed, wraps, glued: [...new Set(glued)],
    title, text,
  });
}

/* ============ THE VERDICTS, AND `title-repeated` IS WITHDRAWN AS ONE ============
 *
 * Reading the members split the bleed signal three ways, and only two of the three are defects:
 *
 *   column-header      REAL. The text opens with the table's own `Control` header and a requirement sentence.
 *                      Nothing else produces that.
 *   title-completed    REAL. The title was cut mid-phrase and its tail opens the text, which then repeats the
 *                      whole name -- 27001's `A.5.2`, `A.5.31`, `A.6.6`.
 *   title-repeated     A CANDIDATE, NOT A VERDICT, and it fired 237 times. 128 of those are clause-3
 *                      DEFINITIONS, where the library's own convention concatenates the term with its
 *                      definition -- `corrective action action to eliminate ...` is the term meeting its
 *                      definition, not a doubling, and misreading exactly that cost me a wrong diagnosis
 *                      earlier tonight. The other 109 are mixed: `27001 A.5.14`'s statement genuinely BEGINS
 *                      "Information transfer rules, procedures, or agreements shall be in place", so its name
 *                      and its opening words coincide with no defect at all, while `A.7.1` really does carry
 *                      its name plus the next control's number.
 *
 * NOTHING IN THE TEXT SEPARATES THOSE. The discriminator is the PDF's column layout, which only the override
 * generator reads -- so this census FINDS CANDIDATES and the generator DECIDES, and saying which does which is
 * the point. Reporting 237 as a defect count would be a guard firing on the house convention, which this
 * repository records as the kind that gets deleted along with its real assertion. */
const verdictOf = (r) => {
  if (r.titleSentence) return "INTERLEAVED (into the title)";
  if (r.textBleed === "column-header") return "DEFECT (column header in the text)";
  if (r.textBleed === "title-completed") return "DEFECT (title cut mid-phrase)";
  if (r.textBleed === "title-repeated") {
    return /^3(\.|$)/.test(r.clause) ? "convention (a clause-3 definition: term + definition)"
      : "CANDIDATE (text opens with its own name -- the layout decides)";
  }
  if (r.glued.length) return "SUSPECT (glued token)";
  return "wrap only";
};
for (const r of rows) r.verdict = verdictOf(r);
const ORDER = ["INTERLEAVED (into the title)", "DEFECT (column header in the text)",
  "DEFECT (title cut mid-phrase)", "SUSPECT (glued token)",
  "CANDIDATE (text opens with its own name -- the layout decides)",
  "convention (a clause-3 definition: term + definition)", "wrap only"];

/* ============ THE CONTROL RUNS ON THE REPAIRED ROWS' OWN BEFORE-STATE, NOT ON THE LIVE LIBRARY ============
 *
 * The first version asserted that 42001 A.6.2.2 -- the founding case -- comes back INTERLEAVED. It did, and
 * then the override landed and the control went red against a library in exactly the intended state. That is
 * the shape this repository records twice: a control that depends on a defect REMAINING in production forbids
 * repairing it, and a permanently red suite teaches people to read red as normal.
 *
 * SO THE FIXTURE IS DERIVED, NOT COPIED. Every de-columned override already carries `replaces_starts_with` --
 * the extractor's own before-state, which the extractor itself asserts before applying anything. Those strings
 * are the positive control: each MUST fire. The repaired titles are the negative control: none may fire. Both
 * arms survive the repair, neither is a second copy of anything, and the control gets stronger as more rows
 * are fixed rather than expiring.
 */
{
  const spec = JSON.parse(readFileSync(join(ROOT, "source-overrides-42001-annex.generated.json"), "utf8"));
  const decol = (spec.overrides || []).filter((o) => /de-columned/.test(String(o.kind || "")));
  const bad = [];
  if (!decol.length) {
    bad.push("no de-columned override exists, so there is no before-state to control against -- and a census " +
      "with no positive control reports clean whether or not the detector works");
  }
  /* A 64-CHARACTER BEFORE-STATE IS A PREFIX, AND A PREFIX CAN BE TOO SHORT TO TEST. That is a third state and
   * not a detector failure: `A.4.3`'s recorded prefix stops at "As part of resource identification, the
   * organizat" -- the modal the bleed test needs is past the cut. Calling that DOES-NOT-FIRE would report six
   * working detections as gaps; calling it a pass would let a real gap hide in it. So it is counted apart, and
   * the control additionally asserts that at least one prefix DID fire, or the whole thing is vacuous. */
  let fired = 0, untestable = 0;
  for (const o of decol) {
    const before = String(o.replaces_starts_with || "");
        GLUED.lastIndex = 0;
    const beforeGlued = [...before.matchAll(GLUED)].some((m) => !GLUED_OK.test(m[0]));
    if (TITLE_SENTENCE.test(before) || textBleeds(before, o.title) || beforeGlued) fired++;
    else if (!MODAL_W.test(before)) untestable++;
    else {
      bad.push(o.clause + ": its recorded before-state carries a modal and fires NEITHER detector, so neither " +
        "could have found it: " + JSON.stringify(before.slice(0, 70)));
    }
    if (TITLE_SENTENCE.test(String(o.title || ""))) {
      bad.push(o.clause + ": its REPAIRED title still fires, so the detector cannot tell a repaired row from " +
        "a broken one: " + JSON.stringify(o.title));
    }
    if (textBleeds(String(o.statement || ""), String(o.title || ""))) {
      bad.push(o.clause + ": its REPAIRED statement still fires the bleed detector: " +
        JSON.stringify(String(o.statement).slice(0, 70)));
    }
  }
  if (bad.length) {
    console.error("THE DETECTOR IS UNSOUND, so no count below would mean anything:");
    for (const b of bad) console.error("  " + b);
    process.exit(2);
  }
  if (!fired) {
    console.error("THE CONTROL IS VACUOUS: not one recorded before-state fires either detector, so a clean " +
      "census below would be a claim about nothing.");
    process.exit(2);
  }
  console.log("CONTROL  " + decol.length + " repaired row(s): " + fired + " before-state(s) fire a detector, " +
    untestable + " are PREFIXES TOO SHORT TO TEST (the modal is past the 64-character cut), 0 fire neither.");
  console.log("         No repaired title or statement fires. Derived from source-overrides-42001-annex.generated.json, so " +
    "fixing a row STRENGTHENS this control instead of expiring it.");
}

const tally = {};
for (const r of rows) tally[r.verdict] = (tally[r.verdict] || 0) + 1;
console.log("");
console.log("HELD PASSAGES            " + lib.passages.length);
console.log("with any signal          " + rows.length);
for (const v of ORDER) console.log("  " + v.padEnd(58) + (tally[v] || 0));
console.log("");

const bySource = new Map();
for (const r of rows) {
  if (!bySource.has(r.source)) bySource.set(r.source, {});
  const s2 = bySource.get(r.source);
  s2[r.verdict] = (s2[r.verdict] || 0) + 1;
}
console.log("PER SOURCE".padEnd(26) + "tIL  hdr  cut  glu  CAND  conv  wrap");
const dscore = (o) => (o[ORDER[0]]||0)+(o[ORDER[1]]||0)+(o[ORDER[2]]||0)+(o[ORDER[3]]||0);
for (const [src, o] of [...bySource].sort((a, b) => dscore(b[1]) - dscore(a[1]))) {
  console.log("  " + src.padEnd(24) + ORDER.map((v, i) => String(o[v] || 0).padStart(i >= 4 ? 6 : 5)).join(""));
}
console.log("");
console.log("EVERY DEFECT PASSAGE, NAMED -- the enumeration is the artifact, the count is commentary:");
console.log("");
for (const r of rows.filter((x) => x.verdict.startsWith("INTERLEAVED") || x.verdict.startsWith("DEFECT"))) {
  console.log("  " + r.key);
  console.log("      " + r.verdict);
  console.log("      title " + JSON.stringify(r.title.slice(0, 90)));
  console.log("      text  " + JSON.stringify(r.text.slice(0, 100)));
  if (r.wraps.length) console.log("      wraps " + r.wraps.map((w) => JSON.stringify(w)).join(" "));
  if (r.glued.length) console.log("      glued " + r.glued.slice(0, 6).join(" "));
}
if (!tally[ORDER[0]] && !tally[ORDER[1]] && !tally[ORDER[2]]) console.log("  none.");
console.log("");
console.log("SUSPECTS (a glued token, no title sentence) -- these need reading, not a verdict:");
for (const r of rows.filter((x) => x.verdict.startsWith("SUSPECT"))) {
  console.log("  " + r.key.padEnd(30) + r.glued.slice(0, 5).join(" "));
}
if (!tally["SUSPECT (glued token)"]) console.log("  none.");
console.log("");
console.log("WRAP-ONLY, which want de-hyphenation in the extractor rather than a reviewed override:");
console.log("  " + rows.filter((x) => x.verdict === "wrap only").map((r) => r.key
  .replace(/^ISO(\/IEC)? /, "").replace(/ \d{4}(\/\d+)? /, " ")).join(", "));
