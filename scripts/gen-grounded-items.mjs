/**
 * gen-grounded-items.mjs -- the grounded item path. A NEW PATH BESIDE gen-cert-secure.mjs,
 * which is untouched. Nothing in the live bank is replaced by this script.
 *
 * ============ WHAT IS DIFFERENT FROM THE OLD PATH ============
 *
 * GENERATOR-SOURCE-ACCESS.md measured the old one: it never opens a source document. Every
 * clause number in 12,462 secure rows was written from recall, and four gates run before
 * insert of which none compares a claim to a source.
 *
 * Here the generator is GIVEN the full text of the passages its task is examined against,
 * and every item it writes must carry:
 *
 *   key_support          a sentence copied EXACTLY from one of those passages
 *   key_support_clause   which passage it came from
 *   distractor_support   per distractor, a short reason with the same kind of anchor
 *
 * Then code decides, and a blind model decides, and neither is the writer:
 *
 *   six CODE gates        scripts/lib/grounded-gates.mjs -- no model involved
 *   one BLIND solver      scripts/lib/blind-solver.mjs -- sees the passages and the item,
 *                         never the key, the explanation or the generation context
 *
 * Survivors land as status='draft'. NEVER approved. Approval for the secure pool is a
 * separate human step, and `generate-mock-exam` filters `status = 'approved'` -- read from
 * its source, not assumed -- so a draft cannot reach any form, exam or simulator.
 *
 * ============ FLAGS ============
 *
 *   --cert=AIMS-F   the certification (default AIMS-F)
 *   --n=40          how many items to attempt across the blueprint
 *   --apply         WRITE the survivors. DRY BY DEFAULT.
 *   --out=FILE      where the artifact goes (default PILOT-GROUNDED-<CERT>.json)
 *
 * Unknown flags exit 2 and the error names both flag conventions in this directory.
 *
 * A DRY RUN OF A GENERATOR IS A SAMPLE, NOT A PREVIEW -- this repository records that, and
 * it is true here too: a second invocation generates different items. What makes the dry
 * run worth anything is that it PERSISTS what it generated, so the items reported are the
 * items measured. `--apply` then inserts THAT artifact rather than generating afresh, which
 * is the generate-once-then-persist shape the old generators do not have.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { runCodeGates } from "./lib/grounded-gates.mjs";
import { blindPayload, assertBlind, solverUser, solverVerdict, SOLVER_SYSTEM, blindSolverControls } from "./lib/blind-solver.mjs";
import { groundedGateControls } from "./lib/grounded-gates.mjs";
import { supersededControls } from "./lib/superseded-wording.mjs";
import { cueConfigFor } from "../functions/_shared/item-rules/item-cue-guard.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

let CERT = "AIMS-F", N = 40, APPLY = false, OUT = null, FROM = null, ONLY = null;
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--cert=(.+)$/.exec(a))) { CERT = m[1]; continue; }
  if ((m = /^--n=(\d+)$/.exec(a))) { N = Number(m[1]); continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  if ((m = /^--from=(.+)$/.exec(a))) { FROM = m[1]; continue; }
  /* --tasks=5.4,5.5 generates ONE item for each named task and ignores the weight
   * allocation. It exists because a network outage cost eight of forty writer calls, and
   * regenerating all forty to recover eight would mix a fresh sample with a kept one for no
   * reason. Topping up the named tasks keeps every item generated against the same library
   * and the same mapping, which is the property that matters. */
  if ((m = /^--tasks=(.+)$/.exec(a))) { ONLY = m[1].split(",").map((s) => s.trim()).filter(Boolean); continue; }
  if (a === "--apply") { APPLY = true; continue; }
  console.error("unknown flag " + JSON.stringify(a));
  console.error("");
  console.error("THIS DIRECTORY HAS TWO OPPOSITE FLAG CONVENTIONS:");
  console.error("  --apply family  dry by default, --apply writes   <- this script");
  console.error("  --dry family    LIVE by default, --dry is safe");
  console.error("A flag someone believed in that silently did nothing is how a generator runs live.");
  process.exitCode = 2; process.exit();
}
OUT = OUT || ("PILOT-GROUNDED-" + CERT.replace(/[^A-Za-z0-9-]/g, "") + ".json");

