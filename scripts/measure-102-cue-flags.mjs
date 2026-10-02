#!/usr/bin/env node
/* Firing count for PROMPT-102's two new gateStructure flags, over the live AIMS-F grounded bank.
 * READ-ONLY. Required in the same commit as the gates: too many fires is a design error. */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { gateStructure } from "./lib/grounded-gates.mjs";
import { gateItemOf, id8, storedItemControls } from "./lib/stored-item.mjs";

for (const a of process.argv.slice(2)) { console.error("Unrecognised flag: " + a + ". This script is read-only."); process.exit(2); }
const KEY = requireKey(dirname(fileURLToPath(import.meta.url)));
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F"))[0];
const ig = new Set((await getAll(KEY, "item_grounding?select=question_id")).map((g) => g.question_id));
const qs = (await getAll(KEY,
  "quiz_questions?select=id,question_text,options,correct_answer,task_id&certification_id=eq." + cert.id +
  "&language=eq.en&retired_at=is.null&order=id")).filter((q) => ig.has(q.id));

const ctl = storedItemControls();
if (ctl.fails.length) { console.error("ADAPTER CONTROLS FAILED: " + ctl.fails.join("; ")); process.exit(2); }
if (!qs.length) { console.error("EXTRACTION EMPTY -- no grounded rows found. Not a pass."); process.exit(2); }

let len = 0, odd = 0, both = 0;
const lenRows = [], oddRows = [];
for (const q of qs) {
  const r = gateStructure(gateItemOf(q));
  const n = r.notes || [];
  const L = n.some((x) => /length cue/.test(x));
  const O = n.some((x) => /odd-one-out \(approx\)/.test(x));
  if (L) { len++; lenRows.push(id8(q) + "  " + n.find((x) => /length cue/.test(x))); }
  if (O) { odd++; oddRows.push(id8(q) + "  " + n.find((x) => /odd-one-out/.test(x))); }
  if (L && O) both++;
}
const pct = (k) => ((k / qs.length) * 100).toFixed(1) + "%";
console.log("PROMPT-102 CUE FLAGS -- firing count over the live AIMS-F grounded bank");
console.log("  DENOMINATOR        " + qs.length + " grounded English rows examined");
console.log("  length cue         " + len + "  " + pct(len));
console.log("  odd-one-out approx " + odd + "  " + pct(odd));
console.log("  both               " + both);
console.log("");
console.log("LENGTH CUE members:");
for (const r of lenRows) console.log("  " + r);
console.log("");
console.log("ODD-ONE-OUT members (first 15):");
for (const r of oddRows.slice(0, 15)) console.log("  " + r);
if (oddRows.length > 15) console.log("  ... and " + (oddRows.length - 15) + " more");
console.log("");
console.log("Both are FLAGS: they travel with the item and refuse nothing.");
