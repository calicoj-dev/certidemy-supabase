-- ============================================================================
-- 105_cert_identity_guard.sql
--
-- PREVENT THE FAILURE THAT DESTROYED AIE-I.
--
-- WHAT HAPPENED (see 104_rebuild_aie_i.sql for the full account). AIE-I lived at
-- 66666666-6666-6666-6666-666666666666. Migration 102 (seed_aism_i) seeded AISM-I onto
-- that same UUID, because the deterministic-UUID convention numbers certifications by
-- creation order and "the sixth cert" landed on an occupied slot. The row was UPDATED
-- in place: its code changed from 'AIE-I' to 'AISM-I', and every child row - domains,
-- tasks, concepts, modules, lessons, ~1,400 items - was replaced beneath it.
--
-- WHY NO EXISTING CHECK COULD FIRE.
--   * certifications.id is the PRIMARY KEY, so a duplicate-id query can never return a
--     row. There was never a duplicate. There was a REASSIGNMENT.
--   * A unique constraint on code cannot fire either: only one row ever held 'AIE-I',
--     and after the overwrite only one row held 'AISM-I'.
--   * verify-cert.mjs validates each certification against itself. Both AIE-I (before)
--     and AISM-I (after) were internally consistent at every moment. Nothing was
--     malformed - the wrong cert was simply sitting in the right shape.
--
-- The table was never in an invalid state. That is precisely why it went unnoticed for
-- days, and why the loss read as a clean cascade delete rather than an overwrite.
--
-- THE ACTUAL INVARIANT. A certification's CODE IS ITS IDENTITY. A row may change its
-- name, price, status, duration, blueprint - but the moment its code changes, it has
-- stopped being the certification it was, and everything hanging off its id now belongs
-- to something else. That is not an edit; it is a silent substitution.
--
-- This migration makes that mutation impossible without an explicit, deliberate opt-out.
--
-- ESCAPE HATCH. A genuine rename (rebranding a credential's code) is legitimate but
-- must be conscious. Set the flag, do the rename, unset it:
--
--     set local certidemy.allow_cert_code_change = 'on';
--     update public.certifications set code = 'NEW-CODE' where id = '...';
--
-- Using `set local` inside a transaction means the permission dies with the transaction
-- and cannot leak into later statements.
--
-- Idempotent. Safe to re-run.
-- ============================================================================

create or replace function public.guard_cert_identity()
returns trigger
language plpgsql
as $fn$
begin
  if new.code is distinct from old.code then
    if coalesce(current_setting('certidemy.allow_cert_code_change', true), 'off') <> 'on' then
      raise exception
        'Refusing to change certification code from % to % on id %. A cert code is its identity; changing it silently reassigns every domain, task, concept, module, lesson and item beneath it. This is the failure that destroyed AIE-I (see migration 104). If this rename is deliberate: set local certidemy.allow_cert_code_change = ''on''; inside your transaction.',
        old.code, new.code, old.id
        using errcode = 'raise_exception';
    end if;
    raise notice 'Certification code change ALLOWED by explicit flag: % -> % (id %)', old.code, new.code, old.id;
  end if;
  return new;
end;
$fn$;

drop trigger if exists trg_guard_cert_identity on public.certifications;
create trigger trg_guard_cert_identity
  before update on public.certifications
  for each row
  execute function public.guard_cert_identity();

-- ============================================================================
-- PROOF - the trigger blocks the exact statement shape that lost AIE-I.
-- Wrapped in a rollback so it proves the guard without touching live data.
-- ============================================================================
do $$
declare
  v_id   uuid;
  v_code text;
  blocked boolean := false;
begin
  select id, code into v_id, v_code from public.certifications order by code limit 1;

  begin
    update public.certifications set code = 'COLLISION-TEST' where id = v_id;
  exception when others then
    blocked := true;
  end;

  if not blocked then
    -- undo immediately; the guard is not working and that must be loud
    update public.certifications set code = v_code where id = v_id;
    raise exception 'GUARD NOT WORKING: code change on % was permitted.', v_code;
  end if;

  raise notice 'Guard verified: code change on % was blocked as expected.', v_code;
end $$;

-- ============================================================================
-- STANDING CHECKS - run these before any migration that seeds a NEW certification.
-- ============================================================================

-- 1. Which deterministic slots are occupied, and by what.
--    Read this BEFORE assigning a UUID to a new cert. Do not infer the next slot
--    from "how many certs exist" - that is the reasoning that caused the collision.
select id, code, status, created_at
from public.certifications
order by id;

-- 2. Free slots in the deterministic set (1111 through 9999).
with slots(id) as (
  select (repeat(n::text, 8) || '-' || repeat(n::text, 4) || '-' || repeat(n::text, 4)
       || '-' || repeat(n::text, 4) || '-' || repeat(n::text, 12))::uuid
  from generate_series(1, 9) n
)
select s.id as free_slot
from slots s
left join public.certifications c on c.id = s.id
where c.id is null
order by s.id;

-- 3. Orphan sweep: child rows pointing at a certification that no longer exists.
--    Expect 0 rows. A non-empty result means a cert was removed without its children.
select 'domains' as tbl, count(*) from public.domains  d where not exists (select 1 from public.certifications c where c.id = d.certification_id)
union all
select 'tasks',          count(*) from public.tasks    t where not exists (select 1 from public.certifications c where c.id = t.certification_id)
union all
select 'concepts',       count(*) from public.concepts x where not exists (select 1 from public.certifications c where c.id = x.certification_id)
union all
select 'modules',        count(*) from public.modules  m where not exists (select 1 from public.certifications c where c.id = m.certification_id)
union all
select 'quiz_questions', count(*) from public.quiz_questions q where not exists (select 1 from public.certifications c where c.id = q.certification_id);
