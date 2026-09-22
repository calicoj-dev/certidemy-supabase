#!/usr/bin/env node
/**
 * report-harmonised-pairing.mjs - two questions about the remaining 95.
 *
 * READ-ONLY. Writes nothing to the database.
 *
 *   1. HOW MANY PAIR. ISMS-IA and AIMS-IA are the same certification shape
 *      over two standards, and the harmonised structure means many rows
 *      address the SAME CLAUSE ADDRESS in both. A pair shares its analysis --
 *      what the clause obliges, what the modal is, what an auditor looks for
 *      -- even though the finished text must differ, because the AI framing
 *      and the security framing are not the same and identical text would
 *      trip the description-collision guard.
 *
 *   2. HOW MANY SPANS ARE HARMONISED. A span present verbatim in several
 *      indexed standards is real against all of them, and the one the scorer
 *      names is an artefact of index order. Naming a single source invites
 *      exactly the misattribution reading the reverse-check family exists to
 *      prevent.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, MANIFEST } from "./lib/citation-index.mjs";
import { pdfText, isHeadingSpan, clauseForSpan } from "./lib/iso-locator.mjs";
import { buildSources, score, firesUnion, matchingSources, assertCanary,
         norm, W, ABS_RUN, MIN_RUN, MIN_COV } from "./lib/leak-score.mjs";

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

/* CLAUSE ADDRESS AS WRITTEN IN THE DESCRIPTION. Pairing must use what the row
 * CITES, not where the span happens to match -- the span's source is the
 * artefact this script exists to report. */
const ADDR = /\b(?:clause|Clause)\s+(\d+(?:\.\d+)*)|\bAnnex\s+([A-Z](?:\.\d+)*)|\b([A-Z]\.\d+(?:\.\d+)*)\b/g;
function addresses(text) {
  const out = new Set();
  for (const m of String(text || "").matchAll(ADDR)) {
    if (m[1]) out.add(m[1]);
    else if (m[2]) out.add("Annex " + m[2]);
    else if (m[3]) out.add(m[3]);
  }
  return [...out];
}
/* POSITIVE CONTROL, with a case that must yield NOTHING. */
for (const [t, want] of [
  ["ISO/IEC 42001:2023 clause 6.1.4 requires", ["6.1.4"]],
  ["Annex A.16 records that remote methods", ["Annex A.16"]],
  ["nothing addressed here at all", []],
]) {
  const got = addresses(t);
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    console.error("ADDRESS CONTROL FAILED on: " + t + "  got " + JSON.stringify(got));
    process.exit(2);
  }
}
console.log("address control: 3/3 (one must yield nothing)");

