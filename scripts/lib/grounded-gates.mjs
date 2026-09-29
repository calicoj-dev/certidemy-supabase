/**
 * grounded-gates.mjs -- the code gates for a grounded item. NO MODEL IS INVOLVED HERE.
 *
 * ============ THE PRINCIPLE THESE IMPLEMENT ============
 *
 *   An item is only as true as the passage it can point to, and the pointing is checked
 *   by code, not by a model.
 *
 * The model may write the item. It may not be the one who decides the item is supported.
 * `critiqueAndRevise` in the existing pipeline is a second pass by the same model over the
 * same recall: it can catch an incoherent item and cannot catch a false fact, because it
 * has nothing to check against. Everything in this file has something to check against.
 *
 * ============ EACH GATE REPORTS WHY, AND ABSTAINS RATHER THAN GUESSES ============
 *
 * A gate returns `{ id, pass, reason, examined }`. `examined` is the count of things it
 * looked at, and a gate that examined nothing reports VACUOUS rather than pass -- a pass
 * over an empty input claims something was checked and held. Three states, never two.
 */
import { auditItem, keyIsStrictLongest, CUE_CFG } from "../../functions/_shared/item-rules/item-cue-guard.mjs";
import { supersededIn } from "./superseded-wording.mjs";
import { clauseNumberRecall } from "./clause-number-recall.mjs";

/* ============ NORMALISATION, AND WHY IT IS THE RISKY PART ============
 *
 * "Verbatim" has to survive a PDF. The extracted text carries curly apostrophes, en and
 * em dashes, non-breaking spaces and the odd zero-width character, and a sentence
 * retyped by a model arrives with straight quotes. If the comparison is byte-exact, every
 * anchor fails and the gate is useless; if it is too generous, a paraphrase passes and the
 * gate is worse than useless.
 *
 * So the normalisation is declared here in full and it is the MINIMUM that crosses the
 * transport: whitespace collapsed, the quote and dash families unified, zero-width
 * characters removed, case ignored. NOTHING ELSE. Punctuation is kept, word order is kept,
 * and no stemming happens -- a single changed word is a failure, which is the point.
 */
const ZW = new RegExp("[" + [0x200b, 0x200c, 0x200d, 0xfeff].map((c) => String.fromCharCode(c)).join("") + "]", "g");
const APOS = new RegExp("[" + [0x2018, 0x2019, 0x201b, 0x02bc].map((c) => String.fromCharCode(c)).join("") + "]", "g");
const QUOT = new RegExp("[" + [0x201c, 0x201d, 0x201e].map((c) => String.fromCharCode(c)).join("") + "]", "g");
const DASH = new RegExp("[" + [0x2010, 0x2011, 0x2012, 0x2013, 0x2014, 0x2015].map((c) => String.fromCharCode(c)).join("") + "]", "g");
const NBSP = new RegExp("[" + [0x00a0, 0x2007, 0x202f].map((c) => String.fromCharCode(c)).join("") + "]", "g");

/* A list marker sitting immediately before an anchor: a semicolon or colon, a closing paren
 * from `a)` or `1)`, or a dash/bullet. ASSEMBLED FROM CHARACTER CODES, because I typed the
 * en dash, em dash, hyphen-bullet and bullet straight into the class a moment ago and
 * invariant 10 exists to catch exactly that. Note `normForVerbatim` has already folded the
 * dash family to ASCII "-" by the time this runs; the wider set is here so the same pattern
 * is correct if it is ever pointed at un-normalised text. */
const DASH_CLASS = "[" + [0x2d, 0x2010, 0x2011, 0x2012, 0x2013, 0x2014, 0x2015, 0x2022, 0x2043]
  .map((c) => String.fromCharCode(c)).join("") + "]";

const LIST_MARKER_BEFORE =
  new RegExp("(?:[;:]|\\)|" + DASH_CLASS + ")\\s*(?:\\d+\\)|[a-z]\\)|" + DASH_CLASS + ")?\\s*$");

/* The same marker set, at the START of a quoted anchor -- "f) produce a statement of
 * applicability..." quotes the list item WITH its letter. Built from the one dash class, so the
 * two tests can never drift apart. */
const LIST_MARKER_AT_START =
  new RegExp("^\\s*(?:\\d+\\)|[a-z]\\)|" + DASH_CLASS + "\\s)", "i");

