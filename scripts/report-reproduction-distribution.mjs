#!/usr/bin/env node
/**
 * report-reproduction-distribution.mjs - the shape of the clause-text
 * reproductions, before any of them is rewritten.
 *
 * READ-ONLY. Rewrites nothing. The bucket order decides the batches and that
 * is the director's call, not this script's.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, MANIFEST } from "./lib/citation-index.mjs";
import { pdfText, isHeadingSpan, clauseForSpan } from "./lib/iso-locator.mjs";
import { buildSources, score, firesUnion, assertCanary, norm, W,
         ABS_RUN, MIN_RUN, MIN_COV } from "./lib/leak-score.mjs";

for (const a of process.argv.slice(2)) {
  if (a.startsWith("--")) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
}
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const l of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(l);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const B = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };
async function all(path) {
  const out = []; let from = 0, total = null;
  for (;;) {
    const r = await fetch(B + "/" + path, { headers: { ...H, Range: from + "-" + (from + 499), Prefer: "count=exact" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    total = Number(String(r.headers.get("content-range")).split("/")[1]);
    const pg = await r.json(); out.push(...pg); if (pg.length < 500) break; from += 500;
  }
  if (out.length !== total) throw new Error("PAGING INCOMPLETE " + out.length + "/" + total);
  return out;
}

const sources = buildSources();
const can = assertCanary(sources);
console.log("canary " + can.maxRun + "w/" + can.maxCov.toFixed(2) + " OK");
const RAW = new Map();
for (const [k, p] of Object.entries(PDFS)) RAW.set(k, pdfText(p));
const titleClass = (s) => s.runs.length > 0 &&
  s.runs.every((r) => isHeadingSpan(RAW.get(s.source) || "", norm(r.text), norm));

/* Shape tests. Each carries a control that must NOT match, because a
 * classifier with only positive cases passes on a predicate that always
 * returns true. */
const NAMES_CLAUSE = /\b(?:clause|clauses)\s+\d+(?:\.\d+)*|\bAnnex\s+[A-Z](?:\.\d+)*/;
const DEFINES = /\b(defines?|definition of|is defined as)\b/i;
const REQUIRES = /\b(requires?|shall|must|mandates?|obliges?)\b/i;
const CTL = [
  ["ISO 19011:2026 clause 3.5 defines an audit programme as", true],
  ["The audit programme is the set of arrangements", false],
];
for (const [t, want] of CTL) {
  if (NAMES_CLAUSE.test(t) !== want) {
    console.error("SHAPE CONTROL FAILED on: " + t); process.exit(2);
  }
}
console.log("shape control: " + CTL.length + "/" + CTL.length + " (one must NOT match)");

