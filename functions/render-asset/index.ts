// POST /functions/v1/render-asset
//
// Body: { asset_type: "factsheet" | "specimen_certificate" | "blueprint_sheet"
//                   | "jta_sheet",
//         certification_code: string, language?: "en" | "es-419" | "pt-BR" }
// Auth: Bearer JWT - MUST be platform_admin or marketing.
//
// v6: cache keys are CONTENT-ADDRESSED. See "CACHING" below - it replaces three
// earlier attempts and closes the class of bug rather than another instance.
//
// GATED, NOT PUBLIC. verify_jwt stays ON - the caller must be staff. The public
// forwarding URLs in SALES-LIBRARY-SPEC §9 are a separate endpoint; that is
// where verify_jwt = false gets pinned in config.toml. Making THIS function
// public would let anyone enumerate assets and would bypass the download log.
//
// CACHING — WHY THE KEY IS A HASH OF THE DOCUMENT, NOT A LIST OF TIMESTAMPS
//
// Earlier versions built the storage path from source updated_at values, and
// the key had to be extended every time a new source turned out to matter:
//
//   v3  certifications.updated_at + certification_i18n.updated_at
//   v4  + exam_blueprint.computed_at, because editing a task's Bloom level
//       never touches the certification row
//   v4  + tasks.updated_at and task_translations.updated_at for the JTA, because
//       migration 091 had already superseded five task statements once
//   v6  ...and then migration 162 rewrote every domain description, which none
//       of the above notice.
//
// Three extensions, each prompted by discovering a stale document. The list
// approach cannot be finished: it fails silently, and it fails in the direction
// of serving a client a PDF that no longer matches the database.
//
// Timestamps were also not reliably available. domain_translations carries
// updated_at; whether `domains` does, and whether anything maintains it on
// write, was never verified. A key that silently fails to move is worse than
// no key.
//
// So the key is a hash of the assembled data object - exactly what the renderer
// will draw. Every branch already builds that object in full BEFORE the cache
// lookup, so this costs one SHA-256 over a few kilobytes and nothing else.
//
//   Anything the document renders changes the hash.
//   Anything it does not render leaves the hash alone, which is correct: the
//   PDF really is identical.
//   No source can be forgotten, because none is enumerated.
//
// The renderer version stays as a path SEGMENT so a layout change still
// invalidates everything, independently of the data.
//
// K/S/A LANGUAGE RULE — READ BEFORE CHANGING THE JTA BRANCH
//
// Knowledge, skills and abilities live in English on `tasks`. Migration 161
// added matching columns to `task_translations`, initially empty.
//
// v4 inferred "this language has K/S/A" from the translation query SUCCEEDING,
// and fell back per field to the English column. The moment those columns
// existed but were empty, that inference became true while the data was absent,
// and every Spanish sheet would have rendered Spanish task statements beside
// English knowledge statements.
//
// Two rules now, and neither is negotiable:
//
//   1. A NON-ENGLISH DOCUMENT NEVER READS THE ENGLISH K/S/A COLUMNS. Translated
//      values or nothing. A query succeeding says the column exists, which is
//      not the same claim as the row being translated.
//
//   2. ALL OR NOTHING PER LANGUAGE. K/S/A renders only when EVERY task that has
//      English K/S/A also has it translated. Partial coverage would scatter
//      blanks through a fifteen-page document and read as data loss.
//
// TOLERANT TRANSLATION READS. domain_translations and task_translations are
// asked for their richest shape first; if a column is absent the request fails
// and we retry for the minimum, rather than losing translated titles and
// statements as collateral. Responses report what was actually localized.
//
// PROVISIONAL TRANSLATIONS ARE EXCLUDED. Both translation tables carry
// is_provisional, which distinguishes reviewed copy from unreviewed. A document
// a rep emails to a buyer is the last place to ignore that.
//
// NOTE ON SELECT STRINGS: single literals, never built with `+`. supabase-js
// parses the select as a template-literal type; a concatenated string degrades
// the response to GenericStringError and breaks the typed build in the web app.

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
import {
  renderEngineBrief,
  ENGINE_BRIEF_RENDERER_VERSION,
  type EngineBriefData,
} from "../_shared/enginebrief.ts";
import {
  renderWhatIsCertidemy,
  WHATIS_RENDERER_VERSION,
  type WhatIsCertidemyData,
} from "../_shared/whatis.ts";
import {
  renderObjections,
  OBJECTIONS_RENDERER_VERSION,
  type ObjectionsData,
} from "../_shared/objections.ts";

