// POST /functions/v1/update-credential-name
//
// Body: { credential_id, holder_name, reason? }
// Auth: Bearer JWT (platform_admin only)
//
// Corrects the holder name on an issued credential. The name is an identity
// attribute attached to the decision, NOT part of the decision - so it is edited
// in place. The credential keeps its code, its verify URL, its QR, its ID. A
// typo is not a revoke-and-reissue.
//
// HOW THE ATTRIBUTION WORKS
//
// credentials carries a BEFORE UPDATE trigger (migration 136,
// fn_audit_holder_name_change) that:
//   - refuses a holder_name change when auth.uid() is NULL, so a service-role
//     write is rejected - the correction must be attributable to a person;
//   - nulls certificate_path so the PDF regenerates with the new name on next
//     fetch;
//   - writes the audit row (from -> to, which admin, credential code);
//   - raises if ANY decision field changed (score, issued_at, certification_id,
//     exam_attempt_id, jta_version_id, credential_code).
//
// Two consequences shape this function:
//
//   1. The write MUST go through getUserClient(authHeader), not
//      getServiceClient(). The service client sends auth.uid() = NULL and the
//      trigger throws insufficient_privilege. This is the first function in the
//      set that authenticates a caller and then writes AS them.
//
//   2. The update sets ONLY holder_name. The trigger reads OLD vs NEW on every
//      decision column, so a full-row upsert that re-sends the same score would
//      be fine - but sending only the one field is the honest expression of what
//      is allowed to change, and removes any chance of a stale client value
//      tripping the immutability guard.
//
// AUTHORIZATION
//
// platform_admin only. A holder correcting their own name would defeat the point
// of an attributable, oversight-bearing change: the holder requests, the
// certification body makes the correction. Checked against profiles, never the
// request body.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  getUserClient,
  HttpError,
} from "../_shared/supabase.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Matches the trigger's own blank check (btrim). Also caps length so the
// certificate template cannot be overrun.
const MAX_NAME = 120;

interface Body {
  credential_id?: string;
  holder_name?: string;
  reason?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return jsonResponse({ error: "method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new HttpError(401, "missing authorization header");

    const svc = getServiceClient();
    const caller = await authenticate(req);

    const body = (await req.json()) as Body;
    const credentialId = body.credential_id?.trim();
    const holderName = body.holder_name?.trim();

    if (!credentialId || !UUID_RE.test(credentialId)) {
      throw new HttpError(400, "valid credential_id required");
    }
    if (!holderName) {
      throw new HttpError(400, "holder_name cannot be blank");
    }
    if (holderName.length > MAX_NAME) {
      throw new HttpError(400, `holder_name must be ${MAX_NAME} characters or fewer`);
    }

    // 1. Authorization: platform_admin only. Derived from profiles, not the body.
    const { data: profile } = await svc
      .from("profiles")
      .select("platform_role")
      .eq("id", caller)
      .maybeSingle();

    const isPlatformAdmin =
      (profile as { platform_role?: string } | null)?.platform_role ===
      "platform_admin";

    if (!isPlatformAdmin) {
      throw new HttpError(403, "only a platform admin can correct a holder name");
    }

    // 2. Load the current row (service client - just a read).
    const { data: cred, error: cErr } = await svc
      .from("credentials")
      .select("id, credential_code, holder_name, certification_code")
      .eq("id", credentialId)
      .maybeSingle();

    if (cErr || !cred) throw new HttpError(404, "credential not found");

    // 3. No-op guard. An identical name would still fire the trigger's UPDATE
    //    path with no change; refuse it so the audit log isn't polluted with
    //    non-corrections.
    if (cred.holder_name === holderName) {
      throw new HttpError(409, "the holder name is already exactly that");
    }

    // 4. The write, AS THE ADMIN. getUserClient carries the caller's JWT, so
    //    auth.uid() inside the trigger resolves to `caller` and the change is
    //    attributed. RLS on credentials must permit a platform_admin update;
    //    if it does not, this returns 42501 and we surface it as 403.
    const userClient = getUserClient(authHeader);
    const { data: updated, error: updErr } = await userClient
      .from("credentials")
      .update({ holder_name: holderName })
      .eq("id", credentialId)
      .select("id, credential_code, holder_name, certificate_path")
      .maybeSingle();

    if (updErr) {
      // The trigger raises with these SQLSTATEs for the two guarded cases.
      const code = (updErr as { code?: string }).code;
      if (code === "42501") {
        throw new HttpError(
          403,
          "the update was refused as unattributable - re-authenticate and try again",
        );
      }
      console.error("holder name update failed", updErr);
      throw new HttpError(500, updErr.message ?? "failed to correct the holder name");
    }

    if (!updated) {
      throw new HttpError(404, "credential not found after update");
    }

    // The trigger writes its own audit row (from -> to). This second row records
    // the human-supplied reason, which the trigger does not see.
    if (body.reason?.trim()) {
      await svc.from("admin_actions").insert({
        actor_user_id: caller,
        action: "credential_holder_name_correction_reason",
        target_type: "credential",
        target_id: credentialId,
        reason: body.reason.trim(),
        metadata: {
          credential_code: cred.credential_code,
          from: cred.holder_name,
          to: holderName,
        },
      });
    }

    return jsonResponse({
      ok: true,
      credential: {
        id: updated.id,
        credential_code: updated.credential_code,
        holder_name: updated.holder_name,
        // trigger nulls this; surfaced so the client knows a regen is pending.
        certificate_regenerating: updated.certificate_path === null,
      },
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: "unexpected error" }, 500);
  }
});
