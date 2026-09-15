-- 326_oauth_issuer_bindings.sql
--
-- "This token reads as THIS issuer." The table the /oauth/consent screen in
-- ../certidemy-web writes before it approves a grant, and the table a custom
-- access token hook will later read to put the issuer on the JWT.
--
-- ===================== THE SHAPE CAME FROM THE OTHER REPO =====================
--
-- The DDL is transcribed from the block at the bottom of
-- `certidemy-web/lib/oauth/issuer-binding.ts`, which is the half that already
-- ships and already writes. Columns, primary key and both foreign keys are
-- exactly as handed over. Three things were CHANGED and one was ADDED; all four
-- are named below rather than folded in silently, because a migration that
-- quietly disagrees with the file that specified it is how a mirrored pair
-- starts drifting on day one.
--
-- ===================== CHANGE 1: THE POLICY COULD NOT HAVE WORKED =====================
--
-- THIS IS THE EXPENSIVE ONE. The drafted WITH CHECK reads:
--
--     exists (select 1
--               from public.issuers i
--               join public.team_members tm on tm.company_id = i.company_id
--              where i.id = oauth_issuer_bindings.issuer_id
--                and tm.user_id = auth.uid()
--                and tm.role = 'team_admin')
--
-- A policy expression is evaluated AS THE CALLING ROLE. Measured against the
-- live database on 2026-09-15:
--
--     has_table_privilege('authenticated', 'public.issuers', 'SELECT')  =  FALSE
--     has_table_privilege('authenticated', 'public.team_members', 'SELECT') = true
--
-- `authenticated` cannot read public.issuers AT ALL, and public.issuers also has
-- RLS enabled on top of that. So the subquery raises
--
--     42501  permission denied for table issuers
--
-- on EVERY insert. recordIssuerBinding would return false, approveAction would
-- take the `binding_failed` branch, and the consent screen would refuse for
-- every partner, forever.
--
-- CLAUDE.md: "RLS is not a grant. The table-level grant is checked BEFORE
-- row-level security." The rule is usually about the table being protected. Here
-- it bites on a table the POLICY READS, which is a quieter place for it to sit:
-- nothing about `oauth_issuer_bindings` is wrong, and the failure is attributed
-- to it anyway.
--
-- AND IT WOULD HAVE BEEN MISREAD. issuer-binding.ts logs the full PostgREST
-- error precisely because "the table does not exist yet" and "a permissions
-- failure" are indistinguishable from the page. A 42501 naming `issuers` on a
-- statement that inserts into `oauth_issuer_bindings` points at neither.
--
-- THE FIX IS THE ONE THIS SCHEMA ALREADY USES. `is_platform_admin()` and
-- `is_team_admin_of()` exist as SECURITY DEFINER predicates for exactly this
-- reason: an authorization question that has to read tables the caller cannot.
-- So the rule moves into `public.can_bind_issuer(uuid)`, definer-owned,
-- search_path pinned the way 318 pinned the other two, and the policy calls it.
--
-- ===================== CHANGE 2: platform_admin IS ADMITTED, ON PURPOSE =====================
--
-- The draft says, in terms, "this policy does not admit platform_admin while
-- resolveBindableIssuers does -- decide that deliberately."
--
-- DECIDED: platform_admin is admitted, because the alternative is a page that
-- offers a choice the database then refuses. `resolveBindableIssuers` returns
-- every issuer for a platform_admin, and it does so because `requireIssuerAccess`
-- in functions/_shared/authorize.ts returns `{role: "platform_admin"}` before it
-- looks at any company. Three surfaces now state one rule and this is the third;
-- the one that disagreed would be the one nobody tested.
--
-- WHAT IT IS NOT: a way to write a binding for someone else. `user_id =
-- auth.uid()` is outside the OR and applies to every caller. A platform_admin
-- may bind THEIR OWN token to a partner's issuer -- which is a real capability,
-- granted knowingly, and the thing that makes it defensible is that the token
-- is theirs and the audit trail is the row.
--
-- ===================== CHANGE 3: THE GRANTS ARE NARROWER THAN `for all` =====================
--
-- The policy is `for all`, as drafted. The GRANT is not: authenticated gets
-- SELECT, INSERT and UPDATE -- the three an upsert needs -- and NOT DELETE.
-- Nothing revokes a binding today. 322's header put it best about a login role
-- with no caller; a DELETE privilege with no caller is the same thing, and it is
-- one line to add when a revoke path is written.
--
-- anon is revoked explicitly rather than left to default privileges, and the
-- post-conditions assert it.
--
-- ===================== ADDITION: updated_at WOULD HAVE BEEN A LIE =====================
--
-- `updated_at timestamptz not null default now()` is in the draft. The only
-- writer upserts four columns and does not touch it, so `on conflict do update`
-- leaves it at the original insert time -- a column named updated_at that
-- records creation, which is worse than not having one.
--
-- public.set_updated_at() already exists (recorded by 246) and nine triggers use
-- it. A tenth costs nothing and makes the column true.
--
-- ===================== WRITERS OF THIS TABLE =====================
--
-- Grepped across BOTH repos for `oauth_issuer_bindings` and `BINDING_TABLE` on
-- 2026-09-15. Exactly one writer exists:
--
--   certidemy-web/lib/oauth/issuer-binding.ts  recordIssuerBinding()
--     upsert on (user_id, client_id) writing user_id, client_id, issuer_id,
--     authorization_id. Every NOT NULL column without a default is written.
--
--   supabase/ -- no writer, no reader. The access token hook does not exist yet.
--
-- No writer in this repo means no edge function to update when a column is
-- added, and that is worth stating because the reverse case is what CLAUDE.md's
-- five-inserts rule is about. The list has one entry today and it lives in the
-- other repo.
--
-- ===================== client_id IS auth.oauth_clients.id, UNREFERENCED =====================
--
-- Verified: auth.oauth_clients.id is uuid, so the drafted `client_id uuid` is
-- the right type and an insert cannot 22P02 on it.
--
-- NO FOREIGN KEY, as drafted. auth.oauth_clients is soft-deleted (`deleted_at`),
-- so an FK would only ever fire on a hard delete of a Supabase-managed row. The
-- primary key (user_id, client_id) deliberately mirrors
-- auth.oauth_consents_user_client_unique, which is the pair the token exchange
-- already uses to find a consent -- so the binding is found by the same key the
-- grant is.
--
-- ===================== THE READ PATH FOR A HOOK THAT DOES NOT EXIST =====================
--
-- A Postgres custom access token hook runs as `supabase_auth_admin`, which today
-- holds no privilege on anything in public. Its SELECT grant and its policy are
-- created here, with the table, because the alternative is a hook migration that
-- looks complete, returns no claim, and is debugged as a hook bug.
--
-- It is inert until a hook exists: supabase_auth_admin is not a login role for
-- anything else and reads nothing on its own.

