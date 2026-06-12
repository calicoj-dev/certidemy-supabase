// POST /functions/v1/create-allocation
//
// Body: { company_id, certification_id, seats_allocated, attempts_per_seat?, invoice_ref?, expires_at? }
// Auth: Bearer JWT — MUST be platform_admin.
//
// Creates or updates a company's seat allocation for a certification. Because
// company_certifications has UNIQUE (company_id, certification_id), a company
// has at most ONE allocation per cert — so this UPSERTS: new when absent,
// adjusts seats/attempts/invoice/expiry when present.
//
// Guards:
//   - seats_allocated >= 0 (table CHECK) and not below seats_used (nonsensical)
//   - attempts_per_seat null = unlimited; otherwise >= 1
//
// Audit-logged. seats_used is never touched here (it's incremented at exam
// start by the voucher consume path).

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
  seats_allocated?: number;
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
    const seats = body.seats_allocated;

    if (!companyId || !UUID_RE.test(companyId))
      throw new HttpError(400, "valid company_id required");
    if (!certId || !UUID_RE.test(certId))
      throw new HttpError(400, "valid certification_id required");
    if (typeof seats !== "number" || !Number.isInteger(seats) || seats < 0)
      throw new HttpError(400, "seats_allocated must be a non-negative integer");

    const attempts =
      body.attempts_per_seat == null ? null : Number(body.attempts_per_seat);
    if (attempts !== null && (!Number.isInteger(attempts) || attempts < 1))
      throw new HttpError(
        400,
        "attempts_per_seat must be null (unlimited) or an integer >= 1"
      );

    const invoiceRef = body.invoice_ref?.trim() || null;
    const expiresAt = body.expires_at?.trim() || null;

    // Verify the company and cert exist (clear errors beat FK violations).
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

    // If an allocation already exists, guard against setting seats below used.
    const { data: existing } = await svc
      .from("company_certifications")
      .select("id, seats_used")
      .eq("company_id", companyId)
      .eq("certification_id", certId)
      .maybeSingle();

    if (existing && seats < (existing.seats_used ?? 0)) {
      throw new HttpError(
        409,
        `cannot set seats below ${existing.seats_used} already in use`
      );
    }

    // Upsert on the unique (company_id, certification_id).
    const { data: alloc, error: upErr } = await svc
      .from("company_certifications")
      .upsert(
        {
          company_id: companyId,
          certification_id: certId,
          seats_allocated: seats,
          attempts_per_seat: attempts,
          invoice_ref: invoiceRef,
          expires_at: expiresAt,
        },
        { onConflict: "company_id,certification_id" }
      )
      .select("id, seats_allocated, attempts_per_seat, invoice_ref, expires_at")
      .single();

    if (upErr || !alloc) {
      console.error("allocation upsert failed", upErr);
      throw new HttpError(500, "failed to save allocation");
    }

    await svc.from("admin_actions").insert({
      actor_user_id: actor,
      action: existing ? "update_allocation" : "create_allocation",
      target_type: "company_certification",
      target_id: alloc.id,
      reason: null,
      metadata: {
        company_name: company.name,
        certification_name: cert.name,
        seats_allocated: seats,
        attempts_per_seat: attempts,
        invoice_ref: invoiceRef,
      },
    });

    return jsonResponse({
      ok: true,
      created: !existing,
      allocation: {
        id: alloc.id,
        company_id: companyId,
        certification_id: certId,
        seats_allocated: alloc.seats_allocated,
        attempts_per_seat: alloc.attempts_per_seat,
        invoice_ref: alloc.invoice_ref,
        expires_at: alloc.expires_at,
      },
    });
  } catch (err) {
    if (err instanceof HttpError)
      return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
