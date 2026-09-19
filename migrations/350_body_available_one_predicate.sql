-- 350_body_available_one_predicate.sql
--
-- `body_available` becomes the predicate it claims to describe, named once.
--
-- ============ WHAT IT CLAIMED AND WHAT IT WAS ============
--
-- `mcp.lesson_index.body_available` is documented, in the view's own comment
-- and again in certidemy-web's courseware-contract.ts, as saying "whether
-- mcp.lesson will return this one, so a withheld lesson can be told from an
-- absent one".
--
-- It was `l.mcp_servable`. `mcp.lesson` requires that AND the per-language
-- review gate, so the column described half of the query it names. Measured
-- 2026-09-20: 167 lessons would have been advertised available and refused --
-- AIMS-F 34+34, AIMS-IA 29+25, ISMS-IA 24+21.
--
-- It never reached a partner, because courseware-read's buildQuery names its
-- lesson_index columns and omitted it. So the field that exists to prevent
-- "withheld or absent?" has answered nothing at all, and would have answered
-- wrongly if asked. Both halves are fixed: this one, and the projection in the
-- function deployed alongside it.
--
-- ============ NAMED ONCE, AND THAT IS THE POINT ============
--
-- Spelling the predicate into both views would make them a mirrored pair, and
-- the gate has changed TWICE this week -- 339 put the KSA withholding behind a
-- function, 341 had to make that function SECURITY DEFINER. A pair that must be
-- edited together is a pair that will not be.
--
-- So `public.lesson_body_is_servable(uuid)` holds it, and both views call it.
-- mcp.lesson uses it in its WHERE; mcp.lesson_index projects it. They cannot
-- disagree, because there is nothing to keep in step.
--
-- SECURITY DEFINER, for the reason 341 exists. The views are not
-- security_invoker, so tables they query DIRECTLY are checked as the view
-- owner -- but a function called inside one is not. 339 omitted that and every
-- non-English blueprint read answered 500 until 341. mcp_reader has no grant on
-- public.lessons or public.lesson_translation_reviews, and must not get one.
--
-- EXECUTE is revoked from PUBLIC and granted by name. A definer function anyone
-- may call is a way to read a table they were not granted.
--
-- ============ ASSERTED AGAINST THE QUERY, NOT AGAINST ITSELF ============
--
-- A field that describes a query is checkable against that query and nothing
-- else. The post-condition below compares, for every row, what lesson_index
-- SAYS against what mcp.lesson DOES -- and requires the sample to span both
-- states, because an agreement measured where everything is available proves
-- only that both sides are true.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  allowed text[] := array['AISM-I','AIE-I','AIHR-I','AIGRM-I',
                          'SM-AI-I','SM-AI-II','SPO-AI-I','SD-AI-I',
                          'ISMS-F','AIMS-F','AIMS-IA','ISMS-IA'];
  n_true    int;
  n_false   int;
  n_wrong   int;
  n_total   int;
