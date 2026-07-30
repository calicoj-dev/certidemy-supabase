/**
 * patch-render-asset-whatis.mjs
 *
 * Adds `what_is_certidemy` - the first PLATFORM-LEVEL asset in the library - and
 * fixes a display case the live numbers exposed.
 *
 * INDENTATION NOTE - WHY THE FIRST ATTEMPT FAILED
 *
 * In render-asset the handler nests: serve(async (req) => { at 0, try { at 2, and
 * the body at 4. The first version of this script wrote its anchors and its
 * branch at 6, assuming one nesting level that is not there, and matched nothing.
 *
 * That is the third time tonight an anchor has been written a level too deep. The
 * dot-rendered failure output is what makes it visible; without it a zero-match
 * looks like a stale anchor.
 *
 * ============================================================================
 * WHY THE BRANCH SITS BETWEEN AUTHORIZATION AND THE CERTIFICATION LOOKUP
 * ============================================================================
 *
 * Every existing asset resolves a certification first and branches second. This
 * one has no certification, so it runs after authorization and before the lookup -
 * a gap that did not previously need a name.
 *
 * The `certification_code required` guard becomes conditional, because a platform
 * asset legitimately arrives without a code and that guard would make the branch
 * unreachable. PLATFORM_ASSETS is a list rather than a boolean so the next such
 * document is one array entry instead of another special case.
 *
 * ============================================================================
 * THE NUMBERS COUNT ONLY WHAT A VISITOR CAN SEE
 * ============================================================================
 *
 * Domains and declared tasks are counted across CLIENT_SAFE certifications only.
 * A draft or archived certification inflating them would undercut the one
 * document whose entire argument is that our numbers are checkable.
 *
 * "7 OF 7" - the live catalogue has 7 certifications, all available, so the
 * original template rendered "7 of 7 certifications open". That reads as a bug
 * rather than as completeness, so the renderer now prints a single number when
 * available equals total. Worth noticing that the flaw only appeared once real
 * data went through it.
 *
 * ============================================================================
 * ONE THING TO WATCH: asset_downloads.certification_id
 * ============================================================================
 *
 * This branch logs with certification_id null. If the column is NOT NULL the
 * insert fails - and the existing code only WARNS on a failed log rather than
 * failing the request, which is right for analytics but means a constraint here
 * would silently stop recording platform assets. Check it.
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:DRY_RUN="1"; node scripts\patch-render-asset-whatis.mjs
 *   Remove-Item Env:\DRY_RUN; node scripts\patch-render-asset-whatis.mjs
 *
 * Deploy only AFTER the live run reports success.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const RA =
  "C:/Users/Juan/Documents/certidemy/supabase/functions/render-asset/index.ts";
const WI = "C:/Users/Juan/Documents/certidemy/supabase/functions/_shared/whatis.ts";
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());

/* ====================================================================== */
/* render-asset/index.ts                                                  */
/* ====================================================================== */

const A1_FROM = '} from "../_shared/enginebrief.ts";';
const A1_TO = [
  '} from "../_shared/enginebrief.ts";',
  "import {",
  "  renderWhatIsCertidemy,",
  "  WHATIS_RENDERER_VERSION,",
  "  type WhatIsCertidemyData,",
  '} from "../_shared/whatis.ts";',
].join("\n");

const A2_FROM = ['  "engine_brief",', "];"].join("\n");
const A2_TO = [
  '  "engine_brief",',
  '  "what_is_certidemy",',
  "];",
  "",
  "/**",
  " * Assets that describe the PLATFORM rather than one certification. They carry no",
  " * certification_code, so the code guard is skipped for them and they branch",
  " * before the certification lookup.",
  " *",
  " * A list, not a boolean: the next platform document should be one entry here",
  " * rather than another special case.",
  " */",
  'const PLATFORM_ASSETS = ["what_is_certidemy"];',
].join("\n");

/* 4-space base - see the indentation note above. */
const A3_FROM =
  '    if (!code) return jsonResponse({ error: "certification_code required" }, 400);';
const A3_TO = [
  "    const isPlatformAsset = PLATFORM_ASSETS.includes(assetType);",
  "    if (!isPlatformAsset && !code) {",
  '      return jsonResponse({ error: "certification_code required" }, 400);',
  "    }",
].join("\n");

