-- 372 -- a regeneration carries the spec it was generated from, and a batch id.
--
-- ############ WHY A BATCH ID IS THE POINT ############
--
-- All four accent defects in the entire corpus came from ONE MINUTE on
-- 2026-09-21 -- 3 of the 13 rows written by a single retranslation run, against
-- 10,512 clean text fields everywhere else. That was found by grouping on
-- `created_at`, and it is the reason a 12.8M-character read should be
-- STRATIFIED BY GENERATION rather than sampled flat.
--
-- **`created_at` cannot do that job again.** It does not move on UPDATE, so a
-- REGENERATED row keeps the timestamp of its first write and is invisible to
-- exactly the query that found the accent batch. A regeneration needs its own
-- identifier or the next bad batch is unfindable.
--
-- So: one row per generation run, and a nullable FK from every row it wrote.
-- `select * from lessons where translation_batch_id = '...'` is then the query
-- that took an hour of forensics last time.
--
-- ############ THE COLUMN IS NULLABLE, DELIBERATELY ############
--
-- NULL means "written before provenance existed", which is TRUE of 3,460
-- concept translations and 958 lesson translations. A backfill would have to
-- invent a batch for rows whose generation nobody recorded, and an invented
-- provenance is worse than an absent one -- the grandfathering 367 refused.
--
-- It is also why this migration needs no writer list: CLAUDE.md's rule attaches
-- to a NOT NULL column, because that is what breaks writers that predate it.
-- A nullable FK breaks nothing, and every existing writer keeps working while
-- recording honestly that it recorded nothing.
--
-- ############ THE SPEC LIVES ONCE, NOT 3,460 TIMES ############
--
-- `spec` holds the pinned-term list, the register rules, the generator and the
-- model. Putting that on every row would be 3,460 copies of one fact, which is
-- the defect this whole file is about. The batch row IS the fact; the rows
-- point at it.
--
-- ############ EXPOSURE, CHECKED BEFORE DECIDING ############
--
-- A new table in `public` becomes a PostgREST endpoint unless the grants say
-- otherwise. Measured: `pg_default_acl` for tables in `public` is
-- `{service_role=arwdDxtm/postgres}` -- anon and authenticated get nothing by
-- default. RLS is enabled anyway with no policy, because a grant and a policy
-- are different gates and the next person to add a grant should meet a closed
-- door rather than an open table. Both directions are asserted below.

do $mig$
declare
  v_lessons_before int;
  v_ct_before      int;
  v_lessons_after  int;
  v_ct_after       int;
  v_stamped        int;
begin
  select count(*) into v_lessons_before from public.lessons;
  select count(*) into v_ct_before from public.concept_translations;

  create table if not exists public.translation_batches (
    id          uuid primary key default gen_random_uuid(),
    created_at  timestamptz not null default now(),
    kind        text not null check (kind in ('lesson_span', 'lesson_body', 'concept_row')),
    generator   text not null,
    model       text not null,
    spec        jsonb not null,
    note        text
  );

  comment on table public.translation_batches is
    'One row per regeneration run. A row it wrote points here by '
    'translation_batch_id. NULL on a content row means the generation predates '
    'this table, which is true and is not backfilled.';
  comment on column public.translation_batches.spec is
    'What was in force: source hashes, pinned terms, register rules. Stored '
    'once per run, never per row.';

  alter table public.translation_batches enable row level security;

  alter table public.lessons
    add column if not exists translation_batch_id uuid
      references public.translation_batches(id);
  alter table public.concept_translations
    add column if not exists translation_batch_id uuid
      references public.translation_batches(id);

  create index if not exists lessons_translation_batch_idx
    on public.lessons (translation_batch_id) where translation_batch_id is not null;
  create index if not exists concept_translations_batch_idx
    on public.concept_translations (translation_batch_id) where translation_batch_id is not null;

  -- ####### POST-CONDITIONS, BOTH DIRECTIONS #######

  -- NEGATIVE: nothing was written to any content row. A migration that adds a
  -- provenance column must not invent provenance.
  select count(*) into v_stamped from public.lessons where translation_batch_id is not null;
  if v_stamped <> 0 then
    raise exception '% lesson row(s) already carry a batch id', v_stamped
      using hint = 'this migration must not backfill provenance';
  end if;
  select count(*) into v_stamped from public.concept_translations where translation_batch_id is not null;
  if v_stamped <> 0 then
    raise exception '% concept row(s) already carry a batch id', v_stamped
      using hint = 'this migration must not backfill provenance';
  end if;

  -- NEGATIVE: row counts unchanged on both tables.
  select count(*) into v_lessons_after from public.lessons;
  select count(*) into v_ct_after from public.concept_translations;
  if v_lessons_after <> v_lessons_before or v_ct_after <> v_ct_before then
    raise exception 'row counts moved: lessons % -> %, concept_translations % -> %',
      v_lessons_before, v_lessons_after, v_ct_before, v_ct_after;
  end if;

  -- NEGATIVE: the new table is not reachable by the public roles. Asserted
  -- rather than inherited from a default that could change.
  if has_table_privilege('anon', 'public.translation_batches'::regclass, 'SELECT') then
    raise exception 'anon can read translation_batches';
  end if;
  if has_table_privilege('authenticated', 'public.translation_batches'::regclass, 'SELECT') then
    raise exception 'authenticated can read translation_batches';
  end if;

  -- POSITIVE: and the role that has to write it can. A revoke that took
  -- everything away would pass every check above.
  if not has_table_privilege('service_role', 'public.translation_batches'::regclass, 'INSERT') then
    raise exception 'service_role cannot write translation_batches'
      using hint = 'no generator could record a batch';
  end if;

  -- POSITIVE: the columns exist and are usable as a key.
  if not exists (select 1 from pg_attribute
                  where attrelid = 'public.lessons'::regclass
                    and attname = 'translation_batch_id' and not attisdropped) then
    raise exception 'lessons.translation_batch_id is absent';
  end if;
  if not exists (select 1 from pg_attribute
                  where attrelid = 'public.concept_translations'::regclass
                    and attname = 'translation_batch_id' and not attisdropped) then
    raise exception 'concept_translations.translation_batch_id is absent';
  end if;

  raise notice '372: batches table created, 0 rows stamped';
  raise notice '372: lessons %, concept_translations % -- untouched', v_lessons_after, v_ct_after;
end
$mig$;

-- ############ APPLIED 2026-09-24 ############
--
-- Read from pg_catalog rather than from the notices:
--
--   translation_batches exists, RLS enabled            yes
--   lessons.translation_batch_id                       present
--   concept_translations.translation_batch_id          present
--   anon can SELECT translation_batches                false
--   service_role can INSERT                            true
--   batches / lessons stamped / concepts stamped       0 / 0 / 0
--
-- Nothing was backfilled, which is the post-condition that mattered.

-- Read it back, as a separate statement.
select
  (select count(*) from public.translation_batches) as batches,
  (select count(*) from public.lessons where translation_batch_id is not null) as lessons_stamped,
  (select count(*) from public.concept_translations where translation_batch_id is not null) as concepts_stamped;
