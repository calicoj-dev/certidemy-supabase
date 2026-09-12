-- 300: nothing recorded whether an item was authored, generated or translated
--
-- ONE PASTE. Pre- and post-conditions ABORT; one visible result set.
--
-- ============================================================================
-- WHY
-- ============================================================================
--
-- verify-cert's trilingual.items FAILS any question_group_id whose row count is
-- not exactly 3. That is right for a trilingual item missing a sibling. It is
-- wrong for an item that was only ever written in one language.
--
-- Since 2026-09-12 generate-practice-questions mints a group per generated
-- question (migration 299). It generates ONE language per call - the trilingual
-- fan-out is unbuilt - so every weak-concepts session now adds five groups of
-- one, and trilingual.items goes red on a live certification and grows by five
-- per session.
--
-- The state is not a defect. A group of one is the honest record of "this
-- logical question exists in English only". But a check that fails permanently
-- and grows is one people learn to skim, and this repo has already paid for
-- that once: CLAUDE.md's verify-cert baseline went stale for eighteen days and
-- turned a real regression into noise nobody re-read.
--
-- So the check needs to tell the two cases apart, and nothing in the 24 columns
-- of quiz_questions could. bank_revision was the only near-fit and it already
-- means something else (which cognitive model wrote the item: v2-jta, v3-l2,
-- v4-smaiii, v4-smaiii-sec, v2-jta-r2). Migration 295 is the recorded cost of
-- one field carrying two meanings - is_provisional, and the check built on it
-- misdescribed 100 pct of the rows it failed on.
--
-- ============================================================================
-- THE EXEMPTION IS NARROW, AND THE NARROWNESS IS THE WHOLE DESIGN
-- ============================================================================
--
-- To be written into verify-cert AFTER this migration runs:
--
--   generated + exactly 1 language  -> EXEMPT. Single-language by construction.
--   generated + exactly 2 languages -> FAIL, and name it. THIS IS WHAT A
--                                      DROPPED SIBLING LOOKS LIKE.
--   generated + 3                   -> passes normally, like anything else.
--   authored/translated + not 3     -> FAIL, unchanged.
--
-- An exemption written as "generated items are exempt" would hide a half-failed
-- fan-out, and it would do it on the day someone ships the fan-out - which is
-- the one change that makes generated items able to fail this way at all. The
-- two-language case must be LOUDER for generated rows than for anything else,
-- not quieter, because for a generated row it can only mean the fan-out broke.
--
-- The check must say this in its own output, the way items.vocabulary says it
-- is noisy by design. A reader who sees an exemption and cannot see its edges
-- has to go read the source to find out what is being hidden.
--
-- ============================================================================
-- THIS IS NOT THE END STATE, AND IT DOES NOT BLOCK THE END STATE
-- ============================================================================
--
-- certidemy-web/docs/CERTIDEMY-LEARNER-IA.md section 5.5 already says where
-- this lands: AI drafts should be written status='pending_review' and reviewed
-- before being served, with the gate enforced in the fetch paths
-- (fetchConceptPractice / get-review-batch / fetchWeakConceptPractice). It is
-- flagged there as "wire up next" and it is still not done. Deferred tonight,
-- deliberately, and noted here so the next reader finds it from the column.
--
-- THE TWO ARE COMPATIBLE, and this is the reason to do B first. When the review
-- queue lands, generated rows stop being part of the approved bank, so the
-- exemption stops APPLYING rather than becoming WRONG. A backfill that had
-- guessed at provenance would have to be unpicked; a column that records it
-- simply goes quiet. item_origin also survives as the provenance record the
-- review queue will want anyway.
--
-- ============================================================================
-- EVERY WRITER OF quiz_questions - BUILT FROM THREE MEASUREMENTS
-- ============================================================================
--
-- Per the writer-list discipline. DEFAULT 'authored' means none of them breaks;
-- the list exists so whoever adds a CONSTRAINT later knows what it will hit,
-- and so that whoever ships the fan-out knows where to set 'translated'.
--
-- THREE MEASUREMENTS, BECAUSE ONE WAS NOT ENOUGH LAST TIME. Migration 299's
-- first draft asserted that backfill-practice.mjs neither inserts nor calls the
-- RPC. It does both. That came from trusting a single grep whose result set was
-- silently short; a second grep over both repos returned the file the first had
-- not listed. So: a pattern search, an independent shell search, and a query
-- against pg_proc - which is the only one that can see the RPCs at all.
--
-- APPLICATION WRITERS (grep 1 and grep 2 agree, both repos):
--   1  supabase/scripts/gen-cert-secure.mjs:485             INSERT
--   2  supabase/scripts/retranslate-retired-vocabulary:166  UPDATE - text only.
--                                                           SETS 'translated'
--                                                           when it is taught to
--   3  supabase/scripts/fix-smaiii-retired-vocabulary:177   UPDATE - text only
--   4  supabase/scripts/debias-positions.mjs:199            UPDATE - options,
--                                                           correct_answer
--   5  supabase/scripts/publish-sample-questions.mjs:102    UPDATE - visibility
--   6  certidemy-web/scripts/seed-questions.mjs:196,205,217 INSERT + UPDATE
--
-- THROUGH THE RPC, NOT DIRECTLY - no .insert() appears in either:
--   7  supabase/scripts/backfill-practice.mjs:460           trilingual, sets the
--                                                           group. AUTHORED or
--                                                           TRANSLATED, see below
--   8  supabase/functions/generate-practice-questions:222   one language, mints
--                                                           one group each.
--                                                           MUST SET 'generated'
--
-- DATABASE FUNCTIONS - pg_proc, and NO application grep finds these:
--   9  create_practice_questions()  INSERTS. Not security definer
--  10  retire_item()                UPDATES retired_at / retire_reason. secdef
--  11  retire_item_bank()           UPDATES in bulk. secdef
--
--   Also touching the table but READ-ONLY, confirmed against prosrc:
--   get_public_samples(), get_session_review() - both security definer.
--
-- TRIGGERS ON THE TABLE:
--   trg_item_bloom_matches_task        BEFORE INSERT/UPDATE
--   trg_prevent_delete_presented_item  BEFORE DELETE
--
--   THE FIRST IS A BEFORE TRIGGER, so a future NOT NULL column with no default
--   would surface as ITS error rather than as 23502 - the trap CLAUDE.md
--   records for trg_guard_credential_issuer, where a missing achievement_id
--   appeared as P0001. The DEFAULT below makes that moot.
--
-- SIXTY-THREE FILES MENTION quiz_questions AND ALL THE REST ARE READERS.
-- Checked one by one rather than by eye: generate-mock-exam, score-mock-exam,
-- submit-quiz-answer (both sites), get-review-batch, get-active-exam-session,
-- get-governance-snapshot, render-asset, verify-cert, audit-grounding-
-- compliance, patch-render-asset-engine-brief, backfill-practice:304,
-- debias-positions:91, certidemy-web/lib/engine/sessions.ts (both sites) and
-- certidemy-web/lib/quiz/history.ts are all .select().
--
-- ============================================================================
-- BACKFILL: WHAT IS ESTABLISHED, AND WHAT IS ONLY INFERRED
-- ============================================================================
--
-- Two statements, deliberately separate, with separate post-conditions, so the
-- reader can see exactly how much of this rests on evidence and how much on a
-- fingerprint.
--
-- (1) ESTABLISHED - 5 rows. The SM-AI-II rows written at
--     2026-09-12 18:15:59.862299+00. Direct evidence: five rows, five distinct
--     groups, written half a second before the weak-concepts session at
--     18:16:00.355873 that plays them, which is the order fetchWeakConceptPractice
--     documents. Nothing else can have written them.
--
-- (2) INFERRED FROM A FINGERPRINT - 140 rows. Every ungrouped practice row that
--     is private, not exam scope, approved and not retired. The argument is
--     exhaustiveness of the writer list above: of the two callers that reach
--     this table with those forced values, backfill-practice.mjs ALWAYS sets a
--     group and generate-practice-questions NEVER did before today. So an
--     ungrouped row with that shape has one possible author.
--
--     It is an argument, not a record. It is separated for that reason.
--
-- NOT MARKED, AND WHY - 26 ungrouped rows that fail the fingerprint:
--     20  AIE-I    es-419  rejected AND retired, from 2026-07-24
--      5  AIHR-I   es-419  retired
--      1  ZZ-TEST-I  en    pool='secure', is_exam_scope=true,
--                          visibility='secure' - the RPC forces practice/false/
--                          private, SO THIS ROW CANNOT HAVE COME FROM IT.
--
--     That last row is the reason this backfill is not written as "ungrouped
--     means generated". Ungrouped and generated are not the same set, and one
--     row proves it.
--
-- 'translated' IS DELIBERATELY LEFT EMPTY, AND THIS IS THE THING I COULD NOT
-- ESTABLISH. Roughly two thirds of the bank is non-English and almost all of it
-- is translated from an English sibling - but NOTHING RECORDS THAT PER ROW.
-- Inferring it from language <> 'en' would mislabel any item authored directly
-- in Spanish or Portuguese, and the 30 approved ungrouped es-419 rows on AIE-I
-- are exactly that ambiguous case: they have no English sibling at all, so the
-- inference that would mark them also has nothing to point at.
--
-- Marking 20,000 rows on an assumption to make a column look complete is how a
-- provenance field becomes a field nobody trusts. They stay 'authored', which
-- is the default and is wrong for some of them, and that is written down here
-- rather than hidden behind a number. retranslate-retired-vocabulary.mjs is the
-- place to start setting it correctly, going forward.
--
-- ============================================================================
-- GUARD 1 (PRE)
-- ============================================================================
begin;

