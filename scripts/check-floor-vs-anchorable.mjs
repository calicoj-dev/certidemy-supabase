#!/usr/bin/env node
/**
 * check-floor-vs-anchorable.mjs -- is every task's floor REACHABLE by generation?
 *
 * READ-ONLY. No writes, no model calls. Unknown flags exit 2.
 *
 * ============ FOUND BY THE ANCHOR ASSIGNMENT, PROMPT-96 s4 ============
 *
 * The assignment reported task 1.2 as having **2 eligible primaries and a capacity of 4** against a shortfall
 * of 6, while `AIMSF-ROLLOUT-SHORTFALL.json` records its effective primaries as **7**. Two instruments, one
 * property, a factor of three apart -- which this repository treats as a defect in one of them until
 * identified, never as a parameter.
 *
 * BOTH ARE RIGHT, AND THEY ARE COUNTING DIFFERENT THINGS:
 *
 *   rollout-shortfall  counts effective primaries across EVERY source a task links to, each judged inside
 *                      its own document. That is the honest answer to "how many distinct passages does this
 *                      task examine against".
 *   the generator      can only anchor in ONE standard -- `passagesByKey` is filtered to the mapping's
 *                      standard and edition -- so a primary from ISO/IEC 22989 or the EU AI Act is a passage
 *                      the writer is never shown and `clause-exists` would refuse.
 *
 * SO A FLOOR DERIVED FROM THE FIRST COUNT CAN BE UNREACHABLE BY THE SECOND, and nothing said so. A task whose
 * floor is 8 on seven cross-source primaries but which can hold at most 4 items under the cap is not short by
 * four items of generation -- it is short by a map change or a floor change, and the difference is what a
 * generation run is worth.
 *
 * THIS IS THE `mean_key_margin` SHAPE: a number measured over one population and asserted of another. The
 * fix is the same -- name the population in the answer.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { CAP, anchorKey } from "./lib/anchor-cap.mjs";
import { buildCapCensus } from "./lib/anchor-cap-census.mjs";
import { classifyPrimaries } from "./lib/effective-primary.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". This script is READ-ONLY and takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KEY = requireKey(HERE);

const CERT = "AIMS-F";
/* the SAME mapping file the generator reads, by the same name pattern -- a second path for one fact is how
 * two instruments come to disagree about which standard a run anchors in. */
const MAP = JSON.parse(readFileSync(join(ROOT, CERT + "-TASK-SOURCES.json"), "utf8"));
const STANDARD = MAP.standard, EDITION = MAP.edition;
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const SF = JSON.parse(readFileSync(join(ROOT, "AIMSF-ROLLOUT-SHORTFALL.json"), "utf8"));
const sfOf = new Map(SF.per_task.map((r) => [r.code, r]));

/* the generator's own view: this standard and edition only */
const inRun = new Map(lib.passages.filter((p) => p.source_id === STANDARD && p.edition === EDITION)
  .map((p) => [p.clause, p]));
const libByKey = new Map(lib.passages.map((p) => [p.source_id + "|" + p.edition + "|" + p.clause, p]));
const clausesBySource = new Map();
for (const p of lib.passages) {
  if (!clausesBySource.has(p.source_id)) clausesBySource.set(p.source_id, []);
  clausesBySource.get(p.source_id).push(p.clause);
}

const certs = await getAll(KEY, "certifications?select=id,code&code=eq." + CERT);
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code&order=code"))
  .filter((t) => t.certification_id === certs[0].id);
const sp = await getAll(KEY, "source_passages?select=id,source_id,edition,clause&order=id");
const byId = new Map(sp.map((p) => [p.id, p]));
const ts = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id,passage_id");
const primOf = new Map();
for (const r of ts) {
  if (r.role !== "primary") continue;
  const p = byId.get(r.passage_id);
  if (!p) continue;
  if (!primOf.has(r.task_id)) primOf.set(r.task_id, []);
  primOf.get(r.task_id).push(p);
}

/* ============ THE BINDING NUMBER IS THE ASSIGNMENT'S, NOT THIS FILE'S ARITHMETIC ============
 *
 * The first version printed `CAP x eff-in-run` and called it the ceiling, with a footnote saying the
 * assignment's own `capacity` is lower. Then it answered **reachable? yes** for task 1.2 while the
 * assignment was refusing two of its six items -- two instruments, one property, opposite answers, with the
 * disagreement demoted to a footnote nobody reads past the yes.
 *
 * `CAP x eff-in-run` ignores what those clauses ALREADY HOLD. The assignment does not, and it is the thing
 * that actually decides. So both columns are printed, the BINDING one carries the verdict, and the upper
 * bound stays only to show how much of the gap is the cap rather than the map. */
const capInfo = await buildCapCensus({ KEY, getAll, certId: certs[0].id, tasks, ROOT, cert: CERT });

