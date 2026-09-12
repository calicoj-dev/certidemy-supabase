-- 295: is_provisional is one boolean carrying three meanings - give it the third state
--
-- PRE-CONDITIONS AND POST-CONDITIONS ABORT. One visible result set at the end,
-- plus a rolled-back behaviour probe that proves the new trigger fires.
--
-- ============================================================================
-- WHY, AND WHY NOW RATHER THAN AFTER ROUND ONE
-- ============================================================================
--
-- verify-cert's i18n.approved cannot distinguish three states, and two of them
-- are opposite situations reported identically:
--
--   nobody has read anything                       -> FAIL today, and correctly
--   priority rows read, the rest honestly marked   -> FAIL today, and WRONGLY
--   a reviewer REJECTED a row and it is unfixed    -> FAIL today, and correctly
--   everything read                                -> PASS
--
-- This was written up after review round one and HELD ON PURPOSE, because one
-- rejection in 28 rows is not evidence and hardening schema around a single
-- observation is how a threshold gets set from three banks.
--
-- TWO ROUNDS NOW, AND THE RATE IS NOT WHAT DECIDED IT.
--
--   round one   domains + D5    1 rejected of 28    3.6 pct
--   round two   D1-D4          3 rejected of 70    4.3 pct
--   both                        4 rejected of 98    4.1 pct
--
-- Rare, and steady. What decided it is that THE STATE PERSISTS AND THE
-- BOOLEAN'S MEANING HAS INVERTED. SM-AI-II 5.7 es-419 was rejected in round
-- one, repaired within the hour, and is STILL provisional - it survived an
-- entire second review cycle without being re-read. As of today all four of
-- SM-AI-II's provisional rows are re-translations awaiting a re-read. NOT ONE
-- IS AN UNREVIEWED ROW.
--
-- So the check now says this, and every word of it is false for all four rows:
--
--   FAIL  s11  4 of 98 provisional - the English moved, or they were never reviewed
--
-- A column that cannot express the state produces a check that misdescribes
-- 100 pct of the rows it fails on. That is worse than imprecision.
--
-- RARITY ARGUES FOR THE COLUMN, NOT AGAINST IT. A failure reading 71 of 98 gets
-- worked; a failure reading 4 of 98 reads as nearly done and gets deferred - and
-- those four are the HIGHEST-RISK rows in the set, each a known meaning defect
-- whose repair nobody has checked. All four defects were meaning, none a typo.
--
-- AND THE SECOND CERTIFICATION ALREADY PROVES THE POINT. SD-AI-I 2.3 is
-- provisional in both languages and was never reviewed at all. Today SD-AI-I and
-- SM-AI-II produce the same FAIL. After this migration SD-AI-I WARNs (unreviewed)
-- and SM-AI-II FAILs (rejected), which is the difference that matters.
--
-- ============================================================================
-- SCOPE, STATED SO IT IS NOT MISTAKEN FOR AN OVERSIGHT
-- ============================================================================
--
-- review_status pairs with is_provisional - the STATEMENT half of
-- task_translations and the TITLE/DESCRIPTION half of domain_translations.
--
-- task_translations also carries knowledge / skills / abilities under a SEPARATE
-- flag, ksa_is_provisional. That half is NOT addressed here. It would need its
-- own status column, it has its own review workflow, and widening this migration
-- to cover it would mean backfilling a review state nobody has ever recorded.
-- Named as a bounded decision, not left implicit.
--
-- ============================================================================
-- EVERY WRITER OF task_translations AND domain_translations
-- ============================================================================
--
-- Per the writer-list discipline: a NOT NULL column does not fail the writers
-- that predate it until one of them next runs, and if that path is rare the
-- break is silent for as long as nobody exercises it. Enumerated 2026-09-11 by
-- grep across BOTH repos, plus pg_trigger for the writers no grep of application
-- code can find.
--
--   #  writer                                              writes the new column?
--   -- --------------------------------------------------- ----------------------
--   1  supabase/scripts/gen-jta-translations.mjs           NO - upserts x2 + an
--      the generator. Upserts statements/titles with          update. Covered by
--      is_provisional=true.                                   TRIGGER, below.
--
--   2  supabase/scripts/apply-translation-review.mjs       YES - CHANGED BY THIS
--      clears the flag for approved rows.                     MIGRATION's companion
--                                                             edit. Sets the status.
--
--   3  supabase/scripts/retranslate-review-rejection.mjs   NO, DELIBERATELY. It
--      writes a repaired statement for a rejected row.        must LEAVE the status
--                                                             alone - rejected is
--                                                             sticky. Companion edit
--                                                             makes that explicit.
--
--   4  supabase/scripts/fix-aims-ia-translations.mjs       NO - REST PATCH of
--      mojibake repair on task_translations.statement.        statement only.
--                                                             Covered by TRIGGER.
--
--   5  supabase/scripts/fix-referencia-de-controles.ps1    NO - prints an UPDATE
--      prints SQL for a human to run.                         for a human. Covered
--                                                             by TRIGGER.
--
--   6  certidemy-web/scripts/load-jta-i18n.mjs             NO - upserts x2.
--      the other loader.                                      Covered by TRIGGER.
--
--   7  certidemy-web/scripts/fix-isms-f-ksa.mjs            N/A - writes the K/S/A
--                                                             columns only, which
--                                                             are out of scope.
--
--   8  trg_invalidate_task_translations ON public.tasks    NO - CHANGED BELOW.
--   9  trg_invalidate_domain_translations ON public.domains   Sets is_provisional
--      DATABASE TRIGGERS. Neither appears in any grep for       true when the ENGLISH
--      from("task_translations") - they are the rare path.      moves; must demote
--                                                               approved -> unreviewed
--                                                               too, or the row is
--                                                               provisional and still
--                                                               claims approved.
--
-- THE RARE PATH IS #8 AND #9. They fire only when somebody edits an English
-- task statement or domain title, which happens during a JTA revision and at no
-- other time. That is the path nothing exercises on deploy day.
--
-- SEVEN OF NINE WRITERS WOULD LEAVE THE NEW COLUMN STALE, and six of those write
-- TEXT. Editing seven call sites across two repos is the drift-prone option and
-- guarantees the eighth writer nobody has written yet gets it wrong. So the
-- invariant is enforced STRUCTURALLY, by a trigger on the translation tables
-- themselves: if the translated text changes and the row said approved, it is no
-- longer approved. That holds for writers nobody has enumerated and for writers
-- that do not exist yet.
--
-- ============================================================================
-- STICKY REJECTED - the semantics, stated once
-- ============================================================================
--
-- review_status is THE WORST THING KNOWN ABOUT THIS ROW UNTIL CLEARED.
--
--   unreviewed  nobody has compared it to the English
--   rejected    a reviewer compared it and said it is wrong
--   approved    a reviewer compared it and said it is right
--
-- Only a HUMAN APPROVAL clears rejected. A re-translation does not: the repair
-- is unverified, and returning the row to unreviewed would discard the single
-- most useful thing known about it - that it was wrong once, which is exactly
-- what makes it high-risk. This is why the demote trigger touches ONLY approved.
--
-- ============================================================================
-- GUARD 1 (PRE) - abort if this has run, or if the ground has moved
-- ============================================================================
begin;

