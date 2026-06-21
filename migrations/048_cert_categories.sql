-- =====================================================================
-- 047_cert_categories.sql
-- Cert grouping: a `cert_categories` table holds each group's identity
-- (label, tagline, order) once; certifications gain category_slug + tier +
-- sort_order so the catalog / group pages / homepage render groups from DATA,
-- not a hardcoded list. Editor-first: run in the Supabase SQL editor; this
-- file is the versioned record. Idempotent — safe to re-run.
-- =====================================================================

-- 1. The groups table.
create table if not exists public.cert_categories (
  slug        text primary key,
  label       text not null,
  tagline     text,
  sort_order  smallint not null default 0
);

-- 2. Seed the core groups (upsert).
insert into public.cert_categories (slug, label, tagline, sort_order) values
  ('scrum',            'Certidemy Scrum',            'Agile delivery, role by role — Scrum Master, Product Owner, Developer.', 1),
  ('ai',               'Certidemy AI',               'AI-era skills woven into the work, not bolted on.',                      2),
  ('agile-frameworks', 'Certidemy Agile Frameworks', 'Beyond Scrum — the wider agile toolkit.',                               3)
on conflict (slug) do update
  set label = excluded.label, tagline = excluded.tagline, sort_order = excluded.sort_order;

-- 3. Grouping columns on certifications.
alter table public.certifications
  add column if not exists category_slug text,
  add column if not exists tier          smallint not null default 1,
  add column if not exists sort_order    smallint not null default 0;

-- 4. Foreign key (guarded so re-runs don't error).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'certifications_category_slug_fkey') then
    alter table public.certifications
      add constraint certifications_category_slug_fkey
      foreign key (category_slug) references public.cert_categories(slug)
      on update cascade on delete set null;
  end if;
end $$;

-- 5. File the two live certs under Scrum.
update public.certifications set category_slug='scrum', tier=1, sort_order=1 where code='SM-I';
update public.certifications set category_slug='scrum', tier=1, sort_order=2 where code='SPO-I';

-- 6. Verify (expect SM-I then SPO-I under "Certidemy Scrum").
-- select cc.label as group_label, c.code, c.name, c.tier, c.sort_order, c.is_published
-- from public.certifications c
-- left join public.cert_categories cc on cc.slug = c.category_slug
-- order by cc.sort_order nulls last, c.sort_order, c.code;
