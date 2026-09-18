-- 342_mcp_module_title_translation.sql
--
-- Join module_translations. The translation was already written and approved.
--
-- ============ WHAT THIS FIXES ============
--
-- `mcp.lesson_index` and `mcp.lesson` both select `m.title as module_title`
-- from public.modules, which is the ENGLISH column, in every language. So
-- list_lessons in es-419 returns a translated `lesson_title` and an English
-- `module_title` IN THE SAME ROW.
--
-- Found in a Spanish demo on 2026-09-17. It is the surface that shows: a deck
-- outline renders module titles, and the agent only avoided it by knowing to
-- substitute domain titles, which ARE translated (mcp.task has carried
-- `coalesce(dt.title, d.title)` since 337).
--
-- ============ THERE IS NO CONTENT WORK HERE ============
--
-- public.module_translations, measured 2026-09-17:
--
--   es-419   58 rows, 0 provisional, 0 blank title, review_status approved on 58
--   pt-BR    58 rows, 0 provisional, 0 blank title, review_status approved on 58
--   modules with no translation row: 0   (58 modules x 2 languages = 116)
--
-- Written 2026-07-08 through 2026-09-12. Complete, approved, and unreachable
-- through the MCP for as long as both views have existed.
--
-- ============ THE PREDICATE IS 337's, NOT A NEW ONE ============
--
-- `is_provisional = false and review_status = 'approved'` is exactly what
-- mcp.task already applies to domain_translations. Reusing it means a module
-- translation cannot reach a partner on looser terms than a domain one.
--
-- `module_title_is_fallback` is added for the same reason 338 added
-- `ksa_withheld`: a caller receiving an English title in a Spanish response
-- must be able to tell "not translated" from "this is the translation". A
-- coalesce alone cannot say which, and the site's version (which has no flag)
-- is the pattern this improves on rather than copies.
--
-- English rows report `false`, not `true`. English is the source, not a
-- fallback from itself, and module_translations holds no 'en' row -- so a bare
-- `mt.title is null` would label every English row a fallback.
--
-- ============ DROP AND CREATE, AND THE GRANTS COME BACK ============
--
-- A view column cannot be inserted (325's lesson), so both views are dropped
-- and recreated. A DROP TAKES THE COMMENT AND THE GRANTS, silently -- 325, 328,
-- 333, 334 and 337 all had to restate them. mcp.lesson goes to mcp_holder ONLY;
-- granting it to mcp_reader would open every paywalled body.
--
-- mcp.lesson's THREE predicates are carried over byte for byte from 337:
-- membership of `allowed`, 333's mcp_servable, and 335's per-language review
-- gate. Retyping them is how one goes missing, and a rebuild that dropped the
-- third would serve every unreviewed translation on the platform.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  -- Twelve, unchanged from 337. `held` is empty.
  allowed text[] := array['AISM-I','AIE-I','AIHR-I','AIGRM-I',
                          'SM-AI-I','SM-AI-II','SPO-AI-I','SD-AI-I',
                          'ISMS-F','AIMS-F','AIMS-IA','ISMS-IA'];
  n        int;
  n_direct int;
  n_view   int;
  n_fb     int;
  n_same   int;
begin

  -- ----------------------------------------------- pre-conditions
  -- THE TRANSLATION MUST ALREADY BE COMPLETE. This migration adds no content,
  -- so if coverage is partial the join silently falls back and the defect
  -- becomes "some module titles are English", which is harder to see than all
  -- of them being English.
  select count(*) into n
    from public.modules m
    join public.certifications c on c.id = m.certification_id
   where c.code = any (allowed)
     and not exists (
       select 1 from public.module_translations mt
        where mt.module_id = m.id
          and mt.language in ('es-419','pt-BR')
          and mt.is_provisional = false
          and mt.review_status = 'approved'
          and btrim(coalesce(mt.title, '')) <> ''
     );
  if n <> 0 then
    raise exception '% module(s) on a served certification have no approved translation', n
      using detail = 'Expected 0: all 58 modules carried both languages on 2026-09-17.',
            hint   = 'This migration adds no content. Translate first.';
  end if;

  -- The vacuous-pass guard: the check above passes trivially if there are no
  -- modules at all.
  select count(*) into n from public.module_translations
   where is_provisional = false and review_status = 'approved';
  if n < 100 then
    raise exception 'module_translations holds only % approved row(s)', n
      using detail = 'Expected 116 (58 modules x 2 languages).';
  end if;

  -- ----------------------------------------------- the views
  execute 'drop view if exists mcp.lesson';
  execute 'drop view if exists mcp.lesson_index';

  execute format($ddl$
    create view mcp.lesson_index
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
           l.mcp_servable as body_available
      from public.lessons l
      join public.modules m        on m.id = l.module_id
      join public.certifications c on c.id = m.certification_id
      left join public.module_translations mt
        on mt.module_id = m.id and mt.language = l.language
       and mt.is_provisional = false and mt.review_status = 'approved'
     where c.code = any (%L::text[])
  $ddl$, allowed);

  -- 337's body, with the same two columns changed and every predicate intact.
  execute format($ddl$
    create view mcp.lesson
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
  execute 'comment on view mcp.lesson is ' || quote_literal(
    'Lesson bodies for the paywalled MCP tool. Excludes any lesson whose body reproduces ISO clause text, and any translation whose review is absent or stale: see public.mcp_leak_policy, public.lesson_translation_reviews and IP-POSITION section 6. module_title is translated where an approved module_translations row exists; module_title_is_fallback says when it is not.');
  execute 'comment on view mcp.lesson_index is ' || quote_literal(
    'Lesson catalogue, no bodies, no credential. body_available says whether mcp.lesson will return this one, so a withheld lesson can be told from an absent one. module_title_is_fallback says whether module_title is a translation or the English original.');

  execute 'grant select on mcp.lesson_index to mcp_reader, mcp_holder';
  execute 'grant select on mcp.lesson to mcp_holder';

  -- ===================== POST-CONDITIONS =====================
  --
  -- AS THE ROLE. 339 asserted this same family of property as a superuser and
  -- took explain_task down in two languages for two hours; 341 was the hotfix.
  -- A view change checked only by its author's own privileges is the exact
  -- defect that file exists to record.

  -- 1. NO FAN-OUT. A left join on a table with one row per (module, language)
  --    must not multiply lessons, and this is the failure that would be
  --    invisible in a spot check: every title would look right and the
  --    catalogue would be double-length. Derived from the base tables rather
  --    than from a remembered number.
  select count(*) into n_direct
    from public.lessons l
    join public.modules m        on m.id = l.module_id
    join public.certifications c on c.id = m.certification_id
   where c.code = any (allowed);
  execute 'set local role mcp_reader';
  select count(*) into n_view from mcp.lesson_index;
  execute 'reset role';
  if n_view <> n_direct then
    raise exception 'mcp.lesson_index returns % row(s) against % lesson row(s)', n_view, n_direct
      using detail = 'The module_translations join fanned out or dropped rows.';
  end if;
  raise notice 'ok: no fan-out, % row(s) both sides', n_view;

  -- 2. POSITIVE HALF. Every non-English row is now translated. Asserted
  --    STRUCTURALLY rather than by quoting a Spanish title: this file is ASCII
  --    only, and a derived assertion cannot be transcribed wrongly.
  --
  --    WHAT IS ROLE-SCOPED AND WHAT IS NOT, deliberately. Reaching the view is
  --    a PRIVILEGE property and must be measured as mcp_reader. Whether a title
  --    equals its English original is a CONTENT property and is measured as the
  --    migration role, because mcp_reader has no grant on public.modules -- by
  --    design -- so joining it inside the role block would raise 42501 and the
  --    check would fail for a reason that has nothing to do with what it tests.
  execute 'set local role mcp_reader';
  select count(*) into n_fb
    from mcp.lesson_index where language <> 'en' and module_title_is_fallback;
  execute 'reset role';
  select count(*) into n_same
    from mcp.lesson_index li
    join public.modules m on m.slug = li.module_slug
   where li.language <> 'en' and li.module_title = m.title;
  if n_fb <> 0 then
    raise exception '% non-English row(s) still fall back to the English module title', n_fb
      using detail = 'Coverage was complete in the pre-condition, so this means the join predicate is wrong.';
  end if;
  if n_same <> 0 then
    raise exception '% non-English row(s) carry a module_title identical to the English one', n_same
      using hint = 'coalesce resolved to m.title, or a translation row duplicates the English.';
  end if;
  raise notice 'ok: 0 fallbacks and 0 English titles on non-English rows';

  -- 3. NEGATIVE HALF, and it is the one a positive check passes without.
  --    English must be untouched: same title, and never labelled a fallback.
  execute 'set local role mcp_reader';
  select count(*) into n_fb
    from mcp.lesson_index where language = 'en' and module_title_is_fallback;
  execute 'reset role';
  select count(*) into n
    from mcp.lesson_index li
    join public.modules m on m.slug = li.module_slug
   where li.language = 'en' and li.module_title <> m.title;
  if n_fb <> 0 then
    raise exception '% English row(s) are labelled a module_title fallback', n_fb
      using detail = 'English is the source, not a fallback from itself.';
  end if;
  if n <> 0 then
    raise exception '% English row(s) no longer read m.title', n;
  end if;
  raise notice 'ok: English rows unchanged, 0 mislabelled';

  -- 4. THE PAYWALL AND THE REVIEW GATE BOTH SURVIVED THE REBUILD. Asserted as
  --    REFUSALS, because a positive check passes either way (337's lesson).
  if has_table_privilege('mcp_reader', 'mcp.lesson', 'SELECT') then
    raise exception 'mcp_reader can select mcp.lesson -- the paywall is open';
  end if;

  execute 'set local role mcp_holder';
  select count(*) into n
    from mcp.lesson
   where language <> 'en'
     and certification = 'ISMS-F';
  execute 'reset role';
  if n <> 92 then
    raise exception 'ISMS-F serves % non-English bod(ies), expected 92', n
      using detail = '49 rows per language, 3 gated per language: (49-3) x 2 = 92.',
            hint   = 'A higher number means 335 review gate was lost in the rebuild.';
  end if;
  raise notice 'ok: review gate intact, ISMS-F serves % of 98 non-English bodies', n;

  raise notice '342 ok: module titles are translated in lesson_index and lesson';
end
$mig$;
