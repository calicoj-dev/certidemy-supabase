#!/usr/bin/env node
/**
 * verify-382-cap.mjs -- watch the 60-per-day practice cap actually refuse.
 *
 * `--apply` to run it. DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ WHY THIS EXISTS ============
 *
 * Migration 382's post-conditions prove the ARITHMETIC -- a fresh learner has 60,
 * a null learner is exempt -- without writing a row. They cannot prove the
 * REFUSAL, because that needs a 61st insert.
 *
 * A cap nobody has watched refuse is the same object as a count assertion nobody
 * has watched fail, and this repository has been caught by that shape enough
 * times to stop shipping gates on their arithmetic alone.
 *
 * ============ IT IS NET-ZERO, NOT READ-ONLY, AND THAT NEEDS A RECOVERY FILE ============
 *
 * It inserts 60 rows against a SYNTHETIC learner id, asserts the 61st is refused,
 * and deletes its own rows. PostgREST gives no transaction to hold, so a kill
 * between the insert and the delete would leave 60 rows behind.
 *
 * So the ids are written to a recovery file BEFORE the first insert and deleted
 * only after the cleanup verifies. If that file exists at startup the script
 * refuses to run and prints `--recover`. The thing that lets you undo must
 * outlive the process that needs undoing.
 *
 * The synthetic learner is a fixed uuid that is not a real account -- which is
 * possible only because 382 deliberately put no foreign key on `created_by`.
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";

/* ============ EXIT VIA exitCode, NOT process.exit() ============
 *
 * `process.exit()` with fetch keep-alive sockets still open ABORTS libuv on Windows, and the abort
 * REPLACES the exit code -- so a caller reads a different number from the one that was set. This
 * repository has the defect recorded twice against its own deploy wrapper, and the first version of
 * this script reproduced it: the pre-flight refusal printed the right message and then aborted.
 *
 * Everything runs inside `main()`, so a refusal is a `return` and Node drains its sockets. */
let BAIL = 0;
const main = async () => {
const KNOWN = new Set(["--apply", "--recover"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". DRY BY DEFAULT; --apply to run, --recover to clean up.");
    { BAIL = 2; return; }
  }
}
const APPLY = process.argv.includes("--apply");
const RECOVER = process.argv.includes("--recover");

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const RECOVERY = join(ROOT, "VERIFY-382-RECOVERY.json");
/* Fixed, so a leftover row is identifiable by eye and by query -- and VALID HEX, which the first
 * version was not: `0000000cap00` carries a `p`, so Postgres answered 22P02 invalid input syntax.
 * `4382` in the version field and `caf` at the end keep it recognisable without leaving hex. */
const SYNTHETIC = "00000000-0000-4382-8000-00000000caf0";

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };
const rest = async (path, init) => {
  const r = await fetch(REST_URL + "/" + path, { ...init, headers: { ...H, ...(init?.headers ?? {}) } });
  const t = await r.text();
  return { ok: r.ok, status: r.status, body: t ? (() => { try { return JSON.parse(t); } catch { return t; } })() : null };
};

async function cleanup(ids) {
  if (!ids.length) return 0;
  let gone = 0;
  for (const id of ids) {
    const r = await rest("quiz_questions?id=eq." + id, { method: "DELETE" });
    if (r.ok) gone++;
  }
  /* read back rather than trusting the delete returned no error */
  const left = await getAll(KEY, "quiz_questions?select=id&created_by=eq." + SYNTHETIC + "&order=id");
  return { gone, left: left.length };
}

if (RECOVER) {
  if (!existsSync(RECOVERY)) { console.log("no recovery file; nothing to clean up."); { BAIL = 0; return; } }
  const prior = JSON.parse(readFileSync(RECOVERY, "utf8"));
  const res = await cleanup(prior.ids || []);
  console.log("recovered: deleted " + res.gone + ", remaining under the synthetic learner " + res.left);
  if (res.left === 0) { unlinkSync(RECOVERY); console.log("recovery file removed."); }
  else console.error("ROWS REMAIN. The recovery file is kept.");
  { BAIL = res.left === 0 ? 0 : 1; return; }
}

if (existsSync(RECOVERY)) {
  console.error("A recovery file exists: " + RECOVERY);
  console.error("A previous run did not finish cleaning up. Run with --recover first.");
  { BAIL = 2; return; }
}

