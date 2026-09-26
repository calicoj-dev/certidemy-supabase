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
const LIST_MARKER_BEFORE = (() => {
  const dashes = [0x2d, 0x2010, 0x2011, 0x2012, 0x2013, 0x2014, 0x2015, 0x2022, 0x2043]
    .map((c) => String.fromCharCode(c)).join("");
  const d = "[" + dashes + "]";
  return new RegExp("(?:[;:]|\\)|" + d + ")\\s*(?:\\d+\\)|[a-z]\\)|" + d + ")?\\s*$");
})();

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

export function claimStrength(text) {
  const t = String(text || "");
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
  if (direct !== "none") return direct;
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
  const opensListItem = LIST_MARKER_BEFORE.test(before.slice(-40));
  if (!opensListItem) return direct;
  if (/\b(?:shall|must)\b[^:]{0,300}:/.test(before)) return "requirement";
  if (/\bshould\b[^:]{0,300}:/.test(before)) return "recommendation";
  return direct;
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
export function normClause(c) {
  const m = /^\s*([A-Z]?\.?\d+(?:\.\d+){0,3})/.exec(String(c || ""));
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
  const bad = [], unheld = [];
  for (const c of named) {
    if (passagesByKey.has(c)) continue;
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
  return { id: "clause-exists", pass: true, examined: named.length, reason: named.length + " clause(s) resolve" };
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

  const claimText = [item.question_text, keyOptionText(item)].filter(Boolean).join(" ");
  const claim = claimStrength(claimText);
  const anchorClaim = anchorForceInPassage(item.key_support || "", p);
  const licensed = LICENSES[p.normative] || [];

  if (!licensed.includes(claim)) {
    return { id: "modal-fidelity", pass: false, examined: 1,
      reason: "the item states a " + claim + " and clause " + item.key_support_clause +
        " is " + p.normative + " -- a " + p.normative + " passage cannot license a " + claim };
  }
  /* The PASSAGE's class is not enough: a shall-clause contains sentences that are not
   * themselves requirements. The anchor sentence has to carry the modal too. */
  if (claim === "requirement" && anchorClaim !== "requirement") {
    return { id: "modal-fidelity", pass: false, examined: 1,
      reason: "the item states a requirement and the anchor sentence carries no shall/must -- " +
        "the passage's class is not the sentence's claim" };
  }
  if (claim === "recommendation" && anchorClaim === "permission") {
    return { id: "modal-fidelity", pass: false, examined: 1,
      reason: "the item states a recommendation and the anchor sentence only permits" };
  }
  return { id: "modal-fidelity", pass: true, examined: 1,
    reason: "item claims a " + claim + "; anchor is a " + anchorClaim + " in a " + p.normative + " passage" };
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

  /* odd-one-out, negation form */
  const NEG = /\b(?:not|never|no|cannot|without|except|excluding|neither)\b/i;
  const negs = opts.map((t) => NEG.test(t));
  if (ki >= 0 && negs[ki] && negs.filter(Boolean).length === 1) {
    problems.push("the key is the only negated option -- a reader can find it without knowing the subject");
  }
  if (ki >= 0 && !negs[ki] && negs.filter(Boolean).length === opts.length - 1) {
    problems.push("every distractor is negated and the key is not");
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
    reason: problems.length ? problems.join("; ") : opts.length + " options, no structural tell" };
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

/** Run every code gate. `pass: null` anywhere means the item is not cleared. */
export function runCodeGates(item, { passagesByKey, annexGaps = [], sequenceGaps = [], liveStemsForTask = [], cueCfg = CUE_CFG, cert }) {
  const gates = [
    gateClauseExists(item, passagesByKey, annexGaps, sequenceGaps),
    gateVerbatim(item, passagesByKey),
    gateModalFidelity(item, passagesByKey),
    gateSuperseded(item, cert),
    gateStructure(item, cueCfg),
    gateNearDuplicate(item, liveStemsForTask),
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
    ["accepts a sound grounded item", () => runCodeGates(good, { passagesByKey: byKey, liveStemsForTask: [{ id: "x", stem: "Completely unrelated stem about data quality and provenance records." }] }).passed, true],
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
    ["refuses superseded wording", () => gateSuperseded({ ...good,
      options: [...good.options, { text: "The Development Team decides" }] }).pass, false],
    ["refuses a key that is the only negated option", () => gateStructure({
      ...good,
      options: [
        { text: "The programme does not require an external body to perform the audit", is_correct: true },
        { text: "The programme requires an external body every year" },
        { text: "The programme requires a qualification register" },
        { text: "The programme requires a corrective action plan first" },
      ],
    }).pass, false],
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
      return gateModalFidelity({
        question_text: "What must the organization do about communication?",
        options: [{ text: "Adopt the listed practices", is_correct: true }, { text: "Other" }],
        key_support_clause: "X.1",
        key_support: "including the following practices that many organizations adopt",
      }, new Map([["X.1", p]])).pass;
    }, false],

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
  ];

  const fails = [];
  for (const [name, fn, want] of cases) {
    let got;
    try { got = fn(); } catch (e) { got = "threw: " + (e && e.message); }
    if (got !== want) fails.push(name + ": expected " + JSON.stringify(want) + ", got " + JSON.stringify(got));
  }
  return { examined: cases.length, fails };
}
