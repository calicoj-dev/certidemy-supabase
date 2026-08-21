// POST /functions/v1/regenerate-certificate
//
// Body: { credential_id, locale? }
// Auth: Bearer JWT (platform_admin only)
//
// Forces a fresh PDF render of an already-issued certificate and overwrites the
// stored copy. This is the lever that makes a TEMPLATE change retroactive: the
// PDF is cached in storage, so editing _shared/certificate.ts changes nothing on
// credentials already issued until their stored copy is rebuilt. This rebuilds
// it, synchronously, so the admin sees the new certificate immediately.
//
// It is NOT a data edit. Holder name, score, date, code - none of it changes. A
// name correction is a different operation (update-credential-name), which edits
// the row AND happens to trigger a regen as a side effect. This function only
// re-renders from the current template against the current PUBLIC_SITE_URL.
//
// SYNCHRONOUS by decision: renders + uploads before responding, so the caller
// can verify the fix landed rather than trusting a lazy rebuild. This is a
// low-volume admin action (a few at a time), so the few-second render cost is
// acceptable.
//
// VALIDITY GATE: identical to get-credential-certificate. A revoked or expired
// credential gets no certificate - regenerating one would manufacture a valid
// artifact for an invalid credential. Verification and artifact issuance share
// one definition of "valid".

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";
import {
  renderCertificate,
  CERTIFICATE_RENDERER_VERSION,
  type CertificateData,
} from "../_shared/certificate.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BUCKET = "certificates";
const SIGNED_URL_TTL = 60 * 60; // 1 hour

const VERIFY_BASE =
  Deno.env.get("PUBLIC_SITE_URL") ?? "https://certidemy.com";

interface Body {
  credential_id?: string;
  locale?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return jsonResponse({ error: "method not allowed" }, 405);

  try {
    const svc = getServiceClient();
    const caller = await authenticate(req);

    const body = (await req.json()) as Body;
    const credentialId = body.credential_id?.trim();
    if (!credentialId || !UUID_RE.test(credentialId)) {
      throw new HttpError(400, "valid credential_id required");
    }

    // 1. Authorization: platform_admin only.
    const { data: profile } = await svc
      .from("profiles")
      .select("platform_role")
      .eq("id", caller)
      .maybeSingle();

    const isPlatformAdmin =
      (profile as { platform_role?: string } | null)?.platform_role ===
      "platform_admin";

    if (!isPlatformAdmin) {
      throw new HttpError(403, "only a platform admin can regenerate a certificate");
    }

    // 2. Load the credential.
    const { data: cred, error: cErr } = await svc
      .from("credentials")
      .select(
        "id, credential_code, holder_name, certification_name, certification_code, issued_at, expires_at, status, locale, certificate_path, is_specimen, certification_id, issuers(slug, name), achievements(achievement_type, image_path)",
      )
      .eq("id", credentialId)
      .maybeSingle();

    if (cErr) {
      console.error("credential lookup failed", cErr);
      throw new HttpError(500, "lookup failed");
    }
    if (!cred) throw new HttpError(404, "credential not found");

    /* The issuer and the achievement, for the certificate's wording and its
       signature. Cast narrowly -- only the two embedded objects, not the whole
       row -- because the generated types do not carry these tables while the
       rest of the row still infers correctly from the literal select above. */
    const embedded = cred as unknown as {
      certification_id: string | null;
      issuers: { slug: string; name: string } | null;
      achievements: { achievement_type: string; image_path: string | null } | null;
    };
    const isCertification = embedded.certification_id !== null;

    // 3. Validity gate - same semantics as get-credential-certificate.
    const expired =
      cred.expires_at !== null &&
      new Date(cred.expires_at).getTime() < Date.now();
    const effectiveStatus =
      expired && cred.status === "active" ? "expired" : cred.status;

    if (effectiveStatus !== "active") {
      throw new HttpError(
        409,
        `cannot regenerate a certificate for a ${effectiveStatus} credential`,
      );
    }

    // 4. Render from the CURRENT template against the CURRENT site URL.
    const renderLocale = body.locale ?? cred.locale ?? "en";
    const certData: CertificateData = {
      id: cred.id,
      credential_code: cred.credential_code,
      holder_name: cred.holder_name,
      certification_name: cred.certification_name,
      certification_code: cred.certification_code,
      issued_at: cred.issued_at,
      expires_at: cred.expires_at,
      // Without this, regenerating a specimen strips its mark and yields a
      // certificate indistinguishable from a real one.
      is_specimen: cred.is_specimen === true,
      // WITHOUT THESE a partner's certificate says CERTIFICATE OF COMPETENCE
      // and carries Juan Roman's signature. The renderer defaults to the
      // certification wording when it is told nothing, which is correct for
      // every Certidemy credential and wrong for everyone else.
      achievement_type: embedded.achievements?.achievement_type ?? null,
      is_certification: isCertification,
      issuer_name: embedded.issuers?.name ?? null,
      // NULL for a certification -- its badge is compiled in, not stored.
      // Omitting it for a partner draws a placeholder on a certificate whose
      // badge is fine everywhere else.
      image_url: embedded.achievements?.image_path ?? null,
    };

    const pdfBytes = await renderCertificate(certData, renderLocale, VERIFY_BASE);

    // 5. Overwrite the stored copy. Deterministic path => upsert overwrites
    //    rather than orphaning the old file.
    const path =
      `${cred.id}/v${CERTIFICATE_RENDERER_VERSION}/${renderLocale}/certificate.pdf`;
    const { error: upErr } = await svc.storage
      .from(BUCKET)
      .upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });

    if (upErr) {
      console.error("certificate upload failed", upErr);
      throw new HttpError(500, "could not store the regenerated certificate");
    }

    // 6. Persist the path (idempotent; it's usually already set).
    if (cred.certificate_path !== path) {
      const { error: updErr } = await svc
        .from("credentials")
        .update({ certificate_path: path })
        .eq("id", cred.id);
      if (updErr) console.warn("could not persist certificate_path", updErr);
    }

    // 7. Audit.
    await svc.from("admin_actions").insert({
      actor_user_id: caller,
      action: "certificate_regenerated",
      target_type: "credential",
      target_id: cred.id,
      reason: "Certificate re-rendered from current template",
      metadata: {
        credential_code: cred.credential_code,
        locale: renderLocale,
        site_url: VERIFY_BASE,
      },
    });

    // 8. Hand back a signed URL so the admin can open the fresh PDF now.
    const { data: signed, error: signErr } = await svc.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL, {
        download: `${cred.credential_code}.pdf`,
      });

    if (signErr || !signed?.signedUrl) {
      console.error("could not sign regenerated certificate", signErr);
      // The regen succeeded; only the convenience URL failed.
      return jsonResponse({
        ok: true,
        regenerated: true,
        credential_code: cred.credential_code,
        url: null,
      });
    }

    return jsonResponse({
      ok: true,
      regenerated: true,
      credential_code: cred.credential_code,
      url: signed.signedUrl,
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: "certificate regeneration failed" }, 500);
  }
});
