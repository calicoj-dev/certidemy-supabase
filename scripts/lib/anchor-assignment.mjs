/**
 * anchor-assignment.mjs -- give every requested item its OWN anchor clause, before the writer is called.
 *
 * Ruled PROMPT-96 s2. ONE implementation, imported by the writer prompt AND by the gate that enforces it, so
 * the clause the writer is told to use is exactly the clause the gate will check for.
 *
 * ============ THE DEFECT THIS EXISTS FOR, MEASURED ============
 *
 * Task 5.5 asked ONE writer call for four items and got four items on ONE clause out of thirty-six. Three
 * died on the anchor cap. Task 1.2 asked for six and got two clauses. Measured across every R4 task that
 * asked for more than one item:
 *
 *   10 tasks asked for >1 item
 *    8 spread perfectly -- one distinct anchor per item
 *    2 did not: 1.2 (2 anchors / 6 items) and 5.5 (1 / 4), and they account for ALL FOUR anchor-cap losses
 *    both failures are the only two with N >= 4; every N <= 3 spread perfectly
 *
 * So it is not the map and it is not luck: **the writer, handed a list of passages and asked for N items,
 * chooses the most salient one repeatedly.** Telling it to spread would be an instruction; assigning the
 * clause is a decision the code makes, which is the difference between a rule and a check.
 *
 * ============ THE ORDER, AND WHY EACH PART OF IT ============
 *
 *   1. eligible = the task's effective primaries NOT already at the cap. A clause at the cap cannot take
 *      another key, so assigning one would manufacture the rejection this exists to prevent.
 *   2. PREFER the clauses the task holds FEWEST items on. Round-robin alone would spread within a run and
 *      ignore what the task already carries -- a clause at 1 and a clause at 0 are not equally good homes,
 *      and the whole point of the cap is that a form should not teach one sentence twice.
 *   3. TIES BROKEN BY A HASH OF (task, run). Sorting ties by clause string would make the first item of
 *      every run land on the same clause, so a re-run after a rejection would re-draw the same order and
 *      reproduce the same loss. Seeding by the run makes the order DIFFER between runs and stay REPRODUCIBLE
 *      within one -- which is what makes a failure arguable with.
 *   4. ROUND-ROBIN over that order, so N items with M eligible clauses use `min(N, M)` distinct clauses and
 *      wrap only when they must.
 *
 * ============ ONLY THE KEY'S ANCHOR IS ASSIGNED ============
 *
 * Ruled explicitly. A distractor's support may cite any linked passage, primary or supporting -- that is
 * where a plausible misreading lives, and constraining it would narrow the item rather than the item set.
 *
 * ============ AND WRAPPING PAST THE CAP IS REFUSED, NOT SILENTLY ALLOWED ============
 *
 * If a task asks for more items than `cap x eligible` can hold, some assignment would have to exceed the cap.
 * `assignAnchors` returns fewer assignments than requested and says so, rather than handing the writer a
 * clause that the gate will refuse. A generator that asks for six items on a map that can hold four should
 * be told four, not be given six and lose two.
 */
import { createHash } from "node:crypto";
import { CAP, anchorKey } from "./anchor-cap.mjs";

/** deterministic 32-bit hash, for the tie-break */
function h32(s) {
  return parseInt(createHash("sha256").update(String(s)).digest("hex").slice(0, 8), 16);
}

/**
 * @param opts.taskCode     the task, part of the tie-break seed
 * @param opts.runId        the run, the other part -- so a re-run re-orders
 * @param opts.primaries    [{source_id, clause}] the task's EFFECTIVE primaries
 * @param opts.censusMap    Map anchorKey -> count, everything already counted against this task
 * @param opts.want         how many items are being generated for this task
 * @param opts.cap          the per-(source, clause) cap
 * @returns {{ assignments: [{index, source_id, clause}], eligible: n, capacity: n, shortfall: n,
 *            order: [string], why: string }}
 */
