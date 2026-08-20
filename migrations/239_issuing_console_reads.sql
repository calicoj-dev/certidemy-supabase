-- 239_issuing_console_reads.sql
--
-- Lets the console read the issuing tables directly.
--
-- ============================ THE BUG THIS FIXES ==========================
--
-- /console/issuing rendered the "you could be issuing" pitch to a
-- platform_admin who owns two issuers. loadIssuing is failure-tolerant by
-- design -- any query error degrades to an empty section rather than throwing,
-- because a console page should render thin rather than 500 -- so a 42501
-- looked exactly like "no issuers yet".
--
-- Migration 185 revoked public.issuers from authenticated with the note "no
-- client role reads this table directly". That was true then. It is not now:
-- a partner has to see their own issuer, and a page that has to round-trip
-- through an edge function to render a list is a page with a spinner on it.
--
-- ============================ GRANT FIRST, THEN RLS =======================
--
-- The table-level GRANT is checked BEFORE row-level security. Policies alone
-- would change nothing here, because 185 revoked the grant outright. Both are
-- required, and the grant is the part that gets forgotten because RLS is the
-- part people think about.
--
-- ============================ COLUMN-SCOPED, DELIBERATELY ================
--
-- A table-wide GRANT SELECT confers EVERY column, including ones added later,
-- and silently overrides any column-level REVOKE. So these grants name their
-- columns.
--
-- Never granted:
--   issuers.vault_secret_id        pointer to the signing key
--   issuer_api_keys.key_hash       the only stored form of a live key
--   issuer_webhooks.secret_id      pointer to the HMAC secret
--
-- A new column on any of these tables is NOT readable until somebody adds it
-- here, which is the correct default.
--
-- verification_token IS granted: a partner needs it to publish their
-- well-known file, and control of that path is the proof rather than knowledge
-- of the string. It is scoped to their own issuer by the policy below.
--
-- ============================ ONE PREDICATE ==============================
--
-- Every policy delegates to can_read_issuer(). Five hand-written predicates
-- would be five chances to disagree, and the one that drifts is the one that
-- leaks. It mirrors lib/console/access.ts and _shared/authorize.ts: three
-- layers, one rule.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).

begin;

-- ============================================================ 1. the predicate
create or replace function public.can_read_issuer(p_issuer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select
    -- platform_admin sees every issuer.
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.platform_role = 'platform_admin'
    )
    -- or the team_admin of the company that owns THIS issuer. Scoped, not
    -- global: holding the role at company A is not permission to read company
    -- B's keys.
    or exists (
      select 1
      from public.issuers i
      join public.team_members tm on tm.company_id = i.company_id
      where i.id = p_issuer_id
        and i.company_id is not null
        and tm.user_id = auth.uid()
        and tm.role = 'team_admin'
    );
$function$;

comment on function public.can_read_issuer(uuid) is
  'True when the caller is platform_admin, or the team_admin of the company that owns this issuer. The single predicate behind every issuing RLS policy.';

revoke all on function public.can_read_issuer(uuid) from public, anon;
grant execute on function public.can_read_issuer(uuid) to authenticated, service_role;

-- ============================================================ 2. issuers
grant select (
  id, slug, name, site_url, issuer_url, key_id, public_key_multibase,
  public_key_jwk, key_created_at, is_active, status, company_id,
  verification_domain, verification_token, verified_at, activated_at,
  created_at, updated_at
) on public.issuers to authenticated;

drop policy if exists issuers_console_read on public.issuers;
create policy issuers_console_read on public.issuers
  for select to authenticated
  using (public.can_read_issuer(id));

-- ============================================================ 3. achievements
grant select on public.achievements to authenticated;
grant select on public.achievement_alignments to authenticated;
grant select on public.achievement_results to authenticated;

alter table public.achievements enable row level security;
alter table public.achievement_alignments enable row level security;
alter table public.achievement_results enable row level security;

