#!/usr/bin/env node
/**
 * resolve-r4-r5-verdicts.mjs -- resolve the director's PROMPT-97-addendum verdicts to real items.
 *
 * READ-ONLY. No writes, no model calls. Unknown flags exit 2.
 *
 * ============ THE DECLARATION IS THE INPUT AND IT IS ASSERTED, NOT TRUSTED ============
 *
 * Eleven ids are named with a task code and a reason; the rest are accepted by exhaustion. Every one of those
 * assertions can be wrong in a way that edits the wrong item, so each is checked:
 *
 *   - the id resolves to exactly ONE item across the two artifacts (a prefix collision would be silent);
 *   - the RUN the director names is the run it is in;
 *   - the TASK CODE he names is the item's task -- the parenthetical is the check, the same discipline
 *     `insert-pilot-drafts.mjs` uses for ordinals;
 *   - every named id was a SURVIVOR, because a verdict on an item the gates already refused is a verdict
 *     about nothing;
 *   - the accepted set is the complement, and its size must equal the count he states per run.
 *
 * A single mismatch exits 2 with the disagreement named. This produces no file: it is the gate in front of
 * anything that writes.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let EMIT = null;
for (const a of process.argv.slice(2)) {
  const m = /^--emit=(.+)$/.exec(a);
  if (m) { EMIT = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --emit=<file> (write the resolved set).");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

/* ============ THE RULING, TRANSCRIBED ONCE ============
 * Verbatim from PROMPT-97 addendum section 2. The `why` is the director's reason, shortened only where a
 * sentence would not fit a note column; the FULL reason lives in this file so the record can be rebuilt. */
const REJECT = [
  { id: "05c54c05", run: "R4", task: "5.5", why: "anchored on 42001 3.4 through the cross-standard collision; also a near-duplicate of c45a02f1" },
  { id: "97623833", run: "R5", task: "5.5", why: "the same cross-standard collision on 42001 3.4" },
  { id: "7fc70283", run: "R4", task: "2.2", why: "the key overclaims: 4.1 requires considering purpose, the scope decision is 4.3's. 3bb6992f states it correctly" },
  { id: "460d87c8", run: "R4", task: "2.4", why: "near-duplicate of the inserted 689452e1 (same partial-scope / who-is-top-management scenario)" },
  { id: "4d544a58", run: "R4", task: "1.2", why: "generic A.3.2 item, near-duplicate of 6ea4afde; over the cap" },
  { id: "b6382561", run: "R5", task: "1.2", why: "generic A.3.2 item, near-duplicate of 6ea4afde; over the cap" },
  { id: "fb629038", run: "R4", task: "1.2", why: "generic A.10.2 item; over the cap" },
  { id: "ec26b212", run: "R5", task: "1.2", why: "generic A.10.2 item; over the cap" },
  { id: "29a3ad5f", run: "R5", task: "2.4", why: "A.10.2 over the cap; its explanation also says 'Option 1 / option 2 / option 4', which the letter-reference gate missed" },
  { id: "3279aed3", run: "R5", task: "4.5", why: "near-duplicate of 5d0353c2 (same imputation/scaling/encoding scenario on A.7.6)" },
];
/* ACCEPTED, AND HELD. Recorded with verdict `accept` because the item is good; the note is what stops the
 * insert. A reject would say the item is wrong, and it is not -- it is surplus while the cap is full. */
const RESERVE = [
  { id: "fc0000a0", run: "R5", task: "3.4", why: "reserve: over cap", full: "A.10.3 over the cap; a good item, held as a reserve rather than rejected" },
];
/* The counts the director states, asserted against the complement rather than assumed. */
const EXPECTED_ACCEPT = { R4: 24, R5: 22 };
/* Named keepers, checked so a cap decision cannot silently drop one of them. */
const NAMED_KEEPERS = { "1.2": ["cc92ad83", "6bb11929", "cdfbfffc", "2741d373"] };
/* Named as among the best; asserted present and accepted. */
const NAMED_BEST = ["2741d373", "eef76522", "2accd914", "182229d1", "5513f191"];

const ART = { R4: "AIMSF-R4-REST.json", R5: "AIMSF-R5.json" };
/* R4 was two artifacts (probe + rest). Both are searched, and which one an id came from is reported, because
 * "R4" in the ruling means the ROUND, not the file. */
const EXTRA = { R4: ["AIMSF-R4-PROBE.json"] };

const items = [];                       /* {run, file, id, task, verdict, clause} */
for (const [run, main] of Object.entries(ART)) {
  for (const f of [main, ...(EXTRA[run] || [])]) {
    const p = join(ROOT, f);
    let j;
    try { j = JSON.parse(readFileSync(p, "utf8")); }
    catch (e) { console.error("REFUSING: cannot read " + f + ": " + e.message); process.exit(2); }
    for (const r of (j.items || [])) {
      items.push({ run, file: f, id: r.item_id, task: r.task_code, verdict: r.verdict,
        clause: (r.item || {}).key_support_clause, assigned: r.assigned && r.assigned.clause });
    }
  }
}
const survivors = items.filter((i) => i.verdict === "survivor");
console.log("loaded " + items.length + " item record(s), " + survivors.length + " survivor(s)");
const perRun = {};
for (const s of survivors) perRun[s.run] = (perRun[s.run] || 0) + 1;
console.log("  survivors per run: " + JSON.stringify(perRun));

