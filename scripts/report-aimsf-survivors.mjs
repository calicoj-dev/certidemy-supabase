#!/usr/bin/env node
/**
 * report-aimsf-survivors.mjs -- which live AIMS-F secure English items survive the audit, per task.
 *
 * READ-ONLY. No `--apply`, nothing is retired, nothing is generated. Unknown flags exit 2.
 *
 * ============ THE KEEP RULE, VERBATIM ============
 *
 *   "Keep an item only if it anchors cleanly AND the solver picks its key."
 *
 * Both, not either. The two instruments answer different questions and this repository has measured
 * how differently: over the director's read of 40 items, anchor-or-flag caught 7 of his 14 findings
 * and the blind solver caught 5, and the solver MISSED a Tier A -- it reasoned its way to an invented
 * control's key from a neighbouring clause. Anchoring does not ask for an opinion; it asks for the
 * sentence. Requiring both is the conjunction the ruling asked for and neither alone would do.
 *
 * ============ AND `cannot-be-checked` IS NOT A SURVIVOR ============
 *
 * An item whose source we do not hold, or whose task is on hold, was not examined. Counting it as a
 * survivor would clear an item nothing checked; counting it as a casualty would retire an item for a
 * purchasing decision. It is its own column, and the shortfall arithmetic treats it as NOT surviving
 * -- because the floor is items we can stand behind, and an unexamined item is not one.
 *
 * Nothing is retired by this script. The ruling is explicit: 20 survivors get read first.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

let N_READ = 20, SEED = 11;
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--read=(\d+)$/.exec(a))) { N_READ = Number(m[1]); continue; }
  if ((m = /^--seed=(\d+)$/.exec(a))) { SEED = Number(m[1]); continue; }
  console.error("Unrecognised flag: " + a + ". Known: --read=, --seed=. READ-ONLY.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const FLOOR = 8;
const f = join(ROOT, "ANCHOR-OR-FLAG-AIMS-F-all-secure.json");
if (!existsSync(f)) {
  console.error("missing " + f);
  console.error("Run: node scripts/anchor-existing-items.mjs --cert=AIMS-F --all-secure");
  process.exit(2);
}
const j = JSON.parse(readFileSync(f, "utf8"));
const items = j.items || [];
if (!items.length) { console.error("the audit artifact carries no items"); process.exit(2); }

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F");
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code,statement&order=code"))
  .filter((t) => t.certification_id === certs[0].id);
const stmt = new Map(tasks.map((t) => [t.code, t.statement]));
const live = await getAll(KEY, "quiz_questions?select=id,task_id,question_text,options,correct_answer," +
  "explanation,pool,status,retired_at&certification_id=eq." + certs[0].id + "&language=eq.en&order=id");
const liveById = new Map(live.map((r) => [String(r.id).slice(0, 8), r]));

/* THE SOLVER HAS THREE OUTCOMES AND THE FIRST VERSION OF THIS FOLDED THEM INTO TWO.
 *
 * accepted / rejected / could-not-run, and the third is not the second. Four payloads were refused by
 * the blindness guard because the item's explanation reproduces the anchor passage verbatim, so the
 * guard cannot tell a leaked key from an explanation copied out of a passage that legitimately has to
 * be supplied. Those items were never solved. Counting them as a rejection retires an item on a
 * measurement nobody took -- the could-not-run-read-as-failed defect, here inside my own reporter.
 *
 * They do not become survivors either: unexamined is its own column and does not count toward the
 * floor. What changes is the instruction attached to them -- re-run, not retire. */
