-- 335_lesson_translation_reviews.sql
--
-- THE GATE TELLS THE TRUTH PER LANGUAGE, NOT PER GROUP.
--
-- 332/333 gate lesson bodies on `lessons.mcp_servable`, derived per
-- lesson_group_id from the group's longest ISO run. Because the leak index is
-- ENGLISH ISO text, an es-419 or pt-BR row scores zero by construction, so the
-- group maximum always comes from English -- and REPAIRING ENGLISH OPENS THE
-- TRANSLATIONS.
--
-- That is the gate running backwards. A partner pulling Spanish would receive
-- the translated clause the English repair had just removed, and every
-- instrument here would report success. For a Spanish-speaking partner it is the
-- language that matters most, and it was the one the gate stopped protecting the
-- moment the repair landed.
--
-- ===================== WHY THIS IS NOT MEASUREMENT =====================
--
-- There is no way to measure it. We hold the English editions of ISO 19011,
-- 27001 and 42001 and no others, so nothing here can distinguish a faithful
-- Spanish paraphrase from ISO's own Spanish sentence.
--
-- So this records a HUMAN REVIEW, on the pattern migration 311 already
-- established for item translations: an append-only log whose verdict is keyed
-- to a hash of the English it was made against. A later English edit does not
-- erase the review -- it makes it STALE, which is the honest state and the one a
-- boolean column cannot express.
--
-- REPAIRING A TRANSLATION DOES NOT CLEAR THE FLAG. Only a recorded review does.
-- Otherwise the mechanism is theatre: someone writes Spanish, the flag clears,
-- and nothing has been verified -- the same gap wearing a different label.
--
-- ===================== THE PROVENANCE ARGUMENT, AND ITS LIMIT =====================
--
-- This migration flags ONLY the translations of lessons whose English was
-- repaired -- 32 rows behind 16 lessons -- rather than every non-English row on
-- the platform. The argument is:
--
--   A translation's exposure is bounded by its English source's exposure.
--   These rows are translations of OUR English lessons, not independent
--   renderings from ISO's Spanish or Portuguese editions. Where the English
--   never carried a run of 10 words or more, there was never an ISO sentence
--   for a translator to render.
--
-- Measured: the longest English ISO run across the eight already-live
-- certifications is EIGHT WORDS (AISM-I). So none of their translations is
-- suspect and none is withheld, which is what makes this affordable at all --
-- the alternative was withholding two thirds of the served corpus.
--
-- **THAT IS REASONING, NOT MEASUREMENT, AND THE DIFFERENCE MATTERS TO WHOEVER
-- READS IT NEXT.** It is an argument from provenance: it holds because of how
-- these rows were produced, and nothing in this database records that. It fails
-- the day anyone translates a lesson from a Spanish or Portuguese ISO text
-- rather than from our English, and it would fail SILENTLY -- there is no
-- instrument that would notice, because there is no Spanish index to notice
-- with. Acquiring the translated editions is what would turn it into a
-- measurement. Until then it is a belief with a good reason behind it, recorded
-- here and in IP-POSITION section 7 so it is read as one.
--
-- ===================== NO PRODUCTION IMPACT AT INSTALL =====================
--
-- The column defaults FALSE, so this migration changes nothing on its own. The
-- 32 rows are flagged by a separate statement below, named individually.

begin;

-- --------------------------------------------------------------- the log

create table if not exists public.lesson_translation_reviews (
  lesson_id           uuid not null references public.lessons (id) on delete cascade,
  reviewed_at         timestamptz not null default now(),
  reviewed_by         text not null,
  reviewed_by_user_id uuid references auth.users (id),
  en_hash             text not null,
  verdict             text not null,
  note                text,
  primary key (lesson_id, reviewed_at)
);

alter table public.lesson_translation_reviews
  drop constraint if exists ltr_verdict_check;
alter table public.lesson_translation_reviews
  add constraint ltr_verdict_check check (verdict in ('approved', 'rejected'));

