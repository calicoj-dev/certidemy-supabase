-- 262_lti_phase2_identity.sql
--
-- The identity objects LTI phase 2 needs: an LMS-identity map, the token that
-- makes the withheld-email path a door rather than a loop, and a flag recording
-- that a profile was provisioned without a password its holder ever chose.
--
-- Editor-first: this ran live in the SQL editor on 2026-08-28, one statement at
-- a time. The file is the record of what already ran, not a script anyone
-- executes. No function body, so no md5 -- section 5 records the observed
-- state, the discipline 247, 248, 251, 252, 253, 256 and 257 use.
--
-- DDL BELOW IS AS POSTGRES STORES IT, NOT AS IT WAS SUBMITTED. The expires_at
-- default was written as `now() + interval '24 hours'` and is stored as
-- `(now() + '24:00:00'::interval)`. Read back from the live catalogue rather
-- than copied from the statement that was sent.
--
-- ============================ WHY IT EXISTS ==============================
--
-- LTI-PHASE-2.md section 7 names the surface area. The decision it records is
-- that a launched student gets the whole app with a real account, never the
-- exam, and that a withheld email is refused with two doors rather than given
-- an invented address. These three objects are the identity half of that.
--
-- ============================ 257 DECIDED THE SHAPE OF THIS ==============
--
-- lti_launch_sessions is NOT widened, and that is not a style preference.
-- 257's own header says it twice:
--
--   "IT HOLDS NO PII ... When phase 2 needs identity it gets a decision of its
--    own, not a column somebody added early."
--
--   "If this row ever came to hold something worth stealing, 122 bits in a URL
--    would stop being the right answer and it would need a cookie or a nonce of
--    its own. That is the line to watch when phase 2 adds a user."
--
-- That line is the test applied throughout below.
--
-- IT ALSO MEANS THE STUDENT LAUNCH GETS NO SESSION ROW AT ALL on the happy
-- path. A picker session exists because the picker is a SECOND PAGE that needs
-- the launch context back. The student launch has no second page when the
-- email is present: the POST verifies, resolves or provisions, mints, and
-- redirects. A row keyed by a UUID in a URL that exchanges for a login as a
-- named person is precisely the thing 257 warns about. The Supabase token_hash
-- is a better bearer than one we would invent -- single-use, observed refusing
-- replay with 403 otp_expired on 2026-08-28.
--
-- ============================ SUB IS A CACHE, NOT AN IDENTITY ============
--
-- EMAIL IS THE IDENTITY. sub is how a launch skips the lookup.
--
-- That ordering is forced by what sub actually is, researched in
-- HANDOFF-v8_8.md section 6 and not assumed:
--
--   * sub MAY BE ABSENT ENTIRELY. The identity key is itself optional.
--   * sub is unique only WITHIN a platform.
--   * Canvas reportedly emits DIFFERENT VALUES PER PLACEMENT.
--
-- So lti_users has:
--
--   unique (platform_id, sub)   -- sub is unique only within a platform
--   NO unique on user_id        -- many rows converging on one user is the
--                                  EXPECTED shape on Canvas, not a defect
--   sub NOT NULL                -- see below
--
-- SUB NOT NULL IS THE DESIGN. A launch with no sub writes NO ROW. Absence is a
-- row that isn't there -- the same discipline lti_capabilities uses for
-- unknown, and for the same reason: a nullable key degrades into a value
-- somebody compares. If sub were nullable, one row per platform would silently
-- become "the user with no sub" and collide with the next one.
--
-- The cost is a known limit, recorded rather than engineered around: a
-- privacy-strict Canvas student who resolves the withheld-email path at
-- placement A meets the same page at placement B, because the sub differs and
-- the email that would have united them was never sent.
--
-- ============================ THE LINK TOKEN IS WORTH STEALING ===========
--
-- lti_link_tokens is the mechanism behind LTI-PHASE-2.md section 3's second
-- door. The document said the student signs up and "this launch links by sub",
-- and there is nothing for sub to link TO: we see a sub, no row, no email, and
-- no way to know this is the person who just signed up. As written that is one
-- door and a loop.
--
-- So the launch mints a token, the breakout carries it to signup, and signup
-- consumes it and writes the lti_users row.
--
-- WHICH MAKES IT THE FIRST LTI BEARER THAT IS WORTH STEALING, and 257's line
-- says what that costs. Holding one lets the holder assert "I am
-- (platform_id, sub)". An attacker who linked their own account would receive
-- that student's future launches -- an account takeover that arrives silently
-- and looks like a working integration.
--
--   token_sha256   THE HASH IS STORED, NEVER THE TOKEN. A database read does
--                  not yield a usable capability.
--   consumed_at    single use.
--   expires_at     24 hours. Long enough to sign up and come back, short
--                  enough that an abandoned one is not a standing capability.
--                  This is a guess at human behaviour, not a derived number.
--                  It is observable: tokens expiring unconsumed are the signal
--                  that it is wrong.
--
-- ============================ password_set IS TRI-STATE ==================
--
-- null = unknown, false = provisioned without one, true = one has been set.
--
-- NOT NULL DEFAULT TRUE WOULD HAVE BEEN A LIE ABOUT EVERY EXISTING ROW. There
-- is an OAuth path (app/[locale]/auth/callback), so some existing profiles have
-- no password either, and this migration knows nothing about which. Statement 9
-- asserted the honest version: 31 profiles, 0 non-null. The column claims
-- nothing about anybody who predates it.
--
-- THE EXAM BREAKOUT ACTS ONLY ON false. An unknown profile gets the ordinary
-- login. Conservative in the direction that matters: telling somebody to set a
-- password they already have is a worse failure than not telling somebody who
-- needs to.
--
-- IT IS NOT A CONVENIENCE THAT A CHECK COULD LATER REPLACE. THERE IS NO CHECK.
-- At the auth layer a password nobody knows is indistinguishable from one the
-- holder chose, and auth.users offers nothing that answers the question --
-- worse, it offers something that LOOKS like it does. See below.
--
-- ============================ *_sent_at IS NOT EVIDENCE OF EMAIL =========
--
-- Observed on the wire 2026-08-28, and recorded here because this column is
-- where somebody will come looking for an alternative to password_set.
--
-- auth.admin.generateLink() DOES NOT SEND MAIL. Six calls in about one second
-- all returned 200 with no rate limiting -- a limiter exists to protect a mail
-- sender and it never engaged -- and the inbox was then confirmed empty, spam
-- and trash included.
--
-- AND EVERY ONE OF THOSE CALLS STAMPED A TIMESTAMP. confirmation_sent_at on
-- creation, recovery_sent_at on each call after. Eight stamps, zero emails.
--
-- Those columns record TOKEN ISSUANCE, NOT DELIVERY. Every LTI-provisioned
-- student will carry a populated confirmation_sent_at having never been
-- written to. Anything reasoning from it to "this person was emailed" is
-- wrong about exactly the population this migration creates.
--
-- ============================ CLOSED, LIKE THE OTHER FIVE ================
--
-- No grant, no policy, RLS on. service_role only, joining lti_tool_keys,
-- lti_capabilities, lti_nonces, lti_launch_evidence and lti_launch_skeleton.
-- 256 added console reads for some tables LATER and deliberately; a support
-- screen that needs to see which LMS identity maps to a student is its own
-- decision, not a grant added here in advance.
--
-- ============================ WHAT THIS CHANGES OUTSIDE ITSELF ===========
--
-- LTI-PROVISIONED STUDENTS APPEAR IMMEDIATELY IN /console/people AS "NEVER
-- ACTIVATED" WITH NO ENROLLMENTS. That is correct -- they are real accounts --
-- and it is not this migration's problem to solve. But it means the People
-- funnel starts counting LMS arrivals alongside self-signups the day phase 2
-- ships, and "never activated" means a different thing for a student who
-- arrived through their university's Moodle than for someone who signed up and
-- never came back. The metric does not break; it changes meaning. Whoever
-- reads it next should know that before drawing a conclusion from it.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).
-- Idempotent: if-not-exists throughout.

