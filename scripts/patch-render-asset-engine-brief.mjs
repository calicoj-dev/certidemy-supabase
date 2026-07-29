/**
 * patch-render-asset-engine-brief.mjs
 *
 * Adds the engine_brief asset type to render-asset: "How the examination works",
 * per certification, trilingual.
 *
 * THREE ANCHORED EDITS, ALL VALIDATED BEFORE ANY ARE APPLIED
 *   1. import the renderer
 *   2. add "engine_brief" to IMPLEMENTED
 *   3. the branch itself, inserted before the BLUEPRINT SHEET section
 *
 * WHY LANGUAGES ARE DERIVED, NOT ASSERTED
 *
 * The other renderers hardcode "English, Spanish (LATAM), Portuguese (Brazil)"
 * because that is the platform's delivery promise. This document is different:
 * it makes a claim about what THIS examination can be sat in, and a
 * certification whose secure pool has no Portuguese items must not say it is
 * available in Portuguese.
 *
 * So the list comes from the secure pool - approved, exam-scope items, grouped
 * by language. It falls back to the localized delivery languages only when the
 * secure pool is empty entirely, which is the coming_soon case the document
 * header already caveats.
 *
 * Language names are self-naming (English / Espanol / Portugues) so the list
 * reads correctly in all three documents without a 3x3 mapping table. That is
 * also the convention every language picker uses.
 *
 * WHY TASK COUNTS ARE FETCHED HERE
 *
 * declared vs examined. The gap is the honest part of the whole scheme - tasks
 * above the multiple-choice ceiling, declared and openly marked as not examined
 * - and a document about examination integrity that omitted it would be making
 * the credential sound broader than it is.
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:DRY_RUN="1"; node scripts\patch-render-asset-engine-brief.mjs
 *   Remove-Item Env:\DRY_RUN; node scripts\patch-render-asset-engine-brief.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SRC =
  "C:/Users/Juan/Documents/certidemy/supabase/functions/render-asset/index.ts";
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());

/* ---- 1. import ------------------------------------------------------- */

const A1_FROM = '} from "../_shared/jta.ts";';
const A1_TO = [
  '} from "../_shared/jta.ts";',
  'import {',
  '  renderEngineBrief,',
  '  ENGINE_BRIEF_RENDERER_VERSION,',
  '  type EngineBriefData,',
  '} from "../_shared/enginebrief.ts";',
].join("\n");

/* ---- 2. IMPLEMENTED -------------------------------------------------- */

const A2_FROM = ['  "jta_sheet",', "];"].join("\n");
const A2_TO = ['  "jta_sheet",', '  "engine_brief",', "];"].join("\n");

/* ---- 3. the branch --------------------------------------------------- */

const A3_FROM = [
  "    // =====================================================================",
  "    // BLUEPRINT SHEET",
  "    // =====================================================================",
].join("\n");

const BRANCH = `    // =====================================================================
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
        "es-419": "Espa\\u00f1ol (LATAM)",
        "pt-BR": "Portugu\\u00eas (BR)",
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
        \`engine/v\${ENGINE_BRIEF_RENDERER_VERSION}/\${code}/\${language}/\${briefVersion}.pdf\`;
      const briefFilename = \`\${code}-how-the-exam-works-\${language}.pdf\`;

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

`;

const A3_TO = BRANCH + A3_FROM;

const EDITS = [
  ["import the renderer", A1_FROM, A1_TO],
  ["IMPLEMENTED gains engine_brief", A2_FROM, A2_TO],
  ["the engine_brief branch", A3_FROM, A3_TO],
];

if (!existsSync(SRC)) {
  console.error("render-asset/index.ts not found at " + SRC);
  process.exit(1);
}

let text = readFileSync(SRC, "utf8");
const before = text.length;

console.log("render-asset engine_brief " + (DRY_RUN ? "[DRY RUN]" : "[LIVE]") + "\n");

if (text.includes("engine_brief")) {
  console.log("  already patched - 'engine_brief' is present. Nothing to do.");
  process.exit(0);
}

/* ---- phase 1: validate every anchor before touching anything -------- */
let bad = 0;
for (const [label, from] of EDITS) {
  const hits = text.split(from).length - 1;
  if (hits === 1) {
    console.log("  ok   " + label);
  } else {
    console.log("  FAIL " + label + ": anchor found " + hits + " times, expected 1");
    console.log(from.split("\n").map((l) => "         " + l).join("\n"));
    bad += 1;
  }
}
if (bad > 0) {
  console.log("\n" + bad + " anchor(s) did not match. NOTHING written.");
  process.exit(1);
}

/* ---- phase 2: apply ------------------------------------------------- */
for (const [, from, to] of EDITS) {
  text = text.replace(from, to);
}

console.log("\nbytes " + before + " -> " + text.length);

if (DRY_RUN) {
  console.log("\nDRY RUN - nothing written. All three anchors matched.");
} else {
  writeFileSync(SRC, text, { encoding: "utf8" });
  console.log("\nwritten.");
  console.log("Deploy: supabase functions deploy render-asset");
  console.log("");
  console.log("Nothing calls it yet - library-flow needs the action wired up next.");
}
