-- 248_session_terminal_state.sql
--
-- Gives a quiz_session a way to end without a result.
--
-- Editor-first: this ran live in the SQL editor on 2026-08-25, one statement at
-- a time. The file is the record of what already ran, not a script anyone
-- executes.
--
-- Verified the way 247 was, and for the same reason: there is no function body
-- here to hash, so section 4 records what pg_get_constraintdef returned,
-- verbatim, and those strings are what a later reader compares against.
--
-- ============================ WHAT WAS MISSING ==========================
--
-- score-mock-exam:503 was the ONLY writer of quiz_sessions.completed_at in the
-- entire codebase, and it always writes score_pct, passed, and an exam_attempts
-- row. There was no third option. A session could be open, or it could be
-- scored. Nothing else.
--
-- So a session that could not be honestly scored could only stay open forever.
-- get-active-exam-session's header already names the case it refuses to score:
-- a formless session, where grading would write "a fabricated failed attempt in
-- a permanent record... arguably misrepresenting a candidate". It leaves those
-- alone "for an administrator, who can close them without inventing a result"
-- -- an administrator who, until this migration, had no way to do that.
--
-- That is why the Examinations screen accumulates. Not a display bug: the
-- terminal state it wanted to show did not exist.
--
-- ============================ IT WAS ALREADY HAPPENING ==================
--
-- The lazy finalisation has already written fabricated failures. Two mock_exam
-- rows for info@certiglobal.org sit at 0.00%, finalised 21 hours and 11 hours
-- after their sessions started (2026-08-19 21:25 -> 2026-08-20 18:44, and
-- 2026-08-13 02:40 -> 2026-08-13 14:17). Both are a testing account, so no
-- candidate was harmed. The mechanism is the same one that would have written
-- 31% against a real candidate whose session ended mid-attempt on 2026-08-21.
--
-- ============================ WHY A REASON, NOT A STATUS ================
--
-- A status column would be a fourth vocabulary competing with completed_at,
-- score_pct and passed, and every existing reader would have to consult it.
-- There are four such readers -- get-active-exam-session:109,
-- get-exam-monitor:114, save-exam-answer:117, score-mock-exam:161 -- plus two
-- that read completed_at IS NOT NULL, and ZERO database views: nothing in
-- information_schema.views references quiz_sessions at all.
--
-- A nullable reason is additive. All six readers keep working unchanged,
-- because a closed-unscored session has completed_at set and correctly stops
-- being "in progress". The only behavioural change is that get-exam-monitor's
-- recent-results list will show these with null scores and needs a branch.
--
-- ============================ THE THIRD CONSTRAINT IS THE POINT =========
--
-- quiz_sessions_reason_excludes_score makes the two closure paths mutually
-- exclusive IN THE DATABASE rather than by convention. After it exists,
-- score-mock-exam physically cannot write a reason alongside a score, and a
-- reasoned closure physically cannot carry one. Neither path can drift into
-- the other's shape, whatever a future edit to either function does.
--
-- Same discipline as analysis_findings_review_pairing (218) and
-- company_features_revocation_pairing (226).
--
-- ============================ THE VOCABULARY ============================
--
--   abandoned_unscoreable -- formless and past its window. Nothing writes this
--     yet; it is for the sweep, which is deliberately not built here.
--   administrative        -- a human closed it without inventing a result.
--   superseded            -- replaced by a later session from the same
--     candidate. The word exists because the 2026-08-21 incident demanded it:
--     one candidate started five sessions in six minutes, two of them
--     certification exams seven seconds apart, and four of the five were
--     superseded rather than abandoned.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. The column.
-- ---------------------------------------------------------------------------

alter table public.quiz_sessions
  add column if not exists closed_reason text;

-- ---------------------------------------------------------------------------
-- 2. The three constraints. Run one at a time.
--    All three validated trivially against existing rows: every closed_reason
--    was null when they were added.
-- ---------------------------------------------------------------------------

alter table public.quiz_sessions drop constraint if exists quiz_sessions_closed_reason_vocab;
alter table public.quiz_sessions
  add constraint quiz_sessions_closed_reason_vocab
  check (closed_reason is null or closed_reason in
         ('abandoned_unscoreable','administrative','superseded'));

alter table public.quiz_sessions drop constraint if exists quiz_sessions_reason_requires_closure;
alter table public.quiz_sessions
  add constraint quiz_sessions_reason_requires_closure
  check (closed_reason is null or completed_at is not null);

