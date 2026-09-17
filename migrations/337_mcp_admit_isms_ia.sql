-- 337_mcp_admit_isms_ia.sql
--
-- Admit ISMS-IA. THERE IS NO HELD SET AFTER THIS.
--
-- ============ WHY 336 HELD IT AND 337 DOES NOT ============
--
-- 336 admitted AIMS-IA and kept ISMS-IA held "pending a display mechanism for
-- its 48 blockquoted clause passages". That mechanism was never built, and it
-- turned out not to be needed: IP-POSITION section 6 was amended the same day
-- to permit clause text that is QUOTED AND ATTRIBUTED, so a marked, attributed
-- blockquote is acceptable output and needs no display change at all.
--
-- What the amendment did NOT do is permit reproduction outside a quotation.
-- ISMS-IA carried 79 such runs in prose, options and lettered bullets, and all
-- 79 were recast across seven batches. Nineteen bare blockquotes -- quoted but
-- NOT attributed, which the amended rule still refuses -- were given their
-- clause address in nine lead-in edits, with no change to the quoted text.
--
-- ISMS-IA now scans at 114 rows, 0 refused, longest run 9 words against a
-- threshold of 10. So do AIMS-F, ISMS-F and AIMS-IA: every ISO-derived
-- certification on the platform measures clean.
--
-- ============ 336's TIP WENT STALE BEFORE THIS FILE WAS WRITTEN ============
--
-- CLAUDE.md said "336 is WRITTEN AND HAS NOT RUN". It had run. Checked here
-- against pg_catalog rather than against the note: mcp.certification's own
-- comment read "Eleven as of 336", and the view returned eleven codes with
-- ISMS-IA absent. That is the recurring failure CLAUDE.md's migration section
-- documents at length, caught the way that section says to catch it.
--
-- ============ THE VIEW BODIES ARE 336's, BYTE FOR BYTE ============
--
-- Lifted from the 336 file rather than retyped, with only the array and the
-- comment changed. mcp.lesson carries THREE predicates added by three
-- migrations -- 334's membership of `allowed`, 333's `mcp_servable`, 335's
-- per-language review gate -- and retyping five view definitions to change one
-- array is exactly how one of them goes missing. A rebuild that dropped 333's
-- clause would open every withheld body on the platform; one that dropped
-- 335's would serve every unreviewed translation. Both are asserted below as
-- REFUSALS, because a positive check passes either way.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  -- Twelve. Every certification that has lessons, and `held` is now empty.
  allowed text[] := array['AISM-I','AIE-I','AIHR-I','AIGRM-I',
                          'SM-AI-I','SM-AI-II','SPO-AI-I','SD-AI-I',
                          'ISMS-F','AIMS-F','AIMS-IA','ISMS-IA'];
  rec     record;
  n       int;
  n_en    int;
  n_ne    int;
