-- 216_issuers_base_url.sql
--
-- Separates the OB3 IDENTIFIER namespace from the HUMAN site.
--
-- site_url has been doing two jobs. It builds the four identifier URLs (issuer
-- profile, achievement, status list, credential) AND the human surfaces (badge
-- PNGs, criteria pages, the verify page). Those are about to live on different
-- hosts: identifiers move to credentials.certidemy.com, human surfaces stay on
-- certidemy.com. One column cannot point at two hosts.
--
-- APPLIED EDITOR-FIRST. This file is the record.
--
-- DELIBERATELY INERT: base_url is backfilled to site_url, so every derived URL
-- is byte-identical to today. The cutover is a SEPARATE migration, run only
-- after credentials.certidemy.com serves all four paths anonymously and the old
-- paths 301. Flipping this before that host exists would make every issued
-- credential name an unresolvable issuer, and verification would fail for every
-- holder at once.

alter table public.issuers add column base_url text;

comment on column public.issuers.base_url is
  'Root of the OB3 identifier namespace: issuer profile, achievements, status lists, credentials. Distinct from site_url, which is the human/marketing host (badge PNGs, criteria pages, verify pages). Identical today; they diverge when credentials.certidemy.com goes live.';

update public.issuers set base_url = site_url where base_url is null;

alter table public.issuers alter column base_url set not null;