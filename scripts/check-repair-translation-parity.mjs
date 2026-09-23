#!/usr/bin/env node
/**
 * check-repair-translation-parity.mjs -- does each translated lesson body
 * render the OLD English or the NEW one?
 *
 * READ-ONLY. Takes --json and --verbose. Unknown flags exit 2. Writes nothing
 * to the database.
 *
 * ============ THE QUESTION, AND WHY IT IS ANSWERABLE ============
 *
 * The English lesson bodies carried ISO reproductions and were repaired. The
 * leak index is ENGLISH-ONLY, and `scan-iso-leaks` takes a translated row's
 * verdict from its English sibling -- so repairing the English releases the
 * translation too, still carrying the reproduction, with every instrument
 * reporting clean. `retranslate-audit-sentence.mjs` says exactly that in its
 * own header.
 *
 * There is no `en_hash` on `lessons`, and all 1,437 rows were bulk-written
 * inside a twelve-second window on 2026-09-21, so neither provenance nor
 * timestamps can answer it.
 *
 * WHAT CAN: the repairs are a SMALL KNOWN SET and each has a before and an
 * after, in all three languages, recorded in the emitted `*-spec.json` files.
 * So the test is not "is this Spanish a reproduction" -- unanswerable without
 * a Spanish index -- but "is this Spanish the sentence we replaced, or the one
 * we replaced it with". That needs no index at all.
 *
 * ============ THE THREE VERDICTS, AND THE THIRD IS NOT A FAILURE ==========
 *
 *   NEW         the live body contains the `after` text. The repair reached
 *               this language.
 *   OLD         the live body contains the `before` text. The repair did NOT
 *               reach this language and the pre-repair sentence is serving.
 *   NEITHER     neither string is present verbatim. The body moved for some
 *               other reason, or the span was edited again. NOT resolved by
 *               preference -- it is reported for a human, because guessing
 *               here is the whole defect class this repository is built round.
 *
 * ============ WHAT IT CANNOT DO ============
 *
 * It covers only spans that a spec file recorded. A lesson whose English was
 * repaired with NO spec emitted is reported as UNCOVERED -- neither passing
 * nor failing, because nothing here knows what its translation should say.
 * That set is the finding, not the silence.
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--json", "--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". READ-ONLY; takes --json and --verbose.");
    process.exit(2);
  }
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

/* Paged with a count assertion. A short read here would under-report OLD rows,
 * which is the direction that flatters. */
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
  if (!Number.isFinite(total)) throw new Error("no parseable content-range on " + path);
  if (out.length !== total) throw new Error("SHORT READ on " + path + ": " + out.length + " of " + total);
  return out;
}

/* Comparison is on NORMALISED text: CR stripped, whitespace collapsed. The
 * bodies are markdown written by several tools over months and a stray double
 * space must not read as "the repair did not land". */
const norm = (s) => String(s ?? "").replace(/\r/g, "").replace(/\s+/g, " ").trim();

/* ---------------------------------------------- 1. the English repair set */
const repairFiles = readdirSync(HERE).filter((f) =>
  /^(lesson-repairs-.*|apply-audit-sentence-rewrite|sweep-clausula|revert-ismsia-citation)\.mjs$/.test(f));
const englishRepaired = new Map();
for (const f of repairFiles) {
  const txt = readFileSync(join(HERE, f), "utf8");
  for (const m of txt.matchAll(/slug:\s*"([^"]+)"/g)) {
    const list = englishRepaired.get(m[1]) ?? new Set();
    list.add(f); englishRepaired.set(m[1], list);
  }
}

/* ---------------------------------------------- 2. the retranslation record */
const specFiles = readdirSync(ROOT).filter((f) => /-spec\.json$/.test(f));
const spans = [];
for (const f of specFiles) {
  let j; try { j = JSON.parse(readFileSync(join(ROOT, f), "utf8")); } catch { continue; }
  for (const e of j.entries ?? []) {
    for (const [lang, v] of Object.entries(e.languages ?? {})) {
      if (lang === "en") continue;
      if (!v || typeof v.after !== "string" || typeof v.before !== "string") continue;
      if (norm(v.before) === norm(v.after)) continue;   // nothing to tell apart
      spans.push({ spec: f, cert: e.cert, slug: e.slug, lang, before: v.before, after: v.after, address: e.address ?? e.run });
    }
  }
}