-- ---------------------------------------------------------------------------
-- 1. lti_users -- the LMS identity map.
--
--    user_id references auth.users(id). The FK was accepted; auth.users is
--    owned by supabase_auth_admin (246) and a reference to it is a normal
--    pattern here (114, 157). Note it is NOT visible in PostgREST's schema
--    description, because auth is not an exposed schema -- so the platform_id
--    FK below can be verified from the API and this one cannot. It was
--    observed accepted in the editor.
-- ---------------------------------------------------------------------------

create table if not exists public.lti_users (
  id            uuid primary key default gen_random_uuid(),
  platform_id   uuid not null references public.lti_platforms(id) on delete cascade,
  sub           text not null,
  user_id       uuid not null references auth.users(id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  unique (platform_id, sub)
);

-- ---------------------------------------------------------------------------
-- 2. The reverse lookup.
--
--    unique (platform_id, sub) serves the launch path. This index serves the
--    other direction -- "which LMS identities point at this user" -- which is
--    the support question, and on Canvas the answer is legitimately several.
-- ---------------------------------------------------------------------------

create index if not exists lti_users_user_id_idx on public.lti_users (user_id);

alter table public.lti_users enable row level security;

-- ---------------------------------------------------------------------------
-- 3. lti_link_tokens -- the second door.
--
--    deployment_id is nullable and ON DELETE SET NULL for the same reason as
--    257: deleting a deployment must not destroy the record of a launch that
--    came through it.
-- ---------------------------------------------------------------------------

create table if not exists public.lti_link_tokens (
  id            uuid primary key default gen_random_uuid(),
  token_sha256  text not null unique,
  platform_id   uuid not null references public.lti_platforms(id) on delete cascade,
  deployment_id uuid references public.lti_deployments(id) on delete set null,
  sub           text not null,
  locale        text,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null default (now() + '24:00:00'::interval),
  consumed_at   timestamptz
);

alter table public.lti_link_tokens enable row level security;

-- ---------------------------------------------------------------------------
-- 4. The provisioning flag.
--
--    Deliberately no NOT NULL and no DEFAULT. See the header.
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists password_set boolean;

-- ---------------------------------------------------------------------------
-- 5. Observed state, 2026-08-28.
--
--    From information_schema and pg_class in the editor, and re-read from the
--    live PostgREST schema afterwards.
--
--    lti_users
--      id             uuid       not null  default gen_random_uuid()  PK
--      platform_id    uuid       not null  FK -> lti_platforms.id
--      sub            text       not null
--      user_id        uuid       not null  FK -> auth.users.id
--      first_seen_at  timestamptz not null default now()
--      last_seen_at   timestamptz not null default now()
--
--    lti_link_tokens
--      id             uuid       not null  default gen_random_uuid()  PK
--      token_sha256   text       not null  unique
--      platform_id    uuid       not null  FK -> lti_platforms.id
--      deployment_id  uuid       null      FK -> lti_deployments.id
--      sub            text       not null
--      locale         text       null
--      created_at     timestamptz not null default now()
--      expires_at     timestamptz not null default (now() + '24:00:00'::interval)
--      consumed_at    timestamptz null
--
--    profiles.password_set   boolean, nullable, NO default, last column
--
--    relrowsecurity = true and 0 policies on both new tables.
--    profiles_total 31, password_set_non_null 0.
--
--    Verified independently against the live API rather than from the editor
--    paste: the platform_id FK refuses an unknown id with 23503, and the
--    expires_at default reads back REWRITTEN from the submitted
--    `interval '24 hours'` to `'24:00:00'::interval`. That rewrite is the
--    reason this section exists.
-- ---------------------------------------------------------------------------
