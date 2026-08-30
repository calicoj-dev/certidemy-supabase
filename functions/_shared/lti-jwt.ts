/**
 * supabase/functions/_shared/lti-jwt.ts
 *
 * RS256 verification and the tolerant claim reader for LTI 1.3 launches.
 *
 * ============================== HAND-ROLLED, ON PURPOSE ===================
 *
 * No `jose`, no JWT library. RS256 verification is a split, two base64url
 * decodes and one crypto.subtle.verify -- and this is the code that decides
 * whether a launch is genuine.
 *
 * Same argument png-bake.ts makes for writing its own CRC-32: "it is twelve
 * lines, and this file runs in an edge function where every import is a
 * cold-start cost and a thing that can change under us." That argument is
 * stronger here, not weaker.
 *
 * crypto.subtle with RSASSA-PKCS1-v1_5 is already proven in this runtime --
 * lti-mint-tool-key generates, signs and verifies with it before any key
 * reaches Vault.
 */

/* -------------------------------------------------------------------------- *
 * base64url
 * -------------------------------------------------------------------------- */

export function b64urlToBytes(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlToJson(s: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));
}

/* -------------------------------------------------------------------------- *
 * Unverified decode
 * -------------------------------------------------------------------------- */

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: Uint8Array<ArrayBuffer>;
  /** The exact bytes the signature covers: `header.payload`, ASCII. */
  signedBytes: Uint8Array<ArrayBuffer>;
}

/**
 * Decode WITHOUT verifying.
 *
 * EVERYTHING THIS RETURNS IS ATTACKER-CONTROLLED until verifyRs256 has run
 * against a key chosen by something other than this payload. It exists to read
 * `kid` -- which is unavoidable, since the header names the key -- and nothing
 * else should be trusted from it.
 */
export function decodeJwt(token: string): DecodedJwt {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("not a three-part JWT");
  const [h, p, s] = parts;
  return {
    header: b64urlToJson(h),
    payload: b64urlToJson(p),
    signature: b64urlToBytes(s),
    signedBytes: new TextEncoder().encode(`${h}.${p}`),
  };
}

/* -------------------------------------------------------------------------- *
 * JWKS: cached BY KID, with a negative cache
 * -------------------------------------------------------------------------- */

interface KeyEntry {
  key: CryptoKey;
  fetchedAt: number;
}

/**
 * Positive cache. Keyed by platform_id + kid, NOT by JWKS document.
 *
 * Caching the document means a rotation is invisible until the document's TTL
 * expires; caching per-kid means an unfamiliar kid triggers exactly one fetch
 * and a familiar one triggers none. That is the behaviour a platform expects
 * from a tool.
 *
 * IN-MEMORY, SO IT DIES WITH THE ISOLATE. See the header of lti-launch for what
 * that costs and how we would notice if it ever mattered.
 */
const KEY_CACHE = new Map<string, KeyEntry>();

/**
 * Negative cache: kids we looked for and did not find.
 *
 * Without it, a platform mid-rotation -- publishing a new kid we have not seen
 * while signing with it -- turns every launch into a JWKS fetch. Thirty
 * students at nine in the morning becomes thirty fetches of the same document,
 * which is how a tool gets rate-limited by the institution it is trying to
 * serve.
 *
 * Deliberately SHORT. A rotation should become visible in under a minute; this
 * only has to absorb a burst.
 */
const MISS_CACHE = new Map<string, number>();
const MISS_TTL_MS = 30_000;

/** Positive entries are re-fetched occasionally so a revoked key cannot live forever. */
const KEY_TTL_MS = 60 * 60 * 1000;

export class JwksError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
  }
}

/**
 * Resolve one signing key by kid, fetching the platform's JWKS only if needed.
 *
 * The error CODES matter more than the messages: they are what lands in
 * lti_launch_skeleton.error_code, and they are the difference between
 * diagnosing a key rotation, a rate limit and an outage. A single
 * "jwks_failed" would make all three look alike.
 */