const BUCKET = "sales-assets";
const SIGNED_URL_TTL = 60 * 60;
const LOCALES: AssetLocale[] = ["en", "es-419", "pt-BR"];
const CLIENT_SAFE_STATUSES = ["available", "coming_soon"];
const IMPLEMENTED = [
  "factsheet",
  "specimen_certificate",
  "blueprint_sheet",
  "jta_sheet",
  "engine_brief",
  "what_is_certidemy",
  "objections_brief",
];

/**
 * Assets that describe the PLATFORM rather than one certification. They carry no
 * certification_code, so the code guard is skipped for them and they branch
 * before the certification lookup.
 *
 * A list, not a boolean: the next platform document should be one entry here
 * rather than another special case.
 */
const PLATFORM_ASSETS = ["what_is_certidemy", "objections_brief"];
const SITE_BASE = Deno.env.get("PUBLIC_SITE_URL") ?? "https://certidemy.com";

/**
 * Only reviewed translations reach a client-facing document. Set to false only
 * with a deliberate decision that unreviewed copy is acceptable in a buyer's
 * hands - it governs every asset this function renders, in every language.
 */
const REVIEWED_TRANSLATIONS_ONLY = true;

/**
 * 16 hex characters of SHA-256 over the exact object the renderer receives.
 *
 * Key order is stable because these objects are built by literal expressions in
 * fixed order, so JSON.stringify is deterministic here. If a future branch ever
 * assembles its data dynamically, sort the keys before hashing or two identical
 * documents will cache separately - wasteful, but never wrong.
 */
