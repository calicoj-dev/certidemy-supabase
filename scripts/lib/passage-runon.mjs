/**
 * passage-runon.mjs -- the ONE run-on detector, imported by the checker and the repair.
 *
 * It lived in the checker script, whose CLI then ran at import time and rejected the repair script's
 * flags. A detector is a library function; the script around it is the caller.
 *
 * Found PROMPT-115 s2: ISO/IEC 27000 3.77 (vulnerability, a 15-word definition) is 282 words because
 * it swallowed clause 4. The detector looks for a LATER top-level heading inside an earlier passage,
 * not for length: a definition may legitimately carry long notes.
 */
/* a top-level clause heading embedded in a body: "4 Information security management systems",
 * "5 Leadership", "Annex A", "Bibliography". Requires the number at a word boundary followed by a
 * capitalised word, so "(3.74) 4 Information" matches and "clause 4 of the" does not. */
const EMBEDDED_HEADING = /(?:^|[\s.;)])([4-9]|1[0-2])\s+([A-Z][a-z]+(?:\s+[a-z]+){0,4}\s+[a-z]+)/;
const ANNEX_OR_BIB = /(?:^|\s)(Annex\s+[A-H]\b|Bibliography\b|Introduction\b)/;

/** the first embedded later-clause heading in this passage's text, or null */
export function runOnIn(passage) {
  const clause = String(passage.clause || "");
  const text = String(passage.text || "");
  /* only a passage from an EARLIER clause can run on into a later one */
  const own = parseInt(clause, 10);
  if (!Number.isFinite(own)) return null;
  const m = EMBEDDED_HEADING.exec(text);
  if (m && parseInt(m[1], 10) > own) {
    return { kind: "clause heading", at: text.indexOf(m[0]), matched: (m[1] + " " + m[2]).slice(0, 60) };
  }
  const a = ANNEX_OR_BIB.exec(text);
  if (a && a.index > 80) return { kind: "annex/bibliography heading", at: a.index, matched: a[1] };
  return null;
}

export function runOnControls() {
  const cases = [];
  const ok = (w, p) => cases.push({ what: w, pass: p });
  /* SYNTHETIC FIXTURES. The first version pasted the real 27000 3.77 and 3.74 text in, and
   * `check-licensed-text` caught 17 reproduced runs in this file before it was committed. What the
   * control needs is the SHAPE -- a short definition, then a later top-level heading, then that
   * clause's opening prose -- and the shape carries over to invented words. */
  ok("the 3.77 run-on SHAPE is detected", !!runOnIn({ clause: "3.77",
    text: "widgetness quality of a widget (3.14) that may be acted upon by one or more agents (3.74) " +
      "4 Widget management systems 4.1 General Bodies of every size and kind: a) gather widgets" }));
  ok("a clean short definition is NOT flagged", !runOnIn({ clause: "3.74",
    text: "agent possible origin of an unwanted occurrence, which may lead to loss for a body (3.50)" }));
  ok("a prose reference to `clause 4` is NOT a heading", !runOnIn({ clause: "3.1",
    text: "term defined here and described further in clause 4 of this document for the reader" }));
  ok("a definition citing an EARLIER clause number is NOT flagged", !runOnIn({ clause: "9.1",
    text: "The organization shall evaluate performance, as described in 4 above and in the policy" }));
  ok("an Annex heading deep in a body IS flagged", !!runOnIn({ clause: "8.1",
    text: "x".repeat(100) + " Annex A Reference control objectives and controls" }));
  ok("a non-numeric clause is skipped rather than guessed at",
    runOnIn({ clause: "Recital 133", text: "anything 4 Information security management systems here" }) === null);
  return { examined: cases.length, fails: cases.filter((c) => !c.pass).map((c) => c.what) };
}

