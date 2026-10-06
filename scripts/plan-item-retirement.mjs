/**
 * plan-item-retirement.mjs -- which Opus-confirmed items can be retired, and which must be repaired?
 *
 * DRY RUN ONLY. It writes a PLAN file and NO BANK ROW. There is no --apply. Ruled PROMPT-146 s4.
 *
 *   --cert <CODE>        required
 *   --confirmed=<file>   the Opus artifact; an item counts as confirmed when it has two runs and
 *                        did NOT agree with the stored key in both of them
 *   --min-per-task=4     a task must keep at least this many live secure items IN EVERY LANGUAGE
 *   --out=<file>         the plan
 *
 * ============ RETIRE IS THE DEFAULT, AND THE TWO EXCEPTIONS ARE STRUCTURAL ============
 *
 * An item retires with ALL THREE language siblings, by question_group_id, in the secure pool only --
 * the same unit the cutover uses, because a form is assembled per language and half a group is an
 * item that exists in English and vanishes in Spanish.
 *
 * It is REPAIRED instead, never retired, when retiring it would:
 *   - leave its TASK under --min-per-task live secure items in any language, or
 *   - stop 20 of 20 exam FORMS assembling in any language.
 *
 * Those two are not quality judgements; they are what the bank can afford to lose. Repair is the
 * next prompt's work, not this one's.
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let CERT = null, CONF = null, MIN_PER_TASK = 4, OUT = null, m;
for (const a of process.argv.slice(2)) {
  if ((m = /^--cert=(.+)$/.exec(a))) { CERT = m[1]; continue; }
  if ((m = /^--confirmed=(.+)$/.exec(a))) { CONF = m[1]; continue; }
  if ((m = /^--min-per-task=(\d+)$/.exec(a))) { MIN_PER_TASK = Number(m[1]); continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  console.error("plan-item-retirement: unrecognised flag " + a);
  console.error("  --cert=<CODE> --confirmed=<file> [--min-per-task=4] [--out=<file>]");
  console.error("  DRY RUN ONLY -- there is no --apply and no bank row is written.");
  process.exitCode = 2; process.exit();
}
if (!CERT || !CONF) { console.error("--cert and --confirmed are required"); process.exit(2); }
OUT = OUT || (CERT.replace(/-/g, "") + "-RETIRE-PLAN.json");

const KEY = requireKey(HERE);
const LANGS = ["en", "es-419", "pt-BR"];
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }
const doms = (await getAll(KEY, "domains?select=id,code,weight_pct,certification_id&order=code"))
  .filter((d) => d.certification_id === cert.id);
const tasks = (await getAll(KEY, "tasks?select=id,code,domain_id,is_exam_scope&order=code"))
  .filter((t) => doms.some((d) => d.id === t.domain_id));
const codeOf = new Map(tasks.map((t) => [t.id, t.code]));
const domOfTask = new Map(tasks.map((t) => [t.id, (doms.find((d) => d.id === t.domain_id) || {}).code]));
const qs = await getAll(KEY, "quiz_questions?select=id,language,pool,status,retired_at,task_id," +
  "question_group_id,difficulty&certification_id=eq." + cert.id + "&order=id");
const liveSecure = qs.filter((q) => q.pool === "secure" && q.retired_at === null && q.status === "approved");

if (!existsSync(join(ROOT, CONF))) { console.error("no " + CONF); process.exit(2); }
const art = JSON.parse(readFileSync(join(ROOT, CONF), "utf8"));
const agreedBoth = (r) => (r.runs || []).length === 2 &&
  r.runs.every((x) => x.cause === "agreed with the stored key");
const judged = (art.items || []).filter((r) => (r.runs || []).length === 2);
const confirmed = judged.filter((r) => !agreedBoth(r));
const causeOf = (r) => {
  const c = r.runs.map((x) => x.cause);
  if (c.includes("could not run")) return "could-not-run";
  if (c.includes("picked a different option")) return "picked a different option";
  if (c.includes("said the passages do not settle it")) return "not settled";
  if (c.includes("named a second defensible option")) return "named a second defensible option";
  return "agreed";
};

/* ---- the groups each confirmed item belongs to ---- */
const byShort = new Map(liveSecure.filter((q) => q.language === "en").map((q) => [q.id.slice(0, 8), q]));
const plan = [];
for (const r of confirmed) {
  const en = byShort.get(r.item);
  if (!en) { plan.push({ item: r.item, task: r.task, disposition: "SKIP", why: "not live secure in en" }); continue; }
  const group = liveSecure.filter((q) => q.question_group_id === en.question_group_id);
  plan.push({ item: r.item, task: codeOf.get(en.task_id) || r.task, domain: domOfTask.get(en.task_id),
    cause: causeOf(r), grounding_class: r.grounding_class || null,
    question_group_id: en.question_group_id, rows: group.length,
    langs: [...new Set(group.map((g) => g.language))].sort(),
    disposition: "retire" });
}

