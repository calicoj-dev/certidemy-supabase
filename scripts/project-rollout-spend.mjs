#!/usr/bin/env node
/**
 * project-rollout-spend.mjs -- what the remaining AIMS-F top-up would cost, and how many items it can
 * actually reach.
 *
 * READ-ONLY. No writes, no model calls. Unknown flags exit 2.
 *
 * Ruled PROMPT-96 s4: *"ceiling $20, measured on the first task."* This is the instrument that does the
 * measuring, and it exists rather than being done by hand for one reason:
 *
 *   ============ A PROJECTION IS A CLAIM ABOUT ITS UNIT COST, AND THE UNIT COST MUST BE MEASURED ============
 *
 * `--measured=<artifact>` reads the per-call token totals a REAL run recorded and divides by the items that
 * run generated. There is no typed rate anywhere in this file. A projection built from a remembered figure
 * is the second-copy defect this repository opens with, aimed at money.
 *
 * ============ AND THE ITEM COUNT IS NOT THE ASK ============
 *
 * The shortfall says how many items a task is missing. The ANCHOR ASSIGNMENT says how many of them a run
 * can carry: `cap x eligible primaries, minus what those clauses already hold`. Those differ, and where
 * they differ the shortfall is not a generation job.
 *
 * So three numbers travel together and none of them substitutes for another:
 *
 *   asked        what the shortfall wants
 *   reachable    what the assignment will generate, after the capacity reduction
 *   unreachable  the remainder -- a MAP or FLOOR decision, never a generator setting
 *
 * Projecting the cost of `asked` would over-state the spend and, worse, promise items no run can produce.
 *
 * ============ AND THE UNIT IS PER ITEM WHILE ONE COST IS PER TASK. MEASURED: 22 PERCENT LOW ============
 *
 * The first use of this script projected $12.15 for 38 items from a probe of one 4-item task. The run cost
 * **$15.56** -- inside the ceiling, and 28 percent over the projection, for a reason that is structural rather
 * than noise:
 *
 *   THE WRITER IS CALLED ONCE PER TASK, NOT ONCE PER ITEM. The probe's single writer call produced 4 items
 *   and its cost divided by four. The real scope was 23 tasks for 38 items -- 15 of those tasks wanting ONE
 *   item each -- so 23 writer calls were paid for, and the per-item writer cost cannot be as low as the
 *   probe's.
 *
 * So a unit measured on a MULTI-ITEM task under-states a scope of SINGLE-item tasks, and this is the
 * mean-over-the-wrong-population shape aimed at money. The projection below therefore prints a SECOND figure
 * that separates the per-task cost from the per-item cost, and the gap between them is the amortisation the
 * probe was enjoying and the scope will not.
 *
 * ============ THE CEILING IS A REFUSAL, NOT A WARNING ============
 *
 * `--ceiling=<usd>` exits 3 when the projection exceeds it, with the batch that fits named. A ceiling that
 * prints a caution and proceeds is a ceiling nobody set.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { CAP } from "./lib/anchor-cap.mjs";
import { buildCapCensus } from "./lib/anchor-cap-census.mjs";
import { assignAnchors } from "./lib/anchor-assignment.mjs";
import { classifyPrimaries } from "./lib/effective-primary.mjs";
import { makePassageIndex } from "./lib/passage-index.mjs";

let MEASURED = null, TASKS = null, CEILING = null, RUN_ID = "PROJECTION";
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--measured=(.+)$/.exec(a))) { MEASURED = m[1]; continue; }
  if ((m = /^--tasks=(.+)$/.exec(a))) { TASKS = m[1]; continue; }
  if ((m = /^--ceiling=([0-9.]+)$/.exec(a))) { CEILING = Number(m[1]); continue; }
  if ((m = /^--run-id=(.+)$/.exec(a))) { RUN_ID = m[1]; continue; }
  console.error("Unrecognised flag: " + a);
  console.error("  --measured=<artifact.json>  REQUIRED. the run whose recorded spend sets the unit cost");
  console.error("  --tasks=1.2:6,1.3:1,...     REQUIRED. the scope, in the generator's own --tasks form");
  console.error("  --ceiling=20                optional. exit 3 if the projection exceeds it");
  console.error("  --run-id=<name>             optional. the assignment tie-break seed to simulate");
  process.exit(2);
}
if (!MEASURED || !TASKS) { console.error("--measured and --tasks are both required."); process.exit(2); }

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KEY = requireKey(HERE);
const CERT = "AIMS-F";

/* ---- the measured unit cost, read off a real run ---- */
const art = JSON.parse(readFileSync(join(ROOT, MEASURED), "utf8"));
const spend = art.spend || {};
const measuredUsd = Number(spend.usd);
/* the artifact's DECLARED count, with its own item array as the cross-check. A projection is exactly the
 * place where a denominator read off the wrong field goes unnoticed, so the two must agree. */
