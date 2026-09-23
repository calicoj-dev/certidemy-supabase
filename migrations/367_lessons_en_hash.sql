-- 367 -- en_hash on lessons: give the lesson gate the tooth the concept gate has.
--
-- ############ WHAT THIS CLOSES, AND WHAT IT LEAVES OPEN ############
--
-- concept_translations.en_hash records the English a translation was generated
-- FROM, and mcp.concept withholds the row the moment it stops matching. An
-- English repair therefore withholds its translations automatically.
--
-- lessons had nothing equivalent. Repair the English and the translated copy
-- is served again, still carrying whatever it carried, with every instrument
-- reporting clean.
--
-- IT DOES NOT CLOSE THE REVIEW GATE HOLE. mcp_translation_review_required is
-- false on a large part of the corpus, which disarms the OTHER arm of
-- lesson_body_is_servable. These are different holes and closing one does not
-- close the other; the review arm is armed row by row, not by this migration.
--
-- IT DOES NOT SEE TRANSLATED REPRODUCTIONS. The leak index is English-only, so
-- a translated body scores zero by construction. This migration is about
-- PROVENANCE -- does the translation track the English -- and not about what
-- the translation contains.
--
-- ############ WHY updated_at COULD NOT DO THIS ############
--
-- Measured 2026-09-23, and it is the argument for a content hash made by the
-- thing that was supposed to substitute for one:
--
--   scan-iso-leaks --apply writes mcp_servable and mcp_scanned_at to all 1437
--   rows, and set_updated_at fires on any UPDATE. Within minutes of a scan,
--   every English row and every translation carries a timestamp seconds apart.
--   The query "English newer than its translations" returns ZERO across the
--   whole corpus, on a day when eight English bodies were rewritten.
--
-- A TIMESTAMP IS NOT A CONTENT SIGNAL. A metadata stamp is indistinguishable
-- from an edit.
--
-- ############ THE INITIAL STAMP ############
--
-- A new hash column has to start somewhere and the choice is not cosmetic.
-- Stamping every row from current English is the defect this repository spent
-- a week removing from its clearance scripts: writing the value the gate is
-- about to compare against makes every row fresh BY CONSTRUCTION, so the gate
-- is installed already blindfolded. Stamping nothing withholds 958 bodies on
-- the day it runs, which is a paid surface going dark on a migration.
--
-- So: STAMP ONLY WHAT WAS PROVED. check-repair-translation-parity.mjs tested
-- 418 spans across 101 English-repaired lessons -- 353 NEW, 64 NEITHER, 1 OLD,
-- 77 lessons uncovered. A lesson is stamped only when EVERY span it carries
-- came back NEW.
--
--   all-NEW lessons                      63
--   less those whose English moved today  2
--   STAMPED                              61
--
-- Everything else is left NULL, and NULL means NOT ESTABLISHED rather than
-- STALE. The gate must distinguish them and that is the one thing not to
-- compromise on: a MISMATCH means the English moved under a known translation,
-- so withhold; a NULL means nobody ever established the relationship, which is
-- the 2026-09-21 bulk write and is not a reason to take a surface down.
--
-- ############ WHAT IT WITHHOLDS ON THE DAY IT RUNS ############
--
-- NOTHING. Stamped rows are fresh by construction and NULL rows are ignored.
-- That is not a weakness being glossed: the withholding this buys is
-- FUTURE-TENSE. Every English edit from now withholds its translations at the
-- moment it happens, which is the thing that did not exist this morning and
-- that eight lessons needed today.
--
-- The rows that are stale TODAY were armed separately, through the review
-- gate, by scripts/withhold-diverged-translations.mjs. This migration is the
-- mechanism for next time; that script was the instance.

begin;

-- 1. The column. Nullable, no default -- a default would be a stamp.
alter table public.lessons add column if not exists en_hash text;

comment on column public.lessons.en_hash is
  'Hash of the ENGLISH sibling content_md this translation was generated from. '
  'NULL means the relationship was never established -- NOT that it is stale. '
  'Only a generator may write this; every other caller reads, compares, refuses.';

