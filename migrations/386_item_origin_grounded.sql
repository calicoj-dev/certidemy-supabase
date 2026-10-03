-- 386: allow item_origin = 'grounded'.
--
-- Ruled PROMPT-108 s1. The CHECK read from pg_catalog before this was written:
--   CHECK ((item_origin = ANY (ARRAY['authored'::text, 'generated'::text, 'translated'::text])))
-- The column is `text NOT NULL DEFAULT 'authored'`.
--
-- WHY A FOURTH VALUE RATHER THAN REUSING ONE.
--   'generated'  means machine-written and reviewed by architecture only, and generate-mock-exam
--                excludes it from BOTH modes for that reason.
--   'authored'   would be false: a model wrote these.
--   'grounded'   is machine-written, traced to a clause by code, solved blind twice, and READ BY A
--                HUMAN with the verdict recorded on item_grounding.review_verdict.
-- Invariant 12 (verify-invariants) is what stops 'grounded' becoming a way past the review: every
-- approved 'grounded' row must have an English group member with review_verdict = 'accept'.
--
-- WHO WRITES THIS COLUMN (grepped in both repos, values as written):
--   functions/generate-practice-questions/index.ts:143,341  'generated'
--   scripts/gen-grounded-items.mjs:1936                     'generated' (the draft insert)
--   scripts/insert-pilot-drafts.mjs:320                     'generated'
--   scripts/approve-grounded-items.mjs                      'grounded'  (added PROMPT-108 s5)
--   everything else reads it. The default supplies 'authored'.
--
-- ONE STATEMENT, so the widen and its post-conditions cannot land apart.

do $$
declare
  v_def text;
  v_bad bigint;
  v_elems int;
begin
  alter table public.quiz_questions
    drop constraint if exists quiz_questions_item_origin_check;

  alter table public.quiz_questions
    add constraint quiz_questions_item_origin_check
    check (item_origin = any (array['authored'::text, 'generated'::text, 'translated'::text, 'grounded'::text]));

  -- POST-CONDITION 1: the constraint as the catalogue now reports it still accepts every
  -- pre-existing value. Read back from pg_catalog, not assumed from the text above.
  select pg_get_constraintdef(con.oid) into v_def
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname = 'quiz_questions'
     and con.conname = 'quiz_questions_item_origin_check';

  if v_def is null then
    raise exception 'post-condition 1 failed'
      using detail = 'the item_origin CHECK is absent after the widen',
            hint = 'nothing was committed; the constraint must exist';
  end if;

  if v_def not like '%authored%' or v_def not like '%generated%'
     or v_def not like '%translated%' or v_def not like '%grounded%' then
    raise exception 'post-condition 1 failed'
      using detail = 'a value is missing from the widened CHECK',
            hint = v_def;
  end if;

  -- POST-CONDITION 2, THE OTHER DIRECTION: exactly four values, so the widen did not open the
  -- column to anything. A check that only looks for what it added passes on a CHECK of (true).
  v_elems := array_length(string_to_array(v_def, ''''), 1);
  if v_def like '%bogus%' or v_elems <> 9 then
    raise exception 'post-condition 2 failed'
      using detail = 'the widened CHECK does not enumerate exactly four values',
            hint = v_def;
  end if;

  -- POST-CONDITION 3: no existing row is orphaned by the new predicate.
  select count(*) into v_bad
    from public.quiz_questions
   where item_origin not in ('authored', 'generated', 'translated', 'grounded');
  if v_bad <> 0 then
    raise exception 'post-condition 3 failed'
      using detail = v_bad || ' existing row(s) violate the widened CHECK',
            hint = 'nothing was committed';
  end if;

  raise notice '386 ok: four values accepted, 0 rows orphaned';
end $$;
