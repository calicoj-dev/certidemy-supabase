/**
 * citation-index.mjs - the three management-system standards, parsed into sets
 * of addresses that actually exist, plus the resolver that checks items against
 * them.
 *
 * SHARED ON PURPOSE. scripts/verify-citations.mjs is the standalone sweep;
 * verify-cert.mjs calls the same functions as an invariant. Two copies of a
 * parser whose false-positive modes were this expensive to find is exactly the
 * mirrored-pair defect CLAUDE.md warns about.
 *
 * WHAT IT CHECKS, AND WHAT IT CANNOT. It checks EXISTENCE. "Clause 6.7 exists
 * in ISO 19011:2026" is mechanical; "clause 6.7 says what this item claims" is
 * not. A clean result means every cited address is real, never that the claims
 * are true.
 *
 * THE TWO FALSE-POSITIVE SOURCES THAT WERE FOUND AND CLOSED, because both will
 * come back if the parsers are ever rewritten:
 *
 *   1. DEFINED TERMS PUT THE NUMBER ALONE ON ITS OWN LINE.
 *        3.4
 *        remote auditing method
 *        method used for conducting audit activities from any place other ...
 *      A heading regex cannot see those, so ISO 19011's and ISO/IEC 42001's
 *      whole clause-3 vocabulary was missing and every correct citation of a
 *      defined term was reported as nonexistent.
 *
 *   2. ATTRIBUTION ACROSS SENTENCES. Carrying the last-named standard forward
 *      made "ISO 19011 clause 9.2.2" - a 27001 address - look like a defect.
 *      On an auditor certification, which alternates the two standards
 *      constantly, that produced 689 flags of which essentially none was real.
 *
 * So the rule is: FLAG ONLY WHEN THE ADDRESS EXISTS IN NO INDEXED STANDARD.
 * That needs no attribution and cannot be wrong about which document was meant.
 */
import { readFileSync, existsSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const PDFS = {
  "19011:2026": "C:/Users/Juan/Documents/iso-19011-2026.pdf",
  "27001:2022": "C:/Users/Juan/Documents/ISO_IEC-270012022-ed.3.pdf",
  "42001:2023": "C:/Users/Juan/Documents/iso42001.pdf",
};

/**
 * True when every PDF is on disk. Does NOT probe pdftotext: that binary exits
 * 99 on `-v` in the mingw build, so the obvious probe reported the sources
 * unavailable on a machine where they were all present. A missing pdftotext
 * surfaces as a throw from buildIndex(), which callers already handle.
 */
/**
 * Is the `pdftotext` binary callable at all?
 *
 * NOT `exit code === 0`. The mingw build exits 99 on `-v`, and an earlier
 * version of this file recorded that an exit-code probe "reported the sources
 * unavailable on a machine where they were all present" -- which is why the
 * check below was skipped entirely for months.
 *
 * The distinction that actually holds is ENOENT (the binary is not on PATH)
 * against ANY exit code (it ran). execFileSync throws in both cases; only the
 * first sets `code === 'ENOENT'`.
 *
 * WHY THIS IS DECLARED RATHER THAN LEFT TO THROW. An undeclared dependency is
 * why a re-scan does not happen: scan-iso-leaks is the remedy for a lesson
 * withheld by an edit, and on a fresh checkout it dies inside pdfText with a
 * spawn error that names no remedy. Bought 2026-09-19, after a body sat
 * withheld for two days.
 */
export function pdftotextAvailable() {
  try {
    execFileSync("pdftotext", ["-v"], { stdio: "ignore" });
    return true;
  } catch (e) {
    return e && e.code === "ENOENT" ? false : true;
  }
}

export function sourcesAvailable() {
  return Object.values(PDFS).every((p) => existsSync(p));
}

function pdfText(path) {
  const out = join(mkdtempSync(join(tmpdir(), "ci-")), "t.txt");
  execFileSync("pdftotext", ["-layout", path, out]);
  return readFileSync(out, "utf8");
}

function headingNumbers(text, re) {
  const set = new Set();
  for (const line of text.split(/\r?\n/)) {
    const m = line.trim().match(re);
    if (m) set.add(m[1]);
  }
  return set;
}

/** See false-positive source 1 in the docblock. */
function standaloneNumbers(text) {
  const set = new Set();
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length - 1; i++) {
    const m = lines[i].trim().match(/^(\d+\.\d+)$/);
    if (m && /^[a-z]/.test(lines[i + 1].trim())) set.add(m[1]);
  }
  return set;
}

function withAncestors(set) {
  const out = new Set(set);
  for (const k of set) {
    const parts = k.split(".");
    for (let i = 1; i < parts.length; i++) out.add(parts.slice(0, i).join("."));
  }
  return out;
}

