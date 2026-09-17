#!/usr/bin/env node
/**
 * list-authoring-candidates.mjs - the passages where a set-off quotation would
 * read better than the trailing attribution they now carry.
 *
 * READ-ONLY. It writes nothing but --json. Unknown flags exit 2.
 *
 * ============ WHY THE GENERATOR CAN NO LONGER FIND THESE ============
 *
 * `gen-marking-spec.mjs` reports `needs_authoring` only for lines it is ABOUT
 * TO MARK. The 450 rows landed, so every one of those lines is now classified
 * `attributed-prose` and SKIPPED -- the generator now prints
 * `english lines to mark 0` and `needs human authoring 0`.
 *
 * That zero is not "nothing left to do". It is "the mechanical half is done",
 * and the two are indistinguishable from the generator's output alone. So the
 * remaining judgement needs its own instrument, which is this one.
 *
 * ============ WHAT IT SELECTS ============
 *
 *   a run of >= 20 Guide words, in English published lesson prose,
 *   on a line classified `attributed-prose` -- NAMED BUT NOT SET OFF.
 *
 * Lines already set off as a blockquote, an italic quotation or a bolded bullet
 * are excluded: they are finished. The distinction is the point, and it lives
 * in lib/guide-runs.mjs's SET_OFF set rather than in this file.
 *
 * ============ AND IT CHECKS THE TRILINGUAL CONSTRAINT, BOTH DIRECTIONS ============
 *
 * IP-POSITION section 3: "A passage marked as quotation in English is marked in
 * both translations." For each candidate this reports whether the es-419 and
 * pt-BR siblings carry their own attribution at the SAME position -- and
 * whether the lesson is positionally aligned at all, because a positional edit
 * on a lesson whose blocks do not line up is the one way this pass marks the
 * wrong sentence in a language the reviewer cannot read.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ATTRIBUTION, blocks, solid, alreadyMarked, SET_OFF,
  guideGrams, longestRun, checkFaithful,
} from "./lib/guide-runs.mjs";

const KNOWN = new Set(["--json", "--min", "--author-at", "--cert", "--full", "--source"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ".");
    console.error("READ-ONLY; writes only --json. Known: --json, --min, --author-at, --cert, --full.");
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const MIN = Number(arg("min", "8"));
const AUTHOR_AT = Number(arg("author-at", "20"));
const JSON_OUT = arg("json", "");
const ONLY = arg("cert", "");
/* WHICH ATTRIBUTION COUNTS.
 *
 *   appended  -- the line carries the literal ` (Scrum Guide 2020)` written by
 *                the 2026-09-16 marking pass. This is the set the handoff calls
 *                "the 27": lines the pass itself flagged `needs_authoring`.
 *   any       -- ALSO includes lines that named the Guide in their own prose
 *                long before that pass. A superset, and the honest answer to
 *                "where would a set-off quotation read better".
 *
 * They are different questions and the counts differ by more than double, so
 * the flag is explicit rather than a default nobody notices. */
const SOURCE = arg("source", "appended");
if (!["appended", "any"].includes(SOURCE)) {
  console.error("--source must be 'appended' or 'any'");
  process.exit(2);
}
const FULL = process.argv.includes("--full");

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

/* ------------------------------------------------------- positive control */
const bad = checkFaithful();
if (bad.length) {
  console.error("");
  console.error("THE CLASSIFIER CONTROL FAILED. Not reporting: a miscategorising");
  console.error("classifier produces a plausible list of the wrong lines.");
  for (const b of bad) console.error("  X " + b);
  process.exit(1);
}
console.log("");
console.log("control: the classifier categorises 7 known lines correctly");

const CERTS = (ONLY ? [ONLY] : ["SM-AI-I", "SM-AI-II", "SPO-AI-I", "SD-AI-I"]);
const LANGS = ["en", "es-419", "pt-BR"];

const guidePath = join(HERE, "..", "reference", "scrum-guide-2020.txt");
if (!existsSync(guidePath)) { console.error("no reference/scrum-guide-2020.txt"); process.exit(2); }
const GRAMS = guideGrams(readFileSync(guidePath, "latin1"), MIN);

const certs = await rest("certifications?select=id,code");
const idOf = Object.fromEntries(certs.map((c) => [c.code, c.id]));

const candidates = [];
const classCount = {};
let lessonsSeen = 0, runsSeen = 0, blockedLessons = 0;

