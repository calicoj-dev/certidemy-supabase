-- 367 -- provenance on lessons: give the lesson gate the tooth the concept gate has.
--
-- ############ ONE STATEMENT, AND THAT IS THE PACKAGING FIX ############
--
-- The first version used `create temporary table _367_before ... on commit drop`
-- to capture the before-state, and the SQL editor answered:
--
--   ERROR: 42P01: relation "_367_before" does not exist
--
-- A MIGRATION'S ATOMICITY IS A PROPERTY OF THE TRANSPORT, AND THE TRANSPORT
-- IS MEASURED, NOT ASSUMED. `begin; ... commit;` in a file asserts an INTENT.
-- Whether the client, the editor or the pooler honours it as one transaction
-- on one backend is a separate fact -- and a post-condition that cannot roll
-- back its own writes is a comment.
--
-- See scripts/sql/probe-editor-transaction.sql for the measurement that
-- distinguishes "the editor autocommits each statement" from "the pooler moves
-- statements between backends". Those have opposite implications and only one
-- of them is confined to this migration.
--
-- THIS FILE NO LONGER DEPENDS ON THE ANSWER. The whole migration is a SINGLE
-- DO BLOCK: the before-state lives in a jsonb variable rather than a temp
-- table, the DDL and the function replacement run inside it, and the
-- post-conditions read the variable. One statement is one transaction under
-- every pooling mode.
--
-- Same principle as the count assertion in _pg.mjs: do not rely on a property
-- of the transport, assert the property you need.
--
-- ############ WHAT THIS CLOSES, AND WHAT IT LEAVES OPEN ############
--
-- concept_translations records the English a translation was generated FROM,
-- and mcp.concept withholds the row the moment it stops matching. lessons had
-- nothing equivalent: repair the English and the translated copy is served
-- again, still carrying whatever it carried, every instrument reporting clean.
-- That happened to eight lessons on 2026-09-23.
--
-- IT DOES NOT CLOSE THE REVIEW-GATE HOLE. mcp_translation_review_required is
-- false across much of the corpus, disarming the OTHER arm of
-- lesson_body_is_servable. Different hole; armed row by row, not here.
--
-- IT DOES NOT SEE TRANSLATED REPRODUCTIONS. The leak index is English-only, so
-- a translated body scores zero by construction. This is about PROVENANCE --
-- does the translation track the English -- never about what it contains.
--
-- ############ WHY updated_at COULD NOT DO THIS ############
--
-- scan-iso-leaks --apply writes mcp_servable and mcp_scanned_at to all 1437
-- rows, and set_updated_at fires on any UPDATE. Within minutes of a scan every
-- English row and every translation carries a timestamp seconds apart. The
-- query "English newer than its translations" returns ZERO across the whole
-- corpus, on a day when eight English bodies were rewritten.
--
-- A TIMESTAMP IS NOT A CONTENT SIGNAL. A metadata stamp is indistinguishable
-- from an edit.
--
-- ############ THE COLUMN IS NOT CALLED en_hash, AND THAT IS DELIBERATE #####
--
-- `en_hash` ALREADY MEANS TWO COMPUTATIONS, both inside this one function:
--
--   lesson_translation_reviews.en_hash  left(md5(content_md), 8)   -> 8b7691a0
--   lesson_translation_reviews.tr_hash  translation_hash(content_md) -> 2c5a80ff
--
-- translation_hash length-prefixes each field, strips CR and joins with
-- separators; plain md5 does none of that. A third column called en_hash,
-- compared against a third computation, is a name promising sameness that is
-- not there. NOT unifying the review arm here: it would invalidate all 41
-- existing reviews at once and withhold their rows.
--
-- ############ THE STAMP DOES TWO JOBS AND THEY ARE LABELLED ############
--
--   'proved'    61 lessons. Every span the parity check tested came back NEW.
--   'baseline'  everything else. Asserts NOTHING about the past; establishes
--               only the point from which the next English edit counts.
--
-- An earlier draft refused to stamp the 77 uncovered lessons at all, which
-- declined the FUTURE mechanism along with the PAST claim and left the largest
-- group unprotected. The blindfold was the stamp being unlabelled, not the
-- stamp existing.
--
-- ############ WHAT IT WITHHOLDS ON THE DAY IT RUNS ############
--
-- NOTHING. Every stamp is computed from the current English, so nothing can
-- mismatch today. The withholding is FUTURE-TENSE, which is the point.
--
-- AFTER IT COMMITS, run the positive control -- the post-conditions prove this
-- broke nothing; only the script proves the new clause can withhold anything:
--
--   node --dns-result-order=ipv4first scripts/verify-367.mjs

