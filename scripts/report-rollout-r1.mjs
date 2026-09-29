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

/* R1 by default, so the existing invocation is unchanged. --batch may be repeated; --report names the
 * output stem. One implementation, two reports. */
const argBatches = [];
let STEM = "AIMSF-ROLLOUT-R1", TITLE = "AIMS-F rollout R1";
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--batch=([^:]+):(.+)$/.exec(a))) { argBatches.push([m[1], m[2]]); continue; }
  if ((m = /^--report=(.+)$/.exec(a))) { STEM = m[1]; continue; }
  if ((m = /^--title=(.+)$/.exec(a))) { TITLE = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --batch=<label>:<file> (repeatable), --report=<stem>, --title=<text>.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const BATCHES = argBatches.length ? argBatches
  : [["batch 1", "AIMSF-ROLLOUT-B1.json"], ["batch 2", "AIMSF-ROLLOUT-B2.json"]];

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
        keyPick: 0, flags: 0, probed: 0 });
    }
    const t = byTask.get(code);
    t.attempted++;
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
      /* a rejection can name more than one gate; solver states are counted under their own names */
      const failed = (r.gates || []).filter((g) => g.pass === false).map((g) => g.id);
      for (const id of failed) t.gates[id] = (t.gates[id] || 0) + 1;
      const s = (r.solver || {}).state;
      if (s === "split") t.gates["solver-split"] = (t.gates["solver-split"] || 0) + 1;
      else if (s === "rejected") t.gates["solver"] = (t.gates["solver"] || 0) + 1;
      else if (s === "could-not-run") t.gates["solver-could-not-run"] = (t.gates["solver-could-not-run"] || 0) + 1;
      if (!failed.length && !s) t.gates["(unattributed)"] = (t.gates["(unattributed)"] || 0) + 1;
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
const price = (loaded[0].j.spend || {}).price_per_mtok || { input: 15, output: 75 };
const usdOf = (r) => (r.input / 1e6) * price.input + (r.output / 1e6) * price.output;
const totalAttempted = rows.reduce((s, r) => s + r.attempted, 0);
const totalSurvivors = rows.reduce((s, r) => s + r.survivors, 0);

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
p("");
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
p("| flag, batch 1 | 64% (9/14) | the figure comparable to the flag rate above |");
p("");
p("The probe FLAGS and never rejects, and it has no target rate. Per-task rates are in the table above.");
p("");
p("`quote-noise`: **" + (gateTotals["quote-noise"] || 0) + "**. That count is what will say later whether");
p("the extraction repair is worth money.");
p("");
p("`solver-split`: **" + (gateTotals["solver-split"] || 0) + "** — items the solver answered two different");
p("ways across two runs with the options shuffled.");
p("");
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
