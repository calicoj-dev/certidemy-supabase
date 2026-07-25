// POST /functions/v1/test-ghl-connection
//
// Body: { } (operates on the 'gohighlevel' integration row)
// Auth: Bearer JWT -- MUST be a platform_admin.
//
// Reads the Vault-encrypted GHL token (integration_read_token) + the stored
// location_id, then does a READ-ONLY probe against GHL:
//   GET https://services.leadconnectorhq.com/locations/{locationId}
//   headers: Authorization: <token>, Version: 2021-07-28
//
// On success -> stamps status 'connected', clears last_error, returns the
// location name so the admin can confirm the RIGHT sub-account. On failure ->
// stamps status 'error' + last_error so the card can show what went wrong.
//
// Read-only against GHL (no writes to the CRM), so it is safe to run anytime.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";
const SLUG = "gohighlevel";

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

    // Pull the stored config (location_id) -- non-secret, plain column.
    const { data: row } = await svc
      .from("platform_integrations")
      .select("status, config")
      .eq("slug", SLUG)
      .maybeSingle();

    if (!row || row.status === "disconnected") {
      throw new HttpError(400, "GoHighLevel is not connected yet");
    }
    const locationId = (row.config as { location_id?: string } | null)?.location_id;
    if (!locationId) {
      throw new HttpError(400, "no location_id saved -- reconnect with a Location ID");
    }

    // Read the decrypted token (service-role only path).
    const { data: token, error: tErr } = await svc.rpc("integration_read_token", {
      p_slug: SLUG,
    });
    if (tErr) throw new Error(`integration_read_token: ${tErr.message}`);
    if (!token) throw new HttpError(400, "no token stored -- reconnect");

    // Probe GHL (read-only).
    let ok = false;
    let locationName: string | null = null;
    let errorText: string | null = null;
    try {
      const resp = await fetch(`${GHL_BASE}/locations/${locationId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Version: GHL_VERSION,
          Accept: "application/json",
        },
      });
      if (resp.ok) {
        ok = true;
        const j = (await resp.json()) as { location?: { name?: string } };
        locationName = j?.location?.name ?? null;
      } else {
        errorText = `GHL responded ${resp.status}: ${(await resp.text()).slice(0, 200)}`;
      }
    } catch (e) {
      errorText = `network error reaching GHL: ${(e as Error).message}`;
    }

    // Stamp the result onto the row (status + last_error).
    await svc
      .from("platform_integrations")
      .update({
        status: ok ? "connected" : "error",
        last_error: ok ? null : errorText,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", SLUG);

    if (!ok) {
      return jsonResponse({ ok: false, error: errorText ?? "connection test failed" });
    }
    return jsonResponse({ ok: true, locationName });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
