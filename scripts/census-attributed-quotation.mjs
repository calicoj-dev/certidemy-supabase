#!/usr/bin/env node
/**
 * census-attributed-quotation.mjs - how big is the "clause N.N defines ..." class?
 *
 * READ-ONLY. REWRITES NOTHING. ISMS-IA is cleared and serving; this measures
 * the size so a decision can be made on a number rather than on four examples.
 *
 * ============ ATTRIBUTION IS NOT PERMISSION ============
 *
 * A description shaped "ISO 19011:2026 clause 3.5 defines X as ..." answers
 * the plagiarism question and does nothing about the reproduction one.
 * Twenty-one words of a copyrighted standard served unauthenticated is the
 * same twenty-one words whether or not it says where they came from.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, MANIFEST } from "./lib/citation-index.mjs";
import { buildSources, score, firesRatio, firesAbsolute, firesUnion,
         assertCanary, ABS_RUN, MIN_RUN, MIN_COV } from "./lib/leak-score.mjs";

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

/* THE SHAPE. An address (clause N.N, Annex X, or a standard name) followed by
 * a reporting verb. Both parts required: "clause 6.1.2" alone is a pointer,
 * and "defines" alone is ordinary prose. */
const ADDRESS = /\b(?:clause\s+\d+(?:\.\d+)*|Annex\s+[A-Z](?:\.\d+)*|ISO(?:\/IEC)?\s+\d{4,5}(?::\d{4})?)/i;
const VERB = /\b(defines?|requires?|states?|says?|asks?|describes?|records?|notes?|covers?|names?|lists?|specifies|addresses|mandates?)\b/i;

/* POSITIVE CONTROL: shapes whose class is settled, including two that must NOT
 * match -- a bare address and a bare verb. */
const CONTROL = [
  ["ISO 19011:2026 clause 3.5 defines an audit programme as arrangements for a set of audits", true],
  ["Clause 6.1.2 requires a defined and applied process", true],
  ["Annex A.16 states that remote methods introduce additional risks", true],
  ["Clause 6.1.2 and the risk criteria it establishes", false],
  ["The standard defines nothing here; this is our own framing", false],
];
for (const [t, want] of CONTROL) {
  const got = ADDRESS.test(t) && VERB.test(t);
  if (got !== want) {
    console.error("POSITIVE CONTROL FAILED on: " + t.slice(0, 60));
    console.error("  matched " + got + ", expected " + want);
    process.exit(2);
  }
}
console.log("positive control: " + CONTROL.length + "/" + CONTROL.length +
            " known shapes classified correctly (2 near-misses must NOT match)");

const sources = buildSources();
const can = assertCanary(sources);
console.log("canary " + can.maxRun + "w/" + can.maxCov.toFixed(2) + " OK");

const certs = await all("certifications?select=id,code");
const codeOf = new Map(certs.map(c => [c.id, c.code]));
const live = (await all("concepts?select=id,slug,name,description,certification_id,retired_at"))
  .filter(c => !c.retired_at);

const TARGET = ["ISMS-IA", "AIMS-IA"];
const out = [];
const totals = {};
for (const c of live) {
  const cert = codeOf.get(c.certification_id);
  if (!TARGET.includes(cert)) continue;
  totals[cert] = totals[cert] || { live: 0, shaped: 0, shapedFiring: 0 };
  totals[cert].live++;
  const d = String(c.description || "");
  if (!(ADDRESS.test(d) && VERB.test(d))) continue;
  totals[cert].shaped++;
  const s = score(d, sources);
  const fires = firesUnion(s);
  if (fires) totals[cert].shapedFiring++;
  out.push({
    certification: cert, slug: c.slug, chars: d.length, words: s.words,
    longest_run: s.unionRun, coverage: Number(s.unionCov.toFixed(3)), source: s.source,
    fires_ratio_arm: firesRatio(s), fires_absolute_arm: firesAbsolute(s), fires: fires,
    longest_span: s.merged.length ? s.merged.slice().sort((a, b) => b.len - a.len)[0].text : null,
    description: d,
  });
}
out.sort((a, b) => b.longest_run - a.longest_run);

console.log("");
console.log("ATTRIBUTED-QUOTATION CLASS  --  'clause N.N defines/requires/states ...'");
for (const cert of TARGET) {
  const t = totals[cert];
  const pct = Math.round(100 * t.shaped / t.live);
  console.log("  " + cert.padEnd(9) + t.shaped + " of " + t.live + " live descriptions  (" + pct + "%)" +
              "   of which fire: " + t.shapedFiring);
}
const shaped = out.length;
const firing = out.filter(r => r.fires).length;
console.log("  TOTAL      " + shaped + " shaped, " + firing + " firing under (run>=" + MIN_RUN +
            " AND cov>=" + MIN_COV + ") OR (run>=" + ABS_RUN + ")");

const buckets = [[20, 1e9], [15, 20], [10, 15], [6, 10], [0, 6]];
console.log("");
console.log("  longest run, distribution across the shaped rows:");
for (const [lo, hi] of buckets) {
  const n = out.filter(r => r.longest_run >= lo && r.longest_run < hi).length;
  if (n) console.log("    " + String(lo).padStart(3) + (hi === 1e9 ? "+  " : "-" + String(hi).padEnd(3)) +
                     "  " + String(n).padStart(3) + "  " + "#".repeat(Math.min(n, 60)));
}
console.log("");
console.log("  TOP 15 BY RUN LENGTH:");
for (const r of out.slice(0, 15)) {
  console.log("   " + String(r.longest_run).padStart(3) + "w  cov " + r.coverage.toFixed(2) + "  " +
              r.certification.padEnd(9) + r.slug);
  console.log('        "' + String(r.longest_span).slice(0, 96) + '"   [' + r.source + "]");
}

writeFileSync(join(ROOT, "ATTRIBUTED-QUOTATION-CENSUS.json"), JSON.stringify({
  measured: "2026-09-22", rewrote_nothing: true,
  shape: "an ADDRESS (clause N.N / Annex X / a standard name) AND a reporting verb. Both required: an address alone is a pointer, a verb alone is ordinary prose.",
  note: "Attribution answers the plagiarism question and does nothing about the reproduction one. The same words are served either way.",
  rule: { MIN_RUN, MIN_COV, ABS_RUN },
  index: Object.keys(PDFS), coverage_gaps: MANIFEST.open_coverage_gaps,
  totals, shaped, firing, rows: out,
}, null, 2), "utf8");
console.log("");
console.log("wrote ATTRIBUTED-QUOTATION-CENSUS.json");
