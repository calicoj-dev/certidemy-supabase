#!/usr/bin/env node
/**
 * gate-corpus-g1-g2.mjs -- G1 (structure) and G2 (carried English title) over
 * every translated lesson body.
 *
 * READ-ONLY. `--json <file>`, `--md <file>`, `--examples <n>` (default 10).
 * Unknown flags exit 2. REPORT ONLY -- nothing is withheld, nothing is written.
 *
 * ============ WHAT THESE TWO CAN AND CANNOT SAY ============
 *
 * G1 counts MARKER LINES inside a block -- directives, fences, blockquote
 * markers, list bullets -- and compares the translation against its English.
 * A difference is a framing change: a dropped closing fence leaves a concept
 * block open, an added `>` renders our own prose as a quotation of the standard.
 * It is mechanical and it says nothing about meaning.
 *
 * G2 looks inside `::directive title="..."` and fires when the translated title
 * is byte-identical to the English one. That is carried English, invisible to
 * every prose check because no prose check reads a directive attribute.
 *
 * ============ WHY THE COUNT IS PER ROW AND PER BLOCK ============
 *
 * A body with one broken block and a body with nine are different problems and
 * a row count cannot tell them apart. Both are reported, and the examples are
 * drawn across distinct lessons rather than from whichever body fires most --
 * ten examples from one pathological lesson would describe that lesson, not the
 * corpus.
 *
 * ============ BLOCK ALIGNMENT IS BY INDEX, AND ITS FAILURE IS A RESULT ======
 *
 * Where the English and the translation do not have the same number of blocks,
 * per-block comparison is meaningless -- comparing block 4 against block 5
 * manufactures findings for every block after the first divergence. Those rows
 * are reported as UNALIGNABLE, their own state, and are NOT folded into either
 * the fired or the clean count.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { g1Structure, g2CarriedTitle, renderGateControls } from "./lib/render-gates.mjs";
import { blocksOf } from "./lib/translation-checks.mjs";
import { acquireHeavyReaderLock } from "./lib/heavy-reader-lock.mjs";

const KNOWN = new Set(["--json", "--md", "--examples"]);
const argv = process.argv.slice(2);
for (const a of argv) {
  if (a.startsWith("--") && !KNOWN.has(a)) { console.error("Unrecognised flag: " + a); process.exit(2); }
}
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const JSONOUT = val("--json", ""), MD = val("--md", ""), N_EX = Number(val("--examples", "10"));

const broken = renderGateControls();
if (broken.length) {
  console.error("FIXTURE FAILURES: " + broken.join("; "));
  console.error("No verdict printed: a gate that does not fire on its own example is not a gate.");
  process.exit(2);
}

const releaseLock = await acquireHeavyReaderLock("gate-corpus-g1-g2");

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
const REST = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };

/* Paged with a count assertion. A floor is not a total, and the loop terminates
 * on REACHING THE TOTAL rather than on a page that merely looked short. */
async function allLessons() {
  const rows = [], PAGE = 400;
  let total = null;
  for (let from = 0; ; from += PAGE) {
    const r = await fetch(REST + "/lessons?select=slug,language,lesson_group_id,content_md&order=lesson_group_id,language",
      { headers: { ...H, Range: from + "-" + (from + PAGE - 1), Prefer: "count=exact" },
        signal: AbortSignal.timeout(60000) });
    if (!r.ok) throw new Error("HTTP " + r.status + " reading lessons");
    const n = Number(String(r.headers.get("content-range") || "").split("/")[1]);
    if (!Number.isFinite(n)) throw new Error("no content-range -- a dropped read is not a zero");
    total = n;
    const page = await r.json();
    rows.push(...page);
    if (rows.length >= total || !page.length) break;
  }
  if (rows.length !== total) throw new Error("SHORT READ: collected " + rows.length + ", server says " + total);
  return rows;
}

const lessons = await allLessons();
releaseLock();

const enOf = new Map(lessons.filter((r) => r.language === "en").map((r) => [r.lesson_group_id, r]));
const targets = lessons.filter((r) => r.language !== "en");

