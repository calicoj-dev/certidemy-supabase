#!/usr/bin/env node
/**
 * check-definitional-citations.mjs - every citation that credits a DEFINITION
 * to a standard that does not define, or to a term that standard does not
 * define.
 *
 * READ-ONLY. Fixes nothing. Unknown flags exit 2.
 *
 * ============ WHY THIS IS NOT THE CORRESPONDENCE CHECK ============
 *
 * `check-citation-correspondence` asks whether the cited standard contains the
 * words, and then whether it carries the substance. Both can pass while the
 * citation is still wrong on its face:
 *
 *   ISO/IEC 27001:2022 CLAUSE 3 DEFINES NOTHING. It reads, in full, that the
 *   terms and definitions given in ISO/IEC 27000 apply. So "ISO/IEC 27001
 *   defines audit as..." is wrong however correct the definition is -- 27001
 *   contains the words because it USES the term, and carries the substance
 *   because it is the same management system. Both prior instruments pass it.
 *
 * This is a structural test, not a textual one: it asks whether the cited
 * document is CAPABLE of being the source of a definition at all.
 *
 * ISO/IEC 42001:2023 is the other half. Its clause 3 DOES define terms -- and
 * delegates the rest to ISO/IEC 22989. So a 42001 clause 3 citation is valid
 * only for a term 42001 actually defines, and the 26 terms are extracted
 * MECHANICALLY from the PDF rather than typed.
 *
 * ============ THE PREMISE IS ASSERTED, NOT ASSUMED ============
 *
 * The whole check rests on "27001 clause 3 defines nothing". That sentence is
 * read off the PDF before anything is reported, and the script refuses to run
 * if it cannot confirm it. A check whose premise is a remembered fact is the
 * shape this repository keeps paying for.
 */
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, pdftotextAvailable, verifyCorpus } from "./lib/citation-index.mjs";

for (const a of process.argv.slice(2)) {
  if (a.startsWith("--")) { console.error("Unrecognised flag: " + a + ". READ-ONLY, no flags."); process.exit(2); }
}
if (!pdftotextAvailable()) { console.error("pdftotext is not on PATH."); process.exit(2); }
const bad = verifyCorpus();
if (bad.length) { console.error("CORPUS CONTROL FAILED:\n  " + bad.join("\n  ")); process.exit(1); }

const NL = String.fromCharCode(10);
function pdfText(p) {
  const o = join(mkdtempSync(join(tmpdir(), "dc-")), "t.txt");
  execFileSync("pdftotext", ["-layout", p, o]);
  return readFileSync(o, "utf8").split("\r").join("");
}
const RAW = new Map();
for (const [k, p] of Object.entries(PDFS)) RAW.set(k, pdfText(p));

/* ---------------------------------------------- PREMISE, READ NOT ASSUMED */

const c27001 = RAW.get("27001:2022").replace(/\s+/g, " ");
const DELEGATES = c27001.includes("the terms and definitions given in ISO/IEC 27000 apply");
/* And it must define nothing of its own: no clause 3.x heading anywhere. */
const has3x = RAW.get("27001:2022").split(NL).some((l) => {
  const t = l.trim();
  if (!t.startsWith("3.")) return false;
  if (t.includes("....")) return false;
  const c = t[2];
  return c >= "0" && c <= "9";
});
console.log("");
console.log("PREMISE, read off the PDF");
console.log("  27001 cl.3 delegates to ISO/IEC 27000   " + DELEGATES);
console.log("  27001 has any 3.x sub-clause            " + has3x);
if (!DELEGATES || has3x) {
  console.error("");
  console.error("PREMISE NOT CONFIRMED. Refusing to report: this check exists only because");
  console.error("27001 clause 3 defines nothing, and that must be true of the copy on disk.");
  process.exit(1);
}

/* 42001's own defined terms, extracted mechanically. Case-insensitive on the
 * first letter, because requiring lowercase silently dropped 3.24 "AI system
 * impact assessment" once already. */
