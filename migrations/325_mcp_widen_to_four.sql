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
-- Functions taking a certification would work too and were rejected as more
-- machinery for the same property: a function body is as reviewable as a view
-- definition and no more, and it would need its own grant, its own owner, and
-- its own answer to the RLS question 323 just paid for.
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
-- list. A drift becomes a named refusal on the side that can be tested, instead
-- of a silently narrower or wider service. The database is the authority; the
-- TypeScript copy exists to produce a 400 naming the vocabulary.
--
-- ===================== WHAT CHANGES IN THE ROWS =====================
--
-- Four views gain a `certification` column. They had none -- each was scoped to
-- one code, so there was nothing to say. Callers filter on it now.
--
-- mcp.certification already had `code` and gains nothing but rows.
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
  blocked boolean := false;
  rec     record;
begin

  -- ------------------------------------------------------ mcp.certification

  execute format($ddl$
    create or replace view mcp.certification
    with (security_barrier = true) as
    select code, name, description, tier, status, exam_duration_minutes,
           passing_score_pct, num_questions, max_exam_attempts,
           attempt_window_months, validity_days
      from public.certifications c
     where c.code = any (%L::text[])
  $ddl$, allowed);

  -- -------------------------------------------------------------- mcp.task

  execute format($ddl$
    create or replace view mcp.task
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

  -- ----------------------------------------------------------- mcp.concept

  execute format($ddl$
    create or replace view mcp.concept
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

  -- ------------------------------------------------ mcp.lesson_index, lesson

  execute format($ddl$
    create or replace view mcp.lesson_index
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
    create or replace view mcp.lesson
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

  -- create or replace view does not disturb grants, but they are restated so
  -- this file is a complete statement of who may read what.
  execute 'revoke all on mcp.certification, mcp.task, mcp.concept, mcp.lesson_index, mcp.lesson from public';
  execute 'grant select on mcp.certification, mcp.task, mcp.concept, mcp.lesson_index to mcp_reader, mcp_holder';
  execute 'grant select on mcp.lesson to mcp_holder';

  -- ============ PROVEN BY READING THEM, AS THE ROLES THAT WILL ============
  --
  -- The positive half alone passes on a view that serves everything. The
  -- NEGATIVE half is the one that matters here: eight certifications are held,
  -- and this WHERE clause is the only thing holding them.

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

  -- The paid view, as the role that may read it.
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

  -- AND THE PAYWALL DID NOT MOVE. 322 proved this and a view rebuild is exactly
  -- the kind of change that could quietly undo it.
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

  raise notice 'four served, eight held, reader still refused the body';
end
$mig$;

commit;

-- ===================== VERIFICATION =====================
--
-- 1. WHAT IS SERVED, AND WHAT IS NOT. Expect exactly the four, and 0 held.
--
-- select (select count(distinct code) from mcp.certification)            as certs,
--        (select count(*) from mcp.lesson_index
--          where certification in ('ISMS-F','SM-AI-I','AIMS-F','SD-AI-I')) as held_leak;
--
-- 2. THE COLUMN EXISTS ON ALL FOUR. Expect 4 rows.
--
-- select table_name from information_schema.columns
--  where table_schema = 'mcp' and column_name = 'certification'
--  order by table_name;
--
-- 3. THE SPLIT IS UNCHANGED. Expect mcp_reader f on lesson, t on the rest.
--
-- select r as role,
--        has_table_privilege(r, 'mcp.lesson', 'SELECT')       as body,
--        has_table_privilege(r, 'mcp.lesson_index', 'SELECT') as catalogue
--   from unnest(array['mcp_reader','mcp_holder','anon','authenticated']) r;
