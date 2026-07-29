// POST /functions/v1/render-asset
//
// Body: { asset_type: "factsheet" | "specimen_certificate" | "blueprint_sheet"
//                   | "jta_sheet",
//         certification_code: string, language?: "en" | "es-419" | "pt-BR" }
// Auth: Bearer JWT - MUST be platform_admin or marketing.
//
// v4: JTA sheet. Every declared task with its level, criticality, frequency and
// examination scope, plus knowledge/skills/abilities where the language has
// them.
//
// GATED, NOT PUBLIC. verify_jwt stays ON - the caller must be staff. The public
// forwarding URLs in SALES-LIBRARY-SPEC §9 are a separate endpoint; that is
// where verify_jwt = false gets pinned in config.toml. Making THIS function
// public would let anyone enumerate assets and would bypass the download log.
//
// CACHING: object paths are content-versioned from source updated_at values. An
// edited weight or an approved translation changes the path, so the next
// request renders fresh and the old object is never requested again. No
// invalidation step to forget.
//
// TWO CACHE-KEY SUBTLETIES, both learned the hard way:
//
//   The blueprint key includes exam_blueprint.computed_at. Editing a task's
//   Bloom level does not touch the certification row, so keying on updated_at
//   alone would serve a stale profile forever.
//
//   The JTA key additionally includes the newest tasks.updated_at and the
//   newest task_translations.updated_at. Migration 091 superseded five task
//   statements once already, and a competence document that keeps serving
//   retired wording is precisely the failure this library exists to prevent.
//
// TOLERANT TRANSLATION READS. domain_translations and task_translations are
// asked for their richest shape first; if a column is absent the request fails
// and we retry for the minimum, rather than losing translated titles and
// statements as collateral. Adding those columns later needs no code change -
// the first query simply starts succeeding. Responses report what was actually
// localized, because a Spanish document quietly carrying English content is the
// kind of thing that should not be discovered in a client's inbox.
//
// PROVISIONAL TRANSLATIONS ARE EXCLUDED. Both translation tables carry
// is_provisional, which exists to distinguish reviewed copy from unreviewed.
// A document a rep emails to a buyer is the last place to ignore that. Today
// every row is reviewed, so this filter costs nothing; it earns its place the
// first time someone loads a machine-translated batch.
//
// NOTE ON SELECT STRINGS: single literals, never built with `+`. supabase-js
// parses the select as a template-literal type; a concatenated string degrades
// the response to GenericStringError and breaks the typed build in the web app.
// Same discipline here for consistency even though Deno does not enforce it.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";
import {
  renderFactSheet,
  FACTSHEET_RENDERER_VERSION,
  type AssetLocale,
  type FactSheetData,
  type FactSheetDomain,
  type FactSheetSibling,
} from "../_shared/factsheet.ts";
import {
  renderBlueprintSheet,
  BLUEPRINT_RENDERER_VERSION,
  type BlueprintData,
  type BlueprintDomain,
  type BlueprintBloomRow,
} from "../_shared/blueprint.ts";
import {
  renderJtaSheet,
  JTA_RENDERER_VERSION,
  type JtaData,
  type JtaDomain,
  type JtaTask,
} from "../_shared/jta.ts";

const BUCKET = "sales-assets";
const SIGNED_URL_TTL = 60 * 60;
const LOCALES: AssetLocale[] = ["en", "es-419", "pt-BR"];
const CLIENT_SAFE_STATUSES = ["available", "coming_soon"];
const IMPLEMENTED = [
  "factsheet",
  "specimen_certificate",
  "blueprint_sheet",
  "jta_sheet",
];
const SITE_BASE = Deno.env.get("PUBLIC_SITE_URL") ?? "https://certidemy.com";

/**
 * Only reviewed translations reach a client-facing document. Set to false only
 * with a deliberate decision that unreviewed copy is acceptable in a buyer's
 * hands - it governs every asset this function renders, in every language.
 */