do $pre$
declare
  t_rows int; d_rows int; t_prov int; d_prov int; n_target int;
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='task_translations'
               and column_name='review_status') then
    raise exception using message = '295 has already run', hint = 'review_status exists';
  end if;

  select count(*), count(*) filter (where is_provisional) into t_rows, t_prov from public.task_translations;
  select count(*), count(*) filter (where is_provisional) into d_rows, d_prov from public.domain_translations;
  if t_rows <> 1016 or d_rows <> 116 or t_prov <> 6 or d_prov <> 0 then
    raise exception using
      message = 'the translation tables are not in the state 295 was written against',
      detail  = format('task %s/%s prov, domain %s/%s prov; expected 1016/6 and 116/0',
                       t_rows, t_prov, d_rows, d_prov),
      hint    = 're-measure before backfilling a review state';
  end if;

  -- The four rows that must become 'rejected' must all be findable AND
  -- provisional. A backfill that silently matches three of four would look
  -- clean in every count below.
  select count(*) into n_target
    from public.task_translations tt
    join public.tasks t on t.id = tt.task_id
    join public.certifications c on c.id = t.certification_id
   where c.code = 'SM-AI-II' and tt.is_provisional
     and (t.code, tt.language) in (('1.9','es-419'), ('1.9','pt-BR'), ('3.8','es-419'), ('5.7','es-419'));
  if n_target <> 4 then
    raise exception using
      message = 'the four rejected rows are not all present and provisional',
      detail  = format('matched %s of 4', n_target),
      hint    = 'do not backfill a rejection onto the wrong row';
  end if;
end
$pre$;


-- ============================================================================
-- 1. THE COLUMN
-- ============================================================================
-- DEFAULT 'unreviewed' is the safe half: a writer that does not know about this
-- column produces a row claiming nothing, never a row claiming review.
alter table public.task_translations
  add column review_status text not null default 'unreviewed';
alter table public.domain_translations
  add column review_status text not null default 'unreviewed';

alter table public.task_translations
  add constraint task_translations_review_status_check
  check (review_status in ('unreviewed', 'approved', 'rejected'));
