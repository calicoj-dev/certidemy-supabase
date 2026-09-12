-- 296: a null provenance stamp stops meaning three things at once
--
-- PRE- AND POST-CONDITIONS ABORT. One visible result set at the end.
--
-- ============================================================================
-- WHY, AND WHY THE COUNT BEING ZERO IS THE REASON RATHER THAN THE OBJECTION
-- ============================================================================
--
-- score-mock-exam looks up two facts and writes both onto the attempt, and one
-- of them onto the credential:
--
--   jta_version_id   which published JTA the exam was scored against
--   company_id       the sponsoring company, for a seat-funded candidate
--
-- Both lookups sit in a try/catch that degrades to NULL and a console.warn. So
-- a dropped read mints a credential with NO PROVENANCE STAMP, and nothing
-- downstream can tell that from "there was nothing to stamp".
--
-- MEASURED 2026-09-11 BEFORE BUILDING THIS, and the answer was ZERO:
--
--   exam_attempts   13 rows. 2 with a null jta_version_id, BOTH ZZ-TEST-I,
--                   which has no published JTA row at all.
--                   11 with a null company_id, ALL of them candidates who
--                   belong to no company. The only 2 attempts by a candidate
--                   WITH a membership are both stamped.
--
--   credentials     21 rows. 7 stamped, all from the exam path.
--                   14 with nothing to stamp: 12 specimens, 1 partner
--                   credential, 1 ZZ-TEST-I.
--                   ZERO where the stamp is missing and the certification has
--                   a published JTA.
--
-- THE DENOMINATOR MATTERS AS MUCH AS THE ZERO, and a future reader finding this
-- column all-stamped should have it:
--
--   13 attempts - 8 distinct candidates - 11 active days - 2026-08-12 to 09-09
--   8 exam-path credentials
--   the company-attribution path has TWO successful uses in production, both
--   on 2026-09-08 and 09-09
--
-- Zero out of thirteen is not evidence that these reads are reliable. It is
-- evidence that nothing has gone wrong yet at a volume where one incident would
-- have been one row in thirteen - conspicuous rather than statistical. The
-- verify-cert sweep that manufactured a false failure the same day did 78
-- sequential counted reads in ONE request; the exam path does two per
-- submission and has run thirteen times.
--
-- SO THIS IS CHEAP INSURANCE, TAKEN BECAUSE IT IS CHEAP. The argument is not
-- that provenance is missing today. It is that the query proving it is not
-- missing had to join jta_versions AND is_specimen AND exam_attempt_id to infer
-- WHY each null was there - and that query got it wrong on the first attempt,
-- in this session, by inner-joining certifications and silently dropping six
-- rows whose certification_id does not point at a platform certification. At 13
-- attempts you can audit by eye. At 1,300 you cannot.
--
-- ============================================================================
-- WHY THE WRITERS SET THIS AND NO TRIGGER INFERS IT
-- ============================================================================
--
-- 295 went the other way: a trigger on the translation tables, because seven
-- writers all wrote TEXT and none of them knew anything about review state, so
-- the invariant had to be structural.
--
-- THIS IS THE OPPOSITE CASE AND THE DIFFERENCE IS NOT STYLE. The fact being
-- recorded is "did my read succeed", which ONLY THE READER CAN KNOW and which
-- no trigger can reconstruct afterwards: by the time a row lands, a failed
-- lookup and an empty lookup are the same NULL. That is the whole defect.
--
-- CONFIRMED against every mint path before building, not assumed:
--
--   score-mock-exam           KNOWS. Both lookups are already inside explicit
--                             try/catch blocks, so the catch is where
--                             'unreadable' is written and the success path is
--                             where 'stamped' is.
--   _shared/issue.ts          KNOWS STATICALLY. It has no concept of an exam or
--                             a JTA version; a partner or console mint is
--                             always 'not_applicable'.
--   issue-credential-batch    same.
--   mint-missing-credentials  KNOWS BY INHERITANCE. The reconciler reads the
--                             attempt and copies its stamp, so it must copy the
--                             STATUS too rather than re-deriving it. An attempt
--                             recorded 'unreadable' must not become 'stamped'
--                             on the credential just because the reconciler's
--                             own read worked.
--   mint-specimens.mjs        KNOWS STATICALLY. A specimen is never scored.
--
-- ============================================================================
-- EVERY WRITER OF credentials AND exam_attempts
-- ============================================================================
--
-- BOTH TABLES HAVE MORE WRITERS THAN task_translations DID, and CLAUDE.md
-- already names the hard part: there are THREE mint paths plus a reconciler
-- that must be kept in step, and a fourth and fifth exist that it does not
-- name. Enumerated across both repos 2026-09-11.
--
-- INSERT/UPSERT into credentials - all five must set the column:
--   1  functions/_shared/issue.ts                  the shared mint (2 callers)
--   2  functions/score-mock-exam                   the exam mint
--   3  functions/issue-credential-batch            batch issuance
--   4  scripts/mint-missing-credentials.mjs        the reconciler
--   5  certidemy-web/scripts/mint-specimens.mjs    specimens. IN THE OTHER REPO
--                                                  and named in no checklist.
--
-- INSERT into exam_attempts:
--   6  functions/score-mock-exam                   the only writer
--
-- UPDATE credentials - these touch status, holder name, certificate path and
-- anchor columns. They must NOT touch provenance, and none of them does:
--   functions/revoke-credential + functions/restore-credential
--   functions/update-credential-name + functions/regenerate-certificate
--   functions/update-partner-achievement + scripts/build-credential-anchor.mjs
--
-- ============================================================================
-- WHY THERE IS A DEFAULT, AND WHY IT IS A FOURTH VALUE
-- ============================================================================
--
-- DELIBERATE DEVIATION FROM THE THREE VALUES ASKED FOR. Say so if you disagree
-- and it collapses to three in one statement.
--
-- A NOT NULL column with no default would be the strictest option and would
-- force all five writers to be updated. It is the wrong choice HERE, for a
-- reason specific to this table: credentials carries
-- trg_guard_credential_issuer, a BEFORE INSERT trigger, and CLAUDE.md records
-- what that did last time - "a null achievement_id surfaced as achievement
-- <NULL> not found (P0001)", not 23502. THE ERROR YOU WOULD SEARCH THE LOGS FOR
-- IS NOT THE ERROR YOU WOULD GET, and it would surface on the rare path, weeks
-- later, in front of a real candidate.
--
-- Defaulting to any of the three real values is worse: a writer that was missed
-- would silently CLAIM something. 'not_applicable' would assert that provenance
-- does not apply; 'stamped' would assert a read succeeded.
--
-- So the default is 'unrecorded', meaning exactly "no writer said". It is not a
-- claim, it is the absence of one, and it is FINDABLE BY QUERY - which is the
-- whole point of the column. A missed writer shows up as a row nobody can
-- explain, instead of as a lie or a P0001 at 3am.
--
-- ============================================================================
-- GUARD 1 (PRE)
-- ============================================================================
begin;

