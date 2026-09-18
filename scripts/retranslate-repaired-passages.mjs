#!/usr/bin/env node
/**
 * retranslate-repaired-passages.mjs - re-translate the paragraphs whose English
 * was repaired, from the repaired English.
 *
 * WRITES a spec; `--apply` hands it to apply-marking-spec.mjs. Dry by default.
 * Unknown flags exit 2.
 *
 * ============ WHY THIS IS NOT A REVIEW JOB ============
 *
 * The bilingual queue asked a reader to check whether each translation
 * reproduced a sentence of ISO's Spanish edition. That was the wrong question.
 *
 * These translations were made BEFORE the English was repaired, so they track
 * the PRE-repair English -- which was ISO's sentence. They do not need
 * checking. They need replacing.
 *
 * THE PROOF IS A LIST REORDER. `01-02-determining-your-roles` was repaired by
 * resequencing "the organization, its partners, suppliers, customers and third
 * parties" into our own order. The Spanish still reads "sus socios, proveedores,
 * clientes y terceros" -- ISO's order, untouched. If the repair WAS the
 * ordering, then an unchanged ordering is an unchanged run. Three more
 * confirmed the same: "otras normas internacionales" where the repair dropped
 * "International"; "generar evidencia de su responsabilidad y rendicion de
 * cuentas" verbatim in two lessons; and the harmonised-structure enumeration
 * intact.
 *
 * ============ AND THE ORDERING IS WHAT MAKES IT SAFE ============
 *
 * Translating from the REPAIRED English cannot carry ISO's sentence, because
 * the source no longer has it. The K/S/A pass proved this the same day: its
 * Spanish came back carrying our recasts -- "de modo que el mismo fallo no se
 * repita" rather than ISO's phrasing -- because that is what it was given.
 *
 * Doing this a week ago would have rendered ISO's sentences into Spanish and
 * put them where no instrument here can see them.
 *
 * ============ PASSAGES, NOT LESSONS ============
 *
 * 102 distinct paragraphs, not 32 lessons. The other 95% of each lesson is good
 * Spanish translated from English that never changed, and re-translating it
 * would throw that away to fix a paragraph. Each repaired paragraph is replaced
 * positionally, by block and line, which is the alignment
 * apply-marking-spec.mjs already writes across three languages.
 *
 * ============ THE EXISTING TRANSLATION IS SENT AS CONTEXT, NEVER AS SOURCE ===
 *
 * It carries the established register and the terminology decisions -- which
 * nouns stay in English, how a glossary annotation reads, whether the register
 * is formal. The model is told to translate the ENGLISH and to match that
 * register; it is told explicitly not to copy the old translation, because the
 * old translation is what is being replaced.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { reviewBlocks as blocks, solid } from "./lib/guide-runs.mjs";
import { looksLikeLanguage, checkFaithful as langControl } from "./lib/language-guard.mjs";
import { preservesObligationAcross, checkFaithful as obControl } from "./lib/obligation-guard.mjs";

const KNOWN = new Set(["--apply", "--out", "--lang", "--limit", "--verbose", "--slug", "--only"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ".");
    console.error("--apply family: dry by default. Known: " + [...KNOWN].join(", "));
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const APPLY = process.argv.includes("--apply");
const VERBOSE = process.argv.includes("--verbose");
const OUT = arg("out", "retranslate-spec.json");
const ONLY_LANG = arg("lang", "");
const LIMIT = Number(arg("limit", "0"));
/* --slug scopes a run to one batch, so a batch's Spanish lands with its English
 * instead of accumulating into a queue that grows faster than it is read. */
const ONLY_SLUGS = (arg("slug", "") || "").split(",").filter(Boolean);
/* --only <queue.json> restricts the run to the exact paragraphs that file names,
 * by (slug, language, ENGLISH TEXT). Scoping by slug alone would re-translate
 * every repaired paragraph in those lessons -- including ones a human has
 * already hand-corrected, replacing settled wording with a fresh completion.
 * That is not a hypothetical: 15 paragraphs were hand-edited on 2026-09-17 and
 * sit inside the same lessons as the paragraphs that still need work. */
const ONLY_FILE = arg("only", "");
const onlyKeys = new Set();
if (ONLY_FILE) {
  if (!existsSync(ONLY_FILE)) { console.error(ONLY_FILE + " not found"); process.exit(2); }
  for (const it of JSON.parse(readFileSync(ONLY_FILE, "utf8")).items ?? []) {
    onlyKeys.add(it.slug + "|" + it.language + "|" + String(it.english_now || "").trim());
  }
  if (onlyKeys.size === 0) { console.error(ONLY_FILE + " names no paragraphs"); process.exit(2); }
}

