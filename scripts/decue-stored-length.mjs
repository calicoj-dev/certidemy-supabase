#!/usr/bin/env node
/**
 * decue-stored-length.mjs -- de-cue a LIVE stored item whose key dominates on length. WRITES with
 * `--apply`; dry by default. Unknown flags exit 2.
 *
 * Ruled PROMPT-121 s2b. The cue guard was revived in PROMPT-120 s4 after never having run at
 * generation, and 53 already-inserted ISMS-F rows fail it. The rule is right; the items are cued.
 *
 * ============ WHY THIS IS NOT fix-odd-verdict.mjs ============
 *
 * That script rewrites ONE DISTRACTOR'S VERDICT SHAPE on a PRE-INSERT ARTIFACT item. This one changes
 * LENGTH on a LIVE STORED row and leaves every verdict alone. Different input, different edit,
 * different write path -- so the shared halves are imported (gate context, cue config, blind solver)
 * and nothing is copied.
 *
 * ============ WHAT MAY MOVE, AND WHAT MAY NOT ============
 *
 * The PROMPT-109 method, as ruled: shorten the KEY or lengthen a RIVAL, without changing what any
 * option asserts. So:
 *
 *   - the stem, the explanation, the key's MEANING and every option's VERDICT stay;
 *   - the model may return a shortened key and/or lengthened distractors;
 *   - `correct_answer` and the option ids are asserted unchanged;
 *   - the item is RE-GATED and the BLIND SOLVER runs twice. A split or a miss REVERTS the item.
 *
 * ONE ATTEMPT EACH (ruled). An item that still fails stays as it is -- it is `pending_review` and
 * never serves -- and is named in the report.
 *
 * ONE ITEM FIRST (standing rule, PROMPT-115): the first item's full prompt is printed before any
 * further call.
 *
 *   --cert=<CODE>    required
 *   --max-usd=<n>    required
 *   --limit=<n>      only the first n cued rows
 *   --apply          write
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { buildGateContext } from "./lib/gate-context.mjs";
import { auditItem, keyLengthEscape, CUE_CFG } from "../functions/_shared/item-rules/item-cue-guard.mjs";
import { blindPayload, assertBlind, solverUser, solverVerdict, SOLVER_SYSTEM,
  blindSolverControls } from "./lib/blind-solver.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let CERT = null, MAXUSD = null, LIMIT = 0, APPLY = false, PRINTED = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  let m = a.match(/^--cert=(.+)$/); if (m) { CERT = m[1]; continue; }
  m = a.match(/^--max-usd=([0-9.]+)$/); if (m) { MAXUSD = Number(m[1]); continue; }
  m = a.match(/^--limit=([0-9]+)$/); if (m) { LIMIT = Number(m[1]); continue; }
  console.error("Unrecognised flag: " + a + ". Known: --cert=, --max-usd=, --limit=, --apply.");
  process.exit(2);
}
if (!CERT) { console.error("--cert=<CODE> is required."); process.exit(2); }
if (MAXUSD === null) { console.error("--max-usd=<n> is required."); process.exit(2); }

{
  const c = blindSolverControls();
  if (c.fails.length) { console.error("REFUSING: solver controls fail"); process.exit(2); }
  console.log("solver controls: " + c.examined + " case(s), all pass");
}
const MODEL = process.env.GROUNDED_MODEL || "claude-opus-5";
const PRICE = { input: 15, output: 75 };
const AK = process.env.ANTHROPIC_API_KEY ||
  (readFileSync(join(HERE, ".env"), "utf8").match(/^ANTHROPIC_API_KEY=(.+)$/m) || [])[1];
if (!AK) { console.error("ANTHROPIC_API_KEY not found"); process.exit(2); }
let IN_TOK = 0, OUT_TOK = 0, CALLS = 0;
const usd = () => (IN_TOK / 1e6) * PRICE.input + (OUT_TOK / 1e6) * PRICE.output;
async function claude(system, user, maxTokens = 1400) {
  for (let a = 1; ; a++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST",
        headers: { "x-api-key": AK, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }) });
      if (!res.ok) throw new Error("Anthropic " + res.status + ": " + (await res.text()).slice(0, 200));
      const d = await res.json();
      CALLS++; IN_TOK += d.usage?.input_tokens || 0; OUT_TOK += d.usage?.output_tokens || 0;
      return (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    } catch (e) { if (a >= 3) throw e; await new Promise((r) => setTimeout(r, 800 * a)); }
  }
}
const parseObj = (t) => { const s = String(t || ""); const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; } };

const SYSTEM =
  "You are removing a LENGTH CUE from a multiple-choice examination item. The correct answer is " +
  "noticeably longer than every wrong answer, so a candidate who knows nothing can pick it by size.\n\n" +
  "FIX IT BY CHANGING LENGTH ONLY. You may tighten the key's wording and you may expand a wrong " +
  "answer with concrete, plausible detail. You may NOT change what any option asserts: the key stays " +
  "correct for the same reason, and each wrong answer stays wrong for the same reason.\n\n" +
  "DO NOT: add a new claim, make a wrong answer correct, hedge the key, change the stem, mention the " +
  "standard, or name any option by letter.\n\n" +
  "Return ONE JSON object and nothing else:\n" +
  '{ "options": [{"id":"a","text":"..."}, ...], "what_changed": "one sentence" }\n' +
  "Return EVERY option with its SAME id. The ids and which one is correct do not change.";

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }
const ctx = await buildGateContext(KEY, CERT);
const SEL = "id,question_text,options,correct_answer,explanation,task_id,language,status,pool," +
  "visibility,is_exam_scope,question_group_id,item_origin,difficulty,bloom_level,retired_at";
const rows = await getAll(KEY, "quiz_questions?select=" + SEL + "&certification_id=eq." + cert.id +
  "&language=eq.en&retired_at=is.null&order=id");
const grounding = new Map((await getAll(KEY, "item_grounding?select=question_id,review_verdict," +
  "source_id,edition,key_support_clause&order=question_id")).map((g) => [g.question_id, g]));
const tasks = await getAll(KEY, "tasks?select=id,code");
const codeOf = new Map(tasks.map((t) => [t.id, t.code]));

/* ---- the cued set: a grounded, accepted row whose ONLY gate failure is the cue guard on length ---- */
const cued = [];
for (const r of rows) {
  const g = grounding.get(r.id);
  if (!g || g.review_verdict !== "accept") continue;
  let v;
  try { v = ctx.gateRow(r); } catch { continue; }
  if (v.passed) continue;
  const only = v.failed.length === 1 && v.failed[0] === "structure";
  const esc = keyLengthEscape(r, CUE_CFG);
  if (!only || !esc || !esc.escaped) continue;
  cued.push({ r, g, esc, task: codeOf.get(r.task_id) });
}
console.log("");
console.log("DE-CUE STORED LENGTH   " + CERT + (APPLY ? "   --apply" : "   dry run (default)") +
  "   ceiling $" + MAXUSD);
