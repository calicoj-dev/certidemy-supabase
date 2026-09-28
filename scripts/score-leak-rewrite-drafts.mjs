#!/usr/bin/env node
/**
 * score-leak-rewrite-drafts.mjs - score a rewrite BEFORE it is read, and again as it would be stored.
 *
 * READ-ONLY. No database, no network, no `--apply`. Unknown flags exit 2.
 *
 *   --drafts=LEAK-REWRITE-DRAFTS.json   default
 *   --out=LEAK-REWRITES-DRAFT.md        the document for the read
 *
 * ============ WHY A DRAFT IS SCORED AND NOT JUST WRITTEN ============
 *
 * A rewrite written to remove a reproduction can introduce one. This repository has paid for that
 * twice in one batch: a redraft that restored four determinations of clause 9.1 in the clause's own
 * order came back at 22 contiguous words, and a redraft defended on the ground that `determine` is a
 * reserved term brought eleven of ISO's words with it.
 *
 * So the draft score is a FILTER and it costs nothing. An expensive human read should not be spent on
 * text the cheap gate would reject -- and the same scorer the production gate uses is the only thing
 * whose verdict means anything here, so `lib/leak-score.mjs` is imported rather than approximated.
 *
 * ============ AND IT SCORES THE CURRENT TEXT TOO ============
 *
 * A before-and-after is the only form in which a score means anything: "the draft scores 4" is not a
 * result until the thing it replaces is scored by the same instrument in the same run. The delta is
 * the finding.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as leak from "./lib/leak-score.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let DRAFTS = "LEAK-REWRITE-DRAFTS.json", OUT = "LEAK-REWRITES-DRAFT.md";
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--drafts=(.+)$/.exec(a))) { DRAFTS = m[1]; continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  console.error("unknown flag " + JSON.stringify(a) + ". Known: --drafts=, --out=");
  console.error("READ-ONLY: there is no --apply. This scores text; it does not store any.");
  process.exitCode = 2; process.exit();
}

const spec = JSON.parse(readFileSync(join(ROOT, DRAFTS), "utf8"));
if (!Array.isArray(spec.drafts) || !spec.drafts.length) {
  console.error(DRAFTS + " carries no drafts -- refusing to write a document about nothing");
  process.exitCode = 3; process.exit();
}

/* The index, and its own control. `buildSources` asserts every document's extracted word count
 * against the manifest, and the canary must measure its full length -- a scorer that cannot find text
 * it is given says nothing about text it is not. */
const sources = leak.buildSources();
try {
  leak.assertCanary(sources);
} catch (e) {
  console.error("THE SCORER'S CANARY FAILED: " + String(e.message).slice(0, 200));
  console.error("A scorer that cannot find a sentence it is holding cannot clear a draft. Refusing.");
  process.exitCode = 3; process.exit();
}
/* `buildSources` returns a MAP, so `Object.keys(...).length` is 0 forever -- it printed
 * "index: 0 document(s), canary asserted" beside ten real fires, which is a count that can only ever
 * be zero sitting next to evidence that it is wrong. A reported number that cannot vary is not a
 * measurement, and this one would have read as an empty index to anyone who trusted it. */
const nDocs = sources instanceof Map ? sources.size : Object.keys(sources).length;
if (!nDocs) {
  console.error("the leak index is EMPTY -- every draft would score 0 and 'cleared' would mean nothing");
  process.exitCode = 3; process.exit();
}
console.log("index: " + nDocs + " document(s), canary asserted");

/* ============ THE FIELD NAMES ARE THE SCORER'S, READ OUT OF IT ============
 *
 * My first version reported `s.unionSource` and `s.unionMatched`. Neither exists: the scorer returns
 * `source` and carries the matched text inside the `merged` runs. So the document's SOURCE and MATCHED
 * SPAN columns printed "-" on all 22 rows -- the same defect as the zero document count, one column
 * over, and an empty column reads as "no source" rather than as "the reporter asked for the wrong
 * field". A run with no source is this repository's tell for a manufactured adjacency, so the empty
 * column was not merely blank: it looked like a finding. */
const longestRun = (s) => {
  const pool = (s.merged && s.merged.length ? s.merged : s.runs) || [];
  return pool.reduce((best, r) => (!best || r.len > best.len ? r : best), null);
};
const verdict = (text) => {
  const s = leak.score(text, sources);
  const r = longestRun(s);
  const words = leak.W(text);
  return {
    run: s.unionRun, cov: Number(s.unionCov.toFixed(3)), words: s.words,
    src: s.source || null,
    matched: r ? words.slice(r.start, r.start + r.len).join(" ") : null,
    fires: leak.firesUnion(s),
    arithmetic: leak.isArithmetic(s),
  };
};

