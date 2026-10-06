/**
 * writer-attribution.mjs -- WHICH MODEL WROTE AN ITEM. One definition, read by insert-pilot-drafts
 * (at insert time) and by backfill-writer-attribution (to repair the rows inserted before it existed).
 *
 * ============ WHY THIS MODULE EXISTS ============
 *
 * gen-grounded-items wrote the artifact's top-level `model` as MODEL -- the BASE DEFAULT -- rather than
 * the --writer-model actually used, and insert-pilot-drafts copied that field into item_grounding.model.
 * Measured PROMPT-140 and counted exactly in PROMPT-141: all 931 live grounded rows across four
 * certifications read `claude-opus-5`, and 409 of them were written by Sonnet (the 524 reported in
 * PROMPT-140 counted SURVIVORS, not the subset the director accepted and inserted). The column looked
 * like provenance and was a constant, which is worse than having no column -- a constant answers every
 * question confidently and always the same way.
 *
 * `spend.writer_model` was correct in every artifact all along, because it is written from WRITER_MODEL
 * by the code that spends the money. So the rule is: the spend block is the source of truth, and the
 * top-level field is never trusted even after the PROMPT-140 fix made it truthful going forward.
 */

/* The writer of the items in this artifact, or null when the artifact cannot say.
 * NEVER falls back to the top-level `model` when a spend block exists: a present-but-wrong value is
 * exactly the failure this module was written for. */
export function writerModelOf(artifact) {
  if (!artifact || typeof artifact !== "object") return null;
  const spend = artifact.spend;
  if (spend && typeof spend === "object" && spend.writer_model) return String(spend.writer_model);
  /* ============ THE SINGLE-MODEL ERA ============
   *
   * The writer and the solver could not differ until PROMPT-119 s2 added --writer-model, and
   * `spend.writer_model` was added by the same change. So an artifact whose spend block names NEITHER
   * a writer nor a solver model was written when one model did every role, and its top-level `model`
   * IS that model. Measured PROMPT-141: 59 ISMS-F/AIMS-F artifacts are in this shape (spend carries
   * `by_role`, and by_role carries no model either), covering 373 live rows.
   *
   * This is read off the artifact's own shape, not assumed. A spend block that names a SOLVER but no
   * writer is a different thing -- a split run that failed to record half of it -- and returns null
   * rather than silently crediting the solver's model to the writer. */
  const split = spend && typeof spend === "object" &&
    ("writer_model" in spend || "solver_model" in spend);
  if (!split && artifact.model) return String(artifact.model);
  return null;
}

export function writerAttributionControls() {
  const cases = [];
  const add = (name, pass) => cases.push({ name, pass: !!pass });

  /* ---- THE CASE THE DEFECT WAS ---- */
  add("an artifact whose top-level model disagrees with spend.writer_model resolves to the SPEND value",
    writerModelOf({ model: "claude-opus-5", spend: { writer_model: "claude-sonnet-5-5" } }) ===
      "claude-sonnet-5-5");
  add("...and the top-level value is not returned even though it is present and well-formed",
    writerModelOf({ model: "claude-opus-5", spend: { writer_model: "claude-sonnet-5-5" } }) !==
      "claude-opus-5");

  /* ---- agreement must not be mistaken for a passing arm: this is the vacuous case ---- */
  add("an artifact where the two agree resolves to that value (an arm that cannot discriminate)",
    writerModelOf({ model: "claude-opus-5", spend: { writer_model: "claude-opus-5" } }) ===
      "claude-opus-5");

  /* ---- THE SINGLE-MODEL ERA: spend names no role models, so the one model did every role ---- */
  add("spend with no role models at all: the top-level model IS the writer (pre-PROMPT-119 shape)",
    writerModelOf({ model: "claude-opus-5",
      spend: { calls: 70, usd: 1.23, by_role: { solver: { calls: 70 } } } }) === "claude-opus-5");
  add("...and that is the ISMS-F/AIMS-F shape measured in PROMPT-141, so those rows are already right",
    writerModelOf({ model: "claude-opus-5", spend: { price_per_mtok: 1, by_role: {} } }) === "claude-opus-5");

  /* ---- what must NOT be invented ---- */
  add("a SOLVER-only spend block resolves to null: a split run that recorded half of itself",
    writerModelOf({ model: "claude-opus-5", spend: { solver_model: "claude-opus-5" } }) === null);
  add("...so the solver's model is never credited to the writer",
    writerModelOf({ model: "x", spend: { solver_model: "claude-sonnet-5-5" } }) !== "claude-sonnet-5-5");
  add("an artifact with neither resolves to null", writerModelOf({}) === null);
  add("a null artifact resolves to null", writerModelOf(null) === null);
  add("a non-object resolves to null", writerModelOf("claude-opus-5") === null);

  /* ---- the legitimate single-model artifact ---- */
  add("no spend block at all: the top-level model IS the writer (pre-PROMPT-119 artifact)",
    writerModelOf({ model: "claude-3-7-sonnet" }) === "claude-3-7-sonnet");

  /* ---- a solver model must never be mistaken for the writer ---- */
  add("...even when both are present, the WRITER is returned",
    writerModelOf({ spend: { writer_model: "claude-sonnet-5-5", solver_model: "claude-opus-5" } }) ===
      "claude-sonnet-5-5");

  return { cases, examined: cases.length, allPass: cases.every((c) => c.pass) };
}
