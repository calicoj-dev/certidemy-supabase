// POST /functions/v1/activate-partner-issuer
//
// Body: { issuer_id, mode: "verify" | "attest" | "activate", reason? }
// Auth: Bearer JWT -- MUST be platform_admin.
//
// STEP TWO OF TWO, in three modes.
//
//   mode="verify"    fetch the well-known file, compare the token, set
//                    status='verified', verification_method='domain'.
//                    Repeatable. No key material.
//   mode="attest"    record an out-of-band judgement. platform_admin, requires
//                    a reason, sets status='verified',
//                    verification_method='attested'. NOT repeatable, and
//                    REFUSES when the issuer has a verification_domain.
//   mode="activate"  require status='verified', re-check the domain IF there is
//                    one, generate the Ed25519 keypair, PROVE IT SIGNS, store
//                    the private half in Vault, set status='active'.
//
// ============================== WHY attest EXISTS ==========================
//
// The domain check excludes an issuer with no site to publish on -- a solo
// trainer running off a social profile. Migration 250 made
// verification_domain nullable in practice (it was always nullable in the
// schema; create-partner-issuer 400'd without one) and added
// issuers.verification_method.
//
// This is a GATE CHANGE, NOT A CLAIMS CHANGE. verification_method appears in
// no credential, no certificate, no badge and nothing on the verify page. The
// domain check never did reader-facing work either: it gated activation and
// disappeared. Certidemy's own issuer has verification_domain NULL and has
// signed every credential on the platform.
//
// It stays a gate change only as long as nothing displays it. If a surface
// ever renders "Certidemy-verified", the self-host rule in
// create-partner-issuer becomes load-bearing rather than tidy, and the wording
// falls under CLAIMS-POLICY.
//
// ============================== WHY attest IS NOT REPEATABLE ===============
//
// verify is repeatable because re-running a CHECK is free and proves the same
// thing again. attest records a DECISION, and the admin_actions row is the
// evidence. Re-recording a decision already made is audit noise. If the
// judgement changes, that is a deactivation or a new issuer -- not a second
// attestation over the first.
//
// So attest requires status='draft'. An issuer already verified by either
// route is refused.
//
// ============================== THE ASYMMETRY AT ACTIVATION ================
//
// activate re-runs checkDomain at the irreversible moment, because the domain
// could have changed hands since verification. An attested issuer has no
// domain to re-check, and re-reading the admin_actions row proves nothing that
// was not already true when it was written. So the re-check is conditional and
// the attested route does NOT get an equivalent.
//
// Both routes still pass through status='verified', which is the gate
// activation actually tests.
//
// ============================== THE IRREVERSIBLE ONE ======================
//
// Activation publishes a slug in the OB3 namespace and mints a signing key
// Certidemy will host forever. Migration 230's trigger refuses to move the slug
// once status leaves 'draft', because it appears inside every credential that
// issuer signs. There is no undo, by design -- deactivation stops new issuance
// and leaves everything already issued resolving, which is the obligation you
// take on the moment you activate someone.
//
// ============================== WHY THE KEY PROVES ITSELF =================
//
// crypto.subtle.generateKey for Ed25519 is the one call in this path that has
// never run in this runtime. Import and sign are proven in production by every
// credential open-badge serves; generation is not.
//
// So the function does not trust its own output. It generates, exports,
// RE-IMPORTS the exported PKCS#8, signs a test message, and verifies that
// signature against the exported public key. Only then does the key reach
// Vault. If any step fails it aborts having written nothing.
//
// A key that cannot sign, stored in Vault and published in an issuer Profile,
// produces credentials that fail verification with an error naming the
// SIGNATURE. The cause would be the key, and nobody would look there.
//
// ============================== KEY HANDLING ==============================
//
// The private key exists in this function's memory for the length of one
// request and reaches Vault through issuer_store_key (migration 185), which is
// write-only -- nothing reads it back except issuer_get_signing_key, service
// role, inside open-badge. It is never returned, never logged, never in an
// error message. extractable:true is required to export it at all, which is
// why that window is kept as short as the code allows.
//
// ============================== DOMAIN VERIFICATION =======================
//
// HTTPS well-known file, not DNS TXT. Deno.resolveDns may or may not exist in
// this runtime and a verification path that silently degrades is worse than a
// narrower one that works. Control of https://<domain>/.well-known/ is a
// strong enough claim to the domain for this purpose.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";
import { base58btc } from "../_shared/ob3.ts";

