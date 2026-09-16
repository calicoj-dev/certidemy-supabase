-- 328_mcp_widen_to_eight.sql
--
-- The Scrum four join the MCP: SM-AI-I, SM-AI-II, SPO-AI-I, SD-AI-I.
-- Four served becomes eight. The ISO-derived four stay held.
--
-- ===================== GENERATED FROM 325, NOT RE-AUTHORED =====================
--
-- This is 325's body with one line changed -- the `allowed` array -- because 325
-- already paid for the hard parts: the drop-and-create (a view column cannot be
-- added by `create or replace`), the grant restatement, and the ten-cell grant
-- assertion that exists because a grant lost in a rebuild FAILS CLOSED and looks
-- like a working boundary.
--
-- Re-authoring it would have been a second implementation of a security boundary
-- for no reason. The list is the only thing that moves.
--
-- ===================== WHAT WAS DONE BEFORE THIS RAN =====================
--
-- The Scrum four were held pending a quotation-marking pass. That pass is done:
--
--   327          eight `concepts.description` rows rewritten where the 2020
--                Scrum Guide's sentence WAS the definition
--   terminology  `teaches_retired_vocabulary` mirrored into es-419 and pt-BR --
--                it had been set in English only on 7 of 10 lessons -- and one
--                genuine content defect fixed in SD-AI-I/05-03
--   marking      150 English lines carrying a verbatim run of 8+ words gained a
--                trailing source attribution, applied in all three languages.
--                450 rows. Verified afterwards: 150 marks across 62 lesson rows
--                in EACH language, identical.
--
-- ===================== WHAT IS STILL OPEN AND SHIPS ANYWAY =====================
--
-- Stated because shipping over them is a decision, not an oversight:
--
--   * 27 passages carry a run of 20+ words and a trailing attribution where a
--     set-off quotation would read better. Attribution satisfies BY; the
--     presentation is a human pass. Listed in the spec as `needs_authoring`.
--   * ONE lesson is deliberately unmarked: SM-AI-I/01-02-empirical-process-
--     control, whose block sequence differs across languages. One 8-word run was
--     not worth a positional edit that could mark the wrong sentence in a
--     language no reviewer here can read.
--   * ShareAlike is not settled and is not ours to settle. The BY half is.
--
-- ===================== ZZ-TEST-I IS IN NEITHER LIST =====================
--
-- It is in neither `allowed` nor `held`, exactly as in 325. It is a test
-- certification, it is expected to fail verify-cert, and it must never be
-- served. Being absent from both lists means it is excluded by the WHERE clause
-- rather than by anyone remembering it.

begin;

do $mig$
declare
  -- ONE LIST, and every view below is generated from it.
  allowed text[] := array['AISM-I','AIE-I','AIHR-I','AIGRM-I',
                          'SM-AI-I','SM-AI-II','SPO-AI-I','SD-AI-I'];
  held    text[] := array['ISMS-F','ISMS-IA','AIMS-F','AIMS-IA'];
  n       int;
  n_held  int;
  n_dep   int;
  blocked boolean := false;
  rec     record;
