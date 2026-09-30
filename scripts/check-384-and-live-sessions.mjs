#!/usr/bin/env node
/**
 * check-384-and-live-sessions.mjs -- verify migration 384, and name every exam session in progress.
 *
 * READ-ONLY. Unknown flags exit 2. No writes of any kind.
 *
 * ============ WHY THE SESSION QUESTION IS A DEPLOY GATE AND NOT A CURIOSITY ============
 *
 * `get-active-exam-session` re-serves a recorded form. Once the option-order change is live, a candidate who
 * resumes gets their options in the seeded order -- which is the RIGHT order for every attempt started after
 * the deploy, and a DIFFERENT order from the one already on their screen for an attempt started before it.
 * Deploying mid-exam moves the options under a candidate who is part-way through.
 *
 * Grading is unaffected -- both graders compare option id SETS, and a saved answer is an id. So the cost is
 * confusion, not a wrong score. That is still the worst moment to introduce it.
 *
 * ============ "IN PROGRESS" IS THREE CONDITIONS, AND THE THIRD IS COMPUTED ============
 *
 *   started        every row in quiz_sessions has a started_at
 *   not submitted  completed_at IS NULL -- the same predicate get-active-exam-session:197 uses
 *   not expired    started_at + the certification's exam_duration_minutes is still in the future
 *
 * The third is not a column. Expiry is computed per session from its certification's duration, exactly as
 * get-active-exam-session:273-277 computes it, with the same 60-second grace. A session past its expiry is
 * reported SEPARATELY rather than being dropped: it is not a deploy blocker, but "there are no live sessions"
 * and "there are four expired ones nobody has closed" are different facts and only one of them is about
 * deploying.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, getAllIn } from "./_pg.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const KEY = requireKey(HERE);
const LATE_GRACE_SECONDS = 60;   /* matches get-active-exam-session:121 and score-mock-exam */

/* ---------------------------------------------------------------- 1. migration 384 */
console.log("1. MIGRATION 384 -- quiz_questions.options_fixed_order");
console.log("");
let m384ok = true;
const fail = (s) => { console.log("   FAIL  " + s); m384ok = false; };

/* ZERO ROWS MARKED -- counted BY THE SERVER, never by fetching rows. */
async function countWhere(filter) {
  const res = await fetch(
    "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1/quiz_questions?select=id&limit=1" + filter,
    { headers: { apikey: KEY, Authorization: "Bearer " + KEY, Prefer: "count=exact" } },
  );
  if (!res.ok) throw new Error(res.status + " " + (await res.text()).slice(0, 200));
  const cr = res.headers.get("content-range") || "";
  const n = Number(String(cr).split("/")[1]);
  if (!Number.isFinite(n)) throw new Error("no exact count in content-range: " + cr);
  return n;
}
/* THE COLUMN EXISTS -- probed with a FILTER on it, not by fetching rows.
 *
 * My first version did `getAll(... &limit=0)` and reported "the column is NOT selectable". That was wrong in
 * the most instructive way available: `getAll` pages with Range headers and asserts its count, so `limit=0`
 * collected 0 rows against a server count of 28,196 and tripped the short-read assertion -- which is the exact
 * hazard CLAUDE.md records for passing a `limit` through this helper. Worse, the failure message CONTAINED the
 * proof that the column exists: PostgREST had accepted `options_fixed_order` in the select and answered with
 * a count. A missing column 400s naming the column.
 *
 * So the probe is a filter that can match nothing, and a 400 mentioning the column is the honest negative --
 * the same shape check-migration-state uses after being caught by this once already. */
let colOk = false;
try {
  await countWhere("&options_fixed_order=is.false");
  colOk = true;
} catch (e) {
  const msg = String((e && e.message) || e);
  if (/options_fixed_order/.test(msg)) fail("the column does NOT exist: " + msg.slice(0, 160));
  else fail("the probe COULD NOT RUN, which is not the same as a failure: " + msg.slice(0, 160));
}
if (colOk) console.log("   ok    the column exists and is filterable");

let total = null, marked = null, nulls = null;
try {
  total = await countWhere("");
  marked = await countWhere("&options_fixed_order=is.true");
  nulls = await countWhere("&options_fixed_order=is.null");
} catch (e) { fail("the counts could not be read: " + String(e.message).slice(0, 140)); }
if (total !== null) {
  console.log("   ok    rows in quiz_questions        " + total);
  if (marked === 0) console.log("   ok    rows marked options_fixed_order  0");
  else fail("rows marked options_fixed_order: " + marked + " -- nothing should be marked yet");
  /* NOT NULL, asked as a PROPERTY of the data rather than of the catalogue: if the column were nullable it
   * would have been added as NULL on every existing row, so a null count of zero on a populated table is the
   * evidence PostgREST can give. A nullable column with a default would also show zero, so the DEFAULT is
   * probed separately below -- one of these alone is not the claim. */
  if (nulls === 0) console.log("   ok    rows with a NULL value           0   (consistent with NOT NULL)");
  else fail("rows with NULL: " + nulls + " -- the column is nullable or the backfill missed rows");
}

