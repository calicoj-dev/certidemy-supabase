#!/usr/bin/env node
/**
 * Record a director's verdicts on grounded rows, asserting each row's (source, edition, clause).
 * `--spec <file>` names the ruling; `--apply` writes; `--fix-source` repairs a row whose source the
 * insert stamped wrongly, only where the clause agrees and the ruled anchor is held.
 * Generalised from record-102/103-verdicts so a fourth ruling needs a spec, not a script.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { itemIdOfStem } from "./lib/item-id.mjs";

let SPEC = null, APPLY = false, FIX = false;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--apply") { APPLY = true; continue; }
  if (argv[i] === "--fix-source") { FIX = true; continue; }
  if (argv[i] === "--spec") { SPEC = argv[++i]; continue; }
  const m = argv[i].match(/^--spec=(.+)$/);
  if (m) { SPEC = m[1]; continue; }
  console.error("Unrecognised flag: " + argv[i] + ". Known: --spec <file>, --apply, --fix-source.");
  process.exit(2);
}
if (!SPEC) { console.error("--spec <file> is required."); process.exit(2); }

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const spec = JSON.parse(readFileSync(join(ROOT, SPEC), "utf8"));
for (const k of ["cert", "ruled_on", "reviewed_by", "note", "artifact", "items"]) {
  if (spec[k] == null) { console.error("spec is missing " + k); process.exit(2); }
}
const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const art = JSON.parse(readFileSync(join(ROOT, spec.artifact), "utf8"));
const stemOf = new Map((art.items || []).map((r) => [r.item_id, r.item.question_text]));

const cert = (await getAll(KEY, "certifications?select=id&code=eq." + spec.cert))[0];
const qs = await getAll(KEY, "quiz_questions?select=id,question_text,task_id,status,visibility,pool," +
  "is_exam_scope&certification_id=eq." + cert.id + "&language=eq.en&retired_at=is.null&order=id");
const tasks = await getAll(KEY, "tasks?select=id,code&order=code");
const codeOf = new Map(tasks.map((t) => [t.id, t.code]));
const grounding = new Map((await getAll(KEY,
  "item_grounding?select=question_id,source_id,edition,key_support_clause,review_verdict&order=question_id"))
  .map((g) => [g.question_id, g]));

const plan = [], bad = [];
for (const exp of spec.items) {
  if (!stemOf.has(exp.id)) { bad.push(exp.id + ": not in " + spec.artifact); continue; }
  const hits = qs.filter((q) => itemIdOfStem(q.question_text) === exp.id);
  if (hits.length !== 1) { bad.push(exp.id + ": resolves to " + hits.length + " bank row(s)"); continue; }
  const q = hits[0], g = grounding.get(q.id);
  if (!g) { bad.push(exp.id + ": no item_grounding row"); continue; }
  if (codeOf.get(q.task_id) !== exp.task) { bad.push(exp.id + ": task " + codeOf.get(q.task_id) + ", ruled " + exp.task); continue; }
  plan.push({ exp, q, g });
}
console.log(spec.note.slice(0, 80));
console.log("  " + spec.items.length + " ruled, " + plan.length + " resolved, " + bad.length + " unresolved");
for (const b of bad) console.log("   " + b);
if (bad.length) { console.error("REFUSING: nothing written."); process.exit(2); }

console.log("");
for (const p of plan) {
  console.log("  " + p.exp.id + "  task " + p.exp.task + "  " + p.g.source_id + ":" + p.g.edition + " " +
    p.g.key_support_clause + "   status=" + p.q.status + " vis=" + p.q.visibility + " pool=" + p.q.pool +
    " scope=" + p.q.is_exam_scope + "   verdict=" + (p.g.review_verdict ?? "none"));
}

/* THE SOURCE ASSERTION, before any verdict is written. */
const wrong = plan.filter((p) => p.g.source_id !== p.exp.source_id ||
  String(p.g.edition) !== String(p.exp.edition) || p.g.key_support_clause !== p.exp.clause);
