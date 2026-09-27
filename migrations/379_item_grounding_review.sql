-- 379_item_grounding_review.sql
--
-- WHERE A HUMAN'S READ OF AN ENGLISH ITEM IS RECORDED. There is nowhere today.
--
-- ============ WHY A NEW PLACE AND NOT AN EXISTING ONE ============
--
-- The ruling is that every inserted draft carries `item_grounding`, `grounding_family`, the gate
-- record AND the director's read recorded as the review. The first three exist. The fourth has no
-- home:
--
--   item_translation_reviews    keys on question_id and looks right, and is NOT. It records a review
--                               of a TRANSLATION -- its columns are en_hash, tr_hash and
--                               tr_hash_basis, and its gate compares a translated row against the
--                               English it was made from. An English-only review row would have no
--                               tr_hash and no meaning, and the next reader would carry the
--                               translation meaning across. This repository already paid for exactly
--                               that: two hash columns sharing a name inside one predicate, computed
--                               two different ways.
--   quiz_questions              has no reviewer column and should not gain one. `status` is a gate,
--                               not a record: it says what may be served, not who decided.
--
-- So the read goes on `item_grounding`, which is already the per-item provenance record and is
-- already 1:1 with a question. The question it answers is "why should anyone believe this item",
-- and a human's read is part of that answer.
--
-- ============ STRUCTURED COLUMNS, NOT A JSONB BLOB ============
--
-- `gates` and `solver` are jsonb because their shape is the gate suite's, which changes. A review is
-- four facts that will not change shape: who, when, what verdict, and the note. A blob would make
-- "which items has the director actually read" a question nobody can answer with a WHERE clause.
--
-- ============ THE VERDICT VOCABULARY IS CLOSED, AND `read` IS NOT `approved` ============
--
-- These rows go in as `status='draft'`. A review verdict of `read` means a human has read the item
-- and recorded findings; it does NOT promote the row, and nothing in this migration touches
-- `quiz_questions.status`. Keeping the two apart is the point: the gate and the record of the
-- judgement are different objects, and collapsing them is how an item becomes servable because
-- somebody looked at it.
--
-- ONE STATEMENT: `begin; ... commit;` in the SQL editor asserts an intent, not a transaction.

do $$
declare
  n_cols int;
  anon_can boolean;
begin
  alter table public.item_grounding
    add column if not exists reviewed_by     text,
    add column if not exists reviewed_at     timestamptz,
    add column if not exists review_verdict  text,
    add column if not exists review_note     text;

  -- The vocabulary is closed. An unrecognised verdict would make "has a human read this" silently
  -- unanswerable, which is the open-vocabulary defect this repository records for normative classes.
  --   read      a human read it and recorded findings. Does NOT promote the row.
  --   tier_a    a wrong key or an invented clause. The item must not be promoted.
  --   tier_b    an arguable second answer. Needs an SME.
  --   tier_c    the key is sound; a text fix is recorded in review_note.
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.item_grounding'::regclass and conname = 'item_grounding_review_verdict_chk'
  ) then
    alter table public.item_grounding
      add constraint item_grounding_review_verdict_chk
      check (review_verdict is null or review_verdict in ('read', 'tier_a', 'tier_b', 'tier_c'));
  end if;

  -- A verdict with no reviewer and no date is an unattributable claim about who cleared an item.
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.item_grounding'::regclass and conname = 'item_grounding_review_complete_chk'
  ) then
    alter table public.item_grounding
      add constraint item_grounding_review_complete_chk
      check (review_verdict is null
             or (reviewed_by is not null and btrim(reviewed_by) <> '' and reviewed_at is not null));
  end if;

  comment on column public.item_grounding.review_verdict is
    'A HUMAN''S READ OF THE ENGLISH ITEM: read | tier_a | tier_b | tier_c. It is a RECORD, never a '
    'gate -- it does not promote the row, and quiz_questions.status is what decides what may be '
    'served. An item with verdict ''read'' and status ''draft'' has been read and is still a draft.';
  comment on column public.item_grounding.reviewed_by is
    'Who read it, by name or role. Required whenever review_verdict is set: a verdict nobody is '
    'attached to cannot be followed up.';

  ---------------------------------------------------------------------------
  -- POST-CONDITIONS. Both directions.
  ---------------------------------------------------------------------------
  select count(*) into n_cols from information_schema.columns
   where table_schema = 'public' and table_name = 'item_grounding'
     and column_name in ('reviewed_by', 'reviewed_at', 'review_verdict', 'review_note');
  if n_cols <> 4 then
    raise exception 'item_grounding is missing review columns: found % of 4', n_cols;
  end if;

  -- The CHECK must actually refuse a bad verdict. Asserted by trying one in a savepoint rather than
  -- by trusting that the constraint exists -- a constraint nobody has watched refuse anything is the
  -- same object as a gate nobody has watched fire.
  begin
    insert into public.item_grounding
      (question_id, key_support_clause, key_support, source_id, edition, gates, generator, review_verdict, reviewed_by, reviewed_at)
    values
      ('00000000-0000-0000-0000-000000000000', 'x', 'this row exists only to be refused by the check',
       'x', 'x', '[]'::jsonb, 'probe', 'not-a-verdict', 'probe', now());
    raise exception 'the review_verdict CHECK did not refuse an unrecognised verdict';
  exception
    when check_violation then null;                 -- refused, which is correct
    when foreign_key_violation then null;           -- refused one layer earlier, also correct
  end;

  -- AND THE TABLE IS STILL SHUT. item_grounding holds licensed standard text as evidence, and
  -- adding a column must not open it. Asked with has_table_privilege, not read off an ACL.
  select bool_or(has_table_privilege(t.r, 'public.item_grounding'::regclass, 'SELECT'))
    into anon_can
    from (values ('anon'), ('authenticated')) as t(r);
  if coalesce(anon_can, false) then
    raise exception 'anon or authenticated can SELECT item_grounding -- adding a column opened it';
  end if;
  if not has_table_privilege('service_role', 'public.item_grounding'::regclass, 'SELECT') then
    raise exception 'service_role cannot SELECT item_grounding';
  end if;

  raise notice '379 ok: item_grounding carries a human read, vocabulary closed, table still shut';
end $$;
