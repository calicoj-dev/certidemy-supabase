-- 353_lessons_items_updated_at.sql
--
-- `updated_at` on `lessons` and `quiz_questions`, with the trigger that keeps it.
--
-- ============ WHY ============
--
-- Twice on 2026-09-19 a question that should have been a glance cost a query.
-- `02-03-amendment-1-2024` pt-BR was withheld from the MCP surface for two days
-- after a voice edit fired trg_lessons_clear_mcp_servable, and the edit could
-- not be dated from the row -- the order had to be inferred from the scan
-- timestamps on its two siblings. These are the only two content tables of any
-- size with no `updated_at`; 33 other tables carry one.
--
-- ============ PRE-MIGRATION EDITS ARE UNRECOVERABLE ============
--
-- THE BACKFILL IS `created_at` AND IT IS A FLOOR, NOT A MEASUREMENT.
--
-- Every row is stamped with its creation time, which is the only honest value
-- available: nothing anywhere recorded when these rows were last edited, and
-- many of them HAVE been edited -- the trilingual repair passes, the modal
-- inflation sweep, the quote-marker restoration, the voice edit above. Those
-- edits are gone. They were never recorded and this migration cannot invent
-- them.
--
-- `now()` was rejected as the backfill. It would assert that every row was
-- edited at migration time, which is false for all of them, and would destroy
-- the one true signal the column can carry from here on: that a row whose
-- updated_at still equals its created_at has not been touched since.
--
-- SO, PLAINLY, FOR ANYONE READING THIS COLUMN:
--
--   updated_at > created_at    a real edit, after 2026-09-19.
--   updated_at = created_at    EITHER never edited, OR edited before
--                              2026-09-19. These two are indistinguishable
--                              and always will be.
--
-- ============ THE COLUMN AND THE TRIGGER LAND TOGETHER ============
--
-- Measured before writing: 33 tables carry `updated_at` and only 17 have a
-- trigger that touches it. The other 16 depend on every writer remembering,
-- which is a convention rather than a guarantee. A column that looks maintained
-- and is not is worse than an absent one, because a reader believes it.
--
-- So the trigger is not a follow-up. Post-conditions 4 and 5 EXERCISE it on a
-- real row rather than checking that it exists, because 16 tables in this
-- database prove that existence is not the property. Each probe undoes itself
-- by raising inside a sub-block, the way 347 and 351 do -- `rollback to
-- savepoint` is not a plpgsql statement, and the first draft of this file
-- aborted at line 169 for exactly that reason.
--
-- ============ NO TABLE REWRITE, AND THE ORDER IS WHY ============
--
-- `add column ... default now()` is a VOLATILE default and rewrites the whole
-- table. Adding the column bare, backfilling, and only then attaching the
-- default costs one UPDATE per table and no rewrite.
--
-- ============ NO WRITER CHANGES ============
--
-- CLAUDE.md requires a NOT NULL column to name every writer of its table. That
-- rule does not bite here and the reason is worth stating: the value is
-- supplied by a DEFAULT on insert and by a TRIGGER on update, so no caller
-- needs to know the column exists. Both tables' writers are unaffected --
-- _shared/issue.ts, score-mock-exam, mint-missing-credentials, the generators,
-- the translation scripts, remapGroupOrder. None mentions updated_at and none
-- needs to.
--
-- Trigger composition checked against pg_trigger: `lessons` already carries
-- trg_lessons_clear_mcp_servable (BEFORE UPDATE) and
-- trg_lessons_flag_translation_review (AFTER UPDATE); `quiz_questions` carries
-- trg_item_bloom_matches_task and trg_prevent_delete_presented_item. BEFORE
-- UPDATE row triggers fire in name order and each returns NEW, so they compose.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  n_lessons     int;
  n_items       int;
  n_l_null      int;
  n_i_null      int;
  n_l_moved     int;
  n_i_moved     int;
  probe_id      uuid;
  probe_before  timestamptz;
  probe_after   timestamptz;
  ok            boolean;
  probe_err     text;
