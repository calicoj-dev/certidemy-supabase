-- 391_issuer_credential_counts.sql
--
-- The issuing page's "issued" figures read credentials rows with the caller's own
-- client. RLS on credentials admits only the holder and platform_admin, so a
-- partner's team_admin read ZERO rows, with no error, and saw "0 emitidas" for a
-- credential that exists. The read was also unpaged: a floor at 1,000 rows.
--
-- This counts instead of reading, and authorizes inside: platform_admin sees any
-- issuer, a team_admin only the issuer of a company they administer, everyone else
-- nothing. Partners get numbers, not access to the credentials table.
--
-- Run each numbered block on its own in the SQL editor, in order.

-- ===================================================================== 1.
create or replace function public.issuer_credential_counts(p_issuer_ids uuid[])
returns table (
  o_issuer_id      uuid,
  o_achievement_id uuid,
  o_issued         integer,
  o_specimens      integer
)
language sql
stable
security definer
set search_path = public
as $function$
  select c.issuer_id,
         c.achievement_id,
         (count(*) filter (where c.is_specimen is not true))::integer,
         (count(*) filter (where c.is_specimen))::integer
    from public.credentials c
   where c.issuer_id = any(p_issuer_ids)
     and (
       exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.platform_role = 'platform_admin')
       or exists (select 1 from public.issuers i
                    join public.team_members tm on tm.company_id = i.company_id
                   where i.id = c.issuer_id
                     and tm.user_id = auth.uid()
                     and tm.role = 'team_admin')
     )
   group by c.issuer_id, c.achievement_id
$function$;

-- ===================================================================== 2.
revoke all on function public.issuer_credential_counts(uuid[]) from public, anon;

-- ===================================================================== 3.
grant execute on function public.issuer_credential_counts(uuid[]) to authenticated, service_role;

-- ===================================================================== 4. post-conditions
do $post$
begin
  if has_function_privilege('anon', 'public.issuer_credential_counts(uuid[])', 'EXECUTE') then
    raise exception 'post: anon can call issuer_credential_counts';
  end if;
  if not has_function_privilege('authenticated', 'public.issuer_credential_counts(uuid[])', 'EXECUTE') then
    raise exception 'post: authenticated cannot call issuer_credential_counts';
  end if;
  -- No caller identity here (auth.uid() is null in the editor), so nothing may come back.
  if exists (select 1 from public.issuer_credential_counts(array(select id from public.issuers))) then
    raise exception 'post: counts returned without a caller';
  end if;
  raise notice 'post: 391 ok';
end
$post$;
