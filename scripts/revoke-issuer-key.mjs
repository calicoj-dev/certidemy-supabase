#!/usr/bin/env node
/**
 * revoke-issuer-key.mjs - revoke an issuer API key.
 *
 * OPT INTO WRITING: `--apply`. DRY BY DEFAULT. Unknown flags exit 2.
 * See CLAUDE.md on the two flag conventions in this directory.
 *
 *   node scripts/revoke-issuer-key.mjs --key <uuid>
 *   node scripts/revoke-issuer-key.mjs --key <uuid> --apply
 *   node scripts/revoke-issuer-key.mjs --key <a> --key <b> --apply
 *
 * ===================== WHY A SCRIPT =====================
 *
 * revoke-issuer-api-key is verify_jwt = true, so it needs a user token, and the
 * console has no revoke button -- its own header says "the console tells a
 * partner to revoke a key and then gives them no way to revoke it. This is that
 * way", and "this" is the function, not an interface. This is the interface.
 *
 * The auth path is _shared_ with mint-issuer-key through scripts/lib/fn-auth.mjs
 * rather than copied. Two scripts in one repository needing the same forty lines
 * is the mirrored-pair hazard with nothing to justify it.
 *
 * ===================== SOFT, AND IDEMPOTENT =====================
 *
 * The function sets revoked_at and keeps the row, because issuer_api_requests
 * references api_key_id and deleting it would orphan the record of everything
 * that key ever issued -- which is exactly what someone wants after a key is
 * compromised. Revoking an already-revoked key succeeds and reports the original
 * timestamp, so re-running this is safe.
 *
 * ===================== WHAT REVOCATION DOES NOT UNDO =====================
 *
 * Credentials already issued with the key STAY ISSUED and stay valid. Revoking
 * stops future calls; it is not a recall. If a key minted something it should
 * not have, that credential has to be revoked separately, as a credential.
 */
import {
  ANON,
  AUTH_HELP,
  AUTH_SOURCE,
  SUPABASE_URL,
  UUID_RE,
  anonMissing,
  callFunction,
  getAccessToken,
} from "./lib/fn-auth.mjs";

const KNOWN = new Set(["--key", "--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error(`Unrecognised flag: ${a}.`);
    console.error("This script is the --apply family: it writes ONLY with --apply and is dry otherwise.");
    console.error("Known flags: --key (repeatable), --apply.");
    process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");

/** Repeatable, so a pair of smoke keys is one invocation and one decision. */
const keys = [];
process.argv.slice(2).forEach((a, i, all) => {
  if (a === "--key" && all[i + 1]) keys.push(all[i + 1].trim());
});

/* --------------------------------------------------- validate before writing */

const problems = [];
if (keys.length === 0) problems.push("--key <uuid> is required (repeatable)");
for (const k of keys) if (!UUID_RE.test(k)) problems.push(`--key "${k}" is not a uuid`);
if (new Set(keys).size !== keys.length) problems.push("the same key was given twice");
const anonProblem = anonMissing();
if (anonProblem) problems.push(anonProblem);
// ONLY WHEN WRITING. A dry run must work with no credential: it exists to show
// what would be sent.
if (APPLY && !AUTH_SOURCE) problems.push(AUTH_HELP);

if (problems.length) {
  for (const p of problems) console.error(`  ${p}`);
  process.exit(2);
}

console.log("");
console.log(`POST ${SUPABASE_URL}/functions/v1/revoke-issuer-api-key`);
for (const k of keys) console.log(`  { "key_id": "${k}" }`);
console.log("");

if (!APPLY) {
  console.log(`auth: ${AUTH_SOURCE ?? "NOT CONFIGURED -- --apply would abort before sending"}`);
  console.log("");
  console.log(`DRY RUN. Nothing was sent; ${keys.length} key(s) are still live.`);
  console.log("Re-run with --apply to revoke. Revocation is permanent and the key");
  console.log("cannot be un-revoked -- mint a new one instead.");
  process.exit(0);
}

/* ================================================================= */
/*  NOTHING BELOW CALLS process.exit(). Exiting while undici holds a  */
/*  keep-alive socket trips a libuv assertion on Windows              */
/*  (src\win\async.c line 76). exitCode + return lets the loop drain. */
/* ================================================================= */

async function run() {
  console.log(`auth: ${AUTH_SOURCE}`);

  const auth = await getAccessToken();
  if (auth.error) {
    console.error(auth.error);
    process.exitCode = 1;
    return;
  }

  let failed = 0;
  for (const key of keys) {
    const { status, ok, json } = await callFunction(
      "revoke-issuer-api-key",
      { key_id: key },
      auth.token
    );
    if (!ok) {
      console.error(`  FAILED  ${key} -- HTTP ${status} ${JSON.stringify(json)}`);
      failed++;
      continue;
    }
    // THE RESPONSE IS THE EVIDENCE, not the status code. A 200 that did not set
    // revoked_at would read as a successful revocation, which is the one
    // outcome this script must never report wrongly.
    const when = json.key?.revoked_at ?? json.revoked_at ?? null;
    if (!when) {
      console.error(`  UNPROVEN  ${key} -- HTTP 200 with no revoked_at: ${JSON.stringify(json)}`);
      failed++;
      continue;
    }
    console.log(`  REVOKED  ${json.key?.key_prefix ?? key}  at ${when}`);
  }

  console.log("");
  if (failed > 0) {
    console.log(`${keys.length - failed} revoked, ${failed} NOT revoked. Check the rows before assuming.`);
    process.exitCode = 1;
    return;
  }
  console.log(`${keys.length} key(s) revoked. Credentials already issued with them stay valid.`);
  console.log("");
  console.log("Confirm against the table rather than this output:");
  console.log("");
  console.log("  select key_prefix, name, revoked_at from public.issuer_api_keys");
  console.log(`   where id in (${keys.map((k) => `'${k}'`).join(", ")});`);
}

await run();
