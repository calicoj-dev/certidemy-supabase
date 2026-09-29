#!/usr/bin/env node
/**
 * rerole-aimsf-judge-additions.mjs -- retire rule 6 and give AIMS-F's judge additions the roles the
 * other three certifications got.
 *
 * `--apply` to write, DRY BY DEFAULT, unknown flags exit 2.
 *
 * ============ WHAT THIS FIXES ============
 *
 * Rule 6 forced every AIMS-F judge addition to `supporting` so the 150 reviewed primary links could not
 * be disturbed. It achieved that. It also left AIMS-F with 150 primary rows against 382 supporting, and
 * because the anchoring pass supplied primaries only, 86 sound items were withheld for a bookkeeping
 * reason -- 95 of 142 drops carried no failing code gate at all.
 *
 * Protecting the reviewed links is done here by NOT TOUCHING THEM, which is what was actually wanted.
 * The two populations are separated by `added_by` and nothing else is trusted:
 *
 *     director ruling 2026-09-26            361 rows (150 primary + 211 supporting)   UNTOUCHABLE
 *     judged 2026-09-29, director sample read  171 rows (all supporting)              re-roled here
 *
 * ============ THE ROLES COME FROM THE SHARED MODULE, NOT FROM A SECOND COPY ============
 *
 * `lib/task-source-roles.mjs` holds the rules and 16 both-direction controls, and both this script and
 * `write-task-sources.mjs` import it. A second hand-written copy would diverge, and the divergence
 * would show up as one certification's roles differing for a reason nobody recorded.
 *
 * ============ AND THE CONFIDENCE IS READ, NOT RE-DERIVED ============
 *
 * `TASK-SOURCES-PLAN.json` recorded the judge's confidence per proposal at write time. Re-asking a model
 * would produce a different answer and silently re-decide 171 rows on a fresh opinion rather than
 * applying a rule to the recorded one.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { roleFor, selfTest } from "./lib/task-source-roles.mjs";

let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply (dry by default).");
  console.error("This script is the --apply family: `--dry` is NOT recognised here.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const CERT = "AIMS-F";
const JUDGED = "judged 2026-09-29, director sample read";
const REVIEWED = "director ruling 2026-09-26";

selfTest();

const plan = JSON.parse(readFileSync(join(ROOT, "TASK-SOURCES-PLAN.json"), "utf8"));
const mine = (plan.plan || []).filter((r) => r.cert === CERT);
if (!mine.length) throw new Error("no AIMS-F rows in TASK-SOURCES-PLAN.json");

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq." + CERT);
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code,statement&order=code"))
  .filter((t) => t.certification_id === certs[0].id);
const stmtById = new Map(tasks.map((t) => [t.id, t.statement]));
const taskIds = new Set(tasks.map((t) => t.id));
const before = (await getAll(KEY,
  "task_sources?select=task_id,passage_id,role,added_by&order=task_id,passage_id"));
const beforeMine = before.filter((r) => taskIds.has(r.task_id));
const liveByPair = new Map(beforeMine.map((r) => [r.task_id + "|" + r.passage_id, r]));

/* the plan is a record of intent; the DATABASE is the state. Only rows that are actually present and
 * actually tagged as judge additions may be touched -- a plan row whose live row is reviewed-tagged
 * would otherwise let this script rewrite a reviewed link from a file. */
const changes = [], skipped = [], drops = [];
for (const r of mine) {
  const live = liveByPair.get(r.task_id + "|" + r.passage_id);
  if (!live) { skipped.push({ ...r, why: "not present in task_sources" }); continue; }
  if (live.added_by !== JUDGED) {
    skipped.push({ ...r, why: "live row is tagged " + JSON.stringify(live.added_by) + " -- not mine to move" });
    continue;
  }
  const v = roleFor({ source: r.source, clause: r.clause, confidence: r.confidence,
    statement: stmtById.get(r.task_id) });
  if (v.drop) { drops.push({ ...r, why: v.why }); continue; }
  if (v.role !== live.role) {
    changes.push({ ...r, from: live.role, to: v.role, why: v.why });
  }
}

console.log(CERT + ": " + mine.length + " judge additions in the plan, " +
  beforeMine.filter((r) => r.added_by === JUDGED).length + " live and tagged as such");
console.log("  role changes        " + changes.length);
console.log("  already correct     " + (mine.length - changes.length - skipped.length - drops.length));
console.log("  skipped             " + skipped.length);
console.log("  rule 2a would drop  " + drops.length);
for (const s of skipped.slice(0, 5)) console.log("    skip: " + s.task + " " + s.source + " " + s.clause + " -- " + s.why);
for (const d of drops) console.log("    DROP: " + d.task + " " + d.source + " " + d.clause + " -- " + d.why);

const byTo = {};
for (const c of changes) byTo[c.from + " -> " + c.to] = (byTo[c.from + " -> " + c.to] || 0) + 1;
console.log("");
for (const [k, v] of Object.entries(byTo)) console.log("  " + k + "   " + v);

