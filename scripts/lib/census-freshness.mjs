/**
 * census-freshness.mjs -- is a saturation census older than the bank it describes?
 *
 * ============ WHY ============
 *
 * PROMPT-140: propose-task-floors read `AIMS-IA-SATURATION.json` as it stood before any grounded
 * insert, so every task read held 0, and it printed a confident 35-row table proposing a floor of 0
 * for 15 tasks. Nothing was wrong with the script; its INPUT predated the bank and it had no way to
 * notice. A stale input that produces a plausible table is the worst shape of silent success: the
 * numbers are all in range.
 *
 * So the census now carries `generated_at`, and this is the comparison, in one place with controls.
 */

/* STALE when the census was built BEFORE the most recent grounded insert. Equal timestamps are fresh:
 * a census written in the same second as the insert it describes is the normal case for a script that
 * inserts and then re-censuses. Unknown inputs are NOT stale -- a missing timestamp is a
 * could-not-answer, reported separately by the caller, and must not be dressed up as a verdict. */
export function censusIsStale({ censusAt, latestInsertAt }) {
  const c = Date.parse(censusAt ?? "");
  const l = Date.parse(latestInsertAt ?? "");
  if (!Number.isFinite(c) || !Number.isFinite(l)) return null;   /* could not answer */
  return c < l;
}

export function censusFreshnessControls() {
  const cases = [];
  const add = (name, pass) => cases.push({ name, pass: !!pass });
  const A = "2026-10-05T10:55:00.000Z";   /* the stale census of PROMPT-140 */
  const B = "2026-10-05T19:09:00.000Z";   /* the insert that invalidated it */

  add("THE PROMPT-140 CASE: a census older than the latest insert is stale",
    censusIsStale({ censusAt: A, latestInsertAt: B }) === true);
  add("a census newer than the latest insert is fresh",
    censusIsStale({ censusAt: B, latestInsertAt: A }) === false);
  add("equal timestamps are fresh, not stale (insert-then-census is the normal path)",
    censusIsStale({ censusAt: B, latestInsertAt: B }) === false);

  /* ---- could-not-answer is its own verdict, never 'fresh' ---- */
  add("a census with no timestamp returns null, NOT false",
    censusIsStale({ censusAt: null, latestInsertAt: B }) === null);
  add("...and null is not equal to false, so a caller cannot treat it as fresh by accident",
    censusIsStale({ censusAt: null, latestInsertAt: B }) !== false);
  add("an unknown latest insert returns null",
    censusIsStale({ censusAt: A, latestInsertAt: undefined }) === null);
  add("an unparseable timestamp returns null",
    censusIsStale({ censusAt: "last Tuesday", latestInsertAt: B }) === null);
  add("both unknown returns null", censusIsStale({}) === null);

  /* ---- a bank with no grounded insert at all cannot make a census stale ---- */
  add("no insert has ever happened: null, because there is nothing to be older than",
    censusIsStale({ censusAt: A, latestInsertAt: null }) === null);

  /* ---- sub-second ordering must be respected, not rounded away ---- */
  add("one millisecond older is still stale",
    censusIsStale({ censusAt: "2026-10-05T19:09:00.000Z",
      latestInsertAt: "2026-10-05T19:09:00.001Z" }) === true);

  return { cases, examined: cases.length, allPass: cases.every((c) => c.pass) };
}