const measuredItems = Number(art.generated);
if (Number.isFinite(measuredItems) && measuredItems !== (art.items || []).length) {
  console.error("REFUSING: " + MEASURED + " declares generated=" + measuredItems + " and carries " +
    (art.items || []).length + " item(s). The unit cost divides by one of those and they disagree.");
  process.exit(2);
}
if (!Number.isFinite(measuredUsd) || measuredUsd <= 0 || !measuredItems) {
  console.error("REFUSING: " + MEASURED + " records no usable spend (usd=" + spend.usd + ", items=" +
    measuredItems + "). A projection with no measured unit is a guess wearing a number.");
  process.exit(2);
}
const perItem = measuredUsd / measuredItems;
/* ---- the two halves of the unit, split because they scale on different counts ---- */
const byRole = (spend.by_role || {});
const writerUsd = byRole.writer
  ? (byRole.writer.input / 1e6) * (spend.price_per_mtok || {}).input +
    (byRole.writer.output / 1e6) * (spend.price_per_mtok || {}).output
  : null;
/* the measured run's task count: how many writer calls its per-item figure was amortised over */
const measuredTasks = byRole.writer ? byRole.writer.calls : null;
const perTaskWriter = writerUsd !== null && measuredTasks ? writerUsd / measuredTasks : null;
const perItemAfterWriter = writerUsd !== null ? (measuredUsd - writerUsd) / measuredItems : null;

/* ---- the scope ---- */
const want = new Map();
for (const part of TASKS.split(",").map((s) => s.trim()).filter(Boolean)) {
  const [code, n] = part.split(":");
  want.set(code, Number(n || 1));
}

/* ---- the generator's own view of the library and the map ---- */
const MAP = JSON.parse(readFileSync(join(ROOT, CERT + "-TASK-SOURCES.json"), "utf8"));
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
/* PROMPT-102 s2: the whole library, keyed on (source, edition, clause) -- the generator's
 * single-standard filter is gone, so a cross-source primary is anchorable and must be counted. */
const passageIndex = makePassageIndex(lib.passages);

const certs = await getAll(KEY, "certifications?select=id,code&code=eq." + CERT);
const cert = certs[0];
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code&order=code"))
  .filter((t) => t.certification_id === cert.id);
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
const capInfo = await buildCapCensus({ KEY, getAll, certId: cert.id, tasks, ROOT, cert: CERT });