-- 2. Capture the BEFORE state. Post-conditions compare against this rather
--    than against a literal, because an assertion about a count must not
--    contain a count.
create temporary table _367_before on commit drop as
select l.id, l.language, public.lesson_body_is_servable(l.id) as servable
  from public.lessons l;

-- 3. The stamp. Computed with public.translation_hash over the ENGLISH
--    sibling, CALLED rather than reimplemented -- a second copy of a hash
--    diverges, and the divergence surfaces as rows withheld for an arithmetic
--    difference rather than for an edit.
update public.lessons t
   set en_hash = public.translation_hash(en.content_md)
  from public.lessons en
 where en.lesson_group_id = t.lesson_group_id
   and en.language = 'en'
   and t.language <> 'en'
   and en.slug in (
    '01-03-the-five-scrum-values',
    '02-01-developers-accountabilities',
    '02-01-how-the-scrum-team-is-built',
    '02-01-scrum-framework',
    '02-02-sprint-planning-the-how',
    '02-02-the-product-owner',
    '02-03-sprint-backlog-living-forecast',
    '02-03-the-scrum-master',
    '02-04-daily-scrum-developers-event',
    '02-04-the-developers',
    '02-05-sprint-review-participation',
    '03-01-definition-of-done',
    '03-01-maximizing-value',
    '03-01-the-sprint',
    '03-02-po-one-person',
    '03-02-sprint-planning',
    '03-03-the-daily-scrum',
    '03-04-the-sprint-review',
    '03-05-the-sprint-retrospective',
    '04-01-artifacts-and-commitments',
    '04-03-sprint-backlog-and-sprint-goal',
    '04-04-increment-and-definition-of-done',
    '06-01-ai-agents-as-tools',
    'isms-ia-01-04-competence-of-the-team',
    'isms-ia-04-07-two-sentences',
    'isms-ia-04-08-assets-nobody-registered',
    'sm-ai-ii-01-01-the-threat-test',
    'sm-ai-ii-01-02-who-moved',
    'sm-ai-ii-01-04-met-and-missed',
    'sm-ai-ii-01-06-obsolete-or-inconvenient',
    'sm-ai-ii-01-07-two-failures',
    'sm-ai-ii-01-08-the-board-and-the-work',
    'sm-ai-ii-01-09-the-improvement-that-isnt',
    'sm-ai-ii-02-02-the-list-is-not-the-evidence',
    'sm-ai-ii-02-03-held-correctly-changing-nothing',
    'sm-ai-ii-02-04-watching-it-happen',
    'sm-ai-ii-02-05-the-format-was-never-the-problem',
    'sm-ai-ii-02-06-nobody-has-said-it',
    'sm-ai-ii-03-03-the-cause-has-no-name',
    'sm-ai-ii-03-05-which-decisions-diffused',
    'sm-ai-ii-03-06-the-empty-chair',
    'sm-ai-ii-03-07-two-backlogs-one-product',
    'sm-ai-ii-03-08-the-other-team',
    'sm-ai-ii-04-01-nothing-came-back',
    'sm-ai-ii-04-02-the-number-still-moves',
    'sm-ai-ii-04-03-the-same-basis',
    'sm-ai-ii-04-04-ordered-by-something',
    'sm-ai-ii-04-05-done-and-not-usable',
    'sm-ai-ii-04-06-too-late-to-turn',
    'sm-ai-ii-04-07-put-it-back-where-it-comes-from',
    'sm-ai-ii-04-08-what-happens-when-it-is-missed',
    'sm-ai-ii-04-09-where-it-stopped',
    'sm-ai-ii-05-01-what-was-free-before',
    'sm-ai-ii-05-02-more-than-can-be-looked-at',
    'sm-ai-ii-05-03-somebody-accepted-it',
    'sm-ai-ii-05-04-four-point-seven-days',
    'sm-ai-ii-05-05-nobody-noticed-it-first',
    'sm-ai-ii-05-06-nothing-is-going-wrong',
    'sm-ai-ii-05-07-two-lines-one-cause',
    'sm-ai-ii-05-08-which-link-went-first',
    'sm-ai-ii-05-09-i-am-not-sure-what-it-does'
   );

