// POST /functions/v1/manage-vouchers
//
// Auth: Bearer JWT -- platform_admin only. Certidemy's full control over one partner's exam vouchers,
// from the company page. Partners keep their own tools (assign-voucher, unassign-voucher, change-voucher-cert).
//
// Body: { action, company_id, ... }
//   get                                   pools, vouchers (with the allowance each one resolves to), certs, record
//   set_pool    { batch_id, seats?, attempts_per_seat?, expires_at?, invoice_ref? }
//               seats never below the seats people hold; expires_at gates ASSIGNMENT only (137), so a past date
//               stops new assignments without touching anyone who holds a voucher
//   revoke      { voucher_ids, note?, remove_seats? }  any live voucher, used or not; the credential it earned is
//               untouched. Its seat returns to the pool unless remove_seats lowers the pool to match
//   reactivate  { voucher_ids }           back to what its attempts say (assigned / redeemed / available);
//               a full pool grows by one so the reactivated holder never pushes it over
//   set_voucher { voucher_id, attempts_allowed?, expires_at? }  per-voucher override (null = the pool's terms)
//               and the holder's own expiry; status follows the attempts left
// New pools go through create-batch; assigning on a partner's behalf goes through assign-voucher.
// Every change is in admin_actions; every action answers with the state read back.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";
import { platformRole } from "../_shared/authorize.ts";
import { allowanceFrom } from "../_shared/vouchers.ts";

// deno-lint-ignore no-explicit-any
type Svc = any;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE = 1000;
const MAX_SEATS = 100000;
const MAX_ATTEMPTS = 100;
const MAX_IDS = 500;
const CHUNK = 100; // ids per .in() filter, so the request URL stays short
const POOL_ACTIONS = ["create_batch", "grow_batch", "set_voucher_pool"];
const COMPANY_ACTIONS = ["revoke_vouchers", "reactivate_vouchers", "set_voucher_terms", "assign_voucher"];
const VOUCHER_COLS =
  "id, voucher_code, certification_id, batch_id, company_certification_id, assigned_email, assigned_user_id, status, attempts_allowed, attempts_used, assigned_at, redeemed_at, revoked_at, revoked_reason, expires_at, credential_id";

interface Body {
  action?: string;
  company_id?: string;
  batch_id?: string;
  seats?: number;
  attempts_per_seat?: number | null;
  expires_at?: string | null;
  invoice_ref?: string | null;
  voucher_id?: string;
  voucher_ids?: string[];
  attempts_allowed?: number | null;
  note?: string;
  remove_seats?: boolean;
}

interface Pool { id: string; seats: number; attempts_per_seat: number | null; invoice_ref: string | null; expires_at: string | null; created_at: string; certification_id: string | null }
interface Voucher {
  id: string; voucher_code: string; certification_id: string; batch_id: string | null; company_certification_id: string | null;
  assigned_email: string | null; assigned_user_id: string | null; status: string; attempts_allowed: number | null; attempts_used: number;
  assigned_at: string | null; redeemed_at: string | null; revoked_at: string | null; revoked_reason: string | null;
  expires_at: string | null; credential_id: string | null;
}

/** Every row, paged to the exact count: an unpaged read stops at 1,000 and says nothing. */
async function all<T>(make: () => Svc, what: string): Promise<T[]> {
  const out: T[] = [];
  let total: number | null = null;
  for (let from = 0; total === null || out.length < total; from += PAGE) {
    const { data, error, count } = await make().range(from, from + PAGE - 1);
    if (error) throw new Error(`${what}: ${error.message}`);
    total = count ?? 0;
    out.push(...((data ?? []) as T[]));
    if (!data?.length) break;
  }
  if (total !== null && out.length !== total) throw new Error(`${what}: read ${out.length} of ${total}`);
  return out;
}

const vouchersOf = (svc: Svc, companyId: string) =>
  all<Voucher>(() => svc.from("vouchers").select(VOUCHER_COLS, { count: "exact" }).eq("company_id", companyId).order("id"), "vouchers");

async function poolsOf(svc: Svc, companyId: string): Promise<Pool[]> {
  const { data, error } = await svc.from("seat_batches")
    .select("id, seats, attempts_per_seat, invoice_ref, expires_at, created_at, certification_id")
    .eq("company_id", companyId).order("created_at");
  if (error) throw new Error(`pools: ${error.message}`);
  return (data ?? []) as Pool[];
}

