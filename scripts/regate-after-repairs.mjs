#!/usr/bin/env node
/**
 * READ-ONLY, NO MODEL CALLS. Re-gate every item anchored to a REPAIRED passage, live or in an
 * artifact, and report the ones that now fail.
 *
 * Ruled PROMPT-116 s1. A repair shortens a passage, so any quote taken from the removed text stops
 * being verbatim. The items are not fixed here: they are LISTED, because a failing item is a content
 * decision and this is an instrument.
 *
 * THE CLAUSE LIST IS DERIVED from PASSAGE-REPAIRS.json, not retyped: a repair that nobody re-gates is
 * the whole risk this script exists for, and a hand-kept list is how one gets missed.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { buildGateContext } from "./lib/gate-context.mjs";
import { runCodeGates } from "./lib/grounded-gates.mjs";
import { gateItemOf } from "./lib/stored-item.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". This script takes none. READ-ONLY, no model calls.");
  process.exit(2);
}
const recPath = join(ROOT, "PASSAGE-REPAIRS.json");
if (!existsSync(recPath)) { console.error("no PASSAGE-REPAIRS.json: nothing has been repaired."); process.exit(2); }
const repairs = JSON.parse(readFileSync(recPath, "utf8")).repairs || [];
const repaired = new Set(repairs.map((r) => r.source_id + "|" + r.edition + "|" + r.clause));
console.log("REGATE AFTER REPAIRS   " + repairs.length + " repaired passage(s)");
for (const r of repairs) {
  console.log("  " + r.source_id + " " + r.edition + " " + r.clause +
    "   " + r.words_before + "w -> " + r.words_after + "w   " + r.ruled_in);
}

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&order=code");
const grounding = await getAll(KEY,
  "item_grounding?select=question_id,source_id,edition,key_support_clause,review_verdict&order=question_id");
const touchedIds = new Set(grounding
  .filter((g) => repaired.has(String(g.source_id) + "|" + String(g.edition) + "|" + String(g.key_support_clause)))
  .map((g) => g.question_id));
console.log("");
console.log("LIVE ITEMS anchored to a repaired passage: " + touchedIds.size);

let liveFails = 0;
for (const c of certs) {
  const rows = await getAll(KEY, "quiz_questions?select=id,question_text,options,correct_answer,explanation," +
    "task_id,language,status,pool,retired_at&certification_id=eq." + c.id + "&language=eq.en&retired_at=is.null&order=id");
  const mine = rows.filter((r) => touchedIds.has(r.id));
  if (!mine.length) continue;
  const ctx = await buildGateContext(KEY, c.code);
  console.log("");
  console.log("  " + c.code + "   " + mine.length + " item(s)");
  for (const r of mine) {
    let v;
    try { v = ctx.gateRow(r); } catch (e) { console.log("    " + r.id.slice(0, 8) + "  could not gate: " + e.message.slice(0, 80)); continue; }
    const g = grounding.find((x) => x.question_id === r.id);
    const bad = !v.passed;
    if (bad) liveFails++;
    console.log("    " + r.id.slice(0, 8) + "  " + String(g.key_support_clause).padEnd(10) +
      " status=" + String(r.status).padEnd(14) + (bad ? "NOW FAILS [" + v.failed.join(",") + "]" : "still passes"));
  }
}

/* artifacts in the repo root: any JSON with an `items` array carrying `item` objects */
console.log("");
console.log("ARTIFACT ITEMS anchored to a repaired passage:");
let artFails = 0;
const ctxCache = new Map();
for (const f of readdirSync(ROOT)) {
  if (!/^(ISMSF|AIMSF)-R\d+$/.test(f)) continue;
  let j;
  try { j = JSON.parse(readFileSync(join(ROOT, f), "utf8")); } catch { continue; }
  const code = /^ISMSF/.test(f) ? "ISMS-F" : "AIMS-F";
  const survivors = (j.items || []).filter((x) => x.verdict === "survivor");
  for (const it of (j.items || [])) {
    const o = it.item || {};
    const sig = String(o.source_id) + "|" + String(o.edition) + "|" + String(o.key_support_clause);
    if (!repaired.has(sig)) continue;
    if (!ctxCache.has(code)) ctxCache.set(code, await buildGateContext(KEY, code));
    const ctx = ctxCache.get(code);
    const map = ctx.mapByTask.get(ctx.taskIdOfCode.get(it.task_code)) || { primary: [], supporting: [] };
    const v = runCodeGates({ ...o }, { passagesByKey: ctx.index, annexGaps: ctx.annexGaps,
      sequenceGaps: ctx.sequenceGaps, cert: code, cueCfg: ctx.cueCfg,
      primaryClauses: map.primary, supportingClauses: map.supporting,
      sources: ctx.sources, leak: ctx.leak,
      liveStemsForTask: (ctx.liveByTask && ctx.liveByTask.get(ctx.taskIdOfCode.get(it.task_code))) || [],
      assignedAnchor: it.assigned || null });
    const n = survivors.indexOf(it) + 1;
    if (!v.passed) artFails++;
    console.log("  " + f + "  " + it.item_id + (n > 0 ? " (#" + n + ")" : "") +
      "  " + String(o.key_support_clause).padEnd(10) + (v.passed ? "still passes"
        : "NOW FAILS [" + v.failed.join(",") + "]"));
  }
}
console.log("");
console.log("  live items now failing     " + liveFails);
console.log("  artifact items now failing " + artFails);
console.log("  These are LISTED, not fixed: a failing item is a content decision.");
