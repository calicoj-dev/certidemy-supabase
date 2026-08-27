// POST /functions/v1/update-lti-platform
//
// Body: { id, name?, iss?, client_id?, auth_login_url?, auth_token_url?,
//         jwks_url?, company_id?, skew_tolerance_seconds?, status? }
// Auth: Bearer JWT -- MUST be platform_admin.
//
// Corrects a registration. The mirror of create-lti-platform, sharing its
// validators from _shared/lti-registration.ts.
//
// ============================== WHY IT EXISTS ============================
//
// It has already cost us once. Registering against the 1EdTech reference
// implementation, `iss` was predicted rather than read, and the fix -- a
// one-word correction to one column -- needed raw SQL against production
// because there was no edit path. That is a bad way to change the row that
// decides who may initiate a login into us: no validation, no actor, no
// admin_actions entry, and nothing stopping a WHERE clause from matching more
// rows than intended.
//
// ============================== ONLY SUPPLIED FIELDS CHANGE ==============
//
// Presence of the KEY is the intent, not its value. `"company_id" in body`
// distinguishes "clear it" (null) from "leave it alone" (absent), which a
// falsy check cannot -- and company_id is nullable, so that distinction is
// load-bearing rather than theoretical.
//
// A request naming no editable field is refused. A request whose fields all
// match what is already stored returns ok with an empty `changed` list and
// WRITES NO admin_actions ROW: an audit trail where half the entries record
// nothing having happened is one nobody reads carefully.
//
// ============================== EDITING iss OR client_id ORPHANS NOTHING ==
//
// The instinct is that correcting an issuer strands the history under the old
// one. It does not, and this was verified against information_schema on
// 2026-08-27 rather than assumed:
//
//   lti_deployments        platform_id
//   lti_capabilities       platform_id
//   lti_nonces             platform_id
//   lti_launch_sessions    platform_id
//   lti_launch_skeleton    platform_id
//   lti_launch_evidence    platform_id
//
// NO child table stores iss or client_id. Every one of them keys on
// platform_id, which this function never changes. A corrected issuer keeps its
// deployments, its observed capabilities and its entire launch history.
//
// What DOES change is which inbound launches match: lti-login looks the
// registration up by (iss, client_id). That is the point of the edit.
//
// ============================== product_family_code IS CLEARED ===========
//
// Not editable, and actively wiped when iss or client_id CHANGES.
//
// It is DISCOVERED -- lti-launch writes it from tool_platform in a verified
// token. An admin-typed value would be a guess wearing the same column as an
// observation, which is why create refuses to set it either.
//
// But changing the issuer may well mean a different platform, and a discovered
// value that outlives the thing it described is worse than an empty one: it
// reads as an observation and is a leftover. Absent is honest, and the next
// launch rediscovers it in one round trip. Cleared only on a real change, not
// on a request that merely names iss with the same value.
//
// ============================== WHAT DEACTIVATION ACTUALLY EXERCISES =====
//
// status = 'inactive' takes a registration out of service, and it is worth
// being exact about which never-run refusal it reaches, because it is NOT the
// obvious one.
//
//   lti-login:134   .eq("status", "active") in the lookup.
//                   THIS is what a deactivated platform hits. The row simply
//                   does not match, so login answers `unregistered_platform`
//                   with error_code `no_such_iss` / `no_such_iss_client`, 404,
//                   and OIDC never starts. Never run before now either -- so
//                   deactivating does exercise a written-and-untested path,
//                   just this one.
//
//   lti-launch:281  `if (platform.status !== "active") -> platform_inactive`.
//                   NOT reached by deactivating, because login refuses first
//                   and there is no launch without a login. It stays reachable
//                   only in one narrow window: a platform switched off BETWEEN
//                   a successful login and the launch POST that follows it.
//                   Written, correct, and still untested. Do not claim
//                   otherwise.
//
// AND A KNOWN WRONG CONSEQUENCE, recorded here because this is the function
// that causes it: lti-login writes its refusal skeleton row with
// platform_id NULL, so a deactivated registration's refused launches land in
// the console's orphan list under "Launches from platforms we have not
// registered". That is wrong for a platform we HAVE registered and
// deliberately switched off, and it will read to an operator as a stranger
// knocking. Not fixed here -- fixing it means lti-login distinguishing "no
// such registration" from "registered but inactive", which is a change to the
// refusal vocabulary and to what the console renders.
//
// ============================== 409, SAME SHAPE AS CREATE ================
//
// The (iss, client_id) pre-check exists for a USEFUL message naming the row
// already holding the pair. The unique index lti_platforms_iss_client_unique
// is the real guard -- two admins editing at once is exactly the race a
// check-then-write loses -- so 23505 is caught below and mapped to the same
// answer. The pre-check excludes THIS row, or every no-op save would 409
// against itself.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";
import {
  httpsUrl,
  isPlatformStatus,
  issuerId,
  PLATFORM_STATUSES,
  requiredText,
  skewSeconds,
  UUID_RE,
} from "../_shared/lti-registration.ts";

