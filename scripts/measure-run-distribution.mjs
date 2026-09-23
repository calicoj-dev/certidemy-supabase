#!/usr/bin/env node
/**
 * measure-run-distribution.mjs -- how long are our true contiguous runs of ISO
 * text, across the whole corpus, split by surface and by whether the span is
 * attributed?
 *
 * READ-ONLY. Takes --json and --quotes <path>. Unknown flags exit 2.
 *
 * ============ WHY THE FLOOR IS CURRENTLY UNCALIBRATED ============
 *
 * The threshold of 10 was set while TWO defects were running in the scorer,
 * in opposite directions:
 *
 *   the greedy skip   DEFLATED  -- a longer run starting inside a match was
 *                                  never looked for
 *   the chained extension INFLATED -- a run walked forward through text the
 *                                  document does not continue
 *
 * Both are now fixed. The net of the two on any given span is unknowable after
 * the fact, so the floor was never derived from a clean measurement of
 * anything. This is the clean measurement.
 *
 * ============ ATTRIBUTED AND UNATTRIBUTED ARE DIFFERENT POPULATIONS ========
 *
 * `scan-iso-leaks` CUTS attributed blockquotes out before measuring, per
 * IP-POSITION s6. So the gate has never seen them and no number anywhere
 * describes them. They are measured here as their own population, because
 * "we permit attributed quotation" and "we permit fifty-two contiguous words
 * of ISO 19011" are different sentences and only the first has been agreed.
 *
 * The aggregate per standard is the other half: a per-span allowance cannot
 * see a sum, and nothing sums. Fifty permitted eight-word quotations of one
 * standard are a substantial reproduction of it that no gate here reports.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSources, runUnits, norm, assertCanary, W, SEED, ABS_RUN } from "./lib/leak-score.mjs";
import { segments, attributedQuote, quoteLines } from "./lib/iso-segments.mjs";

const KNOWN = new Set(["--json", "--quotes"]);
const argv = process.argv.slice(2);
let QUOTES = "ATTRIBUTED-QUOTATIONS.md";
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) continue;
  if (!KNOWN.has(a)) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
  if (a === "--quotes") QUOTES = argv[++i];
}
const JSON_OUT = argv.includes("--json");
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

const sources = buildSources();
assertCanary(sources);

/** Longest TRUE contiguous run and its source. Extension follows positions. */
function longest(text) {
  const w = norm(text).split(" ").filter(Boolean);
  let best = 0, bestText = "", bestSrc = "";
  for (const [key, src] of sources) {
    for (let i = 0; i + SEED <= w.length; i++) {
      const cands = src.at.get(w.slice(i, i + SEED).join(" "));
      if (!cands) continue;
      let n = 0;
      for (const p of cands) {
        let k = 0;
        while (i + k < w.length && src.words[p + k] === w[i + k]) k++;
        if (k > n) n = k;
      }
      if (n > best) { best = n; bestText = w.slice(i, i + n).join(" "); bestSrc = key; }
    }
  }
  return { best, bestText, bestSrc };
}

/* CONTROL. A distribution built by a measure that cannot find a known
 * reproduction is a distribution of zeroes wearing the shape of a result. */
const CW = W("the organization shall determine external and internal issues that are relevant to its purpose");
const ctrl = longest(CW.join(" "));
if (ctrl.best !== CW.length) {
  console.error("CONTROL FAILED: canary " + CW.length + "w measured " + ctrl.best + "w.");
  process.exit(2);
}

