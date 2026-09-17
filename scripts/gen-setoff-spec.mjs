#!/usr/bin/env node
/**
 * gen-setoff-spec.mjs - set six attributed passages off as quotations.
 *
 * READ-ONLY apart from the spec file it writes. Unknown flags exit 2.
 * Apply with the EXISTING applier:
 *
 *   node scripts/gen-setoff-spec.mjs --out scrum-setoff-spec.json
 *   node scripts/apply-marking-spec.mjs --from scrum-setoff-spec.json --apply
 *
 * ============ IT EMITS INTO apply-marking-spec.mjs ON PURPOSE ============
 *
 * That applier is generic: it re-fetches every lesson row, refuses a line whose
 * `before` no longer matches, splices by character offset so mixed line endings
 * survive, and resolves each entry ACROSS ALL THREE LANGUAGES OR NONE. It has
 * run, 450 rows landed through it, and its refusal behaviour is the thing that
 * caught the mixed-line-ending problem in the first place.
 *
 * Writing a second applier would be the third-parser mistake this repository
 * keeps paying for. This writes a spec in the shape that one already reads.
 *
 * ============ THE SPAN IS FOUND BY MARKUP, NEVER BY WORDS ============
 *
 * The Scrum Guide is English, so es-419 and pt-BR lesson rows contain zero Guide
 * n-grams. There is no text match that can find where the quoted stretch begins
 * and ends in a language this pass cannot read.
 *
 * But every one of these six lines has the SAME STRUCTURE in all three
 * languages, and the structure is punctuation and markdown -- a leading bold
 * label, a colon, an em dash, a second bold span, the trailing attribution.
 * Those are language-neutral by construction. So each entry names its
 * boundaries as ANCHORS and the anchors are resolved per language:
 *
 *   line-start | after-first-bold | after-colon-following-first-bold
 *   before-em-dash | before-second-bold | before-attribution
 *
 * Verified before writing: all six lines carry the same anchor sequence in
 * en / es-419 / pt-BR.
 *
 * ============ AND THE EDIT MUST BE MARKERS ONLY ============
 *
 * The post-condition is not "the output looks right". It is that DELETING THE
 * MARKERS FROM THE OUTPUT REPRODUCES THE INPUT BYTE FOR BYTE. An anchor that
 * resolves to the wrong offset in a language nobody here reads is the one
 * failure mode that matters, and it cannot survive that check -- a span in the
 * wrong place still adds exactly two asterisks, but a span that ATE or MOVED
 * text does not round-trip.
 *
 * It is checked per language, for every entry, before the spec is written.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { blocks, solid, ATTRIBUTION } from "./lib/guide-runs.mjs";

const KNOWN = new Set(["--out", "--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". READ-ONLY; it writes only the spec. Known: --out, --verbose.");
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const OUT = arg("out", "scrum-setoff-spec.json");
const VERBOSE = process.argv.includes("--verbose");

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
async function rest(path) {
  let last;
  for (let i = 0; i < 12; i++) {
    try {
      const r = await fetch(BASE + "/" + path, { headers: H, signal: AbortSignal.timeout(45000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 200));
      return JSON.parse(t);
    } catch (e) { last = e; }
  }
  throw last;
}

const LANGS = ["en", "es-419", "pt-BR"];

/* ===================== THE RULING =====================
 *
 * Six of the 27. The other 21 are settled and are NOT here:
 *   18 already set off in italics -- nothing to do.
 *    3 (#8 #10 #19) stay BOLD by decision: the trailing attribution already
 *      satisfies BY, and converting an author's teaching emphasis into a
 *      quotation marker trades pedagogy for a convention already met.
 */
