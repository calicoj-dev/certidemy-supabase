-- ============================================================================
-- 380  retire_item and retire_item_bank are not for strangers
-- ============================================================================
--
-- Both are SECURITY DEFINER and both are executable by ANON. They retire
-- examination items -- one by id, one by whole certification and pool -- and
-- they run as the owner, so the table grants a caller lacks are not consulted.
--
-- WHAT ACTUALLY HOLDS THE PRIVILEGE, read from the ACL rather than assumed:
--
--   retire_item(uuid,text,uuid)             {=X/postgres, postgres=X, service_role=X}
--   retire_item_bank(uuid,text,text,uuid)   {=X/postgres, postgres=X, service_role=X}
--
-- The bare `=X` is PUBLIC. `anon` and `authenticated` appear nowhere in either
-- list: they hold EXECUTE through PUBLIC, which is the Postgres default for a
-- function and is exactly what 378 got wrong on its first attempt. Revoking
-- from anon and authenticated alone removes nothing at all and the
-- post-condition fails against a database the migration did not change.
--
-- ============================================================================
-- CALLERS: none. Grepped, both repos.
-- ============================================================================
--
-- No edge function, no script, no RPC and no trigger calls either one. The
-- only references in either repository are:
--
--   migrations/089_item_lifecycle.sql   creates them, grants service_role
--   migrations/089 line 105             a trigger HINT naming retire_item as
--                                       the way to remove a served item
--   migrations/298, 300, 301            writer lists that name them
--   jta/ASSESSMENT-ENGINE.md            "ever presented -> retire_item() only"
--
-- So the documented retirement path is a function a person runs by hand, and
-- the person who runs it is postgres or service_role. service_role's grant
-- therefore STAYS, granted explicitly by 089 and untouched here. Nothing is
-- granted back, because nothing was taken from it.
--
-- ============================================================================
-- AND NEITHER FUNCTION HAS EVER WORKED, WHICH IS REPORTED, NOT FIXED HERE
-- ============================================================================
--
-- Both set `status = 'retired'`. Migration 003 created that column with
--
--   check (status in ('pending_review','approved','rejected'))
--
-- 86 migrations before 089 was written. So any call that matches a row raises
-- 23514 and rolls back; `retire_item` on a missing id raises P0001 instead.
-- Measured: 0 rows carry status 'retired', and the 464 rows that DO carry a
-- `retired_at` are all 'approved' or 'rejected' -- they were retired by SQL
-- someone wrote by hand, never through these.
--
-- That is fail-closed by accident and it is why an anon-executable bulk
-- retirement has not cost anything. It is not a reason to leave it reachable:
-- the day somebody repairs the function is the day the hole opens, and the
-- repair will look like a bug fix rather than a privilege change.
--
-- Repairing them is a separate decision with a real question in it -- whether
-- a retired item keeps its review status or gains a fourth one -- and it does
-- not belong in a migration whose subject is who may call them.
--
-- ============================================================================
-- ONE STATEMENT, because the post-conditions must be able to undo the revokes
-- ============================================================================
--
-- A `begin; ... commit;` in a file states an INTENT. Whether the SQL editor and
-- the pooler honour it as one transaction on one backend is a separate fact, and
-- a post-condition that cannot roll back its own writes is a comment. One DO
-- block is one statement, and one statement is one transaction under every
-- pooling mode.
--
-- The post-conditions see their own writes, which is the point: 366 recorded two
-- instruments disagreeing because one ran inside the transaction and the other
-- after its rollback. Every failure below names the OFFENDING SET with
-- string_agg rather than counting it, because a count cannot be reconciled
-- across two states and a name can.
-- ============================================================================

do $mig$
declare
  v_public   text;
  v_anon     text;
  v_auth     text;
  v_svc      text;
  v_invoker  text;
  v_found    int;
