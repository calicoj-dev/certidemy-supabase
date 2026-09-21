#!/usr/bin/env node
/**
 * check-citation-correspondence.mjs - for every explicit standard citation in
 * the lesson and item corpora, does the cited standard actually contain what is
 * attributed to it.
 *
 * READ-ONLY. Fixes nothing. Unknown flags exit 2.
 *
 *   node --dns-result-order=ipv4first scripts/check-citation-correspondence.mjs
 *   ... --corpus lessons        (or: items, both)
 *
 * ============ THE QUESTION citation-index.mjs DOES NOT ASK ============
 *
 * `citation-index.mjs` answers "does clause 6.7 exist in ISO 19011". Its own
 * header says it checks EXISTENCE, NEVER MEANING, and that was accepted for
 * months. It was paid for on 2026-09-21: three lessons reproduce a 17-word
 * sentence from ISO/IEC 27000:2018 and TWO credit it to ISO 19011:2026, which
 * contains neither half of it. All three standards were on disk and the
 * checker was green, because every address named was real.
 *
 * POSSESSION IS NOT VERIFICATION, and a check that passes is a claim about the
 * question it asked.
 *
 * ============ TWO RESULTS, REPORTED APART ============
 *
 * ADDRESS EXISTS and CONTENT CORRESPONDS are separate outcomes and neither
 * substitutes for the other. Passing one while failing the other is the normal
 * case -- it is the entire finding -- so collapsing them into one verdict would
 * rebuild the defect this script exists to expose.
 *
 * ============ HOW A MISATTRIBUTION IS PROVED ============
 *
 * Not by absence. A claim can be a fair paraphrase and share no contiguous
 * wording, so "not found in the cited standard" alone is weak evidence.
 *
 * What is strong is the COMPARISON: score the attributed passage against every
 * indexed standard and ask which one carries it best. A passage that appears
 * verbatim in a standard OTHER than the one cited is a misattribution with the
 * right answer attached. That is the same move as "a run with no source is the
 * tell", turned around.
 *
 * ============ WHAT THIS CANNOT DO ============
 *
 * It sees reproduced EXPRESSION. A claim that misdescribes a clause in
 * original words scores clean here and is still wrong -- the defect class
 * CLAUDE.md records as "a true statement filed against the wrong source, in
 * prose that reads correct" is only partly reachable, and the part this reaches
 * is the part where wording survives.
 *
 * A claim about a standard we do not hold is UNVERIFIABLE, never clean.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkCitation, HELD, NOT_HELD } from "./verify-claim-content.mjs";

const KNOWN = new Set(["--corpus", "--out"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". READ-ONLY. Known: --corpus, --out.");
    process.exit(2);
  }
}
const argOf = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const CORPUS = argOf("corpus", "both");

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
async function rest(p, init) {
  let last;
  for (let i = 0; i < 10; i++) {
    try {
      const r = await fetch(BASE + "/" + p, { ...init, headers: { ...H, ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(90000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 160));
      return { body: t ? JSON.parse(t) : null, range: r.headers.get("content-range") };
    } catch (e) { last = e; }
  }
  throw new Error(p + ": " + last?.message);
}
/** Page to exhaustion and prove it against the server's own count. */
async function all(path) {
  const PAGE = 400, out = [];
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

/* ============ LESSON PROSE ONLY, NOT ITS EMBEDDED JSON ============
 *
 * ::interactive and ::checkpoint blocks carry JSON payloads -- option text,
 * concept_slugs, bloom_level. The first run extracted citations out of those
 * and produced claims like
 *
 *     annual revision - and is guidance in any case.", "concept_slugs": [...
 *
 * which is not a claim about a standard, it is a fragment of a data structure.
 * Nine of the first ninety-one "misattributions" were that. A rate computed
 * over garbage extractions is the defect this script exists to find, produced
 * by the script itself. */
function proseOnly(md) {
  const out = [];
  let skip = false;
  for (const line of String(md || "").split(String.fromCharCode(10))) {
    const t = line.trim();
    if (!skip && (t.startsWith("::interactive") || t.startsWith("::checkpoint"))) { skip = true; continue; }
    if (skip) { if (t === "::") skip = false; continue; }
    out.push(line);
  }
  return out.join(" ");
}

/* ---------------------------------------------------- citation extraction */

const VERBS = ["states", "state", "says", "notes", "note", "defines", "define", "requires",
  "require", "specifies", "specify", "provides", "provide", "lists", "list", "permits",
  "permit", "allows", "allow", "describes", "describe", "mandates", "calls", "gives"];

/** Structural punctuation that only appears inside an embedded JSON payload. */
function looksLikeData(t) {
  const marks = [String.fromCharCode(123), String.fromCharCode(125), String.fromCharCode(91), String.fromCharCode(93)];
  for (const m of marks) if (t.indexOf(m) >= 0) return true;
  const q = String.fromCharCode(34);
  if (t.indexOf(q + ": " + q) >= 0) return true;
  if (t.indexOf(q + ", " + q) >= 0) return true;
  return false;
}

/** Every "<standard> [clause X] <verb> <claim>" citation in a body of text. */
function extract(text) {
  const out = [];
  const src = String(text || "").replace(/\s+/g, " ");
  /* Find standard tokens: ISO 19011, ISO/IEC 42001:2023, ISO/IEC 27001 ... */
  const re = /\bISO(?:\/IEC)?\s+(\d{4,5})(?:-\d)?(?::\d{4})?/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const num = m[1];
    const tail = src.slice(m.index + m[0].length, m.index + m[0].length + 400);
    /* An address may follow: "clause 9.2", "Annex A", "A.6.2" */
    const addrM = /^[^.]{0,40}?\bclause\s+(\d+(?:\.\d+)*)/i.exec(tail);
    const address = addrM ? addrM[1] : null;
    /* An attribution verb makes the following text a CLAIM ABOUT the standard. */
    const vm = new RegExp("\\b(" + VERBS.join("|") + ")\\b", "i").exec(tail.slice(0, 90));
    if (!vm) continue;
    const after = tail.slice(vm.index + vm[0].length);
    const claim = (after.split(/(?<=[.;])\s/)[0] || after).slice(0, 320).trim()
      .replace(/^that\s+/i, "").replace(/^[:,]\s*/, "");
    if (claim.split(" ").length < 6) continue;
    /* A claim carrying JSON punctuation is a data fragment, not prose. */
    if (looksLikeData(claim)) continue;
    out.push({ standard: num, address, verb: vm[1].toLowerCase(), claim, at: m.index });
  }
  return out;
}

