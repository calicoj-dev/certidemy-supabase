#!/usr/bin/env node
/**
 * report-rollout-r1.mjs -- the AIMS-F rollout report: per-task table, spend, and every survivor in full.
 *
 * READ-ONLY. No writes beyond the report, no model calls, no database writes. Unknown flags exit 2.
 * Ruled PROMPT-87 s5 / PROMPT-91 s5. NOTHING IS INSERTED.
 *
 * Reads both batch artifacts. Batch 1 was the ceiling measurement and batch 2 the rest; they are separate
 * runs and the report says which batch each task came from, because a spend figure that mixes a
 * measurement with the run it authorised cannot be checked against the ceiling afterwards.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runCodeGates } from "./lib/grounded-gates.mjs";
import { reporterGateParity, reporterGateParityControls } from "./lib/reporter-gate-parity.mjs";

/* R1 by default, so the existing invocation is unchanged. --batch may be repeated; --report names the
 * output stem. One implementation, two reports. */
const argBatches = [];
let STEM = "AIMSF-ROLLOUT-R1", TITLE = "AIMS-F rollout R1", CEILING = null;
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--batch=([^:]+):(.+)$/.exec(a))) { argBatches.push([m[1], m[2]]); continue; }
  if ((m = /^--report=(.+)$/.exec(a))) { STEM = m[1]; continue; }
  if ((m = /^--title=(.+)$/.exec(a))) { TITLE = m[1]; continue; }
  /* --ceiling=<usd> prints the ceiling, the per-attempt rate measured on the FIRST batch, the projection
   * that rate authorised, and the actual. A ceiling reported only as a total cannot be checked against the
   * decision taken before the money was spent. */
  if ((m = /^--ceiling=([\d.]+)$/.exec(a))) { CEILING = Number(m[1]); continue; }
  console.error("Unrecognised flag: " + a + ". Known: --batch=<label>:<file> (repeatable), --report=<stem>, " +
    "--title=<text>, --ceiling=<usd>.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const BATCHES = argBatches.length ? argBatches
  : [["batch 1", "AIMSF-ROLLOUT-B1.json"], ["batch 2", "AIMSF-ROLLOUT-B2.json"]];

/* ============ A GATE THIS REPORT NAMES MUST ACTUALLY RUN ============
 *
 * Ruled PROMPT-95 follow-up 2. This file printed "quote-noise: 0" for R1, R2 and R3 while that gate was wired
 * to nothing, and the zero was offered three times as evidence. A gate that is never called cannot reject, so
 * its count was structural, not measured.
 *
 * Parity is asserted BEFORE anything is printed. A report that names a gate nobody runs is worse than no
 * report, because its zeros read as measurements -- and the controls run first, because a parity check that
 * cannot fire would be the same defect one level up.
 *
 * SCOPE, stated so a pass is not over-read: this catches gate names written LITERALLY in this file. Most gate
 * names in the per-task table are derived from the item records themselves, so they cannot drift from the
 * gates that ran -- only an explicitly named one can, and those are exactly where the defect was. */
{
  const self = readFileSync(join(HERE, "report-rollout-r1.mjs"), "utf8");
  const ctl = reporterGateParityControls(runCodeGates, self);
  const badCtl = ctl.filter((x) => !x.pass);
  for (const x of badCtl) console.error("  PARITY CONTROL FAIL " + x.what + "   " + x.detail);
  const par = reporterGateParity(runCodeGates, self);
  for (const f of par.fails) console.error("  PARITY FAIL " + f);
  if (badCtl.length || par.fails.length) {
    console.error("");
    console.error("REFUSING TO REPORT: a gate this file can name does not run in runCodeGates.");
    process.exitCode = 2;
    process.exit();
  }
  console.log("gate parity: " + par.named.length + " gate name(s) in this file, " + par.ran.length +
    " gate(s) running, every named one runs");
  /* THE SECOND DIRECTION, PRINTED RATHER THAN SWALLOWED. A gate that rejects items while its name never
   * appears in the report produces a count nobody can reconcile -- last session lost three `anchor-cap`
   * rejections exactly that way and printed a dash for the task. It is an observation, not a failure: most
   * gates reach the report through the per-task table, which derives its names from the item records. */
  if (par.unnamedNote) console.log("  " + par.unnamedNote);
}

const loaded = [];
for (const [name, f] of BATCHES) {
  const p = join(ROOT, f);
  if (!existsSync(p)) { console.log("  (missing, skipped: " + f + ")"); continue; }
  loaded.push({ name, file: f, j: JSON.parse(readFileSync(p, "utf8")) });
}
if (!loaded.length) { console.error("no batch artifact found"); process.exit(2); }

/* ---- per task ---- */
const byTask = new Map();
for (const b of loaded) {
  for (const r of (b.j.items || [])) {
    const code = r.task_code;
    if (!byTask.has(code)) {
      byTask.set(code, { code, batch: b.name, attempted: 0, survivors: 0, gates: {}, cues: {},
        clauses: new Set(), items: [],
        /* TWO measurements, never one. keyPick = the probe picked the key from the options alone;
         * flags = it picked the key AND named the cue. flags is a SUBSET of keyPick. */
        keyPick: 0, flags: 0, probed: 0,
        /* PROMPT-96 s2. The two denominators the `anchor-assignment` count is unreadable without: a zero
         * refusal count reads identically whether every writer obeyed or the gate never ran. */
        anchorAssigned: 0, anchorUnasserted: 0,
        /* PROMPT-96 s4. Every ATTEMPTED item's assigned clause, not just the survivors'. `t.items` holds
         * survivors alone, so counting distinct clauses from it would under-report the spread whenever a
         * rejected item was the one carrying a clause of its own -- an error in the direction of claiming
         * the assignment spread LESS than it did. */
        anchorClauses: new Set() });
    }
    const t = byTask.get(code);
    t.attempted++;
    if (r.assigned && r.assigned.clause) { t.anchorAssigned++; t.anchorClauses.add(r.assigned.clause); }
    if ((r.unasserted || []).includes("anchor-assignment")) t.anchorUnasserted++;
    if (r.verdict === "survivor") {
      t.survivors++;
      t.clauses.add(r.item.key_support_clause);
      t.items.push(r);
      const pr = r.options_probe || {};
      if (pr.state === "flag") t.cues[pr.cue_kind || "flag"] = (t.cues[pr.cue_kind || "flag"] || 0) + 1;
      /* A PROBE THAT DID NOT RUN IS NOT A PROBE THAT FOUND NOTHING. `probed` is the denominator, so a
       * could-not-run cell cannot quietly improve a rate. */
      if (pr.state) {
        t.probed++;
        const keyLabel = String.fromCharCode(65 + (r.item || {}).correct_index);
        if (pr.pick === keyLabel) t.keyPick++;
        if (pr.state === "flag") t.flags++;
      }
    } else {
      /* ============ THE REASON SET IS THE UNION OF `gates` AND `failed`, AND IT WAS NOT ============
       *
       * This read `r.gates` alone, and R4 is where that cost something: task 5.5 lost THREE items to
       * `anchor-cap` and the table printed a dash. `anchor-cap` is applied after the gate sweep, so it lands
       * in `record.failed` without a `gates[]` entry -- and those items also carry `solver: accepted`, so the
       * `(unattributed)` fallback could not fire either. Three rejections vanished from a report whose whole
       * job is to say why items were refused.
       *
       * Same family as `quote-noise` printing 0 while wired to nothing, with the direction reversed: there a
       * REPORTED gate did not run, here a gate that RAN and REJECTED was not reported. The parity check
       * cannot see this one -- it compares names the reporter can print against gates that run, and a reason
       * the reporter never collects has no name to compare. */
      const failed = [...new Set([
        ...(r.gates || []).filter((g) => g.pass === false).map((g) => g.id),
        ...(Array.isArray(r.failed) ? r.failed : []),
      ])];
      for (const id of failed) t.gates[id] = (t.gates[id] || 0) + 1;
      const s = (r.solver || {}).state;
      if (s === "split") t.gates["solver-split"] = (t.gates["solver-split"] || 0) + 1;
      else if (s === "rejected") t.gates["solver"] = (t.gates["solver"] || 0) + 1;
      else if (s === "could-not-run") t.gates["solver-could-not-run"] = (t.gates["solver-could-not-run"] || 0) + 1;
      /* A NON-SURVIVOR THAT NAMES NOTHING IS `(unattributed)`, whatever the solver said. The old condition
       * also required no solver state, so a rejection with `solver: accepted` and no gate fell through
       * entirely -- counted nowhere, printed as a dash. */
      const named = failed.length || s === "split" || s === "rejected" || s === "could-not-run";
      if (!named) t.gates["(unattributed)"] = (t.gates["(unattributed)"] || 0) + 1;
    }
  }
}
const rows = [...byTask.values()].sort((a, b) =>
  String(a.code).localeCompare(String(b.code), undefined, { numeric: true }));

/* ---- spend ---- */
const spend = { calls: 0, input: 0, output: 0, usd: 0, byRole: {} };
for (const b of loaded) {
  const s = b.j.spend;
  if (!s) continue;
  spend.calls += s.calls; spend.input += s.input_tokens; spend.output += s.output_tokens;
  spend.usd += s.usd;
  for (const [role, r] of Object.entries(s.by_role || {})) {
    const acc = spend.byRole[role] || (spend.byRole[role] = { calls: 0, input: 0, output: 0 });
    acc.calls += r.calls; acc.input += r.input; acc.output += r.output;
  }
}
/* PER BATCH, so a ceiling measured on the first batch can be compared with what it authorised. A single
 * total cannot separate a measurement from the run it paid for. */
const perBatch = loaded.map((b) => ({
  label: b.name,
  attempted: (b.j.items || []).length,
  survivors: (b.j.items || []).filter((r) => r.verdict === "survivor").length,
  spend: ((b.j.spend || {}).usd) || 0,
}));
const price = (loaded[0].j.spend || {}).price_per_mtok || { input: 15, output: 75 };
const usdOf = (r) => (r.input / 1e6) * price.input + (r.output / 1e6) * price.output;
const totalAttempted = rows.reduce((s, r) => s + r.attempted, 0);
const totalSurvivors = rows.reduce((s, r) => s + r.survivors, 0);

/* ============ EVERY NON-SURVIVOR MUST BE ACCOUNTED FOR BY NAME ============
 *
 * The check that would have caught three vanished `anchor-cap` rejections, and it is cheap: count the
 * non-survivors, count the ones this report can name a reason for, and refuse to print if the two disagree.
 * A rejection table that silently omits rows is worse than no table -- its dashes read as "nothing went
 * wrong here". */
{
  const nonSurvivors = [];
  for (const b of loaded) {
    for (const r of (b.j.items || [])) if (r.verdict !== "survivor") nonSurvivors.push({ b: b.name, r });
  }
  const unnamed = nonSurvivors.filter(({ r }) => {
    const f = [...new Set([
      ...(r.gates || []).filter((g) => g.pass === false).map((g) => g.id),
      ...(Array.isArray(r.failed) ? r.failed : []),
    ])];
    const s = (r.solver || {}).state;
    return !f.length && s !== "split" && s !== "rejected" && s !== "could-not-run";
  });
  if (unnamed.length) {
    console.error("REFUSING TO REPORT: " + unnamed.length + " of " + nonSurvivors.length + " non-survivor(s) " +
      "name no reason this report can print, so the rejection table would omit them silently.");
    for (const { b, r } of unnamed.slice(0, 8)) {
      console.error("  " + b + "  " + String(r.item_id || "").slice(0, 8) + "  task " + r.task_code +
        "  verdict " + JSON.stringify(r.verdict));
    }
    process.exitCode = 2;
    process.exit();
  }
  console.log("rejection reconciliation: " + nonSurvivors.length + " non-survivor(s), every one naming at " +
    "least one reason this report prints");
}

/* ---- per-task stop conditions, evaluated ---- */
for (const r of rows) {
  r.halfRule = r.attempted > 0 && r.survivors * 2 < r.attempted;
  r.noItems = r.attempted === 0;
}
const stopped = rows.filter((r) => r.halfRule || r.noItems);

const md = [];
const p = (s = "") => md.push(s);
p("# " + TITLE);
p("");
p("**Nothing is inserted.** Every item below is in an artifact awaiting the director's read.");
p("");
p("| | |");
p("|---|---|");
p("| tasks | " + rows.length + " |");
p("| attempted | " + totalAttempted + " |");
p("| survivors | **" + totalSurvivors + "** |");
p("| spend | **$" + spend.usd.toFixed(2) + "** |");
p("| dollars per survivor | **$" + (totalSurvivors ? (spend.usd / totalSurvivors).toFixed(3) : "n/a") + "** |");
if (CEILING) p("| ceiling | **$" + CEILING.toFixed(2) + "**, " +
  (spend.usd <= CEILING ? "held with $" + (CEILING - spend.usd).toFixed(2) + " unspent"
    : "**EXCEEDED by $" + (spend.usd - CEILING).toFixed(2) + "**") + " |");
p("");

/* ============ THE CEILING, AND THE PROJECTION THAT AUTHORISED THE SPEND ============
 *
 * Ruled PROMPT-95 s5: *"ceiling $30, measured on the first two tasks and projected."* The measurement is
 * the FIRST BATCH and the projection is what it authorised -- printed together, because a ceiling reported
 * only as a total cannot be checked against the decision that was taken before the money was spent. A
 * projection recorded after the fact is not a projection; it is a rationalisation. */
if (CEILING && BATCHES.length > 1) {
  const first = perBatch[0];
  if (first && first.attempted) {
    const rate = first.spend / first.attempted;
    const rest = totalAttempted - first.attempted;
    p("## The ceiling: measured, projected, then spent");
    p("");
    p("| | |");
    p("|---|---|");
    p("| ceiling | $" + CEILING.toFixed(2) + " |");
    p("| measured on `" + first.label + "` | " + first.attempted + " attempt(s), $" +
      first.spend.toFixed(2) + " -- **$" + rate.toFixed(3) + " per attempt** |");
    p("| projected for the remaining " + rest + " | $" + (rate * rest).toFixed(2) + " |");
    p("| projected TOTAL | $" + (first.spend + rate * rest).toFixed(2) + " |");
    p("| actual TOTAL | **$" + spend.usd.toFixed(2) + "** |");
    p("| projection error | " + (first.spend + rate * rest ?
      (((spend.usd - (first.spend + rate * rest)) / (first.spend + rate * rest)) * 100).toFixed(1) + "%"
      : "n/a") + " |");
    p("");
    p("**The projection is printed even where it was accurate.** A ceiling held is only evidence of");
    p("discipline if the number that authorised the run is beside the number it cost -- otherwise a run that");
    p("came in under budget by luck is indistinguishable from one that was measured first.");
    p("");
  }
}
p("## Spend by role");
p("");
p("At $" + price.input + " / $" + price.output + " per million tokens (input / output).");
p("");
p("| role | calls | input | output | USD |");
p("|---|---|---|---|---|");
for (const [role, r] of Object.entries(spend.byRole).sort((a, b) => usdOf(b[1]) - usdOf(a[1]))) {
  p("| " + role + " | " + r.calls + " | " + r.input + " | " + r.output + " | $" + usdOf(r).toFixed(2) + " |");
}
p("| **total** | **" + spend.calls + "** | **" + spend.input + "** | **" + spend.output + "** | **$" +
  spend.usd.toFixed(2) + "** |");
p("");
p("## Per task");
p("");
p("| task | batch | shortfall | attempted | survived | rejections by gate | key-pick | flag | cue flags | distinct anchors |");
p("|---|---|---|---|---|---|---|---|---|---|");
const shortfalls = JSON.parse(readFileSync(join(ROOT, "AIMSF-ROLLOUT-SHORTFALL.json"), "utf8"));
const sfOf = new Map(shortfalls.per_task.map((r) => [r.code, r.shortfall]));
for (const r of rows) {
  const g = Object.entries(r.gates).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => "`" + k + "` " + v).join(", ") || "—";
  const c = Object.entries(r.cues).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => k + " " + v).join(", ") || "—";
  const rate = (n) => r.probed ? Math.round((n / r.probed) * 100) + "% (" + n + "/" + r.probed + ")" : "—";
  p("| " + r.code + " | " + r.batch + " | " + (sfOf.get(r.code) ?? "—") + " | " + r.attempted + " | **" +
    r.survivors + "** | " + g + " | " + rate(r.keyPick) + " | " + rate(r.flags) + " | " + c + " | " +
    r.clauses.size + " |");
}
p("");
const gateTotals = {};
for (const r of rows) for (const [k, v] of Object.entries(r.gates)) gateTotals[k] = (gateTotals[k] || 0) + v;
p("**Rejections across the run:** " +
  (Object.entries(gateTotals).sort((a, b) => b[1] - a[1]).map(([k, v]) => "`" + k + "` " + v).join(", ") || "none"));
