/**
 * patch-open-badge-baked.mjs
 *
 * Adds `?doc=baked&code=<CODE>` to open-badge: the badge PNG with the signed
 * credential embedded in an iTXt chunk, per Open Badges 3.0 s10.
 *
 * Run from supabase/.
 *
 * ============================== THE DESIGN ==================================
 *
 * It REUSES THE CREDENTIAL BRANCH rather than adding a parallel one. The
 * condition becomes `doc === "credential" || doc === "baked"`, and only the
 * final response differs.
 *
 * That matters more than it looks. The credential branch already carries:
 *
 *   - the specimen refusal (is_signable), which must apply identically -- a
 *     baked specimen is a MORE dangerous artifact than a specimen document,
 *     because it is an image someone can post
 *   - the bearer-token viewer check, so the holder's baked badge carries the
 *     salted identifier and everyone else's does not
 *   - the cache split: `private, no-store` for the holder, shared-cacheable for
 *     the public copy
 *
 * That last one is why a parallel branch would have been a mistake. A CDN
 * storing a holder's baked badge and serving it to the next anonymous visitor is
 * exactly the disclosure the viewer-aware split exists to prevent -- and here it
 * would be inside a file people actively pass around.
 *
 * ============================== NOT GATED, DELIBERATELY =====================
 *
 * There is no new authorization rule. The holder gets a baked badge with their
 * identifier; anyone else gets one without it. Both verify completely.
 *
 * A recruiter downloading a portable, independently verifiable proof is a
 * FEATURE, not a leak. Adding a second gate would mean two authorization rules
 * that can drift, to protect a document that is already public at
 * /credentials/<CODE>.
 *
 * ============================== 404, NOT A BLANK IMAGE ======================
 *
 * If BADGE_B64 has no artwork for the certification code, this 404s. A badge
 * file with no badge in it is worse than no button: it looks like a broken
 * credential rather than a missing asset, and it is the holder who gets blamed
 * for it when they share it.
 *
 * NOTE two lists of badge codes now exist -- BADGE_CODES in _shared/badges.ts
 * and BADGE_CODES in the certification detail page. One truth, two copies. They
 * will drift; when a twelfth badge lands, both change.
 *
 * open-badge/index.ts is LF. Anchors normalized.
 *
 * Usage:  node scripts/patch-open-badge-baked.mjs --dry
 *         node scripts/patch-open-badge-baked.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry");
const PATH = "functions/open-badge/index.ts";

let src = readFileSync(PATH, "utf8");
const before = src.length;

const cr = (src.match(/\r\n/g) || []).length;
const lf = (src.match(/\n/g) || []).length;
console.log(`  ${PATH}  ${cr > 0 ? "CRLF" : "LF"}  (${cr} CRLF / ${lf} LF)`);
if (cr > 0 && cr !== lf) {
  console.error("ABORT  mixed line endings");
  process.exit(3);
}
const eol = cr > 0 ? "\r\n" : "\n";
const toEol = (s) =>
  eol === "\r\n" ? s.replace(/\r?\n/g, "\r\n") : s.replace(/\r\n/g, "\n");

const EDITS = [
  {
    name: "import the baking helper and badge artwork",
    find: `import { getServiceClient } from "../_shared/supabase.ts";`,
    replace: `import { getServiceClient } from "../_shared/supabase.ts";
import { BADGE_B64 } from "../_shared/badges.ts";
import { bakeCredentialIntoPng, b64ToBytes } from "../_shared/png-bake.ts";`,
  },
  {
    name: "baked shares the credential branch",
    find: `    if (doc === "credential") {`,
    replace: `    /* ?doc=credential returns the JSON-LD document.
       ?doc=baked returns the SAME document embedded in the badge PNG.

       ONE BRANCH, deliberately. Everything below -- the specimen refusal, the
       bearer-token viewer check that decides whether the salted identifier is
       present, and the cache split that keeps the holder's copy out of shared
       caches -- applies identically to both. A parallel branch would be a second
       copy of three rules that must not diverge. */
    if (doc === "credential" || doc === "baked") {`,
  },
  {
    name: "bake on the way out",
    find: `      return ldResponse(signed, isHolder ? "private, no-store" : CACHE_STABLE);`,
    replace: `      const cache = isHolder ? "private, no-store" : CACHE_STABLE;

      if (doc === "baked") {
        /* Open Badges 3.0 s10 baking. The credential travels INSIDE the image,
           so a holder can email one file and any OB3-aware system extracts it,
           resolves the issuer, checks the signature and reads the status list --
           without contacting us and without trusting us.

           404 rather than a blank image when the artwork is missing: a badge
           file with no badge in it reads as a broken credential, and it is the
           holder who gets blamed when they share it. */
        const art = BADGE_B64[cred.certification_code];
        if (!art) return jsonResponse({ error: "not found" }, 404);

        let baked: Uint8Array;
        try {
          baked = bakeCredentialIntoPng(
            b64ToBytes(art),
            JSON.stringify(signed),
          );
        } catch (err) {
          // A bake failure is ours, not the caller's. Never serve the bare
          // badge as a fallback -- an image that looks like a credential and
          // carries nothing is the worst possible artifact to hand someone.
          console.error("bake failed:", err);
          return jsonResponse({ error: "badge could not be prepared" }, 500);
        }

        return new Response(baked, {
          status: 200,
          headers: {
            ...corsHeaders,
            "content-type": "image/png",
            // SAME cache semantics as the document. The holder's baked badge
            // carries their salted identifier and must never enter a shared
            // cache -- here it would be inside a file people pass around.
            "cache-control": cache,
            vary: "authorization",
            "content-disposition":
              \`attachment; filename="\${cred.credential_code}.png"\`,
          },
        });
      }

      return ldResponse(signed, cache);`,
  },
];

for (const e of EDITS) {
  const find = toEol(e.find);
  const n = src.split(find).length - 1;
  if (n !== 1) {
    console.error(`ABORT  "${e.name}": matched ${n}, expected 1`);
    process.exit(3);
  }
  src = src.replace(find, toEol(e.replace));
  console.log(`  ok   ${e.name}`);
}

const CHECKS = [
  ['import { BADGE_B64 } from "../_shared/badges.ts";', true],
  ["bakeCredentialIntoPng", true],
  ['doc === "credential" || doc === "baked"', true],
  ['"content-type": "image/png"', true],
  // The old unconditional return must be gone.
  ['return ldResponse(signed, isHolder ? "private, no-store" : CACHE_STABLE);', false],
];
for (const [needle, want] of CHECKS) {
  const has = src.includes(needle);
  if (has !== want) {
    console.error(`ABORT  post-check: ${JSON.stringify(needle)} present=${has}, want=${want}`);
    process.exit(3);
  }
}
{
  const crA = (src.match(/\r\n/g) || []).length;
  const lfA = (src.match(/\n/g) || []).length;
  const ok = eol === "\r\n" ? crA === lfA : crA === 0;
  if (!ok) {
    console.error(`ABORT  line endings drifted (${crA} CRLF / ${lfA} LF)`);
    process.exit(3);
  }
}

console.log(`\n  ${before} -> ${src.length} bytes`);

if (DRY) {
  console.log("\nDRY RUN -- nothing written");
  process.exit(2);
}

writeFileSync(PATH, src, "utf8");
console.log("\nwritten " + PATH);
