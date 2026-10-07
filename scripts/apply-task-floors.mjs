/**
 * apply-task-floors.mjs -- set a certification's per-task floors to the counts it actually holds,
 * for tasks whose shortfall no further generation can close.
 *
 * WRITES the floors file with `--apply`; dry by default. Unknown flags exit 2. Ruled PROMPT-141 s4.
 *
 *   --cert <CODE>       required
 *   --ruled-in=<PROMPT> required. Stamped into every entry written.
 *   --min-held=<n>      a task holding FEWER than this is NOT given a floor, and is listed (default 2)
 *   --apply             write. Dry by default.
 *
 * ============ IT PROPOSES NOTHING OF ITS OWN ============
 *
 * The proposal comes from propose-task-floors.mjs, which refuses a stale census (PROMPT-141 s2). This
 * script only writes what that one proposed, and it re-runs it rather than reading a saved table: a
 * table on disk is a claim about a moment, and the floors it implies are a claim about now.
 *
 * A task holding fewer than --min-held gets NO floor. Ruled PROMPT-141 s4: "a task that still holds 0
 * gets no floor of 0. It goes into the handoff as a named coverage gap." A floor of 0 reads as a
 * satisfied requirement; an absent floor reads as an open question, which is what it is.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

let CERT = null, RULED = null, MIN_HELD = 2, APPLY = false, CLOSE_ROOM = false, m;
let SUPERSEDE = new Set();
let FROM_HELD = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  /* ============ --close-room-left: A CERTIFICATION CAN BE CLOSED WHILE ITS MAP STILL HAS ROOM ======
   *
   * A task with assignable slots left is NOT exhausted: more generation would work. Normally that is
   * a reason to leave its floor alone, because setting it to the held count records "this is all the
   * passages allow" when the truth is "we stopped asking". Ruled PROMPT-142 s3 for AIMS-IA, whose
   * last round was R4c -- so the floor is set and the reason says CLOSED, not exhausted. */
  if (a === "--close-room-left") { CLOSE_ROOM = true; continue; }
  /* --supersede=4.5,5.6 NAMES the earlier rulings this one replaces. Without it a task already ruled
   * at a different floor is reported as a CONFLICT and left alone: overwriting a recorded ruling
   * silently is how a record stops being one. Naming each task is the point -- there is no --force. */
  if ((m = /^--supersede=(.+)$/.exec(a))) {
    SUPERSEDE = new Set(m[1].split(",").map((s) => s.trim()).filter(Boolean)); continue;
  }
  if ((m = /^--cert=(.+)$/.exec(a))) { CERT = m[1]; continue; }
  if ((m = /^--ruled-in=(.+)$/.exec(a))) { RULED = m[1]; continue; }
  if ((m = /^--min-held=(\d+)$/.exec(a))) { MIN_HELD = Number(m[1]); continue; }
  /* ============ --from-held: FLOORS FOR A CERTIFICATION WITH NO TASK MAP (PROMPT-148 s1) ============
   *
   * The default path re-runs propose-task-floors, which needs a saturation census, which needs
   * `task_sources`. The Scrum family has ZERO task_sources rows, so that chain refuses -- correctly,
   * because there is no map to derive an effective-primary count from.
   *
   * With this flag the floor comes from what the bank ACTUALLY HOLDS: live, approved, secure rows per
   * task, counted per language and taken at the MINIMUM, which is the number verify-cert's own s8
   * check compares a floor against. No derivation, no census, no model. */
  if (a === "--from-held") { FROM_HELD = true; continue; }
  console.error("apply-task-floors: unrecognised flag " + a);
  console.error("This script opts into WRITING: --apply (dry by default). CLAUDE.md s15.");
  process.exitCode = 2; process.exit();
}
if (!CERT) { console.error("--cert is required"); process.exit(2); }
if (!RULED) {
  console.error("--ruled-in is required: a floor nobody ruled is an error, not a default.");
  process.exit(2);
}

