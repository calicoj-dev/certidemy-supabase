-- 113_certification_i18n.sql
--
-- Per-language marketing copy for certifications.
--
-- WHY: /es-419/ and /pt-BR/ were rendering English cert names and descriptions,
-- on a platform whose market is LATAM. certifications.name/description are
-- single-language columns, so there was nowhere for a translation to live.
--
-- THREE FIELDS, DELIBERATELY:
--   name        - the cert title as shown to that language's reader
--   claim       - ONE short scope sentence, the catalog's whole copy budget
--   description - the long-form paragraph for the cert detail page
--
-- `claim` is a SCOPE STATEMENT under ISO/IEC 17024, not a tagline. It is bound
-- to the cert's JTA, not to its marketing description, and it is the sentence a
-- buyer or an assessor will hold you to. Every claim opens with "Validates" so
-- the catalog column scans as a set and the form itself signals what these are.
-- Marketing copy may expand on a claim; it must never contradict or exceed it.
-- The locked claim also belongs in each SCHEME-<CODE>.md.
--
-- FALLBACK, NOT REPLACEMENT: certifications.name/description stay as the
-- canonical English source. Loaders left-join this table and fall back to the
-- base columns, so a missing translation degrades to English rather than to a
-- blank page. That also means seeding a new language is additive and can never
-- break an existing one.
--
-- ASCII ONLY: pasted into the Supabase SQL editor, the known source of
-- double-encoded UTF-8 in this project. No em-dashes, no smart quotes, and no
-- accented characters - which is why only the English rows are seeded here.
-- es-419 and pt-BR rows carry accents and MUST be loaded through an API-based
-- loader script, never through the editor.
--
-- Idempotent: create-if-not-exists throughout, seed uses on-conflict-do-update.

create table if not exists public.certification_i18n (
  certification_id uuid not null
    references public.certifications(id) on delete cascade,
  lang text not null,
  name text,
  claim text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (certification_id, lang),
  constraint certification_i18n_lang_check
    check (lang in ('en', 'es-419', 'pt-BR'))
);

comment on table public.certification_i18n is
  'Per-language cert copy. Falls back to certifications.name/description when a row is absent.';
comment on column public.certification_i18n.claim is
  'One-sentence ISO/IEC 17024 scope statement. Bound to the JTA. Opens with "Validates".';

-- RLS. Catalog copy is public by definition - it is what anonymous visitors
-- read on the marketing pages.
alter table public.certification_i18n enable row level security;

drop policy if exists "catalog read certification_i18n" on public.certification_i18n;
create policy "catalog read certification_i18n"
  on public.certification_i18n
  for select
  to anon, authenticated
  using (true);

-- RLS IS NOT A GRANT. The table-level grant is checked BEFORE the policy; without
-- it every read fails with a silent 42501 that failure-tolerant loaders swallow.
grant select on public.certification_i18n to anon, authenticated;

-- English back-seed. name/description come from the existing canonical columns
-- so this table is never a second source of truth for English prose; only the
-- claim is new, and it is authored here.
insert into public.certification_i18n (certification_id, lang, name, claim, description)
select
  c.id,
  'en',
  c.name,
  v.claim,
  c.description
from public.certifications c
join (values
  ('SM-AI-I',
   'Validates the craft of making Scrum work in AI-augmented teams.'),
  ('SPO-AI-I',
   'Validates agile product ownership when AI reshapes backlog, value, and roadmap.'),
  ('SD-AI-I',
   'Validates the engineering craft of building and verifying an Increment with AI in the loop.'),
  ('AIGRM-I',
   'Validates that the holder can establish and maintain organizational AI governance, risk, and control.'),
  ('AISM-I',
   'Validates that the holder can operate and assure AI-enabled services in production.'),
  ('AIE-I',
   'Validates that the holder can use everyday AI tools safely and with sound judgment.')
) as v(code, claim) on v.code = c.code
on conflict (certification_id, lang) do update
  set name        = excluded.name,
      claim       = excluded.claim,
      description = excluded.description,
      updated_at  = now();

-- Verify: expect 6 rows, every claim non-null, every claim starting with Validates.
--   select c.code, i.lang, left(i.claim, 60) as claim
--     from public.certification_i18n i
--     join public.certifications c on c.id = i.certification_id
--    where i.lang = 'en'
--    order by c.code;
--
--   select count(*) as should_be_zero
--     from public.certification_i18n
--    where lang = 'en' and (claim is null or claim not like 'Validates%');