/* pre-flight: the column and the function must be there, or this is measuring nothing */
let pre;
try {
  pre = await getAll(KEY, "quiz_questions?select=id,created_by&created_by=eq." + SYNTHETIC + "&order=id");
} catch (e) {
  /* ============ ONE ERROR STRING FOR TWO CAUSES, IN MY OWN PRE-FLIGHT ============
   *
   * The first version printed "Migration 382 is probably not applied" for ANY failure here, and the
   * first real run proved why that is wrong: the column existed, 382 was applied, and Postgres
   * answered 22P02 -- invalid input syntax -- because the synthetic uuid contained a `p`. The message
   * blamed a migration for a typo in this file, and a reader would have gone to re-apply an applied
   * migration. That is the family this repository records for the missing `apikey` header and for
   * IPv6: the error naming the wrong half of the system.
   *
   * So only 42703 -- undefined_column -- is read as an absent column. Anything else is reported as
   * itself, with its code, and does not get a diagnosis attached to it. */
  const msg = String(e.message || "");
  console.error("pre-flight read failed: " + msg.slice(0, 200));
  if (/42703/.test(msg)) {
    console.error("");
    console.error("That is 42703, undefined_column: `quiz_questions.created_by` does not exist, so");
    console.error("migration 382 has not been applied. This script measures nothing without it.");
  } else {
    console.error("");
    console.error("This is NOT evidence that 382 is missing -- the code above is not 42703. It is");
    console.error("reported as itself rather than diagnosed, because guessing a cause here is how a");
    console.error("reader gets sent to re-apply an applied migration.");
  }
  { BAIL = 2; return; }
}
if (pre.length) {
  console.error(pre.length + " row(s) already exist under the synthetic learner. Clean those up first.");
  { BAIL = 2; return; }
}

const certs = await getAll(KEY, "certifications?select=id,code&code=eq.AIE-I");
if (!certs.length) { console.error("AIE-I not found"); { BAIL = 2; return; } }
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code&order=code"))
  .filter((t) => t.certification_id === certs[0].id);
if (!tasks.length) { console.error("AIE-I has no tasks"); { BAIL = 2; return; } }

const row = (i) => ({
  certification_id: certs[0].id,
  task_id: tasks[0].id,
  question_group_id: crypto.randomUUID(),
  item_origin: "generated",
  created_by: SYNTHETIC,
  question_text: "VERIFY-382 synthetic cap probe " + i + ". This row is deleted by the same run.",
  question_type: "single_choice",
  options: [{ id: "a", text: "one" }, { id: "b", text: "two" },
    { id: "c", text: "three" }, { id: "d", text: "four" }],
  correct_answer: ["a"],
  explanation: "Synthetic. VERIFY-382.",
  difficulty: 1,
  language: "en",
});

console.log("VERIFY 382 -- the 60/day practice cap");
console.log("  synthetic learner " + SYNTHETIC);
console.log("  it will insert 60 row(s) through create_practice_questions, assert the 61st is");
console.log("  REFUSED, and delete all 60. Nothing else is touched.");
if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written. Re-run with --apply."); { BAIL = 0; return; } }

/* the recovery file goes down BEFORE the first write */
writeFileSync(RECOVERY, JSON.stringify({ synthetic: SYNTHETIC, started: new Date().toISOString(),
  ids: [], note: "Run verify-382-cap.mjs --recover to delete these." }, null, 2) + "\n", "utf8");

const ids = [];
let fail = 0;
const ok = (l, c, d) => { console.log("  " + (c ? "PASS  " : "FAIL  ") + l + (d ? "   " + d : "")); if (!c) fail++; };
try {
  /* fill to exactly the cap, in two calls, so the per-batch check is exercised twice */
  for (const n of [40, 20]) {
    const r = await rest("rpc/create_practice_questions", {
      method: "POST",
      body: JSON.stringify({ p_questions: Array.from({ length: n }, (_, i) => row(ids.length + i)) }),
    });
    if (!r.ok) throw new Error("fill of " + n + " failed: " + r.status + " " + JSON.stringify(r.body).slice(0, 200));
    ids.push(...(Array.isArray(r.body) ? r.body : []));
    writeFileSync(RECOVERY, JSON.stringify({ synthetic: SYNTHETIC, ids }, null, 2) + "\n", "utf8");
  }
  ok("60 row(s) accepted up to the cap", ids.length === 60, String(ids.length));

  /* the refusal */
  const over = await rest("rpc/create_practice_questions", {
    method: "POST", body: JSON.stringify({ p_questions: [row(999)] }),
  });
  const msg = JSON.stringify(over.body || "");
  ok("the 61st is REFUSED", !over.ok && /daily cap reached/i.test(msg),
    over.ok ? "it was ACCEPTED" : String(over.status) + " " + msg.slice(0, 110));

  /* and nothing was written by the refused call -- a partial write is the worst outcome */
  const after = await getAll(KEY, "quiz_questions?select=id&created_by=eq." + SYNTHETIC + "&order=id");
  ok("the refused call wrote nothing", after.length === 60, String(after.length));

  /* the arithmetic agrees with the refusal */
  const rem = await rest("rpc/practice_daily_remaining", {
    method: "POST", body: JSON.stringify({ p_user: SYNTHETIC }),
  });
  ok("remaining reads 0 at the cap", rem.ok && Number(rem.body) === 0, JSON.stringify(rem.body));
} finally {
  const res = await cleanup(ids);
  console.log("");
  console.log("  cleanup: deleted " + res.gone + " of " + ids.length + ", remaining " + res.left);
  if (res.left === 0) { unlinkSync(RECOVERY); console.log("  recovery file removed."); }
  else { console.error("  ROWS REMAIN -- recovery file kept at " + RECOVERY); fail++; }
}
console.log("");
if (fail) { console.error(fail + " assertion(s) FAILED."); process.exitCode = 1; }
else console.log("The cap refuses, and it was watched doing it.");
};
await main();
if (BAIL) process.exitCode = BAIL;
