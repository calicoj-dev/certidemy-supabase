#!/usr/bin/env node
/* Read-only. Prints the full gate verdict and the item for each refused id. */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { itemIdOfStem } from "./lib/item-id.mjs";
import { buildGateContext } from "./lib/gate-context.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const WANT = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!WANT.length) { console.error("usage: diagnose-approval-refusals.mjs <id8>..."); process.exit(2); }
const KEY = requireKey(HERE);
const ctx = await buildGateContext(KEY, "AIMS-F");
const ig = new Map((await getAll(KEY, "item_grounding?select=question_id,key_support_clause,source_id,edition" +
  "&order=question_id")).map((g) => [g.question_id, g]));

for (const row of ctx.rows) {
  const id8 = itemIdOfStem(row.question_text);
  if (!WANT.includes(id8)) continue;
  const v = ctx.gateRow(row);
  const g = ig.get(row.id) || {};
  console.log("\n==== " + id8 + "   task " + ctx.codeOfTask.get(row.task_id) +
    "   " + g.source_id + " " + g.edition + " cl." + g.key_support_clause);
  console.log("  passed=" + v.passed + "  FAILED[" + v.failed.join(",") + "]");
  for (const gt of v.gates || []) {
    if (gt.pass === true) continue;
    console.log("  gate " + gt.id + "  pass=" + gt.pass + "  " + String(gt.reason || "").slice(0, 400));
  }
  console.log("  STEM: " + String(row.question_text).replace(/\s+/g, " ").slice(0, 260));
  for (const o of row.options || []) {
    console.log("    " + o.id + (o.id === row.correct_answer ? " *" : "  ") + " (" +
      String(o.text || "").length + "c) " + String(o.text || "").replace(/\s+/g, " ").slice(0, 190));
  }
}
