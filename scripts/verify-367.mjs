#!/usr/bin/env node
/**
 * verify-367.mjs -- the POSITIVE control for the lesson provenance gate.
 *
 * NET-ZERO, NOT READ-ONLY, AND THE DIFFERENCE IS REAL. PostgREST gives no
 * transaction to hold open, so this is NOT a rollback: it PATCHes one English
 * body, reads the gate, and PATCHes the original back, verifying byte
 * equality. For a few hundred milliseconds that lesson's English carries a
 * trailing character and its translations are withheld by the gate under
 * test. Nothing survives the run, but something happened during it, and a
 * header claiming "rolls back" would be a promise the body does not make.
 *
 * Unknown flags exit 2. There is no --apply: the write is the measurement.
 *
 * ============ IT EDITS A LIVE, RELEASED LESSON ============
 *
 * The subject is chosen from the data -- the first lesson group with an
 * English row and two stamped translations that are ALL servable right now --
 * so in practice it is a released ISMS-IA, AIMS-IA or Scrum lesson on a paid
 * surface. It prints which one BEFORE it writes anything. Anyone running this
 * should know that before they run it, not after.
 *
 * ============ AND `finally` DOES NOT COVER THE FAILURE THAT MATTERS ========
 *
 * A thrown assertion is caught by `finally`. A kill, a dropped connection or a
 * container restart between the two PATCHes is not -- and it would leave a
 * live lesson edited, its translations dark, and NOTHING ON DISK saying what
 * the body used to be.
 *
 * So the original is written to a RECOVERY FILE before the first PATCH and
 * deleted only after the restore verifies byte equality. If that file exists
 * at startup the script REFUSES TO RUN and prints the recovery command. An
 * unattended crash becomes a message instead of a silent corruption.
 *
 * That is the same rule as a migration capturing its BEFORE state: the thing
 * that lets you undo must outlive the process that needs undoing.
 *
 * ============ WHY THIS IS NOT OPTIONAL ============
 *
 * 367's post-conditions assert the NEGATIVE direction thoroughly: no English
 * row was stamped, no translated row was left unstamped, servability moved on
 * zero rows. Every one of those passes just as cleanly if the new clause is
 * dead code.
 *
 * A clause that has never been seen to fire is indistinguishable from a clause
 * that cannot fire. This repository has paid for that three times -- eslint
 * that never ran, a proconfig predicate matching nothing, a fragment extractor
 * comparing against text that appears nowhere -- and each time the tell was a
 * green result nobody could attribute to anything.
 *
 * An earlier draft of 367 put this demonstration in a SQL COMMENT, which
 * nobody runs. That is the same failure one level out: a control that exists
 * as prose is a control that has never fired.
 *
 * ============ WHAT IT ASSERTS, AND IN BOTH DIRECTIONS ============
 *
 *   BEFORE   the English row and both translations are servable
 *   EDIT     one character appended to the ENGLISH body
 *   AFTER    English STILL servable  <- the gate must not withhold the source
 *            both translations NOT servable  <- the clause fired
 *   RESTORE  the original body written back, byte-compared, and all three
 *            rows re-read to prove the corpus is as it was
 *
 * The English assertion matters as much as the translated one. A predicate
 * that withheld everything would pass a one-sided check, and over-withholding
 * is the error direction that looks like diligence.
 *
 * ============ AND THE FIRST RUN EXPOSED TWO DEFECTS IN THIS SCRIPT ========
 *
 * It reported FAIL on "english STILL servable" -- and the gate was right.
 * `trg_lessons_clear_mcp_servable` sets `mcp_servable = false` and nulls
 * `mcp_scanned_at` on ANY content_md change. So:
 *
 *   1. THE ENGLISH WAS WITHHELD BY THE EDIT TRIGGER, NOT BY THE PROVENANCE
 *      CLAUSE. Asserting on the gate as a whole cannot tell those apart --
 *      the assertion was attributing a withholding to the thing under test
 *      without checking which arm did it.
 *
 *   2. RESTORING THE BODY DID NOT RESTORE THE STATE. The trigger fires on the
 *      restore too, so the bytes came back and `mcp_servable` stayed false.
 *      A live English lesson was left dark, and the script reported that as a
 *      failed assertion rather than as damage it had caused. It had to be
 *      repaired by re-running scan-iso-leaks.
 *
 * A CONTROL THAT LEAVES THE CORPUS CHANGED IS NOT A CONTROL, and a control
 * that cannot say WHICH predicate withheld a row is measuring the wrong thing.
 * Both are fixed below: the scanner columns are captured and restored with the
 * body, and each withholding is ATTRIBUTED before it is counted as evidence.
 */
import { readFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--slug", "--verbose", "--recover"]);
const argv = process.argv.slice(2);
let SLUG = null, VERBOSE = false, RECOVER = false;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) continue;
  if (!KNOWN.has(a)) { console.error("Unrecognised flag: " + a + ". This script rolls back; it takes no --apply."); process.exit(2); }
  if (a === "--slug") SLUG = argv[++i];
  if (a === "--verbose") VERBOSE = true;
  if (a === "--recover") RECOVER = true;
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
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };

/* ============ THE RECOVERY FILE ============
 *
 * Written before the first PATCH, deleted after the restore verifies. Its
 * presence at startup means a previous run died mid-edit, and the only safe
 * response is to refuse and hand over the recovery. */
const RECOVERY = join(ROOT, ".verify-367-recovery.json");
if (RECOVER) {
  if (!existsSync(RECOVERY)) { console.error("Nothing to recover: no recovery file."); process.exit(2); }
  const rec = JSON.parse(readFileSync(RECOVERY, "utf8"));
  const r = await fetch(BASE + "/lessons?id=eq." + rec.id, {
    method: "PATCH", headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ content_md: rec.content_md }) });
  if (!r.ok) { console.error("RECOVERY FAILED: HTTP " + r.status + ". The file is kept."); process.exit(1); }
  const back = (await r.json())[0];
  if (back.content_md !== rec.content_md) {
    console.error("RECOVERY FAILED: the body read back does not match. The file is kept.");
    process.exit(1);
  }
  if (rec.scan) {
    const r2 = await fetch(BASE + "/lessons?id=eq." + rec.id, {
      method: "PATCH", headers: { ...H, Prefer: "return=representation" },
      body: JSON.stringify(rec.scan) });
    if (!r2.ok) { console.error("RECOVERY PARTIAL: body restored, scanner verdict NOT. The file is kept."); process.exit(1); }
  }
  unlinkSync(RECOVERY);
  console.log("");
  console.log("RECOVERED " + rec.slug + " -- body and scanner verdict restored, file removed.");
  process.exit(0);
}
if (existsSync(RECOVERY)) {
  let rec = null;
  try { rec = JSON.parse(readFileSync(RECOVERY, "utf8")); } catch { /* unreadable is still a refusal */ }
  console.error("");
  console.error("REFUSING: a recovery file from a previous run is present.");
  console.error("  " + RECOVERY);
  if (rec) {
    console.error("");
    console.error("  lesson : " + rec.slug + "  (" + rec.id + ")");
    console.error("  written: " + rec.at);
    console.error("");
    console.error("  A previous run edited that English body and did not restore it. The");
    console.error("  original is IN THAT FILE. Restore it, confirm the body matches, then");
    console.error("  delete the file:");
    console.error("");
    console.error("    node --dns-result-order=ipv4first scripts/verify-367.mjs --recover");
  } else {
    console.error("  The file could not be parsed. Do not delete it; inspect it by hand.");
  }
  process.exit(2);
}

/* The restore is explicit, verified byte-for-byte, and runs in a `finally` so
 * a thrown assertion cannot leave the body edited. The script refuses to exit
 * 0 unless the original is back. A control that can leave the corpus modified
 * is not a control. */
async function get(path) {
  const r = await fetch(BASE + "/" + path, { headers: H });
  if (!r.ok) throw new Error("HTTP " + r.status + " on " + path);
  return r.json();
}
async function gate(id) {
  const r = await fetch(BASE + "/rpc/lesson_body_is_servable", {
    method: "POST", headers: H, body: JSON.stringify({ p_lesson_id: id }) });
  if (!r.ok) throw new Error("gate HTTP " + r.status);
  return r.json();
}
async function setBody(id, body) {
  const r = await fetch(BASE + "/lessons?id=eq." + id, {
    method: "PATCH", headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ content_md: body }) });
  if (!r.ok) throw new Error("patch HTTP " + r.status);
  return (await r.json())[0];
}

