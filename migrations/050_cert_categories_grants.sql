-- =====================================================================
-- 050_cert_categories_grants.sql
-- cert_categories had RLS + policies (048/049) but NO base table GRANT, so the
-- anon role was rejected at the privilege gate BEFORE RLS ever ran:
--   ERROR 42501: permission denied for table cert_categories
-- Postgres has two gates: table GRANT ("may this role touch the table") runs
-- first, RLS ("which rows") second. We had the second, not the first. This
-- grants base read to the public-facing roles so the grouped catalog renders.
-- Editor-first: run in the Supabase SQL editor; this file is the record.
-- Idempotent — GRANT is naturally repeatable.
--
-- LESSON (the other half of 048's): a new public table needs BOTH its RLS
-- policy AND its base grants in the migration that creates it.
-- =====================================================================

grant select on public.cert_categories to anon, authenticated;
