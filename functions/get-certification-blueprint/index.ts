// GET/POST /functions/v1/get-certification-blueprint
//
// PUBLIC endpoint (deploy with --no-verify-jwt). Returns a certification's
// public "blueprint" — its domains (with exam weight) and the plain-language
// tasks each domain tests, derived from the Job Task Analysis.
//
//   GET  ?cert=SM-I&lang=es-419   (cert | code ; lang | locale)
//   POST { cert | code, lang | locale }
//
// Why a dedicated public function: the domains/tasks tables are gated to
// authenticated users by RLS, but the blueprint is non-sensitive (it's the
// same thing we publish on marketing cert pages). A service-role read here is
// the single public path, used by the credential verify page (and available to
// any other public surface) so they all show one identical task list.
//
// CONSISTENCY: task selection mirrors lib/blueprint/data.ts exactly — ALL
// tasks for the cert, ordered by order_index, grouped by domain. No
// is_exam_scope filter, so this never diverges from the learner-facing
// blueprint. The score / mastery is user-specific and is never returned here.
//
// LOCALIZATION: when lang is es-419 / pt-BR, domain titles and task statements
// are overlaid from domain_translations / task_translations (English fallback
// per string), matching loadBlueprint. English base rows stay the source of
// truth; only the two rendered text fields are translated. Cert-agnostic.
//
// AI-ERA: each task is returned WITH its concepts (slug/name/description, the
// same non-sensitive JTA data the in-app blueprint reads). The AI-Era flag is
// NOT computed here — it is derived client-side via the single canonical rule
// in lib/blueprint/ai-era.ts, so there is exactly one definition of "AI-Era"
// across every surface and no copy of the term set lives in this Deno function.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    let cert: string | null = null;
    let lang: string | null = null;

    if (req.method === "GET") {
      const url = new URL(req.url);
      cert = url.searchParams.get("cert") ?? url.searchParams.get("code");
      lang = url.searchParams.get("lang") ?? url.searchParams.get("locale");
    } else if (req.method === "POST") {
      const body = (await req.json().catch(() => ({}))) as {
        cert?: string;
        code?: string;
        lang?: string;
        locale?: string;
      };
      cert = body.cert ?? body.code ?? null;
      lang = body.lang ?? body.locale ?? null;
    } else {
      return jsonResponse({ error: "method not allowed" }, 405);
    }

    if (!cert || !cert.trim()) {
      return jsonResponse({ error: "cert code required" }, 400);
    }

    const overlay = lang === "es-419" || lang === "pt-BR";

    const svc = getServiceClient();

    // Resolve the cert by code, case-insensitive (slug = lowercased code),
    // mirroring lib/certifications/data.ts getCertByCode.
    const { data: certRow } = await svc
      .from("certifications")
      .select("id, code, name, passing_score_pct")
      .ilike("code", cert.trim())
      .maybeSingle();

    if (!certRow) return jsonResponse({ found: false }, 404);

    const [{ data: domainData }, { data: taskData }] = await Promise.all([
      svc
        .from("domains")
        .select("id, code, title, weight_pct, order_index")
        .eq("certification_id", certRow.id)
        .order("order_index", { ascending: true }),
      svc
        .from("tasks")
        .select("id, code, statement, domain_id, order_index")
        .eq("certification_id", certRow.id)
        .order("order_index", { ascending: true }),
    ]);

    const taskRows = (taskData ?? []) as {
      id: string;
      code: string;
      statement: string;
      domain_id: string;
      order_index: number;
    }[];
    const domainRows = (domainData ?? []) as {
      id: string;
      code: string;
      title: string;
      weight_pct: number;
      order_index: number;
    }[];

    const taskIds = taskRows.map((t) => t.id);
    const domainIds = domainRows.map((d) => d.id);

    // ---- Concepts per task (for client-side AI-Era derivation) ----
    type ConceptInput = {
      slug: string | null;
      name: string | null;
      description: string | null;
    };
    const conceptsByTaskId = new Map<string, ConceptInput[]>();
    if (taskIds.length > 0) {
      const { data: tcData } = await svc
        .from("task_concepts")
        .select("task_id, concept_id")
        .in("task_id", taskIds);
      const tcRows = (tcData ?? []) as { task_id: string; concept_id: string }[];

      const conceptIds = Array.from(new Set(tcRows.map((r) => r.concept_id)));
      const conceptById = new Map<string, ConceptInput>();
      if (conceptIds.length > 0) {
        const { data: cData } = await svc
          .from("concepts")
          .select("id, slug, name, description")
          .in("id", conceptIds);
        for (const c of (cData ?? []) as {
          id: string;
          slug: string | null;
          name: string | null;
          description: string | null;
        }[]) {
          conceptById.set(c.id, {
            slug: c.slug,
            name: c.name,
            description: c.description,
          });
        }
      }

      for (const r of tcRows) {
        const c = conceptById.get(r.concept_id);
        if (!c) continue;
        let list = conceptsByTaskId.get(r.task_id);
        if (!list) {
          list = [];
          conceptsByTaskId.set(r.task_id, list);
        }
        list.push(c);
      }
    }

    // ---- JTA localization overlay (es-419 / pt-BR), English fallback ----
    const stmtByTask = new Map<string, string>();
    const titleByDomain = new Map<string, string>();
    if (overlay) {
      const [{ data: ttData }, { data: dtData }] = await Promise.all([
        taskIds.length > 0
          ? svc
              .from("task_translations")
              .select("task_id, statement")
              .in("task_id", taskIds)
              .eq("language", lang)
          : Promise.resolve({ data: [] }),
        domainIds.length > 0
          ? svc
              .from("domain_translations")
              .select("domain_id, title")
              .in("domain_id", domainIds)
              .eq("language", lang)
          : Promise.resolve({ data: [] }),
      ]);
      for (const r of (ttData ?? []) as { task_id: string; statement: string }[]) {
        stmtByTask.set(r.task_id, r.statement);
      }
      for (const r of (dtData ?? []) as { domain_id: string; title: string }[]) {
        titleByDomain.set(r.domain_id, r.title);
      }
    }

    const tasksByDomain = new Map<
      string,
      { code: string; statement: string; concepts: ConceptInput[] }[]
    >();
    for (const t of taskRows) {
      let list = tasksByDomain.get(t.domain_id);
      if (!list) {
        list = [];
        tasksByDomain.set(t.domain_id, list);
      }
      list.push({
        code: t.code,
        statement: stmtByTask.get(t.id) ?? t.statement,
        concepts: conceptsByTaskId.get(t.id) ?? [],
      });
    }

    const domains = domainRows.map((d) => ({
      code: d.code,
      title: titleByDomain.get(d.id) ?? d.title,
      weightPct: Number(d.weight_pct),
      tasks: tasksByDomain.get(d.id) ?? [],
    }));

    return jsonResponse({
      found: true,
      blueprint: {
        certCode: certRow.code,
        certName: certRow.name,
        passingScorePct: Number(certRow.passing_score_pct ?? 85),
        totalDomains: domains.length,
        totalTasks: taskRows.length,
        domains,
      },
    });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "blueprint lookup failed" }, 500);
  }
});