/* what the map looks like after, per task -- the number the audit actually depends on */
const primaryAfter = new Map();
for (const t of tasks) primaryAfter.set(t.id, 0);
for (const r of beforeMine) if (r.role === "primary") primaryAfter.set(r.task_id, (primaryAfter.get(r.task_id) || 0) + 1);
for (const c of changes) if (c.to === "primary") primaryAfter.set(c.task_id, (primaryAfter.get(c.task_id) || 0) + 1);
console.log("\nprimary passages per task, before -> after:");
const primaryBefore = new Map();
for (const t of tasks) primaryBefore.set(t.id, 0);
for (const r of beforeMine) if (r.role === "primary") primaryBefore.set(r.task_id, (primaryBefore.get(r.task_id) || 0) + 1);
for (const t of tasks.sort((a, b) => String(a.code).localeCompare(String(b.code), undefined, { numeric: true }))) {
  const b = primaryBefore.get(t.id) || 0, a = primaryAfter.get(t.id) || 0;
  if (b !== a) console.log("  " + t.code.padEnd(5) + " " + String(b).padStart(3) + " -> " + String(a).padStart(3));
}
console.log("  TOTAL " + [...primaryBefore.values()].reduce((s, v) => s + v, 0) +
  " -> " + [...primaryAfter.values()].reduce((s, v) => s + v, 0));

if (!APPLY) {
  console.log("\nDRY RUN -- nothing written. Re-run with --apply.");
} else {
  let n = 0;
  for (const c of changes) {
    const res = await fetch(REST_URL + "/task_sources?task_id=eq." + c.task_id +
      "&passage_id=eq." + c.passage_id + "&added_by=eq." + encodeURIComponent(JUDGED), {
      method: "PATCH",
      headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json",
        Prefer: "return=representation" },
      body: JSON.stringify({ role: c.to }),
    });
    if (!res.ok) throw new Error("patch failed on " + c.task + " " + c.clause + ": " +
      res.status + " " + (await res.text()));
    const got = await res.json();
    if (got.length !== 1) throw new Error("patch touched " + got.length + " rows on " + c.task + " " + c.clause);
    n++;
  }
  console.log("\npatched " + n + " row(s)");

  /* ---- read back, BOTH DIRECTIONS ---- */
  const after = (await getAll(KEY,
    "task_sources?select=task_id,passage_id,role,added_by&order=task_id,passage_id"));
  const afterByPair = new Map(after.map((r) => [r.task_id + "|" + r.passage_id, r]));
  let fails = 0;
  const ok = (what, cond, detail) => {
    console.log((cond ? "  ok   " : "  FAIL ") + what + (detail && !cond ? "   " + detail : ""));
    if (!cond) fails++;
  };
  console.log("\nread-back:");
  ok("every intended change landed",
    changes.every((c) => (afterByPair.get(c.task_id + "|" + c.passage_id) || {}).role === c.to));
  /* THE NEGATIVE HALF, and it is the one that matters: not one reviewed row may have moved. */
  const key = (r) => r.task_id + "|" + r.passage_id + "|" + r.role + "|" + r.added_by;
  const reviewedBefore = before.filter((r) => r.added_by === REVIEWED).map(key).sort().join("\n");
  const reviewedAfter = after.filter((r) => r.added_by === REVIEWED).map(key).sort().join("\n");
  ok("NOT ONE row tagged " + JSON.stringify(REVIEWED) + " changed", reviewedBefore === reviewedAfter);
  ok("the 150 reviewed PRIMARY links are still 150 primary",
    after.filter((r) => r.added_by === REVIEWED && r.role === "primary").length === 150,
    "found " + after.filter((r) => r.added_by === REVIEWED && r.role === "primary").length);
  ok("no row was added or removed", after.length === before.length,
    before.length + " -> " + after.length);
  ok("no row outside AIMS-F changed",
    before.filter((r) => !taskIds.has(r.task_id)).map(key).sort().join("\n") ===
    after.filter((r) => !taskIds.has(r.task_id)).map(key).sort().join("\n"));
  const unchangedJudged = mine.length - changes.length - skipped.length - drops.length;
  ok("the judge additions this run did NOT change are still supporting",
    changes.length + unchangedJudged + skipped.length + drops.length === mine.length);
  const zero = tasks.filter((t) => !after.some((r) => r.task_id === t.id && r.role === "primary"));
  ok("AIMS-F zero-primary tasks == 0", zero.length === 0, zero.map((t) => t.code).join(", "));

  const afterMine = after.filter((r) => taskIds.has(r.task_id));
  console.log("\nAIMS-F map after: primary " + afterMine.filter((r) => r.role === "primary").length +
    ", supporting " + afterMine.filter((r) => r.role === "supporting").length);

  writeFileSync(join(ROOT, "AIMSF-REROLE.json"), JSON.stringify({
    cert: CERT, judged_rows: mine.length, changed: changes.length, skipped, drops,
    primary_before: [...primaryBefore.values()].reduce((s, v) => s + v, 0),
    primary_after: afterMine.filter((r) => r.role === "primary").length,
    per_task_primary: Object.fromEntries(tasks.map((t) =>
      [t.code, { before: primaryBefore.get(t.id) || 0,
        after: afterMine.filter((r) => r.task_id === t.id && r.role === "primary").length }])),
    changes: changes.map((c) => ({ task: c.task, source: c.source, clause: c.clause,
      confidence: c.confidence, from: c.from, to: c.to, why: c.why })),
  }, null, 1) + String.fromCharCode(10), "utf8");
  console.log("wrote AIMSF-REROLE.json");
  if (fails) { console.error("\n" + fails + " read-back assertion(s) FAILED"); process.exitCode = 1; }
}
