-- ============================================================================
-- 276_sweep_abandoned_exam_sessions.sql
--
-- THE SWEEP MIGRATION 248 DELIBERATELY STOPPED SHORT OF.
--
-- 248 minted the vocabulary and said so in its own header:
--
--   "abandoned_unscoreable -- formless and past its window. NOTHING WRITES
--    THIS YET; it is for the sweep, which is deliberately not built here."
--
-- This is that sweep. Until now the only writer of quiz_sessions.completed_at
-- was score-mock-exam:503, reached lazily from get-active-exam-session on the
-- candidate's next authenticated request. A candidate who never came back left
-- a session open forever, and /console/exams showed it under IN PROGRESS.
--
-- The row that prompted this had been open 290 hours: AIE-I simulator,
-- rherrera@ultratech-inc.com, 3 of 25 answered, started 2026-08-21 19:21.
--
-- ---------------------------------------------------------------------------
-- MOCK EXAMS ONLY, AND THE CERT QUESTION IS DELIBERATELY LEFT OPEN.
--
-- Measured 2026-09-02 before writing anything: ZERO certification_exam
-- sessions were stuck. There was nothing to fix and therefore no reason to
-- decide the harder question under time pressure.
--
-- The harder question: refusing to score a certification exam a candidate
-- ACTUALLY SAT is its own misrepresentation. A cert attempt also consumes its
-- voucher at START (generate-mock-exam), so the attempt is spent either way --
-- what is at stake is only whether a score lands. A mock exam consumes
-- nothing: score-mock-exam:508 gates the exam_attempts insert on isCertExam,
-- so a simulator writes no attempt row at all.
--
-- Closing this simulator cost the candidate nothing, because nothing was taken.
-- That asymmetry is why the scope stops here.
--
-- ---------------------------------------------------------------------------
-- *** THE RESIDUAL INCONSISTENCY, RECORDED RATHER THAN HIDDEN ***
--
-- The cutoff is 24 hours. So:
--
--   at hour 23  the lazy path scores a partial attempt -- 3 of 25 becomes 12%
--               in a permanent record the candidate never submitted
--   at hour 25  this sweep closes it unscored
--
-- SAME CANDIDATE, SAME ABANDONMENT, DIFFERENT PERMANENT RECORD.
--
-- The companion change to get-active-exam-session NARROWS this but does not
-- remove it: past 24 hours the lazy path now refuses to score a mock_exam and
-- returns {active:false, abandoned:true}, leaving the row for this sweep. That
-- makes the outcome independent of whether a cron tick or a candidate login
-- happens first -- previously a permanent record decided by a race.
--
-- BUT A CANDIDATE RETURNING AT HOUR 23 STILL GETS A FABRICATED RESULT. The
-- boundary moved; it did not disappear. Scoring an unsubmitted attempt is
-- defensible while the candidate is plausibly still in it -- a closed laptop, a
-- dropped connection, a return within the day -- and indefensible at some
-- distance. 24 hours is where that line was drawn. It is a judgement, not a
-- derivation, and the case just inside it is a known edge.
--
-- ---------------------------------------------------------------------------
-- WHAT THE LAZY PATH HAS ALREADY WRITTEN. Measured 2026-09-02.
--
-- Three sessions sit at 0.00%. TWO are lazy-path fabrications:
--
--   mock_exam  info@certiglobal.org  2026-08-13 02:40 -> 14:17   11.6h
--   mock_exam  info@certiglobal.org  2026-08-19 21:25 -> 18:44   21.3h
--
-- Both are the mechanism this migration exists to stop: a session graded hours
-- after abandonment from whatever happened to be saved. 248 identified both.
--
-- THE THIRD IS NOT ONE, and the distinction matters:
--
--   certification_exam  info@certiglobal.org  2026-08-25 23:50:18 -> 23:50:25
--
-- SEVEN SECONDS from start to close. That is not lazy finalisation; it is a
-- session started and immediately ended. Counting it as a fabricated failure
-- would inflate the case for this change with a row that does not support it.
--
-- All three are a testing account, so no candidate was harmed. The mechanism is
-- the one that would have written 12% against rherrera.
--
-- ---------------------------------------------------------------------------
-- HOW IT AVOIDS DOUBLE-FINALISATION. Two different races, two defences.
--
-- SWEEP vs SWEEP -- `for update skip locked`, the claim_email_sends idiom
-- (243:127). Overlapping runs never contend for the same row.
--
-- SWEEP vs THE LAZY PATH -- skip locked CANNOT help here, because
-- get-active-exam-session holds no lock across its HTTP hop to score-mock-exam.
-- The defence is `and q.completed_at is null` re-checked under the lock in the
-- outer UPDATE: if the lazy path committed first, this matches zero rows and
-- does nothing.
--
-- The reverse ordering is caught by 248's third constraint:
--
--   quiz_sessions_reason_excludes_score
--     CHECK (closed_reason IS NULL OR (score_pct IS NULL AND passed IS NULL))
--
-- A score cannot land on a row this sweep has closed. 248 called that
-- constraint "the point", and it is: the two closure paths are mutually
-- exclusive IN THE DATABASE rather than by convention.
--
-- THAT REFUSAL WAS SILENT UNTIL NOW. score-mock-exam:503 discarded its update
-- result, so a 23514 was thrown away and the candidate was shown a score that
-- was never persisted. Fixed in the same commit: the update now guards on
-- completed_at, selects the row back, and throws 409 on either a constraint
-- error or a zero-row match. A silent no-op is the same defect one layer over.
--
-- ---------------------------------------------------------------------------
-- WHY pg_cron AND NOT AN EDGE FUNCTION.
--
-- This needs nothing outside Postgres. dispatch-emails and dispatch-webhooks
-- use net.http_post because they must reach Resend and partner endpoints;
-- lti-sweep-expired is the direct precedent for pure SQL -- cron.job runs
-- `select public.lti_sweep_expired();` on '17 3 * * *'.
--
-- An edge function would add an HTTP hop, a dispatch secret, a cold start and a
-- timeout to run one UPDATE.
--
-- HOURLY, not daily. /console/exams is a live monitoring surface; a phantom
-- lingering up to 24h is the cutoff working as designed, lingering up to 48h
-- because the job runs once a day is not. Scheduled at :23, off the hour like
-- lti-sweep-expired's :17, so the jobs do not pile up.
--
-- ---------------------------------------------------------------------------
-- THE FUNCTION BODY BELOW IS THE LIVE ONE, WITHOUT ITS COMMENTS.
--
-- The version handed over carried the reasoning above inline. What ran does
-- not, and pg_proc is what this file records -- CLAUDE.md: read the body back
-- from prosrc and md5 it, because a file that does not match the live function
-- is a record that lies. Same as 275.
--
--   sweep_abandoned_exam_sessions  573 bytes  5d866275354b2c999a6209d1d3edeaae
--                                  SECURITY DEFINER, VOLATILE, search_path=public
--
-- (md5 of prosrc with CRs stripped, as 244/245/249/270/275 do.)
--
-- ---------------------------------------------------------------------------
-- WHAT RAN, 2026-09-02.
--
--   BLOCK 3   select public.sweep_abandoned_exam_sessions();  ->  1
--
--   BLOCK 4   df083d27-e5b0-45ac-921e-6da8f42c331b
--               completed_at   2026-09-02 21:28:49.262538+00
--               closed_reason  abandoned_unscoreable
--               score_pct      NULL
--               passed         NULL
--
--   BEFORE -> AFTER, and the negative half is the interesting one:
--
--     open mock_exam sessions          1  ->  0     (must_be_0)
--     rows with abandoned_unscoreable  0  ->  1     (must_be_1)
--     open certification_exam          0  ->  0     (must_still_be_0)
--     open practice/review            68  -> 68     (must_still_be_68)
--
--   The last two are why this is evidence rather than a tally. A sweep that
--   also reached into cert sessions, or into the 68 practice and review rows
--   that have NO completion concept at all, would have passed a check that
--   only counted mock exams.
--
--   BLOCK 5   cron.schedule -> jobid 4
--               jobname   sweep-abandoned-exam-sessions
--               schedule  23 * * * *
--               active    true
--               command   select public.sweep_abandoned_exam_sessions();
--
-- cron.schedule is NOT transactional and is therefore OUTSIDE the begin/commit
-- below, commented, per CLAUDE.md.
--
-- MIGRATION REPLAY FROM ZERO HAS NEVER WORKED IN THIS REPOSITORY AND 276 DOES
-- NOT CHANGE THAT; see 268.
-- ============================================================================

