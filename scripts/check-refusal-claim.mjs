#!/usr/bin/env node
/**
 * check-refusal-claim.mjs -- the refusal says "the English body is available
 * now". Is it?
 *
 * READ-ONLY. No --apply, no --dry. Unknown flags exit 2.
 * Exit 0 the claim holds, 1 it is false somewhere, 2 the check could not answer.
 *
 * ============ WHY THIS EXISTS ============
 *
 * 371 replaced a refusal that was false on 177 of 183 rows. Its replacement, for
 * a translation held pending review, says:
 *
 *   "...the English body is available now, and the translation follows when the
 *    review clears."
 *
 * That is an assertion about a DIFFERENT ROW, and it was measured once, by hand,
 * on the day it shipped: all 177 review-held rows had a servable English
 * sibling. Nothing enforced it, and the predicate lived in a comment.
 *
 * **A condition written in a comment is a rule; a condition that runs is a
 * check.** Same distinction as the deploy gate. If an ISO-held English body ever
 * pairs with a review-held translation, the refusal starts lying again, and this
 * is the thing that should say so.
 *
 * ============ IT DOES NOT RE-IMPLEMENT THE GATE ============
 *
 * The obvious build -- recompute the review arm in JS from
 * lesson_translation_reviews -- is the defect 371 exists to prevent: two
 * implementations of one rule, drifting at the first edit. So servability is
 * READ FROM THE DEPLOYED ENDPOINT. mcp.lesson_index.body_available IS
 * lesson_body_is_servable, and the catalogue is public, so 36 unauthenticated
 * calls (12 certifications x 3 languages) return the gate's own verdict for
 * every lesson, with lesson_group_id to pair siblings.
 *
 * That also makes it a check of what a PARTNER sees rather than of what the
 * database thinks, which is the distinction this repository keeps paying for.
 *
 * ============ THE ONE NARROWING, AND IT IS PROVED, NOT ASSUMED ============
 *
 * A violation needs an English sibling that is NOT servable. English rows can
 * only be withheld by the ISO arm -- the other two arms are guarded by
 * language <> 'en' -- so mcp_servable should equal body_available on every
 * English row. That is an ASSUMPTION about the gate's shape, so the check
 * asserts it across all English rows before relying on it, and reports UNSOUND
 * rather than passing if it ever breaks.
 *
 * mcp_servable is then used for exactly one thing: telling an ISO-held
 * translation (which correctly gets the ISO message) from a review-held one
 * (which makes the claim). That is the function's first WHEN clause, one line,
 * not a duplicated predicate.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { acquireHeavyReaderLock } from "./lib/heavy-reader-lock.mjs";

/* PRE-RUN CHECK, not a note: one corpus-wide reader at a time. Two of these
 * overlapping returned 22 x 503 from courseware-read on 2026-09-25. */
const releaseHeavyReaderLock = await acquireHeavyReaderLock("check-refusal-claim");

for (const a of process.argv.slice(2)) {
  if (a.startsWith("--")) {
    console.error("Unrecognised flag: " + a + ". This script is READ-ONLY and takes none.");
    process.exit(2);
  }
}
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

/* ============ THE PURE PREDICATE, SO IT CAN BE CONTROLLED ============
 *
 * Separated from every fetch on purpose: a control that has to reach the
 * network is a control nobody runs, and one built from live rows stops working
 * the moment the rows are repaired -- the "migration tip vs disk" shape.
 *
 * rows: { group, language, bodyAvailable, mcpServable, slug, certification }
 */
