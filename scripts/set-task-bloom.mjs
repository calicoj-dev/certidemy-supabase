#!/usr/bin/env node
/**
 * Set a task's DECLARED cognitive level. WRITES with `--apply`; dry by default. Unknown flags exit 2.
 *
 * A declared level is a SCHEME CLAIM about what the exam measures, so it is never changed as a side
 * effect of clearing a checker: it takes a ruling, and the ruling is recorded on the write.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
let APPLY = false, CERT = null, TASK = null, LEVEL = null, RULED = null;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--apply") { APPLY = true; continue; }
  let m = a.match(/^--cert(?:=(.+))?$/);
  if (m) { CERT = m[1] || argv[++i]; continue; }
  m = a.match(/^--task=(.+)$/);
  if (m) { TASK = m[1]; continue; }
  m = a.match(/^--level=(.+)$/);
  if (m) { LEVEL = m[1]; continue; }
  m = a.match(/^--ruled-in=(.+)$/);
  if (m) { RULED = m[1]; continue; }
  console.error("Unrecognised flag: " + a +
    ". Known: --cert, --task=, --level=, --ruled-in=, --apply.");
  process.exit(2);
}
if (!CERT || !TASK || !LEVEL || !RULED) {
  console.error("--cert, --task=, --level= and --ruled-in= are all required.");
  process.exit(2);
}

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("No certification " + CERT); process.exit(2); }
const tasks = (await getAll(KEY, "tasks?select=id,code,statement,bloom_level,is_exam_scope,certification_id&order=code"))
  .filter((t) => t.certification_id === cert.id);
const t = tasks.find((x) => x.code === TASK);
if (!t) { console.error("No task " + TASK + " in " + CERT); process.exit(2); }

/* the LEVELS ALREADY IN USE are the allowed set: there is no CHECK on this column, so an invented
 * value would land silently and every level comparison downstream would read it. */
const inUse = [...new Set(tasks.map((x) => x.bloom_level).filter(Boolean))].sort();
console.log("SET DECLARED LEVEL   " + CERT + " task " + TASK + (APPLY ? "   --apply" : "   dry run (default)"));
console.log("  statement: " + String(t.statement).replace(/\s+/g, " "));
console.log("  bloom_level " + JSON.stringify(t.bloom_level) + " -> " + JSON.stringify(LEVEL));
console.log("  levels in use on this certification: " + inUse.join(", "));
if (!inUse.includes(LEVEL)) {
  console.error("");
  console.error("REFUSING: " + JSON.stringify(LEVEL) + " is not a level this certification already uses.");
  console.error("There is no CHECK on this column, so a typo would land and be read as a real level.");
  process.exit(2);
}
console.log("  ruled_in " + RULED);
if (!APPLY) { console.log("\nDRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

const r = await fetch(REST_URL + "/tasks?id=eq." + t.id, { method: "PATCH", headers: H,
  body: JSON.stringify({ bloom_level: LEVEL, is_exam_scope: t.is_exam_scope }) });
if (!r.ok) { console.error("PATCH FAILED: " + (await r.text()).slice(0, 200)); process.exit(2); }

const after = (await getAll(KEY, "tasks?select=id,code,bloom_level,statement,is_exam_scope&id=eq." + t.id))[0];
console.log("");
console.log("  read back: bloom_level " + JSON.stringify(after.bloom_level) +
  "   is_exam_scope " + after.is_exam_scope);
console.log("  statement unchanged: " + (after.statement === t.statement));
if (after.bloom_level !== LEVEL || after.statement !== t.statement) process.exitCode = 2;
