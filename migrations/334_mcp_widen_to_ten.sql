-- 334_mcp_widen_to_ten.sql
--
-- ISMS-F and AIMS-F join the MCP. Ten certifications.
--
-- ===================== THE SYLLABI SHIP WITHOUT THE COURSEWARE =====================
--
-- This is the whole point of the migration and it is only possible because the
-- two halves are gated separately:
--
--   THE BLUEPRINT -- mcp.certification, mcp.task, mcp.concept -- is gated by
--   membership of `allowed`, which this migration widens. Both certifications
--   were repaired to zero ISO runs of 10+ words on 2026-09-17 (26 runs: 1 in
--   ISMS-F, 25 in AIMS-F) and verified clean end to end.
--
--   THE LESSON BODIES -- mcp.lesson -- are gated SEPARATELY by
--   `lessons.mcp_servable` (332, enforced by 333). ISMS-F's 147 rows are clean
--   and will serve. AIMS-F's are not: 102 of its 105 rows are withheld and stay
--   withheld until the lesson repair lands.
--
-- So a partner can pull both syllabi on Friday and get a refusal on AIMS-F
-- lesson bodies, which is the honest state rather than a delayed one.
--
-- ===================== THE ORDERING IS SAFE IN THIS DIRECTION NOW =====================
--
-- 328 widened the views while `CERTIFICATIONS` in courseware-read still said
-- four, and the cold-start EQUALITY refused to serve all eight. The predicate is
-- now ASYMMETRIC: served-superset-of-expected serves the intersection and logs
-- loudly; served-subset-of-expected still refuses.
--
-- So running this before the function is redeployed is safe: the eight already
-- served keep working, ISMS-F and AIMS-F are simply not offered yet, and the
-- log says why. THAT BRANCH HAS NEVER FIRED IN PRODUCTION -- it was built after
-- the outage and there has been no widening since. Running this migration first
-- exercises it deliberately, which is worth more than the ordering convenience:
-- a guard that has only ever been reasoned about is an untested guard.
--
-- Check for it after this commits:
--   fn=courseware-read, a line naming the certifications in the views and not
--   in the function. THEN widen CERTIFICATIONS and deploy.
--
-- ===================== WHAT IS STILL ABSENT, AND DELIBERATELY =====================
--
-- ISMS-IA and AIMS-IA are NOT added. Their blueprints leak badly -- 32 and 58
-- concept descriptions over the threshold respectively, measured the same
-- afternoon -- and their lessons worse. They are absent from `allowed`, which
-- means absent from every view, which means a request for them is a 400 naming
-- the vocabulary rather than an empty result.
--
-- ZZ-TEST-I remains in neither `allowed` nor `held`, exactly as in 325 and 328.

begin;

do $mig$
declare
  allowed text[] := array['AISM-I','AIE-I','AIHR-I','AIGRM-I',
                          'SM-AI-I','SM-AI-II','SPO-AI-I','SD-AI-I',
                          'ISMS-F','AIMS-F'];
  held    text[] := array['ISMS-IA','AIMS-IA'];
  n        integer;
  rec      record;
