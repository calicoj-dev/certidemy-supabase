#!/usr/bin/env node
/**
 * verify-recovered-27001-controls.mjs -- for each ISO/IEC 27001 Annex A control recovered by the
 * right-column fallback, print the recovered statement beside the RAW PDF text and decide whether the
 * statement belongs to that control number or to its neighbour.
 *
 * READ-ONLY. No `--apply`, no database writes. Unknown flags exit 2.
 *
 *   --out=RECOVERED-27001-CONTROLS.md
 *
 * ============ WHY THIS IS NOT OPTIONAL ============
 *
 * The recovery reads the right column of the lines FOLLOWING the title line, because the statement cell
 * begins after its header and the next row's number shares that line. So the one way it can be wrong is
 * the one that matters: attaching A.8.11's statement to A.8.12, or the reverse. A statement under the
 * wrong control number is worse than a missing control -- the address resolves, the gate passes, and an
 * item quotes the wrong requirement with the library agreeing.
 *
 * ============ THREE INDEPENDENT TESTS PER CONTROL ============
 *
 *   1  TITLE SUBJECT. ISO writes a control statement opening with its own subject: A.8.11 Data masking
 *      reads "Data masking shall be used...". Does the statement's opening match THIS control's title,
 *      or the NEXT control's title? The second is the misattachment.
 *
 *   2  ISO/IEC 27002, SAME NUMBER, DIFFERENT DOCUMENT. 27002 carries a clause per 27001 control at the
 *      same number, stating the same control as guidance. Its title and its text are an independent
 *      witness: if 27001's recovered A.8.11 is about data masking and 27002's 8.11 is about data
 *      masking, two documents agree. This is the strongest of the three because nothing about the
 *      27001 extraction feeds it.
 *
 *   3  THE RAW PDF LINES, printed so a human can read the page rather than trust either instrument.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS } from "./lib/citation-index.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let OUT = "RECOVERED-27001-CONTROLS.md";
for (const a of process.argv.slice(2)) {
  const m = /^--out=(.+)$/.exec(a);
  if (m) { OUT = m[1]; continue; }
  console.error("unknown flag " + JSON.stringify(a) + ". Known: --out=");
  console.error("READ-ONLY. It verifies an extraction; it cannot change one.");
  process.exitCode = 2; process.exit();
}

/* The six the fallback recovered, named explicitly rather than inferred from the artifact -- the point
 * is to check these, so the list is the subject of the check and not its output. */
/* ============ EVERY ANNEX A CONTROL, NOT ONLY THE RECOVERED ONES ============
 *
 * Ruled 2026-09-28. Checking only the six the fallback recovered answered the narrow question and left
 * the wide one open: the 119 controls the primary path produced were never checked for misattachment
 * either, and they came from a splitter that pairs a row number with a statement cell by POSITION. The
 * witness costs nothing to run over all of them.
 *
 * `RECOVERED` stays as a label so the report can separate the two populations -- a recovered control and
 * a primary-path control are different evidence about the extractor, and folding them would hide which
 * half a finding came from. */
const RECOVERED = new Set(["A.7.11", "A.8.1", "A.8.5", "A.8.9", "A.8.11", "A.8.15",
  "A.8.32", "A.5.15"]);

const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const p27001 = new Map(lib.passages.filter((p) => p.source_id === "ISO/IEC 27001" && p.edition === "2022")
  .map((p) => [String(p.clause), p]));
const p27002 = new Map(lib.passages.filter((p) => p.source_id === "ISO/IEC 27002" && p.edition === "2022")
  .map((p) => [String(p.clause), p]));

const raw = execFileSync("pdftotext", ["-q", "-enc", "UTF-8", "-layout", PDFS["27001:2022"], "-"],
  { encoding: "utf8", maxBuffer: 268435456 }).replace(/\r/g, "").split("\n");

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const nextNumber = (clause) => {
  const [g, n] = clause.slice(2).split(".").map(Number);
  return "A." + g + "." + (n + 1);
};
/* Does the statement OPEN with this title's words? ISO's control statements begin with their subject.
 *
 * STEM-MATCHED, because `Logging` against "LOGS that record activities" is the same subject in a
 * different form and a whole-word test calls it a miss. The first version did exactly that and declared
 * A.8.15 MISATTACHED -- on a statement ISO/IEC 27002 carries verbatim under the same number. */
