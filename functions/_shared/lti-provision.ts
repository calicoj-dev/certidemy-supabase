// LTI phase 2: turning a verified student launch into a real Certidemy session.
//
// ============================== WHY THIS IS A MODULE, NOT A FUNCTION =======
//
// It was designed as a separate edge function with verify_jwt = true, and that
// was wrong twice over.
//
// THE BOUNDARY WOULD HAVE BEEN ILLUSORY. verify_jwt = true refuses anonymous
// callers. The only credential that gets past it is the service-role key, and
// anyone holding that can call auth.admin.createUser directly. It would have
// refused strangers from doing something strangers already cannot do.
//
// DEPLOY SKEW IS THE ARGUMENT THAT DECIDES IT. Two separately deployed
// functions can be out of step, and lti-launch writing `resource_link_ok` while
// calling a provisioner that is not deployed yet means every student launch
// broken, at an institution, inside an iframe, on the one path that creates
// accounts. A module ships atomically with its caller and cannot skew.
//
// What is given up is the ability to invoke provisioning without a launch, and
// A PROVISIONING PATH REACHABLE WITHOUT A VERIFIED LAUNCH IS CLOSER TO A
// LIABILITY THAN A FEATURE. There is no caller for it.
//
// So the protection is not a gateway setting. It is that this code is only
// reachable from lti-launch, AFTER an RS256 signature from a registered
// platform has been verified against a key chosen from a registration we
// recorded at login time, bound to a single-use state row. lti-launch must be
// verify_jwt = false precisely because the request authenticates ITSELF that
// way; a Supabase JWT would prove nothing about any of it. This module sits
// behind that verification and nowhere else.
//
// ============================== THE OBVIOUS READING KEEPS BEING WRONG =====
//
// See LTI-PHASE-2.md section 9. Four fields in this feature read as something
// they are not, and the check below is one of them. Read that list before
// changing anything here.
//
// ============================== TOKEN VOLUME ==============================
//
// A session is minted on EVERY launch. Moodle's Embed launch container fires a
// launch on every activity VIEW, so the token count will exceed the student
// count by a large factor. It is not a sign-in count and must not be read as
// one. generateLink showed no rate limiting under six calls in one second
// (observed 2026-08-28), so the volume is not a failure mode -- only a
// misreading waiting to happen.

import {
  hasValue,
  type Claim,
  type LaunchContext,
} from "./lti-jwt.ts";

// deno-lint-ignore no-explicit-any
type Svc = any;

const SITE = "https://certidemy.com";

/**
 * The six outcomes. Each becomes the SECOND skeleton row for a resource-link
 * launch -- the first is written by lti-launch at verification.
 *
 * Two rows because one lies. A single row saying `resource_link_ok` for a
 * student who never got an account is the same defect LTI-SETUP.md Part Two
 * step 7 already documents for deep linking ("the row that lies"), made worse:
 * there, verification succeeded and a picker refused; here, verification
 * succeeds and an ACCOUNT may not exist.
 */
export type ProvisionOutcome =
  | "student_linked"
  | "student_provisioned"
  | "student_email_mismatch"
  | "student_email_absent"
  | "student_no_identity"
  | "student_mint_failed";

/**
 * WHERE THE INSTRUCTOR'S CHOICE RESOLVED TO -- AND WHY THIS IS NOT AN OUTCOME.
 *
 * `ProvisionOutcome` answers WHO THIS PERSON IS. This answers WHERE TO SEND
 * THEM. They fail independently: a student can be perfectly linked while the
 * activity points at a certification that has since been deleted, and folding
 * that into the outcome enum would describe a healthy identity as a broken one.
 *
 * There is a second reason, and it is structural. `ProvisionOutcome` is one half
 * of a cross-repo mirrored pair -- `scripts/i18n-lti-outcomes.mjs` in
 * certidemy-web reads this union and refuses to merge if the two drift. Adding
 * a member is a two-repo change by design. A destination failure has no business
 * paying that cost, and quietly widening the vocabulary that a checker exists to
 * police is how the checker stops meaning anything.
 *
 * `unsubstituted` is a real state, not defensiveness: we plant a LITERAL uuid,
 * so a platform returning the variable's own name has mangled it, and the
 * four-state reader is what turns that into a detectable event instead of a
 * student silently seated somewhere they were not sent.
 */
