// GET/POST /functions/v1/get-credential-certificate
//
// PUBLIC endpoint (deploy with --no-verify-jwt). Returns the PDF certificate
// for a valid credential.
//
//   GET ?id=<uuid>&locale=<en|es-419|pt-BR>
//   GET ?code=SM-I-XXXX-XXXX&locale=...
//   POST { id?, code?, locale? }
//
// Behavior:
//   - Resolves the credential by id (preferred) or code, service-role.
//   - Re-evaluates validity the SAME way verify-credential does: a revoked
//     or expired credential gets NO certificate (403). Verification and
//     issuance of the artifact share one definition of "valid".
//   - Lazy + cached: if a certificate_path is already stored, returns a
//     fresh signed URL to it. Otherwise renders the PDF, uploads it to the
//     private `certificates` bucket, stores the path, and returns the URL.
//   - The score is never included — consistent with verify-credential.
//
// Locale: the render language. Preference order:
//   explicit ?locale=  ->  credential.locale (stamped at mint time)  ->  en.
// The credential CODE and verify URL are language-neutral, so verification
// is universal regardless of the document's language.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { renderCertificate, type CertificateData } from "../_shared/certificate.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BUCKET = "certificates";
const SIGNED_URL_TTL = 60 * 60; // 1 hour

// Public site origin for the QR verify URL. Override via env if the domain
// changes; defaults to the live Cloudflare Pages site.
const VERIFY_BASE =
  Deno.env.get("PUBLIC_SITE_URL") ?? "https://certidemy.pages.dev";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let id: string | null = null;
    let code: string | null = null;
    let locale: string | null = null;

    if (req.method === "GET") {
      const url = new URL(req.url);
      id = url.searchParams.get("id");
      code = url.searchParams.get("code");
      locale = url.searchParams.get("locale");
    } else if (req.method === "POST") {
      const body = (await req.json().catch(() => ({}))) as {
        id?: string;
        code?: string;
        locale?: string;
      };
      id = body.id ?? null;
      code = body.code ?? null;
      locale = body.locale ?? null;
    } else {
      return jsonResponse({ error: "method not allowed" }, 405);
    }

    if (!id && !code) {
      return jsonResponse({ error: "id or code required" }, 400);
    }
    if (id && !UUID_RE.test(id)) {
      return jsonResponse({ found: false }, 404);
    }

    const svc = getServiceClient();

    let query = svc
      .from("credentials")
      .select(
        "id, credential_code, holder_name, certification_name, certification_code, issued_at, expires_at, status, locale, certificate_path",
      );
    query = id
      ? query.eq("id", id)
      : query.eq("credential_code", code!.trim().toUpperCase());

    const { data: cred, error } = await query.maybeSingle();
    if (error) {
      console.error("credential lookup failed", error);
      return jsonResponse({ error: "lookup failed" }, 500);
    }
    if (!cred) return jsonResponse({ found: false }, 404);

    // Validity gate — identical semantics to verify-credential.
    const expired =
      cred.expires_at !== null &&
      new Date(cred.expires_at).getTime() < Date.now();
    const effectiveStatus =
      expired && cred.status === "active" ? "expired" : cred.status;
    if (effectiveStatus !== "active") {
      return jsonResponse(
        { error: "credential is not active", status: effectiveStatus },
        403,
      );
    }

    const renderLocale = locale ?? cred.locale ?? "en";

    // Cache hit: return a signed URL to the stored PDF.
    if (cred.certificate_path) {
      const { data: signed, error: signErr } = await svc.storage
        .from(BUCKET)
        .createSignedUrl(cred.certificate_path, SIGNED_URL_TTL, {
          download: `${cred.credential_code}.pdf`,
        });
      if (!signErr && signed?.signedUrl) {
        return jsonResponse({
          url: signed.signedUrl,
          credential_code: cred.credential_code,
          cached: true,
        });
      }
      // If signing failed (e.g. object was removed), fall through and
      // regenerate rather than erroring.
      console.warn("signed url for cached path failed; regenerating", signErr);
    }

    // Generate.
    const certData: CertificateData = {
      id: cred.id,
      credential_code: cred.credential_code,
      holder_name: cred.holder_name,
      certification_name: cred.certification_name,
      certification_code: cred.certification_code,
      issued_at: cred.issued_at,
    };
    const pdfBytes = await renderCertificate(certData, renderLocale, VERIFY_BASE);

    // Path is deterministic per credential so regeneration overwrites rather
    // than orphaning. `upsert: true` makes the upload idempotent.
    const path = `${cred.id}/certificate.pdf`;
    const { error: upErr } = await svc.storage
      .from(BUCKET)
      .upload(path, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (upErr) {
      console.error("certificate upload failed", upErr);
      return jsonResponse({ error: "could not store certificate" }, 500);
    }

    // Record the path for cache hits next time (best-effort; a failure here
    // doesn't block returning the freshly-rendered certificate).
    if (cred.certificate_path !== path) {
      const { error: updErr } = await svc
        .from("credentials")
        .update({ certificate_path: path })
        .eq("id", cred.id);
      if (updErr) console.warn("could not persist certificate_path", updErr);
    }

    const { data: signed, error: signErr } = await svc.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL, {
        download: `${cred.credential_code}.pdf`,
      });
    if (signErr || !signed?.signedUrl) {
      console.error("could not sign fresh certificate", signErr);
      return jsonResponse({ error: "could not sign certificate" }, 500);
    }

    return jsonResponse({
      url: signed.signedUrl,
      credential_code: cred.credential_code,
      cached: false,
    });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "certificate generation failed" }, 500);
  }
});
