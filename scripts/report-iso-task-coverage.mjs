#!/usr/bin/env node
/**
 * report-iso-task-coverage.mjs -- per-task source coverage for the four ISO certifications.
 *
 * READ-ONLY. No `--apply`. Unknown flags exit 2.
 *
 *   --out=ISO-TASK-COVERAGE.md
 *
 * ============ WHY THIS GOES FIRST ============
 *
 * Ruled to sit at the front of the rebuild work, and the reason is that a generation run costs model
 * calls per item while a task with no linked passage can produce NOTHING: the grounded generator
 * anchors a key in a task's primary passages, and a task with zero of them refuses every item it is
 * asked for. Finding that out after paying for a run is the expensive order.
 *
 * ============ THE THREE STATES, AGAIN ============
 *
 *   LINKED      the task has primary passages and can be generated against
 *   SUPPORTING  it has supporting passages only -- the anchor gate needs a PRIMARY, so this is not
 *               generatable either, and folding it into LINKED would report coverage it does not have
 *   ZERO        no `task_sources` row at all
 *
 * A count of linked TASKS would hide the difference, which is why the table carries both columns.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let OUT = "ISO-TASK-COVERAGE.md";
for (const a of process.argv.slice(2)) {
  const m = /^--out=(.+)$/.exec(a);
  if (m) { OUT = m[1]; continue; }
  console.error("unknown flag " + JSON.stringify(a) + ". Known: --out=");
  console.error("READ-ONLY: no --apply, no --dry. It writes one markdown file and no table.");
  process.exitCode = 2; process.exit();
}

const ISO_CERTS = ["ISMS-F", "ISMS-IA", "AIMS-F", "AIMS-IA"];

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code,name&order=code");
const wanted = certs.filter((c) => ISO_CERTS.includes(c.code));
if (wanted.length !== ISO_CERTS.length) {
  console.error("expected " + ISO_CERTS.length + " ISO certifications, resolved " + wanted.length);
  process.exitCode = 3; process.exit();
}
const certById = new Map(wanted.map((c) => [c.id, c]));

const tasks = await getAll(KEY, "tasks?select=id,code,certification_id,statement,domain_id&order=id");
const isoTasks = tasks.filter((t) => certById.has(t.certification_id));

const links = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id");
const passages = await getAll(KEY, "source_passages?select=id,source_id,edition,clause,title&order=id");
const pById = new Map(passages.map((p) => [p.id, p]));

/* The secure English bank per task, so the report says what each task already HAS as well as what it
 * could generate against. The floor the ruling names is 8 per task, English only. */
const items = await getAll(KEY, "quiz_questions?select=id,task_id,pool,language,status,retired_at" +
  "&language=eq.en&pool=eq.secure&status=eq.approved&retired_at=is.null&order=id");
const liveByTask = new Map();
for (const r of items) liveByTask.set(r.task_id, (liveByTask.get(r.task_id) || 0) + 1);

const FLOOR = 8;
const rows = isoTasks.map((t) => {
  const mine = links.filter((l) => l.task_id === t.id);
  const primary = mine.filter((l) => l.role === "primary");
  const supporting = mine.filter((l) => l.role === "supporting");
  const srcs = new Set(mine.map((l) => (pById.get(l.passage_id) || {}).source_id).filter(Boolean));
  const live = liveByTask.get(t.id) || 0;
  return {
    cert: certById.get(t.certification_id).code, task: t.code,
    primary: primary.length, supporting: supporting.length,
    sources: [...srcs].sort(),
    state: primary.length ? "LINKED" : supporting.length ? "SUPPORTING ONLY" : "ZERO",
    live, short: Math.max(0, FLOOR - live),
  };
}).sort((a, b) => a.cert.localeCompare(b.cert) ||
  a.task.localeCompare(b.task, undefined, { numeric: true }));

const md = [];
const p = (s = "") => md.push(s);
p("# ISO certifications: per-task source coverage");
p("");
p("`scripts/report-iso-task-coverage.mjs`, read-only. Nothing was written.");
p("");
p("**A task with no PRIMARY passage cannot be generated against.** The anchor gate requires the key to");
p("rest on a primary passage of the task, so `SUPPORTING ONLY` is not generatable either -- it is listed");
p("separately rather than folded into LINKED, because a count of tasks with any link would report");
p("coverage that does not exist.");
p("");
p("| certification | tasks | LINKED | SUPPORTING ONLY | ZERO | live secure EN | short of " + FLOOR + " |");
p("|---|---|---|---|---|---|---|");
for (const code of ISO_CERTS) {
  const mine = rows.filter((r) => r.cert === code);
  p("| " + code + " | " + mine.length + " | " + mine.filter((r) => r.state === "LINKED").length +
    " | " + mine.filter((r) => r.state === "SUPPORTING ONLY").length +
    " | " + mine.filter((r) => r.state === "ZERO").length +
    " | " + mine.reduce((n, r) => n + r.live, 0) +
    " | " + mine.reduce((n, r) => n + r.short, 0) + " |");
}
p("| **total** | " + rows.length + " | " + rows.filter((r) => r.state === "LINKED").length +
  " | " + rows.filter((r) => r.state === "SUPPORTING ONLY").length +
  " | " + rows.filter((r) => r.state === "ZERO").length +
  " | " + rows.reduce((n, r) => n + r.live, 0) +
  " | " + rows.reduce((n, r) => n + r.short, 0) + " |");
p("");
p("## Tasks with ZERO linked passages");
p("");
const zero = rows.filter((r) => r.state === "ZERO");
if (!zero.length) p("None.");
else {
  p("These cannot be generated against at all until they are linked.");
  p("");
  p("| certification | task | live secure EN |");
  p("|---|---|---|");
  for (const r of zero) p("| " + r.cert + " | " + r.task + " | " + r.live + " |");
}
p("");
p("## Every task");
p("");
p("| certification | task | state | primary | supporting | sources | live EN | short |");
p("|---|---|---|---|---|---|---|---|");
for (const r of rows) {
  p("| " + r.cert + " | " + r.task + " | " + r.state + " | " + r.primary + " | " + r.supporting +
    " | " + (r.sources.join(", ") || "-") + " | " + r.live + " | " + r.short + " |");
}
p("");
writeFileSync(join(ROOT, OUT), md.join("\n") + "\n", "utf8");

console.log("ISO TASK COVERAGE");
for (const code of ISO_CERTS) {
  const mine = rows.filter((r) => r.cert === code);
  console.log("  " + code.padEnd(9) + "tasks " + String(mine.length).padStart(3) +
    "   linked " + String(mine.filter((r) => r.state === "LINKED").length).padStart(3) +
    "   supporting-only " + String(mine.filter((r) => r.state === "SUPPORTING ONLY").length).padStart(3) +
    "   ZERO " + String(mine.filter((r) => r.state === "ZERO").length).padStart(3) +
    "   live EN " + String(mine.reduce((n, r) => n + r.live, 0)).padStart(4) +
    "   short of " + FLOOR + " " + String(mine.reduce((n, r) => n + r.short, 0)).padStart(4));
}
console.log("  wrote " + OUT);
