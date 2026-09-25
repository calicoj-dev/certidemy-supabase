#!/usr/bin/env node
/**
 * check-spec-english-current.mjs -- is each emission still about the English it
 * was generated from?
 *
 * READ-ONLY. `--spec <file>` (default BATCH1-RETRANSLATION.json). Unknown flags
 * exit 2.
 *
 * ============ WHY THIS EXISTS ============
 *
 * A batch is emitted from the English as it stood. Then somebody fixes the
 * English -- which is the correct thing to do, and is exactly what happened here
 * on three lessons and on the 01-03 seam. The emission is now a translation of a
 * sentence that no longer exists, and NOTHING about it looks stale: it is
 * well-formed, it passes every render gate, and applying it would write a
 * faithful rendering of superseded text.
 *
 * This is the en_hash gate's question asked of a FILE instead of a row. The gate
 * protects the database; nothing protected the artifact sitting beside it.
 *
 * A stale row is reported as STALE, never silently regenerated, because which
 * ones to re-emit is a decision about cost and review, not a repair.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--spec"]);
const argv = process.argv.slice(2);
for (const a of argv) {
  if (a.startsWith("--") && !KNOWN.has(a)) { console.error("Unrecognised flag: " + a); process.exit(2); }
}
const i = argv.indexOf("--spec");
const SPEC = i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : "BATCH1-RETRANSLATION.json";

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

const spec = JSON.parse(readFileSync(join(ROOT, SPEC), "utf8"));
const slugs = [...new Set(spec.rows.map((r) => r.slug))];
const en = new Map();
for (const s of slugs) {
  const r = await rest("lessons?select=slug,content_md&language=eq.en&slug=eq." + s);
  if (r[0]) en.set(s, r[0].content_md);
}

console.log("");
console.log("IS EACH EMISSION STILL ABOUT THE LIVE ENGLISH? -- " + SPEC);
console.log("DENOMINATOR: " + spec.rows.length + " rendering(s), " + slugs.length + " lesson(s)");
console.log("");
let stale = 0, missing = 0;
const bySlug = new Map();
for (const r of spec.rows) {
  const body = en.get(r.slug);
  if (body === undefined) {
    /* THIRD STATE: no English row at all. Not "current", not "stale". */
    console.log("  NO ENGLISH  " + r.slug + " " + r.language + " b" + r.block_index);
    missing++; continue;
  }
  if (!body.includes(r.english_source)) {
    stale++;
    bySlug.set(r.slug, (bySlug.get(r.slug) || 0) + 1);
    console.log("  STALE  " + (r.slug + " " + r.language + " b" + r.block_index).padEnd(52) +
      "the source block is no longer in the English");
  }
}
console.log("");
console.log("  " + stale + " stale, " + missing + " with no English, " +
  (spec.rows.length - stale - missing) + " still match");
if (stale) {
  console.log("");
  console.log("  affected lessons:");
  for (const [s, n] of [...bySlug].sort()) console.log("    " + s + "  " + n + " rendering(s)");
  console.log("");
  console.log("  These must be RE-EMITTED, not applied. The emission is a faithful");
  console.log("  translation of a sentence that no longer exists.");
}
process.exitCode = stale || missing ? 1 : 0;
