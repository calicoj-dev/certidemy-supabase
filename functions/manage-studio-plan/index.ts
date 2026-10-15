// POST /functions/v1/manage-studio-plan
//
// Auth: Bearer JWT -- platform_admin only. Partners see their own allowance and credits in the studio
// function's context; only Certidemy changes them. Migration 402.
//
// Body: { action, company_id, ... }
//   get          -> the state below
//   set_monthly  { monthly_limit }           included videos a month (0-1000); null restores the default of 20
//   add_credits  { amount, kind, note? }     kind "package" (a sale, amount > 0) or "adjustment" (+/- a correction)
//   refund       { video_id, note? }         +1 credit for a finished video, once per video; the video stays
//   pause        { note? }                   406: nothing new is written, approved or rendered until resume
//   resume       {}                          the queue runs again; finished videos were never affected
//
// Credits are rows in studio_credits, never an edited counter: a sale, a correction and a refund are each one row,
// and the balance is computed (studio_credit_balance). Every change is also in admin_actions.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";
import { platformRole } from "../_shared/authorize.ts";

// deno-lint-ignore no-explicit-any
type Svc = any;

const DEFAULT_MONTHLY = 20;
const MAX_MONTHLY = 1000;
const MAX_ADD = 10000;
const HISTORY_ACTIONS = ["set_studio_monthly", "add_studio_credits", "refund_studio_video", "pause_studio", "resume_studio"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Body {
  action?: string;
  company_id?: string;
  monthly_limit?: number | null;
  amount?: number;
  kind?: string;
  note?: string;
  video_id?: string;
}

async function issuerFor(svc: Svc, companyId: string) {
  const { data, error } = await svc.from("issuers").select("id, name").eq("company_id", companyId).maybeSingle();
  if (error) throw new Error(`issuer lookup: ${error.message}`);
  return data as { id: string; name: string } | null;
}

async function state(svc: Svc, companyId: string) {
  const issuer = await issuerFor(svc, companyId);
  if (!issuer) return { ok: true, issuer: null };
  const month = new Date().toISOString().slice(0, 8) + "01";
  const [quota, used, balance, ledger, done, log, pause] = await Promise.all([
    svc.from("studio_quota").select("monthly_limit").eq("issuer_id", issuer.id).maybeSingle(),
    svc.from("studio_videos").select("id", { count: "exact", head: true }).eq("issuer_id", issuer.id).eq("quota_month", month)
      .eq("funding", "monthly").in("status", ["approved", "rendering", "done"]),
    svc.rpc("studio_credit_balance", { p_issuer: issuer.id }),
    svc.from("studio_credits").select("id, amount, kind, note, video_id, created_by, created_at").eq("issuer_id", issuer.id)
      .order("created_at", { ascending: false }).limit(30),
    svc.from("studio_videos").select("id, language, script, rendered_at, funding").eq("issuer_id", issuer.id).eq("status", "done")
      .order("rendered_at", { ascending: false }).limit(30),
    svc.from("admin_actions").select("action, metadata, created_at, actor_user_id").eq("target_type", "company").eq("target_id", companyId)
      .in("action", HISTORY_ACTIONS).order("created_at", { ascending: false }).limit(20),
    svc.from("studio_pauses").select("paused_at, reason").eq("issuer_id", issuer.id).maybeSingle(),
  ]);
  for (const [name, r] of Object.entries({ quota, used, balance, ledger, done, log, pause })) {
    if ((r as { error?: { message: string } }).error) throw new Error(`${name}: ${(r as { error: { message: string } }).error.message}`);
  }
  const rows = (ledger.data ?? []) as { id: string; amount: number; kind: string; note: string | null; video_id: string | null; created_by: string | null; created_at: string }[];
  const actorIds = [...new Set([...rows.map((r) => r.created_by), ...(log.data ?? []).map((r: { actor_user_id: string }) => r.actor_user_id)].filter(Boolean))];
  const names = new Map<string, string>();
  if (actorIds.length) {
    const { data: people, error } = await svc.from("profiles").select("id, full_name, email").in("id", actorIds);
    if (error) throw new Error(`actors: ${error.message}`);
    for (const p of (people ?? []) as { id: string; full_name: string | null; email: string | null }[]) names.set(p.id, p.full_name || p.email || "");
  }
  const refunded = new Set(rows.filter((r) => r.kind === "refund").map((r) => r.video_id));
  // a refund is per video and the ledger page holds 30 rows: ask the table, not the page, which videos are refunded
  const doneRows = (done.data ?? []) as { id: string; language: string; script: { cover?: { line1?: string; line2?: string } } | null; rendered_at: string | null; funding: string | null }[];
  if (doneRows.length) {
    const { data: r, error } = await svc.from("studio_credits").select("video_id").eq("kind", "refund").in("video_id", doneRows.map((v) => v.id));
    if (error) throw new Error(`refunds: ${error.message}`);
    for (const x of (r ?? []) as { video_id: string }[]) refunded.add(x.video_id);
  }
  const title = (v: { script: { cover?: { line1?: string; line2?: string } } | null }) =>
    [v.script?.cover?.line1, v.script?.cover?.line2].filter(Boolean).join(" ").slice(0, 120);
  return {
    ok: true,
    issuer,
    paused: pause.data ? { at: pause.data.paused_at, reason: pause.data.reason } : null,
    monthly_limit: quota.data?.monthly_limit ?? null,
    default_monthly: DEFAULT_MONTHLY,
    used_this_month: used.count ?? 0,
    credits: Number(balance.data ?? 0),
    ledger: rows.map((r) => ({ id: r.id, amount: r.amount, kind: r.kind, note: r.note, video_id: r.video_id, at: r.created_at, by: r.created_by ? names.get(r.created_by) ?? null : null })),
    videos: doneRows.map((v) => ({ id: v.id, language: v.language, title: title(v), rendered_at: v.rendered_at, refunded: refunded.has(v.id) })),
    history: (log.data ?? []).map((r: { action: string; metadata: Record<string, unknown> | null; created_at: string; actor_user_id: string }) =>
      ({ action: r.action, metadata: r.metadata, at: r.created_at, by: names.get(r.actor_user_id) ?? null })),
  };
}

async function audit(svc: Svc, actor: string, companyId: string, action: string, metadata: Record<string, unknown>) {
  const { error } = await svc.from("admin_actions").insert({ actor_user_id: actor, action, target_type: "company", target_id: companyId, reason: null, metadata });
  if (error) console.error(`${action} audit failed`, error);
}

const noteOf = (n: unknown) => {
  const s = typeof n === "string" ? n.trim() : "";
  if (s.length > 500) throw new HttpError(400, "note is longer than 500 characters");
  return s || null;
};

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

    if (body.action !== "get") {
      const issuer = await issuerFor(svc, companyId);
      if (!issuer) throw new HttpError(409, "this company has no credential issuer, so it has no Studio");

      switch (body.action) {
        case "set_monthly": {
          if (body.monthly_limit === null) {
            const { error } = await svc.from("studio_quota").delete().eq("issuer_id", issuer.id);
            if (error) throw new Error(`reset monthly: ${error.message}`);
          } else {
            const n = Number(body.monthly_limit);
            if (!Number.isInteger(n) || n < 0 || n > MAX_MONTHLY) throw new HttpError(400, `monthly_limit must be a whole number from 0 to ${MAX_MONTHLY}`);
            const { error } = await svc.from("studio_quota").upsert({ issuer_id: issuer.id, monthly_limit: n }, { onConflict: "issuer_id" });
            if (error) throw new Error(`set monthly: ${error.message}`);
          }
          await audit(svc, actor, companyId, "set_studio_monthly", { issuer_id: issuer.id, monthly_limit: body.monthly_limit ?? null });
          break;
        }

        case "add_credits": {
          const kind = body.kind === "adjustment" ? "adjustment" : body.kind === "package" ? "package" : null;
          if (!kind) throw new HttpError(400, "kind must be package or adjustment");
          const amount = Number(body.amount);
          if (!Number.isInteger(amount) || amount === 0 || Math.abs(amount) > MAX_ADD) throw new HttpError(400, `amount must be a whole number from 1 to ${MAX_ADD} (negative only as an adjustment)`);
          if (kind === "package" && amount < 0) throw new HttpError(400, "a package adds videos; use an adjustment to take some away");
          const note = noteOf(body.note);
          const { error } = await svc.from("studio_credits").insert({ issuer_id: issuer.id, amount, kind, note, created_by: actor });
          if (error) throw new Error(`add credits: ${error.message}`);
          await audit(svc, actor, companyId, "add_studio_credits", { issuer_id: issuer.id, amount, kind, note });
          break;
        }

        case "refund": {
          const videoId = body.video_id?.trim() ?? "";
          if (!UUID_RE.test(videoId)) throw new HttpError(400, "valid video_id required");
          const { data: video, error: vErr } = await svc.from("studio_videos").select("id, status").eq("id", videoId).eq("issuer_id", issuer.id).maybeSingle();
          if (vErr) throw new Error(`video lookup: ${vErr.message}`);
          if (!video) throw new HttpError(404, "video not found for this company");
          if (video.status !== "done") throw new HttpError(409, "only a finished video can be refunded; a failed one never counted");
          const note = noteOf(body.note);
          const { error } = await svc.from("studio_credits").insert({ issuer_id: issuer.id, amount: 1, kind: "refund", video_id: videoId, note, created_by: actor });
          if (error?.code === "23505") throw new HttpError(409, "this video was already refunded");
          if (error) throw new Error(`refund: ${error.message}`);
          await audit(svc, actor, companyId, "refund_studio_video", { issuer_id: issuer.id, video_id: videoId, note });
          break;
        }

        case "pause": {
          const note = noteOf(body.note);
          const { error } = await svc.from("studio_pauses").insert({ issuer_id: issuer.id, reason: note, paused_by: actor });
          if (error?.code === "23505") throw new HttpError(409, "Studio is already paused");
          if (error) throw new Error(`pause: ${error.message}`);
          await audit(svc, actor, companyId, "pause_studio", { issuer_id: issuer.id, note });
          break;
        }

        case "resume": {
          const { data, error } = await svc.from("studio_pauses").delete().eq("issuer_id", issuer.id).select("issuer_id");
          if (error) throw new Error(`resume: ${error.message}`);
          if (!data?.length) throw new HttpError(409, "Studio is not paused");
          await audit(svc, actor, companyId, "resume_studio", { issuer_id: issuer.id });
          break;
        }

        default:
          throw new HttpError(400, "action must be get, set_monthly, add_credits, refund, pause or resume");
      }
    }
    // Every action answers with the state as it now is, read back rather than assumed.
    return jsonResponse(await state(svc, companyId));
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
