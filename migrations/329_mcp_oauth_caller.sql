-- 329_mcp_oauth_caller.sql
--
-- The database half of the OAuth path: an issuer-level entitlement, and one
-- function that turns (sub, client_id) into the same tuple `mcp.resolve_api_key`
-- returns for a key.
--
-- ===================== WHAT WAS MISSING, AND IT WAS NOT THE GATE =====================
--
-- Everything else was in place: the consent screen writes bindings (326),
-- Protected Resource Metadata is deployed, and the `client_id` discriminator was
-- measured on 2026-09-16 -- PRESENT on an OAuth access token, ABSENT from an
-- ordinary password-grant session, so a learner's browser session cannot be
-- presented as an agent.
--
-- WHAT DID NOT EXIST IS THE ENTITLEMENT. Scopes live on `issuer_api_keys` and
-- nowhere else. An OAuth caller holds no key, so there was no answer to "what may
-- this partner read".
--
-- AND DERIVING IT FROM THE ISSUER'S KEYS IS WRONG, measured rather than argued.
-- Both bindings that exist today point at the `certidemy` issuer, which holds
-- ZERO API keys -- it is the platform's own issuer, has no company, and only a
-- platform_admin can bind to it. A union over its live keys returns the empty
-- set, so every OAuth lesson read would resolve to nothing and answer empty. That
-- is the silent-success failure this repository exists to avoid, and it would
-- have looked like a working gate.
--
-- It is also wrong in principle: revoking an API key would silently revoke an
-- OAuth partner's access, two grants with no stated relationship.
--
-- ===================== THE DECISION: A SCOPE ARRAY ON THE ISSUER =====================
--
-- `issuers.mcp_scopes`, default `{}`, CHECKed against the same vocabulary
-- `issuer_api_keys_scope_vocab` uses. Chosen over a new table because the
-- existing scope model is already an array with a CHECK, and a second shape for
-- the same idea is a second thing to keep in step.
--
-- DEFAULT EMPTY IS THE POINT. Nothing is entitled until somebody grants it, so
-- this migration opens nothing. The two live bindings resolve to an issuer with
-- no scopes and the caller is refused -- correctly, and loudly, because the
-- function returns a STATUS rather than an empty row.
--
-- `company_features` was considered and does not fit: it is company-scoped, and
-- the `certidemy` issuer has no company. It is also empty platform-wide.
--
-- ===================== WRITERS OF public.issuers =====================
--
-- Grepped both repos. `create-partner-issuer`, `activate-partner-issuer`,
-- `update-lti-platform` (unrelated columns) and the console. NONE of them needs
-- changing: the column is NOT NULL **with a default**, so every existing writer
-- keeps working and every existing row gets `{}`.
--
-- This is the case CLAUDE.md's writer-list rule is about, and it is the benign
-- one: a NOT NULL column added WITHOUT a default is what breaks writers that
-- predate it. Named anyway, because the rule says name them.
--
-- ===================== THE ALLOWLIST IS THE MANUAL REGISTRATION =====================
--
-- A client is approved iff it exists in `auth.oauth_clients`, is not deleted, and
-- carries `registration_type = 'manual'`. Dynamic registration was open and
-- unauthenticated until 2026-09-15 -- our own probe script registered five
-- clients in a day sending no credential -- and it is closed now.
--
-- THOSE TWO FACTS DEPEND ON EACH OTHER AND NOTHING LINKED THEM. "An approved
-- client" means something only because approval is manual. So the post-conditions
-- assert the invariant rather than trusting the flag: every live client must be
-- manually registered. That fails the moment somebody re-enables dynamic
-- registration AND a client self-registers, which is the moment it matters.
--
-- ===================== ONE SHAPE FOR TWO CREDENTIALS =====================
--
-- The return shape deliberately mirrors `mcp.resolve_api_key`: an issuer, a scope
-- array, and a status string. Nothing downstream should branch on which kind of
-- credential arrived -- the Worker resolves either into one AuthResolution and
-- `courseware-read` gates on scopes it was handed.
--
-- A STATUS, NEVER AN EMPTY RESULT. `resolve_api_key` answers 'revoked' and
-- 'expired' rather than returning no row, because "no row" and "not allowed" read
-- identically to a caller that forgot to check. This answers 'client_not_approved',
-- 'no_binding', 'issuer_inactive' or 'active' for the same reason.

