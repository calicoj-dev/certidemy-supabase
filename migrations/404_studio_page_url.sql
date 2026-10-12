-- 404: a Studio video can be written from one page of the partner's own website (a course page, an event
-- page, any public page the partner chooses), not only from the home page. This column records it so a
-- rewrite reads the same page.
--
-- Writers: functions/studio draft and plan (from the request; public https only, as for the website).
-- Readers: functions/studio (rewrite, context). Nullable: most videos have none.

alter table public.studio_videos add column page_url text
  check (page_url is null or (page_url like 'https://%' and char_length(page_url) <= 2000));

do $$
begin
  if not exists (select 1 from pg_attribute where attrelid = 'public.studio_videos'::regclass and not attisdropped
                   and attname = 'page_url' and atttypid = 'text'::regtype and not attnotnull) then
    raise exception '404: studio_videos.page_url is missing or not a nullable text';
  end if;
  if exists (select 1 from studio_videos where page_url is not null) then
    raise exception '404: page_url must start null on every row';
  end if;
end $$;