export type CertificationTarget =
  | { status: "absent" }
  | { status: "resolved"; id: string; code: string }
  | { status: "missing"; id: string }
  | { status: "unsubstituted" };

export interface ProvisionResult {
  outcome: ProvisionOutcome;
  /** Present when a session was minted. The bearer the browser redirects with. */
  tokenHash?: string;
  /** Where /auth/confirm should land them. */
  next?: string;
  /** Present when an account was found or created, even if the mint failed. */
  userId?: string;
  /** Present only for student_email_absent with a sub to link later. */
  linkToken?: string;
  /** Free-text detail for the skeleton row's error_code column. */
  detail?: string | null;
  /** Where the planted activity pointed. See CertificationTarget. */
  certification?: CertificationTarget;
}

/**
 * ONLY `provided` COUNTS, AND THIS IS THE CHECK THAT MATTERS MOST HERE.
 *
 * Claims are four-state (_shared/lti-jwt.ts): absent, provided_empty,
 * provided, unsubstituted. THREE OF THE FOUR MEAN "no address".
 *
 * `unsubstituted` is the dangerous one because it is a NON-EMPTY STRING THAT IS
 * NOT AN ADDRESS. Ask a platform for $Person.email.primary where it cannot
 * resolve and you receive that literal back -- present, a string, and not data.
 * A truthiness check passes it straight through.
 *
 * profiles.email is NOT NULL UNIQUE, so creating an account from it would
 * SUCCEED. There would be a real profile, with a real id, named after a
 * variable, and it would flow onward into credentials.holder_email, which is
 * hashed into a signed credential.
 *
 * THAT IS `holder_email ?? ""` WITH A LONGER STRING -- the defect
 * _shared/lti-jwt.ts:227 names in its own header, which produced a real-looking
 * sha256$ claiming an identity nobody ever recorded. The empty string was
 * caught because it was empty. This one would not be.
 */
function realValue(c: Claim<string>): string | null {
  if (!hasValue(c)) return null;
  const v = (c as { value: string }).value.trim();
  return v.length > 0 ? v : null;
}

/** sha256 hex. The link token is stored hashed; see mintLinkToken. */
async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Mint a Supabase session for an email and return the bearer to redirect with.
 *
 * generateLink DOES NOT SEND MAIL -- observed on the wire 2026-08-28, six calls
 * with no rate limiting and a confirmed-empty inbox. LTI-PHASE-2.md section 5
 * requires that no password email is ever sent at launch time, and this is the
 * call that would have broken it.
 *
 * The value it returns is called `hashed_token` here, `token` in the
 * action_link query string, and `token_hash` by verifyOtp. One value, three
 * names, one hop.
 */
