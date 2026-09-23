#!/usr/bin/env node
/**
 * measure-quotation-denominator.mjs -- what fraction of the part we actually
 * quote from has been reproduced?
 *
 * READ-ONLY. Takes --json. Unknown flags exit 2.
 *
 * ============ WHY THE FIRST NUMBER WAS THE WRONG FRACTION ============
 *
 * "716 quoted words, 9.49 percent of ISO/IEC 27001:2022" divides by the WHOLE
 * extracted document -- foreword, scope, terms, clauses 4 to 10, and Annex A's
 * 93 controls with their titles, which is the bulk of the pages.
 *
 * An internal-auditor course quotes the normative clauses. Measuring a
 * clause-4-to-10 numerator against a whole-document denominator understates
 * the fraction of the thing actually being reproduced -- the same defect as
 * `mean_key_margin` averaged over a population nobody asked about, and the
 * same defect as counting `clausula` without counting `apartado`.
 *
 * So the numerator is split by WHERE IN THE SOURCE each quoted span sits, and
 * each half is divided by its own denominator.
 *
 * ============ THE BOUNDARY COMES FROM THE SHARED LOCATOR ============
 *
 * `annexBoundaryWord` is the one implementation, and it already carries the
 * defences this corpus needed: the table of contents is a decoy in every
 * indexed PDF, and taking the FIRST "annex a normative" put 27001's boundary
 * 6 percent into the document. A private copy here would inherit none of that.
 *
 * The front matter -- everything before clause 4 -- is excluded from the
 * denominator as well as the numerator, because scope and foreword are not
 * what a requirements course reproduces and leaving them in re-creates the
 * same understatement one level down.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSources, norm, assertCanary, W, SEED } from "./lib/leak-score.mjs";
import { segments, attributedQuote, quoteLines } from "./lib/iso-segments.mjs";
import { annexBoundaryWord } from "./lib/iso-locator.mjs";

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

/**
 * Where clause 4 begins, as a word offset.
 *
 * The heading extracts WITHOUT a space behind the licence watermark column --
 * `4.1Understanding` -- which is what made `clauseText` return null for every
 * clause of 27001 and let a check score OK against an empty string. So this
 * does not look for a heading at all: it finds the first occurrence of the
 * clause-4 subject phrase, which is stable across the harmonised standards.
 */
function clause4Word(words, annexAt) {
  /* ============ SEARCH THE BODY, NOT THE WHOLE DOCUMENT ============
   *
   * Taking the LAST occurrence anywhere skips the table of contents, which is
   * the decoy every instrument here has hit -- and then walks PAST the body
   * into the annex, where the same phrase recurs. That is the identical
   * two-step failure `clauseText` had: fix the contents entry, acquire the
   * annex. 27002 and 27005 came back with clause 4 AFTER their annex
   * boundary, which is impossible and was the tell.
   *
   * So the search is bounded by the annex boundary: the last occurrence that
   * is still in the body. */
  const limit = annexAt > 0 ? annexAt : words.length;
  /* ============ THE NEEDLE IS PER FAMILY, NOT UNIVERSAL ============
   *
   * The harmonised management-system standards open clause 4 with
   * *Understanding the organization and its context*. ISO 19011 does not: it
   * is guidance rather than requirements and its clause 4 is *Principles of
   * auditing*. Using the harmonised needle alone made 19011 fall through to a
   * late, unrelated occurrence of "context of the organization" at word
   * 11742 -- past the middle of the document -- which passed the structural
   * soundness test and produced a confident, wrong 1.27 percent.
   *
   * A denominator that is structurally plausible and semantically wrong is
   * worse than one that fails, because nothing about it looks broken. */
  const needles = [
    ["understanding", "the", "organization", "and", "its", "context"],
    ["principles", "of", "auditing"],
    ["context", "of", "the", "organization"],
  ];
  for (const nd of needles) {
    for (let i = 0; i + nd.length <= limit; i++) {
      let ok = true;
      for (let k = 0; k < nd.length; k++) if (words[i + k] !== nd[k]) { ok = false; break; }
      /* The first occurrence is the contents entry; the last before the annex
       * is the body. Take the LAST that still precedes the annex boundary. */
      if (ok) {
        let last = i;
        for (let j = i + 1; j + nd.length <= limit; j++) {
          let ok2 = true;
          for (let k = 0; k < nd.length; k++) if (words[j + k] !== nd[k]) { ok2 = false; break; }
          if (ok2) last = j;
        }
        return last;
      }
    }
  }
  return -1;
}