export function normForVerbatim(s) {
  return String(s == null ? "" : s)
    .replace(ZW, "").replace(NBSP, " ")
    .replace(APOS, "'").replace(QUOT, '"').replace(DASH, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/* ============ MODALS ============
 *
 * The strongest claim an item makes, and the strongest thing a passage licenses. The order
 * matters: a sentence containing both "shall" and "can" is a requirement.
 */
/* `require` IN EVERY INFLECTION, because the bare verb is how a stem asks the question.
 * The first version listed "requires" and "required to" and missed "what does ISO/IEC
 * 42001 REQUIRE the organization to establish" -- so the commonest requirement stem in
 * the corpus registered as claiming nothing, and a should-passage licensed it. Caught by
 * this file's own control before it ran on anything. */
/* VERBS, NOT NOUNS -- and this is the second correction to this one pattern, both found by
 * reading what the gate refused rather than by counting refusals.
 *
 * Listing every inflection of `require` included the NOUNS, and a noun is not a claim.
 * Clause B.1's own permission sentence reads "...according to their specific REQUIREMENTS
 * and risk treatment needs": an item quoting it was classified as asserting a requirement,
 * and the gate refused a correct permission item on a `can` passage. The stem "under the
 * AI management system REQUIREMENTS on competence" failed the same way.
 *
 * A guard that fires on the normal case is deleted by the first person it inconveniences,
 * so the item side now needs a deontic VERB -- which is also what the Tier A defects
 * actually said: "must", "is required to", "shall". */
const REQUIRE_RE = /\b(?:shall|must|require|requires|required to|is required|are required|has to|have to|mandates|obliged to)\b/i;
const RECOMMEND_RE = /\b(?:should|is recommended|are recommended|ought to)\b/i;
const PERMIT_RE = /\b(?:may|can|is permitted|are permitted|is allowed|are allowed)\b/i;

/* ============ THE ABSENCE OF A REQUIREMENT IS NOT A REQUIREMENT ============
 *
 * The director's ruling. An item whose key says "need not be documented" or "is not required to"
 * asserts that NO obligation exists -- which a passage saying so licenses directly. Read as a
 * deontic claim it inverts the gate: the strongest word in the sentence is `required`, so the
 * item looked like it was asserting a requirement and was refused for resting on a `can` clause.
 * That refused a correct B.1 item.
 *
 * Negated forms are removed before the strength test rather than added to it, so they cannot be
 * mistaken for the thing they deny. */
const NEGATED_DEONTIC = new RegExp(
  "\\b(?:need(?:s)? not|not required|no requirement|does not (?:have to|need to)|do not (?:have to|need to)" +
  "|is not obliged|are not obliged|not mandatory|nothing requires)\\b", "gi");

export function claimStrength(text) {
  const t = String(text || "").replace(NEGATED_DEONTIC, " ");
  if (REQUIRE_RE.test(t)) return "requirement";
  if (RECOMMEND_RE.test(t)) return "recommendation";
  if (PERMIT_RE.test(t)) return "permission";
  return "none";
}

/* ============ THE ITEM'S CLAIM AND THE ANCHOR'S FORCE ARE DIFFERENT QUESTIONS ============
 *
 * `claimStrength` is generous on purpose: a stem asking "what does ISO/IEC 42001 REQUIRE"
 * or "which requirements apply" is asking about an obligation, and the noun does the work.
 *
 * An ANCHOR is a sentence, and a sentence carries deontic force only through a modal verb.
 * "including the frequency, methods, responsibilities, planning requirements and
 * reporting" contains the word `requirements` and imposes nothing -- it is the tail of a
 * list. Using one test for both let that fragment stand behind a "must" claim, which is
 * the exact substitution this gate exists to refuse, and the control caught it.
 *
 * So the anchor is tested for a MODAL VERB, strictly, and a noun never counts. */
const ANCHOR_REQUIRE = /\b(?:shall|must|is required to|are required to|is to be|are to be)\b/i;
const ANCHOR_RECOMMEND = /\b(?:should|ought to|is recommended|are recommended)\b/i;
const ANCHOR_PERMIT = /\b(?:may|can|is permitted|are permitted|is allowed|are allowed)\b/i;

export function anchorForce(text) {
  const t = String(text || "");
  if (ANCHOR_REQUIRE.test(t)) return "requirement";
  if (ANCHOR_RECOMMEND.test(t)) return "recommendation";
  if (ANCHOR_PERMIT.test(t)) return "permission";
  return "none";
}

/**
 * A LETTERED SUB-ITEM INHERITS ITS LIST'S MODAL, AND ASKING THE SUBSTRING ALONE REFUSES
 * CORRECT ITEMS.
 *
 * ISO management-system clauses put the modal in the lead-in and the substance in a
 * lettered list:
 *
 *     The organization shall:
 *       a) determine the necessary competence...
 *       c) where applicable, take actions to acquire the necessary competence, and
 *          evaluate the effectiveness of the actions taken;
 *
 * An anchor quoting c) carries no `shall` and is nonetheless a requirement -- the shall is
 * four lines up. The first version of this gate refused exactly that, on a correct clause
 * 7.2 item, which is the same shape as the leak scanner judging a blockquote with no
 * attribution because the lead-in sat above the window it looked at.
 *
 * So the force is looked for IN THE PASSAGE, upstream of where the anchor sits: a `shall`
 * ending in a colon before the anchor's position governs it. That is inheritance from the
 * document's own structure, not a loosening -- a passage with no upstream shall still
 * cannot license a requirement.
 */
export function anchorForceInPassage(anchor, passage) {
  const direct = anchorForce(anchor);
  /* NO EARLY RETURN ON `direct`. A lettered list item carrying its own `can` -- 42001 clause 6.1.2
   * b) "is designed such that repeated AI risk assessments can produce..." -- returned "permission"
   * here and the lead-in `shall:` two lines above was never consulted. The `can` describes the
   * property the shall REQUIRES, so reading it as the item's force inverts the clause. Both are
   * computed now and the STRONGER wins. */
  const hay = normForVerbatim((passage && passage.text) || "");
  const needle = normForVerbatim(anchor);
  const at = needle ? hay.indexOf(needle) : -1;
  if (at < 0) return direct;
  const before = hay.slice(0, at);

  /* ============ THE SENTENCE THE MODAL GOVERNS, NOT A LIST SYNTAX ============
   *
   * The first version required the list items between the lead-in and the anchor to look
   * like `a)`, because that is how ISO/IEC 27001 numbers them. ISO/IEC 42001 uses EM
   * DASHES, so three correct clause 6.1.2 and 7.2 items were refused for carrying no shall
   * -- while the passage they quote opens "The organization shall: - determine the necessary
   * competence...". Reasoning from one document's list style, which is the same mistake as
   * writing the annex letter set from the annexes the first document happened to have.
   *
   * So the test is not a list syntax at all. The anchor inherits the modal when it is still
   * inside the sentence the modal opened, and a sentence ends at a full stop. Decimal points
   * are removed first: "(see 5.2)" is a clause reference, not the end of a sentence, and it
   * sits in exactly the intervening text this has to read past.
   */
  /* A LIST ITEM ENDING IN A FULL STOP DOES NOT CLOSE THE LIST, which is why "the sentence
   * the modal governs" was still the wrong unit. ISO/IEC 42001 clause 6.1.2 contains
   * "...utilize an AI system impact assessment as indicated in 6.1.4." INSIDE item b) -- a
   * real sentence end, in the middle of a list that "The organization shall define and
   * establish an AI risk assessment process that:" still governs. Item d) 1) three items
   * later is a requirement, and a sentence-boundary test refused it.
   *
   * So the two conditions are asked separately, which is also what makes the rule narrow:
   *   1. a modal opening a list -- `shall`/`should` followed by a colon -- appears earlier;
   *   2. the anchor BEGINS A LIST ITEM, evidenced by a list marker immediately before it.
   *
   * Condition 2 is what stops this being a loophole. A `shall` sentence that finished, with
   * ordinary prose after it, leaves the anchor preceded by prose rather than by a marker --
   * and the negative control asserts exactly that case still refuses. */
  /* AND THE MARKER IS OFTEN INSIDE THE ANCHOR, NOT BEFORE IT. This looked only backwards, and
   * ISO/IEC 42001 clause 6.1.3 f) reads
   *
   *     "f) produce a statement of applicability that contains the necessary controls..."
   *
   * -- the quoted anchor OPENS with its own marker, and the 40 characters before it end
   * "...other management systems, if applicable." So the test failed and the gate refused the
   * statement-of-applicability item on 6.1.3, whose shall sits in the lead-in "the organization
   * shall define an AI risk treatment process to:". That refusal also reached section 5, where it
   * flagged one of the director's findings FOR THE WRONG REASON -- a catch that was really a
   * gate defect agreeing with him by accident, which is worse than a miss because it inflates
   * the instrument's apparent recall. */
  const startsWithMarker = LIST_MARKER_AT_START.test(needle);
  const opensListItem = startsWithMarker || LIST_MARKER_BEFORE.test(before.slice(-40));
  if (!opensListItem) return direct;
  /* STRONGER WINS. Ranked so the comparison is explicit rather than implied by return order, and so
   * a future force can be added without re-deriving the ordering at each call site. */
  const RANK = { none: 0, permission: 1, recommendation: 2, requirement: 3 };
  let inherited = "none";
  if (/\b(?:shall|must)\b[^:]{0,300}:/.test(before)) inherited = "requirement";
  else if (/\bshould\b[^:]{0,300}:/.test(before)) inherited = "recommendation";
  return RANK[inherited] > RANK[direct] ? inherited : direct;
}

/** What a passage of this normative class can license, strongest first. */
const LICENSES = {
  shall: ["requirement", "recommendation", "permission", "none"],
  should: ["recommendation", "permission", "none"],
  can: ["permission", "none"],
  informative: ["none"],
};

/* ============ THE GATES ============ */

/**
 * G1 -- the anchor is a sentence that occurs VERBATIM in the named passage.
 * This is the gate the whole design rests on: it is what makes "the pointing is checked by
 * code" true rather than aspirational.
 */
export function gateVerbatim(item, passagesByKey) {
  const anchors = [
    { role: "key", clause: item.key_support_clause, text: item.key_support },
    ...(item.distractor_support || []).map((d, i) => ({ role: "distractor " + i, clause: d.clause, text: d.support })),
  ].filter((a) => a.text != null || a.clause != null);

  if (!anchors.length) {
    return { id: "verbatim", pass: false, examined: 0,
      reason: "the item carries no anchor at all -- nothing to check, which is a refusal and not a pass" };
  }
  const bad = [];
  for (const a of anchors) {
    if (!a.clause) { bad.push(a.role + ": no clause named"); continue; }
    if (!a.text || !String(a.text).trim()) { bad.push(a.role + ": no support sentence"); continue; }
    const p = passagesByKey.get(normClause(a.clause));
    if (!p) { bad.push(a.role + ": clause " + normClause(a.clause) + " is not in the library"); continue; }
    const hay = normForVerbatim(p.text + " " + (p.title || ""));
    const needle = normForVerbatim(a.text);
    /* THE FIVE-WORD FLOOR IS ON THE KEY ANCHOR ONLY, and the pilot is why.
     *
     * The key's anchor has to be the sentence that SUPPORTS the key, and a one- or two-word
     * fragment cannot support anything -- it is a word that happens to appear. A
     * DISTRACTOR's anchor is doing a different job: it points at the text the distractor
     * misreads, and "as appropriate" or "at planned intervals" is often exactly the phrase
     * that makes it wrong. Applying the key's floor to distractors threw away two otherwise
     * clean items over a three-word pointer.
     *
     * Distractors still have to be VERBATIM. What is relaxed is the length, not the check --
     * the floor was standing in for "is this a real quotation", and verbatim already answers
     * that. A two-word floor stays, because a single word is not a pointer either. */
    const floor = a.role === "key" ? 5 : 2;
    if (needle.split(" ").length < floor) {
      bad.push(a.role + ": the support is under " + floor + " words -- too short to be a " +
        (a.role === "key" ? "supporting sentence" : "pointer"));
      continue;
    }
    if (!hay.includes(needle)) bad.push(a.role + ": not verbatim in " + a.clause);
  }
  return { id: "verbatim", pass: bad.length === 0, examined: anchors.length,
    reason: bad.length ? bad.join("; ") : anchors.length + " anchor(s) verbatim in their named passage" };
}

/**
 * A CLAUSE ID CARRYING ITS TITLE IS STILL A CLAUSE ID. The pilot produced
 * `"A.4.5 (System and computing resources As part of resource identification, the
 * organization shall )"` and the lookup failed -- against a clause the library HOLDS. The
 * model named a real address and formatted it loosely; refusing that measures the
 * formatting, not the grounding. The leading address is extracted and the rest ignored.
 */
/* ============ THE ADDRESS IS EXTRACTED, NOT REQUIRED AT THE START ============
 *
 * `^` anchored the pattern to the start of the string, so a clause field naming the document
 * defeated it entirely. Measured on `fcb8a516` in a re-run: the model returned
 *
 *     "ISO/IEC 42006 clause 1 (Scope)"
 *
 * `normClause` returned the whole string, the passage map missed, `gateClauseExists` reported
 * *"not in the library"* about a clause the library DOES hold, and `gateModalFidelity` reported
 * *"no passage to compare against"*. Two gates blamed the item and the library for a formatting
 * difference they could have resolved -- the same defect that scored an entire linking run at 0.0%
 * recall when a title list joined clause and title with spaces.
 *
 * So the address is now FOUND anywhere in the string, after an optional `clause`/`annex`/`control`
 * word. A leading document designation is skipped, because `ISO/IEC 42006` would otherwise donate
 * its `42006` as the address -- which is why the scan starts after the last such designation. */
export function normClause(c) {
  let s = String(c || "").trim();
  /* drop a leading document designation so its digits cannot be read as the address */
  s = s.replace(/^(?:BS\s+)?(?:EN\s+)?ISO(?:\/IEC)?(?:\/IEEE)?\s*\d+(?:[-:]\d+)*(?::\d{4})?\s*/i, "");
  /* an explicit anchor word wins: `clause 9.2`, `Annex A.5`, `control A.8.16` */
  const anchored = /\b(?:clause|subclause|annex|control|section)\s+([A-Z]?\.?\d+(?:\.\d+){0,3})/i.exec(s);
  const m = anchored || /([A-Z]?\.?\d+(?:\.\d+){0,3})/.exec(s);
  if (!m) return String(c || "").trim();
  return m[1].replace(/^\./, "").replace(/^([A-Z])(\d)/, "$1.$2");
}

/**
 * G2 -- every clause the item names exists in the library.
 *
 * ============ NOT IN THE STANDARD AND NOT HELD ARE DIFFERENT ANSWERS ============
 *
 * The first version reported both as "not in the library", and the pilot showed what that
 * costs: an item cited ISO/IEC 42001 clause D.2, the gate called it absent, and Annex D is a
 * real annex of that standard -- my extractor simply could not see its headings. Reported
 * together, a library gap reads as an invented address, which sends the reader to rewrite a
 * possibly-correct item instead of to fix the extractor.
 *
 * So a clause the library declares MISSING -- an annex control it could not parse, a hole in
 * a numbered sequence -- returns `pass: null`. The item is not cleared, because nothing can
 * check it; it is also not blamed. Anything else absent is a real refusal.
 */
export function gateClauseExists(item, passagesByKey, annexGaps = [], sequenceGaps = []) {
  const known = new Set([
    ...annexGaps.flatMap((g) => g.missing || []),
    ...sequenceGaps.flatMap((g) => g.holes || []),
  ]);
  const named = [item.key_support_clause, ...(item.distractor_support || []).map((d) => d.clause)]
    .filter(Boolean).map(normClause);
  if (!named.length) {
    return { id: "clause-exists", pass: false, examined: 0, reason: "no clause named" };
  }
  /* ============ A CONTAINER RESOLVES TO ITS CHILDREN ============
   *
   * Ruled in PROMPT-85 section 5 and implemented here. A cited address whose own row the library does not
   * hold, but whose SUBCLAUSES it does, is held: `42001 clause 10` has no row of its own because the
   * extractor splits it into 10.1 and 10.2, and `9.3.1.2` is held only as 9.3.1.2.1.
   *
   * WHY IT MATTERS NOW RATHER THAN IN PRINCIPLE. Until the contents-title fix, three containers -- 42001
   * "10", 27001 "9.2", 19011 "6.5" -- were held as rows carrying THEIR CHILDREN'S TEXT. A citation of
   * them resolved, to junk. Removing those rows is correct and it turned a silent wrong answer into a
   * loud refusal: without this resolution, `clause 10` would now fail as "not in the library", which
   * sends the reader to fix an item that is citing a real address correctly.
   *
   * It is a CONTAINER rule, not a prefix rule: only a child one level down counts, so `9.2` resolves
   * through 9.2.1 and never through an unrelated 9.20. And the resolution is RECORDED in the reason, so a
   * pass via children is not indistinguishable from a pass on the address itself. */
  const childrenOf = (c) => {
    const out = [];
    for (const k of passagesByKey.keys()) {
      if (String(k).startsWith(c + ".") && /^\d+$/.test(String(k).slice(c.length + 1))) out.push(k);
    }
    return out;
  };
  const bad = [], unheld = [], viaChildren = [];
  for (const c of named) {
    if (passagesByKey.has(c)) continue;
    const kids = childrenOf(c);
    if (kids.length) { viaChildren.push(c + " -> " + kids.sort().join(", ")); continue; }
    if (known.has(c)) unheld.push(c);
    else bad.push(c + " is not in the library and the library does not declare it missing");
  }
  if (bad.length) {
    return { id: "clause-exists", pass: false, examined: named.length, reason: bad.join("; ") };
  }
  if (unheld.length) {
    return { id: "clause-exists", pass: null, examined: named.length,
      reason: "NOT HELD, not absent: " + unheld.join(", ") + " is real in the standard and the " +
        "library declares it missing. The item is neither cleared nor blamed -- fix the extractor." };
  }
  return { id: "clause-exists", pass: true, examined: named.length,
    reason: named.length + " clause(s) resolve" +
      (viaChildren.length ? "; " + viaChildren.length + " as a container: " + viaChildren.join("; ") : "") };
}

/**
 * G3 -- MODAL FIDELITY. If the item claims a requirement, the anchor must carry `shall`
 * and sit in a `shall` passage. A `should` or `can` passage behind a "must" is the defect
 * that produced three Tier A findings: a plausible requirement the standard does not
 * impose.
 */
export function gateModalFidelity(item, passagesByKey) {
  const p = passagesByKey.get(normClause(item.key_support_clause));
  if (!p) return { id: "modal-fidelity", pass: false, examined: 0, reason: "no passage to compare against" };

  /* ============ THE KEY AND THE EXPLANATION, NEVER THE STEM OR A DISTRACTOR ============
   *
   * The director's ruling, and pilot item 1.6 is why: modal-fidelity fired on the STEM's "must"
   * while the stem only ASKED what the standard requires -- the key said "can" and so did the
   * anchor. A stem asks. A distractor is meant to be false, so its modal is not a claim the item
   * makes at all.
   *
   * What the item ASSERTS is its key, and what it teaches is its explanation. Those are the two
   * fields whose modal has to match the passage. Reading the stem made the gate refuse an item
   * for the wording of its own question. */
  const claimText = [keyOptionText(item), item.explanation].filter(Boolean).join(" ");
  const claim = claimStrength(claimText);

  /* ============ THE ANCHOR SENTENCE'S OWN MODAL GOVERNS; THE CLASS IS THE FALLBACK ============
   *
   * The director's ruling, and my definitions-are-informative change is what made it necessary.
   * Clause 3.26 is a DEFINITION, so its class is now `informative` -- and its NOTE 2 reads
   * "...shall be reflected in the statement of applicability". An item resting on that note
   * asserts a requirement the sentence really carries, and the gate refused it on the strength of
   * a class I had just assigned to the whole clause. The ruling was too blunt at this grain.
   *
   * So the ANCHOR SENTENCE decides, with lead-in inheritance, and the passage class is consulted
   * only when the sentence carries no modal of its own. A definition remains informative for
   * every sentence that says nothing; the one sentence that says "shall" is a requirement. */
  const sentenceForce = anchorForceInPassage(item.key_support || "", p);
  const anchorClaim = sentenceForce !== "none" ? sentenceForce : p.normative === "informative" ? "none" : p.normative;
  const forceFrom = sentenceForce !== "none" ? "the anchor sentence" : "the passage class";

  /* ============ REFUSE ONLY INFLATION ============
   *
   * The ruling, and it replaces a licence table that was refusing correct items three ways:
   *
   *   a DEFINITION item on clause 3.4, refused because a definition "cannot license a permission"
   *   "the organization can design their own controls" on A.1, refused the same way
   *   "need not be documented" on B.1, refused as an unlicensed claim
   *
   * A PERMISSION OR A DESCRIPTIVE CLAIM IS NEVER STRONGER THAN ITS ANCHOR, so there is nothing
   * to inflate. And "need not / does not have to / not required" is the ABSENCE of a
   * requirement -- licensed by a passage that says so, not an assertion that needs a shall.
   *
   * What remains is the only defect this gate was ever for, and it is the Tier A shape:
   *   an item asserts must/shall/required on an anchor that does not carry it
   *   an item asserts should on an anchor that only permits or says nothing
   */
  /* ============ A SCOPE CLAUSE CANNOT BE INFLATED BY A DESCRIPTION OF WHAT A DOCUMENT GOVERNS ====
   *
   * The director's ruling on `fcb8a516`, and the item is the whole argument. Its anchor is
   * ISO/IEC 42006 CLAUSE 1, Scope. Its key reads:
   *
   *   "ISO/IEC 42006 governs certification bodies auditing AI management systems; ISO/IEC 42001
   *    governs the AIMS requirements organizations MUST meet."
   *
   * `claimStrength` sees `must` and calls it a requirement. It is not a requirement THIS item
   * imposes -- it is a report of what a DIFFERENT standard obliges, inside a sentence whose whole
   * job is to say which document covers what. A scope clause states applicability and carries no
   * obligation by construction, so there is nothing there to inflate.
   *
   * BOTH CONDITIONS, because either alone is too wide:
   *
   *   1. the anchor is a SCOPE clause -- clause 1, or a title naming scope or field of application;
   *   2. every requirement-bearing sentence in the claim ATTRIBUTES the requirement to a named
   *      document with a scope verb -- sets / defines / specifies / governs / covers / applies to.
   *
   * `requires` is deliberately NOT a scope verb. "ISO/IEC 42001 REQUIRES organizations to document
   * a policy" against a scope anchor is exactly the Tier A inflation this gate exists for, and it
   * names a document too -- so attribution alone cannot be the exemption. The line is between a
   * document SETTING requirements, which is what a scope clause says, and a document REQUIRING
   * something of the reader, which a scope clause never does. */
  const isScopeAnchor = normClause(item.key_support_clause) === "1" ||
    /\b(?:scope|field of application)\b/i.test(String(p.title || ""));
  const SCOPE_VERB = /\b(?:sets?|setting|defines?|defining|specifies|specifying|governs?|governing|covers?|covering|applies to|applicable to|addresses|addressing|is intended for|are intended for)\b/i;
  const DOC_NAME = /\b(?:ISO\/IEC\s*\d|ISO\s*\d|this document|the standard|the document|BS\s*(?:EN\s*)?ISO)/i;
  const requirementSentences = String(claimText).split(/(?<=[.!?;])\s+/)
    .filter((s) => claimStrength(s) === "requirement");
  const allDescriptive = requirementSentences.length > 0 &&
    requirementSentences.every((s) => DOC_NAME.test(s) && SCOPE_VERB.test(s));

  if (claim === "requirement" && anchorClaim !== "requirement" && isScopeAnchor && allDescriptive) {
    return { id: "modal-fidelity", pass: true, examined: 1,
      reason: "the claim DESCRIBES what a document governs, against a scope clause -- " +
        requirementSentences.length + " requirement-bearing sentence(s), each attributing the " +
        "obligation to a named document with a scope verb. A scope clause imposes nothing, so " +
        "there is nothing to inflate." };
  }
  if (claim === "requirement" && anchorClaim !== "requirement") {
    return { id: "modal-fidelity", pass: false, examined: 1,
      reason: "the item asserts a requirement and the anchor carries none -- force taken from " +
        forceFrom + " (" + anchorClaim + "), clause " + normClause(item.key_support_clause) +
        " is classed " + p.normative +
        (isScopeAnchor ? " (scope anchor, but the claim is not purely descriptive)" : "") };
  }
  if (claim === "recommendation" && anchorClaim !== "requirement" && anchorClaim !== "recommendation") {
    return { id: "modal-fidelity", pass: false, examined: 1,
      reason: "the item asserts a recommendation and the anchor only " +
        (anchorClaim === "permission" ? "permits" : "describes") + " -- force taken from " + forceFrom };
  }
  return { id: "modal-fidelity", pass: true, examined: 1,
    reason: "item asserts a " + claim + "; anchor is a " + anchorClaim + " by " + forceFrom +
      " (clause classed " + p.normative + ")" };
}

/** G4 -- superseded wording, anywhere in the item. */
export function gateSuperseded(item, cert) {
  const fields = [item.question_text, item.explanation, ...(item.options || []).map((o) => o && o.text)]
    .filter(Boolean);
  const hits = [];
  for (const f of fields) for (const h of supersededIn(f, { cert })) hits.push(h.id + " (use: " + h.instead + ")");
  return { id: "superseded-wording", pass: hits.length === 0, examined: fields.length,
    reason: hits.length ? [...new Set(hits)].join("; ") : fields.length + " field(s) carry no retired wording" };
}

function keyOptionText(item) {
  const opts = item.options || [];
  const k = opts.find((o) => o && (o.is_correct || o.correct));
  if (k) return k.text;
  if (typeof item.correct_answer === "number" && opts[item.correct_answer]) return opts[item.correct_answer].text;
  return null;
}

/**
 * G5 -- STRUCTURAL TELLS. The cue guard, plus two patterns it does not cover.
 *
 * ODD-ONE-OUT is implemented narrowly and its limit is stated: it catches the case where
 * the KEY is the only option carrying a negation, or the only one not sharing an opening
 * word that every distractor shares. It cannot see semantic odd-one-out -- three options
 * about documents and one about people -- and nothing in code can. Claiming otherwise
 * would be the lexical-proxy defect again.
 */
export function gateStructure(item, cfg = CUE_CFG) {
  const opts = (item.options || []).map((o) => String((o && o.text) || ""));
  if (opts.length < 2) return { id: "structure", pass: false, examined: 0, reason: "fewer than two options" };
  const keyText = keyOptionText(item);
  const ki = opts.findIndex((t) => t === String(keyText || ""));
  const distractors = opts.filter((_, i) => i !== ki);
  const problems = [];
  /* TWO LISTS. `problems` refuse the item; `notes` travel with it. A gate that can only reject
   * has no way to say "worth a look", so it ends up either silent about a real pattern or wrong
   * about a correct item -- and the second is how a guard gets deleted. */
  const notes = [];

  /* the existing cue guard, unchanged */
  const audit = auditItem(item, cfg);
  if (audit && audit.fail) problems.push("cue guard: " + (audit.reasons || [audit.reason]).join(", "));
  else if (audit && Array.isArray(audit.reasons) && audit.reasons.length) {
    problems.push("cue guard: " + audit.reasons.join(", "));
  }

  /* key as the only long option: strictly longest AND well clear of the field */
  if (ki >= 0 && keyIsStrictLongest(item)) {
    const mean = distractors.reduce((a, t) => a + t.length, 0) / Math.max(1, distractors.length);
    if (mean > 0 && opts[ki].length > mean * 1.25) {
      problems.push("the key is the longest option and exceeds the mean distractor length by more than a quarter");
    }
  }

  /* ODD-ONE-OUT, NEGATION FORM -- AND A SCOPE MARKER IS NOT A VERDICT NEGATION.
   *
   * The director's ruling, and pilot item 2.2 is why: it fired on "not only those built", which
   * does not negate the option's verdict -- it WIDENS its scope. "not only", "not just" and
   * "not limited to" all say *this and more*, which is the opposite of a negation, and an option
   * carrying one is not findable as the odd one out.
   *
   * So those forms are removed before the test rather than added to it: a guard that fires on
   * ordinary English is deleted by the first person it inconveniences.
   *
   * ============ AND IT IS A FLAG NOW, NOT A REJECTION ============
   *
   * The director's ruling, after the scope-widener fix was still not enough. It went on firing
   * on grammar rather than on verdicts: "so the defect cannot reappear" is a PURPOSE CLAUSE, and
   * "implications of not conforming" is a NOUN PHRASE. Neither makes the key findable.
   *
   * A NEGATION TEST ON WORDS CANNOT TELL A VERDICT FROM A GRAMMATICAL FORM, and the real case --
   * an option that is the odd one out by what it CONCLUDES -- is what the options-only probe
   * already catches, by reading the shapes rather than matching a word list. So this reports and
   * does not reject. The opening-word rule below stays a rejection: "Awareness, Awareness,
   * Awareness, X" was a genuine cue and a repeated opening word is not a grammatical accident. */
  const SCOPE_WIDENER = /\bnot\s+(?:only|just|limited\s+to|merely|solely)\b/gi;
  const NEG = /\b(?:not|never|no|cannot|without|except|excluding|neither)\b/i;
  const negs = opts.map((t) => NEG.test(String(t).replace(SCOPE_WIDENER, " ")));
  if (ki >= 0 && negs[ki] && negs.filter(Boolean).length === 1) {
    notes.push("the key is the only negated option (FLAG, not a refusal: a word test cannot tell " +
      "a verdict from a purpose clause or a noun phrase -- the options probe covers the real case)");
  }
  if (ki >= 0 && !negs[ki] && negs.filter(Boolean).length === opts.length - 1) {
    notes.push("every distractor is negated and the key is not (FLAG, not a refusal)");
  }

  /* ODD-ONE-OUT, OPENING-WORD FORM -- ON THE FIRST CONTENT WORD, NOT THE FIRST WORD.
   * The first version compared literal opening tokens and fired on "An audit programme"
   * against "A single annual audit": an article against an article, which is ordinary
   * English and true of most option sets. A guard that fires on the normal case is deleted
   * by the first person it inconveniences, and its deletion takes the real assertion with
   * it. The parallelism worth catching is in the content word. */
  const FUNCTION_WORD = new Set(("a an the to by in on of for and or all any no not every each its their this " +
    "that these those it there").split(" "));
  const firstContent = (t) => (String(t).toLowerCase().match(/[a-z][a-z-]*/g) || [])
    .find((w) => !FUNCTION_WORD.has(w)) || "";
  if (ki >= 0 && distractors.length >= 2) {
    const ds = distractors.map(firstContent);
    if (ds.every((w) => w && w === ds[0]) && firstContent(opts[ki]) !== ds[0]) {
      problems.push("every distractor opens with the word \"" + ds[0] + "\" and the key does not");
    }
  }

  return { id: "structure", pass: problems.length === 0, examined: opts.length,
    notes,
    reason: problems.length ? problems.join("; ")
      : opts.length + " options, no structural tell" +
        (notes.length ? "  [FLAGGED, not refused: " + notes.join("; ") + "]" : "") };
}

/**
 * G6 -- NEAR-DUPLICATE AGAINST THE LIVE BANK.
 *
 * ============ THE METHOD, AND WHY THERE IS NO CHARACTER THRESHOLD ============
 *
 * An absolute character threshold selects by LENGTH, not by similarity: two 400-character
 * stems that differ in 60 characters are near-identical, and two 90-character stems that
 * differ in 60 are different questions. This repository has recorded that shape three
 * times, most sharply where a similarity gate required four shared terms and could not
 * reach its own founding case because the row was seven words long.
 *
 * So the measure is RELATIVE: the share of the SHORTER stem's distinctive terms that the
 * other also carries, plus a same-task requirement. Two items on the same task sharing
 * most of the shorter one's distinctive vocabulary are the same question asked twice --
 * which is what a forms-level collision looks like, because forms are drawn per task.
 *
 * WHAT IT CANNOT DO, stated so its silence is not read as coverage: it compares STEMS. Two
 * items with different stems and the same answer are invisible to it, which is exactly the
 * eight near-duplicate pairs the 480-item audit found by reading. A threshold cannot find
 * those and this does not claim to.
 */
const DUP_STOP = new Set(("a an and are as at be been by can for from has have in into is it its may not of on or " +
  "shall should such that the their there these this those to which with when where who why what how does do").split(" "));
const dupTerms = (s) => [...new Set(normForVerbatim(s).match(/[a-z][a-z-]{2,}/g) || [])]
  .filter((w) => !DUP_STOP.has(w));

export function nearDuplicateOf(stem, liveStemsForTask, share = 0.7) {
  const mine = dupTerms(stem);
  if (mine.length < 4) {
    /* Too few distinctive terms to judge. Reported as UNDECIDABLE, not as "no duplicate":
     * an instrument that cannot answer must not answer no. */
    return { state: "UNDECIDABLE", reason: "the stem carries " + mine.length + " distinctive terms; under four cannot be judged" };
  }
  const mineSet = new Set(mine);
  let worst = null;
  for (const other of liveStemsForTask) {
    const theirs = dupTerms(other.stem);
    if (theirs.length < 4) continue;
    const shared = theirs.filter((w) => mineSet.has(w)).length;
    const denom = Math.min(mine.length, theirs.length);
    const overlap = shared / denom;
    if (!worst || overlap > worst.overlap) worst = { overlap, id: other.id, stem: other.stem };
  }
  if (!worst) return { state: "NO COMPARABLE ITEM", reason: "no live item on this task has four distinctive terms" };
  if (worst.overlap >= share) {
    return { state: "DUPLICATE", overlap: Number(worst.overlap.toFixed(2)), against: worst.id,
      reason: "shares " + Math.round(worst.overlap * 100) + "% of the shorter stem's distinctive terms with " + worst.id };
  }
  return { state: "DISTINCT", overlap: Number(worst.overlap.toFixed(2)), against: worst.id,
    reason: "closest live item on this task shares " + Math.round(worst.overlap * 100) + "%" };
}

export function gateNearDuplicate(item, liveStemsForTask) {
  const r = nearDuplicateOf(item.question_text || "", liveStemsForTask);
  /* UNDECIDABLE and NO COMPARABLE ITEM are not passes and not failures. They are the third
   * state, and they travel with the item so nobody later reads them as "checked, clean". */
  if (r.state === "DUPLICATE") {
    return { id: "near-duplicate", pass: false, examined: liveStemsForTask.length, reason: r.reason };
  }
  if (r.state === "DISTINCT") {
    return { id: "near-duplicate", pass: true, examined: liveStemsForTask.length, reason: r.reason };
  }
  return { id: "near-duplicate", pass: null, examined: liveStemsForTask.length, reason: r.state + ": " + r.reason };
}

/* ============================================================================
 * G7 -- REPRODUCTION IN SERVED FIELDS. The gap the first pilot had no gate for.
 * ============================================================================
 *
 * Measured on the 31 survivors: 17 of them carried a run of 10 or more words from the 42001
 * text in a stem, an option or an explanation -- the worst a 20-word B.1 sentence, the same one
 * an item in the 480-audit was flagged for. The generator reproduces the standard BECAUSE IT IS
 * HANDED THE STANDARD, which is the cost of grounding and is exactly why this gate is not
 * optional on this path.
 *
 * The ruling, and the reason is quality rather than copyright: a key that is the standard's
 * sentence word for word is the option that "sounds like ISO", so a candidate can pick it by
 * recognition without understanding it. `key_support` is exempt because it is never served.
 *
 * ONE IMPLEMENTATION: the runs come from `scripts/lib/leak-score.mjs`, the same tokenisation and
 * the same `score()` the lesson scanner uses. The quotation allowance is a MODE there, not a
 * copy here.
 */
/* ============ G10 -- ISO/IEC 27000 IS NEVER NAMED IN A SERVED FIELD ============
 *
 * Juan's ruling, 2026-09-28, on loading ISO/IEC 27000:2018 as a vocabulary source. The standard is
 * anchorable INTERNALLY -- its clause 3 is where 27001's vocabulary actually lives, since 27001
 * clause 3 delegates the whole of it -- and it must not appear to a learner.
 *
 * TWO REASONS, and the second is the one a code rule can enforce:
 *
 *   The edition we hold is 2018 and a 2026 edition exists. An item naming the year pins a claim to an
 *   edition we will replace; an item naming the standard without a year is worse, because the reader
 *   cannot tell which edition it meant.
 *
 *   An explanation should cite 27001 where the term is used there, and otherwise state the definition
 *   in OUR OWN WORDS with no source line at all. Naming 27000 is a third option nobody chose.
 *
 * SERVED FIELDS ONLY: stem, options, explanation. `key_support` is internal and is where an anchor to
 * 27000 legitimately lives, which is the whole point of loading it.
 */
export function gateNo27000(item) {
  const fields = [
    ["stem", item.question_text],
    ...(item.options || []).map((o, i) => ["option " + String.fromCharCode(97 + i), (o && o.text) || ""]),
    ["explanation", item.explanation],
  ].filter(([, t]) => String(t || "").trim());
  if (!fields.length) {
    return { id: "no-27000", pass: null, examined: 0, reason: "the item has no served text -- UNASSERTED" };
  }
  /* Word-bounded, so a six-figure number containing 27000 is not a citation. Both the bare number and
   * the spelled forms, because `ISO/IEC 27000` and `ISO 27000` and a bare `27000` all name it. */
  const re = /(?<!\d)27000(?!\d)/;
  const hits = fields.filter(([, t]) => re.test(String(t)));
  if (hits.length) {
    return { id: "no-27000", pass: false, examined: fields.length,
      detail: "ISO/IEC 27000 named in " + hits.map(([n]) => n).join(", ") +
        " -- cite 27001 where the term is used there, or state the definition in our own words" };
  }
  return { id: "no-27000", pass: true, examined: fields.length };
}

export function gateReproduction(item, sources, leak) {
  if (!sources || !leak) {
    return { id: "reproduction", pass: null, examined: 0,
      reason: "the leak index was not supplied -- UNASSERTED, not clean" };
  }
  const { score, ITEM_MAX_RUN, splitOneAttributedQuotation } = leak;
  const fields = [
    { name: "stem", text: item.question_text, quotationAllowed: false },
    ...(item.options || []).map((o, i) => ({
      name: "option " + String.fromCharCode(97 + i), text: (o && o.text) || "", quotationAllowed: false })),
    { name: "explanation", text: item.explanation, quotationAllowed: true },
  ].filter((f) => String(f.text || "").trim());

  if (!fields.length) {
    return { id: "reproduction", pass: false, examined: 0, reason: "the item has no served text" };
  }

  const bad = [];
  let worst = 0, worstWhere = null, quotation = null;
  for (const f of fields) {
    let text = String(f.text);
    if (f.quotationAllowed) {
      const q = splitOneAttributedQuotation(text);
      if (!q.ok) { bad.push(f.name + ": " + q.reason); continue; }
      if (q.quotation) quotation = { field: f.name, words: q.quotation.split(/\s+/).length };
      text = q.remainder;
    }
    const s = score(text, sources);
    const run = (s && s.unionRun) || 0;
    if (run > worst) { worst = run; worstWhere = f.name; }
    if (run > ITEM_MAX_RUN) {
      bad.push(f.name + ": a " + run + "-word run shared with " + (s.source || "a source") +
        " -- the ceiling is " + ITEM_MAX_RUN);
    }
  }
  return {
    id: "reproduction", pass: bad.length === 0, examined: fields.length,
    longest_served_run: worst, longest_in: worstWhere, quotation,
    reason: bad.length ? bad.join("; ")
      : fields.length + " served field(s), longest run " + worst + " words in " + worstWhere +
        (quotation ? ", plus one " + quotation.words + "-word attributed quotation" : ""),
  };
}

/* ============================================================================
 * G8 -- THE KEY'S ANCHOR MUST BE A PRIMARY PASSAGE OF THE TASK
 * ============================================================================
 *
 * The director's ruling, and one rule that takes out both off-task items in the first pilot:
 * #3 tested drift monitoring on a task about the AI system LIFE CYCLE, and #30 tested
 * internal-audit frequency on a task about the CERTIFICATION ROUTE. Both anchored in a real
 * clause, verbatim, at the right modal strength -- so every gate that existed passed them. What
 * was wrong is that the clause is not what the task examines.
 *
 * A DISTRACTOR'S REASON MAY USE A SUPPORTING PASSAGE. The key may not: it is the thing the item
 * measures, and the task says what that is.
 */
export function gateAnchorIsPrimary(item, primaryClauses, supportingClauses) {
  const prim = new Set(primaryClauses || []);
  const supp = new Set(supportingClauses || []);
  if (!prim.size) {
    return { id: "anchor-is-primary", pass: null, examined: 0,
      reason: "the task has no primary passages -- UNASSERTED. A task mapped to nothing cannot " +
        "clear an item, and that is a fact about the MAP, not the item" };
  }
  const key = normClause(item.key_support_clause);
  if (prim.has(key)) {
    return { id: "anchor-is-primary", pass: true, examined: prim.size,
      reason: "the key anchors in " + key + ", a primary passage of this task" };
  }

  /* ============ ANNEX B GUIDANCE COUNTS WITH ITS ANNEX A CONTROL ============
   *
   * The director's ruling. In ISO/IEC 42001, B.x.y IS the implementation guidance FOR A.x.y --
   * same subject, same numbering, one document. If A.x.y is what the task examines, an item
   * anchored in B.x.y is anchored in the task's subject, and refusing it threw away two good
   * items: 4.3 on B.2.3 (A.2.3 primary) and 4.4 on B.6.2.6 (A.6.2.6 primary).
   *
   * This does NOT weaken the modal rule. B is guidance and says "should", so a `should` anchor
   * still cannot license a `must` -- modal-fidelity does that job, separately and unchanged.
   *
   * And it still refuses the case it was ruled for: task 1.3's key on B.6.2.6 fails, because
   * A.6.2.6 is not primary for 1.3. The pairing is with the CONTROL, not with the annex. */
  const paired = /^B\.(.+)$/.exec(key);
  if (paired && prim.has("A." + paired[1])) {
    return { id: "anchor-is-primary", pass: true, examined: prim.size,
      reason: "the key anchors in " + key + ", the implementation guidance for A." + paired[1] +
        ", which IS primary for this task" };
  }
  return {
    id: "anchor-is-primary", pass: false, examined: prim.size,
    reason: "the key anchors in " + key + ", which is " +
      (supp.has(key) ? "SUPPORTING for this task, not primary -- a distractor's reason may use it, a key may not"
        : "not mapped to this task at all") +
      ". Primary: " + [...prim].slice(0, 12).join(", ") + (prim.size > 12 ? " ..." : ""),
  };
}

/* ============================================================================
 * G9 -- A PHRASE EVERY DISTRACTOR SHARES AND THE KEY DOES NOT
 * ============================================================================
 *
 * The director's ruling, and item #15 of the first pilot is why. All three of its distractors
 * ended "which is one of the properties that the definition of information security preserves",
 * and the stem excluded exactly that property -- so the key was findable from the options alone,
 * with no knowledge of the subject.
 *
 * That kind of item does not make an exam easy. It makes the score mean nothing.
 */
export function gateSharedDistractorPhrase(item, minRun = 4) {
  const opts = (item.options || []).map((o) => String((o && o.text) || ""));
  const keyText = keyOptionText(item);
  const ki = opts.findIndex((t) => t === String(keyText || ""));
  if (ki < 0 || opts.length < 3) {
    return { id: "shared-distractor-phrase", pass: null, examined: 0,
      reason: "fewer than three options, or the key could not be located" };
  }
  const distractors = opts.filter((_, i) => i !== ki);
  if (distractors.length < 2) {
    return { id: "shared-distractor-phrase", pass: null, examined: distractors.length,
      reason: "fewer than two distractors to compare" };
  }
  const wordsOf = (t) => normForVerbatim(t).split(" ").filter(Boolean);
  const keyWords = wordsOf(opts[ki]).join(" ");
  const first = wordsOf(distractors[0]);
  let longest = "";
  for (let n = first.length; n >= minRun && !longest; n--) {
    for (let i = 0; i + n <= first.length; i++) {
      const run = first.slice(i, i + n).join(" ");
      if (!distractors.every((d) => wordsOf(d).join(" ").includes(run))) continue;
      if (keyWords.includes(run)) continue;      /* shared WITH the key is parallel writing */
      longest = run;
      break;
    }
  }
  if (!longest) {
    return { id: "shared-distractor-phrase", pass: true, examined: distractors.length,
      reason: distractors.length + " distractors share no run of " + minRun + "+ words the key lacks" };
  }
  return { id: "shared-distractor-phrase", pass: false, examined: distractors.length,
    reason: "every distractor contains \"" + longest + "\" (" + longest.split(" ").length +
      " words) and the key does not -- the key is findable from the options alone" };
}

/** Run every code gate. `pass: null` anywhere means the item is not cleared. */
/* A stem may cite a clause number only if the item is answerable without knowing what that number
 * contains. Ruled PROMPT-93 s2; the discriminator and its stated limits are in clause-number-recall.mjs. */
function gateClauseNumberRecall(item) {
  const v = clauseNumberRecall(item);
  return { id: "clause-number-recall", pass: v.pass, examined: v.examined ? 1 : 0, reason: v.reason };
}

export function runCodeGates(item, { passagesByKey, annexGaps = [], sequenceGaps = [],
  liveStemsForTask = [], cueCfg = CUE_CFG, cert,
  primaryClauses = null, supportingClauses = null, sources = null, leak = null }) {
  const gates = [
    gateClauseExists(item, passagesByKey, annexGaps, sequenceGaps),
    gateVerbatim(item, passagesByKey),
    gateModalFidelity(item, passagesByKey),
    gateSuperseded(item, cert),
    gateStructure(item, cueCfg),
    gateNearDuplicate(item, liveStemsForTask),
    gateSharedDistractorPhrase(item),
    /* These two are UNASSERTED rather than skipped when their input is absent, so a run without
     * the task map or without the leak index cannot read as a clean pass. */
    gateAnchorIsPrimary(item, primaryClauses, supportingClauses),
    gateReproduction(item, sources, leak),
    gateNo27000(item),
    gateClauseNumberRecall(item),
  ];
  const failed = gates.filter((g) => g.pass === false);
  const unasserted = gates.filter((g) => g.pass === null || g.examined === 0);
  return {
    gates,
    passed: failed.length === 0 && unasserted.length === 0,
    failed: failed.map((g) => g.id),
    unasserted: unasserted.map((g) => g.id),
  };
}

/**
 * CONTROLS. Every gate gets a case it must refuse and a case it must accept, because a
 * gate nobody has watched fire is the same object as a count assertion nobody has watched
 * fail -- and a gate that refuses everything looks like rigour.
 */
export function groundedGateControls() {
  const passage = {
    clause: "9.2.2", title: "Internal audit programme", normative: "shall",
    text: "The organization shall plan, establish, implement and maintain an audit programme " +
      "including the frequency, methods, responsibilities, planning requirements and reporting.",
  };
  const soft = {
    clause: "B.9.2", title: "Internal audit guidance", normative: "should",
    text: "The organization should consider the competence of the auditors when planning an audit.",
  };
  const byKey = new Map([[passage.clause, passage], [soft.clause, soft]]);

  const good = {
    question_text: "An organization is planning its AI management system internal audits. What does ISO/IEC 42001:2023 require the organization to establish?",
    options: [
      { text: "An audit programme covering frequency, methods, responsibilities and reporting", is_correct: true },
      { text: "A single annual audit performed by an external certification body" },
      { text: "A register of auditor qualifications approved by top management" },
      { text: "A corrective action plan prepared before each audit begins" },
    ],
    explanation: "Clause 9.2.2 requires an audit programme.",
    key_support_clause: "9.2.2",
    key_support: "The organization shall plan, establish, implement and maintain an audit programme",
  };

  const cases = [
    /* THE SOUND ITEM NOW HAS TO BE GIVEN THE TASK MAP AND THE LEAK INDEX, because two gates
     * report UNASSERTED without them and an unasserted gate does not clear an item. That is the
     * design, so the control supplies them rather than the expectation being relaxed -- a
     * control that passes because a gate abstained is measuring nothing. The leak index is
     * stubbed with a source the item does not reproduce, which is the honest stand-in: the real
     * index is nine PDFs and this file must stay runnable without them. */
    ["accepts a sound grounded item", () => runCodeGates(good, {
      passagesByKey: byKey,
      liveStemsForTask: [{ id: "x", stem: "Completely unrelated stem about data quality and provenance records." }],
      primaryClauses: ["9.2.2"], supportingClauses: ["3.18"],
      sources: { stub: true },
      leak: {
        ITEM_MAX_RUN: 9,
        score: () => ({ unionRun: 3, source: "stub" }),
        splitOneAttributedQuotation: (t) => ({ remainder: t, quotation: null, ok: true, reason: "stub" }),
      },
    }).passed, true],
    ["refuses a paraphrased anchor", () => gateVerbatim({ ...good, key_support: "The organization shall create and keep an audit programme" }, byKey).pass, false],
    ["refuses an anchor of under five words", () => gateVerbatim({ ...good, key_support: "shall plan an audit" }, byKey).pass, false],
    ["refuses a clause not in the library", () => gateClauseExists({ ...good, key_support_clause: "9.9.9" }, byKey).pass, false],
    /* CHANGED DELIBERATELY, AND NOT TO MAKE A NUMBER LOOK BETTER. This case expected
     * `false` while the gate treated a declared library gap as a refusal. The pilot showed
     * what that costs: ISO/IEC 42001 clause D.2 is real, the library could not parse Annex D,
     * and the gate reported the address as absent from a standard that contains it -- which
     * sends the reader to rewrite a possibly-correct item instead of to fix the extractor.
     * A gap is now UNASSERTED: the item is not cleared, because nothing could check it, and
     * not blamed. The expectation changed because the DESIGN changed. */
    ["a declared annex gap is unasserted, not a refusal", () => gateClauseExists({ ...good, key_support_clause: "A.5.12" }, byKey,
      [{ missing: ["A.5.12"] }]).pass, null],
    ["refuses a must claim behind a should passage", () => gateModalFidelity(
      { ...good, key_support_clause: "B.9.2", key_support: "The organization should consider the competence of the auditors" }, byKey).pass, false],
    ["refuses a must claim whose anchor carries no shall", () => gateModalFidelity(
      { ...good, key_support: "including the frequency, methods, responsibilities, planning requirements and reporting" }, byKey).pass, false],
    ["accepts a requirement claim on a shall anchor", () => gateModalFidelity(good, byKey).pass, true],
    /* normClause extracts an address from a verbose clause field, and must not take a digit out of
     * the document designation. The first four are the shapes a model actually returned. */
    ["normClause: a bare address", () => normClause("9.2.2"), "9.2.2"],
    ["normClause: document, word and title", () => normClause("ISO/IEC 42006 clause 1 (Scope)"), "1"],
    ["normClause: document then address", () => normClause("ISO/IEC 42001 6.1.3"), "6.1.3"],
    ["normClause: an annex control", () => normClause("ISO/IEC 27001 Annex A control A.8.16"), "A.8.16"],
    ["normClause: a dated document does not donate its year", () => normClause("ISO 19011:2026 clause 5.3"), "5.3"],
    ["normClause: an already-normal annex address", () => normClause("A.6.2.4"), "A.6.2.4"],
    /* ============ THE SCOPE-CLAUSE EXEMPTION, BOTH DIRECTIONS ============
     *
     * The positive case is `fcb8a516` verbatim: a scope anchor and a key that reports what two
     * documents govern, carrying a `must` that belongs to the OTHER standard's obligation.
     *
     * The negative case is the one that matters. It keeps the same scope anchor and the same
     * document name, and replaces the scope verb with `requires` -- which is an obligation claim
     * and must STILL be refused. Without this second case the exemption would be "any claim that
     * names a standard", and that is how a real Tier A inflation walks through. */
    ["a descriptive claim about what documents govern is NOT inflation on a scope clause", () => {
      const scope = { clause: "1", title: "Scope", normative: "can",
        text: "The requirements contained in this document, when implemented, support the " +
          "demonstration of competence, consistency and reliability by the bodies performing " +
          "auditing and certification of an artificial intelligence management system (AIMS) " +
          "according to ISO/IEC 42001 for organizations that provide, develop or use AI systems." };
      return gateModalFidelity({
        key_support_clause: "1",
        key_support: "The requirements contained in this document, when implemented, support the " +
          "demonstration of competence",
        options: [{ text: "ISO/IEC 42006 governs certification bodies auditing AI management " +
          "systems; ISO/IEC 42001 governs the AIMS requirements organizations must meet.",
        is_correct: true }],
        explanation: "ISO/IEC 42006 sets requirements for bodies that audit and certify " +
          "organizations' AI management systems. ISO/IEC 42001 defines the AIMS requirements " +
          "that organizations must implement.",
      }, new Map([["1", scope]])).pass;
    }, true],
    ["but a real obligation claim on a scope clause is STILL refused", () => {
      const scope = { clause: "1", title: "Scope", normative: "can",
        text: "This document specifies requirements for bodies providing audit and certification." };
      return gateModalFidelity({
        key_support_clause: "1",
        key_support: "This document specifies requirements for bodies providing audit",
        options: [{ text: "ISO/IEC 42001 requires every organization to document an AI policy " +
          "before certification.", is_correct: true }],
        explanation: "ISO/IEC 42001 requires the policy to be documented.",
      }, new Map([["1", scope]])).pass;
    }, false],
    ["and a bare requirement with no document named is refused on a scope clause too", () => {
      const scope = { clause: "1", title: "Scope", normative: "can",
        text: "This document specifies requirements for bodies providing audit and certification." };
      return gateModalFidelity({
        key_support_clause: "1",
        key_support: "This document specifies requirements for bodies providing audit",
        options: [{ text: "Organizations shall retain documented information of every audit.",
          is_correct: true }],
        explanation: "The records must be kept.",
      }, new Map([["1", scope]])).pass;
    }, false],
    ["refuses superseded wording", () => gateSuperseded({ ...good,
      options: [...good.options, { text: "The Development Team decides" }] }).pass, false],
    /* CHANGED BY RULING, NOT TO MAKE A NUMBER LOOK BETTER. The negation rule is now a FLAG: it
     * fired on a purpose clause and on a noun phrase, and a word test cannot tell either from a
     * verdict. The assertion is therefore two-part -- the item is NOT refused, AND the
     * observation is still recorded. Dropping the note as well would be a gate quietly getting
     * quieter, which is how a real pattern stops being visible. */
    ["a lone negated key is FLAGGED, not refused", () => {
      const r = gateStructure({
        ...good,
        options: [
          { text: "The programme does not require an external body to perform the audit", is_correct: true },
          { text: "The programme requires an external body every year" },
          { text: "The programme requires a qualification register" },
          { text: "The programme requires a corrective action plan first" },
        ],
      });
      return r.pass === true && (r.notes || []).some((n) => /only negated option/.test(n));
    }, true],
    ["refuses a stem that duplicates a live item", () => gateNearDuplicate(good,
      [{ id: "live-1", stem: good.question_text }]).pass, false],
    ["abstains on a stem too short to judge", () => gateNearDuplicate({ question_text: "What is AI?" }, [{ id: "l", stem: "x y z" }]).pass, null],

    /* ============ THE TWO FALSE REFUSALS THE PILOT PRODUCED ============
     * Both from the first four-item run, both real text, both correct items the gate
     * refused. Controls built from the members rather than from imagination, because a
     * control invented around a defect tests the defect and not the class. */
    ["a lettered sub-item inherits the list's shall (real clause 7.2 item)", () => {
      const p72 = {
        clause: "7.2", title: "Competence", normative: "shall",
        text: "The organization shall: a) determine the necessary competence of persons doing work " +
          "under its control that affects its AI performance; b) ensure that these persons are " +
          "competent on the basis of appropriate education, training or experience; c) where " +
          "applicable, take actions to acquire the necessary competence, and evaluate the " +
          "effectiveness of the actions taken; d) retain appropriate documented information as " +
          "evidence of competence.",
      };
      return gateModalFidelity({
        question_text: "Under the AI management system requirements on competence, what must the organization do next?",
        options: [{ text: "Arrange training to acquire the missing competence, then evaluate whether that action worked.", is_correct: true }, { text: "Something else" }],
        key_support_clause: "7.2",
        key_support: "where applicable, take actions to acquire the necessary competence, and evaluate the effectiveness of the actions taken",
      }, new Map([["7.2", p72]])).pass;
    }, true],

    /* ============ 965e4d08: A LIST ITEM'S OWN `can` MUST NOT PREEMPT THE LEAD-IN `shall` ============
     *
     * The director's regression case, ruled 2026-09-29. 42001 clause 6.1.2 item b) reads "is designed
     * such that repeated AI risk assessments CAN produce consistent, valid and comparable results".
     * `anchorForce` saw that `can`, returned "permission", and anchorForceInPassage RETURNED THERE --
     * so the lead-in "The organization shall define and establish an AI risk assessment process that:"
     * was never consulted and a correct requirement item was refused.
     *
     * The `can` is not the item's force: it describes the property the shall requires the process to
     * HAVE. Reading it as a permission inverts the clause. Note the fixture keeps the NOTE sentence
     * with its own `can` and its own full stop between the lead-in and item b), because that is what
     * the real clause contains and it is what defeated the earlier sentence-boundary test. */
    ["a list item's own `can` does not preempt the lead-in shall (965e4d08)", () => {
      const p612 = {
        clause: "6.1.2", title: "AI risk assessment", normative: "shall",
        text: "The organization shall define and establish an AI risk assessment process that: " +
          "a) is informed by and aligned with the AI policy (see 5.2) and AI objectives (see 6.2); " +
          "NOTE When assessing the consequences as part of 6.1.2 d) 1), the organization can utilize " +
          "an AI system impact assessment as indicated in 6.1.4. " +
          "b) is designed such that repeated AI risk assessments can produce consistent, valid and " +
          "comparable results;",
      };
      return gateModalFidelity({
        question_text: "What does ISO/IEC 42001 require of the AI risk assessment process?",
        options: [{ text: "It must be designed so that repeated assessments give consistent, valid and comparable results.", is_correct: true }, { text: "Something else" }],
        key_support_clause: "6.1.2",
        key_support: "b) is designed such that repeated AI risk assessments can produce consistent, valid and comparable results;",
      }, new Map([["6.1.2", p612]])).pass;
    }, true],

    /* AND THE NEGATIVE HALF: the loosening must not let a permission license a requirement wherever
     * the anchor is NOT a list item. A finished shall sentence followed by ordinary prose leaves the
     * anchor preceded by prose rather than by a marker, so condition 2 fails and the gate still
     * refuses. Without this the fix is indistinguishable from switching the gate off on any passage
     * whose class is shall. */
    ["prose after a finished shall sentence does NOT inherit it", () => {
      const p = {
        clause: "9.9", title: "Fixture", normative: "shall",
        text: "The organization shall retain documented information as evidence. " +
          "The organization can additionally publish a summary of that evidence externally.",
      };
      return gateModalFidelity({
        question_text: "What does the standard require?",
        options: [{ text: "The organization must publish a summary of the evidence externally.", is_correct: true }, { text: "Other" }],
        key_support_clause: "9.9",
        key_support: "The organization can additionally publish a summary of that evidence externally.",
      }, new Map([["9.9", p]])).pass;
    }, false],

    /* a list item with no lead-in modal at all keeps its own force -- the inheritance needs a lead-in */
    ["a list item under a colon with NO modal keeps its own permission", () => {
      const p = {
        clause: "9.8", title: "Fixture", normative: "shall",
        text: "The organization considers the following: a) it can extend the guidance as needed;",
      };
      return gateModalFidelity({
        question_text: "What does the standard require?",
        options: [{ text: "The organization must extend the guidance.", is_correct: true }, { text: "Other" }],
        key_support_clause: "9.8",
        key_support: "a) it can extend the guidance as needed;",
      }, new Map([["9.8", p]])).pass;
    }, false],
    ["a passage with no upstream shall still cannot license a must", () => {
      const soft2 = { clause: "B.1", title: "General", normative: "can",
        text: "The organization can extend or modify the implementation guidance or define their own " +
          "implementation of a control according to their specific requirements and risk treatment needs." };
      return gateModalFidelity({
        question_text: "What must the organization do with the implementation guidance?",
        options: [{ text: "It must modify the guidance", is_correct: true }, { text: "Other" }],
        key_support_clause: "B.1",
        key_support: "The organization can extend or modify the implementation guidance or define their own implementation of a control",
      }, new Map([["B.1", soft2]])).pass;
    }, false],
    /* ============ EM-DASH LISTS, FROM THE PILOT'S OWN REFUSALS ============
     * Real ISO/IEC 42001 text. The first two are the clause 7.2 and 6.1.2 anchors the gate
     * refused for carrying no shall; the third is the negative half -- a sentence that ended
     * before the anchor must NOT lend its modal, or this is not inheritance, it is a
     * loophole. */
    ["an em-dash list item inherits the lead-in's shall", () => {
      const p = { clause: "7.2", normative: "shall", title: "Competence",
        text: "The organization shall: - determine the necessary competence of person(s) doing work " +
          "under its control that affects its AI performance; - ensure that these persons are competent; " +
          "- where applicable, take actions to acquire the necessary competence, and evaluate the " +
          "effectiveness of the actions taken." };
      return gateModalFidelity({
        question_text: "What must the organization do?",
        options: [{ text: "Take actions to acquire the competence and evaluate them", is_correct: true }, { text: "Other" }],
        key_support_clause: "7.2",
        key_support: "where applicable, take actions to acquire the necessary competence, and evaluate the effectiveness of the actions taken",
      }, new Map([["7.2", p]])).pass;
    }, true],
    ["a clause reference in the intervening text is not a sentence end", () => {
      const p = { clause: "6.1.2", normative: "shall", title: "AI risk assessment",
        text: "The organization shall define and establish an AI risk assessment process that: a) is " +
          "informed by and aligned with the AI policy (see 5.2) and AI objectives; b) is repeatable; " +
          "c) identifies risks; d) analyses the AI risks to: 1) assess the potential consequences to " +
          "the organization, individuals and societies that would result if the identified risks were " +
          "to materialize." };
      return gateModalFidelity({
        question_text: "What must the process do?",
        options: [{ text: "Assess the potential consequences if the risks materialize", is_correct: true }, { text: "Other" }],
        key_support_clause: "6.1.2",
        key_support: "assess the potential consequences to the organization, individuals and societies that would result if the identified risks were to materialize",
      }, new Map([["6.1.2", p]])).pass;
    }, true],
    ["a full stop INSIDE a list item does not close the list (real 42001 6.1.2)", () => {
      /* Verbatim from the extracted passage, including the clause reference that ends item
       * b) with a genuine full stop three items before the anchor. A sentence-boundary test
       * refused this and the item is a requirement. */
      const p = { clause: "6.1.2", normative: "shall", title: "AI risk assessment",
        text: "The organization shall define and establish an AI risk assessment process that: " +
          "a) is informed by and aligned with the AI policy (see 5.2) and AI objectives; " +
          "b) shall utilize an AI system impact assessment as indicated in 6.1.4. " +
          "c) identifies risks that aid or prevent achieving its AI objectives; " +
          "d) analyses the AI risks to: 1) assess the potential consequences to the " +
          "organization, individuals and societies that would result if the identified risks " +
          "were to materialize." };
      return gateModalFidelity({
        question_text: "What must the AI risk assessment process do?",
        options: [{ text: "Assess the potential consequences if the identified risks materialize", is_correct: true }, { text: "Other" }],
        key_support_clause: "6.1.2",
        key_support: "assess the potential consequences to the organization, individuals and societies that would result if the identified risks were to materialize",
      }, new Map([["6.1.2", p]])).pass;
    }, true],
    ["a shall in a SEPARATE, FINISHED sentence does not lend its modal", () => {
      const p = { clause: "X.1", normative: "shall", title: "Mixed",
        text: "The organization shall document the policy. Guidance on communication is available in " +
          "several forms, including the following practices that many organizations adopt." };
      /* The KEY asserts the requirement, because that is the field the gate now reads. The
       * point of the case is unchanged: the `shall` sentence FINISHED before the anchor, so it
       * lends the anchor nothing and a requirement claim is refused. */
      return gateModalFidelity({
        question_text: "What follows about communication?",
        options: [{ text: "The organization shall adopt the listed practices", is_correct: true }, { text: "Other" }],
        explanation: "The listed practices must be adopted.",
        key_support_clause: "X.1",
        key_support: "including the following practices that many organizations adopt",
      }, new Map([["X.1", p]])).pass;
    }, false],

    /* ============ THE DIRECTOR'S READ OF THE FIRST PILOT ============
     * Each of these is a real item he named, and each names the gate that was wrong about it. */

    ["1.6: modal-fidelity must NOT read the stem's \"must\"", () => {
      /* The stem ASKS what the standard requires; the key and the anchor both say "can". */
      const p = { clause: "B.1", normative: "can", title: "General",
        text: "The organization can extend or modify the implementation guidance or define their own " +
          "implementation of a control according to their specific requirements." };
      return gateModalFidelity({
        question_text: "Which response is consistent with what the standard must be read as requiring here?",
        options: [{ text: "The organization can extend or modify the guidance for its own needs", is_correct: true },
          { text: "Something else" }],
        explanation: "Annex B guidance can be extended or modified.",
        key_support_clause: "B.1",
        key_support: "The organization can extend or modify the implementation guidance or define their own implementation of a control",
      }, new Map([["B.1", p]])).pass;
    }, true],
    ["a MUST in the key is still refused on a can passage", () => {
      const p = { clause: "B.1", normative: "can", title: "General",
        text: "The organization can extend or modify the implementation guidance or define their own implementation." };
      return gateModalFidelity({
        question_text: "What follows?",
        options: [{ text: "The organization must modify the implementation guidance", is_correct: true }, { text: "Other" }],
        explanation: "It must be modified.",
        key_support_clause: "B.1",
        key_support: "The organization can extend or modify the implementation guidance or define their own implementation",
      }, new Map([["B.1", p]])).pass;
    }, false],

    ["2.2: \"not only\" is a scope widener, not a verdict negation", () => gateStructure({
      question_text: "Which scope applies?",
      /* The distractors deliberately do NOT share an opening content word: the first draft had
       * all three opening with "Systems", so the case failed on the opening-word rule and told
       * me nothing about the negation rule it was written for. A control has to isolate the
       * thing it is testing. */
      options: [
        { text: "Every AI system in use, not only those built in house", is_correct: true },
        { text: "Models procured under a framework agreement" },
        { text: "Applications listed in the statement of applicability" },
        { text: "Tools operated by a third party on the organization's behalf" },
      ],
    }).pass, true],
    /* THE OPENING-WORD RULE IS STILL A REJECTION, by ruling: three distractors opening on the
     * same content word is a cue, not a grammatical accident. The director's example was
     * "Awareness, Awareness, Awareness, X". This is the case that proves the negation change did
     * not quietly disarm the whole gate. */
    ["a repeated opening content word is still REFUSED", () => gateStructure({
      question_text: "Which applies?",
      options: [
        { text: "Competence is determined for persons whose work affects AI performance", is_correct: true },
        { text: "Awareness is provided to every person in the organization" },
        { text: "Awareness is recorded for each external provider" },
        { text: "Awareness is reviewed at each management review" },
      ],
    }).pass, false],

    ["#15: a phrase every distractor shares and the key lacks", () => gateSharedDistractorPhrase({
      question_text: "Which property is NOT preserved by the definition?",
      options: [
        { text: "Accountability", is_correct: true },
        { text: "Confidentiality, which is one of the properties that the definition preserves" },
        { text: "Integrity, which is one of the properties that the definition preserves" },
        { text: "Availability, which is one of the properties that the definition preserves" },
      ],
    }).pass, false],
    ["parallel options that share a phrase WITH the key do not fire", () => gateSharedDistractorPhrase({
      question_text: "Which applies?",
      options: [
        { text: "The organization shall retain documented information of the results", is_correct: true },
        { text: "The organization shall retain documented information of the plan" },
        { text: "The organization shall retain documented information of the scope" },
        { text: "The organization shall retain documented information of the policy" },
      ],
    }).pass, true],

    ["#3 and #30: a key anchored in a SUPPORTING passage is refused", () =>
      gateAnchorIsPrimary({ key_support_clause: "B.6.2.6" }, ["A.6.1", "A.6.2"], ["B.6.2.6"]).pass, false],
    ["a key anchored in a primary passage passes", () =>
      gateAnchorIsPrimary({ key_support_clause: "9.2.2" }, ["9.2.1", "9.2.2"], ["3.18"]).pass, true],
    ["a task with no primary map is UNASSERTED, not a refusal", () =>
      gateAnchorIsPrimary({ key_support_clause: "9.2.2" }, [], []).pass, null],

    ["reproduction is UNASSERTED without the leak index, never clean", () =>
      gateReproduction({ question_text: "x", options: [{ text: "y", is_correct: true }] }, null, null).pass, null],

    /* ============ THE DIRECTOR'S SECOND READ: FIVE GATES THAT REFUSED CORRECT ITEMS ============
     * Every case below is a real pilot-2 item he named, with the real clause text. */

    ["6.1.3 f) inherits the lead-in shall when the ANCHOR carries the marker", () => {
      const p = { clause: "6.1.3", normative: "shall", title: "AI risk treatment",
        text: "Taking the risk assessment results into account, the organization shall define an AI risk " +
          "treatment process to: a) select appropriate AI risk treatment options; b) determine all " +
          "controls that are necessary; c) compare the controls with those in Annex A; d) produce " +
          "an AI risk treatment plan; e) integrate with other management systems, if applicable. " +
          "f) produce a statement of applicability that contains the necessary controls and provide " +
          "justification for inclusion and exclusion of controls." };
      return gateModalFidelity({
        question_text: "What must the organization produce?",
        options: [{ text: "A statement of applicability that must justify inclusion and exclusion", is_correct: true },
          { text: "Other" }],
        explanation: "Clause 6.1.3 f) requires the statement of applicability.",
        key_support_clause: "6.1.3",
        key_support: "f) produce a statement of applicability that contains the necessary controls and provide justification for inclusion and exclusion of controls.",
      }, new Map([["6.1.3", p]])).pass;
    }, true],

    ["a PERMISSION claim on a can passage passes -- nothing to inflate", () => {
      const p = { clause: "A.1", normative: "can", title: "General",
        text: "Not all the control objectives and controls listed are required to be used, and the " +
          "organization can design and implement its own controls." };
      return gateModalFidelity({
        question_text: "Which description is correct?",
        options: [{ text: "The organization can design and implement its own controls", is_correct: true }, { text: "Other" }],
        explanation: "Annex A.1 allows an organization to design its own controls.",
        key_support_clause: "A.1",
        key_support: "the organization can design and implement its own controls",
      }, new Map([["A.1", p]])).pass;
    }, true],

    ["\"need not\" is the ABSENCE of a requirement, not an assertion of one", () => {
      const p = { clause: "B.1", normative: "can", title: "General",
        text: "Organizations do not have to document or justify inclusion or exclusion of " +
          "implementation guidance in the statement of applicability." };
      return gateModalFidelity({
        question_text: "What follows for the implementation guidance?",
        options: [{ text: "It need not be documented or justified in the statement of applicability", is_correct: true },
          { text: "Other" }],
        explanation: "Annex B.1 says organizations do not have to document or justify the guidance.",
        key_support_clause: "B.1",
        key_support: "Organizations do not have to document or justify inclusion or exclusion of implementation guidance",
      }, new Map([["B.1", p]])).pass;
    }, true],

    ["a NOTE carrying shall inside an informative definition licenses a requirement", () => {
      /* Clause 3.26 is a definition, so its CLASS is informative -- and its Note 2 says shall.
       * The sentence governs; the class is only the fallback. */
      const p = { clause: "3.26", normative: "informative", title: "statement of applicability",
        text: "documented statement describing the control objectives and controls that are relevant " +
          "and applicable. NOTE 2 All necessary controls shall be reflected in the statement of " +
          "applicability." };
      return gateModalFidelity({
        question_text: "What must appear in the statement of applicability?",
        options: [{ text: "All necessary controls, which shall be reflected there", is_correct: true }, { text: "Other" }],
        explanation: "Note 2 to 3.26 requires it.",
        key_support_clause: "3.26",
        key_support: "All necessary controls shall be reflected in the statement of applicability",
      }, new Map([["3.26", p]])).pass;
    }, true],
    ["and a definition sentence with NO modal still cannot license a requirement", () => {
      const p = { clause: "3.4", normative: "informative", title: "management system",
        text: "set of interrelated or interacting elements of an organization to establish policies " +
          "and objectives, as well as processes to achieve those objectives." };
      return gateModalFidelity({
        question_text: "What must a management system include?",
        options: [{ text: "It shall include the processes to achieve the objectives", is_correct: true }, { text: "Other" }],
        explanation: "The definition requires the processes.",
        key_support_clause: "3.4",
        key_support: "set of interrelated or interacting elements of an organization to establish policies and objectives",
      }, new Map([["3.4", p]])).pass;
    }, false],

    ["B.x.y guidance counts as primary when A.x.y is primary", () =>
      gateAnchorIsPrimary({ key_support_clause: "B.2.3" }, ["A.2.2", "A.2.3", "A.2.4"], ["B.2.x"]).pass, true],
    ["but only for ITS OWN control: B.6.2.6 fails where A.6.2.6 is not primary", () =>
      gateAnchorIsPrimary({ key_support_clause: "B.6.2.6" }, ["A.6.1", "A.6.2", "B.6.2.1"], ["B.6.2.6"]).pass, false],

    /* ============ THREE MORE FROM THE 40-ITEM PILOT ============ */
    ["a distractor pointer may be short; the key's anchor may not", () => {
      const v = gateVerbatim({ ...good,
        distractor_support: [{ index: 1, clause: "9.2.2", support: "audit programme" }] }, byKey);
      return v.pass;
    }, true],
    ["a one-word distractor pointer is still refused", () => gateVerbatim({ ...good,
      distractor_support: [{ index: 1, clause: "9.2.2", support: "programme" }] }, byKey).pass, false],
    ["a clause id carrying its title still resolves", () =>
      gateClauseExists({ ...good, key_support_clause: "9.2.2 (Internal audit programme The organization shall)" }, byKey).pass, true],
    ["a library gap is UNASSERTED, not a refusal", () =>
      gateClauseExists({ ...good, key_support_clause: "D.2" }, byKey, [], [{ holes: ["D.2"] }]).pass, null],
    ["an address nothing declares missing is still a refusal", () =>
      gateClauseExists({ ...good, key_support_clause: "Z.9.9" }, byKey, [], [{ holes: ["D.2"] }]).pass, false],
    ["the Scrum word list does not fire on an ISO item", () => gateSuperseded({ ...good,
      question_text: "A development team evaluates a new AI model on data from a single region." }, "AIMS-F").pass, true],
    ["the Scrum word list still fires on a Scrum item", () => gateSuperseded({ ...good,
      question_text: "The Development Team estimates the work." }, "SM-AI-I").pass, false],

    ["the noun \"requirements\" is not a deontic claim (real clause B.1 item)", () => {
      const soft2 = { clause: "B.1", title: "General", normative: "can",
        text: "The organization can extend or modify the implementation guidance or define their own " +
          "implementation of a control according to their specific requirements and risk treatment needs." };
      return gateModalFidelity({
        question_text: "Which description of Annex B relative to the Annex A controls is correct?",
        options: [{ text: "Annex B gives implementation guidance, and the organization can extend or modify it for its own requirements.", is_correct: true }, { text: "Other" }],
        key_support_clause: "B.1",
        key_support: "The organization can extend or modify the implementation guidance or define their own implementation of a control",
      }, new Map([["B.1", soft2]])).pass;
    }, true],

    /* ============ A CONTAINER RESOLVES THROUGH ITS CHILDREN ============ */
    ["clause-exists resolves a container through its children", () => gateClauseExists(
      { key_support_clause: "10", key_support: "x" },
      new Map([["10.1", { text: "a" }], ["10.2", { text: "b" }]])).pass, true],
    /* The case the ruling named: 9.3.1.2 held only as 9.3.1.2.1. */
    ["clause-exists resolves 9.3.1.2 through 9.3.1.2.1", () => gateClauseExists(
      { key_support_clause: "9.3.1.2", key_support: "x" },
      new Map([["9.3.1.2.1", { text: "a" }]])).pass, true],
    /* AND IT IS A CONTAINER RULE, NOT A PREFIX RULE. `9.2` must not resolve through `9.20`, which is a
     * sibling two orders away and not a child of anything. */
    ["clause-exists does NOT resolve 9.2 through 9.20", () => gateClauseExists(
      { key_support_clause: "9.2", key_support: "x" },
      new Map([["9.20", { text: "a" }]])).pass, false],
    /* An address with neither a row nor children still fails, or the rule would clear anything. */
    ["clause-exists still refuses an invented address", () => gateClauseExists(
      { key_support_clause: "19.7", key_support: "x" },
      new Map([["10.1", { text: "a" }]])).pass, false],
    /* The resolution is RECORDED, so a pass via children is distinguishable from a pass on the address. */
    ["clause-exists records that it resolved as a container", () => /as a container/.test(
      gateClauseExists({ key_support_clause: "10", key_support: "x" },
        new Map([["10.1", { text: "a" }]])).reason), true],

    /* ============ G10, ISO/IEC 27000 IN A SERVED FIELD ============ */
    ["no-27000 refuses the standard named in an explanation", () => gateNo27000({
      question_text: "Which statement defines an information asset?",
      options: [{ text: "Anything of value to the organization" }, { text: "Any server" }],
      explanation: "ISO/IEC 27000 defines the term; 27001 then uses it.",
    }).pass, false],
    ["no-27000 refuses it in a stem", () => gateNo27000({
      question_text: "As ISO/IEC 27000 defines it, what is availability?",
      options: [{ text: "Accessible on demand" }, { text: "Encrypted at rest" }],
      explanation: "Availability is being accessible when an authorised party needs it.",
    }).pass, false],
    ["no-27000 refuses it in an option", () => gateNo27000({
      question_text: "Which standard supplies the vocabulary?",
      options: [{ text: "ISO/IEC 27000" }, { text: "ISO 9001" }],
      explanation: "The vocabulary clause delegates.",
    }).pass, false],
    /* CLEAN: 27001 is the standard an explanation SHOULD cite, and it must not trip the rule. */
    ["no-27000 passes an explanation citing 27001", () => gateNo27000({
      question_text: "Which statement defines an information asset?",
      options: [{ text: "Anything of value to the organization" }, { text: "Any server" }],
      explanation: "ISO/IEC 27001 uses the term in clause 8; an asset is anything of value to the organization.",
    }).pass, true],
    /* A LONGER NUMBER CONTAINING 27000 IS NOT A CITATION -- the word boundary, both directions. */
    ["no-27000 passes a six-figure number containing 27000", () => gateNo27000({
      question_text: "The register holds 127000 records. What does the auditor sample?",
      options: [{ text: "A risk-based subset" }, { text: "Every record" }],
      explanation: "Sampling is risk-based; 270000 would change nothing about the method.",
    }).pass, true],
    /* `key_support` is INTERNAL and is exactly where an anchor to 27000 belongs. */
    ["no-27000 ignores key_support, which is never served", () => gateNo27000({
      question_text: "Which statement defines an information asset?",
      options: [{ text: "Anything of value to the organization" }, { text: "Any server" }],
      explanation: "An asset is anything of value to the organization.",
      key_support_clause: "3.2",
      key_support: "ISO/IEC 27000:2018, 3.2: asset -- anything that has value to the organization",
    }).pass, true],
    ["refuses a clause-number recall stem", () => {
      const recall = { ...good, question_text: "Improvement in ISO/IEC 42001 is split between " +
        "clauses 10.1 and 10.2. Which obligation belongs to 10.1?" };
      return runCodeGates(recall, { passagesByKey: byKey, primaryClauses: new Set(["9.2.2"]),
        supportingClauses: new Set(["B.9.2"]), sources: [], leak: null })
        .failed.includes("clause-number-recall");
    }, true],
    ["does NOT refuse a stem citing a clause as authority", () => {
      const auth = { ...good, question_text: "Top management is drafting the AI policy. Which of the " +
        "following must the policy contain according to clause 5.2?" };
      return runCodeGates(auth, { passagesByKey: byKey, primaryClauses: new Set(["9.2.2"]),
        supportingClauses: new Set(["B.9.2"]), sources: [], leak: null })
        .failed.includes("clause-number-recall");
    }, false],
  ];

  const fails = [];
  for (const [name, fn, want] of cases) {
    let got;
    try { got = fn(); } catch (e) { got = "threw: " + (e && e.message); }
    if (got !== want) fails.push(name + ": expected " + JSON.stringify(want) + ", got " + JSON.stringify(got));
  }
  return { examined: cases.length, fails };
}
