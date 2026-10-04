#!/usr/bin/env node
/**
 * backfill-rescue-solver.mjs -- copy a RESCUED item's earned solver verdict into its `item_grounding`
 * row. WRITES with `--apply`; dry by default. Unknown flags exit 2.
 *
 * Ruled PROMPT-121 s2a. `insert-pilot-drafts.mjs` writes `solver: it.solver ?? null`, and a rescued
 * item's artifact `solver` is null -- it was rejected by code before the solver ever ran, and the
 * verdict it later EARNED during the rescue was recorded in `revised[].solver` instead. So 17 sound
 * rows carry a null solver and `approve-grounded-items` condition 3 refuses them.
 *
 * ============ THE VERDICT IS COPIED, NEVER RE-DERIVED ============
 *
 * No model call. The row gets the verdict it actually cleared, read out of the artifact that recorded
 * the rescue. Re-running the solver here would replace a verdict a human accepted with a fresh one
 * nobody read -- the same defect as re-stamping a hash instead of comparing it, which is why
 * `gen-grounded-items --reuse-solver` exists at all.
 *
 * ============ AND IT ONLY TOUCHES ROWS WHOSE SOLVER IS NULL ============
 *
 * A row that already carries a verdict is left alone and reported. This cannot overwrite a judgement.
 *
 *   --cert=<CODE>   required
 *   --apply         write
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let CERT = null, APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  const m = a.match(/^--cert=(.+)$/); if (m) { CERT = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --cert=, --apply (dry by default).");
  process.exit(2);
}
if (!CERT) { console.error("--cert=<CODE> is required."); process.exit(2); }
const SLUG = CERT.replace(/-/g, "");

/* the inserted-row bridge: artifact item_id -> live row id */
const insPath = join(ROOT, SLUG + "-INSERTED.json");
if (!existsSync(insPath)) { console.error("no " + SLUG + "-INSERTED.json"); process.exit(2); }
const rowIdOf = new Map(), fromArtifact = new Map();
for (const b of (JSON.parse(readFileSync(insPath, "utf8")).batches || [])) {
  for (const r of (b.rows || [])) { rowIdOf.set(r.item_id, r.id); fromArtifact.set(r.item_id, b.from); }
}

/* every rescue recorded in any round artifact, with the verdict it earned */
const earned = new Map();
for (const f of readdirSync(ROOT)) {
  if (!new RegExp("^" + SLUG + "-R\\d+$").test(f)) continue;
  let j;
  try { j = JSON.parse(readFileSync(join(ROOT, f), "utf8")); } catch { continue; }
  for (const it of (j.items || [])) {
    /* a `revised` entry's `solver` is either ["accepted","accepted"] from the rescue path, or the
     * string "KEPT: accepted (...)" from a keep_verdict edit. Both are a recorded verdict. */
    for (const r of (it.revised || [])) {
      let state = null;
      if (Array.isArray(r.solver) && r.solver.length && r.solver.every((s) => s === "accepted")) state = "accepted";
      else if (typeof r.solver === "string" && /^KEPT: accepted/.test(r.solver)) state = "accepted";
      if (state) earned.set(it.item_id, { state, where: f, what: r.what, kind: r.kind });
    }
    if (it.kept_verdict && it.kept_verdict.state === "accepted" && !earned.has(it.item_id)) {
      earned.set(it.item_id, { state: "accepted", where: f, what: "kept_verdict", kind: "edit" });
    }
  }
}
console.log("rescues with an earned verdict, across the round artifacts: " + earned.size);

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }
const rows = await getAll(KEY, "quiz_questions?select=id,retired_at&certification_id=eq." + cert.id +
  "&language=eq.en&retired_at=is.null&order=id");
const live = new Set(rows.map((r) => r.id));
const grounding = await getAll(KEY, "item_grounding?select=question_id,solver,review_verdict,review_note," +
  "source_id,key_support_clause&order=question_id");
const gByQ = new Map(grounding.map((g) => [g.question_id, g]));

const nulls = grounding.filter((g) => live.has(g.question_id) &&
  (g.solver === null || g.solver === undefined));
