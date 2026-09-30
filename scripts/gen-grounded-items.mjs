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
 *   nine CODE gates       scripts/lib/grounded-gates.mjs -- no model involved
 *   one BLIND solver      scripts/lib/blind-solver.mjs -- sees the passages and the item,
 *                         never the key, the explanation or the generation context
 *
 * Survivors land in an UNSERVABLE status, NEVER approved. The ruling says "draft"; the CHECK
 * vocabulary has no such value, so they land as `pending_review` -- see insert-pilot-drafts.mjs.
 * Approval for the secure pool is a separate human step, and `generate-mock-exam` filters
 * `status = 'approved'` exactly -- read from its source, not assumed -- so neither can reach a form.
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
import { readFileSync, writeFileSync, existsSync, appendFileSync, renameSync } from "node:fs";
import { dirname, join, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { runCodeGates } from "./lib/grounded-gates.mjs";
import { blindPayload, assertBlind, solverUser, solverVerdict, SOLVER_SYSTEM, blindSolverControls } from "./lib/blind-solver.mjs";
import { createHash } from "node:crypto";
import { CAP, atCap, applyCap, anchorCapControls } from "./lib/anchor-cap.mjs";
import { buildCapCensus } from "./lib/anchor-cap-census.mjs";
import { classifyPrimaries, effectivePrimaryCount, effectivePrimaryControls, MIN_WORDS }
  from "./lib/effective-primary.mjs";
import { groundedGateControls } from "./lib/grounded-gates.mjs";
import { balanceKeyOrder, balancedKeyOrderControls } from "./lib/balanced-key-order.mjs";
import { supersededControls } from "./lib/superseded-wording.mjs";
import { cueConfigFor } from "../functions/_shared/item-rules/item-cue-guard.mjs";
import { optionsPayload, assertOptionsOnly, optionsProbeUser, optionsProbeVerdict,
  OPTIONS_PROBE_SYSTEM, optionsProbeControls } from "./lib/options-probe.mjs";
import { shapeCues, shapeCueControls, KEY_LENGTH_TOLERANCE } from "./lib/shape-cues.mjs";
import { deCueRewriteCheck, deCueCheckControls, newCodeCue, triggerCleared,
  limiterDropped } from "./lib/de-cue-checks.mjs";

/* ============ THE DE-CUE WRITER, AND IT MAY TOUCH NOTHING BUT THE DISTRACTORS ============
 *
 * The rules are the director's, stated as constraints rather than advice because a writer given
 * "make them better" returns four new options and a different item. The reply shape is a single
 * object with one text per distractor, in the order given, so the applier can pair them positionally
 * and refuse anything else. */
const DE_CUE_SYSTEM = `You repair the SHAPE of a multiple-choice item's distractors. You never
change what the item tests.

You are given a stem, the KEY, the current distractors, and one or more CUES that instruments found
in the option set -- properties that let someone pick the key without knowing the subject.

RESHAPE EACH DISTRACTOR. NEVER REPLACE IT. This is the governing rule and the others serve it:
keep each distractor's underlying MISCONCEPTION and the THING IT NAMES -- the same control, the same
clause, the same actor, the same step -- and change only its FORM: length, grammar, verdict shape.
Where the stem asks which control or which clause, every distractor stays a real control or a real
clause. A rewrite that swaps a plausible misconception for an implausible one, or a real control for an
invented process, raises symmetry and lowers difficulty for the wrong reason: the item stops measuring
what it measured.

Rewrite ONLY the distractors so the cue is gone. Hard rules:
- The stem and the key are FIXED. Do not restate, reword or comment on them.
- Every distractor must still be WRONG, and wrong for a reason a knowledgeable person could name.
- KEEP every clause number, control id and control name that the original distractor used. If the
  original said "Control A.8.4 on access to source code", the rewrite still says A.8.4.
- DO NOT INTRODUCE AN ABSOLUTE the original did not have: only, every, all, always, never, entirely,
  wholly, "must be surrendered", "offers no ...". Adding one is the habit these cues come from, and a
  rewrite that adds one is reverted.
- A distractor must not become TRUE. Restating a real requirement from a DIFFERENT clause than the
  stem asks about makes it defensible rather than wrong, and that is a worse item than the cue was.
- Match the key in LENGTH: each distractor within 20 percent of the key's word count.
- Match the key in GRAMMATICAL FORM: same opening part of speech, same sentence shape.
- Match the key in VERDICT PATTERN: if the key asserts, they assert; if the key denies, at least one
  denies.
- If the key is COMPOUND (two clauses, or a statement plus a qualifier), make at least TWO
  distractors compound.
- If the key is UNCONDITIONAL, make at least ONE distractor unconditional.
- Never make a distractor wrong merely by adding an absolute ("always", "never", "only", "all") or a
  self-justifying "because ..." clause. That is the habit these cues come from.

Reply with ONLY this JSON object:
{"distractors":["text for the first distractor","text for the second","..."]}
The array must have exactly one entry per distractor shown, in the same order.`;

/** The key's index, from `is_correct`. */
const keyIdxOf = (it) => (it.options || []).findIndex((o) => o && o.is_correct);

/**
 * Put rewritten distractor texts back in their original positions. Positional pairing, and it
 * refuses a count mismatch: a reordered or dropped distractor compared against its neighbour is the
 * checkpoint-field defect, and the applier is where it has to be caught.
 */
function applyDistractors(item, texts, ki) {
  if (!Array.isArray(texts)) return null;
  const slots = item.options.map((_, i) => i).filter((i) => i !== ki);
  if (texts.length !== slots.length) return null;
  if (texts.some((t) => !String(t || "").trim())) return null;
  const options = item.options.map((o) => ({ ...o }));
  slots.forEach((slot, n) => { options[slot] = { ...options[slot], text: String(texts[n]).trim() }; });
  /* The key must be untouched, byte for byte, or this is a different item wearing a retry. */
  if (options[ki].text !== item.options[ki].text) return null;
  if (options.findIndex((o) => o.is_correct) !== ki) return null;
  return { ...item, options };
}

const flagCounts = new Map();
let deCueAttempted = 0, deCueApplied = 0, deCueRevertedSolver = 0, deCueRevertedGates = 0, deCueRevertedRewrite = 0,
    deCueMalformed = 0, deCueUnrun = 0;

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
/* A path the caller gave ABSOLUTELY is used as given; a bare name is relative to the repository root.
 * join(ROOT, <absolute>) silently produces an unopenable path on Windows, and both --out and --from had
 * it -- so the rule lives in one place rather than at each flag. */
const underRoot = (p) => (isAbsolute(p) ? p : join(ROOT, p));

let CERT = "AIMS-F", N = 40, APPLY = false, OUT = null, FROM = null, ONLY = null, IDS = null, EXAM_SCOPE = false;
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
  /* --ids=<content id>,... inserts a NAMED SUBSET of an artifact. The id is a hash of the stem, not a
   * position: a position silently points at a different item once the artifact is regenerated, and this
   * flag exists precisely to insert the items a human read. */
  if ((m = /^--ids=(.+)$/.exec(a))) { IDS = m[1].split(",").map((s) => s.trim()).filter(Boolean); continue; }
  /* the ruled is_exam_scope for these pending_review rows. The DEFAULT STAYS FALSE. */
  if (a === "--exam-scope") { EXAM_SCOPE = true; continue; }
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

/* A STABLE ID FOR AN ARTIFACT ITEM: a hash of the normalised stem. Positions are not ids -- an artifact
 * regenerated between the read and the insert would leave --ids=2,4 pointing at items nobody saw. */
const itemId = (item) => createHash("sha256")
  .update(String((item && item.question_text) || "").replace(/\s+/g, " ").trim())
  .digest("hex").slice(0, 8);

/* which standard a certification's anchors come from. Declared: hardcoding 42001 would silently
 * mislabel every ISMS grounding row the first time this path runs for ISMS-F. */
const STANDARD_OF = { "AIMS-F": "ISO/IEC 42001", "AIMS-IA": "ISO/IEC 42001",
  "ISMS-F": "ISO/IEC 27001", "ISMS-IA": "ISO/IEC 27001" };
const EDITION_OF = { "AIMS-F": "2023", "AIMS-IA": "2023", "ISMS-F": "2022", "ISMS-IA": "2022" };

/* ---------------------------------------------------------------- the controls run first */
{
  const a = groundedGateControls(), b = blindSolverControls(), c = supersededControls();
  const d = optionsProbeControls();
  const e = shapeCueControls();
  const f = deCueCheckControls();
  const g = effectivePrimaryControls({ quiet: true });
  const h = anchorCapControls({ quiet: true });
  /* The balanced-order controls, adapted to this harness's {fails, examined} shape. A mis-permutation is
   * unrecoverable once inserted -- a key pointing at the wrong text grades every attempt wrongly -- so they
   * run before anything else, like every other gate's. */
  const bal = balancedKeyOrderControls();
  const i = { examined: bal.length,
    fails: bal.filter((x) => !x.pass).map((x) => "balanced-order: " + x.what + (x.detail ? "   " + x.detail : "")) };
  const fails = [...a.fails, ...b.fails, ...c.fails, ...d.fails, ...e.fails, ...f.fails, ...g.fails, ...h.fails, ...i.fails];
  console.log("CONTROLS BEFORE ANYTHING ELSE  " + (a.examined + b.examined + c.examined + d.examined + e.examined + f.examined + g.examined + h.examined + i.examined) + " cases");
  if (fails.length) {
    console.error("REFUSING TO RUN -- the gates' own controls fail:");
    for (const f of fails) console.error("  " + f);
    process.exitCode = 2; process.exit();
  }
  console.log("  gates " + a.examined + ", solver " + b.examined + ", superseded " + c.examined + ", options probe " + d.examined + ", shape cues " + e.examined + ", de-cue rewrite " + f.examined + ", effective-primary " + g.examined + ", anchor-cap " + h.examined + ", balanced-order " + i.examined + " -- all pass");
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
/* ============ THE SPEND METER ============
 *
 * Every call's token usage, tagged by role. The API has always returned this and nothing read it, which
 * is why every cost figure in this repository has been in CALLS rather than dollars. Prices are per
 * MILLION tokens and live in ONE place, so a stale price cannot hide inside an estimate. */
const PRICE_PER_MTOK = { input: 15.0, output: 75.0 };   /* claude-opus, USD per million tokens */
const SPEND = { calls: 0, input: 0, output: 0, byRole: {} };
let CALL_ROLE = "unattributed";
function meterRaw(role, inp, out, calls) {
  SPEND.calls += calls; SPEND.input += inp; SPEND.output += out;
  const r = SPEND.byRole[role] || (SPEND.byRole[role] = { calls: 0, input: 0, output: 0 });
  r.calls += calls; r.input += inp; r.output += out;
}
function meter(role, usage) {
  const inp = Number((usage || {}).input_tokens || 0);
  const out = Number((usage || {}).output_tokens || 0);
  SPEND.calls++; SPEND.input += inp; SPEND.output += out;
  const r = SPEND.byRole[role] || (SPEND.byRole[role] = { calls: 0, input: 0, output: 0 });
  r.calls++; r.input += inp; r.output += out;
}
function spendUSD(s) {
  const x = s || SPEND;
  return (x.input / 1e6) * PRICE_PER_MTOK.input + (x.output / 1e6) * PRICE_PER_MTOK.output;
}
function spendReport() {
  const out = ["  SPEND  " + SPEND.calls + " call(s), " + SPEND.input + " in / " + SPEND.output +
    " out tokens, $" + spendUSD().toFixed(2) + "   (at $" + PRICE_PER_MTOK.input + "/$" +
    PRICE_PER_MTOK.output + " per Mtok)"];
  for (const [role, r] of Object.entries(SPEND.byRole)) {
    out.push("    " + role.padEnd(13) + String(r.calls).padStart(4) + " call(s)  " +
      String(r.input).padStart(8) + " in  " + String(r.output).padStart(7) + " out  $" +
      spendUSD(r).toFixed(2));
  }
  return out.join(String.fromCharCode(10));
}

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
      meter(CALL_ROLE, data.usage);
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
/* ============ ANNEX CONTROL TITLES, RESOLVED FROM THE LIBRARY ============
 *
 * The changed-reference check needs to know what a real control is CALLED, so it can see when a
 * rewrite drops one. Typed here it would be a second copy of a library fact and would go stale the
 * first time a source is re-extracted -- the defect this repository records against every hand-kept
 * list. Derived: the titles of every annex passage held, in every source.
 *
 * The check itself ignores anything under 12 characters, so single words like "Access" cannot fire. */
const controlTitles = [...new Set(lib.passages
  .filter((p) => /^[A-D]\./.test(String(p.clause || "")))
  .map((p) => String(p.title || "").trim())
  .filter((t) => t.length >= 12))];

const passagesByKey = new Map(lib.passages
  .filter((p) => p.source_id === mapping.standard && p.edition === mapping.edition)
  .map((p) => [p.clause, p]));
const annexGaps = lib.annex_gaps || [];
const sequenceGaps = lib.sequence_gaps || [];

/* ============ THE DECLARED-GAP LIST IS THE THIRD SOURCE, AND THE AUTHORITATIVE ONE ============
 *
 * `annex_gaps` and `sequence_gaps` are derived from what the extractor FOUND, so neither can
 * see a missing last child: ISO/IEC 42001's A.4.6 and A.9.4 were absent while both reported
 * the annex complete. `check-library-completeness.mjs` measures against each standard's own
 * contents, Table A.1 rows and clause-3 headings, so its list is what the gate must consult to
 * tell NOT IN THE STANDARD from NOT HELD BY US.
 *
 * Read as a file rather than re-derived, and its ABSENCE is reported rather than defaulted to
 * an empty list -- an empty gap list would make every unheld clause look invented, which is the
 * exact misreading that sent a pilot item's clause D.2 to the rewrite pile. */
let declaredGaps = [];
const complPath = join(ROOT, "LIBRARY-COMPLETENESS.json");
if (existsSync(complPath)) {
  const compl = JSON.parse(readFileSync(complPath, "utf8"));
  declaredGaps = (compl.sources || [])
    .filter((s) => s.source_id === mapping.standard && s.edition === mapping.edition)
    .map((s) => ({ holes: s.missing || [] }));
  const n = declaredGaps.reduce((a, g) => a + g.holes.length, 0);
  console.log("  declared gaps       " + n + " id(s) the standard declares and the library does not hold");
} else {
  console.log("  declared gaps       UNKNOWN -- LIBRARY-COMPLETENESS.json is absent.");
  console.log("                      Run check-library-completeness.mjs, or a real-but-unheld");
  console.log("                      clause will be refused as if the standard did not contain it.");
}

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
/* ---------------------------------------------------------------- the task map, from the table
 *
 * READ FROM `task_sources`, NOT FROM THE RANKER'S JSON. The ranker offered candidates; the table
 * holds the director's ruling, written by write-task-sources.mjs with role primary or supporting.
 * A generator reading the candidate file would be anchoring items in a guess. */
/* ORDERED ON A UNIQUE KEY, not on task_id alone. This read is now 1,706 rows -- more than one page --
 * and task_id is not unique, so Range pagination over it can return one row twice and drop another
 * while the count assertion still passes: the total matches and the SET is wrong. _pg.mjs refuses an
 * unordered read but cannot see that a named order is non-unique. A doubled or short map here would
 * silently change which clauses count as primary. */
const tsRows = await getAll(KEY,
  "task_sources?select=task_id,passage_id,role&order=task_id,passage_id");
const clauseOfPassage = new Map(
  (await getAll(KEY, "source_passages?select=id,source_id,edition,clause&order=id"))
    .map((r) => [r.id, r]));
const mapByTask = new Map();
for (const r of tsRows) {
  if (!mapByTask.has(r.task_id)) mapByTask.set(r.task_id, { primary: [], supporting: [] });
  const p = clauseOfPassage.get(r.passage_id);
  if (p) mapByTask.get(r.task_id)[r.role].push(p.clause);
}
const taskIdOfCode = new Map(tasks.map((t) => [t.code, t.id]));
const primaryOf = (code) => (mapByTask.get(taskIdOfCode.get(code)) || {}).primary || [];
const supportingOf = (code) => (mapByTask.get(taskIdOfCode.get(code)) || {}).supporting || [];
/* ---- EFFECTIVE primaries, ruled PROMPT-86 s2: not a container, own text, >= " + MIN_WORDS + " words ----
 *
 * `primaryOf(code).length` counted ANY primary row. Task 1.3 had six of which TWO were containers
 * (A.6.1, A.6.2) whose text is their children's text run together -- long enough to pass any word
 * floor, and useless to anchor in, because a quotation from one can span several controls. */
const libClauses = [...passagesByKey.keys()];
const passageOfClause = (c) => passagesByKey.get(c);
const effectivePrimariesOf = (code) =>
  classifyPrimaries(primaryOf(code), passageOfClause, libClauses).filter((r) => r.effective)
    .map((r) => r.clause);
const effectiveCountOf = (code) => effectivePrimaryCount(primaryOf(code), passageOfClause, libClauses);
const mappedFromTable = tasks.filter((t) => effectiveCountOf(t.code));
console.log("  task_sources        " + tsRows.length + " link(s); " + mappedFromTable.length +
  " of " + tasks.length + " tasks have an EFFECTIVE primary passage (not a container, own text, " +
  ">= " + MIN_WORDS + " words)");
if (!tsRows.length) {
  console.error("REFUSING TO RUN: task_sources is empty, so no key could be checked against a");
  console.error("primary passage and every item would be UNASSERTED on that gate. Run");
  console.error("scripts/write-task-sources.mjs --apply first.");
  process.exitCode = 3; process.exit();
}

/* ---------------------------------------------------------------- the leak index
 *
 * ONE IMPLEMENTATION. `buildSources()` is the lesson scanner's own index, built from the same
 * PDFs with the same tokenisation, and it asserts each document's word count against
 * iso-corpus-manifest.json -- which is a positive control this path gets for free. Writing an
 * item-specific scorer would be a second implementation of one computation. */
const leakMod = await import("./lib/leak-score.mjs");
let leakSources = null;
try {
  leakSources = leakMod.buildSources();
  const qc = leakMod.quotationModeControls();
  if (qc.fails.length) {
    console.error("REFUSING TO RUN: the quotation mode's controls fail:");
    for (const f of qc.fails) console.error("  " + f);
    process.exitCode = 2; process.exit();
  }
  console.log("  leak index          " + leakSources.size + " document(s), quotation-mode controls " +
    qc.examined + "/" + qc.examined + " pass");
} catch (e) {
  console.error("REFUSING TO RUN: the leak index could not be built -- " + String(e.message).slice(0, 160));
  console.error("The reproduction gate would report UNASSERTED on every item, and an item that");
  console.error("nobody checked for reproduction must not be presented as a survivor.");
  process.exitCode = 3; process.exit();
}

/** The anchor family: the clause a key rests on, normalised the way the gates normalise it. */
const normClauseForFamily = (c) => {
  const m = /^\s*([A-Z]?\.?\d+(?:\.\d+){0,3})/.exec(String(c || ""));
  return m ? m[1].replace(/^\./, "").replace(/^([A-Z])(\d)/, "$1.$2") : null;
};
const record0Bump = (k) => bump(k);

const mapByCode = new Map((mapping.tasks || []).map((t) => [t.code, t]));

/* ============ THE RULING DECIDES WHICH TASKS GENERATE, NOT THE RANKER ============
 *
 * A task generates only if `task_sources` gives it a PRIMARY passage. That is the same fact the
 * anchor gate checks, so the allocation and the gate can never disagree -- a task allocated
 * items it cannot anchor would produce a run of refusals that name the items rather than the map.
 *
 * TASK 5.5 IS ON HOLD by ruling: the certification route needs ISO/IEC 42006 and 17021-1 and
 * neither is held. It has no primary passages, so it drops out here, and its share of D5 is
 * redistributed across D5's other tasks by the round-robin below -- the domain keeps its weight,
 * which is what matters for a form, and the redistribution is STATED rather than left implicit. */
/* the hold list uses the SAME definition as the allocation, or a task with only container primaries
 * would be allocated items it cannot anchor and the refusals would name the items, not the map. */
/* the within-task anchor cap census: kept audit items + already-inserted rows. This run's survivors are
 * added at gate time, because a cap that counted only the current run would let each run add CAP more
 * to a clause that already carries four. */
const capInfo = await buildCapCensus({ KEY, getAll, certId: cert.id, tasks, ROOT, cert: CERT });
const capCensus = capInfo.byTask;
const atCapFor = (code) => atCap(capCensus.get(code) || new Map(), CAP);
console.log("  anchor cap          " + CAP + " per (source, clause) per task; " +
  [...capCensus.values()].reduce((s, m) => s + [...m.values()].filter((n) => n >= CAP).length, 0) +
  " clause(s) at the cap (from " + capInfo.fromKept + " kept + " + capInfo.fromInserted +
  " inserted)" + (capInfo.unknownAnchor.length ? "; " + capInfo.unknownAnchor.length +
    " kept item(s) with NO recorded anchor, not counted" : ""));

const HELD_TASKS = tasks.filter((t) => !effectiveCountOf(t.code)).map((t) => t.code);
const mappedTasks = tasks.filter((t) => primaryOf(t.code).length);
const unmapped = tasks.filter((t) => !mappedTasks.includes(t));
if (HELD_TASKS.length) {
  console.log("  tasks with no primary passage, generating nothing: " + HELD_TASKS.join(" "));
  console.log("  their share stays with their DOMAIN and is redistributed across its other tasks");
}

const alloc = new Map();
if (ONLY) {
  /* One item per named task, in the order given -- or `code:count` for several against one task.
   * Refilling a task to its floor needs N items on ONE task, and the bare form could not express
   * that: repeating the code collapses in this Map and would have produced one item while looking
   * like it worked. */
  for (const spec of ONLY) {
    const mm = /^(.+?)(?::(\d+))?$/.exec(spec);
    const code = mm[1].trim();
    const count = mm[2] === undefined ? 1 : Number(mm[2]);
    if (!Number.isFinite(count) || count < 1) {
      console.error('--tasks=' + spec + ': a count must be 1 or more. A count of 0 is refused rather');
      console.error('than skipped -- a flag that silently does nothing is how a generator misleads.');
      process.exitCode = 2; process.exit();
    }
    const t = mappedTasks.find((x) => x.code === code);
    if (!t) {
      console.error('--tasks names ' + code + ' which is not a mapped ' + CERT + ' task');
      process.exitCode = 2; process.exit();
    }
    alloc.set(t.id, (alloc.get(t.id) || 0) + count);
  }
  N = [...alloc.values()].reduce((s, v) => s + v, 0);
  console.log('--tasks: ' + alloc.size + ' task(s), ' + N + ' item(s) -- ' +
    ONLY.join(' '));
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
/* ============ THE PASSAGES COME FROM `task_sources`, NOT FROM THE RANKER'S JSON ============
 *
 * Measured on task 1.3 after its promotion: the mapping file offered seven clauses of which exactly ONE
 * was primary, while task_sources held thirteen primaries. Twelve -- including all seven controls just
 * promoted -- were never put in front of the writer. Once C.3.6 reached the anchor cap the writer had no
 * legal anchor left and returned an empty array, which was the correct answer to an impossible prompt.
 *
 * The role LABELS already came from task_sources while the passage SET came from the mapping file, so
 * promoting a clause changed what the prompt would call it and not whether it was there. The rule was
 * already in this file for the role map; this applies it to the set.
 *
 * Primaries first, so the writer reads what it may anchor in before what it may not. */
function passagesFor(t) {
  const prim = primaryOf(t.code), supp = supportingOf(t.code);
  const out = [];
  const seen = new Set();
  for (const c of [...prim, ...supp]) {
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

- EVERY DISTRACTOR IS WRONG ON SUBSTANCE: it is a misconception a partly prepared candidate
  actually holds. Examples: the wrong clause or control, the wrong actor, the wrong timing, an
  input confused with an output, guidance treated as a requirement, two similar controls
  confused.
  DO NOT make a distractor wrong by adding an absolute (only, every, all, always, never, no
  exceptions, entirely) or a justification tail (because..., since..., so..., which...) to an
  otherwise true statement. IF A DISTRACTOR MINUS ITS QUALIFIER WOULD BE TRUE, IT IS NOT A
  DISTRACTOR.
  Write the four options in the same grammatical form and similar length. If the key carries a
  hedge the standard uses (can), phrase at least one distractor with similar care.

- Do not make the key the longest option, and do not make it the only negated one.
- State a requirement ONLY where the passage says "shall". If the passage says "should" or
  "can", the item must not say must, shall or required.
- Keep the standard's own wording out of the stem and the options: at most about eight
  consecutive words shared with any source. In the explanation you may include ONE short
  quotation in quotation marks, naming its clause, of at most one sentence. The key_support
  field is internal and is never shown to a candidate, so quote freely THERE.`;

/* THE WRITER IS TOLD WHICH PASSAGES IT MAY ANCHOR A KEY IN.
 *
 * `anchor-is-primary` refuses a key resting on a supporting passage. The writer used to be handed every
 * passage with no role and no rule, so on task 1.3 it anchored 6 of 7 keys in supporting clauses and
 * six writer calls were spent discovering a rule nobody had given it. A distractor's reason may still
 * use a supporting passage -- that is the gate's own contract, so prompt and gate cannot drift. */
function writerUser(task, domain, passages, k) {
  const prim = new Set(primaryOf(task.code));
  /* clauses already at the cap for THIS task. The writer is told AND the gate refuses, so a model that
   * ignores the instruction costs a rejection rather than a bad insert. */
  const full = atCapFor(task.code);
  const fullSet = new Set(full.map((f) => f.clause));
  const fmt = (p) =>
    "--- clause " + p.clause + (p.title ? " (" + p.title + ")" : "") +
    "  [this clause is " + p.normative + "; " +
    (prim.has(p.clause) ? (fullSet.has(p.clause)
      ? "PRIMARY but ALREADY AT THE ANCHOR CAP -- DO NOT anchor a key here"
      : "PRIMARY for this task -- a KEY MAY anchor here") :
      "SUPPORTING -- a distractor's reason may use it, a KEY MAY NOT anchor here") + "] ---\n" + p.text;
  const primaries = passages.filter((p) => prim.has(p.clause));
  const others = passages.filter((p) => !prim.has(p.clause));
  const src = [...primaries.map(fmt), ...others.map(fmt)].join("\n\n");
  return "CERTIFICATION: " + CERT + "\nDOMAIN: " + domain.code + " " + domain.title +
    "\nTASK " + task.code + ": " + task.statement +
    "\nBLOOM: " + (task.bloom_level || "2_understand") +
    (task.knowledge ? "\n\nKNOWLEDGE THE TASK COVERS:\n" + task.knowledge : "") +
    (task.skills ? "\n\nSKILLS:\n" + task.skills : "") +
    "\n\nPASSAGES THIS TASK IS EXAMINED AGAINST:\n\n" + src +
    "\n\nEVERY item's `key_support` MUST be copied from a passage marked PRIMARY. There are " +
    primaries.length + " of them, and code refuses a key anchored anywhere else. If a PRIMARY passage" +
    " does not support the point you want to make, make a different point: do not anchor in a" +
    " SUPPORTING passage and do not paraphrase a primary one to fit." +
    (full.length ? "\n\nAT THE ANCHOR CAP for this task -- do NOT anchor any key in these; they" +
      " already carry " + CAP + " item(s) each: " + full.map((f) => f.clause).join(", ") : "") +
    /* ============ THE DISTRACTOR-BREADTH INSTRUCTION WAS REVERTED, PROMPT-94 s2 ============
     *
     * It stood here for one run and was removed by the director who wrote it, on his own measurement. It
     * asked for at least one distractor as broad and as measured in tone as the key, and for the key to
     * alternate between the general and the specific option.
     *
     * MEASURED AGAINST ITS OWN TARGET, it made the habit MORE common, not less: the share of probed
     * survivors whose flag describes a distractor made wrong by ADDING a qualifier went from 49 percent to
     * 69 percent. The cue_kind table said the opposite -- `odd-verdict` fell from 36 percent of flags to 21 --
     * and that was a RELABELLING: more parallel options is exactly what the instruction asks for, so the
     * probe noticed the shared opening phrase first and filed the same defect under `shared-phrase`.
     *
     * NOT REPLACED WITH A BETTER VERSION. Writing a second instruction on one confounded run -- prompt,
     * task set and maps all changed in one session -- would be fitting the instrument to the expected
     * answer. The probe stays a flag with no target rate, and cues get judged by reading the items.
     *
     * The clause-number rule below STAYS: it is backed by `clause-number-recall` in the code gates, so the
     * prompt states the gate's own test in the gate's own words and a model that ignores it costs a
     * rejection rather than a bad insert. It fired on 1 of 53 batch-2 survivors and 0 of 47 in R2. */
    "\n\nCLAUSE NUMBERS. You may cite a clause number, but ONLY if the item can be answered without" +
    " knowing what that number contains. Name the topic. Code REFUSES a stem that asks what is 'at'," +
    " 'in' or 'under' clause X, which obligation 'belongs to' X, or which option 'matches' X --" +
    " those test memory of ISO's numbering rather than understanding of the requirement. Citing a clause" +
    " as the AUTHORITY for a question whose subject the stem names is fine." +
    "\n\nWrite " + k + " item(s). Return the JSON array only.";
}

/* ---------------------------------------------------------------- generate */
const cueCfg = cueConfigFor(cert.exam_blueprint);
const rejectCounts = new Map();
const bump = (k) => rejectCounts.set(k, (rejectCounts.get(k) || 0) + 1);
/* ============ THE GATING CHECKPOINT ============
 *
 * Ruled PROMPT-92 s1. A kill used to lose every gated verdict, because the gated artifact is written only
 * at the end of a run -- batch 2 lost 18 of them and the calls that produced them went unrecorded. Each
 * item's record and its token cost are now appended as soon as it is decided.
 *
 * The spend DELTA travels with the verdict: a resumed run that could not report total spend would still
 * be losing half of what the kill destroyed. */
/* An absolute --out must not be joined onto ROOT. One resolved constant for the artifact and its
 * checkpoint, so the two cannot disagree about where the run is writing. */
const OUT_PATH = underRoot(OUT);
const PARTIAL = OUT_PATH.replace(/\.json$/, "") + ".partial.jsonl";
const resumed = new Map();
if (existsSync(PARTIAL)) {
  let bad = 0;
  for (const line of readFileSync(PARTIAL, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    let rec = null;
    try { rec = JSON.parse(line); } catch { bad++; continue; }
    /* A TRUNCATED LAST LINE IS THE NORMAL SHAPE OF A KILL, so a bad line is counted and skipped rather
     * than aborting the resume -- that item simply gets gated again, which is correct and costs one item. */
    if (rec && rec.record && rec.item_id) resumed.set(rec.item_id, rec);
  }
  /* fold the recorded spend back into the meter, so the total is the TRUE total across attempts */
  for (const rec of resumed.values()) {
    const d = rec.spend_delta || {};
    for (const [role, r] of Object.entries(d.by_role || {})) meterRaw(role, r.input, r.output, r.calls);
    for (const [k, n] of Object.entries(rec.reject_delta || {})) rejectCounts.set(k, (rejectCounts.get(k) || 0) + n);
  }
  console.log("  CHECKPOINT: resumed " + resumed.size + " gated item(s) from " +
    PARTIAL.split(/[\\/]/).pop() + (bad ? ", " + bad + " unparseable line(s) skipped" : "") +
    "; $" + spendUSD().toFixed(2) + " of prior gating spend restored");
}
function checkpoint(record, before, rejectBefore) {
  const by_role = {};
  for (const [role, r] of Object.entries(SPEND.byRole)) {
    const b = before.byRole[role] || { calls: 0, input: 0, output: 0 };
    const d = { calls: r.calls - b.calls, input: r.input - b.input, output: r.output - b.output };
    if (d.calls || d.input || d.output) by_role[role] = d;
  }
  const line = JSON.stringify({ item_id: record.item_id || itemId(record.item),
    task_code: record.task_code, verdict: record.verdict,
    spend_delta: { calls: SPEND.calls - before.calls, input: SPEND.input - before.input,
      output: SPEND.output - before.output, by_role },
    reject_delta: rejectDelta(rejectBefore),
    record });
  appendFileSync(PARTIAL, line + String.fromCharCode(10), "utf8");
}
/* The generator's own rejection table is accumulated by bump() DURING gating, so a resumed item would
 * never be counted in it. The delta travels with the verdict, like the spend. */
const snapshotRejects = () => new Map(rejectCounts);
function rejectDelta(before) {
  const d = {};
  for (const [k, n] of rejectCounts) { const b = before.get(k) || 0; if (n - b) d[k] = n - b; }
  return d;
}
const snapshotSpend = () => ({ calls: SPEND.calls, input: SPEND.input, output: SPEND.output,
  byRole: Object.fromEntries(Object.entries(SPEND.byRole).map(([k, v]) => [k, { ...v }])) });

const results = [];

if (FROM) {
  console.log("  --from: re-running gates over " + FROM + ", generating nothing");
}

let priorNote = null;
const generated = [];
if (FROM) {
  const prior = JSON.parse(readFileSync(underRoot(FROM), "utf8"));
  /* The raw artifact's provenance travels with the gated one. A note saying how the items
   * came to exist is exactly the field a reader needs and exactly the field that gets
   * dropped between artifacts -- this repository has already had a verdict rebuilt wrongly
   * downstream because the record omitted a field the verdict depended on. */
  priorNote = prior.note || null;
  let priorItems = prior.items || [];
  if (IDS) {
    /* EVERY requested id must match, or the insert quietly covers fewer items than were approved --
     * the short-read-as-complete shape, pointed at a write. */
    const have = new Map(priorItems.map((r) => [itemId(r.item), r]));
    const missing = IDS.filter((x) => !have.has(x));
    if (missing.length) {
      console.error("--ids: " + missing.length + " id(s) match no item in " + FROM + ": " + missing.join(", "));
      console.error("ids present: " + [...have.keys()].join(", "));
      process.exitCode = 2; process.exit();
    }
    priorItems = IDS.map((x) => have.get(x));
    console.log("  --ids: " + priorItems.length + " of " + (prior.items || []).length +
      " item(s); all " + IDS.length + " requested id(s) matched");
  }
  for (const r of priorItems) generated.push({ item: r.item, task: tasks.find((t) => t.code === r.task_code) });
} else {
  for (const [taskId, k] of alloc) {
    const t = tasks.find((x) => x.id === taskId);
    const d = domById.get(t.domain_id);
    const ps = passagesFor(t);
    if (!ps.length) { bump("no mapped passage"); continue; }
    let arr = null;
    try {
      /* THE BUDGET SCALES WITH k. A fixed 6000 was right only while every run asked for one item:
       * seven grounded items in one response truncated, the array would not parse, and the run
       * reported `writer returned nothing` under an OUTCOME block that reads like a gate result. */
      const budget = Math.min(32000, 2000 + 2200 * k);
      CALL_ROLE = "writer";
      const rawText = await claude(WRITER_SYSTEM, writerUser(t, d, ps, k), budget);
      arr = parseArray(rawText);
      /* THREE CAUSES, THREE MESSAGES. parseArray returns null whether the response carried no
       * brackets, would not parse, or was empty -- and one bumped string for all three is why two
       * runs ended on 'writer returned nothing' with no way to tell a refusal from a truncation. */
      if (!Array.isArray(arr) || !arr.length) {
        const head = String(rawText || "").replace(/\s+/g, " ").slice(0, 300);
        const hasOpen = String(rawText || "").includes("[");
        const hasClose = String(rawText || "").includes("]");
        const why = !rawText ? "the model returned NOTHING (empty response)"
          : !hasOpen ? "the response carried NO array at all -- prose or a refusal"
          : !hasClose ? "the array was NOT CLOSED -- the response was TRUNCATED, so the budget " +
            "of " + budget + " tokens was too small for " + k + " item(s)"
          : Array.isArray(arr) ? "the model returned an EMPTY array"
          : "the bracketed text would not parse as JSON";
        console.log("  " + t.code + "  WRITER PRODUCED NO ITEMS: " + why);
        console.log("      response length " + String(rawText || "").length +
          " char(s); head: " + head);
        bump("writer produced no items: " + why);
        continue;
      }
    } catch (e) {
      console.log("  " + t.code + "  WRITER FAILED: " + String(e.message).slice(0, 120));
      bump("writer could not run");
      continue;
    }
    /* unreachable for the empty case -- handled above with a named cause -- and kept as a type guard */
    if (!Array.isArray(arr) || !arr.length) { bump("writer returned nothing"); continue; }
    /* A SHORT ARRAY IS REPORTED, NEVER SILENTLY ACCEPTED. `slice(0, k)` below takes what arrived, so
     * a half-truncated response would have produced 3 of 7 and printed "wrote 3 item(s)" with nothing
     * saying four were lost -- a shortfall refilled by a run that itself came up short. */
    if (arr.length < k) {
      console.log("  " + t.code + "  SHORT: the writer returned " + arr.length + " item(s) of " + k +
        " requested. Generating what arrived; the remainder is still a shortfall.");
      bump("writer returned fewer items than requested");
    }
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
  spend: { calls: SPEND.calls, input_tokens: SPEND.input, output_tokens: SPEND.output,
    usd: Number(spendUSD().toFixed(4)), price_per_mtok: PRICE_PER_MTOK, by_role: SPEND.byRole },
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
let retriedOk = 0, retriedStillBad = 0;
for (const g of generated) {
  /* A RESUMED ITEM MAKES NO CALL. The skip is before the first gate, so it cannot cost anything, and
   * the control asserts that by counting calls rather than by trusting this line. */
  const gid = itemId(g.item);
  if (resumed.has(gid)) {
    results.push(resumed.get(gid).record);
    continue;
  }
  const spendBefore = snapshotSpend();
  const rejectBefore = snapshotRejects();
  const t = g.task;
  let item = g.item;
  const ps = passagesFor(t);
  const gateInput = () => ({
    passagesByKey, annexGaps, sequenceGaps: [...sequenceGaps, ...declaredGaps], cert: CERT,
    liveStemsForTask: liveByTask.get(t.id) || [], cueCfg,
    primaryClauses: primaryOf(t.code), supportingClauses: supportingOf(t.code),
    sources: leakSources, leak: leakMod,
  });
  let code = runCodeGates(item, gateInput());

  /* ============ ONE PARAPHRASE RETRY, AND ONLY FOR REPRODUCTION ============
   *
   * The director's ruling. Reproduction is the one failure a rewrite can fix without changing
   * what the item MEASURES: the claim, the key and the anchor all stay, and only our wording
   * moves. A modal error or a wrong anchor is a different item, so those are never retried.
   *
   * The offending run is NAMED in the retry, because "paraphrase this" without it produces a
   * rewrite that misses the same span. And the retry is RE-GATED, not trusted -- the first
   * pilot's lesson was that a rewrite written to remove a reproduction can introduce another. */
  const reproFailed = code.gates.find((x) => x.id === "reproduction" && x.pass === false);
  const onlyRepro = code.failed.length === 1 && code.failed[0] === "reproduction" && !code.unasserted.length;
  if (reproFailed && onlyRepro) {
    let revised = null;
    try {
      CALL_ROLE = "paraphrase";
      revised = parseArray(await claude(WRITER_SYSTEM,
        writerUser(t, domById.get(t.domain_id) || {}, ps, 1) +
        "\n\nREWRITE THE ITEM BELOW. It is sound except that it reproduces the standard in a served" +
        "\nfield. " + reproFailed.reason +
        "\n\nParaphrase ONLY the offending run, in our own words. Keep the same claim, the same key," +
        "\nthe same key_support and the same clause. Do not change what the item measures." +
        "\n\n" + JSON.stringify({ ...item, options: item.options.map((o) => ({ text: o.text })) }, null, 1),
        6000));
    } catch (e) {
      record0Bump("reproduction retry could not run");
    }
    const cand = Array.isArray(revised) && revised.length ? revised[0] : null;
    if (cand && Array.isArray(cand.options) && cand.options.length === item.options.length) {
      const opts = cand.options.map((o, i) => ({
        text: String((o && o.text) || ""), is_correct: i === Number(cand.correct_index),
      }));
      /* The key must still be the same option, or this is a different item wearing a retry. */
      const keyMoved = opts.findIndex((o) => o.is_correct) !== item.options.findIndex((o) => o.is_correct);
      const candidate = { ...item, ...cand, options: opts };
      const recoded = keyMoved ? null : runCodeGates(candidate, gateInput());
      if (recoded && recoded.passed) {
        item = candidate; code = recoded; retriedOk++;
      } else {
        retriedStillBad++;
        bump(keyMoved ? "retry moved the key" : "reproduction survived the retry");
      }
    } else if (cand) { retriedStillBad++; bump("retry returned a malformed item"); }
  }

  const reproGate = code.gates.find((x) => x.id === "reproduction");
  const record = {
    task_code: t.code, domain: (domById.get(t.domain_id) || {}).code,
    item, gates: code.gates.map((x) => ({ id: x.id, pass: x.pass, examined: x.examined, reason: x.reason })),
    code_passed: code.passed, failed: code.failed, unasserted: code.unasserted,
    /* The longest run actually SERVED, per item, so the reproduction ceiling can be seen to
     * have held rather than asserted to have. */
    longest_served_run: reproGate ? (reproGate.longest_served_run ?? null) : null,
    longest_served_in: reproGate ? (reproGate.longest_in ?? null) : null,
    attributed_quotation: reproGate ? (reproGate.quotation ?? null) : null,
    grounding_family: normClauseForFamily(item.key_support_clause),
    solver: null, options_probe: null, verdict: null,
    /* the id at CREATION, not only on the survivor path: three of the four record sites are rejections,
     * and the id is what a resume matches on. */
    item_id: itemId(item),
  };

  if (!code.passed) {
    for (const f of code.failed) bump("code: " + f);
    for (const u of code.unasserted) bump("code UNASSERTED: " + u);
    record.verdict = "rejected by code";
    checkpoint(record, spendBefore, rejectBefore);
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
    checkpoint(record, spendBefore, rejectBefore);
    results.push(record);
    continue;
  }
  let parsed = null;
  try {
    CALL_ROLE = "solver";
    parsed = parseObject(await claude(SOLVER_SYSTEM, solverUser(payload, ps), 1500));
  } catch (e) {
    parsed = null;
    record.solver_error = String(e.message).slice(0, 200);
  }
  const v1 = solverVerdict(parsed, keyLabel);
  /* ============ RUN TWO: INDEPENDENT, SHUFFLED, AND BOTH MUST PASS ============
   *
   * Ruled PROMPT-91 s2. The solver gave one item two verdicts, so a single pass is a sample. Run two is
   * a fresh call with the options shuffled, so a verdict resting on option order cannot survive both.
   * The shuffle is seeded by the item's content id: an unseeded shuffle would make a split
   * unrepeatable, and an unrepeatable finding cannot be argued with. */
  let v = v1;
  if (v1.state !== "could-not-run") {
    let seed = parseInt(itemId(record.item).slice(0, 8), 16) || 1;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const opts = payload.options.slice();
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const tmp = opts[i]; opts[i] = opts[j]; opts[j] = tmp;
    }
    /* the key's TEXT is what identifies it after a shuffle, never its old label */
    const keyText = (payload.options.find((o) => o.label === keyLabel) || {}).text;
    const p2 = { ...payload,
      options: opts.map((o, i) => ({ label: String.fromCharCode(65 + i), text: o.text })) };
    const keyLabel2 = (p2.options.find((o) => o.text === keyText) || {}).label || keyLabel;
    let v2 = { state: "could-not-run", reason: "run two did not execute" };
    try {
      assertBlind(p2, record.item);
      CALL_ROLE = "solver";
      v2 = solverVerdict(parseObject(await claude(SOLVER_SYSTEM, solverUser(p2, ps), 1500)), keyLabel2);
    } catch (e) {
      v2 = { state: "could-not-run", reason: String(e.message).slice(0, 160) };
    }
    if (v1.state === "accepted" && v2.state === "accepted") {
      v = { ...v1, runs: 2, second: v2 };
    } else if (v1.state === v2.state) {
      v = { ...v1, runs: 2, second: v2 };
    } else {
      v = { state: "split", runs: 2, first: v1, second: v2,
        reason: "solver-split: run 1 " + v1.state + ", run 2 " + v2.state +
          " with options shuffled -- " + String(v2.reason || v1.reason || "").slice(0, 140) };
      bump("solver: solver-split");
    }
  }
  record.solver = { ...v, raw: parsed };
  if (v.state === "accepted") {
    record.verdict = "survivor";

    /* ============ THE OPTIONS-ONLY PROBE: FLAGGED, NEVER REJECTED ============
     *
     * A third model call, on the survivors only, seeing the four option texts and nothing else.
     * It flags an item a candidate with NO KNOWLEDGE could answer from the shape of the options.
     * It does not reject: with four options it is right one in four by luck, and it will always
     * produce a story. So a flag needs BOTH the key and a concrete, checkable cue, and it goes
     * on the director's read list with that cue rather than being thrown away. */
    try {
      const op = optionsPayload(item);
      assertOptionsOnly(op, item);
      CALL_ROLE = "options-probe";
      const probeRaw = parseObject(await claude(OPTIONS_PROBE_SYSTEM, optionsProbeUser(op), 800));
      const pv = optionsProbeVerdict(probeRaw, keyLabel);
      record.options_probe = pv;
      if (pv.state === "flag") {
        flagCounts.set("options probe: a cue in the options alone", (flagCounts.get("options probe: a cue in the options alone") || 0) + 1);
        console.log("  " + t.code + "  SURVIVOR  key " + keyLabel + ", anchored in " +
          item.key_support_clause + "   OPTIONS-PROBE FLAG (" + pv.cue_kind + ")");
      } else {
        console.log("  " + t.code + "  SURVIVOR  key " + keyLabel + ", anchored in " + item.key_support_clause);
      }
    } catch (e) {
      /* A probe that could not run leaves the item a survivor and says the probe is UNRUN --
       * folding it into "no cue" would claim a check nobody performed. */
      record.options_probe = { state: "could-not-run", reason: String(e.message).slice(0, 160) };
      flagCounts.set("options probe COULD NOT RUN", (flagCounts.get("options probe COULD NOT RUN") || 0) + 1);
      console.log("  " + t.code + "  SURVIVOR  key " + keyLabel + ", anchored in " +
        item.key_support_clause + "   (options probe could not run)");
    }

    /* ============ THE DE-CUE RETRY: DISTRACTORS ONLY, ONE ATTEMPT ============
     *
     * Ruled in PROMPT-78 section 2 and amended in PROMPT-79: the probe stays a flag with no target
     * rate, and the retry is worth doing anyway because it fixes the item's SHAPE without touching
     * what it TESTS. So the key, the stem, the explanation and the anchor stay BYTE-IDENTICAL and only
     * the distractors move.
     *
     * IT RUNS FOR THE PROBE'S FLAG AND FOR THE FOUR CODE CUES ALIKE, because all five describe the
     * same defect: something about the option set answers the question without the subject.
     *
     * AND EVERYTHING THE DISTRACTORS AFFECT IS RE-RUN -- the code gates, the BLIND SOLVER and the
     * probe. The solver matters most: a rewritten distractor can become a second correct answer,
     * which is exactly what pilot-2 #15 was. A retry that fails the solver is REVERTED TO THE
     * ORIGINAL rather than rejected, because the original had already passed. */
    /* ============ THE TRIGGER IS A CODE CUE, AND NOT EVERY CODE CUE ============
     *
     * Ruled 2026-09-28 after the director read all 24 pilot-4 rewrites.
     *
     * THE PROBE NO LONGER TRIGGERS ANYTHING. It is a model call that picks the key on 98 percent of the
     * AUTHORED bank, so it reads examiner convention rather than a defect. Most of pilot 4's rewrites
     * were probe-only on items with no code cue, and rewriting to satisfy it produced parallel, clunkier
     * distractors that it flagged anyway -- three items went from no-cue to flag, with the cue kind
     * simply moving to shared-phrase. It is printed as a flag and recorded, and it starts nothing.
     *
     * AND CLANG DOES NOT TRIGGER EITHER, until it is narrowed. Its first real measurement -- possible
     * only after `keyIndex` learned to read a database row -- is 1790 of 4155 secure items, 43 percent,
     * against a module whose own header says every rule fires on a minority. Members read: "the key
     * echoes `review`", "`product`", "`developer`". That is the item's subject, not a cue.
     *
     * Clang REMAINS in revert check 3, where it compares an item against itself. "A cue appeared that
     * was not there" does not depend on the base rate; "this item has a cue, rewrite it" does. */
    const TRIGGER_CUES = new Set(["key-length", "only-hedged", "odd-verdict", "opposite-pair", "agreement"]);
    const preCues = shapeCues(item);
    const triggering = preCues.filter((c) => TRIGGER_CUES.has(c.id));
    const wantsDeCue = triggering.length > 0;
    record.shape_cues_before = preCues.map((c) => ({ id: c.id, cue: c.cue }));
    record.decue_trigger = triggering.map((c) => c.id);
    record.decue_non_trigger_cues = preCues.filter((c) => !TRIGGER_CUES.has(c.id)).map((c) => c.id);
    /* ============ THE BEFORE VERDICT IS KEPT, NOT RECONSTRUCTED ============
     *
     * The retry overwrites `options_probe` with the post-rewrite verdict, and the first pilot-4 run
     * therefore lost the ORIGINAL pick on every de-cued item -- so "the key-pick rate before and
     * after", which is the thing the ruling asks for, had to be reconstructed from whether the cue
     * list happened to name the probe. A reconstructed number is weaker than a recorded one and it
     * cannot be checked later. Both verdicts are now stored. */
    record.options_probe_before = record.options_probe ? { ...record.options_probe } : null;
    /* THE PRE-DE-CUE ITEM IS KEPT. The retry replaces record.item, so the original distractors were
     * lost -- and reviewing a rewrite means reading it BESIDE what it replaced. Recovering them from
     * the raw artifact worked for 21 of 24 items and not for the 3 the paraphrase retry had also
     * touched. An artifact that cannot answer the question it exists for is half an artifact. */
    record.item_before_decue = JSON.parse(JSON.stringify(item));
    if (wantsDeCue) {
      deCueAttempted++;
      /* The writer is told ONLY the cues it is being asked to clear. Handing it the probe's cue as well
       * is what produced rewrites aimed at a signal the rule no longer acts on -- and a rewrite aimed at
       * the wrong target still costs the plausibility risk. */
      const cueList = triggering.map((c) => c.id + ": " + c.cue).join("\n  - ");
      const keyText = item.options[keyIdxOf(item)].text;
      let revised = null;
      try {
        CALL_ROLE = "de-cue";
        revised = parseObject(await claude(DE_CUE_SYSTEM,
          "CUE(S) A CANDIDATE COULD USE, from instruments that saw only the options:\n  - " + cueList +
          "\n\nSTEM (do not change):\n" + item.question_text +
          "\n\nKEY (do not change, reproduce it EXACTLY as option " + keyLabel + "):\n" + keyText +
          "\n\nDISTRACTORS to rewrite, in order:\n" +
          item.options.map((o, i) => (i === keyIdxOf(item) ? null : "  " +
            String.fromCharCode(65 + i) + ": " + o.text)).filter(Boolean).join("\n"),
          3000));
      } catch (e) {
        record.de_cue = { state: "could-not-run", reason: String(e.message).slice(0, 160) };
        deCueUnrun++;
      }
      if (revised && Array.isArray(revised.distractors)) {
        const cand = applyDistractors(item, revised.distractors, keyIdxOf(item));
        if (!cand) {
          record.de_cue = { state: "malformed", reason: "the retry did not return one text per distractor" };
          deCueMalformed++;
        } else {
          /* ============ THE TWO REWRITE CHECKS COME FIRST, BECAUSE THEY ARE FREE ============
           *
           * Both are code, both revert. They run before the gates and long before the solver: an
           * absolute the rewrite introduced, or a real control it replaced with an invented process,
           * is decidable without a single model call. Ordering the cheap decisive check first is the
           * same reason the solver runs before the probe. */
          const ki2 = keyIdxOf(item);
          const origD = item.options.filter((_, i) => i !== ki2).map((o) => o.text);
          const newD = cand.options.filter((_, i) => i !== ki2).map((o) => o.text);
          const rw = deCueRewriteCheck(origD, newD, controlTitles);
          /* ============ CHECKS 3, 4 AND 5, ALSO FREE, ALSO BEFORE ANY MODEL CALL ============
           *
           * All three come from the director's read of pilot 4, and all three revert:
           *
           *   3  a cue id the original did not carry        2.6 and 4.1 went none -> clang
           *   4  the triggering cue did not clear           4.3 went clang -> clang
           *   5  a restrictive limiter was dropped          3.2 lost `once`, 5.1 lost `on its own`
           *
           * Check 4 is why the trigger list is recorded: without it, "the cue cleared" has no subject.
           * Check 5 accepts ANY limiter as the equivalent, per the ruling -- 2.7 traded `until` for
           * `before` and the restriction is intact. */
          const postCues = shapeCues(cand).map((c) => c.id);
          const c3 = newCodeCue(preCues.map((c) => c.id), postCues);
          const c4 = triggerCleared(record.decue_trigger, postCues);
          const c5 = limiterDropped(origD, newD);
          record.de_cue_rewrite_check = { ...rw, new_code_cue: c3, trigger_cleared: c4, limiter_dropped: c5 };
          record.shape_cues_after = shapeCues(cand).map((c) => ({ id: c.id, cue: c.cue }));
          /* ONE REVERT PATH, FIVE REASONS. Every one of them must short-circuit -- set the state,
           * restore the recorded cue list, push the record and skip the gates and the solver, because
           * the item that ships is the ORIGINAL and it has already passed all of them.
           *
           * My first wiring of checks 3, 4 and 5 set the state and FELL THROUGH to the gates, which
           * would have re-gated a reverted item and then overwritten its verdict with the rewrite's.
           * Collapsing the five into one exit is what makes that impossible to get wrong again. */
          const revertReason =
            rw.revert ? rw.reason
            : c3.length ? "check 3: new code cue " + c3.join(", ") + " that the original did not carry"
            : !c4.cleared ? "check 4: the triggering cue " + c4.remaining.join(", ") + " did not clear"
            : c5.length ? "check 5: limiter dropped -- " +
                c5.map((x) => "option " + (x.index + 1) + " lost " + JSON.stringify(x.limiter)).join("; ")
            : null;
          if (revertReason) {
            record.de_cue = { state: "reverted", reason: revertReason };
            deCueRevertedRewrite++;
            record.shape_cues_after = record.shape_cues_before;
            checkpoint(record, spendBefore, rejectBefore);
            results.push(record);
            continue;
          }

          /* Everything the distractors can affect, in order of cost. */
          const recoded = runCodeGates(cand, gateInput());
          let reSolver = null, reProbe = null, keptIt = false;
          if (!recoded.passed) {
            record.de_cue = { state: "reverted", reason: "the rewritten distractors failed " + recoded.failed.join(", ") };
            deCueRevertedGates++;
          } else {
            try {
              const p2 = blindPayload(cand, ps);
              assertBlind(p2, cand);
              CALL_ROLE = "solver-recheck";
              const parsed2 = parseObject(await claude(SOLVER_SYSTEM, solverUser(p2, ps), 1500));
              reSolver = solverVerdict(parsed2, keyLabel);
            } catch (e) {
              reSolver = { state: "could-not-run", reason: String(e.message).slice(0, 160) };
            }
            if (reSolver.state !== "accepted") {
              /* REVERTED, NOT REJECTED. The original passed; a failed improvement must not cost a
               * sound item. This is pilot-2 #15's defect caught before it can land. */
              record.de_cue = { state: "reverted", reason: "the solver no longer accepts it: " + reSolver.state };
              deCueRevertedSolver++;
            } else {
              try {
                const op2 = optionsPayload(cand);
                assertOptionsOnly(op2, cand);
                CALL_ROLE = "options-probe";
                reProbe = optionsProbeVerdict(parseObject(await claude(OPTIONS_PROBE_SYSTEM, optionsProbeUser(op2), 800)), keyLabel);
              } catch (e) {
                reProbe = { state: "could-not-run", reason: String(e.message).slice(0, 160) };
              }
              item = cand;
              record.item = cand;
              record.gates = recoded.gates.map((x) => ({ id: x.id, pass: x.pass, examined: x.examined, reason: x.reason }));
              record.solver = { ...reSolver };
              record.options_probe = reProbe;
              record.de_cue = { state: "applied",
                probe_before: cueList.slice(0, 200),
                probe_after: reProbe ? reProbe.state : null };
              keptIt = true;
              deCueApplied++;
            }
          }
          if (!keptIt) record.de_cue_candidate_discarded = true;
        }
      } else if (revised) {
        record.de_cue = { state: "malformed", reason: "no distractors array" };
        deCueMalformed++;
      }
      record.shape_cues_after = shapeCues(item).map((c) => ({ id: c.id, cue: c.cue }));
    } else {
      record.shape_cues_after = record.shape_cues_before;
    }
  } else if ((v.state === "rejected" || v.state === "split")) {
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
  checkpoint(record, spendBefore, rejectBefore);
  results.push(record);
}

/* ---------------------------------------------------------------- report */
/* ============ THE ANCHOR CAP, APPLIED AFTER EVERY OTHER GATE ============
 *
 * Last, because it is a property of the SET rather than of an item: an over-cap item is not defective,
 * it is surplus. THE REJECTION IS NEVER A REWRITE -- ruled -- because rewriting the distractors cannot
 * change where the key rests, and would spend a model call to produce an item still to be refused.
 * Earlier items in the artifact win, which is stated because an order nobody states is irreproducible. */
for (const code of new Set(results.map((r) => r.task_code))) {
  const mine = results.filter((r) => r.verdict === "survivor" && r.task_code === code);
  const decided = applyCap(mine.map((r) => ({ ref: r, source_id: "ISO/IEC 42001",
    clause: r.item.key_support_clause })), capCensus.get(code) || new Map(), CAP);
  for (const d of decided) {
    if (!d.over_cap) continue;
    d.ref.verdict = "rejected";
    d.ref.failed = [...(d.ref.failed || []), "anchor-cap"];
    d.ref.anchor_cap = { over_cap: true, reason: d.reason };
    bump("code: anchor-cap");
  }
}
const survivors = results.filter((r) => r.verdict === "survivor");
console.log("");
console.log("OUTCOME");
console.log(spendReport());
console.log("  generated          " + generated.length);
console.log("  survivors          " + survivors.length);
console.log("  rejected by code   " + results.filter((r) => r.verdict === "rejected by code").length);
console.log("  rejected by solver " + results.filter((r) => r.verdict === "rejected by solver").length);
console.log("  undecided          " + results.filter((r) => r.verdict === "solver could not run").length);
console.log("");
/* ============ A FLAG IS NOT A REJECTION, AND THIS TABLE IS HEADED "WHY" ============
 *
 * The options probe was counted into rejectCounts, so a table headed WHY ITEMS WERE REJECTED listed
 * it at 23 while 11 items were rejected -- a number larger than the thing it claims to explain,
 * which is arithmetically impossible and reads as the probe being the largest cause of rejection.
 * The director ruled it out of this table once; it was removed from the emitted REPORT and left in
 * the generator that produces it, which is the same defect surviving on a second surface.
 *
 * Flags now have their own tally, printed under its own heading. */
console.log("  WHY REJECTED, by gate (a rejection can name more than one):");
for (const [k, n] of [...rejectCounts].sort((a, b) => b[1] - a[1])) {
  console.log("    " + String(n).padStart(4) + "  " + k);
}
if (flagCounts.size) {
  console.log("  FLAGGED, NEVER REJECTED (these items are survivors):");
  for (const [k, n] of [...flagCounts].sort((a, b) => b[1] - a[1])) {
    console.log("    " + String(n).padStart(4) + "  " + k);
  }
}

/* ============ ANCHOR CLUSTERS: FLAGGED, NOT REJECTED ============
 *
 * Items in DIFFERENT tasks whose keys rest on the SAME clause cross-cue each other on one form:
 * a candidate who reads one learns the answer to the others. The first pilot had three such
 * clusters and stem identity could not see any of them, because the stems differ -- which is
 * exactly why the existing dedupe misses them.
 *
 * Same task is not a cluster: a task's items are expected to share its clauses, and the form
 * assembler already picks across tasks. The cross-cueing case is the cross-TASK one.
 *
 * Recorded as `grounding_family` per item and listed here. `generate-mock-exam` is NOT touched. */
const clusters = [];
{
  const byFamily = new Map();
  for (const r of results) {
    if (r.verdict !== "survivor" || !r.grounding_family) continue;
    if (!byFamily.has(r.grounding_family)) byFamily.set(r.grounding_family, []);
    byFamily.get(r.grounding_family).push(r);
  }
  for (const [family, rows] of byFamily) {
    const distinctTasks = [...new Set(rows.map((r) => r.task_code))];
    if (rows.length > 1 && distinctTasks.length > 1) {
      clusters.push({ family, tasks: distinctTasks, items: rows.length });
    }
  }
  clusters.sort((a, b) => b.items - a.items);
}
console.log("");
console.log("  ANCHOR CLUSTERS (same clause, DIFFERENT tasks -- these cross-cue on one form)");
if (!clusters.length) console.log("    none");
for (const c of clusters) {
  console.log("    " + c.family.padEnd(10) + c.items + " survivors across tasks " + c.tasks.join(", "));
}

const probeFlags = results.filter((r) => r.options_probe && r.options_probe.state === "flag");
console.log("");
console.log("  OPTIONS-ONLY PROBE  " + probeFlags.length + " flag(s) of " + survivors.length + " survivor(s)");
for (const r of probeFlags) {
  console.log("    " + r.task_code + "  (" + r.options_probe.cue_kind + ") " +
    String(r.options_probe.cue).slice(0, 96));
}
const probeUnrun = results.filter((r) => r.options_probe && r.options_probe.state === "could-not-run").length;
if (probeUnrun) console.log("    " + probeUnrun + " probe(s) COULD NOT RUN -- not a clean result for those items");

console.log("");
console.log("  PARAPHRASE RETRY (reproduction only)  fixed " + retriedOk + ", still failing " + retriedStillBad);

/* ============ THE DE-CUE RETRY, AND THE KEY-PICK RATE BEFORE AND AFTER ============
 *
 * KEY-PICK, not the flag rate: "it named the key, cue or no cue" is the number comparable across
 * banks, and the baseline measured the AUTHORED bank at 98 percent. A flag additionally needs the
 * model to articulate a cue, which depends on it bothering to.
 *
 * `reverted` is reported in its own right and split by WHICH check reverted it, because a retry that
 * the solver refuses is the pilot-2 #15 defect being caught -- a success for the process, not a
 * failure of it. */
const pickRateOf = (rows, field) => {
  const ran = rows.filter((r) => r[field] && r[field].state !== "could-not-run" && r[field].pick);
  const hit = ran.filter((r) => r[field].pick === String.fromCharCode(65 + r.item.correct_index));
  return { n: ran.length, hit: hit.length, pct: ran.length ? Math.round(100 * hit.length / ran.length) : null };
};
const before = pickRateOf(survivors, "options_probe_before");
const after = pickRateOf(survivors, "options_probe");
console.log("");
console.log("  DE-CUE RETRY (distractors only, one attempt)");
console.log("    attempted " + deCueAttempted + "   applied " + deCueApplied +
  "   reverted " + (deCueRevertedSolver + deCueRevertedGates + deCueRevertedRewrite) +
  " (rewrite checks " + deCueRevertedRewrite + ", solver " + deCueRevertedSolver + ", code gates " + deCueRevertedGates + ")" +
  "   malformed " + deCueMalformed + "   could-not-run " + deCueUnrun);
console.log("    KEY-PICK RATE  before " + before.hit + "/" + before.n + (before.pct === null ? "" : "  " + before.pct + "%") +
  "   after " + after.hit + "/" + after.n + (after.pct === null ? "" : "  " + after.pct + "%") +
  "   (chance 25%, authored bank 98%)");
const cueTally = (field) => survivors.reduce((a, r) => {
  for (const c of (r[field] || [])) a[c.id] = (a[c.id] || 0) + 1;
  return a;
}, {});
console.log("    SHAPE CUES before: " + JSON.stringify(cueTally("shape_cues_before")));
console.log("    SHAPE CUES after : " + JSON.stringify(cueTally("shape_cues_after")) +
  "   (key-length tolerance " + KEY_LENGTH_TOLERANCE + "x)");
console.log("    Each of these FLAGS. None rejects, and the probe has no target rate.");

const runs = survivors.map((r) => r.longest_served_run).filter((x) => typeof x === "number");
console.log("  LONGEST SERVED RUN across survivors   max " + (runs.length ? Math.max(...runs) : "n/a") +
  ", median " + (runs.length ? runs.slice().sort((a, b) => a - b)[Math.floor(runs.length / 2)] : "n/a") +
  "   (the ceiling is 9)");
const over = survivors.filter((r) => typeof r.longest_served_run === "number" && r.longest_served_run > 9);
console.log("  survivors over the ceiling            " + over.length + " (must be 0)");

writeFileSync(OUT_PATH, JSON.stringify({
  certification: CERT, model: MODEL, standard: mapping.standard, edition: mapping.edition,
  /* the FINAL spend, after gating. The raw artifact carries only the writer calls, because it is written
   * before any gate runs -- so a cost read off that one would omit every solver call. */
  spend: { calls: SPEND.calls, input_tokens: SPEND.input, output_tokens: SPEND.output,
    usd: Number(spendUSD().toFixed(4)), price_per_mtok: PRICE_PER_MTOK, by_role: SPEND.byRole },
  attempted: N, generated: generated.length, survivors: survivors.length,
  generation_note: priorNote,
  reject_counts: Object.fromEntries(rejectCounts),
  tasks_mapped: mappedTasks.length, tasks_total: tasks.length,
  unmapped_tasks: unmapped.map((t) => t.code),
  held_tasks: HELD_TASKS,
  paraphrase_retry: { fixed: retriedOk, still_failing: retriedStillBad },
  de_cue_retry: { attempted: deCueAttempted, applied: deCueApplied,
    reverted_by_rewrite_check: deCueRevertedRewrite,
    reverted_by_solver: deCueRevertedSolver, reverted_by_gates: deCueRevertedGates,
    malformed: deCueMalformed, could_not_run: deCueUnrun },
  key_pick_before: before, key_pick_after: after,
  shape_cues_before: cueTally("shape_cues_before"), shape_cues_after: cueTally("shape_cues_after"),
  anchor_clusters: clusters,
  options_probe_flags: probeFlags.length,
  options_probe_unrun: probeUnrun,
  longest_served_run_max: runs.length ? Math.max(...runs) : null,
  items: results,
}, null, 1) + "\n", "utf8");
console.log("");
console.log("wrote " + OUT);
/* ============ A COMPLETED RUN RETIRES ITS PARTIAL ============
 *
 * Left in place, a full partial file would make the next run with this --out skip every item, make zero
 * calls and finish instantly -- a run that did nothing, wearing the look of a fast success. Renamed, so a
 * resume is only ever possible for a run that did NOT finish. */
if (existsSync(PARTIAL)) {
  const done = PARTIAL + ".done";
  renameSync(PARTIAL, done);
  console.log("  checkpoint retired: " + PARTIAL.split(/[\\/]/).pop() + " -> " +
    done.split(/[\\/]/).pop() + "   (a resume is only possible for an unfinished run)");
}

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
    /* ============ BALANCED KEY POSITION, COUNTED PER TASK ============
     *
     * Ruled PROMPT-95 s1c. `seq` is a counter keyed on TASK CODE, not the position in the survivor list: a
     * list ordered by task would otherwise put every task's first item at position A, which is the skew
     * with extra steps. `placed` is reported after the insert so the fix is visible in the run that made it. */
    const seqOf = new Map();
    const placed = {};
    const insertedIds = [];
    let groundingWrote = 0, groundingFailed = 0;
    for (const r of survivors) {
      const t = tasks.find((x) => x.code === r.task_code);
      const seq = seqOf.get(r.task_code) || 0;
      seqOf.set(r.task_code, seq + 1);
      const balanced = balanceKeyOrder(r.item, seq, r.item_id || itemId(r.item), r.task_code);
      placed[balanced.keyId] = (placed[balanced.keyId] || 0) + 1;
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
        /* ============ THE OPTIONS ARE PERMUTED HERE, NOT TAKEN IN ARTIFACT ORDER ============
         *
         * 73 percent of grounded keys sat at option A, and nothing shuffled at insert or at delivery, so a
         * candidate answering A scored about 75 percent on grounded items. `balanceKeyOrder` walks the key
         * round-robin A, B, C, D within each task and reassigns the ids in DISPLAY ORDER -- because
         * exam-runner.tsx:897 renders the letter from `opt.id` and not from the array index, so permuting
         * the array alone would display A, C, B, D.
         *
         * Grading is untouched: both graders compare id SETS, and `correct_answer` is taken from the key's
         * own id below. That agreement is asserted inside balanceKeyOrder rather than assumed here. */
        options: balanced.item.options.map((o) => ({ id: o.id, text: o.text })),
        correct_answer: [balanced.keyId],
        explanation: r.item.explanation,
        /* draft, never approved, and out of exam scope: two independent reasons it cannot
         * reach a form, because a guarantee that depends on one column staying true is not
         * a guarantee. */
        /* ============ pending_review, AND EVERY DEFAULT-ABLE COLUMN NAMED ============
         *
         * This said `status: "draft"` from the day it was written, and no row could ever carry it:
         * `quiz_questions_status_check` allows pending_review | approved | rejected. `--apply` had
         * never run, so the branch read exactly like one that works -- the second defect of that
         * shape on this path, after the integer `correct_answer` where the bank stores ["c"].
         *
         * `pending_review` is the vocabulary's word for this state and is excluded everywhere
         * `approved` is required. Ruled 2026-09-27.
         *
         * AND EVERY COLUMN A DEFAULT COULD DECIDE IS WRITTEN, as insert-pilot-drafts.mjs does. The
         * defaults are status='approved', visibility='secure' and is_exam_scope=true: two happen to
         * be safe for an unapproved row and one is catastrophic, and which is which is not a thing
         * to rely on. `language` and `question_type` are named for the same reason. */
        status: "pending_review",
        pool: "secure",
        visibility: "secure",
        is_exam_scope: EXAM_SCOPE,
        item_origin: "generated",
        question_type: "single_choice",
        bloom_level: t.bloom_level,
        difficulty: 3,
      };
      const res = await fetch(REST_URL + "/quiz_questions", {
        method: "POST",
        headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json",
          Prefer: "return=representation" },
        body: JSON.stringify([body]),
      });
      if (!res.ok) {
        console.error("  insert failed: " + res.status + " " + (await res.text()).slice(0, 240));
        process.exitCode = 2;
        break;
      }
      wrote++;
      const back = await res.json().catch(() => null);
      const id = Array.isArray(back) ? (back[0] || {}).id : (back || {}).id;
      if (id) insertedIds.push(id);

      /* ---- the grounding row, paired with the question ---- */
      if (id) {
        const gBody = {
          question_id: id,
          key_support_clause: r.item.key_support_clause,
          key_support: r.item.key_support,
          source_id: STANDARD_OF[CERT] || "ISO/IEC 42001",
          edition: EDITION_OF[CERT] || "2023",
          gates: r.gates ?? [],
          solver: r.solver ?? null,
          generator: "gen-grounded-items.mjs",
          model: MODEL,
          grounding_family: r.grounding_family ?? r.item.key_support_clause,
        };
        const gRes = await fetch(REST_URL + "/item_grounding", {
          method: "POST",
          headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json",
            Prefer: "return=representation" },
          body: JSON.stringify([gBody]),
        });
        if (!gRes.ok) {
          /* NO TRANSACTION, SO COMPENSATE. A question with no grounding row is invisible to the
           * anchor-cap census, which is exactly the defect this write exists to close -- so the
           * question is removed rather than left behind. */
          console.error("  grounding insert FAILED for " + String(id).slice(0, 8) + ": " +
            gRes.status + " " + (await gRes.text()).slice(0, 200));
          const del = await fetch(REST_URL + "/quiz_questions?id=eq." + id, {
            method: "DELETE",
            headers: { apikey: KEY, Authorization: "Bearer " + KEY, Prefer: "return=representation" },
          });
          const gone = del.ok ? (await del.json().catch(() => [])).length : 0;
          if (!del.ok || gone !== 1) {
            console.error("  AND THE COMPENSATING DELETE FAILED. Row " + id + " is an ORPHAN:");
            console.error("  a question with no grounding row, invisible to the anchor-cap census.");
            console.error("  Delete it by hand or run the orphan backfill before generating again.");
            process.exitCode = 2;
            break;
          }
          wrote--;
          insertedIds.pop();
          groundingFailed++;
          continue;
        }
        groundingWrote++;
      }
    }
    console.log("  inserted " + wrote + " pending_review row(s), " + groundingWrote +
      " grounding row(s)" + (groundingFailed ? "; " + groundingFailed + " rolled back" : ""));
    console.log("  KEY POSITION as inserted:  " + ["a", "b", "c", "d"]
      .map((L) => L.toUpperCase() + ":" + (placed[L] || 0)).join("  ") +
      "   (round-robin per task, reproducible from the artifact)");

    /* ============ THE POST-CONDITION READS BACK THE ROWS IT WROTE ============
     *
     * It used to query `status=eq.draft`, which no row can carry -- so after the status fix it would
     * have returned ZERO rows and reported "0 in exam scope (must be 0)" as a pass. A post-condition
     * whose filter matches nothing is the vacuous-pass shape this repository opens with, and the
     * status change is exactly the edit that would have created it.
     *
     * So it reads back BY ID, asserts the count, and asserts every column this path names -- the
     * same discipline as insert-pilot-drafts.mjs. */
    if (!insertedIds.length) throw new Error("nothing was inserted, so there is nothing to verify");
    const back = await getAll(KEY,
      "quiz_questions?select=id,status,pool,visibility,is_exam_scope,item_origin,language" +
      "&id=in.(" + insertedIds.join(",") + ")");
    const bad = [];
    for (const r of back) {
      if (r.status !== "pending_review") bad.push(r.id.slice(0, 8) + " status=" + r.status);
      /* the post-condition asserts what was WRITTEN, not a constant. It hardcoded false and fired on
       * the first --exam-scope insert, reporting a correctly written row as a violation -- a gate that
       * cannot see a flag the writer honours is a gate that disagrees with its own program. */
      if (r.is_exam_scope !== EXAM_SCOPE) bad.push(r.id.slice(0, 8) + " is_exam_scope=" + r.is_exam_scope + " (wrote " + EXAM_SCOPE + ")");
      if (r.pool !== "secure") bad.push(r.id.slice(0, 8) + " pool=" + r.pool);
      if (r.visibility !== "secure") bad.push(r.id.slice(0, 8) + " visibility=" + r.visibility);
      if (r.item_origin !== "generated") bad.push(r.id.slice(0, 8) + " item_origin=" + r.item_origin);
      if (r.language !== "en") bad.push(r.id.slice(0, 8) + " language=" + r.language);
    }
    console.log("  POST-CONDITION  read back " + back.length + " of " + insertedIds.length +
      "; every named column as written: " + (bad.length ? bad.length + " VIOLATION(S)" : "yes"));
    for (const b of bad.slice(0, 8)) console.log("      " + b);
    if (back.length !== insertedIds.length || bad.length) {
      throw new Error("the inserted rows do not read back as written -- see above");
    }
  }
}
