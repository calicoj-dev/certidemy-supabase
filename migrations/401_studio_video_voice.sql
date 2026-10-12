-- 401: the voice is chosen per video, among the voices of its language, when the video is created (and can change
-- while it is a draft). It used to be one brand-wide voice, so a partner choosing a Spanish voice silently got the
-- default in Portuguese and English. Null on videos made before: approval falls back to the brand voice, then the
-- language default, as it did.
--
-- Writers of the new column:
--   functions/studio draft, plan   voice_id from the request (checked against the video's language)
--   functions/studio voice         voice_id on a draft
-- Readers: functions/studio context (the console preselects the last voice used per language) and approve
-- (the render snapshot). Nullable, so no other insert needs to name it.

alter table public.studio_videos add column voice_id text;

do $$
begin
  if not exists (select 1 from pg_attribute where attrelid = 'public.studio_videos'::regclass and not attisdropped
                   and attname = 'voice_id' and atttypid = 'text'::regtype and not attnotnull) then
    raise exception '401: studio_videos.voice_id is missing or not a nullable text';
  end if;
  if exists (select 1 from studio_videos where voice_id is not null) then
    raise exception '401: voice_id must start null on every row';
  end if;
end $$;
