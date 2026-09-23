#!/usr/bin/env node
/**
 * measure-attribution-exemption.mjs -- what moves if the quotation exemption
 * is keyed on ATTRIBUTION instead of on markdown form?
 *
 * READ-ONLY. Takes --json, --out <path>, --strict|--loose. Unknown flags exit 2.
 * MEASURES. Deploys nothing.
 *
 * ============ THE DEFECT, AND IT FAILS BOTH WAYS AT ONCE ============
 *
 * Today `attributedQuote = isQuoteLine(line) && isAttributed(line, leadIn)`.
 * The exemption is keyed on whether the author reached for `>`.
 *
 *   UNDER-EXEMPTS   "ISO 19011:2026 clause 3.8 defines audit criteria as the
 *                   set of requirements used as a reference against which
 *                   objective evidence is compared" names the standard, the
 *                   clause and the term, and is scored as a leak. 18 of the 19
 *                   repeated-run findings carry a citation somewhere.
 *
 *   OVER-EXEMPTS    a blockquote is exempt at ANY length and its lead-in is
 *                   checked against nothing much. Form is not attribution: a
 *                   `>` and a plausible sentence above it buy an unlimited
 *                   allowance, which is how 52 contiguous words of ISO 19011
 *                   came to sit in a released certification with nobody having
 *                   decided that.
 *
 * ============ ATTRIBUTION IS A PROPERTY OF THE OCCURRENCE ============
 *
 * The same nine words attributed in one lesson and bare in four is ONE
 * attributed quotation and FOUR reproductions, not a run that is 80 percent
 * attributed. Exempting the PHRASE launders the unattributed uses under cover
 * of the attributed one.
 *
 * So every occurrence is judged on its own evidence and the evidence is
 * recorded with it. A report that groups by phrase states how many of its
 * occurrences qualified.
 *
 * ============ STRICT AND LOOSE ARE BOTH MEASURED, DELIBERATELY ===========
 *
 * The specification is a citation naming STANDARD AND CLAUSE. But CLAUDE.md
 * already records that an unqualified clause reference means the
 * certification's OWN standard -- ISMS-IA writing "Clause 8.2 requires"
 * means 27001 -- so requiring both would score a great many sound
 * attributions as bare.
 *
 * Rather than pick one and report a single number, both are computed and the
 * difference is the finding. A threshold chosen before its effect is measured
 * is the thing this programme keeps having to withdraw.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSources, runUnits, norm, assertCanary, W, SEED, ABS_RUN } from "./lib/leak-score.mjs";
import { STANDARD_RE, ADDRESS_RE, isAttributed, isQuoteLine } from "./lib/iso-segments.mjs";

const KNOWN = new Set(["--json", "--out"]);
const argv = process.argv.slice(2);
let OUT = "ATTRIBUTION-MOVEMENT.md";
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) continue;
  if (!KNOWN.has(a)) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
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

const SPAN_CEILING = 25;   // the per-span ceiling Juan accepted

/** Longest TRUE contiguous run in one stretch of text, extended by position. */
function longest(text) {
  const w = norm(text).split(" ").filter(Boolean);
  let best = 0, bestText = "", bestSrc = "";
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
      if (n > best) { best = n; bestText = w.slice(i, i + n).join(" "); bestSrc = key; }
    }
  }
  return { best, bestText, bestSrc };
}

/**
 * The citation evidence available to ONE occurrence, within a bounded
 * distance: the line itself, and the two preceding non-blank lines.
 *
 * Two lines rather than one because a blockquote is commonly introduced by a
 * sentence that is itself preceded by the clause heading, and rather than
 * "anywhere in the lesson" because a citation three paragraphs away attributes
 * nothing -- which is the same bounded-distance requirement the marked-
 * quotation mechanism was specified with.
 */
function evidenceAt(lines, i) {
  const hay = [lines[i]];
  /* ============ A BLOCK'S ATTRIBUTION SITS ABOVE THE BLOCK ============
   *
   * A fixed two-line window reported NINE occurrences as unattributed, and
   * reading them showed all nine were lines INSIDE a multi-line blockquote
   * whose lead-in sat four or six lines up. Their windows contained nothing
   * but more blockquote.
   *
   * That is not nine reproductions, it is one measurement error -- and it
   * fails in the withholding direction, which is the direction that looks
   * like diligence. `segments()` already had this right: its lead-in is the
   * most recent non-blank, NON-BLOCKQUOTE line.
   *
   * So contiguous quote lines are collected as part of the span's own block
   * and do not consume the look-back budget, which is spent only on prose. */
  let back = 0;
  for (let j = i - 1; j >= 0 && back < 2; j--) {
    const t = String(lines[j]).trim();
    if (!t) continue;
    hay.push(t);
    if (!isQuoteLine(lines[j])) back++;
  }
  const text = hay.join(" ¶ ");
  return { standard: STANDARD_RE.test(text), address: ADDRESS_RE.test(text), text };
}