const rows = [];
if (FROM_HELD) {
  /* ---- the floor comes from the BANK: live, approved, secure, per task, min across languages ---- */
  const { requireKey, getAll } = await import("./_pg.mjs");
  const { loadTaskFloors, floorFor } = await import("./lib/task-floors.mjs");
  const KEY = requireKey(HERE);
  const LANGS = ["en", "es-419", "pt-BR"];
  const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
  if (!cert) { console.error("no certification " + CERT); process.exit(2); }
  const doms = (await getAll(KEY, "domains?select=id,certification_id&order=id"))
    .filter((d) => d.certification_id === cert.id);
  const tasks = (await getAll(KEY, "tasks?select=id,code,domain_id,is_exam_scope&order=code"))
    .filter((t) => doms.some((d) => d.id === t.domain_id));
  const qs = await getAll(KEY, "quiz_questions?select=id,language,pool,status,retired_at,task_id" +
    "&certification_id=eq." + cert.id + "&order=id");
  const floorsNow = loadTaskFloors(CERT);
  let outOfScope = 0;
  for (const t of tasks) {
    /* OUT-OF-SCOPE TASKS ARE NOT GIVEN A FLOOR. verify-cert only checks in-scope tasks, and a floor
     * on a task the exam never draws from would be a claim about nothing. */
    if (!t.is_exam_scope) { outOfScope++; continue; }
    const per = LANGS.map((l) => qs.filter((q) => q.task_id === t.id && q.language === l &&
      q.pool === "secure" && q.retired_at === null && q.status === "approved").length);
    const held = Math.min(...per);
    const was = floorFor(t.code, floorsNow, null);
    rows.push({ code: t.code, held, floor: was && was.floor != null ? was.floor : null,
      short: Math.max(0, (was && was.floor != null ? was.floor : 0) - held),
      cap: 0, proposal: held, kind: "held count (no task map; --from-held)", per });
  }
  console.log("  --from-held: floors derived from the BANK, not from a census.");
  console.log("  " + rows.length + " exam-scope task(s); " + outOfScope + " out of scope and skipped.");
  if (!rows.length) { console.error("no exam-scope task has a count -- refusing"); process.exit(2); }
} else {
  /* ---- the proposal, from the one instrument that makes it ---- */
  let out;
  try {
    out = execFileSync(process.execPath, ["--dns-result-order=ipv4first",
      join(HERE, "propose-task-floors.mjs"), "--cert=" + CERT],
      { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 24 });
  } catch (e) {
    console.error("propose-task-floors REFUSED, so there is nothing to apply. Its reason:");
    console.error((e.stderr || e.stdout || String(e.message)).trim());
    process.exitCode = 2; process.exit();
  }
  for (const line of out.split(/\r?\n/)) {
    const mm = /^ {2}(\d+\.\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(floor -> \d+|\(none\))\s+(.*)$/.exec(line);
    if (!mm) continue;
    const why = mm[9].trim();
    rows.push({ code: mm[1], held: +mm[2], floor: +mm[5], short: +mm[6], cap: +mm[7],
      proposal: mm[8].startsWith("floor") ? +mm[8].replace(/\D+/g, "") : null,
      kind: /SATURATED/.test(why) ? "exhausted" : /CAPACITY BOUND/.test(why) ? "capacity-bound"
        : /THIN MAP/.test(why) ? "thin map" : /TRIPWIRE/.test(why) ? "tripwire" : "room left" });
  }
  if (!rows.length) { console.error("parsed no rows from propose-task-floors -- refusing"); process.exit(2); }
}

/* with --close-room-left a room-left task is treated as proposing its own held count */
for (const r of rows) if (CLOSE_ROOM && r.proposal === null) r.proposal = r.held;
const toSet = rows.filter((r) => r.proposal !== null && r.held >= MIN_HELD);
const withheld = rows.filter((r) => r.proposal !== null && r.held < MIN_HELD);
const roomLeft = rows.filter((r) => r.proposal === null);

console.log("APPLY TASK FLOORS   " + CERT + (APPLY ? "   --apply" : "   dry run (default)"));
console.log("  proposal parsed    " + rows.length + " short task(s)");
console.log("");
console.log("  task   old floor   held   new floor   short by   why");
for (const r of toSet.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))) {
  console.log("  " + r.code.padEnd(7) + String(r.floor).padStart(9) + String(r.held).padStart(7) +
    String(r.proposal).padStart(12) + String(r.short).padStart(11) + "   " + r.kind);
}
console.log("");
console.log("  NOT GIVEN A FLOOR, holding fewer than " + MIN_HELD + ":  " + withheld.length);
for (const r of withheld) {
  console.log("    " + r.code + " holds " + r.held + "   " + r.kind +
    "   -- a named coverage gap, not a floor of " + r.held);
}
console.log("  LEFT ALONE, map room still available:  " + roomLeft.length +
  (roomLeft.length ? "   " + roomLeft.map((r) => r.code).join(", ") : ""));

