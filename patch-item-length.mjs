#!/usr/bin/env node
/**
 * patch-item-length.mjs
 *
 * BOUND THE ITEM LENGTH.
 *
 * The item pipeline enforces RELATIVE parallelism - options must be "closely matched" in
 * length, so the key does not stand out. That killed the length CUE, which was the point.
 * But nothing bounds the ABSOLUTE length, so four equally-long options at 45 words each
 * sail through the guard.
 *
 * A real item from the AIGRM-I dry run:
 *
 *     ~50-word stem + 4 options x ~45 words = ~230 words
 *
 * At ~150 wpm for careful reading of technical prose, that is 92 SECONDS TO READ, before
 * a single second of thinking. The exam budget is 68 seconds per item.
 *
 * THIS IS CONSTRUCT-IRRELEVANT VARIANCE IN A NEW COSTUME. An exam that cannot be read in
 * the time allowed measures reading speed and working memory, not the competence the JTA
 * declares. And it does not fail candidates evenly: Spanish and Portuguese run 15-25%
 * longer than English for identical content, so the same item on the same clock is a
 * harder item in es-419 and pt-BR. That is differential item functioning, designed in.
 *
 * WHAT IS *NOT* CHANGING, AND WHY.
 *
 * The "option, because rationale" style stays:
 *
 *     "AI governance, because the activities establish organizational structures,
 *      roles, and accountability mechanisms that direct how AI is developed and used"
 *
 * It is verbose, but it is load-bearing. Forcing every option to carry its own reasoning
 * is what makes distractors SUBSTANTIVELY wrong rather than merely wrong-sounding - and
 * it is precisely what removed the length cue, because the key can no longer be the only
 * option with a justification attached. Medical board exams use the same pattern. We are
 * bounding it, not abandoning it.
 *
 * THE CEILING
 *   stem   <= 60 words
 *   option <= 25 words
 *   => worst case ~160 words/item ~= 64s reading + thinking time inside a 90s budget.
 *
 * Guarded: anchors must match exactly once.
 */

import fs from "node:fs";
import path from "node:path";

const S = path.resolve("scripts");
const PATCHES = [];

// --- 1. The drafting prompt: state the ceiling -----------------------------
PATCHES.push({
  file: "lib/item-pipeline.mjs",
  what: "word ceiling in the draft prompt",
  find: `same level of specificity, and closely matched length. The correct answer must`,
  repl: `same level of specificity, and closely matched length.

LENGTH CEILING - a hard limit, not a style preference:
  * The stem is at most 60 WORDS.
  * EACH option is at most 25 WORDS.
An exam that cannot be READ in the time allowed measures reading speed, not competence -
and it penalises the Spanish and Portuguese versions hardest, since they run 15-25% longer
than English for the same content. Keep every option's "X, because Y" rationale - that is
what makes a distractor substantively wrong rather than merely wrong-sounding - but say it
TIGHTLY. Cut hedges, cut throat-clearing, cut restatements of the stem.

The correct answer must`,
});

// --- 2. The critique stage: reject overlong items --------------------------
PATCHES.push({
  file: "lib/item-pipeline.mjs",
  what: "critique stage rejects items over the ceiling",
  find: `cluster absolute words (always/never/must/only). The answer must be findable`,
  repl: `cluster absolute words (always/never/must/only).

REJECT any item whose stem exceeds 60 words, or any option exceeding 25 words. Do not
merely flag it - rewrite it inside the ceiling, preserving the reasoning in each option.
If an item cannot be said inside the ceiling, it is testing reading stamina rather than
the competence, and should be rejected outright.

The answer must be findable`,
});

// --- 3. validateEnglish: a hard programmatic gate --------------------------
PATCHES.push({
  file: "lib/item-pipeline.mjs",
  what: "validateEnglish() enforces the ceiling programmatically",
  find: `  if (typeof q.explanation !== "string" || q.explanation.length < 5) return false;`,
  repl: `  if (typeof q.explanation !== "string" || q.explanation.length < 5) return false;

  // LENGTH CEILING. The prompt asks; this enforces. An item that cannot be read inside
  // the exam's per-item budget measures reading speed, not competence - and measures it
  // most harshly in es-419 and pt-BR, which run 15-25% longer for identical content.
  const words = (s) => String(s || "").trim().split(/\\s+/).filter(Boolean).length;
  if (words(q.question_text) > 60) return false;
  if ((q.options || []).some((o) => words(o.text) > 25)) return false;`,
});

// ---------------------------------------------------------------------------
const byFile = new Map();
let ok = true;

for (const p of PATCHES) {
  const fp = path.join(S, p.file);
  if (!fs.existsSync(fp)) { console.error(`  MISSING  ${p.file}`); ok = false; continue; }
  if (!byFile.has(p.file)) byFile.set(p.file, fs.readFileSync(fp, "utf8"));
  const src = byFile.get(p.file);

  if (src.includes(p.repl)) { console.log(`  already  ${p.file} :: ${p.what}`); continue; }

  const hits = src.split(p.find).length - 1;
  if (hits !== 1) {
    console.error(`  ANCHOR   ${p.file} :: ${p.what} -> matched ${hits}x, expected 1`);
    ok = false;
    continue;
  }
  byFile.set(p.file, src.replace(p.find, p.repl));
  console.log(`  staged   ${p.file} :: ${p.what}`);
}

if (!ok) { console.error("\nABORTED. Nothing written."); process.exit(1); }

for (const [file, out] of byFile) {
  const fp = path.join(S, file);
  fs.writeFileSync(fp + ".bak", fs.readFileSync(fp));
  fs.writeFileSync(fp, out, "utf8");
  console.log(`\n  WROTE  ${file}`);
}

console.log(`
Stem <= 60 words. Option <= 25 words. Asked in the prompt, enforced in validateEnglish().
The "because rationale" style is kept - it is what killed the length cue - but bounded.`);
