/**
 * language-sibling.mjs -- resolve a question into the requested language through its trilingual sibling.
 *
 * ONE implementation, imported by `get-review-batch` and `submit-quiz-answer`. Ruled PROMPT-96 s1b:
 * *"Language is resolved through the sibling, not filtered away."*
 *
 * ============ WHY A REVIEW CANNOT SIMPLY FILTER BY LANGUAGE ============
 *
 * A review card is the learner's SCHEDULING STATE, keyed `(user_id, question_id)` in `fsrs_cards`. Filtering
 * the due-reviews branch by language would silently drop every card the learner earned in another locale --
 * so switching the interface to Spanish would appear to erase their spaced repetition. Serving the English
 * row on a Spanish page is the defect we started from. Neither is acceptable, so the card stays and the
 * DISPLAY is resolved.
 *
 * ============ THE CARD'S OWN QUESTION ID IS WHAT GOES BACK, AND THAT IS THE WHOLE DESIGN ============
 *
 * `submit-quiz-answer` grades by reading `correct_answer` for the id it is given and updates `fsrs_cards` on
 * `(user_id, question_id)`. So:
 *
 *   return the CARD's question id   -> scheduling stays attached to the item the learner learned
 *   return the SIBLING's TEXT       -> the page is in the requested language
 *   grade by OPTION ID              -> unaffected, because siblings share option ids and correct_answer
 *
 * Returning the sibling's id instead would create a second card and reset the learner's interval, which is
 * exactly what the ruling forbids. Measured before relying on it: 9,224 of 9,224 translated option sets pair
 * by id, not by position.
 *
 * ============ NO SERVABLE SIBLING IS A SKIP, NEVER A FALLBACK ============
 *
 * *"Never serve English on a Spanish page."* So `resolveSibling` returns a THIRD state -- `null` with a
 * reason -- and the caller drops the review and logs it. A fallback would be the silent-success shape this
 * repository is built around: the learner would see a page that looks complete and is in the wrong language.
 *
 * Measured PROMPT-96 s1a, after the status/pool/retired filters are applied to the card's own question:
 *
 *   239 cards remain    234 have a servable sibling in en and es-419, 229 in pt-BR
 *   so the skip set is  5 (en, es-419) and 10 (pt-BR)
 *
 * And the 177 cards whose question carries NO `question_group_id` at all -- the known ungrouped-items defect
 * on AIE-I and SM-AI-I -- are ZERO after those filters, because every one of them is already retired. The
 * two halves of the fix interact: filtering by status and retirement is what makes sibling resolution
 * tractable.
 */

/** servable = what a practice page may show: approved, practice pool, not retired. */
export function isServable(q) {
  return !!q && q.status === "approved" && q.pool === "practice" && !q.retired_at;
}

/**
 * @param card_question the row the card points at (must carry language, question_group_id)
 * @param language      the requested language
 * @param siblings      every row sharing this question_group_id (may include the card's own)
 * @returns {{ ok: true, source: object, is_sibling: boolean }}
 *        | {{ ok: false, reason: string }}
 */
export function resolveSibling(card_question, language, siblings) {
  if (!card_question) return { ok: false, reason: "no question row" };
  /* ALREADY IN THE REQUESTED LANGUAGE: nothing to resolve, and the servability of the card's own row is the
   * caller's filter rather than this function's business -- it is asserted here anyway, because a caller
   * that forgot it would serve a retired item and this is the last place that could notice. */
  if (card_question.language === language) {
    return isServable(card_question)
      ? { ok: true, source: card_question, is_sibling: false }
      : { ok: false, reason: "the card's own row is not servable (status/pool/retired)" };
  }
  if (!card_question.question_group_id) {
    return { ok: false, reason: "no question_group_id, so no sibling can be identified" };
  }
  const found = (siblings || []).filter((s) =>
    s && s.question_group_id === card_question.question_group_id &&
    s.language === language && isServable(s));
  if (!found.length) {
    return { ok: false, reason: "no servable " + language + " sibling in group " +
      card_question.question_group_id };
  }
  /* MORE THAN ONE SERVABLE SIBLING IN ONE LANGUAGE IS ITS OWN STATE. It should not happen -- a group holds
   * one row per language -- and if it does, picking one silently would make the page non-deterministic
   * between requests. Ordered by id so the choice is at least stable, and reported. */
  const sorted = found.slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return { ok: true, source: sorted[0], is_sibling: true,
    ambiguous: sorted.length > 1 ? sorted.length : undefined };
}

