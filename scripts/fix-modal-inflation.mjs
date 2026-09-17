#!/usr/bin/env node
/**
 * fix-modal-inflation.mjs - re-render paragraphs where English SHOULD became
 * translated MUST.
 *
 * WRITES a spec for apply-marking-spec.mjs. `--apply` writes it; dry otherwise.
 * Unknown flags exit 2. Takes the findings file from sweep-modal-inflation.mjs.
 *
 * ============ WHY NOT A SUBSTITUTION ============
 *
 * `debe` -> `deberia` looks like a one-line fix and is wrong. A paragraph
 * routinely carries BOTH modals -- a clause that shall be done and guidance
 * that should be followed -- and a blind swap flattens the distinction in the
 * other direction, which is the same defect wearing the opposite sign.
 *
 * So each paragraph is re-rendered from its English with the convention stated,
 * and `noModalInflation` gates the result. The guard is what decides, not the
 * prompt.
 *
 * ============ THE CONVENTION, AND THE EVIDENCE IT WAS NEVER APPLIED =========
 *
 * ABNT renders `should` as "convem que"; Spanish practice uses "deberia" or
 * "conviene". Counted across all four ISO-derived corpora before any fix:
 *
 *     convem            0 occurrences, all four Portuguese corpora
 *     conviene          1 to 4 per corpus
 *     deve / devem      132 to 379 per corpus
 *
 * A word that appears zero times across thousands of paragraphs was never a
 * choice anyone made. The absence is the finding.
 *
 * ============ IT IS SUBSTANTIVE, NOT STYLISTIC ============
 *
 * AIMS-F teaches the shall/should distinction outright -- lesson 02-06's
 * Spanish reads "lo importante es que se trata de un debera". A certification
 * that explains the difference in English and collapses it in translation is
 * telling a Spanish-reading auditor the opposite of what it charges them to
 * know.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { blocks, solid } from "./lib/guide-runs.mjs";
import { looksLikeLanguage, checkFaithful as langControl } from "./lib/language-guard.mjs";
import { noModalInflation, preservesObligationAcross, checkFaithful as obControl } from "./lib/obligation-guard.mjs";

const KNOWN = new Set(["--from", "--out", "--cert", "--lang", "--limit", "--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". Known: " + [...KNOWN].join(", "));
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const FROM = arg("from", "");
const OUT = arg("out", "modal-fix-spec.json");
const ONLY_CERT = arg("cert", "");
const ONLY_LANG = arg("lang", "");
const LIMIT = Number(arg("limit", "0"));
const VERBOSE = process.argv.includes("--verbose");
if (!FROM || !existsSync(FROM)) { console.error("--from <sweep findings json> is required"); process.exit(2); }

const HERE = dirname(fileURLToPath(import.meta.url));
for (const p of [join(HERE, ".env"), join(HERE, "..", ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY, AKEY = process.env.ANTHROPIC_API_KEY;
if (!KEY || !AKEY) { console.error("SUPABASE_SERVICE_ROLE_KEY and ANTHROPIC_API_KEY are required"); process.exit(2); }
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

const NAME = { "es-419": "Latin American Spanish", "pt-BR": "Brazilian Portuguese" };
const HOUSE = {
  "es-419": "Use `apartado` for an ISO clause, not `clausula` -- the corpus uses apartado 284 times and clausula 22. " +
            "Use `seguridad` for security and for safety in the security sense; do NOT use `inocuidad`.",
  "pt-BR":  "Use `secao` for an ISO clause, not `clausula` -- the corpus uses secao 480 times and clausula 21.",
};
const MODALRULE = {
  "es-419": "English SHALL or MUST  -> debe / deben (or deberá).\n" +
            "English SHOULD         -> deberia / deberian, or conviene. NEVER debe.\n" +
            "English MAY or CAN     -> puede / pueden.",
  "pt-BR":  "English SHALL or MUST  -> deve / devem (or devera).\n" +
            "English SHOULD         -> convem que + subjunctive, or deveria. NEVER deve.\n" +
            "English MAY or CAN     -> pode / podem.",
};

async function retranslate(english, current, lang) {
  const system =
    "You translate one paragraph of certification courseware into " + NAME[lang] + ".\n\n" +
    "THE PARAGRAPH IS BEING RE-RENDERED FOR ONE REASON: its existing translation states a " +
    "REQUIREMENT where the English states only a RECOMMENDATION. Fix that, and change nothing " +
    "else that does not have to change.\n\n" +
    "MODAL RENDERING -- this is the point of the task:\n" + MODALRULE[lang] + "\n\n" +
    "A paragraph may carry BOTH a shall and a should. Render each one according to what the " +
    "ENGLISH says at that point. Do not flatten them together in either direction.\n\n" +
    "ALSO:\n" +
    "- Reproduce every markdown marker exactly: **bold**, *italic*, and glossary annotations " +
    "of the form [visible text]{glossary=\"key\"}. Translate the visible text; NEVER the key.\n" +
    "- " + HOUSE[lang] + "\n" +
    "- Keep in English the product nouns the existing translation keeps in English (Sprint, " +
    "Product Backlog, Scrum Team, Definition of Done, Statement of Applicability, Annex A).\n" +
    "- Do not add, remove or reorder content.\n\n" +
    "Reply with the translated paragraph and nothing else.";
  const user = "ENGLISH PARAGRAPH (the source):\n" + english +
    "\n\nCURRENT TRANSLATION (correct except for its modals and the house terms above):\n" + current;
  let last;
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": AKEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 2000, system, messages: [{ role: "user", content: user }] }),
        signal: AbortSignal.timeout(120000),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 180));
      const t = (j.content || []).map((c) => c.text || "").join("").trim();
      if (!t) throw new Error("empty completion");
      return t;
    } catch (e) { last = e; }
  }
  throw new Error("retranslate failed: " + last?.message);
}

const lb = langControl(), ob = obControl();
if (lb.length || ob.length) {
  console.error("A GUARD FAILED ITS CONTROL; fixing nothing.");
  for (const x of [...lb, ...ob]) console.error("  X " + x);
  process.exit(1);
}

const all = JSON.parse(readFileSync(FROM, "utf8")).findings;
let todo = all.filter((f) => (!ONLY_CERT || f.cert === ONLY_CERT) && (!ONLY_LANG || f.language === ONLY_LANG));
if (LIMIT) todo = todo.slice(0, LIMIT);
console.log("");
console.log("controls: language 4/4, obligation clean");
console.log("paragraphs to re-render: " + todo.length + " of " + all.length);
console.log("");

const glossKeys = (t) => [...String(t).matchAll(/glossary="([^"]+)"/g)].map((m) => m[1]).sort().join(",");
const boldCount = (t) => (String(t).match(/\*\*/g) || []).length;