do $pre$
declare n_rows int; n_tonight int; n_fp int;
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='quiz_questions'
               and column_name='item_origin') then
    raise exception using message = '300 has already run';
  end if;

  select count(*) into n_rows from public.quiz_questions;
  if n_rows < 1 then
    raise exception using message = 'quiz_questions is empty', hint = 'wrong database?';
  end if;

  -- The two backfill populations must be the sizes this header claims. If the
  -- numbers have moved, the header is stale and the reasoning behind it needs
  -- re-checking before it is applied.
  select count(*) into n_tonight from public.quiz_questions
   where created_at = timestamptz '2026-09-12 18:15:59.862299+00';
  if n_tonight <> 5 then
    raise exception using message = 'the established population is not 5',
      detail = format('%s row(s)', n_tonight);
  end if;

  select count(*) into n_fp from public.quiz_questions
   where question_group_id is null and pool = 'practice' and is_exam_scope = false
     and visibility = 'private' and status = 'approved' and retired_at is null;
  if n_fp <> 140 then
    raise exception using message = 'the fingerprint population is not 140',
      detail = format('%s row(s)', n_fp),
      hint = 'a generate run since the measurement would change this';
  end if;

  raise notice 'pre ok: % rows, 5 established, 140 inferred', n_rows;
end
$pre$;


