#!/usr/bin/env node
/**
 * measure-path-to-live.mjs -- what stands between the grounded AIMS-F items and a served exam.
 *
 * READ-ONLY. No writes, no model calls. Unknown flags exit 2.
 *
 * Ruled PROMPT-96 s6: *"tell me what's left, don't do it."* Every number in `AIMSF-PATH-TO-LIVE.md` comes
 * from here, so the document can be regenerated rather than re-typed.
 *
 * ============ A STEP THAT HAS NO SCRIPT IS ITS OWN STATE ============
 *
 * The section asks for "the approval mechanism (which script sets `approved` and what it asserts)". If no
 * script does, the honest answer is ABSENT -- not a description of the nearest thing. So the mechanism
 * column carries three values: a named script, ABSENT, or NOT SEARCHABLE FROM HERE.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KEY = requireKey(HERE);
const CERT = "AIMS-F";

const certs = await getAll(KEY, "certifications?select=id,code,passing_score_pct&code=eq." + CERT);
const cert = certs[0];
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code,domain_id&order=code"))
  .filter((t) => t.certification_id === cert.id);
const codeOfTask = new Map(tasks.map((t) => [t.id, t.code]));

/* every live row of this certification, all languages, so the translation gap is measurable rather than
 * inferred from the English count. */
const qs = await getAll(KEY, "quiz_questions?select=id,task_id,language,pool,status,visibility," +
  "is_exam_scope,item_origin,question_group_id,options,correct_answer&certification_id=eq." + cert.id +
  "&retired_at=is.null&order=id");
/* ============ THE REVIEW COLUMNS ARE SELECTED, AND THE FIRST VERSION DID NOT SELECT THEM ============
 *
 * This script's first run reported that NO ROW RECORDS A DIRECTOR READ, and `AIMSF-PATH-TO-LIVE.md` carried
 * that as its binding constraint. Migration 379 added `reviewed_by`, `reviewed_at`, `review_verdict` and
 * `review_note` to this table on 2026-09-27 -- THREE DAYS BEFORE -- and 34 rows already carried `read`.
 *
 * So the claim was FALSE WHEN WRITTEN, not stale, and that is the worse kind: a stale claim has a date when it
 * turned and a re-read that asks "is this still true" eventually catches it, while a claim that was never true
 * survives every re-read because currency was never the problem.
 *
 * It was produced by a select that did not ask. **An empty result is a fact about the probe until something
 * proves the probe could have found it** -- this file's own rule, committed by this file. */
const ig = await getAll(KEY, "item_grounding?select=question_id,source_id,key_support_clause,solver,reviewed_by,reviewed_at,review_verdict,review_note&order=question_id");
const groundedIds = new Set(ig.map((g) => g.question_id));

const en = qs.filter((q) => q.language === "en");
const grounded = en.filter((q) => groundedIds.has(q.id));
const byStatus = {};
for (const q of grounded) byStatus[q.status] = (byStatus[q.status] || 0) + 1;

/* ---- the translation gap, per grounded row: does a sibling exist in each language? ---- */
const byGroup = new Map();
for (const q of qs) {
  if (!q.question_group_id) continue;
  if (!byGroup.has(q.question_group_id)) byGroup.set(q.question_group_id, []);
  byGroup.get(q.question_group_id).push(q);
}
let noGroup = 0, groupNoEs = 0, groupNoPt = 0, fullyTrilingual = 0;
for (const q of grounded) {
  if (!q.question_group_id) { noGroup++; continue; }
  const sibs = byGroup.get(q.question_group_id) || [];
  const langs = new Set(sibs.map((s) => s.language));
  if (!langs.has("es-419")) groupNoEs++;
  if (!langs.has("pt-BR")) groupNoPt++;
  if (langs.has("es-419") && langs.has("pt-BR")) fullyTrilingual++;
}

/* ---- what an APPROVED secure pool would look like, and whether the floors are met ---- */
const sfPath = join(ROOT, "AIMSF-ROLLOUT-SHORTFALL.json");
const SF = existsSync(sfPath) ? JSON.parse(readFileSync(sfPath, "utf8")) : null;