export function assignAnchors({ taskCode, runId, primaries, censusMap, want, cap = CAP }) {
  const held = (p) => censusMap.get(anchorKey(p.source_id, p.clause)) || 0;
  const eligible = (primaries || []).filter((p) => held(p) < cap);

  /* room left on each eligible clause, which is what bounds the whole assignment */
  const capacity = eligible.reduce((s, p) => s + (cap - held(p)), 0);

  /* fewest-held first; ties by a hash of (task, run, clause) so the order differs between runs and is
   * reproducible within one. The clause is IN the hash so two clauses with the same count do not have to
   * share a bucket order. */
  const seeded = eligible.map((p) => ({
    ...p,
    held: held(p),
    tie: h32(String(taskCode) + "|" + String(runId) + "|" + p.source_id + "|" + p.clause),
  }));
  seeded.sort((a, b) => a.held - b.held || a.tie - b.tie);

  const assignments = [];
  const room = new Map(seeded.map((p) => [anchorKey(p.source_id, p.clause), cap - p.held]));
  let i = 0;
  while (assignments.length < want && seeded.length) {
    const p = seeded[i % seeded.length];
    const k = anchorKey(p.source_id, p.clause);
    if ((room.get(k) || 0) > 0) {
      room.set(k, room.get(k) - 1);
      assignments.push({ index: assignments.length, source_id: p.source_id, clause: p.clause });
    }
    i++;
    /* every clause exhausted: capacity is the bound, and the caller is told rather than handed a clause the
     * gate would refuse */
    if (i > seeded.length * (cap + 1)) break;
  }
  return {
    assignments,
    eligible: eligible.length,
    capacity,
    shortfall: Math.max(0, want - assignments.length),
    order: seeded.map((p) => p.clause),
    /* THREE REASONS, NOT TWO. "every primary is at the cap" is a fact about the CAP and says the map is fine;
     * "the task has no primary in this run's standard" is a fact about the MAP and says generation can never
     * help. Reporting the second as the first sent me looking for full clauses on task 5.5, which has none at
     * all -- found 2026-09-30 when the source-collision fix emptied its primary list and the message did not
     * change. They need opposite actions, so they cannot share a sentence. */
    why: eligible.length
      ? "fewest-held first, ties by hash(task|run|clause), round-robin"
      : (primaries || []).length
        ? "no eligible primary: all " + primaries.length + " are at the cap of " + cap
        : "THE TASK HAS NO PRIMARY PASSAGE IN THIS RUN'S STANDARD -- a MAP fact, not a cap fact, and no " +
          "amount of generation can close it",
  };
}

/** The line the writer is given. ONE implementation, so the prompt and the gate cannot drift. */
export function assignmentInstruction(assignments) {
  if (!assignments || !assignments.length) return "";
  return "\n\nEACH ITEM'S KEY IS ASSIGNED A CLAUSE, and code refuses a key anchored anywhere else." +
    " This is not a preference: a writer handed a list of passages picks the most salient one repeatedly," +
    " and four items on one clause means three rejections.\n" +
    assignments.map((a) => "  item " + (a.index + 1) + ": anchor its `key_support` in clause " + a.clause +
      " (" + a.source_id + ")").join("\n") +
    "\nA DISTRACTOR's support may cite any passage above, primary or supporting. Only the KEY's anchor is" +
    " assigned.";
}

/**
 * The gate. An item anchored anywhere other than its assigned clause is refused.
 * @returns {{ id, pass, examined, reason }}
 */
export function gateAnchorAssignment(item, assigned) {
  /* THREE STATES. An item with no assignment -- a rerun of an older artifact, a path that predates this --
   * is UNASSERTED rather than a pass: this gate did not examine it, and saying so is not the same as saying
   * it is fine. */
  if (!assigned || !assigned.clause) {
    return { id: "anchor-assignment", pass: null, examined: 0,
      reason: "no clause was assigned to this item, so nothing was checked" };
  }
  const got = String((item && item.key_support_clause) || "");
  if (!got) {
    return { id: "anchor-assignment", pass: false, examined: 1,
      reason: "the item names no key_support_clause, so it cannot be the assigned " + assigned.clause };
  }
  if (got !== String(assigned.clause)) {
    return { id: "anchor-assignment", pass: false, examined: 1,
      reason: "anchored in " + got + ", assigned " + assigned.clause +
        " -- the writer chose its own clause, which is the clustering this assignment exists to stop" };
  }
  return { id: "anchor-assignment", pass: true, examined: 1,
    reason: "anchored in its assigned clause " + assigned.clause };
}