export async function getPlatformKey(
  platformId: string,
  jwksUrl: string,
  kid: string,
): Promise<CryptoKey> {
  const cacheKey = `${platformId}:${kid}`;

  const hit = KEY_CACHE.get(cacheKey);
  if (hit && Date.now() - hit.fetchedAt < KEY_TTL_MS) return hit.key;

  const missedAt = MISS_CACHE.get(cacheKey);
  if (missedAt && Date.now() - missedAt < MISS_TTL_MS) {
    throw new JwksError(
      "unknown_kid_cached",
      "kid not in the platform key set (negative cache)",
    );
  }

  let res: Response;
  try {
    res = await fetch(jwksUrl, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    // Unreachable, DNS, TLS, timeout. NOT the same as a rejection.
    throw new JwksError(
      "jwks_unreachable",
      `could not fetch ${jwksUrl}: ${(err as Error).message}`,
    );
  }

  if (!res.ok) {
    // STATUS IN THE CODE, deliberately. A 429 is a rate limit, a 403 is a WAF,
    // a 5xx is their outage -- three different remedies that would be
    // indistinguishable under one generic code.
    throw new JwksError(
      `jwks_http_${res.status}`,
      `${jwksUrl} returned HTTP ${res.status}`,
    );
  }

  let doc: { keys?: Record<string, unknown>[] };
  try {
    doc = await res.json();
  } catch {
    throw new JwksError("jwks_not_json", `${jwksUrl} did not return JSON`);
  }

  const jwk = (doc.keys ?? []).find((k) => k.kid === kid);
  if (!jwk) {
    MISS_CACHE.set(cacheKey, Date.now());
    throw new JwksError(
      "unknown_kid",
      `kid ${kid} is not in the platform key set`,
    );
  }

  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      "jwk",
      jwk as JsonWebKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
  } catch (err) {
    throw new JwksError(
      "jwk_unusable",
      `kid ${kid} could not be imported: ${(err as Error).message}`,
    );
  }

  KEY_CACHE.set(cacheKey, { key, fetchedAt: Date.now() });
  MISS_CACHE.delete(cacheKey);
  return key;
}

export async function verifyRs256(
  key: CryptoKey,
  decoded: DecodedJwt,
): Promise<boolean> {
  return await crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    decoded.signature,
    decoded.signedBytes,
  );
}

/* -------------------------------------------------------------------------- *
 * The tolerant reader
 * -------------------------------------------------------------------------- */

/**
 * A claim, in four states.
 *
 * NOT `T | null`. A nullable type invites `?? ""` and `?? "Unknown"` from
 * whoever is in a hurry, and then a synthetic default is indistinguishable from
 * data three layers away. This codebase has paid for that twice already -- the
 * criteria.id fallback that put a 404 inside signed partner credentials, and
 * the `holder_email ?? ""` that hashed an empty string into a recipient
 * identifier.
 *
 * `unsubstituted` is the state most implementations miss. A platform that
 * cannot resolve a custom variable returns THE VARIABLE'S OWN NAME as a string
 * -- "$Canvas.user.sisSourceId" arrives where an id was expected. It is
 * present, it is a string, and it is not data. A truthiness check treats it as
 * a value.
 */
export type Claim<T> =
  | { status: "provided"; value: T }
  | { status: "provided_empty" }
  | { status: "absent" }
  | { status: "unsubstituted"; literal: string };

const UNSUBSTITUTED = /^\$[A-Za-z]/;

export function readString(raw: unknown): Claim<string> {
  if (raw === undefined || raw === null) return { status: "absent" };
  if (typeof raw !== "string") return { status: "absent" };
  const v = raw.trim();
  if (v === "") return { status: "provided_empty" };
  if (UNSUBSTITUTED.test(v)) return { status: "unsubstituted", literal: v };
  return { status: "provided", value: v };
}

export function readArray(raw: unknown): Claim<string[]> {
  if (raw === undefined || raw === null) return { status: "absent" };
  if (!Array.isArray(raw)) return { status: "absent" };
  const vals = raw.filter((x): x is string => typeof x === "string");
  if (vals.length === 0) return { status: "provided_empty" };
  return { status: "provided", value: vals };
}

/** True only for a claim that carries usable data. */
export function hasValue<T>(c: Claim<T>): boolean {
  return c.status === "provided";
}

/* -------------------------------------------------------------------------- *
 * LTI claim URIs
 * -------------------------------------------------------------------------- */

export const LTI = {
  messageType: "https://purl.imsglobal.org/spec/lti/claim/message_type",
  version: "https://purl.imsglobal.org/spec/lti/claim/version",
  deploymentId: "https://purl.imsglobal.org/spec/lti/claim/deployment_id",
  targetLinkUri: "https://purl.imsglobal.org/spec/lti/claim/target_link_uri",
  resourceLink: "https://purl.imsglobal.org/spec/lti/claim/resource_link",
  roles: "https://purl.imsglobal.org/spec/lti/claim/roles",
  context: "https://purl.imsglobal.org/spec/lti/claim/context",
  toolPlatform: "https://purl.imsglobal.org/spec/lti/claim/tool_platform",
  launchPresentation:
    "https://purl.imsglobal.org/spec/lti/claim/launch_presentation",
  custom: "https://purl.imsglobal.org/spec/lti/claim/custom",
  lti1p1: "https://purl.imsglobal.org/spec/lti/claim/lti1p1",
  deepLinkingSettings:
    "https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings",
} as const;

