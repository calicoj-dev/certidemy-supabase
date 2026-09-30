#!/usr/bin/env node
/**
 * requote-noisy-anchors.mjs -- re-quote every anchor that `quote-noise` fires on, from a CLEAN span of the
 * SAME passage. Reject only where no clean span supports the key.
 *
 * DRY BY DEFAULT; `--apply` rewrites the gated artifacts in place. Unknown flags exit 2. No model calls, no
 * network beyond nothing, no credential.
 *
 * Ruled PROMPT-95 follow-up 2: *"Re-quote the rest from clean spans; reject only when no clean span supports
 * the key."* Repairing the LIBRARY does not repair an ITEM -- an item holds its own stored quote, cut at
 * generation time -- so the nine firing items still fire after 37 passages were de-columned, and should.
 *
 * ============ THE SPAN IS RE-CUT FROM THE PASSAGE, NEVER REWRITTEN ============
 *
 * No span here is edited, paraphrased or retyped. Every replacement is a CONTIGUOUS SUBSTRING of the
 * passage's current text, so `verbatim` is satisfied by construction rather than by luck, and the worst a
 * mistake can do is quote the wrong part of the right clause -- never text the standard does not carry.
 *
 * FIVE RULES, TRIED IN ORDER OF HOW MUCH OF THE ORIGINAL ANCHOR THEY KEEP, AND EVERY RESULT SAYS WHICH ONE
 * PRODUCED IT -- because "re-quoted" without the rule is a claim with no method behind it:
 *
 *   de-wrap            Rejoin the span's own hyphen wraps and look for it verbatim. Keeps ALL of the anchor,
 *                      and works only because the library was repaired first.
 *   drop-leading-term  A DEFINITION span that started at the term, so the term's last word appears twice
 *                      where the library joins term to definition. Cut to the second occurrence.
 *   strip-prefix       The span opened with its passage's own name. Drop it.
 *   longest-common-run The longest run of characters the span and the passage share, trimmed to word
 *                      boundaries.
 *   word-alignment     A word-level longest common subsequence, then the passage region between the first and
 *                      last aligned word. This is what undoes an INTERLEAVE: the other column's words are
 *                      simply not in the repaired text, so they fall out of the alignment.
 *   ...then truncate   Any of the above can still sit on top of noise the PASSAGE carries -- an unrepaired
 *                      hyphen wrap like `re- assignment` in clause 7.2 -- so each candidate is also offered cut
 *                      at that point, longer clean side kept.
 *   REJECT             None yields a clean span meeting the anchor floor. Reported, and NOT edited.
 *
 * ============ AND A SECOND POPULATION APPEARED THE MOMENT THE LIBRARY WAS REPAIRED ============
 *
 * An anchor that quoted the DEFECTIVE text -- a title prefix, or an over-run into the next clause -- stops
 * being a substring of its passage at all, so `verbatim` now fails where it used to pass. That is a
 * view-change window applied to the library, and `check-anchor-verbatim.mjs` is what found it: one
 * distractor quoted `A.5`'s heading and objective while citing `A.4.6`, because `A.4.6`'s held text used to
 * run on into `A.5`. **The citation was wrong before the repair; the repair is what made it visible.** Both
 * populations are selected here, and where a span's text is held cleanly by a DIFFERENT clause that is
 * reported -- re-citing changes what an item CITES rather than how it quotes, which is not this script's
 * subject and not its decision.
 *
 * ============ WHAT IS ASSERTED ON EVERY REPLACEMENT ============
 *
 *   verbatim        a contiguous substring of the passage's current text
 *   clean           `noiseIn` returns nothing, and `titleBleed` against the passage's own title returns null
 *   floor           a key anchor keeps five words, a distractor three -- the existing anchor rules, which
 *                   exist because a key's anchor must be the sentence that supports the key while a
 *                   distractor's may be the three-word phrase it misreads
 *   overlap         the replacement shares at least half the original span's content words, and the
 *                   before/after word counts are PRINTED, because a re-quote that keeps two words of twenty
 *                   is not a re-quote, it is a different anchor and wants a human
 *
 * A replacement failing any of those is not written; the span is reported instead. Silently shortening an
 * anchor until a gate goes quiet is how a gate stops meaning anything.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { noiseIn, titleBleed, gateQuoteNoise } from "./lib/quote-noise.mjs";
import { gateVerbatim } from "./lib/grounded-gates.mjs";

const FLAGS = new Set(["--apply"]);
let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (!FLAGS.has(a)) {
    console.error("Unrecognised flag: " + a + "\n" +
      "DRY BY DEFAULT; --apply rewrites the gated artifacts in place. Note the two conventions in this repo:\n" +
      "some scripts opt into SAFETY with --dry and run LIVE without it. This one is the other family.");
    process.exit(2);
  }
  if (a === "--apply") APPLY = true;
}
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));

/* THE PASSAGE IS LOOKED UP BY (SOURCE, CLAUSE), NEVER BY CLAUSE ALONE. ISO 19011's clause 4.x and 5.x
 * collide with the harmonised management-system 4.x and 5.x -- this repository records four such collisions
 * -- so a clause address is not a key. AIMS-F is grounded in ISO/IEC 42001, which is the default an
 * unqualified reference means, and any other source has to be named. */
