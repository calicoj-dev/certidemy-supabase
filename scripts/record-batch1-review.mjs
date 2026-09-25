#!/usr/bin/env node
/**
 * record-batch1-review.mjs -- record the review that batch cda6698a already had.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 * ============ THE REVIEW IS NOT BEING PERFORMED HERE. IT IS BEING RECORDED ====
 *
 * PROMPT-55, -56 and -57 are the read: thirty renderings read in full, per-block
 * rulings, hand-written replacement strings, and two clause-word substitutions
 * ruled on measurement. Every byte written by cda6698a has a named origin in
 * `build-batch1-final.mjs` -- 11 STRING, 9 EMITTED, 7 EMITTED+FIX, 1
 * EMITTED+PARTIAL, 4 FIELDWISE, zero model calls.
 *
 * What is missing is the ROW that says so, and without it the gate is right to
 * withhold: an unreviewed translation is withheld, which is the design working.
 *
 * ============ ASSERT, NEVER STAMP ============
 *
 * This writes `lesson_translation_reviews` and NOTHING ELSE. In particular it
 * does not touch `lessons.en_content_hash`, which is the gate's own stored value
 * and belongs to the generator path alone -- CLAUDE.md's rule, and the defect it
 * was written for was clearance scripts recomputing that hash from current
 * source and thereby blindfolding the gate they were about to pass.
 *
 * A review row's OWN hashes are a different object: writing them IS the review.
 * But they are still asserted rather than trusted:
 *
 *   1. the live translated body must be byte-identical to what cda6698a wrote,
 *      read back out of BATCH1-FINAL.json -- so the review is about the text
 *      that was actually read, not whatever the row holds today;
 *   2. the live English must still contain the `english_source` the batch was
 *      built against;
 *   3. the two hashes are computed with the FUNCTIONS THE GATE USES, which are
 *      NOT the same function: the review arm compares
 *      `en_hash = left(md5(en.content_md), 8)` against
 *      `tr_hash = public.translation_hash(l.content_md)`. Two hash columns on
 *      one table computed two ways -- CLAUDE.md records that as a trap and it is
 *      still live, so each is taken from the predicate rather than from habit.
 *
 * Any mismatch refuses the WHOLE batch. A partial clearance that reads as a
 * success is the failure this file exists to avoid.
 *
 * ============ WHAT THIS WILL NOT FIX, STATED BEFORE IT RUNS ============
 *
 * Eight of the sixteen will still be withheld afterwards, by `provenance_stale`
 * rather than by review: `01-03`, `03-02`, `03-04` and `05-02` had their ENGLISH
 * edited today, and `lessons.en_content_hash` still carries migration 367's
 * pre-edit stamp. That is a stamp this script may not write. It is reported, not
 * repaired.
 */
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". DRY BY DEFAULT; --apply to write.");
    process.exit(2);
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
const REST = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };

const BATCH = "cda6698a-ade7-49dd-9d61-01e5d538bb88";
const REVIEWER = "director read (PROMPT-55/56/57), batch " + BATCH.slice(0, 8);
const NOTE = "Thirty renderings read in full across PROMPT-55, -56 and -57. Every byte has a " +
             "named origin in build-batch1-final.mjs; zero model calls. Clause-word " +
             "substitutions ruled on distinct-reference measurement (G5).";

async function rest(path, init) {
  let last;
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(REST + "/" + path, { ...(init || {}),
        headers: { ...H, ...((init || {}).headers || {}) }, signal: AbortSignal.timeout(45000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 160));
      return t ? JSON.parse(t) : null;
    } catch (e) { last = e; }
    await new Promise((s) => setTimeout(s, 400 * (i + 1)));
  }
  throw last;
}

const spec = JSON.parse(readFileSync(join(ROOT, "BATCH1-FINAL.json"), "utf8"));
const slugs = [...new Set(spec.rows.map((r) => r.slug))];

/* Live rows, plus each group's English. */
const rows = await rest("lessons?select=id,slug,language,lesson_group_id,content_md,translation_batch_id" +
  "&slug=in.(" + slugs.join(",") + ")&order=slug,language");
const enOf = new Map(rows.filter((r) => r.language === "en").map((r) => [r.lesson_group_id, r]));
const targets = rows.filter((r) => r.language !== "en");

/* Hashes computed by the SAME FUNCTIONS THE GATE USES -- server side, so there
 * is no second implementation to drift. */
async function trHash(text) {
  return rest("rpc/translation_hash", { method: "POST", body: JSON.stringify({ p_a: text }) });
}
/* The review arm's en_hash is `left(md5(en.content_md), 8)` -- PLAIN md5, not
 * translation_hash, and the two are different values on the same text. There is
 * no RPC for it, so it is computed here.
 *
 * CLAUDE.md records a 41-of-41 FALSE ALARM from exactly this move: recomputing a
 * stored hash with a formula that merely looks equivalent. So the equivalence is
 * PROVED against a real body rather than assumed, and the proof runs before
 * anything is written. A pair that stops agreeing -- a normalisation change, a
 * server encoding change -- refuses the run instead of writing sixteen review
 * rows the gate will reject. */
