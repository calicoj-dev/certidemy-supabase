#!/usr/bin/env node
/**
 * PROMPT-104 s3c: project the full translation spend, HIGH END, from two measured points.
 *
 * READ-ONLY. `--ceiling=<usd>` exits 3 if the high end exceeds it. Unknown flags exit 2.
 *
 * TWO POINTS, BECAUSE ONE CANNOT SEPARATE THE PER-CALL COST FROM THE PER-ITEM COST. The system
 * prompt is ~5k tokens and is re-sent per call, so a task of one item pays it for one item and a task
 * of eight amortises it. Measured: 1 item / 2 calls = $0.2010 and 6 items / 2 calls = $0.6914, which
 * solves to a fixed per-call cost and a variable per-item cost. Projecting from the batched figure
 * alone would UNDER-state a scope full of small tasks -- the mean-over-the-wrong-population shape
 * this repository has paid for before, aimed at money.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

const BATCH = 8, LANGS = 2;
let CEILING = null, CERT = "AIMS-F";
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--ceiling=([0-9.]+)$/.exec(a))) { CEILING = Number(m[1]); continue; }
  if ((m = /^--cert=(.+)$/.exec(a))) { CERT = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --cert=<CODE>, --ceiling=<usd>."); process.exit(2);
}
/* the two measured points, from AIMSF-TRANSLATION-R1.json runs on task 2.4 */
const P1 = { items: 1, calls: 2, usd: 0.2010 };
const P6 = { items: 6, calls: 2, usd: 0.6914 };
const V = (P6.usd - P1.usd) / (P6.items - P1.items);          /* per item, both languages */
const F = (P1.usd - V * P1.items) / P1.calls;                  /* per call */
if (!(V > 0) || !(F > 0)) { console.error("REFUSING: the two points do not solve to positive costs."); process.exit(2); }

const HERE = dirname(fileURLToPath(import.meta.url));
const KEY = requireKey(HERE);
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
const tasks = await getAll(KEY, "tasks?select=id,code&order=code");
const codeOf = new Map(tasks.map((t) => [t.id, t.code]));
const rows = await getAll(KEY, "quiz_questions?select=id,task_id,language,question_group_id" +
  "&certification_id=eq." + cert.id + "&retired_at=is.null&order=id");
const grounding = new Map((await getAll(KEY,
  "item_grounding?select=question_id,review_verdict,review_note&order=question_id")).map((g) => [g.question_id, g]));
const sib = new Map();
for (const r of rows) {
  if (r.language === "en" || !r.question_group_id) continue;
  if (!sib.has(r.question_group_id)) sib.set(r.question_group_id, new Set());
  sib.get(r.question_group_id).add(r.language);
}
const scope = rows.filter((r) => {
  if (r.language !== "en") return false;
  const g = grounding.get(r.id);
  if (!g || g.review_verdict !== "accept" || /\breserve:/i.test(String(g.review_note || ""))) return false;
  const have = r.question_group_id ? (sib.get(r.question_group_id) || new Set()) : new Set();
  return !(have.has("es-419") && have.has("pt-BR"));
});
if (!scope.length) { console.error("EXTRACTION EMPTY: no accepted untranslated rows. Not a pass."); process.exit(2); }

const perTask = new Map();
for (const r of scope) {
  const c = codeOf.get(r.task_id);
  perTask.set(c, (perTask.get(c) || 0) + 1);
}
let calls = 0;
for (const n of perTask.values()) calls += Math.ceil(n / BATCH) * LANGS;
const high = calls * F + scope.length * V;
/* the FLOOR is one perfectly amortised batch per language -- not achievable, printed as the other bound */
const low = Math.ceil(scope.length / BATCH) * LANGS * F + scope.length * V;

console.log("TRANSLATION SPEND PROJECTION   " + CERT);
console.log("");
console.log("  measured  " + P1.items + " item / " + P1.calls + " calls = $" + P1.usd.toFixed(4) +
  "     " + P6.items + " items / " + P6.calls + " calls = $" + P6.usd.toFixed(4));
console.log("  solves to  per call $" + F.toFixed(4) + "   per item (both languages) $" + V.toFixed(4));
console.log("");
console.log("  accepted, untranslated      " + scope.length + " English item(s) across " + perTask.size + " task(s)");
console.log("  batches at " + BATCH + " per call     " + calls + " model call(s)");
console.log("");
console.log("  HIGH END (real task sizes)  $" + high.toFixed(2));
console.log("  low bound (one big batch)   $" + low.toFixed(2));
if (CEILING != null) {
  console.log("  CEILING                     $" + CEILING.toFixed(2));
  if (high > CEILING) {
    console.error("");
    console.error("EXCEEDS THE CEILING on the HIGH END. Not run.");
    process.exitCode = 3;
  } else console.log("\nWITHIN THE CEILING: $" + high.toFixed(2) + " high end of $" + CEILING.toFixed(2) + ".");
}
console.log("");
console.log("WHAT THIS CANNOT SEE: a batch that fails its count assertion is re-paid, and the lint");
console.log("may send an item back. Both push the real figure UP, not down.");
