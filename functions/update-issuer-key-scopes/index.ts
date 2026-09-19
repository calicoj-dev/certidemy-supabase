// functions/update-issuer-key-scopes/index.ts
//
// Change the scopes on an EXISTING issuer API key.
//
// ===================== WHY THIS EXISTS =====================
//
// `get_rubric` refuses an unscoped caller with "this tool needs a key scoped
// courseware:rubric, requested from the certification body". That instruction
// named an operation with NO IMPLEMENTATION ON EITHER SIDE: a partner could ask
// for the scope, and the only way to grant it was to mint a NEW key and make
// them replace the old one everywhere it was configured.
//
// A refusal that tells someone to do something impossible is worse than a
// refusal that says no. This is the operation the message already promised.
//
// ===================== WHY NOT JUST MINT A NEW KEY =====================
//
// Because the key is deployed. A partner has it in a CI secret, an MCP client
// config, or a server environment variable. "Here is a new key, replace it
// everywhere" is a rotation, and a rotation to ADD a capability is a change
// with an outage in it. Rotation stays available -- create-issuer-api-key and
// revoke-issuer-api-key are both live -- and is the right answer when a key is
// suspected compromised. It is the wrong answer to "please also let me read the
// rubric".
//
// ===================== THIS IS A PRIVILEGE SURFACE =====================
//
// It can add `credentials:issue` to a key that did not have it, which is the
// power to mint credentials under a partner's signature. Everything below is
// arranged around that:
//
//   - requireIssuerAccess, exactly as create-issuer-api-key uses it. A
//     team_admin at company A holding the role is NOT permission to widen a key
//     belonging to company B's issuer.
//   - The vocabulary is `isApiScope` from _shared/api-scopes.ts, so this cannot
//     be the fourth hand-typed list. The database CHECK refuses anything that
//     slips past, as a 23514 this function reports as a 409 naming the scope
//     rather than a 500.
//   - A REVOKED or EXPIRED key is refused. Widening a dead key writes a
//     permission nobody can see in the console and nobody can use, which is the
//     worst of both: an audit row implying a grant that does not exist.
//   - admin_actions records the BEFORE and the AFTER. "Scopes changed" without
//     the previous value cannot answer the only question an auditor asks, which
//     is what it used to be.
//
// ===================== WHAT IT DOES NOT DO =====================
//
// It does not bypass entitlement. A scope on a key says what the KEY may
// attempt; `mcp.feature_status` says whether the COMPANY may, and
// courseware-read consults it on every paid call. Adding `courseware:rubric` to
// a key whose company has no rubric entitlement produces a key that still gets
// refused -- correctly, and by a different gate. The two are separate on
// purpose and this function touches only the first.
//
// It does not create keys and it does not revoke them. Those are
// create-issuer-api-key and revoke-issuer-api-key.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";
import { requireIssuerAccess } from "../_shared/authorize.ts";
import { API_SCOPE_NAMES, isApiScope, rejectScope } from "../_shared/api-scopes.ts";

