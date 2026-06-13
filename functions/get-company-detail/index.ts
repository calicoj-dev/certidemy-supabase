// POST /functions/v1/get-company-detail
//
// Body: { company_id }
// Auth: Bearer JWT — MUST be a platform_admin.
//
// The admin company drill-down read. Returns ONE company's roster (vouchers +
// holder names) and credentials. Both tables are RLS-protected against
// cross-tenant reads — vouchers are team_admin-scoped, credentials are
// owner-select-only — so a platform_admin viewing another company's data must
// go through the service client, exactly as revoke-credential does for writes.
//
// Seats/batches are NOT here: v_batch_quota is admin-readable directly, so the
// page loads those with loadPartnerQuota (no service path needed).
//
// Read-only. score_pct is never selected, never returned — the integrity rule
// that the score is invisible everywhere outside scoring holds here too.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";

interface Body {
  company_id: string;
}

type VoucherStatus = "available" | "assigned" | "redeemed" | "revoked";
type RosterState = "pending" | "active" | "completed" | "revoked";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function deriveState(status: VoucherStatus, claimed: boolean): RosterState {
  if (status === "revoked") return "revoked";
  if (status === "redeemed") return "completed";
  return claimed ? "active" : "pending";
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return jsonResponse({ error: "method not allowed" }, 405);

  try {
    // Identify the caller.
    const actor_user_id = await authenticate(req);

    // Authorize: caller must be platform_admin (profiles is the source of truth).
    const svc = getServiceClient();
    const { data: actorProfile } = await svc
      .from("profiles")
      .select("platform_role")
      .eq("id", actor_user_id)
      .maybeSingle();
    if (!actorProfile || actorProfile.platform_role !== "platform_admin") {
      throw new HttpError(403, "platform_admin required");
    }

    const body = (await req.json()) as Body;
    if (!body.company_id || !UUID_RE.test(body.company_id)) {
      throw new HttpError(400, "valid company_id required");
    }
    const companyId = body.company_id;

    // Company.
    const { data: companyRow } = await svc
      .from("companies")
      .select("id, name")
      .eq("id", companyId)
      .maybeSingle();
    const company = companyRow
      ? { id: companyRow.id as string, name: companyRow.name as string }
      : null;

    // Vouchers for the company (the roster spine + the credential linkage).
    const { data: voucherData } = await svc
      .from("vouchers")
      .select(
        "id, voucher_code, assigned_email, assigned_user_id, status, assigned_at, redeemed_at, revoked_reason, credential_id"
      )
      .eq("company_id", companyId);

    const vouchers = (voucherData ?? []) as {
      id: string;
      voucher_code: string;
      assigned_email: string | null;
      assigned_user_id: string | null;
      status: string;
      assigned_at: string | null;
      redeemed_at: string | null;
      revoked_reason: string | null;
      credential_id: string | null;
    }[];

    // Resolve holder names for claimed vouchers.
    const userIds = Array.from(
      new Set(
        vouchers
          .map((v) => v.assigned_user_id)
          .filter((id): id is string => !!id)
      )
    );
    const nameByUser = new Map<string, string | null>();
    if (userIds.length > 0) {
      const { data: profileData } = await svc
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      for (const p of (profileData ?? []) as {
        id: string;
        full_name: string | null;
      }[]) {
        nameByUser.set(p.id, p.full_name ?? null);
      }
    }

    // Build roster rows (mirrors lib/console/roster.ts derivation + ordering).
    const rows = vouchers.map((v) => {
      const claimed = !!v.assigned_user_id;
      const status = v.status as VoucherStatus;
      return {
        voucherId: v.id,
        voucherCode: v.voucher_code,
        email: v.assigned_email,
        name: claimed ? nameByUser.get(v.assigned_user_id!) ?? null : null,
        claimed,
        status,
        state: deriveState(status, claimed),
        assignedAt: v.assigned_at,
        redeemedAt: v.redeemed_at,
        revokedReason: v.revoked_reason,
        credentialId: v.credential_id,
      };
    });

    const stateRank: Record<RosterState, number> = {
      pending: 0,
      active: 1,
      completed: 2,
      revoked: 3,
    };
    rows.sort((a, b) => {
      const d = stateRank[a.state] - stateRank[b.state];
      if (d !== 0) return d;
      const at = a.assignedAt ? new Date(a.assignedAt).getTime() : 0;
      const bt = b.assignedAt ? new Date(b.assignedAt).getTime() : 0;
      return bt - at;
    });

    const count = (s: RosterState) =>
      rows.filter((r) => r.state === s).length;

    const roster = {
      companyId,
      total: rows.length,
      pending: count("pending"),
      active: count("active"),
      completed: count("completed"),
      revoked: count("revoked"),
      rows,
    };

    // Credentials this company owns = those minted through its vouchers.
    const credIds = Array.from(
      new Set(
        vouchers
          .map((v) => v.credential_id)
          .filter((id): id is string => !!id)
      )
    );

    let credentials: {
      id: string;
      credentialCode: string;
      holderName: string;
      certificationName: string;
      certificationCode: string;
      status: string;
      issuedAt: string | null;
      expiresAt: string | null;
    }[] = [];

    if (credIds.length > 0) {
      // NOTE: score_pct deliberately excluded — never leaves the server.
      const { data: credData } = await svc
        .from("credentials")
        .select(
          "id, credential_code, holder_name, certification_name, certification_code, status, issued_at, expires_at"
        )
        .in("id", credIds);

      credentials = ((credData ?? []) as {
        id: string;
        credential_code: string;
        holder_name: string;
        certification_name: string;
        certification_code: string;
        status: string;
        issued_at: string | null;
        expires_at: string | null;
      }[]).map((c) => ({
        id: c.id,
        credentialCode: c.credential_code,
        holderName: c.holder_name,
        certificationName: c.certification_name,
        certificationCode: c.certification_code,
        status: c.status,
        issuedAt: c.issued_at,
        expiresAt: c.expires_at,
      }));

      // Active first, revoked/expired after; within a group, newest issued first.
      const rank = (s: string) =>
        s === "active" ? 0 : s === "expired" ? 1 : 2;
      credentials.sort((a, b) => {
        const d = rank(a.status) - rank(b.status);
        if (d !== 0) return d;
        const at = a.issuedAt ? new Date(a.issuedAt).getTime() : 0;
        const bt = b.issuedAt ? new Date(b.issuedAt).getTime() : 0;
        return bt - at;
      });
    }

    return jsonResponse({ company, roster, credentials });
  } catch (err) {
    if (err instanceof HttpError)
      return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