alter table public.domain_translations
  add constraint domain_translations_review_status_check
  check (review_status in ('unreviewed', 'approved', 'rejected'));

comment on column public.task_translations.review_status is
  'Worst thing known about this row until cleared. Only a human approval clears rejected; a re-translation does not.';
comment on column public.domain_translations.review_status is
  'Worst thing known about this row until cleared. Only a human approval clears rejected; a re-translation does not.';


-- ============================================================================
-- 2. THE BACKFILL
-- ============================================================================
-- not is_provisional -> approved. THIS INHERITS WHATEVER TRUTH THE BOOLEAN
-- ALREADY CARRIED AND DOES NOT AUDIT IT. is_provisional = false is already
-- defined as "a human compared this to the English", so the mapping makes an
-- existing claim explicit rather than making a new one. 1,126 rows across
-- thirteen certifications inherit it; if that claim was ever optimistic, it was
-- optimistic before this migration and this migration does not make it worse.
update public.task_translations   set review_status = 'approved' where not is_provisional;
update public.domain_translations set review_status = 'approved' where not is_provisional;

-- The four reviewed-and-rejected rows, named individually.
update public.task_translations tt
   set review_status = 'rejected'
  from public.tasks t
  join public.certifications c on c.id = t.certification_id
 where t.id = tt.task_id
   and c.code = 'SM-AI-II'
   and (t.code, tt.language) in (('1.9','es-419'), ('1.9','pt-BR'), ('3.8','es-419'), ('5.7','es-419'));

-- SD-AI-I 2.3 es-419 / pt-BR keep the 'unreviewed' default. They are provisional
-- because nobody has read them, which is a DIFFERENT state and the whole point.


-- ============================================================================
-- 3. THE STRUCTURAL INVARIANT - one trigger per table
-- ============================================================================
-- If the translated text changes, an 'approved' row is no longer approved. The
-- WHEN clause carries the condition so it is visible in pg_trigger rather than
-- buried in a function body.
create or replace function public.fn_demote_translation_review()
returns trigger language plpgsql as $fn$
begin
  -- ONLY 'approved' is demoted. 'rejected' is sticky and 'unreviewed' is the
  -- floor, so both pass through untouched.
  if new.review_status = 'approved' then
    new.review_status  := 'unreviewed';
    new.is_provisional := true;
  end if;
  return new;
end;
$fn$;

create trigger trg_demote_task_translation_review
  before update on public.task_translations
  for each row
  when (new.statement is distinct from old.statement)
  execute function public.fn_demote_translation_review();

create trigger trg_demote_domain_translation_review
  before update on public.domain_translations
  for each row
  when (new.title is distinct from old.title
        or new.description is distinct from old.description)
  execute function public.fn_demote_translation_review();


-- ============================================================================
-- 4. WRITERS #8 AND #9 - the triggers on tasks and domains
-- ============================================================================
-- These set is_provisional = true when the ENGLISH moves. They must demote the
-- status with it, or a row ends up provisional while still claiming approved.
-- Bodies preserved verbatim apart from the added column; the existing comment is
-- kept because it records why K/S/A edits do not invalidate anything.
--
-- NOTE: these do NOT fire trg_demote_* - they change is_provisional and
-- review_status, never the statement or title, so that WHEN clause is false.
-- No recursion.
create or replace function public.fn_invalidate_task_translations()
returns trigger language plpgsql as $fn$
begin
  -- Only the statement is translated (task_translations has no knowledge/skills/
  -- abilities columns), so K/S/A edits do not invalidate anything.
  if new.statement is distinct from old.statement then
    update public.task_translations
       set is_provisional = true,
           review_status = case when review_status = 'approved' then 'unreviewed' else review_status end
     where task_id = new.id
       and (not is_provisional or review_status = 'approved');
  end if;
  return new;
end;
$fn$;

create or replace function public.fn_invalidate_domain_translations()
returns trigger language plpgsql as $fn$
begin
  if new.title is distinct from old.title
     or new.description is distinct from old.description then
    update public.domain_translations
       set is_provisional = true,
           review_status = case when review_status = 'approved' then 'unreviewed' else review_status end
     where domain_id = new.id
       and (not is_provisional or review_status = 'approved');
  end if;
  return new;
end;
$fn$;


-- ============================================================================
-- GUARD 2 (POST) - abort before commit if any of it is wrong
-- ============================================================================
do $post$
declare
  t_app int; t_rej int; t_unr int; d_app int; d_unr int;
  disagree int; n_rej_named int; n_sd int; n_trig int;
