-- 406: Certidemy can pause a partner's Studio. A row in studio_pauses means paused; resuming deletes it, and
-- admin_actions keeps the history. While paused nothing new is made: functions/studio refuses to write or
-- approve, studio_approve refuses ('paused'), and studio_claim_job skips the partner's queue, so approved
-- videos wait instead of rendering. Finished videos stay downloadable. Resuming lets the queue run again.
--
-- Writers: functions/manage-studio-plan (platform_admin), pause / resume.
-- Readers: functions/studio (context + creation gate), functions/manage-studio-plan, the two functions below.
-- studio_approve is 402's body plus the pause check; studio_claim_job is 398's plus the pause filter.

create table public.studio_pauses (
  issuer_id uuid primary key references public.issuers(id) on delete cascade,
  paused_at timestamptz not null default now(),
  reason    text check (char_length(reason) <= 500),
  paused_by uuid
);
alter table public.studio_pauses enable row level security;
revoke all on public.studio_pauses from public, anon, authenticated;

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
  if exists (select 1 from studio_pauses where issuer_id = v_issuer) then return 'paused'; end if;
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

create or replace function public.studio_claim_job()
returns setof public.studio_videos language plpgsql security definer set search_path = public as $$
begin
  update studio_videos set status = 'failed', stage = null, progress = null,
         error = 'The render stopped three times. Try again.'
   where status = 'rendering' and render_attempts >= 3
     and coalesce(progress_at, approved_at) < now() - interval '15 minutes';
  return query
  update studio_videos set status = 'rendering', stage = null, progress = 0, progress_at = now(),
         render_attempts = render_attempts + 1
   where id = (select v.id from studio_videos v
                where ((v.status = 'approved'
                        and (v.scheduled_for is null or v.scheduled_for <= (now() at time zone 'utc')::date + 1))
                    or (v.status = 'rendering' and v.render_attempts < 3
                        and coalesce(v.progress_at, v.approved_at) < now() - interval '15 minutes'))
                  and not exists (select 1 from studio_pauses p where p.issuer_id = v.issuer_id)
                order by coalesce(v.scheduled_for, (v.approved_at at time zone 'utc')::date), v.approved_at
                limit 1 for update skip locked)
  returning *;
end $$;

revoke all on function public.studio_approve(uuid), public.studio_claim_job() from public, anon, authenticated;
grant execute on function public.studio_approve(uuid), public.studio_claim_job() to service_role;

-- Post-conditions: the table starts empty and is closed to browser roles; both functions read the pause and
-- keep what they did before (credits in approve, the stuck-render recovery in claim); service_role keeps both.
do $$
begin
  if exists (select 1 from studio_pauses) then raise exception '406: studio_pauses must start empty'; end if;
  if has_table_privilege('anon', 'public.studio_pauses', 'select') or has_table_privilege('authenticated', 'public.studio_pauses', 'select')
     or has_table_privilege('authenticated', 'public.studio_pauses', 'insert') then
    raise exception '406: studio_pauses is reachable from a browser role';
  end if;
  if (select prosrc from pg_proc where oid = 'public.studio_approve(uuid)'::regprocedure) not like '%studio_pauses%'
     or (select prosrc from pg_proc where oid = 'public.studio_approve(uuid)'::regprocedure) not like '%studio_credit_balance%' then
    raise exception '406: studio_approve must check the pause and still spend credits';
  end if;
  if (select prosrc from pg_proc where oid = 'public.studio_claim_job()'::regprocedure) not like '%studio_pauses%'
     or (select prosrc from pg_proc where oid = 'public.studio_claim_job()'::regprocedure) not like '%render_attempts >= 3%' then
    raise exception '406: studio_claim_job must skip paused partners and still recover stuck renders';
  end if;
  if has_function_privilege('authenticated', 'public.studio_approve(uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.studio_claim_job()', 'execute') then
    raise exception '406: a studio function is reachable from a browser role';
  end if;
  if not (has_function_privilege('service_role', 'public.studio_approve(uuid)', 'execute')
          and has_function_privilege('service_role', 'public.studio_claim_job()', 'execute')) then
    raise exception '406: service_role lost a studio function';
  end if;
end $$;
