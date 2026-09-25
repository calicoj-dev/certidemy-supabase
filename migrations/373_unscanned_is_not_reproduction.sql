-- 373 -- "the scanner has not run yet" is not "this reproduces ISO text".
--
-- ############ 371 CLOSED ONE BRANCH-WITH-TWO-CAUSES AND LEFT ANOTHER #########
--
-- 371's reason function opens:
--
--     when not l.mcp_servable then 'iso_reproduction'
--
-- `mcp_servable` is false for TWO unrelated reasons, and CLAUDE.md already
-- records that they must be reported apart:
--
--   > `mcp_scanned_at IS NULL` is UNSCANNED, `mcp_servable = false` with a
--   > timestamp is REFUSED, and the two are reported apart because only the
--   > first is an open item.
--
-- `trg_lessons_clear_mcp_servable` fires BEFORE UPDATE on any body change and
-- sets `mcp_servable = false` with `mcp_scanned_at = null`. That is fail-closed
-- and correct. It also means **every edit to a lesson body puts that row into a
-- state 371 reports as ISO reproduction** -- the exact false statement 371 was
-- written to remove, arriving through a different door, on rows that
-- demonstrably do not reproduce anything.
--
-- ############ LATENT TODAY, AND LATENT IS NOT SAFE ############
--
-- Measured before writing this:
--
--   mcp_servable false, mcp_scanned_at NULL      0    <- would be mis-reported
--   mcp_servable false, scanned                  6    <- genuinely refused
--   mcp_servable true, never scanned             0
--
-- Zero rows are affected right now, because the corpus is fully scanned. The
-- count goes to 12 the moment the pending retranslation batch writes, and to
-- more than that after any lesson edit by anyone. A defect that is unobserved
-- because nobody has edited a lesson today is not a defect that is fixed.
--
-- ############ AND IT IS WORSE THAN A WRONG LABEL ############
--
-- The two need OPPOSITE responses. `iso_reproduction` tells a partner the
-- content is withheld permanently and retrying will not help -- which is true
-- of a real reproduction. `unscanned` is a state that clears itself the next
-- time `scan-iso-leaks` runs. Telling a partner the first when the second is
-- true is both false and unactionable.
--
-- The verdict does not move: an unscanned body is still withheld, which is the
-- fail-closed behaviour the trigger exists for. Only the REASON changes.

do $mig$
declare
  v_before jsonb;
  v_moved  int;
  v_who    text;
  v_iso    int;
  v_uns    int;
  v_rev    int;
  v_prov   int;
begin
  select jsonb_object_agg(l.id::text, public.lesson_body_is_servable(l.id))
    into v_before from public.lessons l;

  execute $fn$
    create or replace function mcp.lesson_withholding_reason(p_lesson_id uuid)
     returns text
     language sql
     stable security definer
     set search_path to ''
    as $body$
      select case
        -- THE SCANNER HAS NOT RUN. Ordered FIRST because it is the narrower
        -- claim: every unscanned row also has mcp_servable false, so putting
        -- the reproduction arm first swallows it -- which is what it did.
        -- Clears itself when scan-iso-leaks next runs.
        when not l.mcp_servable and l.mcp_scanned_at is null then 'unscanned'

        -- THE SCANNER RAN AND REFUSED. The only arm that may ever be reported
        -- to a caller as reproduction, because it is the only one that measured
        -- any.
        when not l.mcp_servable then 'iso_reproduction'

        when l.language <> 'en'
         and l.mcp_translation_review_required
         and not exists (
           select 1
             from public.lesson_translation_reviews r
             join public.lessons en
               on en.lesson_group_id = l.lesson_group_id
              and en.language = 'en'
            where r.lesson_id = l.id
              and r.verdict = 'approved'
              and r.en_hash = left(md5(en.content_md), 8)
              and r.tr_hash = public.translation_hash(l.content_md)
         ) then 'translation_review'

        when l.language <> 'en'
         and l.en_content_hash is not null
         and l.en_content_hash <> (
              select public.translation_hash(en2.content_md)
                from public.lessons en2
               where en2.lesson_group_id = l.lesson_group_id
                 and en2.language = 'en'
               limit 1
            ) then 'provenance_stale'

        else null
      end
        from public.lessons l
       where l.id = p_lesson_id
    $body$;
  $fn$;

  -- ####### POST-CONDITIONS #######

  -- NEGATIVE, AND IT IS THE WHOLE SAFETY ARGUMENT: splitting a reason must not
  -- move a verdict. An unscanned row was withheld before and is withheld now.
  select count(*), string_agg(l.slug || '/' || l.language, ', ')
    into v_moved, v_who
    from public.lessons l
   where (v_before ->> l.id::text)::boolean is distinct from public.lesson_body_is_servable(l.id);
  if v_moved <> 0 then
    raise exception 'servability moved on % row(s)', v_moved
      using detail = left(v_who, 300), hint = 'only the reason may change';
  end if;

  select count(*) filter (where withholding_reason = 'iso_reproduction'),
         count(*) filter (where withholding_reason = 'unscanned'),
         count(*) filter (where withholding_reason = 'translation_review'),
         count(*) filter (where withholding_reason = 'provenance_stale')
    into v_iso, v_uns, v_rev, v_prov
    from mcp.lesson_index;

  -- POSITIVE: the reproduction arm still reports the rows the scanner refused.
  -- A split that swallowed them would pass every negative check above.
  if v_iso <> 6 - v_uns then
    raise exception 'iso_reproduction is % with % unscanned; the two must sum to the 6 unservable-by-column rows',
      v_iso, v_uns;
  end if;
  if v_rev = 0 then
    raise exception 'no row reports translation_review' using hint = 'the review arm vanished';
  end if;

  -- Every withheld row still carries a reason, and no servable row carries one.
  if exists (select 1 from mcp.lesson_index where body_available and withholding_reason is not null) then
    raise exception 'a servable row carries a withholding reason';
  end if;
  if exists (select 1 from mcp.lesson_index where not body_available and withholding_reason is null) then
    raise exception 'a withheld row carries no reason' using hint = 'a fifth state';
  end if;

  raise notice '373: iso %, unscanned %, review %, provenance %', v_iso, v_uns, v_rev, v_prov;
  if v_uns = 0 then
    raise notice '373: unscanned VACUOUS (0) -- expected; the corpus is fully scanned';
  end if;
end
$mig$;

-- ############ APPLIED 2026-09-24, AND EXERCISED THE SAME DAY ############
--
-- A no-op on application, as predicted: verdicts moved on 0 rows, reasons
-- changed on 0 rows, unscanned VACUOUS at 0.
--
-- Then the retranslation batch wrote 12 lesson bodies and the arm fired:
--
--   immediately after the write   12 rows  reason = unscanned
--   after scan-iso-leaks          10 rows  reason = translation_review
--                                  2 rows  reason = null  (serving again)
--
-- Without this migration all 12 would have been refused with "it reproduces
-- clause text from an ISO standard". The arm was watched to fire AND to clear,
-- which is more than most gates here can say on their first day.

-- Read it back, as a separate statement.
select withholding_reason, count(*) as rows
  from mcp.lesson_index group by withholding_reason order by rows desc;
