// functions/_shared/lti-registration.ts
//
// Validation shared by create-lti-platform and update-lti-platform.
//
// ============================== WHY SHARED RATHER THAN MIRRORED ===========
//
// These two functions write the same nine columns of the same table, and the
// house has a documented failure mode for exactly this shape: a rule copied
// into two files, one of which later gets a fix the other does not. The web
// repo's CLAUDE.md item 8 lists five such pairs and calls every one of them
// "a place where two repos have to be changed in one thought".
//
// A pair inside ONE repo does not have to stay a pair. So the rules live here
// once and both callers import them. There is nothing to keep in step.
//
// What is deliberately NOT here: the platform_admin check, the admin_actions
// row, the 409 pre-check and the response shape. Those differ between create
// and update in ways that matter -- create records siblings_for_iss, update
// records a before/after diff -- and forcing them into a shared helper would
// be sharing for its own sake.
//
// ============================== THE iss CORRECTION, 2026-08-27 ============
//
// `iss` USED TO BE VALIDATED AS AN ABSOLUTE https URL AND THAT WAS WRONG.
//
// An LTI issuer is an identifier, not a location. It is only ever compared for
// equality -- against the `iss` claim of an inbound id_token, and as half of
// the (iss, client_id) registration key. Nothing fetches it, redirects to it,
// or parses it.
//
// The 1EdTech reference implementation sends the bare string `certidemy`. That
// is legal and LTI-SETUP.md says so in its closing notes. The rule refused a
// real, specification-conformant issuer.
//
// It went unnoticed because our own lti-ri registration was created through the
// console with a URL that was WRONG -- a predicted value -- and then corrected
// to `certidemy` with raw SQL, which validates nothing. So the constraint was
// never tested against the value it would have rejected, and the row that
// proves it wrong exists only because the validation was bypassed.
//
// The three ENDPOINTS keep httpsUrl and always will: jwks_url is fetched
// server-to-server, auth_login_url is redirected to in a browser, auth_token_url
// is posted to. Those are locations. A scheme-relative or http value there
// fails later, at a moment that names OIDC rather than the typo.

import { HttpError } from "./supabase.ts";

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Bounds on the clock tolerance.
 *
 * The LTI specification states no normative value and defers to OIDC; the
 * industry norm is 30-60 seconds. These bounds are not the norm, they are the
 * edges of defensible: below 5 seconds ordinary network jitter starts rejecting
 * valid launches, and above 300 the replay window is wide enough that the check
 * has stopped meaning much.
 */
export const SKEW_MIN = 5;
export const SKEW_MAX = 300;

/**
 * The status vocabulary, in one place, agreeing with migration 260's CHECK.
 *
 * Two values, not three. lti_tool_keys needs 'retiring' because a key being
 * rotated must still verify signatures it already made; a registration has no
 * half-state -- either an institution may initiate a login into us or it may
 * not.
 */
export const PLATFORM_STATUSES = ["active", "inactive"] as const;
export type PlatformStatus = (typeof PLATFORM_STATUSES)[number];

export function isPlatformStatus(v: unknown): v is PlatformStatus {
  return typeof v === "string" &&
    (PLATFORM_STATUSES as readonly string[]).includes(v);
}

/** Absolute https, parseable. For the three ENDPOINTS only -- never for iss. */
export function httpsUrl(value: string | undefined, field: string): string {
  const v = value?.trim();
  if (!v) throw new HttpError(400, `${field} is required`);
  let u: URL;
  try {
    u = new URL(v);
  } catch {
    throw new HttpError(400, `${field} must be an absolute URL`);
  }
  if (u.protocol !== "https:") {
    throw new HttpError(400, `${field} must use https`);
  }
  return v;
}

/**
 * An issuer identifier. NOT a URL -- see the header.
 *
 * The only real constraints are the ones that would break the equality compare
 * it exists for: it must be present, and it must not carry whitespace, because
 * a trailing space is invisible in a form field and produces a registration
 * that never matches any launch while looking correct on screen. That is the
 * failure this rejects; the URL rule rejected valid issuers instead.
 */
export function issuerId(value: string | undefined, field = "iss"): string {
  const v = value?.trim();
  if (!v) throw new HttpError(400, `${field} is required`);
  if (/\s/.test(v)) {
    throw new HttpError(400, `${field} must not contain whitespace`);
  }
  return v;
}

/** A non-empty trimmed string, for client_id and name. */
export function requiredText(
  value: string | undefined,
  field: string,
): string {
  const v = value?.trim();
  if (!v) throw new HttpError(400, `${field} is required`);
  return v;
}

/** Whole number inside the defensible band. */
export function skewSeconds(value: unknown, field: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < SKEW_MIN || n > SKEW_MAX) {
    throw new HttpError(
      400,
      `${field} must be a whole number between ${SKEW_MIN} and ${SKEW_MAX}`,
    );
  }
  return n;
}
