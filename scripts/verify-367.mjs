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
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--slug", "--verbose"]);
const argv = process.argv.slice(2);
let SLUG = null, VERBOSE = false;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) continue;
  if (!KNOWN.has(a)) { console.error("Unrecognised flag: " + a + ". This script rolls back; it takes no --apply."); process.exit(2); }
  if (a === "--slug") SLUG = argv[++i];
  if (a === "--verbose") VERBOSE = true;
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

/* Pick a subject: an English lesson whose translations are ALL servable right
 * now and carry a provenance stamp. Chosen from the data rather than named,
 * so the control keeps working after any one lesson is repaired -- the
 * "a control pinned to a defect forbids repairing it" rule. */
const cols = "id,slug,language,lesson_group_id,content_md,en_content_hash,en_content_hash_basis";
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
try {
  ok("BEFORE: english servable", (await gate(en.id)) === true);
  for (const t of tr) ok("BEFORE: " + t.language + " servable", (await gate(t.id)) === true);

  await setBody(en.id, original + " x");
  console.log("");
  console.log("  -- one character appended to the ENGLISH body --");
  console.log("");

  ok("AFTER: english STILL servable", (await gate(en.id)) === true,
     "the gate must not withhold the source");
  for (const t of tr) {
    ok("AFTER: " + t.language + " withheld", (await gate(t.id)) === false,
       "the provenance clause fired");
  }
} finally {
  const back = await setBody(en.id, original);
  restored = back.content_md === original;
  console.log("");
  ok("RESTORED: the english body is byte-identical", restored);
  if (restored) {
    ok("RESTORED: english servable again", (await gate(en.id)) === true);
    for (const t of tr) ok("RESTORED: " + t.language + " servable again", (await gate(t.id)) === true);
  } else {
    console.error("");
    console.error("  THE ORIGINAL BODY WAS NOT RESTORED. Restore it by hand before anything else.");
  }
}

console.log("");
if (fail) {
  console.log("VERIFY 367 FAILED (" + fail + "). The provenance clause is not doing what 367 claims.");
  process.exit(1);
}
console.log("VERIFY 367 PASSED. The clause withholds a translation when its English moves,");
console.log("leaves the English alone, and the corpus is exactly as it was.");
