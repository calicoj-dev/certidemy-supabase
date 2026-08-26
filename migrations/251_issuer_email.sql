-- 251_issuer_email.sql
--
-- issuers.email, for the Open Badges 2.0 issuer Profile. Nothing else reads it.
--
-- Editor-first: this ran live in the SQL editor on 2026-08-26, one statement at
-- a time. The file is the record of what already ran, not a script anyone
-- executes.
--
-- ============================ HOW THIS ONE IS VERIFIED ===================
--
-- 244, 245 and 249 recorded an md5 of prosrc, because what they recorded was a
-- FUNCTION BODY. There is no function here. The verifiable artefacts are the
-- column type and the observed rows, so section 4 records what format_type
-- returned and what the table held, verbatim. Same discipline as 247 and 248.
--
-- ============================ WHY THIS COLUMN EXISTS =====================
--
-- OB 2.0 requires `email` on a Profile used as an issuer. OB 3.0 does NOT --
-- _shared/ob3.ts buildIssuerProfile() emits id, type, name, url and the
-- Multikey, and has never wanted an address. So this column exists solely for
-- the ?doc=ob2 branch of open-badge, and the OB3 document is unchanged by it.
--
-- Measured, not assumed: the public bytes of SM-AI-I-ZZMV-JPC8 were
-- 366981ac5a547b6c7aa943f66eecd3c8f75ccf5078bdc30b594f4784a109a796 before the
-- open-badge deploy that read this column, and identical after it.
--
-- ============================ NULL MEANS OMIT, NEVER SUBSTITUTE ==========
--
-- Nullable on purpose. Our own eleven schemes can carry info@certidemy.com; a
-- partner's address is theirs to supply and we must not invent one.
--
-- WHEN IT IS NULL THE OB2 ASSERTION OMITS THE FIELD. It does not fall back to
-- a Certidemy address. A partner issuer appearing to be reachable at
-- info@certidemy.com would be the platform asserting something the issuer did
-- not -- the same rule that governs every subject line and every certificate
-- this platform renders.
--
-- Verified live after the deploy: SCRUM-BOOTCAMP-2-T7ZQ-755P, issued by
-- test-partner-02 (email NULL), returns an issuer Profile with no `email` key
-- at all.
--
-- ============================ NO FORMAT CHECK ============================
--
-- citext, matching profiles.email, company_invites.email and
-- credentials.holder_email. No CHECK: a regex that rejects a valid RFC 5321
-- address is worse than none, and no other address column on this schema
-- carries one. Validation belongs in whatever writes it.
--
-- ============================ NO UPDATE GRANT ============================
--
-- SELECT only. Nothing writes this column yet -- create-partner-issuer does not
-- accept it -- so granting a write nothing uses would be surface with no
-- purpose. Whoever builds the console field adds the write path then.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. The column.
-- ---------------------------------------------------------------------------

alter table public.issuers add column if not exists email citext;

-- ---------------------------------------------------------------------------
-- 2. Seed OURS only. Partner rows stay NULL by design -- see the header.
-- ---------------------------------------------------------------------------

update public.issuers
set email = 'info@certidemy.com', updated_at = now()
where slug = 'certidemy' and email is null;
-- OBSERVED: UPDATE 1.

-- ---------------------------------------------------------------------------
-- 3. Grant.
--
--    Additive column grant rather than re-listing the eighteen columns in
--    migration 239 section 2, exactly as 250 did. Column grants accumulate, so
--    this is equivalent and cannot mistype an existing column out of existence.
--    239's header: "A new column on any of these tables is NOT readable until
--    somebody adds it here, which is the correct default." This is that step.
-- ---------------------------------------------------------------------------

grant select (email) on public.issuers to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Verification. Observed live 2026-08-26 after the statements above.
--    These strings ARE the record -- compare against them rather than against
--    the SQL in sections 1 to 3, which is what was typed, not what resulted.
-- ---------------------------------------------------------------------------

-- select a.attname, format_type(a.atttypid, a.atttypmod), a.attnotnull
-- from pg_attribute a
-- where a.attrelid = 'public.issuers'::regclass and a.attname = 'email';
--
-- OBSERVED:  email | citext | false

-- select slug, status, email from public.issuers order by created_at;
--
-- OBSERVED:
--   certidemy        active  info@certidemy.com
--   test-partner-02  active  null
--   durgical         active  null

-- select r.rolname, a.privilege_type, a.column_name
-- from information_schema.column_privileges a
-- join pg_roles r on r.rolname = a.grantee
-- where a.table_schema = 'public' and a.table_name = 'issuers'
--   and r.rolname = 'authenticated' and a.privilege_type = 'SELECT'
--   and a.column_name = 'email';
--
-- OBSERVED:  authenticated | SELECT | email

-- ---------------------------------------------------------------------------
-- 5. What changed above the database, deployed 2026-08-26.
--
--    functions/open-badge  -- a ?doc=ob2 branch, ADDED ALONGSIDE the existing
--      ones and never folded into the credential/baked block. Serves an Open
--      Badges 2.0 hosted assertion. Unsigned by design: in OB2 the JSON served
--      at its own id IS the proof. buildCredential and buildIssuerProfile are
--      not imported by it and not touched, so there is no DOC_VERSION bump and
--      no anchor rebuild.
--
--    credentials-worker    -- /credentials/<CODE>/ob2, a sibling route.
--      IMMOVABLE FOR THE OPPOSITE REASON TO ITS NEIGHBOURS: /badge and /anchor
--      could move because no signed document names them; this one cannot,
--      because the assertion's own `id` IS that URL. That is what hosted
--      verification means.
--
--    TWO DEFECTS FOUND BY TESTING THE DEPLOY, not by reading the code, both
--    fixed in a second deploy the same day:
--
--      1. criteria.id and image were gated on "the achievement is backed by a
--         certification", which does not imply either URL resolves. The first
--         ob2 fetch of ZZ-TEST-I-A6BJ-EA5R emitted
--         /certifications/zz-test-i and /badges/ZZ-TEST-I.png, and BOTH return
--         404 -- the cert is 'unavailable' and has no artwork. That is the same
--         defect removed from buildAchievement once before, arriving in a new
--         format. Now gated on certifications.status = 'available' and on the
--         code being present in BADGE_B64.
--
--      2. credentials.holder_email is NULLABLE and score-mock-exam's mint does
--         not set it, so every exam-minted credential since migration 231
--         carries NULL. The branch was hashing `holder_email ?? ""`, producing
--         a real-looking sha256$ of the salt alone that no verifier could ever
--         match. OB2 has no optional recipient, so it now refuses with 422
--         rather than asserting an identity that was never recorded.
--
--         THAT NULL IS ITS OWN BUG, NOT FIXED HERE. score-mock-exam should
--         snapshot holder_email at mint the way _shared/issue.ts does.
-- ---------------------------------------------------------------------------
