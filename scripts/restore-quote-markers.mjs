#!/usr/bin/env node
/**
 * restore-quote-markers.mjs - put back the `>` a translation dropped.
 *
 * `--apply` writes; DRY BY DEFAULT. Reads check-attribution-parity's findings.
 * Unknown flags exit 2.
 *
 * ============ WHAT WENT WRONG, AND IT IS A LIST THAT WAS SHORT ============
 *
 * `retranslate-repaired-passages.mjs` tells the model:
 *
 *     "Reproduce every markdown marker exactly: **bold**, *italic*, and
 *      glossary annotations of the form [visible text]{glossary="key"}."
 *
 * Three marker kinds enumerated, and the BLOCKQUOTE omitted. So on eleven lines
 * the model returned a faithful translation with the `>` stripped, the applier
 * spliced it in as given, and a quotation set off in English became ordinary
 * prose in Spanish or Portuguese.
 *
 * The same shape as every other short-list defect in this repo: `requirement`
 * missing from the strong modal list, `obligations` missing beside
 * `obligation`, `could` missing beside `can`. An enumeration that is almost
 * complete reads as complete.
 *
 * ============ WHY IT MATTERED MORE THAN A DROPPED ADDRESS ============
 *
 * IP-POSITION section 6 permits clause text that is quoted AND attributed.
 * A line that has lost its `>` is not quoted at all -- so those eleven lines
 * were reproduction, in the two languages no instrument here can measure. The
 * address checker found the first of them SIDEWAYS, by reporting a missing
 * designation that was in fact present one line up; the marker check that found
 * the other ten exists because of that.
 *
 * ============ WHAT THIS DOES NOT DO ============
 *
 * It prepends a marker. It does not touch a single word of any translation, and
 * it refuses any line that is already a blockquote, so a re-run is a no-op.
 * The English is the source of truth for STRUCTURE -- if a line is a quotation
 * there, it is a quotation in every language, and that is a mechanical claim
 * rather than an editorial one.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { blocks, solid } from "./lib/guide-runs.mjs";
import { isQuoteLine } from "./lib/iso-segments.mjs";

const KNOWN = new Set(["--apply", "--from", "--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ".");
    console.error("--apply family: DRY BY DEFAULT. Known: " + [...KNOWN].join(", "));
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const APPLY = process.argv.includes("--apply");
const FROM = arg("from", "attrib-parity.json");

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
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
async function req(method, path, body) {
  let last;
  for (let i = 0; i < 12; i++) {
    try {
      const r = await fetch(BASE + "/" + path, {
        method, headers: H, body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(60000),
      });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 200));
      return t ? JSON.parse(t) : null;
    } catch (e) { last = e; }
  }
  throw last;
}

if (!existsSync(FROM)) {
  console.error(FROM + " not found. Run check-attribution-parity.mjs --json " + FROM + " first.");
  process.exit(2);
}
const found = JSON.parse(readFileSync(FROM, "utf8")).marker_findings ?? [];
console.log("");
console.log("RESTORE QUOTE MARKERS");
console.log("  findings in " + FROM + ": " + found.length);
console.log("  mode: " + (APPLY ? "APPLY" : "DRY"));
console.log("");
if (!found.length) { console.log("  nothing to do"); process.exit(0); }

/* Group by row: two lines of one body must be edited in one text and written
 * once, or the second write discards the first. */
const byRow = new Map();
for (const f of found) {
  const k = f.slug + "|" + f.language;
  byRow.set(k, (byRow.get(k) ?? []).concat([f]));
}

const problems = [], writes = [];
for (const [k, list] of byRow) {
  const [slug, language] = k.split("|");
  const rows = await req("GET", "lessons?select=id,content_md&slug=eq." + slug +
    "&language=eq." + encodeURIComponent(language));
  if (!rows || rows.length !== 1) { problems.push(k + ": " + (rows?.length ?? 0) + " row(s), expected 1"); continue; }

  /* Edit by ABSOLUTE line index so two edits in one block cannot shift each
   * other. `solid()` already carries the absolute index for exactly this. */
  const lines = rows[0].content_md.split(/(\r\n|\n)/);
  const bs = blocks(rows[0].content_md);
  const targets = [];
  let fail = null;
  for (const f of list) {
    const sol = bs[f.block] ? solid(bs[f.block]) : null;
    const cell = sol ? sol[f.line] : null;
    if (!cell) { fail = "b" + f.block + "l" + f.line + ": coordinate not found"; break; }
    if (isQuoteLine(cell.text)) { targets.push({ abs: cell.abs, already: true }); continue; }
    if (!cell.text.trim()) { fail = "b" + f.block + "l" + f.line + ": line is blank"; break; }
    targets.push({ abs: cell.abs, text: cell.text });
  }
  if (fail) { problems.push(k + ": " + fail); continue; }

  let changed = 0;
  for (const t of targets) {
    if (t.already) continue;
    const i = t.abs * 2;                       // split() keeps separators at odd indices
    if (lines[i] !== t.text) { fail = "line " + t.abs + ": text moved between read and splice"; break; }
    lines[i] = "> " + t.text.trimStart();
    changed++;
  }
  if (fail) { problems.push(k + ": " + fail); continue; }
  if (!changed) { console.log("  --   " + k + "   already marked"); continue; }

  const md = lines.join("");
  /* Post-condition on the new text, before it is written anywhere. */
  const nb = blocks(md);
  for (const f of list) {
    const sol = nb[f.block] ? solid(nb[f.block]) : null;
    if (!sol || !sol[f.line] || !isQuoteLine(sol[f.line].text)) {
      problems.push(k + ": b" + f.block + "l" + f.line + " is still not a blockquote after the splice");
    }
  }
  writes.push({ id: rows[0].id, k, md, changed });
  console.log("  ok   " + k + "   " + changed + " marker(s)");
}

console.log("");
if (problems.length) {
  console.log(problems.length + " PROBLEM(S). NOTHING WRITTEN.");
  for (const p of problems) console.log("  X " + p);
  process.exit(1);
}
console.log("rows to write: " + writes.length +
  "   markers: " + writes.reduce((a, w) => a + w.changed, 0));

if (!APPLY) {
  console.log("");
  console.log("Dry run. Nothing written. Re-run with --apply.");
  process.exit(0);
}
for (const w of writes) await req("PATCH", "lessons?id=eq." + w.id, { content_md: w.md });
console.log("");
console.log("wrote " + writes.length + " row(s)");

/* READ BACK from the stored rows. A 200 is not evidence. */
let bad = 0;
for (const [k, list] of byRow) {
  const [slug, language] = k.split("|");
  const rows = await req("GET", "lessons?select=content_md&slug=eq." + slug +
    "&language=eq." + encodeURIComponent(language));
  const bs2 = blocks(rows[0].content_md);
  for (const f of list) {
    const sol = bs2[f.block] ? solid(bs2[f.block]) : null;
    if (!sol || !sol[f.line] || !isQuoteLine(sol[f.line].text)) {
      console.log("  X READBACK " + k + " b" + f.block + "l" + f.line + ": not a blockquote in the stored row");
      bad++;
    }
  }
}
console.log(bad === 0 ? "readback: all " + found.length + " line(s) are blockquotes in the stored rows"
                      : "READBACK FAILED on " + bad + " line(s)");
process.exitCode = bad === 0 ? 0 : 1;
