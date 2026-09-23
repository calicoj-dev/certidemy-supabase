#!/usr/bin/env node
/**
 * classify-run-alignment.mjs -- is a reported run a reproduction, or an
 * adjacency the instrument manufactured?
 *
 * READ-ONLY. Takes --json and --corpus <concept|lesson|all>. Unknown flags
 * exit 2. Changes nothing.
 *
 * ============ THE BINARY TEST WAS WRONG, AND READING IT SHOWED THAT =======
 *
 * The first pass asked one question -- does this exact word sequence appear
 * contiguously in an indexed standard? -- and called everything else
 * MANUFACTURED. It reported 98 of 361 fires that way, 27 percent, and the
 * list opened with
 *
 *     "react to the nonconformity and as applicable take action to control and correct it"
 *
 * which is ISO/IEC 27001:2022 clause 10.2 almost word for word. It is absent
 * contiguously for one reason: the standard reads *"and, as applicable:
 * **a)** take action"*, and the list letter is a token our prose has no
 * occasion to carry.
 *
 * That is a REPRODUCTION WITH AN OMISSION, which is what CLAUDE.md already
 * records under `confidentiality` -- two words dropped from ISO/IEC 27000's
 * definition split one total reproduction into runs of 5 and 6. The fix there
 * was not to call it clean; it was to merge under a SOURCE-SIDE GAP test.
 *
 * ============ SO THERE ARE THREE STATES AND FOLDING ANY TWO IS A LIE =====
 *
 *   CONTIGUOUS    one piece. Verbatim.
 *   INTERPOLATED  several pieces, each near the last IN THE SOURCE.
 *                 A reproduction someone edited. Still a reproduction.
 *   CHAINED       pieces drawn from far apart in the document, or from
 *                 nowhere near each other. The instrument glued them.
 *
 * The discriminator is the forward gap in the SOURCE, and the threshold is
 * `SRC_GAP_MAX`, the same constant the union merge already uses, because the
 * question being asked is identical: did the source ever join these words?
 *
 * Calling INTERPOLATED "manufactured" understates our exposure -- it clears
 * genuine reproductions. Calling CHAINED "real" withholds rows for
 * reproducing nothing. Both errors have been made in this repository in the
 * last hour.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSources, score, runUnits, assertCanary, matchingSources,
         firesUnion, firesAbsolute, W, SEED, SRC_GAP_MAX, ABS_RUN } from "./lib/leak-score.mjs";
import { segments, attributedQuote } from "./lib/iso-segments.mjs";

const KNOWN = new Set(["--json", "--corpus"]);
const argv = process.argv.slice(2);
let CORPUS = "all";
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) continue;
  if (!KNOWN.has(a)) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
  if (a === "--corpus") CORPUS = argv[++i];
}
const JSON_OUT = argv.includes("--json");
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

const sources = buildSources();
assertCanary(sources);

/**
 * Align `words` against one source, left to right, preferring the continuation
 * that stays closest to where the previous piece ended. Returns the pieces and
 * the largest forward source-side gap between consecutive pieces, or null when
 * the run cannot be aligned at all.
 */
