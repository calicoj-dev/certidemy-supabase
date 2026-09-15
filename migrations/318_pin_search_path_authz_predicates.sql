-- 318_pin_search_path_authz_predicates.sql
--
-- Pin search_path on the two SECURITY DEFINER functions that decide
-- authorization: public.is_platform_admin() and public.is_team_admin_of(uuid).
--
-- 45 RLS POLICIES ACROSS 42 TABLES DEPEND ON THESE. Getting this wrong locks
-- someone out of their own platform or lets someone in, so the change is
-- self-verifying: behaviour is sampled BEFORE, the functions are replaced, and
-- behaviour is sampled AGAIN and compared. Any difference raises and the
-- transaction aborts, so nothing is committed on a changed answer.
--
-- ===================== WHAT THEY DO, READ FIRST =====================
--
--   is_platform_admin()  -- am I a platform admin
--       select exists (select 1 from public.profiles
--                      where id = auth.uid() and platform_role = 'platform_admin')
--
--   is_team_admin_of(target_user uuid)  -- am I a team_admin in a company that
--                                          target_user also belongs to
--       select exists (select 1 from public.team_members me
--                      join public.team_members them on them.company_id = me.company_id
--                      where me.user_id = auth.uid() and me.role = 'team_admin'
--                        and them.user_id = target_user)
--
-- ===================== THE RISK IS SMALLER THAN THE HEADLINE =====================
--
-- Stated plainly rather than overstated to justify the change: BOTH BODIES ARE
-- ALREADY FULLY QUALIFIED. public.profiles, public.team_members, auth.uid().
-- There is no unqualified table or function reference to shadow, so the classic
-- search_path attack has almost nothing to grip.
--
-- What the pin actually buys, in order of weight:
--
--   1. THE CALLER'S search_path CURRENTLY GOVERNS RESOLUTION. A definer function
--      without a pin inherits whatever search_path is active at call time. That
--      is the real dependency and it is invisible at the call site.
--   2. OPERATOR RESOLUTION. `platform_role = 'platform_admin'` resolves `=`
--      through search_path, and platform_role / team_role are ENUMS IN public --
--      so an operator on (public.platform_role, text) could plausibly outrank
--      the implicit coercion. With search_path = '' only pg_catalog is searched
--      and that route closes.
--   3. A later edit adding an unqualified name now fails loudly instead of
--      resolving to whatever happens to be in scope.
--
-- Context: anon holds CREATE on schema public (a Supabase platform default, not
-- granted by any migration here), which is what would supply an attacker with
-- somewhere to put a shadowing object. anon is NOLOGIN and PostgREST issues no
-- DDL, so that link does not exist today.
--
-- ===================== WHAT MUST NOT CHANGE =====================
--
-- STABLE IS PRESERVED AND ASSERTED. Losing it would make the planner call these
-- per row inside 45 policies -- a performance cliff that would read as load
-- rather than as this migration, and nobody would connect the two. It is checked
-- in the post-conditions for exactly that reason.
--
-- Also preserved: signatures, return type, language, SECURITY DEFINER, owner and
-- ACL. CREATE OR REPLACE keeps ownership and grants; that is asserted rather
-- than trusted.
--
-- ===================== THE GAP IN THE PROBE, STATED =====================
--
-- is_team_admin_of's TRUE BRANCH IS UNPROVEN, because this database contains no
-- input that produces true. Measured 2026-09-14: 2 team_members rows, 2 distinct
-- users, 2 companies, and ZERO pairs where a team_admin shares a company with
-- another member. Every existing input returns false.
--
-- So the probe does two things and claims only those:
--   - is_platform_admin is tested in BOTH directions (1 admin, 40 non-admins).
--   - is_team_admin_of is checked for AGREEMENT WITH THE PREDICATE IT WRAPS
--     across all 4 caller/target pairs that exist. All four are false, so this
--     proves the false branch and the plumbing -- not the true branch.
--
-- Nothing is synthesised to manufacture a true case. Writing rows into
-- team_members inside an authorization migration to test an authorization
-- function is a worse trade than an honestly stated gap.
--
-- Editor-first, and this file is ONE STATEMENT: paste the whole DO block. It has
-- no begin/commit because it does not need them -- a DO block is atomic on its
-- own, and any raise inside it rolls back the function replacements with it.