begin

  -- ----------------------------------------------- pre-conditions
  -- ADMISSION FOLLOWS MEASUREMENT.
  select count(*) into n
    from public.lessons l
    join public.modules m        on m.id = l.module_id
    join public.certifications c on c.id = m.certification_id
   where c.code = 'ISMS-IA'
     and not l.mcp_servable;
  if n <> 0 then
    raise exception 'ISMS-IA has % lesson row(s) not servable', n
      using detail = 'Admission follows measurement.',
            hint   = 'Run scripts/scan-iso-leaks.mjs --apply first.';
  end if;

  -- The vacuous-pass guard: a certification with nothing scanned satisfies the
  -- check above trivially.
  select count(*) into n
    from public.lessons l
    join public.modules m        on m.id = l.module_id
    join public.certifications c on c.id = m.certification_id
   where c.code = 'ISMS-IA'
     and l.mcp_scanned_at is not null;
  if n < 100 then
    raise exception 'ISMS-IA has only % scanned lesson row(s)', n
      using detail = 'Expected ~114 across three languages.';
  end if;

  -- EVERY admitted certification, not only the new one. A widening must not
  -- ride in on the strength of one certification being clean.
  select count(*) into n
    from public.lessons l
    join public.modules m        on m.id = l.module_id
    join public.certifications c on c.id = m.certification_id
   where c.code = any (allowed)
     and not l.mcp_servable;
  if n <> 0 then
    raise exception '% admitted lesson row(s) are not servable', n
      using hint = 'Something regressed since the last scan.';
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
    'The certifications this MCP serves. TWELVE as of 337 -- all of them. ISMS-IA was the last held and was admitted once its clause text was either attributed (permitted by IP-POSITION section 6 as amended 2026-09-17) or recast. There is no held set any more.');

  execute 'grant select on mcp.certification, mcp.task, mcp.concept, mcp.lesson_index to mcp_reader, mcp_holder';
  execute 'grant select on mcp.lesson to mcp_holder';

  -- ===================== POST-CONDITIONS =====================
  --
  -- REACHABILITY, not servability. Counting `mcp_servable` rows would have
  -- passed before this migration existed -- 336's lesson, applying unchanged.

  -- 1. TWELVE, DERIVED FROM THE ARRAY, so a view and its assertion cannot
  --    disagree (328's lesson).
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

  -- 2. ISMS-IA IS REACHABLE, NAMED rather than inferred from a total.
  select count(*) into n from mcp.certification where code = 'ISMS-IA';
  if n <> 1 then raise exception 'ISMS-IA absent from mcp.certification'; end if;

  select count(*) into n from mcp.lesson_index where certification = 'ISMS-IA';
  if n < 100 then
    raise exception 'mcp.lesson_index holds only % ISMS-IA row(s)', n;
  end if;

  -- 3. ITS BODIES, BOTH DIRECTIONS. English serves; unreviewed translations do
  --    NOT. The second half is the only thing that would notice 335's
  --    per-language predicate going missing in the rebuild.
  select count(*) filter (where language = 'en'),
         count(*) filter (where language <> 'en')
    into n_en, n_ne
    from mcp.lesson where certification = 'ISMS-IA';
  if n_en < 38 then
    raise exception 'mcp.lesson serves only % ISMS-IA English body/bodies', n_en
      using hint = 'Expected all 38. Check 333 mcp_servable survived the rebuild.';
  end if;
  if n_ne > 20 then
    raise exception 'mcp.lesson serves % unreviewed ISMS-IA translations', n_ne
      using detail = '56 of 76 carry mcp_translation_review_required with no approved review.',
            hint   = 'The 335 per-language predicate did not survive the rebuild.';
  end if;
  raise notice 'ISMS-IA bodies: % English served, % non-English served', n_en, n_ne;

  -- 4. NOTHING IS HELD ANY MORE, asserted rather than assumed. Every
  --    certification with lessons is reachable; a new one added later fails
  --    this check rather than appearing silently.
  select count(*) into n
    from public.certifications c
   where c.code <> 'ZZ-TEST-I'
     and exists (select 1 from public.modules m where m.certification_id = c.id)
     and not (c.code = any (allowed));
  if n <> 0 then
    raise exception '% certification(s) with lessons sit outside allowed', n
      using detail = 'ZZ-TEST-I is excluded deliberately; it is a test certification.';
  end if;

  -- 5. AND THE PAYWALL STILL HOLDS, asserted as the party the property is
  --    about, which is 330's lesson.
  if has_table_privilege('mcp_reader', 'mcp.lesson', 'SELECT') then
    raise exception 'mcp_reader can select mcp.lesson -- the paywall is open';
  end if;
  if not has_table_privilege('mcp_holder', 'mcp.lesson', 'SELECT') then
    raise exception 'mcp_holder cannot select mcp.lesson -- the grant was lost';
  end if;

  raise notice '337 ok: ISMS-IA admitted, nothing held, paywall intact';
end
$mig$;
