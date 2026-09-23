#!/usr/bin/env node
/**
 * score-lesson-bodies.mjs -- score named English lesson bodies per unit and
 * print every fire with its attributed source and enough context to draft
 * against.
 *
 * READ-ONLY. Takes --slug <s> (repeatable), --cert <CODE>, --verbose.
 * Unknown flags exit 2.
 *
 * This exists because the repair queue was driven off a SPAN LIST, and a span
 * list is a worklist rather than a coverage claim. The unit scorer reads the
 * whole body, so a reproduction three paragraphs from a reviewed span is
 * visible here and was not visible there.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSources, score, runUnits, firesUnion, firesRatio, firesAbsolute,
         assertCanary, MIN_RUN, MIN_COV, ABS_RUN } from "./lib/leak-score.mjs";
import { segments, attributedQuote, quoteLines } from "./lib/iso-segments.mjs";

const KNOWN = new Set(["--slug", "--cert", "--verbose"]);
const argv = process.argv.slice(2);
const slugs = [];
let cert = null, VERBOSE = false;
const DETAIL = argv.some((a) => a === "--slug" || a === "--cert");
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) continue;
  if (!KNOWN.has(a)) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
  if (a === "--slug") slugs.push(argv[++i]);
  else if (a === "--cert") cert = argv[++i];
  else VERBOSE = true;
}
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
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

async function allRows(path) {
  const out = []; let from = 0, total = null;
  for (;;) {
    const r = await fetch(BASE + "/" + path, { headers: { ...H, Range: from + "-" + (from + 499), Prefer: "count=exact" } });
    if (!r.ok) throw new Error("HTTP " + r.status + " on " + path);
    total = Number(String(r.headers.get("content-range") || "").split("/")[1]);
    const page = await r.json(); out.push(...page);
    if (out.length >= total || page.length === 0) break;
    from += 500;
  }
  if (out.length !== total) throw new Error("SHORT READ on " + path + ": " + out.length + " of " + total);
  return out;
}

const sources = buildSources();
/* POSITIVE CONTROL. An instrument that has never been made to fire is not
 * evidence of anything; a clean report from a broken index is the failure
 * this whole programme keeps paying for. */
assertCanary(sources);

/* `lessons` has no certification_id -- it reaches a certification through
 * module_id. Resolving it rather than reading the slug prefix, because a slug
 * prefix is a naming convention and not a foreign key. */
