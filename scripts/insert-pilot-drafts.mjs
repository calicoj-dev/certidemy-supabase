#!/usr/bin/env node
/**
 * insert-pilot-drafts.mjs - insert the ruled pilot survivors as `status='draft'`.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 * ============ WHAT GOES IN, AND WHY THE SET IS SMALLER THAN THE SURVIVOR COUNT ============
 *
 * Pilot 3's 27 survivors, plus only those pilot-2 survivors that do not duplicate a pilot-3 item on
 * BOTH task and anchor clause. Two drafts resting on one fact cross-cue each other later, and stem
 * identity cannot see it -- their stems differ, which is exactly why a dedupe on text misses them.
 *
 * The director numbers SURVIVORS, not all items, and every reference he gives carries the task code
 * in parentheses. That parenthetical is the check: this script resolves the ordinal and then asserts
 * the task code matches, so a numbering drift cannot silently edit the wrong item.
 *
 * ============ EVERY COLUMN A DEFAULT COULD DECIDE IS WRITTEN EXPLICITLY ============
 *
 * `quiz_questions` defaults are `status='approved'`, `visibility='secure'` and
 * `is_exam_scope=true`. An insert that omits `status` lands LIVE. Two of the three defaults happen
 * to be safe for a draft and one is catastrophic, and which is which is not a thing to rely on --
 * so status, pool, visibility, is_exam_scope, item_origin and language are all named, and the rows
 * are read back afterwards and asserted one by one.
 *
 * ============ THREE INDEPENDENT REASONS A DRAFT CANNOT REACH A CANDIDATE ============
 *
 *   status='draft'        generate-mock-exam filters status='approved'
 *   is_exam_scope=false   no exam form can contain it
 *   pool='secure'         submit-quiz-answer now refuses pool='secure' outright
 *
 * A guarantee that depends on one column staying true is not a guarantee.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { gateReproduction } from "./lib/grounded-gates.mjs";
/* ONE IMPLEMENTATION: `buildSources` is the lesson scanner's own index, in leak-score.mjs, and it
 * asserts each document's word count against the manifest -- a positive control this path gets for
 * free. It is NOT in citation-index.mjs, which is where I first reached for it. */
import * as leakScore from "./lib/leak-score.mjs";

let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("unknown flag " + JSON.stringify(a) + ". Known: --apply (dry by default).");
  process.exitCode = 2; process.exit();
}

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KEY = requireKey(HERE);

/* ============ THE DIRECTOR'S EDITS, DECLARED BY (SURVIVOR ORDINAL, TASK CODE) ============
 *
 * Verbatim from his read. `from` must occur exactly once in the field or the edit is refused: a
 * substitution that silently matches nothing is how an approved change fails to land. */
const EDITS = [
  {
    pilot: 3, task: "3.2", field: "option", index: 0,
    from: "should know the AI policy",
    to: "are to be aware of the AI policy",
    why: "Clause 7.3 is a shall. 'should know' understates it, so the item taught that awareness is "
       + "optional. Understatement is not inflation, so no gate fires -- this is the director's read.",
  },
];

/* Excluded by name, with his reason. */
const EXCLUDE = [{ pilot: 2, ord: 15, task: "4.2", why: "Tier B: distractor d is defensible under 6.1.3 NOTE 3" }];

const rd = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const survivors = (j) => j.items.filter((r) => r.verdict === "survivor").map((r, i) => ({ ord: i + 1, ...r }));
const anchorKey = (r) => r.task_code + "|" + String(r.item.key_support_clause || "").trim();