const RULING = [
  { cert: "SM-AI-I", slug: "04-02-product-backlog-and-product-goal", block_index: 1, line_index: 0,
    wrap: "italic", start: "line-start", end: "before-em-dash",
    note: "the Guide sentence runs to the em dash; the clause after it is Certidemy's" },

  { cert: "SM-AI-II", slug: "sm-ai-ii-02-02-the-list-is-not-the-evidence", block_index: 6, line_index: 0,
    wrap: "blockquote",
    note: "three consecutive Guide sentences, no Certidemy prose on the line at all" },

  { cert: "SM-AI-II", slug: "sm-ai-ii-02-07-a-goal-assembled-backwards", block_index: 1, line_index: 3,
    wrap: "italic", start: "after-first-bold", end: "before-attribution",
    note: "bold label is Certidemy's framing; the Guide sentence follows it" },

  { cert: "SM-AI-II", slug: "sm-ai-ii-02-07-a-goal-assembled-backwards", block_index: 7, line_index: 2,
    wrap: "italic", start: "after-first-bold", end: "before-attribution",
    note: "same shape" },

  { cert: "SM-AI-II", slug: "sm-ai-ii-03-01-where-the-challenge-lands", block_index: 6, line_index: 1,
    wrap: "italic", start: "after-first-bold", end: "before-attribution",
    note: "same shape; the nested **ordering Product Backlog items** stays inside the span" },

  { cert: "SM-AI-II", slug: "sm-ai-ii-03-02-the-word-is-not-in-the-guide", block_index: 6, line_index: 2,
    wrap: "italic", start: "after-colon-following-first-bold", end: "before-second-bold",
    note: "the quoted list sits between Certidemy's lead-in colon and its follow-on bold" },
];

/* ------------------------------------------------------------ anchors */

const BOLD_G = /\*\*(?:[^*]|\*(?!\*))+?\*\*/g;
const EM_DASH = /[—–]/;

function boldSpans(line) {
  const out = [];
  let m;
  BOLD_G.lastIndex = 0;
  while ((m = BOLD_G.exec(line)) !== null) out.push([m.index, m.index + m[0].length]);
  return out;
}

/** Resolve one anchor to a character offset in `line`, or throw. */
function anchor(name, line, lang) {
  const bolds = boldSpans(line);
  const attrib = ATTRIBUTION[lang].trim();
  switch (name) {
    case "line-start":
      return 0;
    case "after-first-bold": {
      if (!bolds.length) throw new Error("no bold span");
      return bolds[0][1];
    }
    case "after-colon-following-first-bold": {
      if (!bolds.length) throw new Error("no bold span");
      const i = line.indexOf(":", bolds[0][1]);
      if (i < 0) throw new Error("no colon after the first bold span");
      return i + 1;
    }
    case "before-second-bold": {
      if (bolds.length < 2) throw new Error("fewer than two bold spans");
      return bolds[1][0];
    }
    case "before-em-dash": {
      const m = EM_DASH.exec(line);
      if (!m) throw new Error("no em dash");
      return m.index;
    }
    case "before-attribution": {
      const i = line.lastIndexOf(attrib);
      if (i < 0) throw new Error("attribution '" + attrib + "' not on the line");
      return i;
    }
    default:
      throw new Error("unknown anchor " + name);
  }
}

/** Build the edited line, or throw. Markers only -- never reflows text. */
function edit(rule, line, lang) {
  if (rule.wrap === "blockquote") {
    if (line.trimStart().startsWith(">")) return null;       // already done
    const lead = line.match(/^\s*/)[0];
    return lead + "> " + line.slice(lead.length);
  }
  let s = anchor(rule.start, line, lang);
  let e = anchor(rule.end, line, lang);
  // Trim the span to the text it actually covers, so the markers do not land
  // on whitespace -- `* text *` is not emphasis in CommonMark.
  while (s < e && /\s/.test(line[s])) s++;
  while (e > s && /\s/.test(line[e - 1])) e--;
  if (e - s < 20) throw new Error("span is only " + (e - s) + " characters; refusing");
  const inner = line.slice(s, e);
  if (inner.startsWith("*") || inner.endsWith("*")) throw new Error("span boundary lands on a marker");
  return line.slice(0, s) + "*" + inner + "*" + line.slice(e);
}

/* ------------------------------------------------------------- build */

