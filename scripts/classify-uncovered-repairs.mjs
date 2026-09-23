#!/usr/bin/env node
/**
 * classify-uncovered-repairs.mjs -- of the lessons whose English was repaired
 * with no retranslation record, which repairs REMOVED REPRODUCED ISO TEXT and
 * which were wording?
 *
 * READ-ONLY. Takes --json, --cert, --verbose. Unknown flags exit 2.
 *
 * ============ WHY THE TWO KINDS ARE NOT THE SAME PROBLEM ============
 *
 * REPRODUCTION-REMOVAL  the repair took out ISO's own sentence and replaced it
 *                       with ours. If the translation was never regenerated,
 *                       the Spanish still renders ISO's sentence -- and the
 *                       leak index is English-only, so nothing can see it.
 *                       THIS is the hazard.
 *
 * WORDING               a modal, a clause word, a register fix. Left
 *                       untranslated it is a quality nit.
 *
 * ============ CLASSIFIED BY MEASUREMENT, NOT BY LABEL ============
 *
 * Every repair entry carries an `address` naming an ISO clause and a `note`
 * counting "runs", so the labels all SAY reproduction. Believing them would be
 * reasoning from the name -- this file has a rule about that, paid for twice.
 *
 * So each repair's BEFORE text is scored against the indexed ISO corpus with
 * the repository's own scorer. A before-text that matches a run of ISO's words
 * WAS a reproduction, whatever the note says; one that does not was wording,
 * whatever the note says. The run and the source are printed beside every
 * verdict so the call can be checked rather than taken.
 *
 * ============ WHAT IT CANNOT DO ============
 *
 * It locates the translated span by BLOCK COORDINATE -- the (block, line) of
 * the repaired text in the English, read back at the same coordinate in each
 * translation, and VERIFIED by requiring the English cell to still contain the
 * span. Measured 2026-09-23: 369 of 371 aligned, 2 unjudgeable, and both of
 * those are spans whose repaired text is not in the live English at all.
 *
 * An earlier version aligned by PARAGRAPH ORDINAL and reported success on 370
 * of 371 while being wrong on a quarter of the sample a human read -- five of
 * twenty landed on a ::checkpoint JSON blob instead of the prose. It is still
 * alignment by position rather than by meaning; what changed is that the
 * position is now structural and checked.
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildSources, score, firesUnion, matchingSources, MIN_RUN, MIN_COV, ABS_RUN } from "./lib/leak-score.mjs";
import { reviewBlocks, solid } from "./lib/guide-runs.mjs";

const KNOWN = new Set(["--json", "--verbose"]);
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (!a.startsWith("--")) continue;
  if (a === "--cert") { i++; continue; }
  if (!KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". READ-ONLY; takes --json, --verbose, --cert <CODE>.");
    process.exit(2);
  }
}
const JSON_OUT = args.includes("--json");
const VERBOSE = args.includes("--verbose");
const ONLY_CERT = args.includes("--cert") ? args[args.indexOf("--cert") + 1] : null;

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

async function allRows(path) {
  const out = []; let from = 0, total = null;
  for (;;) {
    const r = await fetch(BASE + "/" + path, { headers: { ...H, Range: from + "-" + (from + 499), Prefer: "count=exact" } });
    if (!r.ok) throw new Error("HTTP " + r.status + " on " + path);
    total = Number(String(r.headers.get("content-range") || "").split("/")[1]);
    const page = await r.json(); out.push(...page);
    if (out.length >= total || page.length === 0) break;
    from += 500;
  }
  if (out.length !== total) throw new Error("SHORT READ on " + path + ": " + out.length + " of " + total);
  return out;
}

/* ---------------------------------------------- the uncovered set */
const parity = JSON.parse(readFileSync(join(ROOT, "REPAIR-TRANSLATION-PARITY.json"), "utf8"));
const uncovered = new Set(parity.uncovered);

