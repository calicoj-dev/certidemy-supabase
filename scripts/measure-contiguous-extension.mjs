#!/usr/bin/env node
/**
 * measure-contiguous-extension.mjs -- what the corpus scores when a run is
 * extended by POSITION instead of by n-gram membership.
 *
 * READ-ONLY. Takes --json. Unknown flags exit 2. Changes nothing, proposes a
 * change to `lib/leak-score.mjs` and `scan-iso-leaks.mjs`.
 *
 * ============ THE DEFECT, STATED EXACTLY ============
 *
 * Both scorers extend a run like this:
 *
 *     let n = SEED;
 *     while (own.has(w.slice(i + n + 1 - SEED, i + n + 1).join(" "))) n++;
 *
 * The test is "is the TRAILING seed-gram present ANYWHERE in this document".
 * It is not "does the document continue this way". So a run walks forward as
 * long as each successive window exists SOMEWHERE, and the windows need not
 * come from the same place -- the extension hops.
 *
 * Measured, per offset, against ISO 19011:2026:
 *
 *     the results of the evaluation of the collected audit evidence
 *      4    9    8   7     6      5   4   0        0     0
 *
 * The longest genuinely contiguous run is NINE, starting at "results". The
 * leading "the" matches a 4-gram somewhere else entirely, and chaining it on
 * produces a reported TEN -- which is the absolute floor. A nine-word run that
 * does not fire became a ten-word run that does, on one word borrowed from
 * another page.
 *
 * ============ WHY THIS IS THE SEED QUESTION'S REAL ANSWER ============
 *
 * SEED=5 refuses 9 lesson rows; SEED=4 refuses 60. That looked like a
 * sensitivity dial and it is not. A larger seed makes chaining arithmetically
 * harder, so seed 5 chains LESS -- it is not more correct, it is less wrong,
 * and it pays for that by missing genuine short runs.
 *
 * Extending by position is right at EVERY seed, because a real contiguous run
 * has a position by construction and an invented one does not. The seed goes
 * back to being what it is supposed to be: how a candidate is FOUND, never how
 * it is MEASURED.
 *
 * ============ AND IT CUTS BOTH WAYS, WHICH IS WHY IT NEEDS MEASURING ======
 *
 * Chaining only ever INFLATES, so every run it touched is at most as long as
 * reported -- but "at most" includes "exactly", and three of the rows this was
 * first tested on split three ways: 10w that is really 9 (below the floor),
 * 10w that is really 6 (well below), and 14w that is really 12 (still over).
 * Dismissing the class would clear a genuine reproduction.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSources, runUnits, norm, assertCanary, W,
         SEED, ABS_RUN, MIN_RUN, MIN_COV, SRC_GAP_MAX } from "./lib/leak-score.mjs";
import { segments, attributedQuote } from "./lib/iso-segments.mjs";

const KNOWN = new Set(["--json"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
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
assertCanary(sources);

/** CURRENT: extend while the trailing seed-gram exists anywhere. */
function chained(words, src) {
  let best = 0, text = "";
  for (let i = 0; i + SEED <= words.length; i++) {
    if (!src.grams.has(words.slice(i, i + SEED).join(" "))) continue;
    let n = SEED;
    while (i + n + 1 <= words.length && src.grams.has(words.slice(i + n + 1 - SEED, i + n + 1).join(" "))) n++;
    if (n > best) { best = n; text = words.slice(i, i + n).join(" "); }
  }
  return { best, text };
}

/** PROPOSED: extend while the SOURCE continues this way, from a real position. */
function contiguous(words, src) {
  let best = 0, text = "", at = [];
  for (let i = 0; i + SEED <= words.length; i++) {
    const cands = src.at.get(words.slice(i, i + SEED).join(" "));
    if (!cands || !cands.length) continue;
    let n = 0, hits = [];
    for (const p of cands) {
      let k = 0;
      while (i + k < words.length && src.words[p + k] === words[i + k]) k++;
      if (k > n) { n = k; hits = [p]; } else if (k === n) hits.push(p);
    }
    if (n > best) { best = n; text = words.slice(i, i + n).join(" "); at = hits; }
  }
  return { best, text, at };
}

