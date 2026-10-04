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
 * @param opts.primaries    [{source_id, edition, clause}] the task's EFFECTIVE primaries
 * @param opts.censusMap    Map anchorKey -> count, everything already counted against this task
 * @param opts.want         how many items are being generated for this task
 * @param opts.cap          the per-(source, clause) cap
 * @returns {{ assignments: [{index, source_id, clause}], eligible: n, capacity: n, shortfall: n,
 *            order: [string], why: string }}
 */
export function assignAnchors({ taskCode, runId, primaries, censusMap, want, cap = CAP,
  certCensus = null }) {
  const held = (p) => censusMap.get(anchorKey(p.source_id, p.edition, p.clause)) || 0;
  const eligible = (primaries || []).filter((p) => held(p) < cap);

  /* room left on each eligible clause, which is what bounds the whole assignment */
  const capacity = eligible.reduce((s, p) => s + (cap - held(p)), 0);

  /* fewest-held first; ties by a hash of (task, run, clause) so the order differs between runs and is
   * reproducible within one. The clause is IN the hash so two clauses with the same count do not have to
   * share a bucket order. */
  /* ============ AND THEN BY USE ACROSS THE WHOLE CERTIFICATION (PROMPT-129 s3) ============
   *
   * `held` counts what THIS TASK carries on a clause. It cannot see that another task already tests
   * the same passage, and 14 of the director's 17 duplicate calls on R3 were exactly that: two tasks
   * on one anchor. `4f4e9379` duplicated `5a5e1d83` on 27001 9.2.2 from a different task entirely.
   * An anchor is a passage; a passage is shared; so the preference has to be certification-wide.
   *
   * It sorts AFTER the task-local count, which still leads: the cap is per task and a clause this
   * task already holds an item on is still the worse home. `certHeld` only breaks those ties, and
   * defaults to 0 when the caller passes no census -- so every existing caller behaves as before. */
  const certHeldOf = (p) => {
    if (!certCensus) return 0;
    const k = anchorKey(p.source_id, p.edition, p.clause);
    return Number(certCensus.get(k) || 0);
  };
  const seeded = eligible.map((p) => ({
    ...p,
    held: held(p),
    certHeld: certHeldOf(p),
    tie: h32(String(taskCode) + "|" + String(runId) + "|" + p.source_id + "|" + p.edition + "|" + p.clause),
  }));
  seeded.sort((a, b) => a.held - b.held || a.certHeld - b.certHeld || a.tie - b.tie);

  const assignments = [];
  const room = new Map(seeded.map((p) => [anchorKey(p.source_id, p.edition, p.clause), cap - p.held]));
  let i = 0;
  while (assignments.length < want && seeded.length) {
    const p = seeded[i % seeded.length];
    const k = anchorKey(p.source_id, p.edition, p.clause);
    if ((room.get(k) || 0) > 0) {
      room.set(k, room.get(k) - 1);
      assignments.push({ index: assignments.length, source_id: p.source_id, edition: p.edition, clause: p.clause });
    }
    i++;
    /* every clause exhausted: capacity is the bound, and the caller is told rather than handed a clause the
     * gate would refuse */
    if (i > seeded.length * (cap + 1)) break;
  }
  /* ============ WHEN THE SLOT LIST REPEATS, THE GATE WIDENS WITH IT ============
   *
   * Ruled PROMPT-118 s3, measured on R4 task 2.4: 4 eligible primaries, 7 items asked, so the
   * round-robin above handed out 7.5.1, 4.2, 4.3, 4.1, 7.5.1, 4.2, 4.3. The writer saw all four
   * passages, wrote seven sound items, and anchored five of them on a DIFFERENT primary of the same
   * four -- which anchor-assignment refused. 1 survivor of 7, and every rejection was correct work.
   *
   * The assignment exists to stop CLUSTERING: four items on one clause means three rejections. Once the
   * ask exceeds the number of eligible primaries, a single fixed slot per item stops serving that
   * purpose -- the clauses are going to be reused whatever the writer does -- and starts rejecting
   * items for choosing a different member of the set the round is already spread across.
   *
   * So each assignment carries `allowed`: its own clause when there is a distinct one per item, and
   * EVERY eligible (under-cap) primary when the list repeats. The gate accepts any member of that set.
   * `clause` stays the PREFERRED slot and still goes in the prompt, so the spread is still steered.
   *
   * THE CAP IS NOT WEAKENED BY THIS. `allowed` is built from `eligible`, which is "under cap in the
   * census at assignment time", and a within-round pile-up is still cut by `applyCap` on the survivors
   * and refused by the insert's own census. What the gate stops asserting is the one thing it was
   * getting wrong: that a reused clause belongs to one item rather than to the round. */
  const repeats = assignments.length > eligible.length;
  const allowedSet = seeded.map((p) => String(p.clause));
  for (const a of assignments) {
    a.allowed = repeats ? allowedSet.slice() : [String(a.clause)];
  }
  return {
    assignments,
    eligible: eligible.length,
    capacity,
    shortfall: Math.max(0, want - assignments.length),
    repeats,
    allowed: repeats ? allowedSet.slice() : null,
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
  /* ONE implementation, so what the writer is told is what the gate checks -- including the widening. */
  const wide = assignments.some((a) => Array.isArray(a.allowed) && a.allowed.length > 1);
  const head = wide
    ? "\n\nEACH ITEM'S KEY IS ASSIGNED A PREFERRED CLAUSE. This round asks more items than the task has" +
      " distinct primary passages, so the clauses repeat: the key may anchor in its preferred clause OR in" +
      " any other clause on the assigned list below. Spread them -- four items on one clause means the" +
      " anchor cap drops three of them -- but a different clause from the list is not an error.\n"
    : "\n\nEACH ITEM'S KEY IS ASSIGNED A CLAUSE, and code refuses a key anchored anywhere else." +
      " This is not a preference: a writer handed a list of passages picks the most salient one repeatedly," +
      " and four items on one clause means three rejections.\n";
  const body = assignments.map((a) => "  item " + (a.index + 1) + ": anchor its `key_support` in clause " +
    a.clause + " (" + a.source_id + ")").join("\n");
  const tail = (wide
      ? "\nTHE ASSIGNED LIST for this task: " + assignments[0].allowed.join(", ") + "."
      : "") +
    "\nA DISTRACTOR's support may cite any passage above, primary or supporting. Only the KEY's anchor is" +
    " assigned.";
  return head + body + tail;
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
  /* ============ THE ALLOWED SET, WHERE THE ASSIGNMENT REPEATED ============
   *
   * `allowed` holds one clause in the ordinary case and every under-cap primary of the task where the
   * ask exceeded the number of distinct primaries (PROMPT-118 s3). An assignment carrying no `allowed`
   * is an older artifact and keeps the strict single-clause test -- it is not widened retroactively. */
  const allowed = Array.isArray(assigned.allowed) && assigned.allowed.length
    ? assigned.allowed.map(String)
    : [String(assigned.clause)];
  if (!allowed.includes(got)) {
    return { id: "anchor-assignment", pass: false, examined: 1,
      reason: allowed.length > 1
        ? "anchored in " + got + ", which is not among this task's under-cap primaries (" +
          allowed.join(", ") + ") -- a supporting passage or a clause at the cap is still refused"
        : "anchored in " + got + ", assigned " + assigned.clause +
          " -- the writer chose its own clause, which is the clustering this assignment exists to stop" };
  }
  return { id: "anchor-assignment", pass: true, examined: 1,
    reason: allowed.length > 1
      ? "anchored in " + got + ", an under-cap primary of this task (assigned list: " + allowed.join(", ") + ")"
      : "anchored in its assigned clause " + assigned.clause };
}

/* ---------------------------------------------------------------- controls */
export function anchorAssignmentControls({ quiet = false } = {}) {
  const out = [];
  const ok = (what, cond, detail) => out.push({ what, pass: !!cond, detail: cond ? null : detail });
  const P = (clause) => ({ source_id: "ISO/IEC 42001", edition: "2023", clause });
  const cens = (pairs) => new Map(pairs.map(([c, n]) => [anchorKey("ISO/IEC 42001", "2023", c), n]));

  /* ---- CERTIFICATION-WIDE PREFERENCE (PROMPT-129 s3), both directions ---- */
  {
    /* two clauses, both untouched BY THIS TASK, but 9.1 is already tested by another task */
    const primaries = ["9.1", "9.2"].map(P);
    const certBusy = cens([["9.1", 3]]);
    const r = assignAnchors({ taskCode: "x.1", runId: "r1", primaries, censusMap: cens([]),
      want: 1, certCensus: certBusy });
    ok("a clause used elsewhere in the certification loses to an unused one",
      r.assignments[0] && r.assignments[0].clause === "9.2",
      "picked " + (r.assignments[0] || {}).clause);
    /* the other direction: swap which one is busy and the pick must swap too */
    const r2 = assignAnchors({ taskCode: "x.1", runId: "r1", primaries, censusMap: cens([]),
      want: 1, certCensus: cens([["9.2", 3]]) });
    ok("...and the preference follows the census, not the clause name",
      r2.assignments[0] && r2.assignments[0].clause === "9.1",
      "picked " + (r2.assignments[0] || {}).clause);
    /* the TASK-LOCAL count still leads: a clause this task already holds is worse even if the
     * certification has never used it */
    const r3 = assignAnchors({ taskCode: "x.1", runId: "r1", primaries,
      censusMap: cens([["9.2", 1]]), want: 1, certCensus: cens([["9.1", 5]]) });
    ok("the task's own count still outranks the certification-wide one",
      r3.assignments[0] && r3.assignments[0].clause === "9.1",
      "picked " + (r3.assignments[0] || {}).clause);
    /* and with NO certCensus every existing caller is unchanged */
    const a = assignAnchors({ taskCode: "x.1", runId: "r1", primaries, censusMap: cens([]), want: 2 });
    const b = assignAnchors({ taskCode: "x.1", runId: "r1", primaries, censusMap: cens([]), want: 2,
      certCensus: null });
    ok("omitting certCensus changes nothing",
      JSON.stringify(a.assignments) === JSON.stringify(b.assignments));
  }

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
  /* ============ PROMPT-118 s3: THE REPEATED SLOT LIST, BOTH DIRECTIONS ============
   *
   * R4 task 2.4 measured: 4 eligible primaries, 7 asked, 5 correct items refused. The widening must
   * admit another under-cap primary AND still refuse the two things the gate exists for. */
  {
    const prim = ["7.5.1", "4.2", "4.3", "4.1"].map(P);
    /* one clause held twice is AT the cap and drops out of `eligible` */
    const census = cens([["4.1", CAP]]);   /* cens takes [clause, count] pairs */
    const wide = assignAnchors({ taskCode: "2.4", runId: "r4", primaries: prim, censusMap: census, want: 7 });
    ok("the ask exceeding distinct primaries is reported as repeating", wide.repeats === true,
      JSON.stringify({ repeats: wide.repeats, eligible: wide.eligible, n: wide.assignments.length }));
    ok("...and 4.1, at the cap, is NOT in the allowed set",
      !!wide.allowed && !wide.allowed.includes("4.1"), JSON.stringify(wide.allowed));
    ok("...while the three under-cap primaries are",
      !!wide.allowed && ["7.5.1", "4.2", "4.3"].every((c) => wide.allowed.includes(c)),
      JSON.stringify(wide.allowed));
    const a0 = wide.assignments[0];
    /* MUST PASS: a repeat-slot item anchored on another under-cap primary */
    const other = wide.allowed.find((c) => c !== String(a0.clause));
    ok("a repeat-slot item anchored on ANOTHER under-cap primary PASSES",
      gateAnchorAssignment({ key_support_clause: other }, a0).pass === true,
      JSON.stringify(gateAnchorAssignment({ key_support_clause: other }, a0)));
    ok("...and on its own preferred clause, obviously",
      gateAnchorAssignment({ key_support_clause: String(a0.clause) }, a0).pass === true);
    /* MUST FAIL: a supporting passage, which is not a primary of the task at all */
    ok("a repeat-slot item anchored on a SUPPORTING passage FAILS",
      gateAnchorAssignment({ key_support_clause: "9.9.9" }, a0).pass === false,
      JSON.stringify(gateAnchorAssignment({ key_support_clause: "9.9.9" }, a0)));
    /* MUST FAIL: a primary that is AT the cap */
    ok("a repeat-slot item anchored on a primary AT CAP FAILS",
      gateAnchorAssignment({ key_support_clause: "4.1" }, a0).pass === false,
      JSON.stringify(gateAnchorAssignment({ key_support_clause: "4.1" }, a0)));
    /* AND THE NARROW CASE IS UNCHANGED: enough distinct primaries, so one slot each */
    const narrow = assignAnchors({ taskCode: "2.4", runId: "r4", primaries: prim, censusMap: cens([]), want: 3 });
    ok("an ask within the distinct primaries does NOT repeat", narrow.repeats === false,
      JSON.stringify({ repeats: narrow.repeats, n: narrow.assignments.length }));
    const n0 = narrow.assignments[0];
    const notN0 = narrow.assignments.map((a) => String(a.clause)).find((c) => c !== String(n0.clause));
    ok("...and an item anchored on a different primary STILL FAILS there",
      gateAnchorAssignment({ key_support_clause: notN0 }, n0).pass === false,
      JSON.stringify(gateAnchorAssignment({ key_support_clause: notN0 }, n0)));
    /* an OLDER assignment, with no `allowed`, keeps the strict test rather than being widened */
    ok("an assignment with no `allowed` keeps the strict single-clause test",
      gateAnchorAssignment({ key_support_clause: "4.2" }, { index: 0, clause: "7.5.1" }).pass === false);
    /* the instruction the writer reads must SAY it widened, or the two drift */
    const instr = assignmentInstruction(wide.assignments);
    ok("the writer is told the clauses repeat and a listed clause is not an error",
      /repeat/i.test(instr) && /THE ASSIGNED LIST/.test(instr), instr.slice(0, 160));
    ok("...and the narrow instruction still says code refuses anything else",
      /refuses a key anchored anywhere else/.test(assignmentInstruction(narrow.assignments)));
  }
  if (!quiet) for (const r of out) if (!r.pass) console.error("  anchor-assignment control FAIL: " + r.what);
  return { cases: out, examined: out.length, allPass: out.every((r) => r.pass) };
}
