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
 *
 * ============ AND A SURVIVOR AWAITING A READ IS AN ITEM THE CAP MUST SEE. RULED PROMPT-97 ADDENDUM s1 ============
 *
 * The census counted INSERTED and KEPT and nothing else, so an artifact whose survivors were written but not
 * yet read was invisible to it. R4 and R5 both drew task 1.2 before either was inserted:
 *
 *   R4 put 2 items on A.3.2 and 2 on A.10.2, and sat in an artifact awaiting the director's read
 *   R5 asked the census how full 1.2's clauses were, was told ZERO, and put 2 more on each
 *   task 1.2 ended with EIGHT items on TWO clauses -- four times the cap
 *
 * The same happened on 2.4 (A.10.2) and 3.4 (A.10.3), and it is the finding behind most of the director's
 * rejections: **the items were not bad, they were surplus**, and the surplus was manufactured by a census
 * that could only see rows and the run in front of it.
 *
 * THE CAP IS A PROPERTY OF A FORM, SO IT MUST COUNT EVERYTHING THAT WILL SIT ON ONE. An item awaiting a read
 * is on its way to the bank; treating it as absent is the same error as a per-span floor that cannot see a
 * sum, and it costs a writer call per surplus item.
 *
 * WHAT IS EXCLUDED, AND WHY EACH:
 *
 *   already inserted   its anchor is in `item_grounding` -- counting the artifact too would DOUBLE it, which
 *                      would refuse correct generation. The link is the stem id, `lib/item-id.mjs`.
 *   rejected           a rejected item will never sit on a form. Read from the standing rejections file AND
 *                      from each artifact's own reject verdicts, unioned: a rejection dropped from either
 *                      source must still count as rejected, and a union cannot lose one.
 *   non-survivors      the gates already refused them.
 *
 * NOTHING IS EXCLUDED FOR BEING OLD. An artifact with no disposition is PENDING however long it has sat --
 * "probably inserted by now" is exactly the assumption that produced the 1.2 case.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { census } from "./anchor-cap.mjs";
import { itemIdOfStem } from "./item-id.mjs";
import { resolveDispositions } from "./item-disposition.mjs";

import { anchorLayers } from "./anchor-layers.mjs";

/**
 * @param excludeArtifacts  artifact filenames whose survivors must NOT be counted in the awaiting layer.
 *
 * ============ AN INSERT MUST NOT BE REFUSED BY ITS OWN PRESENCE IN THE CENSUS ============
 *
 * The awaiting layer counts survivors on their way to the bank -- which includes, at insert time, the exact
 * items being inserted. `applyCap` then adds each survivor to the same census, so every item would be counted
 * TWICE and a task at the cap would refuse the items the director accepted.
 *
 * Measured before this argument existed: task 3.4's A.10.3 read 3 against a cap of 2, of which one was the
 * accepted item itself and one a reserve. Inserting it would have been refused for being already there.
 *
 * So the caller passes the artifact it is inserting FROM, and this layer skips it. Generation passes nothing,
 * because a run's own survivors are not in any artifact yet.
 */
export async function buildCapCensus({ KEY, getAll, certId, tasks, ROOT, cert, excludeArtifacts = [] }) {
  const entriesByTask = new Map();
  const add = (code, source, clause) => {
    if (!code || !clause) return;
    if (!entriesByTask.has(code)) entriesByTask.set(code, []);
    entriesByTask.get(code).push({ source_id: source, clause });
  };

  /* ---- inserted rows: item_grounding is authoritative ---- */
  const ig = await getAll(KEY,
    "item_grounding?select=question_id,key_support_clause,source_id&order=question_id");
  /* `question_text` is selected for the AWAITING layer below: the artifact-to-bank link is the stem id, and
   * without it every artifact survivor would look un-inserted. ONE unbroken select literal -- a concatenated
   * one collapses the row type. */
  const qs = await getAll(KEY,
    "quiz_questions?select=id,task_id,question_text&certification_id=eq." + certId + "&language=eq.en&order=id");
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

  /* ---- survivors awaiting a read: written, gated, not inserted and not disposed ---- */
  let fromAwaiting = 0, awaitingDetail = [];
  if (cert === "AIMS-F") {
    /* the stem ids of every grounded English row in the bank. `item_grounding` says what an INSERTED item
     * anchors on; this says WHICH artifact items are already inserted, which is the different question the
     * double-count turns on. */
    const insertedStems = new Set();
    for (const q of qs) insertedStems.add(itemIdOfStem(q.question_text));
    const { awaiting, counts, withdrawn } = resolveDispositions(ROOT, { insertedStems });
    const skip = new Set(excludeArtifacts.filter(Boolean));
    for (const a of awaiting) {
      if (skip.has(a.file)) continue;           /* the caller adds these at gate time */
      if (!a.task || !a.clause) continue;       /* no anchor recorded: nothing to count it against */
      add(a.task, "ISO/IEC 42001", a.clause);
      fromAwaiting++;
      awaitingDetail.push(a.task + " " + a.clause + " " + a.id.slice(0, 8) + " (" + a.file + ")");
    }
    awaitingDetail = { rows: awaitingDetail, counts, withdrawn: [...withdrawn.keys()],
      excluded: [...skip] };
  }

  const byTask = new Map();
  for (const [code, entries] of entriesByTask) byTask.set(code, census(entries));
  return { byTask, fromInserted, fromKept, fromAwaiting, awaitingDetail, unknownAnchor };
}