export function findViolations(rows) {
  const byGroup = new Map();
  for (const r of rows) {
    if (!byGroup.has(r.group)) byGroup.set(r.group, []);
    byGroup.get(r.group).push(r);
  }
  const violations = [], claimants = [];
  for (const [, g] of byGroup) {
    const en = g.find((r) => r.language === "en");
    for (const r of g) {
      if (r.language === "en") continue;
      /* A row MAKES THE CLAIM when it is withheld by an arm other than the
       * scanner -- review or provenance. Those are the two messages that say
       * the English body is available. */
      const makesClaim = !r.bodyAvailable && r.mcpServable;
      if (!makesClaim) continue;
      claimants.push(r);
      /* A missing English sibling is not "available" either, and folding it in
       * with "present but withheld" would hide a different defect. */
      if (!en) violations.push({ ...r, why: "no English sibling exists" });
      else if (!en.bodyAvailable) violations.push({ ...r, why: "English sibling is withheld too" });
    }
  }
  return { violations, claimants };
}

/* ============ POSITIVE CONTROL, ON A FIXTURE ============
 *
 * Four cases whose answers are known by construction. If any verdict is wrong
 * the script prints NO result and exits 2, because a broken checker reports
 * clean. Built from synthetic rows rather than live ones, so repairing the
 * corpus can never disarm it. */
function controls() {
  const F = (group, language, bodyAvailable, mcpServable) =>
    ({ group, language, bodyAvailable, mcpServable, slug: group + "-" + language, certification: "FIXTURE" });
  const cases = [
    { name: "review-held translation, English serving -> the claim holds", fire: false,
      rows: [F("g1", "en", true, true), F("g1", "es-419", false, true)] },
    { name: "review-held translation, English ISO-held -> THE REFUSAL LIES", fire: true,
      rows: [F("g2", "en", false, false), F("g2", "es-419", false, true)] },
    { name: "whole group ISO-held -> correctly gets the ISO message, no claim", fire: false,
      rows: [F("g3", "en", false, false), F("g3", "es-419", false, false)] },
    { name: "translation withheld with no English row at all -> lies", fire: true,
      rows: [F("g4", "pt-BR", false, true)] },
  ];
  let broken = 0;
  for (const c of cases) {
    const fired = findViolations(c.rows).violations.length > 0;
    if (fired !== c.fire) {
      console.error("CONTROL FAILED: " + c.name + " (fired=" + fired + ", expected " + c.fire + ")");
      broken++;
    }
  }
  return broken;
}

if (controls()) {
  console.error("");
  console.error("The predicate is not working. No verdict printed: a broken checker reports clean.");
  process.exit(2);
}

/* ---------------------------------------------------------------- the data */
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is not set -- nothing measured, which is not a pass.");
  process.exit(2);
}
const REST = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const FN = "https://pctynukndxnmnxiqpgck.supabase.co/functions/v1/courseware-read";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };
const CERTS = ["AISM-I", "AIE-I", "AIHR-I", "AIGRM-I", "SM-AI-I", "SM-AI-II", "SPO-AI-I",
               "SD-AI-I", "ISMS-F", "AIMS-F", "AIMS-IA", "ISMS-IA"];
const LANGS = ["en", "es-419", "pt-BR"];
const CELL_LIMIT = 200;   // the endpoint refuses anything higher. Largest cell today is 61;
                          // a cell REACHING this is reported UNSOUND, never silently truncated.

async function fn(body) {
  let last;
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(FN, {
        method: "POST",
        headers: { "content-type": "application/json", "x-mcp-client": "probe:refusal-claim" },
        body: JSON.stringify(body), signal: AbortSignal.timeout(45000),
      });
      const t = await r.text();
      if (r.ok) return JSON.parse(t);
      last = new Error("HTTP " + r.status + " " + t.slice(0, 80));
    } catch (e) { last = e; }
    /* Paced: the pooler ceiling is live isolates x 2, and measuring a surface
     * must not be the heaviest thing that surface has seen. */
    await new Promise((s) => setTimeout(s, 300 * (i + 1)));
  }
  throw last;
}

/* mcp_servable, paged with a count assertion. A floor is not a total, and the
 * loop terminates on REACHING THE TOTAL rather than on a short page. */
