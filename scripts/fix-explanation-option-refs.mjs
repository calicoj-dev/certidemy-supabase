#!/usr/bin/env node
/**
 * fix-explanation-option-refs.mjs -- rewrite the four explanations that name an option by letter or position.
 *
 * `--apply` writes. DRY BY DEFAULT, printing every before/after. Unknown flags exit 2. `--dry` is not a flag.
 *
 * Ruled PROMPT-95 s1b: "Rewrite each hit to refer to the option by its content. Edit the explanation field
 * only, and assert that nothing else moved."
 *
 * ============ ONE OF THE FOUR IS IN THE DATABASE AND THREE ARE IN ARTIFACTS ============
 *
 * `a5eb5694` was inserted in PROMPT-93 s1, so its fix is a PATCH scoped to one row with the row read back.
 * The other three are waiting survivors and their fix is an edit to the artifact they sit in, which the
 * insert path then reads. Both are handled here so one ruling is not applied two ways by two scripts.
 *
 * ============ NOTHING ELSE MOVED, ASSERTED RATHER THAN INTENDED ============
 *
 * For every item: the stem, every option text, `correct_answer`/`correct_index` and `key_support` are
 * compared byte-for-byte before and after. An explanation rewrite that quietly touched an option would be
 * indistinguishable from one that did its job, and every regenerated word is an unreviewed word.
 *
 * AND THE GATE IS RE-RUN ON EACH REWRITE. A rewrite that still names an option by letter is refused before it
 * is written -- the point is not to have edited, it is for the gate to pass.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, getAllIn, REST_URL } from "./_pg.mjs";
import { explanationOptionRef } from "./lib/explanation-option-ref.mjs";

let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply (dry by default; `--dry` is not a flag here).");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const idOf = (t) => createHash("sha256").update(String(t || "").replace(/\s+/g, " ").trim())
  .digest("hex").slice(0, 8);

/* ---------------------------------------------------------------- the declared rewrites
 * Each names the option by what it SAYS. `replaces` is asserted to be present before the edit, so a
 * rewrite cannot be applied to an explanation that has already changed under it. */
const EDITS = {
  a5eb5694: {
    where: "database",
    replaces: "The annex also states the opposite of option C:",
    with: "The annex also states the opposite of the technology-neutral reading:",
    why: "`option C` pointed at the technology-neutral claim. Named by its content, the sentence survives " +
      "any order and reads better -- it says which claim is being contradicted instead of where it sits.",
  },
  "997dd746": {
    where: "artifact",
    replaces: "which is what option A captures.",
    with: "which is why the description covering identification, weighing and handling of impacts on people " +
      "and societies is the one that matches.",
    why: "`option A` pointed at the key. Named by its content, and the content is the three steps the clause " +
      "lists, which is the examinable point.",
  },
  b25f378f: {
    where: "artifact",
    replaces: "the second option restates the separate definition of effectiveness in 3.13,",
    with: "the description about planned activities being carried out and intended results reached restates " +
      "the separate definition of effectiveness in 3.13,",
    why: "`the second option` pointed at the effectiveness distractor. Naming its content also makes the " +
      "distinction the item tests explicit.",
  },
  fdb0fda4: {
    where: "artifact",
    replaces: "Option A describes exactly that coverage, while the other options narrow it to residual risk, " +
      "to Annex A entries, or to implementation guidance.",
    with: "The description carrying both the identified risks and the control measures set up to deal with " +
      "them is exactly that coverage, while the others narrow it to residual risk, to Annex A entries, or " +
      "to implementation guidance.",
    why: "`Option A` pointed at the key. Named by its content.",
  },
};

const IMMUTABLE_MSG = "an explanation rewrite may not touch anything else";
let fails = 0, applied = 0;

/* ---------------------------------------------------------------- the artifacts */
const FILES = ["AIMSF-ROLLOUT-B2.json", "AIMSF-R2-PROBE.json", "AIMSF-R2-REST.json",
  "AIMSF-R3-PROBE.json", "AIMSF-R3-REST.json"];
const artifactPlan = [];
for (const f of FILES) {
  const p = join(ROOT, f);
  if (!existsSync(p)) continue;
  const j = JSON.parse(readFileSync(p, "utf8"));
  for (const r of j.items || []) {
    if (r.verdict !== "survivor") continue;
    const id = r.item_id || idOf(r.item.question_text);
    const e = EDITS[id];
    if (!e || e.where !== "artifact") continue;
    artifactPlan.push({ file: f, path: p, json: j, rec: r, id, e });
  }
}
for (const [id, e] of Object.entries(EDITS)) {
  if (e.where !== "artifact") continue;
  if (!artifactPlan.some((x) => x.id === id)) {
    console.error("  MISSING: " + id + " is declared as an artifact edit and was not found in any artifact");
    fails++;
  }
}

/* ---------------------------------------------------------------- the database row */
const KEY = requireKey(HERE);
const ig = await getAll(KEY, "item_grounding?select=question_id&order=question_id");
const dbRows = await getAllIn(KEY, "quiz_questions",
  "id,question_text,explanation,options,correct_answer", "id",
  ig.map((g) => g.question_id), "&order=id");
const dbPlan = [];
for (const q of dbRows) {
  const id = idOf(q.question_text);
  const e = EDITS[id];
  if (!e || e.where !== "database") continue;
  dbPlan.push({ q, id, e });
}
for (const [id, e] of Object.entries(EDITS)) {
  if (e.where !== "database") continue;
  if (!dbPlan.some((x) => x.id === id)) {
    console.error("  MISSING: " + id + " is declared as a database edit and is not among the grounded rows");
    fails++;
  }
}

