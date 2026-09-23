-- 367 -- provenance on lessons: give the lesson gate the tooth the concept gate has.
--
-- ############ WHAT THIS CLOSES, AND WHAT IT LEAVES OPEN ############
--
-- concept_translations records the English a translation was generated FROM,
-- and mcp.concept withholds the row the moment it stops matching. An English
-- repair therefore withholds its translations automatically.
--
-- lessons had nothing equivalent. Repair the English and the translated copy
-- is served again, still carrying whatever it carried, with every instrument
-- reporting clean. That happened to eight lessons on 2026-09-23.
--
-- IT DOES NOT CLOSE THE REVIEW-GATE HOLE. mcp_translation_review_required is
-- false across much of the corpus, which disarms the OTHER arm of
-- lesson_body_is_servable. Different hole; armed row by row, not here.
--
-- IT DOES NOT SEE TRANSLATED REPRODUCTIONS. The leak index is English-only, so
-- a translated body scores zero by construction. This is about PROVENANCE --
-- does the translation track the English -- never about what it contains.
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
-- ############ THE COLUMN IS NOT CALLED en_hash, AND THAT IS DELIBERATE #####
--
-- `en_hash` ALREADY MEANS TWO DIFFERENT COMPUTATIONS IN THIS DATABASE, and
-- both of them live inside lesson_body_is_servable:
--
--   lesson_translation_reviews.en_hash  left(md5(content_md), 8)
--   lesson_translation_reviews.tr_hash  public.translation_hash(content_md)
--
-- Two hash columns on ONE table, computed two ways. Measured on a real body:
--
--   left(md5(x), 8)              -> 8b7691a0
--   public.translation_hash(x)   -> 2c5a80ff
--
-- translation_hash length-prefixes each field, strips CR, and joins with
-- separators -- so it cannot be confused by a body that happens to contain the
-- delimiter, and it is stable across CRLF. Plain md5 has none of that.
--
-- A third column called en_hash, compared against a third computation, is the
-- mcp_servable defect arriving before the column is a day old: A NAME THAT
-- WILL BE READ AS A PROMISE IT DOES NOT MAKE. So it is en_content_hash, it
-- names its function in its own comment, and the asymmetry above is recorded
-- rather than left to be rediscovered.
--
-- NOT unifying the review arm onto translation_hash here, deliberately: it
-- would invalidate all 41 existing reviews at once and withhold their rows.
-- That is a decision with a cost, and it does not belong inside a migration
-- whose subject is a different gate.
--
-- ############ THE STAMP DOES TWO JOBS AND THEY ARE LABELLED SEPARATELY ####
--
-- A stamp asserts (a) this translation tracks this English -- a claim about
-- the PAST -- and establishes (b) a baseline so the next edit is detected -- a
-- mechanism for the FUTURE.
--
-- An earlier draft refused (a) for the 77 lessons the parity check never
-- covered, which was right, AND THEREBY DECLINED (b) FOR THEM TOO. Those rows
-- would have carried NULL, the gate ignores NULL, and their review flag is
-- unarmed -- so an English edit tomorrow would withhold nothing. That is this
-- morning's failure, still live, on 77 lessons instead of eight.
--
-- The blindfold was the stamp being UNLABELLED, not the stamp existing. So:
--
--   en_content_hash_basis = 'proved'    61 lessons. Every span the parity
--                                       check tested came back NEW, so the
--                                       retranslation demonstrably landed.
--   en_content_hash_basis = 'baseline'  everything else. Asserts NOTHING about
--                                       whether the translation tracks the
--                                       English today. Establishes only the
--                                       point from which the next edit counts.
--
-- A future reader querying "en_content_hash is not null" can no longer mistake
-- a baseline for a clearance, because the basis column is NOT NULL whenever
-- the hash is.
--
-- ############ WHAT IT WITHHOLDS ON THE DAY IT RUNS ############
--
-- NOTHING. Every stamp is computed from the current English, so nothing can
-- mismatch today. The withholding this buys is FUTURE-TENSE, and that is the
-- point: it is the thing that did not exist this morning.
--
-- The rows that are stale TODAY were armed separately through the review gate
-- by scripts/withhold-diverged-translations.mjs. This is the mechanism for
-- next time; that script was the instance.
--
-- ############ AND THE POSITIVE CONTROL IS A SCRIPT, NOT A COMMENT ##########
--
-- A hash gate nobody has watched fire is the same object as a count assertion
-- nobody has watched fail -- and an earlier draft put the demonstration in a
-- SQL comment, which nobody runs. The post-conditions below assert the
-- NEGATIVE direction thoroughly; nothing in them shows the new clause can
-- withhold anything at all, and a clause never seen to fire is
-- indistinguishable from one that cannot.
--
--   node --dns-result-order=ipv4first scripts/verify-367.mjs
--
-- It opens a transaction, appends a character to one English body, asserts the
-- English stays servable and BOTH translations go dark, and rolls back. It is
-- part of this migration's acceptance, not an afterthought.

begin;

-- 1. The columns. Nullable, no default -- a default would be a stamp.
alter table public.lessons add column if not exists en_content_hash text;
alter table public.lessons add column if not exists en_content_hash_basis text;

