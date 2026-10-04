#!/usr/bin/env node
/**
 * PROMPT-114 s2: rewrite ONE distractor per item so it SHARES the key's verdict and is wrong on the
 * reason or the remedy. WRITES to an artifact only; `--apply` writes it, dry by default.
 *
 * THE DEFECT THIS FIXES. The options probe flagged 22 of R1's 23 survivors `odd-verdict` or
 * `only-hedged`, and it was right: the key was the one strict, principled statement and the three
 * distractors were "acceptable, as long as X" excuses. A candidate who knows nothing picks the strict
 * option, so a form carrying ten of these hands out ten free points.
 *
 * ONE DISTRACTOR, NOTHING ELSE. The stem, the key and the other two distractors are untouched, so the
 * item still measures what it measured. The rewritten distractor agrees there is a problem and gets
 * the reason or the remedy wrong -- which is what makes it a real distractor rather than an excuse.
 *
 * SPEND-CAPPED. `--max-usd` stops before the next item rather than after it.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { buildGateContext } from "./lib/gate-context.mjs";
import { runCodeGates } from "./lib/grounded-gates.mjs";
import { optionsPayload, assertOptionsOnly, OPTIONS_PROBE_SYSTEM, optionsProbeUser,
  optionsProbeVerdict, optionsProbeControls } from "./lib/options-probe.mjs";
import { blindPayload, assertBlind, solverUser, solverVerdict, SOLVER_SYSTEM,
  blindSolverControls } from "./lib/blind-solver.mjs";
import { deCueRewriteCheck, deCueCheckControls } from "./lib/de-cue-checks.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let APPLY = false, CERT = "ISMS-F", IN = "ISMSF-R1", OUT = null, MAX_USD = 8, ACCEPT = null;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  let m = a.match(/^--cert=(.+)$/);
  if (m) { CERT = m[1]; continue; }
  m = a.match(/^--in=(.+)$/);
  if (m) { IN = m[1]; continue; }
  m = a.match(/^--out=(.+)$/);
  if (m) { OUT = m[1]; continue; }
  m = a.match(/^--max-usd=([0-9.]+)$/);
  if (m) { MAX_USD = Number(m[1]); continue; }
  m = a.match(/^--accept=(.+)$/);
  if (m) { ACCEPT = m[1].split(",").map((s) => s.trim()).filter(Boolean); continue; }
  console.error("Unrecognised flag: " + a +
    ". Known: --cert=, --in=, --out=, --accept=1,2,..., --max-usd=, --apply (dry by default).");
  process.exit(2);
}
OUT = OUT || (IN + "-decued");

for (const [label, c] of [["options probe", optionsProbeControls()], ["solver", blindSolverControls()],
  ["de-cue checks", deCueCheckControls()]]) {
  const fails = c.fails || [];
  if (fails.length) { console.error("REFUSING: " + label + " controls fail: " + fails.join("; ")); process.exit(2); }
  console.log(label + " controls: " + c.examined + " case(s), all pass");
}

const MODEL = process.env.GROUNDED_MODEL || "claude-opus-5";
const PRICES = { "claude-opus-5": { input: 15, output: 75 }, "claude-sonnet-5": { input: 3, output: 15 } };
const PRICE = PRICES[MODEL] || { input: 15, output: 75, assumed: true };
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

const REWRITE_SYSTEM = `You are repairing ONE distractor in a multiple-choice examination item.

THE DEFECT: the key is the one strict, principled statement and every distractor is an excuse of the
form "acceptable, as long as X". A candidate who knows nothing picks the strict option.

YOUR TASK: rewrite exactly ONE distractor so that it SHARES THE KEY'S VERDICT -- it agrees there is a
problem, or agrees the practice is required -- but is WRONG ON THE REASON or WRONG ON THE REMEDY.

HARD RULES:
- Change ONE distractor only. Return the others unchanged, verbatim.
- Never change the key. Never change the stem.
- Keep the rewritten distractor within about 15 percent of the key's character length.
- It must be clearly WRONG to someone who knows the standard, and plausible to someone who does not.
- Do not introduce an absolute ("always", "never", "all", "any") that was not there.
- Do not name a clause number that was not already in the options.

Reply with ONLY this JSON object:
{"rewrote":"<option id>","why":"<one sentence: the verdict it now shares, and what it gets wrong>",
 "options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}]}`;

/* ============ THE GENERATOR'S ITEM SHAPE, NOT THE STORED ROW'S ============
 *
 * A pre-insert item is `options: [{text, is_correct}]` with NO `id` and NO `correct_answer` -- option
 * ids are assigned at insert. This script first assumed the stored shape, so `keyId` was undefined,
 * the prompt read "KEY (undefined, do not change)" with "Key length to match: 0 characters", and every
 * id comparison failed. Two runs and $2.58 before I looked at the data.
 *
 * `lib/stored-item.mjs` exists for the opposite direction (stored row -> gate shape). Here the option
 * LETTER is positional, exactly as it will be at insert. */
