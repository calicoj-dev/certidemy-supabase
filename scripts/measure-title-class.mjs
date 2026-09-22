#!/usr/bin/env node
/**
 * measure-title-class.mjs - widen the title-class exemption, narrowly.
 *
 * READ-ONLY. Reports before/after firing counts and names every row the
 * widened definition newly exempts.
 *
 * ============ THE DEFINITION, AND WHY IT IS TWO CONDITIONS ============
 *
 * Reproducing a control family's TITLE is naming the thing, not reproducing
 * its content, and a candidate has to meet those names to navigate Annex A at
 * all. So a span is TITLE CLASS when:
 *
 *   1. it matches a HEADING or a table-of-contents entry in the source, AND
 *   2. the description contains NO sentence from the clause body.
 *
 * Condition 2 is what stops it creeping. Without it, a description that names
 * a control and then quotes its requirement would be exempted for the half
 * that is innocent, which is the pattern the exemption must not learn.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, MANIFEST } from "./lib/citation-index.mjs";
import { pdfText, isHeadingSpan } from "./lib/iso-locator.mjs";
import { buildSources, score, firesUnion, firesRatio, firesAbsolute,
         assertCanary, norm, W, ABS_RUN, MIN_RUN, MIN_COV } from "./lib/leak-score.mjs";

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
const RAW = new Map();
for (const [k, p] of Object.entries(PDFS)) RAW.set(k, pdfText(p));

/* CONDITION 2: does the description carry a sentence from the clause BODY?
 * Any matched run that is NOT a heading span counts as body text. */
function titleClass(s) {
  if (!s.runs.length) return false;
  const raw = RAW.get(s.source);
  if (!raw) return false;
  let sawHeading = false;
  for (const r of s.runs) {
    const heading = isHeadingSpan(raw, norm(r.text), norm);
    if (heading) sawHeading = true;
    else return false;          /* a body span disqualifies the whole row */
  }
  return sawHeading;
}

/* POSITIVE CONTROL: a known control TITLE must be title class, and a known
 * clause BODY sentence must not. Without both directions the test passes on a
 * predicate that always returns true. */
const CTL = [
  ["information security in supplier relationships", true,  "a 27002 control theme name"],
  ["the organization shall determine external and internal issues", false, "27001 cl.4.1 body"],
];
for (const [txt, want, why] of CTL) {
  const s = score(txt, sources);
  const got = s.runs.length ? titleClass(s) : false;
  if (got !== want) {
    console.error("POSITIVE CONTROL FAILED: " + why + " -> titleClass " + got + ", expected " + want);
    process.exit(2);
  }
}
console.log("positive control: 2/2 (a control title exempts, a clause body does not)");

const certs = await all("certifications?select=id,code");
const codeOf = new Map(certs.map(c => [c.id, c.code]));
const live = (await all("concepts?select=id,slug,name,description,certification_id,retired_at"))
  .filter(c => !c.retired_at);

const rows = live.map(c => ({ cert: codeOf.get(c.certification_id), slug: c.slug,
  description: c.description, s: score(c.description, sources) }));
const fires = rows.filter(r => firesUnion(r.s));
const exempt = fires.filter(r => titleClass(r.s));
const after = fires.filter(r => !titleClass(r.s));

/* The 6 the measurement already identified as annex structure. */
const annexSix = fires.filter(r => r.s.annexStructure);

console.log("");
console.log("TITLE-CLASS EXEMPTION, widened");
console.log("  fires BEFORE the exemption        " + fires.length);
console.log("  exempted as title class           " + exempt.length);
console.log("  fires AFTER                       " + after.length);
console.log("  annex-structure rows (the 6)      " + annexSix.length);

const extra = exempt.filter(r => !annexSix.includes(r));
console.log("");
console.log("  EXEMPTED BEYOND THE 6:            " + extra.length +
            (extra.length ? "   <- the definition may be too wide, read these" : "   (exactly the expected set)"));
for (const r of extra.sort((a, b) => b.s.unionRun - a.s.unionRun)) {
  console.log("    " + String(r.s.unionRun).padStart(3) + "w  cov " + r.s.unionCov.toFixed(2) + "  " +
              r.cert.padEnd(9) + r.slug);
  console.log('         "' + r.description.slice(0, 120) + '"');
  for (const m of r.s.merged) console.log('           span: "' + m.text.slice(0, 92) + '"  [' + r.s.source + "]");
}
const missed = annexSix.filter(r => !exempt.includes(r));
if (missed.length) {
  console.log("");
  console.log("  ANNEX-STRUCTURE ROWS THE DEFINITION DOES NOT EXEMPT: " + missed.length);
  for (const r of missed) console.log("    " + r.cert.padEnd(9) + r.slug + "   " + r.s.unionRun + "w");
}
const perAfter = {}; for (const r of after) perAfter[r.cert] = (perAfter[r.cert] || 0) + 1;
console.log("");
console.log("  fires after exemption, per certification: " + JSON.stringify(perAfter));

writeFileSync(join(ROOT, "TITLE-CLASS-MEASUREMENT.json"), JSON.stringify({
  measured: "2026-09-22",
  definition: ["the span matches a HEADING or table-of-contents entry in the source",
               "AND the description contains no sentence from the clause body"],
  rule: { MIN_RUN, MIN_COV, ABS_RUN },
  index: Object.keys(PDFS), coverage_gaps: MANIFEST.open_coverage_gaps,
  fires_before: fires.length, exempted: exempt.length, fires_after: after.length,
  annex_structure_rows: annexSix.length, exempted_beyond_those: extra.length,
  exempted_rows: exempt.map(r => ({ cert: r.cert, slug: r.slug, run: r.s.unionRun,
    cov: Number(r.s.unionCov.toFixed(3)), source: r.s.source,
    spans: r.s.merged.map(m => m.text), description: r.description })),
  per_certification_after: perAfter,
}, null, 2), "utf8");
console.log("");
console.log("wrote TITLE-CLASS-MEASUREMENT.json");
