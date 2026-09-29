#!/usr/bin/env node
/**
 * promote-13-lifecycle-controls.mjs -- promote 42001 A.6.2.2 to A.6.2.8 to PRIMARY on AIMS-F task 1.3.
 *
 * `--apply` to write, DRY BY DEFAULT, unknown flags exit 2.
 *
 * Ruled PROMPT-86 section 1. All seven were judged in scope and printed with their clause text first --
 * TASK-13-SCOPE-VERDICTS.md -- and this script REFUSES to promote a clause the verdict file does not list,
 * so the ruling and the write cannot drift apart.
 *
 * WHY: 1.3 is about the AI system life cycle and the requirement text sits in these controls. Leaving them
 * supporting is why all four pilot survivors fell back to one 26-word Annex C sentence.
 *
 * WHAT STAYS PUT, and both are deliberate:
 *   B.6.2.2-B.6.2.8 stay SUPPORTING -- implementation guidance for these controls. An item anchors on the
 *     control text; the guidance feeds the explanation and the distractors. This also stops `should`
 *     guidance being keyed as a requirement.
 *   C.3.6 stays PRIMARY -- limited by the within-task anchor cap rather than by demotion.
 *
 * The rows already exist as `supporting`, so this is an UPDATE of role, not an insert. Each PATCH is
 * scoped to one (task, passage) pair and asserted to touch exactly one row.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";

let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply (dry by default; `--dry` is not a flag here).");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const ADDED_BY = "director-86";
const TASK = "1.3";

/* the ruling's own list, read from the verdict file rather than retyped */
const verdicts = JSON.parse(readFileSync(join(ROOT, "TASK-13-SCOPE-VERDICTS.json"), "utf8"));
const WANT = verdicts.promote;
const RULED = ["A.6.2.2", "A.6.2.3", "A.6.2.4", "A.6.2.5", "A.6.2.6", "A.6.2.7", "A.6.2.8"];
if (WANT.join(",") !== RULED.join(",")) {
  console.error("ABORT: the verdict file's promote list is " + JSON.stringify(WANT) +
    " and the ruling names " + JSON.stringify(RULED) + ". A write that disagrees with the printed");
  console.error("verdicts is a write nobody reviewed.");
  process.exit(2);
}
console.log("promoting " + WANT.length + " clause(s) from the printed verdicts: " + WANT.join(" "));

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F");
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code,statement&order=code"))
  .filter((t) => t.certification_id === certs[0].id);
const task = tasks.find((t) => t.code === TASK);
const sp = await getAll(KEY, "source_passages?select=id,source_id,edition,clause,title&order=id");
const before = await getAll(KEY,
  "task_sources?select=task_id,passage_id,role,added_by&order=task_id,passage_id");
const mine = before.filter((r) => r.task_id === task.id);
const byPair = new Map(mine.map((r) => [r.passage_id, r]));

const plan = [];
for (const c of WANT) {
  const hits = sp.filter((x) => x.source_id === "ISO/IEC 42001" && x.clause === c);
  if (hits.length !== 1) {
    console.error("ABORT: " + c + " resolved to " + hits.length + " passages; an ambiguous address is not a link.");
    process.exit(2);
  }
  const pas = hits[0];
  const live = byPair.get(pas.id);
  if (!live) {
    plan.push({ clause: c, passage_id: pas.id, action: "insert", from: "(not linked)" });
  } else if (live.role === "primary") {
    plan.push({ clause: c, passage_id: pas.id, action: "already primary", from: live.role });
  } else {
    plan.push({ clause: c, passage_id: pas.id, action: "promote", from: live.role, tag: live.added_by });
  }
}
console.log("");
for (const r of plan) {
  console.log("  " + r.clause.padEnd(9) + r.action.padEnd(16) + "from " + r.from +
    (r.tag ? "   (tagged " + r.tag + ")" : ""));
}
const toPatch = plan.filter((r) => r.action === "promote");
const toInsert = plan.filter((r) => r.action === "insert");
console.log("\npromote " + toPatch.length + ", insert " + toInsert.length + ", already primary " +
  plan.filter((r) => r.action === "already primary").length);

/* what the map becomes, so the number the generator will use is visible before the write */
const primBefore = mine.filter((r) => r.role === "primary").length;
console.log("1.3 primary rows: " + primBefore + " -> " + (primBefore + toPatch.length + toInsert.length));

