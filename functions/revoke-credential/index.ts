// POST /functions/v1/revoke-credential
//
// Body: { credential_id, reason? }
// Auth: Bearer JWT — MUST be a platform_admin.
//
// The integrity action. Only Certidemy (platform_admin) can revoke a
// credential — a partner cannot un-issue one. Used for cheating findings and
// payment disputes.
//
// Effects (soft-delete throughout; nothing is hard-deleted):
//   - credentials.status -> 'revoked'
//   - CASCADE: the linked voucher (if any) -> status 'revoked'
//   - admin_actions row written: who revoked, what, why
//
// The public verify page already renders the 'revoked' state, so revocation
// is immediately visible to any verifier. The score is never exposed there.
//
// Idempotent: revoking an already-revoked credential is a no-op success.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  getUserClient,
  HttpError,
} from "../_shared/supabase.ts";

interface Body {
  credential_id: string;
  reason?: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  try {
    // Identify the caller.
    const actor_user_id = await authenticate(req);

    // Authorize: caller must be platform_admin. We read the role with the
    // service client (profiles is the source of truth for platform_role).
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

    // Idempotent: already revoked -> success no-op.
    if (cred.status === "revoked") {
      return jsonResponse({
        revoked: true,
        already_revoked: true,
        credential_id: cred.id,
      });
    }

    // 1. Revoke the credential.
    const { error: revErr } = await svc
      .from("credentials")
      .update({ status: "revoked" })
      .eq("id", cred.id);
    if (revErr) throw new Error(`credential revoke: ${revErr.message}`);

    // 2. Cascade to the linked voucher (find by credential_id link).
    let voucher_revoked_id: string | null = null;
    const { data: linkedVoucher } = await svc
      .from("vouchers")
      .select("id, status")
      .eq("credential_id", cred.id)
      .maybeSingle();
    if (linkedVoucher && linkedVoucher.status !== "revoked") {
      const { error: vErr } = await svc
        .from("vouchers")
        .update({
          status: "revoked",
          revoked_at: now,
          revoked_reason: body.reason ?? "credential revoked",
          updated_at: now,
        })
        .eq("id", linkedVoucher.id);
      if (vErr) {
        console.warn("voucher cascade revoke failed", vErr);
      } else {
        voucher_revoked_id = linkedVoucher.id;
      }
    }

    // 3. Audit log.
    const { error: logErr } = await svc.from("admin_actions").insert({
      actor_user_id,
      action: "revoke_credential",
      target_type: "credential",
      target_id: cred.id,
      reason: body.reason ?? null,
      metadata: {
        credential_code: cred.credential_code,
        cascaded_voucher_id: voucher_revoked_id,
      },
    });
    if (logErr) console.warn("admin_actions log failed", logErr);

    return jsonResponse({
      revoked: true,
      credential_id: cred.id,
      cascaded_voucher_id: voucher_revoked_id,
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