const md5_8 = (text) => createHash("md5").update(text, "utf8").digest("hex").slice(0, 8);
const MD5_CONTROL = { slug: "03-03-documented-information", expect: "65c2c508" };

{
  const c = rows.find((x) => x.language === "en" && x.slug === MD5_CONTROL.slug);
  if (!c) { console.error("MD5 CONTROL: " + MD5_CONTROL.slug + " English row not found; cannot prove the hash."); process.exit(2); }
  const got = md5_8(c.content_md);
  if (got !== MD5_CONTROL.expect) {
    console.error("MD5 CONTROL FAILED: computed " + got + ", Postgres md5 gives " + MD5_CONTROL.expect + ".");
    console.error("  Node and Postgres no longer agree on this text. Nothing written.");
    process.exit(2);
  }
  console.log("");
  console.log("  md5 control: node and Postgres agree on " + MD5_CONTROL.slug + " (" + got + ")");
}
console.log("");
console.log("RECORD THE BATCH 1 REVIEW -- " + targets.length + " translated row(s)");
console.log("  reviewer of record: " + REVIEWER);
console.log("  writes lesson_translation_reviews ONLY; no lessons column is touched");
console.log("DENOMINATOR: " + targets.length + " row(s) examined");
console.log("");

const staged = [], problems = [];
for (const r of targets) {
  const tag = r.slug + " " + r.language;
  const en = enOf.get(r.lesson_group_id);
  if (!en) { problems.push(tag + ": no English sibling"); continue; }

  /* 1. the live body must be what the batch wrote */
  const planned = spec.rows.filter((x) => x.slug === r.slug && x.language === r.language);
  if (!planned.length) { problems.push(tag + ": not in BATCH1-FINAL.json"); continue; }
  const missing = planned.filter((x) => !r.content_md.includes(x.to_block));
  if (missing.length) {
    problems.push(tag + ": " + missing.length + " of " + planned.length +
      " written block(s) are no longer in the live body -- the row has moved since cda6698a");
    continue;
  }
  /* and it must carry the batch stamp */
  if (r.translation_batch_id !== BATCH) {
    problems.push(tag + ": translation_batch_id is " + r.translation_batch_id + ", not this batch");
    continue;
  }
  /* 2. the English the batch was built against must still be there */
  const staleEn = planned.filter((x) => x.english_source && !en.content_md.includes(x.english_source));
  if (staleEn.length) {
    problems.push(tag + ": the English has moved since the batch was built");
    continue;
  }
  staged.push({ r, en, tag });
}

if (problems.length) {
  console.log("REFUSING -- nothing written:");
  for (const p of problems) console.log("  " + p);
  process.exit(1);
}

/* 3. the two hashes, each from the predicate that consumes it */
for (const s of staged) {
  s.tr_hash = await trHash(s.r.content_md);
  s.en_hash = md5_8(s.en.content_md);
  if (typeof s.tr_hash !== "string" || !/^[0-9a-f]{8}$/.test(s.tr_hash)) {
    problems.push(s.tag + ": translation_hash returned " + JSON.stringify(s.tr_hash));
  }
  if (typeof s.en_hash !== "string" || !/^[0-9a-f]{8}$/.test(s.en_hash)) {
    problems.push(s.tag + ": en hash returned " + JSON.stringify(s.en_hash));
  }
}
if (problems.length) {
  console.log("REFUSING -- a hash could not be computed with the function the gate uses:");
  for (const p of problems) console.log("  " + p);
  console.log("");
  console.log("  An unverifiable hash is a third state, not a zero. Nothing written.");
  process.exit(1);
}

for (const s of staged) console.log("  ok    " + s.tag.padEnd(50) + "en " + s.en_hash + "  tr " + s.tr_hash);

if (!APPLY) {
  console.log("");
  console.log("DRY RUN. Nothing written. Re-run with --apply.");
  process.exit(0);
}

const stampedAt = new Date().toISOString();
const payload = staged.map((s) => ({
  lesson_id: s.r.id, reviewed_at: stampedAt, reviewed_by: REVIEWER,
  verdict: "approved", en_hash: s.en_hash, tr_hash: s.tr_hash,
  tr_hash_basis: "observed", note: NOTE,
}));
await rest("lesson_translation_reviews", {
  method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(payload),
});

/* READ BACK THROUGH THE GATE, never off the column. */
console.log("");
let serving = 0;
const still = [];
for (const s of staged) {
  const ok = await rest("rpc/lesson_body_is_servable", {
    method: "POST", body: JSON.stringify({ p_lesson_id: s.r.id }) });
  if (ok) { serving++; continue; }
  const why = await rest("rpc/lesson_withholding_reason", {
    method: "POST", body: JSON.stringify({ p_lesson_id: s.r.id }) }).catch(() => "unreadable");
  still.push(s.tag + "  " + why);
}
console.log("  " + payload.length + " review row(s) written");
console.log("  serving now: " + serving + " of " + staged.length);
if (still.length) {
  console.log("");
  console.log("  STILL HELD, and by what:");
  for (const t of still) console.log("      " + t);
}
