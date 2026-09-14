#!/usr/bin/env node
/**
 * scram-verifier.mjs - mint a Postgres SCRAM-SHA-256 verifier locally.
 *
 * READ-ONLY AGAINST EVERYTHING. No --apply, no database connection, no file
 * written. Unknown flags exit 2. It prints and exits.
 *
 *   node scripts/scram-verifier.mjs                  # generate a password
 *   node scripts/scram-verifier.mjs --role mcp_reader
 *   MCP_PASSWORD='...' node scripts/scram-verifier.mjs --from-env
 *
 * ===================== WHY A VERIFIER AND NOT A PASSWORD =====================
 *
 * `alter role x password 'plaintext'` puts the plaintext in two places nobody
 * treats as a secret store: Postgres does not redact the statement from the
 * server log, and the Supabase SQL editor keeps query history. Migration 316
 * needs a password set and this repo runs SQL by pasting it into that editor.
 *
 * Postgres accepts a PRE-HASHED string in the SCRAM-SHA-256 format and stores it
 * verbatim instead of hashing it again. So the plaintext never transits.
 *
 * THE VERIFIER IS NOT PASSWORD-EQUIVALENT, which is the property that makes this
 * worth doing. SCRAM stores StoredKey = SHA256(ClientKey), and authenticating
 * requires ClientKey. Recovering ClientKey from StoredKey means inverting
 * SHA-256. This is the substantive difference from the old `md5` format, where
 * the stored value WAS directly replayable and hashing bought nothing.
 *
 * It is not nothing, either: the verifier permits an offline guessing attack
 * against a weak password. That is why the generated password is 32 random
 * bytes rather than a memorable string, and why --from-env exists only for
 * rotating a password that came from somewhere else.
 *
 * ===================== FORMAT =====================
 *
 *   SCRAM-SHA-256$<iterations>:<salt b64>$<StoredKey b64>:<ServerKey b64>
 *
 *   SaltedPassword = PBKDF2-HMAC-SHA256(password, salt, iterations, 32)
 *   ClientKey      = HMAC-SHA256(SaltedPassword, "Client Key")
 *   StoredKey      = SHA256(ClientKey)
 *   ServerKey      = HMAC-SHA256(SaltedPassword, "Server Key")
 *
 * RFC 5802, and the layout Postgres writes in pg_authid.rolpassword.
 */
import { pbkdf2Sync, createHmac, createHash, randomBytes } from "node:crypto";

const KNOWN = new Set(["--role", "--from-env", "--iterations"]);
const argv = process.argv.slice(2);
for (const a of argv) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error(`Unrecognised flag: ${a}.`);
    console.error("This script READS ONLY and writes nothing. Known flags: --role, --from-env, --iterations.");
    process.exit(2);
  }
}
const flag = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i === -1 ? d : argv[i + 1];
};

const role = flag("role", "mcp_reader");
const iterations = Number(flag("iterations", 4096));
if (!Number.isInteger(iterations) || iterations < 4096) {
  console.error("--iterations must be a whole number and at least 4096 (the Postgres default).");
  process.exit(2);
}
if (!/^[a-z_][a-z0-9_]*$/.test(role)) {
  console.error(`--role must be a plain lower-case identifier; got "${role}".`);
  process.exit(2);
}

const fromEnv = argv.includes("--from-env");
let password;
if (fromEnv) {
  password = process.env.MCP_PASSWORD;
  if (!password) {
    console.error("--from-env given but MCP_PASSWORD is not set.");
    process.exit(2);
  }
} else {
  // 32 random bytes, base64url. Long enough that the offline-guessing residual
  // of holding the verifier is not a practical attack.
  password = randomBytes(32).toString("base64url");
}

const salt = randomBytes(16);
const saltedPassword = pbkdf2Sync(password, salt, iterations, 32, "sha256");
const clientKey = createHmac("sha256", saltedPassword).update("Client Key").digest();
const storedKey = createHash("sha256").update(clientKey).digest();
const serverKey = createHmac("sha256", saltedPassword).update("Server Key").digest();

const verifier =
  `SCRAM-SHA-256$${iterations}:${salt.toString("base64")}` +
  `$${storedKey.toString("base64")}:${serverKey.toString("base64")}`;

console.log("");
console.log("STEP 1 - the password. Store it in the edge function secret now.");
console.log("         It is printed once and this script keeps no copy.");
console.log("");
if (fromEnv) {
  console.log("  (taken from MCP_PASSWORD; not reprinted)");
} else {
  console.log(`  supabase secrets set MCP_READER_PASSWORD='${password}'`);
}
console.log("");
console.log("STEP 2 - the verifier. Run this as a single statement in the SQL editor.");
console.log("         It is not password-equivalent, so the editor history is not");
console.log("         holding a usable credential.");
console.log("");
console.log(`  alter role ${role} password '${verifier}';`);
console.log("");
console.log("STEP 3 - confirm a password exists, without reading it:");
console.log("");
console.log(`  select rolname, rolpassword is not null as has_password`);
console.log(`    from pg_authid where rolname = '${role}';`);
console.log("");
console.log("Nothing was written and no database was contacted.");