const MODEL = process.env.GROUNDED_MODEL || "claude-opus-5";

/* ---------------------------------------------------------------- the controls run first */
{
  const a = groundedGateControls(), b = blindSolverControls(), c = supersededControls();
  const fails = [...a.fails, ...b.fails, ...c.fails];
  console.log("CONTROLS BEFORE ANYTHING ELSE  " + (a.examined + b.examined + c.examined) + " cases");
  if (fails.length) {
    console.error("REFUSING TO RUN -- the gates' own controls fail:");
    for (const f of fails) console.error("  " + f);
    process.exitCode = 2; process.exit();
  }
  console.log("  gates " + a.examined + ", solver " + b.examined + ", superseded " + c.examined + " -- all pass");
}

function env(k) {
  const p = join(HERE, ".env");
  if (existsSync(p)) {
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (m && m[1] === k && !process.env[k]) return m[2].replace(/^["']|["']$/g, "").trim();
    }
  }
  return process.env[k];
}
const ANTHROPIC_API_KEY = env("ANTHROPIC_API_KEY");
if (!ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY not found (scripts/.env or env)"); process.exitCode = 2; process.exit(); }

/* NO `temperature`. The API rejects it for this model family with a 400, and the first run
 * of this script lost every item to that -- reported, correctly, as "writer could not run"
 * rather than as items the gates refused. Sampling is not something this path needs to
 * control: the blind solver and the code gates decide, not the writer's variance. */
async function claude(system, user, maxTokens = 4000) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
      });
      if (!res.ok) throw new Error("Anthropic " + res.status + ": " + (await res.text()).slice(0, 300));
      const data = await res.json();
      return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    } catch (e) {
      /* A read retry is safe; there is no write on this path. */
      if (attempt >= 3) throw e;
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }
}
function parseObject(text) {
  const t = String(text || "");
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
}
function parseArray(text) {
  const t = String(text || "");
  const a = t.indexOf("["), b = t.lastIndexOf("]");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
}

/* ---------------------------------------------------------------- inputs */
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const mapPath = join(ROOT, CERT + "-TASK-SOURCES.json");
if (!existsSync(mapPath)) {
  console.error("no mapping at " + mapPath + " -- run draft-" + CERT.toLowerCase() + "-task-sources.mjs first");
  process.exitCode = 3; process.exit();
}
const mapping = JSON.parse(readFileSync(mapPath, "utf8"));
const passagesByKey = new Map(lib.passages
  .filter((p) => p.source_id === mapping.standard && p.edition === mapping.edition)
  .map((p) => [p.clause, p]));
const annexGaps = lib.annex_gaps || [];
const sequenceGaps = lib.sequence_gaps || [];

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code,num_questions,exam_blueprint&code=eq." + CERT);
if (!certs.length) { console.error(CERT + " not found"); process.exitCode = 2; process.exit(); }
const cert = certs[0];
const allDomains = await getAll(KEY, "domains?select=id,certification_id,code,title,weight_pct&order=code");
const domains = allDomains.filter((d) => d.certification_id === cert.id);
const allTasks = await getAll(KEY, "tasks?select=id,certification_id,domain_id,code,statement,knowledge,skills,abilities,bloom_level,is_exam_scope&order=code");
const tasks = allTasks.filter((t) => t.certification_id === cert.id);
const domById = new Map(domains.map((d) => [d.id, d]));

/* Live English stems per task, for the near-duplicate gate. Narrow columns: the wide read
 * on this table times out. */
const liveRows = await getAll(KEY,
  "quiz_questions?select=id,task_id,question_text,pool,status&certification_id=eq." + cert.id +
  "&language=eq.en&retired_at=is.null&order=id");
const liveByTask = new Map();
for (const r of liveRows) {
  if (!liveByTask.has(r.task_id)) liveByTask.set(r.task_id, []);
  liveByTask.get(r.task_id).push({ id: String(r.id).slice(0, 8), stem: r.question_text || "" });
}

/* ---------------------------------------------------------------- allocation
 * ACROSS THE BLUEPRINT, BY DOMAIN WEIGHT, largest remainder -- the same basis
 * `generate-mock-exam` allocates a form on. A pilot spread evenly over tasks would
 * over-sample the light domains and tell us nothing about the shape of a real form. */
