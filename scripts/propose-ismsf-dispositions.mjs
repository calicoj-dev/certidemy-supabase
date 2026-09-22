#!/usr/bin/env node
/**
 * propose-ismsf-dispositions.mjs - rewrite / keep / trim, for all 192.
 *
 * READ-ONLY. No flags. Writes a proposal file; changes no content.
 *
 * ============ THE RULING THIS IMPLEMENTS ============
 *
 * "The 192 is the population to REVIEW, not the population to rewrite."
 * Forcing 165-192 characters onto a pointer row produces padding, which is the
 * AIMS-F stub problem approached from the other direction.
 *
 * ============ AND THE CLASSIFIER IS ADVISORY, DELIBERATELY ============
 *
 * Both lexical detectors in this repository failed on the ratified exemplar --
 * `security-control` scores as a gloss on a word list because it performs its
 * teaching move without using any of the listed words. So nothing here decides
 * a row by a score. The signals are:
 *
 *   LEAK      fires the gate, or is exempt-but-firing. Mechanical, trustworthy.
 *   TIER-A    the concept NAME is an ISO defined term. Mechanical and stable --
 *             but note it CANNOT fall when a description is rewritten, because
 *             it matches the name, not the text. It is a candidate list, never
 *             a progress metric.
 *   POINTER   the description names a thing rather than explaining one: an
 *             enumeration, a label, a standard's subject. These are the KEEP
 *             candidates, and the test is whether there is a teaching move to
 *             add at all.
 *
 * The output is an ENUMERATION with the evidence per row. The counts are
 * commentary until someone reads the members.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

for (const a of process.argv.slice(2)) {
  if (a.startsWith("--")) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
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
    if (!r.ok) throw new Error("HTTP " + r.status);
    total = Number(String(r.headers.get("content-range") || "").split("/")[1]);
    const page = await r.json(); out.push(...page);
    if (page.length < 500) break; from += 500;
  }
  if (!Number.isFinite(total)) throw new Error("no content-range on " + path);
  if (out.length !== total) throw new Error("PAGING INCOMPLETE: " + out.length + " of " + total);
  return out;
}

const census = JSON.parse(readFileSync(join(ROOT, "ISMS-F-CENSUS.json"), "utf8"));
const fires = new Set(census.fires.map((f) => f.slug));
const gloss = JSON.parse(readFileSync(join(ROOT, "DEFINED-TERM-GLOSS-CANDIDATES.json"), "utf8"));
const tierA = new Set((gloss.rows || []).filter((r) => r.cert === "ISMS-F" && r.tier === "A").map((r) => r.slug));
const applied = existsSync(join(ROOT, "ISMS-F-BATCH-1-APPLIED.json"))
  ? new Set(JSON.parse(readFileSync(join(ROOT, "ISMS-F-BATCH-1-APPLIED.json"), "utf8")).approved) : new Set();
const revised = existsSync(join(ROOT, "ISMS-F-REWRITE-BATCH-1-REVISED.json"))
  ? new Set(JSON.parse(readFileSync(join(ROOT, "ISMS-F-REWRITE-BATCH-1-REVISED.json"), "utf8")).rows.map((r) => r.slug)) : new Set();

/* POINTER SHAPES. A row whose content IS the fact: an enumeration ("the four
 * themes"), a label for a standard, or a named attribute set. The director's
 * own KEEP examples are the calibration, and they must all land in KEEP or
 * this classifier is not implementing the ruling it cites. */
const POINTER = /\b(the (four|three|two|seven|nine|ten) \w+|family of standards|as the [\w\s]+ standard|attribute set|the \w+ into which|reference set|the documented expression|the planned (programme|interval)|the record in which|the stated reason|the level at which|which of|whether a control|the operational area|the two dimensions|the four available)\b/i;
const CALIBRATION_KEEP = ["amendment-1-2024", "annex-a-themes", "iso-27000-family", "control-attributes"];

const certs = await allRows("certifications?select=id,code");
const cert = certs.find((c) => c.code === "ISMS-F");
const rows = (await allRows("concepts?select=id,slug,name,description,certification_id,retired_at"))
  .filter((c) => !c.retired_at && c.certification_id === cert.id);