const g1Rows = [], g2Rows = [], unalignable = [];
let g1Blocks = 0, g2Blocks = 0, blocksCompared = 0, noEnglish = 0;

for (const r of targets) {
  const en = enOf.get(r.lesson_group_id);
  if (!en) { noEnglish++; continue; }
  const eb = blocksOf(en.content_md), tb = blocksOf(r.content_md);
  if (eb.length !== tb.length) {
    unalignable.push({ slug: r.slug, language: r.language, en: eb.length, tr: tb.length });
    continue;
  }
  const g1Here = [], g2Here = [];
  for (let i = 0; i < eb.length; i++) {
    blocksCompared++;
    for (const f of g1Structure(eb[i], tb[i])) g1Here.push({ block: i, detail: f.detail });
    for (const f of g2CarriedTitle(eb[i], tb[i])) g2Here.push({ block: i, detail: f.detail });
  }
  if (g1Here.length) { g1Rows.push({ slug: r.slug, language: r.language, hits: g1Here }); g1Blocks += g1Here.length; }
  if (g2Here.length) { g2Rows.push({ slug: r.slug, language: r.language, hits: g2Here }); g2Blocks += g2Here.length; }
}

/* Examples spread ACROSS DISTINCT LESSONS. Ten from one pathological body would
 * describe that body rather than the corpus. */
function spread(rows, n) {
  const bySlug = new Map();
  for (const r of rows) if (!bySlug.has(r.slug)) bySlug.set(r.slug, r);
  const out = [...bySlug.values()].slice(0, n);
  if (out.length < n) for (const r of rows) { if (out.length >= n) break; if (!out.includes(r)) out.push(r); }
  return out;
}

const out = [];
const push = (s) => { out.push(s); console.log(s); };
push("");
push("G1 / G2 OVER THE TRANSLATED CORPUS -- report only, nothing withheld");
push("DENOMINATOR: " + targets.length + " translated row(s), " + blocksCompared + " block pair(s) compared");
push("");
push("  rows with no English sibling        " + noEnglish);
push("  rows UNALIGNABLE (block counts differ, so per-block comparison is void)   " + unalignable.length);
push("");
push("  G1 structure   rows " + String(g1Rows.length).padStart(4) + "   block hits " + g1Blocks);
push("  G2 carried EN  rows " + String(g2Rows.length).padStart(4) + "   block hits " + g2Blocks);
push("");
for (const [label, rows] of [["G1 STRUCTURE", g1Rows], ["G2 CARRIED ENGLISH TITLE", g2Rows]]) {
  push("  " + label + " -- " + Math.min(N_EX, rows.length) + " example(s), one per lesson:");
  if (!rows.length) push("      none");
  for (const r of spread(rows, N_EX)) {
    push("      " + (r.slug + " " + r.language).padEnd(52) + "b" + r.hits[0].block + "  " + r.hits[0].detail);
  }
  push("");
}
if (unalignable.length) {
  push("  UNALIGNABLE -- " + Math.min(N_EX, unalignable.length) + " example(s):");
  for (const u of unalignable.slice(0, N_EX)) {
    push("      " + (u.slug + " " + u.language).padEnd(52) + "en " + u.en + " blocks, tr " + u.tr);
  }
  push("");
}
push("  A row is UNALIGNABLE, not clean and not failing: comparing block 4 against");
push("  block 5 manufactures a finding for every block after the divergence.");

if (JSONOUT) {
  writeFileSync(join(ROOT, JSONOUT), JSON.stringify({
    measured: new Date().toISOString().slice(0, 10),
    rows_examined: targets.length, blocks_compared: blocksCompared,
    g1: { rows: g1Rows.length, blocks: g1Blocks, members: g1Rows },
    g2: { rows: g2Rows.length, blocks: g2Blocks, members: g2Rows },
    unalignable, no_english: noEnglish,
  }, null, 2), "utf8");
  console.log("  wrote " + JSONOUT);
}
if (MD) { writeFileSync(join(ROOT, MD), out.join("\n") + "\n", "utf8"); console.log("  wrote " + MD); }