-- An 8-hex prefix, same shape as item_translation_reviews. COMPUTED WITH md5
-- RATHER THAN sha256: `digest` lives in whichever schema pgcrypto was installed
-- into and a view body that cannot resolve it is a view that will not create.
-- `md5` is pg_catalog and always resolvable. The hash's job here is change
-- detection, not cryptography.
alter table public.lesson_translation_reviews
  drop constraint if exists ltr_hash_shape;
alter table public.lesson_translation_reviews
  add constraint ltr_hash_shape check (en_hash ~ '^[0-9a-f]{8}$');

comment on table public.lesson_translation_reviews is
  'Append-only log of human reviews of non-English lesson bodies for reproduced ISO clause text. en_hash is left(md5(english content_md),8) at review time, so a moved English makes the review STALE rather than erasing it.';
comment on column public.lesson_translation_reviews.verdict is
  'approved = a human read this translation and found no reproduced clause text. rejected = they found some.';

revoke all on public.lesson_translation_reviews from anon, authenticated;

-- ------------------------------------------------------------ the column

alter table public.lessons
  add column if not exists mcp_translation_review_required boolean not null default false;

comment on column public.lessons.mcp_translation_review_required is
  'Set on non-English rows whose English sibling was repaired for an ISO leak. Cleared ONLY by a current approved row in lesson_translation_reviews -- never by editing the translation.';

-- ----------------------------------------------------------- the trigger
--
-- GOING FORWARD THIS IS AUTOMATIC. The generators were going to set the flag by
-- convention; a trigger is what 332 already established for `mcp_servable` and
-- it does not depend on the next script remembering.
--
-- It fires ONLY when the English row was LEAKING BEFORE the edit -- read from
-- OLD, because 332's BEFORE trigger nulls the run on the same statement. A
-- typo fix on clean English does not withhold two translations.

create or replace function public.flag_translation_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_threshold integer;
begin
  if new.language <> 'en' or new.lesson_group_id is null then
    return null;
  end if;
  if new.content_md is not distinct from old.content_md then
    return null;
  end if;
  select threshold_words into v_threshold from public.mcp_leak_policy limit 1;
  if coalesce(old.mcp_iso_longest_run, 0) < coalesce(v_threshold, 10) then
    return null;   -- the English was already clean; this was not a leak repair
  end if;
  update public.lessons
     set mcp_translation_review_required = true
   where lesson_group_id = new.lesson_group_id
     and language <> 'en';
  return null;
end
$fn$;

comment on function public.flag_translation_review() is
  'An English leak repair withholds its translations until a human reads them. Fires only when the PRE-EDIT English was over the threshold.';

drop trigger if exists trg_lessons_flag_translation_review on public.lessons;
create trigger trg_lessons_flag_translation_review
  after update on public.lessons
  for each row
  execute function public.flag_translation_review();

-- ------------------------------------------------- the 32 rows, retroactively
--
-- The SIXTEEN lessons repaired on 2026-09-17, before the trigger existed. Named
-- by slug rather than swept, so this statement says what it did.
--
-- IT SAID TEN UNTIL BATCH 2 LANDED. Six more AIMS-F lessons were repaired after
-- this migration was written and before it was run, and a list written into a
-- migration does not notice work done beside it. Had it shipped at ten, the six
-- newest repairs would have opened their Spanish -- which is the exact defect
-- this migration exists to close, reintroduced by the migration that closes it.
--
-- The trigger is why this only had to be caught once: from here the flag is set
-- by the database at the moment of repair, and no list has to keep up.

update public.lessons l
   set mcp_translation_review_required = true
  from public.modules m, public.certifications c
 where m.id = l.module_id
   and c.id = m.certification_id
   and l.language <> 'en'
   and (
     (c.code = 'ISMS-F' and l.slug in (
        '02-09-pdca-and-improvement', '05-02-internal-audit', '02-03-amendment-1-2024'))
     or
     (c.code = 'AIMS-F' and l.slug in (
        -- batch 1: one passage each
        '05-06-integrated-audit-programme', '01-02-determining-your-roles',
        '04-07-control-overlap-with-27001', '03-08-clause-8-operational-duties',
        '01-05-drivers-and-what-certification-means', '05-05-the-certification-route',
        '02-07-risk-versus-impact',
        -- batch 2: two passages each
        '02-02-determining-the-scope', '02-05-the-ai-risk-assessment',
        '01-01-what-an-aims-is', '02-08-risk-treatment-and-the-soa',
        '05-03-aims-management-review', '04-02-annex-a-and-the-soa'))
   );

