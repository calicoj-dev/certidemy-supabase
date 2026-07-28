-- 159_sales_assets_bucket.sql
--
-- Private storage bucket for generated sales-library assets.
--
-- Private, not public: client-safe assets reach prospects through short-lived
-- signed URLs issued by render-asset, never by guessing an object path. The
-- public-route work in SALES-LIBRARY-SPEC §9 is a separate endpoint that still
-- signs; it does not make this bucket world-readable.
--
-- Mirrors the `certificates` bucket, which has worked under exactly this
-- pattern since the first credential shipped.
--
-- Object paths are deterministic and content-versioned:
--   factsheet/<CERT_CODE>/<lang>/<content_version>.pdf
-- so a changed row produces a new path and the old object is simply never
-- requested again. No invalidation step, no stale-cache class of bug.

begin;

insert into storage.buckets (id, name, public)
values ('sales-assets', 'sales-assets', false)
on conflict (id) do nothing;

commit;

-- No RLS policies on storage.objects for this bucket on purpose. Reads and
-- writes go through render-asset under the service role, which bypasses RLS.
-- Adding an authenticated-role policy here would create a second, unaudited
-- path to the same objects that skips the asset_downloads log.

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------
--
-- select id, name, public from storage.buckets where id = 'sales-assets';
--   Expect one row, public = false.
