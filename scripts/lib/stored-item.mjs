/**
 * Adapt a stored `quiz_questions` row to the in-memory shape the gates expect.
 *
 * STORED: `options: [{id, text}]` + `correct_answer: ["d"]`.  GATES: `options: [{text, is_correct}]`.
 * Feeding a stored row straight to a gate leaves `ki = -1`, so every key-relative arm is SKIPPED and
 * the gate reports `examined: 4` with no finding -- vacuously clean over a whole corpus.
 * Found 2026-10-02 when PROMPT-102's new flags fired 0/192 including on the item the director
 * flagged by reading. One adapter, so no caller can re-make that mistake.
 */

/** @returns {{question_text, options:[{text,is_correct}], explanation, key_support, key_support_clause, ...}} */
export function gateItemOf(row) {
  if (!row || typeof row !== "object") throw new TypeError("gateItemOf: not a row");
  const opts = Array.isArray(row.options) ? row.options : null;
  if (!opts) throw new TypeError("gateItemOf: row has no options array (id " + String(row.id).slice(0, 8) + ")");

  /* correct_answer is an ARRAY of option ids. A row with none is UNKEYED and must throw rather than
   * return an item whose gates cannot fire -- that is the defect this module exists for. */
  const ca = Array.isArray(row.correct_answer) ? row.correct_answer.map(String)
    : row.correct_answer == null ? [] : [String(row.correct_answer)];
  if (!ca.length) throw new Error("gateItemOf: row " + String(row.id).slice(0, 8) + " has no correct_answer; its gates could not fire");
  const keys = new Set(ca);
  const marked = opts.map((o) => ({ ...o, text: String(o && o.text || ""), is_correct: keys.has(String(o && o.id)) }));
  if (!marked.some((o) => o.is_correct)) {
    throw new Error("gateItemOf: row " + String(row.id).slice(0, 8) + " correct_answer " + JSON.stringify(ca) +
      " matches no option id [" + opts.map((o) => o && o.id).join(",") + "]");
  }
  return { ...row, options: marked };
}

/** The 8-char id the director's rulings use: the question_id UUID prefix, NOT a stem hash. */
export const id8 = (row) => String(row.id).slice(0, 8);

/** Both directions, so a shape change cannot pass silently. */
export function storedItemControls() {
  const fails = [];
  const ok = gateItemOf({ id: "aaaaaaaa-0", options: [{ id: "a", text: "x" }, { id: "b", text: "y" }], correct_answer: ["b"] });
  if (!(ok.options[1].is_correct === true && ok.options[0].is_correct === false)) fails.push("marks the wrong option");
  for (const [label, row] of [
    ["no correct_answer", { id: "bbbbbbbb-0", options: [{ id: "a", text: "x" }], correct_answer: [] }],
    ["correct_answer matches no option", { id: "cccccccc-0", options: [{ id: "a", text: "x" }], correct_answer: ["z"] }],
    ["no options", { id: "dddddddd-0", correct_answer: ["a"] }],
  ]) {
    let threw = false;
    try { gateItemOf(row); } catch { threw = true; }
    if (!threw) fails.push("accepted a row it must refuse: " + label);
  }
  return { examined: 4, fails };
}
