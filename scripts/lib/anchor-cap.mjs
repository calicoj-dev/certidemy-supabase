/**
 * anchor-cap.mjs -- at most CAP secure items per (source, edition, clause) per TASK.
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

/* ============ AND A CERTIFICATION-WIDE SATURATION CAP (ruled PROMPT-132 s2) ============
 *
 * CAP is per task. SATURATION_CAP is per certification, and it exists because the per-task cap cannot
 * see that a passage is used up.
 *
 * MEASURED ON R6: 16 of 53 survivors repeated a point already live -- 30%, up from 18% in R5 -- and
 * 13 of the 18 judge flags were SAME-ANCHOR pairs against live items. The writer was shown the keys
 * already written on that anchor by the ALREADY TESTED block and wrote the point again anyway. That is
 * not the writer ignoring the block: a passage that already carries three distinct keys has very few
 * distinct points left, so every remaining reading is near one that is taken.
 *
 * So the fix is upstream of the writer: an anchor carrying SATURATION_CAP or more live grounded items
 * ACROSS THE WHOLE CERTIFICATION is not assignable for a new key. It still supports distractors -- a
 * distractor's reason may cite any passage, and nothing about saturation makes the text less true.
 *
 * A task left with no assignable anchor is a FLOOR QUESTION, not a generation question, and is
 * reported by name rather than worked around. */
export const SATURATION_CAP = 3;

/* ============ A PER-(TASK, ANCHOR) CAP OVERRIDE (ruled PROMPT-135 s1) ============
 *
 * CAP is 2 because a form carrying four items on one sentence teaches the sentence. Task 3.5 is the
 * case where that bound, not the source, is the whole constraint: it maps ONE key-anchorable passage,
 * ISO 19011 A.17, which is a long clause with many distinct lettered points -- and 2 items against a
 * floor of 4 made the task unfillable.
 *
 * So the cap can be RAISED for a NAMED (task, anchor) pair, recorded in the floors file with its
 * ruling. Nothing else moves:
 *
 *   - the SATURATION cap still applies certification-wide and is unaffected;
 *   - the override is keyed on BOTH the task and the anchor, so it cannot leak to another task that
 *     maps the same passage, nor to another passage of the same task;
 *   - an override with no `ruled_in` is an error, the same discipline the floors file already uses.
 *
 * `capOf` is the ONE resolver. Every consumer takes it rather than a scalar, so the cap the writer is
 * assigned under and the cap the gate enforces cannot differ. */
export function makeCapResolver(taskCode, overrides, base = CAP) {
  const table = new Map();
  for (const [task, entries] of Object.entries(overrides || {})) {
    if (task.startsWith("_")) continue;
    for (const [anchor, v] of Object.entries(entries || {})) {
      if (anchor.startsWith("_")) continue;
      const cap = typeof v === "number" ? v : (v && v.cap);
      const ruled = typeof v === "number" ? null : (v && v.ruled_in);
      if (!Number.isFinite(cap) || cap < 1) {
        throw new Error("anchor-cap override " + task + "/" + anchor + " has no usable cap");
      }
      if (!ruled) {
        throw new Error("anchor-cap override " + task + "/" + anchor +
          " has no `ruled_in`. An override nobody ruled is an error, not a default.");
      }
      table.set(task + "||" + anchor, cap);
    }
  }
  return (p) => {
    if (!p) return base;
    const k = String(taskCode) + "||" + passageKey(p.source_id, p.edition, p.clause);
    return table.has(k) ? table.get(k) : base;
  };
}
/** the flat resolver, for every caller that has no overrides to apply */
export const flatCap = (cap = CAP) => () => cap;

/* The cap key IS the passage key: (source, edition, clause). It was (source, clause), which shares a
 * cap between two editions of one standard -- the same shape as the 3.4 collision one level up. */
export { passageKey as anchorKey, parseKey } from "./passage-key.mjs";
import { passageKey, parseKey } from "./passage-key.mjs";

/**
 * Build the existing-anchor census for one task.
 * @param entries  [{source_id, edition, clause}] already counted against this task
 * @returns Map key -> count
 */
