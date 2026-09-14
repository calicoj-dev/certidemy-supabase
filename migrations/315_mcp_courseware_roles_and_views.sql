-- 315_mcp_courseware_roles_and_views.sql
--
-- The courseware MCP pilot: two roles, one schema, four views, AISM-I only.
--
-- ===================== THE BOUNDARY IS A GRANT, NOT A FILTER =====================
--
-- The paywall is "no token, no lesson body". That is expressed here as an ABSENT
-- GRANT, never as a branch in the route:
--
--   mcp_reader  ->  mcp.certification, mcp.task, mcp.concept
--   mcp_holder  ->  those three AND mcp.lesson
--
-- The route connects as one or the other. A bug in the route cannot serve a
-- lesson body to an unauthenticated caller, because the role it is connected as
-- has no privilege on that view. An `if` can be inverted by a refactor; a
-- missing grant fails closed in the database.
--
-- ===================== WHY A SEPARATE SCHEMA =====================
--
-- Every base table stays in public and neither role is granted anything there.
-- The views are the only reachable objects. Putting them in `mcp` also keeps
-- them out of the API surface of anon/authenticated rather than relying on a
-- revoke to hide them.
--
-- ===================== WHY THE VIEWS ARE NOT security_invoker =====================
--
-- These are DEFINER views on purpose, which is the opposite of the usual advice
-- and is the point. With security_invoker the querying role would need
-- privileges on the base tables, and granting those is exactly what this
-- migration exists to avoid. The view's WHERE clause is the policy, so the
-- roles need no access to anything underneath it.
--
-- Consequence, stated so it is not discovered later: a definer view BYPASSES RLS
-- on its base tables. Nothing here may rely on a row policy for its scoping.
-- Every restriction is written into the view body, and `security_barrier` is set
-- so a caller-supplied predicate cannot be evaluated ahead of that body and leak
-- rows the view was written to exclude. PostgREST callers can pass predicates,
-- so this is a live concern rather than a theoretical one.
--
-- ===================== WHAT IS DELIBERATELY NOT PROJECTED =====================
--
--   price_usd, exam_link, exam_blueprint   commercial and internal
--   issuer_id, every *.id, *_id            internal identifiers; `code` and
--                                          `slug` are the stable public keys
--   tasks.criticality, tasks.frequency     DECIDED OUT. Task-level weighting is
--                                          a sharper picture of the blueprint
--                                          than the published domain weights,
--                                          and nothing in "what does this
--                                          credential examine" needs them
--   tasks.notes                            internal authoring notes
--   concepts.match_terms                   matcher vocabulary, not content.
--                                          Empty platform-wide by decision; see
--                                          MATCH-TERMS-DECISION.md
--   lessons.video_url                      hosted asset, out of pilot scope
--   quiz_questions, in any form            sample_items is not in the pilot
--
-- ===================== LANGUAGE, AND AN HONEST LIMIT =====================
--
-- Two of the four views carry all three languages and two cannot:
--
--   mcp.task     en from tasks/domains, es-419 and pt-BR from *_translations
--   mcp.lesson   en, es-419, pt-BR -- 61 lessons each, measured
--   mcp.certification   ENGLISH ONLY. There is no certification_translations
--                       table.
--   mcp.concept         ENGLISH ONLY. There is no concept_translations table.
--
-- The concept layer being English-only IS the es-419 gap in the curriculum
-- analyzer, reached from a different direction: a Spanish partner document has
-- no Spanish concept layer to match against. Recorded here because a reader of
-- these views will otherwise assume the omission is an oversight in the view.
--
-- Translated rows are admitted ONLY when is_provisional = false AND
-- review_status = 'approved'. Every AISM-I translation satisfies both today (6
-- domains and 61 tasks in each of two languages, measured 2026-09-13), so the
-- filter changes nothing now. It is here so that a provisional row written
-- later does not silently begin being served -- the filter is the guarantee,
-- and a guarantee that only holds because the bad case does not yet exist is
-- not a guarantee.
--
-- Where a task translation is approved but its domain translation is not, the
-- domain title falls back to English. That fallback is REPORTED in
-- domain_title_is_fallback rather than left silent, because a language mix a
-- caller cannot detect is the same defect class as a dropped read.
--
-- ===================== IP =====================
--
-- IP-POSITION.md section 6: an MCP returns Certidemy's prose and clause
-- ADDRESSES, never clause TEXT. AISM-I cites no ISO standard at all -- 226
-- concepts, zero citations -- so the address-not-text rule has nothing to bite
-- on here. That is why AISM-I is the pilot. Extending these views to any of the
-- four ISO-derived certifications requires that rule enforced in code first.
--
-- Editor-first: run this in the SQL editor, then commit the file as the record.

begin;