/* ---------------------------------------------- 3. the live bodies */
const lessons = await allRows("lessons?select=id,slug,language,content_md");
const body = new Map(lessons.map((l) => [l.slug + "|" + l.language, norm(l.content_md)]));

/* ---------------------------------------------- 4. the verdicts */
const results = [];
for (const sp of spans) {
  const live = body.get(sp.slug + "|" + sp.lang);
  if (live === undefined) { results.push({ ...sp, verdict: "NO SUCH ROW" }); continue; }
  /* PRECEDENCE, NOT MEMBERSHIP, and the first version of this got it wrong.
   *
   * Many repairs APPEND rather than replace -- a marking pass adds a glossary
   * annotation and leaves the sentence intact, so `before` is a SUBSTRING of
   * `after`. Testing both independently then reported BOTH on 290 of 418
   * spans, which is not a finding about the corpus: it is arithmetic. A span
   * whose `after` contains its `before` can never be told apart that way.
   *
   * So: if the NEW text is present the repair landed, whatever else is there.
   * Only when it is absent does the presence of the old text mean anything. */
  const hasNew = live.includes(norm(sp.after));
  const hasOld = live.includes(norm(sp.before));
  const verdict = hasNew ? "NEW" : hasOld ? "OLD" : "NEITHER";
  results.push({ ...sp, verdict, appended: norm(sp.after).includes(norm(sp.before)) });
}

/* ======================= POSITIVE CONTROL =======================
 *
 * retranslate-audit-sentence.mjs PROVES at least one repair was followed by a
 * retranslation. Its three lessons must come back NEW. If they do not, either
 * the retranslation never landed or this comparison is broken -- and in both
 * cases every other verdict below is uninterpretable, so nothing is printed.
 */
/* FROM THE SCRIPT THAT DID THE WORK, not from a spec file.
 *
 * The first version took the control spans from the specs and got NEITHER on
 * both: the audit-sentence retranslation was applied by its OWN `EDITS` table,
 * so the spec's `after` is not the text that landed. A control has to test the
 * artifact that was actually applied. */
/* LINE SCANNING, NO REGEX ESCAPES. The first attempt used a multiline pattern
 * with escaped quote classes and it was corrupted in transit to the file --
 * the exact failure this repository already records against an extractor
 * written through a shell heredoc. trimStart() and startsWith() cannot be
 * mangled that way. */
const controlSrc = readFileSync(join(HERE, "retranslate-audit-sentence.mjs"), "utf8");
const controlEdits = [];
{
  const Q = String.fromCharCode(34);
  /* `slug` and `lang` share a line with the field after them, so their value
   * ends at the FIRST quote. `from` and `to` own their line and their text may
   * contain a quote, so theirs ends at the LAST. Using one rule for both is
   * what produced a slug of `05-02-aims-internal-award", lang: "es-419`. */
  const field = (line, name, toEnd) => {
    const k = name + ": " + Q;
    const i = line.indexOf(k);
    if (i < 0) return null;
    const rest = line.slice(i + k.length);
    const end = toEnd ? rest.lastIndexOf(Q) : rest.indexOf(Q);
    return end < 0 ? null : rest.slice(0, end);
  };
  let cur = null;
  for (const raw of controlSrc.split(/\r?\n/)) {
    const line = raw.trim();
    const slug = field(line, "slug", false), lang = field(line, "lang", false);
    if (slug && lang) cur = { slug, lang };
    if (!cur) continue;
    const from = field(line, "from", true); if (from !== null) cur.before = from;
    const to = field(line, "to", true);
    if (to !== null && cur.before !== undefined) { controlEdits.push({ ...cur, after: to }); cur = null; }
  }
}
const controlRows = controlEdits.map((e) => {
  const live = body.get(e.slug + "|" + e.lang);
  if (live === undefined) return { ...e, verdict: "NO SUCH ROW" };
  return { ...e, verdict: live.includes(norm(e.after)) ? "NEW" : live.includes(norm(e.before)) ? "OLD" : "NEITHER" };
});
const controlNew = controlRows.filter((r) => r.verdict === "NEW").length;