alter table public.quiz_questions
  add column item_origin text not null default 'authored';

alter table public.quiz_questions
  add constraint quiz_questions_item_origin_check
  check (item_origin in ('authored', 'generated', 'translated'));

comment on column public.quiz_questions.item_origin is
  'authored = written for this bank. generated = written by generate-practice-questions, one language per call. translated = rendered from a sibling. verify-cert exempts generated groups of exactly ONE row from trilingual.items and FAILS generated groups of exactly TWO, because for a generated row two means the fan-out dropped a sibling.';


-- (1) ESTABLISHED
update public.quiz_questions
   set item_origin = 'generated'
 where created_at = timestamptz '2026-09-12 18:15:59.862299+00';

-- (2) INFERRED FROM THE FINGERPRINT
update public.quiz_questions
   set item_origin = 'generated'
 where question_group_id is null
   and pool = 'practice'
   and is_exam_scope = false
   and visibility = 'private'
   and status = 'approved'
   and retired_at is null;


-- ============================================================================
-- GUARD 2 (POST)
-- ============================================================================
do $post$
declare
  n_gen int; n_trans int; n_auth int; n_null int; n_total int;
  n_excluded_marked int; n_tonight_gen int;
begin
  select count(*) filter (where item_origin = 'generated'),
         count(*) filter (where item_origin = 'translated'),
         count(*) filter (where item_origin = 'authored'),
         count(*) filter (where item_origin is null),
         count(*)
    into n_gen, n_trans, n_auth, n_null, n_total
    from public.quiz_questions;

  if n_null <> 0 then
    raise exception using message = 'a NULL reached a NOT NULL column';
  end if;

  -- POSITIVE HALF.
  if n_gen <> 145 then
    raise exception using message = 'expected 145 generated',
      detail = format('%s', n_gen);
  end if;
  select count(*) into n_tonight_gen from public.quiz_questions
   where created_at = timestamptz '2026-09-12 18:15:59.862299+00'
     and item_origin = 'generated';
  if n_tonight_gen <> 5 then
    raise exception using message = 'the 5 established rows are not marked';
  end if;

  -- NEGATIVE HALF, and it is the half that matters. Marking a row 'generated'
  -- GRANTS IT AN EXEMPTION, so a false positive here hides a real defect.
  -- Name the rows that must NOT have moved.
  if n_trans <> 0 then
    raise exception using message = 'translated was populated',
      detail = format('%s row(s)', n_trans),
      hint = 'nothing establishes translation per row; see the header';
  end if;

  select count(*) into n_excluded_marked from public.quiz_questions
   where question_group_id is null
     and not (pool = 'practice' and is_exam_scope = false and visibility = 'private'
              and status = 'approved' and retired_at is null)
     and item_origin <> 'authored';
  if n_excluded_marked <> 0 then
    raise exception using message = 'a row outside the fingerprint was marked',
      detail = format('%s row(s)', n_excluded_marked),
      hint = 'the retired, rejected and ZZ-TEST-I secure rows must stay authored';
  end if;

  if n_auth + n_gen <> n_total then
    raise exception using message = 'the three states do not sum to the table';
  end if;

  -- The CHECK must actually refuse a fourth value, in a subtransaction so the
  -- probe cannot leave anything behind.
  begin
    update public.quiz_questions set item_origin = 'derived'
     where id = (select id from public.quiz_questions limit 1);
    raise exception using message = 'the CHECK did not refuse an invalid value';
  exception
    when check_violation then null;
  end;

  raise notice 'post ok: % generated, % authored, 0 translated', n_gen, n_auth;
