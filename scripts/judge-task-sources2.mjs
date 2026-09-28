#!/usr/bin/env node
/**
 * judge-task-sources2.mjs -- link a task to its PRIMARY passages in two passes, with no candidate cap.
 *
 * DRY BY DEFAULT. There is no `--apply`. Nothing here writes `task_sources`. Unknown flags exit 2.
 *
 *   --cert=AIMS-F        required; AIMS-F is the control
 *   --out=...            artifact prefix
 *   --from=<raw file>    re-score persisted verdicts without paying for the model again
 *
 * ============ WHY TWO PASSES, AND WHY NO CAP ============
 *
 * The first attempt measured 57.3% recall against AIMS-F's 150 reviewed primaries and was scored as a
 * failure of judgment. It was not: **47 of the 150 were never shown to it.** The ranker's top 25 was the
 * binding constraint, and `ISO-TASK-SOURCES-DRAFT.md` shows 44 reviewed primaries are invisible to that
 * ranker at ANY depth -- they have no title match and fewer than three shared distinctive terms. The
 * ceiling on recall was 68.7% at the depth used and 71% at any depth, so the 90% bar was unreachable
 * before a single call was made.
 *
 * So the ceiling is removed rather than raised. Pass 1 gets the COMPLETE clause and control title list
 * for the task's standards -- every passage the library holds, no ranking, no cap -- and picks addresses
 * from it. AIMS-F's complete list is 184 entries and about 2,600 tokens; the largest of the four is
 * ISMS-F at 614 entries and about 9,000. There is no size argument for a shortlist.
 *
 * Pass 2 then FETCHES THE TEXT of exactly what pass 1 picked and asks it to confirm or drop each one.
 * That is the half a title list cannot do: a title says what a clause is called, and only the text says
 * whether an item's key could rest on it. Splitting them means pass 1 is free to be generous over the
 * whole standard, and pass 2 pays for text only on what was actually chosen.
 *
 * ============ BLIND, AND THE BLINDNESS IS ASSERTED STRUCTURALLY ============
 *
 * `task_sources` is read only after every call in both passes has returned. `linksRead` is set at that
 * one site and `assertBlind` throws if a payload is built afterwards; payload property names are walked
 * against an allowlist. The guard does NOT search for English words -- the first version aborted a run
 * on task 28 because a 42001 passage contains the word *accepted*, which is this repository's own
 * recorded defect and cost 26 completed calls.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let CERT = null, OUT = "TASK-SOURCE-PROPOSALS2", FROM = null;
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--cert=(.+)$/.exec(a))) { CERT = m[1]; continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  if ((m = /^--from=(.+)$/.exec(a))) { FROM = m[1]; continue; }
  console.error("unknown flag " + JSON.stringify(a) + ". Known: --cert=, --out=, --from=");
  console.error("There is no --apply. Nothing here writes task_sources.");
  process.exitCode = 2; process.exit();
}
if (!CERT) { console.error("--cert=<code> is required"); process.exitCode = 2; process.exit(); }

for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY && !FROM) {
  console.error("ANTHROPIC_API_KEY not set"); process.exitCode = 2; process.exit();
}
/* SAME MODEL as the first attempt, deliberately: this run changes the ALGORITHM (two passes, no cap)
 * and nothing else, so the delta is attributable. Changing both would measure their sum. */
const MODEL = process.env.GROUNDED_MODEL || "claude-opus-5";

async function claude(system, user, maxTokens = 3000) {
  let lastErr = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01",
          "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system,
          messages: [{ role: "user", content: user }] }),
      });
      if (!res.ok) throw new Error(res.status + " " + (await res.text()).slice(0, 200));
      const j = await res.json();
      return (j.content || []).map((c) => c.text || "").join("");
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
    }
  }
  throw lastErr;
}
function parseObject(text) {
  const s = String(text);
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; }
}

