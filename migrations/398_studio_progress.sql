-- 398: studio render progress and recovery. A 0-100 percentage beside the render stage so a slow render
-- visibly moves, a heartbeat, and a claim that restarts a render whose worker died (a redeploy or an
-- out-of-memory restart left rows in 'rendering' forever). Three attempts, then the row fails.
--
-- Writers of the new columns:
--   certidemy-web marketing/reels/studio/worker.mjs   progress, progress_at on the row it claimed (PATCH)
--   studio_claim_job() (below)                       progress = 0, progress_at, render_attempts + 1 on claim
--   functions/studio retry                           progress = null, render_attempts = 0 (a fresh start)
-- render_attempts is NOT NULL DEFAULT 0: functions/studio inserts drafts without it (the default applies);
-- the worker never writes it; the claim increments it. Reader: functions/studio (list).

alter table public.studio_videos
  add column progress        smallint check (progress between 0 and 100),
  add column progress_at     timestamptz,
  add column render_attempts smallint not null default 0;

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
   where id = (select id from studio_videos
                where (status = 'approved'
                       and (scheduled_for is null or scheduled_for <= (now() at time zone 'utc')::date + 1))
                   or (status = 'rendering' and render_attempts < 3
                       and coalesce(progress_at, approved_at) < now() - interval '15 minutes')
                order by coalesce(scheduled_for, (approved_at at time zone 'utc')::date), approved_at
                limit 1 for update skip locked)
  returning *;
end $$;

revoke all on function public.studio_claim_job() from public, anon, authenticated;
grant execute on function public.studio_claim_job() to service_role;

do $$
begin
  if (select count(*) from pg_attribute where attrelid = 'public.studio_videos'::regclass and not attisdropped
        and attname in ('progress', 'progress_at', 'render_attempts')) <> 3 then
    raise exception '398: a studio_videos column is missing';
  end if;
  if exists (select 1 from studio_videos where render_attempts <> 0 or progress is not null) then
    raise exception '398: new columns must start empty';
  end if;
  if has_function_privilege('anon', 'public.studio_claim_job()', 'execute')
     or has_function_privilege('authenticated', 'public.studio_claim_job()', 'execute') then
    raise exception '398: studio_claim_job is reachable from a browser role';
  end if;
  if not has_function_privilege('service_role', 'public.studio_claim_job()', 'execute') then
    raise exception '398: service_role lost studio_claim_job';
  end if;
end $$;