const certs = await rest("certifications?select=id,code");
const idOf = Object.fromEntries(certs.map((c) => [c.code, c.id]));
const cache = {};
for (const code of [...new Set(RULING.map((r) => r.cert))]) {
  const mods = await rest("modules?select=id&certification_id=eq." + idOf[code]);
  const rows = await rest("lessons?select=id,slug,language,content_md&module_id=in.(" +
    mods.map((m) => m.id).join(",") + ")");
  for (const r of rows) ((cache[code] ||= {})[r.slug] ||= {})[r.language] = r;
}

const entries = [];
const problems = [];

console.log("");
for (const rule of RULING) {
  const langs = cache[rule.cert]?.[rule.slug];
  if (!langs) { problems.push(rule.slug + ": lesson not found"); continue; }

  const perLang = {};
  let fail = null;
  for (const lg of LANGS) {
    const row = langs[lg];
    if (!row) { fail = lg + ": row missing"; break; }
    const bs = blocks(row.content_md);
    const blk = bs[rule.block_index];
    if (!blk) { fail = lg + ": block " + rule.block_index + " does not exist"; break; }
    const sol = solid(blk);
    const cell = sol[rule.line_index];
    if (!cell) { fail = lg + ": line " + rule.line_index + " does not exist"; break; }

    let after;
    try { after = edit(rule, cell.text, lg); }
    catch (e) { fail = lg + ": " + e.message; break; }
    if (after === null) { fail = lg + ": already set off"; break; }

    /* ============ MARKERS ONLY. THE ROUND TRIP IS THE PROOF. ============ */
    const stripped = rule.wrap === "blockquote"
      ? after.replace(/^(\s*)>\s/, "$1")
      : after.replace(/(?<!\*)\*(?!\*)/g, "");
    if (stripped !== cell.text) {
      fail = lg + ": the edit does not round-trip -- text moved, not just markers";
      break;
    }
    /* And the attribution has to survive, in THIS language's wording. */
    if (!after.includes(ATTRIBUTION[lg].trim())) {
      fail = lg + ": attribution lost";
      break;
    }
    perLang[lg] = { lesson_id: row.id, line_abs: cell.abs, before: cell.text, after };
  }

  console.log(rule.cert + "  " + rule.slug + "  b" + rule.block_index + " l" + rule.line_index +
    "  [" + rule.wrap + "]");
  console.log("  " + rule.note);
  if (fail) {
    console.log("  REFUSED: " + fail);
    problems.push(rule.slug + " b" + rule.block_index + "l" + rule.line_index + ": " + fail);
    console.log("");
    continue;
  }
  for (const lg of LANGS) {
    const d = perLang[lg];
    console.log("  " + lg.padEnd(7) + "line " + d.line_abs);
    if (VERBOSE) {
      console.log("    -  " + d.before.trim());
      console.log("    +  " + d.after.trim());
    } else {
      console.log("    +  " + d.after.trim().slice(0, 150));
    }
  }
  console.log("");
  entries.push({
    cert: rule.cert, slug: rule.slug,
    block: "-", block_index: rule.block_index, line_index: rule.line_index,
    run_words: 0, run: rule.note, needs_authoring: false,
    wrap: rule.wrap,
    languages: perLang,
  });
}

console.log("entries      " + entries.length + " of " + RULING.length);
console.log("problems     " + problems.length);
for (const p of problems) console.log("  X " + p);

if (problems.length) {
  console.log("");
  console.log("NOT WRITING THE SPEC. An entry that cannot resolve in all three languages");
  console.log("would apply in two, which is the trilingual asymmetry this pass prevents.");
  process.exitCode = 1;
} else {
  writeFileSync(OUT, JSON.stringify({
    generated: "gen-setoff-spec.mjs", threshold_words: 20,
    entries, blocked: [],
  }, null, 1) + "\n");
  console.log("");
  console.log("spec written to " + OUT);
  console.log("NOTHING WAS WRITTEN TO THE DATABASE.");
  console.log("  node scripts/apply-marking-spec.mjs --from " + OUT + " --apply");
}
