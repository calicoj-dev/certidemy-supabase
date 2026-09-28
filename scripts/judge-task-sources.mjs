#!/usr/bin/env node
/**
 * judge-task-sources.mjs -- decide each task's PRIMARY passages by judgment, with a reason and a
 * confidence per decision, and measure the judgment against AIMS-F's reviewed mapping BEFORE trusting it.
 *
 * Writes JSON and markdown proposals. **It never writes `task_sources`.** Unknown flags exit 2.
 *
 *   --cert=AIMS-F            required; AIMS-F is the control
 *   --top=25                 candidates shown per task
 *   --out=TASK-SOURCE-PROPOSALS
 *
 * ============ BLIND, AND THE BLINDNESS IS ASSERTED ============
 *
 * AIMS-F already has 150 reviewed `primary` links. The whole point of running on it is to find out whether
 * judgment reproduces them, so those links must not reach the prompt -- and "must not" is worth nothing
 * without a check. So:
 *
 *   the payload is built by a function that is NEVER PASSED the links;
 *   `task_sources` is read only AFTER every model call has returned;
 *   `assertBlind` re-reads each finished payload and throws if it carries any field that could only have
 *   come from the accepted set.
 *
 * This repository already records why: an agreement from a solver that could see the key is worth nothing,
 * and nothing about the output would look wrong.
 *
 * ============ WHAT PRECISION AGAINST A HUMAN SET DOES AND DOES NOT MEAN ============
 *
 * Recall is straightforward: a reviewed primary the judgment did not propose is a miss.
 *
 * Precision is asymmetric and the report says so. A proposal the human set does not contain is scored as a
 * false positive, but it may be a passage the human simply did not link -- the reviewed set is a floor on
 * what is correct, not a ceiling. So every disagreement is LISTED rather than only counted, in both
 * directions, and the precision figure is read with that caveat rather than as an error rate.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let CERT = null, TOP = 25, OUT = "TASK-SOURCE-PROPOSALS", FROM = null;
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--cert=(.+)$/.exec(a))) { CERT = m[1]; continue; }
  if ((m = /^--top=(\d+)$/.exec(a))) { TOP = Number(m[1]); continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  if ((m = /^--from=(.+)$/.exec(a))) { FROM = m[1]; continue; }
  console.error("unknown flag " + JSON.stringify(a) + ". Known: --cert=, --top=, --out=, --from=");
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
if (!ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY not found"); process.exitCode = 2; process.exit(); }
const MODEL = process.env.GROUNDED_MODEL || "claude-opus-5";

async function claude(system, user, maxTokens = 2500) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
      });
      if (!res.ok) throw new Error("Anthropic " + res.status + ": " + (await res.text()).slice(0, 200));
      const d = await res.json();
      return (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    } catch (e) {
      if (attempt >= 3) throw e;
      await new Promise((r) => setTimeout(r, 900 * attempt));
    }
  }
}
const parseObject = (t) => {
  const s = String(t || ""); const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; }
};

const SYSTEM = `You decide which passages of a published standard a certification TASK is examined against.

You are given the task's statement and its knowledge, skills and abilities; the concepts it assesses; the
full list of clause titles for the standard or standards in scope; and a ranked shortlist of candidate
passages with their text.

Return JSON only:

{"primary":[{"source":"<source id exactly as given>","clause":"<clause exactly as given>",
             "reason":"<one line: why this passage is what the task examines>",
             "confidence":"high"|"medium"|"low"}],
 "supporting":[{"source":"...","clause":"...","reason":"..."}],
 "none_apply": false,
 "note":"<one line, only if something needs saying>"}

PRIMARY means: an item written for this task should be able to rest its key on this passage. The passage
states the thing the task tests.

SUPPORTING means: relevant context a distractor might draw on, but not what the task is about.

RULES.
- Choose from the candidates and the clause-title list. Do not invent a clause.
- A task usually has between 1 and 6 primaries. Many is acceptable where the task genuinely spans a set of
  controls; one is acceptable where it is about one clause.
- Prefer the clause that STATES the requirement over one that merely mentions the subject. Guidance
  elaborating a requirement is SUPPORTING unless the task is about the guidance itself.
- A vocabulary task is primary on the definition clause.
- If the task tests something the standards do not contain -- our own teaching material, a market practice,
  a vendor concept -- set none_apply true, return no primary, and say so in the note. That is a legitimate
  answer and is better than a loose match.
- confidence "low" means you are guessing between plausible options; say why in the reason.`;

/* ---------------------------------------------------------------- inputs (no links) */
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const draftPath = join(ROOT, "ISO-TASK-SOURCES-DRAFT.json");
if (!existsSync(draftPath)) {
  console.error("ISO-TASK-SOURCES-DRAFT.json not found -- run draft-iso-task-sources.mjs first");
  process.exitCode = 2; process.exit();
}
const draft = JSON.parse(readFileSync(draftPath, "utf8"));
const certDraft = (draft.certs || []).find((c) => c.cert === CERT);
if (!certDraft) { console.error(CERT + " not in the draft"); process.exitCode = 2; process.exit(); }
const STANDARDS = certDraft.standards;

