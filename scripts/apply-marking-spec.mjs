#!/usr/bin/env node
/**
 * apply-marking-spec.mjs - apply the batch gen-marking-spec.mjs emitted.
 *
 * OPT INTO WRITING: `--apply`. Dry by default. Unknown flags exit 2.
 *
 *   node scripts/apply-marking-spec.mjs --from scrum-marking-spec.json
 *   node scripts/apply-marking-spec.mjs --from scrum-marking-spec.json --apply
 *
 * ============ THE GUARDS RUN AGAIN HERE, ON PURPOSE ============
 *
 * CLAUDE.md asks for exactly this shape: an emit that stops before the write and
 * a `--from` that "inserts that exact batch, RE-RUNNING THE GUARDS ON THE WAY IN
 * so an edited file cannot smuggle a bad item past them."
 *
 * So the spec is not trusted. For every line it claims to change:
 *
 *   - the lesson row is re-fetched from the database, not read from the spec;
 *   - `before` must match the live line AT THAT INDEX, exactly, or the row is
 *     refused. A lesson edited since the spec was generated fails loudly rather
 *     than having a stale line written over a new one;
 *   - the attribution must not already be present, so a second run is a no-op
 *     rather than a doubling.
 *
 * ============ WHAT IT WILL NOT TOUCH ============
 *
 * `blocked` entries are not applied and cannot be: they carry no per-language
 * line indices, because the generator refused to compute them. SM-AI-I /
 * 01-02-empirical-process-control has a block sequence that differs across
 * languages, and one 8-word run is not worth the risk of marking the wrong
 * sentence in a language nobody reviewing this can read.
 *
 * `needs_authoring` entries ARE applied -- they get the same trailing
 * attribution as everything else -- and stay listed for a human pass that may
 * later set them off as quotations. Attribution now does not preclude
 * presentation later.
 *
 * ============ WHY IT SPLICES BY OFFSET INSTEAD OF REJOINING LINES ============
 *
 * The first version split the body on /\r?\n/ and rejoined it. Eight English
 * rows failed the round-trip check that caught it -- SM-AI-I/02-03-the-scrum-
 * master among them -- because they carry MIXED line endings, and rejoining
 * would have normalised every line in the file. A 500-line diff on a row where
 * eight words changed, invisible to any check that only inspects edited lines.
 *
 * So nothing is rejoined. Line spans are computed as character offsets using the
 * SAME rule the generator indexed with (/\r?\n/), and only the target line's
 * span is spliced. Every byte outside an edited line is carried through
 * untouched, whatever the line endings are.
 *
 * ============ AN ENTRY APPLIES IN ALL THREE LANGUAGES OR IN NONE ============
 *
 * That failure was worse than it looked. All eight refusals were `en`, so
 * refusing them row by row would have marked es-419 and pt-BR and left English
 * unmarked -- manufacturing the trilingual asymmetry this whole pass exists to
 * prevent, in the opposite direction, and only in the languages nobody reviewing
 * it can read.
 *
 * So resolution happens per ENTRY across all three languages before any lesson
 * is written. If one language will not resolve cleanly, the entry is dropped in
 * all three.
 */
import { readFileSync, existsSync } from "node:fs";

for (const p of ["scripts/.env", ".env"]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const KNOWN = new Set(["--apply", "--from", "--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ".");
    console.error("This script is the --apply family: DRY BY DEFAULT, --apply to write.");
    console.error("Known flags: --apply, --from, --verbose.");
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const APPLY = process.argv.includes("--apply");
const VERBOSE = process.argv.includes("--verbose");
const FROM = arg("from", "scrum-marking-spec.json");

if (!existsSync(FROM)) {
  console.error("spec not found: " + FROM);
  console.error("Generate it first: node scripts/gen-marking-spec.mjs");
  process.exit(2);
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  process.exit(2);
}

const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = {
  apikey: KEY,
  Authorization: "Bearer " + KEY,
  "content-type": "application/json",
};

async function rest(path, init) {
  let last;
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(BASE + "/" + path, {
        ...init,
        headers: H,
        signal: AbortSignal.timeout(45000),
      });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 200));
      return t ? JSON.parse(t) : null;
    } catch (e) {
      last = e;
    }
  }
  throw last;
}

const problems = [];
const problemsEarly = [];

const spec = JSON.parse(readFileSync(FROM, "utf8"));
console.log("");
console.log("spec: " + FROM);
console.log("  entries " + spec.entries.length + "   blocked " + spec.blocked.length +
  "   threshold " + spec.threshold_words + "w");
