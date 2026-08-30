-- 266_lti_skeleton_correlation_and_indexes.sql
--
-- Two indexes, a correlation handle, and an issuer for the strangers.
--
-- Editor-first: this ran live in the SQL editor on 2026-08-30, one statement at
-- a time. The file is the record of what already ran. No function body, so no
-- md5 -- section 7 records the observed columns, grant, indexes and QUERY PLAN
-- verbatim.
--
-- ============================ WHY, IN ONE LINE EACH =======================
--
--   the two indexes    both console access patterns were sequential scans
--   correlation_id     a launch writes TWO skeleton rows and nothing joined them
--   iss                two rows say a stranger tried and cannot say which one
--
-- ============================ THE TWO-ROW PROBLEM =========================
--
-- A launch writes two skeleton rows, and until now NOTHING CONNECTED THEM.
--
--   resource link   resource_link_ok, then the provision outcome
--                   -- both written by lti-launch, same request
--   deep linking    deep_linking_ok, then deep_link_returned
--                   -- DIFFERENT FUNCTIONS, different requests, minutes apart
--
-- Support's core question is "what happened to this launch", and it was being
-- answered BY TIMESTAMP PROXIMITY -- same second, or the one before. That is
-- not a join. It is a coincidence that holds while traffic is one person
-- clicking, and it DEGRADES SILENTLY: two concurrent students and the pairing
-- is wrong with no error anywhere, which is this feature's whole failure mode.
--
-- The eighteen student_email_mismatch rows of 2026-08-30 were paired to their
-- seatings exactly this way. It worked, and it worked by luck.
--
-- ============================ WHY IT IS NOT CALLED launch_id ==============
--
-- `launch_id` READS AS A FOREIGN KEY TO A `launches` TABLE, and there is no
-- such table. That misreading is the one the name most needed to prevent.
--
-- `correlation_id` is standard tracing vocabulary and says what it is. On a
-- table where every row is a launch, the "launch" half is implied.
--
-- AND IT IS DELIBERATELY NOT A FOREIGN KEY. The candidate rows to reference --
-- lti_nonces, lti_launch_sessions -- are both swept by 258, so an FK would
-- either block the sweep or cascade away the correlation. A column that looks
-- like a reference to a row that gets deleted is worse than no column: it
-- invites a join that returns nothing and reads as data loss.
--
-- Rejected alternative, recorded so it is not re-proposed: reuse an existing id
-- per path -- the session id for deep linking, the nonce row id for resource
-- link. TWO DIFFERENT CORRELATORS MEANS SUPPORT'S QUERY MUST KNOW WHICH KIND OF
-- LAUNCH IT IS ASKING ABOUT BEFORE IT CAN ASK, which defeats the purpose.
--
-- ============================ THE iss SCOPE IS SMALLER THAN THE PITCH =====
--
-- "iss fixes the orphan rows" is what this column sounds like. IT FIXES TWO OF
-- EIGHTEEN. Observed 2026-08-30, of the 18 rows with platform_id IS NULL:
--
--   unregistered_platform       2   an iss IS recoverable -- lti-login holds
--                                   body.iss, and it is the whole point
--   missing_id_token_or_state   9   NO -- there was no token to read one from
--   malformed_jwt               5   NO -- the token exists and cannot be decoded
--   nonce_consumed              2   NO -- unverified at that point, no platform
--
-- THE OTHER SIXTEEN ARE UNATTRIBUTABLE BY CONSTRUCTION and no column changes
-- that. Written here because someone reading "iss fixes the orphans" would
-- expect sixteen rows to light up that never will.
--
-- ============================ WHY iss WAS ABSENT, AND WHAT THAT SHOWS =====
--
-- No evidence it was judged and rejected.
--
-- 253's header states the contract: the skeleton holds "no PII at all ... and
-- claim_presence -- a boolean map of WHICH claims arrived, never their values."
-- The map exists for a specific reason, and the code says which: it records
-- `login_hint` as a boolean, and lti-login's header says that function handles
-- "login_hint and nothing else about a person."
--
-- THE MAP WAS BUILT TO KEEP login_hint OUT. `iss` appears to have been swept up
-- by a blanket application of that rule rather than judged on its own -- and it
-- is an identifier of an INSTITUTION, not a person, of exactly the class
-- lti_platforms.iss already stores indefinitely in plain text.
--
-- A RULE APPLIED WITHOUT THE JUDGEMENT THAT PRODUCED IT IS A DIFFERENT THING
-- FROM A RULE. That is the general lesson and this is only its instance.
--
-- ============================ THE GRANT TRAP, WORKING AS INTENDED =========
--
-- 256 granted NINE NAMED COLUMNS on this table. A column-scoped grant does not
-- extend to columns added later, so all three new columns arrived closed.
--
-- That is the design working, not a hazard survived. lib/console/lti.ts is
-- failure-tolerant -- a query error degrades to an empty section rather than
-- throwing -- so an ungranted column would have rendered the LTI page with no
-- launch rows AND NO ERROR ANYWHERE. Failing closed is what made it visible.
--
-- Section 6 re-grants the FULL ELEVEN. Unlike lti_capabilities, where
-- last_detail is deliberately withheld, NOTHING ON THIS TABLE IS WITHHELD --
-- so the verification expects ungranted = 0, not 1.
--
-- lti_launch_sessions needs no grant and gets none: 257 left it closed to
-- authenticated entirely -- 0 of 14 columns, no table-level grant -- and adding
-- a column to a closed table leaves it closed.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).
-- Idempotent: create index if not exists, add column if not exists, re-runnable
-- grant.

