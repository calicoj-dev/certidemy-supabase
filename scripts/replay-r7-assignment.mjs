#!/usr/bin/env node
/**
 * replay-r7-assignment.mjs -- the POSITIVE CONTROL for PROMPT-133 s4.
 *
 * READ-ONLY, no model call, no row. Replays R7's anchor assignment over the certification census AS
 * IT STOOD BEFORE R7, once WITHOUT the running tally and once WITH it, and reports how many times
 * each anchor was handed out.
 *
 * ISO 19011 3.9 held 2 live at assignment time and R7 put four survivors on it across tasks 3.1,
 * 3.3 and 3.6 -- three of the nine judge flags. With the tally it must be handed out AT MOST ONCE.
 *
 * The census-before-R7 is reconstructed by SUBTRACTING R7's own survivors from today's live count,
 * which is honest arithmetic over recorded artifacts rather than a remembered number.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assignAnchors } from "./lib/anchor-assignment.mjs";
import { anchorKey, SATURATION_CAP, CAP } from "./lib/anchor-cap.mjs";
import { requireKey, getAll } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const a of process.argv.slice(2)) {
  console.error("unrecognised flag: " + a + ". This script takes none and is READ-ONLY.");
  process.exit(2);
}

const KEY = requireKey(HERE);
const cert = (await getAll(KEY, "certifications?select=id&code=eq.ISMS-IA"))[0];
const tasks = await getAll(KEY, "tasks?select=id,code&order=code");
const codeOf = new Map(tasks.map((t) => [t.id, t.code]));
const qs = await getAll(KEY, "quiz_questions?select=id,task_id&certification_id=eq." + cert.id +
  "&language=eq.en&retired_at=is.null&order=id");
const taskOfQ = new Map(qs.map((q) => [q.id, codeOf.get(q.task_id)]));
const gr = await getAll(KEY, "item_grounding?select=question_id,source_id,edition," +
  "key_support_clause,review_verdict&order=question_id");

/* TODAY's certification-wide census, counted exactly as the generator counts it. */
const liveNow = new Map();
const perTaskNow = new Map();
for (const g of gr) {
  const t = taskOfQ.get(g.question_id);
  if (!t) continue;                                  /* not an ISMS-IA live row */
  if (g.review_verdict === "reject") continue;
  if (!g.source_id || !g.key_support_clause) continue;
  const k = anchorKey(g.source_id, g.edition, g.key_support_clause);
  liveNow.set(k, (liveNow.get(k) || 0) + 1);
  if (!perTaskNow.has(t)) perTaskNow.set(t, new Map());
  const m = perTaskNow.get(t);
  m.set(k, (m.get(k) || 0) + 1);
}

/* SUBTRACT R7's accepted rows to get the census as it stood when R7 was assigned. R7's rejected
 * survivors were never inserted, so only the accepts are in liveNow. */
const accepted = new Set();
for (const f of ["ACCEPT-ISMSIA-R7-opus.json", "ACCEPT-ISMSIA-R7-sonnet.json"]) {
  for (const a of JSON.parse(readFileSync(join(ROOT, f), "utf8")).accepts) accepted.add(a.item_id);
}
const asked = new Map();           /* task -> how many R7 asked for */
const before = new Map(liveNow);
const perTaskBefore = new Map([...perTaskNow].map(([t, m]) => [t, new Map(m)]));
let subtracted = 0;
for (const f of ["ISMSIA-R7-opus.json", "ISMSIA-R7-sonnet.json"]) {
  const j = JSON.parse(readFileSync(join(ROOT, f), "utf8"));
  for (const it of j.items) {
    asked.set(it.task_code, (asked.get(it.task_code) || 0) + 1);
    if (it.verdict !== "survivor" || !accepted.has(it.item_id)) continue;
    const o = it.item || {};
    const k = anchorKey(o.source_id, o.edition, o.key_support_clause);
    before.set(k, Math.max(0, (before.get(k) || 0) - 1));
    if (before.get(k) === 0) before.delete(k);
    const m = perTaskBefore.get(it.task_code);
    if (m && m.get(k)) { m.set(k, m.get(k) - 1); if (!m.get(k)) m.delete(k); }
    subtracted++;
  }
}