-- ===================== STATE: RAN 2026-09-15 =====================
--
-- RAN, and the consent screen wrote through it end to end: one row in
-- oauth_issuer_bindings, inserted by `authenticated` through can_bind_issuer.
-- The paragraph below is preserved as written, before it ran.
--
-- [Superseded 2026-09-15: it has since run.] Not executed. A rollback-only rehearsal of the whole block was attempted and
-- REFUSED -- the MCP connection is a read-only transaction (25006 on the CREATE
-- TABLE) -- so the plpgsql below has been read and not run. Editor-first, as
-- always; this file becomes a record when it lands.
--
-- What WAS verified read-only, on 2026-09-15:
--
--   * PostgreSQL 17.6, so `grant ... with set true` (PG16+) parses. 322 already
--     relies on it.
--   * The predicate inside can_bind_issuer, evaluated against live rows:
--     TRUE for the one team_admin who owns an issuer against that issuer,
--     FALSE for the same person against an issuer they do not own. Both
--     fixtures exist, so probes 1 and 2 will actually run rather than report
--     UNPROVEN.
--   * has_table_privilege('authenticated','public.issuers','SELECT') is FALSE,
--     which is the whole of CHANGE 1 above.
--
-- What that does NOT prove: that the POLICY behaves the way the predicate does.
-- The predicate was evaluated as the migration runner, not as `authenticated`
-- under RLS. Only the probes inside the block test that, and only when it runs.

begin;

do $mig$
declare
  v_user       uuid;
  v_issuer_ok  uuid;
  v_issuer_bad uuid;
  v_other      uuid;
  n            integer;
  blocked      boolean;
  proven       text := '';