/** Every position where `runWords` occurs contiguously. */
function positions(src, runWords) {
  const cands = src.at.get(runWords.slice(0, SEED).join(" ")) || [];
  const hits = [];
  for (const p of cands) {
    let ok = true;
    for (let k = 0; k < runWords.length; k++) if (src.words[p + k] !== runWords[k]) { ok = false; break; }
    if (ok) hits.push(p);
  }
  return hits;
}

function longestWithPos(text) {
  const w = norm(text).split(" ").filter(Boolean);
  let best = 0, bestText = "", bestSrc = "", bestAt = [];
  for (const [key, src] of sources) {
    for (let i = 0; i + SEED <= w.length; i++) {
      const cands = src.at.get(w.slice(i, i + SEED).join(" "));
      if (!cands) continue;
      let n = 0;
      for (const p of cands) {
        let k = 0;
        while (i + k < w.length && src.words[p + k] === w[i + k]) k++;
        if (k > n) n = k;
      }
      if (n > best) {
        best = n; bestText = w.slice(i, i + n).join(" "); bestSrc = key;
        bestAt = positions(src, w.slice(i, i + n));
      }
    }
  }
  return { best, bestText, bestSrc, bestAt };
}

/* Structure per source, and it is ASSERTED rather than assumed: a boundary at
 * or before clause 4, or one at the very end, means the locator failed and
 * every percentage below would be computed against a denominator of noise. */
const struct = new Map();
for (const [key, src] of sources) {
  const total = src.words.length;
  const annexAt = annexBoundaryWord(src.words);
  const c4 = clause4Word(src.words, annexBoundaryWord(src.words));
  const hasAnnex = annexAt > 0 && annexAt < total;
  const normEnd = hasAnnex ? annexAt : total;
  const normStart = c4 >= 0 ? c4 : 0;
  /* ============ THE DENOMINATOR IS ASSERTED, NOT ASSUMED ============
   *
   * `clause4Word` looks for the harmonised clause-4 subject phrase. ISO 19011
   * clause 4 is *Principles of auditing* and contains no such phrase, so the
   * locator falls through to a late, unrelated occurrence -- and 27002 and
   * 27005 place clause 4 AFTER their annex boundary, which is impossible.
   *
   * A core of zero, or a clause 4 after the annex, is a FAILED LOCATION and
   * not a small core. Reporting a percentage against it would be the vacuous
   * pass this repository keeps paying for: an extraction that found nothing,
   * scored as a result. Marked unsound, printed as such, never as a number. */
  /* ============ SOUND MEANS VERIFIED, NOT MERELY PLAUSIBLE ============
   *
   * The structural test -- clause 4 found, before the annex, core non-empty --
   * is necessary and NOT sufficient. ISO 19011 passed it twice with two
   * different wrong anchors, producing a confident 1.27 percent and then a
   * confident 2.52 percent, because "principles of auditing" recurs in its
   * later guidance and the last body occurrence is not the clause heading.
   *
   * A denominator that is structurally plausible and semantically wrong is
   * worse than one that fails: nothing about it looks broken, and tuning the
   * needle until the number looks reasonable is fitting the instrument to the
   * expected answer.
   *
   * So the family is DECLARED. The harmonised requirements standards open
   * clause 4 with a phrase that occurs once as a heading, and those two have
   * been checked by hand against the PDF. Everything else reports UNSOUND
   * until someone verifies its anchor -- which is a smaller claim and a true
   * one. */
  const VERIFIED = new Set(["27001:2022", "42001:2023"]);
  const sound = VERIFIED.has(key) && c4 >= 0 && normEnd > normStart && (annexAt <= 0 || c4 < annexAt);
  struct.set(key, { total, annexAt: hasAnnex ? annexAt : null, c4: c4 >= 0 ? c4 : null,
                    normStart, normEnd, normWords: Math.max(0, normEnd - normStart), sound });
}

