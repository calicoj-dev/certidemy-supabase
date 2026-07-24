-- 143_credentials_update_grant.sql
--
-- update-credential-name failed with 42501, surfaced (misleadingly) as
-- "unattributable". The cause was NOT the trigger and NOT the RLS policy:
--
--   authenticated had SELECT on credentials but NO UPDATE grant.
--
-- The table grant is checked BEFORE RLS. With no UPDATE grant, the write is
-- denied at the grant layer and the platform-admin UPDATE policy from 142 is
-- never consulted. (This is the documented failure mode: "RLS is not a grant -
-- a missing grant produces a silent 42501 that failure-tolerant loaders
-- swallow.")
--
-- COLUMN-SCOPED ON PURPOSE. A table-wide GRANT UPDATE would re-confer every
-- column, including any deliberately withheld. The name-edit path writes exactly
-- two columns:
--   - holder_name      : the correction itself
--   - certificate_path : nulled by the 136 trigger to force a PDF regenerate
-- so the grant lists only those two. The 136 trigger still enforces that
-- holder_name is the only *decision-relevant* field that may change and that the
-- change is attributable; this grant just lets the verb run at all.
--
-- RLS continues to decide WHO (platform-admin policy, 142). The grant decides
-- WHETHER THE VERB IS ALLOWED. The trigger decides WHAT may change. Three
-- separate layers, each doing one job.

begin;

grant update (holder_name, certificate_path)
  on public.credentials
  to authenticated;

commit;
