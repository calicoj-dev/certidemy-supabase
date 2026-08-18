// functions/analyze-curriculum/index.ts
//
// The analyzer as a deployed endpoint. Renderer A (super admin console) and,
// later, Renderer B (partner portal) both call this.
//
// ======================= verify_jwt = true, PINNED =======================
//
// config.toml MUST carry:
//
//   [functions.analyze-curriculum]
//   verify_jwt = true
//
// This is the INVERSE of the OB3 rule and the easiest thing in this codebase to
// get backwards on autopilot. Public OB3 endpoints need verify_jwt = false
// pinned, because a missing pin is a silent 401 to anonymous callers. THIS
// function is admin-only and reads competitor intelligence: a missing pin here
// would expose it to anonymous callers instead.
//
// Pin it by name either way. Never rely on the default.
//
// ============================ WHAT IT DOES NOT DO ============================
//
// It does not store the analysed document. URL, content hash, word count and
// derived findings only. It does not read the secure item bank -- the
// BlueprintReader allowlist refuses those tables by name, and that refusal is
// tested.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { analyze } from "../_shared/analyzer/engine.ts";
import { BlueprintReader } from "../_shared/analyzer/reader.ts";
import { buildReadinessReport, buildPlan } from "../_shared/analyzer/report.ts";
import type { DriftRule, Lang } from "../_shared/analyzer/types.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

/**
 * profiles.platform_role values that grant full internal access.
 *
 * The enum is exactly: learner | platform_admin | marketing. Verified against
 * pg_enum, not assumed -- an earlier version of this function checked
 * profiles.role, which does not exist, and that comparison would have evaluated
 * false for EVERY caller: an admin 403-ed out of their own tool with nothing in
 * the logs to explain why.
 *
 * `marketing` is deliberately excluded. This endpoint returns competitor
 * intelligence and internal-only findings; that is a narrower audience than
 * everyone with a staff login.
 */
const PLATFORM_ADMIN_ROLES = ["platform_admin"];

