-- 323_mcp_resolve_api_key.sql
--
-- The edge function resolves an API key's scopes ITSELF, so that no caller can
-- assert a scope by typing one.
--
-- ===================== WHY THIS EXISTS =====================
--
-- courseware-read is a PUBLIC endpoint (verify_jwt = false). The Worker is one
-- caller of it, not a gatekeeper in front of it: anyone can POST to the function
-- directly, which is how the smoke test has always reached it.
--
-- So a design where the Worker checks the key and passes `scope:
-- "courseware:lessons"` in the body gives the function NOTHING IT CAN CHECK. A
-- field naming a permission is worth exactly as much as the least trustworthy
-- party who can set it, and that party is anyone with curl.
--
-- The repair is not to authenticate the assertion. It is TO STOP ACCEPTING ONE.
-- The function takes the presented key, hashes it, and asks the database what
-- that key may do. The answer comes from a row, not from a request.
--
-- ===================== WHY A DEFINER FUNCTION =====================
--
-- mcp_reader has no grant on public.issuer_api_keys and must not get one:
-- SELECT on that table is SELECT on every partner's key hash and scope set, for
-- a role whose whole point is that it can reach almost nothing.
--
-- This function is the one question mcp_reader may ask of it -- "what does THIS
-- hash authorise" -- answerable only by someone who already holds the key. It
-- cannot enumerate, cannot list, and never returns key_hash.
--
-- A THIRD ROLE OWNS IT. mcp_logger owns mcp.log_request and has INSERT on
-- mcp_requests; making it the owner here would hand the telemetry writer read
-- access to every credential on the platform, which is how definer owners
-- quietly accumulate. mcp_authz owns this and nothing else, with a
-- COLUMN-SCOPED select on six columns rather than the table.
--
-- ===================== THE ORDERING PROPERTY =====================
--
-- The connection that DECIDES whether a lesson may be read is provably INCAPABLE
-- OF READING ONE. Authorization resolves on the mcp_reader pool, which 315 and
-- 322 leave with no grant on mcp.lesson; only after it passes does the function
-- reach for the mcp_holder pool. A bug anywhere in the authorization path
-- therefore cannot leak a body -- the credential in hand at that moment cannot
-- fetch one.
--
-- ===================== WHAT THIS DELIBERATELY DOES NOT DO =====================
--
-- IT DOES NOT TOUCH last_used_at. That column is how an operator decides a key
-- is dormant, so leaving it stale means courseware keys look unused and become
-- candidates for revocation while serving live traffic. Named here rather than
-- fixed here: a function that decides authorization should have one job, and
-- the update belongs with a considered decision about write volume on a table
-- this path reads on every lesson request. THE GAP IS REAL AND IT IS OPEN.
--
-- It also does not rate-limit. A caller may present unlimited wrong keys.
-- Forging one means finding a sha256 preimage, so this is a cost question
-- rather than a break, and it is the same exposure issue-partner-credential
-- has had since it shipped.
--
-- ===================== CALLERS =====================
--
-- Every reader of issuer_api_keys, as of this migration. Named because an
-- authorization surface with an unlisted caller is the mirrored-pair failure:
--
--   functions/issue-partner-credential/index.ts   service_role, x-certidemy-key,
--                                                 requires credentials:issue
--   functions/create-issuer-api-key/index.ts      service_role, mints
--   functions/revoke-issuer-api-key/index.ts      service_role, revokes
--   functions/courseware-read/index.ts            NEW -- mcp_reader, through this
--                                                 function only, requires
--                                                 courseware:lessons
--   ../certidemy-web/app/mcp/route.ts             NEW -- SUPABASE_SECRET_KEY,
--                                                 resolves the same key for its
--                                                 own error message and log.
--                                                 NOT a gate; see below.
--
-- The Worker's lookup is a CONVENIENCE, not a second gate, and saying otherwise
-- would be the dangerous half of this design. It exists so an agent gets "this
-- key is not scoped for lessons" instead of a bare upstream error, and so the
-- Worker's telemetry knows who called. It is checked against the function's own
-- answer and must agree; a disagreement is refused. But the GATE is the
-- function's derivation, and it would still hold if the Worker were removed.

begin;

-- ---------------------------------------------------------------- the role

do $mig$
begin
  if not exists (select 1 from pg_roles where rolname = 'mcp_authz') then
    create role mcp_authz nologin noinherit;
  end if;
end
$mig$;

