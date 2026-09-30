/**
 * enemy-rule.mjs -- two items that must never reach ONE FORM together.
 *
 * Ruled PROMPT-95 s3. Imported by `generate-mock-exam`; ONE implementation, so the rule the assembler
 * enforces is the rule the test exercises. A second hand-written copy of this normalisation would surface as
 * an item dropped for an option it does not share, which nobody could reproduce.
 *
 * ============ TWO ENEMIES, AND THEY ARE DIFFERENT DEFECTS ============
 *
 *   (source, clause)   The generator caps items at 2 per clause PER TASK, so one sentence of the standard is
 *                      examined from several tasks and a single form can carry it three or four times. That
 *                      teaches one sentence three times and over-weights it against the blueprint.
 *                      Measured on AIMS-F: 67 distinct grounded clauses, 26 carrying more than one item, and
 *                      **20 of those 26 spanning more than one DOMAIN** -- which is why the rule cannot be
 *                      scoped to a domain. A per-domain rule is blind to exactly what motivated it.
 *
 *   option text        `b25f378f`'s option B was character-identical to `dfc8a1bf`'s KEY, in the same task.
 *                      On one form, one item hands the other's answer over. Measured on AIMS-F: 3 shared
 *                      option texts across the whole exam-scope pool.
 *
 * ============ AN AUTHORED ITEM IS UNCONSTRAINED, AND THAT IS ALSO THE FAILURE MODE ============
 *
 * `enemy_key` is null for an item with no `item_grounding` row, which is the ruling: the clause rule is about
 * grounded items. But a FAILED read of `item_grounding` produces the same nulls and degrades the rule to
 * "nothing is an enemy" -- a guard that cannot fire, indistinguishable in any output from a guard that fired
 * and found nothing. The caller therefore throws on a read error rather than swallowing it, and this module
 * exposes `enemyRuleControls` so the rule is never merely believed.
 *
 * ============ THE FLOOR IS A THRESHOLD, AND IT IS 40 BECAUSE THAT WAS MEASURED ============
 *
 * Short options are boilerplate -- "None of the above", "Both A and B" -- and two items sharing one of those
 * hand nothing over, so a floorless rule fires on the normal case and gets deleted by the first person it
 * inconveniences.
 *
 * MY FIRST FLOOR WAS 12 AND THIS MODULE'S OWN TEST CAUGHT IT. "None of the above" normalises to 17
 * characters and "Both A and B" to exactly 12, so both would have made two unrelated items enemies. The
 * corpus contains neither today, so the feasibility run reported a tidy 3 collisions and looked fine -- a
 * guard firing on the normal case, invisible because the normal case is currently absent. That is the worst
 * version of the defect: it would have bitten the first time somebody wrote an ordinary boilerplate option.
 *
 * MEASURED by `scripts/measure-option-overlap-floor.mjs` over 17,200 options of 4,300 secure English items:
 *
 *   option length          min 20   p1 63   p5 77   median 110   max 314
 *   longest declared boilerplate                                      37   ("No documented information...")
 *   shortest REAL collision in the corpus                             76
 *   the pair that motivated the rule (b25f378f / dfc8a1bf)           101
 *   colliding texts at floor 0, 12, 20, 30, 40, 50 and 60             14, identically -- 25 items
 *
 * So the floor changes NOTHING about the corpus as it stands: every real collision is 76 characters or more,
 * and the shortest option in the bank is 20. It exists entirely to keep future boilerplate out, and 40 is
 * chosen because it sits above the longest declared boilerplate and well below the shortest real collision.
 * Re-run that script if it is ever moved.
 */

export const OPTION_TEXT_FLOOR = 40;

/** the normalised option texts of an item, long enough to be a handover rather than boilerplate */
export function optionKeys(options) {
  return (Array.isArray(options) ? options : [])
    .map((o) => String((o && o.text) ?? "").toLowerCase().replace(/\s+/g, " ")
      .replace(/[^a-z0-9 ]/g, "").trim())
    .filter((k) => k.length >= OPTION_TEXT_FLOOR);
}

/** the enemy key of a grounding row, or null. `source|edition|clause` -- NEVER the clause alone. */
export function enemyKeyOf(grounding) {
  if (!grounding || !grounding.key_support_clause) return null;
  /* A CLAUSE ADDRESS IS NOT A KEY. ISO 19011's clause 4.x and 5.x collide with the harmonised
   * management-system 4.x and 5.x -- clause 4.1 is "context of the organization" in 27001 and 42001 and
   * "principles" in 19011 -- so keying on the clause alone would make two unrelated subjects enemies. This
   * repository records four such collisions. */
  return String(grounding.source_id) + "|" + String(grounding.edition) + "|" +
    String(grounding.key_support_clause);
}

/**
 * Is this item an enemy of something already on the form?
 * @param item  { enemy_key: string|null, options: unknown }
 * @param used  { enemy: Set<string>, optionText: Set<string> }
 * @returns null when it may be taken, otherwise the reason it may not
 */
export function enemyReason(item, used) {
  const ek = item && item.enemy_key;
  if (ek && used.enemy.has(ek)) return "clause: " + ek;
  for (const k of optionKeys(item && item.options)) {
    if (used.optionText.has(k)) return "option text: " + JSON.stringify(k.slice(0, 48));
  }
  return null;
}

