#!/usr/bin/env node
/**
 * audit-review-gate.mjs - what is actually behind the review gate, and which
 * of it carries a LEAK risk as opposed to a fidelity question?
 *
 * READ-ONLY. --json, --queue, --verbose. Unknown flags exit 2. No --apply.
 *
 * ============ THE ARGUMENT BEING TESTED ============
 *
 * `retranslate-repaired-passages.mjs` rests on an ordering claim, recorded in
 * its own header:
 *
 *   "Translating from the REPAIRED English cannot carry ISO's sentence, because
 *    the source no longer has it."
 *
 * If that holds, then for a paragraph whose translation was re-rendered AFTER
 * the repair, the gate is not protecting against a leak. It is asking whether
 * the register and the meaning are right -- a real question, and a different
 * one.
 *
 * ============ WHERE IT DOES NOT HOLD, AND THAT IS THE POINT ============
 *
 * The claim is about a PARAGRAPH that was re-translated. The gate is about a
 * ROW. `flag_translation_review` sets the flag on the whole lesson, so one
 * paragraph whose re-translation was REFUSED withholds an entire body -- and
 * that paragraph's translation still tracks the PRE-repair English, which is to
 * say ISO's sentence, rendered into Spanish or Portuguese.
 *
 * Those are the rows where the gate is still doing leak work. They are the
 * output of this script.
 *
 * ============ AND THE LIMIT ON THIS AUDIT ITSELF ============
 *
 * It CANNOT confirm that an un-re-translated paragraph carries ISO's expression.
 * The index is built from the English editions; a Spanish row scores zero by
 * construction. That is IP-POSITION section 6's stated gap and no amount of
 * arithmetic here closes it.
 *
 * So this does not measure leaks. It measures PROVENANCE: was this paragraph's
 * translation produced from repaired English, or is it older than the repair?
 * Provenance is knowable from the applied spec files, exactly. Leak status is
 * not knowable at all. Saying which is which is the whole value of this script.
 */