export function census(entries) {
  const m = new Map();
  for (const e of entries || []) {
    const k = passageKey(e.source_id, e.edition, e.clause);
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}

/** Clauses already AT or OVER the cap -- what the writer is told not to anchor in. */
export function atCap(censusMap, cap = CAP) {
  return [...censusMap.entries()].filter(([, n]) => n >= cap).map(([k]) => {
    const p = parseKey(k) || { source_id: "?", edition: "?", clause: "?" };
    return { source_id: p.source_id, edition: p.edition, clause: p.clause, count: censusMap.get(k) };
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
    const k = passageKey(s.source_id, s.edition, s.clause);
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
  const S = "ISO/IEC 42001", E = "2023";
  const cases = [];
  const add = (what, expect, fn) => cases.push([what, expect, fn]);

  add("an empty census puts nothing at the cap", 0, () => atCap(census([])).length);
  add("one existing anchor is not at the cap", 0,
    () => atCap(census([{ source_id: S, edition: E, clause: "C.3.6" }])).length);
  add("two existing anchors ARE at the cap", 1,
    () => atCap(census([{ source_id: S, edition: E, clause: "C.3.6" }, { source_id: S, edition: E, clause: "C.3.6" }])).length);

  /* THE RULED REGRESSION: four pilot survivors on C.3.6, empty census -> 2 pass, 2 rejected */
  const four = [1, 2, 3, 4].map((n) => ({ id: "s" + n, source_id: S, edition: E, clause: "C.3.6" }));
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
    () => applyCap(four, census([{ source_id: S, edition: E, clause: "C.3.6" }])).filter((r) => !r.over_cap).length);
  add("a full census leaves no room", 0,
    () => applyCap(four, census([{ source_id: S, edition: E, clause: "C.3.6" }, { source_id: S, edition: E, clause: "C.3.6" }]))
      .filter((r) => !r.over_cap).length);

  /* THE ADDRESS ALONE IS NOT A KEY -- different sources, same number, must not share a cap */
  add("the same address in two sources does not share a cap", 2,
    () => applyCap([
      { id: "a", source_id: "ISO/IEC 42001", edition: "2023", clause: "9.2.2" },
      { id: "b", source_id: "ISO/IEC 27001", edition: "2022", clause: "9.2.2" },
    ], census([])).filter((r) => !r.over_cap).length);

  /* NOR DO TWO EDITIONS OF ONE STANDARD -- the re-key's own case */
  add("the same address in two editions does not share a cap", 2,
    () => applyCap([
      { id: "a", source_id: "ISO/IEC 27000", edition: "2018", clause: "3.1" },
      { id: "b", source_id: "ISO/IEC 27000", edition: "2022", clause: "3.1" },
    ], census([])).filter((r) => !r.over_cap).length);
  add("a missing edition does not share a cap with a real one", 2,
    () => applyCap([
      { id: "a", source_id: S, clause: "3.4" },
      { id: "b", source_id: S, edition: E, clause: "3.4" },
    ], census([])).filter((r) => !r.over_cap).length);

  /* and DIFFERENT clauses never collide */
  add("four survivors on four clauses all pass", 4,
    () => applyCap(["A.6.2.2", "A.6.2.3", "A.6.2.4", "A.6.2.5"].map((c, i) =>
      ({ id: "x" + i, source_id: S, edition: E, clause: c })), census([])).filter((r) => !r.over_cap).length);
  add("the census does not mutate", 0, () => {
    const c = census([]);
    applyCap(four, c);
    return c.size;
  });

  /* ============ THE PER-(TASK, ANCHOR) OVERRIDE APPLIES TO ONE PAIR (PROMPT-135 s1) ============
   *
   * Both directions, because an override that leaked would raise the cap on a passage nobody ruled on
   * and the only symptom would be four items on one sentence. */
  {
    const OV = { "3.5": { "ISO 19011|2026|A.17": { cap: 4, ruled_in: "PROMPT-135 s1" } } };
    const A17 = { source_id: "ISO 19011", edition: "2026", clause: "A.17" };
    const other = { source_id: "ISO 19011", edition: "2026", clause: "3.10" };
    const at35 = makeCapResolver("3.5", OV);
    const at36 = makeCapResolver("3.6", OV);
    add("the override raises 3.5 on A.17", 4, () => at35(A17));
    add("...and NOT another passage of the same task", CAP, () => at35(other));
    add("...and NOT the same passage on another task", CAP, () => at36(A17));
    add("...and NOT a different EDITION of the same clause", CAP,
      () => at35({ source_id: "ISO 19011", edition: "2018", clause: "A.17" }));
    add("...and NOT the same clause number in another source", CAP,
      () => at35({ source_id: "ISO/IEC 27001", edition: "2022", clause: "A.17" }));
    add("a task with no entry gets the flat cap", CAP, () => makeCapResolver("9.9", OV)(A17));
    add("no overrides at all: the flat cap", CAP, () => makeCapResolver("3.5", {})(A17));
    add("a `_what` documentation key is not read as a task", CAP,
      () => makeCapResolver("_what", { _what: "prose" })(A17));
    /* AN OVERRIDE WITH NO RULING IS AN ERROR, NOT A DEFAULT -- the floors file's own discipline. */
    add("an override with no `ruled_in` THROWS", true, () => {
      try { makeCapResolver("3.5", { "3.5": { "ISO 19011|2026|A.17": { cap: 4 } } }); return false; }
      catch (e) { return /ruled_in/.test(e.message); }
    });
    add("an override with an unusable cap THROWS", true, () => {
      try { makeCapResolver("3.5", { "3.5": { "ISO 19011|2026|A.17": { ruled_in: "x" } } }); return false; }
      catch (e) { return /usable cap/.test(e.message); }
    });
    /* AND THE OVERRIDE DOES NOT TOUCH SATURATION: that cap is certification-wide and separate. */
    add("SATURATION_CAP is unchanged by any per-task override", 3, () => SATURATION_CAP);
  }

  const fails = [];
  for (const [what, expect, fn] of cases) {
    let got;
    try { got = fn(); } catch (e) { got = "threw: " + e.message; }
    if (got !== expect) fails.push(what + "   expected " + JSON.stringify(expect) + ", got " + JSON.stringify(got));
  }
  if (!quiet) console.log("anchor-cap controls: " + cases.length + " case(s), " + fails.length + " fail");
  return { examined: cases.length, fails };
}