const SYSTEM1 = `You decide which passages of a published standard a certification TASK is examined against.

You are given the task's statement and its knowledge, skills and abilities; the concepts it assesses; and
the COMPLETE list of clause and control titles for the standard or standards in scope. There is no
shortlist and nothing has been filtered for you -- the whole standard is in front of you.

Return JSON only:

{"primary":[{"source":"<source id exactly as given>","clause":"<clause exactly as given>",
             "reason":"<one line: why this passage is what the task examines>",
             "confidence":"high"|"medium"|"low"}],
 "none_apply": false,
 "note":"<one line, only if something needs saying>"}

PRIMARY means: an item written for this task should be able to rest its key on this passage. The passage
states the thing the task tests.

RULES.
- Choose ONLY from the title list. Copy the source id and clause exactly. Do not invent a clause.
- Be GENEROUS at this stage. You are choosing what to look at, and the text of everything you pick will
  be fetched and shown to you in a second pass where you can drop it. Missing a clause here is permanent;
  including a doubtful one costs only a second look.
- Where a task spans a family of controls, name EVERY member of the family rather than the group heading.
  If the list contains both a group heading and its children, pick the children.
- A vocabulary task is primary on the definition clause.
- If the task tests something the standards do not contain -- our own teaching material, a market
  practice, a vendor concept -- set none_apply true, return no primary, and say so. That is a legitimate
  answer and better than a loose match.`;

const SYSTEM2 = `You are confirming a shortlist you produced from clause TITLES alone. Now you have the TEXT.

For each candidate decide whether an exam item written for this task could rest its KEY on that passage.

Return JSON only:

{"confirmed":[{"source":"...","clause":"...","reason":"<one line>","confidence":"high"|"medium"|"low"}],
 "dropped":[{"source":"...","clause":"...","why":"<one line: what the text turned out to be>"}]}

RULES.
- Every candidate appears in exactly one of the two lists. Copy source and clause exactly as given.
- KEEP a passage whose text states what the task tests, even if the title was vague.
- DROP a passage whose text turns out to be about something else, or which only mentions the subject
  without stating anything an item could test.
- A passage that merely elaborates or gives guidance on a requirement stated elsewhere is DROPPED unless
  the task is about the guidance itself.
- Judge the TEXT, not the title. The title is what misled you the first time.`;

/* ---------------------------------------------------------------- inputs (no links) */
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const draftPath = join(ROOT, "ISO-TASK-SOURCES-DRAFT.json");
if (!existsSync(draftPath)) {
  console.error("ISO-TASK-SOURCES-DRAFT.json not found -- run draft-iso-task-sources.mjs first");
  process.exitCode = 2; process.exit();
}
const draft = JSON.parse(readFileSync(draftPath, "utf8"));
const certDraft = (draft.certs || []).find((c) => c.cert === CERT);
if (!certDraft) {
  console.error(CERT + " is not in the draft. Known: " +
    (draft.certs || []).map((c) => c.cert).join(", "));
  process.exitCode = 2; process.exit();
}
const STANDARDS = certDraft.standards;

const KEY = requireKey(HERE);
const certRows = await getAll(KEY, "certifications?select=id,code&code=eq." + CERT);
if (!certRows.length) { console.error(CERT + " not found"); process.exitCode = 2; process.exit(); }
const cid = certRows[0].id;
const tasks = (await getAll(KEY,
  "tasks?select=id,certification_id,code,statement,knowledge,skills,abilities&order=code"))
  .filter((t) => t.certification_id === cid);

let conceptsByTask = new Map();
try {
  const tc = await getAll(KEY, "task_concepts?select=task_id,concept_id&order=task_id");
  const cs = await getAll(KEY, "concepts?select=id,name&order=id");
  const nameById = new Map(cs.map((c) => [c.id, c.name]));
  for (const r of tc) {
    if (!conceptsByTask.has(r.task_id)) conceptsByTask.set(r.task_id, []);
    const n = nameById.get(r.concept_id);
    if (n) conceptsByTask.get(r.task_id).push(n);
  }
} catch { /* no task_concepts: the payload omits concepts and the report says so */ }

