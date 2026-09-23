#!/usr/bin/env node
/**
 * compare-seeds.mjs -- what does SEED=4 catch that SEED=5 does not, and is it
 * real?
 *
 * READ-ONLY. Takes --verbose and --json. Unknown flags exit 2.
 *
 * ============ WHY THIS IS NOT A PREFERENCE ============
 *
 * The production lesson gate (`scan-iso-leaks`) seeds at 5. `leak-score`, which
 * the concept gate and every report use, seeds at 4. Same corpus, same
 * threshold of 10 words, two sensitivities -- and the LESS sensitive one is on
 * the surface carrying far more text.
 *
 * Measured over the lesson corpus, attributed quotations cut out as
 * IP-POSITION s6 requires:
 *
 *     SEED=5     9 group refusals, longest 12w
 *     SEED=4    60 group refusals, longest 14w
 *
 * A seed is supposed to be a way of FINDING a run, not a way of measuring one:
 * the run is extended greedily once a seed matches, so a genuinely contiguous
 * 14-word passage contains ten 5-grams and seed 5 cannot miss it.
 *
 * So a run only seed 4 can see is, by construction, suspect. The greedy
 * extension tests the TRAILING seed-gram alone, so a chain of overlapping
 * 4-grams drawn from DIFFERENT PLACES in one standard extends into a "run"
 * that exists nowhere -- the manufactured-adjacency defect already recorded
 * across documents, reappearing inside a single one.
 *
 * That is a hypothesis with an obvious test: take the reported text and ask
 * whether it appears CONTIGUOUSLY in the source it was attributed to.
 * `matchingSources` does exactly that, word for word, with no n-grams
 * involved, so it cannot inherit the defect it is used to detect.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSources, matchingSources, runUnits, norm, ABS_RUN } from "./lib/leak-score.mjs";
import { segments, attributedQuote } from "./lib/iso-segments.mjs";

const KNOWN = new Set(["--verbose", "--json"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". READ-ONLY.");
    process.exit(2);
  }
}
const JSON_OUT = process.argv.includes("--json");
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

/* Per-source n-gram sets at a given seed, built the way the scanner builds
 * them, so the only thing that differs between the two runs is the seed. */
function grams(seed) {
  const m = new Map();
  for (const [key, src] of sources) {
    const set = new Set();
    for (let i = 0; i + seed <= src.words.length; i++) set.add(src.words.slice(i, i + seed).join(" "));
    m.set(key, set);
  }
  return m;
}
const G = { 4: grams(4), 5: grams(5) };

/* The scanner's own extension, parameterised by seed. No skip. */
function longest(text, seed) {
  let best = 0, bestText = "", bestSrc = "";
  for (const unit of runUnits(text)) {
    const w = norm(unit).split(" ").filter(Boolean);
    for (const [label, own] of G[seed]) {
      for (let i = 0; i + seed <= w.length; i++) {
        if (!own.has(w.slice(i, i + seed).join(" "))) continue;
        let n = seed;
        while (i + n + 1 <= w.length && own.has(w.slice(i + n + 1 - seed, i + n + 1).join(" "))) n++;
        if (n > best) { best = n; bestText = w.slice(i, i + n).join(" "); bestSrc = label; }
      }
    }
  }
  return { best, bestText, bestSrc };
}

const certs = await allRows("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const modules = await allRows("modules?select=id,certification_id");
const certOfModule = new Map(modules.map((m) => [m.id, codeOf.get(m.certification_id)]));
const lessons = (await allRows("lessons?select=slug,language,content_md,module_id"))
  .filter((l) => l.language === "en");

const rows = [];
for (const l of lessons) {
  const segs = segments(l.content_md || "", attributedQuote);
  let a = { best: 0, bestText: "", bestSrc: "" }, b = { best: 0, bestText: "", bestSrc: "" };
  for (const s of segs) {
    const r4 = longest(s, 4); if (r4.best > a.best) a = r4;
    const r5 = longest(s, 5); if (r5.best > b.best) b = r5;
  }
  rows.push({ cert: certOfModule.get(l.module_id) || "?", slug: l.slug, s4: a, s5: b });
}

const over4 = rows.filter((r) => r.s4.best >= ABS_RUN);
const over5 = rows.filter((r) => r.s5.best >= ABS_RUN);
const only4 = over4.filter((r) => r.s5.best < ABS_RUN);

const verdict = only4.map((r) => ({ ...r, srcs: matchingSources(r.s4.bestText, sources) }));
const real = verdict.filter((v) => v.srcs.length > 0);
const fake = verdict.filter((v) => v.srcs.length === 0);

/* POSITIVE CONTROL. The test above only means something if `matchingSources`
 * can actually find a contiguous passage. Feed it one we know is there: the
 * longest run SEED=5 found, which both instruments agree on. If that comes
 * back NOWHERE, the test is broken and every "manufactured" verdict below is
 * an artifact of the checker rather than a fact about the text. */
const control = rows.filter((r) => r.s5.best >= ABS_RUN).sort((a, b) => b.s5.best - a.s5.best)[0];
const controlSrcs = control ? matchingSources(control.s5.bestText, sources) : [];
if (!control || controlSrcs.length === 0) {
  console.error("");
  console.error("CONTROL FAILED: the contiguity checker could not find a run both seeds agree on.");
  console.error("A negative result from a search that cannot find what IS there says nothing.");
  process.exit(2);
}

console.log("");
console.log("SEED COMPARISON -- lesson bodies, attributed quotations cut");
console.log("  control: the longest SEED=5 run is contiguous in [" + controlSrcs.join(",") + "]  -- checker works");
console.log("");
console.log("  English lessons examined        " + rows.length + "   <- the denominator");
console.log("  at or over " + ABS_RUN + "w at SEED=4        " + over4.length);
console.log("  at or over " + ABS_RUN + "w at SEED=5        " + over5.length);
console.log("  SEED=4 ONLY                     " + only4.length);
console.log("");
console.log("  of the SEED=4-only runs:");
console.log("    contiguous in a real standard " + real.length + "   <- seed 5 genuinely missed these");
console.log("    present in NO document        " + fake.length + "   <- manufactured by 4-gram chaining");
console.log("");
console.log("  A dozen of what SEED=4 sees and SEED=5 does not:");
for (const v of verdict.sort((x, y) => y.s4.best - x.s4.best).slice(0, 12)) {
  console.log("    " + String(v.s4.best).padStart(3) + "w  " +
    (v.srcs.length ? "REAL     [" + v.srcs.join(",") + "]" : "NOWHERE           ") +
    "  " + v.cert.padEnd(9) + v.slug);
  console.log("        " + v.s4.bestText.slice(0, 150));
}

if (JSON_OUT) {
  writeFileSync(join(ROOT, "SEED-COMPARISON.json"), JSON.stringify({
    measured: new Date().toISOString(), lessons: rows.length,
    over4: over4.length, over5: over5.length, only4: only4.length,
    real: real.map((v) => ({ cert: v.cert, slug: v.slug, run: v.s4.best, text: v.s4.bestText, srcs: v.srcs })),
    manufactured: fake.map((v) => ({ cert: v.cert, slug: v.slug, run: v.s4.best, text: v.s4.bestText })),
  }, null, 2), "utf8");
  console.log("");
  console.log("  wrote SEED-COMPARISON.json");
}