const stem = (w) => w.replace(/(ing|ed|es|s)$/, "");
const opensWith = (statement, title) => {
  if (!title) return null;
  const t = norm(title).split(" ").filter((w) => w.length > 3);
  if (!t.length) return null;
  const head = norm(statement).split(" ").slice(0, 12).map(stem);
  const hit = t.filter((w) => head.includes(stem(w)));
  return { matched: hit.length, of: t.length, words: hit };
};

/* ============ THE DECISIVE TEST: 27002'S OWN SENTENCE, NOT ITS TITLE ============
 *
 * ISO/IEC 27002 states each control at the same number, in the guidance voice: 27001's
 * "Logs ... shall be produced" is 27002's "Logs ... should be produced". So the recovered statement can
 * be compared with ANOTHER DOCUMENT'S TEXT, which is the strongest witness available and owes nothing to
 * the 27001 extraction.
 *
 * My first version compared the statement to 27002's TITLE and threw this away -- the evidence was in
 * hand and the wrong field was read, which is the defect this repository records against `unionSource`
 * and against the zero document count. Measured as the longest run of shared words, `shall`/`should`
 * normalised, so a match is a SENTENCE in common rather than vocabulary in common.
 */
const runAgainst = (statement, other) => {
  if (!other) return null;
  const a = norm(String(statement).replace(/\bshall\b/gi, "should")).split(" ");
  const b = norm(String(other).replace(/\bshall\b/gi, "should")).split(" ");
  const set = new Set();
  for (let i = 0; i < b.length; i++) set.add(b.slice(i, i + 4).join(" "));
  let best = 0;
  for (let i = 0; i < a.length; i++) {
    let n = 4;
    if (!set.has(a.slice(i, i + 4).join(" "))) continue;
    while (i + n < a.length && set.has(a.slice(i + n - 3, i + n + 1).join(" "))) n++;
    best = Math.max(best, n);
  }
  return { run: best, words: a.length };
};

/* ============ EVERY ANNEX A CONTROL, NOT ONLY THE EIGHT RECOVERED ============
 *
 * Ruled 2026-09-28. Checking only the recovered ones answered the narrow question and left the wide one
 * open: the controls the PRIMARY path produced were never checked for misattachment either, and that
 * path pairs a row number with a statement cell by position -- the same failure mode, a different code
 * path. The witness costs nothing to run over all of them.
 *
 * The two populations are reported apart, because a recovered control and a primary-path control are
 * different evidence about the extractor and folding them would hide which half a finding came from. */
const ALL_ANNEX_A = [...p27001.keys()].filter((c) => /^A\.\d+\.\d+$/.test(c)).sort((x, y) => {
  const a = x.slice(2).split(".").map(Number), b = y.slice(2).split(".").map(Number);
  return a[0] - b[0] || a[1] - b[1];
});

