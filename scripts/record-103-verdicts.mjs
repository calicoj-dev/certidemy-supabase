#!/usr/bin/env node
/**
 * PROMPT-103 s1: record `accept` on the 5 R6 rows just inserted, and ASSERT each row's anchor source.
 * The two 5.5 rows must read ISO/IEC 17021-1:2015 and ISO/IEC 42006:2025 -- the report mislabelled them
 * and the ruling is that the label was the only thing wrong.
 * WRITES with `--apply`; dry by default. Unknown flags exit 2.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { itemIdOfStem } from "./lib/item-id.mjs";

const RULED_ON = "2026-10-02T00:00:00Z";
const NOTE = "ruled_in: PROMPT-103 s1 -- R6 survivors read by the director; 5.3 revised off a shared frame.";
let APPLY = false, FIX = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  if (a === "--fix-source") { FIX = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply, --fix-source (dry by default)."); process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

/* The expected anchor per item, from the artifact the director read. Declared, so a wrong row
 * cannot be accepted quietly. */
const EXPECT = {
  "27b6a5de": { task: "3.6", source_id: "ISO/IEC 42001", edition: "2023", clause: "A.4.3" },
  "20ec64ab": { task: "4.1", source_id: "ISO/IEC 42001", edition: "2023", clause: "3.26" },
  "c8619b7c": { task: "5.5", source_id: "ISO/IEC 17021-1", edition: "2015", clause: "9.6.2.2" },
  "b586304b": { task: "5.5", source_id: "ISO/IEC 42006", edition: "2025", clause: "1" },
  "1fe05d59": { task: "5.3", source_id: "ISO/IEC 42001", edition: "2023", clause: "10.1" },
};

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const art = JSON.parse(readFileSync(join(ROOT, "AIMSF-R6-ACCEPTED.json"), "utf8"));
const stemOf = new Map((art.items || []).map((r) => [r.item_id, r.item.question_text]));

const cert = (await getAll(KEY, "certifications?select=id&code=eq.AIMS-F"))[0];
const qs = await getAll(KEY, "quiz_questions?select=id,question_text,task_id,status,visibility,pool," +
  "is_exam_scope&certification_id=eq." + cert.id + "&language=eq.en&retired_at=is.null&order=id");
const tasks = await getAll(KEY, "tasks?select=id,code&order=code");
const codeOf = new Map(tasks.map((t) => [t.id, t.code]));
const grounding = new Map((await getAll(KEY,
  "item_grounding?select=question_id,source_id,edition,key_support_clause,review_verdict&order=question_id"))
  .map((g) => [g.question_id, g]));

/* VALIDATE BEFORE WRITING: resolve each by its stem hash, exactly one row, grounding present. */
const plan = [], bad = [];
for (const [id, exp] of Object.entries(EXPECT)) {
  const stem = stemOf.get(id);
  if (!stem) { bad.push(id + ": not in AIMSF-R6-ACCEPTED.json"); continue; }
  const hits = qs.filter((q) => itemIdOfStem(q.question_text) === id);
  if (hits.length !== 1) { bad.push(id + ": resolves to " + hits.length + " bank row(s)"); continue; }
  const q = hits[0];
  const g = grounding.get(q.id);
  if (!g) { bad.push(id + ": no item_grounding row"); continue; }
  if (codeOf.get(q.task_id) !== exp.task) { bad.push(id + ": task " + codeOf.get(q.task_id) + ", expected " + exp.task); continue; }
  plan.push({ id, q, g, exp });
}
console.log("R6 ACCEPTS: " + Object.keys(EXPECT).length + " ruled, " + plan.length + " resolved, " + bad.length + " unresolved");
for (const b of bad) console.log("   " + b);
if (bad.length) { console.error("REFUSING: nothing written."); process.exit(2); }

/* THE SOURCE ASSERTION, before any write: the label was wrong, the rows must not be. */
const wrongSrc = plan.filter((p) => p.g.source_id !== p.exp.source_id || String(p.g.edition) !== p.exp.edition ||
  p.g.key_support_clause !== p.exp.clause);
