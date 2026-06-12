// POST /functions/v1/create-company
//
// Body: { name, admin_email, invoice_ref? }
// Auth: Bearer JWT — MUST be platform_admin.
//
// Onboards a partner: creates the company row and invites its first admin by
// email (a company_invites row at role 'team_admin'). The admin becomes a real
// team_admin when they sign up — the claim trigger redeems the invite.
//
// Audit-logged to admin_actions. Idempotent-ish: if a company with the same
// name exists we still create (names aren't unique by design — different orgs
// can share a name); the caller controls that.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";

interface Body {
  name?: string;
  admin_email?: string;
  invoice_ref?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return jsonResponse({ error: "method not allowed" }, 405);

  try {
    const actor = await authenticate(req);
    const svc = getServiceClient();

    // Authorize: platform_admin only.
    const { data: actorProfile } = await svc
      .from("profiles")
      .select("platform_role")
      .eq("id", actor)
      .maybeSingle();
    if (!actorProfile || actorProfile.platform_role !== "platform_admin") {
      throw new HttpError(403, "platform_admin required");
    }

    const body = (await req.json()) as Body;
    const name = body.name?.trim();
    const adminEmail = body.admin_email?.trim().toLowerCase();
    const invoiceRef = body.invoice_ref?.trim() || null;

    if (!name) throw new HttpError(400, "company name required");
    if (!adminEmail) throw new HttpError(400, "admin_email required");
    if (!EMAIL_RE.test(adminEmail)) throw new HttpError(400, "invalid admin_email");

    // 1. Create the company.
    const { data: company, error: cErr } = await svc
      .from("companies")
      .insert({ name })
      .select("id, name")
      .single();
    if (cErr || !company) {
      console.error("company insert failed", cErr);
      throw new HttpError(500, "failed to create company");
    }

    // 2. Invite the first admin by email (claimed at signup).
    const { data: invite, error: iErr } = await svc
      .from("company_invites")
      .insert({
        company_id: company.id,
        email: adminEmail,
        role: "team_admin",
        invited_by: actor,
        status: "pending",
      })
      .select("id, email, role")
      .single();
    if (iErr) {
      // Company is created but invite failed — surface it; admin can retry the
      // invite. Don't unwind the company (no transactions from the client).
      console.error("invite insert failed", iErr);
      throw new HttpError(
        500,
        "company created but admin invite failed — retry the invite"
      );
    }

    // 3. Audit log.
    await svc.from("admin_actions").insert({
      actor_user_id: actor,
      action: "create_company",
      target_type: "company",
      target_id: company.id,
      reason: null,
      metadata: {
        company_name: company.name,
        admin_email: adminEmail,
        invoice_ref: invoiceRef,
      },
    });

    return jsonResponse({
      ok: true,
      company: { id: company.id, name: company.name },
      invite: { id: invite.id, email: invite.email, role: invite.role },
    });
  } catch (err) {
    if (err instanceof HttpError)
      return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
