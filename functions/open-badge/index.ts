// GET /functions/v1/open-badge
//
// PUBLIC endpoint (deploy with --no-verify-jwt). Serves the four Open Badges
// 3.0 / W3C Verifiable Credentials documents:
//
//   ?doc=issuer                     -> the issuer Profile + public key
//   ?doc=achievement&cert=AIE-I     -> the Achievement definition
//   ?doc=credential&code=AIE-I-...  -> a holder's SIGNED credential
//   ?doc=status&list=1              -> the Bitstring Status List
//
// ============================== WHY ONE FUNCTION ===========================
//
// Four functions would mean four copies of the issuer lookup and four places
// the signing key is read. The signing path exists once, here.
//
// The canonical public URLs live on certidemy.com (/issuer, /achievements/CODE,
// /credentials/CODE, /status/N) as thin Next.js route handlers that proxy to
// this. Those URLs are the credential identifiers and must never move — a
// credential's `id` is a promise that the document stays fetchable there.
//
// ============================== SECURITY ===================================
//
// - The private key is read via issuer_get_signing_key (service_role only,
//   migration 186) and never leaves this function. Only the signature does.
// - SPECIMENS ARE REFUSED (404). A signed specimen would genuinely verify —
//   it really was signed by Certidemy — and a machine cannot see the amber
//   banner a human sees on the verify page. That is the credential-og fraud
//   vector (v4.5 §3) with a cryptographic guarantee bolted on.
// - Revoked and expired credentials ARE served. Their standing travels in the
//   status list and validUntil. A 404 on a revoked credential tells a verifier
//   nothing and invites them to trust a cached copy.
// - Only `available` certifications get an Achievement document. A draft cert's
//   blueprint is not a published claim.
// - No key -> refuse with 503. An unsigned credential that looks complete is
//   worse than no credential.
//
// ============================== CACHING ====================================
//
// Output is byte-stable: the proof's `created` comes from
// credentials.material_updated_at, not the clock. Two fetches a month apart
// return identical bytes, so these are genuinely cacheable. The status list is
// the exception — it changes on every revocation and is served no-store.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import {
  buildAchievement,
  buildCredential,
  buildIssuerProfile,
  buildStatusBitstring,
  buildStatusListCredential,
  hashSubjectIdentifier,
  isSignable,
  signDocument,
  type IssuerRow,
  type SnapshotDomain,
} from "../_shared/ob3.ts";

const ISSUER_SLUG = "certidemy";

/** Credentials are JSON-LD, not plain JSON. Consumers sniff this. */
const LD_JSON = "application/vc+ld+json";

function ldResponse(
  body: unknown,
  cache: string,
  status = 200,
): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": `${LD_JSON}; charset=utf-8`,
      "cache-control": cache,
    },
  });
}

