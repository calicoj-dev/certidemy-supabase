#!/usr/bin/env node
/**
 * measure-ksa-review-cost.mjs - what would it take to REVIEW a certification's
 * task KSA translations rather than withhold them?
 *
 * READ-ONLY. --cert, --json, --verbose. Unknown flags exit 2. No --apply.
 *
 * ============ IT TESTS THE PREMISE FIRST ============
 *
 * The case for reviewing rather than withholding rests on a claim: these are
 * translations of English that was NEVER repaired, so the leak argument does not
 * apply to them.
 *
 * That is checkable and is checked here, not assumed. The ISO n-gram index is
 * run over the ENGLISH `tasks.knowledge / skills / abilities` for the
 * certification. If any of them carries a run at or over the threshold, the
 * premise is wrong and the review is a leak hunt after all.
 *
 * The leak scanner has never looked at `tasks`. It scans `lessons`, and its six
 * post-conditions are all about lesson rows. So this is the first time the
 * blueprint's own KSA text has been measured against the standards, and a
 * "clean" answer here is a new fact rather than a restatement.
 *
 * ============ AND IT SIZES THE READING, NOT THE ROWS ============
 *
 * 98 rows is not the unit a reader works in. Characters are closer, DISTINCT
 * strings closer still -- a KSA repeated verbatim across two tasks is one
 * judgement -- and what actually decides whether this is an hour is how long
 * each fragment is and how many of them are single clauses rather than
 * paragraphs.
 *
 * ============ WHAT CLEARING THE FLAG ACTUALLY DOES ============
 *
 * `lessons` has `lesson_translation_reviews`: a verdict, a reviewer, a date and
 * an `en_hash`, so a later English edit makes the review STALE and closes the
 * door again. `task_translations.ksa_is_provisional` is a bare boolean. There is
 * no reviews table for it, so clearing it records nothing and nothing can
 * invalidate it. This script reports that asymmetry because it is part of the
 * cost of the decision, not a footnote to it.
 */
import { readFileSync, existsSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, sourcesAvailable } from "./lib/citation-index.mjs";
import { norm } from "./lib/iso-segments.mjs";