function clause3Terms(key) {
  const L = RAW.get(key).split(NL).map((s) => s.trim());
  const out = [];
  for (let i = 0; i < L.length - 1; i++) {
    if (!/^3\.\d{1,2}$/.test(L[i])) continue;
    let j = i + 1;
    while (j < L.length && !L[j]) j++;
    const t = L[j];
    if (t && /^[A-Za-z][a-zA-Z0-9 ,\-/()]{2,60}$/.test(t) && !t.includes("....")) out.push({ ref: L[i], term: t });
  }
  const seen = new Set(), uniq = [];
  for (const x of out) if (!seen.has(x.term)) { seen.add(x.term); uniq.push(x); }
  return uniq;
}
const T42001 = clause3Terms("42001:2023");
if (T42001.length < 20) { console.error("42001 clause 3 extraction yielded " + T42001.length + " terms. Refusing."); process.exit(1); }
console.log("  42001 cl.3 terms extracted              " + T42001.length);

/* -------------------------------------------------------------- the corpus */

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
async function all(path) {
  const PAGE = 400, out = [];
  for (let from = 0; ; from += PAGE) {
    const { body } = await rest(path + "&order=id&offset=" + from + "&limit=" + PAGE);
    out.push(...body);
    if (body.length < PAGE) break;
  }
  const { range } = await rest(path + "&limit=1", { headers: { Prefer: "count=exact" } });
  const total = range ? Number(range.split("/")[1]) : NaN;
  if (Number.isFinite(total) && total !== out.length) throw new Error("PAGING INCOMPLETE: " + out.length + " vs " + total);
  return out;
}

/** Lesson prose only; embedded JSON payloads are data, not claims. */
function proseOnly(md) {
  const out = [];
  let skip = false;
  for (const line of String(md || "").split(NL)) {
    const t = line.trim();
    if (!skip && (t.startsWith("::interactive") || t.startsWith("::checkpoint"))) { skip = true; continue; }
    if (skip) { if (t === "::") skip = false; continue; }
    out.push(line);
  }
  return out.join(" ");
}

/* ============ POSITIVE CONTROL. ZERO MEANS NOTHING WITHOUT IT ============
 *
 * This check ended at zero after three successive exclusions -- explanatory
 * context, negation proximity, voiced misconception -- each of which was a
 * real false-positive class and each of which made the count smaller. A count
 * driven to zero by its own filters is indistinguishable from a clean corpus,
 * and "a check that asks nothing passes" was recorded in this repository
 * today.
 *
 * So the detector is run against SYNTHETIC documents first. If the invalid one
 * does not fire, or the two correct ones do, nothing below is reported.
 */
const CONTROL_DOCS = [
  { corpus: "control", cert: "SYNTHETIC", ref: "must-fire",
    text: "ISO/IEC 27001 clause 3.2 defines nonconformity as the non-fulfilment of a requirement.", want: true },
  { corpus: "control", cert: "SYNTHETIC", ref: "requirement-not-definition",
    text: "ISO/IEC 27001 clause 9.2.2 a) requires the organization to define the audit criteria and scope for each audit.", want: false },
  { corpus: "control", cert: "SYNTHETIC", ref: "teaches-the-rule",
    text: "ISO/IEC 27001 clause 3 contains no standalone definitions; it delegates all terms to ISO/IEC 27000.", want: false },
];

const certs = (await rest("certifications?select=id,code")).body;
const byId = new Map(certs.map((c) => [c.id, c.code]));
const docs = [];
const mods = await all("modules?select=id,certification_id");
const modCert = new Map(mods.map((m) => [m.id, byId.get(m.certification_id)]));
for (const l of await all("lessons?select=id,slug,module_id,content_md&language=eq.en")) {
  docs.push({ corpus: "lesson", cert: modCert.get(l.module_id) ?? "?", ref: l.slug, text: proseOnly(l.content_md) });
}
for (const q of (await all("quiz_questions?select=id,certification_id,question_text,options,correct_answer,explanation,language,retired_at&language=eq.en"))
  .filter((x) => x.retired_at === null)) {
  const keys = Array.isArray(q.correct_answer) ? q.correct_answer.map(String) : q.correct_answer == null ? [] : [String(q.correct_answer)];
  const opts = Array.isArray(q.options) ? q.options.filter((o) => o && keys.includes(String(o.id))).map((o) => o.text).filter(Boolean).join(" ") : "";
  docs.push({ corpus: "item", cert: byId.get(q.certification_id) ?? "?", ref: q.id,
    text: [q.question_text, opts, q.explanation].filter(Boolean).join(" ") });
}
console.log("  documents scanned                       " + docs.length);

