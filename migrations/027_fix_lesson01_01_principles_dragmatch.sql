-- 027_fix_lesson01_01_principles_dragmatch.sql
-- =============================================================================
-- Trim the 01-01 "match-principles-to-themes" drag-match from 12 items to 4,
-- per the interaction-sizing rule (matching widgets <= 4 items, ~1 per target).
-- One representative principle now anchors each of the four themes; the other
-- principles remain in the lesson's concept prose.
--
-- Recon (022-style) confirmed this widget exists ONLY in the EN row of 01-01,
-- so this fix targets language='en'. (es-419 / pt-BR 01-01 do not contain it.)
--
-- Uses regexp_replace anchored on the unique widget id + the block's "\n::"
-- terminator, so it matches the block structurally rather than by exact text.
-- Idempotent: re-running re-substitutes the identical 4-item block.
-- (Postgres regex: '.' matches newlines; '*?' is non-greedy; '&' is literal.)
-- =============================================================================

update public.lessons set content_md = regexp_replace(
  content_md,
  '::interactive widget="drag-match" id="match-principles-to-themes".*?\n::',
  $new$::interactive widget="drag-match" id="match-principles-to-themes" concept_slugs="agile-principles"
{
  "items": [
    { "id": "a", "text": "Welcome changing requirements, even late in development" },
    { "id": "b", "text": "Business people and developers work together daily" },
    { "id": "c", "text": "Sustain a constant pace the team can keep indefinitely" },
    { "id": "d", "text": "Give continuous attention to technical excellence" }
  ],
  "targets": [
    { "id": "t1", "text": "Deliver value early & welcome change" },
    { "id": "t2", "text": "People & collaboration" },
    { "id": "t3", "text": "Working software at a sustainable pace" },
    { "id": "t4", "text": "Craft & continuous improvement" }
  ],
  "correct": { "a": "t1", "b": "t2", "c": "t3", "d": "t4" },
  "explanation": "Each of these four principles anchors one theme of the Manifesto: welcoming change, collaboration, a sustainable pace, and technical craft. The Manifesto's other principles group under these same four themes — the exam asks you to recognize the theme a principle belongs to, not to recite exact wording."
}
::$new$,
  '')
where slug = '01-01-agile-manifesto' and language = 'en';

-- ---- VERIFICATION ------------------------------------------------------------
-- Expect 0 rows (item "l" / the 12-item set is gone):
-- select language from public.lessons
--  where slug = '01-01-agile-manifesto'
--    and content_md like '%Reflect at regular intervals, then tune and adjust%';
--
-- Confirm exactly one drag-match remains besides the values widget, now 4 items:
-- select l.language, x.ord, left(x.m[1], 80) as block_head
-- from public.lessons l
-- cross join lateral
--   regexp_matches(l.content_md, '::interactive widget="drag-match".*?\n::', 'g')
--   with ordinality as x(m, ord)
-- where l.slug = '01-01-agile-manifesto' order by l.language, x.ord;