interface Body {
  issuer_id?: string;
  mode?: string;
  /** attest only. The judgement itself -- what was checked, out of band. */
  reason?: string;
}

/** Minimum length for an attestation reason. Short enough not to obstruct, long
 *  enough that "ok" does not become the record of why an issuer was trusted. */
const MIN_REASON = 20;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Multicodec prefix for an Ed25519 public key. The 'z' multibase prefix plus
 *  base58btc of (0xed 0x01 || 32 raw bytes) is what a verifier parses. */
const ED25519_MULTICODEC = new Uint8Array([0xed, 0x01]);

/** PKCS#8 DER -> PEM. What _shared/ob3.ts importSigningKey() expects: it
 *  strips these exact headers and all whitespace, then base64-decodes. */
function toPem(der: ArrayBuffer): string {
  const bytes = new Uint8Array(der);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = btoa(bin);
  const lines = b64.match(/.{1,64}/g) ?? [b64];
  return `-----BEGIN PRIVATE KEY-----\n${lines.join("\n")}\n-----END PRIVATE KEY-----\n`;
}

/**
 * Generate an Ed25519 keypair and PROVE it works before returning it.
 *
 * Throws rather than returning anything unusable. The caller stores only what
 * this returns, so a throw here means nothing was written anywhere.
 */
async function mintProvenKeypair(): Promise<{
  pem: string;
  multibase: string;
  jwk: JsonWebKey;
}> {
  const pair = await crypto.subtle.generateKey(
    { name: "Ed25519" },
    true, // extractable: required to export the private half at all
    ["sign", "verify"],
  ) as CryptoKeyPair;

  const pkcs8 = await crypto.subtle.exportKey("pkcs8", pair.privateKey);
  const rawPub = new Uint8Array(
    await crypto.subtle.exportKey("raw", pair.publicKey),
  );
  const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);

  if (rawPub.length !== 32) {
    throw new Error(`Ed25519 public key is ${rawPub.length} bytes, expected 32`);
  }

  const pem = toPem(pkcs8);

  /* ---- PROVE IT. Round-trip through the SAME path open-badge uses. ------- */
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  const reimported = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "Ed25519" },
    false,
    ["sign"],
  );

  const probe = new TextEncoder().encode(
    "certidemy issuer key self-test " + new Date().toISOString(),
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: "Ed25519" }, reimported, probe),
  );
  if (sig.length !== 64) {
    throw new Error(`Ed25519 signature is ${sig.length} bytes, expected 64`);
  }

  // Verify against a public key rebuilt from the RAW bytes we are about to
  // publish -- not against pair.publicKey. If the published bytes and the
  // signing key disagree, this is the only place that catches it.
  const publishedPub = await crypto.subtle.importKey(
    "raw",
    rawPub,
    { name: "Ed25519" },
    false,
    ["verify"],
  );
  const ok = await crypto.subtle.verify(
    { name: "Ed25519" },
    publishedPub,
    sig,
    probe,
  );
  if (!ok) {
    throw new Error(
      "generated key failed its own self-test: the exported private key does " +
        "not produce signatures the exported public key verifies",
    );
  }

  const prefixed = new Uint8Array(ED25519_MULTICODEC.length + rawPub.length);
  prefixed.set(ED25519_MULTICODEC, 0);
  prefixed.set(rawPub, ED25519_MULTICODEC.length);

  return { pem, multibase: "z" + base58btc(prefixed), jwk };
}

/**
 * Fetch the well-known file and compare.
 *
 * Never follows a redirect to another host: a partner who can be redirected
 * off their own domain has not proven control of it.
 */