const HERE = dirname(fileURLToPath(import.meta.url));
for (const p of [join(HERE, ".env"), join(HERE, "..", ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AKEY = process.env.ANTHROPIC_API_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
if (!AKEY) { console.error("ANTHROPIC_API_KEY is not set"); process.exit(2); }
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

const MODEL = "claude-sonnet-4-6";
async function translate(english, current, langName) {
  const system =
    "You translate one paragraph of certification courseware into " + langName + ".\n\n" +
    "RULES, in order of importance:\n" +
    "1. Translate the ENGLISH PARAGRAPH. An existing translation is supplied only so you " +
    "match its register and its terminology decisions. It is being REPLACED because it " +
    "renders an older English text. Do not copy it where the English has changed.\n" +
    "2. Reproduce every markdown marker exactly. A line beginning with `> ` is a " +
    "BLOCKQUOTE and your line must begin with `> ` too -- dropping it turns a quotation " +
    "into ordinary prose. Also list markers, **bold**, *italic*, and glossary " +
    "annotations of the form [visible text]{glossary=\"key\"}. Translate the visible text " +
    "inside the brackets; NEVER translate or alter the key.\n" +
    "2b. IF THE ENGLISH NAMES A STANDARD OR A CLAUSE -- ISO/IEC 27001:2022, clause 9.2.2, " +
    "Annex A -- THE SAME DESIGNATION MUST APPEAR IN YOURS. Render the noun (clause / " +
    "clausula / secao) however the register requires, but never drop the number or the " +
    "standard: it is what attributes the quotation.\n" +
    "3. FOLLOW THE EXISTING TRANSLATION'S TERMINOLOGY IN BOTH DIRECTIONS. Keep in English " +
    "whatever it keeps in English (Sprint, Product Backlog, Scrum Team, Definition of Done, " +
    "Statement of Applicability). And keep TRANSLATED whatever it translates: if it writes " +
    "Anexo A, write Anexo A and not Annex A; if it writes clausula, do not write clause; if " +
    "it writes norma, do not write standard.\n" +
    "4. Preserve modal force exactly, and RENDER EACH MODAL THE WAY THE STANDARD IS " +
    "RENDERED IN THAT LANGUAGE:\n" +
    "     English SHALL or MUST -> es: debe / deben / debera.   pt: deve / devem / devera.\n" +
    "     English SHOULD        -> es: conviene que + subjunctive, or deberia.\n" +
    "                              pt: CONVEM QUE + subjunctive, or deveria. NEVER deve.\n" +
    "     English MAY or CAN    -> es: puede / pueden.          pt: pode / podem.\n" +
    "   `convem que` is the ABNT rendering of `should` and is PREFERRED over `deveria` " +
    "in Brazilian Portuguese. A paragraph may carry both a shall and a should; render each " +
    "one according to what the English says at that point and do not flatten them together " +
    "in either direction. Never add an obligation the English does not state, and never " +
    "soften one it does.\n" +
    "5. Do not add, remove or reorder content. One paragraph in, one paragraph out.\n\n" +
    "Reply with the translated paragraph and nothing else. No preamble, no quotes around it.";
  const user =
    "ENGLISH PARAGRAPH (this is the source):\n" + english +
    "\n\nEXISTING TRANSLATION (register and terminology reference only; it is out of date):\n" +
    (current || "(none)");
  let last;
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": AKEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: 2000, system, messages: [{ role: "user", content: user }] }),
        signal: AbortSignal.timeout(120000),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 200));
      const text = (j.content || []).map((c) => c.text || "").join("").trim();
      if (!text) throw new Error("empty completion");
      return text;
    } catch (e) { last = e; }
  }
  throw new Error("translate failed: " + last?.message);
}

