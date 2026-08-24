/**
 * supabase/functions/_shared/issue.ts
 *
 * Minting a partner credential. One implementation, two callers.
 *
 * ============================== WHY THIS FILE EXISTS =======================
 *
 * issue-partner-credential is the machine surface: an API key, an idempotency
 * key, a request log keyed to that key. issue-credential-console is the human
 * surface: a JWT, requireIssuerAccess, an admin_actions row. Those two differ
 * entirely in HOW THE CALLER IS IDENTIFIED and not at all in WHAT GETS MINTED.
 *
 * A second copy of the minting half would drift, and the drift would be
 * invisible: two credentials that differ in which columns were set, or one
 * source that quietly stops queueing webhooks. This codebase already carries
 * mirrored logic in three places by necessity (a SQL regex against a TS regex,
 * twice, and authorize.ts against lib/console/access.ts). This one is not
 * necessary -- both callers are TypeScript in the same deployment.
 *
 * ============================== WHAT IT OWNS ===============================
 *
 *   4. Achievement resolution, SCOPED to the issuer.
 *   5. issued_at / expires_at computation.
 *   6. The credential insert, including the collision retry loop.
 *   8. Queueing credential.issued webhooks.
 *
 * ============================== WHAT IT DOES NOT OWN =======================
 *
 * NO AUDIT ROW, of either kind. issuer_api_requests is keyed to api_key_id and
 * cannot represent a JWT caller; admin_actions is keyed to actor_user_id and
 * cannot represent a machine. They are two different records of two different
 * facts, not a duplication to unify. Each caller writes its own.
 *
 * No authentication, no authorization, no idempotency, no response shaping.
 *
 * ============================== SPECIMENS ==================================
 *
 * isSpecimen exists because the mechanism was unreachable from the only code
 * that mints. Seven specimen credentials exist and the platform branches on
 * is_specimen in four places -- verify-credential computes an effective_status
 * from it, credential-og renders a distinct card state so a demo cannot be
 * shared as real, _shared/certificate.ts marks the document, and open-badge
 * both refuses an anchor proof for one and excludes it from the status list.
 * Every one of those seven was created some other way, because both issuing
 * paths hardcoded false.
 *
 * A designed mechanism that the minting code cannot produce is a mechanism
 * that will rot. This closes that.
 *
 * It also makes the mint path exercisable. A specimen is NOT free -- read the
 * next paragraph before assuming it is -- but it is materially cheaper than a
 * real credential: open-badge:568 selects revoked indices with
 * is_specimen = false, so a specimen's index never occupies a bit in a signed
 * status list document, and open-badge:493 refuses to serve it an anchor proof.
 *
 * WHAT A SPECIMEN STILL COSTS: status_list_index defaults to
 * nextval('credential_status_index_seq') and is NOT NULL, so a specimen
 * consumes a sequence value like anything else -- the existing seven hold
 * indices 3 and 5 through 10. The row is permanent and revocation is a status
 * change, not a delete. "Cheaper" is not "free".
 *
 * ============================== THE RETRY LOOP =============================
 *
 * Five attempts, each with a freshly minted code, retrying ONLY on 23505.
 * Distinguishing a unique-violation from every other insert error is the whole
 * point of the loop: an insert-once version turns a rare, self-healing code
 * collision into a rare, unreproducible 500 that nobody can chase.
 */

import { getServiceClient } from "./supabase.ts";

// deno-lint-ignore no-explicit-any
type Svc = any;

/** The single definition. Both callers validate with this rather than each
 *  carrying a copy -- avoiding a fourth mirrored pair is the point of the
 *  file. Callers map a failure to their own error shape. */
export const RECIPIENT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Fits a certificate line and a badge. Enforced identically on both paths. */
export const MAX_RECIPIENT_NAME = 120;

/** No I, L, O, 0 or 1: these codes get read aloud and typed off paper. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Attempts before a code collision is treated as a fault rather than luck. */
const CODE_ATTEMPTS = 5;

function hex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomBlock(n: number): string {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  let out = "";
  for (const x of b) out += CODE_ALPHABET[x % CODE_ALPHABET.length];
  return out;
}

/**
 * credential_code -- the URL segment.
 *
 * Deliberately NOT the partner's own numbering. display_id carries that and
 * prints on the certificate. This one has entropy because it is public and
 * guessable codes let anyone walk /credentials/1..5000 and harvest every
 * holder name an issuer ever wrote.
 */
function mintCredentialCode(achievementCode: string): string {
  const stem = achievementCode
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 16);
  return `${stem}-${randomBlock(4)}-${randomBlock(4)}`;
}

/** 256 bits, matching the shape migration 185 backfilled. */
function mintSalt(): string {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return hex(b);
}