begin
  select count(*) filter (where review_status='approved'),
         count(*) filter (where review_status='rejected'),
         count(*) filter (where review_status='unreviewed')
    into t_app, t_rej, t_unr from public.task_translations;
  select count(*) filter (where review_status='approved'),
         count(*) filter (where review_status='unreviewed')
    into d_app, d_unr from public.domain_translations;

  if t_app <> 1010 or t_rej <> 4 or t_unr <> 2 then
    raise exception using message = 'task_translations backfill is wrong',
      detail = format('approved %s (1010), rejected %s (4), unreviewed %s (2)', t_app, t_rej, t_unr);
  end if;
  if d_app <> 116 or d_unr <> 0 then
    raise exception using message = 'domain_translations backfill is wrong',
      detail = format('approved %s (116), unreviewed %s (0)', d_app, d_unr);
  end if;

  -- THE TWO COLUMNS MUST AGREE, in both directions. This is the invariant the
  -- rest of the system will rely on, and a count-only check passes without it.
  select (select count(*) from public.task_translations
           where (is_provisional and review_status = 'approved')
              or (not is_provisional and review_status <> 'approved'))
       + (select count(*) from public.domain_translations
           where (is_provisional and review_status = 'approved')
              or (not is_provisional and review_status <> 'approved'))
    into disagree;
  if disagree <> 0 then
    raise exception using message = 'is_provisional and review_status disagree',
      detail = format('%s row(s)', disagree),
      hint   = 'approved must mean not provisional, and the reverse';
  end if;

  -- IDENTITY, not just count: the four rejected rows are the four named ones.
  select count(*) into n_rej_named
    from public.task_translations tt
    join public.tasks t on t.id = tt.task_id
    join public.certifications c on c.id = t.certification_id
   where tt.review_status = 'rejected' and c.code = 'SM-AI-II'
     and (t.code, tt.language) in (('1.9','es-419'), ('1.9','pt-BR'), ('3.8','es-419'), ('5.7','es-419'));
  if n_rej_named <> 4 then
    raise exception using message = 'the rejected rows are not the four named rows',
      detail = format('%s of 4 match', n_rej_named);
  end if;

  -- THE NEGATIVE HALF, and it is a different certification: SD-AI-I 2.3 must be
  -- UNREVIEWED, not rejected. Nobody read those; they are the state this column
  -- exists to separate.
  select count(*) into n_sd
    from public.task_translations tt
    join public.tasks t on t.id = tt.task_id
    join public.certifications c on c.id = t.certification_id
   where c.code = 'SD-AI-I' and t.code = '2.3' and tt.review_status = 'unreviewed';
  if n_sd <> 2 then
    raise exception using message = 'SD-AI-I 2.3 is not unreviewed in both languages',
      detail = format('%s of 2', n_sd);
  end if;

  select count(*) into n_trig from pg_trigger
   where not tgisinternal and tgname in
     ('trg_demote_task_translation_review', 'trg_demote_domain_translation_review');
  if n_trig <> 2 then
    raise exception using message = 'the demote triggers are not both present',
      detail = format('%s of 2', n_trig);
  end if;
end
$post$;

commit;


-- ============================================================================
-- BEHAVIOUR PROBE - proves the trigger FIRES. Rolled back; nothing persists.
-- ============================================================================
-- Asserting a trigger exists is not asserting it works. This writes to a real
-- row and throws the write away. It is safe to run and safe to re-run: the
-- rollback is unconditional, and the probe reads back inside the same
-- transaction before discarding it.
begin;

do $probe$
declare
  v_id uuid; v_before text; v_status text; v_prov boolean;
begin
  select id, statement into v_id, v_before
    from public.task_translations where review_status = 'approved' limit 1;
  if v_id is null then
    raise exception using message = 'no approved row to probe';
  end if;

  update public.task_translations
     set statement = v_before || ' [probe]'
   where id = v_id;

  select review_status, is_provisional into v_status, v_prov
    from public.task_translations where id = v_id;

  if v_status <> 'unreviewed' or not v_prov then
    raise exception using
      message = 'the demote trigger did not fire on a text change',
      detail  = format('review_status %s, is_provisional %s; expected unreviewed/true', v_status, v_prov);
  end if;

  raise notice 'probe ok: approved -> % on a statement change', v_status;
end
$probe$;

rollback;


-- ============================================================================
-- THE VISIBLE RESULT SET
-- ============================================================================
select 'task_translations' as tbl, review_status, count(*) as rows
from public.task_translations group by 1, 2
union all
select 'domain_translations', review_status, count(*)
from public.domain_translations group by 1, 2
order by 1, 2;
-- EXPECT:
--   domain_translations  approved    116
--   task_translations    approved   1010
--   task_translations    rejected      4
--   task_translations    unreviewed    2
