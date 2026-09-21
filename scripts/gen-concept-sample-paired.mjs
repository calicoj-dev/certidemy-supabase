#!/usr/bin/env node
/**
 * gen-concept-sample-paired.mjs - a PAIRED concept translation sample: N slugs,
 * both languages of each, names as well as descriptions.
 *
 * READ-ONLY. Writes one JSON file and touches no database row.
 *
 *   node --dns-result-order=ipv4first scripts/gen-concept-sample-paired.mjs \
 *     --seed 2026-09-21-aims-f --cert AIMS-F --n 20
 *
 * ============ PAIRED, NOT INDEPENDENT, AND THE TRADE IS DELIBERATE ========
 *
 * The 2026-09-20 sampler drew each language independently, which maximised
 * distinct slugs -- about 35 per certification instead of 20. Every one of the
 * reviewer's four findings was then confirmed or refuted by looking at the SAME
 * concept in the other language, and an independent draw supplies that contrast
 * only BY ACCIDENT, on whatever the two draws happen to overlap.
 *
 * It cost something real: 2 of 4 blocking defects were rooted in the ENGLISH,
 * so the sibling in the other language carried them too, and two cleared draws
 * were serving a defect. A sample cannot find that on its own -- the whole
 * point of an independent draw is that the two languages see different rows.
 *
 *   | | independent | paired |
 *   |---|---|---|
 *   | distinct slugs seen | ~2N | N |
 *   | evidence per slug | one rendering | two, each the other's control |
 *   | defect rooted in English | found by luck | found by construction |
 *
 * Coverage halves; evidence per slug doubles. THAT IS THE TRADE AND IT IS
 * WRITTEN INTO THE FILE, so nobody "fixes" it back to independent draws for
 * the coverage number.
 *
 * ============ NAMES, BECAUSE THE LAST CHECK WAS BLIND TO SIX ============
 *
 * `gen-sibling-check` emitted descriptions only and was therefore blind to 6 of
 * 29 flagged defects, which lived in the concept NAME. A concept has TWO
 * translated fields and a review flags either one, so every row here carries
 * en_name, and both translated names, beside the descriptions.
 *
 * The completeness control is on the FIELD, not the row count: this refuses to
 * write unless every emitted row carries all five text fields. A per-subject
 * count looks complete whatever it put in the row.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let SEED = null, N = 20, ONLY_CERT = null, OUT = null;
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === "--seed") SEED = process.argv[++i];
  else if (a === "--n") N = Number(process.argv[++i]);
  else if (a === "--cert") ONLY_CERT = process.argv[++i];
  else if (a === "--out") OUT = process.argv[++i];
  else {
    console.error("Unrecognised flag: " + a);
    console.error("READ-ONLY. Flags: --seed <string> (required), --cert <CODE>, --n <per draw>, --out <file>");
    process.exit(2);
  }
}
if (!SEED) {
  console.error("--seed is REQUIRED and has no default.");
  console.error("A default seed is a seed nobody chose, and the review row would record a");
  console.error("number that looks deliberate and was not.");
  process.exit(2);
}

const HERE = dirname(fileURLToPath(import.meta.url));
for (const p of [join(HERE, ".env"), join(HERE, "..", ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };
async function rest(p, init) {
  let last;
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(BASE + "/" + p, { ...init, headers: { ...H, ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(60000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 160));
      return { body: t ? JSON.parse(t) : null, range: r.headers.get("content-range") };
    } catch (e) { last = e; }
  }
  throw new Error(p + ": " + last?.message);
}
/** Page to exhaustion and prove it against the server's own count. */
async function all(path) {
  const PAGE = 500, out = [];
  for (let from = 0; ; from += PAGE) {
    const { body } = await rest(path + "&order=id&offset=" + from + "&limit=" + PAGE);
    out.push(...body);
    if (body.length < PAGE) break;
  }
  const { range } = await rest(path + "&limit=1", { headers: { Prefer: "count=exact" } });
  const total = range ? Number(range.split("/")[1]) : NaN;
  if (Number.isFinite(total) && total !== out.length) {
    throw new Error("PAGING INCOMPLETE: fetched " + out.length + ", server says " + total);
  }
  return out;
}

/* Deterministic shuffle: the same seed always draws the same rows. */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedNum(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function draw(items, n, seedStr) {
  const rnd = mulberry32(seedNum(seedStr));
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, Math.min(n, a.length));
}

const certs = (await rest("certifications?select=id,code")).body
  .filter((c) => (ONLY_CERT ? c.code === ONLY_CERT : true));
if (!certs.length) { console.error("no certification matched"); process.exit(2); }

const concepts = (await all("concepts?select=id,certification_id,slug,name,description,retired_at"))
  .filter((c) => c.retired_at === null);