const FP = join(ROOT, "TASK-FLOORS-" + CERT.replace(/[^A-Za-z0-9]/g, "") + ".json");
if (!existsSync(FP)) { console.error("no " + FP.split(/[\\/]/).pop()); process.exit(2); }
const doc = JSON.parse(readFileSync(FP, "utf8"));
doc.per_task_overrides = doc.per_task_overrides || {};

/* a floor already ruled at the same value is not rewritten; a DIFFERENT ruled value is reported and
 * left alone, because overwriting someone's ruling silently is how a record stops being one */
const wrote = [], same = [], conflict = [], superseded = [];
for (const r of toSet) {
  const prev = doc.per_task_overrides[r.code];
  if (prev && prev.floor === r.proposal) { same.push(r.code); continue; }
  if (prev && prev.floor !== r.proposal) {
    if (!SUPERSEDE.has(r.code)) {
      conflict.push(r.code + ": ruled " + prev.floor + " in " + (prev.ruled_in || "?") +
        ", proposal says " + r.proposal + "   -- pass --supersede=" + r.code + " to replace it");
      continue;
    }
    superseded.push(r.code + ": " + prev.floor + " (" + (prev.ruled_in || "?") + ") -> " + r.proposal);
    r.supersedes = { floor: prev.floor, ruled_in: prev.ruled_in || null };
  }
  wrote.push(r);
}
console.log("");
console.log("  would write " + wrote.length + "   already at that floor " + same.length +
  "   CONFLICT with an existing ruling " + conflict.length);
for (const c of conflict) console.log("    " + c);

if (!APPLY) {
  console.log("");
  console.log("DRY RUN. Nothing written. Re-run with --apply.");
  process.exitCode = 0;
} else {
  for (const r of wrote) {
    doc.per_task_overrides[r.code] = {
      floor: r.proposal, ruled_in: RULED, temporary: false, held_at_ruling: r.held,
      ...(r.supersedes ? { supersedes: r.supersedes } : {}),
      reason: (r.kind === "exhausted"
        ? "NO ASSIGNABLE ANCHOR: every under-cap primary is saturated certification-wide, so no " +
          "further round can add to this task. "
        : r.kind === "capacity-bound"
          ? "CAPACITY BOUND: " + r.cap + " assignable slot(s) left against a shortfall of " + r.short + ". "
          : r.kind === "thin map"
            ? "THIN MAP: fewer keyable primaries on this tier than MIN_EFFECTIVE. "
            : r.kind === "room left"
              ? "NOT EXHAUSTED: " + r.cap + " assignable slot(s) remain and more generation would " +
                "work. The CERTIFICATION is closed -- its last round was the one ruled in " + RULED +
                " -- so the floor records what it holds, not what the map allows. "
              : "") +
        /* `--ruled-in` carries the section already; a hardcoded " s4" here was left over from
         * PROMPT-141 s4 and stamped "PROMPT-148 s4" onto 52 PROMPT-148 s1 rulings. */
        "Floor set to the held count of " + r.held +
        (r.floor == null ? " (no floor was set before)" : " (was " + r.floor + ")") +
        ", ruled " + RULED + ".",
    };
  }
  writeFileSync(FP, JSON.stringify(doc, null, 1) + "\n");
  console.log("");
  console.log("  wrote " + wrote.length + " floor(s) into " + FP.split(/[\\/]/).pop());

  /* READ BACK from the file, not from memory */
  const after = JSON.parse(readFileSync(FP, "utf8")).per_task_overrides || {};
  let bad = 0;
  for (const r of wrote) {
    const got = after[r.code];
    if (!got || got.floor !== r.proposal || got.ruled_in !== RULED) {
      console.error("    READ BACK FAILED " + r.code + ": " + JSON.stringify(got));
      bad++;
    }
  }
  console.log("  read back: " + (wrote.length - bad) + " of " + wrote.length + " correct" +
    (bad ? "   " + bad + " WRONG" : ""));
  if (bad) process.exitCode = 2;
}