async function allocTermsOf(svc: Svc, companyId: string) {
  const { data, error } = await svc.from("company_certifications").select("id, attempts_per_seat").eq("company_id", companyId);
  if (error) throw new Error(`allocations: ${error.message}`);
  return new Map(((data ?? []) as { id: string; attempts_per_seat: number | null }[]).map((r) => [r.id, r]));
}

const holdsSeat = (status: string) => status === "assigned" || status === "redeemed";

/** What a non-revoked voucher's status should be, from who holds it and the attempts it has left. */
function liveStatus(v: Voucher, allowance: number | null): "available" | "assigned" | "redeemed" {
  if (!v.assigned_email && !v.assigned_user_id) return "available";
  if (v.credential_id) return "redeemed";
  if (allowance !== null && v.attempts_used >= allowance) return "redeemed";
  return "assigned";
}

async function state(svc: Svc, companyId: string) {
  const [pools, vouchers, allocs] = await Promise.all([poolsOf(svc, companyId), vouchersOf(svc, companyId), allocTermsOf(svc, companyId)]);
  const poolById = new Map(pools.map((p) => [p.id, p]));
  const userIds = [...new Set(vouchers.map((v) => v.assigned_user_id).filter(Boolean))] as string[];

  const [certs, people, poolLog, companyLog] = await Promise.all([
    svc.from("certifications").select("id, code, name, status").order("code"),
    userIds.length ? svc.from("profiles").select("id, full_name").in("id", userIds) : Promise.resolve({ data: [], error: null }),
    pools.length
      ? svc.from("admin_actions").select("action, metadata, created_at, actor_user_id, target_id").eq("target_type", "seat_batch")
        .in("target_id", pools.map((p) => p.id)).in("action", POOL_ACTIONS).order("created_at", { ascending: false }).limit(40)
      : Promise.resolve({ data: [], error: null }),
    svc.from("admin_actions").select("action, metadata, created_at, actor_user_id, target_id").eq("target_type", "company")
      .eq("target_id", companyId).in("action", COMPANY_ACTIONS).order("created_at", { ascending: false }).limit(40),
  ]);
  for (const [name, r] of Object.entries({ certs, people, poolLog, companyLog })) {
    if ((r as { error?: { message: string } | null }).error) throw new Error(`${name}: ${(r as { error: { message: string } }).error.message}`);
  }
  const certRows = (certs.data ?? []) as { id: string; code: string; name: string; status: string }[];
  const certById = new Map(certRows.map((c) => [c.id, c]));
  const nameOf = new Map(((people.data ?? []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p.full_name]));

  const log = [...(poolLog.data ?? []), ...(companyLog.data ?? [])] as { action: string; metadata: Record<string, unknown> | null; created_at: string; actor_user_id: string; target_id: string }[];
  log.sort((a, b) => b.created_at.localeCompare(a.created_at));
  const actorIds = [...new Set(log.map((r) => r.actor_user_id).filter(Boolean))];
  const actors = new Map<string, string>();
  if (actorIds.length) {
    const { data, error } = await svc.from("profiles").select("id, full_name, email").in("id", actorIds);
    if (error) throw new Error(`actors: ${error.message}`);
    for (const p of (data ?? []) as { id: string; full_name: string | null; email: string | null }[]) actors.set(p.id, p.full_name || p.email || "");
  }

  const now = Date.now();
  const past = (iso: string | null) => !!iso && new Date(iso).getTime() < now;
  const out = vouchers.map((v) => {
    const pool = v.batch_id ? poolById.get(v.batch_id) : undefined;
    const allowance = allowanceFrom(v.attempts_allowed, pool, v.company_certification_id ? allocs.get(v.company_certification_id) : undefined);
    const cert = certById.get(v.certification_id);
    return {
      id: v.id, code: v.voucher_code, batch_id: v.batch_id, cert_code: cert?.code ?? null, cert_name: cert?.name ?? null,
      email: v.assigned_email, name: v.assigned_user_id ? nameOf.get(v.assigned_user_id) ?? null : null, claimed: !!v.assigned_user_id,
      status: v.status, expired: v.status !== "revoked" && v.assigned_at !== null && past(v.expires_at),
      attempts_used: v.attempts_used, attempts_override: v.attempts_allowed, allowance,
      assigned_at: v.assigned_at, redeemed_at: v.redeemed_at, revoked_at: v.revoked_at, revoked_reason: v.revoked_reason,
      expires_at: v.expires_at, credential_id: v.credential_id,
    };
  }).sort((a, b) => (b.assigned_at ?? "").localeCompare(a.assigned_at ?? "") || a.code.localeCompare(b.code));

  return {
    ok: true,
    pools: pools.map((p) => {
      const mine = vouchers.filter((v) => v.batch_id === p.id);
      const used = mine.filter((v) => holdsSeat(v.status)).length;
      return {
        id: p.id, seats: p.seats, used, free: Math.max(0, p.seats - used), revoked: mine.filter((v) => v.status === "revoked").length,
        attempts_per_seat: p.attempts_per_seat, invoice_ref: p.invoice_ref, expires_at: p.expires_at, open: !past(p.expires_at),
        created_at: p.created_at, cert_code: p.certification_id ? certById.get(p.certification_id)?.code ?? null : null,
      };
    }),
    vouchers: out,
    certs: certRows.filter((c) => c.status === "available").map((c) => ({ id: c.id, code: c.code, name: c.name })),
    history: log.slice(0, 40).map((r) => ({ action: r.action, metadata: r.metadata, at: r.created_at, by: actors.get(r.actor_user_id) ?? null })),
  };
}

