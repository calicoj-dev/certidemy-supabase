/**
 * supabase/functions/_shared/ld-contexts.ts
 *
 * The JSON-LD @context documents every Certidemy credential references, bundled
 * as constants, plus a document loader that refuses to touch the network.
 *
 * ============================== WHY BUNDLED ==================================
 *
 * eddsa-rdfc-2022 canonicalizes through RDF Dataset Canonicalization, which
 * means EXPANDING the JSON-LD -- which means resolving every @context URL. The
 * two options are fetching them at signing time or bundling them.
 *
 * Fetching is not acceptable. It would put a third-party network call on the
 * mint path, where a timeout means a customer pays for an exam and receives
 * nothing. It is also the failure mode credential-og already had once, when it
 * pulled fonts from raw.githubusercontent.com at render time.
 *
 * Bundled, these are 17.5 KB total and there is no network call, no cold-start
 * fetch, and no third party who can change what a signature covers.
 *
 * ============================== THESE ARE FROZEN =============================
 *
 * A context defines what every term in a credential MEANS. Changing one changes
 * what the RDF says, which changes the canonical N-Quads, which changes every
 * signature computed against it.
 *
 * So these are versioned artifacts, not a cache. If 1EdTech publishes
 * context-3.0.4.json, that is a NEW constant and a new decision about which
 * credentials reference it -- not an edit to this one. Credentials already
 * issued must keep resolving against the context they were signed under.
 *
 * Fetched and pinned 2026-08-17:
 *   https://www.w3.org/ns/credentials/v2                          7,121 bytes
 *   https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json   10,371 bytes
 *
 * VERIFY BEFORE EDITING. If either constant is ever changed, re-run
 * scripts/verify-rdfc-proof.mjs against an existing credential: if the
 * signature still verifies, the change was cosmetic; if it does not, the change
 * altered meaning and every credential signed under the old context is now
 * unverifiable by this code.
 *
 * ============================== GENERATION ===================================
 *
 * Regenerate with: node scripts/gen-ld-contexts.mjs
 * Do not hand-edit the payloads.
 */

/* deno-fmt-ignore-file */

export const VC_V2_URL = "https://www.w3.org/ns/credentials/v2";
export const OB3_URL =
  "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json";

/**
 * Loaded lazily from the generated JSON module so this file stays readable.
 * The payloads live in ld-contexts.data.ts, which is generated and enormous.
 */
import { VC_V2_CONTEXT, OB3_CONTEXT } from "./ld-contexts.data.ts";

const CONTEXTS: Record<string, unknown> = {
  [VC_V2_URL]: VC_V2_CONTEXT,
  [OB3_URL]: OB3_CONTEXT,
};

export class ContextNotBundledError extends Error {}

/**
 * A jsonld documentLoader that serves only bundled contexts and THROWS on
 * anything else.
 *
 * Throwing rather than fetching is the point. A loader that quietly falls back
 * to the network would work in every test and then, one day, sign a credential
 * against a context that had changed underneath it -- or time out mid-mint. The
 * throw makes an unbundled context a build-time problem instead of a
 * production one.
 */
export function bundledDocumentLoader(url: string) {
  const document = CONTEXTS[url];
  if (!document) {
    throw new ContextNotBundledError(
      `@context not bundled: ${url}. Add it to ld-contexts.ts deliberately -- ` +
        `a context defines what the credential MEANS, and adding one changes ` +
        `what every signature covers.`,
    );
  }
  return Promise.resolve({ contextUrl: null, document, documentUrl: url });
}
