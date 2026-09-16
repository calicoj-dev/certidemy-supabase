#!/usr/bin/env node
/**
 * gen-marking-spec.mjs - propose attribution marking for Scrum Guide quotations.
 *
 * READ-ONLY. It writes ONE file, the spec, and touches no database row.
 * Unknown flags exit 2. Apply with apply-marking-spec.mjs --apply.
 *
 * ============ WHY A SPEC AND NOT A DIRECT PASS ============
 *
 * CLAUDE.md: "A DRY RUN OF A GENERATOR IS A SAMPLE, NOT A PREVIEW." The
 * generators in this repo regenerate on every invocation, so the thing reviewed
 * is never the thing that lands. This emits the exact batch, the batch is read,
 * and the applier re-runs the guards on the way in. Same shape as
 * retranslate-item-rewrite.mjs.
 *
 * ============ THE THRESHOLD IS 8 WORDS AND IT IS A CHOICE, NOT A MEASUREMENT ============
 *
 * There is no correct threshold and that was established rather than assumed:
 * `team-size` read "Typically 10 or fewer people." -- five words, verbatim, and
 * the whole definition -- so a long cut misses real defects; and the recorded
 * figure of "24 phrases across 21 lessons" reproduces at NEITHER a length that
 * gives 24 lines (12w, excluding SM-AI-II, but 12 lessons) NOR one that gives 21
 * lessons. It is not reconstructible.
 *
 * So the threshold was chosen for the cost of its errors: 8 words, over-marking
 * on purpose. AN OVER-ATTRIBUTED PASSAGE IS NOT A DEFECT; AN UNDER-ATTRIBUTED
 * ONE IS.
 *
 * ============ THE TRANSLATIONS ARE ALIGNED BY POSITION, NOT BY TEXT ============
 *
 * The Scrum Guide is English, so es-419 and pt-BR lesson rows contain ZERO Guide
 * n-grams by construction. Text matching cannot find the translated quotation.
 * Position can: measured across the four Scrum certifications, 162 of 163
 * lessons have an identical block sequence across all three languages and 161
 * have identical per-block non-empty line counts.
 *
 * THE 1-2 THAT DO NOT ALIGN ARE EMITTED AS `blocked`, NEVER GUESSED. A positional
 * edit on a lesson whose blocks do not line up is the one way this pass marks the
 * wrong sentence in a language the reviewer cannot read.
 *
 * ============ WHAT THE MARKING IS, AND WHAT IT DELIBERATELY IS NOT ============
 *
 * SM-AI-II's convention is an italicised quotation introduced by a phrase naming
 * the Guide -- `The Guide is direct: *"..."*`. That is AUTHORING: it needs a
 * sentence written around the quotation, and where the quoted span begins and
 * ends inside a line of mixed prose is a judgement.
 *
 * This generator does NOT author. It proposes the mechanical half -- a trailing
 * source attribution on the line carrying the run -- which:
 *
 *   - satisfies the BY half of CC BY-SA, the half we can settle ourselves;
 *   - is identical in all three languages, so it needs no span-finding in a
 *     language it cannot read;
 *   - cannot garble a sentence, because it appends rather than restructures.
 *
 * Every entry also carries `needs_authoring: true` when the run is long enough
 * that a set-off quotation would read better than an attribution. Those are a
 * human pass, listed, not attempted.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";

for (const p of ["scripts/.env", ".env"]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const KNOWN = new Set(["--out", "--min", "--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ".");
    console.error("READ-ONLY; it writes only the spec file. Known flags: --out, --min, --verbose.");
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const OUT = arg("out", "scrum-marking-spec.json");
const MIN = Number(arg("min", "8"));
const AUTHOR_AT = 20; // runs this long read better set off than attributed

const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  process.exit(2);
}
const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };

const CERTS = ["SM-AI-I", "SM-AI-II", "SPO-AI-I", "SD-AI-I"];
const LANGS = ["en", "es-419", "pt-BR"];
const PUBLISHED = new Set(["hook", "concept", "callout", "summary", "deep-dive"]);
// THE TITLE IS ACCENTED IN SPANISH AND THE FIRST DRAFT WAS NOT.
// Lesson bodies are not SQL -- CERT-SCHEMA-GUIDE section 8's ASCII rule is about
// the SQL editor's paste path, not about content -- and these corpora are full of
// accents already. Writing "Guia" into es-419 would be a spelling error in a
// language the reviewer cannot read, which is the exact failure class this spec
// exists to avoid.
const ATTRIBUTION = {
  "en": " (Scrum Guide 2020)",
  "es-419": " (Guía Scrum 2020)",
  "pt-BR": " (Guia do Scrum 2020)",
};

async function rest(path) {
  let last;
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(BASE + "/" + path, { headers: H, signal: AbortSignal.timeout(45000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 200));
      return JSON.parse(t);
    } catch (e) {
      last = e;
    }
  }
  throw last;
}

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Parse into published blocks, keeping the absolute line index of every line. */
function blocks(md) {
  const src = String(md || "");
  let rest = src;
  let offset = 0;
  const fm = src.match(/^[\r\n]*---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (fm) {
    rest = src.slice(fm[0].length);
    offset = fm[0].split(/\r?\n/).length - 1;
  }
  const lines = rest.split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t.startsWith("::") || t === "::") continue;
    const type = t.slice(2).split(/[ {]/)[0];
    const body = [];
    let j = i + 1;
    while (j < lines.length && lines[j].trim() !== "::") {
      body.push({ text: lines[j], abs: offset + j });
      j++;
    }
    const start = i;
    i = j;
    if (PUBLISHED.has(type)) out.push({ type, body, openAbs: offset + start });
  }
  return out;
}

