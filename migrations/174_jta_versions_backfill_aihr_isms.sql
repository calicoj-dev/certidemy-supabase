-- 174_jta_versions_backfill_aihr_isms.sql
-- Certidemy - ISO/IEC 17024 scheme evidence record
--
-- Migration 106 standardized jta_versions for the six certifications that
-- existed in July 2026. AIHR-I and ISMS-F were created afterwards and have no
-- row at all, so `exam_attempts.jta_version_id` has nothing to point at for
-- either of them. The column is nullable, so no attempt fails - the attempt
-- simply loses its link back to the scheme version it was taken under, which
-- is the traceability record ISO/IEC 17024 asks a certification body to keep.
--
-- ISMS-F is LIVE (`status = available`) as this runs.
--
-- SCOPE. This fills the two missing rows ONLY. It deliberately does not
-- regenerate the six existing snapshots: they are published records of those
-- schemes, and refreshing them is a separate decision with a wider blast
-- radius than a backfill should carry.
--
-- The projection is lifted verbatim from migration 106 so all eight rows share
-- one shape. `to_jsonb(row)` means the snapshot cannot drift from the schema:
-- whatever the live rows say IS the scheme.
--
-- ONE DO BLOCK. The Supabase SQL editor commits statement by statement, so a
-- script-level BEGIN/COMMIT does not make a multi-statement migration atomic.
-- A DO block is a single statement: every step applies or none does, and any
-- RAISE EXCEPTION rolls the whole thing back.
--
-- Idempotent: re-running is a no-op once both rows exist.

do $migration$
declare
  n       int;
  n_added int;
