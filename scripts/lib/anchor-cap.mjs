/**
 * anchor-cap.mjs -- at most CAP secure items per (source, clause) per TASK.
 *
 * Ruled PROMPT-86 section 3. One implementation, imported by the generator's writer prompt AND by its
 * gates, so the clauses the writer is told to avoid are exactly the clauses the gate will refuse.
 *
 * ============ WHY THE CAP IS PER TASK AND PER CLAUSE ============
 *
 * Task 1.3's four pilot survivors all anchored in C.3.6 -- one 26-word sentence -- and in one of them all
 * three distractors cited that same sentence. A form carrying four such items teaches the sentence: a
 * candidate who knows it collects four marks and one who does not loses four to a single gap.
 *
 * The generator's existing ANCHOR CLUSTERS check is scoped to the same clause across DIFFERENT tasks, so
 * it reported `none` for exactly this. This cap is the within-task half it could not see.
 *
 * ============ THE COUNT INCLUDES EVERYTHING THAT WILL SIT ON THE FORM ============
 *
 * Kept items from the audit, items already inserted as pending_review, and the current run's survivors.
 * A cap that counted only the current run would let each run add two more to a clause that already has
 * four, which is the per-span-floor-cannot-see-a-sum defect one level up.
 *
 * ============ AND A REJECTION IS NEVER A REWRITE ============
 *
 * Ruled explicitly. An over-cap item is not a defective item -- it is a surplus one, and rewriting its
 * distractors would not change the fact that its key rests where two keys already rest. Rewriting would
 * also spend a model call to produce an item that still has to be refused.
 */

export const CAP = 2;

/** A stable key. The ADDRESS alone is not a key -- 42001 9.2.2 and 27001 9.2.2 are different clauses. */
export function anchorKey(sourceId, clause) {
  return String(sourceId || "?") + "|" + String(clause || "?");
}

/**
 * Build the existing-anchor census for one task.
 * @param entries  [{source_id, clause}] already counted against this task
 * @returns Map key -> count
 */
export function census(entries) {
  const m = new Map();
  for (const e of entries || []) {
    const k = anchorKey(e.source_id, e.clause);
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}

/** Clauses already AT or OVER the cap -- what the writer is told not to anchor in. */
export function atCap(censusMap, cap = CAP) {
  return [...censusMap.entries()].filter(([, n]) => n >= cap).map(([k]) => {
    const i = k.indexOf("|");
    return { source_id: k.slice(0, i), clause: k.slice(i + 1), count: censusMap.get(k) };
  });
}

/**
 * Apply the cap to a run's survivors IN ORDER, against a starting census.
 *
 * Order matters and is the caller's: the ruling keeps specific items, so the caller sorts the ones to keep
 * first. Returns a decision per survivor; the census is not mutated.
 */
export function applyCap(survivors, startingCensus, cap = CAP) {
  const running = new Map(startingCensus);
  return survivors.map((s) => {
    const k = anchorKey(s.source_id, s.clause);
    const before = running.get(k) || 0;
    if (before >= cap) {
      return { ...s, over_cap: true,
        reason: "anchor-cap: " + s.source_id + " " + s.clause + " already carries " + before +
          " secure item(s) for this task and the cap is " + cap };
    }
    running.set(k, before + 1);
    return { ...s, over_cap: false, reason: null };
  });
}

/** Controls, both directions. */
export function anchorCapControls({ quiet = false } = {}) {
  const S = "ISO/IEC 42001";
  const cases = [];
  const add = (what, expect, fn) => cases.push([what, expect, fn]);

  add("an empty census puts nothing at the cap", 0, () => atCap(census([])).length);
  add("one existing anchor is not at the cap", 0,
    () => atCap(census([{ source_id: S, clause: "C.3.6" }])).length);
  add("two existing anchors ARE at the cap", 1,
    () => atCap(census([{ source_id: S, clause: "C.3.6" }, { source_id: S, clause: "C.3.6" }])).length);

  /* THE RULED REGRESSION: four pilot survivors on C.3.6, empty census -> 2 pass, 2 rejected */
  const four = [1, 2, 3, 4].map((n) => ({ id: "s" + n, source_id: S, clause: "C.3.6" }));
  add("four survivors on one clause: 2 pass", 2,
    () => applyCap(four, census([])).filter((r) => !r.over_cap).length);
  add("four survivors on one clause: 2 rejected", 2,
    () => applyCap(four, census([])).filter((r) => r.over_cap).length);
  add("the two that pass are the FIRST two in the order given", "s1,s2",
    () => applyCap(four, census([])).filter((r) => !r.over_cap).map((r) => r.id).join(","));
  add("the rejection reason is named anchor-cap", true,
    () => /^anchor-cap: /.test(applyCap(four, census([])).find((r) => r.over_cap).reason));

  /* the census is INCLUDED, not ignored: one existing anchor leaves room for one only */
  add("an existing anchor reduces the room", 1,
    () => applyCap(four, census([{ source_id: S, clause: "C.3.6" }])).filter((r) => !r.over_cap).length);
  add("a full census leaves no room", 0,
    () => applyCap(four, census([{ source_id: S, clause: "C.3.6" }, { source_id: S, clause: "C.3.6" }]))
      .filter((r) => !r.over_cap).length);

  /* THE ADDRESS ALONE IS NOT A KEY -- different sources, same number, must not share a cap */
  add("the same address in two sources does not share a cap", 2,
    () => applyCap([
      { id: "a", source_id: "ISO/IEC 42001", clause: "9.2.2" },
      { id: "b", source_id: "ISO/IEC 27001", clause: "9.2.2" },
    ], census([])).filter((r) => !r.over_cap).length);

  /* and DIFFERENT clauses never collide */
  add("four survivors on four clauses all pass", 4,
    () => applyCap(["A.6.2.2", "A.6.2.3", "A.6.2.4", "A.6.2.5"].map((c, i) =>
      ({ id: "x" + i, source_id: S, clause: c })), census([])).filter((r) => !r.over_cap).length);
  add("the census does not mutate", 0, () => {
    const c = census([]);
    applyCap(four, c);
    return c.size;
  });

  const fails = [];
  for (const [what, expect, fn] of cases) {
    let got;
    try { got = fn(); } catch (e) { got = "threw: " + e.message; }
    if (got !== expect) fails.push(what + "   expected " + JSON.stringify(expect) + ", got " + JSON.stringify(got));
  }
  if (!quiet) console.log("anchor-cap controls: " + cases.length + " case(s), " + fails.length + " fail");
  return { examined: cases.length, fails };
}
