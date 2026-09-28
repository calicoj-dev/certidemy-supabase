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
import { standardsFor } from "./lib/iso-cert-standards.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let CERT = null, OUT = "TASK-SOURCE-PROPOSALS2", FROM = null, REDO = null;
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--cert=(.+)$/.exec(a))) { CERT = m[1]; continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  if ((m = /^--from=(.+)$/.exec(a))) { FROM = m[1]; continue; }
  /* --redo re-judges NAMED tasks and keeps every other persisted verdict. The point is that a fix
   * aimed at two tasks is measured by changing those two tasks and nothing else: re-running all 35
   * would move other verdicts through ordinary model variation and make the delta unattributable. */
  if ((m = /^--redo=(.+)$/.exec(a))) { REDO = new Set(m[1].split(",").map((s) => s.trim())); continue; }
  console.error("unknown flag " + JSON.stringify(a) + ". Known: --cert=, --out=, --from=, --redo=");
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
if (!ANTHROPIC_API_KEY && (!FROM || REDO)) {
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
- Choose ONLY from the title list. The clause is the token in SQUARE BRACKETS: from the line '  [6.1.3]  AI risk treatment' the clause is 6.1.3 -- without the brackets and without the title. Copy the source id exactly. Do not invent a clause.
- Be GENEROUS at this stage. You are choosing what to look at, and the text of everything you pick will
  be fetched and shown to you in a second pass where you can drop it. Missing a clause here is permanent;
  including a doubtful one costs only a second look.
- Where a task spans a family of controls, name EVERY member of the family rather than the group heading.
  If the list contains both a group heading and its children, pick the children.
- A vocabulary task is primary on the definition clause.
- If the task tests something the standards do not contain -- our own teaching material, a market
  practice, a vendor concept -- set none_apply true, return no primary, and say so. That is a legitimate
  answer and better than a loose match.`;

/* ============ PASS 2 RETURNS ONLY WHAT IT DROPS ============
 *
 * The first design asked pass 2 to re-emit every candidate in one of two lists, each with a reason.
 * On the three tasks with the most candidates -- 20, 29 and 30 -- it returned nothing parseable, and
 * a retry with an explicit instruction did not help either. Those three plus one malformed pass 1
 * account for **48 of the 55 misses**: excluding them, recall on the other 31 tasks is 93.1 percent.
 *
 * The cause is the output budget. Thirty candidates re-emitted with source, clause, reason and
 * confidence is a long answer, and a truncated JSON object parses to nothing -- so the task scored
 * as "confirmed none" when what happened was "the answer did not fit".
 *
 * Asking for the DROPS alone makes the answer short and bounded by the number of rejections rather
 * than by the number of candidates, and it is the better question anyway: pass 1 already gave a
 * reason for each pick, and pass 2's job is to remove what the TEXT disqualifies. Keep-by-default
 * with an explicit drop list cannot silently lose a candidate -- anything not named is kept, so a
 * short answer now means "few drops" instead of "no verdict". */
const SYSTEM2 = `You are confirming a shortlist you produced from clause TITLES alone. Now you have the TEXT.

For each candidate decide whether an exam item written for this task could rest its KEY on that passage.

Return JSON only, and list ONLY the ones you are DROPPING:

{"dropped":[{"source":"...","clause":"...","why":"<one line: what the text turned out to be>"}]}

RULES.
- ANYTHING YOU DO NOT NAME IS KEPT. Do not echo the candidates you are keeping.
- Copy source and clause exactly as given, for the ones you drop.
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
/* From the shared module, NOT from the ranker.s artifact: the judge does not depend on the ranker
 * having succeeded, and a stale artifact can no longer silently scope this run. */
const STANDARDS = standardsFor(CERT);

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
/* THE COMPLETE LIST. Every passage of every in-scope standard, in document order, with no cap.
 *
 * ============ THE CLAUSE IS DELIMITED, BECAUSE THE FIRST FORMAT LOST THE WHOLE RUN ============
 *
 * The first version printed `  3.4  management system set of interrelated...` -- clause and title
 * separated by spaces -- and told the model to copy the clause "exactly as given". It copied the
 * whole line. Every one of 34 tasks returned addresses like `3.4  management system set of`, none
 * matched a held key, all were classed INVENTED, and the run scored 0.0% recall on 0 proposals.
 *
 * **That was reported as a judgment of 0% and it was a formatting defect in my own prompt.** The
 * reasons and notes in the raw output are sound -- one reads *"the certification-basis concept rests
 * on ISO/IEC 42006, which is not in scope"*, which is correct and useful. The instrument destroyed a
 * working answer and then reported the answer as the failure. */
const inScope = lib.passages.filter((p) => STANDARDS.includes(p.source_id));
const titleList = STANDARDS.map((s) => s + ":\n" + inScope
  .filter((p) => p.source_id === s)
  .map((p) => "  [" + p.clause + "]  " + String(p.title || "").slice(0, 70))
  .join("\n")).join("\n\n");

/* ============ AND INGEST RESOLVES RATHER THAN DEMANDS EXACT EQUALITY ============
 *
 * A delimiter makes the right answer easy; it does not make the wrong answer impossible. So a
 * returned address is RESOLVED against what the library holds -- exact match, else the longest held
 * clause that the string begins with at a token boundary. `3.4  management system set of` resolves
 * to `3.4`; `3.41` never resolves to `3.4`, because the boundary is required.
 *
 * An address that still does not resolve is genuinely invented and is reported as such. The point is
 * that a formatting difference the instrument CAN repair must not be scored as a wrong answer. */
const clausesBySource = new Map();
for (const p of inScope) {
  if (!clausesBySource.has(p.source_id)) clausesBySource.set(p.source_id, []);
  clausesBySource.get(p.source_id).push(p.clause);
}
for (const [, arr] of clausesBySource) arr.sort((a, b) => b.length - a.length);
function resolveClause(source, raw) {
  const held = clausesBySource.get(source);
  if (!held) return null;
  /* a bracketed address is the format we asked for, so unwrap it before matching */
  let s = String(raw == null ? "" : raw).trim().replace(/^\[([^\]]+)\]/, "$1").trim();
  if (!s) return null;
  if (byKey.has(source + "|" + s)) return s;
  for (const c of held) {
    if (s === c) return c;
    if (!s.startsWith(c)) continue;
    /* ============ A DOT IS NOT A BOUNDARY, AND THE CONTROL CAUGHT THAT ============
     *
     * The first boundary set included `.` and `-`, so `6.1.39` resolved to the held `6.1` -- a
     * DIFFERENT clause, silently. That is worse than refusing to resolve: it attaches a proposal to
     * a real address nobody chose. The remainder must start with whitespace or a closing
     * punctuation mark; a dotted or hyphenated continuation means this is a deeper address. */
    if (/^[\s\]:,]/.test(s.slice(c.length))) return c;
  }
  return null;
}
{
  /* BOTH DIRECTIONS, on the live library, before any call is paid for. */
  const fails = [];
  const src = STANDARDS[0];
  const sample = (clausesBySource.get(src) || []).find((c) => /\./.test(c));
  if (!sample) fails.push("no dotted clause in " + src + " to test the resolver against");
  else {
    if (resolveClause(src, sample) !== sample) fails.push("an exact clause did not resolve");
    if (resolveClause(src, sample + "  Some Title Here") !== sample) {
      fails.push("clause+title did not resolve -- the defect that lost the first run");
    }
    if (resolveClause(src, "[" + sample + "]") !== sample) fails.push("a bracketed clause did not resolve");
    if (resolveClause(src, sample + ".9") !== null) fails.push("a DEEPER dotted address resolved to its parent");
    if (resolveClause(src, sample + "9") !== null) fails.push("a LONGER clause resolved to a shorter one");
    if (resolveClause(src, "99.99.99") !== null) fails.push("a genuinely invented clause resolved");
    if (resolveClause("NO SUCH SOURCE", sample) !== null) fails.push("an unknown source resolved");
  }
  console.log("clause-resolver controls: 7 case(s), " + fails.length + " fail");
  if (fails.length) { fails.forEach((f) => console.error("   " + f)); process.exitCode = 3; process.exit(); }
}

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
  if (REDO) {
    const have = new Set(results.map((r) => r.task));
    const unknown = [...REDO].filter((c) => !have.has(c));
    if (unknown.length) {
      console.error("--redo names task(s) not in the raw file: " + unknown.join(", "));
      console.error("  Known: " + [...have].sort().join(", "));
      process.exitCode = 2; process.exit();
    }
    for (let i = results.length - 1; i >= 0; i--) if (REDO.has(results[i].task)) results.splice(i, 1);
    console.log("kept " + results.length + " persisted verdict(s); re-judging " +
      [...REDO].sort().join(", ") + " only");
  } else {
    console.log("re-scoring " + results.length + " persisted verdict(s) -- no model call made");
  }
}
const toRun = FROM ? (REDO ? tasks.filter((t) => REDO.has(t.code)) : []) : tasks;
for (const t of toRun) {
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
    const c = resolveClause(x.source, x.clause);
    if (c) picks.push({ ...x, clause: c, clause_as_returned: x.clause === c ? undefined : x.clause });
    /* the WHOLE object, not a derived string: the first version stored `source + " " + clause` and
     * threw away the reason and confidence, so a re-score could not recover pass 1's work. */
    else invented.push(x);
  }
  if (!picks.length) {
    results.push({ task: t.code, state: "judged", statement: t.statement, pass1: [], primary: [],
      none_apply: !!v1.none_apply, note: v1.note || null, invented, dropped: [] });
    process.stdout.write(v1.none_apply ? "0" : ".");
    writeFileSync(RAW, JSON.stringify({ cert: CERT, ungated: true, results }, null, 1) + "\n", "utf8");
    continue;
  }
  /* ============ PASS 2 IS CHUNKED AT 12, BECAUSE THE LIMIT WAS A SHAPE AND NOT A NUMBER ============
   *
   * Pass 2 failed to answer at all on the tasks with the most candidates -- 20, 29 and 30 in one
   * run; 18 and 32 in the next, after the answer had already been shortened to drops-only. Two
   * different sizes, same failure, so raising `max_tokens` a third time would have been fitting a
   * number to the last instance rather than removing the dependency.
   *
   * Twelve candidates per call bounds the work per call by construction. The chunks are independent
   * -- a drop is a judgement about one passage against the task, not against its neighbours -- so
   * the union of the drops is the same verdict the whole list would have produced, and a chunk that
   * fails to answer costs only its own twelve.
   *
   * A chunk that does not answer is STILL the third state. Its candidates are neither kept nor
   * dropped; they are recorded as unanswered, because confirming twelve picks nobody judged would
   * replace losing an answer with inventing one. */
  const CHUNK = 12;
  const chunks = [];
  for (let i = 0; i < picks.length; i += CHUNK) chunks.push(picks.slice(i, i + CHUNK));
  const dropped = [];
  const answered = [];               /* picks that belong to a chunk pass 2 actually answered */
  let chunkFailures = 0;
  for (const part of chunks) {
    const p2 = payload2(t, part);
    assertBlind(p2);
    let v2 = null;
    try { v2 = parseObject(await claude(SYSTEM2, JSON.stringify(p2, null, 1), 3000)); }
    catch { v2 = null; }
    if (!v2 || !Array.isArray(v2.dropped)) { chunkFailures++; continue; }
    dropped.push(...v2.dropped);
    answered.push(...part);
  }
  const pass2Answered = chunkFailures === 0;
  const dropKeys = new Set(dropped
    .map((x) => { const c = resolveClause(x.source, x.clause); return c ? x.source + "|" + c : null; })
    .filter(Boolean));
  const confirmed = answered.filter((x) => !dropKeys.has(x.source + "|" + x.clause));
  results.push({ task: t.code, state: pass2Answered ? "judged" : "pass2-unanswered",
    statement: t.statement,
    pass1: picks.map((x) => x.source + "|" + x.clause),
    primary: confirmed, dropped, pass2Answered,
    chunks: chunks.length, chunk_failures: chunkFailures,
    unjudged: picks.length - answered.length,
    none_apply: !!v1.none_apply, note: v1.note || null, invented });
  process.stdout.write(chunkFailures ? "x" : ".");
  writeFileSync(RAW, JSON.stringify({ cert: CERT, ungated: true,
    note: "RAW two-pass output, not scored.", results }, null, 1) + "\n", "utf8");
}
process.stdout.write("\n");
if (!FROM || REDO) console.log("  raw verdicts persisted to " + RAW);

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