/** Source text cap. A 78-page manual is ~13k words / ~90KB; 2MB is generous. */
const MAX_CHARS = 2_000_000;

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  // ---- caller identity -------------------------------------------------
  // verify_jwt = true means the platform already rejected an unauthenticated
  // request. This resolves WHO, which decides what they may see.
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "unauthenticated" }, 401);
  const userId = userData.user.id;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  let body: {
    text?: string;
    source_url?: string;
    source_kind?: "url" | "pdf" | "paste";
    source_lang?: Lang;
    certification_code?: string;
    mode?: "fit" | "report";
    company_id?: string;
    ghl_contact_id?: string;
    persist?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  const text = (body.text ?? "").trim();
  if (!text) return json({ error: "text is required" }, 400);
  if (text.length > MAX_CHARS) {
    return json({ error: `text exceeds ${MAX_CHARS} characters` }, 413);
  }

  const sourceLang: Lang = body.source_lang ?? "en";
  const sourceKind = body.source_kind ?? "paste";
  if (sourceKind === "url" && !body.source_url) {
    return json({ error: "source_url is required when source_kind is url" }, 400);
  }

  // ---- authorization ---------------------------------------------------
  // Two ways in, and they are NOT the same permission.
  //
  //   platform admin  -> any certification, full internal detail
  //   partner company -> requires the curriculum_coverage feature grant
  //
  // A partner without the grant gets 403 and NO DATA -- not hidden data. A
  // control a renderer can forget is not a control, so it lives here.
  // profiles.platform_role, NOT profiles.role -- the latter does not exist, and
  // the first version of this function checked it. That comparison would have
  // silently evaluated false for EVERY caller, 403-ing an admin out of their
  // own tool with no error to explain why.
  //
  // PLATFORM_ADMIN_ROLES is a list rather than a constant because the column is
  // an enum and an unmatched string fails silently in exactly the same way.
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("platform_role")
    .eq("id", userId)
    .maybeSingle();
  if (profileErr) return json({ error: `profile: ${profileErr.message}` }, 500);

  const isPlatformAdmin =
    profile?.platform_role != null && PLATFORM_ADMIN_ROLES.includes(profile.platform_role);

  let ownerCompanyId: string | null = null;
  if (!isPlatformAdmin) {
    if (!body.company_id) return json({ error: "forbidden" }, 403);
    const { data: granted } = await admin.rpc("company_has_feature", {
      p_company_id: body.company_id,
      p_feature_key: "curriculum_coverage",
    });
    if (granted !== true) return json({ error: "forbidden" }, 403);
    ownerCompanyId = body.company_id;
  }

  // ---- ruleset ---------------------------------------------------------
  const { data: ruleRows, error: ruleErr } = await admin
    .from("drift_rules")
    .select(
      "id,rule_class,lang,legacy_term,current_term,match_mode,pattern,severity,authority_source_id,authority_citation_id,rationale",
    )
    .eq("is_active", true);
  if (ruleErr) return json({ error: `ruleset: ${ruleErr.message}` }, 500);

  const rules: DriftRule[] = (ruleRows ?? []).map((r) => ({
    id: r.id,
    ruleClass: r.rule_class,
    lang: r.lang,
    legacyTerm: r.legacy_term,
    currentTerm: r.current_term,
    matchMode: r.match_mode,
    pattern: r.pattern,
    severity: r.severity,
    authoritySourceId: r.authority_source_id,
    authorityCitationId: r.authority_citation_id,
    rationale: r.rationale,
  }));

  const reader = new BlueprintReader({
    restUrl: `${SUPABASE_URL}/rest/v1`,
    apiKey: SERVICE_KEY,
  });

  const contentHash = await sha256(text);
  const mode = body.mode ?? (body.certification_code ? "report" : "fit");

  try {
    // ---- FIT: rank against every certification -------------------------
    //
    // Nearly free: gates, drift and weighting are computed once on the text and
    // only concept matching is per-certification.
    if (mode === "fit") {
      const certs = await reader.listCertifications();
      const results = [];
      for (const c of certs) {
        if (c.status !== "available") continue;
        const bp = await reader.loadByCode(c.code, sourceLang === "en" ? "en" : "en");
        const out = analyze({ rawText: text, sourceLang, blueprint: bp, rules });
        results.push({
          certification_code: c.code,
          coverage_pct: out.coveragePct,
          suppressed: out.gates.coverageSuppressed,
          suppression_reason: out.gates.suppressionReason,
          concepts_total: bp.concepts?.length ?? 0,
          strong: out.concepts?.counts.strong ?? 0,
          probable: out.concepts?.counts.probable ?? 0,
        });
      }
      results.sort((a, b) => (b.coverage_pct ?? -1) - (a.coverage_pct ?? -1));

      const probe = analyze({
        rawText: text,
        sourceLang,
        blueprint: await reader.loadByCode(certs[0].code, "en"),
        rules,
      });

      return json({
        mode: "fit",
        content_hash: contentHash,
        word_count: probe.normalized.wordCount,
        framework_detected: probe.gates.frameworkDetected,
        drift_findings: probe.findings.filter((f) => f.findingType === "drift").length,
        results,
        tables_read: [...new Set(reader.accessLog)],
      });
    }

    // ---- REPORT: readiness + build plan for one certification ----------
    const code = body.certification_code;
    if (!code) return json({ error: "certification_code is required for mode=report" }, 400);

    const blueprint = await reader.loadByCode(code, "en", true);
    const analysis = analyze({
      rawText: text,
      sourceLang,
      blueprint,
      rules,
      frameworkExpected: null,
    });
    const report = buildReadinessReport(analysis, blueprint);
    const plan = buildPlan(report);

    // ---- persist ---------------------------------------------------------
    // The document is NEVER stored. URL, hash, word count and findings only.
    // Storing competitors' copyrighted syllabi is not a repository we want.
    let runId: string | null = null;
    if (body.persist !== false) {
      const { data: run, error: runErr } = await admin
        .from("analysis_runs")
        .insert({
          source_kind: sourceKind,
          source_url: body.source_url ?? null,
          source_content_hash: contentHash,
          source_lang: sourceLang,
          source_word_count: analysis.normalized.wordCount,
          reference_kind: "certidemy_certification",
          reference_certification_id: blueprint.referenceId,
          reference_lang: "en",
          density_ok: analysis.gates.densityOk,
          density_threshold_words: analysis.gates.densityThresholdWords,
          framework_detected: analysis.gates.frameworkDetected,
          framework_match: analysis.gates.frameworkMatch,
          coverage_suppressed: analysis.gates.coverageSuppressed,
          suppression_reason: analysis.gates.suppressionReason,
          coverage_pct: analysis.coveragePct,
          clean_pass: analysis.cleanPass,
          engine_version: analysis.engineVersion,
          drift_ruleset_size: analysis.driftRulesetSize,
          owner_company_id: ownerCompanyId,
          ghl_contact_id: body.ghl_contact_id ?? null,
          created_by: userId,
          status: "complete",
          completed_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      // A failed insert must be LOUD. The schema's suppression CHECKs are the
      // last line of defence against storing a number the engine refused to
      // compute; swallowing a 23514 here would hide exactly the bug they exist
      // to catch. (score-mock-exam once returned HTTP 200 while minting
      // nothing, for precisely this reason.)
      if (runErr) return json({ error: `persist run: ${runErr.message}` }, 500);
      runId = run!.id;

      const rows = analysis.findings.map((f) => ({
        run_id: runId,
        finding_type: f.findingType,
        concept_id: f.conceptId ?? null,
        task_id: f.taskId ?? null,
        domain_id: f.domainId ?? null,
        drift_rule_id: f.driftRuleId ?? null,
        label: f.label ?? null,
        confidence: f.confidence ?? null,
        confidence_band: f.confidenceBand ?? null,
        evidence_excerpt: f.evidenceExcerpt ?? null,
        evidence_locator: f.evidenceLocator ?? null,
        source_weight_pct: f.sourceWeightPct ?? null,
        blueprint_weight_pct: f.blueprintWeightPct ?? null,
        severity: f.severity ?? null,
        visibility: f.visibility,
        requires_human_review: f.requiresHumanReview,
      }));

      for (let i = 0; i < rows.length; i += 500) {
        const { error: fErr } = await admin.from("analysis_findings").insert(rows.slice(i, i + 500));
        if (fErr) return json({ error: `persist findings: ${fErr.message}` }, 500);
      }
    }

    // Renderer B filters on visibility; a partner must never receive an
    // internal-only finding. Filtering HERE means a component cannot leak one.
    const visibleReport = isPlatformAdmin
      ? report
      : {
          ...report,
          integrity: report.integrity.filter((f) => f.visibility !== "internal"),
        };

    return json({
      mode: "report",
      run_id: runId,
      content_hash: contentHash,
      report: visibleReport,
      build_plan: plan,
      tables_read: [...new Set(reader.accessLog)],
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
