/**
 * clause-number-recall.mjs -- a stem may cite a clause number only if the item is answerable without
 * knowing what that number contains.
 *
 * Ruled PROMPT-93 s2. Four batch-1 survivors asked what sits at a numbered clause, which tests memory of
 * ISO's numbering rather than understanding of the requirement.
 *
 * ============ THE DISCRIMINATOR IS THE CONSTRUCTION, NOT THE NUMBER ============
 *
 * Every one of the six control items cites a clause. Counting citations separates none of them. What
 * separates them is what the citation DOES in the sentence:
 *
 *   CONTAINER   the clause is where the answer lives, and nothing else says which answer
 *               "which description matches what ISO/IEC 42001 PLACES AT the clause numbered 9.2.1"
 *               "which obligation BELONGS TO 10.1"
 *               Delete the number and the stem asks nothing specific. FIRES.
 *
 *   AUTHORITY   the clause is the source of the rule, and the stem names its own subject
 *               "Top management is drafting the AI policy. Which of the following must the policy contain
 *                ACCORDING TO clause 5.2?"
 *               Delete the number and the stem still asks about the AI policy. DOES NOT FIRE.
 *
 * ============ WHAT THIS IS AND IS NOT ============
 *
 * This is a LEXICAL PROXY for a structural property, and it is declared as one. It reads the construction
 * joining the interrogative to the reference. It cannot see:
 *
 *   - a stem that names its subject so vaguely that the number is doing the work anyway;
 *   - a container construction phrased in a way the list below does not carry;
 *   - whether the topic a stem does name is the topic the key is about.
 *
 * So a clean result means "no declared container construction", never "no recall item". The named
 * CONTAINER and AUTHORITY lists are what makes that checkable: each is asserted in both directions against
 * the real control stems, so a future tightening that breaks a genuine authority citation fails loudly
 * instead of silently rejecting correct items.
 */

/* A clause reference as it actually appears: a bare number, a labelled one, "the clause numbered N", or an
 * anaphor pointing back at one already named ("that clause"). The anaphor is in the list because
 * e11bd9f1's container construction reaches its reference that way and nothing else in the stem does. */
const REF = "(?:the\\s+)?(?:clause|subclause|control|annex|section)?\\s*(?:numbered\\s+)?" +
  "[0-9]+(?:\\.[0-9]+)*|that\\s+clause|the\\s+clause|this\\s+clause";

/* Up to five intervening words, because a real construction reads
 * "part of the AI standard's version of that clause". */
const GAP = "(?:[A-Za-z'’-]+\\s+){0,5}";

/* ============ CONTAINER: the clause holds the answer ============
 * Each entry is declared with the control stem that put it here, so nothing in this list is speculative. */
export const CONTAINER = [
  { id: "places-at", why: "b90e65f1, 90fff510",
    re: new RegExp("plac(?:e|es|ed|ing)\\s+" + GAP + "(?:at|in|under|on)\\s+" + GAP + "(?:" + REF + ")", "i") },
  { id: "belongs-to", why: "ce7cd810",
    re: new RegExp("belong(?:s|ing)?\\s+to\\s+" + GAP + "(?:" + REF + ")", "i") },
  { id: "part-of", why: "e11bd9f1",
    re: new RegExp("(?:part|component|element)\\s+of\\s+" + GAP + "(?:" + REF + ")", "i") },
  { id: "sits-at", why: "declared: the same relation with a positional verb",
    re: new RegExp("(?:sits?|appears?|falls?|comes?|stands?)\\s+(?:at|in|under|within)\\s+" +
      GAP + "(?:" + REF + ")", "i") },
  { id: "found-at", why: "declared: the same relation in the passive",
    re: new RegExp("(?:found|located|set\\s+out|stated|carried|listed|given|contained|covered)\\s+" +
      "(?:at|in|under|within)\\s+" + GAP + "(?:" + REF + ")", "i") },
  { id: "clause-carries", why: "declared: the clause as grammatical subject of a containment verb",
    re: new RegExp("(?:" + REF + ")\\s+" + GAP + "(?:carries|contains|holds|covers|comprises)", "i") },
  { id: "matches-clause",
    why: "3d1d332c, found by READING the batch-2 citers after the detector reported zero: 'which set of " +
      "determinations matches that clause' is b90e65f1's relation with a different verb",
    re: new RegExp("(?:match(?:es|ing)?|correspond(?:s|ing)?|belong(?:s|ing)?)\\s+" + GAP +
      "(?:to\\s+)?(?:" + REF + ")", "i") },
  { id: "numbered", why: "b90e65f1: the number is named AS a number",
    re: /the\s+clause\s+numbered/i },
];

