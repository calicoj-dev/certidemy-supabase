/**
 * patch-ob3-base-url.mjs
 *
 * Derives the OB3 identifier namespace from issuers.base_url (migration 216)
 * and makes it issuer-scoped, so a second issuer needs no code change.
 *
 *   {base_url}/issuers/{slug}                        issuer profile
 *   {base_url}/issuers/{slug}/achievements/{CODE}    achievement definition
 *   {base_url}/issuers/{slug}/status/{N}             status list
 *   {base_url}/credentials/{CODE}                    credential  (codes are
 *                                                    unique platform-wide)
 *
 * HUMAN SURFACES STAY ON site_url: badge PNGs, criteria pages, the verify page,
 * the blueprint anchor in alignment targetUrl. Those belong on certidemy.com and
 * must NOT follow the identifiers to credentials.certidemy.com.
 *
 * INERT TODAY. base_url == site_url until migration 217, so the only difference
 * in emitted bytes is the /issuers/{slug}/ path segment on the achievement and
 * status-list ids. Both are served live and unsigned; nothing already signed
 * changes.
 *
 * THE REAL BUG FIXED HERE: the revoked-credentials query had no issuer filter.
 * With one issuer that is correct by accident. With two, every issuer's status
 * list would carry every other issuer's revocations.
 *
 * ANCHOR RULES, EARNED THE HARD WAY ON THIS FILE:
 *   - ob3.ts is 100% CRLF. Anchors and replacements are normalized.
 *   - ob3.ts contains 19 real em-dashes (U+2014). NO COMMENT PROSE IN ANCHORS.
 *   - Blank lines inside function bodies are real. Every anchor below was built
 *     from a codepoint dump of the actual file, not from a rendering.
 *
 * Usage:  node scripts/patch-ob3-base-url.mjs --dry
 *         node scripts/patch-ob3-base-url.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry");
/**
 * PER-FILE line endings, MEASURED not assumed.
 *
 * ob3.ts is CRLF (578/578). open-badge/index.ts is LF. Applying one
 * normalizer to both silently corrupted every multi-line anchor for the LF
 * file, while single-line anchors passed -- which is why the first run got 15
 * edits deep before failing and looked like an anchor problem.
 */
const toEol = (s, eol) =>
  eol === "\r\n" ? s.replace(/\r?\n/g, "\r\n") : s.replace(/\r\n/g, "\n");

const detectEol = (s) => ((s.match(/\r\n/g) || []).length > 0 ? "\r\n" : "\n");

const FILES = {
  ob3: "functions/_shared/ob3.ts",
  fn: "functions/open-badge/index.ts",
};

