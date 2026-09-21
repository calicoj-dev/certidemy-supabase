#!/usr/bin/env node
/**
 * verify-claim-content.mjs - does the cited address CARRY what is attributed
 * to it, as opposed to merely existing.
 *
 * READ-ONLY. No --apply, no --dry, unknown flags exit 2.
 *
 * ============ THE QUESTION citation-index.mjs DOES NOT ASK ============
 *
 * `citation-index.mjs` answers "does clause 6.7 exist in ISO 19011". That is
 * mechanical and it is not the question a reader cares about. Its own header
 * says so plainly -- *"it checks EXISTENCE, NEVER MEANING"* -- and that
 * limitation was accepted for months.
 *
 * It was paid for on 2026-09-21. Three lessons reproduce a 17-word sentence
 * from ISO/IEC 27000:2018, and TWO of them credit it to ISO 19011:2026, which
 * contains neither half of it. All three standards were on disk the whole
 * time and the citation checker was green, because every address named was
 * real. POSSESSION IS NOT VERIFICATION.
 *
 * ============ WHAT THIS MEASURES, AND WHAT IT CANNOT ============
 *
 * For a citation of the form "<standard> clause <address>", it pulls the text
 * AT that address and measures how much of the citing sentence's distinctive
 * vocabulary appears there. For "<standard> says/states/notes/requires that
 * <claim>", it measures the claim against the WHOLE standard.
 *
 * This is a PROXY for correspondence, not a judgement of truth. A sentence can
 * share every word with a clause and still misdescribe it, and a correct
 * paraphrase can share few. So the output is a RANKED READ, and the scores are
 * calibrated against instances already known to be right and wrong rather than
 * chosen.
 *
 * TWO RESULTS ARE REPORTED SEPARATELY AND NEITHER SUBSTITUTES FOR THE OTHER:
 * whether the ADDRESS EXISTS, and whether the CONTENT CORRESPONDS. Passing one
 * while failing the other is the normal case -- it is the entire finding -- so
 * collapsing them into a single verdict would rebuild the defect this script
 * exists to expose.
 *
 * ============ A STANDARD WE DO NOT HOLD IS NOT A PASS ============
 *
 * Claims about ISO/IEC 17021-1, ISO/IEC 5338, ISO/IEC 23894, ISO/IEC 42005,
 * ISO/IEC 27701, the NIST AI RMF and the EU AI Act cannot be checked here at
 * all. ISO/IEC 42006 is held as a PREVIEW -- cover, scope and contents -- so a
 * claim about what it governs is checkable against a contents page and nothing
 * more. All of these are reported as UNVERIFIABLE with the reason, never as
 * clean, because an unaskable question returning no error is the silent-success
 * shape this repository is built around.
 */
import { readFileSync, existsSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, MANIFEST, pdftotextAvailable, expectedWords, verifyCorpus } from "./lib/citation-index.mjs";

const KNOWN = new Set(["--out", "--corpus", "--min", "--quiet"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". READ-ONLY; no --apply, no --dry.");
    process.exit(2);
  }
}
const argOf = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};

if (!pdftotextAvailable()) { console.error("pdftotext is not on PATH."); process.exit(2); }
const bad = verifyCorpus();
if (bad.length) { console.error("CORPUS CONTROL FAILED:\n  " + bad.join("\n  ")); process.exit(1); }

/* ---------------------------------------------------------- the standards */

const norm = (s) => String(s || "").toLowerCase()
  .replace(/[‘’]/g, "'").replace(/[–—]/g, "-")
  .replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();

function pdfText(p) {
  const o = join(mkdtempSync(join(tmpdir(), "vc-")), "t.txt");
  execFileSync("pdftotext", ["-layout", p, o]);
  return readFileSync(o, "utf8");
}

const RAW = new Map(), FLAT = new Map();
for (const [key, p] of Object.entries(PDFS)) {
  const t = pdfText(p);
  if (norm(t).split(" ").filter(Boolean).length !== expectedWords(key)) {
    console.error(key + " extraction disagrees with the manifest. Refusing."); process.exit(1);
  }
  RAW.set(key, t.replace(/\r/g, ""));
  FLAT.set(key, norm(t));
}