/* ---------------------------------------------------------------- controls */
export function anchorAssignmentControls({ quiet = false } = {}) {
  const out = [];
  const ok = (what, cond, detail) => out.push({ what, pass: !!cond, detail: cond ? null : detail });
  const P = (clause) => ({ source_id: "ISO/IEC 42001", clause });
  const cens = (pairs) => new Map(pairs.map(([c, n]) => [anchorKey("ISO/IEC 42001", c), n]));

  /* ---- the 5.5 case: four items, many eligible clauses, four DISTINCT anchors ---- */
  {
    const primaries = ["3.4", "9.1", "9.2", "9.3", "10.1", "10.2"].map(P);
    const r = assignAnchors({ taskCode: "5.5", runId: "r5", primaries, censusMap: cens([]), want: 4 });
    ok("5.5: four items get four DISTINCT clauses", new Set(r.assignments.map((a) => a.clause)).size === 4,
      JSON.stringify(r.assignments.map((a) => a.clause)));
    ok("...and every one of them is a real primary",
      r.assignments.every((a) => primaries.some((p) => p.clause === a.clause)));
    ok("...and no shortfall", r.shortfall === 0);
  }

  /* ---- fewest-held first: a clause already holding one must come AFTER an empty one ---- */
  {
    const primaries = ["A", "B", "C"].map(P);
    const r = assignAnchors({ taskCode: "t", runId: "r", primaries,
      censusMap: cens([["A", 1], ["B", 1]]), want: 1 });
    ok("the clause holding NOTHING is assigned before the two holding one",
      r.assignments[0].clause === "C", "got " + r.assignments[0].clause);
  }

  /* ---- a clause AT the cap is never assigned ---- */
  {
    const primaries = ["A", "B"].map(P);
    const r = assignAnchors({ taskCode: "t", runId: "r", primaries,
      censusMap: cens([["A", CAP]]), want: 2 });
    ok("a clause at the cap is not eligible", r.assignments.every((a) => a.clause !== "A"),
      JSON.stringify(r.assignments));
    ok("...so capacity bounds the ask and the shortfall is reported",
      r.eligible === 1 && r.capacity === CAP && r.assignments.length === 2 && r.shortfall === 0,
      JSON.stringify({ eligible: r.eligible, capacity: r.capacity, n: r.assignments.length }));
  }

  /* ---- ASKING FOR MORE THAN THE MAP CAN HOLD IS A REPORTED SHORTFALL, NOT AN OVER-CAP ASSIGNMENT ---- */
  {
    const primaries = ["A", "B"].map(P);
    const r = assignAnchors({ taskCode: "t", runId: "r", primaries, censusMap: cens([]), want: 10 });
    ok("asking for 10 on a map that holds " + (2 * CAP) + " assigns " + (2 * CAP) + " and reports the rest",
      r.assignments.length === 2 * CAP && r.shortfall === 10 - 2 * CAP,
      JSON.stringify({ n: r.assignments.length, shortfall: r.shortfall }));
    const counts = {};
    for (const a of r.assignments) counts[a.clause] = (counts[a.clause] || 0) + 1;
    ok("...and no clause is assigned more than the cap",
      Object.values(counts).every((n) => n <= CAP), JSON.stringify(counts));
  }

  /* ---- every primary at the cap: nothing is assigned, and the reason says so ---- */
  {
    const primaries = ["A", "B"].map(P);
    const r = assignAnchors({ taskCode: "t", runId: "r", primaries,
      censusMap: cens([["A", CAP], ["B", CAP]]), want: 3 });
    ok("every primary at the cap assigns nothing and names why",
      r.assignments.length === 0 && r.shortfall === 3 && /at the cap of/.test(r.why),
      JSON.stringify(r));
    /* AND IT MUST NOT SAY THE OTHER THING. The two zero-assignment reasons need opposite actions -- a full cap
     * is fine and a missing map is not -- so each control asserts its own reason AND the absence of the other.
     * Asserting only the positive half passes on a single message used for both. */
    ok("...and does NOT blame the map",
      !/NO PRIMARY PASSAGE/.test(r.why), r.why);
  }

  /* ---- NO PRIMARY AT ALL: a different reason, because it needs a different action ---- */
  {
    const r = assignAnchors({ taskCode: "t", runId: "r", primaries: [], censusMap: cens([]), want: 2 });
    ok("a task with no primary in this run's standard says so, not that the cap is full",
      r.assignments.length === 0 && r.shortfall === 2 && r.capacity === 0 &&
      /NO PRIMARY PASSAGE/.test(r.why) && !/at the cap of/.test(r.why), JSON.stringify(r));
  }

  /* ---- REPRODUCIBLE WITHIN A RUN, DIFFERENT BETWEEN RUNS ---- */
  {
    const primaries = ["A", "B", "C", "D"].map(P);
    const a1 = assignAnchors({ taskCode: "t", runId: "run-1", primaries, censusMap: cens([]), want: 2 });
    const a2 = assignAnchors({ taskCode: "t", runId: "run-1", primaries, censusMap: cens([]), want: 2 });
    const b1 = assignAnchors({ taskCode: "t", runId: "run-2", primaries, censusMap: cens([]), want: 2 });
    ok("the same task and run give the same order twice",
      JSON.stringify(a1.order) === JSON.stringify(a2.order), JSON.stringify([a1.order, a2.order]));
    ok("a DIFFERENT run gives a different order, so a re-run does not repeat the same loss",
      JSON.stringify(a1.order) !== JSON.stringify(b1.order),
      "both runs ordered " + JSON.stringify(a1.order) + " -- a re-run would re-draw identically");
    /* and a different TASK differs too, so two tasks in one run do not march in step */
    const c1 = assignAnchors({ taskCode: "u", runId: "run-1", primaries, censusMap: cens([]), want: 2 });
    ok("a different TASK in the same run gives a different order",
      JSON.stringify(a1.order) !== JSON.stringify(c1.order));
  }

  /* ---- the gate: both directions, plus the third state ---- */
  {
    const assigned = { source_id: "ISO/IEC 42001", clause: "9.2.2" };
    ok("the gate PASSES an item anchored in its assigned clause",
      gateAnchorAssignment({ key_support_clause: "9.2.2" }, assigned).pass === true);
    const v = gateAnchorAssignment({ key_support_clause: "3.4" }, assigned);
    ok("the gate REFUSES an item anchored elsewhere and names both clauses",
      v.pass === false && /anchored in 3\.4, assigned 9\.2\.2/.test(v.reason), JSON.stringify(v));
    ok("an item with NO clause is refused, not passed",
      gateAnchorAssignment({}, assigned).pass === false);
    const u = gateAnchorAssignment({ key_support_clause: "9.2.2" }, null);
    ok("NO ASSIGNMENT is UNASSERTED, never a pass -- this gate did not examine it",
      u.pass === null && u.examined === 0, JSON.stringify(u));
  }

  /* ---- the instruction the writer receives must NAME every item and every clause ---- */
  {
    const asg = [{ index: 0, source_id: "ISO/IEC 42001", clause: "9.1" },
      { index: 1, source_id: "ISO/IEC 42001", clause: "9.2" }];
    const s = assignmentInstruction(asg);
    ok("the instruction names item 1 and item 2 with their clauses",
      /item 1: anchor its `key_support` in clause 9\.1/.test(s) &&
      /item 2: anchor its `key_support` in clause 9\.2/.test(s), JSON.stringify(s.slice(0, 200)));
    ok("...and says a DISTRACTOR is unconstrained, so the writer does not over-apply it",
      /Only the KEY's anchor is assigned/.test(s));
    ok("an empty assignment list produces NO instruction rather than an empty heading",
      assignmentInstruction([]) === "" && assignmentInstruction(null) === "");
  }
  if (!quiet) for (const r of out) if (!r.pass) console.error("  anchor-assignment control FAIL: " + r.what);
  return { cases: out, examined: out.length, allPass: out.every((r) => r.pass) };
}