function alignTo(words, src) {
  let k = 0, prevEnd = null, pieces = 0, maxGap = 0, unmatched = 0;
  while (k < words.length) {
    /* ============ THE TAIL IS NOT UNMATCHED BY DEFAULT ============
     *
     * A piece must be at least SEED words to be FOUND, because that is the
     * index's granularity. It does not follow that a run's last one-to-three
     * words are absent: they are simply too short to start a new lookup.
     *
     * Counting them unmatched forced CHAINED on every run whose length is not
     * exactly covered by seed-aligned pieces, and it showed up as a dozen
     * rows reported CHAINED at a source gap of ZERO -- adjacent in the source
     * and called an invention. An instrument that over-reports gets loosened
     * by the first person it inconveniences.
     *
     * So the tail is CONTINUED from where the previous piece ended, which is
     * the only question that matters: does the source carry on this way? */
    if (k + SEED > words.length) {
      if (prevEnd === null) { unmatched += words.length - k; break; }
      let n = 0;
      while (k + n < words.length && src.words[prevEnd + n] === words[k + n]) n++;
      unmatched += words.length - k - n;
      prevEnd += n;
      break;
    }
    const cands = src.at.get(words.slice(k, k + SEED).join(" ")) || [];
    if (!cands.length) { unmatched++; k++; continue; }
    /* Prefer a start at or after the previous piece's end, nearest first; that
     * is what "the source joined these" means. Ties go to the longer piece. */
    let bestPos = -1, bestLen = 0, bestGap = Infinity;
    for (const p of cands) {
      let n = 0;
      while (k + n < words.length && src.words[p + n] === words[k + n]) n++;
      if (n < SEED) continue;
      const gap = prevEnd === null ? 0 : p - prevEnd;
      if (gap < 0) continue;
      if (gap < bestGap || (gap === bestGap && n > bestLen)) { bestGap = gap; bestLen = n; bestPos = p; }
    }
    /* A word that matches nothing is not a gap in the SOURCE, it is a word
     * the source does not contain. A run carrying one is not a reproduction
     * of this document at any gap, so it must not be allowed to align. */
    if (bestPos < 0) { unmatched++; k++; continue; }
    if (prevEnd !== null) maxGap = Math.max(maxGap, bestGap);
    pieces++; prevEnd = bestPos + bestLen; k += bestLen;
  }
  if (!pieces) return null;
  return { pieces, maxGap, unmatched };
}

/** Best alignment across every source, taken per source and maximum afterwards. */
function classify(span) {
  const words = W(span);
  if (matchingSources(span, sources).length) return { verdict: "CONTIGUOUS", pieces: 1, maxGap: 0, src: matchingSources(span, sources)[0] };
  let best = null, bestSrc = "";
  for (const [key, src] of sources) {
    const a = alignTo(words, src);
    if (!a) continue;
      const better = !best
      || a.unmatched < best.unmatched
      || (a.unmatched === best.unmatched && a.maxGap < best.maxGap)
      || (a.unmatched === best.unmatched && a.maxGap === best.maxGap && a.pieces < best.pieces);
    if (better) { best = a; bestSrc = key; }
  }
  if (!best) return { verdict: "CHAINED", pieces: 0, maxGap: Infinity, src: "" };
  const verdict = (best.unmatched === 0 && best.maxGap <= SRC_GAP_MAX) ? "INTERPOLATED" : "CHAINED";
  return { verdict, pieces: best.pieces, maxGap: best.maxGap, src: bestSrc };
}

/* ============ CONTROLS CONSTRUCTED, NOT CHOSEN ============
 *
 * A classifier with three outputs needs a control per output, or a bucket that
 * has quietly stopped being reachable reads as "nothing was that".
 *
 * The first attempt HAND-PICKED a CHAINED control -- a phrase from the front
 * matter welded to the canary -- and it came back INTERPOLATED, correctly:
 * those two happen to sit close together. A hand-picked control asserts what
 * the author GUESSES about the corpus, so when it fails there is no way to
 * tell a broken classifier from a wrong guess, and the temptation is to edit
 * the expectation until it agrees with the code. That is how a control dies.
 *
 * These are BUILT from the index at runtime, at offsets chosen so the answer
 * is known by construction: one piece is contiguous, two pieces two words
 * apart are interpolated, two pieces four thousand words apart are chained.
 * No judgement about our corpus is involved and the expectation cannot drift. */
const ctrlSrc = sources.get("42001:2023");
if (!ctrlSrc) { console.error("CONTROL SOURCE MISSING: 42001:2023 is not indexed."); process.exit(2); }
const sw = ctrlSrc.words;
const at = (i, n) => sw.slice(i, i + n).join(" ");
const CTRL = [
  [at(1000, 14), "CONTIGUOUS", "one contiguous passage"],
  [at(1000, 6) + " " + at(1008, 6), "INTERPOLATED", "two pieces, source gap 2"],
  [at(1000, 6) + " " + at(6000, 6), "CHAINED", "two pieces, source gap ~5000"],
];
let ctrlFail = 0;
for (const [text, want, why] of CTRL) {
  const got = classify(text).verdict;
  if (got !== want) { console.error("CONTROL FAILED (" + why + "): expected " + want + ", got " + got); ctrlFail++; }
}
if (ctrlFail) { console.error("A classifier whose controls do not hold reports nothing."); process.exit(2); }