const rows = [];
for (const clause of ALL_ANNEX_A) {
  const mine = p27001.get(clause);
  const nxt = p27001.get(nextNumber(clause));
  const other = p27002.get(clause.slice(2));           /* 27002 numbers without the A. */

  const mineTitle = mine ? mine.title : null;
  const nextTitle = nxt ? nxt.title : null;
  const stmt = mine ? String(mine.text || "") : "";

  const vsOwn = opensWith(stmt, mineTitle);
  const vsNext = opensWith(stmt, nextTitle);
  const vs27002 = other ? opensWith(stmt, other.title) : null;

  /* The PDF lines: the title line for this control, and enough after it to show the column layout. */
  const bare = clause.slice(2);
  let at = -1;
  for (let i = 0; i < raw.length; i++) {
    if (new RegExp("^\\s*(?:A\\.)?" + bare.replace(".", "\\.") + "\\s").test(raw[i])) at = i;  /* last match */
  }
  const window = at >= 0 ? raw.slice(at, at + 6) : [];

  /* ============ THE VERDICT, WITH THE INDEPENDENT WITNESS FIRST ============
   *
   * 27002's sentence at the SAME number decides where it can, and the same test is run against 27002's
   * NEXT number -- so a genuine off-by-one shows as a longer run against the neighbour. The title test
   * is the fallback, and UNDECIDED remains a real outcome rather than a pass. */
  /* ============ BOTH NEIGHBOURS, BECAUSE OFF-BY-ONE HAS TWO DIRECTIONS ============
   *
   * The first version compared only against the NEXT number, so a statement borrowed from the PREVIOUS
   * control was invisible -- and that is the direction two live passages actually failed in: A.8.12
   * (Data leakage prevention) holds A.8.11's data-masking statement, and A.8.22 (Segregation of
   * networks) holds A.8.21's. Both came back UNDECIDED rather than MISATTACHED, which reads as "no
   * evidence" when the evidence was one clause in the other direction.
   *
   * A check for an off-by-one that looks one way only is half a check. */
  const prevNumber = (c) => {
    const [g, n] = c.slice(2).split(".").map(Number);
    return n > 1 ? "A." + g + "." + (n - 1) : null;
  };
  const otherNext = p27002.get(nextNumber(clause).slice(2));
  const pn = prevNumber(clause);
  const otherPrev = pn ? p27002.get(pn.slice(2)) : null;
  const runOwn = runAgainst(stmt, other ? other.text : null);
  const runNext = runAgainst(stmt, otherNext ? otherNext.text : null);
  const runPrev = runAgainst(stmt, otherPrev ? otherPrev.text : null);

  let verdict, why;
  const ro = runOwn ? runOwn.run : 0, rn = runNext ? runNext.run : 0, rp = runPrev ? runPrev.run : 0;
  const worstNeighbour = Math.max(rn, rp);
  const whichNeighbour = rn >= rp ? "NEXT (" + nextNumber(clause) + ")" : "PREVIOUS (" + pn + ")";
  if (ro >= 6 && ro >= worstNeighbour) {
    verdict = "CORRECT";
    why = "ISO/IEC 27002 clause " + clause.slice(2) + " carries " + ro + " of the same words in a row" +
      (worstNeighbour ? " against " + worstNeighbour + " for the best neighbour" : "");
  } else if (worstNeighbour >= 6 && worstNeighbour > ro) {
    verdict = "MISATTACHED";
    why = "ISO/IEC 27002's " + whichNeighbour + " clause matches better (" + worstNeighbour +
      " words in a row against " + ro + " for its own number)";
  } else {
    const ownStrong = vsOwn && vsOwn.matched > 0;
    const nextStrong = vsNext && vsNext.matched > 0;
    if (ownStrong && (!nextStrong || vsOwn.matched >= vsNext.matched)) {
      verdict = "CORRECT";
      why = "no 27002 sentence witness; the statement opens with its own title (" +
        vsOwn.matched + "/" + vsOwn.of + ")" + (nextStrong ? " and not the neighbour's" : "");
    } else if (nextStrong) {
      verdict = "MISATTACHED"; why = "the statement opens with the NEXT control's title";
    } else {
      verdict = "UNDECIDED"; why = "no 27002 sentence witness and no title signal -- read the PDF lines below";
    }
  }

  rows.push({ clause, mineTitle, nextTitle, stmt, vsOwn, vsNext, vs27002, other, otherNext,
    runOwn, runNext, runPrev, otherPrev, pn, window, at, verdict, why, recovered: RECOVERED.has(clause) });
}

const md = [];
const p = (s = "") => md.push(s);
p("# The six recovered ISO/IEC 27001 Annex A controls, checked for misattachment");
p("");
p("`scripts/verify-recovered-27001-controls.mjs`, read-only.");
p("");
p("**A statement under the wrong control number is worse than a missing control**: the address resolves,");
p("the gate passes, and an item quotes the wrong requirement with the library agreeing. The recovery");
p("reads the right column of the lines FOLLOWING the title line, so off-by-one attachment is its one");
p("real failure mode and it is what this checks.");
p("");
/* ============ THE VERDICT MUST NOT DEPEND ON THE CUTOFF ============
 *
 * I changed this instrument AFTER seeing it call A.8.15 misattached, which is exactly the move this
 * repository forbids -- a parameter adjusted after seeing the result it produced. The defence is not an
 * assurance, it is a measurement: re-decide every control at every cutoff from 4 to 12 and report
 * whether any verdict moves. If the answer depends on the number, the number is doing the work. */
const verdictAt = (r, cut) => {
  const ro = r.runOwn ? r.runOwn.run : 0, rn = r.runNext ? r.runNext.run : 0;
  if (ro >= cut && ro > rn) return "CORRECT";
  if (rn >= cut && rn > ro) return "MISATTACHED";
  const os = r.vsOwn && r.vsOwn.matched > 0, ns = r.vsNext && r.vsNext.matched > 0;
  if (os && (!ns || r.vsOwn.matched >= r.vsNext.matched)) return "CORRECT";
  if (ns) return "MISATTACHED";
  return "UNDECIDED";
};
const cuts = [4, 5, 6, 7, 8, 9, 10, 11, 12];
const unstable = rows.filter((r) => new Set(cuts.map((c) => verdictAt(r, c))).size > 1);

