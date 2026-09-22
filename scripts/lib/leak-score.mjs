/**
 * leak-score.mjs - the one scorer. Runs, coverage, and the union rule.
 *
 * Shared so the gate, the diagnostics and any report cannot drift apart. Two
 * hand-written copies of one idea diverge, and the divergence shows up as a
 * refusal of correct work.
 *
 * ============ THE PARAMETERS, AND WHY EACH IS WHAT IT IS ============
 *
 *   SEED = 4      the n-gram width. A match must be at least this long to
 *                 register at all.
 *   MIN_RUN = 4   noise floor. Moved from 6 on 2026-09-21: ISMS-F
 *                 `risk-identification` read "finding, recognizing and
 *                 describing risks" -- five words, all five in an indexed
 *                 standard, coverage 1.00 -- and passed because 5 < 6. A
 *                 threshold that lets a COMPLETE reproduction through because
 *                 the thing reproduced is short is the scale defect the
 *                 instrument exists to escape.
 *   MIN_COV = 0.60  coverage carries the judgement. A run that is most of the
 *                 text IS the text.
 *
 * ============ PER SOURCE, NEVER A UNION OF SOURCES ============
 *
 * Greedy extension over a combined gram set chains a run out of one document
 * and into another across a junction present in neither, making the length a
 * property of the INDEX rather than of any standard. Measured on the lesson
 * corpus 2026-09-21: four of eight refused groups held no contiguous match in
 * any single standard, and one reported 14 words where the longest real
 * fragment was 9. Score each source separately and take the maximum after.
 *
 * ============ THE UNION RULE, AND ITS THREE CONDITIONS ============
 *
 * `confidentiality` read "information is not made available to unauthorized
 * individuals, entities or processes" -- ISO/IEC 27000's definition of the
 * term with "or disclosed" omitted. That single omission splits one total
 * reproduction into runs of 5 and 6, so the LONGEST-RUN coverage is 6/11 =
 * 0.545 and the gate said nothing. Union coverage is 11/11 = 1.00.
 *
 * A RAW UNION IS NOT THE ANSWER. It re-creates the cross-document chaining
 * defect from the other end: `pdca-cycle` scores 0.667 by summing "plan do
 * check act" and "of a management system", two commonplaces four words apart
 * that no source ever joined. Summing spans the source never joined is the
 * same manufactured adjacency, one level up.
 *
 * So two runs merge only when ALL THREE hold:
 *
 *   1. ABUTTING IN THE DESCRIPTION -- description-side gap <= 0. A larger gap
 *      means the description put its own words between them, which is what a
 *      paraphrase looks like.
 *   2. SAME SOURCE DOCUMENT. Merging across documents is the chaining defect
 *      by definition.
 *   3. NEAR-CONTIGUOUS IN THE SOURCE -- source-side gap <= 3 words, and
 *      forward. That is what an interpolation like "or disclosed" costs. Two
 *      spans from opposite ends of a standard are a coincidence, not a
 *      reproduction, however neatly they abut in our text.
 *
 * Condition 3 is the one that cannot be skipped: without it, a description
 * that happens to abut two unrelated commonplaces scores as a total
 * reproduction, and we would manufacture the finding rather than measure it.
 */
import { readFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PDFS, expectedWords } from "./citation-index.mjs";

export const SEED = 4;
export const MIN_RUN = 4;
export const MIN_COV = 0.60;
/* ============ AND AN ABSOLUTE FLOOR, BECAUSE COVERAGE IS A RATIO ==========
 *
 * The rule was a CONJUNCTION -- run >= MIN_RUN AND coverage >= MIN_COV -- and
 * coverage is matched-words over description-words. So a LONGER description
 * dilutes a reproduction until it disappears. Four more words of our own
 * around a verbatim ISO sentence takes it under the floor and the gate goes
 * quiet.
 *
 * ISMS-IA `ia-independence-of-the-activity-audited-4-6` carries a SINGLE
 * CONTIGUOUS 17-WORD RUN of ISO 19011:2026 cl.4.6 at coverage 0.548, and did
 * not fire. Seventeen words is not a commonplace and no ratio should be able
 * to excuse it.
 *
 * ABS_RUN = 10 is not a new number: it is the LESSON-SCALE threshold, and a
 * description long enough to dilute a 17-word run is sitting at lesson scale.
 * The concept-scale gate replaced the lesson gate and dropped the floor on the
 * way.
 */