/* Standards a citation can name, mapped to an index key or to the reason they
 * cannot be checked. NOT HELD is a first-class outcome, never silence. */
const HELD = {
  "42001": "42001:2023", "27001": "27001:2022", "19011": "19011:2026",
  "22989": "22989:2022", "27000": "27000:2018", "27002": "27002:2022",
  "27004": "27004:2016", "27005": "27005:2022",
};
const NOT_HELD = {
  "42006": "PREVIEW ONLY -- cover, scope and contents page, and a Singapore Standard adoption. Any claim about what it governs is checkable against a contents page and nothing more.",
  "17021": "not on disk", "17021-1": "not on disk", "5338": "not on disk",
  "23894": "not on disk", "42005": "not on disk", "27701": "not on disk",
  "9001": "not on disk", "22000": "not on disk", "13485": "not on disk",
  "62304": "not on disk", "29100": "not on disk", "38507": "not on disk",
  "37002": "not on disk", "17024": "not on disk", "5259": "not on disk",
  "NIST": "not on disk", "EUAIACT": "not a standard in this corpus",
};

/** Body text at one clause address.
 *
 * ============ THE FIRST VERSION READ THE TABLE OF CONTENTS ============
 *
 * It took the FIRST regex match of the address at line start, and in an ISO
 * PDF that is the contents entry, not the body heading. Every clause this
 * script pulled was therefore a line of dot leaders plus whatever followed it
 * in the contents -- and an address absent from the contents but present in
 * the body read as ADDRESS NOT FOUND.
 *
 * That defect sat underneath a reported count of 147 missing addresses, which
 * is why the count was rebuilt before it was triaged rather than after.
 *
 * No regex escapes: a shell heredoc collapsed the double backslashes in the
 * sibling copy of this function today, turning a tab class into a literal tab
 * and reporting 28 addresses missing that were all present. */
const NL = String.fromCharCode(10);
function clauseText(key, addr) {
  const lines = RAW.get(key).split(NL);
  let at = -1;
  for (let i = 0; i < lines.length; i++) {
    /* ============ A HEADING NEED NOT HAVE A SPACE AFTER ITS NUMBER =======
     * ISO/IEC 27001:2022 extracts as "4.1Understanding the organization" --
     * no space -- behind a wide licence-watermark column. Requiring "4.1 "
     * made clauseText return NULL for every clause of that document, and the
     * audit check that consumed it passed on an EMPTY STRING: "27001 clause
     * 4.1 does not mention roles" was a vacuous OK. A check that asks nothing
     * cannot fail. Accept a space OR an immediate capital, and reject a digit
     * or dot so 9.2 does not swallow 9.21. */
    const t = lines[i].trim();
    if (!t.startsWith(addr)) continue;
    const c = t[addr.length];
    if (c === undefined) continue;
    if ((c >= "0" && c <= "9") || c === ".") continue;
    if (!(c === " " || (c >= "A" && c <= "Z"))) continue;
    if (t.includes("....")) continue;
    at = i;
  }
  if (at < 0) return null;
  const depth = addr.split(".").length;
  const out = [lines[at]];
  for (let i = at + 1; i < lines.length && out.length < 140; i++) {
    /* ============ THE STOP CONDITION HAD THE SAME BLIND SPOT ============
     * It took split(" ")[0] as the heading number, which for 27001s
     * "4.2Understanding..." is the whole phrase and therefore not numeric --
     * so the extractor never stopped, ran 140 lines past the clause, and swept
     * clause 5 into clause 4.1. That is how "27001 clause 4.1 mentions role"
     * came out of a clause whose body contains no such word. Scan the leading
     * digits and dots directly instead of trusting a space to be there. */
    const t = lines[i].trim();
    let hl = 0;
    while (hl < t.length && ((t[hl] >= "0" && t[hl] <= "9") || t[hl] === ".")) hl++;
    const head = t.slice(0, hl);
    /* The char after the number must be a CAPITAL, whether or not a space
     * intervenes. Allowing a bare space broke on page furniture like
     * "10            (c) ISO/IEC 2023" -- a page number read as clause 10,
     * which truncated 6.2 to one item and cut role out of 4.1. */
    let k = hl;
    while (k < t.length && t[k] === " ") k++;
    const nx = t[k];
    const numeric = hl > 0 && head !== ".";
    const nextOk = nx !== undefined && nx >= "A" && nx <= "Z";
    if (numeric && nextOk && head.replace(/.$/, "").split(".").length <= depth && !t.includes("....")) break;
    out.push(lines[i]);
  }
  return out.join(NL);
}