-- ------------------------------------------------------------------ roles

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'mcp_reader') then
    create role mcp_reader nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'mcp_holder') then
    create role mcp_holder nologin noinherit;
  end if;
end
$$;

comment on role mcp_reader is
  'Courseware MCP, public tier. Reads the AISM-I blueprint. No lesson bodies.';
comment on role mcp_holder is
  'Courseware MCP, authenticated tier. mcp_reader plus lesson bodies.';

-- ------------------------------------------------------------------ schema

create schema if not exists mcp;

comment on schema mcp is
  'Read-only projections for the courseware MCP. Definer views; the view body '
  'is the policy. No base tables live here and no role is granted anything in '
  'public.';

revoke all on schema mcp from public;
grant usage on schema mcp to mcp_reader, mcp_holder;

-- ------------------------------------------------- view 1: certification

create or replace view mcp.certification
with (security_barrier = true) as
select
  c.code,
  c.name,
  c.description,
  c.tier,
  c.status,
  c.exam_duration_minutes,
  c.passing_score_pct,
  c.num_questions,
  c.max_exam_attempts,
  c.attempt_window_months,
  c.validity_days
from public.certifications c
where c.code = 'AISM-I';

comment on view mcp.certification is
  'What the credential is and how it is examined. English only: there is no '
  'certification_translations table. AISM-I only.';

-- -------------------------------------------------------- view 2: task
--
-- Domain and task denormalised into one row per task per language. A partner
-- asking "what does this examine" wants the weight beside the statement, and
-- the domain weights are already published.

create or replace view mcp.task
with (security_barrier = true) as
select
  d.code                as domain_code,
  d.title               as domain_title,
  false                 as domain_title_is_fallback,
  d.weight_pct          as domain_weight_pct,
  d.order_index         as domain_order,
  t.code                as task_code,
  'en'::text            as language,
  t.statement,
  t.knowledge,
  t.skills,
  t.abilities,
  t.bloom_level,
  t.is_exam_scope,
  t.scope_tag,
  t.order_index         as task_order
from public.tasks t
join public.domains d        on d.id = t.domain_id
join public.certifications c on c.id = t.certification_id
where c.code = 'AISM-I'

union all

select
  d.code,
  coalesce(dt.title, d.title),
  dt.title is null,
  d.weight_pct,
  d.order_index,
  t.code,
  tt.language,
  tt.statement,
  tt.knowledge,
  tt.skills,
  tt.abilities,
  t.bloom_level,
  t.is_exam_scope,
  t.scope_tag,
  t.order_index
from public.tasks t
join public.domains d        on d.id = t.domain_id
join public.certifications c on c.id = t.certification_id
join public.task_translations tt
       on tt.task_id = t.id
      and tt.is_provisional = false
      and tt.review_status  = 'approved'
left join public.domain_translations dt
       on dt.domain_id = d.id
      and dt.language  = tt.language
      and dt.is_provisional = false
      and dt.review_status  = 'approved'
where c.code = 'AISM-I';

comment on view mcp.task is
  'The examined blueprint, one row per task per language. criticality and '
  'frequency are deliberately absent. domain_title_is_fallback marks a row '
  'whose domain title had no approved translation and fell back to English.';

-- ----------------------------------------------------------- view 3: concept

create or replace view mcp.concept
with (security_barrier = true) as
select
  co.slug,
  co.name,
  co.description,
  (select array_agg(t.code order by t.code)
     from public.task_concepts tc
     join public.tasks t on t.id = tc.task_id
    where tc.concept_id = co.id) as task_codes
from public.concepts co
join public.certifications c on c.id = co.certification_id
where c.code = 'AISM-I';

comment on view mcp.concept is
  'The concept layer, with the task codes each concept is examined under. '
  'English only: there is no concept_translations table, which is the same gap '
  'the curriculum analyzer hits on a Spanish source document.';

-- ------------------------------------------------- view 4: lesson (HOLDER)

create or replace view mcp.lesson
with (security_barrier = true) as
select
  m.slug          as module_slug,
  m.title         as module_title,
  m.order_index   as module_order,
  l.slug          as lesson_slug,
  l.title         as lesson_title,
  l.language,
  l.lesson_group_id,
  l.order_index   as lesson_order,
  l.estimated_minutes,
  l.content_md
from public.lessons l
join public.modules m        on m.id = l.module_id
join public.certifications c on c.id = m.certification_id
where c.code = 'AISM-I';

comment on view mcp.lesson is
  'Lesson bodies. THE ONLY VIEW mcp_reader IS NOT GRANTED. All three languages. '
  'lesson_group_id is the trilingual sibling key.';

-- ------------------------------------------------------------------ grants
--
-- No column lists: the projection lives in the view body, which is where it can
-- be read and reviewed. The CLAUDE.md rule about column-scoped GRANT SELECT
-- listing columns explicitly applies to grants ON TABLES, where a table-wide
-- grant silently overrides a column-level revoke. There are no column-level
-- revokes here and nothing to override.

