/**
 * measure-practice-quality.mjs -- how wrong are the AUTHORED practice items learners see today?
 *
 * READ-ONLY on the bank. Spends on the solver, so --max-usd is REQUIRED. Ruled PROMPT-142 s5.
 *
 *   --cert <CODE>      required
 *   --n=40             sample size (stratified across domains in proportion to their counts)
 *   --max-usd=<n>      REQUIRED ceiling
 *   --out=<file>       the artifact
 *
 * ============ WHAT IT MEASURES, AND WHAT IT CANNOT ============
 *
 * The blind solver gets the item and the task's MAPPED PASSAGES, never the key, the explanation or
 * any grounding. It runs TWICE: once in stored option order, once with the options rotated, because a
 * solver that agrees only in one order agreed with the POSITION and not the content.
 *
 * A disagreement is EVIDENCE, NOT A VERDICT. These items were authored by a person against a task
 * statement, and the solver is one reader; "the solver picked another option" means an SME should
 * look, not that the item is wrong. What the rate is for is deciding how urgent a rebuild is.
 *
 * The sample is DETERMINISTIC -- a fixed stride over id order -- so a second run measures the same
 * items and the numbers are comparable.
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { blindPayload, assertBlind, SOLVER_SYSTEM, SOLVER_SYSTEM_PRACTICE, solverUser,
  solverUserNoPassages, solverVerdict } from "./lib/blind-solver.mjs";
import { normClause } from "./lib/grounded-gates.mjs";   /* gateClauseExists is not used: it answers per (source, edition), and this check accepts an address held by ANY source */

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let CERT = null, N = 40, MAX_USD = null, OUT = null, CLAUSES_ONLY = false, m;
let POOL = "practice", SOLVER = "claude-opus-5", ONLY = null, CLASSES = null;
for (const a of process.argv.slice(2)) {
  if ((m = /^--cert=(.+)$/.exec(a))) { CERT = m[1]; continue; }
  if ((m = /^--n=(\d+)$/.exec(a))) { N = Number(m[1]); continue; }
  if ((m = /^--max-usd=([\d.]+)$/.exec(a))) { MAX_USD = Number(m[1]); continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  /* --pool: which half of the bank. The exam pool is `secure`; the default stays `practice` so no
   * existing invocation changes meaning. */
  if ((m = /^--pool=(secure|practice)$/.exec(a))) { POOL = m[1]; continue; }
  if ((m = /^--solver-model=(.+)$/.exec(a))) { SOLVER = m[1]; continue; }
  /* --only=<file>: a JSON array of 8-char item ids, or a comma list. Pass 2 re-solves ONLY what pass
   * 1 flagged, on a stronger model, so the cheap solver's flags are confirmed rather than trusted. */
  if ((m = /^--only=(.+)$/.exec(a))) {
    const v = m[1];
    ONLY = new Set(existsSync(v)
      ? JSON.parse(readFileSync(v, "utf8"))
      : v.split(",").map((s) => s.trim()).filter(Boolean));
    continue;
  }
  /* --classes=<file>: TASK-GROUNDING-CLASSES.json. With it, an item whose task is classed
   * `scrum-guide` or `ebm` is solved AGAINST THOSE PASSAGES and everything else is solved against
   * accepted practice with no passages at all (ruled PROMPT-145 s2). */
  if ((m = /^--classes=(.+)$/.exec(a))) { CLASSES = m[1]; continue; }
  /* --clauses-only runs the FREE half over the whole sample and makes no model call. It is a flag
   * rather than --max-usd=0 on purpose: in gen-grounded-items `--max-usd=0` means NO CEILING, and
   * borrowing that spelling for "spend nothing" would be the opposite of what the other script does. */
  if (a === "--clauses-only") { CLAUSES_ONLY = true; continue; }
  console.error("measure-practice-quality: unrecognised flag " + a);
  console.error("  --cert=<CODE> --n=40 --max-usd=<n> [--out=<file>] [--pool=secure|practice]");
  console.error("  [--solver-model=<model>] [--only=<ids.json|a,b>] [--classes=<file>] [--clauses-only]");
  console.error("  READ-ONLY on the bank.");
  process.exitCode = 2; process.exit();
}
if (!CERT) { console.error("--cert is required"); process.exit(2); }
if (MAX_USD == null && !CLAUSES_ONLY) {
  console.error("--max-usd is REQUIRED on every run that calls a model (CLAUDE.md, PROMPT-117 s3).");
  process.exit(2);
}
OUT = OUT || (CERT.replace(/[^A-Za-z0-9-]/g, "") + "-PRACTICE-QUALITY.json");

const MODEL = SOLVER;
/* one price per model, so the ceiling means the same thing whichever solver runs */
const PRICES = {
  "claude-opus-5": { input: 15, output: 75 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
};
const PRICE = PRICES[MODEL];
if (!PRICE) {
  console.error("no price declared for solver model " + MODEL + ". A run whose cost cannot be");
  console.error("computed cannot honour --max-usd, so it is refused rather than run uncapped.");
  process.exit(2);
}
const KEY = requireKey(HERE);
/* the key lives in scripts/.env, not the environment -- same reader as gen-grounded-items */
function env(k) {
  const p = join(HERE, ".env");
  if (existsSync(p)) {
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const mm = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (mm && mm[1] === k && !process.env[k]) return mm[2].replace(/^["']|["']$/g, "").trim();
    }
  }
  return process.env[k];
}
const AK = env("ANTHROPIC_API_KEY");
if (!AK) { console.error("ANTHROPIC_API_KEY not found (scripts/.env or env)"); process.exit(2); }
let inTok = 0, outTok = 0, calls = 0;
const usd = () => (inTok / 1e6) * PRICE.input + (outTok / 1e6) * PRICE.output;

async function claude(system, user, maxTokens = 1500) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": AK, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system,
      messages: [{ role: "user", content: user }] }),
  });
  if (!r.ok) throw new Error("HTTP " + r.status + " " + (await r.text()).slice(0, 200));
  const j = await r.json();
  calls++;
  inTok += j.usage?.input_tokens || 0;
  outTok += j.usage?.output_tokens || 0;
  return (j.content || []).map((c) => c.text || "").join("");
}
const parseObj = (s) => {
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b < a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; }
};

