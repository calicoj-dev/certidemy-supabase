// supabase/functions/_shared/vouchers.ts
//
// Shared voucher logic: code generation, eligibility resolution, and atomic
// consumption. Used by generate-mock-exam (consume at start),
// get-exam-eligibility (read), and revoke-credential (cascade).
//
// "Attempts remaining" resolution order:
//   voucher.attempts_allowed (override)  ->  allocation.attempts_per_seat
//   ->  NULL means UNLIMITED.
//
// A voucher is REDEEMABLE for a real exam when:
//   status in ('assigned','redeemed-with-attempts-left' is not a status; we
//   model "redeemed" as exhausted) — concretely: status = 'assigned' AND
//   not revoked AND attempts remaining > 0 (or unlimited).
// On consumption we increment attempts_used; if the allowance is now
// exhausted we flip status -> 'redeemed'. Unlimited vouchers never flip.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface VoucherEligibility {
  has_voucher: boolean;
  voucher_id: string | null;
  attempts_remaining: number | null; // null = unlimited
  unlimited: boolean;
  source: "partner" | "b2c" | null;
}

/** Human-friendly voucher code, e.g. SM-I-V-7K2M-9DQ4 (no 0/O/1/I). */
export function makeVoucherCode(certCode: string): string {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const block = () =>
    Array.from(
      crypto.getRandomValues(new Uint8Array(4)),
      (b) => alphabet[b % alphabet.length],
    ).join("");
  return `${certCode.toUpperCase()}-V-${block()}-${block()}`;
}

interface VoucherRow {
  id: string;
  status: string;
  attempts_allowed: number | null;
  attempts_used: number;
  company_certification_id: string | null;
  company_id: string | null;
}

/**
 * Resolve the effective attempt allowance for a voucher.
 * Returns null for unlimited.
 */
async function resolveAllowance(
  svc: SupabaseClient,
  v: VoucherRow,
): Promise<number | null> {
  // Per-voucher override wins.
  if (v.attempts_allowed !== null && v.attempts_allowed !== undefined) {
    return v.attempts_allowed;
  }
  // Otherwise inherit the allocation policy. No allocation (B2C without one)
  // and no override -> treat as single attempt by default is NOT desired;
  // a standalone B2C voucher should carry its own attempts_allowed at
  // creation. If somehow neither is set, we fall back to 1 (safest: never
  // grant unlimited by accident).
  if (!v.company_certification_id) return 1;

  const { data: alloc } = await svc
    .from("company_certifications")
    .select("attempts_per_seat")
    .eq("id", v.company_certification_id)
    .maybeSingle();

  if (!alloc) return 1;
  // attempts_per_seat NULL = unlimited (negotiated deal).
  return alloc.attempts_per_seat ?? null;
}

/**
 * Find the best redeemable voucher for a user+cert and report attempts left.
 * Read-only — does not consume.
 */
export async function getEligibility(
  svc: SupabaseClient,
  userId: string,
  certificationId: string,
): Promise<VoucherEligibility> {
  // Candidate vouchers: assigned to this user, this cert, not revoked,
  // not exhausted. Prefer 'assigned' (active) rows; a 'redeemed' row is
  // exhausted by definition.
  const { data: rows } = await svc
    .from("vouchers")
    .select(
      "id, status, attempts_allowed, attempts_used, company_certification_id, company_id",
    )
    .eq("assigned_user_id", userId)
    .eq("certification_id", certificationId)
    .eq("status", "assigned")
    .order("created_at", { ascending: true });

  if (!rows || rows.length === 0) {
    return {
      has_voucher: false,
      voucher_id: null,
      attempts_remaining: 0,
      unlimited: false,
      source: null,
    };
  }

  // Pick the first with attempts remaining.
  for (const v of rows as VoucherRow[]) {
    const allowance = await resolveAllowance(svc, v);
    if (allowance === null) {
      return {
        has_voucher: true,
        voucher_id: v.id,
        attempts_remaining: null,
        unlimited: true,
        source: v.company_certification_id ? "partner" : "b2c",
      };
    }
    const remaining = allowance - v.attempts_used;
    if (remaining > 0) {
      return {
        has_voucher: true,
        voucher_id: v.id,
        attempts_remaining: remaining,
        unlimited: false,
        source: v.company_certification_id ? "partner" : "b2c",
      };
    }
  }

  // All assigned vouchers are exhausted.
  return {
    has_voucher: false,
    voucher_id: null,
    attempts_remaining: 0,
    unlimited: false,
    source: null,
  };
}

/**
 * Atomically consume one attempt from a user's redeemable voucher for a cert,
 * at exam START. Returns the consumed voucher id, or null if none eligible.
 *
 * Side effects on success:
 *   - vouchers.attempts_used += 1
 *   - if the allowance is now exhausted: status -> 'redeemed', redeemed_at set
 *   - company_certifications.seats_used += 1 (a seat is spent at exam start)
 *
 * Concurrency note: Supabase/PostgREST has no multi-statement transaction from
 * the client, so we guard against double-spend with a conditional update that
 * matches the exact attempts_used we read (optimistic lock). If the update
 * affects 0 rows, someone else consumed concurrently and we retry once.
 */
export async function consumeAttempt(
  svc: SupabaseClient,
  userId: string,
  certificationId: string,
): Promise<{ voucher_id: string } | null> {
  for (let retry = 0; retry < 2; retry++) {
    const elig = await getEligibility(svc, userId, certificationId);
    if (!elig.has_voucher || !elig.voucher_id) return null;

    // Re-read the exact row for the optimistic-lock value.
    const { data: v } = await svc
      .from("vouchers")
      .select(
        "id, status, attempts_allowed, attempts_used, company_certification_id, company_id, redeemed_at",
      )
      .eq("id", elig.voucher_id)
      .maybeSingle();
    if (!v) continue;

    const allowance = await resolveAllowance(svc, v as VoucherRow);
    const nextUsed = (v.attempts_used as number) + 1;
    const nowExhausted = allowance !== null && nextUsed >= allowance;

    const update: Record<string, unknown> = {
      attempts_used: nextUsed,
      updated_at: new Date().toISOString(),
    };
    if (nowExhausted) {
      update.status = "redeemed";
      update.redeemed_at = new Date().toISOString();
    }

    // Optimistic lock: only succeed if attempts_used is still what we read.
    const { data: updated, error: updErr } = await svc
      .from("vouchers")
      .update(update)
      .eq("id", v.id)
      .eq("attempts_used", v.attempts_used)
      .eq("status", "assigned")
      .select("id")
      .maybeSingle();

    if (updErr) {
      console.error("voucher consume update failed", updErr);
      return null;
    }
    if (!updated) {
      // Lost the race; retry once.
      continue;
    }

    // Seat accounting: a seat is spent at exam start. Best-effort increment
    // on the allocation (B2B only). A failure here doesn't unwind the
    // consume — the voucher attempt is the source of truth; seats_used is a
    // convenience counter the quota view also derives independently.
    if (v.company_certification_id) {
      const { data: alloc } = await svc
        .from("company_certifications")
        .select("seats_used")
        .eq("id", v.company_certification_id)
        .maybeSingle();
      if (alloc) {
        await svc
          .from("company_certifications")
          .update({ seats_used: (alloc.seats_used ?? 0) + 1 })
          .eq("id", v.company_certification_id);
      }
    }

    return { voucher_id: v.id };
  }
  return null;
}
