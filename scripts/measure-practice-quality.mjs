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
import { blindPayload, assertBlind, SOLVER_SYSTEM, solverUser, solverVerdict } from "./lib/blind-solver.mjs";
import { gateClauseExists, normClause } from "./lib/grounded-gates.mjs";
import { passageKey } from "./lib/passage-key.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let CERT = null, N = 40, MAX_USD = null, OUT = null, m;
for (const a of process.argv.slice(2)) {
  if ((m = /^--cert=(.+)$/.exec(a))) { CERT = m[1]; continue; }
  if ((m = /^--n=(\d+)$/.exec(a))) { N = Number(m[1]); continue; }
  if ((m = /^--max-usd=([\d.]+)$/.exec(a))) { MAX_USD = Number(m[1]); continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  console.error("measure-practice-quality: unrecognised flag " + a);
  console.error("  --cert=<CODE> --n=40 --max-usd=<n> [--out=<file>]   READ-ONLY on the bank");
  process.exitCode = 2; process.exit();
}
if (!CERT) { console.error("--cert is required"); process.exit(2); }
if (MAX_USD == null) {
  console.error("--max-usd is REQUIRED on every run that calls a model (CLAUDE.md, PROMPT-117 s3).");
  process.exit(2);
}
OUT = OUT || (CERT.replace(/[^A-Za-z0-9-]/g, "") + "-PRACTICE-QUALITY.json");

const MODEL = "claude-opus-5";
const PRICE = { input: 15, output: 75 };
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
  "&language=eq.en&pool=eq.practice&order=id");
const live = qs.filter((q) => q.retired_at === null && q.status === "approved" && q.item_origin === "authored");

/* ---- the library and the task map, for the passages and the clause gate ---- */
const ps = await getAll(KEY, "source_passages?select=id,source_id,edition,clause,title,text,normative&order=id");
const byId = new Map(ps.map((p) => [p.id, p]));
const passagesByKey = new Map();
for (const p of ps) passagesByKey.set(passageKey(p.source_id, p.edition, p.clause), p);
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
const sample = [];
for (const d of [...want.keys()].sort()) {
  const pool = byDom.get(d);
  const k = want.get(d);
  const stride = Math.max(1, Math.floor(pool.length / k));
  for (let i = 0, n = 0; i < pool.length && n < k; i += stride, n++) sample.push(pool[i]);
}
console.log("PRACTICE QUALITY   " + CERT + "   READ-ONLY on the bank");
console.log("  authored practice items, en, live: " + total);
console.log("  sample " + sample.length + " of " + N + " requested, by domain: " +
  [...want.keys()].sort().map((d) => d + "=" + want.get(d)).join(" "));
console.log("  solver " + MODEL + ", two runs per item (stored order, then rotated)   ceiling $" + MAX_USD);
console.log("");