export interface LaunchContext {
  messageType: Claim<string>;
  version: Claim<string>;
  deploymentId: Claim<string>;
  targetLinkUri: Claim<string>;
  sub: Claim<string>;
  name: Claim<string>;
  email: Claim<string>;
  locale: Claim<string>;
  roles: Claim<string[]>;
  /**
   * resource_link.id. REQUIRED on an LtiResourceLinkRequest and absent by
   * definition on a deep-linking one, which has no resource link yet -- that is
   * the message asking for one to be created.
   *
   * Read as the id rather than the whole claim because the id is the only part
   * anything requires. title and description are optional and unread.
   */
  resourceLinkId: Claim<string>;
  contextTitle: Claim<string>;
  productFamilyCode: Claim<string>;
  /** Custom variables, each read through the same four-state reader. */
  custom: Record<string, Claim<string>>;
  deepLinking: {
    returnUrl: Claim<string>;
    acceptTypes: Claim<string[]>;
    acceptMultiple: boolean;
    documentTargets: Claim<string[]>;
    /**
     * OPAQUE, AND MUST BE ECHOED BACK UNCHANGED.
     *
     * The platform uses it to correlate our response with the request it made.
     * It means nothing to us and must not be interpreted, trimmed or defaulted
     * -- read as a claim like everything else so an absent one stays absent
     * rather than becoming an empty string in the response.
     */
    data: Claim<string>;
  };
}

function obj(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

/**
 * ONE PARSE AT THE BOUNDARY. Nothing downstream touches a raw claim.
 */
export function parseLaunch(payload: Record<string, unknown>): LaunchContext {
  const lp = obj(payload[LTI.launchPresentation]);
  const dl = obj(payload[LTI.deepLinkingSettings]);
  const customRaw = obj(payload[LTI.custom]);

  const custom: Record<string, Claim<string>> = {};
  for (const [k, v] of Object.entries(customRaw)) custom[k] = readString(v);

  return {
    messageType: readString(payload[LTI.messageType]),
    version: readString(payload[LTI.version]),
    deploymentId: readString(payload[LTI.deploymentId]),
    targetLinkUri: readString(payload[LTI.targetLinkUri]),
    sub: readString(payload.sub),
    name: readString(payload.name),
    email: readString(payload.email),
    // launch_presentation.locale first: it is the locale of THIS launch, while
    // the top-level claim is the user's profile preference.
    locale: lp.locale !== undefined
      ? readString(lp.locale)
      : readString(payload.locale),
    roles: readArray(payload[LTI.roles]),
    resourceLinkId: readString(obj(payload[LTI.resourceLink]).id),
    contextTitle: readString(obj(payload[LTI.context]).title),
    productFamilyCode: readString(
      obj(payload[LTI.toolPlatform]).product_family_code,
    ),
    custom,
    deepLinking: {
      returnUrl: readString(dl.deep_link_return_url),
      acceptTypes: readArray(dl.accept_types),
      acceptMultiple: dl.accept_multiple === true,
      documentTargets: readArray(dl.accept_presentation_document_targets),
      data: readString(dl.data),
    },
  };
}

/**
 * The boolean map that goes in lti_launch_skeleton.
 *
 * WHICH CLAIMS ARRIVED, NEVER THEIR VALUES. That is the property that lets the
 * skeleton be retained indefinitely while the evidence row expires in 30 days,
 * and the property that lets the console read it. If a value ever appears here,
 * both of those decisions become wrong at once.
 */
export function claimPresence(ctx: LaunchContext): Record<string, boolean> {
  return {
    sub: hasValue(ctx.sub),
    name: hasValue(ctx.name),
    email: hasValue(ctx.email),
    locale: hasValue(ctx.locale),
    roles: hasValue(ctx.roles),
    context_title: hasValue(ctx.contextTitle),
    deployment_id: hasValue(ctx.deploymentId),
    target_link_uri: hasValue(ctx.targetLinkUri),
    product_family_code: hasValue(ctx.productFamilyCode),
    deep_linking_settings: hasValue(ctx.deepLinking.returnUrl),
    custom: Object.keys(ctx.custom).length > 0,
    custom_unsubstituted: Object.values(ctx.custom).some(
      (c) => c.status === "unsubstituted",
    ),
  };
}