const STOP = new Set(("the a an and or of to in for on by with that this it is are be as at from its their which "
  + "not no than then when where what who whom whose how why can could may might must shall should will would "
  + "one two three four five six seven eight nine ten first second third has have had was were been being do does "
  + "did done more most other others some any all each every both either neither such same own only just also "
  + "there here they them these those you your our we us i he she his her").split(" "));

/* ============ THE FIRST VERSION OF THIS FAILED ITS OWN SELF-TEST ==========
 *
 * It scored bag-of-words overlap of the claim against the WHOLE cited standard.
 * The known misattribution scored 1.00 and so did the correct one: every word
 * of "an internal audit is conducted by the organization itself or by an
 * external party on its behalf" appears SOMEWHERE in ISO 19011, because 19011
 * is an auditing standard. A test that cannot separate its own motivating
 * instance is not a weak test, it is a broken one, and the self-test refused to
 * report before anyone could believe a number from it.
 *
 * Two claim shapes need two different tests:
 *
 *   REPRODUCTION  "X states that <sentence>". The claim purports to be the
 *       standard's own words, so the test is CONTIGUITY: the longest run of
 *       the claim present in that standard, as a fraction of the claim.
 *       Scattered words prove nothing; a contiguous stretch proves authorship.
 *
 *   ADDRESS       "clause 6.1.4 requires X". The claim is a paraphrase, so
 *       bag-of-words is defensible -- but ONLY against the text AT THAT
 *       ADDRESS, never against the whole document.
 *
 * AND THE SHARPEST TEST IS COMPARATIVE, which is what actually caught the
 * instance: score the claim against EVERY indexed standard and report which
 * one carries it best. A claim whose best source is not its cited source is a
 * misattribution with the right answer attached. This is the same move as
 * "a run with no source is the tell", generalised.
 */
const SEED = 5;
const GRAMS = new Map();
for (const key of Object.keys(PDFS)) {
  const w = FLAT.get(key).split(" ").filter(Boolean);
  const set = new Set();
  for (let i = 0; i + SEED <= w.length; i++) set.add(w.slice(i, i + SEED).join(" "));
  GRAMS.set(key, set);
}

/** Longest contiguous run of `claim` present in one standard, and its share. */
function contiguity(claim, key) {
  const w = norm(claim).split(" ").filter(Boolean);
  if (w.length < SEED) return { run: 0, share: 0, hit: "" };
  const set = GRAMS.get(key);
  let best = 0, hit = "";
  for (let i = 0; i + SEED <= w.length; i++) {
    if (!set.has(w.slice(i, i + SEED).join(" "))) continue;
    let n = SEED;
    while (i + n + 1 <= w.length && set.has(w.slice(i + n + 1 - SEED, i + n + 1).join(" "))) n++;
    if (n > best) { best = n; hit = w.slice(i, i + n).join(" "); }
    i += n - 1;
  }
  return { run: best, share: best / w.length, hit };
}

/** Fraction of the claim's distinctive words present in a NARROW text. */
function overlap(claim, text) {
  const words = [...new Set(norm(claim).split(" ").filter((w) => w.length >= 5 && !STOP.has(w)))];
  if (!words.length) return { frac: null, n: 0, missing: [] };
  const hay = " " + norm(text) + " ";
  const missing = words.filter((w) => !hay.includes(" " + w));
  return { frac: (words.length - missing.length) / words.length, n: words.length, missing };
}