/* --------------------------------------------- the distinct repaired spans */
const BATCHES = [
  "./lesson-repairs-aimsf.mjs", "./lesson-repairs-aimsf-b2.mjs",
  "./lesson-repairs-aimsf-m1.mjs", "./lesson-repairs-aimsf-m2.mjs",
  "./lesson-repairs-aimsf-m3.mjs", "./lesson-repairs-aimsf-m4.mjs",
  "./lesson-repairs-aimsf-m5.mjs",
  "./lesson-repairs-aimsia-m1.mjs", "./lesson-repairs-aimsia-m2.mjs",
  "./lesson-repairs-aimsia-m3.mjs", "./lesson-repairs-aimsia-m4a.mjs", "./lesson-repairs-aimsia-m4a-fix.mjs",
  "./lesson-repairs-aimsia-m4b.mjs", "./lesson-repairs-aimsia-m4c.mjs",
  "./lesson-repairs-aimsia-m5.mjs",
  /* ISMS-IA, 2026-09-17 evening. These batches carry TWO kinds of entry:
   * prose recasts, which the translations must follow, and ATTRIBUTION edits to
   * a lead-in. An attribution edit changes a lead-in and nothing else, so its
   * translation is an ordinary sentence -- there is no ISO text in it to get
   * wrong, and the paragraph still needs re-rendering because its English
   * moved. */
  "./lesson-repairs-ismsia-m1.mjs", "./lesson-repairs-ismsia-m2.mjs",
  "./lesson-repairs-ismsia-m3.mjs", "./lesson-repairs-ismsia-m4a.mjs",
  "./lesson-repairs-ismsia-m4b.mjs", "./lesson-repairs-ismsia-m4c.mjs",
  "./lesson-repairs-ismsia-m5.mjs",
];
const spansBySlug = new Map();
for (const b of BATCHES) {
  const { REPAIRS } = await import(new URL(b, "file:///" + HERE.replace(/\\/g, "/") + "/").href);
  for (const r of REPAIRS) {
    const list = spansBySlug.get(r.slug) ?? [];
    for (const sp of [r.en, ...(r.also ?? [])]) list.push({ after: sp.after, address: r.address });
    spansBySlug.set(r.slug, list);
  }
}
spansBySlug.set("02-09-pdca-and-improvement", [{ after: "Clause 10.1 requires the ISMS itself to be improved on three counts: how well it fits the organisation, whether it is sufficient, and whether it works.", address: "27001 clause 10.1" }]);
spansBySlug.set("05-02-internal-audit", [{ after: "The standard requires audits to be run so the process stays [objective and impartial]{glossary=\"auditor-objectivity\"} (clause 9.2.2 b).", address: "27001 clause 9.2.2 b" }]);
spansBySlug.set("02-03-amendment-1-2024", [{ after: "it added a requirement to decide whether climate change is relevant to the organisation.", address: "27001 Amd.1:2024 to clause 4.1" }]);

/* ------------------------------------------------------------ the targets */
const flagged = await g("lessons?select=id,slug,language,lesson_group_id,content_md&mcp_translation_review_required=is.true");
const groupIds = [...new Set(flagged.map((r) => r.lesson_group_id))].filter(Boolean);
const ens = {};
for (const gid of groupIds) {
  const r = await g("lessons?select=id,slug,content_md,lesson_group_id&language=eq.en&lesson_group_id=eq." + gid);
  if (r[0]) ens[gid] = r[0];
}

function coordOf(md, needle) {
  const bs = blocks(md);
  for (let bi = 0; bi < bs.length; bi++) {
    const sol = solid(bs[bi]);
    for (let li = 0; li < sol.length; li++) if (sol[li].text.includes(needle)) return { bi, li, text: sol[li].text, abs: sol[li].abs };
  }
  return null;
}
function cellAt(md, bi, li) {
  const bs = blocks(md);
  if (!bs[bi]) return null;
  const sol = solid(bs[bi]);
  return sol[li] ?? null;
}
const glossKeys = (t) => [...String(t).matchAll(/glossary="([^"]+)"/g)].map((m) => m[1]).sort().join(",");

/* TERMINOLOGY REGRESSION. The first probe turned "Anexo A" back into "Annex A":
 * the prompt says to keep in English whatever the existing translation keeps in
 * English, and the model over-applied it to a term the existing translation had
 * LOCALISED. A reverted term is not a leak and not an obligation change, so no
 * other guard sees it -- it just makes the Spanish read as half-translated.
 *
 * Checked for the handful of terms this corpus actually localises. Anything the
 * old translation rendered in the target language must still be rendered. */
const LOCALISED = {
  "es-419": [["Anexo", "Annex"], ["cláusula", "clause"], ["norma", "standard"]],
  "pt-BR":  [["Anexo", "Annex"], ["cláusula", "clause"], ["norma", "standard"]],
};
/* NO REGEX HERE, DELIBERATELY. The first version built one with `"\b" + term`,
 * and `"\b"` in a JavaScript string literal is a BACKSPACE CHARACTER, not a
 * word boundary -- the escape was eaten in transport. The pattern became
 * /<backspace>Anexo<backspace>/ and matched nothing, so the guard could not
 * fire, and it passed the exact two rows it had been written to refuse.
 *
 * A guard that cannot fire is indistinguishable from one that ran clean, which
 * is the failure this repository records more than any other. Plain lowercase
 * containment needs no escapes and cannot be silently disarmed by a transport
 * that eats backslashes. */