console.log("  accepted grounded rows failing ONLY the cue guard, on length: " + cued.length);
const byTask = {};
for (const c of cued) byTask[c.task] = (byTask[c.task] || 0) + 1;
console.log("  by task: " + JSON.stringify(byTask));
if (!cued.length) { console.log("Nothing to de-cue."); process.exit(0); }
/* dearest first: the biggest escapes are the ones a candidate can actually see */
cued.sort((a, b) => (b.esc.keyLen - b.esc.maxRival) - (a.esc.keyLen - a.esc.maxRival));
const batch = LIMIT ? cued.slice(0, LIMIT) : cued;

const fixed = [], failed = [], notTried = [];
for (const c of batch) {
  if (MAXUSD && usd() >= MAXUSD) { notTried.push({ ...c, why: "ceiling reached" }); continue; }
  const { r, esc } = c;
  const keyId = r.correct_answer[0];
  const user = "ITEM (task " + c.task + ")\n\nSTEM: " + r.question_text + "\n\nOPTIONS:\n" +
    (r.options || []).map((o) => "  " + o.id + (o.id === keyId ? " (CORRECT)" : "") + ": " + o.text +
      "   [" + String(o.text).length + " characters]").join("\n") +
    "\n\nTHE CUE: the correct answer is " + esc.keyLen + " characters and the longest wrong answer is " +
    esc.maxRival + ". The allowance is +" + esc.allowed + ", so it is over by " +
    (esc.keyLen - esc.maxRival - esc.allowed) + ".\n\nReturn every option with its same id.";
  if (!PRINTED) {
    PRINTED = true;
    console.log("");
    console.log("  ---- FULL PROMPT, FIRST ITEM (standing rule, PROMPT-115) ----");
    console.log("  SYSTEM: " + SYSTEM.replace(/\n/g, "\n  "));
    console.log("  USER:   " + user.replace(/\n/g, "\n  "));
    console.log("  ---- END PROMPT ----");
  }
  if (!APPLY) { notTried.push({ ...c, why: "dry run: no call made" }); continue; }

  const got = parseObj(await claude(SYSTEM, user));
  const opts = got && Array.isArray(got.options) ? got.options : null;
  const sameIds = opts && opts.length === r.options.length &&
    opts.every((o, i) => o && o.id === r.options[i].id && typeof o.text === "string" && o.text.trim());
  if (!sameIds) { failed.push({ ...c, why: "the model did not return every option with its same id" }); continue; }
  const cand = { ...r, options: opts.map((o) => ({ ...r.options.find((x) => x.id === o.id), text: o.text.trim() })) };
  /* the cue must actually be gone, and no other gate may have broken */
  const esc2 = keyLengthEscape(cand, CUE_CFG);
  if (esc2 && esc2.escaped) {
    failed.push({ ...c, why: "still cued after the rewrite (key " + esc2.keyLen + " vs " + esc2.maxRival + ")" });
    continue;
  }
  const a2 = auditItem(cand, CUE_CFG);
  if (a2 && a2.ok === false) { failed.push({ ...c, why: "the cue guard still objects: " + a2.reason }); continue; }
  let v2;
  try { v2 = ctx.gateRow(cand); } catch (e) { failed.push({ ...c, why: "could not gate: " + e.message.slice(0, 60) }); continue; }
  if (!v2.passed) { failed.push({ ...c, why: "gates FAIL after the rewrite [" + v2.failed.join(",") + "]" }); continue; }
  /* the blind solver, twice: a rewritten distractor can become a second defensible answer */
  const map = ctx.mapByTask.get(r.task_id) || { primary: [], supporting: [] };
  const want = [...map.primary, ...map.supporting,
    { source_id: c.g.source_id, edition: c.g.edition, clause: c.g.key_support_clause }];
  const seen = new Set(); const ps = [];
  for (const k of want) {
    if (!k || !k.source_id) continue;
    const sig = k.source_id + "|" + k.edition + "|" + k.clause;
    if (seen.has(sig)) continue; seen.add(sig);
    const p = ctx.index.get(k.source_id, k.edition, String(k.clause));
    if (p) ps.push(p);
  }
  if (!ps.length) { failed.push({ ...c, why: "no passages for the solver" }); continue; }
  const forSolver = { question_text: cand.question_text, explanation: cand.explanation,
    options: cand.options.map((o) => ({ text: o.text, is_correct: o.id === keyId })) };
  const bp = blindPayload(forSolver);
  assertBlind(bp, forSolver);
  const keyLabel = String.fromCharCode(65 + cand.options.findIndex((o) => o.id === keyId));
  const prompt = solverUser(bp, ps);
  const s1 = solverVerdict(parseObj(await claude(SOLVER_SYSTEM, prompt, 1500)), keyLabel);
  const s2 = solverVerdict(parseObj(await claude(SOLVER_SYSTEM, prompt, 1500)), keyLabel);
  if (!(s1.state === "accepted" && s2.state === "accepted")) {
    failed.push({ ...c, why: "solver " + s1.state + "/" + s2.state + " -- REVERTED, the original passed it" });
    continue;
  }
  fixed.push({ ...c, cand, what: got.what_changed || null, esc2, solver: [s1.state, s2.state] });
  console.log("  " + r.id.slice(0, 8) + "  " + c.task.padEnd(5) + " de-cued  key " + esc.keyLen + "->" +
    esc2.keyLen + "  rival " + esc.maxRival + "->" + esc2.maxRival + "   solver accepted/accepted   $" +
    usd().toFixed(2));
}