const lessons = {};
for (const f of todo) {
  if (lessons[f.lesson_id]) continue;
  lessons[f.lesson_id] = (await g("lessons?select=id,content_md&id=eq." + f.lesson_id))[0];
}
function lineAbs(md, bi, li) {
  const bs = blocks(md);
  if (!bs[bi]) return null;
  const sol = solid(bs[bi]);
  return sol[li] ?? null;
}

const entries = [], problems = [];
let n = 0;
for (const f of todo) {
  n++;
  const row = lessons[f.lesson_id];
  const cell = lineAbs(row.content_md, f.block, f.line);
  if (!cell) { problems.push(f.slug + "/" + f.language + ": line moved"); continue; }

  let after;
  try { after = await retranslate(f.english, cell.text.trim(), f.language); }
  catch (e) { problems.push(f.slug + "/" + f.language + ": " + e.message); continue; }

  /* THE GUARD DECIDES, NOT THE PROMPT. */
  const inf = noModalInflation(f.english, after, f.language);
  if (!inf.ok) { problems.push(f.slug + "/" + f.language + " b" + f.block + "l" + f.line + ": STILL INFLATED"); continue; }
  const og = preservesObligationAcross(f.english, "en", after, f.language);
  if (!og.ok) { problems.push(f.slug + "/" + f.language + ": OBLIGATION -- " + og.reason); continue; }
  const lg = looksLikeLanguage(after, f.language);
  if (!lg.ok) { problems.push(f.slug + "/" + f.language + ": LANGUAGE " + lg.want + "/" + lg.avoid); continue; }
  if (glossKeys(cell.text) !== glossKeys(after)) { problems.push(f.slug + "/" + f.language + ": glossary keys changed"); continue; }
  if (boldCount(cell.text) !== boldCount(after)) { problems.push(f.slug + "/" + f.language + ": bold markers changed"); continue; }
  if (after.trim() === cell.text.trim()) { problems.push(f.slug + "/" + f.language + ": unchanged"); continue; }

  entries.push({
    cert: f.cert, slug: f.slug, block: "-", block_index: f.block, line_index: f.line,
    run_words: 0, run: "modal inflation", needs_authoring: false, needs_bilingual_read: true,
    languages: { [f.language]: { lesson_id: f.lesson_id, line_abs: cell.abs, before: cell.text, after } },
  });
  if (n % 10 === 0 || VERBOSE) {
    console.log("  " + String(n).padStart(3) + "/" + todo.length + "  " + f.language + "  " +
      f.slug.slice(0, 40).padEnd(40) + "  en weak " + inf.english.weak + " -> tgt strong " + inf.target.strong);
  }
  if (VERBOSE) {
    console.log("      -  " + cell.text.trim().slice(0, 140));
    console.log("      +  " + after.trim().slice(0, 140));
  }
}

console.log("");
console.log("re-rendered " + entries.length + " of " + todo.length + "   problems " + problems.length);
for (const p of problems.slice(0, 20)) console.log("  X " + p);
if (problems.length > 20) console.log("  ... and " + (problems.length - 20) + " more");

if (entries.length) {
  writeFileSync(OUT, JSON.stringify({ generated: "fix-modal-inflation.mjs", entries, blocked: [] }, null, 1) + "\n");
  console.log("");
  console.log("spec -> " + OUT);
} else { process.exitCode = 1; }