/** Non-empty lines only - the unit alignment is measured in. */
const solid = (b) => b.body.filter((l) => l.text.trim().length > 0);

/**
 * Is this line ALREADY marked as a quotation?
 *
 * Derived from SM-AI-II rather than invented: it sets Guide text off as a
 * blockquote, or italicised inside double quotes, or as a bolded bullet, and
 * introduces it with a phrase naming the Guide. Lines already carrying any of
 * those are skipped -- appending an attribution to `The Guide is direct: *"..."*`
 * would be double-marking, and over-marking is cheap only while it stays legible.
 *
 * NOTE this predicate classifies only ~48% of SM-AI-II's own runs as marked.
 * SM-AI-II is the best convention in the corpus and applies it about half the
 * time; it is not a clean reference, and that is why the rest are here.
 */
const ATTRIB_RE = /(scrum guide|the guide|2020 guide|guide (says|is direct|provides|addresses|states))/i;
const QUOTED_RE = /\*"[^"]{20,}"\*/;
function alreadyMarked(line, prev) {
  const t = String(line).trim();
  if (t.startsWith(">")) return "blockquote";
  if (QUOTED_RE.test(line)) return "italic-quoted";
  if (/^[-*]\s+\*\*/.test(t)) return "bold-bullet";
  if (line.includes('"') && ATTRIB_RE.test(line + " " + prev)) return "quoted+attributed";
  if (ATTRIB_RE.test(line + " " + prev)) return "attributed-prose";
  return null;
}

console.log("");
console.log("reading the Scrum Guide and the four corpora");

const guide = readFileSync("reference/scrum-guide-2020.txt", "latin1");
const gw = norm(guide).split(" ");
const GRAMS = new Set();
for (let i = 0; i + MIN <= gw.length; i++) GRAMS.add(gw.slice(i, i + MIN).join(" "));

/** Longest run in `text` that appears in the Guide, or null. */
function longestRun(text) {
  const w = norm(text).split(" ").filter(Boolean);
  let best = null;
  for (let i = 0; i + MIN <= w.length; i++) {
    if (!GRAMS.has(w.slice(i, i + MIN).join(" "))) continue;
    let len = MIN;
    while (
      i + len + 1 <= w.length &&
      GRAMS.has(w.slice(i + len + 1 - MIN, i + len + 1).join(" "))
    )
      len++;
    if (!best || len > best.len) best = { len, text: w.slice(i, i + len).join(" ") };
    i += len - 1;
  }
  return best;
}

const certs = await rest("certifications?select=id,code");
const idOf = Object.fromEntries(certs.map((c) => [c.code, c.id]));