const EDITS = [
  {
    file: "ob3",
    name: "IssuerRow gains id + base_url",
    find: `export interface IssuerRow {
  slug: string;
  name: string;
  site_url: string;
  issuer_url: string;`,
    replace: `export interface IssuerRow {
  id: string;
  slug: string;
  name: string;
  /** Human/marketing host: badge PNGs, criteria pages, verify pages. */
  site_url: string;
  /** Root of the OB3 identifier namespace. Migration 216. */
  base_url: string;
  /**
   * Stored issuer identifier. DERIVED, not authoritative: issuerUrl() computes
   * the same value from base_url + slug. Kept as a column because other readers
   * resolve it directly.
   */
  issuer_url: string;`,
  },
  {
    file: "ob3",
    name: "URL helpers + issuer profile body",
    find: `export function buildIssuerProfile(issuer: IssuerRow): Record<string, unknown> {
  const doc: Record<string, unknown> = {
    "@context": PROFILE_CONTEXT,
    id: issuer.issuer_url,
    type: ["Profile"],
    name: issuer.name,
    url: issuer.site_url,
  };

  if (issuer.public_key_multibase) {
    doc.verificationMethod = [
      {
        id: \`\${issuer.issuer_url}#\${issuer.key_id}\`,
        type: "Multikey",
        controller: issuer.issuer_url,`,
    replace: `/* -------------------------------------------------------------------------- *
 * Identifier namespace
 *
 * Every OB3 identifier is issuer-scoped so a second issuer needs no new route
 * and no code change. Credentials are flat because credential_code carries a
 * UNIQUE constraint across the whole platform.
 * -------------------------------------------------------------------------- */

export function issuerUrl(issuer: IssuerRow): string {
  return \`\${issuer.base_url}/issuers/\${issuer.slug}\`;
}

export function achievementUrl(issuer: IssuerRow, certCode: string): string {
  return \`\${issuerUrl(issuer)}/achievements/\${certCode}\`;
}

export function statusListUrl(issuer: IssuerRow, listNumber: number): string {
  return \`\${issuerUrl(issuer)}/status/\${listNumber}\`;
}

export function credentialUrl(issuer: IssuerRow, credentialCode: string): string {
  return \`\${issuer.base_url}/credentials/\${credentialCode}\`;
}

export function buildIssuerProfile(issuer: IssuerRow): Record<string, unknown> {
  const doc: Record<string, unknown> = {
    "@context": PROFILE_CONTEXT,
    id: issuerUrl(issuer),
    type: ["Profile"],
    name: issuer.name,
    // The HUMAN site. The Profile identifier lives on the credential host; the
    // organization's home page does not.
    url: issuer.site_url,
  };

  if (issuer.public_key_multibase) {
    doc.verificationMethod = [
      {
        id: \`\${issuerUrl(issuer)}#\${issuer.key_id}\`,
        type: "Multikey",
        controller: issuerUrl(issuer),`,
  },
  {
    file: "ob3",
    name: "achievement id",
    find: `  const id = \`\${a.issuer.site_url}/achievements/\${a.certCode}\`;`,
    replace: `  // IDENTIFIER -> base_url. The image and criteria below stay on siteUrl.
  const id = achievementUrl(a.issuer, a.certCode);`,
  },
  {
    file: "ob3",
    name: "achievement creator id",
    find: `    creator: {
      id: a.issuer.issuer_url,`,
    replace: `    creator: {
      id: issuerUrl(a.issuer),`,
  },
  {
    file: "ob3",
    name: "credential id + issuer id",
    find: `    id: \`\${c.siteUrl}/credentials/\${c.credentialCode}\`,`,
    replace: `    id: credentialUrl(c.issuer, c.credentialCode),`,
  },
  {
    file: "ob3",
    name: "credential issuer block",
    find: `    issuer: {
      id: c.issuer.issuer_url,`,
    replace: `    issuer: {
      id: issuerUrl(c.issuer),`,
  },
  {
    file: "ob3",
    name: "status list id",
    find: `  const id = \`\${issuer.site_url}/status/\${listNumber}\`;`,
    replace: `  const id = statusListUrl(issuer, listNumber);`,
  },
  {
    file: "ob3",
    name: "status list issuer id",
    find: `    issuer: { id: issuer.issuer_url, type: ["Profile"], name: issuer.name },`,
    replace: `    issuer: { id: issuerUrl(issuer), type: ["Profile"], name: issuer.name },`,
  },
  {
    file: "ob3",
    name: "SigningIssuer shape",
    find: `export interface SigningIssuer {
  issuer_url: string;
  key_id: string;
  public_key_multibase: string;
}`,
    replace: `export interface SigningIssuer {
  base_url: string;
  slug: string;
  key_id: string;
}`,
  },
  {
    file: "ob3",
    name: "signDocument verificationMethod",
    find: `  const verificationMethod = \`\${issuer.issuer_url}#\${issuer.key_id}\`;`,
    replace: `  // MUST match buildIssuerProfile's verificationMethod id exactly, or a
  // verifier resolves the issuer and finds no key by that identifier.
  const verificationMethod =
    \`\${issuer.base_url}/issuers/\${issuer.slug}#\${issuer.key_id}\`;`,
  },

  {
    file: "fn",
    name: "ISSUER_SLUG becomes a default",
    find: `const ISSUER_SLUG = "certidemy";`,
    replace: `/**
 * The issuer slug comes from the request, not a constant, so a partner issuer
 * resolves without a redeploy. Absent -> "certidemy", which is what the existing
 * certidemy.com proxy routes send.
 */
const DEFAULT_ISSUER_SLUG = "certidemy";`,
  },
  {
    file: "fn",
    name: "resolve issuer slug from request",
    find: `    const svc = getServiceClient();`,
    replace: `    const issuerSlug = (url.searchParams.get("issuer") ?? DEFAULT_ISSUER_SLUG)
      .trim()
      .toLowerCase();
    const svc = getServiceClient();`,
  },
  {
    file: "fn",
    name: "issuer select gains id + base_url",
    find: `        "slug, name, site_url, issuer_url, key_id, public_key_multibase, key_created_at",`,
    replace: `        "id, slug, name, site_url, base_url, issuer_url, key_id, " +
          "public_key_multibase, key_created_at",`,
  },
  {
    file: "fn",
    name: "issuer lookup uses the resolved slug",
    find: `      .eq("slug", ISSUER_SLUG)`,
    replace: `      .eq("slug", issuerSlug)`,
  },
  {
    file: "fn",
    name: "status list id from issuer",
    find: `      const statusListId = \`\${siteUrl}/status/1\`;`,
    replace: `      const statusListId = statusListUrl(issuer, 1);`,
  },
  {
    file: "fn",
    name: "revoked query scoped to this issuer",
    find: `        .eq("status", "revoked")
        .eq("is_specimen", false);`,
    replace: `        .eq("status", "revoked")
        .eq("issuer_id", issuer.id)
        .eq("is_specimen", false);`,
  },
  {
    file: "fn",
    name: "readSigningKey takes the slug",
    find: `async function readSigningKey(svc: Svc): Promise<string | null> {`,
    replace: `async function readSigningKey(svc: Svc, slug: string): Promise<string | null> {`,
  },
  {
    file: "fn",
    name: "readSigningKey rpc arg",
    find: `    p_slug: ISSUER_SLUG,`,
    replace: `    p_slug: slug,`,
  },
  {
    file: "fn",
    name: "import statusListUrl",
    find: `  isSignable,
  signDocument,`,
    replace: `  isSignable,
  signDocument,
  statusListUrl,`,
  },
];

