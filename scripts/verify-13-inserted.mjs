#!/usr/bin/env node
/**
 * verify-13-inserted.mjs -- read the two task 1.3 rows back independently of the script that wrote them.
 *
 * READ-ONLY, no flags, no writes. The insert's own post-condition fired on a stale constant
 * (`is_exam_scope !== false`) while the rows were written correctly, so the rows were reported as a
 * violation and the run exited non-zero. The fix was to the assertion; this confirms the DATA from a
 * separate program rather than re-running the writer and trusting it about itself.
 *
 * Every column the ruling names is checked explicitly -- status, visibility, is_exam_scope -- plus pool,
 * language and item_origin, and the grounding row that records what each item anchors in.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import { requireKey, getAll } from "./_pg.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const PREFIXES = ["8d1e4481", "d16bcf46"];

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F");
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code&order=code"))
  .filter((t) => t.certification_id === certs[0].id);
const codeOfTask = new Map(tasks.map((t) => [t.id, t.code]));
const rows = (await getAll(KEY, "quiz_questions?select=id,task_id,language,question_text,options," +
  "correct_answer,explanation,status,pool,visibility,is_exam_scope,item_origin,question_type," +
  "retired_at&certification_id=eq." + certs[0].id + "&language=eq.en&order=id"))
  .filter((r) => PREFIXES.some((p) => String(r.id).startsWith(p)));
const ig = (await getAll(KEY,
  "item_grounding?select=question_id,key_support_clause,key_support,source_id,edition&order=question_id"))
  .filter((g) => PREFIXES.some((p) => String(g.question_id).startsWith(p)));

let fails = 0;
const ok = (what, cond, detail) => {
  console.log((cond ? "  ok   " : "  FAIL ") + what + (detail && !cond ? "   " + detail : ""));
  if (!cond) fails++;
};
console.log("rows found: " + rows.length + " of " + PREFIXES.length);
ok("both rows exist", rows.length === PREFIXES.length);
for (const r of rows) {
  const id = String(r.id).slice(0, 8);
  console.log("\n" + id + "   task " + codeOfTask.get(r.task_id));
  ok(id + " status = pending_review", r.status === "pending_review", "got " + r.status);
  ok(id + " visibility = secure", r.visibility === "secure", "got " + r.visibility);
  ok(id + " is_exam_scope = true (as ruled)", r.is_exam_scope === true, "got " + r.is_exam_scope);
  ok(id + " pool = secure", r.pool === "secure", "got " + r.pool);
  ok(id + " language = en", r.language === "en", "got " + r.language);
  ok(id + " item_origin = generated", r.item_origin === "generated", "got " + r.item_origin);
  ok(id + " not retired", !r.retired_at);
  ok(id + " task is 1.3", codeOfTask.get(r.task_id) === "1.3", "got " + codeOfTask.get(r.task_id));
  const g = ig.find((x) => String(x.question_id).startsWith(id));
  ok(id + " has an item_grounding row", Boolean(g));
  if (g) ok(id + " anchored in C.3.6", g.key_support_clause === "C.3.6", "got " + g.key_support_clause);
  const keys = Array.isArray(r.correct_answer) ? r.correct_answer : [r.correct_answer];
  ok(id + " has exactly one key", keys.length === 1, "got " + JSON.stringify(keys));
  ok(id + " the key id is one of the options",
    (r.options || []).some((o) => keys.includes(o.id)));
}

/* ---- the cap, after the insert: 1.3 / C.3.6 must now be at 2 and not over ---- */
const all13 = ig.length;
console.log("\nanchor cap after the insert:");
const c36 = ig.filter((g) => g.key_support_clause === "C.3.6" && g.source_id === "ISO/IEC 42001").length;
ok("1.3 now carries exactly 2 inserted items on C.3.6", c36 === 2, "got " + c36);
ok("no third item was inserted", all13 === 2, "got " + all13);

/* ---- and NOTHING ELSE on 1.3 moved: the kept audit item must still be there, unretired ---- */
const live13 = (await getAll(KEY, "quiz_questions?select=id,status,pool,retired_at,task_id" +
  "&certification_id=eq." + certs[0].id + "&language=eq.en&order=id"))
  .filter((r) => codeOfTask.get(r.task_id) === "1.3");
const approved = live13.filter((r) => r.status === "approved" && r.pool === "secure" && !r.retired_at);
console.log("");
ok("the 8 pre-existing approved secure 1.3 items are untouched", approved.length === 8,
  "found " + approved.length);
console.log("  (nothing has been retired: the audit's drops are recorded verdicts, not writes)");

writeFileSync(join(ROOT, "TASK-13-INSERTED.json"), JSON.stringify({
  prefixes: PREFIXES, rows: rows.map((r) => ({ id: String(r.id).slice(0, 8), status: r.status,
    pool: r.pool, visibility: r.visibility, is_exam_scope: r.is_exam_scope, item_origin: r.item_origin,
    task: codeOfTask.get(r.task_id) })),
  grounding: ig.map((g) => ({ id: String(g.question_id).slice(0, 8), clause: g.key_support_clause,
    source: g.source_id })),
  approved_secure_13: approved.length, failures: fails,
}, null, 1) + String.fromCharCode(10), "utf8");
console.log("\nwrote TASK-13-INSERTED.json");
if (fails) { console.error(fails + " assertion(s) FAILED"); process.exitCode = 1; }
else console.log("all assertions pass");