const KEY = requireKey(HERE);
const certRows = await getAll(KEY, "certifications?select=id,code&code=eq." + CERT);
if (!certRows.length) { console.error(CERT + " not found"); process.exitCode = 2; process.exit(); }
const cid = certRows[0].id;
const tasks = (await getAll(KEY,
  "tasks?select=id,certification_id,code,statement,knowledge,skills,abilities&order=code"))
  .filter((t) => t.certification_id === cid);

/* Concepts per task, through the task_concepts link if present. */
let conceptsByTask = new Map();
try {
  const tc = await getAll(KEY, "task_concepts?select=task_id,concept_id&order=task_id");
  const ids = [...new Set(tc.map((r) => r.concept_id))];
  const cs = ids.length ? await getAll(KEY, "concepts?select=id,name&order=id") : [];
  const nameById = new Map(cs.map((c) => [c.id, c.name]));
  for (const r of tc) {
    if (!conceptsByTask.has(r.task_id)) conceptsByTask.set(r.task_id, []);
    const n = nameById.get(r.concept_id);
    if (n) conceptsByTask.get(r.task_id).push(n);
  }
} catch { /* no task_concepts table: the payload simply omits concepts, and the report says so */ }

const byKey = new Map(lib.passages.map((p) => [p.source_id + "|" + p.clause, p]));
const titleList = STANDARDS.map((s) => s + ":\n" + lib.passages
  .filter((p) => p.source_id === s)
  .map((p) => "  " + p.clause + "  " + String(p.title || "").slice(0, 70))
  .join("\n")).join("\n\n");

/* ============ THE PAYLOAD BUILDER NEVER RECEIVES THE LINKS ============ */
function buildPayload(task, candidates) {
  return {
    certification: CERT,
    standards: STANDARDS,
    task: {
      code: task.code, statement: task.statement,
      knowledge: task.knowledge, skills: task.skills, abilities: task.abilities,
      concepts: conceptsByTask.get(task.id) || [],
    },
    clause_titles: titleList,
    candidates: candidates.map((c) => ({
      source: c.source, clause: c.clause, title: c.title,
      text: String((byKey.get(c.source + "|" + c.clause) || {}).text || "").slice(0, 700),
    })),
  };
}
/* ============ THE GUARD MATCHES STRUCTURE, NEVER ENGLISH ============
 *
 * The first version searched the SERIALISED payload for the strings `accepted`, `"role"` and `"primary":`,
 * and aborted the run on task 28 of 35 because a 42001 passage contains the ordinary English word
 * *accepted* -- risk acceptance, accepted by the risk owner. Twenty-six completed model calls went with it.
 *
 * That is verbatim the defect this repository already records against `assertBlind` in the grounded gates,
 * where a distractor containing the word *explanation* aborted a 40-item pilot, and against a migration
 * guard matching `to anon` inside a comment saying *no grant to anon*. **The property is never lexical.**
 *
 * Blindness here is two structural facts, and both are checked:
 *
 *   (1) the payload's PROPERTY NAMES are exactly the declared set -- a link-derived field cannot arrive
 *       without a name, and a name is not English prose;
 *   (2) the accepted set has not been READ YET. `linksRead` is set at the one site that reads
 *       `task_sources`, so an ordering mistake is caught even if it smuggled nothing into the payload.
 *
 * (2) is the stronger half: it holds whatever the payload looks like, and it is the actual hypothesis --
 * the run is blind because the links do not exist in this process until every call has returned. */