function terminologyHeld(oldT, newT, lang) {
  const lost = [];
  const o = String(oldT).toLowerCase(), n = String(newT).toLowerCase();
  for (const [local, english] of LOCALISED[lang] ?? []) {
    const l = local.toLowerCase(), e = english.toLowerCase();
    if (o.includes(l) && !n.includes(l) && n.includes(e)) lost.push(local + " -> " + english);
  }
  return lost;
}
const boldCount = (t) => (String(t).match(/\*\*/g) || []).length;

/* ------------------------------------------------------------- controls */
const lb = langControl(), ob = obControl();
if (lb.length || ob.length) {
  console.error("A GUARD FAILED ITS OWN CONTROL; translating nothing.");
  for (const x of [...lb, ...ob]) console.error("  X " + x);
  process.exit(1);
}
console.log("");
console.log("controls: language guard 4/4, obligation guard 9/9");

/* --------------------------------------------------------------- the work */
const LANGS = ONLY_LANG ? [ONLY_LANG] : ["es-419", "pt-BR"];
const NAME = { "es-419": "Latin American Spanish", "pt-BR": "Brazilian Portuguese" };

/* DEDUPE. The queue emitted 111 passage entries for 102 distinct English lines
 * -- nine were the same line reached by two spans that landed on it. A count
 * that double-counts is a count nobody can act on. */
const jobs = [];
const seen = new Set();
/* A FILTER THAT SELECTS NOTHING MUST NOT READ AS "NOTHING TO DO". `--slug
 * aims-ia-02` matched no row under exact equality and the run reported
 * "translated 0 of 0   problems 0   nothing to write" -- the same output a
 * genuinely finished batch produces. Prefix match, and abort when a filter the
 * caller supplied hit no row at all. */
let slugFilterHit = false;
for (const row of flagged) {
  if (!LANGS.includes(row.language)) continue;
  const en = ens[row.lesson_group_id];
  if (!en) continue;
  if (ONLY_SLUGS.length && !ONLY_SLUGS.some((p) => row.slug === p || row.slug.startsWith(p))) continue;
  slugFilterHit = true;
  for (const sp of spansBySlug.get(row.slug) ?? []) {
    const at = coordOf(en.content_md, sp.after);
    if (!at) continue;
    const key = row.id + "|" + at.bi + "|" + at.li;
    if (seen.has(key)) continue;
    seen.add(key);
    if (onlyKeys.size &&
        !onlyKeys.has(row.slug + "|" + row.language + "|" + at.text.trim())) continue;
    const cell = cellAt(row.content_md, at.bi, at.li);
    if (!cell) continue;
    jobs.push({
      lesson_id: row.id, slug: row.slug, language: row.language, address: sp.address,
      bi: at.bi, li: at.li, line_abs: cell.abs,
      english: at.text, before: cell.text,
    });
  }
}
if (ONLY_SLUGS.length && !slugFilterHit) {
  console.error("--slug " + ONLY_SLUGS.join(",") + " matched no flagged lesson row. Nothing was attempted.");
  process.exit(2);
}
console.log("distinct paragraphs to re-translate: " + jobs.length +
  "   (" + LANGS.map((l) => l + " " + jobs.filter((j) => j.language === l).length).join(", ") + ")");
console.log("");

