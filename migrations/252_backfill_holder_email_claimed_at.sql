-- 252_backfill_holder_email_claimed_at.sql
--
-- Fills the two columns migration 231 added and score-mock-exam never wrote.
--
-- Editor-first: this ran live in the SQL editor on 2026-08-26, one statement at
-- a time. The file is the record of what already ran, not a script anyone
-- executes.
--
-- ============================ HOW THIS ONE IS VERIFIED ===================
--
-- No function body, so no md5. The verifiable artefact is the row state, and
-- section 3 records it verbatim -- including the row that was deliberately NOT
-- filled. Same discipline as 247, 248 and 251.
--
-- ============================ WHAT WENT WRONG ============================
--
-- Migration 231 added credentials.holder_email and credentials.claimed_at,
-- backfilled every row that existed, and named no writer. score-mock-exam's
-- mint was not updated, so every credential minted by a passing exam from
-- 2026-08-19 carried NULL in both. Neither column is constrained, so nothing
-- failed loudly.
--
-- That is the THIRD time that insert was caught by the same pattern
-- (issuer_id/subject_salt, then achievement_id, then these two). The forward
-- fix shipped in the same session; this file is only about the rows already
-- written.
--
-- holder_email surfaced because the Open Badges 2.0 route (migration 251) needs
-- an address to hash. OB2 has no optional recipient: an assertion identifies
-- someone or it verifies nothing, so those credentials could not be exported at
-- all.
--
-- ============================ THE TWO STATEMENTS HAVE DIFFERENT GATES ====
--
-- Deliberately, and the difference is the point of this file.
--
-- SECTION 1, holder_email, IS GATED. It writes a MUTABLE value that has no
-- audit trail. profiles.email can change; there is no email-change history
-- table anywhere in this schema (profiles carries only
-- on_profile_created_claim_vouchers and profiles_updated_at, neither of which
-- records a prior address). So a credential issued a year ago to someone who
-- has since changed address CANNOT be backfilled honestly -- the write would
-- silently stamp today's address onto a credential issued to a different one,
-- and nothing afterwards could detect it.
--
-- The gate is `issued_at > auth.users.updated_at`: no account change of any
-- kind has happened since issuance. It is a CONSERVATIVE PROXY, not an exact
-- test. updated_at moves on login too, so it OVER-REFUSES rather than
-- over-writes, which is the correct direction for a value that cannot be
-- checked after the fact.
--
-- A credential whose address cannot be established honestly STAYS
-- UN-EXPORTABLE, and the 422 from ?doc=ob2 already says exactly that: "this
-- credential has no recorded holder email, so an Open Badges 2.0 hosted
-- assertion cannot identify its recipient." That is a true sentence about the
-- record. A guessed address would not be.
--
-- SECTION 2, claimed_at, IS UNGATED. It guards against nothing because there is
-- nothing to be wrong about: claimed_at marks when a credential acquired its
-- holder, and a row with user_id set HAS one. For an exam there is no gap
-- between minting and owning -- user_id is known at mint -- so
-- claimed_at = issued_at is a fact about the row, not an inference about a
-- mutable value somewhere else.
--
-- Migration 231 backfilled it ungated for the same reason:
--   set claimed_at = coalesce(claimed_at, issued_at) where user_id is not null
-- This is that statement again, for the rows written since.
--
-- ============================ NOTHING READ THE NULL ======================
--
-- Grepped both repos: NOTHING reads credentials.claimed_at. Zero hits across
-- certidemy-web app/, lib/ and components/, and none in functions/ beyond the
-- writer added this session.
--
-- The other claimed_at hits are a DIFFERENT column on different tables --
-- email_queue.claimed_at (243) and webhook_deliveries.claimed_at (235), both
-- worker-lease timestamps for the dispatchers.
--
-- The console roster's "unclaimed" is not this column either. lib/console/
-- roster.ts derives it from a VOUCHER: `const claimed = !!v.assigned_user_id`,
-- meaning "has the invitee signed up". So the NULL misreported nothing to any
-- surface. It was a column that lied only to whoever queried it directly.
-- Fixed forward; there was no display bug to chase.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).
-- Idempotent: both statements are guarded on IS NULL and can only fill a gap.

-- ---------------------------------------------------------------------------
-- 1. holder_email -- GATED. See the header.
--
--    `holder_email is null and user_id is not null` means this can only ever
--    fill a gap, never overwrite an address already recorded.
-- ---------------------------------------------------------------------------

update public.credentials cr
set holder_email = p.email
from public.profiles p, auth.users u
where p.id = cr.user_id
  and u.id = cr.user_id
  and cr.holder_email is null
  and cr.user_id is not null
  and cr.issued_at > u.updated_at;
-- OBSERVED: UPDATE 1 (AIE-I-UW8V-ZRUY).
--
-- ZZ-TEST-I-A6BJ-EA5R was DECLINED BY THE GATE, not by an exception: its
-- account was touched at 18:38:35 and the credential was issued at 01:04:58 the
-- same day. No special case had to be written or remembered -- the rule
-- excluded it on its own, which is the better outcome. It is a revoked
-- throwaway and is deliberately left NULL so it keeps exercising the ?doc=ob2
-- 422 path, which nothing else in the database can.

-- ---------------------------------------------------------------------------
-- 2. claimed_at -- UNGATED. See the header.
-- ---------------------------------------------------------------------------

update public.credentials
set claimed_at = issued_at
where claimed_at is null
  and user_id is not null;
-- OBSERVED: UPDATE 2 (ZZ-TEST-I-A6BJ-EA5R, AIE-I-UW8V-ZRUY).

-- ---------------------------------------------------------------------------
-- 3. Verification. Observed live 2026-08-26 after the statements above.
--    These rows ARE the record.
-- ---------------------------------------------------------------------------

-- select credential_code, holder_email, claimed_at, status
-- from public.credentials where exam_attempt_id is not null order by issued_at;
--
-- OBSERVED (claimed_at = issued_at on all four):
--   SM-AI-I-ZZMV-JPC8    julio.ingmec14@gmail.com   2026-08-12 21:20:32.906+00  active
--   AIE-I-5GFT-YJ93      alopez@ultratech-inc.com   2026-08-17 15:47:27.067+00  active
--   ZZ-TEST-I-A6BJ-EA5R  null                       2026-08-26 01:04:58.521+00  revoked
--   AIE-I-UW8V-ZRUY      kcalvo@ultratech-inc.com   2026-08-26 19:00:44.758+00  active
--
-- The first two were filled by 231's own backfill and were never touched here.

-- -- What remains un-backfillable. NOT expected to be zero: that row staying
-- -- NULL is the intended outcome, not a failure.
-- select cr.credential_code, cr.status, cr.issued_at, u.updated_at
-- from public.credentials cr join auth.users u on u.id = cr.user_id
-- where cr.holder_email is null and cr.user_id is not null;
--
-- OBSERVED: ZZ-TEST-I-A6BJ-EA5R, revoked, issued 01:04:58, account updated
--           18:38:35.

-- -- The property claimed_at now satisfies, across the whole table.
-- select count(*) from public.credentials
-- where user_id is not null and claimed_at is null;
-- OBSERVED: 0.