/** Which indexed standard carries this claim most contiguously. */
function bestSource(claim) {
  let best = null;
  for (const key of Object.keys(PDFS)) {
    const c = contiguity(claim, key);
    if (!best || c.run > best.run) best = { key, ...c };
  }
  return best;
}

export function checkCitation({ standard, address, claim, shape }) {
  const key = HELD[standard];
  if (!key) {
    return { verdict: "UNVERIFIABLE", address_exists: null, content: null,
      why: NOT_HELD[standard] || ("ISO " + standard + " is not indexed") };
  }

  /* RESULT ONE: does the address exist. Reported on its own line, always,
   * because passing this while failing the next is the normal case. */
  let text = null, exists = null;
  if (address) {
    text = clauseText(key, address);
    exists = text !== null;
    if (!exists) return { verdict: "ADDRESS NOT FOUND", address_exists: false, content: null, source: key };
  }

  /* RESULT TWO: does the content correspond. */
  if (shape === "reproduction") {
    const here = contiguity(claim, key);
    const best = bestSource(claim);
    const misattributed = best.run >= SEED && best.run > here.run * 2 && best.key !== key;
    return {
      verdict: misattributed ? "MISATTRIBUTED" : here.share >= 0.5 ? "CORRESPONDS"
        : here.run >= SEED ? "PARTIAL" : "NO CORRESPONDENCE",
      address_exists: exists, content: here.share, run: here.run, hit: here.hit,
      best_source: best.key, best_run: best.run, source: key,
    };
  }
  const o = overlap(claim, text ?? RAW.get(key));
  return {
    verdict: o.frac === null ? "NO TESTABLE TERMS" : o.frac >= 0.70 ? "CORRESPONDS"
      : o.frac >= 0.40 ? "PARTIAL" : "NO CORRESPONDENCE",
    address_exists: exists, content: o.frac, terms: o.n, missing: o.missing, source: key,
  };
}

export { HELD, NOT_HELD, FLAT, RAW, norm };

/* ---------------------------------------------------- self-test, run first */

if (process.argv[1] && process.argv[1].endsWith("verify-claim-content.mjs")) {
  /* POSITIVE CONTROL ON THE INSTRUMENT. A known misattribution must score low
   * and a known-correct citation must score high, or the numbers below mean
   * nothing. These are the instances that bought the script. */
  const SENT = "an internal audit is conducted by the organization itself or by an external party on its behalf";
  const KNOWN_BAD = checkCitation({ standard: "19011", claim: SENT, shape: "reproduction" });
  const KNOWN_GOOD = checkCitation({ standard: "27000", claim: SENT, shape: "reproduction" });
  console.log("");
  console.log("SELF-TEST -- the instance that bought this script");
  console.log("  attributed to 19011 (WRONG)   run " + KNOWN_BAD.run + "w share " + (KNOWN_BAD.content ?? 0).toFixed(2)
    + "   " + KNOWN_BAD.verdict + "   best source: " + KNOWN_BAD.best_source + " at " + KNOWN_BAD.best_run + "w");
  console.log("  attributed to 27000 (RIGHT)   run " + KNOWN_GOOD.run + "w share " + (KNOWN_GOOD.content ?? 0).toFixed(2)
    + "   " + KNOWN_GOOD.verdict);
  if (!(KNOWN_GOOD.content > KNOWN_BAD.content && KNOWN_BAD.verdict === "MISATTRIBUTED")) {
    console.error("SELF-TEST FAILED: the instrument cannot separate its own motivating instance.");
    process.exit(1);
  }
  console.log("  separation " + ((KNOWN_GOOD.content - KNOWN_BAD.content)).toFixed(2) + " -- the instrument can tell them apart");
  console.log("");
  console.log("INDEXED: " + Object.keys(PDFS).join(", "));
  console.log("UNVERIFIABLE BY CONSTRUCTION: " + Object.keys(NOT_HELD).join(", "));
}
