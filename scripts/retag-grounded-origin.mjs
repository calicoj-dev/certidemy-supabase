#!/usr/bin/env node
/**
 * PROMPT-108 s1.2: set item_origin='grounded' on the approved grounded groups.
 * WRITES with `--apply`; dry by default. Unknown flags exit 2. REQUIRES migration 386.
 *
 * BY GROUP, not by row: the English row carries the verdict and the siblings are translations of the
 * item that was read, so they share its origin. A group retagged on one side only would put the
 * English in a form and leave the other two languages out of the pool.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";

let APPLY = false, CERT = null;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  const m = a.match(/^--cert=(.+)$/);
  if (m) { CERT = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --cert=<CODE>, --apply (dry by default).");
  process.exit(2);
}

if (!CERT) {
  /* NO CERTIFICATION DEFAULT (PROMPT-135 s3). This defaulted to a literal, so a caller that
   * forgot --cert operated on a different certification and said nothing. */
  console.error("--cert=<CODE> is required. retag-grounded-origin.mjs used to default to a single\n" +
    "certification, which is how the rollback command came to offer AIMS-F after an ISMS-IA cutover.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const LANGS = ["en", "es-419", "pt-BR"];
const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

const cert = (await getAll(KEY, "certifications?select=id&code=eq." + CERT))[0];
if (!cert) { console.error("No certification " + CERT); process.exit(2); }
const SEL = "id,language,status,pool,visibility,is_exam_scope,retired_at,item_origin,question_group_id," +
  "question_text,options,correct_answer";
const fetchAll = () => getAll(KEY, "quiz_questions?select=" + SEL + "&certification_id=eq." + cert.id + "&order=id");
let all = await fetchAll();
const ig = new Map((await getAll(KEY, "item_grounding?select=question_id,review_verdict&order=question_id"))
  .map((g) => [g.question_id, g]));

/* the groups to retag: an approved English row with an accept verdict */
const groups = new Set();
for (const r of all) {
  if (r.language !== "en" || r.status !== "approved" || r.retired_at !== null) continue;
  const g = ig.get(r.id);
  if (!g || g.review_verdict !== "accept") continue;
  if (!r.question_group_id) { console.error("  SKIP " + r.id.slice(0, 8) + ": accepted but has no group"); continue; }
  groups.add(r.question_group_id);
}
const targets = all.filter((r) => r.question_group_id && groups.has(r.question_group_id) &&
  r.retired_at === null && LANGS.includes(r.language));

console.log("RETAG item_origin='grounded'   " + CERT + (APPLY ? "   --apply" : "   dry run (default)"));
console.log("  groups (approved English row with an accept)   " + groups.size);
console.log("  rows in those groups                           " + targets.length);
for (const l of LANGS) {
  const mine = targets.filter((r) => r.language === l);
  const by = {};
  for (const r of mine) by[r.item_origin] = (by[r.item_origin] || 0) + 1;
  console.log("    " + l.padEnd(7) + " " + String(mine.length).padStart(4) + "   from " + JSON.stringify(by));
}
const already = targets.filter((r) => r.item_origin === "grounded").length;
console.log("  already 'grounded'                             " + already);

const ids = new Set(targets.map((r) => r.id));
const canon = (rows) => createHash("sha256").update(rows.filter((r) => !ids.has(r.id))
  .map((r) => JSON.stringify([r.id, r.status, r.pool, r.visibility, r.is_exam_scope, r.retired_at,
    r.item_origin, r.question_text, r.options, r.correct_answer]))
  .sort().join(String.fromCharCode(10))).digest("hex");
const before = canon(all);
console.log("  checksum over the " + (all.length - ids.size) + " row(s) this batch may NOT touch: " + before.slice(0, 16));

if (!APPLY) {
  console.log("");
  console.log("DRY RUN. Nothing written. Needs migration 386 to have run, or the CHECK refuses with 23514.");
  process.exit(0);
}

let wrote = 0, refused = 0;
for (const t of targets) {
  const r = await fetch(REST_URL + "/quiz_questions?id=eq." + t.id, { method: "PATCH", headers: H,
    body: JSON.stringify({ item_origin: "grounded", status: t.status, visibility: t.visibility,
      pool: t.pool, is_exam_scope: t.is_exam_scope }) });
  if (!r.ok) {
    const body = (await r.text()).slice(0, 160);
    if (/23514/.test(body)) {
      console.error("");
      console.error("REFUSED BY THE CHECK (23514). Migration 386 has not run; nothing further attempted.");
      console.error("  " + body);
      process.exit(2);
    }
    console.error("  PATCH FAILED " + t.id.slice(0, 8) + "  " + body); refused++; continue;
  }
  wrote++;
}

all = await fetchAll();
const after = canon(all);
const byId = new Map(all.map((r) => [r.id, r]));
let bad = 0;
for (const t of targets) {
  const q = byId.get(t.id);
  if (!q || q.item_origin !== "grounded" || q.status !== t.status || q.pool !== t.pool ||
    q.visibility !== t.visibility || q.is_exam_scope !== t.is_exam_scope) {
    console.error("  POST: " + t.id.slice(0, 8) + " " + JSON.stringify(q && {
      item_origin: q.item_origin, status: q.status, pool: q.pool, visibility: q.visibility,
      is_exam_scope: q.is_exam_scope })); bad++;
  }
}
console.log("");
console.log("  retagged " + wrote + " of " + targets.length + "   failed " + refused +
  "   read-back failures " + bad);
console.log("  untouched-row checksum   " + (before === after ? "UNCHANGED " + after.slice(0, 16)
  : "CHANGED -- before " + before.slice(0, 16) + " after " + after.slice(0, 16)));
for (const l of LANGS) {
  console.log("    " + l.padEnd(7) + " item_origin='grounded' now " +
    all.filter((r) => r.language === l && r.item_origin === "grounded" && r.retired_at === null).length);
}
if (bad || refused || before !== after || wrote !== targets.length) process.exitCode = 2;
