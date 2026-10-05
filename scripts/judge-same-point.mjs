#!/usr/bin/env node
/**
 * judge-same-point.mjs -- ask a model whether two items on the SAME ANCHOR test the same point.
 *
 * FLAG-ONLY. There is no --apply and no disposition: it marks pairs for a human to rule on. Ruled
 * PROMPT-130 s3.
 *
 * ============ WHY A MODEL AND NOT A MEASURE ============
 *
 * PROMPT-129 measured it: SAME ANCHOR catches 14 of 14 of the director's duplicate calls but hands
 * back 71 pairs to read, and KEY-WORD OVERLAP cannot sort them -- across his own 14 calls it ranges
 * from 8% to 57%, which is no threshold at all. What he judges is whether two items test the same
 * POINT, and that is a question about meaning.
 *
 * So the anchor finds the candidates and a model sorts them. The key-share arm is retired as a gate
 * and kept only as a sort order (PROMPT-130 s3).
 *
 *   --cert <CODE>        required
 *   --artifacts=a,b      the round's artifacts (candidates)
 *   --accept=a,b         optional: narrow each artifact to its accept list
 *   --max-usd=<n>        required
 *   --limit=<n>          judge at most n pairs
 *   --control            score against the recorded director calls instead of a round
 *   --out=<file>         write the verdicts
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { anchorKey } from "./lib/anchor-cap.mjs";
import { itemIdOfStem } from "./lib/item-id.mjs";
import { makePassageIndex } from "./lib/passage-index.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let CERT = null, ARTS = [], ACCEPTS = [], MAXUSD = null, LIMIT = 0, CONTROL = false, OUT = null;
const AV = process.argv.slice(2);
for (let i = 0; i < AV.length; i++) {
  const a = AV[i]; let m;
  if (a === "--apply") {
    console.error("there is no --apply: this judge FLAGS. A human rules, and it never rejects.");
    process.exit(2);
  }
  if (a === "--control") { CONTROL = true; continue; }
  if ((m = /^--cert(?:=(.+))?$/.exec(a))) { CERT = m[1] || AV[++i]; continue; }
  if ((m = /^--artifacts=(.+)$/.exec(a))) { ARTS = m[1].split(",").map((s) => s.trim()).filter(Boolean); continue; }
  if ((m = /^--accept=(.+)$/.exec(a))) { ACCEPTS = m[1].split(",").map((s) => s.trim()).filter(Boolean); continue; }
  if ((m = /^--max-usd=([0-9.]+)$/.exec(a))) { MAXUSD = Number(m[1]); continue; }
  if ((m = /^--limit=([0-9]+)$/.exec(a))) { LIMIT = Number(m[1]); continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  console.error("unrecognised flag: " + a);
  process.exit(2);
}
if (!CERT) { console.error("--cert is required"); process.exit(2); }
if (MAXUSD === null) { console.error("--max-usd is required (PROMPT-117 s3)"); process.exit(2); }

const MODEL = "claude-opus-5";              /* the SOLVER model: this is a judgement, not writing */
const PRICE = { input: 15, output: 75 };
const AK = process.env.ANTHROPIC_API_KEY ||
  (readFileSync(join(ROOT, "scripts", ".env"), "utf8").match(/^ANTHROPIC_API_KEY=(.+)$/m) || [])[1];
if (!AK) { console.error("ANTHROPIC_API_KEY not found"); process.exit(2); }
let IN_TOK = 0, OUT_TOK = 0, CALLS = 0, PRINTED = false;
const usd = () => (IN_TOK / 1e6) * PRICE.input + (OUT_TOK / 1e6) * PRICE.output;
async function claude(system, user, maxTokens = 400) {
  for (let a = 1; ; a++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST",
        headers: { "x-api-key": AK, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system,
          messages: [{ role: "user", content: user }] }) });
      if (!res.ok) throw new Error("Anthropic " + res.status + ": " + (await res.text()).slice(0, 180));
      const d = await res.json();
      CALLS++; IN_TOK += d.usage?.input_tokens || 0; OUT_TOK += d.usage?.output_tokens || 0;
      return (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    } catch (e) { if (a >= 3) throw e; await new Promise((r) => setTimeout(r, 700 * a)); }
  }
}

/* ============ THE PROMPT ============
 *
 * It asks ONE question and gives the standard's own sentence, because "same point" is relative to
 * what the passage says: two items can share an anchor and still examine different obligations
 * inside it. The examples are the director's own calls, stated as principles rather than as the
 * items, so the judge is not pattern-matching a list it will be scored on. */
