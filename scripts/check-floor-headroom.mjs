#!/usr/bin/env node
/**
 * READ-ONLY. For named uuid prefixes: would retiring each one's GROUP leave its task at floor?
 * Reads the ruled floors via lib/task-floors.mjs. No --apply exists.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { loadTaskFloors, floorFor } from "./lib/task-floors.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
let CERT = "AIMS-F";
const WANT = [];
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--cert=(.+)$/);
  if (m) { CERT = m[1]; continue; }
  if (a.startsWith("--")) { console.error("Unrecognised flag: " + a); process.exit(2); }
  WANT.push(a);
}
const LANGS = ["en", "es-419", "pt-BR"];
const KEY = requireKey(HERE);
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
const all = await getAll(KEY, "quiz_questions?select=id,language,status,pool,is_exam_scope,retired_at," +
  "question_group_id,task_id&certification_id=eq." + cert.id + "&order=id");
const tasks = (await getAll(KEY, "tasks?select=id,code,is_exam_scope,certification_id&order=code"))
  .filter((t) => t.certification_id === cert.id);
const tcode = new Map(tasks.map((t) => [t.id, t.code]));
const floors = loadTaskFloors(cert.code);
console.log("floors: " + floors.source + "   default " + floors.defaultFloor +
  "   " + floors.overrides.size + " override(s)" + (floors.errors.length ? "   ERRORS " + floors.errors.length : ""));

/* the pool verify-cert counts: pool='secure', any status, not retired */
const counted = (r, l, taskId) => r.pool === "secure" && r.language === l && r.task_id === taskId &&
  r.retired_at === null;

for (const p of WANT) {
  const en = all.find((r) => String(r.id).startsWith(p) && r.language === "en");
  if (!en) { console.log("\n" + p + "  NO ENGLISH ROW"); continue; }
  const group = all.filter((r) => r.question_group_id && r.question_group_id === en.question_group_id);
  const code = tcode.get(en.task_id);
  const f = floorFor(code, floors);
  console.log("\n" + p + "   task " + code + "   floor " + f.floor + " (" + f.why + ")   group of " + group.length);
  let safe = true;
  for (const l of LANGS) {
    const now = all.filter((r) => counted(r, l, en.task_id)).length;
    const after = now - group.filter((r) => r.language === l && r.pool === "secure" && r.retired_at === null).length;
    const ok = after >= f.floor;
    if (!ok) safe = false;
    console.log("   " + l.padEnd(7) + " now " + now + " -> after retiring " + after +
      "   " + (ok ? "holds" : "BREAKS THE FLOOR"));
  }
  console.log("   => " + (safe ? "RETIRING IS SAFE" : "RETIRING WOULD BREAK A FLOOR -- revise in place instead"));
}