p("");
const tot = rows.reduce((a, r) => ({ probed: a.probed + r.probed, keyPick: a.keyPick + r.keyPick,
  flags: a.flags + r.flags }), { probed: 0, keyPick: 0, flags: 0 });
const pct = (n, d) => d ? Math.round((n / d) * 100) + "%" : "n/a";
p("### The options probe, against the authored bank");
p("");
p("**These are two measurements and only one of them compares to 98 percent.** The authored bank's");
p("98 percent is a KEY-PICK rate: how often the probe, shown the options alone with no stem, picks the");
p("key. A FLAG is narrower -- it picked the key AND could name the cue it used -- so the flag count is a");
p("subset of the key-pick count by construction. Reading a flag rate against 98 percent would report an");
p("improvement nobody measured.");
p("");
p("| | rate | |");
p("|---|---|---|");
p("| **key-pick, these survivors** | **" + pct(tot.keyPick, tot.probed) + "** (" + tot.keyPick + "/" +
  tot.probed + ") | the figure comparable to 98% |");
p("| key-pick, authored bank | 98% | measured in the 480-item audit |");
p("| key-pick, chance | 25% | four options |");
p("| flag (picked the key AND named the cue) | **" + pct(tot.flags, tot.probed) + "** (" + tot.flags + "/" +
  tot.probed + ") | a SUBSET of key-pick, not comparable to 98% |");