const mapByCode = new Map((mapping.tasks || []).map((t) => [t.code, t]));
const mappedTasks = tasks.filter((t) => {
  const m = mapByCode.get(t.code);
  return m && ((m.cited || []).some((c) => c.state === "held") || (m.candidates || []).length);
});
const unmapped = tasks.filter((t) => !mappedTasks.includes(t));

const alloc = new Map();
if (ONLY) {
  /* One item per named task, in the order given. */
  for (const code of ONLY) {
    const t = mappedTasks.find((x) => x.code === code);
    if (!t) { console.error("--tasks names " + code + " which is not a mapped " + CERT + " task"); process.exitCode = 2; process.exit(); }
    alloc.set(t.id, 1);
  }
  N = alloc.size;
}
if (!ONLY)
{
  const byDomain = new Map();
  for (const t of mappedTasks) {
    if (!byDomain.has(t.domain_id)) byDomain.set(t.domain_id, []);
    byDomain.get(t.domain_id).push(t);
  }
  const live = [...byDomain.keys()];
  const totalW = live.reduce((a, id) => a + Number(domById.get(id).weight_pct || 0), 0);
  const raw = live.map((id) => ({ id, exact: N * Number(domById.get(id).weight_pct || 0) / totalW }));
  raw.forEach((r) => { r.floor = Math.floor(r.exact); r.rem = r.exact - r.floor; });
  let left = N - raw.reduce((a, r) => a + r.floor, 0);
  raw.sort((a, b) => b.rem - a.rem).forEach((r) => { r.n = r.floor + (left-- > 0 ? 1 : 0); });
  for (const r of raw) {
    const ts = byDomain.get(r.id);
    /* Round-robin across the domain's tasks, so one task does not take the whole quota. */
    for (let i = 0; i < r.n; i++) {
      const t = ts[i % ts.length];
      alloc.set(t.id, (alloc.get(t.id) || 0) + 1);
    }
  }
}

console.log("");
console.log("GROUNDED GENERATION  " + CERT + (APPLY ? "  --apply (WILL WRITE draft rows)" : "  dry run (default)"));
console.log("  model              " + MODEL);
console.log("  library            " + passagesByKey.size + " passages of " + mapping.standard + ":" + mapping.edition);
console.log("  tasks mapped       " + mappedTasks.length + " of " + tasks.length +
  (unmapped.length ? "   unmapped, generating nothing: " + unmapped.map((t) => t.code).join(" ") : ""));
console.log("  items to attempt   " + N + " allocated across " + new Set([...alloc.keys()].map((id) => tasks.find((t) => t.id === id).domain_id)).size + " domains by weight");
console.log("");

/* ---------------------------------------------------------------- the prompt */
function passagesFor(t) {
  const m = mapByCode.get(t.code) || {};
  const clauses = [
    ...(m.cited || []).filter((c) => c.state === "held").map((c) => c.clause),
    ...(m.cited || []).filter((c) => c.state === "container").flatMap((c) => c.children || []),
    ...(m.candidates || []).map((c) => c.clause),
  ];
  const out = [];
  const seen = new Set();
  for (const c of clauses) {
    if (seen.has(c)) continue;
    seen.add(c);
    const p = passagesByKey.get(c);
    if (p) out.push(p);
  }
  return out;
}

const WRITER_SYSTEM = `You write examination items for an ISO/IEC 17024-aligned certification.

You are given a job-task statement, the item contract, and the FULL TEXT of the passages this
task is examined against. Everything you assert must come from those passages.

THE RULE THAT MATTERS MOST: for every item, quote a sentence from the supplied passages that
supports the key, EXACTLY as it appears. Copy it character for character. Do not tidy it, do
not shorten it, do not join two sentences. A gate checks it against the passage verbatim and
the item is discarded if it does not match.

If the passages do not support a defensible item for this task, return fewer items, or none.
Returning nothing is a correct answer. Inventing a requirement is not.

Return a JSON array. Each element:

{
  "question_text": "the stem",
  "options": [{"text": "..."}, {"text": "..."}, {"text": "..."}, {"text": "..."}],
  "correct_index": 0,
  "explanation": "why the key is right, naming the clause",
  "key_support_clause": "9.2.2",
  "key_support": "an exact sentence or clause fragment copied from that passage",
  "distractor_support": [
    {"index": 1, "clause": "9.2.2", "support": "exact text", "why_wrong": "one sentence"}
  ]
}

RULES
- Four options. Exactly one is correct.
- Every distractor must be wrong for a reason a competent candidate could check against the
  passages. "Plausible but vague" is not a reason.
- Do not make the key the longest option, and do not make it the only negated one.
- State a requirement ONLY where the passage says "shall". If the passage says "should" or
  "can", the item must not say must, shall or required.
- Never reproduce more than about 25 words of the standard in the item text itself. The
  key_support field is internal and is not shown to a candidate, so quote freely THERE.`;

