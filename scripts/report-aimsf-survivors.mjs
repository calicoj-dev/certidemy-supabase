#!/usr/bin/env node
/**
 * report-aimsf-survivors.mjs -- which live AIMS-F secure English items survive, per task.
 *
 * READ-ONLY. No `--apply`, nothing is retired, nothing is generated. Unknown flags exit 2.
 *
 * ============ THE KEEP RULE, VERBATIM ============
 *
 *   "Keep an item only if it anchors cleanly AND the solver picks its key."
 *
 * Both, not either. Over the director's read of 40 items, anchor-or-flag caught 7 of his 14 findings and
 * the blind solver caught 5, and the solver MISSED a Tier A -- it reasoned its way to an invented
 * control's key from a neighbouring clause. Anchoring does not ask for an opinion; it asks for the
 * sentence. Neither alone would do.
 *
 * ============ TWO ARTIFACTS, AND THE RE-RUN WINS PER ITEM ============
 *
 * The baseline run covered all 278 items against PRIMARY passages only. The re-run covers the 106 whose
 * verdict the map change could move, against every linked passage. Merging per item rather than
 * replacing the file keeps the 172 verdicts nothing touched -- and each row records WHICH run decided
 * it, because "re-measured after the fix" and "not re-measured" are different facts about an item and a
 * single merged number cannot say which.
 *
 * ============ AND FOUR OUTCOMES, NOT TWO ============
 *
 *   keep        anchors cleanly AND the solver picked the key
 *   drop        a real finding: a code gate the item is answerable for, or still off-task
 *   provisional modal-fidelity only -- standing by ruling, 5 go to the director in full below
 *   unexamined  nothing measured it: an unheld source, a refused payload, or a gate that judged the
 *               ANCHORING MODEL'S quote where the item makes no such claim
 *
 * `unexamined` and `provisional` do NOT count toward the floor: the floor is items we can stand behind.
 * They are also not retired, and the difference matters -- one needs a purchase or a re-run, the other
 * needs a human.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

let N_READ = 20, SEED = 11, N_MODAL = 5;
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--read=(\d+)$/.exec(a))) { N_READ = Number(m[1]); continue; }
  if ((m = /^--seed=(\d+)$/.exec(a))) { SEED = Number(m[1]); continue; }
  if ((m = /^--modal=(\d+)$/.exec(a))) { N_MODAL = Number(m[1]); continue; }
  console.error("Unrecognised flag: " + a + ". Known: --read=, --seed=, --modal=. READ-ONLY.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const FLOOR = 8;

const BASE = join(ROOT, "ANCHOR-OR-FLAG-AIMS-F-all-secure.json");
const RERUN = join(ROOT, "ANCHOR-OR-FLAG-AIMS-F-all-secure-rerun.json");
if (!existsSync(BASE)) {
  console.error("missing " + BASE);
  console.error("Run: node scripts/anchor-existing-items.mjs --cert=AIMS-F --all-secure");
  process.exit(2);
}
const baseJ = JSON.parse(readFileSync(BASE, "utf8"));
const baseItems = baseJ.items || [];
if (!baseItems.length) { console.error("the baseline artifact carries no items"); process.exit(2); }

/* ---- merge: the re-run wins per item, and every re-run item must exist in the baseline ---- */
let rerunItems = [];
if (existsSync(RERUN)) {
  const rj = JSON.parse(readFileSync(RERUN, "utf8"));
  rerunItems = rj.items || [];
}
const merged = new Map();
for (const it of baseItems) merged.set(it.prefix, { ...it, decided_by: "baseline" });
const orphans = [];
for (const it of rerunItems) {
  if (!merged.has(it.prefix)) { orphans.push(it.prefix); continue; }
  merged.set(it.prefix, { ...it, decided_by: "re-run" });
}
if (orphans.length) {
  console.error("ABORT: " + orphans.length + " re-run item(s) are not in the baseline, so the merge " +
    "would ADD items rather than update them: " + orphans.slice(0, 6).join(", "));
  process.exit(2);
}
const items = [...merged.values()];
if (items.length !== baseItems.length) {
  console.error("ABORT: the merge changed the item count, " + baseItems.length + " -> " + items.length);
  process.exit(2);
}

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F");
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code,statement&order=code"))
  .filter((t) => t.certification_id === certs[0].id);
