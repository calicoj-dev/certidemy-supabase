// POST /functions/v1/get-exam-eligibility
//
// Body: { certification_id }
// Auth: Bearer JWT
//
// Read-only. Tells the exam launcher whether the authenticated user may start
// a REAL certification exam, how many attempts remain, and when the seat
// expires -- so the UI can show "You have N attempts, expires in D days"
// before the student commits.
//
// The simulator never calls this: practice is always free and ungated. This
// endpoint is exclusively about the secure, voucher-gated certification exam.
//
// Does NOT consume anything. Consumption happens at exam start in
// generate-mock-exam (mode='exam').
//
// EXPIRY: getEligibility resolves attempts but not the clock (expiry is only a
// hard gate inside it). The days count comes from v_voucher_validity for the
// SAME voucher getEligibility selected -- the one view the console also reads,
// so the learner's "expires in N days" and the admin roster can never disagree.
// That view is service-role only, which is exactly the client this function
// holds; a browser could not read it directly, which is why the number has to
// be resolved here rather than client-side.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";
import { getEligibility } from "../_shared/vouchers.ts";

interface Body {
  certification_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  try {
    const user_id = await authenticate(req);
    const body = (await req.json()) as Body;
    if (!body.certification_id) throw new HttpError(400, "certification_id required");

    const svc = getServiceClient();
    const elig = await getEligibility(svc, user_id, body.certification_id);

    // Resolve the clock for the voucher getEligibility picked. For an assigned
    // seat the effective expiry IS the voucher's own six-month clock (migration
    // 137), which is what this view returns; reading the view keeps the day
    // count identical to the console's.
    let days_remaining: number | null = null;
    let expires_at: string | null = null;
    if (elig.has_voucher && elig.voucher_id) {
      const { data: vv } = await svc
        .from("v_voucher_validity")
        .select("days_remaining, effective_expires_at")
        .eq("voucher_id", elig.voucher_id)
        .maybeSingle();
      if (vv) {
        days_remaining = (vv.days_remaining ?? null) as number | null;
        expires_at = (vv.effective_expires_at ?? null) as string | null;
      }
    }

    return jsonResponse({
      certification_id: body.certification_id,
      has_voucher: elig.has_voucher,
      can_start_exam: elig.has_voucher,
      attempts_remaining: elig.attempts_remaining, // null = unlimited
      unlimited: elig.unlimited,
      source: elig.source, // 'partner' | 'b2c' | null
      days_remaining, // null = no clock / unavailable
      expires_at, // ISO string of effective expiry, or null
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