const SYSTEM = [
  "You compare two examination items that are anchored on the SAME passage of a standard, and you",
  "answer one question: do they test the SAME POINT?",
  "",
  "SAME_POINT means a candidate who can answer one can answer the other for the same reason. The",
  "wording, the scenario and the task may all differ -- what matters is the understanding being",
  "measured and the proposition the key asserts.",
  "",
  "DIFFERENT_POINT means the passage supports both, but they examine different obligations, different",
  "halves of a rule, or different judgements. A shared anchor is not enough to make two items the same.",
  "",
  "Guidance:",
  "- Compare the KEYS first. If both keys assert the same proposition about the same subject, that is",
  "  SAME_POINT even if one is a scenario and the other is a definition.",
  "- A different SCENARIO with the same underlying judgement is still SAME_POINT.",
  "- Testing a term's definition and testing how the term is applied are DIFFERENT_POINT.",
  "- One item asking which of two outcomes follows, and another asking what to do about it, are",
  "  DIFFERENT_POINT.",
  "- Do not treat a different TASK as evidence either way. The same point can be reached from two tasks.",
  "",
  "Return ONE JSON object and nothing else:",
  '{ "verdict": "SAME_POINT" | "DIFFERENT_POINT", "reason": "one sentence" }',
].join("\n");

const userFor = (p) => [
  "ANCHOR: " + p.anchor,
  "THE PASSAGE, verbatim:",
  (p.passage || "(not held)").slice(0, 1800),
  "",
  "ITEM A" + (p.aWhere ? " (" + p.aWhere + ")" : "") + ", task " + p.aTask,
  "STEM: " + p.aStem,
  "KEY:  " + p.aKey,
  "",
  "ITEM B" + (p.bWhere ? " (" + p.bWhere + ")" : "") + ", task " + p.bTask,
  "STEM: " + p.bStem,
  "KEY:  " + p.bKey,
  "",
  "Do these test the same point?",
].join("\n");

const parseObj = (t) => {
  const s = String(t || ""); const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; }
};

