#!/usr/bin/env node
/**
 * deploy-courseware-read.mjs -- the deploy path, with its gates inside it.
 *
 * WRITES (it deploys). `--apply`; DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ WHY THIS EXISTS AT ALL ============
 *
 * A PRE-DEPLOY CHECK THAT IS NOT IN THE DEPLOY PATH IS A RULE, NOT A CHECK.
 * The difference is that a check cannot be forgotten.
 *
 * Both halves of the last outage were that distinction:
 *
 *   - the RULE existed. CLAUDE.md records, from 364, that a reachability check
 *     asks has_function_privilege AND has_schema_privilege and names which gate
 *     is shut. Nothing triggered it, so nobody applied it.
 *   - the CHECK existed and covered the wrong path.
 *     check-view-function-grant-gap.sql walks functions named inside VIEWS.
 *     The call site that failed was SQL assembled in TypeScript.
 *
 * Building check-inline-sql-reachable.mjs fixed the second. Leaving it beside
 * the deploy instead of inside it would have left the first.
 *
 * ============ THE SEQUENCE, AND EVERY STEP CAN STOP IT ============
 *
 *   1. deno check          a type error must never reach a deploy
 *   2. reachability gate   every function the inline SQL names, both gates,
 *                          per role. THIS is what the last outage needed.
 *   3. schema precondition the migrations this code REQUIRES have run. A
 *                          function that selects a column the view does not
 *                          have yet answers 400 to every call.
 *   4. deploy              from the PARENT directory, --dns-resolver https,
 *                          both of which this repository has paid for
 *   5. smoke               one unauthenticated call per tool. Not prevention:
 *                          the thing that makes an outage cheap is noticing in
 *                          ten seconds rather than ten minutes.
 *
 * A failure at 2, 3 or 5 prints what to do, not only what broke.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--apply", "--skip-smoke"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". DRY BY DEFAULT; --apply to deploy.");
    process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");
const SKIP_SMOKE = process.argv.includes("--skip-smoke");
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");          // .../supabase
const PARENT = join(ROOT, "..");        // deploy runs from here -- the CLI expects supabase/ beneath it

/* `shell: true` on Windows re-parses the command, and process.execPath is
 * "C:\Program Files\nodejs\node.exe" -- so it split on the space and the
 * step died with 'C:\Program' is not recognized. Only the `supabase` CLI needs
 * a shell for PATH resolution; node is invoked directly. */
function run(label, cmd, args, cwd, useShell = false) {
  console.log("");
  console.log("=== " + label + " ===");
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: useShell });
  /* THREE OUTCOMES, NOT TWO. A step that could not START is not a step that
   * FAILED, and reporting a spawn error as a gate verdict is the
   * one-error-string-for-two-causes shape this repository keeps paying for --
   * it sends the reader to debug privileges when the problem is a path. */
  if (r.error || r.status === null) {
    return { ran: false, ok: false, code: null, why: String(r.error || "killed by signal " + r.signal) };
  }
  return { ran: true, ok: r.status === 0, code: r.status, why: "" };
}

console.log("");
console.log("DEPLOY courseware-read" + (APPLY ? "" : "   (DRY RUN -- gates only, no deploy)"));

const tc = run("1/5  type check", "deno",
  ["check", "--node-modules-dir=auto", "functions/courseware-read/index.ts"], ROOT, true);
if (!tc.ran) {
  console.error("");
  console.error("TYPE CHECK COULD NOT RUN: " + tc.why);
  console.error("That is not a type error. Nothing has been checked and nothing is deployed.");
  process.exit(2);
}
if (!tc.ok) {
  console.error("");
  console.error("TYPE CHECK FAILED. Two fontkit/QRCode import errors are pre-existing in");
  console.error("anything importing _shared/certificate.ts; anything else is new.");
  process.exit(1);
}

const gate = run("2/5  reachability gate", process.execPath,
  ["--dns-result-order=ipv4first", "scripts/check-inline-sql-reachable.mjs"], ROOT);
