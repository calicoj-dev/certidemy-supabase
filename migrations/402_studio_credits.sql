-- 402: studio video credits. Certidemy sells packs of extra videos and refunds a video a partner is unhappy with;
-- both are rows in a ledger, never an edited counter. A partner's month first uses its included videos
-- (studio_quota.monthly_limit, 20 by default); past that, approving a video spends one credit.
--   balance = sum(studio_credits.amount) - videos funded by a credit that are approved, rendering or done
-- so a failed render gives its credit back exactly as it gives back a monthly slot, and a refund is one +1 row.
--
-- Writers: functions/manage-studio-plan (platform_admin): package / adjustment / refund rows, studio_quota.
--          studio_approve, studio_reschedule (below): studio_videos.funding.
--          functions/studio unapprove, retry: funding = null with quota_month = null.
-- Readers: studio_credit_balance (below), functions/studio context, functions/manage-studio-plan.

create table public.studio_credits (
  id         uuid primary key default gen_random_uuid(),
  issuer_id  uuid not null references public.issuers(id) on delete cascade,
  amount     int  not null check (amount <> 0 and amount between -10000 and 10000),
  kind       text not null check (kind in ('package', 'adjustment', 'refund')),
  video_id   uuid references public.studio_videos(id) on delete cascade,
  note       text check (char_length(note) <= 500),
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint studio_credits_refund_is_one_video check ((kind = 'refund') = (video_id is not null) and (kind <> 'refund' or amount = 1)),
  constraint studio_credits_package_adds check (kind <> 'package' or amount > 0)
);
create unique index studio_credits_one_refund_per_video on public.studio_credits (video_id) where kind = 'refund';
create index studio_credits_issuer on public.studio_credits (issuer_id);
alter table public.studio_credits enable row level security;
revoke all on public.studio_credits from public, anon, authenticated;

alter table public.studio_videos add column funding text check (funding in ('monthly', 'credit'));
update public.studio_videos set funding = 'monthly' where quota_month is not null;

create or replace function public.studio_credit_balance(p_issuer uuid)
returns int language sql stable security definer set search_path = public as $$
  select (coalesce((select sum(amount) from studio_credits where issuer_id = p_issuer), 0)
        - (select count(*) from studio_videos where issuer_id = p_issuer and funding = 'credit'
             and status in ('approved', 'rendering', 'done')))::int;
$$;

-- Approve a draft: the month's included videos first, then one credit; 'quota' when there is neither.
create or replace function public.studio_approve(p_video uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_issuer uuid; v_status text; v_sched date; v_month date; v_limit int; v_used int; v_funding text := 'monthly';
  v_today date := (now() at time zone 'utc')::date;
begin
  select issuer_id, status, scheduled_for into v_issuer, v_status, v_sched
    from studio_videos where id = p_video for update;
  if v_issuer is null then return 'not_found'; end if;
  if v_status <> 'draft' then return 'not_draft'; end if;
  perform pg_advisory_xact_lock(hashtext('studio:' || v_issuer::text));
  v_month := date_trunc('month', greatest(coalesce(v_sched, v_today), v_today))::date;
  v_limit := coalesce((select monthly_limit from studio_quota where issuer_id = v_issuer), 20);
  select count(*)::int into v_used from studio_videos
   where issuer_id = v_issuer and quota_month = v_month and funding = 'monthly' and status in ('approved', 'rendering', 'done');
  if v_used >= v_limit then
    if studio_credit_balance(v_issuer) < 1 then return 'quota'; end if;
    v_funding := 'credit';
  end if;
  update studio_videos set status = 'approved', approved_at = now(), quota_month = v_month, funding = v_funding where id = p_video;
  return 'approved';
end $$;

-- Move a draft, or an approved video not yet rendering. A credit-funded video moves freely; a monthly one
-- entering a full month spends a credit instead, or the move is refused.
create or replace function public.studio_reschedule(p_video uuid, p_date date)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_issuer uuid; v_status text; v_month date; v_new date; v_limit int; v_used int; v_funding text;
  v_today date := (now() at time zone 'utc')::date;
begin
  select issuer_id, status, quota_month, funding into v_issuer, v_status, v_month, v_funding
    from studio_videos where id = p_video for update;
  if v_issuer is null then return 'not_found'; end if;
  if p_date is not null and p_date < v_today then return 'past'; end if;
  if v_status = 'draft' then
    update studio_videos set scheduled_for = p_date where id = p_video;
    return 'moved';
  end if;
  if v_status <> 'approved' then return 'locked'; end if;
  perform pg_advisory_xact_lock(hashtext('studio:' || v_issuer::text));
  v_new := date_trunc('month', coalesce(p_date, v_today))::date;
  if v_new is distinct from v_month and v_funding = 'monthly' then
    v_limit := coalesce((select monthly_limit from studio_quota where issuer_id = v_issuer), 20);
    select count(*)::int into v_used from studio_videos
     where issuer_id = v_issuer and quota_month = v_new and funding = 'monthly' and status in ('approved', 'rendering', 'done');
    if v_used >= v_limit then
      if studio_credit_balance(v_issuer) < 1 then return 'quota'; end if;
      v_funding := 'credit';
    end if;
  end if;
  update studio_videos set scheduled_for = p_date, quota_month = v_new, funding = v_funding where id = p_video;
  return 'moved';
end $$;

revoke all on function public.studio_credit_balance(uuid), public.studio_approve(uuid), public.studio_reschedule(uuid, date)
  from public, anon, authenticated;
grant execute on function public.studio_credit_balance(uuid), public.studio_approve(uuid), public.studio_reschedule(uuid, date)
  to service_role;

-- Post-conditions: every counted row has its funding and no row without a month has one; the ledger and the
-- three functions are closed to browser roles and open to service_role; the new approve reads the ledger.
do $$
declare v_bad text;
begin
  select string_agg(id::text, ', ') into v_bad from studio_videos where (quota_month is not null) <> (funding is not null);
  if v_bad is not null then raise exception '402: funding and quota_month disagree on %', v_bad; end if;
  if has_table_privilege('anon', 'public.studio_credits', 'select') or has_table_privilege('authenticated', 'public.studio_credits', 'select')
     or has_table_privilege('authenticated', 'public.studio_credits', 'insert') then
    raise exception '402: studio_credits is reachable from a browser role';
  end if;
  if has_function_privilege('anon', 'public.studio_credit_balance(uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.studio_credit_balance(uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.studio_approve(uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.studio_reschedule(uuid, date)', 'execute') then
    raise exception '402: a studio function is reachable from a browser role';
  end if;
  if not (has_function_privilege('service_role', 'public.studio_credit_balance(uuid)', 'execute')
          and has_function_privilege('service_role', 'public.studio_approve(uuid)', 'execute')
          and has_function_privilege('service_role', 'public.studio_reschedule(uuid, date)', 'execute')) then
    raise exception '402: service_role lost a studio function';
  end if;
  if (select prosrc from pg_proc where oid = 'public.studio_approve(uuid)'::regprocedure) not like '%studio_credit_balance%' then
    raise exception '402: studio_approve does not spend credits';
  end if;
end $$;