const stmt = new Map(tasks.map((t) => [t.code, t.statement]));
const live = await getAll(KEY, "quiz_questions?select=id,task_id,question_text,options,correct_answer," +
  "explanation,pool,status,retired_at&certification_id=eq." + certs[0].id + "&language=eq.en&order=id");
const liveById = new Map(live.map((r) => [String(r.id).slice(0, 8), r]));

const failedGates = (it) => (it.gates || []).filter((g) => g.pass === false).map((g) => g.id);

/* ============ THE VERDICT ============ */
const verdict = (it) => {
  if (it.state === "cannot-be-checked") {
    return { v: "unexamined", why: "the key rests on a source the library does not hold" };
  }
  const s = (it.solver && it.solver.state) || "(none)";
  if (it.state === "anchored" && s === "could-not-run") {
    return { v: "unexamined", why: "the blind solver payload was refused, so nothing solved it" };
  }
  if (it.state === "anchored" && s === "accepted") {
    return { v: "keep", why: "anchored, and the solver picked the key" };
  }
  if (it.state === "anchored") {
    return { v: "drop", why: "it anchors and the blind solver did not pick the key" };
  }
  const f = failedGates(it);
  /* ---- verbatim / clause-exists judge the ANCHORING MODEL'S quote, not the item ----
   * Ruled 2026-09-29: drop only if the ITEM'S OWN text cites the bad clause or misquotes. Where it does
   * not, the failure is the model's transcription -- not evidence about the item, and not a clearance
   * either, because the anchor was never verified. That is a third state. */
  const quoteGates = f.filter((x) => x === "verbatim" || x === "clause-exists");
  if (quoteGates.length && quoteGates.length === f.length) {
    const a = it.attribution;
    if (a && a.attributable_to_item === false) {
      return { v: "unexamined",
        why: "the anchoring model's quote failed " + quoteGates.join(" and ") + ", and the ITEM does " +
          "not cite that clause or misquote -- the anchor is unverified, not wrong" };
    }
    return { v: "drop", why: "the item's own text carries the " + quoteGates.join("/") + " defect" };
  }
  /* ---- modal-fidelity stands PROVISIONALLY by ruling ---- */
  if (f.length && f.every((x) => x === "modal-fidelity")) {
    return { v: "provisional", why: "modal-fidelity, standing provisionally pending the director's read" };
  }
  if (f.length) return { v: "drop", why: "a code gate refused it: " + f.join(", ") };
  return { v: "drop", why: "the anchoring model could not tie the key to any supplied passage" };
};
/* an anchored item must never reach a verdict with NO solver result: that would be a drop for something
 * unmeasured, wearing a rejection. Asserted rather than assumed. */
{
  const blind = items.filter((it) => it.state === "anchored" &&
    !((it.solver && it.solver.state) || "").length);
  if (blind.length) {
    console.error("ABORT: " + blind.length + " anchored item(s) carry no solver result at all. First: " +
      blind[0].prefix);
    process.exit(2);
  }
}

const rows = items.map((it) => { const r = verdict(it); return { ...it, verdict: r.v, verdict_why: r.why }; });
const byTask = new Map();
for (const r of rows) {
  if (!byTask.has(r.task)) byTask.set(r.task, { keep: 0, drop: 0, provisional: 0, unexamined: 0, total: 0 });
  const t = byTask.get(r.task);
  t[r.verdict]++; t.total++;
}
const K = rows.filter((r) => r.verdict === "keep").length;
const D = rows.filter((r) => r.verdict === "drop").length;
const PR = rows.filter((r) => r.verdict === "provisional").length;
const U = rows.filter((r) => r.verdict === "unexamined").length;

const md = [];
const p = (s = "") => md.push(s);