const certs = await allRows("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const modules = await allRows("modules?select=id,certification_id");
const certOfModule = new Map(modules.map((m) => [m.id, codeOf.get(m.certification_id)]));

const units = [];
if (CORPUS === "all" || CORPUS === "concept") {
  const concepts = (await allRows("concepts?select=slug,name,description,certification_id,retired_at"))
    .filter((c) => !c.retired_at);
  for (const c of concepts) {
    units.push({ corpus: "concept", cert: codeOf.get(c.certification_id) || "?", id: c.slug, field: "description", text: String(c.description || "") });
    units.push({ corpus: "concept", cert: codeOf.get(c.certification_id) || "?", id: c.slug, field: "name", text: String(c.name || "") });
  }
}
if (CORPUS === "all" || CORPUS === "lesson") {
  const lessons = (await allRows("lessons?select=slug,language,content_md,module_id")).filter((l) => l.language === "en");
  for (const l of lessons) {
    for (const seg of segments(l.content_md || "", attributedQuote)) {
      for (const u of runUnits(seg)) {
        units.push({ corpus: "lesson", cert: certOfModule.get(l.module_id) || "?", id: l.slug, field: "body", text: u });
      }
    }
  }
}

const fires = [];
for (const u of units) {
  const s = score(u.text, sources);
  if (!firesUnion(s)) continue;
  const lg = (s.merged || []).slice().sort((a, b) => b.len - a.len)[0];
  if (!lg) continue;
  fires.push({ ...u, run: s.unionRun, abs: firesAbsolute(s), span: lg.text, ...classify(lg.text) });
}

const of = (v, list) => list.filter((f) => f.verdict === v);
const pct = (n) => fires.length ? (100 * n / fires.length).toFixed(0) + "%" : "-";

console.log("");
console.log("RUN ALIGNMENT -- SEED=" + SEED + ", source-gap threshold " + SRC_GAP_MAX);
console.log("  controls: CONTIGUOUS, INTERPOLATED and CHAINED all reachable");
console.log("");
console.log("  units scored                " + units.length + "   <- the denominator");
console.log("  units that FIRE             " + fires.length);
console.log("");
for (const v of ["CONTIGUOUS", "INTERPOLATED", "CHAINED"]) {
  const l = of(v, fires);
  console.log("    " + v.padEnd(14) + String(l.length).padStart(4) + "  " + pct(l.length).padStart(4) +
    "   concept " + l.filter((f) => f.corpus === "concept").length +
    ", lesson " + l.filter((f) => f.corpus === "lesson").length);
}
const chainedAbs = of("CHAINED", fires).filter((f) => f.abs);
const interpAbs = of("INTERPOLATED", fires).filter((f) => f.abs);
console.log("");
console.log("  at or over the absolute floor (" + ABS_RUN + "w):");
console.log("    INTERPOLATED  " + interpAbs.length + "   real reproductions the contiguity test would have cleared");
console.log("    CHAINED       " + chainedAbs.length + "   rows that would be withheld for reproducing nothing");
console.log("");
console.log("  CHAINED, worst first -- these are the instrument's own inventions:");
for (const f of chainedAbs.sort((a, b) => b.run - a.run).slice(0, 12)) {
  console.log("    " + String(f.run).padStart(3) + "w  gap " + (f.maxGap === Infinity ? "none" : String(f.maxGap).padStart(4)) +
    "  " + f.corpus.padEnd(8) + f.cert.padEnd(9) + f.id.slice(0, 44));
  console.log("        " + f.span.slice(0, 140));
}

if (JSON_OUT) {
  writeFileSync(join(ROOT, "RUN-ALIGNMENT.json"), JSON.stringify({
    measured: new Date().toISOString(), seed: SEED, srcGapMax: SRC_GAP_MAX,
    units: units.length, fires: fires.length,
    counts: Object.fromEntries(["CONTIGUOUS", "INTERPOLATED", "CHAINED"].map((v) => [v, of(v, fires).length])),
    members: fires.map((f) => ({ corpus: f.corpus, cert: f.cert, id: f.id, field: f.field,
                                 run: f.run, verdict: f.verdict, pieces: f.pieces,
                                 maxGap: f.maxGap === Infinity ? null : f.maxGap, span: f.span })),
  }, null, 2), "utf8");
  console.log("");
  console.log("  wrote RUN-ALIGNMENT.json");
}