/* The task's primaries, taken from what R7 ACTUALLY assigned plus what it was shown -- the artifact
 * records the assigned clause per item, which is the set the replay needs. */
const primsOf = new Map();
for (const f of ["ISMSIA-R7-opus.json", "ISMSIA-R7-sonnet.json"]) {
  const j = JSON.parse(readFileSync(join(ROOT, f), "utf8"));
  for (const it of j.items) {
    const a = it.assigned;
    if (!a || !a.clause) continue;
    if (!primsOf.has(it.task_code)) primsOf.set(it.task_code, new Map());
    primsOf.get(it.task_code).set(anchorKey(a.source_id, a.edition, a.clause),
      { source_id: a.source_id, edition: a.edition, clause: a.clause });
    /* `allowed` names every under-cap primary the task had when the ask repeated */
    for (const c of (a.allowed || [])) {
      const kk = anchorKey(a.source_id, a.edition, c);
      if (!primsOf.get(it.task_code).has(kk)) {
        primsOf.get(it.task_code).set(kk, { source_id: a.source_id, edition: a.edition, clause: c });
      }
    }
  }
}

const run = (withTally) => {
  const tally = withTally ? new Map() : null;
  const handed = new Map();
  for (const [task, prims] of [...primsOf].sort((a, b) =>
    a[0].localeCompare(b[0], undefined, { numeric: true }))) {
    const r = assignAnchors({ taskCode: task, runId: "R7-replay",
      primaries: [...prims.values()], censusMap: perTaskBefore.get(task) || new Map(),
      want: asked.get(task) || 1, cap: CAP, certCensus: before, runTally: tally });
    for (const a of r.assignments) {
      const k = anchorKey(a.source_id, a.edition, a.clause);
      if (!handed.has(k)) handed.set(k, []);
      handed.get(k).push(task);
    }
  }
  return handed;
};

const without = run(false);
const with_ = run(true);
const K39 = anchorKey("ISO 19011", "2026", "3.9");
const show = (m) => (m.get(K39) || []).length + (m.get(K39) ? "  (" + m.get(K39).join(", ") + ")" : "");

console.log("REPLAY OF R7's ASSIGNMENT   positive control for PROMPT-133 s4   READ-ONLY");
console.log("  census reconstructed by subtracting " + subtracted + " accepted R7 row(s) from today's live count");
console.log("  ISO 19011 3.9 held BEFORE R7: " + (before.get(K39) || 0) +
  "   saturation cap " + SATURATION_CAP);
console.log("");
console.log("  ISO 19011 3.9 handed out WITHOUT the running tally: " + show(without));
console.log("  ISO 19011 3.9 handed out WITH    the running tally: " + show(with_));
console.log("");
const overWithout = [...without.entries()].filter(([k, v]) => (before.get(k) || 0) + v.length > SATURATION_CAP);
const overWith = [...with_.entries()].filter(([k, v]) => (before.get(k) || 0) + v.length > SATURATION_CAP);
console.log("  anchors pushed OVER the cap, without the tally: " + overWithout.length);
for (const [k, v] of overWithout) {
  console.log("      " + k.replace(/\|/g, ":") + "   " + (before.get(k) || 0) + " live + " +
    v.length + " assigned = " + ((before.get(k) || 0) + v.length) + "   tasks " + v.join(", "));
}
console.log("  anchors pushed OVER the cap, WITH the tally:    " + overWith.length + "   (must be 0)");
for (const [k, v] of overWith) {
  console.log("      " + k.replace(/\|/g, ":") + "   " + (before.get(k) || 0) + " live + " + v.length);
}
const n39 = (with_.get(K39) || []).length;
const ok39 = n39 <= 1;
console.log("");
console.log("  ISO 19011 3.9 handed out at most ONCE with the tally: " + (ok39 ? "yes" : "NO -- " + n39));
console.log("  " + (ok39 && !overWith.length
  ? "POSITIVE CONTROL PASSES: the defect reproduces without the fix and does not with it."
  : "POSITIVE CONTROL FAILED -- reported, not explained away."));
if (!ok39 || overWith.length) process.exitCode = 1;
