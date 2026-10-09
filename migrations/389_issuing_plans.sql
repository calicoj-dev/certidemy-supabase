-- 389_issuing_plans.sql
--
-- Partner issuing packages: a yearly credential limit per partner, and the
-- on/off switch enforced for the first time.
--
-- THE SWITCH ALREADY EXISTS. Migration 331 seeded 'credentials:issue' into
-- mcp_features and built company_feature_disables (a row means OFF, absence
-- means ON, restored_at turns it back on without erasing that it happened).
-- Nothing enforced it for minting. This migration adds no second switch; the
-- resolver below reads that one, and _shared/issue.ts refuses on it.
--
-- THE LIMIT is new: company_issuing_plans, one row per company (331: no company
-- owns more than one issuer). NO ROW MEANS NO LIMIT, which is how every partner
-- issues today, so nothing changes until a platform_admin sets a package.
--
-- WRITERS, both repos grepped for from("company_issuing_plans") and
-- from("company_feature_disables"):
--   functions/manage-issuing-plan   set_plan, clear_plan, pause, resume (platform_admin)
--   certidemy-web                   none; the super console calls the function
--
-- Run each numbered block on its own in the SQL editor, in order.

-- ===================================================================== 0. READ ONLY, run first
-- Partners whose issuing is ALREADY switched off in 331's table. Once the new
-- functions deploy, these partners stop being able to issue. Expect no rows.
select c.name, d.disabled_at, d.notes
  from public.company_feature_disables d
  join public.companies c on c.id = d.company_id
 where d.feature_key = 'credentials:issue'
   and d.restored_at is null;

-- ===================================================================== 1. table
create table if not exists public.company_issuing_plans (
  company_id   uuid primary key references public.companies(id) on delete cascade,
  package      text not null,
  annual_cap   integer not null,
  period_start date not null,
  notes        text,
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users(id) on delete set null,
  constraint company_issuing_plans_package_chk
    check (package in ('partner_network', 'custom')),
  constraint company_issuing_plans_cap_chk
    check (annual_cap > 0)
);

-- ===================================================================== 2.
comment on table public.company_issuing_plans is
  'Yearly credential limit per partner. NO ROW MEANS NO LIMIT. The on/off switch is company_feature_disables (credentials:issue), not this table.';

-- ===================================================================== 3. closed to clients
alter table public.company_issuing_plans enable row level security;

-- ===================================================================== 4.
revoke all on public.company_issuing_plans from public, anon, authenticated;

-- ===================================================================== 5. the count reads this
create index if not exists credentials_issuer_created_idx
  on public.credentials (issuer_id, created_at);

-- ===================================================================== 6. the resolver
-- Returns a STATUS and never an empty row (331's rule: a disable read fails
-- open, so a caller that cannot get 'ok' or 'no_company' must refuse).
-- used     = real credentials minted this contract year (specimens excluded)
-- reserved = open, unexpired offers: each already holds a slot
create or replace function public.issuing_allowance(p_issuer_id uuid)
returns table (
  o_status       text,
  o_enabled      boolean,
  o_disabled_at  timestamptz,
  o_package      text,
  o_annual_cap   integer,
  o_window_start date,
  o_window_end   date,
  o_used         integer,
  o_reserved     integer
)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_found   boolean;
  v_company uuid;
  v_start   date;
  v_years   integer;
begin
  select true, i.company_id into v_found, v_company
    from public.issuers i
   where i.id = p_issuer_id;

  if v_found is null then
    return query select 'issuer_unknown'::text, false, null::timestamptz,
      null::text, null::integer, null::date, null::date, 0, 0;
    return;
  end if;

  o_status := case when v_company is null then 'no_company' else 'ok' end;

  select d.disabled_at into o_disabled_at
    from public.company_feature_disables d
   where d.company_id = v_company
     and d.feature_key = 'credentials:issue'
     and d.restored_at is null;
  o_enabled := o_disabled_at is null;

  select p.package, p.annual_cap, p.period_start
    into o_package, o_annual_cap, v_start
    from public.company_issuing_plans p
   where p.company_id = v_company;

  if v_start is null then
    o_window_start := date_trunc('year', current_date)::date;
  elsif current_date < v_start then
    o_window_start := v_start;
  else
    v_years := extract(year from age(current_date, v_start))::integer;
    o_window_start := (v_start + make_interval(years => v_years))::date;
  end if;
  o_window_end := (o_window_start + interval '1 year')::date;

  select count(*)::integer into o_used
    from public.credentials c
   where c.issuer_id = p_issuer_id
     and c.is_specimen is not true
     and c.created_at >= o_window_start;

  select count(*)::integer into o_reserved
    from public.credential_offers co
   where co.issuer_id = p_issuer_id
     and co.status in ('sent', 'change_requested')
     and co.expires_at > now();

  return next;
end
$fn$;

-- ===================================================================== 7.
revoke all on function public.issuing_allowance(uuid) from public, anon, authenticated;

-- ===================================================================== 8.
grant execute on function public.issuing_allowance(uuid) to service_role;

-- ===================================================================== 9. post-conditions
do $post$
declare
  v_bad   text;
  v_row   record;
begin
  if to_regclass('public.company_issuing_plans') is null then
    raise exception 'post: company_issuing_plans missing';
  end if;

  select string_agg(r.rolname || ':' || p.privilege_type, ', ') into v_bad
    from pg_roles r
   cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) p(privilege_type)
   where r.rolname in ('anon', 'authenticated')
     and has_table_privilege(r.oid, 'public.company_issuing_plans', p.privilege_type);
  if v_bad is not null then
    raise exception 'post: client roles can reach plans: %', v_bad;
  end if;

  select string_agg(r.rolname, ', ') into v_bad
    from pg_roles r
   where r.rolname in ('anon', 'authenticated')
     and has_function_privilege(r.oid, 'public.issuing_allowance(uuid)', 'EXECUTE');
  if v_bad is not null then
    raise exception 'post: client roles can call issuing_allowance: %', v_bad;
  end if;

  if not has_function_privilege('service_role', 'public.issuing_allowance(uuid)', 'EXECUTE') then
    raise exception 'post: service_role cannot call issuing_allowance';
  end if;

  -- Both directions of the status: an unknown issuer refuses, a real one answers.
  select * into v_row from public.issuing_allowance(gen_random_uuid());
  if v_row.o_status is distinct from 'issuer_unknown' or v_row.o_enabled then
    raise exception 'post: unknown issuer did not refuse: % %', v_row.o_status, v_row.o_enabled;
  end if;

  select a.* into v_row
    from public.issuers i, lateral public.issuing_allowance(i.id) a
   limit 1;
  if v_row.o_status not in ('ok', 'no_company') then
    raise exception 'post: a real issuer did not resolve: %', v_row.o_status;
  end if;

  raise notice 'post: 389 ok';
end
$post$;
