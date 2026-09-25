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
const CH = ["structure", "accent", "modal", "convem", "cia", "ceiling", "ratio", "language"];
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

o.push("## What none of this can do", "");
o.push("Every check compares a translation with its **English**. None can see a translated");
o.push("reproduction of ISO text, because the leak index holds English editions only and a");
o.push("translated quotation scores zero by construction. Unchanged, and still the largest of the");
o.push("three coverage gaps this repository records.", "");

writeFileSync(join(ROOT, "STRATIFIED-READ.md"), o.join("\n"), "utf8");
console.log("wrote STRATIFIED-READ.md");
