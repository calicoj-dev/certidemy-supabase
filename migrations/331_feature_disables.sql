-- 331_feature_disables.sql
--
-- Grant by default, revoke by exception. A partner comes onboard with every
-- feature on; a superadmin turns one off per partner, and the turning-off is a
-- recorded act.
--
-- ===================== THE DEFAULT LIVES IN THE SCHEMA =====================
--
-- A new partner works because `company_feature_disables` has no row for them,
-- not because anyone remembered a step at onboarding. There is nothing to run,
-- nothing to grant, and no way to forget.
--
-- That is the property `company_features` could not give. It is grant-shaped and
-- EMPTY PLATFORM-WIDE, which is why `analyze-curriculum`'s partner branch was
-- never exercised: the branch was fine and nobody had ever written the row that
-- reaches it. Grant-by-exception makes the unconfigured state indistinguishable
-- from the refused one, and the unconfigured state is the common one.
--
-- ===================== DISABLED IS A ROW, NOT AN ABSENCE =====================
--
-- Turning courseware off does NOT empty a scope array. It writes a row carrying
-- who did it and when, so a revoked partner and a partner nobody configured are
-- different states when they email about it.
--
-- `restored_at` rather than DELETE, for the same reason: a partner who was
-- disabled and re-enabled still reads differently from one who never was. The
-- history is the point.
--
-- ===================== TWO POLARITIES, AND THE NAMES CARRY THEM =====================
--
--   public.company_features         a row means GRANTED   (grant by exception)
--   public.company_feature_disables a row means REVOKED   (revoke by exception)
--
-- They coexist deliberately. `curriculum_coverage` stays grant-shaped because
-- `analyze-curriculum` returns competitor intelligence, and default-on for every
-- partner is a product decision rather than a side effect of a refactor.
--
-- Somebody will read these two tables side by side. The names are the only thing
-- that will stop them assuming, so a comment goes on the OLD table too, saying
-- it is deliberately the other model. That comment is not decoration: it is the
-- only warning at the place the mistake would be made.
--
-- ===================== THE VOCABULARY IS REQUIRED, NOT POLISH =====================
--
-- `company_features.feature_key` is free text -- its only CHECK is on
-- `expires_at`. Under GRANT by exception a typo means "not granted": it fails
-- closed, loudly, at the moment someone tries to use the feature.
--
-- UNDER REVOKE BY EXCEPTION A TYPO MEANS THE REVOCATION SILENTLY DID NOT HAPPEN.
-- The partner keeps access somebody believes they removed, nobody looks for it,
-- and the person who typed it believes it worked. So `feature_key` is a foreign
-- key into a seeded table and a typo is rejected by referential integrity at
-- INSERT, not discovered later by an audit nobody runs.
--
-- ===================== THE READ FAILS OPEN, SO IT RETURNS A STATUS =====================
--
-- This is the direction that inverts and it is worth stating plainly. Asking
-- "is the scope present" fails CLOSED -- a dropped read grants nothing. Asking
-- "is it disabled" fails OPEN: every way of failing to learn the truth looks
-- exactly like "not disabled", and a false grant on licensed content is a
-- licensing cost rather than a support one.
--
-- So the resolver returns a STATUS and never an empty row, the shape
-- `resolve_api_key` and `resolve_oauth_caller` already use: 'ok',
-- 'company_unknown', 'unknown_feature'. A caller that cannot get 'ok' must
-- refuse. Inside one function a failure raises; the danger is a later reader
-- splitting it into two queries and dropping one, which is the family
-- READ-FAILURE-AUDIT.md exists for.
--
-- ===================== issuers.mcp_scopes IS DROPPED =====================
--
-- 329 added it hours ago as a grant array. Grant-by-default retires that model
-- for courseware, and keeping an ignored grant column beside a disable table is
-- two mechanisms answering one question -- precisely what this migration exists
-- to stop. A column that must stay empty to be correct is a trap for whoever
-- sets it next.
--
-- Its only non-empty value was `test-partner-02 = courseware:lessons`, which
-- under this model is the default anyway.
--
-- ===================== SCOPED BY COMPANY =====================
--
-- The company is the commercial entity that emails you. Courseware resolves
-- through an issuer, so the resolver walks issuer -> company -> disables, and an
-- issuer with no company (the `certidemy` issuer) is never disabled.
--
-- That is safe BECAUSE no company owns more than one issuer -- measured, not
-- assumed. If that ever changes, this scoping is the thing to revisit.

