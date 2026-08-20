-- 237_claim_credentials_on_signup.sql
--
-- Binds credentials issued to an email address to the account that later signs
-- up with it.
--
-- ============================ WHY HERE AND NOT A NEW TRIGGER ==============
--
-- claim_vouchers_for_new_profile already runs AFTER INSERT FOR EACH ROW on
-- profiles and already performs three claims keyed on new.email: vouchers,
-- voucher-derived membership, and company_invites.
--
-- Migration 231 shipped claim_credentials(uuid, citext) as a standalone RPC
-- with a comment saying it was deliberately NOT a trigger, because "072 already
-- owns a claim path and two triggers racing over one signup is worse than one
-- explicit call". That reasoning holds; the conclusion was half-right. The
-- correct move is not a second trigger and not an application call somebody has
-- to remember -- it is a fourth step in the function that already owns this
-- moment.
--
-- claim_credentials() is KEPT. It is still the right entry point for an admin
-- re-running a claim, or for a backfill, and this function now calls it rather
-- than duplicating the UPDATE. One statement, one place.
--
-- ============================ THE BYTES DO NOT MOVE =======================
--
-- Claiming sets user_id and claimed_at. NEITHER appears in the signed document.
--
-- The credential carries a salted hash of holder_email, and holder_email does
-- not change here -- that is the whole reason pass 2 moved the subject hash off
-- auth.users and onto the column. So material_updated_at must NOT bump, the
-- proof's `created` stays put, the anchor still matches, and the holder simply
-- starts seeing the credential in their dashboard.
--
-- A claim that re-signed the credential would invalidate every copy already
-- distributed, for a change the document does not contain.
--
-- ============================ EMAIL CHANGES LATER =========================
--
-- Once claimed, the credential stays with that user_id. holder_email is the
-- snapshot the identityHash was computed from and must never move, for the same
-- reason subject_salt is immutable in 185: rotating it silently breaks every
-- previously-issued match.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).

begin;

-- Body of 072 verbatim, with step 4 appended. Reproduced in full because
-- CREATE OR REPLACE replaces the whole function -- there is no way to append to
-- one, and the three existing claims must survive byte for byte.
create or replace function public.claim_vouchers_for_new_profile()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- 1. Bind unclaimed vouchers for this email.
  update public.vouchers
  set assigned_user_id = new.id,
      assigned_at = coalesce(assigned_at, now()),
      updated_at = now()
  where assigned_email = new.email
    and assigned_user_id is null
    and status = 'assigned';

  -- 2. Membership for companies whose voucher this user now holds.
  insert into public.team_members (id, company_id, user_id, role, joined_at)
  select gen_random_uuid(), v.company_id, new.id, 'team_member', now()
  from public.vouchers v
  where v.assigned_user_id = new.id
    and v.company_id is not null
  on conflict (company_id, user_id) do nothing;

  -- 3. Redeem pending company_invites for this email -> mint staff membership
  --    at the invited role. team_members.role is the team_role enum, so the
  --    invite role text must be a valid enum value (today: 'team_admin').
  insert into public.team_members (id, company_id, user_id, role, joined_at)
  select gen_random_uuid(), ci.company_id, new.id, ci.role::team_role, now()
  from public.company_invites ci
  where ci.email = new.email
    and ci.status = 'pending'
  on conflict (company_id, user_id) do update
    set role = excluded.role;  -- upgrade a learner-member to their invited staff role

  update public.company_invites
  set status = 'redeemed', redeemed_at = now(), redeemed_by = new.id
  where email = new.email and status = 'pending';

  -- 4. Bind credentials issued to this email before the account existed.
  --
  --    A partner finishing a Saturday bootcamp has thirty addresses and no idea
  --    which of them will ever create an account. issue-partner-credential
  --    writes user_id NULL with holder_email set; this is the moment it becomes
  --    theirs.
  --
  --    Delegates to claim_credentials() rather than repeating the UPDATE, so
  --    an admin re-running a claim and a signup take the same path. It does NOT
  --    touch material_updated_at: user_id is not in the signed document, so the
  --    bytes -- and the anchor -- are unaffected.
  perform public.claim_credentials(new.id, new.email);

  return new;
end;
$function$;

comment on function public.claim_vouchers_for_new_profile() is
  'AFTER INSERT on profiles. Claims, in order: vouchers, voucher-derived membership, company_invites, and credentials issued to this email before the account existed. Named for what it did first; it now owns the whole signup claim.';

commit;

-- Verification (run separately, one at a time):
--
--   select public.claim_credentials(
--     '00000000-0000-0000-0000-000000000000'::uuid, 'nobody@example.invalid'::citext);
--   -- 0. Proves the RPC is callable and matches nothing.
--
--   select credential_code, holder_email, user_id, claimed_at
--   from public.credentials where user_id is null;
--   -- expect SCRUM-BOOTCAMP-2-T7ZQ-755P, jairo.casallas10th@gmail.com, null, null
--
-- THE REAL TEST is a signup. When that address creates an account:
--
--   select credential_code, holder_email, user_id is not null as claimed, claimed_at
--   from public.credentials where credential_code = 'SCRUM-BOOTCAMP-2-T7ZQ-755P';
--
-- And the byte check, which is the one that matters -- run BEFORE and AFTER the
-- claim, from a shell:
--
--   curl -s https://credentials.certidemy.com/credentials/SCRUM-BOOTCAMP-2-T7ZQ-755P | sha256sum
--   -- MUST be identical. If it moves, user_id leaked into the signed document
--   -- and every anchored credential is at risk on the next claim.
