// POST /functions/v1/list-users  --  CENSUS-SHARED-v1
//
// Body: { } (no params -- returns the full account census)
// Auth: Bearer JWT -- MUST be a platform_admin.
//
// The whole-user census for the admin console: EVERY account, not just the ones
// a partner manages. Built for growth/retention -- each account is placed at a
// funnel stage and tagged dormant / unconfirmed so a marketer can segment and
// export an audience.
//
// This function is now a THIN AUTH GATE. All derivation lives in
// ../_shared/census.ts, so sync-to-ghl computes the identical census in-process
// instead of invoking this endpoint over HTTP (which could never authenticate:
// a service-role key is not a user JWT). If you need to change how a funnel
// stage is derived, change it in census.ts and BOTH surfaces move together.
//
// Deploy WITHOUT --no-verify-jwt. This endpoint is admin-only.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";
import { buildCensus } from "../_shared/census.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  try {
    // --- Authorize: caller must be platform_admin --------------------------
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

    // --- Derive (shared module) ---------------------------------------------
    const { users, summary } = await buildCensus(svc);

    return jsonResponse({ users, summary });
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    console.error("list-users failed:", err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
