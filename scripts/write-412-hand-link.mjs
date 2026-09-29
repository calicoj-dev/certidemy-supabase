#!/usr/bin/env node
/**
 * write-412-hand-link.mjs -- AIMS-IA task 4.12, linked by hand from the director's pick.
 *
 * `--apply` to write, DRY BY DEFAULT, unknown flags exit 2. This directory has two opposite flag
 * conventions and a new script takes the safe half.
 *
 * WHY THIS IS A SEPARATE SCRIPT AND NOT A FLAG ON write-task-sources.mjs. That script turns JUDGED
 * proposals into rows and applies six role rules to them. These nine rows were chosen by a human and
 * the roles were given, not derived -- running them through the rule engine would let a rule silently
 * demote a role the director set. `added_by` records the difference so the two can never be confused
 * later: "director hand link 2026-09-29" against "judged 2026-09-29, director sample read".
 *
 * AND THE CLAUSE KEY IS (SOURCE, EDITION, CLAUSE), NOT (SOURCE, CLAUSE). A clause address resolving to
 * more than one passage row ABORTS rather than picking one: this repository has already paid for a
 * main-body clause number resolving to an Annex A control, and for the same address meaning different
 * things in two editions. An ambiguous address is a third state, not a coin toss.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";

let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply (dry by default).");
  console.error("NOTE: this directory has TWO flag conventions. This script is the --apply family:");
  console.error("without --apply nothing is written, and `--dry` is NOT a recognised flag here.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const ADDED_BY = "director hand link 2026-09-29";
const CERT = "AIMS-IA";
const TASK = "4.12";

/* the director's pick, verbatim */
const PICK = [
  ["ISO/IEC 42001", "6.1.3", "primary"],
  ["ISO/IEC 42001", "8.1", "primary"],
  ["ISO/IEC 42001", "8.3", "primary"],
  ["ISO 19011", "6.4.7", "primary"],
  ["ISO 19011", "6.4.8", "primary"],
  ["ISO/IEC 42001", "3.26", "supporting"],
  ["ISO/IEC 42001", "7.5.3", "supporting"],
  ["ISO 19011", "6.4.6", "supporting"],
  ["ISO 19011", "A.5", "supporting"],
];

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq." + CERT);
if (certs.length !== 1) throw new Error(CERT + " did not resolve to exactly one certification");
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code,statement&order=code"))
  .filter((t) => t.certification_id === certs[0].id);
const task = tasks.find((t) => t.code === TASK);
if (!task) throw new Error(CERT + " task " + TASK + " not found");

const sp = await getAll(KEY, "source_passages?select=id,source_id,edition,clause,title&order=id");
const before = await getAll(KEY, "task_sources?select=task_id,passage_id,role,added_by&order=task_id,passage_id");

console.log(CERT + " " + TASK + ": " + String(task.statement).replace(/\s+/g, " "));
console.log("");

