// POST /functions/v1/change-voucher-cert
//
// Body: { voucher_id, certification_id }
// Auth: Bearer JWT — platform_admin, or team_admin of the voucher's company.
//
// Points an assigned voucher at a different cert (migration 387). Allowed only until
// the first REAL exam attempt: consumeAttempt raises attempts_used at exam start, and
// the update is guarded on attempts_used = 0, so a racing exam start wins. The free
// simulator never touches attempts_used. A pre-387 batch that carries a cert refuses.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";
import { hasUsableVoucherByEmail, loadSittableCert } from "../_shared/vouchers.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Body {
  voucher_id?: string;
  certification_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return jsonResponse({ error: "method not allowed" }, 405);

  try {
    const svc = getServiceClient();
    const caller = await authenticate(req);

    const body = (await req.json()) as Body;
    const voucherId = body.voucher_id?.trim();
    const newCertId = body.certification_id?.trim();
    if (!voucherId || !UUID_RE.test(voucherId)) {
      throw new HttpError(400, "valid voucher_id required");
    }
    if (!newCertId || !UUID_RE.test(newCertId)) {
      throw new HttpError(400, "valid certification_id required");
    }

    // 1. Load the voucher.
    const { data: voucher, error: vErr } = await svc
      .from("vouchers")
      .select(
        "id, voucher_code, status, attempts_used, company_id, batch_id, assigned_email, certification_id",
      )
      .eq("id", voucherId)
      .maybeSingle();
    if (vErr) throw new HttpError(500, "failed to load voucher");
    if (!voucher) throw new HttpError(404, "voucher not found");

    // 2. Authorization, from the voucher's company, never from the body.
    const { data: profile } = await svc
      .from("profiles")
      .select("platform_role")
      .eq("id", caller)
      .maybeSingle();
    const isPlatformAdmin =
      (profile as { platform_role?: string } | null)?.platform_role === "platform_admin";
    if (!isPlatformAdmin) {
      if (!voucher.company_id) throw new HttpError(403, "not authorized for this voucher");
      const { data: membership } = await svc
        .from("team_members")
        .select("role")
        .eq("user_id", caller)
        .eq("company_id", voucher.company_id)
        .maybeSingle();
      if ((membership as { role?: string } | null)?.role !== "team_admin") {
        throw new HttpError(403, "not authorized for this voucher");
      }
    }

    // 3. State guards.
    if (voucher.status !== "assigned") {
      throw new HttpError(409, `only an assigned voucher can change certification (this one is '${voucher.status}')`);
    }
    if ((voucher.attempts_used as number) > 0) {
      throw new HttpError(409, "this voucher has been used for an exam attempt, so its certification is fixed");
    }
    if (voucher.certification_id === newCertId) {
      throw new HttpError(409, "the voucher is already for this certification");
    }
    if (voucher.batch_id) {
      const { data: batch } = await svc
        .from("seat_batches")
        .select("certification_id")
        .eq("id", voucher.batch_id)
        .maybeSingle();
      if (batch?.certification_id) {
        throw new HttpError(409, "this voucher comes from a batch for a single certification");
      }
    }

    const sittable = await loadSittableCert(svc, newCertId);
    if (!sittable.ok) throw new HttpError(sittable.status, sittable.error);

    if (voucher.assigned_email) {
      const held = await hasUsableVoucherByEmail(svc, voucher.assigned_email as string, newCertId);
      if (held.blocked) {
        throw new HttpError(409, `this person already holds a voucher for that certification (${held.voucher_code})`);
      }
    }

    // 4. Switch, guarded so a racing exam start or a second change wins cleanly.
    const { data: updated, error: updErr } = await svc
      .from("vouchers")
      .update({ certification_id: newCertId, updated_at: new Date().toISOString() })
      .eq("id", voucher.id)
      .eq("status", "assigned")
      .eq("attempts_used", 0)
      .eq("certification_id", voucher.certification_id)
      .select("id, voucher_code, certification_id")
      .maybeSingle();
    if (updErr?.code === "23505" && updErr.message.includes("vouchers_email_cert_active_uniq")) {
      throw new HttpError(409, "this person already holds an assigned voucher for that certification");
    }
    if (updErr) {
      console.error("change-voucher-cert update failed", updErr);
      throw new HttpError(500, "failed to change the certification");
    }
    if (!updated) {
      throw new HttpError(409, "the voucher changed while the request was in flight - reload and try again");
    }

    // 5. Audit.
    await svc.from("admin_actions").insert({
      actor_user_id: caller,
      action: "voucher_cert_changed",
      target_type: "voucher",
      target_id: voucher.id,
      reason: null,
      metadata: {
        voucher_code: voucher.voucher_code,
        assigned_email: voucher.assigned_email,
        company_id: voucher.company_id,
        from_certification_id: voucher.certification_id,
        to_certification_id: newCertId,
      },
    });

    return jsonResponse({
      ok: true,
      voucher: {
        id: updated.id,
        voucher_code: updated.voucher_code,
        certification_id: updated.certification_id,
        certification_name: sittable.name,
      },
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: "unexpected error" }, 500);
  }
});