const certs = await allRows("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const modules = await allRows("modules?select=id,certification_id");
const certOfModule = new Map(modules.map((m) => [m.id, codeOf.get(m.certification_id)]));

const concepts = (await allRows("concepts?select=slug,name,description,certification_id,retired_at"))
  .filter((c) => !c.retired_at);
const lessons = (await allRows("lessons?select=slug,language,content_md,module_id"))
  .filter((l) => l.language === "en");

const units = [];
for (const c of concepts) {
  units.push({ corpus: "concept", cert: codeOf.get(c.certification_id) || "?", id: c.slug, field: "description", text: String(c.description || "") });
  units.push({ corpus: "concept", cert: codeOf.get(c.certification_id) || "?", id: c.slug, field: "name", text: String(c.name || "") });
}
for (const l of lessons) {
  for (const seg of segments(l.content_md || "", attributedQuote)) {
    for (const u of runUnits(seg)) {
      units.push({ corpus: "lesson", cert: certOfModule.get(l.module_id) || "?", id: l.slug, field: "body", text: u });
    }
  }
}

/* CONTROL. The canary is a contiguous passage, so BOTH measures must return
 * its full length. If the proposed one is short, it is losing real runs and no
 * reduction it reports can be believed. */
const cw = W("the organization shall determine external and internal issues that are relevant to its purpose");
let ctrlChained = 0, ctrlContig = 0;
for (const [, src] of sources) {
  ctrlChained = Math.max(ctrlChained, chained(cw, src).best);
  ctrlContig = Math.max(ctrlContig, contiguous(cw, src).best);
}
if (ctrlContig < cw.length || ctrlChained < cw.length) {
  console.error("CONTROL FAILED: canary " + cw.length + "w measured chained=" + ctrlChained + " contiguous=" + ctrlContig);
  console.error("A measure that shortens a known reproduction cannot be used to clear anything.");
  process.exit(2);
}

const rows = [];
for (const u of units) {
  const w = norm(u.text).split(" ").filter(Boolean);
  if (w.length < SEED) continue;
  let A = { best: 0, text: "" }, B = { best: 0, text: "" }, aSrc = "", bSrc = "";
  for (const [key, src] of sources) {
    const a = chained(w, src); if (a.best > A.best) { A = a; aSrc = key; }
    const b = contiguous(w, src); if (b.best > B.best) { B = b; bSrc = key; }
  }
  if (A.best < MIN_RUN && B.best < MIN_RUN) continue;
  rows.push({ ...u, words: w.length, chained: A.best, chainedText: A.text, chainedSrc: aSrc,
              contig: B.best, contigText: B.text, contigSrc: bSrc });
}

const firesBy = (n, words) => n >= ABS_RUN || (n >= MIN_RUN && words && n / words >= MIN_COV);
const fireA = rows.filter((r) => firesBy(r.chained, r.words));
const fireB = rows.filter((r) => firesBy(r.contig, r.words));
const lost = fireA.filter((r) => !firesBy(r.contig, r.words));
const kept = fireA.filter((r) => firesBy(r.contig, r.words));
const gained = fireB.filter((r) => !firesBy(r.chained, r.words));
const inflated = rows.filter((r) => r.contig < r.chained);

console.log("");
console.log("CONTIGUOUS EXTENSION -- measured, not argued");
console.log("  control: the canary measures " + cw.length + "w under BOTH extensions  -- neither loses a real run");
console.log("  seed " + SEED + ", floor " + ABS_RUN + "w, ratio " + MIN_RUN + "w/" + MIN_COV);
console.log("");
console.log("  units scored                      " + units.length + "   <- the denominator");
console.log("  units with any run at all         " + rows.length);
console.log("");
console.log("  FIRES, extending by n-gram (today)   " + fireA.length);
console.log("  FIRES, extending by position         " + fireB.length);
console.log("");
console.log("    still fire (real)               " + kept.length);
console.log("    STOP firing (inflated past it)  " + lost.length);
console.log("    NEWLY fire                      " + gained.length + "   <- must be 0; chaining only inflates");
console.log("");
console.log("  runs whose length was overstated   " + inflated.length);
if (inflated.length) {
  const d = inflated.map((r) => r.chained - r.contig).sort((a, b) => b - a);
  console.log("    worst overstatement             " + d[0] + " words");
  console.log("    median overstatement            " + d[Math.floor(d.length / 2)] + " words");
}
const byCorpus = (l, c) => l.filter((r) => r.corpus === c).length;
console.log("");
console.log("  of the " + lost.length + " that stop firing: concept " + byCorpus(lost, "concept") + ", lesson " + byCorpus(lost, "lesson"));
console.log("");
console.log("  WOULD STOP FIRING -- reported length, true length:");
for (const r of lost.sort((a, b) => b.chained - a.chained).slice(0, 15)) {
  console.log("    " + String(r.chained).padStart(3) + "w -> " + String(r.contig).padStart(3) + "w   " +
    r.corpus.padEnd(8) + r.cert.padEnd(9) + r.id.slice(0, 44));
  console.log("        " + r.chainedText.slice(0, 130));
}

if (JSON_OUT) {
  writeFileSync(join(ROOT, "CONTIGUOUS-EXTENSION.json"), JSON.stringify({
    measured: new Date().toISOString(), seed: SEED,
    units: units.length, withRuns: rows.length,
    firesChained: fireA.length, firesContiguous: fireB.length,
    stopFiring: lost.map((r) => ({ corpus: r.corpus, cert: r.cert, id: r.id, field: r.field,
                                   reported: r.chained, actual: r.contig, span: r.chainedText })),
    stillFiring: kept.map((r) => ({ corpus: r.corpus, cert: r.cert, id: r.id, field: r.field,
                                    reported: r.chained, actual: r.contig, span: r.contigText, src: r.contigSrc })),
  }, null, 2), "utf8");
  console.log("");
  console.log("  wrote CONTIGUOUS-EXTENSION.json");
}