const certs = await all("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const live = (await all("concepts?select=id,slug,name,description,certification_id,retired_at"))
  .filter((c) => !c.retired_at);

const scored = live.map((c) => ({ cert: codeOf.get(c.certification_id), slug: c.slug,
  description: c.description, s: score(c.description, sources) }));
const fires = scored.filter((r) => firesUnion(r.s));
const clause = fires.filter((r) => !titleClass(r.s) && !r.s.annexStructure);

/* ---------- 2. how many of the 105 name a different source under multi ---- */
let changed = 0, harmonised = 0;
for (const r of clause) {
  const longest = r.s.merged.slice().sort((a, b) => b.len - a.len)[0];
  r.allSources = matchingSources(longest.text, sources);
  if (r.allSources.length > 1) harmonised++;
  /* "Changes its named source" = the scorer's single pick is not the only
   * answer, so the report would now read differently. */
  if (r.allSources.length > 1) changed++;
  r.longestSpan = longest.text;
}
console.log("");
console.log("2. HARMONISED SPANS -- across all " + clause.length + " clause-text rows");
console.log("   span matches MORE THAN ONE indexed standard   " + harmonised);
console.log("   span matches exactly one                      " + (clause.length - harmonised));
console.log("   rows whose report now names several sources   " + changed);
const combos = {};
for (const r of clause) if (r.allSources.length > 1) {
  const k = r.allSources.join(" + ");
  combos[k] = (combos[k] || 0) + 1;
}
console.log("");
console.log("   which standards co-occur:");
for (const [k, n] of Object.entries(combos).sort((a, b) => b[1] - a[1])) {
  console.log("     " + String(n).padStart(3) + "  " + k);
}

/* ---------- 1. pairing across ISMS-IA and AIMS-IA, buckets B/C/D ---------- */
const BATCH_A = new Set(JSON.parse(readFileSync(join(ROOT, "AIMS-IA-REWRITE-BATCH-A.json"), "utf8"))
  .rows_detail.map((r) => r.slug));
const rest = clause.filter((r) => !BATCH_A.has(r.slug));
console.log("");
console.log("1. PAIRING -- the " + rest.length + " rows in buckets B, C and D");

const byAddr = new Map();
for (const r of rest) {
  for (const a of addresses(r.description)) {
    if (!byAddr.has(a)) byAddr.set(a, { "ISMS-IA": [], "AIMS-IA": [], other: [] });
    const e = byAddr.get(a);
    (e[r.cert] || e.other).push(r);
  }
}
const pairs = [];
for (const [addr, e] of byAddr) {
  if (e["ISMS-IA"].length && e["AIMS-IA"].length) pairs.push({ addr, isms: e["ISMS-IA"], aims: e["AIMS-IA"] });
}
/* A row can carry several addresses, so pair COUNT is not row count. Report
 * both -- a pair count read as a row count would overstate the saving. */
const pairedRows = new Set();
for (const p of pairs) { for (const r of p.isms) pairedRows.add(r); for (const r of p.aims) pairedRows.add(r); }
const unpaired = rest.filter((r) => !pairedRows.has(r));

pairs.sort((a, b) => (b.isms.length + b.aims.length) - (a.isms.length + a.aims.length) || a.addr.localeCompare(b.addr));
console.log("   clause addresses that pair                " + pairs.length);
console.log("   ROWS in at least one pair                 " + pairedRows.size);
console.log("   unpaired rows                             " + unpaired.length);
const un = {}; for (const r of unpaired) un[r.cert] = (un[r.cert] || 0) + 1;
const pr = {}; for (const r of pairedRows) pr[r.cert] = (pr[r.cert] || 0) + 1;
console.log("   paired rows per certification    " + JSON.stringify(pr));
console.log("   unpaired rows per certification  " + JSON.stringify(un));

console.log("");
console.log("   PAIRING CLAUSE ADDRESSES:");
for (const p of pairs) {
  console.log("     " + p.addr.padEnd(12) + "ISMS-IA " + p.isms.length + "  AIMS-IA " + p.aims.length);
  for (const r of p.isms) console.log("         ISMS-IA  " + r.slug + "   " + r.s.unionRun + "w");
  for (const r of p.aims) console.log("         AIMS-IA  " + r.slug + "   " + r.s.unionRun + "w");
}

writeFileSync(join(ROOT, "HARMONISED-PAIRING.json"), JSON.stringify({
  measured: "2026-09-22",
  rule: { MIN_RUN, MIN_COV, ABS_RUN },
  index: Object.keys(PDFS), coverage_gaps: MANIFEST.open_coverage_gaps,
  harmonised: { clause_text_rows: clause.length, multi_source: harmonised,
                single_source: clause.length - harmonised, co_occurrence: combos },
  pairing: { rows_considered: rest.length, pairing_addresses: pairs.length,
             paired_rows: pairedRows.size, unpaired_rows: unpaired.length,
             paired_per_certification: pr, unpaired_per_certification: un },
  pairs: pairs.map((p) => ({ address: p.addr,
    "ISMS-IA": p.isms.map((r) => ({ slug: r.slug, run: r.s.unionRun, sources: r.allSources })),
    "AIMS-IA": p.aims.map((r) => ({ slug: r.slug, run: r.s.unionRun, sources: r.allSources })) })),
  rows: clause.map((r) => ({ cert: r.cert, slug: r.slug, run: r.s.unionRun,
    coverage: Number(r.s.unionCov.toFixed(3)),
    sources_matching_the_span: r.allSources,
    named_by_scorer: r.s.source,
    harmonised: r.allSources.length > 1,
    addresses_cited: addresses(r.description),
    clause: clauseForSpan(RAW.get(r.s.source) || "", r.longestSpan, norm, W),
    longest_span: r.longestSpan, description: r.description })),
}, null, 2), "utf8");
console.log("");
console.log("wrote HARMONISED-PAIRING.json");
