-- 250_issuer_verification_method.sql
--
-- A second route to a verified issuer: out-of-band admin attestation, for an
-- issuer with no site to publish a well-known file on.
--
-- Editor-first: this ran live in the SQL editor on 2026-08-26, one statement at
-- a time. The file is the record of what already ran, not a script anyone
-- executes.
--
-- ============================ HOW THIS ONE IS VERIFIED ===================
--
-- 244, 245 and 249 recorded an md5 of prosrc, because what they recorded was a
-- FUNCTION BODY and the body is the thing that can drift. There is no function
-- here. The verifiable artefacts are the constraint definitions, so section 6
-- records what pg_get_constraintdef returned, verbatim, and those strings are
-- what a later reader compares against. Same discipline as 247 and 248,
-- different artefact -- writing "md5 verified" here would be borrowing the form
-- of a check that was never run.
--
-- ============================ WHAT THIS IS FOR ===========================
--
-- Activation requires domain control, proved by fetching
-- https://<domain>/.well-known/certidemy-issuer.txt. That excludes an issuer
-- with no site: a solo trainer running off a social profile who wants to issue
-- bootcamp completion badges.
--
-- ============================ A GATE CHANGE, NOT A CLAIMS CHANGE =========
--
-- verification_method is NOT DISPLAYED ANYWHERE, and that is the decision, not
-- an omission. It does not appear in:
--
--   the OB3 credential document   _shared/ob3.ts buildIssuerProfile() emits
--                                 id, type, name, url and the Multikey. The
--                                 Multikey is verificationMethod in the OB3
--                                 sense -- a cryptographic fact about the KEY,
--                                 not an organizational one about the issuer.
--   verify-credential             returns issuer_slug, issuer_name,
--                                 issuer_site_url. No status, no method.
--   the verify page               renders issuer_name linked to
--                                 issuer_site_url. Nothing else.
--   the certificate PDF           _shared/certificate.ts draws issuer_name.
--   the badge / OG card           credential-og does not reference the issuer
--                                 at all.
--
-- So there is no reader-facing claim to get wrong, and no DOC_VERSION bump, no
-- material_updated_at bump and no anchor rebuild -- none of the three things
-- that move together when a credential renderer changes.
--
-- THE DOMAIN CHECK NEVER DID READER-FACING WORK EITHER. It gates activation and
-- disappears. A domain-verified issuer is byte-identical, on every surface a
-- reader can reach, to one that was never verified. And Certidemy's own issuer
-- has verification_domain NULL and has signed every credential on the platform.
--
-- IT STAYS A GATE CHANGE ONLY AS LONG AS NOTHING DISPLAYS IT. The moment a
-- surface renders "Certidemy-verified", three things become load-bearing that
-- are currently only tidy: the wording falls under CLAIMS-POLICY, the self-host
-- rule in create-partner-issuer stops being hygiene and becomes the thing
-- keeping the claim true, and test-partner-02 (below) becomes a visible false
-- statement rather than a dormant one.
--
-- ============================ WHY A COLUMN, NOT A STATUS =================
--
-- issuer_status is draft -> verified -> active -> deactivated: a LIFECYCLE.
-- How an issuer was verified is orthogonal to where it sits in that lifecycle.
-- A fifth enum value would conflate the two axes and muddy what
-- issuers_active_requires_keys means.
--
-- ============================ THE PAIRING CONSTRAINTS ====================
--
-- Sections 2 and 3 put "an issuer with a domain verifies through it" in the
-- database rather than only in activate-partner-issuer, so the rule cannot
-- drift when either function is next edited.
--
-- The forcing they create is deliberate: an attested trainer who later acquires
-- a domain must set verification_method='domain' AND verification_domain in one
-- statement. Acquiring a domain should mean re-verifying through it, not
-- inheriting an attestation written before the domain existed.
--
-- ============================ test-partner-02 ============================
--
-- Backfilled to 'domain', which is factually the method used -- even though it
-- verified against credentials.certidemy.com, a host WE control, and therefore
-- proved nothing. History is not rewritten here: the circularity is a property
-- of that row, not of the domain method, and it is recorded in CLAUDE.md.
--
-- It is also why the self-host refusal is a check inside
-- create-partner-issuer and NOT a CHECK constraint on this table: a constraint
-- would fail to validate against this existing row.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. The column and its vocabulary.
-- ---------------------------------------------------------------------------