/** record an item as taken, so later picks see it. */
export function markEnemy(item, used) {
  if (item && item.enemy_key) used.enemy.add(item.enemy_key);
  for (const k of optionKeys(item && item.options)) used.optionText.add(k);
}

export function freshUsed() {
  return { enemy: new Set(), optionText: new Set() };
}

/* ---------------------------------------------------------------- controls */
export function enemyRuleControls() {
  const out = [];
  const ok = (what, cond, detail) => out.push({ what, pass: !!cond, detail: cond ? null : detail });
  const opt = (...t) => t.map((text) => ({ text }));

  /* ---- the clause half ---- */
  const a = { enemy_key: "ISO/IEC 42001|2023|8.4", options: opt("alpha one two three", "beta four five six") };
  const b = { enemy_key: "ISO/IEC 42001|2023|8.4", options: opt("gamma seven eight nine", "delta ten") };
  const c = { enemy_key: "ISO/IEC 42001|2023|9.1", options: opt("epsilon eleven twelve", "zeta thirteen") };
  let u = freshUsed();
  ok("a fresh form takes the first item", enemyReason(a, u) === null);
  markEnemy(a, u);
  ok("a SECOND item on the same clause is refused", (enemyReason(b, u) || "").startsWith("clause:"),
    "got: " + enemyReason(b, u));
  ok("a DIFFERENT clause is taken", enemyReason(c, u) === null, "got: " + enemyReason(c, u));

  /* ---- an authored item is unconstrained ---- */
  const authored1 = { enemy_key: null, options: opt("eta fourteen fifteen", "theta sixteen") };
  const authored2 = { enemy_key: null, options: opt("iota seventeen eighteen", "kappa nineteen") };
  u = freshUsed();
  markEnemy(authored1, u);
  ok("two authored items are NOT enemies of each other", enemyReason(authored2, u) === null,
    "got: " + enemyReason(authored2, u));

  /* ---- the option-overlap half, on the real pair that motivated it ---- */
  const KEY_TEXT = "The degree to which the activities that were planned got carried out and the intended " +
    "results reached.";
  const holder = { enemy_key: "ISO/IEC 42001|2023|3.13", options: opt("something else entirely here", KEY_TEXT) };
  const borrower = { enemy_key: "ISO/IEC 42001|2023|3.11", options: opt(KEY_TEXT, "another distinct option") };
  u = freshUsed();
  markEnemy(holder, u);
  ok("b25f378f/dfc8a1bf: an item sharing an option TEXT is refused even on a different clause",
    (enemyReason(borrower, u) || "").startsWith("option text:"), "got: " + enemyReason(borrower, u));

  /* ---- and the floor: EVERY declared boilerplate phrase must fail to make two items enemies.
   * Asserted over the whole list rather than one example, because a floor tested on one string is a floor
   * tested on that string: 12 passed "None of these" (13 chars) and failed "None of the above" (17). */
  const BOILER = ["None of the above", "All of the above", "Both A and B", "None of these", "All of these",
    "Neither of these", "Any of the above", "It depends", "Not applicable",
    "No documented information is required", "There is no such requirement"];
  const boilerFires = [];
  for (const text of BOILER) {
    const s1 = { enemy_key: "ISO/IEC 42001|2023|1.1", options: opt(text, "a distinct real option here") };
    const s2 = { enemy_key: "ISO/IEC 42001|2023|1.2", options: opt(text, "another distinct real option") };
    const uu = freshUsed();
    markEnemy(s1, uu);
    if (enemyReason(s2, uu)) boilerFires.push(text);
  }
  ok("NONE of the " + BOILER.length + " declared boilerplate phrases makes two items enemies",
    boilerFires.length === 0, "these fired: " + boilerFires.join(" | "));

  /* ---- the source is part of the key, so a clause collision across standards is not an enemy ---- */
  const iso19011 = { enemy_key: "ISO 19011|2026|4.1", options: opt("lambda twenty one two", "mu twenty two") };
  const iso42001 = { enemy_key: "ISO/IEC 42001|2023|4.1", options: opt("nu twenty three four", "xi twenty five") };
  u = freshUsed();
  markEnemy(iso19011, u);
  ok("clause 4.1 of a DIFFERENT standard is not an enemy (the 19011 / 42001 collision)",
    enemyReason(iso42001, u) === null, "got: " + enemyReason(iso42001, u));

  /* ---- enemyKeyOf refuses to key on a clause alone ---- */
  ok("enemyKeyOf carries the source and the edition, not just the clause",
    enemyKeyOf({ source_id: "ISO/IEC 42001", edition: "2023", key_support_clause: "8.4" }) ===
      "ISO/IEC 42001|2023|8.4");
  ok("enemyKeyOf returns null for a row with no clause",
    enemyKeyOf({ source_id: "ISO/IEC 42001", edition: "2023" }) === null);
  ok("enemyKeyOf returns null for no grounding at all", enemyKeyOf(null) === null);

  /* ---- and the rule must be able to FIRE, which is the whole lesson of this session ---- */
  ok("the controls include at least one refusal in each half",
    out.some((r) => r.what.includes("same clause")) && out.some((r) => r.what.includes("option TEXT")));
  return out;
}
