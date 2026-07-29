-- 164_exam_session_items_answers.sql
--
-- Turns the served-form record into LIVE WORKING STATE by adding answer columns
-- to exam_session_items. One row per served item already existed (migration
-- 163); it now also holds what the candidate has answered so far.
--
-- ============================================================================
-- WHAT THIS FIXES
-- ============================================================================
--
-- Answers lived only in React state until submit. Consequences, all live today:
--
--   A DEAD BROWSER IS TOTAL LOSS. A certification exam consumes the voucher at
--   START. If the tab dies at minute 55 of 60, the candidate has paid, answered
--   eighty items, and holds nothing. Two abandoned sessions from 2026-07-29 sit
--   in quiz_sessions right now with started_at set, completed_at null, and no
--   attempt row - exactly this shape.
--
--   RESUME WAS IMPOSSIBLE. Not a UI gap: there was nothing to return to.
--
--   SCORING STILL NEEDED THE CLIENT. Migration 163 made the FORM
--   server-authoritative, so a manipulated submission can no longer inflate a
--   score. But the answers themselves still arrived from the browser. With them
--   on the server, submit becomes a finalise signal rather than the source of
--   truth - the difference between the defect being CHECKED and being ABSENT.
--
--   ABANDONED ATTEMPTS COULD NOT BE CLOSED. Auto-submit at zero only fires if a
--   client is present. No client, no submission, and the attempt sits
--   in_progress forever with the voucher neither consumed-and-spent nor
--   released. Server-side finalisation needs saved answers to score.
--
-- ============================================================================
-- WHY ON WRITE, NOT ON A CLOCK
-- ============================================================================
--
-- The obvious design is a heartbeat - persist every N seconds. It writes
-- whether or not anything changed, and at 45-second ticks over a 120-minute
-- exam that is 160 writes per candidate that still cannot tell you WHEN an
-- answer was given, only which tick it had been given by.
--
-- Writing on answer CHANGE, debounced a second or two client-side, produces
-- roughly 100-150 writes across a two-hour eighty-item exam - fewer than the
-- heartbeat - and each one is precise. No interval, nothing to poll.
--
-- ============================================================================
-- COLUMN NOTES
-- ============================================================================
--
-- user_answer         jsonb, null until first answered. An empty array means
--                     the candidate cleared their selection; null means they
--                     never touched the item. Scoring treats both as incorrect,
--                     but the distinction is real telemetry: cleared-then-left
--                     is different behaviour from never-visited.
--
-- time_taken_seconds  cumulative seconds on the item, as the client accrues it.
--                     Overwritten on each save because the client sends the
--                     running total, not a delta.
--
-- marked_for_review   the candidate's own flag, carried into the examination
--                     record. Never affects scoring.
--
-- answered_at         when this row was last written. With presented_order it
--                     reconstructs the sequence a candidate actually worked in,
--                     which is not the order the form was served. That is
--                     item-analysis and fraud-detection substrate: a candidate
--                     answering strictly in served order at uniform intervals
--                     looks nothing like one who skips ahead and returns.
--
-- RLS is unchanged - still enabled with no policies and no grants, so only the
-- service role touches these rows. A candidate who could read them would have
-- their own form composition; across sessions, the item bank. Writes go through
-- save-exam-answer, which verifies session ownership, that the session is not
-- already completed, that the item was actually served, and that the clock has
-- not expired.

alter table public.exam_session_items
  add column if not exists user_answer        jsonb,
  add column if not exists time_taken_seconds integer,
  add column if not exists marked_for_review  boolean not null default false,
  add column if not exists answered_at        timestamptz;

comment on column public.exam_session_items.user_answer is
  'Selected option ids as saved during the exam. Null = never answered; empty array = answered then cleared. Both score incorrect, but the difference is real behavioural telemetry.';

comment on column public.exam_session_items.time_taken_seconds is
  'Cumulative seconds the candidate spent on this item. Overwritten per save - the client sends a running total, not a delta.';

comment on column public.exam_session_items.marked_for_review is
  'The candidate flagged this item during the exam. Part of the examination record for the reviewer and appeals surface. Never affects scoring.';

comment on column public.exam_session_items.answered_at is
  'Last write to this row. With presented_order, reconstructs the order the candidate actually worked in rather than the order served.';

-- ---------------------------------------------------------------- verify ---
--
--   select column_name, data_type, is_nullable
--   from information_schema.columns
--   where table_schema='public' and table_name='exam_session_items'
--   order by ordinal_position;
--   -- expect the four new columns after language/created_at
--
--   select count(*) filter (where user_answer is not null) as answered,
--          count(*) as items
--   from exam_session_items;
--   -- answered = 0 until save-exam-answer is wired into the runner
