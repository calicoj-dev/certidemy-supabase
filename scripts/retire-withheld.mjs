#!/usr/bin/env node
/* Retire the rows of items named in <SLUG>-WITHHELD.json.
 *
 * WHY THIS EXISTS. A withheld item is one the bank does not serve: it failed a gate, the director
 * has not rejected it on content, and it cannot be approved until it is rewritten. Left
 * `pending_review` inside the live exam pool it is invisible to the assembler but still counted by
 * verify-cert's "All items approved", so the conformance report fails for a reason that is already
 * decided. Retiring is the state that matches the disposition.
 *
 * REVERSIBLE. Every id is written to <SLUG>-WITHHELD-RETIRED.json BEFORE the write, and the
 * rollback is one command printed at the end.
 *
 * This script opts into WRITING: --apply. Dry by default. Unknown flags exit 2.
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { itemIdOfStem } from "./lib/item-id.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ARGS = process.argv.slice(2);
let APPLY = false, CERT = null;
for (let i = 0; i < ARGS.length; i++) {
  const a = ARGS[i];
  let m;
  if (a === "--apply") { APPLY = true; continue; }
  if ((m = /^--cert(?:=(.+))?$/.exec(a))) { CERT = m[1] || ARGS[++i]; continue; }
  console.error("unrecognised flag: " + a);
  console.error("  --cert <CODE> (required), --apply (this family opts into WRITING; dry by default)");
  process.exit(2);
}
if (!CERT) { console.error("--cert is required"); process.exit(2); }

const SLUG = CERT.replace(/-/g, "");
const WITHHELD_FILE = SLUG + "-WITHHELD.json";
const OUT = join(ROOT, SLUG + "-WITHHELD-RETIRED.json");
const KEY = requireKey(join(ROOT, "scripts"));

/* ---- the withheld list, validated the same way the promoter validates it ---- */
const p = join(ROOT, WITHHELD_FILE);
if (!existsSync(p)) { console.error("REFUSING: " + WITHHELD_FILE + " does not exist. Nothing is withheld."); process.exit(2); }
const entries = JSON.parse(readFileSync(p, "utf8")).withheld || [];
const withheld = new Map();
for (const w of entries) {
  const id = w.item_id ?? w.id;
  if (!id || !String(w.ruled_in || "").trim() || !String(w.reason || "").trim()) {
    console.error("REFUSING: " + WITHHELD_FILE + " has an entry without an id, a ruling or a reason.");
    process.exit(2);
  }
  withheld.set(String(id), w);
}
if (!withheld.size) { console.error("REFUSING: no withheld ids loaded from " + WITHHELD_FILE); process.exit(2); }

const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }
const rows = await getAll(KEY, "quiz_questions?select=id,question_group_id,question_text,language," +
  "status,pool,visibility,is_exam_scope,retired_at,item_origin&certification_id=eq." + cert.id +
  "&retired_at=is.null&order=id");

console.log("RETIRE WITHHELD   " + CERT + "   " + (APPLY ? "--apply" : "dry run (default)"));
console.log("  withheld list        " + WITHHELD_FILE + "   " + withheld.size + " id(s)");
console.log("  live rows on cert    " + rows.length);

const enHits = rows.filter((r) => r.language === "en" && withheld.has(itemIdOfStem(r.question_text)));
const groups = new Set(enHits.map((r) => r.question_group_id));
const target = rows.filter((r) => groups.has(r.question_group_id));

/* Every withheld id must resolve to exactly one English row, or the set is not what it claims. */
const counts = new Map();
for (const r of enHits) {
  const id = itemIdOfStem(r.question_text);
  counts.set(id, (counts.get(id) || 0) + 1);
}
const unresolved = [...withheld.keys()].filter((id) => (counts.get(id) || 0) !== 1);
if (unresolved.length) {
  console.error("REFUSING: " + unresolved.length + " withheld id(s) do not resolve to exactly one live " +
    "English row: " + unresolved.join(", "));
  console.error("Already retired, or ambiguous. Either way this script must not guess.");
  process.exit(2);
}
/* A withheld item must not be APPROVED. If one is, the promoter and this list disagree -- stop. */
const approved = target.filter((r) => r.status === "approved");
if (approved.length) {
  console.error("REFUSING: " + approved.length + " row(s) of withheld items are status='approved'. " +
    "A withheld item should never have been promoted. Resolve that before retiring anything.");
  process.exit(2);
}
console.log("  english rows matched " + enHits.length + " of " + withheld.size);
console.log("  rows to retire       " + target.length + " (groups x languages)");
const byLang = {};
for (const r of target) byLang[r.language] = (byLang[r.language] || 0) + 1;
console.log("  per language         " + JSON.stringify(byLang));
console.log("");
for (const r of enHits) {
  const w = withheld.get(itemIdOfStem(r.question_text));
  console.log("  " + itemIdOfStem(r.question_text) + "  " + w.ruled_in + " -- " + w.reason.slice(0, 80));
}