interface Body {
  key_id?: string;
  scopes?: string[];
  reason?: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  try {
    const actor = await authenticate(req);
    const svc = getServiceClient();
    const body = (await req.json()) as Body;

    const keyId = body.key_id?.trim();
    if (!keyId || !UUID_RE.test(keyId)) {
      throw new HttpError(400, "valid key_id required");
    }

    // ABSENT IS NOT EMPTY. `scopes: []` is a caller asking to remove every
    // scope, which is legitimate -- it is how a key is neutered without being
    // revoked -- and is very different from forgetting the field. An omitted
    // field must not be read as "set to nothing".
    if (!Array.isArray(body.scopes)) {
      throw new HttpError(
        400,
        "scopes must be an array. Send the COMPLETE new set, not the ones to " +
          `add: this replaces, it does not merge. Valid: ${API_SCOPE_NAMES.join(", ")}`,
      );
    }
    const scopes = [...new Set(body.scopes.map((s) => String(s).trim()).filter(Boolean))].sort();
    const badScope = scopes.find((s) => !isApiScope(s));
    if (badScope) throw new HttpError(400, rejectScope(badScope));

    const { data: key, error: kErr } = await svc
      .from("issuer_api_keys")
      .select("id, issuer_id, name, key_prefix, scopes, environment, revoked_at, expires_at")
      .eq("id", keyId)
      .maybeSingle();
    if (kErr) throw new Error(`key lookup: ${kErr.message}`);
    if (!key) throw new HttpError(404, "API key not found");

    if (key.revoked_at) {
      throw new HttpError(
        409,
        `key ${key.key_prefix} was revoked on ${String(key.revoked_at).slice(0, 10)}. ` +
          "Widening a revoked key writes a permission nobody can use and an audit " +
          "row implying a grant that does not exist. Mint a new key instead.",
      );
    }
    if (key.expires_at && new Date(key.expires_at).getTime() <= Date.now()) {
      throw new HttpError(
        409,
        `key ${key.key_prefix} expired on ${String(key.expires_at).slice(0, 10)}.`,
      );
    }

    const { data: issuer, error: iErr } = await svc
      .from("issuers")
      .select("id, slug, name, status")
      .eq("id", key.issuer_id)
      .maybeSingle();
    if (iErr) throw new Error(`issuer lookup: ${iErr.message}`);
    if (!issuer) throw new HttpError(404, "issuer not found");

    // THE ONLY THING BETWEEN A VALID JWT AND ANOTHER ORGANISATION'S KEY.
    await requireIssuerAccess(svc, actor, issuer.id);

    const before: string[] = [...(key.scopes ?? [])].sort();
    const unchanged = before.length === scopes.length &&
      before.every((s, i) => s === scopes[i]);

    // IDEMPOTENT, AND IT SAYS SO. A no-op that reports success is
    // indistinguishable from a change, and the console would show "updated" for
    // a request that did nothing. It also writes no audit row: an admin_actions
    // entry recording a change that did not happen is noise in the one place
    // that must not have any.
    if (unchanged) {
      return jsonResponse({
        key_id: key.id,
        key_prefix: key.key_prefix,
        issuer: { id: issuer.id, slug: issuer.slug },
        scopes_before: before,
        scopes_after: before,
        changed: false,
        note: "already exactly these scopes; nothing written",
      });
    }

    const { data: updated, error: uErr } = await svc
      .from("issuer_api_keys")
      .update({ scopes })
      .eq("id", key.id)
      // NOT REVOKED IN THE PREDICATE TOO, not just checked above. Between the
      // read and the write someone may have revoked it in the console, and a
      // widened revoked key is precisely what the 409 exists to prevent.
      .is("revoked_at", null)
      .select("id, key_prefix, scopes")
      .maybeSingle();

    if (uErr) {
      // 23514 is issuer_api_keys_scope_vocab. isApiScope should have caught it,
      // so reaching here means the two lists disagree -- report the scope, not
      // a 500, because the next person needs to know WHICH one.
      if ((uErr as { code?: string }).code === "23514") {
        throw new HttpError(
          409,
          `the database refused these scopes: ${scopes.join(", ")}. The function's ` +
            "vocabulary and issuer_api_keys_scope_vocab disagree -- see " +
            "functions/_shared/api-scopes.ts.",
        );
      }
      console.error("scope update failed", uErr);
      throw new HttpError(500, "failed to update key scopes");
    }
    if (!updated) {
      throw new HttpError(409, "the key was revoked while this request was in flight");
    }

    const added = scopes.filter((s) => !before.includes(s));
    const removed = before.filter((s) => !scopes.includes(s));

    await svc.from("admin_actions").insert({
      actor_user_id: actor,
      action: "update_issuer_key_scopes",
      target_type: "issuer_api_key",
      target_id: key.id,
      reason: body.reason?.trim() || null,
      // THE PREFIX ONLY, never the key or the hash -- admin_actions is read by
      // more people than issuer_api_keys is. And BOTH sides of the change: an
      // audit row that records only the new value cannot answer the question an
      // auditor actually asks.
      metadata: {
        issuer_slug: issuer.slug,
        key_prefix: key.key_prefix,
        name: key.name,
        environment: key.environment,
        scopes_before: before,
        scopes_after: scopes,
        added,
        removed,
      },
    });

    console.log(JSON.stringify({
      fn: "update-issuer-key-scopes",
      key_prefix: key.key_prefix,
      issuer: issuer.slug,
      added,
      removed,
    }));

    return jsonResponse({
      key_id: updated.id,
      key_prefix: updated.key_prefix,
      issuer: { id: issuer.id, slug: issuer.slug, name: issuer.name },
      scopes_before: before,
      scopes_after: updated.scopes,
      added,
      removed,
      changed: true,
      // The key itself is NOT reissued and does not change. Said explicitly
      // because the obvious fear on reading "scopes updated" is that the
      // deployed secret just stopped working.
      key_unchanged: true,
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
