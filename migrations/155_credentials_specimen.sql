-- 155_credentials_specimen.sql
--
-- Adds the specimen flag to credentials and the filtered view that aggregate
-- reads must use instead of the base table.
--
-- WHY A VIEW AND NOT JUST A COLUMN:
--
-- A survey of the repos found that NOTHING aggregates credentials in SQL --
-- there is not one view over this table. Every count happens in TypeScript,
-- across roughly nine call sites in edge functions and app code. A boolean
-- column alone would mean nine independent places each remembering to filter,
-- and the first one that forgets produces a wrong admin number that looks
-- exactly like a working feature. That is the SD-AI-I-V-TEST-0001 failure
-- repeated on purpose.
--
-- v_credentials_real is one greppable name. A future counting site that reads
-- it is correct by default; one that reads `credentials` directly is at least
-- visibly making a choice.
--
-- THIS MIGRATION DOES NOT FINISH THE JOB. The call sites still have to be
-- pointed at the view -- see the checklist at the foot of this file. Until that
-- lands, no specimen credential may be minted.
--
-- Sites that must EXCLUDE specimens (read the view):
--   supabase/functions/_shared/census.ts
--   supabase/functions/get-governance-snapshot/index.ts
--   supabase/functions/list-credentials/index.ts
--   supabase/functions/get-company-detail/index.ts
--   certidemy-web/lib/console/credentials-list.ts
--   certidemy-web/lib/console/governance.ts
--   certidemy-web/lib/console/users-list.ts
--   certidemy-web/lib/console/company-detail.ts
--   certidemy-web/lib/dashboard/home.ts
--
-- Sites that must INCLUDE specimens (keep reading the base table):
--   supabase/functions/verify-credential/index.ts
--   supabase/functions/get-credential-certificate/index.ts
--   supabase/functions/credential-og/index.ts
--
-- Naturally safe, no change needed: anything scoped to auth.uid(), and anything
-- acting on a single credential id (revoke, restore, regenerate, update-name).

begin;

alter table public.credentials
  add column if not exists is_specimen boolean not null default false;

comment on column public.credentials.is_specimen is
  'Marketing specimen, not a real certification decision. Excluded from every '
  'count via v_credentials_real. verify-credential MUST branch on this and '
  'render a distinct state -- a specimen that verifies as valid is a fraud '
  'vector.';

-- Columns are enumerated rather than select * on purpose. A view built with
-- select * freezes its column list at creation time anyway, so the star buys
-- nothing and hides the fact that adding a column to credentials requires
-- rebuilding this view.
create or replace view public.v_credentials_real
with (security_invoker = true)
as
select id,
       credential_code,
       user_id,
       certification_id,
       exam_attempt_id,
       holder_name,
       certification_name,
       certification_code,
       score_pct,
       issued_at,
       expires_at,
       status,
       created_at,
       locale,
       certificate_path,
       credly_badge_id,
       credly_badge_url,
       jta_version_id
  from public.credentials
 where is_specimen = false;

comment on view public.v_credentials_real is
  'Credentials excluding marketing specimens. Every AGGREGATE read should use '
  'this. Rebuild it whenever a column is added to credentials -- the column '
  'list is fixed at creation.';

-- RLS is not a grant, and the grant is checked first. security_invoker means
-- the caller's policies on credentials still apply, so this widens nothing.
grant select on public.v_credentials_real to authenticated;

commit;

-- ---------------------------------------------------------------------------
-- Verification (separate statements)
-- ---------------------------------------------------------------------------
--
-- select count(*) from public.credentials;
-- select count(*) from public.v_credentials_real;
--   Expect equal today -- no specimens exist yet.
--
-- select relname, reloptions from pg_class where relname = 'v_credentials_real';
--   Expect {security_invoker=on}. NOTE: stored as 'on', not 'true'. Checking
--   for =true gives a false negative -- this cost a wrong conclusion in v3.2.
