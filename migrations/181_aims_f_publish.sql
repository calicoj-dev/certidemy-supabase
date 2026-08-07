-- 181_aims_f_publish.sql
-- Flip the AIMS-F JTA translations to reviewed, then publish the cert.
--
-- 1. is_provisional = false ON 80 ROWS (10 domain + 70 task).
--
--    This flag is an ATTESTATION, not a formatting switch. render-asset filters
--    translations on is_provisional = false, and the flag is row-level, so a
--    provisional domain row drops out COMPLETELY - the Spanish and Portuguese
--    blueprint and JTA sheets fall back to the ENGLISH title AND description.
--    A Spanish-speaking buyer downloading the blueprint gets a half-English
--    document. That is the visible consequence, and it is why this runs before
--    the status flip rather than after.
--
--    REVIEWED 2026-08-07. The ten domain rows were read in full. Rule 17 holds
--    in both languages (Capitulos / Secoes, never clausula). Terminology is
--    consistent with the lessons after the SGSIA correction in f5cd8c4. The 70
--    task statements were read in the FORCE=1 dry run output of the same date.
--
--    CACHE CAVEAT, from gen-jta-translations.mjs lines 46-48: neither PDF's
--    cache key includes a domain stamp, so flipping this flag does NOT refresh
--    an already-generated sheet. Verified before running: asset_downloads holds
--    zero rows for AIMS-F, so there is no cached sheet to invalidate. THIS DOES
--    NOT GENERALISE - a cert with existing assets needs render-asset fixed first.
--
-- 2. STATUS -> available.
--
--    AIMS-F: 35 lessons x 3 languages, 154/154 concepts taught, zero
--    untaught_testing_violations, 1,890 items with the secure firewall clean,
--    badge shipped, claim and description in three languages.
--
-- ASCII only.

begin;

update public.domain_translations dt
set is_provisional = false, updated_at = now()
from public.domains d
where d.id = dt.domain_id
  and d.certification_id = 'de046fa6-e627-48c1-85d8-9df226d144f4';

update public.task_translations tt
set is_provisional = false, updated_at = now()
from public.tasks t
where t.id = tt.task_id
  and t.certification_id = 'de046fa6-e627-48c1-85d8-9df226d144f4';

update public.certifications
set status = 'available', updated_at = now()
where code = 'AIMS-F';

commit;

-- ============================================================
-- VERIFICATION (run separately)
-- ============================================================
-- select
--   (select count(*) from domain_translations dt join domains d on d.id=dt.domain_id
--      where d.certification_id='de046fa6-e627-48c1-85d8-9df226d144f4'
--        and dt.is_provisional) as provisional_domains,
--   (select count(*) from task_translations tt join tasks t on t.id=tt.task_id
--      where t.certification_id='de046fa6-e627-48c1-85d8-9df226d144f4'
--        and tt.is_provisional) as provisional_tasks;
-- EXPECT 0 and 0
--
-- select code, name, status from public.certifications order by sort_order, code;
-- EXPECT AIMS-F available, and nine certs total
--
-- NOTE ksa_is_provisional is a SEPARATE column on task_translations and is NOT
-- touched here. The KSA fields are not rendered on the blueprint sheet and have
-- no approval path yet (open since HANDOFF v5.3).
