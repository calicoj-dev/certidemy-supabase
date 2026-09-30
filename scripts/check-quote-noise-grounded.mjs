#!/usr/bin/env node
/**
 * check-quote-noise-grounded.mjs -- what `quote-noise` actually finds, now that it is wired.
 *
 * READ-ONLY. Rewrites nothing, re-quotes nothing. Unknown flags exit 2.
 *
 * ============ THE ZERO WAS STRUCTURAL ============
 *
 * `report-rollout-r1.mjs` printed "quote-noise: 0" for R1, R2 and R3, and I offered that zero three times as
 * evidence that the leftover extraction noise was costing nothing. The module was referenced by the census,
 * the served sweep and the reporter -- and by neither grounded-gates.mjs nor the generator. A gate that is
 * never called cannot reject, so its rejection count was necessarily zero.
 *
 * This is the real count: every grounded item, inserted or waiting, run through the now-wired gate.
 *
 * The title-bleed arm needs each passage's own declared title, so the passages are read from the library and
 * an item whose clause is NOT HELD is reported as its own state rather than quietly skipping that arm.
 */
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, getAllIn } from "./_pg.mjs";
import { gateQuoteNoise, quoteNoiseControls } from "./lib/quote-noise.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const idOf = (t) => createHash("sha256").update(String(t || "").replace(/\s+/g, " ").trim())
  .digest("hex").slice(0, 8);

console.log("CONTROLS");
const ctl = quoteNoiseControls({ quiet: true });
for (const f of ctl.fails) console.log("  FAIL " + f);
console.log("  " + (ctl.examined - ctl.fails.length) + " of " + ctl.examined + " pass" +
  "   (including the five spans that reached survivor status)");
if (ctl.fails.length) { process.exitCode = 1; process.exit(); }
console.log("");

/* the library's titles, for the bleed arm */
const KEY = requireKey(HERE);
const sp = await getAll(KEY, "source_passages?select=source_id,clause,title&order=clause");
const titleOf = (clause) => {
  const hit = sp.find((p) => String(p.clause) === String(clause));
  return hit ? hit.title : null;
};
const heldClauses = new Set(sp.map((p) => String(p.clause)));

/* ---- the population: both sides of insertion ---- */
const ig = await getAll(KEY, "item_grounding?select=question_id,key_support,key_support_clause&order=question_id");
const q = await getAllIn(KEY, "quiz_questions", "id,question_text,task_id", "id",
  ig.map((g) => g.question_id), "&order=id");
const qById = new Map(q.map((r) => [r.id, r]));
const tasks = await getAll(KEY, "tasks?select=id,code&order=code");
const taskCode = new Map(tasks.map((t) => [t.id, t.code]));

const pop = [];
const insertedStems = new Set();
for (const g of ig) {
  const row = qById.get(g.question_id);
  if (!row) continue;
  insertedStems.add(idOf(row.question_text));
  pop.push({ where: "INSERTED", id: idOf(row.question_text), task: taskCode.get(row.task_id) || "?",
    item: { key_support: g.key_support, key_support_clause: g.key_support_clause } });
}
const FILES = ["AIMSF-ROLLOUT-B2.json", "AIMSF-R2-PROBE.json", "AIMSF-R2-REST.json",
  "AIMSF-R3-PROBE.json", "AIMSF-R3-REST.json"];
const seen = new Set();
for (const f of FILES) {
  const p = join(ROOT, f);
  if (!existsSync(p)) continue;
  for (const r of JSON.parse(readFileSync(p, "utf8")).items || []) {
    if (r.verdict !== "survivor") continue;
    const id = r.item_id || idOf(r.item.question_text);
    if (insertedStems.has(id) || seen.has(id)) continue;
    seen.add(id);
    pop.push({ where: "WAITING", id, task: r.task_code, item: r.item });
  }
}

let fired = 0, unasserted = 0, unheld = 0;
const hits = [];
for (const r of pop) {
  const clause = String(r.item.key_support_clause || "");
  if (clause && !heldClauses.has(clause)) unheld++;
  const v = gateQuoteNoise(r.item, titleOf);
  if (v.pass === null) { unasserted++; continue; }
  if (v.pass) continue;
  fired++;
  hits.push({ ...r, reason: v.reason });
}
console.log("POPULATION");
console.log("  inserted grounded items   " + pop.filter((x) => x.where === "INSERTED").length);
console.log("  waiting survivors         " + pop.filter((x) => x.where === "WAITING").length);
console.log("  clauses NOT held by the library  " + unheld +
  "   (the title-bleed arm cannot run on those -- their own state, not a pass)");
console.log("");
console.log("QUOTE-NOISE, NOW THAT IT IS WIRED: " + fired + " of " + (pop.length - unasserted) + " fire" +
  (unasserted ? "   (" + unasserted + " UNASSERTED -- no support span)" : ""));
console.log("  the reporter printed 0 for R1, R2 and R3, and that zero was structural");
console.log("");
for (const h of hits) {
  console.log("  " + h.id + "  " + String(h.task).padEnd(5) + h.where.padEnd(10) +
    (h.item.key_support_clause || "?"));
  console.log("      " + h.reason);
  console.log("      " + String(h.item.key_support).replace(/\s+/g, " ").slice(0, 130));
  console.log("");
}
console.log("NOTHING RE-QUOTED, NOTHING REJECTED. This is the count; the re-quoting is a separate step and");
console.log("each item needs a clean span of its OWN passage or it is rejected outright.");