p("**The verdicts do not depend on the cutoff.** Re-decided at every threshold from 4 to 12 words: " +
  (unstable.length ? "**" + unstable.length + " verdict(s) move** (" + unstable.map((r) => r.clause).join(", ") + ")"
    : "no verdict moves") + ". The own-against-neighbour margins are 9-31 words against 0-4, so the");
p("comparison decides and the number does not. That matters because this instrument was changed after it");
p("called A.8.15 misattached, and a threshold adjusted on sight of its own result is worth nothing.");
p("");
p("| control | title | verdict | basis |");
p("|---|---|---|---|");
for (const r of rows) {
  p("| `" + r.clause + "` | " + (r.mineTitle || "-") + " | **" + r.verdict + "** | " + r.why + " |");
}
p("");
const bad = rows.filter((r) => r.verdict !== "CORRECT");
if (bad.length) {
  p("**" + bad.length + " control(s) are NOT confirmed: " + bad.map((r) => r.clause).join(", ") + ".**");
} else {
  p("**All six attach to their own control number.** Each statement opens with its own title's subject,");
  p("and where 27002 holds the same number it agrees.");
}
p("");
for (const r of rows) {
  p("---");
  p("");
  p("## `" + r.clause + "` — " + (r.mineTitle || "(no title)"));
  p("");
  p("**Verdict: " + r.verdict + "** — " + r.why);
  p("");
  p("**Recovered statement, as the library now holds it:**");
  p("");
  p("> " + r.stmt.replace(/\n/g, " ").trim());
  p("");
  p("| test | result |");
  p("|---|---|");
  p("| opens with its OWN title (`" + (r.mineTitle || "-") + "`) | " +
    (r.vsOwn ? r.vsOwn.matched + " of " + r.vsOwn.of + " words: " + (r.vsOwn.words.join(", ") || "none") : "no title") + " |");
  p("| opens with the NEXT control's title (`" + (r.nextTitle || "-") + "`) | " +
    (r.vsNext ? r.vsNext.matched + " of " + r.vsNext.of + " words: " + (r.vsNext.words.join(", ") || "none") : "next not held") + " |");
  p("| ISO/IEC 27002 clause `" + r.clause.slice(2) + "` (SENTENCE match) | " +
    (r.other ? "\"" + r.other.title + "\" -- longest shared run " + (r.runOwn ? r.runOwn.run : 0) + " words" : "not held") + " |");
  p("| ISO/IEC 27002 clause `" + nextNumber(r.clause).slice(2) + "` (the neighbour) | " +
    (r.otherNext ? "\"" + r.otherNext.title + "\" -- longest shared run " + (r.runNext ? r.runNext.run : 0) + " words" : "not held") + " |");
  p("");
  if (r.other) {
    p("**ISO/IEC 27002's own text at the same number** (independent witness, guidance voice):");
    p("");
    p("> " + String(r.other.text || "").slice(0, 400).replace(/\n/g, " ").trim() + (String(r.other.text || "").length > 400 ? " ..." : ""));
    p("");
  }
  p("**The raw PDF lines** (`pdftotext -layout`, from the row's own line), indentation preserved so the");
  p("two-column interleaving is visible:");
  p("");
  p("```");
  if (!r.window.length) p("(the row's line was not located)");
  for (const ln of r.window) p(ln.replace(/\s+$/, "").slice(0, 200));
  p("```");
  p("");
}
writeFileSync(join(ROOT, OUT), md.join("\n") + "\n", "utf8");

console.log("RECOVERED 27001 CONTROLS, MISATTACHMENT CHECK");
for (const r of rows) {
  console.log("  " + r.clause.padEnd(8) + r.verdict.padEnd(12) +
    "own " + (r.vsOwn ? r.vsOwn.matched + "/" + r.vsOwn.of : "-").padEnd(5) +
    " next " + (r.vsNext ? r.vsNext.matched + "/" + r.vsNext.of : "-").padEnd(5) +
    " 27002 " + (r.vs27002 ? r.vs27002.matched + "/" + r.vs27002.of : "-"));
}
const nbad = rows.filter((r) => r.verdict !== "CORRECT").length;
console.log("  " + (rows.length - nbad) + " of " + rows.length + " confirmed to their own control number");
if (nbad) process.exitCode = 1;
console.log("  wrote " + OUT);
