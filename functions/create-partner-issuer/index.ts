// POST /functions/v1/create-partner-issuer
//
// Body: { company_id, slug, name, site_url, verification_domain }
// Auth: Bearer JWT -- MUST be platform_admin.
//
// STEP ONE OF TWO. Creates a DRAFT issuer: the slug is reserved, a verification
// token is issued, and nothing can be signed. Keys are minted by
// activate-partner-issuer, and only after domain verification passes.
//
// ============================== WHY TWO STEPS ==============================
//
// Activation is irreversible. A signing key in Vault and a slug published in
// the OB3 namespace are permanent -- the slug appears inside every credential
// that issuer ever signs, and migration 230's trigger refuses to change it once
// status leaves 'draft'.
//
// A single switch that created the draft AND minted the key would make a
// mistyped slug permanent on one click. In draft, a mistake is a row you
// delete.
//
// ============================== WHY THE SLUG IS APPROVED ===================
//
// The partner proposes it -- it appears in every URL they print, so they should
// live with the string. But it is public, permanent, and sits one path segment
// from Certidemy's own. 'nike-official' and 'iso-certified' must not survive
// review, which is what the reserved list below is for. It is deliberately
// policy-shaped and will change more often than the schema, which is why it
// lives here and not in a CHECK constraint.
//
// ============================== WHAT THIS DOES NOT DO ======================
//
// No keys. No Vault. No status change. issuer_get_signing_key filters on
// is_active, which migration 230 derives from status='active', so a draft
// issuer cannot sign even if something later tries.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";

interface Body {
  company_id?: string;
  slug?: string;
  name?: string;
  site_url?: string;
  verification_domain?: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Mirrors issuers_slug_format in migration 230. Kept in step deliberately. */
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

/**
 * The OB3 identifier root. Every issuer shares it -- they are hosted here, and
 * the credential says so. What distinguishes them is the slug segment.
 */
const BASE_URL = "https://credentials.certidemy.com";

/**
 * Slugs that must never be issued.
 *
 * Three groups: our own identity, path segments the namespace already uses, and
 * words that imply accreditation. The last group is the one that matters --
 * 'iso-certified' as an issuer slug would put an accreditation claim inside the
 * identifier of every credential that partner signs, where no disclaimer on any
 * page can reach it.
 */
const RESERVED = new Set([
  "certidemy", "certiglobal", "rc-capital", "anthropic",
  "admin", "api", "app", "www", "mail", "status", "health",
  "issuer", "issuers", "credential", "credentials", "achievement",
  "achievements", "badge", "badges", "verify", "public", "static",
  "accredited", "accreditation", "iso", "iso-certified", "ansi", "ukas",
  "iaf", "official", "certified", "certification", "certifications",
  "17024", "iec",
]);

/** 256 bits of hex. Not a secret in the cryptographic sense -- it only has to
 *  be unguessable enough that nobody can pre-place the file. */
function verificationToken(): string {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
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
    const companyId = body.company_id?.trim();
    const slug = body.slug?.trim().toLowerCase();
    const name = body.name?.trim();
    const siteUrl = body.site_url?.trim();
    const domain = body.verification_domain?.trim().toLowerCase();

    if (!companyId || !UUID_RE.test(companyId)) {
      throw new HttpError(400, "valid company_id required");
    }
    if (!slug) throw new HttpError(400, "slug required");
    if (!SLUG_RE.test(slug)) {
      throw new HttpError(
        400,
        "slug must be 3-40 chars, lowercase letters, digits and hyphens, " +
          "starting and ending with a letter or digit",
      );
    }
    if (RESERVED.has(slug)) {
      throw new HttpError(400, `slug "${slug}" is reserved`);
    }
    if (!name) throw new HttpError(400, "name required");
    if (!siteUrl || !siteUrl.startsWith("https://")) {
      throw new HttpError(400, "site_url required and must be https");
    }
    if (!domain || !DOMAIN_RE.test(domain)) {
      throw new HttpError(400, "valid verification_domain required (host only, no scheme)");
    }

    // ---- the company must exist and must not already have an issuer -------
    const { data: company, error: coErr } = await svc
      .from("companies")
      .select("id, name")
      .eq("id", companyId)
      .maybeSingle();
    if (coErr) throw new Error(`company lookup: ${coErr.message}`);
    if (!company) throw new HttpError(404, "company not found");

    const { data: existing } = await svc
      .from("issuers")
      .select("id, slug, status")
      .eq("company_id", companyId)
      .maybeSingle();
    if (existing) {
      throw new HttpError(
        409,
        `company already has issuer "${existing.slug}" (${existing.status})`,
      );
    }

    // Checked here for a useful 409. The UNIQUE index is what actually
    // guarantees it -- two admins submitting the same slug at once is exactly
    // the race a check-then-insert loses.
    const { data: slugTaken } = await svc
      .from("issuers")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (slugTaken) throw new HttpError(409, `slug "${slug}" is taken`);

    const token = verificationToken();

    const { data: issuer, error: insErr } = await svc
      .from("issuers")
      .insert({
        slug,
        name,
        site_url: siteUrl,
        base_url: BASE_URL,
        issuer_url: `${BASE_URL}/issuers/${slug}`,
        company_id: companyId,
        status: "draft",
        verification_domain: domain,
        verification_token: token,
        // key_id defaults to 'key-1'. No key material: the CHECK added in 230
        // refuses status='active' without it, which is what keeps the two
        // steps honest.
      })
      .select("id, slug, name, issuer_url, status, verification_domain")
      .single();

    if (insErr || !issuer) {
      // 23505 is the UNIQUE index doing the job the pre-check cannot.
      const dup = (insErr as { code?: string } | null)?.code === "23505";
      console.error("issuer insert failed", insErr);
      throw new HttpError(
        dup ? 409 : 500,
        dup ? `slug "${slug}" is taken` : "failed to create issuer",
      );
    }

    await svc.from("admin_actions").insert({
      actor_user_id: actor,
      action: "create_partner_issuer",
      target_type: "issuer",
      target_id: issuer.id,
      reason: null,
      metadata: {
        slug: issuer.slug,
        company_id: companyId,
        company_name: company.name,
        verification_domain: domain,
      },
    });

    return jsonResponse({
      ok: true,
      issuer: {
        id: issuer.id,
        slug: issuer.slug,
        name: issuer.name,
        issuer_url: issuer.issuer_url,
        status: issuer.status,
      },
      // What the partner has to publish. The token is not secret; control of
      // the path is the proof, not knowledge of the string.
      verification: {
        domain,
        url: `https://${domain}/.well-known/certidemy-issuer.txt`,
        file_contents: token,
        instructions:
          `Serve a plain-text file at https://${domain}/.well-known/certidemy-issuer.txt ` +
          `containing exactly the token above, then run activate-partner-issuer.`,
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
