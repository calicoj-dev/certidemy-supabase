#!/usr/bin/env node
/**
 * gen-sibling-check.mjs - every slug the review flagged, beside its sibling
 * language's rendering of the same concept.
 *
 * READ-ONLY. Writes CONCEPT-SIBLING-CHECK.json and nothing else. Unknown flags
 * exit 2. No judgement is made here and nothing is fixed.
 *
 * ===========================================================================
 * WHY THIS EXISTS
 * ===========================================================================
 *
 * The 2026-09-20 sample drew each language INDEPENDENTLY. That maximises
 * distinct-slug coverage and it is structurally blind to a defect rooted in
 * the English, because the two languages deliberately see different concepts.
 *
 * A targeted check of the 4 blocking slugs against their sibling language
 * returned 2 hits -- both of which had been CLEARED and were serving. This runs
 * the same check across all 29 rows the review marked `wrong` or `reword`.
 *
 * A CONCEPT HAS TWO TRANSLATED FIELDS AND THIS CARRIED ONE. The first version
 * emitted descriptions only. Six of the 29 flagged rows are defects in the
 * NAME -- foundation-model, audit-is-not-indemnity, replanning-toward-goal,
 * dod-applies-to-ai-output, provenance-in-done, done-failure -- so the file
 * answered 23 of 29 and reported nothing about the other six, all of which
 * were serving.
 *
 * The count did not say so: 29 rows in, 29 rows out, every one carrying a
 * sibling. A check that emits a row per subject looks complete whatever it put
 * IN the row. Both fields are emitted now, and the extractor asserts that
 * every flagged row carries a name as well as a description.
 *
 * THE SLUGS ARE READ FROM THE REVIEWED FILE, NEVER RECONSTRUCTED. A first
 * attempt at this rebuilt the slug list from the review's per-draw COUNTS and
 * invented 13 of 29 slug names; the query then reported "16 of 29 siblings
 * exist", which is a fact about the invented list and not about the corpus.
 * That is the shape this repository keeps paying for -- an empty result read as
 * an answer -- so the file is the only source here and the extractor asserts
 * its own count.
 */

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let OUT = null;
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === "--out") OUT = process.argv[++i];
  else { console.error("unknown flag: " + a + " -- READ-ONLY, only --out <file>"); process.exit(2); }
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
OUT = OUT || join(ROOT, "CONCEPT-SIBLING-CHECK.json");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const REST = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };

async function all(path) {
  const rows = []; let from = 0, total = null;
  for (;;) {
    let page = null;
    for (let i = 0; i < 8; i++) {
      try {
        const r = await fetch(REST + "/" + path, {
          headers: { ...H, Range: from + "-" + (from + 499), Prefer: "count=exact" },
          signal: AbortSignal.timeout(60000),
        });
        if (!r.ok) throw new Error("HTTP " + r.status);
        total = Number(String(r.headers.get("content-range") || "").split("/")[1]);
        page = await r.json(); break;
      } catch (e) { if (i === 7) throw e; }
    }
    rows.push(...page);
    if (page.length < 500) break;
    from += 500;
  }
  if (total !== null && rows.length !== total) throw new Error("SHORT READ on " + path + ": " + rows.length + " of " + total);
  return rows;
}

/* ------------------------------------------------ the flagged rows, from file */
const REV = JSON.parse(readFileSync(join(ROOT, "CONCEPT-SAMPLE-REVIEWED.json"), "utf8"));
const flagged = [];
for (const d of REV.draws || []) {
  for (const r of d.rows || []) {
    if (r.verdict === "wrong" || r.verdict === "reword") {
      flagged.push({
        certification: d.certification, flagged_language: d.language,
        slug: r.slug, verdict: r.verdict, reviewer_note: r.note ?? "",
        en_name: r.en_name, flagged_name: r.tr_name,
        en_description: r.en_description, flagged_translation: r.tr_description,
      });
    }
  }
}
/* CONTROL. An extractor that matches nothing produces an empty file and a
 * clean-looking report. */
if (flagged.length === 0) { console.error("extracted 0 flagged rows -- the verdict field moved"); process.exit(2); }
/* BOTH FIELDS. Asserting only the description is how six name defects left
 * this file looking complete. */
const hollow = flagged.filter((f) => !f.slug || !f.en_name || !f.en_description);
if (hollow.length) {
  console.error(hollow.length + " flagged row(s) carry no slug, no English name or no English description -- the file shape changed");
  console.error("  " + hollow.slice(0, 5).map((f) => f.slug).join(", "));
  process.exit(2);
}

