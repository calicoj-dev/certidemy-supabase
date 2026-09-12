-- 302: module_translations was left out of 295, so it cannot record a rejection
--
-- ONE PASTE. Pre- and post-conditions ABORT; one visible result set.
--
-- ============================================================================
-- WHY
-- ============================================================================
--
-- Migration 295 gave task_translations and domain_translations a three-state
-- review_status - unreviewed / approved / rejected - and left
-- module_translations with is_provisional alone. Its own header says why that
-- is not enough: one boolean, three meanings. "Never reviewed" and "reviewed
-- and rejected" collapse into the same true, and they want opposite handling -
-- one wants a reviewer, the other wants a retranslation.
--
-- That gap is now blocking, not theoretical. scripts/apply-translation-review
-- writes BOTH fields:
--
--   approved -> { is_provisional: false, review_status: 'approved'  }
--   rejected -> { is_provisional: true,  review_status: 'rejected'  }
--
-- Pointed at module rows today it would fail on a column that does not exist -
-- or, if someone "fixed" that by dropping the field, it would silently collapse
-- rejected into still-provisional, which is the exact state the document's
-- three marks exist to separate.
--
-- ============================================================================
-- EVERY WRITER OF module_translations - THREE MEASUREMENTS
-- ============================================================================
--
-- 295's list found writers no application grep sees, so this one was built the
-- same way: a pattern search, an independent shell search, and pg_proc.
--
-- APPLICATION WRITERS (both greps agree, both repos):
--   1  supabase/scripts/gen-module-translations.mjs:189   INSERT.
--                                                         Writes is_provisional
--                                                         = true. MUST ALSO
--                                                         WRITE review_status -
--                                                         see the note below.
--   2  certidemy-web/scripts/load-module-i18n.mjs:436     UPSERT. Its header:
--                                                         "Rows land with
--                                                         is_provisional = true.
--                                                         These are AI-drafted
--                                                         and unreviewed."
--
-- DATABASE FUNCTION - NO GREP OF APPLICATION CODE FINDS THIS, AND IT IS THE
-- REASON THIS MIGRATION IS NOT JUST AN ALTER TABLE:
--   3  invalidate_module_translations()   trg_invalidate_module_translations
--                                         on modules, BEFORE UPDATE. When an
--                                         English module title or description
--                                         changes it sets is_provisional = true
--                                         on every translation of that module -
--                                         AND NOTHING ELSE.
--
--      After the column is added and before this function is updated, an
--      English edit would leave a row is_provisional = true AND review_status
--      = 'approved'. That is precisely the disagreement 295's post-condition
--      forbids on the other two tables, arriving through a trigger rather than
--      through a script. It is fixed in this migration, in the same paste.
--
-- READERS, confirmed one at a time rather than by eye - all .select():
--   supabase/scripts/gen-module-translations.mjs:82
--   certidemy-web/lib/modules/dashboard-data.ts:115
--   certidemy-web/lib/catalog/data.ts:142
--   certidemy-web/scripts/patch-module-dashboard-i18n.mjs:46
--
-- ============================================================================
-- THE BACKFILL, AND WHAT IT CANNOT ESTABLISH
-- ============================================================================
--
-- 86 rows are is_provisional = true -> 'unreviewed'. ESTABLISHED: both writers
-- set true and say in their own headers that it means AI-drafted and unread.
--
-- 0 rows are 'rejected'. ESTABLISHED by construction: there has never been a
-- mechanism that could record a rejection on this table. That is the whole
-- reason for this migration.
--
-- 30 rows are is_provisional = false -> 'approved'. THIS ONE IS NOT WHAT IT
-- LOOKS LIKE, AND THE RECORD SAYS SO IN ITS OWN WORDS. They were not flipped by
-- a reviewer. Migration 153 flipped every row created before 2026-07-27 in a
-- single statement, and wrote this above it:
--
--     "The Scrum rows have been live in production since 2026-07-08. Marking
--      them approved records THAT FACT -- it is not a claim that a reviewer
--      signed them off. If a formal review pass is wanted, run it and treat
--      this line as the starting state, not as evidence."
--
-- So 'approved' on those 30 rows (SD-AI-I, SM-AI-I, SPO-AI-I) means LIVE SINCE
-- 2026-07-08, NOT READ BY ANYONE. They are written as 'approved' because the
-- agreement invariant this migration inherits from 295 leaves no other legal
-- value - approved <=> not provisional, with no "live but unreviewed" state -
-- and NOT because anything establishes that they were reviewed.
--
-- THE CONSEQUENCE, STATED SO IT IS NOT LOST: the real unreviewed backlog is
-- 116 rows, not 86. Filtering a review document on is_provisional would hide
-- these 30 behind a migration's convenience.
--
-- ============================================================================
-- GUARD 1 (PRE)
-- ============================================================================
begin;

do $pre$
declare n_prov int; n_appr int; n_total int;
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='module_translations'
               and column_name='review_status') then
    raise exception using message = '302 has already run';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname='fn_demote_translation_review') then
    raise exception using message = '295 has not run',
      hint = 'fn_demote_translation_review is reused by this migration';
  end if;

  select count(*) filter (where is_provisional),
         count(*) filter (where not is_provisional),
         count(*)
    into n_prov, n_appr, n_total from public.module_translations;
  if n_prov <> 86 or n_appr <> 30 then
    raise exception using message = 'the populations have moved',
      detail = format('provisional %s (expected 86), cleared %s (expected 30)', n_prov, n_appr),
      hint   = 'a module translation run since the measurement would change this';
  end if;
  raise notice 'pre ok: % rows, 86 provisional, 30 cleared', n_total;
end
$pre$;


alter table public.module_translations
  add column review_status text not null default 'unreviewed';

