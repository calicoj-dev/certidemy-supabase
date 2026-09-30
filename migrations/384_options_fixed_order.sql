-- 384_options_fixed_order.sql
--
-- A PER-ITEM "DO NOT REORDER MY OPTIONS" MARKER.
--
-- Ruled PROMPT-95 addendum. The delivery shuffle (functions/_shared/item-rules/option-order.mjs) presents an
-- item's options in a per-attempt order. Some items cannot survive that: "All of the above", "None of the
-- above", "Both A and B", an option that names another option by letter, and an ordered scale such as
-- 30 / 60 / 90 days or monthly / quarterly / annually.
--
-- ============ THE CENSUS RAN FIRST, AND IT FOUND ZERO ============
--
-- scripts/census-shuffle-hostile-items.mjs, over 27,732 live rows across all twelve certifications in en,
-- es-419 and pt-BR: ZERO items in any of the five classes. Corroborated three ways and explained once:
--
--   11 positive and negative controls pass, so the detector can fire
--   a crude substring instrument found 145 apparent hits and ALL were false positives -- most because the
--     word "adoption" contains "option a"
--   a deliberately loose scale probe found 3 candidates, which are one ISMS-F item in three languages whose
--     options are compound claims ("93 controls across five themes") rather than points on a scale
--   and the reason is in our own item contract: functions/_shared/item-rules/item-pipeline.mjs:373 tells the
--     generator 'no "all/none of the above"'
--
-- So this column exists for items nobody has written yet, and it is expected to stay false.
--
-- ============ NOTHING IS MARKED BY THIS MIGRATION, AND NOTHING MARKS ITSELF ============
--
-- The director ruled: "Don't write a detector that marks items on its own until I've seen the count." So the
-- column is added, the delivery path honours it, and every row is false. There is no trigger, no backfill and
-- no detector wired to it. A later ruling can turn the census into a writer.
--
-- ============ DEPLOY ORDER: THIS MIGRATION FIRST, THEN THE FUNCTIONS ============
--
-- CLAUDE.md records both failure directions for a schema change and its readers. Here they are asymmetric:
--
--   migration first   the column exists and nothing reads it. Silent and harmless.
--   function first    the function SELECTs a column that does not exist and every exam request 400s. Loud,
--                     total, and impossible to mistake for data.
--
-- The loud one is the safe one, but there is no reason to take either: this runs before the functions are
-- deployed, and the functions are not deployed until the director has read their diff.
--
-- WRITERS OF public.quiz_questions, so a NOT NULL column cannot break one of them. Grepped
-- `from("quiz_questions")` and `from('quiz_questions')` across BOTH repos:
--
--   supabase/functions/generate-practice-questions/index.ts   inserts practice items -- DEFAULT false applies
--   supabase/functions/score-mock-exam/index.ts               reads only; no insert
--   supabase/functions/submit-quiz-answer/index.ts            reads only
--   supabase/scripts/gen-grounded-items.mjs                   inserts grounded items -- DEFAULT false applies
--   supabase/scripts/insert-pilot-drafts.mjs                  inserts pilot items -- DEFAULT false applies
--   supabase/scripts/*retranslate*/*apply-queue-edits*        UPDATE text columns only, never the option set
--   certidemy-web/scripts/*                                   no insert into quiz_questions
--
-- Every writer is covered by the DEFAULT, and none of them names the column, so none of them breaks. The
-- column is NOT NULL because a three-state "maybe reorder" is not a thing the delivery path could act on.

begin;

alter table public.quiz_questions
  add column if not exists options_fixed_order boolean not null default false;

comment on column public.quiz_questions.options_fixed_order is
  'TRUE means the delivery path must present this item''s options in stored order. For items whose options '
  'cannot survive reordering: "all/none of the above", "both A and B", an option naming another option by '
  'letter, or an ordered scale (30/60/90 days, monthly/quarterly/annually). Ruled PROMPT-95 addendum. Set by '
  'a human, never by a detector: the census over 27,732 live rows found ZERO such items, and the director '
  'ruled that no detector marks items on its own until that count has been reviewed.';

-- ============ POST-CONDITIONS: A PROPERTY, AND BOTH DIRECTIONS ============
--
-- The column exists, it is NOT NULL, its default is false, and EVERY EXISTING ROW IS false. The last is the
-- one worth asserting: this migration's whole claim is that it marks nothing, and a count of marked rows is
-- the only thing that can show it. A literal row count is deliberately NOT asserted -- that is the defect
-- CLAUDE.md records four times over, and the property here is "none marked", not "n rows".
do $$
declare
  n_marked bigint;
  is_nullable text;
  dflt text;
begin
  select count(*) into n_marked
    from public.quiz_questions where options_fixed_order is true;
  if n_marked <> 0 then
    raise exception 'options_fixed_order is true on % row(s); this migration marks nothing', n_marked
      using hint = 'Something set the flag. Find the writer before continuing.';
  end if;

  select c.is_nullable, c.column_default into is_nullable, dflt
    from information_schema.columns c
   where c.table_schema = 'public' and c.table_name = 'quiz_questions'
     and c.column_name = 'options_fixed_order';
  if is_nullable is null then
    raise exception 'options_fixed_order was not created';
  end if;
  if is_nullable <> 'NO' then
    raise exception 'options_fixed_order is nullable; a three-state marker is not actionable';
  end if;
  if dflt is null or dflt not like 'false%' then
    raise exception 'options_fixed_order default is %, expected false', coalesce(dflt, '(none)');
  end if;

  raise notice 'options_fixed_order: NOT NULL, default false, 0 row(s) marked';
end $$;

commit;

-- ============ FINGERPRINT, for scripts/check-migration-state.mjs ============
-- probe: select count(*) from public.quiz_questions where options_fixed_order is true;
-- expect: the column is selectable, and the count is 0 until a human marks an item.
-- A NON-ZERO count is not a failure -- it means somebody has marked an item, which is the column working.
-- What would be a failure is the column being absent, or a detector having marked rows nobody ruled on.
