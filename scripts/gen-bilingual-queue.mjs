#!/usr/bin/env node
/**
 * gen-bilingual-queue.mjs - the translations a human has to read before they
 * can be served, WITH THE TEXT IN THE FILE.
 *
 * READ-ONLY. Writes BILINGUAL-QUEUE.json and nothing else.
 *
 * ============ WHAT THE FIRST VERSION DID ============
 *
 * It emitted 98 rows whose counts were exactly right and whose CONTENT WAS
 * ABSENT:
 *
 *   - 64 lesson rows where `english_now` and `translation_now` were both the
 *     literal string "(long -- read the row)". A truncation guard at 4,000
 *     characters, written for safety, fired on every single lesson body,
 *     because a lesson body is 10,000+ characters. Nothing was truncated; it
 *     was all replaced.
 *   - 34 blueprint rows with `translated_now: null` on every one.
 *
 * A queue whose row count is right and whose text is missing is the same shape
 * as every other defect this week: the number looks like the work.
 *
 * ============ AND THE BLUEPRINT ROWS SHOULD NEVER HAVE BEEN HERE ============
 *
 * Two independent reasons, either sufficient:
 *
 *   1. THERE IS NOTHING TO READ. `task_translations.knowledge` is NULL on all
 *      70 AIMS-F rows -- only `statement` is translated. The 34 rows asked a
 *      reviewer to compare an English knowledge field against a Spanish one
 *      that does not exist. A NULL field also cannot reproduce ISO text, so the
 *      concern that put them in the queue was unfounded.
 *   2. THERE IS NOWHERE TO RECORD A VERDICT. `lesson_translation_reviews` is
 *      keyed on `lesson_id`. No table holds a review of a task translation, so
 *      those rows had no clearing path even once read -- which is why they
 *      carried no `clear_sql` while all 64 lesson rows did.
 *
 * They are gone. The real finding underneath them is recorded in
 * FRIDAY-READINESS.md: AIMS-F and SM-AI-II have NO translated knowledge, skills
 * or abilities at all, so their Spanish and Portuguese syllabi are thinner than
 * the English. That is a content gap, not an IP gap, and it needs its own work.
 *
 * ============ WHAT A REVIEWER ACTUALLY NEEDS ============
 *
 * Not the whole lesson. The PASSAGE that was repaired, and the paragraph in the
 * other language that sits at the same position, side by side.
 *
 * The repaired spans are recoverable: every batch's `after` strings are in
 * scripts/lesson-repairs-*.mjs, and the translations align positionally by
 * block and line -- the same alignment the marking pass established and 162 of
 * 163 lessons satisfy. So each queue row carries one entry per repaired
 * passage: the English paragraph as it now reads, and the translated paragraph
 * at the same block and line.
 *
 * WHAT THE REVIEWER IS LOOKING FOR is not whether the translation matches the
 * English. It is whether the TRANSLATION reproduces a sentence of ISO's own
 * Spanish or Portuguese edition. The English was repaired; the translation was
 * not, and still says what the clause said.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { blocks, solid } from "./lib/guide-runs.mjs";

const KNOWN = new Set(["--out"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". READ-ONLY. Known: --out.");
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const OUT = arg("out", "BILINGUAL-QUEUE.json");

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
async function g(p) {
  let last;
  for (let i = 0; i < 12; i++) {
    try {
      const r = await fetch(BASE + "/" + p, { headers: H, signal: AbortSignal.timeout(60000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 160));
      return JSON.parse(t);
    } catch (e) { last = e; }
  }
  throw last;
}
const md5 = (s) => createHash("md5").update(s, "utf8").digest("hex").slice(0, 8);

/* -------- every repaired span, from the batch files that produced them ----- */
const BATCHES = [
  "./lesson-repairs-aimsf.mjs",
  "./lesson-repairs-aimsf-b2.mjs",
  "./lesson-repairs-aimsf-m1.mjs",
  "./lesson-repairs-aimsf-m2.mjs",
  "./lesson-repairs-aimsf-m3.mjs",
  "./lesson-repairs-aimsf-m5.mjs",
];
/** slug -> [{after, address, note}] */
const spansBySlug = new Map();
for (const b of BATCHES) {
  const path = join(HERE, b.slice(2));
  if (!existsSync(path)) { console.error("missing batch file " + b); process.exit(2); }
  const { REPAIRS } = await import(new URL(b, "file:///" + HERE.replace(/\\/g, "/") + "/").href);
  for (const r of REPAIRS) {
    const list = spansBySlug.get(r.slug) ?? [];
    for (const sp of [r.en, ...(r.also ?? [])]) {
      list.push({ after: sp.after, address: r.address, note: r.note ?? null });
    }
    spansBySlug.set(r.slug, list);
  }
}
/* ISMS-F's three came from gen-iso-repair-spec.mjs, whose repairs are inline.
 * Kept here rather than refactoring that file, and the ONLY hand-maintained
 * list left -- it is three entries and they are finished. */