async function main() {
  const p2 = survivors(rd("PILOT-GROUNDED-AIMSF-2.json"));
  const p3 = survivors(rd("PILOT-GROUNDED-AIMSF-3.json"));

  /* ---- the set ---- */
  const p3keys = new Set(p3.map(anchorKey));
  const chosen = p3.map((r) => ({ ...r, pilot: 3, why_in: "pilot 3 survivor" }));
  const dropped = [];
  const seen = new Set(p3keys);
  for (const r of p2) {
    const ex = EXCLUDE.find((e) => e.pilot === 2 && e.ord === r.ord);
    if (ex) {
      if (ex.task !== r.task_code) throw new Error("EXCLUDE #" + ex.ord + " expects task " + ex.task + ", resolved to " + r.task_code);
      dropped.push({ r, why: ex.why }); continue;
    }
    const k = anchorKey(r);
    if (seen.has(k)) {
      dropped.push({ r, why: p3keys.has(k) ? "duplicates a pilot-3 item on task+anchor" : "duplicates an earlier pilot-2 item on task+anchor" });
      continue;
    }
    seen.add(k);
    chosen.push({ ...r, pilot: 2, why_in: "pilot 2 survivor, unique on task+anchor" });
  }

  /* ---- the edits, applied with their own assertion ---- */
  const edited = [];
  for (const e of EDITS) {
    const pool = e.pilot === 3 ? chosen.filter((c) => c.pilot === 3) : chosen.filter((c) => c.pilot === 2);
    const hit = e.task ? pool.find((c) => c.task_code === e.task) : pool.find((c) => c.ord === e.ord);
    if (!hit) throw new Error("edit for pilot " + e.pilot + " task " + e.task + " matched no item in the insert set");
    const target = e.field === "option" ? hit.item.options[e.index] : hit.item;
    const prop = e.field === "option" ? "text" : e.field;
    const before = String(target[prop] || "");
    const n = before.split(e.from).length - 1;
    if (n !== 1) throw new Error("edit text occurs " + n + " time(s), expected exactly 1: " + JSON.stringify(e.from));
    target[prop] = before.replace(e.from, e.to);
    edited.push({ hit, e, before, after: target[prop] });
  }

  /* ---- THE REPRODUCTION GATE, RE-RUN ON EVERY EDITED ITEM ---- */
  let sources = null, reGate = [];
  try {
    sources = leakScore.buildSources();
    const qc = leakScore.quotationModeControls();
    if (qc.fails.length) throw new Error("quotation-mode controls fail: " + qc.fails.join("; "));
  } catch (e) {
    console.error("the leak index could not be built: " + String(e.message).slice(0, 160));
    sources = null;
  }
  for (const { hit, e } of edited) {
    const g = gateReproduction(hit.item, sources, sources ? leakScore : null);
    reGate.push({ task: hit.task_code, pilot: e.pilot, pass: g.pass, reason: g.reason, examined: g.examined });
  }

  console.log("");
  console.log("PILOT DRAFTS  " + (APPLY ? "--apply (WILL WRITE)" : "dry run (default)"));
  console.log("  pilot 3 survivors            " + p3.length);
  console.log("  pilot 2 survivors            " + p2.length);
  console.log("  IN  " + chosen.length + "   (" + chosen.filter((c) => c.pilot === 3).length +
    " from pilot 3, " + chosen.filter((c) => c.pilot === 2).length + " from pilot 2)");
  console.log("  OUT " + dropped.length + " from pilot 2");
  for (const d of dropped) console.log("      #" + d.r.ord + "  " + anchorKey(d.r).padEnd(16) + d.why);
  console.log("");
  console.log("  EDITS APPLIED " + edited.length);
  for (const { hit, e, before, after } of edited) {
    console.log("      pilot " + e.pilot + " task " + hit.task_code + " " + e.field +
      (e.field === "option" ? " " + String.fromCharCode(97 + e.index) : ""));
    console.log("        before: " + before.slice(0, 110));
    console.log("        after : " + after.slice(0, 110));
  }
  console.log("  REPRODUCTION GATE, RE-RUN ON THE EDITED TEXT");
  for (const g of reGate) {
    console.log("      task " + g.task + "  " + (g.pass === null ? "UNASSERTED" : g.pass ? "pass" : "FAIL") +
      "  examined " + g.examined + "  " + String(g.reason || "").slice(0, 90));
  }
  if (reGate.some((g) => g.pass === false)) {
    console.error("");
    console.error("REFUSING: an edited text now reproduces a source. Nothing written.");
    return 2;
  }
  if (reGate.some((g) => g.pass === null)) {
    console.error("");
    console.error("REFUSING: the leak index was not available, so the edited text is UNASSERTED");
    console.error("rather than clean. An edit that has not been re-gated is not ready to write.");
    return 2;
  }

  /* ---- THE REVIEW HAS NOWHERE TO GO YET ---- */
  const cols = await getAll(KEY, "item_grounding?select=question_id&limit=0").then(() => null).catch(() => null);
  const hasReview = await (async () => {
    const r = await fetch(REST_URL + "/item_grounding?select=reviewed_by&limit=1",
      { headers: { apikey: KEY, Authorization: "Bearer " + KEY } });
    return r.ok;
  })();
  console.log("");
  console.log("  item_grounding carries the director's read: " + (hasReview ? "yes" : "NO -- migration 379 is not applied"));
  if (!hasReview) {
    console.log("");
    console.log("  REFUSING TO INSERT. Each row is ruled to get item_grounding, grounding_family, the");
    console.log("  gate record AND the director's read recorded as the review. There is no English");
    console.log("  item review mechanism in this database -- item_translation_reviews is for");
    console.log("  TRANSLATIONS (tr_hash, tr_hash_basis), and reusing it would put two meanings in one");
    console.log("  table, which is the defect this repository already records against en_hash.");
    console.log("  migrations/379_item_grounding_review.sql is written and waiting for Juan.");
    console.log("");
    console.log("  Inserting first and adding the review afterwards would leave drafts in the bank");
    console.log("  with no record of who cleared them, which is the state the ruling exists to avoid.");
    writeFileSync(join(ROOT, "PILOT-DRAFT-INSERT-SET.json"),
      JSON.stringify({
        prepared: "2026-09-27",
        blocked_on: "migrations/379_item_grounding_review.sql",
        in_count: chosen.length,
        out_count: dropped.length,
        edits: edited.map(({ hit, e, before, after }) => ({ pilot: e.pilot, task: hit.task_code, field: e.field, before, after, why: e.why })),
        reproduction_regate: reGate,
        in: chosen.map((c) => ({ pilot: c.pilot, ord: c.ord, task: c.task_code, anchor: c.item.key_support_clause, grounding_family: c.grounding_family })),
        out: dropped.map((d) => ({ ord: d.r.ord, task: d.r.task_code, anchor: d.r.item.key_support_clause, why: d.why })),
      }, null, 1) + "\n", "utf8");
    console.log("  wrote PILOT-DRAFT-INSERT-SET.json -- the exact set, so the insert is a re-run and");
    console.log("  not a re-derivation once 379 is applied.");
    return 1;
  }

  if (!APPLY) {
    console.log("");
    console.log("Nothing written. Re-run with --apply.");
    return 0;
  }
  console.error("the --apply path is unreachable until 379 is applied; refusing to guess its shape");
  return 2;
}
process.exitCode = await main();