function writerUser(task, domain, passages, k) {
  const src = passages.map((p) =>
    "--- clause " + p.clause + (p.title ? " (" + p.title + ")" : "") +
    "  [this clause is " + p.normative + "] ---\n" + p.text).join("\n\n");
  return "CERTIFICATION: " + CERT + "\nDOMAIN: " + domain.code + " " + domain.title +
    "\nTASK " + task.code + ": " + task.statement +
    "\nBLOOM: " + (task.bloom_level || "2_understand") +
    (task.knowledge ? "\n\nKNOWLEDGE THE TASK COVERS:\n" + task.knowledge : "") +
    (task.skills ? "\n\nSKILLS:\n" + task.skills : "") +
    "\n\nPASSAGES THIS TASK IS EXAMINED AGAINST:\n\n" + src +
    "\n\nWrite " + k + " item(s). Return the JSON array only.";
}

/* ---------------------------------------------------------------- generate */
const cueCfg = cueConfigFor(cert.exam_blueprint);
const results = [];
const rejectCounts = new Map();
const bump = (k) => rejectCounts.set(k, (rejectCounts.get(k) || 0) + 1);

if (FROM) {
  console.log("  --from: re-running gates over " + FROM + ", generating nothing");
}

let priorNote = null;
const generated = [];
if (FROM) {
  const prior = JSON.parse(readFileSync(join(ROOT, FROM), "utf8"));
  /* The raw artifact's provenance travels with the gated one. A note saying how the items
   * came to exist is exactly the field a reader needs and exactly the field that gets
   * dropped between artifacts -- this repository has already had a verdict rebuilt wrongly
   * downstream because the record omitted a field the verdict depended on. */
  priorNote = prior.note || null;
  for (const r of prior.items || []) generated.push({ item: r.item, task: tasks.find((t) => t.code === r.task_code) });
} else {
  for (const [taskId, k] of alloc) {
    const t = tasks.find((x) => x.id === taskId);
    const d = domById.get(t.domain_id);
    const ps = passagesFor(t);
    if (!ps.length) { bump("no mapped passage"); continue; }
    let arr = null;
    try {
      arr = parseArray(await claude(WRITER_SYSTEM, writerUser(t, d, ps, k), 6000));
    } catch (e) {
      console.log("  " + t.code + "  WRITER FAILED: " + String(e.message).slice(0, 120));
      bump("writer could not run");
      continue;
    }
    if (!Array.isArray(arr) || !arr.length) { bump("writer returned nothing"); continue; }
    for (const raw of arr.slice(0, k)) {
      const opts = (raw.options || []).map((o, i) => ({
        text: String((o && o.text) || ""), is_correct: i === Number(raw.correct_index),
      }));
      generated.push({ task: t, item: { ...raw, options: opts } });
    }
    console.log("  " + t.code + "  wrote " + Math.min(k, arr.length) + " item(s) from " + ps.length + " passage(s)");
  }
}

/* ---------------------------------------------------------------- persist BEFORE gating
 *
 * THE GENERATION IS THE EXPENSIVE HALF AND IT IS WRITTEN DOWN FIRST. A crash in the gates
 * cost 40 writer calls once: the blindness assertion fired on item three, the process died,
 * and nothing had been written. Gating is cheap and repeatable; generating is neither.
 *
 * This file is raw output -- ungated, unsolved, not to be read as a result. `--from` can
 * re-gate it without paying for the writer again, which is also how the new instrument gets
 * run on the OLD input when a gate changes. */
