-- 392_claim_my_credentials.sql
--
-- Credentials issued to an email were bound to an account ONLY at signup
-- (237: step 4 of claim_vouchers_for_new_profile). Anyone who already had an
-- account when a partner issued to them never saw it: known issue 9.
--
-- This lets a signed-in person claim for THEMSELVES, any time: the dashboard
-- calls it on load. The email comes from auth.users, never from the caller, and
-- only once that address is CONFIRMED (a magic link or a signup confirmation
-- proves the person holds the inbox). It reuses claim_credentials (231), so the
-- one UPDATE stays in one place; claiming does not touch the signed document.
--
-- Run each numbered block on its own in the SQL editor, in order.

-- ===================================================================== 1.
create or replace function public.claim_my_credentials()
returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_email     text;
  v_confirmed timestamptz;
begin
  if auth.uid() is null then
    return 0;
  end if;
  select u.email, u.email_confirmed_at into v_email, v_confirmed
    from auth.users u
   where u.id = auth.uid();
  if v_email is null or v_confirmed is null then
    return 0;
  end if;
  return public.claim_credentials(auth.uid(), v_email::citext);
end;
$function$;

-- ===================================================================== 2.
revoke all on function public.claim_my_credentials() from public, anon;

-- ===================================================================== 3.
grant execute on function public.claim_my_credentials() to authenticated;

-- ===================================================================== 4. post-conditions
do $post$
begin
  if has_function_privilege('anon', 'public.claim_my_credentials()', 'EXECUTE') then
    raise exception 'post: anon can call claim_my_credentials';
  end if;
  if not has_function_privilege('authenticated', 'public.claim_my_credentials()', 'EXECUTE') then
    raise exception 'post: authenticated cannot call claim_my_credentials';
  end if;
  -- The editor has no caller: nothing may be claimed.
  if public.claim_my_credentials() <> 0 then
    raise exception 'post: claimed without a caller';
  end if;
  raise notice 'post: 392 ok';
end
$post$;
