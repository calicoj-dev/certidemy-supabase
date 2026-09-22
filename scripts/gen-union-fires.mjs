#!/usr/bin/env node
/**
 * gen-union-fires.mjs - every row the union measure exposes, with its evidence.
 *
 * READ-ONLY. Judges nothing, fixes nothing.
 *
 * Carries BOTH the rows the three-condition rule accepts and the rows a raw
 * abutting union would have accepted and the source-side conditions REJECT.
 * The rejections are the evidence that the conditions work, and a file that
 * showed only the accepted rows would be asking to be trusted rather than
 * read.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { PDFS, MANIFEST } from "./lib/citation-index.mjs";
import { buildSources, scoreAgainst, score, firesCurrent, firesUnion, assertCanary,
         SEED, MIN_RUN, MIN_COV, DESC_GAP_MAX, SRC_GAP_MAX, norm, W } from "./lib/leak-score.mjs";

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

/* Clause address for a source position, read off the layout text. */
const RAWTXT = new Map();
for (const [k, p] of Object.entries(PDFS)) {
  const o = join(mkdtempSync(join(tmpdir(), "uf-")), "t.txt");
  execFileSync("pdftotext", ["-layout", p, o]);
  RAWTXT.set(k, readFileSync(o, "utf8"));
}
function clauseFor(key, spanText) {
  const txt = RAWTXT.get(key); if (!txt) return "";
  const needle = W(spanText).slice(0, 5).join(" ");
  let heading = "";
  for (const line of txt.split(/\r?\n/)) {
    const t = line.trimStart();
    const m = /^(\d+(?:\.\d+)*)\s*([A-Z])/.exec(t);
    if (m) heading = m[1] + " " + t.slice(m[1].length).trim().slice(0, 44);
    if (norm(line).includes(needle)) return heading || "(no heading above the match)";
  }
  return "(span not located in the layout text)";
}

const certs = await all("certifications?select=id,code");
const codeOf = new Map(certs.map(c => [c.id, c.code]));
const live = (await all("concepts?select=id,slug,name,description,certification_id,retired_at"))
  .filter(c => !c.retired_at);

/* Raw abutting union, ignoring conditions 2 and 3 -- the comparison set. */
function rawAbutCov(text) {
  let best = 0;
  for (const [key, src] of sources) {
    const s = scoreAgainst(text, key, src);
    if (!s.runs.length) continue;
    const rs = s.runs.slice().sort((a, b) => a.start - b.start);
    let cur = { start: rs[0].start, len: rs[0].len }, mx = cur.len;
    for (let i = 1; i < rs.length; i++) {
      if (rs[i].start - (cur.start + cur.len) <= DESC_GAP_MAX) cur.len = rs[i].start + rs[i].len - cur.start;
      else cur = { start: rs[i].start, len: rs[i].len };
      mx = Math.max(mx, cur.len);
    }
    best = Math.max(best, s.words ? mx / s.words : 0);
  }
  return best;
}

const rows = [];
for (const c of live) {
  const s = score(c.description, sources);
  if (!s.runs.length) continue;
  const fc = firesCurrent(s), fu = firesUnion(s);
  const raw = rawAbutCov(c.description);
  const rawFires = s.maxRun >= MIN_RUN && raw >= MIN_COV;
  if (!fc && !fu && !rawFires) continue;

  rows.push({
    slug: c.slug, certification: codeOf.get(c.certification_id), description: c.description,
    words: s.words, source: s.source,
    fires_current_rule: fc, fires_union_rule: fu,
    fires_raw_abutting_union: rawFires,
    verdict: fu ? (fc ? "fires under BOTH" : "fires under the UNION rule only")
               : (rawFires ? "REJECTED by the source-side conditions" : "fires under the current rule only"),
    longest_run_coverage: Number(s.maxCov.toFixed(3)),
    union_coverage: Number(s.unionCov.toFixed(3)),
    raw_abutting_coverage: Number(raw.toFixed(3)),
    runs: s.runs.map(r => ({
      words: r.text, length: r.len,
      position_in_description: r.start,
      position_in_source: r.sourceAt.length ? r.sourceAt : null,
      clause: clauseFor(s.source, r.text),
    })),
    gaps_between_consecutive_runs: s.merges.map(m => ({
      from: m.from, to: m.to,
      description_side_gap: m.descGap,
      source_side_gap: m.srcGap === null ? "no forward occurrence" : m.srcGap,
      same_source: m.sameSource,
      merged: m.merged,
      why: m.merged ? "abuts in the description and is near-contiguous in the source"
        : m.descGap > DESC_GAP_MAX ? "description-side gap exceeds " + DESC_GAP_MAX
        : m.srcGap === null ? "the two spans never occur in that order in the source"
        : "source-side gap " + m.srcGap + " exceeds " + SRC_GAP_MAX,
    })),
    merged_spans: s.merged.map(m => ({ length: m.len, words: m.text })),
  });
}
rows.sort((a, b) => b.union_coverage - a.union_coverage || a.certification.localeCompare(b.certification));

const acc = rows.filter(r => r.fires_union_rule);
const rej = rows.filter(r => !r.fires_union_rule && r.fires_raw_abutting_union);
console.log("");
console.log("rows carrying any run: reported " + rows.length);
console.log("  fire under the adopted union rule   " + acc.length);
console.log("  rejected by the source conditions   " + rej.length);
const per = {}; for (const r of acc) per[r.certification] = (per[r.certification] || 0) + 1;
console.log("  adopted-rule fires per cert: " + JSON.stringify(per));

writeFileSync(join(ROOT, "CONCEPT-UNION-FIRES.json"), JSON.stringify({
  measured: "2026-09-22",
  rule: { seed: SEED, min_run: MIN_RUN, min_cov: MIN_COV,
    union_conditions: ["description-side gap <= " + DESC_GAP_MAX, "same source document",
                       "source-side forward gap <= " + SRC_GAP_MAX] },
  index: Object.keys(PDFS),
  limit: "The index is ENGLISH-ONLY and holds the editions listed. ISO/IEC 27000 is the 2018 edition against a 2022 standard that references it UNDATED. A span that does not match is NOT thereby original -- it may come from an edition or a standard not on disk. A score of 0 means 'no reproduction of the indexed documents', never 'no reproduction'.",
  coverage_gaps: MANIFEST.open_coverage_gaps,
  counts: { reported: rows.length, fires_adopted_rule: acc.length, rejected_by_source_conditions: rej.length },
  per_certification: per,
  rows,
}, null, 2), "utf8");
console.log("");
console.log("wrote CONCEPT-UNION-FIRES.json");
