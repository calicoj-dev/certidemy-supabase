/**
 * retire-confirmed-items.mjs -- retire the items a plan marks `retire`, with the cutover's own gate.
 *
 * WRITES with `--apply`; dry by default. Unknown flags exit 2. Ruled PROMPT-147 s1.
 * NO MODEL CALL IS MADE, for any purpose.
 *
 *   --cert <CODE>      required
 *   --plan=<file>      the plan from plan-item-retirement.mjs
 *   --forms=20         forms per language the gate must assemble
 *   --apply            write. Dry by default.
 *
 * ============ THREE THINGS HAPPEN BEFORE A ROW IS TOUCHED ============
 *
 *  1. THE FORM GATE, via lib/form-assembler.mjs -- the SAME selector the cutover uses, enemy rule
 *     and stem dedupe and difficulty mix included. If 20 of 20 forms do not assemble in every
 *     language against the POST-retirement pool, nothing is written.
 *  2. THE PUBLIC RE-CHECK, read at WRITE TIME and not carried over from an earlier prompt. No
 *     planned group may have visibility='public' on any sibling. A row that is both public and
 *     secure should not exist; this asserts it rather than assuming it.
 *  3. THE ROLLBACK FILE goes down BEFORE the first write, in the cutover's shape, so an interrupted
 *     run is still undoable.
 *
 * Retirement is by question_group_id across all three languages, secure pool only -- a form is
 * assembled per language, and half a group is an item that exists in English and vanishes in Spanish.
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { assembleForm, formAssemblerControls } from "./lib/form-assembler.mjs";
import { enemyKeyOf, enemyRuleControls } from "../functions/_shared/item-rules/enemy-rule.mjs";
import { stemIdentity, stemIdentityControls } from "../functions/_shared/item-rules/stem-identity.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const LANGS = ["en", "es-419", "pt-BR"];
let CERT = null, PLAN = null, FORMS = 20, APPLY = false, RULED = null, m;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  if ((m = /^--cert=(.+)$/.exec(a))) { CERT = m[1]; continue; }
  if ((m = /^--plan=(.+)$/.exec(a))) { PLAN = m[1]; continue; }
  if ((m = /^--forms=(\d+)$/.exec(a))) { FORMS = Number(m[1]); continue; }
  /* --ruled-in stamps the reason on every row. It was hardcoded to "PROMPT-147" and stamped that
   * onto 261 rows retired under PROMPT-148: a reason naming the wrong ruling is a wrong record. */
  if ((m = /^--ruled-in=(.+)$/.exec(a))) { RULED = m[1]; continue; }
  console.error("retire-confirmed-items: unrecognised flag " + a);
  console.error("This script opts into WRITING: --apply (dry by default). CLAUDE.md s15.");
  console.error("  --cert=<CODE> --plan=<file> --ruled-in=<PROMPT> [--forms=20] [--apply]");
  process.exitCode = 2; process.exit();
}
if (!CERT || !PLAN) { console.error("--cert and --plan are required"); process.exit(2); }
if (!RULED) { console.error("--ruled-in is required: a retirement nobody ruled is an error."); process.exit(2); }

/* ============ CONTROLS FIRST, AND A ZERO DENOMINATOR IS A REFUSAL ============
 *
 * These three suites return THREE DIFFERENT SHAPES: a bare array of {what, pass}, a
 * {cases, examined, allPass} object, and a {examined, fails} object. The first version of this read
 * only the latter two, so `enemyRuleControls` -- which returns the array -- reported "0 control(s),
 * all pass": a vacuous pass over nothing, printed as though the suite had run. A check passing over
 * an empty input is the defect docs/CLAUDE-METHOD.md opens with, so the denominator is asserted. */
