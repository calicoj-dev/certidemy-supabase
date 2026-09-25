#!/usr/bin/env node
/**
 * gen-stratified-report.mjs -- render STRATIFIED-READ.md from the artifact.
 *
 * READ-ONLY apart from the one markdown file it writes. No flags.
 *
 * It is a FILE and not a `node -e` one-liner because the report contains
 * backticks, and a backtick inside a double-quoted shell argument is command
 * substitution. That is the same transport class as the halved backslash, and
 * it mangled this document once before this script existed.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const j = JSON.parse(readFileSync(join(ROOT, "STRATIFIED-READ.json"), "utf8"));
const CH = ["structure", "accent", "modal-sentence", "defined-term", "register",
            "convem", "cia", "ceiling", "ratio", "language"];
/* Reported but NOT counted toward a verdict: `clause-vocab` is a consistency
 * measure, `modal` is the superseded document-level ranking, and `unalignable`
 * is a coverage fact rather than a defect. */
const REPORT_ONLY = ["clause-vocab", "modal", "unalignable"];
const B = "`";
const o = [];
const chars = j.rows.reduce((a, r) => a + r.chars, 0);
const by = {};
for (const r of j.rows) for (const f of r.flags) by[f.check] = (by[f.check] || 0) + 1;

o.push("# Stratified read -- mechanical checks over the never-reviewed corpus", "");
o.push("Measured " + j.measured + ". **Report only. Nothing was fixed.**", "");
o.push("```");
o.push("population    " + j.population + " never-reviewed translated lesson rows");
o.push("characters    " + chars.toLocaleString());
o.push("strata        " + Object.keys(j.strata).length + " generation runs");
o.push("```", "");

o.push("## The frame is five times what the withheld subset suggested", "");
o.push("The three strata were derived from the never-reviewed **and withheld** rows: 174 across");
o.push("three runs. The never-reviewed population as a whole is **917 rows across 14 runs** --");
o.push("most of them SERVING, because " + B + "mcp_translation_review_required" + B + " is false on their groups, so");
o.push("no review was ever required of them.", "");
o.push("The checks below cover all 917. The paired sample covers the three named runs. Whether to");
o.push("widen the reading frame is the decision this number exists to inform.", "");

o.push("## Flags per stratum and language, as a rate", "");
o.push("Flags per 10,000 characters. Raw counts would rank the runs by which one was bigger.", "");
o.push("| stratum | lang | rows | chars | " + CH.join(" | ") + " | /10k |");
o.push("|---|---|---|---|" + CH.map(() => "---").join("|") + "|---|");
for (const [k, langs] of Object.entries(j.strata).sort()) {
  for (const [l, s] of Object.entries(langs).sort()) {
    const tot = CH.reduce((a, c) => a + (s.by[c] || 0), 0);
    o.push("| " + k + " | " + l + " | " + s.rows + " | " + s.chars.toLocaleString() + " | " +
      CH.map((c) => s.by[c] || 0).join(" | ") + " | **" + (tot / (s.chars / 10000)).toFixed(2) + "** |");
  }
}
o.push("");

o.push("## What each column is worth", "");
o.push("| check | flags | what it is |");
o.push("|---|---|---|");
o.push("| structure | " + (by.structure || 0) + " | **a finding, and the cheapest one here** |");
o.push("| accent | " + (by.accent || 0) + " | candidates; 1,000 before the members were read |");
o.push("| modal | " + (by.modal || 0) + " | **a RANKING, not a defect list** -- see below |");
o.push("| convem | " + (by.convem || 0) + " | placement, pt-BR only |");
o.push("| ceiling | " + (by.ceiling || 0) + " | a span over the language allowance |");
o.push("| ratio | " + (by.ratio || 0) + " | a span over the p95 quote ratio |");
o.push("| cia | " + (by.cia || 0) + " | CIA vocabulary with no CIA term in the English |");
o.push("| language | " + (by.language || 0) + " | reads as the wrong language |");
o.push("");

