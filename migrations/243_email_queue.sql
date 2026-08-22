-- 243_email_queue.sql
--
-- Transactional email, queued. The delivery half is dispatch-emails.
--
-- ============================ WHY THIS MIRRORS 235 =======================
--
-- Same shape as webhook_deliveries on purpose: claim with SKIP LOCKED, one
-- attempt per run, backoff in complete_*, abandon after five. That pattern is
-- already proven here and already understood; a second dialect of the same
-- idea would be two things to reason about instead of one.
--
-- It reuses webhook_dispatch_secret() rather than minting a second Vault
-- secret. Same trust boundary -- pg_cron calling our own edge function -- so a
-- second secret would be a second thing to rotate and no additional isolation.
--
-- ============================ WHY A TABLE AND NOT pgmq ===================
--
-- Same reason 235 gave: this is also the record. Whether the holder was told,
-- when, and whether it arrived has to be answerable in a year, because for an
-- ISO/IEC 17024-aligned scheme notification is part of the audit trail, not a
-- convenience. A queue archives; this does not.
--
-- ============================ SUPPRESSION ================================
--
-- Enforced inside claim_email_sends, at the last possible moment before a
-- send -- NOT at enqueue. A row can sit queued for minutes while a hard bounce
-- for the same address arrives from a different message. Checking at enqueue
-- leaves exactly that window open.
--
-- On a platform that hosts credentials for partners the sending reputation is
-- SHARED. One partner's stale list must not be able to cost every other issuer
-- their deliverability.
--
-- ============================ DEDUPE =====================================
--
-- dedupe_key is unique and enqueue_email returns the EXISTING id on conflict.
-- A retried issuance therefore cannot mail a holder twice, and the caller
-- cannot tell the difference between the first call and the second, which is
-- what makes the retry safe to write.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).

begin;

-- ============================================================ 1. tables
create table if not exists public.email_queue (
  id                  uuid primary key default gen_random_uuid(),
  template_key        text not null,
  to_email            text not null,
  locale              text not null default 'en',
  payload             jsonb not null default '{}'::jsonb,
  dedupe_key          text unique,
  status              text not null default 'pending',
  attempts            integer not null default 0,
  next_retry_at       timestamptz,
  claimed_at          timestamptz,
  provider_message_id text,
  delivery_status     text,
  last_error          text,
  created_at          timestamptz not null default now(),
  sent_at             timestamptz,
  constraint email_queue_status_vocab
    check (status in ('pending','sending','sent','failed','abandoned','suppressed')),
  constraint email_queue_delivery_vocab
    check (delivery_status is null or delivery_status in ('delivered','bounced','complained')),
  constraint email_queue_locale_vocab
    check (locale in ('en','es-419','pt-BR'))
);

create table if not exists public.email_suppressions (
  email      text primary key,
  reason     text not null,
  source_id  uuid,
  created_at timestamptz not null default now(),
  constraint email_suppressions_reason_vocab
    check (reason in ('hard_bounce','complaint','manual'))
);

create index if not exists email_queue_due_idx
  on public.email_queue (next_retry_at, created_at) where status = 'pending';
create index if not exists email_queue_stuck_idx
  on public.email_queue (claimed_at) where status = 'sending';
create index if not exists email_queue_provider_idx
  on public.email_queue (provider_message_id) where provider_message_id is not null;

-- RLS on, no policies, and no table-level grant to the browser roles. The
-- missing grant is the real gate: the table-level grant is checked before RLS,
-- so a policy-less table that had been granted would still be readable. Only
-- service_role ever touches these.
alter table public.email_queue enable row level security;
alter table public.email_suppressions enable row level security;

commit;

-- ============================================================ 2. claim
create or replace function public.claim_email_sends(p_limit integer default 25)
returns table (
  send_id      uuid,
  template_key text,
  to_email     text,
  locale       text,
  payload      jsonb,
  attempts     integer
)
language plpgsql
security definer
set search_path = public
as $function$
begin
  -- A suppressed address is retired here, at the last possible moment. Doing
  -- this at enqueue leaves a window: a hard bounce from a DIFFERENT message can
  -- arrive while this row sits waiting, and we would still send to it.
  update public.email_queue q
  set status = 'suppressed', claimed_at = null, next_retry_at = null
  where q.status = 'pending'
    and coalesce(q.next_retry_at, now()) <= now()
    and exists (select 1 from public.email_suppressions s where s.email = q.to_email);

  return query
  with due as (
    select q.id
    from public.email_queue q
    where (q.status = 'pending' and coalesce(q.next_retry_at, now()) <= now())
       or (q.status = 'sending' and q.claimed_at < now() - interval '5 minutes')
    order by coalesce(q.next_retry_at, q.created_at)
    limit p_limit
    for update skip locked
  )
  update public.email_queue q
  set status = 'sending', claimed_at = now()
  from due
  where q.id = due.id
  returning q.id, q.template_key, q.to_email, q.locale, q.payload, q.attempts;
end;
$function$;

revoke all on function public.claim_email_sends(integer) from public, anon, authenticated;
grant execute on function public.claim_email_sends(integer) to service_role;