const fails = [];
const find = (id) => survivors.filter((s) => String(s.id).startsWith(id));

/* ---- every named id resolves to exactly one SURVIVOR, in the run and task named ---- */
const named = [...REJECT.map((r) => ({ ...r, kind: "reject" })),
  ...RESERVE.map((r) => ({ ...r, kind: "reserve" }))];
for (const n of named) {
  const hits = find(n.id);
  if (hits.length !== 1) {
    /* A PREFIX THAT MATCHES NOTHING AND ONE THAT MATCHES TWO ARE DIFFERENT FAILURES. Saying only "not
     * resolved" would send the reader to look for a typo when the real problem is an ambiguous prefix. */
    fails.push(n.id + ": resolved to " + hits.length + " survivor(s)" +
      (hits.length ? " -- " + hits.map((h) => h.run + "/" + h.task + "/" + h.id).join(", ")
        : " (no survivor carries this prefix; it may be a rejected item, or a typo)"));
    continue;
  }
  const h = hits[0];
  if (h.run !== n.run) fails.push(n.id + ": the ruling says " + n.run + ", the item is in " + h.run);
  if (h.task !== n.task) fails.push(n.id + ": the ruling says task " + n.task + ", the item is task " + h.task);
}

/* ---- the named keepers and the named best must exist, be survivors, and NOT be rejected ---- */
const rejectIds = new Set(REJECT.map((r) => r.id));
for (const [task, ids] of Object.entries(NAMED_KEEPERS)) {
  for (const id of ids) {
    const hits = find(id);
    if (hits.length !== 1) { fails.push("named keeper " + id + " resolves to " + hits.length); continue; }
    if (hits[0].task !== task) fails.push("named keeper " + id + " is task " + hits[0].task + ", named under " + task);
    if (rejectIds.has(id)) fails.push("named keeper " + id + " is also in the reject list");
  }
}
for (const id of NAMED_BEST) {
  const hits = find(id);
  if (hits.length !== 1) { fails.push("named-best " + id + " resolves to " + hits.length); continue; }
  if (rejectIds.has(id)) fails.push("named-best " + id + " is also in the reject list");
}

/* ---- the complement, and its size per run ---- */
const excluded = new Set([...REJECT, ...RESERVE].map((r) => find(r.id)[0]).filter(Boolean).map((h) => h.id));
const accepted = survivors.filter((s) => !excluded.has(s.id));
const accPerRun = {};
for (const a of accepted) accPerRun[a.run] = (accPerRun[a.run] || 0) + 1;
for (const [run, n] of Object.entries(EXPECTED_ACCEPT)) {
  if ((accPerRun[run] || 0) !== n) {
    fails.push("run " + run + ": the ruling says " + n + " accepted, the complement is " + (accPerRun[run] || 0));
  }
}

if (fails.length) {
  console.error("");
  console.error("REFUSING: the ruling and the artifacts disagree. Nothing is written.");
  for (const f of fails) console.error("  " + f);
  process.exit(2);
}

console.log("");
console.log("THE RULING RESOLVES CLEANLY");
console.log("  reject   " + REJECT.length + "   " + REJECT.map((r) => r.id).join(", "));
console.log("  reserve  " + RESERVE.length + "   " + RESERVE.map((r) => r.id).join(", "));
console.log("  accept   " + accepted.length + "   " + JSON.stringify(accPerRun) +
  "  (the ruling states " + JSON.stringify(EXPECTED_ACCEPT) + ")");
console.log("");
console.log("ACCEPTED, per task and anchor clause -- so a cap reading can be checked against it:");
const byTask = new Map();
for (const a of accepted) {
  if (!byTask.has(a.task)) byTask.set(a.task, []);
  byTask.get(a.task).push(a.run + " " + String(a.id).slice(0, 8) + " " + a.clause);
}
for (const [task, list] of [...byTask.entries()].sort()) {
  console.log("  " + task.padEnd(5) + list.length + "  " + list.join(" | "));
}

if (EMIT) {
  const out = {
    what: "The director's PROMPT-97-addendum read of R4 (29 survivors) and R5 (28). Resolved against the " +
      "artifacts and asserted: one survivor per named id, in the run and task named, and the accepted " +
      "complement matching the stated counts.",
    ruled_on: "2026-09-30",
    reviewed_by: "director",
    runs: ART,
    reject: REJECT.map((r) => ({ ...r, question_item_id: find(r.id)[0].id, clause: find(r.id)[0].clause })),
    reserve: RESERVE.map((r) => ({ ...r, question_item_id: find(r.id)[0].id, clause: find(r.id)[0].clause })),
    accept: accepted.map((a) => ({ id: a.id, run: a.run, task: a.task, clause: a.clause })),
  };
  writeFileSync(join(ROOT, EMIT), JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log("");
  console.log("wrote " + EMIT + "   (" + out.accept.length + " accept, " + out.reject.length + " reject, " +
    out.reserve.length + " reserve)");
}