/* SELF-TEST ON THE EXTRACTOR. A regex that matches nothing turns this whole
 * report green, which is the failure this repository keeps paying for. */
const probe = extract("ISO 19011:2026 notes that an internal audit is conducted by the organization "
  + "itself or by an external party on its behalf. Hiring a consultant does not change that.");
if (probe.length !== 1 || probe[0].standard !== "19011" || !probe[0].claim.startsWith("an internal audit")) {
  console.error("EXTRACTOR SELF-TEST FAILED -- it cannot find the citation that motivated this script.");
  console.error(JSON.stringify(probe));
  process.exit(1);
}

/* ------------------------------------------------------------- the corpora */

const rows = [];
const certs = (await rest("certifications?select=id,code")).body;
const byId = new Map(certs.map((c) => [c.id, c.code]));

if (CORPUS === "lessons" || CORPUS === "both") {
  const mods = await all("modules?select=id,certification_id");
  const modCert = new Map(mods.map((m) => [m.id, byId.get(m.certification_id)]));
  const lessons = await all("lessons?select=id,slug,language,module_id,content_md&language=eq.en");
  for (const l of lessons) {
    rows.push({ corpus: "lesson", cert: modCert.get(l.module_id) ?? "?", ref: l.slug, text: proseOnly(l.content_md) });
  }
  console.log("  lessons (en): " + lessons.length);
}
if (CORPUS === "items" || CORPUS === "both") {
  const items = await all("quiz_questions?select=id,certification_id,question_text,options,correct_answer,explanation,language,retired_at&language=eq.en");
  const live = items.filter((q) => q.retired_at === null);
  for (const q of live) {
    /* ============ A DISTRACTOR IS SUPPOSED TO BE WRONG ============
     *
     * Scanning every option flags deliberately false statements as
     * misattributions -- an item whose wrong answer says ISO/IEC 27001 clause
     * 9.2.2 requires auditors to be independent IN ALL CASES is doing its job.
     * Only the stem, the CORRECT option and the explanation assert anything. */
    const keys = Array.isArray(q.correct_answer) ? q.correct_answer.map(String)
      : q.correct_answer == null ? [] : [String(q.correct_answer)];
    const opts = Array.isArray(q.options)
      ? q.options.filter((o) => o && keys.includes(String(o.id))).map((o) => o.text).filter(Boolean).join(" ")
      : "";
    rows.push({ corpus: "item", cert: byId.get(q.certification_id) ?? "?", ref: q.id,
      text: [q.question_text, opts, q.explanation].filter(Boolean).join(" ") });
  }
  console.log("  items (en, live): " + live.length);
}

/* ---------------------------------------------------------- the checking */