const certs = await allRows("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const modules = await allRows("modules?select=id,certification_id");
const certOfModule = new Map(modules.map((m) => [m.id, codeOf.get(m.certification_id)]));
const concepts = (await allRows("concepts?select=slug,name,description,certification_id,retired_at"))
  .filter((c) => !c.retired_at);
const lessons = (await allRows("lessons?select=slug,language,content_md,module_id"))
  .filter((l) => l.language === "en");

/* Three populations. Concept text and lesson prose are what the gate measures;
 * attributed quotation is what it cuts away unmeasured. */
const pops = { concept: [], lessonProse: [], quoted: [] };

for (const c of concepts) {
  for (const t of [String(c.description || ""), String(c.name || "")]) {
    const r = longest(t);
    if (r.best) pops.concept.push({ cert: codeOf.get(c.certification_id) || "?", id: c.slug, ...r });
  }
}
const quoteRecords = [];
for (const l of lessons) {
  const cert = certOfModule.get(l.module_id) || "?";
  for (const seg of segments(l.content_md || "", attributedQuote)) {
    for (const u of runUnits(seg)) {
      const r = longest(u);
      if (r.best) pops.lessonProse.push({ cert, id: l.slug, ...r });
    }
  }
  for (const q of quoteLines(l.content_md || "")) {
    if (!q.attributed) continue;
    const body = q.line.replace(/^\s*>\s?/, "");
    const r = longest(body);
    if (!r.best) continue;
    pops.quoted.push({ cert, id: l.slug, ...r });
    quoteRecords.push({ cert, slug: l.slug, run: r.best, src: r.bestSrc, leadIn: q.leadIn, text: body });
  }
}

const BUCKETS = [4, 5, 6, 7, 8, 9, 10, 11];
function hist(list) {
  const h = {};
  for (const b of BUCKETS) h[b] = 0;
  h["11+"] = 0;
  for (const r of list) {
    if (r.best < 4) continue;
    if (r.best >= 11) h["11+"]++; else h[r.best]++;
  }
  return h;
}
const DIST = { concept: hist(pops.concept), lessonProse: hist(pops.lessonProse), quoted: hist(pops.quoted) };
const cols = [4, 5, 6, 7, 8, 9, 10, "11+"];

console.log("");
console.log("TRUE CONTIGUOUS RUN LENGTHS -- after the position-extension fix");
console.log("  control: the canary measures " + ctrl.best + "w of " + CW.length + "  -- the measure can find a reproduction");
console.log("  floor is currently " + ABS_RUN + "w. Nothing here changes it.");
console.log("");
console.log("  population        " + cols.map((c) => String(c).padStart(6)).join("") + "    total");
for (const [name, label] of [["concept", "concept text"], ["lessonProse", "lesson prose"], ["quoted", "ATTRIBUTED quo"]]) {
  const h = DIST[name];
  const tot = cols.reduce((n, c) => n + h[c], 0);
  console.log("  " + label.padEnd(18) + cols.map((c) => String(h[c]).padStart(6)).join("") + String(tot).padStart(9));
}
console.log("");
console.log("  lesson prose and concept text are MEASURED by the gate.");
console.log("  attributed quotation is CUT OUT before measuring and has never been counted.");

/* ============ WHAT THE FLOOR PERMITS, AS A MEASUREMENT ============
 *
 * "Nine contiguous unattributed words of ISO, anywhere, without limit on how
 * many times" is the floor stated in words. The second half of that sentence
 * is the part nobody has ever measured: a per-span floor cannot see a
 * repetition any more than it can see a sum.
 *
 * So the same run, counted across distinct lessons and concepts. */
const repeats = new Map();
for (const r of [...pops.lessonProse, ...pops.concept]) {
  if (r.best < ABS_RUN - 2 || r.best >= ABS_RUN) continue;
  const rec = repeats.get(r.bestText) || { run: r.best, src: r.bestSrc, where: new Set() };
  rec.where.add(r.id);
  repeats.set(r.bestText, rec);
}
const repeated = [...repeats.entries()]
  .map(([text, r]) => ({ text, run: r.run, src: r.src, n: r.where.size }))
  .filter((r) => r.n > 1)
  .sort((a, b) => b.n - a.n || b.run - a.run);
console.log("");
console.log("NEAR-FLOOR RUNS REPEATED ACROSS ROWS (" + (ABS_RUN - 2) + "w to " + (ABS_RUN - 1) + "w, unattributed)");
console.log("  distinct near-floor runs        " + repeats.size);
console.log("  those appearing in >1 row       " + repeated.length);
console.log("  worst repetition                " + (repeated[0] ? repeated[0].n + " rows" : "-"));
for (const r of repeated.slice(0, 8)) {
  console.log("    " + String(r.n).padStart(3) + " rows  " + r.run + "w  [" + r.src + "]  " + r.text.slice(0, 90));
}

/* ---- the aggregate, per standard, which no per-span rule can see ---- */
const agg = new Map();
for (const q of pops.quoted) {
  const a = agg.get(q.bestSrc) || { spans: 0, words: 0, longest: 0 };
  a.spans++; a.words += q.best; a.longest = Math.max(a.longest, q.best);
  agg.set(q.bestSrc, a);
}
console.log("");
console.log("AGGREGATE ATTRIBUTED QUOTATION, per standard");
console.log("  standard          spans    words   longest   share of standard");
for (const [k, a] of [...agg.entries()].sort((x, y) => y[1].words - x[1].words)) {
  const total = sources.get(k) ? sources.get(k).words.length : 0;
  const share = total ? (100 * a.words / total).toFixed(2) + "%" : "-";
  console.log("  " + k.padEnd(18) + String(a.spans).padStart(5) + String(a.words).padStart(9) +
    String(a.longest).padStart(9) + "w" + share.padStart(12));
}
const totalQuoteWords = [...agg.values()].reduce((n, a) => n + a.words, 0);
console.log("");
console.log("  TOTAL attributed quotation words  " + totalQuoteWords);
console.log("  A per-span allowance cannot see a sum, and nothing sums.");

/* ---- the enumeration, because the count is commentary ---- */
const big = quoteRecords.filter((q) => q.run >= ABS_RUN).sort((a, b) => b.run - a.run);
const lines = [];
lines.push("# Attributed quotations at or over " + ABS_RUN + " words");
lines.push("");
lines.push("Exempt by IP-POSITION s6. `scan-iso-leaks` cuts these out before measuring, so");
lines.push("no gate has ever reported them and no number anywhere described them.");
lines.push("");
lines.push("**Every other exemption in this system carries a ceiling**, on the stated ground");
lines.push("that an exemption is a ceiling and not a waiver. This one does not, and it covers");
lines.push("the longest spans in the corpus.");
lines.push("");
lines.push("Runs are TRUE contiguous runs, measured after the position-extension fix.");
lines.push("");
lines.push("| # | cert | lesson | run | source |");
lines.push("|---|---|---|---|---|");
big.forEach((q, i) => {
  lines.push("| " + (i + 1) + " | " + q.cert + " | `" + q.slug + "` | " + q.run + "w | " + q.src + " |");
});
lines.push("");
lines.push("---");
lines.push("");
big.forEach((q, i) => {
  lines.push("## " + (i + 1) + ". " + q.cert + " / `" + q.slug + "` -- " + q.run + "w of " + q.src);
  lines.push("");
  lines.push("**Lead-in:** " + (q.leadIn || "*(none)*"));
  lines.push("");
  lines.push("> " + q.text.slice(0, 1200));
  lines.push("");
});
writeFileSync(join(ROOT, QUOTES), lines.join("\n"), "utf8");
console.log("");
console.log("  wrote " + QUOTES + "  (" + big.length + " spans at or over " + ABS_RUN + "w)");

if (JSON_OUT) {
  writeFileSync(join(ROOT, "RUN-DISTRIBUTION.json"), JSON.stringify({
    measured: new Date().toISOString(), seed: SEED, floor: ABS_RUN,
    histogram: DIST,
    aggregate: Object.fromEntries([...agg.entries()].map(([k, a]) => [k, { ...a, standardWords: sources.get(k).words.length }])),
    quotations: quoteRecords.sort((a, b) => b.run - a.run),
  }, null, 2), "utf8");
  console.log("  wrote RUN-DISTRIBUTION.json");
}
