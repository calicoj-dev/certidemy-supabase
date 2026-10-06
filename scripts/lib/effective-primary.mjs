/**
 * effective-primary.mjs -- how many of a task's PRIMARY passages can actually carry a key.
 *
 * ONE implementation, imported by the generator and by the map report. A second copy would diverge and the
 * divergence would show as a task the generator allocates items to and the report calls thin.
 *
 * ============ THE DEFINITION, RULED PROMPT-86 SECTION 2 ============
 *
 * An EFFECTIVE primary is a primary passage that
 *   1. is not a CONTAINER,
 *   2. has its own anchorable text, and
 *   3. is at least 15 words long.
 *
 * Containers count ZERO. Their children count if they are themselves primary.
 *
 * ============ AND A CONTAINER MUST BE DETECTED STRUCTURALLY, NOT BY LENGTH ============
 *
 * This is the part that would have been got wrong by a word count. Measured in the library:
 *
 *   A.6.1   67 words   text begins "A.6.1.2 Objectives for responsible developThe organization shall..."
 *   A.6.2  252 words   text begins "A.6.2.2 AI system requirements and specThe organization shall..."
 *
 * Both are LONG, so a 15-word floor passes them. Their text is their CHILDREN'S text run together, which is
 * why anchoring there is worse than useless: a quotation from A.6.2 can span several controls and the run
 * would be an adjacency the standard does not have -- the manufactured-adjacency defect this repository
 * already records against combined indexes and separator-free joins.
 *
 * So a container is identified by the LIBRARY HAVING CHILDREN for it: some other held clause of the same
 * source begins with this clause plus a dot. That is a fact about the document, not a guess about the text.
 */

/* tier-anchoring is imported, NOT injected: a caller able to pass its own rule is exactly how the two
 * definitions diverged (PROMPT-143 s1). */
import { tierOf, keyMayAnchor } from "./tier-anchoring.mjs";

/** Is this clause a container -- does the library hold clauses nested under it? */
export function isContainer(clause, clausesOfSameSource) {
  const c = String(clause || "");
  if (!c) return false;
  for (const other of clausesOfSameSource) {
    if (other !== c && String(other).startsWith(c + ".")) return true;
  }
  return false;
}

export const MIN_WORDS = 15;

/* ============ THE FLOOR ON PRIMARIES, NOT ON ITEMS ============
 *
 * A task with fewer than this many EFFECTIVE primaries is a MAP question, not work: every item would
 * come from one of that few sentences, even where the cap arithmetic allows the item floor (two
 * primaries at a cap of 2 is exactly 4). It lived as a local constant in check-task-map.mjs; moved here
 * because explain-thin-task.mjs needs the same number and a second copy is how the two drift.
 * Ruled PROMPT-118 s4. */
export const MIN_EFFECTIVE = 3;

