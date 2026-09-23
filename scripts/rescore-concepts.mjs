#!/usr/bin/env node
/**
 * rescore-concepts.mjs -- the concept corpus, whole descriptions, per unit,
 * with the scorer that no longer skips past its own matches.
 *
 * READ-ONLY. Takes --json and --verbose. Unknown flags exit 2.
 *
 * ============ WHY THIS RUN EXISTS ============
 *
 * `lib/leak-score.mjs` carried `i += n - 1` in its inner loop: the scan
 * resumed MID-RUN after a match, so a longer run beginning inside the consumed
 * region was never looked for. Correct for counting occurrences, wrong for
 * finding the longest, and wrong in ONE DIRECTION only -- a skipped start can
 * lose a run and can never invent one.
 *
 * So every concept-side number this programme produced is a LOWER BOUND, and
 * the concept layer is where the week's work lives:
 *
 *   - it is UNAUTHENTICATED. Lessons sit behind courseware:lessons; concepts
 *     are pulled by anyone, which is why the concept work went first and why
 *     this re-score goes first now.
 *   - the 371 repair spans were sorted and thresholded on those numbers.
 *   - batches B through E were declared clean by the skipping scorer.
 *
 * ============ WHOLE DESCRIPTION, NOT THE KNOWN SPANS ============
 *
 * A span list is a WORKLIST, never a coverage claim. `05-01` was reviewed
 * twice and rewritten once while a twelve-word reproduction sat three
 * paragraphs away in the same body, because span review measures what the
 * instrument already found.
 *
 * Whole-body scoring used to be the wrong unit -- it joined across segments and
 * produced garbage. `runUnits` made it the right one, and nobody had gone back
 * to use it. This goes back.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSources, score, matchingSources, firesUnion, firesRatio, firesAbsolute,
         MIN_RUN, MIN_COV, ABS_RUN } from "./lib/leak-score.mjs";

const KNOWN = new Set(["--json", "--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
}
const JSON_OUT = process.argv.includes("--json");
const VERBOSE = process.argv.includes("--verbose");
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
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

async function allRows(path) {
  const out = []; let from = 0, total = null;
  for (;;) {
    const r = await fetch(BASE + "/" + path, { headers: { ...H, Range: from + "-" + (from + 499), Prefer: "count=exact" } });
    if (!r.ok) throw new Error("HTTP " + r.status + " on " + path);
    total = Number(String(r.headers.get("content-range") || "").split("/")[1]);
    const page = await r.json(); out.push(...page);
    if (out.length >= total || page.length === 0) break;
    from += 500;
  }
  if (out.length !== total) throw new Error("SHORT READ on " + path + ": " + out.length + " of " + total);
  return out;
}

const certs = await allRows("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const concepts = (await allRows("concepts?select=id,slug,name,description,certification_id,retired_at"))
  .filter((c) => !c.retired_at);
const trs = await allRows("concept_translations?select=concept_id,language,name,description");

const sources = buildSources();

/* ============ NAME AND DESCRIPTION ARE SCORED APART ============
 *
 * The first version scored them together and produced 63 fires, 61 of which
 * came from the NAME. Every one was a clause title or a defined term --
 * `human in the loop`, `roles responsibilities and authorities`, `8 1
 * operational planning and control`. Reporting that as a finding would have
 * sent someone to rewrite sixty-one correct names.
 *
 * They are different objects under different rules. **A concept name SHOULD be
 * the defined term**; a name that avoided ISO's wording to escape a leak score
 * would be worse curriculum. A description must not reproduce.
 *
 * So both are scored, both are reported, and NO MAXIMUM IS TAKEN ACROSS THEM.
 * The description's verdict is the gate; the name's is informational and
 * belongs in a title-class report nobody acts on without reading. */
const rows = [];
for (const c of concepts) {
  const cert = codeOf.get(c.certification_id);
  rows.push({ cert, slug: c.slug, lang: "en", field: "description", text: String(c.description || "") });
  rows.push({ cert, slug: c.slug, lang: "en", field: "name", text: String(c.name || "") });
}
for (const t of trs) {
  const c = concepts.find((x) => x.id === t.concept_id);
  if (!c) continue;
  rows.push({ cert: codeOf.get(c.certification_id), slug: c.slug, lang: t.language,
              field: "description", text: String(t.description || "") });
}