console.log("live English grounding rows with a NULL solver: " + nulls.length);

const plan = [], unmatched = [], already = [];
for (const g of nulls) {
  const itemId = [...rowIdOf.entries()].find(([, rid]) => rid === g.question_id)?.[0];
  if (!itemId) { unmatched.push({ row: g.question_id, why: "not in " + SLUG + "-INSERTED.json" }); continue; }
  const e = earned.get(itemId);
  if (!e) { unmatched.push({ row: g.question_id, item: itemId, why: "no recorded rescue verdict" }); continue; }
  plan.push({ row: g.question_id, item: itemId, state: e.state, where: e.where, what: e.what, g });
}
for (const g of grounding) {
  if (live.has(g.question_id) && g.solver && earned.has([...rowIdOf.entries()].find(([, r]) => r === g.question_id)?.[0])) {
    already.push(g.question_id);
  }
}

console.log("");
console.log("BACKFILL RESCUE SOLVER   " + CERT + (APPLY ? "   --apply" : "   dry run (default)"));
console.log("  null-solver rows to fill    " + plan.length);
console.log("  null-solver rows unmatched  " + unmatched.length);
for (const u of unmatched.slice(0, 10)) console.log("      " + u.row.slice(0, 8) + "  " + u.why);
console.log("  rescued rows already carrying a verdict (left alone)  " + already.length);
for (const p of plan) {
  console.log("      " + p.row.slice(0, 8) + "  " + p.item + "  " + p.state + "   from " + p.where +
    " (" + p.what + ")   anchor " + p.g.source_id + " " + p.g.key_support_clause);
}
if (!plan.length) { console.log(""); console.log("Nothing to backfill."); process.exit(0); }
if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

let wrote = 0;
for (const p of plan) {
  const body = { solver: { state: p.state,
    reason: "verdict EARNED during the " + (p.what || "rescue") + " recorded in " + p.where +
      "; copied here by backfill-rescue-solver.mjs, ruled PROMPT-121 s2a. No model call." } };
  const res = await fetch(REST_URL + "/item_grounding?question_id=eq." + p.row,
    { method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) { console.error("  PATCH failed " + p.row.slice(0, 8) + ": " + res.status + " " + text.slice(0, 160)); continue; }
  wrote++;
}
console.log("");
console.log("  patched " + wrote + " of " + plan.length);

/* ---------------------------------------------------- POST-CONDITIONS */
const after = await getAll(KEY, "item_grounding?select=question_id,solver,review_verdict,source_id," +
  "key_support_clause&question_id=in.(" + plan.map((p) => p.row).join(",") + ")");
console.log("");
console.log("POST-CONDITIONS");
console.log("  rows read back        " + after.length + " of " + plan.length);
let bad = 0;
for (const p of plan) {
  const a = after.find((x) => x.question_id === p.row);
  if (!a) { console.log("      MISSING " + p.row.slice(0, 8)); bad++; continue; }
  if (!a.solver || a.solver.state !== p.state) { console.log("      solver not as written on " + p.row.slice(0, 8)); bad++; }
  /* the anchor and the verdict must NOT have moved: this write touches one column */
  if (a.source_id !== p.g.source_id || String(a.key_support_clause) !== String(p.g.key_support_clause)) {
    console.log("      ANCHOR MOVED on " + p.row.slice(0, 8)); bad++;
  }
  if (a.review_verdict !== p.g.review_verdict) { console.log("      VERDICT MOVED on " + p.row.slice(0, 8)); bad++; }
}
/* the negative half: no OTHER grounding row gained a solver */
const allAfter = await getAll(KEY, "item_grounding?select=question_id,solver&order=question_id");
const nullsAfter = allAfter.filter((g) => live.has(g.question_id) && (g.solver === null || g.solver === undefined)).length;
console.log("  solver + anchor + verdict as intended  " + (bad ? bad + " VIOLATION(S)" : "all " + after.length + " rows"));
console.log("  live null-solver rows  " + nulls.length + " -> " + nullsAfter +
  "   (expected " + (nulls.length - wrote) + ")");
if (bad || nullsAfter !== nulls.length - wrote) process.exitCode = 2;