const LETTERS = "abcdefgh";
const keyIndexOf = (o) => (o.options || []).findIndex((x) => x.is_correct === true);
const letterAt = (i) => LETTERS[i] || null;

const rewriteUser = (it) => {
  const o = it.item;
  const ki = keyIndexOf(o);
  const key = (o.options || [])[ki];
  return "STEM: " + o.question_text +
    "\n\nKEY (" + letterAt(ki) + ", do not change): " + (key ? key.text : "") +
    "\n\nDISTRACTORS:\n" + (o.options || [])
      .map((x, i) => ({ x, i })).filter(({ i }) => i !== ki)
      .map(({ x, i }) => "  " + letterAt(i) + ": " + x.text).join("\n") +
    "\n\nTHE PROBE'S FINDING: " + String((it.options_probe && it.options_probe.reason) || "odd verdict") +
    "\n\nKey length to match: " + (key ? key.text.length : 0) + " characters.";
};

const art = JSON.parse(readFileSync(join(ROOT, IN), "utf8"));
const items = art.items || [];
/* the accepted set, by 1-based position in the report, as the director numbers them */
/* NUMBERED OVER SURVIVORS, not over the artifact. The report numbers the survivors 1..N and the
 * artifact also holds the code-rejected items, so an artifact index would shift every number after
 * the first rejection -- and the director's accept list is by report number. */
const survivors = items.filter((x) => x.verdict === "survivor");
const numberOf = new Map(survivors.map((x, i) => [x, i + 1]));
const accepted = ACCEPT ? new Set(ACCEPT.map(Number)) : null;
const flagged = items.filter((it) => {
  if (it.verdict !== "survivor") return false;
  if (accepted && !accepted.has(numberOf.get(it))) return false;
  const f = (it.options_probe && it.options_probe.flag) || (it.options_probe && it.options_probe.state) || "";
  const r = String((it.options_probe && it.options_probe.reason) || "");
  return /odd-verdict|only-hedged/.test(String(f) + " " + r);
});

console.log("");
console.log("FIX ODD-VERDICT   " + CERT + "   " + IN + (APPLY ? "   --apply" : "   dry run (default)"));
console.log("  items in the artifact        " + items.length);
console.log("  accepted + probe-flagged     " + flagged.length + (accepted ? "   (of " + accepted.size + " accepted)" : ""));
console.log("  model " + MODEL + "   ceiling $" + MAX_USD.toFixed(2));
if (!APPLY) {
  console.log("");
  console.log("DRY RUN. Nothing written and no model call made. Re-run with --apply.");
  process.exit(0);
}

