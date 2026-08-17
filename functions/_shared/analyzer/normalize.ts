// _shared/analyzer/normalize.ts
//
// Turn whatever came out of a PDF, a web page or a paste into text the rules
// can match against, WITHOUT destroying the signal the rules look for.
//
// The judgment call throughout: fold characters that are typographic accidents
// (a PDF extractor emitting a non-breaking hyphen, a word processor curling a
// quote) and leave alone anything that could carry meaning. Folding U+2011 to
// "-" is what lets rule 7 see "time-box" in a PDF. Folding "Developers" to
// lowercase would be fine for matching but would ruin the evidence excerpt, so
// case is preserved and matching is case-insensitive instead.

import type { NormalizedSource } from "./types.ts";

/** Typographic variants that PDF and HTML extraction routinely produce. */
const FOLD: Array<[RegExp, string, string]> = [
  [/\u00AD/g, "", "soft hyphen removed"],
  [/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, "-", "unicode dashes folded to hyphen"],
  [/[\u2018\u2019\u201A\u201B]/g, "'", "curly single quotes folded"],
  [/[\u201C\u201D\u201E\u201F]/g, '"', "curly double quotes folded"],
  [/\u2026/g, "...", "ellipsis expanded"],
  [/[\u00A0\u2007\u202F]/g, " ", "non-breaking spaces folded"],
  [/[\u200B\u200C\u200D\uFEFF]/g, "", "zero-width characters removed"],
  [/\u2022/g, "- ", "bullets folded"],
];

/**
 * Rejoin words broken across a line by a hyphen, which PDF extraction produces
 * constantly. "self-\norganizing" must become "self-organizing" or rule 2
 * silently misses it.
 *
 * Deliberately conservative: only when a lowercase letter precedes the hyphen
 * and a lowercase letter follows the break. "Scrum-\nMaster" is left alone
 * because a capital after the break may be a real compound.
 */
function rejoinHyphenation(text: string): { text: string; changed: boolean } {
  const out = text.replace(/([a-z])-\s*\n\s*([a-z])/g, "$1-$2");
  return { text: out, changed: out !== text };
}

/**
 * Collapse runs of whitespace but PRESERVE paragraph breaks. Contrastive
 * detection (drift.ts) works on a window of surrounding characters, and losing
 * paragraph structure would let it read across unrelated sections.
 */
function collapseWhitespace(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Word count used by the density guard.
 *
 * Counts whitespace-delimited tokens containing at least one letter or digit,
 * so a bullet list of "- - -" is not credited as content. Unicode-aware, so
 * Spanish and Portuguese accented words count normally.
 */
export function countWords(text: string): number {
  const tokens = text.split(/\s+/);
  let n = 0;
  for (const t of tokens) {
    if (/[\p{L}\p{N}]/u.test(t)) n++;
  }
  return n;
}

export function normalize(raw: string): NormalizedSource {
  const transforms: string[] = [];
  let text = raw;

  for (const [pattern, replacement, label] of FOLD) {
    if (pattern.test(text)) {
      transforms.push(label);
      pattern.lastIndex = 0;
    }
    text = text.replace(pattern, replacement);
  }

  const rejoined = rejoinHyphenation(text);
  if (rejoined.changed) transforms.push("line-broken hyphenation rejoined");
  text = rejoined.text;

  text = collapseWhitespace(text);

  return {
    text,
    wordCount: countWords(text),
    charCount: text.length,
    transforms,
  };
}