/* The edit trigger clears the scanner verdict on ANY content change -- and on
 * the RESTORE too. So the restore is two writes: the body, then the scanner
 * columns the trigger just wiped. Writing them in one PATCH would not work:
 * the trigger fires on the same statement and would clear them again.
 *
 * WHICH COLUMNS TRAVEL TOGETHER IS NOT A MATTER OF MEMORY. The table carries
 *
 *   lessons_mcp_scan_coherent
 *     CHECK (mcp_servable = false
 *            OR (mcp_iso_longest_run IS NOT NULL
 *                AND mcp_scanned_at IS NOT NULL
 *                AND mcp_scan_sources IS NOT NULL))
 *
 * The first version of this snapshot carried three of those four and the
 * restore failed with 23514 -- the constraint refusing to let the script leave
 * the row in a state the scanner could never produce. A guard doing exactly
 * its job, against a repair that was one column short.
 *
 * Same shape as the persisted record that dropped `term`: A FIELD THAT DOES
 * NOT TRAVEL BECOMES A DEFECT DOWNSTREAM. Here the downstream was the restore
 * path of the script itself. */
async function restoreScanState(id, snap) {
  const r = await fetch(BASE + "/lessons?id=eq." + id, {
    method: "PATCH", headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({
      mcp_servable: snap.mcp_servable,
      mcp_scanned_at: snap.mcp_scanned_at,
      mcp_iso_longest_run: snap.mcp_iso_longest_run,
      mcp_scan_sources: snap.mcp_scan_sources,
    }) });
  if (!r.ok) {
    const body = await r.text();
    console.error("");
    console.error("RESTORE OF THE SCANNER VERDICT FAILED: HTTP " + r.status);
    console.error(body.slice(0, 300));
    console.error("");
    console.error("The lesson body is back but the row is WITHHELD. The recovery file is");
    console.error("kept. The designed remedy for a lesson the edit trigger withheld is:");
    console.error("  node --dns-result-order=ipv4first scripts/scan-iso-leaks.mjs --apply");
    throw new Error("restore-scan HTTP " + r.status);
  }
  return (await r.json())[0];
}

/* Pick a subject: an English lesson whose translations are ALL servable right
 * now and carry a provenance stamp. Chosen from the data rather than named,
 * so the control keeps working after any one lesson is repaired -- the
 * "a control pinned to a defect forbids repairing it" rule. */
const cols = "id,slug,language,lesson_group_id,content_md,en_content_hash,en_content_hash_basis,"
           + "mcp_servable,mcp_scanned_at,mcp_iso_longest_run,mcp_scan_sources";
/* A missing column is a PostgREST 400, not an empty result. Caught and named,
 * because "the migration has not run" and "the gate is broken" must not
 * produce the same output -- the one-error-string-for-two-causes shape. */
let all;
try {
  all = await get("lessons?select=" + cols + "&limit=2000");
} catch (e) {
  console.error("");
  console.error("lessons.en_content_hash is not present: " + e.message);
  console.error("Run migration 367 first. This is NOT a gate failure -- the gate does not");
  console.error("exist yet, and reporting it as one would send someone to debug a column.");
  process.exit(2);
}
if (!all.length) { console.error("no lessons"); process.exit(2); }
const byGroup = new Map();
for (const l of all) {
  const k = l.lesson_group_id ?? ("SOLO:" + l.id);
  if (!byGroup.has(k)) byGroup.set(k, []);
  byGroup.get(k).push(l);
}

let subject = null;
for (const [, rows] of byGroup) {
  const en = rows.find((r) => r.language === "en");
  const tr = rows.filter((r) => r.language !== "en");
  if (!en || tr.length < 2) continue;
  if (SLUG && en.slug !== SLUG) continue;
  if (!tr.every((t) => t.en_content_hash)) continue;
  const states = await Promise.all([en, ...tr].map((r) => gate(r.id)));
  if (states.every((s) => s === true)) { subject = { en, tr }; break; }
}
if (!subject) {
  console.error("");
  console.error("NO SUBJECT: no lesson group has an English row and two stamped translations");
  console.error("all currently servable. The control cannot run, and that is a RESULT rather");
  console.error("than a pass -- it means nothing is in the state the gate is meant to protect.");
  process.exit(2);
}