-- ---------------------------------------------------------------------------
-- 0. Before. Observed 2026-08-30.
--
--    select count(*) as skeleton_rows,
--           count(*) filter (where platform_id is null) as orphans,
--           min(received_at) as earliest, max(received_at) as latest
--    from public.lti_launch_skeleton;
--
--    OBSERVED:  103 rows, 18 orphans,
--               earliest 2026-08-26 22:25:04.432586+00
--               latest   2026-08-30 07:35:04.269718+00
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Filter by platform, sort by time. The support screen, and the dashboard's
--    per-platform window.
--
--    ALSO SERVES THE ORPHAN VIEW. Postgres indexes NULLs in btrees, so
--    `where platform_id is null order by received_at desc` uses this index. No
--    separate partial index is needed and one was not created.
--
--    `desc` is INTENT, NOT NECESSITY -- Postgres scans a btree backwards, so
--    (platform_id, received_at) would serve the same order. Written this way so
--    nobody later "fixes" it in the wrong direction.
-- ---------------------------------------------------------------------------

create index if not exists lti_launch_skeleton_platform_time_idx
  on public.lti_launch_skeleton (platform_id, received_at desc);

-- ---------------------------------------------------------------------------
-- 2. The unfiltered recent-activity sort, which is what the console does today:
--    order by received_at desc limit 200, no platform filter. A composite
--    leading on platform_id CANNOT serve that, so both indexes are wanted.
-- ---------------------------------------------------------------------------

create index if not exists lti_launch_skeleton_time_idx
  on public.lti_launch_skeleton (received_at desc);

-- ---------------------------------------------------------------------------
--    Plain CREATE INDEX, not CONCURRENTLY: at 103 rows the lock is
--    microseconds, and CONCURRENTLY cannot run inside a transaction block,
--    which the editor complicates. ON A LARGE TABLE THAT CHOICE INVERTS -- if
--    this is ever repeated at volume, use CONCURRENTLY and run it alone.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 3. The correlation handle on the skeleton.
--
--    A CORRELATION HANDLE, NOT A REFERENCE. Nothing enforces it, nothing joins
--    to it, and it is not a foreign key on purpose -- see the header.
--
--    No default. A default would mint a distinct value per ROW, which is the
--    exact opposite of what a correlation handle is for: the value is generated
--    once per LAUNCH, in lti-launch, and written to every row that launch
--    produces.
-- ---------------------------------------------------------------------------

alter table public.lti_launch_skeleton
  add column if not exists correlation_id uuid;

-- ---------------------------------------------------------------------------
-- 4. The same handle on the session, which is how it crosses the request
--    boundary.
--
--    Deep linking writes its two rows from two functions in two requests. The
--    session is the only thing that already spans them: lti-launch creates it,
--    lti-deep-link loads it by id. So the handle rides there.
-- ---------------------------------------------------------------------------

alter table public.lti_launch_sessions
  add column if not exists correlation_id uuid;

-- ---------------------------------------------------------------------------
-- 5. The issuer of an unregistered caller.
--
--    THIS iss IS UNVERIFIED BY CONSTRUCTION. It is what an unregistered caller
--    CLAIMED to be, taken from an OIDC initiation request before any signature
--    exists to check it against. Nothing has attested it.
--
--    It is useful for grouping repeat attempts -- "the same stranger three
--    times this week" -- and for a support conversation. IT MUST NEVER BE
--    TREATED AS AN IDENTITY.
--
--    That is also why it is written by lti-login ONLY and never by lti-launch.
--    On lti-launch's resolved rows platform_id already answers the question; on
--    its pre-resolution failures the token's iss is attacker-controlled. A
--    column that SOMETIMES holds a verified issuer and sometimes holds whatever
--    a stranger typed is worse than one that only ever holds the second,
--    because nothing on the row says which.
--
--    AND IT IS A TYPED SINGLE-PURPOSE COLUMN, NEVER A GENERAL
--    request_detail jsonb. The neighbouring values are not equally safe:
--    login_hint is exactly what claim_presence's boolean map exists to keep
--    out. The drift that would hurt is someone later widening this to "record
--    what they sent", and a column that can only hold an issuer cannot drift
--    into holding a person.
-- ---------------------------------------------------------------------------

