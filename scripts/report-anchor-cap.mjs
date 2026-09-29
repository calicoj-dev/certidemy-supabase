#!/usr/bin/env node
/**
 * report-anchor-cap.mjs -- which KEPT AIMS-F items already break the within-task anchor cap.
 *
 * READ-ONLY. No writes, no model calls, no flags. Ruled PROMPT-86 section 3: REPORT ONLY, drop nothing.
 *
 * The census counts everything that would sit on a form for a task: items the audit kept, and items
 * already inserted as pending_review (their anchor is recorded in `item_grounding`). The cap and the key
 * come from lib/anchor-cap.mjs -- the same module the generator's prompt and gate use, so a clause this
 * report calls over-cap is exactly a clause the generator will refuse.
 *
 * A BREACH HERE IS NOT A DEFECT IN ANY ONE ITEM. Each of them passed every gate on its own. The cap is a
 * property of the SET, which is why no single item can be blamed and why this drops nothing: which of an
 * over-cap group to retire is a judgement about coverage, not about correctness.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { CAP, anchorKey, anchorCapControls } from "./lib/anchor-cap.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
{
  const c = anchorCapControls({ quiet: true });
  if (c.fails.length) {
    console.error("REFUSING TO RUN: the anchor-cap controls fail:");
    for (const f of c.fails) console.error("  " + f);
    process.exit(3);
  }
  console.log("anchor-cap controls: " + c.examined + " case(s), 0 fail   (cap = " + CAP + ")");
}

const surv = JSON.parse(readFileSync(join(ROOT, "AIMSF-SURVIVORS.json"), "utf8"));
const RD = (n) => existsSync(join(ROOT, n)) ? JSON.parse(readFileSync(join(ROOT, n), "utf8")) : null;
const layers = ["ANCHOR-OR-FLAG-AIMS-F-all-secure.json", "ANCHOR-OR-FLAG-AIMS-F-all-secure-rerun.json",
  "ANCHOR-OR-FLAG-AIMS-F-all-secure-modal.json"];
const anchorOf = new Map();
const taskOf = new Map();
for (const f of layers) {
  const j = RD(f);
  if (!j) continue;
  for (const it of j.items || []) {
    if (it.anchor && it.anchor.clause) anchorOf.set(it.prefix, it.anchor.clause);
    taskOf.set(it.prefix, it.task);
  }
}
const kept = surv.keep_ids || [];
console.log("kept items: " + kept.length + "; anchors resolved for " +
  kept.filter((p) => anchorOf.has(p)).length);
const noAnchor = kept.filter((p) => !anchorOf.has(p));
if (noAnchor.length) {
  console.log("  " + noAnchor.length + " kept item(s) carry NO recorded anchor, so they cannot be counted");
  console.log("  against the cap and are reported separately rather than assumed harmless.");
}

/* the inserted pending_review items, whose anchors are authoritative in item_grounding */
const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F");
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code&order=code"))
  .filter((t) => t.certification_id === certs[0].id);
const codeOfTask = new Map(tasks.map((t) => [t.id, t.code]));
const live = await getAll(KEY, "quiz_questions?select=id,task_id,pool,status,visibility,retired_at" +
  "&certification_id=eq." + certs[0].id + "&language=eq.en&order=id");
const taskOfId = new Map(live.map((r) => [r.id, r.task_id]));
const ig = await getAll(KEY,
  "item_grounding?select=question_id,key_support_clause,source_id&order=question_id");
console.log("item_grounding rows: " + ig.length);

