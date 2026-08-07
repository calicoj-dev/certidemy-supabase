-- 180_cert_names_with_edition_year.sql
-- Two changes to two live-ish certs, both pure ASCII so the editor is safe.
--
-- 1. EDITION YEARS IN THE PRODUCT NAME.
--    "ISO/IEC 27001 Foundation" and "ISO/IEC 42001 Foundation" do not say which
--    edition. Both standards have current editions that matter to a buyer:
--    27001:2022 (with Amendment 1:2024) and 42001:2023. A credential that names
--    the standard without the year is ambiguous the moment a new edition lands,
--    and this catalogue already teaches candidates to be precise about exactly
--    that. The badge artwork carries the years; the database should agree.
--
--    NOTE the spacing. The badge renders "FOUNDATION -AI" for layout reasons.
--    The database keeps "Foundation - AI" with spaces, which is correct prose.
--    Artwork and data do not have to match on typography, only on substance.
--
-- 2. AIMS-F HAS NO ENGLISH CLAIM.
--    certification_i18n.claim is NULL for AIMS-F/en. es-419 and pt-BR both have
--    one, because load-cert-i18n.mjs writes those two languages; English claims
--    came from migration 113's lineage and AIMS-F was never added. The claim is
--    the 17024 competence statement - the sentence the credential asserts - and
--    shipping without it is not an option. The text below is the English source
--    the two translations were made from.
--
-- NOT CHANGED, DELIBERATELY:
--   - jta_versions.blueprint_snapshot embeds the old name for both certs. That
--     is a point-in-time record of what was true when v2.0 was projected, and
--     exam_attempts.jta_version_id points at it for traceability. The product
--     name is not part of what a candidate was assessed on. Leave history alone.
--   - certification_i18n.name stays NULL in all six rows. Cert names are product
--     identifiers and fall back to certifications.name by design.
--   - The ISMS-F English description mentions "ISO/IEC 27001 Foundation" as
--     prose, not as the product name. It reads correctly without the year.

begin;

-- 1. edition years
update public.certifications
set name = 'ISO/IEC 27001:2022 Foundation - AI', updated_at = now()
where code = 'ISMS-F';

update public.certifications
set name = 'ISO/IEC 42001:2023 Foundation', updated_at = now()
where code = 'AIMS-F';

-- 2. the missing English claim
update public.certification_i18n ci
set claim = 'Validates Foundation-level command of ISO/IEC 42001 and the judgement to implement it alongside an existing information security management system.',
    updated_at = now()
from public.certifications c
where c.id = ci.certification_id
  and c.code = 'AIMS-F'
  and ci.lang = 'en';

commit;

-- ============================================================
-- VERIFICATION (run separately)
-- ============================================================
-- select code, name from public.certifications
-- where code in ('AIMS-F','ISMS-F') order by code;
-- EXPECT: ISO/IEC 42001:2023 Foundation
--         ISO/IEC 27001:2022 Foundation - AI
--
-- select c.code, ci.lang, ci.claim is not null as has_claim
-- from public.certification_i18n ci
-- join public.certifications c on c.id = ci.certification_id
-- where c.code in ('AIMS-F','ISMS-F') order by c.code, ci.lang;
-- EXPECT: true on all six rows
