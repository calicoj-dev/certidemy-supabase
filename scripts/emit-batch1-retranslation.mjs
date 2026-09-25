#!/usr/bin/env node
/**
 * emit-batch1-retranslation.mjs -- the AIMS-F batch-1 lessons and their AIMS-IA
 * pair, whose English moved and whose translations never followed.
 *
 * READ-ONLY apart from the spec it writes. `--emit <file>`. Unknown flags exit 2.
 * The spec is applied by `regenerate-moved-english.mjs --from`, which is the
 * only writer -- one applier, so the byte read-back and the batch stamping
 * cannot drift between two code paths.
 *
 * ============ WHY BLOCK GRANULARITY, NOT WHOLE BODY ============
 *
 * These bodies average 13,000 characters and the English moved in a handful of
 * declared spans. Retranslating the whole body would replace ~234,000
 * characters of text that is fine, and EVERY REGENERATED WORD IS AN UNREVIEWED
 * WORD -- the post-358 retranslation changed five of seven concepts in text its
 * source edit never touched, including a term the corpus had settled 96 to 6.
 *
 * So the unit is the BLOCK containing the edit. Bounded, locatable, and the
 * same coordinate the sampler aligns on.
 *
 * ============ THE ANCHORS COME FROM THE REPOSITORY ============
 *
 * Each batch-1 script declares its edits as { id, from, to }, where `to` is the
 * text now in the English. Finding that text in the live English body and
 * asserting it occurs EXACTLY ONCE is the derivation: an anchor that matches
 * zero or twice means the record and the database have parted company, and the
 * row is reported rather than guessed at.
 *
 * ============ 05-01 IS EXCLUDED, AND THAT IS THE POINT OF CHECKING ==========
 *
 * `05-01-aims-monitoring-and-measurement` was in the list handed over. Its
 * ENGLISH is withheld for ISO reproduction at 12 words -- the run the
 * position-extension fix surfaced. Regenerating its translations from that
 * English would faithfully translate a reproduction. The English is repaired
 * first, or nothing is.
 */
import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { looksLikeLanguage } from "./lib/language-guard.mjs";
import { bothFormsCorrect, isCarriedEnglish } from "./lib/accent-classes.mjs";
import { checkModalSentences, checkDefinedTerms, checkRegister, checkClauseVocab,
         registerOf, controls } from "./lib/translation-checks.mjs";

const argv = process.argv.slice(2);
for (const a of argv) {
  if (a.startsWith("--") && a !== "--emit" && a !== "--regate") { console.error("Unrecognised flag: " + a); process.exit(2); }
}
const i = argv.indexOf("--emit");
const OUT = i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : "";
const ri = argv.indexOf("--regate");
const REGATE = ri >= 0 && argv[ri + 1] && !argv[ri + 1].startsWith("--") ? argv[ri + 1] : "";
if (!OUT && !REGATE) { console.error("--emit <file>, or --regate <rejected file>."); process.exit(2); }

/* RE-GATE, NEVER REGENERATE, TO FIX A GATE. The generator is not deterministic,
 * so regenerating to clear a checker bug replaces text that was fine with text
 * nobody has seen -- and it makes the fix unverifiable, because the input moved
 * at the same time as the checker. `--regate` runs the current gates over an
 * existing draft and promotes it if it now passes. */

const broken = controls();
if (broken.length) { console.error("FIXTURE FAILURES: " + broken.join("; ")); process.exit(2); }

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY, AKEY = process.env.ANTHROPIC_API_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
if (!AKEY) { console.error("ANTHROPIC_API_KEY is not set; cannot generate"); process.exit(2); }
const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };
const MODEL = "claude-sonnet-4-6";

const SOURCES = ["apply-rewrites-batch-1.mjs", "apply-0306.mjs", "apply-audit-sentence-rewrite.mjs",
                 "fix-broken-attribution-chain.mjs"];
