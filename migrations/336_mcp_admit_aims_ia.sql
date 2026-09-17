-- 336_mcp_admit_aims_ia.sql
--
-- Move AIMS-IA from `held` to `allowed`. ISMS-IA stays held.
--
-- ============ THE WORK WAS DONE AND THE DOOR WAS STILL SHUT ============
--
-- AIMS-IA's forty lessons were repaired across five modules today and the
-- scanner reads 120 rows, 0 refused, longest run 9 words against a threshold of
-- 10. Every one of those rows carries `mcp_servable = true`.
--
-- NONE OF THEM IS REACHABLE. Every mcp view filters on `c.code = any (allowed)`
-- and AIMS-IA is in `held`, which 334 set and nothing since has changed. The
-- certification is absent from the surface entirely: no certification record,
-- no blueprint, no lesson catalogue, no bodies.
--
-- This was nearly written up as "AIMS-IA now serves completely in English" in a
-- partner-facing readiness note. It was caught by reading 334's array rather
-- than by trusting the scanner, and the two instruments were both telling the
-- truth about different things. `mcp_servable` is a statement about a LESSON's
-- content. `allowed` is a statement about a CERTIFICATION's admission. A lesson
-- can satisfy the first and be invisible under the second, and nothing in this
-- repo compares them -- the leak scanner has no idea what `allowed` contains.
--
-- So this migration's post-conditions assert REACHABILITY, not servability:
-- they count what comes back from the views as mcp_reader and mcp_holder, which
-- is the only question a partner's request actually asks.
--
-- ============ A DROP AND CREATE TAKES EVERY PREDICATE WITH IT ============
--
-- `mcp.lesson` now carries THREE things that were added separately:
--
--   334  membership of `allowed`
--   333  and l.mcp_servable
--   335  and the per-language translation-review predicate
--
-- A rebuild that forgets 333's clause opens every withheld body on the
-- platform. A rebuild that forgets 335's clause serves every unreviewed
-- translation. Both would look like a routine widening doing it, and both are
-- checked below by asserting a REFUSAL, not only an admission.
--
-- 334 warned about exactly this for 333's predicate, one migration before 335
-- added a second one to forget.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  -- Eleven now. ISMS-IA remains held: its 48 blockquoted clause passages need a
  -- display mechanism in the web app, not a rewording, and that is not this.
  allowed text[] := array['AISM-I','AIE-I','AIHR-I','AIGRM-I',
                          'SM-AI-I','SM-AI-II','SPO-AI-I','SD-AI-I',
                          'ISMS-F','AIMS-F','AIMS-IA'];
  held    text[] := array['ISMS-IA'];
  rec     record;
  n       int;
  n_en    int;
  n_ne    int;