async function audit(svc: Svc, actor: string, targetType: "company" | "seat_batch", targetId: string, action: string, metadata: Record<string, unknown>) {
  const { error } = await svc.from("admin_actions").insert({ actor_user_id: actor, action, target_type: targetType, target_id: targetId, reason: null, metadata });
  if (error) console.error(`${action} audit failed`, error);
}

const noteOf = (n: unknown) => {
  const s = typeof n === "string" ? n.trim() : "";
  if (s.length > 500) throw new HttpError(400, "note is longer than 500 characters");
  return s || null;
};

function dateOf(raw: unknown, field: string): string {
  const d = typeof raw === "string" ? new Date(raw.trim()) : null;
  if (!d || Number.isNaN(d.getTime())) throw new HttpError(400, `${field} must be a date`);
  return d.toISOString();
}

function attemptsOf(raw: unknown, field: string): number | null {
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > MAX_ATTEMPTS) throw new HttpError(400, `${field} must be null (unlimited) or a whole number from 1 to ${MAX_ATTEMPTS}`);
  return n;
}

function idsOf(body: Body): string[] {
  const ids = [...new Set((body.voucher_ids ?? []).map((s) => String(s).trim()))];
  if (!ids.length || ids.length > MAX_IDS || !ids.every((id) => UUID_RE.test(id))) throw new HttpError(400, `voucher_ids must be 1 to ${MAX_IDS} voucher ids`);
  return ids;
}

/** The vouchers named, each one this company's. Ids from the body are checked against company_id here. */
async function loadVouchers(svc: Svc, companyId: string, ids: string[]): Promise<Voucher[]> {
  const rows: Voucher[] = [];
  for (let i = 0; i < ids.length; i += CHUNK) {
    const part = ids.slice(i, i + CHUNK);
    rows.push(...await all<Voucher>(() => svc.from("vouchers").select(VOUCHER_COLS, { count: "exact" }).eq("company_id", companyId).in("id", part).order("id"), "vouchers"));
  }
  if (rows.length !== ids.length) throw new HttpError(404, `${ids.length - rows.length} voucher(s) not found for this company`);
  return rows;
}