const certs = await allRows("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const modules = await allRows("modules?select=id,certification_id");
const certOfModule = new Map(modules.map((m) => [m.id, codeOf.get(m.certification_id)]));
const lessons = (await allRows("lessons?select=slug,language,content_md,module_id"))
  .filter((l) => l.language === "en");

/* Every occurrence of a run at or over the floor, with its form and its
 * citation evidence. The unit is a LINE, because that is the grain both the
 * current exemption and the proposed one operate at. */
const occ = [];
for (const l of lessons) {
  const cert = certOfModule.get(l.module_id) || "?";
  const lines = String(l.content_md || "").split(/\r?\n/);
  let leadIn = "";
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i], t = raw.trim();
    if (t && !isQuoteLine(raw)) { /* fall through, but remember it after */ }
    const quote = isQuoteLine(raw);
    if (!t) { continue; }
    const body = quote ? raw.replace(/^\s*>\s?/, "") : raw;
    for (const u of runUnits(body)) {
      const r = longest(u);
      if (r.best < ABS_RUN) continue;
      const ev = evidenceAt(lines, i);
      occ.push({
        cert, slug: l.slug, line: i, quote,
        run: r.best, src: r.bestSrc, text: r.bestText, unit: u.slice(0, 400),
        currentlyExempt: quote && isAttributed(raw, leadIn),
        strict: ev.standard && ev.address,
        loose: ev.standard || ev.address,
        standardOnly: ev.standard && !ev.address,
        evidence: ev.text,
      });
    }
    if (!quote) leadIn = t;
  }
}

/* ============ CONTROLS ============
 * Three, because three things can silently be false: the scorer can find
 * nothing, the citation detector can match everything, and it can match
 * nothing. A detector that fires on all text exempts the corpus; one that
 * fires on none reports it all as leaks. */
const attrStrict = occ.filter((o) => o.strict).length;
const attrLoose = occ.filter((o) => o.loose).length;
if (!occ.length) { console.error("CONTROL FAILED: no occurrences at or over the floor at all."); process.exit(2); }
if (attrLoose === occ.length) { console.error("CONTROL FAILED: the citation detector matches EVERY occurrence."); process.exit(2); }
if (attrStrict === 0) { console.error("CONTROL FAILED: the strict detector matches NO occurrence."); process.exit(2); }

/* ============ WHICH EVIDENCE IS DOING THE WORK ============
 *
 * LOOSE is standard OR address, and `ADDRESS_RE` matches any `\d+\.\d+`.
 * So the question that decides between the two rules is: how many occurrences
 * are attributed by a BARE NUMBER alone, with no standard named anywhere in
 * the window? Those are the ones where loose could be excusing a coincidence
 * rather than reading an attribution.
 *
 * Stated as a number rather than as a worry, because a worry cannot be
 * weighed against 48 sound attributions. */
const byBoth = occ.filter((o) => o.strict).length;
const byStandardOnly = occ.filter((o) => !o.strict && o.loose && o.standardOnly).length;
const byAddressOnly = occ.filter((o) => !o.strict && o.loose && !o.standardOnly).length;
console.log("");
console.log("WHAT THE ATTRIBUTION RESTS ON, per occurrence");
console.log("  standard AND clause address   " + byBoth);
console.log("  the STANDARD named, no address " + byStandardOnly);
console.log("  a bare NUMBER only             " + byAddressOnly + "   <- the risk in LOOSE");
/* READ THE MEMBERS. A count of a lexical class is a draft until someone reads
 * it -- the rule this repository has paid for four times. The question is not
 * how many rest on a number, it is whether those numbers are clause addresses
 * or coincidences. */
const bare = occ.filter((o) => !o.strict && o.loose && !o.standardOnly);
console.log("");
console.log("  the bare-number cases, read rather than counted:");
for (const o of bare.slice(0, 8)) {
  console.log("    " + String(o.run).padStart(3) + "w  " + o.cert.padEnd(9) + o.slug.slice(0, 40));
  console.log("        " + o.evidence.replace(/\s+/g, " ").slice(0, 150));
}