-- ============================================================ 3. complete
-- Backoff: 1m, 5m, 30m, 2h, 12h, then abandoned. Same ladder as 235.
create or replace function public.complete_email_send(
  p_send_id             uuid,
  p_ok                  boolean,
  p_provider_message_id text default null,
  p_error               text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_attempts integer;
  v_status   text;
  v_delay    interval;
begin
  select attempts + 1 into v_attempts from public.email_queue where id = p_send_id;
  if v_attempts is null then
    raise exception 'no email queue row %', p_send_id;
  end if;

  if p_ok then
    update public.email_queue
    set status = 'sent', attempts = v_attempts, provider_message_id = p_provider_message_id,
        last_error = null, next_retry_at = null, claimed_at = null, sent_at = now()
    where id = p_send_id;
    return 'sent';
  end if;

  v_delay := case v_attempts
    when 1 then interval '1 minute'
    when 2 then interval '5 minutes'
    when 3 then interval '30 minutes'
    when 4 then interval '2 hours'
    when 5 then interval '12 hours'
    else null
  end;
  v_status := case when v_delay is null then 'abandoned' else 'pending' end;

  update public.email_queue
  set status = v_status, attempts = v_attempts,
      last_error = left(coalesce(p_error, 'no response'), 2000),
      next_retry_at = case when v_delay is null then null else now() + v_delay end,
      claimed_at = null
  where id = p_send_id;

  return v_status;
end;
$function$;

revoke all on function public.complete_email_send(uuid, boolean, text, text) from public, anon, authenticated;
grant execute on function public.complete_email_send(uuid, boolean, text, text) to service_role;

-- ============================================================ 4. enqueue
create or replace function public.enqueue_email(
  p_template_key text,
  p_to_email     text,
  p_locale       text default 'en',
  p_payload      jsonb default '{}'::jsonb,
  p_dedupe_key   text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_email text := lower(btrim(p_to_email));
  v_id    uuid;
begin
  if v_email = '' or v_email not like '%@%' then
    raise exception 'enqueue_email: invalid address';
  end if;

  insert into public.email_queue (template_key, to_email, locale, payload, dedupe_key)
  values (p_template_key, v_email, p_locale, p_payload, p_dedupe_key)
  on conflict (dedupe_key) do nothing
  returning id into v_id;

  -- A duplicate is a no-op that returns the row already queued, so a retried
  -- issuance cannot mail the holder twice.
  if v_id is null and p_dedupe_key is not null then
    select id into v_id from public.email_queue where dedupe_key = p_dedupe_key;
  end if;

  return v_id;
end;
$function$;

revoke all on function public.enqueue_email(text, text, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.enqueue_email(text, text, text, jsonb, text) to service_role;

-- ============================================================ 5. provider events
-- Fed by the Resend webhook. Without this the platform sends blind, and the
-- audit answer to whether the holder was notified is a shrug.
create or replace function public.record_email_event(
  p_provider_message_id text,
  p_event               text
)
returns text
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_id    uuid;
  v_email text;
begin
  select id, to_email into v_id, v_email
  from public.email_queue
  where provider_message_id = p_provider_message_id;

  if v_id is null then
    return 'unknown';
  end if;

  update public.email_queue set delivery_status = p_event where id = v_id;

  -- One bad address must not be allowed to keep costing the sending domain its
  -- reputation, and on a partner platform that reputation is shared.
  if p_event in ('bounced','complained') then
    insert into public.email_suppressions (email, reason, source_id)
    values (v_email,
            case when p_event = 'bounced' then 'hard_bounce' else 'complaint' end,
            v_id)
    on conflict (email) do nothing;
  end if;

  return p_event;
end;
$function$;

revoke all on function public.record_email_event(text, text) from public, anon, authenticated;
grant execute on function public.record_email_event(text, text) to service_role;

-- ============================================================ 6. the schedule
-- RUN SEPARATELY, after dispatch-emails is deployed. cron.schedule is not
-- transactional, and a job pointing at a function that does not exist yet is a
-- minute-by-minute 404.
--
--   select cron.schedule(
--     'dispatch-emails',
--     '* * * * *',
--     $$
--     select net.http_post(
--       url     := 'https://pctynukndxnmnxiqpgck.supabase.co/functions/v1/dispatch-emails',
--       headers := jsonb_build_object(
--         'content-type', 'application/json',
--         'x-dispatch-key', public.webhook_dispatch_secret()
--       ),
--       body        := '{}'::jsonb,
--       timeout_milliseconds := 55000
--     );
--     $$
--   );
--
-- Verification (run separately, one at a time):
--
--   select * from public.claim_email_sends(5);
--   -- must NOT error; 0 rows when nothing is queued
--
--   select public.enqueue_email('test.key','A@B.com ','en','{}'::jsonb,'dedupe-1');
--   select public.enqueue_email('test.key','a@b.com', 'en','{}'::jsonb,'dedupe-1');
--   -- the SAME uuid twice, and to_email stored lowercased and trimmed
--
--   delete from public.email_queue where dedupe_key = 'dedupe-1';