/* ---- the draw, on a stated seed so any sample is re-derivable ---- */
const rng = (s) => () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
const draw = (pool, n, seed) => {
  const next = rng(seed);
  return pool.map((r, i) => ({ r, k: next() * 1000 + i })).sort((a, b) => a.k - b.k)
    .slice(0, Math.min(n, pool.length)).map((x) => x.r)
    .sort((a, b) => String(a.task).localeCompare(String(b.task), undefined, { numeric: true }));
};
const renderItem = (r) => {
  const it = liveById.get(r.prefix);
  p("");
  p("### task " + r.task + " · `" + r.prefix + "`   (" + r.decided_by + ")");
  p("");
  p("*task:* " + String(stmt.get(r.task) || "").replace(/\s+/g, " "));
  p("");
  if (!it) { p("**the live row could not be re-read** -- reported rather than shown."); return; }
  p("**Q** " + String(it.question_text).replace(/\s+/g, " "));
  p("");
  const key = Array.isArray(it.correct_answer) ? it.correct_answer : [it.correct_answer];
  for (const o of Array.isArray(it.options) ? it.options : []) {
    p("- " + (key.includes(o.id) ? "**" : "") + o.id + ") " +
      String(o.text || "").replace(/\s+/g, " ") + (key.includes(o.id) ? "  ← key**" : ""));
  }
  p("");
  p("*explanation:* " + String(it.explanation || "").replace(/\s+/g, " "));
  if (r.anchor) {
    p("");
    p("*anchored in* `" + (r.anchor.clause || "?") + "`: " +
      String(r.anchor.support || "").replace(/\s+/g, " ").slice(0, 300));
  }
  for (const g of r.gates || []) {
    if (g.pass === false) {
      p("");
      p("*gate* `" + g.id + "`: " + String(g.reason).replace(/\s+/g, " ").slice(0, 280));
    }
  }
  if (r.solver && r.solver.reason) {
    p("");
    p("*solver:* " + String(r.solver.reason).replace(/\s+/g, " ").slice(0, 220));
  }
};

p("# AIMS-F secure English: " + K + " proven sound, " + PR + " provisional, " + U + " unexamined");
p("");
p("**Nothing is retired and nothing is generated by this.** " + rows.length + " live secure English items.");
p("The baseline run measured all " + rows.length + " against PRIMARY passages only; the re-run measured " +
  rows.filter((r) => r.decided_by === "re-run").length + " of them against EVERY linked passage after the");
p("map was re-roled. Each row says which run decided it.");
p("");

/* ---- (4) THE MODAL-FIDELITY READ COMES FIRST, because it is what the ruling asks for ---- */
const modal = rows.filter((r) => r.verdict === "provisional");
p("---");
p("");
p("## " + Math.min(N_MODAL, modal.length) + " modal-fidelity items in full, for the director's read");
p("");
p("These are **provisional, not dropped.** " + PR + " items fail `modal-fidelity` and nothing else: the");
p("gate says the item's claim is stronger or weaker than the anchored clause licenses. That gate has been");
p("wrong about correct items four times -- a lettered sub-item inheriting its list's modal, a scope-clause");
p("exemption, a stem that ASKS rather than asserts, and a noun read as a deontic verb -- so it is read");
p("before anything is retired on it. Drawn on seed " + SEED + ", reproducible with `--seed=" + SEED +
  " --modal=" + N_MODAL + "`.");
for (const r of draw(modal, N_MODAL, SEED)) renderItem(r);

p("");
p("---");
p("");
p("## Totals");
p("");
p("| | |");
p("|---|---|");
p("| items | " + rows.length + " |");
p("| **keep** | **" + K + "** |");
p("| drop | " + D + " |");
p("| provisional (modal-fidelity) | " + PR + " |");
p("| unexamined | " + U + " |");
p("");
p("## Per task, and the shortfall to " + FLOOR);
p("");
p("Only `keep` counts toward the floor: an item nobody has verified is not one we can stand behind.");
p("");
p("| task | live | keep | drop | provisional | unexamined | to generate |");
p("|---|---|---|---|---|---|---|");
let need = 0;
for (const code of [...byTask.keys()].sort((a, b) =>
  String(a).localeCompare(String(b), undefined, { numeric: true }))) {
  const t = byTask.get(code);
  const gen = Math.max(0, FLOOR - t.keep);
  need += gen;
  p("| " + code + " | " + t.total + " | " + t.keep + " | " + t.drop + " | " + t.provisional + " | " +
    t.unexamined + " | " + (gen || "-") + " |");
}
p("| **total** | **" + rows.length + "** | **" + K + "** | **" + D + "** | **" + PR + "** | **" + U +
  "** | **" + need + "** |");
p("");
p("**" + need + " to generate** against " + (35 * FLOOR) + " for a full refill; at about 5.0 model calls");
p("per surviving item, roughly " + Math.round(need * 5.0) + " calls. Tasks at or above the floor on");
p("survivors alone: " + [...byTask.values()].filter((t) => t.keep >= FLOOR).length + " of " + byTask.size + ".");
p("");
p("**" + (PR + U) + " items are neither kept nor dropped**, so the shortfall is still an upper bound:");
p("clearing the provisional ones raises survivors and lowers it.");
p("");

