#!/usr/bin/env node
/**
 * withhold-diverged-translations.mjs -- translations of English that has moved.
 *
 * WRITES. `--apply`; DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ THE PARTITION, AND IT IS DERIVED ============
 *
 * `REPAIR-TRANSLATION-PARITY.json` tested 418 spans across 101 English-repaired
 * lessons and returned NEW / NEITHER / OLD per span. That gives three states
 * and they need three different answers:
 *
 *   ALL SPANS NEW     the retranslation demonstrably landed. Keep serving, and
 *                     these are the rows 367 may stamp.
 *   ANY NEITHER/OLD   evidence the translation does not track the English.
 *                     WITHHOLD and regenerate.
 *   UNCOVERED         no retranslation record at all -- 77 lessons. No evidence
 *                     either way. NOT withheld: "nobody established this" is
 *                     not "this is stale", and taking a paid surface down for
 *                     an absence of evidence is the error the 367 proposal
 *                     names explicitly.
 *
 * Plus the lessons whose English moved AFTER that measurement -- today's
 * conversions -- which no artifact covers because they postdate it.
 *
 * ============ WHY `mcp_translation_review_required` AND NOT `mcp_servable` ==
 *
 * `mcp_servable` is the LEAK scanner's output. Writing it here would make the
 * next scan overwrite the decision, and would also conflate two different
 * verdicts in one column -- which is the confusion this repository has already
 * paid for three times.
 *
 * `mcp_translation_review_required` is the gate's own translation arm:
 * `lesson_body_is_servable` withholds unless an approved review exists whose
 * `en_hash` matches the CURRENT English. So setting it does exactly what is
 * meant -- withhold until a human clears the regenerated text -- and it is
 * reversible by the ordinary review path rather than by another script.
 *
 * ============ AND IT WRITES NO HASH ============
 *
 * Nothing here stamps `en_hash` or any review hash. Only a generator may
 * stamp; every other caller reads, compares and refuses. That rule exists
 * because a clearance script that recomputes the value the gate is about to
 * compare against makes every row fresh by construction.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". DRY BY DEFAULT; --apply to write."); process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");
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
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };

/* Lessons whose English moved TODAY, after the parity measurement. Named
 * explicitly because no artifact covers them: they are the instance that
 * prompted all of this. */
const EDITED_TODAY = [
  "isms-ia-03-02-what-the-sample-supports", "isms-ia-05-03-the-statement-that-survives",
  "isms-ia-03-01-degree-of-verification", "isms-ia-04-05-competence-awareness-documents",
  "isms-ia-01-03-objectivity-of-the-assignment", "isms-ia-04-03-the-whole-of-clause-6",
  "isms-ia-05-05-fixing-it-and-fixing-it", "isms-ia-04-01-what-the-scope-left-out",
];

const parity = JSON.parse(readFileSync(join(ROOT, "REPAIR-TRANSLATION-PARITY.json"), "utf8"));
const verdicts = new Map();   // slug -> Set of verdicts
for (const r of parity.results) {
  if (!verdicts.has(r.slug)) verdicts.set(r.slug, new Set());
  verdicts.get(r.slug).add(r.verdict);
}
const allNew = [...verdicts.entries()].filter(([, v]) => v.size === 1 && v.has("NEW")).map(([s]) => s);
const anyStale = [...verdicts.entries()].filter(([, v]) => v.has("NEITHER") || v.has("OLD")).map(([s]) => s);

const WITHHOLD = new Set([...anyStale, ...EDITED_TODAY]);

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

const lessons = await allRows("lessons?select=id,slug,language,lesson_group_id,mcp_translation_review_required");
const groupOfSlug = new Map();
for (const l of lessons) if (l.language === "en") groupOfSlug.set(l.slug, l.lesson_group_id ?? ("SOLO:" + l.id));
const byGroup = new Map();
for (const l of lessons) {
  const k = l.lesson_group_id ?? ("SOLO:" + l.id);
  if (!byGroup.has(k)) byGroup.set(k, []);
  byGroup.get(k).push(l);
}

const targets = [];
for (const slug of WITHHOLD) {
  const g = groupOfSlug.get(slug);
  if (!g) continue;
  for (const row of byGroup.get(g) || []) {
    if (row.language === "en") continue;
    targets.push({ ...row, slug, already: row.mcp_translation_review_required === true });
  }
}

/* Ask the FUNCTION which of them a partner can actually read. The column has
 * been mistaken for the verdict three times; it is an input, not an answer. */