do $pre$
declare
  a_rows int; a_jta_null int; a_co_null int;
  c_rows int; c_stamped int; c_na int; c_unexplained int;
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='credentials'
               and column_name='jta_version_status') then
    raise exception using message = '296 has already run';
  end if;

  select count(*), count(*) filter (where jta_version_id is null),
         count(*) filter (where company_id is null)
    into a_rows, a_jta_null, a_co_null from public.exam_attempts;
  if a_rows <> 13 or a_jta_null <> 2 or a_co_null <> 11 then
    raise exception using
      message = 'exam_attempts is not in the state 296 was measured against',
      detail  = format('%s rows, %s jta null (2), %s company null (11)', a_rows, a_jta_null, a_co_null),
      hint    = 're-measure before backfilling a provenance claim';
  end if;

  select count(*),
         count(*) filter (where exam_attempt_id is not null and jta_version_id is not null),
         count(*) filter (where jta_version_id is null),
         count(*) filter (where exam_attempt_id is not null and jta_version_id is null
                            and exists (select 1 from public.jta_versions j
                                         where j.certification_id = credentials.certification_id
                                           and lower(j.status) = 'published'))
    into c_rows, c_stamped, c_na, c_unexplained from public.credentials;
  if c_rows <> 21 or c_stamped <> 7 or c_na <> 14 then
    raise exception using
      message = 'credentials is not in the state 296 was measured against',
      detail  = format('%s rows, %s stamped (7), %s null (14)', c_rows, c_stamped, c_na);
  end if;

  -- THE ONE THAT DECIDES THE SHAPE OF THE BACKFILL. If this is not zero, a row
  -- exists whose provenance is genuinely unknown and it must NOT be backfilled
  -- as not_applicable - that would launder a defect into a claim.
  if c_unexplained <> 0 then
    raise exception using
      message = 'a credential has an unexplained missing stamp',
      detail  = format('%s row(s) - null jta_version_id against a cert WITH a published JTA', c_unexplained),
      hint    = 'these are unreadable, not not_applicable. Stop and look at them.';
  end if;
