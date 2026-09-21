#!/usr/bin/env node
/**
 * list-defined-term-glosses.mjs - every live concept whose description is short
 * enough to be a glossary gloss AND whose name is a term the standards define.
 *
 * READ-ONLY. No --apply, no --dry, unknown flags exit 2. Writes one JSON report
 * and touches no database row.
 *
 * ============ WHY THIS EXISTS ============
 *
 * A one-line description of a DEFINED TERM must say something the definition
 * does not -- the consequence, the distinction, or what a practitioner does
 * with it. A description that could serve as a glossary gloss has failed even
 * when it scores 0 on the leak gate, BECAUSE AT THIS LENGTH THE GATE CANNOT SEE
 * THE CATEGORY.
 *
 * ISMS-F's `security-control` read "a measure that modifies risk" -- the
 * harmonised definition of `control`, near-verbatim, live and unauthenticated.
 * It scored 0.
 *
 * ============ THE EDITION TRAP, WHICH IS WORSE THAN THE MISSING SOURCE =======
 *
 * ISO/IEC 42001:2023 clause 3.21 IS on disk and DOES define control:
 *
 *     control   <risk> measure that MAINTAINS AND/OR modifies risk
 *
 * Three inserted words. The gloss copied the older ISO/IEC 27000:2018 wording
 * -- "measure that modifies risk" -- so no n-gram of the held edition matches,
 * and the scanner reported 0 against a document it HAD INDEXED.
 *
 * So the blindness is not only "sources we do not hold". It is also "an edition
 * variant of a source we do hold", and no threshold reaches either. That is the
 * whole argument for this script: match on the TERM NAME, which is stable
 * across editions, instead of on the definition text, which is not.
 *
 * ============ PROVENANCE IS SPLIT, AND THE SPLIT IS THE POINT ============
 *
 *   INDEXED     ISO/IEC 42001:2023 and ISO 19011:2026 clause 3, extracted
 *               MECHANICALLY from the PDFs on disk. Reproducible.
 *   KNOWLEDGE   ISO/IEC 27000 and ISO/IEC 22989, typed from knowledge. NOT on
 *               disk, NOT verifiable here, and every row sourced to them is
 *               labelled so a reader can discount it.
 *
 * ISO/IEC 27001:2022 clause 3 defines NOTHING -- "the terms and definitions
 * given in ISO/IEC 27000 apply" -- so it contributes no list of its own. That
 * was read off the PDF, not assumed.
 *
 * ============ WHAT THIS IS NOT ============
 *
 * It is a CANDIDATE list for a human read. It cannot tell a gloss from a
 * teaching line -- that is the judgement it exists to put in front of someone.
 * It does not rewrite anything.
 */
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, pdftotextAvailable } from "./lib/citation-index.mjs";

const KNOWN = new Set(["--out", "--max-words"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ".");
    console.error("This script is READ-ONLY. It has no --apply and no --dry. Known: --out, --max-words.");
    process.exit(2);
  }
}
const argOf = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
/* ============ NO LENGTH CUTOFF. IT WAS A GUESS AND IT HID A REAL ONE ======
 *
 * This filtered to descriptions of 10 words or fewer, on the reasoning that a
 * gloss is short. ISMS-F `availability` -- "information is accessible and
 * usable on demand by an authorized entity" -- is ELEVEN words, is ISO/IEC
 * 27000's definition near-verbatim, and scored 9w/11 coverage 0.82 the moment
 * 27000 was indexed. The cutoff hid it, and the cutoff was a guess.
 *
 * A filter chosen to match the expected shape of the defect can only find
 * defects of the expected shape. Every live description is now considered, and
 * the TIERS do the narrowing -- tier C is where the generosity shows up as a
 * number instead of as a silent exclusion.
 */
const MAX_WORDS = Number(argOf("max-words", "0")) || Infinity;

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

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

/* ---------------------------------------------- INDEXED: extract from disk */

if (!pdftotextAvailable()) { console.error("pdftotext is not on PATH."); process.exit(2); }

