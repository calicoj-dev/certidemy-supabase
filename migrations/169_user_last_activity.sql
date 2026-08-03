-- 169_user_last_activity.sql
--
-- WHAT WAS WRONG
-- census.ts derived lastActiveAt from auth.users.last_sign_in_at. That column
-- only moves on a FRESH sign-in -- a session that keeps refreshing never
-- rewrites it. A platform_admin who had used the product every day for 25 days
-- read as "last active 25 days ago".
--
-- That was not merely a wrong label. census.ts derives `dormant` from the same
-- value, `dormant` drives the dormant segment and its summary count, and that
-- segment is the audience an operator copies emails from or pushes to
-- GoHighLevel. The bug could send a re-engagement campaign to the most active
-- users on the platform.
--
-- WHAT "ACTIVE" MEANS HERE
-- The most recent moment a human touched the product, from every table that
-- records one:
--
--   quiz_attempts.attempted_at        answering a practice question
--   exam_attempts.submitted_at        sitting an exam
--   fsrs_reviews.reviewed_at          clearing a scheduled review
--   user_lesson_progress.updated_at   reading a lesson
--   chat_messages.created_at          asking the tutor
--
-- READING COUNTS. Someone who reads for an hour and answers nothing is
-- engaged, and calling them dormant is wrong in the direction that loses a
-- customer. At the time of writing, lesson progress lagged quiz activity by
-- twelve days across the whole platform -- so lessons alone would have been
-- nearly as stale as the sign-in column it replaces.
--
-- WHY A VIEW AND NOT FOUR QUERIES IN census.ts
-- buildCensus already runs six queries; this would have made ten. More
-- importantly the definition of "active" WILL change -- a new surface gets
-- built, or FSRS reviews get judged too passive to count -- and a view is one
-- edit instead of four scattered through a module that two functions share.
--
-- WHAT THIS DOES NOT DO
-- It does not backfill anything and it does not replace last_sign_in_at.
-- census.ts still falls back to the sign-in timestamp when a user has no
-- activity at all, because for a never-activated account that IS the only
-- honest signal.

-- ---------------------------------------------------------------------------
-- Indexes first: the view is only cheap if each branch can be answered from an
-- index. Every branch filters on user_id and takes a max over the timestamp,
-- so (user_id, ts desc) serves both. user_id is a grouping column of the view,
-- which is what lets Postgres push an outer `where user_id in (...)` down
-- through the UNION ALL into these.
-- ---------------------------------------------------------------------------

create index if not exists quiz_attempts_user_attempted_idx
  on public.quiz_attempts (user_id, attempted_at desc);

create index if not exists exam_attempts_user_submitted_idx
  on public.exam_attempts (user_id, submitted_at desc);

create index if not exists fsrs_reviews_user_reviewed_idx
  on public.fsrs_reviews (user_id, reviewed_at desc);

create index if not exists user_lesson_progress_user_updated_idx
  on public.user_lesson_progress (user_id, updated_at desc);

create index if not exists chat_messages_user_created_idx
  on public.chat_messages (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- The view.
--
-- One row per user who has ever done anything. A user with no activity is
-- ABSENT rather than null -- the caller left-joins and decides the fallback,
-- which keeps "never did anything" distinguishable from "did something at an
-- unknown time".
-- ---------------------------------------------------------------------------

create or replace view public.v_user_last_activity
with (security_invoker = on) as
select
  user_id,
  max(ts) as last_activity_at
from (
  select user_id, attempted_at as ts from public.quiz_attempts        where attempted_at is not null
  union all
  select user_id, submitted_at       from public.exam_attempts        where submitted_at is not null
  union all
  select user_id, reviewed_at        from public.fsrs_reviews         where reviewed_at  is not null
  union all
  select user_id, updated_at         from public.user_lesson_progress where updated_at   is not null
  union all
  select user_id, created_at         from public.chat_messages        where created_at   is not null
) s
where user_id is not null
group by user_id;

comment on view public.v_user_last_activity is
  'Most recent moment each user touched the product, across quizzes, exams, '
  'reviews, lessons and tutor chat. Replaces auth.users.last_sign_in_at as the '
  'activity signal in census.ts -- that column only moves on a fresh sign-in, '
  'so a refreshing session goes stale while the person is using the product '
  'daily. Users with no activity are absent, not null.';

-- ---------------------------------------------------------------------------
-- Grants.
--
-- A table-level grant is checked BEFORE RLS, and a missing one produces a
-- silent 42501 that a failure-tolerant loader swallows -- so the grant ships
-- with the object that needs it, not later.
--
-- Only the service client reads this: buildCensus runs behind a platform_admin
-- check in list-users and behind an admin gate in sync-to-ghl. No end-user
-- surface reads it, so anon and authenticated are explicitly revoked rather
-- than left to whatever the schema default happens to be.
--
-- security_invoker = on so the view cannot become a way to read the underlying
-- tables past their own RLS if it is ever granted more widely.
-- ---------------------------------------------------------------------------

revoke all on public.v_user_last_activity from anon, authenticated;
grant select on public.v_user_last_activity to service_role;
