#!/usr/bin/env node
/**
 * shortfall-13.mjs -- the arithmetic for how many task 1.3 items to generate, printed term by term.
 *
 * READ-ONLY, no flags, no writes, no model calls.
 *
 *   shortfall = 8 - (kept 1.3 items NOT over the cap  +  the 2 just inserted)
 *
 * Every term is derived, not typed. A shortfall is the number a generation run is sized from, and this
 * repository has already had a run sized from a number that turned out to be a fact about a map.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { CAP, anchorKey } from "./lib/anchor-cap.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const FLOOR = 8;
const TASK = "1.3";

const surv = JSON.parse(readFileSync(join(ROOT, "AIMSF-SURVIVORS.json"), "utf8"));
const anchorOf = new Map(), taskOf = new Map();
for (const f of ["ANCHOR-OR-FLAG-AIMS-F-all-secure.json", "ANCHOR-OR-FLAG-AIMS-F-all-secure-rerun.json",
  "ANCHOR-OR-FLAG-AIMS-F-all-secure-modal.json"]) {
  const j = JSON.parse(readFileSync(join(ROOT, f), "utf8"));
  for (const it of j.items || []) {
    if (it.anchor && it.anchor.clause) anchorOf.set(it.prefix, it.anchor.clause);
    taskOf.set(it.prefix, it.task);
  }
}
const kept13 = (surv.keep_ids || []).filter((p) => taskOf.get(p) === TASK);

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F");
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code&order=code"))
  .filter((t) => t.certification_id === certs[0].id);
const codeOf = new Map(tasks.map((t) => [t.id, t.code]));
const qs = await getAll(KEY, "quiz_questions?select=id,task_id,status,pool&certification_id=eq." +
  certs[0].id + "&language=eq.en&order=id");
const taskOfQ = new Map(qs.map((r) => [r.id, r.task_id]));
const ig = (await getAll(KEY, "item_grounding?select=question_id,key_support_clause,source_id&order=question_id"))
  .filter((g) => codeOf.get(taskOfQ.get(g.question_id)) === TASK);

/* the census, and which kept items sit over the cap within it */
const counts = new Map();
for (const g of ig) {
  const k = anchorKey(g.source_id, g.key_support_clause);
  counts.set(k, (counts.get(k) || 0) + 1);
}
const keptRows = kept13.map((p) => ({ prefix: p, clause: anchorOf.get(p) || "(no anchor recorded)" }));
const running = new Map(counts);
const keptCounted = [], keptOver = [];
for (const r of keptRows) {
  const k = anchorKey("ISO/IEC 42001", r.clause);
  const n = running.get(k) || 0;
  if (n >= CAP) { keptOver.push({ ...r, already: n }); continue; }
  running.set(k, n + 1);
  keptCounted.push(r);
}

console.log("AIMS-F task " + TASK + " -- shortfall arithmetic  (floor " + FLOOR + ", cap " + CAP + ")");
console.log("");
console.log("  kept by the audit                        " + String(kept13.length).padStart(3));
for (const r of keptRows) console.log("      " + r.prefix + "  anchors " + r.clause);
console.log("  ...of those, OVER the cap                " + String(keptOver.length).padStart(3));
for (const r of keptOver) console.log("      " + r.prefix + "  " + r.clause + " already carries " + r.already);
console.log("  kept and NOT over the cap            (a) " + String(keptCounted.length).padStart(3));
const inserted = ig.length;
console.log("  inserted as pending_review           (b) " + String(inserted).padStart(3));
for (const g of ig) console.log("      " + String(g.question_id).slice(0, 8) + "  anchors " + g.key_support_clause);
const have = keptCounted.length + inserted;
const shortfall = Math.max(0, FLOOR - have);
console.log("  ------------------------------------------");
console.log("  a + b                                    " + String(have).padStart(3));
console.log("  " + FLOOR + " - (a + b)                    SHORTFALL " + String(shortfall).padStart(3));
console.log("");
console.log("clauses at or over the cap for " + TASK + " (a run may not anchor here):");
const full = [...running.entries()].filter(([, n]) => n >= CAP);
for (const [k, n] of full) console.log("  " + k.replace("|", " ") + "   n=" + n);
if (!full.length) console.log("  none");

/* the kept item's anchor is worth a line of its own */
for (const r of keptRows) {
  if (/^A\.6\.[12]$|^A\.\d+\.\d+$/.test(r.clause) === false) continue;
}
const container = keptRows.filter((r) => r.clause === "A.6.1" || r.clause === "A.6.2");
if (container.length) {
  console.log("");
  console.log("NOTE: " + container.length + " kept 1.3 item(s) anchor in a CONTAINER (" +
    container.map((r) => r.clause).join(", ") + ").");
  console.log("Under the effective-primary rule a container cannot carry a key -- its text is its");
  console.log("children's text run together. The item is counted here because it is kept and under the");
  console.log("cap, and the anchor is reported rather than quietly re-pointed: re-anchoring a live kept");
  console.log("item is a decision, not a cleanup.");
}
console.log("");
console.log("GENERATE: " + shortfall);