const EXCLUDE = new Set(["05-01-aims-monitoring-and-measurement"]);
const LANGS = ["es-419", "pt-BR"];
/* ACCENTED, AND THAT IS NOT COSMETIC. The first version of this note was
 * written ASCII-only out of transport caution -- "ISO sections are a flat
 * `Secao`" -- and the model COPIED THE UNACCENTED SPELLING into its output.
 * `Secao`, `disponivel` and `extensao` all reached a generated block from this
 * string. A prompt that models the spelling it wants is the prompt; writing it
 * unaccented asks for unaccented text.
 *
 * Safe here because this file reaches disk through the file tool, never a
 * shell. The ASCII rule is about the SQL editor and heredocs, not about
 * source. */
const REGISTER_NOTE = {
  "es-419": "Latin American Spanish (es-419). ISO sub-items are `apartado`. `idoneidad` for appropriateness. `eficacia` for effectiveness, never `efectividad`. `extensión` for extent, never `alcance` (that is scope). `disponible` for available, never `conservarse` (that is retained).",
  "pt-BR": "Brazilian Portuguese (pt-BR). ISO sections are a flat `Seção` -- with the cedilla and the tilde. `adequação` for appropriateness. `eficácia` for effectiveness. `extensão` for extent, never `escopo`. `disponível` for available, never `retida`. Every accent matters: reproduce them.",
};

/* A MODEL REFUSAL IS NOT A TRANSLATION, and nothing was looking for one. One
 * block came back "I need the actual English block content to translate. You've
 * only provided the heading..." and reached the gates, where it failed for an
 * unrelated reason -- a sentence-count mismatch. Luck is not a check. */
const META_RESPONSE = /\b(I need the actual|I(?:'m| am) (?:unable|sorry)|you(?:'ve| have) only provided|please (?:share|provide)|as an AI|I cannot translate|could you (?:share|provide))\b/i;

async function rest(path) {
  let last;
  for (let k = 0; k < 6; k++) {
    try {
      const r = await fetch(BASE + "/" + path, { headers: H, signal: AbortSignal.timeout(45000) });
      if (r.ok) return JSON.parse(await r.text());
      last = new Error("HTTP " + r.status);
    } catch (e) { last = e; }
    await new Promise((s) => setTimeout(s, 300 * (k + 1)));
  }
  throw last;
}

/** Extract the `to:` anchors per slug from a batch script. Source parsing, so
 *  it asserts it found something: a regex that matches nothing turns the whole
 *  run green, which is this repository's most-repeated instrument defect. */
function anchorsFrom(file) {
  const src = readFileSync(join(HERE, file), "utf8");
  const out = [];
  let slug = null;
  /* TWO DECLARATION SHAPES, and the first version knew only one.
   *   apply-0306 and friends:      slug: "01-03-..."
   *   apply-rewrites-batch-1:      const LESSONS = { "01-03-...": [ ... ] }
   * Knowing only the first extracted 5 anchors where there are many, and the
   * non-empty assertion PASSED -- an extractor that matches something but not
   * everything is worse than one that matches nothing, because the guard that
   * would have caught it is satisfied. */
  for (const m of src.matchAll(
    /slug:\s*"([^"]+)"|^\s*"([a-z0-9][a-z0-9-]{6,})":\s*\[|to:\s*"((?:[^"\\]|\\.)*)"/gm)) {
    if (m[1] !== undefined) { slug = m[1]; continue; }
    if (m[2] !== undefined) { slug = m[2]; continue; }
    if (!slug || m[3] === undefined) continue;
    const text = m[3].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    if (text.length >= 40) out.push({ slug, text });
  }
  /* COMPLETENESS, not just non-emptiness. Every `to:` long enough to be an
   * anchor must have been attributed to a slug. A shortfall means a third
   * declaration shape exists and this file is only partly read. */
  const declared = [...src.matchAll(/to:\s*"((?:[^"\\]|\\.)*)"/g)]
    .filter((m) => m[1].replace(/\\"/g, '"').length >= 40).length;
  if (out.length !== declared) {
    throw new Error(file + ": extracted " + out.length + " anchor(s) from " + declared +
      " declared -- a declaration shape this parser does not know");
  }
  return out;
}

const blocks = (md) => md.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);

async function translate(englishBlock, language, note) {
  const system = [
    "You translate curriculum for an ISO/IEC 17024 certification body.",
    "Translate the ENGLISH block into " + REGISTER_NOTE[language],
    "",
    "MODALS ARE PINNED. English SHOULD becoming translated MUST is the most",
    "common defect in this corpus:",
    "    shall  -> es `debe`     / pt `deve`",
    "    should -> es `deberia`  / pt `convem que` AS A CLAUSE-OPENING",
    "              CONSTRUCTION (`Convem que [subject] [subjunctive]`), never",
    "              dropped into the verb slot. `deveria` is fine in our own prose.",
    "    may/can -> es `puede`   / pt `pode`",
    "",
    "DEFINED TERMS DO NOT CROSS:",
    "    available != retained; extent != scope; effectiveness = eficacia.",
    "",
    "Preserve markdown exactly: blockquote markers, ** emphasis, list letters,",
    "{glossary=...} annotations, and any :: directive. Add nothing. Do not",
    "lengthen a quotation.",
    "",
    "Return ONLY the translated block.",
  ].join("\n");
  let last;
  for (let k = 0; k < 4; k++) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": AKEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: 3000, system,
          messages: [{ role: "user", content: (note ? note + "\n\n" : "") + englishBlock }] }),
        signal: AbortSignal.timeout(120000),
      });
      const j = await r.json();
      if (!r.ok) throw new Error("anthropic HTTP " + r.status);
      const t = (j.content || []).filter((c) => c.type === "text").map((c) => c.text).join("").trim();
      if (!t) throw new Error("empty completion");
      return t;
    } catch (e) { last = e; }
    await new Promise((s) => setTimeout(s, 800 * (k + 1)));
  }
  throw last;
}