comment on role mcp_authz is
  'Owns mcp.resolve_api_key and nothing else. Column-scoped select on issuer_api_keys so a definer owner cannot become a general reader of it.';

grant usage on schema public to mcp_authz;

-- COLUMN-SCOPED, AND THE LIST IS THE POINT. A table-wide GRANT SELECT would
-- silently override a column-level REVOKE, so the narrowing has to be the grant
-- itself. key_hash is here because the WHERE clause reads it; it is never
-- returned.
grant select (id, issuer_id, scopes, key_hash, expires_at, revoked_at)
  on public.issuer_api_keys to mcp_authz;

-- ============ AND RLS, WHICH THE GRANT DOES NOT SATISFY ============
--
-- issuer_api_keys has RLS ENABLED, with one policy -- `issuer_api_keys_read`,
-- SELECT, to `authenticated`. mcp_authz is not authenticated, does not own the
-- table (postgres does), and has no BYPASSRLS. So the grant lets it address the
-- table and RLS returns none of the rows.
--
-- THIS SUBSYSTEM HAD NOT MET RLS BEFORE, which is why it was not anticipated.
-- Every other object in schema mcp is OWNED BY POSTGRES -- all five views
-- included, none of them security_invoker -- and postgres has BYPASSRLS. The
-- views ARE the bypass, by owner. mcp_authz is the first definer owner here that
-- RLS actually applies to, and it exists precisely because it is narrow. THE
-- NARROWING IS WHAT TRIPPED IT.
--
-- AND IT FAILS BY RETURNING NOTHING. Not 42501, not an error of any kind: the
-- grant is present, the query plans, the query succeeds, and the rows are
-- filtered away. CLAUDE.md's own line -- "a table with RLS enabled and no grant
-- is closed; a table with a grant and no policies is open" -- names the two ends
-- and not this middle: a grant AND a policy that does not name you.
--
-- THE FIRST VERSION OF THIS MIGRATION ABORTED ON ITS OWN POSITIVE CONTROL with
-- `a live key resolved to the wrong id` -- the catastrophic reading of a benign
-- fact. It was the probe, not the function: EXECUTE INTO leaves its targets NULL
-- on an empty result, and the probe compared ids without first asking how many
-- rows came back. Both halves are repaired, and the probe half matters more.
-- See the note above check 4.
--
-- SECOND INSTANCE IN THIS SUBSYSTEM. 317 gave mcp_logger INSERT on mcp_requests
-- and the write was refused by RLS; 319 exists to add that policy. Same trap,
-- one statement type along, four migrations apart.
--
-- A POLICY, NOT `alter role mcp_authz bypassrls`. BYPASSRLS is a ROLE
-- ATTRIBUTE: global, permanent, and applied to every table this role ever
-- touches, including tables that do not exist yet. A policy is one table, one
-- role, SELECT only, and it shows up in pg_policies for anyone auditing who can
-- read this table.
--
-- `using (true)` is correct and is not where the narrowing lives. The resolver
-- must be able to match ANY partner key. What bounds it is the column grant
-- above, the fact that this function is the only path to it, and the need to
-- hold the key in order to compute the hash that selects a row.

drop policy if exists issuer_api_keys_mcp_authz_read on public.issuer_api_keys;

create policy issuer_api_keys_mcp_authz_read
  on public.issuer_api_keys
  for select
  to mcp_authz
  using (true);

-- ------------------------------------------------------------ the function

create or replace function mcp.resolve_api_key(p_key_hash text)
returns table (key_id uuid, issuer_id uuid, scopes text[], key_status text)
language sql
security definer
stable
set search_path = ''
as $fn$
  select
    k.id,
    k.issuer_id,
    k.scopes,
    case
      when k.revoked_at is not null then 'revoked'
      when k.expires_at is not null and k.expires_at < pg_catalog.now() then 'expired'
      else 'active'
    end
  from public.issuer_api_keys k
  where k.key_hash = p_key_hash
    and pg_catalog.length(p_key_hash) = 64
$fn$;

comment on function mcp.resolve_api_key(text) is
  'What does this key hash authorise. Answerable only by a caller who already holds the key. Returns no row for an unknown hash; returns key_status revoked or expired so the caller can log the reason while answering every failure identically.';

-- The owner needs CREATE on mcp to take ownership, and the migration role needs
-- SET on mcp_authz to give it away. Both are granted narrowly and given back in
-- the same transaction; PG16+ withholds SET from CREATE ROLE, which is what 317
-- failed on.
do $mig$
begin
  execute format('grant mcp_authz to %I with set true', current_user);