/* ============ AUTHORITY: the clause is the source, and the subject is named elsewhere ============
 * Present only so the controls can assert these do NOT fire. The detector does not consult this list to
 * cancel a container match: a stem carrying both constructions is asking a recall question with a citation
 * attached, and a cancelling rule would let it through. */
export const AUTHORITY = [
  { id: "according-to", why: "152f5b26", re: /according\s+to\s+/i },
  { id: "as-required-by", why: "declared", re: /as\s+(?:required|defined|stated|set\s+out)\s+by\s+/i },
  { id: "clause-asks", why: "a5c4095a: the clause as actor, the subject in the scenario",
    re: new RegExp("(?:" + REF + ")\\s+(?:asks?|requires?|states?|says?|defines?|expects?|obliges?)", "i") },
];

/* EXPORTED, because a caller that writes its own version of this counts a different population than the
 * gate judges -- which is exactly what the first version of check-clause-number-recall did. */
export const CITES_CLAUSE = new RegExp("(?:clause|subclause|annex|control|section)\\s*[0-9]+(?:\\.[0-9]+)*" +
  "|\\b[0-9]+\\.[0-9]+(?:\\.[0-9]+)*\\b|that\\s+clause|this\\s+clause", "i");
export const citesClause = (item) => CITES_CLAUSE.test(String((item && item.question_text) || ""));

/**
 * @returns {{ pass: boolean, examined: boolean, reason: string|null, hits: string[] }}
 *   `examined: false` where there is nothing to judge -- no stem at all. A stem with no clause reference is
 *   EXAMINED and passes, because "it cites nothing" is a real answer to the question asked.
 */
export function clauseNumberRecall(item) {
  const stem = String((item && item.question_text) || "").trim();
  if (!stem) return { pass: false, examined: false, reason: "no stem to examine", hits: [] };
  if (!CITES_CLAUSE.test(stem)) {
    return { pass: true, examined: true, reason: null, hits: [] };
  }
  const hits = CONTAINER.filter((c) => c.re.test(stem)).map((c) => c.id);
  if (!hits.length) return { pass: true, examined: true, reason: null, hits: [] };
  return {
    pass: false, examined: true, hits,
    reason: "the stem asks what the clause CONTAINS (" + hits.join(", ") +
      "), so the item tests recall of ISO's numbering rather than of the requirement",
  };
}

/* ---------------------------------------------------------------- controls
 * The four positives and two negatives are the director's, quoted from the batch-1 artifact rather than
 * paraphrased -- a control built from a paraphrase tests the paraphrase. */