function clause3Terms(pdfPath) {
  const o = join(mkdtempSync(join(tmpdir(), "iso-")), "t.txt");
  execFileSync("pdftotext", ["-layout", pdfPath, o]);
  const L = readFileSync(o, "utf8").replace(/\r/g, "").split("\n").map((s) => s.trim());
  const out = [];
  for (let i = 0; i < L.length - 1; i++) {
    if (!/^3\.\d{1,2}$/.test(L[i])) continue;
    let j = i + 1;
    while (j < L.length && !L[j]) j++;
    const t = L[j];
    /* CASE-INSENSITIVE ON THE FIRST LETTER. An earlier version required a
     * lowercase start and silently dropped ISO/IEC 42001 3.24 "AI system impact
     * assessment" -- the one 42001-defined term most specific to what this
     * platform teaches. A regex that matches nothing turns the report green. */
    if (t && /^[A-Za-z][a-zA-Z0-9 ,\-/()]{2,60}$/.test(t) && !/\.{3}/.test(t) && !/^page /i.test(t)) {
      out.push({ ref: L[i], term: t });
    }
  }
  const seen = new Set(), uniq = [];
  for (const x of out) if (!seen.has(x.term)) { seen.add(x.term); uniq.push(x); }
  return uniq;
}

const INDEXED = {
  "ISO/IEC 42001:2023": clause3Terms(PDFS["42001:2023"]),
  "ISO 19011:2026": clause3Terms(PDFS["19011:2026"]),
};

/* POSITIVE CONTROL ON THE EXTRACTOR. A clause-3 parser that returns nothing
 * makes this whole report read "no candidates", which is the green-result
 * failure this repository keeps paying for. Assert a count floor AND a named
 * term per source, because a count alone passes on 25 rows of page furniture. */
const ctlFail = [];
for (const [src, terms] of Object.entries(INDEXED)) {
  if (terms.length < 15) ctlFail.push(src + " yielded only " + terms.length + " terms");
}
const has = (src, t) => INDEXED[src].some((x) => norm(x.term) === norm(t));
for (const [src, t] of [
  ["ISO/IEC 42001:2023", "control"],
  ["ISO/IEC 42001:2023", "AI system impact assessment"],
  ["ISO/IEC 42001:2023", "statement of applicability"],
  ["ISO 19011:2026", "audit evidence"],
]) if (!has(src, t)) ctlFail.push(src + ' is missing the named term "' + t + '"');

if (ctlFail.length) {
  console.error("");
  console.error("EXTRACTOR CONTROL FAILED. Refusing to report:");
  for (const f of ctlFail) console.error("  " + f);
  console.error("An empty term list produces an empty candidate list, which reads as a clean corpus.");
  process.exit(1);
}

/* ------------------------------------------- KNOWLEDGE: not on disk, labelled */

/* TYPED FROM KNOWLEDGE. Neither document is on disk, so nothing here is
 * verifiable in this repository and every row it produces carries
 * `source_indexed: false`. ISO/IEC 27001:2022 clause 3 delegates its entire
 * vocabulary to ISO/IEC 27000 -- read off the PDF, not assumed -- and ISO/IEC
 * 42001:2023 clause 3 delegates to ISO/IEC 22989 before adding its own.
 * These are TERM NAMES only. No definition text is reproduced. */