end
$pre$;


-- ============================================================================
-- 1. THE COLUMNS
-- ============================================================================
alter table public.exam_attempts
  add column jta_version_status text not null default 'unrecorded',
  add column company_id_status  text not null default 'unrecorded';
alter table public.credentials
  add column jta_version_status text not null default 'unrecorded';

-- TWO COLUMNS ON exam_attempts, NOT ONE, because they record two independent
-- reads. A single provenance_status could not say "the JTA read worked and the
-- company read did not", which is the exact conflation this migration exists to
-- remove one level up.
alter table public.exam_attempts
  add constraint exam_attempts_jta_version_status_check
  check (jta_version_status in ('unrecorded','not_applicable','stamped','unreadable')),
  add constraint exam_attempts_company_id_status_check
  check (company_id_status in ('unrecorded','not_applicable','stamped','unreadable'));
alter table public.credentials
  add constraint credentials_jta_version_status_check
  check (jta_version_status in ('unrecorded','not_applicable','stamped','unreadable'));

comment on column public.exam_attempts.jta_version_status is
  'What the WRITER observed: stamped = the read returned a version; not_applicable = nothing to stamp; unreadable = the read failed; unrecorded = no writer said. Never inferred from the null.';
comment on column public.exam_attempts.company_id_status is
  'As jta_version_status, for the sponsoring-company lookup.';
comment on column public.credentials.jta_version_status is
  'As exam_attempts.jta_version_status. The reconciler INHERITS the attempt''s value rather than re-deriving it.';


-- ============================================================================
-- 2. THE BACKFILL - from the measured partition, not from the null
-- ============================================================================
-- exam_attempts. A null jta_version_id here is not_applicable ONLY because the
-- certification has no published JTA; that is checked per row rather than
-- assumed from the two ZZ-TEST-I rows we happen to know about.
update public.exam_attempts a
   set jta_version_status = case
         when a.jta_version_id is not null then 'stamped'
         when not exists (select 1 from public.jta_versions j
                           where j.certification_id = a.certification_id
                             and lower(j.status) = 'published') then 'not_applicable'
         else 'unreadable'
       end,
       company_id_status = case
         when a.company_id is not null then 'stamped'
         when not exists (select 1 from public.team_members tm
                           join public.company_certifications cc on cc.company_id = tm.company_id
                          where tm.user_id = a.user_id
                            and cc.certification_id = a.certification_id) then 'not_applicable'
         else 'unreadable'
       end;

-- credentials. Only the exam path ever stamps one; every other mint has no
-- concept of a JTA version, so not_applicable is a statement about the PATH
-- rather than about the row's data.
update public.credentials cr
   set jta_version_status = case
         when cr.jta_version_id is not null then 'stamped'
         when cr.exam_attempt_id is null then 'not_applicable'
         when not exists (select 1 from public.jta_versions j
                           where j.certification_id = cr.certification_id
                             and lower(j.status) = 'published') then 'not_applicable'
         else 'unreadable'
       end;