alter table public.quiz_sessions drop constraint if exists quiz_sessions_reason_excludes_score;
alter table public.quiz_sessions
  add constraint quiz_sessions_reason_excludes_score
  check (closed_reason is null or (score_pct is null and passed is null));

comment on column public.quiz_sessions.closed_reason is
  'Why a session ended without a result. NULL for both an open session and a normally scored one -- the distinguishing column is completed_at. Set only when completed_at is set and score_pct/passed are null, enforced by quiz_sessions_reason_requires_closure and quiz_sessions_reason_excludes_score.';

-- ---------------------------------------------------------------------------
-- 3. Backfill.
--
--    RUN AFTER the closures, not before. Those four sessions were closed by
--    hand in a separate step earlier the same day -- completed_at set,
--    score_pct and passed left null -- because no function closes a session
--    unscored and this migration is what makes that state expressible. The
--    admin_actions row with action 'close_sessions_unscored' identifies them
--    and records why.
--
--    The three guards are what make the ordering safe: run before the closures
--    this updates nothing rather than writing a reason onto an open session,
--    which quiz_sessions_reason_requires_closure would refuse anyway.
--
--    'administrative' rather than 'superseded' even though four of the five
--    sessions genuinely were superseded: a human decided to close these, and
--    recording the decision that was made is worth more than the finer
--    classification nobody applied at the time.
-- ---------------------------------------------------------------------------

update public.quiz_sessions
set closed_reason = 'administrative'
where id in ('80a57268-ad49-42c6-8f95-acaea49e58be',
             '29a083ea-c707-4fdc-999d-e644a19cf175',
             '27243a2f-45a2-411a-ac30-cda95b8cd7ce',
             'c4c606eb-7a73-405f-a7e1-e64453f369d6')
  and completed_at is not null
  and score_pct is null
  and closed_reason is null;
-- OBSERVED: UPDATE 4.

-- ---------------------------------------------------------------------------
-- 4. Verification. Observed live 2026-08-25 after the statements above.
--    These strings ARE the record -- compare against them rather than against
--    the SQL in section 2, which is what was typed, not what resulted.
-- ---------------------------------------------------------------------------

-- select conname, pg_get_constraintdef(oid), convalidated
-- from pg_constraint
-- where conrelid = 'public.quiz_sessions'::regclass and contype = 'c'
-- order by conname;
--
-- OBSERVED, verbatim (all convalidated true):
--
--   quiz_sessions_closed_reason_vocab
--     CHECK (((closed_reason IS NULL) OR (closed_reason = ANY (ARRAY['abandoned_unscoreable'::text, 'administrative'::text, 'superseded'::text]))))
--
--   quiz_sessions_reason_excludes_score
--     CHECK (((closed_reason IS NULL) OR ((score_pct IS NULL) AND (passed IS NULL))))
--
--   quiz_sessions_reason_requires_closure
--     CHECK (((closed_reason IS NULL) OR (completed_at IS NOT NULL)))
--
--   (pre-existing, unchanged)
--   quiz_sessions_kind_check
--     CHECK ((kind = ANY (ARRAY['practice'::text, 'module_check'::text, 'mock_exam'::text, 'review'::text, 'certification_exam'::text])))

-- select a.attname, format_type(a.atttypid, a.atttypmod), a.attnotnull
-- from pg_attribute a
-- where a.attrelid = 'public.quiz_sessions'::regclass and a.attname = 'closed_reason';
--
-- OBSERVED: closed_reason | text | false

-- -- The invariant, as a property rather than a count.
-- select count(*) from public.quiz_sessions
-- where closed_reason is not null and (completed_at is null or score_pct is not null);
-- OBSERVED: 0

-- -- The four backfilled rows.
-- select id, kind, completed_at is not null as closed, score_pct, passed, closed_reason
-- from public.quiz_sessions
-- where user_id = '15ad2a8e-e36b-44b3-a4be-5ce6065d6268'
--   and kind in ('mock_exam','certification_exam')
-- order by started_at;
-- OBSERVED: 4 rows, closed true, score_pct null, passed null,
--           closed_reason 'administrative'.

-- -- NOT closed and deliberately left: df083d27-e5b0-45ac-921e-6da8f42c331b,
-- -- a different candidate's mock exam from the same day. It has a form and
-- -- three answers, no voucher and no credential at stake. It is the first job
-- -- for the supported console action, which is a better first exercise of that
-- -- path than another hand-written UPDATE.
