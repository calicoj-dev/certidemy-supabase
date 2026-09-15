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
// ================= THE REVIEW QUEUE IS SHAKEDOWN RESIDUE =================
//
// Scoped 2026-09-12. READ THIS BEFORE RE-SCOPING IT, because the shape of the
// table invites a wrong conclusion and costs an hour to reach.
//
// A query for "findings awaiting a human" returns 94 rows and reads like a
// backlog. It is not one.
//
//   94 rows are 48 DISTINCT judgements. The 90 concept_match rows are 45
//   subjects seen twice; the 2 high-severity structural_notes are ONE note
//   seen twice.
//
//   All of it comes from TWO pasted documents, by ONE operator, over two days
//   (2026-08-18/19), across nine runs at engine_version 0.1.0. By content hash:
//   one English document of 13,405 words run seven times against SM-AI-I and
//   SPO-AI-I, and one es-419 document of 642 words run twice. FOUR of the nine
//   runs produced zero findings.
//
//   Every run has owner_company_id NULL, segment NULL and outreach_disposition
//   NULL. Nothing was ever acted on commercially. is_calibration is false on
//   all nine, so the flag does not mark them as tests - the CRM columns do.
//
// ZERO OF 510 FINDINGS HAVE EVER BEEN REVIEWED. Not one reviewed_at, not one
// review_outcome, in any category. So there is NO PRECEDENT for what reviewing
// one means - no worked example to copy, no convention to follow. That is the
// reason not to start by marking these: a review outcome recorded here would be
// the first one on the platform and would define the convention, on findings
// about a document nobody is selling against.
//
// requires_human_review IS A PER-FINDING JUDGEMENT, NOT A BLANKET. concepts.ts
// sets it as `m.band === "ambiguous"`, and SIX high-severity findings are
// deliberately NOT in the queue - 4 drift and 2 weight_divergence. High
// severity means "this matters to the prospect"; the flag means "a person must
// adjudicate this". They are orthogonal, and reading severity as the queue is
// the second wrong conclusion available here.
//
// ================= OPEN: SPANISH SOURCE CANNOT BE MEASURED =================
//
// A PRODUCT GAP, NOT A REVIEW TASK, and the only thing in the queue above with
// standing value.
//
// The lexical matcher cannot compare an es-419 source against an en blueprint,
// so Spanish curriculum analysis is SUPPRESSED rather than answered:
// coverage_pct null, suppression_reason "language_unsupported", and a
// high-severity internal structural_note saying the matcher cannot measure it.
//
// The engine is behaving correctly. Migration 223 records why the refusal was
// built and what it prevents: run against the Spanish AulaUtil syllabus the
// matcher reported 8.9% coverage against a hand score of 35%, and "8.9% would
// have read as a devastating finding about a competitor rather than as a
// failure of measurement." Refusing to answer is the right behaviour.
//
// WHAT MAKES IT OPEN RATHER THAN CLOSED: this platform sells into LatAm. Every
// certification ships es-419 lessons, items and module headings, and the
// analyzer - the tool for looking at a Spanish-speaking prospect's curriculum -
// returns no number for exactly those prospects. The refusal is honest and the
// capability is missing.
//
// 223 names the two fixes and neither has been done: a multilingual embedding
// matcher that declares es-419/en support, or translated concept names
// (public.concepts has no lang column and there is no concept_i18n table). Both
// close it; neither is scheduled.
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
import { requireCompanyFeature } from "../_shared/authorize.ts";
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

/*
 * ROLE RESOLUTION MOVED TO _shared/authorize.ts. The local allowlist that used
 * to live here was deleted with the branch that read it -- a second copy of
 * "who is an admin" beside requireCompanyFeature is the drift this repo keeps
 * paying for. The two things it knew, kept because they were expensive:
 *
 *   - The enum is exactly learner | platform_admin | marketing, verified
 *     against pg_enum. An earlier version of this function compared
 *     profiles.role, WHICH DOES NOT EXIST, and that comparison evaluated false
 *     for every caller: an admin 403-ed out of their own tool with nothing in
 *     the logs to explain why.
 *   - `marketing` is excluded deliberately, not by omission. This endpoint
 *     returns competitor intelligence and internal-only findings; that is a
 *     narrower audience than everyone with a staff login. requireCompanyFeature
 *     names it and refuses it there.
 */

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
  //   partner company -> team_admin of a company holding curriculum_coverage
  //
  // A partner without the grant gets 403 and NO DATA -- not hidden data. A
  // control a renderer can forget is not a control, so it lives here.
  //
  // ============ THE COMPANY IS RESOLVED, NEVER ACCEPTED ============
  //
  // This block used to take body.company_id and pass it straight to
  // company_has_feature, which is a pure lookup over company_features and says
  // nothing about who is asking. Any authenticated learner JWT plus a granted
  // company's id was a complete authorization, and the run was then persisted
  // with owner_company_id set to whatever arrived in the body.
  //
  // requireCompanyFeature resolves the caller's team_admin memberships from
  // team_members FIRST. body.company_id is a SELECTOR among those and is
  // refused when it names one the caller does not administer.
  //
  // THE OLD BRANCH WAS NEVER EXPLOITED AND COULD NOT HAVE BEEN: company_features
  // has been empty platform-wide since it was created, so company_has_feature
  // answered false for every argument and every partner call 403-ed. That is
  // the reason it survived review -- a branch that cannot execute because a
  // precondition is unmet reads exactly like one that works. The first row
  // written to company_features would have been the thing that opened it.
  // See scripts/smoke-analyzer-access.mjs, which is the branch's first run.
  let access;
  try {
    access = await requireCompanyFeature(
      admin,
      userId,
      "curriculum_coverage",
      body.company_id ?? null,
    );
  } catch (e) {
    const he = e as { status?: number; message?: string };
    return json({ error: he.message ?? "forbidden" }, he.status ?? 403);
  }

  const isPlatformAdmin = access.role === "platform_admin";
  const ownerCompanyId: string | null = access.companyId;

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
        // INTERNAL TABLE NAMES ARE NOT A PARTNER'S BUSINESS. Same class as an
        // editorial note left in a concept description: correct, useful
        // internally, and nothing a customer's response should carry. Dropped
        // by OMITTING the key rather than sending an empty array, so a partner
        // cannot tell how many tables an answer touched either.
        ...(isPlatformAdmin ? { tables_read: [...new Set(reader.accessLog)] } : {}),
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
        evidence_match_start: f.evidenceMatchStart ?? null,
        evidence_match_length: f.evidenceMatchLength ?? null,
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
      // Admin-only, as in the fit response above.
      ...(isPlatformAdmin ? { tables_read: [...new Set(reader.accessLog)] } : {}),
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