begin

  -- ----------------------------------------------- pre-condition
  -- REFUSE TO ADMIT A CERTIFICATION THAT WOULD LEAK. The whole point of the
  -- gate is that admission follows measurement; asserting it here makes the
  -- order impossible to get wrong later.
  select count(*) into n
    from public.lessons l
    join public.modules m        on m.id = l.module_id
    join public.certifications c on c.id = m.certification_id
   where c.code = 'AIMS-IA'
     and not l.mcp_servable;
  if n <> 0 then
    raise exception 'AIMS-IA has % lesson row(s) not servable', n
      using detail = 'Admission follows measurement.',
            hint   = 'Run scripts/scan-iso-leaks.mjs --apply first.';
  end if;

  -- And the other direction: a certification with no scanned rows at all would
  -- pass the check above vacuously.
  select count(*) into n
    from public.lessons l
    join public.modules m        on m.id = l.module_id
    join public.certifications c on c.id = m.certification_id
   where c.code = 'AIMS-IA'
     and l.mcp_scanned_at is not null;
  if n < 100 then
    raise exception 'AIMS-IA has only % scanned lesson row(s)', n
      using detail = 'Expected ~120 across three languages.';
  end if;

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

  -- BOTH EARLIER PREDICATES SURVIVE. 333's mcp_servable and 335's per-language
  -- review gate. Neither is optional and neither is checked by the other.
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
       and (
         l.language = 'en'
         or not l.mcp_translation_review_required
         or exists (
           select 1
             from public.lesson_translation_reviews r
             join public.lessons en
               on en.lesson_group_id = l.lesson_group_id
              and en.language = 'en'
            where r.lesson_id = l.id
              and r.verdict = 'approved'
              and r.en_hash = left(md5(en.content_md), 8)
         )
       )
  $ddl$, allowed);

  -- ------------------------------------------------- comments and grants
  -- A DROP TAKES BOTH, silently. Restated, as 325, 328, 333 and 334 all had to.

  execute 'comment on view mcp.lesson is ' || quote_literal(
    'Lesson bodies for the paywalled MCP tool. Excludes any lesson whose body reproduces ISO clause text, and any translation whose review is absent or stale: see public.mcp_leak_policy, public.lesson_translation_reviews and IP-POSITION section 6.');
  execute 'comment on view mcp.lesson_index is ' || quote_literal(
    'Lesson catalogue, no bodies, no credential. body_available says whether mcp.lesson will return this one, so a withheld lesson can be told from an absent one.');
  execute 'comment on view mcp.concept is ' || quote_literal(
    'Concepts assessed by a served certification. English only: there is no concept_translations table.');
  execute 'comment on view mcp.task is ' || quote_literal(
    'Exam blueprint: domains, weights, tasks and their KSAs, in en plus any approved translation.');
  execute 'comment on view mcp.certification is ' || quote_literal(
    'The certifications this MCP serves. Eleven as of 336; ISMS-IA alone is held, pending a display mechanism for its 48 blockquoted clause passages.');

  execute 'grant select on mcp.certification, mcp.task, mcp.concept, mcp.lesson_index to mcp_reader, mcp_holder';
  execute 'grant select on mcp.lesson to mcp_holder';

  -- ===================== POST-CONDITIONS =====================
  --
  -- THESE ASSERT REACHABILITY, WHICH IS THE PROPERTY THAT WAS WRONG. Counting
  -- `mcp_servable` rows would have passed before this migration existed.

  -- 1. ELEVEN, DERIVED FROM THE ARRAY. A view and its assertion cannot disagree
  --    if the assertion reads the array (328's lesson).
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

  -- 2. AIMS-IA IS REACHABLE, NAMED, not inferred from a total.
  select count(*) into n from mcp.certification where code = 'AIMS-IA';
  if n <> 1 then raise exception 'AIMS-IA absent from mcp.certification'; end if;

  select count(*) into n from mcp.lesson_index where certification = 'AIMS-IA';
  if n < 100 then
    raise exception 'mcp.lesson_index holds only % AIMS-IA row(s)', n;
  end if;

  -- 3. AND ITS BODIES. English serves; non-English does NOT, because the
  --    reviews have not been done. BOTH DIRECTIONS, because a broken 335
  --    predicate would show up only in the second.
  select count(*) filter (where language = 'en'),
         count(*) filter (where language <> 'en')
    into n_en, n_ne
    from mcp.lesson where certification = 'AIMS-IA';
  if n_en < 40 then
    raise exception 'mcp.lesson serves only % AIMS-IA English body/bodies', n_en
      using hint = 'Expected all 40. Check 333 mcp_servable survived the rebuild.';
  end if;
  if n_ne > 2 then
    raise exception 'mcp.lesson serves % unreviewed AIMS-IA translations', n_ne
      using detail = '78 of 80 carry mcp_translation_review_required with no approved review.',
            hint   = 'The 335 per-language predicate did not survive the rebuild.';
  end if;
  raise notice 'AIMS-IA bodies: % English served, % non-English served', n_en, n_ne;

  -- 4. ISMS-IA IS STILL ABSENT ENTIRELY. The negative half: a widening that
  --    admitted both would pass every check above.
  select count(*) into n from mcp.certification where code = any (held);
  if n <> 0 then
    raise exception 'a held certification is reachable in mcp.certification';
  end if;
  select count(*) into n from mcp.lesson_index where certification = any (held);
  if n <> 0 then
    raise exception 'a held certification is reachable in mcp.lesson_index';
  end if;

  -- 5. AND THE PAYWALL STILL HOLDS. mcp_reader must not reach mcp.lesson at
  --    all; the grant above gives it only to mcp_holder. Asserted as the party
  --    the property is about, which is 330's lesson.
  if has_table_privilege('mcp_reader', 'mcp.lesson', 'SELECT') then
    raise exception 'mcp_reader can select mcp.lesson -- the paywall is open';
  end if;
  if not has_table_privilege('mcp_holder', 'mcp.lesson', 'SELECT') then
    raise exception 'mcp_holder cannot select mcp.lesson -- the grant was lost';
  end if;

  raise notice '336 ok: AIMS-IA admitted, ISMS-IA held, paywall intact';
end
$mig$;
