// POST /functions/v1/get-integrations
//
// Body: { } -- returns status for all integrations (never any token).
// Auth: Bearer JWT -- MUST be a platform_admin.
//
// The read side of the encrypted-credential store. platform_integrations is
// service-role only (RLS with no authenticated policy), so the console can't
// read it directly -- it reads through here, exactly like the user census reads
// through list-users. Returns status + last-4 + config + last_error, which is
// everything the card needs and nothing sensitive. The token is never selected.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  try {
    const actorId = await authenticate(req);
    const svc = getServiceClient();

    const { data: actorProfile } = await svc
      .from("profiles")
      .select("platform_role")
      .eq("id", actorId)
      .maybeSingle();
    if (!actorProfile || actorProfile.platform_role !== "platform_admin") {
      throw new HttpError(403, "platform_admin required");
    }

    // Explicit column list -- vault_secret_id and anything sensitive stay out.
    const { data, error } = await svc
      .from("platform_integrations")
      .select("slug, status, key_last4, config, last_error, connected_at, updated_at");
    if (error) throw new Error(`platform_integrations read: ${error.message}`);

    return jsonResponse({ integrations: data ?? [] });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