for (const code of CERTS) {
  const mods = await rest("modules?select=id&certification_id=eq." + idOf[code]);
  const rows = await rest("lessons?select=id,slug,language,content_md&module_id=in.(" +
    mods.map((m) => m.id).join(",") + ")");
  const bySlug = {};
  for (const r of rows) (bySlug[r.slug] ||= {})[r.language] = r;

  for (const [slug, langs] of Object.entries(bySlug)) {
    lessonsSeen++;
    const parsed = {};
    for (const l of LANGS) if (langs[l]) parsed[l] = blocks(langs[l].content_md);
    const missing = LANGS.filter((l) => !langs[l]);
    const types = LANGS.filter((l) => parsed[l]).map((l) => parsed[l].map((b) => b.type).join("|"));
    const counts = LANGS.filter((l) => parsed[l]).map((l) => parsed[l].map((b) => solid(b).length).join("|"));
    const aligned = missing.length === 0 && new Set(types).size === 1 && new Set(counts).size === 1;
    if (!aligned) blockedLessons++;

    const en = parsed["en"];
    if (!en) continue;

    for (let bi = 0; bi < en.length; bi++) {
      const sol = solid(en[bi]);
      for (let li = 0; li < sol.length; li++) {
        const run = longestRun(sol[li].text, GRAMS, MIN);
        if (!run) continue;
        runsSeen++;
        const mark = alreadyMarked(sol[li].text, li ? sol[li - 1].text : "");
        classCount[mark ?? "UNMARKED"] = (classCount[mark ?? "UNMARKED"] || 0) + 1;

        if (run.len < AUTHOR_AT) continue;
        if (mark && SET_OFF.has(mark)) continue;   // already set off: finished
        const appended = sol[li].text.includes(ATTRIBUTION["en"].trim());
        if (SOURCE === "appended" && !appended) continue;

        /* THE TRILINGUAL HALF, PER CANDIDATE. */
        const sib = {};
        for (const l of LANGS) {
          if (!parsed[l]) { sib[l] = { present: false }; continue; }
          const s = solid(parsed[l][bi] ?? { body: [] });
          const line = s[li]?.text;
          sib[l] = line === undefined
            ? { present: false }
            : {
                present: true,
                lesson_id: langs[l].id,
                line_abs: s[li].abs,
                text: line,
                /* ATTRIBUTED, NOT "CARRIES THE STRING WE APPENDED". The first
                 * version tested only for the literal ` (Guia Scrum 2020)` and
                 * reported 102 problems, almost all of them lines that name the
                 * Guide in their own prose and always have. That is the guard
                 * searching for a STRING when the property is a STATE -- the
                 * failure mode CLAUDE.md records five instances of in one day. */
                appended: line.includes(ATTRIBUTION[l].trim()),
                marked_as: alreadyMarked(line, li ? s[li - 1].text : ""),
                /* APPENDED MARKER FIRST, classifier second. alreadyMarked is
                 * English-only -- see lib/guide-runs.mjs -- so on a translated
                 * row it answers null for a line that is correctly attributed.
                 * The set-off shapes it does detect are typography and so are
                 * language-neutral, which is why it is still consulted. */
                attributed: line.includes(ATTRIBUTION[l].trim()) ||
                            alreadyMarked(line, li ? s[li - 1].text : "") !== null,
              };
        }

        candidates.push({
          cert: code, slug, block: en[bi].type, block_index: bi, line_index: li,
          run_words: run.len, run: run.text,
          classified: mark ?? "UNMARKED",
          aligned,
          english_line: sol[li].text.trim(),
          siblings: sib,
        });
      }
    }
  }
}

console.log("  lessons examined      " + lessonsSeen);
console.log("  lines with a Guide run of >=" + MIN + "w  " + runsSeen);
console.log("  classification: " + JSON.stringify(classCount));
console.log("  lessons NOT positionally aligned: " + blockedLessons);
console.log("");
console.log("CANDIDATES: run >=" + AUTHOR_AT + "w, named but NOT set off, source=" + SOURCE + " -- " + candidates.length);
console.log("");

/* ---------------------------------------------- the trilingual constraint */
const trilingualProblems = [];
for (const c of candidates) {
  for (const l of LANGS) {
    const s = c.siblings[l];
    if (!s.present) trilingualProblems.push(`${c.cert}/${c.slug} b${c.block_index}l${c.line_index}: no ${l} line at that position`);
    else if (!s.attributed)
      trilingualProblems.push(`${c.cert}/${c.slug} b${c.block_index}l${c.line_index}: ${l} is neither attributed nor set off`);
    else if (c.siblings["en"].appended && !s.appended)
      trilingualProblems.push(`${c.cert}/${c.slug} b${c.block_index}l${c.line_index}: en carries the appended marker, ${l} does not`);
  }
  if (!c.aligned) trilingualProblems.push(`${c.cert}/${c.slug}: lesson is NOT positionally aligned -- a positional edit would be a guess`);
}
console.log("TRILINGUAL CONSTRAINT (IP-POSITION section 3)");
console.log(trilingualProblems.length
  ? "  " + trilingualProblems.length + " problem(s):"
  : "  HOLDS: every candidate's es-419 and pt-BR siblings exist at the same position");
for (const p of [...new Set(trilingualProblems)]) console.log("    X " + p);
console.log("");

const byCert = {};
for (const c of candidates) (byCert[c.cert] ||= []).push(c);
for (const [cert, cs] of Object.entries(byCert)) console.log("  " + cert.padEnd(10) + cs.length);
console.log("");

let n = 0;
for (const c of candidates.sort((a, b) =>
  a.cert.localeCompare(b.cert) || a.slug.localeCompare(b.slug) || a.block_index - b.block_index || a.line_index - b.line_index)) {
  n++;
  console.log("-".repeat(78));
  console.log(n + ". " + c.cert + "  " + c.slug + "   ::" + c.block +
    " block " + c.block_index + " line " + c.line_index + "   " + c.run_words + " words");
  console.log("");
  console.log("  THE RUN (" + c.run_words + " Guide words, normalised):");
  console.log("    " + c.run);
  console.log("");
  console.log("  THE LINE AS IT STANDS:");
  for (const seg of (FULL ? [c.english_line] : [c.english_line.slice(0, 500)])) console.log("    " + seg);
  console.log("");
  console.log("  TRANSLATIONS AT THE SAME POSITION:");
  for (const l of ["es-419", "pt-BR"]) {
    const s = c.siblings[l];
    console.log("    " + l.padEnd(7) + (s.present
      ? (s.has_attribution ? "attributed" : "NOT attributed") + " / " + (s.marked_as ?? "unmarked") +
        "  line " + s.line_abs
      : "ABSENT"));
  }
  console.log("");
}

if (JSON_OUT) {
  writeFileSync(JSON_OUT, JSON.stringify({
    generated_for: "human ruling on set-off presentation",
    min_run_words: MIN,
    author_at: AUTHOR_AT,
    candidates,
  }, null, 1) + "\n");
  console.log("wrote " + JSON_OUT);
}