-- ===================== ONE STATEMENT, NO TEMP OBJECTS =====================
--
-- The first version kept the probe in a pg_temp table and a pg_temp function and
-- failed with 42P01, relation "pg_temp.authz_probe" does not exist. Two causes
-- are plausible -- pg_temp alias resolution inside the probe function, or the
-- editor not holding one backend across statements, since temp objects are
-- per-backend -- and I could not reproduce either from a read-only connection.
--
-- So the dependency is gone rather than guessed at. The temp table was
-- incidental to the shape, never part of it. THE SHAPE IS UNCHANGED: sample,
-- apply, resample, compare, abort on any difference.
--
-- Everything now lives in ONE DO block, which is atomic by itself and holds its
-- state in local variables. Nothing survives between statements because there is
-- only one statement.
--
-- THE PROBE IS STILL WRITTEN ONCE. A `for phase in 1..2` loop runs it twice and
-- applies the change between the passes. Two hand-written copies could differ,
-- and a comparison between two different measurements proves nothing.
--
-- AND THE SAMPLING CALLS GO THROUGH EXECUTE ON PURPOSE. A plpgsql plan cached in
-- pass 1 could otherwise be reused in pass 2 and report the OLD function's
-- answer -- a probe that cannot observe the change would pass unconditionally,
-- which is worse than no probe at all. EXECUTE plans each call fresh.

do $mig$
declare
  phase     int;
  v_admin   uuid;
  v_non     uuid;
  r         record;
  fn        boolean;
  inline    boolean;
  b1        boolean;
  b2        boolean;
  b3        boolean;
  b4        boolean;
  n         int;
  bad       int;
  sample    jsonb;
  s_before  jsonb;
  s_after   jsonb;
begin
  select id into v_admin from public.profiles
   where platform_role = 'platform_admin' limit 1;
  select id into v_non from public.profiles
   where platform_role is distinct from 'platform_admin' limit 1;

  if v_admin is null or v_non is null then
    raise exception 'authz probe cannot run'
      using detail = 'need one platform_admin and one non-admin in public.profiles',
            hint   = 'without both this cannot prove it changed nothing';
  end if;

  for phase in 1..2 loop

    -- ---------------------------------------------------- apply, between passes
    if phase = 2 then
      execute $ddl$
        create or replace function public.is_platform_admin()
        returns boolean
        language sql
        stable
        security definer
        set search_path = ''
        as $fn$
          select exists (
            select 1
              from public.profiles
             where id = auth.uid()
               and platform_role = 'platform_admin'::public.platform_role
          );
        $fn$
      $ddl$;

      execute $ddl$
        create or replace function public.is_team_admin_of(target_user uuid)
        returns boolean
        language sql
        stable
        security definer
        set search_path = ''
        as $fn$
          select exists (
            select 1
              from public.team_members me
              join public.team_members them on them.company_id = me.company_id
             where me.user_id = auth.uid()
               and me.role = 'team_admin'::public.team_role
               and them.user_id = target_user
          );
        $fn$
      $ddl$;
    end if;

    -- -------------------------------------------------------- the probe, once
    perform set_config('request.jwt.claims', json_build_object('sub', v_admin)::text, true);
    execute 'select public.is_platform_admin()' into b1;

    perform set_config('request.jwt.claims', json_build_object('sub', v_non)::text, true);
    execute 'select public.is_platform_admin()' into b2;

    perform set_config('request.jwt.claims', '', true);
    execute 'select public.is_platform_admin()' into b3;

    n := 0;
    bad := 0;
    for r in
      select me.user_id as caller, them.user_id as target
        from public.team_members me
       cross join public.team_members them
    loop
      perform set_config('request.jwt.claims', json_build_object('sub', r.caller)::text, true);
      execute 'select public.is_team_admin_of($1)' into fn using r.target;
      select exists (
        select 1
          from public.team_members a
          join public.team_members b on b.company_id = a.company_id
         where a.user_id = r.caller
           and a.role = 'team_admin'
           and b.user_id = r.target
      ) into inline;
      n := n + 1;
      if fn is distinct from inline then bad := bad + 1; end if;
    end loop;

    perform set_config('request.jwt.claims', '', true);
    execute 'select public.is_team_admin_of($1)' into b4
      using '00000000-0000-0000-0000-000000000000'::uuid;

    sample := jsonb_build_object(
      'admin_reads_true',          b1,
      'non_admin_reads_false',     b2,
      'no_jwt_reads_false',        b3,
      'team_pairs_probed',         n,
      'team_disagreements',        bad,
      'team_unknown_target_false', b4
    );

    if phase = 1 then s_before := sample; else s_after := sample; end if;
  end loop;

  -- ------------------------------------------------------------- the verdict
  if s_before is distinct from s_after then
    raise exception 'authz behaviour changed'
      using detail = 'before ' || s_before::text || ' after ' || s_after::text,
            hint   = 'the pin altered an answer; nothing is committed';
  end if;

  -- A probe that measured nothing must not read as a pass.
  if (s_after ->> 'team_pairs_probed')::int < 1 then
    raise exception 'authz probe covered no team pairs'
      using hint = 'team_members is empty; the agreement check proved nothing';
  end if;
  if (s_after ->> 'team_disagreements')::int <> 0 then
    raise exception 'is_team_admin_of disagrees with its own predicate'
      using detail = s_after::text;
  end if;
  if (s_after ->> 'admin_reads_true') <> 'true'
     or (s_after ->> 'non_admin_reads_false') <> 'false'
     or (s_after ->> 'no_jwt_reads_false') <> 'false' then
    raise exception 'is_platform_admin does not read as expected'
      using detail = s_after::text;
  end if;

  raise notice 'authz unchanged: %', s_after::text;