let linksRead = false;
const PAYLOAD_KEYS = new Set([
  "certification", "standards", "task", "clause_titles", "candidates",
  "code", "statement", "knowledge", "skills", "abilities", "concepts",
  "source", "clause", "title", "text",
]);
function assertBlind(payload) {
  if (linksRead) throw new Error("task_sources was read before a payload was built -- the run is not blind");
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

/** Both directions, run before any model call is paid for. */
function blindnessControls() {
  const fails = [];
  const ok = { certification: "X", standards: ["S"], task: { code: "1.1", statement: "s", concepts: [] },
    clause_titles: "t", candidates: [{ source: "S", clause: "4.1", title: "T",
      text: "Risks accepted by the risk owner shall be recorded. role primary task_sources" }] };
  try { assertBlind(ok); } catch (e) {
    fails.push("a clean payload was refused for words in a passage: " + e.message);
  }
  const bad = JSON.parse(JSON.stringify(ok));
  bad.candidates[0].role = "primary";
  let threw = false;
  try { assertBlind(bad); } catch { threw = true; }
  if (!threw) fails.push("a payload carrying a `role` FIELD was accepted");
  const bad2 = JSON.parse(JSON.stringify(ok));
  bad2.reviewed_primary = ["S|4.1"];
  threw = false;
  try { assertBlind(bad2); } catch { threw = true; }
  if (!threw) fails.push("a payload carrying `reviewed_primary` was accepted");
  linksRead = true;
  threw = false;
  try { assertBlind(ok); } catch { threw = true; }
  linksRead = false;
  if (!threw) fails.push("a payload built after the links were read was accepted");
  return fails;
}
const bFails = blindnessControls();
if (bFails.length) {
  console.error("BLINDNESS CONTROLS FAILED -- nothing run:");
  bFails.forEach((f) => console.error("   " + f));
  process.exitCode = 3; process.exit();
}
console.log("blindness controls: 4 case(s), 0 fail");

/* ============ THE MODEL CALLS ARE PERSISTED AS THEY LAND ============
 *
 * The lexical guard above killed this run on task 28 and threw away twenty-six completed calls -- the same
 * loss the grounded pilot took, where the fix was to write raw output BEFORE any gate runs. Generation is
 * the expensive, unrepeatable half; scoring is cheap and repeatable. So each verdict is appended to
 * `<out>-<cert>-raw.json` the moment it returns, and `--from=<file>` re-scores that file without paying for
 * the model again -- which is also how a changed scorer gets run on the OLD input, one thing at a time. */
const RAW = join(ROOT, OUT + "-" + CERT + "-raw.json");
const results = [];
let unrun = 0;
if (FROM) {
  const prior = JSON.parse(readFileSync(join(ROOT, FROM), "utf8"));
  if (prior.cert !== CERT) {
    console.error("that raw file is for " + prior.cert + ", not " + CERT); process.exitCode = 2; process.exit();
  }
  results.push(...prior.results);
  unrun = results.filter((r) => r.state === "could-not-run").length;
  console.log("re-scoring " + results.length + " persisted verdict(s) from " + FROM + " -- no model call made");
}
for (const t of FROM ? [] : tasks) {
  const row = (certDraft.rows || []).find((r) => r.task === t.code);
  const cands = (row ? row.cand : []).slice(0, TOP);
  const payload = buildPayload(t, cands);
  assertBlind(payload);
  let v = null;
  try {
    v = parseObject(await claude(SYSTEM, JSON.stringify(payload, null, 1), 2500));
  } catch (e) {
    unrun++;
    results.push({ task: t.code, state: "could-not-run", reason: String(e.message).slice(0, 140) });
    process.stdout.write("!");
    continue;
  }
  if (!v || !Array.isArray(v.primary)) {
    results.push({ task: t.code, state: "malformed" });
    process.stdout.write("?");
    continue;
  }
  /* A proposal naming a clause the library does not hold is dropped and reported, never stored. */
  const keep = [], invented = [];
  for (const x of v.primary) {
    if (byKey.has(x.source + "|" + x.clause)) keep.push(x); else invented.push(x.source + " " + x.clause);
  }
  results.push({
    task: t.code, state: "judged", statement: t.statement,
    primary: keep, supporting: (v.supporting || []).filter((x) => byKey.has(x.source + "|" + x.clause)),
    none_apply: !!v.none_apply, note: v.note || null, invented,
    candidatesShown: cands.length,
  });
  process.stdout.write(".");
  writeFileSync(RAW, JSON.stringify({ cert: CERT, top: TOP, ungated: true,
    note: "RAW MODEL OUTPUT, not scored and not a result. Re-score with --from.",
    results }, null, 1) + "\n", "utf8");
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

let tp = 0, fp = 0, fn = 0;
const missed = [], extra = [];
for (const r of results.filter((x) => x.state === "judged")) {
  const want = accepted.get(r.task) || new Set();
  const got = new Set(r.primary.map((x) => x.source + "|" + x.clause));
  for (const g of got) {
    if (want.has(g)) tp++; else { fp++; extra.push(r.task + " -> " + g); }
  }
  for (const w of want) if (!got.has(w)) { fn++; missed.push(r.task + " -> " + w); }
}
const recall = tp + fn ? tp / (tp + fn) : null;
const precision = tp + fp ? tp / (tp + fp) : null;

const pct = (x) => (x === null ? "n/a" : (100 * x).toFixed(1) + "%");
console.log("");
console.log("JUDGED TASK SOURCES  " + CERT + "   blind, candidates shown " + TOP);
console.log("  tasks judged        " + results.filter((r) => r.state === "judged").length +
  "   could-not-run " + unrun + "   malformed " + results.filter((r) => r.state === "malformed").length);
console.log("  none_apply          " + results.filter((r) => r.none_apply).length);
console.log("  primaries proposed  " + (tp + fp));
if (accepted.size) {
  console.log("  against " + accepted.size + " task(s) with a reviewed mapping, " + (tp + fn) + " reviewed primaries:");
  console.log("    RECALL     " + pct(recall) + "   (" + tp + " of " + (tp + fn) + ")");
  console.log("    PRECISION  " + pct(precision) + "   (" + tp + " of " + (tp + fp) + ")");
  console.log("    missed " + missed.length + "   extra " + extra.length);
} else {
  console.log("  no reviewed mapping for this certification -- nothing to measure against");
}
const lowConf = results.filter((r) => r.state === "judged")
  .flatMap((r) => r.primary.filter((x) => x.confidence === "low").map((x) => ({ task: r.task, ...x })));
console.log("  low-confidence decisions " + lowConf.length);

writeFileSync(join(ROOT, OUT + "-" + CERT + ".json"), JSON.stringify({
  cert: CERT, standards: STANDARDS, model: MODEL, candidates_shown: TOP, blind: true,
  measured_against_reviewed: accepted.size > 0,
  recall, precision, tp, fp, fn, missed, extra, low_confidence: lowConf, results,
}, null, 1) + "\n", "utf8");
console.log("  wrote " + OUT + "-" + CERT + ".json");
