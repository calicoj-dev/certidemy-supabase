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

/* ============ "a" IS THE ONE OPTION LETTER THAT IS ALSO AN ENGLISH WORD ============
 *
 * Measured over the whole bank: of nine `by-letter` hits, THREE were the article --
 * "making that option a false premise", "option a genuine but incorrect distractor", "option a false
 * attribution". The boundary fix that stopped `option CONFINING` cannot help, because "a" really is a
 * standalone token there.
 *
 * Lowercase `a` is a reference only at a CLAUSE BOUNDARY -- "option a." or "option a," -- where no noun
 * phrase can follow it. An uppercase `A` is a reference anywhere, because the article is not capitalised
 * mid-sentence.
 *
 * This lives in code rather than in the pattern because the pattern needs the `i` flag to match "Option"
 * as well as "option", and `i` makes `A` and `a` indistinguishable inside it. My first attempt built the
 * case distinction into the regex and dropped the flag, which stopped "Option B is wrong" matching at all --
 * caught by the rule's own must-match control. */
function isArticleNotLetter(whole, match, index) {
  const letter = /options?\s*\(?\s*([A-Da-d])/i.exec(match);
  if (!letter || letter[1] !== "a") return false;    /* only lowercase "a" is ambiguous */
  /* WHAT FOLLOWS THE MATCH, IN THE ORIGINAL STRING. My first version inspected the match alone, which by
   * construction contains nothing after the letter -- so "option a false premise" looked like a
   * clause-final "option a" and was counted as a reference. The text after the match is the whole test. */
  const after = whole.slice(index + match.length);
  return !/^\s*[.,;:)]|^\s*$/.test(after);           /* more words follow -> it is the article */
}

/* ============ A POSITION WORD INSIDE A HYPHENATED COMPOUND IS NOT A POSITION ============
 *
 * Measured over the whole bank, both position rules fired on compounds: `delay-model-first options`,
 * `The second-best option`, `third-party`. None names an option's place. The ordinal must therefore stand
 * alone -- no word character or hyphen on either side. */
const ORD = "(?<![\\w-])(first|second|third|fourth|last)(?![\\w-])";

/* "the second option", "the last option", "the first of the options" */
const BY_POSITION = new RegExp("\\b(?:the\\s+)?" + ORD + "[^.;:]{0,24}\\boptions?\\b", "i");

/* ============ THE MIRROR ORDER NEEDS THE ORDINAL AT A CLAUSE BOUNDARY ============
 *
 * "option, which is the second" names an option. "option supporting the second AUDITOR" and
 * "option relocating THIRD-party" do not -- and a 24-character proximity window cannot tell them apart,
 * which is why this rule produced 29 hits of which most were noun phrases that merely sat near the word
 * "option".
 *
 * An ordinal that ENDS its clause has nothing left to modify but the option itself. That is the
 * discriminator, and it is structural rather than a longer word list. */
const BY_POSITION_2 = new RegExp(
  "\\boptions?\\b[^.;:]{0,24}\\b" + ORD + "(?=\\s*[.,;:)]|\\s*$)", "i");

/* A BARE LETTERED MARK used as a pointer: "A) restates", "(B) is wrong because".
 * Required to sit at a clause boundary, so `9.2.1 a)` and `10.2 b)3)` cannot match: those are preceded by a
 * digit or a dot. Upper case only -- ISO's own sub-item letters are lower case. */
const BARE_MARK = /(?:^|[.;:!?]\s+|\n\s*)\(?([A-D])\)\s*(?=[a-z"'“])/;

/* ============ THE RULES WERE ENGLISH-ONLY, AND THE BANK IS NOT ============
 *
 * Measured: the English rules found 27 rows, ALL of them `en`. A crude probe for the Spanish and Portuguese
 * equivalents found SEVENTEEN MORE -- 5 `opcion/opción <LETTER>` and 12 `opcao/opção <LETTER>` -- which the
 * English rules cannot see by construction. Practice explanations are served in all three languages, so a
 * count of 27 was under-reporting the served surface by nearly 40 percent.
 *
 * This is the vocabulary-pattern defect CLAUDE.md records three times: a check that exists per language and
 * is only ever run in one. Accents are matched both ways, because our corpus carries `opcion` and `opción`.
 *
 * STILL NOT COVERED, and stated rather than left as a silence: the POSITION forms in Spanish and Portuguese
 * ("la segunda opcion", "a segunda opcao"). The letter forms were measurable and are now caught; the position
 * forms need their own measurement before a pattern is written for them, and a guess would be the
 * lexical-proxy error this file already carries twice. */
const BY_LETTER_ES = /\bopci[oó]n(?:es)?\s*\(?\s*([A-D])(?![A-Za-z])(?!\.\d)\s*\)?/i;
const BY_LETTER_PT = /\bop[cç][aã]o(?:es|ões)?\s*\(?\s*([A-D])(?![A-Za-z])(?!\.\d)\s*\)?/i;

export const RULES = [
  { id: "by-letter", re: BY_LETTER, why: 'names an option by its letter ("option A")' },
  { id: "by-letter-es", re: BY_LETTER_ES, why: 'names an option by its letter in Spanish ("opcion A")' },
  { id: "by-letter-pt", re: BY_LETTER_PT, why: 'names an option by its letter in Portuguese ("opcao A")' },
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
    /* EVERY occurrence, not just the first: an explanation may carry the article "a" before a real
     * reference, and testing only the first match would let the real one hide behind the excluded one. */
    const re = new RegExp(r.re.source, r.re.flags.includes("g") ? r.re.flags : r.re.flags + "g");
    let m;
    while ((m = re.exec(ex)) !== null) {
      if (m[0].length === 0) break;
      if (r.id.startsWith("by-letter") && isArticleNotLetter(ex, m[0], m.index)) continue;
      hits.push({ rule: r.id, match: m[0].trim(), why: r.why });
      break;                                      /* one hit per rule is enough to report the item */
    }
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
      : r.id === "by-letter-es" ? "La opcion B es incorrecta."
        : r.id === "by-letter-pt" ? "A opcao B esta incorreta."
          : r.id === "by-position" ? "The third option is wrong."
        /* CHANGED, and saying so rather than quietly: this was "The option listed second is wrong.", which
         * the narrowed rule no longer matches by design -- the ordinal must END its clause, because a
         * 24-character window could not tell "the second option" from "the second AUDITOR". The example is
         * now a real shape from the corpus. */
        : r.id === "by-position-2" ? "the option, which is the second."
          : "A) restates the clause.";
    ok("RULE " + r.id + " matches its own example", r.re.test(ex), "did not match: " + ex);
  }
  return out;
}
