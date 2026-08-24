// POST /functions/v1/issue-credential-console
//
// Body: { issuer_id, achievement_code, recipient_email, recipient_name,
//         display_id?, issued_at?, expires_at?, is_specimen? }
// Auth: Bearer JWT -- platform_admin, or the team_admin of the company that
//       owns THIS issuer.
//
// The human surface. A partner admin issues one credential to one person from
// the console, with no API key and no code. Until this existed, handing a
// certificate to a single late enrolee meant minting a key and making an HTTP
// request by hand.
//
// ============================== THE ISSUER COMES FROM THE BODY =============
//
// READ THIS BEFORE CHANGING THE AUTHORIZATION.
//
// issue-partner-credential derives the issuer from the API key: the caller
// cannot name an issuer, because the key IS the identity. This function takes
// issuer_id as an ordinary field in a JSON body that any authenticated user can
// put anything into.
//
// So requireIssuerAccess is the ONLY thing standing between a valid Supabase
// JWT -- which every signed-up learner on the platform holds -- and minting a
// credential under someone else's issuer identity. A signed OB3 document
// carrying another organisation's name, resolving at their permanent URL, with
// their signature over it.
//
// It is called before anything is read or written, it throws rather than
// returning a boolean, and it compares issuers.company_id against the caller's
// own team_admin memberships rather than merely checking they hold the role
// somewhere. Do not move it, do not make it conditional, and do not add a path
// that reaches issueCredential without it.
//
// ============================== THE MINT IS SHARED =========================
//
// Achievement resolution, dates, the insert with its collision retry, and the
// webhook queue are _shared/issue.ts -- the same code the machine API runs. Two
// implementations of credential minting would drift, and the drift would be
// invisible: credentials differing in which columns were set, or one source
// quietly not queueing webhooks.
//
// ============================== SPECIMENS, platform_admin ONLY =============
//
// is_specimen mints a demonstration credential. It exists because the mechanism
// was designed and then left unreachable: seven specimens exist, four parts of
// the platform branch on the flag, and neither issuing path could produce one.
// A mechanism the minting code cannot reach is a mechanism that rots.
//
// It also makes this path exercisable without minting something that reads as a
// real award -- a specimen is excluded from the signed status list and refused
// an anchor proof. It is NOT free: the row is permanent, revocation is a status
// change rather than a delete, and status_list_index is still consumed from the
// sequence.
//
// platform_admin ONLY, refused rather than ignored for a team_admin. A partner
// able to set this could have real credentials read as demonstrations. That is
// a claims decision and it is Certidemy's, not theirs.
//
// ============================== WHAT DIFFERS FROM THE API ==================
//
// No idempotency key. The machine API needs one because a webhook that fires
// twice must not mint twice; a person clicking a button once does not have that
// failure mode. A double-submitted form WILL mint two credentials -- that is
// the same behaviour as two identical keyless POSTs to the API, and it is
// visible and revocable rather than silent.
//
// The audit row is admin_actions, keyed to actor_user_id. issuer_api_requests
// cannot represent this caller: it is keyed to api_key_id and there is no key.
// Those are two records of two different facts, which is why _shared/issue.ts
// writes neither.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";
import { requireIssuerAccess } from "../_shared/authorize.ts";
import {
  IssueError,
  issueCredential,
  MAX_RECIPIENT_NAME,
  RECIPIENT_EMAIL_RE,
} from "../_shared/issue.ts";

