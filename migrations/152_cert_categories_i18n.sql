-- 152_cert_categories_i18n.sql
-- Family (category) taglines are not translatable: public.cert_categories has
-- slug / label / tagline / sort_order and no language dimension, so the catalogue
-- renders the English tagline under a Spanish or Portuguese heading. The cert
-- claims beneath it translate; the family line above them does not.
--
-- This adds the missing table, mirroring certification_i18n.
--
-- SCOPE: tagline only.
--   * `label` is NOT translated and is not stored here. Family names are product
--     identifiers - "Scrum" and "AI Workplace" stay as they are, the same reason
--     certification_i18n.name is left NULL. The app falls back to
--     cert_categories.label always.
--   * the certification COUNT ("3 CERTIFICACIONES") is UI chrome and already
--     translates from the app i18n JSON. Nothing to do there.
--
-- English rows are seeded by SELECTING from cert_categories rather than being
-- retyped, so the strings cannot drift from their source and no transcription
-- error is possible. es-419 and pt-BR carry accented characters and load through
-- certidemy-web/scripts/load-cat-i18n.mjs over the API - never the SQL editor.
--
-- Safe to run before the app patch: nothing reads this table yet, and the patch
-- falls back to cert_categories.tagline when a row is missing.
--
-- Editor-first. Idempotent. ASCII-only by construction.

begin;

create table if not exists public.cert_categories_i18n (
  slug        text not null references public.cert_categories(slug) on delete cascade,
  lang        text not null,
  tagline     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (slug, lang)
);

comment on table public.cert_categories_i18n is
  'Per-language family taglines. label is deliberately absent: family names are product identifiers and are not translated.';

-- Read-only to clients, matching certification_i18n. Writes go through the
-- service role from the loader script.
alter table public.cert_categories_i18n enable row level security;

drop policy if exists cert_categories_i18n_read on public.cert_categories_i18n;
create policy cert_categories_i18n_read
  on public.cert_categories_i18n
  for select
  to anon, authenticated
  using (true);

grant select on public.cert_categories_i18n to anon, authenticated;

-- Seed English from the source rows. No retyping: whatever cert_categories
-- holds today is what lands here, so the two can never disagree.
insert into public.cert_categories_i18n (slug, lang, tagline)
select c.slug, 'en', c.tagline
from public.cert_categories c
where c.tagline is not null
on conflict (slug, lang) do update set
  tagline    = excluded.tagline,
  updated_at = now();

commit;

-- ============================================================
-- VERIFICATION
-- ============================================================
-- English rows should match cert_categories exactly (expect 0 rows):
--
-- select c.slug, c.tagline as source, i.tagline as i18n
--   from public.cert_categories c
--   join public.cert_categories_i18n i on i.slug = c.slug and i.lang = 'en'
--  where c.tagline is distinct from i.tagline;
--
-- Coverage per language (en now, all three after the loader runs):
--
-- select lang, count(*) from public.cert_categories_i18n group by lang order by lang;
--
-- What the catalogue will render once patched:
--
-- select c.slug, c.label, i.lang, i.tagline
--   from public.cert_categories c
--   left join public.cert_categories_i18n i on i.slug = c.slug
--  order by c.sort_order, i.lang;
