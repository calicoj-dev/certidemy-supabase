#!/usr/bin/env node
/**
 * report-missing-accents.mjs -- words that appear in the served corpus BOTH
 * with and without their accent.
 *
 * READ-ONLY. Takes --out <path> and --json. Unknown flags exit 2. Reports.
 *
 * ============ WHY A WORD IN BOTH FORMS IS THE SIGNAL ============
 *
 * Making search accent-insensitive moved `gestion` from 5 rows to 37 -- and
 * moved the ACCENTED query from 33 to 37 as well. That second movement is the
 * finding: it means four rows of our own served Spanish carry `gestion`
 * without its accent.
 *
 * A word appearing ONLY unaccented proves nothing -- it may be a loanword, an
 * identifier, a code, an English term. A word appearing in BOTH forms in the
 * same corpus is the corpus disagreeing with itself, and one of the two is
 * wrong.
 *
 * ============ AND HALF OF THEM WILL BE LEGITIMATE ============
 *
 * A slug, a code span, a URL, an English phrase quoted inside Spanish -- none
 * of those is a misspelling. Only running prose is. So every occurrence is
 * CLASSIFIED and the classes are reported apart, rather than a single count
 * that would be mostly noise.
 *
 * ============ WHAT THIS CANNOT DO ============
 *
 * The stripping here is JS NFD normalisation, not `extensions.unaccent` --
 * PostgREST cannot reach the SQL dictionary from a script and 369 deliberately
 * revokes the wrapper from every role but the two that serve. For Latin
 * diacritics the two agree; this is a REPORT and nothing gates on it, which is
 * the only reason a second normaliser is acceptable here. A gate would have to
 * use the one implementation.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DIACRITIC_PAIRS, PART_OF_SPEECH_PAIRS, isVerbFormPair } from "./lib/accent-classes.mjs";

const KNOWN = new Set(["--out", "--json"]);
const argv = process.argv.slice(2);
let OUT = "MISSING-ACCENTS.md";
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) continue;
  if (!KNOWN.has(a)) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
  if (a === "--out") OUT = argv[++i];
}
const JSON_OUT = argv.includes("--json");
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
  if (out.length !== total) throw new Error("SHORT READ on " + path + ": " + out.length + " of " + total);
  return out;
}

const strip = (w) => w.normalize("NFD").replace(/[̀-ͯ]/g, "");
const hasAccent = (w) => w !== strip(w);

/* CONTROL. A stripper that does nothing turns the whole report empty, and an
 * empty report reads as a clean corpus. */
if (strip("gestión") !== "gestion" || strip("seção") !== "secao" || !hasAccent("á")) {
  console.error("CONTROL FAILED: the accent stripper does not strip.");
  process.exit(2);
}

/* ============ THE TRANSLATION STORE, NOT THE SERVED VIEW ============
 *
 * The first version read `mcp.task` and `mcp.concept` and got HTTP 404 --
 * PostgREST does not expose the `mcp` schema, which this session had already
 * measured two turns earlier and then used anyway.
 *
 * Reading the translation tables is the better source regardless. A misspelling
 * is a CONTENT defect: it is in the corpus whether or not a gate currently
 * withholds the row, and a row withheld today is a row that serves as soon as
 * somebody clears it. Scoping to the served view would report the defect
 * appearing and disappearing as review state changes.
 *
 * The cost of that choice, stated: this includes provisional and withheld rows,
 * so a count here is NOT a count of what a partner can read today. */
