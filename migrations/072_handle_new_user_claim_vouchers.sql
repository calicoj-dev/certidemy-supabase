-- 072_handle_new_user_claim_vouchers.sql
-- Extend handle_new_user() to CLAIM pending vouchers at signup.
--
-- assign-voucher writes assigned_email with assigned_user_id NULL, intending it
-- to be "bound at signup by the claim trigger" (per its own comment) -- but that
-- claim was never built. This adds it: when a new auth user is created, back-fill
-- assigned_user_id on every not-yet-claimed voucher whose assigned_email matches
-- the new user's email (case-insensitive). Covers the invite-first -> sign-up-later
-- B2B flow. The already-registered-user ordering is handled separately in the
-- assign-voucher edge function (resolve-on-assign).
--
-- The claim runs best-effort inside an exception block: a voucher-update failure
-- must NEVER abort profile creation / signup. Function stays SECURITY DEFINER so
-- it writes vouchers past RLS. Current profile-insert body is preserved verbatim.
create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  -- Claim any pending vouchers assigned to this email (best-effort; never blocks signup).
  begin
    update public.vouchers
       set assigned_user_id = new.id,
           updated_at       = now()
     where assigned_user_id is null
       and status in ('assigned', 'redeemed', 'available')
       and lower(assigned_email) = lower(new.email);
  exception when others then
    raise warning 'handle_new_user: voucher claim failed for % : %', new.email, sqlerrm;
  end;

  return new;
end$function$;
