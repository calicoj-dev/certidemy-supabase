/**
 * iso-segments.mjs - split a lesson body into the regions that are MEASURED for
 * reproduced ISO clause text, and the regions that are exempt.
 *
 * ONE COPY, TWO CONSUMERS: `scan-iso-leaks.mjs` (which writes verdicts) and
 * `measure-blockquote-exemption.mjs` (which reports what a change would do). If
 * those two disagreed by one character, the report would be about a different
 * corpus than the gate. CLAUDE.md: "Lift its behaviour rather than writing a
 * third parser."
 *
 * ============ WHY THERE IS ANYTHING TO SPLIT ============
 *
 * IP-POSITION section 6, amended 2026-09-17, permits clause text that is QUOTED
 * AND ATTRIBUTED. The scanner could not express that: it normalises the whole
 * `content_md` into one word stream, and `norm()` turns `>` into a space, so the
 * blockquote marker is destroyed before anything is measured.
 *
 * ============ CUT, DO NOT DELETE ============
 *
 * The exempt lines are not removed from the text. They CUT it into segments,
 * and each segment is measured on its own.
 *
 * Deleting them would make the line BEFORE and the line AFTER adjacent, and a
 * run could then be measured across a junction that does not exist in the
 * document. That is the manufactured-adjacency defect CLAUDE.md already records
 * twice -- the GROUP BY over a nullable key, and `count(*) filter` over a LEFT
 * JOIN -- where the query invents a neighbour relation the data does not have.
 *
 * It matters in BOTH directions. A deletion could fabricate a run that nobody
 * wrote, and it could also destroy a real one by splicing a non-matching word
 * into the middle of it.
 *
 * ============ THE FAITHFULNESS PROPERTY ============
 *
 * With nothing exempt, `segments()` must return the document UNCHANGED -- one
 * segment, byte for byte. That is a string identity, not a re-measurement, and
 * it is a stronger statement than comparing two numbers: if the text going in
 * is the text coming out, the measurement cannot have moved. `checkFaithful()`
 * asserts it on fixtures, and `scan-iso-leaks` asserts it on every row it
 * scans, which together cover "the code is right" and "the corpus has no shape
 * this code mishandles".
 *
 * ============ ATTRIBUTED, NOT MERELY SET OFF ============
 *
 * A bare blockquote is still a reproduction. The predicate is two-part, and the
 * second part is the one that can fail quietly.
 *
 * An ISO attribution is a DESIGNATION -- `ISO/IEC 27001:2022`, `9.2.2`,
 * `Annex A` -- and a designation is written identically in English, Spanish and
 * Portuguese. Only the word `clause` / `clausula` / `secao` translates, and
 * nothing here depends on it.
 *
 * THAT IS NOT A GENERAL RESULT AND MUST NOT BE READ AS ONE. The Scrum Guide
 * attribution is a TITLE, which does translate, and `guide-runs.mjs` records
 * what an English-only pattern cost there: 54 trilingual violations reported
 * that did not exist. This works for ISO because of what an ISO citation IS.
 */

/** Lowercase, strip punctuation, collapse whitespace. Identical to the scanner's. */
export const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/* A standard's designation, and a clause or annex address. Either is
 * attribution; both is common. `\d+\.\d+` is deliberately broad -- in this
 * corpus every match of it is a real clause address ("Clause 9.2.2 c):"), and
 * narrowing it to a closed list of clause numbers would silently stop
 * recognising a standard nobody has added yet. */
export const STANDARD_RE = /\bISO(?:\/IEC)?\s*\d{4,5}\b/i;
export const ADDRESS_RE =
  /(\b\d+\.\d+(\.\d+)?\b|\bannex(e)?\s+[a-z]\b|\banexo\s+[a-z]\b|\btabl[ae]\s+a\.\d|\btabela\s+a\.\d)/i;

/** Is this quoted line attributed, on the line itself or in its lead-in? */
export function isAttributed(line, leadIn) {
  const hay = String(line) + " ¶ " + String(leadIn || "");
  return STANDARD_RE.test(hay) || ADDRESS_RE.test(hay);
}

/** Is this line a blockquote? */
export const isQuoteLine = (line) => String(line).trim().startsWith(">");

