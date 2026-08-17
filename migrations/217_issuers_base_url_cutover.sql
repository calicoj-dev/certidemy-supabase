-- 217_issuers_base_url_cutover.sql
--
-- Moves the OB3 identifier namespace to credentials.certidemy.com.
--
-- APPLIED EDITOR-FIRST. This file is the record.
--
-- PRECONDITION, NOT OPTIONAL: credentials.certidemy.com must already serve all
-- four identifier paths anonymously, with content-type application/vc+ld+json,
-- and pass JSON-LD safe mode. open-badge rebuilds and re-signs documents on
-- every fetch -- nothing is frozen server-side -- so this UPDATE is live for
-- every holder the instant it commits. Running it before the host existed would
-- make every credential name an unresolvable issuer.
--
-- Verified before running: certidemy-credentials Worker deployed, custom domain
-- bound, all four documents 200 + safe-mode PASS.
--
-- Verified after running: identifiers (credential id, issuer id, achievement id,
-- status list, proof.verificationMethod) all on credentials.certidemy.com;
-- human surfaces (badge PNG, criteria page, verify URL, issuer Profile `url`)
-- all still on certidemy.com. proof.verificationMethod matches the issuer
-- document's verificationMethod[0].id character for character -- the pair that
-- must agree or nothing verifies.
--
-- site_url is deliberately NOT touched. Identifiers and human surfaces are
-- different jobs and now live on different hosts.
--
-- ACCEPTED COST: a .jsonld downloaded before this migration names
-- certidemy.com/issuers/certidemy in proof.verificationMethod. The legacy path
-- now 301s to the new identifier, so a redirect-following verifier reaches a
-- valid document -- but its id differs from the one the frozen copy names, and
-- a strict verifier rejects that mismatch. One credential existed at cutover,
-- held by one customer, who was told to re-download. A `base` override in
-- open-badge was designed and rejected: it would have kept both namespaces
-- working forever at the cost of a permanent legacy branch nobody would
-- remember the reason for.
--
-- issuer_url is kept in sync but has NO live readers -- grepped across both
-- repos at cutover, zero hits outside the select list and a doc comment.
-- issuerUrl() in _shared/ob3.ts computes it from base_url + slug. The column
-- remains because it is UNIQUE NOT NULL from migration 185 and records what a
-- given issuer's identifier is.

update public.issuers
set base_url   = 'https://credentials.certidemy.com',
    issuer_url = 'https://credentials.certidemy.com/issuers/' || slug,
    updated_at = now()
where slug = 'certidemy';