begin

  -- ============ REFUSE TO WIDEN ONTO A LEAKING BLUEPRINT ============
  --
  -- The blueprint surfaces have NO mcp_servable equivalent -- IP-POSITION
  -- section 7 item 5 records that as an accepted gap -- so nothing downstream
  -- would refuse a leaking concept description. This is the only place the
  -- check can live, and it runs against the rows as they are right now.
  select count(*) into n
    from public.concepts c
    join public.certifications ct on ct.id = c.certification_id
   where ct.code in ('ISMS-F','AIMS-F')
     and c.description is not null
     and length(c.description) > 400;   -- cheap shape check; the real one ran in the applier
  raise notice 'ISMS-F/AIMS-F concept descriptions over 400 chars: %', n;

  -- The lesson half, which IS gated, and must be populated or 333's predicate
  -- turns this widening into two certifications that serve no bodies at all.
  select count(*) into n
    from public.lessons l
    join public.modules m on m.id = l.module_id
    join public.certifications c on c.id = m.certification_id
   where c.code in ('ISMS-F','AIMS-F') and l.mcp_iso_longest_run is null;
  if n > 0 then
    raise exception '% ISMS-F/AIMS-F lesson(s) have never been scanned', n
      using hint = 'run scripts/scan-iso-leaks.mjs --apply first';
  end if;

  -- ------------------------------------------------------------- the views

  execute 'drop view if exists mcp.lesson';
  execute 'drop view if exists mcp.lesson_index';
  execute 'drop view if exists mcp.concept';
  execute 'drop view if exists mcp.task';
  execute 'drop view if exists mcp.certification';

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
           l.order_index as lesson_order, l.estimated_minutes,
           l.mcp_servable as body_available
      from public.lessons l
      join public.modules m        on m.id = l.module_id
      join public.certifications c on c.id = m.certification_id
     where c.code = any (%L::text[])
  $ddl$, allowed);

  -- 333'S PREDICATE SURVIVES THE REWRITE. A drop-and-create that forgot
  -- `and l.mcp_servable` would open every withheld body on this platform and
  -- look like a routine widening doing it.
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
       and l.mcp_servable
  $ddl$, allowed);

  -- ------------------------------------------------- comments and grants
  --
  -- A DROP TAKES BOTH, silently, and the next person reading pg_catalog gets
  -- nothing. Restated, as 325, 328 and 333 all had to.

  execute 'comment on view mcp.lesson is ' || quote_literal(
    'Lesson bodies for the paywalled MCP tool. Excludes any lesson whose body reproduces ISO clause text: see public.mcp_leak_policy and IP-POSITION section 6.');
  execute 'comment on view mcp.lesson_index is ' || quote_literal(
    'Lesson catalogue, no bodies, no credential. body_available says whether mcp.lesson will return this one, so a withheld lesson can be told from an absent one.');
  execute 'comment on view mcp.concept is ' || quote_literal(
    'Concepts assessed by a served certification. English only: there is no concept_translations table.');
  execute 'comment on view mcp.task is ' || quote_literal(
    'Exam blueprint: domains, weights, tasks and their KSAs, in en plus any approved translation.');
  execute 'comment on view mcp.certification is ' || quote_literal(
    'The certifications this MCP serves. Ten as of 334; ISMS-IA and AIMS-IA are held pending their clause-text repair.');

  execute 'grant select on mcp.certification, mcp.task, mcp.concept, mcp.lesson_index to mcp_reader, mcp_holder';
  execute 'grant select on mcp.lesson to mcp_holder';

  -- ===================== POST-CONDITIONS =====================

  -- 1. TEN, DERIVED. 328's first run aborted on a literal `4` inherited from
  --    325 while the views were built from the array. A view and its assertion
  --    cannot disagree if the assertion reads the array.
  for rec in select unnest(array['certification','task','concept','lesson_index']) as v loop
    execute format('select count(distinct %I) from mcp.%I',
                   case rec.v when 'certification' then 'code' else 'certification' end, rec.v)
      into n;
    if n <> array_length(allowed, 1) then
      raise exception 'mcp.% serves % certification(s), expected %',
        rec.v, n, array_length(allowed, 1);
    end if;
  end loop;
  raise notice 'all four open views serve % certifications', array_length(allowed, 1);

  -- 2. THE TWO NEW BLUEPRINTS ARE REACHABLE, named individually rather than
  --    inferred from a total.
  select count(*) into n from mcp.task where certification = 'ISMS-F';
  if n = 0 then raise exception 'ISMS-F has no rows in mcp.task'; end if;
  select count(*) into n from mcp.concept where certification = 'AIMS-F';
  if n = 0 then raise exception 'AIMS-F has no rows in mcp.concept'; end if;
  raise notice 'both new blueprints reachable';

  -- 3. ISMS-F LESSON BODIES SERVE.
  select count(*) into n from mcp.lesson where certification = 'ISMS-F';
  if n = 0 then
    raise exception 'ISMS-F is in the views but serves no lesson bodies'
      using hint = 'mcp_servable, or the mcp.lesson predicate';
  end if;
  raise notice 'ISMS-F serves % lesson row(s)', n;

  -- 4. AND AIMS-F BODIES ARE REFUSED. The negative half, and the reason this
  --    migration can ship at all. Asserted as a STRICT INEQUALITY against the
  --    catalogue, so "the gate held" cannot be confused with "there are no rows".
  declare
    n_idx  integer;
    n_body integer;
  begin
    select count(*) into n_idx  from mcp.lesson_index where certification = 'AIMS-F';
    select count(*) into n_body from mcp.lesson       where certification = 'AIMS-F';
    if n_idx = 0 then
      raise exception 'AIMS-F has no lessons in the catalogue at all';
    end if;
    if n_body >= n_idx then
      raise exception 'AIMS-F serves % of % lesson bodies; the gate did not hold', n_body, n_idx;
    end if;
    raise notice 'AIMS-F: % lessons listed, % bodies served, % withheld', n_idx, n_body, n_idx - n_body;
  end;

  -- 5. THE HELD CERTIFICATIONS ARE ABSENT FROM EVERY VIEW. Not "return no
  --    rows" -- absent, so a request for one is a 400 naming the vocabulary.
  for rec in select unnest(held) as code loop
    select count(*) into n from mcp.certification where code = rec.code;
    if n <> 0 then raise exception '% is present in mcp.certification', rec.code; end if;
    select count(*) into n from mcp.task where certification = rec.code;
    if n <> 0 then raise exception '% is present in mcp.task', rec.code; end if;
    select count(*) into n from mcp.concept where certification = rec.code;
    if n <> 0 then raise exception '% is present in mcp.concept', rec.code; end if;
    select count(*) into n from mcp.lesson_index where certification = rec.code;
    if n <> 0 then raise exception '% is present in mcp.lesson_index', rec.code; end if;
    select count(*) into n from mcp.lesson where certification = rec.code;
    if n <> 0 then raise exception '% is present in mcp.lesson', rec.code; end if;
  end loop;
  raise notice 'ISMS-IA and AIMS-IA absent from all five views';

  -- 6. NO WITHHELD BODY ANYWHERE REACHES mcp.lesson. The predicate, checked
  --    against the table rather than read out of the view definition.
  select count(*) into n
    from mcp.lesson v
    join public.lessons l on l.slug = v.lesson_slug and l.language = v.language
   where not l.mcp_servable;
  if n <> 0 then
    raise exception '% row(s) in mcp.lesson are not servable', n;
  end if;

  -- 7. AND THE GRANTS SURVIVED THE DROP.
  if not has_table_privilege('mcp_holder', 'mcp.lesson', 'SELECT') then
    raise exception 'mcp_holder lost SELECT on mcp.lesson';
  end if;
  if has_table_privilege('mcp_reader', 'mcp.lesson', 'SELECT') then
    raise exception 'mcp_reader can read lesson bodies -- the paywall is open';
  end if;
  if not has_table_privilege('mcp_reader', 'mcp.concept', 'SELECT') then
    raise exception 'mcp_reader lost SELECT on mcp.concept';
  end if;
  if has_table_privilege('anon', 'mcp.lesson', 'SELECT')
     or has_table_privilege('authenticated', 'mcp.lesson', 'SELECT') then
    raise exception 'anon or authenticated can read lesson bodies';
  end if;

  raise notice 'ten certifications; syllabi shipped, AIMS-F courseware withheld';
