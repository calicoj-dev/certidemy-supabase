#!/usr/bin/env node
/**
 * gen-concept-translations.mjs - the 1,730 concepts into es-419 and pt-BR.
 *
 * DRY BY DEFAULT. `--apply` writes. Unknown flags exit 2, because scripts/ has
 * two opposite flag conventions and this one must not be guessed at.
 *
 * Every row lands `is_provisional = true`, so migration 355's view does not
 * serve any of it. Nothing reaches a partner until the sample is read and the
 * rows are cleared.
 *
 * ===========================================================================
 * THE BATCH IS SIZED BY MEASURED WORDS *AND* A ROW CAP
 * ===========================================================================
 *
 * gen-jta-translations records the failure this avoids. CHUNK=25 sent 25 tasks
 * x 3 fields on AIMS-F -- about 2,400 source words asking for 2,400 back -- and
 * the response came back truncated mid-string at position 24,037. Its own note
 * names the cause exactly: "It is an output-length ceiling, not a model error,
 * and it depends entirely on how long the source fields are... nothing in the
 * script knows that."
 *
 * So this one knows. It packs concepts into a batch until a WORD BUDGET is
 * reached, which makes the batch size a consequence of the data instead of a
 * constant that is right for eight certifications and wrong for the ninth.
 *
 * MEASURED ON THIS POPULATION, 2026-09-20:
 *
 *     total            1,730 concepts, 37,173 words of name + description
 *     AIMS-IA            158 concepts, 11,548 words   mean 73, max 108
 *     everything else  1,572 concepts, 25,625 words   mean 10-21
 *
 * AIMS-IA is 9 percent of the rows and 31 percent of the words. A fixed chunk
 * is wrong in BOTH directions here: 25 concepts is ~1,825 words on AIMS-IA,
 * into the range that broke AIMS-F, and ~250 words on SPO-AI-I, which is five
 * times more calls than that data needs.
 *
 * BUDGET = 1200 source words. The two known data points are 1,425 words
 * completing (AIMS-F at CHUNK=5) and ~2,400 truncating, so this sits below the
 * one that worked rather than between them.
 *
 * ROWCAP = 40, AND THE WORD BUDGET ALONE WAS NOT ENOUGH -- measured, not
 * predicted. The first version sized by source words only and packed 120
 * SPO-AI-I concepts into one call: just 1,197 source words, because that
 * certification averages ten words a concept. The response truncated anyway.
 *
 * THE CEILING IS ON OUTPUT AND OUTPUT HAS TWO DRIVERS. Translated text scales
 * with words; JSON scaffolding scales with ROWS -- every row echoes its slug
 * back plus keys and braces, and `recurring-incident-signals-problem` costs
 * the same whether its description is ten words or a hundred. Sizing by
 * source words alone measures the wrong side of the call, which is the same
 * mistake gen-jta-translations' note describes from the other direction.
 *
 * ===========================================================================
 * THE CLAUSE REGISTER IS THE LESSON ONE, AND THAT IS A DECISION
 * ===========================================================================
 *
 * Concept descriptions are read alongside lessons, so they follow the
 * NATIONAL-ADOPTION register a reader studies from: capitulo / apartado /
 * Secao, never clausula. That is translate-lessons.mjs's rule, NOT
 * lib/item-translation.mjs's pin 8, which pins clausula for the register a
 * candidate is examined in.
 *
 * THE TWO ARE DELIBERATELY OPPOSITE AND BOTH ARE WRITTEN DOWN. This script
 * does not restate the rule from memory: it ASSERTS that the sentence it sends
 * still appears verbatim in translate-lessons.mjs, so an edit there breaks
 * this loudly rather than letting a third copy drift.
 */

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contractForDomain, domainForCert } from "./lib/item-translation.mjs";
import { looksLikeLanguage } from "./lib/language-guard.mjs";

let APPLY = false, ONLY_CERT = null, ONLY_LANG = null, BUDGET = 1200, LIMIT_BATCHES = 0, ROWCAP = 40;
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === "--apply") APPLY = true;
  else if (a === "--cert") ONLY_CERT = process.argv[++i];
  else if (a === "--lang") ONLY_LANG = process.argv[++i];
  else if (a === "--budget") BUDGET = Number(process.argv[++i]);
  else if (a === "--rowcap") ROWCAP = Number(process.argv[++i]);
  else if (a === "--batches") LIMIT_BATCHES = Number(process.argv[++i]);
  else {
    console.error("unknown flag: " + a);
    console.error("DRY BY DEFAULT; --apply writes. `--dry` is NOT a flag here.");
    console.error("Also: --cert <CODE> --lang <es-419|pt-BR> --budget <words> --rowcap <n> --batches <n>");
    process.exit(2);
  }
}

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AI = process.env.ANTHROPIC_API_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
if (!AI && APPLY) { console.error("ANTHROPIC_API_KEY is not set"); process.exit(2); }
const REST = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };

/* ---------------------------------------------- the shared clause register */
const CLAUSE_RULE =
  "'clause' as a numbered division of an ISO standard: es-419 uses capítulo for a whole " +
  "top-level division (Clause 6) and apartado for a numbered sub-requirement (clause 6.1.3). " +
  "pt-BR uses Seção. NEVER cláusula in either language - it reads as a contractual clause.";
/* PARITY ASSERTION, not a copy. If translate-lessons.mjs's rule is edited this
 * throws rather than silently becoming a third register. */
const lessonSrc = readFileSync(join(HERE, "translate-lessons.mjs"), "utf8");
const probe = "es-419 uses cap\\u00edtulo for a whole top-level division";
if (!lessonSrc.includes(probe) && !lessonSrc.includes("es-419 uses capítulo for a whole top-level division")) {
  console.error("PARITY FAILED: translate-lessons.mjs no longer carries the clause rule this");
  console.error("script mirrors. One of the two moved. Reconcile before translating 1,730 rows.");
  process.exit(2);
}

/* --------------------------------------------------------------- db access */
async function all(path) {
  const rows = []; let from = 0, total = null;
  for (;;) {
    let page = null;
    for (let i = 0; i < 8; i++) {
      try {
        const r = await fetch(REST + "/" + path, {
          headers: { ...H, Range: from + "-" + (from + 499), Prefer: "count=exact" },
          signal: AbortSignal.timeout(60000),
        });
        if (!r.ok) throw new Error("HTTP " + r.status + " " + (await r.text()).slice(0, 140));
        total = Number(String(r.headers.get("content-range") || "").split("/")[1]);
        page = await r.json(); break;
      } catch (e) { if (i === 7) throw e; }
    }
    rows.push(...page);
    if (page.length < 500) break;
    from += 500;
  }
  if (total !== null && rows.length !== total) throw new Error("SHORT READ on " + path + ": " + rows.length + " of " + total);
  return rows;
}

const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;
const LANGS = { "es-419": "Latin American Spanish", "pt-BR": "Brazilian Portuguese" };

function systemFor(langName, certCode) {
  const { vocabulary } = contractForDomain(domainForCert(certCode));
  return `You translate CONCEPT DEFINITIONS from English into ${langName}.

A concept is a short technical definition a learner meets alongside the lesson
that teaches it. Preserve the definition exactly: what it asserts, what it
excludes, and any obligation it does or does not impose. These are not marketing
copy and not prose to improve.

Return a JSON array of the SAME length and order as the input. For each item:
  {"slug":string,"name":string,"description":string}
  - slug is copied back EXACTLY as given. It is the key, never translated.
  - Translate name and description into ${langName}.
  - If description is null, return null for it.

HOUSE RULES
  - ${CLAUSE_RULE}
  - Do NOT add an obligation the English does not state. If the English says a
    thing is done, do not render it as a thing that must be done, and do not
    add a periodicity the English does not carry.
  - Do NOT add, drop, merge or reorder items.
  - Output strict JSON only. NO prose, NO markdown fences.

${vocabulary}

OUTPUT LANGUAGE: ${langName}. NOTHING ELSE.`;
}

async function callModel(system, user) {
  let last;
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": AI, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({
          model: "claude-opus-5", max_tokens: 16000, system,
          messages: [{ role: "user", content: user }],
        }),
        signal: AbortSignal.timeout(180000),
      });
      if (!r.ok) throw new Error("HTTP " + r.status + " " + (await r.text()).slice(0, 200));
      const j = await r.json();
      const text = (j.content ?? []).map((c) => c.text ?? "").join("");
      /* NAME THE TRUNCATION. The first version reported "no JSON array in
       * response", which is the symptom a truncated reply produces and sends
       * the reader to look at the prompt. stop_reason says what happened. */
      if (j.stop_reason === "max_tokens") {
        throw new Error("response hit max_tokens after " + text.length + " chars -- batch too large, lower --rowcap or --budget");
      }
      const m = text.match(/\[[\s\S]*\]/);
      if (!m) throw new Error("no JSON array in response (stop_reason=" + j.stop_reason + ", " + text.length + " chars)");
      /* THROWS on a truncated response rather than writing a partial batch --
       * the property that made gen-jta-translations' ceiling a note and not an
       * incident. */
      return JSON.parse(m[0]);
    } catch (e) { last = e; }
  }
  throw last;
}