const rows = [];
for (const t of tasks) {
  if (!want.has(t.code)) continue;
  /* EXACTLY the generator's filter: this standard and edition, effective primaries only, source read off
   * the PASSAGE. Stamping the certification's standard onto a raw primary is the R5 probe-1 defect. */
  /* classified PER (source, edition), because the container test is a clause-number prefix test */
  const groups = new Map();
  for (const p of primOf.get(t.id) || []) {
    const se = p.source_id + "|" + p.edition;
    if (!groups.has(se)) groups.set(se, []);
    groups.get(se).push(p);
  }
  const primaries = [];
  for (const [se, members] of groups) {
    const i = se.indexOf("|");
    const src = se.slice(0, i), ed = se.slice(i + 1);
    const view = passageIndex.for(src, ed);
    const cl = [...view.keys()];
    for (const r of classifyPrimaries(members.map((m) => m.clause), (c) => view.get(c), cl)) {
      if (!r.effective) continue;
      const p = view.get(r.clause);
      if (!p || !p.source_id) continue;
      primaries.push({ source_id: p.source_id, edition: p.edition, clause: p.clause });
    }
  }
  const asked = want.get(t.code);
  const asg = assignAnchors({ taskCode: t.code, runId: RUN_ID, primaries,
    censusMap: capInfo.byTask.get(t.code) || new Map(), want: asked });
  rows.push({ code: t.code, asked, eligible: asg.eligible,           /* already a COUNT in the module, not an array */ capacity: asg.capacity,
    reachable: asg.assignments.length, shortfall: asg.shortfall,
    anchors: asg.assignments.map((a) => a.clause) });
}

const asked = rows.reduce((s, r) => s + r.asked, 0);
const reachable = rows.reduce((s, r) => s + r.reachable, 0);
const unreachable = asked - reachable;
const projected = perItem * reachable;

console.log("PROJECTED SPEND FOR THE REMAINING " + CERT + " TOP-UP");
console.log("");
console.log("UNIT COST, MEASURED -- not typed. From " + MEASURED + ":");
console.log("  $" + measuredUsd.toFixed(2) + " over " + measuredItems + " item(s) generated  =  $" +
  perItem.toFixed(2) + " per item generated");
console.log("  (" + (spend.calls || "?") + " call(s), " + (spend.input_tokens || "?") + " in / " +
  (spend.output_tokens || "?") + " out.) The unit is per item GENERATED, not per survivor: a rejected item");
console.log("  costs the same money, so a per-survivor unit would understate the bill.");
console.log("");
console.log("task    asked  eligible  capacity  reachable  unreachable   assigned anchors");
for (const r of rows) {
  console.log("  " + r.code.padEnd(6) + String(r.asked).padStart(5) + String(r.eligible).padStart(10) +
    String(r.capacity).padStart(10) + String(r.reachable).padStart(11) +
    String(r.shortfall).padStart(13) + "   " +
    (r.anchors.length ? [...new Set(r.anchors)].join(", ").slice(0, 46) : "-- nothing assignable"));
}
console.log("");
console.log("  " + "TOTAL".padEnd(6) + String(asked).padStart(5) + "".padStart(20) +
  String(reachable).padStart(11) + String(unreachable).padStart(13));
console.log("");
console.log("PROJECTION   " + reachable + " item(s) x $" + perItem.toFixed(2) + "  =  $" +
  projected.toFixed(2));
/* ============ AND THE SAME SPEND SPLIT THE WAY IT ACTUALLY SCALES ============
 *
 * The flat per-item figure above under-states a scope of single-item tasks, measured at 22 percent on this
 * script's first use. Both numbers are printed and NEITHER is presented as the answer: the truth is between
 * them and which end depends on how many of the tasks want one item. */
