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
