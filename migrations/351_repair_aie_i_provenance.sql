-- 351_repair_aie_i_provenance.sql
--
-- Repair the provenance status on ONE attempt and ONE credential.
--
-- ============ THE DEPLOY WAS THE FIX. THIS IS THE CLEANUP. ============
--
-- Nobody should read 351 as having solved anything. `score-mock-exam` sets
-- `jta_version_status` and `company_id_status` in the same object literal as
-- `jta_version_id`, and has since commit 7a10525 on 2026-09-11 -- the same day
-- migration 296 added the columns. IT WAS NEVER REDEPLOYED. Deploying it on
-- 2026-09-20 is what stops this happening again; the two rows below are debris
-- from the nine days in between.
--
-- ============ HOW ONE ROW HID A DEAD WRITER ============
--
--   attempts before 2026-09-11   13   stamped 11, not_applicable 2, unrecorded 0
--   attempts since                1   unrecorded 1
--
-- The thirteen carry a status because 296's BACKFILL wrote one, not because any
-- code set it -- eleven `stamped`, and two `not_applicable` for ZZ-TEST-I,
-- which has no published JTA version. Both values are correct. The single attempt since is the first evidence the writer
-- had ever produced, and it was wrong. 100 percent of post-296 attempts were
-- defective and the sample size was one, which is why nine days passed.
--
-- `verify-cert` §12 has been failing on it since, correctly, and its own
-- comment predicted the cause: "'unrecorded' -- the backfill left NONE, so any
-- row with it was written after 296 by a writer that does not set the column.
-- A WRITER WAS MISSED."
--
-- ============ THE THREE FIELDS ============
--
-- attempt.jta_version_status  'unrecorded' -> 'stamped'
-- credential.jta_version_status  'unrecorded' -> 'stamped'
--   DERIVED FROM THE ROW, not inferred. `jta_version_id` is present on both,
--   and a present id IS the evidence that the lookup ran and found a version.
--   Nothing about scoring time is being guessed.
--
-- attempt.company_id_status   'unrecorded' -> 'not_applicable'
--   A JUDGEMENT, and it is stated as one. The holder has no `team_members` row
--   and no trace of ever having had one, so `not_applicable` is what the
--   corrected writer would have produced from the same inputs.
--
--   AND `unrecorded` IS NOT NEUTRAL. It means no writer ran. One demonstrably
--   did -- it wrote the score, the duration, the integrity flags and the
--   company_id column itself. Leaving the field alone is also a false claim,
--   just a quieter one, and quieter is worse here: it reads as an absence of
--   information rather than as a wrong one.
--
-- ============ THERE IS NOWHERE TO RECORD THAT THIS WAS A REPAIR ============
--
-- Looked for, not assumed, and this is the part worth carrying:
--
--   The STATUS COLUMNS are closed by CHECK to exactly four values --
--   unrecorded, not_applicable, stamped, unreadable -- on all three columns.
--   There is no 'repaired' and adding one would change what every reader of
--   provenance must handle, for two rows.
--
--   `exam_attempts.integrity_flags` is jsonb and is about EXAM integrity.
--   Putting a provenance note there would conflate two unrelated records and
--   mislead the next reader of that column.
--
--   `admin_actions` is the audit table and its `actor_user_id` is NOT NULL --
--   CLAUDE.md records that it "is keyed to actor_user_id and cannot represent
--   a machine". A migration has no actor, and inventing one would be a worse
--   lie than the one being fixed.
--
-- SO AFTER THIS RUNS, THESE TWO ROWS ARE INDISTINGUISHABLE FROM ROWS STAMPED
-- AT SCORING TIME. That is a real and permanent cost, and it is exactly what
-- `mint-missing-credentials.mjs` refuses to create when it inherits a status
-- rather than re-deriving one. The only record that these were repaired is
-- this file, in git, naming both rows by identifier. Accepted deliberately:
-- the alternative is a permanently failing conformance check on a defect that
-- is understood, which trains the next reader to ignore §12.
--
-- ============ AND ITS FIRST VERSION ABORTED ON A LITERAL ============
--
-- It asserted "13 pre-296 attempts read stamped" and failed against a correct
-- database: 11 read stamped and 2 read not_applicable, the two being
-- ZZ-TEST-I, which has no published JTA version -- so 296's backfill wrote
-- exactly the right value. The 13 came from a query counting attempts BEFORE
-- 296 and was asserted of a different population, those that READ STAMPED.
--
-- Every "did not touch" assertion here is now a BEFORE/AFTER CHECKSUM over the
-- rows the migration is not authorised to change. No number, nothing to go
-- stale, and stronger than a count -- a count passes on two rows swapping
-- values.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  ATTEMPT constant uuid := '948e5948-9a54-4592-9c05-d5c5f61266fa';
  CRED    constant text := 'AIE-I-ABHC-TW2T';
  n_att_all   int;
  n_cred_all  int;
  n_members   int;
  n_att_hit   int;
  n_cred_hit  int;
  v_jta       uuid;
  v_company   uuid;
  rest_att_before   text;
  rest_att_after    text;
  rest_cred_before  text;
  rest_cred_after   text;
