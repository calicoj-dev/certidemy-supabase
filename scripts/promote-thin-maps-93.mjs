#!/usr/bin/env node
/**
 * promote-thin-maps-93.mjs -- apply the 14 thin-map rulings in THIN-MAP-VERDICTS-93.json as `director-93`.
 *
 * `--apply` to write. DRY BY DEFAULT, unknown flags exit 2. `--dry` is NOT a flag here.
 *
 * ============ THE VERDICT FILE IS THE AUTHORITY, AND THE SCRIPT CARRIES NO CLAUSE LIST ============
 *
 * Ruled PROMPT-93 s3: "Promote with a promote script that refuses anything the file doesn't list." So this
 * script has no list of its own to disagree with -- promote-13 held the ruling twice, once in the verdict
 * file and once as RULED, and compared them. That was right for seven clauses put to the director as one
 * decision. For fourteen tasks a second copy is fourteen chances to diverge, so there is only one copy and
 * the refusal is structural: a clause not in the file is never looked up, never planned, never written.
 *
 * ============ WHAT IT REFUSES, AND WHY EACH REFUSAL IS ITS OWN STATE ============
 *
 *   an ambiguous address     a clause resolving to more or fewer than one passage is not a link
 *   promote AND decline      the same clause on both lists is a contradiction in the ruling, not a
 *                            precedence question. It aborts rather than choosing.
 *   boundary_check_first     a clause the boundary rule holds back stays UNPROMOTED until its passage is
 *                            under the 60-word trigger. It is reported as HELD, never as failed and never
 *                            as done -- the third state.
 *   a demotion              nothing here demotes. A `primary` row stays primary; this script only ever
 *                            raises a role or inserts a missing link.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
/* SHARED with check-definition-boundaries.mjs: ONE implementation of "has this entry run past its own end",
 * so the report and this gate cannot disagree about a clause. */
import { boundaryVerdict, headingsOfSource, definitionBoundaryControls }
  from "./lib/definition-boundary.mjs";

let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply (dry by default; `--dry` is not a flag here).");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const spec = JSON.parse(readFileSync(join(ROOT, "THIN-MAP-VERDICTS-93.json"), "utf8"));
const ADDED_BY = spec.added_by;
if (ADDED_BY !== "director-93") {
  console.error("ABORT: the verdict file's added_by is " + JSON.stringify(ADDED_BY) + ", not director-93.");
  process.exit(2);
}
const words = (t) => String(t || "").trim().split(/\s+/).filter(Boolean).length;

/* THE MODULE'S CONTROLS RUN FIRST. A boundary verdict decides whether a ruled clause is promoted, so a broken
 * detector would either hold back approved work or release a swallowed passage into an exam item. */
{
  const c = definitionBoundaryControls();
  const bad = c.filter((x) => !x.pass);
  console.log("BOUNDARY CONTROLS  " + (c.length - bad.length) + " of " + c.length + " pass");
  for (const x of bad) console.log("  FAIL " + x.what + "   " + x.detail);
  if (bad.length) { console.error("\nNOTHING WRITTEN: the boundary detector is broken."); process.exit(2); }
  console.log("");
}

/* ---- the ruling's own consistency, before anything is read from the database ---- */
let bad = 0;
for (const t of spec.tasks) {
  const prom = new Set(t.promote || []);
  for (const d of t.decline || []) {
    if (prom.has(d.clause)) {
      console.error("ABORT: task " + t.task + " lists " + d.clause + " as BOTH promote and decline.");
      bad++;
    }
  }
  for (const b of t.boundary_check_first || []) {
    if (prom.has(b.clause)) {
      console.error("ABORT: task " + t.task + " lists " + b.clause + " as promote AND boundary_check_first. " +
        "A clause held back is not a clause approved.");
      bad++;
    }
  }
  if (!prom.size) { console.error("ABORT: task " + t.task + " promotes nothing; an empty ruling is a mistake."); bad++; }
}
if (bad) { console.error("\nNOTHING WRITTEN. The ruling contradicts itself; it is not the script's place to resolve it."); process.exit(2); }
console.log("THE VERDICT FILE IS CONSISTENT: " + spec.tasks.length + " task(s), " +
  spec.tasks.reduce((n, t) => n + t.promote.length, 0) + " clause(s) approved, " +
  spec.tasks.reduce((n, t) => n + (t.decline || []).length, 0) + " declined, " +
  spec.tasks.reduce((n, t) => n + (t.boundary_check_first || []).length, 0) + " held for a boundary check.");