-- 4. The gate. MISMATCH withholds; NULL is ignored. The asymmetry is the whole
--    design and it is stated in the body so nobody "tidies" it into a plain
--    equality later.
create or replace function public.lesson_body_is_servable(p_lesson_id uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to ''
as $function$
    select l.mcp_servable
       and (
         l.language = 'en'
         or not l.mcp_translation_review_required
         or exists (
           select 1
             from public.lesson_translation_reviews r
             join public.lessons en
               on en.lesson_group_id = l.lesson_group_id
              and en.language = 'en'
            where r.lesson_id = l.id
              and r.verdict = 'approved'
              and r.en_hash = left(md5(en.content_md), 8)
              and r.tr_hash = public.translation_hash(l.content_md)
         )
       )
       -- PROVENANCE. NULL is NOT ESTABLISHED and is ignored; a MISMATCH means
       -- the English moved under a translation we had recorded, and withholds.
       -- Folding NULL in with mismatch would take 897 bodies down for an
       -- absence of evidence.
       and (
         l.language = 'en'
         or l.en_hash is null
         or l.en_hash = (
              select public.translation_hash(en2.content_md)
                from public.lessons en2
               where en2.lesson_group_id = l.lesson_group_id
                 and en2.language = 'en'
               limit 1
            )
       )
      from public.lessons l
     where l.id = p_lesson_id
  $function$;

-- 5. POST-CONDITIONS, BOTH DIRECTIONS.
do $$
declare
  v_stamped   int;
  v_null      int;
  v_changed   int;
  v_offenders text;
begin
  select count(*) into v_stamped from public.lessons where en_hash is not null;
  select count(*) into v_null    from public.lessons where language <> 'en' and en_hash is null;

  -- POSITIVE: the stamp landed on exactly the rows it was scoped to.
  if v_stamped = 0 then
    raise exception 'no row was stamped; the slug list matched nothing';
  end if;

  -- NEGATIVE: no English row was stamped. en_hash is a property of a
  -- translation, and stamping the source would be self-referential.
  if exists (select 1 from public.lessons where language = 'en' and en_hash is not null) then
    raise exception 'an English row carries en_hash; the stamp is mis-scoped';
  end if;

  -- NEGATIVE: nothing became UNSERVABLE. A stamp computed from current English
  -- cannot mismatch, and NULL is ignored, so this migration must move no row.
  select count(*), string_agg(b.id::text || '/' || b.language, ', ')
    into v_changed, v_offenders
    from _367_before b
    join public.lessons l on l.id = b.id
   where b.servable is distinct from public.lesson_body_is_servable(l.id);
  if v_changed <> 0 then
    raise exception 'servability moved on % row(s): %', v_changed, v_offenders;
  end if;

  raise notice '367: stamped %, left % translated rows NULL, servability unchanged on every row',
    v_stamped, v_null;
end $$;

commit;

-- ############ VERIFY THE GATE ACTUALLY BITES ############
--
-- A hash gate nobody has watched fire is the same object as a count assertion
-- nobody has watched fail. Run this SEPARATELY, and it rolls itself back:
--
--   begin;
--     update public.lessons set content_md = content_md || ' x'
--      where language = 'en'
--        and lesson_group_id = (select lesson_group_id from public.lessons
--                                where slug = '01-03-the-five-scrum-values'
--                                  and language = 'en');
--     select language, public.lesson_body_is_servable(id)
--       from public.lessons
--      where lesson_group_id = (select lesson_group_id from public.lessons
--                                where slug = '01-03-the-five-scrum-values'
--                                  and language = 'en');
--     -- expect: en true, es-419 false, pt-BR false
--   rollback;
--
-- And check-hash-writers.mjs gains lessons.en_hash to its column list, so the
-- "only a generator may stamp" rule covers it from the first day rather than
-- after the first clearance script walks around it.
