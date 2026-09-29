#!/usr/bin/env node
/**
 * pick-generation-task.mjs -- the per-task shortfall beside the size of each task's PRIMARY map, and the
 * one task to generate: largest shortfall with at least 4 primary passages.
 *
 * READ-ONLY, no flags, no writes beyond a local artifact, no model calls.
 *
 * WHY THE PRIMARY COUNT IS THE GATE ON WHICH TASK TO GENERATE. `anchor-is-primary` requires a key to rest
 * on a primary passage, so a task with one or two primaries cannot support eight distinct anchorable
 * items -- generation there would produce items the gates refuse for a reason that is a fact about the
 * map. That is what happened to 4.7 and 5.6 in the first audit, and it is why the ruling puts a floor on
 * the primary count rather than simply taking the largest shortfall.
 *
 * TIES ARE BROKEN EXPLICITLY, not by whatever order the rows arrive in: largest shortfall, then the
 * larger primary map, then the task code. A tie broken by iteration order is irreproducible.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MIN_PRIMARY = 4;
const surv = JSON.parse(readFileSync(join(ROOT, "AIMSF-SURVIVORS.json"), "utf8"));

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F");
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code,statement&order=code"))
  .filter((t) => t.certification_id === certs[0].id);
const byId = new Map(tasks.map((t) => [t.id, t]));
const ts = (await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id,passage_id"))
  .filter((r) => byId.has(r.task_id));
const prim = new Map(), supp = new Map();
for (const t of tasks) { prim.set(t.code, 0); supp.set(t.code, 0); }
for (const r of ts) {
  const c = byId.get(r.task_id).code;
  if (r.role === "primary") prim.set(c, prim.get(c) + 1); else supp.set(c, supp.get(c) + 1);
}

const rows = Object.entries(surv.per_task).map(([code, v]) => ({
  code, ...v, primary: prim.get(code) || 0, supporting: supp.get(code) || 0,
}));
rows.sort((a, b) => String(a.code).localeCompare(String(b.code), undefined, { numeric: true }));

console.log("task   live keep drop prov unex  gen   primary supporting   eligible");
for (const r of rows) {
  const ok = r.primary >= MIN_PRIMARY;
  console.log("  " + r.code.padEnd(5) + String(r.total).padStart(4) + String(r.keep).padStart(5) +
    String(r.drop).padStart(5) + String(r.provisional).padStart(5) + String(r.unexamined).padStart(5) +
    String(r.generate).padStart(5) + "   " + String(r.primary).padStart(7) +
    String(r.supporting).padStart(11) + "   " + (ok ? "yes" : "NO (needs " + MIN_PRIMARY + ")"));
}
const total = rows.reduce((s, r) => s + r.generate, 0);
console.log("\nTOTAL to generate: " + total + "   (survivors " +
  rows.reduce((s, r) => s + r.keep, 0) + " of " + rows.reduce((s, r) => s + r.total, 0) + ")");

const eligible = rows.filter((r) => r.primary >= MIN_PRIMARY && r.generate > 0);
if (!eligible.length) {
  console.error("\nNo task has a shortfall AND at least " + MIN_PRIMARY + " primary passages.");
  process.exit(2);
}
/* ties broken explicitly: shortfall, then primary map size, then code */
eligible.sort((a, b) => b.generate - a.generate || b.primary - a.primary ||
  String(a.code).localeCompare(String(b.code), undefined, { numeric: true }));
const pick = eligible[0];
const tied = eligible.filter((r) => r.generate === pick.generate);
console.log("\neligible tasks (shortfall > 0 and primary >= " + MIN_PRIMARY + "): " + eligible.length);
console.log("largest shortfall among them: " + pick.generate + "  (" + tied.length + " task(s) tied there: " +
  tied.map((r) => r.code + "/p" + r.primary).join(", ") + ")");
console.log("\nPICK: task " + pick.code + "   shortfall " + pick.generate + "   primary " + pick.primary +
  "   supporting " + pick.supporting);
console.log("  " + String((tasks.find((t) => t.code === pick.code) || {}).statement || "").replace(/\s+/g, " "));
/* the tasks with a bigger shortfall that are excluded, named so the exclusion is auditable */
const excluded = rows.filter((r) => r.generate > pick.generate && r.primary < MIN_PRIMARY);
if (excluded.length) {
  console.log("\nEXCLUDED despite a larger shortfall, for too few primary passages:");
  for (const r of excluded) {
    console.log("  " + r.code + "  shortfall " + r.generate + "  primary " + r.primary +
      "  supporting " + r.supporting);
  }
}
writeFileSync(join(ROOT, "AIMSF-GENERATION-PICK.json"), JSON.stringify({
  min_primary: MIN_PRIMARY, total_to_generate: total,
  pick: { task: pick.code, shortfall: pick.generate, primary: pick.primary, supporting: pick.supporting,
    statement: (tasks.find((t) => t.code === pick.code) || {}).statement },
  tied_at_that_shortfall: tied.map((r) => ({ task: r.code, primary: r.primary })),
  excluded_for_too_few_primaries: excluded.map((r) => ({ task: r.code, shortfall: r.generate,
    primary: r.primary })),
  per_task: rows,
}, null, 1) + String.fromCharCode(10), "utf8");
console.log("\nwrote AIMSF-GENERATION-PICK.json");