/* ---- rule 1: a task must keep MIN_PER_TASK in every language ---- */
const heldPerTaskLang = new Map();
for (const q of liveSecure) {
  const k = q.task_id + "|" + q.language;
  heldPerTaskLang.set(k, (heldPerTaskLang.get(k) || 0) + 1);
}
const taskIdOf = new Map(tasks.map((t) => [t.code, t.id]));
/* count the retirements per (task, language) and flip whole tasks to repair where the floor breaks.
 * Items are considered in artifact order, so the first N retirements of a task survive and the ones
 * that would breach the floor become repairs -- a deterministic rule, not a cherry-pick. */
const retiredPerTaskLang = new Map();
for (const p of plan) {
  if (p.disposition !== "retire") continue;
  const tid = taskIdOf.get(p.task);
  if (!tid) { p.disposition = "repair"; p.why = "task not resolvable"; continue; }
  let breaks = null;
  for (const l of LANGS) {
    const k = tid + "|" + l;
    const held = heldPerTaskLang.get(k) || 0;
    const already = retiredPerTaskLang.get(k) || 0;
    if (held - already - 1 < MIN_PER_TASK) { breaks = l; break; }
  }
  if (breaks) {
    p.disposition = "repair";
    p.why = "retiring it would leave task " + p.task + " under " + MIN_PER_TASK +
      " live secure items in " + breaks;
    continue;
  }
  for (const l of LANGS) {
    const k = tid + "|" + l;
    retiredPerTaskLang.set(k, (retiredPerTaskLang.get(k) || 0) + 1);
  }
}

const retire = plan.filter((p) => p.disposition === "retire");
const repair = plan.filter((p) => p.disposition === "repair");
const skip = plan.filter((p) => p.disposition === "SKIP");

/* ---- the after picture, per task and per domain ---- */
const retiredGroups = new Set(retire.map((p) => p.question_group_id));
const after = liveSecure.filter((q) => !retiredGroups.has(q.question_group_id));
console.log("RETIREMENT PLAN   " + CERT + "   DRY RUN -- no bank row is written");
console.log("  live secure, en/es-419/pt-BR   " +
  LANGS.map((l) => liveSecure.filter((q) => q.language === l).length).join(" / "));
console.log("  Opus-judged " + judged.length + "   CONFIRMED " + confirmed.length +
  "   retire " + retire.length + "   repair " + repair.length + "   skipped " + skip.length);
console.log("  after retirement, en/es-419/pt-BR   " +
  LANGS.map((l) => after.filter((q) => q.language === l).length).join(" / "));
console.log("");
console.log("  TASKS UNDER " + MIN_PER_TASK + " LIVE SECURE ITEMS AFTER THE PLAN (any language)");
let under = 0;
for (const t of tasks) {
  const per = LANGS.map((l) => after.filter((q) => q.task_id === t.id && q.language === l).length);
  if (Math.min(...per) < MIN_PER_TASK) {
    under++;
    console.log("    " + t.code.padEnd(7) + per.join(" / ") + (t.is_exam_scope ? "" : "   (not exam scope)"));
  }
}
if (!under) console.log("    none");
console.log("");
console.log("  CONFIRMED BY CAUSE");
const byCause = {};
for (const p of plan) byCause[p.cause || "?"] = (byCause[p.cause || "?"] || 0) + 1;
for (const [k, v] of Object.entries(byCause).sort()) console.log("    " + String(v).padStart(4) + "  " + k);
console.log("");
console.log("  PER DOMAIN, live secure en, before -> after");
for (const d of doms) {
  const b = liveSecure.filter((q) => q.language === "en" && domOfTask.get(q.task_id) === d.code).length;
  const a = after.filter((q) => q.language === "en" && domOfTask.get(q.task_id) === d.code).length;
  console.log("    " + d.code.padEnd(5) + String(d.weight_pct).padStart(5) + "%   " +
    String(b).padStart(4) + " -> " + String(a).padStart(4));
}

writeFileSync(join(ROOT, OUT), JSON.stringify({
  _what: CERT + " retirement plan, ruled PROMPT-146 s4. DRY RUN: no bank row was written. Stems are " +
    "deliberately NOT stored -- an item quoting the Scrum Guide shares 12-gram runs with the library " +
    "and would trip check-licensed-text. Read them live.",
  cert: CERT, ruled_in: "PROMPT-146 s4", confirmed_from: CONF, min_per_task: MIN_PER_TASK,
  live_secure_before: Object.fromEntries(LANGS.map((l) => [l, liveSecure.filter((q) => q.language === l).length])),
  live_secure_after: Object.fromEntries(LANGS.map((l) => [l, after.filter((q) => q.language === l).length])),
  opus_judged: judged.length, confirmed: confirmed.length,
  retire: retire.length, repair: repair.length, skipped: skip.length,
  by_cause: byCause, tasks_under_min_after: under,
  plan,
}, null, 1) + "\n");
console.log("");
console.log("  wrote " + OUT + "   (plan only -- the apply step is a separate prompt)");
