// POST /functions/v1/create-company
//
// Body: { name, admin_email, invoice_ref? }
// Auth: Bearer JWT — MUST be platform_admin.
//
// Onboards a partner: creates the company row, invites its first admin by email
// (a company_invites row at role 'team_admin'), writes the audit row, and — when
// that email already has an account — grants the team_admin membership on the
// spot instead of waiting for a signup that will never happen.
//
// ============================== ONE RPC, NOT THREE INSERTS ==================
//
// All of that is public.create_company_with_admin() (migration 245). This
// function no longer writes any table itself.
//
// It used to do three unwrapped inserts — companies, then company_invites, then
// admin_actions. There are no transactions from a PostgREST client, so a
// failure on the second left a company with no invite and no way to reach it,
// and the old comment here admitted as much: "Company is created but admin
// invite failed — retry the invite. Don't unwind the company." The RPC does all
// four writes in one function, so a failure anywhere leaves nothing behind.
//
// ============================== WHY THE ADMIN CHECK STAYS HERE =============
//
// platform_admin is enforced in TypeScript, against profiles, and the resolved
// caller is passed down as p_actor. It cannot move into the RPC: this function
// holds the service key, auth.uid() is null under service_role, and a SECURITY
// DEFINER function has no way to learn who called it. Same split as
// integration_store_token (174).
//
// ============================== MEMBERSHIP =================================
//
// The RPC returns membership: 'immediate' when a profile already existed and
// the invite was redeemed on the spot, 'pending' when the invite is waiting on
// a signup. That is returned to the client unchanged. Nothing renders it yet —
// this stops the information being discarded, so the console can say "the
// partner has access now" instead of "an invite was sent" in both cases.
//
// Idempotent-ish: company names are not unique by design (different orgs can
// share one), so a repeat call creates a second company. The caller controls
// that.

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

/** Must stay in step with the regex inside create_company_with_admin. Checked
 *  here as well so a bad address fails before the round trip, with the message
 *  this endpoint has always returned. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** What the RPC returns. */
interface CreateResult {
  company_id: string;
  invite_id: string;
  user_id: string | null;
  membership: "immediate" | "pending";
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return jsonResponse({ error: "method not allowed" }, 405);

  try {
    const actor = await authenticate(req);
    const svc = getServiceClient();

    // Authorize: platform_admin only. The RPC trusts p_actor, so this is the
    // only thing standing between a valid JWT and a new partner company.
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

    const { data, error } = await svc.rpc("create_company_with_admin", {
      p_name: name,
      p_admin_email: adminEmail,
      p_actor: actor,
      p_invoice_ref: invoiceRef,
    });

    if (error) {
      // P0001 is a raise exception from inside the function -- our own
      // validation messages, written to be read by the caller. Anything else is
      // a real fault and should not have its detail handed out.
      if (error.code === "P0001") {
        throw new HttpError(400, error.message);
      }
      console.error("create_company_with_admin failed", error);
      throw new HttpError(500, "failed to create company");
    }

    const result = data as CreateResult | null;
    if (!result?.company_id) {
      console.error("create_company_with_admin returned no company_id", data);
      throw new HttpError(500, "failed to create company");
    }

    return jsonResponse({
      ok: true,
      company: { id: result.company_id, name },
      // role is not echoed by the RPC because it does not vary: the first admin
      // of a company is always invited as team_admin.
      invite: { id: result.invite_id, email: adminEmail, role: "team_admin" },
      // 'immediate' -> the invite was redeemed and membership granted now.
      // 'pending'   -> waiting on that address to sign up.
      membership: result.membership,
      user_id: result.user_id,
    });
  } catch (err) {
    if (err instanceof HttpError)
      return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