begin;

do $mig$
declare
  n          integer;
  v_company  uuid;
  v_issuer   uuid;
  v_enabled  boolean;
  v_status   text;
  v_when     timestamptz;
  rejected   boolean := false;
  rec        record;
  n_on       integer := 0;
  n_off      integer := 0;
begin

  -- -------------------------------------------------------- the vocabulary

  create table if not exists public.mcp_features (
    feature_key text primary key,
    description text not null,
    added_at    timestamptz not null default now()
  );

  insert into public.mcp_features (feature_key, description) values
    ('courseware:lessons', 'Read lesson bodies over the MCP and the courseware API.'),
    ('credentials:issue',  'Mint credentials under this partner''s issuer.')
  on conflict (feature_key) do nothing;

  comment on table public.mcp_features is
    'The feature vocabulary. company_feature_disables references it so a typo cannot silently fail to revoke.';

  -- ------------------------------------------------------------ the disables

  create table if not exists public.company_feature_disables (
    company_id   uuid not null references public.companies(id) on delete cascade,
    feature_key  text not null references public.mcp_features(feature_key),
    disabled_at  timestamptz not null default now(),
    -- ON DELETE SET NULL, never cascade: the RECORD must outlive the
    -- administrator who made it. A revocation that vanishes with its author is
    -- the absence this table exists to prevent.
    disabled_by  uuid references auth.users(id) on delete set null,
    reason       text,
    restored_at  timestamptz,
    restored_by  uuid references auth.users(id) on delete set null,
    primary key (company_id, feature_key),
    constraint company_feature_disables_restored_after
      check (restored_at is null or restored_at >= disabled_at)
  );

  comment on table public.company_feature_disables is
    'A ROW MEANS REVOKED. Absence means enabled - the default lives here, in the absence. restored_at re-enables without erasing that it happened.';
  comment on column public.company_feature_disables.restored_at is
    'Set to re-enable. The row is never deleted, so a restored partner still reads differently from one never configured.';

  -- AND THE WARNING ON THE OTHER TABLE, at the place the mistake would be made.
  comment on table public.company_features is
    'A ROW MEANS GRANTED - the OPPOSITE polarity to company_feature_disables. Deliberate: curriculum_coverage returns competitor intelligence and is grant-by-exception on purpose. Read the table name before the rows.';

  alter table public.company_feature_disables enable row level security;
  revoke all on public.company_feature_disables from anon, authenticated;
  revoke all on public.mcp_features from anon, authenticated;

  -- --------------------------------------------------------- the resolver

  create or replace function mcp.feature_status(
    p_issuer_id  uuid,
    p_feature_key text
  )
  returns table(enabled boolean, disabled_at timestamptz, disabled_by uuid, feature_status text)
  language sql
  stable
  security definer
  set search_path = ''
  as $fn$
    select
      case
        when f.feature_key is null then false
        when i.id is null then false
        else d.company_id is null or d.restored_at is not null
      end,
      case when d.restored_at is null then d.disabled_at else null end,
      case when d.restored_at is null then d.disabled_by else null end,
      case
        when f.feature_key is null then 'unknown_feature'
        when i.id is null then 'company_unknown'
        else 'ok'
      end
    from (select 1) one
    left join public.mcp_features f on f.feature_key = p_feature_key
    left join public.issuers i on i.id = p_issuer_id
    left join public.company_feature_disables d
           on d.company_id = i.company_id
          and d.feature_key = p_feature_key
  $fn$;

  comment on function mcp.feature_status(uuid, text) is
    'Is this feature enabled for the company behind this issuer. Returns a STATUS, never an empty row: the read fails open, so a caller that cannot get ok must refuse.';

  grant execute on function mcp.feature_status(uuid, text) to mcp_reader, mcp_holder;

  -- ------------------------------------- resolve_oauth_caller, new model

  -- Scopes are now the vocabulary MINUS what is disabled, rather than an array
  -- somebody had to remember to fill in.
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
      coalesce((
        select array_agg(f.feature_key order by f.feature_key)
          from public.mcp_features f
         where not exists (
                 select 1
                   from public.company_feature_disables d
                   join public.issuers i2 on i2.id = b.issuer_id
                  where d.company_id = i2.company_id
                    and d.feature_key = f.feature_key
                    and d.restored_at is null)
      ), '{}'::text[]),
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

  -- 329's grant array is retired. See the header.
  alter table public.issuers drop constraint if exists issuers_mcp_scopes_vocab;
  alter table public.issuers drop column if exists mcp_scopes;

  -- ============ PROVEN BY DOING ============

  execute format('grant mcp_reader to %I with set true', current_user);

  -- 1. THE TYPO IS REJECTED. The whole reason the vocabulary is a foreign key.
  --    Attempted, not inferred -- an INSERT is not destructive, so the check and
  --    the damage are not the same action, and a subtransaction rolls it back.
  select id into v_company from public.companies limit 1;
  if v_company is null then
    raise exception 'no company exists; the probes below cannot run';
  end if;

  begin
    insert into public.company_feature_disables (company_id, feature_key)
    values (v_company, 'courseware');           -- the plausible typo
  exception when foreign_key_violation then
    rejected := true;
  end;
  if not rejected then
    raise exception 'a misspelled feature_key was accepted'
      using hint = 'a typo would silently fail to revoke; nothing is committed';
  end if;

  -- 2. A COMPANY WITH NO ROW IS ENABLED. The default, read back from the schema.
  select i.id into v_issuer
    from public.issuers i where i.company_id is not null limit 1;
  if v_issuer is null then
    raise notice 'UNPROVEN: no issuer has a company';
  else
    execute 'set local role mcp_reader';
    select s.enabled, s.feature_status into v_enabled, v_status
      from mcp.feature_status(v_issuer, 'courseware:lessons') s;
    execute 'reset role';
    if v_status <> 'ok' or not v_enabled then
      raise exception 'an unconfigured company resolved enabled=% status=%', v_enabled, v_status
        using hint = 'grant by default is not in effect';
    end if;

    -- 3. A DISABLE ROW TURNS IT OFF, AND SAYS WHO AND WHEN.
    select i.company_id into v_company from public.issuers i where i.id = v_issuer;
    insert into public.company_feature_disables (company_id, feature_key, reason)
    values (v_company, 'courseware:lessons', 'migration 331 post-condition');

    execute 'set local role mcp_reader';
    select s.enabled, s.disabled_at, s.feature_status into v_enabled, v_when, v_status
      from mcp.feature_status(v_issuer, 'courseware:lessons') s;
    execute 'reset role';
    if v_enabled or v_when is null or v_status <> 'ok' then
      raise exception 'a disabled feature resolved enabled=% at=% status=%', v_enabled, v_when, v_status;
    end if;

    -- 4. EXACTLY ONE FEATURE GOES OFF AND THE OTHERS SURVIVE.
    --
    -- ASKED THROUGH THE FUNCTION, AS THE ROLE THAT WILL ASK IT. The first
    -- version of this block ran `select ... from public.mcp_features` under
    -- `set local role mcp_reader` and aborted the migration with
    --
    --     42501 permission denied for schema public
    --
    -- mcp_reader has NO USAGE on public and is not supposed to: 315 and 316
    -- confine it to the `mcp` schema, and every other post-condition here works
    -- because `mcp.feature_status` is SECURITY DEFINER owned by postgres -- its
    -- body reaches `public`, the caller never does. Reaching past the function
    -- was the mistake, and it tested a privilege nobody is claiming.
    --
    -- So: ENUMERATE as the migration runner, which owns the data, and ASSERT as
    -- mcp_reader, which is the party the property is about. It also says WHICH
    -- feature is off rather than counting how many are on.
    n_on := 0;
    n_off := 0;
    for rec in select f.feature_key from public.mcp_features f order by f.feature_key loop
      execute 'set local role mcp_reader';
      select s.enabled into v_enabled from mcp.feature_status(v_issuer, rec.feature_key) s;
      execute 'reset role';

      if rec.feature_key = 'courseware:lessons' then
        if v_enabled then
          raise exception 'the disabled feature % still reads enabled', rec.feature_key;
        end if;
        n_off := n_off + 1;
      else
        if not v_enabled then
          raise exception 'disabling courseware:lessons also disabled %', rec.feature_key
            using hint = 'one disable row must affect exactly one feature';
        end if;
        n_on := n_on + 1;
      end if;
    end loop;

    if n_off <> 1 then
      raise exception 'expected exactly 1 disabled feature, saw %', n_off;
    end if;
    if n_on < 1 then
      raise notice 'UNPROVEN: only one feature in the vocabulary, so "the others survive" did not run';
    end if;

    -- 5. RESTORING RE-ENABLES AND KEEPS THE RECORD. The state that must not be
    --    indistinguishable from never-configured.
    update public.company_feature_disables
       set restored_at = now()
     where company_id = v_company and feature_key = 'courseware:lessons';

    execute 'set local role mcp_reader';
    select s.enabled, s.disabled_at into v_enabled, v_when
      from mcp.feature_status(v_issuer, 'courseware:lessons') s;
    execute 'reset role';
    if not v_enabled then
      raise exception 'a restored feature is still disabled';
    end if;
    if v_when is not null then
      raise exception 'a restored feature still reports a disabled_at';
    end if;
    select count(*) into n from public.company_feature_disables
     where company_id = v_company and feature_key = 'courseware:lessons';
    if n <> 1 then
      raise exception 'restoring deleted the row; the history is gone';
    end if;

    -- the probe row goes; this migration configures nobody
    delete from public.company_feature_disables where company_id = v_company;
  end if;

  -- 6. A STATUS, NEVER AN EMPTY ROW. Both failure shapes named.
  execute 'set local role mcp_reader';
  select s.feature_status into v_status
    from mcp.feature_status(v_issuer, 'no-such-feature') s;
  execute 'reset role';
  if v_status is distinct from 'unknown_feature' then
    raise exception 'an unknown feature resolved as %', coalesce(v_status, '<null>');
  end if;

  execute 'set local role mcp_reader';
  select s.feature_status into v_status
    from mcp.feature_status('00000000-0000-4000-8000-0000000000aa'::uuid, 'courseware:lessons') s;
  execute 'reset role';
  if v_status is distinct from 'company_unknown' then
    raise exception 'an unknown issuer resolved as %', coalesce(v_status, '<null>');
  end if;

  -- 7. AND NOTHING IS CONFIGURED. This migration disables nobody.
  select count(*) into n from public.company_feature_disables;
  if n <> 0 then
    raise exception '% disable row(s) survive; this migration configures nobody', n;
  end if;

  raise notice 'grant by default is in effect; a typo cannot revoke; restore keeps the record';
end
$mig$;

commit;

-- ===================== WHAT STILL HAS TO CHANGE IN CODE =====================
--
-- THE DISABLE MUST APPLY TO EVERY CREDENTIAL, NOT JUST OAUTH. An API key carries
-- its own `scopes`, chosen by the partner at mint time -- that is the partner
-- narrowing their own automation, a different question from whether the platform
-- has revoked the feature. `courseware-read` must therefore gate on BOTH:
--
--   the credential asks for it   (key scopes, or the OAuth scope set)
--   AND the platform allows it   (mcp.feature_status(issuer, feature).enabled)
--
-- Without the second, disabling courseware for a partner leaves their API key
-- working, which is the revocation appearing to succeed and not succeeding --
-- the failure this whole migration is shaped around.
--
-- ===================== VERIFICATION =====================
--
--   select feature_key, description from public.mcp_features order by 1;
--
--   select company_id, feature_key, disabled_at, disabled_by, restored_at
--     from public.company_feature_disables order by disabled_at desc;
--   -- empty today; a row here is a deliberate revocation
--
--   select * from mcp.feature_status('<issuer-uuid>', 'courseware:lessons');
--   -- expect enabled=t, feature_status=ok for any issuer with no disable row