/* ---------------------------------------------------------------- build */
let batch;
if (REGATE) {
  batch = JSON.parse(readFileSync(REGATE, "utf8"));
  for (const r of batch.rows) delete r.gate_problems;
  console.log("");
  console.log("RE-GATING " + REGATE + " -- " + batch.rows.length + " block(s), nothing regenerated");
}

const anchors = REGATE ? [] : SOURCES.flatMap((f) => (existsSync(join(HERE, f)) ? anchorsFrom(f) : []));
if (!REGATE && !anchors.length) { console.error("extracted ZERO anchors -- the parser matched nothing, which is not a result"); process.exit(2); }
const bySlug = new Map();
for (const a of anchors) {
  if (EXCLUDE.has(a.slug)) continue;
  if (!bySlug.has(a.slug)) bySlug.set(a.slug, []);
  bySlug.get(a.slug).push(a.text);
}
console.log("");
console.log("ANCHORS: " + anchors.length + " declared across " + SOURCES.length + " script(s), " +
  bySlug.size + " slug(s) after excluding " + [...EXCLUDE].join(", "));

if (!REGATE) batch = { generator: "emit-batch1-retranslation.mjs", model: MODEL, kind: "lesson_span",
                      register: REGISTER_NOTE, rows: [] };
const problems = [];
for (const [slug, texts] of (REGATE ? [] : bySlug)) {
  const rows = await rest("lessons?select=id,slug,language,content_md,lesson_group_id&slug=eq." + slug);
  const en = rows.find((r) => r.language === "en");
  if (!en) { problems.push(slug + ": no English row"); continue; }
  const eb = blocks(en.content_md);
  /* Which blocks carry a declared edit. Each anchor must resolve to exactly one. */
  const idx = new Set();
  for (const t of texts) {
    const hits = eb.map((b, k) => (b.includes(t) ? k : -1)).filter((k) => k >= 0);
    if (hits.length !== 1) { problems.push(slug + ": anchor resolves to " + hits.length + " block(s): " + t.slice(0, 50)); continue; }
    idx.add(hits[0]);
  }
  if (!idx.size) continue;
  for (const lang of LANGS) {
    const tr = rows.find((r) => r.language === lang);
    if (!tr) { problems.push(slug + "/" + lang + ": missing"); continue; }
    const tb = blocks(tr.content_md);
    if (tb.length !== eb.length) {
      problems.push(slug + "/" + lang + ": " + eb.length + " English blocks vs " + tb.length +
        " -- cannot locate by coordinate, REGENERATE this one whole");
      continue;
    }
    for (const k of [...idx].sort((a, b) => a - b)) {
      const out = await translate(eb[k], lang,
        "This English block was REWRITTEN after the existing translation was made. " +
        "The translation still renders the older English.");
      batch.rows.push({ kind: "lesson_span", slug, language: lang, lesson_id: tr.id,
        from_block: tb[k], to_block: out, add_paragraph: "",
        english_source: eb[k], en_block_words: 0, block_index: k });
    }
  }
}

