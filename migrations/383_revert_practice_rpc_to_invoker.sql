-- 383_revert_practice_rpc_to_invoker.sql
--
-- Revert `create_practice_questions` to SECURITY INVOKER with no pinned
-- search_path. 381's actual subject -- naming `status` -- is KEPT.
--
-- ============================================================================
-- WHY THIS IS A NEW MIGRATION AND NOT AN EDITED 381
-- ============================================================================
--
-- The pre-fix 381 ran. Measured in pg_proc rather than assumed:
--
--   prosecdef        true
--   proconfig        {search_path=""}
--   names status     true          <- 381's real subject landed
--   names created_by false         <- 382 has not run
--   owner            postgres
--
-- 381 was corrected afterwards, and RE-RUNNING THE CORRECTED 381 WOULD REFUSE:
-- its own pre-condition asserts the function does not yet name `status`, and it
-- does now. That refusal is the pre-condition working, not an obstacle to route
-- around -- so the revert gets its own migration.
--
-- This also follows the rule that a read-and-approved artifact is not quietly
-- altered. 381 has run; its file records what ran. Editing it to make a second
-- run possible would leave nobody able to say which version the database got.
--
-- ============================================================================
-- IT IS NOT AN OUTAGE, AND THAT IS WORTH BEING PRECISE ABOUT
-- ============================================================================
--
-- `security definer` + `search_path = ''` is the HARDENED pattern for a definer
-- function, and the live body qualifies every reference -- checked, not assumed:
-- public.quiz_questions, public.tasks, public.question_concepts,
-- public.task_concepts, public.question_type, public.bloom_level. So nothing
-- fails to resolve and `generate-practice-questions` still works.
--
-- What changed is WHO IT RUNS AS. The owner is `postgres`, so the function's
-- writes now carry postgres's privileges and would bypass any future RLS on
-- quiz_questions. Today only `service_role` holds EXECUTE (migration 378) and
-- service_role already has broad table access, so nothing is reachable that was
-- not reachable before -- the exposure is LATENT, not live.
--
-- Latent is not safe, it is unobserved. It is reverted because it was never
-- ruled, and because the next person to read this function would reasonably
-- infer that running as the owner was a decision somebody made.

begin;

-- ---------------------------------------------------------------------------
-- PRE-CONDITIONS
-- ---------------------------------------------------------------------------
do $pre$
declare
  v_rows bigint;
  v_hash text;
  v_secdef boolean;
  v_status boolean;
begin
  select p.prosecdef, (p.prosrc ~ 'status')
    into v_secdef, v_status
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'create_practice_questions';

  if v_secdef is null then
    raise exception 'create_practice_questions does not exist';
  end if;
  if not v_secdef then
    raise exception 'create_practice_questions is already SECURITY INVOKER'
      using detail = 'There is nothing for this migration to revert.',
            hint   = 'Read pg_proc before applying; 383 may already have run.';
  end if;
  if not v_status then
    raise exception 'the live function does not name status'
      using detail = 'This migration keeps 381''s work, so 381 must have run first.',
            hint   = 'Apply the corrected 381 instead -- its pre-condition will pass.';
  end if;

  select count(*), md5(string_agg(id::text || '|' || status::text, E'\n' order by id))
    into v_rows, v_hash
    from public.quiz_questions where item_origin = 'generated';
  perform set_config('certidemy.m383_rows', v_rows::text, true);
  perform set_config('certidemy.m383_hash', coalesce(v_hash, ''), true);
  raise notice 'before: definer=% , % generated row(s)', v_secdef, v_rows;
end
$pre$;

-- ---------------------------------------------------------------------------
-- The same body 381 landed. SECURITY INVOKER, no pinned search_path.
--
-- References stay FULLY QUALIFIED even though the pin is gone. They have to be
-- correct under either setting, and a body that depends on the caller's
-- search_path is the `translation_hash` outage waiting to happen: an INVOKER
-- function is only as reachable as everything its body resolves.
-- ---------------------------------------------------------------------------
create or replace function public.create_practice_questions(p_questions jsonb)
returns uuid[]
language plpgsql
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
      status
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
      'approved'
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

-- 378's grant is restated, because `create or replace` does NOT change grants
-- but a reader should not have to know that to be sure. Asserted below too.
revoke execute on function public.create_practice_questions(jsonb) from public, anon, authenticated;
grant  execute on function public.create_practice_questions(jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- POST-CONDITIONS, BOTH DIRECTIONS
-- ---------------------------------------------------------------------------
do $post$
declare
  v_rows bigint;
  v_hash text;
  v_was_rows bigint;
  v_was_hash text;
  v_missing text;
begin
  v_was_rows := current_setting('certidemy.m383_rows', true)::bigint;
  v_was_hash := nullif(current_setting('certidemy.m383_hash', true), '');

  -- 1. no row moved: this replaces a function body
  select count(*), md5(string_agg(id::text || '|' || status::text, E'\n' order by id))
    into v_rows, v_hash
    from public.quiz_questions where item_origin = 'generated';
  if v_rows is distinct from v_was_rows or v_hash is distinct from v_was_hash then
    raise exception 'generated rows moved during a function replace'
      using detail = format('%s -> %s', v_was_rows, v_rows);
  end if;

  -- 2. the escalation is gone
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'create_practice_questions'
                and p.prosecdef) then
    raise exception 'still SECURITY DEFINER';
  end if;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'create_practice_questions'
                and p.proconfig is not null
                and exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%')) then
    raise exception 'a pinned search_path survives';
  end if;

  -- 3. THE OTHER DIRECTION: 381's work is still there, and nothing else was lost
  select string_agg(c, ', ') into v_missing
    from unnest(array['status', 'pool', 'is_exam_scope', 'visibility', 'item_origin',
                      'public.question_type', 'public.bloom_level']) as c
   where not exists (
     select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'create_practice_questions'
        and p.prosrc like '%' || c || '%'
   );
  if v_missing is not null then
    raise exception 'the reverted body no longer names: %', v_missing;
  end if;

  -- 4. the grant is where 378 put it, in both directions
  if has_function_privilege('anon', 'public.create_practice_questions(jsonb)'::regprocedure, 'EXECUTE')
     or has_function_privilege('authenticated', 'public.create_practice_questions(jsonb)'::regprocedure, 'EXECUTE') then
    raise exception 'anon or authenticated can execute it again -- 378 is undone';
  end if;
  if not has_function_privilege('service_role', 'public.create_practice_questions(jsonb)'::regprocedure, 'EXECUTE') then
    raise exception 'service_role lost EXECUTE -- both callers use it';
  end if;

  raise notice 'OK: invoker, no pinned search_path, status still named, grants intact, % row(s) unchanged',
    v_rows;
end
$post$;

commit;