const entries = [];
const skipped = {};
const blocked = [];
let lessonsSeen = 0;

for (const code of CERTS) {
  const mods = await rest("modules?select=id&certification_id=eq." + idOf[code]);
  const ids = mods.map((m) => m.id).join(",");
  const rows = await rest(
    "lessons?select=id,slug,language,content_md&module_id=in.(" + ids + ")",
  );
  const bySlug = {};
  for (const r of rows) (bySlug[r.slug] ||= {})[r.language] = r;

  for (const [slug, langs] of Object.entries(bySlug)) {
    lessonsSeen++;
    const missing = LANGS.filter((l) => !langs[l]);
    const parsed = {};
    for (const l of LANGS) if (langs[l]) parsed[l] = blocks(langs[l].content_md);

    // ALIGNMENT IS ESTABLISHED BEFORE ANY ENTRY IS EMITTED, NOT PER LINE.
    const types = LANGS.filter((l) => parsed[l]).map((l) => parsed[l].map((b) => b.type).join("|"));
    const counts = LANGS.filter((l) => parsed[l]).map((l) =>
      parsed[l].map((b) => solid(b).length).join("|"),
    );
    const aligned =
      missing.length === 0 && new Set(types).size === 1 && new Set(counts).size === 1;

    const en = parsed["en"];
    if (!en) continue;

    for (let bi = 0; bi < en.length; bi++) {
      const sol = solid(en[bi]);
      for (let li = 0; li < sol.length; li++) {
        const run = longestRun(sol[li].text);
        if (!run) continue;
        const mark = alreadyMarked(sol[li].text, li ? sol[li - 1].text : "");
        if (mark) { skipped[mark] = (skipped[mark] || 0) + 1; continue; }
        if (!aligned) {
          blocked.push({
            cert: code,
            slug,
            block: en[bi].type,
            block_index: bi,
            line_index: li,
            run_words: run.len,
            english_line: sol[li].text.trim().slice(0, 220),
            reason: missing.length
              ? "missing languages: " + missing.join(",")
              : new Set(types).size !== 1
                ? "block sequence differs across languages"
                : "line counts differ across languages",
          });
          continue;
        }
        const perLang = {};
        let ok = true;
        for (const l of LANGS) {
          const s = solid(parsed[l][bi]);
          if (!s[li]) { ok = false; break; }
          const before = s[li].text;
          if (before.includes(ATTRIBUTION[l].trim())) { ok = false; break; }
          perLang[l] = {
            lesson_id: langs[l].id,
            line_abs: s[li].abs,
            before: before,
            after: before.replace(/\s*$/, "") + ATTRIBUTION[l],
          };
        }
        if (!ok) continue;
        entries.push({
          cert: code,
          slug,
          block: en[bi].type,
          block_index: bi,
          line_index: li,
          run_words: run.len,
          run: run.text,
          needs_authoring: run.len >= AUTHOR_AT,
          languages: perLang,
        });
      }
    }
  }
}

const spec = {
  generated_for: "scrum quotation attribution",
  threshold_words: MIN,
  authoring_threshold_words: AUTHOR_AT,
  certifications: CERTS,
  lessons_examined: lessonsSeen,
  entries_english: entries.length,
  rows_to_write: entries.length * LANGS.length,
  blocked_count: blocked.length,
  skipped_already_marked: skipped,
  entries,
  blocked,
};
writeFileSync(OUT, JSON.stringify(spec, null, 1));

console.log("");
console.log("  lessons examined        " + lessonsSeen);
console.log("  english lines to mark   " + entries.length);
console.log("  rows to write (x3)      " + entries.length * LANGS.length);
console.log("  needs human authoring   " + entries.filter((e) => e.needs_authoring).length);
console.log("  BLOCKED, not guessed    " + blocked.length);
console.log("  skipped, already marked " + Object.values(skipped).reduce((a, b) => a + b, 0) +
  "  " + JSON.stringify(skipped));
console.log("");
console.log("  spec written to " + OUT);
console.log("");
console.log("NOTHING WAS WRITTEN TO THE DATABASE. Read the spec, then apply it.");

process.exitCode = 0;