const certs = await allRows("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const modules = await allRows("modules?select=id,certification_id");
const certOfModule = new Map(modules.map((m) => [m.id, codeOf.get(m.certification_id)]));
let lessons = (await allRows("lessons?select=slug,language,content_md,module_id,title,mcp_servable,mcp_iso_longest_run"))
  .filter((l) => l.language === "en");
if (cert) lessons = lessons.filter((l) => certOfModule.get(l.module_id) === cert);
if (slugs.length) lessons = lessons.filter((l) => slugs.includes(l.slug));
if (!lessons.length) { console.error("no lessons matched"); process.exit(1); }

console.log("");
console.log("LESSON BODY SCORE -- per unit, whole body");
console.log("  gate: run >= " + MIN_RUN + " AND cov >= " + MIN_COV + ", OR run >= " + ABS_RUN);
console.log("  canary: OK");
console.log("");

/* ============ THE AUDIT IS THE POINT, NOT THE DETAIL ============
 *
 * `mcp_iso_longest_run` is a STORED number written by whichever scanner ran
 * last. The scorer has since had the greedy skip removed, so the stored value
 * is a LOWER BOUND on every row nothing has re-scanned. A row can therefore be
 * `mcp_servable = true` carrying a run over the absolute floor, and nothing in
 * the database says so -- the flag agrees with the stored number and the
 * stored number is the one that moved.
 *
 * So this prints the contradiction as its own result, with a DENOMINATOR,
 * because a clean audit over an empty candidate set is vacuous rather than
 * passing. */
const audit = [];
let totalFires = 0;
for (const l of lessons) {
  /* ============ CUT THE ATTRIBUTED QUOTATIONS FIRST ============
   *
   * The first version of this script scored the raw body and reported 75
   * lessons at or over the floor, the worst at 52 words, against a production
   * scanner reporting 9 refusals and a longest run of 12. The scanner was
   * right. IP-POSITION section 6 exempts clause text that is QUOTED AND
   * ATTRIBUTED, and `scan-iso-leaks` cuts those lines out before measuring;
   * this script did not, so every attributed blockquote in the corpus came
   * back as a reproduction.
   *
   * Two instruments disagreeing by a factor of four is not a seed difference
   * and was never going to be. Reporting the 75 would have withheld correctly
   * attributed quotation across four certifications.
   *
   * The exempt lines are measured SEPARATELY below rather than discarded,
   * because the question they raise is real and the scanner does not ask it. */
  const units = segments(l.content_md || "", attributedQuote).flatMap((seg) => runUnits(seg));
  const hits = [];
  for (const u of units) {
    const s = score(u, sources);
    if (!firesUnion(s)) continue;
    const lg = (s.merged || []).slice().sort((a, b) => b.len - a.len)[0];
    /* ATTRIBUTION COMES FROM THE SCORE, NOT FROM THE SPAN. `merged` entries
     * carry no source -- `runsAgainst` is already per source, so the source
     * lives on the scoreAgainst result. Reading it off the span yields
     * `undefined`, which prints as a confident "-" and loses the one field
     * that distinguishes a reproduction from a manufactured adjacency. */
    hits.push({ unit: u, run: s.unionRun, cov: Number((s.unionCov ?? 0).toFixed(2)),
                abs: firesAbsolute(s), ratio: firesRatio(s), src: s.source || "-",
                text: lg ? lg.text : "" });
  }
  hits.sort((a, b) => b.run - a.run);
  totalFires += hits.length;
  const current = hits.length ? hits[0].run : 0;
  audit.push({ cert: certOfModule.get(l.module_id) || "?", slug: l.slug,
               servable: l.mcp_servable === true, stored: l.mcp_iso_longest_run,
               current, over: current >= ABS_RUN });
  if (DETAIL) console.log("  " + (certOfModule.get(l.module_id) || "?").padEnd(9) + l.slug +
              "   units " + units.length + ", FIRES " + hits.length +
              "   servable=" + l.mcp_servable + " storedRun=" + l.mcp_iso_longest_run);
  for (const h of (DETAIL ? hits : [])) {
    console.log("      " + String(h.run).padStart(3) + "w cov " + String(h.cov).padStart(4) +
                (h.abs ? "  ABS" : "  rat") + "  [" + h.src + "]");
    console.log("        RUN  " + h.text);
    if (VERBOSE) console.log("        UNIT " + h.unit.slice(0, 400));
  }
  if (hits.length && DETAIL) console.log("");
}
console.log("");
console.log("  TOTAL FIRES " + totalFires + " across " + lessons.length + " lesson(s)");

/* ============ THE EXEMPTION HAS NO CEILING, AND THAT IS THE FINDING ========
 *
 * The NAMED lesson exemptions each carry a `maxRun`, on the stated ground that
 * "an exemption records a reason and is a CEILING, not a waiver" -- so a
 * longer reproduction cannot hide under a slug exempted for a category list.
 *
 * The attributed-quotation exemption is blanket. A quoted, attributed
 * blockquote is exempt at ANY length: 12 words, 52 words, or an entire clause.
 * Nothing measures it and nothing reports it, so its size is not a number
 * anyone has ever seen.
 *
 * This measures it. It changes no verdict -- the exemption is the position and
 * moves only when IP-POSITION section 6 moves -- but "we permit attributed
 * quotation" and "we permit 52 contiguous words of ISO 19011" are different
 * sentences, and only one of them has been read by anyone. */
const exemptRuns = [];
for (const l of lessons) {
  for (const q of quoteLines(l.content_md || "")) {
    if (!q.attributed) continue;
    const s = score(q.line.replace(/^\s*>\s?/, ""), sources);
    if (s.unionRun >= ABS_RUN) {
      exemptRuns.push({ cert: certOfModule.get(l.module_id) || "?", slug: l.slug,
                        run: s.unionRun, src: s.source, leadIn: q.leadIn });
    }
  }
}

const serving = audit.filter((a) => a.servable);
const bad = serving.filter((a) => a.over);
const stale = audit.filter((a) => Number(a.stored || 0) < a.current);
console.log("");
console.log("AUDIT -- stored flag against the current scorer");
console.log("  lessons examined                 " + audit.length + "   <- the denominator");
console.log("  of those, mcp_servable = true    " + serving.length);
console.log("  SERVING AT OR OVER " + ABS_RUN + "w          " + bad.length);
console.log("  stored run BELOW current run     " + stale.length + "   (the skip fix, unpersisted)");
console.log("");
console.log("ATTRIBUTED QUOTATIONS -- exempt by IP-POSITION s6, at or over " + ABS_RUN + "w");
console.log("  exempt quotation lines at or over the floor  " + exemptRuns.length);
if (exemptRuns.length) {
  const lens = exemptRuns.map((e) => e.run).sort((a, b) => b - a);
  console.log("  longest " + lens[0] + "w, median " + lens[Math.floor(lens.length / 2)] + "w");
  console.log("  THE BLANKET EXEMPTION CARRIES NO CEILING. The named ones all do.");
  for (const e of exemptRuns.sort((x, y) => y.run - x.run).slice(0, 12)) {
    console.log("    " + String(e.run).padStart(3) + "w  [" + e.src + "]  " + e.cert.padEnd(9) + e.slug);
  }
}
console.log("");
for (const a of bad.sort((x, y) => y.current - x.current)) {
  console.log("    " + String(a.current).padStart(3) + "w  stored " + String(a.stored).padStart(3) +
              "  " + a.cert.padEnd(9) + a.slug);
}