/* ============ CONTAINER-EQUIVALENT SCORING ============
 *
 * Ruled 2026-09-28: a proposed PARENT counts as covering its reviewed CHILDREN, by the same rule
 * `gateClauseExists` uses. That rule is ONE LEVEL DOWN -- `k.startsWith(c + ".")` with the remainder
 * a single numeric segment -- so `9.2` resolves through `9.2.1` and never through an unrelated `9.20`.
 *
 * THE RULING'S TWO HALVES DO NOT AGREE ON EVERY CASE, AND THAT IS REPORTED RATHER THAN RESOLVED
 * QUIETLY. "Covering its reviewed children" reads as any descendant; "the same rule gateClauseExists
 * uses" pins it to one level. Task 5.5's reviewed leaves are `9.6.3.2.1` and friends, which are TWO
 * and THREE levels below the `9.6.3` the judgment proposed -- so the two readings give different
 * answers on exactly the task that decides the gate.
 *
 * The named MECHANISM is the headline, because a mechanism is a smaller claim than an intent. The
 * transitive figure is computed and printed beside it so the choice is visible and yours, and a
 * strict figure is kept so neither can be mistaken for the other.
 *
 * The SAME source is required on both sides. A clause address is not a key -- 27001 `7.2` is not
 * 42001 `7.2` -- and this repository has seven live collisions from keying on the clause alone. */
