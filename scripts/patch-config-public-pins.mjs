/**
 * patch-config-public-pins.mjs
 *
 * Pins the three remaining public edge functions in config.toml.
 *
 * ============================== WHY, AND THE EVIDENCE ========================
 *
 * `verify_jwt` defaults to TRUE. A function made public with --no-verify-jwt is
 * public as a property of one command, not of the repo, so any later redeploy
 * that omits the flag silently re-privatises it. Nothing fails at deploy time.
 * Nothing appears in a build. The function simply starts returning 401 to every
 * caller who holds no Supabase key -- which is every external consumer.
 *
 * This has now happened FOUR times on this project:
 *
 *   1. get-credential-certificate (v3.3)  -- pinned after
 *   2. open-badge (v7.0)                  -- pinned after; found because a badge
 *                                            panel check went red on a paying
 *                                            customer's credential
 *   3. credential-og                      -- FOUND BROKEN IN PRODUCTION while
 *                                            writing this patch. The og:image
 *                                            meta tag emits the raw function URL,
 *                                            so LinkedIn's crawler carries no key
 *                                            and got 401. Every credential share
 *                                            card has been dead since some
 *                                            unrecorded redeploy. v4.5 verified
 *                                            it working through Post Inspector.
 *   4. get-certification-blueprint        -- currently 200, but unpinned, so it
 *                                            is one flag-less redeploy from the
 *                                            same fate
 *
 * Measured anonymously (no Authorization header) before writing this:
 *
 *   open-badge                    200   (pinned)
 *   get-credential-certificate    200   (pinned)
 *   verify-credential             200   unpinned
 *   get-certification-blueprint   200   unpinned
 *   credential-og                 401   unpinned AND ALREADY BROKEN
 *   get-governance-snapshot       401   correct, see below
 *   revoke-credential             401   correct -- the control
 *
 * ============================== WHAT IS NOT PINNED ==========================
 *
 * get-governance-snapshot is called through supabase.functions.invoke() from
 * lib/console/governance.ts, which attaches the caller's session token. It is
 * admin-console-only and 401-to-anonymous is the correct answer. Pinning it
 * would remove a real layer for no gain.
 *
 * The rule applied here: pin only what must answer a caller holding NO KEY AT
 * ALL. The anon key is a valid JWT to the gateway, so anything called from an
 * authenticated browser or with the anon key does not need this and must not
 * get it.
 *
 * ============================== SAFETY ======================================
 *
 * verify_jwt = false removes the GATEWAY check, not the function's own
 * authorisation. Each function pinned here is a public read by design:
 *
 *   verify-credential            sanitized public fields, never the score
 *   credential-og                a rendered PNG of already-public facts
 *   get-certification-blueprint  the published blueprint, already on the
 *                                catalogue page
 *
 * None reads a session. None returns anything an anonymous visitor cannot
 * already see on a public page.
 *
 * Appended to the end of the file rather than inserted at an anchor: TOML does
 * not care about block order, and an append has nothing to match wrongly.
 *
 * config.toml is LF (measured 433/433). Written LF.
 *
 * Usage:  node scripts/patch-config-public-pins.mjs --dry
 *         node scripts/patch-config-public-pins.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry");
const PATH = "config.toml";

let src = readFileSync(PATH, "utf8");
const before = src.length;

const cr = (src.match(/\r\n/g) || []).length;
const lf = (src.match(/\n/g) || []).length;
console.log(`  ${PATH}  ${cr > 0 ? "CRLF" : "LF"}  (${cr} CRLF / ${lf} LF)`);
if (cr > 0) {
  console.error("ABORT  expected an LF file; line endings changed under us");
  process.exit(3);
}

const PINS = [
  {
    fn: "verify-credential",
    block: `
# Public Edge Function -- the credential registry read behind /verify/<code>.
# Called server-side from app/[locale]/verify/[id]/page.tsx with NO auth header,
# and it is the page a recruiter or auditor lands on from a QR code or a shared
# link. Those callers have no Supabase key.
#
# Returns sanitized fields only and NEVER the score. Revocation and expiry
# render as distinct states rather than as absence, so a withdrawn credential
# says so instead of looking like a typo.
#
# Pinned, not passed as --no-verify-jwt: the flag belongs to one command, the
# pin belongs to the repo. Fourth occurrence of that distinction mattering.
[functions.verify-credential]
verify_jwt = false
`,
  },
  {
    fn: "credential-og",
    block: `
# Public Edge Function -- the 1200x630 share card.
#
# FOUND RETURNING 401 IN PRODUCTION. The og:image meta tag on the verify page
# emits this function's URL directly, so the fetcher is LinkedIn's, Twitter's or
# Slack's crawler, which carries no Supabase key and never will. Every credential
# share card was broken from whichever redeploy dropped the flag until this pin.
# It rendered fine in a browser because a browser never fetches og:image.
#
# Renders only facts already public on the verify page, and reads is_specimen so
# a demonstration credential cannot be shared as a real one.
#
# After deploying, re-scrape through the LinkedIn Post Inspector: previews are
# held roughly a week with no purge you control, so a broken card can outlive
# its fix.
[functions.credential-og]
verify_jwt = false
`,
  },
  {
    fn: "get-certification-blueprint",
    block: `
# Public Edge Function -- the published exam blueprint.
#
# Fetched from the BROWSER by components/verify/blueprint-modal.tsx with no
# headers at all, on the public verify page. Unpinned until now and working only
# because of a --no-verify-jwt deploy nobody recorded.
#
# The blueprint is deliberately public: "the full blueprint is published" is an
# approved Class A claim in CLAIMS-POLICY precisely because a reader can open it.
# Gating it behind a key would make that claim false.
[functions.get-certification-blueprint]
verify_jwt = false
`,
  },
];

let added = 0;
for (const p of PINS) {
  const marker = `[functions.${p.fn}]`;
  if (src.includes(marker)) {
    console.log(`  skip  ${p.fn} -- already pinned`);
    continue;
  }
  if (!src.endsWith("\n")) src += "\n";
  src += p.block;
  added++;
  console.log(`  ok    ${p.fn}`);
}

if (added === 0) {
  console.log("\nnothing to do");
  process.exit(DRY ? 2 : 0);
}

// End-state assertions: every function that must be public is pinned, and the
// one that must NOT be is absent.
const MUST_BE_PINNED = [
  "open-badge",
  "get-credential-certificate",
  "verify-credential",
  "credential-og",
  "get-certification-blueprint",
];
for (const fn of MUST_BE_PINNED) {
  if (!src.includes(`[functions.${fn}]`)) {
    console.error(`ABORT  post-check: ${fn} is not pinned`);
    process.exit(3);
  }
}
if (src.includes("[functions.get-governance-snapshot]")) {
  console.error("ABORT  post-check: get-governance-snapshot must NOT be pinned");
  process.exit(3);
}
const pinCount = (src.match(/verify_jwt = false/g) || []).length;
if (pinCount !== MUST_BE_PINNED.length) {
  console.error(`ABORT  post-check: ${pinCount} pins, expected ${MUST_BE_PINNED.length}`);
  process.exit(3);
}
if ((src.match(/\r\n/g) || []).length !== 0) {
  console.error("ABORT  post-check: CRLF appeared in an LF file");
  process.exit(3);
}

console.log(`\n  ${added} pin(s) added, ${pinCount} total`);
console.log(`  ${before} -> ${src.length} bytes`);

if (DRY) {
  console.log("\nDRY RUN -- nothing written");
  process.exit(2);
}

writeFileSync(PATH, src, "utf8");
console.log("\nwritten " + PATH);
