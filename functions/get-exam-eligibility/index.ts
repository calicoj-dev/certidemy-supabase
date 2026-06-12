// POST /functions/v1/get-exam-eligibility
//
// Body: { certification_id }
// Auth: Bearer JWT
//
// Read-only. Tells the exam launcher whether the authenticated user may start
// a REAL certification exam, and how many attempts remain — so the UI can
// show "You have N attempts. Starting the exam consumes one and is not
// refunded if you leave." before the student commits.
//
// The simulator never calls this: practice is always free and ungated. This
// endpoint is exclusively about the secure, voucher-gated certification exam.
//
// Does NOT consume anything. Consumption happens at exam start in
// generate-mock-exam (mode='exam').

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

    return jsonResponse({
      certification_id: body.certification_id,
      has_voucher: elig.has_voucher,
      can_start_exam: elig.has_voucher,
      attempts_remaining: elig.attempts_remaining, // null = unlimited
      unlimited: elig.unlimited,
      source: elig.source, // 'partner' | 'b2c' | null
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