export const ABS_RUN = 10;
export const DESC_GAP_MAX = 0;
export const SRC_GAP_MAX = 3;

export const norm = (s) => String(s || "").toLowerCase()
  .replace(/[‘’]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
export const W = (s) => norm(s).split(" ").filter(Boolean);

/** Per source: the word array, the seed-gram set, and gram -> positions. */
export function buildSources() {
  const out = new Map();
  for (const [key, p] of Object.entries(PDFS)) {
    const o = join(mkdtempSync(join(tmpdir(), "leak-")), "t.txt");
    execFileSync("pdftotext", ["-layout", p, o]);
    const words = W(readFileSync(o, "utf8"));
    if (words.length !== expectedWords(key)) {
      throw new Error(key + " extracted " + words.length + " words, manifest says " + expectedWords(key));
    }
    const grams = new Set();
    const at = new Map();
    for (let i = 0; i + SEED <= words.length; i++) {
      const g = words.slice(i, i + SEED).join(" ");
      grams.add(g);
      if (!at.has(g)) at.set(g, []);
      at.get(g).push(i);
    }
    /* Where Annex A begins, as a WORD offset. A run landing beyond it
     * reproduces annex structure -- control titles, objective names -- rather
     * than clause text, and that is the title-class question, not a leak. */
    /* LAST OCCURRENCE, NEVER THE FIRST. The first "annex a normative" in any
     * of these PDFs is the TABLE OF CONTENTS entry -- measured: it put 27001's
     * boundary 6 percent into the document and 42001's at 2 percent, so almost
     * every clause-text match downstream was classified as annex structure.
     * The same table-of-contents defect that `clauseText` already carries a
     * dot-leader guard against, in a second instrument.
     *
     * Also accept "informative": not every Annex A is normative, and a
     * locator that only knows one word reports NO ANNEX for the rest, which
     * is silent under-classification rather than loud failure. */
    let annexAt = words.length;
    for (let i = 0; i + 3 <= words.length; i++) {
      if (words[i] === "annex" && words[i + 1] === "a" &&
          (words[i + 2] === "normative" || words[i + 2] === "informative")) annexAt = i;
    }
    out.set(key, { words, grams, at, annexAt });
  }
  return out;
}

/** Where a run of description words sits in the source. Every occurrence. */
function sourcePositions(src, runWords) {
  const first = runWords.slice(0, SEED).join(" ");
  const cands = src.at.get(first) || [];
  const hits = [];
  for (const p of cands) {
    let ok = true;
    for (let k = 0; k < runWords.length; k++) {
      if (src.words[p + k] !== runWords[k]) { ok = false; break; }
    }
    if (ok) hits.push(p);
  }
  return hits;
}

/** All runs against one source, each carrying its source positions. */
function runsAgainst(text, src) {
  const w = W(text);
  const out = [];
  for (let i = 0; i + SEED <= w.length; i++) {
    if (!src.grams.has(w.slice(i, i + SEED).join(" "))) continue;
    let n = SEED;
    while (i + n + 1 <= w.length && src.grams.has(w.slice(i + n + 1 - SEED, i + n + 1).join(" "))) n++;
    const words = w.slice(i, i + n);
    const sourceAt = sourcePositions(src, words);
    const inAnnex = sourceAt.length > 0 && sourceAt.every((p) => p >= src.annexAt);
    out.push({ start: i, len: n, text: words.join(" "), sourceAt, inAnnex });
    i += n - 1;
  }
  return out;
}

/**
 * Score one text against one source. Returns the runs, both coverages, and
 * the merge decisions with the evidence for each.
 */
export function scoreAgainst(text, key, src) {
  const w = W(text);
  const runs = runsAgainst(text, src);
  const merges = [];
  /* Merge left to right under the three conditions. */
  const merged = [];
  let cur = runs.length ? { ...runs[0], parts: [runs[0]] } : null;
  for (let i = 1; i < runs.length; i++) {
    const prev = runs[i - 1], next = runs[i];
    const descGap = next.start - (prev.start + prev.len);
    /* Best forward source-side gap over every pairing of occurrences. */
    let srcGap = null;
    for (const a of prev.sourceAt) for (const b of next.sourceAt) {
      const g = b - (a + prev.len);
      if (g < 0) continue;
      if (srcGap === null || g < srcGap) srcGap = g;
    }
    const sameSource = true; // runsAgainst is already per source
    const ok = descGap <= DESC_GAP_MAX && sameSource && srcGap !== null && srcGap <= SRC_GAP_MAX;
    merges.push({ from: prev.text, to: next.text, descGap, srcGap, sameSource, merged: ok });
    if (ok) {
      cur.len = next.start + next.len - cur.start;
      cur.text = w.slice(cur.start, cur.start + cur.len).join(" ");
      cur.parts.push(next);
    } else {
      merged.push(cur);
      cur = { ...next, parts: [next] };
    }
  }
  if (cur) merged.push(cur);

  const longest = runs.reduce((m, r) => Math.max(m, r.len), 0);
  const longestMerged = merged.reduce((m, r) => Math.max(m, r.len), 0);
  /* A row is ANNEX-STRUCTURE when every contributing run sits inside Annex A. */
  const annexStructure = runs.length > 0 && runs.every((r) => r.inAnnex);
  return {
    source: key, words: w.length, runs, merges, merged, annexStructure,
    maxRun: longest,
    maxCov: w.length ? longest / w.length : 0,
    unionRun: longestMerged,
    unionCov: w.length ? longestMerged / w.length : 0,
  };
}

/** Best result across every source. Per source, never a union of sources. */
export function score(text, sources) {
  let best = null;
  for (const [key, src] of sources) {
    const s = scoreAgainst(text, key, src);
    if (!s.runs.length) continue;
    if (!best || s.unionCov > best.unionCov || (s.unionCov === best.unionCov && s.maxRun > best.maxRun)) best = s;
  }
  return best || { source: "", words: W(text).length, runs: [], merges: [], merged: [],
                   annexStructure: false, maxRun: 0, maxCov: 0, unionRun: 0, unionCov: 0 };
}

export const firesCurrent = (s) => s.maxRun >= MIN_RUN && s.maxCov >= MIN_COV;
/* The ratio arm. */
export const firesRatio = (s) => s.unionRun >= MIN_RUN && s.unionCov >= MIN_COV;
/* The absolute arm -- length alone, whatever the ratio says. */
export const firesAbsolute = (s) => s.unionRun >= ABS_RUN;
/* THE RULE: (run >= 4 AND coverage >= 0.60) OR (run >= 10). */
export const firesUnion = (s) => firesRatio(s) || firesAbsolute(s);

/* ============ ARITHMETIC, NOT REPRODUCTION ============
 *
 * A 5-word description gives 4/5 = 0.80 for free. A 4-word run on a short
 * description clears the coverage floor by arithmetic rather than by
 * reproducing anything -- `cryptographic-controls` fired on "use and
 * management of", four words that sit at 27002 cl.5.16 IDENTITY MANAGEMENT
 * and not at any cryptography control title.
 *
 * Reported as its own class rather than filtered out: the rows may still be
 * bad descriptions, and they are, but they are not evidence of copying. */
export const isArithmetic = (s) => s.unionRun <= 5 && s.words < 8;

/** A known reproduction must fire, or the index is empty and every clean
 *  verdict is worthless. */
export const CANARY = "the organization shall determine external and internal issues that are relevant to its purpose";
export function assertCanary(sources) {
  const s = score(CANARY, sources);
  if (!firesCurrent(s)) {
    throw new Error("POSITIVE CONTROL FAILED: 27001 cl.4.1 canary scored " +
                    s.maxRun + "w/" + s.maxCov.toFixed(2) + ". The index is empty or broken.");
  }
  return s;
}
