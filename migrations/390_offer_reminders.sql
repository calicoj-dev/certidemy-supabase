-- 390_offer_reminders.sql
--
-- Stage 3 of confirm-before-signing: know who opened their link, and remind the
-- ones who have not answered. Reminders reuse the ORIGINAL personal link, read
-- from the offer.confirm email row (388 enqueued it with the link in its payload);
-- only the token's hash is stored on the offer, so this is the one place it lives.
--
-- NEW COLUMNS on credential_offers, writers grepped in both repos:
--   opened_at        functions/credential-offer (view, first time only)
--   reminders_sent   NOT NULL DEFAULT 0. Writers: create_credential_offers (388, takes
--                    the default), enqueue_offer_reminders and remind_credential_offer
--                    below. No other writer touches it.
--   last_reminded_at the same two functions below
--
-- Run each numbered block on its own in the SQL editor, in order. Block 12 is the
-- schedule and runs last, on its own (cron.schedule is not transactional).

-- ===================================================================== 1. columns
alter table public.credential_offers
  add column if not exists opened_at        timestamptz,
  add column if not exists reminders_sent   integer not null default 0,
  add column if not exists last_reminded_at timestamptz;

-- ===================================================================== 2. one reminder email, from the original
-- Enqueues reminder n for an offer still waiting, reusing the offer.confirm payload.
-- Returns false (and writes nothing) when there is nothing to remind or the
-- original email cannot be found; the address bounced; or the offer moved on.
create or replace function public.enqueue_offer_reminder(p_offer_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_offer   public.credential_offers%rowtype;
  v_orig    public.email_queue%rowtype;
  v_n       integer;
begin
  select * into v_offer from public.credential_offers where id = p_offer_id for update;
  if not found or v_offer.status <> 'sent' or v_offer.expires_at <= now() then
    return false;
  end if;

  select * into v_orig from public.email_queue where dedupe_key = 'offer-confirm:' || p_offer_id::text;
  if not found or v_orig.delivery_status in ('bounced', 'complained')
     or v_orig.status in ('suppressed', 'abandoned') then
    return false;
  end if;

  v_n := v_offer.reminders_sent + 1;
  perform public.enqueue_email(
    'offer.reminder',
    v_orig.to_email,
    v_orig.locale,
    v_orig.payload || jsonb_build_object('reminder', v_n),
    'offer-reminder:' || p_offer_id::text || ':' || v_n::text
  );
  update public.credential_offers
     set reminders_sent = v_n, last_reminded_at = now()
   where id = p_offer_id;
  return true;
end;
$function$;

-- ===================================================================== 3.
revoke all on function public.enqueue_offer_reminder(uuid) from public, anon, authenticated;

-- ===================================================================== 4.
grant execute on function public.enqueue_offer_reminder(uuid) to service_role;

-- ===================================================================== 5. the schedule's work: day 3, then day 7
create or replace function public.enqueue_offer_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_id    uuid;
  v_count integer := 0;
begin
  for v_id in
    select o.id
      from public.credential_offers o
     where o.status = 'sent'
       and o.expires_at > now()
       and (   (o.reminders_sent = 0 and o.created_at <= now() - interval '3 days')
            or (o.reminders_sent = 1 and o.created_at <= now() - interval '7 days'
                and coalesce(o.last_reminded_at, o.created_at) <= now() - interval '2 days'))
     limit 500
  loop
    if public.enqueue_offer_reminder(v_id) then
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end;
$function$;

-- ===================================================================== 6.
revoke all on function public.enqueue_offer_reminders() from public, anon, authenticated;

-- ===================================================================== 7.
grant execute on function public.enqueue_offer_reminders() to service_role;

-- ===================================================================== 8. the status board's numbers
-- One row per achievement with offers. Counted here, not by reading rows, so it is
-- never a 1,000-row floor. 'expired' is a sent offer past its date, as the list shows it.
create or replace function public.credential_offer_summary(p_issuer_id uuid)
returns table (
  o_achievement_id uuid,
  o_waiting        integer,
  o_opened         integer,
  o_needs_review   integer,
  o_confirmed      integer,
  o_declined       integer,
  o_expired        integer
)
language sql
stable
security definer
set search_path = public
as $function$
  select o.achievement_id,
         (count(*) filter (where o.status = 'sent' and o.expires_at > now()))::integer,
         (count(*) filter (where o.status = 'sent' and o.expires_at > now() and o.opened_at is not null))::integer,
         (count(*) filter (where o.status = 'change_requested'))::integer,
         (count(*) filter (where o.status = 'confirmed'))::integer,
         (count(*) filter (where o.status = 'declined'))::integer,
         (count(*) filter (where o.status = 'sent' and o.expires_at <= now()))::integer
    from public.credential_offers o
   where o.issuer_id = p_issuer_id
   group by o.achievement_id
$function$;

-- ===================================================================== 9.
revoke all on function public.credential_offer_summary(uuid) from public, anon, authenticated;

-- ===================================================================== 10.
grant execute on function public.credential_offer_summary(uuid) to service_role;

-- ===================================================================== 11. post-conditions
do $post$
declare
  v_bad text;
begin
  select string_agg(c, ', ') into v_bad
    from unnest(array['opened_at', 'reminders_sent', 'last_reminded_at']) c
   where not exists (
     select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'credential_offers' and column_name = c);
  if v_bad is not null then
    raise exception 'post: credential_offers missing %', v_bad;
  end if;

  select string_agg(r.rolname || ':' || f, ', ') into v_bad
    from pg_roles r
   cross join (values ('public.enqueue_offer_reminder(uuid)'), ('public.enqueue_offer_reminders()'), ('public.credential_offer_summary(uuid)')) fn(f)
   where r.rolname in ('anon', 'authenticated')
     and has_function_privilege(r.oid, f, 'EXECUTE');
  if v_bad is not null then
    raise exception 'post: client roles can call reminders: %', v_bad;
  end if;

  if not has_function_privilege('service_role', 'public.enqueue_offer_reminders()', 'EXECUTE') then
    raise exception 'post: service_role cannot run reminders';
  end if;

  -- Both directions: an unknown offer is refused, not reminded.
  if public.enqueue_offer_reminder(gen_random_uuid()) then
    raise exception 'post: an unknown offer was reminded';
  end if;

  raise notice 'post: 390 ok';
end
$post$;

-- ===================================================================== 12. SCHEDULE, run last and alone
-- Hourly at :17. Re-running replaces the job of the same name.
-- select cron.schedule('offer-reminders', '17 * * * *', $$select public.enqueue_offer_reminders()$$);