const normaliseControls = (c) => {
  /* an array of CASE OBJECTS: the denominator is its length.
   * `c.length > 0` IS LOAD-BEARING: [].every(...) is vacuously TRUE, so an empty array -- which is
   * what a failures-only suite returns when everything passes -- fell into this branch and read as
   * 0 examined, and the guard below then refused a healthy suite. */
  if (Array.isArray(c) && c.length > 0 && c.every((x) => x && typeof x === "object" && "pass" in x)) {
    return { examined: c.length, fails: c.filter((x) => !x.pass).map((x) => x.what || x.name || "?") };
  }
  /* an array of FAILURE STRINGS: empty means pass, and the denominator is NOT recoverable from the
   * return. stem-identity is deliberately this shape and says so in its own comment; CLAUDE.md s15
   * records eight suites like it. It is reported as unstated, never invented. */
  if (Array.isArray(c)) return { examined: null, fails: c.map(String) };
  if (c && Array.isArray(c.cases)) {
    return { examined: c.cases.length, fails: c.cases.filter((x) => !x.pass).map((x) => x.name || x.what || "?") };
  }
  if (c && Number.isFinite(c.examined)) return { examined: c.examined, fails: c.fails || [] };
  return { examined: 0, fails: [] };
};
for (const [name, fn] of [["form-assembler", formAssemblerControls],
  ["enemy-rule", enemyRuleControls], ["stem-identity", stemIdentityControls]]) {
  const { examined, fails } = normaliseControls(fn({ quiet: true }));
  if (examined === 0) {
    console.error("REFUSING: " + name + " controls examined NOTHING, so their pass claims nothing.");
    process.exit(2);
  }
  if (fails.length) {
    console.error("REFUSING: " + name + " controls fail: " + fails.slice(0, 3).join("; "));
    process.exit(2);
  }
  console.log("  " + name.padEnd(16) +
    (examined === null ? "reports failure NAMES only, 0 reported (denominator not stated by the suite)"
      : examined + " control(s) examined, all pass"));
}

