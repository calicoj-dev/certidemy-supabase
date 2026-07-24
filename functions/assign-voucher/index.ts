// POST /functions/v1/assign-voucher
//
// Body: { batch_id, assigned_email }
// Auth: Bearer JWT
//
// A team_admin assigns one seat from a specific SEAT BATCH to a person by email
// (pre-assignment — they need not have signed up). Mints a voucher in status
// 'assigned', linked to the batch (inherits its attempt terms), assigned_email
// set, assigned_user_id NULL (bound at signup by the claim trigger).
//
// Security: authenticate → load the batch → derive company_id from the batch
// ROW (never trust the body) → verify caller is a team_admin of that company.
//
// Seat availability is counted directly off vouchers for THIS BATCH (the
// function owns its invariant; it does not read the reporting view). Without a
// DB unique/locking backstop two concurrent assigns can both pass — a partial
// unique index is the real guard (follow-up); this 409 catches the common case.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";
import { makeVoucherCode, hasUsableVoucherByEmail } from "../_shared/vouchers.ts";

interface Body {
  batch_id?: string;
  assigned_email?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return jsonResponse({ error: "method not allowed" }, 405);

  try {
    const caller = await authenticate(req);
    const body = (await req.json()) as Body;

    const batchId = body.batch_id?.trim();
    const email = body.assigned_email?.trim().toLowerCase();

    if (!batchId || !UUID_RE.test(batchId))
      throw new HttpError(400, "valid batch_id required");
    if (!email) throw new HttpError(400, "assigned_email required");
    if (!EMAIL_RE.test(email)) throw new HttpError(400, "invalid email");

    const svc = getServiceClient();

    // 1. Load the batch. company/cert/terms come from the ROW.
    const { data: batch, error: bErr } = await svc
      .from("seat_batches")
      .select(
        "id, company_certification_id, company_id, certification_id, seats, expires_at",
      )
      .eq("id", batchId)
      .maybeSingle();

    if (bErr) throw new HttpError(500, "failed to load batch");
    if (!batch) throw new HttpError(404, "batch not found");

    // 2. Authorize: caller must be a team_admin of THIS batch's company.
    const { data: membership } = await svc
      .from("team_members")
      .select("role")
      .eq("user_id", caller)
      .eq("company_id", batch.company_id)
      .eq("role", "team_admin")
      .maybeSingle();
    if (!membership) {
      throw new HttpError(403, "not an admin of this organization");
    }

    // 3. Batch must not be expired.
    if (batch.expires_at && new Date(batch.expires_at).getTime() < Date.now()) {
      throw new HttpError(409, "this batch has expired");
    }

    // 4. Seat availability within THIS batch (assigned + redeemed consume a seat;
    //    revoked/available do not).
    const { count: liveCount, error: countErr } = await svc
      .from("vouchers")
      .select("id", { count: "exact", head: true })
      .eq("batch_id", batchId)
      .in("status", ["assigned", "redeemed"]);

    if (countErr) throw new HttpError(500, "failed to count seats");
    const used = liveCount ?? 0;
    if (used >= batch.seats) {
      throw new HttpError(409, "no seats available in this batch");
    }

    // 5. Double-assign guard: this email must not already hold a non-revoked
    //    voucher for this certification (any batch).
    const held = await hasUsableVoucherByEmail(svc, email, batch.certification_id);
    if (held.blocked) {
      const left = held.attempts_remaining === null
        ? "unlimited attempts"
        : `${held.attempts_remaining} attempt(s)`;
      throw new HttpError(
        409,
        `this email already holds an unused seat for this certification (${held.voucher_code}, ${left} remaining)`,
      );
    }

    // 6. Cert code for the voucher code prefix.
    const { data: cert } = await svc
      .from("certifications")
      .select("code, name")
      .eq("id", batch.certification_id)
      .maybeSingle();
    const certCode = (cert?.code as string | undefined) ?? "EXAM";

    // 6b. If this email already belongs to a registered user, bind the voucher
    //     to them now (the signup claim trigger only fires for FUTURE signups).
    const { data: existingProfile } = await svc
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    const assignedUserId = (existingProfile?.id as string | undefined) ?? null;

    // 7. Mint, linked to the batch (inherits its terms).
    const now = new Date().toISOString();
    const voucher_code = makeVoucherCode(certCode);

    const { data: inserted, error: insErr } = await svc
      .from("vouchers")
      .insert({
        voucher_code,
        certification_id: batch.certification_id,
        company_certification_id: batch.company_certification_id,
        company_id: batch.company_id,
        batch_id: batch.id,
        assigned_email: email,
        assigned_user_id: assignedUserId,
        assigned_by: caller,
        status: "assigned",
        assigned_at: now,
        updated_at: now,
      })
      .select("id, voucher_code, assigned_email, status")
      .single();

    if (insErr || !inserted) {
      console.error("voucher insert failed", insErr);
      throw new HttpError(500, "failed to create voucher");
    }

    return jsonResponse({
      ok: true,
      voucher: {
        id: inserted.id,
        voucher_code: inserted.voucher_code,
        assigned_email: inserted.assigned_email,
        certification_name: (cert?.name as string | undefined) ?? null,
        status: inserted.status,
      },
    });
  } catch (err) {
    if (err instanceof HttpError)
      return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