end
$post$;

commit;


-- ============================================================================
-- THE VISIBLE RESULT SET
-- ============================================================================
select item_origin, count(*) as rows,
       count(distinct question_group_id) as groups,
       count(*) filter (where question_group_id is null) as ungrouped
from public.quiz_questions group by 1 order by 1;
-- EXPECT exactly two rows:
--   authored   27974   (everything else)
--   generated    145   5 grouped + 140 ungrouped
-- translated must be ABSENT. If it appears, something set it and the header's
-- account of what could not be established is out of date.
--
--
-- ============================================================================
-- WHAT MUST HAPPEN NEXT, AND IN THIS ORDER
-- ============================================================================
--
-- verify-cert is NOT changed in the same step. It reads quiz_questions through
-- must(), which ABORTS the whole run on a failed read, and selecting a column
-- that does not exist yet fails the entire query in PostgREST - which is
-- READ-FAILURE-AUDIT.md section 1 item 2, the i18n.approved incident, exactly.
-- So: this migration first, then the check.
--
-- The check change is trilingual.items, and it must:
--   - exempt generated groups of exactly 1
--   - FAIL generated groups of exactly 2, with its own message naming the
--     dropped-sibling reading
--   - leave authored and translated groups alone
--   - state the exemption and its edges in the detail line