async function checkDomain(
  domain: string,
  token: string,
): Promise<{ ok: boolean; detail: string }> {
  const url = `https://${domain}/.well-known/certidemy-issuer.txt`;
  try {
    const res = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(8000),
      headers: { accept: "text/plain" },
    });
    if (!res.ok) return { ok: false, detail: `${url} returned HTTP ${res.status}` };
    const text = (await res.text()).trim();
    if (text !== token) {
      return {
        ok: false,
        detail: `${url} does not contain the expected token`,
      };
    }
    return { ok: true, detail: url };
  } catch (err) {
    return { ok: false, detail: `${url}: ${(err as Error).message}` };
  }
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

    const body = (await req.json()) as Body;
    const issuerId = body.issuer_id?.trim();
    const mode = (body.mode ?? "verify").trim().toLowerCase();

    if (!issuerId || !UUID_RE.test(issuerId)) {
      throw new HttpError(400, "valid issuer_id required");
    }
    if (mode !== "verify" && mode !== "attest" && mode !== "activate") {
      throw new HttpError(400, 'mode must be "verify", "attest" or "activate"');
    }

    const { data: issuer, error: iErr } = await svc
      .from("issuers")
      .select(
        "id, slug, name, status, key_id, verification_domain, verification_token, verification_method, vault_secret_id",
      )
      .eq("id", issuerId)
      .maybeSingle();
    if (iErr) throw new Error(`issuer lookup: ${iErr.message}`);
    if (!issuer) throw new HttpError(404, "issuer not found");

    if (issuer.status === "active") {
      throw new HttpError(409, `issuer "${issuer.slug}" is already active`);
    }
    if (issuer.status === "deactivated") {
      throw new HttpError(409, `issuer "${issuer.slug}" is deactivated`);
    }

    /* -------------------------------------------------------- attest ----- */
    // Before the domain preconditions, because it is the mode that exists
    // precisely for an issuer that has none.
    if (mode === "attest") {
      if (issuer.status !== "draft") {
        throw new HttpError(
          409,
          `issuer "${issuer.slug}" is already ${issuer.status}. ` +
            "Attestation records a decision once; it is not repeatable.",
        );
      }
      if (issuer.verification_domain) {
        throw new HttpError(
          409,
          `issuer "${issuer.slug}" has verification_domain ` +
            `"${issuer.verification_domain}". An issuer with a domain verifies ` +
            "through it. Clear the domain first, or use mode=verify.",
        );
      }
      const reason = body.reason?.trim() ?? "";
      if (reason.length < MIN_REASON) {
        throw new HttpError(
          400,
          `attestation requires a reason of at least ${MIN_REASON} characters ` +
            "stating what was checked out of band. It is the only evidence " +
            "this issuer was verified at all.",
        );
      }

      const { error: atErr } = await svc
        .from("issuers")
        .update({
          status: "verified",
          verified_at: new Date().toISOString(),
          verification_method: "attested",
        })
        .eq("id", issuer.id);
      if (atErr) throw new Error(`attest update: ${atErr.message}`);

      // The reason column, not metadata. This row IS the verification record.
      await svc.from("admin_actions").insert({
        actor_user_id: actor,
        action: "attest_partner_issuer",
        target_type: "issuer",
        target_id: issuer.id,
        reason,
        metadata: {
          slug: issuer.slug,
          verification_method: "attested",
          domain: null,
        },
      });

      return jsonResponse({
        ok: true,
        status: "verified",
        slug: issuer.slug,
        verification_method: "attested",
        verified_via: "platform_admin attestation",
        next: "call again with mode=activate to mint the signing key",
      });
    }

    /* ------------------------------------------------ domain routes ------ */
    // verify needs a domain and a token. activate needs them only if this
    // issuer took the domain route -- an attested one has neither, by
    // construction and by issuers_attested_has_no_domain.
    if (mode === "verify" && (!issuer.verification_domain || !issuer.verification_token)) {
      throw new HttpError(
        422,
        "issuer has no verification domain or token. " +
          "Use mode=attest to record an out-of-band judgement instead.",
      );
    }

    if (mode === "verify") {
      const check = await checkDomain(
        issuer.verification_domain as string,
        issuer.verification_token as string,
      );
      if (!check.ok) {
        throw new HttpError(422, `domain verification failed: ${check.detail}`);
      }

      const { error: vErr } = await svc
        .from("issuers")
        .update({
          status: "verified",
          verified_at: new Date().toISOString(),
          verification_method: "domain",
        })
        .eq("id", issuer.id);
      if (vErr) throw new Error(`verify update: ${vErr.message}`);

      await svc.from("admin_actions").insert({
        actor_user_id: actor,
        action: "verify_partner_issuer",
        target_type: "issuer",
        target_id: issuer.id,
        reason: null,
        metadata: {
          slug: issuer.slug,
          domain: issuer.verification_domain,
          verification_method: "domain",
        },
      });

      return jsonResponse({
        ok: true,
        status: "verified",
        slug: issuer.slug,
        verification_method: "domain",
        verified_via: check.detail,
        next: "call again with mode=activate to mint the signing key",
      });
    }

    /* ------------------------------------------------------ activate ----- */
    if (issuer.status !== "verified") {
      throw new HttpError(
        409,
        `issuer must be verified before activation (currently "${issuer.status}")`,
      );
    }
    if (issuer.vault_secret_id) {
      throw new HttpError(
        409,
        "issuer already has key material; refusing to overwrite it. " +
          "Key rotation is a separate operation that mints a NEW key_id.",
      );
    }

    // RE-CHECK AT THE IRREVERSIBLE MOMENT -- domain route only. The domain
    // could have changed hands between verification and activation, so the
    // proof is taken again here. An attested issuer has no domain, and
    // re-reading its admin_actions row proves nothing that was not already
    // true when it was written. See THE ASYMMETRY AT ACTIVATION in the header.
    if (issuer.verification_domain && issuer.verification_token) {
      const recheck = await checkDomain(
        issuer.verification_domain,
        issuer.verification_token,
      );
      if (!recheck.ok) {
        throw new HttpError(
          422,
          `domain verification failed at activation: ${recheck.detail}`,
        );
      }
    }

    // Generates and PROVES. Throws having written nothing if it cannot.
    const key = await mintProvenKeypair();

    // Write the key FIRST. The issuers_active_requires_keys CHECK added in
    // migration 230 refuses status='active' without key material, so this
    // order is not a preference -- the reverse order is rejected by the
    // database.
    const { error: keyErr } = await svc.rpc("issuer_store_key", {
      p_slug: issuer.slug,
      p_private_key: key.pem,
      p_public_multibase: key.multibase,
      p_public_jwk: key.jwk,
      p_key_id: issuer.key_id ?? "key-1",
    });
    if (keyErr) {
      // Never echo keyErr.message to the caller: a Vault error can carry the
      // statement that referenced the key.
      console.error("issuer_store_key failed", keyErr);
      throw new HttpError(500, "failed to store signing key");
    }

    const now = new Date().toISOString();
    const { error: actErr } = await svc
      .from("issuers")
      .update({ status: "active", activated_at: now })
      .eq("id", issuer.id);
    if (actErr) {
      // The key is stored but the issuer is still 'verified' -- it cannot sign,
      // because issuer_get_signing_key filters on is_active. Safe to retry.
      console.error("activation update failed", actErr);
      throw new HttpError(
        500,
        "key stored but activation failed; the issuer cannot sign. Retry activation.",
      );
    }

    await svc.from("admin_actions").insert({
      actor_user_id: actor,
      action: "activate_partner_issuer",
      target_type: "issuer",
      target_id: issuer.id,
      reason: null,
      metadata: {
        slug: issuer.slug,
        domain: issuer.verification_domain,
        verification_method: issuer.verification_method,
        key_id: issuer.key_id ?? "key-1",
        public_key_multibase: key.multibase,
      },
    });

    return jsonResponse({
      ok: true,
      status: "active",
      slug: issuer.slug,
      issuer_url: `https://credentials.certidemy.com/issuers/${issuer.slug}`,
      key_id: issuer.key_id ?? "key-1",
      // The PUBLIC half only. Published in the issuer Profile anyway; returning
      // it lets the caller confirm the Profile matches without a second fetch.
      public_key_multibase: key.multibase,
      activated_at: now,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
