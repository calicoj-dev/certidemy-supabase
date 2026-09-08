-- ============================================================
-- 280_appeals_reviewer.sql
--
-- WHO DECIDED AN APPEAL. ISO/IEC 17024 clause 9.9, separation of functions.
--
-- RUN IN THE SQL EDITOR FIRST, THEN COMMITTED HERE AS THE RECORD.
-- Committing this file does not apply it -- there is no migration runner.
-- ============================================================
--
-- THE CLAUSE IS NOT AT RISK TODAY, AND THAT IS EXACTLY WHY THIS IS ADDED NOW.
--
-- Clause 9.9 requires that whoever reviews an appeal was not the original
-- decision-maker. On this platform the original decision is AUTOMATIC: a result
-- is produced by score-mock-exam against a fixed key, with no human judgement
-- anywhere in it. There is no original decision-maker to be separated from, so
-- no reviewer can currently violate the requirement.
--
-- REVIEWER IDENTITY CANNOT BE CAPTURED RETROACTIVELY. The day any human touches
-- a result -- a manual regrade, a discretionary pass, an item withdrawn after a
-- flag -- the separation becomes a thing an auditor asks to see evidence of,
-- and evidence only exists for decisions recorded after the column existed.
-- Adding it later records nothing about the appeals decided before it.
--
-- So this is not the control. It is the precondition for the control being
-- assertable at all, and it is cheap now and impossible later.
--
-- ------------------------------------------------------------
-- NO CHECK (reviewed_by <> user_id), DELIBERATELY.
--
-- It is the obvious constraint and it would be correct today: nobody should
-- decide their own appeal, and no legitimate flow produces that row.
--
-- IT IS NOT ADDED BECAUSE IT ENCODES A POLICY NOBODY HAS DECIDED. The status
-- vocabulary includes 'withdrawn', and a candidate withdrawing their own appeal
-- is the one case where the person named on the appeal is legitimately the
-- person acting on it. Today the console offers a reviewer only under_review,
-- upheld and denied -- withdrawal is not built -- so the case cannot arise. If
-- the body ever lets a candidate withdraw, a CHECK added now would refuse a
-- correct row, and it would refuse it in the database, where the failure is a
-- constraint violation rather than a decision anyone can read.
--
-- A constraint that is correct under today's feature set and wrong under a
-- plausible next one is a constraint to write WHEN the feature set settles.
-- Recorded here so the next reader knows it was considered rather than missed.
--
-- ------------------------------------------------------------
-- BOTH COLUMNS ARE NULLABLE, and that is not laziness.
--
-- public.appeals holds rows today (filed through the candidate route in
-- 166dd2e) that were never decided, and rows decided while these columns did
-- not exist. NOT NULL would fail against them, and a backfill would have to
-- invent a reviewer -- writing a name onto a decision nobody made, which is
-- worse than recording nothing.
--
-- NULL therefore means exactly one thing: "no reviewer is recorded for this
-- decision." An auditor reading a decided appeal with a null reviewed_by is
-- reading the truth about what the system knew, not a gap in the data.
--
-- ------------------------------------------------------------
-- THE APPLICATION WORKS WITHOUT THIS MIGRATION, AND SAYS SO WHEN IT DOES.
--
-- certidemy-web/app/[locale]/console/appeals/actions.ts attempts the UPDATE
-- with the stamp first. PostgREST rejects an UPDATE naming a column that does
-- not exist (PGRST204; Postgres 42703), so an unconditional stamp would make
-- every appeal undecidable until this ran. On that specific rejection the
-- action retries with status and resolution_note alone and returns
-- degraded: true, which the console renders as a warning naming migration 280.
--
-- Once this migration is applied that path stops being reachable. Do NOT remove
-- it as dead code: it is what keeps the two repositories independently
-- deployable, and the same shape will be needed by the next column added here.
--
-- ------------------------------------------------------------
-- NO RLS CHANGE. "appeals admin update" (062:204) already restricts UPDATE to
-- is_platform_admin() over the whole row, and these columns are part of that
-- row. No new policy, no new grant: 062:209 granted select and insert to
-- authenticated and update reaches only through the admin policy.
-- ============================================================

alter table public.appeals
  add column if not exists reviewed_by uuid,
  add column if not exists reviewed_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'appeals_reviewed_by_fkey'
  ) then
    alter table public.appeals
      add constraint appeals_reviewed_by_fkey
      foreign key (reviewed_by) references public.profiles(id);
  end if;
end$$;

-- ON DELETE is deliberately omitted, which means NO ACTION. A reviewer's
-- profile cannot be deleted while it is named on an appeal, and that is the
-- intended behaviour: the audit record of who decided a candidate's appeal
-- should outlive that reviewer's employment. Contrast appeals_user_id_fkey
-- (062:177), which cascades -- a candidate deleting their account takes their
-- own appeals with them, which is a data-subject right rather than an audit
-- record.

comment on column public.appeals.reviewed_by is
  'The platform_admin who last recorded a decision on this appeal. NULL means no reviewer is recorded -- either the appeal is undecided, or it was decided before this column existed. Never backfilled: inventing a reviewer is worse than recording none. ISO/IEC 17024 clause 9.9 evidence.';

comment on column public.appeals.reviewed_at is
  'When the decision in status/resolution_note was recorded. Distinct from updated_at, which any write moves.';

create index if not exists idx_appeals_reviewed_by
  on public.appeals using btree (reviewed_by)
  where reviewed_by is not null;

-- ---------------------------------------------------------------------------
-- VERIFY AFTER APPLYING
--
--   select column_name, data_type, is_nullable
--   from information_schema.columns
--   where table_schema = 'public' and table_name = 'appeals'
--     and column_name in ('reviewed_by','reviewed_at');
--     -> reviewed_by  uuid         YES
--     -> reviewed_at  timestamptz  YES
--
--   -- The negative half. Both must be run: the first proves the FK holds, the
--   -- second proves NULL is still accepted, which is what keeps existing rows
--   -- and undecided appeals legal.
--   begin;
--     update public.appeals
--       set reviewed_by = '00000000-0000-0000-0000-000000000000'
--       where id = (select id from public.appeals limit 1);
--     -- expect: ERROR 23503 violates foreign key constraint
--   rollback;
--
--   begin;
--     update public.appeals set reviewed_by = null, reviewed_at = null
--       where id = (select id from public.appeals limit 1);
--     -- expect: SUCCESS. NULL is the "no reviewer recorded" case and must stay
--     -- writable, or an undecided appeal becomes unrepresentable.
--   rollback;
--
--   -- Then confirm the application's degraded path is no longer reachable:
--   -- decide an appeal in /console/appeals and check the warning does NOT
--   -- appear, and that reviewed_by is set.
-- ---------------------------------------------------------------------------
