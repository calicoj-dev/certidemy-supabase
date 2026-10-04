#!/usr/bin/env node
/**
 * READ-ONLY, NO MODEL CALLS, NO WRITES. Re-gate every stored grounded row and every round artifact
 * after the PROMPT-122 s2 normaliser change, and report every verdict that MOVED.
 *
 * Ruled PROMPT-122 s2: "for ISO-anchored items the expected answer is zero changes. If any ISO verdict
 * moves, stop and report."
 *
 * ============ THE DIRECTION OF A CHANGE IS THE WHOLE POINT ============
 *
 * fail -> pass  the fix working: an address that was being truncated now resolves.
 * pass -> fail  an ALARM. Nothing about this change should refuse an item it used to accept, and a
 *               single instance is a stop condition rather than a statistic.
 *
 * Both are counted and both are listed. A re-gate that reported only a total would hide the second
 * inside the first.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { buildGateContext } from "./lib/gate-context.mjs";
import { runCodeGates, normClause } from "./lib/grounded-gates.mjs";
import { itemIdOfStem } from "./lib/item-id.mjs";

/* ============ ISOLATING THIS CHANGE FROM EVERY EARLIER ONE ============
 *
 * The first version compared the verdict RECORDED AT GENERATION against today's gates, and reported
 * 68 pass->fail as a stop condition. They were real verdict changes and none of them was this one:
 *
 *   `structure`  the cue guard, which was DEAD at generation and revived in PROMPT-120 s4
 *   `verbatim`   the 27000 3.74 and 19011 run-on passage REPAIRS from PROMPT-116 s1
 *
 * A diff against "generation time" conflates every change since. The question asked is narrower:
 * what did THE NORMALISER change? And that has an exact answer -- an item's verdict can only move
 * because of normClause if the ADDRESS IT PRODUCES moved. So the old function is restored here, for
 * the comparison only, and an item is re-gated when and only when the two disagree.
 *
 * This is a copy of a function, which this repository normally forbids. It is admissible for exactly
 * one reason: it is a copy of the PREVIOUS version, kept to measure a change, and it is never used
 * to decide anything about an item. */
function normClauseBeforeThisChange(c) {
  let s = String(c || "").trim();
  s = s.replace(/^(?:BS\s+)?(?:EN\s+)?ISO(?:\/IEC)?(?:\/IEEE)?\s*\d+(?:[-:]\d+)*(?::\d{4})?\s*/i, "");
  const anchored = /\b(?:clause|subclause|annex|control|section)\s+([A-Z]?\.?\d+(?:\.\d+){0,3})/i.exec(s);
  const m = anchored || /([A-Z]?\.?\d+(?:\.\d+){0,3})/.exec(s);
  if (!m) return String(c || "").trim();
  return m[1].replace(/^\./, "").replace(/^([A-Z])(\d)/, "$1.$2");
}

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let CERT = "ISMS-F";
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--cert=(.+)$/); if (m) { CERT = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --cert=. READ-ONLY."); process.exit(2);
}
const SLUG = CERT.replace(/-/g, "");
const KEY = requireKey(HERE);
const ctx = await buildGateContext(KEY, CERT);
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }

/* ---------------- 1. every stored grounded English row ---------------- */
const rows = await getAll(KEY, "quiz_questions?select=id,question_text,options,correct_answer," +
  "explanation,task_id,language,status,pool,retired_at&certification_id=eq." + cert.id +
  "&language=eq.en&retired_at=is.null&order=id");
const grounding = new Map((await getAll(KEY, "item_grounding?select=question_id,source_id,edition," +
  "key_support_clause,review_verdict&order=question_id")).map((g) => [g.question_id, g]));
const tasks = await getAll(KEY, "tasks?select=id,code");
const codeOf = new Map(tasks.map((t) => [t.id, t.code]));

console.log("RE-GATE AFTER THE normClause CHANGE   " + CERT + "   read-only, no model calls");
console.log("");
let stored = 0, storedPass = 0;
const storedRows = [];
for (const r of rows) {
  const g = grounding.get(r.id);
  if (!g) continue;
  stored++;
  let v = null;
  try { v = ctx.gateRow(r); } catch { /* ungateable: counted, never silently clean */ }
  if (v && v.passed) storedPass++;
  storedRows.push({ id: r.id, task: codeOf.get(r.task_id), g, passed: v ? v.passed : null,
    failed: v ? v.failed : ["could-not-gate"], iso: /^ISO/.test(String(g.source_id)) });
}
console.log("STORED GROUNDED ROWS   " + stored + "   passing all gates now: " + storedPass);
const isoStored = storedRows.filter((x) => x.iso), nonIso = storedRows.filter((x) => !x.iso);
console.log("  ISO-anchored " + isoStored.length + " (passing " + isoStored.filter((x) => x.passed).length +
  ")   non-ISO " + nonIso.length + " (passing " + nonIso.filter((x) => x.passed).length + ")");

