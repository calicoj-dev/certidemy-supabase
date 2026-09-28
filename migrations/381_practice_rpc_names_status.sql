-- 381_practice_rpc_names_status.sql
--
-- PROMPT-84 section 4.2: every defaulted column in create_practice_questions'
-- insert is NAMED, so a later change to a column default cannot move generated
-- practice items into the examination.
--
-- ============================================================================
-- WHAT WAS ALREADY NAMED, AND THE ONE THAT WAS NOT
-- ============================================================================
--
-- Measured against the deployed function before writing this, not assumed:
--
--     select prosrc ~ 'status' from pg_proc where proname =
--       'create_practice_questions';          ->  false
--
--   pool           'practice'   already explicit
--   is_exam_scope  false        already explicit
--   visibility     'private'    already explicit -- and 'private' IS the pool's
--                               actual value here, confirmed against the live
--                               rows rather than taken from the ruling's
--                               shorthand: all 170 generated rows read
--                               approved | practice | private | false
--   status         --           NOT NAMED. It takes the column default.
--
-- So exactly one column is inherited, and it is the one that decides whether an
-- item is servable at all. `generate-mock-exam` filters `status = 'approved'`;
-- if the default ever moved, every row this RPC writes would move with it, in
-- either direction, with nothing in this function changing.
--
-- ============================================================================
-- WHY 'approved' AND NOT 'pending_review'
-- ============================================================================
--
-- This migration records the CURRENT behaviour explicitly. It does not change
-- it. All 170 live generated rows are already `approved`, so writing
-- 'pending_review' here would silently split the pool into two populations and
-- change what a learner is served, which is CERTIDEMY-LEARNER-IA section 5.5's
-- decision and not this one's.
--
-- PROMPT-84 section 4 is explicit that option 1 stands for now: leave the RPC
-- inserting approved practice items. The point of this change is that the value
-- is now STATED, so moving it later is a visible edit to a visible literal
-- rather than an invisible consequence of a default.
--
-- ============================================================================
-- THE POST-CONDITION IS A BEFORE/AFTER, NOT A LITERAL
-- ============================================================================
--
-- An assertion about what this migration did NOT touch is a comparison. The
-- count of generated rows and their status distribution are captured before the
-- replace and compared after: this migration changes a FUNCTION BODY and must
-- move no row at all.

begin;

do $mig$
declare
  v_before_rows   bigint;
  v_before_hash   text;
  v_after_rows    bigint;
  v_after_hash    text;
  v_names_status  boolean;
begin
  -- before-state over every row this RPC has ever written
  select count(*),
         md5(string_agg(id::text || '|' || status::text || '|' || pool::text || '|' ||
                        visibility::text || '|' || is_exam_scope::text, E'\n' order by id))
    into v_before_rows, v_before_hash
    from public.quiz_questions
   where item_origin = 'generated';

  raise notice 'before: % generated row(s), checksum %', v_before_rows, coalesce(v_before_hash, '(none)');

  -- the function must currently NOT name status, or this migration is a no-op
  -- aimed at a version that has already moved and should be re-read first.
  select prosrc ~ 'status' into v_names_status
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'create_practice_questions';

  if v_names_status is null then
    raise exception 'create_practice_questions does not exist'
      using hint = 'This migration replaces it; it must be there to replace.';
  end if;
  if v_names_status then
    raise exception 'create_practice_questions already names status'
      using detail = 'The deployed body is not the one this migration was written against.',
            hint   = 'Read prosrc before re-applying.';
  end if;

  -- after-state is captured at the end of the DO block; the function replace
  -- happens in the statement below, so the comparison is made by guard 2.
  perform set_config('certidemy.m381_rows', v_before_rows::text, true);
  perform set_config('certidemy.m381_hash', coalesce(v_before_hash, ''), true);
  v_after_rows := v_before_rows; v_after_hash := v_before_hash;
end
$mig$;

