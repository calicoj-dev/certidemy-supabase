/**
 * measure-cue-expansion.mjs -- is the "translation introduced a cue" finding a
 * cue, or is it the cue guard's ABSOLUTE margin meeting a language that expands?
 *
 * READ-ONLY. Unknown flags exit 2.
 *
 * ============ WHY THIS EXISTS ============
 *
 * The item sweep reported 828 secure items where the key becomes a length cue in
 * translation and was clean in English. Ten were read. In EVERY ONE the English
 * key was ALREADY the longest option, by a small margin, and the translation
 * simply expanded -- Spanish and Portuguese run longer than English, so a lead
 * of 10 characters becomes a lead of 25 with no change in balance at all.
 *
 * `auditItem` compares `key - maxOther` against KEY_LEN_MARGIN, an ABSOLUTE
 * character count calibrated on English prose. That is the same defect this
 * codebase already recorded once: a similarity threshold in absolute terms
 * selects by LENGTH, not by the property it is named for.
 *
 * So the question is measured RELATIVELY and AGAINST THE POPULATION:
 *
 *   ratio   = key length / longest rival length
 *   delta   = ratio_translated - ratio_english
 *
 * A translation that merely expands leaves delta at zero. A translation that
 * actually made the key stand out moves it. The population says which is which,
 * because a finding stated as a difference needs the distribution behind it.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { acquireHeavyReaderLock } from "./lib/heavy-reader-lock.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a) + " -- this script is READ-ONLY and takes none");
  process.exitCode = 2; process.exit();
}

const optMap = (q) => {
  const m = new Map();
  if (Array.isArray(q && q.options)) for (const o of q.options) if (o && typeof o.id === "string") m.set(o.id, String(o.text == null ? "" : o.text).trim());
  return m;
};
function ratio(q) {
  if (!Array.isArray(q.correct_answer) || q.correct_answer.length !== 1) return null;
  const m = optMap(q);
  if (m.size < 3) return null;
  const k = m.get(q.correct_answer[0]);
  if (typeof k !== "string") return null;
  const others = [...m.entries()].filter(([id]) => id !== q.correct_answer[0]).map(([, t]) => t.length);
  const maxOther = Math.max(...others);
  if (!maxOther) return null;
  return { r: k.length / maxOther, keyLen: k.length, maxOther, total: [...m.values()].reduce((s, t) => s + t.length, 0) };
}
const pct = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

const KEY = requireKey(HERE);
const release = await acquireHeavyReaderLock("measure-cue-expansion");
try {
  const certs = await getAll(KEY, "certifications?select=id,code&order=id");
  const codeOf = new Map(certs.map((c) => [c.id, c.code]));
  const rows = await getAll(KEY,
    "quiz_questions?select=id,certification_id,question_group_id,language,pool,question_text,options,correct_answer&status=eq.approved&retired_at=is.null&order=id");

  const groups = new Map();
  for (const r of rows) {
    if (!r.question_group_id) continue;
    if (!groups.has(r.question_group_id)) groups.set(r.question_group_id, []);
    groups.get(r.question_group_id).push(r);
  }

  const deltas = [], expansions = [];
  const byLang = new Map();
  const rowsOut = [];
  let unpairable = 0;

  for (const [, sibs] of groups) {
    const en = sibs.find((s) => s.language === "en");
    if (!en) continue;
    const re = ratio(en);
    for (const tr of sibs) {
      if (tr.language === "en") continue;
      const rt = ratio(tr);
      if (!re || !rt) { unpairable++; continue; }
      const d = rt.r - re.r;
      const exp = rt.total / (re.total || 1);
      deltas.push(d); expansions.push(exp);
      if (!byLang.has(tr.language)) byLang.set(tr.language, { d: [], e: [] });
      byLang.get(tr.language).d.push(d);
      byLang.get(tr.language).e.push(exp);
      rowsOut.push({ id: tr.id, cert: codeOf.get(tr.certification_id), pool: tr.pool, lang: tr.language,
        delta: Number(d.toFixed(4)), ratio_en: Number(re.r.toFixed(3)), ratio_tr: Number(rt.r.toFixed(3)), expansion: Number(exp.toFixed(3)) });
    }
  }

  const mean = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
  const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) * (x - m)))); };

  console.log("CUE EXPANSION -- is the key cue a translation defect or an absolute margin?");
  console.log("  translated items with a comparable key ratio   " + deltas.length);
  console.log("  UNPAIRABLE (no single key, or under 3 options)  " + unpairable + "   <- own state");
  console.log("");
  console.log("LENGTH EXPANSION, translated total / English total");
  for (const [l, v] of byLang) {
    console.log("  " + l.padEnd(8) + " mean " + mean(v.e).toFixed(3) + "   median " + pct(v.e, 0.5).toFixed(3) +
      "   p90 " + pct(v.e, 0.9).toFixed(3));
  }
  console.log("");
  console.log("KEY RATIO DELTA (translated key/rival minus English key/rival)");
  console.log("  a translation that only expands leaves this at zero");
  for (const [l, v] of byLang) {
    console.log("  " + l.padEnd(8) + " mean " + mean(v.d).toFixed(4) + "  sd " + sd(v.d).toFixed(4) +
      "  p50 " + pct(v.d, 0.5).toFixed(4) + "  p90 " + pct(v.d, 0.9).toFixed(4) + "  p99 " + pct(v.d, 0.99).toFixed(4));
  }
  console.log("");

  /* The threshold is derived from the population, not chosen: two standard
     deviations above the mean delta, stated with what falls inside it. */
  const m = mean(deltas), s = sd(deltas);
  const cut = m + 2 * s;
  const outliers = rowsOut.filter((r) => r.delta > cut);
  const secureOut = outliers.filter((r) => r.pool === "secure");
  console.log("POPULATION THRESHOLD  mean " + m.toFixed(4) + " + 2sd " + s.toFixed(4) + " = " + cut.toFixed(4));
  console.log("  items above it            " + outliers.length + "  (" + (100 * outliers.length / deltas.length).toFixed(1) + "% of the population)");
  console.log("  of those, secure pool     " + secureOut.length);
  console.log("");

  /* How many of the sweep's cue findings survive the relative test? */
  let sweep = null;
  try { sweep = JSON.parse(readFileSync(join(ROOT, "ITEM-QUALITY-SWEEP.json"), "utf8")); } catch { /* not run */ }
  if (sweep) {
    const flagged = new Set(sweep.findings.filter((f) => f.findings.some((x) => x.cls.startsWith("cue-introduced")))
      .map((f) => f.id));
    const outIds = new Set(outliers.map((r) => r.id));
    let both = 0;
    for (const id of flagged) if (outIds.has(id)) both++;
    console.log("AGAINST THE SWEEP'S ABSOLUTE-MARGIN FINDING");
    console.log("  flagged by the absolute cue guard      " + flagged.size);
    console.log("  also outliers on the RELATIVE measure  " + both);
    console.log("  absolute-only (explained by expansion) " + (flagged.size - both));
  } else {
    console.log("AGAINST THE SWEEP: could-not-run -- ITEM-QUALITY-SWEEP.json not present");
  }

  const path = join(ROOT, "CUE-EXPANSION.json");
  writeFileSync(path, JSON.stringify({
    population: deltas.length, unpairable,
    expansion_by_language: Object.fromEntries([...byLang].map(([l, v]) => [l, { mean: mean(v.e), median: pct(v.e, 0.5), p90: pct(v.e, 0.9) }])),
    delta_by_language: Object.fromEntries([...byLang].map(([l, v]) => [l, { mean: mean(v.d), sd: sd(v.d), p50: pct(v.d, 0.5), p90: pct(v.d, 0.9), p99: pct(v.d, 0.99) }])),
    threshold: { rule: "mean + 2sd of the whole translated population", value: cut },
    outliers: outliers.sort((a, b) => b.delta - a.delta),
  }, null, 2) + "\n", "utf8");
  console.log("");
  console.log("wrote " + path);
} finally { release(); }