/* ---- the checksum over every row this batch may NOT touch (both directions) ---- */
const targetIds = new Set(target.map((r) => r.id));
const canon = (rs) => createHash("md5").update(JSON.stringify(rs.filter((r) => !targetIds.has(r.id))
  .map((r) => [r.id, r.status, r.pool, r.visibility, r.is_exam_scope, r.retired_at])
  .sort((a, b) => String(a[0]).localeCompare(String(b[0]))))).digest("hex");
const allBefore = await getAll(KEY, "quiz_questions?select=id,status,pool,visibility,is_exam_scope," +
  "retired_at&certification_id=eq." + cert.id + "&order=id");
const sumBefore = canon(allBefore);
console.log("");
console.log("  checksum over the " + (allBefore.length - target.length) + " row(s) this batch may NOT touch: " +
  sumBefore.slice(0, 16));

if (!APPLY) {
  console.log("");
  console.log("DRY RUN. Nothing written. " + target.length + " row(s) would be retired. Re-run with --apply.");
  process.exit(0);
}
if (existsSync(OUT)) {
  console.error("REFUSING: " + OUT + " already exists -- it is the rollback list for an earlier run.");
  process.exit(2);
}

const STAMP = new Date().toISOString();
writeFileSync(OUT, JSON.stringify({
  cert: CERT, ruled_in: "PROMPT-123 s4", retired_at: STAMP,
  why: "rows of items named in " + WITHHELD_FILE + ": withheld items are not served, and left " +
    "pending_review in the live pool they fail verify-cert's 'All items approved' for a decided reason",
  rollback: "set retired_at = null on exactly these ids",
  count: target.length,
  ids: target.map((r) => ({ id: r.id, language: r.language, item_id: null })),
  items: enHits.map((r) => ({ item_id: itemIdOfStem(r.question_text),
    ruled_in: withheld.get(itemIdOfStem(r.question_text)).ruled_in,
    reason: withheld.get(itemIdOfStem(r.question_text)).reason })),
}, null, 2) + "\n");
console.log("  wrote " + OUT + " (" + target.length + " id(s)) BEFORE the write");

const REST = process.env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co";
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json",
  Prefer: "return=minimal" };
let wrote = 0;
for (const r of target) {
  /* status, visibility, pool and is_exam_scope are NAMED on the write (standing rule) */
  const res = await fetch(REST + "/rest/v1/quiz_questions?id=eq." + r.id, { method: "PATCH", headers: H,
    body: JSON.stringify({ retired_at: STAMP, status: r.status, visibility: r.visibility,
      pool: r.pool, is_exam_scope: r.is_exam_scope }) });
  if (!res.ok) { console.error("  PATCH FAILED " + String(r.id).slice(0, 8) + " " + (await res.text()).slice(0, 120)); continue; }
  wrote++;
}

/* ---- POST-CONDITIONS, both directions ---- */
const allAfter = await getAll(KEY, "quiz_questions?select=id,status,pool,visibility,is_exam_scope," +
  "retired_at&certification_id=eq." + cert.id + "&order=id");
const sumAfter = canon(allAfter);
const after = new Map(allAfter.map((r) => [r.id, r]));
const notRetired = target.filter((r) => !after.get(r.id) || after.get(r.id).retired_at === null);
console.log("");
console.log("POST-CONDITIONS");
console.log("  retired              " + wrote + " of " + target.length);
console.log("  every target retired " + (notRetired.length === 0 ? "yes" : "NO -- " + notRetired.length + " still live"));
console.log("  untouched checksum   " + (sumBefore === sumAfter ? "UNCHANGED " + sumAfter.slice(0, 16)
  : "CHANGED -- before " + sumBefore.slice(0, 16) + " after " + sumAfter.slice(0, 16)));
const stillUnapproved = allAfter.filter((r) => r.retired_at === null && r.status !== "approved").length;
console.log("  unapproved live rows " + stillUnapproved + " (was " +
  allBefore.filter((r) => r.retired_at === null && r.status !== "approved").length + ")");
if (notRetired.length || sumBefore !== sumAfter) {
  console.error("A POST-CONDITION FAILED. Nothing is rolled back automatically -- read the recovery file.");
  process.exitCode = 2;
}
console.log("");
console.log("ROLLBACK: set retired_at = null on the " + target.length + " id(s) in " + OUT);
