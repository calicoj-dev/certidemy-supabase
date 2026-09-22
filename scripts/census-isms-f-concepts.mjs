#!/usr/bin/env node
/**
 * census-isms-f-concepts.mjs - what ISMS-F's 192 concept descriptions ARE.
 *
 * READ-ONLY. No --apply, no writes, unknown flags exit 2. Fixes nothing.
 *
 * ============ WHY A CENSUS AND NOT A SAMPLE ============
 *
 * ISMS-F is the opposite shape from AIMS-F. AIMS-F had 154 stub descriptions
 * and the job was to write definitions that did not exist. ISMS-F's 192 exist,
 * are real prose, and have been serving. The suspicion is that some are too
 * good -- because they are ISO's.
 *
 * Everything pointing here was measured on partial reads, and a partial read
 * of this corpus has already produced four wrong rulings in a week. So: all
 * 192, every question answered over the whole set, before anything is rewritten.
 *
 * ============ WHAT IT WILL NOT DO ============
 *
 * It does not decide whether a description is a gloss. That needs judgement
 * about whether prose teaches, and a score invented for it would be 192
 * numbers nobody trusts. It reports the SHAPE (definitional vs explanatory)
 * as a structural signal and says plainly that the signal is not the ruling.
 */
import { readFileSync, existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, pdftotextAvailable, expectedWords, MANIFEST } from "./lib/citation-index.mjs";

for (const a of process.argv.slice(2)) {
  if (a.startsWith("--")) { console.error("Unrecognised flag: " + a + ". READ-ONLY, no flags."); process.exit(2); }
}

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

/** Page to exhaustion AND assert against the server's count. */
async function allRows(path) {
  const out = []; let from = 0, total = null;
  for (;;) {
    let page = null;
    for (let i = 0; i < 8; i++) {
      try {
        const r = await fetch(BASE + "/" + path, {
          headers: { ...H, Range: from + "-" + (from + 499), Prefer: "count=exact" },
          signal: AbortSignal.timeout(60000),
        });
        if (!r.ok) throw new Error("HTTP " + r.status + " " + (await r.text()).slice(0, 160));
        total = Number(String(r.headers.get("content-range") || "").split("/")[1]);
        page = await r.json(); break;
      } catch (e) { if (i === 7) throw e; }
    }
    out.push(...page);
    if (page.length < 500) break;
    from += 500;
  }
  if (!Number.isFinite(total)) throw new Error("no content-range on " + path);
  if (out.length !== total) throw new Error("PAGING INCOMPLETE on " + path + ": " + out.length + " of " + total);
  return out;
}

/* ------------------------------------------------------------- the index */
const MIN_RUN = 4, MIN_COV = 0.60, SEED = 4;

if (!pdftotextAvailable()) {
  console.error("pdftotext is not on PATH. choco install poppler / brew install poppler.");
  process.exit(2);
}
for (const [k, p] of Object.entries(PDFS)) if (!existsSync(p)) { console.error("MISSING " + k + " at " + p); process.exit(2); }

