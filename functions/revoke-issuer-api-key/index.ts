// POST /functions/v1/revoke-issuer-api-key
//
// Body: { key_id }
// Auth: Bearer JWT -- platform_admin, or the team_admin of the company that
//       owns the key's issuer.
//
// The console tells a partner "if it is lost, revoke this key and mint
// another" and then gives them no way to revoke it. This is that way.
//
// ============================== WHY THIS MATTERS MORE THAN IT LOOKS ========
//
// A key that cannot be revoked from the interface is a key that stays live
// after the person who held it leaves, after it is pasted into a support
// ticket, after a laptop is lost. The mint path was built first because it is
// the one that demos; this is the one that matters at 2am.
//
// ============================== SOFT, NOT DELETED =========================
//
// revoked_at is set; the row stays. issuer_api_requests references api_key_id,
// so deleting the row would orphan the log of everything that key ever issued
// -- which is exactly the record somebody wants after a key is compromised.
//
// ============================== IDEMPOTENT ================================
//
// Revoking an already-revoked key succeeds and reports the original timestamp.
// The caller wanted the key dead; it is dead. An error here would only prompt
// a second click.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";
import { requireIssuerAccess } from "../_shared/authorize.ts";

interface Body {
  key_id?: string;
  reason?: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  try {
    const actor = await authenticate(req);
    const svc = getServiceClient();

    const body = (await req.json()) as Body;
    const keyId = body.key_id?.trim();
    if (!keyId || !UUID_RE.test(keyId)) {
      throw new HttpError(400, "valid key_id required");
    }

    // key_hash is never selected. Nothing here needs it, and a hash read into
    // a function is a hash that can end up in a log line.
    const { data: key, error: kErr } = await svc
      .from("issuer_api_keys")
      .select("id, issuer_id, name, key_prefix, revoked_at")
      .eq("id", keyId)
      .maybeSingle();
    if (kErr) throw new Error(`key lookup: ${kErr.message}`);
    if (!key) throw new HttpError(404, "key not found");

    // Scoped: the team_admin of the company that owns THIS key's issuer, or a
    // platform admin. Throws 403 identically either way.
    await requireIssuerAccess(svc, actor, key.issuer_id);

    if (key.revoked_at) {
      // Already dead. The caller wanted it dead; an error would only prompt a
      // second click at the exact moment somebody is in a hurry.
      return jsonResponse({
        ok: true,
        already_revoked: true,
        key: { id: key.id, prefix: key.key_prefix, revoked_at: key.revoked_at },
      });
    }

    const now = new Date().toISOString();
    const { error: uErr } = await svc
      .from("issuer_api_keys")
      .update({ revoked_at: now, revoked_by: actor })
      .eq("id", key.id)
      .is("revoked_at", null);
    if (uErr) {
      console.error("revoke failed", uErr);
      throw new HttpError(500, "failed to revoke the key");
    }

    await svc.from("admin_actions").insert({
      actor_user_id: actor,
      action: "revoke_issuer_api_key",
      target_type: "issuer_api_key",
      target_id: key.id,
      reason: body.reason ?? null,
      // The prefix, never the hash. admin_actions is read by more people than
      // the keys table is.
      metadata: { key_prefix: key.key_prefix, name: key.name },
    });

    return jsonResponse({
      ok: true,
      key: { id: key.id, prefix: key.key_prefix, revoked_at: now },
      note:
        "Any request presenting this key now fails with the same message a " +
        "wrong key gets. Requests it already made are unaffected, and the " +
        "credentials it issued remain valid.",
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