end
$mig$;

grant create on schema mcp to mcp_authz;

alter function mcp.resolve_api_key(text) owner to mcp_authz;

revoke create on schema mcp from mcp_authz;

revoke all on function mcp.resolve_api_key(text) from public;

grant execute on function mcp.resolve_api_key(text) to mcp_reader;

-- ============ PROVEN BY DOING, INSIDE THE TRANSACTION ============
--
-- 317 asserted six things about grants and owners by reading pg_catalog, all
-- correctly, and shipped two defects. So these ATTEMPT the reads: the refusal is
-- observed rather than inferred, and a SELECT is not destructive, so the check
-- and the damage are not the same action.
--
-- A real key hash is read into a local variable here. It is never raised in a
-- notice and never leaves the server.

do $mig$
declare
  v_hash    text;
  v_id      uuid;
  v_got     uuid;
  v_status  text;
  n         int;
  n_keys    int := 0;
  fn_owner  text;
  fn_secdef boolean;
  fn_lang   text;
  fn_config text[];
  n_null    int := 0;
  n_wrong   int := 0;
  rec       record;
  blocked   boolean := false;
begin
  execute format('grant mcp_reader to %I with set true', current_user);

  -- 1. THE READER CANNOT READ THE TABLE. This is the property the definer
  --    function exists to preserve, so it is checked before anything else.
  begin
    execute 'set local role mcp_reader';
    execute 'select 1 from public.issuer_api_keys limit 1';
  exception when insufficient_privilege then
    blocked := true;
  end;
  execute 'reset role';
  if not blocked then
    raise exception 'mcp_reader can select issuer_api_keys'
      using hint = 'the definer function is not the only path';
  end if;

  -- 2. AN UNKNOWN HASH RESOLVES TO NOTHING. 64 hex characters that are not a
  --    key: the shape is right and the answer is still empty.
  execute 'set local role mcp_reader';
  execute 'select count(*) from mcp.resolve_api_key($1)'
    into n using repeat('0', 64);
  execute 'reset role';
  if n <> 0 then
    raise exception 'an unknown hash resolved to % row(s)', n;
  end if;

  -- 3. A MALFORMED HASH RESOLVES TO NOTHING. Empty string, and null.
  execute 'set local role mcp_reader';
  execute 'select count(*) from mcp.resolve_api_key($1)' into n using '';
  execute 'reset role';
  if n <> 0 then
    raise exception 'the empty hash resolved to % row(s)', n;
  end if;

  execute 'set local role mcp_reader';
  execute 'select count(*) from mcp.resolve_api_key(null)' into n;
  execute 'reset role';
  if n <> 0 then
    raise exception 'a null hash resolved to % row(s)', n;
  end if;

  -- 4. THE POSITIVE HALF, AND IT IS WHAT CAUGHT THE RLS FILTER.
  --
  --    Checks 2 and 3 above ALL PASSED against a function that returned nothing
  --    for every input, because "no rows" is the answer they are written to
  --    expect. Three negative assertions agreeing for the wrong reason is the
  --    whole argument for a positive control.
  --
  --    TWO FAILURES ARE POSSIBLE HERE AND THEY ARE NOT THE SAME EVENT:
  --
  --      no row      a closed door. Nobody gets in. Safe, and wrong.
  --      wrong row   one key resolving to another key row, which is one partner
  --                  reading under another partner scopes.
  --
  --    The first version compared ids and reported any difference as 'the wrong
  --    id'. EXECUTE INTO leaves its targets NULL on an empty result, so a closed
  --    door raised the message that means a cross-partner leak. COUNT FIRST,
  --    COMPARE SECOND: a post-condition that cannot tell its two failure modes
  --    apart will name the wrong one, and it will name the scarier one, because
  --    that is the one worth writing a message about.

  select count(*) into n from public.issuer_api_keys where revoked_at is null;
  if n = 0 then
    raise exception 'no live key to test against'
      using hint = 'the positive half cannot be proven; nothing is committed';
  end if;

  -- EVERY KEY, NOT THE FIRST ONE. A policy matching some rows and not others
  -- would satisfy a single-key check and refuse a real partner later.
  for rec in select k.id, k.key_hash from public.issuer_api_keys k loop
    execute 'set local role mcp_reader';
    execute 'select key_id from mcp.resolve_api_key($1)' into v_got using rec.key_hash;
    execute 'reset role';
    if v_got is null then
      n_null := n_null + 1;
    elsif v_got <> rec.id then
      n_wrong := n_wrong + 1;
    end if;
    n_keys := n_keys + 1;
  end loop;

  -- NAMED SEPARATELY, AND THE LEAK IS NAMED FIRST because it is the one that
  -- must never arrive wearing another failure message.
  if n_wrong <> 0 then
    raise exception '% key(s) resolved to a DIFFERENT key', n_wrong
      using detail = 'a key is returning another key row',
            hint   = 'do not deploy; this is a cross-partner authorization leak';
  end if;
  if n_null <> 0 then
    raise exception '% key(s) resolved to no row', n_null
      using detail = 'the grant is present and the read returned nothing',
            hint   = 'that is what RLS does; check pg_policies for mcp_authz';
  end if;

  -- AND THE STATUS IS RIGHT ON A LIVE ONE.
  select k.key_hash, k.id into v_hash, v_id
    from public.issuer_api_keys k
   where k.revoked_at is null
     and (k.expires_at is null or k.expires_at > now())
   order by k.created_at
   limit 1;

  execute 'set local role mcp_reader';
  execute 'select key_status from mcp.resolve_api_key($1)' into v_status using v_hash;
  execute 'reset role';

  if v_status is distinct from 'active' then
    raise exception 'a live key resolved as %', coalesce(v_status, 'nothing');
  end if;

  -- 5. A REVOKED KEY RESOLVES, AND SAYS SO. The row is returned so the caller
  --    can LOG the reason; answering every failure identically is the caller's
  --    job, not this function's.
  select k.key_hash into v_hash
    from public.issuer_api_keys k
   where k.revoked_at is not null
   order by k.created_at
   limit 1;

  if v_hash is not null then
    execute 'set local role mcp_reader';
    execute 'select key_status from mcp.resolve_api_key($1)'
      into v_status using v_hash;
    execute 'reset role';
    if v_status <> 'revoked' then
      raise exception 'a revoked key resolved as %', v_status;
    end if;
  else
    raise notice 'no revoked key on file; that branch is untested';
  end if;

  -- 6. THE HASH IS NOT IN THE RESULT. Structural, so no future body can start
  --    returning it without this failing.
  select count(*) into n
    from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'mcp'
     and p.proname = 'resolve_api_key'
     and pg_get_function_result(p.oid) ilike '%key_hash%';
  if n <> 0 then
    raise exception 'resolve_api_key returns key_hash';
  end if;

  -- 7. FOUR PROPERTIES, FOUR EXCEPTIONS -- ONE ROW READ, THEN TESTED APART.
  --
  --    This was a single count over five conjoined predicates raising one
  --    message that named three of them. It failed, and the message could not
  --    say which half had moved -- the same defect as the id comparison one
  --    probe up, on the same day, in the same block.
  --
  --    THE HALF THAT HAD MOVED WAS NONE OF THEM. The predicate read
  --
  --      p.proconfig::text like '%search_path=""%'
  --
  --    and proconfig is a text[] whose element is `search_path=""`. Rendering
  --    that array as text QUOTES the element, because it contains quotes, and
  --    backslash-escapes the inner pair:
  --
  --      element         search_path=""          (14 characters)
  --      ::text          {"search_path=\"\""}
  --
  --    So the literal `search_path=""` does not occur in the rendering and the
  --    pattern MATCHES NOTHING -- not here, and not on any correctly pinned
  --    function anywhere in this database. Measured 2026-09-14 against three
  --    that are definitively pinned: mcp.log_request, public.is_platform_admin
  --    and public.is_team_admin_of all return false for this pattern and true
  --    for `= any(proconfig)`. THE ASSERTION WAS UNCONDITIONALLY FALSE and had
  --    never once been satisfied by anything.
  --
  --    Same family as the five recorded in CLAUDE.md: it searched a STRING when
  --    the property was an ARRAY ELEMENT. The array is tested directly below,
  --    so no rendering sits between the property and the check.
  --
  --    NOT the owner. 323 carries 317's grant-create-transfer dance, and a
  --    failed `alter function ... owner to` raises 42501 at that statement --
  --    it could not have arrived here quietly.

  select r.rolname, p.prosecdef, l.lanname, p.proconfig
    into fn_owner, fn_secdef, fn_lang, fn_config
    from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
    join pg_roles r      on r.oid = p.proowner
    join pg_language l   on l.oid = p.prolang
   where ns.nspname = 'mcp'
     and p.proname = 'resolve_api_key';

  if not found then
    raise exception 'mcp.resolve_api_key does not exist';
  end if;

  if fn_owner is distinct from 'mcp_authz' then
    raise exception 'resolve_api_key is owned by %', coalesce(fn_owner, 'nobody')
      using detail = 'the definer would run with that role privileges instead',
            hint   = 'the owner transfer needs grant mcp_authz to the migration role with set true';
  end if;

  if not coalesce(fn_secdef, false) then
    raise exception 'resolve_api_key is not SECURITY DEFINER'
      using detail = 'it would run as mcp_reader, which cannot read the table',
            hint   = 'every key would resolve to no row and the paywall would close on everyone';
  end if;

  if fn_lang is distinct from 'sql' then
    raise exception 'resolve_api_key is language %', coalesce(fn_lang, 'none')
      using hint = 'the body committed here is a single sql statement';
  end if;

  -- THE PIN, IN TWO HALVES. "No pin at all" and "pinned to the wrong thing" are
  -- different repairs, and a reader who sees only the second goes looking for a
  -- setting that is not there.
  if fn_config is null
     or not exists (select 1 from unnest(fn_config) c where c like 'search_path=%') then
    raise exception 'resolve_api_key has no search_path pin'
      using detail = 'a definer without one resolves names through the caller search_path';
  end if;

  if not ('search_path=""' = any(fn_config)) then
    raise exception 'search_path is pinned to %', array_to_string(fn_config, ',')
      using hint = 'expected the empty pin, stored as the element search_path=""';
  end if;

  raise notice 'reader refused the table; % key(s) each resolved to themselves', n_keys;