/* ---------------------------------------------------------------- controls */
export function languageSiblingControls() {
  const out = [];
  const ok = (what, cond, detail) => out.push({ what, pass: !!cond, detail: cond ? null : detail });
  const row = (over) => ({ id: "x", language: "en", status: "approved", pool: "practice",
    retired_at: null, question_group_id: "g1", question_text: "EN text", ...over });

  /* the ordinary case: already in the requested language */
  const same = resolveSibling(row(), "en", []);
  ok("a row already in the requested language resolves to itself",
    same.ok && same.is_sibling === false && same.source.question_text === "EN text");

  /* the case the bug was: English card, Spanish page, servable sibling exists */
  const es = row({ id: "y", language: "es-419", question_text: "ES text" });
  const r = resolveSibling(row(), "es-419", [es]);
  ok("an English card on a Spanish page resolves to the Spanish sibling",
    r.ok && r.is_sibling === true && r.source.question_text === "ES text",
    "got: " + JSON.stringify(r));

  /* and the skip, which must NOT be a fallback */
  const none = resolveSibling(row(), "pt-BR", [es]);
  ok("no servable sibling is a SKIP with a reason, never a fallback to the card's language",
    !none.ok && /no servable pt-BR sibling/.test(none.reason), "got: " + JSON.stringify(none));

  /* a retired sibling is not servable, so it is a skip too */
  const retired = row({ id: "z", language: "es-419", retired_at: "2026-01-01T00:00:00Z" });
  const skipRetired = resolveSibling(row(), "es-419", [retired]);
  ok("a RETIRED sibling does not count as servable", !skipRetired.ok,
    "got: " + JSON.stringify(skipRetired));
  const pending = row({ id: "z", language: "es-419", status: "pending_review" });
  ok("a PENDING sibling does not count as servable", !resolveSibling(row(), "es-419", [pending]).ok);
  const secure = row({ id: "z", language: "es-419", pool: "secure" });
  ok("a SECURE-pool sibling does not count as servable", !resolveSibling(row(), "es-419", [secure]).ok);

  /* no group id: unresolvable, and that is its own reason */
  const ng = resolveSibling(row({ question_group_id: null }), "es-419", [es]);
  ok("no question_group_id is unresolvable and says so",
    !ng.ok && /no question_group_id/.test(ng.reason), "got: " + JSON.stringify(ng));

  /* the card's own row being unservable is caught even when the language matches */
  const ownRetired = resolveSibling(row({ retired_at: "2026-01-01T00:00:00Z" }), "en", []);
  ok("a RETIRED card row is refused even when its language matches", !ownRetired.ok,
    "got: " + JSON.stringify(ownRetired));

  /* a sibling from ANOTHER group must not be used */
  const otherGroup = row({ id: "w", language: "es-419", question_group_id: "g2", question_text: "WRONG" });
  ok("a sibling from a different group is never used",
    !resolveSibling(row(), "es-419", [otherGroup]).ok);

  /* two servable siblings in one language: stable choice, and reported */
  const two = resolveSibling(row(), "es-419",
    [row({ id: "b", language: "es-419" }), row({ id: "a", language: "es-419" })]);
  ok("two servable siblings in one language resolve stably and are reported as ambiguous",
    two.ok && two.source.id === "a" && two.ambiguous === 2, "got: " + JSON.stringify(two));
  return out;
}
