// POST /functions/v1/create-partner-achievement
//
// Body: { issuer_id, code, name, description, achievement_type?,
//         criteria_narrative?, criteria_url?, image_path?, tags?,
//         default_validity_days?, status?, alignments?, results? }
// Auth: Bearer JWT -- MUST be platform_admin.
//
// Defines what a partner issues. Until this exists there is nothing for a
// partner credential to point at: credentials.achievement_id is NOT NULL, and
// every achievement in the database is one of the eleven Certidemy schemes.
//
// ============================== THE RIGOR DIAL =============================
//
// achievement_type is the OB 3.0 field that machine-readably separates a
// certification decision from a course completion. A partner's "Scrum Boot
// Camp, 13-15 Aug" is a Course. SM-AI-I is a Certification.
//
// PARTNERS MAY SELECT ANY TYPE, INCLUDING Certification. Certidemy hosts their
// document; it does not accredit it. ISO/IEC 17024 binds Certidemy as a
// certification body for CERTIDEMY schemes, and a partner asserting their own
// certification under their own slug and their own key is their claim to
// defend, not ours.
//
// What is NOT permitted is a partner implying the claim is OURS. That is a
// naming rule, not a type restriction, and it is enforced below.
//
// certification_id is never settable here. Migration 231's trigger refuses to
// attach one to any issuer but certidemy anyway; this endpoint simply never
// offers the field.
//
// ============================== WHY PLATFORM_ADMIN ONLY ====================
//
// Partner self-service belongs in a partner portal, which does not exist yet:
// the console has exactly two surfaces, platform admin and learning. Adding a
// team_admin path now would be an authorization branch with no caller, and an
// unexercised authorization branch is worse than a missing feature.
//
// When the portal lands, the check to add is: actor is team_admin on the
// company that owns this issuer (issuers.company_id). Not "any team_admin".
//
// ============================== CHILDREN AND ROLLBACK ======================
//
// Edge functions have no transaction across statements, so the achievement is
// inserted first and its alignments and results after. If a child insert
// fails, the achievement is DELETED and the call fails.
//
// That compensating delete is safe here and nowhere else: the row is seconds
// old, always created in 'draft', and credentials.achievement_id is a
// restricting FK, so nothing can already reference it. An achievement that
// exists with half its alignments is a document making a weaker claim than its
// author intended, which is precisely the silent-partial-success failure this
// codebase keeps paying for.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";
import { requireIssuerAccess } from "../_shared/authorize.ts";

interface AlignmentIn {
  target_name?: string;
  target_url?: string;
  target_framework?: string;
  target_code?: string;
  target_description?: string;
  target_type?: string;
}

interface ResultIn {
  result_type?: string;
  required_value?: string;
  required_level?: string;
  value_min?: string;
  value_max?: string;
  allowed_values?: string[];
}

interface Body {
  issuer_id?: string;
  code?: string;
  name?: string;
  description?: string;
  achievement_type?: string;
  criteria_narrative?: string;
  criteria_url?: string;
  image_path?: string;
  tags?: string[];
  default_validity_days?: number;
  status?: string;
  alignments?: AlignmentIn[];
  results?: ResultIn[];
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Mirrors achievements_code_format in migration 231. */
const CODE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,62}$/;

/** Mirrors achievements_type_vocab. ext: prefixes are permitted by the spec. */
const TYPES = new Set([
  "Achievement", "Assessment", "Award", "Badge", "Certificate",
  "CertificateOfCompletion", "Certification", "Competency", "Course",
  "Diploma", "Fieldwork", "LearningProgram", "License", "Membership",
  "MicroCredential",
]);

/** Mirrors achievement_results_type_vocab. Acreditta's "Tipo de resultado". */
const RESULT_TYPES = new Set([
  "GradePointAverage", "LetterGrade", "Percent", "PerformanceLevel",
  "PredictedScore", "RawScore", "Result", "RubricCriterionLevel",
  "RubricScore", "ScaledScore", "Status",
]);

/**
 * Names a partner must not give their own achievement.
 *
 * Not about the TYPE they choose -- they may issue a Certification if they
 * wish. This is about a name that makes their claim read as ours, or as
 * accredited by a body that has not accredited it. A disclaimer on a verify
 * page cannot reach a string that travels inside the credential.
 */
const FORBIDDEN_IN_NAME = [
  "certidemy", "certiglobal",
  "accredited by", "acreditado por", "acreditada por", "credenciado por",
  "ansi accredited", "iaf accredited", "ukas accredited",
  "iso 17024", "iso/iec 17024", "17024 accredited",
];

/** Mirrors achievements_active_requires_criteria in migration 234. */
const MIN_CRITERIA = 20;