const RAW = OUT.replace(/\.json$/, "") + "-raw.json";
if (!FROM) {
  writeFileSync(join(ROOT, RAW), JSON.stringify({
    certification: CERT, model: MODEL, standard: mapping.standard, edition: mapping.edition,
    attempted: N, generated: generated.length,
    note: "RAW WRITER OUTPUT, ungated and unsolved. Not a result. Re-gate with --from=" + RAW,
    items: generated.map((g) => ({ task_code: g.task.code, item: g.item })),
  }, null, 1) + "\n", "utf8");
  console.log("");
  console.log("wrote " + RAW + "  (" + generated.length + " raw item(s), before any gate)");
}

/* ---------------------------------------------------------------- gate */
console.log("");
console.log("GATES");
for (const g of generated) {
  const t = g.task;
  const item = g.item;
  const ps = passagesFor(t);
  const code = runCodeGates(item, {
    passagesByKey, annexGaps, sequenceGaps, cert: CERT,
    liveStemsForTask: liveByTask.get(t.id) || [], cueCfg,
  });

  const record = {
    task_code: t.code, domain: (domById.get(t.domain_id) || {}).code,
    item, gates: code.gates.map((x) => ({ id: x.id, pass: x.pass, examined: x.examined, reason: x.reason })),
    code_passed: code.passed, failed: code.failed, unasserted: code.unasserted,
    solver: null, verdict: null,
  };

  if (!code.passed) {
    for (const f of code.failed) bump("code: " + f);
    for (const u of code.unasserted) bump("code UNASSERTED: " + u);
    record.verdict = "rejected by code";
    results.push(record);
    console.log("  " + t.code + "  REJECTED  " + [...code.failed, ...code.unasserted.map((u) => u + "(unasserted)")].join(", "));
    continue;
  }

  /* The blind solver. Only items that cleared code reach it -- a solver call on an item
   * whose anchor does not exist would be measuring the writer's prose, not the item. */
  const ki = item.options.findIndex((o) => o.is_correct);
  const keyLabel = String.fromCharCode(65 + ki);
  const payload = blindPayload(item);
  /* A LEAK IS LOUD AND PER ITEM, NOT FATAL TO THE RUN. Letting it throw killed a 40-item
   * pilot on item three and lost every writer call. The item is refused -- an agreement from
   * a solver that could see the key is worth nothing -- and the run continues, so one
   * defective payload does not cost the other thirty-nine. */
  try {
    assertBlind(payload, item);
  } catch (e) {
    record.verdict = "rejected: solver payload was not blind";
    record.solver = { state: "could-not-run", reason: String(e.message) };
    bump("blind payload leak");
    console.log("  " + t.code + "  REFUSED   " + String(e.message).slice(0, 120));
    results.push(record);
    continue;
  }
  let parsed = null;
  try {
    parsed = parseObject(await claude(SOLVER_SYSTEM, solverUser(payload, ps), 1500));
  } catch (e) {
    parsed = null;
    record.solver_error = String(e.message).slice(0, 200);
  }
  const v = solverVerdict(parsed, keyLabel);
  record.solver = { ...v, raw: parsed };
  if (v.state === "accepted") {
    record.verdict = "survivor";
    console.log("  " + t.code + "  SURVIVOR  key " + keyLabel + ", anchored in " + item.key_support_clause);
  } else if (v.state === "rejected") {
    record.verdict = "rejected by solver";
    bump("solver: " + (v.reason.startsWith("the solver answered") ? "answered differently"
      : v.reason.includes("defensible") ? "second defensible option" : "passages do not settle it"));
    console.log("  " + t.code + "  REJECTED  solver: " + v.reason.slice(0, 110));
  } else {
    /* COULD NOT RUN IS NOT A REJECTION. The item is not cleared and not blamed. */
    record.verdict = "solver could not run";
    bump("solver COULD NOT RUN");
    console.log("  " + t.code + "  UNDECIDED  solver could not run: " + v.reason.slice(0, 90));
  }
  results.push(record);
}

