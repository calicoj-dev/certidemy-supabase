#!/usr/bin/env node
/**
 * measure-union-rule.mjs - what the three-condition union rule changes.
 *
 * READ-ONLY. No flags. Reports; changes no gate and no content.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, MANIFEST } from "./lib/citation-index.mjs";
import { buildSources, score, scoreAgainst, firesCurrent, firesUnion,
         assertCanary, SEED, MIN_RUN, MIN_COV, DESC_GAP_MAX, SRC_GAP_MAX } from "./lib/leak-score.mjs";

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
console.log("params: seed " + SEED + ", run>=" + MIN_RUN + ", cov>=" + MIN_COV +
            ", desc gap<=" + DESC_GAP_MAX + ", source gap<=" + SRC_GAP_MAX);

const certs = await all("certifications?select=id,code");
const codeOf = new Map(certs.map(c => [c.id, c.code]));
const live = (await all("concepts?select=id,slug,name,description,certification_id,retired_at"))
  .filter(c => !c.retired_at);

/* ---- confidentiality, in full, against all three conditions ---- */
const conf = live.find(c => c.slug === "confidentiality" && codeOf.get(c.certification_id) === "ISMS-F");
console.log("");
console.log("=".repeat(76));
console.log("CONDITION CHECK -- ISMS-F / confidentiality");
console.log('  "' + conf.description + '"');
for (const [key, src] of sources) {
  const s = scoreAgainst(conf.description, key, src);
  if (!s.runs.length) continue;
  console.log("");
  console.log("  source " + key + "   (" + s.words + " description words)");
  for (const r of s.runs) console.log("    run " + String(r.len).padStart(2) + "w  desc@" + String(r.start).padStart(2) +
    "  src@" + (r.sourceAt.length ? r.sourceAt.join(",") : "NOT LOCATED") + '   "' + r.text + '"');
  for (const m of s.merges) {
    console.log("    merge? descGap " + m.descGap + "  srcGap " + (m.srcGap === null ? "none-forward" : m.srcGap) +
      "  sameSource " + m.sameSource + "   -> " + (m.merged ? "MERGED" : "kept apart"));
  }
  console.log("    longest run " + s.maxRun + "/" + s.words + " = " + s.maxCov.toFixed(3) + (firesCurrent(s) ? "  FIRES" : "  silent"));
  console.log("    union       " + s.unionRun + "/" + s.words + " = " + s.unionCov.toFixed(3) + (firesUnion(s) ? "  FIRES" : "  silent"));
}

/* ---- corpus: does condition 3 drop any of the +6? ---- */
const scored = live.map(c => ({ cert: codeOf.get(c.certification_id), slug: c.slug, description: c.description, s: score(c.description, sources) }));
const now = scored.filter(r => firesCurrent(r.s));
const uni = scored.filter(r => firesUnion(r.s));
const added = uni.filter(r => !firesCurrent(r.s));

/* Raw abutting-only, ignoring the source-side conditions, for comparison. */
function rawAbut(text) {
  let best = 0, words = 0;
  for (const [key, src] of sources) {
    const s = scoreAgainst(text, key, src);
    if (!s.runs.length) continue;
    words = s.words;
    const rs = s.runs.slice().sort((a, b) => a.start - b.start);
    let cur = { start: rs[0].start, len: rs[0].len };
    let mx = cur.len;
    for (let i = 1; i < rs.length; i++) {
      if (rs[i].start - (cur.start + cur.len) <= DESC_GAP_MAX) { cur.len = rs[i].start + rs[i].len - cur.start; }
      else cur = { start: rs[i].start, len: rs[i].len };
      mx = Math.max(mx, cur.len);
    }
    best = Math.max(best, words ? mx / words : 0);
  }
  return best;
}
const rawAdded = scored.filter(r => !firesCurrent(r.s) && r.s.maxRun >= MIN_RUN && rawAbut(r.description) >= MIN_COV);

console.log("");
console.log("=".repeat(76));
console.log("CORPUS -- " + live.length + " live concepts");
console.log("  fires, current rule (longest run)        " + now.length);
console.log("  fires, abutting only (no source test)    " + (now.length + rawAdded.length));
console.log("  fires, THREE-CONDITION union rule        " + uni.length);
console.log("  newly visible under the full rule        " + added.length);
console.log("  dropped by the source-side conditions    " + (rawAdded.length - added.length));
if (rawAdded.length - added.length > 0) {
  console.log("");
  console.log("  DROPPED -- abut in our text, not near-contiguous in any one source:");
  for (const r of rawAdded.filter(x => !added.includes(x))) {
    console.log("    " + r.cert.padEnd(9) + r.slug);
    for (const m of r.s.merges) console.log("        descGap " + m.descGap + "  srcGap " +
      (m.srcGap === null ? "none-forward" : m.srcGap) + "  -> " + (m.merged ? "merged" : "kept apart"));
  }
}
const per = {}; for (const r of uni) per[r.cert] = (per[r.cert] || 0) + 1;
const perNew = {}; for (const r of added) perNew[r.cert] = (perNew[r.cert] || 0) + 1;
console.log("");
console.log("  FINAL FIRE SET per certification: " + JSON.stringify(per));
console.log("  of which newly visible:           " + JSON.stringify(perNew));

writeFileSync(join(ROOT, "UNION-RULE-MEASUREMENT.json"), JSON.stringify({
  measured: "2026-09-22",
  params: { SEED, MIN_RUN, MIN_COV, DESC_GAP_MAX, SRC_GAP_MAX },
  index: Object.keys(PDFS), coverage_gaps: MANIFEST.open_coverage_gaps,
  corpus: live.length,
  fires_current: now.length, fires_union: uni.length, newly_visible: added.length,
  dropped_by_source_conditions: rawAdded.length - added.length,
  per_certification: per, newly_visible_per_certification: perNew,
}, null, 2), "utf8");
console.log("");
console.log("wrote UNION-RULE-MEASUREMENT.json");