/**
 * Why a mint failed, in a form each caller can map to its own status code,
 * message and log detail.
 *
 * The kinds exist so the machine caller can reproduce its established wire
 * behaviour exactly -- it is a live partner API and its 404 body, its 409 body
 * and its issuer_api_requests.error strings are all observable.
 */
export type IssueFailure =
  | "issuer_not_found"
  | "achievement_not_found"
  | "achievement_not_active"
  | "bad_issued_at"
  | "bad_expires_at"
  | "insert_failed"
  | "code_collision";

export class IssueError extends Error {
  readonly kind: IssueFailure;
  /** The achievement status that was not 'active'. Set only for
   *  achievement_not_active, where both callers name it in the message. */
  readonly achievementStatus: string | null;
  /** The underlying database message, for insert_failed only. Logged by the
   *  caller, never returned to it. */
  readonly detail: string | null;

  constructor(
    kind: IssueFailure,
    message: string,
    opts?: { achievementStatus?: string | null; detail?: string | null },
  ) {
    super(message);
    this.name = "IssueError";
    this.kind = kind;
    this.achievementStatus = opts?.achievementStatus ?? null;
    this.detail = opts?.detail ?? null;
  }
}

export interface IssueInput {
  issuerId: string;
  achievementCode: string;
  recipientEmail: string;
  recipientName: string;
  displayId?: string | null;
  /** ISO string from the caller. Absent means now. */
  issuedAt?: string | null;
  /** ISO string from the caller. Absent falls back to the achievement's
   *  default_validity_days, then to no expiry. */
  expiresAt?: string | null;
  /**
   * Mint a demonstration credential rather than a real one.
   *
   * DEFAULTS FALSE, and every caller must decide deliberately to pass true.
   * issue-partner-credential does not expose it at all -- adding a field to a
   * live partner API is a change to its contract -- and
   * issue-credential-console exposes it only to platform_admin, because a
   * partner marking their own real credentials as demonstrations is a claims
   * problem, not a convenience.
   */
  isSpecimen?: boolean;
}

export interface IssuedCredential {
  id: string;
  credentialCode: string;
  displayId: string | null;
  recipientEmail: string;
  recipientName: string;
  issuedAt: string;
  expiresAt: string | null;
  achievement: { id: string; code: string; name: string };
  issuer: {
    id: string;
    slug: string;
    name: string;
    baseUrl: string;
    siteUrl: string;
  };
  /** What was actually written, not what was asked for. A caller rendering
   *  "demonstration" reads this rather than its own input. */
  isSpecimen: boolean;
  /** How many credential.issued rows were queued. Zero is normal -- most
   *  issuers register no webhook. */
  webhooksQueued: number;
}

/**
 * Mint one credential.
 *
 * The caller has already established that it is allowed to act for this
 * issuer. This function does NOT re-check that, with one exception it gets for
 * free: the achievement lookup is scoped by issuer_id, so an achievement code
 * belonging to someone else simply does not resolve. The database enforces the
 * same thing again in guard_credential_issuer, which compares
 * credentials.issuer_id against achievements.issuer_id on INSERT.
 */