alter table public.lti_launch_skeleton
  add column if not exists iss text;

-- ---------------------------------------------------------------------------
-- 6. The full eleven. See the header on why this is not optional.
-- ---------------------------------------------------------------------------

grant select (id, platform_id, deployment_id, message_type, outcome,
              error_code, claim_presence, clock_delta_seconds, received_at,
              correlation_id, iss)
  on public.lti_launch_skeleton to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Verification. Observed live 2026-08-30.
-- ---------------------------------------------------------------------------

-- 7a. THE GRANT, BY COUNT. Nothing here is withheld, so ungranted must be 0.
--
-- select count(*) filter (where attacl is not null) as granted,
--        count(*) filter (where attacl is null)     as ungranted
-- from pg_attribute
-- where attrelid = 'public.lti_launch_skeleton'::regclass
--   and attnum > 0 and not attisdropped;
--
-- OBSERVED:  granted 11, ungranted 0

-- 7b. The columns.
--
-- OBSERVED:
--   lti_launch_skeleton.correlation_id   uuid   nullable   no default
--   lti_launch_skeleton.iss              text   nullable   no default
--   lti_launch_sessions.correlation_id   uuid   nullable   no default

-- 7c. The indexes.
--
-- OBSERVED, three:
--   lti_launch_skeleton_pkey
--   lti_launch_skeleton_platform_time_idx  on (platform_id, received_at DESC)
--   lti_launch_skeleton_time_idx           on (received_at DESC)
--
-- Both created with DESC as written.

-- 7d. THE PLAN, WHICH IS THE POINT. Existence of an index is not use of one.
--
-- explain (costs off)
-- select id, outcome, received_at from public.lti_launch_skeleton
-- where platform_id = (select id from public.lti_platforms limit 1)
-- order by received_at desc limit 20;
--
-- OBSERVED:
--
--   Limit
--     InitPlan 1
--       -> Limit
--            -> Seq Scan on lti_platforms
--     -> Index Scan using lti_launch_skeleton_platform_time_idx
--          on lti_launch_skeleton
--          Index Cond: (platform_id = (InitPlan 1).col1)
--
-- TWO THINGS IN THAT PLAN, AND THE SECOND IS THE ONE THE INDEX WAS FOR.
--
-- First: the planner chose the index AT 103 ROWS. The prediction was that it
-- might prefer a sequential scan on a single-page table and that this would not
-- be a failure. It did not, so the question does not arise.
--
-- Second, and it is the property rather than the presence: THERE IS NO SORT
-- NODE ABOVE THE INDEX SCAN. The `order by received_at desc` is served by the
-- index's own ordering, not by sorting rows after fetching them. THE ORDERING
-- IS FREE. That is what a composite (platform_id, received_at) buys over an
-- index on platform_id alone, and it is invisible in any check that only asks
-- whether an index exists.

-- ---------------------------------------------------------------------------
-- 8. NO BACKFILL, AND THAT IS THE POINT.
--
--    All 103 existing rows get NULL on all three columns.
--
--    BACKFILLING correlation_id BY TIMESTAMP PROXIMITY WOULD BE THE DEFECT THIS
--    COLUMN EXISTS TO REMOVE. It would take a coincidence that holds only while
--    traffic is one person clicking and write it down as though it were
--    recorded -- converting an inference nobody could audit into data that
--    looks authoritative.
--
--    Same shape as 264's `attempts` on rows that predate it: the honest value
--    is the absent one, and the column is meaningful from its own date forward.
--
--    No index on iss either. Grouping two rows needs none, and the column
--    exists for a support conversation rather than a hot query.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 9. Deployed alongside, 2026-08-30.
--
--    functions/lti-launch       generates correlation_id once per request,
--                              writes it on every skeleton row that launch
--                              produces, and stores it on the session.
--    functions/lti-deep-link    reads session.correlation_id and writes it on
--                              deep_link_returned.
--    functions/lti-login        writes iss on unregistered_platform and
--                              ambiguous_registration, and nowhere else.
-- ---------------------------------------------------------------------------