const norm = (s) => String(s || "").toLowerCase()
  .replace(/[‘’]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
const W = (s) => norm(s).split(" ").filter(Boolean);

const perSource = new Map();
for (const [key, p] of Object.entries(PDFS)) {
  const o = join(mkdtempSync(join(tmpdir(), "iso-")), "t.txt");
  execFileSync("pdftotext", ["-layout", p, o]);
  const w = W(readFileSync(o, "utf8"));
  if (w.length !== expectedWords(key)) {
    console.error(key + " extracted " + w.length + " words, manifest says " + expectedWords(key) + ". Refusing.");
    process.exit(1);
  }
  const set = new Set();
  for (let i = 0; i + SEED <= w.length; i++) set.add(w.slice(i, i + SEED).join(" "));
  perSource.set(key, set);
}

/* PER SOURCE, never a union: a combined gram set chains a run across two
 * documents through a junction present in neither, which makes the length a
 * property of the index rather than of any standard. */
function score(t) {
  const w = W(t);
  let best = 0, bestText = "", src = "";
  for (const [key, set] of perSource) {
    for (let i = 0; i + SEED <= w.length; i++) {
      if (!set.has(w.slice(i, i + SEED).join(" "))) continue;
      let n = SEED;
      while (i + n + 1 <= w.length && set.has(w.slice(i + n + 1 - SEED, i + n + 1).join(" "))) n++;
      if (n > best) { best = n; bestText = w.slice(i, i + n).join(" "); src = key; }
      i += n - 1;
    }
  }
  return { run: best, tot: w.length, cov: w.length ? best / w.length : 0, hit: bestText, src };
}

/* POSITIVE CONTROL. A known reproduction must fire, or the index is empty and
 * every clean verdict here is worthless. */
const CANARY = "the organization shall determine external and internal issues that are relevant to its purpose";
const cs = score(CANARY);
if (!(cs.run >= MIN_RUN && cs.cov >= MIN_COV)) {
  console.error("POSITIVE CONTROL FAILED: 27001 cl.4.1 canary scored " + cs.run + "w/" + cs.cov.toFixed(2));
  process.exit(1);
}

/** Which clause of the named source carries a span. Reported per fire, because
 *  a run with no locatable source is the tell for a manufactured adjacency. */
const rawText = new Map();
for (const [key, p] of Object.entries(PDFS)) {
  const o = join(mkdtempSync(join(tmpdir(), "iso-")), "t.txt");
  execFileSync("pdftotext", ["-layout", p, o]);
  rawText.set(key, readFileSync(o, "utf8"));
}
function locate(src, span) {
  const txt = rawText.get(src);
  if (!txt) return "";
  const lines = txt.split(/\r?\n/);
  const needle = W(span).slice(0, 5).join(" ");
  let heading = "";
  for (const line of lines) {
    const t = line.trimStart();
    const m = /^(\d+(?:\.\d+)*)\s*([A-Z])/.exec(t);
    if (m) heading = m[1] + " " + t.slice(m[1].length).trim().slice(0, 46);
    if (norm(line).includes(needle)) return heading || "(no heading above the match)";
  }
  return "(span not located in the layout text)";
}

/* ------------------------------------------------------------------ read */
const certs = await allRows("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const all = await allRows("concepts?select=id,slug,name,description,certification_id,retired_at");
const live = all.filter((c) => !c.retired_at);
const ONLY = process.env.CENSUS_CERT || "ISMS-F";
const rows = ONLY === "ALL" ? live : live.filter((c) => codeOf.get(c.certification_id) === ONLY);

console.log("");
console.log("INDEX -- " + Object.keys(PDFS).join(", "));
console.log("COVERAGE GAPS (derived from the manifest, never hardcoded):");
for (const g of MANIFEST.open_coverage_gaps) {
  console.log("  - " + (g.match(/.{1,72}(\s|$)/g) || [g]).map((l) => l.trim()).join("\n    "));
}
console.log("");
console.log("ISMS-F LIVE CONCEPTS: " + rows.length);
if (rows.length !== 192) {
  console.log("  NOTE: the prompt expects 192. Reporting what is live, which is the fact.");
}

/* ------------------------------------------------- 1. length distribution */
const len = (r) => String(r.description || "").length;
const sentences = (r) => (String(r.description || "").match(/[.!?](\s|$)/g) || []).length;
const BUCKETS = [[0, 60], [60, 100], [100, 140], [140, 180], [180, 260], [260, 400], [400, 1e9]];
console.log("");
console.log("1. LENGTH");
const lens = rows.map(len).sort((a, b) => a - b);
console.log("   min " + lens[0] + "   median " + lens[Math.floor(lens.length / 2)] +
            "   mean " + Math.round(lens.reduce((a, b) => a + b, 0) / lens.length) + "   max " + lens[lens.length - 1]);
for (const [lo, hi] of BUCKETS) {
  const n = rows.filter((r) => len(r) >= lo && len(r) < hi).length;
  if (!n) continue;
  console.log("   " + String(lo).padStart(4) + "-" + (hi === 1e9 ? "  +" : String(hi).padEnd(4)) +
              "  " + String(n).padStart(3) + "  " + "#".repeat(Math.round(n / 2)));
}
const oneLiner = rows.filter((r) => sentences(r) <= 1);
console.log("   one sentence or fewer   " + oneLiner.length + "   <- the security-control shape");
console.log("   multi-sentence          " + (rows.length - oneLiner.length));

/* --------------------------------------------- 2. duplicates, corpus-wide */
console.log("");
console.log("2. DUPLICATE DESCRIPTIONS (byte-identical, against ALL 1,730 live concepts)");
const byDesc = new Map();
for (const c of live) {
  const k = String(c.description || "").trim();
  if (!k) continue;
  (byDesc.get(k) || byDesc.set(k, []).get(k)).push(c);
}
const dupes = [...byDesc.values()].filter((g) => g.length > 1 && g.some((c) => codeOf.get(c.certification_id) === "ISMS-F"));
console.log("   ISMS-F rows sharing a description with any other live concept: " +
            dupes.reduce((n, g) => n + g.filter((c) => codeOf.get(c.certification_id) === "ISMS-F").length, 0));
for (const g of dupes.slice(0, 12)) {
  console.log("     " + g.map((c) => codeOf.get(c.certification_id) + "/" + c.slug).join("  ==  "));
  console.log("        \"" + String(g[0].description).slice(0, 96) + "\"");
}

/* ------------------------------------------ 3. clause / annex / control id */
console.log("");
console.log("3. ADDRESSES");
const ADDR = /\b(?:clause\s+)?(\d+(?:\.\d+){1,3})\b|\bAnnex\s+([A-Z])\b|\bA\.(\d+(?:\.\d+)?)\b/g;
let cited = 0, bare = 0, withAddr = 0;
const addrRows = [];
for (const r of rows) {
  const d = String(r.description || "");
  const hits = [...d.matchAll(ADDR)];
  if (!hits.length) continue;
  withAddr++;
  /* A CITATION names the standard or uses a citing verb; a BARE NUMBER just
   * drops an address into the prose and relies on the reader knowing which
   * document it belongs to. */
  const isCited = /\b(ISO|IEC|clause|Clause|Annex|required by|requires|per|under|states|specifies)\b/.test(d);
  if (isCited) cited++; else bare++;
  addrRows.push({ slug: r.slug, cited: isCited, addrs: hits.map((h) => h[0]).slice(0, 4) });
}
console.log("   rows carrying an address        " + withAddr + " of " + rows.length);
console.log("     reads as a citation           " + cited);
console.log("     bare number, no attribution   " + bare);
for (const a of addrRows.filter((x) => !x.cited).slice(0, 10)) {
  console.log("       BARE  " + a.slug + "   " + a.addrs.join(", "));
}

/* ------------------------------------------------- 4. definitional shape */
console.log("");
console.log("4. SHAPE  (structural signal, NOT the gloss ruling)");
/* A DEFINITION states what the term is; an EXPLANATION states what a reader
 * does with it. The discriminator used here is the presence of a teaching
 * move -- a consequence, a contrast, an applicability condition, or an
 * obligation. This is a SIGNAL. It does not decide the anti-gloss question,
 * which needs a human, and B.2 reports the overlap rather than a score. */
const TEACH = /\b(so|because|which means|rather than|not\b[^.]*\bbut|unlike|whereas|when|if|must|shall|should|cannot|only|therefore|the point|in practice|matters|distinguish|contrast|difference|auditor|candidate|organization must)\b/i;
const definitional = rows.filter((r) => !TEACH.test(String(r.description || "")));
console.log("   no teaching move detected (definition-shaped)  " + definitional.length);
console.log("   carries a teaching move (explanation-shaped)   " + (rows.length - definitional.length));
console.log("   NOTE: this is a lexical signal over prose. It is reported to size the");
console.log("         class, never to rule on a row. The leak gate below is the instrument.");

/* --------------------------------- 5. cross-certification near-duplicates */
console.log("");
console.log("5. SHARED WITH AIMS-F / ISMS-IA  (first 100 normalised chars)");
const head = (s) => norm(s).slice(0, 100);
const otherByHead = new Map();
for (const c of live) {
  const code = codeOf.get(c.certification_id);
  if (code !== "AIMS-F" && code !== "ISMS-IA") continue;
  const h = head(c.description);
  if (h.length < 40) continue;
  (otherByHead.get(h) || otherByHead.set(h, []).get(h)).push(code + "/" + c.slug);
}
let shared = 0;
for (const r of rows) {
  const h = head(r.description);
  if (h.length < 40) continue;
  const m = otherByHead.get(h);
  if (!m) continue;
  shared++;
  if (shared <= 10) console.log("     ISMS-F/" + r.slug + "   ==   " + m.join(", "));
}
console.log("   ISMS-F rows sharing a 100-char opening with AIMS-F or ISMS-IA: " + shared);

/* ------------------------------------------------------- 6. the leak gate */
console.log("");
console.log("6. LEAK GATE  seed " + SEED + ", refuse when run >= " + MIN_RUN + " AND coverage >= " + MIN_COV.toFixed(2));
console.log("   positive control  " + cs.run + "w/" + cs.cov.toFixed(2) + "  (27001 cl.4.1 canary fires as it must)");
const scored = rows.map((r) => ({ ...r, s: score(r.description) }));
const fired = scored.filter((r) => r.s.run >= MIN_RUN && r.s.cov >= MIN_COV)
  .sort((a, b) => b.s.cov - a.s.cov || b.s.run - a.s.run);
console.log("   rows scored       " + scored.length);
console.log("   FIRES             " + fired.length);
console.log("");
for (const r of fired) {
  console.log("   FIRE  " + r.slug);
  console.log("      name        " + r.name);
  console.log("      run " + r.s.run + "w of " + r.s.tot + "   coverage " + r.s.cov.toFixed(2) + "   source " + r.s.src);
  console.log("      clause      " + locate(r.s.src, r.s.hit));
  console.log("      matched     \"" + r.s.hit + "\"");
  console.log("      full text   " + r.description);
  console.log("");
}

writeFileSync(join(HERE, "..", "ISMS-F-CENSUS.json"), JSON.stringify({
  measured: "2026-09-22",
  live_concepts: rows.length,
  index: Object.keys(PDFS),
  coverage_gaps: MANIFEST.open_coverage_gaps,
  gate: { seed: SEED, min_run: MIN_RUN, min_cov: MIN_COV, canary: cs },
  length: { min: lens[0], median: lens[Math.floor(lens.length / 2)], max: lens[lens.length - 1],
            one_sentence: oneLiner.length, multi_sentence: rows.length - oneLiner.length },
  addresses: { rows_with: withAddr, citation: cited, bare },
  shape: { definition_shaped: definitional.length, explanation_shaped: rows.length - definitional.length },
  shared_openings: shared,
  fires: fired.map((r) => ({
    slug: r.slug, name: r.name, run: r.s.run, words: r.s.tot,
    coverage: Number(r.s.cov.toFixed(3)), source: r.s.src,
    clause: locate(r.s.src, r.s.hit), matched: r.s.hit, description: r.description,
  })),
  definition_shaped_slugs: definitional.map((r) => r.slug),
}, null, 2), "utf8");
console.log("wrote ISMS-F-CENSUS.json");
console.log("");
console.log("LIMIT, stated with the finding: the index is ENGLISH-ONLY and holds the");
console.log("editions listed above. A span that does not match is NOT thereby original --");
console.log("it may come from an edition or a standard not on disk. A score of 0 means");
console.log("'no reproduction of the indexed documents', never 'no reproduction'.");
