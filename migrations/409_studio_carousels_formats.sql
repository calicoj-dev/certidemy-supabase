-- 409: standalone carousels, content formats and the partner's real story.
-- A carousel is a third kind of piece: its text is drafted and reviewed for free and it counts when its slides are
-- ordered (studio_piece_reserve, 20 a month by default like the others); the worker renders it into deck.
-- format and story record what a video or a piece was written from, so a rewrite keeps using them.
--
-- Writers: functions/studio (studio_videos.format/story on draft; studio_pieces.format/story on write);
--          functions/manage-studio-plan (studio_piece_quota and studio_credits rows for 'carousel');
--          marketing/reels/studio/worker.mjs (studio_pieces.deck and render state, via studio_claim_carousel).
-- All new columns are nullable; no existing row is written.

alter table public.studio_pieces drop constraint if exists studio_pieces_kind_check;
alter table public.studio_pieces add constraint studio_pieces_kind_check check (kind in ('article', 'podcast', 'carousel'));
alter table public.studio_piece_quota drop constraint if exists studio_piece_quota_kind_check;
alter table public.studio_piece_quota add constraint studio_piece_quota_kind_check check (kind in ('article', 'podcast', 'carousel'));
alter table public.studio_credits drop constraint if exists studio_credits_product_check;
alter table public.studio_credits add constraint studio_credits_product_check check (product in ('video', 'article', 'podcast', 'carousel'));

-- deck: {pdf, slides[]} storage paths once the worker has made the slides.
alter table public.studio_pieces add column deck jsonb check (deck is null or jsonb_typeof(deck) = 'object');
alter table public.studio_pieces add column format text check (char_length(format) between 1 and 40);
alter table public.studio_pieces add column story text check (char_length(story) between 1 and 1500);
alter table public.studio_videos add column format text check (char_length(format) between 1 and 40);
alter table public.studio_videos add column story text check (char_length(story) between 1 and 1500);

create index studio_pieces_deck_queue on public.studio_pieces (status, approved_at) where kind = 'carousel' and status in ('approved', 'rendering');

-- The worker's carousel queue: one ordered carousel (a paused partner's wait), or one whose render stalled.
create or replace function public.studio_claim_carousel()
returns setof public.studio_pieces language plpgsql security definer set search_path = public as $$
begin
  update studio_pieces set status = 'failed', stage = null, quota_month = null, funding = null,
         error = 'The slides stopped three times. Try again.', updated_at = now()
   where kind = 'carousel' and status = 'rendering' and render_attempts >= 3
     and coalesce(progress_at, approved_at) < now() - interval '10 minutes';
  return query
  update studio_pieces set status = 'rendering', stage = null, progress_at = now(), render_attempts = render_attempts + 1, updated_at = now()
   where id = (select p.id from studio_pieces p
                where p.kind = 'carousel'
                  and (p.status = 'approved'
                    or (p.status = 'rendering' and p.render_attempts < 3 and coalesce(p.progress_at, p.approved_at) < now() - interval '10 minutes'))
                  and not exists (select 1 from studio_pauses s where s.issuer_id = p.issuer_id)
                order by p.approved_at
                limit 1 for update skip locked)
  returning *;
end $$;

revoke all on function public.studio_claim_carousel() from public, anon, authenticated;
grant execute on function public.studio_claim_carousel() to service_role;

-- Post-conditions: every kind/product check admits 'carousel' (and still refuses an unknown kind); no existing
-- piece gained a deck, format or story; the claim respects the pause and is service_role only.
do $$
declare v_bad text;
begin
  select string_agg(conrelid::regclass || '.' || conname, ', ') into v_bad from pg_constraint
   where contype = 'c' and conrelid in ('public.studio_pieces'::regclass, 'public.studio_piece_quota'::regclass, 'public.studio_credits'::regclass)
     and conname in ('studio_pieces_kind_check', 'studio_piece_quota_kind_check', 'studio_credits_product_check')
     and pg_get_constraintdef(oid) not like '%carousel%';
  if v_bad is not null then raise exception '409: a kind check does not admit carousel: %', v_bad; end if;
  if (select count(*) from pg_constraint where conname in ('studio_pieces_kind_check', 'studio_piece_quota_kind_check', 'studio_credits_product_check')
        and conrelid in ('public.studio_pieces'::regclass, 'public.studio_piece_quota'::regclass, 'public.studio_credits'::regclass)) <> 3 then
    raise exception '409: the three kind checks must exist';
  end if;
  select string_agg(conrelid::regclass || '.' || conname, ', ') into v_bad from pg_constraint
   where contype = 'c' and conrelid in ('public.studio_pieces'::regclass, 'public.studio_piece_quota'::regclass)
     and pg_get_constraintdef(oid) ~ '\(kind = ANY' and pg_get_constraintdef(oid) not like '%carousel%';
  if v_bad is not null then raise exception '409: another kind check refuses carousel: %', v_bad; end if;
  if exists (select 1 from studio_pieces where deck is not null or format is not null or story is not null)
     or exists (select 1 from studio_videos where format is not null or story is not null) then
    raise exception '409: no existing row may carry a deck, format or story';
  end if;
  if (select prosrc from pg_proc where oid = 'public.studio_claim_carousel()'::regprocedure) not like '%studio_pauses%' then
    raise exception '409: the carousel claim must respect the pause';
  end if;
  if has_function_privilege('anon', 'public.studio_claim_carousel()', 'execute')
     or has_function_privilege('authenticated', 'public.studio_claim_carousel()', 'execute')
     or not has_function_privilege('service_role', 'public.studio_claim_carousel()', 'execute') then
    raise exception '409: studio_claim_carousel must be service_role only';
  end if;
end $$;