const st = {};
for (const r of j.rows) for (const f of r.flags) if (f.check === "structure") {
  const k = f.detail.split(" ")[0]; st[k] = (st[k] || 0) + 1;
}
o.push("## Structure -- " + (by.structure || 0) + " flags, and this is the real yield", "");
o.push("```");
for (const [k, v] of Object.entries(st).sort((a, b) => b[1] - a[1])) o.push("  " + k.padEnd(12) + v);
o.push("```", "");
o.push("These are " + B + "baseline" + B + " rows: 367 stamped them without anybody establishing that each");
o.push("translation ever tracked its English. A heading present in English and absent from BOTH");
o.push("translations, or a blockquote the translation has and the English does not, is a divergence");
o.push("no paragraph-level read would find. It needs no model and no index.", "");
o.push("Examples:", "");
for (const r of j.rows.filter((r) => r.flags.some((f) => f.check === "structure")).slice(0, 12)) {
  o.push("- " + B + r.slug + B + " / " + r.language + " -- " +
    r.flags.filter((f) => f.check === "structure").map((f) => f.detail).join(", "));
}
o.push("");

o.push("## Accent -- 1,000 flags became " + (by.accent || 0) + ", by reading them", "");
o.push("The first run reported **1,000**. The top members were " + B + "items" + B + " 238, " + B + "hacia" + B + " 214,");
o.push(B + "estas" + B + " 128, " + B + "seria" + B + " 86 -- diacritic pairs, part-of-speech pairs, and English");
o.push("loanwords sitting in translated prose against their accented Spanish cognates. The");
o.push("5,569-to-36 finding, arriving again in a new place.", "");
o.push("Two narrowings, both DECLARED rather than inferred:", "");
o.push("- the missing diacritic and part-of-speech members added to " + B + "lib/accent-classes.mjs" + B + " by");
o.push("  name, each with the count that justified it;");
o.push("- **a token the row's own English carries is a loanword in context, not a dropped accent.**");
o.push("  A per-row test needing no dictionary, because the English sibling is already in hand.", "");
o.push("Survivors, which read as genuine:", "");
const acc = {};
for (const r of j.rows) for (const f of r.flags) if (f.check === "accent") {
  const k = r.language + " " + f.detail; acc[k] = (acc[k] || 0) + 1;
}
o.push("```");
for (const [k, v] of Object.entries(acc).sort((a, b) => b[1] - a[1]).slice(0, 16)) {
  o.push("  " + String(v).padStart(4) + "  " + k);
}
o.push("```", "");
o.push("A residue of the part-of-speech class survives -- " + B + "divida" + B + ", " + B + "perdida" + B + ", " + B + "publicas" + B + ",");
o.push(B + "incomoda" + B + " are all pairs where both members are words. They are candidates for a human,");
o.push("not defects, and the list says so rather than guessing.", "");

o.push("## The modal column is a RANKING and must not be read as " + (by.modal || 0) + " defects", "");
o.push("It compares modal COUNTS across a whole body: " + B + "should" + B + " in the English against obligation");
o.push("forms in the translation. A " + B + "should" + B + " in paragraph 2 and a " + B + "deve" + B + " in paragraph 9 are not");
o.push("necessarily the same sentence, so this is a document-level heuristic that points at rows");
o.push("worth reading. Settling one needs sentence alignment, which is what the paired sample is for.", "");
o.push("It skews pt-BR, consistent with ABNT rendering " + B + "should" + B + " as " + B + "deve" + B + " in registers where");
o.push(B + "convem que" + B + " would be the careful form -- the same construction the batch review corrected");
o.push("three times by hand.", "");

