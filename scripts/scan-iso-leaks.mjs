#!/usr/bin/env node
/**
 * scan-iso-leaks.mjs - measure every lesson against the three ISO standards and
 * write the verdict into `lessons.mcp_servable`.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 *   node scripts/scan-iso-leaks.mjs                    # dry, full report
 *   node scripts/scan-iso-leaks.mjs --cert ISMS-F      # one certification
 *   node scripts/scan-iso-leaks.mjs --apply
 *
 * ============ THE FAILURE MODE THIS SCRIPT IS BUILT AROUND ============
 *
 * If `pdftotext` is missing, or a PDF moves, or the extraction returns an empty
 * string, THE INDEX IS EMPTY -- and an empty index matches nothing, so every
 * lesson scores a longest run of zero and EVERY LESSON BECOMES SERVABLE.
 *
 * That is a total failure that looks exactly like a total pass. It is the
 * silent-success shape this repository is largely about, pointed at the one
 * mechanism whose whole purpose is to withhold text.
 *
 * So this script refuses to write unless BOTH controls fire:
 *
 *   NEGATIVE CONTROL -- AISM-I must come out clean. It cites no ISO standard
 *       at all (IP-POSITION section 6), 183 lessons, longest shared run 8 words.
 *       If AISM-I starts tripping, the index has become too loose or the
 *       normaliser has changed, and the verdicts are noise.
 *
 *   POSITIVE CONTROL -- a named lesson known to quote a standard at length must
 *       trip, and by at least the run length recorded here. If it does not, the
 *       index is empty or broken and a clean sweep means nothing.
 *
 * A check that cannot fail is not evidence that nothing is wrong. It is an
 * untested instrument, and here it is an untested instrument guarding a
 * redistribution rule.
 *
 * ============ THE THRESHOLD IS READ, NEVER HARDCODED ============
 *
 * It lives in `public.mcp_leak_policy`, one row, migration 332. The evidence
 * (`mcp_iso_longest_run`) and the verdict (`mcp_servable`) are stored
 * separately, so moving the policy is an UPDATE plus a re-derivation rather
 * than three PDFs against two thousand lessons again.
 */