/* ---- the bank ---- */
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }
const doms = (await getAll(KEY, "domains?select=id,code,certification_id&order=id"))
  .filter((d) => d.certification_id === cert.id);
const domIds = new Set(doms.map((d) => d.id));
const tasks = (await getAll(KEY, "tasks?select=id,code,domain_id&order=id")).filter((t) => domIds.has(t.domain_id));
const domOf = new Map(tasks.map((t) => [t.id, (doms.find((d) => d.id === t.domain_id) || {}).code]));
const qs = await getAll(KEY, "quiz_questions?select=id,task_id,question_text,options,correct_answer," +
  "explanation,pool,status,retired_at,item_origin,language&certification_id=eq." + cert.id +
  "&language=eq.en&pool=eq." + POOL + "&order=id");
/* ORIGIN IS NOT FILTERED FOR THE SECURE POOL. The practice measurement was about the AUTHORED items
 * a learner sees; an exam pool is judged as served, whatever wrote each row. */
const live = qs.filter((q) => q.retired_at === null && q.status === "approved" &&
  (POOL === "practice" ? q.item_origin === "authored" : true));

/* ---- the library and the task map, for the passages and the clause gate ---- */
const ps = await getAll(KEY, "source_passages?select=id,source_id,edition,clause,title,text,normative&order=id");
const byId = new Map(ps.map((p) => [p.id, p]));
const ts = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id,passage_id");
const mapOf = new Map();
for (const r of ts) {
  if (!mapOf.has(r.task_id)) mapOf.set(r.task_id, []);
  const p = byId.get(r.passage_id);
  if (p) mapOf.get(r.task_id).push({ ...p, role: r.role });
}

/* ---- stratified, deterministic sample ---- */
const byDom = new Map();
for (const q of live) {
  const d = domOf.get(q.task_id) || "?";
  if (!byDom.has(d)) byDom.set(d, []);
  byDom.get(d).push(q);
}
const total = live.length;
const want = new Map();
let assigned = 0;
const order = [...byDom.keys()].sort();
for (const d of order) {
  const k = Math.round(N * byDom.get(d).length / total);
  want.set(d, k); assigned += k;
}
/* fix rounding against the largest domain so the sample is exactly N */
if (assigned !== N) {
  const big = order.sort((a, b) => byDom.get(b).length - byDom.get(a).length)[0];
  want.set(big, want.get(big) + (N - assigned));
}
let sample = [];
for (const d of [...want.keys()].sort()) {
  const pool = byDom.get(d);
  const k = want.get(d);
  const stride = Math.max(1, Math.floor(pool.length / k));
  for (let i = 0, n = 0; i < pool.length && n < k; i += stride, n++) sample.push(pool[i]);
}
/* ---- the grounding class per task, and the Guide passages the classed items are solved against ---- */
const classOfTask = new Map();
if (CLASSES) {
  const G = JSON.parse(readFileSync(join(ROOT, CLASSES), "utf8"));
  for (const rows of Object.values(G.by_cert || {})) {
    for (const r of rows) classOfTask.set(String(r.code), r.class);
  }
}
/* THE WHOLE GUIDE, because Scrum has no task_sources yet. 26 passages is ~4,000 words, which is
 * cheaper than it looks and avoids pretending to a mapping that does not exist. */