begin

  -- ------------------------------------------------- the predicate, once
  create or replace function public.lesson_body_is_servable(p_lesson_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = ''
  as $fn$
    select l.mcp_servable
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
      from public.lessons l
     where l.id = p_lesson_id
  $fn$;

  comment on function public.lesson_body_is_servable(uuid) is
    'The one definition of whether mcp.lesson will return a lesson body. mcp.lesson filters on it and mcp.lesson_index projects it as body_available, so the catalogue cannot disagree with the paywall.';

  revoke all on function public.lesson_body_is_servable(uuid) from public;
  grant execute on function public.lesson_body_is_servable(uuid)
    to mcp_reader, mcp_holder, service_role;

  -- ------------------------------------------------- the two views
  -- `create or replace`: no column is added, renamed or retyped, so the grants
  -- and comments survive and do not need restating. body_available keeps its
  -- name, its type and its position; only the expression behind it changes.
  execute format($ddl$
    create or replace view mcp.lesson_index
    with (security_barrier = true) as
    select c.code as certification,
           m.slug as module_slug,
           coalesce(mt.title, m.title) as module_title,
           case when l.language = 'en' then false
                else mt.title is null end as module_title_is_fallback,
           m.order_index as module_order,
           l.slug as lesson_slug, l.title as lesson_title,
           l.language, l.lesson_group_id,
           l.order_index as lesson_order, l.estimated_minutes,
           public.lesson_body_is_servable(l.id) as body_available
      from public.lessons l
      join public.modules m        on m.id = l.module_id
      join public.certifications c on c.id = m.certification_id
      left join public.module_translations mt
        on mt.module_id = m.id and mt.language = l.language
       and mt.is_provisional = false and mt.review_status = 'approved'
     where c.code = any (%L::text[])
  $ddl$, allowed);

  execute format($ddl$
    create or replace view mcp.lesson
    with (security_barrier = true) as
    select c.code as certification,
           m.slug as module_slug,
           coalesce(mt.title, m.title) as module_title,
           case when l.language = 'en' then false
                else mt.title is null end as module_title_is_fallback,
           m.order_index as module_order,
           l.slug as lesson_slug, l.title as lesson_title,
           l.language, l.lesson_group_id,
           l.order_index as lesson_order, l.estimated_minutes,
           l.content_md
      from public.lessons l
      join public.modules m        on m.id = l.module_id
      join public.certifications c on c.id = m.certification_id
      left join public.module_translations mt
        on mt.module_id = m.id and mt.language = l.language
       and mt.is_provisional = false and mt.review_status = 'approved'
     where c.code = any (%L::text[])
       and public.lesson_body_is_servable(l.id)
  $ddl$, allowed);

  -- ===================== POST-CONDITIONS =====================
  --
  -- AS mcp_holder, because it is the only role granted both views, and because
  -- 339 asserted this family of property as a superuser and took explain_task
  -- down in two languages for two hours.

  -- 1. THE SAMPLE SPANS BOTH STATES. An agreement measured where everything is
  --    available proves only that both sides are true, which is the coverage
  --    gap CLAUDE.md records: a check that exercises one variant reports a pass.
  execute 'set local role mcp_holder';
  select count(*) filter (where body_available),
         count(*) filter (where not body_available),
         count(*)
    into n_true, n_false, n_total
    from mcp.lesson_index;
  execute 'reset role';
  if n_true = 0 or n_false = 0 then
    raise exception 'body_available is % everywhere (% rows) -- the comparison below would be vacuous',
      case when n_false = 0 then 'true' else 'false' end, n_total
      using hint = 'Expected roughly 167 withheld across AIMS-F, AIMS-IA and ISMS-IA.';
  end if;
  raise notice 'sample spans both states: % available, % withheld, % total', n_true, n_false, n_total;

  -- 2. WHAT IT SAYS EQUALS WHAT THE OTHER QUERY DOES. Both directions in one
  --    comparison: a row claiming available that mcp.lesson refuses, and a row
  --    claiming withheld that mcp.lesson returns.
  execute 'set local role mcp_holder';
  select count(*) into n_wrong
    from mcp.lesson_index i
    left join mcp.lesson b
      on b.certification = i.certification
     and b.lesson_slug   = i.lesson_slug
     and b.language      = i.language
   where i.body_available <> (b.lesson_slug is not null);
  execute 'reset role';
  if n_wrong <> 0 then
    raise exception '% row(s) where body_available disagrees with whether mcp.lesson returns the body', n_wrong;
  end if;
  raise notice 'ok: body_available agrees with mcp.lesson on all % row(s)', n_total;

  -- 3. NEGATIVE. The paywall did not move. mcp_reader reads the catalogue and
  --    must still not read a body, whatever body_available now says.
  if has_table_privilege('mcp_reader', 'mcp.lesson', 'SELECT') then
    raise exception 'mcp_reader can select mcp.lesson -- the paywall is open';
  end if;
  if not has_table_privilege('mcp_reader', 'mcp.lesson_index', 'SELECT') then
    raise exception 'mcp_reader lost SELECT on mcp.lesson_index';
  end if;

  -- 4. NEGATIVE. mcp_reader can still read the catalogue AS ITSELF, which is
  --    the whole reason the function is SECURITY DEFINER. Without the definer
  --    this raises 42501 and courseware-read answers 500 -- 339's exact failure.
  execute 'set local role mcp_reader';
  select count(*) into n_total from mcp.lesson_index;
  execute 'reset role';
  if n_total < 900 then
    raise exception 'mcp_reader sees only % catalogue row(s) -- the definer change did not take', n_total;
  end if;

  raise notice '350 ok: one predicate, % catalogue row(s) readable by mcp_reader', n_total;
end
$mig$;