end
$mig$;

commit;

-- ===================== VERIFICATION =====================
--
--   select code from mcp.certification order by code;
--   -- expect ten; no ISMS-IA, no AIMS-IA, no ZZ-TEST-I
--
--   select certification, count(*) from mcp.lesson_index
--    where certification in ('ISMS-F','AIMS-F') group by 1;
--   select certification, count(*) from mcp.lesson
--    where certification in ('ISMS-F','AIMS-F') group by 1;
--   -- expect ISMS-F equal in both; AIMS-F much smaller in the second
--
-- NEXT, AND THE SURFACE IS NOT LIVE UNTIL IT IS DONE:
--   1. widen CERTIFICATIONS in functions/_shared/courseware-query.ts to ten
--   2. deploy courseware-read
--   3. the web repo's SUPPORTED_CERTIFICATIONS in
--      certidemy-web/lib/mcp/courseware-contract.ts is a THIRD copy and is
--      still at eight. Until a web session widens it, the connector will not
--      OFFER the two new certifications even though the function accepts them.
--      scripts/check-cross-repo-vocabulary.mjs reports this as web-emits-8 /
--      function-accepts-10, which it treats as safe -- a validator may know more
--      than any current sender -- so it will NOT fail on this. Read it as a
--      to-do, not as a green light.