const byKey = new Map(lib.passages.map((p) => [p.source_id + "|" + p.clause, p]));
/* THE COMPLETE LIST. Every passage of every in-scope standard, in document order, with no cap. */
const inScope = lib.passages.filter((p) => STANDARDS.includes(p.source_id));
const titleList = STANDARDS.map((s) => s + ":\n" + inScope
  .filter((p) => p.source_id === s)
  .map((p) => "  " + p.clause + "  " + String(p.title || "").slice(0, 70))
  .join("\n")).join("\n\n");

/* ============ BLINDNESS ============ */
let linksRead = false;
const PAYLOAD_KEYS = new Set([
  "certification", "standards", "task", "clause_titles", "candidates",
  "code", "statement", "knowledge", "skills", "abilities", "concepts",
  "source", "clause", "title", "text",
]);
function assertBlind(payload) {
  if (linksRead) throw new Error("task_sources was read before a payload was built -- not blind");
  const walk = (v, path) => {
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, path + "[" + i + "]")); return; }
    if (v === null || typeof v !== "object") return;
    for (const k of Object.keys(v)) {
      if (!PAYLOAD_KEYS.has(k)) throw new Error("payload carries undeclared field " + path + "." + k);
      walk(v[k], path + "." + k);
    }
  };
  walk(payload, "payload");
}
function blindnessControls() {
  const fails = [];
  const ok = { certification: "X", standards: ["S"], task: { code: "1.1", statement: "s", concepts: [] },
    clause_titles: "t", candidates: [{ source: "S", clause: "4.1", title: "T",
      text: "Risks accepted by the risk owner shall be recorded. role primary task_sources" }] };
  try { assertBlind(ok); } catch (e) {
    fails.push("a clean payload was refused for words in a passage: " + e.message);
  }
  const bad = JSON.parse(JSON.stringify(ok)); bad.candidates[0].role = "primary";
  let threw = false; try { assertBlind(bad); } catch { threw = true; }
  if (!threw) fails.push("a payload carrying a `role` FIELD was accepted");
  const bad2 = JSON.parse(JSON.stringify(ok)); bad2.reviewed_primary = ["S|4.1"];
  threw = false; try { assertBlind(bad2); } catch { threw = true; }
  if (!threw) fails.push("a payload carrying `reviewed_primary` was accepted");
  linksRead = true; threw = false;
  try { assertBlind(ok); } catch { threw = true; }
  linksRead = false;
  if (!threw) fails.push("a payload built after the links were read was accepted");
  return fails;
}
{
  const f = blindnessControls();
  console.log("blindness controls: 4 case(s), " + f.length + " fail");
  if (f.length) { f.forEach((x) => console.error("   " + x)); process.exitCode = 3; process.exit(); }
}

function payload1(task) {
  return {
    certification: CERT, standards: STANDARDS,
    task: { code: task.code, statement: task.statement, knowledge: task.knowledge,
      skills: task.skills, abilities: task.abilities,
      concepts: conceptsByTask.get(task.id) || [] },
    clause_titles: titleList,
  };
}
function payload2(task, picks) {
  return {
    certification: CERT, standards: STANDARDS,
    task: { code: task.code, statement: task.statement, knowledge: task.knowledge,
      skills: task.skills, abilities: task.abilities,
      concepts: conceptsByTask.get(task.id) || [] },
    candidates: picks.map((c) => ({
      source: c.source, clause: c.clause,
      title: String((byKey.get(c.source + "|" + c.clause) || {}).title || ""),
      text: String((byKey.get(c.source + "|" + c.clause) || {}).text || "").slice(0, 1200),
    })),
  };
}

