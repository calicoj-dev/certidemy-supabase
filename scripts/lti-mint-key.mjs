// lti-mint-key.mjs
//
// Mints the platform-level RSA-2048 keypair Certidemy signs LTI 1.3 messages
// with, proves it works, and stores the private half in Vault.
//
// ============================== A MIRRORED PAIR ============================
//
// This script and functions/lti-mint-tool-key/index.ts do the SAME THING by the
// SAME STEPS, deliberately:
//
//   THIS FILE          bootstrap and operations. No browser, no session, no
//                      bearer token assembled by hand. Run it with the service
//                      role key, the way every other operational script here
//                      works.
//   THE EDGE FUNCTION  the console button that will eventually exist, gated on
//                      platform_admin and audited into admin_actions.
//
// IF THE MINT SHAPE CHANGES, BOTH CHANGE. Same warning the credential mint
// carries in CLAUDE.md, and for the same reason: two copies of one rule can
// drift, and the one that drifts is the one nobody tested. Concretely, if the
// kid derivation, the modulus length, the proof round-trip or the stored JWK
// shape moves here, it moves there too, or a key minted by one path is not the
// key the other path would have made.
//
// The audit row is NOT shared, and that is on purpose. admin_actions is keyed
// to actor_user_id and cannot represent a service-role script; this file writes
// none, and says so below. Same principle already recorded for issuing.
//
// ============================== FLAG CONVENTION -- READ THIS ==============
//
// THIS SCRIPT IS DRY BY DEFAULT. --apply writes. That is
// mint-missing-credentials.mjs's convention, and it is the one chosen here.
//
// IT IS NOT THE ONLY CONVENTION IN THIS DIRECTORY. load-lessons-direct.mjs uses
// --dry, which opts INTO safety and therefore RUNS LIVE BY DEFAULT, and CLAUDE
// .md records the sharp edge that follows: unknown flags there are silently
// ignored, so a typo runs it live.
//
// Two opposite conventions in one folder is a trap, so this file does three
// things about it:
//   1. picks dry-by-default, the safe one;
//   2. names the other convention here, so nobody assumes;
//   3. ABORTS ON AN UNRECOGNISED FLAG rather than ignoring it. --dry, --dry-run
//      and any typo stop the script instead of quietly meaning nothing. A flag
//      you believed in that did nothing is the failure this whole note is about.
//
// ============================== WHY IT REFUSES A SECOND KEY ===============
//
// TWO ACCIDENTAL MINTS IS THE FAILURE MODE HERE.
//
// lti_store_tool_key only refuses a duplicate KID, and two runs produce two
// different keys, so nothing at the database level stops a second mint. Both
// would then appear in the JWKS -- which is correct behaviour for a deliberate
// rotation and confusing wreckage when it was a re-run of a command someone
// thought had failed.
//
// So this refuses when any non-retired key exists, and --force is the explicit
// statement that a rotation is intended. It is the only irreversible-ish thing
// here: a published kid is one an LMS may already have cached.
//
// ============================== WHY THE KEY PROVES ITSELF =================
//
// crypto.subtle.generateKey for RSASSA-PKCS1-v1_5 is not exercised anywhere
// else in this codebase. Ed25519 generation is proven in
// activate-partner-issuer; RSA generation is proven nowhere.
//
// So this does not trust its own output. It generates, exports, RE-IMPORTS the
// exported PKCS#8, signs a probe, and verifies against a public key rebuilt
// FROM THE EXPORTED JWK -- not from the generated pair.
//
// THAT DISTINCTION IS THE WHOLE CHECK. Verifying against the in-memory public
// key proves only that the object is self-consistent with itself. Verifying
// against the JWK we are about to PUBLISH is what catches a published half that
// disagrees with the signing half. A key that cannot sign, stored in Vault and
// published in a JWKS, produces launches that fail with an error naming the
// SIGNATURE -- and nobody would look at the key.
//
// ============================== USAGE =====================================
//
//   $env:SUPABASE_SERVICE_ROLE_KEY="<service role key>"
//
//   node scripts\lti-mint-key.mjs            # dry run, exits 2
//   node scripts\lti-mint-key.mjs --apply    # mints and stores
//   node scripts\lti-mint-key.mjs --apply --force   # rotate: mint a SECOND key
//
// Dry exits 2 rather than 0 so a skipped apply is visible in $LASTEXITCODE.
//
// A DRY RUN STILL GENERATES AND PROVES A KEY. It simply never stores it, and
// the key it made is discarded -- the kid printed by a dry run is NOT the kid
// you will get from --apply. That is deliberate: the point of the dry run is to
// prove the runtime can generate and self-verify an RSA key at all, which is
// the step that has never run here.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// ---------------------------------------------------------------------------
// Local .env loader (KEY=VALUE), real process env wins over the file.
// Mirrors gen-cert-secure.mjs so this needs no new setup.
// ---------------------------------------------------------------------------
function loadDotEnv() {
  const here = dirname(fileURLToPath(import.meta.url));
  const path = resolve(here, ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, k, v] = m;
    if (process.env[k] === undefined) {
      process.env[k] = v.replace(/^["']|["']$/g, "");
    }
  }
}
loadDotEnv();

// ---------------------------------------------------------------------------
// Flags. UNRECOGNISED FLAGS ABORT -- see the header.
// ---------------------------------------------------------------------------
const KNOWN = new Set(["--apply", "--force"]);
const passed = process.argv.slice(2);
const unknown = passed.filter((a) => !KNOWN.has(a));
if (unknown.length > 0) {
  console.error(`ABORT  unrecognised flag(s): ${unknown.join(", ")}`);
  console.error(`       known flags: ${[...KNOWN].join(", ")}`);
  console.error(
    "       This script is DRY BY DEFAULT and --apply writes. Note that",
  );
  console.error(
    "       load-lessons-direct.mjs in this folder uses the OPPOSITE",
  );
  console.error(
    "       convention (--dry, live by default). If you meant --dry, you",
  );
  console.error("       already have it: run with no flags.");
  process.exit(2);
}

const APPLY = passed.includes("--apply");
const FORCE = passed.includes("--force");

const URL_ =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.PROJECT_URL ??
  "https://pctynukndxnmnxiqpgck.supabase.co";
const KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_KEY;

if (!KEY) {
  console.error(
    "ABORT  SUPABASE_SERVICE_ROLE_KEY not set (expected in scripts/.env).",
  );
  process.exit(2);
}

// autoRefreshToken:false stops the timer that keeps Node alive after main().
const svc = createClient(URL_, KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const MODULUS_LENGTH = 2048;
const PUBLIC_EXPONENT = new Uint8Array([0x01, 0x00, 0x01]); // 65537

/** base64url, no padding -- what JOSE uses everywhere. */
function b64url(bytes) {
  return Buffer.from(bytes).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** PKCS#8 DER -> PEM. */
function toPem(der) {
  const b64 = Buffer.from(der).toString("base64");
  const lines = b64.match(/.{1,64}/g) ?? [b64];
  return `-----BEGIN PRIVATE KEY-----\n${lines.join("\n")}\n-----END PRIVATE KEY-----\n`;
}

/**
 * RFC 7638 JWK thumbprint.
 *
 * The member set and their ORDER are specified, not chosen: for RSA it is
 * exactly e, kty, n, lexicographically, no whitespace. Serializing the whole
 * JWK, or letting JSON.stringify pick order from insertion, produces a
 * different digest and a kid no other implementation agrees with.
 *
 * MUST stay byte-identical to jwkThumbprint() in the edge function.
 */
async function jwkThumbprint(jwk) {
  if (!jwk.n || !jwk.e) {
    throw new Error("public JWK is missing n or e; cannot compute a thumbprint");
  }
  const canonical = `{"e":"${jwk.e}","kty":"RSA","n":"${jwk.n}"}`;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical),
  );
  return b64url(new Uint8Array(digest));
}

/**
 * Generate an RS256 keypair and PROVE it before returning it.
 * Throws rather than returning anything unusable.
 */
async function mintProvenRsaKeypair() {
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: MODULUS_LENGTH,
      publicExponent: PUBLIC_EXPONENT,
      hash: "SHA-256",
    },
    true, // extractable: required to export the private half at all
    ["sign", "verify"],
  );

  const pkcs8 = await crypto.subtle.exportKey("pkcs8", pair.privateKey);
  const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const pem = toPem(pkcs8);

  /* ---- PROVE IT. Round-trip through the path a signer will use. ---------- */
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Buffer.from(body, "base64");
  const reimported = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const probe = new TextEncoder().encode(
    "certidemy lti tool key self-test " + new Date().toISOString(),
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: "RSASSA-PKCS1-v1_5" }, reimported, probe),
  );
  if (sig.length !== MODULUS_LENGTH / 8) {
    throw new Error(
      `RS256 signature is ${sig.length} bytes, expected ${MODULUS_LENGTH / 8}`,
    );
  }

  // Against the JWK we are about to PUBLISH, never against pair.publicKey.
  const publishedPub = await crypto.subtle.importKey(
    "jwk",
    publicJwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const ok = await crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    publishedPub,
    sig,
    probe,
  );
  if (!ok) {
    throw new Error(
      "generated key failed its own self-test: the exported private key does " +
        "not produce signatures the exported public JWK verifies",
    );
  }

  const kid = await jwkThumbprint(publicJwk);

  // Members named explicitly rather than spread, so a runtime that adds a
  // private member cannot leak it into a document served to the internet.
  const published = {
    kty: "RSA",
    n: publicJwk.n,
    e: publicJwk.e,
    alg: "RS256",
    use: "sig",
    kid,
  };

  return { pem, published, kid };
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY RUN");
  console.log(`project: ${URL_}`);
  console.log("");

  // ---- existing keys ------------------------------------------------------
  const { data: existing, error: exErr } = await svc
    .from("lti_tool_keys")
    .select("kid, alg, status, created_at, activated_at")
    .neq("status", "retired")
    .order("created_at", { ascending: false });
  if (exErr) throw new Error(`lti_tool_keys: ${exErr.message}`);

  const live = existing ?? [];
  console.log(`non-retired keys already present: ${live.length}`);
  for (const k of live) {
    console.log(`  ${k.status.padEnd(9)} ${k.kid}  created ${k.created_at}`);
  }
  console.log("");

  if (live.length > 0 && !FORCE) {
    console.error(
      "ABORT  a non-retired key already exists. Minting a second one would put",
    );
    console.error(
      "       TWO keys in the JWKS -- correct for a deliberate rotation, and",
    );
    console.error(
      "       confusing wreckage if this is a re-run of a command you thought",
    );
    console.error(
      "       had failed. lti_store_tool_key only refuses a duplicate KID, and",
    );
    console.error(
      "       two runs make two different keys, so nothing downstream stops it.",
    );
    console.error("");
    console.error("       If you mean to rotate, pass --force.");
    process.exit(2);
  }
  if (live.length > 0 && FORCE) {
    console.log(
      "--force: minting an ADDITIONAL key. The existing one(s) stay serveable",
    );
    console.log(
      "         until retired separately, which is what lets platforms",
    );
    console.log("         re-fetch without an outage.");
    console.log("");
  }

  // ---- generate and prove -------------------------------------------------
  console.log("generating RSA-2048 and proving it signs...");
  const key = await mintProvenRsaKeypair();
  console.log("  self-test PASSED (re-imported PKCS#8 signs; exported JWK verifies)");
  console.log(`  kid : ${key.kid}`);
  console.log(`  alg : RS256`);
  console.log(`  e   : ${key.published.e}`);
  console.log(`  n   : ${String(key.published.n).slice(0, 32)}... (${String(key.published.n).length} chars)`);
  console.log("");

  if (!APPLY) {
    console.log("(dry run -- nothing stored, and THIS KEY IS DISCARDED)");
    console.log("");
    console.log("The kid above is not the kid --apply will produce: a dry run");
    console.log("generates a throwaway key to prove the runtime can, which is");
    console.log("the step that has never run in this codebase before.");
    console.log("");
    console.log("Re-run with --apply to mint and store the real one.");
    process.exit(2);
  }

  // ---- store --------------------------------------------------------------
  const { error: storeErr } = await svc.rpc("lti_store_tool_key", {
    p_kid: key.kid,
    p_private_key: key.pem,
    p_public_jwk: key.published,
    p_activate: true,
  });
  if (storeErr) {
    // Never echo the raw message: a Vault error can carry the statement that
    // referenced the key material.
    console.error("FAILED  lti_store_tool_key rejected the key.");
    console.error(`        code: ${storeErr.code ?? "(none)"}`);
    process.exit(1);
  }

  console.log(`STORED  kid ${key.kid}`);
  console.log("");
  console.log("NO admin_actions ROW IS WRITTEN. That table is keyed to");
  console.log("actor_user_id and cannot represent a service-role script; the");
  console.log("edge function writes one because it has a real actor.");
  console.log("");
  console.log("Confirm the public half is being served:");
  console.log(`  curl -s ${URL_}/functions/v1/lti-jwks`);
  process.exit(0);
}

main().catch((err) => {
  console.error("");
  console.error(`ABORT  ${err.message}`);
  process.exit(1);
});
