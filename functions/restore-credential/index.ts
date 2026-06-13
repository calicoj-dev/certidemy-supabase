// POST /functions/v1/restore-credential
//
// Body: { credential_id, reason? }
// Auth: Bearer JWT — MUST be a platform_admin.
//
// The inverse of revoke-credential. Reinstates a credential that was revoked
// by mistake or whose revocation reason has resolved (e.g. a payment dispute
// cleared). Like revoke, this is a deliberate, audited action — not a casual
// toggle — but it lives in the app so correcting a mistake never requires a
// hand-edit of the database.
//
// Effects:
//   - credentials.status -> 'active'
//   - UN-CASCADE: the linked voucher (if it was cascade-revoked) -> 'redeemed'
//     (a linked credential implies the exam was passed → redeemed is its
//     correct prior state); revoked_at / revoked_reason cleared
//   - admin_actions row written: who restored, what, why
//
// Expiry is still evaluated live by verify-credential, so restoring a credential
// whose expires_at has passed will correctly read 'expired' to verifiers — this
// only clears the 'revoked' state, it cannot resurrect an expired credential.
//
// Idempotent: restoring an already-active credential is a no-op success.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";

interface Body {
  credential_id: string;
  reason?: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return jsonResponse({ error: "method not allowed" }, 405);

  try {
    // Identify the caller.
    const actor_user_id = await authenticate(req);

    // Authorize: caller must be platform_admin.
    const svc = getServiceClient();
    const { data: actorProfile } = await svc
      .from("profiles")
      .select("platform_role")
      .eq("id", actor_user_id)
      .maybeSingle();
    if (!actorProfile || actorProfile.platform_role !== "platform_admin") {
      throw new HttpError(403, "platform_admin required");
    }

    const body = (await req.json()) as Body;
    if (!body.credential_id || !UUID_RE.test(body.credential_id)) {
      throw new HttpError(400, "valid credential_id required");
    }

    // Load the credential.
    const { data: cred, error: cErr } = await svc
      .from("credentials")
      .select("id, status, credential_code")
      .eq("id", body.credential_id)
      .maybeSingle();
    if (cErr) throw new Error(`credential lookup: ${cErr.message}`);
    if (!cred) throw new HttpError(404, "credential not found");

    const now = new Date().toISOString();

    // Idempotent: already active -> success no-op.
    if (cred.status === "active") {
      return jsonResponse({
        restored: true,
        already_active: true,
        credential_id: cred.id,
      });
    }

    // 1. Restore the credential.
    const { error: resErr } = await svc
      .from("credentials")
      .update({ status: "active" })
      .eq("id", cred.id);
    if (resErr) throw new Error(`credential restore: ${resErr.message}`);

    // 2. Un-cascade the linked voucher, if it was cascade-revoked.
    let voucher_restored_id: string | null = null;
    const { data: linkedVoucher } = await svc
      .from("vouchers")
      .select("id, status")
      .eq("credential_id", cred.id)
      .maybeSingle();
    if (linkedVoucher && linkedVoucher.status === "revoked") {
      const { error: vErr } = await svc
        .from("vouchers")
        .update({
          status: "redeemed",
          revoked_at: null,
          revoked_reason: null,
          updated_at: now,
        })
        .eq("id", linkedVoucher.id);
      if (vErr) {
        console.warn("voucher un-cascade failed", vErr);
      } else {
        voucher_restored_id = linkedVoucher.id;
      }
    }

    // 3. Audit log.
    const { error: logErr } = await svc.from("admin_actions").insert({
      actor_user_id,
      action: "restore_credential",
      target_type: "credential",
      target_id: cred.id,
      reason: body.reason ?? null,
      metadata: {
        credential_code: cred.credential_code,
        uncascaded_voucher_id: voucher_restored_id,
      },
    });
    if (logErr) console.warn("admin_actions log failed", logErr);

    return jsonResponse({
      restored: true,
      credential_id: cred.id,
      uncascaded_voucher_id: voucher_restored_id,
    });
  } catch (err) {
    if (err instanceof HttpError)
      return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