/* ---- the census, per (task, source, clause) ---- */
const counts = new Map();   /* taskCode -> Map(key -> {n, members:[]}) */
const bump = (code, source, clause, who) => {
  if (!code) return;
  if (!counts.has(code)) counts.set(code, new Map());
  const m = counts.get(code);
  const k = anchorKey(source, clause);
  if (!m.has(k)) m.set(k, { source, clause, n: 0, members: [] });
  const e = m.get(k);
  e.n++; e.members.push(who);
};
for (const p of kept) {
  const cl = anchorOf.get(p);
  if (!cl) continue;
  bump(taskOf.get(p), "ISO/IEC 42001", cl, p + " (kept)");
}
for (const g of ig) {
  const tid = taskOfId.get(g.question_id);
  bump(codeOfTask.get(tid), g.source_id, g.key_support_clause,
    String(g.question_id).slice(0, 8) + " (pending_review)");
}

const breaches = [];
for (const [code, m] of counts) {
  for (const [, e] of m) if (e.n > CAP) breaches.push({ task: code, ...e });
}
breaches.sort((a, b) => b.n - a.n ||
  String(a.task).localeCompare(String(b.task), undefined, { numeric: true }));

const md = [];
const p = (s = "") => md.push(s);
p("# AIMS-F: kept items already over the within-task anchor cap");
p("");
p("**Report only. Nothing is dropped**, as ruled. Cap = " + CAP + " secure items per (source, clause) per task.");
p("");
p("The census counts items the audit KEPT plus items already inserted as `pending_review`, whose anchors");
p("are read from `item_grounding`. A breach is a property of the SET, not a defect in any one item --");
p("each passed every gate on its own -- so which of an over-cap group to retire is a coverage judgement.");
p("");
if (!breaches.length) {
  p("**No kept AIMS-F (task, source, clause) group exceeds " + CAP + ".**");
} else {
  p("| task | source | clause | items | which |");
  p("|---|---|---|---|---|");
  for (const b of breaches) {
    p("| " + b.task + " | " + String(b.source).replace("ISO/IEC ", "") + " | `" + b.clause + "` | **" +
      b.n + "** | " + b.members.join(", ") + " |");
  }
  p("");
  p("**" + breaches.length + " group(s) over the cap**, " +
    breaches.reduce((s, b) => s + (b.n - CAP), 0) + " item(s) in excess.");
}
p("");
p("## At the cap exactly (no room for another item)");
p("");
const atExact = [];
for (const [code, m] of counts) for (const [, e] of m) if (e.n === CAP) atExact.push({ task: code, ...e });
atExact.sort((a, b) => String(a.task).localeCompare(String(b.task), undefined, { numeric: true }));
p(atExact.length + " group(s). These are not breaches; they are clauses a future run may not anchor in.");
p("");
for (const e of atExact) p("- " + e.task + "  " + String(e.source).replace("ISO/IEC ", "") + " `" + e.clause + "`");
p("");
if (noAnchor.length) {
  p("## Kept items with no recorded anchor (" + noAnchor.length + ")");
  p("");
  p("Not counted against the cap, and reported rather than assumed harmless: an item whose anchor nobody");
  p("recorded could be sitting on a clause that is already full.");
  p("");
  for (const x of noAnchor) p("- `" + x + "`  task " + (taskOf.get(x) || "?"));
  p("");
}
writeFileSync(join(ROOT, "AIMSF-ANCHOR-CAP.md"), md.join("\n") + "\n", "utf8");
writeFileSync(join(ROOT, "AIMSF-ANCHOR-CAP.json"), JSON.stringify({
  cap: CAP, breaches, at_cap_exactly: atExact, kept_without_anchor: noAnchor,
  census: Object.fromEntries([...counts.entries()].map(([k, m]) =>
    [k, Object.fromEntries([...m.entries()].map(([kk, v]) => [kk, v.n]))])),
}, null, 1) + String.fromCharCode(10), "utf8");

console.log("");
console.log("groups over the cap: " + breaches.length);
for (const b of breaches) console.log("  " + b.task + "  " + b.source + " " + b.clause + "  n=" + b.n);
console.log("groups exactly at the cap: " + atExact.length);
console.log("wrote AIMSF-ANCHOR-CAP.md and .json");