if (!gate.ran) {
  console.error("");
  console.error("THE GATE COULD NOT RUN: " + gate.why);
  console.error("DEPLOY BLOCKED, but NOT because anything is unreachable -- nothing was");
  console.error("measured. Fix the invocation; do not read this as a privilege problem.");
  process.exit(2);
}
if (gate.code === 2) {
  console.error("");
  console.error("THE GATE RAN AND COULD NOT ANSWER -- DEPLOY BLOCKED.");
  console.error("");
  console.error("  It extracted the function names but could not test reachability, most");
  console.error("  likely because public.mcp_check_reachable() is absent. Run migration 370.");
  console.error("  UNVERIFIABLE is a result, not a pass, and a deploy must not proceed on it.");
  process.exit(2);
}
if (!gate.ok) {
  console.error("");
  console.error("REACHABILITY GATE FAILED -- DEPLOY BLOCKED.");
  console.error("");
  console.error("  Every function the inline SQL names must be reachable by the roles that");
  console.error("  run it, and reaching is TWO gates: EXECUTE on the function AND USAGE on");
  console.error("  its schema. A missing USAGE is refused at the schema door before the ACL");
  console.error("  is read, which is why EXECUTE alone reports clean.");
  console.error("");
  console.error("  DO NOT FIX A MISSING SCHEMA USAGE BY GRANTING SCHEMA USAGE. 365 measured");
  console.error("  that for `public`: 217 functions, 16 SECURITY DEFINER as postgres. 369 did");
  console.error("  the same for `extensions`: 59 functions plus pg_stat_statements. The fix is");
  console.error("  a thin mcp. wrapper that DELEGATES to the original.");
  process.exit(1);
}

const pre = run("3/5  schema precondition", process.execPath,
  ["--dns-result-order=ipv4first", "scripts/check-schema-preconditions.mjs"], ROOT);
if (!pre.ran) {
  console.error("");
  console.error("THE PRECONDITION CHECK COULD NOT RUN: " + pre.why);
  console.error("DEPLOY BLOCKED, and NOT because a migration is missing -- nothing was");
  console.error("measured. Fix the invocation.");
  process.exit(2);
}
if (pre.code === 2) {
  console.error("");
  console.error("A PRECONDITION COULD NOT BE MEASURED -- DEPLOY BLOCKED.");
  console.error("  Nothing says a migration is missing. Nothing says it ran either, and");
  console.error("  UNKNOWN is not a pass.");
  process.exit(2);
}
if (!pre.ok) {
  console.error("");
  console.error("A REQUIRED MIGRATION HAS NOT RUN -- DEPLOY BLOCKED.");
  console.error("");
  console.error("  This code reads something the database does not have yet. Deploying it");
  console.error("  would answer 400 to every call of the affected resource -- loud, total,");
  console.error("  and entirely avoidable by running the migration first.");
  console.error("");
  console.error("  Run the migration named above in the SQL editor, then re-run this.");
  process.exit(1);
}

if (!APPLY) {
  console.log("");
  console.log("GATES PASSED. Nothing deployed. Re-run with --apply.");
  process.exit(0);
}

const dep = run("4/5  deploy", "supabase",
  ["functions", "deploy", "courseware-read", "--dns-resolver", "https"], PARENT, true);
if (!dep.ran || !dep.ok) {
  console.error("");
  console.error("DEPLOY FAILED. If it says `lookup api.supabase.com: no such host`, that is");
  console.error("the DNS note in CLAUDE.md -- --dns-resolver https is already passed here, so");
  console.error("a failure with it set is something else. Do not retry blindly: a blind retry");
  console.error("that succeeds teaches nothing.");
  process.exit(1);
}

if (SKIP_SMOKE) {
  console.log("");
  console.log("DEPLOYED. SMOKE SKIPPED -- the deploy is UNVERIFIED and that is a state, not a");
  console.log("pass. Run scripts/smoke-courseware-tools.mjs before walking away.");
  process.exit(0);
}

const smoke = run("5/5  smoke", process.execPath,
  ["--dns-result-order=ipv4first", "scripts/smoke-courseware-tools.mjs"], ROOT);
if (!smoke.ran) {
  console.error("");
  console.error("THE SMOKE COULD NOT RUN: " + smoke.why);
  console.error("THE DEPLOY IS LIVE AND UNVERIFIED. Run scripts/smoke-courseware-tools.mjs");
  console.error("by hand before walking away -- an unverified deploy is a state, not a pass.");
  process.exit(2);
}
if (!smoke.ok) {
  console.error("");
  console.error("THE DEPLOY IS LIVE AND FAILING. The smoke output above carries the rollback.");
  process.exit(1);
}

console.log("");
console.log("DEPLOYED AND SMOKED. Every tool answered 200 with rows.");