alter table public.issuers
  add column if not exists verification_method text;

alter table public.issuers drop constraint if exists issuers_verification_method_vocab;
alter table public.issuers add constraint issuers_verification_method_vocab
  check (verification_method is null
         or verification_method in ('domain','attested'));

-- ---------------------------------------------------------------------------
-- 2. A domain method needs a domain.
-- ---------------------------------------------------------------------------

alter table public.issuers drop constraint if exists issuers_method_matches_domain;
alter table public.issuers add constraint issuers_method_matches_domain
  check (verification_method is distinct from 'domain'
         or verification_domain is not null);

-- ---------------------------------------------------------------------------
-- 3. An attested issuer has no domain.
--
--    activate-partner-issuer mode='attest' refuses when a domain is present.
--    This is the same rule, one layer down, so a future edit to that function
--    cannot quietly allow it.
-- ---------------------------------------------------------------------------

alter table public.issuers drop constraint if exists issuers_attested_has_no_domain;
alter table public.issuers add constraint issuers_attested_has_no_domain
  check (verification_method is distinct from 'attested'
         or verification_domain is null);

-- ---------------------------------------------------------------------------
-- 4. Backfill.
--
--    Sections 2 and 3 are added BEFORE this deliberately. Every row had
--    verification_method null at that point, so both validated trivially, and
--    adding them first means this update cannot write a violating state.
--
--    verified_at is the honest predicate: it is set only by a verification that
--    actually happened. certidemy has it null -- migration 230 section 3
--    promoted that row straight to 'active' because it predates the lifecycle
--    and was never a partner -- so it stays null here rather than being
--    retro-labelled as domain-verified.
-- ---------------------------------------------------------------------------

update public.issuers
set verification_method = 'domain'
where verified_at is not null
  and verification_method is null;
-- OBSERVED: UPDATE 1 (test-partner-02).

-- ---------------------------------------------------------------------------
-- 5. Grant.
--
--    Additive column grant rather than re-listing the eighteen columns in
--    migration 239 section 2. Column grants accumulate, so this is equivalent
--    and cannot mistype an existing column out of existence.
--
--    239's own header says it: "A new column on any of these tables is NOT
--    readable until somebody adds it here, which is the correct default."
--    This is that step. The issuers_console_read policy is row-level and needs
--    no change.
-- ---------------------------------------------------------------------------

grant select (verification_method) on public.issuers to authenticated;

-- ---------------------------------------------------------------------------
-- 5b. Clear the Durgical draft's domain, so it can take the attested route.
--
--     Durgical was created through the console form, which requires a
--     verification_domain, so the row carried 'durgical.com' and a token. There
--     is no intention to publish a file there. mode='attest' refuses an issuer
--     that has a domain -- correctly, since an issuer with a domain verifies
--     through it -- so the domain has to go before it can be attested.
--
--     The token goes with it. Both null or both set: a token nothing can
--     publish and no code path can consume is dead data implying an
--     expectation that does not exist.
--
--     THE FOUR GUARDS MATCH CODE SHAPES, NOT A SLUG. Whatever slug is typed on
--     the first line, this statement cannot touch an issuer that has signed
--     anything:
--
--       status = 'draft'          an active or verified issuer is out of scope
--       vault_secret_id is null   no signing key exists, so nothing it ever
--                                 signed can depend on this row
--       verified_at is null       cannot silently unpick a verification that
--                                 already completed
--       slug = 'durgical'         the intent, and the weakest of the four
--
--     Verified before running: draft, no vault secret, no public key,
--     0 achievements, 0 credentials, 0 issuer_api_keys.
-- ---------------------------------------------------------------------------