alter table public.module_translations
  add constraint module_translations_review_status_check
  check (review_status in ('unreviewed', 'approved', 'rejected'));

comment on column public.module_translations.review_status is
  'unreviewed = AI-drafted, nobody has read it. approved = a human compared it to the current English. rejected = a human read it and it is wrong; the note lives in the review document. approved <=> not is_provisional. NOTE: the 30 rows set approved by migration 302s backfill were flipped by migration 153 for being live since 2026-07-08, NOT by a reviewer - see 153s own comment.';


-- The 86 already default to 'unreviewed'. Name the other 30 explicitly rather
-- than relying on the default to be right for them.
update public.module_translations
   set review_status = 'approved'
 where not is_provisional;


-- ============================================================================
-- THE TRIGGER GAP, CLOSED IN THE SAME PASTE
-- ============================================================================
--
-- Adds review_status to what the English-moved invalidation writes. Without
-- this, an edit to a module title leaves is_provisional = true beside
-- review_status = 'approved'.
create or replace function public.invalidate_module_translations()
returns trigger
language plpgsql
as $fn$
begin
  if new.title is distinct from old.title
     or new.description is distinct from old.description then
    update public.module_translations
       set is_provisional = true,
           review_status  = 'unreviewed'   -- ADDED 302
     where module_id = new.id;
  end if;
  return new;
end;
$fn$;

-- And the mirror of 295's demotion: if the TRANSLATION text is edited, an
-- approved row stops being approved. fn_demote_translation_review is reused
-- unchanged - it only touches new.review_status and new.is_provisional.
create trigger trg_demote_module_translation_review
  before update on public.module_translations
  for each row
  when (new.title is distinct from old.title
        or new.description is distinct from old.description)
  execute function public.fn_demote_translation_review();


-- ============================================================================
-- GUARD 2 (POST)
-- ============================================================================
do $post$
declare
  n_un int; n_ap int; n_rej int; disagree int; v_mod uuid; v_lang text; v_got text;
begin
  select count(*) filter (where review_status = 'unreviewed'),
         count(*) filter (where review_status = 'approved'),
         count(*) filter (where review_status = 'rejected')
    into n_un, n_ap, n_rej from public.module_translations;

  if n_un <> 86 then
    raise exception using message = 'expected 86 unreviewed', detail = format('%s', n_un);
  end if;
  if n_ap <> 30 then
    raise exception using message = 'expected 30 approved', detail = format('%s', n_ap);
  end if;
  -- NEGATIVE HALF: nothing may be rejected. No mechanism has ever existed to
  -- set it, so a rejected row here would mean the backfill invented one.
  if n_rej <> 0 then
    raise exception using message = 'rejected was populated', detail = format('%s', n_rej);
  end if;

  -- THE INVARIANT 295 ENFORCES ON THE OTHER TWO TABLES, NOW ON THIS ONE.
  select count(*) into disagree from public.module_translations
   where (is_provisional and review_status = 'approved')
      or (not is_provisional and review_status <> 'approved');
  if disagree <> 0 then
    raise exception using message = 'is_provisional and review_status disagree',
      detail = format('%s row(s)', disagree),
      hint   = 'approved must mean not provisional, and the reverse';
  end if;

  -- BEHAVIOUR, NOT TEXT. Both triggers are exercised and rolled back.
  -- module_translations has NO id column - the key is (module_id, language).
  select module_id, language into v_mod, v_lang from public.module_translations
   where review_status = 'approved' limit 1;
  if v_mod is null then
    raise exception using message = 'no approved row to probe with';
  end if;

  -- 1. Editing the TRANSLATION demotes it.
  update public.module_translations set title = title || ' probe302'
   where module_id = v_mod and language = v_lang;
  select review_status into v_got from public.module_translations
   where module_id = v_mod and language = v_lang;
  if v_got <> 'unreviewed' then
    raise exception using message = 'editing a translation did not demote it',
      detail = format('reads %s', v_got);
  end if;

  -- 2. Editing the ENGLISH module demotes every translation of it.
  update public.module_translations
     set review_status = 'approved', is_provisional = false
   where module_id = v_mod and language = v_lang;
  update public.modules set title = title || ' probe302' where id = v_mod;
  select review_status into v_got from public.module_translations
   where module_id = v_mod and language = v_lang;
  if v_got <> 'unreviewed' then
    raise exception using message = 'an English edit did not demote the translation',
      detail = format('reads %s', v_got),
      hint   = 'invalidate_module_translations still writes only is_provisional';
  end if;

  -- 3. The CHECK refuses a fourth value.
  begin
    update public.module_translations set review_status = 'maybe'
     where module_id = v_mod and language = v_lang;
    raise exception using message = 'the CHECK did not refuse an invalid value';
  exception
    when check_violation then null;
  end;

  raise exception using message = 'PROBE ROLLBACK',
    detail = 'all three behaviours verified; this aborts the probe block only';
exception
  when others then
    if sqlerrm <> 'PROBE ROLLBACK' then raise; end if;
    raise notice 'post ok: counts, invariant, both triggers, CHECK';
end
$post$;

commit;


-- ============================================================================
-- THE VISIBLE RESULT SET
-- ============================================================================
select review_status, is_provisional, count(*) as rows
from public.module_translations group by 1, 2 order by 1;
-- EXPECT exactly two rows:
--   approved     false   30
--   unreviewed   true    86
--
-- 'rejected' must be ABSENT. The review document is what will produce the
-- first one.
--
-- NEXT: gen-translation-review-doc.mjs gains a module tier. The real backlog is
-- 116 rows / 232 blocks, not 86 / 172 - the 30 above are approved by an
-- invariant, not by a reader.