const A4_FROM = [
  "    // ---- certification --------------------------------------------------",
  "    //",
  "    // price_usd is deliberately NOT selected. No asset in this library renders",
].join("\n");

const BRANCH = `    // ---- platform-level assets ------------------------------------------
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
        \`platform/whatis/v\${WHATIS_RENDERER_VERSION}/\${language}/\${whatisVersion}.pdf\`;
      const whatisFilename = \`certidemy-what-is-\${language}.pdf\`;

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

`;

const A4_TO = BRANCH + A4_FROM;

/* ====================================================================== */
/* _shared/whatis.ts - the 7-of-7 case                                    */
/* ====================================================================== */

const A5_FROM =
  "      [`${data.certificationsAvailable} ${S.cOf} ${data.certificationsTotal}`, S.cCerts],";
const A5_TO = [
  "      // A single number when everything in the catalogue is open: '7 of 7'",
  "      // reads as a bug rather than as completeness.",
  "      [",
  "        data.certificationsAvailable === data.certificationsTotal",
  "          ? String(data.certificationsAvailable)",
  "          : `${data.certificationsAvailable} ${S.cOf} ${data.certificationsTotal}`,",
  "        S.cCerts,",
  "      ],",
].join("\n");

const FILES = [
  [
    RA,
    "render-asset/index.ts",
    "what_is_certidemy",
    [
      ["import the renderer", A1_FROM, A1_TO],
      ["IMPLEMENTED + PLATFORM_ASSETS", A2_FROM, A2_TO],
      ["conditional code guard", A3_FROM, A3_TO],
      ["the what_is_certidemy branch", A4_FROM, A4_TO],
    ],
  ],
  [
    WI,
    "_shared/whatis.ts",
    "reads as a bug rather than as completeness",
    [["single number when all open", A5_FROM, A5_TO]],
  ],
];

console.log("what_is_certidemy " + (DRY_RUN ? "[DRY RUN]" : "[LIVE]") + "\n");

const staged = [];
let bad = 0;

for (const [path, label, sentinel, edits] of FILES) {
  if (!existsSync(path)) {
    console.log("  FAIL " + label + ": not found");
    bad += 1;
    continue;
  }
  let text = readFileSync(path, "utf8");
  const isCRLF = text.includes("\r\n");
  const nl = (s) => (isCRLF ? s.replace(/\n/g, "\r\n") : s);

  console.log("== " + label + " (" + (isCRLF ? "CRLF" : "LF") + ") ==");

  if (text.includes(sentinel)) {
    console.log("  --   already patched - skipping file\n");
    continue;
  }

  let ok = true;
  for (const [editLabel, from] of edits) {
    const hits = text.split(nl(from)).length - 1;
    if (hits === 1) {
      console.log("  ok   " + editLabel);
    } else {
      console.log("  FAIL " + editLabel + ": found " + hits + " times, expected 1");
      console.log(
        from
          .split("\n")
          .slice(0, 4)
          .map((l) => "         |" + l.replace(/^ +/, (m) => ".".repeat(m.length)))
          .join("\n"),
      );
      ok = false;
      bad += 1;
    }
  }
  if (ok) {
    for (const [, from, to] of edits) text = text.replace(nl(from), nl(to));
    staged.push([path, label, text]);
  }
  console.log("");
}

if (bad > 0) {
  console.log(bad + " edit(s) failed. NOTHING written across either file.");
  process.exit(1);
}

/* The branch must precede the certification lookup or it is unreachable. */
const raEntry = staged.find(([, label]) => label === "render-asset/index.ts");
if (raEntry) {
  const t = raEntry[2];
  const branchAt = t.indexOf('if (assetType === "what_is_certidemy")');
  const certAt = t.indexOf("// ---- certification ---");
  if (branchAt === -1 || (certAt !== -1 && branchAt > certAt)) {
    console.log("FAIL: branch is not before the certification lookup. Nothing written.");
    process.exit(1);
  }
  console.log("branch precedes the certification lookup: ok");
}

if (staged.length === 0) {
  console.log("Nothing to do.");
  process.exit(0);
}

for (const [path, label, text] of staged) {
  if (DRY_RUN) {
    console.log("would write " + label + " (" + text.length + " bytes)");
  } else {
    writeFileSync(path, text, { encoding: "utf8" });
    console.log("wrote " + label);
  }
}

if (!DRY_RUN) {
  console.log("");
  console.log("NOW deploy: supabase functions deploy render-asset");
}
