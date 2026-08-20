-- 238_badge_storage.sql
--
-- Storage for partner badge artwork, and the constraint that keeps it ours.
--
-- ============================ WHY PUBLIC ==================================
--
-- certificates and sales-assets are private and correctly so: a certificate is
-- one person's document.
--
-- A badge is the opposite. It is referenced by `image.id` INSIDE the signed
-- credential, it is meant to be posted on LinkedIn, and every consuming
-- platform loads it anonymously. A signed URL cannot appear in a signed
-- document -- it expires, and the credential does not.
--
-- ============================ WHY image_path IS CONSTRAINED ===============
--
-- achievements.image_path is emitted as `image.id` and ?doc=baked will FETCH
-- it. If a partner could put an arbitrary URL there, open-badge becomes a
-- request proxy pointed wherever they like -- the same shape as the webhook
-- SSRF in 236, in a second place.
--
-- So the column may only hold a URL under this project's public badges bucket.
-- A partner uploads artwork; they do not get to name a host. NULL stays valid
-- and means "no artwork", which the builder already handles by omitting the
-- property entirely rather than emitting a link that 404s.
--
-- ============================ SIZE ========================================
--
-- 512 KB, PNG or SVG. The existing badges are 501x501 PNGs that must stay
-- legible at 60px; nothing meeting that brief is close to half a megabyte, and
-- the limit exists so a partner cannot park a 40 MB render in a bucket that
-- gets fetched on every bake.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).

begin;

-- ============================================================ 1. the bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'badges', 'badges', true, 524288,
  array['image/png', 'image/svg+xml']
)
on conflict (id) do update
set public = true,
    file_size_limit = 524288,
    allowed_mime_types = array['image/png', 'image/svg+xml'];

-- ============================================================ 2. policies
-- Anonymous READ, because that is the whole point. Writes are service_role
-- only, which needs no policy: service_role bypasses RLS. A partner uploads
-- through an edge function that checks who they are; they never touch storage
-- directly.
drop policy if exists "badges are publicly readable" on storage.objects;
create policy "badges are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'badges');

-- ============================================================ 3. the guard
-- Matches the public object URL for THIS project's badges bucket and nothing
-- else. Hardcoded rather than derived: a project ref is not a runtime value and
-- a constraint that reads settings is a constraint that can be reconfigured.
alter table public.achievements drop constraint if exists achievements_image_path_own_storage;
alter table public.achievements add constraint achievements_image_path_own_storage
  check (
    image_path is null
    or (
      image_path ~ '^https://pctynukndxnmnxiqpgck\.supabase\.co/storage/v1/object/public/badges/[A-Za-z0-9._/-]{1,200}$'
      -- No traversal. Storage would probably normalise "../" away, and
      -- "probably" is not a property a constraint should rest on: the whole
      -- point of this check is that it holds without knowing how the thing
      -- downstream behaves.
      and position('..' in image_path) = 0
      and position('//' in substring(image_path from 9)) = 0
    )
  );

comment on column public.achievements.image_path is
  'Public URL of the badge artwork in the badges bucket, or NULL for none. Constrained to our own storage because this value is emitted as image.id AND fetched by ?doc=baked -- an arbitrary URL here would make open-badge a request proxy.';

commit;

-- Verification (run separately, one at a time):
--
--   select id, public, file_size_limit, allowed_mime_types
--   from storage.buckets where id = 'badges';
--   -- badges | true | 524288 | {image/png,image/svg+xml}
--
--   select policyname, roles, cmd from pg_policies
--   where schemaname = 'storage' and tablename = 'objects'
--     and policyname = 'badges are publicly readable';
--   -- one row, {public}, SELECT
--
-- Prove the guard bites. This MUST raise:
--
--   update public.achievements
--   set image_path = 'https://evil.example/badge.png'
--   where code = 'SCRUM-BOOTCAMP-2026-08';
--
-- And this MUST succeed:
--
--   update public.achievements
--   set image_path = 'https://pctynukndxnmnxiqpgck.supabase.co/storage/v1/object/public/badges/test-partner-02/scrum.png'
--   where code = 'SCRUM-BOOTCAMP-2026-08'
--   returning code, image_path;
--
-- NOTE: that second one points at an object that does not exist yet. The
-- Achievement document will carry the URL and it will 404 until something is
-- uploaded -- which is exactly the "broken image next to somebody's name"
-- failure the conditional emit in ob3.ts exists to avoid. Set it back to NULL
-- until real artwork is in the bucket:
--
--   update public.achievements set image_path = null
--   where code = 'SCRUM-BOOTCAMP-2026-08';