/**
 * The default exemption: an ATTRIBUTED line, whatever its markdown form.
 *
 * ============ FORM IS EVIDENCE OF NOTHING ============
 *
 * This read `isQuoteLine(line) && isAttributed(line, leadIn)` -- keyed on
 * whether the author reached for `>`. It failed in BOTH directions at once:
 *
 *   UNDER-EXEMPTED  "ISO 19011:2026 clause 3.8 defines audit criteria as the
 *                   set of requirements used as a reference against which
 *                   objective evidence is compared" names the standard, the
 *                   clause and the term, and was scored as a leak. It is more
 *                   precisely attributed than most blockquotes.
 *
 *   OVER-EXEMPTED   a blockquote was exempt at ANY length. That is how 52
 *                   contiguous words of ISO 19011 came to sit in a released
 *                   certification with nobody having decided it.
 *
 * Rebuilt: a span is an attributed quotation when a citation sits within a
 * BOUNDED DISTANCE of it -- in the span, or in the prose introducing it. The
 * length limit then applies to attributed quotation AS A CLASS, which is what
 * makes a ceiling mean anything; before, it governed one syntax and exempted
 * the other entirely.
 *
 * ============ BUT THE EXEMPTION IS NOT A CUT, AND THAT WAS THE FIRST
 * ATTEMPT'S DEFECT ============
 *
 * Keying `segments()` itself on attribution cut the LEAD-IN LINE -- prose,
 * which merely contained a clause number -- out of the document. Two things
 * followed, and a fixture caught both immediately:
 *
 *   - every prose line carrying a citation stopped being measured at all;
 *   - cutting the lead-in broke the lead-in CHAIN, so the blockquote beneath
 *     it was then judged with no attribution and the 52-word span became a
 *     refusal. ISMS-IA went from 0 refusals to 72.
 *
 * A cut is a statement about DOCUMENT STRUCTURE. An exemption is a statement
 * about ONE SPAN. Collapsing them meant a span-level judgement deleted a line.
 *
 * So `segments` keeps cutting on FORM, which is what segmentation is for, and
 * the attribution test moved to where the occurrence lives -- see
 * `longestMeasured` in `scan-iso-leaks.mjs`.
 *
 * Pass `() => false` to measure the document as a whole, which is what the
 * faithfulness control does.
 */
export const attributedQuote = (line, leadIn) => isQuoteLine(line) && isAttributed(line, leadIn);

/**
 * Split `md` into measured segments, cutting at every exempt line.
 *
 * `isExempt(rawLine, lastNonQuoteLine)` decides. The lead-in passed is the most
 * recent non-blank, non-blockquote line, which is where an attribution usually
 * sits ("Clause 9.2.2 says:").
 */
export function segments(md, isExempt = attributedQuote) {
  /* SPLIT KEEPING THE SEPARATORS. `split(/\r?\n/)` followed by `join("\n")`
   * silently rewrites CRLF to LF, and the identity control caught it on its
   * very first run against the corpus: 232 rows came back as a single segment
   * that was not byte-identical to the input.
   *
   * It would not have changed one measurement -- `norm()` collapses all
   * whitespace before anything is compared -- and that is precisely why it is
   * worth fixing rather than excusing. A control relaxed to "identical after
   * normalising line endings" would also stop noticing a segmenter that ate a
   * line. Same family as CLAUDE.md's `\n`-encoded-against-a-CRLF-file note,
   * arriving through the opposite door. */
  const tokens = String(md || "").split(/(\r\n|\n)/);
  const out = [];
  let cur = [];
  let leadIn = "";
  for (let i = 0; i < tokens.length; i += 2) {
    const raw = tokens[i];
    const sep = tokens[i + 1] ?? "";
    if (raw === "" && sep === "" && i > 0) continue;        // trailing empty tail
    const t = raw.trim();
    if (isQuoteLine(raw) && isExempt(raw, leadIn)) {
      if (cur.length) { out.push(cur.join("")); cur = []; } // CUT
      continue;
    }
    if (t && !isQuoteLine(raw)) leadIn = t;
    cur.push(raw + sep);
  }
  if (cur.length) out.push(cur.join(""));
  return out;
}

/** Every blockquote line in `md`, with the lead-in it would be judged against. */
export function quoteLines(md) {
  const out = [];
  let leadIn = "";
  for (const raw of String(md || "").split(/\r?\n/)) {
    const t = raw.trim();
    if (isQuoteLine(raw)) { out.push({ line: raw, leadIn, attributed: isAttributed(raw, leadIn) }); continue; }
    if (t) leadIn = t;
  }
  return out;
}