const out = [];
for (const r of rows) {
  const d = String(r.description || "");
  const len = d.length;
  const sentences = (d.match(/[.!?](\s|$)/g) || []).length;
  let disp, why;

  /* THE RATIFIED EXEMPLARS ARE DONE, NOT TRIM. The first run put
   * `security-control` and `risk-appetite` in TRIM because they are long and
   * multi-sentence -- the two rows that ARE the house style, proposed for
   * shortening by a rule meant to catch padding. A length test cannot tell
   * "carries both halves" from "waffles", which is the same limit that
   * disqualified the teaching-move detectors. Name them. */
  const HOUSE_STYLE = ["security-control", "risk-appetite"];
  if (HOUSE_STYLE.includes(r.slug)) { disp = "done"; why = "already in house style - security-control is the ratified template"; }
  else if (applied.has(r.slug)) { disp = "done"; why = "batch 1, applied"; }
  else if (revised.has(r.slug)) { disp = "done-pending-read"; why = "batch 1 revised, awaiting your read"; }
  else if (fires.has(r.slug)) { disp = "rewrite"; why = "fires the leak gate"; }
  else if (tierA.has(r.slug)) { disp = "rewrite"; why = "tier-A: the name is an ISO defined term, so an item can test the definition"; }
  else if (POINTER.test(d) || CALIBRATION_KEEP.includes(r.slug)) {
    disp = "keep"; why = "pointer row - the fact IS the content; a teaching move would be padding";
  } else if (sentences >= 2 || len >= 120) {
    disp = "trim"; why = "already carries more than a label; tighten rather than rewrite";
  } else { disp = "rewrite"; why = "one-line label on a teachable concept"; }

  out.push({ slug: r.slug, disposition: disp, why, chars: len, description: d });
}

/* CALIBRATION. The ruling named four KEEP examples. If any lands elsewhere the
 * classifier is not implementing the ruling and the counts below are noise. */
const misplaced = CALIBRATION_KEEP.filter((s) => {
  const e = out.find((x) => x.slug === s);
  return e && e.disposition !== "keep";
});
if (misplaced.length) {
  console.error("CALIBRATION FAILED: these were named as KEEP and landed elsewhere: " + misplaced.join(", "));
  console.error("The classifier does not implement the ruling it cites. No split is reported.");
  process.exit(2);
}
console.log("calibration: " + CALIBRATION_KEEP.length + "/" + CALIBRATION_KEEP.length +
            " named KEEP examples classified as keep");

const by = (d) => out.filter((x) => x.disposition === d);
console.log("");
console.log("ISMS-F DISPOSITION SPLIT -- " + out.length + " live concepts");
for (const d of ["done", "done-pending-read", "rewrite", "trim", "keep"]) {
  console.log("  " + d.padEnd(20) + String(by(d).length).padStart(4));
}
console.log("");
console.log("KEEP (" + by("keep").length + ") -- no teaching move to add:");
for (const x of by("keep")) console.log("   " + String(x.chars).padStart(3) + "  " + x.slug.padEnd(34) + x.description.slice(0, 74));
console.log("");
console.log("TRIM (" + by("trim").length + "):");
for (const x of by("trim")) console.log("   " + String(x.chars).padStart(3) + "  " + x.slug.padEnd(34) + x.description.slice(0, 74));
console.log("");
console.log("REWRITE (" + by("rewrite").length + ") -- first 25, full list in the JSON:");
for (const x of by("rewrite").slice(0, 25)) console.log("   " + String(x.chars).padStart(3) + "  " + x.slug.padEnd(34) + x.why.slice(0, 46));

writeFileSync(join(ROOT, "ISMS-F-DISPOSITIONS.json"), JSON.stringify({
  measured: "2026-09-22", total: out.length,
  counts: Object.fromEntries(["done", "done-pending-read", "rewrite", "trim", "keep"].map((d) => [d, by(d).length])),
  caveat: "The classifier is ADVISORY. Both lexical detectors in this repo fail on the ratified exemplar, so no row is decided by a score. Leak-gate and tier-A membership are mechanical; POINTER is a lexical guess and the KEEP list is the one to read first.",
  rows: out,
}, null, 2), "utf8");
console.log("");
console.log("wrote ISMS-F-DISPOSITIONS.json");
