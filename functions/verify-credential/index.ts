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
        "id, credential_code, holder_name, certification_name, certification_code, issued_at, expires_at, status"
      );
    query = id ? query.eq("id", id) : query.eq("credential_code", code!.trim().toUpperCase());

    const { data: cred } = await query.maybeSingle();
    if (!cred) return jsonResponse({ found: false }, 404);

    // Expiry is evaluated live, never trusted from the stored status alone.
    const expired =
      cred.expires_at !== null && new Date(cred.expires_at).getTime() < Date.now();
    const effective_status = expired && cred.status === "active" ? "expired" : cred.status;

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
      },
    });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "verification failed" }, 500);
  }
});
