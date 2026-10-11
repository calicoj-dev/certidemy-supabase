-- 396_zz_test_credential_specimen.sql
--
-- ZZ-TEST-I-A6BJ-EA5R was issued against ZZ-TEST-I, the deliberate control certification
-- (status draft, no usable jta snapshot, no English claim). open-badge cannot build its
-- achievement and answers 500, which aborts build-credential-anchor for every credential.
-- Diagnosed 2026-10-11 in the editor: achievement_exists true, usable_snapshots 0.
--
-- It becomes a specimen: open-badge 404s it, the anchor and every count exclude it.
-- Only this one row moves; every other credential is checksummed unchanged.

-- ===================================================================== 1.
do $$
declare
  v_target      uuid;
  v_others_pre  text;
  v_others_post text;
  v_moved       int;
begin
  select c.id into v_target
    from public.credentials c
    join public.achievements a   on a.id = c.achievement_id
    join public.certifications ce on ce.id = a.certification_id
   where c.credential_code = 'ZZ-TEST-I-A6BJ-EA5R'
     and ce.code = 'ZZ-TEST-I'
     and c.is_specimen = false;
  if v_target is null then
    raise exception '396: target not found as a real ZZ-TEST-I credential' using hint = 'Already a specimen, or the code changed.';
  end if;

  select md5(coalesce(string_agg(id::text || '|' || is_specimen::text || '|' || coalesce(material_updated_at::text, '') || '|' || coalesce(anchor_id::text, ''), ',' order by id), ''))
    into v_others_pre from public.credentials where id <> v_target;

  update public.credentials set is_specimen = true where id = v_target and is_specimen = false;
  get diagnostics v_moved = row_count;

  select md5(coalesce(string_agg(id::text || '|' || is_specimen::text || '|' || coalesce(material_updated_at::text, '') || '|' || coalesce(anchor_id::text, ''), ',' order by id), ''))
    into v_others_post from public.credentials where id <> v_target;

  if v_moved <> 1 then
    raise exception '396: expected to move 1 row, moved %', v_moved;
  end if;
  if not exists (select 1 from public.credentials where id = v_target and is_specimen) then
    raise exception '396: target is not a specimen after the update';
  end if;
  if v_others_pre is distinct from v_others_post then
    raise exception '396: another credential changed' using hint = 'Only ZZ-TEST-I-A6BJ-EA5R may move.';
  end if;
  raise notice '396: ZZ-TEST-I-A6BJ-EA5R is now a specimen; no other credential changed';
end $$;
