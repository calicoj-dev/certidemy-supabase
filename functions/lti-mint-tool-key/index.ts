// POST /functions/v1/lti-mint-tool-key
//
// Body: { activate?: boolean }
// Auth: Bearer JWT -- MUST be platform_admin.
//
// Mints the RSA keypair Certidemy signs LTI 1.3 messages with, proves it works,
// and stores the private half in Vault.
//
// ============================== PLATFORM-LEVEL, NOT PER-ISSUER ============
//
// This key is the TOOL's identity. It answers "is this request really from
// Certidemy". The Ed25519 keys on `issuers` answer a different question --
// "who attests this credential" -- and those belong to the partner.
//
// They cannot be merged, and not merely on principle: an LTI platform issues
// ONE client_id to ONE tool. A per-issuer LTI key would mean registering N
// tools with each LMS, one per partner, each needing its own developer key from
// that LMS admin. That does not degrade gracefully; it does not work at all.
//
// So this does NOT go through issuer_store_key. It has its own table and its
// own Vault functions (migration 254), and `issuers` keeps its deliberate
// one-key-per-issuer shape.
//
// ============================== WHY RS256 =================================
//
// LTI 1.3 signs with RS256. Ed25519 is not an option in the specification, and
// 1EdTech certification requires RS256 specifically. This is the one place the
// platform holds an RSA key at all.
//
// ============================== WHY THE KEY PROVES ITSELF =================
//
// crypto.subtle.generateKey for RSASSA-PKCS1-v1_5 has NEVER RUN IN THIS
// RUNTIME. Import and sign are exercised in production by every credential
// open-badge serves, but that is Ed25519, and generation is not proven by
// either.
//
// So this does not trust its own output. It generates, exports, RE-IMPORTS the
// exported PKCS#8, signs a probe, and verifies that signature against a public
// key rebuilt FROM THE EXPORTED JWK -- not from the generated CryptoKey pair.
//
// THAT DISTINCTION IS THE WHOLE CHECK. Verifying against pair.publicKey proves
// only that the object in memory is self-consistent. Verifying against the JWK
// we are about to PUBLISH is what catches a published half that disagrees with
// the signing half. Exactly the reasoning in activate-partner-issuer, which
// rebuilds from the raw bytes it is about to publish for the same reason.
//
// A key that cannot sign, stored in Vault and published in a JWKS, produces
// launches that fail with an error naming the SIGNATURE. The cause would be the
// key, and nobody would look there.
//
// ============================== kid IS DERIVED, NOT INVENTED ==============
//
// kid is the RFC 7638 JWK thumbprint: base64url(SHA-256(canonical JSON of the
// required members, lexicographically ordered, no whitespace)). For RSA that is
// exactly {"e","kty","n"}.
//
// Deriving it means the kid cannot drift from the material it names. A platform
// that fetches our JWKS and caches by kid is trusting that identifier to be
// stable and honest; a serial number would satisfy neither.
//
// ============================== ROTATION ==================================
//
// Minting does not retire anything. lti_tool_keys deliberately holds several
// non-retired rows so the JWKS can serve two kids while platforms re-fetch --
// a tool that can only hold one key cannot rotate without an outage.
//
// `activate: false` (the default) mints as 'active' but does not touch any
// existing key. Retiring an old key is a separate, later, deliberate act.
//
// ============================== KEY HANDLING ==============================
//
// The private key exists in this function's memory for one request and reaches
// Vault through lti_store_tool_key, which is write-only -- nothing reads it
// back except lti_get_tool_key, service role, inside the signing paths. It is
// never returned, never logged, never in an error message. extractable:true is
// required to export it at all, which is why that window is as short as the
// code allows.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";

interface Body {
  activate?: boolean;
}

/** RSA-2048 is the floor for RS256 in practice; 1EdTech conformance assumes it. */
const MODULUS_LENGTH = 2048;

/** 65537. The standard public exponent, as the big-endian bytes WebCrypto wants. */
const PUBLIC_EXPONENT = new Uint8Array([0x01, 0x00, 0x01]);

/** base64url, no padding -- what JOSE uses everywhere. */
function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** PKCS#8 DER -> PEM, the same shape _shared/ob3.ts importSigningKey() expects. */
function toPem(der: ArrayBuffer): string {
  const bytes = new Uint8Array(der);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = btoa(bin);
  const lines = b64.match(/.{1,64}/g) ?? [b64];
  return `-----BEGIN PRIVATE KEY-----\n${lines.join("\n")}\n-----END PRIVATE KEY-----\n`;
}