console.log("");
for (const p of plan) {
  console.log("  " + p.id + "  task " + p.exp.task + "  anchor " + p.g.source_id + ":" + p.g.edition +
    " " + p.g.key_support_clause + "   status=" + p.q.status + " vis=" + p.q.visibility +
    " pool=" + p.q.pool + " scope=" + p.q.is_exam_scope + "   verdict=" + (p.g.review_verdict ?? "none"));
}
if (wrongSrc.length) {
  console.error("");
  console.error(wrongSrc.length + " row(s) carry an anchor other than the one ruled on:");
  for (const p of wrongSrc) {
    console.error("   " + p.id + " stored " + p.g.source_id + ":" + p.g.edition + " " + p.g.key_support_clause +
      ", ruled " + p.exp.source_id + ":" + p.exp.edition + " " + p.exp.clause);
  }
  /* REPAIRABLE ONLY WHERE THE CLAUSE AGREES AND THE RULED ANCHOR ACTUALLY EXISTS. The insert stamped the
   * run's standard on an item anchored elsewhere; the clause was always right. A source that does not
   * hold the clause is refused rather than written. */
  const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
  const held = new Set(lib.passages.map((p) => p.source_id + "|" + p.edition + "|" + p.clause));
  const fixable = wrongSrc.filter((p) => p.g.key_support_clause === p.exp.clause &&
    held.has(p.exp.source_id + "|" + p.exp.edition + "|" + p.exp.clause));
  const unfixable = wrongSrc.filter((p) => !fixable.includes(p));
  if (unfixable.length) {
    console.error("");
    console.error("REFUSING: " + unfixable.length + " row(s) cannot be repaired (clause differs, or the ruled source does not hold it).");
    process.exit(2);
  }
  if (!FIX) {
    console.error("");
    console.error("All " + fixable.length + " are repairable: same clause, and the ruled source holds it.");
    console.error("Re-run with --fix-source --apply to correct them, then the verdicts are recorded.");
    process.exit(2);
  }
  if (!APPLY) { console.log("\n--fix-source given without --apply. DRY RUN, nothing written."); process.exit(0); }
  for (const p of fixable) {
    const r = await fetch(REST_URL + "/item_grounding?question_id=eq." + p.q.id, {
      method: "PATCH", headers: H,
      body: JSON.stringify({ source_id: p.exp.source_id, edition: p.exp.edition }),
    });
    if (!r.ok) { console.error("  SOURCE PATCH FAILED " + p.id + "  HTTP " + r.status); process.exit(2); }
    const back = (await getAll(KEY, "item_grounding?select=question_id,source_id,edition,key_support_clause" +
      "&question_id=eq." + p.q.id))[0];
    if (back.source_id !== p.exp.source_id || String(back.edition) !== p.exp.edition) {
      console.error("  SOURCE READ-BACK FAILED " + p.id + ": " + back.source_id + ":" + back.edition);
      process.exit(2);
    }
    p.g.source_id = back.source_id; p.g.edition = back.edition;
    console.log("  REPAIRED " + p.id + " -> " + back.source_id + ":" + back.edition + " " + back.key_support_clause);
  }
}
console.log("  SOURCE ASSERTION: all " + plan.length + " anchors match the ruling, including 17021-1:2015 and 42006:2025 on 5.5");

if (!APPLY) { console.log("\nDRY RUN. Nothing written. Re-run with --apply."); process.exitCode = 0; }
else {
  let done = 0;
  for (const p of plan) {
    const r = await fetch(REST_URL + "/item_grounding?question_id=eq." + p.q.id, {
      method: "PATCH", headers: H,
      body: JSON.stringify({ review_verdict: "accept", reviewed_by: "director", reviewed_at: RULED_ON, review_note: NOTE }),
    });
    if (!r.ok) { console.error("  FAILED " + p.id + "  HTTP " + r.status + "  " + (await r.text()).slice(0, 160)); continue; }
    done++;
  }
  /* READ BACK, with the source re-asserted and the negative half: nothing outside the plan moved. */
  const after = await getAll(KEY, "item_grounding?select=question_id,review_verdict,reviewed_by,reviewed_at," +
    "source_id,edition,key_support_clause&order=question_id");
  const want = new Map(plan.map((p) => [p.q.id, p]));
  const got = after.filter((g) => want.has(g.question_id) && g.review_verdict === "accept" &&
    g.reviewed_by === "director" && String(g.reviewed_at).startsWith("2026-10-02"));
  const srcOk = got.filter((g) => g.source_id === want.get(g.question_id).exp.source_id &&
    String(g.edition) === want.get(g.question_id).exp.edition);
  const strays = after.filter((g) => !want.has(g.question_id) &&
    (grounding.get(g.question_id) || {}).review_verdict !== g.review_verdict);
  const rows = await getAll(KEY, "quiz_questions?select=id,status,visibility,pool,is_exam_scope&id=in.(" +
    plan.map((p) => p.q.id).join(",") + ")&order=id");
  console.log("");
  console.log("  wrote            " + done + " of " + plan.length);
  console.log("  read back        " + got.length + " carrying accept by director on the ruling date");
  console.log("  source re-read   " + srcOk.length + " of " + got.length + " match the ruled (source, edition)");
  console.log("  rows MOVED outside the plan (must be 0): " + strays.length);
  for (const r of rows) {
    console.log("  ROW  " + r.id.slice(0, 8) + "  status=" + r.status + "  visibility=" + r.visibility +
      "  pool=" + r.pool + "  is_exam_scope=" + r.is_exam_scope);
  }
  const wrongRow = rows.filter((r) => r.status !== "pending_review" || r.visibility !== "secure" ||
    r.pool !== "secure" || r.is_exam_scope !== true);
  if (got.length !== plan.length || srcOk.length !== got.length || strays.length || wrongRow.length) {
    console.error("POST-CONDITION FAILED.");
    for (const r of wrongRow) console.error("   row not as ruled: " + r.id.slice(0, 8));
    process.exitCode = 2;
  } else console.log("RECORDED. 5 accepts, every anchor source asserted, every row pending_review / secure / in scope.");
}
