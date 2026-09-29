#!/usr/bin/env node
/**
 * link-52-to-task-16.mjs -- link ISO/IEC 42001 clause 5.2 to AIMS-F task 1.6 as PRIMARY.
 *
 * `--apply` to write, DRY BY DEFAULT, unknown flags exit 2.
 *
 * ============ WHY THIS EXISTS, AND IT IS AN IMPLIED CONSEQUENCE OF A RULING ============
 *
 * The ruling is "cc3d3b2a: keep, re-anchor to 42001 5.2". Re-anchoring alone does not achieve it: the
 * gates resolve a clause against THE TASK'S OWN LINKED PASSAGES, so an unlinked clause comes back
 * "5.2 is not in the library" -- which is true of task 1.6's map and false of the library. Measured:
 * the re-gate refused cc3d3b2a on `verbatim: clause 5.2 is not in the library` after the re-anchor.
 *
 * So the ruling cannot be honoured without this link, and the link is a WRITE the ruling did not name
 * explicitly. It is made, tagged distinctly, and reported -- rather than silently, and rather than
 * stopping on a technicality when the intent is unambiguous.
 *
 * ============ AND IT IS COHERENT, CHECKED RATHER THAN ASSUMED ============
 *
 *   task 1.6   "Distinguish an AIMS from model-level assurance and from AI ethics frameworks"
 *   cc3d3b2a   key: "It is a required management system policy element; the standard is not itself an
 *              ethics framework."
 *   42001 5.2  "Top management shall establish an AI policy that: ..."   [shall]
 *
 * 5.2 is the requirement the key asserts, and it is ALREADY primary on AIMS-F 1.5, 2.3 and 3.3 -- so
 * this is the house treatment of that clause, not a new one invented for one item.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";

let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply (dry by default; `--dry` is not a flag here).");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const ADDED_BY = "director hand link 2026-09-29 (cc3d3b2a re-anchor)";
const ROLE = "primary";

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F");
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code,statement&order=code"))
  .filter((t) => t.certification_id === certs[0].id);
const task = tasks.find((t) => t.code === "1.6");
if (!task) throw new Error("AIMS-F task 1.6 not found");
const sp = await getAll(KEY, "source_passages?select=id,source_id,edition,clause,title&order=id");
const hits = sp.filter((p) => p.source_id === "ISO/IEC 42001" && p.clause === "5.2");
if (hits.length !== 1) {
  throw new Error("42001 clause 5.2 resolved to " + hits.length + " passages; an ambiguous address is " +
    "not a link");
}
const p52 = hits[0];
const before = await getAll(KEY,
  "task_sources?select=task_id,passage_id,role,added_by&order=task_id,passage_id");
const already = before.find((r) => r.task_id === task.id && r.passage_id === p52.id);

console.log("AIMS-F 1.6: " + String(task.statement).replace(/\s+/g, " "));
console.log("link       : ISO/IEC 42001 " + p52.clause + " (" + p52.title + "), edition " + p52.edition);
console.log("role       : " + ROLE);
console.log("added_by   : " + ADDED_BY);
/* evidence that this is the house treatment of 5.2 rather than a one-off */
const codeById = new Map(tasks.map((t) => [t.id, t.code]));
const others = before.filter((r) => r.passage_id === p52.id && codeById.has(r.task_id))
  .map((r) => codeById.get(r.task_id) + "(" + r.role + ")");
console.log("5.2 already linked on AIMS-F tasks: " + (others.join(", ") || "none"));

if (already) {
  console.log("\nalready present with role " + already.role + " -- nothing to do.");
} else if (!APPLY) {
  console.log("\nDRY RUN -- nothing written. Re-run with --apply.");
} else {
  const res = await fetch(REST_URL + "/task_sources", {
    method: "POST",
    headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json",
      Prefer: "return=representation" },
    body: JSON.stringify([{ task_id: task.id, passage_id: p52.id, role: ROLE, added_by: ADDED_BY }]),
  });
  if (!res.ok) throw new Error("insert failed: " + res.status + " " + (await res.text()));
  console.log("\ninserted " + (await res.json()).length + " row");

  const after = await getAll(KEY,
    "task_sources?select=task_id,passage_id,role,added_by&order=task_id,passage_id");
  let fails = 0;
  const ok = (what, cond, detail) => {
    console.log((cond ? "  ok   " : "  FAIL ") + what + (detail && !cond ? "   " + detail : ""));
    if (!cond) fails++;
  };
  const got = after.find((r) => r.task_id === task.id && r.passage_id === p52.id);
  console.log("read-back:");
  ok("the row is present as " + ROLE, got && got.role === ROLE);
  ok("it carries the distinguishing tag", got && got.added_by === ADDED_BY);
  ok("exactly one row was added", after.length === before.length + 1, before.length + " -> " + after.length);
  const key = (r) => r.task_id + "|" + r.passage_id + "|" + r.role + "|" + r.added_by;
  const beforeSet = new Set(before.map(key));
  const changed = after.filter((r) => !beforeSet.has(key(r)) && !(r.task_id === task.id && r.passage_id === p52.id));
  ok("NOT ONE other row changed", changed.length === 0, changed.length + " moved");
  ok("the 150 reviewed primary links are untouched",
    after.filter((r) => r.added_by === "director ruling 2026-09-26" && r.role === "primary").length === 150);

  writeFileSync(join(ROOT, "TASK-16-52-LINK.json"), JSON.stringify({
    cert: "AIMS-F", task: "1.6", statement: task.statement, passage: p52, role: ROLE,
    added_by: ADDED_BY,
    why: "the ruling 'cc3d3b2a: keep, re-anchor to 42001 5.2' cannot be honoured without it -- the " +
      "gates resolve a clause against the task's own linked passages, so an unlinked 5.2 reads as " +
      "'not in the library'",
    also_primary_on: others,
  }, null, 1) + String.fromCharCode(10), "utf8");
  console.log("wrote TASK-16-52-LINK.json");
  if (fails) { console.error("\n" + fails + " read-back assertion(s) FAILED"); process.exitCode = 1; }
}