/* ---------------------------------------------------------------- plan and check */
function rewrite(before, e, label) {
  if (!before.includes(e.replaces)) {
    console.error("  ABORT " + label + ": the text to replace is not present. Re-read before editing.");
    console.error("    looking for: " + JSON.stringify(e.replaces.slice(0, 70)));
    fails++;
    return null;
  }
  const after = before.split(e.replaces).join(e.with);
  /* THE GATE MUST PASS ON THE REWRITE. Editing is not the goal; clearing the gate is. */
  const v = explanationOptionRef({ explanation: after });
  if (!v.pass) {
    console.error("  ABORT " + label + ": the rewrite STILL names an option -- " +
      v.hits.map((h) => h.rule + " [" + h.match + "]").join(", "));
    fails++;
    return null;
  }
  return after;
}

console.log("THE FOUR REWRITES");
console.log("");
for (const x of [...dbPlan, ...artifactPlan]) {
  const before = String(x.e.where === "database" ? x.q.explanation : x.rec.item.explanation);
  const label = x.id;
  console.log("=== " + x.id + "   " + x.e.where + (x.file ? "  [" + x.file + "]" : ""));
  console.log("  why: " + x.e.why);
  const after = rewrite(before, x.e, label);
  if (!after) { console.log(""); continue; }
  console.log("  BEFORE: ..." + before.slice(Math.max(0, before.indexOf(x.e.replaces) - 60),
    before.indexOf(x.e.replaces) + x.e.replaces.length + 20).replace(/\s+/g, " "));
  console.log("  AFTER : ..." + after.slice(Math.max(0, after.indexOf(x.e.with) - 60),
    after.indexOf(x.e.with) + x.e.with.length + 20).replace(/\s+/g, " "));
  x.after = after;
  console.log("");
}
if (fails) { console.error("\nNOTHING WRITTEN. " + fails + " abort condition(s)."); process.exit(1); }
if (!APPLY) {
  console.log("DRY RUN -- nothing written. Re-run with --apply.");
  process.exit(0);
}

/* ---------------------------------------------------------------- apply: artifacts */
const byFile = new Map();
for (const x of artifactPlan) {
  if (!byFile.has(x.path)) byFile.set(x.path, { json: x.json, file: x.file, edits: [] });
  byFile.get(x.path).edits.push(x);
}
for (const [p, g] of byFile) {
  const before = JSON.parse(readFileSync(p, "utf8"));
  for (const x of g.edits) {
    const rec = (g.json.items || []).find((r) => (r.item_id || idOf(r.item.question_text)) === x.id);
    rec.item.explanation = x.after;
  }
  /* ASSERT NOTHING ELSE MOVED, field by field, against the file as it was on disk. */
  const ids = new Set(g.edits.map((x) => x.id));
  const bi = new Map((before.items || []).map((r) => [r.item_id || idOf(r.item.question_text), r]));
  for (const r of g.json.items || []) {
    const id = r.item_id || idOf(r.item.question_text);
    const b = bi.get(id);
    if (!b) { console.error("  ABORT: a record appeared in " + g.file); fails++; continue; }
    for (const k of Object.keys(b.item)) {
      const changed = JSON.stringify(b.item[k]) !== JSON.stringify(r.item[k]);
      if (!changed) continue;
      if (k === "explanation" && ids.has(id)) continue;
      console.error("  ABORT: undeclared change to " + k + " on " + id + " in " + g.file);
      fails++;
    }
  }
  if (fails) break;
  writeFileSync(p, JSON.stringify(g.json, null, 1) + "\n", "utf8");
  console.log("  wrote " + g.file + "   (" + g.edits.length + " explanation(s))");
  applied += g.edits.length;
}
if (fails) { console.error("\nSTOPPED: " + fails + " abort condition(s). Artifacts may be partially written -- check git diff."); process.exit(1); }

/* ---------------------------------------------------------------- apply: the database row */
for (const x of dbPlan) {
  const res = await fetch(REST_URL + "/quiz_questions?id=eq." + x.q.id, {
    method: "PATCH",
    headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json",
      Prefer: "return=representation" },
    body: JSON.stringify({ explanation: x.after }),
  });
  if (!res.ok) throw new Error("patch failed on " + x.id + ": " + res.status + " " + (await res.text()));
  const got = await res.json();
  if (got.length !== 1) throw new Error("patch touched " + got.length + " row(s) on " + x.id);
  /* READ BACK, and assert the rest of the row is untouched -- the standing rule. */
  const back = got[0];
  const same = JSON.stringify(back.options) === JSON.stringify(x.q.options) &&
    JSON.stringify(back.correct_answer) === JSON.stringify(x.q.correct_answer) &&
    back.question_text === x.q.question_text;
  console.log("  PATCHED " + x.id + "   explanation updated; stem/options/correct_answer unchanged: " +
    (same ? "yes" : "NO"));
  if (!same) { console.error("  " + IMMUTABLE_MSG); process.exitCode = 1; }
  const v = explanationOptionRef({ explanation: back.explanation });
  console.log("      gate on the row as read back: " + (v.pass ? "passes" : "STILL FIRES"));
  if (!v.pass) process.exitCode = 1;
  applied++;
}
console.log("");
console.log("applied " + applied + " of " + Object.keys(EDITS).length);
