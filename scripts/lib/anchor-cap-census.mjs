/**
 * anchor-cap-census.mjs -- build the within-task anchor census the cap is applied against.
 *
 * Separate from anchor-cap.mjs because that module is pure arithmetic with no I/O and is unit-tested as
 * such; this one reaches the database and the audit artifacts. Keeping them apart means the cap's controls
 * need no fixtures for `item_grounding`.
 *
 * ============ WHAT COUNTS, RULED PROMPT-86 SECTION 3 ============
 *
 *   items the audit KEPT, items already inserted as pending_review, and the current run's survivors.
 *
 * The third is the caller's, applied at gate time. The first two are here.
 *
 * Anchors of inserted rows come from `item_grounding`, which is the authoritative record of what an
 * inserted item rests on. Kept items' anchors come from the audit artifacts, merged in layer order.
 *
 * A KEPT ITEM WHOSE ANCHOR WAS NEVER RECORDED IS COUNTED AS UNKNOWN AND RETURNED AS A NUMBER, never
 * silently skipped: it could be sitting on a clause that is already full, and an absence read as a zero is
 * the defect this repository opens with.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { census } from "./anchor-cap.mjs";

import { anchorLayers } from "./anchor-layers.mjs";

export async function buildCapCensus({ KEY, getAll, certId, tasks, ROOT, cert }) {
  const entriesByTask = new Map();
  const add = (code, source, clause) => {
    if (!code || !clause) return;
    if (!entriesByTask.has(code)) entriesByTask.set(code, []);
    entriesByTask.get(code).push({ source_id: source, clause });
  };

  /* ---- inserted rows: item_grounding is authoritative ---- */
  const ig = await getAll(KEY,
    "item_grounding?select=question_id,key_support_clause,source_id&order=question_id");
  const qs = await getAll(KEY,
    "quiz_questions?select=id,task_id&certification_id=eq." + certId + "&language=eq.en&order=id");
  const taskOfQuestion = new Map(qs.map((r) => [r.id, r.task_id]));
  const codeOfTaskId = new Map(tasks.map((t) => [t.id, t.code]));
  let fromInserted = 0;
  for (const g of ig) {
    const code = codeOfTaskId.get(taskOfQuestion.get(g.question_id));
    if (!code) continue;               /* another certification's row */
    add(code, g.source_id, g.key_support_clause);
    fromInserted++;
  }

  /* ---- kept audit items ---- */
  let fromKept = 0, unknownAnchor = [];
  const survPath = join(ROOT, "AIMSF-SURVIVORS.json");
  if (cert === "AIMS-F" && existsSync(survPath)) {
    const surv = JSON.parse(readFileSync(survPath, "utf8"));
    const anchorOf = new Map(), taskOfPrefix = new Map();
    for (const f of anchorLayers(ROOT)) {
      const p = join(ROOT, f);
      if (!existsSync(p)) continue;
      for (const it of (JSON.parse(readFileSync(p, "utf8")).items || [])) {
        if (it.anchor && it.anchor.clause) anchorOf.set(it.prefix, it.anchor.clause);
        taskOfPrefix.set(it.prefix, it.task);
      }
    }
    for (const pre of (surv.keep_ids || [])) {
      const cl = anchorOf.get(pre);
      if (!cl) { unknownAnchor.push(pre); continue; }
      add(taskOfPrefix.get(pre), "ISO/IEC 42001", cl);
      fromKept++;
    }
  }

  const byTask = new Map();
  for (const [code, entries] of entriesByTask) byTask.set(code, census(entries));
  return { byTask, fromInserted, fromKept, unknownAnchor };
}