/* ------------------------------------------------------------------- plan */
const certs = Object.fromEntries((await all("certifications?select=id,code")).map((c) => [c.id, c.code]));
const concepts = await all("concepts?select=id,slug,name,description,certification_id");
const existing = await all("concept_translations?select=concept_id,language");
const have = new Set(existing.map((r) => r.concept_id + "|" + r.language));

const plan = [];
for (const lang of Object.keys(LANGS)) {
  if (ONLY_LANG && lang !== ONLY_LANG) continue;
  const byCert = {};
  for (const c of concepts) {
    const code = certs[c.certification_id] ?? "?";
    if (ONLY_CERT && code !== ONLY_CERT) continue;
    if (have.has(c.id + "|" + lang)) continue;       // resumable by construction
    (byCert[code] ||= []).push(c);
  }
  for (const [code, rows] of Object.entries(byCert)) {
    let batch = [], w = 0;
    for (const c of rows) {
      const cw = words(c.name) + words(c.description);
      /* TWO LIMITS, BECAUSE THE CEILING IS ON OUTPUT AND OUTPUT HAS TWO
       * DRIVERS. The word budget covers translated text; ROWCAP covers the
       * JSON scaffolding, which scales with ROWS and not with words -- each
       * row echoes a slug back plus its keys and braces.
       *
       * The first version had the budget alone and packed 120 SPO-AI-I
       * concepts into one call: only 1,197 source words, because that
       * certification averages 10 words a concept, but 120 slugs of pure
       * structure. The response truncated and the batch was refused.
       * Sizing by source words alone measures the wrong side of the call. */
      if (batch.length && (w + cw > BUDGET || batch.length >= ROWCAP)) { plan.push({ lang, code, batch, w }); batch = []; w = 0; }
      batch.push(c); w += cw;
    }
    if (batch.length) plan.push({ lang, code, batch, w });
  }
}

console.log("");
console.log("  budget " + BUDGET + " source words per call, max " + ROWCAP + " rows per call");
console.log("  " + concepts.length + " concept(s), " + existing.length + " translation row(s) already present");
console.log("  " + plan.length + " batch(es) planned, " + plan.reduce((a, p) => a + p.batch.length, 0) + " row(s) to write");
const big = plan.filter((p) => p.batch.length === 1 && p.w > BUDGET);
if (big.length) console.log("  " + big.length + " single concept(s) exceed the budget alone and go as their own call");
const byc = plan.reduce((m, p) => { (m[p.code] ||= { b: 0, w: 0 }); m[p.code].b++; m[p.code].w += p.w; return m; }, {});
for (const [c, v] of Object.entries(byc).sort()) {
  console.log("    " + c.padEnd(10) + String(v.b).padStart(3) + " batch(es), " + String(v.w).padStart(6) + " words, max batch " +
    Math.max(...plan.filter((p) => p.code === c).map((p) => p.w)) + "w");
}

if (!APPLY) {
  console.log("");
  console.log("  DRY RUN. Nothing written and no model called. Re-run with --apply.");
  process.exit(0);
}

/* ============ en_hash: THIS WRITER PREDATES THE GATE THAT NEEDS IT ========
 *
 * Migration 359 keyed `concept_translations.en_hash` to
 * `concept_row_en_hash(concept_id)` and `mcp.concept` joins on it. This script
 * was written before that and inserted no en_hash at all, so every row it
 * wrote landed NULL and COULD NEVER PASS THE GATE -- it would fall back to
 * English forever, silently, with the row present and looking translated.
 *
 * The same shape as "a migration that adds a column must name every writer",
 * except the column is nullable, so nothing failed. Found while regenerating
 * AIMS-F and fixed here rather than worked around there.
 *
 * The function is one line of SQL and is reproduced exactly:
 *   left(md5(coalesce(name,'') without CR || '|' || coalesce(description,'')
 *            without CR), 16)
 * A control below checks this JS against the database's own answer rather than
 * trusting that the reproduction is faithful. */
/* Escape-free: shell transports have collapsed backslashes in this repo all day. */
const CR = String.fromCharCode(13);
const enHash = (name, description) =>
  createHash("md5")
    .update(String(name ?? "").split(CR).join("") + "|" + String(description ?? "").split(CR).join(""))
    .digest("hex").slice(0, 16);