/* ---------------------------------------------------------------- verdicts */
o.push("## Per-stratum verdict -- hand-edit, regenerate, or clear", "");
o.push("A stratum is CLEARED when the checks report nothing material **and** a fresh random half");
o.push("reads clean. **No stratum can be cleared today**, because the random half has not been");
o.push("re-read since checks A to D existed -- the reading that produced them was against the");
o.push("older set. The column below is therefore hand-edit or regenerate, and the clear column");
o.push("waits on a read.", "");
o.push("Density is MATERIAL flags per 10k characters: structure, accent, modal-sentence,");
o.push("defined-term, register, convem, cia, ceiling, ratio, language. Not clause-vocab (a");
o.push("consistency measure), not the superseded document-level modal, not unalignable.", "");
o.push("| stratum | rows | material flags | /10k | rows clean | verdict |");
o.push("|---|---|---|---|---|---|");
const verdicts = [];
for (const [k, langs] of Object.entries(j.strata).sort()) {
  const rows = j.rows.filter((r) => r.key === k);
  const mat = rows.reduce((a, r) => a + r.flags.filter((f) => !REPORT_ONLY.includes(f.check)).length, 0);
  const chs = rows.reduce((a, r) => a + r.chars, 0);
  const clean = rows.filter((r) => !r.flags.some((f) => !REPORT_ONLY.includes(f.check))).length;
  const rate = mat / (chs / 10000);
  /* The threshold is stated, not implied: above 1.0 material flags per 10k the
   * defects are dense enough that fixing them one sentence at a time costs more
   * than regenerating and re-reviewing the batch. Below it they are sparse and
   * each one is pinpointed to a sentence, which is what makes a hand-edit
   * cheaper AND safer than replacing text a human has read. */
  const verdict = rate >= 1.0 ? "REGENERATE" : "hand-edit";
  verdicts.push({ k, rate, verdict });
  o.push("| " + k + " | " + rows.length + " | " + mat + " | **" + rate.toFixed(2) + "** | " +
    clean + "/" + rows.length + " | " + verdict + " |");
}
o.push("");
o.push("**The threshold is 1.0 material flags per 10,000 characters, and it is a judgement with a");
o.push("reason rather than a measurement.** Above it, fixing sentence by sentence costs more than");
o.push("regenerating and re-reviewing; below it, every flag is pinpointed to a sentence, which");
o.push("makes a hand-edit both cheaper and safer than replacing text a human has already read.", "");
{
  const rates = verdicts.map((v) => v.rate).sort((a, b) => a - b);
  const same = new Set(verdicts.map((v) => v.verdict)).size === 1;
  if (same) {
    o.push("### And it did not discriminate, which is worth saying", "");
    o.push("**Every stratum returns the same verdict.** The highest density is " +
      rates[rates.length - 1].toFixed(2) + " and the cut is at 1.0, so");
    o.push("nothing reaches it. A threshold that produces one answer for every member is not a");
    o.push("threshold -- it is a constant wearing a column heading, and presenting it as a decision");
    o.push("would be the vacuous-pass shape in a table.", "");
    o.push("The DATA does separate: " + rates[0].toFixed(2) + " to " + rates[rates.length - 1].toFixed(2) +
      " is a " + (rates[rates.length - 1] / rates[0]).toFixed(1) + "-fold spread, and the clean-row");
    o.push("share runs from 84 percent down to 46. The cut point is the part that needs a decision,");
    o.push("and it is yours -- the spread is here so it can be set against something.", "");
    o.push("| | stratum | /10k | clean |");
    o.push("|---|---|---|---|");
    const ranked = [...verdicts].sort((a, b) => b.rate - a.rate).slice(0, 4);
    for (const v of ranked) {
      const rows = j.rows.filter((r) => r.key === v.k);
      const clean = rows.filter((r) => !r.flags.some((f) => !REPORT_ONLY.includes(f.check))).length;
      o.push("| densest | " + v.k + " | " + v.rate.toFixed(2) + " | " +
        Math.round(100 * clean / rows.length) + "% |");
    }
    o.push("");
  }
}

o.push("## What none of this can do", "");
o.push("Every check compares a translation with its **English**. None can see a translated");
o.push("reproduction of ISO text, because the leak index holds English editions only and a");
o.push("translated quotation scores zero by construction. Unchanged, and still the largest of the");
o.push("three coverage gaps this repository records.", "");

writeFileSync(join(ROOT, "STRATIFIED-READ.md"), o.join("\n"), "utf8");
console.log("wrote STRATIFIED-READ.md");