const REVIEWED_TRANSLATIONS_ONLY = true;

function contentVersion(iso: string): string {
  return iso.replace(/[^0-9]/g, "").slice(0, 14);
}

/**
 * Largest-remainder allocation. VERBATIM PORT of gen-jta-doc.mjs, which itself
 * matches generate-mock-exam's allocation. Do not "simplify" it: a different
 * rounding rule would publish per-domain question counts that the live
 * examination does not use, and the sheets' whole value is that their numbers
 * are the real ones.
 */
function allocate(
  weights: { key: string; pct: number }[],
  total: number,
): Map<string, number> {
  const sum = weights.reduce((s, w) => s + w.pct, 0) || 1;
  const exact = weights.map((w) => ({ key: w.key, e: (w.pct / sum) * total }));
  const out = new Map(exact.map((x) => [x.key, Math.floor(x.e)]));
  let left = total - [...out.values()].reduce((a, b) => a + b, 0);
  exact.sort((a, b) => (b.e - Math.floor(b.e)) - (a.e - Math.floor(a.e)));
  for (const x of exact) {
    if (left <= 0) break;
    out.set(x.key, (out.get(x.key) ?? 0) + 1);
    left--;
  }
  return out;
}

/**
 * Task codes sort on their numeric segments, never as strings: "3.10" belongs
 * after "3.9", and a lexical compare puts it after "3.1".
 */