const { en, tr } = subject;
console.log("");
console.log("VERIFY 367 -- positive control for the provenance gate");
console.log("  subject: " + en.slug);
console.log("  translations: " + tr.map((t) => t.language + " (" + t.en_content_hash_basis + ")").join(", "));
console.log("");

let fail = 0;
const ok = (label, cond, detail) => {
  console.log("  " + (cond ? "PASS  " : "FAIL  ") + label + (detail ? "   " + detail : ""));
  if (!cond) fail++;
};

const original = en.content_md;
let restored = false;
/* On disk BEFORE the write, so it outlives a kill. */
const snap = {
  mcp_servable: en.mcp_servable,
  mcp_scanned_at: en.mcp_scanned_at,
  mcp_iso_longest_run: en.mcp_iso_longest_run,
  mcp_scan_sources: en.mcp_scan_sources,
};
writeFileSync(RECOVERY, JSON.stringify({
  id: en.id, slug: en.slug, at: new Date().toISOString(),
  content_md: original, scan: snap,
}, null, 2), "utf8");
try {
  ok("BEFORE: english servable", (await gate(en.id)) === true);
  for (const t of tr) ok("BEFORE: " + t.language + " servable", (await gate(t.id)) === true);

  await setBody(en.id, original + " x");
  console.log("");
  console.log("  -- one character appended to the ENGLISH body --");
  console.log("");

  /* ATTRIBUTION, NOT JUST A VERDICT.
   *
   * English carries NO en_content_hash -- the provenance clause exempts
   * `l.language = 'en'` outright -- so whatever withholds it, it is not the
   * clause under test. Asserting that directly is stronger than asserting the
   * gate stayed true, and it is true regardless of what the edit trigger did.
   */
  const enNow = (await get("lessons?select=en_content_hash,mcp_servable&id=eq." + en.id))[0];
  ok("AFTER: the provenance clause cannot touch English",
     enNow.en_content_hash === null,
     "no en_content_hash, and the clause short-circuits on language = en");
  ok("AFTER: english withheld only by the edit trigger",
     enNow.mcp_servable === false,
     "trg_lessons_clear_mcp_servable fired, which is expected and not this gate");

  /* The translations are the measurement. Their mcp_servable is UNTOUCHED --
   * the trigger fired on the English row, not on theirs -- so a false gate can
   * only come from the provenance clause. That is what makes this evidence
   * rather than an observation. */
  for (const t of tr) {
    const tNow = (await get("lessons?select=mcp_servable&id=eq." + t.id))[0];
    const g = await gate(t.id);
    ok("AFTER: " + t.language + " withheld BY THE PROVENANCE CLAUSE",
       g === false && tNow.mcp_servable === true,
       "scanner verdict still true, so the clause is what withheld it");
  }
} finally {
  const back = await setBody(en.id, original);
  restored = back.content_md === original;
  console.log("");
  ok("RESTORED: the english body is byte-identical", restored);
  if (restored) {
    /* The trigger wiped the scanner verdict again on that restore. Put it
     * back, or the lesson stays dark and this script becomes the outage it
     * was written to prevent. */
    const fixed = await restoreScanState(en.id, snap);
    ok("RESTORED: scanner verdict put back",
       fixed.mcp_servable === snap.mcp_servable &&
       fixed.mcp_iso_longest_run === snap.mcp_iso_longest_run,
       "mcp_servable=" + fixed.mcp_servable + ", run=" + fixed.mcp_iso_longest_run);
    ok("RESTORED: english servable again", (await gate(en.id)) === true);
    for (const t of tr) ok("RESTORED: " + t.language + " servable again", (await gate(t.id)) === true);
    if (!existsSync(RECOVERY)) { /* nothing to remove */ }
    else { unlinkSync(RECOVERY); }
    ok("RECOVERY FILE removed", !existsSync(RECOVERY));
  } else {
    console.error("");
    console.error("  THE ORIGINAL BODY WAS NOT RESTORED. The recovery file is KEPT at");
    console.error("  " + RECOVERY);
    console.error("  Run: node --dns-result-order=ipv4first scripts/verify-367.mjs --recover");
  }
}

console.log("");
if (fail) {
  console.log("VERIFY 367 FAILED (" + fail + "). The provenance clause is not doing what 367 claims.");
  process.exit(1);
}
console.log("VERIFY 367 PASSED. The clause withholds a translation when its English moves,");
console.log("leaves the English alone, and the corpus is exactly as it was.");