/* ---------------------------------------------------------------- report */
const survivors = results.filter((r) => r.verdict === "survivor");
console.log("");
console.log("OUTCOME");
console.log("  generated          " + generated.length);
console.log("  survivors          " + survivors.length);
console.log("  rejected by code   " + results.filter((r) => r.verdict === "rejected by code").length);
console.log("  rejected by solver " + results.filter((r) => r.verdict === "rejected by solver").length);
console.log("  undecided          " + results.filter((r) => r.verdict === "solver could not run").length);
console.log("");
console.log("  WHY, by gate (a rejection can name more than one):");
for (const [k, n] of [...rejectCounts].sort((a, b) => b[1] - a[1])) {
  console.log("    " + String(n).padStart(4) + "  " + k);
}

writeFileSync(join(ROOT, OUT), JSON.stringify({
  certification: CERT, model: MODEL, standard: mapping.standard, edition: mapping.edition,
  attempted: N, generated: generated.length, survivors: survivors.length,
  generation_note: priorNote,
  reject_counts: Object.fromEntries(rejectCounts),
  tasks_mapped: mappedTasks.length, tasks_total: tasks.length,
  unmapped_tasks: unmapped.map((t) => t.code),
  items: results,
}, null, 1) + "\n", "utf8");
console.log("");
console.log("wrote " + OUT);

if (!APPLY) {
  console.log("");
  console.log("NOTHING WRITTEN. The artifact above is what --apply would insert, item for item;");
  console.log("re-run with --apply --from=" + OUT + " so the rows inserted are the rows measured.");
  console.log("A fresh --apply would generate DIFFERENT items -- a dry run of a generator is a");
  console.log("sample, not a preview.");
  process.exitCode = 0;
} else {
  console.log("");
  console.log("--apply: writing " + survivors.length + " survivor(s) as status='draft'.");
  if (!FROM) {
    console.error("REFUSING: --apply requires --from=<artifact>, so the rows written are rows that");
    console.error("were gated and read, not a fresh generation nobody has seen.");
    process.exitCode = 2;
  } else {
    let wrote = 0;
    for (const r of survivors) {
      const t = tasks.find((x) => x.code === r.task_code);
      const body = {
        certification_id: cert.id, task_id: t.id, language: "en",
        question_text: r.item.question_text,
        /* ============ THE LIVE BANK'S SHAPE, MEASURED RATHER THAN ASSUMED ============
         *
         * `options` carry a LETTER ID and `correct_answer` is an ARRAY OF THOSE IDS --
         * `[{id:"a",text:...}, ...]` with `correct_answer: ["c"]`. All 631 live AIMS-F rows
         * are single-element arrays, and `functions/score-mock-exam` reads the column as
         * `string[]`: `isCorrect(q.correct_answer as string[], user_answer)`.
         *
         * This path wrote an INTEGER INDEX. It would have inserted items that no scorer
         * could mark, and it was invisible because `--apply` is dry by default and had never
         * run -- a branch that has never executed reads exactly like one that works. Found
         * when the section 5 comparison could not read the live rows either, for the mirror
         * image of the same wrong assumption. */
        options: r.item.options.map((o, i) => ({ id: String.fromCharCode(97 + i), text: o.text })),
        correct_answer: [String.fromCharCode(97 + r.item.options.findIndex((o) => o.is_correct))],
        explanation: r.item.explanation,
        /* draft, never approved, and out of exam scope: two independent reasons it cannot
         * reach a form, because a guarantee that depends on one column staying true is not
         * a guarantee. */
        status: "draft", pool: "secure", is_exam_scope: false,
        item_origin: "generated", bloom_level: t.bloom_level,
      };
      const res = await fetch(REST_URL + "/quiz_questions", {
        method: "POST",
        headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json",
          Prefer: "return=minimal" },
        body: JSON.stringify([body]),
      });
      if (!res.ok) {
        console.error("  insert failed: " + res.status + " " + (await res.text()).slice(0, 240));
        process.exitCode = 2;
        break;
      }
      wrote++;
    }
    console.log("  inserted " + wrote + " draft row(s)");
    const back = await getAll(KEY, "quiz_questions?select=id,status,is_exam_scope&certification_id=eq." +
      cert.id + "&status=eq.draft&order=id");
    console.log("  POST-CONDITION  draft rows now live: " + back.length +
      ", of which in exam scope: " + back.filter((r) => r.is_exam_scope).length + " (must be 0)");
    if (back.filter((r) => r.is_exam_scope).length) {
      throw new Error("a draft row is flagged is_exam_scope -- it could reach a secure form");
    }
  }
}
