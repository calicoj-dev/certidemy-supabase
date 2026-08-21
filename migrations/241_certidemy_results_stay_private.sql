-- 241_certidemy_results_stay_private.sql
--
-- A Certidemy certification credential can never publish results.
--
-- ============================ THE RULE THIS MAKES STRUCTURAL =============
--
-- list-credentials and get-company-detail both carry the same comment:
--
--   "score_pct is never selected, never returned -- the integrity rule holds."
--
-- An exam score does not leave the server. The credential asserts competence
-- against a published blueprint; the number behind that decision is not part
-- of the claim and publishing it would change what a Certidemy credential
-- means.
--
-- Migration 240 introduced results_visibility with no idea about any of that.
-- One UPDATE would put a Certidemy exam result on a document any link-holder
-- can fetch, and nothing would object.
--
-- ============================ WHY A CHECK AND NOT A NOTE =================
--
-- The rule currently lives in two source comments and one person's memory.
-- This project's recurring defect is exactly that: rules in prose that depend
-- on somebody remembering them at the right moment.
--
-- A certification-backed credential is one with certification_id set. Those
-- may only be 'holder'. A partner credential -- certification_id NULL -- is
-- the issuer's own claim about their own course, and publishing a mark on it
-- is their decision to make.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).

begin;

-- Nothing to backfill: 240 defaulted every existing row to 'holder'. Asserted
-- rather than assumed -- if a row were already public the constraint below
-- would fail and take this transaction with it, which is the correct outcome.
do $$
declare
  v_bad integer;
begin
  select count(*) into v_bad
  from public.credentials
  where certification_id is not null and results_visibility <> 'holder';

  if v_bad > 0 then
    raise exception
      '% certification credential(s) already publish results. Investigate '
      'before locking: this migration assumes none do.', v_bad;
  end if;
end $$;

alter table public.credentials
  drop constraint if exists credentials_certification_results_private;
alter table public.credentials
  add constraint credentials_certification_results_private
  check (
    certification_id is null
    or results_visibility = 'holder'
  );

comment on constraint credentials_certification_results_private
  on public.credentials is
  'A Certidemy certification credential may never publish results. The exam score does not leave the server -- list-credentials and get-company-detail enforce the same rule in code, and this makes it structural. Partner credentials (certification_id NULL) are the issuer''s own claim and may publish.';

commit;

-- Verification (run separately):
--
--   select certification_id is null as is_partner, results_visibility, count(*)
--   from public.credentials group by 1, 2 order by 1, 2;
--
-- Prove it bites. This MUST raise:
--
--   update public.credentials set results_visibility = 'public'
--   where credential_code = 'SM-AI-I-ZZMV-JPC8';
--
-- And this MUST still succeed -- a partner may publish their own:
--
--   update public.credentials set results_visibility = 'public'
--   where credential_code = 'SCRUM-BOOTCAMP-2-T7ZQ-755P'
--   returning credential_code, results_visibility;