end
$mig$;

-- ===================== VERIFICATION =====================
--
-- The behaviour comparison above runs INSIDE the transaction and aborts on any
-- difference, so these confirm the settings the comparison cannot see.
--
-- 1. THE PIN, AND EVERYTHING THAT MUST NOT HAVE MOVED WITH IT.
--    Expect both rows: volatility s, definer t, owner postgres,
--    settings {search_path=""}.
--
--    volatility is in this list because losing STABLE would not change a single
--    answer -- the behaviour probe would pass -- while making the planner call
--    these per row inside 45 policies.
--
-- select p.proname,
--        p.provolatile              as volatility,   -- expect s
--        p.prosecdef                as is_definer,   -- expect t
--        pg_get_userbyid(p.proowner) as owner,       -- expect postgres
--        array_to_string(p.proconfig, ',') as settings   -- expect search_path=""
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public'
--    and p.proname in ('is_platform_admin','is_team_admin_of')
--  order by p.proname;
--
-- 2. THE ACL SURVIVED. CREATE OR REPLACE preserves grants; assert it rather
--    than trust it. Expect anon and authenticated true on both.
--
-- select p.proname, r as role, has_function_privilege(r, p.oid, 'EXECUTE') as can_call
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   cross join unnest(array['anon','authenticated','service_role']) r
--  where n.nspname = 'public'
--    and p.proname in ('is_platform_admin','is_team_admin_of')
--  order by p.proname, role;
--
-- 3. NOTHING ELSE IN public LOST ITS PIN. Expect 0 -- these two were the only
--    unpinned definer functions before this migration, so the count should now
--    be zero and stay there.
--
-- select count(*) as unpinned_definer_functions
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public' and p.prosecdef
--    and (p.proconfig is null
--         or not exists (select 1 from unnest(p.proconfig) c where c like 'search\_path=%'));
--
-- 4. THE POLICIES STILL REFERENCE THEM. Expect 45 across 42 tables -- this
--    migration changed function bodies, not policies, so a different number
--    means something else moved.
--
-- select count(*) as policies_referencing, count(distinct tablename) as tables_affected
--   from pg_policies
--  where schemaname = 'public'
--    and (coalesce(qual,'') like '%is_platform_admin%' or coalesce(with_check,'') like '%is_platform_admin%'
--      or coalesce(qual,'') like '%is_team_admin_of%'  or coalesce(with_check,'') like '%is_team_admin_of%');
--
-- ===================== WHAT REMAINS UNPROVEN =====================
--
-- is_team_admin_of returning TRUE. No input in this database produces it. When a
-- company first has a team_admin and a second member, re-run the agreement loop
-- above as a one-off read -- it needs no migration and it closes this gap:
--
-- select me.user_id, them.user_id,
--        public.is_team_admin_of(them.user_id) as fn   -- set the JWT claim first
--   from public.team_members me
--   join public.team_members them on them.company_id = me.company_id
--  where me.role = 'team_admin' and them.user_id <> me.user_id;
