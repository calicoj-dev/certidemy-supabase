-- 211_aims_ia_jta_version.sql
--
-- AIMS-IA published JTA version - v2.0, snapshot projected from live rows.
--
-- WHY THIS ROW EXISTS. Under ISO/IEC 17024 the scheme has to be able to show an
-- assessor what its exam claims to measure, as it stood when the exam was
-- built. A JTA that exists only as a markdown file in a repository cannot do
-- that: the file can be edited, and nothing ties its contents to the database
-- the exam is actually assembled from. jta_versions holds the frozen record.
--
-- VERSION STRING. Every certification's JTA carries working version numbers
-- while it is being built - AIMS-IA went v1.0, then v1.1-LOCKED, then three
-- amendments. On locking for launch, every scheme's JTA becomes v2.0. That is
-- the house rule and it is why ISMS-IA's row also reads v2.0.
--
-- PROJECTED, NOT PASTED. The snapshot is built by this query FROM the live
-- domains, tasks, concepts and certification rows. Two reasons:
--
--   1. It cannot drift. A hand-written snapshot is a second copy of the JTA
--      that can disagree with the database silently. This one is the database.
--   2. It cannot be corrupted in transit. The AIMS-IA JTA runs to 40 tasks with
--      full knowledge, skills and abilities fields; pasting that as literal
--      JSON into the Supabase SQL editor is the exact route that has corrupted
--      multibyte characters before. Here only the query text is pasted and the
--      database assembles the JSON.
--
-- WHAT IS FROZEN. The scaffold as it stands after migration 208 - which
-- corrected task 2.6's statement verb - and after the three JTA amendments
-- recorded in AIMS-IA_JTA_v1_1.md. Cognitive profile understand 13.02 / apply
-- 17.50 / analyze 69.48, from v_cognitive_profile.
--
-- Run in the Supabase SQL editor.
-- ============================================================================

insert into public.jta_versions (certification_id, version_string, status, blueprint_snapshot)
select
  c.id,
  'v2.0',
  'published',
  jsonb_build_object(
    'jta_version',  'v2.0',
    'generated_at', now(),
    'generated_by', 'migration 211 - projected from live rows, post amendment 3 (task 2.6 statement verb, migration 208)',
    'counts', jsonb_build_object(
      'domains',             (select count(*) from public.domains  d where d.certification_id = c.id),
      'tasks',               (select count(*) from public.tasks    t where t.certification_id = c.id),
      'concepts',            (select count(*) from public.concepts x where x.certification_id = c.id),
      'tasks_in_exam_scope', (select count(*) from public.tasks    t where t.certification_id = c.id and t.is_exam_scope)
    ),
    'certification', to_jsonb(c.*),
    'domains', (
      select jsonb_agg(dom order by dom->>'order_index')
      from (
        select to_jsonb(d.*) || jsonb_build_object(
          'tasks', coalesce((
            select jsonb_agg(to_jsonb(t.*) order by t.order_index)
            from public.tasks t
            where t.domain_id = d.id
          ), '[]'::jsonb)
        ) as dom
        from public.domains d
        where d.certification_id = c.id
      ) s
    ),
    'cognitive_profile', coalesce((
      select jsonb_agg(to_jsonb(p.*))
      from public.v_cognitive_profile p
      where p.certification_id = c.id
    ), '[]'::jsonb)
  )
from public.certifications c
where c.id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4';

-- ============================================================================
-- PROOF
-- ============================================================================

-- 1. One published row, v2.0.
select version_string, status, created_at
from public.jta_versions
where certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4';

-- 2. The snapshot's counts match the live scaffold.
--    Expect domains 5, tasks 40, concepts 158, tasks_in_exam_scope 40.
select blueprint_snapshot -> 'counts' as counts,
       jsonb_array_length(blueprint_snapshot -> 'domains') as domains_in_snapshot,
       (select count(*) from jsonb_array_elements(blueprint_snapshot -> 'domains') d
         cross join jsonb_array_elements(d -> 'tasks')) as tasks_in_snapshot
from public.jta_versions
where certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4';

-- 3. The frozen cognitive profile. Expect 13.02 / 17.50 / 69.48.
select jsonb_pretty(blueprint_snapshot -> 'cognitive_profile') as cognitive_profile
from public.jta_versions
where certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4';

-- 4. Task 2.6 carries its corrected statement in the frozen snapshot.
--    Expect a statement opening "Determine which auditing methods".
select t ->> 'code' as code, t ->> 'bloom_level' as bloom, t ->> 'statement' as statement
from public.jta_versions jv
cross join jsonb_array_elements(jv.blueprint_snapshot -> 'domains') d
cross join jsonb_array_elements(d -> 'tasks') t
where jv.certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
  and t ->> 'code' = '2.6';

-- 5. The whole-cert check.
--    Run: node scripts\verify-cert.mjs --cert AIMS-IA --strict
--    Expect: PASS  Section 5  Certification holds a published JTA version  v2.0