begin

  -- ------------------------------------------------------------------ table

  create table public.oauth_issuer_bindings (
    user_id          uuid not null references auth.users(id) on delete cascade,
    client_id        uuid not null,
    issuer_id        uuid not null references public.issuers(id) on delete cascade,
    authorization_id text not null,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),
    primary key (user_id, client_id)
  );

  comment on table public.oauth_issuer_bindings is
    'Which issuer an OAuth grant reads as. Written by the consent screen, read by the access token hook.';

  create trigger set_updated_at
    before update on public.oauth_issuer_bindings
    for each row execute function public.set_updated_at();

  -- ------------------------------------------------- the rule, in one place

  -- SECURITY DEFINER because the caller cannot read public.issuers and must not
  -- be granted it just to satisfy a policy. Mirrors requireIssuerAccess:
  -- platform_admin first and unscoped, then team_admin scoped to the company
  -- that owns THIS issuer.
  --
  -- An issuer with a NULL company_id is reachable by no team_admin, which is the
  -- certidemy issuer itself and is the same answer authorize.ts gives.
  create or replace function public.can_bind_issuer(p_issuer_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = ''
  as $fn$
    select public.is_platform_admin()
        or exists (
             select 1
               from public.issuers i
               join public.team_members tm on tm.company_id = i.company_id
              where i.id = p_issuer_id
                and tm.user_id = auth.uid()
                and tm.role = 'team_admin'::public.team_role
           );
  $fn$;

  comment on function public.can_bind_issuer(uuid) is
    'May the current user bind a token to this issuer. SQL half of requireIssuerAccess.';

  -- ------------------------------------------------------------------- rls

  alter table public.oauth_issuer_bindings enable row level security;

  -- USING gates the row, WITH CHECK gates the issuer. A person may always see
  -- and replace their own binding; they may only ever POINT it at an issuer they
  -- hold.
  create policy oauth_issuer_bindings_own on public.oauth_issuer_bindings
    for all to authenticated
    using (user_id = auth.uid())
    with check (
      user_id = auth.uid()
      and public.can_bind_issuer(issuer_id)
    );

  -- The hook's read path. Inert until a hook exists.
  create policy oauth_issuer_bindings_auth_admin on public.oauth_issuer_bindings
    for select to supabase_auth_admin
    using (true);

  -- ---------------------------------------------------------------- grants

  grant select, insert, update on public.oauth_issuer_bindings to authenticated;
  grant select on public.oauth_issuer_bindings to supabase_auth_admin;
  revoke all on public.oauth_issuer_bindings from anon;

  -- ============ PROVEN BY DOING, NOT BY READING pg_catalog ============
  --
  -- The property is about a PERSON, so a person has to attempt it. Reading the
  -- policy back out of pg_policy would have passed just as cleanly against the
  -- drafted version that cannot execute -- which is the entire reason this file
  -- has a "CHANGE 1" section.

  execute format('grant authenticated to %I with set true', current_user);

  select tm.user_id, i.id
    into v_user, v_issuer_ok
    from public.team_members tm
    join public.issuers i on i.company_id = tm.company_id
   where tm.role = 'team_admin'::public.team_role
   limit 1;

  if v_user is null then
    raise notice 'UNPROVEN: no team_admin owns an issuer, so no probe ran';
  else
    select i.id into v_issuer_bad
      from public.issuers i
     where not exists (
             select 1 from public.team_members tm
              where tm.user_id = v_user
                and tm.company_id = i.company_id
                and tm.role = 'team_admin'::public.team_role)
     limit 1;

    select p.id into v_other
      from public.profiles p
     where p.id <> v_user
     limit 1;

    execute format('set local request.jwt.claims = %L',
                   json_build_object('sub', v_user, 'role', 'authenticated')::text);

    -- 1. THE POSITIVE HALF. Without it every refusal below is also what a
    --    policy that refuses everyone produces.
    execute 'set local role authenticated';
    insert into public.oauth_issuer_bindings
      (user_id, client_id, issuer_id, authorization_id)
    values
      (v_user, '00000000-0000-4000-8000-000000000001', v_issuer_ok, 'probe');
    execute 'reset role';

    select count(*) into n from public.oauth_issuer_bindings
     where user_id = v_user;
    if n <> 1 then
      raise exception 'the holder of an issuer could not write a binding'
        using detail = 'expected 1 row', hint = 'nothing is committed';
    end if;
    proven := proven || 'own-issuer-insert ';

    -- 2. AN ISSUER THEY DO NOT HOLD. The negative half, and the one the drafted
    --    policy would have failed for the wrong reason.
    if v_issuer_bad is null then
      raise notice 'UNPROVEN: every issuer belongs to this user, no refusal probe';
    else
      blocked := false;
      begin
        execute 'set local role authenticated';
        insert into public.oauth_issuer_bindings
          (user_id, client_id, issuer_id, authorization_id)
        values
          (v_user, '00000000-0000-4000-8000-000000000002', v_issuer_bad, 'probe');
        execute 'reset role';
      exception when insufficient_privilege then
        blocked := true;
      end;
      execute 'reset role';
      if not blocked then
        raise exception 'a token was bound to an issuer the caller does not hold'
          using hint = 'with check is open; nothing is committed';
      end if;
      proven := proven || 'foreign-issuer-refused ';
    end if;

    -- 3. SOMEONE ELSE'S BINDING. user_id is outside the OR for every caller.
    if v_other is null then
      raise notice 'UNPROVEN: only one profile exists, no impersonation probe';
    else
      blocked := false;
      begin
        execute 'set local role authenticated';
        insert into public.oauth_issuer_bindings
          (user_id, client_id, issuer_id, authorization_id)
        values
          (v_other, '00000000-0000-4000-8000-000000000003', v_issuer_ok, 'probe');
        execute 'reset role';
      exception when insufficient_privilege then
        blocked := true;
      end;
      execute 'reset role';
      if not blocked then
        raise exception 'a binding was written for another user'
          using hint = 'nothing is committed';
      end if;
      proven := proven || 'impersonation-refused ';
    end if;

    -- The probe row is removed as owner. authenticated holds no DELETE, which
    -- is itself the reason this cannot be done in the role above.
    delete from public.oauth_issuer_bindings where authorization_id = 'probe';
    select count(*) into n from public.oauth_issuer_bindings;
    if n <> 0 then
      raise exception 'probe rows survived cleanup'
        using detail = 'the table must be empty on creation';
    end if;
  end if;

  -- 4. anon reaches nothing. Asserted rather than assumed, because default
  --    privileges in this project are not this migration's to know.
  if has_table_privilege('anon', 'public.oauth_issuer_bindings', 'SELECT')
     or has_table_privilege('anon', 'public.oauth_issuer_bindings', 'INSERT') then
    raise exception 'anon holds a privilege on oauth_issuer_bindings';
  end if;

  -- 5. The hook's role can read. Catalogue-only: supabase_auth_admin cannot be
  --    assumed from here, and there is no hook to exercise yet. Named as the
  --    weaker check it is.
  if not has_table_privilege('supabase_auth_admin',
                             'public.oauth_issuer_bindings', 'SELECT') then
    raise exception 'supabase_auth_admin cannot read the binding table';
  end if;

  raise notice 'proven by doing: %', proven;
  raise notice 'supabase_auth_admin SELECT checked against the catalogue only';
end
$mig$;

commit;

-- ===================== VERIFICATION =====================
--
-- Each block independently copyable.
--
--   select relrowsecurity, relforcerowsecurity
--     from pg_class c join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public' and c.relname = 'oauth_issuer_bindings';
--   -- expect: t, f
--
--   select polname, polcmd, pg_get_expr(polqual, polrelid) as using_expr,
--          pg_get_expr(polwithcheck, polrelid) as check_expr
--     from pg_policy where polrelid = 'public.oauth_issuer_bindings'::regclass
--    order by polname;
--   -- expect two rows; the `own` policy's check calls can_bind_issuer
--
--   select proname, prosecdef, provolatile, proconfig
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.proname = 'can_bind_issuer';
--   -- expect: t, s, {search_path=""}
--
--   select grantee, privilege_type
--     from information_schema.role_table_grants
--    where table_schema = 'public' and table_name = 'oauth_issuer_bindings'
--    order by grantee, privilege_type;
--   -- expect authenticated: INSERT, SELECT, UPDATE (no DELETE); no anon row
--
-- ===================== WHAT IS STILL MISSING =====================
--
-- THE CLAIM DOES NOT REACH THE TOKEN YET. This table is written and read by
-- nothing in this repo. The hook that puts `issuer_id` on the JWT is a separate
-- migration plus a dashboard toggle, and until both exist the consent screen
-- records a choice that no token carries.
--
-- That is the same half-a-pair state issuer-binding.ts describes from the other
-- side, moved one step along: the write now lands instead of failing.
