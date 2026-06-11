-- Migration 009: unpublish GAIPC until its blueprint is populated.
--
-- GAIPC's certifications row exists with is_published = true, but its JTA
-- side is empty (0 domains, 0 tasks) and its content side is partial (4
-- concepts, 5 modules, 0 lessons). A learner clicking through to it from
-- the public catalog would land on routes that resolve via getCertByCode
-- but then dead-end — radar with no domains, catalog with no lessons, quiz
-- engine with no questions, etc.
--
-- Setting is_published = false hides it from the catalog and makes
-- getCertByCode return null for it, so /learn/gaipc/* cleanly 404s
-- instead of routing to a broken page. The cert row stays in place; when
-- the blueprint is populated, a follow-up migration flips it back.
--
-- Idempotent: re-running this against an already-unpublished row is a no-op.

begin;

update public.certifications
   set is_published = false,
       updated_at   = now()
 where code = 'GAIPC'
   and is_published = true;

-- Sanity check: GAIPC's row should now read as unpublished. Fail loud if it
-- somehow didn't update — better than silently letting it stay live.
do $$
declare
  is_pub boolean;
begin
  select is_published into is_pub
  from public.certifications where code = 'GAIPC';
  if is_pub is null then
    -- No GAIPC row at all; surprising but not a failure.
    raise notice 'GAIPC row not found; nothing to unpublish.';
  elsif is_pub then
    raise exception 'GAIPC is still published after migration; update did not apply.';
  end if;
end $$;

commit;
