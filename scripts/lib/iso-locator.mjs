/**
 * iso-locator.mjs - the one place that finds anything inside an ISO PDF.
 *
 * ============ THE TABLE OF CONTENTS IS A DECOY, EVERY TIME ============
 *
 * THREE instruments have now been written against these PDFs and ALL THREE hit
 * the table of contents on the first attempt:
 *
 *   1. `clauseText` asked for clause 5.2 and got the TOC line
 *      "5.2Policy........ 3". Fixed with a dot-leader reject plus
 *      last-occurrence.
 *   2. The main-body/Annex A shadowing fix: last-occurrence then walked PAST
 *      the body into Table A.1, where 27001 numbers its controls 5.1, 5.2,
 *      5.27 -- so a request for main-body 5.2 (Policy) returned Annex A
 *      control A.5.2 (Information security roles and responsibilities).
 *   3. The annex boundary in leak-score took the FIRST "annex a normative",
 *      which is the TOC entry: 27001's boundary landed 6 percent into the
 *      document and 42001's at 2 percent, so nearly every clause-text match
 *      downstream was misclassified as annex structure -- and it found no
 *      boundary at all in seven other standards, under-reporting there at the
 *      same time.
 *
 * Three instruments, three independent rediscoveries of one decoy. So the
 * locator lives here once, and a new instrument that addresses a clause or an
 * annex boundary uses it or states why it cannot.
 *
 * ============ THE OTHER DEFENCE, WHICH IS LESS OBVIOUS ============
 *
 * ISO/IEC 27001:2022 carries a LICENCE WATERMARK in a wide left column that
 * pdftotext -layout merges into heading text. Clause 4.1 extracts as
 * "4.1Understanding the organization" with no space, and clause 5.2's heading
 * is unreachable by ANY line test at all -- its line reads
 * "SNV / licensed to ... / ISO/IEC 27001:2022  5.2Po". A heading matcher that
 * requires a space returns null for every clause of that document, and the
 * check consuming it then scores OK against an empty string.
 *
 * So: accept a space OR an immediate capital after the number, and treat a
 * clause that cannot be located as UNRESOLVABLE and loud, never as an empty
 * haystack.
 */
import { readFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const NL = String.fromCharCode(10);
const CR = String.fromCharCode(13);

/** A table-of-contents line. Dot leaders are the tell in every one of these. */
export const isTocLine = (t) => t.includes("....");

/** Layout text of a PDF, CRs stripped so line handling is uniform. */
export function pdfText(path) {
  const o = join(mkdtempSync(join(tmpdir(), "iso-")), "t.txt");
  execFileSync("pdftotext", ["-layout", path, o]);
  return readFileSync(o, "utf8").split(CR).join("");
}

/**
 * Line index where the normative/informative Annex A begins, or lines.length
 * when the document has none (27000 and the 27001 amendment genuinely do not).
 *
 * LAST occurrence, never the first -- see the header.
 */
export function annexBoundaryLine(lines) {
  let at = lines.length;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (isTocLine(t)) continue;
    if (t === "Annex A" || /^Annex A\s*\((normative|informative)\)/.test(t)) at = i;
  }
  return at;
}

/**
 * Word offset where Annex A begins, for scorers that work on a word array.
 * Same last-occurrence rule, and it accepts informative as well as normative:
 * a locator that only knows one word reports NO ANNEX for the rest, which is
 * silent under-classification rather than loud failure.
 */
export function annexBoundaryWord(words) {
  let at = words.length;
  for (let i = 0; i + 3 <= words.length; i++) {
    if (words[i] === "annex" && words[i + 1] === "a" &&
        (words[i + 2] === "normative" || words[i + 2] === "informative")) at = i;
  }
  return at;
}

/**
 * Body text at a clause address. `where` is "body" (default) or "annex".
 * Returns null when the address cannot be located -- callers MUST treat that
 * as a failure of the check, not as an empty string to score against.
 *
 * No regex escapes in the scanning: a parser written with them has twice
 * arrived mangled through a shell heredoc in this repo, and an over-firing
 * extractor turns correct content into a failure report.
 */