const certs = await all("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const live = (await all("concepts?select=id,slug,name,description,certification_id,retired_at"))
  .filter((c) => !c.retired_at);

const scored = live.map((c) => ({ cert: codeOf.get(c.certification_id), slug: c.slug,
  description: c.description, s: score(c.description, sources) }));
const fires = scored.filter((r) => firesUnion(r.s));
const exempt = fires.filter((r) => titleClass(r.s));
const annex = fires.filter((r) => !titleClass(r.s) && r.s.annexStructure);
const clause = fires.filter((r) => !titleClass(r.s) && !r.s.annexStructure);

/* Rows already rewritten in any batch. Overlap should be zero. */
const done = new Set();
for (const f of ["ISMS-F-BATCH-1-APPLIED.json", "ISMS-F-BATCH-2-APPLIED.json"]) {
  const p = join(ROOT, f);
  if (existsSync(p)) for (const s of JSON.parse(readFileSync(p, "utf8")).approved) done.add(s);
}
for (const f of ["ISMS-F-REWRITE-BATCH-1-REVISED.json", "ISMS-F-BATCH-2-RETURNED.json", "ISMS-F-REWRITE-BATCH-3.json"]) {
  const p = join(ROOT, f);
  if (!existsSync(p)) continue;
  const j = JSON.parse(readFileSync(p, "utf8"));
  /* `rows` is a COUNT in some of these files and an ARRAY in others -- take
   * whichever is actually an array rather than trusting the name. */
  const arr = [j.rows, j.rows_detail, j.keep_on_read].filter(Array.isArray).flat();
  for (const r of arr) if (r && r.slug) done.add(r.slug);
}

console.log("");
console.log("FIRE SET -- " + live.length + " live concepts");
console.log("  rule: (run>=" + MIN_RUN + " AND cov>=" + MIN_COV + ") OR (run>=" + ABS_RUN + ")");
console.log("  total fires            " + fires.length);
console.log("  title-class exempt     " + exempt.length);
console.log("  annex-structure        " + annex.length);
console.log("  CLAUSE TEXT            " + clause.length + "   <- the population below");

const BUCKETS = [[10, 13], [13, 16], [16, 20], [20, 25], [25, 30], [30, 1e9]];
const label = (lo, hi) => (hi === 1e9 ? "30+" : lo + "-" + (hi - 1)).padEnd(6);
const inB = (r, lo, hi) => r.s.unionRun >= lo && r.s.unionRun < hi;
const seen = [...new Set(clause.map((r) => r.cert))].sort();
const below = clause.filter((r) => r.s.unionRun < 10);

console.log("");
console.log("LONGEST CONTIGUOUS RUN");
console.log("  bucket  total   " + seen.map((c) => c.padEnd(10)).join(""));
for (const [lo, hi] of BUCKETS) {
  const rows = clause.filter((r) => inB(r, lo, hi));
  if (!rows.length) continue;
  console.log("  " + label(lo, hi) + "  " + String(rows.length).padStart(4) + "    " +
    seen.map((c) => String(rows.filter((r) => r.cert === c).length).padEnd(10)).join(""));
}
if (below.length) {
  console.log("  <10     " + String(below.length).padStart(4) + "    " +
    seen.map((c) => String(below.filter((r) => r.cert === c).length).padEnd(10)).join("") +
    "  (ratio arm only)");
}

console.log("");
console.log("THREE LONGEST PER BUCKET");
for (const [lo, hi] of BUCKETS) {
  const rows = clause.filter((r) => inB(r, lo, hi)).sort((a, b) => b.s.unionRun - a.s.unionRun);
  if (!rows.length) continue;
  console.log("");
  console.log("  == " + label(lo, hi).trim() + "  (" + rows.length + " rows)");
  for (const r of rows.slice(0, 3)) {
    const span = r.s.merged.slice().sort((a, b) => b.len - a.len)[0];
    console.log("    " + String(r.s.unionRun).padStart(3) + "w   " + r.cert.padEnd(9) +
                r.slug.padEnd(44) + r.description.length + " chars");
    console.log("           " + r.s.source + "   " +
                clauseForSpan(RAW.get(r.s.source) || "", span.text, norm, W));
    console.log("           " + JSON.stringify(span.text.slice(0, 100)));
  }
}

const named = clause.filter((r) => NAMES_CLAUSE.test(r.description));
const unnamed = clause.filter((r) => !NAMES_CLAUSE.test(r.description));
const defn = clause.filter((r) => DEFINES.test(r.description));
const req = clause.filter((r) => !DEFINES.test(r.description) && REQUIRES.test(r.description));
const neither = clause.filter((r) => !DEFINES.test(r.description) && !REQUIRES.test(r.description));
const overlap = clause.filter((r) => done.has(r.slug));

console.log("");
console.log("ATTRIBUTION");
console.log("  names a clause in the text      " + named.length);
console.log("  NO attribution                  " + unnamed.length + "   <- worse; first within a bucket");
console.log("");
console.log("WHAT IS REPRODUCED");
console.log("  definition of a defined term    " + defn.length + "   (restatable freely)");
console.log("  requirement statement           " + req.length + "   (must keep normative force)");
console.log("  neither shape                   " + neither.length);
console.log("");
console.log("OVERLAP with rows already rewritten: " + overlap.length +
            (overlap.length ? "  -- " + overlap.map((r) => r.slug).join(", ") : "  (as expected)"));

console.log("");
console.log("UNATTRIBUTED, longest first:");
for (const r of unnamed.sort((a, b) => b.s.unionRun - a.s.unionRun).slice(0, 12)) {
  console.log("  " + String(r.s.unionRun).padStart(3) + "w  " + r.cert.padEnd(9) +
              r.slug.padEnd(42) + r.description.length + " chars");
}

writeFileSync(join(ROOT, "REPRODUCTION-DISTRIBUTION.json"), JSON.stringify({
  measured: "2026-09-22",
  rule: { MIN_RUN, MIN_COV, ABS_RUN },
  policy: "A description may NAME a clause and state what it requires in our own words. It may quote a short distinctive phrase where the wording itself is the examinable thing. It may NOT reproduce a contiguous span of the standard's own sentence at or beyond 10 words.",
  index: Object.keys(PDFS), coverage_gaps: MANIFEST.open_coverage_gaps,
  totals: { live: live.length, fires: fires.length, title_class_exempt: exempt.length,
            annex_structure: annex.length, clause_text: clause.length, below_absolute_floor: below.length },
  buckets: BUCKETS.map(([lo, hi]) => ({ bucket: label(lo, hi).trim(),
    count: clause.filter((r) => inB(r, lo, hi)).length,
    per_certification: Object.fromEntries(seen.map((c) => [c, clause.filter((r) => inB(r, lo, hi) && r.cert === c).length])) })),
  attribution: { names_a_clause: named.length, unattributed: unnamed.length },
  what_is_reproduced: { definition: defn.length, requirement: req.length, neither: neither.length },
  overlap_with_rewritten: overlap.map((r) => r.slug),
  rows: clause.slice().sort((a, b) => b.s.unionRun - a.s.unionRun).map((r) => {
    const span = r.s.merged.slice().sort((a, b) => b.len - a.len)[0];
    return { cert: r.cert, slug: r.slug, run: r.s.unionRun,
      coverage: Number(r.s.unionCov.toFixed(3)), source: r.s.source,
      clause: clauseForSpan(RAW.get(r.s.source) || "", span.text, norm, W),
      description_chars: r.description.length,
      names_a_clause: NAMES_CLAUSE.test(r.description),
      shape: DEFINES.test(r.description) ? "definition" : REQUIRES.test(r.description) ? "requirement" : "neither",
      longest_span: span.text, description: r.description };
  }),
}, null, 2), "utf8");
console.log("");
console.log("wrote REPRODUCTION-DISTRIBUTION.json");
