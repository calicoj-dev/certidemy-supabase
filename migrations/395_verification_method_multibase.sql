-- 395_verification_method_multibase.sql
--
-- open-badge now names the signing key as [issuer]#[publicKeyMultibase] instead of
-- [issuer]#key-1 (ob3.ts verificationMethodId). The 1EdTech validator reads the key
-- from that fragment; for #key-1 it fetched the Profile and crashed. Every served
-- credential therefore changes bytes, so per CLAUDE.md s7 (renderer change ->
-- DOC_VERSION -> material_updated_at -> anchor rebuild) this bumps
-- material_updated_at, so each proof's `created` is honest, and releases anchor_id,
-- so build-credential-anchor re-anchors the new documents. Old anchors remain valid
-- proof that the old documents existed. Specimens are not served and stay untouched.
--
-- Run AFTER open-badge is deployed. One block, in the SQL editor.

-- ===================================================================== 1.
do $$
declare
  v_real        int;
  v_bumped      int;
  v_data_before text;
  v_data_after  text;
  v_spec_before text;
  v_spec_after  text;
  v_stragglers  text;
begin
  -- Checksums of what must NOT change: real-credential data, and specimens entirely.
  select count(*)::int,
         md5(coalesce(string_agg(id::text || '|' || coalesce(holder_name, '') || '|' || coalesce(status::text, '') || '|' || coalesce(credential_code, ''), ',' order by id), ''))
    into v_real, v_data_before
    from public.credentials where is_specimen = false;
  select md5(coalesce(string_agg(id::text || '|' || material_updated_at::text || '|' || coalesce(anchor_id::text, ''), ',' order by id), ''))
    into v_spec_before
    from public.credentials where is_specimen = true;

  update public.credentials
     set material_updated_at = now(), anchor_id = null
   where is_specimen = false;
  get diagnostics v_bumped = row_count;

  select md5(coalesce(string_agg(id::text || '|' || coalesce(holder_name, '') || '|' || coalesce(status::text, '') || '|' || coalesce(credential_code, ''), ',' order by id), ''))
    into v_data_after
    from public.credentials where is_specimen = false;
  select md5(coalesce(string_agg(id::text || '|' || material_updated_at::text || '|' || coalesce(anchor_id::text, ''), ',' order by id), ''))
    into v_spec_after
    from public.credentials where is_specimen = true;
  select string_agg(credential_code, ', ')
    into v_stragglers
    from public.credentials
   where is_specimen = false and (material_updated_at <> now() or anchor_id is not null);

  if v_bumped <> v_real then
    raise exception '395: bumped % of % real credentials', v_bumped, v_real;
  end if;
  if v_stragglers is not null then
    raise exception '395: not bumped or still anchored' using detail = v_stragglers;
  end if;
  if v_data_before is distinct from v_data_after then
    raise exception '395: holder data changed' using hint = 'Only material_updated_at and anchor_id may move.';
  end if;
  if v_spec_before is distinct from v_spec_after then
    raise exception '395: a specimen changed' using hint = 'Specimens are not served and must stay untouched.';
  end if;
  raise notice '395: % real credentials bumped and released for re-anchoring', v_bumped;
end $$;
