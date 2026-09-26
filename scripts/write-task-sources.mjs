/**
 * write-task-sources.mjs -- write the director's AIMS-F task map into public.task_sources.
 *
 * `--apply` writes. DRY BY DEFAULT. Unknown flags exit 2 and name both flag conventions.
 *
 * ============ THE MAP IS A RULING, SO AN UNRESOLVED ID IS A HARD ERROR ============
 *
 * Every id comes from `scripts/lib/aimsf-task-sources-map.mjs`, which is the director's answer
 * rather than a ranking. His instruction was: resolve every id against the library, an id that
 * does not resolve is a hard error, report it, do not substitute. So this validates the WHOLE
 * map before it writes anything -- one unresolved id refuses the entire write, because a map
 * that is 95 percent applied is a map nobody can reason about.
 *
 * ============ WHAT THE ROLE IS FOR ============
 *
 * `primary` is what the task is ABOUT. The generator's code gate requires a KEY to anchor in a
 * primary passage; a distractor's reason may use a supporting one. That single rule is what
 * takes out the two off-task items in the first pilot -- #3 tested drift monitoring on a task
 * about the life cycle, #30 tested internal-audit frequency on a task about the certification
 * route.
 *
 * ============ AND 375 ALREADY HAS THE COLUMN ============
 *
 * No migration is needed for `role`: migration 375 created `task_sources` with
 * `role text not null default 'primary'` and a CHECK against ('primary','supporting'). Checked
 * against the live table rather than assumed.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { AIMSF_TASK_SOURCES, expandEntry, mapControls } from "./lib/aimsf-task-sources-map.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const CERT = "AIMS-F";
const ADDED_BY = "director ruling 2026-09-26";

let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("unknown flag " + JSON.stringify(a));
  console.error("  --apply family  dry by default, --apply writes   <- this script");
  console.error("  --dry family    LIVE by default, --dry is safe");
  process.exitCode = 2; process.exit();
}

async function main() {
  const KEY = requireKey(HERE);
  const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));

  const ctl = mapControls(lib.passages);
  console.log("map expander controls: " + ctl.examined + " cases, " + ctl.fails.length + " fail");
  for (const f of ctl.fails) console.error("  " + f);
  if (ctl.fails.length) return 2;

  /* The live passage rows, so a link points at a real id. */
  const sp = await getAll(KEY, "source_passages?select=id,source_id,edition,clause&order=source_id");
  const idOf = new Map(sp.map((r) => [r.source_id + "|" + r.edition + "|" + r.clause, r.id]));
  console.log("live source_passages: " + sp.length);

  const certs = await getAll(KEY, "certifications?select=id,code&code=eq." + CERT);
  if (!certs.length) { console.error(CERT + " not found"); return 2; }
  const allTasks = await getAll(KEY, "tasks?select=id,certification_id,code&order=code");
  const tasks = allTasks.filter((t) => t.certification_id === certs[0].id);
  const taskId = new Map(tasks.map((t) => [t.code, t.id]));

  /* -------------------------------------------------------------- resolve everything first */
  const rows = [];
  const errors = [];
  const containers = [];
  const holds = [];
  const notes = [];
  for (const [code, spec] of Object.entries(AIMSF_TASK_SOURCES)) {
    if (!taskId.has(code)) { errors.push("task " + code + " is not an " + CERT + " task"); continue; }
    if (spec.hold) { holds.push(code + ": " + spec.hold); continue; }
    if (spec.note) notes.push(code + ": " + spec.note);
    for (const role of ["primary", "supporting"]) {
      for (const entry of spec[role] || []) {
        const r = expandEntry(entry, lib.passages);
        if (r.error) { errors.push("task " + code + " " + role + ": " + r.error); continue; }
        if (r.container) {
          containers.push("task " + code + " " + role + ": " + r.container +
            " is a container; its children carry the text (" + r.children.join(", ") + ")");
          continue;
        }
        for (const clause of r.clauses) {
          const pid = idOf.get(r.source_id + "|" + r.edition + "|" + clause);
          if (!pid) {
            errors.push("task " + code + " " + role + ": " + r.source_id + " " + clause +
              " is in the artifact and NOT in the table -- reload with load-source-passages.mjs --apply");
            continue;
          }
          rows.push({ task_id: taskId.get(code), passage_id: pid, role, added_by: ADDED_BY,
            _task: code, _clause: r.source_id + " " + clause });
        }
      }
    }
  }

  /* A passage may be declared both primary and supporting for one task -- primary wins, because
   * the gate's question is "may a KEY anchor here" and the wider answer is the permissive one. */
  const best = new Map();
  for (const r of rows) {
    const k = r.task_id + "|" + r.passage_id;
    const prev = best.get(k);
    if (!prev || (prev.role === "supporting" && r.role === "primary")) best.set(k, r);
  }
  const final = [...best.values()];

  console.log("");
  console.log("TASK SOURCES  " + CERT + (APPLY ? "  --apply (WILL WRITE)" : "  dry run (default)"));
  console.log("  tasks in the ruling      " + Object.keys(AIMSF_TASK_SOURCES).length + " of " + tasks.length);
  console.log("  links resolved           " + final.length +
    "   (" + final.filter((r) => r.role === "primary").length + " primary, " +
    final.filter((r) => r.role === "supporting").length + " supporting)");
  console.log("  collapsed duplicates     " + (rows.length - final.length) + "   (primary wins over supporting)");
  console.log("  HOLD, no rows written    " + holds.length);
  for (const h of holds) console.log("    " + h);
  console.log("  containers, not linked   " + containers.length);
  for (const c of containers) console.log("    " + c);
  if (notes.length) {
    console.log("  notes carried in the ruling:");
    for (const n of notes) console.log("    " + n);
  }

  if (errors.length) {
    console.error("");
    console.error("REFUSING TO WRITE -- " + errors.length + " id(s) did not resolve. The ruling says an");
    console.error("id that does not resolve is a hard error, and a partly applied map is worse than none:");
    for (const e of errors) console.error("  " + e);
    return 2;
  }

  /* Per-task coverage, so a task mapped to nothing is visible rather than implied. */
  const perTask = new Map();
  for (const r of final) {
    if (!perTask.has(r._task)) perTask.set(r._task, { primary: 0, supporting: 0 });
    perTask.get(r._task)[r.role]++;
  }
  const noPrimary = [...perTask].filter(([, v]) => !v.primary).map(([k]) => k);
  console.log("  tasks with NO primary    " + noPrimary.length + (noPrimary.length ? "  " + noPrimary.join(" ") : ""));
  if (noPrimary.length) {
    console.error("REFUSING TO WRITE: a task with no primary passage can generate nothing, and the");
    console.error("generator would refuse its items for a reason that names the item, not the map.");
    return 2;
  }

  if (!APPLY) {
    console.log("");
    console.log("Nothing written. Re-run with --apply.");
    return 0;
  }

  /* -------------------------------------------------------------- write */
  const body = final.map((r) => ({ task_id: r.task_id, passage_id: r.passage_id, role: r.role, added_by: r.added_by }));
  let wrote = 0;
  for (let i = 0; i < body.length; i += 200) {
    const batch = body.slice(i, i + 200);
    const res = await fetch(REST_URL + "/task_sources?on_conflict=task_id,passage_id", {
      method: "POST",
      headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(batch),
    });
    if (!res.ok) { console.error("insert failed: " + res.status + " " + (await res.text()).slice(0, 300)); return 2; }
    wrote += batch.length;
    console.log("  upserted " + wrote + " / " + body.length);
  }

  /* -------------------------------------------------------------- read back */
  const live = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id");
  const liveKeys = new Set(live.map((r) => r.task_id + "|" + r.passage_id + "|" + r.role));
  const missing = final.filter((r) => !liveKeys.has(r.task_id + "|" + r.passage_id + "|" + r.role));
  console.log("");
  console.log("POST-CONDITIONS");
  console.log("  rows in task_sources                      " + live.length);
  console.log("  links written and not readable back       " + missing.length);
  if (missing.length) {
    for (const m of missing.slice(0, 10)) console.log("    " + m._task + " " + m._clause + " " + m.role);
    throw new Error("write incomplete: " + missing.length + " link(s) did not land");
  }
  /* The negative half: nothing beyond the ruling, and every role inside the vocabulary. */
  const mine = new Set(final.map((r) => r.task_id + "|" + r.passage_id));
  const extra = live.filter((r) => !mine.has(r.task_id + "|" + r.passage_id));
  console.log("  rows the ruling does not describe        " + extra.length);
  const offVocab = live.filter((r) => r.role !== "primary" && r.role !== "supporting");
  console.log("  rows with a role outside the vocabulary  " + offVocab.length);
  if (offVocab.length) throw new Error("the CHECK constraint on role is not doing its job");
  /* And per task, which is the number the generator depends on. */
  const byTask = new Map();
  for (const r of live) {
    if (!byTask.has(r.task_id)) byTask.set(r.task_id, { primary: 0, supporting: 0 });
    byTask.get(r.task_id)[r.role]++;
  }
  const liveNoPrimary = [...byTask].filter(([, v]) => !v.primary).length;
  console.log("  tasks live with NO primary passage        " + liveNoPrimary + " (must be 0)");
  if (liveNoPrimary) throw new Error("a task has supporting passages and no primary one");
  console.log("");
  console.log("written.");
  return 0;
}

process.exitCode = await main();
