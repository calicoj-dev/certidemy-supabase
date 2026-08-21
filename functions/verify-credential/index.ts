// GET/POST /functions/v1/verify-credential
//
// PUBLIC endpoint (deploy with --no-verify-jwt). The credential VERIFIER —
// an employer, recruiter, or anyone handed a credential link/code — hits
// this without an account.
//
//   GET  ?id=<uuid>            (the /verify/<id> page)
//   GET  ?code=SMPC-XXXX-XXXX  (manual code lookup)
//   POST { id } or { code }
//
// Security model: the credentials table has NO anon RLS policy, so it can
// never be enumerated through PostgREST. This function is the only public
// read path, it requires an exact unguessable id (or exact code), and it
// returns ONLY the sanitized public fields. The score is deliberately not
// exposed — verification answers "is this credential genuine and active?",
// nothing more.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    let id: string | null = null;
    let code: string | null = null;

    if (req.method === "GET") {
      const url = new URL(req.url);
      id = url.searchParams.get("id");
      code = url.searchParams.get("code");
    } else if (req.method === "POST") {
      const body = (await req.json().catch(() => ({}))) as {
        id?: string;
        code?: string;
      };
      id = body.id ?? null;
      code = body.code ?? null;
    } else {
      return jsonResponse({ error: "method not allowed" }, 405);
    }

    if (!id && !code) {
      return jsonResponse({ error: "id or code required" }, 400);
    }
    if (id && !UUID_RE.test(id)) {
      // Malformed ids get the same answer as missing credentials — no
      // distinction that aids probing.
      return jsonResponse({ found: false }, 404);
    }

    const svc = getServiceClient();
    let query = svc
      .from("credentials")
      .select(
        "id, credential_code, holder_name, certification_name, certification_code, " +
          "issued_at, expires_at, status, is_specimen, issuer_id, certification_id, " +
          "achievement_id, issuers(slug, name, site_url), " +
          "achievements(achievement_type, image_path, criteria_url)"
      );
    query = id ? query.eq("id", id) : query.eq("credential_code", code!.trim().toUpperCase());

    const { data: credData } = await query.maybeSingle();

    /* Cast through unknown, once.

       PostgREST infers a row type from the select STRING. The select above is
       built by concatenation to stay readable, and a concatenated expression
       is not a literal -- inference falls back to GenericStringError and every
       property access on the row fails, including ones that predate this
       change.

       This is also the only place the row's shape is written down, so a column
       added to the select and forgotten here is a compile error rather than an
       undefined at runtime. */
    const cred = (credData ?? null) as unknown as {
      id: string;
      credential_code: string;
      holder_name: string;
      certification_name: string;
      certification_code: string;
      issued_at: string;
      expires_at: string | null;
      status: string;
      is_specimen: boolean | null;
      issuer_id: string | null;
      certification_id: string | null;
      achievement_id: string | null;
      issuers: { slug: string; name: string; site_url: string } | null;
      achievements: {
        achievement_type: string;
        image_path: string | null;
        criteria_url: string | null;
      } | null;
    } | null;

    if (!cred) return jsonResponse({ found: false }, 404);

    /* ---- who issued this, and what kind of thing is it? ---------------
       The page needs both to render honestly. Without them it assumed
       Certidemy for everything: a partner's course credential showed a
       missing badge, the word CERTIFICATION, a blueprint that could not
       load, and -- worst -- offered LinkedIn an "Add to profile" link
       attributing the course to Certidemy. */
    const issuerRow = cred.issuers;
    const achRow = cred.achievements;

    // Certidemy standing behind the credential, versus merely hosting it. Not
    // the same question as "which issuer", and a boolean the page can branch
    // on beats every caller re-deriving it from a slug and one getting it
    // wrong.
    const is_certification = cred.certification_id !== null;

    // Expiry is evaluated live, never trusted from the stored status alone.
    const expired =
      cred.expires_at !== null && new Date(cred.expires_at).getTime() < Date.now();
    // A specimen is a marketing artifact, not a certification decision. Its
    // stored status stays "active" so the certificate renders through the
    // normal path -- but verification must never call it genuine. Saying
    // "valid" here is the fraud vector the specimen design exists to avoid.
    const effective_status = cred.is_specimen
      ? "specimen"
      : expired && cred.status === "active"
        ? "expired"
        : cred.status;

    return jsonResponse({
      found: true,
      credential: {
        id: cred.id,
        credential_code: cred.credential_code,
        holder_name: cred.holder_name,
        certification_name: cred.certification_name,
        certification_code: cred.certification_code,
        issued_at: cred.issued_at,
        expires_at: cred.expires_at,
        status: effective_status,
        valid: effective_status === "active",
        is_specimen: cred.is_specimen === true,

        /* Everything below already appears in the credential document
           open-badge serves publicly at /credentials/<code>. This endpoint
           was returning less than the document beside it, and the page paid
           for the difference. The score is still absent, which is the rule
           this endpoint exists to keep. */
        is_certification,
        issuer_slug: issuerRow?.slug ?? null,
        issuer_name: issuerRow?.name ?? null,
        issuer_site_url: issuerRow?.site_url ?? null,
        achievement_type: achRow?.achievement_type ?? null,
        // NULL for a Certidemy scheme: its artwork is compiled into
        // _shared/badges.ts and served from /badges/<code>.png, not storage.
        image_url: achRow?.image_path ?? null,
        criteria_url: achRow?.criteria_url ?? null,
      },
    });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "verification failed" }, 500);
  }
});