-- ---------------------------------------------------------------------------
-- The function, with status named. Everything else is byte-identical to 301.
-- ---------------------------------------------------------------------------
create or replace function public.create_practice_questions(p_questions jsonb)
returns uuid[]
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  elem     jsonb;
  new_id   uuid;
  out_ids  uuid[] := '{}';
  v_task_id  uuid;
  v_group_id uuid;
  v_origin   text;
begin
  for elem in select * from jsonb_array_elements(p_questions)
  loop
    v_task_id  := nullif(elem->>'task_id', '')::uuid;
    v_group_id := nullif(elem->>'question_group_id', '')::uuid;
    v_origin   := coalesce(nullif(elem->>'item_origin', ''), 'authored');

    insert into public.quiz_questions (
      certification_id,
      task_id,
      question_group_id,
      question_text,
      question_type,
      options,
      correct_answer,
      explanation,
      difficulty,
      bloom_level,
      bank_revision,
      language,
      pool,
      is_exam_scope,
      visibility,
      item_origin,
      status                   -- ADDED 381: was inherited from the column default
    )
    values (
      (elem->>'certification_id')::uuid,
      v_task_id,
      v_group_id,
      elem->>'question_text',
      (elem->>'question_type')::public.question_type,
      elem->'options',
      elem->'correct_answer',
      nullif(elem->>'explanation', ''),
      (elem->>'difficulty')::smallint,
      coalesce(
        nullif(elem->>'bloom_level', '')::public.bloom_level,
        (select t.bloom_level from public.tasks t where t.id = v_task_id)
      ),
      coalesce(nullif(elem->>'bank_revision', ''), 'v2-jta'),
      coalesce(nullif(elem->>'language', ''), 'en'),
      'practice',
      false,
      'private',
      v_origin,
      'approved'               -- STATED, not inherited. See the header.
    )
    returning id into new_id;

    insert into public.question_concepts (question_id, concept_id)
    select new_id, tc.concept_id
    from public.task_concepts tc
    where tc.task_id = v_task_id
    on conflict do nothing;

    out_ids := out_ids || new_id;
  end loop;

  return out_ids;
end;
$fn$;

-- ---------------------------------------------------------------------------
-- POST-CONDITIONS
-- ---------------------------------------------------------------------------
do $post$
declare
  v_rows bigint;
  v_hash text;
  v_was_rows bigint;
  v_was_hash text;
  v_has   boolean;
  v_offenders text;
begin
  v_was_rows := current_setting('certidemy.m381_rows', true)::bigint;
  v_was_hash := nullif(current_setting('certidemy.m381_hash', true), '');

  select count(*),
         md5(string_agg(id::text || '|' || status::text || '|' || pool::text || '|' ||
                        visibility::text || '|' || is_exam_scope::text, E'\n' order by id))
    into v_rows, v_hash
    from public.quiz_questions
   where item_origin = 'generated';

  -- 1. NOT ONE ROW MOVED. A function replace must touch no data.
  if v_rows is distinct from v_was_rows or v_hash is distinct from v_was_hash then
    raise exception 'generated rows moved during a function replace'
      using detail = format('%s rows -> %s rows', v_was_rows, v_rows);
  end if;

  -- 2. the function now names status
  select prosrc ~ 'status' into v_has
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'create_practice_questions';
  if not coalesce(v_has, false) then
    raise exception 'the replaced function still does not name status';
  end if;

  -- 3. BOTH DIRECTIONS: every column the ruling names is present in the body.
  --    A body naming status and having quietly lost pool would pass check 2.
  select string_agg(c, ', ') into v_offenders
    from unnest(array['pool', 'is_exam_scope', 'visibility', 'item_origin', 'status']) as c
   where not exists (
     select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'create_practice_questions'
        and p.prosrc ~ c
   );
  if v_offenders is not null then
    raise exception 'the body no longer names: %', v_offenders;
  end if;

  raise notice 'OK: status named, % generated row(s) unchanged, checksum %', v_rows, v_hash;
end
$post$;

commit;