const childOneLevel = (parentKey, childKey) => {
  const [ps, pc] = String(parentKey).split("|");
  const [cs, cc] = String(childKey).split("|");
  if (ps !== cs || !cc.startsWith(pc + ".")) return false;
  return /^\d+$/.test(cc.slice(pc.length + 1));
};
const childAnyDepth = (parentKey, childKey) => {
  const [ps, pc] = String(parentKey).split("|");
  const [cs, cc] = String(childKey).split("|");
  if (ps !== cs || !cc.startsWith(pc + ".")) return false;
  return /^\d+(?:\.\d+)*$/.test(cc.slice(pc.length + 1));
};
{
  /* both directions, before any number is printed */
  const fails = [];
  if (!childOneLevel("S|9.2", "S|9.2.1")) fails.push("one level: 9.2 should cover 9.2.1");
  if (childOneLevel("S|9.2", "S|9.2.1.1")) fails.push("one level: 9.2 must NOT cover 9.2.1.1");
  if (childOneLevel("S|9.2", "S|9.20")) fails.push("one level: 9.2 must NOT cover 9.20");
  if (childOneLevel("A|9.2", "B|9.2.1")) fails.push("one level: a different SOURCE must not match");
  if (!childAnyDepth("S|9.6.3", "S|9.6.3.2.1")) fails.push("any depth: 9.6.3 should cover 9.6.3.2.1");
  if (childAnyDepth("S|9.6.3", "S|9.6.30")) fails.push("any depth: 9.6.3 must NOT cover 9.6.30");
  console.log("container-equivalence controls: 6 case(s), " + fails.length + " fail");
  if (fails.length) { fails.forEach((f) => console.error("   " + f)); process.exitCode = 3; process.exit(); }
}

