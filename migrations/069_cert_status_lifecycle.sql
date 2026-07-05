-- Migration 069: certification status lifecycle (part 1 of 2 — add + backfill)
-- Introduces a 4-state lifecycle replacing the overloaded is_published boolean.
--   draft        - created/scaffolded, NOT announced. Hidden from catalog. (default)
--   coming_soon  - built + JTA filed, announced. Shows in catalog w/ badge.
--                  NOT enrollable, NOT examinable.
--   available    - fully live: discoverable, enrollable, examinable, mints creds.
--   unavailable  - temporarily frozen: shows w/ badge, lessons/practice keep working
--                  for enrolled learners, EXAM frozen (no new starts, no new mints),
--                  existing credentials remain valid.
--
-- Part 1 adds the column, a CHECK, an index, and backfills. is_published is left
-- physically present but unused; part 2 (a later migration) drops it once every
-- read path is migrated to status and proven green. This staged approach means
-- there is never a moment where a missed read has no backing column.
--
-- Editor-first: run in the Supabase SQL editor, then commit this file. Safe default
-- direction: any cert not explicitly promoted lands in the HIDDEN 'draft' state
-- (never accidentally exposed).

-- 1) Column + constraint. Default 'draft' so anything created lands hidden.
alter table certifications
  add column if not exists status text not null default 'draft';

alter table certifications
  drop constraint if exists certifications_status_check;
alter table certifications
  add constraint certifications_status_check
  check (status in ('draft','coming_soon','available','unavailable'));

create index if not exists idx_certifications_status on certifications(status);

-- 2) Backfill from the existing boolean (safe rule: published -> available,
--    everything else -> draft/hidden), THEN explicit promotions by id.
update certifications
set status = case when is_published then 'available' else 'draft' end;

-- SD-AI-I: JTA filed, lessons + question banks complete, coverage closed.
-- Built and announce-ready but not yet launched -> coming_soon.
update certifications
set status = 'coming_soon'
where id = '44444444-4444-4444-4444-444444444444';

-- 3) Verify: show every cert's old boolean vs new status.
select code, name, is_published, status
from certifications
order by
  case status when 'available' then 0 when 'coming_soon' then 1
              when 'unavailable' then 2 else 3 end,
  code;
