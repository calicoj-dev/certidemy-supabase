#!/usr/bin/env node
/**
 * check-key-position.mjs -- where does the correct option sit, across the live secure bank?
 *
 * READ-ONLY. Unknown flags exit 2. `--cert=CODE` to scope, otherwise every certification.
 *
 * ============ WHY THIS EXISTS ============
 *
 * Found 2026-09-29 while designing a test of something else. Across 103 grounded AIMS-F survivors the key is
 * option A in 73 percent of items, so ALWAYS ANSWERING A SCORES 73 PERCENT with no knowledge and no cue.
 *
 * And `generate-mock-exam` passes `options: q.options` through verbatim. It shuffles the QUESTION order, it
 * round-robins across tasks, it withholds difficulty and task "so the client can't infer answer strategies"
 * -- and it never shuffles the OPTION order. So a bank whose keys cluster at one letter hands a candidate a
 * strategy the assembler was written to deny them.
 *
 * ============ MEASURED FIRST RUN: THE AUTHORED BANKS ARE FINE. THE GENERATOR IS NOT. ============
 *
 * Eleven of the twelve real certifications sit within four points of chance, which is what a uniformly
 * written bank looks like. AIMS-F is the outlier at +9, and AIMS-F is the ONLY certification that contains
 * grounded items. Within it, the 49 inserted grounded rows are 78 percent A against an authored remainder at
 * 26 percent.
 *
 * So this is a defect in the GROUNDED GENERATOR'S OUTPUT, not in how items have been authored -- and stating
 * it the other way round would have sent someone to audit twelve banks that are correct.
 *
 * ============ THE TWO NUMBERS THAT MATTER ARE DIFFERENT QUESTIONS ============
 *
 *   the BANK's distribution     is a fact about how items were written
 *   the FORM's exposure         is what a candidate can exploit, and it is the bank's distribution ONLY
 *                               because nothing shuffles at delivery. Shuffle at delivery and the bank's
 *                               skew stops mattering to candidates while still mattering to the probe.
 *
 * Both are reported, and the chance floor is computed per item from its own option count rather than assumed
 * to be 25 percent -- a two-option item has a 50 percent floor and averaging 25 into it understates the
 * exposure.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, getAllIn } from "./_pg.mjs";

let CERT = null;
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--cert=(.+)$/.exec(a))) { CERT = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --cert=CODE. READ-ONLY.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const KEY = requireKey(HERE);
const certs = (await getAll(KEY, "certifications?select=id,code,status&order=code"))
  .filter((c) => !CERT || c.code === CERT);
if (!certs.length) { console.error("no certification matched"); process.exit(2); }

const L = (i) => String.fromCharCode(65 + i);
console.log("WHERE THE KEY SITS, live secure English items");
console.log("");
console.log("  cert        n     A      B      C      D     E+   always-A   chance   EXCESS");
console.log("  " + "-".repeat(78));

const rows = [];
for (const c of certs) {
  /* bounded read: one certification's live secure English items */
  /* `correct_answer` is the key, as an ARRAY OF OPTION IDS -- the options themselves carry only
   * {id, text}. My first version looked for `is_correct` on each option, found none anywhere, and
   * printed an empty table that read as "no skew" rather than as "no measurement". */
  const qs = await getAll(KEY, "quiz_questions?select=id,options,question_type,correct_answer" +
    "&certification_id=eq." + c.id + "&language=eq.en&pool=eq.secure&retired_at=is.null" +
    "&status=in.(approved,pending_review)&order=id");
  if (!qs.length) continue;
  const tally = {}; let n = 0, chanceSum = 0, malformed = 0;
  for (const q of qs) {
    const opts = Array.isArray(q.options) ? q.options : null;
    if (!opts || !opts.length) { malformed++; continue; }
    const ca = Array.isArray(q.correct_answer) ? q.correct_answer[0] : q.correct_answer;
    const idx = opts.findIndex((o) => o && String(o.id) === String(ca));
    /* AN ITEM WHOSE KEY CANNOT BE RESOLVED IS ITS OWN STATE, never counted as position A. */
    if (idx < 0) { malformed++; continue; }
    n++;
    const lab = idx < 4 ? L(idx) : "E+";
    tally[lab] = (tally[lab] || 0) + 1;
    chanceSum += 1 / opts.length;
  }
  /* THE PROBE MUST PROVE IT COULD HAVE FOUND SOMETHING. A certification where nothing resolves is
   * UNRESOLVABLE and is printed as that -- never skipped, because a skipped row and a uniform row look
   * identical in a table of percentages. */
  if (!n) {
    console.log("  " + c.code.padEnd(11) + "   -- UNRESOLVABLE: " + qs.length +
      " item(s) read, 0 with a resolvable key (" + malformed + " unresolvable). NOT a uniform bank.");
    rows.push({ code: c.code, n: 0, unresolvable: true, read: qs.length });
    continue;
  }
  const alwaysA = (tally.A || 0) / n;
  const chance = chanceSum / n;
  rows.push({ code: c.code, n, tally, alwaysA, chance, malformed, status: c.status });
  const cell = (k) => {
    const v = tally[k] || 0;
    return (v + " " + Math.round((v / n) * 100) + "%").padStart(7);
  };
  console.log("  " + c.code.padEnd(11) + String(n).padStart(4) +
    cell("A") + cell("B") + cell("C") + cell("D") + cell("E+") +
    ("  " + Math.round(alwaysA * 100) + "%").padStart(11) +
    ("  " + Math.round(chance * 100) + "%").padStart(9) +
    ("  " + (alwaysA > chance ? "+" : "") + Math.round((alwaysA - chance) * 100) + "pt").padStart(9) +
    (malformed ? "   (" + malformed + " with no marked key, excluded)" : ""));
}
console.log("");
console.log("  always-A  what a candidate scores by answering A on every item, with no knowledge");
console.log("  chance    the per-item floor, 1/options averaged -- NOT assumed to be 25%");
console.log("  EXCESS    how much always-A beats chance. This is the exposure, and it is zero only if");
console.log("            the delivery path shuffles option order.");
console.log("");

/* the delivery question, stated rather than left to the reader */
console.log("DOES THE DELIVERY PATH SHUFFLE OPTION ORDER?");
console.log("  functions/generate-mock-exam passes `options: q.options` through verbatim. It shuffles the");
console.log("  QUESTION order, round-robins across tasks, and withholds difficulty and task so the client");
console.log("  \"can't infer answer strategies\" -- and never touches the option order. So for every");
console.log("  certification above, the EXCESS column is what a candidate can exploit today.");
console.log("");
const measured = rows.filter((r) => !r.unresolvable);
const unres = rows.filter((r) => r.unresolvable);
if (unres.length) {
  console.log("UNRESOLVABLE: " + unres.map((r) => r.code).join(", ") +
    "   -- reported as their own state, not folded into the measured set.");
  console.log("");
}
const worst = measured.slice().sort((a, b) => (b.alwaysA - b.chance) - (a.alwaysA - a.chance));
console.log("WORST FIRST");
for (const r of worst.slice(0, 5)) {
  console.log("  " + r.code.padEnd(11) + "always-A " + Math.round(r.alwaysA * 100) + "%  against chance " +
    Math.round(r.chance * 100) + "%   over " + r.n + " item(s)" +
    (r.status ? "   [" + r.status + "]" : ""));
}
console.log("");
console.log("A UNIFORM BANK WOULD SHOW always-A AT ROUGHLY chance. A bank at 70 percent is not a style");
console.log("preference; it is a scoreable strategy, and the score is what the credential asserts.");
