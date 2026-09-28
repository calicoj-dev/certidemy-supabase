-- 382_practice_created_by_and_daily_cap.sql
--
-- PROMPT-84 section 4.3, ruled 2026-09-28: give quiz_questions a nullable
-- `created_by`, have create_practice_questions write it, and build the 60-per-day
-- per-learner cap on it.
--
-- REQUIRES 381. This replaces the same function, so 381 must be in already or its
-- `status` naming would be silently reverted. Asserted below by name.
--
-- ============================================================================
-- WHY THE VALUE COMES FROM THE PAYLOAD AND NOT FROM auth.uid()
-- ============================================================================
--
-- `auth.uid()` is the obvious source and it returns NULL here. Migration 378
-- revoked EXECUTE from `anon` and `authenticated` and granted it to
-- `service_role` alone, and both callers use the service role -- checked in 378
-- against both call sites. A service-role call carries no JWT subject, so
-- `auth.uid()` is null on every real invocation.
--
-- So the learner id is passed IN, per element, the way `item_origin` already is.
-- That means THE CALLER ASSERTS THE IDENTITY, which is the shape CLAUDE.md
-- records against `issue-credential-console` taking `issuer_id` from the request
-- body. It is weaker than a database-verified identity and it is stated rather
-- than hidden:
--
--   `generate-practice-questions` calls `authenticate(req)`, which verifies the
--   learner's JWT, and passes THAT id. The cap is exactly as trustworthy as that
--   one line. The RPC cannot check it, because the RPC cannot see the JWT.
--
-- A stronger design exists -- keep the RPC available to `authenticated` and use
-- `auth.uid()` -- and it is the opposite of what 378 just ruled. Not reopened
-- here.
--
-- ============================================================================
-- NO FOREIGN KEY, DELIBERATELY
-- ============================================================================
--
-- `created_by uuid references auth.users(id) on delete set null` is the reflex
-- and it is wrong twice. Provenance should SURVIVE a learner being deleted --
-- `on delete set null` silently erases the record of who an item was written
-- for -- and a FK to `auth.users` would make the cap's own test unable to use a
-- synthetic id, so the gate could never be watched firing without creating a
-- real account.
--
-- The cost is that a malformed id is accepted and lands in its own bucket. The
-- edge function passes a verified id, so the realistic failure is a caller that
-- passes nothing, and that is handled: a null `created_by` is EXEMPT from the
-- cap rather than sharing one bucket with every other null.
--
-- ============================================================================
-- THE ARITHMETIC IS A FUNCTION, SO IT CAN BE WATCHED WITHOUT WRITING A ROW
-- ============================================================================
--
-- `practice_daily_remaining(uuid)` is a pure count. The cap inside the RPC calls
-- it. That means the boundary can be exercised -- and this migration does
-- exercise it -- without inserting anything, and `scripts/verify-382-cap.mjs`
-- drives the real refusal end to end after this is applied.
--
-- A cap whose refusal nobody has watched is the same object as a count assertion
-- nobody has watched fail.

begin;

-- ---------------------------------------------------------------------------
-- PRE-CONDITIONS
-- ---------------------------------------------------------------------------
do $pre$
declare
  v_rows bigint;
  v_hash text;
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'create_practice_questions'
       and p.prosrc ~ 'status'
  ) then
    raise exception 'migration 381 has not been applied'
      using detail = 'This migration replaces the same function and would revert 381''s status naming.',
            hint   = 'Apply 381 first.';
  end if;

  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'quiz_questions' and column_name = 'created_by'
  ) then
    raise exception 'quiz_questions.created_by already exists'
      using hint = 'Read the live column before re-applying; this migration adds it.';
  end if;

  -- ============ IT MUST NOT REVERT A SECURITY PROPERTY AS A SIDE EFFECT ============
  --
  -- This migration replaces the function, and its body carries no security clause -- so if the
  -- live function were SECURITY DEFINER, applying this would silently turn it back into an
  -- invoker. That is the same defect as the escalation it would be undoing, with the sign
  -- flipped: a security change hidden inside a migration whose subject is a column.
  --
  -- The pre-fix 381 was applied before it was corrected, which is exactly how the database got
  -- into that state. 383 reverts it deliberately, and this refuses until it has.
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'create_practice_questions' and p.prosecdef
  ) then
    raise exception 'create_practice_questions is SECURITY DEFINER'
      using detail = 'The pre-fix 381 is live. This migration would revert that silently.',
            hint   = 'Apply 383 first -- it reverts the security properties on purpose.';
  end if;

  select count(*), md5(string_agg(id::text, E'\n' order by id)) into v_rows, v_hash
    from public.quiz_questions;
  perform set_config('certidemy.m382_rows', v_rows::text, true);
  perform set_config('certidemy.m382_hash', coalesce(v_hash, ''), true);
  raise notice 'before: % quiz_questions row(s)', v_rows;