spansBySlug.set("02-09-pdca-and-improvement", [{
  after: "Clause 10.1 requires the ISMS itself to be improved on three counts: how well it fits the organisation, whether it is sufficient, and whether it works.",
  address: "27001 clause 10.1", note: "the whole sentence was clause 10.1" }]);
spansBySlug.set("05-02-internal-audit", [{
  after: "The standard requires audits to be run so the process stays [objective and impartial]{glossary=\"auditor-objectivity\"} (clause 9.2.2 b).",
  address: "27001 clause 9.2.2 b", note: "the quoted span sat inside the glossary annotation" }]);
spansBySlug.set("02-03-amendment-1-2024", [{
  after: "it added a requirement to decide whether climate change is relevant to the organisation.",
  address: "27001 Amd.1:2024 to clause 4.1", note: null }]);

/* ------------------------------------------------------- the flagged rows */
const flagged = await g("lessons?select=id,slug,language,lesson_group_id,content_md&mcp_translation_review_required=is.true");
const groupIds = [...new Set(flagged.map((r) => r.lesson_group_id))].filter(Boolean);

const ens = {};
for (const gid of groupIds) {
  const r = await g("lessons?select=id,slug,content_md,module_id,lesson_group_id&language=eq.en&lesson_group_id=eq." + gid);
  if (r[0]) ens[gid] = r[0];
}
const certs = await g("certifications?select=id,code");
const mods = await g("modules?select=id,certification_id");
const modCert = new Map(mods.map((m) => [m.id, (certs.find((c) => c.id === m.certification_id) || {}).code]));

/* ============ RAW LINE INDEX, NOT BLOCK/LINE ============
 *
 * The first version located spans with `blocks()`, which returns PUBLISHED
 * blocks only -- hook, concept, callout, summary, deep-dive. Nine repaired
 * spans live inside ::checkpoint blocks, so it could not find them, and six
 * rows came back with no passages at all.
 *
 * Raw line index is what `apply-marking-spec.mjs` used to WRITE these repairs
 * in all three languages, so it is the alignment already proven on this corpus.
 * Every span is locatable by it.
 *
 * Each passage is then annotated with whether its line sits in a published
 * block, because that decides what the reviewer is actually deciding:
 *
 *   served true   -- this text goes over the MCP. Reading it is what clears
 *                    the gate.
 *   served false  -- a ::checkpoint. Never returned by courseware-read, which
 *                    replaces content_md with PUBLISHED_BLOCKS only. Worth
 *                    reading because a learner sees it in the app, but it is
 *                    not what the gate is about.
 */