const KNOWLEDGE = {
  "ISO/IEC 27000 (NOT INDEXED)": [
    "access control", "attack", "attribute", "authentication", "authenticity", "availability",
    "confidentiality", "conformity", "consequence", "continual improvement", "control",
    "control objective", "correction", "corrective action", "documented information",
    "effectiveness", "event", "executive management", "governance of information security",
    "information need", "information processing facilities", "information security",
    "information security continuity", "information security event", "information security incident",
    "information security incident management", "information system", "integrity", "interested party",
    "internal audit", "level of risk", "likelihood", "management system", "measure", "measurement",
    "monitoring", "non-repudiation", "nonconformity", "objective", "organization", "outsource",
    "performance", "policy", "process", "reliability", "requirement", "residual risk", "review",
    "risk", "risk acceptance", "risk analysis", "risk assessment", "risk criteria", "risk evaluation",
    "risk identification", "risk management", "risk owner", "risk treatment", "threat",
    "top management", "validation", "verification", "vulnerability",
  ],
  "ISO/IEC 22989 (NOT INDEXED)": [
    "AI agent", "AI component", "AI customer", "AI partner", "AI producer", "AI provider",
    "AI stakeholder", "AI subject", "AI system", "AI system life cycle", "algorithmic bias",
    "artificial intelligence", "autonomy", "bias", "classification", "concept drift",
    "continuous learning", "controllability", "data drift", "deep learning", "explainability",
    "fairness", "feature", "ground truth", "heteronomy", "inference", "interpretability",
    "label", "machine learning", "model", "neural network", "overfitting", "predictability",
    "prediction", "regression", "reinforcement learning", "relevant authority", "robustness",
    "supervised learning", "test data", "training data", "transfer learning", "transparency",
    "unsupervised learning", "validation data",
  ],
};

const TERMS = [];
for (const [src, list] of Object.entries(INDEXED))
  for (const { ref, term } of list) TERMS.push({ term, n: norm(term), src, ref, indexed: true });
for (const [src, list] of Object.entries(KNOWLEDGE))
  for (const term of list) TERMS.push({ term, n: norm(term), src, ref: null, indexed: false });

console.log("");
console.log("DEFINED-TERM VOCABULARIES");
for (const [src, list] of Object.entries(INDEXED)) console.log("  " + src.padEnd(30) + String(list.length).padStart(3) + " terms   extracted from disk");
for (const [src, list] of Object.entries(KNOWLEDGE)) console.log("  " + src.padEnd(30) + String(list.length).padStart(3) + " terms   TYPED FROM KNOWLEDGE, unverifiable here");
console.log("  ISO/IEC 27001:2022             0 terms   clause 3 defines none; it delegates to 27000");

/* -------------------------------------------------------------- the corpus */

const certs = (await rest("certifications?select=id,code")).body;
const byId = new Map(certs.map((c) => [c.id, c.code]));
const concepts = (await all("concepts?select=id,certification_id,slug,name,description,retired_at"))
  .filter((c) => c.retired_at === null)
  .map((c) => ({ ...c, cert: byId.get(c.certification_id) ?? "?" }));

const short = concepts.filter((c) => norm(c.description).split(" ").filter(Boolean).length <= MAX_WORDS
  && norm(c.description).length > 0);
console.log("");
console.log("  " + concepts.length + " live concept(s); " + short.length + " with a non-empty description" + (Number.isFinite(MAX_WORDS) ? " of " + MAX_WORDS + " words or fewer" : " (NO length cutoff)"));

/* MATCH ON THE NAME, NOT THE DESCRIPTION. The name is stable across editions;
 * the definition text is exactly what was shown above not to be. */
function match(name) {
  const n = norm(name);
  const hits = [];
  for (const t of TERMS) {
    const exact = n === t.n;
    const head = n.startsWith(t.n + " ");
    const tail = n.endsWith(" " + t.n);
    if (exact || head || tail) hits.push({ ...t, how: exact ? "is" : head ? "head" : "tail" });
  }
  /* Longest term wins per source, so "risk assessment" is not also reported as
   * "risk". Keep one row per SOURCE so the provenance split stays visible. */
  const best = new Map();
  for (const h of hits) {
    const cur = best.get(h.src);
    if (!cur || h.n.length > cur.n.length) best.set(h.src, h);
  }
  return [...best.values()];
}

const rows = [];
for (const c of short) {
  const m = match(c.name);
  if (!m.length) continue;
  rows.push({
    cert: c.cert, slug: c.slug, name: c.name, description: c.description,
    words: norm(c.description).split(" ").filter(Boolean).length,
    terms: m.map((x) => ({ term: x.term, source: x.src, ref: x.ref, indexed: x.indexed, how: x.how })),
    any_indexed: m.some((x) => x.indexed),
  });
}