do $mig$
declare
  v_before  jsonb;
  v_proved  int;
  v_base    int;
  v_orphan  int;
  v_changed int;
  v_who     text;
  c_proved  text[] := array[
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
  ];
begin
  -- BEFORE STATE IN A VARIABLE, NOT A TEMP TABLE. Post-conditions compare
  -- against this rather than against a literal: an assertion about a count
  -- must not contain a count.
  select jsonb_object_agg(l.id::text, public.lesson_body_is_servable(l.id))
    into v_before
    from public.lessons l;

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

  -- 2. The stamp. public.translation_hash is CALLED, never reimplemented: a
  --    second copy of a hash diverges, and the divergence surfaces as rows
  --    withheld for an arithmetic difference rather than for an edit.
  update public.lessons t
     set en_content_hash = public.translation_hash(en.content_md),
         en_content_hash_basis = case when en.slug = any(c_proved) then 'proved' else 'baseline' end
    from public.lessons en
   where en.lesson_group_id = t.lesson_group_id
     and en.language = 'en'
     and t.language <> 'en';

  -- 3. The gate. MISMATCH withholds; NULL is ignored. The asymmetry is the
  --    whole design; nobody should tidy it into a plain equality.
  execute $fn$
    create or replace function public.lesson_body_is_servable(p_lesson_id uuid)
     returns boolean
     language sql
     stable security definer
     set search_path to ''
    as $body$
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
                  -- reviews.en_hash is left(md5(...),8); reviews.tr_hash is
                  -- translation_hash(...). Two columns, two computations, one
                  -- table. Recompute each with the function that wrote it.
                  and r.en_hash = left(md5(en.content_md), 8)
                  and r.tr_hash = public.translation_hash(l.content_md)
             )
           )
           -- PROVENANCE. NULL is NOT ESTABLISHED and is ignored; a MISMATCH
           -- means the English moved under a translation whose origin we
           -- recorded. Folding NULL in with mismatch would take rows down for
           -- an absence of evidence rather than for evidence.
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
    $body$;
  $fn$;

  -- 4. POST-CONDITIONS, BOTH DIRECTIONS.
  select count(*) filter (where en_content_hash_basis = 'proved'),
         count(*) filter (where en_content_hash_basis = 'baseline')
    into v_proved, v_base
    from public.lessons;

  -- POSITIVE: both kinds of stamp landed. Only baselines would mean the slug
  -- list matched nothing.
  if v_proved = 0 then raise exception 'no row stamped proved; the slug list matched nothing'; end if;
  if v_base   = 0 then raise exception 'no row stamped baseline; the stamp is mis-scoped'; end if;

  -- NEGATIVE: no ENGLISH row carries the column. Provenance is a property of a
  -- translation; stamping the source would be self-referential.
  if exists (select 1 from public.lessons where language = 'en' and en_content_hash is not null) then
    raise exception 'an English row carries en_content_hash; the stamp is mis-scoped';
  end if;

  -- NEGATIVE: every translated row WITH an English sibling is stamped. Leaving
  -- one NULL is the 77-lesson gap this migration exists to close.
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
  -- current English, so no row may move today. Compared against the captured
  -- variable, never against a literal.
  select count(*), string_agg(l.slug || '/' || l.language, ', ')
    into v_changed, v_who
    from public.lessons l
   where (v_before ->> l.id::text)::boolean is distinct from public.lesson_body_is_servable(l.id);
  if v_changed <> 0 then
    raise exception 'servability moved on % row(s): %', v_changed, v_who;
  end if;

  raise notice '367: % proved, % baseline, 0 unstamped, servability unchanged on every row',
    v_proved, v_base;
end
$mig$;

-- Read the result back. A SEPARATE statement deliberately: it needs no
-- transaction of its own and must not re-introduce a dependency on the paste
-- being atomic.
select en_content_hash_basis, count(*) as rows, count(distinct lesson_group_id) as groups
  from public.lessons
 where en_content_hash is not null
 group by en_content_hash_basis
 order by en_content_hash_basis;