const verdict = (it) => {
  if (it.state === "cannot-be-checked") return "unexamined";
  const s = (it.solver && it.solver.state) || "(none)";
  if (it.state === "anchored" && s === "could-not-run") return "unexamined";
  if (it.state === "anchored" && s === "accepted") return "keep";
  return "drop";
};
/* And an anchored item must never reach a verdict with NO solver result at all: that would be a drop
 * for something unmeasured, wearing a rejection. Asserted rather than assumed -- measured 0. */
{
  const blind = items.filter((it) => it.state === "anchored" &&
    !((it.solver && it.solver.state) || "").length);
  if (blind.length) {
    console.error("ABORT: " + blind.length + " anchored item(s) carry no solver result at all, so a " +
      "drop would be unmeasured. First: " + blind[0].prefix);
    process.exit(2);
  }
}

const rows = items.map((it) => ({ ...it, verdict: verdict(it) }));
const byTask = new Map();
for (const r of rows) {
  if (!byTask.has(r.task)) byTask.set(r.task, { keep: 0, drop: 0, unexamined: 0, total: 0, items: [] });
  const t = byTask.get(r.task);
  t[r.verdict]++; t.total++; t.items.push(r);
}

const md = [];
const p = (s = "") => md.push(s);
p("# AIMS-F secure English: 124 items proven sound, and a shortfall that is NOT a bill");
p("");
p("> **THE DROP COUNT MEASURES THE TASK MAP, NOT THE ITEMS. Nothing may be retired and nothing");
p("> generated on it until the two rulings in `AIMSF-AUDIT-SCOPE-FINDING.md` land.** 95 of the");
p("> drops carry no failing code gate: they were withheld because the key rests on a clause we DO");
p("> hold that was not among the passages supplied for that task. AIMS-F has 150 primary rows and");
p("> 382 supporting ones, and the anchoring pass sees only the primaries. Five drops were read in");
p("> full and all five are correct items. The honest statement is **124 proven sound, 142 not");
p("> proven unsound** -- of which 47 failed a mechanical gate and are real.");
p("");
p("**Nothing is retired and nothing is generated by this.** " + rows.length + " live secure English");
p("items audited: anchor-or-flag plus the blind solver, one call each.");
p("");
p("An item is KEPT only if it anchors cleanly **and** the solver picks its key -- both, as ruled. The");
p("two instruments disagree by design: over the director's 40-item read, anchoring caught 7 of 14");
p("findings and the solver caught 5, and the solver missed a Tier A by reasoning its way to an");
p("invented control's key. `unexamined` is its own column and does NOT count as surviving, because");
p("the floor is items we can stand behind.");
p("");
const K = rows.filter((r) => r.verdict === "keep").length;
const D = rows.filter((r) => r.verdict === "drop").length;
const U = rows.filter((r) => r.verdict === "unexamined").length;
p("| | |");
p("|---|---|");
p("| items audited | " + rows.length + " |");
p("| **keep** | **" + K + "** |");
p("| drop | " + D + " |");
p("| unexamined | " + U + " |");
p("");
p("## Per task, and the shortfall to " + FLOOR);
p("");
p("| task | live | keep | drop | unexamined | to generate |");
p("|---|---|---|---|---|---|");
let need = 0;
for (const code of [...byTask.keys()].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))) {
  const t = byTask.get(code);
  const gen = Math.max(0, FLOOR - t.keep);
  need += gen;
  p("| " + code + " | " + t.total + " | " + t.keep + " | " + t.drop + " | " + t.unexamined +
    " | " + (gen || "-") + " |");
}
p("| **total** | **" + rows.length + "** | **" + K + "** | **" + D + "** | **" + U +
  "** | **" + need + "** |");
p("");
p("**" + need + " items to generate**, against " + (35 * FLOOR) + " for a full refill. At the current");
p("measured rate of about 5.0 model calls per surviving item that is roughly " +
  Math.round(need * 5.0) + " calls rather than " + (35 * FLOOR * 5) + ".");
p("");
p("**That 156 is an upper bound and must not be generated against.** It counts every item the");
p("anchoring pass could not tie to a PRIMARY passage, and 86 of those name a source the library");
p("holds. The two tasks at zero survivors -- 4.7 and 5.6 -- have 1 and 2 primary passages against");
p("15 and 39 supporting: a task with one primary passage cannot have eight anchorable items, which");
p("is a fact about the link roles and not about the bank.");
p("");
p("Tasks at or above the floor on survivors alone: " +
  [...byTask.entries()].filter(([, t]) => t.keep >= FLOOR).length + " of " + byTask.size + ".");
