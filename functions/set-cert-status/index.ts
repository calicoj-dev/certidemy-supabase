// POST /functions/v1/set-cert-status
//
// Body: { certification_id, status }  where status is one of:
//        'draft' | 'coming_soon' | 'available' | 'unavailable'
// Auth: Bearer JWT â€” MUST be a platform_admin.
//
// The certification lifecycle control. Only Certidemy (platform_admin) can move
// a certification between lifecycle states:
//   draft        - hidden scaffold / not announced
//   coming_soon  - announced (shows in catalog w/ badge), not enrollable/examinable
//   available    - fully live (enrollable, examinable, mints credentials)
//   unavailable  - temporarily frozen (shows w/ badge, lessons/practice stay open
//                  for enrolled learners, EXAM frozen, issued credentials REMAIN valid)
//
// SUSPEND != REVOKE. Flipping a cert to 'unavailable' freezes NEW exam starts
// (enforced in generate-mock-exam) but never touches issued credentials. This is
// the "found a bad question set / updating the JTA â€” freeze minting while we fix"
// lever. Enforcement lives in the exam edge functions (start requires
// status='available'); this function only sets the state + audits it.
//
// Effects:
//   - certifications.status -> the requested status
//   - admin_actions row written: who changed it, from -> to
//
// Idempotent: setting a cert to its current status is a no-op success.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";
interface Body {
  certification_id: string;
  status: string;
}
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_STATUSES = ["draft", "coming_soon", "available", "unavailable"] as const;
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);
  try {
    // Identify the caller.
    const actor_user_id = await authenticate(req);
    // Authorize: caller must be platform_admin (profiles is the source of truth).
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
    if (!body.certification_id || !UUID_RE.test(body.certification_id)) {
      throw new HttpError(400, "valid certification_id required");
    }
    if (!body.status || !(VALID_STATUSES as readonly string[]).includes(body.status)) {
      throw new HttpError(
        400,
        `status must be one of: ${VALID_STATUSES.join(", ")}`,
      );
    }
    // Load the cert (and its current status, for the audit from->to).
    const { data: cert, error: cErr } = await svc
      .from("certifications")
      .select("id, code, name, status")
      .eq("id", body.certification_id)
      .maybeSingle();
    if (cErr) throw new Error(`certification lookup: ${cErr.message}`);
    if (!cert) throw new HttpError(404, "certification not found");
    const from_status = cert.status as string;
    const to_status = body.status;
    // Idempotent: no change -> success no-op (still 200, no audit noise).
    if (from_status === to_status) {
      return jsonResponse({
        ok: true,
        unchanged: true,
        certification_id: cert.id,
        status: to_status,
      });
    }
    // 1. Apply the status change.
    const { error: uErr } = await svc
      .from("certifications")
      .update({ status: to_status })
      .eq("id", cert.id);
    if (uErr) throw new Error(`status update: ${uErr.message}`);
    // 2. Audit log â€” the management-system record of the transition.
    const { error: logErr } = await svc.from("admin_actions").insert({
      actor_user_id,
      action: "set_cert_status",
      target_type: "certification",
      target_id: cert.id,
      reason: null,
      metadata: {
        code: cert.code,
        name: cert.name,
        from: from_status,
        to: to_status,
      },
    });
    if (logErr) console.warn("admin_actions log failed", logErr);
    return jsonResponse({
      ok: true,
      certification_id: cert.id,
      from: from_status,
      to: to_status,
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
