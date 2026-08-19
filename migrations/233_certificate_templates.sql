-- 233_certificate_templates.sql
-- The designer's storage layer.
--
-- WHAT THIS INVERTS
-- _shared/certificate.ts holds coordinates in code, translated by hand from an
-- 843x596 mockup against an A4 landscape page. A template holds the same
-- coordinates in a jsonb row, and the renderer becomes an interpreter walking
-- that array with the pdf-lib primitives that already exist. Same fonts, same
-- vector QR, same cert-art border paths.
--
-- VERSIONING IS LOAD-BEARING
-- Every cached artifact path needs a renderer version (learned twice: the
-- fact-sheet glyph boxes, then the certificate locale collision). A template
-- edit must bump template_version, and the cache key becomes
--   {credential_id}/v{RENDERER}/t{TEMPLATE_VERSION}/{locale}/certificate.pdf
-- regenerate-certificate is what makes an edit retroactive.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).

begin;

-- ============================================================ 1. branding
-- One row per issuer. Everything a partner can change without opening the
-- designer, so their first certificate looks right on day one.

create table if not exists public.issuer_branding (
  issuer_id          uuid primary key references public.issuers(id) on delete cascade,

  -- PNG with alpha or SVG. JPEG is rejected at upload: no transparency means a
  -- white box on a coloured certificate.
  logo_path          text,
  logo_width_pt      numeric,

  -- drawn signatures arrive as SVG path data and are drawn as pdf-lib path
  -- operations, exactly as cert-art.ts already draws the traced signature.
  -- uploaded signatures go the raster route because pdf-lib embeds PNG/JPG.
  signature_path     text,
  signature_svg_d    text,
  signature_name     text,
  signature_title    text,

  accent_color       text not null default '#be185d',
  border_color       text not null default '#be185d',

  -- badge template: shape + up to two fills + outline, rendered from SVG.
  -- A recoloured PNG cannot do this - see the "must read at 60px" brief.
  badge_shape        text not null default 'shield',
  badge_fill_primary text,
  badge_fill_secondary text,
  badge_outline_color text,

  updated_by         uuid references auth.users(id),
  updated_at         timestamptz not null default now(),
  created_at         timestamptz not null default now()
);

alter table public.issuer_branding drop constraint if exists issuer_branding_colors_hex;
alter table public.issuer_branding add constraint issuer_branding_colors_hex
  check (accent_color ~ '^#[0-9a-fA-F]{6}$' and border_color ~ '^#[0-9a-fA-F]{6}$');

alter table public.issuer_branding drop constraint if exists issuer_branding_badge_shape_vocab;
alter table public.issuer_branding add constraint issuer_branding_badge_shape_vocab
  check (badge_shape in ('shield','circle','hexagon','rosette','none'));

-- ============================================================ 2. templates