begin;

do $mig$
declare
  n            integer;
  v_issuer     uuid;
  v_scopes     text[];
  v_status     text;
  v_user       uuid;
  v_client     uuid;
begin

  -- ------------------------------------------------- the entitlement column

  alter table public.issuers
    add column if not exists mcp_scopes text[] not null default '{}'::text[];

  alter table public.issuers drop constraint if exists issuers_mcp_scopes_vocab;
  alter table public.issuers
    add constraint issuers_mcp_scopes_vocab
    check (mcp_scopes <@ array['credentials:issue', 'courseware:lessons']::text[]);

  comment on column public.issuers.mcp_scopes is
    'What an OAuth-authenticated partner bound to this issuer may do. Empty until granted; keys carry their own scopes separately.';

  -- ------------------------------------------------------------ the resolver

  create or replace function mcp.resolve_oauth_caller(
    p_user_id   uuid,
    p_client_id uuid
  )
  returns table(issuer_id uuid, scopes text[], caller_status text)
  language sql
  stable
  security definer
  set search_path = ''
  as $fn$
    select
      b.issuer_id,
      coalesce(i.mcp_scopes, '{}'::text[]),
      case
        when c.id is null then 'client_not_approved'
        when i.id is null then 'no_binding'
        when i.status <> 'active' then 'issuer_inactive'
        else 'active'
      end
    from (select 1) one
    left join auth.oauth_clients c
           on c.id = p_client_id
          and c.deleted_at is null
          and c.registration_type = 'manual'
    left join public.oauth_issuer_bindings b
           on b.user_id = p_user_id
          and b.client_id = p_client_id
          and c.id is not null
    left join public.issuers i
           on i.id = b.issuer_id
  $fn$;

  comment on function mcp.resolve_oauth_caller(uuid, uuid) is
    'OAuth half of resolve_api_key: (sub, client_id) -> issuer, scopes, status. Approval IS manual registration.';

  -- The Worker reaches this over PostgREST with the service key. Nothing else
  -- may call it: a binding is a commercial fact about a partner.
  --
  -- SCHEMA USAGE IS CHECKED BEFORE FUNCTION EXECUTE, and service_role had none.
  -- Measured before this migration was written: the `mcp` schema is already in
  -- config.toml's PostgREST schema list, and an RPC call to the existing
  -- mcp.resolve_api_key with the service key answers
  --
  --     42501  permission denied for schema mcp
  --
  -- The EXECUTE grant below would never have been reached. Same family as
  -- CLAUDE.md's "RLS is not a grant": the outer check runs first and a missing
  -- outer grant produces a silent, misdirecting 42501.
  grant usage on schema mcp to service_role;

  revoke all on function mcp.resolve_oauth_caller(uuid, uuid) from public;
  grant execute on function mcp.resolve_oauth_caller(uuid, uuid) to service_role;

  -- ============ PROVEN BY CALLING IT, NOT BY READING pg_catalog ============

  -- 1. THE INVARIANT THE ALLOWLIST RESTS ON.
  select count(*) into n
    from auth.oauth_clients
   where deleted_at is null and registration_type <> 'manual';
  if n <> 0 then
    raise exception '% self-registered client(s) exist; "approved" would mean "anyone"', n
      using hint = 'dynamic registration is on, or was; nothing is committed';
  end if;

  -- 2. A CLIENT NOBODY APPROVED. The negative half, and it must not be an
  --    empty result -- an unknown client and an unbound user are different facts.
  select r.caller_status into v_status
    from mcp.resolve_oauth_caller(
           '00000000-0000-4000-8000-000000000001'::uuid,
           '00000000-0000-4000-8000-0000000000ff'::uuid) r;
  if v_status is distinct from 'client_not_approved' then
    raise exception 'an unapproved client resolved as %', coalesce(v_status, '<null>')
      using hint = 'nothing is committed';
  end if;

  -- 3. A REAL BINDING, IF ONE EXISTS. Resolves to its issuer with a status, and
  --    with NO SCOPES -- because this migration grants none. Asserted so that
  --    "it returned nothing" can never be mistaken for "it worked".
  select b.user_id, b.client_id into v_user, v_client
    from public.oauth_issuer_bindings b
    join auth.oauth_clients c on c.id = b.client_id
                             and c.deleted_at is null
                             and c.registration_type = 'manual'
   limit 1;

  if v_user is null then
    raise notice 'UNPROVEN: no binding points at a manually registered client, so the active path did not run';
  else
    select r.issuer_id, r.scopes, r.caller_status
      into v_issuer, v_scopes, v_status
      from mcp.resolve_oauth_caller(v_user, v_client) r;

    if v_status is distinct from 'active' then
      raise exception 'a live binding resolved as %', coalesce(v_status, '<null>');
    end if;
    if v_issuer is null then
      raise exception 'a live binding resolved to no issuer';
    end if;
    if coalesce(array_length(v_scopes, 1), 0) <> 0 then
      raise exception 'a binding resolved with % scope(s); this migration grants none',
        array_length(v_scopes, 1)
        using hint = 'somebody set issuers.mcp_scopes before the grant was reviewed';
    end if;
    raise notice 'active binding resolves to issuer % with no scopes, as intended', v_issuer;
  end if;

  -- 4. NOBODY BUT service_role MAY CALL IT.
  if has_function_privilege('anon', 'mcp.resolve_oauth_caller(uuid, uuid)', 'EXECUTE')
     or has_function_privilege('authenticated', 'mcp.resolve_oauth_caller(uuid, uuid)', 'EXECUTE') then
    raise exception 'anon or authenticated can call resolve_oauth_caller';
  end if;

  -- 5. SCHEMA USAGE LANDED, AND IT DID NOT OPEN THE VIEWS.
  --
  --    The negative half matters more than the positive one here: USAGE on a
  --    schema is not SELECT on what is in it, but that is a sentence, and this
  --    is a measurement. mcp.lesson is the lesson bodies -- the paywall -- and
  --    service_role must still be unable to read it through this schema.
  if not has_schema_privilege('service_role', 'mcp', 'USAGE') then
    raise exception 'service_role still cannot use schema mcp; the RPC would 42501';
  end if;
  if has_table_privilege('service_role', 'mcp.lesson', 'SELECT') then
    raise exception 'service_role can read mcp.lesson'
      using hint = 'schema usage must not have carried table grants; nothing is committed';
  end if;
  if has_table_privilege('service_role', 'mcp.certification', 'SELECT') then
    raise exception 'service_role can read mcp.certification';
  end if;

  -- 6. AND EVERY ISSUER STILL HAS AN EMPTY SCOPE ARRAY. The both-directions half:
  --    proving the column exists says nothing about it being closed.
  select count(*) into n from public.issuers
   where coalesce(array_length(mcp_scopes, 1), 0) <> 0;
  if n <> 0 then
    raise exception '% issuer(s) already carry mcp_scopes', n;
  end if;

  raise notice 'resolve_oauth_caller installed; no issuer is entitled yet';
