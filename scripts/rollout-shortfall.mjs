#!/usr/bin/env node
/**
 * rollout-shortfall.mjs -- the per-task shortfall for the AIMS-F rollout, on the ruled arithmetic.
 *
 * READ-ONLY, no writes beyond one artifact, no model calls, unknown flags exit 2. Ruled PROMPT-87 s5.
 *
 * ============ THE ARITHMETIC, AND EVERY TERM IS DERIVED ============
 *
 *   have      = kept items counted ONLY UP TO THE CAP  +  items already inserted as pending_review
 *   shortfall = 8 - have
 *
 * PROVISIONAL ITEMS COUNT AS ZERO until the director rules on them -- the 15 modal-fidelity items are
 * neither kept nor dropped, and counting them either way would put a number nobody has agreed into the
 * size of a generation run.
 *
 * KEPT ITEMS COUNT ONLY UP TO THE CAP because the cap is what a form can carry: a task with six kept items
 * all anchored in one clause has two usable items, not six, and sizing a run off six would leave the form
 * short while the report said it was full.
 *
 * SCOPE: 4 or more EFFECTIVE primaries and a shortfall above zero, excluding 1.3. A task with fewer cannot
 * support eight distinct anchorable items, and generating there produces refusals that are facts about the
 * map rather than about the items.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { CAP, anchorKey } from "./lib/anchor-cap.mjs";
import { classifyPrimaries } from "./lib/effective-primary.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const FLOOR = 8, MIN_PRIMARY = 4, EXCLUDE = new Set(["1.3"]);

const surv = JSON.parse(readFileSync(join(ROOT, "AIMSF-SURVIVORS.json"), "utf8"));
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const LAYERS = ["ANCHOR-OR-FLAG-AIMS-F-all-secure.json", "ANCHOR-OR-FLAG-AIMS-F-all-secure-rerun.json",
  "ANCHOR-OR-FLAG-AIMS-F-all-secure-modal.json", "ANCHOR-OR-FLAG-AIMS-F-all-secure-director-87.json"];
const anchorOf = new Map(), taskOf = new Map();
for (const f of LAYERS) {
  const p = join(ROOT, f);
  if (!existsSync(p)) continue;
  for (const it of (JSON.parse(readFileSync(p, "utf8")).items || [])) {
    if (it.anchor && it.anchor.clause) anchorOf.set(it.prefix, it.anchor.clause);
    taskOf.set(it.prefix, it.task);
  }
}

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F");
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code,statement&order=code"))
  .filter((t) => t.certification_id === certs[0].id);
const codeOf = new Map(tasks.map((t) => [t.id, t.code]));
const sp = await getAll(KEY, "source_passages?select=id,source_id,edition,clause&order=id");
const passageById = new Map(sp.map((p) => [p.id, p]));
const clausesBySource = new Map();
for (const p of sp) {
  if (!clausesBySource.has(p.source_id)) clausesBySource.set(p.source_id, []);
  clausesBySource.get(p.source_id).push(p.clause);
}
const libByClause = new Map(lib.passages.map((p) => [p.source_id + "|" + p.clause, p]));
const ts = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id,passage_id");
const primaryOf = new Map();
for (const r of ts) {
  if (r.role !== "primary") continue;
  const p = passageById.get(r.passage_id);
  if (!p) continue;
  if (!primaryOf.has(r.task_id)) primaryOf.set(r.task_id, []);
  primaryOf.get(r.task_id).push(p);
}
const qs = await getAll(KEY, "quiz_questions?select=id,task_id&certification_id=eq." + certs[0].id +
  "&language=eq.en&order=id");
const taskOfQ = new Map(qs.map((r) => [r.id, r.task_id]));
const ig = await getAll(KEY,
  "item_grounding?select=question_id,key_support_clause,source_id&order=question_id");

const rows = [];
for (const t of tasks) {
  const per = surv.per_task[t.code] || { keep: 0, provisional: 0, unexamined: 0, drop: 0, total: 0 };
  /* effective primaries, per source so the container test uses the right document's nesting */
  const ps = primaryOf.get(t.id) || [];
  let effective = 0;
  for (const p of ps) {
    const full = libByClause.get(p.source_id + "|" + p.clause);
    const [one] = classifyPrimaries([p.clause], () => full, clausesBySource.get(p.source_id) || []);
    if (one.effective) effective++;
  }
  /* the census: inserted rows first, then kept items, each counted only while under the cap */
  const running = new Map();
  let inserted = 0;
  for (const g of ig) {
    if (codeOf.get(taskOfQ.get(g.question_id)) !== t.code) continue;
    const k = anchorKey(g.source_id, g.key_support_clause);
    running.set(k, (running.get(k) || 0) + 1);
    inserted++;
  }
  let keptUsable = 0, keptOverCap = 0;
  for (const pre of (surv.keep_ids || [])) {
    if (taskOf.get(pre) !== t.code) continue;
    const cl = anchorOf.get(pre);
    if (!cl) continue;
    const k = anchorKey("ISO/IEC 42001", cl);
    if ((running.get(k) || 0) >= CAP) { keptOverCap++; continue; }
    running.set(k, (running.get(k) || 0) + 1);
    keptUsable++;
  }
  const have = keptUsable + inserted;
  const shortfall = Math.max(0, FLOOR - have);
  const eligible = effective >= MIN_PRIMARY && shortfall > 0 && !EXCLUDE.has(t.code);
  rows.push({ code: t.code, keep: per.keep, keptUsable, keptOverCap, inserted, provisional: per.provisional,
    have, shortfall, effective, eligible,
    atCap: [...running.entries()].filter(([, n]) => n >= CAP).map(([k]) => k.replace("|", " ")) });
}
rows.sort((a, b) => String(a.code).localeCompare(String(b.code), undefined, { numeric: true }));