const SOURCE = "ISO/IEC 42001";
const byClause = new Map();
for (const p of lib.passages) {
  if (p.source_id !== SOURCE) continue;
  byClause.set(String(p.clause), p);
}

const FILES = ["AIMSF-ROLLOUT-B2.json", "AIMSF-R2-PROBE.json", "AIMSF-R2-REST.json",
  "AIMSF-R3-PROBE.json", "AIMSF-R3-REST.json"];

const KEY_FLOOR = 5, DISTRACTOR_FLOOR = 3;
const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean);
/* content words for the overlap test: letters and digits only, lower case, stopwords dropped, because
 * "the of and to" overlap between any two English spans and would flatter every replacement */
const STOP = new Set(["the", "of", "and", "to", "a", "an", "or", "in", "for", "on", "at", "by", "as", "is",
  "be", "that", "with", "its", "their", "this", "these", "shall", "should"]);
const content = (s) => new Set(words(String(s).toLowerCase().replace(/[^a-z0-9\s]/g, " "))
  .filter((w) => w.length > 2 && !STOP.has(w)));

/* ---------------------------------------------------------------- the cut rules */

/* A CUT ALWAYS LANDS ON A WORD BOUNDARY. Every rule below slices a string, and the first version of two of
 * them sliced mid-word: one produced `other aspects besides A` from `besides AI- specific`, which is not a
 * quotation of anything. So every candidate goes through this, and it is applied to the PASSAGE's own offsets
 * rather than to a rebuilt string, so the result stays a real substring. */
