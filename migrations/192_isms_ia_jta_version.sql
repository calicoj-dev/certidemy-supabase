-- 192_isms_ia_jta_version.sql
-- ISMS-IA jta_versions row - the scheme-of-record snapshot.
--
-- WHY THIS EXISTS AS ITS OWN MIGRATION
--
-- ISMS-IA is the TENTH certification. Migration 106 covered six, 175 covered
-- two, 178 covered AIMS-F as the ninth. **verify-cert does not check for a
-- jta_versions row** - which is exactly how SD-AI-I operated without one until
-- the governance dashboard surfaced it on its first day (HANDOFF v1.9
-- addendum 7, finding 1). It has been owed as a CERT-PUBLISH-CHECKLIST step
-- since v5.5 section 9.5 and is still not written there.
--
-- Every exam attempt is stamped with the JTA version in force. Without this row
-- an attempt records nothing, and the traceability claim in SCHEME-ISMS-IA
-- section 10 has a hole in it.
--
-- PROJECTED, NOT TYPED
--
-- The snapshot is built entirely from live rows: counts from the spine tables,
-- domains with their tasks nested, the certification row whole (including the
-- blueprint written by 190), and the cognitive profile from
-- public.v_cognitive_profile. Shape follows the ISMS-F (migration 174) and
-- AIMS-F (migration 178) snapshots, both read 2026-08-10.
--
-- ONE DELIBERATE DIFFERENCE FROM THE EARLIER SNAPSHOTS
--
-- ISMS-F's snapshot ordered tasks by `code` as text, so its D3 reads
-- 3.1, 3.10, 3.11, 3.2, 3.3. ISMS-IA has a task 4.10, which under a text sort
-- lands ahead of 4.2. That is a defect rather than a convention, so tasks here
-- are ordered by order_index and domains by their own order_index.
--
-- VERSION STRING STAYS v2.0
--
-- Erratum 1 (migration 191, eight statements and seven skills fields) is an
-- erratum and not a version bump: no item existed and no candidate had been
-- assessed. This snapshot therefore captures the POST-ERRATUM text under v2.0,
-- which is correct - a snapshot records what was true when it was generated.
--
-- status = 'published'. The check constraint permits draft, published, retired.

insert into public.jta_versions (certification_id, version_string, status, blueprint_snapshot)
select
  c.id,
  'v2.0',
  'published',
  jsonb_build_object(

    'counts', jsonb_build_object(
      'domains',             (select count(*) from public.domains  d where d.certification_id = c.id),
      'tasks',               (select count(*) from public.tasks    t where t.certification_id = c.id),
      'concepts',            (select count(*) from public.concepts k where k.certification_id = c.id),
      'tasks_in_exam_scope', (select count(*) from public.tasks    t where t.certification_id = c.id and t.is_exam_scope)
    ),

    'domains', (
      select jsonb_agg(s.dom order by s.dom_order)
      from (
        select
          to_jsonb(d) || jsonb_build_object(
            'tasks',
            coalesce(
              (select jsonb_agg(to_jsonb(t) order by t.order_index)
                 from public.tasks t
                where t.domain_id = d.id),
              '[]'::jsonb
            )
          ) as dom,
          d.order_index as dom_order
        from public.domains d
        where d.certification_id = c.id
      ) s
    ),

    'jta_version',  'v2.0',
    'generated_at', now(),
    'generated_by', 'migration 192 - projected from live rows, post erratum 1',

    'certification', to_jsonb(c),

    'cognitive_profile', (
      select jsonb_agg(to_jsonb(v))
      from public.v_cognitive_profile v
      where v.certification_id = c.id
    )

  )
from public.certifications c
where c.code = 'ISMS-IA'
on conflict (certification_id, version_string) do nothing;

-- ---------------------------------------------------------------------------
-- VERIFICATION
-- ---------------------------------------------------------------------------
--
-- The row exists and its counts agree with the live spine. Expect
-- 5 / 38 / 169 / 38, version v2.0, status published:
--
--   select j.version_string, j.status,
--          j.blueprint_snapshot -> 'counts' as counts,
--          jsonb_array_length(j.blueprint_snapshot -> 'domains') as domains_in_snapshot
--   from public.jta_versions j
--   join public.certifications c on c.id = j.certification_id
--   where c.code = 'ISMS-IA';
--
-- Task order survived. Expect 4.1 through 4.10 in NUMERIC order, with 4.10 LAST
-- - this is the defect the earlier snapshots carry:
--
--   select t ->> 'code' as code, t ->> 'order_index' as idx
--   from public.jta_versions j
--   join public.certifications c on c.id = j.certification_id,
--        jsonb_array_elements(j.blueprint_snapshot -> 'domains') d,
--        jsonb_array_elements(d -> 'tasks') t
--   where c.code = 'ISMS-IA' and d ->> 'code' = 'D4';
--
-- The snapshot captured the POST-erratum statements. Expect zero rows - no
-- create-level verb anywhere in the frozen text:
--
--   select t ->> 'code', t ->> 'statement'
--   from public.jta_versions j
--   join public.certifications c on c.id = j.certification_id,
--        jsonb_array_elements(j.blueprint_snapshot -> 'domains') d,
--        jsonb_array_elements(d -> 'tasks') t
--   where c.code = 'ISMS-IA'
--     and (t ->> 'statement') ~* '^(Construct|Audit|Test|Derive) ';
--
-- Profile frozen correctly - expect 5.00 / 29.40 / 65.60:
--
--   select p ->> 'bloom_level' as bloom, p ->> 'pct_of_form' as pct
--   from public.jta_versions j
--   join public.certifications c on c.id = j.certification_id,
--        jsonb_array_elements(j.blueprint_snapshot -> 'cognitive_profile') p
--   where c.code = 'ISMS-IA';
--
-- All ten certs now hold a jta_versions row - expect 10 rows, none missing:
--
--   select c.code, j.version_string, j.status
--   from public.certifications c
--   left join public.jta_versions j on j.certification_id = c.id
--   order by c.category_slug, c.sort_order;
--
-- ---------------------------------------------------------------------------
-- OWED, AND OLDER THAN THIS CERT
-- ---------------------------------------------------------------------------
--
-- 1. CERT-PUBLISH-CHECKLIST.md still has no step for the jta_versions row.
--    Requested in HANDOFF v5.5 section 9.5, repeated in v5.6 open loops, still
--    absent. Ten certs have now each needed this discovered separately.
--
-- 2. Propose a verify-cert invariant: every cert holds at least one
--    jta_versions row with status = 'published'. It is one query and it would
--    have caught SD-AI-I, AIMS-F and this cert without anyone remembering.