const KNOWN = new Set(["--cert", "--json", "--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". READ-ONLY. Known: " + [...KNOWN].join(", "));
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const CERT = arg("cert", "ISMS-F");
const JSON_OUT = arg("json", "");
const VERBOSE = process.argv.includes("--verbose");

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
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
async function raw(p, x = {}) {
  let last;
  for (let i = 0; i < 12; i++) {
    try {
      const r = await fetch(BASE + "/" + p, { headers: { ...H, ...x }, signal: AbortSignal.timeout(60000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 180));
      return { rows: JSON.parse(t), range: r.headers.get("content-range") };
    } catch (e) { last = e; }
  }
  throw last;
}
/* CLAUDE.md: a PostgREST read without pagination and a count assertion is a
 * floor, not a total. */
async function all(p) {
  const PAGE = 500, out = [];
  for (let from = 0; ; from += PAGE) {
    const { rows } = await raw(p, { Range: from + "-" + (from + PAGE - 1) });
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  const { range } = await raw(p + (p.includes("?") ? "&" : "?") + "limit=1", { Prefer: "count=exact" });
  const total = Number(String(range || "").split("/")[1]);
  if (!Number.isFinite(total)) throw new Error("no exact count for " + p);
  if (out.length !== total) throw new Error("PAGINATION SHORT: " + out.length + " of " + total);
  return out;
}

/* ------------------------------------------------- the ISO index, for part 1 */
if (!sourcesAvailable()) { console.error("standards not on disk; cannot test the premise"); process.exit(2); }
const SEED = 5;
const grams = new Set();
for (const p of Object.values(PDFS)) {
  const o = join(mkdtempSync(join(tmpdir(), "iso-")), "t.txt");
  execFileSync("pdftotext", ["-layout", p, o]);
  const w = norm(readFileSync(o, "utf8")).split(" ").filter(Boolean);
  for (let i = 0; i + SEED <= w.length; i++) grams.add(w.slice(i, i + SEED).join(" "));
}
const longestRun = (t) => {
  const w = norm(t).split(" ").filter(Boolean);
  let best = 0, text = "";
  for (let i = 0; i + SEED <= w.length; i++) {
    if (!grams.has(w.slice(i, i + SEED).join(" "))) continue;
    let n = SEED;
    while (i + n + 1 <= w.length && grams.has(w.slice(i + n + 1 - SEED, i + n + 1).join(" "))) n++;
    if (n > best) { best = n; text = w.slice(i, i + n).join(" "); }
    i += n - 1;
  }
  return { best, text };
};
/* POSITIVE CONTROL: the index must trip on a sentence known to be in 27001. */
const CANARY = "the organization shall determine external and internal issues that are relevant to " +
  "its purpose and that affect its ability to achieve the intended outcome(s) of its " +
  "information security management system";
const canaryRun = longestRun(CANARY).best;
const canaryWant = norm(CANARY).split(" ").length;

const THRESHOLD = (await all("mcp_leak_policy?select=threshold_words"))[0].threshold_words;

const cert = (await all("certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }
const doms = await all("domains?select=id,code&certification_id=eq." + cert.id);
const domOf = new Map(doms.map((d) => [d.id, d.code]));
const tasks = (await all("tasks?select=id,code,domain_id,knowledge,skills,abilities,certification_id"))
  .filter((t) => t.certification_id === cert.id);
const tt = (await all("task_translations?select=task_id,language,knowledge,skills,abilities,ksa_is_provisional,is_provisional,review_status"))
  .filter((r) => tasks.some((t) => t.id === r.task_id));

console.log("");
console.log(CERT + ": the cost of REVIEWING the task KSA translations");
console.log("  " + tasks.length + " task(s), " + tt.length + " translation row(s), threshold " + THRESHOLD + " words");

/* ============ PART 1: DOES THE LEAK ARGUMENT APPLY AT ALL? ============ */
console.log("");
console.log("PART 1 -- is the ENGLISH KSA text free of ISO runs?");
console.log("  control: a known 27001 sentence scores " + canaryRun + " of " + canaryWant + " words" +
  (canaryRun === canaryWant ? "   (index live)" : "   INDEX BROKEN"));
if (canaryRun !== canaryWant) {
  console.error("  The index cannot reproduce a sentence it must contain. Measuring nothing.");
  process.exit(1);
}
const hits = [];
let fieldsScanned = 0;
for (const t of tasks) {
  for (const f of ["knowledge", "skills", "abilities"]) {
    const v = String(t[f] ?? "").trim();
    if (!v) continue;
    fieldsScanned++;
    const r = longestRun(v);
    if (r.best >= THRESHOLD) hits.push({ task: t.code, domain: domOf.get(t.domain_id), field: f, words: r.best, text: r.text });
  }
}
let closest = 0, closestWhere = "";
for (const t of tasks) {
  for (const f of ["knowledge", "skills", "abilities"]) {
    const v = String(t[f] ?? "").trim();
    if (!v) continue;
    const r = longestRun(v);
    if (r.best > closest) { closest = r.best; closestWhere = domOf.get(t.domain_id) + " " + t.code + " " + f; }
  }
}
console.log("  English KSA fields scanned   " + fieldsScanned);
console.log("  longest run found            " + closest + "w  (" + (closestWhere || "none") +
  "), threshold " + THRESHOLD);
console.log("  fields with a run >= " + THRESHOLD + "w    " + hits.length);
if (hits.length === 0) {
  console.log("  => The premise holds. No English KSA field on this certification reproduces");
  console.log("     ISO text at or above the threshold, so a review of its translations is");
  console.log("     NOT a leak hunt. It is a fidelity and register check.");
} else {
  console.log("  => The premise does NOT hold for " + hits.length + " field(s):");
  for (const h of hits.slice(0, 10)) {
    console.log("     " + h.domain + " " + h.task + " " + h.field + "  " + h.words + "w: \"" + h.text.slice(0, 90) + "\"");
  }
}

/* ============ PART 2: THE VOLUME A READER FACES ============ */
const gated = tt.filter((r) => r.ksa_is_provisional === true);
const byLang = new Map();
const distinct = new Map();     // normalised string -> occurrences
let fragments = 0;
for (const r of gated) {
  const a = byLang.get(r.language) ?? { rows: 0, fields: 0, chars: 0, words: 0, frags: [] };
  a.rows++;
  for (const f of ["knowledge", "skills", "abilities"]) {
    const v = String(r[f] ?? "").trim();
    if (!v) continue;
    a.fields++;
    a.chars += v.length;
    a.words += v.split(/\s+/).length;
    a.frags.push(v);
    fragments++;
    const k = r.language + "|" + norm(v);
    distinct.set(k, (distinct.get(k) ?? 0) + 1);
  }
  byLang.set(r.language, a);
}

console.log("");
console.log("PART 2 -- the volume, in the units a reader works in");
console.log("");
console.log("  language   rows  KSA fields  characters   words  distinct fields");
for (const [lang, a] of [...byLang.entries()].sort()) {
  const dis = [...distinct.keys()].filter((k) => k.startsWith(lang + "|")).length;
  console.log("  " + lang.padEnd(10) + String(a.rows).padStart(4) + String(a.fields).padStart(12) +
    String(a.chars).padStart(12) + String(a.words).padStart(8) + String(dis).padStart(17));
}
const totChars = [...byLang.values()].reduce((s, a) => s + a.chars, 0);
const totWords = [...byLang.values()].reduce((s, a) => s + a.words, 0);
const totFields = [...byLang.values()].reduce((s, a) => s + a.fields, 0);
console.log("  " + "TOTAL".padEnd(10) + String(gated.length).padStart(4) + String(totFields).padStart(12) +
  String(totChars).padStart(12) + String(totWords).padStart(8));

/* Shape of each fragment: a reader clears a clause faster than a paragraph. */
const allFrags = [...byLang.values()].flatMap((a) => a.frags);
const lens = allFrags.map((f) => f.split(/\s+/).length).sort((x, y) => x - y);
const pct = (p) => lens[Math.min(lens.length - 1, Math.floor(lens.length * p))];
const sentences = allFrags.map((f) => (f.match(/[.;]\s|[.;]$/g) || []).length || 1);
console.log("");
console.log("  fragment length, words   min " + lens[0] + "   p50 " + pct(0.5) +
  "   p90 " + pct(0.9) + "   max " + lens[lens.length - 1]);
console.log("  fragments of <= 25 words " + lens.filter((l) => l <= 25).length + " of " + lens.length +
  "  (" + Math.round(100 * lens.filter((l) => l <= 25).length / lens.length) + "%)");
console.log("  single-clause fragments  " + sentences.filter((s) => s <= 1).length + " of " + sentences.length);

/* ============ PART 2b: HOW MUCH OF THE READ IS ALREADY COVERED ============
 *
 * The guards built for the lesson pass work on any (english, translation) pair
 * and cost nothing to run. If they clear a fragment, a reader is confirming
 * register rather than hunting a defect -- and the ones they flag are where an
 * hour should start.
 *
 * This is not a substitute for the read. It is a running order. */
const { preservesObligationAcross, noModalInflation } = await import("./lib/obligation-guard.mjs");
const { looksLikeLanguage, checkFaithful: langCtl } = await import("./lib/language-guard.mjs");
const { checkFaithful: obCtl } = await import("./lib/obligation-guard.mjs");

const ctlBad = [...langCtl(), ...obCtl()];
console.log("");
console.log("PART 2b -- how much of the read the existing guards already clear");
if (ctlBad.length) {
  console.log("  A GUARD FAILED ITS OWN CONTROL; not scoring anything.");
  for (const c of ctlBad) console.log("    X " + c);
} else {
  console.log("  controls: language guard clean, obligation guard clean");
  const enOf = new Map(tasks.map((t) => [t.id, t]));
  const flagged = [];
  let scored = 0;
  for (const r of gated) {
    const t = enOf.get(r.task_id);
    if (!t) continue;
    for (const f of ["knowledge", "skills", "abilities"]) {
      const en = String(t[f] ?? "").trim();
      const tr = String(r[f] ?? "").trim();
      if (!en || !tr) continue;
      scored++;
      const reasons = [];
      const ob = preservesObligationAcross(en, "en", tr, r.language);
      if (!ob.ok) reasons.push("OBLIGATION: " + ob.reason);
      else if (ob.inserted) reasons.push("obligation INSERTED");
      const inf = noModalInflation(en, tr, r.language);
      if (!inf.ok) reasons.push("MODAL INFLATED");
      const lg = looksLikeLanguage(tr, r.language);
      if (!lg.ok) reasons.push("LANGUAGE " + lg.want + "/" + lg.avoid);
      if (reasons.length) {
        flagged.push({ domain: domOf.get(t.domain_id), task: t.code, field: f, language: r.language, reasons, en, tr });
      }
    }
  }
  console.log("  fragment pairs scored     " + scored);
  console.log("  cleared by every guard    " + (scored - flagged.length) +
    "   (" + Math.round(100 * (scored - flagged.length) / scored) + "%)");
  console.log("  FLAGGED, read these first " + flagged.length);
  const byReason = new Map();
  for (const f of flagged) for (const r of f.reasons) {
    const k = r.split(":")[0];
    byReason.set(k, (byReason.get(k) ?? 0) + 1);
  }
  for (const [k, v] of [...byReason.entries()].sort((a, b) => b[1] - a[1])) {
    console.log("      " + String(v).padStart(3) + "  " + k);
  }
  if (VERBOSE) {
    for (const f of flagged.slice(0, 20)) {
      console.log("");
      console.log("    " + f.domain + " " + f.task + " " + f.field + " / " + f.language + "  -- " + f.reasons.join("; "));
      console.log("      en: " + f.en.replace(/\s+/g, " ").slice(0, 120));
      console.log("      tr: " + f.tr.replace(/\s+/g, " ").slice(0, 120));
    }
  }
  globalThis.__flagged = flagged;
}

/* ============ PART 3: WHAT CLEARING THE FLAG RECORDS ============ */
const lessonReviews = await all("lesson_translation_reviews?select=lesson_id&limit=1");
console.log("");
console.log("PART 3 -- what clearing the flag would record");
console.log("  lessons  : lesson_translation_reviews exists (verdict, reviewer, date, en_hash)");
console.log("             so a later English edit makes the review STALE and re-closes the gate");
console.log("  task KSAs: task_translations.ksa_is_provisional is a bare boolean");
console.log("             no reviews table, no reviewer, no date, NO en_hash");
console.log("  => Clearing it records nothing and nothing can invalidate it. If the English");
console.log("     KSA is edited later, the cleared translation keeps serving against text it");
console.log("     no longer renders, and no instrument here would say so.");

if (JSON_OUT) {
  writeFileSync(join(ROOT, JSON_OUT), JSON.stringify({
    cert: CERT, threshold: THRESHOLD,
    premise: { english_fields_scanned: fieldsScanned, fields_with_run: hits.length, hits },
    volume: {
      rows: gated.length, fields: totFields, characters: totChars, words: totWords,
      per_language: [...byLang.entries()].map(([k, v]) => ({ language: k, rows: v.rows, fields: v.fields, chars: v.chars, words: v.words })),
      fragment_words: { min: lens[0], p50: pct(0.5), p90: pct(0.9), max: lens[lens.length - 1] },
      short_fragments: lens.filter((l) => l <= 25).length,
    },
    clearing_records_nothing: true,
    guard_prepass: (globalThis.__flagged ?? []).map((f) => ({
      domain: f.domain, task: f.task, field: f.field, language: f.language,
      reasons: f.reasons, english: f.en, translation: f.tr,
    })),
  }, null, 1) + "\n");
  console.log("");
  console.log("wrote " + JSON_OUT);
}
