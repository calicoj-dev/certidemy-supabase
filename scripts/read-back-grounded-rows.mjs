#!/usr/bin/env node
/**
 * read-back-grounded-rows.mjs -- read inserted grounded items back, independently of the inserter.
 *
 * READ-ONLY. Takes item ids (the 8-character content hash) or `--recent=N`. Unknown flags exit 2.
 *
 * The generator has its own post-condition and it passed. This is a SECOND instrument, because the standing
 * rule is "name status, visibility and is_exam_scope on every write, then read the row back" -- and a writer
 * reading back its own write shares every assumption the write was made under. It names each column and its
 * value rather than reporting a verdict, so a wrong value is visible rather than summarised away.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, getAllIn } from "./_pg.mjs";

let RECENT = 0, EXPECT_STATUS = "pending_review";
const IDS = [];
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--recent=(\d+)$/.exec(a))) { RECENT = Number(m[1]); continue; }
  /* The status to ASSERT. It was hard-coded to pending_review, which is right before the approval step
   * and wrong after it: a post-approval read reported 42 mismatches on 42 correct rows (PROMPT-131).
   * An instrument that cannot be told what state to expect reports the wrong one confidently. */
  if ((m = /^--expect-status=(.+)$/.exec(a))) { EXPECT_STATUS = m[1]; continue; }
  if (/^--/.test(a)) {
    console.error("Unrecognised flag: " + a +
      ". Known: --recent=N, --expect-status=<status> (default pending_review), or bare item ids.");
    process.exit(2);
  }
  IDS.push(...a.split(",").map((x) => x.trim()).filter(Boolean));
}
if (!IDS.length && !RECENT) {
  console.error("usage: node scripts/read-back-grounded-rows.mjs <id,id,...> | --recent=N");
  process.exit(2);
}
const KEY = requireKey(dirname(fileURLToPath(import.meta.url)));
void join;

/* item_grounding is the join: every grounded insert writes one, so the newest rows are the newest inserts */
const ig = await getAll(KEY,
  "item_grounding?select=question_id,key_support_clause,source_id,edition,generator,model,created_at" +
  "&order=created_at.desc,question_id");
const chosen = RECENT ? ig.slice(0, RECENT) : ig;
const qs = await getAllIn(KEY, "quiz_questions",
  "id,question_text,task_id,certification_id,pool,status,visibility,is_exam_scope,retired_at,language," +
  "question_group_id,item_origin", "id", chosen.map((g) => g.question_id), "&order=id");
const qById = new Map(qs.map((r) => [r.id, r]));
const tasks = await getAll(KEY, "tasks?select=id,code&order=code");
const taskCode = new Map(tasks.map((t) => [t.id, t.code]));

const { createHash } = await import("node:crypto");
const idOf = (text) => createHash("sha256")
  .update(String(text || "").replace(/\s+/g, " ").trim()).digest("hex").slice(0, 8);

const rows = [];
for (const g of chosen) {
  const q = qById.get(g.question_id);
  if (!q) { rows.push({ id: "(no question row)", g, q: null }); continue; }
  rows.push({ id: idOf(q.question_text), g, q });
}
const want = IDS.length ? rows.filter((r) => IDS.includes(r.id)) : rows;

console.log("READ BACK " + want.length + " row(s), independently of the inserter");
if (IDS.length) {
  const found = new Set(want.map((r) => r.id));
  const missing = IDS.filter((x) => !found.has(x));
  /* A REQUESTED ID WITH NO ROW IS ITS OWN STATE, never an absence folded into a smaller count. */
  console.log("  requested " + IDS.length + ", found " + want.length +
    (missing.length ? "   NOT FOUND: " + missing.join(", ") : ""));
}
console.log("");
let bad = 0;
for (const r of want) {
  const q = r.q;
  console.log("  " + r.id + "   task " + (taskCode.get(q.task_id) || "?"));
  console.log("      status         " + q.status);
  console.log("      visibility     " + q.visibility);
  console.log("      is_exam_scope  " + q.is_exam_scope);
  console.log("      pool           " + q.pool + "   language " + q.language +
    "   item_origin " + q.item_origin);
  console.log("      retired_at     " + (q.retired_at ?? "null") +
    "   question_group_id " + (q.question_group_id ?? "null"));
  console.log("      grounding      " + r.g.source_id + " " + r.g.edition + " :: " + r.g.key_support_clause);
  console.log("      written by     " + r.g.generator + (r.g.model ? " / " + r.g.model : ""));
  /* the three the standing rule names, asserted rather than only printed */
  const expect = { status: EXPECT_STATUS, pool: "secure", is_exam_scope: true, retired_at: null };
  for (const [k, v] of Object.entries(expect)) {
    if (q[k] !== v) { console.log("      MISMATCH " + k + ": " + q[k] + " (expected " + v + ")"); bad++; }
  }
  console.log("");
}
console.log(bad ? bad + " column mismatch(es)" :
  "every row: status=" + EXPECT_STATUS + ", pool=secure, is_exam_scope=true, retired_at=null");
if (bad) process.exitCode = 1;
