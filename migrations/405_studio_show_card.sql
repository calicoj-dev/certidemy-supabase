-- 405: a Studio video can leave out the sample credential. With show_card false, scene 3 is the key takeaway
-- (a mini-lesson) instead of the credential card; the end scene is unchanged. Default true keeps every
-- existing video and every insert that does not name it exactly as before.
--
-- Writers (NOT NULL, default true): functions/studio draft and plan write it from the request; no other
-- code inserts studio_videos (checked: from("studio_videos") inserts exist only in functions/studio).
-- Readers: functions/studio (rewrite, approve -> render.scene3, context) and the console.

alter table public.studio_videos add column show_card boolean not null default true;

do $$
begin
  if not exists (select 1 from pg_attribute where attrelid = 'public.studio_videos'::regclass and not attisdropped
                   and attname = 'show_card' and atttypid = 'boolean'::regtype and attnotnull) then
    raise exception '405: studio_videos.show_card is missing or not a NOT NULL boolean';
  end if;
  if exists (select 1 from studio_videos where not show_card) then
    raise exception '405: every existing video must keep its card';
  end if;
end $$;