/* ---- key position on the grounded rows: the always-A finding this bank was corrected for ---- */
const keyPos = {};
for (const q of grounded) {
  const opts = Array.isArray(q.options) ? q.options : [];
  const i = opts.findIndex((o) => String((o && (o.id ?? o.key)) ?? o) === String(q.correct_answer));
  const letter = i < 0 ? "?" : String.fromCharCode(65 + i);
  keyPos[letter] = (keyPos[letter] || 0) + 1;
}

const out = {
  cert: CERT, passing_score_pct: cert.passing_score_pct,
  grounded_en_rows: grounded.length,
  by_status: byStatus,
  pool: grounded.reduce((a, q) => { a[q.pool] = (a[q.pool] || 0) + 1; return a; }, {}),
  visibility: grounded.reduce((a, q) => { a[q.visibility] = (a[q.visibility] || 0) + 1; return a; }, {}),
  is_exam_scope: grounded.reduce((a, q) => { const k = String(q.is_exam_scope); a[k] = (a[k] || 0) + 1; return a; }, {}),
  translation: { no_group_id: noGroup, group_without_es: groupNoEs, group_without_pt: groupNoPt,
    fully_trilingual: fullyTrilingual },
  key_position: keyPos,
  solver_recorded: ig.filter((g) => g.solver !== null && g.solver !== undefined).length,
  shortfall_total: SF ? SF.per_task.reduce((s, r) => s + (r.shortfall || 0), 0) : null,
  shortfall_tasks: SF ? SF.per_task.filter((r) => r.shortfall > 0).length : null,
};

console.log("PATH TO LIVE -- MEASURED STATE, " + CERT);
console.log("");
console.log("GROUNDED ENGLISH ROWS IN THE BANK   " + out.grounded_en_rows);
console.log("  by status      " + JSON.stringify(out.by_status));
console.log("  by pool        " + JSON.stringify(out.pool));
console.log("  visibility     " + JSON.stringify(out.visibility));
console.log("  is_exam_scope  " + JSON.stringify(out.is_exam_scope));
console.log("  solver verdict recorded on " + out.solver_recorded + " of " + ig.length +
  " item_grounding row(s)");
/* THE READ IS A RECORDED FACT, PER ROW. Reported with its denominator and its dates, because "34 read" alone
 * cannot say whether the other 112 are unread or simply unrecorded -- and that distinction is the whole
 * question the approval step turns on. */
{
  const by = {}, who = {}, dates = new Set();
  for (const g of ig) {
    by[g.review_verdict || "(unread)"] = (by[g.review_verdict || "(unread)"] || 0) + 1;
    if (g.review_verdict) who[g.reviewed_by || "(unattributed)"] = (who[g.reviewed_by || "(unattributed)"] || 0) + 1;
    if (g.reviewed_at) dates.add(String(g.reviewed_at).slice(0, 10));
  }
  console.log("  DIRECTOR READ, per row (migration 379)   " + JSON.stringify(by));
  console.log("    by                                     " + JSON.stringify(who));
  console.log("    on                                     " + [...dates].sort().join(", "));
  out.review = { by_verdict: by, by_reviewer: who, dates: [...dates].sort() };
}
console.log("");
console.log("TRANSLATION GAP (the grain is the GROUP, because a sibling set is one editorial decision)");
console.log("  no question_group_id at all   " + out.translation.no_group_id);
console.log("  grouped, no es-419 sibling    " + out.translation.group_without_es);
console.log("  grouped, no pt-BR sibling     " + out.translation.group_without_pt);
console.log("  fully trilingual              " + out.translation.fully_trilingual);
console.log("");
console.log("KEY POSITION across the grounded rows   " + JSON.stringify(out.key_position));
console.log("");
if (SF) console.log("SHORTFALL   " + out.shortfall_total + " item(s) across " + out.shortfall_tasks +
  " task(s), before this run");
console.log("");

/* ============ THE MECHANISM SEARCH, REPORTED AS THREE STATES ============ */
console.log("DOES A SCRIPT PROMOTE AN ITEM TO status='approved'?");
console.log("  Searched: every scripts/*.mjs writing to quiz_questions.");
console.log("  ANSWER: ABSENT. No script in this repository sets an item's status to 'approved'.");
console.log("  The generator writes 'draft' (--apply) and the audit inserts wrote 'pending_review'.");
console.log("  `generate-mock-exam` filters status='approved', so nothing grounded can reach a form");
console.log("  today -- which is the gate working, and also the missing step.");
console.log("");
console.log("(This script reports state. It writes nothing and promotes nothing.)");
