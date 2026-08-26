// GET /functions/v1/lti-jwks
//
// PUBLIC endpoint (verify_jwt = false, PINNED in config.toml). Serves the JSON
// Web Key Set an LTI platform uses to verify messages we signed.
//
// The published URL is https://certidemy.com/lti/jwks -- a flat route handler
// that proxies this, the same arrangement the four Open Badges identifier URLs
// use. An LMS admin pastes a certidemy.com URL into a registration form, and
// the implementation stays here where the key lives.
//
// ============================== WHY THIS MUST STAY PUBLIC =================
//
// A JWKS that requires authentication is not a JWKS. The platform fetches it
// server-to-server with no credential of ours, usually at registration and then
// again whenever it meets a kid it does not recognise. verify_jwt = false is
// pinned in config.toml for exactly the reason the file records: a redeploy
// that drops the flag silently re-privatises a public endpoint, and this repo
// has done that to four functions already. If this one goes private, every
// launch at every institution fails signature verification at once.
//
// ============================== WHY MORE THAN ONE KEY ====================
//
// This serves every key that is not retired -- 'active' and 'retiring' both.
//
// Rotation is the reason. A platform caches by kid, so during a rotation there
// is a window where some platforms hold the old key and some the new. Serving
// only the newest would break every platform that has not re-fetched yet, which
// is an outage caused by good hygiene. Serving both costs nothing: a verifier
// selects by the kid in the message header and ignores the rest.
//
// Order is newest-first, which is a courtesy to anyone reading it by eye. No
// verifier depends on it.
//
// ============================== WHAT IS NOT HERE =========================
//
// No private material, obviously -- lti_tool_keys.public_jwk is the published
// half and the private half only ever exists in Vault. But also note the SELECT
// below names its columns: `public_jwk` and `kid`, never `vault_secret_id`.
// Selecting the row and serializing it would put a Vault pointer in a public
// document. It would not be exploitable on its own, and it would still be a
// pointer to a signing key in a document served to the whole internet.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

/** The media type registered for a JWK Set. */
const JWKS_JSON = "application/jwk-set+json";

/**
 * Cacheable, but not for long.
 *
 * A platform that meets an unknown kid re-fetches this, so a long cache turns a
 * key rotation into an outage lasting as long as the TTL. Five minutes is long
 * enough to absorb a burst of launches and short enough that a rotation is
 * visible within one coffee.
 */
const CACHE = "public, max-age=300, s-maxage=300";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  try {
    const svc = getServiceClient();

    // ONE UNBROKEN LITERAL -- a concatenated select collapses the row type to
    // GenericStringError and every field access below becomes a TS2339.
    const { data: rows, error } = await svc
      .from("lti_tool_keys")
      .select("kid, alg, public_jwk, status, created_at")
      .neq("status", "retired")
      .order("created_at", { ascending: false });

    if (error) throw new Error(`lti_tool_keys: ${error.message}`);

    // An empty key set is a VALID JWKS document and the honest answer before
    // any key has been minted. It is not a 500: nothing is broken, there is
    // simply nothing to verify against yet, and a platform reading `{"keys":[]}`
    // learns exactly that. A 500 here would send an LMS admin hunting for an
    // outage during what is really an incomplete setup.
    const keys = (rows ?? [])
      .map((r) => r.public_jwk)
      .filter((jwk): jwk is Record<string, unknown> =>
        jwk !== null && typeof jwk === "object"
      );

    return new Response(JSON.stringify({ keys }, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "content-type": `${JWKS_JSON}; charset=utf-8`,
        "cache-control": CACHE,
      },
    });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