function byTaskCode(a: { code: string }, b: { code: string }): number {
  const [am, an] = a.code.split(".").map((n) => Number(n) || 0);
  const [bm, bn] = b.code.split(".").map((n) => Number(n) || 0);
  return am - bm || an - bn || a.code.localeCompare(b.code);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      asset_type?: string;
      certification_code?: string;
      language?: string;
    };
    const assetType = body.asset_type ?? "factsheet";
    const code = body.certification_code?.trim().toUpperCase();
    const language = (body.language ?? "en") as AssetLocale;

    if (!IMPLEMENTED.includes(assetType)) {
      return jsonResponse(
        { error: `asset_type '${assetType}' not implemented yet` },
        400,
      );
    }
    if (!code) return jsonResponse({ error: "certification_code required" }, 400);
    if (!LOCALES.includes(language)) {
      return jsonResponse({ error: `unsupported language '${language}'` }, 400);
    }

    // ---- identify + authorize ------------------------------------------
    const actor_user_id = await authenticate(req);
    const svc = getServiceClient();

    const { data: actorProfile } = await svc
      .from("profiles")
      .select("platform_role")
      .eq("id", actor_user_id)
      .maybeSingle();

    const role = actorProfile?.platform_role;
    if (role !== "platform_admin" && role !== "marketing") {
      throw new HttpError(403, "platform_admin or marketing required");
    }

    // ---- certification --------------------------------------------------
    //
    // price_usd is deliberately NOT selected. No asset in this library renders
    // a price. Not fetching it is stronger than fetching and remembering not to
    // use it. Spec §3.4.
    const { data: certRow, error: certErr } = await svc
      .from("certifications")
      .select(
        "id, code, name, description, num_questions, passing_score_pct, exam_duration_minutes, max_exam_attempts, attempt_window_months, validity_days, status, category_slug, sort_order, exam_blueprint, updated_at"
      )
      .eq("code", code)
      .maybeSingle();

    if (certErr) {
      console.error("certification lookup failed", certErr);
      return jsonResponse({ error: "lookup failed" }, 500);
    }
    if (!certRow) return jsonResponse({ error: `no certification '${code}'` }, 404);

    if (!CLIENT_SAFE_STATUSES.includes(certRow.status)) {
      return jsonResponse(
        {
          error: "no client-safe asset for this certification",
          status: certRow.status,
          detail:
            "A draft certification has not cleared the publish checklist and must not be put in front of a buyer.",
        },
        409,
      );
    }

    // ---- specimen certificate --------------------------------------------
    //
    // Delegated, not duplicated. get-credential-certificate owns the
    // versioned locale-scoped path, the lazy render and the specimen marks.
    // Reimplementing that here would mean fixing certificate caching twice
    // forever.
    if (assetType === "specimen_certificate") {
      const { data: specRow } = await svc
        .from("credentials")
        .select("credential_code")
        .eq("certification_id", certRow.id)
        .eq("is_specimen", true)
        .maybeSingle();

      if (!specRow) {
        return jsonResponse(
          {
            error: "no specimen credential for this certification",
            detail:
              "Mint one with certidemy-web/scripts/mint-specimens.mjs.",
          },
          404,
        );
      }

      const base = Deno.env.get("SUPABASE_URL") ?? "";
      const certUrl =
        base +
        "/functions/v1/get-credential-certificate?code=" +
        encodeURIComponent(specRow.credential_code) +
        "&locale=" +
        language;

      const res = await fetch(certUrl);
      const payload = (await res.json().catch(() => ({}))) as {
        url?: string;
        cached?: boolean;
        error?: string;
      };
      if (!res.ok || !payload.url) {
        console.error("specimen certificate fetch failed", payload);
        return jsonResponse(
          { error: payload.error ?? "could not obtain specimen certificate" },
          502,
        );
      }

      // Logged here, not there: the audit question is which member of
      // staff obtained the file, and only this function knows that.
      const { error: specLogErr } = await svc.from("asset_downloads").insert({
        user_id: actor_user_id,
        asset_type: "specimen_certificate",
        tier: "client_safe",
        certification_id: certRow.id,
        language,
      });
      if (specLogErr) console.warn("asset_downloads insert failed", specLogErr);

      return jsonResponse({
        url: payload.url,
        filename: `${code}-specimen-certificate-${language}.pdf`,
        asset_type: "specimen_certificate",
        certification_code: code,
        language,
        cached: payload.cached === true,
      });
    }

    // ---- localized copy -------------------------------------------------
    //
    // Falls back to the base row. AIHR-I has a null i18n description by design
    // - the catalog reads `claim` only.
    const { data: i18nRow } = await svc
      .from("certification_i18n")
      .select("name, claim, description, updated_at")
      .eq("certification_id", certRow.id)
      .eq("lang", language)
      .maybeSingle();

    const { data: enRow } = language === "en"
      ? { data: null }
      : await svc
        .from("certification_i18n")
        .select("claim")
        .eq("certification_id", certRow.id)
        .eq("lang", "en")
        .maybeSingle();

    // ---- domains ---------------------------------------------------------
    //
    // Shared by all three sheets. domains has no language column; titles and
    // descriptions come from domain_translations, falling back to the base row.
    const { data: domainRows } = await svc
      .from("domains")
      .select("id, code, title, description, weight_pct, order_index")
      .eq("certification_id", certRow.id)
      .order("order_index", { ascending: true });

    const domainBase = (domainRows ?? []) as {
      id: string;
      code: string;
      title: string;
      description: string | null;
      weight_pct: number;
      order_index: number;
    }[];

    const domainTitles = new Map<string, string>();
    const domainDescs = new Map<string, string>();
    let descriptionsLocalized = language === "en";

    if (language !== "en" && domainBase.length > 0) {
      const ids = domainBase.map((d) => d.id);

      let q = svc
        .from("domain_translations")
        .select("domain_id, title, description")
        .in("domain_id", ids)
        .eq("language", language);
      if (REVIEWED_TRANSLATIONS_ONLY) q = q.eq("is_provisional", false);
      const both = await q;

      if (!both.error) {
        descriptionsLocalized = true;
        for (
          const r of (both.data ?? []) as {
            domain_id: string;
            title: string | null;
            description: string | null;
          }[]
        ) {
          if (r.title) domainTitles.set(r.domain_id, r.title);
          if (r.description) domainDescs.set(r.domain_id, r.description);
        }
      } else {
        console.warn(
          "domain_translations description unavailable; descriptions render in English",
          both.error.message,
        );
        const { data: titleOnly } = await svc
          .from("domain_translations")
          .select("domain_id, title")
          .in("domain_id", ids)
          .eq("language", language);
        for (
          const r of (titleOnly ?? []) as { domain_id: string; title: string }[]
        ) {
          if (r.title) domainTitles.set(r.domain_id, r.title);
        }
      }
    }

    const blueprint = (certRow.exam_blueprint ?? {}) as Record<string, unknown>;
    const blueprintComputedAt = (blueprint.computed_at as string) ?? null;
    const cognitiveModelVersion = (blueprint.version as string) ?? null;

    const seats = allocate(
      domainBase.map((d) => ({ key: d.id, pct: Number(d.weight_pct) })),
      certRow.num_questions ?? 0,
    );

    // =====================================================================
    // JTA SHEET
    // =====================================================================
    if (assetType === "jta_sheet") {
      if (domainBase.length === 0) {
        return jsonResponse(
          {
            error: "no domains for this certification",
            detail: "A job task analysis with no domains has nothing to render.",
          },
          409,
        );
      }

      // EVERY task, in scope or not. The out-of-scope ones are the honest part
      // of this document: competence declared above the multiple-choice ceiling
      // and openly marked as not examined.
      const { data: taskRows, error: taskErr } = await svc
        .from("tasks")
        .select(
          "id, code, domain_id, statement, criticality, frequency, bloom_level, is_exam_scope, is_simulation_candidate, knowledge, skills, abilities"
        )
        .eq("certification_id", certRow.id);

      if (taskErr) {
        console.error("task lookup failed", taskErr);
        return jsonResponse({ error: "lookup failed" }, 500);
      }

      const tasks = (taskRows ?? []) as {
        id: string;
        code: string;
        domain_id: string;
        statement: string;
        criticality: string | null;
        frequency: string | null;
        bloom_level: string;
        is_exam_scope: boolean;
        is_simulation_candidate: boolean;
        knowledge: string | null;
        skills: string | null;
        abilities: string | null;
      }[];

      if (tasks.length === 0) {
        return jsonResponse(
          {
            error: "no tasks for this certification",
            detail:
              "The analysis has not been authored yet. Nothing downstream of it can be published.",
          },
          409,
        );
      }

      // Translated statements, and K/S/A if those columns ever land. Asking for
      // the rich shape first means the day they exist this starts working with
      // no code change.
      const statements = new Map<string, string>();
      const ksa = new Map<
        string,
        { knowledge: string | null; skills: string | null; abilities: string | null }
      >();
      let statementsLocalized = language === "en";
      let ksaLocalized = language === "en";
      let newestTranslation: string | null = null;

      if (language !== "en") {
        const ids = tasks.map((t) => t.id);

        let rich = svc
          .from("task_translations")
          .select("task_id, statement, knowledge, skills, abilities, updated_at")
          .in("task_id", ids)
          .eq("language", language);
        if (REVIEWED_TRANSLATIONS_ONLY) rich = rich.eq("is_provisional", false);
        const richRes = await rich;

        if (!richRes.error) {
          statementsLocalized = true;
          ksaLocalized = true;
          for (
            const r of (richRes.data ?? []) as {
              task_id: string;
              statement: string | null;
              knowledge: string | null;
              skills: string | null;
              abilities: string | null;
              updated_at: string | null;
            }[]
          ) {
            if (r.statement) statements.set(r.task_id, r.statement);
            ksa.set(r.task_id, {
              knowledge: r.knowledge,
              skills: r.skills,
              abilities: r.abilities,
            });
            if (r.updated_at && (!newestTranslation || r.updated_at > newestTranslation)) {
              newestTranslation = r.updated_at;
            }
          }
        } else {
          // Expected today: task_translations carries statement only.
          let lean = svc
            .from("task_translations")
            .select("task_id, statement, updated_at")
            .in("task_id", ids)
            .eq("language", language);
          if (REVIEWED_TRANSLATIONS_ONLY) lean = lean.eq("is_provisional", false);
          const leanRes = await lean;
          if (!leanRes.error) {
            statementsLocalized = true;
            for (
              const r of (leanRes.data ?? []) as {
                task_id: string;
                statement: string | null;
                updated_at: string | null;
              }[]
            ) {
              if (r.statement) statements.set(r.task_id, r.statement);
              if (r.updated_at && (!newestTranslation || r.updated_at > newestTranslation)) {
                newestTranslation = r.updated_at;
              }
            }
          } else {
            console.warn("task_translations unreadable", leanRes.error.message);
          }
        }
      }

      // Newest task edit, for the cache key. Tolerant: if tasks carries no
      // updated_at the key simply loses that input rather than the request
      // failing.
      let newestTask: string | null = null;
      const taskStamp = await svc
        .from("tasks")
        .select("updated_at")
        .eq("certification_id", certRow.id)
        .order("updated_at", { ascending: false })
        .limit(1);
      if (!taskStamp.error && taskStamp.data && taskStamp.data.length > 0) {
        newestTask = (taskStamp.data[0] as { updated_at: string | null }).updated_at;
      }

      // K/S/A only where it is available in the requested language. Rendering
      // English knowledge statements inside a Spanish document would switch
      // language every few lines across fifteen pages, which is worse than
      // omitting them.
      const showKsa = ksaLocalized;

      const jtaDomains: JtaDomain[] = domainBase.map((d) => {
        const list: JtaTask[] = tasks
          .filter((t) => t.domain_id === d.id)
          .sort(byTaskCode)
          .map((t) => {
            const tr = ksa.get(t.id);
            return {
              code: t.code,
              statement: statements.get(t.id) ?? t.statement,
              criticality: t.criticality,
              frequency: t.frequency,
              bloomLevel: t.bloom_level,
              isExamScope: t.is_exam_scope,
              isSimulationCandidate: t.is_simulation_candidate,
              knowledge: showKsa ? (tr?.knowledge ?? t.knowledge) : null,
              skills: showKsa ? (tr?.skills ?? t.skills) : null,
              abilities: showKsa ? (tr?.abilities ?? t.abilities) : null,
            };
          });
        return {
          code: d.code,
          title: domainTitles.get(d.id) ?? d.title,
          description: domainDescs.get(d.id) ?? d.description ?? "",
          weightPct: Number(d.weight_pct),
          seats: seats.get(d.id) ?? 0,
          tasks: list,
        };
      });

      const jtaData: JtaData = {
        code: certRow.code,
        name: i18nRow?.name ?? certRow.name,
        status: certRow.status,
        numQuestions: certRow.num_questions,
        domains: jtaDomains,
        totalTasks: tasks.length,
        examScopeTasks: tasks.filter((t) => t.is_exam_scope).length,
        blueprintComputedAt,
        cognitiveModelVersion,
      };

      const jtaStamps = [
        certRow.updated_at,
        i18nRow?.updated_at,
        blueprintComputedAt,
        newestTask,
        newestTranslation,
      ]
        .filter(Boolean)
        .sort()
        .join("");
      const jtaVersion = contentVersion(jtaStamps || certRow.updated_at);
      const jtaPath =
        `jta/v${JTA_RENDERER_VERSION}/${code}/${language}/${jtaVersion}.pdf`;
      const jtaFilename = `${code}-jta-${language}.pdf`;

      const { data: jtaHit } = await svc.storage
        .from(BUCKET)
        .createSignedUrl(jtaPath, SIGNED_URL_TTL, { download: jtaFilename });

      let jtaCached = false;
      let jtaUrl = jtaHit?.signedUrl ?? null;

      if (jtaUrl) {
        jtaCached = true;
      } else {
        const bytes = await renderJtaSheet(jtaData, language, SITE_BASE);
        const { error: upErr } = await svc.storage
          .from(BUCKET)
          .upload(jtaPath, bytes, {
            contentType: "application/pdf",
            upsert: true,
          });
        if (upErr) {
          console.error("jta upload failed", upErr);
          return jsonResponse({ error: "could not store asset" }, 500);
        }
        const { data: fresh, error: signErr } = await svc.storage
          .from(BUCKET)
          .createSignedUrl(jtaPath, SIGNED_URL_TTL, { download: jtaFilename });
        if (signErr || !fresh?.signedUrl) {
          console.error("could not sign fresh jta", signErr);
          return jsonResponse({ error: "could not sign asset" }, 500);
        }
        jtaUrl = fresh.signedUrl;
      }

      const { error: jtaLogErr } = await svc.from("asset_downloads").insert({
        user_id: actor_user_id,
        asset_type: "jta_sheet",
        tier: "client_safe",
        certification_id: certRow.id,
        language,
      });
      if (jtaLogErr) console.warn("asset_downloads insert failed", jtaLogErr);

      return jsonResponse({
        url: jtaUrl,
        filename: jtaFilename,
        asset_type: "jta_sheet",
        certification_code: code,
        language,
        cached: jtaCached,
        domains: jtaDomains.length,
        tasks_declared: jtaData.totalTasks,
        tasks_examined: jtaData.examScopeTasks,
        statements_localized: statementsLocalized,
        ksa_included: showKsa,
        descriptions_localized: descriptionsLocalized,
      });
    }

    // =====================================================================
    // BLUEPRINT SHEET
    // =====================================================================
    if (assetType === "blueprint_sheet") {
      if (domainBase.length === 0) {
        return jsonResponse(
          {
            error: "no domains for this certification",
            detail:
              "A blueprint sheet with no domains would be a page of exam parameters pretending to be a blueprint.",
          },
          409,
        );
      }

      // LIVE task counts, never exam_blueprint.task_counts. Invariant 17
      // catches divergence at verify time, but a document a buyer keeps should
      // not depend on a check having been run before it was generated.
      const { data: taskRows } = await svc
        .from("tasks")
        .select("domain_id, is_exam_scope")
        .eq("certification_id", certRow.id)
        .eq("is_exam_scope", true);

      const tasksByDomain = new Map<string, number>();
      for (const t of (taskRows ?? []) as { domain_id: string }[]) {
        tasksByDomain.set(t.domain_id, (tasksByDomain.get(t.domain_id) ?? 0) + 1);
      }
      const examScopeTasks = (taskRows ?? []).length;

      const { data: profileRows } = await svc
        .from("v_cognitive_profile")
        .select("bloom_level, tasks, pct_of_form")
        .eq("certification_id", certRow.id);

      const bloom: BlueprintBloomRow[] = (
        (profileRows ?? []) as {
          bloom_level: string;
          tasks: number;
          pct_of_form: number;
        }[]
      )
        .map((p) => ({
          level: String(p.bloom_level),
          tasks: Number(p.tasks),
          pctOfForm: Number(p.pct_of_form),
        }))
        .sort((a, b) => a.level.localeCompare(b.level));

      const bpDomains: BlueprintDomain[] = domainBase.map((d) => ({
        code: d.code,
        title: domainTitles.get(d.id) ?? d.title,
        description: domainDescs.get(d.id) ?? d.description ?? "",
        weightPct: Number(d.weight_pct),
        seats: seats.get(d.id) ?? 0,
        taskCount: tasksByDomain.get(d.id) ?? 0,
      }));

      const bpData: BlueprintData = {
        code: certRow.code,
        name: i18nRow?.name ?? certRow.name,
        status: certRow.status,
        numQuestions: certRow.num_questions,
        passingScorePct: certRow.passing_score_pct,
        examDurationMinutes: certRow.exam_duration_minutes,
        domains: bpDomains,
        bloom,
        examScopeTasks,
        blueprintComputedAt,
        cognitiveModelVersion,
      };

      const bpStamps = [
        certRow.updated_at,
        i18nRow?.updated_at,
        blueprintComputedAt,
      ]
        .filter(Boolean)
        .sort()
        .join("");
      const bpVersion = contentVersion(bpStamps || certRow.updated_at);
      const bpPath =
        `blueprint/v${BLUEPRINT_RENDERER_VERSION}/${code}/${language}/${bpVersion}.pdf`;
      const bpFilename = `${code}-blueprint-${language}.pdf`;

      const { data: bpHit } = await svc.storage
        .from(BUCKET)
        .createSignedUrl(bpPath, SIGNED_URL_TTL, { download: bpFilename });

      let bpCached = false;
      let bpUrl = bpHit?.signedUrl ?? null;

      if (bpUrl) {
        bpCached = true;
      } else {
        const bytes = await renderBlueprintSheet(bpData, language, SITE_BASE);
        const { error: upErr } = await svc.storage
          .from(BUCKET)
          .upload(bpPath, bytes, {
            contentType: "application/pdf",
            upsert: true,
          });
        if (upErr) {
          console.error("blueprint upload failed", upErr);
          return jsonResponse({ error: "could not store asset" }, 500);
        }
        const { data: fresh, error: signErr } = await svc.storage
          .from(BUCKET)
          .createSignedUrl(bpPath, SIGNED_URL_TTL, { download: bpFilename });
        if (signErr || !fresh?.signedUrl) {
          console.error("could not sign fresh blueprint", signErr);
          return jsonResponse({ error: "could not sign asset" }, 500);
        }
        bpUrl = fresh.signedUrl;
      }

      const { error: bpLogErr } = await svc.from("asset_downloads").insert({
        user_id: actor_user_id,
        asset_type: "blueprint_sheet",
        tier: "client_safe",
        certification_id: certRow.id,
        language,
      });
      if (bpLogErr) console.warn("asset_downloads insert failed", bpLogErr);

      return jsonResponse({
        url: bpUrl,
        filename: bpFilename,
        asset_type: "blueprint_sheet",
        certification_code: code,
        language,
        cached: bpCached,
        domains: bpDomains.length,
        tasks: examScopeTasks,
        descriptions_localized: descriptionsLocalized,
      });
    }

    // =====================================================================
    // FACT SHEET
    // =====================================================================
    //
    // The claim gate belongs here and not above: neither the blueprint nor the
    // JTA sheet renders a claim, so refusing to generate one for want of an
    // approved claim would be a gate on the wrong document.
    const claim = i18nRow?.claim ?? enRow?.claim ?? "";
    if (!claim) {
      return jsonResponse(
        {
          error: "no approved claim for this certification",
          detail:
            "The claim is the load-bearing sentence on a fact sheet. Rendering without one would put unreviewed copy in a buyer's hands.",
        },
        409,
      );
    }

    const domains: FactSheetDomain[] = domainBase.map((d) => ({
      title: domainTitles.get(d.id) ?? d.title,
      weightPct: Number(d.weight_pct),
    }));

    // ---- preparation figures --------------------------------------------
    //
    // "How long does this take my people" is the buyer's second question.
    // Lesson counts are per-language; fall back to English when a language has
    // not been fully loaded, so the figure is never zero on a real course.
    const { data: moduleRows } = await svc
      .from("modules")
      .select("id")
      .eq("certification_id", certRow.id);

    const moduleIds = ((moduleRows ?? []) as { id: string }[]).map((m) => m.id);

    let lessonCount = 0;
    let studyMinutes = 0;
    if (moduleIds.length > 0) {
      const countFor = async (lang: string) => {
        const { data } = await svc
          .from("lessons")
          .select("estimated_minutes")
          .in("module_id", moduleIds)
          .eq("language", lang);
        const rows = (data ?? []) as { estimated_minutes: number | null }[];
        return {
          count: rows.length,
          minutes: rows.reduce((n, r) => n + (r.estimated_minutes ?? 0), 0),
        };
      };
      let got = await countFor(language);
      if (got.count === 0 && language !== "en") got = await countFor("en");
      lessonCount = got.count;
      studyMinutes = got.minutes;
    }

    // ---- siblings --------------------------------------------------------
    //
    // Facts about our own catalog only. No labour-market claims anywhere on
    // this document.
    const { data: sibRows } = certRow.category_slug
      ? await svc
        .from("certifications")
        .select("code, name, sort_order, status")
        .eq("category_slug", certRow.category_slug)
        .neq("id", certRow.id)
        .in("status", CLIENT_SAFE_STATUSES)
        .order("sort_order", { ascending: true })
      : { data: null };

    const siblings: FactSheetSibling[] = (
      (sibRows ?? []) as { code: string; name: string }[]
    ).map((s) => ({ code: s.code, name: s.name }));

    // ---- assemble --------------------------------------------------------
    const data: FactSheetData = {
      code: certRow.code,
      name: i18nRow?.name ?? certRow.name,
      claim,
      description: i18nRow?.description ?? certRow.description ?? "",
      status: certRow.status,
      domains,
      numQuestions: certRow.num_questions,
      passingScorePct: certRow.passing_score_pct,
      examDurationMinutes: certRow.exam_duration_minutes,
      maxExamAttempts: certRow.max_exam_attempts,
      attemptWindowMonths: certRow.attempt_window_months,
      validityDays: certRow.validity_days,
      moduleCount: moduleIds.length,
      lessonCount,
      studyMinutes,
      siblings,
      blueprintComputedAt,
      cognitiveModelVersion,
    };

    // ---- cache -----------------------------------------------------------
    const stamps = [certRow.updated_at, i18nRow?.updated_at]
      .filter(Boolean)
      .sort()
      .join("");
    const version = contentVersion(stamps || certRow.updated_at);
    const path =
      `factsheet/v${FACTSHEET_RENDERER_VERSION}/${code}/${language}/${version}.pdf`;
    const filename = `${code}-factsheet-${language}.pdf`;

    const { data: hit } = await svc.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL, { download: filename });

    let cached = false;
    let signedUrl = hit?.signedUrl ?? null;

    if (signedUrl) {
      cached = true;
    } else {
      const pdfBytes = await renderFactSheet(data, language, SITE_BASE);
      const { error: upErr } = await svc.storage
        .from(BUCKET)
        .upload(path, pdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        });
      if (upErr) {
        console.error("asset upload failed", upErr);
        return jsonResponse({ error: "could not store asset" }, 500);
      }
      const { data: fresh, error: signErr } = await svc.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL, { download: filename });
      if (signErr || !fresh?.signedUrl) {
        console.error("could not sign fresh asset", signErr);
        return jsonResponse({ error: "could not sign asset" }, 500);
      }
      signedUrl = fresh.signedUrl;
    }

    // ---- audit -----------------------------------------------------------
    //
    // Logged on every generation, cached or not. The question the log answers
    // is "who obtained this file", and a cache hit is still an obtaining.
    // Best-effort: a logging failure must not deny the rep their document.
    const { error: logErr } = await svc.from("asset_downloads").insert({
      user_id: actor_user_id,
      asset_type: "factsheet",
      tier: "client_safe",
      certification_id: certRow.id,
      language,
    });
    if (logErr) console.warn("asset_downloads insert failed", logErr);

    return jsonResponse({
      url: signedUrl,
      filename,
      asset_type: "factsheet",
      certification_code: code,
      language,
      cached,
      domains: domains.length,
      descriptions_localized: descriptionsLocalized,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    console.error(err);
    return jsonResponse({ error: "asset generation failed" }, 500);
  }
});