if (perTaskWriter !== null && perItemAfterWriter !== null) {
  const taskCount = rows.filter((r) => r.reachable > 0).length;
  const split = perTaskWriter * taskCount + perItemAfterWriter * reachable;
  console.log("SPLIT        " + taskCount + " task(s) x $" + perTaskWriter.toFixed(2) +
    " writer  +  " + reachable + " item(s) x $" + perItemAfterWriter.toFixed(2) +
    " everything else  =  $" + split.toFixed(2));
  console.log("             The WRITER is called once per TASK. The measured run amortised its writer cost");
  console.log("             over " + measuredItems + " item(s) in " + measuredTasks + " call(s); this scope has " +
    taskCount + " task(s) for " + reachable + " item(s),");
  console.log("             so the flat per-item figure is a FLOOR wherever tasks want one item each.");
}
if (CEILING !== null) console.log("CEILING      $" + CEILING.toFixed(2));
console.log("");
if (unreachable > 0) {
  const blocked = rows.filter((r) => r.shortfall > 0);
  console.log("THE " + unreachable + " UNREACHABLE ITEM(S) ARE NOT A CHEAPER RUN, THEY ARE A DIFFERENT");
  console.log("DECISION -- a map change or a floor change. Per task:");
  for (const r of blocked) {
    console.log("  " + r.code.padEnd(6) + "asked " + r.asked + ", capacity " + r.capacity + " from " +
      r.eligible + " eligible primary(ies) at cap " + CAP + "  ->  " + r.shortfall + " short");
  }
  console.log("");
  console.log("  `check-floor-vs-anchorable.mjs` says which of these is a CROSS-SOURCE map (a floor derived");
  console.log("  from primaries in standards this run cannot anchor in) and which is simply a full cap.");
  console.log("");
}
if (CEILING !== null && projected > CEILING) {
  /* THE BATCH THAT FITS IS NAMED, IN THE ORDER THE SCOPE WAS GIVEN. Printing only the overage leaves the
   * reader to do the arithmetic that produced the refusal. */
  const fits = [];
  let acc = 0;
  for (const r of rows) {
    if (acc + perItem * r.reachable > CEILING) break;
    acc += perItem * r.reachable;
    if (r.reachable) fits.push(r.code + ":" + r.reachable);
  }
  console.log("OVER THE CEILING by $" + (projected - CEILING).toFixed(2) + ". Not proceeding.");
  console.log("");
  console.log("  The batch that FITS, in the order given:  --tasks=" + fits.join(","));
  console.log("  $" + acc.toFixed(2) + " of $" + CEILING.toFixed(2) + " for " +
    fits.reduce((s, f) => s + Number(f.split(":")[1]), 0) + " item(s).");
  process.exitCode = 3;
} else if (CEILING !== null) {
  /* ============ THREE STATES, BECAUSE THE TWO FIGURES BRACKET THE ANSWER ============
   *
   * The flat projection under-states a single-item scope and the split over-states it: measured on this
   * script's first use, flat $12.15, split $21.04, ACTUAL $15.56. Reporting only "within the ceiling" off the
   * optimistic half is the same defect as taking a floor for a total, so a ceiling falling BETWEEN the two is
   * its own verdict -- proceed, and know the margin is not proven. */
  const top = (perTaskWriter !== null && perItemAfterWriter !== null)
    ? perTaskWriter * rows.filter((r) => r.reachable > 0).length + perItemAfterWriter * reachable
    : null;
  if (top !== null && top > CEILING) {
    console.log("BRACKETED: $" + projected.toFixed(2) + " to $" + top.toFixed(2) + " against a $" +
      CEILING.toFixed(2) + " ceiling.");
    console.log("  The ceiling falls INSIDE the bracket, so this run is not proven to fit. Both bounds are");
    console.log("  biased and in known directions -- the flat figure under-states a scope of single-item");
    console.log("  tasks, the split over-states it because a one-item writer call emits less than the");
    console.log("  multi-item call the unit was measured on. Proceed if the LOW end is what you are");
    console.log("  budgeting and you are willing to stop at the ceiling; do not report it as within.");
  } else {
    console.log("WITHIN THE CEILING: $" + projected.toFixed(2) +
      (top !== null ? " to $" + top.toFixed(2) : "") + " of $" + CEILING.toFixed(2) +
      (top !== null ? ", both bounds under it." : ", $" + (CEILING - projected).toFixed(2) + " spare."));
  }
}
console.log("");
console.log("WHAT THIS PROJECTION CANNOT SEE, stated rather than left to be discovered:");
console.log("  - the SOLVER and the OPTIONS PROBE are per-item model calls on SURVIVORS, so a run whose");
console.log("    items survive more often than " + MEASURED + "'s costs MORE per item, not less;");
console.log("  - a de-cue RETRY is a second writer call on one item, and its rate is not fixed;");
console.log("  - a rejection that triggers no retry costs the writer call and nothing after it.");
console.log("  The measured unit above already contains one run's mix of all three. It is an estimate from");
console.log("  one sample, and a second task will move it.");