revoke all on all tables in schema mcp from public;

grant select on mcp.certification, mcp.task, mcp.concept to mcp_reader;
grant select on mcp.certification, mcp.task, mcp.concept to mcp_holder;
grant select on mcp.lesson                                to mcp_holder;

-- Deliberately NOT granted, and this comment is the record of the intent:
--   grant select on mcp.lesson to mcp_reader;   <- never. This is the paywall.

-- A future view in this schema must be granted deliberately, not inherited.
alter default privileges in schema mcp revoke all on tables from public;

-- PostgREST path: the connection role switches into these via the JWT `role`
-- claim. Harmless if the route uses a direct connection instead.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticator') then
    execute 'grant mcp_reader to authenticator';
    execute 'grant mcp_holder to authenticator';
  end if;
end
$$;

commit;

-- ===================== VERIFICATION =====================
--
-- Run these AFTER the transaction. They read pg_catalog only.
--
-- NOTHING BELOW ATTEMPTS A SELECT AS EITHER ROLE. Migration 246 shipped a
-- commented `drop trigger ... expect 42501` as a privilege check; it succeeded
-- instead of failing and signup was silently dead. Where the check and the
-- damage are the same action, the check IS the damage. has_table_privilege
-- answers the same question against the catalog.
--
-- 1. THE POSITIVE HALF. Expect exactly 7 rows, all `true`: three views for
--    mcp_reader, four for mcp_holder.
--
-- select r.rolname, v.relname,
--        has_table_privilege(r.rolname, ('mcp.' || v.relname)::regclass, 'SELECT') as can_select
--   from pg_class v
--   join pg_namespace n on n.oid = v.relnamespace
--   cross join (select unnest(array['mcp_reader','mcp_holder']) as rolname) r
--  where n.nspname = 'mcp' and v.relkind = 'v'
--    and has_table_privilege(r.rolname, ('mcp.' || v.relname)::regclass, 'SELECT')
--  order by r.rolname, v.relname;
--
-- 2. THE NEGATIVE HALF, AND THE ONE THAT MATTERS. The paywall is an absent
--    grant, so assert the absence by name. Expect exactly one row: false.
--
-- select has_table_privilege('mcp_reader', 'mcp.lesson', 'SELECT') as reader_can_read_lessons;
--
-- 3. THE OTHER NEGATIVE HALF. Neither role may reach any base table. Expect 0.
--    A non-zero answer means a PUBLIC grant somewhere is doing what these roles
--    were built to prevent -- RLS would not help, because a definer view
--    bypasses it and a missing grant is what closes a table.
--
-- select count(*) as base_tables_reachable
--   from pg_class t
--   join pg_namespace n on n.oid = t.relnamespace
--   cross join (select unnest(array['mcp_reader','mcp_holder']) as rolname) r
--  where n.nspname = 'public' and t.relkind in ('r','v','m','p')
--    and has_table_privilege(r.rolname, t.oid, 'SELECT');
--
-- 4. The views are definer, not invoker. security_invoker is stored as the
--    string 'on' when set, so its ABSENCE from reloptions is what is asserted.
--    Expect 4 rows, security_barrier=true and invoker_off=true on each.
--
-- select c.relname,
--        coalesce(array_to_string(c.reloptions, ','), '') like '%security_barrier=true%' as barrier,
--        coalesce(array_to_string(c.reloptions, ','), '') not like '%security_invoker=on%' as invoker_off
--   from pg_class c
--   join pg_namespace n on n.oid = c.relnamespace
--  where n.nspname = 'mcp' and c.relkind = 'v'
--  order by c.relname;
--
-- 5. CONTENT SHAPE, as a property rather than a count that will drift.
--    Expect: certification 1 row; concept 226; task 3 languages; lesson 3
--    languages and 61 lessons in each.
--
-- select 'task langs'   as what, count(distinct language)::text as v from mcp.task
-- union all
-- select 'lesson langs',        count(distinct language)::text   from mcp.lesson
-- union all
-- select 'lesson per lang',     string_agg(distinct c::text, ',') from (
--          select count(*) c from mcp.lesson group by language) s
-- union all
-- select 'cert rows',           count(*)::text from mcp.certification
-- union all
-- select 'concept rows',        count(*)::text from mcp.concept
-- union all
-- select 'fallback titles',     count(*)::text from mcp.task where domain_title_is_fallback;
--
-- 6. NOTHING OUTSIDE AISM-I LEAKS. Expect 0 on both.
--
-- select (select count(*) from mcp.task    where domain_code not in ('D1','D2','D3','D4','D5','D6')) as odd_domains,
--        (select count(*) from mcp.certification where code <> 'AISM-I')                             as odd_certs;