import { readFileSync, existsSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { reviewBlocks as blocks, solid } from "./lib/guide-runs.mjs";

const KNOWN = new Set(["--json", "--queue", "--verbose"]);
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
const QUEUE_OUT = arg("queue", "");
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
/* CLAUDE.md: a PostgREST read without pagination and a count assertion is a
 * floor, not a total. */
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

/* ------------------------------------- what was repaired, from the batches */
const BATCH_RE = /^lesson-(repairs|attributions)-.*\.mjs$/;
const batchFiles = readdirSync(HERE).filter((f) => BATCH_RE.test(f)).sort();
const repaired = new Map();          // slug -> [after-span, ...]
for (const f of batchFiles) {
  const mod = await import(new URL("./" + f, "file:///" + HERE.replace(/\\/g, "/") + "/").href);
  for (const r of mod.REPAIRS ?? []) {
    const list = repaired.get(r.slug) ?? [];
    for (const sp of [r.en, ...(r.also ?? [])]) if (sp?.after) list.push(sp.after);
    repaired.set(r.slug, list);
  }
}
if (repaired.size === 0) { console.error("no batch files loaded -- extraction is broken"); process.exit(1); }

/* ------------------- what got a fresh translation, from the applied specs */
const SPEC_RE = /(-tr|-retry|^modal-fix|^retranslate-spec)\.json$/;
const specFiles = readdirSync(ROOT).filter((f) => f.endsWith(".json") && SPEC_RE.test(f)).sort();
const fresh = new Set();             // lesson_id|bi|li
for (const f of specFiles) {
  let j;
  try { j = JSON.parse(readFileSync(join(ROOT, f), "utf8")); } catch { continue; }
  for (const e of j.entries ?? []) {
    for (const [, v] of Object.entries(e.languages ?? {})) {
      /* KEYED ON line_abs, NOT block/line. Including ::checkpoint and
       * ::interactive shifts every block index, so a coordinate written by an
       * earlier run means a different paragraph now. `line_abs` is an absolute
       * line number and is immune to the block scope -- which is exactly why
       * apply-marking-spec splices on it. Keying on the shifting pair would
       * have made every spec entry miss and reported the whole corpus as
       * never re-translated, loudly and wrongly. */
      if (v?.lesson_id != null && v?.line_abs != null) fresh.add(v.lesson_id + "|" + v.line_abs);
    }
  }
}
if (fresh.size === 0) { console.error("no applied translation specs loaded -- extraction is broken"); process.exit(1); }

console.log("");
console.log("SOURCES");
console.log("  repair batch files      " + batchFiles.length + "  (" + repaired.size + " slug(s))");
console.log("  applied translation specs " + specFiles.length + "  (" + fresh.size + " paragraph translation(s) recorded)");

/* ------------------------------------------------------------- the rows */
const certs = await all("certifications?select=id,code");
const mods = await all("modules?select=id,certification_id");
const certOfMod = new Map(mods.map((m) => [m.id, certs.find((c) => c.id === m.certification_id)?.code]));
const rows = await all("lessons?select=id,slug,language,module_id,lesson_group_id,content_md,mcp_servable,mcp_translation_review_required");

const gated = rows.filter((r) => r.language !== "en" && r.mcp_translation_review_required);
const enByGroup = new Map();
for (const r of rows) if (r.language === "en" && r.lesson_group_id) enByGroup.set(r.lesson_group_id, r);

const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
function coordOf(md, needle) {
  const bs = blocks(md);
  const key = norm(needle).slice(0, 60);
  for (let bi = 0; bi < bs.length; bi++) {
    const sol = solid(bs[bi]);
    for (let li = 0; li < sol.length; li++) {
      if (norm(sol[li].text).includes(key)) return { bi, li, abs: sol[li].abs, text: sol[li].text };
    }
  }
  return null;
}
function rawCoordOf(md, needle) {
  /* RAW FALLBACK. Two things sit outside every block BODY and were unlocatable
   * even after the scope widened: a block's own opening line -- blocks() starts
   * the body on the line AFTER `::concept title="..."`, and aims-ia-04-13's
   * repair edited a title -- and anything between blocks. The SAME defect as
   * the checkpoint one, surfaced by the locatability assertion within a minute
   * of that assertion existing. The fix is not another widening: it is to stop
   * requiring a paragraph to live in a block at all. apply-marking-spec already
   * splices on absolute line, so absolute line is the coordinate that always
   * exists. */
  const ls = String(md || "").split(/\r?\n/);
  const key = norm(needle).slice(0, 60);
  const i = ls.findIndex((L) => norm(L).includes(key));
  return i < 0 ? null : { bi: -1, li: -1, abs: i, text: ls[i] };
}

const cellAt = (md, bi, li) => {
  const bs = blocks(md);
  if (!bs[bi]) return null;
  return solid(bs[bi])[li] ?? null;
};

/* Which lesson rows any surviving spec covers at all. A row absent from every
 * spec is not evidence of anything: `retranslate-repaired-passages.mjs` writes
 * to `retranslate-spec.json` by DEFAULT, so every run launched without `--out`
 * overwrote the previous run's record. AIMS-F, ISMS-F and AIMS-IA module 1 were
 * re-translated under that default and their provenance is GONE. */
const coveredRows = new Set();
for (const f of specFiles) {
  let j;
  try { j = JSON.parse(readFileSync(join(ROOT, f), "utf8")); } catch { continue; }
  for (const e of j.entries ?? []) {
    for (const [, v] of Object.entries(e.languages ?? {})) if (v?.lesson_id != null) coveredRows.add(v.lesson_id);
  }
}

/* A SPAN THAT CANNOT BE LOCATED IS THE DEFECT THIS SCRIPT EXISTS TO PREVENT,
 * so it is counted and it fails the run. It used to `continue` silently, which
 * is how 54 repaired paragraphs sat outside every review for a week: the audit
 * reported on what it could see and said nothing about what it could not. */
/* Every `before` any batch uses. A span whose `after` appears here was replaced
 * by a later repair, so its absence is expected rather than a blind spot. */
const supersededAfters = new Set();
for (const f of batchFiles) {
  const mod = await import(new URL("./" + f, "file:///" + HERE.replace(/\\/g, "/") + "/").href);
  for (const r of mod.REPAIRS ?? []) {
    for (const sp of [r.en, ...(r.also ?? [])]) if (sp?.before) supersededAfters.add(norm(sp.before));
  }
}
let superseded = 0;
const unlocatable = [];
const stale = [];        // covered by a spec, and this paragraph is absent from it
const confirmed = [];    // recorded as re-translated from repaired English
const unknown = [];      // no surviving spec covers this row
for (const row of gated) {
  const en = enByGroup.get(row.lesson_group_id);
  if (!en) continue;
  const seen = new Set();
  for (const after of repaired.get(row.slug) ?? []) {
    let at = coordOf(en.content_md, after);
    if (!at) at = rawCoordOf(en.content_md, after);
    if (!at) {
      /* SUPERSEDED, NOT MISSING: a later batch replaced this span's `after`
       * (m4a-fix rewrote m4a's clause 6.1.2 recast), so the text is
       * legitimately gone. Told apart by asking whether any batch uses it
       * as a `before`. */
      /* CONTAINMENT, not equality. m4a-fix's `before` is a SUBSTRING of m4a's
       * `after` -- a correction usually re-anchors on part of what it replaces,
       * not all of it -- so an exact-match check found nothing and reported a
       * superseded span as an invisible one. */
      const na = norm(after);
      if ([...supersededAfters].some((b) => na.includes(b) || b.includes(na))) { superseded++; continue; }
      unlocatable.push({ slug: row.slug, language: row.language, after: after.slice(0, 90) });
      continue;
    }
    const ck = at.bi + "|" + at.li;
    if (seen.has(ck)) continue;
    seen.add(ck);
    const rec = {
      cert: certOfMod.get(row.module_id), slug: row.slug, language: row.language,
      lesson_id: row.id, block: at.bi, line: at.li,
    };
    const cell = cellAt(row.content_md, at.bi, at.li);
    if (cell && fresh.has(row.id + "|" + cell.abs)) confirmed.push(rec);
    else if (coveredRows.has(row.id)) stale.push(rec);
    else unknown.push(rec);
  }
}

console.log("");
console.log("LOCATABILITY -- a repaired span the audit cannot find is a paragraph no review reaches");
if (unlocatable.length === 0) {
  console.log("  ok    every repaired span was located (" + superseded + " superseded by a later repair)");
} else {
  console.log("  FAIL  " + unlocatable.length + " repaired span(s) could not be located:");
  for (const u of unlocatable.slice(0, 10)) console.log("    " + u.slug + "/" + u.language + "  " + u.after);
  process.exitCode = 1;
}

console.log("");
console.log("THE REVIEW GATE, BY WHAT IT IS ACTUALLY HOLDING");
console.log("  gated non-English rows                        " + gated.length);
console.log("  repaired paragraphs inside them               " + (stale.length + confirmed.length + unknown.length));
console.log("    recorded as re-translated from repaired English  " + confirmed.length + "   <- fidelity only");
console.log("    recorded as NOT re-translated                    " + stale.length + "   <- pre-repair source");
console.log("    NO SURVIVING RECORD EITHER WAY                   " + unknown.length + "   <- unknowable here");
console.log("");
console.log("  The third bucket is not a finding about the content. It is a finding about");
console.log("  the tooling: retranslate-repaired-passages writes retranslate-spec.json by");
console.log("  DEFAULT, so every run launched without --out overwrote the previous run's");
console.log("  record. `lessons` has no updated_at, so there is no second signal.");
console.log("");

const unknownRows = new Set(unknown.map((u) => u.cert + "|" + u.slug + "|" + u.language));
const staleRows = new Map();
for (const s of stale) {
  const k = s.cert + "|" + s.slug + "|" + s.language;
  staleRows.set(k, (staleRows.get(k) ?? []).concat([s]));
}
console.log("  rows with a recorded pre-repair paragraph    : " + staleRows.size);
console.log("  rows with no surviving record                : " + unknownRows.size);
console.log("  rows where every repaired paragraph is recorded done: " +
  (gated.length - staleRows.size - unknownRows.size));
console.log("");

const byCert = new Map();
for (const [k, list] of staleRows) {
  const cert = k.split("|")[0];
  const a = byCert.get(cert) ?? { rows: 0, paras: 0 };
  a.rows++; a.paras += list.length;
  byCert.set(cert, a);
}
if (byCert.size) {
  console.log("  ROWS NEEDING A HUMAN, by certification");
  for (const [c, a] of [...byCert.entries()].sort()) {
    console.log("    " + c.padEnd(10) + a.rows + " row(s), " + a.paras + " paragraph(s)");
  }
} else {
  console.log("  No gated row contains a paragraph older than its repair.");
}

if (VERBOSE) {
  console.log("");
  for (const [k, list] of [...staleRows.entries()].sort()) {
    console.log("  " + k.replace(/\|/g, "  ") + "   " + list.length + " paragraph(s): " +
      list.map((s) => "b" + s.block + "l" + s.line).join(" "));
  }
}

/* ------------------------------------------------------------- the queue */
if (QUEUE_OUT) {
  const enById = new Map(rows.filter((r) => r.language === "en").map((r) => [r.id, r]));
  const cellAt = (md, bi, li) => {
    const bs = blocks(md);
    if (!bs[bi]) return null;
    return solid(bs[bi])[li] ?? null;
  };
  const items = [];
  for (const [k, list] of [...staleRows.entries()].sort()) {
    const [cert, slug, language] = k.split("|");
    const row = rows.find((r) => r.slug === slug && r.language === language);
    const en = enByGroup.get(row.lesson_group_id);
    for (const s of list) {
      const enCell = cellAt(en.content_md, s.block, s.line);
      const tCell = cellAt(row.content_md, s.block, s.line);
      items.push({
        cert, slug, language, block: s.block, line: s.line,
        question: "Does this translation render the REPAIRED English, or the ISO sentence it replaced?",
        english_now: enCell ? enCell.text.trim() : null,
        translation_now: tCell ? tCell.text.trim() : null,
        verdict: "", notes: "",
      });
    }
  }
  writeFileSync(join(ROOT, QUEUE_OUT), JSON.stringify({
    generated: "audit-review-gate.mjs",
    what_this_is: "Paragraphs inside review-gated rows whose translation predates the English repair. " +
      "Every other gated paragraph was re-translated FROM repaired English and cannot carry ISO's sentence, " +
      "because the source no longer has it.",
    limit: "This cannot confirm a leak. The index is English-only, so a translated row measures zero by " +
      "construction (IP-POSITION section 6). It reports PROVENANCE, which is exact, not leak status, which is unknowable here.",
    rows: staleRows.size, paragraphs: items.length, items,
    no_surviving_record: {
      what_this_is: "Gated rows that no surviving translation spec covers. NOT a reading task. " +
        "The retranslator always renders from the CURRENT English, so anything it processed is safe " +
        "by the ordering argument; what is missing is the RECORD. retranslate-spec.json is the " +
        "DEFAULT --out, so every run launched without an explicit --out overwrote the previous " +
        "run's record, and `lessons` has no updated_at to fall back on. Re-running the translator " +
        "on these lessons resolves them mechanically and needs no human.",
      rows: [...unknownRows].length,
      list: [...unknownRows].sort().map((k) => {
        const [cert, slug, language] = k.split("|");
        return { cert, slug, language };
      }),
    },
  }, null, 1) + "\n");
  console.log("");
  console.log("wrote " + QUEUE_OUT + "  (" + items.length + " paragraph(s) across " + staleRows.size + " row(s))");
}

if (JSON_OUT) {
  writeFileSync(join(ROOT, JSON_OUT), JSON.stringify({
    gated_rows: gated.length, confirmed: confirmed.length, stale: stale.length,
    stale_rows: [...staleRows.keys()], by_cert: [...byCert.entries()],
  }, null, 1) + "\n");
  console.log("wrote " + JSON_OUT);
}