/* ---- resolve, and abort on ambiguity rather than choosing ---- */
const planned = [];
const problems = [];
for (const [source, clause, role] of PICK) {
  const hits = sp.filter((p) => p.source_id === source && p.clause === clause);
  if (hits.length === 0) { problems.push("ABSENT   " + source + " " + clause); continue; }
  if (hits.length > 1) {
    problems.push("AMBIGUOUS " + source + " " + clause + " -> " + hits.length + " rows, editions " +
      hits.map((h) => h.edition).join(" / ") + " -- an edition must be named");
    continue;
  }
  planned.push({ passage_id: hits[0].id, source, clause, role, edition: hits[0].edition,
    title: hits[0].title });
}
console.log("| role | source | clause | edition | title |");
console.log("|---|---|---|---|---|");
for (const r of planned) {
  console.log("| " + r.role + " | " + r.source + " | `" + r.clause + "` | " + (r.edition || "") +
    " | " + String(r.title || "").slice(0, 58) + " |");
}
if (problems.length) {
  console.error("\n" + problems.length + " address(es) did not resolve to exactly one passage:");
  for (const s of problems) console.error("  " + s);
  console.error("\nABORT: nothing written. An address that resolves to two rows is not a link.");
  process.exitCode = 2;
} else {
  /* a pair already present is left ALONE -- never overwrite a role a human set */
  const have = new Set(before.map((r) => r.task_id + "|" + r.passage_id));
  const toInsert = planned.filter((r) => !have.has(task.id + "|" + r.passage_id));
  const already = planned.length - toInsert.length;
  console.log("\nplanned " + planned.length + "   already present " + already +
    "   to insert " + toInsert.length);
  console.log("  primary " + planned.filter((r) => r.role === "primary").length +
    "   supporting " + planned.filter((r) => r.role === "supporting").length);

  if (!APPLY) {
    console.log("\nDRY RUN -- nothing written. Re-run with --apply.");
  } else if (!toInsert.length) {
    console.log("\nnothing to insert; every pair is already present.");
  } else {
    const body = toInsert.map((r) => ({ task_id: task.id, passage_id: r.passage_id,
      role: r.role, added_by: ADDED_BY }));
    const res = await fetch(REST_URL + "/task_sources", {
      method: "POST",
      headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json",
        Prefer: "return=representation" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("insert failed: " + res.status + " " + (await res.text()));
    console.log("inserted " + (await res.json()).length + " row(s)");
  }

  /* ---- read back, BOTH DIRECTIONS ---- */
  if (APPLY) {
    const after = await getAll(KEY,
      "task_sources?select=task_id,passage_id,role,added_by&order=task_id,passage_id");
    const byPair = new Map(after.map((r) => [r.task_id + "|" + r.passage_id, r]));
    let fails = 0;
    const ok = (what, cond, detail) => {
      console.log((cond ? "  ok   " : "  FAIL ") + what + (detail && !cond ? "   " + detail : ""));
      if (!cond) fails++;
    };
    console.log("\nread-back:");
    ok("all " + planned.length + " pairs present with the role the director set",
      planned.every((r) => (byPair.get(task.id + "|" + r.passage_id) || {}).role === r.role));
    ok("every row inserted by this run carries added_by " + JSON.stringify(ADDED_BY),
      after.filter((r) => r.added_by === ADDED_BY).length === toInsert.length,
      "found " + after.filter((r) => r.added_by === ADDED_BY).length + ", inserted " + toInsert.length);
    /* the negative half: nothing else moved */
    const key = (r) => r.task_id + "|" + r.passage_id + "|" + r.role + "|" + r.added_by;
    const beforeSet = new Set(before.map(key));
    const changed = after.filter((r) => r.added_by !== ADDED_BY && !beforeSet.has(key(r)));
    ok("no pre-existing row changed its role or tag", changed.length === 0,
      changed.length + " moved");
    ok("exactly " + toInsert.length + " row(s) added in total",
      after.length === before.length + toInsert.length,
      before.length + " -> " + after.length);
    /* 42001 3.26 is a DEFINITION and must not have landed as primary -- a definition imposes nothing */
    const defRow = planned.find((r) => r.clause === "3.26");
    if (defRow) ok("the clause 3.26 definition is supporting, not primary", defRow.role === "supporting");

    /* ---- the ruling's own check: zero-primary tasks for this certification ---- */
    const mine = new Set(tasks.map((t) => t.id));
    const withPrimary = new Set(after.filter((r) => r.role === "primary" && mine.has(r.task_id))
      .map((r) => r.task_id));
    const zero = tasks.filter((t) => !withPrimary.has(t.id));
    console.log("\n" + CERT + ": " + tasks.length + " tasks, " + withPrimary.size + " with a primary source");
    ok("zero-primary tasks == 0", zero.length === 0,
      zero.map((t) => t.code).join(", "));
    if (zero.length) for (const t of zero) console.log("    no primary: " + t.code);

    writeFileSync(join(ROOT, "TASK-412-HAND-LINK.json"), JSON.stringify({
      cert: CERT, task: TASK, statement: task.statement, added_by: ADDED_BY,
      rows: planned, inserted: toInsert.length, already_present: already,
      zero_primary_tasks: zero.map((t) => t.code),
    }, null, 1) + String.fromCharCode(10), "utf8");
    console.log("\nwrote TASK-412-HAND-LINK.json");
    if (fails) { console.error("\n" + fails + " read-back assertion(s) FAILED"); process.exitCode = 1; }
  }
}