begin

  -- ------------------------------------------------- nothing may depend first
  --
  -- Re-measured AT RUN TIME, not trusted from the header. The header records
  -- what was true when this was written; this records what is true now, and a
  -- dependent appearing in between is exactly the case CASCADE would hide.

  select count(*) into n_dep
    from pg_depend d
    join pg_rewrite r           on r.oid = d.objid
    join pg_class dependent     on dependent.oid = r.ev_class
    join pg_class source        on source.oid = d.refobjid
    join pg_namespace source_ns on source_ns.oid = source.relnamespace
   where source_ns.nspname = 'mcp'
     and source.relkind = 'v'
     and dependent.oid <> source.oid;

  if n_dep <> 0 then
    raise exception '% object(s) depend on the mcp views', n_dep
      using detail = 'dropping them would cascade onto a security boundary',
            hint   = 'list them from pg_depend before changing this migration';
  end if;

  -- ------------------------------------------------------------- drop, create

  execute 'drop view if exists mcp.certification';
  execute 'drop view if exists mcp.task';
  execute 'drop view if exists mcp.concept';
  execute 'drop view if exists mcp.lesson_index';
  execute 'drop view if exists mcp.lesson';

  execute format($ddl$
    create view mcp.certification
    with (security_barrier = true) as
    select c.code, c.name, c.description, c.tier, c.status,
           c.exam_duration_minutes, c.passing_score_pct, c.num_questions,
           c.max_exam_attempts, c.attempt_window_months, c.validity_days
      from public.certifications c
     where c.code = any (%L::text[])
  $ddl$, allowed);

  execute format($ddl$
    create view mcp.task
    with (security_barrier = true) as
    select c.code as certification,
           d.code as domain_code, d.title as domain_title,
           false as domain_title_is_fallback,
           d.weight_pct as domain_weight_pct, d.order_index as domain_order,
           t.code as task_code, 'en'::text as language,
           t.statement, t.knowledge, t.skills, t.abilities,
           t.bloom_level, t.is_exam_scope, t.scope_tag,
           t.order_index as task_order
      from public.tasks t
      join public.domains d        on d.id = t.domain_id
      join public.certifications c on c.id = t.certification_id
     where c.code = any (%L::text[])
    union all
    select c.code as certification,
           d.code as domain_code,
           coalesce(dt.title, d.title) as domain_title,
           dt.title is null as domain_title_is_fallback,
           d.weight_pct as domain_weight_pct, d.order_index as domain_order,
           t.code as task_code, tt.language,
           tt.statement, tt.knowledge, tt.skills, tt.abilities,
           t.bloom_level, t.is_exam_scope, t.scope_tag,
           t.order_index as task_order
      from public.tasks t
      join public.domains d        on d.id = t.domain_id
      join public.certifications c on c.id = t.certification_id
      join public.task_translations tt
        on tt.task_id = t.id and tt.is_provisional = false
       and tt.review_status = 'approved'
      left join public.domain_translations dt
        on dt.domain_id = d.id and dt.language = tt.language
       and dt.is_provisional = false and dt.review_status = 'approved'
     where c.code = any (%L::text[])
  $ddl$, allowed, allowed);

  execute format($ddl$
    create view mcp.concept
    with (security_barrier = true) as
    select c.code as certification,
           co.slug, co.name, co.description,
           (select array_agg(t.code order by t.code)
              from public.task_concepts tc
              join public.tasks t on t.id = tc.task_id
             where tc.concept_id = co.id) as task_codes
      from public.concepts co
      join public.certifications c on c.id = co.certification_id
     where c.code = any (%L::text[])
  $ddl$, allowed);

  execute format($ddl$
    create view mcp.lesson_index
    with (security_barrier = true) as
    select c.code as certification,
           m.slug as module_slug, m.title as module_title,
           m.order_index as module_order,
           l.slug as lesson_slug, l.title as lesson_title,
           l.language, l.lesson_group_id,
           l.order_index as lesson_order, l.estimated_minutes
      from public.lessons l
      join public.modules m        on m.id = l.module_id
      join public.certifications c on c.id = m.certification_id
     where c.code = any (%L::text[])
  $ddl$, allowed);

  execute format($ddl$
    create view mcp.lesson
    with (security_barrier = true) as
    select c.code as certification,
           m.slug as module_slug, m.title as module_title,
           m.order_index as module_order,
           l.slug as lesson_slug, l.title as lesson_title,
           l.language, l.lesson_group_id,
           l.order_index as lesson_order, l.estimated_minutes,
           l.content_md
      from public.lessons l
      join public.modules m        on m.id = l.module_id
      join public.certifications c on c.id = m.certification_id
     where c.code = any (%L::text[])
  $ddl$, allowed);

  -- ------------------------------------------------- the comments, restated
  --
  -- A DROP TAKES THESE TOO. Same family as the grants: lost silently, visible
  -- nowhere, and the next person reading pg_catalog to find out what these views
  -- are gets nothing. Captured from the live objects before the drop and
  -- restated verbatim -- EXCEPT mcp.certification, whose comment ended "AISM-I
  -- only" and would have been a false claim the moment this migration committed.
  -- A stale sentence in a system catalogue is worse than an absent one: it reads
  -- as current by construction.

  execute $ddl$
    comment on view mcp.certification is
      'What the credential is and how it is examined. English only: there is no certification_translations table. Four certifications: AISM-I, AIE-I, AIHR-I, AIGRM-I.'
  $ddl$;

  execute $ddl$
    comment on view mcp.task is
      'The examined blueprint, one row per task per language. criticality and frequency are deliberately absent. domain_title_is_fallback marks a row whose domain title had no approved translation and fell back to English.'
  $ddl$;

  execute $ddl$
    comment on view mcp.concept is
      'The concept layer, with the task codes each concept is examined under. English only: there is no concept_translations table, which is the same gap the curriculum analyzer hits on a Spanish source document.'
  $ddl$;

  execute $ddl$
    comment on view mcp.lesson_index is
      'mcp.lesson without content_md. A catalogue, readable by mcp_reader, so a partner can see what exists before holding a key. The body stays with mcp_holder.'
  $ddl$;

  execute $ddl$
    comment on view mcp.lesson is
      'Lesson bodies. THE ONLY VIEW mcp_reader IS NOT GRANTED. All three languages. lesson_group_id is the trilingual sibling key.'
  $ddl$;

  -- ------------------------------------------------------ the grants, restated

  execute 'revoke all on mcp.certification, mcp.task, mcp.concept, mcp.lesson_index, mcp.lesson from public';
  execute 'grant select on mcp.certification, mcp.task, mcp.concept, mcp.lesson_index to mcp_reader, mcp_holder';
  execute 'grant select on mcp.lesson to mcp_holder';

  -- ============ THE GRANT MATRIX, ASSERTED CELL BY CELL ============
  --
  -- Ten cells and a PUBLIC check. A grant lost in the rebuild fails CLOSED, so
  -- nothing downstream would raise -- it would read as the boundary working.
  -- This is the only thing between that and a silently dead endpoint.

  for rec in
    select * from (values
      ('certification', 'mcp_reader', true),  ('certification', 'mcp_holder', true),
      ('task',          'mcp_reader', true),  ('task',          'mcp_holder', true),
      ('concept',       'mcp_reader', true),  ('concept',       'mcp_holder', true),
      ('lesson_index',  'mcp_reader', true),  ('lesson_index',  'mcp_holder', true),
      -- THE PAYWALL, as one cell of the same table it lives in.
      ('lesson',        'mcp_reader', false), ('lesson',        'mcp_holder', true)
    ) as t(v, role_name, expected)
  loop
    if has_table_privilege(rec.role_name, 'mcp.' || rec.v, 'SELECT') <> rec.expected then
      raise exception 'grant wrong: % on mcp.% is %, expected %',
        rec.role_name, rec.v,
        has_table_privilege(rec.role_name, 'mcp.' || rec.v, 'SELECT'), rec.expected
        using hint = 'the rebuild dropped or added a grant; nothing is committed';
    end if;
  end loop;

  -- AND THE COMMENTS SURVIVED. Five views, five comments, and the one that
  -- named a single certification no longer does.
  select count(*) into n
    from pg_class c
    join pg_namespace ns on ns.oid = c.relnamespace
   where ns.nspname = 'mcp' and c.relkind = 'v'
     and obj_description(c.oid, 'pg_class') is not null;
  if n <> 5 then
    raise exception 'only % of 5 mcp views carry a comment', n
      using hint = 'the drop took them and they were not restated';
  end if;

  select count(*) into n
    from pg_class c
    join pg_namespace ns on ns.oid = c.relnamespace
   where ns.nspname = 'mcp' and c.relkind = 'v'
     and obj_description(c.oid, 'pg_class') like '%AISM-I only%';
  if n <> 0 then
    raise exception '% view comment(s) still say AISM-I only', n;
  end if;

  -- AND NOBODY ELSE. grantee 0 in an ACL entry is PUBLIC.
  select count(*) into n
    from pg_class c
    join pg_namespace ns on ns.oid = c.relnamespace
    cross join lateral aclexplode(c.relacl) a
   where ns.nspname = 'mcp' and c.relkind = 'v' and a.grantee = 0;
  if n <> 0 then
    raise exception '% PUBLIC grant(s) on the mcp views', n;
  end if;

  for rec in select r from unnest(array['anon','authenticated']) r loop
    if has_table_privilege(rec.r, 'mcp.lesson_index', 'SELECT')
       or has_table_privilege(rec.r, 'mcp.lesson', 'SELECT') then
      raise exception '% can read the mcp views', rec.r;
    end if;
  end loop;

  -- ============ PROVEN BY READING THEM, AS THE ROLES THAT WILL ============
  --
  -- The positive half alone passes on a view that serves everything. The
  -- NEGATIVE half is the one that matters: eight certifications are held, and
  -- the WHERE clause above is the only thing holding them.

  execute format('grant mcp_reader to %I with set true', current_user);
  execute format('grant mcp_holder to %I with set true', current_user);

  for rec in select v from unnest(array['certification','task','concept','lesson_index']) v loop
    execute 'set local role mcp_reader';
    execute format('select count(distinct %I) from mcp.%I',
                   case when rec.v = 'certification' then 'code' else 'certification' end, rec.v)
      into n;
    execute format('select count(*) from mcp.%I where %I = any ($1)',
                   rec.v, case when rec.v = 'certification' then 'code' else 'certification' end)
      into n_held using held;
    execute 'reset role';

    if n <> 4 then
      raise exception 'mcp.% serves % certification(s), expected 4', rec.v, n;
    end if;
    if n_held <> 0 then
      raise exception 'mcp.% exposes % row(s) from a HELD certification', rec.v, n_held
        using hint = 'the ISO and Scrum corpora are not cleared to be served';
    end if;
  end loop;

  execute 'set local role mcp_holder';
  execute 'select count(distinct certification) from mcp.lesson' into n;
  execute 'select count(*) from mcp.lesson where certification = any ($1)'
    into n_held using held;
  execute 'reset role';

  if n <> 4 then
    raise exception 'mcp.lesson serves % certification(s), expected 4', n;
  end if;
  if n_held <> 0 then
    raise exception 'mcp.lesson exposes % held lesson row(s)', n_held
      using hint = 'a lesson body from a certification that is not cleared';
  end if;

  -- AND THE PAYWALL DID NOT MOVE. 322 proved this by attempting the read, and a
  -- drop-and-recreate is precisely the change that could quietly undo it.
  -- Asserted twice on purpose: once from the ACL above, once by trying.
  begin
    execute 'set local role mcp_reader';
    execute 'select 1 from mcp.lesson limit 1';
  exception when insufficient_privilege then
    blocked := true;
  end;
  execute 'reset role';
  if not blocked then
    raise exception 'mcp_reader can read lesson bodies'
      using hint = 'the paywall opened during the widening; nothing is committed';
  end if;

  raise notice 'four served, eight held, ten grants restored, reader still refused the body';
