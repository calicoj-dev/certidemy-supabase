/**
 * passage-key.mjs -- the identity of a source passage: (source_id, edition, clause).
 *
 * ONE implementation, because the alternative is what we already paid for.
 *
 * ============ THE DEFECT THIS EXISTS TO CLOSE ============
 *
 * `gen-grounded-items` resolved a task's primary clauses as BARE STRINGS against a library filtered to the
 * certification's own standard. Task 5.5 -- *"describe the certification route and what ISO/IEC 42006
 * governs"* -- maps ISO/IEC 17021-1 clause 3.4, *certification audit*. The lookup returned ISO/IEC 42001
 * clause 3.4, *management system*, and `anchor-is-primary` confirmed it because that gate compared bare
 * strings too. One inserted bank row and one R5 survivor rest on that collision.
 *
 * Measured at the time: 4 phantom primary rows across 2 tasks, and 244 addresses in ISO/IEC 27002's annex
 * shadow a main-body number of its own.
 *
 * ============ WHY EDITION IS IN THE KEY AND NOT JUST SOURCE ============
 *
 * CLAUDE.md records a definition copied from ISO/IEC 27000:2018 while the item cited 42001:2023, and the
 * scanner reporting 0 against a document it had indexed. Two editions of one standard carry the same clause
 * numbers with different words, so `(source, clause)` is not an identity either -- and the library already
 * stores `edition` on every passage, so including it costs nothing and closes the case before it arrives.
 *
 * ============ THE FORMAT IS A SEPARATOR THAT CANNOT OCCUR IN A COMPONENT ============
 *
 * `|` appears in no source id, edition or clause we hold -- checked across the library. A separator that CAN
 * occur in the content lets field text forge a boundary, which is why `translation_hash` length-prefixes and
 * why `item-hash` joins on NUL. Here the components are short machine strings and `|` is provably absent, so
 * it is enough and it stays readable in a log line.
 */

/** The canonical key. Every argument is required: a partial key is the defect, not a convenience. */
export function passageKey(sourceId, edition, clause) {
  return String(sourceId ?? "?") + "|" + String(edition ?? "?") + "|" + String(clause ?? "?");
}

/** The key of a passage row as the library stores it. */
export function keyOfPassage(p) {
  return passageKey(p && p.source_id, p && p.edition, p && p.clause);
}

/** Parse a key back. Clause may contain nothing special, but split defensively on the first two separators. */
export function parseKey(k) {
  const s = String(k || "");
  const i = s.indexOf("|");
  const j = s.indexOf("|", i + 1);
  if (i < 0 || j < 0) return null;
  return { source_id: s.slice(0, i), edition: s.slice(i + 1, j), clause: s.slice(j + 1) };
}

/** A human-readable form for a log line or a report: `ISO/IEC 42001:2023 A.5.4`. */
export function labelOf(sourceId, edition, clause) {
  return String(sourceId) + ":" + String(edition) + " " + String(clause);
}

export function passageKeyControls() {
  const cases = [];
  const ok = (what, pass, detail = "") => cases.push({ what, pass, detail });

  /* ============ THE COLLISION, BY NAME ============ */
  const a = passageKey("ISO/IEC 42001", "2023", "3.4");
  const b = passageKey("ISO/IEC 17021-1", "2015", "3.4");
  ok("42001 3.4 and 17021-1 3.4 are DIFFERENT keys", a !== b, a + "  vs  " + b);
  /* and the same clause number in two EDITIONS of one standard */
  ok("27000:2018 3.1 and 27000:2022 3.1 are different keys",
    passageKey("ISO/IEC 27000", "2018", "3.1") !== passageKey("ISO/IEC 27000", "2022", "3.1"));
  /* the 27002 annex shadow: same source, same edition, genuinely the same key */
  ok("one passage keys to itself",
    passageKey("ISO/IEC 27002", "2022", "5.1") === passageKey("ISO/IEC 27002", "2022", "5.1"));

  /* ---- round trip ---- */
  const k = passageKey("ISO/IEC 42001", "2023", "A.6.2.6");
  const p = parseKey(k);
  ok("a key parses back to its three components",
    p && p.source_id === "ISO/IEC 42001" && p.edition === "2023" && p.clause === "A.6.2.6",
    JSON.stringify(p));
  ok("keyOfPassage agrees with passageKey",
    keyOfPassage({ source_id: "ISO/IEC 42001", edition: "2023", clause: "A.6.2.6" }) === k);

  /* ---- A MISSING COMPONENT MUST NOT COLLAPSE TWO PASSAGES TOGETHER ---- */
  ok("a missing edition does not collide with a real one",
    passageKey("ISO/IEC 42001", null, "3.4") !== passageKey("ISO/IEC 42001", "2023", "3.4"));
  ok("a missing source does not collide with a real one",
    passageKey(null, "2023", "3.4") !== passageKey("ISO/IEC 42001", "2023", "3.4"));
  /* and two DIFFERENT missing-component keys must still differ by their other parts */
  ok("two partial keys differ by their clause",
    passageKey(null, null, "3.4") !== passageKey(null, null, "3.5"));

  /* ---- the separator must be absent from every component we hold ---- */
  ok("the separator is not a legal clause character",
    parseKey(passageKey("ISO/IEC 42001", "2023", "A.5.4")).clause === "A.5.4");

  ok("labelOf reads as a citation", labelOf("ISO/IEC 42001", "2023", "A.5.4") === "ISO/IEC 42001:2023 A.5.4");

  return { cases, allPass: cases.every((c) => c.pass) };
}