/* ---------------------------------------------- every repair span */
const modules = readdirSync(HERE).filter((f) => /^lesson-repairs-.*\.mjs$/.test(f));
const repairs = [];
for (const f of modules) {
  let mod;
  try { mod = await import(pathToFileURL(join(HERE, f)).href); } catch { continue; }
  for (const r of mod.REPAIRS ?? []) {
    if (!uncovered.has(r.slug)) continue;
    for (const sp of [r.en, ...(r.also ?? [])]) {
      if (!sp?.before || !sp?.after) continue;
      repairs.push({ file: f, cert: r.cert, slug: r.slug, address: r.address, note: r.note, ...sp });
    }
  }
}

/* ---------------------------------------------- score each BEFORE */
const sources = buildSources();
for (const r of repairs) {
  const s = score(r.before, sources);
  r.run = s.unionRun; r.cov = Number(s.unionCov?.toFixed?.(2) ?? s.unionCov);
  r.srcs = matchingSources ? matchingSources(r.before, sources) : null;
  r.reproduction = firesUnion(s);
}

/* ---------------------------------------------- live bodies */
const lessons = await allRows("lessons?select=slug,language,content_md");
const bySlug = new Map();
for (const l of lessons) {
  const m = bySlug.get(l.slug) ?? {};
  m[l.language] = l.content_md ?? "";
  bySlug.set(l.slug, m);
}
const paras = (t) => String(t).split(/\n\s*\n/).map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean);

/* ============ ALIGNMENT BY BLOCK COORDINATE, NOT PARAGRAPH ORDINAL =========
 *
 * The ordinal version REPORTED SUCCESS on 370 of 371 spans and was wrong on a
 * quarter of the sample anyone actually read: 5 of 20 landed on a
 * `::checkpoint` JSON blob instead of the repaired prose. A checkpoint is one
 * enormous paragraph, so a repair inside one -- or anywhere after the
 * languages' paragraph counts diverge -- aligns to the wrong thing and says
 * nothing about it.
 *
 * THAT IS A SILENT SUCCESS IN THE INSTRUMENT, not a gap in it: "aligned" meant
 * "an index existed", never "the index points at the matching text".
 *
 * The repository already has the right primitive. `reviewBlocks(md)` splits
 * into structural blocks and `solid(b)` gives a block's non-empty lines, which
 * is how retranslate-repaired-passages addresses a span when it writes one. So
 * the span is located as (block, line) in the ENGLISH and the same coordinate
 * is read in each translation.
 *
 * AND THE ALIGNMENT IS VERIFIED, not assumed: the English cell found by
 * coordinate must still contain the needle. If it does not, the row is
 * MIS-ALIGNED and says so rather than presenting a paragraph as evidence. */
const coordOf = (md, needle) => {
  const bs = reviewBlocks(md);
  for (let bi = 0; bi < bs.length; bi++) {
    const sol = solid(bs[bi]);
    for (let li = 0; li < sol.length; li++) {
      if (sol[li].text.replace(/\s+/g, " ").includes(needle)) return { bi, li };
    }
  }
  return null;
};
const cellAt = (md, bi, li) => {
  const bs = reviewBlocks(md);
  if (!bs[bi]) return null;
  return solid(bs[bi])[li]?.text ?? null;
};

for (const r of repairs) {
  const b = bySlug.get(r.slug) ?? {};
  const needle = r.after.replace(/\s+/g, " ").trim();
  const c = coordOf(b.en ?? "", needle);
  r.enLanded = c !== null;
  if (!c) { r.align = "english span not found -- repaired text is not in the live body"; continue; }

  const enCell = cellAt(b.en ?? "", c.bi, c.li);
  if (!enCell || !enCell.replace(/\s+/g, " ").includes(needle)) {
    r.align = "MIS-ALIGNED -- the coordinate does not read back the English span";
    continue;
  }
  const es = cellAt(b["es-419"] ?? "", c.bi, c.li);
  const pt = cellAt(b["pt-BR"] ?? "", c.bi, c.li);
  if (es === null || pt === null) {
    r.align = "block " + c.bi + " line " + c.li + " has no counterpart (es " +
              (es === null ? "missing" : "ok") + ", pt " + (pt === null ? "missing" : "ok") + ")";
    continue;
  }
  r.align = "block " + c.bi + ", line " + c.li;
  r.liveEn = enCell; r.liveEs = es; r.livePt = pt;
}

