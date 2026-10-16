-- 408: the partner package includes 20 articles AND 20 podcast episodes a month (407 defaulted podcasts to 0).
-- The default now lives in one function, studio_piece_default_limit(), read by studio_piece_reserve; an explicit
-- studio_piece_quota row (a trial of 2, or anything Certidemy set by hand) still wins. No row is written.
--
-- Writers: none. Readers: functions/studio and functions/manage-studio-plan count against the same 20 (their
-- constants DEFAULT_LIMIT / PIECE_DEFAULT); scripts/check-migration-state.mjs calls the function as the print.

create or replace function public.studio_piece_default_limit()
returns int language sql immutable set search_path = public as $$ select 20 $$;

-- 407's reserve, unchanged except the default: the month's included pieces first, then one credit.
create or replace function public.studio_piece_reserve(p_piece uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_issuer uuid; v_kind text; v_status text; v_month date := date_trunc('month', (now() at time zone 'utc'))::date;
  v_limit int; v_used int; v_funding text := 'monthly';
begin
  select issuer_id, kind, status into v_issuer, v_kind, v_status from studio_pieces where id = p_piece for update;
  if v_issuer is null then return 'not_found'; end if;
  if v_status not in ('draft', 'failed') then return 'not_draft'; end if;
  if exists (select 1 from studio_pauses where issuer_id = v_issuer) then return 'paused'; end if;
  perform pg_advisory_xact_lock(hashtext('studio-piece:' || v_issuer::text || ':' || v_kind));
  v_limit := coalesce((select monthly_limit from studio_piece_quota where issuer_id = v_issuer and kind = v_kind),
                      studio_piece_default_limit());
  select count(*)::int into v_used from studio_pieces
   where issuer_id = v_issuer and kind = v_kind and quota_month = v_month and funding = 'monthly'
     and status in ('approved', 'rendering', 'done');
  if v_used >= v_limit then
    if studio_piece_balance(v_issuer, v_kind) < 1 then return 'quota'; end if;
    v_funding := 'credit';
  end if;
  update studio_pieces set status = 'approved', approved_at = now(), quota_month = v_month, funding = v_funding,
         error = null, stage = null, render_attempts = 0, updated_at = now()
   where id = p_piece;
  return 'approved';
end $$;

revoke all on function public.studio_piece_default_limit(), public.studio_piece_reserve(uuid) from public, anon, authenticated;
grant execute on function public.studio_piece_default_limit(), public.studio_piece_reserve(uuid) to service_role;

-- Post-conditions: the default is 20; the reserve reads it, still respects the pause, and no longer carries 407's
-- per-kind 0; both functions are service_role only.
do $$
declare v_src text := (select prosrc from pg_proc where oid = 'public.studio_piece_reserve(uuid)'::regprocedure);
begin
  if public.studio_piece_default_limit() <> 20 then raise exception '408: the default must be 20'; end if;
  if v_src not like '%studio_piece_default_limit()%' or v_src not like '%studio_pauses%' then
    raise exception '408: reserve must read the default and respect the pause';
  end if;
  if v_src like '%else 0%' then raise exception '408: reserve still carries the per-kind 0'; end if;
  if has_function_privilege('anon', 'public.studio_piece_reserve(uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.studio_piece_reserve(uuid)', 'execute')
     or has_function_privilege('anon', 'public.studio_piece_default_limit()', 'execute')
     or has_function_privilege('authenticated', 'public.studio_piece_default_limit()', 'execute') then
    raise exception '408: a studio function is reachable from a browser role';
  end if;
  if not (has_function_privilege('service_role', 'public.studio_piece_reserve(uuid)', 'execute')
          and has_function_privilege('service_role', 'public.studio_piece_default_limit()', 'execute')) then
    raise exception '408: service_role lost a studio function';
  end if;
end $$;