const rotate = (opts) => opts.slice(1).concat(opts.slice(0, 1));
const results = [];
let stopped = false;
for (const q of sample) {
  if (usd() >= MAX_USD) { stopped = true; break; }
  const code = tasks.find((t) => t.id === q.task_id);
  const opts = Array.isArray(q.options) ? q.options : JSON.parse(q.options || "[]");
  /* the stored key: authored items use correct_answer (a label) or is_correct */
  let keyIdx = opts.findIndex((o) => o && o.is_correct);
  if (keyIdx < 0) {
    const ca = Array.isArray(q.correct_answer) ? q.correct_answer[0] : q.correct_answer;
    keyIdx = opts.findIndex((o, i) => (o && o.id === ca) || String.fromCharCode(97 + i) === String(ca).toLowerCase());
  }
  const passages = (mapOf.get(q.task_id) || []);
  const rec = { item: q.id.slice(0, 8), task: code ? code.code : "?", domain: domOf.get(q.task_id) || "?",
    key_index: keyIdx, passages: passages.length, runs: [], clause_problems: [] };

  for (const pass of [0, 1]) {
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
    try { txt = await claude(SOLVER_SYSTEM, solverUser(payload, passages)); }
    catch (e) { rec.runs.push({ pass, state: "could-not-run", reason: String(e.message).slice(0, 120) }); continue; }
    const v = solverVerdict(parseObj(txt), keyLabel);
    /* ============ THE SOLVER'S PROSE IS NOT PERSISTED (PROMPT-142 s5) ============
     *
     * `reason` is the solver explaining itself, and it was given the passages -- so it QUOTES them.
     * check-licensed-text caught 11 runs of ISO 19011 5.1 in the first artifact. The verdict is kept;
     * the prose is classified into a fixed label and thrown away. */
    const why = String(v.reason || "");
    rec.runs.push({ pass, key_label: keyLabel, state: v.state, picked: v.picked || null,
      classification: /second|defensible|ambiguous/i.test(why) ? "named a second defensible option"
        : /picked|another|different/i.test(why) ? "picked a different option"
          : /not settle|insufficient|cannot/i.test(why) ? "said the passages do not settle it"
            : v.state === "accepted" ? "agreed with the stored key" : "other" });
  }

  /* ---- the clause gate on anything the item cites ---- */
  const cited = new Set();
  const hay = [q.question_text, ...(opts || []).map((x) => x && x.text), q.explanation].filter(Boolean).join(" ");
  for (const mm of hay.matchAll(/\b(?:clause|section|annex)\s+([A-Z]?\.?\d+(?:\.\d+)*)/gi)) {
    const c = normClause(mm[1]);
    if (c) cited.add(c);
  }
  for (const c of cited) {
    const g = gateClauseExists({ key_support_clause: c, source_id: (passages[0] || {}).source_id,
      edition: (passages[0] || {}).edition }, passagesByKey, [], [], null);
    if (g && g.pass === false) rec.clause_problems.push({ clause: c, why: String(g.reason || "").slice(0, 100) });
  }
  rec.cited_clauses = [...cited];
  results.push(rec);
  const r0 = rec.runs[0] || {}, r1 = rec.runs[1] || {};
  console.log("  " + rec.item + "  " + rec.task.padEnd(5) + rec.domain.padEnd(4) +
    "  run1 " + String(r0.state || "?").padEnd(14) + "  run2 " + String(r1.state || "?").padEnd(14) +
    (rec.clause_problems.length ? "  BAD CLAUSE " + rec.clause_problems.map((c) => c.clause).join(",") : ""));
}

/* ---- the summary ---- */
const agreeBoth = results.filter((r) => r.runs.length === 2 && r.runs.every((x) => x.state === "accepted"));
const disagree = results.filter((r) => r.runs.some((x) => x.state === "rejected" &&
  /picked a different option/i.test(String(x.classification || ""))));
const secondDef = results.filter((r) => r.runs.some((x) => /second defensible/i.test(String(x.classification || ""))));
const couldNot = results.filter((r) => r.runs.some((x) => x.state === "could-not-run"));
const orderOnly = results.filter((r) => r.runs.length === 2 &&
  r.runs.filter((x) => x.state === "accepted").length === 1);
const badClause = results.filter((r) => r.clause_problems.length);

console.log("");
console.log("SUMMARY over " + results.length + " item(s)" + (stopped ? "   STOPPED at the ceiling" : ""));
console.log("  solver agrees in BOTH orders        " + agreeBoth.length);
console.log("  agrees in ONE order only            " + orderOnly.length + "   (agreed with the position, not the content)");
console.log("  picked a DIFFERENT option           " + disagree.length);
console.log("  named a SECOND DEFENSIBLE option    " + secondDef.length);
console.log("  could not run                       " + couldNot.length);
console.log("  cites a clause that does not exist  " + badClause.length);
console.log("  spend $" + usd().toFixed(4) + " over " + calls + " call(s)");

writeFileSync(join(ROOT, OUT), JSON.stringify({
  _what: "AIMS-IA authored practice quality, measured PROMPT-142 s5. READ-ONLY: nothing in the bank " +
    "was changed. A solver disagreement is EVIDENCE for an SME, not a verdict on the item.",
  cert: CERT, ruled_in: "PROMPT-142 s5", model: MODEL,
  population: total, sampled: results.length, by_domain: Object.fromEntries(want),
  summary: { agree_both_orders: agreeBoth.length, agree_one_order_only: orderOnly.length,
    picked_different: disagree.length, second_defensible: secondDef.length,
    could_not_run: couldNot.length, bad_clause: badClause.length },
  spend: { usd: Number(usd().toFixed(4)), calls, model: MODEL }, stopped_at_ceiling: stopped,
  items: results,
}, null, 1) + "\n");
console.log("  wrote " + OUT);