/* ============ TIERS, BECAUSE A FLAT LIST OF 141 IS NOT A READ ============
 *
 * The match is deliberately generous -- it is a candidate list for a human, not
 * a guard -- but "risk" as a tail match catches every concept whose name ends
 * in the word, and most of those are not glosses of the defined term. Tiering
 * separates the rows worth reading from the rows the generosity produced, and
 * the tier counts are reported so the generosity is visible as a number.
 *
 *   A  the name IS the defined term            -- the real gloss risk
 *   B  a qualifier in front of a defined term  -- security control, ai policy
 *   C  an incidental head or tail match        -- harmful-content-risk
 */
const QUALIFIER = /^(security|information|ai|internal|external|residual|acceptable|harmful|minimal|systemic|limited|post[- ]market|meaningful|technical|data)\s/;
const tierOf = (r) => {
  if (r.terms.some((t) => t.how === "is")) return "A";
  if (r.terms.some((t) => t.how === "tail") && QUALIFIER.test(norm(r.name))) return "B";
  return "C";
};
for (const r of rows) r.tier = tierOf(r);

rows.sort((a, b) => a.tier.localeCompare(b.tier) || a.cert.localeCompare(b.cert)
  || a.words - b.words || a.slug.localeCompare(b.slug));

console.log("");
console.log("CANDIDATES -- " + rows.length + " row(s). This is a read, not a verdict.");
console.log("");
const tc = { A: 0, B: 0, C: 0 };
for (const r of rows) tc[r.tier]++;
console.log("  TIER A  the name IS the defined term          " + String(tc.A).padStart(4));
console.log("  TIER B  a qualifier in front of one           " + String(tc.B).padStart(4));
console.log("  TIER C  incidental head or tail match         " + String(tc.C).padStart(4));
console.log("");
let cur = "";
for (const r of rows) {
  if (r.tier + r.cert !== cur) { cur = r.tier + r.cert; console.log("  == TIER " + r.tier + "  " + r.cert); }
  const tags = r.terms.map((t) => t.term + " [" + (t.indexed ? t.ref + " " + t.source.replace(/ .*/, "") : "knowledge") + "]").join("; ");
  console.log("    " + String(r.words).padStart(2) + "w  " + r.slug);
  console.log("         \"" + r.description + "\"");
  console.log("         term: " + tags);
}

const byProv = {
  indexed: rows.filter((r) => r.any_indexed).length,
  knowledge_only: rows.filter((r) => !r.any_indexed).length,
};
console.log("");
console.log("  " + byProv.indexed + " row(s) match a term from an INDEXED standard (reproducible)");
console.log("  " + byProv.knowledge_only + " row(s) match only a term typed FROM KNOWLEDGE (discount accordingly)");

const OUT = argOf("out", join(HERE, "..", "DEFINED-TERM-GLOSS-CANDIDATES.json"));
writeFileSync(OUT, JSON.stringify({
  measured: "2026-09-21",
  max_words: MAX_WORDS,
  vocabularies: {
    indexed: Object.fromEntries(Object.entries(INDEXED).map(([k, v]) => [k, v.map((x) => x.ref + " " + x.term)])),
    knowledge_not_on_disk: Object.fromEntries(Object.entries(KNOWLEDGE).map(([k, v]) => [k, v])),
    "ISO/IEC 27001:2022": "clause 3 defines no terms; it delegates to ISO/IEC 27000",
  },
  corpus: { live_concepts: concepts.length, short_descriptions: short.length },
  counts: { ...byProv, tier_a: rows.filter((r) => r.tier === "A").length, tier_b: rows.filter((r) => r.tier === "B").length, tier_c: rows.filter((r) => r.tier === "C").length },
  rows,
}, null, 2), "utf8");
console.log("");
console.log("wrote " + OUT);
