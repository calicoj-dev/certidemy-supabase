// POST /functions/v1/create-batch
//
// Body: { company_id, seats, attempts_per_seat?, invoice_ref?, expires_at? }
// Auth: Bearer JWT — MUST be platform_admin.
//
// Adds vouchers to a company's POOL (migration 387). A batch carries no cert: the
// partner picks one per voucher at assignment. Finds the company's pool with the
// SAME attempts_per_seat (null = unlimited, equal to null) and grows it, or creates
// a new pool for new terms. invoice_ref/expires_at are per-purchase metadata; a
// top-up refreshes them to the latest. A certification_id in the body is ignored.
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
    const seats = body.seats;

    if (!companyId || !UUID_RE.test(companyId))
      throw new HttpError(400, "valid company_id required");
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

    const { data: company } = await svc
      .from("companies")
      .select("id, name")
      .eq("id", companyId)
      .maybeSingle();
    if (!company) throw new HttpError(404, "company not found");

    // The company's pool with the SAME attempt terms. Pools only: a batch that
    // still carries a cert predates 387 and is never grown.
    const sameTerms = svc
      .from("seat_batches")
      .select("id, seats")
      .eq("company_id", companyId)
      .is("certification_id", null)
      .order("created_at", { ascending: true })
      .limit(1);
    const { data: existingRows, error: findErr } =
      attempts === null
        ? await sameTerms.is("attempts_per_seat", null)
        : await sameTerms.eq("attempts_per_seat", attempts);
    if (findErr) {
      console.error("pool lookup failed", findErr);
      throw new HttpError(500, "failed to look up the pool");
    }
    const existingBatch = existingRows?.[0] ?? null;

    const now = new Date().toISOString();
    let batchId: string;
    let action: string;

    if (existingBatch) {
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
      // expires_at omitted when absent so the column default (12 months, 137) applies.
      const insert: Record<string, unknown> = {
        company_id: companyId,
        seats,
        attempts_per_seat: attempts,
        invoice_ref: invoiceRef,
      };
      if (expiresAt) insert.expires_at = expiresAt;
      const { data: created, error: cErr } = await svc
        .from("seat_batches")
        .insert(insert)
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
