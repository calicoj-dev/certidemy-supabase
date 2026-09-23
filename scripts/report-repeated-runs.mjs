#!/usr/bin/env node
/**
 * report-repeated-runs.mjs -- which below-floor runs of ISO text do we use in
 * more than one row?
 *
 * READ-ONLY. Takes --min <words>, --out <path>, --json. Unknown flags exit 2.
 * REPORTS. Refuses nothing, gates nothing.
 *
 * ============ WHY REPETITION IS A SIGNAL THE LENGTH CANNOT SUPPLY =========
 *
 * The run-length distribution decays smoothly and has no cliff at 9, which is
 * the argument for leaving the floor at 10: nothing is bunched just under the
 * line, so the near-floor population looks like the collision rate of technical
 * English written about the same subject as the standard.
 *
 * That argument is about the population. It says nothing about a MEMBER.
 *
 * A nine-word run appearing ONCE is incidental collision. The same nine words
 * appearing in FIVE lessons is not: it is a phrase that was written once and
 * carried, and whatever carried it will carry it again. Recurrence is evidence
 * of copying that length cannot provide, and no gate here has ever looked for
 * it -- a per-span floor can no more see a repetition than it can see a sum.
 *
 * ============ AND IT IS A REPORT BEFORE IT IS A RULE ============
 *
 * Deliberately not a gate. A repeated run has at least three explanations and
 * they need opposite responses:
 *
 *   OUR SENTENCE, REUSED     one sentence of ours, pasted across lessons, that
 *                            happens to collide with the standard. A style
 *                            problem, not a leak.
 *   A TERM OF ART            a phrase every practitioner uses, which our prose
 *                            must contain to teach at all.
 *   A CARRIED QUOTATION      the standard's wording, lifted once and spread.
 *
 * Only the third is a finding, and only reading them separates the three. So
 * this prints the surrounding sentence for every occurrence, and proposes a
 * threshold only after the members have been read.
 *
 * Attributed quotations are excluded -- they are a separate population with a
 * separate question, and counting them here would swamp the signal.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSources, runUnits, norm, assertCanary, W, SEED, ABS_RUN } from "./lib/leak-score.mjs";
import { segments, attributedQuote } from "./lib/iso-segments.mjs";

const KNOWN = new Set(["--min", "--out", "--json"]);
const argv = process.argv.slice(2);
let MIN = 6, OUT = "REPEATED-RUNS.md";
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) continue;
  if (!KNOWN.has(a)) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
  if (a === "--min") MIN = Number(argv[++i]);
  if (a === "--out") OUT = argv[++i];
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
 * EVERY run at or above MIN, not merely the longest.
 *
 * The distribution script took the longest run per unit, which is the right
 * unit for a verdict and the wrong one for this: a repeated seven-word phrase
 * sitting in a paragraph that also carries a nine-word run would never be
 * counted, and the repetition is the whole subject here. Non-nested, so one
 * long run is not also reported as its own shorter prefixes.
 */
function allRuns(text) {
  const w = norm(text).split(" ").filter(Boolean);
  const out = [];
  for (const [key, src] of sources) {
    let lastEnd = -1;
    for (let i = 0; i + SEED <= w.length; i++) {
      const cands = src.at.get(w.slice(i, i + SEED).join(" "));
      if (!cands) continue;
      let n = 0;
      for (const p of cands) {
        let k = 0;
        while (i + k < w.length && src.words[p + k] === w[i + k]) k++;
        if (k > n) n = k;
      }
      if (n >= MIN && i + n > lastEnd) {
        out.push({ text: w.slice(i, i + n).join(" "), len: n, src: key });
        lastEnd = i + n;
      }
    }
  }
  return out;
}

/* CONTROL. The canary must come back at full length, and the measure must not
 * report it twice as nested prefixes. */
const CW = W("the organization shall determine external and internal issues that are relevant to its purpose");
const c = allRuns(CW.join(" "));
if (!c.length || Math.max(...c.map((r) => r.len)) !== CW.length) {
  console.error("CONTROL FAILED: canary " + CW.length + "w came back as " + JSON.stringify(c.map((r) => r.len)));
  process.exit(2);
}

