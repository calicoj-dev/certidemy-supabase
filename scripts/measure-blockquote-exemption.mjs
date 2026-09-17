#!/usr/bin/env node
/**
 * measure-blockquote-exemption.mjs - what would exempting attributed
 * blockquotes actually change?
 *
 * READ-ONLY. --cert, --json, --verbose. Unknown flags exit 2. No --apply.
 *
 * ============ THE QUESTION ============
 *
 * IP-POSITION section 6 now permits attributed quotation over the MCP. The
 * scanner cannot currently express that: `longestRun` normalises the WHOLE
 * content_md into one word stream, and `norm()` turns `>` into a space, so the
 * blockquote marker is destroyed before anything is measured.
 *
 * Exempting blockquotes therefore means SEGMENTING the document. This script
 * measures the segmented world without writing anything, so the cost of the
 * change is known before the change is made.
 *
 * ============ CUT, DO NOT DELETE ============
 *
 * Deleting the exempt lines from the stream would make the line BEFORE and the
 * line AFTER adjacent, and a run could then be measured across a junction that
 * does not exist in the document. That is the same manufactured-adjacency
 * defect as the GROUP BY over a nullable key and the join fan-out: the query
 * inventing a neighbour relation the data does not have.
 *
 * So exempt lines CUT the stream into segments and each segment is measured on
 * its own. Non-exempt lines still join across line breaks exactly as today, so
 * a run that legitimately spans a paragraph break is still found. The ONLY
 * behaviour that changes is that blockquote text is no longer measured.
 *
 * The control below proves that: with the exempt set EMPTY, segmented
 * measurement must reproduce the current whole-document number on every row.
 * If it does not, the segmentation changed something it was not meant to.
 *
 * ============ ATTRIBUTED, NOT MERELY SET OFF ============
 *
 * The decision permits an ATTRIBUTED quotation. A blockquote with no
 * attribution is still a reproduction, so the predicate is two-part and the
 * second part is the one that can go wrong quietly.
 *
 * `guide-runs.mjs` carries the warning that matters here: its `ATTRIB_RE` is
 * English-only, and asking it about a translated line returned null on a
 * correctly attributed row -- 54 trilingual violations that did not exist. An
 * attribution test that works in English and not in Spanish would refuse the
 * translations of lessons whose English serves, and scan-iso-leaks
 * post-condition 6 (no group servable in one language and not another) would
 * FAIL rather than quietly diverge.
 *
 * So this script reports attribution detection PER LANGUAGE and treats any
 * language disagreement inside a lesson group as the finding.
 */
import { readFileSync, existsSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, sourcesAvailable } from "./lib/citation-index.mjs";

