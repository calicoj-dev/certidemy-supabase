-- 151_aihr_i_cert_i18n_en.sql
-- English scope claim for AIHR-I in public.certification_i18n.
--
-- Follows the convention set by migration 113: English is ASCII and therefore
-- safe to seed through the SQL editor; es-419 and pt-BR carry accented
-- characters and load through certidemy-web/scripts/load-cert-i18n.mjs over the
-- API, which cannot double-encode them.
--
-- SCOPE: claim only.
--   * `name` stays NULL. Cert names are product identifiers and are not
--     translated; NULL makes the loader fall back to certifications.name.
--   * `description` stays NULL until the long-form translation pass. The
--     catalogue reads `claim`, so this alone renders the card.
--
-- THE CLAIM IS A SCOPE STATEMENT, NOT MARKETING COPY. It is bound to the locked
-- JTA (AIHR-I_JTA_v2.0.md) and is what a buyer or an assessor holds Certidemy
-- to. It opens with "Validates" to preserve the parallel form across the
-- catalogue. Do not loosen it into something punchier without re-reading the
-- JTA.
--
-- Editor-first. Idempotent. ASCII-only by construction.

begin;

insert into public.certification_i18n (certification_id, lang, name, claim, description)
values (
  '77777777-7777-7777-7777-777777777777',
  'en',
  'Certidemy AI for Human Resources & Talent I',
  'Validates the judgment to use AI in employment decisions without creating legal exposure.',
  null
)
on conflict (certification_id, lang) do update set
  name        = excluded.name,
  claim       = excluded.claim,
  updated_at  = now();

commit;

-- ============================================================
-- VERIFICATION
-- ============================================================
-- Expect one AIHR-I row, en, claim populated, description null:
--
-- select c.code, i.lang, i.name, i.claim, i.description
--   from public.certification_i18n i
--   join public.certifications c on c.id = i.certification_id
--  where c.code = 'AIHR-I' order by i.lang;
--
-- Compare register against the catalogue's existing claims:
--
-- select c.code, i.lang, i.claim
--   from public.certification_i18n i
--   join public.certifications c on c.id = i.certification_id
--  where i.lang = 'en' order by c.sort_order, c.code;
--
-- After running load-cert-i18n.mjs, AIHR-I should show three rows (en, es-419,
-- pt-BR), each with a claim, and the catalogue card should render in all three
-- languages.
