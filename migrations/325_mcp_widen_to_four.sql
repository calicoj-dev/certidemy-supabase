-- 325_mcp_widen_to_four.sql
--
-- The courseware MCP serves FOUR certifications instead of one:
-- AISM-I, AIE-I, AIHR-I, AIGRM-I.
--
-- ===================== THE BOUNDARY STAYS IN THE DATABASE =====================
--
-- The obvious move is to drop the certification filter from the views and put it
-- in the query builder, where it can take a parameter. THAT TRADES A PROVABLE
-- BOUNDARY FOR AN `if`.
--
-- Eight certifications are NOT served. The four ISO-derived ones (ISMS-F,
-- ISMS-IA, AIMS-F, AIMS-IA) are held pending the clause-text leak detector that
-- IP-POSITION section 6 requires, and the four Scrum ones (SM-AI-I, SM-AI-II,
-- SPO-AI-I, SD-AI-I) are held pending a quotation-marking pass. **Today the
-- thing holding them is this WHERE clause.** An unfiltered view would move that
-- to a predicate in TypeScript, in the repository that is not the gate, where a
-- refactor can invert it and nothing in pg_catalog would disagree.
--
-- So: ONE VIEW PER ALLOWED SET. The views name the four, and the per-request
-- certification is a selection WITHIN a set that is already bounded.
--
-- THE PROPERTY THAT BUYS: if the query builder's certification predicate were
-- dropped, inverted, or passed a null tomorrow, the worst case is a caller
-- receiving another PERMITTED certification's rows. It cannot reach a held one,
-- because the held ones are not in the view. The failure mode degrades from
-- "we published ISO clause text" to "we returned the wrong allowed syllabus".
--
-- ===================== WHY DROP AND NOT CREATE OR REPLACE =====================
--
-- The first version of this migration used `create or replace view` and aborted:
--
--   ERROR: 42P16: cannot change name of view column "domain_code" to
--   "certification"
--
-- CREATE OR REPLACE VIEW can only APPEND columns. It cannot insert, rename or
-- reorder one. The new `certification` column is first in the select list, so it
-- lands on top of whatever was first before.
--
-- Appending it last would have made the migration run. THAT IS THE WRONG FIX:
-- it contorts the shape of five published views around a restriction in the
-- statement used to build them, and `certification` belongs first because every
-- row in these views is now scoped by it. DROP and CREATE instead.
--
-- ===================== DROPPING A VIEW DROPS ITS GRANTS =====================
--
-- And the grants ARE the boundary. mcp_reader has SELECT on four of these views
-- and NOT on mcp.lesson, which is the paywall; that distinction lives in the ACL
-- and nowhere else.
--
-- A grant lost in the rebuild FAILS CLOSED, which is the safe direction and
-- exactly why it is dangerous: an mcp_reader with no grant on mcp.task looks
-- identical to a boundary working. The function's cold-start assertion would not
-- catch it either -- it checks what mcp_reader CANNOT do, not what it must.
--
-- So the grants are restated below AND ASSERTED AFTERWARDS, per role per view,
-- against the state measured before the drop:
--
--   view            mcp_reader   mcp_holder
--   certification   SELECT       SELECT
--   task            SELECT       SELECT
--   concept         SELECT       SELECT
--   lesson_index    SELECT       SELECT
--   lesson          --           SELECT      <- the paywall
--
-- PUBLIC holds nothing on any of them. Read from pg_class.relacl, not from
-- information_schema.role_table_grants, which shows only grants the querying
-- role is party to and reported all five views as ungranted.
--
-- ===================== NO CASCADE, DELIBERATELY =====================
--
-- Checked before writing this, via pg_depend and pg_rewrite: NOTHING depends on
-- any of the five. No view, no materialized view, no rule.
--
-- The DROPs below therefore omit CASCADE, and that is a decision rather than an
-- omission. If a dependent object appears between this being written and being
-- run, the migration ABORTS and someone looks at it. Cascading on a security
-- boundary would silently remove whatever had come to depend on it.
--
-- ===================== THE SET IS MIRRORED AND THE MIRROR IS CHECKED ==========
--
-- This list lives in three places: here, in
-- functions/_shared/courseware-query.ts, and in
-- ../certidemy-web/lib/mcp/courseware-contract.ts. Two languages and a
-- repository boundary, so no shared module is possible.
--
-- THE FUNCTION NOW ASSERTS IT AT COLD START -- it reads `select distinct code
-- from mcp.certification` and refuses to serve if that set differs from its own
-- list. A drift becomes a named refusal on the side that can be tested. The
-- database is the authority; the TypeScript copy exists to produce a 400 naming
-- the vocabulary instead of a silent empty result.
--
-- ===================== THE PAID RESOURCE WIDENS TOO =====================
--
-- mcp.lesson now holds four corpora and `courseware:lessons` is ONE scope, so a
-- key scoped for lessons reads all four. That is a commercial decision and it is
-- recorded here rather than assumed: per-certification scopes
-- (`courseware:lessons:AISM-I`) are an additive change on top of this and do not
-- require it to be redone.

begin;

do $mig$
declare
  -- ONE LIST, and every view below is generated from it.
  allowed text[] := array['AISM-I','AIE-I','AIHR-I','AIGRM-I'];
  held    text[] := array['ISMS-F','ISMS-IA','AIMS-F','AIMS-IA',
                          'SM-AI-I','SM-AI-II','SPO-AI-I','SD-AI-I'];
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