comment on column public.lessons.en_content_hash is
  'public.translation_hash() of the ENGLISH sibling content_md this translation '
  'was generated from. NOT the same computation as lesson_translation_reviews.en_hash, '
  'which is left(md5(content_md),8) -- hence the different name. Only a generator '
  'may write this; every other caller reads, compares, refuses.';

comment on column public.lessons.en_content_hash_basis is
  'proved = the parity check confirmed the translation tracks this English. '
  'baseline = asserts nothing about the past; establishes the point from which '
  'the next English edit is detected. Never read a baseline as a clearance.';

alter table public.lessons drop constraint if exists lessons_en_content_hash_basis_chk;
alter table public.lessons add constraint lessons_en_content_hash_basis_chk
  check (
    (en_content_hash is null and en_content_hash_basis is null)
    or (en_content_hash is not null and en_content_hash_basis in ('proved','baseline'))
  );

-- 2. BEFORE state. Post-conditions compare against this rather than against a
--    literal, because an assertion about a count must not contain a count.
create temporary table _367_before on commit drop as
select l.id, l.language, public.lesson_body_is_servable(l.id) as servable
  from public.lessons l;

-- 3. The stamp. public.translation_hash is CALLED, never reimplemented: a
--    second copy of a hash diverges, and the divergence surfaces as rows
--    withheld for an arithmetic difference rather than for an edit.
update public.lessons t
   set en_content_hash = public.translation_hash(en.content_md),
       en_content_hash_basis =
         case when en.slug in (
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
         ) then 'proved' else 'baseline' end
  from public.lessons en
 where en.lesson_group_id = t.lesson_group_id
   and en.language = 'en'
   and t.language <> 'en';

-- 4. The gate. MISMATCH withholds; NULL is ignored. The asymmetry is the whole
--    design and it is stated here so nobody "tidies" it into a plain equality.
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
              -- NOTE: reviews.en_hash is left(md5(...),8) and reviews.tr_hash
              -- is translation_hash(...). Two columns, two computations, one
              -- table. Recompute each with the function that wrote it.
              and r.en_hash = left(md5(en.content_md), 8)
              and r.tr_hash = public.translation_hash(l.content_md)
         )
       )
       -- PROVENANCE. NULL is NOT ESTABLISHED and is ignored; a MISMATCH means
       -- the English moved under a translation whose origin we recorded.
       -- Folding NULL in with mismatch would take rows down for an absence of
       -- evidence rather than for evidence.
       and (
         l.language = 'en'
         or l.en_content_hash is null
         or l.en_content_hash = (
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
  v_proved   int;
  v_baseline int;
  v_orphan   int;
  v_changed  int;
  v_who      text;
begin
  select count(*) filter (where en_content_hash_basis = 'proved'),
         count(*) filter (where en_content_hash_basis = 'baseline')
    into v_proved, v_baseline
    from public.lessons;

  -- POSITIVE: both kinds of stamp landed. A migration that produced only
  -- baselines would mean the slug list matched nothing.
  if v_proved = 0 then raise exception 'no row was stamped proved; the slug list matched nothing'; end if;
  if v_baseline = 0 then raise exception 'no row was stamped baseline; the stamp is mis-scoped'; end if;

  -- NEGATIVE: no ENGLISH row carries the column. Provenance is a property of a
  -- translation; stamping the source would be self-referential.
  if exists (select 1 from public.lessons where language = 'en' and en_content_hash is not null) then
    raise exception 'an English row carries en_content_hash; the stamp is mis-scoped';
  end if;

  -- NEGATIVE: every translated row WITH an English sibling is now stamped.
  -- Leaving one NULL is the 77-lesson gap this migration exists to close.
  select count(*), string_agg(l.slug || '/' || l.language, ', ')
    into v_orphan, v_who
    from public.lessons l
   where l.language <> 'en'
     and l.en_content_hash is null
     and exists (select 1 from public.lessons en
                  where en.lesson_group_id = l.lesson_group_id and en.language = 'en');
  if v_orphan <> 0 then
    raise exception '% translated row(s) with an English sibling left unstamped: %', v_orphan, v_who;
  end if;

  -- NEGATIVE: nothing became UNSERVABLE. Every stamp is computed from the
  -- current English, so no row may move today.
  select count(*), string_agg(l.slug || '/' || l.language, ', ')
    into v_changed, v_who
    from _367_before b
    join public.lessons l on l.id = b.id
   where b.servable is distinct from public.lesson_body_is_servable(l.id);
  if v_changed <> 0 then
    raise exception 'servability moved on % row(s): %', v_changed, v_who;
  end if;

  raise notice '367: % proved, % baseline, 0 unstamped, servability unchanged on every row',
    v_proved, v_baseline;
end $$;

commit;

-- AFTER COMMITTING, run the positive control. The post-conditions above prove
-- this migration broke nothing; only the script proves the new clause can
-- withhold anything at all.
--
--   node --dns-result-order=ipv4first scripts/verify-367.mjs
--
-- And check-hash-writers.mjs gains lessons.en_content_hash to its column list,
-- so the "only a generator may stamp" rule covers it from the first day rather
-- than after the first clearance script walks around it.