async function setPool(svc: Svc, actor: string, companyId: string, body: Body) {
  const batchId = body.batch_id?.trim() ?? "";
  if (!UUID_RE.test(batchId)) throw new HttpError(400, "valid batch_id required");
  const { data: pool, error } = await svc.from("seat_batches").select("id, seats, attempts_per_seat, invoice_ref, expires_at")
    .eq("id", batchId).eq("company_id", companyId).maybeSingle();
  if (error) throw new Error(`pool lookup: ${error.message}`);
  if (!pool) throw new HttpError(404, "pool not found for this company");

  const patch: Record<string, unknown> = {};
  if (body.seats !== undefined) {
    const seats = Number(body.seats);
    if (!Number.isInteger(seats) || seats < 0 || seats > MAX_SEATS) throw new HttpError(400, `seats must be a whole number from 0 to ${MAX_SEATS}`);
    const { count, error: cErr } = await svc.from("vouchers").select("id", { count: "exact", head: true })
      .eq("batch_id", batchId).in("status", ["assigned", "redeemed"]);
    if (cErr) throw new Error(`seat count: ${cErr.message}`);
    if (seats < (count ?? 0)) throw new HttpError(409, `${count} seat(s) are held by people; revoke vouchers first to go below that`);
    patch.seats = seats;
  }
  if ("attempts_per_seat" in body) patch.attempts_per_seat = attemptsOf(body.attempts_per_seat, "attempts_per_seat");
  if (body.expires_at !== undefined) patch.expires_at = dateOf(body.expires_at, "expires_at");
  if ("invoice_ref" in body) {
    const ref = typeof body.invoice_ref === "string" ? body.invoice_ref.trim() : "";
    if (ref.length > 200) throw new HttpError(400, "invoice_ref is longer than 200 characters");
    patch.invoice_ref = ref || null;
  }
  if (!Object.keys(patch).length) throw new HttpError(400, "nothing to change");

  const { error: uErr } = await svc.from("seat_batches").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", batchId);
  if (uErr) throw new Error(`pool update: ${uErr.message}`);
  const before = Object.fromEntries(Object.keys(patch).map((k) => [k, (pool as Record<string, unknown>)[k] ?? null]));
  await audit(svc, actor, "seat_batch", batchId, "set_voucher_pool", { company_id: companyId, before, after: patch });
}

async function revoke(svc: Svc, actor: string, companyId: string, body: Body) {
  const ids = idsOf(body);
  const note = noteOf(body.note);
  const live = (await loadVouchers(svc, companyId, ids)).filter((v) => v.status !== "revoked");
  if (!live.length) throw new HttpError(409, "those vouchers are already revoked");
  const now = new Date().toISOString();
  for (let i = 0; i < live.length; i += CHUNK) {
    const { error } = await svc.from("vouchers").update({ status: "revoked", revoked_at: now, revoked_reason: note ?? "revoked by Certidemy", updated_at: now })
      .in("id", live.slice(i, i + CHUNK).map((v) => v.id)).neq("status", "revoked");
    if (error) throw new Error(`revoke: ${error.message}`);
  }

  // Optionally take the freed seats out of their pools, so revoking is not also handing the seat back.
  const removed: Record<string, number> = {};
  if (body.remove_seats) {
    for (const v of live) if (v.batch_id && holdsSeat(v.status)) removed[v.batch_id] = (removed[v.batch_id] ?? 0) + 1;
    for (const [batchId, n] of Object.entries(removed)) {
      const { data: pool, error: pErr } = await svc.from("seat_batches").select("seats").eq("id", batchId).single();
      if (pErr) throw new Error(`pool read: ${pErr.message}`);
      const { error: uErr } = await svc.from("seat_batches").update({ seats: Math.max(0, pool.seats - n), updated_at: now }).eq("id", batchId);
      if (uErr) throw new Error(`pool shrink: ${uErr.message}`);
    }
  }
  await audit(svc, actor, "company", companyId, "revoke_vouchers", {
    vouchers: live.map((v) => ({ id: v.id, code: v.voucher_code, email: v.assigned_email, was: v.status, attempts_used: v.attempts_used })),
    note, seats_removed: removed,
  });
}