end
$pre$;

-- ---------------------------------------------------------------------------
-- THE COLUMN
-- ---------------------------------------------------------------------------
alter table public.quiz_questions add column created_by uuid;

comment on column public.quiz_questions.created_by is
  'The learner a generated practice item was written FOR, passed in by '
  'create_practice_questions'' caller from a verified JWT. NULLABLE: authored and '
  'backfilled rows have no learner, and a null row is exempt from the per-day cap. '
  'No FK to auth.users on purpose -- provenance must survive a user deletion, and '
  'on delete set null would erase it silently. See migration 382.';

-- The cap counts by (created_by, created_at). Partial, because every row written
-- before today and every authored row is null and would bloat it for nothing.
create index if not exists quiz_questions_created_by_day_idx
  on public.quiz_questions (created_by, created_at)
  where created_by is not null;

-- ---------------------------------------------------------------------------
-- THE ARITHMETIC
-- ---------------------------------------------------------------------------
create or replace function public.practice_daily_remaining(p_user uuid)
returns integer
language sql
stable
as $rem$
  -- 60 generated practice items per learner per UTC DAY. `current_date` in UTC is
  -- what the ruling says, so the boundary is stated rather than inherited from the
  -- server's timezone: (now() at time zone 'utc')::date.
  select greatest(0, 60 - (
    select count(*)
      from public.quiz_questions q
     where q.created_by = p_user
       and q.item_origin = 'generated'
       and (q.created_at at time zone 'utc')::date = (now() at time zone 'utc')::date
  ))::integer
  where p_user is not null;
$rem$;

comment on function public.practice_daily_remaining(uuid) is
  'How many more generated practice items this learner may have written today, UTC. '
  'Returns NULL for a null learner, which is EXEMPT rather than capped. Migration 382.';