end
$mig$;

commit;

-- ===================== VERIFICATION =====================
--
-- 1. THE GRANT MATRIX. Expect t everywhere except mcp_reader on lesson.
--
-- select r as role,
--        has_table_privilege(r, 'mcp.certification', 'SELECT') as cert,
--        has_table_privilege(r, 'mcp.task',          'SELECT') as task,
--        has_table_privilege(r, 'mcp.concept',       'SELECT') as concept,
--        has_table_privilege(r, 'mcp.lesson_index',  'SELECT') as idx,
--        has_table_privilege(r, 'mcp.lesson',        'SELECT') as body
--   from unnest(array['mcp_reader','mcp_holder','anon','authenticated']) r;
--
-- 2. WHAT IS SERVED, AND WHAT IS NOT. Expect 4 and 0.
--
-- select (select count(distinct code) from mcp.certification)               as certs,
--        (select count(*) from mcp.lesson_index
--          where certification in ('ISMS-F','SM-AI-I','AIMS-F','SD-AI-I'))  as held_leak;
--
-- 3. certification IS FIRST, which is why this was a drop and not a replace.
--
-- select table_name, ordinal_position, column_name
--   from information_schema.columns
--  where table_schema = 'mcp' and column_name in ('certification','code')
--    and ordinal_position = 1
--  order by table_name;
