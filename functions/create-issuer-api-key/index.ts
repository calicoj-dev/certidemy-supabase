// POST /functions/v1/create-issuer-api-key
//
// Body: { issuer_id, name, scopes?, environment?, expires_in_days? }
// Auth: Bearer JWT -- MUST be platform_admin.
//
// Mints the credential a partner's LMS, script or automation uses to call
// issue-partner-credential. issuer_api_keys has existed since migration 232
// and nothing has ever inserted into it.
//
// ============================== SHOWN ONCE =================================
//
// The key is returned in this response and never again. Only sha256(key) and a
// display prefix are stored, so there is no recovery path -- a partner who
// loses a key gets a new one. That is not an inconvenience to design around,
// it is the property that makes the stored row worthless to anyone who reads
// the database.
//
// ============================== THE PREFIX =================================
//
// key_prefix is stored plainly so a partner can tell two keys apart in a list
// without either being revealed. It is the first 8 random characters, which is
// enough to distinguish keys and far too little to guess one.
//
// ============================== ACTIVE ISSUERS ONLY ========================
//
// Migration 232's trg_guard_api_key_issuer refuses a key for a non-active
// issuer. Checked here too, for a 409 the caller can act on rather than a raw
// trigger exception.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";

interface Body {
  issuer_id?: string;
  name?: string;
  scopes?: string[];
  environment?: string;
  expires_in_days?: number;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SCOPES = new Set(["credentials:issue", "credentials:read", "achievements:read"]);

function hex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = new Uint8Array(new ArrayBuffer(data.length));
  buf.set(data);
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", buf)));
}

/** 256 bits. cdk = certidemy key. */
function mintKey(environment: string): { key: string; prefix: string } {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  const body = hex(b);
  const tag = environment === "test" ? "test" : "live";
  return { key: `cdk_${tag}_${body}`, prefix: `cdk_${tag}_${body.slice(0, 8)}` };
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

    const body = (await req.json()) as Body;
    const issuerId = body.issuer_id?.trim();
    const name = body.name?.trim();
    const environment = (body.environment ?? "live").trim();
    const scopes = Array.isArray(body.scopes) && body.scopes.length > 0
      ? body.scopes.map((s) => String(s).trim())
      : ["credentials:issue"];
    const expiresInDays = body.expires_in_days ?? null;

    if (!issuerId || !UUID_RE.test(issuerId)) {
      throw new HttpError(400, "valid issuer_id required");
    }
    if (!name) throw new HttpError(400, "name required (how this key will be identified)");
    if (environment !== "live" && environment !== "test") {
      throw new HttpError(400, 'environment must be "live" or "test"');
    }
    const badScope = scopes.find((s) => !SCOPES.has(s));
    if (badScope) throw new HttpError(400, `unknown scope "${badScope}"`);
    if (
      expiresInDays !== null &&
      (!Number.isInteger(expiresInDays) || expiresInDays < 1)
    ) {
      throw new HttpError(400, "expires_in_days must be a positive integer");
    }

    const { data: issuer, error: iErr } = await svc
      .from("issuers")
      .select("id, slug, name, status")
      .eq("id", issuerId)
      .maybeSingle();
    if (iErr) throw new Error(`issuer lookup: ${iErr.message}`);
    if (!issuer) throw new HttpError(404, "issuer not found");
    if (issuer.status !== "active") {
      throw new HttpError(
        409,
        `issuer "${issuer.slug}" is ${issuer.status}; a key for an issuer that ` +
          `cannot sign is a credential waiting to fail`,
      );
    }

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 86400_000).toISOString()
      : null;

    // Retry only on prefix collision, which is 1 in 4 billion and still worth
    // handling because the alternative is a 500 the caller cannot interpret.
    let created: { id: string; key_prefix: string; created_at: string } | null = null;
    let plainKey = "";
    for (let attempt = 0; attempt < 5 && !created; attempt++) {
      const { key, prefix } = mintKey(environment);
      const { data, error } = await svc
        .from("issuer_api_keys")
        .insert({
          issuer_id: issuerId,
          name,
          key_prefix: prefix,
          key_hash: await sha256Hex(key),
          scopes,
          environment,
          expires_at: expiresAt,
          created_by: actor,
        })
        .select("id, key_prefix, created_at")
        .single();

      if (!error && data) {
        created = data;
        plainKey = key;
        break;
      }
      if ((error as { code?: string } | null)?.code !== "23505") {
        console.error("api key insert failed", error);
        throw new HttpError(500, "failed to create API key");
      }
    }
    if (!created) throw new HttpError(500, "failed to create API key");

    await svc.from("admin_actions").insert({
      actor_user_id: actor,
      action: "create_issuer_api_key",
      target_type: "issuer_api_key",
      target_id: created.id,
      reason: null,
      // The PREFIX only. Never the key, and never the hash: admin_actions is
      // read by more people than the keys table is.
      metadata: {
        issuer_slug: issuer.slug,
        key_prefix: created.key_prefix,
        name,
        scopes,
        environment,
        expires_at: expiresAt,
      },
    });

    return jsonResponse({
      ok: true,
      // THE ONLY TIME THIS IS EVER RETURNED.
      api_key: plainKey,
      warning:
        "Store this now. It is not recoverable -- only its hash is kept. " +
        "If it is lost, revoke this key and mint another.",
      key: {
        id: created.id,
        prefix: created.key_prefix,
        name,
        scopes,
        environment,
        expires_at: expiresAt,
        created_at: created.created_at,
      },
      issuer: { id: issuer.id, slug: issuer.slug, name: issuer.name },
      usage: {
        endpoint: "https://pctynukndxnmnxiqpgck.supabase.co/functions/v1/issue-partner-credential",
        header: "x-certidemy-key",
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