const guideFor = (cls) => cls === "scrum-guide"
  ? ps.filter((p) => p.source_id === "Scrum Guide")
  : cls === "ebm" ? ps.filter((p) => p.source_id === "EBM Guide") : [];

/* --only: pass 2 re-solves just the flagged ids, on a stronger model */
if (ONLY) {
  const before = sample.length;
  sample = sample.filter((q) => ONLY.has(q.id.slice(0, 8)));
  console.log("  --only: " + sample.length + " of " + before + " sampled item(s) re-solved");
}
console.log((POOL === "secure" ? "EXAM POOL QUALITY   " : "PRACTICE QUALITY   ") + CERT +
  "   READ-ONLY on the bank");
console.log("  live approved " + POOL + " items, en: " + total +
  (POOL === "practice" ? " (authored only)" : " (any origin)"));
console.log("  sample " + sample.length + " of " + N + " requested, by domain: " +
  [...want.keys()].sort().map((d) => d + "=" + want.get(d)).join(" "));
console.log("  solver " + MODEL + ", two runs per item (stored order, then rotated)   ceiling $" + MAX_USD);
console.log("");

/* ============ WHAT COUNTS AS A CITED CLAUSE, AND WHAT COUNTS AS MISSING ============
 *
 * PROMPT-142 s5's first pass reported 15 of 15 items citing a missing clause, and every one was an
 * artefact: it matched a BARE DIGIT after "section", and it checked each address against the task's
 * FIRST mapped source only, so a real 42001 clause failed against 19011. Both are fixed here.
 *
 *   - an address needs a DOT (4.3, 9.2.1) or an Annex letter (A.6.2). "section 5" is a document
 *     section, not a clause address, and is not checked.
 *   - an address is held if ANY source in the library holds it, so no answer depends on guessing
 *     which standard the item meant.
 *   - a CONTAINER is reported separately, never as missing: 42001 9.2 has no row of its own while
 *     9.2.1 and 9.2.2 do (CLAUDE.md s13). Citing the heading is not citing something that does not
 *     exist, and folding the two together is what made the first pass read 15.
 */
const CITE = /\b(?:clause|clauses|section|annex)\s+((?:[A-Z]\.)?\d+(?:\.\d+)+|[A-Z]\.\d+(?:\.\d+)*)\b/gi;
const CLAUSES_ANYWHERE = new Set(ps.map((p) => String(p.clause)));
function clauseCheck(rec, q, opts) {
  const hay = [q.question_text, ...(opts || []).map((x) => x && x.text), q.explanation]
    .filter(Boolean).join("  ");
  const cited = new Set();
  for (const mm of hay.matchAll(CITE)) {
    const c = normClause(mm[1]);
    if (c) cited.add(c);
  }
  rec.cited_clauses = [...cited];
  for (const c of cited) {
    if (CLAUSES_ANYWHERE.has(c)) continue;
    /* held as a container? then its children exist and the heading simply has no row */
    const isContainer = [...CLAUSES_ANYWHERE].some((x) => x.startsWith(c + "."));
    if (isContainer) rec.container_citations.push(c);
    else rec.clause_problems.push({ clause: c, why: "no source in the library holds this address" });
  }
}