create table if not exists public.certificate_templates (
  id               uuid primary key default gen_random_uuid(),
  issuer_id        uuid not null references public.issuers(id) on delete cascade,
  name             text not null,

  -- A4 landscape in points, matching the current renderer exactly.
  page_width_pt    numeric not null default 841.89,
  page_height_pt   numeric not null default 595.28,
  orientation      text not null default 'landscape',

  -- the element array. See the shape contract at the foot of this file.
  layout           jsonb not null default '[]'::jsonb,

  -- bumped on every save. Part of the PDF cache key.
  template_version integer not null default 1,

  is_default       boolean not null default false,
  status           text not null default 'draft',

  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists certificate_templates_issuer_idx
  on public.certificate_templates(issuer_id);

create unique index if not exists certificate_templates_one_default
  on public.certificate_templates(issuer_id) where is_default;

alter table public.certificate_templates drop constraint if exists certificate_templates_status_vocab;
alter table public.certificate_templates add constraint certificate_templates_status_vocab
  check (status in ('draft','active','archived'));

alter table public.certificate_templates drop constraint if exists certificate_templates_orientation_vocab;
alter table public.certificate_templates add constraint certificate_templates_orientation_vocab
  check (orientation in ('landscape','portrait'));

alter table public.certificate_templates drop constraint if exists certificate_templates_layout_is_array;
alter table public.certificate_templates add constraint certificate_templates_layout_is_array
  check (jsonb_typeof(layout) = 'array');

-- Any change to geometry bumps the version. Renaming does not.
create or replace function public.bump_template_version()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and (
       new.layout        is distinct from old.layout
    or new.page_width_pt is distinct from old.page_width_pt
    or new.page_height_pt is distinct from old.page_height_pt
    or new.orientation   is distinct from old.orientation
  ) then
    new.template_version := old.template_version + 1;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_bump_template_version on public.certificate_templates;
create trigger trg_bump_template_version
  before update on public.certificate_templates
  for each row execute function public.bump_template_version();

-- ============================================================ 3. wiring

alter table public.achievements
  add column if not exists certificate_template_id uuid
    references public.certificate_templates(id) on delete set null;

-- Which template a credential was rendered against. Frozen at mint so a
-- reissued PDF years later is reproducible.
alter table public.credentials
  add column if not exists certificate_template_id uuid
    references public.certificate_templates(id) on delete set null,
  add column if not exists template_version_at_issue integer;

commit;

-- ============================================================ layout contract
--
-- layout is an array of elements. The renderer walks it in order; later
-- elements paint over earlier ones (pdf-lib paints in call order, which is why
-- the specimen band works).
--
-- {
--   "id":      "holder_name",
--   "type":    "text" | "image" | "qr" | "line" | "rect" | "signature",
--   "x": 420.9, "y": 300.0,            -- points, origin bottom-left (pdf-lib)
--   "w": 600.0, "h": 60.0,
--   "align":   "left" | "center" | "right",
--   "binding": "holder_name",          -- or null for a literal
--   "text":    "Se certifica que",     -- used when binding is null
--   "font":    "Inter-Bold",
--   "size":    46,
--   "size_min": 22,                    -- REQUIRED on auto-shrink fields
--   "color":   "#111111",
--   "locked":  true,                   -- cannot be deleted in the designer
--   "hide_when_empty": true
-- }
--
-- BINDINGS
--   holder_name  achievement_name  achievement_code  display_id
--   issued_at    expires_at        issuer_name       verify_url
--   qr           badge             logo              signature
--   score_pct    result_value
--
-- RULES THE DESIGNER MUST ENFORCE
--
-- 1. locked:true on holder_name, achievement_name and qr. A certificate without
--    the verify QR is not a verifiable certificate.
--
-- 2. size_min is REQUIRED wherever text can overflow. The current renderer
--    shrinks holder_name 46->22pt and the certification name 26->14pt. A
--    designer that captures only "size" produces a template that breaks on the
--    first long Brazilian name.
--
-- 3. Field visibility DERIVES FROM DATA, never from a manual toggle.
--    hide_when_empty is the mechanism: no expires_at on the credential and the
--    EXPIRES block does not render. A toggle can lie, and a certificate
--    printing no expiry against a credential that has one is a document
--    contradicting its own OB3.
--
-- 4. The preview needs a locale switch. es-419 runs roughly 20 percent longer
--    than English. Templates get designed in English and break in Portuguese
--    unless the designer shows the worst case.
--
-- 5. Font metrics: a CSS preview approximates. The true preview is a real
--    server render. Label the canvas honestly rather than shipping a preview
--    that lies about wrapping.
--
-- 6. QR quiet zone is not optional - 4 modules clear. The first build of the
--    current certificate used border:0 and the frame sat inside it.
--
-- Verification (run separately):
--
--   select table_name from information_schema.tables
--   where table_schema='public'
--     and table_name in ('issuer_branding','certificate_templates') order by 1;
--   -- expect 2 rows
--
--   insert into public.certificate_templates (issuer_id, name)
--   select id, 'guard test' from public.issuers where slug='certidemy';
--
--   update public.certificate_templates
--   set layout = '[{"id":"x","type":"text"}]'::jsonb where name='guard test';
--
--   select name, template_version from public.certificate_templates where name='guard test';
--   -- MUST show template_version = 2. A 1 here means the trigger did not attach.
--
--   delete from public.certificate_templates where name='guard test';
