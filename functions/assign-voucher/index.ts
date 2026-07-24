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
  // Direct-issue path only:
  certification_id?: string;
  attempts_allowed?: number;
  order_ref?: string;
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

    const batchId = body.batch_id?.trim() || null;
    const email = body.assigned_email?.trim().toLowerCase();

    if (!email) throw new HttpError(400, "assigned_email required");
    if (!EMAIL_RE.test(email)) throw new HttpError(400, "invalid email");

    const svc = getServiceClient();

    // TWO WAYS A SEAT IS ISSUED, and they authorize differently.
    //
    //   PARTNER  { batch_id, assigned_email }
    //     A team_admin draws one seat from a batch their company bought.
    //     Certification, company and terms all come from the batch ROW, never
    //     from the request body.
    //
    //   DIRECT   { certification_id, assigned_email, attempts_allowed, order_ref }
    //     A Certidemy platform admin issues one seat to an individual who bought
    //     on CertiGlobal. There is no batch, no company and no seat pool to draw
    //     against. company_certification_id stays NULL, which the schema already
    //     documents as the B2C shape.
    //
    // Everything after this block is identical for both paths.
    let certificationId: string;
    let companyCertificationId: string | null = null;
    let companyId: string | null = null;
    let resolvedBatchId: string | null = null;
    let attemptsAllowed: number | null = null;
    let orderRef: string | null = null;

    if (batchId) {
      if (!UUID_RE.test(batchId))
        throw new HttpError(400, "valid batch_id required");

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

      // 3. Batch must not be expired. This gates ASSIGNMENT only - a seat
      //    already in someone's hands keeps its own six months (migration 137).
      if (batch.expires_at && new Date(batch.expires_at).getTime() < Date.now()) {
        throw new HttpError(409, "this batch has expired");
      }

      // 4. Seat availability within THIS batch (assigned + redeemed consume a
      //    seat; revoked/available do not).
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

      certificationId = batch.certification_id as string;
      companyCertificationId = batch.company_certification_id as string | null;
      companyId = batch.company_id as string | null;
      resolvedBatchId = batch.id as string;
    } else {
      const certId = body.certification_id?.trim();
      if (!certId || !UUID_RE.test(certId))
        throw new HttpError(400, "batch_id or certification_id required");

      // Platform admins only. A partner has no standing to issue a seat that
      // draws on nobody's inventory - there is no batch here to own.
      const { data: profile } = await svc
        .from("profiles")
        .select("platform_role")
        .eq("id", caller)
        .maybeSingle();
      const role = (profile as { platform_role?: string } | null)?.platform_role;
      if (role !== "platform_admin") {
        throw new HttpError(403, "only a platform admin can issue a direct seat");
      }

      // The certification must exist and be sittable. Issuing against a draft
      // cert sells a seat for an exam the assembler would refuse to build.
      const { data: directCert } = await svc
        .from("certifications")
        .select("id, status")
        .eq("id", certId)
        .maybeSingle();
      if (!directCert) throw new HttpError(404, "certification not found");
      if (directCert.status !== "available") {
        throw new HttpError(
          409,
          `this certification is '${directCert.status}' and cannot be sold yet`,
        );
      }

      // ATTEMPTS MUST BE EXPLICIT ON THIS PATH. With no batch and no per-voucher
      // override, resolveAllowance falls through to 1 - so a two-attempt sale
      // would silently become a one-attempt seat, and the candidate would find
      // out at the worst possible moment. Defaulting to 1 is the safe floor, not
      // a substitute for the caller stating it.
      const rawAttempts = body.attempts_allowed;
      if (rawAttempts !== undefined && rawAttempts !== null) {
        if (!Number.isInteger(rawAttempts) || rawAttempts < 1) {
          throw new HttpError(
            400,
            "attempts_allowed must be a whole number of 1 or more",
          );
        }
        attemptsAllowed = rawAttempts;
      } else {
        attemptsAllowed = 1;
      }

      // The CertiGlobal order this seat was sold under. Certidemy is free;
      // payment happened on another platform, and this is the only thread back
      // to it (migration 138).
      orderRef = body.order_ref?.trim() || null;
      certificationId = certId;
    }

    // 5. Double-assign guard: this email must not already hold a non-revoked
    //    voucher for this certification (any batch).
    const held = await hasUsableVoucherByEmail(svc, email, certificationId);
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
      .eq("id", certificationId)
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
        certification_id: certificationId,
        company_certification_id: companyCertificationId,
        company_id: companyId,
        batch_id: resolvedBatchId,
        attempts_allowed: attemptsAllowed,
        order_ref: orderRef,
        assigned_email: email,
        assigned_user_id: assignedUserId,
        assigned_by: caller,
        status: "assigned",
        assigned_at: now,
        // The holder's own six months. Independent of the batch date, which
        // gates ASSIGNMENT rather than redemption (migration 137).
        expires_at: new Date(Date.now() + 182 * 24 * 60 * 60 * 1000).toISOString(),
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