/**
 * RFC 7638 JWK thumbprint.
 *
 * The member set and their ORDER are specified, not chosen: for RSA it is
 * exactly e, kty, n, lexicographically, with no whitespace. Serializing the
 * whole JWK, or letting JSON.stringify pick key order from insertion, produces
 * a different digest and therefore a kid that no other implementation agrees
 * with.
 */
async function jwkThumbprint(jwk: JsonWebKey): Promise<string> {
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
 * Generate an RS256 keypair and PROVE it works before returning it.
 *
 * Throws rather than returning anything unusable. The caller stores only what
 * this returns, so a throw here means nothing was written anywhere.
 */
async function mintProvenRsaKeypair(): Promise<{
  pem: string;
  publicJwk: Record<string, string>;
  kid: string;
}> {
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: MODULUS_LENGTH,
      publicExponent: PUBLIC_EXPONENT,
      hash: "SHA-256",
    },
    true, // extractable: required to export the private half at all
    ["sign", "verify"],
  ) as CryptoKeyPair;

  const pkcs8 = await crypto.subtle.exportKey("pkcs8", pair.privateKey);
  const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);

  const pem = toPem(pkcs8);

  /* ---- PROVE IT. Round-trip through the same path a signer will use. ----- */
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
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

  // Verify against a public key rebuilt from the JWK WE ARE ABOUT TO PUBLISH,
  // not against pair.publicKey. If the published half and the signing half
  // disagree, this is the only place that catches it.
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

  // What goes in the JWKS.
  //
  // Typed as a plain record, NOT as JsonWebKey: Deno's lib type omits `kid`,
  // which RFC 7517 defines and which is the member a platform selects on. This
  // value is a document we serialize, not an input to WebCrypto, so the DOM
  // type was the wrong shape for it anyway.
  //
  // Members are named explicitly rather than spread from publicJwk. `d` and the
  // other private members are never present on an exported PUBLIC jwk today,
  // and naming the fields means a future runtime that adds one cannot leak it
  // into a document served to the whole internet.
  const published: Record<string, string> = {
    kty: "RSA",
    n: publicJwk.n as string,
    e: publicJwk.e as string,
    alg: "RS256",
    use: "sig",
    kid,
  };

  return { pem, publicJwk: published, kid };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  try {
    const actor = await authenticate(req);
    const svc = getServiceClient();

    const { data: actorProfile } = await svc
      .from("profiles")
      .select("platform_role")
      .eq("id", actor)
      .maybeSingle();
    if (!actorProfile || actorProfile.platform_role !== "platform_admin") {
      throw new HttpError(403, "platform_admin required");
    }

    const body = (await req.json().catch(() => ({}))) as Body;

    // Generates and PROVES. Throws having written nothing if it cannot.
    const key = await mintProvenRsaKeypair();

    // Vault FIRST, then the row -- lti_tool_keys_active_requires_material
    // refuses a non-retired row without both halves, so this order is not a
    // preference: the reverse is rejected by the database.
    const { error: storeErr } = await svc.rpc("lti_store_tool_key", {
      p_kid: key.kid,
      p_private_key: key.pem,
      p_public_jwk: key.publicJwk,
      p_activate: body.activate === true,
    });
    if (storeErr) {
      // Never echo storeErr.message: a Vault error can carry the statement that
      // referenced the key material.
      console.error("lti_store_tool_key failed", storeErr);
      throw new HttpError(500, "failed to store the LTI signing key");
    }

    await svc.from("admin_actions").insert({
      actor_user_id: actor,
      action: "mint_lti_tool_key",
      target_type: "lti_tool_key",
      target_id: null,
      reason: null,
      metadata: {
        kid: key.kid,
        alg: "RS256",
        modulus_length: MODULUS_LENGTH,
        activated: body.activate === true,
      },
    });

    return jsonResponse({
      ok: true,
      // The PUBLIC half only. It is published in the JWKS anyway; returning it
      // lets the caller confirm the document matches without a second fetch.
      kid: key.kid,
      alg: "RS256",
      public_jwk: key.publicJwk,
      jwks_url: "https://certidemy.com/lti/jwks",
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