async function contentHash(data: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * A second signature for the same object, WITHOUT a download disposition, so a
 * console preview can render it inline in an iframe.
 *
 * The download variant sets Content-Disposition: attachment, which makes a
 * browser save the file rather than display it. The download query parameter
 * does not affect the signature and could be stripped client-side instead, but
 * that relies on an implementation detail: if it changed, previews would
 * silently start downloading files with nothing in any log.
 *
 * Costs a signature computation and no I/O. The object is content-addressed and
 * already cached, so a preview followed by a download renders nothing twice.
 */
async function signInline(
  // deno-lint-ignore no-explicit-any
  svc: any,
  path: string,
): Promise<string | null> {
  const { data } = await svc.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  return data?.signedUrl ?? null;
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

type KsaTriple = {
  knowledge: string | null;
  skills: string | null;
  abilities: string | null;
};

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
    const isPlatformAsset = PLATFORM_ASSETS.includes(assetType);
    if (!isPlatformAsset && !code) {
      return jsonResponse({ error: "certification_code required" }, 400);
    }
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

    // ---- platform-level assets ------------------------------------------
    //
    // Before the certification lookup, because there is nothing to look up.
    // Authorization has already happened above; nothing else from the
    // certification path applies here.
    if (assetType === "what_is_certidemy") {
      const { data: certRows, error: cErr } = await svc
        .from("certifications")
        .select("id, status, category_slug");
      if (cErr) {
        console.error("catalogue count failed", cErr);
        return jsonResponse({ error: "lookup failed" }, 500);
      }
      const allCerts = (certRows ?? []) as {
        id: string;
        status: string;
        category_slug: string | null;
      }[];

      // Only what a visitor can actually see. A draft or archived certification
      // inflating these figures would undercut the one document whose whole
      // argument is that our numbers are checkable.
      const visible = allCerts.filter((c) => CLIENT_SAFE_STATUSES.includes(c.status));
      const openCount = visible.filter((c) => c.status === "available").length;
      const visibleIds = visible.map((c) => c.id);

      let domainCount = 0;
      let taskCount = 0;
      if (visibleIds.length > 0) {
        const { count: dc } = await svc
          .from("domains")
          .select("id", { count: "exact", head: true })
          .in("certification_id", visibleIds);
        const { count: tc } = await svc
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .in("certification_id", visibleIds);
        domainCount = dc ?? 0;
        taskCount = tc ?? 0;
      }

      const programCount = new Set(
        visible.map((c) => c.category_slug).filter(Boolean),
      ).size;

      const whatisData: WhatIsCertidemyData = {
        certificationsAvailable: openCount,
        certificationsTotal: visible.length,
        programs: programCount,
        domains: domainCount,
        tasks: taskCount,
        languages: LOCALES.length,
      };

      const whatisVersion = await contentHash(whatisData);
      const whatisPath =
        `platform/whatis/v${WHATIS_RENDERER_VERSION}/${language}/${whatisVersion}.pdf`;
      const whatisFilename = `certidemy-what-is-${language}.pdf`;

      const { data: whatisHit } = await svc.storage
        .from(BUCKET)
        .createSignedUrl(whatisPath, SIGNED_URL_TTL, { download: whatisFilename });

      let whatisCached = false;
      let whatisUrl = whatisHit?.signedUrl ?? null;

      if (whatisUrl) {
        whatisCached = true;
      } else {
        const bytes = await renderWhatIsCertidemy(whatisData, language, SITE_BASE);
        const { error: upErr } = await svc.storage
          .from(BUCKET)
          .upload(whatisPath, bytes, {
            contentType: "application/pdf",
            upsert: true,
          });
        if (upErr) {
          console.error("what-is upload failed", upErr);
          return jsonResponse({ error: "could not store asset" }, 500);
        }
        const { data: fresh, error: signErr } = await svc.storage
          .from(BUCKET)
          .createSignedUrl(whatisPath, SIGNED_URL_TTL, { download: whatisFilename });
        if (signErr || !fresh?.signedUrl) {
          console.error("could not sign fresh what-is", signErr);
          return jsonResponse({ error: "could not sign asset" }, 500);
        }
        whatisUrl = fresh.signedUrl;
      }

      // certification_id is null - this document is not about one. See the header
      // note if that column turns out to be NOT NULL.
      const { error: whatisLogErr } = await svc.from("asset_downloads").insert({
        user_id: actor_user_id,
        asset_type: "what_is_certidemy",
        tier: "client_safe",
        certification_id: null,
        language,
      });
      if (whatisLogErr) console.warn("asset_downloads insert failed", whatisLogErr);

      return jsonResponse({
        url: whatisUrl,
        filename: whatisFilename,
        preview_url: await signInline(svc, whatisPath),
        asset_type: "what_is_certidemy",
        language,
        cached: whatisCached,
        content_hash: whatisVersion,
        // Echoed so a caller can see what the document will claim without
        // opening it.
        catalogue: whatisData,
      });
    }

    // ---- objections, INTERNAL tier ---------------------------------------
    //
    // Platform-level, so it branches here beside what_is_certidemy and before
    // the certification lookup. Authorization already happened above.
    //
    // PER-RECIPIENT BY DESIGN. The band, the diagonal watermark and the footer
    // all carry the address this copy was generated for, which is the only
    // thing making the library modal's "watermarked" warning true. So the
    // address MUST be in the cache key: a document keyed on language alone
    // would serve the first rep's stamped file to the second, correct in
    // appearance, signed to the wrong person, and logged nowhere.
    if (assetType === "objections_brief") {
      const { data: actorAuth } = await svc.auth.admin.getUserById(actor_user_id);
      const recipientEmail = actorAuth?.user?.email ?? actor_user_id;
    
      const objectionsData: ObjectionsData = { recipientEmail };
    
      const objVersion = await contentHash(objectionsData);
      const objPath =
        `platform/objections/v${OBJECTIONS_RENDERER_VERSION}/${language}/${objVersion}.pdf`;
      // The filename names its own tier, so a forwarded file announces the
      // mistake in the recipient's download list.
      const objFilename = `certidemy-objections-INTERNAL-${language}.pdf`;
    
      const { data: objHit } = await svc.storage
        .from(BUCKET)
        .createSignedUrl(objPath, SIGNED_URL_TTL, { download: objFilename });
    
      let objCached = false;
      let objUrl = objHit?.signedUrl ?? null;
    
      if (objUrl) {
        objCached = true;
      } else {
        const bytes = await renderObjections(objectionsData, language, SITE_BASE);
        const { error: upErr } = await svc.storage
          .from(BUCKET)
          .upload(objPath, bytes, {
            contentType: "application/pdf",
            upsert: true,
          });
        if (upErr) {
          console.error("objections upload failed", upErr);
          return jsonResponse({ error: "could not store asset" }, 500);
        }
        const { data: fresh, error: signErr } = await svc.storage
          .from(BUCKET)
          .createSignedUrl(objPath, SIGNED_URL_TTL, { download: objFilename });
        if (signErr || !fresh?.signedUrl) {
          console.error("could not sign fresh objections", signErr);
          return jsonResponse({ error: "could not sign asset" }, 500);
        }
        objUrl = fresh.signedUrl;
      }
    
      // certification_id is null - this document is not about one.
      const { error: objLogErr } = await svc.from("asset_downloads").insert({
        user_id: actor_user_id,
        asset_type: "objections_brief",
        tier: "internal",
        certification_id: null,
        language,
      });
      if (objLogErr) console.warn("asset_downloads insert failed", objLogErr);
    
      return jsonResponse({
        url: objUrl,
        filename: objFilename,
        preview_url: await signInline(svc, objPath),
        asset_type: "objections_brief",
        language,
        cached: objCached,
        content_hash: objVersion,
      });
    }

    // ---- certification --------------------------------------------------
    //
    // price_usd is deliberately NOT selected. No asset in this library renders
    // a price. Not fetching it is stronger than fetching and remembering not to
    // use it. Spec §3.4.
    const { data: certRow, error: certErr } = await svc
      .from("certifications")
      .select(
        "id, code, name, description, num_questions, passing_score_pct, exam_duration_minutes, max_exam_attempts, attempt_window_months, validity_days, status, category_slug, sort_order, exam_blueprint"
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
    // Delegated, not duplicated. get-credential-certificate owns the versioned
    // locale-scoped path, the lazy render and the specimen marks. It also owns
    // its own caching, which is why nothing here hashes anything.
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
            detail: "Mint one with certidemy-web/scripts/mint-specimens.mjs.",
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
    const { data: i18nRow } = await svc
      .from("certification_i18n")
      .select("name, claim, description")
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

      const statements = new Map<string, string>();
      const ksa = new Map<string, KsaTriple>();
      let statementsLocalized = language === "en";
      let ksaColumnsExist = language === "en";

      if (language !== "en") {
        const ids = tasks.map((t) => t.id);

        let rich = svc
          .from("task_translations")
          .select("task_id, statement, knowledge, skills, abilities")
          .in("task_id", ids)
          .eq("language", language);
        if (REVIEWED_TRANSLATIONS_ONLY) rich = rich.eq("is_provisional", false);
        const richRes = await rich;

        if (!richRes.error) {
          statementsLocalized = true;
          ksaColumnsExist = true;
          for (
            const r of (richRes.data ?? []) as {
              task_id: string;
              statement: string | null;
              knowledge: string | null;
              skills: string | null;
              abilities: string | null;
            }[]
          ) {
            if (r.statement) statements.set(r.task_id, r.statement);
            ksa.set(r.task_id, {
              knowledge: r.knowledge,
              skills: r.skills,
              abilities: r.abilities,
            });
          }
        } else {
          let lean = svc
            .from("task_translations")
            .select("task_id, statement")
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
              }[]
            ) {
              if (r.statement) statements.set(r.task_id, r.statement);
            }
          } else {
            console.warn("task_translations unreadable", leanRes.error.message);
          }
        }
      }

      // ---- the K/S/A language decision ---------------------------------
      //
      // Coverage is measured against what English actually carries: a task with
      // no English abilities statement does not need a translated one.
      const tasksWithEnglishKsa = tasks.filter(
        (t) => t.knowledge || t.skills || t.abilities,
      );
      const tasksWithTranslatedKsa = tasksWithEnglishKsa.filter((t) => {
        const tr = ksa.get(t.id);
        if (!tr) return false;
        if (t.knowledge && !tr.knowledge) return false;
        if (t.skills && !tr.skills) return false;
        if (t.abilities && !tr.abilities) return false;
        return true;
      });

      const ksaComplete =
        tasksWithEnglishKsa.length > 0 &&
        tasksWithTranslatedKsa.length === tasksWithEnglishKsa.length;

      const showKsa = language === "en"
        ? tasksWithEnglishKsa.length > 0
        : ksaColumnsExist && ksaComplete;

      const jtaDomains: JtaDomain[] = domainBase.map((d) => {
        const list: JtaTask[] = tasks
          .filter((t) => t.domain_id === d.id)
          .sort(byTaskCode)
          .map((t) => {
            // NEVER `?? t.knowledge` for a non-English document.
            const tr = ksa.get(t.id);
            const triple: KsaTriple = !showKsa
              ? { knowledge: null, skills: null, abilities: null }
              : language === "en"
              ? { knowledge: t.knowledge, skills: t.skills, abilities: t.abilities }
              : {
                knowledge: tr?.knowledge ?? null,
                skills: tr?.skills ?? null,
                abilities: tr?.abilities ?? null,
              };
            return {
              code: t.code,
              statement: statements.get(t.id) ?? t.statement,
              criticality: t.criticality,
              frequency: t.frequency,
              bloomLevel: t.bloom_level,
              isExamScope: t.is_exam_scope,
              isSimulationCandidate: t.is_simulation_candidate,
              ...triple,
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

      const jtaVersion = await contentHash(jtaData);
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
        preview_url: await signInline(svc, jtaPath),
        asset_type: "jta_sheet",
        certification_code: code,
        language,
        cached: jtaCached,
        content_hash: jtaVersion,
        domains: jtaDomains.length,
        tasks_declared: jtaData.totalTasks,
        tasks_examined: jtaData.examScopeTasks,
        statements_localized: statementsLocalized,
        descriptions_localized: descriptionsLocalized,
        ksa_included: showKsa,
        ksa_translated: tasksWithTranslatedKsa.length,
        ksa_total: tasksWithEnglishKsa.length,
      });
    }

    // =====================================================================
    // ENGINE BRIEF - "How the examination works"
    // =====================================================================
    if (assetType === "engine_brief") {
      if (domainBase.length === 0) {
        return jsonResponse(
          {
            error: "no domains for this certification",
            detail:
              "This document describes how an examination is assembled from a blueprint. With no domains there is no blueprint to describe.",
          },
          409,
        );
      }

      // Declared vs examined. The gap is the honest part of the scheme - tasks
      // above the multiple-choice ceiling, declared and marked as not examined -
      // and a document about examination integrity that omitted it would make
      // the credential sound broader than it is.
      const { data: briefTaskRows, error: btErr } = await svc
        .from("tasks")
        .select("is_exam_scope")
        .eq("certification_id", certRow.id);
      if (btErr) {
        console.error("task count lookup failed", btErr);
        return jsonResponse({ error: "lookup failed" }, 500);
      }
      const briefTasks = (briefTaskRows ?? []) as { is_exam_scope: boolean }[];

      // Languages this examination can ACTUALLY be sat in - approved,
      // exam-scope items in the secure pool. Not the platform's three: a
      // certification with no Portuguese secure items must not claim it.
      const { data: secureLangRows } = await svc
        .from("quiz_questions")
        .select("language")
        .eq("certification_id", certRow.id)
        .eq("pool", "secure")
        .eq("status", "approved")
        .eq("is_exam_scope", true);

      const langSet = new Set(
        ((secureLangRows ?? []) as { language: string }[]).map((r) => r.language),
      );

      if (langSet.size === 0) {
        // No secure items at all - the coming_soon case, which the document
        // header already marks. Fall back to the localized delivery languages
        // so the row is not blank, rather than asserting examinability.
        const { data: i18nLangRows } = await svc
          .from("certification_i18n")
          .select("lang")
          .eq("certification_id", certRow.id);
        for (const r of (i18nLangRows ?? []) as { lang: string }[]) langSet.add(r.lang);
      }

      // Self-naming, so the list reads correctly in all three documents without
      // a 3x3 mapping table. Same convention every language picker uses.
      const LANG_NAME: Record<string, string> = {
        "en": "English",
        "es-419": "Espa\u00f1ol (LATAM)",
        "pt-BR": "Portugu\u00eas (BR)",
      };
      const briefLanguages = [...langSet].sort().map((l) => LANG_NAME[l] ?? l);

      const briefData: EngineBriefData = {
        code: certRow.code,
        name: i18nRow?.name ?? certRow.name,
        status: certRow.status,
        numQuestions: certRow.num_questions,
        passingScorePct: certRow.passing_score_pct,
        examDurationMinutes: certRow.exam_duration_minutes,
        maxExamAttempts: certRow.max_exam_attempts ?? null,
        attemptWindowMonths: certRow.attempt_window_months ?? null,
        validityDays: certRow.validity_days ?? null,
        domainCount: domainBase.length,
        totalTasks: briefTasks.length,
        examScopeTasks: briefTasks.filter((t) => t.is_exam_scope).length,
        languages: briefLanguages,
        blueprintComputedAt,
        cognitiveModelVersion,
      };

      const briefVersion = await contentHash(briefData);
      const briefPath =
        `engine/v${ENGINE_BRIEF_RENDERER_VERSION}/${code}/${language}/${briefVersion}.pdf`;
      const briefFilename = `${code}-how-the-exam-works-${language}.pdf`;

      const { data: briefHit } = await svc.storage
        .from(BUCKET)
        .createSignedUrl(briefPath, SIGNED_URL_TTL, { download: briefFilename });

      let briefCached = false;
      let briefUrl = briefHit?.signedUrl ?? null;

      if (briefUrl) {
        briefCached = true;
      } else {
        const bytes = await renderEngineBrief(briefData, language, SITE_BASE);
        const { error: upErr } = await svc.storage
          .from(BUCKET)
          .upload(briefPath, bytes, {
            contentType: "application/pdf",
            upsert: true,
          });
        if (upErr) {
          console.error("engine brief upload failed", upErr);
          return jsonResponse({ error: "could not store asset" }, 500);
        }
        const { data: fresh, error: signErr } = await svc.storage
          .from(BUCKET)
          .createSignedUrl(briefPath, SIGNED_URL_TTL, { download: briefFilename });
        if (signErr || !fresh?.signedUrl) {
          console.error("could not sign fresh engine brief", signErr);
          return jsonResponse({ error: "could not sign asset" }, 500);
        }
        briefUrl = fresh.signedUrl;
      }

      const { error: briefLogErr } = await svc.from("asset_downloads").insert({
        user_id: actor_user_id,
        asset_type: "engine_brief",
        tier: "client_safe",
        certification_id: certRow.id,
        language,
      });
      if (briefLogErr) console.warn("asset_downloads insert failed", briefLogErr);

      return jsonResponse({
        url: briefUrl,
        filename: briefFilename,
        preview_url: await signInline(svc, briefPath),
        asset_type: "engine_brief",
        certification_code: code,
        language,
        cached: briefCached,
        content_hash: briefVersion,
        domains: briefData.domainCount,
        tasks_declared: briefData.totalTasks,
        tasks_examined: briefData.examScopeTasks,
        // What the document will actually claim about availability, so a caller
        // can see it without opening the PDF.
        languages: briefLanguages,
        languages_from: langSet.size > 0 ? "secure_pool" : "delivery_i18n",
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

      const bpVersion = await contentHash(bpData);
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
        preview_url: await signInline(svc, bpPath),
        asset_type: "blueprint_sheet",
        certification_code: code,
        language,
        cached: bpCached,
        content_hash: bpVersion,
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

    const version = await contentHash(data);
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
      preview_url: await signInline(svc, path),
      asset_type: "factsheet",
      certification_code: code,
      language,
      cached,
      content_hash: version,
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