const rotate = (opts) => opts.slice(1).concat(opts.slice(0, 1));
const results = [];
let stopped = false;
for (const q of sample) {
  /* THE CLAUSE CHECK IS FREE, SO THE CEILING MUST NOT TRUNCATE IT. Only the solver costs money; a
   * budget that stops both leaves the cheap measurement partial for no reason. */
  const solverBudgetLeft = !CLAUSES_ONLY && usd() < MAX_USD;
  if (!solverBudgetLeft) stopped = true;
  const code = tasks.find((t) => t.id === q.task_id);
  const opts = Array.isArray(q.options) ? q.options : JSON.parse(q.options || "[]");
  /* the stored key: authored items use correct_answer (a label) or is_correct */
  let keyIdx = opts.findIndex((o) => o && o.is_correct);
  if (keyIdx < 0) {
    const ca = Array.isArray(q.correct_answer) ? q.correct_answer[0] : q.correct_answer;
    keyIdx = opts.findIndex((o, i) => (o && o.id === ca) || String.fromCharCode(97 + i) === String(ca).toLowerCase());
  }
  /* ============ WHAT THIS ITEM IS JUDGED AGAINST (ruled PROMPT-145 s2) ============
   *
   * With --classes, a task classed `scrum-guide` or `ebm` is solved AGAINST THAT GUIDE and everything
   * else -- agile-general, ai-held, none -- is solved against accepted professional practice with no
   * passages at all. Without --classes the old behaviour stands: the task's own mapped passages. */
  const cls = code ? (classOfTask.get(String(code.code)) || null) : null;
  const passages = CLASSES ? guideFor(cls) : (mapOf.get(q.task_id) || []);
  const byPractice = CLASSES && passages.length === 0;
  const rec = { item: q.id.slice(0, 8), task: code ? code.code : "?", domain: domOf.get(q.task_id) || "?",
    grounding_class: cls, judged_against: byPractice ? "accepted practice (no passages)"
      : (passages.length ? (passages[0].source_id + " (" + passages.length + " passages)") : "no passages"),
    key_index: keyIdx, passages: passages.length, runs: [], clause_problems: [], container_citations: [] };

  for (const pass of solverBudgetLeft ? [0, 1] : []) {
    const o = pass === 0 ? opts : rotate(opts);
    const payload = blindPayload({ question_text: q.question_text, options: o });
    /* the blindness is ASSERTED, not assumed -- the same guard the grounded path uses */
    try {
      assertBlind(payload, { question_text: q.question_text, options: o,
        explanation: q.explanation, key_support: "" });
    } catch (e) {
      rec.runs.push({ pass, state: "could-not-run", reason: "blindness assertion: " + e.message });
      continue;
    }
    const keyLabel = String.fromCharCode(65 + (pass === 0 ? keyIdx : (keyIdx - 1 + o.length) % o.length));
    let txt;
    try {
      txt = byPractice
        ? await claude(SOLVER_SYSTEM_PRACTICE, solverUserNoPassages(payload))
        : await claude(SOLVER_SYSTEM, solverUser(payload, passages));
    }
    catch (e) { rec.runs.push({ pass, state: "could-not-run", reason: String(e.message).slice(0, 120) }); continue; }
    const parsed = parseObj(txt);
    const v = solverVerdict(parsed, keyLabel);
    /* ============ THE CAUSE IS READ FROM THE RESPONSE'S FIELDS, NOT ITS PROSE ============
     *
     * PROMPT-142 s5 classified by regex over `v.reason` and had to withdraw the result: the pattern
     * fired on ACCEPTED runs too, because an accepted run's reason says "no second defensible option".
     * The parsed response carries `answer`, `settled_by_passages` and `second_defensible` as fields,
     * so the cause is a fact about the answer rather than a guess about a sentence.
     *
     * AND THE PROSE IS NOT PERSISTED. `answer_reason` is the solver explaining itself after being
     * handed the passages, so it quotes them -- check-licensed-text caught 11 runs of ISO 19011 5.1
     * in the first artifact. Only labels are kept. */
    const ans = parsed ? String(parsed.answer || "").trim().toUpperCase().slice(0, 1) : null;
    const sec = parsed && parsed.second_defensible != null
      ? String(parsed.second_defensible).trim().toUpperCase().slice(0, 1) : null;
    const settled = parsed ? parsed.settled_by_passages !== false : null;
    rec.runs.push({ pass, key_label: keyLabel, state: v.state,
      answered: ans, second_defensible: sec && /^[A-Z]$/.test(sec) && sec !== keyLabel ? sec : null,
      settled_by_passages: settled,
      cause: v.state === "could-not-run" ? "could not run"
        : ans !== keyLabel ? "picked a different option"
          : settled === false ? "said the passages do not settle it"
            : (sec && /^[A-Z]$/.test(sec) && sec !== keyLabel) ? "named a second defensible option"
              : "agreed with the stored key" });
  }

  clauseCheck(rec, q, opts);
  results.push(rec);
  const r0 = rec.runs[0] || {}, r1 = rec.runs[1] || {};
  console.log("  " + rec.item + "  " + rec.task.padEnd(5) + rec.domain.padEnd(4) +
    "  run1 " + String(r0.state || "?").padEnd(14) + "  run2 " + String(r1.state || "?").padEnd(14) +
    (rec.clause_problems.length ? "  BAD CLAUSE " + rec.clause_problems.map((c) => c.clause).join(",") : ""));
}