const LANGS = ["es-419", "pt-BR"];
const certs = await allRows("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const tasks = await allRows("tasks?select=id,code,certification_id");
const taskMeta = new Map(tasks.map((t) => [t.id, { code: t.code, cert: codeOf.get(t.certification_id) }]));
const concepts = await allRows("concepts?select=id,slug,certification_id,retired_at");
const conceptMeta = new Map(concepts.filter((c) => !c.retired_at)
  .map((c) => [c.id, { slug: c.slug, cert: codeOf.get(c.certification_id) }]));

const docs = [];
for (const t of await allRows("task_translations?select=task_id,language,statement,knowledge,skills,abilities")) {
  if (!LANGS.includes(t.language)) continue;
  const meta = taskMeta.get(t.task_id);
  if (!meta) continue;
  for (const [field, text] of Object.entries({ statement: t.statement, knowledge: t.knowledge, skills: t.skills, abilities: t.abilities })) {
    if (text) docs.push({ lang: t.language, kind: "task", cert: meta.cert, id: meta.code, field, text: String(text) });
  }
}
for (const c of await allRows("concept_translations?select=concept_id,language,name,description")) {
  if (!LANGS.includes(c.language)) continue;
  const meta = conceptMeta.get(c.concept_id);
  if (!meta) continue;
  for (const [field, text] of Object.entries({ name: c.name, description: c.description })) {
    if (text) docs.push({ lang: c.language, kind: "concept", cert: meta.cert, id: meta.slug, field, text: String(text) });
  }
}

/* ============ CLASSIFY THE OCCURRENCE, NOT THE WORD ============
 *
 * The same token is a defect in prose and correct inside a code span. So the
 * unit is the OCCURRENCE -- the same rule as the attributed-quotation
 * exemption, which attaches to an occurrence and never to a phrase. */
function classify(text, index, token) {
  const before = text.slice(Math.max(0, index - 120), index);
  const after = text.slice(index + token.length, index + token.length + 60);
  /* An odd number of backticks before it means we are inside a code span. */
  if ((before.match(/`/g) || []).length % 2 === 1) return "code span";
  if (/https?:\/\/\S*$/.test(before) || /^[^\s)]*\.(com|org|io|dev)\b/.test(after)) return "url";
  /* Slug-shaped: hyphen or underscore glued to the token on either side. */
  if (/[-_/]$/.test(before) || /^[-_/]/.test(after)) return "identifier";
  /* A quoted English phrase: the token sits inside quotes and the words around
   * it are English function words. Deliberately narrow -- over-claiming this
   * class would excuse real defects. */
  const quoted = (before.match(/"/g) || []).length % 2 === 1;
  if (quoted && /\b(the|of|and|to|for|with|management|system|information)\b\s*$/i.test(before)) {
    return "english quotation";
  }
  return "PROSE";
}

/* ============ PER LANGUAGE, AND TWO CLASSES ARE NOT MISSPELLINGS ==========
 *
 * The first run pooled es-419 and pt-BR and reported 5,569 prose cases. READING
 * THE TOP TWENTY KILLED IT: `auditoria`/`auditoria`-with-accent is Portuguese
 * against Spanish, not a defect; so are `evidencia`/`evidencia`-with-circumflex,
 * `criterios`, `competencia`, `nivel`, `limites`. Pooling two languages makes
 * every cognate look like a disagreement.
 *
 * And WITHIN a language two more classes are not misspellings:
 *
 *   DIACRITIC PAIRS   Spanish marks interrogatives and a few homographs with an
 *                     accent that changes the WORD: como/como-with-accent is
 *                     "as" against "how", cuando/cuando-with-accent likewise.
 *                     Both are correct and they are different lexemes.
 *   VERB FORMS        registro/registro-with-accent is a noun against a
 *                     preterite. The accent falls on a FINAL vowel and the
 *                     stems are identical -- mechanically recognisable.
 *
 * Neither can be called a defect without a dictionary, and a report that calls
 * 5,569 correct words defects is a report nobody reads twice. */
/* The three classes where BOTH forms are correct live in lib/accent-classes.mjs
 * so the report and the regeneration GATE cannot diverge. They did: a new gate
 * reimplemented the naive check and fired on que/como/trabajo across 14 rows. */

/* Group by stripped form PER LANGUAGE. */
const byStripped = new Map();
for (const d of docs) {
  for (const m of d.text.matchAll(/[\p{L}][\p{L}’']*/gu)) {
    const tok = m[0];
    /* THREE-LETTER WORDS COUNT. The first version skipped anything under four
     * characters and therefore could not see `nao`, `sao`, `ate`, `voce` -- and
     * `nao` sits in the SAME sentence as the `minimo` defect it did report:
     * "use o minimo de etapas ... elimine o que nao agrega". A length cutoff
     * chosen for noise reduction hid the most common missing accent in
     * Portuguese. Two is the floor now; one-letter words carry no accent worth
     * finding. */
    if (tok.length < 3) continue;
    const key = d.lang + "|" + strip(tok).toLowerCase();
    if (!byStripped.has(key)) byStripped.set(key, { forms: new Map() });
    const rec = byStripped.get(key);
    const form = tok.toLowerCase();
    if (!rec.forms.has(form)) rec.forms.set(form, []);
    rec.forms.get(form).push({ ...d, index: m.index, token: tok });
  }
}

const findings = [];
const excluded = { diacritic: 0, verbForm: 0, partOfSpeech: 0 };
for (const [key, rec] of byStripped) {
  const lang = key.split("|")[0], word = key.split("|")[1];
  const forms = [...rec.forms.keys()];
  const accented = forms.filter(hasAccent);
  const plain = forms.filter((f) => !hasAccent(f));
  if (!accented.length || !plain.length) continue;   // only one shape: not a disagreement
  if (DIACRITIC_PAIRS.has(word)) { excluded.diacritic++; continue; }
  if (PART_OF_SPEECH_PAIRS.has(word)) { excluded.partOfSpeech++; continue; }
  if (plain.every((pf) => accented.every((af) => isVerbFormPair(pf, af)))) { excluded.verbForm++; continue; }
  const plainOcc = plain.flatMap((f) => rec.forms.get(f).map((o) => ({ ...o, cls: classify(o.text, o.index, o.token) })));
  const accCount = accented.reduce((n, f) => n + rec.forms.get(f).length, 0);
  findings.push({
    stripped: word, lang,
    accentedForms: accented, accentedCount: accCount,
    plainCount: plainOcc.length,
    prose: plainOcc.filter((o) => o.cls === "PROSE"),
    other: plainOcc.filter((o) => o.cls !== "PROSE"),
  });
}
findings.sort((a, b) => b.prose.length - a.prose.length || b.plainCount - a.plainCount);

const withProse = findings.filter((f) => f.prose.length);
const proseTotal = withProse.reduce((n, f) => n + f.prose.length, 0);
const otherTotal = findings.reduce((n, f) => n + f.other.length, 0);

console.log("");
console.log("WORDS APPEARING BOTH WITH AND WITHOUT THEIR ACCENT");
console.log("  source: task_translations (statement + KSA) and concept_translations (name + description)");
console.log("  NOTE: the translation STORE, so it includes rows a gate currently withholds");
console.log("  languages: " + LANGS.join(", "));
console.log("");
console.log("  text fields scanned            " + docs.length + "   <- the denominator");
console.log("  distinct words in both shapes  " + (findings.length + excluded.diacritic + excluded.verbForm));
console.log("    less DIACRITIC PAIRS          " + excluded.diacritic + "   como/how, cuando/when -- different words, both correct");
console.log("    less VERB FORMS               " + excluded.verbForm + "   registro/registered -- noun against preterite");
console.log("    less PART-OF-SPEECH PAIRS     " + excluded.partOfSpeech + "   especifica/specific -- verb against adjective, declared by name");
console.log("  CANDIDATES FOR A HUMAN READ     " + findings.length);
console.log("");
console.log("  The three exclusions are classes where BOTH forms are correct words.");
console.log("  What remains is not judged -- a dictionary would be needed to separate a");
console.log("  missing accent from a homograph, and guessing here is the lexical-proxy");
console.log("  defect this repository keeps recording.");
console.log("  unaccented occurrences         " + (proseTotal + otherTotal));
console.log("    in PROSE (candidate defects) " + proseTotal + "   across " + withProse.length + " word(s)");
console.log("    code span / url / identifier / english  " + otherTotal + "   not defects");
console.log("");
if (withProse.length) {
  console.log("  PROSE CASES, worst first:");
  for (const f of withProse.slice(0, 20)) {
    console.log("    " + String(f.prose.length).padStart(3) + "x  " + f.stripped.padEnd(18) +
      f.lang.padEnd(8) + "(accented " + f.accentedCount + "x as " + f.accentedForms.join("/") + ")");
  }
} else {
  console.log("  NO PROSE CASES. Every unaccented occurrence is a code span, url,");
  console.log("  identifier or English quotation -- which is a result, not an absence.");
}

const lines = [];
lines.push("# Words in the served corpus appearing both with and without their accent");
lines.push("");
lines.push("Report only. Nothing changed.");
lines.push("");
lines.push("A word appearing ONLY unaccented proves nothing -- it may be a loanword, an");
lines.push("identifier or an English term. A word appearing in BOTH shapes is the corpus");
lines.push("disagreeing with itself, and one of the two is wrong.");
lines.push("");
lines.push("Occurrences are classified, not words: the same token is a defect in prose and");
lines.push("correct inside a code span.");
lines.push("");
lines.push("| lang | word | accented | unaccented in prose | elsewhere |");
lines.push("|---|---|---|---|---|");
for (const f of findings) {
  lines.push("| " + f.lang + " | " + f.stripped + " | " + f.accentedCount + " | **" + f.prose.length + "** | " + f.other.length + " |");
}
lines.push("");
lines.push("---");
lines.push("");
for (const f of withProse) {
  lines.push("## " + f.stripped + " -- " + f.prose.length + " in prose");
  lines.push("");
  lines.push("Accented form: " + f.accentedForms.join(", ") + " (" + f.accentedCount + " occurrences)");
  lines.push("");
  for (const o of f.prose.slice(0, 12)) {
    const s = Math.max(0, o.index - 90);
    lines.push("- **" + o.cert + "** " + o.kind + " `" + o.id + "` / " + o.field + " (" + o.lang + ")");
    lines.push("  - ..." + o.text.slice(s, o.index + o.token.length + 60).replace(/\n/g, " ") + "...");
  }
  lines.push("");
}
writeFileSync(join(ROOT, OUT), lines.join("\n"), "utf8");
console.log("");
console.log("  wrote " + OUT);

if (JSON_OUT) {
  writeFileSync(join(ROOT, "MISSING-ACCENTS.json"), JSON.stringify({
    measured: new Date().toISOString(), fields: docs.length,
    words: findings.map((f) => ({ stripped: f.stripped, accented: f.accentedCount,
      prose: f.prose.length, other: f.other.length,
      proseRows: f.prose.map((o) => ({ cert: o.cert, kind: o.kind, id: o.id, field: o.field, lang: o.lang })) })),
  }, null, 2), "utf8");
  console.log("  wrote MISSING-ACCENTS.json");
}