end
$mig$;

commit;

-- ===================== VERIFICATION =====================
--
-- 1. THE NARROWING. Expect mcp_authz f for the table and t for the six columns;
--    mcp_reader f on both.
--
-- select r as role,
--        has_table_privilege(r, 'public.issuer_api_keys', 'SELECT')          as whole_table,
--        has_column_privilege(r, 'public.issuer_api_keys', 'scopes', 'SELECT') as scopes_col,
--        has_column_privilege(r, 'public.issuer_api_keys', 'name', 'SELECT')   as name_col
--   from unnest(array['mcp_authz','mcp_reader','mcp_holder','anon']) r;
--
--    name_col must be f for mcp_authz: the grant listed six columns and `name`
--    is not one of them, which is what proves the grant is column-scoped rather
--    than table-wide with a decorative list.
--
-- 1b. RLS IS SATISFIED, NOT BYPASSED. Expect the policy to exist and
--     mcp_authz to have NO bypassrls -- the second half is the point, because a
--     role attribute would have made this work while widening every table.
--
-- select
--   (select count(*) from pg_policies
--     where schemaname='public' and tablename='issuer_api_keys'
--       and policyname='issuer_api_keys_mcp_authz_read')     as policy_exists,
--   (select rolbypassrls from pg_roles where rolname='mcp_authz') as bypasses_rls;
--
-- 1c. THE PIN, TESTED ON THE ARRAY AND NOT ON ITS RENDERING. Expect t, f --
--     and the second column is why: `proconfig::text` escapes the inner quotes,
--     so a LIKE against it matches no correctly pinned function anywhere.
--
-- select
--   ('search_path=""' = any(proconfig))          as pinned,
--   (proconfig::text like '%search_path=""%')    as pinned_by_the_old_predicate
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'mcp' and p.proname = 'resolve_api_key';
--
-- 2. WHO MAY ASK. Expect mcp_reader t, everyone else f.
--
-- select r as role, has_function_privilege(r, 'mcp.resolve_api_key(text)', 'EXECUTE') as may_ask
--   from unnest(array['mcp_reader','mcp_holder','mcp_logger','anon','authenticated','public']) r;
--
--    mcp_holder is f ON PURPOSE. Authorization resolves on the reader
--    connection, before the holder credential is used at all.
--
-- 3. NO KEY YET HOLDS THE SCOPE. Expect 0 until one is granted; the smoke
--    test's authorised half reports UNTESTED rather than passing while this is 0.
--
-- select count(*) from public.issuer_api_keys
--  where revoked_at is null and 'courseware:lessons' = any(scopes);
--
-- ===================== GRANTING THE SCOPE TO A KEY =====================
--
-- Additive, so an existing credentials:issue key keeps it. The vocabulary CHECK
-- from 322 refuses a typo here rather than at authorization time.
--
-- update public.issuer_api_keys
--    set scopes = array(select distinct unnest(scopes || array['courseware:lessons']))
--  where id = '<key uuid>' and revoked_at is null;