/** One day at the edge; the documents only change when material changes. */
const CACHE_STABLE = "public, max-age=3600, s-maxage=86400";
const CACHE_NEVER = "no-store";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "GET") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  try {
    const url = new URL(req.url);
    const doc = (url.searchParams.get("doc") ?? "issuer").toLowerCase();
    const svc = getServiceClient();

    // ---- Issuer, always. Every document names it. -----------------------
    const { data: issuerRow, error: issuerErr } = await svc
      .from("issuers")
      .select(
        "slug, name, site_url, issuer_url, key_id, public_key_multibase, key_created_at",
      )
      .eq("slug", ISSUER_SLUG)
      .eq("is_active", true)
      .maybeSingle();

    if (issuerErr) throw new Error(`issuer lookup: ${issuerErr.message}`);
    if (!issuerRow) return jsonResponse({ error: "issuer not configured" }, 503);

    const issuer = issuerRow as IssuerRow;
    const siteUrl = issuer.site_url;

    /* ------------------------------------------------------------ issuer -- */

    if (doc === "issuer") {
      return ldResponse(buildIssuerProfile(issuer), CACHE_STABLE);
    }

    /* ------------------------------------------------------- achievement -- */

    if (doc === "achievement") {
      const cert = url.searchParams.get("cert");
      if (!cert) return jsonResponse({ error: "cert required" }, 400);

      const achievement = await loadAchievement(svc, cert, issuer, siteUrl);
      if (!achievement) return jsonResponse({ error: "not found" }, 404);

      // The definition is NOT signed. It describes what a certification
      // requires today and is expected to change as the JTA versions; a
      // signature would assert permanence it does not have. What is signed is
      // the credential, which pins its own snapshot of this.
      return ldResponse(achievement, CACHE_STABLE);
    }

    /* -------------------------------------------------------- credential -- */

    if (doc === "credential") {
      const code = url.searchParams.get("code");
      if (!code) return jsonResponse({ error: "code required" }, 400);

      const { data: cred, error: credErr } = await svc
        .from("credentials")
        .select(
          "id, credential_code, user_id, certification_code, holder_name, " +
            "issued_at, expires_at, status, is_specimen, subject_salt, " +
            "status_list_index, material_updated_at, jta_version_id",
        )
        .eq("credential_code", code.trim().toUpperCase())
        .maybeSingle();

      if (credErr) throw new Error(`credential lookup: ${credErr.message}`);
      if (!cred) return jsonResponse({ error: "not found" }, 404);

      // Specimen check FIRST, through the shared rule. Never re-derived here.
      if (!isSignable(cred)) {
        return jsonResponse({ error: "not found" }, 404);
      }

      const achievement = await loadAchievement(
        svc,
        cred.certification_code,
        issuer,
        siteUrl,
        cred.jta_version_id,
      );
      if (!achievement) {
        throw new Error(
          `credential ${cred.credential_code} references certification ` +
            `${cred.certification_code}, which has no achievement definition`,
        );
      }

      // The holder's email, for the salted subject identifier. Read from auth,
      // hashed immediately, and never placed in the document.
      const { data: authUser } = await svc.auth.admin.getUserById(cred.user_id);
      const email = authUser?.user?.email ?? null;
      const subjectIdentifierHash = email
        ? await hashSubjectIdentifier(email, cred.subject_salt)
        : null;

      const statusListId = `${siteUrl}/status/1`;

      const unsigned = buildCredential({
        credentialCode: cred.credential_code,
        holderName: cred.holder_name,
        // A credential with no resolvable holder identity is still a valid
        // credential; it just cannot be auto-matched to an employee record.
        subjectIdentifierHash: subjectIdentifierHash ?? "",
        subjectSalt: cred.subject_salt,
        issuedAt: cred.issued_at,
        expiresAt: cred.expires_at,
        statusListIndex: cred.status_list_index,
        statusListId,
        achievement,
        issuer,
        siteUrl,
        jtaVersion: (achievement["certidemy:jtaVersion"] as string) ?? null,
      });

      const privateKey = await readSigningKey(svc);
      if (!privateKey) {
        return jsonResponse(
          { error: "issuer has no signing key; credential cannot be issued" },
          503,
        );
      }

      const signed = await signDocument(
        unsigned,
        privateKey,
        issuer,
        // Stable by construction — see the caching note at the top.
        new Date(cred.material_updated_at).toISOString(),
      );

      return ldResponse(signed, CACHE_STABLE);
    }

    /* ------------------------------------------------------------ status -- */

    if (doc === "status") {
      const listNumber = Number(url.searchParams.get("list") ?? "1");
      if (!Number.isInteger(listNumber) || listNumber < 1) {
        return jsonResponse({ error: "invalid list" }, 400);
      }

      // Only genuine credentials occupy bits. Specimens are never issued as
      // credentials, so their indices stay 0 and are never consulted.
      const { data: revoked, error: revErr } = await svc
        .from("credentials")
        .select("status_list_index")
        .eq("status", "revoked")
        .eq("is_specimen", false);

      if (revErr) throw new Error(`status list: ${revErr.message}`);

      const indices = (revoked ?? []).map(
        (r: { status_list_index: number }) => r.status_list_index,
      );
      const encodedList = await buildStatusBitstring(indices);

      const unsigned = buildStatusListCredential(
        issuer,
        listNumber,
        encodedList,
        new Date().toISOString(),
      );

      const privateKey = await readSigningKey(svc);
      if (!privateKey) {
        return jsonResponse({ error: "issuer has no signing key" }, 503);
      }

      // The status list IS signed — otherwise anyone could serve a list of
      // zeroes and un-revoke every credential Certidemy ever withdrew.
      const signed = await signDocument(
        unsigned,
        privateKey,
        issuer,
        unsigned.validFrom as string,
      );

      return ldResponse(signed, CACHE_NEVER);
    }

    return jsonResponse({ error: `unknown doc "${doc}"` }, 400);
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "open badge generation failed" }, 500);
  }
});

/* ========================================================================== *
 * Helpers
 * ========================================================================== */

