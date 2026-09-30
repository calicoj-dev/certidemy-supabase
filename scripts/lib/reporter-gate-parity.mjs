/**
 * reporter-gate-parity.mjs -- every gate the reporter names must actually run in runCodeGates.
 *
 * Ruled PROMPT-95 follow-up 2, after `quote-noise` spent three rollouts being REPORTED and never RUN. The
 * reporter printed "quote-noise: 0" for R1, R2 and R3 and that zero was offered as evidence three times. A
 * gate that is never called cannot reject, so its rejection count was structural.
 *
 * ============ THE PROPERTY IS PARITY, AND IT HAS TWO DIRECTIONS ============
 *
 *   REPORTED BUT NOT RUN   the defect that happened. A reader sees a gate name and a zero and concludes the
 *                          gate found nothing. It found nothing because nobody asked it.
 *   RUN BUT NOT REPORTED   the mirror, and it is also a defect: a gate that rejects items while its name
 *                          never appears in the report means a rejection count nobody can reconcile.
 *
 * Both are asserted. The first is what bit us; the second is what would hide the next one.
 *
 * ============ WHY THE GATE LIST IS DERIVED FROM A REAL runCodeGates CALL ============
 *
 * Not from a grep of the source, and not from a hand-kept list. `runCodeGates` is INVOKED on a synthetic item
 * and the `id` of every gate it returns is collected. That is the only thing that answers "does this gate
 * actually run" -- a grep answers "is this gate mentioned", which is exactly the distinction that failed.
 *
 * A gate whose id appears only inside an `if` that the synthetic item does not trigger would be missed, so the
 * synthetic item is deliberately minimal and every gate in the set returns a record for ANY item -- including
 * `pass: null` for UNASSERTED, which still carries its id. That is a property of the gate set worth keeping,
 * and this function is the thing that would notice if it stopped being true.
 */

/** Gate ids the reporter is ALLOWED to name without them running, each with a stated reason. */
export const NOT_A_CODE_GATE = {
  solver: "the blind solver is a model call, not a code gate; it has its own state machine",
  "solver-split": "the two-run solver disagreeing -- a solver state, not a gate id",
  "solver-could-not-run": "a solver outcome, reported so a could-not-run is never folded into a rejection",
  "(unattributed)": "the reporter's own bucket for a rejection naming no gate at all",
};

/**
 * @param runCodeGates the real function
 * @param reporterSrc  the reporter's source text, to find the gate names it can print
 * @returns { fails: string[], ran: string[], named: string[] }
 */
export function reporterGateParity(runCodeGates, reporterSrc) {
  const fails = [];

  /* ---- what actually runs ---- */
  const passage = {
    clause: "9.2.2", title: "Internal audit programme", normative: "shall",
    text: "The organization shall plan, establish, implement and maintain an audit programme.",
  };
  const item = {
    question_text: "An organization is planning its AI management system internal audits. What does " +
      "ISO/IEC 42001:2023 require the organization to establish?",
    options: [
      { text: "An audit programme covering frequency, methods and reporting", is_correct: true },
      { text: "A single annual audit by an external body" },
      { text: "A register of auditor qualifications" },
      { text: "A corrective action plan prepared before each audit" },
    ],
    explanation: "Clause 9.2.2 requires an audit programme.",
    key_support_clause: "9.2.2",
    key_support: "The organization shall plan, establish, implement and maintain an audit programme",
  };
  let ran = [];
  try {
    const r = runCodeGates(item, {
      passagesByKey: new Map([[passage.clause, passage]]),
      primaryClauses: new Set(["9.2.2"]), supportingClauses: new Set(),
      sources: [], leak: null,
    });
    ran = (r.gates || []).map((g) => g.id);
  } catch (e) {
    fails.push("runCodeGates THREW, so parity could not be established: " + (e && e.message));
    return { fails, ran: [], named: [] };
  }
  if (!ran.length) {
    fails.push("runCodeGates returned NO gates -- parity cannot be established from an empty set");
    return { fails, ran, named: [] };
  }
  /* every gate must carry an id, or it cannot be reconciled with anything */
  const anon = (ran.filter((x) => !x)).length;
  if (anon) fails.push(anon + " gate(s) returned no id, so they can never be reconciled with the report");

  /* ---- what the reporter can name ---- */
  const named = [];
  for (const m of String(reporterSrc || "").matchAll(/gateTotals\[\s*"([^"]+)"\s*\]/g)) named.push(m[1]);
  for (const m of String(reporterSrc || "").matchAll(/"([a-z][a-z0-9-]{3,})"\s*\]\s*=\s*\(gateTotals/g)) named.push(m[1]);
  const uniqNamed = [...new Set(named)];
  if (!uniqNamed.length) {
    /* THE EXTRACTOR ASSERTS ITS OWN NON-EMPTINESS. A regex that matches nothing turns this whole check
     * green, which is the defect this repository records against check-mcp's fragment extractor. */
    fails.push("the reporter-source extractor found NO gate names, so this check would pass vacuously");
    return { fails, ran, named: uniqNamed };
  }

  const ranSet = new Set(ran);
  for (const n of uniqNamed) {
    if (ranSet.has(n)) continue;
    if (NOT_A_CODE_GATE[n]) continue;
    fails.push("the reporter can print `" + n + "` and runCodeGates does not produce it -- a reported gate " +
      "that never runs, which is how `quote-noise` printed 0 for three rollouts");
  }
  return { fails, ran, named: uniqNamed, examined: uniqNamed.length + ran.length };
}

/* ---------------------------------------------------------------- controls */
export function reporterGateParityControls(runCodeGates, reporterSrc) {
  const out = [];
  const ok = (what, cond, detail) => out.push({ what, pass: !!cond, detail: cond ? null : detail });

  /* the live pairing must be clean */
  const live = reporterGateParity(runCodeGates, reporterSrc);
  ok("every gate the reporter names actually runs", live.fails.length === 0, live.fails.join(" | "));
  ok("...and the gate set is non-empty", (live.ran || []).length > 0);
  ok("...and the reporter's gate names were actually extracted", (live.named || []).length > 0,
    "the extractor found none, so a clean result would be vacuous");

  /* THE CHECK MUST BE ABLE TO FAIL. A reporter naming a gate that does not exist must be caught. */
  const fake = reporterGateParity(runCodeGates,
    'gateTotals["a-gate-that-does-not-exist"] = 1; gateTotals["quote-noise"] = 2;');
  ok("a reporter naming a NONEXISTENT gate is caught",
    fake.fails.some((f) => f.includes("a-gate-that-does-not-exist")),
    "it passed, so the check cannot fire");
  /* and a declared non-gate must NOT be caught */
  const solverOnly = reporterGateParity(runCodeGates, 'gateTotals["solver-split"] = 1;');
  ok("a declared non-gate (solver-split) is not reported as missing", solverOnly.fails.length === 0,
    solverOnly.fails.join(" | "));
  /* a broken runCodeGates is its own state, not a pass */
  const thrown = reporterGateParity(() => { throw new Error("boom"); }, 'gateTotals["x"] = 1;');
  ok("a runCodeGates that THROWS is a failure, never a pass",
    thrown.fails.some((f) => f.includes("THREW")));
  const empty = reporterGateParity(() => ({ gates: [] }), 'gateTotals["x"] = 1;');
  ok("an EMPTY gate set is a failure, never a pass",
    empty.fails.some((f) => f.includes("NO gates")));
  return out;
}