async function reactivate(svc: Svc, actor: string, companyId: string, body: Body) {
  const ids = idsOf(body);
  const revoked = (await loadVouchers(svc, companyId, ids)).filter((v) => v.status === "revoked");
  if (!revoked.length) throw new HttpError(409, "none of those vouchers is revoked");
  const pools = new Map((await poolsOf(svc, companyId)).map((p) => [p.id, p]));
  const allocs = await allocTermsOf(svc, companyId);
  const done: { id: string; code: string; status: string }[] = [];
  const grown: Record<string, number> = {};
  const failed: string[] = [];

  for (const v of revoked) {
    const to = liveStatus(v, allowanceFrom(v.attempts_allowed, v.batch_id ? pools.get(v.batch_id) : undefined,
      v.company_certification_id ? allocs.get(v.company_certification_id) : undefined));
    const now = new Date().toISOString();
    if (v.batch_id && holdsSeat(to)) {
      const { count, error } = await svc.from("vouchers").select("id", { count: "exact", head: true })
        .eq("batch_id", v.batch_id).in("status", ["assigned", "redeemed"]);
      if (error) throw new Error(`seat count: ${error.message}`);
      const pool = pools.get(v.batch_id);
      if (pool && (count ?? 0) >= pool.seats) {
        const { error: gErr } = await svc.from("seat_batches").update({ seats: pool.seats + 1, updated_at: now }).eq("id", pool.id);
        if (gErr) throw new Error(`pool grow: ${gErr.message}`);
        pool.seats += 1;
        grown[pool.id] = (grown[pool.id] ?? 0) + 1;
      }
    }
    const { error } = await svc.from("vouchers").update({
      status: to, revoked_at: null, revoked_reason: null, updated_at: now,
      ...(to === "redeemed" && !v.redeemed_at ? { redeemed_at: now } : {}),
    }).eq("id", v.id).eq("status", "revoked");
    if (error?.code === "23505") failed.push(`${v.voucher_code}: ${v.assigned_email} already holds an active voucher for this certification`);
    else if (error) throw new Error(`reactivate: ${error.message}`);
    else done.push({ id: v.id, code: v.voucher_code, status: to });
  }
  if (done.length) await audit(svc, actor, "company", companyId, "reactivate_vouchers", { vouchers: done, seats_added: grown });
  if (!done.length) throw new HttpError(409, failed.join("; "));
  return failed;
}

async function setVoucher(svc: Svc, actor: string, companyId: string, body: Body) {
  const id = body.voucher_id?.trim() ?? "";
  if (!UUID_RE.test(id)) throw new HttpError(400, "valid voucher_id required");
  const [v] = await loadVouchers(svc, companyId, [id]);
  if (!v) throw new HttpError(404, "voucher not found for this company");
  const patch: Record<string, unknown> = {};
  if ("attempts_allowed" in body) patch.attempts_allowed = attemptsOf(body.attempts_allowed, "attempts_allowed");
  if (body.expires_at !== undefined) patch.expires_at = dateOf(body.expires_at, "expires_at");
  if (!Object.keys(patch).length) throw new HttpError(400, "nothing to change");

  const now = new Date().toISOString();
  if (v.status !== "revoked" && "attempts_allowed" in patch) {
    const pool = v.batch_id
      ? (await svc.from("seat_batches").select("attempts_per_seat").eq("id", v.batch_id).maybeSingle()).data
      : null;
    const alloc = v.company_certification_id ? (await allocTermsOf(svc, companyId)).get(v.company_certification_id) : undefined;
    const to = liveStatus(v, allowanceFrom(patch.attempts_allowed as number | null, pool, alloc));
    if (to !== v.status) {
      patch.status = to;
      patch.redeemed_at = to === "redeemed" ? v.redeemed_at ?? now : null;
    }
  }
  const { error } = await svc.from("vouchers").update({ ...patch, updated_at: now }).eq("id", v.id);
  if (error?.code === "23505") throw new HttpError(409, `${v.assigned_email} already holds an active voucher for this certification`);
  if (error) throw new Error(`voucher update: ${error.message}`);
  await audit(svc, actor, "company", companyId, "set_voucher_terms", {
    voucher_id: v.id, code: v.voucher_code, email: v.assigned_email,
    before: { attempts_allowed: v.attempts_allowed, expires_at: v.expires_at, status: v.status }, after: patch,
  });
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

    let warnings: string[] = [];
    switch (body.action) {
      case "get": break;
      case "set_pool": await setPool(svc, actor, companyId, body); break;
      case "revoke": await revoke(svc, actor, companyId, body); break;
      case "reactivate": warnings = await reactivate(svc, actor, companyId, body); break;
      case "set_voucher": await setVoucher(svc, actor, companyId, body); break;
      default: throw new HttpError(400, "action must be get, set_pool, revoke, reactivate or set_voucher");
    }
    return jsonResponse({ ...(await state(svc, companyId)), warnings });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
