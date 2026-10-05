#!/usr/bin/env node
/**
 * propose-task-floors.mjs -- for every task still short of its floor, state its held count and WHY
 * it is short, so the director can rule on all of them in one pass.
 *
 * READ-ONLY. It proposes; it never writes a floor. Ruled PROMPT-132 s5.
 *
 * ============ THE THREE REASONS ARE NOT INTERCHANGEABLE ============
 *
 *   SATURATED     every under-cap primary already carries SATURATION_CAP live items certification-wide.
 *                 More generation cannot help: the passages are used up. The floor is the only lever.
 *   THIN MAP      fewer than MIN_EFFECTIVE keyable primaries. A MAP question -- the task was never
 *                 mapped to enough distinct passages to hold its floor.
 *   TRIPWIRE      the map has room and generation keeps failing on it. A WRITER question, and the
 *                 round history is the evidence.
 *   ROOM LEFT     neither: the task simply has not been generated for enough yet.
 *
 * Reporting one as another is the defect this separates: a saturated task looks like a thin map, and
 * "generate more" is the wrong answer to both for opposite reasons.
 *
 *   --cert <CODE>          required
 *   --saturation=<file>    the <CERT>-SATURATION.json written by gen-grounded-items --saturation-report
 *   --if-accepted=a,b      round artifacts whose SURVIVORS to count as if all were accepted
 *   --out=<file>           write the proposal
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadTaskFloors, floorFor } from "./lib/task-floors.mjs";
import { SATURATION_CAP } from "./lib/anchor-cap.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let CERT = null, SATFILE = null, OUT = null, IFACC = [];
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--cert=(.+)$/.exec(a))) { CERT = m[1]; continue; }
  if ((m = /^--saturation=(.+)$/.exec(a))) { SATFILE = m[1]; continue; }
  if ((m = /^--if-accepted=(.+)$/.exec(a))) { IFACC = m[1].split(",").map((s) => s.trim()).filter(Boolean); continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  console.error("unrecognised flag: " + a);
  console.error("  --cert=<CODE> --saturation=<file> [--if-accepted=a,b] [--out=<file>]   READ-ONLY");
  process.exit(2);
}
if (!CERT) { console.error("--cert is required"); process.exit(2); }
SATFILE = SATFILE || (CERT.replace(/[^A-Za-z0-9-]/g, "") + "-SATURATION.json");
if (!existsSync(join(ROOT, SATFILE))) {
  console.error("no " + SATFILE + ". Run gen-grounded-items --saturation-report first (free).");
  process.exit(2);
}
const sat = JSON.parse(readFileSync(join(ROOT, SATFILE), "utf8"));
const floors = loadTaskFloors(CERT);
const MIN_EFFECTIVE = 3;

/* survivors of a round, counted per task, as if every one were accepted. This is the "if R7's
 * survivors were all accepted" column the ruling asks for -- an UPPER BOUND, labelled as one. */
const wouldAdd = new Map();
for (const f of IFACC) {
  const j = JSON.parse(readFileSync(join(ROOT, f), "utf8"));
  for (const it of (j.items || [])) {
    if (it.verdict !== "survivor") continue;
    wouldAdd.set(it.task_code, (wouldAdd.get(it.task_code) || 0) + 1);
  }
}

const noAssignable = new Set(sat.tasks_with_no_assignable_anchor || []);
const rows = [];
for (const t of sat.tasks) {
  const f = floorFor(t.task, floors, t.eligible != null ? t.eligible : null);
  const floor = t.floor != null ? t.floor : (f && f.floor != null ? f.floor : null);
  const held = t.held;
  const addIfAll = wouldAdd.get(t.task) || 0;
  const after = held + addIfAll;
  const shortAfter = Math.max(0, (floor || 0) - after);
  if (!shortAfter) continue;                      /* not short once the round is counted */
  let why, proposal;
  if (noAssignable.has(t.task)) {
    why = "SATURATED -- every under-cap primary carries " + SATURATION_CAP + "+ live items (" +
      t.saturated.join(", ") + "). No assignable anchor; generation cannot close this.";
    proposal = after;
  } else if (t.effective == null) {
    /* COULD NOT ANSWER rather than a guess: the thin-map test needs the task's keyable primary count,
     * and a saturation file written before PROMPT-132 s5 does not carry it. */
    why = "CANNOT CLASSIFY -- the saturation file carries no `effective` count. Re-run " +
      "gen-grounded-items --saturation-report (free) and this task gets a real verdict.";
    proposal = null;
  } else if (t.effective < MIN_EFFECTIVE) {
    why = "THIN MAP -- " + t.effective + " keyable primary(ies) on this tier, under MIN_EFFECTIVE " +
      MIN_EFFECTIVE + ". A map question, not a generation one.";
    proposal = after;
  } else if (t.capacity <= shortAfter) {
    why = "CAPACITY BOUND -- " + t.capacity + " assignable slot(s) left against a shortfall of " +
      shortAfter + ". Mostly saturated: " + (t.saturated.length ? t.saturated.join(", ") : "none") + ".";
    proposal = after;
  } else {
    why = "ROOM LEFT -- " + t.capacity + " assignable slot(s) against a shortfall of " + shortAfter +
      ". Generation can still close this; a floor ruling is not forced.";
    proposal = null;
  }
  rows.push({ task: t.task, held, would_add_if_all_accepted: addIfAll, held_after: after,
    floor, short_after: shortAfter, assignable: t.assignable, capacity: t.capacity,
    saturated_primaries: t.saturated, why, proposed_floor: proposal });
}
rows.sort((a, b) => b.short_after - a.short_after || a.task.localeCompare(b.task, undefined, { numeric: true }));

console.log("FLOOR PROPOSALS   " + CERT + "   READ-ONLY, nothing is written to any floor file");
console.log("  saturation cap " + (sat.saturation_cap || SATURATION_CAP) + "   saturated anchors " +
  (sat.saturated || []).length + " of " + sat.anchors_in_use);
if (IFACC.length) console.log("  counting survivors of: " + IFACC.join(", ") + " AS IF ALL ACCEPTED (upper bound)");
console.log("  tasks still short after that: " + rows.length);
console.log("");
console.log("  task   held  +R7  after  floor  short  cap   proposal   why");
for (const r of rows) {
  console.log("  " + r.task.padEnd(6) + String(r.held).padStart(4) + String(r.would_add_if_all_accepted).padStart(5) +
    String(r.held_after).padStart(7) + String(r.floor).padStart(7) + String(r.short_after).padStart(7) +
    String(r.capacity).padStart(5) + "   " +
    (r.proposed_floor == null ? "(none)" : "floor -> " + r.proposed_floor).padEnd(11) + r.why.slice(0, 60));
}
console.log("");
const needRuling = rows.filter((r) => r.proposed_floor != null);
console.log("  PROPOSED FLOOR CHANGES: " + needRuling.length +
  "   NO RULING PROPOSED (room left): " + (rows.length - needRuling.length));
if (OUT) {
  writeFileSync(join(ROOT, OUT), JSON.stringify({ cert: CERT, read_only: true,
    saturation_cap: sat.saturation_cap || SATURATION_CAP, counted_as_accepted: IFACC,
    min_effective: MIN_EFFECTIVE, rows }, null, 1) + "\n");
  console.log("  wrote " + OUT + " -- a PROPOSAL. No floor file is touched.");
}