const sources = {};
const eols = {};
for (const [k, p] of Object.entries(FILES)) {
  sources[k] = readFileSync(p, "utf8");
  eols[k] = detectEol(sources[k]);
  console.log(`  ${p}  ${eols[k] === "\r\n" ? "CRLF" : "LF"}`);
}
console.log("");
const before = Object.fromEntries(
  Object.entries(sources).map(([k, v]) => [k, v.length]),
);

for (const e of EDITS) {
  const eol = eols[e.file];
  const find = toEol(e.find, eol);
  const n = sources[e.file].split(find).length - 1;
  if (n !== 1) {
    console.error(`ABORT  [${e.file}] "${e.name}": matched ${n}, expected 1`);
    process.exit(3);
  }
  sources[e.file] = sources[e.file].replace(find, toEol(e.replace, eol));
  console.log(`  ok   [${e.file}] ${e.name}`);
}

const calls = (sources.fn.match(/readSigningKey\(svc\)/g) || []).length;
if (calls !== 2) {
  console.error(`ABORT  expected 2 readSigningKey(svc) call sites, found ${calls}`);
  process.exit(3);
}
sources.fn = sources.fn.replace(/readSigningKey\(svc\)/g, "readSigningKey(svc, issuerSlug)");

const CHECKS = [
  ["ob3", "issuerUrl(issuer)", true],
  ["ob3", "issuer.issuer_url", false],
  ["ob3", "site_url}/achievements", false],
  ["ob3", "site_url}/status", false],
  ["ob3", "siteUrl}/credentials", false],
  // NOT a plain substring: DEFAULT_ISSUER_SLUG contains ISSUER_SLUG. The
  // check is for the BARE constant surviving, so it needs a word boundary.
  ["fn", /(?<![A-Z_])ISSUER_SLUG/, false],
  ["fn", `.eq("issuer_id", issuer.id)`, true],
  ["fn", "readSigningKey(svc, issuerSlug)", true],
];
for (const [file, needle, want] of CHECKS) {
  const has = needle instanceof RegExp
    ? needle.test(sources[file])
    : sources[file].includes(needle);
  if (has !== want) {
    console.error(`ABORT  post-check [${file}]: "${needle}" present=${has}, want=${want}`);
    process.exit(3);
  }
}
for (const [k, v] of Object.entries(sources)) {
  const lf = (v.match(/\n/g) || []).length;
  const cr = (v.match(/\r\n/g) || []).length;
  const want = eols[k] === "\r\n" ? cr === lf : cr === 0;
  if (!want) {
    console.error(`ABORT  [${k}]: line endings drifted (${cr} CRLF / ${lf} LF, file is ${eols[k] === "\r\n" ? "CRLF" : "LF"})`);
    process.exit(3);
  }
}

console.log("");
for (const [k, p] of Object.entries(FILES)) {
  console.log(`  ${p}  ${before[k]} -> ${sources[k].length} bytes`);
}

if (DRY) {
  console.log("\nDRY RUN -- nothing written");
  process.exit(2);
}
for (const [k, p] of Object.entries(FILES)) writeFileSync(p, sources[k], "utf8");
console.log("\nwritten");