begin
  -- ---------------------------------------------------------------- PRE
  select count(*) into v_found
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.oid::regprocedure::text in
      ('retire_item(uuid,text,uuid)', 'retire_item_bank(uuid,text,text,uuid)');

  if v_found <> 2 then
    raise exception using
      message = 'expected both retire functions at their known signatures',
      detail  = 'found ' || v_found || ' of 2',
      hint    = 'a changed signature is a different function: re-read pg_proc';
  end if;

  -- ---------------------------------------------------------------- REVOKE
  -- PUBLIC first and by name, because PUBLIC is what holds it. anon and
  -- authenticated are named too: they hold nothing directly today, and a
  -- revoke of a privilege that is not held is a no-op rather than an error, so
  -- naming them costs nothing and closes a direct grant made later by hand.
  execute 'revoke execute on function public.retire_item(uuid,text,uuid) from public, anon, authenticated';
  execute 'revoke execute on function public.retire_item_bank(uuid,text,text,uuid) from public, anon, authenticated';

  -- ---------------------------------------------------------------- POST, negative half
  select string_agg(p.oid::regprocedure::text, ', ' order by p.oid::regprocedure::text)
    into v_public
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  cross join aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) as a
  where n.nspname = 'public'
    and p.proname in ('retire_item', 'retire_item_bank')
    and a.privilege_type = 'EXECUTE'
    and a.grantee = 0;

  if v_public is not null then
    raise exception using
      message = 'PUBLIC still holds EXECUTE, so every role inherits it',
      detail  = v_public;
  end if;

  select string_agg(p.oid::regprocedure::text, ', ') into v_anon
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname in ('retire_item', 'retire_item_bank')
    and has_function_privilege('anon', p.oid, 'EXECUTE');

  if v_anon is not null then
    raise exception using
      message = 'still executable by anon',
      detail  = v_anon,
      hint    = 'has_function_privilege resolves membership: check pg_read_all_data and grants';
  end if;

  select string_agg(p.oid::regprocedure::text, ', ') into v_auth
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname in ('retire_item', 'retire_item_bank')
    and has_function_privilege('authenticated', p.oid, 'EXECUTE');

  if v_auth is not null then
    raise exception using
      message = 'still executable by authenticated',
      detail  = v_auth;
  end if;

  -- ---------------------------------------------------------------- POST, positive half
  -- Without this, a revoke that took service_role with it passes every
  -- assertion above. Asserting only that a door is shut passes on a building
  -- with no doors.
  select string_agg(p.oid::regprocedure::text, ', ') into v_svc
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname in ('retire_item', 'retire_item_bank')
    and not has_function_privilege('service_role', p.oid, 'EXECUTE');

  if v_svc is not null then
    raise exception using
      message = 'service_role LOST execute -- the retirement path is now closed to everyone',
      detail  = v_svc,
      hint    = '089 granted it explicitly; this migration must not remove it';
  end if;

  -- SECURITY DEFINER is unchanged. A revoke cannot alter it, so this is the
  -- checksum half: it asserts what the migration was not authorised to touch.
  select string_agg(p.oid::regprocedure::text, ', ') into v_invoker
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname in ('retire_item', 'retire_item_bank')
    and not p.prosecdef;

  if v_invoker is not null then
    raise exception using
      message = 'a retire function is no longer SECURITY DEFINER',
      detail  = v_invoker;
  end if;

  raise notice '380 ok: PUBLIC, anon and authenticated revoked from both retire functions';
  raise notice '380 ok: service_role keeps EXECUTE on both, both still SECURITY DEFINER';
end
$mig$;

-- ============================================================================
-- What a reader should be able to confirm afterwards, as a bare query:
--
--   select p.oid::regprocedure::text,
--          p.proacl::text,
--          has_function_privilege('anon', p.oid, 'EXECUTE')         as anon,
--          has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth,
--          has_function_privilege('service_role', p.oid, 'EXECUTE')  as svc
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and p.proname in ('retire_item','retire_item_bank');
--
-- Expected: no bare `=X` in the ACL, anon false, auth false, svc true.
-- ============================================================================