const todo = LIMIT ? jobs.slice(0, LIMIT) : jobs;
const entries = [], problems = [];
let n = 0;
for (const j of todo) {
  n++;
  let after;
  try { after = await translate(j.english.trim(), j.before.trim(), NAME[j.language]); }
  catch (e) { problems.push(j.slug + "/" + j.language + " b" + j.bi + "l" + j.li + ": " + e.message); continue; }

  const lg = looksLikeLanguage(after, j.language);
  if (!lg.ok) { problems.push(j.slug + "/" + j.language + ": LANGUAGE (want " + lg.want + ", avoid " + lg.avoid + ")"); continue; }
  /* ACROSS languages: the English is scored with the English vocabulary and the
   * translation with its own. Using one vocabulary for both reported an
   * inserted obligation on two of the first three faithful translations. */
  const og = preservesObligationAcross(j.english, "en", after, j.language);
  if (!og.ok) {
    problems.push([
      j.slug + "/" + j.language + ": OBLIGATION -- " + og.reason +
        " (en strong " + og.before.strong + " / tgt strong " + og.after.strong + ")",
      "        EN: " + j.english.trim().slice(0, 130),
      "        " + j.language + ": " + after.trim().slice(0, 130),
    ].join("\n"));
    continue;
  }
  if (glossKeys(j.english) !== glossKeys(after)) {
    problems.push(j.slug + "/" + j.language + ": glossary keys changed (" + glossKeys(j.english) + " -> " + glossKeys(after) + ")"); continue;
  }
  if (boldCount(j.english) !== boldCount(after)) {
    problems.push(j.slug + "/" + j.language + ": bold markers " + boldCount(j.english) + " -> " + boldCount(after)); continue;
  }
  /* ============ THE MARKER AND THE DESIGNATION, BOTH STRUCTURAL ============
   *
   * The prompt above now names the blockquote marker. THE PROMPT IS NOT THE
   * GUARD: eleven lines lost their `>` while the prompt listed three marker
   * kinds and omitted the fourth, the applier spliced them in as given, and a
   * quotation set off in English became ordinary prose in Spanish or
   * Portuguese. Nothing here noticed; a separate script found it later.
   *
   * Both checks compare the ENGLISH to the completion on a property that is
   * language-invariant -- markup, and a standard's designation -- so neither can
   * be wrong about a faithful translation. */
  if (/^\s*>/.test(j.english) && !/^\s*>/.test(after)) {
    problems.push(j.slug + "/" + j.language + ": LOST THE BLOCKQUOTE MARKER -- a quotation became prose"); continue;
  }
  const addrOf = (t) => {
    const out = new Set();
    for (const m of String(t).matchAll(/ISO(?:\/IEC)?\s*(\d{4,5})(?:\s*:\s*(\d{4}))?/gi)) {
      out.add("STD:" + m[1] + (m[2] ? ":" + m[2] : ""));
    }
    for (const m of String(t).matchAll(/\b(\d+(?:\.\d+)+)\b/g)) out.add("CL:" + m[1]);
    return out;
  };
  const haveAddr = addrOf(after);
  const missingAddr = [...addrOf(j.english)].filter((a) => !haveAddr.has(a));
  if (missingAddr.length) {
    problems.push(j.slug + "/" + j.language + ": DROPPED THE DESIGNATION " + missingAddr.join(", ") +
      " -- the English attributes this quotation and the translation would not"); continue;
  }
  const lost = terminologyHeld(j.before, after, j.language);
  if (lost.length) { problems.push(j.slug + "/" + j.language + ": TERMINOLOGY reverted to English -- " + lost.join(", ")); continue; }
  if (after.trim() === j.before.trim()) { problems.push(j.slug + "/" + j.language + ": unchanged from the old translation"); continue; }

  entries.push({
    cert: "-", slug: j.slug, block: "-", block_index: j.bi, line_index: j.li,
    run_words: 0, run: j.address, needs_authoring: false, needs_bilingual_read: true,
    languages: { [j.language]: { lesson_id: j.lesson_id, line_abs: j.line_abs, before: j.before, after } },
  });
  console.log("  " + String(n).padStart(3) + "/" + todo.length + "  " + j.language + "  " +
    j.slug.slice(0, 40).padEnd(40) + " b" + j.bi + "l" + j.li +
    "  lang " + lg.want + "/" + lg.avoid + "  oblig " + og.before.strong + "->" + og.after.strong +
    (og.inserted ? "  [READ: target carries a modal the English states without one]" : ""));
  if (VERBOSE) {
    console.log("      -  " + j.before.trim().slice(0, 150));
    console.log("      +  " + after.trim().slice(0, 150));
  }
}

console.log("");
console.log("translated " + entries.length + " of " + todo.length + "   problems " + problems.length);
for (const p of problems) console.log("  X " + p);

if (!entries.length) { console.log("nothing to write"); process.exitCode = 1; }
else {
  writeFileSync(OUT, JSON.stringify({ generated: "retranslate-repaired-passages.mjs", entries, blocked: [] }, null, 1) + "\n");
  console.log("");
  console.log("spec -> " + OUT);
  console.log(APPLY
    ? "run: node scripts/apply-marking-spec.mjs --from " + OUT + " --apply"
    : "DRY. Re-run with --apply to also write, or apply the spec by hand.");
  if (problems.length) process.exitCode = 1;
}
