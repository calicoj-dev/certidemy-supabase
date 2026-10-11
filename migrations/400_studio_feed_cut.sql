-- 400: the 4:5 feed cut of each studio video (1080x1350, for the Instagram, LinkedIn and Facebook feed), rendered
-- by the worker from the same scenes and the same audio as the vertical video. Null when there is none: every video
-- made before this migration, or one whose cut failed (the vertical is still delivered).
--
-- Writers of the new column:
--   certidemy-web marketing/reels/studio/worker.mjs   feed_path (PATCH) right after the row is marked done
--   functions/studio retry                           feed_path = null (a fresh render makes a fresh cut)
-- Reader: functions/studio (context: signs the path). Nullable, so inserts need not name it.

alter table public.studio_videos add column feed_path text;

do $$
begin
  if not exists (select 1 from pg_attribute where attrelid = 'public.studio_videos'::regclass and not attisdropped
                   and attname = 'feed_path' and atttypid = 'text'::regtype and not attnotnull) then
    raise exception '400: studio_videos.feed_path is missing or not a nullable text';
  end if;
  if exists (select 1 from studio_videos where feed_path is not null) then
    raise exception '400: feed_path must start null on every row';
  end if;
end $$;
