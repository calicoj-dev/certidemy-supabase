-- 058_quiz_questions_visibility_lockdown.sql
--
-- THE FINDING THIS CLOSES. quiz_questions had a blanket `USING (true)` SELECT
-- policy for {public} AND raw table-level SELECT grants to anon + authenticated.
-- Both layers were wide open, so the ENTIRE secure exam pool -- questions and
-- correct_answer -- was readable by any anonymous caller hitting the API. The
-- application-layer firewall (never link secure into question_concepts) had no
-- teeth at the database layer. This migration moves the firewall to where it
-- belongs: the database, default-deny.
--
-- THE MODEL (Juan's design). A `visibility` column marks who may read each row:
--   'secure'  -> NO client role. Service role (exam scorer, generators) only.
--   'private' -> authenticated users only (the practice/learning engine).
--   'public'  -> anyone, incl. anon (the handful of marketing samples).
-- The DEFAULT is deny: a row is exposed to a client only if its visibility
-- says so. Designed as TIERS (not a boolean) so a future LMS/partner
-- integration is "issue a credential at the secure tier," not a re-architecture.
--
-- correct_answer stays SERVER-ONLY regardless of visibility: even a public
-- sample must not ship its answer key to the browser (the page grades on the
-- option id, like the in-app quiz). Enforced with a COLUMN-level revoke.
--
-- The exam scorer (submit-quiz-answer) and generators read via the SERVICE
-- ROLE, which bypasses RLS and keeps its grants here -- so grading, mastery,
-- FSRS, and generation are unaffected. Verified against submit-quiz-answer
-- (getServiceClient) before writing this.
--
-- SAFETY: this migration is the one that could break every quiz if a client
-- read path was missed. It is shipped ALONE (the public-sample layer is a
-- separate later migration) so it can be verified in isolation. Transaction-
-- wrapped; VERIFY + ROLLBACK blocks at the bottom.

begin;

-- 1. The visibility tier column. Backfill from the existing pool, then make it
--    NOT NULL with a safe default of 'secure' (deny-by-default for any future
--    row that forgets to set it).
alter table public.quiz_questions
  add column if not exists visibility text;

update public.quiz_questions
set visibility = case
  when pool = 'secure'   then 'secure'
  when pool = 'practice' then 'private'
  else 'secure'            -- unknown/null pool -> safest tier
end
where visibility is null;

alter table public.quiz_questions
  alter column visibility set default 'secure',
  alter column visibility set not null;

alter table public.quiz_questions
  drop constraint if exists quiz_questions_visibility_chk;
alter table public.quiz_questions
  add constraint quiz_questions_visibility_chk
  check (visibility in ('public', 'private', 'secure'));

create index if not exists quiz_questions_visibility_idx
  on public.quiz_questions (visibility);

-- 2. Remove the wide-open reads: both the permissive policy AND the raw grants.
drop policy if exists "catalog read quiz_questions" on public.quiz_questions;

revoke select on public.quiz_questions from anon;
revoke select on public.quiz_questions from authenticated;

-- 3. Re-grant table-level SELECT (RLS still gates ROWS; this just lets the role
--    reach the table at all), then revoke the answer key at the COLUMN level so
--    no client role can ever read correct_answer. Service role keeps everything.
grant select on public.quiz_questions to anon, authenticated;
revoke select (correct_answer) on public.quiz_questions from anon;
revoke select (correct_answer) on public.quiz_questions from authenticated;

-- 4. Tiered row policies (default-deny: a row is visible only if its tier says).
--    'public'  -> anon + authenticated
--    'private' -> authenticated only
--    'secure'  -> neither (service role bypasses RLS and is unaffected)
create policy "quiz public read"
  on public.quiz_questions for select to anon, authenticated
  using (visibility = 'public');

create policy "quiz private read"
  on public.quiz_questions for select to authenticated
  using (visibility in ('public', 'private'));

-- admin write policy ("admin write questions", ALL, is_platform_admin()) is
-- left untouched.

commit;

-- ===========================================================================
-- VERIFY (run separately, after COMMIT).
-- ===========================================================================
-- -- a) tier counts (sanity: secure should be the big number, private = practice)
-- select visibility, pool, count(*) from public.quiz_questions
-- group by visibility, pool order by visibility, pool;
--
-- -- b) anon must see ZERO rows (nothing is 'public' yet -> 0 is correct)
-- set role anon;
-- select count(*) as anon_visible_rows from public.quiz_questions;          -- expect 0
-- reset role;
--
-- -- c) authenticated must NOT see secure rows
-- set role authenticated;
-- select count(*) filter (where visibility='secure') as auth_sees_secure,    -- expect 0
--        count(*) filter (where visibility='private') as auth_sees_private    -- expect >0
-- from public.quiz_questions;
-- reset role;
--
-- -- d) correct_answer column is revoked from clients
-- set role authenticated;
-- select correct_answer from public.quiz_questions limit 1;  -- expect: permission denied
-- reset role;

-- ===========================================================================
-- ROLLBACK (only if the app breaks -- restores the prior wide-open state).
-- ===========================================================================
-- begin;
-- drop policy if exists "quiz public read" on public.quiz_questions;
-- drop policy if exists "quiz private read" on public.quiz_questions;
-- grant select (correct_answer) on public.quiz_questions to anon, authenticated;
-- create policy "catalog read quiz_questions"
--   on public.quiz_questions for select to public using (true);
-- commit;
