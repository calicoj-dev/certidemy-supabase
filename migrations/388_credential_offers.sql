-- 388_credential_offers.sql
--
-- Confirm-before-signing for partner credentials. An OFFER is a credential that
-- has not been minted yet: the recipient checks the name the partner typed, and
-- only a confirmation mints -- through _shared/issue.ts, idempotency key
-- "offer:<id>", so a double-click cannot mint twice. No credentials column is
-- added, so the five-insert rule (CLAUDE.md s10) is not engaged.
--
-- WRITERS of credential_offers, both repos grepped for from("credential_offers"):
--   functions/manage-credential-offers  create (via the RPC below), review, cancel
--   functions/credential-offer          recipient: request_name, decline, confirm (RPC)
--   certidemy-web                       none; it calls the two functions
--
-- Run each numbered block on its own in the SQL editor, in order.

-- ===================================================================== 1. table
create table if not exists public.credential_offers (
  id               uuid primary key default gen_random_uuid(),
  issuer_id        uuid not null references public.issuers(id),
  achievement_id   uuid not null references public.achievements(id),
  recipient_email  citext not null,
  name_sent        text not null,
  name_requested   text,
  request_note     text,
  name_final       text,
  status           text not null default 'sent',
  decline_reason   text,
  token_hash       text not null,
  locale           text not null default 'en',
  awarded_on       date,
  auto_minor_fixes boolean not null default true,
  credential_id    uuid references public.credentials(id),
  created_by       uuid not null,
  created_at       timestamptz not null default now(),
  responded_at     timestamptz,
  expires_at       timestamptz not null default (now() + interval '30 days'),
  constraint credential_offers_status_chk
    check (status in ('sent', 'change_requested', 'confirmed', 'declined', 'cancelled')),
  constraint credential_offers_decline_chk
    check (decline_reason is null
           or decline_reason in ('not_attended', 'other_session', 'not_my_email')),
  constraint credential_offers_locale_chk
    check (locale in ('en', 'es-419', 'pt-BR')),
  constraint credential_offers_names_chk
    check (char_length(name_sent) between 1 and 120
           and (name_requested is null or char_length(name_requested) between 1 and 120)
           and (name_final is null or char_length(name_final) between 1 and 120)),
  constraint credential_offers_note_chk
    check (request_note is null or char_length(request_note) <= 300),
  constraint credential_offers_confirmed_chk
    check ((status = 'confirmed') = (credential_id is not null)),
  constraint credential_offers_token_hash_key unique (token_hash)
);

-- ===================================================================== 2. indexes
-- One OPEN offer per person per achievement; a declined or confirmed one does not block a new one.
create unique index if not exists credential_offers_open_unique
  on public.credential_offers (achievement_id, recipient_email)
  where status in ('sent', 'change_requested');

-- ===================================================================== 3.
create index if not exists credential_offers_issuer_idx
  on public.credential_offers (issuer_id, achievement_id, created_at desc);

-- ===================================================================== 4. closed to clients
-- RLS on with no policies plus no grants: only service_role (the two functions) reads or writes.
alter table public.credential_offers enable row level security;

-- ===================================================================== 5.
revoke all on public.credential_offers from public, anon, authenticated;

-- ===================================================================== 6. create + enqueue, atomically
-- The raw token never reaches this table; only its sha256. The confirm URL carrying it
-- goes into the email payload, which is the one place the recipient needs it.
create or replace function public.create_credential_offers(
  p_issuer_id      uuid,
  p_achievement_id uuid,
  p_created_by     uuid,
  p_locale         text,
  p_awarded_on     date,
  p_auto_minor     boolean,
  p_rows           jsonb
)
returns table (o_offer_id uuid, o_email text)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_issuer text;
  v_ach    text;
  v_row    jsonb;
  v_id     uuid;