/* ---- the movement the re-run produced, which is the point of keeping two artifacts ---- */
const baseVerdict = new Map();
for (const it of baseItems) baseVerdict.set(it.prefix, verdict({ ...it }).v);
const moved = rows.filter((r) => r.decided_by === "re-run" && baseVerdict.get(r.prefix) !== r.verdict);
p("## What the re-run moved");
p("");
p("| from | to | items |");
p("|---|---|---|");
const mv = {};
for (const r of moved) {
  const k = baseVerdict.get(r.prefix) + " | " + r.verdict;
  mv[k] = (mv[k] || 0) + 1;
}
for (const [k, v] of Object.entries(mv).sort((a, b) => b[1] - a[1])) p("| " + k + " | " + v + " |");
p("");
p(rows.filter((r) => r.decided_by === "re-run").length + " items were re-run; " + moved.length +
  " changed verdict.");
p("");

/* ---- the survivors to read ---- */
const keeps = rows.filter((r) => r.verdict === "keep");
p("---");
p("");
p("## " + Math.min(N_READ, keeps.length) + " survivors to read   (seed " + SEED + ")");
p("");
p("Items the audit says to KEEP. Reading them is the check on the audit itself: if a kept item is wrong,");
p("the conjunction is not strict enough and the survivor count is a floor.");
for (const r of draw(keeps, N_READ, SEED)) renderItem(r);

/* ---- why items were dropped: code gates and model judgement, reported APART ---- */
p("");
p("---");
p("");
p("## Why items were dropped");
p("");
p("The code gates are mechanical; the anchoring model is a judgement. Reported apart, because an earlier");
p("draft combined them under one label and produced `off-task anchor 86` where the gate that compares an");
p("address against the task's map had failed on 3.");
p("");
const gf = {};
for (const r of rows.filter((x) => x.verdict === "drop")) {
  for (const id of failedGates(r)) gf[id] = (gf[id] || 0) + 1;
}
p("| failing code gate | items |");
p("|---|---|");
for (const [k, v] of Object.entries(gf).sort((a, b) => b[1] - a[1])) p("| `" + k + "` | " + v + " |");
p("");
const why = {};
for (const r of rows.filter((x) => x.verdict === "drop")) why[r.verdict_why] = (why[r.verdict_why] || 0) + 1;
p("| | items |");
p("|---|---|");
for (const [k, v] of Object.entries(why).sort((a, b) => b[1] - a[1])) p("| " + k + " | " + v + " |");
p("");
p("## The " + U + " unexamined, which is not a verdict on the item");
p("");
const uw = {};
for (const r of rows.filter((x) => x.verdict === "unexamined")) uw[r.verdict_why] = (uw[r.verdict_why] || 0) + 1;
p("| why it could not be examined | items |");
p("|---|---|");
for (const [k, v] of Object.entries(uw).sort((a, b) => b[1] - a[1])) p("| " + k + " | " + v + " |");

writeFileSync(join(ROOT, "AIMSF-SURVIVORS.md"), md.join("\n") + "\n", "utf8");
writeFileSync(join(ROOT, "AIMSF-SURVIVORS.json"), JSON.stringify({
  items: rows.length, keep: K, drop: D, provisional: PR, unexamined: U, floor: FLOOR, to_generate: need,
  rerun_items: rows.filter((r) => r.decided_by === "re-run").length, moved: moved.length,
  per_task: Object.fromEntries([...byTask.entries()].map(([k, v]) =>
    [k, { ...v, generate: Math.max(0, FLOOR - v.keep) }])),
  keep_ids: keeps.map((r) => r.prefix),
  drop_ids: rows.filter((r) => r.verdict === "drop").map((r) => r.prefix),
  provisional_ids: modal.map((r) => r.prefix),
  unexamined_ids: rows.filter((r) => r.verdict === "unexamined").map((r) => r.prefix),
}, null, 1) + String.fromCharCode(10), "utf8");
console.log("items " + rows.length + "   keep " + K + "   drop " + D + "   provisional " + PR +
  "   unexamined " + U);
console.log("re-run decided " + rows.filter((r) => r.decided_by === "re-run").length + ", " +
  moved.length + " changed verdict");
console.log("to generate to reach the floor of " + FLOOR + ": " + need);
console.log("wrote AIMSF-SURVIVORS.md and AIMSF-SURVIVORS.json");