if (wrong.length) {
  console.error("");
  console.error(wrong.length + " row(s) carry an anchor other than the one ruled on:");
  for (const p of wrong) {
    console.error("   " + p.exp.id + " stored " + p.g.source_id + ":" + p.g.edition + " " + p.g.key_support_clause +
      ", ruled " + p.exp.source_id + ":" + p.exp.edition + " " + p.exp.clause);
  }
  const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
  const held = new Set(lib.passages.map((p) => p.source_id + "|" + p.edition + "|" + p.clause));
  const fixable = wrong.filter((p) => p.g.key_support_clause === p.exp.clause &&
    held.has(p.exp.source_id + "|" + p.exp.edition + "|" + p.exp.clause));
  if (fixable.length !== wrong.length) {
    console.error("REFUSING: " + (wrong.length - fixable.length) + " cannot be repaired (clause differs, or the ruled source does not hold it).");
    process.exit(2);
  }
  if (!FIX) { console.error("\nAll repairable. Re-run with --fix-source --apply."); process.exit(2); }
  if (!APPLY) { console.log("\n--fix-source without --apply. DRY RUN."); process.exit(0); }
  for (const p of fixable) {
    const r = await fetch(REST_URL + "/item_grounding?question_id=eq." + p.q.id,
      { method: "PATCH", headers: H, body: JSON.stringify({ source_id: p.exp.source_id, edition: String(p.exp.edition) }) });
    if (!r.ok) { console.error("  SOURCE PATCH FAILED " + p.exp.id); process.exit(2); }
    const back = (await getAll(KEY, "item_grounding?select=source_id,edition&question_id=eq." + p.q.id))[0];
    if (back.source_id !== p.exp.source_id || String(back.edition) !== String(p.exp.edition)) {
      console.error("  SOURCE READ-BACK FAILED " + p.exp.id); process.exit(2);
    }
    p.g.source_id = back.source_id; p.g.edition = back.edition;
    console.log("  REPAIRED " + p.exp.id + " -> " + back.source_id + ":" + back.edition);
  }
}
console.log("  SOURCE ASSERTION: all " + plan.length + " anchors match the ruling");

if (!APPLY) { console.log("\nDRY RUN. Nothing written. Re-run with --apply."); process.exitCode = 0; }
else {
  let done = 0;
  for (const p of plan) {
    const body = { review_verdict: p.exp.verdict, reviewed_by: spec.reviewed_by,
      reviewed_at: spec.ruled_on, review_note: spec.note + (p.exp.reason ? "  " + p.exp.reason : "") };
    const r = await fetch(REST_URL + "/item_grounding?question_id=eq." + p.q.id,
      { method: "PATCH", headers: H, body: JSON.stringify(body) });
    if (!r.ok) { console.error("  FAILED " + p.exp.id + "  HTTP " + r.status + "  " + (await r.text()).slice(0, 160)); continue; }
    /* a REJECT also moves the row out of scope, and the columns are named on the write */
    if (p.exp.verdict === "reject") {
      const r2 = await fetch(REST_URL + "/quiz_questions?id=eq." + p.q.id, {
        method: "PATCH", headers: H,
        body: JSON.stringify({ status: "rejected", visibility: p.q.visibility, is_exam_scope: false }),
      });
      if (!r2.ok) { console.error("  ROW PATCH FAILED " + p.exp.id); continue; }
    }
    done++;
  }
  const after = await getAll(KEY, "item_grounding?select=question_id,review_verdict,reviewed_by,reviewed_at," +
    "source_id,edition&order=question_id");
  const want = new Map(plan.map((p) => [p.q.id, p]));
  const got = after.filter((g) => want.has(g.question_id) &&
    g.review_verdict === want.get(g.question_id).exp.verdict && g.reviewed_by === spec.reviewed_by);
  const srcOk = got.filter((g) => g.source_id === want.get(g.question_id).exp.source_id &&
    String(g.edition) === String(want.get(g.question_id).exp.edition));
  const strays = after.filter((g) => !want.has(g.question_id) &&
    (grounding.get(g.question_id) || {}).review_verdict !== g.review_verdict);
  const rows = await getAll(KEY, "quiz_questions?select=id,status,visibility,pool,is_exam_scope&id=in.(" +
    plan.map((p) => p.q.id).join(",") + ")&order=id");
  console.log("");
  console.log("  wrote           " + done + " of " + plan.length);
  console.log("  read back       " + got.length + " carrying the ruled verdict by " + spec.reviewed_by);
  console.log("  source re-read  " + srcOk.length + " of " + got.length + " match the ruled (source, edition)");
  console.log("  rows MOVED outside the plan (must be 0): " + strays.length);
  for (const r of rows) {
    const p = [...want.values()].find((x) => x.q.id === r.id);
    console.log("  ROW " + r.id.slice(0, 8) + "  " + p.exp.verdict.padEnd(7) + " status=" + r.status +
      "  vis=" + r.visibility + "  pool=" + r.pool + "  scope=" + r.is_exam_scope);
  }
  const wrongRow = rows.filter((r) => {
    const p = [...want.values()].find((x) => x.q.id === r.id);
    return p.exp.verdict === "reject"
      ? (r.status !== "rejected" || r.is_exam_scope !== false)
      : (r.status !== "pending_review" || r.visibility !== "secure" || r.pool !== "secure" || r.is_exam_scope !== true);
  });
  if (got.length !== plan.length || srcOk.length !== got.length || strays.length || wrongRow.length) {
    console.error("POST-CONDITION FAILED.");
    for (const r of wrongRow) console.error("   row not as ruled: " + r.id.slice(0, 8));
    process.exitCode = 2;
  } else console.log("RECORDED. Every anchor source asserted; accepted rows stay pending_review.");
}
