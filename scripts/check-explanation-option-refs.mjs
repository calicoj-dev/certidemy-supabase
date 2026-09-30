#!/usr/bin/env node
/**
 * check-explanation-option-refs.mjs -- every grounded item, inserted or waiting, whose explanation names an
 * option by letter or position.
 *
 * READ-ONLY. Unknown flags exit 2. Ruled PROMPT-95 s1b.
 *
 * The population is BOTH SIDES of insertion, deliberately. The inserted rows are about to be reordered
 * (s1d), and the waiting artifacts are about to be inserted with balanced order (s1c) -- so a letter
 * reference is equally wrong in each, and checking only one would leave the other to be found later by a
 * reader wondering why an explanation points at the wrong option.
 *
 * The controls run first and a control failure SUPPRESSES the list: a detector that cannot separate its own
 * four positives from an ISO address has nothing to say about a hundred items.
 */
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, getAllIn } from "./_pg.mjs";
import { explanationOptionRef, explanationOptionRefControls, RULES }
  from "./lib/explanation-option-ref.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const idOf = (t) => createHash("sha256").update(String(t || "").replace(/\s+/g, " ").trim())
  .digest("hex").slice(0, 8);

console.log("CONTROLS");
const ctl = explanationOptionRefControls();
const bad = ctl.filter((c) => !c.pass);
for (const c of bad) console.log("  FAIL " + c.what + "   " + c.detail);
console.log("  " + (ctl.length - bad.length) + " of " + ctl.length + " pass");
if (bad.length) {
  console.log("\nCONTROL FAILURE -- no list printed.");
  process.exitCode = 1;
  process.exit();
}
console.log("  rules: " + RULES.map((r) => r.id).join(", "));
console.log("");

/* ---- the inserted side ---- */
const KEY = requireKey(HERE);
const ig = await getAll(KEY, "item_grounding?select=question_id&order=question_id");
const inserted = await getAllIn(KEY, "quiz_questions",
  "id,question_text,explanation,options,correct_answer,task_id,status,pool", "id",
  ig.map((g) => g.question_id), "&order=id");
const tasks = await getAll(KEY, "tasks?select=id,code&order=code");
const taskCode = new Map(tasks.map((t) => [t.id, t.code]));

/* ---- the waiting side ---- */
const ARTIFACTS = [["batch 1", "AIMSF-ROLLOUT-B1.json"], ["batch 2", "AIMSF-ROLLOUT-B2.json"],
  ["R2", "AIMSF-R2-PROBE.json"], ["R2", "AIMSF-R2-REST.json"],
  ["R3", "AIMSF-R3-PROBE.json"], ["R3", "AIMSF-R3-REST.json"],
  ["B1 revised", "AIMSF-B1-REVISED.json"]];

const rows = [];
const insertedStems = new Set();
for (const q of inserted) {
  insertedStems.add(idOf(q.question_text));
  rows.push({ where: "INSERTED", id: idOf(q.question_text), task: taskCode.get(q.task_id) || "?",
    explanation: q.explanation, qid: q.id });
}
const missing = [];
for (const [label, f] of ARTIFACTS) {
  const p = join(ROOT, f);
  if (!existsSync(p)) { missing.push(f); continue; }
  for (const r of JSON.parse(readFileSync(p, "utf8")).items || []) {
    if (r.verdict !== "survivor") continue;
    const id = r.item_id || idOf(r.item.question_text);
    if (insertedStems.has(id)) continue;      /* counted on the inserted side already */
    rows.push({ where: label, id, task: r.task_code, explanation: r.item.explanation, qid: null });
  }
}
/* dedupe: the same waiting stem can appear in two artifacts (a probe and its re-gate) */
const seen = new Set();
const pop = rows.filter((r) => { const k = r.where + "|" + r.id; if (seen.has(k)) return false; seen.add(k); return true; });

console.log("POPULATION");
console.log("  inserted grounded rows   " + rows.filter((r) => r.where === "INSERTED").length);
console.log("  waiting survivors        " + pop.filter((r) => r.where !== "INSERTED").length);
if (missing.length) console.log("  artifacts NOT FOUND      " + missing.join(", ") + "   (counted nowhere)");
console.log("");

let fires = 0, unexamined = 0;
const hits = [];
for (const r of pop) {
  const v = explanationOptionRef({ explanation: r.explanation });
  if (!v.examined) { unexamined++; console.log("  UNEXAMINED  " + r.id + "  (" + r.where + ") no explanation"); continue; }
  if (v.pass) continue;
  fires++;
  hits.push({ ...r, hits: v.hits });
}
console.log("HITS, " + fires + " of " + (pop.length - unexamined) + " examined" +
  (unexamined ? "   (" + unexamined + " UNEXAMINED, reported above, never a pass)" : ""));
console.log("");
for (const h of hits) {
  console.log("  " + h.id + "  " + String(h.task).padEnd(5) + h.where.padEnd(12) +
    h.hits.map((x) => x.rule + " [" + x.match + "]").join("  "));
  const ex = String(h.explanation).replace(/\s+/g, " ");
  console.log("      " + ex.slice(0, 190) + (ex.length > 190 ? " ..." : ""));
}
console.log("");
console.log("FIRING COUNT in the same breath as the gate: " + fires + " of " + (pop.length - unexamined) +
  " (" + (pop.length - unexamined ? Math.round((fires / (pop.length - unexamined)) * 100) : 0) + "%).");
console.log("Each one must be rewritten to name its option by CONTENT, which survives any order.");
