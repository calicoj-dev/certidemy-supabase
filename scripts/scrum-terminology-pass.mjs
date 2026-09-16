#!/usr/bin/env node
/**
 * scrum-terminology-pass.mjs - the 2020-Guide terminology pass on the Scrum four.
 *
 * OPT INTO WRITING: `--apply`. Dry by default. Unknown flags exit 2.
 *
 * ============ READ BEFORE REPLACE, AND THE READING INVERTED THE TASK ============
 *
 * The four Scrum certifications carry 113 `Development Team`, 78
 * `self-organizing` and 24 `servant-leader`. That reads like 215 defects. It is
 * not. Measured 2026-09-15:
 *
 *   Development Team   113 occurrences, 5 in plain prose, ALL FIVE inside
 *                      05-05-terminology-drift -- the lesson whose subject IS
 *                      the removal of that term
 *   self-organizing     78 occurrences, 5 in plain prose, 4 in the same lesson
 *   servant-leader      24 occurrences, 3 in plain prose
 *
 * The rest are the term being quoted, named as removed, or in frontmatter. A
 * sweep-and-replace would have rewritten the lessons that teach the correction
 * into nonsense -- the same shape as migration 290 aborting on a guard that
 * matched the note explaining what it had corrected.
 *
 * ============ THE CORPUS ALREADY HAD THE PREDICATE ============
 *
 * `teaches_retired_vocabulary: true` in lesson frontmatter marks a lesson that
 * carries retired terms on purpose. Better than any heuristic, and already there.
 *
 * AND IT IS SET IN ENGLISH ONLY. Seven of the ten flagged rows carry it on `en`
 * while their es-419 and pt-BR siblings carry the same retired terms and no
 * flag. Only sm-ai-ii-02-03 has it in all three. So a future sweep that trusts
 * the flag reports the Spanish and Portuguese halves of a drift lesson as
 * defects -- the English-only-record defect IP-POSITION section 3 measured for
 * quotation marking, in a different field.
 *
 * So this script rewrites almost nothing:
 *
 *   A. MIRROR the flag into es-419 and pt-BR for the 7 English-only lessons.
 *   B. ADD the flag to 05-02-coaching-and-servant-leadership in all three
 *      languages. It teaches "true leader who serves", cites Greenleaf, and says
 *      its behaviour list is professional practice rather than Guide text -- it
 *      is doing the right thing and carries no flag.
 *   C. REPLACE five occurrences in ONE row: SD-AI-I / 05-03-working-with-scrum-
 *      master / en, the only place a retired term is taught as current.
 *
 * ============ WHY (C) IS A LESSON EDIT AND NOT A BANK EDIT ============
 *
 * Verified before writing: the checkpoint question in that lesson ("How does the
 * Scrum Master primarily serve the Developers?") returns ZERO rows from
 * public.quiz_questions, and `::checkpoint` is not in PUBLISHED_BLOCKS. It is an
 * in-lesson checkpoint, not exam content.
 *
 * SEPARATELY, AND NOT TOUCHED HERE: 35 bank items mention `servant-leader`, 17
 * of them SM-AI-I secure, exam-scope, approved. Different act, different gate.
 * 13 of the 17 also reference 2020 and 10 reference "true leader", which is what
 * a terminology-drift item looks like, so most are correct by design. This
 * script neither reads nor writes the secure bank.
 *
 * ============ DIRECTION OF THE FIX ============
 *
 * es-419 and pt-BR of 05-03 do not carry the term at all. Fixing English brings
 * it into line with its own translations rather than diverging from them.
 */
import { readFileSync, existsSync } from "node:fs";

