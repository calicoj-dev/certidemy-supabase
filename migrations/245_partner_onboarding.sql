-- 245_partner_onboarding.sql
--
-- Makes partner onboarding work for someone who already has an account, and
-- makes the three writes behind it atomic.
--
-- Editor-first: this ran live in the SQL editor on 2026-08-24. The file is the
-- record of what already ran, not a script anyone executes. The function body
-- in section 2 was verified against live prosrc by md5 with CRs stripped --
-- see the hash in that section.
--
-- ============================ WHAT WAS BROKEN ============================
--
-- Invite redemption lived in exactly one place: on_profile_created_claim_vouchers,
-- an AFTER INSERT trigger on public.profiles. That covers the invite-first path
-- and ONLY that path. If the invited address already has an account, no profile
-- insert will ever happen for it again, so the invite sits pending forever and
-- nothing errors. No failed row, no log line, no exception -- the trigger runs,
-- matches nothing, and returns.
--
-- "Already signed up" is the NORMAL case, not the edge case. A trainer
-- evaluates the material, decides it is good, and asks to become a partner.
-- The person most likely to be onboarded is the person most likely to already
-- have an account.
--
-- Observed: profile 56f695bf-66c6-45de-9937-2a2e0b608c8f
-- (info+partner@certidemy.com) was created 2026-08-24 04:48:28+00. The invite
-- for that address was created 04:50:43+00 -- two minutes and fifteen seconds
-- LATER. The trigger had already fired against a table that did not yet
-- contain the row. Stranded pending, no membership, no error.
--
-- ============================ WHAT WAS ALSO BROKEN =======================
--
-- create-company did three unwrapped inserts from TypeScript: companies, then
-- company_invites, then admin_actions. There are no transactions from a
-- PostgREST client, so a failure on the second left a company with no invite,
-- and the edge function's own comment admitted it: "Company is created but
-- invite failed -- surface it; admin can retry the invite. Don't unwind the
-- company."
--
-- ============================ THE ROLE COLUMN ============================
--
-- company_invites.role was plain text with a default and NO constraint, while
-- claim_vouchers_for_new_profile casts it ci.role::team_role. A typo therefore
-- inserted cleanly and raised 22P02 invalid input value for enum team_role
-- LATER, inside the trigger, at somebody's signup -- aborting that whole
-- transaction and blocking that person's account creation. Days after the
-- typo, against a different actor, with nothing pointing back to the invite.
--
-- Section 1 moves that failure to the moment it is caused.
--
-- ============================ THE MISSING TRIGGER ========================
--
-- on_profile_created_claim_vouchers EXISTS ONLY IN THE LIVE DATABASE. It is in
-- no migration in this repo. 237_claim_credentials_on_signup.sql does
-- create or replace function without a matching create trigger, and nothing
-- else creates it either.
--
-- A fresh environment built from these migrations would have
-- claim_vouchers_for_new_profile() and NO trigger attached to it. Every claim
-- step -- vouchers, memberships, invite redemption, credential binding --
-- would silently never fire. Nothing would error; signups would simply
-- complete with none of it done. Same failure shape as the one this migration
-- fixes, one level up.
--
-- Confirmed live, 2026-08-24:
--   CREATE TRIGGER on_profile_created_claim_vouchers AFTER INSERT
--     ON public.profiles FOR EACH ROW
--     EXECUTE FUNCTION claim_vouchers_for_new_profile()
--   tgenabled = 'O'
--
-- The paired trigger on auth.users, on_auth_user_created -> handle_new_user(),
-- is in the same position: live, enabled, and not in any migration here.
--
-- THAT NEEDS ITS OWN MIGRATION. It is not folded into this one because a
-- create trigger recording something already live is a different claim from
-- the changes below, and writing it needs both triggers checked against every
-- environment, not just this project.
--
-- ============================ BOTH PATHS =================================
--
-- The trigger still handles invite-first. This function handles
-- profile-already-exists. Both insert team_members with
--   on conflict (company_id, user_id) do update set role = excluded.role
-- so whichever runs second upgrades the row rather than failing, and a
-- team_member who is later invited as staff is promoted rather than rejected.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. The role vocabulary, enforced where the value enters.
--    Matches the team_role enum exactly: 'team_admin', 'team_member'.
-- ---------------------------------------------------------------------------

