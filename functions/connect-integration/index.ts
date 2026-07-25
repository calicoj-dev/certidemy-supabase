// POST /functions/v1/connect-integration
//
// Body:
//   { action: "connect", slug, token, config }  -> store/rotate the token (Vault) + config
//   { action: "disconnect", slug }              -> wipe the Vault secret, reset the row
// Auth: Bearer JWT -- MUST be a platform_admin.
//
// The write path for the encrypted-credential store (migration 144). The token
// is handed to integration_store_token(), which puts it in Vault and keeps only
// a pointer + last-4 in platform_integrations. This function NEVER stores the
// token itself and NEVER returns it -- write-only, by design. "Rotate" is just
// "connect" again with a new token; the RPC overwrites the Vault secret in place.
//
// Non-secret config (e.g. GHL location_id) rides along in `config` and is stored
// plainly -- it's a public identifier, not a credential.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";

interface Body {
  action: "connect" | "disconnect";
  slug: string;
  token?: string;
  config?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  try {
    const actorId = await authenticate(req);
    const svc = getServiceClient();

    // Authorize: platform_admin only.
    const { data: actorProfile } = await svc
      .from("profiles")
      .select("platform_role")
      .eq("id", actorId)
      .maybeSingle();
    if (!actorProfile || actorProfile.platform_role !== "platform_admin") {
      throw new HttpError(403, "platform_admin required");
    }

    const body = (await req.json()) as Body;
    if (!body.slug) throw new HttpError(400, "slug required");

    if (body.action === "disconnect") {
      const { error } = await svc.rpc("integration_clear", { p_slug: body.slug });
      if (error) throw new Error(`integration_clear: ${error.message}`);
      return jsonResponse({ ok: true, slug: body.slug, status: "disconnected" });
    }

    if (body.action === "connect") {
      const token = (body.token ?? "").trim();
      if (!token) throw new HttpError(400, "token required");
      if (token.length < 8) throw new HttpError(400, "token looks too short");

      const { error } = await svc.rpc("integration_store_token", {
        p_slug: body.slug,
        p_token: token,
        p_config: body.config ?? {},
        p_actor: actorId,
      });
      if (error) throw new Error(`integration_store_token: ${error.message}`);

      // Read back STATUS only (never the token) so the UI can render immediately.
      const { data: row } = await svc
        .from("platform_integrations")
        .select("slug, status, key_last4, config, connected_at")
        .eq("slug", body.slug)
        .maybeSingle();

      return jsonResponse({ ok: true, integration: row });
    }

    throw new HttpError(400, "unknown action");
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