console.log("");

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq." + spec.certification);
if (certs.length !== 1) { console.error("ABORT: " + spec.certification + " did not resolve to one row."); process.exit(2); }
const allTasks = (await getAll(KEY, "tasks?select=id,certification_id,code,statement&order=code"))
  .filter((t) => t.certification_id === certs[0].id);
const sp = await getAll(KEY, "source_passages?select=id,source_id,edition,clause,title,text&order=id");
const ts = await getAll(KEY, "task_sources?select=task_id,passage_id,role,added_by&order=task_id,passage_id");
const byTask = new Map();
for (const r of ts) {
  if (!byTask.has(r.task_id)) byTask.set(r.task_id, new Map());
  byTask.get(r.task_id).set(r.passage_id, r);
}

const plan = [];
const held = [];
for (const t of spec.tasks) {
  const task = allTasks.find((x) => x.code === t.task);
  if (!task) { console.error("ABORT: task " + t.task + " is not a task of " + spec.certification); process.exit(2); }
  const live = byTask.get(task.id) || new Map();
  for (const b of t.boundary_check_first || []) {
    const hits = sp.filter((x) => x.source_id === "ISO/IEC 42001" && x.clause === b.clause);
    /* THE SWALLOW SIGNAL DECIDES, NOT THE LENGTH. My first version cleared only a passage under the 60-word
     * trigger, so 3.26 stayed HELD at 89 words after being repaired -- and 89 words is the correct entry,
     * the definition plus both of ISO's notes. Length is the reason to look, never the verdict. */
    const of42001 = sp.filter((x) => x.source_id === "ISO/IEC 42001");
    const v = boundaryVerdict(b.clause, hits.length === 1 ? hits[0] : null, {
      clausesOfSameSource: new Set(of42001.map((x) => String(x.clause))),
      headings: headingsOfSource(of42001),
    });
    held.push({ task: t.task, clause: b.clause, n: v.words, state: v.state, why: b.why, verdict: v.why });
    /* Only CLEAN promotes. `unknown` is not clean: a clause the library does not hold was never examined. */
    if (v.state === "clean") t.promote = [...t.promote, b.clause];
  }
  for (const c of t.promote) {
    const src = /^22989/.test(c) ? "ISO/IEC 22989" : "ISO/IEC 42001";
    const hits = sp.filter((x) => x.source_id === src && x.clause === c);
    if (hits.length !== 1) {
      console.error("ABORT: task " + t.task + " clause " + c + " resolved to " + hits.length +
        " passage(s); an ambiguous address is not a link.");
      process.exit(2);
    }
    const pas = hits[0];
    const row = live.get(pas.id);
    plan.push({
      task: t.task, task_id: task.id, clause: c, passage_id: pas.id, chars: words(pas.text),
      action: !row ? "insert" : row.role === "primary" ? "already primary" : "promote",
      from: row ? row.role : "(not linked)", tag: row ? row.added_by : null,
    });
  }
}

console.log("HELD FOR A BOUNDARY CHECK");
if (!held.length) console.log("  none");
for (const h of held) {
  const label = h.state === "clean" ? "CLEARED -> promoted"
    : h.state === "swallowed" ? "STILL SWALLOWED -- not promoted"
      : "UNKNOWN (the library does not hold it) -- not promoted";
  console.log("  task " + h.task + "  " + h.clause + "  " +
    (h.n === null ? "not held" : h.n + "w") + "   " + label);
  console.log("        ruling:   " + h.why);
  console.log("        measured: " + h.verdict);
}
console.log("");
console.log("PLAN, " + plan.length + " clause(s)");
let lastTask = null;
for (const r of plan) {
  if (r.task !== lastTask) { console.log("  task " + r.task); lastTask = r.task; }
  console.log("    " + r.clause.padEnd(10) + r.action.padEnd(16) + "from " + String(r.from).padEnd(12) +
    r.chars + "w" + (r.tag ? "   (tagged " + r.tag + ")" : ""));
}
const toPatch = plan.filter((r) => r.action === "promote");
const toInsert = plan.filter((r) => r.action === "insert");
console.log("");
console.log("  promote " + toPatch.length + "   insert " + toInsert.length + "   already primary " +
  plan.filter((r) => r.action === "already primary").length);