const findings = [];
let cited = 0;
for (const r of rows) {
  for (const c of extract(r.text)) {
    cited++;
    const shape = "reproduction";
    const res = checkCitation({ standard: c.standard, address: c.address, claim: c.claim, shape });
    findings.push({ ...r, text: undefined, ...c, ...res });
  }
}

/* ============ ONLY TWO VERDICTS ARE MECHANICALLY STRONG ============
 *
 * Most citations are PARAPHRASE. A fair paraphrase shares no contiguous
 * wording with the clause it describes, so "no correspondence" is the normal
 * reading of a correct citation and means almost nothing on its own -- the
 * first run reported 1,178 of them, 63 percent, and treating that as a defect
 * rate would have been a number with no finding under it.
 *
 * What IS strong:
 *   MISATTRIBUTED      the passage appears verbatim in a DIFFERENT indexed
 *                      standard -- a misattribution with the right answer
 *                      attached, and the shape that caught the 19011 case.
 *   ADDRESS NOT FOUND  the cited clause number does not exist there at all.
 *
 * Everything else is NOT MECHANICALLY DECIDABLE and is reported as such
 * rather than as either a pass or a failure. */
for (const f of findings) {
  if (f.verdict === "NO CORRESPONDENCE" || f.verdict === "PARTIAL" || f.verdict === "NO TESTABLE TERMS") {
    f.verdict = "NOT DECIDABLE (paraphrase)";
  }
}

const tally = findings.reduce((m, f) => ((m[f.verdict] = (m[f.verdict] || 0) + 1), m), {});
const mis = findings.filter((f) => f.verdict === "MISATTRIBUTED");
const notFound = findings.filter((f) => f.verdict === "ADDRESS NOT FOUND");
const checkable = findings.filter((f) => f.verdict !== "UNVERIFIABLE");

console.log("");
console.log("CITATION CORRESPONDENCE -- " + rows.length + " document(s), " + cited + " explicit citation(s)");
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log("  " + String(v).padStart(5) + "  " + k);
console.log("");
console.log("  checkable (standard is indexed)   " + checkable.length);
console.log("  MISATTRIBUTED                     " + mis.length
  + (checkable.length ? "   rate " + (100 * mis.length / checkable.length).toFixed(1) + "%" : ""));
console.log("  address named but not found       " + notFound.length);
console.log("  UNVERIFIABLE (standard not held)  " + (tally.UNVERIFIABLE || 0));

if (mis.length) {
  console.log("");
  console.log("===== EVERY MISATTRIBUTION");
  for (const f of mis) {
    console.log("");
    console.log("  " + f.corpus + "  " + f.cert + "  " + f.ref);
    console.log("     cited   : ISO " + f.standard + (f.address ? " clause " + f.address : "") + " " + f.verb);
    console.log("     claim   : " + f.claim.slice(0, 190));
    console.log("     in cited: " + f.run + "w contiguous");
    console.log("     ACTUALLY: " + f.best_source + " at " + f.best_run + "w");
  }
}
if (notFound.length) {
  console.log("");
  console.log("===== ADDRESS NAMED BUT NOT FOUND IN THE CITED STANDARD");
  for (const f of notFound) console.log("  " + f.corpus + "  " + f.cert + "  " + f.ref
    + "   ISO " + f.standard + " clause " + f.address);
}

const byStd = {};
for (const f of findings) {
  const k = "ISO " + f.standard + (HELD[f.standard] ? "" : "  (NOT HELD: " + (NOT_HELD[f.standard] || "not indexed") + ")");
  (byStd[k] ||= { n: 0, mis: 0 });
  byStd[k].n++;
  if (f.verdict === "MISATTRIBUTED") byStd[k].mis++;
}
console.log("");
console.log("===== CITATIONS BY STANDARD");
for (const [k, v] of Object.entries(byStd).sort((a, b) => b[1].n - a[1].n)) {
  console.log("  " + String(v.n).padStart(5) + "  " + k + (v.mis ? "   " + v.mis + " MISATTRIBUTED" : ""));
}

writeFileSync(join(HERE, "..", "CITATION-CORRESPONDENCE.json"), JSON.stringify({
  measured: "2026-09-21", corpus: CORPUS, documents: rows.length, citations: cited,
  tally, misattribution_rate: checkable.length ? mis.length / checkable.length : null,
  limits: [
    "Sees reproduced EXPRESSION. A claim that misdescribes a clause in original words scores clean here and is still wrong.",
    "A claim about a standard not on disk is UNVERIFIABLE, never clean.",
    "English only; the index is monolingual.",
  ],
  findings,
}, null, 2), "utf8");
console.log("");
console.log("wrote CITATION-CORRESPONDENCE.json");