-- --------------------------------------------------------------- the view

drop view if exists mcp.lesson;

create view mcp.lesson
with (security_barrier = true) as
select c.code as certification,
       m.slug as module_slug, m.title as module_title,
       m.order_index as module_order,
       l.slug as lesson_slug, l.title as lesson_title,
       l.language, l.lesson_group_id,
       l.order_index as lesson_order, l.estimated_minutes,
       l.content_md
  from public.lessons l
  join public.modules m        on m.id = l.module_id
  join public.certifications c on c.id = m.certification_id
 where c.code = any ('{AISM-I,AIE-I,AIHR-I,AIGRM-I,SM-AI-I,SM-AI-II,SPO-AI-I,SD-AI-I,ISMS-F,AIMS-F}'::text[])
   and l.mcp_servable
   -- THE PER-LANGUAGE HALF. English is gated by measurement above. A flagged
   -- translation needs a CURRENT approved review: current meaning its en_hash
   -- still matches the English sibling, so a later English edit makes the
   -- review stale and closes the door again without anyone remembering to.
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
     )
   );

comment on view mcp.lesson is
  'Lesson bodies for the paywalled MCP tool. English is gated by measurement (mcp_servable); a translation whose English was repaired needs a current approved review in lesson_translation_reviews. See IP-POSITION section 6 and 7.';

grant select on mcp.lesson to mcp_holder;

-- ===================== POST-CONDITIONS =====================

do $mig$
declare
  n_flag  integer;
  n_body  integer;
  n_en    integer;
  n_leak  integer;
  n_live  integer;