const scored = [];
for (const r of rows) {
  const s = score(r.text, sources);
  const lg = (s.merged || []).slice().sort((a, b) => b.len - a.len)[0];
  scored.push({ ...r, run: s.unionRun, cov: Number((s.unionCov ?? 0).toFixed(2)),
                fires: firesUnion(s), ratio: firesRatio(s), abs: firesAbsolute(s),
                srcs: lg ? matchingSources(lg.text, sources) : [], hit: lg ? lg.text : "" });
}

const en = scored.filter((r) => r.lang === "en" && r.field === "description");
const names = scored.filter((r) => r.field === "name");
const tr = scored.filter((r) => r.lang !== "en");
const fires = en.filter((r) => r.fires);

console.log("");
console.log("CONCEPT RE-SCORE -- whole name+description, per unit, skip removed");
console.log("  gate: run >= " + MIN_RUN + " AND cov >= " + MIN_COV + ", OR run >= " + ABS_RUN);
console.log("");
console.log("  English rows scored      " + en.length);
console.log("  translated rows scored   " + tr.length + "   (see the note below)");
console.log("");
console.log("  ENGLISH DESCRIPTION FIRES  " + fires.length + "    <- THE GATE");
console.log("  concept NAME fires         " + names.filter((r) => r.fires).length + "   <- INFORMATIONAL. A name should BE the defined term;");
console.log("                                   a name avoiding ISO wording to escape a score is worse curriculum.");
console.log("    by ratio only          " + fires.filter((r) => r.ratio && !r.abs).length);
console.log("    by absolute run        " + fires.filter((r) => r.abs).length);
console.log("");
const byCert = {};
for (const r of fires) byCert[r.cert] = (byCert[r.cert] || 0) + 1;
console.log("  by certification: " + Object.entries(byCert).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + " " + v).join("  "));

const dist = {};
for (const r of en) { const b = r.run >= 10 ? "10+" : String(r.run); dist[b] = (dist[b] || 0) + 1; }
console.log("");
console.log("  run-length distribution, English: " +
  Object.keys(dist).sort((a, b) => (a === "10+" ? 99 : +a) - (b === "10+" ? 99 : +b)).map((k) => k + "w:" + dist[k]).join("  "));

const big = en.filter((r) => r.run >= ABS_RUN).sort((a, b) => b.run - a.run);
console.log("");
console.log("  AT OR OVER THE ABSOLUTE FLOOR (" + ABS_RUN + "w): " + big.length);
for (const r of big.slice(0, VERBOSE ? 999 : 25)) {
  console.log("    " + String(r.run).padStart(3) + "w cov " + String(r.cov).padStart(4) + "  " +
    r.cert.padEnd(9) + r.slug.slice(0, 44).padEnd(46) + (r.srcs.join(", ") || "-"));
  if (VERBOSE) console.log("        " + r.hit.slice(0, 120));
}

const trFires = tr.filter((r) => r.fires);
console.log("");
console.log("  TRANSLATED ROWS: " + trFires.length + " fire.");
console.log("  The index is ENGLISH-ONLY, so a Spanish or Portuguese rendering of an ISO");
console.log("  sentence scores 0 BY CONSTRUCTION. A low number here is a fact about the");
console.log("  index, not about the text -- it is the monolingual gap, not a clean result.");

if (JSON_OUT) {
  writeFileSync(join(ROOT, "CONCEPT-RESCORE.json"), JSON.stringify({
    measured: new Date().toISOString(), gate: { MIN_RUN, MIN_COV, ABS_RUN },
    english: en.length, translated: tr.length, englishFires: fires.length,
    atOrOverFloor: big.map((r) => ({ cert: r.cert, slug: r.slug, run: r.run, cov: r.cov, srcs: r.srcs, hit: r.hit })),
    fires: fires.map((r) => ({ cert: r.cert, slug: r.slug, run: r.run, cov: r.cov, srcs: r.srcs, hit: r.hit })),
  }, null, 2), "utf8");
  console.log("");
  console.log("  wrote CONCEPT-RESCORE.json");
}
