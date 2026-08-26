-- 257_lti_launch_sessions.sql
--
-- The verified launch context, held between /lti/launch and /lti/select.
--
-- Editor-first: this ran live in the SQL editor on 2026-08-26, one statement at
-- a time. The file is the record of what already ran, not a script anyone
-- executes. No function body, so no md5 -- section 4 records the observed table
-- and grant state, the discipline 247, 248, 251, 252, 253 and 256 use.
--
-- ============================ WHY IT EXISTS ==============================
--
-- A verified LtiDeepLinkingRequest has to become a certification picker. The
-- obvious implementation renders that picker straight from the POST handler,
-- and it is worse in three ways: a large UI lives inside a route handler, the
-- page cannot be refreshed, and /lti/deep-link/return then needs the launch
-- context back -- which means carrying it in a hidden field, which means
-- signing a second token format and reasoning about its expiry separately.
--
-- So the launch handler verifies, writes this row, and redirects to
-- /lti/select?s=<id>. The picker becomes an ordinary page that can use
-- components and i18n like everything else, and the deep-linking response reads
-- the same row rather than a second copy of the same facts.
--
-- The alternative considered was an HMAC-signed blob in a hidden form field. It
-- avoids a table and adds a second signed format to reason about; this codebase
-- reliably prefers the boring inspectable row.
--
-- ============================ THE id IS A BEARER CAPABILITY ==============
--
-- Whoever holds this id can read the launch context. There is no session, no
-- cookie and no user behind it -- the instructor is inside an LMS iframe and
-- has no Certidemy account. The id in the URL IS the authorisation.
--
-- That is a deliberate choice and it needs to be proportionate rather than
-- merely convenient, so:
--
--   gen_random_uuid() is 122 bits of randomness. Not guessable.
--   expires_at is 30 minutes -- an instructor picking a certification, not a
--   session anyone lives in.
--   WHAT IT UNLOCKS IS A CERTIFICATION PICKER AND NOTHING ELSE. Holding one
--   lets someone see which certifications are available -- which is public
--   information on certidemy.com -- and return a deep-linking response to a
--   platform that will itself verify our signature and its own state.
--
-- If this row ever came to hold something worth stealing, 122 bits in a URL
-- would stop being the right answer and it would need a cookie or a nonce of
-- its own. That is the line to watch when phase 2 adds a user.
--
-- ============================ IT HOLDS NO PII ============================
--
-- Deliberately no sub, no name, no email, no roles, no context title.
--
-- /lti/select does not need them: the picker asks an instructor to choose a
-- certification, and that choice does not depend on who they are. Phase 1 has
-- no user at all -- no profile is created, no session is minted, nothing is
-- looked up by identity.
--
-- Carrying identity here "in case the picker wants it later" would put holder
-- PII behind a bearer id in a URL, on a row that outlives the request, for a
-- surface that has no use for it. When phase 2 needs identity it gets a
-- decision of its own, not a column somebody added early.
--
-- What it does hold is launch context: which platform, which deployment, where
-- to return the response, what the platform said it accepts, and the locale --
-- so the planted link can point at /{locale}/certifications/<code> rather than
-- depending on a redirect we control.
--
-- ============================ CLOSED, LIKE THE OTHER THREE ===============
--
-- No grant, no policy. service_role only, joining lti_tool_keys, lti_nonces and
-- lti_launch_evidence. The read path for /lti/select is an edge function, not a
-- browser query -- there is no `authenticated` role in this flow to grant to.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).
-- Idempotent: if-not-exists throughout.

-- ---------------------------------------------------------------------------
-- 1. The table.
--
--    deployment_id is nullable and ON DELETE SET NULL: deleting a deployment
--    must not destroy the record of a launch that came through it, and a
--    session whose deployment could not be registered is still a session worth
--    completing.
-- ---------------------------------------------------------------------------

create table if not exists public.lti_launch_sessions (
  id                   uuid primary key default gen_random_uuid(),
  platform_id          uuid not null references public.lti_platforms(id) on delete cascade,
  deployment_id        uuid references public.lti_deployments(id) on delete set null,
  message_type         text not null,
  deep_link_return_url text,
  accept_types         text[],
  accept_multiple      boolean not null default false,
  document_targets     text[],
  locale               text,
  target_link_uri      text,
  created_at           timestamptz not null default now(),
  expires_at           timestamptz not null default (now() + interval '30 minutes'),
  consumed_at          timestamptz
);

create index if not exists lti_launch_sessions_expiry_idx
  on public.lti_launch_sessions (expires_at);

-- ---------------------------------------------------------------------------
-- 2. Closed. No grant follows, and that absence is the control -- the
--    table-level grant is checked BEFORE row-level security, so a table with
--    RLS on and no grant is shut whatever its policies say.
-- ---------------------------------------------------------------------------

alter table public.lti_launch_sessions enable row level security;

-- ---------------------------------------------------------------------------
-- 3. STILL ABSENT, ON PURPOSE.
--
--    The pg_cron sweep. lti_nonces, lti_launch_evidence and now
--    lti_launch_sessions all accumulate rows that must be deleted on a
--    schedule. cron.schedule is NOT transactional so it never belongs inside a
--    migration block, and scheduling it before the endpoints that populate
--    these tables are live would mean its first act is to do nothing, forever,
--    unnoticed. One migration, once /lti/launch and /lti/select are both
--    serving.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 4. Verification. Observed live 2026-08-26 after the statements above.
-- ---------------------------------------------------------------------------

-- select c.relname, c.relrowsecurity,
--        (select count(*) from pg_policy p where p.polrelid = c.oid)
-- from pg_class c join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'lti\_%'
-- order by c.relname;
--
-- OBSERVED, eight tables, all rls = true:
--   lti_capabilities       1 policy
--   lti_deployments        1
--   lti_launch_evidence    0
--   lti_launch_sessions    0
--   lti_launch_skeleton    1
--   lti_nonces             0
--   lti_platforms          1
--   lti_tool_keys          0

-- select count(*) from information_schema.column_privileges
-- where table_schema = 'public' and table_name = 'lti_launch_sessions'
--   and grantee = 'authenticated';
--
-- OBSERVED: 0 granted columns.
