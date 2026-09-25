#!/usr/bin/env node
/**
 * diff-english-checkpoint.mjs -- which ENGLISH fields moved, and therefore which
 * translated fields are allowed to move.
 *
 * READ-ONLY. `--spec <file>` (default BATCH1-RETRANSLATION.json), `--md <file>`.
 * Unknown flags exit 2.
 *
 * ============ THE RULE IS KEYED ON THE ENGLISH, NOT ON THE REGENERATION ============
 *
 * "14 of 24 fields changed" counts what the MODEL changed. That is a fact about
 * the regeneration, not a warrant for anything: a field whose English never moved
 * has no reason to be rewritten, and every rewritten word is an unreviewed word.
 *
 * So the authority is this diff. Per field:
 *
 *   ENGLISH UNCHANGED  ->  write the OLD translation back, byte for byte. Any
 *                          drift the regeneration introduced is discarded for
 *                          free, with nobody hand-fixing anything.
 *   ENGLISH CHANGED    ->  the new translation is admissible, gated at field
 *                          grain.
 *
 * A defect the gates flag in an OLD translation is PRE-EXISTING and is reported
 * separately. Writing the old text back does not fix it and does not make it
 * worse -- but it must not be mistaken for something this batch introduced, and
 * it must not be silently carried as though it had been reviewed.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkpointFields, parseCheckpoint } from "./lib/checkpoint-fields.mjs";

const KNOWN = new Set(["--spec", "--md"]);
const argv = process.argv.slice(2);
for (const a of argv) {
  if (a.startsWith("--") && !KNOWN.has(a)) { console.error("Unrecognised flag: " + a); process.exit(2); }
}
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const SPEC = val("--spec", "BATCH1-RETRANSLATION.json");
const MD = val("--md", "");

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

async function rest(path) {
  let last;
  for (let k = 0; k < 6; k++) {
    try {
      const r = await fetch(BASE + "/" + path, { headers: H, signal: AbortSignal.timeout(45000) });
      if (r.ok) return r.json();
      last = new Error("HTTP " + r.status);
    } catch (e) { last = e; }
    await new Promise((s) => setTimeout(s, 300 * (k + 1)));
  }
  throw last;
}

/** Every `::checkpoint` block in a body, as raw strings. */
export function checkpointBlocksOf(body) {
  const out = [];
  const re = /^::checkpoint[^\n]*\n[\s\S]*?\n(?=::|$)/gm;
  let m;
  while ((m = re.exec(body))) if (parseCheckpoint(m[0])) out.push(m[0]);
  if (!out.length) {
    /* A body with one checkpoint and nothing after it: take the tail. */
    const i = body.indexOf("::checkpoint");
    if (i >= 0 && parseCheckpoint(body.slice(i))) out.push(body.slice(i));
  }
  return out;
}

/** The live English checkpoint matching a spec row, found by QUESTION IDS rather
 *  than by ordinal -- a body can hold more than one checkpoint. */
function matchByIds(blocks, wantIds) {
  const key = wantIds.join(",");
  for (const b of blocks) {
    const p = parseCheckpoint(b);
    if (p && p.items.map((q) => q.id).join(",") === key) return b;
  }
  return null;
}

const spec = JSON.parse(readFileSync(join(ROOT, SPEC), "utf8"));
const slugs = [...new Set(spec.rows.map((r) => r.slug))];
const liveEn = new Map();
for (const s of slugs) {
  const r = await rest("lessons?select=slug,content_md&language=eq.en&slug=eq." + s);
  if (r[0]) liveEn.set(s, r[0].content_md);
}

const out = [];
const push = (s) => { out.push(s); console.log(s); };
const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

push("");
push("WHICH ENGLISH FIELDS MOVED -- " + SPEC);
push("  the rule is keyed on the ENGLISH diff, not on what the regeneration changed");
push("");

const rows = spec.rows.filter((r) => parseCheckpoint(r.english_source));
push("DENOMINATOR: " + rows.length + " checkpoint rendering(s) of " + spec.rows.length);
push("");

const verdicts = [];
for (const r of rows) {
  const oldEn = parseCheckpoint(r.english_source);
  const live = matchByIds(checkpointBlocksOf(liveEn.get(r.slug) || ""), oldEn.items.map((q) => q.id));
  const tag = r.slug + " " + r.language + " b" + r.block_index;
  if (!live) {
    /* THIRD STATE: the English block could not be located, so "unchanged" is not
     * an available answer and is not printed as one. */
    push("  UNLOCATED  " + tag + " -- no live English checkpoint with these question ids");
    verdicts.push({ tag, unlocated: true });
    continue;
  }
  const a = new Map(checkpointFields(r.english_source).map((f) => [f.path, f.text]));
  const b = new Map(checkpointFields(live).map((f) => [f.path, f.text]));
  const moved = [], held = [];
  for (const [p, t] of a) (b.has(p) && b.get(p) === t ? held : moved).push(p);
  push("  " + tag);
  push("      English fields: " + a.size + "   MOVED: " + moved.length + "   held: " + held.length);
  for (const p of moved) {
    push("      ~ " + p);
    push("          old en: " + trunc(a.get(p), 160));
    push("          new en: " + trunc(b.get(p) === undefined ? "(field gone)" : b.get(p), 160));
  }
  verdicts.push({ tag, slug: r.slug, lang: r.language, block: r.block_index, moved, held, live });
}

push("");
const totMoved = verdicts.reduce((n, v) => n + (v.moved ? v.moved.length : 0), 0);
const totHeld = verdicts.reduce((n, v) => n + (v.held ? v.held.length : 0), 0);
push("  " + totMoved + " English field(s) moved, " + totHeld + " held");
push("");
push("  CONSEQUENCE: " + totHeld + " translated field(s) are written back from the OLD");
push("  translation byte for byte, and " + totMoved + " take the new rendering.");

if (MD) {
  const md = ["# Which English checkpoint fields moved", "",
    "The field rule is keyed on the **English** diff, never on what the regeneration changed.",
    "A field whose English never moved has no warrant to be rewritten, so its old translation",
    "is written back byte for byte -- which discards any drift the regeneration introduced",
    "without anyone hand-fixing it.", "",
    "| block | English fields | moved | held |", "|---|---|---|---|"];
  for (const v of verdicts) {
    if (v.unlocated) { md.push("| `" + v.tag + "` | — | — | **unlocated** |"); continue; }
    md.push("| `" + v.tag + "` | " + (v.moved.length + v.held.length) + " | **" + v.moved.length +
      "** | " + v.held.length + " |");
  }
  md.push("", "**" + totMoved + " moved, " + totHeld + " held.**", "");
  for (const v of verdicts) {
    if (v.unlocated || !v.moved.length) continue;
    md.push("## `" + v.tag + "`", "", ...v.moved.map((p) => "- `" + p + "`"), "");
  }
  writeFileSync(join(ROOT, MD), md.join("\n"), "utf8");
  console.log("");
  console.log("  wrote " + MD);
}