/** Score one task under a given child predicate. `null` = strict, address equality only. */
function scoreTask(R, P, childPred) {
  const foundReviewed = new Set();
  const usefulProposals = new Set();
  for (const x of P) {
    if (R.has(x)) { foundReviewed.add(x); usefulProposals.add(x); continue; }
    if (!childPred) continue;
    for (const r of R) {
      if (childPred(x, r)) { foundReviewed.add(r); usefulProposals.add(x); }
    }
  }
  return {
    tp: foundReviewed.size,
    fp: [...P].filter((x) => !usefulProposals.has(x)).length,
    fn: [...R].filter((x) => !foundReviewed.has(x)).length,
    missed: [...R].filter((x) => !foundReviewed.has(x)),
    extra: [...P].filter((x) => !usefulProposals.has(x)),
  };
}

let tp = 0, fp = 0, fn = 0, sTP = 0, sFP = 0, sFN = 0;
const strict = { tp: 0, fp: 0, fn: 0 };
const deep = { tp: 0, fp: 0, fn: 0 };
const missed = [], extra = [];
for (const t of tasks) {
  const R = accepted.get(t.code) || new Set();
  const r = results.find((x) => x.task === t.code);
  const P = new Set(((r && r.primary) || []).map((x) => x.source + "|" + x.clause));

  const s0 = scoreTask(R, P, null);
  strict.tp += s0.tp; strict.fp += s0.fp; strict.fn += s0.fn;
  const s1 = scoreTask(R, P, childOneLevel);
  tp += s1.tp; fp += s1.fp; fn += s1.fn;
  s1.missed.forEach((x) => missed.push(t.code + " -> " + x));
  s1.extra.forEach((x) => extra.push(t.code + " -> " + x));
  const s2 = scoreTask(R, P, childAnyDepth);
  deep.tp += s2.tp; deep.fp += s2.fp; deep.fn += s2.fn;

  const RS = new Set([...R].map((k) => spine(k.split("|")[1])));
  const PS = new Set([...P].map((k) => spine(k.split("|")[1])));
  for (const x of PS) { if (RS.has(x)) sTP++; else sFP++; }
  for (const x of RS) { if (!PS.has(x)) sFN++; }
}
const pct = (x) => (100 * x).toFixed(1) + "%";
const recall = (tp + fn) ? tp / (tp + fn) : 0;
const precision = (tp + fp) ? tp / (tp + fp) : 0;
const sRecall = (sTP + sFN) ? sTP / (sTP + sFN) : 0;

