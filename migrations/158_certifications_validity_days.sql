-- 158_certifications_validity_days.sql
--
-- Adds the credential validity period to certifications.
--
-- WHY THIS EXISTS: the sales library's fact sheet must state how long a
-- credential is valid, and there was no column to read it from. Validity lives
-- only on credentials.expires_at, set by application code at mint time. A fact
-- sheet stating "valid for 12 months" would therefore be a hardcoded assertion
-- rather than a derived fact, which is precisely the drift SALES-LIBRARY-SPEC
-- §2 exists to prevent -- and it is the same failure as a governance document
-- describing a schema that has moved.
--
-- 365 is the established house policy, implemented since migration 053 and
-- carried by every credential ever issued. The rationale is content re-review
-- cadence, not candidate memory: a validity period is a commitment to
-- re-review the body of knowledge on that schedule. Certifications anchored to
-- stable frameworks may hold a version for years under the same cadence; ones
-- tracking fast-moving regulation cannot.
--
-- Per-cert override is therefore expected eventually. The column is nullable-
-- free with a default so today's uniform behaviour is preserved exactly.
--
-- FOLLOW-UP, NOT DONE HERE: the credential mint path computes expires_at
-- independently of this column. Until it reads validity_days, there are two
-- sources for one fact and they can diverge silently. Verify where expires_at
-- is set (score-mock-exam is the likely site) and point it at this column.
-- Recorded so it does not get lost.

begin;

alter table public.certifications
  add column if not exists validity_days integer not null default 365;

alter table public.certifications
  add constraint certifications_validity_days_positive
  check (validity_days > 0);

comment on column public.certifications.validity_days is
  'Credential validity in days from issuance. House default 365, set by content '
  're-review cadence rather than candidate memory. THE MINT PATH DOES NOT YET '
  'READ THIS -- it computes expires_at independently. Reconcile before relying '
  'on this column for anything but display.';

commit;

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------
--
-- select code, num_questions, passing_score_pct, exam_duration_minutes,
--        max_exam_attempts, attempt_window_months, validity_days, status
--   from public.certifications order by code;
--
-- Expect validity_days = 365 on all seven.
--
-- Cross-check against what has actually been issued -- if these disagree, the
-- mint path is the source of truth and this column is wrong:
--
-- select certification_code,
--        min(round(extract(epoch from (expires_at - issued_at)) / 86400)) as min_days,
--        max(round(extract(epoch from (expires_at - issued_at)) / 86400)) as max_days,
--        count(*) as credentials
--   from public.credentials
--  where expires_at is not null
--  group by certification_code
--  order by certification_code;
