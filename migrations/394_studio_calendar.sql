-- 394: studio calendar -- scheduled videos, a fixed quota month, script options, brand profile,
-- live render stage and a poster frame.
--
-- Writers of the new columns (all nullable):
--   functions/studio      profile (save_brand); scheduled_for, series_id, options (draft, plan, pick,
--                         schedule); quota_month via studio_approve() / studio_reschedule()
--   certidemy-web marketing/reels/studio/worker.mjs   stage, poster_path on the row it claimed
-- quota_month is the month a video counts against: its scheduled month, or the approval month when it
-- renders now. Stored at approval so a count never depends on today's date.

alter table public.studio_brand_kits add column profile jsonb;

alter table public.studio_videos
  add column scheduled_for date,
  add column series_id     uuid,
  add column options       jsonb,
  add column quota_month   date,
  add column stage         text check (stage in ('voice', 'animation', 'mix', 'upload')),
  add column poster_path   text;

update public.studio_videos set quota_month = date_trunc('month', approved_at)::date
 where approved_at is not null and quota_month is null;

create index studio_videos_issuer_scheduled on public.studio_videos (issuer_id, scheduled_for)
  where scheduled_for is not null;
create index studio_videos_issuer_quota on public.studio_videos (issuer_id, quota_month)
  where quota_month is not null;

-- Approve a draft against the quota of the month it counts in. A failed render does not count.
create or replace function public.studio_approve(p_video uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_issuer uuid; v_status text; v_sched date; v_month date; v_limit int; v_used int;
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
   where issuer_id = v_issuer and quota_month = v_month and status in ('approved', 'rendering', 'done');
  if v_used >= v_limit then return 'quota'; end if;
  update studio_videos set status = 'approved', approved_at = now(), quota_month = v_month where id = p_video;
  return 'approved';
end $$;

-- Move a draft, or an approved video not yet rendering, to another day (null = render now).
-- An approved video changing month needs room in the new month.
create or replace function public.studio_reschedule(p_video uuid, p_date date)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_issuer uuid; v_status text; v_month date; v_new date; v_limit int; v_used int;
  v_today date := (now() at time zone 'utc')::date;
begin
  select issuer_id, status, quota_month into v_issuer, v_status, v_month
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
  if v_new is distinct from v_month then
    v_limit := coalesce((select monthly_limit from studio_quota where issuer_id = v_issuer), 20);
    select count(*)::int into v_used from studio_videos
     where issuer_id = v_issuer and quota_month = v_new and status in ('approved', 'rendering', 'done');
    if v_used >= v_limit then return 'quota'; end if;
  end if;
  update studio_videos set scheduled_for = p_date, quota_month = v_new where id = p_video;
  return 'moved';
end $$;

-- Claim the next approved video that is due: unscheduled, or scheduled for tomorrow or earlier,
-- so a scheduled video is ready on its day.
create or replace function public.studio_claim_job()
returns setof public.studio_videos language sql security definer set search_path = public as $$
  update studio_videos set status = 'rendering', stage = null
   where id = (select id from studio_videos
                where status = 'approved'
                  and (scheduled_for is null or scheduled_for <= (now() at time zone 'utc')::date + 1)
                order by coalesce(scheduled_for, (approved_at at time zone 'utc')::date), approved_at
                limit 1 for update skip locked)
  returning *;
$$;

revoke all on function public.studio_approve(uuid), public.studio_reschedule(uuid, date), public.studio_claim_job()
  from public, anon, authenticated;
grant execute on function public.studio_approve(uuid), public.studio_reschedule(uuid, date), public.studio_claim_job()
  to service_role;

-- Post-conditions: every approved-or-later row has its month and no draft has one; nothing became
-- reachable from a browser role.
do $$
declare v_bad text;
begin
  select string_agg(id::text, ', ') into v_bad from public.studio_videos
   where (status <> 'draft' and approved_at is not null and quota_month is null)
      or (status = 'draft' and quota_month is not null);
  if v_bad is not null then raise exception '394: quota_month wrong on %', v_bad; end if;
  if has_table_privilege('authenticated', 'public.studio_videos', 'select')
     or has_table_privilege('anon', 'public.studio_brand_kits', 'select') then
    raise exception '394: studio tables are readable by a browser role';
  end if;
  if has_function_privilege('authenticated', 'public.studio_reschedule(uuid, date)', 'execute')
     or has_function_privilege('anon', 'public.studio_approve(uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.studio_claim_job()', 'execute') then
    raise exception '394: a studio function is executable by a browser role';
  end if;
  if not has_function_privilege('service_role', 'public.studio_reschedule(uuid, date)', 'execute') then
    raise exception '394: service_role cannot reschedule';
  end if;
end $$;
