// POST /functions/v1/lti-mark-password-set
//
// Records that the caller now has a password they chose.
//
// ============================== IT GATES A MESSAGE, NOT ACCESS ============
//
// profiles.password_set decides whether the exam breakout says "set your
// Certidemy password to continue" instead of showing a bare login form for an
// account the student does not know they have (LTI-PHASE-2.md section 5).
//
// THE EXAM IS GATED BY LOGIN AND VOUCHER. Neither is affected by this column.
// So this function is safe to be callable by the user it describes: someone who
// calls it without having set a password has removed their own reminder and
// gained nothing -- they meet a login form instead of a helpful sentence.
//
// READING IT AS A SECURITY CONTROL IS THE MISTAKE THIS FEATURE KEEPS OFFERING.
// ALLOWED_TYPES reads as a defence and is intent. An unsubstituted claim reads
// as a value and is a variable name. *_sent_at reads as proof of an email and
// is token issuance. verify_jwt = true on a provisioner read as a boundary and
// refused strangers from doing what strangers already cannot do. This column is
// the fifth of that shape. See LTI-PHASE-2.md section 10.
//
// ============================== WHY A FUNCTION AT ALL =====================
//
// Migration 168 revoked the table-wide UPDATE on profiles and ENUMERATED the
// columns `authenticated` may write -- full_name, avatar_url, timezone, locale
// -- precisely so that "a column added to profiles later" fails closed.
// password_set is not in that list and MUST NOT BE ADDED to it: a user who can
// write the column directly can clear their own prompt without setting a
// password, and the grant is per-column, not per-value.
//
// So the write is made by code that is not the user, on the user's behalf,
// after their own session proved who they are.
//
// ============================== THE DIRECTION THAT MATTERS ================
//
// THE CORRECT DIRECTION FOR THIS COLUMN TO BE WRONG IS `false`.
//
// A false `false` shows a helpful message to somebody who did not need it.
// A false `true` tells somebody they have a password when they do not, and
// leaves them at a login form with no route through except guessing that
// "forgot password" is the answer -- which is the exact dead end section 5
// exists to remove.
//
// This function writes `true` only from the request that follows a successful
// auth.updateUser({ password }) in the same server action, which is the closest
// any code gets to observing the fact.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ ok: false, reason: "method" }, 405);

  let userId: string;
  try {
    // The caller's OWN session. verify_jwt = true means the gateway has already
    // refused anonymous callers; this establishes WHICH user, which is the part
    // that matters, because the update is scoped to exactly that id.
    userId = await authenticate(req);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 401;
    return jsonResponse({ ok: false, reason: "unauthorized" }, status);
  }

  const svc = getServiceClient();
  const { error } = await svc
    .from("profiles")
    .update({ password_set: true })
    .eq("id", userId);

  if (error) {
    console.error("password_set update failed", error.message);
    return jsonResponse({ ok: false, reason: "not_recorded" }, 500);
  }

  return jsonResponse({ ok: true });
});
