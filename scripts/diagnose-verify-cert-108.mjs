#!/usr/bin/env node
/**
 * READ-ONLY. Which of verify-cert's four AIMS-F failures did the cutover cause?
 *
 * The pre-cutover pool is RECONSTRUCTIBLE: it is the live pool plus exactly the ids in
 * AIMSF-CUTOVER-RETIRED.json. So every statistic can be computed both ways and the question answered
 * with a measurement rather than a plausible story.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { gateItemOf } from "./lib/stored-item.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const LANGS = ["en", "es-419", "pt-BR"];
const KEY = requireKey(HERE);
const rec = JSON.parse(readFileSync(join(ROOT, "AIMSF-CUTOVER-RETIRED.json"), "utf8"));
const retired = new Set(rec.ids.map((x) => x.id));
const floors = JSON.parse(readFileSync(join(ROOT, "TASK-FLOORS-AIMSF.json"), "utf8"));

const cert = (await getAll(KEY, "certifications?select=id&code=eq.AIMS-F"))[0];
const all = await getAll(KEY, "quiz_questions?select=id,language,status,pool,is_exam_scope,retired_at," +
  "item_origin,question_group_id,question_text,options,correct_answer,task_id" +
  "&certification_id=eq." + cert.id + "&order=id");
const tasks = (await getAll(KEY, "tasks?select=id,code,certification_id&order=code"))
  .filter((t) => t.certification_id === cert.id);
const tcode = new Map(tasks.map((t) => [t.id, t.code]));

const live = (r, l) => r.language === l && r.pool === "secure" && r.status === "approved" &&
  r.retired_at === null && r.item_origin !== "generated" && r.is_exam_scope === true;
/* pre-cutover: the same predicate, but retired_at is put back to null for the recorded ids */
const pre = (r, l) => r.language === l && r.pool === "secure" && r.status === "approved" &&
  (r.retired_at === null || retired.has(r.id)) && r.item_origin !== "generated" && r.is_exam_scope === true;

/* ---- 1. the secure floor per task ---- */
console.log("1. SECURE FLOOR PER TASK   verify-cert uses a hard 8; PROMPT-104 ruled per-task overrides");
console.log("   overrides on file: " + JSON.stringify(floors.per_task_overrides || {}));
const below8 = [];
for (const t of tasks) {
  for (const l of LANGS) {
    const now = all.filter((r) => live(r, l) && r.task_id === t.id).length;
    const was = all.filter((r) => pre(r, l) && r.task_id === t.id).length;
    const ov = (floors.per_task_overrides || {})[t.code];
    const ruled = typeof ov === "number" ? ov : (typeof ov === "object" && ov ? ov.floor : 8);
    if (now < 8) below8.push({ task: t.code, l, now, was, ruled });
  }
}
for (const b of below8) {
  console.log("   " + b.task + "/" + b.l.padEnd(7) + " now " + b.now + "   pre-cutover " + b.was +
    "   ruled floor " + b.ruled + "   " + (b.now >= b.ruled ? "meets the RULED floor" : "BELOW THE RULED FLOOR") +
    (b.now < b.was ? "   <- the cutover reduced this" : "   <- unchanged by the cutover"));
}
if (!below8.length) console.log("   none below 8");

/* ---- 2. the two not-approved and two ungrouped rows ---- */
console.log("");
console.log("2. NOT APPROVED / UNGROUPED   (verify-cert counts these over the bank, not the live pool)");
const notApproved = all.filter((r) => r.pool === "secure" && r.retired_at === null && r.status !== "approved");
for (const r of notApproved) {
  console.log("   not approved  " + r.id.slice(0, 8) + "  " + r.language + "  status=" + r.status +
    "  origin=" + r.item_origin + "  group=" + (r.question_group_id ? "yes" : "NO") +
    "  task=" + tcode.get(r.task_id));
  console.log("     " + String(r.question_text).replace(/\s+/g, " ").slice(0, 95));
}
const ungrouped = all.filter((r) => r.pool === "secure" && r.retired_at === null && !r.question_group_id);
for (const r of ungrouped) {
  console.log("   ungrouped     " + r.id.slice(0, 8) + "  " + r.language + "  status=" + r.status +
    "  origin=" + r.item_origin);
}
console.log("   same rows? " + (notApproved.length === ungrouped.length &&
  notApproved.every((r) => ungrouped.some((u) => u.id === r.id)) ? "YES -- one pair, two symptoms" : "no"));
console.log("   retired by the cutover? " +
  (notApproved.some((r) => retired.has(r.id)) ? "some are" : "none -- the cutover did not touch them"));

/* ---- 3. the length cue, computed BOTH ways ---- */
console.log("");
console.log("3. LENGTH CUE   strict-longest share and mean margin, live vs pre-cutover");
const cueStats = (pred) => {
  let n = 0, longest = 0, marginSum = 0, marginPctSum = 0;
  for (const l of LANGS) {
    for (const r of all.filter((x) => pred(x, l))) {
      let gi;
      try { gi = gateItemOf(r); } catch { continue; }
      const key = gi.options.find((o) => o.is_correct);
      const ds = gi.options.filter((o) => !o.is_correct).map((o) => o.text.length);
      if (!key || !ds.length) continue;
      n++;
      const mean = ds.reduce((a, b) => a + b, 0) / ds.length;
      if (key.text.length > Math.max(...ds)) longest++;
      marginSum += key.text.length - mean;
      marginPctSum += (key.text.length - mean) / Math.max(1, key.text.length);
    }
  }
  return { n, longestPct: 100 * longest / Math.max(1, n), meanMargin: marginSum / Math.max(1, n),
    meanMarginPct: 100 * marginPctSum / Math.max(1, n) };
};
const a = cueStats(live), b = cueStats(pre);
const fmt = (s) => "n=" + String(s.n).padStart(4) + "   strict-longest " + s.longestPct.toFixed(1) +
  "%   mean margin " + s.meanMargin.toFixed(1) + "ch (" + s.meanMarginPct.toFixed(1) + "% of key)";
console.log("   live (after)   " + fmt(a));
console.log("   pre-cutover    " + fmt(b));
console.log("   -> the cutover " + (a.longestPct > b.longestPct ? "RAISED" : "lowered") +
  " strict-longest by " + Math.abs(a.longestPct - b.longestPct).toFixed(1) + "pt");

/* which half carries it */
console.log("");
const byOrigin = (origin) => cueStats((r, l) => live(r, l) && r.item_origin === origin);
for (const o of ["grounded", "authored", "translated"]) {
  const s = byOrigin(o);
  if (s.n) console.log("   live, origin=" + o.padEnd(11) + fmt(s));
}