p("| flag, ALL pre-instruction survivors | **79%** (53/67) | the POPULATION baseline |");
p("| flag, batch 1 alone | 64% (9/14) | the ruling's baseline, and the LOW OUTLIER of the set |");
p("| flag, batch 2 alone | 83% (44/53) | the other pre-instruction point |");
p("");
p("**The ruling asked for 64%, and 64% is the low outlier of a two-point set.** Against it the flag rate");
p("looks 28 points worse; against the population of every pre-instruction survivor it is 13. The control");
p("keeps its job -- it is what made the comparison worth making -- but it does not get to be the baseline.");
p("");
p("**And the delta is confounded, which is stated rather than buried.** This run changed the writer prompt");
p("AND the task set AND the maps those tasks anchor on, all in one session. A delta measurement changes one");
p("thing. So this figure is a fact about the run, not a measurement of the instruction, and the honest next");
p("step is to read the flagged members rather than to tune the prompt again.");
p("");
p("The probe FLAGS and never rejects, and it has no target rate. Per-task rates are in the table above.");
p("");
p("`quote-noise`: **" + (gateTotals["quote-noise"] || 0) + "**. That count is what will say later whether");
p("the extraction repair is worth money.");
p("");
p("`solver-split`: **" + (gateTotals["solver-split"] || 0) + "** — items the solver answered two different");
p("ways across two runs with the options shuffled.");
p("");
/* ============ THE ASSIGNED ANCHOR, REPORTED WITH ITS DENOMINATOR ============
 *
 * Ruled PROMPT-96 s2. A bare count here would be unreadable in the direction that matters: zero refusals
 * means either every writer used its assigned clause or the gate never ran on these items, and those are
 * opposite facts. So the UNASSERTED count sits beside it -- items generated before the assignment existed,
 * which are reported and never blocked. */
{
  const refused = gateTotals["anchor-assignment"] || 0;
  const unasserted = rows.reduce((s, r) => s + (r.anchorUnasserted || 0), 0);
  const assigned = rows.reduce((s, r) => s + (r.anchorAssigned || 0), 0);
  /* ============ ALL THREE ZERO IS A THIRD STATE: THE ARTIFACT PREDATES THE GATE ============
   *
   * An artifact gated before PROMPT-96 s2 carries no `assigned` field AND no `anchor-assignment` entry in
   * its `unasserted` list, because the gate did not exist to record either. So `0 refused of 0 assigned,
   * 0 unasserted` is not "nothing went wrong" -- it is "this question was never asked of these items", and
   * printing it as three zeros beside a live run's figures would put the two side by side as though they
   * were the same measurement. */
  if (!refused && !assigned && !unasserted) {
    p("`anchor-assignment`: **NOT MEASURED ON THIS RUN.** The artifact carries no assignment and no");
    p("unasserted entry for it, which means it was gated before the gate existed rather than that every");
    p("item passed. Three zeros and a clean bill of health look identical, so this says which it is.");
  } else {
    p("`anchor-assignment`: **" + refused + "** refused for anchoring outside the clause assigned to them, of " +
      assigned + " item(s) that carried an assignment. " + unasserted + " item(s) had none — generated");
    p("before PROMPT-96 s2 and re-gated through `--from`, so the gate could not examine them; UNASSERTED,");
    p("never a pass, and never blocking. **A zero refusal count means nothing without those two");
    p("denominators**: it reads identically whether every writer obeyed or the gate never ran.");
  }
  p("");
  /* ============ HOW MANY DISTINCT CLAUSES THE ASSIGNMENT COULD REACH, PER TASK ============
   *
   * PROMPT-96 s4. The refusal count above says whether the writers obeyed. It says nothing about whether
   * obedience was worth anything, and on two tasks in this run it was not: an assignment cannot SPREAD a
   * task's items across clauses the task does not have.
   *
   * Task 5.5 is the case that corrected a ruling. Its four R4 items all anchored in clause 3.4 and I
   * reported that as the writer choosing the most salient passage repeatedly. It has ONE effective primary
   * in the standard this run reads -- its other 34 are ISO/IEC 17021-1 and ISO/IEC 42006 -- so there was
   * nowhere else to go. The premise of the assignment was wrong for that task and right for 1.2.
   *
   * Derived from the artifact's own `assigned` fields rather than re-read from the map, so it cannot
   * disagree with what the writers were actually told. */
  const spread = rows.filter((r) => (r.anchorAssigned || 0) >= 2)
    .map((r) => ({ code: r.code, items: r.anchorAssigned || 0,
      distinct: (r.anchorClauses || new Set()).size }))
    .filter((r) => r.distinct > 0);
  const flat = spread.filter((r) => r.distinct < r.items);
  if (spread.length) {
    p("**AND WHETHER THE ASSIGNMENT COULD SPREAD AT ALL IS A DIFFERENT QUESTION FROM WHETHER IT WAS");
    p("OBEYED.** Distinct assigned clauses per multi-item task:");
    p("");
    p("| task | items assigned | distinct clauses |");
    p("|---|---|---|");
    for (const r of spread) p("| " + r.code + " | " + r.items + " | " +
      (r.distinct < r.items ? "**" + r.distinct + "**" : String(r.distinct)) + " |");
    p("");
    if (flat.length) {
      p("The bolded rows are tasks where two or more items share a clause. That is **not** the writer");
      p("clustering — it is the cap being the only room available: `capacity = cap x eligible primaries`,");
      p("and a task with one eligible primary can hold two items and no more than one clause. Run");
      p("`scripts/check-floor-vs-anchorable.mjs` for which of those are CROSS-SOURCE maps, where the floor");
      p("is derived from primaries in standards this run cannot anchor in.");
      p("");
    }
  }
}
if (stopped.length) {
  p("## Tasks that hit a stop condition");
  p("");
  for (const r of stopped) {
    p("- **" + r.code + "**: " + (r.noItems ? "the writer produced nothing"
      : "fewer than half survived (" + r.survivors + " of " + r.attempted + ")"));
  }
  p("");
} else {
  p("**No task hit a stop condition** — every one had at least half its attempts survive and the writer");
  p("produced items for all of them.");
  p("");
}
p("---");
p("");
p("## Every survivor, in full");
p("");
for (const r of rows) {
  if (!r.items.length) continue;
  p("### Task " + r.code + "   (" + r.items.length + " survivor" + (r.items.length === 1 ? "" : "s") + ")");
  p("");
  for (const s of r.items) {
    const it = s.item;
    p("#### `" + (s.item_id || "?") + "`   anchor `" + it.key_support_clause + "`");
    p("");
    p("> " + String(it.key_support || "").replace(/\s+/g, " "));
    p("");
    p("**Q** " + String(it.question_text).replace(/\s+/g, " "));
    p("");
    for (const [i, o] of (it.options || []).entries()) {
      p("- " + (o.is_correct ? "**" : "") + String.fromCharCode(65 + i) + ") " +
        String(o.text || "").replace(/\s+/g, " ") + (o.is_correct ? "  ← key**" : ""));
    }
    p("");
    p("*explanation:* " + String(it.explanation || "").replace(/\s+/g, " "));
    const pr = s.options_probe || {};
    if (pr.state === "flag") {
      p("");
      p("*options-only probe FLAG (" + (pr.cue_kind || "?") + "):* " +
        String(pr.reason || "").replace(/\s+/g, " ").slice(0, 260));
    }
    p("");
  }
}
writeFileSync(join(ROOT, STEM + ".md"), md.join("\n") + "\n", "utf8");
writeFileSync(join(ROOT, STEM + ".json"), JSON.stringify({
  tasks: rows.length, attempted: totalAttempted, survivors: totalSurvivors,
  spend: { ...spend, usd: Number(spend.usd.toFixed(4)) },
  usd_per_survivor: totalSurvivors ? Number((spend.usd / totalSurvivors).toFixed(4)) : null,
  gate_totals: gateTotals,
  per_task: rows.map((r) => ({ task: r.code, batch: r.batch, shortfall: sfOf.get(r.code) ?? null,
    attempted: r.attempted, survivors: r.survivors, gates: r.gates, cues: r.cues,
    distinct_anchors: r.clauses.size, anchors: [...r.clauses] })),
  stopped: stopped.map((r) => r.code),
}, null, 1) + String.fromCharCode(10), "utf8");

console.log("tasks " + rows.length + "   attempted " + totalAttempted + "   survivors " + totalSurvivors);
console.log("spend $" + spend.usd.toFixed(2) + "   per survivor $" +
  (totalSurvivors ? (spend.usd / totalSurvivors).toFixed(3) : "n/a"));
console.log("gates: " + (Object.entries(gateTotals).sort((a, b) => b[1] - a[1])
  .map(([k, v]) => k + " " + v).join(", ") || "none"));
console.log("stopped: " + (stopped.map((r) => r.code).join(" ") || "none"));
console.log("wrote " + STEM + ".md and .json");