begin

  -- ----------------------------------------------- pre-conditions
  select count(*) into n_lessons from public.lessons;
  select count(*) into n_items   from public.quiz_questions;
  if n_lessons = 0 or n_items = 0 then
    raise exception 'refusing to run against empty tables (lessons %, quiz_questions %)',
      n_lessons, n_items;
  end if;

  if exists (
    select 1 from pg_attribute a
      join pg_class c on c.oid = a.attrelid
      join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
     where c.relname = 'lessons' and a.attname = 'updated_at' and not a.attisdropped
  ) then
    raise exception 'lessons.updated_at already exists -- this migration has run'
      using hint = 'Check pg_attribute before re-running.';
  end if;

  -- ----------------------------------------------- the columns, bare
  alter table public.lessons        add column updated_at timestamptz;
  alter table public.quiz_questions add column updated_at timestamptz;

  -- ----------------------------------------------- the backfill
  update public.lessons        set updated_at = created_at;
  update public.quiz_questions set updated_at = created_at;

  -- ----------------------------------------------- default and NOT NULL
  alter table public.lessons        alter column updated_at set default now();
  alter table public.quiz_questions alter column updated_at set default now();
  alter table public.lessons        alter column updated_at set not null;
  alter table public.quiz_questions alter column updated_at set not null;

  comment on column public.lessons.updated_at is
    'Maintained by trg_lessons_set_updated_at. Backfilled to created_at by 353; edits before 2026-09-19 were never recorded and are unrecoverable, so updated_at = created_at means never edited OR edited before 353.';
  comment on column public.quiz_questions.updated_at is
    'Maintained by trg_quiz_questions_set_updated_at. Backfilled to created_at by 353; edits before 2026-09-19 are unrecoverable.';

  -- ----------------------------------------------- the trigger
  drop trigger if exists trg_lessons_set_updated_at on public.lessons;
  create trigger trg_lessons_set_updated_at
    before update on public.lessons
    for each row execute function public.set_updated_at();

  drop trigger if exists trg_quiz_questions_set_updated_at on public.quiz_questions;
  create trigger trg_quiz_questions_set_updated_at
    before update on public.quiz_questions
    for each row execute function public.set_updated_at();

  -- ===================== POST-CONDITIONS =====================

  -- 1. POSITIVE. Every row carries a value and none is null.
  select count(*) filter (where updated_at is null) into n_l_null from public.lessons;
  select count(*) filter (where updated_at is null) into n_i_null from public.quiz_questions;
  if n_l_null <> 0 or n_i_null <> 0 then
    raise exception 'updated_at is null on % lesson(s) and % item(s)', n_l_null, n_i_null;
  end if;

  -- 2. NEGATIVE, AND IT IS THE BACKFILL'S WHOLE CLAIM. Nothing was stamped with
  --    the clock. Every pre-existing row must still read created_at exactly --
  --    a now() backfill would satisfy check 1 and destroy the signal.
  select count(*) filter (where updated_at <> created_at) into n_l_moved from public.lessons;
  select count(*) filter (where updated_at <> created_at) into n_i_moved from public.quiz_questions;
  if n_l_moved <> 0 or n_i_moved <> 0 then
    raise exception '% lesson(s) and % item(s) do not read created_at -- the backfill used the clock',
      n_l_moved, n_i_moved;
  end if;

  -- 3. NEGATIVE. No row was added or lost.
  if (select count(*) from public.lessons) <> n_lessons
     or (select count(*) from public.quiz_questions) <> n_items then
    raise exception 'row count moved: lessons % -> %, quiz_questions % -> %',
      n_lessons, (select count(*) from public.lessons),
      n_items,   (select count(*) from public.quiz_questions);
  end if;

  -- 4. THE TRIGGER FIRES. Not "the trigger exists" -- 16 tables in this
  --    database carry an updated_at that no trigger maintains, so existence is
  --    demonstrably not the property.
  --
  --    THE SUB-BLOCK ROLLS ITSELF BACK BY RAISING, which is the only way to
  --    undo a write inside plpgsql: `rollback to savepoint` is not a plpgsql
  --    statement and is a syntax error here. A begin/exception block IS the
  --    savepoint, and catching the raise discards every database change made
  --    inside it. Variable assignments are not database state and survive, so
  --    probe_after still holds what the trigger wrote. Same shape as 347 and
  --    351.
  --
  --    The probe touches `title`, never `content_md`, so
  --    trg_lessons_clear_mcp_servable cannot fire and no lesson can be
  --    withheld by this migration.
  select id, updated_at into probe_id, probe_before
    from public.lessons order by id limit 1;
  begin
    update public.lessons set title = title where id = probe_id;
    select updated_at into probe_after from public.lessons where id = probe_id;
    raise exception 'probe rollback' using errcode = 'ZZ999';
  exception
    when sqlstate 'ZZ999' then ok := true;
    when others then ok := false; probe_err := sqlstate || ' ' || sqlerrm;
  end;
  if not ok then
    raise exception 'the lessons probe update failed: %', probe_err
      using detail = 'The trigger could not be exercised, so this migration cannot prove updated_at is maintained.';
  end if;
  if probe_after is null or probe_after <= probe_before then
    raise exception 'the lessons trigger did not move updated_at (% -> %)', probe_before, probe_after
      using detail = 'The column was added but nothing maintains it -- the defect this migration exists to avoid.';
  end if;

  -- 5. AND THE SAME FOR THE ITEM BANK. A trigger created on one table says
  --    nothing about the other.
  select id, updated_at into probe_id, probe_before
    from public.quiz_questions order by id limit 1;
  begin
    update public.quiz_questions set question_text = question_text where id = probe_id;
    select updated_at into probe_after from public.quiz_questions where id = probe_id;
    raise exception 'probe rollback' using errcode = 'ZZ999';
  exception
    when sqlstate 'ZZ999' then ok := true;
    when others then ok := false; probe_err := sqlstate || ' ' || sqlerrm;
  end;
  if not ok then
    raise exception 'the quiz_questions probe update failed: %', probe_err
      using detail = 'The trigger could not be exercised, so this migration cannot prove updated_at is maintained.';
  end if;
  if probe_after is null or probe_after <= probe_before then
    raise exception 'the quiz_questions trigger did not move updated_at (% -> %)', probe_before, probe_after;
  end if;

  -- 6. THE PROBES LEFT NOTHING, and for an UPDATE probe that is the same
  --    assertion as check 2 re-run: every row must still read created_at. A
  --    sub-block that failed to roll back would have edited real content -- a
  --    lesson title or a live exam item -- and exactly one row would now carry
  --    updated_at > created_at. This is stronger than counting a marker row,
  --    because it covers both tables entirely rather than the two rows probed.
  select count(*) filter (where updated_at <> created_at) into n_l_moved from public.lessons;
  select count(*) filter (where updated_at <> created_at) into n_i_moved from public.quiz_questions;
  if n_l_moved <> 0 or n_i_moved <> 0 then
    raise exception '% lesson(s) and % item(s) carry updated_at > created_at -- a probe sub-block did not roll back',
      n_l_moved, n_i_moved
      using detail = 'Real content was edited by a post-condition. Inspect those rows before re-running.';
  end if;

  raise notice '353 ok: updated_at on % lesson(s) and % item(s), both triggers exercised', n_lessons, n_items;
  raise notice 'updated_at = created_at means never edited OR edited before 353. Indistinguishable, permanently.';
end
$mig$;
