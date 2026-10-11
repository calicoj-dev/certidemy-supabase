-- 399: studio carousels. Each finished video also gets a 4:5 carousel built from the same approved script:
-- JPEG slides (Instagram, TikTok) and one PDF (LinkedIn). carousel is null until the worker has made it,
-- {"pdf": path, "slides": [paths]} when it has, {"error": text} when it could not (it is not retried).
--
-- Writers of the new column:
--   certidemy-web marketing/reels/studio/worker.mjs   carousel (PATCH) on a done row: after its render, and as an
--                                                    idle backfill of done rows still null (which covers every
--                                                    row that existed before this migration)
--   functions/studio retry                           carousel = null (a fresh render gets a fresh carousel)
-- Reader: functions/studio (context: signs the paths). Nullable, so inserts need not name it.

alter table public.studio_videos
  add column carousel jsonb
  -- coalesce: a missing key is NULL, and a CHECK that evaluates to NULL passes
  constraint studio_videos_carousel_shape check (
    carousel is null
    or coalesce(jsonb_typeof(carousel -> 'error') = 'string', false)
    or coalesce(jsonb_typeof(carousel -> 'pdf') = 'string' and jsonb_typeof(carousel -> 'slides') = 'array', false)
  );

do $$
begin
  if not exists (select 1 from pg_attribute where attrelid = 'public.studio_videos'::regclass and not attisdropped
                   and attname = 'carousel' and atttypid = 'jsonb'::regtype and not attnotnull) then
    raise exception '399: studio_videos.carousel is missing or not a nullable jsonb';
  end if;
  if exists (select 1 from studio_videos where carousel is not null) then
    raise exception '399: carousel must start null on every row';
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.studio_videos'::regclass
                   and conname = 'studio_videos_carousel_shape' and contype = 'c') then
    raise exception '399: the carousel shape check is missing';
  end if;
end $$;
