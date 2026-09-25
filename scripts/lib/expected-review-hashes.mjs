/**
 * expected-review-hashes.mjs -- ask the gate what it will compare against.
 *
 * ============ THERE IS NOTHING HERE TO GUESS WITH ============
 *
 * Twice on 2026-09-25 a recorder inferred a gate's hash formula and both times
 * the gate disagreed:
 *
 *   * a lesson clearance recomputed en_hash with translation_hash where the arm
 *     uses left(md5(content_md), 8) -- 41 of 41 rows reported stale, a false
 *     alarm across a whole corpus;
 *   * the own-work apply invented translation_hash over four newline-joined
 *     fields where task_ksa_is_withheld uses
 *     translation_hash(knowledge, skills, abilities). Two review rows were
 *     written that could never match and ISMS-F task 5.2 went dark in both
 *     languages for 44 seconds (INCIDENTS.md).
 *
 * Migration 374 put the expressions inside the database, one read-only function
 * per arm, built from the gate's own text. This module is the only way a script
 * reaches them, so a recorder has no formula of its own to get wrong.
 *
 * ============ THE SELECTION RULE IS **ANY**, NOT LATEST ============
 *
 * Both the lesson and task arms are `NOT EXISTS (... r.en_hash = ... AND
 * r.tr_hash = ...)`, so ANY approved review carrying both hashes clears the row.
 * A subject routinely holds several approved reviews -- one per clearance -- and
 * the older ones are stale by design. A writer therefore never has to delete or
 * supersede anything: it writes a new row with the current hashes and the gate
 * opens. 374's own fixture got this wrong first and refused a correct database.
 *
 * ============ AND A RECORDER ASSERTS THE OUTCOME ============
 *
 * `assertCleared` is the other half. Writing a review row is not clearing a row:
 * the gate decides. A recorder that clears nothing it meant to clear must exit
 * non-zero rather than print a status line, which is exactly what the 5.2 run did
 * while both languages were dark.
 */

/** Throw rather than return a shape a caller might read as a hash. */
function checkPair(name, v) {
  const row = Array.isArray(v) ? v[0] : v;
  if (!row || typeof row.en_hash !== "string" || typeof row.tr_hash !== "string") {
    throw new Error(name + ": expected {en_hash, tr_hash}, got " + JSON.stringify(v).slice(0, 140));
  }
  for (const k of ["en_hash", "tr_hash"]) {
    if (!/^[0-9a-f]{8}$/.test(row[k])) {
      throw new Error(name + ": " + k + " is " + JSON.stringify(row[k]) + ", not an 8-hex hash");
    }
  }
  return { en_hash: row.en_hash, tr_hash: row.tr_hash };
}

/**
 * The hashes the LESSON arm will compare against, for one lesson row.
 * `rpc(name, args)` is the caller's own RPC helper -- this module does no I/O of
 * its own, so it inherits whatever retry and pacing the caller already has.
 */
export async function expectedLessonHashes(rpc, lessonId) {
  return checkPair("expected_review_hashes_lesson",
    await rpc("expected_review_hashes_lesson", { p_lesson_id: lessonId }));
}

/** The hashes the TASK arm will compare against, for one task_translation row. */
export async function expectedTaskHashes(rpc, taskTranslationId) {
  return checkPair("expected_review_hashes_task",
    await rpc("expected_review_hashes_task", { p_tt_id: taskTranslationId }));
}

/** The hashes the CONCEPT gate requires ON THE ROW ITSELF -- concept hashes are
 *  the gate's stored values, not a review table, so this is 1:1. */
export async function expectedConceptHashes(rpc, conceptTranslationId) {
  return checkPair("expected_review_hashes_concept",
    await rpc("expected_review_hashes_concept", { p_ct_id: conceptTranslationId }));
}

/**
 * Assert that every row a recorder meant to clear now reads as NOT WITHHELD.
 *
 * `subjects` is [{ id, label, arm }] where arm is "lesson" | "task". Returns the
 * list still withheld; the caller exits non-zero if it is non-empty. There is no
 * concept arm here because a concept is cleared by `is_provisional` and its own
 * hash columns rather than by a review row.
 */
export async function assertCleared(rpc, subjects) {
  const still = [];
  for (const s of subjects) {
    let dark;
    if (s.arm === "lesson") {
      dark = !(await rpc("lesson_body_is_servable", { p_lesson_id: s.id }));
    } else if (s.arm === "task") {
      dark = await rpc("task_ksa_is_withheld", { p_tt_id: s.id });
    } else {
      throw new Error("assertCleared: unknown arm " + JSON.stringify(s.arm));
    }
    /* A gate that could not be reached is NOT a clearance. Anything other than a
     * definite false here counts as still withheld. */
    if (dark !== false) still.push(s.label + (dark === undefined ? " (gate unreachable)" : ""));
  }
  return still;
}

/** Fixtures. An accessor that silently accepts a bad shape is worse than none. */
export function expectedHashControls() {
  const bad = [];
  const ok = { en_hash: "0123abcd", tr_hash: "deadbeef" };
  const fake = async (_n, _a) => ok;
  const shapes = [
    [[ok], "a one-row array unwraps"],
    [ok, "a bare object is accepted"],
  ];
  for (const [v, why] of shapes) {
    try { checkPair("t", v); } catch { bad.push(why + " -- it did not"); }
  }
  const rejects = [
    [null, "null"], [[], "an empty array"], [{}, "an empty object"],
    [{ en_hash: "0123abcd" }, "a missing tr_hash"],
    [{ en_hash: "nothex!!", tr_hash: "deadbeef" }, "a non-hex en_hash"],
    [{ en_hash: "0123abc", tr_hash: "deadbeef" }, "a 7-character hash"],
  ];
  for (const [v, why] of rejects) {
    let threw = false;
    try { checkPair("t", v); } catch { threw = true; }
    if (!threw) bad.push(why + " should be refused and was not");
  }
  /* assertCleared must treat an unreachable gate as NOT cleared. */
  const unreachable = async () => undefined;
  return Promise.resolve(
    assertCleared(unreachable, [{ id: "x", label: "probe", arm: "lesson" }])
  ).then((still) => {
    if (still.length !== 1) bad.push("an unreachable gate was counted as cleared");
    void fake;
    return bad;
  });
}