const KEY = requireKey(HERE);
const ctx = await buildGateContext(KEY, CERT);
const before = flagged.length;
let fixed = 0, leftOut = 0, stopped = false;
const results = [];
for (const it of flagged) {
  if (usd() >= MAX_USD) { stopped = true; break; }
  const o = it.item;
  const ki = keyIndexOf(o);
  if (ki < 0) {
    console.log("  " + it.item_id + "  REFUSED: no option is marked is_correct -- left out");
    leftOut++; results.push({ id: it.item_id, outcome: "no key marked" });
    continue;
  }
  const parsed = parseObj(await claude(REWRITE_SYSTEM, rewriteUser(it)));
  if (!parsed || !Array.isArray(parsed.options) || parsed.options.length !== (o.options || []).length) {
    console.log("  " + it.item_id + "  REWRITE UNPARSEABLE -- left out");
    leftOut++; results.push({ id: it.item_id, outcome: "unparseable" });
    continue;
  }
  /* THE ID AND THE WHITESPACE ARE NORMALISED, THE TEXT IS NOT.
   *
   * The first run fixed 0 of 18 and spent $1.29 on my own guard: the model answers "B" or "option b"
   * where the artifact's ids are "b", so `rewrote` matched nothing, all four options counted as
   * collateral changes, and every item was refused. The guard was right to refuse -- it just could
   * not tell which option had been rewritten.
   *
   * So the ID is normalised to a bare letter and the comparison collapses whitespace. What is NOT
   * relaxed is the guard itself: exactly one option may differ, and it may not be the key. */
  const idx = (v) => {
    const m = /([a-h])/i.exec(String(v || "").trim());
    return m ? LETTERS.indexOf(m[1].toLowerCase()) : -1;
  };
  const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
  const ri = idx(parsed.rewrote);
  if (ri < 0 || ri >= (o.options || []).length) {
    console.log("  " + it.item_id + "  REFUSED: `rewrote` " + JSON.stringify(parsed.rewrote) +
      " names no option -- left out");
    leftOut++; results.push({ id: it.item_id, outcome: "rewrote names no option" });
    continue;
  }
  if (ri === ki) {
    console.log("  " + it.item_id + "  REFUSED: the model rewrote the KEY -- left out");
    leftOut++; results.push({ id: it.item_id, outcome: "rewrote the key" });
    continue;
  }
  const byIdx = new Map(parsed.options.map((x) => [idx(x.id), String(x.text)]));
  if (byIdx.size !== (o.options || []).length || [...byIdx.keys()].some((k) => k < 0)) {
    console.log("  " + it.item_id + "  REFUSED: the reply does not name every option once -- left out");
    leftOut++; results.push({ id: it.item_id, outcome: "reply option ids not one-to-one" });
    continue;
  }
  const drift = (o.options || []).map((x, i) => ({ x, i }))
    .filter(({ x, i }) => i !== ri && norm(byIdx.get(i)) !== norm(x.text));
  if (drift.length) {
    console.log("  " + it.item_id + "  REFUSED: " + drift.length + " untouched option(s) changed [" +
      drift.map((d) => letterAt(d.i)).join(",") + "] -- left out");
    leftOut++; results.push({ id: it.item_id, outcome: "collateral change to " + drift.map((d) => letterAt(d.i)).join(",") });
    continue;
  }
  /* the untouched options keep their ORIGINAL text; only the rewritten one takes the model's */
  const candidate = { ...o, options: (o.options || []).map((x, i) =>
    i === ri ? { ...x, text: String(byIdx.get(i)) } : x) };
  parsed.rewrote = letterAt(ri);

  /* the de-cue guards: no new absolute, no dropped limiter, no changed control reference */
  const originals = (o.options || []).map((x) => x.text);
  const rewrites = candidate.options.map((x) => x.text);
  const dc = deCueRewriteCheck(originals, rewrites, ctx.controlTitles || []);
  if (dc && dc.refused) {
    console.log("  " + it.item_id + "  REFUSED by the de-cue checks: " + dc.reason + " -- left out");
    leftOut++; results.push({ id: it.item_id, outcome: "de-cue check: " + dc.reason });
    continue;
  }

  /* re-gate against the library as it is now */
  const gi = { ...candidate, source_id: it.item.source_id, edition: it.item.edition,
    key_support: it.item.key_support, key_support_clause: it.item.key_support_clause };
  const v = runCodeGates(gi, { passagesByKey: ctx.index, annexGaps: ctx.annexGaps,
    sequenceGaps: ctx.sequenceGaps, cert: CERT, cueCfg: ctx.cueCfg,
    primaryClauses: (ctx.mapByTask.get(ctx.taskIdOfCode.get(it.task_code)) || {}).primary || null,
    supportingClauses: (ctx.mapByTask.get(ctx.taskIdOfCode.get(it.task_code)) || {}).supporting || null,
    sources: ctx.sources, leak: ctx.leak,
    /* BOTH OF THESE OR THE GATE CANNOT ANSWER. Omitting them left `near-duplicate` and
     * `anchor-assignment` UNASSERTED, and an unasserted gate blocks `passed` -- correctly, because a
     * gate that could not run is not a gate that passed. The artifact carries the assignment the
     * writer was given; the live stems come from the context. */
    liveStemsForTask: (ctx.liveByTask && ctx.liveByTask.get(ctx.taskIdOfCode.get(it.task_code))) || [],
    assignedAnchor: it.assigned || null });
  if (!v.passed) {
    console.log("  " + it.item_id + "  gates after rewrite: passed=" + v.passed + " FAILED[" + v.failed.join(",") + "] UNASSERTED[" + v.unasserted.join(",") + "] -- left out");
    leftOut++; results.push({ id: it.item_id, outcome: "gates: " + v.failed.join(",") });
    continue;
  }

  /* re-probe: the options alone must no longer give the key away */
  const op = optionsPayload(candidate);
  assertOptionsOnly(op, candidate);
  const keyLabel = String.fromCharCode(65 + ki);
  const probe = optionsProbeVerdict(parseObj(await claude(OPTIONS_PROBE_SYSTEM, optionsProbeUser(op))), keyLabel);

  /* the solver, twice, so the key is still reachable from the passages */
  const bp = blindPayload(gi);
  assertBlind(bp, gi);
  /* THE SOLVER'S PASSAGES, resolved from the task's own map through the library index.
   *
   * `ctx.passagesForTask` does not exist on the gate context, and the `? :` fallback handed the solver
   * an EMPTY list -- so it was blind and rejected all 15 items. A blind instrument that returns a
   * verdict is worse than one that refuses: `rejected/rejected` looked like a finding about the items.
   * An empty list is now an error rather than a silent zero. */
  const map = ctx.mapByTask.get(ctx.taskIdOfCode.get(it.task_code)) || { primary: [], supporting: [] };
  const want = [...map.primary, ...map.supporting];
  if (gi.key_support_clause) {
    want.push({ source_id: gi.source_id, edition: gi.edition, clause: gi.key_support_clause });
  }
  const seen = new Set();
  const ps = [];
  for (const k of want) {
    if (!k || !k.source_id || !k.edition) continue;
    const sig = k.source_id + "|" + k.edition + "|" + k.clause;
    if (seen.has(sig)) continue;
    seen.add(sig);
    const p = ctx.index.get(k.source_id, k.edition, String(k.clause));
    if (p) ps.push(p);
  }
  if (!ps.length) {
    console.log("  " + it.item_id + "  REFUSED: no passage resolved for task " + it.task_code +
      ", so the solver would be guessing -- left out");
    leftOut++; results.push({ id: it.item_id, outcome: "no passages for the solver" });
    continue;
  }
  const s1 = solverVerdict(parseObj(await claude(SOLVER_SYSTEM, solverUser(bp, ps))), keyLabel);
  const s2 = solverVerdict(parseObj(await claude(SOLVER_SYSTEM, solverUser(bp, ps))), keyLabel);

  const probeClear = !/odd-verdict|only-hedged/.test(String(probe.flag || "") + " " + String(probe.reason || ""));
  const solverOk = s1.state === s2.state && s1.state === "accepted";
  console.log("  " + it.item_id + "  rewrote " + parsed.rewrote +
    "   probe " + (probeClear ? "CLEAR" : "still flagged: " + (probe.flag || probe.reason)) +
    "   solver " + s1.state + "/" + s2.state + "   $" + usd().toFixed(2));
  if (!probeClear || !solverOk) {
    leftOut++;
    results.push({ id: it.item_id, outcome: !probeClear ? "probe still flagged" : "solver " + s1.state + "/" + s2.state });
    continue;
  }
  it.item = candidate;
  it.decued_PROMPT_114 = { rewrote: parsed.rewrote, why: parsed.why, probe, solver: [s1.state, s2.state] };
  it.options_probe = probe;
  fixed++;
  results.push({ id: it.item_id, outcome: "fixed", rewrote: parsed.rewrote });
}

const outPath = join(ROOT, OUT);
writeFileSync(outPath, JSON.stringify({ ...art, decue_round: "PROMPT-114 s2",
  decue_spend_usd: Number(usd().toFixed(4)), decue_calls: CALLS, decue_results: results }, null, 1) + "\n");
console.log("");
console.log("  probe-flagged BEFORE " + before + "   fixed " + fixed + "   left out " + leftOut +
  (stopped ? "   STOPPED on the $" + MAX_USD.toFixed(2) + " ceiling" : ""));
console.log("  probe flag rate      " + before + "/" + before + " -> " + (before - fixed) + "/" + before);
console.log("  spend $" + usd().toFixed(4) + " over " + CALLS + " call(s)");
console.log("  wrote " + OUT);