end
$mig$;

commit;

-- ===================== GRANTING AN ISSUER, LATER AND DELIBERATELY =====================
--
-- Not in this migration, because the first grant is the moment the OAuth path
-- starts serving anything and it deserves its own review:
--
--   update public.issuers
--      set mcp_scopes = array['courseware:lessons']
--    where slug = '<slug>';
--
-- Run it for ONE issuer, then read a lesson through the connector, then decide
-- about the next. `company_features` was empty platform-wide for the same reason
-- and it is the reason the analyzer's partner branch was never exercised -- an
-- entitlement table nobody writes to is an untested branch, not a safe one.
--
-- ===================== VERIFICATION =====================
--
--   select proname, prosecdef, provolatile, proconfig
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'mcp' and proname = 'resolve_oauth_caller';
--   -- expect: t, s, {search_path=""}
--
--   select slug, mcp_scopes from public.issuers order by slug;
--   -- expect every row {} until a grant is reviewed
--
--   select count(*) from auth.oauth_clients
--    where deleted_at is null and registration_type <> 'manual';
--   -- must stay 0; this is what makes "approved" mean something
--
--   select has_schema_privilege('service_role','mcp','USAGE') as can_use,
--          has_table_privilege('service_role','mcp.lesson','SELECT') as can_read_lessons;
--   -- expect: t, f
