#!/usr/bin/env node
/**
 * triage-held-paragraphs.mjs - which held paragraphs can a RETRY ever fix?
 *
 * READ-ONLY, NO MODEL CALLS, NO WRITES. --json, --verbose. Unknown flags exit 2.
 *
 * ============ WHY THIS EXISTS ============
 *
 * Re-running the translator to find out what it refuses costs a model call per
 * paragraph and gives a DIFFERENT answer each time: a paragraph that failed on
 * "glossary keys changed" often passes on retry, because the refusal was about
 * that one completion rather than about the text.
 *
 * Reporting that list as "the ones that need a human" would be wrong twice
 * over: it includes paragraphs a retry fixes, and it is not reproducible.
 *
 * So this splits the held set by whether the refusal is a property of the TEXT
 * or a property of the COMPLETION:
 *
 *   STRUCTURAL   the language guard scores the existing translation 0 want /
 *                0 avoid. It is a tie, and `looksLikeLanguage` requires want to
 *                WIN. No completion can pass, because the line carries no
 *                distinctive token in either language -- "- e) be **held as
 *                documented information**" is the same string of markup and
 *                Latinate nouns in all three. A HUMAN, or a guard change.
 *   INCIDENTAL   everything else. Retry-able, and worth retrying before
 *                anyone's time is spent on it.
 *
 * The distinction is computable with no model involved, which is why it is here
 * rather than inferred from a log.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { blocks, solid } from "./lib/guide-runs.mjs";
import { looksLikeLanguage, checkFaithful as langControl } from "./lib/language-guard.mjs";

const KNOWN = new Set(["--json", "--verbose", "--cert"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". READ-ONLY. Known: " + [...KNOWN].join(", "));
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const JSON_OUT = arg("json", "");
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
async function raw(p, extra = {}) {
  let last;
  for (let i = 0; i < 12; i++) {
    try {
      const r = await fetch(BASE + "/" + p, { headers: { ...H, ...extra }, signal: AbortSignal.timeout(60000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 180));
      return { rows: JSON.parse(t), range: r.headers.get("content-range") };
    } catch (e) { last = e; }
  }
  throw last;
}
/* Pages to exhaustion and asserts against count=exact -- the same discipline
 * measure-ksa-provisional.mjs needed after a 1000-row page cap was read as a
 * total earlier today. */
