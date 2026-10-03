#!/usr/bin/env node
/**
 * Record a director translation review against the CURRENT English hash.
 * WRITES with `--apply`; dry by default. Unknown flags exit 2.
 *
 * The hash is computed here from the English row as it is NOW, by the same `itemHash8` verify-cert
 * uses -- not copied from an argument. A review recorded against a hash nobody recomputed is exactly
 * the stale approval that sent 87c740c9 back to retired.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { itemHash8 } from "./lib/item-hash.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
let APPLY = false, CERT = "AIMS-F", REVIEWER = null, RULED = null;
const IDS = [];
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--apply") { APPLY = true; continue; }
  let m = a.match(/^--cert(?:=(.+))?$/);
  if (m) { CERT = m[1] || argv[++i]; continue; }
  m = a.match(/^--reviewer=(.+)$/);
  if (m) { REVIEWER = m[1]; continue; }
  m = a.match(/^--ruled-in=(.+)$/);
  if (m) { RULED = m[1]; continue; }
  if (a.startsWith("--")) {
    console.error("Unrecognised flag: " + a +
      ". Known: --cert, --reviewer=, --ruled-in=, --apply. Positional args are uuid prefixes.");
    process.exit(2);
  }
  IDS.push(a);
}
if (!IDS.length) { console.error("Name at least one group by uuid prefix."); process.exit(2); }
if (!REVIEWER || !RULED) { console.error("--reviewer= and --ruled-in= are both required."); process.exit(2); }

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("No certification " + CERT); process.exit(2); }
const all = await getAll(KEY, "quiz_questions?select=id,language,question_group_id,question_text," +
  "options,correct_answer,explanation,item_origin,status,retired_at&certification_id=eq." + cert.id + "&order=id");
const existing = await getAll(KEY, "item_translation_reviews?select=question_id,en_hash,verdict,reviewed_at" +
  "&order=question_id");
const prior = new Map();
for (const r of existing) {
  const p = prior.get(r.question_id);
  if (!p || r.reviewed_at > p.reviewed_at) prior.set(r.question_id, r);
}

const plan = [];
console.log("RECORD TRANSLATION REVIEW   " + CERT + (APPLY ? "   --apply" : "   dry run (default)"));
console.log("  reviewer " + REVIEWER + "   ruled_in " + RULED);
for (const p of IDS) {
  const en = all.find((r) => String(r.id).startsWith(p) && r.language === "en");
  if (!en) { console.error("  " + p + "  NO ENGLISH ROW"); process.exitCode = 2; continue; }
  const hash = itemHash8(en);
  const sibs = all.filter((r) => r.question_group_id && r.question_group_id === en.question_group_id &&
    r.language !== "en");
  console.log("  " + p + "   current en_hash " + hash + "   " + sibs.length + " sibling(s)");
  for (const s of sibs) {
    const was = prior.get(s.id);
    console.log("    " + s.language.padEnd(7) + s.id.slice(0, 8) +
      "   prior " + (was ? was.verdict + " @ " + was.en_hash : "(none)") +
      (was && was.en_hash === hash ? "   ALREADY CURRENT" : "   -> would record approved @ " + hash));
    if (!(was && was.en_hash === hash && was.verdict === "approved")) plan.push({ s, hash });
  }
}
console.log("");
console.log("  rows to record " + plan.length);
if (!APPLY) { console.log("\nDRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

const STAMP = new Date().toISOString();
let wrote = 0;
for (const x of plan) {
  const r = await fetch(REST_URL + "/item_translation_reviews", { method: "POST",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ question_id: x.s.id, en_hash: x.hash, verdict: "approved",
      reviewed_by: REVIEWER, reviewed_at: STAMP, note: "ruled " + RULED }) });
  if (!r.ok) { console.error("  INSERT FAILED " + x.s.id.slice(0, 8) + "  " + (await r.text()).slice(0, 180)); continue; }
  wrote++;
}
/* read back: the newest review per row must be `approved` against the hash we computed */
const after = await getAll(KEY, "item_translation_reviews?select=question_id,en_hash,verdict,reviewed_at&order=question_id");
const newest = new Map();
for (const r of after) {
  const p = newest.get(r.question_id);
  if (!p || r.reviewed_at > p.reviewed_at) newest.set(r.question_id, r);
}
let bad = 0;
for (const x of plan) {
  const n = newest.get(x.s.id);
  if (!n || n.verdict !== "approved" || n.en_hash !== x.hash) { console.error("  POST: " + x.s.id.slice(0, 8)); bad++; }
}
console.log("");
console.log("  recorded " + wrote + " of " + plan.length + "   read-back failures " + bad);
if (bad || wrote !== plan.length) process.exitCode = 2;
