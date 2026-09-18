#!/usr/bin/env node
/**
 * measure-unreachable-paragraphs.mjs - which repaired paragraphs can no review
 * and no re-translation ever reach?
 *
 * READ-ONLY. --json, --verbose. Unknown flags exit 2. No --apply.
 *
 * ============ THE DEFECT ============
 *
 * `guide-runs.mjs` `blocks()` ends:
 *
 *     if (PUBLISHED_BLOCKS.has(type)) out.push({ type, body, openAbs });
 *
 * and `PUBLISHED_BLOCKS` is hook, concept, callout, summary, deep-dive.
 * `checkpoint` is not in it, so `blocks()` silently DROPS every checkpoint
 * block -- and three things are built on `blocks()`:
 *
 *   retranslate-repaired-passages  locates a paragraph to re-translate
 *   audit-review-gate             locates a paragraph to classify
 *   triage-held-paragraphs        locates a paragraph to triage
 *
 * So a repaired paragraph inside a checkpoint was never re-translated, never
 * classified, and never queued. Its English carries the repair and its
 * translation still renders the sentence the repair removed, and nothing in the
 * pipeline can see it.
 *
 * ============ WHY THE ENGLISH REPAIR STILL LANDED ============
 *
 * `gen-lesson-repair-spec-aimsf.mjs` locates spans with its own line scan and
 * `apply-marking-spec.mjs` splices by ABSOLUTE line index. Neither goes through
 * `blocks()`. So the English half of the pipeline reaches checkpoints and the
 * translation half does not -- which is why the gap is invisible: every English
 * repair looks complete, because it is.
 *
 * ============ WHAT THIS MEASURES ============
 *
 * Every span in every repair batch, located in the English by a RAW line scan,
 * and the `::type` block it falls inside. Anything in a type outside
 * PUBLISHED_BLOCKS is unreachable by review. That is the class.
 */
import { readFileSync, existsSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PUBLISHED_BLOCKS } from "./lib/guide-runs.mjs";

const KNOWN = new Set(["--json", "--verbose"]);
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
const ROOT = join(HERE, "..");
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
async function raw(p, x = {}) {
  let last;
  for (let i = 0; i < 12; i++) {
    try {
      const r = await fetch(BASE + "/" + p, { headers: { ...H, ...x }, signal: AbortSignal.timeout(60000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 180));
      return { rows: JSON.parse(t), range: r.headers.get("content-range") };
    } catch (e) { last = e; }
  }
  throw last;
}
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

/** Every `::type` region, INCLUDING the ones blocks() drops. */
function regions(md) {
  const lines = String(md || "").split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t.startsWith("::") || t === "::") continue;
    const type = t.slice(2).split(/[ {]/)[0];
    let j = i + 1;
    while (j < lines.length && lines[j].trim() !== "::") j++;
    out.push({ type, from: i, to: j });
    i = j;
  }
  return out;
}
const typeAt = (regs, line) => {
  for (const r of regs) if (line > r.from && line < r.to) return r.type;
  return "(outside any block)";
};

const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

/* ---------------------------------------------------- the repaired spans */
const BATCH_RE = /^lesson-(repairs|attributions)-.*\.mjs$/;
const files = readdirSync(HERE).filter((f) => BATCH_RE.test(f)).sort();
const spans = [];
for (const f of files) {
  const mod = await import(new URL("./" + f, "file:///" + HERE.replace(/\\/g, "/") + "/").href);
  for (const r of mod.REPAIRS ?? []) {
    for (const sp of [r.en, ...(r.also ?? [])]) {
      if (sp?.after) spans.push({ cert: r.cert, slug: r.slug, after: sp.after, file: f });
    }
  }
}
if (!spans.length) { console.error("no spans loaded -- extraction is broken"); process.exit(1); }

const rows = await all("lessons?select=id,slug,language,content_md&language=eq.en");
const enBySlug = new Map(rows.map((r) => [r.slug, r]));

console.log("");
console.log("PUBLISHED_BLOCKS = " + [...PUBLISHED_BLOCKS].join(", "));
console.log("Anything outside that set is dropped by blocks(), and every review");
console.log("and re-translation path is built on blocks().");
console.log("");

const byType = new Map();
const unreachable = [];
let located = 0, missing = 0;
for (const s of spans) {
  const en = enBySlug.get(s.slug);
  if (!en) continue;
  const lines = en.content_md.split(/\r?\n/);
  const key = norm(s.after).slice(0, 60);
  const idx = lines.findIndex((L) => norm(L).includes(key));
  if (idx < 0) { missing++; continue; }
  located++;
  const t = typeAt(regions(en.content_md), idx);
  byType.set(t, (byType.get(t) ?? 0) + 1);
  if (t !== "(outside any block)" && !PUBLISHED_BLOCKS.has(t)) {
    unreachable.push({ cert: s.cert, slug: s.slug, line: idx, type: t, text: lines[idx].trim().slice(0, 150) });
  }
}

console.log("REPAIRED SPANS BY ENCLOSING BLOCK TYPE");
console.log("  located in the English " + located + "   not found " + missing);
console.log("");
for (const [t, v] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
  const reach = t === "(outside any block)" ? "dropped by blocks() too" : (PUBLISHED_BLOCKS.has(t) ? "reachable" : "UNREACHABLE");
  console.log("  " + t.padEnd(24) + String(v).padStart(4) + "   " + reach);
}

console.log("");
console.log("UNREACHABLE BY REVIEW: " + unreachable.length + " repaired span(s)");
const byCert = new Map();
for (const u of unreachable) byCert.set(u.cert, (byCert.get(u.cert) ?? 0) + 1);
for (const [c, v] of [...byCert.entries()].sort()) console.log("    " + c.padEnd(10) + v);
const slugs = new Set(unreachable.map((u) => u.slug));
console.log("  across " + slugs.size + " lesson(s)");

if (VERBOSE) {
  console.log("");
  for (const u of unreachable.slice(0, 40)) {
    console.log("  " + u.cert + " " + u.slug + "  line " + u.line + "  ::" + u.type);
    console.log("      " + u.text);
  }
}

if (JSON_OUT) {
  writeFileSync(join(ROOT, JSON_OUT), JSON.stringify({
    published_blocks: [...PUBLISHED_BLOCKS],
    located, missing,
    by_type: [...byType.entries()],
    unreachable_count: unreachable.length,
    unreachable_lessons: [...slugs].sort(),
    unreachable,
  }, null, 1) + "\n");
  console.log("");
  console.log("wrote " + JSON_OUT);
}