const ids = concepts.map((c) => c.id);
const tr = [];
for (let i = 0; i < ids.length; i += 200) {
  const { body } = await rest("concept_translations?select=concept_id,language,name,description,is_provisional"
    + "&concept_id=in.(" + ids.slice(i, i + 200).join(",") + ")&limit=1000");
  tr.push(...body);
}
const trBy = new Map();
for (const t of tr) trBy.set(t.concept_id + "|" + t.language, t);

const LANGS = ["es-419", "pt-BR"];
const draws = [];
for (const c of certs) {
  const pool = concepts.filter((x) => x.certification_id === c.id)
    .sort((a, b) => a.slug.localeCompare(b.slug));
  if (!pool.length) continue;
  /* The seed binds to the certification, not to the language: ONE draw, both
   * renderings. That is the whole difference from the independent sampler. */
  const picked = draw(pool, N, SEED + "|" + c.code);
  const rows = picked.map((p) => {
    const row = { slug: p.slug, en_name: p.name, en_description: p.description };
    for (const l of LANGS) {
      const t = trBy.get(p.id + "|" + l);
      row[l] = { name: t ? t.name : null, description: t ? t.description : null,
        is_provisional: t ? t.is_provisional : null };
    }
    row.verdict = ""; row.note = "";
    return row;
  });
  draws.push({ certification: c.code, population: pool.length, sample_size: rows.length, rows });
}

/* ============ COMPLETENESS IS ON THE FIELD, NOT THE ROW COUNT ============
 * `gen-sibling-check` reported 29 rows in and 29 out and was blind to six
 * defects because it emitted one field of two. A row count answers "did I see
 * every subject"; the question is "does every row carry every field a review
 * can flag". */
const holes = [];
for (const d of draws) {
  for (const r of d.rows) {
    const missing = [];
    if (!r.en_name) missing.push("en_name");
    if (!r.en_description) missing.push("en_description");
    for (const l of LANGS) {
      if (!r[l] || !r[l].name) missing.push(l + ".name");
      if (!r[l] || !r[l].description) missing.push(l + ".description");
    }
    if (missing.length) holes.push(d.certification + "/" + r.slug + ": " + missing.join(", "));
  }
}
console.log("");
console.log("PAIRED CONCEPT SAMPLE");
console.log("  seed              " + SEED);
console.log("  certifications    " + draws.map((d) => d.certification).join(", "));
console.log("  N per draw        " + N + "   (paired: each row carries BOTH languages)");
console.log("  rows emitted      " + draws.reduce((a, d) => a + d.rows.length, 0));
console.log("  renderings to read " + draws.reduce((a, d) => a + d.rows.length, 0) * 2);
if (holes.length) {
  console.error("");
  console.error("  " + holes.length + " row(s) missing a field a review can flag:");
  for (const h of holes.slice(0, 12)) console.error("    " + h);
  console.error("  Refusing to write: a sample with a hole in it reads as a clean draw.");
  process.exit(1);
}
console.log("  every row carries en_name, en_description and both languages' name and description");

const provisional = draws.flatMap((d) => d.rows).flatMap((r) => LANGS.map((l) => r[l] && r[l].is_provisional));
const served = provisional.filter((p) => p === false).length;
console.log("  renderings already serving  " + served + (served === 0 ? "   (nothing is live)" : "   <- READ THIS FIRST"));

const out = OUT || join(HERE, "..", "CONCEPT-SAMPLE-PAIRED.json");
writeFileSync(out, JSON.stringify({
  seed: SEED,
  sample_size_per_draw: N,
  drawn_on: "2026-09-21",
  method: "PAIRED. One seeded draw of N concept slugs per certification; BOTH languages of each slug are emitted, "
    + "so every rendering has the other as its control. Coverage halves against an independent draw (N distinct slugs "
    + "instead of about 2N); evidence per slug doubles. The 2026-09-20 independent draw cleared two draws that were "
    + "serving a defect rooted in the ENGLISH, which an independent draw can only find by luck.",
  fields: "Every row carries en_name, en_description, and name + description in each language. gen-sibling-check "
    + "emitted descriptions only and was blind to 6 of 29 flagged defects, all of which lived in the NAME.",
  what_this_sample_may_claim: "Translation fidelity against the English shown beside it. It cannot clear SOURCE "
    + "adequacy: a faithful rendering of a poor English description is a correct translation. AIMS-F's English was "
    + "rewritten in migration 363 and audited separately (AIMSF-CLAIM-AUDIT.json, 67 OK / 0 FAIL).",
  how_to_work_this_file: "Read a row as a triple. Put a verdict on the ROW: ok | wrong | reword. Use note to say "
    + "which language and which field. A defect that appears in both languages is rooted in the English and is the "
    + "one this shape exists to surface.",
  draws,
}, null, 2), "utf8");
console.log("");
console.log("wrote " + out);