console.log("");
console.log("DECLINED, recorded so a re-proposal meets the reason rather than silence");
for (const t of spec.tasks) for (const d of t.decline || []) {
  console.log("  task " + t.task + "  " + d.clause + "   " + d.why);
}

if (!APPLY) {
  console.log("\nDRY RUN -- nothing written. Re-run with --apply.");
  process.exit(0);
}
let patched = 0, inserted = 0;
for (const r of toPatch) {
  const res = await fetch(REST_URL + "/task_sources?task_id=eq." + r.task_id + "&passage_id=eq." + r.passage_id, {
    method: "PATCH",
    headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json",
      Prefer: "return=representation" },
    body: JSON.stringify({ role: "primary", added_by: ADDED_BY }),
  });
  if (!res.ok) throw new Error("patch failed on " + r.task + " " + r.clause + ": " + res.status + " " + (await res.text()));
  const got = await res.json();
  if (got.length !== 1) throw new Error("patch touched " + got.length + " row(s) on " + r.task + " " + r.clause);
  patched++;
}
for (const r of toInsert) {
  const res = await fetch(REST_URL + "/task_sources", {
    method: "POST",
    headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json",
      Prefer: "return=representation" },
    body: JSON.stringify([{ task_id: r.task_id, passage_id: r.passage_id, role: "primary", added_by: ADDED_BY }]),
  });
  if (!res.ok) throw new Error("insert failed on " + r.task + " " + r.clause + ": " + res.status + " " + (await res.text()));
  const got = await res.json();
  if (got.length !== 1) throw new Error("insert wrote " + got.length + " row(s) on " + r.task + " " + r.clause);
  inserted++;
}
console.log("\npatched " + patched + ", inserted " + inserted);

/* ---- read the rows back, both directions ---- */
const after = await getAll(KEY, "task_sources?select=task_id,passage_id,role,added_by&order=task_id,passage_id");
const afterByTask = new Map();
for (const r of after) {
  if (!afterByTask.has(r.task_id)) afterByTask.set(r.task_id, new Map());
  afterByTask.get(r.task_id).set(r.passage_id, r);
}
let wrong = 0;
for (const r of plan) {
  const row = (afterByTask.get(r.task_id) || new Map()).get(r.passage_id);
  if (!row) { console.error("  POST-CONDITION FAIL: " + r.task + " " + r.clause + " has no row"); wrong++; continue; }
  if (row.role !== "primary") { console.error("  POST-CONDITION FAIL: " + r.task + " " + r.clause + " is " + row.role); wrong++; }
  if (r.action !== "already primary" && row.added_by !== ADDED_BY) {
    console.error("  POST-CONDITION FAIL: " + r.task + " " + r.clause + " is tagged " + row.added_by); wrong++;
  }
}
/* THE NEGATIVE HALF: nothing outside the plan may have moved. A count of promotions passes on a run that
 * also promoted something nobody ruled on. */
const planned = new Set(plan.map((r) => r.task_id + "|" + r.passage_id));
let collateral = 0;
for (const b of ts) {
  const now = (afterByTask.get(b.task_id) || new Map()).get(b.passage_id);
  if (!now) { console.error("  COLLATERAL: a row disappeared: " + b.task_id + " " + b.passage_id); collateral++; continue; }
  if (planned.has(b.task_id + "|" + b.passage_id)) continue;
  if (now.role !== b.role || now.added_by !== b.added_by) {
    console.error("  COLLATERAL: an unplanned row changed: role " + b.role + "->" + now.role +
      ", added_by " + b.added_by + "->" + now.added_by); collateral++;
  }
}
console.log("POST-CONDITION  " + (plan.length - wrong) + " of " + plan.length +
  " planned row(s) primary and tagged; " + collateral + " unplanned row(s) changed (must be 0)");
if (wrong || collateral) process.exitCode = 1;