interface Body {
  id?: string;
  name?: string;
  iss?: string;
  client_id?: string;
  auth_login_url?: string;
  auth_token_url?: string;
  jwks_url?: string;
  company_id?: string | null;
  skew_tolerance_seconds?: number | null;
  status?: string;
}

/** The columns this function may write. product_family_code is not among them. */
type Patch = {
  name?: string;
  iss?: string;
  client_id?: string;
  auth_login_url?: string;
  auth_token_url?: string;
  jwks_url?: string;
  company_id?: string | null;
  skew_tolerance_seconds?: number;
  status?: string;
  product_family_code?: null;
};

interface CurrentRow {
  id: string;
  iss: string;
  client_id: string;
  name: string;
  auth_login_url: string;
  auth_token_url: string;
  jwks_url: string;
  company_id: string | null;
  product_family_code: string | null;
  skew_tolerance_seconds: number;
  status: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  try {
    const actor = await authenticate(req);
    const svc = getServiceClient();

    const { data: actorProfile } = await svc
      .from("profiles")
      .select("platform_role")
      .eq("id", actor)
      .maybeSingle();
    if (!actorProfile || actorProfile.platform_role !== "platform_admin") {
      throw new HttpError(403, "platform_admin required");
    }

    const body = (await req.json().catch(() => ({}))) as Body;

    const id = body.id?.trim();
    if (!id || !UUID_RE.test(id)) throw new HttpError(400, "id must be a uuid");

    /* ---- load the row FIRST -------------------------------------------- */
    // Needed three times over: to refuse a missing id before validating
    // anything, to compute a real diff rather than a list of submitted fields,
    // and to decide whether iss/client_id actually CHANGED.
    // ONE UNBROKEN LITERAL -- a concatenated select collapses the row type.
    const { data: current, error: loadErr } = await svc
      .from("lti_platforms")
      .select("id, iss, client_id, name, auth_login_url, auth_token_url, jwks_url, company_id, product_family_code, skew_tolerance_seconds, status")
      .eq("id", id)
      .maybeSingle();

    if (loadErr) {
      console.error("lti_platforms load failed", loadErr);
      throw new HttpError(500, "failed to read the registration");
    }
    if (!current) throw new HttpError(404, "registration not found");
    const row = current as CurrentRow;

    /* ---- validate EVERYTHING before writing anything -------------------- */
    // A refusal past this point must leave the row exactly as it was.
    const patch: Patch = {};
    const has = (k: keyof Body) => Object.hasOwn(body, k);

    if (has("name")) patch.name = requiredText(body.name, "name");
    if (has("iss")) patch.iss = issuerId(body.iss);
    if (has("client_id")) {
      patch.client_id = requiredText(body.client_id, "client_id");
    }
    if (has("auth_login_url")) {
      patch.auth_login_url = httpsUrl(body.auth_login_url, "auth_login_url");
    }
    if (has("auth_token_url")) {
      patch.auth_token_url = httpsUrl(body.auth_token_url, "auth_token_url");
    }
    if (has("jwks_url")) {
      patch.jwks_url = httpsUrl(body.jwks_url, "jwks_url");
    }

    if (has("company_id")) {
      // null CLEARS. Absent would have left it alone -- see the header.
      if (body.company_id === null || body.company_id === "") {
        patch.company_id = null;
      } else {
        const companyId = String(body.company_id).trim();
        if (!UUID_RE.test(companyId)) {
          throw new HttpError(400, "company_id must be a uuid");
        }
        const { data: company } = await svc
          .from("companies")
          .select("id")
          .eq("id", companyId)
          .maybeSingle();
        if (!company) throw new HttpError(404, "company not found");
        patch.company_id = companyId;
      }
    }

    if (has("skew_tolerance_seconds")) {
      if (
        body.skew_tolerance_seconds === null ||
        body.skew_tolerance_seconds === undefined
      ) {
        // Explicitly refused rather than quietly meaning "default". A blank
        // clock tolerance on an EDIT form is ambiguous in a way it is not on a
        // create form, where absent plainly means "I did not set one".
        throw new HttpError(
          400,
          "skew_tolerance_seconds must be a number, or omit the field to leave it unchanged",
        );
      }
      patch.skew_tolerance_seconds = skewSeconds(
        body.skew_tolerance_seconds,
        "skew_tolerance_seconds",
      );
    }

    if (has("status")) {
      const status = body.status?.trim();
      if (!isPlatformStatus(status)) {
        throw new HttpError(
          400,
          `status must be one of ${PLATFORM_STATUSES.join(", ")}`,
        );
      }
      patch.status = status;
    }

    if (Object.keys(patch).length === 0) {
      throw new HttpError(400, "no editable field was supplied");
    }

    /* ---- the real diff, against stored values --------------------------- */
    const changed: string[] = [];
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      const currentValue = (row as unknown as Record<string, unknown>)[k];
      if (currentValue === v) continue;
      changed.push(k);
      before[k] = currentValue;
      after[k] = v;
    }