export function wordCount(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Classify each primary clause. Returns one row per clause with its verdict and the reason, because a
 * bare count cannot say WHY a task is thin -- and "two of its six are containers" and "four of its six are
 * one-line titles" need different fixes.
 *
 * @param primaryClauses  clause strings marked primary for the task
 * @param passageOf       (clause) => passage row, or undefined
 * @param allClauses      every clause the library holds for the relevant source(s)
 */
export function classifyPrimaries(primaryClauses, passageOf, allClauses) {
  const out = [];
  for (const clause of primaryClauses) {
    const p = passageOf(clause);
    if (!p) {
      out.push({ clause, effective: false, words: 0, why: "not in the library" });
      continue;
    }
    const words = wordCount(p.text);
    if (isContainer(clause, allClauses)) {
      out.push({ clause, effective: false, words,
        why: "CONTAINER -- the library holds clauses nested under it and its text is its children's " +
          "text run together, so a quotation from it can span several controls" });
      continue;
    }
    if (!words) { out.push({ clause, effective: false, words, why: "no text to anchor in" }); continue; }
    if (words < MIN_WORDS) {
      out.push({ clause, effective: false, words,
        why: "under the " + MIN_WORDS + "-word floor -- too short to carry a key" });
      continue;
    }
    out.push({ clause, effective: true, words, why: "anchorable" });
  }
  return out;
}

/** The count the generator gates on. */
export function effectivePrimaryCount(primaryClauses, passageOf, allClauses) {
  return classifyPrimaries(primaryClauses, passageOf, allClauses).filter((r) => r.effective).length;
}

/**
 * Controls, both directions. A container test that silently stopped matching would make every thin map look
 * healthy, which is the direction nobody investigates.
 */
/**
 * ============ THE ONE DEFINITION OF "HOW MANY EFFECTIVE PRIMARIES" (ruled PROMPT-143 s1) ============
 *
 * Two instruments answered this question with two definitions, and both reported confidently.
 * `check-task-map` applied the 15-word floor AND the per-certification tier rule; `verify-cert` s8
 * applied the word floor alone. Measured PROMPT-142: AIMS-IA task 1.1 therefore had a floor of 6 in
 * one and 8 in the other, and the cutover turned that into a FAIL -- on a task holding exactly what
 * its map supports.
 *
 * A primary a key cannot anchor on is not effective. On the internal-auditor tier that excludes the
 * 27000 family outright and admits 19011 only on an audit-practice task, so a floor derived without
 * `keyMayAnchor` asks a task for items its passages cannot carry.
 *
 * @param primaries  the task's PRIMARY passages: [{source_id, edition, clause, text, normative}]
 * @param clauseIndexBySource  Map "<source_id>|<edition>" -> Map clause -> passage, the whole document,
 *                             so the container test can see a clause's children
 * @param cert       the certification code. REQUIRED: the tier rule is per-certification, and
 *                   `keyMayAnchor` refuses an IA certification it does not know rather than
 *                   defaulting (PROMPT-135 s2).
 * @returns {{effective, keyable, excluded_by_tier, exclusions}}
 */
export function effectiveCountOf({ primaries, clauseIndexBySource, cert }) {
  const mine = (primaries || []).filter((p) => p && p.source_id);
  if (!mine.length) return { effective: 0, keyable: 0, excluded_by_tier: 0, exclusions: [] };
  const tier = tierOf(cert);
  const exclusions = [];
  const keyable = mine.filter((p) => {
    const v = keyMayAnchor(p, { tier, primaryClauses: mine, cert });
    if (!v.ok) exclusions.push({ clause: p.clause, source_id: p.source_id, why: v.why || "" });
    return v.ok;
  });
  /* grouped by (source, edition): the container test is per document */
  const bySrc = new Map();
  for (const p of keyable) {
    const k = p.source_id + "|" + p.edition;
    if (!bySrc.has(k)) bySrc.set(k, []);
    bySrc.get(k).push(p);
  }
  let effective = 0;
  for (const [k, group] of bySrc) {
    const idx = (clauseIndexBySource && clauseIndexBySource.get(k)) || new Map();
    const all = [...idx.keys()];
    effective += classifyPrimaries(group.map((p) => String(p.clause)),
      (c) => idx.get(String(c)) || null, all).filter((r) => r.effective).length;
  }
  return { effective, keyable: keyable.length, excluded_by_tier: mine.length - keyable.length, exclusions };
}

export function effectivePrimaryControls({ quiet = false } = {}) {
  const lib = new Map([
    /* real shapes from the AIMS-F library, including the two containers that defeat a length test */
    ["A.6.1", { clause: "A.6.1", text: "A.6.1.2 Objectives for responsible developThe organization shall identify and document objectives " + "x ".repeat(30) }],
    ["A.6.1.2", { clause: "A.6.1.2", text: "The organization shall identify and document objectives for the responsible development of AI systems and take those objectives into account." }],
    ["A.6.1.3", { clause: "A.6.1.3", text: "The organization shall define and document the processes for the responsible design and development of the AI system." }],
    ["A.6.2", { clause: "A.6.2", text: "A.6.2.2 AI system requirements and specThe organization shall specify and document requirements " + "y ".repeat(120) }],
    ["A.6.2.2", { clause: "A.6.2.2", text: "AI system requirements and specification. The organization shall specify and document requirements for new AI systems or material enhancements to existing systems." }],
    ["C.3.6", { clause: "C.3.6", text: "Sources of risk can appear over the entire AI system life cycle (e.g. flaws in design, inadequate deployment, lack of maintenance, issues with decommissioning)." }],
    ["8.1", { clause: "8.1", text: "The organization shall plan, implement and control the processes needed to meet AI management system requirements." }],
    ["Z.1", { clause: "Z.1", text: "Equipment shall be sited securely." }],
    ["Z.2", { clause: "Z.2", text: "" }],
  ]);
  const all = [...lib.keys()];
  const passageOf = (c) => lib.get(c);
  const cls = (arr) => classifyPrimaries(arr, passageOf, all);
  const cases = [
    ["A.6.1 is a container despite being 67+ words", false, () => cls(["A.6.1"])[0].effective],
    ["A.6.2 is a container despite being 252+ words", false, () => cls(["A.6.2"])[0].effective],
    ["a container's reason names it a container", true,
      () => /CONTAINER/.test(cls(["A.6.2"])[0].why)],
    ["A.6.2.2 IS effective -- a container's child counts", true, () => cls(["A.6.2.2"])[0].effective],
    ["A.6.1.2 IS effective", true, () => cls(["A.6.1.2"])[0].effective],
    ["C.3.6 is effective", true, () => cls(["C.3.6"])[0].effective],
    ["8.1 is effective", true, () => cls(["8.1"])[0].effective],
    ["a 5-word control is NOT effective", false, () => cls(["Z.1"])[0].effective],
    ["an empty passage is NOT effective", false, () => cls(["Z.2"])[0].effective],
    ["an absent clause is NOT effective and says so", true,
      () => cls(["Q.9"])[0].why === "not in the library"],
    /* ---- the regression cases the ruling names ---- */
    ["1.3 BEFORE the ruling counts 4 effective", 4, () =>
      effectivePrimaryCount(["8.1", "A.6.1", "A.6.2", "B.6.1.1", "B.6.2.1", "C.3.6"],
        (c) => lib.get(c) || { clause: c, text: "w ".repeat(40) }, all)],
    ["1.3 AFTER the ruling counts 11 or more", true, () =>
      effectivePrimaryCount(["8.1", "A.6.1", "A.6.2", "B.6.1.1", "B.6.2.1", "C.3.6",
        "A.6.2.2", "A.6.2.3", "A.6.2.4", "A.6.2.5", "A.6.2.6", "A.6.2.7", "A.6.2.8"],
      (c) => lib.get(c) || { clause: c, text: "w ".repeat(40) }, all) >= 11],

    /* ============ effectiveCountOf: THE TIER RULE IS PART OF THE COUNT (PROMPT-143 s1) ============
     *
     * The AIMS-IA task 1.1 shape, which is what made the two instruments disagree: five primaries,
     * one under the word floor, and 42001 3.18 `informative` so no requirements key may rest on it.
     * A count without the tier rule says 4 and derives a floor of 8; with it the count is lower and
     * the floor is one the map can actually meet. */
    ...(() => {
      const long = "word ".repeat(40);
      /* `normative` holds the MODAL -- shall / should / informative / can -- not the word
       * "normative". A fixture saying "normative" excluded even the `shall` clause. */
      const P = (s, e, c, normative = "shall") => ({ source_id: s, edition: e, clause: c,
        text: long, normative });
      const idx = (rows) => {
        const m = new Map();
        for (const r of rows) {
          const k = r.source_id + "|" + r.edition;
          if (!m.has(k)) m.set(k, new Map());
          m.get(k).set(String(r.clause), r);
        }
        return m;
      };
      /* a 42001 `shall` clause and a 42001 definition, on the IA tier */
      const shall = P("ISO/IEC 42001", "2023", "9.2.1");
      const info = P("ISO/IEC 42001", "2023", "3.18", "informative");
      const both = [shall, info];
      /* the same two on a FOUNDATION certification, where keyMayAnchor admits everything */
      return [
        ["effectiveCountOf on AIMS-IA counts the `shall` clause and NOT the definition", 1,
          () => effectiveCountOf({ primaries: both, clauseIndexBySource: idx(both),
            cert: "AIMS-IA" }).effective],
        ["...and it says the definition was excluded BY THE TIER, not by length", 1,
          () => effectiveCountOf({ primaries: both, clauseIndexBySource: idx(both),
            cert: "AIMS-IA" }).excluded_by_tier],
        ["the same two primaries on AIMS-F count 2: Foundation admits guidance", 2,
          () => effectiveCountOf({ primaries: both, clauseIndexBySource: idx(both),
            cert: "AIMS-F" }).effective],
        ["...so NO Foundation task can lose a primary to the tier rule", 0,
          () => effectiveCountOf({ primaries: both, clauseIndexBySource: idx(both),
            cert: "AIMS-F" }).excluded_by_tier],
        ["a primary under the 15-word floor is not effective even when the tier admits it", 0,
          () => effectiveCountOf({
            primaries: [{ source_id: "ISO/IEC 42001", edition: "2023", clause: "3.9",
              text: "five words only here", normative: "shall" }],
            clauseIndexBySource: idx([{ source_id: "ISO/IEC 42001", edition: "2023", clause: "3.9",
              text: "five words only here" }]), cert: "AIMS-F" }).effective],
        ["a CONTAINER is not effective: its children are held", 1,
          () => {
            const parent = P("ISO/IEC 42001", "2023", "A.6");
            const child = P("ISO/IEC 42001", "2023", "A.6.1");
            return effectiveCountOf({ primaries: [parent, child],
              clauseIndexBySource: idx([parent, child]), cert: "AIMS-F" }).effective;
          }],
        ["no primaries at all counts 0 rather than throwing", 0,
          () => effectiveCountOf({ primaries: [], clauseIndexBySource: new Map(),
            cert: "AIMS-IA" }).effective],
        /* A SCRUM CODE IS THE `general` TIER, SO IT DOES NOT THROW -- measured PROMPT-143: tierOf
         * returns "general" for SM-AI-I and keyMayAnchor admits everything there. Only the
         * internal-auditor tier reaches requirementsStandardFor, which is where an unknown family
         * throws. So the control is that a general-tier certification loses NOTHING to the tier. */
        ["a general-tier certification (SM-AI-I) excludes nothing by tier", 0,
          () => effectiveCountOf({ primaries: both, clauseIndexBySource: idx(both),
            cert: "SM-AI-I" }).excluded_by_tier],
        ["...and counts both primaries", 2,
          () => effectiveCountOf({ primaries: both, clauseIndexBySource: idx(both),
            cert: "SM-AI-I" }).effective],
      ];
    })(),
  ];
  const fails = [];
  for (const [what, expect, fn] of cases) {
    let got;
    try { got = fn(); } catch (e) { got = "threw: " + e.message; }
    if (got !== expect) fails.push(what + "   expected " + expect + ", got " + got);
  }
  if (!quiet) console.log("effective-primary controls: " + cases.length + " case(s), " + fails.length + " fail");
  return { examined: cases.length, fails };
}
