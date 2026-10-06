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
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadTaskFloors, floorFor } from "./lib/task-floors.mjs";
import { SATURATION_CAP } from "./lib/anchor-cap.mjs";
import { censusIsStale } from "./lib/census-freshness.mjs";
import { requireKey, getAll } from "./_pg.mjs";

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
let LIVE_HELD = new Map();
const HELD_DIVERGED = [];
const sat = JSON.parse(readFileSync(join(ROOT, SATFILE), "utf8"));

/* ============ REFUSE A CENSUS OLDER THAN THE BANK IT DESCRIBES (PROMPT-141 s2) ============
 *
 * PROMPT-140: this script read a census written before any grounded insert, so every task read held 0
 * and it proposed a floor of 0 for 15 tasks. The table was plausible and entirely wrong. */
{
  const KEY = requireKey(join(ROOT, "scripts"));
  const certRow = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
  if (!certRow) { console.error("no certification " + CERT); process.exit(2); }
  const qs = await getAll(KEY, "quiz_questions?select=id&certification_id=eq." + certRow.id +
    "&language=eq.en&item_origin=eq.grounded&order=id");
  const ids = new Set(qs.map((q) => q.id));
  const gr = await getAll(KEY, "item_grounding?select=question_id,created_at,review_verdict&order=question_id");
  let latest = null;
  for (const g of gr) {
    if (!ids.has(g.question_id) || !g.created_at) continue;
    if (latest == null || g.created_at > latest) latest = g.created_at;
  }
  /* the census's own claim first; its mtime only as a fallback for a file written before
   * `generated_at` existed, and labelled as such */
  const stamped = sat.generated_at || null;
  const censusAt = stamped || statSync(join(ROOT, SATFILE)).mtime.toISOString();
  const stale = censusIsStale({ censusAt, latestInsertAt: latest });
  const how = stamped ? "generated_at" : "file mtime (this census predates `generated_at`)";
  if (stale === true) {
    console.error("REFUSING: " + SATFILE + " is older than this certification's most recent grounded");
    console.error("insert, so its held counts are stale and every number below would be wrong.");
    console.error("");
    console.error("  census built    " + censusAt + "   [" + how + "]");
    console.error("  latest insert   " + latest);
    console.error("");
    console.error("PROMPT-140 read a census from before any insert and proposed a floor of 0 for 15");
    console.error("tasks. Refresh it, free, then re-run:");
    console.error("");
    console.error("    node --dns-result-order=ipv4first scripts/gen-grounded-items.mjs --cert=" +
      CERT + " --saturation-report --max-usd=0");
    process.exit(2);
  }
  console.log("  census freshness  built " + censusAt + "  [" + how + "]");
  console.log("                    latest grounded insert " + (latest || "(none)") +
    "   -> " + (stale === false ? "FRESH" : "COULD NOT ANSWER (a timestamp is missing; not treated as fresh)"));

  /* ============ A FLOOR RESTS ON THE BANK, NOT ON PENDING SURVIVORS (PROMPT-141 s4) ============
   *
   * The census's `held` deliberately includes the AWAITING layer -- survivors sitting in an artifact
   * before the director reads them -- because the anchor cap is a property of a FORM and must count
   * everything that will sit on one (lib/anchor-cap-census.mjs). For a FLOOR that is the wrong
   * number: measured PROMPT-141, task 5.6 read held 1 on the strength of one R4b survivor nobody had
   * ruled on, while the bank held 0. A floor set from an item that may yet be rejected is a floor
   * resting on a guess. So held is re-read here from accepted, approved, live grounded rows. */
  const tasksAll = await getAll(KEY, "tasks?select=id,code,domain_id&order=id");
  const domsAll = await getAll(KEY, "domains?select=id,certification_id&order=id");
  const mineDom = new Set(domsAll.filter((d) => d.certification_id === certRow.id).map((d) => d.id));
  const codeOfTask = new Map(tasksAll.filter((t) => mineDom.has(t.domain_id)).map((t) => [t.id, t.code]));
  const qsFull = await getAll(KEY, "quiz_questions?select=id,task_id,status,retired_at" +
    "&certification_id=eq." + certRow.id + "&language=eq.en&item_origin=eq.grounded&order=id");
  const accepted = new Set(gr.filter((g) => g.review_verdict === "accept").map((g) => g.question_id));
  LIVE_HELD = new Map();
  for (const q of qsFull) {
    if (q.retired_at !== null || q.status !== "approved" || !accepted.has(q.id)) continue;
    const code = codeOfTask.get(q.task_id);
    if (!code) continue;
    LIVE_HELD.set(code, (LIVE_HELD.get(code) || 0) + 1);
  }
}

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
  /* the BANK's count, not the census's (which includes undisposed survivors) -- PROMPT-141 s4 */
  const held = LIVE_HELD.has(t.task) ? LIVE_HELD.get(t.task) : 0;
  if (held !== t.held) HELD_DIVERGED.push(t.task + ": bank " + held + ", census " + t.held);
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
if (HELD_DIVERGED.length) {
  console.log("");
  console.log("  HELD COUNTS: bank vs census -- " + HELD_DIVERGED.length + " task(s) differ.");
  console.log("  The census counts survivors AWAITING a read; a floor counts only what the bank holds.");
  for (const d of HELD_DIVERGED) console.log("    " + d);
}
console.log("  PROPOSED FLOOR CHANGES: " + needRuling.length +
  "   NO RULING PROPOSED (room left): " + (rows.length - needRuling.length));
if (OUT) {
  writeFileSync(join(ROOT, OUT), JSON.stringify({ cert: CERT, read_only: true,
    saturation_cap: sat.saturation_cap || SATURATION_CAP, counted_as_accepted: IFACC,
    min_effective: MIN_EFFECTIVE, rows }, null, 1) + "\n");
  console.log("  wrote " + OUT + " -- a PROPOSAL. No floor file is touched.");
}
