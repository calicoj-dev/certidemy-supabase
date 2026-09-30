/**
 * explanation-option-ref.mjs -- an explanation may not name an option by its letter or its position.
 *
 * Ruled PROMPT-95 s1b. The moment option order is balanced at insert or shuffled at delivery, "Option A
 * describes..." names a different option than it did when it was written. The explanation is our audit
 * record and, on the practice path, it is SERVED -- `submit-quiz-answer` returns it after grading -- so a
 * stale letter reference is both a wrong record and a wrong thing to show a learner.
 *
 * ============ THE PROPERTY IS A REFERENCE, NOT A LETTER ============
 *
 * Three shapes, and all three break under reordering:
 *
 *   BY LETTER     "Option A describes...", "what option A captures", "the opposite of option C"
 *   BY BARE MARK  "A)" / "(B)" / "C." used as a pointer to an option
 *   BY POSITION   "the second option restates...", "the first/third/fourth/last option"
 *
 * What is ALLOWED is naming an option by its CONTENT: "the option about supplier records", "the answer that
 * confines the scope to AI-only systems". That survives any order.
 *
 * ============ WHAT THIS DELIBERATELY DOES NOT MATCH ============
 *
 * A bare capital letter is not a reference. `Annex A`, `Table A.1`, `A.6.2.4`, `clause 9.2.1 a)` and
 * `10.2 b)3)` are addresses, and ISO prose is full of them -- a detector that fired on those would fire on
 * most of the corpus and be deleted by the first person it inconvenienced. So a letter counts only when the
 * word `option` or an ordinal-plus-`option` is attached to it, or when a lettered mark stands alone as a
 * pointer with no ISO address around it.
 */

/* `option A` / `options A and B` / `option (C)` -- the word makes the reference unambiguous.
 *
 * THE LETTER MUST BE A STANDALONE TOKEN, and my first version forgot it: `([A-D])` with no right-hand
 * boundary matched the `c` of "The option CONFINING the scope..." -- so the detector fired on the very
 * rewrite it exists to produce, naming an option by its content. Caught by its own negative control on the
 * first run. `(?![A-Za-z])` is the whole fix; `(?!\.\d)` keeps `option A.1`-shaped addresses out while
 * still allowing "option A." at the end of a sentence. */
const BY_LETTER = /\boptions?\s*\(?\s*([A-D])(?![A-Za-z])(?!\.\d)\s*\)?/i;

/* "the second option", "the last option", "the first of the options" */
const BY_POSITION =
  /\b(?:the\s+)?(first|second|third|fourth|last)\b[^.;:]{0,24}\boptions?\b/i;
/* and the mirror order: "option two", "the option in third place" */
const BY_POSITION_2 = /\boptions?\b[^.;:]{0,24}\b(first|second|third|fourth|last)\b/i;

/* A BARE LETTERED MARK used as a pointer: "A) restates", "(B) is wrong because".
 * Required to sit at a clause boundary, so `9.2.1 a)` and `10.2 b)3)` cannot match: those are preceded by a
 * digit or a dot. Upper case only -- ISO's own sub-item letters are lower case. */
const BARE_MARK = /(?:^|[.;:!?]\s+|\n\s*)\(?([A-D])\)\s*(?=[a-z"'“])/;

export const RULES = [
  { id: "by-letter", re: BY_LETTER, why: 'names an option by its letter ("option A")' },
  { id: "by-position", re: BY_POSITION, why: 'names an option by its position ("the second option")' },
  { id: "by-position-2", re: BY_POSITION_2, why: 'names an option by its position, reversed order' },
  { id: "bare-mark", re: BARE_MARK, why: 'uses a bare lettered mark as a pointer ("A) restates...")' },
];

/**
 * @returns {{ pass:boolean, examined:boolean, reason:string|null, hits:Array<{rule,match}> }}
 *   `examined:false` only when there is no explanation at all -- never folded into a pass.
 */
export function explanationOptionRef(item) {
  const ex = String((item && item.explanation) || "").trim();
  if (!ex) return { pass: false, examined: false, reason: "no explanation to examine", hits: [] };
  const hits = [];
  for (const r of RULES) {
    const m = r.re.exec(ex);
    if (m) hits.push({ rule: r.id, match: m[0].trim(), why: r.why });
  }
  if (!hits.length) return { pass: true, examined: true, reason: null, hits: [] };
  return {
    pass: false, examined: true, hits,
    reason: "the explanation " + hits.map((h) => h.why).join("; and ") +
      ", which names a different option the moment order changes",
  };
}

/* ---------------------------------------------------------------- controls
 * The four positives are the director's, quoted from the live items rather than paraphrased. */
export function explanationOptionRefControls() {
  const out = [];
  const ok = (what, cond, detail) => out.push({ what, pass: !!cond, detail: cond ? null : detail });
  const fires = (s) => explanationOptionRef({ explanation: s });

  /* POSITIVES -- the four the ruling names */
  ok("fdb0fda4: 'Option A describes...' fires",
    fires("Option A describes the reference set of controls.").pass === false);
  ok("997dd746: 'what option A captures' fires",
    fires("That is what option A captures, and the others do not.").pass === false);
  ok("b25f378f: 'the second option restates...' fires",
    fires("The second option restates the same obligation in weaker terms.").pass === false);
  ok("a5eb5694: 'the opposite of option C' fires",
    fires("This is the opposite of option C, which defers the assessment.").pass === false);

  /* NEGATIVE -- naming an option by its CONTENT is what the rewrite produces */
  const byContent = fires("The option confining the scope to AI-only systems is wrong because the " +
    "management system covers the organization's processes as a whole.");
  ok("naming an option by its CONTENT does not fire", byContent.pass === true,
    byContent.hits.map((h) => h.rule + ":" + h.match).join(", "));

  /* ISO ADDRESSES MUST NOT FIRE. A detector that flagged these would fire on most of the corpus. */
  for (const s of [
    "Clause 9.2.1 a) requires the audit programme to state the methods.",
    "Annex A control A.6.2.4 covers the life cycle, and Table A.1 lists it.",
    "Clause 10.2 b)3) makes determining whether similar nonconformities exist a requirement.",
    "The requirement sits at 6.1.3 f) and Annex B.10.4 expands on it.",
    "ISO/IEC 42001 Annex A is a reference set; Annex B gives implementation guidance.",
  ]) {
    const v = fires(s);
    ok("an ISO address does not fire: " + s.slice(0, 44) + "...", v.pass === true,
      v.hits.map((h) => h.rule + ":" + h.match).join(", "));
  }

  /* an absent explanation is UNEXAMINED, never a pass */
  const empty = fires("   ");
  ok("an empty explanation is UNEXAMINED, not a pass", empty.examined === false && empty.pass === false,
    "examined=" + empty.examined + " pass=" + empty.pass);

  /* every declared rule must be able to match its own example, or a rule is dead weight */
  for (const r of RULES) {
    const ex = r.id === "by-letter" ? "Option B is wrong."
      : r.id === "by-position" ? "The third option is wrong."
        : r.id === "by-position-2" ? "The option listed second is wrong."
          : "A) restates the clause.";
    ok("RULE " + r.id + " matches its own example", r.re.test(ex), "did not match: " + ex);
  }
  return out;
}