for (const p of ["scripts/.env", ".env"]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const KNOWN = new Set(["--apply", "--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ".");
    console.error("This script is the --apply family: DRY BY DEFAULT, --apply to write.");
    console.error("Known flags: --apply, --verbose.");
    process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");
const VERBOSE = process.argv.includes("--verbose");

const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  process.exit(2);
}
const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
// BOTH HEADERS, SAME VALUE. Authorization alone answers "No API key found in
// request", which reads as a bad credential and is a missing header.
const H = {
  apikey: KEY,
  Authorization: "Bearer " + KEY,
  "content-type": "application/json",
};

const FLAG = "teaches_retired_vocabulary: true";

/** English row carries the flag; the translations do not. */
const MIRROR = [
  ["SD-AI-I", "01-05-who-the-developers-are"],
  ["SD-AI-I", "02-08-self-management"],
  ["SD-AI-I", "05-08-terminology-drift"],
  ["SM-AI-I", "01-01-agile-manifesto"],
  ["SM-AI-I", "02-05-self-management-and-boundaries"],
  ["SM-AI-I", "04-04-increment-and-definition-of-done"],
  ["SM-AI-I", "05-05-terminology-drift"],
];

/** Teaches the correction, flagged nowhere. */
const ADD = [["SM-AI-I", "05-02-coaching-and-servant-leadership"]];

/** The one row where a retired term is taught as current. Exact, anchored. */
const REPLACE = {
  cert: "SD-AI-I",
  slug: "05-03-working-with-scrum-master",
  language: "en",
  edits: [
    [
      "They're a servant-leader whose job is to help the Developers succeed.",
      "They're a true leader who serves, and their job is to help the Developers succeed.",
    ],
    [
      "as a servant-leader with no authority over the Developers' work",
      "as a true leader who serves, with no authority over the Developers' work",
    ],
    [
      "The SM is a servant-leader who removes impediments and fosters self-management",
      "The SM is a true leader who serves, removing impediments and fostering self-management",
    ],
    ["misreads the servant-leader role", "misreads the Scrum Master's role"],
    [
      "The Scrum Master serves the Developers as a servant-leader",
      "The Scrum Master is a true leader who serves the Developers",
    ],
  ],
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

const certs = await rest("certifications?select=id,code");
const idOf = Object.fromEntries(certs.map((c) => [c.code, c.id]));

async function lessonsFor(code, slug) {
  const mods = await rest("modules?select=id&certification_id=eq." + idOf[code]);
  const ids = mods.map((m) => m.id).join(",");
  return await rest(
    "lessons?select=id,slug,language,content_md&module_id=in.(" + ids + ")&slug=eq." + slug,
  );
}

/**
 * Insert the flag as the last line of the frontmatter block.
 *
 * ANCHORED ON THE FENCE, NOT ON A KEY. Key order differs between lessons and
 * between languages; the closing fence is the one landmark every one of them has
 * in the same place. Returns "already" rather than duplicating.
 */
function withFlag(md) {
  const m = String(md).match(/^([\r\n]*---\r?\n)([\s\S]*?)(\r?\n---\r?\n)/);
  if (!m) return null;
  if (m[2].includes(FLAG)) return "already";
  const eol = m[3].startsWith("\r") ? "\r\n" : "\n";
  return m[1] + m[2] + eol + FLAG + md.slice(m[1].length + m[2].length);
}

let planned = 0;
let applied = 0;
const problems = [];

console.log("");
console.log(APPLY ? "mode: APPLY" : "mode: DRY");
console.log("");
console.log("A + B. teaches_retired_vocabulary mirroring");

for (const [code, slug] of [...MIRROR, ...ADD]) {
  const rows = await lessonsFor(code, slug);
  if (!rows.length) {
    problems.push("no lesson " + code + "/" + slug);
    continue;
  }
  for (const r of rows) {
    const next = withFlag(r.content_md);
    if (next === null) {
      problems.push(code + "/" + slug + "/" + r.language + ": no frontmatter fence");
      continue;
    }
    if (next === "already") {
      if (VERBOSE) console.log("   ok   " + code + "/" + slug + "/" + r.language + " already flagged");
      continue;
    }
    planned++;
    console.log("   FLAG " + code + "/" + slug + "/" + r.language);
    if (APPLY) {
      await rest("lessons?id=eq." + r.id, {
        method: "PATCH",
        body: JSON.stringify({ content_md: next }),
      });
      applied++;
    }
  }
}

console.log("");
console.log("C. the one row where a retired term is taught as current");

{
  const rows = await lessonsFor(REPLACE.cert, REPLACE.slug);
  const row = rows.find((r) => r.language === REPLACE.language);
  if (!row) {
    problems.push("SD-AI-I/05-03/en not found");
  } else {
    let md = row.content_md;
    const before = (md.match(/servant-leader/gi) || []).length;
    for (const [from, to] of REPLACE.edits) {
      const n = md.split(from).length - 1;
      if (n !== 1) {
        problems.push("anchor matched " + n + " times, expected 1: " + from.slice(0, 50));
        continue;
      }
      md = md.replace(from, to);
      planned++;
      console.log("   EDIT " + from.slice(0, 68));
      console.log("     -> " + to.slice(0, 68));
    }
    // BOTH DIRECTIONS. The positive half is that five anchors matched; the
    // negative half is that nothing carrying the term survives, which a count of
    // successful replacements cannot tell you.
    const left = (md.match(/servant-leader/gi) || []).length;
    console.log("   occurrences before " + before + ", after " + left);
    if (left !== 0) problems.push(left + " servant-leader occurrence(s) would survive");
    if (APPLY && problems.length === 0) {
      await rest("lessons?id=eq." + row.id, {
        method: "PATCH",
        body: JSON.stringify({ content_md: md }),
      });
      applied++;
    }
  }
}

console.log("");
console.log("planned " + planned + "   applied " + applied + "   problems " + problems.length);
for (const p of problems) console.log("  X " + p);
if (!APPLY) {
  console.log("");
  console.log("DRY RUN. Nothing was written. Re-run with --apply.");
}

// No process.exit() after a fetch: exiting while undici holds a keep-alive
// socket trips a libuv assertion on Windows. See mint-issuer-key.mjs.
process.exitCode = problems.length ? 1 : 0;
