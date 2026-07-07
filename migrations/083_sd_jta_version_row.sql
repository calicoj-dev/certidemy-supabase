-- 083: SD-AI-I jta_versions backfill — FOUND BY THE EVIDENCE ROOM (day one).
-- SM-AI-I (v2.1) and SPO-AI-I (v1.0) have published JTA version rows; SD-AI-I
-- has none, so its exam attempts stamp no jta_version_id. Insert v1.0 with a
-- blueprint_snapshot built from the live domains (weights as they stand).
-- Idempotent: no-op if a row already exists. Editor-first, then commit.
begin;

insert into public.jta_versions (certification_id, version_string, status, blueprint_snapshot)
select
  c.id,
  'SD-AI-I v1.0',
  'published',
  (
    select jsonb_agg(
             jsonb_build_object(
               'code', d.code,
               'title', d.title,
               'weight_pct', d.weight_pct
             )
             order by d.order_index
           )
      from public.domains d
     where d.certification_id = c.id
  )
from public.certifications c
where c.code = 'SD-AI-I'
  and not exists (
    select 1 from public.jta_versions j where j.certification_id = c.id
  );

commit;

-- verify: expect one row, 'SD-AI-I v1.0' / published / 5-element snapshot
-- select version_string, status, jsonb_array_length(blueprint_snapshot)
--   from jta_versions j join certifications c on c.id = j.certification_id
--  where c.code = 'SD-AI-I';