const scope = rows.filter((r) => r.eligible);
const md = [];
const p = (s = "") => md.push(s);
p("# AIMS-F rollout: the per-task shortfall");
p("");
p("**Read-only.** Ruled PROMPT-87 s5. Kept items count only up to the cap of " + CAP + " per");
p("(source, clause); the " + rows.reduce((s, r) => s + r.provisional, 0) + " provisional items count as");
p("ZERO until ruled on. Scope is " + MIN_PRIMARY + "+ effective primaries and a shortfall above zero,");
p("excluding 1.3.");
p("");
p("| task | kept | usable | over cap | inserted | provisional | have | shortfall | eff. primaries | in scope |");
p("|---|---|---|---|---|---|---|---|---|---|");
for (const r of rows) {
  p("| " + r.code + " | " + r.keep + " | " + r.keptUsable + " | " + r.keptOverCap + " | " + r.inserted +
    " | " + r.provisional + " | " + r.have + " | **" + r.shortfall + "** | " + r.effective + " | " +
    (EXCLUDE.has(r.code) ? "_excluded_" : r.eligible ? "**yes**" : "no") + " |");
}
p("");
p("**" + scope.length + " task(s) in scope, " + scope.reduce((s, r) => s + r.shortfall, 0) +
  " item(s) to generate.** " + rows.filter((r) => !r.eligible && !EXCLUDE.has(r.code) && r.shortfall > 0).length +
  " task(s) have a shortfall but fewer than " + MIN_PRIMARY + " effective primaries and wait for a map ruling.");
p("");
writeFileSync(join(ROOT, "AIMSF-ROLLOUT-SHORTFALL.md"), md.join("\n") + "\n", "utf8");
writeFileSync(join(ROOT, "AIMSF-ROLLOUT-SHORTFALL.json"), JSON.stringify({
  floor: FLOOR, cap: CAP, min_effective_primary: MIN_PRIMARY, excluded: [...EXCLUDE],
  per_task: rows, in_scope: scope.map((r) => ({ task: r.code, shortfall: r.shortfall })),
  total_to_generate: scope.reduce((s, r) => s + r.shortfall, 0),
}, null, 1) + String.fromCharCode(10), "utf8");

console.log("task   keep usable overcap ins prov have short  eff  scope");
for (const r of rows) {
  console.log("  " + r.code.padEnd(5) + String(r.keep).padStart(4) + String(r.keptUsable).padStart(7) +
    String(r.keptOverCap).padStart(8) + String(r.inserted).padStart(4) + String(r.provisional).padStart(5) +
    String(r.have).padStart(5) + String(r.shortfall).padStart(6) + String(r.effective).padStart(5) +
    "  " + (EXCLUDE.has(r.code) ? "excluded" : r.eligible ? "YES" : "-"));
}
console.log("\nin scope: " + scope.length + " task(s), " + scope.reduce((s, r) => s + r.shortfall, 0) +
  " item(s) to generate");
console.log("wrote AIMSF-ROLLOUT-SHORTFALL.md and .json");