/* ------------------------------------------------------------- the siblings */
const certs = Object.fromEntries((await all("certifications?select=id,code")).map((c) => [c.code, c.id]));
const concepts = await all("concepts?select=id,slug,name,description,certification_id");
const trans = await all("concept_translations?select=concept_id,language,name,description,is_provisional");
/* 357 adds superseded_at. This must run BEFORE and AFTER that migration, so it
 * asks for the column and falls back when it is absent -- and distinguishes
 * "the column is not there yet" from "the read failed", which PostgREST
 * reports identically as a 400. */
let reviews = null, supersedeKnown = true;
try {
  reviews = await all("concept_translation_reviews?select=certification,language,verdict,superseded_at");
} catch {
  supersedeKnown = false;
  reviews = await all("concept_translation_reviews?select=certification,language,verdict");
}

const conceptKey = new Map(concepts.map((c) => [c.certification_id + "|" + c.slug, c]));
const trKey = new Map(trans.map((t) => [t.concept_id + "|" + t.language, t]));
/* Live verdict per draw: 357 supersedes rather than overwrites, so a row with
 * superseded_at set is history and must not be read as the current state. */
const liveVerdict = new Map(
  reviews.filter((r) => !r.superseded_at).map((r) => [r.certification + "|" + r.language, r.verdict]));
if (!supersedeKnown) console.log("  note: superseded_at absent -- 357 has not run, verdicts read as written by 356");

const other = (l) => (l === "es-419" ? "pt-BR" : "es-419");
const out = [];
let missingConcept = 0, missingSibling = 0, siblingServing = 0, siblingWithheld = 0;

for (const f of flagged) {
  const certId = certs[f.certification];
  const cp = certId ? conceptKey.get(certId + "|" + f.slug) : null;
  if (!cp) { missingConcept++; out.push({ ...f, sibling_language: other(f.flagged_language), sibling_exists: false, why: "concept slug not found" }); continue; }
  const sl = other(f.flagged_language);
  const sib = trKey.get(cp.id + "|" + sl);
  if (!sib) { missingSibling++; out.push({ ...f, sibling_language: sl, sibling_exists: false, why: "no translation row in the sibling language" }); continue; }
  const verdict = liveVerdict.get(f.certification + "|" + sl) ?? "(no review row)";
  const serving = !sib.is_provisional;
  if (serving) siblingServing++; else siblingWithheld++;
  out.push({
    certification: f.certification, slug: f.slug,
    flagged_language: f.flagged_language, verdict: f.verdict, reviewer_note: f.reviewer_note,
    en_name: f.en_name,
    flagged_name: f.flagged_name,
    sibling_name: sib.name,
    en_description: f.en_description,
    flagged_translation: f.flagged_translation,
    sibling_language: sl,
    sibling_exists: true,
    sibling_translation: sib.description,
    sibling_draw_verdict: verdict,
    sibling_currently_serving: serving,
    your_verdict: "", your_note: "",
  });
}

writeFileSync(OUT, JSON.stringify({
  source: "CONCEPT-SAMPLE-REVIEWED.json, every row with verdict wrong|reword",
  flagged_rows: flagged.length,
  sibling_exists: flagged.length - missingConcept - missingSibling,
  sibling_currently_serving: siblingServing,
  sibling_withheld: siblingWithheld,
  what_this_is: "The sibling language's rendering of the SAME concept, beside the English and beside the rendering the reviewer flagged. No judgement is made here. Two of these siblings are already confirmed defective (ISMS-F/pt-BR risk-acceptance-criteria, AIMS-IA/es-419 aia-ai-policy-requirements) and are re-blocked by migration 357.",
  how_to_work_this_file: [
    "Each row carries BOTH translated fields: name and description. Six of the 29 flagged defects are in the NAME.",
    "Read en_name/flagged_name/sibling_name, then en_description/flagged_translation/sibling_translation.",
    "The question is only: does the sibling carry the SAME defect the reviewer flagged?",
    "sibling_currently_serving true means a partner can read it right now.",
    "Set your_verdict to 'same-defect' | 'clean' | 'different-issue'.",
  ],
  rows: out,
}, null, 2), "utf8");

console.log("");
console.log("  flagged rows (wrong|reword):        " + flagged.length);
console.log("  sibling row exists:                 " + (flagged.length - missingConcept - missingSibling));
console.log("    concept slug not found:           " + missingConcept);
console.log("    no sibling translation row:       " + missingSibling);
console.log("  sibling CURRENTLY SERVING:          " + siblingServing + "   <- the exposure");
console.log("  sibling withheld:                   " + siblingWithheld);
console.log("");
console.log("  written to " + OUT);