let CACHE = null;

/** Parse all three PDFs. Throws if a structure check fails - never widens silently. */
export function buildIndex() {
  if (CACHE) return CACHE;
  const t19011 = pdfText(PDFS["19011:2026"]);
  const t27001 = pdfText(PDFS["27001:2022"]);
  const t42001 = pdfText(PDFS["42001:2023"]);

  const c19011 = new Set([
    ...headingNumbers(t19011, /^(\d+(?:\.\d+)*)\s*[A-Z]/),
    ...standaloneNumbers(t19011),
  ]);
  const a19011 = headingNumbers(t19011, /^(A\.\d+(?:\.\d+)*)\s*[A-Z]/);

  const lines27 = t27001.split(/\r?\n/);
  const annexAt = lines27.findIndex((l, i) => i > 300 && /^\s*Annex A\s*$/.test(l));
  const body27 = lines27.slice(0, annexAt > 0 ? annexAt : lines27.length).join("\n");
  const annex27 = lines27.slice(annexAt > 0 ? annexAt : 0).join("\n");
  const c27001 = new Set([
    ...headingNumbers(body27, /^(\d+(?:\.\d+)*)\s*[A-Z]/),
    ...standaloneNumbers(body27),
  ]);
  // Annex A control numbering is contiguous within each theme by construction.
  // A.5.1, A.5.15 and A.8.22 have wrapped titles the line parser cannot see, and
  // treating those as nonexistent would flag items that cite them correctly.
  // The maxima are asserted so a changed extraction fails loudly.
  const parsed27 = headingNumbers(annex27, /^([5-8]\.\d+)\s*\S/);
  const maxBy = {};
  for (const k of parsed27) {
    const [t, n] = k.split(".");
    maxBy[t] = Math.max(maxBy[t] || 0, Number(n));
  }
  for (const [t, n] of Object.entries({ 5: 37, 6: 8, 7: 14, 8: 34 })) {
    if (maxBy[t] !== n) {
      throw new Error(`ISO/IEC 27001 Annex A theme ${t} parsed max ${maxBy[t]}, expected ${n} - fix the parser before trusting any result`);
    }
  }
  const a27001 = new Set();
  for (const [t, mx] of Object.entries(maxBy)) {
    for (let i = 1; i <= mx; i++) a27001.add(`A.${t}.${i}`);
  }

  const lines42 = t42001.split(/\r?\n/);
  const at42 = (label) => lines42.findIndex((l, i) => i > 800 && new RegExp(`^\\s*${label}\\s*$`).test(l));
  const iA = at42("Annex A"), iB = at42("Annex B"), iC = at42("Annex C"), iD = at42("Annex D");
  const slice42 = (a, b) => lines42.slice(a > 0 ? a : 0, b > 0 ? b : lines42.length).join("\n");
  const c42001 = new Set([
    ...headingNumbers(slice42(0, iA), /^(\d+(?:\.\d+)*)\s*[A-Z]/),
    ...standaloneNumbers(slice42(0, iA)),
  ]);
  const a42001 = headingNumbers(slice42(iA, iB), /^(A\.\d+(?:\.\d+)*)\s*\S/);
  const b42001 = headingNumbers(slice42(iB, iC), /^(B\.\d+(?:\.\d+)*)\s*\S/);
  const cd42001 = new Set([
    ...headingNumbers(slice42(iC, iD), /^(C\.\d+(?:\.\d+)*)\s*\S/),
    ...headingNumbers(slice42(iD, -1), /^(D\.\d+(?:\.\d+)*)\s*\S/),
  ]);

  CACHE = {
    "19011": { clauses: withAncestors(c19011), annex: withAncestors(new Set([...a19011, "A"])) },
    "27001": { clauses: withAncestors(c27001), annex: withAncestors(new Set([...a27001, "A"])) },
    "42001": { clauses: withAncestors(c42001), annex: withAncestors(new Set([...a42001, ...b42001, ...cd42001, "A", "B", "C", "D"])) },
  };
  return CACHE;
}

export const CORRECT_EDITION = { 19011: "2026", 27001: "2022", 42001: "2023" };
const UNDATED_OK = new Set(["27000", "27002", "27005", "27007", "17021", "17024", "22989", "42006", "42005", "17012", "9000", "9001", "14001", "31000", "20000", "23894", "27003", "27004", "27006", "27701", "15489", "5338", "38507"]);