interface Body {
  issuer_id?: string;
  achievement_code?: string;
  recipient_email?: string;
  recipient_name?: string;
  display_id?: string;
  issued_at?: string;
  expires_at?: string;
  /** platform_admin ONLY. See the specimen block in the header. */
  is_specimen?: boolean;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  try {
    const actor = await authenticate(req);
    const svc = getServiceClient();

    const body = (await req.json()) as Body;
    const issuerId = body.issuer_id?.trim();
    const achCode = body.achievement_code?.trim();
    const email = body.recipient_email?.trim().toLowerCase();
    const holderName = body.recipient_name?.trim();
    const displayId = body.display_id?.trim() || null;

    if (!issuerId || !UUID_RE.test(issuerId)) {
      throw new HttpError(400, "valid issuer_id required");
    }

    // BEFORE any read or write, and before the rest of the body is trusted for
    // anything. See the header: this is the whole gate.
    const access = await requireIssuerAccess(svc, actor, issuerId);

    if (!achCode) throw new HttpError(400, "achievement_code required");
    if (!email || !RECIPIENT_EMAIL_RE.test(email)) {
      throw new HttpError(400, "valid recipient_email required");
    }
    if (!holderName) throw new HttpError(400, "recipient_name required");
    if (holderName.length > MAX_RECIPIENT_NAME) {
      throw new HttpError(
        400,
        `recipient_name must be ${MAX_RECIPIENT_NAME} characters or fewer`,
      );
    }

    // A specimen renders as a demonstration everywhere it is read -- the verify
    // page, the share card, the certificate. A partner able to mark their own
    // credentials that way could issue real ones and have them read as demos,
    // or the reverse once the flag is editable. That is a claims problem, not a
    // permission convenience, so it is Certidemy's to set.
    //
    // REFUSED, NOT IGNORED. Silently dropping the flag would tell the operator
    // they minted a specimen when they minted a real credential -- the silent
    // success this codebase keeps paying for. requireIssuerAccess already
    // resolved the role; this only reads it.
    const wantsSpecimen = body.is_specimen === true;
    if (wantsSpecimen && access.role !== "platform_admin") {
      throw new HttpError(403, "only a platform_admin may issue a specimen");
    }

    let issued;
    try {
      issued = await issueCredential(svc, {
        issuerId,
        achievementCode: achCode,
        recipientEmail: email,
        recipientName: holderName,
        displayId,
        issuedAt: body.issued_at ?? null,
        expiresAt: body.expires_at ?? null,
        isSpecimen: wantsSpecimen,
      });
    } catch (err) {
      if (!(err instanceof IssueError)) throw err;
      switch (err.kind) {
        case "issuer_not_found":
          // requireIssuerAccess already refuses an issuer with no company, so
          // reaching here means the row vanished between the two reads.
          throw new HttpError(404, "issuer not found");
        case "achievement_not_found":
          throw new HttpError(404, err.message);
        case "achievement_not_active":
          throw new HttpError(409, err.message);
        case "bad_issued_at":
        case "bad_expires_at":
          throw new HttpError(400, err.message);
        default:
          // insert_failed and code_collision. The detail is logged inside the
          // shared function; the caller gets the same opaque message the API
          // returns, because neither is actionable by the person clicking.
          console.error("console issuance failed", err.kind, err.detail);
          throw new HttpError(500, "failed to issue credential");
      }
    }

    // Audit. A partner minting under their own identity is a commercial and a
    // compliance fact, and "who issued this, from where" has to be answerable
    // later. role records whether this was the partner acting for themselves or
    // Certidemy acting on their behalf -- those read very differently in a
    // dispute.
    const { error: logErr } = await svc.from("admin_actions").insert({
      actor_user_id: actor,
      action: "issue_credential_console",
      target_type: "credential",
      target_id: issued.id,
      reason: null,
      metadata: {
        role: access.role,
        company_id: access.companyId,
        issuer_id: issued.issuer.id,
        issuer_slug: issued.issuer.slug,
        achievement_code: issued.achievement.code,
        credential_code: issued.credentialCode,
        recipient_email: issued.recipientEmail,
        display_id: issued.displayId,
        // From the result, not the request: the audit row records what was
        // written, not what was asked for.
        is_specimen: issued.isSpecimen,
        webhooks_queued: issued.webhooksQueued,
      },
    });
    if (logErr) console.warn("admin_actions log failed", logErr);

    return jsonResponse({
      ok: true,
      credential: {
        id: issued.id,
        code: issued.credentialCode,
        display_id: issued.displayId,
        recipient_email: issued.recipientEmail,
        recipient_name: issued.recipientName,
        issued_at: issued.issuedAt,
        expires_at: issued.expiresAt,
        is_specimen: issued.isSpecimen,
        url: `${issued.issuer.baseUrl}/credentials/${issued.credentialCode}`,
        badge_url: `${issued.issuer.baseUrl}/credentials/${issued.credentialCode}/badge`,
        verify_url: `${issued.issuer.siteUrl}/verify/${issued.credentialCode}`,
      },
      achievement: { code: issued.achievement.code, name: issued.achievement.name },
      issuer: { slug: issued.issuer.slug, name: issued.issuer.name },
      // Structured rather than the API's prose note: a console can render this
      // as a state, and it decides whether the UI says "sent" or "waiting".
      //
      // `claimed` is false BY CONSTRUCTION -- this path always writes user_id
      // NULL. It deliberately does NOT claim the recipient has no account:
      // nothing here looked, and asserting an unchecked fact is how a console
      // ends up telling a partner something Certidemy never verified. If they
      // already have one, claim_credentials links it at their next signup
      // attempt or on an admin re-run.
      recipient: {
        claimed: false,
        claims_on_signup: true,
      },
      webhooks_queued: issued.webhooksQueued,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
