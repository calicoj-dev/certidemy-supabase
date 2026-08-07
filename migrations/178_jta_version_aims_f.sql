-- 178_jta_version_aims_f.sql
-- AIMS-F  ISO/IEC 42001 Foundation  --  jta_versions row
--
-- Migration 106 standardized the six certs that existed in July; 175 filled AIHR-I
-- and ISMS-F. AIMS-F is the ninth and had no row, so exam_attempts.jta_version_id
-- would have nothing to point at. The column is nullable so no attempt fails - the
-- attempt simply loses its link back to the scheme version it was taken under,
-- which is the traceability record ISO/IEC 17024 asks for.
--
-- PROJECTED FROM LIVE ROWS, same shape as 106 and 175. Nothing here is typed by
-- hand: the snapshot is built by querying certifications, domains, tasks and
-- v_cognitive_profile. If the numbers in the verification block are wrong, the
-- scaffold is wrong, not this file.
--
-- status = 'published' to match the other eight rows. The column tracks the JTA
-- version, not the certification lifecycle - AIMS-F itself is still 'draft'.
--
-- ASCII-only. Accented content (the es-419 and pt-BR catalogue copy) does NOT
-- belong in a migration at all - it goes through load-cert-i18n.mjs, because the
-- SQL editor corrupts multibyte characters.

begin;

insert into public.jta_versions (certification_id, version_string, status, blueprint_snapshot)
select
  c.id,
  'v2.0',
  'published',
  jsonb_build_object(
    'jta_version',  'v2.0',
    'generated_at', now(),
    'generated_by', 'migration 178 - projected from live rows',
    'certification', to_jsonb(c),
    'counts', jsonb_build_object(
      'domains',             (select count(*) from public.domains  d where d.certification_id = c.id),
      'tasks',               (select count(*) from public.tasks    t where t.certification_id = c.id),
      'concepts',            (select count(*) from public.concepts k where k.certification_id = c.id),
      'tasks_in_exam_scope', (select count(*) from public.tasks    t where t.certification_id = c.id and t.is_exam_scope)
    ),
    'domains', (
      select jsonb_agg(dom order by dom->>'order_index')
      from (
        select to_jsonb(d) || jsonb_build_object(
                 'tasks', coalesce((
                   select jsonb_agg(to_jsonb(t) order by t.order_index)
                   from public.tasks t
                   where t.domain_id = d.id
                 ), '[]'::jsonb)
               ) as dom
        from public.domains d
        where d.certification_id = c.id
      ) s
    ),
    'cognitive_profile', (
      select coalesce(jsonb_agg(to_jsonb(v)), '[]'::jsonb)
      from public.v_cognitive_profile v
      where v.certification_id = c.id
    )
  )
from public.certifications c
where c.code = 'AIMS-F';

commit;

-- ============================================================
-- VERIFICATION (run separately, one statement at a time)
-- ============================================================
-- 1. the row exists and its counts match the scaffold:
-- select jv.version_string, jv.status,
--        jv.blueprint_snapshot->'counts' as counts,
--        jsonb_array_length(jv.blueprint_snapshot->'domains') as domains_in_snapshot,
--        jsonb_array_length(jv.blueprint_snapshot->'cognitive_profile') as profile_rows
-- from public.jta_versions jv
-- join public.certifications c on c.id = jv.certification_id
-- where c.code = 'AIMS-F';
-- EXPECT counts: domains 5, tasks 35, concepts 154, tasks_in_exam_scope 35
--        domains_in_snapshot 5, profile_rows 3 (no 1_remember tier)
--
-- 2. every cert now holds exactly one row:
-- select c.code, count(jv.id) as versions
-- from public.certifications c
-- left join public.jta_versions jv on jv.certification_id = c.id
-- group by c.code order by c.code;
-- EXPECT: 9 certs, 1 each
