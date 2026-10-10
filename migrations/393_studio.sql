-- 393: studio -- partner marketing videos (brand kit, AI drafts, render queue, monthly quota).
--
-- Writers (both tables are new; every NOT NULL column is written by these and nothing else):
--   functions/studio        brand kits (save_brand), videos (draft, edit), approval via studio_approve()
--   certidemy-web marketing/reels/studio/worker.mjs   claims jobs via studio_claim_job(), writes
--                           status / render_path / tts_chars / error / rendered_at on the claimed row
-- Closed to browsers: RLS on, no grants to anon or authenticated. Everything goes through the function.

create table public.studio_brand_kits (
  issuer_id    uuid primary key references public.issuers(id) on delete cascade,
  theme        text not null default 'dark' check (theme in ('dark', 'light')),
  color_main   text not null default '#0b1f4b' check (color_main ~ '^#[0-9a-fA-F]{6}$'),
  color_accent text not null default '#2f7bff' check (color_accent ~ '^#[0-9a-fA-F]{6}$'),
  logo_path    text,
  voice_id     text,
  website      text check (website is null or website ~ '^https://'),
  updated_at   timestamptz not null default now(),
  updated_by   uuid
);

create table public.studio_videos (
  id                   uuid primary key default gen_random_uuid(),
  issuer_id            uuid not null references public.issuers(id) on delete cascade,
  created_by           uuid not null,
  status               text not null default 'draft'
                         check (status in ('draft', 'approved', 'rendering', 'done', 'failed')),
  language             text not null check (language in ('en', 'es-419', 'pt-BR')),
  prompt               text not null check (char_length(prompt) between 1 and 2000),
  achievement_id       uuid references public.achievements(id) on delete set null,
  script               jsonb not null,
  revisions            int not null default 0,
  claude_input_tokens  int not null default 0,
  claude_output_tokens int not null default 0,
  tts_chars            int not null default 0,
  render_path          text,
  error                text,
  created_at           timestamptz not null default now(),
  approved_at          timestamptz,
  rendered_at          timestamptz
);
create index studio_videos_issuer_created on public.studio_videos (issuer_id, created_at desc);
create index studio_videos_queue on public.studio_videos (approved_at) where status = 'approved';

-- Per-issuer override; absent means the default of 20 a month.
create table public.studio_quota (
  issuer_id     uuid primary key references public.issuers(id) on delete cascade,
  monthly_limit int not null check (monthly_limit >= 0)
);

alter table public.studio_brand_kits enable row level security;
alter table public.studio_videos     enable row level security;
alter table public.studio_quota      enable row level security;
revoke all on public.studio_brand_kits, public.studio_videos, public.studio_quota from anon, authenticated;

-- Approve a draft against the month's quota. A failed render does not count: it was not delivered.
create or replace function public.studio_approve(p_video uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_issuer uuid; v_status text; v_limit int; v_used int;
begin
  select issuer_id, status into v_issuer, v_status from studio_videos where id = p_video for update;
  if v_issuer is null then return 'not_found'; end if;
  if v_status <> 'draft' then return 'not_draft'; end if;
  perform pg_advisory_xact_lock(hashtext('studio:' || v_issuer::text));
  v_limit := coalesce((select monthly_limit from studio_quota where issuer_id = v_issuer), 20);
  select count(*)::int into v_used from studio_videos
   where issuer_id = v_issuer and approved_at >= date_trunc('month', now()) and status <> 'failed';
  if v_used >= v_limit then return 'quota'; end if;
  update studio_videos set status = 'approved', approved_at = now() where id = p_video;
  return 'approved';
end $$;

-- Hand the oldest approved video to one worker; SKIP LOCKED lets several workers run safely.
create or replace function public.studio_claim_job()
returns setof public.studio_videos language sql security definer set search_path = public as $$
  update studio_videos set status = 'rendering'
   where id = (select id from studio_videos where status = 'approved'
                order by approved_at limit 1 for update skip locked)
  returning *;
$$;

revoke all on function public.studio_approve(uuid), public.studio_claim_job() from public, anon, authenticated;
grant execute on function public.studio_approve(uuid), public.studio_claim_job() to service_role;

-- Private bucket: logos and rendered videos, read through signed URLs only.
insert into storage.buckets (id, name, public) values ('studio', 'studio', false)
on conflict (id) do nothing;

-- Post-conditions: tables closed to browsers, functions not callable by them, bucket private.
do $$
begin
  if has_table_privilege('authenticated', 'public.studio_videos', 'select')
     or has_table_privilege('anon', 'public.studio_videos', 'select')
     or has_table_privilege('authenticated', 'public.studio_brand_kits', 'select') then
    raise exception '393: studio tables are readable by a browser role';
  end if;
  if has_function_privilege('authenticated', 'public.studio_approve(uuid)', 'execute')
     or has_function_privilege('anon', 'public.studio_claim_job()', 'execute') then
    raise exception '393: studio functions are executable by a browser role';
  end if;
  if not has_function_privilege('service_role', 'public.studio_claim_job()', 'execute') then
    raise exception '393: service_role cannot claim jobs';
  end if;
  if (select public from storage.buckets where id = 'studio') then
    raise exception '393: studio bucket is public';
  end if;
end $$;
