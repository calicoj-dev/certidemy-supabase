-- 064_marked_for_review.sql
-- Capture the candidate's "mark for review" flag per item (exam-integrity
-- record + reviewer/appeals substrate). Cert-agnostic. Editor-first. Idempotent.
--
-- The flag lives only in the exam client today and is discarded at submit.
-- This adds the column so the scorer can persist it on every quiz_attempts row
-- going forward. Historical rows keep NULL (they predate capture).
--
-- 17024 relevance: a marked item is part of the candidate's examination record;
-- it is what a reviewer/appeal examines and what item-analysis can correlate
-- against difficulty. Storing it makes the record complete and reviewable.

alter table public.quiz_attempts
  add column if not exists marked_for_review boolean not null default false;

comment on column public.quiz_attempts.marked_for_review is
  'True if the candidate flagged this item for review during the exam. Captured at submit; part of the examination record and the reviewer/appeals surface.';

-- Partial index: reviewers/appeals queries filter to marked items only, so an
-- index on just the TRUE rows keeps that lookup cheap without bloating the table.
create index if not exists idx_quiz_attempts_marked
  on public.quiz_attempts (session_id)
  where marked_for_review = true;
