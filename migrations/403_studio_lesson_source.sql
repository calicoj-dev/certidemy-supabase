-- 403: Studio videos from a Certidemy certification. A partner picks a certification and either one of its
-- lessons (the video teaches that lesson's idea) or the certification itself (the video presents it). The
-- writer only ever sees lesson text that get_lesson would serve: the catalog and the source both read the
-- verdict from mcp.lesson_index (body_available = lesson_body_is_servable), so a withheld lesson is never
-- listed and never read, and the twelve-certification scope is the view's, not a second list here.
--
-- Writers of studio_videos.source: functions/studio draft and plan (from the request, checked against
-- studio_lesson_catalog). Nullable: a video written from the partner's own message has none.
-- Readers: functions/studio (context, rewrite, approve) and the console.

alter table public.studio_videos add column source jsonb
  check (source is null or (jsonb_typeof(source) = 'object'
    and coalesce(source ->> 'kind', '') in ('lesson', 'certification')
    and coalesce(source ->> 'certification', '') <> ''
    and ((source ->> 'kind') = 'certification' or coalesce(source ->> 'lesson_id', '') <> '')));

-- The lessons a partner may make a video from, in one language, in course order.
create or replace function public.studio_lesson_catalog(p_lang text)
returns table (certification text, module_title text, module_order int, lesson_id uuid, lesson_title text, lesson_order int)
language sql stable security definer set search_path = '' as $$
  select i.certification, i.module_title, i.module_order, l.id, i.lesson_title, i.lesson_order
    from mcp.lesson_index i
    join public.lessons l on l.slug = i.lesson_slug and l.language = i.language
    join public.modules m on m.id = l.module_id and m.slug = i.module_slug
    join public.certifications c on c.id = m.certification_id and c.code = i.certification
   where i.language = p_lang and i.body_available
   order by i.certification, i.module_order, i.lesson_order;
$$;

-- One lesson's body for the writer, or no row when it is not servable (or not in the twelve).
create or replace function public.studio_lesson_source(p_lesson uuid)
returns table (certification text, language text, module_title text, lesson_title text, content_md text)
language sql stable security definer set search_path = '' as $$
  select i.certification, l.language, i.module_title, i.lesson_title, l.content_md
    from public.lessons l
    join public.modules m on m.id = l.module_id
    join public.certifications c on c.id = m.certification_id
    join mcp.lesson_index i on i.certification = c.code and i.module_slug = m.slug
                           and i.lesson_slug = l.slug and i.language = l.language
   where l.id = p_lesson and i.body_available;
$$;

revoke all on function public.studio_lesson_catalog(text), public.studio_lesson_source(uuid) from public, anon, authenticated;
grant execute on function public.studio_lesson_catalog(text), public.studio_lesson_source(uuid) to service_role;

-- Post-conditions. The catalog is exactly the servable index, per language (both directions, and not vacuous);
-- a withheld lesson yields no source and a servable one yields one; browser roles are closed, service_role open.
do $$
declare v_lang text; v_cat int; v_idx int; v_dup int; v_withheld uuid; v_ok uuid; v_n int;
begin
  foreach v_lang in array array['en', 'es-419', 'pt-BR'] loop
    select count(*)::int, (count(*) - count(distinct lesson_id))::int into v_cat, v_dup from public.studio_lesson_catalog(v_lang);
    select count(*)::int into v_idx from mcp.lesson_index where language = v_lang and body_available;
    if v_idx = 0 then raise exception '403: no servable % lessons in mcp.lesson_index; the check would be vacuous', v_lang; end if;
    if v_cat <> v_idx then raise exception '403: % catalog has % lessons, the index % servable', v_lang, v_cat, v_idx; end if;
    if v_dup <> 0 then raise exception '403: % catalog repeats % lesson(s)', v_lang, v_dup; end if;
  end loop;

  select l.id into v_ok from public.lessons l
    join public.modules m on m.id = l.module_id join public.certifications c on c.id = m.certification_id
    join mcp.lesson_index i on i.certification = c.code and i.module_slug = m.slug and i.lesson_slug = l.slug and i.language = l.language
   where i.body_available limit 1;
  select count(*)::int into v_n from public.studio_lesson_source(v_ok);
  if v_n <> 1 then raise exception '403: a servable lesson returned % source rows', v_n; end if;

  select l.id into v_withheld from public.lessons l where not public.lesson_body_is_servable(l.id) limit 1;
  if v_withheld is not null then
    select count(*)::int into v_n from public.studio_lesson_source(v_withheld);
    if v_n <> 0 then raise exception '403: withheld lesson % returned its body', v_withheld; end if;
  end if;

  if has_function_privilege('anon', 'public.studio_lesson_source(uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.studio_lesson_source(uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.studio_lesson_catalog(text)', 'execute') then
    raise exception '403: a lesson source function is reachable from a browser role';
  end if;
  if not (has_function_privilege('service_role', 'public.studio_lesson_source(uuid)', 'execute')
          and has_function_privilege('service_role', 'public.studio_lesson_catalog(text)', 'execute')) then
    raise exception '403: service_role cannot read the lesson source';
  end if;
end $$;