begin;

create or replace function public.sweep_abandoned_exam_sessions(
  p_cutoff_hours integer default 24,
  p_limit        integer default 500
)
returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_closed integer;
begin
  with due as (
    select s.id
    from public.quiz_sessions s
    where s.kind = 'mock_exam'
      and s.completed_at is null
      and s.started_at < now() - make_interval(hours => p_cutoff_hours)
    order by s.started_at
    limit p_limit
    for update skip locked
  )
  update public.quiz_sessions q
  set completed_at  = now(),
      closed_reason = 'abandoned_unscoreable'
  from due
  where q.id = due.id
    and q.completed_at is null
  ;
  get diagnostics v_closed = row_count;
  return v_closed;
end;
$function$;

commit;

-- ---------------------------------------------------------------------------
-- Scheduling. NOT transactional -- run separately, after the function exists
-- and after a manual invocation has been verified.
--
-- select cron.schedule(
--   'sweep-abandoned-exam-sessions',
--   '23 * * * *',
--   $$ select public.sweep_abandoned_exam_sessions(); $$
-- );
--
-- ---------------------------------------------------------------------------
-- Verification, run separately. Property, and both directions.
--
-- select proname, prosecdef, provolatile,
--        coalesce(array_to_string(proconfig,','),'(none)') as cfg,
--        length(prosrc) as len,
--        md5(replace(prosrc, chr(13), '')) as md5
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and proname = 'sweep_abandoned_exam_sessions';
--
-- Expect 573 / 5d866275354b2c999a6209d1d3edeaae / true / v / search_path=public.
--
-- select jobid, jobname, schedule, active from cron.job
-- where jobname = 'sweep-abandoned-exam-sessions';
--
-- Expect one row, active.
--
-- THE NEGATIVE HALF. A sweep that works and a sweep that is too greedy look
-- identical if you only count what it closed:
--
-- select
--   (select count(*) from public.quiz_sessions
--      where kind='mock_exam' and completed_at is null)              as open_mock,
--   (select count(*) from public.quiz_sessions
--      where kind='certification_exam' and completed_at is null)     as open_cert,
--   (select count(*) from public.quiz_sessions
--      where kind in ('practice','review') and completed_at is null) as open_practice,
--   (select count(*) from public.quiz_sessions
--      where closed_reason='abandoned_unscoreable' and score_pct is not null) as must_be_0;
--
-- open_cert and open_practice must not fall. The last column must be zero and
-- cannot be otherwise -- 248's constraint forbids it -- which is exactly why
-- asserting it is worth the line: if it is ever non-zero the constraint is gone.
-- ============================================================================
