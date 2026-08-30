-- 265_user_certifications_lti_source.sql
--
-- Widens user_certifications_source_check to admit 'lti'.
--
-- WHY A FIFTH SOURCE RATHER THAN REUSING 'self'
-- ---------------------------------------------
-- An LTI launch enrols the student on their behalf: the instructor planted the
-- activity in their own course and the student clicked it. That is legitimate
-- consent, and LTI-PHASE-2.md section 2 says a launched student gets lessons,
-- practice and progress -- which /learn/[cert] gates on an enrolment row.
--
-- But it is NOT self-service, and `source` exists for exactly one purpose: to
-- record how somebody came to be enrolled. Writing 'self' would be a convenient
-- lie in the one column whose job is provenance, and it does not stay local --
-- listUserEnrollments surfaces it and the console census reads it.
--
-- THIS GRANTS NOBODY ANYTHING. The INSERT policy from 114 still pins learners to
-- `source = 'self'`, so a learner cannot write an 'lti' row. The LTI enrolment
-- is written by functions/_shared/lti-provision.ts with service_role, which
-- bypasses RLS. Widening a CHECK is not widening access.
--
-- MIRRORED PAIR. certidemy-web's `EnrollmentSource` union in
-- lib/enrollment/data.ts is a copy of this list, and it is the quiet half: a
-- value the database accepts but the union omits produces no type error
-- anywhere. The row arrives, TypeScript believes the annotation, and an
-- exhaustive switch takes no branch. Both halves move together.
--
-- RECORDED FROM THE LIVE DEFINITION, NOT FROM WHAT WAS SUBMITTED. The statements
-- below were run in the SQL editor first. Postgres rewrote the `in (...)` that
-- was submitted into `= ANY (ARRAY[...])`, and pg_get_constraintdef then read
-- back:
--
--   CHECK ((source = ANY (ARRAY['self'::text, 'voucher'::text, 'seat'::text,
--                              'admin'::text, 'lti'::text])))
--
-- The submitted form and the stored form are not the same text. This file
-- records the one that exists.

alter table public.user_certifications
  drop constraint user_certifications_source_check;

alter table public.user_certifications
  add constraint user_certifications_source_check
  check (source in ('self', 'voucher', 'seat', 'admin', 'lti'));

-- Verification, as run:
--
--   select conname, pg_get_constraintdef(oid) as definition
--   from pg_constraint
--   where conrelid = 'public.user_certifications'::regclass
--     and conname = 'user_certifications_source_check';
--
-- Behavioural check, both directions, against the live table:
--   an insert with source='lti'   reaches the FOREIGN KEY (23503) -- the check passed
--   an insert with source='bogus' is refused by the CHECK        (23514) -- control
--
-- The control is the half that matters: without it, a passing 'lti' would only
-- have shown that the probe was not reaching the constraint at all.
