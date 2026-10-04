/**
 * WHAT COUNTS AS A CLAUSE ADDRESS. One definition, imported by everything that asks the question.
 *
 * It was asked in two places with two answers. `normClause` (grounded-gates) learned in PROMPT-122
 * that a non-ISO scheme's address is kept whole -- `MANAGE 4.3`, `Recital 111`, `Art. 55(1)`. The
 * attribution check in `leak-score` never learned it, so an explanation attributing to `MAP 5.1`
 * was refused for naming no clause while the normaliser was resolving that very address. Ruled
 * PROMPT-123 s2a: one rule, imported, not restated.
 *
 * TWO SCOPES, ONE VOCABULARY. `normClause` tests a clause FIELD and anchors at the start;
 * `namesAnAddress` scans an explanation and must not fire on ordinary prose. Both are built from
 * the word lists below, so adding a scheme word reaches both.
 */

/** ISO's own anchor words. An address behind one of these is ISO-shaped and gets ISO handling. */
export const ISO_ANCHOR_WORDS = ["clause", "subclause", "annex", "control", "section", "table", "figure"];

/**
 * Anchor words used by the other schemes we hold. SHORT AND DECLARED: the EU AI Act numbers
 * articles and recitals, and ITIL numbers sections. A scheme whose word is missing here is NOT
 * silently given ISO rules -- it simply does not match, which is a visible refusal rather than a
 * wrong pass. The all-caps arm below covers NIST without needing its function names listed.
 */
export const SCHEME_ANCHOR_WORDS = ["article", "art", "recital", "paragraph", "para", "point",
  "chapter", "title", "requirement"];

/** `^clause ...` -- used by normClause to decide an address is ISO-shaped. */
export const ISO_ANCHOR_WORD = new RegExp("^(?:" + ISO_ANCHOR_WORDS.join("|") + ")\\b", "i");

/** `^MANAGE 4.3` -- a word, then whitespace, then a digit: the word belongs to the address. */
export const SCHEME_PREFIXED = /^[A-Za-z][A-Za-z.]*\s+\(?\d/;

/* One number shape for both arms: optional letter, dots to depth 7, an optional (1) sub-point. */
const NUM = "\\(?[A-Z]?\\.?\\d+(?:\\.\\d+){0,6}\\)?(?:\\(\\d+\\))?";

/** `clause 9.2`, `Annex A.5`, `Recital 133`, `Article 55(1)`, `Art. 55` -- anywhere in prose. */
const ANCHOR_WORD_ADDRESS = new RegExp("\\b(?:" +
  [...ISO_ANCHOR_WORDS, ...SCHEME_ANCHOR_WORDS].join("|") + ")\\.?\\s+" + NUM, "i");

/**
 * `MAP 5.1`, `MANAGE 4.3`, `GOVERN 1.1` -- NIST AI RMF labels its subcategories with an all-caps
 * function name, so the arm is general rather than a list of the four function names.
 *
 * THE DOT IS REQUIRED, and that is the whole reason this arm is safe: `ISO 27001`, `NIST 800`
 * and `EU 2024` are an all-caps word followed by an undotted number, and naming the DOCUMENT is
 * not naming the clause. Case-sensitive, so it cannot be folded into the regex above.
 */
const ALLCAPS_ADDRESS = /\b[A-Z]{2,}\s+\d+\.\d+(?:\.\d+){0,5}\b/;

/**
 * Does this text say what it is quoting? Used by the attributed-quotation rule.
 * Deliberately NOT the general "a word then a digit" rule that normClause uses on a clause field:
 * over prose that would match "keep 3 records", and the check would pass everything.
 */
export function namesAnAddress(text) {
  const s = String(text || "");
  return ANCHOR_WORD_ADDRESS.test(s) || ALLCAPS_ADDRESS.test(s);
}

/** Controls, both directions. A rule that only ever passes is not a rule. */
export function clauseAddressControls() {
  const cases = [
    /* POSITIVE -- these must be recognised as naming an address */
    ["ISO clause", "Clause 9.2.2 says the organization shall do a thing.", true],
    ["ISO annex", "Annex A.5.1 says a thing about policies.", true],
    ["ISO control", "Control A.8.16 requires monitoring.", true],
    ["five-level ISO clause", "Clause 9.6.3.1.2 requires the review.", true],
    ["NIST MAP, all caps and dotted", "The impact-mapping outcome MAP 5.1 asks for likelihood.", true],
    ["NIST MANAGE", "The incident outcome MANAGE 4.3 states that errors are communicated.", true],
    ["NIST GOVERN", "GOVERN 1.1 requires legal requirements to be understood.", true],
    ["EU AI Act recital", "Recital 133 of the EU AI Act notes a thing.", true],
    ["EU AI Act article with sub-point", "Article 55(1) of the EU AI Act requires evaluation.", true],
    ["EU AI Act abbreviated article", "Art. 55 of the EU AI Act requires evaluation.", true],
    ["lower-case anchor word", "see clause 7.5.3 for the detail", true],

    /* NEGATIVE -- these must NOT count, or the attribution check passes everything */
    ["no address at all", 'The standard says "the organization shall maintain an audit programme".', false],
    ["a bare number in prose", "The organization shall keep 3 records of each review.", false],
    ["a document designation is not a clause", 'ISO 27001 says "a thing about information security".', false],
    ["an undotted all-caps number is a document", 'NIST 800 says "a thing".', false],
    ["an all-caps word with no number", "The MANAGE function covers incidents.", false],
    ["a year is not an address", "The 2022 edition says a thing about controls.", false],
    ["a bare dotted number with no anchor word", "The 5.1 of it says a thing.", false],
  ];
  const fails = [];
  for (const [name, text, want] of cases) {
    let got;
    try { got = namesAnAddress(text); } catch (e) { got = "threw: " + e.message; }
    if (got !== want) fails.push(name + " -- wanted " + want + ", got " + got);
  }
  /* and the two anchored regexes normClause depends on, so a change here cannot break it silently */
  const anchored = [
    ["ISO_ANCHOR_WORD fires on 'clause 9.2'", ISO_ANCHOR_WORD.test("clause 9.2"), true],
    ["ISO_ANCHOR_WORD does not fire on 'MANAGE 4.3'", ISO_ANCHOR_WORD.test("MANAGE 4.3"), false],
    ["SCHEME_PREFIXED fires on 'MANAGE 4.3'", SCHEME_PREFIXED.test("MANAGE 4.3"), true],
    ["SCHEME_PREFIXED fires on 'Art. 55(1)'", SCHEME_PREFIXED.test("Art. 55(1)"), true],
    ["SCHEME_PREFIXED does not fire on '9.6.3.1.2'", SCHEME_PREFIXED.test("9.6.3.1.2"), false],
  ];
  for (const [name, got, want] of anchored) {
    if (got !== want) fails.push(name + " -- wanted " + want + ", got " + got);
  }
  return { examined: cases.length + anchored.length, fails };
}
