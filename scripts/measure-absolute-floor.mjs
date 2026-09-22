#!/usr/bin/env node
/**
 * measure-absolute-floor.mjs - what (run>=4 AND cov>=0.60) OR (run>=10) changes.
 *
 * READ-ONLY. Reports; changes no content and no committed gate behaviour
 * beyond the shared scorer's own parameters.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, MANIFEST } from "./lib/citation-index.mjs";
import { buildSources, score, firesRatio, firesAbsolute, firesUnion, isArithmetic,
         assertCanary, SEED, MIN_RUN, MIN_COV, ABS_RUN } from "./lib/leak-score.mjs";

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

const sources = buildSources();
const can = assertCanary(sources);
console.log("canary " + can.maxRun + "w/" + can.maxCov.toFixed(2) + " OK");
console.log("rule: (run>=" + MIN_RUN + " AND cov>=" + MIN_COV + ") OR (run>=" + ABS_RUN + ")");

const certs = await all("certifications?select=id,code");
const codeOf = new Map(certs.map(c => [c.id, c.code]));
const live = (await all("concepts?select=id,slug,name,description,certification_id,retired_at"))
  .filter(c => !c.retired_at);

const rows = live.map(c => ({ cert: codeOf.get(c.certification_id), slug: c.slug, description: c.description, s: score(c.description, sources) }));
const ratio = rows.filter(r => firesRatio(r.s));
const abs = rows.filter(r => firesAbsolute(r.s));
const allFire = rows.filter(r => firesUnion(r.s));
const newly = abs.filter(r => !firesRatio(r.s));

console.log("");
console.log("CORPUS -- " + live.length + " live concepts");
console.log("  ratio arm only  (the rule as it stands)   " + ratio.length);
console.log("  absolute arm    (run >= " + ABS_RUN + ")                 " + abs.length);
console.log("  COMBINED                                  " + allFire.length);
console.log("  NEWLY VISIBLE from the absolute arm       " + newly.length);

const per = (set) => { const m = {}; for (const r of set) m[r.cert] = (m[r.cert] || 0) + 1; return m; };
console.log("");
console.log("  combined fires per certification:  " + JSON.stringify(per(allFire)));
console.log("  newly visible per certification:   " + JSON.stringify(per(newly)));

/* ANNEX-A-STRUCTURE ROWS, SEPARATELY. Every contributing run sits beyond the
 * Annex A boundary of its source, so the row reproduces control and objective
 * TITLES rather than clause text. That is the title-class question -- widen
 * the exemption -- not a rewriting question. */
const annexNew = newly.filter(r => r.s.annexStructure);
const clauseNew = newly.filter(r => !r.s.annexStructure);
console.log("");
console.log("  of the newly visible:");
console.log("    ANNEX-A STRUCTURE (title-class candidates, not rewrites)  " + annexNew.length);
console.log("    CLAUSE TEXT (real reproductions)                         " + clauseNew.length);

console.log("");
console.log("ANNEX-A-STRUCTURE ROWS -- widen the title-class exemption, do not rewrite:");
for (const r of annexNew.sort((a, b) => b.s.unionRun - a.s.unionRun)) {
  console.log("  " + String(r.s.unionRun).padStart(3) + "w  cov " + r.s.unionCov.toFixed(2) + "  " +
              r.cert.padEnd(9) + r.slug);
  console.log("        source " + r.s.source + '   "' + (r.s.merged[0] ? r.s.merged[0].text.slice(0, 90) : "") + '"');
}
console.log("");
console.log("CLAUSE-TEXT ROWS -- real reproductions the ratio arm was hiding:");
for (const r of clauseNew.sort((a, b) => b.s.unionRun - a.s.unionRun)) {
  console.log("  " + String(r.s.unionRun).padStart(3) + "w  cov " + r.s.unionCov.toFixed(2) + "  " +
              r.cert.padEnd(9) + r.slug);
  console.log("        source " + r.s.source + '   "' + (r.s.merged.sort((x, y) => y.len - x.len)[0].text.slice(0, 100)) + '"');
  console.log("        full:  " + r.description.slice(0, 150));
}

/* ---- section 2: arithmetic vs reproduction among the CURRENT fires ---- */
console.log("");
console.log("=".repeat(76));
console.log("ARITHMETIC, NOT REPRODUCTION -- among the " + ratio.length + " ratio-arm fires");
const arith = ratio.filter(r => isArithmetic(r.s));
console.log("  runs of 4-5 words on descriptions under 8 words:  " + arith.length + " of " + ratio.length);
for (const r of arith.sort((a, b) => a.cert.localeCompare(b.cert))) {
  const m = r.s.merged.sort((x, y) => y.len - x.len)[0];
  const inAnnex = r.s.runs.every(x => x.inAnnex);
  console.log("    " + r.cert.padEnd(9) + r.slug.padEnd(30) + r.s.unionRun + "w/" + r.s.words +
              " = " + r.s.unionCov.toFixed(2) + "   " + r.s.source + (inAnnex ? "  [annex]" : ""));
  console.log('         matched "' + m.text + '"');
}

writeFileSync(join(ROOT, "ABSOLUTE-FLOOR-MEASUREMENT.json"), JSON.stringify({
  measured: "2026-09-22",
  rule: { SEED, MIN_RUN, MIN_COV, ABS_RUN },
  index: Object.keys(PDFS), coverage_gaps: MANIFEST.open_coverage_gaps,
  corpus: live.length,
  ratio_arm: ratio.length, absolute_arm: abs.length, combined: allFire.length, newly_visible: newly.length,
  per_certification: per(allFire), newly_per_certification: per(newly),
  annex_structure_new: annexNew.map(r => ({ cert: r.cert, slug: r.slug, run: r.s.unionRun,
    cov: Number(r.s.unionCov.toFixed(3)), source: r.s.source, matched: r.s.merged[0]?.text, description: r.description })),
  clause_text_new: clauseNew.map(r => ({ cert: r.cert, slug: r.slug, run: r.s.unionRun,
    cov: Number(r.s.unionCov.toFixed(3)), source: r.s.source,
    matched: r.s.merged.sort((x, y) => y.len - x.len)[0]?.text, description: r.description })),
  arithmetic_among_ratio_fires: arith.map(r => ({ cert: r.cert, slug: r.slug, run: r.s.unionRun,
    words: r.s.words, cov: Number(r.s.unionCov.toFixed(3)), source: r.s.source,
    matched: r.s.merged.sort((x, y) => y.len - x.len)[0]?.text, description: r.description })),
}, null, 2), "utf8");
console.log("");
console.log("wrote ABSOLUTE-FLOOR-MEASUREMENT.json");