const gate = new Map();
for (let i = 0; i < targets.length; i += 40) {
  const res = await Promise.all(targets.slice(i, i + 40).map(async (t) => {
    const r = await fetch(BASE + "/rpc/lesson_body_is_servable", {
      method: "POST", headers: H, body: JSON.stringify({ p_lesson_id: t.id }) });
    return [t.id, r.ok ? await r.json() : null];
  }));
  for (const [id, v] of res) gate.set(id, v);
}
const onWire = targets.filter((t) => gate.get(t.id) === true);

console.log("");
console.log("DIVERGED TRANSLATIONS -- partition derived from the parity artifact");
console.log("  parity measured " + parity.measured);
console.log("");
console.log("  lessons with ALL spans NEW        " + allNew.length + "   keep serving; 367 may stamp these");
console.log("  lessons with any NEITHER/OLD      " + anyStale.length + "   withhold");
console.log("  lessons uncovered by the parity   " + parity.uncovered.length + "   NOT withheld -- no evidence is not evidence");
console.log("  lessons edited today              " + EDITED_TODAY.length + "   withhold; postdate the artifact");
console.log("");
console.log("  translated rows in scope          " + targets.length);
console.log("  already withheld by the gate      " + targets.filter((t) => gate.get(t.id) !== true).length);
console.log("  ON THE WIRE, gate to be armed     " + onWire.length);
console.log("");
console.log("  Arming is not withholding. A row with an APPROVED review whose en_hash and");
console.log("  tr_hash both match the current text keeps serving, because a human cleared");
console.log("  exactly that text. What arming buys is that the NEXT English edit withholds");
console.log("  it automatically instead of leaving it serving and unmarked.");
console.log("");
for (const t of onWire.sort((a, b) => a.slug.localeCompare(b.slug) || a.language.localeCompare(b.language))) {
  console.log("    " + t.slug.padEnd(50) + t.language);
}

if (!onWire.length) { console.log(""); console.log("Nothing on the wire. No write needed."); process.exit(0); }
if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

console.log("");
console.log("APPLYING");
let fail = 0;
for (const t of onWire) {
  const r = await fetch(BASE + "/lessons?id=eq." + t.id, {
    method: "PATCH", headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ mcp_translation_review_required: true }),
  });
  if (!r.ok) { console.log("  FAIL  " + t.slug + "/" + t.language + " HTTP " + r.status); fail++; continue; }
  /* ============ SETTING THE FLAG *ARMS* THE GATE. IT DOES NOT WITHHOLD ====
   *
   * The first version asserted `withheld === true` and reported SEVEN
   * FAILURES. Every one was the gate working: those rows carry an APPROVED
   * review whose `en_hash` matches the current English AND whose `tr_hash`
   * matches the current translation. A human cleared exactly the text that is
   * there, so the row keeps serving -- which is what a review is for.
   *
   * The write is still right: the flag was FALSE on those rows, so the
   * translation arm of the gate was disarmed entirely. Arming it means the
   * next English edit withholds them automatically instead of silently
   * serving a translation of text that no longer exists.
   *
   * With the flag armed, `lesson_body_is_servable` has exactly one remaining
   * way to return true for a non-English row: a current approved review. So
   * "armed and still serving" IS "covered by a review", derived from the
   * function rather than re-implemented here.
   *
   * POST-CONDITION, BOTH DIRECTIONS: the row is withheld or review-covered,
   * and its ENGLISH sibling is untouched and still serving. Asserting the
   * stronger thing reported correct behaviour as seven failures, and a guard
   * that cries wolf gets loosened by the next person who sees it. */
  const back = await fetch(BASE + "/rpc/lesson_body_is_servable", {
    method: "POST", headers: H, body: JSON.stringify({ p_lesson_id: t.id }) });
  const nowServable = await back.json();
  const en = (byGroup.get(t.lesson_group_id) || []).find((x) => x.language === "en");
  const enBack = await fetch(BASE + "/rpc/lesson_body_is_servable", {
    method: "POST", headers: H, body: JSON.stringify({ p_lesson_id: en.id }) });
  const enServable = await enBack.json();
  const covered = nowServable === true;
  const ok = enServable === true;
  console.log("  " + (ok ? "PASS  " : "FAIL  ") + t.slug + "/" + t.language +
    "   " + (covered ? "serving under a current review" : "WITHHELD") +
    "   english=" + (enServable === true ? "serving" : "WITHHELD"));
  if (!ok) fail++;
}
console.log("");
console.log("  Reversal is the ordinary review path: regenerate, then record an approved");
console.log("  review whose en_hash matches the current English. No script clears this.");
process.exit(fail ? 1 : 0);
