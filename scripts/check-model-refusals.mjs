#!/usr/bin/env node
/**
 * check-model-refusals.mjs -- has a model's reply to its operator been written
 * into the catalogue as content?
 *
 * READ-ONLY. No flags. Exit 0 clean, 1 found, 2 could not answer.
 *
 * ============ WHY ============
 *
 * A block in the batch-1 emit came back
 *
 *     "I need the actual English block content to translate. You've only
 *      provided the heading describing what the block is about."
 *
 * and reached the gates, where it failed for an UNRELATED reason. A guard added
 * that day immediately caught a SECOND one in the same 30-block batch.
 *
 * **Every translation run before that had nothing looking for this.** A served
 * lesson containing that sentence is the most embarrassing thing a partner can
 * open, and it is invisible to every other check we own: it is correctly
 * accented, carries no modal defect, and reads as fluent text -- in the wrong
 * language, which `looksLikeLanguage` may or may not notice depending on how
 * much of the block it occupies.
 *
 * ============ THE PATTERN IS NARROW ON PURPOSE ============
 *
 * The first version included `as an AI` and `as a language model`. Over the
 * whole catalogue that returned 37 hits and EVERY ONE WAS CURRICULUM:
 *
 *     "classified as an AI customer"        "has an AI management system"
 *     "does not qualify as an AI system"    "Como um modelo de linguagem preve
 *                                            a proxima palavra plausivel"
 *
 * This is an AI certification catalogue. `as an AI X` is its subject matter,
 * and how a language model predicts the next word is a thing we TEACH. A guard
 * that fires on the normal case is deleted by the first person it inconveniences.
 *
 * So the pattern keeps only what cannot be curriculum: SECOND-PERSON ADDRESS TO
 * AN OPERATOR, in all three languages, because a model asked to answer in
 * Spanish refuses in Spanish.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

for (const a of process.argv.slice(2)) {
  if (a.startsWith("--")) { console.error("Unrecognised flag: " + a + ". READ-ONLY, no flags."); process.exit(2); }
}
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set -- nothing measured, which is not a pass."); process.exit(2); }

import { REFUSAL, REFUSAL_CONTROLS as CONTROLS, refusalControls }
  from "./lib/refusal-pattern.mjs";

/* The pattern and its fixtures live in the lib so the generators share them.
 * This reports by FINDING, so a broken version reports clean. */
const wrong = refusalControls();
if (wrong.length) {
  console.error("CONTROL FAILED: " + wrong.join(", "));
  console.error("No verdict printed: a detector that reports by finding reports clean when broken.");
  process.exit(2);
}

/* The scan runs SERVER-SIDE through PostgREST's `imatch`. 60 million characters
 * across 98,000 fields is not something to pull over the wire and grep locally,
 * and only matching rows come back. The FIELD LIST IS DECLARED, because a scan
 * that silently omits a column reports clean about text it never read. */
const FIELDS = [
  ["lessons", "slug", "language", ["title", "content_md"]],
  ["concept_translations", "id", "language", ["name", "description"]],
  ["task_translations", "task_id", "language", ["statement", "knowledge", "skills", "abilities"]],
  ["domain_translations", "domain_id", "language", ["title", "description"]],
  ["module_translations", "module_id", "language", ["title", "description"]],
  ["quiz_questions", "id", "language", ["question_text", "explanation"]],
  ["certification_i18n", "certification_id", "lang", ["name", "claim", "description"]],
  ["cert_categories_i18n", "slug", "lang", ["tagline"]],
  ["authority_citations", "id", "lang", ["quote"]],
];

const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };
const PAT = encodeURIComponent(REFUSAL.source);

async function get(path, headers) {
  let last;
  for (let k = 0; k < 6; k++) {
    try {
      const r = await fetch(BASE + "/" + path, { headers: { ...H, ...(headers || {}) },
        signal: AbortSignal.timeout(60000) });
      if (r.ok) return { rows: await r.json(), range: r.headers.get("content-range") };
      last = new Error("HTTP " + r.status + " " + (await r.text()).slice(0, 120));
    } catch (e) { last = e; }
    await new Promise((s) => setTimeout(s, 400 * (k + 1)));
  }
  throw last;
}

