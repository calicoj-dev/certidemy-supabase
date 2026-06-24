-- 053_rename_certs_ai_and_expiry.sql
--
-- (1) Rebrand both live certs onto the AI line. The "AI" in the name is a
--     competitive differentiator against non-AI Scrum certs (PSM I, SMPC) —
--     these certs weave AI through every domain AND test it (see migration 052),
--     so the credential criteria back the name.
--       code  SM-I  -> SM-AI-I    name -> "Scrum Master I — AI"
--       code  SPO-I -> SPO-AI-I   name -> "Scrum Product Owner I — AI"
--     "Certidemy" is dropped from the name (issuer rides on provider + the
--     forthcoming badge); the name reads clean on a résumé.
--
--     The mint path (score-mock-exam) freezes certification_name/_code onto each
--     credential at issuance, so every FUTURE credential picks up the new
--     strings automatically. Already-issued credentials keep their frozen
--     values by design — EXCEPT the single pre-launch TEST credential, which we
--     re-stamp below so nothing carries stale strings into launch.
--
-- (2) 1-year credential expiry. AI-era coursework tracks a fast-moving field;
--     credentials expire 1 year after issuance (vs CertiProf's 3 / unlimited),
--     keeping the credential current and creating a recertification touchpoint.
--     The durable change is in score-mock-exam (sets expires_at at mint). Here
--     we backfill expires_at on any credential where it's null.
--
-- Editor-first; this is the record. Idempotent (guarded WHEREs).

-- ---------------------------------------------------------------------------
-- (1) Rename the cert rows
-- ---------------------------------------------------------------------------

update public.certifications
set code = 'SM-AI-I', name = 'Scrum Master I — AI'
where id = '11111111-1111-1111-1111-111111111111';

update public.certifications
set code = 'SPO-AI-I', name = 'Scrum Product Owner I — AI'
where id = '33333333-3333-3333-3333-333333333333';

-- ---------------------------------------------------------------------------
-- (1b) Re-stamp the pre-launch TEST credential(s) to the new frozen strings.
--      Scoped by certification_id; safe because these are pre-launch test rows.
--      (Post-launch, issued credentials are intentionally left frozen.)
-- ---------------------------------------------------------------------------

update public.credentials
set certification_name = 'Scrum Master I — AI',
    certification_code = 'SM-AI-I'
where certification_id = '11111111-1111-1111-1111-111111111111';

update public.credentials
set certification_name = 'Scrum Product Owner I — AI',
    certification_code = 'SPO-AI-I'
where certification_id = '33333333-3333-3333-3333-333333333333';

-- Note: credential_code prefixes (e.g. "SM-I-XXXX-XXXX") are NOT rewritten —
-- the human-facing code on an issued credential is immutable identity. New
-- credentials mint with the new prefix (SM-AI-I-XXXX-XXXX) via score-mock-exam.

-- ---------------------------------------------------------------------------
-- (2) Backfill 1-year expiry on any credential missing it (same-date next year)
-- ---------------------------------------------------------------------------

update public.credentials
set expires_at = issued_at + interval '1 year'
where expires_at is null;

-- ---------------------------------------------------------------------------
-- Verify (expected):
--   certifications: SM-AI-I "Scrum Master I — AI", SPO-AI-I "Scrum Product Owner I — AI"
--   credentials: certification_code/name match new strings; expires_at = issued_at + 1yr
-- ---------------------------------------------------------------------------
-- select code, name from public.certifications order by code;
-- select credential_code, certification_code, certification_name, issued_at, expires_at
--   from public.credentials order by issued_at desc;