/* THE DEFAULT -- the only one of the four that cannot be read through PostgREST. Reported as UNVERIFIABLE
 * rather than assumed from the migration file, because a migration says what someone meant to do on a day. */
console.log("   UNVERIFIABLE BY THIS PROBE:  the column DEFAULT.");
console.log("         PostgREST exposes no catalogue, and `mcp` is not PostgREST-exposed, so `column_default`");
console.log("         cannot be read from here. What IS evidence: 384's own DO block asserted the default is");
console.log("         false and that is_nullable = 'NO', and it COMMITTED -- an aborted migration writes");
console.log("         nothing. Juan can confirm in one query if you want it independently:");
console.log("           select is_nullable, column_default from information_schema.columns");
console.log("            where table_schema='public' and table_name='quiz_questions'");
console.log("              and column_name='options_fixed_order';");
console.log("");
console.log("   VERDICT  " + (m384ok
  ? "384 is applied and behaving: selectable, no NULLs, zero rows marked."
  : "384 IS NOT AS EXPECTED -- see the failures above. Do not deploy the functions."));
console.log("");

/* ---------------------------------------------------------------- 2. sessions in progress */
console.log("2. EXAM SESSIONS IN PROGRESS  (started, completed_at IS NULL, not past expiry)");
console.log("");
const open = await getAll(KEY,
  "quiz_sessions?select=id,user_id,certification_id,kind,started_at,completed_at,closed_reason" +
  "&completed_at=is.null&order=started_at.desc");
const certIds = [...new Set(open.map((s) => s.certification_id).filter(Boolean))];
const certs = certIds.length
  ? await getAllIn(KEY, "certifications", "id,code,exam_duration_minutes", "id", certIds, "&order=code")
  : [];
const certOf = new Map(certs.map((c) => [c.id, c]));
const now = Date.now();
const live = [], expired = [], noCert = [];
for (const s of open) {
  const c = certOf.get(s.certification_id);
  const mins = (c && c.exam_duration_minutes) ?? 60;
  const started = new Date(s.started_at).getTime();
  if (!Number.isFinite(started)) { noCert.push({ s, why: "unparseable started_at" }); continue; }
  const expiresAt = started + mins * 60 * 1000;
  const secondsRemaining = (expiresAt - now) / 1000;
  const row = { s, cert: c ? c.code : "(unknown cert)", mins, expiresAt, secondsRemaining };
  if (secondsRemaining < -LATE_GRACE_SECONDS) expired.push(row); else live.push(row);
}
const iso = (t) => new Date(t).toISOString().replace("T", " ").replace(/\..*/, "Z");
console.log("   open sessions (completed_at IS NULL)   " + open.length);
console.log("   of those, STILL LIVE                   " + live.length);
console.log("   of those, past expiry + 60s grace      " + expired.length +
  "   (not a deploy blocker; listed so silence is not read as absence)");
console.log("");
if (!live.length) {
  console.log("   NO SESSION IS IN PROGRESS. Deploying now cannot move the options under anyone mid-exam.");
} else {
  console.log("   SESSIONS IN PROGRESS -- DO NOT DEPLOY UNTIL THESE EXPIRE OR ARE SUBMITTED:");
  for (const r of live) {
    console.log("     session " + r.s.id);
    console.log("       kind        " + r.s.kind + "   certification " + r.cert);
    console.log("       started     " + iso(new Date(r.s.started_at).getTime()));
    console.log("       EXPIRES AT  " + iso(r.expiresAt) + "   (" + r.mins + "-minute exam, " +
      Math.max(0, Math.round(r.secondsRemaining / 60)) + " minute(s) remaining)");
  }
  console.log("");
  console.log("   The latest expiry above is when it becomes safe. Grading is unaffected either way -- both");
  console.log("   graders compare option id SETS and a saved answer is an id -- so the cost is a candidate");
  console.log("   watching their options move, not a wrong score.");
}
if (expired.length) {
  console.log("");
  console.log("   PAST EXPIRY, open anyway (" + expired.length + ") -- these are the sweep's business, not this deploy's:");
  for (const r of expired.slice(0, 10)) {
    console.log("     " + r.s.id + "  " + r.s.kind + "  " + r.cert + "  expired " + iso(r.expiresAt));
  }
  if (expired.length > 10) console.log("     ... and " + (expired.length - 10) + " more");
}
if (noCert.length) {
  console.log("");
  console.log("   UNCLASSIFIABLE (" + noCert.length + ") -- reported rather than counted either way:");
  for (const x of noCert) console.log("     " + x.s.id + "  " + x.why);
}
