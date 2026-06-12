// POST /functions/v1/create-batch
//
// Body: { company_id, certification_id, seats, attempts_per_seat?, invoice_ref?, expires_at? }
// Auth: Bearer JWT — MUST be platform_admin.
//
// Adds seat inventory to a company's entitlement for a cert. Ensures the
// entitlement (company_certifications) row exists, then:
//   - finds an existing batch with the SAME terms (same attempts_per_seat,
//     ignoring null-vs-null as equal) and grows its `seats`, OR
//   - creates a NEW batch row for different terms.
//
// "Same terms" = same attempts_per_seat ONLY. invoice_ref/expires_at are
// per-purchase metadata; a top-up to the same attempt-terms grows the batch and
// (optionally) updates invoice_ref to the latest. attempts_per_seat NULL =
// unlimited (a per-seat license; never a top-up source — enforced in the future
// top-up function, not here).
//
// Audit-logged.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";

interface Body {
  company_id?: string;
  certification_id?: string;
  seats?: number;
  attempts_per_seat?: number | null;
  invoice_ref?: string | null;
  expires_at?: string | null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return jsonResponse({ error: "method not allowed" }, 405);

  try {
    const actor = await authenticate(req);
    const svc = getServiceClient();

    const { data: actorProfile } = await svc
      .from("profiles")
      .select("platform_role")
      .eq("id", actor)
      .maybeSingle();
    if (!actorProfile || actorProfile.platform_role !== "platform_admin") {
      throw new HttpError(403, "platform_admin required");
    }

    const body = (await req.json()) as Body;
    const companyId = body.company_id?.trim();
    const certId = body.certification_id?.trim();
    const seats = body.seats;

    if (!companyId || !UUID_RE.test(companyId))
      throw new HttpError(400, "valid company_id required");
    if (!certId || !UUID_RE.test(certId))
      throw new HttpError(400, "valid certification_id required");
    if (typeof seats !== "number" || !Number.isInteger(seats) || seats <= 0)
      throw new HttpError(400, "seats must be a positive integer");

    const attempts =
      body.attempts_per_seat == null ? null : Number(body.attempts_per_seat);
    if (attempts !== null && (!Number.isInteger(attempts) || attempts < 1))
      throw new HttpError(
        400,
        "attempts_per_seat must be null (unlimited) or an integer >= 1",
      );

    const invoiceRef = body.invoice_ref?.trim() || null;
    const expiresAt = body.expires_at?.trim() || null;

    // Verify company + cert.
    const { data: company } = await svc
      .from("companies")
      .select("id, name")
      .eq("id", companyId)
      .maybeSingle();
    if (!company) throw new HttpError(404, "company not found");

    const { data: cert } = await svc
      .from("certifications")
      .select("id, name")
      .eq("id", certId)
      .maybeSingle();
    if (!cert) throw new HttpError(404, "certification not found");

    // Ensure the entitlement (company_certifications) exists — upsert on the
    // unique (company_id, certification_id). Keep legacy columns harmless.
    const { data: cc, error: ccErr } = await svc
      .from("company_certifications")
      .upsert(
        { company_id: companyId, certification_id: certId },
        { onConflict: "company_id,certification_id", ignoreDuplicates: false },
      )
      .select("id")
      .single();
    if (ccErr || !cc) {
      console.error("entitlement upsert failed", ccErr);
      throw new HttpError(500, "failed to ensure entitlement");
    }

    // Find an existing batch with the SAME attempt terms.
    const sameTerms = svc
      .from("seat_batches")
      .select("id, seats")
      .eq("company_certification_id", cc.id);
    const { data: existingBatch } =
      attempts === null
        ? await sameTerms.is("attempts_per_seat", null).maybeSingle()
        : await sameTerms.eq("attempts_per_seat", attempts).maybeSingle();

    const now = new Date().toISOString();
    let batchId: string;
    let action: string;

    if (existingBatch) {
      // Grow the existing batch's seats; refresh invoice/expiry to latest.
      const { data: grown, error: gErr } = await svc
        .from("seat_batches")
        .update({
          seats: (existingBatch.seats ?? 0) + seats,
          invoice_ref: invoiceRef ?? undefined,
          expires_at: expiresAt ?? undefined,
          updated_at: now,
        })
        .eq("id", existingBatch.id)
        .select("id")
        .single();
      if (gErr || !grown) {
        console.error("batch grow failed", gErr);
        throw new HttpError(500, "failed to grow batch");
      }
      batchId = grown.id;
      action = "grow_batch";
    } else {
      // New batch for these terms.
      const { data: created, error: cErr } = await svc
        .from("seat_batches")
        .insert({
          company_certification_id: cc.id,
          company_id: companyId,
          certification_id: certId,
          seats,
          attempts_per_seat: attempts,
          invoice_ref: invoiceRef,
          expires_at: expiresAt,
        })
        .select("id")
        .single();
      if (cErr || !created) {
        console.error("batch insert failed", cErr);
        throw new HttpError(500, "failed to create batch");
      }
      batchId = created.id;
      action = "create_batch";
    }

    await svc.from("admin_actions").insert({
      actor_user_id: actor,
      action,
      target_type: "seat_batch",
      target_id: batchId,
      reason: null,
      metadata: {
        company_name: company.name,
        certification_name: cert.name,
        seats_added: seats,
        attempts_per_seat: attempts,
        invoice_ref: invoiceRef,
      },
    });

    return jsonResponse({
      ok: true,
      action,
      batch_id: batchId,
    });
  } catch (err) {
    if (err instanceof HttpError)
      return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