const certs = await allRows("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const modules = await allRows("modules?select=id,certification_id");
const certOfModule = new Map(modules.map((m) => [m.id, codeOf.get(m.certification_id)]));
const concepts = (await allRows("concepts?select=slug,name,description,certification_id,retired_at"))
  .filter((c) => !c.retired_at);
const lessons = (await allRows("lessons?select=slug,language,content_md,module_id"))
  .filter((l) => l.language === "en");

/** The sentence a run sits in, so a reader can tell reuse from collision. */
function sentenceAround(unit, runText) {
  const parts = unit.split(/(?<=[.!?])\s+/);
  const needle = runText.split(" ").slice(0, 4).join(" ");
  for (const p of parts) if (norm(p).includes(needle)) return p.trim();
  return unit.slice(0, 220).trim();
}

const seen = new Map();
function record(runs, unit, row) {
  for (const r of runs) {
    if (r.len >= ABS_RUN) continue;           // at or over the floor the gate already acts
    const rec = seen.get(r.text) || { text: r.text, len: r.len, src: r.src, rows: new Map() };
    if (!rec.rows.has(row.id)) rec.rows.set(row.id, { ...row, sentence: sentenceAround(unit, r.text) });
    seen.set(r.text, rec);
  }
}

for (const cpt of concepts) {
  const row = { corpus: "concept", cert: codeOf.get(cpt.certification_id) || "?", id: cpt.slug };
  for (const t of [String(cpt.description || ""), String(cpt.name || "")]) record(allRuns(t), t, row);
}
for (const l of lessons) {
  const row = { corpus: "lesson", cert: certOfModule.get(l.module_id) || "?", id: l.slug };
  for (const seg of segments(l.content_md || "", attributedQuote)) {
    for (const u of runUnits(seg)) record(allRuns(u), u, row);
  }
}

const all = [...seen.values()].map((r) => ({ ...r, n: r.rows.size, members: [...r.rows.values()] }));
const repeated = all.filter((r) => r.n > 1).sort((a, b) => b.n - a.n || b.len - a.len);

console.log("");
console.log("REPEATED BELOW-FLOOR RUNS -- report only, nothing refuses on this");
console.log("  control: the canary measures " + CW.length + "w and is not reported as nested prefixes");
console.log("  min run " + MIN + "w, floor " + ABS_RUN + "w, attributed quotation excluded");
console.log("");
console.log("  distinct runs at or over " + MIN + "w   " + all.length + "   <- the denominator");
console.log("  appearing in more than one row  " + repeated.length);
console.log("");
const band = (lo, hi) => repeated.filter((r) => r.n >= lo && (hi === null || r.n <= hi)).length;
console.log("  by number of rows:  2 rows " + band(2, 2) + "   3 rows " + band(3, 3) +
            "   4 rows " + band(4, 4) + "   5+ rows " + band(5, null));
console.log("");
const byLen = {};
for (const r of repeated) byLen[r.len] = (byLen[r.len] || 0) + 1;
console.log("  by run length: " + Object.keys(byLen).sort((a, b) => a - b).map((k) => k + "w:" + byLen[k]).join("  "));
console.log("");
console.log("  THRESHOLD CANDIDATES -- how many runs a rule would surface:");
for (const rows of [2, 3, 4]) {
  for (const len of [6, 7, 8]) {
    const n = repeated.filter((r) => r.n >= rows && r.len >= len).length;
    console.log("    >= " + rows + " rows and >= " + len + "w   " + String(n).padStart(4) + " runs");
  }
}
console.log("");
console.log("  WORST BY ROW COUNT:");
for (const r of repeated.slice(0, 12)) {
  console.log("    " + String(r.n).padStart(3) + " rows  " + r.len + "w  [" + r.src + "]  " + r.text.slice(0, 84));
}

const lines = [];
lines.push("# Below-floor runs of ISO text used in more than one row");
lines.push("");
lines.push("Report only. Nothing refuses on this. Attributed quotation excluded.");
lines.push("");
lines.push("A run appearing once is incidental collision -- the distribution decays smoothly");
lines.push("and shows no cliff, which is why the floor stays at 10. A run appearing in several");
lines.push("rows is different in kind: recurrence is evidence of carrying that length cannot");
lines.push("supply.");
lines.push("");
lines.push("**Three explanations, needing opposite responses**, and only reading separates them:");
lines.push("");
lines.push("- **our sentence, reused** -- one sentence of ours pasted across lessons that happens");
lines.push("  to collide with the standard. A style problem, not a leak.");
lines.push("- **a term of art** -- a phrase our prose must contain to teach at all.");
lines.push("- **a carried quotation** -- the standard's wording, lifted once and spread.");
lines.push("");
lines.push("The sentence around each occurrence is printed so the three can be told apart.");
lines.push("");
lines.push("| # | rows | run | source | text |");
lines.push("|---|---|---|---|---|");
repeated.forEach((r, i) => {
  lines.push("| " + (i + 1) + " | " + r.n + " | " + r.len + "w | " + r.src + " | " + r.text.slice(0, 70) + " |");
});
lines.push("");
lines.push("---");
lines.push("");
repeated.forEach((r, i) => {
  lines.push("## " + (i + 1) + ". " + r.n + " rows -- " + r.len + "w of " + r.src);
  lines.push("");
  lines.push("> " + r.text);
  lines.push("");
  for (const m of r.members) {
    lines.push("- **" + m.cert + "** `" + m.id + "` (" + m.corpus + ")");
    lines.push("  - " + m.sentence.slice(0, 320).replace(/\n/g, " "));
  }
  lines.push("");
});
writeFileSync(join(ROOT, OUT), lines.join("\n"), "utf8");
console.log("");
console.log("  wrote " + OUT);

if (JSON_OUT) {
  writeFileSync(join(ROOT, "REPEATED-RUNS.json"), JSON.stringify({
    measured: new Date().toISOString(), minRun: MIN, floor: ABS_RUN,
    distinctRuns: all.length, repeated: repeated.length,
    runs: repeated.map((r) => ({ text: r.text, len: r.len, src: r.src, rows: r.n,
                                 members: r.members.map((m) => ({ cert: m.cert, id: m.id, corpus: m.corpus, sentence: m.sentence })) })),
  }, null, 2), "utf8");
  console.log("  wrote REPEATED-RUNS.json");
}
