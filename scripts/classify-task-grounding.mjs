/**
 * classify-task-grounding.mjs -- for each task, which held source could ground it?
 *
 * READ-ONLY on the bank. Spends on a model, so --max-usd is REQUIRED. Ruled PROMPT-144 s2.
 *
 *   --certs A,B,C     certification codes (required)
 *   --max-usd=<n>     REQUIRED ceiling
 *   --out=<file>      the artifact
 *
 * ============ THE MODEL SEES STATEMENTS, NEVER PASSAGES ============
 *
 * The task statements are ours and carry no licence. The model is given the statement, the list of
 * held sources BY NAME, and the class definitions -- and no passage text at all, so nothing licensed
 * crosses into the prompt and no answer can be a quotation.
 *
 * It follows that a `scrum-guide` verdict means "a reader who knows the Scrum Guide would expect this
 * to be in it", not "clause X covers it". The mapping stage still has to find the clause. What this
 * measures is the PROPORTION of tasks with no held source at all, which is the number that decides
 * whether the family can be grounded.
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let CERTS = null, MAX_USD = null, OUT = null, m;
for (const a of process.argv.slice(2)) {
  if ((m = /^--certs=(.+)$/.exec(a))) { CERTS = m[1].split(",").map((s) => s.trim()).filter(Boolean); continue; }
  if ((m = /^--max-usd=([\d.]+)$/.exec(a))) { MAX_USD = Number(m[1]); continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  console.error("classify-task-grounding: unrecognised flag " + a);
  console.error("  --certs=A,B --max-usd=<n> [--out=<file>]   READ-ONLY on the bank");
  process.exitCode = 2; process.exit();
}
if (!CERTS) { console.error("--certs is required"); process.exit(2); }
if (MAX_USD == null) { console.error("--max-usd is REQUIRED on any run that calls a model."); process.exit(2); }
OUT = OUT || "TASK-GROUNDING-CLASSES.json";

const MODEL = "claude-sonnet-5-5";
const PRICE = { input: 2, output: 10 };
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
const KEY = requireKey(HERE);
let inTok = 0, outTok = 0, calls = 0;
const usd = () => (inTok / 1e6) * PRICE.input + (outTok / 1e6) * PRICE.output;

async function claude(system, user, maxTokens = 4000) {
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
const parseArr = (s) => {
  const a = s.indexOf("["), b = s.lastIndexOf("]");
  if (a < 0 || b < a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; }
};

/* the held sources, BY NAME ONLY, read from the library rather than typed */
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const held = [...new Set(lib.sources.map((s) => s.id + " " + s.edition))].sort();

const SYSTEM = `You classify EXAMINATION TASK STATEMENTS by which reference document could ground an
item written for them. You are given the statement only. You are NEVER given document text, and you
must not quote any document.

THE HELD SOURCES, by name:
${held.map((h) => "  - " + h).join("\n")}

Assign EXACTLY ONE class per task:

  scrum-guide    answerable from the Scrum Guide 2020 -- the Scrum framework itself: accountabilities
                 (Product Owner, Scrum Master, Developers), the five events, the three artifacts and
                 their commitments, the three pillars, the five values, the Sprint, done-ness.
  ebm            answerable from the Evidence-Based Management Guide 2024 -- Key Value Areas, value
                 measures, experimentation loops, goal setting toward a strategic goal.
  ai-held        the AI side of the task, answerable from a held AI source. Name which in "source".
  agile-general  REAL PRACTICE THE SCRUM GUIDE DOES NOT CONTAIN: estimation techniques (story points,
                 planning poker), user stories and acceptance criteria as artifacts, burn-down and
                 burn-up charts, velocity, scaling frameworks (SAFe, LeSS, Nexus), Kanban/WIP limits,
                 facilitation and coaching technique, team dynamics models, specific tooling.
                 The Scrum Guide is deliberately minimal: if the statement names a practice it does
                 not define, this is the class, even when the practice is universal in industry.
  none           the statement is too vague to tell.

Prefer the SPECIFIC class over a general one. If a task is mostly Scrum framework with an AI framing,
use scrum-guide. If it is mostly an AI-governance question wearing Scrum vocabulary, use ai-held.
agile-general is NOT a fallback for "hard to place" -- that is none.

Reply with ONLY a JSON array, one object per task, in the order given:
[{"code":"1.1","class":"scrum-guide","source":null,"why":"<12 words max>"}]
"source" is the held source name for ai-held, otherwise null.`;