const STD_RE = /ISO(?:\/IEC)?(?:\/TS)?\s+(\d{4,5})(?:-\d+)?(?::(\d{4}))?/g;
const CLAUSE_RE = /\b(?:clause|cl[áa]usula|apartado|cap[ií]tulo|secci[óo]n|se[çc][ãa]o)\s*(\d+(?:\.\d+)*)/gi;
const ANNEX_RE = /\b(?:annex|anexo)\s*([A-D](?:\.\d+)*)/gi;
const BARE_ANNEX_RE = /\b([A-D]\.\d+(?:\.\d+)*)\b/g;

const splitSentences = (s) => String(s).split(/(?<=[.;:!?])\s+|\n+/);

export function newSink() {
  return { checked: 0, missing: [], edition: [], unknownStd: [], misattributed: [], ambiguous: 0, unattributed: 0, exempted: 0 };
}

/**
 * Load the citation exemptions as Map<question_group_id, Set<token>>.
 *
 * An exempted citation is one a checker WOULD flag and that is correct in
 * context - an item naming a superseded edition in order to dismiss it. See
 * migration 305; every row carries the argument for itself.
 *
 * Returns an empty Map if the table is absent, so a checkout without the
 * migration still runs (and re-flags the two items, loudly rather than wrongly).
 */
export async function loadExemptions(db) {
  const out = new Map();
  const { data, error } = await db.from("citation_exemptions").select("question_group_id, token");
  // A DROPPED READ MUST NOT BECOME AN ANSWER. This returned an empty Map on
  // error, indistinguishable from "no exemptions exist" - so a broken read would
  // silently re-flag every correct item the table exists to excuse and the
  // caller would report those as findings. It cost an afternoon of suspecting a
  // defect that was not there. THROW instead.
  if (error) throw new Error(`citation_exemptions unreadable: ${error.message}. Refusing to continue - an empty exemption set is indistinguishable from a failed read.`);
  if (!data) throw new Error("citation_exemptions returned no data and no error - refusing to treat that as an empty set.");
  for (const r of data) {
    if (!out.has(r.question_group_id)) out.set(r.question_group_id, new Set());
    out.get(r.question_group_id).add(r.token.replace(/\s+/g, " "));
  }
  return out;
}

export function analyseText(text, index, sink, exempt = null) {
  const existsSomewhere = (r) => Object.values(index).some((ix) =>
    (r.kind === "annex" ? ix.annex : ix.clauses).has(r.n));

  for (const sent of splitSentences(text)) {
    const stds = [];
    for (const m of sent.matchAll(STD_RE)) stds.push({ num: m[1], year: m[2] || null, raw: m[0] });

    for (const s of stds) {
      const want = CORRECT_EDITION[s.num];
      const raw = s.raw.replace(/\s+/g, " ");
      if (want && s.year && s.year !== want) {
        // EXEMPTIONS COVER THE EDITION HALF ONLY, ON PURPOSE. A nonexistent
        // address is never legitimate - there is no item that correctly cites a
        // clause which does not exist - so nothing may excuse one.
        if (exempt && exempt.has(raw)) { sink.exempted++; continue; }
        sink.edition.push({ raw, expected: `${s.num}:${want}` });
      } else if (!want && !UNDATED_OK.has(s.num)) {
        sink.unknownStd.push({ raw: s.raw.replace(/\s+/g, " ") });
      }
    }

    const refs = [];
    for (const m of sent.matchAll(CLAUSE_RE)) refs.push({ kind: "clause", n: m[1], raw: m[0] });
    for (const m of sent.matchAll(ANNEX_RE)) refs.push({ kind: "annex", n: m[1].toUpperCase(), raw: m[0] });
    for (const m of sent.matchAll(BARE_ANNEX_RE)) {
      if (!refs.some((r) => r.n === m[1].toUpperCase())) refs.push({ kind: "annex", n: m[1].toUpperCase(), raw: m[0] });
    }
    if (!refs.length) continue;

    const known = [...new Set(stds.map((s) => s.num))].filter((n) => index[n]);
    if (!known.length) { sink.unattributed += refs.length; continue; }

    for (const r of refs) {
      sink.checked++;
      if (!existsSomewhere(r)) {
        sink.missing.push({ ref: r.raw.replace(/\s+/g, " "), n: r.n, kind: r.kind, named: known.join("+") });
        continue;
      }
      if (known.length === 1) {
        const pool = r.kind === "annex" ? index[known[0]].annex : index[known[0]].clauses;
        if (!pool.has(r.n)) {
          const elsewhere = Object.keys(index).filter((k) =>
            (r.kind === "annex" ? index[k].annex : index[k].clauses).has(r.n));
          sink.misattributed.push({ named: known[0], ref: r.raw.replace(/\s+/g, " "), n: r.n, elsewhere: elsewhere.join("/") });
        }
      } else {
        sink.ambiguous++;
      }
    }
  }
  return sink;
}