update public.issuers
set verification_domain = null,
    verification_token  = null,
    updated_at          = now()
where slug = 'durgical'
  and status = 'draft'
  and vault_secret_id is null
  and verified_at is null;
-- OBSERVED: UPDATE 1.

-- ---------------------------------------------------------------------------
-- 6. Verification. Observed live 2026-08-26 after the statements above.
--    These strings ARE the record -- compare against them rather than against
--    the SQL in sections 1 to 3, which is what was typed, not what resulted.
-- ---------------------------------------------------------------------------

-- select conname, pg_get_constraintdef(oid), convalidated
-- from pg_constraint
-- where conrelid = 'public.issuers'::regclass and contype = 'c'
-- order by conname;
--
-- OBSERVED, verbatim (all convalidated true):
--
--   issuers_active_requires_keys
--     CHECK (((status <> 'active'::issuer_status) OR ((vault_secret_id IS NOT NULL) AND (public_key_multibase IS NOT NULL) AND (key_id IS NOT NULL))))
--
--   issuers_attested_has_no_domain
--     CHECK (((verification_method IS DISTINCT FROM 'attested'::text) OR (verification_domain IS NULL)))
--
--   issuers_method_matches_domain
--     CHECK (((verification_method IS DISTINCT FROM 'domain'::text) OR (verification_domain IS NOT NULL)))
--
--   issuers_slug_format
--     CHECK ((slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'::text))
--
--   issuers_verification_method_vocab
--     CHECK (((verification_method IS NULL) OR (verification_method = ANY (ARRAY['domain'::text, 'attested'::text]))))
--
--   (issuers_active_requires_keys and issuers_slug_format are pre-existing,
--    from migration 230, and are recorded here so the whole CHECK surface of
--    this table is in one place.)

-- select slug, status, verification_domain, verification_method,
--        verification_token is not null as has_token
-- from public.issuers order by created_at;
--
-- OBSERVED:
--   certidemy        active  null                       null    false
--   test-partner-02  active  credentials.certidemy.com  domain  true
--   durgical         draft   null                       null    false

-- -- The invariant, as a property rather than a count. Zero rows is the pass.
-- select slug from public.issuers
-- where (verification_method = 'domain'   and verification_domain is null)
--    or (verification_method = 'attested' and verification_domain is not null);
-- OBSERVED: 0 rows.

-- ---------------------------------------------------------------------------
-- 7. What changed above the database, deployed 2026-08-26.
--
--    create-partner-issuer
--      - verification_domain is optional. Absent -> the attested route.
--      - SELF_HOSTS refusal: certidemy.com and certiglobal.org, exact match or
--        subdomain. This existed ONLY in the console modal, so a raw invocation
--        bypassed it -- which is how test-partner-02 came to be verified
--        against a host we control.
--      - verification_token is generated only when a domain is supplied.
--
--    activate-partner-issuer
--      - third mode, 'attest': platform_admin, status must be 'draft', reason
--        of at least 20 characters required and written to
--        admin_actions.reason (that row IS the verification record), refuses a
--        present verification_domain, does NOT call checkDomain.
--      - 'verify' now stamps verification_method='domain'.
--      - the 422 for a missing domain/token moved inside 'verify' and names
--        mode=attest as the alternative.
--      - activation's re-check of the domain is now conditional on there being
--        one. Deliberate asymmetry: a domain can change hands between
--        verification and activation, so it is re-proved at the irreversible
--        moment; re-reading an admin_actions row proves nothing that was not
--        already true when it was written.
--
--    MIRRORED PAIR, CURRENTLY OUT OF STEP:
--    ../certidemy-web/components/console/create-issuer-modal.tsx still refuses
--    only certidemy.com and still REQUIRES a domain. It is now the narrower
--    half. Fixing it is a web-session change.
-- ---------------------------------------------------------------------------