/**
 * A usable alignment target.
 *
 * https:// as before -- a partner pasting a course link should paste a real
 * one -- OR an ESCO skill URI, which is http:// by design.
 *
 * data.europa.eu URIs are persistent IDENTIFIERS rather than pages to fetch,
 * and the scheme is part of the identifier: rewriting it to https produces a
 * string that is no longer the thing the European Commission published. OB 3.0
 * alignment targetUrl is exactly where such an identifier belongs.
 *
 * Narrow on purpose. Not "any http://" -- that would reopen the door the https
 * rule closed.
 */
const ESCO_URI_RE =
  /^http:\/\/data\.europa\.eu\/esco\/skill\/[0-9a-f-]{36}$/i;

function isUsableTargetUrl(u: string): boolean {
  return u.startsWith("https://") || ESCO_URI_RE.test(u);
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

    const body = (await req.json()) as Body;

    const issuerId = body.issuer_id?.trim();
    const code = body.code?.trim();
    const name = body.name?.trim();
    const description = body.description?.trim();
    const type = (body.achievement_type ?? "Certificate").trim();
    const narrative = body.criteria_narrative?.trim() || null;
    const criteriaUrl = body.criteria_url?.trim() || null;
    const imagePath = body.image_path?.trim() || null;
    const status = (body.status ?? "draft").trim();
    const tags = Array.isArray(body.tags)
      ? body.tags.map((s) => String(s).trim()).filter(Boolean).slice(0, 32)
      : [];
    const validityDays = body.default_validity_days ?? null;

    if (!issuerId || !UUID_RE.test(issuerId)) {
      throw new HttpError(400, "valid issuer_id required");
    }
    if (!code) throw new HttpError(400, "code required");
    if (!CODE_RE.test(code)) {
      throw new HttpError(
        400,
        "code must be 1-63 chars: letters, digits, dot, underscore or hyphen, " +
          "starting with a letter or digit",
      );
    }
    if (!name) throw new HttpError(400, "name required");
    if (!description) throw new HttpError(400, "description required");
    if (!TYPES.has(type) && !type.startsWith("ext:")) {
      throw new HttpError(
        400,
        `achievement_type must be one of the OB 3.0 vocabulary or an ext: value`,
      );
    }
    if (status !== "draft" && status !== "active") {
      throw new HttpError(400, 'status must be "draft" or "active"');
    }
    if (validityDays !== null && (!Number.isInteger(validityDays) || validityDays < 1)) {
      throw new HttpError(400, "default_validity_days must be a positive integer");
    }
    if (criteriaUrl && !criteriaUrl.startsWith("https://")) {
      throw new HttpError(400, "criteria_url must be https");
    }

    const haystack = `${name} ${description}`.toLowerCase();
    const hit = FORBIDDEN_IN_NAME.find((w) => haystack.includes(w));
    if (hit) {
      throw new HttpError(
        400,
        `the name or description contains "${hit}", which would make this ` +
          `partner's claim read as Certidemy's or as accredited. The credential ` +
          `already names its own issuer; it must not name ours.`,
      );
    }

    // Migration 234 enforces this. Checked here for a useful 400 rather than a
    // raw constraint violation the caller cannot act on.
    if (status === "active" && (narrative ?? "").length < MIN_CRITERIA) {
      throw new HttpError(
        400,
        `an active achievement needs a criteria_narrative of at least ` +
          `${MIN_CRITERIA} characters. It is what the holder demonstrated, and ` +
          `it is the one field a credential cannot leave to a generic fallback.`,
      );
    }

    // ---- the issuer must exist and be able to sign ----------------------
    const { data: issuer, error: iErr } = await svc
      .from("issuers")
      .select("id, slug, name, status, base_url, company_id")
      .eq("id", issuerId)
      .maybeSingle();
    if (iErr) throw new Error(`issuer lookup: ${iErr.message}`);
    if (!issuer) throw new HttpError(404, "issuer not found");
    if (issuer.status !== "active") {
      throw new HttpError(
        409,
        `issuer "${issuer.slug}" is ${issuer.status}; activate it before ` +
          `defining achievements it cannot yet sign`,
      );
    }

    // platform_admin, or the team_admin of the company that owns THIS issuer.
    // Throws 403 with an identical message either way, so an issuer id cannot
    // be probed for existence.
    await requireIssuerAccess(svc, actor, issuer.id);

    const { data: taken } = await svc
      .from("achievements")
      .select("id")
      .eq("issuer_id", issuerId)
      .eq("code", code)
      .maybeSingle();
    if (taken) {
      throw new HttpError(409, `issuer "${issuer.slug}" already has code "${code}"`);
    }

    // ---- validate children BEFORE inserting the parent ------------------
    const alignments = (body.alignments ?? []).map((a, i) => {
      if (!a.target_name?.trim()) {
        throw new HttpError(400, `alignments[${i}]: target_name required`);
      }
      /* Trimmed ONCE. The old form narrowed target_url as a side effect of
         the check; a helper call cannot, and relying on that coincidence is
         how the value and the validated string drift apart. */
      const targetUrl = a.target_url?.trim() ?? "";
      if (!isUsableTargetUrl(targetUrl)) {
        throw new HttpError(
          400,
          `alignments[${i}]: target_url must be an https link or an ESCO skill URI`,
        );
      }
      return {
        target_name: a.target_name.trim(),
        target_url: targetUrl,
        target_framework: a.target_framework?.trim() || null,
        target_code: a.target_code?.trim() || null,
        target_description: a.target_description?.trim() || null,
        target_type: a.target_type?.trim() || null,
        order_index: i,
      };
    });

    const results = (body.results ?? []).map((r, i) => {
      const rt = r.result_type?.trim();
      if (!rt) throw new HttpError(400, `results[${i}]: result_type required`);
      if (!RESULT_TYPES.has(rt) && !rt.startsWith("ext:")) {
        throw new HttpError(
          400,
          `results[${i}]: result_type must be an OB 3.0 ResultType or an ext: value`,
        );
      }
      return {
        result_type: rt,
        required_value: r.required_value?.trim() || null,
        required_level: r.required_level?.trim() || null,
        value_min: r.value_min?.trim() || null,
        value_max: r.value_max?.trim() || null,
        allowed_values: Array.isArray(r.allowed_values) ? r.allowed_values : null,
        order_index: i,
      };
    });

    // ---- insert -----------------------------------------------------------
    const { data: ach, error: aErr } = await svc
      .from("achievements")
      .insert({
        issuer_id: issuerId,
        code,
        achievement_type: type,
        name,
        description,
        criteria_narrative: narrative,
        criteria_url: criteriaUrl,
        image_path: imagePath,
        tags,
        default_validity_days: validityDays,
        // Anything richer than name/description/criteria is 'structured'.
        // 'certification' is reserved for the JTA pipeline and is never set here.
        authoring_depth:
          alignments.length > 0 || results.length > 0 ? "structured" : "simple",
        status,
        created_by: actor,
      })
      .select("id, code, name, achievement_type, status, authoring_depth")
      .single();

    if (aErr || !ach) {
      const dup = (aErr as { code?: string } | null)?.code === "23505";
      console.error("achievement insert failed", aErr);
      throw new HttpError(
        dup ? 409 : 500,
        dup ? `code "${code}" is taken for this issuer` : "failed to create achievement",
      );
    }

    // ---- children, with a compensating delete on failure ------------------
    const rollback = async (why: string) => {
      // Safe ONLY because the row is seconds old and nothing can reference it:
      // credentials.achievement_id restricts, and no credential exists yet.
      await svc.from("achievements").delete().eq("id", ach.id);
      console.error(`rolled back achievement ${ach.id}: ${why}`);
    };

    if (alignments.length > 0) {
      const { error } = await svc
        .from("achievement_alignments")
        .insert(alignments.map((a) => ({ ...a, achievement_id: ach.id })));
      if (error) {
        await rollback(`alignments: ${error.message}`);
        throw new HttpError(500, "failed to save alignments; nothing was created");
      }
    }

    if (results.length > 0) {
      const { error } = await svc
        .from("achievement_results")
        .insert(results.map((r) => ({ ...r, achievement_id: ach.id })));
      if (error) {
        await rollback(`results: ${error.message}`);
        throw new HttpError(500, "failed to save results; nothing was created");
      }
    }

    await svc.from("admin_actions").insert({
      actor_user_id: actor,
      action: "create_partner_achievement",
      target_type: "achievement",
      target_id: ach.id,
      reason: null,
      metadata: {
        issuer_slug: issuer.slug,
        code: ach.code,
        achievement_type: ach.achievement_type,
        status: ach.status,
        alignments: alignments.length,
        results: results.length,
      },
    });

    return jsonResponse({
      ok: true,
      achievement: {
        id: ach.id,
        code: ach.code,
        name: ach.name,
        achievement_type: ach.achievement_type,
        status: ach.status,
        authoring_depth: ach.authoring_depth,
        alignments: alignments.length,
        results: results.length,
      },
      issuer: { id: issuer.id, slug: issuer.slug, name: issuer.name },
      // Resolves once status is 'active'. A draft achievement is not a
      // published claim and open-badge returns 404 for it.
      url: `${issuer.base_url}/issuers/${issuer.slug}/achievements/${ach.code}`,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
