-- 163_exam_session_items.sql
--
-- Records the examination form the SERVER assembled, so scoring can grade
-- against it instead of trusting the client.
--
-- ============================================================================
-- THE DEFECT THIS CLOSES
-- ============================================================================
--
-- Before this migration, generate-mock-exam assembled a blueprint-weighted form
-- in memory, handed it to the browser, and recorded nothing about which items
-- were served. score-mock-exam then graded whatever `answers` array the client
-- posted back.
--
-- Consequences, all reachable from a browser console during a live exam:
--
--   SCORE INFLATION. `total` was the length of the submitted array, and
--   score_pct = correct / total. Submitting a single known item scored 1/1 =
--   100%, cleared the pass mark, and minted a credential. exam_attempts
--   recorded total_questions = 1.
--
--   POOL SUBSTITUTION. Nothing verified the submitted question_ids belonged to
--   the secure pool, to that certification, or to that session. Practice-pool
--   ids were accepted - and the simulator openly shows correct answers.
--
--   SESSION REPLAY. Ids from an earlier session were equally acceptable.
--
--   CLIENT-ASSERTED LANGUAGE. quiz_sessions has no language column, so the
--   form's language came from the request body at scoring time and flowed into
--   per-item telemetry and the credential's locale.
--
-- The credential produced by any of these verified as genuine on the public
-- verification page. That is the whole problem: a credential mintable by
-- editing a network request means nothing, and every asset in the sales library
-- argues that this one means something.
--
-- ============================================================================
-- WHAT THIS TABLE IS
-- ============================================================================
--
-- One row per item served, per session, in the order presented. Written by
-- generate-mock-exam inside the same request that assembles the form. Read by
-- score-mock-exam, which grades every served item - counting an item the
-- candidate never answered as incorrect - and refuses items that were not
-- served.
--
-- It also unlocks three things that were impossible without it:
--
--   RESUME. A form that was never recorded cannot be re-served. Regenerating
--   would draw a fresh sample and hand the candidate a second look at the
--   secure pool. With this table, a session can be resumed exactly as issued.
--
--   REAL EXPOSURE. v_exam_exposure computes exposure from form size against
--   pool size - a theoretical figure. Joining this table gives actual
--   per-item exposure: what candidates have really seen, how often.
--
--   ITEM ANALYSIS ON UNANSWERED ITEMS. quiz_attempts only ever held items the
--   candidate submitted. An item consistently skipped is a signal about the
--   item, and it was invisible.
--
-- ============================================================================
-- RLS: SERVICE ROLE ONLY, DELIBERATELY
-- ============================================================================
--
-- Row level security is enabled with NO policies, so nothing but the service
-- role can read or write. This is not an oversight to be fixed later.
--
-- A candidate who could read their own row set would learn the form's exact
-- composition, and presented_order maps one-to-one onto the array positions in
-- their own submission. A candidate who could read anyone else's would have the
-- item bank. The form reaches the browser through generate-mock-exam's response
-- and by no other route.
--
-- Remember that a table-level GRANT is checked BEFORE RLS: no grant is issued
-- here, and none should be.
--
-- ============================================================================
-- integrity_flags ON exam_attempts
-- ============================================================================
--
-- Scoring records what it observed rather than silently correcting it: items
-- submitted that were never served, served items left unanswered, and whether
-- the form came from this table or from the legacy client-trusting path. That
-- is evidence for the fraud review, and it is also how we will know when the
-- legacy path can be deleted.

create table if not exists public.exam_session_items (
  session_id      uuid    not null references public.quiz_sessions(id) on delete cascade,
  question_id     uuid    not null references public.quiz_questions(id),
  presented_order integer not null,
  language        text    not null,
  created_at      timestamptz not null default now(),
  primary key (session_id, question_id)
);

-- One item per position. A duplicated order would make the form ambiguous and
-- break any attempt to re-serve it in the order the candidate saw.
create unique index if not exists exam_session_items_session_order_uq
  on public.exam_session_items (session_id, presented_order);

-- Exposure analysis reads by question across sessions.
create index if not exists exam_session_items_question_idx
  on public.exam_session_items (question_id);

alter table public.exam_session_items enable row level security;

comment on table public.exam_session_items is
  'The examination form as ASSEMBLED BY THE SERVER: one row per served item, in presented order. score-mock-exam grades against this, never the client submission. RLS on with no policies and no grants - service role only, because these rows describe the form composition and, across sessions, the item bank.';

comment on column public.exam_session_items.presented_order is
  'Zero-based position in the form as served. Maps to quiz_attempts.presented_order.';

comment on column public.exam_session_items.language is
  'The language the form was served in, known server-side at assembly. Previously the form language was taken from the client at scoring time and flowed into telemetry and the credential locale.';

alter table public.exam_attempts
  add column if not exists integrity_flags jsonb;

comment on column public.exam_attempts.integrity_flags is
  'What scoring observed about the submission: items submitted but never served, served items left unanswered, and the form source (server | client_legacy). Evidence for fraud review, and the signal for when the legacy client-trusting scoring path can be removed.';

-- ---------------------------------------------------------------- verify ---
--
--   select count(*) from exam_session_items;   -- 0 until the next exam starts
--
--   select column_name from information_schema.columns
--   where table_schema='public' and table_name='exam_attempts'
--     and column_name='integrity_flags';       -- 1 row
--
--   select relrowsecurity from pg_class
--   where oid = 'public.exam_session_items'::regclass;   -- expect t
--
-- Note: relrowsecurity is a boolean here, not a reloption - the `security_invoker
-- reads 'on' not 'true'` trap does not apply to this check.
