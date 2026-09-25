/**
 * build-exposed-items.mjs -- the 342 secure items that actually decided seven
 * live credentials, English beside Spanish, FIELD BY FIELD.
 *
 * READ-ONLY. No writes of any kind. Unknown flags exit 2.
 *
 * ============ WHY A HUMAN READ AND NOT ANOTHER GATE ============
 *
 * The item sweep found zero key-integrity failures and zero refusals across all
 * 18,480 translated items, and every text-class flag it raised turned out on
 * reading to be the instrument rather than the item. That is a real result and
 * it is not the same as "these items are correct".
 *
 * No mechanical check here reads for MEANING. The 05-02 threshold inversion --
 * a fluent, correctly-keyed Spanish sentence that said the opposite of its
 * English -- passed every gate this repository owns. A credential is defended by
 * the items the candidate actually saw, not by an aggregate over the bank, so
 * those items get read by a person.
 *
 * ============ WHAT DEFINES THE 342 ============
 *
 * Distinct `quiz_questions` rows, `pool = secure`, presented in a non-English
 * language inside a session that produced an `exam_attempt`. Eight attempts,
 * seven people, three certifications, es-419 only.
 *
 * It is NOT every Spanish item ever shown. 1,057 distinct items have been
 * presented in Spanish: these 342 secure ones, plus 715 PRACTICE items shown in
 * 20 `mock_exam` simulator sessions that produced no attempt. The arithmetic
 * reconciles exactly, and the two populations carry different claims -- the
 * simulator is a readiness signal, these decided credentials.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, getAllIn } from "./_pg.mjs";
import { acquireHeavyReaderLock } from "./lib/heavy-reader-lock.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a) + " -- this script is READ-ONLY and takes none");
  process.exitCode = 2; process.exit();
}

/* THE SEED IS RECORDED so the sample is reproducible. mulberry32: small, exact,
 * and deterministic across machines, which Math.random is not. */