async function all(p) {
  const PAGE = 500, out = [];
  for (let from = 0; ; from += PAGE) {
    const { rows } = await raw(p, { Range: from + "-" + (from + PAGE - 1) });
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  const { range } = await raw(p + (p.includes("?") ? "&" : "?") + "limit=1", { Prefer: "count=exact" });
  const total = Number(String(range || "").split("/")[1]);
  if (!Number.isFinite(total)) throw new Error("no exact count for " + p);
  if (out.length !== total) throw new Error("PAGINATION SHORT: " + out.length + " of " + total);
  return out;
}

const lb = langControl();
if (lb.length) {
  console.error("THE LANGUAGE GUARD FAILED ITS OWN CONTROL; triaging nothing.");
  for (const x of lb) console.error("  X " + x);
  process.exit(1);
}

/* Every batch's spans, so a held paragraph can be located the way the
 * translator locates it. One import list, shared with the translator. */
const BATCHES = [
  "./lesson-repairs-aimsf.mjs", "./lesson-repairs-aimsf-b2.mjs",
  "./lesson-repairs-aimsf-m1.mjs", "./lesson-repairs-aimsf-m2.mjs",
  "./lesson-repairs-aimsf-m3.mjs", "./lesson-repairs-aimsf-m4.mjs",
  "./lesson-repairs-aimsf-m5.mjs",
  "./lesson-repairs-aimsia-m1.mjs", "./lesson-repairs-aimsia-m2.mjs",
  "./lesson-repairs-aimsia-m3.mjs", "./lesson-repairs-aimsia-m4a.mjs",
  "./lesson-repairs-aimsia-m4a-fix.mjs", "./lesson-repairs-aimsia-m4b.mjs",
  "./lesson-repairs-aimsia-m4c.mjs", "./lesson-repairs-aimsia-m5.mjs",
  "./lesson-repairs-ismsia-m1.mjs", "./lesson-repairs-ismsia-m2.mjs",
  "./lesson-repairs-ismsia-m3.mjs", "./lesson-repairs-ismsia-m4a.mjs",
  "./lesson-repairs-ismsia-m4b.mjs", "./lesson-repairs-ismsia-m4c.mjs",
  "./lesson-repairs-ismsia-m5.mjs",
];
const spansBySlug = new Map();
for (const b of BATCHES) {
  let mod;
  try { mod = await import(new URL(b, "file:///" + HERE.replace(/\\/g, "/") + "/").href); }
  catch { continue; }   // a batch file that no longer exists is not an error here
  for (const r of mod.REPAIRS) {
    const list = spansBySlug.get(r.slug) ?? [];
    for (const sp of [r.en, ...(r.also ?? [])]) if (sp) list.push(sp.after);
    spansBySlug.set(r.slug, list);
  }
}
if (spansBySlug.size === 0) { console.error("no batch spans loaded -- extraction is broken"); process.exit(1); }

const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
function coordOf(md, needle) {
  const bs = blocks(md);
  for (let bi = 0; bi < bs.length; bi++) {
    const sol = solid(bs[bi]);
    for (let li = 0; li < sol.length; li++) {
      if (norm(sol[li].text).includes(norm(needle).slice(0, 60))) return { bi, li, text: sol[li].text };
    }
  }
  return null;
}
function cellAt(md, bi, li) {
  const bs = blocks(md);
  if (!bs[bi]) return null;
  return solid(bs[bi])[li] ?? null;
}

const flagged = await all("lessons?select=id,slug,language,lesson_group_id,content_md&mcp_translation_review_required=is.true");
const groupIds = [...new Set(flagged.map((r) => r.lesson_group_id))].filter(Boolean);
const ens = {};
for (const gid of groupIds) {
  const r = await all("lessons?select=id,slug,content_md,lesson_group_id&language=eq.en&lesson_group_id=eq." + gid);
  if (r[0]) ens[gid] = r[0];
}

const structural = [], incidental = [];
for (const row of flagged) {
  const en = ens[row.lesson_group_id];
  if (!en) continue;
  const seen = new Set();
  for (const after of spansBySlug.get(row.slug) ?? []) {
    const at = coordOf(en.content_md, after);
    if (!at) continue;
    const key = at.bi + "|" + at.li;
    if (seen.has(key)) continue;
    seen.add(key);
    const cell = cellAt(row.content_md, at.bi, at.li);
    if (!cell) continue;
    const lg = looksLikeLanguage(cell.text, row.language);
    const rec = {
      slug: row.slug, language: row.language, block: at.bi, line: at.li,
      want: lg.want, avoid: lg.avoid,
      english: at.text.trim().slice(0, 150),
      current: cell.text.trim().slice(0, 150),
    };
    if (!lg.ok && lg.want === 0 && lg.avoid === 0) structural.push(rec); else incidental.push(rec);
  }
}

console.log("");
console.log("HELD-PARAGRAPH TRIAGE -- no model calls, so this is reproducible");
console.log("  flagged lesson rows   " + flagged.length);
console.log("  repaired paragraphs located in them  " + (structural.length + incidental.length));
console.log("");
console.log("  STRUCTURAL (language guard ties 0/0 -- NO retry can pass)  " + structural.length);
console.log("  INCIDENTAL (retry-able; refusals were about one completion) " + incidental.length);
console.log("");

if (structural.length) {
  console.log("THE STRUCTURAL SET -- these are the ones that need a human or a guard change");
  const byLesson = new Map();
  for (const s of structural) {
    const k = s.slug + " / " + s.language;
    byLesson.set(k, (byLesson.get(k) ?? []).concat([s]));
  }
  for (const [k, list] of [...byLesson.entries()].sort()) {
    console.log("");
    console.log("  " + k + "   " + list.length + " paragraph(s)");
    for (const s of list.slice(0, VERBOSE ? 99 : 3)) {
      console.log("    b" + s.block + "l" + s.line);
      console.log("      EN : " + s.english);
      console.log("      now: " + s.current);
    }
    if (!VERBOSE && list.length > 3) console.log("    ... and " + (list.length - 3) + " more (--verbose)");
  }
}

if (JSON_OUT) {
  writeFileSync(JSON_OUT, JSON.stringify({ flagged_rows: flagged.length, structural, incidental }, null, 1) + "\n");
  console.log("");
  console.log("wrote " + JSON_OUT);
}
