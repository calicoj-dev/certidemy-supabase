// POST /functions/v1/manage-issuing-plan
//
// Auth: Bearer JWT -- platform_admin only. A partner reads its own allowance through
// manage-credential-offers { action: "allowance" }; only Certidemy sets it. Migration 389.
//
// Body: { action, company_id, ... }
//   get        -> { issuer, allowance, plan, switch }
//   set_plan   { package: "partner_network" | "custom", annual_cap? (custom only), period_start, notes? }
//   clear_plan -> no limit
//   pause      { reason? } -- writes 331's company_feature_disables row for credentials:issue
//   resume                  -- sets restored_at; the row is kept, so the history is too
//
// Pausing stops new signing everywhere (console, API, batch, offers). Credentials already
// issued keep verifying: nothing here touches the issuer, its key or a credential.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";
import { platformRole } from "../_shared/authorize.ts";
import { allowanceJson, readAllowance } from "../_shared/allowance.ts";

// deno-lint-ignore no-explicit-any
type Svc = any;

/** The Certidemy Partner Network package: $1,000 a year, 5,000 credentials. */
const PACKAGES = { partner_network: 5000 } as const;
const MAX_CUSTOM_CAP = 1_000_000;
const FEATURE = "credentials:issue";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface Body {
  action?: string;
  company_id?: string;
  package?: string;
  annual_cap?: number;
  period_start?: string;
  notes?: string;
  reason?: string;
}

async function issuerFor(svc: Svc, companyId: string) {
  const { data, error } = await svc.from("issuers").select("id, name, status").eq("company_id", companyId).maybeSingle();
  if (error) throw new Error(`issuer lookup: ${error.message}`);
  return data as { id: string; name: string; status: string } | null;
}

async function state(svc: Svc, companyId: string) {
  const issuer = await issuerFor(svc, companyId);
  const [plan, sw] = await Promise.all([
    svc.from("company_issuing_plans").select("package, annual_cap, period_start, notes, updated_at").eq("company_id", companyId).maybeSingle(),
    svc.from("company_feature_disables").select("disabled_at, reason, restored_at").eq("company_id", companyId).eq("feature_key", FEATURE).maybeSingle(),
  ]);
  if (plan.error) throw new Error(`plan: ${plan.error.message}`);
  if (sw.error) throw new Error(`switch: ${sw.error.message}`);
  return {
    ok: true,
    issuer,
    allowance: issuer ? allowanceJson(await readAllowance(svc, issuer.id)) : null,
    plan: plan.data ?? null,
    switch: sw.data ?? null,
  };
}

async function audit(svc: Svc, actor: string, companyId: string, action: string, metadata: Record<string, unknown>) {
  const { error } = await svc.from("admin_actions").insert({
    actor_user_id: actor, action, target_type: "company", target_id: companyId, reason: null, metadata,
  });
  if (error) console.error(`${action} audit failed`, error);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);
  try {
    const actor = await authenticate(req);
    const svc = getServiceClient();
    if ((await platformRole(svc, actor)) !== "platform_admin") throw new HttpError(403, "platform_admin required");

    const body = (await req.json()) as Body;
    const companyId = body.company_id?.trim();
    if (!companyId || !UUID_RE.test(companyId)) throw new HttpError(400, "valid company_id required");
    const { data: company, error: cErr } = await svc.from("companies").select("id").eq("id", companyId).maybeSingle();
    if (cErr) throw new Error(`company lookup: ${cErr.message}`);
    if (!company) throw new HttpError(404, "company not found");

    switch (body.action) {
      case "get":
        break;

      case "set_plan": {
        const pkg = body.package;
        if (pkg !== "partner_network" && pkg !== "custom") throw new HttpError(400, "package must be partner_network or custom");
        const cap = pkg === "custom" ? Number(body.annual_cap) : PACKAGES.partner_network;
        if (!Number.isInteger(cap) || cap < 1 || cap > MAX_CUSTOM_CAP) {
          throw new HttpError(400, `annual_cap must be a whole number from 1 to ${MAX_CUSTOM_CAP}`);
        }
        const start = body.period_start?.trim() ?? "";
        if (!DATE_RE.test(start) || Number.isNaN(Date.parse(start))) throw new HttpError(400, "period_start must be YYYY-MM-DD");
        const row = {
          company_id: companyId, package: pkg, annual_cap: cap, period_start: start,
          notes: body.notes?.trim() || null, updated_at: new Date().toISOString(), updated_by: actor,
        };
        const { error } = await svc.from("company_issuing_plans").upsert(row, { onConflict: "company_id" });
        if (error) throw new Error(`set plan: ${error.message}`);
        await audit(svc, actor, companyId, "set_issuing_plan", { package: pkg, annual_cap: cap, period_start: start });
        break;
      }

      case "clear_plan": {
        const { error } = await svc.from("company_issuing_plans").delete().eq("company_id", companyId);
        if (error) throw new Error(`clear plan: ${error.message}`);
        await audit(svc, actor, companyId, "clear_issuing_plan", {});
        break;
      }

      case "pause": {
        // One row per (company, feature) in 331: pausing again after a resume reopens it.
        const { error } = await svc.from("company_feature_disables").upsert({
          company_id: companyId, feature_key: FEATURE, disabled_at: new Date().toISOString(), disabled_by: actor,
          reason: body.reason?.trim() || null, restored_at: null, restored_by: null,
        }, { onConflict: "company_id,feature_key" });
        if (error) throw new Error(`pause: ${error.message}`);
        await audit(svc, actor, companyId, "pause_issuing", { reason: body.reason?.trim() || null });
        break;
      }

      case "resume": {
        const { error } = await svc.from("company_feature_disables")
          .update({ restored_at: new Date().toISOString(), restored_by: actor })
          .eq("company_id", companyId).eq("feature_key", FEATURE).is("restored_at", null);
        if (error) throw new Error(`resume: ${error.message}`);
        await audit(svc, actor, companyId, "resume_issuing", {});
        break;
      }

      default:
        throw new HttpError(400, "action must be get, set_plan, clear_plan, pause or resume");
    }
    // Every action answers with the state as it now is, read back rather than assumed.
    return jsonResponse(await state(svc, companyId));
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
