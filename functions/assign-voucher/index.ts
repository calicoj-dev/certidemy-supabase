// POST /functions/v1/assign-voucher
//
// Body: { company_certification_id, assigned_email }
// Auth: Bearer JWT
//
// A team_admin assigns one exam seat from their company's allocation to a
// person, BY EMAIL (pre-assignment — the person need not have signed up yet).
// Mints a voucher row in status 'assigned' with assigned_email set and
// assigned_user_id NULL. The voucher is bound to a real user later, at signup,
// by a separate claim step (see claim-vouchers / the signup trigger).
//
// Security surface (the whole point of this function):
//   - authenticate -> caller user_id
//   - load the allocation; derive its company_id from the ROW, never trust a
//     company_id from the request body
//   - verify the caller is a team_admin of THAT company
//   - refuse if the allocation has no seat available (count live vouchers)
//   - refuse if this email already holds a non-revoked voucher for this cert
//
// Seat-availability is counted directly off `vouchers` here (the function owns
// its own invariant; it does not read the reporting view v_allocation_quota).
// NOTE: without a DB unique constraint two simultaneous assigns can both pass
// the count — a partial unique index is the real backstop (follow-up). This
// 409 catches the overwhelming common case with a clear message.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";
import { makeVoucherCode } from "../_shared/vouchers.ts";

interface Body {
  company_certification_id?: string;
  assigned_email?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return jsonResponse({ error: "method not allowed" }, 405);

  try {
    const caller = await authenticate(req);
    const body = (await req.json()) as Body;

    const allocationId = body.company_certification_id?.trim();
    const email = body.assigned_email?.trim().toLowerCase();

    if (!allocationId) throw new HttpError(400, "company_certification_id required");
    if (!email) throw new HttpError(400, "assigned_email required");
    if (!EMAIL_RE.test(email)) throw new HttpError(400, "invalid email");

    const svc = getServiceClient();

    // 1. Load the allocation. company_id comes from the ROW (trust boundary).
    const { data: alloc, error: allocErr } = await svc
      .from("company_certifications")
      .select(
        "id, company_id, certification_id, seats_allocated, expires_at",
      )
      .eq("id", allocationId)
      .maybeSingle();

    if (allocErr) throw new HttpError(500, "failed to load allocation");
    if (!alloc) throw new HttpError(404, "allocation not found");

    // 2. Authorize: caller must be a team_admin of THIS allocation's company.
    const { data: membership } = await svc
      .from("team_members")
      .select("role")
      .eq("user_id", caller)
      .eq("company_id", alloc.company_id)
      .eq("role", "team_admin")
      .maybeSingle();

    if (!membership) {
      throw new HttpError(403, "not an admin of this organization");
    }

    // 3. Allocation must not be expired.
    if (alloc.expires_at && new Date(alloc.expires_at).getTime() < Date.now()) {
      throw new HttpError(409, "this allocation has expired");
    }

    // 4. Seat availability: count live (assigned + redeemed) vouchers on this
    // allocation. Revoked/available do not consume a seat.
    const { count: liveCount, error: countErr } = await svc
      .from("vouchers")
      .select("id", { count: "exact", head: true })
      .eq("company_certification_id", allocationId)
      .in("status", ["assigned", "redeemed"]);

    if (countErr) throw new HttpError(500, "failed to count seats");
    const used = liveCount ?? 0;
    if (used >= alloc.seats_allocated) {
      throw new HttpError(409, "no seats available in this allocation");
    }

    // 5. Double-assign guard: this email must not already hold a non-revoked
    // voucher for this certification.
    const { data: existing } = await svc
      .from("vouchers")
      .select("id, status, voucher_code")
      .eq("assigned_email", email)
      .eq("certification_id", alloc.certification_id)
      .in("status", ["assigned", "redeemed", "available"])
      .maybeSingle();

    if (existing) {
      throw new HttpError(
        409,
        "this email already has a voucher for this certification",
      );
    }

    // 6. Resolve the cert code for a friendly voucher code prefix.
    const { data: cert } = await svc
      .from("certifications")
      .select("code, name")
      .eq("id", alloc.certification_id)
      .maybeSingle();
    const certCode = (cert?.code as string | undefined) ?? "EXAM";

    // 7. Mint. assigned_user_id stays NULL (bound at signup).
    const now = new Date().toISOString();
    const voucher_code = makeVoucherCode(certCode);

    const { data: inserted, error: insErr } = await svc
      .from("vouchers")
      .insert({
        voucher_code,
        certification_id: alloc.certification_id,
        company_certification_id: alloc.id,
        company_id: alloc.company_id,
        assigned_email: email,
        assigned_by: caller,
        status: "assigned",
        assigned_at: now,
        updated_at: now,
      })
      .select("id, voucher_code, assigned_email, certification_id, status")
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
