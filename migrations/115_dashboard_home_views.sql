-- 115_dashboard_home_views.sql
--
-- Two read-only views for the cert-agnostic learner home.
--
-- WHY VIEWS AND NOT CLIENT-SIDE WORK: both answers require aggregating ACROSS a
-- join (fsrs_cards -> quiz_questions -> certification, user_progress -> modules
-- -> certification). PostgREST cannot group across a join, so the alternative is
-- pulling every due card and every progress row to the client and grouping in
-- JS - hundreds of rows to compute two integers, on a landing page.
--
-- SECURITY INVOKER IS LOAD-BEARING. A normal Postgres view runs with the
-- OWNER's rights, which would bypass RLS on fsrs_cards and user_progress and
-- expose every user's rows to every user. `security_invoker = true` makes the
-- view run as the CALLER, so the existing RLS policies on the base tables still
-- apply and each user sees only their own. Do not remove it.
--
-- SECURE ITEMS ARE EXCLUDED DEFENSIVELY. An fsrs_card should only ever exist for
-- a practised item, so a secure question should never appear here - but the
-- exam firewall is worth a belt as well as braces, and a due-count is a cheap
-- place to leak the existence of secure items.
--
-- ASCII only: pasted into the Supabase SQL editor.
-- Idempotent: create-or-replace.

-- ---------------------------------------------------------------------------
-- Reviews due right now, per certification.
-- The single strongest daily-return signal available: "17 due today" brings a
-- learner back tomorrow in a way "43% complete" never does.
-- ---------------------------------------------------------------------------
create or replace view public.v_user_due_reviews
with (security_invoker = true) as
select
  f.user_id,
  q.certification_id,
  count(*)::int as due_count
from public.fsrs_cards f
join public.quiz_questions q on q.id = f.question_id
where f.due <= now()
  and q.retired_at is null
  and coalesce(q.visibility, '') <> 'secure'
  and coalesce(q.pool, '') <> 'secure'
group by f.user_id, q.certification_id;

comment on view public.v_user_due_reviews is
  'Per-cert count of FSRS cards due now for the calling user. security_invoker: RLS on fsrs_cards still applies.';

-- ---------------------------------------------------------------------------
-- Most recent activity per certification. Orders the home page by what the
-- learner is actually working on rather than by enrolment date.
-- ---------------------------------------------------------------------------
create or replace view public.v_user_cert_activity
with (security_invoker = true) as
select
  up.user_id,
  m.certification_id,
  max(up.last_activity_at) as last_activity_at
from public.user_progress up
join public.modules m on m.id = up.module_id
where m.certification_id is not null
group by up.user_id, m.certification_id;

comment on view public.v_user_cert_activity is
  'Per-cert last activity timestamp for the calling user. security_invoker: RLS on user_progress still applies.';

-- RLS is not a grant, and that applies to views too: without this the reads
-- fail with a silent 42501 that failure-tolerant loaders swallow.
grant select on public.v_user_due_reviews to authenticated;
grant select on public.v_user_cert_activity to authenticated;

-- Verify (as an authenticated user, NOT in the SQL editor - auth.uid() is null
-- there, so both will return zero rows when run from the dashboard):
--   select * from public.v_user_due_reviews;
--   select * from public.v_user_cert_activity;
--
-- To sanity-check the shape from the editor, join manually for one user:
--   select q.certification_id, count(*)
--     from public.fsrs_cards f
--     join public.quiz_questions q on q.id = f.question_id
--    where f.user_id = '<uuid>' and f.due <= now()
--    group by q.certification_id;