/**
 * The ceiling on an attributed quotation, in words.
 *
 * An ISO requirement sentence, or a lettered sub-item, is the examinable unit
 * and is almost always under 25 words. Above that the clause is being
 * DELIVERED rather than taught.
 *
 * Ruled 2026-09-23. It lives here rather than in `mcp_leak_policy` for the
 * same reason the exemption does: it is the position, not a tunable, and it
 * moves when IP-POSITION s6 moves.
 *
 * AND AN EXEMPTION IS A CEILING, NOT A WAIVER. Every named lesson exemption
 * has carried a `maxRun` on that ground since it was written. The
 * attributed-quotation exemption was the only unbounded one in the system,
 * and it covered the longest spans in the corpus.
 */
export const QUOTATION_CEILING = 25;

/**
 * POSITIVE CONTROL. Fixtures, so this fires without a database.
 *
 * Returns a list of failures; empty means clean.
 */
export function checkFaithful() {
  const bad = [];
  const eq = (name, got, want) => {
    if (JSON.stringify(got) !== JSON.stringify(want)) {
      bad.push(name + ": got " + JSON.stringify(got) + ", want " + JSON.stringify(want));
    }
  };

  const doc = [
    "Clause 9.2.2 says:",
    "> the organization shall consider the importance of the processes",
    "",
    "That sentence is the whole of the requirement.",
    "The second note defines a virtual location:",
    "> where an organization performs work using an online environment",
    "Nothing further.",
  ].join("\n");

  /* 1. NOTHING EXEMPT MUST RETURN THE DOCUMENT UNCHANGED. The property the
   *    whole design rests on: if the text is identical, the measurement is. */
  eq("identity with nothing exempt", segments(doc, () => false), [doc]);

  /* 2. An attributed quote cuts; a bare one does not. The first quote's lead-in
   *    carries "9.2.2", the second's carries no address at all. */
  const segs = segments(doc);
  eq("attributed quote cuts, bare quote stays", segs, [
    "Clause 9.2.2 says:\n",
    [
      "",
      "That sentence is the whole of the requirement.",
      "The second note defines a virtual location:",
      "> where an organization performs work using an online environment",
      "Nothing further.",
    ].join("\n"),
  ]);

  /* 3. CUT, NOT DELETE -- the defect this file exists to avoid. The line before
   *    an exempt quote and the line after must NOT end up in one segment. */
  const glue = ["alpha beta gamma", "> ISO/IEC 27001:2022 quoted text here", "delta epsilon zeta"].join("\n");
  const g = segments(glue);
  eq("a cut separates the lines either side", g, ["alpha beta gamma\n", "delta epsilon zeta"]);
  if (g.some((s) => /gamma[\s\S]*delta/.test(s))) {
    bad.push("MANUFACTURED ADJACENCY: text either side of a cut ended up in one segment");
  }

  /* 4. Attribution on the quote line itself, with no lead-in at all. */
  eq("designation on the line counts as attribution",
    segments(["> Per ISO 19011:2026, evidence should be verifiable"].join("\n")), []);

  /* 5. A quote with neither designation nor address is NOT exempt, even though
   *    it is set off. Set off is typography; attributed is a claim. */
  eq("a bare quote is measured",
    segments("> the organization shall determine the boundaries and applicability"),
    ["> the organization shall determine the boundaries and applicability"]);

  /* 6. A lead-in is the last non-blank NON-QUOTE line, so a second quote in a
   *    run of quotes inherits the same attribution rather than seeing the
   *    previous quote as its lead-in. */
  const multi = ["Clause 10.2 lists five limbs:", "> a) react to the nonconformity", "> b) evaluate the need for action"].join("\n");
  eq("consecutive quotes share the lead-in", segments(multi), ["Clause 10.2 lists five limbs:\n"]);

  /* 7. CRLF SURVIVES. The identity property has to hold for the line endings
   *    the corpus actually uses, not only for the ones a fixture is typed in.
   *    232 rows failed the corpus-wide identity check before `segments` kept
   *    its separators, and every one of them was CRLF. */
  const crlf = "Clause 9.2.2 says:\r\n> quoted text\r\nand prose after.\r\n";
  eq("CRLF identity with nothing exempt", segments(crlf, () => false), [crlf]);

  return bad;
}