    if (changed.length === 0) {
      // Everything submitted already matched. Nothing written, nothing audited.
      return jsonResponse({
        ok: true,
        changed: [],
        platform: {
          id: row.id,
          iss: row.iss,
          client_id: row.client_id,
          name: row.name,
          status: row.status,
        },
      });
    }

    /* ---- clearing the discovered vendor name ---------------------------- */
    // Only on a REAL change of identity, and only when there is something to
    // clear. See the header.
    const identityChanged = changed.includes("iss") ||
      changed.includes("client_id");
    const clearedProductFamily = identityChanged &&
      row.product_family_code !== null;
    if (clearedProductFamily) {
      patch.product_family_code = null;
      changed.push("product_family_code");
      before.product_family_code = row.product_family_code;
      after.product_family_code = null;
    }

    /* ---- 409 pre-check, excluding this row ------------------------------ */
    if (identityChanged) {
      const nextIss = patch.iss ?? row.iss;
      const nextClientId = patch.client_id ?? row.client_id;
      // ONE UNBROKEN LITERAL.
      const { data: clash } = await svc
        .from("lti_platforms")
        .select("id, name")
        .eq("iss", nextIss)
        .eq("client_id", nextClientId)
        .neq("id", id)
        .maybeSingle();
      if (clash) {
        throw new HttpError(
          409,
          `another registration already uses this issuer and client_id ("${clash.name}")`,
        );
      }
    }

    /* ---- write ---------------------------------------------------------- */
    // updated_at is handled by the lti_platforms_updated_at trigger (253),
    // not set here -- a timestamp written by hand is one that can disagree.
    const { data: updated, error: updErr } = await svc
      .from("lti_platforms")
      .update(patch)
      .eq("id", id)
      .select("id, iss, client_id, name, status")
      .single();

    if (updErr || !updated) {
      const code = (updErr as { code?: string } | null)?.code;
      console.error("lti_platforms update failed", updErr);
      if (code === "23505") {
        throw new HttpError(
          409,
          "another registration already uses this issuer and client_id",
        );
      }
      if (code === "23514") {
        // migration 260's vocabulary CHECK. Unreachable through the validation
        // above, which is the point of having both.
        throw new HttpError(400, "status is not a value this platform accepts");
      }
      throw new HttpError(500, "failed to update the registration");
    }

    await svc.from("admin_actions").insert({
      actor_user_id: actor,
      action: "update_lti_platform",
      target_type: "lti_platform",
      target_id: id,
      reason: null,
      metadata: {
        changed,
        before,
        after,
        // Recorded explicitly rather than left to be inferred from `changed`.
        // A cleared vendor name is a consequence of the edit that the operator
        // did not ask for, and the audit row should say so in its own words.
        product_family_code_cleared: clearedProductFamily,
      },
    });

    return jsonResponse({
      ok: true,
      changed,
      product_family_code_cleared: clearedProductFamily,
      platform: {
        id: updated.id,
        iss: updated.iss,
        client_id: updated.client_id,
        name: updated.name,
        status: updated.status,
      },
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