p("");

/* ---- the 20 to read, drawn on a stated seed so the sample is re-derivable ---- */
const rng = (s) => () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
const next = rng(SEED);
const keeps = rows.filter((r) => r.verdict === "keep");
const drawn = keeps.map((r, i) => ({ r, k: next() * 1000 + i })).sort((a, b) => a.k - b.k)
  .slice(0, Math.min(N_READ, keeps.length)).map((x) => x.r)
  .sort((a, b) => String(a.task).localeCompare(String(b.task), undefined, { numeric: true }));

p("---");
p("");
p("## " + drawn.length + " survivors to read   (seed " + SEED + ", reproducible: `--seed=" + SEED +
  " --read=" + N_READ + "`)");
p("");
p("These are items the audit says to KEEP. Reading them is the check on the audit itself: if a kept");
p("item is wrong, the conjunction is not strict enough and the whole survivor count is a floor.");
for (const r of drawn) {
  const it = liveById.get(r.prefix);
  p("");
  p("### task " + r.task + " · `" + r.prefix + "`");
  p("");
  p("*task:* " + String(stmt.get(r.task) || "").replace(/\s+/g, " "));
  p("");
  if (!it) { p("**the live row could not be re-read** -- reported rather than shown."); continue; }
  p("**Q** " + String(it.question_text).replace(/\s+/g, " "));
  p("");
  const key = Array.isArray(it.correct_answer) ? it.correct_answer : [it.correct_answer];
  for (const o of Array.isArray(it.options) ? it.options : []) {
    p("- " + (key.includes(o.id) ? "**" : "") + o.id + ") " +
      String(o.text || "").replace(/\s+/g, " ") + (key.includes(o.id) ? "  ← key**" : ""));
  }
  p("");
  p("*explanation:* " + String(it.explanation || "").replace(/\s+/g, " "));
  p("");
  if (r.anchor) {
    p("*anchored in* `" + (r.anchor.clause || "?") + "`: " +
      String(r.anchor.support || "").replace(/\s+/g, " ").slice(0, 260));
  }
  if (r.solver && r.solver.reason) {
    p("");
    p("*solver:* " + String(r.solver.reason).replace(/\s+/g, " ").slice(0, 200));
  }
}

/* what was dropped, by reason -- the enumeration, because a count of drops decides retirements */
p("");
p("---");
p("");
p("## Why items were dropped");
p("");
/* TWO TABLES, BECAUSE TWO INSTRUMENTS DECIDE AND THEY DO NOT CARRY THE SAME WEIGHT.
 *
 * The first version printed one table with a row reading "off-task anchor  86". That number welded a
 * CODE GATE to a MODEL JUDGEMENT under one label -- `anchor-is-primary` compares an address against the
 * task's map and failed on THREE items; the other 83 are the anchoring model saying it could not tie
 * the key to a supplied passage. Same words, different authority, and the collapsed row invited the
 * conclusion that a third of the bank is mapped to the wrong clauses.
 *
 * `kind` is empty on all 278, so the first table was reading a field that does not exist and falling
 * through to the state. A tally over an absent field is the vacuous-pass shape: it printed confidently. */