console.log("");
console.log("SOURCE STRUCTURE -- the denominators, from the shared locator");
console.log("  standard           total   clause4   annexA   normative core");
for (const [k, s] of struct) {
  console.log("  " + k.padEnd(18) + String(s.total).padStart(7) +
    String(s.c4 ?? "-").padStart(10) + String(s.annexAt ?? "-").padStart(9) +
    String(s.normWords).padStart(16) + (s.sound ? "" : "   UNSOUND -- anchor not verified"));
}

const certs = await allRows("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const modules = await allRows("modules?select=id,certification_id");
const certOfModule = new Map(modules.map((m) => [m.id, codeOf.get(m.certification_id)]));
const lessons = (await allRows("lessons?select=slug,language,content_md,module_id"))
  .filter((l) => l.language === "en");

const quotes = [];
for (const l of lessons) {
  const cert = certOfModule.get(l.module_id) || "?";
  for (const q of quoteLines(l.content_md || "")) {
    if (!q.attributed) continue;
    const r = longestWithPos(q.line.replace(/^\s*>\s?/, ""));
    if (!r.best) continue;
    const s = struct.get(r.bestSrc);
    /* Where the span sits. A span with several occurrences counts as
     * normative if ANY occurrence is in the normative core, because that is
     * the reading most favourable to us and the finding survives it. */
    const inNorm = r.bestAt.some((p) => p >= s.normStart && p < s.normEnd);
    const inAnnex = s.annexAt !== null && r.bestAt.some((p) => p >= s.annexAt);
    quotes.push({ cert, slug: l.slug, run: r.best, src: r.bestSrc,
                  zone: inNorm ? "normative" : (inAnnex ? "annex" : "front"), text: r.bestText });
  }
}

const agg = new Map();
for (const q of quotes) {
  const k = q.src + "|" + q.cert;
  const a = agg.get(k) || { src: q.src, cert: q.cert, spans: 0, words: 0, norm: 0, annex: 0, front: 0, longest: 0 };
  a.spans++; a.words += q.run; a.longest = Math.max(a.longest, q.run);
  a[q.zone === "normative" ? "norm" : q.zone === "annex" ? "annex" : "front"] += q.run;
  agg.set(k, a);
}

console.log("");
console.log("ATTRIBUTED QUOTATION, split by where the span sits in the source");
console.log("  standard        cert       spans  words   norm  annex  front   % of WHOLE   % of NORMATIVE CORE");
for (const a of [...agg.values()].sort((x, y) => y.words - x.words)) {
  const s = struct.get(a.src);
  const whole = (100 * a.words / s.total).toFixed(2) + "%";
  const core = s.sound ? (100 * a.norm / s.normWords).toFixed(2) + "%" : "UNSOUND";
  console.log("  " + a.src.padEnd(16) + a.cert.padEnd(10) + String(a.spans).padStart(6) +
    String(a.words).padStart(7) + String(a.norm).padStart(7) + String(a.annex).padStart(7) +
    String(a.front).padStart(7) + whole.padStart(13) + core.padStart(22));
}

console.log("");
console.log("  UNSOUND means this standard's clause-4 anchor has not been verified by hand.");
console.log("  The structural test is necessary and not sufficient: 19011 passed it twice");
console.log("  with two different wrong anchors, giving a confident 1.27% and then a");
console.log("  confident 2.52%. Tuning a needle until the number looks reasonable is");
console.log("  fitting the instrument to the expected answer.");
console.log("");
console.log("  The left percentage divides by the whole document, annex and front matter");
console.log("  included. The right divides the NORMATIVE words quoted by the normative core,");
console.log("  which is the part a requirements course actually reproduces.");

if (JSON_OUT) {
  writeFileSync(join(ROOT, "QUOTATION-DENOMINATOR.json"), JSON.stringify({
    measured: new Date().toISOString(),
    structure: Object.fromEntries([...struct.entries()]),
    aggregate: [...agg.values()],
    quotes,
  }, null, 2), "utf8");
  console.log("");
  console.log("  wrote QUOTATION-DENOMINATOR.json");
}