begin

  -- ----------------------------------------------- pre-conditions
  -- THE POPULATION IS TWO ROWS AND THE MIGRATION REFUSES TO TOUCH A THIRD.
  -- A repair that matches more than what was diagnosed is a different
  -- migration. If a new defective row appeared since the diagnosis it must be
  -- diagnosed too, not swept up by a predicate written for these.
  select count(*) into n_att_all
    from public.exam_attempts
   where jta_version_status = 'unrecorded' or company_id_status = 'unrecorded';
  select count(*) into n_cred_all
    from public.credentials where jta_version_status = 'unrecorded';
  if n_att_all <> 1 or n_cred_all <> 1 then
    raise exception 'expected exactly 1 defective attempt and 1 credential, found % and %',
      n_att_all, n_cred_all
      using hint = 'A row appeared or vanished since the diagnosis. Re-diagnose; do not widen this.';
  end if;

  -- And they are THE ones diagnosed, not merely the right number of them.
  if not exists (select 1 from public.exam_attempts
                  where id = ATTEMPT and jta_version_status = 'unrecorded'
                    and company_id_status = 'unrecorded') then
    raise exception 'attempt % is not in the state this migration was written for', ATTEMPT;
  end if;
  if not exists (select 1 from public.credentials
                  where credential_code = CRED and jta_version_status = 'unrecorded') then
    raise exception 'credential % is not in the state this migration was written for', CRED;
  end if;

  -- The derivations, re-checked against the rows rather than trusted from the
  -- diagnosis. `stamped` is only honest while the id is actually present.
  select jta_version_id, company_id into v_jta, v_company
    from public.exam_attempts where id = ATTEMPT;
  if v_jta is null then
    raise exception 'attempt % has no jta_version_id -- stamped would be a lie', ATTEMPT;
  end if;
  if v_company is not null then
    raise exception 'attempt % HAS a company_id -- not_applicable would be a lie', ATTEMPT
      using hint = 'It should be stamped instead. Re-diagnose.';
  end if;
  if (select jta_version_id from public.credentials where credential_code = CRED) is null then
    raise exception 'credential % has no jta_version_id -- stamped would be a lie', CRED;
  end if;

  -- The judgement, re-checked: no membership, so not_applicable is what the
  -- corrected writer produces from these inputs.
  select count(*) into n_members
    from public.team_members tm
    join public.exam_attempts a on a.user_id = tm.user_id
   where a.id = ATTEMPT;
  if n_members <> 0 then
    raise exception 'the holder has % team_members row(s) -- not_applicable is no longer defensible', n_members;
  end if;

  -- ----------------------------------------------- what must not move
  -- A CHECKSUM OF EVERY OTHER ROW, not a count of one of its states.
  --
  -- The first version asserted "13 pre-296 attempts read stamped" and aborted
  -- on a correct database: 11 read stamped and 2 read not_applicable, because
  -- ZZ-TEST-I has no published JTA version and 296's backfill wrote the right
  -- value for it. The 13 came from a query that counted attempts BEFORE 296,
  -- and was then asserted of a different population -- attempts that READ
  -- STAMPED. Third time this week a remembered count failed against reality
  -- being right, and a failure like that cannot be told from a real one.
  --
  -- So: hash the state of every row this migration is not allowed to touch,
  -- and require the hash to be identical afterwards. It carries no number, it
  -- cannot go stale, and it is strictly stronger than any count -- a count
  -- passes on two rows swapping values.
  select md5(coalesce(string_agg(
           id::text || ':' || jta_version_status || ':' || company_id_status, ',' order by id), ''))
    into rest_att_before
    from public.exam_attempts where id <> ATTEMPT;
  select md5(coalesce(string_agg(
           credential_code || ':' || jta_version_status, ',' order by credential_code), ''))
    into rest_cred_before
    from public.credentials where credential_code <> CRED;

  -- ----------------------------------------------- the repair
  update public.exam_attempts
     set jta_version_status = 'stamped',
         company_id_status  = 'not_applicable'
   where id = ATTEMPT;
  get diagnostics n_att_hit = row_count;

  update public.credentials
     set jta_version_status = 'stamped'
   where credential_code = CRED;
  get diagnostics n_cred_hit = row_count;

  -- ===================== POST-CONDITIONS =====================

  -- 1. EXACTLY TWO ROWS MOVED.
  if n_att_hit <> 1 or n_cred_hit <> 1 then
    raise exception 'updated % attempt(s) and % credential(s), expected 1 and 1', n_att_hit, n_cred_hit;
  end if;

  -- 2. POSITIVE. Both now agree with the column they describe, which is the
  --    property verify-cert §12 tests.
  if not exists (select 1 from public.exam_attempts
                  where id = ATTEMPT and jta_version_status = 'stamped'
                    and company_id_status = 'not_applicable') then
    raise exception 'the attempt did not take the repair';
  end if;

  -- 3. NEGATIVE, AND IT IS THE ONE THE AUTHORISATION WAS ABOUT. Nothing else
  --    in either table is 'unrecorded' now -- which also proves the update did
  --    not reach beyond its key, since a stray match would have left zero.
  select count(*) into n_att_all
    from public.exam_attempts
   where jta_version_status = 'unrecorded' or company_id_status = 'unrecorded';
  select count(*) into n_cred_all
    from public.credentials where jta_version_status = 'unrecorded';
  if n_att_all <> 0 or n_cred_all <> 0 then
    raise exception '% attempt(s) and % credential(s) are still unrecorded', n_att_all, n_cred_all;
  end if;

  -- 4. NEGATIVE, AND IT IS THE ONE THE AUTHORISATION WAS ABOUT. Every row this
  --    migration was not asked to touch is byte-identical. A repair keyed on a
  --    status value rather than an id would have rewritten the backfilled rows
  --    and still passed checks 2 and 3.
  select md5(coalesce(string_agg(
           id::text || ':' || jta_version_status || ':' || company_id_status, ',' order by id), ''))
    into rest_att_after
    from public.exam_attempts where id <> ATTEMPT;
  select md5(coalesce(string_agg(
           credential_code || ':' || jta_version_status, ',' order by credential_code), ''))
    into rest_cred_after
    from public.credentials where credential_code <> CRED;
  if rest_att_before is distinct from rest_att_after then
    raise exception 'an exam_attempt other than % changed', ATTEMPT
      using detail = 'This migration is authorised for one attempt and one credential.';
  end if;
  if rest_cred_before is distinct from rest_cred_after then
    raise exception 'a credential other than % changed', CRED;
  end if;

  -- 5. NEGATIVE. The credential itself is unchanged in every way that matters
  --    to its holder. A provenance repair must not touch the claim.
  if not exists (select 1 from public.credentials
                  where credential_code = CRED and status = 'active'
                    and is_specimen = false and certificate_path is not null) then
    raise exception 'the credential changed beyond its provenance status';
  end if;

  raise notice '351 ok: 1 attempt and 1 credential repaired; 13 backfilled rows untouched';
  raise notice 'THE FIX WAS THE DEPLOY. score-mock-exam was redeployed 2026-09-20 after nine days.';
end
$mig$;
