-- 298: an item may QUOTE a retired term on purpose, and nothing could say so
--
-- ONE PASTE. Pre- and post-conditions ABORT; one visible result set.
--
-- ============================================================================
-- WHY
-- ============================================================================
--
-- verify-cert's items.vocabulary FAILS a secure bank on any prior-edition Scrum
-- term. That is right for an item that ASSERTS one. It is wrong for an item
-- whose whole subject is that the term was retired:
--
--   "A 2017-era wiki states the Development Team is 'self-organizing'..."
--   "A Scrum Master learns 'self-organizing' was deprecated..."
--   "A legacy document states 'the Development Team commits'..."
--
-- Those are terminology-drift items. The retired term IS THE MISCONCEPTION
-- UNDER TEST, and removing it destroys the item. Without a way to say so, every
-- future run reports them as defects forever - which is how a check gets
-- ignored, and this codebase has already watched that happen with a baseline
-- nobody re-checked.
--
-- Lessons got this on 2026-09-11 as a frontmatter field,
-- teaches_retired_vocabulary. quiz_questions has no frontmatter and no metadata
-- column - 23 columns, all typed and specific - so it needs one.
--
-- ============================================================================
-- WHY A THREE-VALUE TEXT AND NOT A BOOLEAN
-- ============================================================================
--
-- Migration 295 is the precedent and the warning. is_provisional was one
-- boolean carrying three meanings, and the check built on it ended up
-- misdescribing 100 pct of the rows it failed on. A boolean here would say "is
-- this deliberate" and would need a second state the moment anyone asked WHY.
--
--   none    no retired term, or one that is a defect. The default.
--   quoted  the item shows the candidate a legacy document or a superseded
--           term IN ORDER TO TEST that they recognise it. Exempt from the FAIL.
--
-- Reserved deliberately: this is not a general-purpose tag. If a third case
-- appears, it earns a third value with a reason written down, the way 296's
-- fourth value did.
--
-- ============================================================================
-- KEYED BY question_group_id, READ PER GROUP
-- ============================================================================
--
-- The column is stored per ROW because that is where the text is, but
-- verify-cert reads it per GROUP: question_group_id binds the en / es-419 /
-- pt-BR siblings of one item, and a re-translated row must not lose an
-- exemption its siblings keep. Exactly how teaches_retired_vocabulary keys on
-- lesson_group_id, and for the same reason - on 2026-09-11 a translation that
-- had not been reloaded would otherwise have failed while its English sibling
-- passed.
--
-- ============================================================================
-- EVERY WRITER OF quiz_questions
-- ============================================================================
--
-- Per the writer-list discipline. DEFAULT 'none' means none of them breaks; the
-- list exists so that whoever adds a CONSTRAINT later knows what it will hit.
--
-- APPLICATION WRITERS, both repos:
--   1  supabase/scripts/gen-cert-secure.mjs             INSERT - the generator
--   2  supabase/scripts/retranslate-retired-vocabulary  UPDATE - text only
--   3  supabase/scripts/fix-smaiii-retired-vocabulary   UPDATE - text only
--   4  supabase/scripts/debias-positions.mjs            UPDATE - options,
--                                                       correct_answer
--   5  supabase/scripts/publish-sample-questions.mjs    UPDATE - visibility,
--                                                       keyed BY question_group_id
--                                                       already
--   6  certidemy-web/scripts/seed-questions.mjs         INSERT + UPDATE
--
-- DATABASE FUNCTIONS - NO GREP OF APPLICATION CODE FINDS THESE:
--   7  create_practice_questions()   INSERTS. This is what
--                                    scripts/backfill-practice.mjs actually
--                                    calls - the script itself contains no
--                                    insert at all, which is why it does not
--                                    appear above.
--   8  retire_item()                 UPDATES retired_at / retire_reason
--   9  retire_item_bank()            UPDATES in bulk
--
-- TRIGGERS ON THE TABLE:
--   trg_item_bloom_matches_task      BEFORE - enforces item bloom = task bloom
--   trg_prevent_delete_presented_item  guards deletion of a served item
--
--   NOTE THE FIRST ONE. It is a BEFORE trigger, so a future NOT NULL column
--   with no default would surface as ITS error rather than as 23502 - the same
--   trap CLAUDE.md records for trg_guard_credential_issuer, where a missing
--   achievement_id appeared as P0001. The DEFAULT below makes that moot.
--
-- MIGRATION BACKFILLS that insert or update this table: 029-044 (seeds),
-- 058, 059, 089, 098, 109, 110, 111. None sets this column; all get the default.
--
-- ============================================================================
-- GUARD 1 (PRE)
-- ============================================================================
begin;

do $pre$
declare n_rows int;
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='quiz_questions'
               and column_name='retired_vocabulary_intent') then
    raise exception using message = '298 has already run';
  end if;
  select count(*) into n_rows from public.quiz_questions;
  if n_rows < 1 then
    raise exception using message = 'quiz_questions is empty', hint = 'wrong database?';
  end if;
  raise notice 'pre ok: % rows', n_rows;
end
$pre$;


alter table public.quiz_questions
  add column retired_vocabulary_intent text not null default 'none';

alter table public.quiz_questions
  add constraint quiz_questions_retired_vocabulary_intent_check
  check (retired_vocabulary_intent in ('none', 'quoted'));

comment on column public.quiz_questions.retired_vocabulary_intent is
  'none = no retired term, or one that is a defect. quoted = the item shows a legacy document or superseded term IN ORDER TO TEST recognition of it; exempt from items.vocabulary FAIL. Set on every language row of a question_group_id; verify-cert reads it per group.';


-- ============================================================================
-- GUARD 2 (POST)
-- ============================================================================
do $post$
declare n_none int; n_other int; n_null int;
begin
  select count(*) filter (where retired_vocabulary_intent = 'none'),
         count(*) filter (where retired_vocabulary_intent <> 'none'),
         count(*) filter (where retired_vocabulary_intent is null)
    into n_none, n_other, n_null from public.quiz_questions;
  if n_null <> 0 then
    raise exception using message = 'a NULL reached a NOT NULL column', detail = format('%s', n_null);
  end if;
  if n_other <> 0 then
    raise exception using message = 'the backfill was supposed to be pure default',
      detail = format('%s row(s) are not none', n_other),
      hint = 'nothing in this migration sets a value - every exemption is a deliberate later act';
  end if;
  -- The CHECK must actually refuse a third value. Tested in a subtransaction so
  -- the probe cannot leave anything behind.
  begin
    update public.quiz_questions set retired_vocabulary_intent = 'maybe'
     where id = (select id from public.quiz_questions limit 1);
    raise exception using message = 'the CHECK constraint did not refuse an invalid value';
  exception
    when check_violation then null;
  end;
end
$post$;

commit;


-- ============================================================================
-- THE VISIBLE RESULT SET
-- ============================================================================
select retired_vocabulary_intent, count(*) as rows
from public.quiz_questions group by 1 order by 1;
-- EXPECT: one row - none, and the full item count.
--
-- NOTHING IS EXEMPTED BY THIS MIGRATION. Every exemption is a later, deliberate
-- act on a named question_group_id, after a human has read the item.
