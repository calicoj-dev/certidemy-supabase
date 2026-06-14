// POST /functions/v1/list-credentials
//
// Body: { } (no params — returns the full platform credential list)
// Auth: Bearer JWT — MUST be a platform_admin.
//
// The platform-wide credential registry view for the admin console. Lists
// every issued credential across all partners, each tagged with the company
// that sponsored it (or "self-pay" for B2C). Sibling of get-company-detail,
// but unscoped — same admin-gated service-client pattern, because credentials
// are owner-select-only under RLS and can't be enumerated by a session client.
//
// Company attribution is the authoritative issuance-time link:
//   credentials.exam_attempt_id -> exam_attempts.company_id -> companies.name
// A null company_id is a B2C self-pay credential (no sponsoring partner).
//
// score_pct is never selected, never returned — the integrity rule holds.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return jsonResponse({ error: "method not allowed" }, 405);

  try {
    // Identify the caller.
    const actor_user_id = await authenticate(req);

    // Authorize: caller must be platform_admin.
    const svc = getServiceClient();
    const { data: actorProfile } = await svc
      .from("profiles")
      .select("platform_role")
      .eq("id", actor_user_id)
      .maybeSingle();
    if (!actorProfile || actorProfile.platform_role !== "platform_admin") {
      throw new HttpError(403, "platform_admin required");
    }

    // All credentials. score_pct deliberately excluded.
    const { data: credData, error: cErr } = await svc
      .from("credentials")
      .select(
        "id, credential_code, holder_name, certification_name, certification_code, status, issued_at, expires_at, exam_attempt_id"
      )
      .order("issued_at", { ascending: false });
    if (cErr) throw new Error(`credentials lookup: ${cErr.message}`);

    const creds = (credData ?? []) as {
      id: string;
      credential_code: string;
      holder_name: string;
      certification_name: string;
      certification_code: string;
      status: string;
      issued_at: string | null;
      expires_at: string | null;
      exam_attempt_id: string | null;
    }[];

    // Resolve sponsoring company via the exam attempt (issuance-time link).
    const attemptIds = Array.from(
      new Set(
        creds
          .map((c) => c.exam_attempt_id)
          .filter((id): id is string => !!id)
      )
    );

    const companyIdByAttempt = new Map<string, string | null>();
    if (attemptIds.length > 0) {
      const { data: attempts } = await svc
        .from("exam_attempts")
        .select("id, company_id")
        .in("id", attemptIds);
      for (const a of (attempts ?? []) as {
        id: string;
        company_id: string | null;
      }[]) {
        companyIdByAttempt.set(a.id, a.company_id ?? null);
      }
    }

    const companyIds = Array.from(
      new Set(
        [...companyIdByAttempt.values()].filter(
          (id): id is string => !!id
        )
      )
    );

    const companyNameById = new Map<string, string>();
    if (companyIds.length > 0) {
      const { data: companies } = await svc
        .from("companies")
        .select("id, name")
        .in("id", companyIds);
      for (const co of (companies ?? []) as { id: string; name: string }[]) {
        companyNameById.set(co.id, co.name);
      }
    }

    const credentials = creds.map((c) => {
      const companyId = c.exam_attempt_id
        ? companyIdByAttempt.get(c.exam_attempt_id) ?? null
        : null;
      return {
        id: c.id,
        credentialCode: c.credential_code,
        holderName: c.holder_name,
        certificationName: c.certification_name,
        certificationCode: c.certification_code,
        status: c.status,
        issuedAt: c.issued_at,
        expiresAt: c.expires_at,
        companyId,
        companyName: companyId
          ? companyNameById.get(companyId) ?? "Unknown company"
          : null, // null = self-pay
      };
    });

    return jsonResponse({ credentials });
  } catch (err) {
    if (err instanceof HttpError)
      return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