const POS = [
  ["b90e65f1", "An organisation already certified to ISO/IEC 27001 is mapping its existing arrangements onto " +
    "ISO/IEC 42001, whose clauses are numbered the same way. Which description matches what ISO/IEC 42001 " +
    "places at the clause numbered 9.2.1?"],
  ["90fff510", "ISO/IEC 42001 and ISO/IEC 27001 number their management review provisions identically. " +
    "What does ISO/IEC 42001 place on top management at 9.3.1?"],
  ["ce7cd810", "Improvement in ISO/IEC 42001 is split between clauses 10.1 and 10.2, following the same " +
    "pattern as ISO/IEC 27001. Which obligation belongs to 10.1?"],
  ["e11bd9f1", "Clause 4.1 of ISO/IEC 42001 carries the harmonised title also used in ISO 9001 and " +
    "ISO/IEC 27001. Which requirement is part of the AI standard's version of that clause?"],
];
const NEG = [
  ["a5c4095a", "An organization has listed requirements raised by customers, a sector regulator and a trade " +
    "body. What does clause 4.2 ask it to do next with that list?"],
  ["152f5b26", "Top management is drafting the AI policy. Which of the following must the policy contain " +
    "according to clause 5.2?"],
];

export function clauseNumberRecallControls() {
  const out = [];
  const ok = (what, cond, detail) => out.push({ what, pass: !!cond, detail: cond ? null : detail });
  for (const [id, stem] of POS) {
    const v = clauseNumberRecall({ question_text: stem });
    ok("POSITIVE " + id + " fires", v.pass === false && v.examined,
      "did not fire (hits: " + v.hits.join(",") + ")");
  }
  for (const [id, stem] of NEG) {
    const v = clauseNumberRecall({ question_text: stem });
    ok("NEGATIVE " + id + " does NOT fire", v.pass === true && v.examined,
      "fired on a clause cited as authority (hits: " + v.hits.join(",") + ")");
  }
  /* a stem citing nothing is EXAMINED and passes -- not unexamined */
  const none = clauseNumberRecall({ question_text: "Which of the following is a role an organization may hold?" });
  ok("a stem with no clause reference is examined and passes", none.pass && none.examined,
    "examined=" + none.examined + " pass=" + none.pass);
  /* and an empty stem is UNEXAMINED, never a pass */
  const empty = clauseNumberRecall({ question_text: "   " });
  ok("an empty stem is UNEXAMINED, not a pass", empty.examined === false && empty.pass === false,
    "examined=" + empty.examined + " pass=" + empty.pass);
  /* the authority list must be able to match its own members, or the negatives are passing by accident */
  for (const a of AUTHORITY) {
    const subject = a.id === "according-to" ? "must the policy contain according to clause 5.2?"
      : a.id === "as-required-by" ? "as required by clause 7.5?"
        : "what does clause 4.2 ask it to do?";
    ok("AUTHORITY " + a.id + " matches its own example", a.re.test(subject), "did not match: " + subject);
  }
  /* BOTH DIRECTIONS on the anaphor, because "that clause" is the loosest reference in the set */
  const anaphorContainer = clauseNumberRecall({
    question_text: "Clause 8.3 concerns the AI system life cycle. Which activity sits under that clause?" });
  ok("an anaphoric container reference fires", anaphorContainer.pass === false, "did not fire");
  const anaphorAuthority = clauseNumberRecall({
    question_text: "An organization is planning its impact assessment. What does that clause require it to " +
      "record, as stated by clause 6.1.4?" });
  ok("an anaphoric AUTHORITY reference does not fire", anaphorAuthority.pass === true,
    "fired: " + anaphorAuthority.hits.join(","));
  /* the construction added after reading, asserted in both directions like every other */
  const matchesFires = clauseNumberRecall({ question_text: "An auditor reviews an inherited ISMS " +
    "communication plan, and checks it against the determinations clause 7.4 sets out. Which set of " +
    "determinations matches that clause?" });
  ok("POSITIVE 3d1d332c (matches-clause) fires", matchesFires.pass === false,
    "did not fire: " + matchesFires.hits.join(","));
  const matchesSpared = clauseNumberRecall({ question_text: "A team reuses its ISMS operational-control " +
    "framework for AI operation. Which element does Clause 8.1 add that the reused framework would not " +
    "already deliver?" });
  ok("NEGATIVE 0b946efa (a scenario naming its own topic) still does not fire", matchesSpared.pass === true,
    "fired: " + matchesSpared.hits.join(","));
  return out;
}