alter table public.company_invites drop constraint if exists company_invites_role_vocab;
alter table public.company_invites
  add constraint company_invites_role_vocab
  check (role = any (array['team_admin'::text, 'team_member'::text]));

-- ---------------------------------------------------------------------------
-- 2. All four writes, atomically.
--
--    Shape follows public.issuer_webhook_upsert (236_webhook_url_guard.sql):
--    plpgsql, security definer, search_path pinned, p_-prefixed args, validate
--    and raise BEFORE any write, return the ids the caller needs.
--
--    p_actor follows integration_store_token (174_marketing_integrations.sql):
--    the edge function authenticates the caller and checks platform_admin,
--    then passes the resolved uid down. auth.uid() is null under service_role,
--    so this function cannot derive it and does not try.
--
--    Writing admin_actions from inside an RPC is new here -- no other callable
--    function does it. It is the only way the audit row is atomic with the
--    writes it describes.
--
--    Live body md5, CRs stripped: f387492a6954e3c86ee182a723ef54ba
-- ---------------------------------------------------------------------------

create or replace function public.create_company_with_admin(
  p_name text,
  p_admin_email text,
  p_actor uuid,
  p_invoice_ref text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name       text := btrim(p_name);
  v_email      text := lower(btrim(p_admin_email));
  v_invoice    text := nullif(btrim(coalesce(p_invoice_ref, '')), '');
  v_company_id uuid;
  v_invite_id  uuid;
  v_user_id    uuid;
  v_membership text;
begin
  -- Validate before any write. An exception here aborts the function's
  -- implicit transaction, so a bad address cannot leave an orphan company --
  -- which is exactly what the edge function's three unwrapped inserts did.
  if v_name = '' then
    raise exception 'company name is required';
  end if;
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'admin email is not a valid address';
  end if;
  if p_actor is null then
    raise exception 'actor is required';
  end if;

  insert into public.companies (name)
  values (v_name)
  returning id into v_company_id;

  insert into public.company_invites (company_id, email, role, invited_by, status)
  values (v_company_id, v_email, 'team_admin', p_actor, 'pending')
  returning id into v_invite_id;

  -- THE HALF THAT WAS MISSING.
  --
  -- Redemption used to happen only in on_profile_created_claim_vouchers, an
  -- AFTER INSERT trigger on profiles. That covers the invite-first path and
  -- ONLY that path: if the person already has an account, no profile insert
  -- will ever happen for them again, so the invite sits pending forever with
  -- no error anywhere.
  --
  -- "Already signed up" is the normal case, not the edge case. A trainer
  -- evaluates the material, decides it is good, and asks to become a partner.
  -- profiles.email is citext, so this match is case-insensitive.
  select id into v_user_id from public.profiles where email = v_email;

  if v_user_id is null then
    v_membership := 'pending';
  else
    insert into public.team_members (company_id, user_id, role, invited_by)
    values (v_company_id, v_user_id, 'team_admin'::public.team_role, p_actor)
    on conflict (company_id, user_id) do update set role = excluded.role;

    update public.company_invites
    set status = 'redeemed', redeemed_at = now(), redeemed_by = v_user_id
    where id = v_invite_id;

    v_membership := 'immediate';
  end if;

  -- Folded in rather than written by the edge function, which is new ground
  -- here: no other RPC writes admin_actions. It is the only way the audit row
  -- is atomic with the writes it describes. `membership` records which path
  -- ran, so "was this partner granted access or is it waiting on a signup" is
  -- answerable later from the audit log alone.
  insert into public.admin_actions
    (actor_user_id, action, target_type, target_id, reason, metadata)
  values (p_actor, 'create_company', 'company', v_company_id, null,
          jsonb_build_object(
            'company_name', v_name,
            'admin_email',  v_email,
            'invoice_ref',  v_invoice,
            'membership',   v_membership
          ));

  return jsonb_build_object(
    'company_id', v_company_id,
    'invite_id',  v_invite_id,
    'user_id',    v_user_id,
    'membership', v_membership
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Grants. Same pair as every other service-role RPC in this schema: the
--    browser roles never call this, only an edge function holding the service
--    key does. The revoke matters because execute defaults to PUBLIC.
-- ---------------------------------------------------------------------------

revoke all on function public.create_company_with_admin(text, text, uuid, text)
  from public, anon, authenticated;
grant execute on function public.create_company_with_admin(text, text, uuid, text)
  to service_role;

-- ---------------------------------------------------------------------------
-- 4. Backfill for the one invite already stranded.
--
--    Reconstructed from the resulting rows rather than copied from the editor
--    session, so treat section 5 as the authority on what actually landed.
--
--    Run as separate statements, which is why the two observed timestamps
--    differ by 17 seconds.
--
--    Scoped by id, NOT a blanket "redeem every pending invite whose email has
--    a profile". A pending invite whose address belongs to someone who never
--    accepted is not the same fact as an invite stranded by the bug, and the
--    other invite in this table -- on an .example.invalid address that can
--    never be signed up for -- must stay pending.
-- ---------------------------------------------------------------------------

insert into public.team_members (company_id, user_id, role, invited_by)
values ('8ac6f00a-9eb5-44ee-bce8-58fe9dac5949',
        '56f695bf-66c6-45de-9937-2a2e0b608c8f',
        'team_admin'::public.team_role,
        '9bec43f7-89b1-4195-bffc-0cecf4238dae')
on conflict (company_id, user_id) do update set role = excluded.role;

update public.company_invites
set status = 'redeemed', redeemed_at = now(),
    redeemed_by = '56f695bf-66c6-45de-9937-2a2e0b608c8f'
where id = 'a0933e8b-f598-4cd2-9877-52cbd37e3257' and status = 'pending';

-- ---------------------------------------------------------------------------
-- 5. Verification. Observed live 2026-08-24 after the above. Run separately.
--    Post-conditions name properties, not counts.
-- ---------------------------------------------------------------------------

-- -- The role CHECK exists and is validated.
-- select conname, pg_get_constraintdef(oid), convalidated
-- from pg_constraint
-- where conrelid = 'public.company_invites'::regclass and contype = 'c';
-- -- observed: company_invites_role_vocab,
-- --   CHECK ((role = ANY (ARRAY['team_admin'::text, 'team_member'::text]))), true

-- -- Only service_role may execute the function.
-- select has_function_privilege('anon',          'public.create_company_with_admin(text,text,uuid,text)', 'EXECUTE'),
--        has_function_privilege('authenticated', 'public.create_company_with_admin(text,text,uuid,text)', 'EXECUTE'),
--        has_function_privilege('service_role',  'public.create_company_with_admin(text,text,uuid,text)', 'EXECUTE');
-- -- observed: false, false, true
-- -- proacl: postgres=X/postgres service_role=X/postgres  (no PUBLIC =X entry)

-- -- The stranded invite is redeemed AND carries a membership.
-- select ci.id, ci.status, ci.redeemed_at, ci.redeemed_by,
--        (select count(*) from public.team_members tm
--          where tm.company_id = ci.company_id and tm.user_id = ci.redeemed_by)
-- from public.company_invites ci
-- where ci.id = 'a0933e8b-f598-4cd2-9877-52cbd37e3257';
-- -- observed: redeemed, 2026-08-24 05:16:36.076249+00,
-- --   56f695bf-66c6-45de-9937-2a2e0b608c8f, 1 membership row
-- -- membership row 097a4733-1ff9-4584-9827-f2ec8f5e508e, role team_admin,
-- --   joined_at 2026-08-24 05:16:19.889268+00,
-- --   company "Certidemy (partner view)" 8ac6f00a-9eb5-44ee-bce8-58fe9dac5949

-- -- The .example.invalid invite MUST still be pending -- it was never stranded
-- -- by the bug, it simply has no account and never will.
-- select id, email, status from public.company_invites
-- where id = 'f3f4419b-aeb9-4b6c-b13b-f9b616ba4986';
-- -- observed: pending

-- -- A typo'd role is now refused at insert instead of at somebody's signup.
-- -- MUST fail with 23514.
-- insert into public.company_invites (company_id, email, role, invited_by)
-- values ('8ac6f00a-9eb5-44ee-bce8-58fe9dac5949', 'x@example.com', 'admin',
--         '9bec43f7-89b1-4195-bffc-0cecf4238dae');