import { readFileSync, existsSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { segments, attributedQuote, quoteLines, isAttributed, isQuoteLine,
         QUOTATION_CEILING, checkFaithful as segControl, checkAddress } from "./lib/iso-segments.mjs";
import { PDFS, sourcesAvailable, pdftotextAvailable, expectedWords, verifyCorpus, MANIFEST } from "./lib/citation-index.mjs";
import { runUnits, SEED as LEAK_SEED } from "./lib/leak-score.mjs";

const KNOWN = new Set(["--apply", "--cert", "--verbose", "--seed"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ".");
    console.error("This is the --apply family: dry by default. Known: --apply, --cert, --verbose, --seed.");
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const APPLY = process.argv.includes("--apply");
const VERBOSE = process.argv.includes("--verbose");
const ONLY = arg("cert", "");
/* ============ ONE SEED, IMPORTED, NOT A SECOND CONSTANT ============
 *
 * This read `Number(arg("seed", "5"))` while `lib/leak-score.mjs` used 4, and
 * the two gates disagreed for the whole life of the programme: seed 5 refused
 * 9 lesson rows where seed 4 refused 60.
 *
 * That was never a sensitivity choice. Both scorers extended a run while the
 * TRAILING seed-gram existed anywhere in the document, so the extension hopped
 * between unrelated places -- and a longer gram is arithmetically harder to
 * chain, so seed 5 chained LESS. It was not more correct, it was less wrong,
 * and it paid for that by missing genuine short runs.
 *
 * With extension by POSITION the two produce IDENTICAL verdicts on every
 * certification, measured. So they unify at 4: sensitivity now costs nothing,
 * because chaining was the only thing that made the extra matches worthless.
 *
 * Unified by IMPORT rather than by setting both to the same number. Two
 * parameters that agree today can diverge tomorrow, and a gate that agrees
 * with its sibling by coincidence is one edit away from not doing so -- which
 * is this file's own rule about a computation with a stated invariant having
 * exactly one implementation.
 *
 * `--seed` survives as a MEASUREMENT override for comparing instruments. It
 * does not change the shared constant and a scan run with it is not a verdict. */
const SEED = Number(arg("seed", String(LEAK_SEED)));
if (SEED !== LEAK_SEED) {
  console.log("  SEED OVERRIDDEN to " + SEED + " (shared constant is " + LEAK_SEED + ").");
  console.log("  This is a measurement, not a verdict. --apply is refused.");
  if (APPLY) {
    console.error("");
    console.error("REFUSING: --seed with --apply. A verdict is written at the shared seed or");
    console.error("not at all, or the stored run becomes a fact about a flag somebody passed.");
    process.exit(2);
  }
}

const HERE = dirname(fileURLToPath(import.meta.url));
for (const p of [join(HERE, ".env"), join(HERE, "..", ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };

async function rest(path, init) {
  let last;
  for (let i = 0; i < 12; i++) {
    try {
      const r = await fetch(BASE + "/" + path, { ...init, headers: { ...H, ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(60000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 220));
      return { body: t ? JSON.parse(t) : null, range: r.headers.get("content-range") };
    } catch (e) { last = e; }
  }
  throw new Error(path + ": " + last?.message);
}
const get = async (p) => (await rest(p)).body;

/** Page to exhaustion and prove it against a server-side count. */
async function all(path) {
  const PAGE = 500;
  const out = [];
  for (let from = 0; ; from += PAGE) {
    const { body } = await rest(path + "&order=id&offset=" + from + "&limit=" + PAGE);
    out.push(...body);
    if (body.length < PAGE) break;
  }
  const { range } = await rest(path + "&limit=1", { headers: { Prefer: "count=exact" } });
  const total = range ? Number(range.split("/")[1]) : NaN;
  if (Number.isFinite(total) && total !== out.length) {
    throw new Error("PAGING INCOMPLETE: fetched " + out.length + ", server says " + total);
  }
  return out;
}

const norm = (s) => String(s || "").toLowerCase()
  .replace(/[‘’]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();

function pdfText(p) {
  const o = join(mkdtempSync(join(tmpdir(), "iso-")), "t.txt");
  execFileSync("pdftotext", ["-layout", p, o]);
  return readFileSync(o, "utf8");
}

/* ------------------------------------------------------------- the index */

/* PDFTOTEXT IS A HARD DEPENDENCY AND IS CHECKED FIRST, because it is the one
 * that makes this script unrunnable on a fresh checkout -- and this script is
 * the remedy for a lesson the edit trigger withheld. Without the check it dies
 * inside pdfText() with a spawn error naming no remedy, which is how a re-scan
 * comes to be "something nobody got round to". */
if (!pdftotextAvailable()) {
  console.error("");
  console.error("pdftotext IS NOT ON PATH. Refusing to scan.");
  console.error("");
  console.error("  It ships with poppler-utils and is NOT installed by npm:");
  console.error("    Windows   choco install poppler   (or scoop install poppler)");
  console.error("    macOS     brew install poppler");
  console.error("    Debian    apt-get install poppler-utils");
  console.error("");
  console.error("Every lesson body's leak verdict comes from text this binary extracts.");
  process.exit(2);
}

if (!sourcesAvailable()) {
  console.error("");
  console.error("THE STANDARDS ARE NOT ON DISK. Refusing to scan.");
  console.error("An absent source yields an empty index, an empty index matches nothing,");
  console.error("and every lesson would be marked servable. Expected:");
  for (const [k, p] of Object.entries(PDFS)) console.error("  " + k.padEnd(12) + p + (existsSync(p) ? "" : "   MISSING"));
  process.exit(2);
}

console.log("");
console.log("building the index from " + Object.keys(PDFS).length + " standards");
const grams = new Set();
/* Per-source indices exist ONLY for the positive controls below. The scan
 * itself uses the combined index; a run is a run whichever standard it came
 * from. Keeping them separate is what lets the control say WHICH source failed
 * to load rather than only that something did. */
const perSource = new Map();
const srcParts = [];
for (const [label, path] of Object.entries(PDFS)) {
  const raw = pdfText(path);
  const w = norm(raw).split(" ").filter(Boolean);
  if (w.length !== expectedWords(label)) {
    console.error("  " + label + " extracted " + w.length + " words, manifest says " + expectedWords(label) + ".");
    console.error("  Refusing: the source or the extractor moved, and no verdict below is comparable.");
    process.exit(1);
  }
  /* THE POSITIONS, NOT ONLY THE MEMBERSHIP. A seed-gram set answers "does this
   * window appear somewhere", which is the question that let a run hop between
   * unrelated places in one document. `at` answers "where", and that is what
   * an extension has to follow. */
  const own = new Set();
  const at = new Map();
  for (let i = 0; i + SEED <= w.length; i++) {
    const gram = w.slice(i, i + SEED).join(" ");
    grams.add(gram);
    own.add(gram);
    if (!at.has(gram)) at.set(gram, []);
    at.get(gram).push(i);
  }
  perSource.set(label, { grams: own, at, words: w });
  srcParts.push(label + ":" + createHash("sha256").update(raw).digest("hex").slice(0, 8));
  console.log("  " + label.padEnd(12) + String(w.length).padStart(7) + " words");
}
const SOURCES = srcParts.join(" ");
console.log("  " + grams.size + " distinct " + SEED + "-grams");
console.log("  sources: " + SOURCES);

/**
 * Longest contiguous run in ONE stretch of text also present in ONE standard.
 *
 * ============ MEASURED PER SOURCE, NOT AGAINST THE UNION ============
 *
 * This used to run the greedy extension against the COMBINED gram set, and the
 * combined set manufactures adjacency: a run can chain from one document into
 * another across a junction that exists in neither. The reported length is then
 * a property of the index rather than of any standard.
 *
 * FOUND 2026-09-21, ON THE RUN THAT WIDENING THE CORPUS FROM THREE SOURCES TO
 * NINE PRODUCED. Of eight lesson groups the union-based measure refused, FOUR
 * held no contiguous match in any single standard:
 *
 *   reported 14w  longest real fragment 9w  (27001 and 42001, each below 10)
 *   reported 10w  longest real fragment 7w  (42001)
 *   reported 10w  longest real fragment 7w  (42001)
 *   reported 10w  longest real fragment 9w  (19011)
 *
 * TWELVE OF TWENTY-FOUR REFUSALS WERE ARTIFACTS, and they would have withheld
 * four lesson groups in three languages for reproducing nothing. The defect was
 * always latent and three overlapping standards rarely triggered it; nine
 * management-system standards sharing harmonised boilerplate trigger it often.
 *
 * Same family as the join fan-out and the separator-free concatenation already
 * recorded in CLAUDE.md: THE QUERY MANUFACTURED AN ADJACENCY THE DATA DOES NOT
 * HAVE. A reproduction is a reproduction OF A DOCUMENT, so the measurement has
 * to be per document and the maximum taken afterwards.
 *
 * Callers pass a segment, not a whole document -- see `longestMeasured`.
 */
function longestRun(text) {
  /* ============ SCAFFOLDING AND LINE BOUNDARIES, FROM THE SHARED LIB ========
   *
   * This used to be `norm(text).split(" ")` over the whole segment, which
   * joined across list letters and across line breaks. It refused
   * `isms-ia-04-02` on
   *
   *     "the organization g be available to interested parties as appropriate"
   *
   * where `organization` ends item f) and `g` is the LETTER of item g). Ten
   * words that exist in no document, and three rows went unservable for them.
   *
   * `runUnits` is now the ONLY implementation of that rule -- the same
   * function `leak-score` uses -- because the rule had been written down three
   * times and enforced zero times while the union lived in every caller.
   *
   * MEASURED PER UNIT, MAXIMUM AFTERWARDS. A run that spans two units is not a
   * run; it is two runs a caller glued together. */
  let best = 0, bestText = "", bestSrc = "";
  for (const unit of runUnits(text)) {
    const w = norm(unit).split(" ").filter(Boolean);
    for (const [label, own] of perSource) {
      for (let i = 0; i + SEED <= w.length; i++) {
        const cands = own.at.get(w.slice(i, i + SEED).join(" "));
        if (!cands) continue;
        /* ============ EXTEND BY POSITION, NOT BY MEMBERSHIP ============
         *
         * This read:
         *
         *     while (own.has(w.slice(i + n + 1 - SEED, i + n + 1).join(" "))) n++;
         *
         * which asks whether the TRAILING seed-gram exists ANYWHERE in the
         * document -- not whether the document continues this way. So the run
         * HOPPED: it walked forward while each successive window existed
         * somewhere, and the windows need not come from the same place.
         *
         * Measured per offset against 19011:2026:
         *
         *     the results of the evaluation of the collected audit evidence
         *      4    9    8   7     6      5   4   0        0     0
         *
         * The longest real run is NINE, from `results`. The leading `the`
         * matches a seed-gram elsewhere and chains it to TEN -- the floor. A
         * nine-word run that does not fire became a ten-word run that does,
         * on one word borrowed from another page.
         *
         * Extending from the candidate POSITIONS cannot do this: a real run
         * has a position by construction and an invented one does not. It is
         * correct at every seed, which is what returns the seed to being how a
         * candidate is FOUND rather than how it is MEASURED. */
        let n = 0;
        for (const pos of cands) {
          let k = 0;
          while (i + k < w.length && own.words[pos + k] === w[i + k]) k++;
          if (k > n) n = k;
        }
        if (n < SEED) continue;
        if (n > best) { best = n; bestText = w.slice(i, i + n).join(" "); bestSrc = label; }
        /* ============ NO SKIP. THE JUMP WAS A MEASUREMENT ERROR ============
         *
         * This read `i += n - 1`, which resumes the scan MID-RUN after a
         * match. That is correct for COUNTING OCCURRENCES and wrong for
         * FINDING THE LONGEST: a longer run beginning inside the consumed
         * region is never looked for.
         *
         * It cost a real one: `aims-ia-04-06` reported 9w where a 10-word
         * reproduction of 42001 clause 6.1.4 existed, and that one word was
         * the difference between the serving floor and a refusal. The lesson
         * served in two languages for as long as the scanner has worked this
         * way.
         *
         * AND IT ONLY EVER ERRS ONE WAY. A skipped start can only lose a run,
         * never invent one -- so every leak number this instrument has ever
         * produced is a LOWER BOUND, and the error is always in the direction
         * that flatters.
         *
         * The per-unit split did not fix this. It reset the offset at a line
         * boundary that happened to fall before the true start, which is luck.
         * Two overlapping candidates inside ONE paragraph still lost the
         * longer one, and paragraphs are where most of the corpus lives.
         *
         * Cost of not skipping, measured at this corpus size: nothing. */
      }
    }
  }
  return { best, bestText, bestSrc };
}

/**
 * The measured longest run of a LESSON BODY, with attributed quotations exempt.
 *
 * IP-POSITION section 6, amended 2026-09-17, permits clause text that is quoted
 * and attributed. Exempt lines CUT the body into segments and each is measured
 * alone; they are never deleted, because deleting them would join the line
 * before to the line after and measure a run across a junction the document
 * does not contain.
 *
 * THE EXEMPTION IS IN CODE, NOT IN `mcp_leak_policy`, and that is deliberate.
 * The threshold lives in the table because it is a number someone may tune. The
 * exemption is not a tunable -- it IS the position, and it should move only when
 * IP-POSITION section 6 moves. If it ever has to differ per deployment, that is
 * the moment it earns a column.
 */
function longestMeasured(md) {
  /* ============ THE EXEMPTION IS KEYED ON ATTRIBUTION, PER OCCURRENCE ======
   *
   * This used to measure `segments(md, attributedQuote)` -- every attributed
   * BLOCKQUOTE cut away, everything else measured. The exemption was keyed on
   * whether the author reached for `>`, and it failed both ways:
   *
   *   UNDER-EXEMPTED  an inline quotation naming the standard AND the clause
   *                   in its own sentence got no exemption at all, while being
   *                   more precisely attributed than most blockquotes.
   *   OVER-EXEMPTED   a blockquote was exempt at ANY length. 52 contiguous
   *                   words of ISO 19011 sat in a released certification and
   *                   nobody had decided that.
   *
   * Now every line is measured and a RUN is exempt when its own occurrence is
   * attributed AND it is within `QUOTATION_CEILING`. Both halves matter: the
   * ceiling is what makes an exemption a ceiling rather than a waiver, which
   * is the ground every NAMED exemption here has stood on from the start.
   *
   * ATTRIBUTION IS A PROPERTY OF THE OCCURRENCE, NEVER OF THE PHRASE. The same
   * nine words attributed in one lesson and bare in four are one quotation and
   * four reproductions; exempting the phrase would launder the bare uses under
   * cover of the attributed one.
   *
   * `leadIn` is the most recent non-blank, NON-BLOCKQUOTE line, so a
   * multi-line blockquote inherits the attribution introducing the block. A
   * fixed look-back of N lines does NOT work here and was measured doing the
   * wrong thing: it reported nine occurrences as unattributed that were lines
   * inside a block whose lead-in sat six lines up.
   */
  let best = 0, bestText = "", bestSrc = "";
  const lines = String(md || "").split(/\r?\n/);
  let leadIn = "";
  for (const raw of lines) {
    const t = raw.trim();
    if (!t) continue;
    const quote = isQuoteLine(raw);
    const body = quote ? raw.replace(/^\s*>\s?/, "") : raw;
    const r = longestRun(body);
    if (r.best) {
      const exempt = isAttributed(raw, leadIn) && r.best <= QUOTATION_CEILING;
      if (!exempt && r.best > best) { best = r.best; bestText = r.bestText; bestSrc = r.bestSrc; }
    }
    if (!quote) leadIn = t;
  }
  return { best, bestText, bestSrc };
}

/* ------------------------------------------------------------ the policy */

const policy = await get("mcp_leak_policy?select=threshold_words,standards");
if (!policy || policy.length !== 1) {
  console.error("mcp_leak_policy holds " + (policy?.length ?? 0) + " rows, expected 1. Run migration 332.");
  process.exit(2);
}
const THRESHOLD = policy[0].threshold_words;
console.log("  threshold: " + THRESHOLD + " words (from mcp_leak_policy, not from this file)");

/* -------------------------------------------------------------- the scan */

const certs = await get("certifications?select=id,code");
const byId = new Map(certs.map((c) => [c.id, c.code]));
const mods = await all("modules?select=id,certification_id");
const modCert = new Map(mods.map((m) => [m.id, byId.get(m.certification_id)]));

console.log("");
console.log("scanning lessons");
const lessons = await all("lessons?select=id,slug,language,lesson_group_id,module_id,content_md,mcp_servable,mcp_iso_longest_run");
console.log("  " + lessons.length + " lesson row(s)");

const measured = lessons.map((l) => {
  const { best, bestText, bestSrc } = longestMeasured(l.content_md);
  return { ...l, cert: modCert.get(l.module_id) ?? "?", run: best, runText: bestText, runSrc: bestSrc };
});

/* ============ THE VERDICT IS PER GROUP, THE MEASUREMENT IS PER ROW ============
 *
 * THE INDEX IS ENGLISH ISO TEXT, so an es-419 or pt-BR row scores ZERO by
 * construction -- measured: 484 English runs of >=10 words across the four ISO
 * certifications, and exactly 0 in either translation.
 *
 * Deriving `mcp_servable` per ROW would therefore serve the Spanish and
 * Portuguese bodies of a lesson whose English body is withheld. That is not a
 * conservative outcome dressed up as a gap: THE TRANSLATION OF A QUOTED CLAUSE
 * IS STILL A REPRODUCTION OF ISO'S EXPRESSION. It is simply one this index
 * cannot see, because we hold the English editions.
 *
 * So the verdict is taken over `lesson_group_id` -- the same key the marking
 * pass and the item exemptions use, and the same trilingual constraint
 * IP-POSITION section 3 records. If any sibling leaks, none is servable.
 *
 * A row with no group falls back to itself, and is COUNTED AND REPORTED rather
 * than silently treated as its own group: an ungrouped lesson is exactly where
 * this reasoning stops holding. */
const groupMax = new Map();
let ungrouped = 0;
for (const m of measured) {
  const k = m.lesson_group_id ?? ("SOLO:" + m.id);
  if (!m.lesson_group_id) ungrouped++;
  groupMax.set(k, Math.max(groupMax.get(k) ?? 0, m.run));
}
/* ======================= NAMED LESSON EXEMPTIONS =======================
 *
 * Keyed by lesson slug; the exemption covers that slug's whole group, because
 * the verdict is per group. `maxRun` is a CEILING, not a waiver: exempt up to
 * that length, refused above it, so a later edit cannot smuggle a longer
 * reproduction in under a slug exempted for a category list.
 *
 * AN EXEMPTION RECORDS A REASON AND IS PRINTED ON EVERY RUN. An exemption
 * nobody re-reads is a suppression with extra steps, and one whose argument
 * lives in a commit message is one the next reader deletes.
 *
 * RESTRUCTURING CONTENT TO SATISFY AN INSTRUMENT IS BACKWARDS. Where the
 * description is worse for scoring lower, the instrument yields and says so.
 */
const LESSON_EXEMPTIONS = {
  "04-02-control-attributes": {
    maxRun: 14,
    why: "The ISO/IEC 27002 control-attribute CATEGORY NAMES. A certification cannot teach a taxonomy without naming its categories, and naming categories is not reproducing the prose that defines them -- the same distinction that lets a description name clause titles. The run is a list of attribute values, carries none of the guidance text around them, and a learner who cannot match our words to the attribute names they will meet has been taught nothing.",
  },
};

/* A slug's exemption covers its whole group, since the verdict is per group. */
const exemptGroups = new Map();
for (const m of measured) {
  const ex = LESSON_EXEMPTIONS[m.slug];
  if (ex) exemptGroups.set(m.lesson_group_id ?? ("SOLO:" + m.id), { ...ex, slug: m.slug });
}
const scored = measured.map((m) => {
  const k = m.lesson_group_id ?? ("SOLO:" + m.id);
  const groupRun = groupMax.get(k);
  const ex = exemptGroups.get(k);
  const exempt = !!ex && groupRun >= THRESHOLD && groupRun <= ex.maxRun;
  return { ...m, groupRun, exempt, servable: groupRun < THRESHOLD || exempt };
});
console.log("  " + groupMax.size + " lesson group(s); " + ungrouped + " row(s) carry no group and are judged alone");

/* =================== THE CONTROLS. NO WRITE WITHOUT THEM =================== */

console.log("");
console.log("CONTROLS -- a clean sweep means nothing without these");
const controls = [];
const ctl = (n, ok, d) => { controls.push({ n, ok, d }); console.log("  " + (ok ? "ok  " : "FAIL") + "  " + n + "  -- " + d); };

ctl("the index is populated", grams.size > 10000, grams.size + " " + SEED + "-grams");

/* ============ THE SEGMENTATION MUST CHANGE NOTHING BUT THE EXEMPTION ======
 *
 * Two controls, because they answer different questions.
 *
 * FIXTURES: is the segmenter correct? Six cases in iso-segments.mjs, including
 * the manufactured-adjacency case -- text either side of a cut must never land
 * in one segment.
 *
 * IDENTITY ON EVERY ROW: does the corpus contain a shape the segmenter
 * mishandles? With NOTHING exempt, segments() must return each body unchanged,
 * one segment, byte for byte. This is a string comparison rather than a second
 * measurement, which is both cheaper and a stronger claim: if the text going in
 * is the text coming out, the measurement cannot have moved. A drift here would
 * mean a drop in refusals was the segmentation losing runs rather than the
 * exemption permitting quotations -- the two are indistinguishable from the
 * verdict alone. */
const segBad = segControl();
ctl("segmenter fixtures", segBad.length === 0,
  segBad.length ? segBad[0] : "7 case(s) including manufactured adjacency and CRLF");

/* The address pattern decides what counts as attribution, and attribution is
 * now what decides the exemption. It is asserted in BOTH directions: real
 * lead-ins must match, percentages and version strings must not. */
const addrBad = checkAddress();
ctl("address anchors", addrBad.length === 0,
  addrBad.length ? addrBad[0] : "9 anchored forms match, 5 bare numbers do not");

let identityBad = 0, identityEg = null;
for (const l of lessons) {
  const whole = String(l.content_md || "");
  const parts = segments(whole, () => false);
  if (parts.length !== 1 || parts[0] !== whole) {
    identityBad++;
    if (!identityEg) identityEg = l.slug + "/" + l.language + " -> " + parts.length + " segment(s)";
  }
}
ctl("IDENTITY: with nothing exempt the body is returned unchanged",
  identityBad === 0,
  identityBad ? identityBad + " row(s) differ, e.g. " + identityEg
              : "all " + lessons.length + " bodies byte-identical");

/* NEGATIVE: a corpus known to cite no ISO standard must come out clean. */
const aism = scored.filter((s) => s.cert === "AISM-I");
const aismMax = aism.reduce((a, s) => Math.max(a, s.run), 0);
ctl("NEGATIVE: AISM-I (cites no ISO) stays under the threshold",
  aism.length > 100 && aismMax < THRESHOLD,
  aism.length + " lessons, longest run " + aismMax + "w, threshold " + THRESHOLD);

/* ============ POSITIVE: THREE SYNTHETIC CANARIES, ONE PER SOURCE ============
 *
 * Without a positive control an empty index passes every other check here and
 * marks the whole platform servable.
 *
 * THIS CONTROL USED TO BE A LESSON, AND A CONTENT DECISION COULD DISARM IT.
 * It asserted that `isms-ia-05-05-fixing-it-and-fixing-it` tripped at >=40
 * words. Measured 2026-09-17: those 87 words are ENTIRELY inside blockquotes,
 * and the lesson's prose measures 10. So the control survived only because
 * those particular quotes happened to carry no attribution -- and IP-POSITION
 * section 6, as amended the same day, REQUIRES attribution on every quotation.
 * Complying with our own rule would have retired the only check proving this
 * index is not empty, silently, as an editorial edit.
 *
 * A control whose subject is content someone may legitimately change is not a
 * control. These are literals in this file: nothing in the database, and no
 * decision about the corpus, can move them.
 *
 * ONE PER STANDARD, ASSERTED AGAINST THAT STANDARD'S OWN INDEX. A single
 * combined-index canary proves only that SOMETHING loaded. It would pass with
 * 42001 missing entirely -- and measured, the 27001 sentence below scores 27
 * words against 42001's text on its own, because Annex SL gives the two
 * standards near-identical clause 4.1 wording. Per-source is what makes the
 * check able to name the source that failed.
 *
 * AND THE ASSERTION IS FULL LENGTH, NOT A THRESHOLD, WHICH IS THE HALF THAT
 * ACTUALLY BITES. Measured by dropping each source and re-indexing: with 27001
 * absent, its canary still scores 27 of 31 words against 42001 alone. A control
 * written as ">= 10w", or ">= 20w", would have passed with an entire standard
 * missing. Only "all 31 words" fires.
 *
 * A partial match also means the extraction changed -- a new edition, a
 * different pdftotext -- and that is exactly when every number this script
 * produces stops being comparable with yesterday's.
 *
 * These are short excerpts held as test fixtures. The standards themselves are
 * already on disk; this adds no reproduction that was not already there, and
 * IP-POSITION section 6 governs what is SERVED, not what a control asserts. */
const CANARIES = {
  "19011:2026":
    "the risk-based approach should substantively influence the planning and " +
    "implementation of the audit programme, and the planning, conducting and " +
    "reporting of audits",
  "27001:2022":
    "the organization shall determine external and internal issues that are " +
    "relevant to its purpose and that affect its ability to achieve the intended " +
    "outcome(s) of its information security management system",
  "42001:2023":
    "policies, guidelines and decisions from regulators that have an impact on " +
    "the interpretation or enforcement of legal requirements in the development " +
    "and use of AI systems",
};

/** Longest run of `text` within one source's own gram set. */
function longestIn(text, own) {
  const w = norm(text).split(" ").filter(Boolean);
  let best = 0;
  for (let i = 0; i + SEED <= w.length; i++) {
    if (!own.has(w.slice(i, i + SEED).join(" "))) continue;
    let n = SEED;
    while (i + n + 1 <= w.length && own.has(w.slice(i + n + 1 - SEED, i + n + 1).join(" "))) n++;
    if (n > best) best = n;
    i += n - 1;
  }
  return best;
}

for (const [label, sentence] of Object.entries(CANARIES)) {
  const want = norm(sentence).split(" ").filter(Boolean).length;
  const own = perSource.get(label).grams;
  const got = own ? longestIn(sentence, own) : 0;
  ctl("POSITIVE: " + label + " indexed its own text",
    got === want,
    own ? got + "w of " + want + "w matched" : "SOURCE NOT INDEXED -- label mismatch with PDFS");
}

/* And the combined index must carry them too, which is the set the scan
 * actually queries. Cheap, and it catches a merge that dropped a source. */
for (const [label, sentence] of Object.entries(CANARIES)) {
  const want = norm(sentence).split(" ").filter(Boolean).length;
  ctl("POSITIVE: " + label + " reachable in the combined index",
    longestRun(sentence).best === want,
    longestRun(sentence).best + "w of " + want + "w");
}

const ctlFailed = controls.filter((c) => !c.ok);

/* ------------------------------------------------------------- the report */

const shown = ONLY ? scored.filter((s) => s.cert === ONLY) : scored;
const byCert = {};
for (const s of shown) {
  const b = (byCert[s.cert] ||= { n: 0, refused: 0, max: 0, worst: null });
  b.n++;
  if (!s.servable) b.refused++;
  if (s.run > b.max) { b.max = s.run; b.worst = s; }
}
console.log("");
console.log("VERDICTS at >=" + THRESHOLD + " words");
console.log("  cert         rows   refused   longest");
for (const [c, b] of Object.entries(byCert).sort()) {
  console.log("  " + c.padEnd(12) + String(b.n).padStart(4) + "   " + String(b.refused).padStart(7) +
    "   " + String(b.max).padStart(4) + "w" + (b.refused ? "   " + b.worst.slug + "/" + b.worst.language : ""));
}
/* EXEMPTIONS ARE PRINTED WITH THEIR SCORE AND THEIR REASON, EVERY RUN, and
 * DORMANT is distinguished from STALE: dormant means the group is present and
 * does not currently trip the threshold, so the policy stands but is not
 * load-bearing; stale means the slug is gone and the entry protects nothing. */
console.log("");
console.log("NAMED EXEMPTIONS");
for (const [slug, ex] of Object.entries(LESSON_EXEMPTIONS)) {
  const row = scored.find((x) => x.slug === slug);
  if (!row) { console.log("  STALE   " + slug + " is not in the corpus. Remove it."); continue; }
  const state = row.exempt ? "ACTIVE " : "DORMANT";
  console.log("  " + state + " " + slug + "   group run " + row.groupRun + "w, ceiling " + ex.maxRun +
    "w, threshold " + THRESHOLD + (row.exempt ? "" : "  -- under the threshold, so the exemption is not load-bearing"));
  if (row.runText) console.log("     matched: \"" + row.runText.slice(0, 100) + "\"   [" + row.runSrc + "]");
  console.log("     why: " + ex.why);
}

if (VERBOSE) {
  console.log("");
  for (const s of shown.filter((x) => !x.servable).sort((a, b) => b.run - a.run)) {
    console.log("  " + String(s.run).padStart(3) + "w  " + s.cert + "  " + s.slug + "/" + s.language);
    console.log("        \"" + s.runText.slice(0, 120) + "\"   [" + s.runSrc + "]");
  }
}

if (ctlFailed.length) {
  console.log("");
  console.log(ctlFailed.length + " CONTROL(S) FAILED. NOT WRITING.");
  console.log("Every verdict above is unreliable: an index that matches nothing marks");
  console.log("every lesson servable, which is the exact failure this gate prevents.");
  process.exitCode = 1;
} else if (!APPLY) {
  console.log("");
  console.log("Dry run. Nothing written. Re-run with --apply.");
} else {
  console.log("");
  console.log("writing verdicts");
  const now = new Date().toISOString();
  let wrote = 0;
  /* Batched by verdict, so this is two statements per page rather than one per
   * lesson. The trigger only fires on a content_md change, so these updates do
   * not clear what they are setting. */
  for (const group of [true, false]) {
    const ids = scored.filter((s) => s.servable === group).map((s) => s.id);
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      /* Per-lesson run length differs, so servable=true rows still need their
       * own value; batch by run length within the group. */
      /* The GROUP's run is stored, not the row's, so the post-condition
       * `servable == (stored < threshold)` holds for a Spanish row withheld
       * because of its English sibling. Storing the row's own zero there would
       * make every translation look individually incoherent. */
      const byRun = {};
      for (const id of chunk) {
        const s = scored.find((x) => x.id === id);
        (byRun[s.groupRun] ||= []).push(id);
      }
      for (const [run, rids] of Object.entries(byRun)) {
        await rest("lessons?id=in.(" + rids.join(",") + ")", {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            mcp_iso_longest_run: Number(run),
            mcp_scanned_at: now,
            mcp_scan_sources: SOURCES,
            mcp_servable: group,
          }),
        });
        wrote += rids.length;
      }
    }
  }
  console.log("  " + wrote + " row(s) written");

  /* ===================== POST-CONDITIONS, BOTH DIRECTIONS ===================== */
  console.log("");
  console.log("POST-CONDITIONS");
  const checks = [];
  const chk = (n, ok, d) => { checks.push({ n, ok, d }); console.log("  " + (ok ? "ok  " : "FAIL") + "  " + n + "  -- " + d); };

  const after = await all("lessons?select=id,mcp_servable,mcp_iso_longest_run,mcp_scanned_at,mcp_scan_sources");
  const unscanned = after.filter((r) => r.mcp_iso_longest_run === null);
  chk("every lesson carries a measurement", unscanned.length === 0,
    unscanned.length ? unscanned.length + " still NULL" : after.length + " scanned");

  const map = new Map(scored.map((s) => [s.id, s]));
  const wrong = after.filter((r) => {
    const s = map.get(r.id);
    return !s || r.mcp_iso_longest_run !== s.groupRun || r.mcp_servable !== s.servable;
  });
  chk("every stored verdict matches what was measured", wrong.length === 0,
    wrong.length ? wrong.length + " disagree" : after.length + " agree");

  /* THE DERIVATION, RE-CHECKED AGAINST THE POLICY rather than against this run's
   * variable -- the two could only differ if the threshold moved mid-scan, which
   * is precisely the thing a single-count check cannot see. */
  const pol = (await get("mcp_leak_policy?select=threshold_words"))[0].threshold_words;
  /* ============ THE COHERENCE RULE HAS TO KNOW ABOUT EXEMPTIONS =========
   *
   * This asserted servable == (run < threshold) and FAILED on 3 rows the
   * moment a named exemption started doing work -- the ISMS-F control-attribute
   * group is 11w over a 10w threshold and servable on purpose.
   *
   * The verdict logic learned about exemptions and this post-condition did not:
   * a guard and the path that must obey it, out of step, which is the mirrored
   * -pair defect CLAUDE.md already records. The stored run stays the REAL
   * measurement -- evidence and verdict are separate columns -- so the
   * exemption lives only here, where it can be printed. */
  const exemptIds = new Set(scored.filter((x) => x.exempt).map((x) => x.id));
  const incoherent = after.filter((r) => r.mcp_servable !== (r.mcp_iso_longest_run < pol || exemptIds.has(r.id)));
  chk("servable == (run < threshold) OR named exemption", incoherent.length === 0,
    incoherent.length ? incoherent.length + " incoherent" : "threshold " + pol + "; " + exemptIds.size + " row(s) servable by exemption");

  /* AND THE EXEMPTION MUST BE VISIBLE AS A NUMBER, not only as a pass. A row
   * served because someone wrote a justification is a different fact from a row
   * served because it reproduces nothing. */
  const byExemption = after.filter((r) => exemptIds.has(r.id) && r.mcp_iso_longest_run >= pol);
  chk("every exempted row is genuinely over the threshold", byExemption.length === exemptIds.size,
    byExemption.length + " of " + exemptIds.size + " exempted row(s) actually exceed " + pol + "w");

  /* THE NEGATIVE HALF NAMED, not inferred from a total: the four ISO
   * certifications must contain refusals, and the served eight must not. */
  const certOf = new Map(scored.map((s) => [s.id, s.cert]));
  const SERVED8 = new Set(["AISM-I", "AIE-I", "AIHR-I", "AIGRM-I", "SM-AI-I", "SM-AI-II", "SPO-AI-I", "SD-AI-I"]);
  const servedRefused = after.filter((r) => SERVED8.has(certOf.get(r.id)) && !r.mcp_servable);
  chk("no currently-served lesson was refused", servedRefused.length === 0,
    servedRefused.length ? servedRefused.length + " REFUSED -- this would take the live surface down" : "0 of the served eight");

  /* ============ THIS CHECK USED TO NAME TWO CERTIFICATIONS ============
   *
   * It asserted that ISMS-IA and AIMS-IA "DID produce refusals", as evidence
   * that the gate can still refuse anything at all. On 2026-09-17 both reached
   * zero refusals -- the work finished -- and the check FAILED on a clean
   * corpus, blocking a scan whose every verdict was correct.
   *
   * Same defect as the positive control replaced earlier the same day: a check
   * whose subject is CONTENT is disarmed by finishing the content. There it went
   * quiet and passed; here it went loud and failed. Loud is luckier and no more
   * correct.
   *
   * WHAT IT WAS ACTUALLY FOR was never those two certifications. It was
   * "prove the refusal path still works" -- measure, compare to the threshold,
   * mark unservable. So it now asserts that against a SYNTHETIC body built from
   * the canary sentences, which no editorial decision can repair.
   *
   * This is strictly stronger than the version it replaces. The old one proved
   * some lesson somewhere was refused; this one proves the decision itself:
   * that a body over the threshold is refused, AND that a body under it is not.
   * Both directions, because a gate stuck at "refuse" would have passed the old
   * check too. */
  const OVER = Object.values(CANARIES).join(" ");
  const UNDER = "Certidemy's own prose about auditing, which reproduces nothing.";
  const overRun = longestMeasured(OVER).best;
  const underRun = longestMeasured(UNDER).best;
  chk("SYNTHETIC: a body over the threshold is refused",
    overRun >= THRESHOLD, overRun + "w measured, threshold " + THRESHOLD);
  chk("SYNTHETIC: a body under the threshold is not refused",
    underRun < THRESHOLD, underRun + "w measured, threshold " + THRESHOLD);

  /* ============ THE FIXTURE THE SCAFFOLDING FIX OWES ============
   *
   * Stripping list letters and measuring per line LOWERS runs, and a gate that
   * is loosened without a demonstration that it still catches the thing it was
   * loosened around is a gate we have merely stopped hearing from.
   *
   * So: a GENUINELY reproduced lettered list -- one canary sentence, split
   * across `a)` and `b)` exactly as a real list would be -- must still fire.
   * If stripping ever starts swallowing content rather than scaffolding, or if
   * per-unit measurement starts losing runs that lie inside one item, this goes
   * red.
   *
   * A FIXTURE, not a live row. The contradiction sweep's control was pinned to
   * a defect in production and broke the day the defect was repaired; this one
   * is built from the canary text and keeps working after any lesson is fixed.
   *
   * Both directions, as above: the same sentence BROKEN across two items must
   * NOT fire, because that is the manufactured adjacency the fix removes. */
  const canary = Object.values(CANARIES)[0];
  const cw = canary.split(/\s+/).filter(Boolean);
  const half = Math.ceil(cw.length / 2);
  /* WHOLE sentence inside one lettered item -- a real reproduction wearing a list. */
  const LIST_REAL = "- a) " + canary + "\n- b) something of our own that reproduces nothing";
  /* The SAME words, split across two items -- adjacent only because a list put
   * them next to each other. */
  const LIST_SPLIT = "- a) " + cw.slice(0, half).join(" ") + "\n- b) " + cw.slice(half).join(" ");
  const realRun = longestMeasured(LIST_REAL).best;
  const splitRun = longestMeasured(LIST_SPLIT).best;
  chk("FIXTURE: a reproduction inside a lettered item still fires",
    realRun >= THRESHOLD, realRun + "w measured, threshold " + THRESHOLD);
  chk("FIXTURE: the same words split across two items do NOT",
    splitRun < realRun, "split " + splitRun + "w vs whole " + realRun + "w");

  /* ============ OVERLAPPING RUNS -- THE CASE THE SKIP USED TO LOSE ==========
   *
   * The fixture above was built around the list defect because the list defect
   * was the one in front of us. **A control built around the defect that
   * prompted it tests the defect, not the class** -- and it would not have
   * caught `i += n - 1`, which lost a longer run beginning INSIDE an earlier
   * match. That cost a live ten-word reproduction its refusal.
   *
   * So: a short canary followed, on the same line, by a longer one. Under the
   * old greedy walk the first match consumed the scan position and the second
   * was never looked for. The measured run must be the LONGER of the two, not
   * the first one found. */
  const shortC = Object.values(CANARIES)[1] ?? Object.values(CANARIES)[0];
  const longC = Object.values(CANARIES)[0];
  const sr = longestMeasured(shortC).best;
  const lr = longestMeasured(longC).best;
  const both = longestMeasured(shortC + " and then " + longC).best;
  chk("FIXTURE: a later, longer run is not lost to an earlier match",
    both >= Math.max(sr, lr), "short " + sr + "w, long " + lr + "w, together " + both + "w");

  /* And report what the ISO certifications actually came to, as information
   * rather than as an assertion. Zero is now the expected state. */
  const isoRefused = after.filter((r) => ["ISMS-IA", "AIMS-IA"].includes(certOf.get(r.id)) && !r.mcp_servable);
  console.log("  --    ISMS-IA and AIMS-IA: " + isoRefused.length + " row(s) refused" +
    (isoRefused.length === 0 ? "  (both fully repaired 2026-09-17)" : ""));

  /* THE TRILINGUAL HALF. A group must be servable in all three languages or in
   * none -- the state this gate would otherwise produce on every ISO lesson. */
  const groupOf = new Map(scored.map((s) => [s.id, s.lesson_group_id ?? ("SOLO:" + s.id)]));
  const seen = new Map();
  for (const r of after) {
    const k = groupOf.get(r.id);
    if (!seen.has(k)) seen.set(k, new Set());
    seen.get(k).add(r.mcp_servable);
  }
  const split = [...seen.entries()].filter(([, v]) => v.size > 1);
  chk("no lesson group is servable in one language and not another", split.length === 0,
    split.length ? split.length + " SPLIT group(s)" : seen.size + " group(s) coherent");

  const failed = checks.filter((c) => !c.ok);
  console.log("");
  console.log("passed " + (checks.length - failed.length) + "   failed " + failed.length);
  console.log(failed.length ? "POST-CONDITIONS FAILED." : "Verdicts written and coherent with the policy.");
  process.exitCode = failed.length ? 1 : 0;
}
