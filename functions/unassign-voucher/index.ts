// POST /functions/v1/unassign-voucher
//
// Body: { voucher_id, reason? }
// Auth: Bearer JWT
//
// Returns an ASSIGNED, UNUSED seat to its batch pool so the partner can give it
// to someone else. The person who held it loses access; the seat does not.
//
// WHY THIS EXISTS
//
// A partner buys ten seats and assigns five. One of those five leaves the
// company before sitting the exam. Without this, that seat is dead - paid for,
// attached to an email that will never use it, and uncountable against the nine
// people who could have. Certidemy is a certification body, not a party to how a
// partner staffs its teams.
//
// THE GUARD THAT MATTERS
//
// attempts_used MUST be 0. Assign -> sit the exam -> unassign -> reassign would
// otherwise be unlimited attempts on a single purchased seat, straight through
// the published re-examination cap, and the exposure math behind that cap
// (v_exam_exposure) assumes a bounded number of sittings per candidate. A seat
// that has been sat on is spent.
//
// This is also the honest reading of the partner's own case: the person who left
// never took the exam. If they had, the company got what it paid for.
//
// B2C SEATS CANNOT BE UNASSIGNED
//
// A direct seat has no batch and no company. Two things break if it is returned:
//
//   1. There is no pool. 'available' means "back on the shelf", and a direct
//      voucher has no shelf - no company owns it, no batch lists it, no admin
//      surface can draw from it. The row becomes an orphan nobody can reach.
//
//   2. It would never expire. v_voucher_validity resolves an UNASSIGNED seat's
//      clock from its BATCH (assigned -> voucher clock, otherwise -> batch
//      clock). Clearing expires_at on a voucher with no batch leaves it with no
//      clock at all: effective_expires_at NULL, days_remaining NULL,
//      effective_status back to raw. An immortal seat, which is precisely what
//      the two-clock model exists to prevent.
//
// The real B2C case is a mistyped buyer email, and that is a reassignment rather
// than a return. The path is revoke and re-issue, which keeps the CertiGlobal
// refund and the replacement seat as two separate auditable events instead of
// one silent mutation.
//
// WHAT IS CLEARED, AND WHY EACH ONE
//
//   status           -> 'available'   the seat is inventory again
//   assigned_email   -> null          it belongs to nobody
//   assigned_user_id -> null          the holder loses eligibility immediately
//   assigned_at      -> null          no assignment date
//   expires_at       -> null          the six-month clock STOPS and does not
//                                     carry over. The next holder gets a fresh
//                                     six months from their own assignment,
//                                     bounded by the batch's assignability
//                                     window (migration 137).
//
// The tail stays bounded: the batch cannot be assigned from after 12 months, so
// the last possible seat still expires 18 months from purchase however many
// times it changes hands.
//
// NOT REVOCATION. 'revoked' means the seat was pulled and is gone - it stays
// spent against the batch. 'available' means it is back on the shelf. The roster
// shows them differently because they mean different things commercially.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Body {
  voucher_id?: string;
  reason?: string;
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
    if (!voucherId || !UUID_RE.test(voucherId)) {
      throw new HttpError(400, "valid voucher_id required");
    }

    // 1. Load the voucher.
    const { data: voucher, error: vErr } = await svc
      .from("vouchers")
      .select(
        "id, voucher_code, status, attempts_used, company_id, batch_id, assigned_email, assigned_user_id, certification_id",
      )
      .eq("id", voucherId)
      .maybeSingle();

    if (vErr || !voucher) throw new HttpError(404, "voucher not found");

    // 2. Authorization. A partner admin may only touch their own company's
    //    seats; a platform admin may touch any. Derived from the voucher's
    //    company, never from the request body.
    const { data: profile } = await svc
      .from("profiles")
      .select("platform_role")
      .eq("id", caller)
      .maybeSingle();

    const isPlatformAdmin =
      (profile as { platform_role?: string } | null)?.platform_role === "platform_admin";

    if (!isPlatformAdmin) {
      if (!voucher.company_id) {
        throw new HttpError(403, "not authorized for this voucher");
      }
      const { data: membership } = await svc
        .from("team_members")
        .select("role")
        .eq("user_id", caller)
        .eq("company_id", voucher.company_id)
        .maybeSingle();

      // team_members.role is team_admin | team_member - there is no "owner".
      const role = (membership as { role?: string } | null)?.role;
      if (role !== "team_admin") {
        throw new HttpError(403, "not authorized for this voucher");
      }
    }

    // 3. State guards, in the order a human would ask them.

    //    Is this seat returnable at all? A direct (B2C) seat has no batch, so
    //    there is no pool to return it to and no batch clock to bound it once
    //    its own expiry is cleared. See the B2C note in the header.
    if (!voucher.batch_id) {
      throw new HttpError(
        409,
        "this is a direct seat with no batch pool to return it to - revoke it and issue a new one instead",
      );
    }

    if (voucher.status !== "assigned") {
      throw new HttpError(
        409,
        `only an assigned seat can be returned to the pool (this one is '${voucher.status}')`,
      );
    }

    if ((voucher.attempts_used as number) > 0) {
      throw new HttpError(
        409,
        "this seat has been used for at least one exam attempt and cannot be returned to the pool - it is spent",
      );
    }

    // 4. Return it to inventory.
    const { data: updated, error: updErr } = await svc
      .from("vouchers")
      .update({
        status: "available",
        assigned_email: null,
        assigned_user_id: null,
        assigned_at: null,
        expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", voucher.id)
      .eq("status", "assigned")
      .eq("attempts_used", 0)
      .select("id, voucher_code, status")
      .maybeSingle();

    if (updErr) {
      console.error("unassign update failed", updErr);
      throw new HttpError(500, "failed to return the seat to the pool");
    }

    if (!updated) {
      // Lost a race with an exam start: consumeAttempt moved attempts_used
      // between our read and our write. The seat is now spent and stays assigned.
      throw new HttpError(
        409,
        "this seat was used for an exam attempt while the request was in flight",
      );
    }

    // 5. Audit. Who released whose seat, and why.
    await svc.from("admin_actions").insert({
      actor_user_id: caller,
      action: "voucher_unassigned",
      target_type: "voucher",
      target_id: voucher.id,
      reason: body.reason?.trim() || "Seat returned to the pool",
      metadata: {
        voucher_code: voucher.voucher_code,
        released_from: voucher.assigned_email,
        company_id: voucher.company_id,
        batch_id: voucher.batch_id,
        certification_id: voucher.certification_id,
      },
    });

    return jsonResponse({
      ok: true,
      voucher: {
        id: updated.id,
        voucher_code: updated.voucher_code,
        status: updated.status,
        released_from: voucher.assigned_email,
      },
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: "unexpected error" }, 500);
  }
});
