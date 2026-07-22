-- 116_fix_activity_view.sql
--
-- Rebuilds the learner-home activity view on the table that actually holds data,
-- and adds per-cert lesson totals so the home cards can show real progress.
--
-- WHY: v_user_cert_activity (migration 115) read public.user_progress, which has
-- ZERO ROWS for every user on this instance. Learner progress lives entirely in
-- public.user_lesson_progress. The visible symptom was a home page telling a
-- learner with 43 completed lessons that they had "Not started" - which is worse
-- than showing nothing at all.
--
-- user_progress appears to be vestigial (it still carries an updated_at trigger
-- and an audit trigger, but nothing writes to it). Not dropped here: dropping a
-- table on the strength of one afternoon's observation is how you lose data that
-- some path writes quarterly. Left in place, unused, and flagged.
--
-- PROGRESS ROLLS UP BY lesson_group_id. Lessons exist once per language sharing
-- a group id; completing a lesson in Spanish and again in English is ONE lesson
-- completed, not two. count(distinct ...) rather than count(*).
--
-- SECURITY INVOKER on the user-scoped view: without it the view would run with
-- the owner's rights and bypass RLS on user_lesson_progress, exposing every
-- learner's progress to every learner. The totals view is NOT user-scoped - it
-- is catalog metadata - so it needs no invoker semantics.
--
-- ASCII only: pasted into the Supabase SQL editor.
-- Idempotent: create-or-replace.

-- ---------------------------------------------------------------------------
-- Per-cert activity and completion for the calling user.
-- ---------------------------------------------------------------------------
create or replace view public.v_user_cert_activity
with (security_invoker = true) as
select
  ulp.user_id,
  m.certification_id,
  max(ulp.updated_at) as last_activity_at,
  count(distinct coalesce(l.lesson_group_id, l.id))
    filter (where ulp.status = 'completed')::int as lessons_completed
from public.user_lesson_progress ulp
join public.lessons l on l.id = ulp.lesson_id
join public.modules m on m.id = l.module_id
where m.certification_id is not null
group by ulp.user_id, m.certification_id;

comment on view public.v_user_cert_activity is
  'Per-cert last activity and completed-lesson count for the calling user, rolled up by lesson_group_id. security_invoker: RLS on user_lesson_progress still applies.';

-- ---------------------------------------------------------------------------
-- Total teachable lessons per cert. Catalog metadata, not user data.
--
-- 400 chars is the same CONTENT_MIN_CHARS the app uses to separate a real
-- lesson from a stub row, so a scaffolded-but-unwritten lesson never inflates
-- the denominator and makes a learner's progress look worse than it is.
-- ---------------------------------------------------------------------------
create or replace view public.v_cert_lesson_totals as
select
  m.certification_id,
  count(distinct coalesce(l.lesson_group_id, l.id))::int as total_lessons
from public.lessons l
join public.modules m on m.id = l.module_id
where m.certification_id is not null
  and length(coalesce(l.content_md, '')) >= 400
group by m.certification_id;

comment on view public.v_cert_lesson_totals is
  'Teachable (non-stub) lesson count per certification, deduped across languages by lesson_group_id.';

grant select on public.v_user_cert_activity to authenticated;
grant select on public.v_cert_lesson_totals to authenticated;

-- Verify from the editor (auth.uid() is null there, so query the base tables):
--   select m.certification_id,
--          max(ulp.updated_at) as last_activity,
--          count(distinct coalesce(l.lesson_group_id, l.id))
--            filter (where ulp.status = 'completed') as done
--     from public.user_lesson_progress ulp
--     join public.lessons l on l.id = ulp.lesson_id
--     join public.modules m on m.id = l.module_id
--    where ulp.user_id = '<uuid>'
--    group by m.certification_id;
--
--   select * from public.v_cert_lesson_totals order by 1;
