#!/usr/bin/env node
/**
 * gen-concept-sample.mjs - the concepts a human reads before 3,460 rows clear.
 *
 * READ-ONLY. Writes CONCEPT-SAMPLE.json and nothing else. Unknown flags exit 2.
 *
 * ===========================================================================
 * WHAT A SAMPLED CLEARANCE IS ALLOWED TO CLAIM
 * ===========================================================================
 *
 * 20 concepts per certification per language, drawn from a SEEDED shuffle so
 * the same seed always draws the same rows. 12 certifications x 2 languages =
 * 24 draws, 480 rows read out of 3,460.
 *
 * THE REVIEW ROW RECORDS THE SEED, THE SAMPLE SIZE AND THE DATE, so the
 * clearance says exactly what it rests on. "Approved" against a 20-row sample
 * and "approved" against a full read are different claims and must not be
 * written the same way. Anyone can re-run this with the recorded seed and get
 * the same 480 rows back -- a sample nobody can reproduce is an anecdote.
 *
 * ===========================================================================
 * WHY NOT "THE GUARDS ARE GREEN"
 * ===========================================================================
 *
 * REJECTED EXPLICITLY, and recorded here next to what was chosen rather than
 * on its own. Measured on the English source before any of this ran: of 1,730
 * concepts, 242 contain a modal and 449 an ISO term, so 1,175 -- 68 percent --
 * have NEITHER. The obligation guard has no modal to weigh and the terminology
 * check has no pinned term to find.
 *
 * A green guard on those 1,175 does not mean the translation is sound. It
 * means the guard had nothing to grip. Writing that into a review table would
 * put an empty result where a verdict goes, which is this repository's oldest
 * failure wearing its most convincing costume.
 *
 * The language guard DOES cover all 3,460 and runs at write time in
 * gen-concept-translations. It settles rung 1 of the translation ladder --
 * wrong language -- and says nothing about rungs 2 and 3, wrong object and
 * inserted obligation. Those need a reader, which is what this file is for.
 *
 * ===========================================================================
 * THE DRAW
 * ===========================================================================
 *
 * mulberry32 over a seed derived from (seed, certification, language), so the
 * three draws for one certification are independent rather than the same
 * indices in three languages. Drawing the same slugs in every language would
 * read like 20 concepts checked three times instead of 60 checked once.
 */

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let SEED = null, N = 20, OUT = null;
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === "--seed") SEED = process.argv[++i];
  else if (a === "--n") N = Number(process.argv[++i]);
  else if (a === "--out") OUT = process.argv[++i];
  else {
    console.error("unknown flag: " + a);
    console.error("READ-ONLY. Flags: --seed <string> (required), --n <per draw>, --out <file>");
    process.exit(2);
  }
}
if (!SEED) {
  console.error("--seed is REQUIRED and has no default.");
  console.error("A default seed is a seed nobody chose, and the review row would record a");
  console.error("number that looks deliberate. Pass a date, a ticket, anything stable.");
  process.exit(2);
}

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
OUT = OUT || join(ROOT, "CONCEPT-SAMPLE.json");
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

/* Deterministic PRNG. Not for security -- for reproducibility. */
function hash32(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function drawSeeded(items, n, seedStr) {
  const rnd = mulberry32(hash32(seedStr));
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {         // Fisher-Yates, seeded
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}
/* SELF-TEST. A shuffle that does not depend on its seed draws the same rows
 * for every language and the sample silently becomes a third of its size. */
{
  const xs = Array.from({ length: 50 }, (_, i) => i);
  const a = drawSeeded(xs, 20, "s|A|en").join(",");
  const b = drawSeeded(xs, 20, "s|A|en").join(",");
  const c = drawSeeded(xs, 20, "s|A|es").join(",");
  if (a !== b) { console.error("SELF-TEST FAILED: the same seed drew different rows"); process.exit(2); }
  if (a === c) { console.error("SELF-TEST FAILED: a different seed drew identical rows"); process.exit(2); }
}

const certs = Object.fromEntries((await all("certifications?select=id,code")).map((c) => [c.id, c.code]));
const concepts = await all("concepts?select=id,slug,name,description,certification_id");
const trans = await all("concept_translations?select=concept_id,language,name,description,is_provisional,review_status");
if (!trans.length) {
  console.error("concept_translations is empty -- nothing to sample. Run gen-concept-translations first.");
  process.exit(2);
}
const byId = new Map(concepts.map((c) => [c.id, c]));
const tIdx = new Map(trans.map((t) => [t.concept_id + "|" + t.language, t]));

const draws = [];
const langs = [...new Set(trans.map((t) => t.language))].sort();
for (const code of [...new Set(Object.values(certs))].sort()) {
  for (const lang of langs) {
    const pool = trans
      .filter((t) => t.language === lang && certs[byId.get(t.concept_id)?.certification_id] === code)
      .map((t) => t.concept_id);
    if (!pool.length) continue;
    const picked = drawSeeded(pool.sort(), N, SEED + "|" + code + "|" + lang);
    draws.push({
      certification: code, language: lang,
      population: pool.length, sample_size: picked.length,
      rows: picked.map((id) => {
        const c = byId.get(id), t = tIdx.get(id + "|" + lang);
        return {
          slug: c.slug,
          en_name: c.name, en_description: c.description,
          tr_name: t.name, tr_description: t.description,
          verdict: "", note: "",
        };
      }),
    });
  }
}

/* CONTROL. An empty draw set reports a clean sample. */
if (!draws.length) { console.error("0 draws produced -- the join is broken"); process.exit(2); }
const total = draws.reduce((a, d) => a + d.sample_size, 0);
/* CONTROL. Every sampled row must carry BOTH sides. A sample showing only the
 * translation cannot be reviewed for meaning, which is the whole point -- and
 * gen-bilingual-queue shipped exactly that defect once. */
const hollow = draws.flatMap((d) => d.rows).filter((r) => !r.en_description || !r.tr_description).length;
const nullEn = concepts.filter((c) => !c.description).length;
if (hollow > nullEn) {
  console.error(hollow + " sampled row(s) are missing a side, with only " + nullEn + " null English descriptions to explain it");
  process.exit(2);
}

writeFileSync(OUT, JSON.stringify({
  seed: SEED,
  sample_size_per_draw: N,
  drawn_on: "see git commit date -- not embedded, so re-running is byte-identical",
  population_total: trans.length,
  sampled_total: total,
  method: "seeded Fisher-Yates over concept ids sorted ascending, seed = SEED|certification|language, so each language draws independently",
  what_this_clearance_may_claim:
    "Approved on a sample of " + N + " per certification per language (" + total + " of " + trans.length +
    " rows read). NOT a full read. The review row records the seed, the sample size and the date.",
  how_to_work_this_file: [
    "Read en_description against tr_description for each row.",
    "verdict: 'ok' | 'reword' | 'wrong'. Put the reason in note.",
    "Rung 2 (right language, wrong referent) and rung 3 (an obligation the English does not state) are what a reader is here for -- no guard sees either.",
  ],
  draws,
}, null, 2), "utf8");

console.log("");
console.log("  seed " + JSON.stringify(SEED) + "   " + N + " per draw");
console.log("  " + draws.length + " draw(s), " + total + " row(s) sampled of " + trans.length);
for (const d of draws) {
  console.log("    " + d.certification.padEnd(10) + d.language.padEnd(8) +
    String(d.sample_size).padStart(3) + " of " + String(d.population).padStart(4));
}
console.log("");
console.log("  written to " + OUT);