console.log("");
console.log("REPAIR / TRANSLATION PARITY");
console.log("");
console.log("  English repair scripts   " + repairFiles.length + "   naming " + englishRepaired.size + " lesson(s)");
console.log("  spec files               " + specFiles.length + "   " + spans.length + " translated span(s) with a before and an after");
console.log("");
console.log("  POSITIVE CONTROL -- the three lessons retranslate-audit-sentence.mjs repaired");
if (controlRows.length === 0) {
  console.log("    DID NOT RUN -- no spec covers those lessons, so nothing proves this comparison works.");
} else {
  console.log("    " + controlNew + " of " + controlRows.length + " span(s) resolve NEW");
  for (const r of controlRows) console.log("      " + r.verdict.padEnd(8) + r.slug + "  " + r.lang);
}

const tally = {};
for (const r of results) tally[r.verdict] = (tally[r.verdict] || 0) + 1;
console.log("");
console.log("  VERDICTS  " + Object.entries(tally).map(([k, v]) => k + " " + v).join("   "));

const old = results.filter((r) => r.verdict === "OLD");
if (old.length) {
  console.log("");
  console.log("  STILL RENDERING THE PRE-REPAIR SENTENCE:");
  for (const r of old) {
    console.log("    " + r.cert + "  " + r.slug + "  " + r.lang + "   [" + r.spec + "]");
    console.log("      was: " + norm(r.before).slice(0, 150));
    console.log("      now: " + norm(r.after).slice(0, 150));
  }
}

const neither = results.filter((r) => r.verdict === "NEITHER");
if (neither.length) {
  console.log("");
  console.log("  NEITHER STRING PRESENT -- for a human, not resolved by preference:");
  for (const r of neither.slice(0, VERBOSE ? 999 : 12)) {
    console.log("    " + r.cert + "  " + r.slug.padEnd(42) + r.lang + "   [" + r.spec + "]");
    if (VERBOSE) console.log("      expected: " + norm(r.after).slice(0, 140));
  }
  if (!VERBOSE && neither.length > 12) console.log("    ... and " + (neither.length - 12) + " more (--verbose)");
}

/* UNCOVERED: repaired in English, no spec span to compare against. */
/* Covered = has a spec span OR was handled by the dedicated retranslation
 * script. Counting only spec spans reported two of that script's three lessons
 * as UNCOVERED, which is false: they were retranslated, just not through a
 * spec file. */
const covered = new Set([...spans.map((s) => s.slug), ...controlEdits.map((e) => e.slug)]);
const uncovered = [...englishRepaired.keys()].filter((s) => !covered.has(s));
console.log("");
console.log("  UNCOVERED -- English repaired, no spec span to test against: " + uncovered.length + " lesson(s)");
console.log("  Neither passing nor failing. Nothing here knows what their translations should say.");
if (VERBOSE) for (const s of uncovered) console.log("    " + s);

if (JSON_OUT) {
  writeFileSync(join(ROOT, "REPAIR-TRANSLATION-PARITY.json"), JSON.stringify({
    measured: new Date().toISOString(),
    english_repair_scripts: repairFiles.length,
    english_repaired_lessons: [...englishRepaired.keys()],
    spans_tested: spans.length, tally,
    /* Derived, not a second hand-typed list. The constant this replaced was
     * deleted when the control moved to the applied EDITS table, and the
     * reference survived here -- so the JSON write threw AFTER the summary had
     * printed. The script reported 77 uncovered and persisted a stale 79, and
     * a downstream classifier read the file rather than the screen.
     *
     * A WRITE THAT FAILS AFTER THE PRINT IS WORSE THAN ONE THAT FAILS BEFORE:
     * the run looks complete. */
    control: { slugs: [...new Set(controlEdits.map((e) => e.slug))], spans: controlRows.length, new: controlNew },
    results, uncovered,
  }, null, 2), "utf8");
  console.log("");
  console.log("  wrote REPAIR-TRANSLATION-PARITY.json");
}

if (controlRows.length > 0 && controlNew === 0) {
  console.error("");
  console.error("CONTROL FAILED: not one control span resolves NEW. Every verdict above is uninterpretable.");
  process.exit(1);
}
