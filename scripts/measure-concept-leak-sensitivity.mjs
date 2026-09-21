#!/usr/bin/env node
/**
 * measure-concept-leak-sensitivity.mjs - calibrate a leak instrument for text
 * the length of a CONCEPT DESCRIPTION, and report its rates before anyone
 * relies on it.
 *
 * READ-ONLY. No --apply, no --dry, unknown flags exit 2. It writes one JSON
 * report and touches no database row.
 *
 * ============ WHY THE EXISTING GATE CANNOT DO THIS JOB ============
 *
 * scan-iso-leaks.mjs seeds at 5 words and refuses at a threshold read from
 * mcp_leak_policy, currently 10. Both numbers were chosen for LESSON BODIES,
 * which run to thousands of words.
 *
 * A concept description is one line. ISMS-F's mean is 60 characters; the whole
 * corpus mean is 118. "a measure that modifies risk" is FIVE WORDS. A 10-word
 * threshold cannot refuse a 9-word description no matter what it contains, so
 * pointing the existing scanner at this corpus would return 0 refused, and 0
 * would mean nothing at all.
 *
 * That is the failure this repository keeps paying for: an instrument reporting
 * success while structurally unable to fire. A gate calibrated for one input
 * scale is not a gate at another scale; it is a gate-shaped object in the right
 * position.
 *
 * ============ WHAT THIS MEASURES ============
 *
 * Two statistics per description, at three seed lengths:
 *
 *   RUN       longest contiguous word run also present in an indexed standard.
 *   COVERAGE  that run as a fraction of the description's own word count.
 *
 * COVERAGE is the one that transfers across scales. A 9-word run inside a
 * 2,000-word lesson is an incidental collision; a 9-word run inside an 11-word
 * description IS the description. The absolute run floor is what stops a
 * 4-word description being refused for a 3-word commonplace, which is noise.
 *
 * ============ THE CONTROLS ============
 *
 * POSITIVE A -- sampled spans of each standard's own body text at description
 *   length, deterministic stride so two runs are comparable.
 * POSITIVE B -- real defined terms, typed out and NAMED, so a failure says
 *   which one. If these do not fire the instrument is blind and every clean
 *   verdict it produces is worthless.
 * NEGATIVE -- the concept descriptions of the certifications that cite no
 *   indexed standard. Our own prose, same house style, adjacent subject
 *   matter. If these fire, the instrument refuses our own writing.
 * NEAR-NEGATIVE -- the ISO certifications' existing descriptions: original
 *   prose ABOUT the standards, sharing their vocabulary on purpose. This is
 *   the realistic false-positive population and it is reported SEPARATELY,
 *   because a rate measured on Scrum prose says nothing about text discussing
 *   clause 6.
 *
 * ============ WHAT IT CANNOT DO ============
 *
 * It sees REPRODUCED EXPRESSION, never borrowed MEANING. A faithful paraphrase
 * of a defined term scores zero here. Same limit as the lesson scanner, and it
 * does not shrink at this length -- it grows, because a one-line definition is
 * far easier to paraphrase than a page.
 *
 * It holds the ENGLISH editions only. A Spanish rendering of an English clause
 * scores zero. That limit is recorded in CLAUDE.md and is unchanged here.
 */
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, pdftotextAvailable, expectedWords, verifyCorpus, MANIFEST } from "./lib/citation-index.mjs";

const KNOWN = new Set(["--out"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ".");
    console.error("This script is READ-ONLY. It has no --apply and no --dry. Known: --out.");
    process.exit(2);
  }
}
const argOf = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};

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