console.log("");
console.log("  de-cued " + fixed.length + "   failed " + failed.length + "   not tried " + notTried.length);
for (const f of failed) console.log("      FAILED  " + f.r.id.slice(0, 8) + "  " + f.task + "  " + f.why);
console.log("  spend $" + usd().toFixed(4) + " over " + CALLS + " call(s), ceiling $" + MAXUSD);
if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written and no call made. Re-run with --apply."); process.exit(0); }
if (!fixed.length) { console.log("Nothing to write."); process.exit(0); }

const written = [];
for (const f of fixed) {
  const res = await fetch(REST_URL + "/quiz_questions?id=eq." + f.r.id, { method: "PATCH",
    headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify({ options: f.cand.options }) });
  const text = await res.text();
  if (!res.ok) { console.error("  PATCH failed " + f.r.id.slice(0, 8) + ": " + res.status + " " + text.slice(0, 160)); continue; }
  written.push({ f, back: JSON.parse(text)[0] });
}
console.log("");
console.log("  patched " + written.length + " of " + fixed.length);

/* ---------------------------------------------------- POST-CONDITIONS */
console.log("");
console.log("POST-CONDITIONS");
let bad = 0;
for (const { f, back } of written) {
  const r = f.r;
  if ((back.options || []).map((o) => o.id).join(",") !== (r.options || []).map((o) => o.id).join(",")) {
    console.log("      OPTION IDS CHANGED on " + r.id.slice(0, 8)); bad++;
  }
  if (JSON.stringify(back.correct_answer) !== JSON.stringify(r.correct_answer)) {
    console.log("      KEY MOVED on " + r.id.slice(0, 8)); bad++;
  }
  for (const col of ["status", "pool", "visibility", "is_exam_scope", "question_group_id", "item_origin",
    "question_text", "explanation", "task_id", "difficulty", "bloom_level"]) {
    if (JSON.stringify(back[col]) !== JSON.stringify(r[col])) {
      console.log("      " + col + " MOVED on " + r.id.slice(0, 8)); bad++;
    }
  }
  const e = keyLengthEscape(back, CUE_CFG);
  if (e && e.escaped) { console.log("      STILL CUED after the write on " + r.id.slice(0, 8)); bad++; }
}
console.log("  options changed, key and every other named column unchanged, cue cleared: " +
  (bad ? bad + " VIOLATION(S)" : "all " + written.length + " rows"));

/* the record, so the siblings can be re-translated and the round is auditable */
const recPath = join(ROOT, CERT.replace(/-/g, "") + "-DECUED.json");
const rec = existsSync(recPath) ? JSON.parse(readFileSync(recPath, "utf8")) : { rounds: [] };
rec.rounds.push({ ruled_in: "PROMPT-121 s2b", cert: CERT,
  de_cued: written.map(({ f }) => ({ row: f.r.id, task: f.task, what: f.what,
    key_before: f.esc.keyLen, key_after: f.esc2.keyLen, solver: f.solver })),
  failed: failed.map((f) => ({ row: f.r.id, task: f.task, why: f.why })),
  not_tried: notTried.map((f) => ({ row: f.r.id, task: f.task, why: f.why })),
  spend_usd: Number(usd().toFixed(4)) });
writeFileSync(recPath, JSON.stringify(rec, null, 1) + "\n");
console.log("  recorded in " + recPath.split(/[\\/]/).pop());
console.log("");
console.log("  THE SIBLINGS ARE NOW STALE on " + written.length + " item(s). Re-translate them.");
if (bad) process.exitCode = 2;
