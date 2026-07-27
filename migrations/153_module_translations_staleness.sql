-- 153_module_translations_staleness.sql
--
-- module_translations was created 2026-07-08 and backfilled for the three Scrum
-- certifications only. AIE-I, AIGRM-I, AIHR-I and AISM-I have zero rows.
--
-- The table shipped with no provisional flag, no updated_at, and no invalidation
-- trigger. An English module title can therefore be edited while its Spanish and
-- Portuguese rows silently continue to describe the old text. That is the same
-- failure class migration 132 closed for tasks and domains, and it is the reason
-- four certifications sat untranslated for three weeks with nothing failing.
--
-- Deliberately NOT wired into verify-cert as a publish blocker. A task statement
-- defines what the credential attests, so a stale one must block publication. A
-- module title is teaching chrome. A gate that blocks a release over a subtitle
-- is a gate someone disables the first time it is inconvenient, and a gate people
-- route around is worse than no gate. This surfaces as a WARN instead, via
-- v_module_i18n_coverage.
--
-- Editor-first: run in the Supabase SQL editor, then commit this file as the
-- versioned record.
--
-- NOTE: this file is ASCII-only on purpose. No translated copy passes through
-- the SQL editor -- that is this project's documented mojibake source. The
-- es-419 and pt-BR rows load through scripts/load-module-i18n.mjs.

begin;

-- ---------------------------------------------------------------------------
-- 1. Staleness columns
-- ---------------------------------------------------------------------------

alter table public.module_translations
  add column if not exists is_provisional boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

-- The Scrum rows have been live in production since 2026-07-08. Marking them
-- approved records THAT FACT -- it is not a claim that a reviewer signed them
-- off. If a formal review pass is wanted, run it and treat this line as the
-- starting state, not as evidence.
update public.module_translations
   set is_provisional = false
 where created_at < timestamptz '2026-07-27';

-- ---------------------------------------------------------------------------
-- 2. Invalidation: English moves -> translations declare themselves stale
-- ---------------------------------------------------------------------------

create or replace function public.invalidate_module_translations()
returns trigger
language plpgsql
as $$
begin
  if new.title is distinct from old.title
     or new.description is distinct from old.description then
    update public.module_translations
       set is_provisional = true
     where module_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_invalidate_module_translations on public.modules;

create trigger trg_invalidate_module_translations
after update on public.modules
for each row
execute function public.invalidate_module_translations();

-- ---------------------------------------------------------------------------
-- 3. updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function public.touch_module_translations()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_module_translations on public.module_translations;

create trigger trg_touch_module_translations
before update on public.module_translations
for each row
execute function public.touch_module_translations();

-- ---------------------------------------------------------------------------
-- 4. Coverage view -- the signal that was missing
-- ---------------------------------------------------------------------------

create or replace view public.v_module_i18n_coverage
with (security_invoker = true)
as
select c.code                                                              as certification_code,
       c.id                                                                as certification_id,
       count(distinct m.id)                                                as modules,
       count(distinct mt.module_id) filter (where mt.language = 'es-419')   as es_419,
       count(distinct mt.module_id) filter (where mt.language = 'pt-BR')    as pt_br,
       count(*) filter (where mt.is_provisional)                            as provisional_rows
  from public.modules m
  join public.certifications c on c.id = m.certification_id
  left join public.module_translations mt on mt.module_id = m.id
 group by c.code, c.id;

-- RLS is not a grant. The grant is checked before RLS and a missing one is a
-- swallowed 42501 that a failure-tolerant loader turns into an empty result.
grant select on public.v_module_i18n_coverage to authenticated;

commit;

-- ---------------------------------------------------------------------------
-- Verification (run separately -- the SQL editor returns only the last result)
-- ---------------------------------------------------------------------------
--
-- select * from public.v_module_i18n_coverage order by certification_code;
--
-- Expect, before the loader runs:
--   AIE-I 3/0/0 · AIGRM-I 5/0/0 · AIHR-I 4/0/0 · AISM-I 6/0/0
--   SD-AI-I 5/5/5 · SM-AI-I 5/5/5 · SPO-AI-I 5/5/5, provisional_rows = 0
--
-- select event_object_table, trigger_name
--   from information_schema.triggers
--  where event_object_table in ('modules', 'module_translations');
--
-- Expect two rows.
