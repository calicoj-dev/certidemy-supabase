/**
 * measure-tier-a-outcomes.mjs -- does any credential depend on a defective key?
 *
 * READ-ONLY. It writes nothing. Unknown flags exit 2.
 *
 * For each of the eight scored es-419 attempts, per the director's §1.1:
 *   which Tier A and Tier B items were presented, the candidate's answer to each,
 *   and the outcome under
 *     (i)  CREDIT-ALL on Tier A   -- every Tier A item counted correct
 *     (ii) WORST CASE             -- every Tier A *and* Tier B item the candidate
 *                                   got RIGHT is flipped to wrong
 *
 * (ii) is the load-bearing one. A pass that survives it stands on any reading of
 * the findings, so it needs no further defence. A pass that does not survive it
 * is reported on its own line.
 *
 * The scored total is recomputed from `exam_session_items` rather than read off
 * `exam_attempts.correct_answers`, and the two are ASSERTED EQUAL first. A
 * recomputation that silently disagreed with the recorded score would make every
 * scenario below a fact about my arithmetic.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, getAllIn } from "./_pg.mjs";
import { acquireHeavyReaderLock } from "./lib/heavy-reader-lock.mjs";
import { TIER_A, TIER_B, resolvePrefixes } from "./lib/tiered-item-findings.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY, writes nothing");
  process.exitCode = 2; process.exit();
}

const KEY = requireKey(HERE);
const release = await acquireHeavyReaderLock("measure-tier-a-outcomes");
try {
  const certs = await getAll(KEY, "certifications?select=id,code,passing_score_pct&order=id");
  const certBy = new Map(certs.map((c) => [c.id, c]));

  const sessItems = await getAll(KEY,
    "exam_session_items?select=session_id,question_id,language,user_answer,presented_order&language=neq.en&order=session_id,presented_order");
  const withItems = new Set(sessItems.map((r) => r.session_id));
  const attempts = (await getAll(KEY,
    "exam_attempts?select=id,user_id,session_id,certification_id,score_pct,passed,total_questions,correct_answers,submitted_at&order=id"))
    .filter((a) => withItems.has(a.session_id));

  const presented = sessItems.filter((r) => attempts.some((a) => a.session_id === r.session_id));
  const ids = [...new Set(presented.map((r) => r.question_id))];
  const items = await getAllIn(KEY, "quiz_questions",
    "id,certification_id,task_id,pool,question_text,options,correct_answer,explanation,retired_at", "id", ids);
  const itemBy = new Map(items.map((i) => [i.id, i]));

  /* Resolve the declared prefixes. A miss or a double is fatal, not a warning. */
  let tierA, tierB;
  try {
    tierA = resolvePrefixes(TIER_A, items);
    tierB = resolvePrefixes(TIER_B, items);
  } catch (e) {
    console.error(String(e.message || e));
    console.error("");
    console.error("No outcome reported: scoring a set I could not resolve would be a fact");
    console.error("about my prefix matching, not about any credential.");
    process.exitCode = 2; process.exit();
  }
  const aFull = new Set(tierA.map((t) => t.full));
  const bFull = new Set(tierB.map((t) => t.full));
  const findingBy = new Map([...tierA, ...tierB].map((t) => [t.full, t]));

  const right = (p) => {
    const q = itemBy.get(p.question_id);
    if (!q) return null;
    return JSON.stringify(p.user_answer) === JSON.stringify(q.correct_answer || []);
  };

  const rows = [];
  const problems = [];
  for (const a of attempts.sort((x, y) => String(x.submitted_at).localeCompare(String(y.submitted_at)))) {
    const c = certBy.get(a.certification_id);
    const pass = Number(c.passing_score_pct);
    const mine = presented.filter((p) => p.session_id === a.session_id);
    const scored = mine.filter((p) => right(p) === true).length;
    /* ASSERT the recomputation before any scenario is believed. */
    if (scored !== a.correct_answers) {
      problems.push(c.code + " " + String(a.submitted_at).slice(0, 10) +
        ": recomputed " + scored + " correct, the attempt records " + a.correct_answers);
    }
    const total = mine.length;
    const needed = Math.ceil((total * pass) / 100);

    const inA = mine.filter((p) => aFull.has(p.question_id));
    const inB = mine.filter((p) => bFull.has(p.question_id));
    const aRight = inA.filter((p) => right(p) === true).length;
    const bRight = inB.filter((p) => right(p) === true).length;

    /* (i) credit-all on Tier A: every Tier A item counts correct. */
    const creditAll = scored + (inA.length - aRight);
    /* (ii) worst case: every Tier A and B item counted RIGHT is flipped to wrong,
     *      the denominator unchanged. This is the harshest reading available and
     *      it is what the director asked for. */
    const worst = scored - aRight - bRight;
    /* (iii) DELETION, and it is not a third opinion -- it is the OTHER standard
     *       remedy, so a credential that fails (ii) is not yet in question.
     *
     *       (ii) counts an unsound item as WRONG while keeping it in the
     *       denominator, which is the treatment for a wrong ANSWER. The treatment
     *       for a wrong ITEM is to remove it from the scored set: the candidate is
     *       neither credited nor penalised for a question that should not have
     *       been asked. Reporting (ii) alone would present the harshest of two
     *       defensible models as the only one, and a single number has nothing to
     *       disagree with. */
    const delTotal = total - inA.length - inB.length;
    const delScored = scored - aRight - bRight;
    const delNeeded = delTotal > 0 ? Math.ceil((delTotal * pass) / 100) : 0;

    rows.push({
      cert: c.code, when: String(a.submitted_at).slice(0, 10), attempt: a.id,
      pass, total, needed, scored, recorded: a.correct_answers, passed: a.passed,
      tierA_presented: inA.length, tierA_right: aRight,
      tierB_presented: inB.length, tierB_right: bRight,
      credit_all: creditAll, credit_all_pass: creditAll >= needed,
      worst_case: worst, worst_case_pass: worst >= needed,
      deletion_scored: delScored, deletion_total: delTotal, deletion_needed: delNeeded,
      deletion_pass: delTotal > 0 && delScored >= delNeeded,
      items: [...inA, ...inB].map((p) => {
        const f = findingBy.get(p.question_id);
        const q = itemBy.get(p.question_id);
        return { tier: aFull.has(p.question_id) ? "A" : "B", n: f.n, id: f.id,
          answered: p.user_answer, key: q.correct_answer, correct: right(p), why: f.why };
      }).sort((x, y) => x.tier.localeCompare(y.tier) || x.n - y.n),
    });
  }

  if (problems.length) {
    console.error("RECOMPUTATION DISAGREES WITH THE RECORDED SCORE -- no scenario reported:");
    for (const p of problems) console.error("  " + p);
    process.exitCode = 2; process.exit();
  }

  console.log("TIER A / TIER B OUTCOME MEASUREMENT -- read-only");
  console.log("  Tier A items resolved   " + tierA.length + " of " + TIER_A.length);
  console.log("  Tier B items resolved   " + tierB.length + " of " + TIER_B.length);
  console.log("  attempts                " + rows.length);
  console.log("  recomputed score equals the recorded score on all " + rows.length + " attempts");
  console.log("");
  console.log("  date        cert      recorded      needed  A pres/right  B pres/right  credit-all   WORST CASE");
  for (const r of rows) {
    console.log("  " + r.when + "  " + r.cert.padEnd(9) +
      (String(r.scored) + "/" + r.total).padEnd(8) + (r.passed ? "pass  " : "FAIL  ") +
      String(r.needed).padStart(6) +
      ("      " + r.tierA_presented + "/" + r.tierA_right).padEnd(14) +
      ("  " + r.tierB_presented + "/" + r.tierB_right).padEnd(14) +
      (String(r.credit_all) + (r.credit_all_pass ? " pass" : " FAIL")).padEnd(13) +
      String(r.worst_case) + (r.worst_case_pass ? " pass" : " FAIL"));
  }

  console.log("");
  console.log("  the same attempts under DELETION -- flagged items removed from the scored set");
  console.log("  date        cert      deletion score   needed   verdict");
  for (const r of rows) {
    console.log("  " + r.when + "  " + r.cert.padEnd(9) +
      (String(r.deletion_scored) + "/" + r.deletion_total).padEnd(16) +
      String(r.deletion_needed).padStart(6) + "   " + (r.deletion_pass ? "pass" : "FAIL"));
  }

  const notSurviving = rows.filter((r) => r.passed && !r.worst_case_pass);
  console.log("");
  console.log("CREDENTIALS THAT DO NOT SURVIVE THE WORST CASE");
  if (!notSurviving.length) console.log("  none -- every credential issued stands on any reading of the findings");
  for (const r of notSurviving) {
    console.log("  " + r.cert + " " + r.when + "  worst case " + r.worst_case + "/" + r.total +
      " against " + r.needed + " needed   (short by " + (r.needed - r.worst_case) + ")");
    console.log("      under DELETION: " + r.deletion_scored + "/" + r.deletion_total +
      " against " + r.deletion_needed + " -> " + (r.deletion_pass ? "PASS" : "FAIL") +
      "   <- the other standard remedy");
  }
  const failBoth = rows.filter((r) => r.passed && !r.worst_case_pass && !r.deletion_pass);
  console.log("");
  console.log("  credentials failing BOTH the worst case and deletion: " + failBoth.length +
    (failBoth.length ? "" : "   <- none is in question on both models"));
  for (const r of failBoth) console.log("      " + r.cert + " " + r.when);

  const flipped = rows.filter((r) => !r.passed && r.credit_all_pass);
  console.log("");
  console.log("FAILURES THAT BECOME PASSES UNDER CREDIT-ALL");
  if (!flipped.length) console.log("  none");
  for (const r of flipped) {
    console.log("  " + r.cert + " " + r.when + "  " + r.scored + "/" + r.total + " -> " +
      r.credit_all + "/" + r.total + " = " + ((100 * r.credit_all) / r.total).toFixed(0) +
      "%, needed " + r.needed + "  (attempt " + r.attempt + ")");
    for (const it of r.items) {
      console.log("      tier " + it.tier + " #" + it.n + " " + it.id +
        "  answered " + JSON.stringify(it.answered) + "  key " + JSON.stringify(it.key) +
        "  " + (it.correct ? "correct" : "WRONG"));
    }
  }

  const path = join(ROOT, "TIER-A-OUTCOMES.json");
  writeFileSync(path, JSON.stringify({ tierA: tierA.map((t) => ({ n: t.n, id: t.id, full: t.full, cert: t.cert })),
    tierB: tierB.map((t) => ({ n: t.n, id: t.id, full: t.full, cert: t.cert })), attempts: rows }, null, 2) + "\n", "utf8");
  console.log("");
  console.log("wrote " + path);
} finally { release(); }