const rows = [];
for (const t of tasks) {
  const ps = primOf.get(t.id) || [];
  const bySource = {};
  const cen = capInfo.byTask.get(t.code) || new Map();
  let effAnySource = 0, effInRun = 0, binding = 0;
  for (const p of ps) {
    bySource[p.source_id] = (bySource[p.source_id] || 0) + 1;
    const full = libByKey.get(p.source_id + "|" + p.edition + "|" + p.clause);
    const [one] = classifyPrimaries([p.clause], () => full, clausesBySource.get(p.source_id) || []);
    if (!one.effective) continue;
    effAnySource++;
    /* PROMPT-102 s2: ANCHORABLE now means HELD, in any mapped source. The generator's single-standard
     * filter is gone, so "in run" is every effective primary whose passage the library holds. */
    if (full) {
      effInRun++;
      binding += Math.max(0, CAP - (cen.get(anchorKey(p.source_id, p.edition, p.clause)) || 0));
    }
  }
  const sf = sfOf.get(t.code) || {};
  rows.push({ code: t.code, primaries: ps.length, bySource, effAnySource, effInRun,
    sfEffective: sf.effective, floor: sf.floor, have: sf.have, shortfall: sf.shortfall,
    /* UPPER BOUND: the cap times the in-run effective primaries, ignoring what those clauses hold. */
    ceilingFromMap: CAP * effInRun,
    /* BINDING: the same sum with the existing census subtracted per clause -- what the assignment will
     * actually carry, and therefore what the verdict is taken from. */
    binding });
}

console.log("IS EVERY FLOOR REACHABLE BY GENERATION?   " + CERT + ", anchoring in " + STANDARD + ":" + EDITION);
console.log("");
console.log("`eff any source` is what rollout-shortfall counts and what the FLOOR is derived from.");
console.log("`eff in run` is what the generator can actually anchor in. Where they differ, the floor is a");
console.log("claim about a population the generator cannot reach.");
console.log("");
console.log("task   primaries  eff any  eff in run  floor  have  short   cap x eff  BINDING   reachable?");
const unreachable = [];
for (const r of rows) {
  /* the verdict comes from the BINDING capacity, which is what the assignment uses. Reading it off
   * `cap x eff` answered "yes" for 1.2 while the assignment refused two of its items. */
  const reach = r.have + r.binding >= r.floor;
  if (!reach) unreachable.push(r);
  console.log("  " + r.code.padEnd(6) + String(r.primaries).padStart(6) + String(r.effAnySource).padStart(9) +
    String(r.effInRun).padStart(12) + String(r.floor).padStart(7) + String(r.have).padStart(6) +
    String(r.shortfall).padStart(7) + String(r.ceilingFromMap).padStart(11) +
    String(r.binding).padStart(9) + "   " +
    (reach ? "yes" : "NO -- short by " + (r.floor - r.have - r.binding)));
}
console.log("");
const mixed = rows.filter((r) => Object.keys(r.bySource).length > 1 ||
  !Object.keys(r.bySource).every((s) => s === STANDARD));
/* Since the PROMPT-102 re-key these are ANCHORABLE, not excluded: the generator keys passages on
 * (source, edition, clause) and scopes per item, so a cross-source primary resolves in its own document.
 * Reported because it is where the items will come from, and `eff any == eff in run` is the proof. */
console.log("TASKS LINKING A PRIMARY FROM ANOTHER SOURCE (anchorable since the re-key): " + mixed.length +
  " of " + rows.length);
for (const r of mixed) {
  const others = Object.entries(r.bySource).filter(([s]) => s !== STANDARD);
  console.log("  " + r.code.padEnd(6) + others.map(([s, n]) => s + " " + n).join(", ") +
    "   (eff any " + r.effAnySource + ", anchorable " + r.effInRun +
    (r.effAnySource === r.effInRun ? " -- all reachable)" : " -- " + (r.effAnySource - r.effInRun) + " NOT held)"));
}
console.log("");
if (unreachable.length) {
  console.log("UNREACHABLE FLOORS: " + unreachable.length + " task(s) -- " +
    unreachable.map((r) => r.code + " (" + r.have + "+" + r.binding + " < " + r.floor + ")").join(", "));
  console.log("");
  console.log("A generation run cannot close these. The choices are a MAP change (link more " + STANDARD);
  console.log("passages, or make the other sources anchorable) or a FLOOR change (derive it from the");
  console.log("primaries the generator can reach rather than from every linked source). Both are decisions,");
  console.log("and neither is a generator setting.");
} else {
  console.log("Every floor is reachable from the map the generator can see.");
}
console.log("");
console.log("TWO CAPACITY COLUMNS, AND THE VERDICT COMES FROM THE SECOND. `cap x eff` is " + CAP +
  " x eff-in-run and");
console.log("ignores what those clauses already hold; BINDING subtracts the census per clause and is what");
console.log("`assignAnchors` will actually carry. Where they differ, the gap is the CAP filling up rather");
console.log("than the map being short -- and reading the verdict off the first column answered `yes` for");
console.log("task 1.2 while the assignment was refusing two of its six items.");