async function allLessons() {
  const rows = [], PAGE = 1000;
  let total = null;
  for (let from = 0; ; from += PAGE) {
    const r = await fetch(REST + "/lessons?select=id,slug,language,lesson_group_id,mcp_servable&order=id",
      { headers: { ...H, Range: from + "-" + (from + PAGE - 1), Prefer: "count=exact" },
        signal: AbortSignal.timeout(45000) });
    if (!r.ok) throw new Error("HTTP " + r.status + " reading lessons");
    const n = Number(String(r.headers.get("content-range") || "").split("/")[1]);
    if (!Number.isFinite(n)) throw new Error("no content-range on lessons -- a dropped read is not a zero");
    total = n;
    const page = await r.json();
    rows.push(...page);
    if (rows.length >= total || !page.length) break;
  }
  if (rows.length !== total) {
    throw new Error("SHORT READ on lessons: collected " + rows.length + ", server says " + total);
  }
  return rows;
}

const lessons = await allLessons();
const catalogue = new Map();   // slug|language -> { certification, bodyAvailable }
let cells = 0;
const atLimit = [];
for (const certification of CERTS) {
  for (const language of LANGS) {
    const j = await fn({ resource: "lesson_index", certification, language, limit: CELL_LIMIT });
    const rs = j.rows ?? [];
    if (rs.length >= CELL_LIMIT) atLimit.push(certification + "/" + language);
    for (const r of rs) catalogue.set(r.lesson_slug + "|" + r.language, { certification, bodyAvailable: r.body_available });
    cells++;
  }
}
if (atLimit.length) {
  console.error("UNSOUND: cell(s) at the row limit, so the read is a floor: " + atLimit.join(", "));
  process.exit(2);
}

/* Join the two sources. A lesson the catalogue never reported is UNKNOWN, not
 * servable -- the third state, kept out of both other buckets. */
const rows = [], unknown = [];
for (const l of lessons) {
  const hit = catalogue.get(l.slug + "|" + l.language);
  if (!hit) { unknown.push(l.slug + "/" + l.language); continue; }
  rows.push({ group: l.lesson_group_id, language: l.language, slug: l.slug,
              certification: hit.certification, bodyAvailable: hit.bodyAvailable,
              mcpServable: l.mcp_servable });
}

/* THE NARROWING, PROVED. English rows can only be withheld by the scanner, so
 * the column and the gate must agree on every one of them. If they ever do not,
 * mcpServable no longer identifies the ISO arm and this check is UNSOUND. */
const enRows = rows.filter((r) => r.language === "en");
const enMismatch = enRows.filter((r) => r.bodyAvailable !== r.mcpServable);
if (enMismatch.length) {
  console.error("UNSOUND: " + enMismatch.length + " English row(s) where mcp_servable disagrees with the gate.");
  console.error("  The narrowing that identifies the ISO arm no longer holds; no verdict is printed.");
  for (const r of enMismatch.slice(0, 5)) console.error("    " + r.certification + " " + r.slug);
  process.exit(2);
}
if (!enRows.length) {
  console.error("UNSOUND: no English rows were read at all.");
  process.exit(2);
}

const { violations, claimants } = findViolations(rows);

console.log("");
console.log("REFUSAL CLAIM -- the English body is available now");
console.log("  " + cells + " catalogue cell(s) from the deployed endpoint, " + lessons.length + " lesson row(s)");
console.log("  English rows where the column and the gate agree: " + enRows.length + "/" + enRows.length);
if (unknown.length) {
  console.log("  not in the catalogue (outside the 12 served certifications): " + unknown.length);
}
console.log("  rows that MAKE the claim (withheld, not by the scanner): " + claimants.length);
console.log("  rows where the claim is FALSE: " + violations.length);
console.log("DENOMINATOR: " + claimants.length + " claim(s) examined");
if (violations.length) {
  console.log("");
  for (const v of violations.slice(0, 20)) {
    console.log("  FALSE  " + v.certification + " " + v.slug + " / " + v.language + " -- " + v.why);
  }
  console.log("");
  console.log("Each of these is refused with a message saying the English body is available.");
  console.log("It is not. Either serve the English body or give these rows their own message.");
  process.exitCode = 1;
}