const lineSpans = (md) => {
  const out = [];
  const re = /\r?\n/g;
  let st = 0, m;
  while ((m = re.exec(md)) !== null) { out.push([st, m.index]); st = m.index + m[0].length; }
  out.push([st, md.length]);
  return out;
};
/** The set of raw line indices that fall inside a PUBLISHED block. */
function publishedLines(md) {
  const spans = lineSpans(md);
  const set = new Set();
  for (const b of blocks(md)) for (const l of solid(b)) set.add(l.abs);
  void spans;
  return set;
}
function locate(md, needle) {
  const spans = lineSpans(md);
  for (let i = 0; i < spans.length; i++) {
    const t = md.slice(spans[i][0], spans[i][1]);
    if (t.includes(needle)) return { idx: i, text: t };
  }
  return null;
}
function lineAt(md, idx) {
  const spans = lineSpans(md);
  return spans[idx] ? md.slice(spans[idx][0], spans[idx][1]) : null;
}

/* ============ THE TRANSLATION IS FOUND BY BLOCK, NOT BY RAW LINE ============
 *
 * Raw line index locates a span in ITS OWN document reliably. Across languages
 * it does not: seven passages came back with no translated line at all, because
 * the English and Spanish bodies do not have the same number of lines.
 *
 * That was an assumption, not a measurement. `apply-marking-spec.mjs` writes a
 * PER-LANGUAGE `line_abs` computed separately for each document -- it never
 * assumed one index served all three.
 *
 * What IS proven on this corpus is BLOCK alignment: 162 of 163 lessons across
 * the four Scrum certifications have an identical block sequence and identical
 * per-block non-empty line counts, which is the property the whole marking pass
 * was built on. So a published line maps by (block, line-within-block).
 *
 * A ::checkpoint line has no published block to map through, so it falls back
 * to raw index and is allowed to come back null -- it does not gate anything.
 */
function blockCoord(md, rawIdx) {
  const bs = blocks(md);
  for (let bi = 0; bi < bs.length; bi++) {
    const sol = solid(bs[bi]);
    for (let li = 0; li < sol.length; li++) if (sol[li].abs === rawIdx) return { bi, li };
  }
  return null;
}
function lineAtBlock(md, bi, li) {
  const bs = blocks(md);
  if (!bs[bi]) return null;
  const sol = solid(bs[bi]);
  return sol[li] ? sol[li].text : null;
}

const out = [];
let unlocated = 0;
for (const row of flagged) {
  const en = ens[row.lesson_group_id];
  if (!en) continue;
  const spans = spansBySlug.get(row.slug) ?? [];
  const pubEn = publishedLines(en.content_md);
  const passages = [];
  for (const sp of spans) {
    const at = locate(en.content_md, sp.after);
    if (!at) {
      unlocated++;
      if (!globalThis.__miss) globalThis.__miss = [];
      globalThis.__miss.push(row.slug + " | " + sp.after.slice(0, 72));
      continue;
    }
    const served = pubEn.has(at.idx);
    const coord = served ? blockCoord(en.content_md, at.idx) : null;
    const translated = coord
      ? lineAtBlock(row.content_md, coord.bi, coord.li)
      : lineAt(row.content_md, at.idx);
    passages.push({
      clause: sp.address,
      served,
      aligned_by: coord ? "block " + coord.bi + ", line " + coord.li : "raw line " + at.idx,
      english_after_repair: at.text.trim(),
      translation_now: (translated ?? "").trim() || null,
    });
  }
  /* Served passages first: they are what the gate turns on. */
  passages.sort((a, b) => (a.served === b.served ? 0 : a.served ? -1 : 1));
  out.push({
    cert: modCert.get(en.module_id) || "?",
    slug: row.slug,
    language: row.language,
    lesson_id: row.id,
    passages_to_read: passages.length,
    passages_that_gate_the_body: passages.filter((p) => p.served).length,
    passages,
    clear_sql: "insert into public.lesson_translation_reviews (lesson_id, reviewed_by, en_hash, verdict) values ('" +
      row.id + "', 'juan', '" + md5(en.content_md) + "', 'approved');",
  });
}