begin
  -- -------------------------------------------------------------------------
  -- 0. Guards
  -- -------------------------------------------------------------------------
  select count(*) into n
  from public.certifications c
  where not exists (select 1 from public.domains d where d.certification_id = c.id);
  if n > 0 then
    raise exception '174 ABORT: % certification(s) have no domains', n;
  end if;

  -- Every certification lacking a row must have a computable profile, or the
  -- snapshot would be generated with an empty cognitive_profile.
  select count(*) into n
  from public.certifications c
  where not exists (select 1 from public.jta_versions v where v.certification_id = c.id)
    and not exists (select 1 from public.v_cognitive_profile p where p.certification_id = c.id);
  if n > 0 then
    raise exception '174 ABORT: % certification(s) lack a cognitive profile', n;
  end if;

  -- -------------------------------------------------------------------------
  -- 1. Placeholder row for any certification holding none
  --    (blueprint_snapshot is NOT NULL; filled in step 2)
  -- -------------------------------------------------------------------------
  insert into public.jta_versions
    (certification_id, version_string, status, blueprint_snapshot)
  select c.id, 'v2.0', 'draft', '{}'::jsonb
  from public.certifications c
  where not exists (
    select 1 from public.jta_versions v where v.certification_id = c.id
  );
  get diagnostics n_added = row_count;

  if n_added = 0 then
    raise notice '174 OK: nothing to backfill, every certification already holds a row';
    return;
  end if;

  -- -------------------------------------------------------------------------
  -- 2. Populate ONLY the rows just created (status still 'draft')
  --    Projection lifted from migration 106.
  -- -------------------------------------------------------------------------
  update public.jta_versions v
  set
    version_string = 'v2.0',
    status         = 'published',
    blueprint_snapshot = jsonb_build_object(
      'jta_version',   'v2.0',
      'generated_at',  now(),
      'generated_by',  'migration 174 - projected from live rows',
      'certification', to_jsonb(c.*),
      'counts', jsonb_build_object(
        'domains', (
          select count(*) from public.domains d
          where d.certification_id = c.id
        ),
        'tasks', (
          select count(*) from public.tasks t
          join public.domains d on d.id = t.domain_id
          where d.certification_id = c.id
        ),
        'tasks_in_exam_scope', (
          select count(*) from public.tasks t
          join public.domains d on d.id = t.domain_id
          where d.certification_id = c.id
            and t.is_exam_scope is true
        ),
        'concepts', (
          select count(*) from public.concepts k
          where k.certification_id = c.id
        )
      ),
      'cognitive_profile', coalesce((
        select jsonb_agg(to_jsonb(p.*))
        from public.v_cognitive_profile p
        where p.certification_id = c.id
      ), '[]'::jsonb),
      'domains', coalesce((
        select jsonb_agg(
                 to_jsonb(d.*) || jsonb_build_object(
                   'tasks', coalesce((
                     select jsonb_agg(to_jsonb(t.*) order by t.code)
                     from public.tasks t
                     where t.domain_id = d.id
                   ), '[]'::jsonb)
                 )
                 order by d.code
               )
        from public.domains d
        where d.certification_id = c.id
      ), '[]'::jsonb)
    )
  from public.certifications c
  where c.id = v.certification_id
    and v.status = 'draft'
    and v.blueprint_snapshot = '{}'::jsonb;

  -- -------------------------------------------------------------------------
  -- 3. Verify - any failure rolls the whole migration back
  -- -------------------------------------------------------------------------
  select count(*) into n
  from public.certifications c
  where not exists (select 1 from public.jta_versions v where v.certification_id = c.id);
  if n > 0 then
    raise exception '174 ABORT: % certification(s) still hold no row', n;
  end if;

  select count(*) into n
  from (select certification_id from public.jta_versions
        group by certification_id having count(*) > 1) q;
  if n > 0 then
    raise exception '174 ABORT: % certification(s) hold more than one row', n;
  end if;

  select count(*) into n from public.jta_versions
  where version_string <> 'v2.0' or status <> 'published';
  if n > 0 then
    raise exception '174 ABORT: % row(s) not at the standard', n;
  end if;

  select count(*) into n from public.jta_versions v
  where jsonb_array_length(v.blueprint_snapshot -> 'domains') = 0;
  if n > 0 then
    raise exception '174 ABORT: % snapshot(s) carry no domains', n;
  end if;

  select count(*) into n from public.jta_versions v
  where not exists (
    select 1 from jsonb_array_elements(v.blueprint_snapshot -> 'domains') dd
    where jsonb_array_length(dd -> 'tasks') > 0
  );
  if n > 0 then
    raise exception '174 ABORT: % snapshot(s) carry no tasks', n;
  end if;

  select count(*) into n
  from public.exam_attempts ea
  where ea.jta_version_id is not null
    and not exists (select 1 from public.jta_versions v where v.id = ea.jta_version_id);
  if n > 0 then
    raise exception '174 ABORT: % orphaned exam_attempt reference(s)', n;
  end if;

  raise notice '174 OK: % row(s) created and populated; every certification now holds one v2.0/published row', n_added;
end
$migration$;

-- ---------------------------------------------------------------------------
-- 4. Readout - expect one row per certification, all v2.0 / published.
--    ISMS-F: 5 domains, 49 tasks, 49 in scope, 191 concepts, 4 profile rows.
-- ---------------------------------------------------------------------------
select
  c.code,
  v.version_string,
  v.status,
  (v.blueprint_snapshot -> 'counts' ->> 'domains')             as domains,
  (v.blueprint_snapshot -> 'counts' ->> 'tasks')               as tasks,
  (v.blueprint_snapshot -> 'counts' ->> 'tasks_in_exam_scope') as in_scope,
  (v.blueprint_snapshot -> 'counts' ->> 'concepts')            as concepts,
  jsonb_array_length(v.blueprint_snapshot -> 'cognitive_profile') as profile_rows,
  (v.blueprint_snapshot ->> 'generated_by')                    as generated_by,
  (select count(*) from public.exam_attempts ea where ea.jta_version_id = v.id) as attempts
from public.jta_versions v
join public.certifications c on c.id = v.certification_id
order by c.code;
