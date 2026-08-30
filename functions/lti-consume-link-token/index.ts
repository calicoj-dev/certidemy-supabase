// POST /functions/v1/lti-consume-link-token
//
// Closes door two: links the LMS identity a launch could not seat to the
// account the student has just created.
//
// ============================== WHY DOOR TWO NEEDS THIS AT ALL ============
//
// LTI-PHASE-2.md section 3 said the student signs up and "this launch links by
// sub". There is nothing for sub to link TO -- the next launch presents a sub,
// finds no lti_users row, has no email, and has no way to know this is the
// person who just signed up. As written that was one door and a loop.
//
// So the launch mints a token, the breakout carries it to signup, and this
// consumes it once an account exists.
//
// ============================== IT TAKES BOTH, AND THAT IS THE POINT ======
//
// THE TOKEN PROVES SOMEONE LAUNCHED FROM THAT LMS.
// THE SESSION PROVES THEY OWN THIS ACCOUNT.
// LINKING REQUIRES BOTH.
//
// A token-only variant was considered and rejected: it fits the flow, needs no
// session, and would let whoever holds the token attach that student's FUTURE
// LAUNCHES to an address they control. The victim would keep launching from
// their course and keep landing in somebody else's account, and it would look
// like a working integration from every angle. The session is what makes the
// claim "I am (platform_id, sub)" also require "and this is my account".
//
// That is why verify_jwt = true here is a real boundary, unlike the one
// proposed for the provisioner (LTI-PHASE-2.md section 10, item 5). There the
// only credential past the gate was the service-role key, which can do the same
// work directly. Here the gate establishes WHICH USER, and the whole operation
// is defined relative to that answer.
//
// ============================== THE TOKEN IS HELD HASHED ==================
//
// lti_link_tokens.token_sha256, never the token. A database read does not yield
// a usable capability. Single use via consumed_at, and 24 hours via expires_at
// -- long enough to sign up and come back, short enough that an abandoned one
// is not a standing capability (migration 262).

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ ok: false, reason: "method" }, 405);

  let userId: string;
  try {
    userId = await authenticate(req);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 401;
    return jsonResponse({ ok: false, reason: "unauthorized" }, status);
  }

  const body = (await req.json().catch(() => ({}))) as { token?: string };
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) return jsonResponse({ ok: false, reason: "no_token" }, 400);

  const svc = getServiceClient();

  // Look up by HASH. The caller sends the token; we never store or log it.
  const { data: row, error: rErr } = await svc
    .from("lti_link_tokens")
    .select("id, platform_id, deployment_id, sub, expires_at, consumed_at")
    .eq("token_sha256", await sha256Hex(token))
    .maybeSingle();

  if (rErr) {
    console.error("link token lookup failed", rErr.message);
    return jsonResponse({ ok: false, reason: "lookup_failed" }, 500);
  }

  // UNKNOWN, CONSUMED AND EXPIRED ARE DELIBERATELY THE SAME ANSWER OUTWARD.
  // Distinguishing them would tell a caller whether a token they hold was ever
  // real, which is a probing oracle over a table keyed by a secret. The
  // difference is inward only, in the log line. Same instinct as
  // nonce_not_found and nonce_consumed being indistinguishable in lti-launch.
  const now = Date.now();
  if (!row) {
    console.log("link token: unknown");
    return jsonResponse({ ok: false, reason: "not_usable" }, 400);
  }
  if (row.consumed_at) {
    console.log(`link token ${row.id}: already consumed`);
    return jsonResponse({ ok: false, reason: "not_usable" }, 400);
  }
  if (new Date(row.expires_at).getTime() < now) {
    console.log(`link token ${row.id}: expired`);
    return jsonResponse({ ok: false, reason: "not_usable" }, 400);
  }

  // The link. No timestamp is sent -- migration 263's trigger owns
  // last_seen_at, and first_seen_at takes the column default, so both come from
  // Postgres's clock. Sending one from here is the two-clock defect that
  // produced a row describing one event as having ended before it began.
  const { error: lErr } = await svc
    .from("lti_users")
    .upsert(
      { platform_id: row.platform_id, sub: row.sub, user_id: userId },
      { onConflict: "platform_id,sub" },
    );

  if (lErr) {
    console.error("lti_users link failed", lErr.message);
    return jsonResponse({ ok: false, reason: "link_failed" }, 500);
  }

  // CONSUME AFTER LINKING, not before. Consuming first and then failing to link
  // would burn the token and leave the student unlinked with nothing to retry
  // with -- the same ordering lti-launch uses for its nonce, and for the same
  // reason: the irreversible step goes last.
  await svc
    .from("lti_link_tokens")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", row.id)
    .then(undefined, () => {});

  console.log(`link token ${row.id}: linked platform ${row.platform_id} sub -> user ${userId}`);
  return jsonResponse({ ok: true });
});