const rows = [];
for (const d of spec.drafts) {
  const before = verdict(d.current);
  const after = verdict(d.draft);
  rows.push({ ...d, before, after });
}

const worse = rows.filter((r) => r.after.fires && !r.before.fires);
const stillFiring = rows.filter((r) => r.after.fires);
const cleared = rows.filter((r) => r.before.fires && !r.after.fires);

/* ---------------------------------------------------------------- the document */
const md = [];
const p = (s = "") => md.push(s);
p("# Leak rewrites: drafts, scored, nothing written");
p("");
p("**DRAFTS. Nothing in this document has been written to any table.** " + rows.length + " live concept");
p("descriptions that fire the leak gate against the widened nine-source index, each with a proposed");
p("replacement and both texts scored by `lib/leak-score.mjs` -- the same scorer the production gate");
p("uses, in one run, so the before and the after are the same instrument.");
p("");
p("Regenerate: `node scripts/score-leak-rewrite-drafts.mjs` (read-only, no database).");
p("");
p("| | |");
p("|---|---|");
p("| drafts scored | " + rows.length + " |");
p("| firing before | " + rows.filter((r) => r.before.fires).length + " |");
p("| firing after | " + stillFiring.length + " |");
p("| cleared by the draft | " + cleared.length + " |");
p("| **made WORSE by the draft** | **" + worse.length + "** |");
p("");
if (worse.length) {
  p("**" + worse.length + " draft(s) reproduce something the current text does not.** That is the");
  p("failure this scoring pass exists to catch, and those drafts are not proposals until they are");
  p("rewritten: " + worse.map((r) => r.cert + "/" + r.slug).join(", ") + ".");
  p("");
}
p("**A score of 0 means no reproduction of the INDEXED documents**, never no reproduction. The index");
p("is English-only, so a translated sibling of any of these is outside every leak instrument here.");
p("");
p("**And two of these are not really leak findings.** `management-practice` and");
p("`governance-definition` are ITIL's definitions word for word at coverage 1.00 -- a licensing");
p("question about served text, not a drafting one. The rest are mostly four to six word descriptions");
p("that restate their own names, where the high coverage is a symptom of terseness: they would fail");
p("the anti-gloss rule at a leak score of zero, and the rewrite is owed on that ground whatever the");
p("scorer says.");
p("");

for (const r of rows) {
  p("---");
  p("");
  p("## " + r.cert + " / `" + r.slug + "`");
  p("");
  p("**Why it fires:** " + r.why);
  p("");
  p("| | run | coverage | words | source | matched span |");
  p("|---|---|---|---|---|---|");
  p("| current | " + r.before.run + " | " + r.before.cov + " | " + r.before.words + " | " +
    (r.before.src || "-") + " | " + (r.before.matched ? "`" + r.before.matched + "`" : "-") + " |");
  p("| **draft** | " + r.after.run + " | " + r.after.cov + " | " + r.after.words + " | " +
    (r.after.src || "-") + " | " + (r.after.matched ? "`" + r.after.matched + "`" : "-") + " |");
  p("");
  p("verdict: current **" + (r.before.fires ? "FIRES" : "clean") + "**, draft **" +
    (r.after.fires ? "FIRES" : "clean") + "**" +
    (r.after.arithmetic ? "  *(draft is short enough that the run is arithmetic rather than a reproduction)*" : ""));
  p("");
  p("**current**");
  p("");
  p("> " + String(r.current).trim());
  p("");
  p("**draft**");
  p("");
  p("> " + String(r.draft).trim());
  p("");
}

writeFileSync(join(ROOT, OUT), md.join("\n") + "\n", "utf8");
console.log("SCORED " + rows.length + " draft(s)");
console.log("  firing before " + rows.filter((r) => r.before.fires).length +
  "   firing after " + stillFiring.length + "   cleared " + cleared.length);
if (worse.length) {
  console.log("  WORSE: " + worse.map((r) => r.cert + "/" + r.slug).join(", "));
  console.log("  A draft that reproduces what the current text does not is not a proposal.");
  process.exitCode = 1;
}
console.log("  wrote " + OUT);
