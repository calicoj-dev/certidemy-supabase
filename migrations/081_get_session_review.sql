-- 081_get_session_review.sql
-- ============================================================================
-- Fix the quiz-history review page: it read correct_answer directly off
-- quiz_questions with the learner's auth context, and 058's column-level
-- lockdown (correct_answer is SERVER-ONLY) correctly nulled it — so past-quiz
-- reviews showed the question and your answer but never the correct answer.
-- ("(question unavailable)" was the other half: SD-AI-I practice rows were
-- visibility='secure' until 079, so RLS hid the whole row.)
--
-- A review of the learner's OWN, ALREADY-ANSWERED practice questions is a
-- legitimate study surface — the answer should show. This RPC grants exactly
-- that and nothing more:
--   * SECURITY DEFINER, but scoped to auth.uid() — you can only review YOUR
--     attempts. The session id alone is useless for anyone else's data.
--   * FIREWALL: joins only pool='practice' rows. Secure exam items are
--     physically excluded — a mock/real exam session reviewed through this
--     returns no secure rows, so exam answers can never leak here.
-- ============================================================================

create or replace function public.get_session_review(p_session_id uuid)
returns table (
  question_id uuid,
  question_text text,
  options jsonb,
  correct_answer jsonb,
  explanation text,
  user_answer jsonb,
  is_correct boolean,
  attempted_at timestamptz
)
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
  select
    a.question_id,
    q.question_text,
    q.options,
    q.correct_answer,
    q.explanation,
    a.user_answer,
    a.is_correct,
    a.attempted_at
  from public.quiz_attempts a
  join public.quiz_questions q on q.id = a.question_id
  where a.session_id = p_session_id
    and a.user_id = auth.uid()        -- caller's own attempts ONLY
    and q.pool = 'practice'           -- FIREWALL: secure exam rows never flow here
    and q.is_exam_scope = false
  order by a.attempted_at asc;
$$;

revoke all on function public.get_session_review(uuid) from public;
grant execute on function public.get_session_review(uuid) to authenticated;

-- ============================================================================
-- VERIFY (as an authenticated user via the app, or eyeball the definition):
--   select pg_get_functiondef(oid) from pg_proc where proname='get_session_review';
-- Note: running the RPC in the SQL editor returns 0 rows (auth.uid() is NULL
-- there — known gotcha). Real verification is the review page itself.
-- ============================================================================
