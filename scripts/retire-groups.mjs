#!/usr/bin/env node
/**
 * Retire named groups: `retired_at` on every live row of each group, appended to the cutover
 * rollback file so one command still restores everything. WRITES with `--apply`; dry by default.
 *
 * REFUSES unless the task stays at its RULED floor (lib/task-floors.mjs), per PROMPT-109 s2/s3.
 * A row with no group retires alone -- that is the ungrouped-reject case, not an error.
 *
 * Nothing is deleted. A rejected verdict and a cued item are both records worth keeping.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { loadTaskFloors, floorFor } from "./lib/task-floors.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let APPLY = false, CERT = "AIMS-F", REASON = null, FILE = "AIMSF-CUTOVER-RETIRED.json", IDS = [];
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  let m = a.match(/^--cert=(.+)$/);
  if (m) { CERT = m[1]; continue; }
  m = a.match(/^--reason=(.+)$/);
  if (m) { REASON = m[1]; continue; }
  m = a.match(/^--file=(.+)$/);
  if (m) { FILE = m[1]; continue; }
  m = a.match(/^--ids=(.+)$/);
  if (m) { IDS = m[1].split(",").map((s) => s.trim()).filter(Boolean); continue; }
  console.error("Unrecognised flag: " + a +
    ". Known: --cert=<CODE>, --ids=<uuid8>,..., --reason=<text>, --file=<rollback.json>, --apply.");
  process.exit(2);
}
if (!IDS.length) { console.error("--ids is required."); process.exit(2); }
if (!REASON) { console.error("--reason is required: a retirement with no recorded reason is unreadable later."); process.exit(2); }

const LANGS = ["en", "es-419", "pt-BR"];
const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("No certification " + CERT); process.exit(2); }
const SEL = "id,language,status,pool,visibility,is_exam_scope,retired_at,question_group_id,task_id," +
  "question_text,options,correct_answer,item_origin";
const fetchAll = () => getAll(KEY, "quiz_questions?select=" + SEL + "&certification_id=eq." + cert.id + "&order=id");
let all = await fetchAll();
const tasks = (await getAll(KEY, "tasks?select=id,code,certification_id&order=code"))
  .filter((t) => t.certification_id === cert.id);
const tcode = new Map(tasks.map((t) => [t.id, t.code]));
const floors = loadTaskFloors(cert.code);
if (floors.errors.length) { console.error("REFUSING: floors file has errors: " + floors.errors.join("; ")); process.exit(2); }

console.log("RETIRE " + IDS.length + " GROUP(S)   " + CERT + (APPLY ? "   --apply" : "   dry run (default)"));
console.log("  reason: " + REASON);
console.log("  floors: " + floors.source + "   default " + floors.defaultFloor);

const targets = [];
let unsafe = 0;
for (const p of IDS) {
  const en = all.find((r) => String(r.id).startsWith(p) && r.language === "en");
  if (!en) { console.error("  " + p + "  NO ENGLISH ROW -- skipped"); unsafe++; continue; }
  const group = en.question_group_id
    ? all.filter((r) => r.question_group_id === en.question_group_id && r.retired_at === null)
    : [en].filter((r) => r.retired_at === null);
  const code = tcode.get(en.task_id);
  const f = floorFor(code, floors);
  const breaks = [];
  for (const l of LANGS) {
    const now = all.filter((r) => r.pool === "secure" && r.language === l && r.task_id === en.task_id &&
      r.retired_at === null).length;
    const losing = group.filter((r) => r.language === l && r.pool === "secure").length;
    if (now - losing < f.floor) breaks.push(l + " " + now + "->" + (now - losing) + " < " + f.floor);
  }
  console.log("  " + p + "   task " + code + "   floor " + f.floor + " (" + f.why + ")   " +
    group.length + " live row(s)" + (en.question_group_id ? "" : "   UNGROUPED, retires alone") +
    (breaks.length ? "   REFUSED: " + breaks.join("; ") : "   ok"));
  if (breaks.length) { unsafe++; continue; }
  for (const r of group) targets.push({ r, why: REASON, group: p });
}
if (unsafe) {
  console.error("");
  console.error("REFUSING: " + unsafe + " group(s) cannot be retired without breaking a ruled floor or");
  console.error("resolving to a row. Nothing written. Revise those in place instead.");
  process.exit(1);
}

const ids = new Set(targets.map((t) => t.r.id));
const canon = (rows) => createHash("sha256").update(rows.filter((r) => !ids.has(r.id))
  .map((r) => JSON.stringify([r.id, r.status, r.pool, r.visibility, r.is_exam_scope, r.retired_at,
    r.item_origin, r.question_text, r.options, r.correct_answer]))
  .sort().join(String.fromCharCode(10))).digest("hex");
const before = canon(all);
console.log("");
console.log("  rows to retire " + targets.length);
console.log("  checksum over the " + (all.length - ids.size) + " row(s) this batch may NOT touch: " + before.slice(0, 16));
if (!APPLY) { console.log("\nDRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

const STAMP = new Date().toISOString();
let wrote = 0;
for (const t of targets) {
  const r = await fetch(REST_URL + "/quiz_questions?id=eq." + t.r.id, { method: "PATCH", headers: H,
    body: JSON.stringify({ retired_at: STAMP, status: t.r.status, visibility: t.r.visibility,
      is_exam_scope: t.r.is_exam_scope }) });
  if (!r.ok) { console.error("  PATCH FAILED " + t.r.id.slice(0, 8) + "  " + (await r.text()).slice(0, 140)); continue; }
  wrote++;
}

/* APPEND to the rollback file, so one command still restores the cutover AND these */
const path = join(ROOT, FILE);
const rec = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : { cert: CERT, ids: [] };
rec.appended = rec.appended || [];
rec.appended.push({ at: STAMP, reason: REASON, ruled_in: "PROMPT-109", count: targets.length });
for (const t of targets) rec.ids.push({ id: t.r.id, language: t.r.language, why: REASON, group: t.group });
rec.count = rec.ids.length;
writeFileSync(path, JSON.stringify(rec, null, 2) + "\n");

all = await fetchAll();
const after = canon(all);
let bad = 0;
for (const t of targets) {
  const now = all.find((r) => r.id === t.r.id);
  if (!now || now.retired_at === null || now.status !== t.r.status || now.visibility !== t.r.visibility ||
    now.is_exam_scope !== t.r.is_exam_scope) { console.error("  POST: " + t.r.id.slice(0, 8)); bad++; }
}
console.log("");
console.log("  retired " + wrote + " of " + targets.length + "   read-back failures " + bad);
console.log("  untouched-row checksum " + (before === after ? "UNCHANGED " + after.slice(0, 16) : "CHANGED"));
console.log("  rollback file now names " + rec.count + " id(s): " + FILE);
if (bad || before !== after || wrote !== targets.length) process.exitCode = 2;