/* ------------------------------------------------------------------ apply */
let wrote = 0, failed = 0, guardFail = 0;
const problems = [];
for (let i = 0; i < plan.length; i++) {
  if (LIMIT_BATCHES && i >= LIMIT_BATCHES) break;
  const p = plan[i];
  const label = "[" + (i + 1) + "/" + plan.length + "] " + p.code + "/" + p.lang + " " + p.batch.length + " row(s) " + p.w + "w";
  let out;
  try {
    out = await callModel(
      systemFor(LANGS[p.lang], p.code),
      "Translate these " + p.batch.length + " concept definitions:\n\n" +
      JSON.stringify(p.batch.map((c) => ({ slug: c.slug, name: c.name, description: c.description })), null, 2) +
      "\n\nReturn the JSON array now.");
  } catch (e) {
    console.log("  " + label + "  FAILED: " + String(e.message).slice(0, 110));
    failed++; continue;
  }
  /* POST-CONDITIONS PER BATCH, before anything is written. */
  if (!Array.isArray(out) || out.length !== p.batch.length) {
    console.log("  " + label + "  count mismatch: got " + (Array.isArray(out) ? out.length : "non-array"));
    failed++; continue;
  }
  const bySlug = new Map(out.map((r) => [r.slug, r]));
  const rows = [];
  let bad = false;
  for (const c of p.batch) {
    const t = bySlug.get(c.slug);
    if (!t) { console.log("  " + label + "  slug missing from response: " + c.slug); bad = true; break; }
    /* LANGUAGE GUARD. The wrong-language defect is rung 1 of CLAUDE.md's
     * translation ladder and is the only rung a machine can settle. */
    if (c.description && t.description && !looksLikeLanguage(t.description, p.lang)) {
      problems.push(p.code + "/" + p.lang + " " + c.slug + ": description does not read as " + p.lang);
      guardFail++;
    }
    rows.push({
      concept_id: c.id, language: p.lang,
      name: t.name ?? null, description: t.description ?? null,
      is_provisional: true, review_status: "unreviewed",
      en_hash: enHash(c.name, c.description),
    });
  }
  if (bad) { failed++; continue; }
  const r = await fetch(REST + "/concept_translations", {
    method: "POST",
    headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!r.ok) {
    console.log("  " + label + "  WRITE FAILED: " + r.status + " " + (await r.text()).slice(0, 120));
    failed++; continue;
  }
  wrote += rows.length;
  console.log("  " + label + "  ok");
}

/* ------------------------------------------- post-conditions, read back */
const after = await all("concept_translations?select=concept_id,language,is_provisional");
console.log("");
console.log("  wrote " + wrote + " row(s), " + failed + " batch(es) failed");
console.log("  table now holds " + after.length + " row(s)");

/* ============ THIS POST-CONDITION WAS CORPUS-WIDE AND IS NOT ANY MORE ====
 *
 * It asserted that NO row in the whole table is non-provisional. That was true
 * the day it was written, when nothing had been cleared. 2,236 rows have since
 * been reviewed and cleared on purpose, so the assertion now fires on a
 * perfectly correct database and reports legitimately-serving content as
 * "live to partners now".
 *
 * A post-condition guards THIS WRITE. A corpus-wide property belongs in a
 * check script -- CLAUDE.md's own distinction, and the same misplacement as
 * the four migrations that aborted on literals about rows they never touched.
 *
 * Scoped to the rows this run actually wrote. */
const writtenIds = new Set(plan.slice(0, LIMIT_BATCHES || plan.length).flatMap((p) => p.batch.map((c) => c.id)));
const mineServed = after.filter((r) => writtenIds.has(r.concept_id) && r.is_provisional === false);
if (mineServed.length !== 0) {
  console.error("  " + mineServed.length + " row(s) THIS RUN WROTE are not provisional -- they would serve immediately");
  process.exit(1);
}
console.log("  0 of the " + writtenIds.size + " concept(s) this run touched are non-provisional");
const clearedElsewhere = after.filter((r) => !writtenIds.has(r.concept_id) && r.is_provisional === false).length;
console.log("  " + clearedElsewhere + " row(s) elsewhere in the table are cleared and serving, which is expected");
if (problems.length) {
  console.log("");
  console.log("  " + problems.length + " language-guard concern(s):");
  for (const x of problems.slice(0, 20)) console.log("    " + x);
}