for (const MODE of ["strict", "loose"]) {
  const attributed = (o) => o[MODE];
  const stops = occ.filter((o) => o.currentlyExempt && !attributed(o));
  const becomes = occ.filter((o) => !o.currentlyExempt && attributed(o));
  const overCeiling = occ.filter((o) => attributed(o) && o.run > SPAN_CEILING);
  console.log("");
  console.log("MODE " + MODE.toUpperCase() + (MODE === "strict" ? "  (standard AND clause)" : "  (standard OR clause)"));
  console.log("  occurrences at or over " + ABS_RUN + "w      " + occ.length + "   <- the denominator");
  console.log("  exempt today (blockquote + attributed)  " + occ.filter((o) => o.currentlyExempt).length);
  console.log("  attributed under this rule              " + occ.filter(attributed).length);
  console.log("");
  console.log("  STOP being exempt (withhold)   " + stops.length);
  console.log("  BECOME exempt   (RELEASE)      " + becomes.length + "   <- must be read before deploying");
  console.log("  attributed AND over the " + SPAN_CEILING + "w ceiling  " + overCeiling.length);
}

const MODE = "loose";
const attributed = (o) => o[MODE];
const stops = occ.filter((o) => o.currentlyExempt && !attributed(o));
const becomes = occ.filter((o) => !o.currentlyExempt && attributed(o));
const overCeiling = occ.filter((o) => attributed(o) && o.run > SPAN_CEILING).sort((a, b) => b.run - a.run);

/* §2.3 -- the 52-word span, confirmed rather than assumed. */
const longestQuote = occ.slice().sort((a, b) => b.run - a.run)[0];
console.log("");
console.log("THE LONGEST SPAN IN THE CORPUS, under the rebuilt rule");
console.log("  " + longestQuote.run + "w  " + longestQuote.cert + " / " + longestQuote.slug);
console.log("  exempt today            " + longestQuote.currentlyExempt);
console.log("  attributed (strict)     " + longestQuote.strict);
console.log("  attributed (loose)      " + longestQuote.loose);
console.log("  over the " + SPAN_CEILING + "w ceiling    " + (longestQuote.run > SPAN_CEILING));
console.log("  VERDICT: " + (longestQuote.loose && longestQuote.run > SPAN_CEILING
  ? "survives as ATTRIBUTED and FAILS the ceiling -- which is the correct outcome"
  : "does not follow the predicted path; read it"));

const lines = [];
lines.push("# Attribution-keyed exemption -- what moves");
lines.push("");
lines.push("Nothing is deployed. Both directions, with text, per PROMPT-22 s1.");
lines.push("");
lines.push("Today the exemption is `isQuoteLine(line) && isAttributed(line, leadIn)` -- keyed");
lines.push("on whether the author reached for `>`. Rebuilt, it is keyed on whether a citation");
lines.push("sits within a bounded distance: the line itself or the two preceding non-blank");
lines.push("lines. Markdown form is evidence of nothing.");
lines.push("");
lines.push("**Attribution is judged PER OCCURRENCE.** The same words attributed in one lesson");
lines.push("and bare in four are one quotation and four reproductions.");
lines.push("");
lines.push("## A. STOP being exempt -- " + stops.length + " (withholding, safe direction)");
lines.push("");
for (const o of stops.sort((a, b) => b.run - a.run)) {
  lines.push("- **" + o.cert + "** `" + o.slug + "` -- " + o.run + "w of " + o.src);
  lines.push("  - > " + o.text.slice(0, 200));
}
lines.push("");
lines.push("## B. BECOME exempt -- " + becomes.length + " (RELEASING, read every one)");
lines.push("");
for (const o of becomes.sort((a, b) => b.run - a.run)) {
  lines.push("- **" + o.cert + "** `" + o.slug + "` -- " + o.run + "w of " + o.src +
    (o.run > SPAN_CEILING ? "  **OVER THE " + SPAN_CEILING + "w CEILING, so exempt-but-refused**" : ""));
  lines.push("  - run: " + o.text.slice(0, 200));
  lines.push("  - our line: " + o.unit.slice(0, 260).replace(/\n/g, " "));
}
lines.push("");
lines.push("## C. Attributed AND over the " + SPAN_CEILING + "-word ceiling -- " + overCeiling.length);
lines.push("");
lines.push("These are the spans the ceiling actually bites on. Under today's rule a");
lines.push("blockquote is exempt at any length, so none of these is refused now.");
lines.push("");
for (const o of overCeiling) {
  lines.push("- **" + o.cert + "** `" + o.slug + "` -- " + o.run + "w of " + o.src);
  lines.push("  - > " + o.text.slice(0, 300));
}
writeFileSync(join(ROOT, OUT), lines.join("\n"), "utf8");
console.log("");
console.log("  wrote " + OUT);

if (JSON_OUT) {
  writeFileSync(join(ROOT, "ATTRIBUTION-MOVEMENT.json"), JSON.stringify({
    measured: new Date().toISOString(), ceiling: SPAN_CEILING, floor: ABS_RUN,
    occurrences: occ.length, stops, becomes, overCeiling,
  }, null, 2), "utf8");
  console.log("  wrote ATTRIBUTION-MOVEMENT.json");
}