const KNOWN = new Set(["--cert", "--json", "--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". READ-ONLY. Known: " + [...KNOWN].join(", "));
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const CERT = arg("cert", "ISMS-IA");
const JSON_OUT = arg("json", "");
const VERBOSE = process.argv.includes("--verbose");

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
const H = { apikey: KEY, Authorization: "Bearer " + KEY };
async function g(p) {
  let last;
  for (let i = 0; i < 12; i++) {
    try {
      const r = await fetch(BASE + "/" + p, { headers: H, signal: AbortSignal.timeout(60000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 160));
      return JSON.parse(t);
    } catch (e) { last = e; }
  }
  throw last;
}

/* Identical to scan-iso-leaks.mjs. Lifted, not re-invented: a second
 * normaliser that disagreed by one character would make every number here
 * incomparable with the scanner's. */
const norm = (s) => String(s || "").toLowerCase()
  .replace(/[‘’]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
const SEED = 5;

function pdfText(p) {
  const o = join(mkdtempSync(join(tmpdir(), "iso-")), "t.txt");
  execFileSync("pdftotext", ["-layout", p, o]);
  return readFileSync(o, "utf8");
}
if (!sourcesAvailable()) { console.error("standards not on disk"); process.exit(2); }
const grams = new Set();
for (const p of Object.values(PDFS)) {
  const w = norm(pdfText(p)).split(" ").filter(Boolean);
  for (let i = 0; i + SEED <= w.length; i++) grams.add(w.slice(i, i + SEED).join(" "));
}

function longestOf(text) {
  const w = norm(text).split(" ").filter(Boolean);
  let best = 0, bestText = "";
  for (let i = 0; i + SEED <= w.length; i++) {
    if (!grams.has(w.slice(i, i + SEED).join(" "))) continue;
    let n = SEED;
    while (i + n + 1 <= w.length && grams.has(w.slice(i + n + 1 - SEED, i + n + 1).join(" "))) n++;
    if (n > best) { best = n; bestText = w.slice(i, i + n).join(" "); }
    i += n - 1;
  }
  return { best, bestText };
}

/* ============ THE EXEMPTION PREDICATE ============
 *
 * Two parts. A line is exempt when it is a blockquote AND an ISO address is
 * visible on it or in its lead-in.
 *
 * THE ADDRESS IS THE PART THAT TRAVELS BETWEEN LANGUAGES. `ISO/IEC 27001:2022`
 * and `9.2.2` are written identically in English, Spanish and Portuguese; only
 * the word `clause` / `clausula` / `secao` changes, and the pattern does not
 * depend on it. That is why this is tractable where the Scrum Guide
 * attribution was not -- there the attribution was a TITLE that translates,
 * here it is a DESIGNATION that does not. */
const STANDARD_RE = /\bISO(?:\/IEC)?\s*\d{4,5}\b/i;
const ADDRESS_RE = /(\b\d+\.\d+(\.\d+)?\b|\bannex(e)?\s+[a-z]\b|\banexo\s+[a-z]\b|\btable\s+a\.\d|\btabela\s+a\.\d|\btabla\s+a\.\d)/i;
const attributed = (line, leadIn) => {
  const hay = String(line) + " ¶ " + String(leadIn || "");
  return STANDARD_RE.test(hay) || ADDRESS_RE.test(hay);
};

/** Split raw content_md into segments, cutting at exempt lines. */
function segments(md, isExempt) {
  const lines = String(md || "").split(/\r?\n/);
  const out = [];
  let cur = [];
  let lastNonQuote = "";
  for (const raw of lines) {
    const t = raw.trim();
    if (t.startsWith(">")) {
      if (isExempt(raw, lastNonQuote)) {
        if (cur.length) { out.push(cur.join("\n")); cur = []; }   // CUT, not delete
        continue;
      }
    } else if (t) {
      lastNonQuote = t;
    }
    cur.push(raw);
  }
  if (cur.length) out.push(cur.join("\n"));
  return out;
}

function longestSegmented(md, isExempt) {
  let best = 0, bestText = "";
  for (const seg of segments(md, isExempt)) {
    const r = longestOf(seg);
    if (r.best > best) { best = r.best; bestText = r.bestText; }
  }
  return { best, bestText };
}

/* ------------------------------------------------------------- the rows */
const certs = await g("certifications?select=id,code");
const id = certs.find((c) => c.code === CERT)?.id;
if (!id) { console.error("no certification " + CERT); process.exit(2); }
const mods = await g("modules?select=id&certification_id=eq." + id);
const rows = await g("lessons?select=id,slug,language,lesson_group_id,content_md,mcp_servable,mcp_iso_longest_run&module_id=in.(" +
  mods.map((m) => m.id).join(",") + ")&limit=2000");

const THRESHOLD = (await g("mcp_leak_policy?select=threshold_words"))[0].threshold_words;

console.log("");
console.log(CERT + ": what exempting ATTRIBUTED blockquotes would change");
console.log("  " + rows.length + " lesson row(s), threshold " + THRESHOLD + " words");
console.log("");

/* ============ CONTROL: the exemption must be the only thing that changes ==
 *
 * With an empty exempt set, segmented measurement has to reproduce the
 * whole-document number on EVERY row. A green run here is what licenses
 * reading the numbers below; without it, a drop in refusals could just as
 * easily be the segmentation losing runs that span paragraph breaks. */
let controlBad = 0, controlWorst = null;
for (const r of rows) {
  const whole = longestOf(r.content_md).best;
  const seg = longestSegmented(r.content_md, () => false).best;
  if (whole !== seg) {
    controlBad++;
    if (!controlWorst) controlWorst = r.slug + "/" + r.language + " " + whole + " vs " + seg;
  }
}
console.log("CONTROL -- segmentation with nothing exempt must equal today's measurement");
if (controlBad === 0) {
  console.log("  ok    all " + rows.length + " rows identical");
} else {
  console.log("  FAIL  " + controlBad + " row(s) differ, e.g. " + controlWorst);
  console.log("  The segmentation itself changes measurements. Nothing below is trustworthy.");
  process.exit(1);
}

/* A second control, the other direction: this script must reproduce the STORED
 * numbers, or the comparison below is against the wrong baseline.
 *
 * THE STORED COLUMN IS THE GROUP MAXIMUM, NOT THE ROW'S OWN RUN, and reading it
 * as per-row reported 70 false disagreements on the first attempt here. The
 * index is English ISO text, so an es-419 or pt-BR row measures ZERO by
 * construction; the scanner takes the verdict over `lesson_group_id` and writes
 * that group's number onto every sibling. A per-row comparison therefore
 * "disagrees" on exactly the translations of every leaking group.
 *
 * Same family as the GROUP BY over a nullable key: a number correct at the
 * grain it was taken, read at a grain it does not describe. */
const rowRun = new Map(rows.map((r) => [r.id, longestOf(r.content_md).best]));
const groupKey = (r) => r.lesson_group_id ?? "SOLO:" + r.id;
const groupNow = new Map();
for (const r of rows) {
  const k = groupKey(r);
  groupNow.set(k, Math.max(groupNow.get(k) ?? 0, rowRun.get(r.id)));
}
let driftBad = 0, driftEg = null;
for (const r of rows) {
  if (r.mcp_iso_longest_run == null) continue;
  const expect = groupNow.get(groupKey(r));
  if (expect !== r.mcp_iso_longest_run) {
    driftBad++;
    if (!driftEg) driftEg = r.slug + "/" + r.language + " stored " + r.mcp_iso_longest_run + ", group max " + expect;
  }
}
console.log(driftBad === 0
  ? "  ok    stored mcp_iso_longest_run equals the group maximum on every row"
  : "  FAIL  " + driftBad + " row(s) disagree, e.g. " + driftEg + " -- re-run the scanner first");
if (driftBad) process.exit(1);
console.log("");

/* ---------------------------------------------------- blockquote census */
let bqTotal = 0, bqAttributed = 0, bqBare = 0;
const bare = [];
for (const r of rows) {
  const lines = String(r.content_md || "").split(/\r?\n/);
  let lastNonQuote = "";
  for (const raw of lines) {
    const t = raw.trim();
    if (!t.startsWith(">")) { if (t) lastNonQuote = t; continue; }
    if (longestOf(raw).best < THRESHOLD) continue;   // only quotes that actually carry a run
    bqTotal++;
    if (attributed(raw, lastNonQuote)) bqAttributed++;
    else { bqBare++; bare.push({ slug: r.slug, language: r.language, lead_in: lastNonQuote.slice(0, 90), quote: t.slice(0, 110) }); }
  }
}
console.log("BLOCKQUOTE LINES CARRYING A RUN OF " + THRESHOLD + "+ WORDS");
console.log("  total         " + String(bqTotal).padStart(4));
console.log("  attributed    " + String(bqAttributed).padStart(4) + "   an ISO designation or clause address on the line or its lead-in");
console.log("  BARE          " + String(bqBare).padStart(4) + "   no address -- these stay refused under the amended position");
console.log("");

/* -------------------------------------------- what the exemption unlocks */
/* PER GROUP, exactly as the scanner does it. Judging per row here would report
 * every translation of a still-leaking lesson as servable, because the index
 * cannot see translated ISO text -- which is the precise mistake the scanner's
 * own comment at line 196 exists to prevent. */
const after = new Map();
for (const r of rows) after.set(r.id, longestSegmented(r.content_md, attributed));
const groupThen = new Map();
for (const r of rows) {
  const k = groupKey(r);
  groupThen.set(k, Math.max(groupThen.get(k) ?? 0, after.get(r.id).best));
}
const servableThen = (r) => groupThen.get(groupKey(r)) < THRESHOLD;

/* SCENARIO C, THE UPPER BOUND. Exempt EVERY blockquote, attributed or not.
 * The gap between B and C is not prose at all -- it is the 19 bare quotes, and
 * closing it is an editorial change (add the clause address to a lead-in), not
 * a rewording of anything. Reporting B alone would present cheap work as
 * expensive. */
const afterAll = new Map();
for (const r of rows) afterAll.set(r.id, longestSegmented(r.content_md, () => true));
const groupAll = new Map();
for (const r of rows) {
  const k = groupKey(r);
  groupAll.set(k, Math.max(groupAll.get(k) ?? 0, afterAll.get(r.id).best));
}
const servableAll = (r) => groupAll.get(groupKey(r)) < THRESHOLD;

const now = rows.filter((r) => r.mcp_servable).length;
const then = rows.filter(servableThen).length;
const allq = rows.filter(servableAll).length;
const L3 = (n) => String(n).padStart(3) + " / " + rows.length + "   (" + (n / 3) + " lessons)";

console.log("ROWS SERVABLE");
console.log("  A  today, no exemption                " + L3(now));
console.log("  B  attributed blockquotes exempt      " + L3(then));
console.log("  C  EVERY blockquote exempt            " + L3(allq));
console.log("");
console.log("  B -> C is not prose. It is the " + bqBare + " bare quotes: adding a clause");
console.log("  address to their lead-in is editorial, and buys " + ((allq - then) / 3) + " more lesson(s).");
console.log("");

/* THE CANARY. scan-iso-leaks' positive control asserts that
 * isms-ia-05-05-fixing-it-and-fixing-it/en trips at >=40 words. It is the only
 * thing in that script proving the index is not empty.
 *
 * Under scenario C that lesson measures below the threshold, because its 87
 * words are ENTIRELY inside blockquotes. So the exemption retires the
 * scanner's positive control, and a control that cannot fire is worth nothing
 * -- the whole reason it exists. */
const canaryRow = rows.find((r) => r.slug === "isms-ia-05-05-fixing-it-and-fixing-it" && r.language === "en");
if (canaryRow) {
  console.log("CANARY -- scan-iso-leaks' positive control (must trip at >=40w)");
  console.log("  today " + String(rowRun.get(canaryRow.id)).padStart(3) + "w" +
              "   scenario B " + String(after.get(canaryRow.id).best).padStart(3) + "w" +
              "   scenario C " + String(afterAll.get(canaryRow.id).best).padStart(3) + "w");
  if (afterAll.get(canaryRow.id).best < 40) {
    console.log("  WARNING: under C this lesson no longer trips 40w. The positive control");
    console.log("  must move to a corpus nobody is going to repair, or the scanner keeps a");
    console.log("  control that cannot fire -- which is the defect it was written to prevent.");
  }
  console.log("");
}

/* ---------------------------------------- what is left to repair by hand */
const stillRefused = rows.filter((r) => !servableThen(r) && r.language === "en");
const byLesson = new Map();
for (const r of stillRefused) {
  const k = r.slug.replace(/^.*?-(\d\d-\d\d)/, "$1");
  if (!byLesson.has(r.slug)) byLesson.set(r.slug, after.get(r.id));
}
console.log("STILL REFUSED AFTER THE EXEMPTION -- prose runs, repairable only by rewording");
console.log("  " + stillRefused.length + " row(s), " + new Set(stillRefused.map((r) => r.slug)).size + " distinct lesson slug(s)");
const sorted = [...byLesson.entries()].sort((a, b) => b[1].best - a[1].best);
for (const [slug, v] of sorted.slice(0, 20)) {
  console.log("    " + String(v.best).padStart(3) + "w  " + slug);
  if (VERBOSE) console.log("          " + v.bestText.slice(0, 120));
}
if (sorted.length > 20) console.log("    ... and " + (sorted.length - 20) + " more");
console.log("");

/* =========== THE LANGUAGE-DISAGREEMENT CHECK, WHICH IS THE REAL RISK =====
 *
 * scan-iso-leaks post-condition 6 requires every lesson group to be servable
 * in all three languages or none. If the attribution predicate fires in
 * English and not in Spanish, the English row passes, the translations do not,
 * and the SCANNER ABORTS -- a hard failure, not a quiet divergence. */
const groups = new Map();
for (const r of rows) {
  if (!r.lesson_group_id) continue;
  const g0 = groups.get(r.lesson_group_id) ?? [];
  g0.push({ language: r.language, ok: servableThen(r), slug: r.slug });
  groups.set(r.lesson_group_id, g0);
}
const incoherent = [];
for (const [gid, members] of groups) {
  const yes = members.filter((m) => m.ok).length;
  if (yes !== 0 && yes !== members.length) incoherent.push({ gid, members });
}
console.log("LANGUAGE COHERENCE under the exemption (scan-iso-leaks post-condition 6)");
if (incoherent.length === 0) {
  console.log("  ok    all " + groups.size + " group(s) agree across languages");
} else {
  console.log("  FAIL  " + incoherent.length + " group(s) servable in one language and not another:");
  for (const x of incoherent.slice(0, 10)) {
    console.log("    " + x.members[0].slug);
    for (const m of x.members) console.log("        " + m.language.padEnd(7) + (m.ok ? "servable" : "REFUSED"));
  }
  if (incoherent.length > 10) console.log("    ... and " + (incoherent.length - 10) + " more");
}
console.log("");

if (bare.length) {
  console.log("BARE BLOCKQUOTES -- carry a run and no address, so they are NOT exempt");
  for (const b of bare.slice(0, 12)) {
    console.log("  " + b.slug + "/" + b.language);
    console.log("    lead-in: " + (b.lead_in || "(none)"));
    console.log("    quote  : " + b.quote);
  }
  if (bare.length > 12) console.log("  ... and " + (bare.length - 12) + " more");
  console.log("");
}

if (JSON_OUT) {
  writeFileSync(JSON_OUT, JSON.stringify({
    cert: CERT, threshold: THRESHOLD,
    blockquotes: { total: bqTotal, attributed: bqAttributed, bare: bqBare },
    servable: { today: now, exempted: then, of: rows.length },
    still_refused: sorted.map(([slug, v]) => ({ slug, words: v.best, text: v.bestText })),
    incoherent_groups: incoherent.length,
    bare,
  }, null, 1) + "\n");
  console.log("wrote " + JSON_OUT);
}