/* ---------------------------------------------------------------- gates */
const vocab = { "es-419": new Map(), "pt-BR": new Map() };
{
  const all = await rest("lessons?select=language,content_md&language=neq.en&limit=1000");
  for (const l of all) {
    for (const tok of (l.content_md || "").toLowerCase().match(/[\p{L}]{3,}/gu) || []) {
      if (!/[À-ɏ]/.test(tok)) continue;
      const plain = tok.normalize("NFD").replace(/[̀-ͯ]/g, "");
      if (plain !== tok && vocab[l.language]) vocab[l.language].set(plain, tok);
    }
  }
}
const certRegister = { "AIMS-F": "usted", "AIMS-IA": "usted" };
let failed = 0;
console.log("");
console.log("GATES -- " + batch.rows.length + " block(s)");
for (const r of batch.rows) {
  const p = [];
  if (META_RESPONSE.test(r.to_block)) p.push("MODEL REFUSAL, not a translation: " + r.to_block.slice(0, 60));
  if (!looksLikeLanguage(r.to_block, r.language)) p.push("language guard");
  const m = checkModalSentences(r.english_source, r.to_block, r.language, { guidance: true });
  const d = checkDefinedTerms(r.english_source, r.to_block, r.language);
  if (m.unalignable) p.push("sentence counts differ; A and B did not run on this block");
  for (const f of [...m.flags, ...d.flags,
                   ...checkRegister(r.to_block, r.language, certRegister[r.slug.startsWith("aims-ia") ? "AIMS-IA" : "AIMS-F"]).flags])
    p.push(f.check + ": " + f.detail.slice(0, 70));
  /* D IS REPORTED, NOT GATED. 574 corpus-wide is a consistency measure, and a
   * mechanical clausula -> apartado would also hit the places where clausula is
   * correct. Recorded on the row so it travels with the spec; it does not
   * refuse a block. */
  r.clause_vocab = checkClauseVocab(r.to_block, r.language).flags.map((f) => f.detail);
  for (const tok of r.to_block.toLowerCase().match(/[\p{L}]{3,}/gu) || []) {
    if (/[À-ɏ]/.test(tok)) continue;
    const a = vocab[r.language].get(tok);
    if (a && !bothFormsCorrect(tok, a) && !isCarriedEnglish(tok, r.english_source)) p.push("accent: " + tok);
  }
  r.gate_problems = [...new Set(p)];
  if (r.gate_problems.length) failed++;
  console.log("  " + (r.gate_problems.length ? "FAIL " : "ok   ") +
    r.slug.padEnd(40) + r.language + "  block " + r.block_index);
  for (const x of r.gate_problems) console.log("        " + x);
}

if (problems.length) {
  console.log("");
  console.log("NOT EMITTED (" + problems.length + "):");
  for (const x of problems) console.log("  " + x);
}
if (failed) {
  writeFileSync((OUT || REGATE).replace(/\.rejected\.json$|\.json$/, "") + ".rejected.json", JSON.stringify(batch, null, 2), "utf8");
  console.log("");
  console.log("ABORT: " + failed + " block(s) failed a gate. Rejected draft written so they can be READ.");
  process.exitCode = 1;
} else {
  writeFileSync(OUT || REGATE.replace(/\.rejected\.json$/, ".json"), JSON.stringify(batch, null, 2), "utf8");
  console.log("");
  console.log("EMITTED " + (OUT || REGATE.replace(/\.rejected\.json$/, ".json")) + " -- " + batch.rows.length + " block(s) across " +
    new Set(batch.rows.map((r) => r.slug)).size + " lesson(s). Nothing written to the database.");
}