/* ---------------------------------------------- report */
const bySlugVerdict = new Map();
for (const r of repairs) {
  const cur = bySlugVerdict.get(r.slug) ?? { cert: r.cert, reproduction: false, spans: 0 };
  cur.spans++; if (r.reproduction) cur.reproduction = true;
  bySlugVerdict.set(r.slug, cur);
}

console.log("");
console.log("UNCOVERED REPAIRS, CLASSIFIED BY MEASURING THE BEFORE TEXT");
console.log("  gate: unionRun >= " + MIN_RUN + " AND cov >= " + MIN_COV + ", OR unionRun >= " + ABS_RUN);
console.log("");
console.log("  uncovered lessons in the parity report   " + uncovered.size);
console.log("  of those, found in a repair module       " + bySlugVerdict.size);
console.log("  repair spans examined                    " + repairs.length);
console.log("");

const certs = [...new Set([...bySlugVerdict.values()].map((v) => v.cert))].sort();
console.log("  cert        lessons   REPRODUCTION-REMOVAL   wording");
for (const c of certs) {
  const rows = [...bySlugVerdict.values()].filter((v) => v.cert === c);
  const rep = rows.filter((v) => v.reproduction).length;
  console.log("  " + String(c).padEnd(12) + String(rows.length).padStart(5) + String(rep).padStart(22) + String(rows.length - rep).padStart(10));
}
const totalRep = [...bySlugVerdict.values()].filter((v) => v.reproduction).length;
console.log("");
console.log("  TOTAL reproduction-removal lessons: " + totalRep + " of " + bySlugVerdict.size);

const missing = [...uncovered].filter((s) => !bySlugVerdict.has(s));
if (missing.length) {
  console.log("");
  console.log("  NOT FOUND IN ANY REPAIR MODULE: " + missing.length + " lesson(s)");
  console.log("  They were named by a non-module repair script, so no before/after is available here.");
  if (VERBOSE) for (const s of missing) console.log("    " + s);
}

const repSpans = repairs.filter((r) => r.reproduction && (!ONLY_CERT || r.cert === ONLY_CERT));
if (repSpans.length) {
  console.log("");
  console.log("  ===== REPRODUCTION-REMOVAL SPANS" + (ONLY_CERT ? " (" + ONLY_CERT + ")" : "") + " =====");
  for (const r of repSpans) {
    console.log("");
    console.log("  " + r.cert + "  " + r.slug + "   [" + r.address + "]");
    console.log("    run " + r.run + "w  cov " + r.cov + (r.srcs?.length ? "  in " + r.srcs.join(", ") : ""));
    console.log("    EN before : " + r.before.slice(0, 200));
    console.log("    EN after  : " + r.after.slice(0, 200));
    console.log("    landed    : " + (r.enLanded ? "yes" : "NO -- the repair is not in the live English"));
    console.log("    align     : " + r.align);
    if (r.liveEs) console.log("    live es   : " + r.liveEs.slice(0, 220));
    if (r.livePt) console.log("    live pt   : " + r.livePt.slice(0, 220));
  }
}

if (JSON_OUT) {
  writeFileSync(join(ROOT, "UNCOVERED-REPAIRS-CLASSIFIED.json"), JSON.stringify({
    measured: new Date().toISOString(),
    gate: { MIN_RUN, MIN_COV, ABS_RUN },
    uncovered: uncovered.size, classified: bySlugVerdict.size, spans: repairs.length,
    per_cert: certs.map((c) => {
      const rows = [...bySlugVerdict.entries()].filter(([, v]) => v.cert === c);
      return { cert: c, lessons: rows.length, reproduction: rows.filter(([, v]) => v.reproduction).length };
    }),
    not_in_a_module: missing,
    spans_detail: repairs,
  }, null, 2), "utf8");
  console.log("");
  console.log("  wrote UNCOVERED-REPAIRS-CLASSIFIED.json");
}
