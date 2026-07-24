// supabase/functions/_shared/vouchers.ts
//
// Shared voucher logic: code generation, eligibility resolution, atomic
// consumption. Used by generate-mock-exam (consume at start),
// get-exam-eligibility (read), revoke-credential (cascade), assign-voucher.
//
// ATTEMPT ALLOWANCE RESOLUTION (post seat-batches refactor):
//   1. voucher.attempts_allowed (per-voucher override) — wins if set
//   2. the voucher's BATCH attempts_per_seat (partner vouchers cut from a batch)
//   3. legacy fallback: company_certifications.attempts_per_seat (vouchers not
//      yet relinked to a batch — defensive; migration should have set batch_id)
//   4. no allocation + no override → 1 (safest; never accidental unlimited)
//   NULL anywhere in 1–3 means UNLIMITED.
//
// UNLIMITED is a per-seat license: it can be assigned (1 seat → 1 person) but
// is NEVER a top-up source (that would let one purchased seat grant infinite
// attempts to infinite people). Top-up (future) must draw only from FINITE
// batches. This file doesn't implement top-up, but resolveAllowance treats
// unlimited correctly: NULL allowance = unlimited for that one voucher holder.

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
  batch_id: string | null;
  company_certification_id: string | null;
  company_id: string | null;
}

/**
 * Resolve the effective attempt allowance for a voucher. NULL = unlimited.
 *
 * Order: per-voucher override → batch terms → legacy allocation terms → 1.
 */
async function resolveAllowance(
  svc: SupabaseClient,
  v: VoucherRow,
): Promise<number | null> {
  // 1. Per-voucher override wins (B2C vouchers carry this).
  if (v.attempts_allowed !== null && v.attempts_allowed !== undefined) {
    return v.attempts_allowed;
  }

  // 2. Batch terms (the normal partner path post-refactor).
  if (v.batch_id) {
    const { data: batch } = await svc
      .from("seat_batches")
      .select("attempts_per_seat")
      .eq("id", v.batch_id)
      .maybeSingle();
    if (batch) {
      // attempts_per_seat NULL = unlimited.
      return batch.attempts_per_seat ?? null;
    }
  }

  // 3. Legacy fallback: allocation terms (voucher not yet relinked to a batch).
  if (v.company_certification_id) {
    const { data: alloc } = await svc
      .from("company_certifications")
      .select("attempts_per_seat")
      .eq("id", v.company_certification_id)
      .maybeSingle();
    if (alloc) return alloc.attempts_per_seat ?? null;
  }

  // 4. No allocation, no override, no batch → single attempt (never unlimited
  //    by accident).
  return 1;
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
  const { data: rows } = await svc
    .from("vouchers")
    .select(
      "id, status, attempts_allowed, attempts_used, batch_id, company_certification_id, company_id",
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
 *   - seat usage counter incremented (on the batch if present, else the legacy
 *     allocation) — convenience counter; the voucher attempt is source of truth
 *
 * Optimistic-lock against double-spend: conditional update matching the exact
 * attempts_used we read; 0 rows affected = lost the race, retry once.
 */
/**
 * Does this EMAIL already hold a USABLE seat for this certification?
 *
 * "Usable" means an `assigned` voucher with attempts remaining. This is the
 * double-assign guard for assign-voucher, and it is deliberately narrower than
 * "has any voucher".
 *
 * WHY IT MATTERS: status 'redeemed' does NOT mean the candidate passed - see
 * consumeAttempt below, which flips a voucher to 'redeemed' the moment its
 * allowance is EXHAUSTED. Blocking on 'redeemed' therefore refused a new seat to
 * precisely the person who needs one: someone who used their attempts and wants
 * to buy more. That is a legitimate, revenue-generating purchase, and under the
 * published re-examination policy it is how a retake is issued.
 *
 * 'revoked' does not block (already the case). 'available' does not block: an
 * available voucher is by definition unassigned, so an assigned_email on one is
 * vestigial data rather than a held seat.
 *
 * Works by EMAIL, not user id, because a seat can be assigned before the person
 * has ever signed up.
 */
export async function hasUsableVoucherByEmail(
  svc: SupabaseClient,
  email: string,
  certificationId: string,
): Promise<{ blocked: false } | { blocked: true; voucher_code: string; attempts_remaining: number | null }> {
  const { data: rows } = await svc
    .from("vouchers")
    .select(
      "id, voucher_code, status, attempts_allowed, attempts_used, batch_id, company_certification_id, company_id",
    )
    .ilike("assigned_email", email)
    .eq("certification_id", certificationId)
    .eq("status", "assigned");

  for (const row of (rows ?? []) as (VoucherRow & { voucher_code: string })[]) {
    const allowance = await resolveAllowance(svc, row);
    if (allowance === null) {
      // Unlimited: always a usable seat.
      return { blocked: true, voucher_code: row.voucher_code, attempts_remaining: null };
    }
    const remaining = allowance - row.attempts_used;
    if (remaining > 0) {
      return { blocked: true, voucher_code: row.voucher_code, attempts_remaining: remaining };
    }
  }
  return { blocked: false };
}

export async function consumeAttempt(
  svc: SupabaseClient,
  userId: string,
  certificationId: string,
): Promise<{ voucher_id: string } | null> {
  for (let retry = 0; retry < 2; retry++) {
    const elig = await getEligibility(svc, userId, certificationId);
    if (!elig.has_voucher || !elig.voucher_id) return null;

    const { data: v } = await svc
      .from("vouchers")
      .select(
        "id, status, attempts_allowed, attempts_used, batch_id, company_certification_id, company_id, redeemed_at",
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

    // Seat accounting (best-effort convenience counter). Prefer the batch; fall
    // back to the legacy allocation column. A failure here does NOT unwind the
    // consume — the voucher attempt is the source of truth.
    if (v.batch_id) {
      // seat_batches has no seats_used column by design (usage is derived from
      // vouchers); nothing to increment here. The voucher attempt is the record.
      // Legacy allocation counter kept in sync below if present.
    }
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
