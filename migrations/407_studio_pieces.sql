-- 407: Studio articles and podcasts ("pieces"). A partner writes an SEO article, or a two-voice podcast episode,
-- from up to three links and/or a Certidemy certification or lesson. An article counts against the month when
-- it is written; a podcast when its audio is ordered (the script is drafted and reviewed for free). Each kind has
-- its own monthly allowance (articles 20, podcasts 0 unless Certidemy sets one) and its own extra credits.
--
-- Writers: functions/studio (pieces, through studio_piece_reserve for anything that counts);
--          functions/manage-studio-plan (studio_piece_quota; studio_credits rows with product);
--          marketing/reels/studio/worker.mjs (podcast render state, via studio_claim_podcast).
-- Readers: the same, and studio_piece_balance.

create table public.studio_pieces (
  id             uuid primary key default gen_random_uuid(),
  issuer_id      uuid not null references public.issuers(id) on delete cascade,
  kind           text not null check (kind in ('article', 'podcast')),
  status         text not null default 'draft' check (status in ('draft', 'approved', 'rendering', 'done', 'failed')),
  language       text not null check (language in ('en', 'es-419', 'pt-BR')),
  prompt         text not null check (char_length(prompt) between 1 and 2000),
  sources        jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),
  article_id     uuid references public.studio_pieces(id) on delete set null,
  content        jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  personas       jsonb check (personas is null or jsonb_typeof(personas) = 'object'),
  revisions      int not null default 0,
  quota_month    date,
  funding        text check (funding in ('monthly', 'credit')),
  audio_path     text,
  duration_s     numeric,
  tts_chars      int,
  stage          text,
  error          text,
  render_attempts int not null default 0,
  progress_at    timestamptz,
  archived_at    timestamptz,
  created_by     uuid,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  approved_at    timestamptz,
  rendered_at    timestamptz,
  constraint studio_pieces_personas_only_podcast check (kind = 'podcast' or personas is null),
  constraint studio_pieces_counted_has_month check ((status in ('approved', 'rendering', 'done')) = (quota_month is not null and funding is not null))
);
create index studio_pieces_issuer on public.studio_pieces (issuer_id, created_at desc);
create index studio_pieces_queue on public.studio_pieces (status, approved_at) where kind = 'podcast' and status in ('approved', 'rendering');
alter table public.studio_pieces enable row level security;
revoke all on public.studio_pieces from public, anon, authenticated;

-- Included each month, per kind. No row: articles 20, podcasts 0.
create table public.studio_piece_quota (
  issuer_id     uuid not null references public.issuers(id) on delete cascade,
  kind          text not null check (kind in ('article', 'podcast')),
  monthly_limit int not null check (monthly_limit between 0 and 1000),
  primary key (issuer_id, kind)
);
alter table public.studio_piece_quota enable row level security;
revoke all on public.studio_piece_quota from public, anon, authenticated;

-- Extra credits are per product. Every existing row is a video credit; a refund (one finished video) stays video-only.
alter table public.studio_credits add column product text not null default 'video'
  check (product in ('video', 'article', 'podcast'));
alter table public.studio_credits add constraint studio_credits_refund_is_video check (kind <> 'refund' or product = 'video');

-- 402's balance, now video credits only (it summed every row; until 407 every row was a video credit).
create or replace function public.studio_credit_balance(p_issuer uuid)
returns int language sql stable security definer set search_path = public as $$
  select (coalesce((select sum(amount) from studio_credits where issuer_id = p_issuer and product = 'video'), 0)
        - (select count(*) from studio_videos where issuer_id = p_issuer and funding = 'credit'
             and status in ('approved', 'rendering', 'done')))::int;
$$;

create or replace function public.studio_piece_balance(p_issuer uuid, p_kind text)
returns int language sql stable security definer set search_path = public as $$
  select (coalesce((select sum(amount) from studio_credits where issuer_id = p_issuer and product = p_kind), 0)
        - (select count(*) from studio_pieces where issuer_id = p_issuer and kind = p_kind and funding = 'credit'
             and status in ('approved', 'rendering', 'done')))::int;
$$;