/* The detector is a function of the doc list, so the control runs by scanning
 * the synthetic docs with the same code path rather than a parallel copy. */

/* ------------------------------------------------------------- detection */

/* ============ "DEFINE" DOES TWO DIFFERENT JOBS AND THE FIRST DRAFT MERGED
 * THEM ============
 *
 * The first version matched the word and reported 105 instances. The very
 * first was
 *
 *   "ISO/IEC 27001 clause 9.2.2 a) requires the organization to define the
 *    audit criteria and scope for each audit"
 *
 * which is a REQUIREMENT claim and entirely correct. ISO standards say "the
 * organization shall define" constantly; that is the standard telling someone
 * ELSE to define something, not the standard being the source of a meaning.
 *
 * A guard that fires on the normal case gets deleted by the first person it
 * inconveniences, and its deletion takes the real assertion with it. So the
 * test is not the verb, it is WHO IS DOING THE DEFINING:
 *
 *   DEFINITIONAL   the standard is the subject   "27001 defines audit as"
 *                                                "the definition of X in 27001"
 *   REQUIREMENT    someone else is the subject   "27001 requires the
 *                                                 organization to define X"
 *
 * A requirement marker between the standard token and the verb disqualifies
 * the match. A clause 3 citation needs no verb at all: clause 3 is where
 * definitions live, and in 27001 it is empty.
 */
const DEF_VERB = /(defines|defining|defined|definition|the term|means|glossar)/i;
const REQ_MARK = /(requires?|required|shall|must|obliges?|expects?|asks?|mandates?|to define)/i;