console.log(APPLY ? "mode: APPLY" : "mode: DRY");
console.log("");

/**
 * Character span of each line, indexed the SAME WAY the generator indexed:
 * split on /\r?\n/. A lone 
 stays inside a line in both, so `line_abs` means
 * the same thing here as it did there.
 */
function lineSpans(md) {
  const spans = [];
  const re = /\r?\n/g;
  let start = 0;
  let m;
  while ((m = re.exec(md)) !== null) {
    spans.push([start, m.index]);
    start = m.index + m[0].length;
  }
  spans.push([start, md.length]);
  return spans;
}

/* Every lesson row the spec touches, fetched once. */
const lessonIds = new Set();
for (const e of spec.entries) for (const lg of Object.keys(e.languages)) lessonIds.add(e.languages[lg].lesson_id);
console.log("lesson rows referenced: " + lessonIds.size);

const live = new Map();
for (const id of lessonIds) {
  try {
    const rows = await rest("lessons?select=id,content_md&id=eq." + id);
    if (rows && rows.length) live.set(id, rows[0].content_md);
  } catch (e) {
    problemsEarly.push("fetch failed for lesson " + id + ": " + e.message);
  }
}

/* Resolve each ENTRY across all three languages, atomically. */
const accepted = new Map(); // lessonId -> [{start, end, after}]
let entriesAccepted = 0;
let entriesDropped = 0;
let noop = 0;

for (const e of spec.entries) {
  const langs = Object.keys(e.languages);
  const resolved = [];
  let drop = null;
  let allNoop = true;

  for (const lg of langs) {
    const d = e.languages[lg];
    const md = live.get(d.lesson_id);
    if (md === undefined) { drop = lg + ": row not fetched"; break; }
    const spans = lineSpans(md);
    const span = spans[d.line_abs];
    if (!span) { drop = lg + ": line " + d.line_abs + " does not exist"; break; }
    const text = md.slice(span[0], span[1]);
    if (text === d.after) { resolved.push(null); continue; }
    if (text !== d.before) { drop = lg + ": line " + d.line_abs + " changed since the spec was generated"; break; }
    allNoop = false;
    resolved.push({ lessonId: d.lesson_id, start: span[0], end: span[1], after: d.after });
  }

  if (drop) {
    entriesDropped++;
    problems.push(e.cert + "/" + e.slug + " block " + e.block_index + " line " + e.line_index + " -- " + drop +
      " (entry dropped in ALL languages)");
    continue;
  }
  if (allNoop) { noop++; continue; }
  entriesAccepted++;
  for (const r of resolved) {
    if (!r) continue;
    if (!accepted.has(r.lessonId)) accepted.set(r.lessonId, []);
    accepted.get(r.lessonId).push(r);
  }
}

console.log("entries accepted      : " + entriesAccepted);
console.log("entries already done  : " + noop);
console.log("entries DROPPED       : " + entriesDropped);
console.log("");

let rowsChanged = 0;
let linesChanged = 0;

for (const [lessonId, edits] of accepted) {
  // Descending, so an earlier splice cannot move a later one.
  edits.sort((a, b) => b.start - a.start);
  let md = live.get(lessonId);
  for (const ed of edits) md = md.slice(0, ed.start) + ed.after + md.slice(ed.end);
  rowsChanged++;
  linesChanged += edits.length;
  if (VERBOSE) console.log("  lesson " + lessonId + "  " + edits.length + " line(s)");
  if (APPLY) {
    try {
      await rest("lessons?id=eq." + lessonId, {
        method: "PATCH",
        body: JSON.stringify({ content_md: md }),
      });
    } catch (e) {
      problems.push("write failed for lesson " + lessonId + ": " + e.message);
    }
  }
}

console.log("");
console.log("lesson rows to write : " + rowsChanged);
console.log("lines changed        : " + linesChanged);
console.log("entries already marked: " + noop);
console.log("problems             : " + (problems.length + problemsEarly.length));
for (const p of [...problemsEarly, ...problems].slice(0, 20)) console.log("  X " + p);
if (problems.length > 20) console.log("  ... and " + (problems.length - 20) + " more");

if (!APPLY) {
  console.log("");
  console.log("DRY RUN. Nothing was written. Re-run with --apply.");
}

// No process.exit() after a fetch. See mint-issuer-key.mjs.
process.exitCode = problems.length + problemsEarly.length ? 1 : 0;
