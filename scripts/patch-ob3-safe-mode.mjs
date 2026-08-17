/**
 * patch-ob3-safe-mode.mjs
 *
 * Two JSON-LD safe-mode failures found by check-jsonld-safe-mode.mjs:
 *
 *  /issuer   "verificationMethod" does not expand. OB3's Profile class has no
 *            such property and VC v2 defines it only INSIDE proof. Fix: add
 *            the W3C controller context, which defines it at top level.
 *            Confirmed by probe: "+ controller/v1" PASS.
 *
 *  /status/N type "Profile" is a relative reference. The document carries only
 *            credentials/v2, but the issuer block uses an OB3 term. Fix: use
 *            VC_CONTEXT (which already includes the OB3 context) instead of the
 *            hand-rolled single-entry array. Confirmed by probe: "+ ob3" PASS.
 *            Chosen over dropping issuer.type (also PASS) because Profile IS
 *            the correct type and the same block appears in buildCredential --
 *            one shape across all four documents.
 *
 * LINE ENDINGS: ob3.ts is 100% CRLF (measured: 578/578). This file is LF. Every
 * multi-line anchor is normalized to CRLF before matching, and replacements are
 * normalized too so the file stays CRLF throughout. Converting the file to LF
 * would turn a 3-line change into a 578-line diff. First run of this script
 * failed 0/3 on exactly this.
 *
 * IMPACT ON ISSUED CREDENTIALS: none. The issuer Profile is served unsigned.
 * Status lists carry validFrom: now() and are re-signed on every fetch under
 * no-store. VC_CONTEXT itself is NOT touched, so the credential's context array
 * -- which is hashed into the proof config -- is unchanged.
 *
 * Usage:  node scripts/patch-ob3-safe-mode.mjs --dry
 *         node scripts/patch-ob3-safe-mode.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry");
const PATH = "functions/_shared/ob3.ts";

/** LF -> CRLF, matching the target file's convention. */
const crlf = (s) => s.replace(/\r?\n/g, "\r\n");

let src = readFileSync(PATH, "utf8");
const before = src.length;

const EDITS = [
  {
    name: "declare PROFILE_CONTEXT",
    find: `export const VC_CONTEXT = [
  "https://www.w3.org/ns/credentials/v2",
  "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
];`,
    replace: `export const VC_CONTEXT = [
  "https://www.w3.org/ns/credentials/v2",
  "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
];

/**
 * The issuer Profile needs one context the credential does not.
 *
 * A Profile publishes verificationMethod at the TOP LEVEL so a verifier can
 * resolve the key. VC v2 defines that term only inside proof, and OB 3.0's
 * Profile class does not define it at all, so under JSON-LD safe mode the whole
 * property is dropped and the document fails validation. The W3C controller
 * context is where verificationMethod and Multikey are defined.
 *
 * DELIBERATELY NOT ADDED TO VC_CONTEXT. The context array is hashed into every
 * credential's proof config; widening the shared constant would change the
 * signed bytes of every document for a term only the Profile uses.
 */
export const PROFILE_CONTEXT = [
  ...VC_CONTEXT,
  "https://www.w3.org/ns/controller/v1",
];`,
  },
  {
    name: "issuer profile uses PROFILE_CONTEXT",
    find: `    "@context": VC_CONTEXT,
    id: issuer.issuer_url,`,
    replace: `    "@context": PROFILE_CONTEXT,
    id: issuer.issuer_url,`,
  },
  {
    name: "status list uses VC_CONTEXT",
    find: `    "@context": ["https://www.w3.org/ns/credentials/v2"],
    id,
    type: ["VerifiableCredential", "BitstringStatusListCredential"],`,
    replace: `    // VC_CONTEXT, not credentials/v2 alone: the issuer block below uses the
    // OB 3.0 term "Profile", which is a relative @type reference without the
    // OB3 context and fails JSON-LD safe-mode validation.
    "@context": VC_CONTEXT,
    id,
    type: ["VerifiableCredential", "BitstringStatusListCredential"],`,
  },
];

let applied = 0;
for (const e of EDITS) {
  const find = crlf(e.find);
  const replace = crlf(e.replace);
  const n = src.split(find).length - 1;
  if (n !== 1) {
    console.error(`ABORT  "${e.name}": anchor matched ${n} times, expected 1`);
    process.exit(3);
  }
  src = src.replace(find, replace);
  applied++;
  console.log(`  ok   ${e.name}`);
}

// Post-checks: assert the END STATE, not that edits ran.
if (!src.includes("PROFILE_CONTEXT = [")) {
  console.error("ABORT  post-check: PROFILE_CONTEXT not declared");
  process.exit(3);
}
if (!src.includes(`"@context": PROFILE_CONTEXT`)) {
  console.error("ABORT  post-check: nothing consumes PROFILE_CONTEXT");
  process.exit(3);
}
if (src.includes(`"@context": ["https://www.w3.org/ns/credentials/v2"]`)) {
  console.error("ABORT  post-check: a bare credentials/v2 context survives");
  process.exit(3);
}
const lf = (src.match(/\n/g) || []).length;
const cr = (src.match(/\r\n/g) || []).length;
if (lf !== cr) {
  console.error(`ABORT  post-check: mixed line endings (${cr} CRLF / ${lf} LF)`);
  process.exit(3);
}

console.log(`\n${applied}/${EDITS.length} edits, ${before} -> ${src.length} bytes, ${cr} CRLF / ${lf} LF`);

if (DRY) {
  console.log("DRY RUN -- nothing written");
  process.exit(2);
}

writeFileSync(PATH, src, "utf8");
console.log("written " + PATH);