// deno-lint-ignore no-explicit-any
type Svc = any;

async function readSigningKey(svc: Svc): Promise<string | null> {
  const { data, error } = await svc.rpc("issuer_get_signing_key", {
    p_slug: ISSUER_SLUG,
  });
  if (error) throw new Error(`issuer_get_signing_key: ${error.message}`);
  return (data as string | null) ?? null;
}

/**
 * Build the Achievement for a certification.
 *
 * TWO SNAPSHOTS, TWO MOMENTS, BOTH CORRECT (v5.8 §3):
 *
 * When jtaVersionId is given (a credential), domains come from that version's
 * blueprint_snapshot — what the holder was actually assessed against. Reading
 * live rows would silently rewrite every issued credential each time the JTA
 * versions.
 *
 * But the certification NAME comes from the live row, never from the snapshot.
 * AIMS-F's v2.0 snapshot still says "ISO/IEC 42001 Foundation" because
 * migration 180 added edition years afterwards and snapshots are deliberately
 * not rewritten. Taking the name from there would stamp a stale product name
 * onto every signed credential.
 *
 * When jtaVersionId is null (the public definition), domains come from the
 * current published version — the definition describes what the certification
 * requires today.
 */
async function loadAchievement(
  svc: Svc,
  certCode: string,
  issuer: IssuerRow,
  siteUrl: string,
  jtaVersionId?: string | null,
): Promise<Record<string, unknown> | null> {
  const { data: cert } = await svc
    .from("certifications")
    .select(
      "id, code, name, description, status, passing_score_pct, num_questions, validity_days",
    )
    .ilike("code", certCode.trim())
    .maybeSingle();

  if (!cert) return null;
  // A draft certification's blueprint is not a published claim. Credentials
  // pass their own jta_version_id and bypass this — a cert can be withdrawn
  // after issuance without breaking credentials already in the world.
  if (!jtaVersionId && cert.status !== "available") return null;

  let snapshotQuery = svc
    .from("jta_versions")
    .select("id, version_string, status, blueprint_snapshot")
    .eq("certification_id", cert.id);

  snapshotQuery = jtaVersionId
    ? snapshotQuery.eq("id", jtaVersionId)
    : snapshotQuery.eq("status", "published").order("created_at", {
      ascending: false,
    }).limit(1);

  const { data: versionRows } = await snapshotQuery;
  const version = (versionRows ?? [])[0];
  if (!version?.blueprint_snapshot) return null;

  const snapshot = version.blueprint_snapshot as {
    domains?: SnapshotDomain[];
  };

  // The English competence statement — the 17024 claim the credential asserts.
  //
  // The column is `lang`, not `language`. An earlier version queried the wrong
  // name and the failure was INVISIBLE: PostgREST returns an error object
  // rather than throwing, `i18n?.claim` on a failed query is undefined, `??`
  // turned it into null, and buildAchievement substituted its generic fallback
  // narrative. Every smoke test passed against a document whose single most
  // important sentence was boilerplate.
  //
  // Hence: the error is checked and thrown, and a published certification with
  // no claim is a hard failure rather than a quiet downgrade. This field is the
  // competence statement a 17024 credential cannot omit (v5.8 §2).
  const { data: i18n, error: i18nErr } = await svc
    .from("certification_i18n")
    .select("claim")
    .eq("certification_id", cert.id)
    .eq("lang", "en")
    .maybeSingle();

  if (i18nErr) {
    throw new Error(`certification_i18n lookup for ${cert.code}: ${i18nErr.message}`);
  }

  const claim = i18n?.claim ?? null;
  if (!claim && cert.status === "available") {
    throw new Error(
      `certification ${cert.code} is available but has no English claim. ` +
        `The claim is the competence statement the credential asserts; ` +
        `emitting a generic narrative in its place would understate the credential.`,
    );
  }

  const achievement = buildAchievement({
    certCode: cert.code,
    certName: cert.name, // live row, NOT the snapshot — see the note above
    description: cert.description ?? null,
    claim,
    passingScorePct: cert.passing_score_pct !== null
      ? Number(cert.passing_score_pct)
      : null,
    numQuestions: cert.num_questions ?? null,
    validityDays: cert.validity_days ?? null,
    domains: snapshot.domains ?? [],
    issuer,
    siteUrl,
  });

  if (version.version_string) {
    achievement["certidemy:jtaVersion"] = version.version_string;
  }

  return achievement;
}