const trimToWords = (text, from, to) => {
  let a = from, b = to;
  while (a > 0 && /\S/.test(text[a - 1]) && /\S/.test(text[a])) a++;      /* started mid-word: move in */
  while (b < text.length && /\S/.test(text[b - 1]) && /\S/.test(text[b])) b--;  /* ended mid-word: move in */
  return text.slice(a, b).replace(/^[^A-Za-z0-9(“"']+/, "").replace(/[\s\-–—,;:]+$/, "").trim();
};

/** de-wrap: rejoin the span's own hyphen wraps, then look for it verbatim in the repaired passage. */
function deWrap(span, text) {
  const fixed = String(span).replace(/([A-Za-z])-\s+([a-z])/g, "$1$2");
  if (fixed === String(span)) return null;
  const at = String(text).indexOf(fixed);
  return at < 0 ? null : { cut: fixed, note: "the span's own hyphen wraps rejoined; found verbatim in the " +
    "repaired passage, so the library repair is what made this possible" };
}

/** drop-leading-term: for a DEFINITION passage, cut to the second of the doubled word.
 *
 * The library holds a definition as TERM followed by DEFINITION, concatenated -- `corrective action` meets
 * `action to eliminate the cause(s) of a nonconformity`, so the word `action` appears twice and the doubling
 * is the JOIN rather than a defect. (I reported that join as a library defect last turn without reading the
 * passage; it is the house convention.) A quote that starts at the term therefore carries the doubling, and
 * the clean quote is the DEFINITION: everything from the second of the pair.
 *
 * THE TITLE CANNOT BE USED FOR THIS, WHICH IS WHY IT IS ITS OWN RULE. Every ISO/IEC 42001 clause-3 title is
 * the term plus the definition's first few words -- `3.17`'s is "corrective action action to", `3.1`'s is
 * "organization person or group" -- so stripping the title takes the front of the definition with it and
 * produced "eliminate the cause(s) of ..." where the right answer is "action to eliminate the cause(s) of ...".
 * That title extraction is a third family, reported and not repaired here. */
function dropLeadingTerm(span, text) {
  const s = String(span);
  /* THE DOUBLING IS ON THE TERM'S LAST WORD, NOT ON THE WHOLE TERM. The first version tried to match the whole
   * leading phrase against itself -- `corrective action` against `corrective action` -- and found nothing,
   * because what repeats is `action action`. `corrective action` + `action to eliminate ...` shares exactly one
   * word at the join. So the test is a single repeated word inside the opening, and the cut is at its SECOND
   * occurrence. Bounded to the first 60 characters: a repetition deeper in a sentence is prose, not a join. */
  const m = /\b([A-Za-z][A-Za-z()'’-]{2,})\s+\1\b/.exec(s.slice(0, 60));
  if (!m) return null;
  const rest = s.slice(m.index + m[1].length + 1).trimStart();
  if (!String(text).includes(rest)) return null;
  return { cut: rest, note: "the span opened at the DEFINED TERM, so the term's last word(s) appeared twice " +
    "where the library joins term to definition; cut to the second occurrence, which is where the definition " +
    "itself begins" };
}

/** strip-prefix: drop a leading passage TITLE, glued or spaced, or a leading DEFINED TERM. */
function stripPrefix(span, text, title) {
  const s = String(span);
  const t = String(title || "").trim();
  const cands = [];
  if (t) {
    /* the title as written, and the title with its last word glued to the next -- `organizaThe` */
    if (s.startsWith(t)) cands.push(t.length);
    const ti = s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const tt = t.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (ti.startsWith(tt.slice(0, Math.min(tt.length, 12)))) {
      /* find where the statement begins: the first position at which the remainder is verbatim in the passage */
      for (let i = 1; i < Math.min(s.length, t.length + 30); i++) {
        const rest = s.slice(i).trimStart();
        if (rest.length > 30 && String(text).includes(rest)) { cands.push(i); break; }
      }
    }
  }
  for (const i of cands) {
    const rest = s.slice(i).trimStart();
    const at = String(text).indexOf(rest);
    if (at >= 0) {
      return { cut: rest, note: "the span opened with its passage's own " +
        (t && rest !== s ? "name" : "prefix") + "; dropped, and the remainder is verbatim in the passage" };
    }
  }
  return null;
}

/** longest common substring between the span and the passage, trimmed to word boundaries. */
function longestCommon(span, text) {
  const a = String(span), b = String(text);
  /* a straightforward DP is 250x250 here -- small, and clarity beats cleverness in an instrument */
  let best = 0, bestB = -1;
  let prev = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] !== b[j - 1]) continue;
      cur[j] = prev[j - 1] + 1;
      if (cur[j] > best) { best = cur[j]; bestB = j; }
    }
    prev = cur;
  }
  if (best < 20 || bestB < 0) return null;
  const cut = trimToWords(b, bestB - best, bestB);
  return cut ? { cut, note: "the longest run of " + best + " characters the span and the passage share, " +
    "trimmed to word boundaries -- this is what undoes an interleave, because the other column's words are " +
    "simply not in the repaired text" } : null;
}

/** word-alignment: the passage region covering the span's words, matched by a WORD-level longest common
 * subsequence rather than greedily.
 *
 * THE GREEDY VERSION WAS WRONG AND IT WAS WRONG IN A WAY THAT LOOKED PLAUSIBLE. Walking the span's words and
 * taking the FIRST later occurrence of each anchored `A.10.3`'s span on the word `suppliers` -- which appears
 * near the END of the statement -- so every following word was unfindable and the walk reported 6 of 34 words
 * matched. It also started `7.2`'s NOTE-2 span at NOTE 1, because "NOTE" matches there first. An alignment has
 * to be chosen globally; taking the first match is a local decision pretending to be one.
 *
 * This is the rule that undoes an INTERLEAVE with the other column's words scattered through the middle:
 * `A.2.3`'s span reads "... other policies can tional policies be affected by ...", so no single contiguous
 * run covers the statement, and only a gap-tolerant alignment recovers the whole of it. */
function wordAlign(span, text) {
  const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
  const toks = [];
  for (const m of String(text).matchAll(/\S+/g)) {
    toks.push({ w: norm(m[0]), at: m.index, end: m.index + m[0].length });
  }
  const want = words(span).map(norm).filter(Boolean);
  if (!want.length || !toks.length) return null;
  /* LCS over words, O(n*m) with n,m under 100 here */
  const n = want.length, m = toks.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = want[i - 1] === toks[j - 1].w ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  if (dp[n][m] < 4) return null;
  /* walk back to find which passage tokens matched */
  let i = n, j = m; const hit = [];
  while (i > 0 && j > 0) {
    if (want[i - 1] === toks[j - 1].w) { hit.push(j - 1); i--; j--; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
  }
  hit.reverse();
  if (!hit.length) return null;
  /* EXTEND LEFT TO THE SENTENCE START WHEN THE MATCH BEGINS ALMOST AT IT. `A.2.3`'s span opens with the glued
   * `organizaThe`, which matches no passage token, so the alignment's first hit was `organization` and the
   * re-quote began mid-sentence: "organization shall determine where ...". A quotation that starts one word
   * into its own sentence reads as a transcription error even though it is verbatim. Eight characters, which is
   * `The ` plus slack, and stated because a bound with no stated reach is a guess. */
  let from = toks[hit[0]].at;
  if (from > 0 && from <= 8) from = 0;
  const cut = trimToWords(String(text), from, toks[hit[hit.length - 1]].end);
  return cut ? { cut, note: hit.length + " of " + want.length + " span words aligned to the passage by a " +
    "word-level longest common subsequence; the region between the first and last is the re-quote" } : null;
}

/** truncate at the noise, keeping the longer clean side, on a WORD boundary. */
function truncateAtNoise(cand, text) {
  const hits = noiseIn(cand.cut);
  if (!hits.length) return null;
  const at = Math.min(...hits.map((h) => h.at));
  const s = String(cand.cut);
  const left = s.slice(0, at).replace(/\s*\S*$/, (m) => (/^\s/.test(m) ? "" : m)).replace(/[\s\-–—,;:]+$/, "").trim();
  const right = s.slice(at).replace(/^\S*\s*/, "").trim();
  const pick = words(left).length >= words(right).length ? left : right;
  if (!pick || !String(text).includes(pick)) return null;
  return { cut: pick, note: "the PASSAGE ITSELF still carries this noise -- an unrepaired hyphen wrap -- so " +
    "no span containing that point can be clean; cut at it, longer clean side kept" };
}

/* ---------------------------------------------------------------- run */

const report = [];
const edits = [];   /* {file, itemIdx, field, from, to, rule} */

for (const f of FILES) {
  const p = join(ROOT, f);
  if (!existsSync(p)) continue;
  const art = JSON.parse(readFileSync(p, "utf8"));
  (art.items || []).forEach((r, itemIdx) => {
    if (r.verdict !== "survivor") return;
    const clause = String(r.item.key_support_clause || "");
    const pas = byClause.get(clause);
    const titleOf = (c) => { const q = byClause.get(String(c)); return q ? String(q.title || "") : null; };
    /* ============ TWO POPULATIONS, BECAUSE REPAIRING A PASSAGE CAN INVALIDATE AN ANCHOR ============
     *
     * `quote-noise` firing is one way an anchor is defective. The other appeared the moment 37 passages were
     * repaired: an anchor that quoted the DEFECTIVE text -- a title prefix, or an over-run into the next clause
     * -- is no longer a substring of the passage at all, so `verbatim` fails where it used to pass. That is a
     * view-change window applied to the library, and the anchor-verbatim check is what found it.
     *
     * Both are anchor defects re-cuttable from the passage, so both are selected here. Neither is a reason to
     * skip the other: an item can be clean of noise and non-verbatim, or the reverse. */
    const v = gateQuoteNoise(r.item, titleOf);
    const vb = gateVerbatim(r.item, byClause);
    if (v.pass !== false && vb.pass !== false) return;

    const id = String(r.item_id || "").slice(0, 8);
    const rec = { file: f, id, task: r.task_code, clause, spans: [], verdict: null };
    report.push(rec);
    if (!pas) {
      rec.verdict = "CANNOT BE CHECKED -- the library does not hold " + SOURCE + " " + clause;
      return;
    }

    /* every span on the item, each with the passage its own clause names */
    const targets = [{ field: "key_support", text: r.item.key_support, clause, floor: KEY_FLOOR }];
    (r.item.distractor_support || []).forEach((d, i) => targets.push({
      field: "distractor_support[" + i + "].support", text: d && d.support,
      clause: String((d && d.clause) || clause), floor: DISTRACTOR_FLOOR, dIdx: i,
    }));

    let anyFail = false;
    for (const t of targets) {
      if (!t.text) continue;
      const tp = byClause.get(t.clause);
      if (!tp) continue;
      const title = String(tp.title || "");
      const dirty = noiseIn(t.text).length > 0 || !!titleBleed(t.text, title) ||
        !String(tp.text).includes(String(t.text));
      if (!dirty) continue;

      /* FOUR RULES, TRIED IN ORDER OF HOW MUCH OF THE ORIGINAL ANCHOR THEY KEEP. The de-wrap keeps all of
       * it; the prefix strip keeps the statement; the longest-common run keeps the largest shared piece; the
       * truncation keeps a side. Each rule's output is also fed to the truncation, because a candidate can be
       * clean of the SPAN's noise and still sit on top of noise the PASSAGE carries. */
      const attempts = [];
      const push = (rule, r) => { if (r) attempts.push({ rule, ...r }); };
      push("de-wrap", deWrap(t.text, tp.text));
      push("drop-leading-term", dropLeadingTerm(t.text, tp.text));
      push("strip-prefix", stripPrefix(t.text, tp.text, title));
      push("longest-common-run", longestCommon(t.text, tp.text));
      push("word-alignment", wordAlign(t.text, tp.text));
      for (const a of [...attempts]) push(a.rule + " then truncate", truncateAtNoise(a, tp.text));
      push("truncate", truncateAtNoise({ cut: t.text }, tp.text));

      let chosen = null, why = [];
      for (const a of attempts) {
        const fails = [];
        if (!String(tp.text).includes(a.cut)) fails.push("not a verbatim substring of the passage");
        if (noiseIn(a.cut).length) fails.push("still carries noise: " +
          noiseIn(a.cut).map((h) => h.name).join(", "));
        if (titleBleed(a.cut, title)) fails.push("still opens with the passage title");
        if (words(a.cut).length < t.floor) fails.push("under the anchor floor of " + t.floor + " words (" +
          words(a.cut).length + ")");
        const co = content(t.text), cn = content(a.cut);
        const keptN = [...cn].filter((w) => co.has(w)).length;
        const share = co.size ? keptN / co.size : 0;
        if (share < 0.5) fails.push("keeps only " + Math.round(share * 100) +
          "% of the original content words, so it is a different anchor rather than a re-quote");
        if (!fails.length) { chosen = { ...a, share, before: words(t.text).length, after: words(a.cut).length }; break; }
        why.push(a.rule + ": " + fails.join("; "));
      }
      /* ============ IS THE CITED CLAUSE A CONTAINER, WITH A CHILD THAT HOLDS THIS STATEMENT CLEANLY? ============
       *
       * `65a6b529`'s distractor cites `A.6.2`, which is a sub-table CONTAINER whose text is the whole
       * interleaved table; the statement it quotes belongs to `A.6.2.3`, where it is clean and complete. So a
       * truncated quote of the container is the best this script can do, and it is NOT the best available
       * answer -- re-citing the child is. That is a change to what the item CITES rather than to how it
       * quotes, so it is reported for a decision and never made here. */
      let better = null, betterWhy = "", betterLen = 0;
      const deNoised = String(t.text).replace(/([A-Za-z])-\s+([a-z])/g, "$1$2")
        .replace(/\b([A-Za-z][A-Za-z()'’-]{2,})\s+\1\b/g, "$1");
      /* THE SEARCH IS BY LONGEST SHARED RUN, NOT BY A FIXED PREFIX. A fixed 60-character prefix found the
       * container case and missed the over-run case, because `A.5`'s own text begins at "Objective:" while the
       * over-run span begins with `A.5`'s HEADING -- so the prefix that identified the span was exactly the part
       * `A.5` does not contain. A prefix is a guess about where the useful part of a span is. */
      for (const [c2, p2] of byClause) {
        if (c2 === t.clause) continue;
        if (noiseIn(p2.text).length) continue;
        const lc = longestCommon(deNoised, p2.text);
        if (!lc || lc.cut.length <= Math.max(40, betterLen)) continue;
        betterLen = lc.cut.length;
        better = c2;
      }
      if (better) {
        betterWhy = better.startsWith(t.clause + ".")
          ? "a CHILD of the cited clause, which is a container whose text is the whole sub-table (" +
            betterLen + " shared characters)"
          : "a DIFFERENT clause entirely (" + betterLen + " shared characters): the span was quoted from an " +
            "OVER-RUN, where the cited passage used to run on past its own end into this one. The citation was " +
            "already wrong before the library was repaired; the repair is what made it visible";
      }
      rec.spans.push({ field: t.field, clause: t.clause, from: t.text, chosen, why, better, betterWhy });
      if (!chosen) anyFail = true;
      else edits.push({ file: f, itemIdx, dIdx: t.dIdx, field: t.field, from: t.text, to: chosen.cut,
        rule: chosen.rule });
    }
    rec.verdict = anyFail ? "REJECT -- no clean span of its own passage supports this anchor"
      : rec.spans.length ? "RE-QUOTED" : "no dirty span found (the gate fired on something else)";
  });
}

/* ---------------------------------------------------------------- report */
console.log("RE-QUOTING DEFECTIVE ANCHORS -- " + report.length +
  " item(s) where quote-noise fires or verbatim fails");
console.log("");
for (const r of report) {
  console.log("  " + r.id + "  task " + String(r.task).padEnd(5) + " clause " + String(r.clause).padEnd(9) +
    r.verdict);
  for (const s of r.spans) {
    console.log("      " + s.field + "   (" + s.clause + ")");
    console.log("        FROM " + JSON.stringify(s.from.replace(/\s+/g, " ")));
    if (s.chosen) {
      console.log("        TO   " + JSON.stringify(s.chosen.cut.replace(/\s+/g, " ")));
      console.log("        rule " + s.chosen.rule + "   " + s.chosen.before + " words -> " +
        s.chosen.after + ", keeping " + Math.round(s.chosen.share * 100) + "% of the content words");
      console.log("             " + s.chosen.note);
    } else {
      for (const w of s.why) console.log("        no: " + w);
    }
    /* THE BETTER-HOME NOTE PRINTS ON A REJECTION TOO, AND THAT IS WHERE IT MATTERS MOST. It was first inside
     * the `chosen` branch, so the one span with no clean re-quote -- the one whose only useful information is
     * WHERE its text actually lives -- printed nothing about it. A note that appears only when the news is good
     * is decoration. */
    if (s.better) {
      console.log("        NOTE this span is held cleanly and in full by " + s.better + " -- " + s.betterWhy);
      console.log("             Re-citing is a change to what the item CITES rather than to how it quotes, so");
      console.log("             it is reported for a decision and not done here.");
    }
  }
  console.log("");
}
const requoted = report.filter((r) => r.verdict === "RE-QUOTED");
const rejected = report.filter((r) => String(r.verdict).startsWith("REJECT"));
console.log("  RE-QUOTED  " + requoted.length + (requoted.length ? "   " +
  requoted.map((r) => r.id).join(", ") : ""));
console.log("  REJECT     " + rejected.length + (rejected.length ? "   " +
  rejected.map((r) => r.id).join(", ") : ""));
console.log("  span edits " + edits.length);

if (!APPLY) {
  console.log("");
  console.log("DRY RUN -- nothing written. Re-run with --apply to rewrite the artifacts in place,");
  console.log("then re-run check-quote-noise-grounded.mjs. A dry run reporting ok has changed nothing.");
  process.exit();
}

/* ---------------------------------------------------------------- write */
const byFile = new Map();
for (const e of edits) {
  if (!byFile.has(e.file)) byFile.set(e.file, []);
  byFile.get(e.file).push(e);
}
for (const [f, list] of byFile) {
  const p = join(ROOT, f);
  const art = JSON.parse(readFileSync(p, "utf8"));
  let applied = 0;
  for (const e of list) {
    const it = art.items[e.itemIdx].item;
    /* ASSERT THE BEFORE-STATE. An edit applied to text nobody read is the defect this repository records
     * against every literal post-condition: the artifact may have moved since the dry run. */
    if (e.dIdx == null) {
      if (it.key_support !== e.from) {
        console.error("REFUSING " + f + " item " + e.itemIdx + ": key_support is not what the dry run read.");
        process.exit(1);
      }
      it.key_support = e.to;
    } else {
      const d = (it.distractor_support || [])[e.dIdx];
      if (!d || d.support !== e.from) {
        console.error("REFUSING " + f + " item " + e.itemIdx + ": distractor_support[" + e.dIdx +
          "] is not what the dry run read.");
        process.exit(1);
      }
      d.support = e.to;
    }
    applied++;
  }
  /* the artifact records that its anchors were re-cut, so a later reader is not told the generator wrote them */
  art.requoted = (art.requoted || []).concat(list.map((e) => ({
    item_id: art.items[e.itemIdx].item_id, field: e.field, rule: e.rule,
    ruled: "PROMPT-95 follow-up 2: re-cut from a clean span of the same passage; the span was never rewritten",
  })));
  writeFileSync(p, JSON.stringify(art, null, 2) + "\n", "utf8");
  console.log("  " + f + "   " + applied + " span(s) re-cut");
}
console.log("");
console.log("NOW re-run check-quote-noise-grounded.mjs. The rejections are NOT applied here -- rejecting an");
console.log("item is a verdict on the item, and it belongs with the other rejections rather than in a");
console.log("script whose subject is anchors.");
