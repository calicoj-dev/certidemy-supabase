-- 166_cert_names_drop_prefix_suffix.sql
--
-- EXECUTED IN THE SUPABASE SQL EDITOR. This file is the versioned record, not
-- the execution. Editor-first, per standing rule.
--
-- SAFE AS SQL: every target string is pure ASCII. Had the Scrum rows needed
-- editing this would have had to go through an API loader instead -- their
-- names carry an em-dash, and an em-dash pasted into the SQL editor is this
-- project's documented source of double-encoded UTF-8.
--
-- WHY
--   The four non-Scrum certs carried a "Certidemy " brand prefix and a " - AI"
--   suffix. The prefix is dead weight: stripBrand() has hidden it on the public
--   catalog since v2.3, but nothing strips it in the certificate renderer or in
--   a LinkedIn Add-to-Profile `name` field, where the issuer line already says
--   Certidemy. The suffix exists to distinguish "Scrum Master I - AI" from a
--   generic Scrum Master certification; appended to a cert already named for AI
--   it means nothing, and "AI Essentials I - AI" is redundant on its face.
--
--   Urgency: LinkedIn's Add-to-Profile flow writes `name` as a PERMANENT COPY
--   on the learner's profile. It is a form prefill, not a live link. Renaming
--   afterwards leaves every existing profile carrying the old string forever.
--   The naming had to settle before the first click.
--
-- BLAST RADIUS: none on issued credentials. `credentials` snapshots
--   certification_name / certification_code / expires_at at issuance rather
--   than joining live -- correct under ISO/IEC 17024 record retention, and
--   already built that way.
--
-- NOT TOUCHED: the Scrum three were already correct (no prefix, em-dash suffix).
--
-- Companion: 167 nulls the now-stale English names in certification_i18n.

begin;

update public.certifications set name = 'AI Essentials I'                    where code = 'AIE-I';
update public.certifications set name = 'AI Governance & Risk Management I'  where code = 'AIGRM-I';
update public.certifications set name = 'AI for Human Resources & Talent I'  where code = 'AIHR-I';
update public.certifications set name = 'AI Service Management I'            where code = 'AISM-I';

-- Verification. Expected: has_brand_prefix false on all seven,
-- has_ascii_suffix false on all seven, has_emdash_suffix true on exactly the
-- three scrum rows. A false on a Scrum row means the em-dash in the DB is not
-- U+2014 -- stop, do not commit.
select code, name,
       (name ~ '^Certidemy ')     as has_brand_prefix,
       (name ~ ' - AI$')          as has_ascii_suffix,
       (name ~ ' — AI$')          as has_emdash_suffix
from public.certifications
order by category_slug, sort_order;

commit;