-- Count a piece: the month's included pieces first, then one credit. 'approved' for a podcast (the worker renders
-- it next), 'approved' for an article too (functions/studio marks it done once written, or deletes it, which gives
-- the slot back). 'paused' (406), 'quota' when there is neither, 'not_draft' when it already counts.
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
                      case v_kind when 'article' then 20 else 0 end);
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

-- The worker's queue: one approved podcast (a paused partner's wait), or one whose render stalled.
create or replace function public.studio_claim_podcast()
returns setof public.studio_pieces language plpgsql security definer set search_path = public as $$
begin
  update studio_pieces set status = 'failed', stage = null, quota_month = null, funding = null,
         error = 'The audio stopped three times. Try again.', updated_at = now()
   where kind = 'podcast' and status = 'rendering' and render_attempts >= 3
     and coalesce(progress_at, approved_at) < now() - interval '15 minutes';
  return query
  update studio_pieces set status = 'rendering', stage = null, progress_at = now(), render_attempts = render_attempts + 1, updated_at = now()
   where id = (select p.id from studio_pieces p
                where p.kind = 'podcast'
                  and (p.status = 'approved'
                    or (p.status = 'rendering' and p.render_attempts < 3 and coalesce(p.progress_at, p.approved_at) < now() - interval '15 minutes'))
                  and not exists (select 1 from studio_pauses s where s.issuer_id = p.issuer_id)
                order by p.approved_at
                limit 1 for update skip locked)
  returning *;
end $$;

revoke all on function public.studio_credit_balance(uuid), public.studio_piece_balance(uuid, text),
  public.studio_piece_reserve(uuid), public.studio_claim_podcast() from public, anon, authenticated;
grant execute on function public.studio_credit_balance(uuid), public.studio_piece_balance(uuid, text),
  public.studio_piece_reserve(uuid), public.studio_claim_podcast() to service_role;

-- Post-conditions: the new tables start empty and are closed to browser roles; every existing credit row is a video
-- credit and the video balance is unchanged for every issuer; the functions are service_role only.
do $$
declare v_bad text;
begin
  if exists (select 1 from studio_pieces) or exists (select 1 from studio_piece_quota) then
    raise exception '407: new tables must start empty';
  end if;
  select string_agg(id::text, ', ') into v_bad from studio_credits where product <> 'video';
  if v_bad is not null then raise exception '407: existing credits must be video credits: %', v_bad; end if;
  -- the new balance equals 402's formula (all rows) for every issuer that has credits or credit-funded videos
  select string_agg(i::text, ', ') into v_bad from (
    select distinct issuer_id as i from studio_credits union select distinct issuer_id from studio_videos where funding = 'credit'
  ) x
   where studio_credit_balance(i) <> (coalesce((select sum(amount) from studio_credits where issuer_id = i), 0)
        - (select count(*) from studio_videos where issuer_id = i and funding = 'credit' and status in ('approved', 'rendering', 'done')))::int;
  if v_bad is not null then raise exception '407: video balance changed for %', v_bad; end if;
  if has_table_privilege('anon', 'public.studio_pieces', 'select') or has_table_privilege('authenticated', 'public.studio_pieces', 'select')
     or has_table_privilege('authenticated', 'public.studio_piece_quota', 'select') then
    raise exception '407: a new table is reachable from a browser role';
  end if;
  if has_function_privilege('authenticated', 'public.studio_piece_reserve(uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.studio_claim_podcast()', 'execute')
     or has_function_privilege('authenticated', 'public.studio_piece_balance(uuid, text)', 'execute') then
    raise exception '407: a studio function is reachable from a browser role';
  end if;
  if not (has_function_privilege('service_role', 'public.studio_piece_reserve(uuid)', 'execute')
          and has_function_privilege('service_role', 'public.studio_claim_podcast()', 'execute')
          and has_function_privilege('service_role', 'public.studio_credit_balance(uuid)', 'execute')) then
    raise exception '407: service_role lost a studio function';
  end if;
  if (select prosrc from pg_proc where oid = 'public.studio_piece_reserve(uuid)'::regprocedure) not like '%studio_pauses%'
     or (select prosrc from pg_proc where oid = 'public.studio_claim_podcast()'::regprocedure) not like '%studio_pauses%' then
    raise exception '407: reserve and claim must respect the pause';
  end if;
end $$;