/** Is this a claim that the STANDARD is the source of a meaning? */
function definitional(before, tail) {
  /* "defined in ISO/IEC 27001" / "27001's definition of" -- standard as the
   * location of a definition, whichever side the words fall. */
  if (/(defined|definition|defines)\s+(in|per|by|under|at)\s*$/i.test(before)) return true;
  if (/^'?s?\s*(definition|definitions)/i.test(tail)) return true;

  const m = DEF_VERB.exec(tail.slice(0, 90));
  if (!m) return false;
  /* A requirement marker BEFORE the verb means someone else does the defining. */
  const between = tail.slice(0, m.index);
  if (REQ_MARK.test(between)) return false;
  return true;
}

function scan(docList, findings) {
  for (const d of docList) {
  const s = String(d.text || "").replace(/\s+/g, " ");
  for (const m of s.matchAll(/\bISO(?:\/IEC)?\s+(27001|42001)(?::\d{4})?/g)) {
    const std = m[1];
    const start = m.index;
    const tail = s.slice(start + m[0].length, start + m[0].length + 180);
    const before = s.slice(Math.max(0, start - 110), start);

    /* A clause 3 citation, in either direction around the standard token. */
    const c3 = /^[^.]{0,30}?\b(?:clause|cl\.)\s*(3(?:\.\d+)*)\b/i.exec(tail)
      || /\b(?:clause|cl\.)\s*(3(?:\.\d+)*)\s*(?:of|in)\s*$/i.exec(before);
    const addr = c3 ? c3[1] : null;

    /* A definitional verb close enough to be about this standard. */
    const isDef = definitional(before.slice(-80), tail);
    if (!addr && !isDef) continue;

    const sentence = (s.slice(Math.max(0, start - 140), start + 240)).trim();
    let verdict, why;
    /* ============ A LESSON TEACHING THE POINT IS NOT AN INSTANCE OF IT =====
     *
     * The first tightened run flagged
     *
     *   "ISO/IEC 27001 clause 3 does not define its terms. It delegates..."
     *
     * which is a lesson explaining the very fact this check rests on. Same
     * shape as the negative-claim class in the misattribution split: a
     * sentence ABOUT the absence of a definition looks identical to one
     * asserting a definition, to anything matching on proximity.
     *
     * Second time today this shape has been caught by reading the output
     * rather than the number. */
    const window = (before.slice(-150) + " " + tail.slice(0, 150)).toLowerCase();
    /* A PHRASE LIST MISSED "contains no STANDALONE definitions". Scanning for
     * a negation within five words of the word definition catches the whole
     * family without anyone having to predict the adjective. */
    const explains = (() => {
      const w = window.split(" ").filter(Boolean);
      const NEGS = ["no", "not", "nothing", "never", "without", "delegates", "delegate",
        "delegated", "delegating", "points", "directs", "refers", "referenced", "references"];
      for (let k = 0; k < w.length; k++) {
        if (!w[k].startsWith("definition")) continue;
        for (let j = Math.max(0, k - 6); j < k; j++) if (NEGS.includes(w[j].replace(/[^a-z]/g, ""))) return true;
        for (let j = k + 1; j < Math.min(w.length, k + 5); j++) if (NEGS.includes(w[j].replace(/[^a-z]/g, ""))) return true;
      }
      for (const t of w) if (t.startsWith("delegat")) return true;
      return false;
    })();
    /* ============ A CORPUS THAT TEACHES A RULE CONTAINS SENTENCES THAT LOOK
     * LIKE VIOLATIONS OF IT ============
     *
     * Third shape of the same family today. An item STEM voices the
     * misconception so the answer can refute it:
     *
     *   "An auditor claims that ISO/IEC 27001 Clause 3 defines nonconformity
     *    directly, making ISO/IEC 27000 optional."
     *
     * That is the defect being TAUGHT, not committed. A claim attributed to a
     * speaker inside the text is not the document asserting it. */
    const VOICED = ["claims", "claim", "says", "said", "argues", "argue", "believes",
      "believe", "insists", "insist", "asserts", "assert", "suggests", "suggest",
      "states that iso is wrong", "colleague", "auditor claims", "candidate"];
    const voiced = VOICED.some((v) => window.includes(v + " ")) 
      || window.indexOf("'") >= 0 && /claims|says|colleague|auditor/.test(window);
    if (explains || voiced) { continue; }

    if (std === "27001") {
      /* 27001 cannot be the source of ANY definition. */
      verdict = "INVALID";
      why = addr ? "cites 27001 clause " + addr + "; 27001 clause 3 defines nothing, it delegates to ISO/IEC 27000"
        : "credits a definition to 27001; 27001 clause 3 defines nothing, it delegates to ISO/IEC 27000";
    } else {
      /* 42001 defines its own terms and delegates the rest to 22989. Valid
       * only if the term named is one of the 26. */
      const win = (before + " " + tail).toLowerCase();
      const hit = T42001.find((t) => win.includes(t.term.toLowerCase()));
      verdict = hit ? "VALID" : "CHECK";
      why = hit ? "42001 clause 3 defines \"" + hit.term + "\" at " + hit.ref
        : "no 42001-defined term found nearby; 42001 clause 3 delegates the rest to ISO/IEC 22989";
    }
    findings.push({ corpus: d.corpus, cert: d.cert, ref: d.ref, standard: "ISO/IEC " + std,
      address: addr, verdict, why, context: sentence });
  }
  }
}
const findings = [];

const CONTROL_RESULT = [];
{
  const saved = docs.splice(0, docs.length, ...CONTROL_DOCS);
  scan(docs, CONTROL_RESULT);
  docs.splice(0, docs.length, ...saved);
}
const ctlFail = CONTROL_DOCS.filter((c) => {
  const fired = CONTROL_RESULT.some((f) => f.ref === c.ref && f.verdict === "INVALID");
  return fired !== c.want;
});
console.log("");
console.log("POSITIVE CONTROL");
for (const c of CONTROL_DOCS) {
  const fired = CONTROL_RESULT.some((f) => f.ref === c.ref && f.verdict === "INVALID");
  console.log("  " + (fired === c.want ? "ok  " : "FAIL") + "  " + c.ref.padEnd(28)
    + (c.want ? "must fire" : "must NOT fire") + " -> " + (fired ? "fired" : "silent"));
}
if (ctlFail.length) {
  console.error("");
  console.error("CONTROL FAILED. Refusing to report: a zero this detector cannot justify");
  console.error("is indistinguishable from a detector that cannot fire.");
  process.exit(1);
}

scan(docs, findings);

/* Dedupe identical (ref, standard, sentence) triples. */
const seen = new Set();
const uniq = findings.filter((f) => {
  const k = f.ref + "|" + f.standard + "|" + f.context.slice(0, 90);
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

const inv = uniq.filter((f) => f.verdict === "INVALID");
const chk = uniq.filter((f) => f.verdict === "CHECK");
const val = uniq.filter((f) => f.verdict === "VALID");

console.log("");
console.log("DEFINITIONAL CITATIONS");
console.log("  ISO/IEC 27001 credited with a definition  " + String(inv.length).padStart(4) + "   INVALID on its face");
console.log("  ISO/IEC 42001 clause 3, term IS defined   " + String(val.length).padStart(4) + "   valid");
console.log("  ISO/IEC 42001, no defined term nearby     " + String(chk.length).padStart(4) + "   CHECK -- may belong to 22989");

const byCert = {};
for (const f of inv) (byCert[f.cert] ||= { lesson: 0, item: 0 })[f.corpus]++;
console.log("");
console.log("  INVALID by certification:");
for (const [c, v] of Object.entries(byCert).sort()) console.log("    " + c.padEnd(10) + v.lesson + " lesson(s), " + v.item + " item(s)");

console.log("");
console.log("===== EVERY 27001 DEFINITIONAL CITATION");
for (const f of inv) {
  console.log("");
  console.log("  " + f.corpus + "  " + f.cert + "  " + f.ref + (f.address ? "   clause " + f.address : ""));
  console.log("     " + f.context.slice(0, 260));
}
if (chk.length) {
  console.log("");
  console.log("===== 42001 CITATIONS WITH NO 42001-DEFINED TERM NEARBY");
  for (const f of chk.slice(0, 20)) {
    console.log("");
    console.log("  " + f.corpus + "  " + f.cert + "  " + f.ref + (f.address ? "   clause " + f.address : ""));
    console.log("     " + f.context.slice(0, 230));
  }
  if (chk.length > 20) console.log("");
  if (chk.length > 20) console.log("  ... " + (chk.length - 20) + " more in the file");
}

writeFileSync(join(HERE, "..", "DEFINITIONAL-CITATIONS.json"), JSON.stringify({
  measured: "2026-09-21",
  premise: {
    "ISO/IEC 27001:2022 clause 3": "defines nothing; reads only that the terms and definitions given in ISO/IEC 27000 apply. Confirmed against the PDF before reporting.",
    "ISO/IEC 42001:2023 clause 3": "defines " + T42001.length + " terms of its own AND delegates the rest to ISO/IEC 22989.",
  },
  terms_42001: T42001.map((t) => t.ref + " " + t.term),
  documents: docs.length,
  counts: { invalid_27001: inv.length, valid_42001: val.length, check_42001: chk.length },
  limits: [
    "Detects a DEFINITIONAL claim by verb proximity. A definition attributed in some other phrasing is not reached.",
    "English only.",
    "Item distractors are excluded: only stems, correct options and explanations are scanned.",
  ],
  invalid: inv, check: chk,
}, null, 2), "utf8");
console.log("");
console.log("wrote DEFINITIONAL-CITATIONS.json");