const KEY = requireKey(HERE);
const cert = (await getAll(KEY, "certifications?select=id,code,num_questions,exam_blueprint&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }
const TARGETN = cert.num_questions ?? 40;
const MIX = (cert.exam_blueprint && cert.exam_blueprint.difficulty_mix) || null;
const domains = (await getAll(KEY, "domains?select=id,code,weight_pct,certification_id&order=code"))
  .filter((d) => d.certification_id === cert.id);
/* `is_exam_scope` IS SELECTED. Gate 0 tests it, and without it every `t.is_exam_scope` was
 * undefined, so the below-4 arm reported 0 over nothing and the lowest-task line printed
 * "null at Infinity" -- the tell that caught it. Sixth instance in this repository of a predicate
 * that cannot see the column it tests, so it is named at the select rather than trusted. */
const tasks = (await getAll(KEY, "tasks?select=id,code,domain_id,certification_id,is_exam_scope&order=code"))
  .filter((t) => domains.some((d) => d.id === t.domain_id));
const domainByTask = new Map(tasks.map((t) => [t.id, t.domain_id]));
const codeOfTask = new Map(tasks.map((t) => [t.id, t.code]));
const SEL = "id,language,pool,status,visibility,is_exam_scope,retired_at,task_id," +
  "question_group_id,question_text,options,correct_answer,difficulty";
const all = await getAll(KEY, "quiz_questions?select=" + SEL + "&certification_id=eq." + cert.id + "&order=id");
const ig = new Map((await getAll(KEY, "item_grounding?select=question_id,source_id,key_support_clause&order=question_id"))
  .map((g) => [g.question_id, g]));

const inLivePool = (r, l) => r.language === l && r.pool === "secure" &&
  r.retired_at === null && r.status === "approved";
const enRowOf = (r) => r.language === "en" ? r
  : all.find((x) => x.question_group_id === r.question_group_id && x.language === "en");
const enStemByGroup = new Map();
for (const r of all) if (r.language === "en") enStemByGroup.set(r.question_group_id, r.question_text);

/* ---- the plan ---- */
if (!existsSync(join(ROOT, PLAN))) { console.error("no " + PLAN); process.exit(2); }
const plan = JSON.parse(readFileSync(join(ROOT, PLAN), "utf8"));
const retirePlan = (plan.plan || []).filter((p) => p.disposition === "retire");
const repairPlan = (plan.plan || []).filter((p) => p.disposition === "repair");
const retireGroups = new Set(retirePlan.map((p) => p.question_group_id));
const causeOfGroup = new Map(retirePlan.map((p) => [p.question_group_id, p.cause || "unstated"]));
console.log("");
console.log("RETIRE CONFIRMED ITEMS   " + CERT + (APPLY ? "   --apply" : "   dry run (default)"));
console.log("  plan " + PLAN + "   retire " + retirePlan.length + " group(s)   repair " +
  repairPlan.length + " (left live)");

/* the rows the retirement would touch: secure pool only, all three languages */
const targetRows = all.filter((r) => retireGroups.has(r.question_group_id) && r.pool === "secure" &&
  r.retired_at === null);
console.log("  rows it would touch: " + targetRows.length + "   (" +
  LANGS.map((l) => l + " " + targetRows.filter((r) => r.language === l).length).join(", ") + ")");

/* ---- GATE 0: NO TASK LOSES ITS LAST ITEM, and none drops below MIN_PER_TASK (PROMPT-148 s2) ----
 *
 * The planner already routes a breach to `repair`, so this should never fire. It is here because
 * "the planner should have handled it" is an assumption, and this is the gate that turns it into a
 * checked fact immediately before the write. */
const MIN_PER_TASK = 4;
console.log("");
console.log("0. PER-TASK FLOOR, before and after, per language   (minimum " + MIN_PER_TASK + ")");
const heldBefore = (tid, l) => all.filter((r) => r.task_id === tid && inLivePool(r, l)).length;
const heldAfter = (tid, l) => all.filter((r) => r.task_id === tid && inLivePool(r, l) &&
  !retireGroups.has(r.question_group_id)).length;
const toZero = [], belowMin = [];
let lowest = { code: null, n: Infinity };
for (const t of tasks) {
  for (const l of LANGS) {
    const b = heldBefore(t.id, l), a = heldAfter(t.id, l);
    if (b >= 1 && a === 0) toZero.push(t.code + "/" + l + ": " + b + " -> 0");
    if (t.is_exam_scope && a < MIN_PER_TASK) belowMin.push(t.code + "/" + l + ": " + b + " -> " + a);
    if (t.is_exam_scope && a < lowest.n) lowest = { code: t.code, n: a };
  }
}
console.log("   tasks losing their LAST live secure item: " + toZero.length +
  (toZero.length ? "   " + toZero.join(", ") : "   (none)"));
console.log("   exam-scope (task, language) pairs below " + MIN_PER_TASK + " after: " + belowMin.length +
  (belowMin.length ? "   " + belowMin.slice(0, 12).join(", ") : "   (none)"));
console.log("   lowest exam-scope task after the plan: " + lowest.code + " at " + lowest.n);
if (toZero.length || belowMin.length) {
  console.error("");
  console.error("REFUSING: the plan would take " + (toZero.length ? "a task to zero" : "an exam-scope task below " + MIN_PER_TASK) +
    ". The planner should have routed it to `repair`. NOTHING WRITTEN.");
  process.exit(2);
}

/* ---- GATE 1: the public re-check, read now ---- */
const pubViolations = all.filter((r) => retireGroups.has(r.question_group_id) && r.visibility === "public");
const pubSecureAnywhere = all.filter((r) => r.visibility === "public" && r.pool === "secure");
console.log("");
console.log("1. PUBLIC RE-CHECK, read at write time");
console.log("   planned groups with a public sibling: " + pubViolations.length);
console.log("   rows anywhere in this certification that are BOTH public and secure: " + pubSecureAnywhere.length);
if (pubViolations.length) {
  console.error("   REFUSING: a planned group is a public sample.");
  for (const r of pubViolations.slice(0, 10)) console.error("     " + r.id + " " + r.language);
  process.exit(2);
}

/* ---- GATE 2: the form assembler, against the POST-retirement pool ---- */
const candidatesFor = (l) => all.filter((r) => inLivePool(r, l) && !retireGroups.has(r.question_group_id))
  .map((q) => ({
    id: q.id, options: q.options, difficulty: q.difficulty, task_id: q.task_id,
    domain_id: q.task_id ? domainByTask.get(q.task_id) ?? null : null,
    dedupe_key: stemIdentity(q, enStemByGroup),
    enemy_key: (() => { const en = enRowOf(q); const g = en ? ig.get(en.id) : null; return g ? enemyKeyOf(g) : null; })(),
  }));
console.log("");
console.log("2. PRE-WRITE GATE   " + FORMS + " forms per language, target_count=" + TARGETN +
  ", difficulty_mix=" + (MIX ? JSON.stringify(MIX) : "legacy 30/50/20"));
let gateFail = 0;
for (const l of LANGS) {
  const cands = candidatesFor(l);
  let filled = 0, minSel = Infinity;
  const shortByDomain = new Map();
  for (let f = 0; f < FORMS; f++) {
    const { selected, shortfalls } = assembleForm({ candidates: cands, domains, targetN: TARGETN, mix: MIX });
    if (selected.length >= TARGETN) filled++;
    minSel = Math.min(minSel, selected.length);
    for (const s of shortfalls) shortByDomain.set(s.code, (shortByDomain.get(s.code) || 0) + 1);
  }
  const ok = filled === FORMS;
  if (!ok) gateFail++;
  console.log("   " + l.padEnd(8) + "candidates " + String(cands.length).padStart(4) +
    "   forms filled " + filled + "/" + FORMS + "   smallest form " + minSel + "   " +
    (ok ? "ok" : "*** SHORT: " + [...shortByDomain.entries()].map(([c, n]) => c + " x" + n).join(", ")));
}
if (gateFail) {
  console.error("");
  console.error("REFUSING: the post-retirement pool does not assemble " + FORMS +
    " of " + FORMS + " forms in " + gateFail + " language(s). NOTHING WRITTEN.");
  process.exit(2);
}

if (!APPLY) {
  console.log("");
  console.log("DRY RUN. Both gates pass and nothing was written. Re-run with --apply.");
  process.exitCode = 0;
} else {
  /* ---- the rollback file goes down BEFORE the first write ---- */
  const RB = join(ROOT, CERT.replace(/-/g, "") + "-RETIRE-RETIRED.json");
  if (existsSync(RB)) {
    console.error("REFUSING: " + RB.split(/[\\/]/).pop() + " already exists; a second run would");
    console.error("overwrite the rollback list for the first. Move it aside deliberately.");
    process.exit(2);
  }
  const STAMP = new Date().toISOString();
  writeFileSync(RB, JSON.stringify({
    cert: CERT, ruled_in: "PROMPT-147 s1", retired_at: STAMP,
    rollback: "node --dns-result-order=ipv4first scripts/rollback-cutover.mjs --file=" +
      RB.split(/[\\/]/).pop() + " --apply",
    count: targetRows.length,
    ids: targetRows.map((r) => ({ id: r.id, language: r.language,
      why: RULED + ": Opus-confirmed " + (causeOfGroup.get(r.question_group_id) || "unstated") +
        " (PROMPT-146)" })),
  }, null, 1) + "\n");
  console.log("");
  console.log("3. wrote " + RB.split(/[\\/]/).pop() + " (" + targetRows.length + " id(s)) BEFORE the write");

  /* ============ THE WRITE IS THE CUTOVER'S, NOT retire_item's (measured PROMPT-147) ============
   *
   * `retire_item` (migration 089) sets `status = 'retired'`, and `quiz_questions_status_check`
   * allows only pending_review | approved | rejected. So THE FUNCTION CANNOT RUN ON ANY ROW: all
   * 195 calls failed 23514 and nothing was written. The constraint was tightened after 089 and the
   * function was never updated, which is why `cutover-aimsf.mjs` PATCHes `retired_at` directly and
   * deliberately passes `status` back unchanged.
   *
   * So this takes the cutover's path and adds `retire_reason`, which is a plain column and the place
   * the examination record wants the reason. Status is left exactly as it was. */
  const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
  let wrote = 0, failed = 0;
  for (const r of targetRows) {
    const reason = RULED + ": Opus-confirmed " +
      (causeOfGroup.get(r.question_group_id) || "unstated") + " (PROMPT-146)";
    const res = await fetch(REST_URL + "/quiz_questions?id=eq." + r.id, {
      method: "PATCH", headers: H,
      body: JSON.stringify({ retired_at: STAMP, retire_reason: reason,
        status: r.status, visibility: r.visibility, is_exam_scope: r.is_exam_scope }),
    });
    if (!res.ok) {
      console.error("   PATCH FAILED " + String(r.id).slice(0, 8) + "  " +
        (await res.text()).slice(0, 200));
      failed++; continue;
    }
    wrote++;
  }
  console.log("   retired " + wrote + " of " + targetRows.length + (failed ? "   FAILED " + failed : ""));
  if (failed) process.exitCode = 2;

  /* ---- read back, independently ---- */
  const after = await getAll(KEY, "quiz_questions?select=id,language,pool,status,visibility," +
    "retired_at,retire_reason,question_group_id,task_id&certification_id=eq." + cert.id + "&order=id");
  const stillLive = after.filter((r) => retireGroups.has(r.question_group_id) && r.pool === "secure" &&
    r.retired_at === null);
  const withReason = after.filter((r) => retireGroups.has(r.question_group_id) &&
    r.retired_at !== null && /^PROMPT-147: Opus-confirmed /.test(String(r.retire_reason || "")));
  console.log("");
  console.log("4. READ BACK");
  console.log("   planned rows still live: " + stillLive.length + " (must be 0)");
  console.log("   rows carrying the PROMPT-147 reason: " + withReason.length + " of " + targetRows.length);
  for (const l of LANGS) {
    console.log("   live secure, " + l.padEnd(8) +
      after.filter((r) => r.language === l && r.pool === "secure" && r.retired_at === null &&
        r.status === "approved").length);
  }
  const repairGroups = new Set(repairPlan.map((p) => p.question_group_id));
  const repairLive = after.filter((r) => repairGroups.has(r.question_group_id) && r.pool === "secure" &&
    r.retired_at === null);
  console.log("   the " + repairPlan.length + " REPAIR groups, rows still live: " + repairLive.length +
    " (expected " + repairPlan.length * 3 + ")");
  const pubAfter = after.filter((r) => r.visibility === "public" && r.retired_at === null);
  console.log("   public rows still live in this certification: " + pubAfter.length);
  if (stillLive.length || withReason.length !== targetRows.length) process.exitCode = 2;
}