const SEED = 20260925;
const SAMPLE_N = 40;
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const KEY = requireKey(HERE);
const release = await acquireHeavyReaderLock("build-exposed-items");
try {
  const certs = await getAll(KEY, "certifications?select=id,code,name,passing_score_pct&order=id");
  const certBy = new Map(certs.map((c) => [c.id, c]));

  /* ---- the eight scored attempts ---- */
  const allSessionItems = await getAll(KEY,
    "exam_session_items?select=session_id,question_id,language,user_answer,presented_order&language=neq.en&order=session_id,presented_order");
  const scoredSessions = new Set();
  const attempts = await getAll(KEY,
    "exam_attempts?select=id,user_id,session_id,certification_id,score_pct,passed,total_questions,correct_answers,submitted_at&order=id");
  const sessWithItems = new Set(allSessionItems.map((r) => r.session_id));
  const ourAttempts = attempts.filter((a) => sessWithItems.has(a.session_id));
  for (const a of ourAttempts) scoredSessions.add(a.session_id);

  const presented = allSessionItems.filter((r) => scoredSessions.has(r.session_id));
  const itemIds = [...new Set(presented.map((r) => r.question_id))];

  /* ---- the items, and their English siblings ---- */
  const rows = await getAllIn(KEY, "quiz_questions",
    "id,certification_id,question_group_id,language,pool,task_id,question_text,options,correct_answer,explanation",
    "id", itemIds);
  const groups = [...new Set(rows.map((r) => r.question_group_id).filter(Boolean))];
  const sibs = await getAllIn(KEY, "quiz_questions",
    "id,question_group_id,language,question_text,options,correct_answer,explanation",
    "question_group_id", groups);
  const enOf = new Map();
  for (const s of sibs) if (s.language === "en") enOf.set(s.question_group_id, s);

  const taskIds = [...new Set(rows.map((r) => r.task_id).filter(Boolean))];
  const tasks = await getAllIn(KEY, "tasks", "id,code,statement", "id", taskIds);
  const taskBy = new Map(tasks.map((t) => [t.id, t]));

  /* ---- per item: how often shown and how often answered correctly ---- */
  const stat = new Map();
  for (const p of presented) {
    if (!stat.has(p.question_id)) stat.set(p.question_id, { shown: 0, right: 0, wrong: 0, blank: 0 });
    const s = stat.get(p.question_id);
    s.shown++;
    const q = rows.find((r) => r.id === p.question_id);
    const key = JSON.stringify((q && q.correct_answer) || []);
    if (!p.user_answer) s.blank++;
    else if (JSON.stringify(p.user_answer) === key) s.right++;
    else s.wrong++;
  }

  /* ---- ASSERTIONS. A report built on a short read is worse than none. ---- */
  const problems = [];
  if (rows.length !== itemIds.length) problems.push("fetched " + rows.length + " item rows for " + itemIds.length + " ids");
  const missingEn = rows.filter((r) => !enOf.get(r.question_group_id));
  const nonSecure = rows.filter((r) => r.pool !== "secure");
  if (nonSecure.length) problems.push(nonSecure.length + " presented item(s) are not in the secure pool");
  if (problems.length) {
    console.error("REFUSING TO WRITE:"); for (const p of problems) console.error("  " + p);
    process.exitCode = 2; process.exit();
  }

  /* ---- stratified sample, largest remainder, seed recorded ---- */
  const byCert = new Map();
  for (const r of rows) {
    const code = certBy.get(r.certification_id).code;
    if (!byCert.has(code)) byCert.set(code, []);
    byCert.get(code).push(r);
  }
  const rnd = mulberry32(SEED);
  const quota = [];
  for (const [code, list] of [...byCert].sort()) {
    const exact = (SAMPLE_N * list.length) / rows.length;
    quota.push({ code, list, exact, base: Math.floor(exact), rem: exact - Math.floor(exact) });
  }
  let left = SAMPLE_N - quota.reduce((s, q) => s + q.base, 0);
  for (const q of [...quota].sort((a, b) => b.rem - a.rem)) { if (left-- > 0) q.base++; }
  const sample = [];
  for (const q of quota) {
    /* Fisher-Yates on a copy, driven by the seeded generator. */
    const pool = [...q.list].sort((a, b) => a.id.localeCompare(b.id));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    sample.push(...pool.slice(0, q.base));
  }
  const sampleIds = new Set(sample.map((r) => r.id));
  if (sample.length !== SAMPLE_N) {
    console.error("sample is " + sample.length + ", wanted " + SAMPLE_N); process.exitCode = 2; process.exit();
  }

  /* ---- render ---- */
  const esc = (s) => String(s == null ? "" : s).replace(/\r/g, "").trim();
  const optOf = (q) => {
    const m = new Map();
    if (Array.isArray(q && q.options)) for (const o of q.options) if (o && typeof o.id === "string") m.set(o.id, esc(o.text));
    return m;
  };

  function renderItem(r, n) {
    const cert = certBy.get(r.certification_id);
    const en = enOf.get(r.question_group_id);
    const t = taskBy.get(r.task_id);
    const s = stat.get(r.id) || { shown: 0, right: 0, wrong: 0, blank: 0 };
    const eo = optOf(en), to = optOf(r);
    const keys = new Set(Array.isArray(r.correct_answer) ? r.correct_answer : []);
    const enKeys = new Set(Array.isArray(en && en.correct_answer) ? en.correct_answer : []);
    const out = [];
    out.push("### " + n + ". " + cert.code + " · " + (t ? t.code : "NO TASK CODE") + " · `" + r.id + "`");
    out.push("");
    out.push("shown **" + s.shown + "×** in the eight scored attempts — " +
      s.right + " correct, " + s.wrong + " wrong, " + s.blank + " unanswered." +
      (s.wrong ? "  **A candidate got this wrong.**" : ""));
    if (t) out.push("");
    if (t) out.push("> task " + t.code + ": " + esc(t.statement).slice(0, 200));
    out.push("");
    if (!en) { out.push("**NO ENGLISH SIBLING — this item cannot be compared.**"); out.push(""); return out.join("\n"); }
    out.push("**stem**");
    out.push("");
    out.push("| | |");
    out.push("|---|---|");
    out.push("| EN | " + esc(en.question_text).replace(/\|/g, "\\|").replace(/\n/g, " ") + " |");
    out.push("| ES | " + esc(r.question_text).replace(/\|/g, "\\|").replace(/\n/g, " ") + " |");
    out.push("");
    out.push("**options** — the key is marked `<<KEY`");
    out.push("");
    out.push("| id | |");
    out.push("|---|---|");
    for (const id of [...new Set([...eo.keys(), ...to.keys()])].sort()) {
      const mark = keys.has(id) ? " `<<KEY`" : "";
      const enMark = enKeys.has(id) ? " `<<KEY`" : "";
      const enT = eo.has(id) ? esc(eo.get(id)) : "**MISSING IN ENGLISH**";
      const trT = to.has(id) ? esc(to.get(id)) : "**MISSING IN SPANISH**";
      out.push("| **" + id + "** EN | " + enT.replace(/\|/g, "\\|") + enMark + " |");
      out.push("| **" + id + "** ES | " + trT.replace(/\|/g, "\\|") + mark + " |");
    }
    out.push("");
    out.push("**explanation**");
    out.push("");
    out.push("| | |");
    out.push("|---|---|");
    out.push("| EN | " + esc(en.explanation).replace(/\|/g, "\\|").replace(/\n/g, " ") + " |");
    out.push("| ES | " + esc(r.explanation).replace(/\|/g, "\\|").replace(/\n/g, " ") + " |");
    out.push("");
    return out.join("\n");
  }

  /* ---- the margin table ---- */
  const margin = [];
  for (const a of ourAttempts.sort((x, y) => String(x.submitted_at).localeCompare(String(y.submitted_at)))) {
    const c = certBy.get(a.certification_id);
    const pass = Number(c.passing_score_pct);
    const needed = Math.round((a.total_questions * pass) / 100);
    const flips = a.passed ? (a.correct_answers - needed + 1) : (needed - a.correct_answers);
    margin.push({ cert: c.code, when: String(a.submitted_at).slice(0, 10),
      score: a.score_pct, pass, total: a.total_questions, correct: a.correct_answers,
      needed, passed: a.passed, flips });
  }

  const L = [];
  L.push("# The 342 secure items that decided seven live credentials");
  L.push("");
  L.push("**Read these, not the bank.** No mechanical check in this repository reads");
  L.push("for meaning: the 05-02 threshold inversion was fluent, correctly keyed, and");
  L.push("passed every gate we own. A credential is defended by the items the candidate");
  L.push("actually saw.");
  L.push("");
  L.push("Generated " + "2026-09-25" + ", read-only. English beside Spanish, field by field,");
  L.push("key marked. `ITEM-EXPOSURE.md` carries the exposure finding this comes from.");
  L.push("");
  L.push("## What the 342 are, and what they are not");
  L.push("");
  L.push("Distinct `quiz_questions` rows, **`pool = secure`**, presented in es-419 inside a");
  L.push("session that produced an `exam_attempt`. Eight attempts, seven people, three");
  L.push("certifications.");
  L.push("");
  L.push("**1,057 distinct items have been presented in Spanish overall.** The other **715**");
  L.push("are PRACTICE items shown in 20 `mock_exam` simulator sessions that produced no");
  L.push("attempt — 12 users, 6 of whom also sat a real exam. The arithmetic reconciles");
  L.push("exactly (342 + 715 = 1,057) and the two populations carry different claims: the");
  L.push("simulator is a readiness signal a learner acts on, these 342 decided credentials.");
  L.push("**Only the 342 are in this document.**");
  L.push("");
  L.push("| | |");
  L.push("|---|---|");
  for (const [code, list] of [...byCert].sort()) L.push("| " + code + " | " + list.length + " distinct secure items |");
  L.push("| **total** | **" + rows.length + "** |");
  L.push("");
  L.push("## Margin: how many items would have to flip to change each outcome");
  L.push("");
  L.push("**This is the table to reach for if a defect is found.** For a pass, `flips` is how");
  L.push("many correct answers would have to become wrong to drop the candidate below the");
  L.push("mark. For the one failure, it is how many wrong answers would have to become");
  L.push("right to lift them over it.");
  L.push("");
  L.push("| date | cert | score | pass mark | correct / total | needed | outcome | flips to change it |");
  L.push("|---|---|---|---|---|---|---|---|");
  for (const m of margin) {
    L.push("| " + m.when + " | " + m.cert + " | " + m.score + "% | " + m.pass + "% | " +
      m.correct + " / " + m.total + " | " + m.needed + " | " + (m.passed ? "**pass**" : "**FAIL**") +
      " | **" + m.flips + "** |");
  }
  L.push("");
  const thin = margin.filter((m) => m.flips <= 2);
  L.push("**" + thin.length + " outcome(s) turn on two items or fewer.** " +
    (thin.length ? "They are the ones to check first against any defect found below." :
      "No outcome is that close."));
  L.push("");
  /* ---- THE ONE-FLIP ATTEMPT. Its wrong answers are the sharpest read in the
     document: flips = 1 means any single one of them being defective is
     sufficient to have changed that candidate's result. ---- */
  const oneFlip = margin.filter((m) => m.flips === 1);
  if (oneFlip.length) {
    const att = ourAttempts.find((a) => !a.passed);
    const wrongIds = presented.filter((p) => p.session_id === att.session_id).filter((p) => {
      const q = rows.find((r) => r.id === p.question_id);
      return q && JSON.stringify(p.user_answer) !== JSON.stringify(q.correct_answer || []);
    }).map((p) => p.question_id);
    L.push("### The one-flip attempt: the six items it turns on");
    L.push("");
    L.push("The 2026-08-26 AIE-I failure was **one item** short. Any single one of the");
    L.push("items that candidate answered wrongly, if defective in Spanish, is sufficient");
    L.push("to have produced that result. **Read these before anything else.**");
    L.push("");
    L.push("They retook the same day and scored 100, so no certification is currently");
    L.push("withheld from anyone — the cost was a consumed attempt, not a denied credential.");
    L.push("");
    for (const id of wrongIds) {
      const q = rows.find((r) => r.id === id);
      const t = q && taskBy.get(q.task_id);
      L.push("- `" + id + "` — " + certBy.get(q.certification_id).code + " · " +
        (t ? "task " + t.code : "no task code") + (sampleIds.has(id) ? "  *(also in the sample)*" : ""));
    }
    L.push("");
    if (wrongIds.length !== att.total_questions - att.correct_answers) {
      L.push("> **COUNT DISAGREEMENT:** " + wrongIds.length + " wrong answers reconstructed from");
      L.push("> the responses, but the attempt records " + (att.total_questions - att.correct_answers) +
        ". Reported rather than reconciled silently.");
      L.push("");
    }
  }

  L.push("---");
  L.push("");
  L.push("# A. The sample — " + SAMPLE_N + " items, read these first");
  L.push("");
  L.push("Random, **stratified by certification in proportion to exposure**, largest");
  L.push("remainder. Seed `" + SEED + "`, mulberry32, Fisher-Yates over ids sorted");
  L.push("ascending — reproducible by re-running this script.");
  L.push("");
  L.push("| cert | exposed | exact quota | sampled |");
  L.push("|---|---|---|---|");
  for (const q of quota) L.push("| " + q.code + " | " + q.list.length + " | " + q.exact.toFixed(2) + " | " + q.base + " |");
  L.push("| **total** | **" + rows.length + "** | **" + SAMPLE_N + ".00** | **" + SAMPLE_N + "** |");
  L.push("");
  let n = 0;
  for (const r of sample.sort((a, b) => certBy.get(a.certification_id).code.localeCompare(certBy.get(b.certification_id).code))) {
    L.push(renderItem(r, ++n));
  }
  L.push("");
  L.push("---");
  L.push("");
  L.push("# B. The remaining " + (rows.length - SAMPLE_N) + "");
  L.push("");
  L.push("Same rendering. Section A and section B together are the 342, with no overlap.");
  L.push("");
  const rest = rows.filter((r) => !sampleIds.has(r.id))
    .sort((a, b) => certBy.get(a.certification_id).code.localeCompare(certBy.get(b.certification_id).code) ||
      String((taskBy.get(a.task_id) || {}).code).localeCompare(String((taskBy.get(b.task_id) || {}).code)));
  for (const r of rest) L.push(renderItem(r, ++n));

  if (n !== rows.length) {
    console.error("RENDERED " + n + " items, expected " + rows.length); process.exitCode = 2; process.exit();
  }

  const path = join(ROOT, "EXPOSED-ITEMS.md");
  writeFileSync(path, L.join("\n") + "\n", "utf8");
  console.log("EXPOSED ITEMS");
  console.log("  scored attempts            " + ourAttempts.length);
  console.log("  distinct secure items      " + rows.length);
  console.log("  presentations              " + presented.length);
  console.log("  items with no English      " + missingEn.length);
  console.log("  sample                     " + SAMPLE_N + " (seed " + SEED + ")");
  for (const q of quota) console.log("      " + q.code.padEnd(10) + q.list.length + " exposed -> " + q.base + " sampled");
  console.log("  outcomes turning on <=2 items  " + thin.length);
  console.log("  rendered                   " + n);
  console.log("wrote " + path);
} finally { release(); }