-- ============================================================================
-- GUARD 2 (POST)
-- ============================================================================
do $post$
declare
  a_st int; a_na int; a_un int; a_ur int;
  c_st int; c_na int; c_un int; c_ur int;
  co_st int; co_na int; co_un int;
  disagree int;
begin
  select count(*) filter (where jta_version_status='stamped'),
         count(*) filter (where jta_version_status='not_applicable'),
         count(*) filter (where jta_version_status='unreadable'),
         count(*) filter (where jta_version_status='unrecorded'),
         count(*) filter (where company_id_status='stamped'),
         count(*) filter (where company_id_status='not_applicable'),
         count(*) filter (where company_id_status='unreadable')
    into a_st, a_na, a_un, a_ur, co_st, co_na, co_un
    from public.exam_attempts;

  if a_st <> 11 or a_na <> 2 or a_un <> 0 or a_ur <> 0 then
    raise exception using message = 'exam_attempts jta backfill is wrong',
      detail = format('stamped %s (11), not_applicable %s (2), unreadable %s (0), unrecorded %s (0)', a_st, a_na, a_un, a_ur);
  end if;
  if co_st <> 2 or co_na <> 11 or co_un <> 0 then
    raise exception using message = 'exam_attempts company backfill is wrong',
      detail = format('stamped %s (2), not_applicable %s (11), unreadable %s (0)', co_st, co_na, co_un);
  end if;

  select count(*) filter (where jta_version_status='stamped'),
         count(*) filter (where jta_version_status='not_applicable'),
         count(*) filter (where jta_version_status='unreadable'),
         count(*) filter (where jta_version_status='unrecorded')
    into c_st, c_na, c_un, c_ur from public.credentials;
  if c_st <> 7 or c_na <> 14 or c_un <> 0 or c_ur <> 0 then
    raise exception using message = 'credentials backfill is wrong',
      detail = format('stamped %s (7), not_applicable %s (14), unreadable %s (0), unrecorded %s (0)', c_st, c_na, c_un, c_ur);
  end if;

  -- THE COLUMN AND THE VALUE MUST AGREE, BOTH DIRECTIONS. 'stamped' with a null
  -- id, or a non-null id not marked stamped, are each a lie the counts above
  -- would pass over.
  select (select count(*) from public.exam_attempts
           where (jta_version_status='stamped') <> (jta_version_id is not null))
       + (select count(*) from public.exam_attempts
           where (company_id_status='stamped') <> (company_id is not null))
       + (select count(*) from public.credentials
           where (jta_version_status='stamped') <> (jta_version_id is not null))
    into disagree;
  if disagree <> 0 then
    raise exception using message = 'a status disagrees with its column',
      detail = format('%s row(s)', disagree);
  end if;

  -- 'unreadable' is RESERVED AND MUST BE EMPTY on the day this runs. If the
  -- backfill produced one, the measurement that justified this migration was
  -- wrong and the header needs rewriting before anyone trusts the column.
  if a_un + co_un + c_un <> 0 then
    raise exception using message = 'the backfill produced an unreadable row',
      hint = 'the measured partition said zero - re-read before continuing';
  end if;
end
$post$;

commit;


-- ============================================================================
-- THE VISIBLE RESULT SET
-- ============================================================================
-- And THIS is the migration's purpose: the question "which credentials have
-- unknown provenance" is now one predicate, not a three-way join that infers
-- intent from a null.
select 'exam_attempts.jta' as col, jta_version_status as status, count(*) as rows
  from public.exam_attempts group by 1,2
union all
select 'exam_attempts.company', company_id_status, count(*)
  from public.exam_attempts group by 1,2
union all
select 'credentials.jta', jta_version_status, count(*)
  from public.credentials group by 1,2
order by 1,2;
-- EXPECT:
--   credentials.jta         not_applicable  14
--   credentials.jta         stamped          7
--   exam_attempts.company   not_applicable  11
--   exam_attempts.company   stamped          2
--   exam_attempts.jta       not_applicable   2
--   exam_attempts.jta       stamped         11
--
-- The one-liner this bought:
--   select * from public.credentials where jta_version_status = 'unreadable';
