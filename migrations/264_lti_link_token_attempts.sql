-- 264_lti_link_token_attempts.sql
--
-- Three columns on lti_link_tokens: attempts, last_attempt_at, last_error.
--
-- Editor-first: this ran live in the SQL editor on 2026-08-30. The file is the
-- record of what already ran. No function body, so no md5 -- section 4 records
-- the observed column definitions verbatim.
--
-- ============================ THE NUMBER 264 WAS CLAIMED THREE TIMES =====
--
-- Recorded because it is the cost of a hand-maintained migration tip, and it
-- happened the same night the tip was corrected.
--
--   1. A SECURITY DEFINER check for the lti_deployments first_seen/last_seen
--      pair. Drafted, then killed when its justification evaporated. DEAD --
--      do not revive it under this number or any other.
--   2. These three columns. APPLIED, and this file.
--   3. An identity migration proposed by the web session. It takes 265, and it
--      will read `ls migrations/ | tail -1` rather than a tip, which is now the
--      rule in CLAUDE.md.
--
-- Three unrelated pieces of work, one number, because four documents all said
-- "next free: 262" while 261, 262 and 263 existed on disk.
--
-- ============================ WHAT THEY ARE FOR ==========================
--
-- Door two failed silently on 2026-08-30. A student launched with the email
-- withheld, got the two-doors page, signed up, confirmed by email, and landed
-- in the app -- with no lti_users row and an unconsumed token. Five tokens
-- accumulated for one `sub` across ten minutes and nothing anywhere recorded a
-- failure.
--
-- The reason nothing recorded it: lti-consume-link-token WAS NEVER INVOKED.
-- Not a failed call, no call. The edge function logs are empty for it across
-- the entire window. So the function could not record its own non-execution,
-- and the only evidence was an absence -- a token with no matching anything --
-- which is inference from a missing row.
--
-- These columns make the attempt itself recordable, so that:
--
--   attempts = 0, last_attempt_at NULL   nobody ever tried  -> OUR side
--   attempts > 0, last_error set         tried and refused  -> the token's side
--   consumed_at set                      closed
--
-- The distinction that matters is the first against the second. A student's
-- expired token and our own misconfiguration were previously identical from
-- every angle: account created, student signed in, no error on any surface.
--
-- ============================ attempts = 0 IS NOT EVIDENCE, YET ==========
--
-- THE FIVE EXISTING ROWS ALL READ attempts = 0 AND THAT MEANS NOTHING ABOUT
-- THEM.
--
-- The column defaults to 0 and these rows predate it. `attempts = 0` on a row
-- created before 2026-08-30 is the default asserting itself, not an observation
-- that nothing tried. Exactly the shape 261's backfill note records: a
-- reconstruction that reads as a measurement.
--
-- There is no backfill here and there should not be. The five rows are dated
-- observations from before the column existed, and the honest state for them is
-- the default with this note attached. **The column is meaningful only for rows
-- created from 2026-08-30 onward.**
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).
-- Idempotent: add column if not exists.

-- ---------------------------------------------------------------------------
-- 1. The columns.
--
--    attempts is NOT NULL DEFAULT 0 because a count has a correct zero. The two
--    timestamps and the error are nullable because "never attempted" is a real
--    state and must not be spelled with a sentinel.
-- ---------------------------------------------------------------------------

alter table public.lti_link_tokens
  add column if not exists attempts integer not null default 0;

alter table public.lti_link_tokens
  add column if not exists last_attempt_at timestamptz;

alter table public.lti_link_tokens
  add column if not exists last_error text;

-- ---------------------------------------------------------------------------
-- 2. No backfill. See the header -- the five pre-existing rows keep the
--    default, and the default claims nothing about them.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 3. No grant follows, and that is not an omission.
--
--    262 created lti_link_tokens with RLS enabled and no grant to anon or
--    authenticated. It is read and written by edge functions under
--    service_role. Adding a column to a closed table leaves it closed.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 4. Verification. Observed live 2026-08-30.
-- ---------------------------------------------------------------------------

-- select column_name, data_type, is_nullable, column_default
-- from information_schema.columns
-- where table_schema = 'public' and table_name = 'lti_link_tokens'
--   and column_name in ('attempts', 'last_attempt_at', 'last_error')
-- order by ordinal_position;
--
-- OBSERVED:
--   attempts         integer                     NO   0
--   last_attempt_at  timestamp with time zone    YES  (null)
--   last_error       text                        YES  (null)

-- select count(*) as total,
--        count(*) filter (where consumed_at is not null)     as consumed,
--        count(*) filter (where last_attempt_at is not null) as attempted,
--        count(*) filter (where last_error is not null)      as errored
-- from public.lti_link_tokens;
--
-- OBSERVED:  total 5, consumed 0, attempted 0, errored 0
--
-- All five created 2026-08-30 between 01:08:21 and 01:18:21, all sub = '2',
-- all still valid until 2026-08-31. See the header on why the zeros are not
-- evidence.

-- ---------------------------------------------------------------------------
-- 5. THE ASSERTION THESE COLUMNS EXIST TO MAKE, once the caller is fixed.
--
--    The five tokens are live for 24 hours, so the next launch is the test and
--    it needs no sandbox:
--
--      total stays 5 and consumed becomes 1   -> the token was found and used
--      total becomes 6                        -> the caller still is not
--                                                reaching the token, and the
--                                                fix did not work
--
--    A rising total is the failure signal, which is the one direction a count
--    reads correctly here.
--
--    NOTE: writing these columns is NOT yet implemented. The columns exist;
--    lti-consume-link-token does not set them and the callback does not report
--    a non-attempt. Until that lands, `attempts = 0` continues to mean nothing.
--    That work belongs with the door-two caller fix in ../certidemy-web.
-- ---------------------------------------------------------------------------