/* ---------------------------------------------------------------- run */
const RAW = join(ROOT, OUT + "-" + CERT + "-raw.json");
const results = [];
if (FROM) {
  const prior = JSON.parse(readFileSync(join(ROOT, FROM), "utf8"));
  if (prior.cert !== CERT) {
    console.error("that raw file is for " + prior.cert); process.exitCode = 2; process.exit();
  }
  results.push(...prior.results);
  console.log("re-scoring " + results.length + " persisted verdict(s) -- no model call made");
}
for (const t of FROM ? [] : tasks) {
  /* pass 1: titles only, complete list */
  const p1 = payload1(t);
  assertBlind(p1);
  let v1 = null;
  try { v1 = parseObject(await claude(SYSTEM1, JSON.stringify(p1, null, 1), 3000)); }
  catch (e) {
    results.push({ task: t.code, state: "could-not-run", pass: 1, reason: String(e.message).slice(0, 140) });
    process.stdout.write("!"); continue;
  }
  if (!v1 || !Array.isArray(v1.primary)) {
    results.push({ task: t.code, state: "malformed", pass: 1 });
    process.stdout.write("?"); continue;
  }
  /* an address the library does not hold is dropped and reported, never stored */
  const picks = [], invented = [];
  for (const x of v1.primary) {
    if (byKey.has(x.source + "|" + x.clause)) picks.push(x);
    else invented.push(x.source + " " + x.clause);
  }
  if (!picks.length) {
    results.push({ task: t.code, state: "judged", statement: t.statement, pass1: [], primary: [],
      none_apply: !!v1.none_apply, note: v1.note || null, invented, dropped: [] });
    process.stdout.write(v1.none_apply ? "0" : ".");
    writeFileSync(RAW, JSON.stringify({ cert: CERT, ungated: true, results }, null, 1) + "\n", "utf8");
    continue;
  }
  /* pass 2: the TEXT of exactly those picks, confirm or drop */
  const p2 = payload2(t, picks);
  assertBlind(p2);
  let v2 = null;
  try { v2 = parseObject(await claude(SYSTEM2, JSON.stringify(p2, null, 1), 3000)); }
  catch (e) {
    results.push({ task: t.code, state: "could-not-run", pass: 2, pass1: picks,
      reason: String(e.message).slice(0, 140) });
    process.stdout.write("!"); continue;
  }
  const confirmed = (v2 && Array.isArray(v2.confirmed) ? v2.confirmed : [])
    .filter((x) => byKey.has(x.source + "|" + x.clause));
  const dropped = (v2 && Array.isArray(v2.dropped) ? v2.dropped : []);
  results.push({ task: t.code, state: "judged", statement: t.statement,
    pass1: picks.map((x) => x.source + "|" + x.clause),
    primary: confirmed, dropped, none_apply: !!v1.none_apply, note: v1.note || null, invented });
  process.stdout.write(".");
  writeFileSync(RAW, JSON.stringify({ cert: CERT, ungated: true,
    note: "RAW two-pass output, not scored.", results }, null, 1) + "\n", "utf8");
}
process.stdout.write("\n");
if (!FROM) console.log("  raw verdicts persisted to " + RAW);

/* ============ ONLY NOW ARE THE ACCEPTED LINKS READ ============ */
linksRead = true;
const links = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id");
const spRows = await getAll(KEY, "source_passages?select=id,source_id,clause&order=id");
const spById = new Map(spRows.map((r) => [r.id, r]));
const codeById = new Map(tasks.map((t) => [t.id, t.code]));
const accepted = new Map();
for (const l of links) {
  if (l.role !== "primary") continue;
  const code = codeById.get(l.task_id);
  if (!code) continue;
  const p = spById.get(l.passage_id);
  if (!p) continue;
  if (!accepted.has(code)) accepted.set(code, new Set());
  accepted.get(code).add(p.source_id + "|" + p.clause);
}

/* SUBJECT SPINE: strip the annex letter, keep the top two numeric components. A.9.3 -> 9.3,
 * B.9.3.2 -> 9.3, A.9 -> 9, 8.1 -> 8.1. Subject-level recall asks whether the judgment found the
 * right part of the standard, separately from whether it picked the same address within it. */