/* ============ THE CEILING IS MEASURED AGAINST WHAT WAS OFFERED, NOT AGAINST THE LIBRARY ============
 *
 * The first version tested `byKey.has(k)` -- membership of the WHOLE library -- and printed *"150 of
 * 150 reviewed primaries are addresses the library holds, and ALL of them were offered."* That second
 * clause was false. AIMS-F's scoped standard list is ISO/IEC 42001 alone, and 24 of its reviewed
 * primaries are ISO/IEC 17021-1 and ISO/IEC 42006 addresses. The library holds them; the title list
 * this run showed the judge did not.
 *
 * So the instrument asserted the absence of the exact ceiling it was built to remove, because the
 * claim was computed over the wrong population. That is this repository's most-recorded defect
 * arriving inside the fix for a previous instance of it. The ceiling is now computed against
 * `inScopeKeys`, and OUT-OF-SCOPE reviewed primaries are reported as their own state -- they are not
 * misses by the judgment, they are a gap in the scoped source list. */
const inScopeKeys = new Set(inScope.map((p) => p.source_id + "|" + p.clause));
const totalReviewed = [...accepted.values()].reduce((n, s) => n + s.size, 0);
const offerable = [...accepted.values()].reduce((n, s) =>
  n + [...s].filter((k) => inScopeKeys.has(k)).length, 0);
