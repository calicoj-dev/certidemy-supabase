#!/usr/bin/env node
/**
 * check-form-clause-spread.mjs -- does an assembled exam form limit items per (source, clause)?
 *
 * READ-ONLY. No --apply, no writes, unknown flags exit 2. Asked in PROMPT-87 s5 -- "Report it; don't build
 * it" -- and answered here as an enumeration rather than as a claim, because the ruling's next move depends
 * on the size of the exposure and not only on its existence.
 *
 * ============ THE ANSWER IS NO, AND THE REASON IS STRUCTURAL ============
 *
 * `functions/generate-mock-exam` never reads `item_grounding`. The string appears nowhere under
 * `functions/`. The assembler cannot limit by clause because it has no visibility of what any item is
 * anchored to. What it DOES balance is:
 *
 *   dedupe_key    stem identity, resolved through the English sibling via `question_group_id`
 *   task          round-robin across tasks so one task cannot dominate a form
 *   difficulty    easy / medium / hard quotas
 *
 * So the within-task anchor cap ruled in PROMPT-86 is a cap on the BANK, not on a FORM -- and it is keyed
 * PER TASK, which means one clause can legitimately be at cap in several tasks at once and every one of
 * those items can land on the same form.
 *
 * ============ WHAT THIS MEASURES ============
 *
 * Over every anchored secure item, ignoring task: how many items share a (source, clause), how many clauses
 * carry more than the per-task cap, and what the worst case would be on a form of the certification's own
 * `num_questions`. The worst case is an UPPER BOUND, not a prediction -- the assembler shuffles and quotas,
 * so it says what the design permits, which is the question that was asked.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, getAllIn, REST_URL } from "./_pg.mjs";
import { CAP } from "./lib/anchor-cap.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". This script is READ-ONLY and takes none.");
  process.exit(2);
}
const KEY = requireKey(dirname(fileURLToPath(import.meta.url)));
const certs = await getAll(KEY, "certifications?select=id,code,num_questions&order=code");
const tasks = await getAll(KEY, "tasks?select=id,code,domain_id&order=code");
const ig = await getAll(KEY,
  "item_grounding?select=question_id,key_support_clause,source_id&order=question_id");
/* BOUNDED BY THE ANCHORED IDS, not a sweep of the English corpus. Reading every English question times out
 * server-side, and it would also be fetching rows to discard: the only questions this can be about are the
 * ones item_grounding names. */
const qs = await getAllIn(KEY, "quiz_questions",
  "id,task_id,certification_id,pool,status,retired_at", "id",
  ig.map((g) => g.question_id), "&order=id");
const qById = new Map(qs.map((r) => [r.id, r]));
const taskCode = new Map(tasks.map((t) => [t.id, t.code]));
/* The denominator is COUNTED BY THE SERVER, never derived from fetched rows -- the whole-corpus read is
 * what timed out, and counting by fetching is the defect one level up from failing to page. */
const secureCount = new Map();
for (const c of certs) {
  const res = await fetch(REST_URL + "/quiz_questions?select=id&certification_id=eq." + c.id +
    "&language=eq.en&pool=eq.secure&retired_at=is.null&limit=1",
    { headers: { apikey: KEY, Authorization: "Bearer " + KEY, Prefer: "count=exact" } });
  if (!res.ok) throw new Error(res.status + " counting secure items for " + c.code);
  const cr = res.headers.get("content-range") || "";
  const n = Number(String(cr).split("/")[1]);
  if (!Number.isFinite(n)) throw new Error("no exact count in content-range for " + c.code);
  secureCount.set(c.id, n);
}

console.log("THE ASSEMBLER DOES NOT LIMIT BY CLAUSE, AND CANNOT");
console.log("  generate-mock-exam reads item_grounding:  NO (the string is absent from functions/)");
console.log("  it balances instead on:                   dedupe_key (stem identity), task, difficulty");
console.log("  so PROMPT-86's cap of " + CAP + " is a cap on the BANK, per task -- not on a form");
console.log("");

/* group anchored items by certification, then by (source, clause) ignoring task */
const byCert = new Map();
let noQuestion = 0, notSecure = 0;
for (const g of ig) {
  const q = qById.get(g.question_id);
  if (!q) { noQuestion++; continue; }          /* a translation row or a deleted item */
  if (q.pool !== "secure" || q.retired_at) { notSecure++; continue; }
  const cid = q.certification_id;
  if (!byCert.has(cid)) byCert.set(cid, new Map());
  const key = g.source_id + " :: " + g.key_support_clause;
  const m = byCert.get(cid);
  if (!m.has(key)) m.set(key, []);
  m.get(key).push({ task: taskCode.get(q.task_id) || "(no task)", status: q.status });
}
console.log("ANCHORED SECURE ITEMS, GROUPED BY (source, clause) IGNORING TASK");
console.log("  item_grounding rows                     " + ig.length);
console.log("  rows whose question is not a live secure item  " + (noQuestion + notSecure) +
  "   (" + noQuestion + " no question row, " + notSecure + " not secure or retired)");
console.log("");
let anyOver = 0;
for (const c of certs) {
  const m = byCert.get(c.id);
  if (!m || !m.size) continue;
  const rows = [...m.entries()].map(([k, v]) => ({ key: k, n: v.length, tasks: new Set(v.map((x) => x.task)) }))
    .sort((a, b) => b.n - a.n);
  const total = rows.reduce((s, r) => s + r.n, 0);
  const over = rows.filter((r) => r.n > CAP);
  anyOver += over.length;
  console.log("    " + c.code + "   " + total + " anchored secure item(s) over " + rows.length +
    " distinct (source, clause) key(s); form size " + (c.num_questions ?? "?"));
  console.log("      clauses carrying more than the per-task cap of " + CAP + ":  " + over.length);
  const secureTotal = secureCount.get(c.id) ?? null;
  console.log("      COVERAGE: " + total + " of " + (secureTotal ?? "?") +
    " live secure item(s) in this certification carry an anchor" +
    (secureTotal ? "  (" + Math.round((total / secureTotal) * 100) + "%)" : ""));
  for (const r of over.slice(0, 12)) {
    console.log("        " + String(r.n).padStart(3) + "  " + r.key +
      "   across task(s) " + [...r.tasks].sort().join(", "));
  }
  if (over.length > 12) console.log("        ... and " + (over.length - 12) + " more");
  const worst = rows.length ? rows[0] : null;
  if (worst && c.num_questions) {
    console.log("      UPPER BOUND on a " + c.num_questions + "-question form: " +
      Math.min(worst.n, c.num_questions) + " item(s) on `" + worst.key + "`");
    console.log("      That is what the design PERMITS, not a prediction -- the assembler shuffles and");
    console.log("      applies task and difficulty quotas, neither of which knows about a clause.");
  }
  console.log("");
}
if (!anyOver) {
  console.log("  No (source, clause) carries more than " + CAP + " anchored secure item(s) today, so nothing");
  console.log("  is currently exposed. That is a fact about the bank's SIZE, not about the assembler:");
  console.log("  the limit does not exist, and the bank is simply not yet large enough to need it.");
  console.log("");
  console.log("  AND THIS IS BLIND TO EVERY UNANCHORED ITEM. Only the grounded generator writes an");
  console.log("  item_grounding row, so the authored and audited items that make up most of any form");
  console.log("  are invisible here -- whatever clause they rest on is unrecorded. The finding is about");
  console.log("  the ANCHORED SUBSET, at the coverage printed above, and not about a form.");
}