begin

  -- 1. EXACTLY 20 ROWS FLAGGED, and they are the ones named.
  select count(*) into n_flag from public.lessons where mcp_translation_review_required;
  if n_flag <> 32 then
    raise exception 'flagged % rows, expected 32 (16 lessons x 2 translations)', n_flag;
  end if;
  select count(*) into n_en from public.lessons
   where mcp_translation_review_required and language = 'en';
  if n_en <> 0 then
    raise exception '% English row(s) flagged; the flag is for translations', n_en;
  end if;
  raise notice '32 translation rows flagged, no English row touched';

  -- 2. THE FLAGGED ROWS ARE OUT OF THE VIEW. The point of the migration.
  select count(*) into n_body
    from mcp.lesson v
    join public.lessons l
      on l.slug = v.lesson_slug and l.language = v.language
   where l.mcp_translation_review_required;
  if n_body <> 0 then
    raise exception '% flagged translation(s) still served', n_body;
  end if;
  raise notice 'no flagged translation reaches mcp.lesson';

  -- 3. AND THE NEGATIVE HALF, WHICH IS THE ONE THAT COULD HAVE GONE WRONG:
  --    the eight already-live certifications must be UNTOUCHED. The whole
  --    provenance argument exists to make this true; assert it rather than
  --    trust it.
  select count(*) into n_live
    from public.lessons l
    join public.modules m on m.id = l.module_id
    join public.certifications c on c.id = m.certification_id
   where c.code in ('AISM-I','AIE-I','AIHR-I','AIGRM-I','SM-AI-I','SM-AI-II','SPO-AI-I','SD-AI-I')
     and l.mcp_translation_review_required;
  if n_live <> 0 then
    raise exception '% row(s) flagged across the eight live certifications', n_live;
  end if;

  select count(*) into n_live from mcp.lesson
   where certification in ('AISM-I','AIE-I','AIHR-I','AIGRM-I','SM-AI-I','SM-AI-II','SPO-AI-I','SD-AI-I');
  if n_live <> 951 then
    raise exception 'the eight live certifications now serve % rows, expected 951', n_live;
  end if;
  raise notice 'the eight live certifications serve 951 rows, unchanged';

  -- 4. ENGLISH IS UNAFFECTED. A flagged group must still serve its English.
  select count(*) into n_en from mcp.lesson v
    join public.lessons l on l.slug = v.lesson_slug and l.language = v.language
   where l.language = 'en'
     and exists (select 1 from public.lessons s
                  where s.lesson_group_id = l.lesson_group_id
                    and s.mcp_translation_review_required);
  if n_en <> 16 then
    raise exception 'expected 16 English rows from flagged groups, found %', n_en;
  end if;
  raise notice 'all 16 repaired lessons still serve English';

  -- 5. THE REVIEW PATH ACTUALLY OPENS THE DOOR. Attempted, not inferred: a
  --    predicate nobody has satisfied is indistinguishable from one that can
  --    never be satisfied, and this one is four joins deep.
  declare
    v_lid uuid;
    v_gid uuid;
    v_before integer;
    v_after  integer;
  begin
    select l.id, l.lesson_group_id into v_lid, v_gid
      from public.lessons l
     where l.mcp_translation_review_required and l.language = 'es-419'
     limit 1;

    select count(*) into v_before from mcp.lesson v
      join public.lessons l on l.slug = v.lesson_slug and l.language = v.language
     where l.id = v_lid;

    insert into public.lesson_translation_reviews (lesson_id, reviewed_by, en_hash, verdict, note)
    select v_lid, 'migration-335-probe',
           left(md5(en.content_md), 8), 'approved', 'post-condition probe, deleted below'
      from public.lessons en
     where en.lesson_group_id = v_gid and en.language = 'en';

    select count(*) into v_after from mcp.lesson v
      join public.lessons l on l.slug = v.lesson_slug and l.language = v.language
     where l.id = v_lid;

    delete from public.lesson_translation_reviews where reviewed_by = 'migration-335-probe';

    if v_before <> 0 or v_after <> 1 then
      raise exception 'the review path does not open the view: before %, after %', v_before, v_after;
    end if;
    raise notice 'an approved review makes a flagged translation servable';
  end;

  -- 6. AND A STALE REVIEW DOES NOT. The property the hash exists for.
  declare
    v_lid uuid;
    v_n   integer;
  begin
    select id into v_lid from public.lessons
     where mcp_translation_review_required and language = 'es-419' limit 1;

    insert into public.lesson_translation_reviews (lesson_id, reviewed_by, en_hash, verdict, note)
    values (v_lid, 'migration-335-probe', 'deadbeef', 'approved', 'stale hash, deleted below');

    select count(*) into v_n from mcp.lesson v
      join public.lessons l on l.slug = v.lesson_slug and l.language = v.language
     where l.id = v_lid;

    delete from public.lesson_translation_reviews where reviewed_by = 'migration-335-probe';

    if v_n <> 0 then
      raise exception 'a review with a stale en_hash opened the view';
    end if;
    raise notice 'a stale review does not open it';
  end;

  select count(*) into n_leak from public.lesson_translation_reviews;
  if n_leak <> 0 then
    raise exception '% probe review(s) survived cleanup', n_leak;
  end if;

  raise notice 'the gate now tells the truth per language';
end
$mig$;

commit;

-- ===================== VERIFICATION =====================
--
--   select language, count(*) from public.lessons
--    where mcp_translation_review_required group by 1;
--   -- expect es-419 16, pt-BR 16
--
--   select certification, language, count(*) from mcp.lesson
--    where certification in ('ISMS-F','AIMS-F') group by 1,2 order by 1,2;
--   -- expect ISMS-F en 49 / es-419 46 / pt-BR 46
--   --        AIMS-F en 14 / es-419  1 / pt-BR  1
--
-- TO CLEAR A ROW after reading it:
--
--   insert into public.lesson_translation_reviews
--     (lesson_id, reviewed_by, en_hash, verdict, note)
--   select l.id, 'juan', left(md5(en.content_md), 8), 'approved', 'read against 27001 clause 10.1'
--     from public.lessons l
--     join public.lessons en on en.lesson_group_id = l.lesson_group_id and en.language = 'en'
--    where l.id = '<the translation row>';
--
-- The queue for all of them is BILINGUAL-QUEUE.json, Spanish first.
