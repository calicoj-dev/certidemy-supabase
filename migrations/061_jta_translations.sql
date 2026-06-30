-- 061_jta_translations.sql
-- =============================================================================
-- JTA translations — sibling overlay tables for the Job Task Analysis.
-- -----------------------------------------------------------------------------
-- The blueprint/JTA (domain titles + descriptions, task statements) renders in
-- English on every surface (in-app Blueprint, marketing drawer, verify modal)
-- because domains/tasks have no language dimension. These two tables add one,
-- WITHOUT duplicating the language-neutral structure (codes, weights,
-- order_index, FKs, the AI-Era concept links — all stored once in the base
-- tables).
--
-- CERT-AGNOSTIC BY DESIGN: translations hang off each cert's own domains/tasks
-- rows. The moment any current or future cert (SD-AI-I, …) has JTA rows, it is
-- covered — no per-cert schema. One migration provisions every cert.
--
-- ENGLISH IS THE SOURCE OF TRUTH: these tables hold ONLY non-English overlays.
-- The CHECK forbids 'en', so the canonical English text lives in exactly one
-- place (domains.title / tasks.statement) and can never drift.
--
-- is_provisional: every machine-translated row starts provisional (true) and is
-- flipped to false after a human/SME review — the same honesty rule as cut
-- scores. The render layer falls back to English per string regardless.
--
-- RLS mirrors domains/tasks: public (anon + authenticated) read, admin write.
-- Editor-first: run this in the Supabase SQL editor; the committed file is the
-- versioned record.
-- =============================================================================

create table if not exists public.domain_translations (
  id             uuid primary key default gen_random_uuid(),
  domain_id      uuid not null references public.domains(id) on delete cascade,
  language       text not null check (language in ('es-419', 'pt-BR')),
  title          text not null,
  description    text,
  is_provisional boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (domain_id, language)
);

create table if not exists public.task_translations (
  id             uuid primary key default gen_random_uuid(),
  task_id        uuid not null references public.tasks(id) on delete cascade,
  language       text not null check (language in ('es-419', 'pt-BR')),
  statement      text not null,
  is_provisional boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (task_id, language)
);

alter table public.domain_translations enable row level security;
alter table public.task_translations  enable row level security;

-- Read: public, same audience as the base JTA rows (non-sensitive).
drop policy if exists "domain_translations public read" on public.domain_translations;
create policy "domain_translations public read"
  on public.domain_translations for select
  to anon, authenticated
  using (true);

drop policy if exists "task_translations public read" on public.task_translations;
create policy "task_translations public read"
  on public.task_translations for select
  to anon, authenticated
  using (true);

-- Write: platform admins only (matches domains/tasks). The generator uses the
-- service role, which bypasses RLS.
drop policy if exists "domain_translations admin write" on public.domain_translations;
create policy "domain_translations admin write"
  on public.domain_translations for all
  to public
  using (is_platform_admin());

drop policy if exists "task_translations admin write" on public.task_translations;
create policy "task_translations admin write"
  on public.task_translations for all
  to public
  using (is_platform_admin());

grant select on public.domain_translations to anon, authenticated;
grant select on public.task_translations  to anon, authenticated;
grant all    on public.domain_translations to service_role;
grant all    on public.task_translations  to service_role;