const spine = (cl) => String(cl).replace(/^[A-D]\./, "").split(".").slice(0, 2).join(".");

let tp = 0, fp = 0, fn = 0, sTP = 0, sFP = 0, sFN = 0;
const missed = [], extra = [];
for (const t of tasks) {
  const R = accepted.get(t.code) || new Set();
  const r = results.find((x) => x.task === t.code);
  const P = new Set(((r && r.primary) || []).map((x) => x.source + "|" + x.clause));
  for (const x of P) { if (R.has(x)) tp++; else { fp++; extra.push(t.code + " -> " + x); } }
  for (const x of R) { if (!P.has(x)) { fn++; missed.push(t.code + " -> " + x); } }
  const RS = new Set([...R].map((k) => spine(k.split("|")[1])));
  const PS = new Set([...P].map((k) => spine(k.split("|")[1])));
  for (const x of PS) { if (RS.has(x)) sTP++; else sFP++; }
  for (const x of RS) { if (!PS.has(x)) sFN++; }
}
const pct = (x) => (100 * x).toFixed(1) + "%";
const recall = (tp + fn) ? tp / (tp + fn) : 0;
const precision = (tp + fp) ? tp / (tp + fp) : 0;
const sRecall = (sTP + sFN) ? sTP / (sTP + sFN) : 0;

/* candidate-set ceiling: with the complete list, every held address was offered, so the ceiling is
 * whatever share of the reviewed set the library holds at all. Stated rather than assumed. */
const heldReviewed = [...accepted.values()].reduce((n, s) =>
  n + [...s].filter((k) => byKey.has(k)).length, 0);
const totalReviewed = [...accepted.values()].reduce((n, s) => n + s.size, 0);

console.log("");
console.log("JUDGED TASK SOURCES 2  " + CERT + "   two-pass, COMPLETE title list, no cap");
console.log("  tasks judged        " + results.filter((r) => r.state === "judged").length +
  "   could-not-run " + results.filter((r) => r.state === "could-not-run").length +
  "   malformed " + results.filter((r) => r.state === "malformed").length);
console.log("  none_apply          " + results.filter((r) => r.none_apply).length);
console.log("  pass 1 picked       " + results.reduce((n, r) => n + ((r.pass1 || []).length), 0));
console.log("  pass 2 confirmed    " + (tp + fp) +
  "   dropped " + results.reduce((n, r) => n + ((r.dropped || []).length), 0));
console.log("");
console.log("  against " + accepted.size + " task(s) with a reviewed mapping, " + (tp + fn) +
  " reviewed primaries:");
console.log("    RECALL             " + pct(recall) + "   (" + tp + " of " + (tp + fn) + ")");
console.log("    PRECISION          " + pct(precision) + "   (" + tp + " of " + (tp + fp) + ")");
console.log("    RECALL, subject    " + pct(sRecall) + "   (" + sTP + " of " + (sTP + sFN) + ")");
console.log("    missed " + missed.length + "   extra " + extra.length);
console.log("  candidate ceiling: " + heldReviewed + " of " + totalReviewed +
  " reviewed primaries are addresses the library holds, and ALL of them were offered.");

const lowConf = [];
for (const r of results) for (const p of r.primary || []) {
  if (p.confidence === "low") lowConf.push({ task: r.task, ...p });
}
console.log("  low-confidence decisions " + lowConf.length);

writeFileSync(join(ROOT, OUT + "-" + CERT + ".json"), JSON.stringify({
  cert: CERT, standards: STANDARDS, model: MODEL, mode: "two-pass, complete title list, no cap",
  blind: true, measured_against_reviewed: accepted.size,
  recall, precision, recall_subject: sRecall, tp, fp, fn,
  missed, extra, low_confidence: lowConf, results,
}, null, 1) + "\n", "utf8");
console.log("  wrote " + OUT + "-" + CERT + ".json");
