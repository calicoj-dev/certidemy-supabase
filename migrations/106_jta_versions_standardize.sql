-- 106_jta_versions_standardize.sql
-- Certidemy - ISO/IEC 17024 scheme evidence record
--
-- PRE-LAUNCH STANDARDIZATION. One uniform JTA snapshot per certification,
-- projected from live rows. No supersession history is preserved.
--
-- WHY ONE DO BLOCK: the Supabase SQL editor commits statement-by-statement, so a
-- script-level BEGIN/COMMIT does not make a multi-statement migration atomic and
-- an ON COMMIT DROP temp table dies before the next statement can read it. A DO
-- block is a single statement, so every step below either all applies or all
-- rolls back, and any RAISE EXCEPTION undoes the entire migration.
--
-- FK NOTE: exam_attempts.jta_version_id references jta_versions, so rows cannot
-- be deleted and reinserted. This standardizes IN PLACE:
--   1. choose one keeper row per certification (preferring a row an attempt
--      already references, else the newest)
--   2. repoint any exam_attempt referencing a non-keeper sibling onto the keeper
--   3. delete the now-unreferenced extras
--   4. insert a placeholder row for any certification holding none
--   5. overwrite every row with the generated snapshot
-- Keeper ids never change, so no foreign key is ever violated.
--
-- Standard set here:
--   version_string = 'v2.0'  ·  status = 'published'
--   blueprint_snapshot = full task-level JSON built with to_jsonb(row), so it
--   cannot drift from the schema. Whatever the live rows say IS the scheme.
--
-- Idempotent: re-running converges on the same six rows.

do $migration$
declare
  n         int;
  n_moved   int;
  n_dropped int;
  n_added   int;
begin
  -- -------------------------------------------------------------------------
  -- 0. Guards
  -- -------------------------------------------------------------------------
  select count(*) into n from public.certifications;
  if n <> 6 then
    raise exception '106 ABORT: expected 6 certifications, found %', n;
  end if;

  select count(*) into n
  from public.certifications c
  where not exists (select 1 from public.domains d where d.certification_id = c.id);
  if n > 0 then
    raise exception '106 ABORT: % certification(s) have no domains', n;
  end if;

  -- -------------------------------------------------------------------------
  -- 1. Keeper row per certification
  --    Preference: referenced by an exam attempt, then newest.
  -- -------------------------------------------------------------------------
  drop table if exists _keeper;

  create temp table _keeper as
  select distinct on (v.certification_id)
    v.certification_id,
    v.id,
    (ref.jta_version_id is not null) as was_referenced
  from public.jta_versions v
  left join (
    select distinct jta_version_id
    from public.exam_attempts
    where jta_version_id is not null
  ) ref on ref.jta_version_id = v.id
  order by
    v.certification_id,
    (ref.jta_version_id is not null) desc,
    v.created_at desc;

  -- -------------------------------------------------------------------------
  -- 2. Repoint attempts referencing a discarded sibling of the same cert
  --    (pre-launch test attempts only)
  -- -------------------------------------------------------------------------
  update public.exam_attempts ea
  set jta_version_id = k.id
  from public.jta_versions v
  join _keeper k on k.certification_id = v.certification_id
  where ea.jta_version_id = v.id
    and ea.jta_version_id <> k.id;
  get diagnostics n_moved = row_count;

  -- -------------------------------------------------------------------------
  -- 3. Drop the extras (now unreferenced)
  -- -------------------------------------------------------------------------
  delete from public.jta_versions v
  where not exists (select 1 from _keeper k where k.id = v.id);
  get diagnostics n_dropped = row_count;

  -- -------------------------------------------------------------------------
  -- 4. Placeholder row for any certification with none
  --    (blueprint_snapshot is NOT NULL; filled in step 5)
  -- -------------------------------------------------------------------------
  insert into public.jta_versions
    (certification_id, version_string, status, blueprint_snapshot)
  select c.id, 'v2.0', 'draft', '{}'::jsonb
  from public.certifications c
  where not exists (
    select 1 from public.jta_versions v where v.certification_id = c.id
  );
  get diagnostics n_added = row_count;

  -- -------------------------------------------------------------------------
  -- 5. Overwrite every row from live rows
  -- -------------------------------------------------------------------------
  update public.jta_versions v
  set
    version_string = 'v2.0',
    status         = 'published',
    blueprint_snapshot = jsonb_build_object(
      'jta_version',   'v2.0',
      'generated_at',  now(),
      'generated_by',  'migration 106 - projected from live rows',
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
  where c.id = v.certification_id;

  drop table _keeper;

  -- -------------------------------------------------------------------------
  -- 6. Verify (still inside the block - any failure rolls everything back)
  -- -------------------------------------------------------------------------
  select count(*) into n from public.jta_versions;
  if n <> 6 then
    raise exception '106 ABORT: expected 6 jta_versions rows, found %', n;
  end if;

  select count(*) into n
  from (select certification_id from public.jta_versions
        group by certification_id having count(*) > 1) q;
  if n > 0 then
    raise exception '106 ABORT: % certification(s) hold more than one row', n;
  end if;

  select count(*) into n from public.jta_versions
  where version_string <> 'v2.0' or status <> 'published';
  if n > 0 then
    raise exception '106 ABORT: % row(s) not at the standard', n;
  end if;

  select count(*) into n from public.jta_versions v
  where jsonb_array_length(v.blueprint_snapshot -> 'domains') = 0;
  if n > 0 then
    raise exception '106 ABORT: % snapshot(s) carry no domains', n;
  end if;

  select count(*) into n from public.jta_versions v
  where not exists (
    select 1 from jsonb_array_elements(v.blueprint_snapshot -> 'domains') dd
    where jsonb_array_length(dd -> 'tasks') > 0
  );
  if n > 0 then
    raise exception '106 ABORT: % snapshot(s) carry no tasks', n;
  end if;

  select count(*) into n
  from public.exam_attempts ea
  where ea.jta_version_id is not null
    and not exists (select 1 from public.jta_versions v where v.id = ea.jta_version_id);
  if n > 0 then
    raise exception '106 ABORT: % orphaned exam_attempt reference(s)', n;
  end if;

  raise notice '106 OK: % attempt(s) repointed, % extra row(s) dropped, % row(s) created, 6 rows at v2.0/published',
    n_moved, n_dropped, n_added;
end
$migration$;

-- ---------------------------------------------------------------------------
-- 7. Readout - expect 6 rows, all v2.0 / published
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
  (select count(*) from public.exam_attempts ea where ea.jta_version_id = v.id) as attempts
from public.jta_versions v
join public.certifications c on c.id = v.certification_id
order by c.code;
