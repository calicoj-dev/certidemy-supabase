/**
 * debias-positions.mjs - TIER 1 remediation: deterministically de-bias the
 * POSITION of the correct answer across EXISTING stored items.
 *
 * WHAT IT FIXES (and what it does NOT)
 * ------------------------------------
 * The June 2026 audit found three answer cues in the live bank: LENGTH (key is
 * the longest), POSITION (key is "b" ~70-74%), and SEMANTIC (key is the
 * "inspect-and-adapt" phrasing). Of these, ONLY position can be corrected in
 * place without rewriting any text: this script reshuffles each item's option
 * order so the correct answer lands in a uniformly random slot.
 *
 * It does NOT fix length or the semantic tell - those require regenerating the
 * option TEXT, which is Tier 2 (re-run the fixed gen-spo-i-secure.mjs /
 * backfill-practice.mjs). This script REPORTS the residual length cue so you can
 * see how much Tier 2 still owes.
 *
 * WHY THIS IS SAFE NOW
 * --------------------
 * Remapping option ids would corrupt any stored candidate responses that
 * reference those ids - but there are zero real candidates yet. Running this
 * BEFORE launch is free; running it after candidates exist would not be. It is
 * also reversible in effect (re-running reshuffles again; correctness is always
 * preserved because the correct TEXT is tracked through the permutation).
 *
 * GROUP CONSISTENCY
 * -----------------
 * All language rows of a logical item share one question_group_id and the same
 * option-id set. One permutation is computed per group and applied to every
 * language row, so en / es-419 / pt-BR stay aligned.
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:CERT_ID="33333333-3333-3333-3333-333333333333"; $env:POOL="both"
 *   $env:DRY_RUN="1"; node scripts\debias-positions.mjs    # inspect (no writes)
 *   $env:DRY_RUN="0"; node scripts\debias-positions.mjs    # apply
 *
 * Knobs: CERT_ID (target cert; default SM-I), POOL ('secure'|'practice'|'both',
 * default 'both'), DRY_RUN (1 = report only). Cue-guard knobs LEN_SPREAD_MAX /
 * KEY_LEN_MARGIN affect only the residual-length REPORT, not the writes.
 *
 * Needs @supabase/supabase-js and Node 18+.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { remapGroupOrder, keyIsStrictLongest } from "./lib/item-cue-guard.mjs";

function loadDotEnv() {
  const here = dirname(fileURLToPath(import.meta.url));
  const path = resolve(here, ".env");
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined || process.env[key] === "") process.env[key] = val;
  }
}
loadDotEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co";
const SERVICE_KEY = need("SUPABASE_SERVICE_ROLE_KEY");
const CERT_ID = process.env.CERT_ID || "11111111-1111-1111-1111-111111111111"; // SM-I
const POOL = (process.env.POOL || "both").toLowerCase();
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());

const POOLS = POOL === "both" ? ["secure", "practice"] : [POOL];

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function need(k) {
  const v = process.env[k];
  if (!v || !v.trim()) { console.error(`Missing required env var: ${k}`); process.exit(1); }
  return v.trim();
}

async function loadPool(pool) {
  const rows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("quiz_questions")
      .select("id, question_group_id, language, question_type, options, correct_answer")
      .eq("certification_id", CERT_ID)
      .eq("pool", pool)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`load ${pool}: ${error.message}`);
    const batch = data || [];
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }
  return rows;
}

function posDistribution(groups) {
  // one count per logical group (use any row; all langs share correct id)
  const d = {};
  let n = 0;
  for (const rows of groups.values()) {
    const r = rows[0];
    if (r.question_type !== "single_choice") continue;
    if (!Array.isArray(r.options) || r.options.length < 3) continue;
    const id = Array.isArray(r.correct_answer) ? r.correct_answer[0] : null;
    if (!id) continue;
    d[id] = (d[id] || 0) + 1;
    n += 1;
  }
  return { d, n };
}

function pct(x, n) { return n ? `${((100 * x) / n).toFixed(1)}%` : "-"; }

function reportDistribution(label, groups) {
  const { d, n } = posDistribution(groups);
  const ids = Object.keys(d).sort();
  const parts = ids.map((id) => `${id}=${pct(d[id], n)}`);
  console.log(`    ${label} (n=${n} single_choice groups): ${parts.join("  ")}`);
}

function residualLongest(groups) {
  // length cue this script does NOT fix - count groups whose EN key is longest.
  let total = 0, longest = 0;
  for (const rows of groups.values()) {
    const en = rows.find((r) => r.language === "en") || rows[0];
    if (en.question_type !== "single_choice") continue;
    if (!Array.isArray(en.options) || en.options.length < 3) continue;
    total += 1;
    if (keyIsStrictLongest(en)) longest += 1;
  }
  return { total, longest };
}

async function processPool(pool) {
  console.log(`\n=== POOL: ${pool} (cert ${CERT_ID}) ${DRY_RUN ? "[DRY RUN]" : "[LIVE]"} ===`);
  const rows = await loadPool(pool);
  if (rows.length === 0) { console.log("    no rows"); return { updated: 0 }; }

  const groups = new Map();
  for (const r of rows) {
    if (!r.question_group_id) continue;
    if (!groups.has(r.question_group_id)) groups.set(r.question_group_id, []);
    groups.get(r.question_group_id).push(r);
  }

  reportDistribution("BEFORE position", groups);
  const before = residualLongest(groups);

  // Build the new layout per group, apply to memory so we can show AFTER.
  const writes = []; // { id, options, correct_answer }
  let skipped = 0;
  for (const [, gRows] of groups) {
    // only single_choice with >=3 options are shuffleable
    const shuffleable = gRows.every(
      (r) => r.question_type !== "single_choice" || (Array.isArray(r.options) && r.options.length >= 3)
    );
    const anyMc = gRows.some(
      (r) => r.question_type === "single_choice" && Array.isArray(r.options) && r.options.length >= 3
    );
    if (!anyMc) continue; // true_false / nothing to do
    if (!shuffleable) { skipped += 1; continue; }

    const mapped = remapGroupOrder(gRows);
    if (!mapped) { skipped += 1; continue; }

    // apply to in-memory rows for the AFTER report
    const byId = new Map(gRows.map((r) => [r.id, r]));
    for (const m of mapped) {
      const r = byId.get(m.id);
      if (r) { r.options = m.options; r.correct_answer = m.correct_answer; }
      writes.push(m);
    }
  }

  reportDistribution("AFTER  position", groups);
  console.log(
    `    length cue (NOT fixed here): ${before.longest}/${before.total} groups have the key as strict longest ` +
    `(${pct(before.longest, before.total)}) -> Tier 2 regeneration owes these`
  );
  if (skipped) console.log(`    skipped ${skipped} group(s) with inconsistent option sets (inspect manually)`);

  if (DRY_RUN) {
    console.log(`    [dry] would update ${writes.length} rows across ${groups.size} groups`);
    return { updated: 0 };
  }

  let updated = 0;
  for (const m of writes) {
    const { error } = await supabase
      .from("quiz_questions")
      .update({ options: m.options, correct_answer: m.correct_answer })
      .eq("id", m.id);
    if (error) { console.log(`    update ${m.id} failed: ${error.message}`); continue; }
    updated += 1;
    if (updated % 200 === 0) console.log(`    ...${updated} rows updated`);
  }
  console.log(`    wrote ${updated} rows`);
  return { updated };
}

async function main() {
  console.log(`Position de-bias (Tier 1): cert=${CERT_ID} pools=${POOLS.join(",")} ${DRY_RUN ? "[DRY RUN]" : "[LIVE]"}`);
  let total = 0;
  for (const pool of POOLS) {
    const { updated } = await processPool(pool);
    total += updated;
  }
  console.log(`\nDone. ${DRY_RUN ? "Would have updated" : "Updated"} ${total} rows.`);
  console.log(
    "Position cue is now ~uniform. Length + semantic cues remain until Tier 2 " +
    "(regenerate biased items with the fixed generators)."
  );
}

main().catch((e) => { console.error(e); process.exit(1); });
