#!/usr/bin/env node
/**
 * census-served-explanation-letters.mjs -- served explanations that name an option by letter or position.
 *
 * READ-ONLY. Rewrites nothing. Unknown flags exit 2. Ruled PROMPT-95 addendum-2 point 2.
 *
 * ============ WHY "SERVED" IS THE WORD THAT MATTERS ============
 *
 * s1b covered grounded items only -- 153 rows, 4 hits, all fixed. This is the whole bank, and the reason it
 * is worth counting is that an explanation IS served: `submit-quiz-answer` returns `explanation` to the
 * learner after grading a practice item. So a letter reference there is not only a wrong audit record, it is
 * text a learner reads -- and once option order is per-attempt, "Option A describes..." names whatever
 * happens to be first on their screen.
 *
 * SECURE items are a different case and are reported SEPARATELY. Their explanations are not served to a
 * candidate today: score-mock-exam returns no explanation, and submit-quiz-answer refuses `pool = secure`
 * outright with a 403. So a secure hit is an audit-record defect, not a learner-facing one, and folding the
 * two together would overstate the urgency of one and hide the other.
 *
 * Counted PER CERTIFICATION AND PER POOL, with a denominator, because a count without one is half a fact --
 * and a guard whose count is distinctive only on one certification is fitted to its training set.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { explanationOptionRef, explanationOptionRefControls, RULES }
  from "./lib/explanation-option-ref.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none. It rewrites nothing.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));

console.log("CONTROLS");
const ctl = explanationOptionRefControls();
const bad = ctl.filter((c) => !c.pass);
for (const c of bad) console.log("  FAIL " + c.what + "   " + c.detail);
console.log("  " + (ctl.length - bad.length) + " of " + ctl.length + " pass   rules: " +
  RULES.map((r) => r.id).join(", "));
if (bad.length) {
  console.log("\nNO COUNT PRINTED: a detector that cannot separate its own positives from an ISO address has");
  console.log("nothing to say about a whole bank.");
  process.exitCode = 1;
  process.exit();
}
console.log("");

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&order=code");
console.log("SERVED EXPLANATIONS NAMING AN OPTION BY LETTER OR POSITION");
console.log("");
console.log("  cert         practice hits / rows      secure hits / rows      total hits");
console.log("  " + "-".repeat(74));
let tp = 0, tpr = 0, ts = 0, tsr = 0, unexamined = 0;
const examples = [];
for (const c of certs) {
  const counts = { practice: { hit: 0, rows: 0 }, secure: { hit: 0, rows: 0 } };
  for (const lang of ["en", "es-419", "pt-BR"]) {
    const qs = await getAll(KEY, "quiz_questions?select=id,explanation,pool,status,language" +
      "&certification_id=eq." + c.id + "&language=eq." + lang + "&retired_at=is.null&order=id");
    for (const q of qs) {
      const bucket = counts[q.pool] || (counts[q.pool] = { hit: 0, rows: 0 });
      bucket.rows++;
      const v = explanationOptionRef({ explanation: q.explanation });
      /* AN ITEM WITH NO EXPLANATION IS UNEXAMINED, never a pass. Counted and reported, not dropped. */
      if (!v.examined) { unexamined++; continue; }
      if (v.pass) continue;
      bucket.hit++;
      if (examples.length < 12) {
        examples.push({ cert: c.code, pool: q.pool, lang, status: q.status,
          hits: v.hits.map((h) => h.rule + " [" + h.match + "]"),
          text: String(q.explanation).replace(/\s+/g, " ").slice(0, 150) });
      }
    }
  }
  const p = counts.practice, s = counts.secure;
  tp += p.hit; tpr += p.rows; ts += s.hit; tsr += s.rows;
  if (!p.hit && !s.hit) {
    console.log("  " + c.code.padEnd(12) + String(p.hit + " / " + p.rows).padStart(22) +
      String(s.hit + " / " + s.rows).padStart(24) + String(0).padStart(16));
    continue;
  }
  console.log("  " + c.code.padEnd(12) + String(p.hit + " / " + p.rows).padStart(22) +
    String(s.hit + " / " + s.rows).padStart(24) + String(p.hit + s.hit).padStart(16) + "   <--");
}
console.log("  " + "-".repeat(74));
console.log("  TOTAL       " + String(tp + " / " + tpr).padStart(22) +
  String(ts + " / " + tsr).padStart(24) + String(tp + ts).padStart(16));
console.log("");
console.log("  practice explanations ARE served -- submit-quiz-answer returns `explanation` after grading.");
console.log("  secure explanations are NOT served today: score-mock-exam returns none, and");
console.log("  submit-quiz-answer refuses pool=secure with a 403. A secure hit is an audit-record defect.");
console.log("  rows with NO explanation, reported not dropped: " + unexamined);
console.log("");
if (examples.length) {
  console.log("EXAMPLES, up to 12 -- read them, because every lexical count here has been wrong once:");
  console.log("");
  for (const e of examples) {
    console.log("  [" + e.cert + " / " + e.pool + " / " + e.lang + " / " + e.status + "]  " + e.hits.join("  "));
    console.log("    " + e.text);
    console.log("");
  }
} else {
  console.log("No hits, so no examples. The controls above are what makes that a result rather than a silence.");
}
console.log("NOTHING WAS REWRITTEN, as ruled.");