/* JSONB columns cannot take `imatch` server-side, and dropping them would be
 * exactly the silent omission the comment above warns about: the first version
 * of this script covered 70,234 values where the whole corpus is 98,381, and
 * the 28,147 missing were the item OPTIONS -- every distractor and key in the
 * bank. They are paged and filtered locally instead. */
const JSONB_FIELDS = [["quiz_questions", "id", "language", "options"]];

const hits = [];
let fields = 0, scanned = 0;
for (const [table, keyCol, langCol, col] of JSONB_FIELDS) {
  fields++;
  const PAGE = 500;
  let total = null, seen = 0;
  for (let from = 0; ; from += PAGE) {
    const r = await get(table + "?select=" + keyCol + "," + langCol + "," + col +
      "&" + col + "=not.is.null&order=" + keyCol,
      { Range: from + "-" + (from + PAGE - 1), Prefer: "count=exact" });
    const n = Number(String(r.range || "").split("/")[1]);
    if (!Number.isFinite(n)) { console.error("no count on " + table + "." + col); process.exit(2); }
    total = n;
    for (const row of r.rows) {
      const txt = JSON.stringify(row[col] ?? "");
      if (REFUSAL.test(txt)) {
        hits.push({ t: table, f: col, k: String(row[keyCol]), lg: row[langCol],
                    ctx: txt.replace(/\s+/g, " ").slice(0, 130) });
      }
    }
    seen += r.rows.length;
    if (seen >= total || !r.rows.length) break;
  }
  if (seen !== total) { console.error("SHORT READ on " + table + "." + col + ": " + seen + " of " + total); process.exit(2); }
  scanned += total;
}

for (const [table, keyCol, langCol, cols] of FIELDS) {
  for (const col of cols) {
    fields++;
    let total;
    try {
      const t = await get(table + "?select=" + keyCol + "&" + col + "=not.is.null&limit=1",
        { Prefer: "count=exact" });
      total = Number(String(t.range || "").split("/")[1]);
    } catch (e) {
      console.error("could not count " + table + "." + col + ": " + String(e).slice(0, 90));
      console.error("Nothing is claimed about that field, which is not a pass.");
      process.exit(2);
    }
    if (!Number.isFinite(total)) {
      console.error("no count for " + table + "." + col + " -- a dropped read is not a zero");
      process.exit(2);
    }
    scanned += total;
    const h = await get(table + "?select=" + keyCol + "," + langCol + "," + col +
      "&" + col + "=imatch." + PAT + "&limit=100");
    for (const r of h.rows) {
      hits.push({ t: table, f: col, k: String(r[keyCol]), lg: r[langCol],
                  ctx: String(r[col] || "").replace(/\s+/g, " ").slice(0, 130) });
    }
  }
}

console.log("");
console.log("MODEL REFUSALS IN SERVED CONTENT");
console.log("  " + fields + " declared text field(s) across " + FIELDS.length + " table(s)");
console.log("  " + scanned.toLocaleString() + " non-null value(s) examined, 3 languages");
console.log("  controls: " + CONTROLS.length + " fixtures behave, two of them real refusals verbatim");
console.log("DENOMINATOR: " + scanned.toLocaleString() + " field value(s) examined");
if (!hits.length) {
  console.log("  none.");
} else {
  for (const h of hits.slice(0, 40)) {
    console.log("  HIT  " + h.t + "." + h.f + "  " + h.lg + "  " + h.k);
    console.log("       " + h.ctx);
  }
  console.log("");
  console.log("A model's reply to its operator is being served as curriculum. Withhold these rows");
  console.log("today: they are invisible to every other check, because they are fluent, correctly");
  console.log("accented text that simply is not the lesson.");
  process.exitCode = 1;
}
