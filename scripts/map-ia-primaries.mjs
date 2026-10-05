#!/usr/bin/env node
/**
 * map-ia-primaries.mjs -- add ruled (task, passage) links to task_sources. WRITES with `--apply`.
 *
 * Ruled PROMPT-137 s3. The spec is a FILE, not a flag list: a mapping is a director's ruling and
 * belongs in a reviewable artifact, the way the verdict specs do.
 *
 * IT REFUSES rather than guessing, on every one of:
 *   - a clause the library does not hold (nothing can anchor there);
 *   - a (task, passage) link that already exists (a second row would double the map);
 *   - a task code that is not this certification's.
 *
 * AND IT PRINTS THE TASK'S PRIMARIES BEFORE AND AFTER, because the ISMS-IA 4.7 lesson is that a map
 * change is only arguable with if the before-state is on the record.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let APPLY = false, SPEC = null;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  const m = /^--spec=(.+)$/.exec(a);
  if (m) { SPEC = m[1]; continue; }
  console.error("unrecognised flag: " + a + ". Known: --spec=<file>, --apply (dry by default).");
  process.exit(2);
}
if (!SPEC) { console.error("--spec=<file> is required."); process.exit(2); }
const spec = JSON.parse(readFileSync(join(ROOT, SPEC), "utf8"));
for (const k of ["cert", "ruled_in", "links"]) {
  if (!spec[k]) { console.error("spec is missing " + k); process.exit(2); }
}

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const cert = (await getAll(KEY, "certifications?select=id&code=eq." + spec.cert))[0];
if (!cert) { console.error("no certification " + spec.cert); process.exit(2); }
const tasks = (await getAll(KEY, "tasks?select=id,code,certification_id&order=code"))
  .filter((t) => t.certification_id === cert.id);
const idOfTask = new Map(tasks.map((t) => [t.code, t.id]));
const passages = await getAll(KEY, "source_passages?select=id,source_id,edition,clause&order=id");
const pid = new Map(passages.map((p) => [p.source_id + "|" + p.edition + "|" + p.clause, p.id]));
const ts = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id,passage_id");
const pById = new Map(passages.map((p) => [p.id, p]));
const existing = new Set(ts.map((r) => r.task_id + "|" + r.passage_id));
const primOf = (code) => ts.filter((r) => r.task_id === idOfTask.get(code) && r.role === "primary")
  .map((r) => pById.get(r.passage_id))
  .filter(Boolean)
  .map((p) => p.source_id + ":" + p.edition + " " + p.clause).sort();

const plan = [], bad = [];
for (const L of spec.links) {
  const tid = idOfTask.get(L.task);
  if (!tid) { bad.push(L.task + ": not a " + spec.cert + " task"); continue; }
  const key = L.source_id + "|" + L.edition + "|" + L.clause;
  const p = pid.get(key);
  if (!p) { bad.push(L.task + " " + key + ": the library does not hold it"); continue; }
  if (existing.has(tid + "|" + p)) { bad.push(L.task + " " + key + ": already linked"); continue; }
  plan.push({ ...L, task_id: tid, passage_id: p });
}
for (const b of bad) console.log("  REFUSED  " + b);
if (bad.length) { console.error("REFUSING: nothing written."); process.exit(2); }

const touched = [...new Set(plan.map((x) => x.task))].sort();
console.log("MAP " + spec.cert + "   " + spec.ruled_in + "   " + plan.length + " link(s) over " +
  touched.length + " task(s)" + (APPLY ? "   --apply" : "   dry run (default)"));
console.log("");
const before = {};
for (const code of touched) { before[code] = primOf(code); }
for (const code of touched) {
  console.log("  " + code + "  PRIMARIES BEFORE (" + before[code].length + "): " +
    (before[code].join(", ") || "none"));
}
console.log("");
for (const x of plan) {
  console.log("  + " + x.task + "  " + x.source_id + ":" + x.edition + " " + x.clause +
    "  as " + x.role + "   -- " + String(x.why || "").slice(0, 80));
}
if (!APPLY) { console.log("\nDRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

let wrote = 0;
for (const x of plan) {
  const res = await fetch(REST_URL + "/task_sources", { method: "POST",
    headers: { ...H, Prefer: "return=representation" },
    /* ============ `added_by` IS NOT NULL AND CARRIES THE PROVENANCE ============
     *
     * The first run omitted it and all four inserts failed 23502 -- correctly, and nothing was
     * written. The column is every row's record of WHO ruled the link; the existing rows read
     * "judged 2026-09-29, director sample read". A map row with no provenance could not be argued
     * with later, which is why the column is NOT NULL. `added_at` has a default. */
    body: JSON.stringify({ task_id: x.task_id, passage_id: x.passage_id, role: x.role,
      added_by: spec.ruled_in + (spec.added_by ? " -- " + spec.added_by : "") }) });
  if (!res.ok) { console.error("  INSERT FAILED " + x.task + " " + x.clause + ": " + (await res.text()).slice(0, 160)); process.exitCode = 1; continue; }
  wrote++;
}
/* POST-CONDITION, BOTH DIRECTIONS: every ruled link is present, and no task outside the plan moved. */
const after = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id,passage_id");
const afterSet = new Set(after.map((r) => r.task_id + "|" + r.passage_id + "|" + r.role));
const missing = plan.filter((x) => !afterSet.has(x.task_id + "|" + x.passage_id + "|" + x.role));
const grew = after.length - ts.length;
console.log("");
console.log("  wrote " + wrote + " of " + plan.length);
console.log("  read back: ruled links present " + (plan.length - missing.length) + " of " + plan.length);
console.log("  task_sources rows " + ts.length + " -> " + after.length + "   grew by " + grew +
  (grew === plan.length ? " (exactly this batch)" : "   MISMATCH"));
const tsAfter = after;
const primAfter = (code) => tsAfter.filter((r) => r.task_id === idOfTask.get(code) && r.role === "primary")
  .map((r) => pById.get(r.passage_id)).filter(Boolean)
  .map((p) => p.source_id + ":" + p.edition + " " + p.clause).sort();
/* ============ A SUPPORTING-ONLY SPEC MUST LEAVE EVERY PRIMARY LIST UNTOUCHED ============
 *
 * Ruled PROMPT-137a s2 for task 4.11: supporting breadth is the remedy for passage poverty, and a
 * wider KEY is not. Printing both lists and leaving a human to compare them is the eyeball check
 * this repository keeps paying for, so where a spec adds no primary the equality is ASSERTED. */
const addsPrimary = new Set(plan.filter((x) => x.role === "primary").map((x) => x.task));
const primMoved = [];
for (const code of touched) {
  const after = primAfter(code);
  console.log("  " + code + "  PRIMARIES AFTER  (" + after.length + "): " + after.join(", "));
  if (addsPrimary.has(code)) continue;              /* a primary was ruled here: it SHOULD move */
  if (JSON.stringify(after) !== JSON.stringify(before[code])) {
    primMoved.push(code + ": " + before[code].join(", ") + "  ->  " + after.join(", "));
  }
}
console.log("  primaries UNCHANGED where the spec adds none: " +
  (primMoved.length ? "NO -- " + primMoved.length + " task(s) moved" : "yes, asserted"));
for (const m of primMoved) console.error("      MOVED " + m);
if (missing.length || grew !== plan.length || primMoved.length) process.exitCode = 2;