async function rest(path, init) {
  let last;
  for (let i = 0; i < 10; i++) {
    try {
      const r = await fetch(BASE + "/" + path, { ...init, headers: { ...H, ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(60000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 200));
      return { body: t ? JSON.parse(t) : null, range: r.headers.get("content-range") };
    } catch (e) { last = e; }
  }
  throw new Error(path + ": " + last?.message);
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

const norm = (s) => String(s || "").toLowerCase()
  .replace(/[‘’]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
const words = (s) => norm(s).split(" ").filter(Boolean);

function pdfText(p) {
  const o = join(mkdtempSync(join(tmpdir(), "iso-")), "t.txt");
  execFileSync("pdftotext", ["-layout", p, o]);
  return readFileSync(o, "utf8");
}

if (!pdftotextAvailable()) { console.error("pdftotext is not on PATH. Refusing: an empty index matches nothing."); process.exit(2); }
for (const [k, p] of Object.entries(PDFS)) if (!existsSync(p)) { console.error("MISSING " + k + " at " + p); process.exit(2); }

/* ------------------------------------------------------------- the indices */

const SEEDS = [3, 4, 5];
console.log("");
console.log("building indices at seeds " + SEEDS.join(", "));
const srcWords = {};
const idx = new Map();
for (const s of SEEDS) idx.set(s, new Set());
for (const [label, path] of Object.entries(PDFS)) {
  const w = words(pdfText(path));
  const want = expectedWords(label);
  if (w.length !== want) {
    console.error(label + " extracted " + w.length + " words, manifest says " + want + ".");
    console.error("Refusing: the source or the extractor moved, and no number below is comparable.");
    process.exit(1);
  }
  srcWords[label] = w;
  for (const s of SEEDS) {
    const set = idx.get(s);
    for (let i = 0; i + s <= w.length; i++) set.add(w.slice(i, i + s).join(" "));
  }
  console.log("  " + label.padEnd(12) + String(w.length).padStart(7) + " words");
}
for (const s of SEEDS) console.log("  seed " + s + ": " + idx.get(s).size + " distinct grams");

/** Longest contiguous run of `text` present in the index for `seed`. */
function run(text, seed) {
  const set = idx.get(seed);
  const w = words(text);
  let best = 0, bestText = "";
  for (let i = 0; i + seed <= w.length; i++) {
    if (!set.has(w.slice(i, i + seed).join(" "))) continue;
    let n = seed;
    while (i + n + 1 <= w.length && set.has(w.slice(i + n + 1 - seed, i + n + 1).join(" "))) n++;
    if (n > best) { best = n; bestText = w.slice(i, i + n).join(" "); }
    i += n - 1;
  }
  return { best, bestText, total: w.length };
}

function measure(text) {
  const out = {};
  for (const s of SEEDS) {
    const r = run(text, s);
    out["s" + s] = { run: r.best, total: r.total, cov: r.total ? r.best / r.total : 0, hit: r.bestText };
  }
  return out;
}

/* ------------------------------------------------------------- the corpus */

console.log("");
console.log("reading concepts");
const certs = (await rest("certifications?select=id,code")).body;
const byId = new Map(certs.map((c) => [c.id, c.code]));
const concepts = (await all("concepts?select=id,certification_id,slug,name,description,retired_at"))
  .filter((c) => c.retired_at === null)
  .map((c) => ({ ...c, cert: byId.get(c.certification_id) ?? "?" }));
console.log("  " + concepts.length + " live concept(s)");

/* The certifications whose material is ABOUT an indexed standard. Their
 * descriptions share ISO vocabulary on purpose, so they are the realistic
 * false-positive population and are never mixed with the clean negatives.
 * AIGRM-I discusses governance and regulation generally and cites none of the
 * three indexed standards; it is counted with the negatives and its own rate is
 * printed separately, so that assumption is visible rather than buried. */
const ISO_CERTS = new Set(["ISMS-F", "ISMS-IA", "AIMS-F", "AIMS-IA"]);

const scored = concepts.map((c) => ({
  cert: c.cert, slug: c.slug, name: c.name, description: c.description || "",
  m: measure(c.description || ""),
}));

/* ======================= CONTROLS. NO RATE WITHOUT THEM ==================== */

console.log("");
console.log("CONTROLS");

const posSpans = [];
for (const [label, w] of Object.entries(srcWords)) {
  const LEN = 12, STRIDE = Math.max(1, Math.floor(w.length / 120));
  for (let i = 2000; i + LEN < w.length && posSpans.filter((p) => p.src === label).length < 100; i += STRIDE) {
    posSpans.push({ src: label, text: w.slice(i, i + LEN).join(" ") });
  }
}

/* Short excerpts held as test fixtures. The standards are already on disk; this
 * adds no reproduction that was not already there, and IP-POSITION section 6
 * governs what is SERVED, not what a control asserts. */
/* SPLIT BY WHETHER THE SOURCE IS ON DISK, and that split is the finding.
 *
 * ISO/IEC 27001:2022 clause 3 reads "the terms and definitions given in
 * ISO/IEC 27000 apply" -- it defines NOTHING itself. ISO/IEC 27000 is not among
 * the three PDFs. Neither is ISO/IEC 22989, which is where 42001's "AI system"
 * comes from, nor ISO 9000, which 19011 leans on.
 *
 * So a control mixing the two sets can never reach 100% and would be loosened
 * by the next person who reads it as noise. INDEXED must fire at 100% or the
 * instrument is blind. DELEGATED is reported as a NAMED COVERAGE GAP: text this
 * gate cannot see at any threshold, because the document is absent.
 *
 * Short excerpts held as test fixtures. The standards INDEXED here are already
 * on disk; IP-POSITION section 6 governs what is SERVED, not what a control
 * asserts. */
const POS_INDEXED = [
  ["27001 4.1", "the organization shall determine external and internal issues that are relevant to its purpose"],
  ["42001 regulators", "policies guidelines and decisions from regulators that have an impact on the interpretation or enforcement"],
  ["19011 risk-based", "the risk-based approach should substantively influence the planning and implementation of the audit programme"],
];
const POS_DELEGATED = [
  ["27000 control", "measure that modifies risk", "ISO/IEC 27000"],
  ["27000 risk", "effect of uncertainty on objectives", "ISO/IEC 27000"],
  ["22989 AI system", "engineered system that generates outputs such as content forecasts recommendations or decisions for a given set of objectives", "ISO/IEC 22989"],
  ["9000 audit", "systematic independent and documented process for obtaining objective evidence and evaluating it objectively", "ISO 9000 / 19011 cl.3"],
];
const posA = posSpans.map((p) => ({ ...p, m: measure(p.text) }));
const posB = POS_INDEXED.map(([n, t]) => ({ name: n, text: t, m: measure(t) }));
const posD = POS_DELEGATED.map(([n, t, src]) => ({ name: n, text: t, src, m: measure(t) }));

const negRows = scored.filter((s) => !ISO_CERTS.has(s.cert));
const nearRows = scored.filter((s) => ISO_CERTS.has(s.cert) && s.cert !== "AIMS-F");

/* ---------------------------------------------------------- candidate rules */

const RULES = [];
for (const seed of SEEDS)
  for (const minRun of [5, 6, 7, 8])
    for (const minCov of [0.40, 0.50, 0.60, 0.70])
      RULES.push({ seed, minRun, minCov });

const fires = (m, r) => m["s" + r.seed].run >= r.minRun && m["s" + r.seed].cov >= r.minCov;
const rate = (rows, r) => (rows.length ? rows.filter((x) => fires(x.m, r)).length / rows.length : 0);

const table = RULES.map((r) => ({
  ...r,
  tpA: rate(posA, r), tpB: rate(posB, r),
  fpClean: rate(negRows, r), fpNear: rate(nearRows, r),
  firesCorpus: scored.filter((x) => fires(x.m, r)).length,
}));

/* POSITIVE CONTROL ON THE INSTRUMENT ITSELF. At least one candidate must
 * separate; if none does, no n-gram rule works at this length and this script
 * must say so rather than recommending the least bad row. */
const viable = table.filter((t) => t.tpB === 1 && t.tpA >= 0.90 && t.fpClean === 0);
console.log("  " + posA.length + " sampled ISO spans, " + posB.length + " named definitions");
console.log("  " + negRows.length + " known-original descriptions (certifications citing no indexed standard)");
console.log("  " + nearRows.length + " near-negative descriptions (ISMS-F, ISMS-IA, AIMS-IA)");
console.log("  " + viable.length + " candidate rule(s) separate perfectly on the named definitions");

const best = viable.sort((a, b) =>
  (a.fpNear - b.fpNear) || (b.tpA - a.tpA) || (a.minRun - b.minRun) || (a.seed - b.seed))[0] || null;

console.log("");
console.log("RULE                        tp(spans)  tp(defs)  fp(clean)  fp(near)  fires/corpus");
for (const t of table) {
  if (t.tpB < 1 || t.fpClean > 0.02) continue;
  const mark = best && t.seed === best.seed && t.minRun === best.minRun && Math.abs(t.minCov - best.minCov) < 1e-9 ? "  <==" : "";
  console.log("  seed " + t.seed + " run>=" + t.minRun + " cov>=" + t.minCov.toFixed(2) +
    (100 * t.tpA).toFixed(0).padStart(8) + "%" + (100 * t.tpB).toFixed(0).padStart(9) + "%" +
    (100 * t.fpClean).toFixed(1).padStart(10) + "%" + (100 * t.fpNear).toFixed(1).padStart(9) + "%" +
    String(t.firesCorpus).padStart(12) + mark);
}

/* Per-certification rates for the chosen rule, so an assumption about which
 * corpus is "clean" is visible as a number rather than as a set literal above. */
if (best) {
  console.log("");
  console.log("PER-CERTIFICATION at the proposed rule");
  const byCert = {};
  for (const s of scored) {
    const b = (byCert[s.cert] ||= { n: 0, f: 0 });
    b.n++; if (fires(s.m, best)) b.f++;
  }
  for (const [c, b] of Object.entries(byCert).sort())
    console.log("  " + c.padEnd(10) + String(b.f).padStart(4) + " / " + String(b.n).padEnd(5) +
      (100 * b.f / b.n).toFixed(1).padStart(7) + "%" + (ISO_CERTS.has(c) ? "   (about an indexed standard)" : ""));
}

if (!best) {
  console.log("");
  console.log("NO CANDIDATE RULE SEPARATES. An n-gram method does not work at this length.");
  process.exitCode = 1;
} else {
  console.log("");
  console.log("PROPOSED: seed " + best.seed + ", refuse when run >= " + best.minRun + " AND coverage >= " + best.minCov.toFixed(2));
  const hits = scored.filter((x) => fires(x.m, best));
  console.log("  fires on " + hits.length + " of " + scored.length + " live descriptions");
  for (const h of hits.slice(0, 40)) {
    const m = h.m["s" + best.seed];
    console.log("    " + h.cert.padEnd(9) + String(m.run).padStart(3) + "w/" + String(m.total).padEnd(4) +
      " cov " + m.cov.toFixed(2) + "  " + h.slug);
    console.log("        \"" + m.hit.slice(0, 110) + "\"");
  }
  if (hits.length > 40) console.log("    ... " + (hits.length - 40) + " more");
}

console.log("");
console.log("NAMED DEFINITIONS -- indexed sources. These must never go quiet.");
for (const p of posB) {
  const m = p.m["s" + (best ? best.seed : 4)];
  console.log("  " + p.name.padEnd(20) + String(m.run).padStart(3) + "w/" + String(m.total).padEnd(4) + " cov " + m.cov.toFixed(2));
}

/* ============ THE COVERAGE GAP, NAMED RATHER THAN AVERAGED AWAY ============
 *
 * These are real defined terms of the standards this platform teaches, and this
 * index scores every one of them at or near zero because the DOCUMENT THAT
 * DEFINES THEM IS NOT ON DISK. No seed and no threshold moves these numbers --
 * which is exactly what the flat rate across all 48 candidate rules shows.
 *
 * A gate cannot be calibrated past a source it does not hold. */
console.log("");
console.log("COVERAGE GAP -- defined terms whose SOURCE is not indexed");
for (const p of posD) {
  const m = p.m["s" + (best ? best.seed : 4)];
  console.log("  " + p.name.padEnd(20) + String(m.run).padStart(3) + "w/" + String(m.total).padEnd(4) +
    " cov " + m.cov.toFixed(2) + "   defined in " + p.src + " -- ABSENT");
}

if (best) {
  const cleanFires = negRows.filter((x) => fires(x.m, best));
  const nearFires = nearRows.filter((x) => fires(x.m, best));
  console.log("");
  console.log("EVERY FIRE AT THE PROPOSED RULE, so each can be read rather than counted");
  for (const h of cleanFires.concat(nearFires)) {
    const m = h.m["s" + best.seed];
    console.log("  " + h.cert.padEnd(10) + String(m.run).padStart(3) + "w/" + String(m.total).padEnd(4) +
      " cov " + m.cov.toFixed(2) + "  " + h.slug);
    console.log("      " + h.description.slice(0, 150));
  }
}

const OUT = argOf("out", join(HERE, "..", "CONCEPT-LEAK-CALIBRATION.json"));
writeFileSync(OUT, JSON.stringify({
  measured: "2026-09-21",
  seeds: SEEDS,
  corpus: { live_concepts: scored.length, clean_negatives: negRows.length, near_negatives: nearRows.length },
  controls: {
    sampled_iso_spans: posA.length,
    named_definitions_indexed: posB.map((p) => p.name),
    coverage_gap_delegated: posD.map((p) => ({ name: p.name, source_not_on_disk: p.src, run: p.m.s4.run })),
  },
  proposed: best,
  table,
  named_definition_scores: posB.concat(posD).map((p) => ({ name: p.name, text: p.text, source_not_on_disk: p.src ?? null, m: p.m })),
  fires: best ? scored.filter((x) => fires(x.m, best)).map((h) => ({
    cert: h.cert, slug: h.slug, description: h.description, ...h.m["s" + best.seed],
  })) : [],
}, null, 2), "utf8");
console.log("");
console.log("wrote " + OUT);
