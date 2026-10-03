/**
 * verify-cert-population.mjs -- the ONE definition of "the served pool", and its controls.
 *
 * Ruled PROMPT-110 s2. Every verify-cert check that measures what a candidate sees reads this, so a
 * check cannot quietly measure a wider set. The predicates are generate-mock-exam's own
 * (mode='exam', index.ts:303-344).
 *
 * DEFAULT IS LIVE. A check about history reads retired rows deliberately and says so in its label.
 */

/** Is this row SERVED in the secure exam for `lang`? */
export function isServed(row, lang) {
  return !!row &&
    row.retired_at === null &&
    row.pool === "secure" &&
    row.language === lang &&
    row.status === "approved" &&
    row.is_exam_scope === true &&
    row.item_origin !== "generated" &&
    row.item_origin !== null &&
    row.item_origin !== undefined;
}

/** Served AND judgeable for a cue test: at least three options. */
export function isCueJudgeable(row, lang) {
  return isServed(row, lang) && Array.isArray(row.options) && row.options.length >= 3;
}

/** Both directions, including the two cases PROMPT-110 s2 names. */
export function populationControls() {
  const cases = [];
  const ok = (what, pass) => cases.push({ what, pass });

  const base = {
    id: "fixture", language: "en", pool: "secure", status: "approved",
    is_exam_scope: true, item_origin: "grounded", retired_at: null,
    options: [{ id: "a", text: "x".repeat(200) }, { id: "b", text: "y" }, { id: "c", text: "z" }],
    correct_answer: ["a"],
  };

  /* THE TWO RULED CASES: the same cued row, retired and live. */
  ok("a RETIRED cued row is NOT in the population",
    !isCueJudgeable({ ...base, retired_at: "2026-10-03T00:00:00Z" }, "en"));
  ok("the SAME row live IS in the population", isCueJudgeable(base, "en"));

  /* status, the gap that produced the 363-vs-357 disagreement */
  ok("a rejected row is NOT served", !isServed({ ...base, status: "rejected" }, "en"));
  ok("a pending_review row is NOT served", !isServed({ ...base, status: "pending_review" }, "en"));
  ok("an approved row IS served", isServed(base, "en"));

  /* the other served predicates, each in both directions */
  ok("practice pool is NOT the secure exam", !isServed({ ...base, pool: "practice" }, "en"));
  ok("is_exam_scope=false is NOT served", !isServed({ ...base, is_exam_scope: false }, "en"));
  ok("item_origin='generated' is NOT served", !isServed({ ...base, item_origin: "generated" }, "en"));
  ok("item_origin NULL is NOT served (the filter is NULL-propagating)",
    !isServed({ ...base, item_origin: null }, "en"));
  ok("item_origin='authored' IS served", isServed({ ...base, item_origin: "authored" }, "en"));
  ok("item_origin='translated' IS served", isServed({ ...base, item_origin: "translated" }, "en"));
  ok("a different language is NOT in this language's pool", !isServed(base, "es-419"));

  /* the cue-judgeability half, both directions */
  ok("a served row with 2 options is NOT cue-judgeable",
    !isCueJudgeable({ ...base, options: [{ id: "a", text: "x" }, { id: "b", text: "y" }] }, "en"));
  ok("a served row with 3 options IS cue-judgeable", isCueJudgeable(base, "en"));

  return { examined: cases.length, fails: cases.filter((c) => !c.pass).map((c) => c.what) };
}