const KEY = requireKey(join(ROOT, "scripts"));
const cert = (await getAll(KEY, "certifications?select=id&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }
const tasks = await getAll(KEY, "tasks?select=id,code&order=code");
const codeOf = new Map(tasks.map((t) => [t.id, t.code]));
const pass = await getAll(KEY, "source_passages?select=id,source_id,edition,clause,text&order=id&limit=100000");
const pIdx = makePassageIndex(pass);
const passageFor = (src, ed, cl) => {
  const p = pIdx.get(src, ed, String(cl));
  return p ? String(p.text || "") : "";
};

/* ---- the LIVE items, by stem-hash id ---- */
const ig = new Map((await getAll(KEY, "item_grounding?select=question_id,source_id,edition," +
  "key_support_clause&order=question_id")).map((g) => [g.question_id, g]));
const rows = await getAll(KEY, "quiz_questions?select=id,task_id,language,question_text,options," +
  "correct_answer,item_origin,retired_at&certification_id=eq." + cert.id + "&language=eq.en&order=id");
const liveById = new Map();
for (const r of rows) {
  if (r.retired_at || r.item_origin !== "grounded") continue;
  const g = ig.get(r.id);
  if (!g) continue;
  const ki = Array.isArray(r.correct_answer) ? r.correct_answer[0] : null;
  const hit = (r.options || []).find((o) => o && (ki ? o.id === ki : o.is_correct === true));
  liveById.set(itemIdOfStem(r.question_text), {
    id: itemIdOfStem(r.question_text), task: codeOf.get(r.task_id) || "?",
    stem: String(r.question_text || "").replace(/\s+/g, " "),
    key: String((hit && hit.text) || "").replace(/\s+/g, " "),
    source_id: g.source_id, edition: g.edition, clause: g.key_support_clause,
    anchorK: anchorKey(g.source_id, g.edition, g.key_support_clause),
    anchor: g.source_id + " " + g.key_support_clause, where: "live",
  });
}
/* ---- the CANDIDATES from the named artifacts ---- */
const candById = new Map();
for (let i = 0; i < ARTS.length; i++) {
  const f = ARTS[i];
  const p = join(ROOT, f);
  if (!existsSync(p)) { console.error("REFUSING: no such artifact " + f); process.exit(2); }
  const j = JSON.parse(readFileSync(p, "utf8"));
  let allow = null;
  if (ACCEPTS.length) {
    allow = new Set((JSON.parse(readFileSync(join(ROOT, ACCEPTS[i]), "utf8")).accepts || [])
      .map((a) => a.item_id));
  }
  for (const it of (j.items || [])) {
    if (it.verdict !== "survivor") continue;
    if (allow && !allow.has(it.item_id)) continue;
    const o = it.item || {};
    const hit = (o.options || []).find((x) => x && x.is_correct === true);
    candById.set(it.item_id, { id: it.item_id, task: it.task_code,
      stem: String(o.question_text || "").replace(/\s+/g, " "),
      key: String((hit && hit.text) || "").replace(/\s+/g, " "),
      source_id: o.source_id, edition: o.edition, clause: o.key_support_clause,
      anchorK: anchorKey(o.source_id, o.edition, o.key_support_clause),
      anchor: (o.source_id || "?") + " " + (o.key_support_clause || "?"), where: f });
  }
}
const anyById = (id) => candById.get(id) || liveById.get(id);

const judge = async (a, b) => {
  const p = { anchor: a.anchor, passage: passageFor(a.source_id, a.edition, a.clause),
    aTask: a.task, aStem: a.stem, aKey: a.key, aWhere: a.where,
    bTask: b.task, bStem: b.stem, bKey: b.key, bWhere: b.where };
  const user = userFor(p);
  if (!PRINTED) {
    PRINTED = true;
    console.log("");
    console.log("  ---- FULL JUDGE PROMPT, FIRST PAIR (standing rule, PROMPT-115) ----");
    console.log("  SYSTEM: " + SYSTEM.replace(/\n/g, "\n  "));
    console.log("  USER:   " + user.replace(/\n/g, "\n  "));
    console.log("  ---- END PROMPT ----");
    console.log("");
  }
  /* ============ ONE RETRY ON AN UNPARSEABLE ANSWER (PROMPT-130 s3) ============
   *
   * The first control run returned 18 COULD-NOT-ANSWER of 128, and three of them were pairs the
   * judge answers correctly when run again on their own -- so the failure is intermittent, not a
   * property of the pair. An unanswered pair is not a DIFFERENT_POINT, and counting it as one
   * depressed the positives caught by three. Same rule as the writer's malformed-batch retry
   * (PROMPT-117 s3): retry once, then report the third state honestly. */
  let raw = await claude(SYSTEM, user);
  let o = parseObj(raw);
  if (!o || !/^(SAME|DIFFERENT)_POINT$/i.test(String(o.verdict || ""))) {
    raw = await claude(SYSTEM, user);
    o = parseObj(raw);
  }
  const v = o && String(o.verdict || "").toUpperCase();
  if (v !== "SAME_POINT" && v !== "DIFFERENT_POINT") {
    /* COULD-NOT-ANSWER carries the RAW response. An unparseable answer reported only as null is a
     * third state with no evidence in it, and 18 of 128 came back that way on the first control
     * run with nothing to diagnose from. */
    return { verdict: "COULD-NOT-ANSWER",
      reason: "unparseable: " + String(raw || "(empty)").replace(/\s+/g, " ").slice(0, 220) };
  }
  return { verdict: v, reason: String((o && o.reason) || "").slice(0, 200) };
};

/* ============ CONTROL MODE ============ */
if (CONTROL) {
  const spec = JSON.parse(readFileSync(join(ROOT, "ISMSIA-JUDGE-CONTROL.json"), "utf8"));
  const cases = [];
  for (const [kind, list] of [["POSITIVE", spec.positives], ["NEGATIVE", spec.negatives]]) {
    for (const [x, y] of list) {
      const a = anyById(x), b = anyById(y);
      if (!a || !b) { cases.push({ kind, x, y, skip: "one side not found" }); continue; }
      if (a.anchorK !== b.anchorK) { cases.push({ kind, x, y, skip: "different anchors" }); continue; }
      cases.push({ kind, x, y, a, b });
    }
  }
  const runnable = cases.filter((c) => !c.skip);
  console.log("JUDGE CONTROL   " + CERT + "   model " + MODEL + "   ceiling $" + MAXUSD);
  console.log("  positives " + cases.filter((c) => c.kind === "POSITIVE" && !c.skip).length +
    " of " + spec.positives.length + "   negatives " +
    cases.filter((c) => c.kind === "NEGATIVE" && !c.skip).length + " of " + spec.negatives.length);
  const skipped = cases.filter((c) => c.skip);
  for (const s of skipped) console.log("  SKIPPED " + s.kind + " " + s.x + " ~ " + s.y + ": " + s.skip);
  console.log("");
  const res = [];
  for (const c of runnable) {
    if (usd() >= MAXUSD) { console.log("  STOPPED at the ceiling after " + res.length + " pair(s)."); break; }
    if (LIMIT && res.length >= LIMIT) break;
    const v = await judge(c.a, c.b);
    res.push({ ...c, ...v });
    const want = c.kind === "POSITIVE" ? "SAME_POINT" : "DIFFERENT_POINT";
    console.log("  " + (v.verdict === want ? "ok   " : "MISS ") + c.kind.padEnd(9) + c.x + " ~ " +
      c.y + "  -> " + v.verdict + "   " + v.reason.slice(0, 90));
  }
  const pos = res.filter((r) => r.kind === "POSITIVE");
  const neg = res.filter((r) => r.kind === "NEGATIVE");
  const caught = pos.filter((r) => r.verdict === "SAME_POINT").length;
  const fp = neg.filter((r) => r.verdict === "SAME_POINT").length;
  console.log("");
  console.log("  POSITIVES CAUGHT   " + caught + " of " + pos.length + " judged (ruling's bar: 20 of 24)");
  console.log("  FALSE POSITIVES    " + fp + " of " + neg.length + " = " +
    (neg.length ? Math.round((fp / neg.length) * 100) : 0) + "%   (bar: under 15%)");
  console.log("  could-not-answer   " + res.filter((r) => r.verdict === "COULD-NOT-ANSWER").length);
  console.log("  spend              $" + usd().toFixed(4) + " over " + CALLS + " call(s)");
  const misses = pos.filter((r) => r.verdict !== "SAME_POINT");
  if (misses.length) {
    console.log("");
    console.log("  EACH MISSED POSITIVE, WITH THE JUDGE'S OWN REASON:");
    for (const m of misses) console.log("    " + m.x + " ~ " + m.y + ": " + m.reason);
  }
  if (OUT) writeFileSync(join(ROOT, OUT), JSON.stringify({ cert: CERT, model: MODEL,
    positives_caught: caught, positives_judged: pos.length, false_positives: fp,
    negatives_judged: neg.length, spend_usd: Number(usd().toFixed(4)),
    verdicts: res.map((r) => ({ kind: r.kind, a: r.x, b: r.y, verdict: r.verdict, reason: r.reason })),
  }, null, 2) + "\n");
  const passBar = caught >= 20 && neg.length && (fp / neg.length) < 0.15;
  console.log("");
  console.log("  " + (passBar ? "CLEARS THE BAR" : "DOES NOT CLEAR THE BAR -- reported, not tuned"));
  process.exitCode = passBar ? 0 : 1;
} else {
  /* ============ ROUND MODE: every same-anchor pair, candidates and live ============ */
  const pairs = [];
  const cands = [...candById.values()];
  for (let i = 0; i < cands.length; i++) {
    for (let j = i + 1; j < cands.length; j++) {
      if (cands[i].anchorK === cands[j].anchorK) pairs.push([cands[i], cands[j]]);
    }
  }
  for (const c of cands) {
    for (const l of liveById.values()) {
      if (l.id === c.id) continue;                 /* a candidate is not its own duplicate */
      if (l.anchorK === c.anchorK) pairs.push([c, l]);
    }
  }
  /* key-share is RETIRED as a gate and kept only as a SORT ORDER (PROMPT-130 s3): the likeliest
   * pairs are judged first, so a ceiling cuts the least interesting ones. */
  const nk = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const share = (a, b) => {
    const wa = [...new Set(nk(a).split(" "))].filter((w) => w.length > 3);
    const wb = new Set([...new Set(nk(b).split(" "))].filter((w) => w.length > 3));
    return wa.filter((w) => wb.has(w)).length / (Math.min(wa.length, wb.size) || 1);
  };
  pairs.sort((p, q) => share(q[0].key, q[1].key) - share(p[0].key, p[1].key));
  console.log("JUDGE   " + CERT + "   " + pairs.length + " same-anchor pair(s), ceiling $" + MAXUSD);
  const flags = [];
  let judged = 0;
  for (const [a, b] of pairs) {
    if (usd() >= MAXUSD) { console.log("  STOPPED at the ceiling after " + judged + " of " + pairs.length); break; }
    if (LIMIT && judged >= LIMIT) break;
    const v = await judge(a, b);
    judged++;
    if (v.verdict === "SAME_POINT") {
      flags.push({ a: a.id, aTask: a.task, aWhere: a.where, b: b.id, bTask: b.task, bWhere: b.where,
        anchor: a.anchor, reason: v.reason });
      console.log("  FLAG  " + a.id + " (" + a.task + ") ~ " + b.id + " (" + b.task + ")  " +
        a.anchor + "   " + v.reason.slice(0, 100));
    }
  }
  console.log("");
  console.log("  judged " + judged + " of " + pairs.length + "   FLAGGED " + flags.length +
    "   spend $" + usd().toFixed(4));
  console.log("  FLAG-ONLY: nothing is rejected or withheld here. A human rules.");
  if (OUT) writeFileSync(join(ROOT, OUT), JSON.stringify({ cert: CERT, model: MODEL,
    pairs: pairs.length, judged, flagged: flags, spend_usd: Number(usd().toFixed(4)) }, null, 2) + "\n");
}