async function mintSession(
  svc: Svc,
  email: string,
  next: string,
): Promise<string | null> {
  const { data, error } = await svc.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${SITE}${next}` },
  });
  if (error || !data?.properties?.hashed_token) {
    console.error("lti mint failed", error?.message ?? "no hashed_token");
    return null;
  }
  return data.properties.hashed_token as string;
}

/**
 * Remember (platform_id, sub) -> user.
 *
 * NO ROW IS WRITTEN WHEN sub IS ABSENT. Absence is a row that isn't there --
 * the discipline lti_capabilities uses for `unknown`, and migration 262's
 * reason for sub being NOT NULL. A nullable key degrades into a value somebody
 * compares, and "the user with no sub" would collide with the next one.
 *
 * Never unique on user_id: Canvas emits a different sub per placement, so
 * several rows converging on one user is the expected shape.
 *
 * NO TIMESTAMP IS WRITTEN FROM HERE, and the first live launch is why.
 *
 * It used to send last_seen_at from `new Date()` -- the EDGE FUNCTION's clock --
 * while first_seen_at took the column default, which is POSTGRES's. Two clocks,
 * one row. The proof launch on 2026-08-29 wrote a row whose last_seen_at was
 * 13ms EARLIER than its first_seen_at, for a single event.
 *
 * That is the defect LTI-SETUP.md Part One section 7 already documents by name
 * -- "first_seen_at can be LATER than last_seen_at, and that is the writer" --
 * reproduced in a new table by a session that had read it hours before.
 *
 * So the column is owned by the database (migration 263, a BEFORE INSERT OR
 * UPDATE trigger) and no caller can get it wrong. A caution did not prevent
 * this; removing the ability to write it does.
 *
 * The upsert also serves the SEEN-AGAIN case, which is why the fast path no
 * longer has an update of its own: one writer, one statement, and on conflict
 * the trigger advances last_seen_at.
 */
async function linkSub(
  svc: Svc,
  platformId: string,
  sub: string | null,
  userId: string,
): Promise<void> {
  if (!sub) return;
  await svc
    .from("lti_users")
    .upsert(
      { platform_id: platformId, sub, user_id: userId },
      { onConflict: "platform_id,sub" },
    )
    .then(undefined, () => {});
}

/**
 * The second door (LTI-PHASE-2.md section 3).
 *
 * The document said the student signs up and "this launch links by sub". There
 * is nothing for sub to link TO -- we see a sub, no row, no email, and no way
 * to know this is the person who just signed up. As written that is one door
 * and a loop. So the launch mints this, the breakout carries it to signup, and
 * signup consumes it and writes the lti_users row.
 *
 * THE HASH IS STORED, NEVER THE TOKEN. This is the first LTI bearer worth
 * stealing: holding one lets the holder assert "I am (platform_id, sub)", and
 * an attacker who linked their own account would receive that student's future
 * launches -- a takeover that arrives silently and looks like a working
 * integration. Migration 257 named the line; this is the side of it that needs
 * the treatment.
 */
async function mintLinkToken(
  svc: Svc,
  platformId: string,
  deploymentId: string | null,
  sub: string,
  locale: string,
): Promise<string | null> {
  const raw = crypto.randomUUID() + crypto.randomUUID();
  const { error } = await svc.from("lti_link_tokens").insert({
    token_sha256: await sha256Hex(raw),
    platform_id: platformId,
    deployment_id: deploymentId,
    sub,
    locale,
  });
  if (error) {
    console.error("lti link token insert failed", error.message);
    return null;
  }
  return raw;
}

/**
 * Resolve or create the student, then mint.
 *
 * ORDER, AND WHAT EACH MISS DOES:
 *
 *   sub  -> lti_users (platform_id, sub)   HIT: the fast path, the common case
 *   email -> profiles.email                HIT: link and mint
 *                                          MISS: create, then link and mint
 *   neither                                the two doors, or door one alone
 *
 * profiles.email rather than auth.admin.listUsers(): the latter is paginated
 * and O(all users), which is unusable per launch. profiles.email is unique and
 * indexed, and handle_new_user (072) keeps it in step with auth.users. IT CAN
 * DRIFT if an address is ever changed on one side only; recorded rather than
 * guarded, because nothing in this repo changes it today.
 */
/**
 * The custom parameter lti-deep-link plants on every content item. A uuid, never
 * a code -- see the long note at the plant site for why a mutable key would
 * orphan every planted activity at every institution with nothing here to see
 * it.
 */
const CERT_CUSTOM_KEY = "certidemy_certification_id";

/** Resolve the planted id to a certification that exists RIGHT NOW. */
async function resolveCertification(
  svc: Svc,
  ctx: LaunchContext,
): Promise<CertificationTarget> {
  const claim = ctx.custom[CERT_CUSTOM_KEY];
  if (!claim) return { status: "absent" };
  if (claim.status === "unsubstituted") return { status: "unsubstituted" };

  const id = realValue(claim);
  if (!id) return { status: "absent" };

  /* THE LOOKUP IS THE POINT. Reading the CURRENT code from the id is what makes
     a rename invisible to every planted activity: the platform replays the same
     uuid forever and we resolve it against live data each time. */
  const { data } = await svc
    .from("certifications")
    .select("code, status")
    .eq("id", id)
    .maybeSingle();

  if (!data?.code) return { status: "missing", id };
  // Never seat anyone into a draft, even if a planted activity names one.
  if (data.status === "draft") return { status: "missing", id };
  return { status: "resolved", id, code: String(data.code).toLowerCase() };
}

/**
 * ENROL THE STUDENT, ON THEIR BEHALF, AND THIS IS A DECISION RATHER THAN A SIDE
 * EFFECT.
 *
 * /learn/[cert] is behind an enrolment gate (isEnrolledInCert). Sending a
 * launched student there without a row shows them "Add this certification" -- an
 * upsell page -- instead of the lessons their instructor planted. Getting the
 * URL right and stopping there would have looked like it worked.
 *
 * Why it is legitimate: LTI-PHASE-2.md section 2 says a launched student gets
 * the app -- lessons, practice, progress. Enrolment is free and carries no
 * commerce ("you only pay when you sit the exam"). And the instructor planting
 * the activity in their own course IS the consent; the student clicked it.
 *
 * SOURCE IS 'lti', NOT 'self'. The column exists to record provenance and this
 * enrolment is not self-service. It surfaces in listUserEnrollments and the
 * console census, so a convenient lie here propagates. Needs migration 265,
 * which widens the CHECK; the RLS insert policy still pins learners to 'self',
 * so nothing is granted to anyone -- this writes with service_role.
 *
 * IGNORE DUPLICATES, NEVER OVERWRITE. A student who enrolled herself last year
 * and later launches from her university's Moodle keeps source='self'. Rewriting
 * it would falsify how she actually got here, which is the one thing the column
 * is for.
 */
async function enrol(svc: Svc, userId: string, certificationId: string): Promise<boolean> {
  const { error } = await svc
    .from("user_certifications")
    .upsert(
      { user_id: userId, certification_id: certificationId, source: "lti", status: "active" },
      { onConflict: "user_id,certification_id", ignoreDuplicates: true },
    );
  if (error) {
    console.error("lti enrol failed", error.message);
    return false;
  }
  return true;
}

export async function provisionStudent(
  svc: Svc,
  ctx: LaunchContext,
  platformId: string,
  deploymentId: string | null,
  locale: string,
): Promise<ProvisionResult> {
  const sub = realValue(ctx.sub);
  const email = realValue(ctx.email)?.toLowerCase() ?? null;
  const fullName = realValue(ctx.name);

  const cert = await resolveCertification(svc, ctx);

  /**
   * SEATING IS ENROL-THEN-LAND, and it is one function because it must happen
   * at every point a `next` is produced. There are three, and a copy at each
   * would be a mirrored trio inside one file -- the shape that gets fixed in
   * two places out of three.
   *
   * An enrolment that fails falls back to the dashboard rather than sending a
   * student to a gate that will turn them away. That is the honest degradation:
   * they are signed in and in the app, just not seated.
   */
  const seat = async (userId: string): Promise<string> => {
    if (cert.status !== "resolved") return `/${locale}/dashboard`;
    const ok = await enrol(svc, userId, cert.id);
    return ok ? `/${locale}/learn/${cert.code}` : `/${locale}/dashboard`;
  };

  /* ---- 1. the fast path ------------------------------------------------ */
  if (sub) {
    const { data: link } = await svc
      .from("lti_users")
      .select("user_id")
      .eq("platform_id", platformId)
      .eq("sub", sub)
      .maybeSingle();

    if (link?.user_id) {
      // Same writer as the create path. The trigger advances last_seen_at.
      await linkSub(svc, platformId, sub, link.user_id);

      const { data: prof } = await svc
        .from("profiles")
        .select("email")
        .eq("id", link.user_id)
        .maybeSingle();

      const known = (prof?.email ?? "").toLowerCase();
      if (!known) return { outcome: "student_mint_failed", userId: link.user_id, detail: "profile_has_no_email" };

      /* THE LMS ADDRESS CHANGED, AND WE DO NOT FOLLOW IT.
         Email is the identity; rewriting it silently MOVES AN ACCOUNT. So the
         session is minted for the user we already know, and the divergence is
         recorded.

         THIS IS A SIGNAL, NOT A REFUSAL. The student still gets in. Recording
         it as a failure would make the console lie in the other direction --
         a working launch filed as broken -- and an institution changing a
         student's address mid-course is something worth SEEING rather than
         inferring later from a support ticket. */
      const mismatch = email !== null && email !== known;
      const next = await seat(link.user_id);
      const tokenHash = await mintSession(svc, known, next);
      if (!tokenHash) return { outcome: "student_mint_failed", userId: link.user_id, certification: cert };
      return {
        outcome: mismatch ? "student_email_mismatch" : "student_linked",
        userId: link.user_id,
        tokenHash,
        next,
        certification: cert,
        detail: mismatch ? "lms_email_differs" : null,
      };
    }
  }

  /* ---- 2. resolve or create by email ----------------------------------- */
  if (email) {
    const { data: prof } = await svc
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (prof?.id) {
      /* AN EXISTING PROFILE IS LINKED, NOT REFUSED (LTI-PHASE-2.md section 3).
         A student who bought a voucher herself last year and later launches
         from her university's Moodle is the same person. Making her resolve a
         collision would be a worse product for no security gain -- the
         impersonation risk it would guard against is handled at the exam. */
      await linkSub(svc, platformId, sub, prof.id);
      const next = await seat(prof.id);
      const tokenHash = await mintSession(svc, email, next);
      if (!tokenHash) return { outcome: "student_mint_failed", userId: prof.id, certification: cert };
      return { outcome: "student_linked", userId: prof.id, tokenHash, next, certification: cert };
    }

    /* CREATE. email_confirm is set explicitly here rather than left to the
       magiclink path, which confirms only at REDEMPTION (observed) and would
       leave a student unconfirmed until they completed the hop.

       user_metadata.full_name is read by handle_new_user (072), so the LMS
       name reaches profiles with no extra write. */
    const { data: created, error: cErr } = await svc.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: fullName ? { full_name: fullName } : {},
    });
    if (cErr || !created?.user?.id) {
      console.error("lti createUser failed", cErr?.message);
      return { outcome: "student_mint_failed", detail: "create_user_failed" };
    }
    const userId = created.user.id as string;

    /* PROVISIONED WITHOUT A PASSWORD THE HOLDER EVER CHOSE, recorded by the
       code that knows it. There is no check that could replace this: at the
       auth layer a password nobody knows is indistinguishable from one the
       holder chose, and auth.users offers something that LOOKS like an answer
       and is not -- *_sent_at is stamped whether or not mail is delivered.

       IT GATES A MESSAGE, NOT ACCESS. The exam is gated by login and voucher.
       This decides whether the breakout says "set your password to continue"
       instead of showing a bare login form for an account the student does not
       know they have. Reading it as a security control is the same mistake as
       reading ALLOWED_TYPES as a defence. */
    await svc
      .from("profiles")
      .update({ password_set: false })
      .eq("id", userId)
      .then(undefined, () => {});

    await linkSub(svc, platformId, sub, userId);
    const next = await seat(userId);
    const tokenHash = await mintSession(svc, email, next);
    if (!tokenHash) return { outcome: "student_mint_failed", userId, certification: cert };
    return { outcome: "student_provisioned", userId, tokenHash, next, certification: cert };
  }

  /* ---- 3. no email ------------------------------------------------------ */

  /* NEVER INVENT AN ADDRESS. profiles.email is NOT NULL UNIQUE and feeds
     credentials.holder_email, which is hashed into a signed credential. A
     synthetic address produces a real-looking sha256$ claiming an identity
     nobody ever recorded. */

  if (!sub) {
    /* NOTHING TO CREATE FROM AND NOTHING TO LINK A LATER SIGNUP TO. Door two
       cannot work here, and the page must not offer a button that dead-ends.
       Door one -- ask your administrator -- is the whole of the honest answer.

       This is also the shape of the recorded Canvas limit: a privacy-strict
       institution emitting neither claim leaves no key at all. */
    return { outcome: "student_no_identity" };
  }

  /* DOOR TWO IS SEATED ON THE SECOND LAUNCH, NOT THIS ONE, and that is by
     construction rather than by omission. There is no account yet, so there is
     nobody to enrol; the student signs up, /auth/confirm consumes the link
     token, and their NEXT launch takes the fast path above and seats them in the
     instructor's certification. Section 12's whole assertion is that second
     launch.

     The cost is one launch's delay. Carrying the certification through signup
     would mean a column on lti_link_tokens and a claim in the confirm route --
     worth doing if the delay ever bites, and not worth guessing at now. */
  const linkToken = await mintLinkToken(svc, platformId, deploymentId, sub, locale);
  return { outcome: "student_email_absent", linkToken: linkToken ?? undefined, certification: cert };
}