const outOfScope = [];
for (const [code, s] of accepted) {
  for (const k of s) if (!inScopeKeys.has(k)) outOfScope.push(code + " -> " + k);
}
const oosSources = [...new Set(outOfScope.map((s) => s.split(" -> ")[1].split("|")[0]))];

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
console.log("    RECALL             " + pct(recall) + "   (" + tp + " of " + (tp + fn) + ")" +
  "   <- container-equivalent, one level (the ruled mechanism)");
console.log("    PRECISION          " + pct(precision) + "   (" + tp + " of " + (tp + fp) + ")");
console.log("    RECALL, subject    " + pct(sRecall) + "   (" + sTP + " of " + (sTP + sFN) + ")");
console.log("");
console.log("    the same run under the other two readings, so the choice is visible:");
console.log("      STRICT   address equality only        recall " +
  pct(strict.tp / (strict.tp + strict.fn)) + "   precision " + pct(strict.tp / (strict.tp + strict.fp)));
console.log("      ONE LEVEL gateClauseExists' own rule  recall " +
  pct(tp / (tp + fn)) + "   precision " + pct(tp / (tp + fp)));
console.log("      ANY DEPTH a parent covers any child   recall " +
  pct(deep.tp / (deep.tp + deep.fn)) + "   precision " + pct(deep.tp / (deep.tp + deep.fp)));
console.log("    missed " + missed.length + "   extra " + extra.length);
console.log("");
console.log("  CEILING: " + offerable + " of " + totalReviewed +
  " reviewed primaries are in the scoped title list and were therefore offered.");
if (outOfScope.length) {
  const offRecall = offerable ? (tp / offerable) : 0;
  console.log("  OUT OF SCOPE: " + outOfScope.length + " reviewed primar" +
    (outOfScope.length === 1 ? "y is" : "ies are") + " NOT in this certification's source list -- " +
    oosSources.join(", "));
  console.log("    These could not be proposed however good the judgment is. They are a gap in the");
  console.log("    SCOPED SOURCE LIST, not a miss. Recall against what was offerable: " + pct(offRecall) +
    " (" + tp + " of " + offerable + ")");
}
/* ============ PASS 2 MUST ACCOUNT FOR EVERY CANDIDATE PASS 1 GAVE IT ============
 *
 * SYSTEM2 says every candidate appears in exactly one of the two lists, and nothing checked it. On
 * the first real run **93 of 469 picks vanished without a verdict across 4 tasks** -- task 4.3 handed
 * pass 2 twenty-six candidates and got back zero confirmed and zero dropped, which scored as ten
 * misses. A silent empty answer was read as "nothing qualifies" when it means "pass 2 did not
 * answer", which is the third state this repository keeps having to re-learn. */
const unaccounted = [];
for (const r of results) {
  const p1 = (r.pass1 || []).length;
  if (!p1) continue;
  if (r.pass2Answered === false) unaccounted.push({ task: r.task, offered: p1, accounted: 0 });
}
if (unaccounted.length) {
  console.log("");
  console.log("  PASS 2 DID NOT ACCOUNT FOR EVERY CANDIDATE -- " + unaccounted.length + " task(s), " +
    unaccounted.reduce((n, u) => n + (u.offered - u.accounted), 0) + " pick(s) with no verdict:");
  for (const u of unaccounted) {
    console.log("    " + u.task + "  offered " + u.offered + ", accounted " + u.accounted);
  }
  console.log("    A pick with no verdict is NOT a rejection. These tasks are UNDER-MEASURED and the");
  console.log("    recall above is a FLOOR for them.");
}

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