const certs = await getAll(KEY, "certifications?select=id,code&order=code");
const doms = await getAll(KEY, "domains?select=id,certification_id&order=id");
const tasks = await getAll(KEY, "tasks?select=id,code,domain_id,statement,is_exam_scope&order=code");

const BATCH = 22;
const out = {};
let stopped = false;
for (const code of CERTS) {
  const c = certs.find((x) => x.code === code);
  if (!c) { console.error("no certification " + code); continue; }
  const mineDom = new Set(doms.filter((d) => d.certification_id === c.id).map((d) => d.id));
  const mine = tasks.filter((t) => mineDom.has(t.domain_id));
  out[code] = [];
  for (let i = 0; i < mine.length; i += BATCH) {
    if (usd() >= MAX_USD) { stopped = true; break; }
    const slice = mine.slice(i, i + BATCH);
    const user = "Classify these " + slice.length + " task statements from " + code + ".\n\n" +
      slice.map((t) => t.code + ": " + String(t.statement || "").replace(/\s+/g, " ").trim()).join("\n\n");
    let arr = null;
    try { arr = parseArr(await claude(SYSTEM, user)); } catch (e) {
      console.error("  " + code + " batch " + i + ": " + String(e.message).slice(0, 100));
    }
    if (!arr) {
      for (const t of slice) out[code].push({ code: t.code, class: "could-not-run", source: null, why: "" });
      continue;
    }
    const byCode = new Map(arr.filter((x) => x && x.code).map((x) => [String(x.code), x]));
    for (const t of slice) {
      const v = byCode.get(t.code);
      out[code].push(v
        ? { code: t.code, class: String(v.class || "none"), source: v.source || null,
            why: String(v.why || "").slice(0, 90), statement: String(t.statement || "").replace(/\s+/g, " ").trim() }
        : { code: t.code, class: "could-not-run", source: null, why: "absent from the reply",
            statement: String(t.statement || "").replace(/\s+/g, " ").trim() });
    }
    console.log("  " + code + "   " + out[code].length + " of " + mine.length + "   $" + usd().toFixed(4));
  }
  if (stopped) break;
}

console.log("");
const CLASSES = ["scrum-guide", "ebm", "ai-held", "agile-general", "none", "could-not-run"];
console.log("CLASS COUNTS");
console.log("  cert".padEnd(12) + CLASSES.map((c) => c.slice(0, 13).padStart(15)).join("") + "   total");
for (const code of Object.keys(out)) {
  const t = {};
  for (const r of out[code]) t[r.class] = (t[r.class] || 0) + 1;
  console.log("  " + code.padEnd(10) + CLASSES.map((c) => String(t[c] || 0).padStart(15)).join("") +
    String(out[code].length).padStart(8));
}
const all = Object.values(out).flat();
const tot = {};
for (const r of all) tot[r.class] = (tot[r.class] || 0) + 1;
console.log("  " + "ALL".padEnd(10) + CLASSES.map((c) => String(tot[c] || 0).padStart(15)).join("") +
  String(all.length).padStart(8));
console.log("");
console.log("  spend $" + usd().toFixed(4) + " over " + calls + " call(s)" +
  (stopped ? "   STOPPED at the $" + MAX_USD + " ceiling" : ""));

writeFileSync(join(ROOT, OUT), JSON.stringify({
  _what: "Which held source could ground each task. The model saw STATEMENTS ONLY -- never any " +
    "passage text -- so a verdict is an expectation about where the answer lives, not a clause match.",
  ruled_in: "PROMPT-144 s2", model: MODEL, held_sources: held,
  spend: { usd: Number(usd().toFixed(4)), calls, model: MODEL }, stopped_at_ceiling: stopped,
  counts: tot, by_cert: out,
}, null, 1) + "\n");
console.log("  wrote " + OUT);