begin
  select i.name into v_issuer from public.issuers i where i.id = p_issuer_id;
  select a.name into v_ach
    from public.achievements a
   where a.id = p_achievement_id and a.issuer_id = p_issuer_id and a.status = 'active';
  if v_issuer is null or v_ach is null then
    raise exception 'create_credential_offers: issuer or active achievement not found';
  end if;

  for v_row in select * from jsonb_array_elements(p_rows) loop
    insert into public.credential_offers
      (issuer_id, achievement_id, recipient_email, name_sent, token_hash,
       locale, awarded_on, auto_minor_fixes, created_by)
    values
      (p_issuer_id, p_achievement_id, v_row->>'email', v_row->>'name', v_row->>'token_hash',
       p_locale, p_awarded_on, coalesce(p_auto_minor, true), p_created_by)
    returning id into v_id;

    perform public.enqueue_email(
      'offer.confirm',
      v_row->>'email',
      p_locale,
      jsonb_build_object(
        'issuer_name',      v_issuer,
        'achievement_name', v_ach,
        'recipient_name',   v_row->>'name',
        'confirm_url',      v_row->>'confirm_url',
        'awarded_on',       p_awarded_on
      ),
      'offer-confirm:' || v_id::text
    );

    o_offer_id := v_id;
    o_email := v_row->>'email';
    return next;
  end loop;
end;
$function$;

-- ===================================================================== 7.
revoke all on function public.create_credential_offers(uuid, uuid, uuid, text, date, boolean, jsonb)
  from public, anon, authenticated;

-- ===================================================================== 8.
grant execute on function public.create_credential_offers(uuid, uuid, uuid, text, date, boolean, jsonb)
  to service_role;

-- ===================================================================== 9. confirm + issuance email
-- Called AFTER issueCredential minted. Idempotent: the same (offer, credential) twice is a no-op,
-- and the email dedupes on the credential id.
create or replace function public.confirm_credential_offer(
  p_offer_id      uuid,
  p_credential_id uuid,
  p_final_name    text
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_off    public.credential_offers%rowtype;
  v_code   text;
  v_issuer text;
  v_ach    text;
begin
  update public.credential_offers
     set status = 'confirmed', credential_id = p_credential_id,
         name_final = p_final_name, responded_at = now()
   where id = p_offer_id and status in ('sent', 'change_requested')
  returning * into v_off;

  if not found then
    if exists (select 1 from public.credential_offers
                where id = p_offer_id and credential_id = p_credential_id) then
      return;
    end if;
    raise exception 'confirm_credential_offer: offer is not open';
  end if;

  select c.credential_code into v_code
    from public.credentials c
   where c.id = p_credential_id and c.achievement_id = v_off.achievement_id;
  if v_code is null then
    raise exception 'confirm_credential_offer: credential does not belong to this offer';
  end if;

  select i.name into v_issuer from public.issuers i where i.id = v_off.issuer_id;
  select a.name into v_ach from public.achievements a where a.id = v_off.achievement_id;

  perform public.enqueue_email(
    'issuance.credential',
    v_off.recipient_email::text,
    v_off.locale,
    jsonb_build_object(
      'issuer_name',      v_issuer,
      'achievement_name', v_ach,
      'credential_code',  v_code,
      'verify_url',       'https://certidemy.com/' || v_off.locale || '/verify/' || v_code
    ),
    'issuance:' || p_credential_id::text
  );
end;
$function$;

-- ===================================================================== 10.
revoke all on function public.confirm_credential_offer(uuid, uuid, text)
  from public, anon, authenticated;

-- ===================================================================== 11.
grant execute on function public.confirm_credential_offer(uuid, uuid, text) to service_role;

-- ===================================================================== 12. post-conditions
-- Both directions: the table and functions exist AND no client role can reach them.
do $$
declare v_bad text;
begin
  if to_regclass('public.credential_offers') is null then
    raise exception 'post: credential_offers missing';
  end if;
  select string_agg(r, ', ') into v_bad
    from unnest(array['anon', 'authenticated']) r
   where has_table_privilege(r, 'public.credential_offers', 'select')
      or has_table_privilege(r, 'public.credential_offers', 'insert')
      or has_function_privilege(r, 'public.create_credential_offers(uuid, uuid, uuid, text, date, boolean, jsonb)', 'execute')
      or has_function_privilege(r, 'public.confirm_credential_offer(uuid, uuid, text)', 'execute');
  if v_bad is not null then
    raise exception 'post: client roles can reach offers: %', v_bad;
  end if;
  if not has_function_privilege('service_role', 'public.create_credential_offers(uuid, uuid, uuid, text, date, boolean, jsonb)', 'execute') then
    raise exception 'post: service_role cannot create offers';
  end if;
  raise notice 'post: 388 ok';
end $$;