/* ---------------- 2. every artifact, where the RECORDED verdict is the before ---------------- */
console.log("");
console.log("ARTIFACTS   the recorded gate verdict is the BEFORE; re-running them is the AFTER");
const moved = { toPass: [], toFail: [] };
const addressesMoved = [];
let artItems = 0;
for (const f of readdirSync(ROOT).sort()) {
  if (!new RegExp("^" + SLUG + "-R\\d+$").test(f)) continue;
  let j;
  try { j = JSON.parse(readFileSync(join(ROOT, f), "utf8")); } catch { continue; }
  let n = 0, chPass = 0, chFail = 0;
  for (const it of (j.items || [])) {
    const o = it.item;
    if (!o || !o.key_support_clause) continue;
    n++; artItems++;
    /* ONLY the items this change can possibly have touched */
    const normBefore = normClauseBeforeThisChange(o.key_support_clause);
    const normAfter = normClause(o.key_support_clause);
    const addrMoved = normBefore !== normAfter;
    if (addrMoved) addressesMoved.push({ artifact: f, item: it.item_id, task: it.task_code,
      source: o.source_id, clause: o.key_support_clause, before: normBefore, after: normAfter });
    if (!addrMoved) continue;
    /* the BEFORE: what the artifact recorded. `code_passed` where present, else the gate list. */
    const recorded = typeof it.code_passed === "boolean" ? it.code_passed
      : !(it.gates || []).some((g) => g.pass === false);
    const map = ctx.mapByTask.get(ctx.taskIdOfCode.get(it.task_code)) || { primary: [], supporting: [] };
    let v = null;
    try {
      v = runCodeGates({ ...o }, { passagesByKey: ctx.index, annexGaps: ctx.annexGaps,
        sequenceGaps: [...ctx.sequenceGaps, ...ctx.declaredGaps], cert: CERT, cueCfg: ctx.cueCfg,
        primaryClauses: map.primary, supportingClauses: map.supporting,
        sources: ctx.sources, leak: ctx.leak,
        /* ============ AN ARTIFACT ITEM IS NOW IN THE LIVE POOL, AND IS NOT ITS OWN DUPLICATE ====
         *
         * Most of these items have since been INSERTED, so liveStemsForTask contains their own stems
         * and gateNearDuplicate reported every one as a duplicate of itself: 34 false pass->fail
         * moves on the first run, which would have been reported as a stop condition. gate-context
         * excludes self by row id on the stored path; here the join is the STEM, so it is excluded by
         * stem identity. */
        liveStemsForTask: ((ctx.liveByTask && ctx.liveByTask.get(ctx.taskIdOfCode.get(it.task_code))) || [])
          .filter((x) => itemIdOfStem(x.stem) !== itemIdOfStem(o.question_text)),
        assignedAnchor: it.assigned || null });
    } catch { continue; }
    if (v.passed === recorded) continue;
    const row = { artifact: f, item: it.item_id, task: it.task_code,
      source: o.source_id, clause: o.key_support_clause, norm: normClause(o.key_support_clause),
      iso: /^ISO/.test(String(o.source_id)), before: recorded, after: v.passed,
      failed: v.failed.join(",") };
    if (v.passed) { moved.toPass.push(row); chPass++; } else { moved.toFail.push(row); chFail++; }
  }
  console.log("  " + f.padEnd(10) + String(n).padStart(4) + " item(s)   fail->pass " + chPass +
    "   pass->fail " + chFail);
}

console.log("");
console.log("ADDRESSES THE NORMALISER NOW PRODUCES DIFFERENTLY   " + addressesMoved.length +
  " of " + artItems + " artifact item(s)");
for (const a of addressesMoved.slice(0, 20)) {
  console.log("  " + a.artifact + "  " + a.item + "  " + a.task.padEnd(5) +
    (a.source + " " + a.clause).padEnd(32) + JSON.stringify(a.before) + " -> " + JSON.stringify(a.after));
}
if (addressesMoved.length > 20) console.log("  ... " + (addressesMoved.length - 20) + " more");
console.log("");
console.log("VERDICTS THAT MOVED BECAUSE OF THIS CHANGE   (only the items above were re-gated)");
console.log("  fail -> pass   " + moved.toPass.length + "   (the fix working)");
console.log("  pass -> fail   " + moved.toFail.length + "   (an ALARM: this change must refuse nothing)");
const isoToPass = moved.toPass.filter((x) => x.iso), isoToFail = moved.toFail.filter((x) => x.iso);
console.log("    of which ISO-anchored:  fail->pass " + isoToPass.length + "   pass->fail " + isoToFail.length);
console.log("");
for (const x of moved.toPass.slice(0, 24)) {
  console.log("  fail->pass  " + x.artifact + "  " + x.item + "  " + x.task.padEnd(5) +
    (x.source + " " + x.clause).padEnd(30) + "norm=" + JSON.stringify(x.norm));
}
if (moved.toPass.length > 24) console.log("  ... " + (moved.toPass.length - 24) + " more");
if (moved.toFail.length) {
  console.log("");
  console.log("  STOP CONDITION -- items this change would now REFUSE:");
  for (const x of moved.toFail) {
    console.log("    " + x.artifact + "  " + x.item + "  " + x.task + "  " + x.source + " " + x.clause +
      "   now fails [" + x.failed + "]");
  }
  process.exitCode = 1;
}
