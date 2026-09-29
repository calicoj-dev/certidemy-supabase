#!/usr/bin/env node
/**
 * backfill-13-grounding.mjs -- write the two missing `item_grounding` rows for the task 1.3 items.
 *
 * `--apply` to write, DRY BY DEFAULT, unknown flags exit 2.
 *
 * ============ WHY THEY ARE MISSING, AND WHY IT MATTERS MORE THAN IT LOOKS ============
 *
 * `gen-grounded-items.mjs --apply` inserts `quiz_questions` and writes NO `item_grounding` row -- the
 * string does not appear in that file. The 32 existing rows were all written by `insert-pilot-drafts.mjs`.
 * So the two items exist, correctly, with no record of what they anchor in.
 *
 * That is not cosmetic. The anchor-cap census READS `item_grounding` to learn what a task already carries,
 * so items inserted through the generator are invisible to the cap: the next run would happily add two
 * more keys to C.3.6 and the census would report zero. A gate that cannot see half the rows it governs
 * reports clean.
 *
 * This backfills the two. The GENERATOR still needs to write these rows itself -- reported, not silently
 * papered over, because a backfill script is not a fix for a writer that omits a record.
 *
 * The gate and solver verdicts are copied from the artifact those items were gated in, not recomputed: a
 * fresh verdict would be a different measurement recorded as though it were the one that cleared them.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";

let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply (dry by default).");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const PREFIXES = ["8d1e4481", "d16bcf46"];
const itemId = (item) => createHash("sha256")
  .update(String((item && item.question_text) || "").replace(/\s+/g, " ").trim())
  .digest("hex").slice(0, 8);

const art = JSON.parse(readFileSync(join(ROOT, "PILOT-AIMSF-TASK-1-3.json"), "utf8"));
const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F");
const rows = (await getAll(KEY, "quiz_questions?select=id,question_text,task_id" +
  "&certification_id=eq." + certs[0].id + "&language=eq.en&order=id"))
  .filter((r) => PREFIXES.some((p) => String(r.id).startsWith(p)));
if (rows.length !== PREFIXES.length) {
  console.error("ABORT: found " + rows.length + " of " + PREFIXES.length + " inserted rows.");
  process.exit(2);
}
const existing = await getAll(KEY, "item_grounding?select=question_id&order=question_id");
const have = new Set(existing.map((g) => g.question_id));

/* match each live row to its artifact item BY STEM, so the grounding cannot be attached to the wrong
 * item -- the id is a hash of exactly that text, which makes the match checkable rather than assumed */
const plan = [];
for (const r of rows) {
  const id = itemId({ question_text: r.question_text });
  const src = (art.items || []).find((x) => itemId(x.item) === id);
  if (!src) {
    console.error("ABORT: no artifact item matches the stem of " + String(r.id).slice(0, 8) +
      " (content id " + id + "). Attaching a grounding row by position would record the wrong anchor.");
    process.exit(2);
  }
  if (have.has(r.id)) { console.log("  " + String(r.id).slice(0, 8) + " already has a grounding row"); continue; }
  plan.push({ question_id: r.id, short: String(r.id).slice(0, 8), content_id: id, src });
}
console.log("to backfill: " + plan.length);
for (const p of plan) {
  console.log("  " + p.short + "  content id " + p.content_id + "  anchor " + p.src.item.key_support_clause);
}
if (!plan.length) { console.log("nothing to do."); process.exit(0); }

const body = plan.map((p) => ({
  question_id: p.question_id,
  key_support_clause: p.src.item.key_support_clause,
  key_support: p.src.item.key_support,
  source_id: "ISO/IEC 42001",
  edition: "2023",
  gates: p.src.gates ?? [],
  solver: p.src.solver ?? null,
  generator: "gen-grounded-items.mjs",
  model: art.model ?? null,
  grounding_family: p.src.grounding_family ?? p.src.item.key_support_clause,
  reviewed_by: "director",
  /* reviewed_at travels with the other two: item_grounding_review_complete_chk refused the first
   * attempt for setting reviewed_by and review_verdict with a null reviewed_at. A CHECK constraining a
   * COHERENCE property of the row is cheaper and stronger than a convention, and it caught a caller
   * nobody had imagined -- this one. */
  reviewed_at: new Date().toISOString(),
  review_verdict: "read",
  review_note: "PROMPT-86 s4. Director read the four task 1.3 pilot survivors and ruled these two in: " +
    "neither carries a code cue flag. The other two were refused as anchor-cap + cue flag. Grounding " +
    "backfilled because gen-grounded-items --apply writes quiz_questions and no item_grounding row.",
}));

if (!APPLY) {
  console.log("\nDRY RUN -- nothing written. Re-run with --apply.");
} else {
  const res = await fetch(REST_URL + "/item_grounding", {
    method: "POST",
    headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json",
      Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("insert failed: " + res.status + " " + (await res.text()));
  console.log("\ninserted " + (await res.json()).length + " grounding row(s)");

  const after = await getAll(KEY,
    "item_grounding?select=question_id,key_support_clause,source_id,grounding_family&order=question_id");
  let fails = 0;
  const ok = (what, cond, detail) => {
    console.log((cond ? "  ok   " : "  FAIL ") + what + (detail && !cond ? "   " + detail : ""));
    if (!cond) fails++;
  };
  console.log("read-back:");
  for (const p of plan) {
    const g = after.find((x) => x.question_id === p.question_id);
    ok(p.short + " has a grounding row", Boolean(g));
    if (g) ok(p.short + " anchored in " + p.src.item.key_support_clause,
      g.key_support_clause === p.src.item.key_support_clause, "got " + g.key_support_clause);
  }
  ok("exactly " + plan.length + " row(s) added", after.length === existing.length + plan.length,
    existing.length + " -> " + after.length);
  /* the cap can now see them: 1.3 must read 2 on C.3.6, not 0 */
  const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code&order=code"))
    .filter((t) => t.certification_id === certs[0].id);
  const codeOf = new Map(tasks.map((t) => [t.id, t.code]));
  const qs = await getAll(KEY, "quiz_questions?select=id,task_id&certification_id=eq." + certs[0].id +
    "&language=eq.en&order=id");
  const taskOfQ = new Map(qs.map((r) => [r.id, r.task_id]));
  const n = after.filter((g) => codeOf.get(taskOfQ.get(g.question_id)) === "1.3" &&
    g.key_support_clause === "C.3.6").length;
  ok("the cap census can now see 2 inserted items on 1.3 / C.3.6", n === 2, "got " + n);

  writeFileSync(join(ROOT, "TASK-13-GROUNDING-BACKFILL.json"), JSON.stringify({
    backfilled: plan.map((p) => ({ id: p.short, clause: p.src.item.key_support_clause })),
    total_after: after.length, cap_visible_c36_on_13: n,
    open_item: "gen-grounded-items.mjs --apply writes quiz_questions and NO item_grounding row. Until " +
      "it does, every item it inserts is invisible to the anchor-cap census.",
  }, null, 1) + String.fromCharCode(10), "utf8");
  console.log("wrote TASK-13-GROUNDING-BACKFILL.json");
  if (fails) { console.error("\n" + fails + " read-back assertion(s) FAILED"); process.exitCode = 1; }
}