export async function issueCredential(
  svc: Svc,
  input: IssueInput,
): Promise<IssuedCredential> {
  const client: Svc = svc ?? getServiceClient();

  const email = input.recipientEmail.trim().toLowerCase();
  const holderName = input.recipientName.trim();
  const displayId = input.displayId?.trim() || null;
  // Explicit === true: an absent field, null, or any stray truthy value from a
  // JSON body must not produce a specimen by accident.
  const isSpecimen = input.isSpecimen === true;

  /* ------------------------------------------------------------ issuer -- */
  // Read here rather than taken as an argument so there is exactly one place
  // that decides which issuer fields a credential is built from. Callers that
  // already hold the row pay one indexed primary-key lookup for that.
  const { data: issuer, error: iErr } = await client
    .from("issuers")
    .select("id, slug, name, base_url, site_url")
    .eq("id", input.issuerId)
    .maybeSingle();
  if (iErr) throw new Error(`issuer lookup: ${iErr.message}`);
  if (!issuer) {
    throw new IssueError("issuer_not_found", `issuer ${input.issuerId} not found`);
  }

  /* ------------------------------------------------------- achievement -- */
  // SCOPED. A code belonging to another issuer does not resolve, so a caller
  // cannot mint under an achievement it does not own even if it names one.
  const { data: ach, error: aErr } = await client
    .from("achievements")
    .select("id, code, name, status, issuer_id, default_validity_days")
    .eq("issuer_id", issuer.id)
    .eq("code", input.achievementCode)
    .maybeSingle();
  if (aErr) throw new Error(`achievement lookup: ${aErr.message}`);
  if (!ach) {
    throw new IssueError(
      "achievement_not_found",
      `no achievement "${input.achievementCode}" for issuer "${issuer.slug}"`,
    );
  }
  if (ach.status !== "active") {
    throw new IssueError(
      "achievement_not_active",
      `achievement "${input.achievementCode}" is ${ach.status}, not active`,
      { achievementStatus: ach.status },
    );
  }

  /* -------------------------------------------------------------- dates -- */
  const issuedAt = input.issuedAt ? new Date(input.issuedAt) : new Date();
  if (Number.isNaN(issuedAt.getTime())) {
    throw new IssueError("bad_issued_at", "issued_at is not a valid date");
  }

  let expiresAt: string | null = null;
  if (input.expiresAt) {
    const d = new Date(input.expiresAt);
    if (Number.isNaN(d.getTime())) {
      throw new IssueError("bad_expires_at", "expires_at is not a valid date");
    }
    expiresAt = d.toISOString();
  } else if (ach.default_validity_days) {
    expiresAt = new Date(
      issuedAt.getTime() + ach.default_validity_days * 86400_000,
    ).toISOString();
  }

  /* --------------------------------------------------------------- mint -- */
  // Five attempts, retrying ONLY on 23505. Any other error is a real fault and
  // stops immediately: retrying it five times would turn one failure into five
  // and still fail.
  let credential: { id: string; credential_code: string } | null = null;
  for (let attempt = 0; attempt < CODE_ATTEMPTS && !credential; attempt++) {
    const code = mintCredentialCode(ach.code);
    const { data, error } = await client
      .from("credentials")
      .insert({
        credential_code: code,
        user_id: null,
        holder_email: email,
        holder_name: holderName,
        display_id: displayId,
        achievement_id: ach.id,
        issuer_id: issuer.id,
        // No certification behind a partner achievement, and no exam, so no
        // score. Migration 231 made all three nullable for exactly this row.
        certification_id: null,
        certification_name: ach.name,
        certification_code: ach.code,
        score_pct: null,
        exam_attempt_id: null,
        issued_at: issuedAt.toISOString(),
        expires_at: expiresAt,
        status: "active",
        subject_salt: mintSalt(),
        is_specimen: isSpecimen,
      })
      .select("id, credential_code")
      .single();

    if (!error && data) {
      credential = data;
      break;
    }
    if ((error as { code?: string } | null)?.code !== "23505") {
      console.error("credential insert failed", error);
      throw new IssueError("insert_failed", "failed to issue credential", {
        detail: error?.message ?? "insert failed",
      });
    }
  }
  if (!credential) {
    throw new IssueError("code_collision", "failed to issue credential");
  }

  /* ----------------------------------------------------------- webhooks -- */
  // QUEUED, not delivered. A POST fired from inside a request handler would
  // fail silently on a slow endpoint and take the issuance response with it.
  //
  // Queued HERE rather than in either caller, deliberately: a partner watching
  // credential.issued must see console-issued credentials too. If this lived
  // only on the machine path, the two sources would produce different
  // observable behaviour and nobody would notice until a partner asked why
  // some credentials never fired.
  //
  // The payload shape is a partner-facing contract. Receivers depend on these
  // field names -- do not rename or drop one without treating it as a breaking
  // change to their integration.
  let webhooksQueued = 0;
  const { data: hooks } = await client
    .from("issuer_webhooks")
    .select("id, events")
    .eq("issuer_id", issuer.id)
    .eq("is_active", true);
  const due = (hooks ?? []).filter((h: { events: string[] }) =>
    h.events?.includes("credential.issued")
  );
  if (due.length > 0) {
    webhooksQueued = due.length;
    await client.from("webhook_deliveries").insert(
      due.map((h: { id: string }) => ({
        webhook_id: h.id,
        event: "credential.issued",
        payload: {
          event: "credential.issued",
          issuer: issuer.slug,
          achievement_code: ach.code,
          credential_code: credential!.credential_code,
          display_id: displayId,
          recipient_email: email,
          recipient_name: holderName,
          issued_at: issuedAt.toISOString(),
          url: `${issuer.base_url}/credentials/${credential!.credential_code}`,
          // Additive, not a rename: existing receivers ignore an unknown key,
          // and one that does read it is told this is a demonstration rather
          // than being handed a real-looking event for a demo credential.
          is_specimen: isSpecimen,
        },
        status: "pending",
        next_retry_at: new Date().toISOString(),
      })),
    ).then(() => {}, (e: unknown) => console.warn("webhook queue failed", e));
  }

  return {
    id: credential.id,
    credentialCode: credential.credential_code,
    displayId,
    recipientEmail: email,
    recipientName: holderName,
    issuedAt: issuedAt.toISOString(),
    expiresAt,
    isSpecimen,
    achievement: { id: ach.id, code: ach.code, name: ach.name },
    issuer: {
      id: issuer.id,
      slug: issuer.slug,
      name: issuer.name,
      baseUrl: issuer.base_url,
      siteUrl: issuer.site_url,
    },
    webhooksQueued,
  };
}