const drops = rows.filter((x) => x.verdict === "drop");
p("The code gates are mechanical and the anchoring model is a judgement. They are reported apart: an");
p("earlier draft of this table combined them under one label and produced `off-task anchor 86`, where");
p("the gate that compares an address against the task's map failed on **3**.");
p("");
p("**Failing code gates** (an item can fail more than one, so these do not sum to the drop count):");
p("");
const gateFail = {};
for (const r of drops) {
  for (const g of r.gates || []) {
    if (g.pass === false) gateFail[g.id] = (gateFail[g.id] || 0) + 1;
  }
}
p("| gate | items |");
p("|---|---|");
for (const [k, v] of Object.entries(gateFail).sort((a, b) => b[1] - a[1])) p("| `" + k + "` | " + v + " |");
p("");
p("**Which instrument withheld the item:**");
p("");
const who = {};
for (const r of drops) {
  const failed = (r.gates || []).filter((g) => g.pass === false).map((g) => g.id);
  const k = failed.length
    ? "a code gate refused it: " + failed.join(", ")
    : (r.state === "anchored"
      ? "it anchors and the blind solver did not pick the key"
      : "the anchoring model could not tie the key to a supplied passage");
  who[k] = (who[k] || 0) + 1;
}
p("| | items |");
p("|---|---|");
for (const [k, v] of Object.entries(who).sort((a, b) => b[1] - a[1])) p("| " + k + " | " + v + " |");
p("");
if (U) {
  p("**" + U + " unexamined**, which is not a verdict on the item:");
  /* the reason must be why it is UNEXAMINED, not what the instrument that DID run said. The three
   * blindness refusals anchor cleanly and read "anchored in 5.2, verbatim, modal consistent" -- true,
   * and not the reason they are here. Each unexamined item is grouped under the instrument that
   * could not answer, and its own next action, because "re-run" and "buy a standard" are different. */
  p("");
  p("| why it could not be examined | items | what closes it |");
  p("|---|---|---|");
  const GROUPS = {
    solver: {
      reason: "the blind solver payload was refused -- the explanation reproduces the anchor " +
        "passage, so the guard cannot tell a leaked key from an explanation copied out of a " +
        "passage that must be supplied",
      action: "re-run the solver on a payload carrying the passage but not the explanation",
      n: 0,
    },
    source: {
      reason: "the key rests on a source the library does not hold",
      action: "a purchasing decision, not a rewrite",
      n: 0,
    },
  };
  for (const r of rows.filter((x) => x.verdict === "unexamined")) {
    GROUPS[r.solver && r.solver.state === "could-not-run" ? "solver" : "source"].n++;
  }
  for (const g of Object.values(GROUPS).sort((a, b) => b.n - a.n)) {
    if (g.n) p("| " + g.reason + " | " + g.n + " | " + g.action + " |");
  }
  p("");
  p("Neither group is retired and neither counts toward the floor. The sources named by the second");
  p("group, verbatim from the items:");
  for (const r of rows.filter((x) => x.verdict === "unexamined" &&
    !(x.solver && x.solver.state === "could-not-run"))) {
    p("- " + String(r.rests_on || r.reason || "no source recorded").replace(/\s+/g, " ").slice(0, 150));
  }
}

writeFileSync(join(ROOT, "AIMSF-SURVIVORS.md"), md.join("\n") + "\n", "utf8");
writeFileSync(join(ROOT, "AIMSF-SURVIVORS.json"), JSON.stringify({
  audited: rows.length, keep: K, drop: D, unexamined: U, floor: FLOOR, to_generate: need,
  per_task: Object.fromEntries([...byTask.entries()].map(([k, v]) =>
    [k, { live: v.total, keep: v.keep, drop: v.drop, unexamined: v.unexamined,
      generate: Math.max(0, FLOOR - v.keep) }])),
  keep_ids: keeps.map((r) => r.prefix), drop_ids: rows.filter((r) => r.verdict === "drop").map((r) => r.prefix),
  unexamined_ids: rows.filter((r) => r.verdict === "unexamined").map((r) => r.prefix),
}, null, 1) + String.fromCharCode(10), "utf8");
console.log("audited " + rows.length + "   keep " + K + "   drop " + D + "   unexamined " + U);
console.log("to generate to reach the floor of " + FLOOR + ": " + need);
console.log("wrote AIMSF-SURVIVORS.md and AIMSF-SURVIVORS.json");