if (!APPLY) {
  console.log("\nDRY RUN -- nothing written. Re-run with --apply.");
} else {
  let n = 0;
  for (const r of toPatch) {
    const res = await fetch(REST_URL + "/task_sources?task_id=eq." + task.id +
      "&passage_id=eq." + r.passage_id, {
      method: "PATCH",
      headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json",
        Prefer: "return=representation" },
      body: JSON.stringify({ role: "primary", added_by: ADDED_BY }),
    });
    if (!res.ok) throw new Error("patch failed on " + r.clause + ": " + res.status + " " + (await res.text()));
    const got = await res.json();
    if (got.length !== 1) throw new Error("patch touched " + got.length + " rows on " + r.clause);
    n++;
  }
  for (const r of toInsert) {
    const res = await fetch(REST_URL + "/task_sources", {
      method: "POST",
      headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json",
        Prefer: "return=representation" },
      body: JSON.stringify([{ task_id: task.id, passage_id: r.passage_id, role: "primary",
        added_by: ADDED_BY }]),
    });
    if (!res.ok) throw new Error("insert failed on " + r.clause + ": " + res.status + " " + (await res.text()));
    n++;
  }
  console.log("\nwrote " + n + " row(s)");

  /* ---- read back, BOTH DIRECTIONS ---- */
  const after = await getAll(KEY,
    "task_sources?select=task_id,passage_id,role,added_by&order=task_id,passage_id");
  const afterMine = after.filter((r) => r.task_id === task.id);
  const afterByPair = new Map(afterMine.map((r) => [r.passage_id, r]));
  let fails = 0;
  const ok = (what, cond, detail) => {
    console.log((cond ? "  ok   " : "  FAIL ") + what + (detail && !cond ? "   " + detail : ""));
    if (!cond) fails++;
  };
  console.log("\nread-back:");
  ok("all " + WANT.length + " candidates are primary on 1.3",
    plan.every((r) => (afterByPair.get(r.passage_id) || {}).role === "primary"));
  ok("every row this run changed carries added_by " + JSON.stringify(ADDED_BY),
    plan.filter((r) => r.action !== "already primary")
      .every((r) => (afterByPair.get(r.passage_id) || {}).added_by === ADDED_BY));
  /* the negative half: the B.x guidance must NOT have moved, and neither must anything else */
  const bClauses = ["B.6.2.2", "B.6.2.3", "B.6.2.4", "B.6.2.5", "B.6.2.6", "B.6.2.7", "B.6.2.8"];
  const bIds = new Set(sp.filter((x) => x.source_id === "ISO/IEC 42001" && bClauses.includes(x.clause))
    .map((x) => x.id));
  const bRows = afterMine.filter((r) => bIds.has(r.passage_id));
  ok("B.6.2.2-B.6.2.8 are all still SUPPORTING on 1.3 (" + bRows.length + " row(s))",
    bRows.length > 0 && bRows.every((r) => r.role === "supporting"),
    bRows.filter((r) => r.role !== "supporting").length + " moved");
  const c36 = sp.find((x) => x.source_id === "ISO/IEC 42001" && x.clause === "C.3.6");
  ok("C.3.6 is still primary on 1.3", (afterByPair.get(c36.id) || {}).role === "primary");
  const key = (r) => r.task_id + "|" + r.passage_id + "|" + r.role + "|" + r.added_by;
  const touched = new Set(plan.map((r) => task.id + "|" + r.passage_id));
  const beforeSet = new Set(before.map(key));
  const moved = after.filter((r) => !beforeSet.has(key(r)) && !touched.has(r.task_id + "|" + r.passage_id));
  ok("NOT ONE other row changed, in any task", moved.length === 0, moved.length + " moved");
  ok("the 150 reviewed primary links are untouched",
    after.filter((r) => r.added_by === "director ruling 2026-09-26" && r.role === "primary").length === 150);
  ok("no row added or removed beyond the " + toInsert.length + " insert(s)",
    after.length === before.length + toInsert.length, before.length + " -> " + after.length);

  const primAfter = afterMine.filter((r) => r.role === "primary").length;
  console.log("\n1.3 primary rows now: " + primAfter + "   supporting: " +
    afterMine.filter((r) => r.role === "supporting").length);
  writeFileSync(join(ROOT, "TASK-13-PROMOTION.json"), JSON.stringify({
    task: TASK, added_by: ADDED_BY, promoted: WANT, plan,
    primary_before: primBefore, primary_after: primAfter,
    b_guidance_still_supporting: bRows.length,
  }, null, 1) + String.fromCharCode(10), "utf8");
  console.log("wrote TASK-13-PROMOTION.json");
  if (fails) { console.error("\n" + fails + " read-back assertion(s) FAILED"); process.exitCode = 1; }
}