revoke execute on function public.practice_daily_remaining(uuid) from public;
grant  execute on function public.practice_daily_remaining(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- THE FUNCTION: 381's body, plus created_by and the cap
-- ---------------------------------------------------------------------------
create or replace function public.create_practice_questions(p_questions jsonb)
returns uuid[]
language plpgsql
-- NOT security definer and NO pinned search_path, matching the live function.
-- 381's header records why: `create or replace` REPLACES the security properties
-- rather than merging them, so a copied template silently escalates.
as $fn$
declare
  elem     jsonb;
  new_id   uuid;
  out_ids  uuid[] := '{}';
  v_task_id  uuid;
  v_group_id uuid;
  v_origin   text;
  v_creator  uuid;
  v_wanted   integer;
  v_left     integer;
begin
  -- ============ THE CAP IS CHECKED ONCE, BEFORE ANY INSERT ============
  --
  -- Checked per BATCH rather than per row, so a request for 40 items when 30
  -- remain is refused whole instead of writing 30 and failing on the 31st. A
  -- partial write is the worst outcome: the caller sees an error and the learner
  -- has items nobody counted.
  --
  -- Every element of one call carries the same learner in practice; if a batch
  -- mixes learners, each is checked for its own share.
  for v_creator, v_wanted in
    select (elem2->>'created_by')::uuid, count(*)
      from jsonb_array_elements(p_questions) elem2
     where nullif(elem2->>'created_by', '') is not null
     group by 1
  loop
    v_left := public.practice_daily_remaining(v_creator);
    if v_left is not null and v_wanted > v_left then
      raise exception 'practice item daily cap reached'
        using detail = format('%s requested, %s remaining today of 60', v_wanted, v_left),
              hint   = 'Try again after 00:00 UTC. Nothing was written.',
              errcode = 'check_violation';
    end if;
  end loop;

  for elem in select * from jsonb_array_elements(p_questions)
  loop
    v_task_id  := nullif(elem->>'task_id', '')::uuid;
    v_group_id := nullif(elem->>'question_group_id', '')::uuid;
    v_origin   := coalesce(nullif(elem->>'item_origin', ''), 'authored');
    v_creator  := nullif(elem->>'created_by', '')::uuid;

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
      status,
      created_by               -- ADDED 382
    )
    values (
      (elem->>'certification_id')::uuid,
      v_task_id,
      v_group_id,
      elem->>'question_text',
      (elem->>'question_type')::question_type,
      elem->'options',
      elem->'correct_answer',
      nullif(elem->>'explanation', ''),
      (elem->>'difficulty')::smallint,
      coalesce(
        nullif(elem->>'bloom_level', '')::bloom_level,
        (select t.bloom_level from public.tasks t where t.id = v_task_id)
      ),
      coalesce(nullif(elem->>'bank_revision', ''), 'v2-jta'),
      coalesce(nullif(elem->>'language', ''), 'en'),
      'practice',
      false,
      'private',
      v_origin,
      'approved',
      v_creator
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
-- POST-CONDITIONS, AND THE ARITHMETIC IS WATCHED
-- ---------------------------------------------------------------------------
do $post$
declare
  v_rows bigint;
  v_hash text;
  v_was_rows bigint;
  v_was_hash text;
  v_missing text;
  v_fresh integer;
begin
  v_was_rows := current_setting('certidemy.m382_rows', true)::bigint;
  v_was_hash := nullif(current_setting('certidemy.m382_hash', true), '');

  -- 1. NOT ONE ROW ADDED OR REMOVED. This migration adds a column and a function.
  select count(*), md5(string_agg(id::text, E'\n' order by id)) into v_rows, v_hash
    from public.quiz_questions;
  if v_rows is distinct from v_was_rows or v_hash is distinct from v_was_hash then
    raise exception 'the quiz_questions row set changed during a DDL migration'
      using detail = format('%s -> %s', v_was_rows, v_rows);
  end if;

  -- 2. the column exists and is NULLABLE. A NOT NULL column here would need every
  --    writer of quiz_questions named, which is a different migration.
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'quiz_questions'
       and column_name = 'created_by' and data_type = 'uuid' and is_nullable = 'YES'
  ) then
    raise exception 'created_by is missing, not uuid, or NOT NULL';
  end if;

  -- 3. no foreign key was added on it, which the header argues for explicitly
  if exists (
    select 1 from pg_constraint c
     where c.conrelid = 'public.quiz_questions'::regclass and c.contype = 'f'
       and 'created_by' = any (select a.attname from pg_attribute a
                                where a.attrelid = c.conrelid and a.attnum = any (c.conkey))
  ) then
    raise exception 'created_by acquired a foreign key'
      using hint = 'Provenance must survive a user deletion. See the header.';
  end if;

  -- 4. BOTH DIRECTIONS on the body: the new things are present AND nothing 381
  --    named was lost while adding them.
  select string_agg(c, ', ') into v_missing
    from unnest(array['created_by', 'practice_daily_remaining', 'daily cap',
                      'pool', 'is_exam_scope', 'visibility', 'item_origin', 'status']) as c
   where not exists (
     select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'create_practice_questions'
        and p.prosrc ~ c
   );
  if v_missing is not null then
    raise exception 'the replaced body does not name: %', v_missing;
  end if;

  -- 5. still security INVOKER
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'create_practice_questions'
                and p.prosecdef) then
    raise exception 'create_practice_questions became SECURITY DEFINER';
  end if;

  -- 6. THE ARITHMETIC, WATCHED. A learner with no rows today has the full 60, and
  --    a null learner is EXEMPT rather than capped at zero -- those are different
  --    answers and folding them would silently cap every authored insert.
  v_fresh := public.practice_daily_remaining('00000000-0000-0000-0000-000000000000'::uuid);
  if v_fresh is distinct from 60 then
    raise exception 'a learner with no items today has % remaining, expected 60', v_fresh;
  end if;
  if public.practice_daily_remaining(null) is not null then
    raise exception 'a null learner is capped; it must be EXEMPT (null remaining)';
  end if;

  raise notice 'OK: created_by nullable and unconstrained, cap arithmetic 60 for a fresh learner, '
               'null learner exempt, % row(s) unchanged', v_rows;
end
$post$;

commit;

-- ---------------------------------------------------------------------------
-- AFTER APPLYING: watch the refusal fire.
--
--   node --dns-result-order=ipv4first scripts/verify-382-cap.mjs
--
-- It drives a real 61st insert against a synthetic learner id and asserts the
-- refusal, then removes its own rows. A cap nobody has watched refuse is the same
-- object as a gate nobody has watched fire.
-- ---------------------------------------------------------------------------