/* Spanish first, then by certification and slug. */
out.sort((a, b) =>
  (a.language === "es-419" ? 0 : 1) - (b.language === "es-419" ? 0 : 1) ||
  a.cert.localeCompare(b.cert) || a.slug.localeCompare(b.slug));

/* ============ CONTROLS. A queue with the right count and no text is the
 * defect this file was rewritten for, so it refuses to write one. ============ */
const problems = [];
const noPassages = out.filter((r) => r.passages.length === 0);
if (noPassages.length) {
  problems.push(noPassages.length + " row(s) carry no passages at all: " +
    [...new Set(noPassages.map((r) => r.cert + "/" + r.slug))].join(", "));
}
const emptyText = out.flatMap((r) => r.passages.map((p) => ({ ...p, slug: r.slug, lang: r.language })))
  /* A SERVED passage must have both texts. An unserved one (a ::checkpoint)
   * may not map across languages at all, and that is acceptable: it gates
   * nothing. Holding it to the same bar would block the queue on lines the
   * reviewer does not need. */
  .filter((p) => !p.english_after_repair || (p.served && !p.translation_now));
if (emptyText.length) {
  problems.push(emptyText.length + " passage(s) missing text: " +
    emptyText.map((p) => p.slug + "/" + p.lang + " line " + p.line).join("; "));
}
const placeholderish = out.flatMap((r) => r.passages)
  .filter((p) => /^\(.*read the row.*\)$/.test(p.english_after_repair || ""));
if (placeholderish.length) problems.push(placeholderish.length + " passage(s) still carry a placeholder");

console.log("");
console.log("rows " + out.length + "   es-419 " + out.filter((r) => r.language === "es-419").length +
  "   pt-BR " + out.filter((r) => r.language === "pt-BR").length);
console.log("passages " + out.reduce((n, r) => n + r.passages.length, 0) +
  "   spans that could not be located in the English: " + unlocated);
if (globalThis.__miss) {
  const uniq = [...new Set(globalThis.__miss)];
  console.log("");
  console.log("UNLOCATED SPANS (" + uniq.length + " distinct):");
  for (const m of uniq) console.log("   " + m);
}
console.log("");
if (problems.length) {
  console.log("NOT WRITING:");
  for (const p of problems) console.log("  X " + p);
  process.exitCode = 1;
} else {
  writeFileSync(OUT, JSON.stringify({
    purpose:
      "Translations withheld until a human reads them. Each passage below is one place the ENGLISH was " +
      "repaired to remove reproduced ISO clause text. The translation was NOT repaired and still says what " +
      "the clause said. WHAT TO LOOK FOR: not whether the translation matches the English, but whether the " +
      "translation reproduces a sentence of ISO's own Spanish or Portuguese edition. No instrument here can " +
      "check that -- the leak index is built from the English editions only.",
    how_to_clear:
      "Run the row's clear_sql once you have read every passage in it. The en_hash pins the review to the " +
      "English as it reads now, so a later English edit makes the review stale and the translation is " +
      "withheld again automatically.",
    spanish_first: true,
    rows: out.length,
    spanish_rows: out.filter((r) => r.language === "es-419").length,
    portuguese_rows: out.filter((r) => r.language === "pt-BR").length,
    total_passages: out.reduce((n, r) => n + r.passages.length, 0),
    blueprint_rows_removed:
      "34 task-knowledge rows were in an earlier version of this file and are gone. task_translations.knowledge " +
      "is NULL on every AIMS-F row -- only `statement` is translated -- so there was nothing to read; and " +
      "lesson_translation_reviews is keyed on lesson_id, so there was nowhere to record a verdict. See " +
      "FRIDAY-READINESS.md for the content gap underneath that.",
    entries: out,
  }, null, 1) + "\n");
  console.log("wrote " + OUT);
}
