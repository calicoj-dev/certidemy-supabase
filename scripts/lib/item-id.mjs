/**
 * item-id.mjs -- the one link between an artifact item and a bank row.
 *
 * An artifact carries no `question_id`, because the row does not exist when the artifact is written. The link
 * is a hash of the STEM: the same stem inserted is the same item. Every instrument that has to ask *is this
 * artifact item already in the bank* computes it.
 *
 * ============ TWELVE HAND-WRITTEN COPIES, MEASURED IDENTICAL, AND THAT IS NOT SAFETY ============
 *
 * Counted 2026-09-30 while adding a thirteenth: eleven scripts plus `gen-grounded-items.mjs` each define this
 * inline. Measured rather than assumed -- all twelve are `sha256` of the whitespace-collapsed, trimmed stem,
 * `digest("hex").slice(0, 8)`, with no divergence today.
 *
 * **A negative result is recorded at the same weight as a positive one**, so: nothing is currently broken. The
 * reason this module exists anyway is that the failure mode is silent and total. If one copy truncated at 12,
 * or normalised case, or trimmed punctuation, then that instrument would decide a *different* set of items was
 * already inserted -- and the symptom is not an error, it is a cap census that under-counts, an insert that
 * re-inserts, or a verdict recorded against nothing.
 *
 * So: NEW code imports this. The eleven copies are enumerated by `scripts/check-item-id-copies.mjs`, which
 * asserts each still agrees with this function on a fixture -- a divergence becomes loud instead of becoming a
 * disagreement about identity.
 *
 * ============ WHY THE STEM AND NOT THE WHOLE ITEM ============
 *
 * A stem rewrite MUST produce a new id: that is how a revision is told from its original, and
 * `report-aimsf-completion` reads it that way to mark an item SUPERSEDED. Options and explanations are edited
 * by the de-cue pass and by translation review, and those edits must NOT change which item a row is.
 */
import { createHash } from "node:crypto";

/** The canonical id of a stem string. */
export function itemIdOfStem(stem) {
  return createHash("sha256")
    .update(String(stem || "").replace(/\s+/g, " ").trim())
    .digest("hex").slice(0, 8);
}

/** The canonical id of an item object, from its `question_text`. */
export function itemIdOf(item) {
  return itemIdOfStem(item && item.question_text);
}

/**
 * Controls. A hash function cannot be checked by inspection -- it either agrees with the twelve copies in the
 * repository or it silently redefines identity.
 */
export function itemIdControls() {
  const cases = [];
  const ok = (what, pass, detail = "") => cases.push({ what, pass, detail });

  /* the shape: 8 lowercase hex characters */
  const a = itemIdOfStem("A candidate asks which clause applies.");
  ok("8 lowercase hex characters", /^[0-9a-f]{8}$/.test(a), a);

  /* WHITESPACE IS COLLAPSED, because an artifact's stem and the stored row differ by line wrapping and by
   * whatever a paste did to them -- and this repository records four separate transport defects that changed
   * whitespace. Identity must survive that. */
  ok("whitespace is collapsed and trimmed",
    itemIdOfStem("  one   two\nthree  ") === itemIdOfStem("one two three"),
    itemIdOfStem("  one   two\nthree  ") + " vs " + itemIdOfStem("one two three"));

  /* AND NOTHING ELSE IS NORMALISED. Case, punctuation and accents are part of the stem: two items differing
   * only in a question mark are two items, and a translated stem is a different row entirely. Asserted in the
   * NEGATIVE direction, because a hash that quietly folded case would make two items one. */
  ok("case is NOT folded", itemIdOfStem("Clause 4.1") !== itemIdOfStem("clause 4.1"));
  ok("punctuation is NOT stripped", itemIdOfStem("Which clause?") !== itemIdOfStem("Which clause"));
  ok("accents are NOT folded", itemIdOfStem("gestión") !== itemIdOfStem("gestion"));

  /* the object form and the string form agree, or a caller holding an item gets a different answer from one
   * holding its stem -- which is exactly the class of defect this module exists to remove */
  ok("itemIdOf(item) === itemIdOfStem(item.question_text)",
    itemIdOf({ question_text: "x y" }) === itemIdOfStem("x y"));

  /* an absent stem must not throw AND must not collide with a real one */
  ok("an absent stem is stable and is not a real id",
    itemIdOfStem(null) === itemIdOfStem(undefined) && itemIdOfStem(null) !== a,
    itemIdOfStem(null));

  /* THE PINNED VALUE. Without it every assertion above is about internal consistency and none is about
   * agreeing with the ELEVEN COPIES already deciding identity in this repository. Taken from a real
   * artifact item: `AIMSF-R5.json`'s task 1.3 survivor, whose recorded item_id is 182229d1. */
  /* READ OUT OF THE ARTIFACT, NOT TRANSCRIBED. My first version of this control invented a plausible stem
   * from memory and the control failed against its own expected id -- which is the reconstruct-from-memory
   * defect, caught by the assertion it was meant to be. The literal below was generated from the file. */
  const PINNED_STEM =
    "A project team is settling on the learning algorithm and model type for a planned AI system, " +
    "and is writing down the reasons for each choice against the organization's stated aims and the " +
    "agreed specification criteria. Which Annex A life-cycle obligation is this team fulfilling?";
  ok("PINNED: a real artifact item_id reproduces",
    itemIdOfStem(PINNED_STEM) === "182229d1",
    itemIdOfStem(PINNED_STEM) + " (expected 182229d1)");

  return { cases, allPass: cases.every((c) => c.pass) };
}