export function clauseText(raw, addr, where = "body") {
  const all = raw.split(NL);
  const cut = annexBoundaryLine(all);
  const lines = where === "annex" ? all.slice(cut) : all.slice(0, cut);

  let at = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t.startsWith(addr)) continue;
    const c = t[addr.length];
    if (c === undefined) continue;
    /* Reject a longer number: 9.2 must not swallow 9.21. */
    if ((c >= "0" && c <= "9") || c === ".") continue;
    /* A space OR an immediate capital -- the watermark merge, see the header. */
    if (!(c === " " || (c >= "A" && c <= "Z"))) continue;
    if (isTocLine(t)) continue;
    at = i;
  }
  if (at < 0) return null;

  const out = [lines[at]];
  for (let i = at + 1; i < lines.length && out.length < 140; i++) {
    const t = lines[i].trim();
    let hl = 0;
    while (hl < t.length && ((t[hl] >= "0" && t[hl] <= "9") || t[hl] === ".")) hl++;
    const head = t.slice(0, hl);
    let k = hl; while (k < t.length && t[k] === " ") k++;
    const nxt = t[k];
    /* Stop at the next heading of the same or shallower depth. The char after
     * the number must be a CAPITAL: allowing a bare space broke on page
     * furniture like "10   (c) ISO/IEC 2023", a page number read as clause 10. */
    if (head && head !== addr && !head.startsWith(addr + ".") &&
        nxt && nxt >= "A" && nxt <= "Z" && head.split(".").length <= 2 &&
        !t.includes("ISO/IEC")) break;
    out.push(lines[i]);
  }
  return out.join(NL);
}

/**
 * Does a span appear in a HEADING or a table-of-contents entry rather than in
 * clause body prose? This is the title-class test, and it is deliberately
 * narrow: a heading line, or a TOC line, and nothing else.
 */
export function isHeadingSpan(raw, spanNorm, normFn) {
  for (const line of raw.split(NL)) {
    const t = line.trim();
    if (!t) continue;
    const n = normFn(t);
    if (!n.includes(spanNorm)) continue;
    if (isTocLine(t)) return true;

    /* ============ A SHORT LINE IS NOT A HEADING ============
     *
     * The first version of this accepted "a short line with no terminal
     * punctuation", because that is what a control title looks like in Table
     * A.1. It is ALSO what a terms-and-definitions entry looks like:
     * ISO/IEC 22989's definition of availability extracts as the single line
     *
     *   property of being accessible and usable on demand by an authorized entity
     *
     * -- 73 characters, no full stop. So the exemption fired on `availability`,
     * a genuine 9-word reproduction of a defined term, and would have excused
     * it. An exemption that excuses the thing it was built to allow past is
     * worse than no exemption, because it is invisible.
     *
     * A heading is now: a TOC line, or a line whose text AFTER a leading
     * clause/control number is short enough to be a title. Definition bodies
     * carry no leading number on their own line and no longer qualify. */
    let hl = 0;
    while (hl < t.length && ((t[hl] >= "0" && t[hl] <= "9") || t[hl] === ".")) hl++;
    if (hl > 0) {
      const rest = t.slice(hl).trim();
      if (rest.length <= 70 && !/[.;:]$/.test(rest)) return true;
    }
    /* A bare standalone title line: short, no leading number, no terminal
     * punctuation, AND no verb-bearing clause structure. Requiring it to be
     * title-cased or all-caps is what separates "AI system impact assessment"
     * from "property of being accessible and usable on demand". */
    if (t.length <= 60 && !/[.;:]$/.test(t) && !/\b(is|are|shall|should|can|of being|the)\b/i.test(t)) return true;
  }
  return false;
}

/**
 * SELF-TEST. An extractor returning empty for an input known to be present is
 * a FAILURE, not a pass. Every caller runs this before believing a verdict.
 */
export function selfTest(raw, addr, mustContain, normFn) {
  const t = clauseText(raw, addr);
  if (!t) throw new Error("LOCATOR SELF-TEST FAILED: clause " + addr + " could not be located at all");
  if (!normFn(t).includes(normFn(mustContain))) {
    throw new Error("LOCATOR SELF-TEST FAILED: clause " + addr + " did not contain " + JSON.stringify(mustContain));
  }
  return t;
}

/**
 * Which clause heading sits above a matched span. Used to attribute a leak
 * fire to a place in the standard.
 *
 * TOC LINES ARE SKIPPED HERE TOO. A span that also appears in the contents
 * would otherwise be attributed to whatever heading precedes the contents
 * entry, which is the same decoy wearing a third costume.
 */
export function clauseForSpan(raw, spanText, normFn, wordsFn) {
  const needle = wordsFn(spanText).slice(0, 5).join(" ");
  if (!needle) return "";
  let heading = "";
  for (const line of raw.split(NL)) {
    const t = line.trimStart();
    if (isTocLine(t)) continue;
    let hl = 0;
    while (hl < t.length && ((t[hl] >= "0" && t[hl] <= "9") || t[hl] === ".")) hl++;
    if (hl > 0) {
      const c = t[hl];
      if (c === " " || (c >= "A" && c <= "Z")) heading = t.slice(0, hl) + " " + t.slice(hl).trim().slice(0, 44);
    }
    if (normFn(line).includes(needle)) return heading || "(no heading above the match)";
  }
  return "(span not located in the layout text)";
}