-- An achievement is a PUBLIC definition once active: open-badge serves it
-- anonymously at /issuers/<slug>/achievements/<code>. Restricting the row
-- while the document is world-readable would be theatre. Drafts are the
-- exception -- a draft is not a published claim.
drop policy if exists achievements_read on public.achievements;
create policy achievements_read on public.achievements
  for select to authenticated
  using (status = 'active' or public.can_read_issuer(issuer_id));

drop policy if exists achievement_alignments_read on public.achievement_alignments;
create policy achievement_alignments_read on public.achievement_alignments
  for select to authenticated
  using (
    exists (
      select 1 from public.achievements a
      where a.id = achievement_id
        and (a.status = 'active' or public.can_read_issuer(a.issuer_id))
    )
  );

drop policy if exists achievement_results_read on public.achievement_results;
create policy achievement_results_read on public.achievement_results
  for select to authenticated
  using (
    exists (
      select 1 from public.achievements a
      where a.id = achievement_id
        and (a.status = 'active' or public.can_read_issuer(a.issuer_id))
    )
  );

-- ============================================================ 4. api keys
-- key_hash is NOT in this list and must never be. It is the only stored form
-- of a live key; a hash in a page is a hash in a browser's memory for no
-- reason at all.
grant select (
  id, issuer_id, name, key_prefix, scopes, environment,
  last_used_at, expires_at, revoked_at, created_by, created_at
) on public.issuer_api_keys to authenticated;

drop policy if exists issuer_api_keys_read on public.issuer_api_keys;
create policy issuer_api_keys_read on public.issuer_api_keys
  for select to authenticated
  using (public.can_read_issuer(issuer_id));

-- ============================================================ 5. webhooks
-- secret_id excluded: it points at the HMAC secret in Vault.
grant select (
  id, issuer_id, url, events, is_active, failure_count, disabled_at,
  created_by, created_at, updated_at
) on public.issuer_webhooks to authenticated;

drop policy if exists issuer_webhooks_read on public.issuer_webhooks;
create policy issuer_webhooks_read on public.issuer_webhooks
  for select to authenticated
  using (public.can_read_issuer(issuer_id));

grant select on public.webhook_deliveries to authenticated;

drop policy if exists webhook_deliveries_read on public.webhook_deliveries;
create policy webhook_deliveries_read on public.webhook_deliveries
  for select to authenticated
  using (
    exists (
      select 1 from public.issuer_webhooks w
      where w.id = webhook_id and public.can_read_issuer(w.issuer_id)
    )
  );

commit;

-- Verification (run separately, one at a time):
--
--   select has_table_privilege('authenticated', 'public.issuers', 'SELECT') as tbl,
--          has_column_privilege('authenticated', 'public.issuers', 'slug', 'SELECT') as slug_ok,
--          has_column_privilege('authenticated', 'public.issuers', 'vault_secret_id', 'SELECT') as vault_LEAK;
--   -- slug_ok true, vault_LEAK FALSE. The third column is the one that matters.
--
--   select has_column_privilege('authenticated', 'public.issuer_api_keys', 'key_prefix', 'SELECT') as prefix_ok,
--          has_column_privilege('authenticated', 'public.issuer_api_keys', 'key_hash', 'SELECT')   as hash_LEAK,
--          has_column_privilege('authenticated', 'public.issuer_webhooks', 'secret_id', 'SELECT')  as secret_LEAK;
--   -- prefix_ok true, both LEAK columns FALSE.
--
--   select tablename, policyname from pg_policies
--   where schemaname = 'public'
--     and tablename in ('issuers','achievements','achievement_alignments',
--                       'achievement_results','issuer_api_keys',
--                       'issuer_webhooks','webhook_deliveries')
--   order by tablename;
--   -- seven rows
--
-- THE REAL TEST is the page: /console/issuing as platform_admin must now show
-- the issuer picker rather than the "you could be issuing" pitch. If it still
-- shows the pitch, the loader is still swallowing an error -- comment out the
-- `if (issuerErr) return EMPTY(access)` line locally and read what it says.