/* ---- the summary. Solved items only for the solver rows; every sampled item for the clause rows. ---- */
const solved = results.filter((r) => r.runs.length === 2);
const agreeBoth = solved.filter((r) => r.runs.every((x) => x.state === "accepted"));
const orderOnly = solved.filter((r) => r.runs.filter((x) => x.state === "accepted").length === 1);
/* THE CAUSES ARE EXCLUSIVE AND READ OFF THE RESPONSE'S FIELDS, so they add up. An item is counted by
 * the FIRST cause that applies across its two runs, worst first: a different answer outranks a
 * second-defensible remark, which outranks agreement. */
const causeOf = (r) => {
  const c = r.runs.map((x) => x.cause);
  if (c.includes("could not run")) return "could not run";
  if (c.includes("picked a different option")) return "picked a different option";
  if (c.includes("said the passages do not settle it")) return "passages do not settle it";
  if (c.includes("named a second defensible option")) return "named a second defensible option";
  return "agreed with the stored key";
};
const byCause = {};
for (const r of solved) byCause[causeOf(r)] = (byCause[causeOf(r)] || 0) + 1;
const disagree = solved.filter((r) => causeOf(r) === "picked a different option");
const secondDef = solved.filter((r) => causeOf(r) === "named a second defensible option");
const notSettled = solved.filter((r) => causeOf(r) === "passages do not settle it");
const couldNot = solved.filter((r) => causeOf(r) === "could not run");
const badClause = results.filter((r) => r.clause_problems.length);
const containerCite = results.filter((r) => r.container_citations.length);

const pct = (n, d) => (d ? Math.round((n / d) * 100) + "%" : "n/a");
console.log("");
console.log("SUMMARY   sampled " + results.length + ", SOLVED " + solved.length +
  (stopped ? "   SOLVER STOPPED at the $" + MAX_USD + " ceiling" : ""));
console.log("  --- the solver, over the " + solved.length + " solved ---");
console.log("  agrees in BOTH orders               " + agreeBoth.length + "   " + pct(agreeBoth.length, solved.length));
console.log("  picked a DIFFERENT option           " + disagree.length + "   " + pct(disagree.length, solved.length));
console.log("  named a SECOND DEFENSIBLE option    " + secondDef.length + "   " + pct(secondDef.length, solved.length));
console.log("  passages do not settle it           " + notSettled.length);
console.log("  could not run                       " + couldNot.length);
console.log("  agrees in ONE order only            " + orderOnly.length + "   (agreed with the POSITION, not the content)");
console.log("  ERROR RATE (anything but agreement) " +
  (solved.length - agreeBoth.length) + " of " + solved.length + "   " +
  pct(solved.length - agreeBoth.length, solved.length));
console.log("  --- the clause check, over all " + results.length + " sampled (free) ---");
console.log("  cites an address NO source holds    " + badClause.length);
console.log("  cites a CONTAINER heading           " + containerCite.length + "   (children held, heading has no row)");
console.log("  spend $" + usd().toFixed(4) + " over " + calls + " call(s)");

writeFileSync(join(ROOT, OUT), JSON.stringify({
  _what: CERT + " authored practice quality. READ-ONLY: nothing in the bank was changed. A solver " +
    "disagreement is EVIDENCE for an SME, not a verdict on the item.",
  cert: CERT, ruled_in: "PROMPT-142 s5, extended to all four certifications by PROMPT-142a",
  model: MODEL,
  population: total, sampled: results.length, solved: solved.length,
  by_domain: Object.fromEntries(want),
  summary: {
    solver: { over: solved.length, agree_both_orders: agreeBoth.length,
      agree_one_order_only: orderOnly.length, picked_different: disagree.length,
      second_defensible: secondDef.length, passages_do_not_settle: notSettled.length,
      could_not_run: couldNot.length,
      error_rate: pct(solved.length - agreeBoth.length, solved.length),
      by_cause: byCause },
    clauses: { over: results.length, address_no_source_holds: badClause.length,
      container_heading: containerCite.length },
  },
  spend: { usd: Number(usd().toFixed(4)), calls, model: MODEL },
  solver_stopped_at_ceiling: stopped,
  items: results,
}, null, 1) + "\n");
console.log("  wrote " + OUT);
